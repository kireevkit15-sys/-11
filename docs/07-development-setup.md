# 07. Локальная разработка и развёртывание

Документ для разработчика, который только что склонировал репозиторий. Описывает, как поднять проект локально, как добавлять типовые сущности (страницы, компоненты, content types, команды бота) и куда смотреть, если что-то сломалось.

---

## Предварительные требования

| Инструмент | Версия | Назначение |
|---|---|---|
| Node.js | 22 LTS или новее | Сборка `web/`, `cms/`, `bot/` |
| npm | 10+ | Идёт вместе с Node |
| Docker Desktop (Windows/macOS) или Docker Engine + Compose plugin (Linux) | актуальная | Запуск всех сервисов одной командой |
| Git | 2.40+ | Клонирование, ветки, хуки |
| Python | 3.12+ | Генерация служебных документов в `docs/` (скрипты конвертации, чек-листы) |
| RAM | 16 GB рекомендовано | Strapi + Next.js + PostgreSQL + бот одновременно — около 4–6 GB в покое |

> На 8 GB машине проект тоже соберётся, но придётся запускать сервисы по одному (см. раздел «Альтернатива»).

---

## Структура репозитория

```
сайт ДИВА/
├── web/         — фронтенд: Next.js 15 (App Router) + Tailwind 4 + shadcn/ui
├── cms/         — контент: Strapi 5 (headless CMS, админка на :1337)
├── bot/         — Telegram-бот на grammY (приём заявок, напоминания о дедлайнах ФСИ)
├── db/          — init-скрипты PostgreSQL (создание схем, расширений, начальных ролей)
├── ops/         — инфраструктура: docker-compose.yml, docker-compose.prod.yml, Caddyfile, Makefile, .env.example
├── .github/     — GitHub Actions: lint, build, type-check, e2e
├── .vscode/     — общие настройки редактора, рекомендованные расширения
└── docs/        — вся проектная документация (этот файл — здесь)
```

Каждая из папок `web/`, `cms/`, `bot/` — самостоятельный npm-проект со своим `package.json`, `Dockerfile`, `.env.example`. Корень репозитория — не workspace, специально: каждый сервис собирается и деплоится независимо.

---

## Первый запуск

### 1. Клонирование и переменные окружения

```bash
git clone <repo-url> "сайт ДИВА"
cd "сайт ДИВА"

cp ops/.env.example ops/.env
cp web/.env.example web/.env.local
cp cms/.env.example cms/.env
cp bot/.env.example bot/.env
```

Заполнить значения:

- **`ops/.env`** — общие переменные для Compose: `POSTGRES_PASSWORD`, `DOMAIN`, `STRAPI_*` секреты.
- **`web/.env.local`** — `NEXT_PUBLIC_SITE_URL`, `STRAPI_URL`, `STRAPI_API_TOKEN` (создаётся в админке Strapi после первого запуска).
- **`cms/.env`** — `APP_KEYS`, `API_TOKEN_SALT`, `ADMIN_JWT_SECRET`, `JWT_SECRET`, `TRANSFER_TOKEN_SALT`. Для генерации каждого секрета:
  ```bash
  openssl rand -base64 32
  ```
- **`bot/.env`** — `BOT_TOKEN` (из @BotFather), `ROP_CHAT_ID`. Если бота пока нет — оставить `BOT_TOKEN` пустым, контейнер будет рестартиться, но остальные сервисы поднимутся.

### 2. Установка зависимостей

Удобный способ — через Make-таргеты:

```bash
cd ops && make install
```

Либо вручную в каждой папке:

```bash
cd web && npm install
cd ../cms && npm install
cd ../bot && npm install
```

### 3. Запуск через Docker Compose (рекомендуемый способ)

```bash
cd ops
make dev
```

Эквивалент: `docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d`.

Поднимается одной командой:

| Сервис | Порт | URL |
|---|---|---|
| `web` (Next.js dev) | 3000 | http://localhost:3000 |
| `cms` (Strapi) | 1337 | http://localhost:1337/admin |
| `postgres` | 5432 | внутри сети Compose, наружу — для DBeaver/psql |
| `bot` | — | без HTTP, только long polling |

Первый запуск Strapi занимает 1–3 минуты (компиляция админки). Логи: `docker compose logs -f cms`.

После старта Strapi: зайти в `/admin`, создать суперюзера, в **Settings → API Tokens** сгенерировать read-only токен и положить его в `web/.env.local` как `STRAPI_API_TOKEN`, затем перезапустить `web`.

### 4. Альтернатива: запуск каждого сервиса по отдельности

Полезно для отладки (быстрее hot reload, проще ставить брейкпоинты). Postgres всё равно удобнее держать в Docker:

```bash
docker compose -f ops/docker-compose.yml up -d postgres
```

Дальше в трёх отдельных терминалах:

```bash
cd web && npm run dev
cd cms && npm run develop
cd bot && npm run dev
```

---

## Как добавить новую страницу

1. Создать маршрут в App Router: `web/src/app/<route>/page.tsx`.
2. Использовать готовые компоненты из `web/src/components/ui/` (shadcn) и доменные компоненты из `web/src/components/`.
3. Контент тянуть из Strapi серверным `fetch` в Server Component:
   ```tsx
   const data = await fetch(`${process.env.STRAPI_URL}/api/pages?filters[slug][$eq]=<slug>`, {
     headers: { Authorization: `Bearer ${process.env.STRAPI_API_TOKEN}` },
     next: { revalidate: 60 },
   }).then(r => r.json());
   ```
