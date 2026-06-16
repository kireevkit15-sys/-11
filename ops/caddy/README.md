# Caddy (reverse proxy)

## Назначение

SSL-терминация и reverse proxy для прода. Caddy v2 (alpine) запускается в Docker
на VPS, автоматически получает и обновляет TLS-сертификаты Let's Encrypt и
проксирует трафик в контейнеры приложения:

| Хост                | Бэкенд        | Назначение            |
| ------------------- | ------------- | --------------------- |
| `{$DOMAIN}`         | `web:3000`        | Публичный сайт (Next.js) |
| `{$ADMIN_DOMAIN}`   | `diva-admin:3001` | Кастомная админ-панель   |

Сервис `bot` публичного маршрута не имеет.

## Файлы

| Файл                    | Назначение                                          |
| ----------------------- | --------------------------------------------------- |
| `Caddyfile.prod`        | Прод-конфиг, монтируется в контейнер caddy.         |
| `Caddyfile.dev`         | Локальная заглушка на `:8080` (HTTPS отключён).     |
| `whitelist.example.txt` | Пример списка IP/CIDR для ограничения админки.      |

## Env-переменные

Задаются в `ops/.env` (см. `ops/.env.example`) и пробрасываются в контейнер
`caddy` через `docker-compose.prod.yml`:

| Переменная     | Пример                | Описание                                    |
| -------------- | --------------------- | ------------------------------------------- |
| `DOMAIN`       | `diva.example.com`    | Основной домен сайта.                       |
| `ADMIN_DOMAIN` | `admin.diva.example.com` | Домен кастомной админ-панели (diva-admin). |
| `ACME_EMAIL`   | `ops@example.com`     | Email для регистрации в Let's Encrypt.      |

В Caddyfile они подставляются синтаксисом `{$VAR}` на старте процесса.

## Логи

Каждый сайт пишет access-лог в JSON:

- `/var/log/caddy/web-access.log` — публичный сайт
- `/var/log/caddy/admin-access.log` — админка

Каталог `/var/log/caddy` нужно подмонтировать как volume (например,
`caddy-logs:/var/log/caddy`), иначе логи потеряются при пересоздании контейнера.

## Постоянные тома

В `docker-compose.prod.yml` для контейнера `caddy` обязательно сохранять:

- `caddy-data:/data` — приватные ключи и выпущенные сертификаты Let's Encrypt.
  Без него каждый рестарт = новая попытка выпуска (быстро упрётесь в rate-limit).
- `caddy-config:/config` — внутреннее состояние конфигурации.
- `caddy-logs:/var/log/caddy` — access-логи (см. выше).

## IP-whitelist для админки

По умолчанию админка доступна с любого IP (защита — сессия diva-admin).
Чтобы дополнительно ограничить по IP:

1. Скопируйте `whitelist.example.txt` и впишите свои адреса/подсети.
2. В блоке `{$ADMIN_DOMAIN}` файла `Caddyfile.prod` раскомментируйте
   строки `@denied` / `respond @denied 403` и подставьте
   IP-адреса через пробел (CIDR поддерживается, IPv6 тоже).
3. Перезапустите контейнер caddy:
   `docker compose -f ops/docker-compose.prod.yml restart caddy`.

## Валидация конфига локально

```sh
docker run --rm \
  -e DOMAIN=example.com \
  -e ADMIN_DOMAIN=admin.example.com \
  -e ACME_EMAIL=test@example.com \
  -v "$PWD/Caddyfile.prod:/etc/caddy/Caddyfile:ro" \
  caddy:2-alpine \
  caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile
```

## Локальная разработка

Обычно Caddy локально не нужен — открывайте `http://localhost:3000`
(Next.js) напрямую. `Caddyfile.dev` пригодится, если хочется проверить
прокси-слой перед деплоем на VPS.
