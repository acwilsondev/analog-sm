# Self-Hosting & Operations Guide: Analog SM

## 1. Prerequisites

- **Docker & Docker Compose v2** (`docker compose`, not `docker-compose`)
- **Domain name** pointed at your server
- **SMTP service** (optional) for future password-reset emails

---

## 2. First-Time Deployment

```bash
# 1. Clone the repo
git clone <repo-url> analog-sm && cd analog-sm

# 2. Create your env file
cp .env.example .env
# Edit .env — see Section 3 for required values

# 3. Build and start all services
docker compose up -d --build

# 4. Create the MinIO bucket (required for photo uploads)
docker compose exec minio mc alias set local http://localhost:9000 minioadmin minioadmin
docker compose exec minio mc mb local/analog-sm
docker compose exec minio mc anonymous set public local/analog-sm
```

The entrypoint automatically runs `prisma db push` on every start, so no manual schema step is needed.

---

## 3. Configuration (`.env`)

| Variable | Example | Notes |
|---|---|---|
| `DATABASE_URL` | `postgresql://user:password@postgres:5432/analogdb` | Use `postgres` hostname inside Docker |
| `NEXTAUTH_SECRET` | `openssl rand -hex 32` | Long random string — **change this** |
| `NEXTAUTH_URL` | `https://yourdomain.com` | Must match your public URL exactly |
| `S3_ENDPOINT` | `http://minio:9000` | Use `minio` hostname inside Docker |
| `S3_ACCESS_KEY` | `minioadmin` | Change in production |
| `S3_SECRET_KEY` | `minioadmin` | Change in production |
| `S3_BUCKET` | `analog-sm` | Must match the bucket you created above |

---

## 4. Database Operations

### Seed with demo data (alice / bob / charlie)

```bash
docker compose exec app node_modules/.bin/ts-node \
  --compiler-options '{"module":"CommonJS"}' \
  prisma/seed.ts
# All accounts use password: password123
```

### Seed with load-test data (50 users, ~10k posts)

```bash
docker compose exec app node_modules/.bin/ts-node \
  --compiler-options '{"module":"CommonJS"}' \
  scripts/seed-load-test.ts
# All accounts: <username>@loadtest.local / password123
# Example: happy_fox@loadtest.local
```

### Reset the database (wipe all data)

```bash
# Stop the app first to avoid connection conflicts
docker compose stop app

# Drop and recreate the schema
docker compose exec postgres psql -U user -d analogdb -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"

# Re-apply the schema
docker compose exec postgres sh -c "DATABASE_URL=postgresql://user:password@localhost:5432/analogdb" 
# Schema is re-applied automatically when the app restarts:
docker compose start app
```

Or the nuclear option — wipes the database volume entirely:

```bash
docker compose down -v          # removes named volumes (ALL data lost)
docker compose up -d --build    # fresh start, schema applied on boot
```

### Apply schema changes

Schema changes go in `prisma/schema.prisma`. The entrypoint runs `prisma db push` on every container start, so restarting the app container is sufficient:

```bash
docker compose restart app
```

---

## 5. Routine Maintenance

### View logs

```bash
docker compose logs -f app        # app logs
docker compose logs -f postgres   # DB logs
```

### Update to a new version

```bash
git pull
docker compose up -d --build
# Schema migrations run automatically on restart
```

### Backups

```bash
# Database dump
docker compose exec postgres pg_dump -U user analogdb > backup-db-$(date +%F).sql

# Restore
docker compose exec -T postgres psql -U user analogdb < backup-db-2024-01-01.sql

# Media (MinIO) — backs up the named volume data directory
tar -czf backup-media-$(date +%F).tar.gz \
  $(docker volume inspect analog-sm_minio_data --format '{{ .Mountpoint }}')
```

---

## 6. Reverse Proxy

### Caddy (recommended — handles SSL automatically)

```caddyfile
yourdomain.com {
    reverse_proxy localhost:3000
}
```

### Nginx

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    client_max_body_size 50M;   # required for photo uploads

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

## 7. Troubleshooting

| Symptom | Check |
|---|---|
| App won't start | `docker compose logs app` — usually a missing env var or DB not ready |
| Photos fail to upload | MinIO bucket not created or `client_max_body_size` too low in reverse proxy |
| Auth redirect loops | `NEXTAUTH_URL` doesn't match the URL you're accessing the app on |
| DB connection refused | Postgres container not healthy yet; app will retry on restart |
| Schema out of date | `docker compose restart app` — entrypoint re-runs `prisma db push` |
