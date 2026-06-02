# diva-db

Схема БД проекта ДИВА.

## Назначение

Единая схема PostgreSQL, разделяемая между приложениями `web/` (Next.js API
routes) и `bot/` (Telegram-бот). `init.sql` — источник правды на SQL-уровне,
`schema.ts` — те же таблицы в виде Drizzle ORM-определений для TypeScript.

## Запуск локально

```bash
docker compose up postgres   # из ops/
```

## Подключение

```
postgres://diva:diva@localhost:5432/diva
```

(пароль и имена для локальной разработки — см. `.env.example`).

## Как добавить таблицу

1. Правка `init.sql` (DDL + COMMENT ON TABLE + индексы).
2. Правка `db/schema.ts` (Drizzle-определение, точно соответствующее SQL).
3. Миграция:
   - На этапе разработки — пересоздаём БД (`docker compose down -v && up`),
     чтобы `init.sql` отработал с нуля.
   - В prod — через `drizzle-kit generate` (миграции попадают в `migrations/`)
     и последующий `drizzle-kit migrate`.

## Бэкап

Будет настроен на этапе фазы F.
