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
| web    | http://localhost:3000     |
| pg     | postgres://localhost:5432 |
| bot    | (long polling, без порта) |

## Прод-деплой (VPS)

```sh
ssh deploy@<vps>
cd /opt/diva
git pull
cd ops
cp .env.example .env   # один раз; затем редактировать вручную
# заполнить DOMAIN, ADMIN_DOMAIN, ACME_EMAIL и все секреты
make prod-up
```

Caddy сам выпустит TLS-сертификат через Let's Encrypt — нужно лишь, чтобы
A-записи `${DOMAIN}` и `${ADMIN_DOMAIN}` указывали на VPS.

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
