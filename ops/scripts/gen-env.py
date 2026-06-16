#!/usr/bin/env python3
"""Generate ops/.env for the ДИВА project on the server.
Usage: python3 gen-env.py <pg_password> <bot_token> <rop_chat_id>
ADMIN_SESSION_SECRET is generated automatically.
"""
import secrets, sys, os

if len(sys.argv) != 4:
    print("Usage: python3 gen-env.py <pg_password> <bot_token> <rop_chat_id>")
    sys.exit(1)

pg_pass, bot_token, rop_chat_id = sys.argv[1], sys.argv[2], sys.argv[3]
server_ip = "92.246.138.173"

lines = [
    f"POSTGRES_USER=diva",
    f"POSTGRES_PASSWORD={pg_pass}",
    f"POSTGRES_DB=diva",
    f"DATABASE_URL=postgres://diva:{pg_pass}@postgres:5432/diva",
    f"NEXT_PUBLIC_SITE_URL=http://{server_ip}",
    f"ADMIN_SESSION_SECRET={secrets.token_hex(32)}",
    f"BOT_TOKEN={bot_token}",
    f"ROP_CHAT_ID={rop_chat_id}",
    f"WEB_BASE_URL=http://{server_ip}",
    f"DOMAIN=diva-start-up.ru",
    f"ADMIN_DOMAIN=admin.diva-start-up.ru",
    f"ACME_EMAIL=diva.consulting.b@gmail.com",
]

out = os.path.join(os.path.dirname(__file__), "..", ".env")
with open(out, "w", newline="\n") as f:
    f.write("\n".join(lines) + "\n")

print(f"Done! Written to {out}")
