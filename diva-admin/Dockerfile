# syntax=docker/dockerfile:1.7
# ВАЖНО: build context = КОРЕНЬ репозитория (не diva-admin/),
# потому что diva-admin импортирует общую схему ../db/schema.ts (alias @db/*).
# В compose: build: { context: .., dockerfile: diva-admin/Dockerfile }

# ---------- deps ----------
FROM node:22-alpine AS deps
WORKDIR /app/diva-admin
COPY diva-admin/package.json diva-admin/package-lock.json* ./
RUN npm install --legacy-peer-deps

# ---------- build ----------
FROM node:22-alpine AS build
WORKDIR /app
# общая схема БД (нужна на этапе сборки — компилируется в бандл)
COPY db ./db
# исходники админки
COPY diva-admin ./diva-admin
COPY --from=deps /app/diva-admin/node_modules ./diva-admin/node_modules
WORKDIR /app/diva-admin
ENV NEXT_TELEMETRY_DISABLED=1
# NEXT_PUBLIC_SITE_URL инлайнится в client bundle на этапе сборки
# (нужен для resolveMediaUrl в превью изображений — иначе img src
# будет относительным и не загрузится на админском origin).
ARG NEXT_PUBLIC_SITE_URL
ENV NEXT_PUBLIC_SITE_URL=${NEXT_PUBLIC_SITE_URL}
RUN npm run build

# ---------- runner ----------
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOST=0.0.0.0
ENV PORT=3001
# Без HOSTNAME next/image и встроенный healthcheck биндятся на имя
# контейнера, и healthcheck `wget http://localhost:3001/ → refused`.
# См. DEPLOY-BLOCKERS (4).md, замечание 2.
ENV HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Next standalone: сервер + статика + public (для /uploads, /team)
COPY --from=build /app/diva-admin/public ./public
COPY --from=build --chown=nextjs:nodejs /app/diva-admin/.next/standalone ./
COPY --from=build --chown=nextjs:nodejs /app/diva-admin/.next/static ./diva-admin/.next/static

# каталог под общий volume загрузок
RUN mkdir -p /app/diva-admin/public/uploads && chown -R nextjs:nodejs /app/diva-admin/public

USER nextjs
EXPOSE 3001
# standalone кладёт server.js по пути относительно структуры монорепо
CMD ["node", "diva-admin/server.js"]
