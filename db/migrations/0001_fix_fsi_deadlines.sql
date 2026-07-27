-- =====================================================================
-- ДИВА — миграция 0001: приведение fsi_deadlines к актуальной схеме.
--
-- Проблема: в dev-БД (а также в проде из дампа 2026-07-11) таблица
-- fsi_deadlines имеет старую Strapi-структуру: integer id, varchar(255),
-- document_id, locale, published_at, created_by_id, updated_by_id.
-- Актуальная schema.ts ожидает: uuid id, text, tz timestamps, url.
--
-- Дропаем старую таблицу (она пустая — 0 строк) и создаём заново.
-- Если в вашей БД есть данные, переносите их перед применением.
-- =====================================================================

DROP TABLE IF EXISTS fsi_deadlines CASCADE;

CREATE TABLE fsi_deadlines (
    id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    title         text        NOT NULL,
    description   text,
    deadline_date timestamptz NOT NULL,
    grant_type    text        NOT NULL DEFAULT 'Старт',
    stage         text,
    url           text,
    created_at    timestamptz NOT NULL DEFAULT now(),
    updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_fsi_deadlines_deadline_date ON fsi_deadlines USING btree (deadline_date);
CREATE INDEX IF NOT EXISTS idx_fsi_deadlines_grant_type    ON fsi_deadlines USING btree (grant_type);

-- В drizzle.__drizzle_migrations INSERT не делаем: эта миграция не в journal,
-- она применяется ручным psql-скриптом отдельно. Если вы применяете её через
-- drizzle-kit migrate — добавьте её в meta/_journal.json самостоятельно.
