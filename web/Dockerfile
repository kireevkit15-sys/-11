# syntax=docker/dockerfile:1.7
# ВАЖНО: build context = КОРЕНЬ репозитория (не web/),
# потому что web импортирует общую схему ../db/schema.ts (alias @/db).
# В compose: build: { context: .., dockerfile: web/Dockerfile }

# ---------- dev (hot reload, docker-compose.dev.yml) ----------
FROM node:22-alpine AS dev
WORKDIR /app
COPY db ./db
WORKDIR /app/web
COPY web/package.json web/package-lock.json* ./
RUN npm install --legacy-peer-deps
COPY web ./
ENV HOST=0.0.0.0
ENV PORT=3000
EXPOSE 3000
CMD ["npm", "run", "dev"]

# ---------- deps ----------
FROM node:22-alpine AS deps
WORKDIR /app/web
COPY web/package.json web/package-lock.json* ./
RUN npm install --legacy-peer-deps

# ---------- build ----------
FROM node:22-alpine AS build
WORKDIR /app
COPY db ./db
COPY web ./web
COPY --from=deps /app/web/node_modules ./web/node_modules
WORKDIR /app/web
ENV NEXT_TELEMETRY_DISABLED=1
# NEXT_PUBLIC_* инлайнятся в бандл при сборке (не читаются из runtime env).
# web/src/lib/cms.ts использует NEXT_PUBLIC_SITE_URL как API_BASE для SSR-fetch
# к собственным роутам /api/content/* — без абсолютного URL Node fetch падает,
# и сайт рендерится с пустыми секциями. Значение по умолчанию — заглушка для
# локальной сборки; на VPS переопределяется через --build-arg.
ARG NEXT_PUBLIC_SITE_URL=http://localhost:3000
ENV NEXT_PUBLIC_SITE_URL=${NEXT_PUBLIC_SITE_URL}
RUN npm run build

# ---------- runner ----------
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOST=0.0.0.0
ENV PORT=3000
# Без HOSTNAME next/image и встроенный healthcheck биндятся на имя
# контейнера (Docker по умолчанию), а не на 0.0.0.0, и healthcheck
# `wget http://localhost:3000/ → Connection refused` уходит в loop.
# См. DEPLOY-BLOCKERS (4).md, замечание 2.
ENV HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Next standalone (монорепо): server.js под web/, public + static рядом
COPY --from=build /app/web/public ./web/public
COPY --from=build --chown=nextjs:nodejs /app/web/.next/standalone ./
COPY --from=build --chown=nextjs:nodejs /app/web/.next/static ./web/.next/static

# каталог под общий volume загрузок
RUN mkdir -p /app/web/public/uploads && chown -R nextjs:nodejs /app/web/public

USER nextjs
EXPOSE 3000
CMD ["node", "web/server.js"]
