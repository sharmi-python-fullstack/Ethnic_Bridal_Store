"""
Fix InconsistentMigrationHistory and Ghost Tables on Render/PostgreSQL deployments.
Cleans up partial/corrupted ghost tables on initial deployments so Django can
run fresh, consistent migrations.
"""
import os
import sys
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.db import connection

def run():
    vendor = connection.vendor
    print(f"[fix_migrations] Database vendor: {vendor}")

    try:
        table_names = connection.introspection.table_names()
        print(f"[fix_migrations] Existing tables: {len(table_names)} found.")

        # Check if user table exists
        has_user_table = 'accounts_customuser' in table_names

        # If accounts_customuser does NOT exist, but ghost tables exist (like django_content_type),
        # this indicates a corrupted/interrupted initial database on Render.
        if not has_user_table and len(table_names) > 0:
            print("[fix_migrations] Detected corrupt/ghost tables before initial migration. Cleaning public schema...")
            if vendor == 'postgresql':
                with connection.cursor() as cursor:
                    cursor.execute("""
                        DO $$ DECLARE
                            r RECORD;
                        BEGIN
                            FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
                                EXECUTE 'DROP TABLE IF EXISTS ' || quote_ident(r.tablename) || ' CASCADE';
                            END LOOP;
                        END $$;
                    """)
                print("[fix_migrations] PostgreSQL public schema successfully wiped clean of ghost tables.")
            return

        print("[fix_migrations] Database is consistent and ready.")
    except Exception as e:
        print(f"[fix_migrations] Warning during check: {e}")

if __name__ == '__main__':
    run()
