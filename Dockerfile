# --- Stage 1: Build React Frontend ---
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend

# Copy dependencies list
COPY frontend/package*.json ./

# Install packages
RUN npm ci

# Set build arguments for Supabase (Vite embeds them at build time)
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY

ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY

# Copy frontend source code
COPY frontend/ ./

# Build frontend
RUN npm run build

# --- Stage 2: Install Composer Dependencies ---
FROM composer:2 AS composer-builder
WORKDIR /app

# Copy Composer files
COPY composer.json composer.lock ./

# Install dependencies
RUN composer install --no-dev --optimize-autoloader --no-interaction

# --- Stage 3: Execution environment (Apache + PHP) ---
FROM php:8.2-apache

# Install required system libraries and PHP extensions (PDO MySQL, GD for images, zip)
RUN apt-get update && apt-get install -y \
    libpng-dev \
    libjpeg-dev \
    libfreetype6-dev \
    libzip-dev \
    unzip \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install pdo_mysql gd zip \
    && a2enmod rewrite \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /var/www/html

# Copy root PHP files and directories
COPY . .

# Copy vendor dependencies from Composer stage
COPY --from=composer-builder /app/vendor/ ./vendor/

# Copy built React frontend assets from Node stage
COPY --from=frontend-builder /app/frontend/dist/ ./frontend/dist/

# Ensure proper permissions for Apache
RUN chown -R www-data:www-data /var/www/html

# Expose HTTP port
EXPOSE 80
