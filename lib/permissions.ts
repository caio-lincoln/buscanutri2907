/**
 * Role-based permissions system for BuscaNutri platform
 */

export type UserRole = 'paciente' | 'nutricionista' | 'empresa' | 'admin';

export type Permission = 
  // General permissions
  | 'read'
  | 'write'
  | 'delete'
  
  // Patient-specific permissions
  | 'book_consultations'
  | 'view_own_consultations'
  | 'rate_nutritionists'
  | 'access_anamnese'
  | 'use_iris_bot'
  | 'view_public_content'
  
  // Nutritionist-specific permissions
  | 'manage_consultations'
  | 'manage_agenda'
  | 'create_blog_posts'
  | 'moderate_content'
  | 'view_patient_data'
  | 'respond_to_questions'
  
  // Company-specific permissions
  | 'manage_jobs'
  | 'view_candidates'
  | 'post_opportunities'
  | 'access_company_dashboard'
  
  // Admin permissions
  | 'manage_users'
  | 'manage_system'
  | 'delete_any_content'
  | 'moderate_all_content'
  | 'view_analytics'
  | 'manage_platform_settings';

/**
 * Role-based permission mapping
 */
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  paciente: [
    'read',
    'write',
    'book_consultations',
    'view_own_consultations',
    'rate_nutritionists',
    'access_anamnese',
    'use_iris_bot',
    'view_public_content'
  ],
  
  nutricionista: [
    'read',
    'write',
    'delete', // Can delete own content
    'manage_consultations',
    'manage_agenda',
    'create_blog_posts',
    'moderate_content', // Can moderate content in their areas
    'view_patient_data',
    'respond_to_questions',
    'view_public_content'
  ],
  
  empresa: [
    'read',
    'write',
    'manage_jobs',
    'view_candidates',
    'post_opportunities',
    'access_company_dashboard',
    'view_public_content'
  ],
  
  admin: [
    'read',
    'write',
    'delete',
    'manage_users',
    'manage_system',
    'delete_any_content',
    'moderate_all_content',
    'view_analytics',
    'manage_platform_settings',
    'book_consultations',
    'view_own_consultations',
    'rate_nutritionists',
    'access_anamnese',
    'use_iris_bot',
    'manage_consultations',
    'manage_agenda',
    'create_blog_posts',
    'moderate_content',
    'view_patient_data',
    'respond_to_questions',
    'manage_jobs',
    'view_candidates',
    'post_opportunities',
    'access_company_dashboard',
    'view_public_content'
  ]
};

/**
 * Check if a user has a specific permission
 */
export function hasPermission(userRole: UserRole, permission: Permission): boolean {
  const rolePermissions = ROLE_PERMISSIONS[userRole];
  return rolePermissions.includes(permission);
}

/**
 * Check if a user has any of the specified permissions
 */
export function hasAnyPermission(userRole: UserRole, permissions: Permission[]): boolean {
  return permissions.some(permission => hasPermission(userRole, permission));
}

/**
 * Check if a user has all of the specified permissions
 */
export function hasAllPermissions(userRole: UserRole, permissions: Permission[]): boolean {
  return permissions.every(permission => hasPermission(userRole, permission));
}

/**
 * Get all permissions for a specific role
 */
export function getRolePermissions(userRole: UserRole): Permission[] {
  return ROLE_PERMISSIONS[userRole] || [];
}

/**
 * Check if user can delete content (own content or admin)
 */
export function canDeleteContent(userRole: UserRole, isOwnContent: boolean = false): boolean {
  if (userRole === 'admin') {
    return hasPermission(userRole, 'delete_any_content');
  }
  
  if (isOwnContent && (userRole === 'nutricionista' || userRole === 'empresa')) {
    return hasPermission(userRole, 'delete');
  }
  
  return false;
}

/**
 * Check if user can moderate content
 */
export function canModerateContent(userRole: UserRole): boolean {
  return hasPermission(userRole, 'moderate_content') || hasPermission(userRole, 'moderate_all_content');
}

/**
 * Dashboard-specific permission checks
 */
export const DashboardPermissions = {
  // Patient dashboard permissions
  patient: {
    canAccessAnamnese: (userRole: UserRole) => hasPermission(userRole, 'access_anamnese'),
    canBookConsultations: (userRole: UserRole) => hasPermission(userRole, 'book_consultations'),
    canUseIrisBot: (userRole: UserRole) => hasPermission(userRole, 'use_iris_bot'),
    canRateNutritionists: (userRole: UserRole) => hasPermission(userRole, 'rate_nutritionists'),
    canViewPublicContent: (userRole: UserRole) => hasPermission(userRole, 'view_public_content')
  },
  
  // Nutritionist dashboard permissions
  nutritionist: {
    canManageConsultations: (userRole: UserRole) => hasPermission(userRole, 'manage_consultations'),
    canManageAgenda: (userRole: UserRole) => hasPermission(userRole, 'manage_agenda'),
    canCreateBlogPosts: (userRole: UserRole) => hasPermission(userRole, 'create_blog_posts'),
    canModerateContent: (userRole: UserRole) => canModerateContent(userRole),
    canViewPatientData: (userRole: UserRole) => hasPermission(userRole, 'view_patient_data'),
    canRespondToQuestions: (userRole: UserRole) => hasPermission(userRole, 'respond_to_questions')
  },
  
  // Company dashboard permissions
  company: {
    canManageJobs: (userRole: UserRole) => hasPermission(userRole, 'manage_jobs'),
    canViewCandidates: (userRole: UserRole) => hasPermission(userRole, 'view_candidates'),
    canPostOpportunities: (userRole: UserRole) => hasPermission(userRole, 'post_opportunities'),
    canAccessDashboard: (userRole: UserRole) => hasPermission(userRole, 'access_company_dashboard')
  }
};
