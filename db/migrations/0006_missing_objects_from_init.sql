-- 0006_missing_objects_from_init.sql
-- Финализирует схему после исторических SQL-миграций 0000-0005.
--
-- У старых записей journal timestamp не образуют монотонную последовательность.
-- Поэтому drizzle-kit может пропустить 0002/0003 на чистой БД, сравнивая только
-- последний created_at. Эта миграция должна оставаться последней и повторяет
-- необходимые изменения безопасно для чистой и уже существующей базы.
-- Применяется один раз; все операции идемпотентны.

-- =====================================================================
-- Объекты, отсутствующие в сгенерированной baseline-схеме
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

ALTER TABLE admin_users
  ADD COLUMN IF NOT EXISTS session_epoch integer NOT NULL DEFAULT 1;

ALTER TABLE announcements
  ADD COLUMN IF NOT EXISTS image_url text;

ALTER TABLE partners
  ADD COLUMN IF NOT EXISTS categories jsonb NOT NULL DEFAULT '[]'::jsonb;

-- =====================================================================
-- Целостность данных, которую должны обеспечивать 0002/0003.
-- Повторяем её здесь, потому что на старой БД часть этих миграций могла
-- быть пропущена из-за исторических timestamp в journal.
-- =====================================================================

ALTER TABLE admin_users
  DROP CONSTRAINT IF EXISTS admin_users_role_check;
ALTER TABLE admin_users
  ADD CONSTRAINT admin_users_role_check
  CHECK (role IN ('viewer', 'editor', 'admin'))
  NOT VALID;
ALTER TABLE admin_users VALIDATE CONSTRAINT admin_users_role_check;

ALTER TABLE admin_users
  DROP CONSTRAINT IF EXISTS admin_users_email_format_check;
ALTER TABLE admin_users
  ADD CONSTRAINT admin_users_email_format_check
  CHECK (email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$')
  NOT VALID;
ALTER TABLE admin_users VALIDATE CONSTRAINT admin_users_email_format_check;

ALTER TABLE admin_users
  DROP CONSTRAINT IF EXISTS admin_users_session_epoch_nonneg;
ALTER TABLE admin_users
  ADD CONSTRAINT admin_users_session_epoch_nonneg
  CHECK (session_epoch >= 1)
  NOT VALID;
ALTER TABLE admin_users VALIDATE CONSTRAINT admin_users_session_epoch_nonneg;

ALTER TABLE leads
  DROP CONSTRAINT IF EXISTS leads_status_chk;
ALTER TABLE leads
  DROP CONSTRAINT IF EXISTS leads_status_check;
ALTER TABLE leads
  ADD CONSTRAINT leads_status_check
  CHECK (status IN ('new', 'in_progress', 'interaction_scheduled', 'spam', 'converted', 'lost'))
  NOT VALID;
ALTER TABLE leads VALIDATE CONSTRAINT leads_status_check;

ALTER TABLE leads
  DROP CONSTRAINT IF EXISTS leads_name_nonempty;
ALTER TABLE leads
  ADD CONSTRAINT leads_name_nonempty
  CHECK (length(btrim(name)) >= 1 AND length(btrim(contact)) >= 1)
  NOT VALID;
ALTER TABLE leads VALIDATE CONSTRAINT leads_name_nonempty;

ALTER TABLE audit_logs
  DROP CONSTRAINT IF EXISTS audit_logs_action_check;
ALTER TABLE audit_logs
  ADD CONSTRAINT audit_logs_action_check
  CHECK (action IN ('create', 'update', 'delete', 'login', 'logout', 'password_change', 'session_invalidate'))
  NOT VALID;
ALTER TABLE audit_logs VALIDATE CONSTRAINT audit_logs_action_check;

ALTER TABLE fsi_deadline_subscriptions
  DROP CONSTRAINT IF EXISTS fsi_chat_id_positive;
ALTER TABLE fsi_deadline_subscriptions
  ADD CONSTRAINT fsi_chat_id_positive
  CHECK (telegram_chat_id > 0)
  NOT VALID;
ALTER TABLE fsi_deadline_subscriptions VALIDATE CONSTRAINT fsi_chat_id_positive;

ALTER TABLE reminders
  DROP CONSTRAINT IF EXISTS reminders_fire_at_future;

ALTER TABLE login_attempts
  DROP CONSTRAINT IF EXISTS login_attempts_count_nonneg;
ALTER TABLE login_attempts
  ADD CONSTRAINT login_attempts_count_nonneg
  CHECK (failure_count >= 0)
  NOT VALID;
ALTER TABLE login_attempts VALIDATE CONSTRAINT login_attempts_count_nonneg;

ALTER TABLE login_attempts
  DROP CONSTRAINT IF EXISTS login_attempts_blocked_after_first;
ALTER TABLE login_attempts
  ADD CONSTRAINT login_attempts_blocked_after_first
  CHECK (blocked_until IS NULL OR blocked_until >= first_failure_at)
  NOT VALID;
ALTER TABLE login_attempts VALIDATE CONSTRAINT login_attempts_blocked_after_first;

-- reminders.fire_at нельзя проверять через now() в CHECK-constraint:
-- PostgreSQL требует для таких ограничений IMMUTABLE-функции. Валидация
-- времени напоминания остаётся на границе приложения.
