"""
Fix InconsistentMigrationHistory on Render/PostgreSQL deployments.
Ensures that if 'admin' or 'auth' migrations were prematurely recorded
in django_migrations before 'accounts.0001_initial', the history is repaired automatically.
"""
import os
import sys
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.db import connection
from django.utils import timezone

def run():
    try:
        table_names = connection.introspection.table_names()
        if 'django_migrations' not in table_names:
            print("[fix_migrations] django_migrations table does not exist yet. Safe to run initial migrations.")
            return

        with connection.cursor() as cursor:
            cursor.execute("SELECT COUNT(*) FROM django_migrations WHERE app = 'accounts' AND name = '0001_initial';")
            accounts_migrated = cursor.fetchone()[0] > 0

            cursor.execute("SELECT COUNT(*) FROM django_migrations WHERE app = 'admin' AND name = '0001_initial';")
            admin_migrated = cursor.fetchone()[0] > 0

            customuser_table_exists = 'accounts_customuser' in table_names

            if admin_migrated and not accounts_migrated:
                print("[fix_migrations] Found InconsistentMigrationHistory: admin applied before accounts!")
                if customuser_table_exists:
                    print("[fix_migrations] accounts_customuser table exists. Registering accounts.0001_initial...")
                    now = timezone.now()
                    cursor.execute(
                        "INSERT INTO django_migrations (app, name, applied) VALUES (%s, %s, %s);",
                        ['accounts', '0001_initial', now]
                    )
                else:
                    print("[fix_migrations] accounts_customuser table does not exist. Clearing premature migration records...")
                    cursor.execute("DELETE FROM django_migrations WHERE app IN ('admin', 'auth', 'contenttypes', 'sessions', 'token_blacklist');")
                    # If Postgres, drop any empty auth/admin tables to avoid collision
                    vendor = connection.vendor
                    drop_cascade = " CASCADE" if vendor == 'postgresql' else ""
                    for tbl in ['django_admin_log', 'auth_permission', 'auth_group_permissions', 'auth_group']:
                        if tbl in table_names:
                            cursor.execute(f"DROP TABLE IF EXISTS {tbl}{drop_cascade};")
                print("[fix_migrations] Migration history successfully repaired!")
            else:
                print("[fix_migrations] Migration history is consistent.")
    except Exception as e:
        print(f"[fix_migrations] Warning during check: {e}")

if __name__ == '__main__':
    run()
