import React, { useState, useEffect, useRef } from 'react';
import {
  STORY_THEMES,
  renderSocialStory,
  downloadCanvasImage,
  copyCanvasToClipboard,
} from '../utils/socialStoryExport';

export default function SocialStoryModal({
  isOpen,
  onClose,
  initialReview,
  allReviews = [],
  business,
  reviewUrl,
}) {
  if (!isOpen) return null;

  const bizName = business?.name || 'Your Business';
  const cleanReviewUrl = reviewUrl || `https://reviewassist.ai/review/${business?.id || 'demo'}`;

  // State
  const [format, setFormat] = useState('story'); // 'story' | 'post'
  const [themeId, setThemeId] = useState('dark_neon');
  const [customerName, setCustomerName] = useState(
    initialReview?.customerName || initialReview?.author || 'Priya Sharma'
  );
  const [reviewText, setReviewText] = useState(
    initialReview?.text ||
      initialReview?.draftText ||
      'Top notch experience! The staff was super warm, listened to what I wanted, and delivered beyond my expectations. Definitely my go-to place from now on.'
  );
  const [serviceType, setServiceType] = useState(
    initialReview?.serviceType || '5-Star Experience'
  );
  const [showQr, setShowQr] = useState(true);
  const [showGoogleBadge, setShowGoogleBadge] = useState(true);

  // Status flags
  const [isRendering, setIsRendering] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const canvasRef = useRef(null);

  // Render canvas whenever controls change
  useEffect(() => {
    let isCancelled = false;

    async function updateCanvas() {
      if (!canvasRef.current) return;
      setIsRendering(true);

      try {
        await renderSocialStory(canvasRef.current, {
          format,
          themeId,
          businessName: bizName,
          customerName: customerName || 'Valued Guest',
          reviewText: reviewText || 'Great service and overall experience!',
          serviceType: serviceType || 'Verified Customer',
          dateText: 'Verified Google Review',
          showQr: format === 'story' ? showQr : false,
          qrUrl: cleanReviewUrl,
          showGoogleBadge,
        });
      } catch (err) {
        console.warn('Canvas rendering notice:', err);
      } finally {
        if (!isCancelled) {
          setIsRendering(false);
        }
      }
    }

    updateCanvas();

    return () => {
      isCancelled = true;
    };
  }, [format, themeId, customerName, reviewText, serviceType, showQr, showGoogleBadge, bizName, cleanReviewUrl]);

  // Handle Review selection from dropdown
  const handleSelectExistingReview = (reviewId) => {
    const found = allReviews.find((r) => r.id === reviewId);
    if (found) {
      setCustomerName(found.customerName || found.author || 'Happy Customer');
      setReviewText(found.text || found.draftText || '');
      setServiceType(found.serviceType || '5-Star Service');
    }
  };

  const handleDownload = () => {
    if (!canvasRef.current) return;
    const cleanFileName = `${bizName.replace(/\s+/g, '-')}-Review-${format === 'story' ? 'Story' : 'Post'}.png`;
    downloadCanvasImage(canvasRef.current, cleanFileName);
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 2500);
  };

  const handleCopyClipboard = async () => {
    if (!canvasRef.current) return;
    try {
      await copyCanvasToClipboard(canvasRef.current);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2500);
    } catch (err) {
      // Fallback: download if browser doesn't support clipboard image write
      handleDownload();
    }
  };

  return (
    <div className="modal-backdrop social-modal-backdrop" onClick={onClose}>
      <div
        className="modal-content social-story-modal-container animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="social-modal-header">
          <div className="social-modal-title-group">
            <span className="social-modal-icon">📸</span>
            <div>
              <h3 className="social-modal-title">1-Click Social Media Review Poster</h3>
              <p className="social-modal-sub">
                Turn authentic 5-star Google reviews into viral Instagram Stories, WhatsApp Status &amp; Facebook graphics in 1 second.
              </p>
            </div>
          </div>
          <button type="button" className="btn-modal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        {/* Modal Body: 2-Column Split */}
        <div className="social-modal-body-split">
          {/* Left Column: Live Canvas Preview Stage */}
          <div className="social-preview-column">
            <div className="social-canvas-stage">
              {isRendering && (
                <div className="canvas-render-spinner">
                  <span>✨ Generating High-Res Graphic...</span>
                </div>
              )}
              <canvas
                ref={canvasRef}
                className={`social-preview-canvas ${format === 'story' ? 'format-story' : 'format-post'}`}
              />
            </div>

            <div className="social-preview-meta">
              <span className="meta-badge">
                {format === 'story' ? '📱 1080 × 1920 (9:16 Story / Status)' : '🖼️ 1080 × 1080 (1:1 Square Post)'}
              </span>
              <span className="meta-hint">Click download for crisp 300-DPI high resolution</span>
            </div>
          </div>

          {/* Right Column: Customization Controls & Instant Export */}
          <div className="social-controls-column">
            {/* 1. Format Switcher */}
            <div className="control-group">
              <label className="control-label">Aspect Ratio / Placement</label>
              <div className="format-toggle-pills">
                <button
                  type="button"
                  className={`format-btn ${format === 'story' ? 'active' : ''}`}
                  onClick={() => setFormat('story')}
                >
                  <span className="format-icon">📱</span>
                  <span>Instagram Story / WhatsApp Status (9:16)</span>
                </button>
                <button
                  type="button"
                  className={`format-btn ${format === 'post' ? 'active' : ''}`}
                  onClick={() => setFormat('post')}
                >
                  <span className="format-icon">🖼️</span>
                  <span>Instagram / Facebook Post (1:1 Square)</span>
                </button>
              </div>
            </div>

            {/* 2. Theme Selector */}
            <div className="control-group">
              <label className="control-label">Aesthetic Theme</label>
              <div className="theme-chips-grid">
                {STORY_THEMES.map((theme) => {
                  const isSelected = theme.id === themeId;
                  return (
                    <button
                      key={theme.id}
                      type="button"
                      className={`theme-chip ${isSelected ? 'selected' : ''}`}
                      onClick={() => setThemeId(theme.id)}
                    >
                      <span className="theme-chip-icon">{theme.icon}</span>
                      <span className="theme-chip-name">{theme.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. Review Selector (if multiple reviews exist) */}
            {allReviews.length > 1 && (
              <div className="control-group">
                <label className="control-label">Select Customer Review</label>
                <select
                  className="form-select select-review-picker"
                  onChange={(e) => handleSelectExistingReview(e.target.value)}
                  defaultValue={initialReview?.id || ''}
                >
                  <option value="">— Choose a Review to Highlight —</option>
                  {allReviews.map((r, i) => (
                    <option key={r.id || i} value={r.id}>
                      ★ {r.rating || 5} — {r.customerName || r.author || 'Guest'} (&quot;
                      {(r.text || r.draftText || '').substring(0, 45)}...&quot;)
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* 4. Quote Editor */}
            <div className="control-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="control-label">Review Quote Content</label>
                <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                  {reviewText.length} characters
                </span>
              </div>
              <textarea
                className="form-textarea quote-editor-box"
                rows={3}
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                placeholder="Enter customer praise quote..."
              />
            </div>

            {/* 5. Author & Service Tags */}
            <div className="form-row-2col">
              <div className="control-group">
                <label className="control-label">Customer Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. Rahul Mehta"
                />
              </div>

              <div className="control-group">
                <label className="control-label">Service Tag</label>
                <input
                  type="text"
                  className="form-input"
                  value={serviceType}
                  onChange={(e) => setServiceType(e.target.value)}
                  placeholder="e.g. Hair Styling, Dinner, Service"
                />
              </div>
            </div>

            {/* 6. Feature Toggles */}
            <div className="toggles-box">
              {format === 'story' && (
                <label className="toggle-label-row">
                  <input
                    type="checkbox"
                    checked={showQr}
                    onChange={(e) => setShowQr(e.target.checked)}
                  />
                  <span>Include QR Code on Graphic (Followers can scan to review)</span>
                </label>
              )}

              <label className="toggle-label-row">
                <input
                  type="checkbox"
                  checked={showGoogleBadge}
                  onChange={(e) => setShowGoogleBadge(e.target.checked)}
                />
                <span>Include Official Google Review Badge</span>
              </label>
            </div>

            {/* 7. Action Export Buttons */}
            <div className="social-export-actions">
              <button
                type="button"
                className={`btn-export-download ${downloadSuccess ? 'success' : ''}`}
                onClick={handleDownload}
              >
                <span>📥</span>
                <span>{downloadSuccess ? '✓ Downloaded!' : 'Download High-Res PNG (1080p)'}</span>
              </button>

              <button
                type="button"
                className={`btn-export-clipboard ${copySuccess ? 'success' : ''}`}
                onClick={handleCopyClipboard}
              >
                <span>📋</span>
                <span>{copySuccess ? '✓ Copied to Clipboard!' : 'Copy to Clipboard'}</span>
              </button>
            </div>

            <div className="social-export-tip">
              <span>💡</span>
              <p>
                <strong>Pro Tip:</strong> Post this to your WhatsApp Status and Instagram Story every Tuesday and Friday to remind followers of your 5-star reputation!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
