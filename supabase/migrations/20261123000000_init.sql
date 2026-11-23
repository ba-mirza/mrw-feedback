create table public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  name text not null default '',
  created_at timestamptz not null default now()
);

create table public.points (
  id bigint generated always as identity primary key,
  code text not null unique default substr(replace(gen_random_uuid()::text, '-', ''), 1, 12),
  region text not null check (length(btrim(region)) between 1 and 120),
  store text not null check (length(btrim(store)) between 1 and 255),
  register_number text not null check (length(btrim(register_number)) between 1 and 64),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint points_store_register_key unique (store, register_number)
);

create table public.survey_sessions (
  id uuid primary key default gen_random_uuid(),
  point_id bigint not null references public.points (id) on delete restrict,
  status text not null default 'incomplete' check (status in ('incomplete', 'completed')),
  device_hash text not null,
  user_agent text not null default '',
  started_at timestamptz not null default now(),
  finished_at timestamptz
);

create index survey_sessions_started_at_idx on public.survey_sessions (started_at);
create index survey_sessions_point_device_idx on public.survey_sessions (point_id, device_hash, started_at desc);

create table public.survey_answers (
  id bigint generated always as identity primary key,
  session_id uuid not null references public.survey_sessions (id) on delete cascade,
  question text not null,
  option text not null,
  answered_at timestamptz not null default now(),
  constraint survey_answers_session_question_key unique (session_id, question)
);

create function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger points_touch_updated_at
before update on public.points
for each row execute function public.touch_updated_at();

create function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

create function public.survey_question_options()
returns jsonb
language sql
immutable
set search_path = ''
as $$
  select '[
    {"question": "consultant", "options": ["green", "red"]},
    {"question": "availability", "options": ["all", "alternative", "partial", "none"]},
    {"question": "nps", "options": ["yes", "no"]}
  ]'::jsonb;
$$;

create function public.survey_session_json(p_session_id uuid)
returns jsonb
language sql
stable
set search_path = ''
as $$
  select jsonb_build_object(
    'id', s.id,
    'status', s.status,
    'point', jsonb_build_object('store', p.store),
    'answers', coalesce(
      (select jsonb_object_agg(a.question, a.option) from public.survey_answers a where a.session_id = s.id),
      '{}'::jsonb
    )
  )
  from public.survey_sessions s
  join public.points p on p.id = s.point_id
  where s.id = p_session_id;
$$;

create function public.start_survey_session(p_code text, p_device_id text default null)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_headers json := coalesce(nullif(current_setting('request.headers', true), ''), '{}')::json;
  v_user_agent text := left(coalesce(v_headers ->> 'user-agent', ''), 512);
  v_ip text := btrim(split_part(coalesce(v_headers ->> 'x-forwarded-for', ''), ',', 1));
  v_device text;
  v_device_hash text;
  v_point public.points;
  v_session_id uuid;
begin
  select * into v_point from public.points where code = lower(btrim(p_code));
  if v_point.id is null or not v_point.is_active then
    raise exception 'point_not_found';
  end if;

  v_device := case
    when p_device_id is not null and length(p_device_id) between 8 and 64 then 'device:' || p_device_id
    else 'client:' || v_ip || '|' || v_user_agent
  end;
  v_device_hash := encode(sha256(convert_to(v_device, 'UTF8')), 'hex');

  if exists (
    select 1 from public.survey_sessions
    where point_id = v_point.id
      and device_hash = v_device_hash
      and status = 'completed'
      and started_at >= now() - interval '12 hours'
  ) then
    raise exception 'already_completed';
  end if;

  select id into v_session_id
  from public.survey_sessions
  where point_id = v_point.id
    and device_hash = v_device_hash
    and status = 'incomplete'
    and started_at >= now() - interval '30 minutes'
  order by started_at desc
  limit 1;

  if v_session_id is null then
    insert into public.survey_sessions (point_id, device_hash, user_agent)
    values (v_point.id, v_device_hash, v_user_agent)
    returning id into v_session_id;
  end if;

  return public.survey_session_json(v_session_id);
end;
$$;

