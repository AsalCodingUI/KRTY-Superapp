# Vaultwarden (Password)

The studio's password manager: Vaultwarden (a Bitwarden-compatible server)
at https://vault.kretyastudio.com, opened in Kretya Flow from the rail's
Password workspace (`/vault`, PMs and stakeholders). Bitwarden's own clients
(web vault, apps, browser extension) encrypt everything on the device with
the master password; the server only stores ciphertext.

On the VPS (`ssh sumopod`), outside Coolify:

- `/data/vaultwarden/docker-compose.yml` (this folder's copy): behind
  Coolify's Traefik on the `coolify` network, Let's Encrypt certificate.
  `cd /data/vaultwarden && sudo docker compose up -d` after a change.
- `/data/vaultwarden/data`: the database, the server's keys, attachments.
- `/data/vaultwarden/backup.sh`: daily at 02:30 (root crontab), a
  consistent SQLite copy + keys + attachments in `backups/`, 14 kept. Copy
  them off the server too; losing the server without one loses the vault.
- Sign-ups: open only until the owner account exists, then
  `SIGNUPS_ALLOWED: "false"`; people join through an organization invite.
- No `ADMIN_TOKEN`: the /admin page is off.
- Turn on two-step login (authenticator app) for every account.
- Updates: bump the image tag, `docker compose pull && docker compose up -d`.
