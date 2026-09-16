import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import StarRating from '../components/StarRating';
import QRCodeDisplay from '../components/QRCodeDisplay';
import StandeeDesigner from '../components/StandeeDesigner';
import WhatsAppInviteModal from '../components/WhatsAppInviteModal';
import AiReplyModal from '../components/AiReplyModal';
import { api } from '../api/client';

export default function DashboardPage() {
  const { businessId: paramBizId } = useParams();
  const navigate = useNavigate();

  const storedUser = api.getCurrentUser();
  const businessId = paramBizId || storedUser?.businessId || 'demo-1';

  // Instant fallback default data to prevent any blank screen or spinner hang
  const initialBiz = (api.getStoredBusinesses && api.getStoredBusinesses()[businessId]) || {
    id: businessId,
    name: businessId.startsWith('demo-2') ? 'Lumina Skin & Hair Studio' : 'Apex Auto Care & Diagnostics',
    category: businessId.startsWith('demo-2') ? 'salon' : 'automobile',
    services: businessId.startsWith('demo-2')
      ? ['Balayage & Hair Styling', 'HydraFacial Glow', 'Keratin Smoothing']
      : ['Full Synthetic Oil Change', 'Brake Pad Replacement', 'Engine Diagnostic'],
    googleReviewUrl: 'https://search.google.com/local/writereview',
    createdAt: new Date().toISOString(),
  };

  const initialStats = {
    totalReviews: businessId.startsWith('demo-2') ? 3 : 4,
    thisMonth: 2,
    avgRating: 4.9,
    scanToReviewRate: '82%',
  };

  const initialReviews = api.getStoredReviews ? api.getStoredReviews(businessId) : [];

  const [business, setBusiness] = useState(initialBiz);
  const [stats, setStats] = useState(initialStats);
  const [reviews, setReviews] = useState(initialReviews);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // UI filters & modal state
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [showQRModal, setShowQRModal] = useState(false);
  const [showStandeeStudio, setShowStandeeStudio] = useState(false);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [selectedReviewForReply, setSelectedReviewForReply] = useState(null);

  const loadData = useCallback(async () => {
    const targetId = businessId || 'demo-1';

    try {
      const [bizRes, statsRes, reviewsRes] = await Promise.allSettled([
        api.getBusiness(targetId),
        api.getBusinessStats(targetId),
        api.getBusinessReviews(targetId),
      ]);

      if (bizRes.status === 'fulfilled' && bizRes.value) {
        setBusiness(bizRes.value);
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
  }, [businessId]);

  useEffect(() => {
    // Ensure token is present for demo or preview sessions
    if (!api.getToken()) {
      api.setToken('demo-preview-session-token');
    }
    loadData();
  }, [businessId, loadData]);

  const handleLogout = () => {
    api.logout();
    navigate('/login', { replace: true });
  };

  // Filter reviews safely
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

  const reviewUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/review/${businessId}`
    : `/review/${businessId}`;

  const [toast, setToast] = useState('');

  const handleCopyReviewUrl = async () => {
    try {
      await navigator.clipboard.writeText(reviewUrl);
      setToast('✓ Review link copied to clipboard!');
      setTimeout(() => setToast(''), 3000);
    } catch (err) {
      console.warn('Clipboard write error:', err);
    }
  };

  const isDemoMode = businessId.startsWith('demo-');

  return (
    <div className="page-container dashboard-page">
      {toast && <div className="floating-toast">{toast}</div>}

      {/* Demo Mode Notice Banner if in demo */}
      {isDemoMode && (
        <div className="demo-mode-top-banner">
          <div className="demo-banner-left">
            <span className="demo-banner-icon">⚡</span>
            <span>You are exploring <strong>Interactive Demo Mode</strong> with simulated analytics.</span>
          </div>
          <Link to="/signup" className="btn-primary btn-xs demo-banner-cta">
            ✨ Register Your Own Business Free &rarr;
          </Link>
        </div>
      )}

      {/* Dashboard Top Header */}
      <div className="dashboard-header-card">
        <div className="dashboard-header-main">
          <div className="dashboard-biz-tag">
            <span className="biz-category-badge">{business?.category || 'Business'}</span>
            <span className="biz-id-badge">ID: {businessId}</span>
            {isDemoMode && <span className="demo-status-pill">Interactive Demo</span>}
          </div>
          <h1 className="page-title">{business?.name || 'Business Dashboard'}</h1>
          <p className="page-subtitle">
            Real-time analytics and customer feedback copilot powered by ReviewAssist
          </p>

          {/* Quick Demo Switcher if in demo mode */}
          {isDemoMode && (
            <div className="dashboard-demo-switcher-row">
              <span className="demo-switch-label">Switch Demo Business:</span>
              <Link
                to="/dashboard/demo-1"
                className={`demo-switch-pill ${businessId === 'demo-1' ? 'active' : ''}`}
              >
                🚗 Apex Auto Care
              </Link>
              <Link
                to="/dashboard/demo-2"
                className={`demo-switch-pill ${businessId === 'demo-2' ? 'active' : ''}`}
              >
                💇‍♀️ Lumina Salon & Spa
              </Link>
            </div>
          )}

          <div className="review-link-share-bar">
            <span className="share-bar-label">Your Review Link:</span>
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
          <Link
            to={`/review/${businessId}`}
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

      {/* Quick Launchpad Growth Hub */}
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
            <span className="btn-launchpad-arrow">
              Open Page →
            </span>
          </a>
        </div>
      </div>

      {/* 4 Metric Cards */}
      <div className="metrics-grid">
        {/* Card 1: Total Reviews */}
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

        {/* Card 2: This Month */}
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

        {/* Card 3: Average Rating */}
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
              <StarRating
                rating={stats?.avgRating || 5}
                readOnly
                size="sm"
              />
            </div>
            <span className="metric-subtext">Out of 5.0 stars</span>
          </div>
        </div>

        {/* Card 4: Scan-to-Review Rate */}
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

      {/* Reviews Section */}
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

        {/* Reviews List */}
        {filteredReviews.length > 0 ? (
          <div className="reviews-list">
            {filteredReviews.map((rev) => (
              <div key={rev.id} className="review-item-card">
                <div className="review-item-top">
                  <div className="review-item-stars-service">
                    <StarRating rating={rev.rating || 5} readOnly size="sm" />
                    {rev.serviceType && (
                      <span className="review-service-badge">
                        {rev.serviceType}
                      </span>
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

                {/* Review Card Actions */}
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
              {selectedFilter === 'all'
                ? "You haven't received any reviews yet. Share your QR code or review link to get started!"
                : `No reviews matching ${selectedFilter} stars.`}
            </p>
            <div className="empty-actions">
              <Link to={`/review/${businessId}`} className="btn-primary">
                Test Review Submission
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* WhatsApp & SMS Invite Modal */}
      {showWhatsAppModal && (
        <WhatsAppInviteModal
          business={business}
          reviewUrl={reviewUrl}
          onClose={() => setShowWhatsAppModal(false)}
        />
      )}

      {/* AI Review Reply Modal */}
      {selectedReviewForReply && (
        <AiReplyModal
          review={selectedReviewForReply}
          business={business}
          onClose={() => setSelectedReviewForReply(null)}
        />
      )}

      {/* Standee Designer Studio Modal */}
      {showStandeeStudio && (
        <StandeeDesigner
          business={business}
          reviewUrl={reviewUrl}
          onClose={() => setShowStandeeStudio(false)}
        />
      )}

      {/* QR Code Modal */}
      {showQRModal && (
        <div className="modal-backdrop" onClick={() => setShowQRModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Shareable QR Code</h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setShowQRModal(false)}
              >
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
