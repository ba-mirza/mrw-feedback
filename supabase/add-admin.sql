insert into public.admins (user_id, name)
select id, 'Имя Фамилия'
from auth.users
where email = 'admin@example.com'
on conflict (user_id) do update set name = excluded.name;
