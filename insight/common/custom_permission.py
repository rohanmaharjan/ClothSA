from rest_framework import permissions


class IsOwnerOrReadOnly(permissions.BasePermission):
    """
    Custom permission to only allow owners of an object to edit it.
    """

    def has_object_permission(self, request, view, obj):
        # Read permissions are allowed to any request
        if request.method in permissions.SAFE_METHODS:
            return True

        # Write permissions are only allowed to the owner of the profile
        return obj.user == request.user


class IsVendor(permissions.BasePermission):
    """
    Allows access only to vendor users.
    """

    def has_permission(self, request, view):
        # Check if the user is authenticated and has the is_vendor attribute
        return bool(request.user and request.user.is_authenticated and getattr(request.user, 'is_vendor', False))


class IsStaffOfOutlet(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        return bool(request.user and request.user.is_authenticated and request.user.is_staff)


class IsVendorOrStaff(permissions.BasePermission):
    """
    Allows access to users who are either vendors or staff members.
    """

    def has_permission(self, request, view):
        # Check if the user is authenticated
        if not request.user.is_authenticated:
            return False

        # Allow access if the user is a vendor
        if getattr(request.user, 'is_vendor', False):
            return True

        # Fallback to Django staff status
        return bool(request.user.is_staff)

    def has_object_permission(self, request, view, obj):
        # Check if the user is authenticated
        if not request.user.is_authenticated:
            return False

        # Allow access if the user is a vendor
        if getattr(request.user, 'is_vendor', False):
            return True

        # Fallback to Django staff status when no outlet staff model is available
        return bool(request.user.is_staff)
