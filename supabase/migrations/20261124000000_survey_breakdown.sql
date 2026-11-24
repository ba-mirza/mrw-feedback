create function public.survey_breakdown(
  p_group text,
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
  if p_group is null or p_group not in ('store', 'point', 'day') then
    raise exception 'invalid_group';
  end if;
  if p_date_from is not null and p_date_to is not null and p_date_from > p_date_to then
    raise exception 'invalid_period';
  end if;

  with sessions as (
    select s.id, s.status, p.id as point_id, p.region, p.store, p.register_number,
      (s.started_at at time zone v_zone)::date as day
    from public.survey_sessions s
    join public.points p on p.id = s.point_id
    where (p_date_from is null or s.started_at >= p_date_from::timestamp at time zone v_zone)
      and (p_date_to is null or s.started_at < (p_date_to + 1)::timestamp at time zone v_zone)
      and (p_region is null or p.region = p_region)
      and (p_store is null or p.store = p_store)
      and (p_point_id is null or p.id = p_point_id)
  ),
  keyed as (
    select s.*,
      case p_group
        when 'store' then s.region || chr(31) || s.store
        when 'point' then s.point_id::text
        else s.day::text
      end as group_key
    from sessions s
  ),
  groups as (
    select group_key,
      min(region) as region,
      min(store) as store,
      min(register_number) as register_number,
      min(point_id) as point_id,
      min(day) as day,
      count(*)::int as sessions,
      (count(*) filter (where status = 'completed'))::int as completed
    from keyed
    group by group_key
  ),
  counts as (
    select k.group_key, a.question, a.option, count(*)::int as hits
    from keyed k
    join public.survey_answers a on a.session_id = k.id
    group by k.group_key, a.question, a.option
  ),
  by_question as (
    select group_key, question, jsonb_object_agg(option, hits) as options
    from counts
    group by group_key, question
  ),
  answers as (
    select group_key, jsonb_object_agg(question, options) as answers
    from by_question
    group by group_key
  )
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'key', g.group_key,
        'region', case when p_group in ('store', 'point') then g.region end,
        'store', case when p_group in ('store', 'point') then g.store end,
        'register_number', case when p_group = 'point' then g.register_number end,
        'point_id', case when p_group = 'point' then g.point_id end,
        'day', case when p_group = 'day' then g.day end,
        'sessions', g.sessions,
        'completed', g.completed,
        'answers', coalesce(a.answers, '{}'::jsonb)
      )
      order by g.group_key
    ),
    '[]'::jsonb
  )
  into v_result
  from groups g
  left join answers a on a.group_key = g.group_key;

  return v_result;
end;
$$;

revoke execute on function public.survey_breakdown(text, date, date, text, text, bigint) from public, anon;
grant execute on function public.survey_breakdown(text, date, date, text, text, bigint) to authenticated;
