# feedback-service

Опрос покупателей MARWIN после покупки. На кассе висит распечатанный QR,
покупатель сканирует его и на своём телефоне отвечает на три вопроса. В админке
заводятся кассы, печатаются QR и смотрится статистика ответов.

К сайту marwin.kz сервис не относится.

```
frontend/   React + Vite: опрос (/s/:code) и админка (Mantine)
```

Бэкенд переезжает на Supabase. Прежний бэк на FastAPI остался в истории ветки
`feature/feedback-service`. Пока Supabase не подключён, фронт к данным не ходит.

## Опрос

1. «Довольны ли вы работой консультанта?» — зелёная / красная звезда (`green` / `red`)
2. «Вы нашли всё, что искали?» — `all` / `alternative` / `partial` / `none`
3. «Порекомендуете MARWIN друзьям и близким?» — `yes` / `no`

## Запуск

```bash
cd frontend
npm install
npm run dev                       # http://localhost:5175
npm run lint && npm run build
```

Или в Docker: `docker compose up --build` (nginx отдаёт собранный фронт на :5175).
