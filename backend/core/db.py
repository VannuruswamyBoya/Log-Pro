import os
from datetime import datetime, timezone
import pymongo
from pymongo import MongoClient, ASCENDING, DESCENDING
from django.conf import settings

_mongo_client = None

def get_mongo_client():
    global _mongo_client
    if _mongo_client is None:
        raw_uri = getattr(settings, 'MONGO_URI', None) or os.getenv('MONGODB_URI') or os.getenv('MONGO_URI') or 'mongodb://localhost:27017/'
        mongo_uri = str(raw_uri).strip('"\'')
        _mongo_client = MongoClient(mongo_uri, serverSelectionTimeoutMS=10000)
    return _mongo_client

def get_db():
    client = get_mongo_client()
    raw_db_name = getattr(settings, 'MONGO_DB_NAME', None) or os.getenv('MONGO_DB_NAME') or 'log_sheet_system'
    db_name = str(raw_db_name).strip('"\'')
    return client[db_name]


def get_users_col():
    return get_db()['users']

def get_submissions_col():
    return get_db()['submissions']

def get_settings_col():
    return get_db()['system_settings']

def get_audit_logs_col():
    return get_db()['audit_logs']

def init_db_indexes():
    """Ensure all critical indexes exist for fast queries and integrity."""
    db = get_db()
    
    # Users collection indexes
    users = db['users']
    users.create_index([('email', ASCENDING)], unique=True)
    users.create_index([('username', ASCENDING)], unique=True)
    users.create_index([('role', ASCENDING)])
    users.create_index([('department', ASCENDING)])
    
    # Submissions collection indexes
    submissions = db['submissions']
    submissions.create_index([('user_id', ASCENDING), ('business_date', ASCENDING)])
    submissions.create_index([('business_date', DESCENDING)])
    submissions.create_index([('status', ASCENDING)])
    submissions.create_index([('upload_timestamp', DESCENDING)])
    submissions.create_index([('is_active', ASCENDING)])
    
    # Audit logs indexes
    audit = db['audit_logs']
    audit.create_index([('timestamp', DESCENDING)])
    audit.create_index([('user_id', ASCENDING)])
    audit.create_index([('action', ASCENDING)])
    
    # Ensure default system settings exist
    settings_col = db['system_settings']
    default_settings = settings_col.find_one({'key': 'global_config'})
    if not default_settings:
        settings_col.insert_one({
            'key': 'global_config',
            'daily_deadline': '17:00',  # 5:00 PM local time
            'allow_replacement_before_deadline': True,
            'max_file_size_mb': 10,
            'allowed_extensions': ['pdf', 'doc', 'docx', 'txt'],
            'company_name': 'Log Pro Enterprise',
            'updated_at': datetime.now(timezone.utc).isoformat(),
            'updated_by': 'system'
        })
    
    return True

def log_audit_event(user_id, user_email, action, details=None, ip_address=''):
    """Record audit log entry for actions (login, uploads, exports, etc.)."""
    try:
        get_audit_logs_col().insert_one({
            'user_id': str(user_id) if user_id else None,
            'user_email': user_email or 'anonymous',
            'action': action,
            'details': details or {},
            'ip_address': ip_address,
            'timestamp': datetime.now(timezone.utc).isoformat()
        })
    except Exception as e:
        print(f"Failed to write audit log: {e}")
