# Manual SQL-миграции (не для `drizzle-kit migrate`)

Эти `.sql` файлы написаны руками и **не зарегистрированы в `db/migrations/meta/_journal.json`**.
Они выполняются отдельно, вручную или через `init.sql`-обёртку.

Причина: drizzle-kit генерирует snapshot для каждой миграции и записывает
её в journal; без snapshot он не сможет отследить состояние БД.

## Как применять

```bash
# один файл
docker exec -i diva-pg-dev psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" \
  < db/manual-migrations/0001_fix_fsi_deadlines.sql

# все по очереди
for f in db/manual-migrations/*.sql; do
  echo "Applying $f"
  docker exec -i diva-pg-dev psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" < "$f"
done
```

Если миграция должна стать «родной» для drizzle — перенесите её обратно
в `db/migrations/`, выполните `drizzle-kit generate --custom --name=<slug>`
и добавьте snapshot в `meta/`. Но для hot-fix правок Strapi-наследия это
избыточно.

## Список

| Файл | Что делает |
|---|---|
| `0001_fix_fsi_deadlines.sql` | Дропает старую Strapi-таблицу `fsi_deadlines` (integer id, document_id, locale, published_at, …) и пересоздаёт под актуальную `schema.ts` (uuid, timestamptz, url). |
| `0004_announcements_image.sql` | `ALTER TABLE announcements ADD COLUMN image_url text NULL` — чтобы карточки на `/announcements` могли иметь обложку, загружаемую через `/api/upload` в admin. |