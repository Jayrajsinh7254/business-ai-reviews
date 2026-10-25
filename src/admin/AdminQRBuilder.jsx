import React, { useState, useRef, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import QRCode from 'qrcode';
import confetti from 'canvas-confetti';
import { api, isValidGoogleReviewLink, isGenericOrEmptyServices } from '../api/client';
import QRStandeeCard from '../components/QRStandeeCard';
import { exportHighResStandee } from '../utils/standeeExport';
import { createQRDataUrlWithCenterLogo, SAMPLE_BRAND_LOGO } from '../utils/qrLogoHelper';
import { CATEGORIES, getCategoryServices } from '../lib/categories';
import { generateSecurePassword, sanitizeGoogleReviewUrl } from '../lib/security';

const BASE_URL = typeof window !== 'undefined' ? window.location.origin : '';

const CATEGORY_OPTIONS = CATEGORIES.map((c) => ({
  id: c.id,
  label: `${c.icon} ${c.label}`,
  rawLabel: c.label,
}));

const PLAN_OPTIONS = [
  { id: 'starter', name: 'Starter', price: '₹299/mo', desc: '1 loc • 1 seat • was ₹499' },
  { id: 'pro', name: 'Pro Growth', price: '₹499/mo', desc: '1 loc • 1 seat • was ₹699' },
  { id: 'enterprise', name: 'Enterprise', price: '₹799/mo', desc: '3 loc • 5 seats • was ₹1,199' },
];

export default function AdminQRBuilder() {
  const [params] = useSearchParams();

  const initialBizName = params.get('name') || '';
  const initialBizId =
    params.get('bizId') ||
    (initialBizName
      ? initialBizName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').substring(0, 18) + '-' + Math.random().toString(36).substring(2, 6)
      : `biz-${Date.now().toString(36)}`);

  const rawBizType = params.get('bizType') || '';
  const matchedCat = CATEGORY_OPTIONS.find(
    (c) => c.id === rawBizType || c.rawLabel.toLowerCase() === rawBizType.toLowerCase()
  );
  const initialCategory = matchedCat ? matchedCat.id : (rawBizType || 'it_marketing');
  const paramServices = params.get('services') ? params.get('services').split(',').map((s) => s.trim()).filter(Boolean) : null;
  const initialServices = (paramServices && paramServices.length > 0 && !isGenericOrEmptyServices(paramServices))
    ? paramServices
    : getCategoryServices(initialCategory);

  const [form, setForm] = useState({
    businessName: initialBizName,
    businessId: initialBizId,
    ownerName: params.get('owner') || '',
    ownerEmail: params.get('email') || '',
    ownerPhone: params.get('phone') || '',
    logoUrl: params.get('logo') || '',
    category: initialCategory,
    customCategory: '',
    services: initialServices,
    planId: params.get('planId') || 'pro',
    paidUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    password: generateSecurePassword(14),
    accentColor: '#6366f1',
    tagline: 'Scan the above QR code with your smartphone and make our day by leaving us a review on Google!',
    googleReviewLink: sanitizeGoogleReviewUrl(params.get('google') || params.get('googleUrl') || params.get('googleLink') || params.get('googleProfileUrl') || '', 'https://g.page/r/example/review'),
    leadId: params.get('leadId') || '',
  });

  // Sync form if URL query params change while mounted
  useEffect(() => {
    if (params.get('name') || params.get('email')) {
      const name = params.get('name') || '';
      const bizId = params.get('bizId') || (name
        ? name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').substring(0, 18) + '-' + Math.random().toString(36).substring(2, 6)
        : `biz-${Date.now().toString(36)}`);
      const pRawType = params.get('bizType') || '';
      const pMatched = CATEGORY_OPTIONS.find((c) => c.id === pRawType || c.rawLabel.toLowerCase() === pRawType.toLowerCase());
      const resolvedCat = pMatched ? pMatched.id : (pRawType || initialCategory);
      const pServices = params.get('services') ? params.get('services').split(',').map((s) => s.trim()).filter(Boolean) : null;
      const resolvedServices = (pServices && pServices.length > 0 && !isGenericOrEmptyServices(pServices))
        ? pServices
        : getCategoryServices(resolvedCat);

      setForm((prev) => ({
        ...prev,
        businessName: name || prev.businessName,
        businessId: bizId || prev.businessId,
        ownerName: params.get('owner') || prev.ownerName,
        ownerEmail: params.get('email') || prev.ownerEmail,
        ownerPhone: params.get('phone') || prev.ownerPhone,
        logoUrl: params.get('logo') || prev.logoUrl,
        category: resolvedCat,
        services: resolvedServices,
        googleReviewLink: params.get('google') || params.get('googleUrl') || params.get('googleLink') || params.get('googleProfileUrl') || prev.googleReviewLink,
        leadId: params.get('leadId') || prev.leadId,
      }));
    }
  }, [params]);

  const [standeeTheme, setStandeeTheme] = useState('google-quadrant'); // 'google-quadrant' | 'google' | 'acrylic' | 'midnight' | 'emerald'
  const [standeeFormat, setStandeeFormat] = useState('portrait'); // 'portrait' | 'table_tent' | 'poster' | 'sticker'
  const [showBackdrop, setShowBackdrop] = useState(true);
  const [show30sFlow, setShow30sFlow] = useState(true);
  const [exporting, setExporting] = useState(false);

  const [qrGenerated, setQrGenerated] = useState(false);
  const [copied, setCopied] = useState(false);
  const [savingOnboard, setSavingOnboard] = useState(false);
  const [onboardingKit, setOnboardingKit] = useState(null); // { client, user, reviewUrl, dashboardUrl }
  const [toastMsg, setToastMsg] = useState('');
  const [customHost, setCustomHost] = useState('');
  const [bizIdManuallyEdited, setBizIdManuallyEdited] = useState(Boolean(params.get('bizId')));

  const canvasRef = useRef(null);
  const previewRef = useRef(null);

  // Clean slug & metadata-carrying review URL
  const cleanBizSlug = (form.businessId || 'biz-local').trim().toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') || 'biz-local';
  const reviewParams = new URLSearchParams();
  if (form.businessName) reviewParams.set('name', form.businessName);
  if (form.category) reviewParams.set('cat', form.category);
  if (form.services && form.services.length > 0) reviewParams.set('services', form.services.join(','));
  if (form.googleReviewLink) reviewParams.set('google', form.googleReviewLink);
  if (form.ownerPhone) reviewParams.set('phone', form.ownerPhone);
  const querySuffix = reviewParams.toString() ? `?${reviewParams.toString()}` : '';

  const targetOrigin = (customHost && customHost.trim()) ? customHost.trim().replace(/\/+$/, '') : BASE_URL;
  const reviewUrl = `${targetOrigin}/review/${cleanBizSlug}${querySuffix}`;
  const displayReviewUrl = `${targetOrigin}/review/${cleanBizSlug}`;
  const dashboardUrl = `${targetOrigin}/dashboard/${cleanBizSlug}`;

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3000);
  };

  const [newServiceInput, setNewServiceInput] = useState('');

  const handleChange = (field, val) => {
    setForm((f) => {
      let updatedBizId = f.businessId;
      if (field === 'businessName' && !bizIdManuallyEdited) {
        const slug = val
          .toLowerCase()
          .replace(/[^a-z0-9]/g, '-')
          .replace(/-+/g, '-')
          .replace(/^-|-$/g, '')
          .substring(0, 18);
        if (slug) {
          const prevSuffix = f.businessId.match(/-([a-z0-9]{3,6})$/)?.[1] || Math.random().toString(36).substring(2, 6);
          updatedBizId = `${slug}-${prevSuffix}`;
        }
      }

      // If category changed, update services to new category preset services
      let updatedServices = f.services;
      if (field === 'category') {
        updatedServices = getCategoryServices(val);
      }

      return {
        ...f,
        [field]: val,
        ...(field === 'category' ? { services: updatedServices } : {}),
        ...(field === 'businessName' && !bizIdManuallyEdited ? { businessId: updatedBizId } : {}),
      };
    });
    if (field === 'businessId') {
      setBizIdManuallyEdited(true);
      setQrGenerated(false);
    }
    if (field === 'businessName' || field === 'logoUrl') {
      setQrGenerated(false);
    }
  };

  const handleAddService = (e) => {
    if (e) e.preventDefault();
    const clean = newServiceInput.trim();
    if (!clean) return;
    if (!form.services.some((s) => s.toLowerCase() === clean.toLowerCase())) {
      setForm((f) => ({ ...f, services: [...f.services, clean] }));
    }
    setNewServiceInput('');
  };

  const handleRemoveService = (serviceToRemove) => {
    setForm((f) => ({
      ...f,
      services: f.services.filter((s) => s !== serviceToRemove),
    }));
  };

  const handleToggleSuggestedService = (srv) => {
    setForm((f) => {
      const exists = f.services.some((s) => s.toLowerCase() === srv.toLowerCase());
      const updated = exists
        ? f.services.filter((s) => s.toLowerCase() !== srv.toLowerCase())
        : [...f.services, srv];
      return { ...f, services: updated };
    });
  };

  const handleResetServicesToCategory = () => {
    const srvs = getCategoryServices(form.category === 'other' ? (form.customCategory || 'other') : form.category);
    setForm((f) => ({ ...f, services: srvs }));
    showToast('✓ Reset services to industry presets');
  };

  // Auto-persist active business profile so scanning QR immediately works without requiring full onboarding submission first
  useEffect(() => {
    if (form.businessName && form.businessId) {
      try {
        const effectiveCategory = form.category === 'other'
          ? (form.customCategory?.trim() || 'Custom Business')
          : (CATEGORY_OPTIONS.find((c) => c.id === form.category)?.rawLabel || form.category);

        const newBiz = {
          id: form.businessId,
          name: form.businessName,
          category: effectiveCategory,
          services: form.services && form.services.length > 0 ? form.services : ['Customer Service', 'Quality & Value', 'Overall Experience', 'Timely Support'],
          email: form.ownerEmail || '',
          phone: form.ownerPhone || '',
          logoUrl: form.logoUrl || '',
          shareableUrl: displayReviewUrl,
          dashboardUrl: dashboardUrl,
          google_review_link: form.googleReviewLink || 'https://g.page/r/example/review',
          googleReviewLink: form.googleReviewLink || 'https://g.page/r/example/review',
          google_review_url: form.googleReviewLink || 'https://g.page/r/example/review',
          googleReviewUrl: form.googleReviewLink || 'https://g.page/r/example/review',
          status: 'active',
          subscriptionStatus: 'active',
          planId: form.planId || 'pro',
          paidUntil: form.paidUntil,
          tagline: form.tagline,
        };
        api.saveStoredBusiness(newBiz);
      } catch (e) {
        console.warn('Auto-save business preview notice:', e);
      }
    }
  }, [form.businessName, form.businessId, form.category, form.services, form.logoUrl, form.planId, form.paidUntil, form.tagline, form.ownerEmail, form.ownerPhone, form.customCategory, form.googleReviewLink, displayReviewUrl, dashboardUrl]);

  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        handleChange('logoUrl', ev.target.result);
        showToast('✓ Logo uploaded & centered in QR!');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUseSampleLogo = () => {
    handleChange('logoUrl', SAMPLE_BRAND_LOGO);
    showToast('✓ Reference brand emblem applied!');
  };

  const handleRemoveLogo = () => {
    handleChange('logoUrl', '');
    showToast('Logo removed');
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

  // Auto-generate QR when businessId or reviewUrl changes
  useEffect(() => {
    if (form.businessId) {
      generateQR();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.businessId, reviewUrl]);

  const generateNewBizId = () => {
    const slug = form.businessName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 18);
    const rand = Math.random().toString(36).substring(2, 6);
    const newId = slug ? `${slug}-${rand}` : `biz-${rand}`;
    setBizIdManuallyEdited(true);
    handleChange('businessId', newId);
  };

  const generateRandomPassword = () => {
    const res = generateSecurePassword(16);
    handleChange('password', res);
    showToast('🔑 Generated new secure password');
  };

  const handleDownloadQR = async () => {
    if (!reviewUrl) return;
    try {
      const qrOnlyUrl = await createQRDataUrlWithCenterLogo(reviewUrl, form.logoUrl, 1200);
      const safeName = (form.businessName || 'client-qr').toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
      const link = document.createElement('a');
      link.download = `${safeName}-google-review-qr-with-logo.png`;
      link.href = qrOnlyUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast('✓ QR Code with logo PNG downloaded!');
    } catch (err) {
      console.error('Failed to download QR only:', err);
      showToast('⚠️ Could not download QR code.');
    }
  };

  const handleDownloadHighResStandee = async () => {
    setExporting(true);
    try {
      const qrDataUrl = await createQRDataUrlWithCenterLogo(reviewUrl, form.logoUrl, 1000);

      await exportHighResStandee({
        business: {
          name: form.businessName || 'Local Business',
          category: form.category,
          logoUrl: form.logoUrl,
        },
        reviewUrl,
        qrDataUrl,
        logoUrl: form.logoUrl,
        theme: standeeTheme,
        showBackdrop,
        headline: "WE'D LOVE YOUR FEEDBACK",
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
      const effectiveCategory = form.category === 'other'
        ? (form.customCategory?.trim() || 'Custom Business')
        : (CATEGORY_OPTIONS.find((c) => c.id === form.category)?.rawLabel || form.category);

      const result = await api.saveClientAccount({
        businessId: form.businessId,
        businessName: form.businessName,
        email: form.ownerEmail,
        password: form.password,
        ownerName: form.ownerName,
        category: effectiveCategory,
        planId: form.planId,
        paidUntil: form.paidUntil,
        phone: form.ownerPhone,
        tagline: form.tagline,
        services: form.services,
        logoUrl: form.logoUrl,
        google_review_link: (form.googleReviewLink || '').trim(),
        googleReviewLink: (form.googleReviewLink || '').trim(),
        googleReviewUrl: (form.googleReviewLink || '').trim(),
      });

      // 3. If converted from a lead, mark lead as done in both Supabase and storage
      if (form.leadId) {
        try {
          await api.updateLeadStatus(form.leadId, 'done');
        } catch (statusErr) {
          console.warn('Could not update lead status in Supabase:', statusErr);
        }
        try {
          const rawLeads = localStorage.getItem('reviewassist_admin_leads');
          if (rawLeads) {
            const leads = JSON.parse(rawLeads);
            const updated = leads.map((l) => (l.id === form.leadId ? { ...l, status: 'done' } : l));
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
        client: result?.business,
        user: result?.user,
        reviewUrl,
        dashboardUrl,
        loginUrl: `${targetOrigin}/login`,
        email: form.ownerEmail.trim(),
        password: form.password || 'welcome123',
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
    const portalUrl = `${targetOrigin}/login`;
    const clientPass = form.password || 'welcome123';
    return encodeURIComponent(
      `🎉 ${ownerGreeting} Greetings from ReviewAssist!\n\n` +
      `Your custom Google review collection system and Standee for *${form.businessName}* are ready!\n\n` +
      `🔐 *Your Dashboard Login Details:*\n` +
      `🔗 *Login Portal:* ${portalUrl}\n` +
      `📧 *Email:* ${form.ownerEmail}\n` +
      `🔑 *Password:* ${clientPass}\n\n` +
      `⭐ *Your Live Customer Review Link:*\n${reviewUrl}\n\n` +
      `🪧 *Custom Acrylic Standee Kit:*\n` +
      `We have crafted your high-resolution 300-DPI Standee with your business logo centered inside the QR code.\n\n` +
      `Print and place this Standee on your counter or billing desk. Customers can simply point their phone camera to leave 5-star Google reviews in 30 seconds!\n\n` +
      `Let us know on WhatsApp if you need physical acrylic standee delivery or any changes!`
    );
  };

  const handleCopyOnboardingCredentials = () => {
    const portalUrl = `${targetOrigin}/login`;
    const clientPass = form.password || 'welcome123';
    const text = `ReviewAssist Dashboard Login Details:\n🏢 Business: ${form.businessName}\n🔗 Login Portal: ${portalUrl}\n📧 Email: ${form.ownerEmail}\n🔑 Password: ${clientPass}\n⭐ Review Link: ${reviewUrl}`;
    navigator.clipboard.writeText(text);
    showToast('📋 Login credentials & portal link copied!');
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
                <strong>{form.businessName}</strong> has been registered and activated with full dashboard access.
              </p>
            </div>

            <div className="onboard-creds-card">
              <h4 className="onboard-creds-title">🔑 Client Login Credentials</h4>
              <div className="onboard-cred-row">
                <span className="cred-lbl">Login Portal:</span>
                <a href={`${targetOrigin}/login`} target="_blank" rel="noreferrer" className="cred-link" style={{ fontWeight: 'bold', color: '#6366f1' }}>
                  {targetOrigin}/login
                </a>
              </div>
              <div className="onboard-cred-row">
                <span className="cred-lbl">Login Email:</span>
                <code>{form.ownerEmail}</code>
              </div>
              <div className="onboard-cred-row">
                <span className="cred-lbl">Password:</span>
                <code style={{ background: '#fef3c7', color: '#92400e', fontWeight: 'bold' }}>{form.password || 'welcome123'}</code>
              </div>
              <div className="onboard-cred-row">
                <span className="cred-lbl">Assigned Plan:</span>
                <span className="onboard-plan-pill">💎 {form.planId.toUpperCase()} (Paid until {form.paidUntil})</span>
              </div>
            </div>

            <div className="onboard-modal-actions">
              <button
                type="button"
                className="admin-btn-secondary"
                style={{ background: '#4f46e5', color: '#fff' }}
                onClick={handleCopyOnboardingCredentials}
              >
                📋 Copy Login Credentials
              </button>

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
                Customer review URL: <code className="admin-url-code">{displayReviewUrl}</code>
              </span>

              {/* Instant Test & Copy Action Row */}
              <div style={{ display: 'flex', gap: '8px', marginTop: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                <a
                  href={reviewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="admin-btn-secondary"
                  style={{
                    textDecoration: 'none',
                    padding: '8px 14px',
                    fontSize: '0.85rem',
                    background: '#2563eb',
                    color: '#ffffff',
                    borderRadius: '8px',
                    fontWeight: 600,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                  title="Open the customer review collection flow in a new browser tab"
                >
                  📱 Test Live Review Flow ↗
                </a>

                <button
                  type="button"
                  className="admin-btn-secondary"
                  onClick={handleCopyLink}
                  style={{ padding: '8px 14px', fontSize: '0.85rem', fontWeight: 600 }}
                  title="Copy review URL to clipboard"
                >
                  {copied ? '✓ Copied!' : '📋 Copy Link'}
                </button>
              </div>

              {/* Mobile LAN IP Testing Helper (when running on localhost) */}
              {typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') && (
                <div style={{ marginTop: '10px', background: 'rgba(99, 102, 241, 0.08)', border: '1px dashed rgba(99, 102, 241, 0.3)', borderRadius: '8px', padding: '10px 12px' }}>
                  <div style={{ fontSize: '0.78rem', color: '#6366f1', fontWeight: 600, marginBottom: '4px' }}>
                    📱 Mobile Phone Scanning on Local Wi-Fi
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted, #94a3b8)', lineHeight: 1.4, marginBottom: '6px' }}>
                    Smartphones scanning QR from monitor need your PC’s local IP (e.g. <code>http://192.168.1.5:5173</code>) instead of localhost.
                  </div>
                  <input
                    type="text"
                    className="admin-form-input"
                    style={{ fontSize: '0.8rem', padding: '5px 8px', height: 'auto' }}
                    placeholder="Optional: http://192.168.x.x:5173 or leave blank for default"
                    value={customHost}
                    onChange={(e) => setCustomHost(e.target.value)}
                  />
                </div>
              )}
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

            {/* Logo Upload & Brand Integration */}
            <div className="admin-form-group" style={{ marginTop: '0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <label className="admin-form-label" style={{ marginBottom: 0 }}>
                  🏢 Business Logo (Centers Inside QR &amp; Standee Top)
                </label>
                <span style={{ background: '#ecfdf5', color: '#059669', fontSize: '0.72rem', padding: '2px 8px', borderRadius: '4px', fontWeight: 700 }}>
                  BRAND INTEGRATION
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', background: '#f8fafc', padding: '12px 14px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                {form.logoUrl ? (
                  <div style={{ position: 'relative', width: '58px', height: '58px', borderRadius: '12px', overflow: 'hidden', border: '2px solid #cbd5e1', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <img src={form.logoUrl} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                  </div>
                ) : (
                  <div style={{ width: '58px', height: '58px', borderRadius: '12px', border: '2px dashed #cbd5e1', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', flexShrink: 0 }}>
                    🏷️
                  </div>
                )}

                <div style={{ flex: 1 }}>
                  <input
                    type="file"
                    id="admin-logo-file-picker"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={handleLogoUpload}
                  />
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <label htmlFor="admin-logo-file-picker" className="admin-btn-secondary" style={{ cursor: 'pointer', padding: '6px 12px', fontSize: '0.82rem', margin: 0 }}>
                      📁 Upload Logo
                    </label>
                    <button type="button" className="admin-btn-secondary" style={{ padding: '6px 12px', fontSize: '0.82rem' }} onClick={handleUseSampleLogo}>
                      ✨ Use Sample Emblem
                    </button>
                    {form.logoUrl && (
                      <button type="button" className="admin-btn-secondary" style={{ padding: '6px 12px', fontSize: '0.82rem', color: '#dc2626' }} onClick={handleRemoveLogo}>
                        ✕ Remove
                      </button>
                    )}
                  </div>
                  <span style={{ fontSize: '0.74rem', color: '#64748b', display: 'block', marginTop: '4px' }}>
                    Logo will be placed into the center of the QR code with Level-H error protection.
                  </span>
                </div>
              </div>
            </div>

            {form.category === 'other' && (
              <div className="admin-form-group animate-fade-in" style={{ marginTop: '0.75rem' }}>
                <label className="admin-form-label">
                  Specify Custom Industry / Business Type <span className="required-star">*</span>
                </label>
                <input
                  type="text"
                  className="admin-form-input"
                  value={form.customCategory || ''}
                  onChange={(e) => handleChange('customCategory', e.target.value)}
                  placeholder="e.g. IT & Digital Marketing, Photography Studio, Pet Grooming, Solar Energy, Logistics..."
                  required
                />
                <span className="admin-form-hint" style={{ fontSize: '0.78rem', color: '#64748b', display: 'block', marginTop: '0.25rem' }}>
                  AI review prompts and standee badges will be customized specifically for this industry.
                </span>
              </div>
            )}

            {/* Services Offered for Reviewers (Step 1 Options) */}
            <div className="admin-form-group" style={{ marginTop: '0.95rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <label className="admin-form-label" style={{ marginBottom: 0 }}>
                  🛠️ Services Offered (Shown in Review Step 1 Dropdown) <span className="required-star">*</span>
                </label>
                <button
                  type="button"
                  onClick={handleResetServicesToCategory}
                  className="admin-btn-secondary"
                  style={{ fontSize: '0.72rem', padding: '3px 8px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                  title="Reset to recommended industry presets"
                >
                  ↺ Reset Defaults
                </button>
              </div>

              {/* Active Services Chips */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px', minHeight: '34px', padding: '6px 8px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                {form.services && form.services.length > 0 ? (
                  form.services.map((srv, idx) => (
                    <span
                      key={idx}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        background: '#e0e7ff',
                        color: '#3730a3',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        padding: '4px 9px',
                        borderRadius: '16px',
                        border: '1px solid #c7d2fe',
                      }}
                    >
                      {srv}
                      <button
                        type="button"
                        onClick={() => handleRemoveService(srv)}
                        style={{
                          border: 'none',
                          background: 'transparent',
                          color: '#4f46e5',
                          cursor: 'pointer',
                          fontWeight: 'bold',
                          padding: '0 2px',
                          fontSize: '0.85rem',
                          lineHeight: 1,
                        }}
                        title={`Remove ${srv}`}
                      >
                        ×
                      </button>
                    </span>
                  ))
                ) : (
                  <span style={{ fontSize: '0.8rem', color: '#dc2626', fontStyle: 'italic', padding: '4px' }}>
                    ⚠️ No services added. Reviewers will have to type manually.
                  </span>
                )}
              </div>

              {/* Add custom service input */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                <input
                  type="text"
                  className="admin-form-input"
                  style={{ flex: 1 }}
                  placeholder="Type a custom service and click Add (e.g. Mobile App Dev, SEO)..."
                  value={newServiceInput}
                  onChange={(e) => setNewServiceInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddService();
                    }
                  }}
                />
                <button
                  type="button"
                  className="admin-btn-secondary"
                  onClick={handleAddService}
                  style={{ whiteSpace: 'nowrap', padding: '6px 14px', fontWeight: 600, fontSize: '0.82rem' }}
                >
                  + Add Service
                </button>
              </div>

              {/* Suggested Industry Presets Quick-Add Chips */}
              {(() => {
                const presets = getCategoryServices(form.category === 'other' ? (form.customCategory || 'other') : form.category);
                const unadded = presets.filter((p) => !form.services.some((s) => s.toLowerCase() === p.toLowerCase()));
                if (unadded.length === 0) return null;
                return (
                  <div style={{ marginTop: '4px' }}>
                    <span style={{ fontSize: '0.72rem', color: '#64748b', display: 'block', marginBottom: '4px' }}>
                      Suggested for this category (tap to add):
                    </span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                      {unadded.slice(0, 8).map((p, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleToggleSuggestedService(p)}
                          style={{
                            background: '#f1f5f9',
                            border: '1px dashed #cbd5e1',
                            borderRadius: '12px',
                            padding: '3px 8px',
                            fontSize: '0.74rem',
                            color: '#475569',
                            cursor: 'pointer',
                          }}
                        >
                          + {p}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Google Review Destination Link */}
            <div className="admin-form-group" style={{ marginTop: '0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                <label className="admin-form-label" style={{ marginBottom: 0 }}>
                  Google Review Link <span className="required-star">*</span>
                </label>
                {isValidGoogleReviewLink(form.googleReviewLink) ? (
                  <span style={{ fontSize: '0.72rem', color: '#16a34a', fontWeight: 700 }}>
                    ✓ Valid Google Link
                  </span>
                ) : (
                  <span style={{ fontSize: '0.72rem', color: '#dc2626', fontWeight: 700 }}>
                    ⚠️ Google Link Required
                  </span>
                )}
              </div>
              <div className="admin-input-with-action">
                <input
                  type="url"
                  className="admin-form-input"
                  placeholder="Paste the business's Google review link"
                  value={form.googleReviewLink}
                  onChange={(e) => handleChange('googleReviewLink', e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="admin-input-action-btn"
                  onClick={() => {
                    if (form.googleReviewLink) {
                      window.open(form.googleReviewLink, '_blank', 'noopener,noreferrer');
                    }
                  }}
                  title="Test destination link in new tab"
                  disabled={!isValidGoogleReviewLink(form.googleReviewLink)}
                >
                  ↗ Test
                </button>
              </div>
              <span className="admin-form-hint" style={{ fontSize: '0.78rem', color: '#64748b', display: 'block', marginTop: '0.25rem' }}>
                Find it in Google Business Profile &rarr; Get more reviews &rarr; Share review form
              </span>
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
                  { id: 'google-quadrant', label: '⭐ Google 4-Color (Reference)' },
                  { id: 'google', label: 'Google Backdrop' },
                  { id: 'midnight', label: 'Obsidian Noir' },
                  { id: 'acrylic', label: 'Clean Acrylic' },
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    className={`admin-ctrl-btn ${standeeTheme === t.id ? 'active' : ''}`}
                    onClick={() => {
                      setStandeeTheme(t.id);
                      if (t.id === 'google' || t.id === 'google-quadrant') setShowBackdrop(true);
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
                  category: form.category === 'other'
                    ? (form.customCategory?.trim() || 'Custom Business')
                    : (CATEGORY_OPTIONS.find((c) => c.id === form.category)?.rawLabel || form.category),
                  website: reviewUrl,
                  logoUrl: form.logoUrl,
                }}
                reviewUrl={reviewUrl}
                logoUrl={form.logoUrl}
                theme={standeeTheme}
                format={standeeFormat}
                showBackdrop={showBackdrop}
                showBase={true}
                headline="WE'D LOVE YOUR FEEDBACK"
                tagline={form.tagline}
                show30sFlow={show30sFlow}
                accentColor={form.accentColor}
                cardRef={previewRef}
                canvasRef={canvasRef}
              />
            </div>
          </div>

          {/* Action Buttons Toolbar */}
          <div className="admin-qr-action-buttons" style={{ flexWrap: 'wrap', gap: '8px' }}>
            <a
              href={waWelcomeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="admin-btn-primary"
              style={{ background: '#16a34a', color: '#fff', textDecoration: 'none' }}
              title="Send review link and standee kit to client via WhatsApp"
            >
              💬 WhatsApp Standee Kit
            </a>

            <button
              type="button"
              className="admin-btn-secondary"
              onClick={handleCopyLink}
              title="Copy customer review link"
            >
              {copied ? '✓ Copied!' : '🔗 Copy Link'}
            </button>

            <button
              type="button"
              className="admin-btn-secondary"
              onClick={handlePrintStandee}
              title="Direct 1-click print"
            >
              🖨️ Print
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
