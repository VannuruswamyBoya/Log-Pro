from datetime import datetime, timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, exceptions
from django.contrib.auth.hashers import check_password, make_password
from bson import ObjectId

from core.db import get_users_col, log_audit_event
from core.authentication import generate_tokens, verify_refresh_token
from core.permissions import IsMongoAuthenticated, IsMongoAdmin

def get_client_ip(request):
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        return x_forwarded_for.split(',')[0].strip()
    return request.META.get('REMOTE_ADDR', '')

class LoginView(APIView):
    """
    Unified / Role-aware login endpoint.
    Expects { "identifier": "email or username", "password": "...", "portal": "user" | "admin" }
    """
    authentication_classes = []
    permission_classes = []

    def post(self, request):
        identifier = request.data.get('identifier', '').strip().lower()
        password = request.data.get('password', '')
        portal = request.data.get('portal', 'user').lower()

        if not identifier or not password:
            return Response(
                {'detail': 'Email or username and password are required.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        users_col = get_users_col()
        user_doc = users_col.find_one({
            '$or': [
                {'email': identifier},
                {'username': identifier}
            ]
        })

        if not user_doc or not check_password(password, user_doc.get('password_hash', '')):
            log_audit_event(None, identifier, 'FAILED_LOGIN', {'portal': portal}, get_client_ip(request))
            return Response(
                {'detail': 'Invalid credentials. Please verify your email/username and password.'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        if not user_doc.get('is_active', True):
            return Response(
                {'detail': 'Your account has been deactivated. Please contact an administrator.'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Enforce portal role separation
        user_role = user_doc.get('role', 'user')
        if portal == 'admin' and user_role != 'admin':
            log_audit_event(user_doc['_id'], user_doc.get('email'), 'UNAUTHORIZED_ADMIN_PORTAL_ATTEMPT', {}, get_client_ip(request))
            return Response(
                {'detail': 'Access denied: You do not possess administrator credentials.'},
                status=status.HTTP_403_FORBIDDEN
            )

        tokens = generate_tokens(user_doc)
        log_audit_event(user_doc['_id'], user_doc.get('email'), 'LOGIN_SUCCESS', {'portal': portal}, get_client_ip(request))

        return Response(tokens, status=status.HTTP_200_OK)

class RefreshTokenView(APIView):
    """Refreshes an expired access token using a valid refresh token."""
    authentication_classes = []
    permission_classes = []

    def post(self, request):
        refresh = request.data.get('refresh')
        if not refresh:
            return Response({'detail': 'Refresh token is required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            new_access, mongo_user = verify_refresh_token(refresh)
            return Response({
                'access': new_access,
                'user': mongo_user.to_dict()
            }, status=status.HTTP_200_OK)
        except exceptions.AuthenticationFailed as e:
            return Response({'detail': str(e)}, status=status.HTTP_401_UNAUTHORIZED)

class ProfileView(APIView):
    """Retrieve and update current authenticated user profile."""
    permission_classes = [IsMongoAuthenticated]

    def get(self, request):
        return Response(request.user.to_dict())

    def put(self, request):
        users_col = get_users_col()
        user_id = request.user.id
        try:
            oid = ObjectId(user_id)
            query = {'_id': oid}
        except Exception:
            query = {'_id': user_id}

        allowed_fields = ['full_name', 'department', 'employee_id']
        update_data = {}
        for f in allowed_fields:
            if f in request.data:
                update_data[f] = str(request.data[f]).strip()

        # Handle password change if provided
        new_password = request.data.get('new_password')
        current_password = request.data.get('current_password')
        if new_password:
            user_doc = users_col.find_one(query)
            if not current_password or not check_password(current_password, user_doc.get('password_hash', '')):
                return Response(
                    {'detail': 'Current password is required and must be correct to change password.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            if len(new_password) < 6:
                return Response(
                    {'detail': 'New password must be at least 6 characters long.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            update_data['password_hash'] = make_password(new_password)

        if update_data:
            update_data['updated_at'] = datetime.now(timezone.utc).isoformat()
            users_col.update_one(query, {'$set': update_data})
            log_audit_event(user_id, request.user.email, 'PROFILE_UPDATED', {'fields': list(update_data.keys())}, get_client_ip(request))

        fresh_user = users_col.find_one(query)
        from core.authentication import MongoUser
        return Response({
            'message': 'Profile updated successfully.',
            'user': MongoUser(fresh_user).to_dict()
        })

class LogoutView(APIView):
    """Records audit logout event."""
    permission_classes = [IsMongoAuthenticated]

    def post(self, request):
        log_audit_event(
            request.user.id,
            request.user.email,
            'LOGOUT',
            {},
            get_client_ip(request)
        )
        return Response({'message': 'Logged out successfully.'})
