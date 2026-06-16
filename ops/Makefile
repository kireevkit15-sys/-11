# Diva — convenience wrappers around docker compose.
# Run from inside ops/. On Windows use `make` from Git Bash / WSL, or invoke
# the underlying `docker compose ...` commands directly from PowerShell.

.PHONY: dev stop logs rebuild prod-up backup-db

dev:
	docker compose -f docker-compose.dev.yml --env-file .env up -d

stop:
	docker compose -f docker-compose.dev.yml down

logs:
	docker compose -f docker-compose.dev.yml logs -f

rebuild:
	docker compose -f docker-compose.dev.yml build --no-cache

prod-up:
	docker compose -f docker-compose.prod.yml --env-file .env up -d

backup-db:
	./scripts/backup-db.sh
