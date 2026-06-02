# diva-cms

Strapi 5 Headless CMS for the Diva accounting website (Next.js consumes its REST/GraphQL API).

## Stack

- Strapi 5 (TypeScript)
- Node 22 (engine pin: `>=20 <=24`)
- SQLite for local dev, PostgreSQL for staging/prod (toggle via `DATABASE_CLIENT`)
- Media stored locally in dev; S3-compatible bucket in prod (configured later in `config/plugins.ts`)

## Quick start (local dev)

```bash
cp .env.example .env
# Fill in random secrets (each value, not the placeholders)
npm install
npm run dev    # alias for `strapi develop`
```

Admin panel: <http://localhost:1337/admin> — first run creates the root admin account.
REST API: <http://localhost:1337/api/{content-type-plural}>

## Adding a content type

Two paths:

1. **Via admin UI** (Content-Type Builder) — Strapi writes schema files into `src/api/<name>/...` for you. Restart auto-triggers.
2. **Manually** — create `src/api/<name>/content-types/<name>/schema.json` plus controller, service, and route files under `src/api/<name>/{controllers,services,routes}/<name>.ts`. Each is a one-liner using `factories.createCoreController('api::<name>.<name>')` (and analogues). Restart `npm run dev`.

After adding, set permissions in admin: **Settings -> Users & Permissions -> Roles -> Public/Authenticated -> enable `find`/`findOne`** for the new collection.

## Production build

```bash
npm run build      # builds admin panel
npm start          # runs server in production mode
```

Or via Docker:

```bash
docker build -t diva-cms .
docker run --env-file .env -p 1337:1337 diva-cms
```

## Project layout

```
src/api/<api-name>/
  content-types/<api-name>/schema.json   # field definitions
  controllers/<api-name>.ts              # core controller
  services/<api-name>.ts                 # core service
  routes/<api-name>.ts                   # core router
config/                                  # server, db, plugins, middlewares
```
