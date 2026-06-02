-- =====================================================================
-- ДИВА — инициализация PostgreSQL
-- Скрипт выполняется один раз при первом старте контейнера через
-- /docker-entrypoint-initdb.d/. Идемпотентен — повторный запуск безопасен.
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- =====================================================================
-- leads — заявки с форм сайта (контакт, обратный звонок, лид-магниты)
-- =====================================================================
CREATE TABLE IF NOT EXISTS leads (
    id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    name        text        NOT NULL,
    contact     text        NOT NULL,
    source      text,
    page        text,
    utm         jsonb       NOT NULL DEFAULT '{}'::jsonb,
    status      text        NOT NULL DEFAULT 'new'
                CHECK (status IN ('new', 'in_progress', 'spam', 'converted', 'lost')),
    notes       text,
    created_at  timestamptz NOT NULL DEFAULT now(),
    updated_at  timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE leads IS 'Заявки с форм сайта: контактные формы, обратный звонок, лид-магниты.';

-- =====================================================================
-- subscribers — подписчики рассылки (email и/или Telegram)
-- =====================================================================
CREATE TABLE IF NOT EXISTS subscribers (
    id                 uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    email              text        UNIQUE,
    telegram_username  text        UNIQUE,
    source             text,
    subscribed_at      timestamptz DEFAULT now(),
    unsubscribed_at    timestamptz
);

COMMENT ON TABLE subscribers IS 'Подписчики рассылки: email и/или Telegram-аккаунты.';

-- =====================================================================
-- calculator_logs — журнал использования онлайн-калькулятора стоимости
-- =====================================================================
CREATE TABLE IF NOT EXISTS calculator_logs (
    id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    inputs        jsonb       NOT NULL,
    result_price  integer,
    lead_id       uuid        REFERENCES leads(id) ON DELETE SET NULL,
    created_at    timestamptz DEFAULT now()
);

COMMENT ON TABLE calculator_logs IS 'Лог использования калькулятора стоимости: входные параметры, результат, связь с лидом.';

-- =====================================================================
-- fsi_deadline_subscriptions — подписки на дедлайны грантов ФСИ
-- (управляются Telegram-ботом)
-- =====================================================================
CREATE TABLE IF NOT EXISTS fsi_deadline_subscriptions (
    id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    telegram_chat_id  bigint      NOT NULL,
    grant_type        text,
    created_at        timestamptz DEFAULT now(),
    UNIQUE (telegram_chat_id, grant_type)
);

COMMENT ON TABLE fsi_deadline_subscriptions IS 'Подписки пользователей Telegram-бота на уведомления о дедлайнах грантов ФСИ.';

-- =====================================================================
-- Индексы
-- =====================================================================
CREATE INDEX IF NOT EXISTS idx_leads_created_at
    ON leads (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_status
    ON leads (status);
CREATE INDEX IF NOT EXISTS idx_subscribers_email
    ON subscribers (email);
CREATE INDEX IF NOT EXISTS idx_calculator_logs_created_at
    ON calculator_logs (created_at DESC);

-- =====================================================================
-- Функция и триггер: автоматическое обновление leads.updated_at
-- =====================================================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS leads_set_updated_at ON leads;
CREATE TRIGGER leads_set_updated_at
    BEFORE UPDATE ON leads
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();
