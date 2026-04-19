#!/usr/bin/env bash
set -e

cd "$(dirname "$0")"

cyan() { printf "\033[36m%s\033[0m\n" "$1"; }
green() { printf "\033[32m%s\033[0m\n" "$1"; }
yellow() { printf "\033[33m%s\033[0m\n" "$1"; }
red() { printf "\033[31m%s\033[0m\n" "$1"; }

cyan "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
cyan "  Money Exchange — One-step Setup"
cyan "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

FRESH=""
if [ "$1" = "--fresh" ]; then
    FRESH="--fresh"
    yellow "→ Fresh mode: database will be dropped & recreated."
fi

LOCK_FILE="storage/app/.installed"
if [ -f "$LOCK_FILE" ] && [ -z "$FRESH" ]; then
    red "✘ Setup has already been run on this machine."
    yellow "  Installed at: $(cat "$LOCK_FILE")"
    yellow "  Lock file   : $LOCK_FILE"
    yellow ""
    yellow "  To re-install (WIPES ALL DATA):  ./setup.sh --fresh"
    yellow "  To unlock manually             :  rm $LOCK_FILE"
    exit 1
fi

if [ ! -f .env ]; then
    yellow "→ .env not found — copying from .env.example"
    cp .env.example .env
fi

if [ ! -d vendor ]; then
    cyan "→ Installing PHP dependencies (composer install)…"
    composer install --no-interaction --prefer-dist
else
    green "✓ vendor/ already present — skipping composer install"
fi

if [ ! -d node_modules ]; then
    cyan "→ Installing Node dependencies (npm install)…"
    npm install --legacy-peer-deps
else
    green "✓ node_modules/ already present — skipping npm install"
fi

cyan "→ Running app:install (creates DB, migrates, seeds)…"
php artisan app:install $FRESH

green ""
green "✓ All done. Start the app with:"
green "    composer dev"
green ""