4. Не забыть `metadata` (title, description, openGraph) — см. раздел SEO в `04-SEO-Marketing.md`.

---

## Как добавить новый компонент shadcn

```bash
cd web
npx shadcn@latest add <component-name> -y
```

Компоненты складываются в `web/src/components/ui/`. После добавления их можно (и нужно) править под брендинг — это исходники, а не node_modules.

Список доступных компонентов: https://ui.shadcn.com/docs/components.

---

## Как добавить новый Content Type в Strapi

Два равнозначных способа:

**Через админку (быстрее, рекомендуется для прототипа):**
- `/admin` → **Content-Type Builder** → **Create new collection type**.
- Strapi сам создаст файлы в `cms/src/api/<name>/` и перезапустит процесс.

**Вручную (для воспроизводимости и кодревью):**
- Создать `cms/src/api/<name>/content-types/<name>/schema.json` по образцу существующих.
- Создать `controllers/`, `routes/`, `services/` с дефолтным содержимым (`factories.createCoreController(...)` и т. д.).
- Перезапустить Strapi: `docker compose restart cms`.

После любого добавления — пересобрать админку: `docker compose exec cms npm run build` (либо просто рестарт в dev-режиме).

---

## Как добавить команду Telegram-боту

Открыть `bot/src/index.ts` и добавить хендлер:

```ts
bot.command('newcmd', async (ctx) => {
  await ctx.reply('Ответ на /newcmd');
});

bot.callbackQuery(/^action:(.+)$/, async (ctx) => {
  const payload = ctx.match[1];
  // ...
});
```

Зарегистрировать команду в меню BotFather (`/setcommands`) или программно через `bot.api.setMyCommands([...])`.

Для долгих операций — выносить в `bot/src/handlers/` и импортировать в `index.ts`.

---

## Миграции БД

На стадии скелета (фаза A–B) схема меняется часто, миграций пока нет. Самый простой способ применить изменения:

```bash
cd ops
docker compose down -v        # внимание: удаляет volume Postgres вместе с данными
docker compose up -d postgres
```

На фазе 2 подключим **drizzle-kit** для версионируемых миграций — каждое изменение схемы будет генерировать SQL-файл в `db/migrations/`, применяться автоматически на старте контейнера.

---

## Сборка production-образов

```bash
cd ops
make build
```

Эквивалент: `docker compose -f docker-compose.prod.yml build`.

Образы тегируются как `diva-web:latest`, `diva-cms:latest`, `diva-bot:latest`. На фазе F добавим пуш в registry (GHCR) из CI.

---

## Деплой на VPS

Подробная инструкция появится на **фазе F** (см. `05-Roadmap.md`). Кратко:

1. SSH на VPS, переключиться в каталог проекта.
2. `git pull`.
3. `cd ops && make deploy` — под капотом: `docker compose -f docker-compose.prod.yml pull && up -d`.
4. Caddy автоматически получит SSL-сертификат Let's Encrypt по значению `DOMAIN` из `ops/.env` — настройка в `ops/Caddyfile`.

Откат: `git checkout <prev-tag> && make deploy`.

---

## Полезные команды

| Ситуация | Команда |
|---|---|
| Пересобрать только `web` | `docker compose up -d --build web` |
| Посмотреть логи бота в реалтайме | `docker compose logs -f bot` |
| Зайти в shell Strapi-контейнера | `docker compose exec cms sh` |
| psql внутрь Postgres | `docker compose exec postgres psql -U postgres -d diva` |
| Очистить volume Postgres (полный сброс БД) | `docker compose down -v && docker compose up -d postgres` |
| Обновить shadcn-компонент | `cd web && npx shadcn@latest add <name> -o` |
| Type-check без сборки | `cd web && npm run type-check` |
| Линт + автофиксы | `cd web && npm run lint -- --fix` |
| Остановить всё и освободить порты | `cd ops && docker compose down` |
| Список запущенных сервисов и здоровье | `docker compose ps` |

---

## Траблшутинг

**`npm` в PowerShell ругается на ExecutionPolicy.**
Запустить через `cmd /c npm ...` либо включить policy:
```powershell
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
```

**Кириллический путь к проекту даёт сбои.**
Старые npm-пакеты и некоторые Node-инструменты ломаются на путях с не-ASCII символами (как `сайт ДИВА`). Если воспроизводится непонятная ошибка при `npm install` или сборке — попробовать переместить проект в путь без кириллицы (например, `C:\dev\diva`).

**Strapi не подключается к Postgres.**
Проверить, что healthcheck `postgres` прошёл:
```bash
docker compose ps
```
Колонка `STATUS` должна быть `healthy`. Если `starting` — подождать 10–20 секунд. Если `unhealthy` — `docker compose logs postgres`.

**Hot reload не работает в Docker.**
Проверить `ops/docker-compose.dev.yml`: исходники должны быть смонтированы как bind-mount (`./web:/app`), а `node_modules` — отдельным анонимным volume (`/app/node_modules`), иначе локальная пустая папка перетрёт зависимости из образа.

**Порт занят (`EADDRINUSE`).**
На Windows: `netstat -ano | findstr :3000`, найти PID, `taskkill /PID <pid> /F`. Чаще всего — забытый dev-сервер.

**`STRAPI_API_TOKEN` пустой → 401 от CMS.**
После первого старта Strapi нужно вручную создать токен в админке (`Settings → API Tokens → Create new`), положить в `web/.env.local`, перезапустить `web`.

**Bot падает с `401 Unauthorized`.**
Не задан или некорректен `BOT_TOKEN` в `bot/.env`. Получить токен у @BotFather, перезапустить контейнер.
