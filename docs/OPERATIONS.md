# Self-Hosting & Operations Guide: Analog SM (MVP)

## 1. Prerequisites
- **Docker & Docker Compose:** Installed on a Linux VPS or local server.
- **Domain Name:** Configured to point to your server's IP.
- **SMTP Service:** (Optional but recommended) For "Forgot Password" emails (e.g., SendGrid, Mailgun, or your own SMTP server).

## 2. Fast-Track Deployment
1. Create a directory for your instance: `mkdir analog-sm && cd analog-sm`.
2. Create a `.env` file from the `.env.example`.
3. Create a `docker-compose.yml` file.
4. Run `docker-compose up -d`.

## 3. Configuration (`.env`)
Required environment variables:
- `DATABASE_URL`: `postgresql://user:pass@postgres:5432/analogdb`
- `NEXTAUTH_SECRET`: A long, random string.
- `NEXTAUTH_URL`: `https://yourdomain.com`
- `S3_ENDPOINT`: `http://minio:9000`
- `S3_ACCESS_KEY`: Your Minio access key.
- `S3_SECRET_KEY`: Your Minio secret key.
- `S3_BUCKET`: `analog-sm`
- `SMTP_SERVER`: (Optional) `smtp.example.com`

## 4. Persistence & Networking
The application container is **stateless** and communicates with all services via the network. No host volumes are mounted to the app container in production.

To ensure data survives container restarts, the following **named volumes** are managed by Docker for the background services:
- `postgres_data`: Persistent storage for the PostgreSQL database.
- `minio_data`: Persistent storage for the Minio object store.

*Note: These volumes are internal to the Docker environment and are accessed by the app via the `DATABASE_URL` and `S3_ENDPOINT` network protocols.*

## 5. Maintenance Operations

### 5.1 Backups
Since the app is stateless, you only need to backup the service data:
```bash
# Database snapshot (Network call)
docker-compose exec postgres pg_dump -U user analogdb > backup-db-$(date +%F).sql

# Object Storage backup
# (Use the 'mc' mirror command or backup the named volume directory)
tar -czf backup-media-$(date +%F).tar.gz /var/lib/docker/volumes/analog-sm_minio_data/_data
```

### 5.2 Updates
1. `docker-compose pull`
2. `docker-compose up -d`
3. Database migrations are handled automatically on container start.

### 5.3 Resetting the Instance
To wipe all data (DANGER!):
1. `docker-compose down`
2. `rm -rf ./db ./uploads`
3. `docker-compose up -d`

## 6. Reverse Proxy (Caddy Example)
We recommend using Caddy for automatic SSL:
```Caddyfile
yourdomain.com {
    reverse_proxy localhost:3000
}
```

## 7. Troubleshooting
- **Logs:** `docker-compose logs -f app`.
- **Permission Errors:** Ensure the `db` and `uploads` directories on the host are writable by the user running Docker.
- **Image Upload Failures:** Check the `max_body_size` of your reverse proxy (Caddy/Nginx) if using one.
