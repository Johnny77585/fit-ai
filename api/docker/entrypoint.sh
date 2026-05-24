#!/usr/bin/env bash
set -e

# Render injects $PORT for the public HTTP listener.
PORT="${PORT:-10000}"

# Make Apache listen on $PORT
sed -ri "s/Listen 80/Listen ${PORT}/" /etc/apache2/ports.conf
sed -ri "s|<VirtualHost \\*:80>|<VirtualHost *:${PORT}>|" /etc/apache2/sites-available/000-default.conf

# First-boot housekeeping. APP_KEY should normally be set via env, but generate one if missing.
if [ -z "${APP_KEY:-}" ]; then
    php artisan key:generate --force
fi

# Run migrations (safe to re-run). Use --force because APP_ENV=production.
php artisan migrate --force || true

# Cache config/routes/views for performance.
php artisan config:cache || true
php artisan route:cache || true
php artisan view:cache || true

# Hand off to Apache in the foreground (so Docker/Render keeps the container alive).
exec apache2-foreground
