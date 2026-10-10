import React, { useEffect, useState, useRef } from 'react';
import QRCode from 'qrcode';
import { createQRDataUrlWithCenterLogo } from '../utils/qrLogoHelper';

/**
 * Official Google "G" 4-Color SVG Icon
 */
export function GoogleGIcon({ size = 48, className = '' }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={className}
      style={{ display: 'block', flexShrink: 0 }}
    >
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </svg>
  );
}

/**
 * 5 Crisp Golden Rating Stars
 */
export function GoldenRatingStars({ size = 22, color = '#FBBC05' }) {
  return (
    <div className="standee-rating-stars" style={{ display: 'flex', gap: '4px', color }}>
      {[...Array(5)].map((_, i) => (
        <svg
          key={i}
          viewBox="0 0 24 24"
          width={size}
          height={size}
          fill={color}
          style={{ display: 'inline-block' }}
        >
          <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
        </svg>
      ))}
    </div>
  );
}

/**
 * Pixel-Perfect Google Standee Card Component
 * Themes:
 *  - 'google-quadrant' (Default — Exact match to the user reference: 4-color border, top logo, bold name, 5 stars, "WE'D LOVE YOUR FEEDBACK", center logo QR)
 *  - 'google' (Geometric modern backdrop with official Google G)
 *  - 'acrylic' (Clear minimal frosted acrylic plaque)
 *  - 'midnight' (Dark luxury counter tent)
 */
