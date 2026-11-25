begin;

truncate public.survey_answers, public.survey_sessions, public.points restart identity;

insert into public.points (region, store, register_number) values
  ('Актау', 'MARWIN ТРЦ SAYA Park', '1'),
  ('Актобе', 'MARWIN KeruenCity Aktobe', '1'),
  ('Алматы', 'Grand МЕЛОМАН-MARWIN на Гоголя', '1'),
  ('Алматы', 'MARWIN Молл Апорт', '1'),
  ('Алматы', 'MARWIN ТРЦ Dostyk Plaza', '1'),
  ('Алматы', 'MARWIN ТРЦ MEGA Alma-Ata', '1'),
  ('Алматы', 'MARWIN ТРЦ MEGA Park', '1'),
  ('Алматы', 'MARWIN ТРЦ АДК', '1'),
  ('Алматы', 'MARWIN ТЦ Москва', '1'),
  ('Алматы', 'Меломан ТРЦ Esentai Mall', '1'),
  ('Астана', 'MARWIN ТРЦ Green Mall', '1'),
  ('Астана', 'MARWIN ТРЦ MEGA SilkWay', '1'),
  ('Астана', 'MARWIN ТРЦ Керуен Астана', '1'),
  ('Астана', 'MARWIN ТРЦ Сары Арка', '1'),
  ('Астана', 'MARWIN ТРЦ Хан Шатыр', '1'),
  ('Астана', 'МЕЛОМАН ТРЦ KeruenCity', '1'),
  ('Астана', 'Меломан Проспект Республики', '1'),
  ('Атырау', 'MARWIN ТРЦ BAIZAAR', '1'),
  ('Караганды', 'MARWIN ТРЦ CITY MALL', '1'),
  ('Кокшетау', 'MARWIN Кокшетау РИО', '1'),
  ('Костанай', 'MARWIN на Аль-Фараби', '1'),
  ('Павлодар', 'MARWIN на Сатпаева', '1'),
  ('Петропавловск', 'MARWIN в Dostyq Mall', '1'),
  ('Семей', 'MARWIN Семей Момышулы', '1'),
  ('Семей', 'Pana Семей', '1'),
  ('Тараз', 'MARWIN Тараз MART', '1'),
  ('Уральск', 'MARWIN УРЛ Сити Центр', '1'),
  ('Усть-Каменогорск', 'MARWIN УК АДК River', '1'),
  ('Шымкент', 'MARWIN ШМТ МегаЦентр', '1');

commit;
