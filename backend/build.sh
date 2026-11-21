#!/usr/bin/env bash
# Render.com build script for Django backend
set -o errexit

pip install --upgrade pip setuptools wheel
pip install -r requirements.txt

python manage.py collectstatic --no-input
python fix_migrations.py
python manage.py migrate
python create_admin.py
python manage.py loaddata seed_data.json

