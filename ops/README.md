# ops/ — инфраструктура Docker Compose

## Назначение каталога

Здесь живёт оркестрация всего стека ДИВА: Next.js (`web`), Strapi (`cms`),
PostgreSQL (`postgres`), Telegram-бот (`bot`) и обратный прокси Caddy (только prod).
Сами приложения и их Dockerfile'ы лежат в `web/`, `cms/`, `bot/`, `db/` —
этот каталог их только собирает и связывает.

Файлы:

- `docker-compose.dev.yml` — локальная разработка с hot reload (порты 3000 / 1337 / 5432 наружу).
- `docker-compose.prod.yml` — VPS (Selectel / TimeWeb), наружу торчит только Caddy (80/443).
- `caddy/` — конфиги Caddy (`Caddyfile.dev`, `Caddyfile.prod`).
- `scripts/` — вспомогательные скрипты (бэкапы и т.п.).
- `.env.example` — шаблон переменных окружения.
- `Makefile` — короткие алиасы вокруг `docker compose`.

## Локальный запуск

```sh
cd ops
cp .env.example .env
# заполнить секреты: POSTGRES_PASSWORD, BOT_TOKEN, ROP_CHAT_ID, Strapi-секреты
# Strapi-секреты можно сгенерировать: openssl rand -base64 32
make dev
```

Сервисы:

| Сервис | URL                       |
|--------|---------------------------|
| web    | http://localhost:3000     |
| cms    | http://localhost:1337     |
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

Реализация — в фазе F (см. `make backup-db`, заглушка `ops/scripts/backup-db.sh`).
Минимум: `pg_dump` по cron на хосте, дамп в `ops/backups/` + выгрузка в S3.
