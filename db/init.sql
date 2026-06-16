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
CREATE INDEX IF NOT EXISTS idx_clients_lead_id
    ON clients (lead_id);
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

-- =====================================================================
-- admin_users — пользователи админ-панели
-- =====================================================================
CREATE TABLE IF NOT EXISTS admin_users (
    id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    email           text        NOT NULL UNIQUE,
    password_hash   text        NOT NULL,
    name            text        NOT NULL,
    role            text        NOT NULL DEFAULT 'editor',
    created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users (email);

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
    photo_url       text,
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
