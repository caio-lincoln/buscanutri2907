'use client'

import { ReactNode } from 'react';
import { useAuth } from '../../contexts/auth-context';
import { hasPermission, hasAnyPermission, hasAllPermissions, Permission, UserRole } from '../../lib/permissions';

interface PermissionWrapperProps {
  children: ReactNode;
  permission?: Permission;
  permissions?: Permission[];
  requireAll?: boolean; // If true, user must have ALL permissions. If false, user needs ANY permission
  fallback?: ReactNode;
  userRole?: UserRole; // Optional override for user role
}

/**
 * PermissionWrapper component that conditionally renders children based on user permissions
 * 
 * @param children - Content to render if user has required permissions
 * @param permission - Single permission to check
 * @param permissions - Array of permissions to check
 * @param requireAll - If true, user must have ALL permissions. If false, user needs ANY permission (default: false)
 * @param fallback - Content to render if user doesn't have required permissions
 * @param userRole - Optional override for user role (useful for testing or admin impersonation)
 */
export function PermissionWrapper({
  children,
  permission,
  permissions,
  requireAll = false,
  fallback = null,
  userRole
}: PermissionWrapperProps) {
  const { user } = useAuth();
  
  // Get user role from props or auth context
  const currentUserRole = userRole || (user?.user_metadata?.user_type as UserRole);
  
  // If no user or role, don't render
  if (!currentUserRole) {
    return <>{fallback}</>;
  }
  
  let hasRequiredPermission = false;
  
  // Check single permission
  if (permission) {
    hasRequiredPermission = hasPermission(currentUserRole, permission);
  }
  // Check multiple permissions
  else if (permissions && permissions.length > 0) {
    if (requireAll) {
      hasRequiredPermission = hasAllPermissions(currentUserRole, permissions);
    } else {
      hasRequiredPermission = hasAnyPermission(currentUserRole, permissions);
    }
  }
  // If no permissions specified, render children (default behavior)
  else {
    hasRequiredPermission = true;
  }
  
  return hasRequiredPermission ? <>{children}</> : <>{fallback}</>;
}

/**
 * Hook to check permissions in components
 */
export function usePermissions() {
  const { user } = useAuth();
  const userRole = user?.user_metadata?.user_type as UserRole;
  
  return {
    userRole,
    hasPermission: (permission: Permission) => 
      userRole ? hasPermission(userRole, permission) : false,
    hasAnyPermission: (permissions: Permission[]) => 
      userRole ? hasAnyPermission(userRole, permissions) : false,
    hasAllPermissions: (permissions: Permission[]) => 
      userRole ? hasAllPermissions(userRole, permissions) : false,
  };
}
