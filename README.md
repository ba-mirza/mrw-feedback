# feedback-service

Опрос покупателей MARWIN после покупки. На кассе висит распечатанный QR,
покупатель сканирует его и на своём телефоне отвечает на три вопроса. В админке
заводятся кассы, печатаются QR и смотрится статистика ответов.

К сайту marwin.kz сервис не относится.

```
frontend/   React + Vite: опрос (/s/:code) и админка (Mantine)
supabase/   схема БД, RPC и права (Postgres в Supabase)
```

Своего бэкенда нет: данные, вход админов и бизнес-правила живут в Supabase.
Прежний бэк на FastAPI остался в истории ветки `feature/feedback-service`.

## Опрос

1. «Довольны ли вы работой консультанта?» — зелёная / красная звезда (`green` / `red`)
2. «Вы нашли всё, что искали?» — `all` / `alternative` / `partial` / `none`
3. «Порекомендуете MARWIN друзьям и близким?» — `yes` / `no`

Правила (в `start_survey_session` / `save_survey_answer`):

- выключенная или несуществующая касса → `point_not_found`;
- с того же устройства на той же кассе повторно пройти можно через 12 часов
  (`already_completed`). Устройство — случайный id в localStorage, без него —
  IP + User-Agent;
- незаконченный опрос продолжается 30 минут, потом начинается новый;
- период в статистике считается по Asia/Almaty.

## Supabase

1. SQL Editor → вставить `supabase/migrations/20261123000000_init.sql` → Run.
2. Authentication → Sign In / Providers: Email включён, «Allow new users to sign up» выключен.
3. Authentication → Users → Add user (Auto Confirm User).
4. Сделать пользователя админом: `supabase/add-admin.sql` с его e-mail и именем → Run.
   Без записи в `admins` вход проходит, но админка показывает «Нет доступа».

Анонимный ключ видит только две функции опроса. Таблицы закрыты RLS: читать и
править кассы и смотреть статистику могут только пользователи из `admins`.
Удаления касс нет: выключенная касса сохраняет историю ответов.

## Запуск

```bash
cd frontend
cp .env.example .env              # VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY
npm install
npm run dev                       # http://localhost:5175
npm run lint && npm run build
```

Docker: `.env` с теми же переменными в корне репо, затем
`docker compose up --build` (nginx отдаёт собранный фронт на :5175).
Переменные вшиваются при сборке: после их смены образ нужно пересобрать.
