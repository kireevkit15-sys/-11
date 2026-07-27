-- =====================================================================
-- ДИВА — миграция 0002: CHECK constraints для целостности данных.
--
-- Зачем: text-поля с известным доменом значений (role, status, action, page)
-- проверяются СУБД, а не только на уровне приложения. Это страховка от
-- багов в коде, которые могут записать мусор (например, status='foo')
-- и сломать фильтры/индексы/уведомления в боте.
--
-- Все ограничения — NOT VALID + VALIDATE, чтобы не блокировать таблицы
-- при добавлении (CHECK с полным сканированием может занять минуты на
-- больших таблицах). NOT VALID добавляет constraint только для новых строк;
-- VALIDATE проверяет существующие без блокировки записи.
--
-- Применение: psql $DATABASE_URL -f db/migrations/0002_check_constraints.sql
-- (или через npm run db:apply-checks)
-- =====================================================================

-- admin_users.role — только viewer/editor/admin
ALTER TABLE admin_users
  DROP CONSTRAINT IF EXISTS admin_users_role_check;
ALTER TABLE admin_users
  ADD CONSTRAINT admin_users_role_check
  CHECK (role IN ('viewer', 'editor', 'admin'))
  NOT VALID;
ALTER TABLE admin_users VALIDATE CONSTRAINT admin_users_role_check;

-- admin_users.email — базовая проверка формата (Zod всё равно валидирует на API)
-- Не строгий RFC, чтобы не отсекать крайние случаи; просто наличие @.
ALTER TABLE admin_users
  DROP CONSTRAINT IF EXISTS admin_users_email_format_check;
ALTER TABLE admin_users
  ADD CONSTRAINT admin_users_email_format_check
  CHECK (email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$')
  NOT VALID;
ALTER TABLE admin_users VALIDATE CONSTRAINT admin_users_email_format_check;

-- admin_users.session_epoch — неотрицательный
ALTER TABLE admin_users
  DROP CONSTRAINT IF EXISTS admin_users_session_epoch_nonneg;
ALTER TABLE admin_users
  ADD CONSTRAINT admin_users_session_epoch_nonneg
  CHECK (session_epoch >= 1)
  NOT VALID;
ALTER TABLE admin_users VALIDATE CONSTRAINT admin_users_session_epoch_nonneg;

-- leads.status — единый список с init.sql и bot/src/types.ts.
-- ВАЖНО: в init.sql уже есть constraint leads_status_chk с правильным списком,
-- а в этой миграции исторически использовалось имя leads_status_check с
-- устаревшим набором (waiting/won/archived). Дропаем ОБА имени, чтобы
-- перейти на единый leads_status_check с актуальным списком.
ALTER TABLE leads
  DROP CONSTRAINT IF EXISTS leads_status_check;
ALTER TABLE leads
  DROP CONSTRAINT IF EXISTS leads_status_chk;
ALTER TABLE leads
  ADD CONSTRAINT leads_status_check
  CHECK (status IN ('new', 'in_progress', 'interaction_scheduled', 'spam', 'converted', 'lost'))
  NOT VALID;
ALTER TABLE leads VALIDATE CONSTRAINT leads_status_check;

-- leads.source — не пустая строка (если NULL не подходит)
ALTER TABLE leads
  DROP CONSTRAINT IF EXISTS leads_name_nonempty;
ALTER TABLE leads
  ADD CONSTRAINT leads_name_nonempty
  CHECK (length(btrim(name)) >= 1 AND length(btrim(contact)) >= 1)
  NOT VALID;
ALTER TABLE leads VALIDATE CONSTRAINT leads_name_nonempty;

-- audit_logs.action — базовые действия
ALTER TABLE audit_logs
  DROP CONSTRAINT IF EXISTS audit_logs_action_check;
ALTER TABLE audit_logs
  ADD CONSTRAINT audit_logs_action_check
  CHECK (action IN ('create', 'update', 'delete', 'login', 'logout', 'password_change', 'session_invalidate'))
  NOT VALID;
ALTER TABLE audit_logs VALIDATE CONSTRAINT audit_logs_action_check;

-- reminder.fire_at — не в прошлом (не строго, с запасом 1 минута на случай рассинхрона часов)
ALTER TABLE reminders
  DROP CONSTRAINT IF EXISTS reminders_fire_at_future;
ALTER TABLE reminders
  ADD CONSTRAINT reminders_fire_at_future
  CHECK (fire_at >= now() - INTERVAL '1 minute')
  NOT VALID;
ALTER TABLE reminders VALIDATE CONSTRAINT reminders_fire_at_future;

-- fsi_deadline_subscriptions.telegram_chat_id — Telegram chat_id > 0
ALTER TABLE fsi_deadline_subscriptions
  DROP CONSTRAINT IF EXISTS fsi_chat_id_positive;
ALTER TABLE fsi_deadline_subscriptions
  ADD CONSTRAINT fsi_chat_id_positive
  CHECK (telegram_chat_id > 0)
  NOT VALID;
ALTER TABLE fsi_deadline_subscriptions VALIDATE CONSTRAINT fsi_chat_id_positive;

-- login_attempts.failure_count — не отрицательный
ALTER TABLE login_attempts
  DROP CONSTRAINT IF EXISTS login_attempts_count_nonneg;
ALTER TABLE login_attempts
  ADD CONSTRAINT login_attempts_count_nonneg
  CHECK (failure_count >= 0)
  NOT VALID;
ALTER TABLE login_attempts VALIDATE CONSTRAINT login_attempts_count_nonneg;

-- login_attempts: blocked_until должен быть позже first_failure_at (если не NULL)
ALTER TABLE login_attempts
  DROP CONSTRAINT IF EXISTS login_attempts_blocked_after_first;
ALTER TABLE login_attempts
  ADD CONSTRAINT login_attempts_blocked_after_first
  CHECK (blocked_until IS NULL OR blocked_until >= first_failure_at)
  NOT VALID;
ALTER TABLE login_attempts VALIDATE CONSTRAINT login_attempts_blocked_after_first;
