# Ответы на чек-лист сисадмина — деплой ДИВА на VPS

Ответ на `DEPLOY-BLOCKERS.md`. Ниже — по каждому из 5 пунктов чек-листа: что
сделано, что передаём и как проверить.

---

## 1. Коммит `db/migrations/meta/_journal.json` (блокер 1)

**Готово.** Причина: `db/.gitignore` игнорировал каталог `migrations/meta/` —
`_journal.json` и снапшот схемы никогда не попадали в репозиторий, поэтому
`drizzle-kit migrate` на чистом сервере не видел ни одной миграции и падал с
ошибкой `Can't find meta/_journal.json file`. Из-за этого не стартовали ни
`web`, ни `diva-admin` (оба ждут `migrate: condition: service_completed_successfully`
в `docker-compose.prod.yml`), а следом и `caddy`.

Исправлено: строка `migrations/meta/` убрана из `db/.gitignore`,
`db/migrations/meta/_journal.json` и `db/migrations/meta/0000_snapshot.json`
закоммичены.

**Как проверить после `git pull`:**
```bash
git ls-files db/migrations/meta/
# ожидаем: db/migrations/meta/0000_snapshot.json
#          db/migrations/meta/_journal.json
```

---

## 2. Фикс монтирования Caddyfile в `ops/docker-compose.prod.yml` (блокер 2)

**Готово.** Причина: контейнер `caddy` монтировал всю папку `../ops/caddy`
на `/etc/caddy`, а образ `caddy:2-alpine` по умолчанию ищет файл строго по
пути `/etc/caddy/Caddyfile` — в папке лежат только `Caddyfile.prod`,
`Caddyfile.dev`, файла с именем ровно `Caddyfile` не было. Контейнер падал
на старте (`open /etc/caddy/Caddyfile: no such file or directory`) и уходил
в restart-loop — не поднимались ни сайт, ни TLS.

Исправлено: монтирование теперь адресное —
```yaml
volumes:
  - ../ops/caddy/Caddyfile.prod:/etc/caddy/Caddyfile:ro
```

**Как проверить после `git pull`:**
```bash
cd ops
docker compose -f docker-compose.prod.yml config --quiet && echo OK
```

---

## 3. Пароль от учётки `admin@diva.ru` (блокер 3)

**Готово — пароль сброшен на новый.** Старый пароль (тот, что был задан при
создании учётки в июне) больше не действует. Значения ниже — передавать
сисадмину через защищённый канал, не в открытом чате:

```
URL:      https://admin.diva-start-up.ru
Email:    admin@diva.ru
Password: Jw8%XkEBGPu6G5YxqGgX
```

`require_password_change` для этой учётки — `false`, принудительной смены
пароля при первом входе **не будет**. Рекомендуем сменить пароль руками
сразу после первого входа в админку.

Заодно закрыт и сопутствующий баг из отчёта: старая команда создания админа
(`docker compose exec diva-admin npx tsx scripts/seed-admin.ts`) не работала —
контейнер `diva-admin` собран как Next.js standalone-образ и не содержит ни
`node_modules`, ни каталога `scripts/`. Добавлен отдельный разовый сервис
`seed-admin` (профиль `tools`, не поднимается при обычном `up -d`):

```bash
# создать нового админа
docker compose -f docker-compose.prod.yml --profile tools run --rm seed-admin

# сбросить пароль существующему
docker compose -f docker-compose.prod.yml --profile tools run --rm \
  seed-admin npx tsx scripts/reset-admin.ts admin@diva.ru 'НовыйПароль123!'
```

**Дамп БД обновлён** под новый пароль — используйте
`ДИВА_дамп_БД_2026-07-11.sql.gz` (не `2026-07-06`, тот устарел и удалён).

---

## 4. `BOT_TOKEN` и `ROP_CHAT_ID` для Telegram-бота

**Готово — передаём значения** (тоже через защищённый канал, не в общий чат):

```
BOT_TOKEN=8653671236:AAGR-8_ANqeGGhd7EksAEGimSJK8R1dajss
ROP_CHAT_ID=814811135
```

`BOT_TOKEN` — токен бота `@DivaCRMbot` у @BotFather. `ROP_CHAT_ID` — Telegram
chat_id руководителя отдела продаж, куда бот шлёт уведомления о новых лидах.
Оба значения вписать в `ops/.env` на сервере (шаблон — `ops/.env.example`).

---

## 5. Подтверждение по `docker-compose.beget.yml`

**Подтверждаем — удалён.** `docker-compose.beget.yml` и `Caddyfile.beget`
убраны из репозитория. Это был устаревший урезанный вариант стека без
`diva-admin` и `migrate`, с legacy `db/init.sql` вместо drizzle-миграций и
без тома `uploads` — использовать его не нужно. Единственный актуальный файл
для прода — `ops/docker-compose.prod.yml`.

---

## Что дальше

После `git pull` все три технических блокера (1, 2, 5) закрыты — деплой идёт
ровно по сценарию из PDF-инструкции (`ДИВА_деплой_VPS_инструкция.pdf`):

1. Подготовка VPS (Docker, ufw)
2. `git clone` в `/opt/diva`
3. Заполнить `ops/.env` — включая `BOT_TOKEN` / `ROP_CHAT_ID` из пункта 4 выше
4. Поднять только `postgres`, накатить дамп `ДИВА_дамп_БД_2026-07-11.sql.gz`
5. `docker compose -f docker-compose.prod.yml --env-file .env up -d --build`
6. A-записи на reg.ru → Caddy сам выпустит TLS
7. Зайти в `https://admin.diva-start-up.ru` под учёткой из пункта 3, сменить пароль

Файлы для передачи: `ДИВА_дамп_БД_2026-07-11.sql.gz`,
`ДИВА_деплой_VPS_инструкция.pdf`, этот файл, доступ к git-репозиторию.
