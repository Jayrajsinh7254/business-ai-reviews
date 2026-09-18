import React from 'react';
import { useAuth } from '../context/AuthContext';
import { hasPermission } from '../lib/rbac';
import { isFeatureAllowed, getPlan } from '../lib/plans';

/**
 * PermissionGate Component
 * Wraps UI elements and conditionally renders them based on:
 * 1. User's RBAC role permissions
 * 2. Business's current Subscription Plan tier
 */
export default function PermissionGate({
  permission,
  feature,
  fallback = null,
  showUpgradePrompt = false,
  onUpgradeClick,
  children,
}) {
  const { role, subscription } = useAuth();

  // 1. Check RBAC Role Permission
  if (permission && !hasPermission(role, permission)) {
    if (fallback) return fallback;
    return (
      <div className="permission-restricted-banner">
        <span className="restricted-icon">🔒</span>
        <div className="restricted-content">
          <strong>Restricted Action</strong>
          <span>Your current role ({role}) does not have permission to access this feature.</span>
        </div>
      </div>
    );
  }

  // 2. Check Subscription Plan Feature Gating
  if (feature && !isFeatureAllowed(subscription?.planId, feature)) {
    if (showUpgradePrompt) {
      const currentPlan = getPlan(subscription?.planId);
      return (
        <div className="plan-upgrade-required-card">
          <div className="upgrade-prompt-icon">⚡</div>
          <div className="upgrade-prompt-body">
            <h4>Feature Locked on {currentPlan.name} Plan</h4>
            <p>Upgrade to Pro Growth or Enterprise to unlock this feature and supercharge your review collection.</p>
          </div>
          {onUpgradeClick && (
            <button
              type="button"
              className="btn-primary btn-sm btn-upgrade-glow"
              onClick={onUpgradeClick}
            >
              🚀 Upgrade Plan
            </button>
          )}
        </div>
      );
    }
    return fallback;
  }

  return <>{children}</>;
}
