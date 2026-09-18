/**
 * Role-Based Access Control (RBAC) System
 * Defines user roles, granular permissions, and permission check utilities.
 */

export const ROLES = {
  SUPER_ADMIN: 'super_admin',       // Platform owner / SaaS administrator
  BUSINESS_OWNER: 'business_owner', // Business / store owner with full tenant control
  BUSINESS_STAFF: 'business_staff', // Front-desk / staff with operational access
  CUSTOMER: 'customer',             // End-user / reviewer (public QR access)
};

export const ROLE_LABELS = {
  [ROLES.SUPER_ADMIN]: 'Super Admin',
  [ROLES.BUSINESS_OWNER]: 'Business Owner',
  [ROLES.BUSINESS_STAFF]: 'Staff Member',
  [ROLES.CUSTOMER]: 'Reviewer / Customer',
};

export const PERMISSIONS = {
  // Business Settings & Workspace
  BIZ_VIEW_ANALYTICS: 'biz:view_analytics',
  BIZ_UPDATE_PROFILE: 'biz:update_profile',
  BIZ_DELETE: 'biz:delete',
  BIZ_SWITCH_LOCATION: 'biz:switch_location',

  // Billing & Subscriptions
  BILLING_VIEW: 'billing:view',
  BILLING_MANAGE: 'billing:manage',
  BILLING_UPGRADE: 'billing:upgrade',
  BILLING_CANCEL: 'billing:cancel',

  // Team & Member Management
  TEAM_VIEW: 'team:view',
  TEAM_INVITE: 'team:invite',
  TEAM_REMOVE: 'team:remove',
  TEAM_CHANGE_ROLE: 'team:change_role',

  // Review Operations & Campaigns
  CAMPAIGN_SEND_WHATSAPP: 'campaign:send_whatsapp',
  CAMPAIGN_SEND_SMS: 'campaign:send_sms',
  STANDEE_DESIGN_CUSTOM: 'standee:design_custom',
  STANDEE_EXPORT_HD: 'standee:export_hd',
  REVIEWS_VIEW: 'reviews:view',
  REVIEWS_AI_REPLY: 'reviews:ai_reply',
  REVIEWS_EXPORT_CSV: 'reviews:export_csv',

  // Super Admin Platform Oversight
  ADMIN_PORTAL_ACCESS: 'admin:portal_access',
  ADMIN_VIEW_SAAS_METRICS: 'admin:view_saas_metrics',
  ADMIN_MANAGE_BUSINESSES: 'admin:manage_businesses',
  ADMIN_MANAGE_PLANS: 'admin:manage_plans',
  ADMIN_IMPERSONATE_USER: 'admin:impersonate_user',
};

// Map each role to its permitted actions
const ROLE_PERMISSIONS = {
  [ROLES.SUPER_ADMIN]: [
    // Super Admin has all permissions across platform and tenant workspaces
    ...Object.values(PERMISSIONS),
  ],

  [ROLES.BUSINESS_OWNER]: [
    // Business Workspace
    PERMISSIONS.BIZ_VIEW_ANALYTICS,
    PERMISSIONS.BIZ_UPDATE_PROFILE,
    PERMISSIONS.BIZ_DELETE,
    PERMISSIONS.BIZ_SWITCH_LOCATION,

    // Billing & Subscriptions
    PERMISSIONS.BILLING_VIEW,
    PERMISSIONS.BILLING_MANAGE,
    PERMISSIONS.BILLING_UPGRADE,
    PERMISSIONS.BILLING_CANCEL,

    // Team Management
    PERMISSIONS.TEAM_VIEW,
    PERMISSIONS.TEAM_INVITE,
    PERMISSIONS.TEAM_REMOVE,
    PERMISSIONS.TEAM_CHANGE_ROLE,

    // Review Operations & Campaigns
    PERMISSIONS.CAMPAIGN_SEND_WHATSAPP,
    PERMISSIONS.CAMPAIGN_SEND_SMS,
    PERMISSIONS.STANDEE_DESIGN_CUSTOM,
    PERMISSIONS.STANDEE_EXPORT_HD,
    PERMISSIONS.REVIEWS_VIEW,
    PERMISSIONS.REVIEWS_AI_REPLY,
    PERMISSIONS.REVIEWS_EXPORT_CSV,
  ],

  [ROLES.BUSINESS_STAFF]: [
    // Operational access for day-to-day customer feedback collection
    PERMISSIONS.BIZ_VIEW_ANALYTICS,
    PERMISSIONS.CAMPAIGN_SEND_WHATSAPP,
    PERMISSIONS.CAMPAIGN_SEND_SMS,
    PERMISSIONS.STANDEE_DESIGN_CUSTOM,
    PERMISSIONS.REVIEWS_VIEW,
    PERMISSIONS.REVIEWS_AI_REPLY,
    PERMISSIONS.TEAM_VIEW,
  ],

  [ROLES.CUSTOMER]: [
    // Public review flow
  ],
};

/**
 * Check if a role possesses a specific permission
 */
export function hasPermission(role, permission) {
  if (!role || !permission) return false;
  const permissions = ROLE_PERMISSIONS[role] || [];
  return permissions.includes(permission);
}

/**
 * Check if a user can perform an action
 */
export function canUserPerform(user, permission) {
  if (!user) return false;
  const role = user.role || (user.isSuperAdmin ? ROLES.SUPER_ADMIN : ROLES.BUSINESS_OWNER);
  return hasPermission(role, permission);
}

/**
 * Get role badge display metadata
 */
export function getRoleBadgeInfo(role) {
  switch (role) {
    case ROLES.SUPER_ADMIN:
      return {
        label: 'Super Admin',
        icon: '⚡',
        className: 'role-badge-super-admin',
        description: 'Global SaaS platform control',
      };
    case ROLES.BUSINESS_OWNER:
      return {
        label: 'Business Owner',
        icon: '👑',
        className: 'role-badge-owner',
        description: 'Full business & billing control',
      };
    case ROLES.BUSINESS_STAFF:
      return {
        label: 'Staff Member',
        icon: '👔',
        className: 'role-badge-staff',
        description: 'Operational review collection & AI replies',
      };
    default:
      return {
        label: 'Customer',
        icon: '👤',
        className: 'role-badge-customer',
        description: 'Public reviewer',
      };
  }
}
