#!/bin/sh
set -e

echo "==> Running Laravel setup..."

# Generate key if not set
php artisan key:generate --no-interaction --force

# Run migrations
php artisan migrate --force --no-interaction

# Seed on first run (check if users table is empty)
USER_COUNT=$(php artisan tinker --execute="echo App\Models\User::count();" 2>/dev/null || echo "0")
if [ "$USER_COUNT" = "0" ]; then
    echo "==> Seeding database..."
    php artisan db:seed --force --no-interaction
fi

# Cache config and routes for production
php artisan config:cache
php artisan route:cache
php artisan view:cache

echo "==> Starting services..."
exec /usr/bin/supervisord -c /etc/supervisord.conf
