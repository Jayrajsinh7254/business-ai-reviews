import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ROLES, PERMISSIONS, hasPermission } from '../lib/rbac';
import { api } from '../api/client';
import { PLANS } from '../lib/plans';

export default function AdminPortalPage() {
  const { role, switchRole } = useAuth();
  const navigate = useNavigate();

  const [metrics, setMetrics] = useState(null);
  const [businesses, setBusinesses] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlanFilter, setSelectedPlanFilter] = useState('all');
  const [toastMsg, setToastMsg] = useState('');
  const [editingBiz, setEditingBiz] = useState(null);
  const [newPlanSelection, setNewPlanSelection] = useState('pro');

  const isSuperAdmin = hasPermission(role, PERMISSIONS.ADMIN_PORTAL_ACCESS);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3500);
  };

  useEffect(() => {
    async function loadAdminData() {
      setLoading(true);
      try {
        const [metricsRes, bizRes] = await Promise.all([
          api.getSaaSMetrics ? api.getSaaSMetrics() : Promise.resolve(null),
          api.getAllBusinessesAdmin ? api.getAllBusinessesAdmin() : Promise.resolve([]),
        ]);
        if (metricsRes) setMetrics(metricsRes);
        if (bizRes) setBusinesses(bizRes);
      } catch (err) {
        console.error('Failed to load admin data:', err);
      } finally {
        setLoading(false);
      }
    }

    if (isSuperAdmin) {
      loadAdminData();
    }
  }, [isSuperAdmin]);

  const handleUpdateTenantPlan = async (bizId) => {
    try {
      const planObj = PLANS[newPlanSelection.toUpperCase()];
      await api.updateSubscription(bizId, {
        planId: newPlanSelection,
        amount: planObj?.monthlyPrice || 49,
        status: 'active',
      });

      setBusinesses((prev) =>
        prev.map((b) => (b.id === bizId ? { ...b, planId: newPlanSelection, subscriptionStatus: 'active' } : b))
      );

      showToast(`✓ Updated ${bizId} plan to ${newPlanSelection.toUpperCase()}`);
      setEditingBiz(null);
    } catch (err) {
      console.error('Failed to update tenant plan:', err);
    }
  };

  const handleImpersonate = (bizId) => {
    navigate(`/dashboard/${bizId}`);
  };

  // If user is not super admin, display RBAC Access Guard with 1-click test button
  if (!isSuperAdmin) {
    return (
      <div className="page-container admin-portal-page">
        <div className="admin-access-denied-card text-center">
          <div className="denied-icon-bubble">🔒</div>
          <h2 className="denied-title">Super Admin Access Required</h2>
          <p className="denied-desc">
            The SaaS Platform Management Portal is restricted to <strong>Super Admin</strong> accounts with platform oversight privileges.
          </p>

          <div className="admin-denied-actions">
            <button
              type="button"
              className="btn-primary btn-lg"
              onClick={() => switchRole(ROLES.SUPER_ADMIN)}
            >
              ⚡ Switch to Super Admin Profile (Alex Rivera)
            </button>
            <Link to="/dashboard" className="btn-secondary btn-lg">
              Return to Business Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Filtered Businesses
  const filteredBusinesses = businesses.filter((b) => {
    const matchesSearch =
      b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b.email && b.email.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesPlan = selectedPlanFilter === 'all' || b.planId === selectedPlanFilter;
    return matchesSearch && matchesPlan;
  });

  return (
    <div className="page-container admin-portal-page">
      {toastMsg && <div className="floating-toast">{toastMsg}</div>}

      {/* Top Banner */}
      <div className="admin-portal-header-card">
        <div className="admin-header-main">
          <div className="admin-badge-row">
            <span className="admin-pill-badge">⚡ SaaS Super Admin Portal</span>
            <span className="live-status-pill">● System Operational</span>
          </div>
          <h1 className="page-title">Platform Command & Revenue Center</h1>
          <p className="page-subtitle">
            Executive oversight over all tenant businesses, MRR revenue metrics, active subscriptions, and AI volume.
          </p>
        </div>

        <div className="admin-header-actions">
          <Link to="/pricing" className="btn-secondary btn-sm">
            💎 Public Pricing Page
          </Link>
          <Link to="/dashboard/demo-1" className="btn-primary btn-sm">
            🏢 Open Tenant Workspace
          </Link>
        </div>
      </div>

      {/* 4 Executive SaaS Metrics */}
      <div className="metrics-grid admin-metrics-grid">
        {/* Metric 1: MRR */}
        <div className="metric-card admin-kpi-card mrr-card">
          <div className="metric-icon-box green">
            <span>💵</span>
          </div>
          <div className="metric-body">
            <span className="metric-label">Monthly Recurring Revenue (MRR)</span>
            <span className="metric-value">${metrics?.mrr ? metrics.mrr.toLocaleString() : '18,450'}</span>
            <span className="metric-subtext trend-positive">↑ +14.2% from last month</span>
          </div>
        </div>

        {/* Metric 2: Active Subscribers */}
        <div className="metric-card admin-kpi-card">
          <div className="metric-icon-box blue">
            <span>🏢</span>
          </div>
          <div className="metric-body">
            <span className="metric-label">Active Subscribed Businesses</span>
            <span className="metric-value">{metrics?.activeSubscribers || 246}</span>
            <span className="metric-subtext">Across 8 local industries</span>
          </div>
        </div>

        {/* Metric 3: AI Reviews Generated */}
        <div className="metric-card admin-kpi-card">
          <div className="metric-icon-box purple">
            <span>🤖</span>
          </div>
          <div className="metric-body">
            <span className="metric-label">Total AI Reviews Generated</span>
            <span className="metric-value">{metrics?.totalAiReviewsGenerated?.toLocaleString() || '48,920'}</span>
            <span className="metric-subtext">Gemini 2.5 AI throughput</span>
          </div>
        </div>

        {/* Metric 4: Churn Rate */}
        <div className="metric-card admin-kpi-card">
          <div className="metric-icon-box cyan">
            <span>📉</span>
          </div>
          <div className="metric-body">
            <span className="metric-label">Monthly Churn Rate</span>
            <span className="metric-value">{metrics?.churnRate || 1.4}%</span>
            <span className="metric-subtext trend-positive">Healthy SaaS benchmark (&lt; 2%)</span>
          </div>
        </div>
      </div>

      {/* Plan Breakdown & Distribution Bar */}
      <div className="admin-plan-distribution-card">
        <div className="plan-dist-header">
          <div>
            <h3 className="plan-dist-title">Subscription Plan Distribution</h3>
            <p className="plan-dist-subtitle">Active tenant distribution across monthly tiers</p>
          </div>
          <div className="plan-dist-chips">
            <span className="plan-chip starter-chip">Starter: 42 businesses (17%)</span>
            <span className="plan-chip pro-chip">Pro Growth: 168 businesses (68%)</span>
            <span className="plan-chip enterprise-chip">Enterprise: 36 businesses (15%)</span>
          </div>
        </div>

        <div className="plan-dist-progress-bar">
          <div className="dist-segment starter-segment" style={{ width: '17%' }} title="Starter Plan: 17%"></div>
          <div className="dist-segment pro-segment" style={{ width: '68%' }} title="Pro Growth: 68%"></div>
          <div className="dist-segment enterprise-segment" style={{ width: '15%' }} title="Enterprise Plan: 15%"></div>
        </div>
      </div>

      {/* All Tenant Businesses Table */}
      <div className="admin-tenants-card">
        <div className="tenants-table-header">
          <div className="tenants-title-wrap">
            <h3 className="section-title">Tenant Businesses & Subscriptions</h3>
            <span className="badge-counter">{filteredBusinesses.length} businesses</span>
          </div>

          <div className="tenants-search-filter-row">
            <div className="search-input-wrap">
              <input
                type="text"
                className="form-input search-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search business name, ID, or email..."
              />
            </div>

            <div className="plan-filter-tabs">
              <button
                type="button"
                className={`plan-filter-btn ${selectedPlanFilter === 'all' ? 'active' : ''}`}
                onClick={() => setSelectedPlanFilter('all')}
              >
                All Plans
              </button>
              <button
                type="button"
                className={`plan-filter-btn ${selectedPlanFilter === 'starter' ? 'active' : ''}`}
                onClick={() => setSelectedPlanFilter('starter')}
              >
                Starter ($19)
              </button>
              <button
                type="button"
                className={`plan-filter-btn ${selectedPlanFilter === 'pro' ? 'active' : ''}`}
                onClick={() => setSelectedPlanFilter('pro')}
              >
                Pro ($49)
              </button>
              <button
                type="button"
                className={`plan-filter-btn ${selectedPlanFilter === 'enterprise' ? 'active' : ''}`}
                onClick={() => setSelectedPlanFilter('enterprise')}
              >
                Enterprise ($99)
              </button>
            </div>
          </div>
        </div>

        <div className="tenants-table-wrapper">
          <table className="tenants-table">
            <thead>
              <tr>
                <th>Business Name & Category</th>
                <th>Business ID</th>
                <th>Monthly Plan</th>
                <th>MRR Value</th>
                <th>Status</th>
                <th>Total Reviews</th>
                <th className="text-right">Admin Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredBusinesses.map((biz) => {
                const planKey = (biz.planId || 'pro').toUpperCase();
                const planObj = PLANS[planKey] || PLANS.PRO;

                return (
                  <tr key={biz.id}>
                    <td>
                      <div className="biz-cell">
                        <span className="biz-cell-name">{biz.name}</span>
                        <span className="biz-cell-category">{biz.category}</span>
                      </div>
                    </td>
                    <td>
                      <span className="biz-id-code">{biz.id}</span>
                    </td>
                    <td>
                      <span className={`plan-pill-tag plan-tag-${biz.planId || 'pro'}`}>
                        {planObj.name}
                      </span>
                    </td>
                    <td>
                      <span className="mrr-val-text">${planObj.monthlyPrice}/mo</span>
                    </td>
                    <td>
                      <span className="status-pill-active">● Active</span>
                    </td>
                    <td>
                      <span className="reviews-count-badge">{biz.reviewsCount || 4} reviews</span>
                    </td>
                    <td className="text-right">
                      <div className="admin-actions-group">
                        <button
                          type="button"
                          className="btn-admin-edit-plan"
                          onClick={() => {
                            setEditingBiz(biz);
                            setNewPlanSelection(biz.planId || 'pro');
                          }}
                        >
                          ⚙️ Change Plan
                        </button>
                        <button
                          type="button"
                          className="btn-admin-impersonate"
                          onClick={() => handleImpersonate(biz.id)}
                          title="Open workspace dashboard"
                        >
                          👁️ View Dashboard
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Change Plan Modal */}
      {editingBiz && (
        <div className="modal-backdrop" onClick={() => setEditingBiz(null)}>
          <div className="modal-content modal-sm" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Change Subscription Plan</h3>
              <button type="button" className="modal-close-btn" onClick={() => setEditingBiz(null)}>
                &times;
              </button>
            </div>

            <div className="modal-body form-layout">
              <p className="modal-lead-desc">
                Update subscription plan for <strong>{editingBiz.name}</strong> ({editingBiz.id}):
              </p>

              <div className="form-group">
                <label className="form-label">Select Plan Tier</label>
                <select
                  className="form-select"
                  value={newPlanSelection}
                  onChange={(e) => setNewPlanSelection(e.target.value)}
                >
                  <option value="starter">Starter Plan ($19 / mo - 1 Location, 100 AI/mo)</option>
                  <option value="pro">Pro Growth Plan ($49 / mo - 3 Locations, Unlimited AI)</option>
                  <option value="enterprise">Enterprise Plan ($99 / mo - Unlimited Locations & Seats)</option>
                </select>
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="btn-primary btn-block btn-lg"
                  onClick={() => handleUpdateTenantPlan(editingBiz.id)}
                >
                  Apply Plan Update
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
