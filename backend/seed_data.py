import os
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path
import django

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'logpro_backend.settings')
django.setup()

from django.conf import settings
from django.contrib.auth.hashers import make_password
from core.db import get_users_col, get_submissions_col, get_settings_col, init_db_indexes

def seed():
    print("--- Initializing Log Pro MongoDB Collections & Indexes ---")
    init_db_indexes()

    users_col = get_users_col()
    submissions_col = get_submissions_col()
    settings_col = get_settings_col()

    # Create dummy media folder
    media_root = Path(settings.MEDIA_ROOT)
    submissions_dir = media_root / 'submissions' / '2026' / '10'
    submissions_dir.mkdir(parents=True, exist_ok=True)

    # 1. Seed / Upsert Admin User
    admin_email = 'admin@logpro.com'
    admin_user = users_col.find_one({'email': admin_email})
    now_iso = datetime.now(timezone.utc).isoformat()

    if not admin_user:
        admin_data = {
            'email': admin_email,
            'username': 'admin',
            'password_hash': make_password('AdminPassword123!'),
            'full_name': 'Enterprise Administrator',
            'role': 'admin',
            'department': 'Executive Management',
            'employee_id': 'ADM-001',
            'is_active': True,
            'created_at': now_iso,
            'updated_at': now_iso
        }
        res = users_col.insert_one(admin_data)
        admin_id = str(res.inserted_id)
        print(f"Created Admin Account: {admin_email} (Password: AdminPassword123!)")
    else:
        admin_id = str(admin_user['_id'])
        print(f"Admin Account already exists: {admin_email}")

    # 2. Seed Regular Users
    sample_users = [
        {
            'email': 'john.doe@company.com',
            'username': 'john.doe',
            'password_hash': make_password('UserPassword123!'),
            'full_name': 'John Doe',
            'role': 'user',
            'department': 'Engineering',
            'employee_id': 'ENG-1042',
            'is_active': True,
            'created_at': now_iso,
            'updated_at': now_iso
        },
        {
            'email': 'sarah.jenkins@company.com',
            'username': 'sarah.jenkins',
            'password_hash': make_password('UserPassword123!'),
            'full_name': 'Sarah Jenkins',
            'role': 'user',
            'department': 'Product & Design',
            'employee_id': 'PRD-2019',
            'is_active': True,
            'created_at': now_iso,
            'updated_at': now_iso
        },
        {
            'email': 'michael.chang@company.com',
            'username': 'michael.chang',
            'password_hash': make_password('UserPassword123!'),
            'full_name': 'Michael Chang',
            'role': 'user',
            'department': 'Quality Assurance',
            'employee_id': 'QA-3112',
            'is_active': True,
            'created_at': now_iso,
            'updated_at': now_iso
        },
        {
            'email': 'emily.davis@company.com',
            'username': 'emily.davis',
            'password_hash': make_password('UserPassword123!'),
            'full_name': 'Emily Davis',
            'role': 'user',
            'department': 'Operations',
            'employee_id': 'OPS-4401',
            'is_active': True,
            'created_at': now_iso,
            'updated_at': now_iso
        }
    ]

    seeded_users = []
    for u in sample_users:
        existing = users_col.find_one({'email': u['email']})
        if not existing:
            ins = users_col.insert_one(u)
            u['_id'] = ins.inserted_id
            seeded_users.append(u)
            print(f"Created User: {u['email']} (Password: UserPassword123!)")
        else:
            u['_id'] = existing['_id']
            seeded_users.append(u)
            print(f"User already exists: {u['email']}")

    # 3. Seed Sample Files & Historical Submissions across past 5 days
    today = datetime.now()

    for user in seeded_users:
        uid = str(user['_id'])
        # Give each user submissions for past 4 days
        for days_ago in range(4, 0, -1):
            sub_date = today - timedelta(days=days_ago)
            business_date_str = sub_date.strftime('%Y-%m-%d')

            existing_sub = submissions_col.find_one({'user_id': uid, 'business_date': business_date_str})
            if not existing_sub:
                # Alternate between on-time and late for realistic charts
                is_late = (days_ago == 2 and user['username'] == 'michael.chang') or (days_ago == 3 and user['username'] == 'emily.davis')
                status_str = 'LATE' if is_late else 'ON_TIME'
                time_str = "18:45:00" if is_late else "15:30:00"
                sub_timestamp = f"{business_date_str}T{time_str}"

                filename = f"LogSheet_{user['username']}_{business_date_str}.pdf"
                storage_filename = f"seed_{user['username']}_{business_date_str}.pdf"
                file_path = submissions_dir / storage_filename

                # Write a minimal valid PDF file
                pdf_content = (
                    b"%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n"
                    b"2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n"
                    b"3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R >>\nendobj\n"
                    b"4 0 obj\n<< /Length 50 >>\nstream\nBT /F1 12 Tf 72 712 Td (Log Sheet Report) Tj ET\nendstream\nendobj\n"
                    b"xref\n0 5\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \n0000000204 00000 n \n"
                    b"trailer\n<< /Size 5 /Root 1 0 R >>\nstartxref\n304\n%%EOF\n"
                )
                with open(file_path, 'wb') as f:
                    f.write(pdf_content)

                sub_record = {
                    'user_id': uid,
                    'user_name': user['full_name'],
                    'user_email': user['email'],
                    'department': user['department'],
                    'employee_id': user.get('employee_id', ''),
                    'business_date': business_date_str,
                    'storage_filename': storage_filename,
                    'original_filename': filename,
                    'file_format': 'PDF',
                    'file_size': len(pdf_content),
                    'file_path': str(file_path),
                    'upload_timestamp': sub_timestamp,
                    'status': status_str,
                    'is_active': True,
                    'version': 1,
                    'notes': f'Completed daily assigned tasks and logged project hours for {business_date_str}.',
                    'history': [],
                    'created_at': sub_timestamp
                }
                submissions_col.insert_one(sub_record)

    print("\n--- Seed Data Generation Complete! ---")
    print("Default Admin Credentials:")
    print("  Email: admin@logpro.com")
    print("  Password: AdminPassword123!")
    print("\nDefault Regular User Credentials:")
    print("  Email: john.doe@company.com")
    print("  Password: UserPassword123!")
    print("--------------------------------------")

if __name__ == '__main__':
    seed()
