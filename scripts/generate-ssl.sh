#!/bin/bash
# ═══════════════════════════════════════════════════════
#  OncoAI — Generate Self-Signed SSL Certificate
#  For testing only. Use Let's Encrypt for production.
# ═══════════════════════════════════════════════════════

SSL_DIR="$(dirname "$0")/../ssl"
mkdir -p "$SSL_DIR"

openssl req -x509 -nodes -days 365 \
    -newkey rsa:2048 \
    -keyout "$SSL_DIR/oncoai.key" \
    -out "$SSL_DIR/oncoai.crt" \
    -subj "/C=TZ/ST=Dar es Salaam/L=Dar es Salaam/O=OncoAI/CN=oncoai.health"

echo "SSL certificate generated:"
ls -la "$SSL_DIR"
echo ""
echo "For production, use Let's Encrypt:"
echo "  sudo certbot certonly --standalone -d oncoai.health"