export default function QRStandeeCard({
  business,
  reviewUrl,
  logoUrl = '',
  theme = 'google-quadrant',
  format = 'portrait',
  showBackdrop = true,
  showBase = true,
  headline = "WE'D LOVE YOUR FEEDBACK",
  tagline = 'Scan the above QR code with your smartphone and make our day by leaving us a review on Google!',
  show30sFlow = true,
  accentColor = '#4285F4',
  cardRef = null,
  canvasRef = null,
  className = '',
}) {
  const [qrSrc, setQrSrc] = useState('');
  const internalCanvasRef = useRef(null);
  const activeCanvasRef = canvasRef || internalCanvasRef;

  const bizName = business?.name || 'Local Business';
  const bizCategory = business?.category || '';
  const effectiveLogo = logoUrl || business?.logoUrl || '';
  const displayUrl = business?.website || reviewUrl?.split('?')[0]?.replace(/^https?:\/\//, '') || 'www.reviewassist.ai';

  // Generate QR image data with center logo
  useEffect(() => {
    if (!reviewUrl) return;

    let isMounted = true;

    // Use our high error correction generator with circular logo badge
    createQRDataUrlWithCenterLogo(reviewUrl, effectiveLogo, 800)
      .then((url) => {
        if (isMounted && url) {
          setQrSrc(url);
        }
      })
      .catch((err) => {
        console.warn('Center logo QR generation fallback:', err);
        // Fallback basic QR
        QRCode.toDataURL(
          reviewUrl,
          { width: 600, margin: 1, errorCorrectionLevel: 'H' },
          (e, basicUrl) => {
            if (isMounted && !e && basicUrl) setQrSrc(basicUrl);
          }
        );
      });

    // Also draw to canvas if ref is passed
    if (activeCanvasRef.current) {
      QRCode.toCanvas(
        activeCanvasRef.current,
        reviewUrl,
        {
          width: 320,
          margin: 1,
          color: { dark: '#111827', light: '#ffffff' },
          errorCorrectionLevel: 'H',
        },
        (err) => {
          if (err) console.warn('QR Canvas error:', err);
        }
      );
    }

    return () => {
      isMounted = false;
    };
  }, [reviewUrl, effectiveLogo, theme, activeCanvasRef]);

  // Render Flagship "Google 4-Color Quadrant" Standee (Matches User Reference Image)
  if (theme === 'google-quadrant') {
    return (
      <div className={`standee-wrapper-unit ${format} ${className}`}>
        {/* Outer Frame with 4-Color Border */}
        <div
          className="standee-outer-frame theme-google-quadrant"
          ref={cardRef}
          id="printable-standee-card"
          style={{ '--custom-accent': accentColor }}
        >
          {/* 4-Color Quadrant Border Backing */}
          <div className="google-quadrant-border" aria-hidden="true">
            <div className="quadrant-top-left" />
            <div className="quadrant-top-right" />
            <div className="quadrant-bottom-left" />
            <div className="quadrant-bottom-right" />
          </div>

          {/* Acrylic Glass Specular Glare */}
          <div className="acrylic-glass-glare" aria-hidden="true" />

          {/* Inner Crisp White Plaque */}
          <div className="standee-inner-plaque standee-quadrant-inner">
            {/* 1. Top Business Logo */}
            {effectiveLogo ? (
              <img
                src={effectiveLogo}
                alt={`${bizName} logo`}
                className="standee-quadrant-top-logo"
                loading="eager"
              />
            ) : (
              <div className="standee-quadrant-logo-fallback" title="Add business logo">
                <span>{bizName?.[0] || '🏢'}</span>
              </div>
            )}

            {/* 2. Business Name */}
            <h2 className="standee-quadrant-biz-name">{bizName}</h2>

            {/* 3. Five Golden Rating Stars */}
            <div className="standee-quadrant-stars">
              <GoldenRatingStars size={26} color="#FBBC05" />
            </div>

            {/* 4. Bold Callout Headline */}
            <div className="standee-quadrant-headline">
              <span className="line-1">WE’D LOVE</span>
              <span className="line-2">YOUR FEEDBACK</span>
            </div>

            {/* 5. Center QR Code Frame with Centered Logo */}
            <div className="standee-quadrant-qr-box">
              {qrSrc ? (
                <img
                  src={qrSrc}
                  alt={`Review QR for ${bizName}`}
                  className="standee-quadrant-qr-img"
                  loading="eager"
                />
              ) : (
                <div className="standee-qr-loading" style={{ width: 220, height: 220 }}>
                  <span className="qr-spinner" />
                  <span>Loading QR...</span>
                </div>
              )}
              {/* Fallback canvas for exports */}
              <canvas ref={activeCanvasRef} style={{ display: 'none' }} />
            </div>

            {/* Optional 30s AI flow helper note */}
            {show30sFlow && (
              <div className="standee-quadrant-quick-note">
                <span className="sparkle-icon">⚡</span>
                <span>Takes only 30 seconds • AI assists with review</span>
              </div>
            )}

            {/* Bottom Footer Details */}
            <div className="standee-quadrant-footer">
              {/* <div className="quadrant-slug">{displayUrl}</div> */}
              <div className="quadrant-powered">
                <span className="dot" /> Powered by <strong>ReviewAssist AI</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Realistic Acrylic Stand Base */}
        {showBase && (
          <div className="acrylic-standee-base-mockup" aria-hidden="true">
            <div className="acrylic-base-bevel" />
            <div className="acrylic-base-reflection" />
          </div>
        )}
      </div>
    );
  }

  // Render Classic Google or Midnight or Acrylic Themes
  return (
    <div className={`standee-wrapper-unit ${format} ${className}`}>
      {/* Outer Multi-color Backdrop Frame */}
      <div
        className={`standee-outer-frame theme-${theme} ${showBackdrop ? 'with-google-backdrop' : 'clean-insert'}`}
        ref={cardRef}
        id="printable-standee-card"
        style={{ '--custom-accent': accentColor }}
      >
        {/* Geometric Google Color Block Accents */}
        {showBackdrop && theme === 'google' && (
          <div className="google-geom-backdrop" aria-hidden="true">
            <div className="geom-shape geom-blue" />
            <div className="geom-shape geom-green" />
            <div className="geom-shape geom-yellow" />
            <div className="geom-shape geom-red" />
          </div>
        )}

        {/* Realistic Acrylic Surface Sheen */}
        <div className="acrylic-glass-glare" aria-hidden="true" />

        {/* Inner Standee White Plaque Card */}
        <div className="standee-inner-plaque">
          {/* Top Business Name Pill / Tag */}
          <div className="standee-top-biz-pill">
            {effectiveLogo ? (
              <img
                src={effectiveLogo}
                alt="logo"
                style={{ width: 18, height: 18, borderRadius: '50%', objectFit: 'cover' }}
              />
            ) : (
              <span className="standee-biz-icon">🏪</span>
            )}
            <span className="standee-biz-name-label">{bizName}</span>
            {bizCategory && <span className="standee-biz-cat-badge">{bizCategory}</span>}
          </div>

          {/* Official Google Header Band */}
          <div className="standee-google-header">
            <div className="standee-g-badge">
              <GoogleGIcon size={52} className="standee-google-g-logo" />
            </div>

            <div className="standee-header-text-block">
              <div className="standee-headline-text">
                <span className="headline-line1">Review us</span>
                <span className="headline-line2">on Google</span>
              </div>
              <GoldenRatingStars size={22} color="#FBBC05" />
            </div>
          </div>

          {/* Center High-Contrast Framed QR Code */}
          <div className="standee-qr-frame">
            <div className="standee-qr-border-box">
              {qrSrc ? (
                <img
                  src={qrSrc}
                  alt={`Google Review QR for ${bizName}`}
                  className="standee-qr-image"
                  loading="eager"
                />
              ) : (
                <div className="standee-qr-loading">
                  <span className="qr-spinner" />
                  <span>Loading QR...</span>
                </div>
              )}
              {/* Fallback canvas for direct canvas exports */}
              <canvas ref={activeCanvasRef} style={{ display: 'none' }} />
            </div>

            <div className="standee-scan-prompt-chip">
              <span className="camera-icon">📱</span>
              <span>Point phone camera to review</span>
            </div>
          </div>

          {/* 30-Second AI Flow Step Banner */}
          {show30sFlow && (
            <div className="standee-30s-flow-card">
              <div className="flow-badge-header">
                <span className="flow-lightning-icon">⚡</span>
                <span className="flow-title">Quick 30-Second Review</span>
                <span className="flow-ai-pill">AI Powered</span>
              </div>

              <div className="flow-steps-row">
                <div className="flow-step-item">
                  <span className="step-num">1</span>
                  <span className="step-text">Scan QR</span>
                </div>
                <span className="step-arrow">➔</span>
                <div className="flow-step-item">
                  <span className="step-num">2</span>
                  <span className="step-text">Pick Tags</span>
                </div>
                <span className="step-arrow">➔</span>
                <div className="flow-step-item highlight">
                  <span className="step-num">3</span>
                  <span className="step-text">AI Posts 5★</span>
                </div>
              </div>

              <p className="flow-helper-note">
                No typing required! AI generates an authentic review in seconds.
              </p>
            </div>
          )}

          {/* Descriptive Callout Message */}
          <p className="standee-callout-desc">{tagline}</p>

          {/* Bottom Branding & Verification Bar */}
          <div className="standee-footer-branding">
            <div className="standee-brand-pill">
              <span className="brand-dot" />
              <span className="brand-text">
                Powered by <strong>ReviewAssist AI</strong>
              </span>
            </div>
            <div className="standee-website-slug">{displayUrl}</div>
          </div>
        </div>
      </div>

      {/* Realistic Acrylic Base Stand */}
      {showBase && (
        <div className="acrylic-standee-base-mockup" aria-hidden="true">
          <div className="acrylic-base-bevel" />
          <div className="acrylic-base-reflection" />
        </div>
      )}
    </div>
  );
}
