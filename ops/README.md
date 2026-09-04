# ops/ — инфраструктура Docker Compose

## Назначение каталога

Здесь живёт оркестрация всего стека ДИВА: Next.js (`web`), кастомная админ-панель
(`diva-admin`), PostgreSQL (`postgres`), Telegram-бот (`bot`) и обратный прокси Caddy
(только prod). Сами приложения и их Dockerfile'ы лежат в `web/`, `diva-admin/`, `bot/`,
`db/` — этот каталог их только собирает и связывает.

Файлы:

- `docker-compose.dev.yml` — локальная разработка с hot reload (порты 3000 / 5432 наружу).
- `docker-compose.prod.yml` — VPS (Selectel / TimeWeb), наружу торчит только Caddy (80/443).
- `caddy/` — конфиги Caddy (`Caddyfile.dev`, `Caddyfile.prod`).
- `scripts/` — вспомогательные скрипты (бэкапы и т.п.).
- `.env.example` — шаблон переменных окружения.
- `Makefile` — короткие алиасы вокруг `docker compose`.

## Локальный запуск

```sh
cd ops
cp .env.example .env
# заполнить секреты: POSTGRES_PASSWORD, BOT_TOKEN, ROP_CHAT_ID, ADMIN_SESSION_SECRET
# ADMIN_SESSION_SECRET можно сгенерировать: openssl rand -hex 32
make dev
```

Сервисы:

| Сервис | URL                       |
|--------|---------------------------|
| web    | http://localhost:3300    |
| admin  | http://localhost:3301/login |
| pg     | postgres://localhost:5436 |
| bot    | (long polling, без порта) |

## Прод-деплой (VPS)

Первый запуск на чистом VPS:

```sh
cd /opt/diva
git clone <repo-url> .
cd ops
cp .env.example .env       # только один раз; существующий .env не перезаписывать
chmod 600 .env
# заполнить DOMAIN, ADMIN_DOMAIN, ACME_EMAIL и все секреты
make prod-up
```

Обновление существующего production:

```sh
cd /opt/diva
# перед изменением БД сначала сделать backup
cd ops
./scripts/backup-db.sh
cd ..
git pull --ff-only
cd ops
make prod-up
```

`make prod-up` пересобирает образы из текущего commit и запускает миграции до
`web`, `diva-admin` и `bot`. Не удаляйте volumes:
`postgres-data` содержит БД, `uploads` — пользовательские загрузки, а
`caddy-data` — TLS-сертификаты. Caddy сам выпустит TLS-сертификаты через Let's
Encrypt — нужно лишь, чтобы A-записи `${DOMAIN}` и `${ADMIN_DOMAIN}` указывали на
VPS, а порты 80/443 были доступны.

## Логи и остановка

```sh
make logs    # tail -f всех dev-сервисов
make stop    # остановить dev-стек (volumes сохраняются)
make rebuild # пересобрать образы без кэша

# для прода:
docker compose -f docker-compose.prod.yml logs -f
docker compose -f docker-compose.prod.yml down
```

## Бэкапы

`make backup-db` запускает `ops/scripts/backup-db.sh`: делает `pg_dump` из контейнера Postgres
в `ops/backups/diva-YYYY-MM-DD-HH-MM.sql.gz` и оставляет последние 14 дампов.
Для production стоит запускать по cron на хосте и дополнительно выгружать дампы во внешнее хранилище.
