#!/usr/bin/env python3
"""Generate ops/.env for the Diva production stack.

Usage: python3 gen-env.py <pg_password> <bot_token> <rop_chat_id>
"""
import os
import secrets
import sys


if len(sys.argv) != 4:
    print("Usage: python3 gen-env.py <pg_password> <bot_token> <rop_chat_id>")
    sys.exit(1)

pg_pass, bot_token, rop_chat_id = sys.argv[1:]
domain = os.environ.get("DOMAIN", "diva-start-up.ru")
admin_domain = os.environ.get("ADMIN_DOMAIN", f"admin.{domain}")
acme_email = os.environ.get("ACME_EMAIL", "")
site_url = os.environ.get("NEXT_PUBLIC_SITE_URL", f"https://{domain}")
web_base_url = os.environ.get("WEB_BASE_URL", site_url)
env_path = os.environ.get(
    "ENV_PATH",
    os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".env")),
)

lines = [
    "POSTGRES_USER=diva",
    f"POSTGRES_PASSWORD={pg_pass}",
    "POSTGRES_DB=diva",
    f"DATABASE_URL=postgres://diva:{pg_pass}@postgres:5432/diva",
    f"NEXT_PUBLIC_SITE_URL={site_url}",
    f"ADMIN_SESSION_SECRET={secrets.token_hex(32)}",
    f"BOT_TOKEN={bot_token}",
    f"ROP_CHAT_ID={rop_chat_id}",
    f"WEB_BASE_URL={web_base_url}",
    f"REVALIDATE_SECRET={secrets.token_hex(32)}",
    f"DOMAIN={domain}",
    f"ADMIN_DOMAIN={admin_domain}",
    f"ACME_EMAIL={acme_email}",
]

with open(env_path, "w", encoding="utf-8", newline="\n") as env_file:
    env_file.write("\n".join(lines) + "\n")
os.chmod(env_path, 0o600)

print(f"Created {env_path}")
