#!/usr/bin/env bash
set -e

# Render injects $PORT for the public HTTP listener.
PORT="${PORT:-10000}"

# Make Apache listen on $PORT
sed -ri "s/Listen 80/Listen ${PORT}/" /etc/apache2/ports.conf
sed -ri "s|<VirtualHost \\*:80>|<VirtualHost *:${PORT}>|" /etc/apache2/sites-available/000-default.conf

# First-boot housekeeping. Laravel's Encrypter requires APP_KEY to be either:
#   - "base64:<44-char-base64>" (32 raw bytes), or
#   - a raw 32-byte string (legacy).
# Render's `generateValue: true` produces a random string that doesn't match either,
# which makes Laravel throw "Unsupported cipher or incorrect key length" at boot.
# So we regenerate whenever the value isn't a valid base64-prefixed key.
if [[ ! "${APP_KEY:-}" =~ ^base64:[A-Za-z0-9+/]{43}=$ ]]; then
    echo "APP_KEY missing or malformed; generating a new one for this container."
    php artisan key:generate --force --show > /tmp/.appkey
    export APP_KEY="$(cat /tmp/.appkey)"
    rm -f /tmp/.appkey
fi

# Run migrations (safe to re-run). Use --force because APP_ENV=production.
php artisan migrate --force || true

# Clear any stale caches from previous container runs / build steps first,
# otherwise an old APP_KEY (or any env value) baked into bootstrap/cache/config.php
# will keep being used even after the env var is updated in the dashboard.
php artisan config:clear || true
php artisan route:clear || true
php artisan view:clear || true

# Cache config/routes/views for performance.
php artisan config:cache || true
php artisan route:cache || true
php artisan view:cache || true

# Hand off to Apache in the foreground (so Docker/Render keeps the container alive).
exec apache2-foreground
