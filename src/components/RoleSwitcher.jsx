import React from 'react';
import { useAuth } from '../context/AuthContext';
import { ROLES } from '../lib/rbac';

/**
 * RoleSwitcher & Plan Status Bar
 * 1. Plan Tier is strictly read-only for clients (cannot be changed via buttons).
 * 2. Role view feature is ONLY accessible to Business Owners on plans ABOVE Starter (Pro or Enterprise).
 *    Staff members and Starter plan accounts cannot access role switching.
 */
export default function RoleSwitcher() {
  const { user, role, switchRole, subscription } = useAuth();

  const currentPlanId = subscription?.planId || 'pro';

  // Rule 2: Only Business Owners on plans above Starter (Pro / Enterprise) can access role feature
  const isOwner = user?.originalRole === ROLES.BUSINESS_OWNER || user?.role === ROLES.BUSINESS_OWNER;
  const isAboveStarter = currentPlanId !== 'starter';
  const canAccessRoleFeature = isOwner && isAboveStarter;

  return (
    <div className="role-switcher-container">
      {/* 1. Plan Tier Display (Strictly Read-Only for Clients) */}
      <div className="role-switcher-group plan-group">
        <span className="role-sim-tag">💎 Active Plan:</span>
        <span className={`plan-display-badge plan-${currentPlanId}`}>
          {currentPlanId === 'starter' && '🌱 Starter (Basic)'}
          {currentPlanId === 'pro' && '⭐ Pro Growth'}
          {currentPlanId === 'enterprise' && '🏢 Enterprise'}
        </span>
      </div>

      {/* 2. Role View Toggle — ONLY for Owner & ABOVE Starter Plan */}
      {canAccessRoleFeature ? (
        <div className="role-switcher-group">
          <span className="role-sim-tag">👤 Role View:</span>
          <div className="role-switcher-buttons">
            <button
              type="button"
              className={`role-switch-btn ${role === ROLES.BUSINESS_OWNER ? 'active' : ''}`}
              onClick={() => switchRole(ROLES.BUSINESS_OWNER)}
              title="Full Business Owner view (Settings, Billing, Team, and Standee controls)"
            >
              <span className="role-btn-icon">👑</span>
              <span className="role-btn-text">Owner</span>
            </button>

            <button
              type="button"
              className={`role-switch-btn ${role === ROLES.BUSINESS_STAFF ? 'active' : ''}`}
              onClick={() => switchRole(ROLES.BUSINESS_STAFF)}
              title="Preview Front Desk Staff view (Restricted settings & billing)"
            >
              <span className="role-btn-icon">👔</span>
              <span className="role-btn-text">Staff</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="role-switcher-group role-locked-info">
          <span className="role-sim-tag">👤 Role:</span>
          <span className="role-static-badge">
            {role === ROLES.BUSINESS_STAFF ? '👔 Staff Member' : '👑 Business Owner'}
          </span>
          {currentPlanId === 'starter' && isOwner && (
            <span className="starter-team-notice" title="Upgrade to Pro Growth to unlock multi-staff accounts">
              (Multi-staff requires Pro Growth)
            </span>
          )}
        </div>
      )}
    </div>
  );
}
