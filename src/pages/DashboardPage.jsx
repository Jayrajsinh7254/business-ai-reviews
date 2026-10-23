import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import QRCode from 'qrcode';
import StarRating from '../components/StarRating';
import QRCodeDisplay from '../components/QRCodeDisplay';
import StandeeDesigner from '../components/StandeeDesigner';
import WhatsAppInviteModal from '../components/WhatsAppInviteModal';
import AiReplyModal from '../components/AiReplyModal';
import SubscriptionModal from '../components/SubscriptionModal';
import TeamManagement from '../components/TeamManagement';
import BillingPortal from '../components/BillingPortal';
import RoleSwitcher from '../components/RoleSwitcher';
import PermissionGate from '../components/PermissionGate';
import TrialExpiredModal from '../components/TrialExpiredModal';
import { useAuth } from '../context/AuthContext';
import { ROLES, PERMISSIONS, getRoleBadgeInfo } from '../lib/rbac';
import { getPlan, isFeatureAllowed } from '../lib/plans';
import { CATEGORIES } from '../lib/categories';
import { api, isBusinessInactive } from '../api/client';

export default function DashboardPage() {
  const { businessId: paramBizId } = useParams();
  const navigate = useNavigate();
  const { user, role, hasPermission, subscription, isTrialing, isTrialExpired, trialDaysLeft } = useAuth();

  const isSuperAdmin = role === ROLES.SUPER_ADMIN;
  // Rule 5: Client is strictly locked to their own business. Cannot view other businesses or demo dashboard.
  const clientBizId = user?.businessId;
  const activeBusinessId = (isSuperAdmin && paramBizId)
    ? paramBizId
    : (clientBizId || 'demo-1');

  // Enforce security: If client tries to view another business via URL param, redirect to their own dashboard
  useEffect(() => {
    if (!isSuperAdmin && paramBizId && clientBizId && paramBizId !== clientBizId) {
      navigate('/dashboard', { replace: true });
    }
  }, [isSuperAdmin, paramBizId, clientBizId, navigate]);

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

  // Negative Review Shield (Private Intercepts) State
  const [privateFeedbackList, setPrivateFeedbackList] = useState([]);
  const [feedbackFilter, setFeedbackFilter] = useState('all');

  const loadData = useCallback(async () => {
    const targetId = activeBusinessId;
    try {
      const [bizRes, statsRes, reviewsRes, feedbackRes] = await Promise.allSettled([
        api.getBusiness(targetId),
        api.getBusinessStats(targetId),
        api.getBusinessReviews(targetId),
        api.getPrivateFeedback(targetId),
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

      if (feedbackRes.status === 'fulfilled' && Array.isArray(feedbackRes.value)) {
        setPrivateFeedbackList(feedbackRes.value);
      }
    } catch (err) {
      console.warn('Dashboard background refresh notice:', err);
    }
  }, [activeBusinessId]);

  useEffect(() => {
    loadData();

    const handleSync = () => {
      loadData();
    };

    let bc = null;
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        bc = new BroadcastChannel('reviewassist_channel');
        bc.onmessage = (event) => {
          if (event.data?.type === 'status_changed' || event.data?.type === 'plan_changed') {
            handleSync();
          }
        };
      }
    } catch {}

    window.addEventListener('storage', handleSync);
    window.addEventListener('reviewassist:admin_sync', handleSync);
    window.addEventListener('reviewassist:status_changed', handleSync);

    return () => {
      if (bc) bc.close();
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('reviewassist:admin_sync', handleSync);
      window.removeEventListener('reviewassist:status_changed', handleSync);
    };
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

  const [downloadingQrOnly, setDownloadingQrOnly] = useState(false);

  const handleDownloadQrOnly = async () => {
    if (!reviewUrl) return;
    setDownloadingQrOnly(true);
    try {
      const standaloneQrUrl = await QRCode.toDataURL(reviewUrl, {
        width: 1200,
        margin: 2,
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
        errorCorrectionLevel: 'H',
      });
      const safeName = (bizName || 'business-qr').toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
      const link = document.createElement('a');
      link.download = `${safeName}-google-review-qr-code.png`;
      link.href = standaloneQrUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToastMsg('✓ Downloaded High-Res Standalone QR Code!');
    } catch (err) {
      console.error('Failed to download standalone QR code:', err);
      showToastMsg('⚠️ Could not generate QR code download');
    } finally {
      setDownloadingQrOnly(false);
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

  // CSV Review Data Export Handler
  const handleExportCsv = () => {
    if (!reviews || reviews.length === 0) {
      showToastMsg('No reviews available to export.');
      return;
    }
    const headers = ['ID', 'Date', 'Rating', 'Customer Name', 'Service', 'Review Text', 'Feedback'];
    const rows = reviews.map((r) => [
      r.id || '',
      r.createdAt || '',
      r.rating || 5,
      `"${(r.customerName || 'Anonymous').replace(/"/g, '""')}"`,
      `"${(r.serviceType || '').replace(/"/g, '""')}"`,
      `"${(r.text || r.draftText || '').replace(/"/g, '""')}"`,
      `"${(r.whatStoodOut || r.whatCouldImprove || '').replace(/"/g, '""')}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${(business?.name || 'reviews').toLowerCase().replace(/\s+/g, '_')}_reviews.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToastMsg('✓ Reviews exported to CSV successfully!');
  };

  // Negative Review Shield Handlers
  const handleResolveFeedback = async (feedbackId) => {
    const note = window.prompt('Optional resolution note (e.g. "Called customer, offered free voucher, issue resolved"):') || '';
    const res = await api.updatePrivateFeedbackStatus(activeBusinessId, feedbackId, 'resolved', note);
    if (res.success) {
      showToastMsg('✓ Incident marked as resolved!');
      loadData();
    }
  };

  const handleUnresolveFeedback = async (feedbackId) => {
    const res = await api.updatePrivateFeedbackStatus(activeBusinessId, feedbackId, 'pending');
    if (res.success) {
      showToastMsg('✓ Incident marked as pending action.');
      loadData();
    }
  };

  const pendingFeedbackCount = privateFeedbackList.filter((f) => f.status !== 'resolved').length;
  const resolvedFeedbackCount = privateFeedbackList.filter((f) => f.status === 'resolved').length;
  const filteredPrivateFeedback = privateFeedbackList.filter((f) => {
    if (feedbackFilter === 'pending') return f.status !== 'resolved';
    if (feedbackFilter === 'resolved') return f.status === 'resolved';
    return true;
  });

  const handleSaveSettings = (e) => {
    e.preventDefault();
    if (!hasPermission(PERMISSIONS.BIZ_UPDATE_PROFILE)) {
      showToastMsg('⚠️ Permission Denied: Only Business Owners can update business settings.');
      return;
    }
    showToastMsg('✓ Business profile and branding settings updated!');
  };

  const currentPlan = getPlan(business?.planId || subscription?.planId || 'starter');
  const isInactive = Boolean(
    business
      ? (
          business.isInactive === true ||
          business.status === 'inactive' ||
          business.subscriptionStatus === 'inactive' ||
          business.subscriptionStatus === 'canceled' ||
          Boolean(business.paidUntil && new Date(business.paidUntil) < new Date())
        )
      : (
          isBusinessInactive(activeBusinessId) ||
          isBusinessInactive(user?.businessId) ||
          subscription?.status === 'inactive' ||
          subscription?.status === 'canceled'
        )
  );
  const roleBadge = getRoleBadgeInfo(role);
  const isDemoMode = !user?.businessId && activeBusinessId.startsWith('demo-');

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
            <span className={`plan-pill-tag ${isTrialing ? 'trial-tag' : ''}`}>
              {isTrialing
                ? `🎁 ${currentPlan.name} (3-Day Trial)`
                : `💎 ${currentPlan.name} Plan (₹${currentPlan.monthlyPrice?.toLocaleString('en-IN')}/mo)`}
            </span>
            <span className="plan-quota-badge">
              {currentPlan.id === 'starter'
                ? '📊 100 AI Reviews / mo • 1 Seat'
                : currentPlan.id === 'pro'
                ? '⚡ Unlimited AI • 1 Seat • WhatsApp'
                : '🏢 3 Locations • 5 Seats • Unlimited AI'}
            </span>
            <span className="biz-id-badge">ID: {activeBusinessId}</span>
            {isInactive && (
              <span className="summary-badge-inactive" style={{ verticalAlign: 'middle', fontSize: '0.78rem', marginLeft: '6px' }}>
                ⛔ Deactivated
              </span>
            )}
            {isDemoMode && <span className="demo-status-pill">Interactive Preview</span>}
          </div>

          <h1 className="page-title">{business?.name || user?.name || 'Your Business Dashboard'}</h1>
          <p className="page-subtitle">
            AI-powered customer review collection copilot, team management, and subscription hub.
          </p>

          <div className="review-link-share-bar">
            <span className="share-bar-label">Public Review Link:</span>
            <input
              type="text"
              readOnly
              value={reviewUrl}
              className="share-bar-input"
              onClick={(e) => e.target.select()}
              title="Click to select review URL"
            />
            <button
              type="button"
              className="btn-copy-link-pill"
              onClick={handleCopyReviewUrl}
              title="Copy public review link to clipboard"
            >
              📋 Copy Link
            </button>
            <button
              type="button"
              className="btn-copy-link-pill btn-qr-download-pill"
              onClick={handleDownloadQrOnly}
              disabled={downloadingQrOnly}
              title="Download standalone high-resolution QR code image (PNG)"
            >
              {downloadingQrOnly ? '⏳ Generating...' : '📱 Download Only QR Code'}
            </button>
            <button
              type="button"
              className="btn-copy-link-pill btn-view-qr-pill"
              onClick={() => setShowQRModal(true)}
              title="View on-screen QR code"
            >
              🔍 View QR
            </button>
          </div>
        </div>

        <div className="dashboard-header-top-actions">
          {(!isInactive || isSuperAdmin) && hasPermission(PERMISSIONS.BILLING_UPGRADE) && (
            <button
              type="button"
              className="btn-upgrade-header-action"
              onClick={() => setShowSubModal(true)}
              title="Manage monthly subscription plan"
            >
              💎 Upgrade Plan
            </button>
          )}

          {(!isInactive || isSuperAdmin) && (
            <button
              type="button"
              className="btn-whatsapp-header-action"
              onClick={() => setShowWhatsAppModal(true)}
              title={
                !isFeatureAllowed(currentPlan.id, 'whatsappInviter')
                  ? 'WhatsApp Review Inviter is a Pro Feature (Click to View Plan Options)'
                  : 'Open WhatsApp customer review inviter'
              }
            >
              💬 Send WhatsApp
              {!isFeatureAllowed(currentPlan.id, 'whatsappInviter') && (
                <span className="launchpad-pro-badge" style={{ marginLeft: '6px', fontSize: '10px' }}>PRO</span>
              )}
            </button>
          )}

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

      {/* =========================================================
          TRIAL EXPIRED MODAL — blocks access when 3-day trial ends
          (Never shown to Super Admin)
          ========================================================= */}
      {!isSuperAdmin && isTrialExpired && (
        <TrialExpiredModal businessName={business?.name} />
      )}

      {/* =========================================================
          TRIAL COUNTDOWN BANNER — visible when user is on trial
          ========================================================= */}
      {!isSuperAdmin && isTrialing && !isTrialExpired && (
        <div
          className={`trial-countdown-banner ${
            trialDaysLeft <= 1 ? 'trial-banner-red'
            : trialDaysLeft <= 3 ? 'trial-banner-orange'
            : 'trial-banner-green'
          }`}
        >
          <div className="trial-banner-left">
            <span className="trial-banner-icon">
              {trialDaysLeft <= 1 ? '🔴' : trialDaysLeft <= 3 ? '🟡' : '🎁'}
            </span>
            <div>
              <strong className="trial-banner-headline">
                {trialDaysLeft === 0
                  ? 'Your Free Trial Expires Today!'
                  : `Free Trial: ${trialDaysLeft} Day${trialDaysLeft === 1 ? '' : 's'} Remaining`}
              </strong>
              <span className="trial-banner-sub">
                {trialDaysLeft <= 2
                  ? 'Upgrade now to avoid any interruption to your review collection service.'
                  : 'You are on a 3-day free trial. No card needed yet — upgrade anytime.'}
              </span>
            </div>
          </div>
          <div className="trial-banner-actions">
            <a
              href={`https://wa.me/919537370561?text=${encodeURIComponent(
                `Hi ReviewAssist! I want to upgrade my plan for ${business?.name || 'my business'} before my trial ends.`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-trial-banner-wa"
            >
              💬 Upgrade via WhatsApp
            </a>
            <button
              type="button"
              className="btn-trial-banner-upgrade"
              onClick={() => navigate('/pricing')}
            >
              💎 View Plans
            </button>
          </div>
        </div>
      )}

      {/* Super Admin Tenant Inactive Banner */}
      {isSuperAdmin && isInactive && (
        <div className="admin-tenant-inactive-banner animate-fade-in" style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '1.5rem' }}>⚠️</span>
            <div>
              <strong style={{ display: 'block', color: '#92400e', fontSize: '0.95rem' }}>
                Tenant Service Currently Deactivated
              </strong>
              <span style={{ color: '#b45309', fontSize: '0.85rem' }}>
                Customer QR review scans for this business are paused. You are viewing this dashboard with Super Admin bypass privileges.
              </span>
            </div>
          </div>
          <Link to="/admin/clients" className="btn-deactivate" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', textDecoration: 'none' }}>
            ⚙️ Manage in Admin Portal
          </Link>
        </div>
      )}

      {/* DEACTIVATED USER LOCKOUT CARD — shown to client when account is inactive */}
      {!isSuperAdmin && isInactive ? (
        <div className="dashboard-deactivated-lockout-card animate-fade-in">
          <div className="lockout-badge-wrap">
            <span className="lockout-status-pill">⛔ Account Deactivated / Service Paused</span>
          </div>

          <div className="lockout-header-content">
            <div className="lockout-icon-circle">
              <span className="lockout-large-icon">🔒</span>
            </div>
            <h2 className="lockout-title">Dashboard & Scanner Access Deactivated</h2>
            <p className="lockout-subtitle">
              Your ReviewAssist account and customer review scanners have been deactivated by the platform administrator. Access to dashboard controls and review generation is temporarily suspended.
            </p>
          </div>

          <div className="lockout-impact-box">
            <h4 className="lockout-impact-title">Current Service Status</h4>
            <div className="lockout-impact-grid">
              <div className="lockout-impact-item">
                <span className="impact-icon">📱</span>
                <div>
                  <strong>Customer QR Standee Scans</strong>
                  <p>When customers scan your QR standee or visit your review page, they will see a "Service Paused" message.</p>
                </div>
              </div>
              <div className="lockout-impact-item">
                <span className="impact-icon">⚡</span>
                <div>
                  <strong>AI Review Generation & WhatsApp Invites</strong>
                  <p>Multilingual AI review suggestions and WhatsApp customer review dispatches are temporarily locked.</p>
                </div>
              </div>
              <div className="lockout-impact-item">
                <span className="impact-icon">📊</span>
                <div>
                  <strong>Dashboard Controls & Analytics</strong>
                  <p>Viewing reviews, downloading standees, and modifying business profile are locked until reactivated.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="lockout-details-summary">
            <div className="summary-row">
              <span className="summary-label">Business Name</span>
              <span className="summary-value">{business?.name || user?.name || 'Your Business'}</span>
            </div>
            <div className="summary-row">
              <span className="summary-label">Account ID</span>
              <span className="summary-value">{activeBusinessId}</span>
            </div>
            <div className="summary-row">
              <span className="summary-label">Account Status</span>
              <span className="summary-badge-inactive">Deactivated</span>
            </div>
            <div className="summary-row">
              <span className="summary-label">Assigned Plan</span>
              <span className="summary-value" style={{ textTransform: 'capitalize' }}>{business?.planId || 'Starter'}</span>
            </div>
          </div>

          <div className="lockout-actions-row">
            <a
              href={`https://wa.me/919537370561?text=${encodeURIComponent(
                `Hi ReviewAssist Support! My business account for "${business?.name || activeBusinessId}" is deactivated. Please help me reactivate my dashboard and review scanners.`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-lockout-whatsapp"
            >
              💬 Reactivate via WhatsApp
            </a>
            <button
              type="button"
              className="btn-lockout-upgrade"
              onClick={() => setShowSubModal(true)}
            >
              💎 View Plan Renewal Options
            </button>
            <Link
              to={`/review/${activeBusinessId}`}
              target="_blank"
              rel="noreferrer"
              className="btn-lockout-preview"
            >
              📱 Preview Customer Review Page
            </Link>
            <button
              type="button"
              className="btn-lockout-logout"
              onClick={handleLogout}
            >
              🚪 Sign Out
            </button>
          </div>

          <p className="lockout-footer-note">
            Need immediate help? Contact <strong>support@reviewassist.ai</strong> or WhatsApp <strong>+91 95373 70561</strong> to restore instant access.
          </p>
        </div>
      ) : (
        <>
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
          className={`dash-tab-btn ${activeTab === 'shield' ? 'active' : ''}`}
          onClick={() => setActiveTab('shield')}
        >
          <span className="tab-icon">🛡️</span>
          <span>Private Intercepts (Shield)</span>
          {pendingFeedbackCount > 0 && (
            <span className="tab-pill-shield-action">{pendingFeedbackCount} Action</span>
          )}
        </button>

        <button
          type="button"
          className={`dash-tab-btn ${activeTab === 'team' ? 'active' : ''}`}
          onClick={() => setActiveTab('team')}
        >
          <span className="tab-icon">👥</span>
          <span>Team & Staff (RBAC)</span>
          {currentPlan.limits.teamSeats <= 1 && (
            <span className="launchpad-pro-badge" style={{ marginLeft: '6px', fontSize: '10px' }}>PRO</span>
          )}
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
              <div
                className={`launchpad-action-box ${!isFeatureAllowed(currentPlan.id, 'whatsappInviter') ? 'locked-feature-box' : ''}`}
                onClick={() => {
                  if (!isFeatureAllowed(currentPlan.id, 'whatsappInviter')) {
                    showToastMsg('🔒 WhatsApp Review Inviter requires Pro Growth plan. Upgrade to unlock.');
                    setShowSubModal(true);
                    return;
                  }
                  if (!hasPermission(PERMISSIONS.CAMPAIGN_SEND_WHATSAPP)) {
                    showToastMsg('⚠️ Permission Denied: Staff members cannot send WhatsApp campaigns.');
                    return;
                  }
                  setShowWhatsAppModal(true);
                }}
              >
                <div className="launchpad-icon-circle emerald">💬</div>
                <div className="launchpad-box-body">
                  <div className="launchpad-box-title-row">
                    <h4 className="launchpad-box-title">WhatsApp & SMS Invite</h4>
                    {!isFeatureAllowed(currentPlan.id, 'whatsappInviter') && (
                      <span className="launchpad-pro-badge">PRO</span>
                    )}
                  </div>
                  <p className="launchpad-box-desc">
                    {!isFeatureAllowed(currentPlan.id, 'whatsappInviter')
                      ? 'Automated WhatsApp review requests (Pro plan required)'
                      : 'Send 1-click AI review links to recent customers'}
                  </p>
                </div>
                <button type="button" className="btn-launchpad-arrow">
                  {!isFeatureAllowed(currentPlan.id, 'whatsappInviter') ? 'Upgrade 🔒' : 'Launch Invite →'}
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

              {/* Action 4: AI Reply Copilot Studio */}
              <div
                className={`launchpad-action-box highlight-copilot ${!isFeatureAllowed(currentPlan.id, 'aiReplyCopilot') ? 'locked-feature-box' : ''}`}
                onClick={() => {
                  if (!isFeatureAllowed(currentPlan.id, 'aiReplyCopilot')) {
                    showToastMsg('🔒 AI Owner Reply Copilot requires Pro Growth plan. Upgrade to unlock.');
                    setShowSubModal(true);
                    return;
                  }
                  if (!hasPermission(PERMISSIONS.REVIEWS_AI_REPLY)) {
                    showToastMsg('⚠️ Permission Denied: Staff members cannot generate owner replies.');
                    return;
                  }
                  setSelectedReviewForReply({ isExternal: true, rating: 5 });
                }}
              >
                <div className="launchpad-icon-circle indigo">🤖</div>
                <div className="launchpad-box-body">
                  <div className="launchpad-box-title-row">
                    <h4 className="launchpad-box-title">AI Reply Copilot</h4>
                    {!isFeatureAllowed(currentPlan.id, 'aiReplyCopilot') ? (
                      <span className="launchpad-pro-badge">PRO</span>
                    ) : (
                      <span className="launchpad-ai-badge">SEO</span>
                    )}
                  </div>
                  <p className="launchpad-box-desc">
                    {!isFeatureAllowed(currentPlan.id, 'aiReplyCopilot')
                      ? '1-click AI SEO responses for Google reviews (Pro plan required)'
                      : 'Paste Google reviews to craft 1-click SEO-optimized owner responses'}
                  </p>
                </div>
                <button type="button" className="btn-launchpad-arrow">
                  {!isFeatureAllowed(currentPlan.id, 'aiReplyCopilot') ? 'Upgrade 🔒' : 'Open Copilot →'}
                </button>
              </div>
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

            <div
              className="metric-card metric-card-shield"
              onClick={() => setActiveTab('shield')}
              style={{ cursor: 'pointer' }}
              title="Click to view intercepted negative complaints"
            >
              <div className="metric-icon-box emerald">
                <span>🛡️</span>
              </div>
              <div className="metric-body">
                <span className="metric-label">Shield Intercepts</span>
                <span className="metric-value">{privateFeedbackList.length}</span>
                <span className="metric-subtext">
                  {pendingFeedbackCount > 0
                    ? `⚠️ ${pendingFeedbackCount} action needed`
                    : '✓ Protected from Google'}
                </span>
              </div>
            </div>
          </div>

          {/* Inline WhatsApp Review Inviter Widget */}
          {!isFeatureAllowed(currentPlan.id, 'whatsappInviter') ? (
            <div className="whatsapp-dashboard-card locked-plan-card">
              <div className="whatsapp-dash-header">
                <div className="whatsapp-dash-title-row">
                  <div className="whatsapp-icon-bubble locked">🔒</div>
                  <div>
                    <div className="whatsapp-title-badge-flex">
                      <h3 className="whatsapp-dash-title">WhatsApp 1-Click Review Inviter</h3>
                      <span className="launchpad-pro-badge">PRO GROWTH ONLY</span>
                    </div>
                    <p className="whatsapp-dash-desc">
                      Send personalized review requests directly to recent customers via WhatsApp or SMS
                    </p>
                  </div>
                </div>
              </div>
              <div className="whatsapp-dash-locked-cover">
                <div className="locked-cover-content">
                  <span className="locked-sparkle-icon">💬✨</span>
                  <h4>WhatsApp Review Inviter is Locked on {currentPlan.name} Plan</h4>
                  <p>
                    Automated 1-click WhatsApp & SMS campaigns are exclusive to <strong>Pro Growth</strong> and <strong>Enterprise</strong> tiers. Businesses using direct WhatsApp review requests achieve an average of <strong>3.2x more 5-star Google reviews</strong>.
                  </p>
                  <button
                    type="button"
                    className="btn-unlock-pro-cta"
                    onClick={() => setShowSubModal(true)}
                  >
                    💎 Upgrade to Pro Growth — Unlock WhatsApp Inviter (₹1,299/mo)
                  </button>
                  <div className="locked-perks-list">
                    <span>✓ Unlimited Direct WhatsApp Review Requests</span>
                    <span>✓ 3 Pre-built High-Conversion Templates</span>
                    <span>✓ 1-Tap 30-Second AI Customer Experience</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
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
                {!hasPermission(PERMISSIONS.CAMPAIGN_SEND_WHATSAPP) && (
                  <div className="role-restriction-notice">
                    <span>⚠️</span>
                    <span>View-Only: Front-desk staff members cannot dispatch WhatsApp campaigns. Please contact the business owner.</span>
                  </div>
                )}
                <div className="form-grid-2">
                  <div className="form-group">
                    <label className="form-label">Customer Name (Optional)</label>
                    <input
                      type="text"
                      className="form-input"
                      value={waCustomerName}
                      onChange={(e) => setWaCustomerName(e.target.value)}
                      placeholder="e.g. Rahul, Sarah, or John"
                      disabled={!hasPermission(PERMISSIONS.CAMPAIGN_SEND_WHATSAPP)}
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
                      disabled={!hasPermission(PERMISSIONS.CAMPAIGN_SEND_WHATSAPP)}
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
                      disabled={!hasPermission(PERMISSIONS.CAMPAIGN_SEND_WHATSAPP)}
                    >
                      ⭐ Friendly & Warm
                    </button>
                    <button
                      type="button"
                      className={`template-tab-btn ${waTemplate === 'short' ? 'active' : ''}`}
                      onClick={() => setWaTemplate('short')}
                      disabled={!hasPermission(PERMISSIONS.CAMPAIGN_SEND_WHATSAPP)}
                    >
                      ⚡ Quick 30-Sec
                    </button>
                    <button
                      type="button"
                      className={`template-tab-btn ${waTemplate === 'offer' ? 'active' : ''}`}
                      onClick={() => setWaTemplate('offer')}
                      disabled={!hasPermission(PERMISSIONS.CAMPAIGN_SEND_WHATSAPP)}
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
                    disabled={!hasPermission(PERMISSIONS.CAMPAIGN_SEND_WHATSAPP)}
                  >
                    <span>💬</span> Send via WhatsApp
                  </button>
                  <button
                    type="button"
                    className="btn-sms-send btn-lg"
                    onClick={handleSendDirectSMS}
                    disabled={!hasPermission(PERMISSIONS.CAMPAIGN_SEND_WHATSAPP)}
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
          )}

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

                <div className="reviews-csv-action-wrap">
                  {isFeatureAllowed(currentPlan.id, 'csvExport') && hasPermission(PERMISSIONS.REVIEWS_EXPORT_CSV) ? (
                    <button
                      type="button"
                      className="btn-export-csv"
                      onClick={handleExportCsv}
                      title="Download all reviews as CSV"
                    >
                      <span>📥</span> Export CSV
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="btn-export-csv locked"
                      onClick={() => {
                        showToastMsg('🔒 Review CSV Export is a Pro Growth feature. Upgrade to unlock.');
                        setShowSubModal(true);
                      }}
                      title="Upgrade to Pro Growth to export review data"
                    >
                      <span>🔒</span> Export CSV (Pro)
                    </button>
                  )}
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
                      {isFeatureAllowed(currentPlan.id, 'aiReplyCopilot') ? (
                        <button
                          type="button"
                          className="btn-ai-reply-trigger"
                          onClick={() => setSelectedReviewForReply(rev)}
                        >
                          <span>🤖</span> Generate AI Owner Reply
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="btn-ai-reply-trigger locked"
                          onClick={() => setShowSubModal(true)}
                          title="Upgrade to Pro Growth or Enterprise to unlock 1-click AI Owner Replies"
                        >
                          <span>🔒</span> AI Owner Reply (Pro Plan)
                        </button>
                      )}
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
          {currentPlan.limits.teamSeats <= 1 ? (
            <div className="plan-upgrade-required-card team-lock-card">
              <div className="upgrade-prompt-icon">👥</div>
              <div className="upgrade-prompt-body">
                <h4>Multi-Seat Team Management is Locked on {currentPlan.name} Plan</h4>
                <p>
                  The Starter (Basic) plan includes 1 user seat (Business Owner). Upgrade to Pro Growth (5 staff seats) or Enterprise (Unlimited seats) to add team members, assign front-desk staff roles, and track individual employee review generation.
                </p>
                <div className="locked-perks-list" style={{ marginTop: '12px' }}>
                  <span>✓ Up to 5 Team &amp; Staff Seats with Granular RBAC</span>
                  <span>✓ Front-desk Staff Accounts &amp; QR Scan Tracking</span>
                  <span>✓ Employee Permission Controls &amp; Role Switcher</span>
                </div>
              </div>
              <button
                type="button"
                className="btn-primary btn-sm btn-upgrade-glow"
                onClick={() => setShowSubModal(true)}
              >
                🚀 Upgrade to Pro Growth (₹499/mo)
              </button>
            </div>
          ) : (
            <TeamManagement
              planId={currentPlan.id}
              business={business}
              subscription={subscription}
              onOpenUpgradeModal={() => setShowSubModal(true)}
            />
          )}
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
              <div className="permission-denied-box">
                <span className="denied-icon">🔒</span>
                <h4>Billing Access Restricted</h4>
                <p>Only Business Owners and Admins can manage billing and subscriptions.</p>
              </div>
            }
          >
            <BillingPortal />
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
                  <label className="form-label">Business Category / Industry</label>
                  <input
                    type="text"
                    list="category-presets"
                    className="form-input"
                    value={settingsCategory}
                    onChange={(e) => setSettingsCategory(e.target.value)}
                    disabled={!hasPermission(PERMISSIONS.BIZ_UPDATE_PROFILE)}
                    placeholder="e.g. IT & Digital Marketing, Automobile, Photography Studio..."
                  />
                  <datalist id="category-presets">
                    {CATEGORIES.map((cat) => (
                      <option key={cat.id} value={cat.label} />
                    ))}
                  </datalist>
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
                <div className="brand-color-header-row">
                  <label className="form-label">Standee Primary Brand Accent Color</label>
                  {!isFeatureAllowed(currentPlan.id, 'customBranding') && (
                    <span className="feature-locked-tag">🔒 Pro Plan Feature</span>
                  )}
                </div>
                <div className="color-picker-row">
                  <input
                    type="color"
                    className="color-input"
                    value={settingsBrandingColor}
                    onChange={(e) => setSettingsBrandingColor(e.target.value)}
                    disabled={!hasPermission(PERMISSIONS.BIZ_UPDATE_PROFILE) || !isFeatureAllowed(currentPlan.id, 'customBranding')}
                  />
                  <span className="color-code-text">{settingsBrandingColor}</span>
                  {!isFeatureAllowed(currentPlan.id, 'customBranding') && (
                    <button
                      type="button"
                      className="btn-unlock-feature-sm"
                      onClick={() => setShowSubModal(true)}
                    >
                      💎 Unlock Custom Brand Colors
                    </button>
                  )}
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

      {/* =========================================================================
          TAB 5: PRIVATE REPUTATION SHIELD (INTERCEPTED NEGATIVE REVIEWS)
          ========================================================================= */}
      {activeTab === 'shield' && (
        <div className="tab-content-container animate-fade-in">
          <div className="shield-dash-header-card">
            <div className="shield-dash-header-content">
              <div className="shield-dash-icon-wrap">
                <span className="shield-dash-icon">🛡️</span>
              </div>
              <div>
                <span className="section-tag">Google Rating Protection System</span>
                <h2 className="shield-dash-title">Private Feedback & Reputation Shield</h2>
                <p className="shield-dash-desc">
                  When customers rate 1–3 stars on your standee or invite links, they are intercepted here privately instead of posting to Google Maps. Use this channel to resolve customer issues directly and turn unhappy visits into 5-star loyal fans.
                </p>
              </div>
            </div>

            <div className="shield-dash-stat-pills">
              <div className="shield-stat-pill total">
                <span className="pill-number">{privateFeedbackList.length}</span>
                <span className="pill-label">Total Intercepted</span>
              </div>
              <div className="shield-stat-pill pending">
                <span className="pill-number">{pendingFeedbackCount}</span>
                <span className="pill-label">Action Needed</span>
              </div>
              <div className="shield-stat-pill resolved">
                <span className="pill-number">{resolvedFeedbackCount}</span>
                <span className="pill-label">Resolved</span>
              </div>
            </div>
          </div>

          {/* Intercepts List with Filters */}
          <div className="reviews-section-card mt-4">
            <div className="reviews-header-bar">
              <div className="reviews-title-wrap">
                <h3 className="section-title">Intercepted Complaints & Inquiries</h3>
                <span className="badge-counter">{filteredPrivateFeedback.length} incidents</span>
              </div>

              <div className="reviews-filter-bar">
                <span className="filter-label">Status:</span>
                <div className="filter-tabs">
                  <button
                    type="button"
                    className={`filter-btn ${feedbackFilter === 'all' ? 'active' : ''}`}
                    onClick={() => setFeedbackFilter('all')}
                  >
                    All ({privateFeedbackList.length})
                  </button>
                  <button
                    type="button"
                    className={`filter-btn ${feedbackFilter === 'pending' ? 'active' : ''}`}
                    onClick={() => setFeedbackFilter('pending')}
                  >
                    ⚠️ Pending ({pendingFeedbackCount})
                  </button>
                  <button
                    type="button"
                    className={`filter-btn ${feedbackFilter === 'resolved' ? 'active' : ''}`}
                    onClick={() => setFeedbackFilter('resolved')}
                  >
                    ✓ Resolved ({resolvedFeedbackCount})
                  </button>
                </div>
              </div>
            </div>

            {filteredPrivateFeedback.length > 0 ? (
              <div className="shield-feedback-list">
                {filteredPrivateFeedback.map((fb) => (
                  <div key={fb.id} className={`shield-feedback-card ${fb.status === 'resolved' ? 'is-resolved' : 'is-pending'}`}>
                    <div className="feedback-card-top">
                      <div className="feedback-author-info">
                        <div className="feedback-avatar">
                          {fb.customerName ? fb.customerName.charAt(0).toUpperCase() : 'C'}
                        </div>
                        <div>
                          <h4 className="feedback-customer-name">
                            {fb.customerName || 'Anonymous Customer'}
                          </h4>
                          <div className="feedback-contact-links">
                            {fb.customerContact && (
                              <a href={`tel:${fb.customerContact}`} className="contact-link">
                                📞 {fb.customerContact}
                              </a>
                            )}
                            {fb.customerEmail && (
                              <a href={`mailto:${fb.customerEmail}`} className="contact-link">
                                ✉️ {fb.customerEmail}
                              </a>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="feedback-meta-badges">
                        <span className={`status-pill ${fb.status === 'resolved' ? 'resolved' : 'pending'}`}>
                          {fb.status === 'resolved' ? '✓ Resolved' : '⚠️ Action Needed'}
                        </span>
                        <span className="feedback-date">{formatDate(fb.createdAt)}</span>
                      </div>
                    </div>

                    <div className="feedback-rating-row">
                      <div className="feedback-rating-badge">
                        <StarRating rating={fb.rating} readOnly size="sm" />
                        <span className="rating-label">
                          {fb.rating === 1 && '1★ Critical Issue'}
                          {fb.rating === 2 && '2★ Disappointed'}
                          {fb.rating === 3 && '3★ Mediocre Experience'}
                        </span>
                      </div>
                      {fb.serviceType && (
                        <span className="feedback-service-pill">Service: {fb.serviceType}</span>
                      )}
                      {fb.preferredResolution && (
                        <span className="feedback-resolution-pill">
                          Requested: {fb.preferredResolution}
                        </span>
                      )}
                    </div>

                    <div className="feedback-complaint-box">
                      <p className="feedback-issue-text">"{fb.issue}"</p>
                    </div>

                    {fb.resolutionNote && (
                      <div className="feedback-resolution-note-box">
                        <strong>Resolution Note:</strong> {fb.resolutionNote}
                      </div>
                    )}

                    {/* Action Bar */}
                    <div className="feedback-actions-bar">
                      {fb.customerContact && (
                        <>
                          <a
                            href={`https://wa.me/${fb.customerContact.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                              `Hi ${fb.customerName || 'there'}, this is ${bizName}. We received your feedback regarding your recent visit. We take your satisfaction very seriously and would love to make this right!`
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-feedback-action wa"
                          >
                            💬 Reach Out via WhatsApp
                          </a>

                          <a
                            href={`tel:${fb.customerContact}`}
                            className="btn-feedback-action call"
                          >
                            📞 Call Customer
                          </a>
                        </>
                      )}

                      <button
                        type="button"
                        className="btn-feedback-action ai-reply"
                        onClick={() => {
                          if (isFeatureAllowed(currentPlan.id, 'aiReplyCopilot')) {
                            setSelectedReviewForReply({
                              id: fb.id,
                              customerName: fb.customerName,
                              customerContact: fb.customerContact,
                              rating: fb.rating || 2,
                              text: fb.issue,
                              serviceType: fb.serviceType || 'Service',
                              isPrivateIntercept: true,
                              preferredResolution: fb.preferredResolution,
                            });
                          } else {
                            setShowSubModal(true);
                          }
                        }}
                      >
                        🤖 AI Resolution Message
                      </button>

                      {fb.status === 'pending' ? (
                        <button
                          type="button"
                          className="btn-feedback-action resolve"
                          onClick={() => handleResolveFeedback(fb.id)}
                        >
                          ✓ Mark as Resolved
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="btn-feedback-action unresolve"
                          onClick={() => handleUnresolveFeedback(fb.id)}
                        >
                          ↩ Re-open Issue
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-shield-state text-center">
                <div className="empty-shield-icon">🛡️</div>
                <h3>No Intercepted Complaints Found</h3>
                <p>
                  Your Google reputation is protected! Unhappy customer ratings (1–3 stars) will appear here for private resolution before they reach Google.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
        </>
      )}

      {/* Modals */}
      {showWhatsAppModal && (
        <WhatsAppInviteModal
          business={business}
          reviewUrl={reviewUrl}
          planId={currentPlan.id}
          userRole={role}
          onOpenUpgradeModal={() => {
            setShowWhatsAppModal(false);
            setShowSubModal(true);
          }}
          onClose={() => setShowWhatsAppModal(false)}
        />
      )}

      {selectedReviewForReply && (
        <AiReplyModal
          review={selectedReviewForReply}
          business={business}
          planId={currentPlan.id}
          userRole={role}
          onOpenUpgradeModal={() => {
            setSelectedReviewForReply(null);
            setShowSubModal(true);
          }}
          onClose={() => setSelectedReviewForReply(null)}
        />
      )}

      {showStandeeStudio && (
        <StandeeDesigner
          business={business}
          reviewUrl={reviewUrl}
          planId={currentPlan.id}
          userRole={role}
          onOpenUpgradeModal={() => {
            setShowStandeeStudio(false);
            setShowSubModal(true);
          }}
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
