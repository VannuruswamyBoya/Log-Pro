from rest_framework import permissions

class IsMongoAuthenticated(permissions.BasePermission):
    """Allows access only to authenticated MongoDB users."""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated)

class IsMongoAdmin(permissions.BasePermission):
    """Allows access only to users with role='admin'."""
    def has_permission(self, request, view):
        return bool(
            request.user and 
            request.user.is_authenticated and 
            getattr(request.user, 'role', '') == 'admin'
        )

class IsMongoRegularUser(permissions.BasePermission):
    """Allows access only to users with role='user'."""
    def has_permission(self, request, view):
        return bool(
            request.user and 
            request.user.is_authenticated and 
            getattr(request.user, 'role', '') == 'user'
        )
