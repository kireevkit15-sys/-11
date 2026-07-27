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
    utm         jsonb       DEFAULT '{}'::jsonb,
    status      text        NOT NULL DEFAULT 'new'
                CHECK (status IN ('new', 'in_progress', 'interaction_scheduled', 'spam', 'converted', 'lost')),
    notes       text,
    interaction_at timestamptz,
    notified    boolean     NOT NULL DEFAULT false,
    created_at  timestamptz NOT NULL DEFAULT now(),
    updated_at  timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE leads IS 'Заявки с форм сайта: контактные формы, обратный звонок, лид-магниты.';

CREATE TABLE IF NOT EXISTS lead_notes (
    id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id     uuid        NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    text        text        NOT NULL,
    author      text        NOT NULL,
    created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS reminders (
    id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id     uuid        NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    chat_id     text        NOT NULL,
    message_id  integer     NOT NULL,
    fire_at     timestamptz NOT NULL,
    sent        boolean     NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS clients (
    id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id          uuid        NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    tags             jsonb       NOT NULL DEFAULT '[]'::jsonb,
    notes            text        NOT NULL DEFAULT '',
    next_contact_at  timestamptz,
    created_at       timestamptz NOT NULL DEFAULT now()
);

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
CREATE INDEX IF NOT EXISTS idx_leads_notified
    ON leads (notified);
CREATE INDEX IF NOT EXISTS idx_lead_notes_lead_id
    ON lead_notes (lead_id);
CREATE INDEX IF NOT EXISTS idx_reminders_fire_at
    ON reminders (fire_at)
    WHERE sent = false;
CREATE INDEX IF NOT EXISTS idx_reminders_lead_id
    ON reminders (lead_id);
CREATE INDEX IF NOT EXISTS idx_clients_lead_id
    ON clients (lead_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_clients_lead_id_unique
    ON clients (lead_id);
CREATE INDEX IF NOT EXISTS idx_subscribers_email
    ON subscribers (email);
CREATE INDEX IF NOT EXISTS idx_calculator_logs_created_at
    ON calculator_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_calculator_logs_lead_id
    ON calculator_logs (lead_id);

-- Constraint: subscribers должна содержать email или telegram_username.
ALTER TABLE subscribers
    DROP CONSTRAINT IF EXISTS subscribers_at_least_one_chk;
ALTER TABLE subscribers
    ADD CONSTRAINT subscribers_at_least_one_chk
    CHECK (email IS NOT NULL OR telegram_username IS NOT NULL);

-- Email приводится к lowercase на уровне БД — это исключает дубликаты
-- вида Foo@bar.com vs foo@bar.com при сравнении text.
CREATE OR REPLACE FUNCTION normalize_subscriber_email()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.email IS NOT NULL THEN
        NEW.email = lower(NEW.email);
    END IF;
    IF NEW.telegram_username IS NOT NULL THEN
        NEW.telegram_username = lower(NEW.telegram_username);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS subscribers_normalize ON subscribers;
CREATE TRIGGER subscribers_normalize
    BEFORE INSERT OR UPDATE ON subscribers
    FOR EACH ROW EXECUTE FUNCTION normalize_subscriber_email();

-- Constraint: reviews.rating в диапазоне 1..5.
ALTER TABLE reviews
    DROP CONSTRAINT IF EXISTS reviews_rating_range_chk;
ALTER TABLE reviews
    ADD CONSTRAINT reviews_rating_range_chk
    CHECK (rating BETWEEN 1 AND 5);

-- Constraint: leads.status — enum.
ALTER TABLE leads
    DROP CONSTRAINT IF EXISTS leads_status_chk;
ALTER TABLE leads
    ADD CONSTRAINT leads_status_chk
    CHECK (status IN ('new','in_progress','interaction_scheduled','spam','converted','lost'));

-- Constraint: audit_logs payload не больше 64KB.
ALTER TABLE audit_logs
    DROP CONSTRAINT IF EXISTS audit_logs_payload_size_chk;
ALTER TABLE audit_logs
    ADD CONSTRAINT audit_logs_payload_size_chk
    CHECK (payload IS NULL OR octet_length(payload::text) < 65536);

-- Index для поиска по audit_logs.entity_id
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_id
    ON audit_logs (entity_id);

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

-- =====================================================================
-- admin_users — пользователи админ-панели
-- =====================================================================
CREATE TABLE IF NOT EXISTS admin_users (
    id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    email           text        NOT NULL UNIQUE,
    password_hash   text        NOT NULL,
    name            text        NOT NULL,
    role            text        NOT NULL DEFAULT 'editor',
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now(),
    require_password_change boolean NOT NULL DEFAULT true,
    session_epoch   integer     NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users (email);

DROP TRIGGER IF EXISTS admin_users_set_updated_at ON admin_users;
CREATE TRIGGER admin_users_set_updated_at
    BEFORE UPDATE ON admin_users
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();

-- Guard-функция: запретить понижение единственного админа.
CREATE OR REPLACE FUNCTION guard_last_admin()
RETURNS TRIGGER AS $$
DECLARE
    admin_count int;
BEGIN
    IF OLD.role = 'admin' AND (NEW.role IS DISTINCT FROM 'admin') THEN
        SELECT count(*) INTO admin_count
        FROM admin_users
        WHERE role = 'admin' AND id <> OLD.id;
        IF admin_count = 0 THEN
            RAISE EXCEPTION 'Cannot demote the last admin';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS admin_users_guard_last_admin ON admin_users;
CREATE TRIGGER admin_users_guard_last_admin
    BEFORE UPDATE ON admin_users
    FOR EACH ROW
    EXECUTE FUNCTION guard_last_admin();

-- =====================================================================
-- login_attempts — счётчик неудачных попыток входа (rate-limit)
--
-- Схема: одна строка на ключ (email|ip). Счётчик failure_count
-- инкрементируется атомарно через UPSERT, окно — first_failure_at.
-- blocked_until выставляется при превышении MAX_FAILURES.
-- =====================================================================
CREATE TABLE IF NOT EXISTS login_attempts (
    key              text         PRIMARY KEY,
    failure_count    integer      NOT NULL DEFAULT 0,
    first_failure_at timestamptz  NOT NULL DEFAULT now(),
    blocked_until    timestamptz
);

CREATE INDEX IF NOT EXISTS idx_login_attempts_blocked_until
  ON login_attempts (blocked_until) WHERE blocked_until IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_login_attempts_first_failure_at
  ON login_attempts (first_failure_at);

-- Автоматическая очистка устаревших записей.
CREATE OR REPLACE FUNCTION cleanup_login_attempts()
RETURNS integer AS $$
DECLARE
    deleted_count integer;
BEGIN
    DELETE FROM login_attempts
    WHERE first_failure_at < now() - INTERVAL '1 hour'
      AND (blocked_until IS NULL OR blocked_until < now());
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================================
-- services — бухгалтерские услуги
-- =====================================================================
CREATE TABLE IF NOT EXISTS services (
    id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    title           text        NOT NULL,
    slug            text        NOT NULL UNIQUE,
    tax_system      text        NOT NULL DEFAULT 'УСН-Д',
    base_price      integer,
    includes        jsonb       NOT NULL DEFAULT '[]'::jsonb,
    target_audience text,
    is_highlighted  boolean     NOT NULL DEFAULT false,
    key             text,
    sort_order      integer     NOT NULL DEFAULT 0,
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_services_slug ON services (slug);
CREATE INDEX IF NOT EXISTS idx_services_sort_order ON services (sort_order);

-- =====================================================================
-- faqs — вопросы-ответы
-- =====================================================================
CREATE TABLE IF NOT EXISTS faqs (
    id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    question        text        NOT NULL,
    answer          text        NOT NULL,
    category        text        NOT NULL DEFAULT 'Бухгалтерия',
    sort_order      integer     NOT NULL DEFAULT 0,
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_faqs_category ON faqs (category);
CREATE INDEX IF NOT EXISTS idx_faqs_sort_order ON faqs (sort_order);

-- =====================================================================
-- team_members — команда
-- =====================================================================
CREATE TABLE IF NOT EXISTS team_members (
    id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name           text        NOT NULL,
    position            text        NOT NULL,
    photo_url           text,
    bio                 text,
    education           text,
    years_experience    integer,
    specialization      text,
    quote               text,
    sort_order          integer     NOT NULL DEFAULT 0,
    is_founder          boolean     NOT NULL DEFAULT false,
    created_at          timestamptz NOT NULL DEFAULT now(),
    updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_team_members_sort_order ON team_members (sort_order);

-- =====================================================================
-- case_studies — кейсы клиентов
-- =====================================================================
CREATE TABLE IF NOT EXISTS case_studies (
    id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    title           text        NOT NULL,
    slug            text        NOT NULL UNIQUE,
    client_name     text,
    client_logo_url text,
    tags            jsonb       NOT NULL DEFAULT '[]'::jsonb,
    task            text,
    solution        text,
    result          text,
    quote           text,
    quote_author    text,
    period          text,
    sort_order      integer     NOT NULL DEFAULT 0,
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_case_studies_slug ON case_studies (slug);
CREATE INDEX IF NOT EXISTS idx_case_studies_sort_order ON case_studies (sort_order);

-- =====================================================================
-- reviews — отзывы
-- =====================================================================
CREATE TABLE IF NOT EXISTS reviews (
    id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    author_name     text        NOT NULL,
    author_project  text,
    text            text        NOT NULL,
    source          text        NOT NULL DEFAULT 'Email',
    source_url      text,
    rating          integer     NOT NULL DEFAULT 5,
    sort_order      integer     NOT NULL DEFAULT 0,
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reviews_sort_order ON reviews (sort_order);

-- =====================================================================
-- articles — статьи блога
-- =====================================================================
CREATE TABLE IF NOT EXISTS articles (
    id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    title               text        NOT NULL,
    slug                text        NOT NULL UNIQUE,
    excerpt             text,
    body                text,
    cover_url           text,
    category            text        NOT NULL DEFAULT 'Прочее',
    reading_minutes     integer     NOT NULL DEFAULT 5,
    seo_title           text,
    seo_description     text,
    sort_order          integer     NOT NULL DEFAULT 0,
    created_at          timestamptz NOT NULL DEFAULT now(),
    updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_articles_slug ON articles (slug);
CREATE INDEX IF NOT EXISTS idx_articles_category ON articles (category);
CREATE INDEX IF NOT EXISTS idx_articles_sort_order ON articles (sort_order);

-- =====================================================================
-- videos — видео
-- =====================================================================
CREATE TABLE IF NOT EXISTS videos (
    id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    title           text        NOT NULL,
    video_id        text        NOT NULL,
    platform        text        NOT NULL DEFAULT 'youtube',
    description     text,
    views           integer     NOT NULL DEFAULT 0,
    duration        text,
    thumbnail_url   text,
    sort_order      integer     NOT NULL DEFAULT 0,
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_videos_sort_order ON videos (sort_order);

-- =====================================================================
-- site_statistics — статистика сайта
-- =====================================================================
CREATE TABLE IF NOT EXISTS site_statistics (
    id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    key             text        NOT NULL UNIQUE,
    value           integer     NOT NULL,
    suffix          text,
    label           text        NOT NULL,
    caption         text,
    sort_order      integer     NOT NULL DEFAULT 0,
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_site_statistics_key ON site_statistics (key);
CREATE INDEX IF NOT EXISTS idx_site_statistics_sort_order ON site_statistics (sort_order);

-- =====================================================================
-- district_stats — статистика по округам
-- =====================================================================
CREATE TABLE IF NOT EXISTS district_stats (
    id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    code            text        NOT NULL UNIQUE,
    short_name      text        NOT NULL,
    name            text        NOT NULL,
    capital         text,
    clients         integer     NOT NULL DEFAULT 0,
    color           text,
    sort_order      integer     NOT NULL DEFAULT 0,
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_district_stats_code ON district_stats (code);
CREATE INDEX IF NOT EXISTS idx_district_stats_sort_order ON district_stats (sort_order);

-- =====================================================================
-- navigation_items — пункты меню
-- =====================================================================
CREATE TABLE IF NOT EXISTS navigation_items (
    id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    label           text        NOT NULL,
    href            text        NOT NULL,
    type            text        NOT NULL DEFAULT 'nav',
    icon            text,
    description     text,
    sort_order      integer     NOT NULL DEFAULT 0,
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_navigation_items_type ON navigation_items (type);
CREATE INDEX IF NOT EXISTS idx_navigation_items_sort_order ON navigation_items (sort_order);

-- =====================================================================
-- social_links — социальные сети
-- =====================================================================
CREATE TABLE IF NOT EXISTS social_links (
    id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    platform        text        NOT NULL,
    label           text        NOT NULL,
    href            text        NOT NULL,
    action_text     text,
    icon_color      text,
    sort_order      integer     NOT NULL DEFAULT 0,
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_social_links_sort_order ON social_links (sort_order);

-- =====================================================================
-- trust_pillars — столпы доверия
-- =====================================================================
CREATE TABLE IF NOT EXISTS trust_pillars (
    id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    number          text        NOT NULL,
    title           text        NOT NULL,
    content         text,
    quote           text,
    hue             integer     NOT NULL DEFAULT 270,
    sort_order      integer     NOT NULL DEFAULT 0,
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_trust_pillars_sort_order ON trust_pillars (sort_order);

-- =====================================================================
-- fsi_deadlines — дедлайны грантов ФСИ
-- =====================================================================
CREATE TABLE IF NOT EXISTS fsi_deadlines (
    id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    title           text        NOT NULL,
    description     text,
    deadline_date   timestamptz NOT NULL,
    grant_type      text        NOT NULL DEFAULT 'Старт',
    stage           text,
    url             text,
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_fsi_deadlines_deadline_date ON fsi_deadlines (deadline_date);
CREATE INDEX IF NOT EXISTS idx_fsi_deadlines_grant_type ON fsi_deadlines (grant_type);

-- =====================================================================
-- glossary_terms — термины глоссария
-- =====================================================================
CREATE TABLE IF NOT EXISTS glossary_terms (
    id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    term            text        NOT NULL,
    definition      text        NOT NULL,
    category        text,
    sort_order      integer     NOT NULL DEFAULT 0,
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_glossary_terms_term ON glossary_terms (term);
CREATE INDEX IF NOT EXISTS idx_glossary_terms_sort_order ON glossary_terms (sort_order);

-- =====================================================================
-- announcements — объявления
-- =====================================================================
CREATE TABLE IF NOT EXISTS announcements (
    id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    title           text        NOT NULL,
    content         text        NOT NULL,
    key             text        NOT NULL UNIQUE,
    category        text        NOT NULL DEFAULT 'Общее',
    badge           text        NOT NULL DEFAULT 'team',
    hue             integer     NOT NULL DEFAULT 200,
    available       boolean     NOT NULL DEFAULT true,
    featured        boolean     NOT NULL DEFAULT false,
    sort_order      integer     NOT NULL DEFAULT 0,
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_announcements_key ON announcements (key);
CREATE INDEX IF NOT EXISTS idx_announcements_sort_order ON announcements (sort_order);

-- =====================================================================
-- partners — команды и партнёры
-- =====================================================================
CREATE TABLE IF NOT EXISTS partners (
    id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    name            text        NOT NULL,
    role            text        NOT NULL,
    company         text,
    bio             text,
    logo_url        text,        -- логотип партнёра (компании). Раньше было photo_url — путало с фото людей.
    skills          jsonb       NOT NULL DEFAULT '[]'::jsonb,
    github_link     text,
    portfolio_link  text,
    vk_link         text,
    telegram_link   text,
    contact         text,
    badge           text        NOT NULL DEFAULT 'team',
    hue             integer     NOT NULL DEFAULT 240,
    available       boolean     NOT NULL DEFAULT true,
    featured        boolean     NOT NULL DEFAULT false,
    category        text        NOT NULL DEFAULT 'fullstack',
    sort_order      integer     NOT NULL DEFAULT 0,
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_partners_category ON partners (category);
CREATE INDEX IF NOT EXISTS idx_partners_sort_order ON partners (sort_order);

-- =====================================================================
-- Триггеры для updated_at контентных таблиц
-- =====================================================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER services_set_updated_at BEFORE UPDATE ON services FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER faqs_set_updated_at BEFORE UPDATE ON faqs FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER team_members_set_updated_at BEFORE UPDATE ON team_members FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER case_studies_set_updated_at BEFORE UPDATE ON case_studies FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER reviews_set_updated_at BEFORE UPDATE ON reviews FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER articles_set_updated_at BEFORE UPDATE ON articles FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER videos_set_updated_at BEFORE UPDATE ON videos FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER site_statistics_set_updated_at BEFORE UPDATE ON site_statistics FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER district_stats_set_updated_at BEFORE UPDATE ON district_stats FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER navigation_items_set_updated_at BEFORE UPDATE ON navigation_items FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER social_links_set_updated_at BEFORE UPDATE ON social_links FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trust_pillars_set_updated_at BEFORE UPDATE ON trust_pillars FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER fsi_deadlines_set_updated_at BEFORE UPDATE ON fsi_deadlines FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER glossary_terms_set_updated_at BEFORE UPDATE ON glossary_terms FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER announcements_set_updated_at BEFORE UPDATE ON announcements FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER partners_set_updated_at BEFORE UPDATE ON partners FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- =====================================================================
-- audit_logs — журнал действий админов (создан через init, не только через миграции)
-- =====================================================================
CREATE TABLE IF NOT EXISTS audit_logs (
    id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     uuid        REFERENCES admin_users(id) ON DELETE SET NULL,
    action      text        NOT NULL,
    entity      text        NOT NULL,
    entity_id   text,
    payload     jsonb,
    ip          text,
    user_agent  text,
    created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs (user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs (action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs (entity);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_id ON audit_logs (entity_id);

-- =====================================================================
-- frontend_sections — управляемые секции фронтенда
-- =====================================================================
CREATE TABLE IF NOT EXISTS frontend_sections (
    id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    key         text        NOT NULL UNIQUE,
    name        text        NOT NULL,
    description text,
    page        text        NOT NULL DEFAULT 'home',
    is_enabled  boolean     NOT NULL DEFAULT true,
    sort_order  integer     NOT NULL DEFAULT 0,
    config      jsonb       NOT NULL DEFAULT '{}'::jsonb,
    updated_by  uuid        REFERENCES admin_users(id) ON DELETE SET NULL,
    created_at  timestamptz NOT NULL DEFAULT now(),
    updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_frontend_sections_page ON frontend_sections (page);
CREATE INDEX IF NOT EXISTS idx_frontend_sections_sort_order ON frontend_sections (sort_order);

DROP TRIGGER IF EXISTS frontend_sections_set_updated_at ON frontend_sections;
CREATE TRIGGER frontend_sections_set_updated_at
    BEFORE UPDATE ON frontend_sections
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- =====================================================================
-- site_settings — глобальные настройки сайта
-- =====================================================================
CREATE TABLE IF NOT EXISTS site_settings (
    id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    key         text        NOT NULL UNIQUE,
    value       jsonb       NOT NULL,
    description text,
    updated_by  uuid        REFERENCES admin_users(id) ON DELETE SET NULL,
    created_at  timestamptz NOT NULL DEFAULT now(),
    updated_at  timestamptz NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS site_settings_set_updated_at ON site_settings;
CREATE TRIGGER site_settings_set_updated_at
    BEFORE UPDATE ON site_settings
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- =====================================================================
-- page_versions — версии страниц с автоинкрементом version
-- =====================================================================
CREATE TABLE IF NOT EXISTS page_versions (
    id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    page_key     text        NOT NULL,
    version      integer     NOT NULL,
    config       jsonb       NOT NULL DEFAULT '{}'::jsonb,
    is_published boolean     NOT NULL DEFAULT false,
    published_at timestamptz,
    created_by   uuid        REFERENCES admin_users(id) ON DELETE SET NULL,
    created_at   timestamptz NOT NULL DEFAULT now(),
    UNIQUE (page_key, version)
);

CREATE INDEX IF NOT EXISTS idx_page_versions_page_key ON page_versions (page_key);
CREATE INDEX IF NOT EXISTS idx_page_versions_version ON page_versions (version);
CREATE INDEX IF NOT EXISTS idx_page_versions_is_published ON page_versions (is_published);

-- Триггер: автоинкремент version для конкретной страницы.
CREATE OR REPLACE FUNCTION set_next_version()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.version IS NULL OR NEW.version = 0 THEN
        SELECT COALESCE(MAX(version), 0) + 1 INTO NEW.version
        FROM page_versions WHERE page_key = NEW.page_key;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS page_versions_set_version ON page_versions;
CREATE TRIGGER page_versions_set_version
    BEFORE INSERT ON page_versions
    FOR EACH ROW EXECUTE FUNCTION set_next_version();

-- Триггер: гарантирует ровно одну опубликованную версию на страницу.
CREATE OR REPLACE FUNCTION ensure_one_published_version()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_published = true THEN
        UPDATE page_versions
        SET is_published = false
        WHERE page_key = NEW.page_key AND id <> NEW.id AND is_published = true;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS page_versions_ensure_one_published ON page_versions;
CREATE TRIGGER page_versions_ensure_one_published
    AFTER INSERT OR UPDATE OF is_published ON page_versions
    FOR EACH ROW EXECUTE FUNCTION ensure_one_published_version();

-- =====================================================================
-- hero_configs / footer_configs / announcement_messages (singletons, serial PK)
--
-- Структура отражает db/schema.ts (Drizzle) и используется в CMS UI дива-админки.
-- =========================================================================
CREATE TABLE IF NOT EXISTS hero_configs (
    id           serial      PRIMARY KEY,
    key          varchar(50) DEFAULT 'main',
    headline     text,
    subheadline  text,
    cta_text     varchar(100),
    badges       jsonb       NOT NULL DEFAULT '[]'::jsonb,
    stat_number  varchar(50),
    stat_label   varchar(100),
    created_at   timestamptz NOT NULL DEFAULT now(),
    updated_at   timestamptz NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS hero_configs_set_updated_at ON hero_configs;
CREATE TRIGGER hero_configs_set_updated_at
    BEFORE UPDATE ON hero_configs FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS footer_configs (
    id            serial      PRIMARY KEY,
    key           varchar(50) DEFAULT 'main',
    email         varchar(255),
    phones        jsonb       NOT NULL DEFAULT '[]'::jsonb,
    address       text,
    legal_info    text,
    work_hours    varchar(100),
    nav_columns   jsonb       NOT NULL DEFAULT '[]'::jsonb,
    social_links  jsonb       NOT NULL DEFAULT '[]'::jsonb,
    copyright     varchar(255),
    created_at    timestamptz NOT NULL DEFAULT now(),
    updated_at    timestamptz NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS footer_configs_set_updated_at ON footer_configs;
CREATE TRIGGER footer_configs_set_updated_at
    BEFORE UPDATE ON footer_configs FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS announcement_messages (
    id            serial      PRIMARY KEY,
    key           varchar(50),
    message       text,
    cta_text      varchar(100),
    href          varchar(255),
    badge         varchar(50),
    hue           integer     DEFAULT 200,
    available     boolean     DEFAULT true,
    sort_order    integer     DEFAULT 0,
    created_at    timestamptz NOT NULL DEFAULT now(),
    updated_at    timestamptz NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS announcement_messages_set_updated_at ON announcement_messages;
CREATE TRIGGER announcement_messages_set_updated_at
    BEFORE UPDATE ON announcement_messages FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- =====================================================================
-- login_attempts cleanup (cron-like). Реальный cron — внешний (pg_cron / systemd timer).
-- =====================================================================
-- Заглушка: cleanup_login_attempts() уже создан выше; используется через psql/cron.
