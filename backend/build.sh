#!/usr/bin/env bash
set -e

# Move into the backend folder where manage.py and requirements.txt live
cd backend

# Install dependencies
pip install -r requirements.txt

# Apply migrations
python manage.py migrate --noinput

# Run idempotent seed script (no duplicate errors)
python seed_store.py

# Collect static files
python manage.py collectstatic --noinput
