# Деплой ДИВА на VPS и подключение домена (reg.ru)

Инструкция для сисадмина: перенос проекта с машины разработчика на production-VPS,
разворачивание базы из дампа, подключение домена `diva-start-up.ru` (регистратор **reg.ru**).

> **Актуализация от 11.07.2026.** В предыдущей версии этой инструкции (и в
> репозитории на тот момент) было три блокера, из-за которых деплой по шагам
> ниже не поднялся бы на чистом сервере — они найдены и исправлены:
> отсутствовавший в git `db/migrations/meta/_journal.json` (раздел 5),
> неверное монтирование Caddyfile (раздел 6), недоступный в runtime-образе
> `seed-admin.ts` (раздел 8, теперь через отдельный сервис `seed-admin`).
> Все три зафиксированы в `DEPLOY-BLOCKERS.md` и исправлены в этом коммите.

---

## 0. Что это за проект

Монорепозиторий из 4 сервисов, все крутятся в Docker Compose на одном VPS:

| Сервис | Контейнер | Порт внутри | Назначение |
|---|---|---|---|
| `postgres` | `diva-pg` | 5432 | PostgreSQL 16 (БД) |
| `migrate` | `diva-migrate` | — | Одноразовый: применяет Drizzle-миграции |
| `web` | `diva-web` | 3000 | Публичный сайт (Next.js 16, standalone) |
| `diva-admin` | `diva-admin` | 3001 | Кастомная админ-панель (Next.js) |
| `bot` | `diva-bot` | — | Telegram-бот (grammY, long polling) |
| `caddy` | `diva-caddy` | 80, 443 | Reverse proxy + автоматический TLS (Let's Encrypt) |

Наружу торчат **только порты 80 и 443** у Caddy. Всё остальное — во внутренней
docker-сети `diva`, снаружи недоступно. Caddy проксирует:

- `https://diva-start-up.ru` → `web:3000` (публичный сайт)
- `https://admin.diva-start-up.ru` → `diva-admin:3001` (админка)

---

## 1. Требования к VPS

| Параметр | Значение | Почему |
|---|---|---|
| vCPU | ≥ 4 | Next.js SSR + PG + бот + Caddy |
| RAM | ≥ 8 GB | PG ~1 GB, Next.js ~1 GB, запас |
| Диск | ≥ 80 GB SSD | Образы Docker + БД + медиа |
| ОС | Ubuntu 24.04 LTS | Стандарт под Docker |
| Канал | ≥ 100 Мбит/с | Раздача статики |
| Локация | **РФ** | 152-ФЗ: ПДн граждан РФ хранятся в РФ |
| Порты | 80, 443 открыты | Caddy выпускает TLS и принимает трафик |

Хостеры на выбор: Selectel, TimeWeb Cloud, Beget — все РФ.

---

## 2. Файлы для передачи сисадмину

Разработчик передаёт **три вещи** (вне git, через защищённый канал):

1. **Дамп БД** — `diva-dump-2026-07-06.sql.gz` (≈ 27 KB, gzip).
   Внутри: полная схема PostgreSQL 16 + данные (таблица `leads` с заявками,
   `admin_users` с хешем пароля, `audit_logs`, схема `drizzle` с записью о
   применённой миграции). Пользовательских медиа-загрузок пока нет — тащить
   `uploads/` не нужно.

2. **`ops/.env`** — секреты (ниже, раздел 4). В git его нет.

3. **Доступ к репозиторию** — `git clone <repo-url>` (GitHub, private).
   Если репозиторий приватный — выдать сисадмину deploy-ключ или доступ.

Фотографии команды уже в git (`diva-admin/public/team/*.jpg`) — попадут в
Docker-образ при сборке, отдельно передавать не нужно.

---

## 3. Подготовка VPS (один раз)

```bash
# обновление системы
sudo apt update && sudo apt upgrade -y

# Docker + Compose plugin
sudo apt install -y ca-certificates curl gnupg
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo $VERSION_CODENAME) stable" | sudo tee /etc/apt/sources.list.d/docker.list
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# добавить своего юзера в группу docker (чтобы без sudo)
sudo usermod -aG docker $USER
newgrp docker

# файрвол: открыть SSH, HTTP, HTTPS
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable

# проверить
docker --version          # Docker version 27+
docker compose version    # Docker Compose version v2.20+
```

---

## 4. Клонирование и настройка окружения

```bash
sudo mkdir -p /opt/diva
sudo chown $USER:$USER /opt/diva
cd /opt/diva
git clone <repo-url> .          # точка = в текущую папку
```

Создать `ops/.env` (в git его нет — это секреты). Шаблон: `ops/.env.example`.

```bash
cd /opt/diva/ops
cp .env.example .env
nano .env
```

Заполнить **все** значения:

```dotenv
# PostgreSQL
POSTGRES_USER=diva
POSTGRES_PASSWORD=<СЛОЖНЫЙ_ПАРОЛЬ_БД_сгенерировать>   # например: openssl rand -hex 24
POSTGRES_DB=diva

# Next.js web
NEXT_PUBLIC_SITE_URL=https://diva-start-up.ru
DATABASE_URL=postgres://diva:<ТОТ_ЖЕ_ПАРОЛЬ_БД>@postgres:5432/diva

# Админ-панель — секрет сессии, минимум 32 символа
ADMIN_SESSION_SECRET=<сгенерировать: openssl rand -hex 32>

# Telegram-бот
BOT_TOKEN=<взять у разработчика>
ROP_CHAT_ID=<взять у разработчика>
WEB_BASE_URL=https://diva-start-up.ru

# Домены и TLS
DOMAIN=diva-start-up.ru
ADMIN_DOMAIN=admin.diva-start-up.ru
ACME_EMAIL=diva.consulting.b@gmail.com
```

> **Важно:** `POSTGRES_PASSWORD` здесь и в `DATABASE_URL` должны совпадать.
> Пароль БД задаётся здесь впервые — на машине разработчика был девелоперский
> `diva/diva`, в проде ставим свой. Дамп разворачивается под новым паролем
> (дамп сделан с `--no-owner --no-privileges`, так что пароль БД не
> зашит в данные).

---

## 5. Развёртывание базы из дампа

Порядок важен: сначала поднимаем **только Postgres**, накатываем дамп, потом
запускаем весь стек. Так `migrate` увидит, что миграция уже применена, и
завершится как no-op.

```bash
# 1. Скопировать дамп на сервер (с машины разработчика):
#    scp ops/backups/diva-dump-2026-07-06.sql.gz deploy@<vps-ip>:/opt/diva/ops/

# 2. На VPS — поднять только Postgres
cd /opt/diva/ops
docker compose -f docker-compose.prod.yml --env-file .env up -d postgres

# дождаться статуса healthy
docker compose -f docker-compose.prod.yml ps    # postgres: Up (healthy)

# 3. Накатить дамп в контейнер Postgres
gunzip -c /opt/diva/ops/diva-dump-2026-07-06.sql.gz \
  | docker exec -i diva-pg psql -U diva -d diva

# 4. Проверить, что данные на месте
docker exec diva-pg psql -U diva -d diva -c "SELECT count(*) FROM leads;"        # ожидаем: 7
docker exec diva-pg psql -U diva -d diva -c "SELECT email, role FROM admin_users;"  # ожидаем: admin@diva.ru / admin
docker exec diva-pg psql -U diva -d diva -c "SELECT count(*) FROM drizzle.__drizzle_migrations;"  # ожидаем: 1
```

Если на шаге 3 вылетает ошибка про существующие таблицы — значит, миграция
успела примениться раньше. В этом случае:

```bash
docker compose -f docker-compose.prod.yml down
docker volume rm ops_postgres-data    # имя тома может отличаться — проверить: docker volume ls | grep diva
docker compose -f docker-compose.prod.yml --env-file .env up -d postgres
gunzip -c /opt/diva/ops/diva-dump-2026-07-06.sql.gz | docker exec -i diva-pg psql -U diva -d diva
```

> **Почему это должно сработать.** Раньше в репозитории отсутствовал файл
> `db/migrations/meta/_journal.json` (был в `.gitignore`) — без него
> `drizzle-kit migrate` не видит вообще ни одной миграции и завершается
> ошибкой, а `web`/`diva-admin` не стартуют, потому что оба ждут
> `migrate: condition: service_completed_successfully`. Файл теперь
> закоммитен вместе со снапшотом схемы (`meta/0000_snapshot.json`), поэтому
> `migrate` на шаге 6 увидит, что миграция `0000_baseline_schema` уже
> применена (её запись есть в дампе, в схеме `drizzle`), и завершится как
> no-op — это ожидаемое и правильное поведение.

---

## 6. Запуск всего стека

```bash
cd /opt/diva/ops
docker compose -f docker-compose.prod.yml --env-file .env up -d --build
```

`--build` собирает образы `web`, `diva-admin`, `bot`, `postgres` из исходников
(первый запуск — 5–10 минут, качаются base-образы и ставятся npm-зависимости).
Дальнейшие деплои — `up -d` без `--build` (или с `--build` при обновлении кода).

Проверить:

```bash
docker compose -f docker-compose.prod.yml ps
# все сервисы: Up (healthy) или Up

# логи Caddy — там видно выпуск сертификата
docker compose -f docker-compose.prod.yml logs -f caddy
```

> **Про монтирование Caddy.** Compose монтирует конкретный файл —
> `../ops/caddy/Caddyfile.prod:/etc/caddy/Caddyfile:ro`. Образ `caddy:2-alpine`
> по умолчанию ищет строго `/etc/caddy/Caddyfile`; в `ops/caddy/` лежит только
> `Caddyfile.prod` (и `Caddyfile.dev` для локальной разработки — прод его не
> использует), файла с именем ровно `Caddyfile` там нет. Если это когда-то
> сломается снова (например, кто-то переименует `Caddyfile.prod`) — Caddy
> уйдёт в restart-loop с ошибкой `open /etc/caddy/Caddyfile: no such file or
> directory`, и не поднимутся ни сайт, ни TLS.

Порядок старта (задан в compose через `depends_on`):
`postgres` → `migrate` (проверит, что миграция 0000 уже применена — пропустит) →
`web` + `diva-admin` + `bot` → `caddy`.

---

## 7. Подключение домена на reg.ru

Caddy автоматически выпускает TLS-сертификат через Let's Encrypt, но для этого
A-записи домена должны указывать на IP вашего VPS, а порты 80/443 — быть
открытыми (шаг 3).

### 7.1. Узнать IP сервера

```bash
curl -4 ifconfig.me        # на VPS — выдаст публичный IPv4
```

### 7.2. В личном кабинете reg.ru

Зайти в: **Домены** → `diva-start-up.ru` → **DNS-серверы / Управление зоной**.

Добавить/проверить записи:

| Поддомен | Тип | Значение | Назначение |
|---|---|---|---|
| `@` (пусто) | A | `<IP-вашего-VPS>` | Основной сайт |
| `admin` | A | `<IP-вашего-VPS>` | Админ-панель |
| `www` | A | `<IP-вашего-VPS>` | (опционально) www-редирект |

> Если у reg.ru DNS-зоны делегированы на их собственные ns-серверы
> (`ns1.hosting.reg.ru` / `ns2.hosting.reg.ru` или `ns1.reg.ru` / `ns2.reg.ru`)
> — записи применятся за 15–60 минут. Если домен недавно зарегистрирован —
> до 24 часов. Проверить: `dig diva-start-up.ru +short` должен вернуть IP VPS.

### 7.3. Caddy выпустит сертификат автоматически

Как только DNS разошёлся и `diva-start-up.ru` смотрит на VPS — Caddy при первом
запросе получит сертификат Let's Encrypt. Проверить:

```bash
curl -I https://diva-start-up.ru          # HTTP/2 200
curl -I https://admin.diva-start-up.ru    # HTTP/2 200 (или 200 после логина)
```

Если сертификат не выпускается — смотреть логи:
`docker compose -f docker-compose.prod.yml logs caddy | grep -i acme`.
Частые причины: DNS ещё не разошёлся, порт 80 закрыт, A-запись указывает не на
этот сервер.

---

## 8. Доступ к админ-панели

- URL: `https://admin.diva-start-up.ru`
- Учётка уже в дампе: `admin@diva.ru`, роль `admin`.
- **Пароль** передаётся разработчиком через защищённый канал (в дампе только
  хеш). Уточните у разработчика значение `require_password_change` для этой
  учётки — если `true`, система попросит сменить пароль при первом входе;
  если `false` — смените пароль руками сразу после входа.

Если нужно создать нового админа или сбросить пароль существующему —
**не** пытайтесь запускать скрипт внутри контейнера `diva-admin`: он собран
как Next.js standalone-образ (`diva-admin/Dockerfile`) и в runtime содержит
только `.next/standalone`, `.next/static` и `public` — ни `node_modules`
(там лежит `tsx`, которым скрипт запускается), ни каталога `scripts/` там
нет, команда `exec diva-admin npx tsx ...` завершится ошибкой «not found».

Вместо этого в стеке есть отдельный разовый сервис `seed-admin`
(`diva-admin/seed.Dockerfile`) — он не поднимается автоматически (профиль
`tools`), только по явному запуску:

```bash
cd /opt/diva/ops

# создать администратора (если ADMIN_INITIAL_EMAIL уже существует — скрипт
# сообщит об этом и ничего не изменит)
docker compose -f docker-compose.prod.yml --profile tools run --rm seed-admin

# email и пароль берутся из ops/.env (ADMIN_INITIAL_EMAIL / ADMIN_INITIAL_PASSWORD);
# если ADMIN_INITIAL_PASSWORD пусто — скрипт сгенерирует случайный пароль
# и выведет его один раз в консоль, больше он нигде не сохраняется
```

Чтобы **сбросить пароль существующему** администратору (а не только создать
нового) — тот же контейнер, но с явной командой на `reset-admin.ts`:

```bash
docker compose -f docker-compose.prod.yml --profile tools run --rm \
  seed-admin npx tsx scripts/reset-admin.ts admin@diva.ru 'НовыйСложныйПароль123!'
```

Опционально — ограничить доступ к админке по IP: в `ops/caddy/Caddyfile.prod`
раскомментировать блок `@denied` и вписать офисные IP, затем
`docker compose -f docker-compose.prod.yml restart caddy`.

---

## 9. Бэкапы (настроить обязательно)

В репозитории есть `ops/scripts/backup-db.sh` — делает `pg_dump` из контейнера
в `ops/backups/diva-YYYY-MM-DD-HH-MM.sql.gz`, хранит последние 14.

Добавить в cron на VPS (от имени пользователя, который может в docker):

```bash
crontab -e
# ежедневно в 03:17 — бэкап БД
17 3 * * * /opt/diva/ops/scripts/backup-db.sh >> /var/log/diva-backup.log 2>&1
```

Дополнительно — выгружать дампы во внешнее хранилище (S3 Selectel / Yandex
Object Storage / отдельный диск). Минимум: раз в день копировать
`ops/backups/diva-*.sql.gz` на другой сервер.

Восстановление из дампа — см. шаг 5 (команда с `gunzip -c ... | docker exec -i diva-pg psql ...`).

---

## 10. Обновление кода (после первого деплоя)

```bash
cd /opt/diva
git pull --ff-only
cd ops
docker compose -f docker-compose.prod.yml --env-file .env up -d --build
docker image prune -f    # убрать старые образы
```

При изменении схемы БД — `migrate` применит новые миграции автоматически при
старте (они лежат в `db/migrations/`).

---

## 11. Шпаргалка по командам

| Действие | Команда |
|---|---|
| Статус сервисов | `docker compose -f ops/docker-compose.prod.yml ps` |
| Логи (все) | `docker compose -f ops/docker-compose.prod.yml logs -f` |
| Логи только сайта | `docker compose -f ops/docker-compose.prod.yml logs -f web` |
| Логи Caddy / TLS | `docker compose -f ops/docker-compose.prod.yml logs -f caddy` |
| Рестарт одного сервиса | `docker compose -f ops/docker-compose.prod.yml restart web` |
| Остановить всё | `docker compose -f ops/docker-compose.prod.yml down` |
| Остановить + удалить БД | `docker compose -f ops/docker-compose.prod.yml down -v` ⚠️ |
| Зайти в psql | `docker exec -it diva-pg psql -U diva -d diva` |
| Бэкап вручную | `cd ops && ./scripts/backup-db.sh` |
| Создать/сбросить админа | `docker compose -f ops/docker-compose.prod.yml --profile tools run --rm seed-admin` |
| Проверить сайт | `curl -I https://diva-start-up.ru` |
| Проверить DNS | `dig diva-start-up.ru +short` |

---

## 12. Возможные проблемы

**Caddy не выпускает сертификат.** Проверить: `dig diva-start-up.ru +short`
возвращает IP этого VPS? Порты 80/443 открыты в ufw? Логи:
`docker compose -f ops/docker-compose.prod.yml logs caddy | grep -iE 'acme|tls|certificate'`.
Для отладки можно временно переключить Caddy на staging-endpoint Let's Encrypt
(раскомментировать `acme_ca` в начале `ops/caddy/Caddyfile.prod`), чтобы не
упереться в rate-limit.

**`migrate` падает.** Значит, дамп накатился не полностью или hash миграции не
совпал. Логи: `docker compose -f ops/docker-compose.prod.yml logs migrate`.
В крайнем случае — снести том Postgres и накатить дамп заново (шаг 5,
команды с `down -v`).

**Бот не отвечает.** Проверить `BOT_TOKEN` и `ROP_CHAT_ID` в `ops/.env`,
логи: `docker compose -f ops/docker-compose.prod.yml logs -f bot`. Бот работает
по long polling — публичный URL и вебхуки ему не нужны.

**Сайт открывается по HTTP, но не по HTTPS.** Это этап выпуска сертификата —
подождать 1–2 минуты после первого запроса, смотреть логи Caddy. Caddy сам
сделает редирект HTTP→HTTPS после выпуска.

**502 Bad Gateway.** `web` или `diva-admin` ещё поднимаются (first build долгий).
Подождать и проверить `ps` — сервис должен быть `Up (healthy)`.

**Нашёлся `docker-compose.beget.yml` или `Caddyfile.beget` (в старой копии
репозитория / в бэкапе).** Не использовать. Это устаревший, урезанный
вариант стека для другого хостера (Beget) — без `diva-admin`, без `migrate`,
с legacy `db/init.sql` вместо drizzle-миграций и без тома `uploads`. Файлы
удалены из репозитория; единственный актуальный файл для прода —
`ops/docker-compose.prod.yml`.

