import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';

export default function StandeeDesigner({
  business,
  reviewUrl,
  onClose,
}) {
  const [template, setTemplate] = useState('portrait'); // 'portrait' | 'table_tent' | 'minimal' | 'sticker'
  const [colorTheme, setColorTheme] = useState('indigo'); // 'indigo' | 'emerald' | 'cyan' | 'midnight' | 'amber'
  const [headline, setHeadline] = useState('Review Us on Google');
  const [tagline, setTagline] = useState('Scan with your phone camera — AI will help craft your review in 30 seconds!');
  const [showUpsellModal, setShowUpsellModal] = useState(false);
  const [orderSubmitted, setOrderSubmitted] = useState(false);

  const standeeCanvasRef = useRef(null);
  const standeePreviewRef = useRef(null);

  const bizName = business?.name || 'Local Business';
  const bizCategory = business?.category || 'Service';

  // Generate QR Canvas
  useEffect(() => {
    if (standeeCanvasRef.current && reviewUrl) {
      QRCode.toCanvas(
        standeeCanvasRef.current,
        reviewUrl,
        {
          width: 200,
          margin: 1,
          color: {
            dark: colorTheme === 'midnight' ? '#0f172a' : '#0f172a',
            light: '#ffffff',
          },
        },
        (err) => {
          if (err) console.error('Error generating standee QR:', err);
        }
      );
    }
  }, [reviewUrl, colorTheme, template]);

  // Handle Direct Print
  const handlePrint = () => {
    window.print();
  };

  // Handle High-Res Image Download
  const handleDownloadImage = () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 1200;
    canvas.height = 1600;

    // Background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Theme header banner
    const themeGradients = {
      indigo: ['#4f46e5', '#7c3aed'],
      emerald: ['#059669', '#10b981'],
      cyan: ['#0891b2', '#06b6d4'],
      midnight: ['#0f172a', '#1e293b'],
      amber: ['#d97706', '#f59e0b'],
    };
    const [c1, c2] = themeGradients[colorTheme] || themeGradients.indigo;

    const grad = ctx.createLinearGradient(0, 0, canvas.width, 400);
    grad.addColorStop(0, c1);
    grad.addColorStop(1, c2);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, 360);

    // Header text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 56px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(bizName, canvas.width / 2, 160);

    ctx.font = '600 32px Plus Jakarta Sans, sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.fillText(bizCategory.toUpperCase(), canvas.width / 2, 230);

    // Main Headline
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 64px Outfit, sans-serif';
    ctx.fillText(headline, canvas.width / 2, 500);

    // Stars
    ctx.fillStyle = '#f59e0b';
    ctx.font = '54px Outfit, sans-serif';
    ctx.fillText('★ ★ ★ ★ ★', canvas.width / 2, 580);

    // Subtitle
    ctx.fillStyle = '#475569';
    ctx.font = '32px Plus Jakarta Sans, sans-serif';
    ctx.fillText(tagline.slice(0, 60), canvas.width / 2, 660);
    if (tagline.length > 60) {
      ctx.fillText(tagline.slice(60), canvas.width / 2, 710);
    }

    // Draw QR Code
    if (standeeCanvasRef.current) {
      ctx.drawImage(standeeCanvasRef.current, canvas.width / 2 - 250, 780, 500, 500);
    }

    // Footer prompt
    ctx.fillStyle = '#64748b';
    ctx.font = 'bold 30px Plus Jakarta Sans, sans-serif';
    ctx.fillText('⚡ Powered by ReviewAssist AI', canvas.width / 2, 1420);

    // Download trigger
    const link = document.createElement('a');
    link.download = `${bizName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-qr-standee.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div className="standee-studio-overlay">
      <div className="standee-studio-container">
        {/* Top Header */}
        <div className="standee-studio-header">
          <div>
            <span className="section-tag">Printable Marketing Station</span>
            <h2 className="studio-title">QR Standee & Table-Tent Designer</h2>
            <p className="studio-subtitle">
              Customize and print counter standees, table tents, and cards for {bizName} in seconds.
            </p>
          </div>
          {onClose && (
            <button type="button" className="modal-close-btn" onClick={onClose}>
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
                  <span className="format-sub">Acrylic 5x7"</span>
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
                  className={`format-btn ${template === 'minimal' ? 'active' : ''}`}
                  onClick={() => setTemplate('minimal')}
                >
                  <span className="format-icon">🏷️</span>
                  <span className="format-name">Minimal Card</span>
                  <span className="format-sub">Clean Reception</span>
                </button>

                <button
                  type="button"
                  className={`format-btn ${template === 'sticker' ? 'active' : ''}`}
                  onClick={() => setTemplate('sticker')}
                >
                  <span className="format-icon">🚪</span>
                  <span className="format-name">Window Decal</span>
                  <span className="format-sub">Square Sticker</span>
                </button>
              </div>
            </div>

            {/* 2. Color Palette */}
            <div className="control-group">
              <label className="control-label">2. Select Color Theme</label>
              <div className="color-swatches-row">
                {[
                  { id: 'indigo', label: 'Indigo / Violet', hex: '#4f46e5' },
                  { id: 'emerald', label: 'Emerald Mint', hex: '#059669' },
                  { id: 'cyan', label: 'Ocean Cyan', hex: '#0891b2' },
                  { id: 'midnight', label: 'Midnight Gold', hex: '#0f172a' },
                  { id: 'amber', label: 'Sunset Amber', hex: '#d97706' },
                ].map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    className={`color-swatch-btn ${colorTheme === c.id ? 'active' : ''}`}
                    onClick={() => setColorTheme(c.id)}
                    title={c.label}
                    style={{ backgroundColor: c.hex }}
                  >
                    {colorTheme === c.id && <span className="swatch-check">✓</span>}
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Text Customization */}
            <div className="control-group">
              <label className="control-label">3. Headline & Prompt</label>
              <input
                type="text"
                className="form-input mb-2"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                placeholder="e.g. Review Us on Google"
              />
              <textarea
                className="form-textarea"
                rows="2"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                placeholder="Call to action text..."
              />
            </div>

            {/* Actions Toolbar */}
            <div className="standee-actions-toolbar">
              <button
                type="button"
                className="btn-primary btn-block btn-lg"
                onClick={handlePrint}
              >
                🖨️ Print Standee Now
              </button>
              <button
                type="button"
                className="btn-secondary btn-block"
                onClick={handleDownloadImage}
              >
                ⬇️ Download High-Res PNG (1200x1600)
              </button>
              <button
                type="button"
                className="btn-order-acrylic btn-block"
                onClick={() => setShowUpsellModal(true)}
              >
                ✨ Order Laser Acrylic Standee ($29)
              </button>
            </div>
          </div>

          {/* Right Live Standee Preview Area */}
          <div className="standee-preview-container">
            <div className="standee-preview-viewport">
              {/* Standee Physical Acrylic Frame Simulation */}
              <div
                ref={standeePreviewRef}
                className={`standee-card-rendered theme-${colorTheme} format-${template}`}
                id="printable-standee-card"
              >
                {/* Acrylic Top Header */}
                <div className="standee-header-band">
                  <div className="standee-biz-icon">🏪</div>
                  <h3 className="standee-biz-name">{bizName}</h3>
                  <span className="standee-biz-category">{bizCategory}</span>
                </div>

                {/* Main Body */}
                <div className="standee-body">
                  <div className="standee-google-badge">
                    <span className="google-g-icon">G</span>
                    <span>Google Reviews</span>
                  </div>

                  <h2 className="standee-main-headline">{headline}</h2>

                  <div className="standee-stars-row">
                    ★★★★★
                  </div>

                  <p className="standee-tagline-text">{tagline}</p>

                  {/* QR Box */}
                  <div className="standee-qr-wrapper">
                    <canvas ref={standeeCanvasRef} className="standee-canvas" />
                    <div className="standee-scan-badge">
                      <span>📱 Point Camera to Scan</span>
                    </div>
                  </div>

                  {/* Bottom Trust Badge */}
                  <div className="standee-footer-note">
                    <span>⚡ AI Review Assistant in 30 Seconds</span>
                  </div>
                </div>
              </div>

              {/* Acrylic Base Mockup */}
              <div className="acrylic-stand-base"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Physical Standee Order Upsell Modal */}
      {showUpsellModal && (
        <div className="modal-backdrop" onClick={() => setShowUpsellModal(false)}>
          <div className="modal-content upsell-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>📦 Order Custom Acrylic Standee</h3>
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
                  <h3 className="success-heading">Order Received!</h3>
                  <p className="text-muted">
                    We've saved your custom acrylic standee design for <strong>{bizName}</strong>. Our manufacturing team will contact you at <strong>{business?.email || 'your email'}</strong> with tracking details.
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
                  <div className="upsell-badge">⭐ Premium Storefront Upgrade</div>
                  <h4 className="upsell-title">High-Gloss Laser Acrylic Standee</h4>
                  <p className="upsell-desc">
                    Get a luxury scratch-resistant transparent acrylic standee customized with your {bizName} QR code and NFC tap chip shipped directly to your store counter.
                  </p>

                  <div className="upsell-features-list">
                    <div className="upsell-feature-item">
                      <span>💎</span> <strong>High-Gloss 5mm Acrylic</strong> (Shatter-proof)
                    </div>
                    <div className="upsell-feature-item">
                      <span>📲</span> <strong>Built-in NFC Smart Chip</strong> (Tap phone to review)
                    </div>
                    <div className="upsell-feature-item">
                      <span>🚚</span> <strong>Free Express Shipping</strong> (Delivered in 3–5 days)
                    </div>
                  </div>

                  <div className="upsell-price-row">
                    <div>
                      <span className="price-tag">$29.00</span>
                      <span className="price-sub">One-time payment</span>
                    </div>
                    <button
                      type="button"
                      className="btn-primary btn-lg"
                      onClick={() => setOrderSubmitted(true)}
                    >
                      🚀 Confirm & Order Standee
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
