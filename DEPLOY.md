# OncoAI — Deployment Guide

## Quick Start (Docker)

```bash
# 1. Clone and configure
git clone <repo-url> oncoai
cd oncoai
cp .env.example .env
# Edit .env with your settings (especially SECRET_KEY and DB_PASSWORD)

# 2. Start everything
docker compose up -d

# 3. Access at http://localhost:8000
```

## Production Deployment

### Option A: Docker (Recommended)

```bash
# 1. Set production environment
export DB_PASSWORD=$(openssl rand -hex 32)
export SECRET_KEY=$(openssl rand -hex 32)

# 2. Generate SSL certificate
./scripts/generate-ssl.sh
# Or use Let's Encrypt:
# sudo certbot certonly --standalone -d oncoai.health

# 3. Start with production profile (includes Nginx + SSL)
docker compose --profile production up -d

# 4. Access at https://your-domain.com
```

### Option B: Direct Install (Ubuntu/Debian)

```bash
# 1. Install dependencies
sudo apt update && sudo apt install -y python3.12 python3.12-venv postgresql nginx

# 2. Setup database
sudo -u postgres createuser oncoai
sudo -u postgres createdb oncoai -O oncoai
sudo -u postgres psql -c "ALTER USER oncoai PASSWORD 'your_password';"

# 3. Setup application
python3.12 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# 4. Configure environment
cp .env.example .env
# Edit .env with DATABASE_URL=postgresql://oncoai:your_password@localhost/oncoai

# 5. Start with gunicorn
gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker -b 0.0.0.0:8000

# 6. Setup Nginx (copy nginx.conf to /etc/nginx/sites-available/)
# 7. Setup systemd service (see below)
```

### Systemd Service

Create `/etc/systemd/system/oncoai.service`:

```ini
[Unit]
Description=OncoAI Oncology Platform
After=network.target postgresql.service

[Service]
User=oncoai
WorkingDirectory=/opt/oncoai
EnvironmentFile=/opt/oncoai/.env
ExecStart=/opt/oncoai/.venv/bin/gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker -b 0.0.0.0:8000
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable oncoai
sudo systemctl start oncoai
```

## Backups

```bash
# Manual backup
./scripts/backup.sh

# Setup daily backup (2 AM)
echo "0 2 * * * /opt/oncoai/scripts/backup.sh" | crontab -

# Restore from backup
./scripts/restore.sh /backups/oncoai/db_20260618_020000.sql.gz
```

## SSL with Let's Encrypt (Free)

```bash
sudo apt install certbot
sudo certbot certonly --standalone -d oncoai.health
# Certificates saved to /etc/letsencrypt/live/oncoai.health/

# Auto-renew
echo "0 0 1 * * certbot renew --quiet" | sudo crontab -
```

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `SECRET_KEY` | Yes | JWT signing key (min 32 chars) |
| `OPENAI_API_KEY` | No | Enables GPT-4o AI summaries |
| `PORT` | No | Server port (default: 8000) |
| `WORKERS` | No | Gunicorn workers (default: 4) |

## Security Checklist

- [ ] Change `SECRET_KEY` to a random string
- [ ] Set strong `DB_PASSWORD`
- [ ] Enable HTTPS/SSL
- [ ] Set `ALLOWED_HOSTS` to your domain
- [ ] Enable firewall (only allow 80, 443)
- [ ] Setup automated backups
- [ ] Review and restrict CORS if needed
- [ ] Change default admin credentials after first login