create function public.save_survey_answer(p_session_id uuid, p_question text, p_option text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_session public.survey_sessions;
  v_options jsonb;
begin
  select * into v_session from public.survey_sessions where id = p_session_id for update;
  if v_session.id is null then
    raise exception 'session_not_found';
  end if;
  if v_session.status = 'completed' then
    raise exception 'already_completed';
  end if;
  if v_session.started_at < now() - interval '30 minutes' then
    raise exception 'session_expired';
  end if;

  select item -> 'options' into v_options
  from jsonb_array_elements(public.survey_question_options()) item
  where item ->> 'question' = p_question;
  if v_options is null or not v_options ? p_option then
    raise exception 'invalid_option';
  end if;

  insert into public.survey_answers (session_id, question, option)
  values (p_session_id, p_question, p_option)
  on conflict (session_id, question) do nothing;
  if not found then
    raise exception 'already_answered';
  end if;

  if (select count(*) from public.survey_answers where session_id = p_session_id)
     = jsonb_array_length(public.survey_question_options()) then
    update public.survey_sessions set status = 'completed', finished_at = now() where id = p_session_id;
  end if;

  return public.survey_session_json(p_session_id);
end;
$$;

create function public.survey_stats(
  p_date_from date default null,
  p_date_to date default null,
  p_region text default null,
  p_store text default null,
  p_point_id bigint default null
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_zone constant text := 'Asia/Almaty';
  v_result jsonb;
begin
  if not public.is_admin() then
    raise exception 'forbidden';
  end if;
  if p_date_from is not null and p_date_to is not null and p_date_from > p_date_to then
    raise exception 'invalid_period';
  end if;

  with sessions as (
    select s.id, s.status
    from public.survey_sessions s
    join public.points p on p.id = s.point_id
    where (p_date_from is null or s.started_at >= p_date_from::timestamp at time zone v_zone)
      and (p_date_to is null or s.started_at < (p_date_to + 1)::timestamp at time zone v_zone)
      and (p_region is null or p.region = p_region)
      and (p_store is null or p.store = p_store)
      and (p_point_id is null or p.id = p_point_id)
  ),
  counts as (
    select a.question, a.option, count(*)::int as hits
    from public.survey_answers a
    join sessions s on s.id = a.session_id
    group by a.question, a.option
  ),
  catalog as (
    select q.idx as question_order, q.item ->> 'question' as question, o.idx as option_order, o.option
    from jsonb_array_elements(public.survey_question_options()) with ordinality q(item, idx)
    cross join lateral jsonb_array_elements_text(q.item -> 'options') with ordinality o(option, idx)
  ),
  options as (
    select c.question_order, c.question, c.option_order, c.option, coalesce(n.hits, 0) as hits,
      sum(coalesce(n.hits, 0)) over (partition by c.question)::int as total
    from catalog c
    left join counts n on n.question = c.question and n.option = c.option
  ),
  questions as (
    select question_order, question, max(total) as total,
      jsonb_agg(
        jsonb_build_object(
          'option', option,
          'count', hits,
          'rate', case when total > 0 then round(hits::numeric / total, 4) end
        )
        order by option_order
      ) as options
    from options
    group by question_order, question
  )
  select jsonb_build_object(
    'sessions', (select count(*) from sessions),
    'completed_sessions', (select count(*) from sessions where status = 'completed'),
    'questions', coalesce(
      (select jsonb_agg(jsonb_build_object('question', question, 'total', total, 'options', options) order by question_order) from questions),
      '[]'::jsonb
    )
  ) into v_result;

  return v_result;
end;
$$;

alter table public.admins enable row level security;
alter table public.points enable row level security;
alter table public.survey_sessions enable row level security;
alter table public.survey_answers enable row level security;

create policy admins_select_self on public.admins
for select to authenticated
using (user_id = auth.uid());

create policy points_select_admin on public.points
for select to authenticated
using (public.is_admin());

create policy points_insert_admin on public.points
for insert to authenticated
with check (public.is_admin());

create policy points_update_admin on public.points
for update to authenticated
using (public.is_admin())
with check (public.is_admin());

revoke all on public.admins, public.points, public.survey_sessions, public.survey_answers from anon, authenticated;
grant select on public.admins to authenticated;
grant select, insert (region, store, register_number, is_active), update (region, store, register_number, is_active) on public.points to authenticated;

revoke execute on all functions in schema public from public, anon, authenticated;
grant execute on function public.start_survey_session(text, text) to anon, authenticated;
grant execute on function public.save_survey_answer(uuid, text, text) to anon, authenticated;
grant execute on function public.survey_stats(date, date, text, text, bigint) to authenticated;
grant execute on function public.is_admin() to authenticated;
