#!/bin/bash
# SSL Certificate setup using Certbot
DOMAIN=${1:-app.trustner.in}
EMAIL=${2:-admin@trustner.in}

# Install certbot
apt-get update && apt-get install -y certbot python3-certbot-nginx

# Get certificate
certbot --nginx -d $DOMAIN -m $EMAIL --agree-tos --non-interactive

# Auto-renewal cron
echo "0 12 * * * /usr/bin/certbot renew --quiet" | crontab -

echo "SSL certificate installed for $DOMAIN"
