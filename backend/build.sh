#!/usr/bin/env bash
# Render.com build script for Django backend
set -o errexit

pip install -r requirements.txt

python manage.py collectstatic --no-input
python manage.py migrate
python create_admin.py
python manage.py seed_images

