import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import StarRating from '../components/StarRating';
import QRCodeDisplay from '../components/QRCodeDisplay';
import StandeeDesigner from '../components/StandeeDesigner';
import WhatsAppInviteModal from '../components/WhatsAppInviteModal';
import AiReplyModal from '../components/AiReplyModal';
import SubscriptionModal from '../components/SubscriptionModal';
import TeamManagement from '../components/TeamManagement';
import RoleSwitcher from '../components/RoleSwitcher';
import PermissionGate from '../components/PermissionGate';
import { useAuth } from '../context/AuthContext';
import { PERMISSIONS, getRoleBadgeInfo } from '../lib/rbac';
import { getPlan } from '../lib/plans';
import { api } from '../api/client';

export default function DashboardPage() {
  const { businessId: paramBizId } = useParams();
  const navigate = useNavigate();
  const { user, role, hasPermission, subscription } = useAuth();

  const activeBusinessId = paramBizId || user?.businessId || 'demo-1';

  // State
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'team' | 'billing' | 'settings'
  const [business, setBusiness] = useState(null);
  const [stats, setStats] = useState({
    totalReviews: 4,
    thisMonth: 2,
    avgRating: 4.9,
    scanToReviewRate: '82%',
  });
  const [reviews, setReviews] = useState([]);
  const [toast, setToast] = useState('');

  // UI filters & modals
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [showQRModal, setShowQRModal] = useState(false);
  const [showStandeeStudio, setShowStandeeStudio] = useState(false);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [showSubModal, setShowSubModal] = useState(false);
  const [selectedReviewForReply, setSelectedReviewForReply] = useState(null);

  // Settings form state
  const [settingsName, setSettingsName] = useState('');
  const [settingsCategory, setSettingsCategory] = useState('');
  const [settingsGoogleUrl, setSettingsGoogleUrl] = useState('');
  const [settingsBrandingColor, setSettingsBrandingColor] = useState('#4f46e5');

  // WhatsApp Inviter Form State
  const [waCustomerName, setWaCustomerName] = useState('');
  const [waPhone, setWaPhone] = useState('');
  const [waTemplate, setWaTemplate] = useState('friendly');
  const [waCopied, setWaCopied] = useState(false);

  const loadData = useCallback(async () => {
    const targetId = activeBusinessId;
    try {
      const [bizRes, statsRes, reviewsRes] = await Promise.allSettled([
        api.getBusiness(targetId),
        api.getBusinessStats(targetId),
        api.getBusinessReviews(targetId),
      ]);

      if (bizRes.status === 'fulfilled' && bizRes.value) {
        setBusiness(bizRes.value);
        setSettingsName(bizRes.value.name || '');
        setSettingsCategory(bizRes.value.category || '');
        setSettingsGoogleUrl(bizRes.value.googleReviewUrl || '');
      }

      if (statsRes.status === 'fulfilled' && statsRes.value) {
        setStats(statsRes.value);
      }

      if (reviewsRes.status === 'fulfilled' && Array.isArray(reviewsRes.value)) {
        setReviews(reviewsRes.value);
      }
    } catch (err) {
      console.warn('Dashboard background refresh notice:', err);
    }
  }, [activeBusinessId]);

  useEffect(() => {
    loadData();
  }, [activeBusinessId, loadData]);

  const handleLogout = async () => {
    await api.logout();
    navigate('/login', { replace: true });
  };

  const showToastMsg = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const bizName = business?.name || 'our business';
  const reviewUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/review/${activeBusinessId}`
    : `/review/${activeBusinessId}`;

  const handleCopyReviewUrl = async () => {
    try {
      await navigator.clipboard.writeText(reviewUrl);
      showToastMsg('✓ Review link copied to clipboard!');
    } catch (err) {
      console.warn('Clipboard write error:', err);
    }
  };

  const generateWaMessage = () => {
    const namePart = waCustomerName.trim() ? `Hi ${waCustomerName.trim()}!` : 'Hi there!';
    if (waTemplate === 'short') {
      return `${namePart} Thanks for choosing ${bizName}! We'd love your 30-second feedback — our AI will help craft your review: ${reviewUrl}`;
    }
    if (waTemplate === 'offer') {
      return `${namePart} Thank you for visiting ${bizName}! Leave a quick Google review here: ${reviewUrl} and show it to us on your next visit for a special discount! 🎁`;
    }
    return `${namePart} Thanks for visiting ${bizName} today! Could you take 30 seconds to share your experience? Our smart AI helps craft your review in 1 click: ${reviewUrl} ⭐`;
  };

  const handleSendDirectWhatsApp = () => {
    const cleanPhone = waPhone.replace(/[^0-9]/g, '');
    const msg = generateWaMessage();
    const encoded = encodeURIComponent(msg);
    const targetUrl = cleanPhone ? `https://wa.me/${cleanPhone}?text=${encoded}` : `https://wa.me/?text=${encoded}`;
    window.open(targetUrl, '_blank', 'noopener,noreferrer');
  };

  const handleSendDirectSMS = () => {
    const cleanPhone = waPhone.replace(/[^0-9]/g, '');
    const msg = generateWaMessage();
    const encoded = encodeURIComponent(msg);
    window.location.href = `sms:${cleanPhone}?body=${encoded}`;
  };

  const handleCopyWaMessage = async () => {
    try {
      await navigator.clipboard.writeText(generateWaMessage());
      setWaCopied(true);
      showToastMsg('✓ WhatsApp message & review link copied!');
      setTimeout(() => setWaCopied(false), 3000);
    } catch (err) {
      console.warn('Clipboard write error:', err);
    }
  };

  const handleSaveSettings = (e) => {
    e.preventDefault();
    if (!hasPermission(PERMISSIONS.BIZ_UPDATE_PROFILE)) {
      showToastMsg('⚠️ Permission Denied: Only Business Owners can update business settings.');
      return;
    }
    showToastMsg('✓ Business profile and branding settings updated!');
  };

  const currentPlan = getPlan(subscription?.planId);
  const roleBadge = getRoleBadgeInfo(role);
  const isDemoMode = activeBusinessId.startsWith('demo-');

  // Filter reviews
  const filteredReviews = Array.isArray(reviews)
    ? reviews.filter((r) => {
        if (!r) return false;
        if (selectedFilter === 'all') return true;
        return Number(r.rating) === Number(selectedFilter);
      })
    : [];

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Recently';
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return 'Recently';
    }
  };

  return (
    <div className="page-container dashboard-page">
      {toast && <div className="floating-toast">{toast}</div>}

      {/* Interactive Role Switcher Bar */}
      <RoleSwitcher />

      {/* Dashboard Top Header Card */}
      <div className="dashboard-header-card">
        <div className="dashboard-header-main">
          <div className="dashboard-biz-tag">
            <span className={`role-badge-chip ${roleBadge.className}`}>
              <span>{roleBadge.icon}</span>
              <span>{roleBadge.label}</span>
            </span>
            <span className="plan-pill-tag">
              💎 {currentPlan.name} Plan (${currentPlan.monthlyPrice}/mo)
            </span>
            <span className="biz-id-badge">ID: {activeBusinessId}</span>
            {isDemoMode && <span className="demo-status-pill">Interactive Preview</span>}
          </div>

          <h1 className="page-title">{business?.name || 'Apex Auto Care & Diagnostics'}</h1>
          <p className="page-subtitle">
            AI-powered customer review collection copilot, team management, and subscription hub.
          </p>

          <div className="review-link-share-bar">
            <span className="share-bar-label">Public Review Link:</span>
            <span className="share-bar-url">{reviewUrl}</span>
            <button
              type="button"
              className="btn-copy-link-pill"
              onClick={handleCopyReviewUrl}
            >
              📋 Copy Link
            </button>
          </div>
        </div>

        <div className="dashboard-header-top-actions">
          {hasPermission(PERMISSIONS.BILLING_UPGRADE) && (
            <button
              type="button"
              className="btn-upgrade-header-action"
              onClick={() => setShowSubModal(true)}
              title="Manage monthly subscription plan"
            >
              💎 Upgrade Plan
            </button>
          )}

          <button
            type="button"
            className="btn-whatsapp-header-action"
            onClick={() => setShowWhatsAppModal(true)}
            title="Open WhatsApp customer review inviter"
          >
            💬 Send WhatsApp
          </button>

          <Link
            to={`/review/${activeBusinessId}`}
            target="_blank"
            rel="noreferrer"
            className="btn-preview-link"
            title="Open customer review page in new tab"
          >
            📱 Open Review Page
          </Link>

          <button
            type="button"
            className="btn-logout"
            onClick={handleLogout}
            title="Sign out of your account"
          >
            🚪 Log out
          </button>
        </div>
      </div>

      {/* Structured Dashboard Tab Navigation */}
      <div className="dashboard-tabs-bar">
        <button
          type="button"
          className={`dash-tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <span className="tab-icon">📊</span>
          <span>Overview & Analytics</span>
        </button>

        <button
          type="button"
          className={`dash-tab-btn ${activeTab === 'team' ? 'active' : ''}`}
          onClick={() => setActiveTab('team')}
        >
          <span className="tab-icon">👥</span>
          <span>Team & Staff (RBAC)</span>
        </button>

        <button
          type="button"
          className={`dash-tab-btn ${activeTab === 'billing' ? 'active' : ''}`}
          onClick={() => setActiveTab('billing')}
        >
          <span className="tab-icon">💎</span>
          <span>Subscription & Billing</span>
          {subscription?.status === 'trialing' && <span className="tab-pill-trial">Trial</span>}
        </button>

        <button
          type="button"
          className={`dash-tab-btn ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          <span className="tab-icon">⚙️</span>
          <span>Settings & Branding</span>
        </button>
      </div>

      {/* =========================================================================
          TAB 1: OVERVIEW & ANALYTICS
          ========================================================================= */}
      {activeTab === 'overview' && (
        <div className="tab-content-container animate-fade-in">
          {/* Quick Growth Launchpad */}
          <div className="dashboard-launchpad-card">
            <div className="launchpad-header">
              <span className="launchpad-sparkle">🚀</span>
              <div>
                <h3 className="launchpad-title">Quick Growth Launchpad</h3>
                <p className="launchpad-subtitle">3 fast ways to get more 5-star Google reviews today</p>
              </div>
            </div>

            <div className="launchpad-actions-grid">
              {/* Action 1: QR Standee Studio */}
              <div className="launchpad-action-box" onClick={() => setShowStandeeStudio(true)}>
                <div className="launchpad-icon-circle violet">🎨</div>
                <div className="launchpad-box-body">
                  <h4 className="launchpad-box-title">Design QR Standee</h4>
                  <p className="launchpad-box-desc">Print counter standees, table tents, and cards</p>
                </div>
                <button type="button" className="btn-launchpad-arrow">
                  Open Studio →
                </button>
              </div>

              {/* Action 2: WhatsApp Inviter */}
              <div className="launchpad-action-box" onClick={() => setShowWhatsAppModal(true)}>
                <div className="launchpad-icon-circle emerald">💬</div>
                <div className="launchpad-box-body">
                  <h4 className="launchpad-box-title">WhatsApp & SMS Invite</h4>
                  <p className="launchpad-box-desc">Send 1-click AI review links to recent customers</p>
                </div>
                <button type="button" className="btn-launchpad-arrow">
                  Launch Invite →
                </button>
              </div>

              {/* Action 3: Test Review Flow */}
              <a
                href={reviewUrl}
                target="_blank"
                rel="noreferrer"
                className="launchpad-action-box"
              >
                <div className="launchpad-icon-circle cyan">📱</div>
                <div className="launchpad-box-body">
                  <h4 className="launchpad-box-title">Test Review Page</h4>
                  <p className="launchpad-box-desc">Experience the 30-second customer review flow</p>
                </div>
                <span className="btn-launchpad-arrow">Open Page →</span>
              </a>
            </div>
          </div>

          {/* 4 Metric Cards */}
          <div className="metrics-grid">
            <div className="metric-card">
              <div className="metric-icon-box blue">
                <span>💬</span>
              </div>
              <div className="metric-body">
                <span className="metric-label">Total Reviews</span>
                <span className="metric-value">{stats?.totalReviews ?? 0}</span>
                <span className="metric-subtext">All-time customer reviews</span>
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-icon-box green">
                <span>📅</span>
              </div>
              <div className="metric-body">
                <span className="metric-label">This Month</span>
                <span className="metric-value">+{stats?.thisMonth ?? 0}</span>
                <span className="metric-subtext">New reviews recorded</span>
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-icon-box amber">
                <span>⭐</span>
              </div>
              <div className="metric-body">
                <span className="metric-label">Avg Rating</span>
                <div className="metric-value-row">
                  <span className="metric-value">
                    {stats?.avgRating ? Number(stats.avgRating).toFixed(1) : '5.0'}
                  </span>
                  <StarRating rating={stats?.avgRating || 5} readOnly size="sm" />
                </div>
                <span className="metric-subtext">Out of 5.0 stars</span>
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-icon-box purple">
                <span>🎯</span>
              </div>
              <div className="metric-body">
                <span className="metric-label">Scan-to-Review Rate</span>
                <span className="metric-value">{stats?.scanToReviewRate ?? '0%'}</span>
                <span className="metric-subtext">Conversion rate</span>
              </div>
            </div>
          </div>

          {/* Inline WhatsApp Review Inviter Widget */}
          <div className="whatsapp-dashboard-card">
            <div className="whatsapp-dash-header">
              <div className="whatsapp-dash-title-row">
                <div className="whatsapp-icon-bubble">💬</div>
                <div>
                  <h3 className="whatsapp-dash-title">WhatsApp 1-Click Review Inviter</h3>
                  <p className="whatsapp-dash-desc">
                    Send a personalized review request directly to recent customers via WhatsApp or SMS
                  </p>
                </div>
              </div>
              <span className="whatsapp-pill-badge">⚡ Instant Direct Send</span>
            </div>

            <div className="whatsapp-dash-body">
              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">Customer Name (Optional)</label>
                  <input
                    type="text"
                    className="form-input"
                    value={waCustomerName}
                    onChange={(e) => setWaCustomerName(e.target.value)}
                    placeholder="e.g. Rahul, Sarah, or John"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">WhatsApp Phone Number (With Country Code)</label>
                  <input
                    type="tel"
                    className="form-input"
                    value={waPhone}
                    onChange={(e) => setWaPhone(e.target.value)}
                    placeholder="e.g. +91 9876543210 or +1 4155552671"
                  />
                </div>
              </div>

              <div className="wa-template-picker-section">
                <label className="form-label">Select Message Style:</label>
                <div className="template-tabs-row">
                  <button
                    type="button"
                    className={`template-tab-btn ${waTemplate === 'friendly' ? 'active' : ''}`}
                    onClick={() => setWaTemplate('friendly')}
                  >
                    ⭐ Friendly & Warm
                  </button>
                  <button
                    type="button"
                    className={`template-tab-btn ${waTemplate === 'short' ? 'active' : ''}`}
                    onClick={() => setWaTemplate('short')}
                  >
                    ⚡ Quick 30-Sec
                  </button>
                  <button
                    type="button"
                    className={`template-tab-btn ${waTemplate === 'offer' ? 'active' : ''}`}
                    onClick={() => setWaTemplate('offer')}
                  >
                    🎁 VIP Special Offer
                  </button>
                </div>
              </div>

              <div className="message-preview-box">
                <div className="preview-label-row">
                  <span>Preview of WhatsApp Message:</span>
                  <span className="preview-ready-tag">✓ Ready to Send</span>
                </div>
                <p className="message-preview-text">{generateWaMessage()}</p>
              </div>

              <div className="wa-dash-actions-row">
                <button
                  type="button"
                  className="btn-whatsapp-send btn-lg"
                  onClick={handleSendDirectWhatsApp}
                >
                  <span>💬</span> Send via WhatsApp
                </button>
                <button
                  type="button"
                  className="btn-sms-send btn-lg"
                  onClick={handleSendDirectSMS}
                >
                  <span>📱</span> Send via SMS
                </button>
                <button
                  type="button"
                  className={`btn-secondary btn-lg ${waCopied ? 'btn-copied' : ''}`}
                  onClick={handleCopyWaMessage}
                >
                  {waCopied ? '✓ Copied to Clipboard!' : '📋 Copy Message'}
                </button>
              </div>
            </div>
          </div>

          {/* Customer Reviews Feed */}
          <div className="reviews-section-card">
            <div className="reviews-header-bar">
              <div className="reviews-title-wrap">
                <h2 className="section-title">Customer Reviews & Feedback</h2>
                <span className="badge-counter">{filteredReviews.length} reviews</span>
              </div>

              <div className="reviews-filter-bar">
                <span className="filter-label">Filter:</span>
                <div className="filter-tabs">
                  <button
                    type="button"
                    className={`filter-btn ${selectedFilter === 'all' ? 'active' : ''}`}
                    onClick={() => setSelectedFilter('all')}
                  >
                    All
                  </button>
                  <button
                    type="button"
                    className={`filter-btn ${selectedFilter === '5' ? 'active' : ''}`}
                    onClick={() => setSelectedFilter('5')}
                  >
                    5 ★
                  </button>
                  <button
                    type="button"
                    className={`filter-btn ${selectedFilter === '4' ? 'active' : ''}`}
                    onClick={() => setSelectedFilter('4')}
                  >
                    4 ★
                  </button>
                  <button
                    type="button"
                    className={`filter-btn ${selectedFilter === '3' ? 'active' : ''}`}
                    onClick={() => setSelectedFilter('3')}
                  >
                    3 ★ & below
                  </button>
                </div>
              </div>
            </div>

            {filteredReviews.length > 0 ? (
              <div className="reviews-list">
                {filteredReviews.map((rev) => (
                  <div key={rev.id} className="review-item-card">
                    <div className="review-item-top">
                      <div className="review-item-stars-service">
                        <StarRating rating={rev.rating || 5} readOnly size="sm" />
                        {rev.serviceType && (
                          <span className="review-service-badge">{rev.serviceType}</span>
                        )}
                      </div>
                      <span className="review-date">{formatDate(rev.createdAt)}</span>
                    </div>

                    <p className="review-item-text">
                      "{rev.text || rev.draftText || 'Great service and overall experience!'}"
                    </p>

                    {(rev.whatStoodOut || rev.whatCouldImprove) && (
                      <div className="review-item-details">
                        {rev.whatStoodOut && (
                          <div className="detail-pill positive">
                            <span className="pill-title">What stood out:</span> {rev.whatStoodOut}
                          </div>
                        )}
                        {rev.whatCouldImprove && (
                          <div className="detail-pill constructive">
                            <span className="pill-title">Feedback:</span> {rev.whatCouldImprove}
                          </div>
                        )}
                      </div>
                    )}

                    <div className="review-item-actions-row">
                      <button
                        type="button"
                        className="btn-ai-reply-trigger"
                        onClick={() => setSelectedReviewForReply(rev)}
                      >
                        <span>🤖</span> Generate AI Owner Reply
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-reviews-state text-center">
                <div className="empty-icon">📝</div>
                <h3>No Reviews Found</h3>
                <p className="empty-desc">
                  Share your QR code standee or send WhatsApp invites to collect customer reviews!
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 2: TEAM & STAFF (RBAC)
          ========================================================================= */}
      {activeTab === 'team' && (
        <div className="tab-content-container animate-fade-in">
          <TeamManagement onOpenUpgradeModal={() => setShowSubModal(true)} />
        </div>
      )}

      {/* =========================================================================
          TAB 3: SUBSCRIPTION & BILLING
          ========================================================================= */}
      {activeTab === 'billing' && (
        <div className="tab-content-container animate-fade-in">
          <PermissionGate
            permission={PERMISSIONS.BILLING_VIEW}
            fallback={
              <div className="permission-denied-card text-center">
                <div className="denied-icon-bubble">🔒</div>
                <h3>Billing Access Restricted</h3>
                <p>Only Business Owners and Admins have permission to manage subscriptions and invoices.</p>
              </div>
            }
          >
            {/* Active Subscription Overview Card */}
            <div className="billing-active-plan-card">
              <div className="billing-plan-header">
                <div className="billing-plan-info">
                  <span className="billing-plan-tag">💎 Active SaaS Subscription</span>
                  <h2 className="billing-plan-title">{currentPlan.name} Plan</h2>
                  <p className="billing-plan-desc">{currentPlan.tagline}</p>
                </div>

                <div className="billing-price-box">
                  <div className="billing-price-display">
                    <span className="billing-currency">$</span>
                    <span className="billing-amount">{currentPlan.monthlyPrice}</span>
                    <span className="billing-cycle">/ month</span>
                  </div>
                  <span className="billing-status-badge">● Active Subscription</span>
                </div>
              </div>

              {/* Usage Meters */}
              <div className="billing-usage-meters-grid">
                {/* Meter 1: AI Generations */}
                <div className="usage-meter-box">
                  <div className="meter-label-row">
                    <span>AI Review Generations:</span>
                    <strong>{subscription?.aiGenerationsUsed || 38} / {currentPlan.limits.aiReviewsPerMonth === Infinity ? 'Unlimited' : currentPlan.limits.aiReviewsPerMonth}</strong>
                  </div>
                  <div className="meter-track">
                    <div
                      className="meter-fill fill-purple"
                      style={{
                        width: currentPlan.limits.aiReviewsPerMonth === Infinity ? '25%' : `${Math.min(100, (38 / currentPlan.limits.aiReviewsPerMonth) * 100)}%`,
                      }}
                    ></div>
                  </div>
                </div>

                {/* Meter 2: WhatsApp Invites */}
                <div className="usage-meter-box">
                  <div className="meter-label-row">
                    <span>WhatsApp & SMS Invites:</span>
                    <strong>{subscription?.whatsappInvitesUsed || 64} / {currentPlan.limits.whatsappInvitesPerMonth === Infinity ? 'Unlimited' : currentPlan.limits.whatsappInvitesPerMonth}</strong>
                  </div>
                  <div className="meter-track">
                    <div
                      className="meter-fill fill-green"
                      style={{
                        width: currentPlan.limits.whatsappInvitesPerMonth === Infinity ? '35%' : `${Math.min(100, (64 / currentPlan.limits.whatsappInvitesPerMonth) * 100)}%`,
                      }}
                    ></div>
                  </div>
                </div>

                {/* Meter 3: Locations */}
                <div className="usage-meter-box">
                  <div className="meter-label-row">
                    <span>Locations Included:</span>
                    <strong>1 / {currentPlan.limits.locations === Infinity ? 'Unlimited' : currentPlan.limits.locations}</strong>
                  </div>
                  <div className="meter-track">
                    <div
                      className="meter-fill fill-cyan"
                      style={{
                        width: currentPlan.limits.locations === Infinity ? '15%' : `${(1 / currentPlan.limits.locations) * 100}%`,
                      }}
                    ></div>
                  </div>
                </div>
              </div>

              <div className="billing-plan-actions-bar">
                <button
                  type="button"
                  className="btn-primary btn-lg"
                  onClick={() => setShowSubModal(true)}
                >
                  🚀 Upgrade or Change Plan
                </button>
                <Link to="/pricing" className="btn-secondary btn-lg">
                  📋 View Full Pricing Comparison
                </Link>
              </div>
            </div>

            {/* Payment Method & Invoices Grid */}
            <div className="billing-details-grid">
              <div className="billing-card payment-method-card">
                <h4 className="billing-card-title">Payment Method</h4>
                <div className="payment-card-chip">
                  <span className="card-logo-icon">💳</span>
                  <div className="payment-card-info">
                    <strong>Visa ending in 4242</strong>
                    <span>Expires 12/2028 • Default Payment Method</span>
                  </div>
                </div>
                <button
                  type="button"
                  className="btn-secondary btn-sm btn-update-payment"
                  onClick={() => showToastMsg('✓ Payment method updated.')}
                >
                  Update Card
                </button>
              </div>

              <div className="billing-card invoices-card">
                <h4 className="billing-card-title">Billing Receipts & Invoices</h4>
                <div className="invoices-list">
                  <div className="invoice-row">
                    <div>
                      <span className="invoice-date">Sep 1, 2026</span>
                      <span className="invoice-plan">Pro Growth Plan</span>
                    </div>
                    <div className="invoice-right">
                      <span className="invoice-amount">$49.00</span>
                      <span className="invoice-status-paid">Paid</span>
                    </div>
                  </div>
                  <div className="invoice-row">
                    <div>
                      <span className="invoice-date">Aug 1, 2026</span>
                      <span className="invoice-plan">Pro Growth Plan</span>
                    </div>
                    <div className="invoice-right">
                      <span className="invoice-amount">$49.00</span>
                      <span className="invoice-status-paid">Paid</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </PermissionGate>
        </div>
      )}

      {/* =========================================================================
          TAB 4: SETTINGS & BRANDING
          ========================================================================= */}
      {activeTab === 'settings' && (
        <div className="tab-content-container animate-fade-in">
          <div className="settings-card">
            <div className="settings-header">
              <span className="settings-icon">⚙️</span>
              <div>
                <h3 className="settings-title">Business Profile & Review Link</h3>
                <p className="settings-subtitle">Configure your business identity and Google Maps destination</p>
              </div>
            </div>

            <form onSubmit={handleSaveSettings} className="form-layout settings-form">
              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">Business Name</label>
                  <input
                    type="text"
                    className="form-input"
                    value={settingsName}
                    onChange={(e) => setSettingsName(e.target.value)}
                    disabled={!hasPermission(PERMISSIONS.BIZ_UPDATE_PROFILE)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Business Category</label>
                  <input
                    type="text"
                    className="form-input"
                    value={settingsCategory}
                    onChange={(e) => setSettingsCategory(e.target.value)}
                    disabled={!hasPermission(PERMISSIONS.BIZ_UPDATE_PROFILE)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Google Review URL</label>
                <input
                  type="url"
                  className="form-input"
                  value={settingsGoogleUrl}
                  onChange={(e) => setSettingsGoogleUrl(e.target.value)}
                  disabled={!hasPermission(PERMISSIONS.BIZ_UPDATE_PROFILE)}
                  placeholder="https://search.google.com/local/writereview?placeid=..."
                />
                <span className="field-hint">
                  This is the exact Google Maps URL customers are redirected to when pasting their review.
                </span>
              </div>

              <div className="form-group">
                <label className="form-label">Standee Primary Brand Accent Color</label>
                <div className="color-picker-row">
                  <input
                    type="color"
                    className="color-input"
                    value={settingsBrandingColor}
                    onChange={(e) => setSettingsBrandingColor(e.target.value)}
                    disabled={!hasPermission(PERMISSIONS.BIZ_UPDATE_PROFILE)}
                  />
                  <span className="color-code-text">{settingsBrandingColor}</span>
                </div>
              </div>

              <div className="form-actions">
                <button
                  type="submit"
                  className="btn-primary btn-lg"
                  disabled={!hasPermission(PERMISSIONS.BIZ_UPDATE_PROFILE)}
                >
                  Save Profile Settings
                </button>
                {!hasPermission(PERMISSIONS.BIZ_UPDATE_PROFILE) && (
                  <span className="permission-lock-notice">
                    🔒 Only Business Owners can modify workspace configuration.
                  </span>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modals */}
      {showWhatsAppModal && (
        <WhatsAppInviteModal
          business={business}
          reviewUrl={reviewUrl}
          onClose={() => setShowWhatsAppModal(false)}
        />
      )}

      {selectedReviewForReply && (
        <AiReplyModal
          review={selectedReviewForReply}
          business={business}
          onClose={() => setSelectedReviewForReply(null)}
        />
      )}

      {showStandeeStudio && (
        <StandeeDesigner
          business={business}
          reviewUrl={reviewUrl}
          onClose={() => setShowStandeeStudio(false)}
        />
      )}

      {showSubModal && (
        <SubscriptionModal
          isOpen={showSubModal}
          onClose={() => setShowSubModal(false)}
        />
      )}

      {showQRModal && (
        <div className="modal-backdrop" onClick={() => setShowQRModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Shareable QR Code</h3>
              <button type="button" className="modal-close-btn" onClick={() => setShowQRModal(false)}>
                &times;
              </button>
            </div>
            <div className="modal-body">
              <QRCodeDisplay
                url={reviewUrl}
                title={business?.name || 'Review Us'}
                subtitle="Display this QR code for your customers to scan"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
