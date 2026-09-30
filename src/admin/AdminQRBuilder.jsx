import React, { useState, useRef, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import QRCode from 'qrcode';
import confetti from 'canvas-confetti';
import { api } from '../api/client';
import QRStandeeCard from '../components/QRStandeeCard';
import { exportHighResStandee } from '../utils/standeeExport';

const BASE_URL = typeof window !== 'undefined' ? window.location.origin : '';

const CATEGORY_OPTIONS = [
  { id: 'automobile', label: 'Automobile & Garage' },
  { id: 'restaurant', label: 'Restaurant & Cafe' },
  { id: 'dental', label: 'Dental & Clinic' },
  { id: 'salon', label: 'Salon & Spa' },
  { id: 'gym', label: 'Gym & Fitness' },
  { id: 'medical', label: 'Medical & Healthcare' },
  { id: 'retail', label: 'Retail & Store' },
  { id: 'other', label: 'Other Local Business' },
];

const PLAN_OPTIONS = [
  { id: 'starter', name: 'Starter', price: '₹499/mo', desc: '1 loc • 1 seat • basic' },
  { id: 'pro', name: 'Pro Growth', price: '₹1,299/mo', desc: '3 loc • 5 seats • AI reply' },
  { id: 'enterprise', name: 'Enterprise', price: '₹2,999/mo', desc: 'unlimited • custom voice' },
];

export default function AdminQRBuilder() {
  const [params] = useSearchParams();

  const initialBizName = params.get('name') || '';
  const initialBizId =
    params.get('bizId') ||
    (initialBizName
      ? initialBizName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').substring(0, 18) + '-' + Math.random().toString(36).substring(2, 6)
      : `biz-${Date.now().toString(36)}`);

  const [form, setForm] = useState({
    businessName: initialBizName,
    businessId: initialBizId,
    ownerName: params.get('owner') || '',
    ownerEmail: params.get('email') || '',
    ownerPhone: params.get('phone') || '',
    category: params.get('bizType') || 'automobile',
    planId: params.get('planId') || 'pro',
    paidUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    password: 'welcome123',
    accentColor: '#6366f1',
    tagline: 'Scan the above QR code with your smartphone and make our day by leaving us a review on Google!',
    leadId: params.get('leadId') || '',
  });

  const [standeeTheme, setStandeeTheme] = useState('google'); // 'google' | 'acrylic' | 'midnight' | 'emerald'
  const [standeeFormat, setStandeeFormat] = useState('portrait'); // 'portrait' | 'table_tent' | 'poster' | 'sticker'
  const [showBackdrop, setShowBackdrop] = useState(true);
  const [show30sFlow, setShow30sFlow] = useState(true);
  const [exporting, setExporting] = useState(false);

  const [qrGenerated, setQrGenerated] = useState(false);
  const [copied, setCopied] = useState(false);
  const [savingOnboard, setSavingOnboard] = useState(false);
  const [onboardingKit, setOnboardingKit] = useState(null); // { client, user, reviewUrl, dashboardUrl }
  const [toastMsg, setToastMsg] = useState('');

  const canvasRef = useRef(null);
  const previewRef = useRef(null);

  const reviewUrl = `${BASE_URL}/review/${form.businessId}`;
  const dashboardUrl = `${BASE_URL}/dashboard/${form.businessId}`;

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3000);
  };

  const handleChange = (field, val) => {
    setForm((f) => ({ ...f, [field]: val }));
    if (field === 'businessId') {
      setQrGenerated(false);
    }
  };

  const generateQR = async () => {
    if (!canvasRef.current || !form.businessId) return;
    try {
      await QRCode.toCanvas(canvasRef.current, reviewUrl, {
        width: 320,
        margin: 2,
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
      });
      setQrGenerated(true);
      showToast('✓ QR code rendered!');
    } catch (err) {
      console.error('QR generation error:', err);
    }
  };

  // Auto-generate QR when businessId changes
  useEffect(() => {
    if (form.businessId) {
      generateQR();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.businessId]);

  const generateNewBizId = () => {
    const slug = form.businessName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 18);
    const rand = Math.random().toString(36).substring(2, 6);
    const newId = slug ? `${slug}-${rand}` : `biz-${rand}`;
    handleChange('businessId', newId);
  };

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#';
    let res = '';
    for (let i = 0; i < 9; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    handleChange('password', res);
    showToast('🔑 Generated new password');
  };

  const handleDownloadQR = async () => {
    if (!reviewUrl) return;
    try {
      let qrOnlyUrl = '';
      if (canvasRef.current) {
        qrOnlyUrl = canvasRef.current.toDataURL('image/png');
      } else {
        qrOnlyUrl = await QRCode.toDataURL(reviewUrl, {
          width: 1200,
          margin: 2,
          color: {
            dark: '#111827',
            light: '#ffffff',
          },
          errorCorrectionLevel: 'H',
        });
      }
      const safeName = (form.businessName || 'client-qr').toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
      const link = document.createElement('a');
      link.download = `${safeName}-google-review-qr-only.png`;
      link.href = qrOnlyUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast('✓ Standalone QR code PNG downloaded!');
    } catch (err) {
      console.error('Failed to download QR only:', err);
    }
  };

  const handleDownloadHighResStandee = async () => {
    setExporting(true);
    try {
      let qrDataUrl = '';
      if (canvasRef.current) {
        qrDataUrl = canvasRef.current.toDataURL('image/png');
      } else {
        qrDataUrl = await QRCode.toDataURL(reviewUrl, { width: 800, margin: 1, errorCorrectionLevel: 'H' });
      }

      await exportHighResStandee({
        business: {
          name: form.businessName || 'Local Business',
          category: form.category,
        },
        reviewUrl,
        qrDataUrl,
        theme: standeeTheme,
        showBackdrop,
        headline: 'Review us on Google',
        tagline: form.tagline || 'Scan the above QR code with your smartphone and make our day by leaving us a review on Google!',
        show30sFlow,
        format: standeeFormat,
      });
      showToast('✓ 300-DPI Standee PNG downloaded!');
    } catch (err) {
      console.error('Standee export error:', err);
      showToast('⚠️ Export error, downloading basic QR instead');
      handleDownloadQR();
    } finally {
      setExporting(false);
    }
  };

  const handlePrintStandee = () => {
    window.print();
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(reviewUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
      showToast('✓ Review link copied to clipboard!');
    } catch (err) {
      console.warn('Clipboard error', err);
    }
  };

  // 1-Click Client Onboarding Action
  const handleOnboardClient = async (e) => {
    e.preventDefault();
    if (!form.businessName.trim()) {
      showToast('⚠️ Please enter the business name.');
      return;
    }
    if (!form.ownerEmail.trim()) {
      showToast('⚠️ Please enter the owner email address.');
      return;
    }

    setSavingOnboard(true);

    try {
      // 1. Ensure QR is rendered
      await generateQR();

      // 2. Register business and user credentials
      const result = api.saveClientAccount({
        businessId: form.businessId,
        businessName: form.businessName,
        email: form.ownerEmail,
        password: form.password,
        ownerName: form.ownerName,
        category: form.category,
        planId: form.planId,
        paidUntil: form.paidUntil,
        phone: form.ownerPhone,
        tagline: form.tagline,
      });

      // 3. If converted from a lead, mark lead as converted in storage
      if (form.leadId) {
        try {
          const rawLeads = localStorage.getItem('reviewassist_admin_leads');
          if (rawLeads) {
            const leads = JSON.parse(rawLeads);
            const updated = leads.map((l) => (l.id === form.leadId ? { ...l, status: 'converted' } : l));
            localStorage.setItem('reviewassist_admin_leads', JSON.stringify(updated));
          }
        } catch {}
      }

      // Fire celebratory confetti!
      try {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {}

      setOnboardingKit({
        client: result.business,
        user: result.user,
        reviewUrl,
        dashboardUrl,
      });

      showToast(`🎉 ${form.businessName} successfully onboarded!`);
    } catch (err) {
      console.error('Onboarding error:', err);
      showToast('⚠️ Could not complete onboarding. Please try again.');
    } finally {
      setSavingOnboard(false);
    }
  };

  const getWhatsAppWelcomeMessage = () => {
    const ownerGreeting = form.ownerName ? `Hi ${form.ownerName}!` : 'Hello!';
    return encodeURIComponent(
      `🎉 ${ownerGreeting} Welcome to ReviewAssist!\n\n` +
      `Your automated Google review collection service for *${form.businessName}* is now active.\n\n` +
      `⭐ *Customer Review Link (for your QR standee):*\n${reviewUrl}\n\n` +
      `📊 *Your Private Business Dashboard:*\n${dashboardUrl}\n` +
      `• Login Email: ${form.ownerEmail}\n` +
      `• Password: ${form.password}\n\n` +
      `We've attached your high-resolution QR standee file. Print and display it at your front counter/tables to start collecting 5-star Google reviews!`
    );
  };

  const cleanPhone = form.ownerPhone ? form.ownerPhone.replace(/[^0-9]/g, '') : '';
  const waWelcomeUrl = cleanPhone
    ? `https://wa.me/${cleanPhone}?text=${getWhatsAppWelcomeMessage()}`
    : `https://wa.me/?text=${getWhatsAppWelcomeMessage()}`;

  return (
    <div className="admin-qrbuilder-page">
      {toastMsg && <div className="admin-toast">{toastMsg}</div>}

      {/* Onboarding Kit Success Modal */}
      {onboardingKit && (
        <div className="admin-confirm-overlay" onClick={() => setOnboardingKit(null)}>
          <div className="admin-confirm-modal onboarding-success-modal" onClick={(e) => e.stopPropagation()}>
            <div className="onboard-modal-header">
              <span className="onboard-sparkle-icon">🎉</span>
              <h2 className="onboard-modal-title">Client Onboarding Kit Ready!</h2>
              <p className="onboard-modal-sub">
                <strong>{form.businessName}</strong> has been registered and activated in the system.
              </p>
            </div>

            <div className="onboard-creds-card">
              <h4 className="onboard-creds-title">🔑 Client Login Credentials</h4>
              <div className="onboard-cred-row">
                <span className="cred-lbl">Dashboard URL:</span>
                <a href={dashboardUrl} target="_blank" rel="noreferrer" className="cred-link">
                  {dashboardUrl}
                </a>
              </div>
              <div className="onboard-cred-row">
                <span className="cred-lbl">Login Email:</span>
                <code>{form.ownerEmail}</code>
              </div>
              <div className="onboard-cred-row">
                <span className="cred-lbl">Password:</span>
                <code>{form.password}</code>
              </div>
              <div className="onboard-cred-row">
                <span className="cred-lbl">Assigned Plan:</span>
                <span className="onboard-plan-pill">💎 {form.planId.toUpperCase()} (Paid until {form.paidUntil})</span>
              </div>
            </div>

            <div className="onboard-modal-actions">
              <a
                href={waWelcomeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="admin-btn-primary btn-onboard-wa"
              >
                💬 Send Welcome Kit via WhatsApp
              </a>

              <button
                type="button"
                className="admin-btn-secondary"
                onClick={handleDownloadQR}
              >
                ⬇️ Download Standee QR PNG
              </button>

              <Link
                to="/admin/clients"
                className="admin-btn-secondary"
                onClick={() => setOnboardingKit(null)}
              >
                🏢 View in Clients Directory
              </Link>

              <button
                type="button"
                className="admin-confirm-btn cancel"
                onClick={() => setOnboardingKit(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Client Onboarding & Standee Builder</h1>
          <p className="admin-page-subtitle">
            Create client accounts, assign plan tiers, generate high-resolution QR standees, and dispatch welcome kits.
          </p>
        </div>
        <Link to="/admin/clients" className="admin-btn-secondary">
          ← Back to Clients & Leads
        </Link>
      </div>

      <div className="admin-qrbuilder-layout">
        {/* Left: Form */}
        <div className="admin-qrbuilder-form-panel">
          <form onSubmit={handleOnboardClient} className="admin-card">
            <h2 className="admin-card-section-title">📋 Business & Owner Information</h2>

            <div className="admin-form-group">
              <label className="admin-form-label">Business Name *</label>
              <input
                type="text"
                className="admin-form-input"
                placeholder="e.g. Rajesh Auto Garage"
                value={form.businessName}
                onChange={(e) => handleChange('businessName', e.target.value)}
                required
              />
            </div>

            <div className="admin-form-group">
              <label className="admin-form-label">Business ID (unique review URL slug) *</label>
              <div className="admin-input-with-action">
                <input
                  type="text"
                  className="admin-form-input"
                  placeholder="e.g. rajesh-auto-q3f2"
                  value={form.businessId}
                  onChange={(e) => handleChange('businessId', e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                  required
                />
                <button
                  className="admin-input-action-btn"
                  onClick={generateNewBizId}
                  title="Auto-generate from business name"
                  type="button"
                >
                  ⚡ Auto
                </button>
              </div>
              <span className="admin-form-hint">
                Customer review URL: <code className="admin-url-code">{reviewUrl}</code>
              </span>
            </div>

            <div className="admin-form-row">
              <div className="admin-form-group">
                <label className="admin-form-label">Owner Name</label>
                <input
                  type="text"
                  className="admin-form-input"
                  placeholder="e.g. Rajesh Sharma"
                  value={form.ownerName}
                  onChange={(e) => handleChange('ownerName', e.target.value)}
                />
              </div>
              <div className="admin-form-group">
                <label className="admin-form-label">Owner Phone</label>
                <input
                  type="text"
                  className="admin-form-input"
                  placeholder="e.g. +91 98765 11111"
                  value={form.ownerPhone}
                  onChange={(e) => handleChange('ownerPhone', e.target.value)}
                />
              </div>
            </div>

            <div className="admin-form-row">
              <div className="admin-form-group">
                <label className="admin-form-label">Owner Login Email *</label>
                <input
                  type="email"
                  className="admin-form-input"
                  placeholder="rajesh@garage.in"
                  value={form.ownerEmail}
                  onChange={(e) => handleChange('ownerEmail', e.target.value)}
                  required
                />
              </div>
              <div className="admin-form-group">
                <label className="admin-form-label">Business Category</label>
                <select
                  className="admin-form-select"
                  value={form.category}
                  onChange={(e) => handleChange('category', e.target.value)}
                >
                  {CATEGORY_OPTIONS.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <h2 className="admin-card-section-title" style={{ marginTop: '1.5rem' }}>
              💎 Plan & External Billing Setup
            </h2>

            <div className="admin-form-row">
              <div className="admin-form-group">
                <label className="admin-form-label">Assigned Plan Tier</label>
                <select
                  className="admin-form-select"
                  value={form.planId}
                  onChange={(e) => handleChange('planId', e.target.value)}
                >
                  {PLAN_OPTIONS.map((p) => (
                    <option key={p.id} value={p.id}>
                      💎 {p.name} ({p.price})
                    </option>
                  ))}
                </select>
              </div>

              <div className="admin-form-group">
                <label className="admin-form-label">Paid Until (Initial Expiry)</label>
                <input
                  type="date"
                  className="admin-form-input"
                  value={form.paidUntil}
                  onChange={(e) => handleChange('paidUntil', e.target.value)}
                />
              </div>
            </div>

            <div className="admin-form-group">
              <label className="admin-form-label">Client Dashboard Password</label>
              <div className="admin-input-with-action">
                <input
                  type="text"
                  className="admin-form-input"
                  value={form.password}
                  onChange={(e) => handleChange('password', e.target.value)}
                  placeholder="Enter initial password"
                  required
                />
                <button
                  type="button"
                  className="admin-input-action-btn"
                  onClick={generateRandomPassword}
                  title="Generate secure password"
                >
                  🔑 Gen
                </button>
              </div>
              <span className="admin-form-hint">
                The business owner will use this password to sign into <code>{dashboardUrl}</code>
              </span>
            </div>

            <h2 className="admin-card-section-title" style={{ marginTop: '1.5rem' }}>
              🎨 QR Standee Customization
            </h2>

            <div className="admin-form-group">
              <label className="admin-form-label">Standee Callout Tagline</label>
              <input
                type="text"
                className="admin-form-input"
                placeholder="Scan to Share Your Review"
                value={form.tagline}
                onChange={(e) => handleChange('tagline', e.target.value)}
              />
            </div>

            <div className="admin-form-group">
              <label className="admin-form-label">Brand Accent Color</label>
              <div className="admin-color-picker-row">
                <input
                  type="color"
                  className="admin-color-input"
                  value={form.accentColor}
                  onChange={(e) => handleChange('accentColor', e.target.value)}
                />
                <span className="admin-color-hex">{form.accentColor}</span>
                <div className="admin-color-presets">
                  {['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#0ea5e9', '#8b5cf6'].map((c) => (
                    <button
                      key={c}
                      type="button"
                      className="admin-color-preset"
                      style={{ background: c, border: form.accentColor === c ? '3px solid #fff' : 'none' }}
                      onClick={() => handleChange('accentColor', c)}
                      title={c}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Main Action: Save & Onboard */}
            <div className="admin-qr-form-actions">
              <button
                type="submit"
                className="admin-btn-primary btn-onboard-submit"
                disabled={savingOnboard}
              >
                {savingOnboard ? (
                  <><span className="admin-btn-spinner" /> Saving Client & Generating QR...</>
                ) : (
                  '🚀 Save & Onboard Client (Create Account & Activate)'
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Right: Live Standee Preview + Delivery Actions */}
        <div className="admin-qrbuilder-preview-panel">
          {/* Standee Studio Header & Format Toolbar */}
          <div className="admin-standee-preview-header">
            <div className="admin-preview-title-row">
              <span className="admin-preview-badge">✨ Live Standee Preview</span>
              <span className="admin-preview-sub">Google 4-Color & 30s AI Review Flow</span>
            </div>

            {/* Quick Format & Theme Switchers */}
            <div className="admin-standee-quick-controls">
              <div className="admin-ctrl-pill-group">
                <span className="admin-ctrl-label">Format:</span>
                {[
                  { id: 'portrait', label: '5"×7" Counter' },
                  { id: 'table_tent', label: '4"×6" Table Tent' },
                  { id: 'poster', label: 'A4 Poster' },
                ].map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    className={`admin-ctrl-btn ${standeeFormat === f.id ? 'active' : ''}`}
                    onClick={() => setStandeeFormat(f.id)}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              <div className="admin-ctrl-pill-group">
                <span className="admin-ctrl-label">Style:</span>
                {[
                  { id: 'google', label: 'Google Official' },
                  { id: 'midnight', label: 'Obsidian Noir' },
                  { id: 'acrylic', label: 'Clean Acrylic' },
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    className={`admin-ctrl-btn ${standeeTheme === t.id ? 'active' : ''}`}
                    onClick={() => {
                      setStandeeTheme(t.id);
                      if (t.id === 'google') setShowBackdrop(true);
                    }}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              <div className="admin-ctrl-checkboxes">
                <label className="admin-inline-checkbox">
                  <input
                    type="checkbox"
                    checked={showBackdrop}
                    onChange={(e) => setShowBackdrop(e.target.checked)}
                  />
                  <span>Google Color Frame</span>
                </label>

                <label className="admin-inline-checkbox">
                  <input
                    type="checkbox"
                    checked={show30sFlow}
                    onChange={(e) => setShow30sFlow(e.target.checked)}
                  />
                  <span>⚡ 30s AI Flow</span>
                </label>
              </div>
            </div>
          </div>

          {/* Interactive QR Standee Realistic Preview */}
          <div className="admin-standee-card-container">
            <div className="admin-standee-viewport-scale">
              <QRStandeeCard
                business={{
                  name: form.businessName || 'Your Business Name',
                  category: CATEGORY_OPTIONS.find((c) => c.id === form.category)?.label || form.category,
                  website: reviewUrl,
                }}
                reviewUrl={reviewUrl}
                theme={standeeTheme}
                format={standeeFormat}
                showBackdrop={showBackdrop}
                showBase={true}
                headline="Review us on Google"
                tagline={form.tagline}
                show30sFlow={show30sFlow}
                accentColor={form.accentColor}
                cardRef={previewRef}
                canvasRef={canvasRef}
              />
            </div>
          </div>

          {/* Action Buttons Toolbar */}
          <div className="admin-qr-action-buttons">
            <button
              type="button"
              className="admin-btn-secondary"
              onClick={handleCopyLink}
              title="Copy customer review link"
            >
              {copied ? '✓ Copied!' : '🔗 Copy Review Link'}
            </button>

            <button
              type="button"
              className="admin-btn-secondary"
              onClick={handlePrintStandee}
              title="Direct 1-click print"
            >
              🖨️ Print Standee
            </button>

            <button
              type="button"
              className="admin-btn-primary btn-dl-highres"
              onClick={handleDownloadHighResStandee}
              disabled={exporting}
              title="Download high-resolution 300 DPI PNG print file"
            >
              {exporting ? '⏳ Rendering 300 DPI...' : '⬇️ Download 300-DPI Standee PNG'}
            </button>

            <button
              type="button"
              className="admin-btn-secondary"
              onClick={handleDownloadQR}
              title="Download standalone high-resolution QR code PNG image"
            >
              📱 Download Only QR Code
            </button>
          </div>

          {/* WhatsApp Direct Dispatch Card */}
          <div className="admin-send-client-card">
            <h3 className="admin-send-title">📲 Instant WhatsApp Dispatch</h3>
            <p className="admin-send-desc">
              Send the client their customer review link, dashboard login credentials, and setup instructions directly on WhatsApp.
            </p>
            <div className="admin-send-email-preview">
              <span className="admin-send-to-label">To:</span>
              <span className="admin-send-to-value">{form.ownerPhone || form.ownerEmail || 'Client'}</span>
            </div>
            <a
              href={waWelcomeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="admin-btn-primary admin-send-btn"
            >
              💬 Open WhatsApp Welcome Pack
            </a>
            <p className="admin-send-note">
              Includes pre-formatted review link, dashboard login details, and acrylic standee placement guide.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
