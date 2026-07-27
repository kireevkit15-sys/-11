-- =====================================================================
-- ДИВА — миграция 0003: унификация leads.status CHECK constraint.
--
-- Проблема: в БД сейчас сосуществуют ДВА constraint на leads.status
--   1) leads_status_chk      (из init.sql) — правильный список
--   2) leads_status_check    (из 0002)      — устаревший список (waiting/won/archived)
--
-- Оба активны одновременно (CHECK по OR), но это мешает Drizzle при
-- попытке DROP CONSTRAINT IF EXISTS leads_status_check в 0002 на чистой
-- среде — там будет конфликт имён. Плюс 0002 был применён руками мимо
-- drizzle-kit, что нарушает инвариант "журнал ↔ реальная БД".
--
-- Эта миграция:
--   1. Дропает оба старых constraint (IF EXISTS — идемпотентно).
--   2. Создаёт единый leads_status_check с актуальным списком
--      (new, in_progress, interaction_scheduled, spam, converted, lost).
--      Список синхронизирован с:
--        - bot/src/types.ts (LeadStatus)
--        - diva-admin/src/app/admin/leads/status.ts
--        - init.sql:164
--
-- Применяется через стандартный npm run db:migrate.
-- =====================================================================

ALTER TABLE leads
  DROP CONSTRAINT IF EXISTS leads_status_chk;

ALTER TABLE leads
  DROP CONSTRAINT IF EXISTS leads_status_check;

ALTER TABLE leads
  ADD CONSTRAINT leads_status_check
  CHECK (status IN ('new', 'in_progress', 'interaction_scheduled', 'spam', 'converted', 'lost'))
  NOT VALID;

ALTER TABLE leads VALIDATE CONSTRAINT leads_status_check;