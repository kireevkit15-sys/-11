# syntax=docker/dockerfile:1.7
# Одноразовый сервис: применяет drizzle-миграции к Postgres перед стартом web/diva-admin.
# Единый источник схемы — migrations/ (сгенерированы из schema.ts). Идемпотентно.
FROM node:22-alpine
WORKDIR /db
COPY package.json package-lock.json* ./
RUN npm install --legacy-peer-deps
COPY . .
CMD ["npx", "drizzle-kit", "migrate"]
