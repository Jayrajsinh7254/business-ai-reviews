import React from 'react';
import { useAuth } from '../context/AuthContext';
import { ROLES } from '../lib/rbac';
import { useNavigate } from 'react-router-dom';

export default function RoleSwitcher() {
  const { role, switchRole, subscription } = useAuth();
  const navigate = useNavigate();

  const handleSwitch = (newRole) => {
    switchRole(newRole);
    if (newRole === ROLES.SUPER_ADMIN) {
      navigate('/admin');
    }
  };

  return (
    <div className="role-switcher-container">
      <div className="role-switcher-header">
        <span className="role-sim-tag">⚡ Live Role Tester:</span>
      </div>

      <div className="role-switcher-buttons">
        <button
          type="button"
          className={`role-switch-btn ${role === ROLES.BUSINESS_OWNER ? 'active' : ''}`}
          onClick={() => handleSwitch(ROLES.BUSINESS_OWNER)}
          title="Switch to Business Owner (Full workspace, team, and billing control)"
        >
          <span className="role-btn-icon">👑</span>
          <span className="role-btn-text">Owner</span>
          <span className="role-plan-tag">{subscription?.planId?.toUpperCase() || 'PRO'}</span>
        </button>

        <button
          type="button"
          className={`role-switch-btn ${role === ROLES.BUSINESS_STAFF ? 'active' : ''}`}
          onClick={() => handleSwitch(ROLES.BUSINESS_STAFF)}
          title="Switch to Staff Member (Operational review inviter, restricted billing)"
        >
          <span className="role-btn-icon">👔</span>
          <span className="role-btn-text">Staff</span>
        </button>

        <button
          type="button"
          className={`role-switch-btn ${role === ROLES.SUPER_ADMIN ? 'active' : ''}`}
          onClick={() => handleSwitch(ROLES.SUPER_ADMIN)}
          title="Switch to Super Admin (Platform-wide metrics, tenant management)"
        >
          <span className="role-btn-icon">⚡</span>
          <span className="role-btn-text">Super Admin</span>
        </button>
      </div>
    </div>
  );
}
