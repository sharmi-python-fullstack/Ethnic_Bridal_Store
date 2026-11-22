#!/usr/bin/env bash
# Render build script. This file intentionally lives in backend/ because
# the deployed service uses backend as its root directory.
set -o errexit

pip install --upgrade pip setuptools wheel
pip install -r requirements.txt

python manage.py collectstatic --no-input
python fix_migrations.py
python manage.py migrate
python create_admin.py
python seed_store.py
