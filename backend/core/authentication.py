import jwt
from datetime import datetime, timedelta, timezone
from bson import ObjectId
from django.conf import settings
from django.contrib.auth.hashers import make_password, check_password
from rest_framework import authentication, exceptions
from core.db import get_users_col

JWT_SECRET = getattr(settings, 'SECRET_KEY', 'default-jwt-secret-key-logpro-2026')
JWT_ALGORITHM = 'HS256'
ACCESS_TOKEN_LIFETIME = timedelta(minutes=60)
REFRESH_TOKEN_LIFETIME = timedelta(days=7)

class MongoUser:
    """Lightweight user model representing a MongoDB user document."""
    def __init__(self, doc):
        self.id = str(doc.get('_id'))
        self.doc_id = doc.get('_id')
        self.email = doc.get('email', '')
        self.username = doc.get('username', '')
        self.full_name = doc.get('full_name', '')
        self.role = doc.get('role', 'user')  # 'user' or 'admin'
        self.department = doc.get('department', 'General')
        self.employee_id = doc.get('employee_id', '')
        self.is_active = doc.get('is_active', True)
        self.created_at = doc.get('created_at', '')

    @property
    def pk(self):
        return self.id

    @pk.setter
    def pk(self, value):
        self.id = value



    @property
    def is_authenticated(self):
        return True

    @property
    def is_anonymous(self):
        return False

    @property
    def is_staff(self):
        return self.role == 'admin'

    @property
    def is_superuser(self):
        return self.role == 'admin'

    def to_dict(self):
        return {
            'id': self.id,
            'email': self.email,
            'username': self.username,
            'full_name': self.full_name,
            'role': self.role,
            'department': self.department,
            'employee_id': self.employee_id,
            'is_active': self.is_active,
            'created_at': self.created_at
        }

def generate_tokens(user_doc):
    now = datetime.now(timezone.utc)
    user_id = str(user_doc['_id'])
    
    access_payload = {
        'user_id': user_id,
        'email': user_doc.get('email'),
        'role': user_doc.get('role', 'user'),
        'token_type': 'access',
        'iat': now,
        'exp': now + ACCESS_TOKEN_LIFETIME
    }
    
    refresh_payload = {
        'user_id': user_id,
        'token_type': 'refresh',
        'iat': now,
        'exp': now + REFRESH_TOKEN_LIFETIME
    }
    
    access_token = jwt.encode(access_payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
    refresh_token = jwt.encode(refresh_payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
    
    return {
        'access': access_token,
        'refresh': refresh_token,
        'expires_in': int(ACCESS_TOKEN_LIFETIME.total_seconds()),
        'user': {
            'id': user_id,
            'email': user_doc.get('email'),
            'username': user_doc.get('username'),
            'full_name': user_doc.get('full_name'),
            'role': user_doc.get('role', 'user'),
            'department': user_doc.get('department', 'General'),
            'employee_id': user_doc.get('employee_id', '')
        }
    }

def verify_refresh_token(refresh_token):
    try:
        payload = jwt.decode(refresh_token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        if payload.get('token_type') != 'refresh':
            raise exceptions.AuthenticationFailed('Invalid token type.')
        
        user_id = payload.get('user_id')
        user_col = get_users_col()
        try:
            oid = ObjectId(user_id)
            user_doc = user_col.find_one({'_id': oid})
        except Exception:
            user_doc = user_col.find_one({'_id': user_id})
            
        if not user_doc or not user_doc.get('is_active', True):
            raise exceptions.AuthenticationFailed('User account is inactive or not found.')
            
        # Issue new access token
        now = datetime.now(timezone.utc)
        access_payload = {
            'user_id': str(user_doc['_id']),
            'email': user_doc.get('email'),
            'role': user_doc.get('role', 'user'),
            'token_type': 'access',
            'iat': now,
            'exp': now + ACCESS_TOKEN_LIFETIME
        }
        new_access = jwt.encode(access_payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
        return new_access, MongoUser(user_doc)
    except jwt.ExpiredSignatureError:
        raise exceptions.AuthenticationFailed('Refresh token has expired. Please log in again.')
    except jwt.InvalidTokenError:
        raise exceptions.AuthenticationFailed('Invalid refresh token.')

class MongoJWTAuthentication(authentication.BaseAuthentication):
    """
    Custom DRF Authentication class that parses 'Bearer <token>' and queries MongoDB.
    """
    def authenticate(self, request):
        auth_header = request.headers.get('Authorization')
        if not auth_header:
            return None
            
        parts = auth_header.split()
        if len(parts) != 2 or parts[0].lower() != 'bearer':
            return None
            
        token = parts[1]
        try:
            payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
            if payload.get('token_type') != 'access':
                raise exceptions.AuthenticationFailed('Invalid token type: expected access token.')
                
            user_id = payload.get('user_id')
            user_col = get_users_col()
            try:
                oid = ObjectId(user_id)
                user_doc = user_col.find_one({'_id': oid})
            except Exception:
                user_doc = user_col.find_one({'_id': user_id})
                
            if not user_doc:
                raise exceptions.AuthenticationFailed('User not found.')
                
            if not user_doc.get('is_active', True):
                raise exceptions.AuthenticationFailed('User account is inactive.')
                
            return (MongoUser(user_doc), token)
        except jwt.ExpiredSignatureError:
            raise exceptions.AuthenticationFailed('Access token has expired.')
        except jwt.InvalidTokenError:
            raise exceptions.AuthenticationFailed('Invalid authentication token.')
