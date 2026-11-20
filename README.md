# feedback-service

Опрос покупателей MARWIN после покупки. На кассе висит распечатанный QR,
покупатель сканирует его и на своём телефоне отвечает на три вопроса. В админке
заводятся кассы, печатаются QR и смотрится статистика ответов.

К сайту marwin.kz сервис не относится.

```
backend/    FastAPI + PostgreSQL + Alembic
frontend/   React + Vite: опрос (/s/:code) и админка (Mantine)
```

## Опрос

1. «Довольны ли вы работой консультанта?» — зелёная / красная звезда (`green` / `red`)
2. «Вы нашли всё, что искали?» — `all` / `alternative` / `partial` / `none`
3. «Порекомендуете MARWIN друзьям и близким?» — `yes` / `no`

Каждый ответ сохраняется сразу. Сессия, в которой ответили не на все вопросы,
остаётся `incomplete`.

К ответу привязаны касса (магазин, регион, номер кассы) и время.
Сотрудника и смену из печатного QR не узнать. Конверсию «доля покупок с ответом»
посчитать тоже нельзя: данных о чеках у сервиса нет.

**Повторы.** Браузер хранит случайный `device_id` в localStorage. Если хранилище
недоступно, вместо него берётся связка IP + User-Agent. С одного устройства на одной
кассе опрос можно пройти раз в `REPEAT_WINDOW_HOURS` часов. Незаконченный опрос
открывается с того же места, если вернуться в течение `SESSION_RESUME_MINUTES` минут.
Кто очистит хранилище браузера, сможет ответить ещё раз. Для MVP это допустимо.

## Запуск локально

Всё целиком в Docker:

```bash
docker compose up --build
docker compose exec backend python -m app.cli create-admin --email you@marwin.kz --name "Имя"
```

Админка — http://localhost:5175, опрос — по ссылке из QR.

Без Docker:

```bash
cd backend
python3.12 -m venv .venv && .venv/bin/pip install -r requirements-dev.txt
cp .env.example .env              # DATABASE_URL=sqlite:///./feedback.db тоже подойдёт
.venv/bin/alembic upgrade head
.venv/bin/python -m app.cli create-admin --email you@marwin.kz --name "Имя"
.venv/bin/uvicorn app.main:app --reload --port 8000
.venv/bin/pytest

cd ../frontend
cp .env.example .env              # VITE_API_ORIGIN — адрес бэка для dev-прокси
npm install
npm run dev                       # http://localhost:5175
npm run lint && npm run build
```

## Прод

- `ENVIRONMENT=production`: без случайного `SECRET_KEY` (32+ символа) и
  PostgreSQL приложение не запустится, `/docs` выключены.
- `SURVEY_BASE_URL` — публичный адрес фронта. Из него собирается ссылка в QR:
  `<SURVEY_BASE_URL>/s/<code>`. Если адрес сменится после печати, старые QR
  перестанут работать.
- Миграции применяются при старте контейнера бэка (`alembic upgrade head`).
- Uvicorn запущен с `--proxy-headers`. Перед ним должен стоять прокси, который
  ставит `X-Forwarded-For` (см. `frontend/nginx.conf`).
- Бэк считает дни и часы в `TIMEZONE` (по умолчанию `Asia/Almaty`).

## API

Публичное (опрос):

| Метод | Путь | |
|---|---|---|
| POST | `/v1/survey/sessions` | `{code, device_id?}` → сессия: новая или незаконченная |
| POST | `/v1/survey/sessions/{id}/answers` | `{question, option}` |

Админка (`Authorization: Bearer <token>`):

| Метод | Путь | |
|---|---|---|
| POST | `/v1/auth/login` | `{email, password}` → `{access_token, expires_in}` |
| GET | `/v1/admin/me` | профиль |
| GET/POST | `/v1/admin/points` | список / создание кассы |
| GET/PUT | `/v1/admin/points/{id}` | касса / изменение (код QR не меняется) |
| GET | `/v1/admin/points/{id}/qr?format=svg\|png` | QR для печати |
| GET | `/v1/admin/stats/questions` | по каждому вопросу: сколько раз выбрали каждый вариант и какая это доля |

Фильтры статистики (все необязательные): `region`, `store`, `point_id`,
`date_from`, `date_to` — локальные даты, включительно. Без дат — за всё время.

Ошибки приходят как `{code, message}`, ошибки валидации — как `[{field, message}]`.
