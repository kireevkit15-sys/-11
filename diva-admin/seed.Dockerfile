# syntax=docker/dockerfile:1.7
# Разовый инструментальный образ: запускает scripts/*.ts (seed-admin.ts,
# reset-admin.ts) напрямую через tsx — эти скрипты недоступны в runtime-образе
# diva-admin/Dockerfile, потому что тот собирается как Next.js standalone
# (копируются только .next/standalone + .next/static + public, без
# node_modules/scripts). См. DEPLOY-BLOCKERS.md, блокер 3.
#
# ВАЖНО: build context = КОРЕНЬ репозитория (не diva-admin/), как и у
# diva-admin/Dockerfile — нужен доступ к ../db/schema.ts (alias @db/*).
# В compose: build: { context: .., dockerfile: diva-admin/seed.Dockerfile }
#
# Запуск (профиль tools — не поднимается при обычном `up -d`):
#   docker compose -f ops/docker-compose.prod.yml --profile tools \
#     run --rm seed-admin
#   docker compose -f ops/docker-compose.prod.yml --profile tools \
#     run --rm seed-admin npx tsx scripts/reset-admin.ts admin@diva.ru 'NewPass123!'

FROM node:22-alpine
WORKDIR /app
COPY db ./db
COPY diva-admin/package.json diva-admin/package-lock.json* ./diva-admin/
WORKDIR /app/diva-admin
RUN npm install --legacy-peer-deps
COPY diva-admin .
CMD ["npx", "tsx", "scripts/seed-admin.ts"]
