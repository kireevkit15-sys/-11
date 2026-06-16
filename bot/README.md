# diva-bot

Telegram bot for the Diva accounting company website.

## What it does

- Receives lead-form submissions from the website backend and forwards them
  to the sales (ROP) chat with inline action buttons (take / spam / forward).
- Will handle user subscriptions to FSI (federal reporting) deadline reminders.

See `docs/01-TZ.md` at the repository root for product context.

## Stack

- Node.js 22, TypeScript (ES2022, NodeNext)
- grammY (Telegram Bot framework)
- drizzle-orm + postgres (DB access)
- zod (env validation)

## Run locally

```bash
cp .env.example .env
# fill in BOT_TOKEN, ROP_CHAT_ID, DATABASE_URL, WEBHOOK_SECRET

npm install
npm run dev          # tsx watch — long-polling against Telegram
```

Useful scripts:

- `npm run typecheck` — `tsc --noEmit`
- `npm run build` — emits to `dist/`
- `npm start` — runs the built bundle

> Windows + PowerShell: invoke npm via `cmd /c npm ...` because `npm.ps1`
> is blocked by the default execution policy.

## Add a command

Open `src/bot.ts` and register the handler on the exported `bot`:

```ts
bot.command('mycmd', async (ctx) => {
  await ctx.reply('hello');
});
```

For inline buttons, follow the `lead:take:<id>` pattern in the same file —
register a `bot.callbackQuery(/^myaction:(.+)$/, ...)` handler and emit the
matching button via `InlineKeyboard` (see `src/notify.ts`).

## Docker

Multi-stage build, no exposed port (long-polling):

```bash
docker build -t diva-bot .
docker run --env-file .env diva-bot
```
