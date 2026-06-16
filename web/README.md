# diva-web

Next.js сайт ДИВА: лендинг бухгалтерии для стартапов и грантополучателей ФСИ.

## Локальный запуск

```bash
npm install
npm run dev
```

Открыть http://localhost:3000.

Для отправки заявок нужен `DATABASE_URL` в `.env.local`; без него `/api/leads` вернёт 503.

## Проверки

```bash
npm run lint
npm run build
```

## Основные маршруты

- `/` — главная страница.
- `/announcements` — объявления.
- `/api/leads` — прием заявок с формы консультации.
- `/dev` — технический preview токенов, закрыт от индексации.
