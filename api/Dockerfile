# Laravel 11 production image for Render.
# Uses PHP 8.4 + Apache. Apache rewrites to /public/index.php for Laravel.
# 8.4 matches the local dev image (laravelsail/php84-composer) so composer.lock
# (which pulled in Symfony v8 components requiring PHP >= 8.4) installs cleanly.

FROM php:8.4-apache

ENV APACHE_DOCUMENT_ROOT=/var/www/html/public

RUN apt-get update && apt-get install -y --no-install-recommends \
        git \
        unzip \
        curl \
        libzip-dev \
        libpng-dev \
        libonig-dev \
        libxml2-dev \
        libsqlite3-dev \
        libpq-dev \
        libcurl4-openssl-dev \
        libssl-dev \
        libicu-dev \
    && rm -rf /var/lib/apt/lists/* \
    && docker-php-ext-install \
        pdo \
        pdo_mysql \
        pdo_pgsql \
        pdo_sqlite \
        mbstring \
        zip \
        bcmath \
        intl \
        opcache \
    && a2enmod rewrite headers

# Point Apache to Laravel's /public folder. Use double quotes so $APACHE_DOCUMENT_ROOT
# expands at build time (Apache config doesn't expand env vars by default).
RUN sed -ri -e "s!/var/www/html!${APACHE_DOCUMENT_ROOT}!g" \
        /etc/apache2/sites-available/000-default.conf \
        /etc/apache2/apache2.conf \
        /etc/apache2/conf-available/*.conf

# Composer (multi-stage copy from official image)
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

# Install PHP deps first for better layer caching.
# COMPOSER_MEMORY_LIMIT=-1 avoids OOM on constrained build hosts (Render free tier).
COPY composer.json composer.lock ./
RUN COMPOSER_MEMORY_LIMIT=-1 composer install \
        --no-dev \
        --no-scripts \
        --no-interaction \
        --prefer-dist \
        --optimize-autoloader

COPY . .

RUN composer dump-autoload --optimize \
    && mkdir -p storage/framework/{cache,sessions,views} storage/logs bootstrap/cache \
    && chown -R www-data:www-data storage bootstrap/cache \
    && chmod -R ug+rwX storage bootstrap/cache

# Render injects $PORT at runtime. Render's free tier defaults to 10000; Apache must listen there.
ENV PORT=10000
EXPOSE 10000

COPY docker/entrypoint.sh /usr/local/bin/entrypoint.sh
# Strip Windows CRLF in case the file was committed with CRLF line endings.
RUN sed -i 's/\r$//' /usr/local/bin/entrypoint.sh \
    && chmod +x /usr/local/bin/entrypoint.sh

CMD ["/usr/local/bin/entrypoint.sh"]
