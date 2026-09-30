import React, { useState, useRef, useEffect } from 'react';
import QRCode from 'qrcode';
import QRStandeeCard from './QRStandeeCard';
import { exportHighResStandee } from '../utils/standeeExport';

export default function StandeeDesigner({
  business,
  reviewUrl,
  planId = 'starter',
  userRole = 'business_owner',
  onOpenUpgradeModal,
  onClose,
}) {
  const isStarter = planId === 'starter';
  const [template, setTemplate] = useState('portrait'); // 'portrait' (5x7) | 'table_tent' (4x6) | 'poster' (A4) | 'sticker' (4x4)
  const [colorTheme, setColorTheme] = useState('google'); // 'google' | 'acrylic' | 'midnight' | 'emerald' | 'brand'
  const [showBackdrop, setShowBackdrop] = useState(true);
  const [showBase, setShowBase] = useState(true);
  const [show30sFlow, setShow30sFlow] = useState(true);
  const [headline, setHeadline] = useState('Review us on Google');
  const [tagline, setTagline] = useState('Scan the above QR code with your smartphone and make our day by leaving us a review on Google!');
  const [showUpsellModal, setShowUpsellModal] = useState(false);
  const [orderSubmitted, setOrderSubmitted] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState('');

  const standeeCardRef = useRef(null);
  const canvasRef = useRef(null);

  const bizName = business?.name || 'Local Business';
  const bizCategory = business?.category || 'Service';

  const handleSelectTemplate = (tId) => {
    if (isStarter && (tId === 'poster' || tId === 'sticker')) {
      if (onOpenUpgradeModal) {
        onOpenUpgradeModal();
      } else {
        alert('Wall Posters and POS Decals are exclusive to Pro Growth and Enterprise plans.');
      }
      return;
    }
    setTemplate(tId);
  };

  // Generate QR code data URL for high-res export
  useEffect(() => {
    if (reviewUrl) {
      QRCode.toDataURL(
        reviewUrl,
        {
          width: 800,
          margin: 1,
          color: {
            dark: '#111827',
            light: '#ffffff',
          },
          errorCorrectionLevel: 'H',
        },
        (err, url) => {
          if (!err && url) setQrDataUrl(url);
        }
      );
    }
  }, [reviewUrl]);

  // Handle Direct Print
  const handlePrint = () => {
    window.print();
  };

  // Handle High-Res 300-DPI Standee Download
  const handleDownloadImage = async () => {
    setDownloading(true);
    try {
      await exportHighResStandee({
        business,
        reviewUrl,
        qrDataUrl,
        theme: colorTheme,
        showBackdrop,
        headline,
        tagline,
        show30sFlow,
        format: template,
      });
    } catch (err) {
      console.error('Standee export error:', err);
      // Fallback: print if export fails
      window.print();
    } finally {
      setDownloading(false);
    }
  };

  // Handle Download Standalone QR Code Only
  const [downloadingQrOnly, setDownloadingQrOnly] = useState(false);

  const handleDownloadQrOnly = async () => {
    if (!reviewUrl) return;
    setDownloadingQrOnly(true);
    try {
      const standaloneQrUrl = await QRCode.toDataURL(reviewUrl, {
        width: 1200,
        margin: 2,
        color: {
          dark: colorTheme === 'midnight' ? '#0f172a' : '#111827',
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
    } catch (err) {
      console.error('Failed to download QR code only:', err);
    } finally {
      setDownloadingQrOnly(false);
    }
  };

  return (
    <div className="standee-studio-overlay">
      <div className="standee-studio-container">
        {/* Top Header */}
        <div className="standee-studio-header">
          <div className="studio-header-titles">
            <span className="section-tag">Printable Marketing Station</span>
            <h2 className="studio-title">QR Standee & Table-Tent Studio</h2>
            <p className="studio-subtitle">
              Design, customize, and print 5-star Google review standees for <strong>{bizName}</strong> with 30-second AI review flow.
            </p>
          </div>
          {onClose && (
            <button
              type="button"
              className="modal-close-btn"
              onClick={onClose}
              title="Close Studio"
            >
              &times;
            </button>
          )}
        </div>

        {/* Studio Main Workspace */}
        <div className="standee-workspace-grid">
          {/* Left Controls Panel */}
          <div className="standee-controls-panel">
            {/* 1. Format / Template Selector */}
            <div className="control-group">
              <label className="control-label">1. Choose Display Format</label>
              <div className="format-options-grid">
                <button
                  type="button"
                  className={`format-btn ${template === 'portrait' ? 'active' : ''}`}
                  onClick={() => setTemplate('portrait')}
                >
                  <span className="format-icon">🏢</span>
                  <span className="format-name">Counter Standee</span>
                  <span className="format-sub">Acrylic 5x7" (Most Popular)</span>
                </button>

                <button
                  type="button"
                  className={`format-btn ${template === 'table_tent' ? 'active' : ''}`}
                  onClick={() => setTemplate('table_tent')}
                >
                  <span className="format-icon">🍽️</span>
                  <span className="format-name">Table Tent</span>
                  <span className="format-sub">Foldable 4x6"</span>
                </button>

                <button
                  type="button"
                  className={`format-btn ${template === 'poster' ? 'active' : ''} ${isStarter ? 'locked-feature' : ''}`}
                  onClick={() => handleSelectTemplate('poster')}
                >
                  <span className="format-icon">🪧</span>
                  <div className="format-name-row">
                    <span className="format-name">Wall Poster</span>
                    {isStarter && <span className="pro-lock-pill">PRO</span>}
                  </div>
                  <span className="format-sub">A4 / Letter Frame</span>
                </button>

                <button
                  type="button"
                  className={`format-btn ${template === 'sticker' ? 'active' : ''} ${isStarter ? 'locked-feature' : ''}`}
                  onClick={() => handleSelectTemplate('sticker')}
                >
                  <span className="format-icon">🏷️</span>
                  <div className="format-name-row">
                    <span className="format-name">POS Decal</span>
                    {isStarter && <span className="pro-lock-pill">PRO</span>}
                  </div>
                  <span className="format-sub">4x4" Square Sticker</span>
                </button>
              </div>
            </div>

            {/* 2. Color Theme */}
            <div className="control-group">
              <label className="control-label">2. Visual Theme & Style</label>
              <div className="standee-theme-selector-grid">
                {[
                  { id: 'google', name: 'Google Official', desc: '4-Color Iconic Backdrop', badge: 'Recommended' },
                  { id: 'acrylic', name: 'Crystal Acrylic', desc: 'Clean Minimal Translucent', badge: '' },
                  { id: 'midnight', name: 'Obsidian Noir', desc: 'Dark Slate & Gold Luxury', badge: 'VIP' },
                  { id: 'emerald', name: 'Emerald Mint', desc: 'Fresh Health & Clinic', badge: '' },
                ].map((th) => (
                  <button
                    key={th.id}
                    type="button"
                    className={`standee-theme-card-btn ${colorTheme === th.id ? 'active' : ''}`}
                    onClick={() => {
                      setColorTheme(th.id);
                      if (th.id === 'google') setShowBackdrop(true);
                    }}
                  >
                    <div className="theme-btn-top">
                      <span className="theme-name">{th.name}</span>
                      {th.badge && <span className="theme-badge">{th.badge}</span>}
                    </div>
                    <span className="theme-desc">{th.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Toggles */}
            <div className="control-group">
              <label className="control-label">3. Layout Options</label>
              <div className="standee-toggles-list">
                <label className="standee-toggle-item">
                  <input
                    type="checkbox"
                    checked={showBackdrop}
                    onChange={(e) => setShowBackdrop(e.target.checked)}
                  />
                  <div>
                    <strong>Google Geometric Backdrop</strong>
                    <span className="toggle-sub">Show full multi-color diagonal border</span>
                  </div>
                </label>

                <label className="standee-toggle-item">
                  <input
                    type="checkbox"
                    checked={show30sFlow}
                    onChange={(e) => setShow30sFlow(e.target.checked)}
                  />
                  <div>
                    <strong>⚡ 30-Second AI Review Flow</strong>
                    <span className="toggle-sub">1-Tap Scan ➔ AI Drafts 5★ Review</span>
                  </div>
                </label>

                <label className="standee-toggle-item">
                  <input
                    type="checkbox"
                    checked={showBase}
                    onChange={(e) => setShowBase(e.target.checked)}
                  />
                  <div>
                    <strong>Acrylic Desk Base Simulation</strong>
                    <span className="toggle-sub">Show 3D base on counter mockup</span>
                  </div>
                </label>
              </div>
            </div>

            {/* 4. Text Customization */}
            <div className="control-group">
              <label className="control-label">4. Callout Message</label>
              <textarea
                className="form-textarea"
                rows="2"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                placeholder="Call to action message..."
              />
            </div>

            {/* Actions Toolbar */}
            <div className="standee-actions-toolbar">
              <button
                type="button"
                className="btn-primary btn-block btn-lg"
                onClick={handlePrint}
              >
                🖨️ Print Standee (1-Click)
              </button>

              <button
                type="button"
                className="btn-secondary btn-block"
                onClick={handleDownloadImage}
                disabled={downloading}
              >
                {downloading ? '⏳ Rendering 300-DPI Image...' : '⬇️ Download High-Res Standee PNG (300 DPI)'}
              </button>

              <button
                type="button"
                className="btn-secondary btn-block btn-download-qr-only"
                onClick={handleDownloadQrOnly}
                disabled={downloadingQrOnly}
                title="Download high-resolution standalone QR code image only"
              >
                {downloadingQrOnly ? '⏳ Generating QR Code...' : '📱 Download Only QR Code (PNG)'}
              </button>

              <button
                type="button"
                className="btn-order-acrylic btn-block"
                onClick={() => setShowUpsellModal(true)}
              >
                💎 Order Physical Acrylic Laser Standee ($29)
              </button>
            </div>
          </div>

          {/* Right Live Standee Preview Area */}
          <div className="standee-preview-container">
            <div className="standee-preview-viewport">
              <div className="preview-scale-wrapper">
                <QRStandeeCard
                  business={business}
                  reviewUrl={reviewUrl}
                  theme={colorTheme}
                  format={template}
                  showBackdrop={showBackdrop}
                  showBase={showBase}
                  headline={headline}
                  tagline={tagline}
                  show30sFlow={show30sFlow}
                  cardRef={standeeCardRef}
                  canvasRef={canvasRef}
                />
              </div>

              {/* Physical Standee Dimensions Hint */}
              <div className="standee-dimension-tag">
                {template === 'portrait' && '📐 5" × 7" Standard Acrylic Counter Display'}
                {template === 'table_tent' && '📐 4" × 6" Foldable Dual-Sided Table Tent'}
                {template === 'poster' && '📐 8.3" × 11.7" A4 Waiting Room / Wall Poster'}
                {template === 'sticker' && '📐 4" × 4" Square POS Terminal Decal'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Physical Standee Order Modal */}
      {showUpsellModal && (
        <div className="modal-backdrop" onClick={() => setShowUpsellModal(false)}>
          <div className="modal-content upsell-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>📦 Order Physical Acrylic Standee with NFC</h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setShowUpsellModal(false)}
              >
                &times;
              </button>
            </div>

            <div className="modal-body">
              {orderSubmitted ? (
                <div className="text-center py-4">
                  <div className="celebration-circle">🎉</div>
                  <h3 className="success-heading">Acrylic Standee Request Saved!</h3>
                  <p className="text-muted">
                    We've saved your custom acrylic standee specifications for <strong>{bizName}</strong>. Our team will coordinate delivery with you directly.
                  </p>
                  <button
                    type="button"
                    className="btn-primary mt-4"
                    onClick={() => {
                      setOrderSubmitted(false);
                      setShowUpsellModal(false);
                    }}
                  >
                    Back to Studio
                  </button>
                </div>
              ) : (
                <div className="upsell-modal-body">
                  <div className="upsell-badge">⭐ Premium Storefront Acrylic Plaque</div>
                  <h4 className="upsell-title">5mm High-Gloss Laser Cut Acrylic Standee</h4>
                  <p className="upsell-desc">
                    Get an ultra-premium, shatterproof transparent acrylic standee customized with your {bizName} QR code and an embedded contactless NFC smart chip.
                  </p>

                  <div className="upsell-features-list">
                    <div className="upsell-feature-item">
                      <span>💎</span> <strong>5mm Heavyweight Crystal Acrylic</strong> (Shatter-proof & UV-protected)
                    </div>
                    <div className="upsell-feature-item">
                      <span>📲</span> <strong>Embedded NFC Tap Chip</strong> (Customers tap phone to open Google Reviews)
                    </div>
                    <div className="upsell-feature-item">
                      <span>⚡</span> <strong>Includes 30-Second AI Flow</strong> (Increases 5-star conversion by 4x)
                    </div>
                    <div className="upsell-feature-item">
                      <span>🚚</span> <strong>Fast Doorstep Dispatch</strong> (Delivered ready-to-display)
                    </div>
                  </div>

                  <div className="upsell-price-row">
                    <div>
                      <span className="price-tag">$29.00 / ₹1,499</span>
                      <span className="price-sub">One-time production & shipping</span>
                    </div>
                    <button
                      type="button"
                      className="btn-primary btn-lg"
                      onClick={() => setOrderSubmitted(true)}
                    >
                      🚀 Request Standee Dispatch
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
