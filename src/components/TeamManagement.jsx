import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ROLES, PERMISSIONS, getRoleBadgeInfo } from '../lib/rbac';
import { getPlan } from '../lib/plans';

export default function TeamManagement({ onOpenUpgradeModal }) {
  const { teamMembers, user, hasPermission, inviteMember, removeMember, changeMemberRole, subscription } = useAuth();

  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState(ROLES.BUSINESS_STAFF);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const canManageTeam = hasPermission(PERMISSIONS.TEAM_INVITE);
  const currentPlan = getPlan(subscription?.planId);
  const maxSeats = currentPlan.limits.teamSeats;
  const currentSeatCount = teamMembers.length;
  const isSeatLimitReached = maxSeats !== Infinity && currentSeatCount >= maxSeats;

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3500);
  };

  const handleInviteSubmit = async (e) => {
    e.preventDefault();
    if (!inviteName.trim() || !inviteEmail.trim()) {
      setErrorMsg('Please enter both member name and email address.');
      return;
    }

    if (isSeatLimitReached) {
      setErrorMsg(`Seat limit reached (${maxSeats} seats on ${currentPlan.name} plan). Please upgrade to add more staff.`);
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      await inviteMember({
        name: inviteName.trim(),
        email: inviteEmail.trim().toLowerCase(),
        role: inviteRole,
      });

      showToast(`✓ Invitation sent to ${inviteEmail}!`);
      setInviteName('');
      setInviteEmail('');
      setInviteRole(ROLES.BUSINESS_STAFF);
      setShowInviteModal(false);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to send invite. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemove = async (memberId, memberName) => {
    if (window.confirm(`Are you sure you want to remove ${memberName} from this business workspace?`)) {
      await removeMember(memberId);
      showToast(`Removed ${memberName} from team.`);
    }
  };

  const handleRoleChange = async (memberId, newRole) => {
    await changeMemberRole(memberId, newRole);
    showToast(`Role updated successfully.`);
  };

  return (
    <div className="team-management-wrapper">
      {toastMsg && <div className="floating-toast">{toastMsg}</div>}

      {/* Top Header Card */}
      <div className="team-header-bar">
        <div className="team-header-left">
          <div className="team-icon-bubble">👥</div>
          <div>
            <h3 className="team-section-title">Team & Staff Access Control</h3>
            <p className="team-section-desc">
              Manage employees, front-desk staff, and managers who can collect reviews and send campaigns.
            </p>
          </div>
        </div>

        <div className="team-header-right">
          <div className="seat-counter-pill">
            <span>Seats Used:</span>
            <strong>{currentSeatCount} / {maxSeats === Infinity ? 'Unlimited' : maxSeats}</strong>
          </div>

          {canManageTeam && (
            <button
              type="button"
              className="btn-primary btn-sm btn-invite-team"
              onClick={() => {
                if (isSeatLimitReached && onOpenUpgradeModal) {
                  onOpenUpgradeModal();
                } else {
                  setShowInviteModal(true);
                }
              }}
            >
              {isSeatLimitReached ? '⚡ Upgrade for More Seats' : '+ Invite Staff Member'}
            </button>
          )}
        </div>
      </div>

      {/* Plan Limits Alert if seat limit close */}
      {isSeatLimitReached && (
        <div className="seat-limit-warning-banner">
          <span className="warning-icon">⚠️</span>
          <span>
            You have used all {maxSeats} staff seats on the <strong>{currentPlan.name} Plan</strong>.
          </span>
          {onOpenUpgradeModal && (
            <button
              type="button"
              className="btn-link-upgrade"
              onClick={onOpenUpgradeModal}
            >
              Upgrade to Pro / Enterprise for more seats &rarr;
            </button>
          )}
        </div>
      )}

      {/* Team Members List */}
      <div className="team-members-table-card">
        <table className="team-table">
          <thead>
            <tr>
              <th>Member Name</th>
              <th>Email Address</th>
              <th>Assigned Role</th>
              <th>Status</th>
              <th>Date Added</th>
              {canManageTeam && <th className="text-right">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {teamMembers.map((member) => {
              const badge = getRoleBadgeInfo(member.role);
              const isCurrentUser = member.email === user?.email;
              const isOwner = member.role === ROLES.BUSINESS_OWNER;

              return (
                <tr key={member.id}>
                  <td>
                    <div className="member-name-cell">
                      <div className="member-avatar-initials">
                        {member.name ? member.name.charAt(0).toUpperCase() : 'U'}
                      </div>
                      <div className="member-name-wrap">
                        <span className="member-full-name">{member.name}</span>
                        {isCurrentUser && <span className="you-pill">You</span>}
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="member-email-text">{member.email}</span>
                  </td>
                  <td>
                    {canManageTeam && !isOwner && !isCurrentUser ? (
                      <select
                        className="role-select-inline"
                        value={member.role}
                        onChange={(e) => handleRoleChange(member.id, e.target.value)}
                      >
                        <option value={ROLES.BUSINESS_STAFF}>👔 Staff Member</option>
                        <option value={ROLES.BUSINESS_OWNER}>👑 Business Owner</option>
                      </select>
                    ) : (
                      <span className={`role-badge-chip ${badge.className}`}>
                        <span>{badge.icon}</span>
                        <span>{badge.label}</span>
                      </span>
                    )}
                  </td>
                  <td>
                    <span className="status-dot-active">● Active</span>
                  </td>
                  <td>
                    <span className="date-muted">
                      {new Date(member.invitedAt || Date.now()).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  </td>
                  {canManageTeam && (
                    <td className="text-right">
                      {!isOwner && !isCurrentUser ? (
                        <button
                          type="button"
                          className="btn-action-revoke"
                          onClick={() => handleRemove(member.id, member.name)}
                          title="Revoke workspace access"
                        >
                          Revoke Access
                        </button>
                      ) : (
                        <span className="owner-locked-tag">Workspace Owner</span>
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Role-Based Permissions Reference Matrix */}
      <div className="rbac-permissions-guide-card">
        <h4 className="guide-title">Role Permission Reference Matrix</h4>
        <div className="roles-guide-grid">
          <div className="role-guide-box owner-box">
            <div className="guide-box-header">
              <span className="guide-role-icon">👑</span>
              <h5>Business Owner</h5>
            </div>
            <p className="guide-role-desc">Full workspace and account ownership privileges</p>
            <ul className="guide-perm-list">
              <li>✓ Manage business profile & Google Maps URL</li>
              <li>✓ Manage subscriptions, monthly plans & invoices</li>
              <li>✓ Invite, modify, and remove staff members</li>
              <li>✓ Send WhatsApp/SMS review campaigns</li>
              <li>✓ Design & export QR standees and table tents</li>
              <li>✓ Access AI review auto-reply copilot</li>
            </ul>
          </div>

          <div className="role-guide-box staff-box">
            <div className="guide-box-header">
              <span className="guide-role-icon">👔</span>
              <h5>Staff Member / Front Desk</h5>
            </div>
            <p className="guide-role-desc">Operational role for front-desk and service operators</p>
            <ul className="guide-perm-list">
              <li>✓ Send 1-click WhatsApp & SMS review invites</li>
              <li>✓ View incoming customer reviews & feedback</li>
              <li>✓ Launch AI review auto-reply generator</li>
              <li>✓ Generate and print QR code standees</li>
              <li>✗ Cannot modify billing or subscription plans</li>
              <li>✗ Cannot invite, edit, or delete team members</li>
              <li>✗ Cannot delete or reconfigure business workspace</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Invite Member Modal */}
      {showInviteModal && (
        <div className="modal-backdrop" onClick={() => setShowInviteModal(false)}>
          <div className="modal-content modal-sm" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Invite Team Member</h3>
              <button type="button" className="modal-close-btn" onClick={() => setShowInviteModal(false)}>
                &times;
              </button>
            </div>

            <form onSubmit={handleInviteSubmit} className="modal-body form-layout">
              {errorMsg && <div className="alert-banner alert-error">{errorMsg}</div>}

              <div className="form-group">
                <label className="form-label">
                  Member Full Name <span className="required-star">*</span>
                </label>
                <input
                  type="text"
                  className="form-input"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  placeholder="e.g. Elena Rostova or Liam Scott"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  Email Address <span className="required-star">*</span>
                </label>
                <input
                  type="email"
                  className="form-input"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="staff@yourbusiness.com"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Assign RBAC Role</label>
                <select
                  className="form-select"
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                >
                  <option value={ROLES.BUSINESS_STAFF}>👔 Staff Member (Operational Access)</option>
                  <option value={ROLES.BUSINESS_OWNER}>👑 Business Owner (Full Access)</option>
                </select>
                <span className="field-hint">
                  Staff members can send WhatsApp review invites and generate AI replies, but cannot modify billing or team members.
                </span>
              </div>

              <div className="form-actions">
                <button
                  type="submit"
                  className="btn-primary btn-block btn-lg"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Sending Invitation...' : 'Send Workspace Invite'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
