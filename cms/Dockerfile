# syntax=docker/dockerfile:1.7

# ---------- dev (used by docker-compose.dev.yml) ----------
FROM node:22-alpine AS dev
RUN apk add --no-cache build-base gcc autoconf automake zlib-dev libpng-dev vips-dev git python3
WORKDIR /opt/app
COPY package.json package-lock.json* ./
RUN npm install
COPY . .
ENV HOST=0.0.0.0
ENV PORT=1337
ENV PATH=/opt/app/node_modules/.bin:$PATH
RUN mkdir -p /opt/app/.tmp /opt/app/public/uploads \
    && chown -R node:node /opt/app
USER node
EXPOSE 1337
CMD ["npm", "run", "develop"]

# ---------- deps ----------
FROM node:22-alpine AS deps
RUN apk add --no-cache build-base gcc autoconf automake zlib-dev libpng-dev vips-dev git python3
WORKDIR /opt/app
COPY package.json package-lock.json* ./
RUN npm install

# ---------- build ----------
FROM node:22-alpine AS build
RUN apk add --no-cache build-base gcc autoconf automake zlib-dev libpng-dev vips-dev git python3
WORKDIR /opt/app
ENV NODE_ENV=production
ENV NODE_OPTIONS=--max-old-space-size=1024
COPY --from=deps /opt/app/node_modules ./node_modules
COPY . .
RUN npm run build
RUN npm prune --omit=dev

# ---------- runner ----------
FROM node:22-alpine AS runner
RUN apk add --no-cache vips
WORKDIR /opt/app
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=1337
ENV PATH=/opt/app/node_modules/.bin:$PATH

COPY --from=build /opt/app/package.json ./package.json
COPY --from=build /opt/app/package-lock.json* ./
COPY --from=build /opt/app/node_modules ./node_modules
COPY --from=build /opt/app/dist ./dist
COPY --from=build /opt/app/build ./build
COPY --from=build /opt/app/config ./config
COPY --from=build /opt/app/database ./database
COPY --from=build /opt/app/public ./public
COPY --from=build /opt/app/src ./src
COPY --from=build /opt/app/favicon.png ./favicon.png
COPY --from=build /opt/app/tsconfig.json ./tsconfig.json

RUN mkdir -p /opt/app/.tmp /opt/app/public/uploads \
    && chown -R node:node /opt/app

USER node
EXPOSE 1337
CMD ["npm", "start"]
