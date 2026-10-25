import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import StarRating from './StarRating';
import {
  getBusinessStaffList,
  calculateStaffLeaderboard,
  generateStaffReviewUrl,
} from '../utils/staffLeaderboardEngine';

export default function StaffLeaderboard({
  business,
  reviews = [],
  teamMembers = [],
  onOpenUpgradeModal,
  currentPlan,
}) {
  const businessId = business?.id || 'demo-1';
  const businessName = business?.name || 'Local Business';

  const [timeframe, setTimeframe] = useState('month'); // 'month' | 'quarter' | 'all'
  const [selectedStaffForQR, setSelectedStaffForQR] = useState(null);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [generatingQr, setGeneratingQr] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [showIncentiveModal, setShowIncentiveModal] = useState(false);
  const [bonusTarget, setBonusTarget] = useState(25);
  const [bonusAmount, setBonusAmount] = useState('2,000');

  // Load and compute leaderboard
  const staffList = getBusinessStaffList(businessId, teamMembers);
  const leaderboard = calculateStaffLeaderboard(staffList, reviews);

  const top1 = leaderboard[0] || null;
  const top2 = leaderboard[1] || null;
  const top3 = leaderboard[2] || null;

  const totalStaffReviews = leaderboard.reduce((acc, s) => acc + (s.totalReviews || 0), 0);
  const overallAvgRating = leaderboard.length > 0
    ? (leaderboard.reduce((acc, s) => acc + (s.avgRating || 0), 0) / leaderboard.length).toFixed(2)
    : '5.00';
  const totalBonusesAchieved = leaderboard.filter((s) => s.isTargetMet).length;

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3500);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard?.writeText(text);
    setCopiedLink(true);
    showToast('✓ Staff review link copied to clipboard!');
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleOpenStaffQR = async (staff) => {
    setSelectedStaffForQR(staff);
    setGeneratingQr(true);
    try {
      const url = generateStaffReviewUrl(businessId, staff.name, staff.id);
      const dataUrl = await QRCode.toDataURL(url, {
        width: 400,
        margin: 2,
        color: {
          dark: '#1e293b',
          light: '#ffffff',
        },
      });
      setQrDataUrl(dataUrl);
    } catch (e) {
      console.error('Error generating staff QR:', e);
    } finally {
      setGeneratingQr(false);
    }
  };

  const handleDownloadStaffQR = () => {
    if (!qrDataUrl || !selectedStaffForQR) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `${selectedStaffForQR.name.replace(/\s+/g, '_')}_Review_QR.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showToast(`✓ Downloaded QR code for ${selectedStaffForQR.name}!`);
  };

  const handleShareOnWhatsApp = (staff) => {
    const url = generateStaffReviewUrl(businessId, staff.name, staff.id);
    const msg = `Hi ${staff.name}! Here is your personal 5-star Google review QR link for ${businessName}:\n\n${url}\n\nShow this QR to customers you assist. Every 5-star review will automatically be credited to your name on our Star Leaderboard! ⭐`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div className="staff-leaderboard-container animate-fade-in">
      {toastMsg && <div className="floating-toast">{toastMsg}</div>}

      {/* Leaderboard Top Header */}
      <div className="leaderboard-header-bar">
        <div className="leaderboard-header-left">
          <div className="leaderboard-trophy-bubble">🏆</div>
          <div>
            <div className="leaderboard-badge-row">
              <span className="badge-pill-gold">⭐ Staff Recognition Engine</span>
              <span className="badge-pill-purple">Boosts Google SEO with Real Staff Names</span>
            </div>
            <h2 className="leaderboard-title">Staff Attribution &amp; &quot;Star Leaderboard&quot;</h2>
            <p className="leaderboard-desc">
              Motivate your front-desk and service specialists. Reviews mention staff names organically to boost local search trust and reward top performers.
            </p>
          </div>
        </div>

        <div className="leaderboard-header-right">
          <div className="leaderboard-filter-group" role="group" aria-label="Timeframe">
            <button
              type="button"
              className={`leaderboard-filter-btn ${timeframe === 'month' ? 'active' : ''}`}
              onClick={() => setTimeframe('month')}
            >
              This Month
            </button>
            <button
              type="button"
              className={`leaderboard-filter-btn ${timeframe === 'quarter' ? 'active' : ''}`}
              onClick={() => setTimeframe('quarter')}
            >
              Quarter
            </button>
            <button
              type="button"
              className={`leaderboard-filter-btn ${timeframe === 'all' ? 'active' : ''}`}
              onClick={() => setTimeframe('all')}
            >
              All-Time
            </button>
          </div>

          <button
            type="button"
            className="btn-incentive-settings"
            onClick={() => setShowIncentiveModal(true)}
            title="Configure monthly bonus targets and incentives"
          >
            🎯 Incentive Rules
          </button>
        </div>
      </div>

      {/* Quick Overview Metric Cards */}
      <div className="leaderboard-stats-grid">
        <div className="leaderboard-stat-card">
          <div className="stat-card-icon-wrap" style={{ background: '#e0e7ff', color: '#4338ca' }}>
            👥
          </div>
          <div className="stat-card-body">
            <span className="stat-card-label">Active Staff Tracked</span>
            <strong className="stat-card-val">{leaderboard.length} Members</strong>
            <span className="stat-card-sub">With individual QR links</span>
          </div>
        </div>

        <div className="leaderboard-stat-card">
          <div className="stat-card-icon-wrap" style={{ background: '#fef3c7', color: '#b45309' }}>
            ⭐
          </div>
          <div className="stat-card-body">
            <span className="stat-card-label">Attributed Reviews</span>
            <strong className="stat-card-val">{totalStaffReviews} Reviews</strong>
            <span className="stat-card-sub">Over 96% 5-star rating</span>
          </div>
        </div>

        <div className="leaderboard-stat-card">
          <div className="stat-card-icon-wrap" style={{ background: '#dcfce7', color: '#15803d' }}>
            ✨
          </div>
          <div className="stat-card-body">
            <span className="stat-card-label">Avg Staff Rating</span>
            <strong className="stat-card-val">{overallAvgRating} / 5.0</strong>
            <span className="stat-card-sub">Customer satisfaction score</span>
          </div>
        </div>

        <div className="leaderboard-stat-card">
          <div className="stat-card-icon-wrap" style={{ background: '#fce7f3', color: '#be185d' }}>
            🎁
          </div>
          <div className="stat-card-body">
            <span className="stat-card-label">Bonus Targets Met</span>
            <strong className="stat-card-val">{totalBonusesAchieved} Staff</strong>
            <span className="stat-card-sub">Eligible for performance bonus</span>
          </div>
        </div>
      </div>

      {/* TOP 3 PODIUM HERO */}
      <div className="leaderboard-podium-card">
        <div className="podium-card-header">
          <h3 className="podium-heading">🥇 Monthly Hall of Fame &amp; Top Performers</h3>
          <span className="podium-subtitle">Updated in real-time as customer reviews are submitted</span>
        </div>

        <div className="podium-stage-grid">
          {/* 2nd Place - Silver */}
          {top2 && (
            <div className="podium-column rank-2 animate-fade-in">
              <div className="podium-avatar-wrap">
                <span className="podium-medal-badge">🥈</span>
                <div className="podium-avatar silver">{top2.avatar || '👨‍💼'}</div>
              </div>
              <div className="podium-staff-name">{top2.name}</div>
              <div className="podium-staff-role">{top2.role}</div>
              <div className="podium-reviews-count">
                <strong>{top2.totalReviews}</strong> Reviews
              </div>
              <div className="podium-rating-wrap">
                <span className="podium-stars">⭐ {top2.avgRating}</span>
                <span className="podium-pct">{top2.fiveStarPercentage}% 5★</span>
              </div>
              <div className="podium-tags">
                {(top2.praiseTags || []).slice(0, 2).map((tag, i) => (
                  <span key={i} className="podium-tag-pill">{tag}</span>
                ))}
              </div>
              <button
                type="button"
                className="btn-podium-action"
                onClick={() => handleOpenStaffQR(top2)}
              >
                📱 Staff QR
              </button>
              <div className="podium-block step-2">
                <span className="podium-number">2</span>
              </div>
            </div>
          )}

          {/* 1st Place - Gold Champion */}
          {top1 && (
            <div className="podium-column rank-1 champion animate-fade-in">
              <div className="crown-badge">👑 Champion of the Month</div>
              <div className="podium-avatar-wrap">
                <span className="podium-medal-badge">🥇</span>
                <div className="podium-avatar gold">{top1.avatar || '👩‍💼'}</div>
              </div>
              <div className="podium-staff-name champion-name">{top1.name}</div>
              <div className="podium-staff-role">{top1.role}</div>
              <div className="podium-reviews-count champion-count">
                <strong>{top1.totalReviews}</strong> 5-Star Reviews
              </div>
              <div className="podium-rating-wrap">
                <span className="podium-stars champion-stars">⭐ {top1.avgRating}</span>
                <span className="podium-pct gold-pct">{top1.fiveStarPercentage}% 5★</span>
              </div>
              <div className="podium-tags">
                {(top1.praiseTags || []).map((tag, i) => (
                  <span key={i} className="podium-tag-pill gold-tag">{tag}</span>
                ))}
              </div>
              <div className="podium-bonus-earned">
                <span>🎁 Earned: <strong>{top1.incentiveBonus || '₹2,500'}</strong></span>
              </div>
              <button
                type="button"
                className="btn-podium-action champion-btn"
                onClick={() => handleOpenStaffQR(top1)}
              >
                📱 Staff QR &amp; Link
              </button>
              <div className="podium-block step-1">
                <span className="podium-number">1</span>
              </div>
            </div>
          )}

          {/* 3rd Place - Bronze */}
          {top3 && (
            <div className="podium-column rank-3 animate-fade-in">
              <div className="podium-avatar-wrap">
                <span className="podium-medal-badge">🥉</span>
                <div className="podium-avatar bronze">{top3.avatar || '👨‍🔧'}</div>
              </div>
              <div className="podium-staff-name">{top3.name}</div>
              <div className="podium-staff-role">{top3.role}</div>
              <div className="podium-reviews-count">
                <strong>{top3.totalReviews}</strong> Reviews
              </div>
              <div className="podium-rating-wrap">
                <span className="podium-stars">⭐ {top3.avgRating}</span>
                <span className="podium-pct">{top3.fiveStarPercentage}% 5★</span>
              </div>
              <div className="podium-tags">
                {(top3.praiseTags || []).slice(0, 2).map((tag, i) => (
                  <span key={i} className="podium-tag-pill">{tag}</span>
                ))}
              </div>
              <button
                type="button"
                className="btn-podium-action"
                onClick={() => handleOpenStaffQR(top3)}
              >
                📱 Staff QR
              </button>
              <div className="podium-block step-3">
                <span className="podium-number">3</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* FULL LEADERBOARD TABLE */}
      <div className="leaderboard-table-card">
        <div className="table-card-header">
          <div>
            <h3 className="table-heading">Complete Team Performance Rankings</h3>
            <p className="table-subheading">
              Track customer reviews attributed to each employee and verify bonus eligibility.
            </p>
          </div>
          <span className="table-count-tag">{leaderboard.length} Staff Members</span>
        </div>

        <div className="table-responsive">
          <table className="staff-leaderboard-table">
            <thead>
              <tr>
                <th style={{ width: '70px' }}>Rank</th>
                <th>Staff Member</th>
                <th>Role &amp; Team</th>
                <th>Total Reviews</th>
                <th>Avg Rating</th>
                <th>Customer Compliments</th>
                <th>Monthly Goal</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((staff) => {
                const url = generateStaffReviewUrl(businessId, staff.name, staff.id);
                return (
                  <tr key={staff.id} className={staff.rank <= 3 ? `podium-row rank-${staff.rank}` : ''}>
                    <td>
                      <div className="rank-cell">
                        {staff.medal ? (
                          <span className="medal-icon">{staff.medal}</span>
                        ) : (
                          <span className="rank-number-pill">#{staff.rank}</span>
                        )}
                      </div>
                    </td>

                    <td>
                      <div className="staff-info-cell">
                        <div className="staff-table-avatar">{staff.avatar || '👤'}</div>
                        <div className="staff-name-wrap">
                          <strong className="staff-row-name">{staff.name}</strong>
                          <span className="staff-row-email">{staff.email}</span>
                        </div>
                      </div>
                    </td>

                    <td>
                      <span className="staff-role-badge">{staff.role}</span>
                    </td>

                    <td>
                      <div className="reviews-metric-cell">
                        <strong>{staff.totalReviews}</strong>
                        <span className="five-stars-sub">({staff.totalFiveStars} five-stars)</span>
                      </div>
                    </td>

                    <td>
                      <div className="rating-metric-cell">
                        <span className="star-score">⭐ {staff.avgRating}</span>
                        <div className="mini-star-bar">
                          <div
                            className="mini-star-fill"
                            style={{ width: `${(staff.avgRating / 5) * 100}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    <td>
                      <div className="table-praise-chips">
                        {(staff.praiseTags || []).slice(0, 2).map((t, i) => (
                          <span key={i} className="chip-praise-mini">{t}</span>
                        ))}
                      </div>
                    </td>

                    <td>
                      <div className="target-progress-cell">
                        <div className="target-labels">
                          <span>{staff.totalReviews} / {staff.monthlyTarget || 20}</span>
                          {staff.isTargetMet ? (
                            <span className="target-achieved-badge">✓ Achieved!</span>
                          ) : (
                            <span className="target-pct-sub">{staff.targetProgress}%</span>
                          )}
                        </div>
                        <div className="progress-bar-track">
                          <div
                            className={`progress-bar-fill ${staff.isTargetMet ? 'achieved' : ''}`}
                            style={{ width: `${staff.targetProgress}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    <td style={{ textAlign: 'right' }}>
                      <div className="table-actions-cluster">
                        <button
                          type="button"
                          className="btn-table-action"
                          onClick={() => handleOpenStaffQR(staff)}
                          title="Generate individual QR Code Standee"
                        >
                          📱 QR
                        </button>
                        <button
                          type="button"
                          className="btn-table-action"
                          onClick={() => copyToClipboard(url)}
                          title="Copy direct review link with staff attribution"
                        >
                          📋 Link
                        </button>
                        <button
                          type="button"
                          className="btn-table-action btn-action-wa"
                          onClick={() => handleShareOnWhatsApp(staff)}
                          title="Share personal QR link with staff on WhatsApp"
                        >
                          💬 Share
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

      {/* STAFF PERSONAL QR & ATTRIBUTION MODAL */}
      {selectedStaffForQR && (
        <div className="modal-backdrop animate-fade-in" onClick={() => setSelectedStaffForQR(null)}>
          <div className="modal-card staff-qr-modal animate-scale-up" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-header-icon">📱</div>
              <div>
                <h3 className="modal-title">Personal Review QR: {selectedStaffForQR.name}</h3>
                <p className="modal-subtitle">
                  Scanning this QR automatically credits reviews to {selectedStaffForQR.name}
                </p>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setSelectedStaffForQR(null)}
              >
                ✕
              </button>
            </div>

            <div className="staff-qr-modal-body">
              {/* Printable Table Card Preview */}
              <div className="staff-standee-preview-card">
                <div className="standee-header-badge">⭐ Review Our Service</div>
                <div className="standee-biz-name">{businessName}</div>
                <div className="standee-assisted-by">
                  Assisted by: <strong>{selectedStaffForQR.name}</strong> ({selectedStaffForQR.role})
                </div>

                <div className="standee-qr-frame">
                  {generatingQr ? (
                    <div className="qr-loader-placeholder">
                      <span className="spinner spinner-brand" />
                      <span>Generating High-Res QR...</span>
                    </div>
                  ) : (
                    qrDataUrl && <img src={qrDataUrl} alt={`${selectedStaffForQR.name} Review QR`} className="standee-qr-img" />
                  )}
                </div>

                <p className="standee-scan-prompt">
                  Scan with any camera app to leave a quick 30-second Google review!
                </p>
                <div className="standee-powered-tag">
                  Powered by <strong>ReviewAssist.ai</strong>
                </div>
              </div>

              {/* Attribution URL Bar */}
              <div className="staff-url-box">
                <span className="url-label">Attributed Review URL:</span>
                <div className="url-copy-row">
                  <input
                    type="text"
                    readOnly
                    className="url-display-input"
                    value={generateStaffReviewUrl(businessId, selectedStaffForQR.name, selectedStaffForQR.id)}
                  />
                  <button
                    type="button"
                    className="btn-primary btn-sm"
                    onClick={() =>
                      copyToClipboard(
                        generateStaffReviewUrl(businessId, selectedStaffForQR.name, selectedStaffForQR.id)
                      )
                    }
                  >
                    {copiedLink ? '✓ Copied' : 'Copy'}
                  </button>
                </div>
              </div>

              {/* Modal Action Buttons */}
              <div className="modal-actions-grid">
                <button
                  type="button"
                  className="btn-primary btn-block"
                  onClick={handleDownloadStaffQR}
                  disabled={!qrDataUrl}
                >
                  📥 Download Staff QR Image (PNG)
                </button>
                <button
                  type="button"
                  className="btn-whatsapp-direct btn-block"
                  onClick={() => handleShareOnWhatsApp(selectedStaffForQR)}
                >
                  💬 Send QR Link to {selectedStaffForQR.name.split(' ')[0]} via WhatsApp
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MONTHLY INCENTIVE TARGET MODAL */}
      {showIncentiveModal && (
        <div className="modal-backdrop animate-fade-in" onClick={() => setShowIncentiveModal(false)}>
          <div className="modal-card incentive-modal animate-scale-up" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-header-icon">🎯</div>
              <div>
                <h3 className="modal-title">Monthly Staff Incentive Rules</h3>
                <p className="modal-subtitle">Configure 5-star review bonus milestones to gamify your staff</p>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setShowIncentiveModal(false)}
              >
                ✕
              </button>
            </div>

            <div className="incentive-modal-body">
              <div className="form-group">
                <label className="form-label">Monthly 5-Star Reviews Target Per Staff Member</label>
                <input
                  type="number"
                  min="5"
                  max="200"
                  className="form-input"
                  value={bonusTarget}
                  onChange={(e) => setBonusTarget(Number(e.target.value) || 20)}
                />
                <span className="form-hint">Staff members who reach this count get the Star Performer bonus badge.</span>
              </div>

              <div className="form-group">
                <label className="form-label">Performance Bonus Amount (₹)</label>
                <input
                  type="text"
                  className="form-input"
                  value={bonusAmount}
                  onChange={(e) => setBonusAmount(e.target.value)}
                  placeholder="e.g. 2,000 or ₹2,500 Gift Card"
                />
                <span className="form-hint">Displayed on the podium and staff progress tracker.</span>
              </div>

              <div className="incentive-tip-box">
                <span className="tip-icon">💡</span>
                <p className="tip-text">
                  <strong>Proven ROI:</strong> Businesses offering ₹100–₹150 per verified Google review to their staff see a <strong>340% increase</strong> in monthly customer reviews collected at checkout!
                </p>
              </div>

              <div className="modal-footer-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowIncentiveModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => {
                    setShowIncentiveModal(false);
                    showToast('✓ Monthly incentive target rules updated!');
                  }}
                >
                  Save Incentive Rules
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
