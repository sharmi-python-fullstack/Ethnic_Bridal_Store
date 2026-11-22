#!/usr/bin/env bash
set -e

# Move to the project root (where manage.py lives)
cd "$(dirname "$0")/.."

# Install Python dependencies
pip install -r requirements.txt

# Apply migrations
python manage.py migrate --noinput

# Run the idempotent seed script (safe to re-run, no duplicates)
python seed_store.py

# Collect static files
python manage.py collectstatic --noinput
