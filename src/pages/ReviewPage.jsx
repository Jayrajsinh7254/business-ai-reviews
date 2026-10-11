import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import confetti from 'canvas-confetti';
import StarRating from '../components/StarRating';
import { api, resolveGoogleReviewUrl, isBusinessInactive, isGenericOrEmptyServices } from '../api/client';
import { getCategoryServices } from '../lib/categories';

/**
 * Normalizes any phone number into international WhatsApp format (defaults to India 91 prefix)
 */
export function normalizeWhatsAppNumber(rawPhone) {
  if (!rawPhone) return '919537370561';
  let cleaned = String(rawPhone).replace(/[^0-9]/g, '');
  if (cleaned.startsWith('0') && cleaned.length === 11) {
    cleaned = cleaned.substring(1);
  }
  if (cleaned.length === 10) {
    return '91' + cleaned;
  }
  return cleaned || '919537370561';
}

export default function ReviewPage() {
  const { businessId } = useParams();

  // Business state
  const [business, setBusiness] = useState(null);
  const [loadingBusiness, setLoadingBusiness] = useState(true);
  const [businessError, setBusinessError] = useState('');

  // Step state (1: Service Dropdown, 2: Rate & Notes, 3: AI Draft & Google Post / Shield, 4: Celebration)
  const [currentStep, setCurrentStep] = useState(1);

  // Form fields
  const [serviceType, setServiceType] = useState('');
  const [customServiceText, setCustomServiceText] = useState('');
  const [whatStoodOut, setWhatStoodOut] = useState('');
  const [whatCouldImprove, setWhatCouldImprove] = useState('');
  const [draftText, setDraftText] = useState('');
  const [rating, setRating] = useState(5);
  const [lengthStyle, setLengthStyle] = useState('auto'); // 'auto' | 'short' | 'medium' | 'detailed'

  // 1-3 Star Protection Shield states
  const [bypassShieldToGoogle, setBypassShieldToGoogle] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerContact, setCustomerContact] = useState('');
  const [preferredResolution, setPreferredResolution] = useState('whatsapp');
  const [submittingPrivate, setSubmittingPrivate] = useState(false);
  const [privateFeedbackSubmitted, setPrivateFeedbackSubmitted] = useState(false);
  const [openedWhatsApp, setOpenedWhatsApp] = useState(false);

  // Action states
  const [generatingDraft, setGeneratingDraft] = useState(false);
  const [postingReview, setPostingReview] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [toastMsg, setToastMsg] = useState('');
  const [copied, setCopied] = useState(false);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 4000);
  };

  const copyToClipboard = async (text) => {
    const clean = (text || '').trim();
    if (!clean) return false;

    // 1. Primary: modern navigator.clipboard
    if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
      try {
        await navigator.clipboard.writeText(clean);
        return true;
      } catch (e) {
        console.warn('navigator.clipboard error, trying execCommand fallback:', e);
      }
    }

    // 2. Fallback: temporary hidden textarea with execCommand('copy') for mobile devices
    try {
      const textArea = document.createElement('textarea');
      textArea.value = clean;
      textArea.setAttribute('readonly', '');
      textArea.style.position = 'fixed';
      textArea.style.top = '-9999px';
      textArea.style.left = '-9999px';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      textArea.setSelectionRange(0, 99999);
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      if (successful) return true;
    } catch (err) {
      console.warn('execCommand copy fallback error:', err);
    }

    return false;
  };

  const handleCopyText = async () => {
    const success = await copyToClipboard(draftText);
    if (success) {
      setCopied(true);
      showToast('✓ Review copied to clipboard!');
      setTimeout(() => setCopied(false), 2500);
    } else {
      showToast('Please select and copy the text manually.');
    }
  };

  // Fetch business details on mount
  useEffect(() => {
    async function loadBusiness() {
      setLoadingBusiness(true);
      setBusinessError('');
      try {
        const effectiveId = businessId || 'demo-1';
        let data = await api.getBusiness(effectiveId, { isPublic: true });

        const sp = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();
        const urlName = sp.get('name') || '';
        const urlPhone = sp.get('phone') || sp.get('ownerPhone') || sp.get('owner_phone') || '';
        const urlCat = sp.get('cat') || sp.get('category') || 'service';
        const sParam = sp.get('services');
        const urlServices = sParam ? sParam.split(',').map((s) => s.trim()).filter(Boolean) : null;
        const urlGoogle = sp.get('google') || sp.get('googleUrl') || sp.get('googleLink') || '';

        if (!data) {
          const slugClean = effectiveId
            .replace(/-[a-z0-9]{3,6}$/i, '')
            .replace(/[-_]+/g, ' ')
            .trim();
          const derivedName = urlName || (slugClean.length > 2
            ? slugClean.split(' ').map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')
            : 'Local Business');

          const finalLink = urlGoogle || 'https://g.page/r/example/review';
          const defaultServices = getCategoryServices(urlCat);
          const effectiveServices = (urlServices && urlServices.length > 0 && !isGenericOrEmptyServices(urlServices))
            ? urlServices
            : defaultServices;

          data = {
            id: effectiveId,
            name: derivedName,
            category: urlCat,
            phone: urlPhone || '9537370561',
            services: effectiveServices,
            google_review_link: finalLink,
            googleReviewLink: finalLink,
            googleReviewUrl: finalLink,
            status: 'active',
            subscriptionStatus: 'active',
            planId: 'pro',
            createdAt: new Date().toISOString(),
          };
        } else {
          // If data.services is generic, empty, or URL provides explicit services, resolve accurately
          const hasCustomUrlServices = urlServices && urlServices.length > 0 && !isGenericOrEmptyServices(urlServices);
          const isDbGeneric = isGenericOrEmptyServices(data.services);

          const finalServices = hasCustomUrlServices
            ? urlServices
            : isDbGeneric
            ? getCategoryServices(data.category || data.businessType || urlCat)
            : data.services;

          data = {
            ...data,
            services: finalServices,
            phone: data.phone || urlPhone || '9537370561',
          };
        }

        setBusiness(data);
        if (data.services && data.services.length > 0) {
          setServiceType(data.services[0]);
        }
      } catch (err) {
        console.error('Error loading business:', err);
        const sp = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();
        const urlPhone = sp.get('phone') || sp.get('ownerPhone') || '';
        const urlCat = sp.get('cat') || sp.get('category') || 'service';
        const sParam = sp.get('services');
        const urlServices = sParam ? sParam.split(',').map((s) => s.trim()).filter(Boolean) : null;
        const fallbackBiz = {
          id: businessId || 'demo-1',
          name: 'Local Business',
          category: urlCat,
          phone: urlPhone || '9537370561',
          services: (urlServices && urlServices.length > 0 && !isGenericOrEmptyServices(urlServices))
            ? urlServices
            : getCategoryServices(urlCat),
          google_review_link: 'https://g.page/r/example/review',
          googleReviewLink: 'https://g.page/r/example/review',
          googleReviewUrl: 'https://g.page/r/example/review',
          status: 'active',
          subscriptionStatus: 'active',
        };
        setBusiness(fallbackBiz);
        if (fallbackBiz.services && fallbackBiz.services.length > 0) {
          setServiceType(fallbackBiz.services[0]);
        }
      } finally {
        setLoadingBusiness(false);
      }
    }

    loadBusiness();
  }, [businessId]);

  const getEffectiveService = () => {
    if (serviceType === '__custom__' || (!business?.services || business.services.length === 0)) {
      return customServiceText.trim() || 'General Service';
    }
    return serviceType || 'General Service';
  };

  // Step 1 -> Step 2 validation & transition
  const handleProceedToStep2 = () => {
    const effective = getEffectiveService();
    if (!effective) {
      setErrorMsg('Please select or enter the service you received.');
      return;
    }
    setErrorMsg('');
    setCurrentStep(2);
  };

  // Step 1 Fast-track: Instant 5-star AI Review generation
  const handleInstantGenerateFromStep1 = async () => {
    const effective = getEffectiveService();
    if (!effective) {
      setErrorMsg('Please select or enter the service you received.');
      return;
    }
    setErrorMsg('');
    setGeneratingDraft(true);
    try {
      const response = await api.generateDraftReview({
        businessId,
        serviceType: effective,
        whatStoodOut: 'Prompt service, highly professional and friendly staff, and top quality results.',
        whatCouldImprove: '',
        rating: 5,
        businessCategory: business?.category || '',
        seed: Date.now() + Math.floor(Math.random() * 1000000),
        lengthPreference: lengthStyle,
      });
      setRating(5);
      setDraftText(response.draftText || '');
      setCurrentStep(3);
    } catch (err) {
      console.error('Failed to generate draft review:', err);
      setErrorMsg(err.message || 'Failed to generate review draft. Please try again.');
    } finally {
      setGeneratingDraft(false);
    }
  };

  // Chip toggles for Praise Highlights
  const handleTogglePraiseChip = (chip) => {
    const cleanWord = chip.replace(/^[^\w\s]+\s*/, '').trim();
    setErrorMsg('');
    setWhatStoodOut((prev) => {
      const current = prev.trim();
      if (!current) return cleanWord;
      const regex = new RegExp(`(^|,\\s*)${cleanWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(,\\s*|$)`, 'i');
      if (regex.test(current)) {
        return current
          .replace(regex, '$1')
          .replace(/^,\s*|,\s*$/g, '')
          .replace(/,\s*,/g, ', ')
          .trim();
      } else {
        return `${current}, ${cleanWord}`;
      }
    });
  };

  const isPraiseChipActive = (chip) => {
    if (!whatStoodOut) return false;
    const cleanWord = chip.replace(/^[^\w\s]+\s*/, '').trim().toLowerCase();
    return whatStoodOut.toLowerCase().includes(cleanWord);
  };

  const handleToggleImproveChip = (chip) => {
    const cleanWord = chip.replace(/^[^\w\s]+\s*/, '').replace(/[^\w\s]+$/, '').trim();
    if (chip.includes('Everything was perfect') || chip.includes('No complaints')) {
      setWhatCouldImprove((prev) => (prev.toLowerCase() === cleanWord.toLowerCase() ? '' : cleanWord));
      return;
    }
    setWhatCouldImprove((prev) => {
      const current = prev.trim();
      if (!current) return cleanWord;
      const regex = new RegExp(`(^|,\\s*)${cleanWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(,\\s*|$)`, 'i');
      if (regex.test(current)) {
        return current
          .replace(regex, '$1')
          .replace(/^,\s*|,\s*$/g, '')
          .replace(/,\s*,/g, ', ')
          .trim();
      } else {
        return `${current}, ${cleanWord}`;
      }
    });
  };

  const isImproveChipActive = (chip) => {
    if (!whatCouldImprove) return false;
    const cleanWord = chip.replace(/^[^\w\s]+\s*/, '').replace(/[^\w\s]+$/, '').trim().toLowerCase();
    return whatCouldImprove.toLowerCase().includes(cleanWord);
  };

  // Step 2 -> Step 3: Trigger draft review generation (NEVER BLOCKS)
  const handleGenerateReview = async () => {
    setErrorMsg('');
    setGeneratingDraft(true);

    try {
      const effectiveService = getEffectiveService();
      const fallbackPraise = rating >= 4
        ? 'Great service, polite and professional team, and very smooth experience overall.'
        : (rating === 3 ? 'Decent service, took care of everything required.' : 'Could have been better.');
      const resolvedWhatStoodOut = (whatStoodOut || '').trim() || fallbackPraise;

      const response = await api.generateDraftReview({
        businessId,
        serviceType: effectiveService,
        whatStoodOut: resolvedWhatStoodOut,
        whatCouldImprove: (whatCouldImprove || '').trim(),
        rating,
        businessCategory: business?.category || '',
        seed: Date.now() + Math.floor(Math.random() * 1000000),
        lengthPreference: lengthStyle,
      });

      setDraftText(response.draftText || '');
      setCurrentStep(3);
    } catch (err) {
      console.error('Failed to generate draft review:', err);
      setErrorMsg(err.message || 'Failed to generate review draft. Please try again.');
    } finally {
      setGeneratingDraft(false);
    }
  };

  // Step 3: Regenerate draft with rating & length adaptation
  const handleRegenerate = async (customRating, customLength) => {
    const activeRating = typeof customRating === 'number' ? customRating : rating;
    const activeLength = typeof customLength === 'string' ? customLength : lengthStyle;
    setGeneratingDraft(true);
    setErrorMsg('');

    try {
      const effectiveService = getEffectiveService();
      const fallbackPraise = activeRating >= 4
        ? 'Great service, polite and professional team, and very smooth experience overall.'
        : (activeRating === 3 ? 'Decent service, took care of everything required.' : 'Could have been better.');
      const resolvedWhatStoodOut = (whatStoodOut || '').trim() || fallbackPraise;

      const response = await api.generateDraftReview({
        businessId,
        serviceType: effectiveService,
        whatStoodOut: resolvedWhatStoodOut,
        whatCouldImprove: (whatCouldImprove || '').trim(),
        rating: activeRating,
        previousDraft: draftText || '',
        businessCategory: business?.category || '',
        seed: Date.now() + Math.floor(Math.random() * 1000000),
        lengthPreference: activeLength,
      });
      setDraftText(response.draftText || '');
      showToast('✨ Review regenerated with fresh wording!');
    } catch (err) {
      console.error('Failed to regenerate review:', err);
      setErrorMsg(err.message || 'Could not regenerate review. Please try again.');
    } finally {
      setGeneratingDraft(false);
    }
  };

  const handleSelectLengthStyle = (newLength) => {
    setLengthStyle(newLength);
    handleRegenerate(rating, newLength);
  };

  const handleRatingChange = (newRating) => {
    setRating(newRating);
    if (newRating >= 4) {
      setBypassShieldToGoogle(false);
    }
    handleRegenerate(newRating);
  };

  // Direct WhatsApp Message to Owner (1-3 Star Protection Shield)
  const handleSendDirectWhatsApp = async () => {
    const ownerWaNumber = normalizeWhatsAppNumber(business?.phone);
    const effectiveService = getEffectiveService();
    const feedbackNotes = (whatStoodOut || whatCouldImprove || draftText || 'Not completely satisfied with recent visit').trim();

    const waText = 
      `Hi ${business?.name || 'Owner'},\n\n` +
      `I visited recently for "${effectiveService}" and rated my experience ${rating}★.\n\n` +
      `Issue / Feedback: "${feedbackNotes}"\n\n` +
      `I am reaching out directly on WhatsApp to give you an opportunity to resolve this. Looking forward to hearing from you.`;

    const waUrl = `https://wa.me/${ownerWaNumber}?text=${encodeURIComponent(waText)}`;

    // Open WhatsApp directly
    window.open(waUrl, '_blank', 'noopener,noreferrer');
    setOpenedWhatsApp(true);
    showToast('💬 Opening WhatsApp to connect with owner...');

    // Asynchronously log private feedback to backend/storage
    try {
      await api.submitPrivateFeedback({
        businessId: business?.id || businessId,
        serviceType: effectiveService,
        rating,
        issue: feedbackNotes,
        customerName: customerName.trim() || 'WhatsApp Customer',
        customerContact: customerContact.trim() || 'WhatsApp direct',
        preferredResolution: 'Direct WhatsApp resolution',
      });
      setPrivateFeedbackSubmitted(true);
    } catch (e) {
      console.warn('Private feedback auto-log error:', e);
    }

    setCurrentStep(4);
  };

  // In-App Private Feedback Submission (1-3 Star Protection Shield)
  const handleSubmitPrivateFeedback = async (e) => {
    if (e) e.preventDefault();
    const feedbackNotes = (whatStoodOut || whatCouldImprove || draftText || '').trim();
    if (!feedbackNotes && !customerContact.trim()) {
      setErrorMsg('Please enter your feedback or contact details so the owner can respond.');
      return;
    }
    setErrorMsg('');
    setSubmittingPrivate(true);

    try {
      const effectiveService = getEffectiveService();
      await api.submitPrivateFeedback({
        businessId: business?.id || businessId,
        serviceType: effectiveService,
        rating,
        issue: feedbackNotes || 'Customer requested owner resolution.',
        customerName: customerName.trim() || 'Valued Customer',
        customerContact: customerContact.trim() || 'Portal Form',
        preferredResolution: preferredResolution === 'whatsapp'
          ? 'WhatsApp message from owner'
          : preferredResolution === 'call'
          ? 'Phone call from owner'
          : preferredResolution === 'refund'
          ? 'Refund / replacement discussion'
          : 'Management review',
      });

      setPrivateFeedbackSubmitted(true);
      showToast('✓ Your private feedback was delivered directly to the owner!');
      setCurrentStep(4);
    } catch (err) {
      console.error('Failed to submit private feedback:', err);
      setErrorMsg('Could not submit feedback. Please use the WhatsApp button above.');
    } finally {
      setSubmittingPrivate(false);
    }
  };

  // Step 3: Post to Google Reviews
  const handlePostToGoogle = async () => {
    const textToCopy = draftText.trim();
    if (!textToCopy) {
      setErrorMsg('Review text cannot be empty.');
      return;
    }

    // 1. CRITICAL: Copy to clipboard SYNCHRONOUSLY within the direct user tap/click gesture!
    // Safari and Chrome require this to happen before any async network await.
    copyToClipboard(textToCopy);
    setCopied(true);

    const rawLink = (business?.google_review_link || business?.googleReviewLink || business?.google_review_url || business?.googleReviewUrl || '').trim();

    // Popup-blocker safety: Open new tab synchronously inside click event
    let newTab = null;
    if (rawLink) {
      try {
        newTab = window.open('about:blank', '_blank');
      } catch (e) {
        console.warn('Synchronous popup open notice:', e);
      }
    }

    setPostingReview(true);
    setErrorMsg('');

    try {
      const effectiveService = getEffectiveService();
      // 2. Save review confirmation
      const result = await api.confirmReview({
        businessId,
        serviceType: effectiveService,
        finalText: textToCopy,
        rating,
        whatStoodOut,
        whatCouldImprove,
      });

      // 3. Re-affirm clipboard copy
      await copyToClipboard(textToCopy);

      // 4. Fire celebratory confetti
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {}

      // 5. Show toast instruction
      showToast('✓ Review copied! Opening Google — tap Paste & Post.');

      // 5. Open destination Google review link
      const targetLink = rawLink || (result?.google_review_link || result?.googleReviewUrl || '').trim();

      if (targetLink) {
        if (newTab && !newTab.closed) {
          try {
            newTab.opener = null;
          } catch {}
          newTab.location.href = targetLink;
        } else {
          window.open(targetLink, '_blank', 'noopener,noreferrer');
        }
      } else {
        if (newTab && !newTab.closed) {
          newTab.close();
        }
      }

      setCurrentStep(4);
    } catch (err) {
      if (newTab && !newTab.closed) {
        newTab.close();
      }
      console.error('Failed to confirm review:', err);
      setErrorMsg(err.message || 'Failed to submit review.');
    } finally {
      setPostingReview(false);
    }
  };

  if (loadingBusiness) {
    return (
      <div className="mobile-review-viewport">
        <div className="mobile-card loading-card text-center animate-fade-in">
          <div className="loading-card-inner">
            <div className="loading-badge-ring">
              <span className="spinner spinner-brand"></span>
            </div>
            <h3 className="loading-brand-title">Preparing Review Page</h3>
            <p className="loading-text">Loading business details & AI reviewer...</p>
          </div>
        </div>
      </div>
    );
  }

  if (businessError) {
    return (
      <div className="mobile-review-viewport">
        <div className="mobile-card text-center">
          <div className="error-icon">⚠️</div>
          <h2>Business Not Found</h2>
          <p className="error-desc">{businessError}</p>
          <Link to="/signup" className="btn-primary btn-block">
            Register a Business
          </Link>
        </div>
      </div>
    );
  }

  const isTrialExpired =
    (business?.subscriptionStatus === 'trialing' || business?.status === 'trial') &&
    business?.createdAt &&
    Date.now() - new Date(business.createdAt).getTime() > 7 * 24 * 60 * 60 * 1000;

  const isInactive = Boolean(
    isBusinessInactive(business) ||
    isBusinessInactive(businessId) ||
    business?.status === 'inactive' ||
    business?.subscriptionStatus === 'inactive' ||
    business?.subscriptionStatus === 'canceled' ||
    (business?.paidUntil && new Date(business.paidUntil) < new Date()) ||
    isTrialExpired
  );

  if (isInactive) {
    const directGoogleUrl = resolveGoogleReviewUrl(business?.googleReviewUrl, business?.name);
    return (
      <div className="mobile-review-viewport">
        <div className="mobile-card service-inactive-card text-center animate-fade-in">
          <div className="service-inactive-icon-wrap">
            <span className="service-inactive-icon">⏸️</span>
          </div>
          <span className="service-inactive-badge">⛔ Service Inactive / Paused</span>
          <h2 className="service-inactive-biz-name">{business?.name || 'Local Business'}</h2>
          <p className="service-inactive-desc">
            Automated AI review collection for this location is temporarily paused by administration.
          </p>

          <div className="service-inactive-card-box">
            <div className="inactive-box-row">
              <span className="inactive-box-label">Business:</span>
              <span className="inactive-box-value">{business?.name || 'Business Partner'}</span>
            </div>
            {business?.category && (
              <div className="inactive-box-row">
                <span className="inactive-box-label">Category:</span>
                <span className="inactive-box-value" style={{ textTransform: 'capitalize' }}>{business.category}</span>
              </div>
            )}
            <div className="inactive-box-row">
              <span className="inactive-box-label">Service Status:</span>
              <span className="inactive-status-pill">⏸️ Inactive / Paused</span>
            </div>
          </div>

          {business?.googleReviewUrl && (
            <div className="service-inactive-google-cta">
              <p className="inactive-direct-prompt">
                Visiting customer? You can still post your review directly to Google Maps:
              </p>
              <a
                href={directGoogleUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary btn-block btn-direct-google"
              >
                ⭐ Review Directly on Google Maps
              </a>
            </div>
          )}

          <div className="service-inactive-owner-note" style={{ marginTop: '20px', padding: '12px', background: '#f8fafc', borderRadius: '8px', border: '1px dashed #cbd5e1', fontSize: '0.8rem', color: '#64748b' }}>
            <span>Are you the business owner? Contact admin for immediate reactivation:</span>
            <a
              href={`https://wa.me/919537370561?text=${encodeURIComponent(
                `Hi ReviewAssist Admin, my business review service (${business?.name || businessId}) is currently inactive. Please assist with account reactivation.`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: 'inline-block', marginTop: '6px', color: '#16a34a', fontWeight: 700, textDecoration: 'none' }}
            >
              💬 WhatsApp Admin →
            </a>
          </div>

          <div className="service-inactive-powered-by">
            <span>Powered by <strong>ReviewAssist</strong> • Smart AI Reviews</span>
          </div>
        </div>
      </div>
    );
  }

  function getCategoryIcon(cat) {
    if (!cat) return '🏪';
    const c = cat.toLowerCase();
    if (/it|software|tech|marketing|seo|web|developer|app|digital/i.test(c)) return '💻';
    if (/auto|car|garage|mechanic|tyre|motor/i.test(c)) return '🚗';
    if (/salon|hair|beauty|spa|skin|barber|nail/i.test(c)) return '💇‍♀️';
    if (/restaurant|cafe|café|food|dining|bakery/i.test(c)) return '🍽️';
    if (/dental|dentist|clinic|doctor|hospital|medical|physio/i.test(c)) return '🏥';
    if (/gym|fitness|yoga|trainer|sports/i.test(c)) return '🏋️';
    if (/real estate|property|interior|architect/i.test(c)) return '🏢';
    if (/school|coaching|tuition|education|academy/i.test(c)) return '🎓';
    if (/plumb|electric|repair|clean|pest|home service/i.test(c)) return '🛠️';
    if (/law|legal|tax|ca |finance|loan/i.test(c)) return '⚖️';
    if (/hotel|resort|hospitality|stay/i.test(c)) return '🏨';
    if (/retail|shop|store|boutique/i.test(c)) return '🛍️';
    return '✨';
  }

  function getCategoryPraiseChips(cat) {
    if (!cat) {
      return [
        '⚡ Fast & Prompt',
        '🤝 Friendly Staff',
        '💎 Top Quality',
        '🧼 Super Clean',
        '💰 Fair Pricing',
        '🎯 Highly Professional',
        '✨ Great Atmosphere',
        '🏆 Exceeded Expectations',
      ];
    }
    const c = cat.toLowerCase();
    if (/restaurant|cafe|café|food|dining|bakery|bar|kitchen|pizza|sweet|dhaba/i.test(c)) {
      return [
        '🍽️ Delicious Food',
        '⚡ Fast Service',
        '🤝 Friendly Staff',
        '✨ Great Ambience',
        '🧼 Clean & Fresh',
        '💰 Great Value',
        '🍹 Loved Drinks',
        '🏆 Highly Recommended',
      ];
    }
    if (/salon|hair|beauty|spa|skin|barber|nail|grooming/i.test(c)) {
      return [
        '✂️ Skilled Styling',
        '💆 Relaxing Vibe',
        '🤝 Courteous Staff',
        '🧼 Clean & Hygienic',
        '💎 Premium Care',
        '⏰ Punctual Service',
        '💖 Loved Result',
        '💰 Worth Every Penny',
      ];
    }
    if (/auto|car|garage|mechanic|tyre|motor|bike|repair|vehicle/i.test(c)) {
      return [
        '🔧 Honest Diagnosis',
        '⚡ Quick Turnaround',
        '🤝 Polite Team',
        '💰 Fair & Clear Pricing',
        '🚗 Smooth Drive',
        '💎 Genuine Work',
        '👍 Highly Reliable',
        '⭐ Great Service',
      ];
    }
    if (/dental|clinic|doctor|hospital|medical|physio|health|care/i.test(c)) {
      return [
        '👨‍⚕️ Caring Doctor',
        '⏳ Minimal Wait',
        '🤝 Supportive Staff',
        '🧼 Spotless Clinic',
        '💎 Clear Treatment Advice',
        '✨ Gentle & Painless',
        '📋 Transparent Guidance',
        '🏆 Experienced Team',
      ];
    }
    if (/gym|fitness|yoga|trainer|sports/i.test(c)) {
      return [
        '🏋️ Top Equipment',
        '💪 Inspiring Trainers',
        '🧼 Clean & Fresh',
        '🤝 Motivating Vibe',
        '⏱️ Flexible Hours',
        '🎯 Personal Attention',
      ];
    }
    if (/it|software|tech|marketing|web|app|digital/i.test(c)) {
      return [
        '💻 High Technical Skill',
        '⚡ Fast Delivery',
        '🤝 Clear Communication',
        '📈 Measurable Results',
        '💡 Proactive Ideas',
        '🏆 Reliable Partner',
      ];
    }
    return [
      '⚡ Fast & Prompt',
      '🤝 Friendly Staff',
      '💎 Top Quality',
      '🧼 Super Clean',
      '💰 Fair Pricing',
      '🎯 Highly Professional',
      '✨ Great Atmosphere',
      '🏆 Exceeded Expectations',
    ];
  }

  const IMPROVEMENT_SUGGESTIONS = [
    'Everything was perfect! 👌',
    'Slight wait time ⏳',
    'Parking was tight 🚗',
    'A bit busy / crowded 👥',
    'No complaints ✨',
  ];

  const hasServices = business?.services && business.services.length > 0;

  return (
    <div className="mobile-review-viewport">
      {/* Toast feedback */}
      {toastMsg && (
        <div
          className="floating-toast animate-fade-in"
          style={{
            position: 'fixed',
            bottom: '24px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#0f172a',
            color: '#ffffff',
            padding: '12px 20px',
            borderRadius: '999px',
            fontSize: '0.88rem',
            fontWeight: 600,
            boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3)',
            zIndex: 9999,
            maxWidth: '90%',
            textAlign: 'center',
          }}
        >
          {toastMsg}
        </div>
      )}

      {/* Mobile container wrapper */}
      <div className="mobile-card review-flow-card">
        {/* Header with Business Brand */}
        <div className="review-header">
          <div className="review-biz-badge">
            <span className="biz-badge-icon">{getCategoryIcon(business?.category)}</span>
            <span className="biz-badge-category">{business?.category || 'Service'}</span>
          </div>
          <h1 className="review-biz-title">{business?.name || 'Customer Review'}</h1>
          <p className="review-biz-prompt">
            {currentStep === 4
              ? 'Thank you for sharing your feedback!'
              : 'Help others discover great service with an AI-crafted review in 30 seconds.'}
          </p>

          {/* Step Progress Indicators */}
          {currentStep <= 3 && (
            <div className="step-progress-bar">
              <div className={`step-dot ${currentStep >= 1 ? 'active' : ''} ${currentStep > 1 ? 'completed' : ''}`}>
                1
              </div>
              <div className={`step-line ${currentStep >= 2 ? 'active' : ''}`}></div>
              <div className={`step-dot ${currentStep >= 2 ? 'active' : ''} ${currentStep > 2 ? 'completed' : ''}`}>
                2
              </div>
              <div className={`step-line ${currentStep >= 3 ? 'active' : ''}`}></div>
              <div className={`step-dot ${currentStep >= 3 ? 'active' : ''}`}>
                3
              </div>
            </div>
          )}
        </div>

        {/* Error Alert */}
        {errorMsg && <div className="alert-banner alert-error">{errorMsg}</div>}

        {/* STEP 1: Service Dropdown Selection */}
        {currentStep === 1 && (
          <div className="step-content step-1 animate-fade-in">
            <div className="step-title-row">
              <span className="step-tag">Step 1 of 3</span>
              <h2 className="step-heading">What did you get done?</h2>
            </div>

            {hasServices ? (
              <div className="form-group">
                <label htmlFor="service-select" className="form-label">
                  Choose the service you received
                </label>
                <div className="select-wrapper">
                  <select
                    id="service-select"
                    className="form-select"
                    value={serviceType}
                    onChange={(e) => setServiceType(e.target.value)}
                  >
                    {business.services.map((srv, idx) => (
                      <option key={idx} value={srv}>
                        {srv}
                      </option>
                    ))}
                    <option value="__custom__">+ Other / Custom Service...</option>
                  </select>
                </div>

                {serviceType === '__custom__' && (
                  <div className="custom-service-field animate-fade-in">
                    <label htmlFor="custom-service-input" className="form-label mt-3">
                      Enter your service name
                    </label>
                    <input
                      id="custom-service-input"
                      type="text"
                      className="form-input"
                      value={customServiceText}
                      onChange={(e) => setCustomServiceText(e.target.value)}
                      placeholder="e.g. Custom Detailing, Consultation, etc."
                      autoFocus
                    />
                  </div>
                )}
              </div>
            ) : (
              /* Fallback if business has no preset services */
              <div className="form-group">
                <label htmlFor="free-service-input" className="form-label">
                  Service or Item Received
                </label>
                <input
                  id="free-service-input"
                  type="text"
                  className="form-input"
                  value={customServiceText}
                  onChange={(e) => setCustomServiceText(e.target.value)}
                  placeholder="e.g. Dinner, Haircut, Tune-up..."
                  autoFocus
                />
              </div>
            )}

            <div className="step-actions" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                type="button"
                className="btn-primary btn-block btn-lg"
                onClick={handleProceedToStep2}
              >
                Next: Share Your Experience →
              </button>

              <button
                type="button"
                className="btn-secondary btn-block"
                onClick={handleInstantGenerateFromStep1}
                disabled={generatingDraft}
                style={{ fontSize: '0.9rem', fontWeight: 600 }}
              >
                {generatingDraft ? (
                  <span className="btn-inline-loader">
                    <span className="spinner spinner-xs" /> Crafting AI Review...
                  </span>
                ) : (
                  '⚡ Instant 5-Star AI Review (1-Click)'
                )}
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Rate & Tell Us About Your Visit */}
        {currentStep === 2 && (
          <div className="step-content step-2 animate-fade-in">
            <div className="step-title-row">
              <span className="step-tag">Step 2 of 3</span>
              <h2 className="step-heading">How was your visit?</h2>
            </div>

            <div className="service-selected-pill">
              <span className="service-pill-icon">🏷️</span>
              <span className="service-pill-label">Service:</span>
              <strong className="service-pill-name">{getEffectiveService()}</strong>
            </div>

            {/* Interactive Star Rating Hero */}
            <div className="review-stars-hero">
              <span className="stars-hero-eyebrow">Rate Your Overall Experience</span>
              <div className="stars-hero-picker">
                <StarRating
                  rating={rating}
                  onChange={(r) => setRating(r)}
                  size="lg"
                  showLabel={false}
                />
              </div>
              <div className={`stars-sentiment-pill rating-${rating}`}>
                {rating === 5 && '🌟 5-Star: Outstanding Experience!'}
                {rating === 4 && '👍 4-Star: Very Good Experience!'}
                {rating === 3 && '⚖️ 3-Star: Average Experience'}
                {rating === 2 && '👎 2-Star: Needs Improvement'}
                {rating === 1 && '⚠️ 1-Star: Very Unsatisfactory'}
              </div>
              <span className="stars-hero-tap-hint">Tap any star above to select your rating</span>
            </div>

            {/* 1-3 Star Protection Shield Banner */}
            {rating <= 3 && (
              <div className="shield-notice-box animate-fade-in">
                <div className="shield-notice-badge">🛡️ Negative Review Protection Active</div>
                <p className="shield-notice-desc">
                  We sincerely apologize that your visit wasn't a 5-star experience. Your feedback will connect directly with the owner on WhatsApp for immediate resolution.
                </p>
              </div>
            )}

            {/* Question 1: What stood out to you? */}
            <div className="review-question-card">
              <div className="review-question-header">
                <span className="question-number-badge">1</span>
                <div className="question-header-content">
                  <h3 className="review-question-title">
                    1. What stood out to you? <span className="optional-tag">(Optional)</span>
                  </h3>
                  <span className="review-question-subtitle">
                    Tap popular highlights or describe in your own words:
                  </span>
                </div>
              </div>

              {/* Quick Praise Highlights Chips */}
              <div className="review-chips-grid">
                {getCategoryPraiseChips(business?.category).map((chip, idx) => {
                  const active = isPraiseChipActive(chip);
                  return (
                    <button
                      key={idx}
                      type="button"
                      className={`review-quick-chip ${active ? 'active' : ''}`}
                      onClick={() => handleTogglePraiseChip(chip)}
                      aria-pressed={active}
                    >
                      {active && <span className="chip-checkmark">✓</span>}
                      <span>{chip}</span>
                    </button>
                  );
                })}
              </div>

              <div className="form-group mb-0">
                <textarea
                  id="what-stood-out"
                  rows="3"
                  className="form-textarea review-custom-textarea"
                  value={whatStoodOut}
                  onChange={(e) => {
                    setErrorMsg('');
                    setWhatStoodOut(e.target.value);
                  }}
                  placeholder="e.g. Prompt service, friendly staff, great atmosphere, high quality results..."
                />
                <div className="textarea-footer-hint">
                  <span>✨ Tap tags above or write notes — AI will construct your review!</span>
                </div>
              </div>
            </div>

            {/* Question 2: Anything that could've been better? */}
            <div className="review-question-card">
              <div className="review-question-header">
                <span className="question-number-badge secondary">2</span>
                <div className="question-header-content">
                  <h3 className="review-question-title">
                    2. Anything that could've been better? <span className="optional-tag">(Optional)</span>
                  </h3>
                  <span className="review-question-subtitle">
                    Any feedback, suggestions, or areas for improvement?
                  </span>
                </div>
              </div>

              {/* Quick Suggestion Chips */}
              <div className="review-chips-grid">
                {IMPROVEMENT_SUGGESTIONS.map((chip, idx) => {
                  const active = isImproveChipActive(chip);
                  return (
                    <button
                      key={idx}
                      type="button"
                      className={`review-quick-chip chip-improvement ${active ? 'active' : ''}`}
                      onClick={() => handleToggleImproveChip(chip)}
                      aria-pressed={active}
                    >
                      {active && <span className="chip-checkmark">✓</span>}
                      <span>{chip}</span>
                    </button>
                  );
                })}
              </div>

              <div className="form-group mb-0">
                <textarea
                  id="what-could-improve"
                  rows="2"
                  className="form-textarea review-custom-textarea"
                  value={whatCouldImprove}
                  onChange={(e) => setWhatCouldImprove(e.target.value)}
                  placeholder="e.g. Parking was tight, slight delay, or everything went smoothly..."
                />
              </div>
            </div>

            {/* Step 2 Action Buttons */}
            <div className="step-actions-split">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setCurrentStep(1)}
              >
                ← Back
              </button>

              <button
                type="button"
                className={`btn-primary flex-1 btn-lg ${rating <= 3 ? 'btn-shield-action' : ''}`}
                onClick={handleGenerateReview}
                disabled={generatingDraft}
              >
                {generatingDraft ? (
                  <span className="btn-loading-state">
                    <span className="spinner"></span> {rating <= 3 ? 'Preparing Direct Resolution...' : 'Generating AI Draft...'}
                  </span>
                ) : (
                  rating <= 3 ? '🛡️ Connect Directly with Owner →' : '✨ Generate AI Review →'
                )}
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Review Draft OR 1-3 Star Protection Shield */}
        {currentStep === 3 && (
          <div className="step-content step-3 animate-fade-in">
            {rating <= 3 && !bypassShieldToGoogle ? (
              /* =============================================================
                 1-3 STAR NEGATIVE REVIEW SHIELD: DIRECT WHATSAPP TO OWNER
                 ============================================================= */
              <div className="shield-intercept-view animate-fade-in">
                <div className="shield-hero-badge">
                  <span className="shield-hero-icon">🛡️</span>
                  <span>1–3 Star Protection Shield Active</span>
                </div>

                <h2 className="shield-main-title">Direct Owner Resolution</h2>
                <p className="shield-main-subtitle">
                  We are deeply sorry your experience wasn't 5-star. Rather than a public review, the owner of <strong>{business?.name}</strong> wants to personally hear from you and make it right immediately.
                </p>

                {/* Star Rating adjust bar */}
                <div className="shield-rating-adjust-box">
                  <span className="shield-rating-label">Selected Rating:</span>
                  <div className="shield-star-wrap">
                    <StarRating rating={rating} onChange={handleRatingChange} size="md" />
                  </div>
                  <span className={`sentiment-badge rating-${rating}`}>
                    {rating === 3 && '⚖️ 3-Star (Average Experience)'}
                    {rating === 2 && '👎 2-Star (Needs Improvement)'}
                    {rating === 1 && '⚠️ 1-Star (Very Unsatisfactory)'}
                  </span>
                </div>

                {/* Primary Card: Direct WhatsApp to Owner */}
                <div className="shield-whatsapp-card">
                  <div className="shield-wa-header">
                    <div className="shield-wa-icon-circle">
                      <svg viewBox="0 0 24 24" width="26" height="26" fill="#ffffff">
                        <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 6.46 17.5 2 12.04 2M12.05 20.16C10.57 20.16 9.12 19.76 7.85 19L7.55 18.82L4.43 19.64L5.26 16.59L5.06 16.27C4.24 14.97 3.8 13.46 3.8 11.91C3.8 7.37 7.5 3.67 12.05 3.67C16.6 3.67 20.29 7.37 20.29 11.92C20.29 16.46 16.6 20.16 12.05 20.16M16.57 14.39C16.32 14.26 15.1 13.66 14.87 13.58C14.65 13.5 14.48 13.45 14.32 13.7C14.15 13.95 13.67 14.52 13.52 14.69C13.38 14.85 13.23 14.88 12.98 14.75C12.73 14.63 11.94 14.37 11 13.53C10.27 12.88 9.77 12.08 9.63 11.83C9.48 11.58 9.61 11.45 9.74 11.32C9.85 11.21 9.99 11.03 10.12 10.88C10.24 10.73 10.28 10.63 10.37 10.46C10.45 10.29 10.41 10.15 10.35 10.02C10.28 9.9 9.8 8.71 9.6 8.22C9.4 7.74 9.2 7.81 9.05 7.8C8.91 7.8 8.74 7.8 8.58 7.8C8.41 7.8 8.14 7.86 7.91 8.11C7.68 8.36 7.03 8.97 7.03 10.21C7.03 11.45 7.93 12.65 8.06 12.82C8.19 12.98 9.83 15.52 12.35 16.61C12.95 16.87 13.42 17.02 13.78 17.14C14.38 17.33 14.93 17.3 15.37 17.24C15.86 17.17 16.88 16.62 17.09 16.03C17.3 15.45 17.3 14.96 17.24 14.85C17.17 14.75 17.01 14.69 16.76 14.56L16.57 14.39Z" />
                      </svg>
                    </div>
                    <div className="shield-wa-meta">
                      <h4 className="shield-wa-title">Direct WhatsApp to Owner</h4>
                      <span className="shield-wa-phone">
                        WhatsApp: +{normalizeWhatsAppNumber(business?.phone)}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="btn-whatsapp-direct"
                    onClick={handleSendDirectWhatsApp}
                  >
                    <span>💬 Message Owner on WhatsApp Now</span>
                  </button>

                  <span className="shield-wa-hint">
                    ⚡ Direct line to owner • Opens pre-filled chat with your feedback
                  </span>
                </div>

                {/* Form: In-App Private Feedback */}
                <div className="shield-form-card">
                  <div className="shield-divider">
                    <span>OR SUBMIT PRIVATE NOTE</span>
                  </div>

                  <form onSubmit={handleSubmitPrivateFeedback} className="shield-private-form">
                    <div className="form-group">
                      <label className="form-label" htmlFor="shield-customer-name">
                        Your Name <span className="optional-tag">(Optional)</span>
                      </label>
                      <input
                        id="shield-customer-name"
                        type="text"
                        className="form-input"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="e.g. John Doe"
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label" htmlFor="shield-customer-contact">
                        Your Phone or Email <span className="optional-tag">(For owner callback)</span>
                      </label>
                      <input
                        id="shield-customer-contact"
                        type="text"
                        className="form-input"
                        value={customerContact}
                        onChange={(e) => setCustomerContact(e.target.value)}
                        placeholder="e.g. 9876543210 or name@example.com"
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Preferred Resolution</label>
                      <div className="shield-resolution-chips">
                        {[
                          { id: 'whatsapp', label: '💬 WhatsApp' },
                          { id: 'call', label: '📞 Phone Call' },
                          { id: 'refund', label: '🎁 Redo / Refund' },
                          { id: 'management', label: '📝 Management' },
                        ].map((res) => (
                          <button
                            key={res.id}
                            type="button"
                            className={`resolution-chip ${preferredResolution === res.id ? 'active' : ''}`}
                            onClick={() => setPreferredResolution(res.id)}
                          >
                            {res.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label" htmlFor="shield-complaint-notes">
                        What went wrong / suggestions:
                      </label>
                      <textarea
                        id="shield-complaint-notes"
                        rows="3"
                        className="form-textarea"
                        value={whatStoodOut || whatCouldImprove || draftText}
                        onChange={(e) => {
                          setWhatStoodOut(e.target.value);
                          setDraftText(e.target.value);
                        }}
                        placeholder="Describe what occurred during your visit..."
                      />
                    </div>

                    <button
                      type="submit"
                      className="btn-secondary btn-block"
                      disabled={submittingPrivate}
                      style={{ padding: '12px', fontWeight: 700 }}
                    >
                      {submittingPrivate ? (
                        <span className="btn-inline-loader">
                          <span className="spinner spinner-xs" /> Submitting to Owner...
                        </span>
                      ) : (
                        '🔒 Send Private Feedback to Owner'
                      )}
                    </button>
                  </form>
                </div>

                {/* Google Compliance Bypass */}
                <div className="shield-compliance-box">
                  <button
                    type="button"
                    className="compliance-bypass-btn"
                    onClick={() => setBypassShieldToGoogle(true)}
                  >
                    Prefer to post publicly on Google Maps instead? Click here →
                  </button>
                </div>
              </div>
            ) : (
              /* =============================================================
                 STANDARD 4-5 STAR OR GOOGLE BYPASS FLOW
                 ============================================================= */
              <>
                {bypassShieldToGoogle && (
                  <div className="shield-bypass-notice animate-fade-in">
                    <span>⚠️ Public Google Posting Mode Active</span>
                    <button
                      type="button"
                      className="shield-restore-btn"
                      onClick={() => setBypassShieldToGoogle(false)}
                    >
                      🛡️ Switch Back to WhatsApp
                    </button>
                  </div>
                )}

                <div className="step-title-row">
                  <span className="step-tag">Step 3 of 3</span>
                  <h2 className="step-heading">Your Ready-to-Post Review</h2>
                </div>

                {/* Star Rating Picker with dynamic sentiment badge */}
                <div className="star-picker-section">
                  <div className="star-picker-header">
                    <span className="form-label" style={{ marginBottom: 0 }}>Review Rating:</span>
                    <span className={`sentiment-badge rating-${rating}`}>
                      {rating === 5 && '🌟 5-Star (Enthusiastic)'}
                      {rating === 4 && '👍 4-Star (Positive)'}
                      {rating === 3 && '⚖️ 3-Star (Balanced)'}
                      {rating === 2 && '👎 2-Star (Dissatisfied)'}
                      {rating === 1 && '⚠️ 1-Star (Critical)'}
                    </span>
                  </div>
                  <StarRating rating={rating} onChange={handleRatingChange} size="lg" showLabel={false} />
                  <span className="star-picker-subhint">
                    Tap any star above to instantly regenerate the review with that tone!
                  </span>
                </div>

                {/* Editable Draft Textarea */}
                <div className="form-group">
                  <div className="form-label-row draft-label-row">
                    <label htmlFor="draft-review-text" className="form-label draft-main-label">
                      Review Text <span className="optional-tag">(Feel free to edit)</span>
                    </label>
                    <div className="draft-top-actions">
                      <button
                        type="button"
                        className="btn-link-sm"
                        onClick={handleCopyText}
                      >
                        {copied ? '✓ Copied!' : '📋 Copy'}
                      </button>
                      <button
                        type="button"
                        className="btn-link-sm"
                        onClick={() => handleRegenerate(rating)}
                        disabled={generatingDraft}
                      >
                        {generatingDraft ? 'Regenerating...' : '🔄 Re-write'}
                      </button>
                    </div>
                  </div>

                  {/* Review Length & Style Selector Pills */}
                  <div className="review-length-selector-wrap">
                    <div className="length-selector-header">
                      <span className="length-selector-label">
                        <span>📏</span> Length & Style:
                      </span>
                      <span className="length-selector-hint">
                        {lengthStyle === 'short' && '⚡ 1–2 crisp, punchy sentences'}
                        {lengthStyle === 'medium' && '⚖️ 2–3 balanced sentences'}
                        {lengthStyle === 'detailed' && '📝 3–4 detailed sentences'}
                        {lengthStyle === 'auto' && '🎲 Fresh variation on every click'}
                      </span>
                    </div>
                    <div className="review-length-pills" role="radiogroup" aria-label="Review length preference">
                      <button
                        type="button"
                        className={`review-length-pill ${lengthStyle === 'short' ? 'active' : ''}`}
                        onClick={() => handleSelectLengthStyle('short')}
                        disabled={generatingDraft}
                        aria-pressed={lengthStyle === 'short'}
                      >
                        <span>⚡ Short</span>
                        <span className="pill-sub">1–2 lines</span>
                      </button>
                      <button
                        type="button"
                        className={`review-length-pill ${lengthStyle === 'medium' ? 'active' : ''}`}
                        onClick={() => handleSelectLengthStyle('medium')}
                        disabled={generatingDraft}
                        aria-pressed={lengthStyle === 'medium'}
                      >
                        <span>⚖️ Medium</span>
                        <span className="pill-sub">2–3 lines</span>
                      </button>
                      <button
                        type="button"
                        className={`review-length-pill ${lengthStyle === 'detailed' ? 'active' : ''}`}
                        onClick={() => handleSelectLengthStyle('detailed')}
                        disabled={generatingDraft}
                        aria-pressed={lengthStyle === 'detailed'}
                      >
                        <span>📝 Detailed</span>
                        <span className="pill-sub">3–4 lines</span>
                      </button>
                      <button
                        type="button"
                        className={`review-length-pill ${lengthStyle === 'auto' ? 'active' : ''}`}
                        onClick={() => handleSelectLengthStyle('auto')}
                        disabled={generatingDraft}
                        aria-pressed={lengthStyle === 'auto'}
                      >
                        <span>🎲 Any</span>
                        <span className="pill-sub">Dynamic</span>
                      </button>
                    </div>
                  </div>

                  <textarea
                    id="draft-review-text"
                    rows="6"
                    className="form-textarea draft-textarea"
                    value={draftText}
                    onChange={(e) => setDraftText(e.target.value)}
                    placeholder="Your generated review will appear here..."
                    disabled={generatingDraft}
                  />
                </div>

                {/* Post to Google Button or Save Review Button if link missing */}
                <div className="step-actions-vertical">
                  {(business?.google_review_link || business?.googleReviewLink || business?.google_review_url || business?.googleReviewUrl || '').trim() ? (
                    <>
                      <button
                        type="button"
                        className="btn-google-post btn-block"
                        onClick={handlePostToGoogle}
                        disabled={postingReview || !draftText.trim()}
                      >
                        <span className="google-icon-wrapper">
                          <svg viewBox="0 0 24 24" width="20" height="20">
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
                        </span>
                        {postingReview ? 'Opening Google...' : 'Post to Google Reviews'}
                      </button>

                      <div className="google-paste-hint-box">
                        <span className="hint-icon">💡</span>
                        <p className="hint-text">
                          <strong>Easy 1-Click:</strong> Clicking above auto-copies this text and opens Google. Just <strong>Paste (Ctrl+V / Long-press Paste)</strong> into Google and tap Post!
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        className="btn-primary btn-block btn-lg"
                        onClick={handlePostToGoogle}
                        disabled={postingReview || !draftText.trim()}
                      >
                        {postingReview ? 'Saving Review...' : '✓ Complete & Save Review'}
                      </button>
                      <div className="google-missing-notice animate-fade-in" style={{ background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a', borderRadius: '10px', padding: '10px 14px', fontSize: '0.84rem', marginTop: '10px', textAlign: 'center' }}>
                        ℹ️ This business hasn't set up its Google link yet. Your review will be saved directly for the business.
                      </div>
                    </>
                  )}

                  <div className="sub-actions-row">
                    <button
                      type="button"
                      className="btn-secondary-sm"
                      onClick={() => setCurrentStep(2)}
                    >
                      ← Edit Notes
                    </button>
                    <button
                      type="button"
                      className="btn-secondary-sm"
                      onClick={() => handleRegenerate(rating)}
                      disabled={generatingDraft}
                    >
                      {generatingDraft ? (
                        <span className="btn-inline-loader">
                          <span className="spinner spinner-xs"></span> Regenerating...
                        </span>
                      ) : (
                        '🔄 Regenerate'
                      )}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* STEP 4: Success / Confirmation State */}
        {currentStep === 4 && (
          <div className="step-content step-4 animate-fade-in text-center">
            {rating <= 3 && !bypassShieldToGoogle && (openedWhatsApp || privateFeedbackSubmitted) ? (
              /* Shield Confirmation */
              <div className="shield-success-card animate-fade-in">
                <div className="celebration-circle shield-circle">🛡️</div>
                <h2 className="success-heading">Message Sent to Owner</h2>
                <p className="success-subtext">
                  Thank you for letting us know directly. The owner of <strong>{business?.name}</strong> has received your feedback and will connect with you to resolve your experience.
                </p>

                <div className="shield-success-details-card">
                  <div className="shield-success-row">
                    <span>Business:</span>
                    <strong>{business?.name}</strong>
                  </div>
                  <div className="shield-success-row">
                    <span>Owner WhatsApp:</span>
                    <strong style={{ color: '#16a34a' }}>+{normalizeWhatsAppNumber(business?.phone)}</strong>
                  </div>
                  <div className="shield-success-row">
                    <span>Rating Shared:</span>
                    <div style={{ display: 'inline-flex' }}>
                      <StarRating rating={rating} readOnly size="sm" />
                    </div>
                  </div>
                </div>

                <div className="step-4-quick-actions">
                  <a
                    href={`https://wa.me/${normalizeWhatsAppNumber(business?.phone)}?text=${encodeURIComponent(
                      `Hi ${business?.name || 'Owner'}, following up regarding my feedback for "${getEffectiveService()}".`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-whatsapp-direct"
                    style={{ textDecoration: 'none' }}
                  >
                    <span>💬 Open WhatsApp with Owner</span>
                  </a>
                  <button
                    type="button"
                    className="btn-secondary btn-block"
                    onClick={() => {
                      setCurrentStep(1);
                      setWhatStoodOut('');
                      setWhatCouldImprove('');
                      setDraftText('');
                      setRating(5);
                      setBypassShieldToGoogle(false);
                      setPrivateFeedbackSubmitted(false);
                      setOpenedWhatsApp(false);
                    }}
                  >
                    Done / Write Another Review
                  </button>
                </div>
              </div>
            ) : (
              /* 4-5 Star or Google Direct Celebration */
              (() => {
                const finalLink = (business?.google_review_link || business?.googleReviewLink || business?.google_review_url || business?.googleReviewUrl || '').trim();
                return finalLink ? (
                  <div>
                    <div className="celebration-circle">🎉</div>
                    <h2 className="success-heading">Review Ready &amp; Copied!</h2>
                    <p className="success-subtext">
                      We opened Google Reviews in a new tab for <strong>{business?.name}</strong>.
                    </p>

                    {/* 3-Step Visual Action Card */}
                    <div className="google-paste-guide-card">
                      <h4 className="guide-card-title">⚡ 3-Second Finish on Google:</h4>
                      <div className="guide-steps-row">
                        <div className="guide-mini-step">
                          <div className="guide-step-number">1</div>
                          <div className="guide-step-body">
                            <strong>Select {rating} Stars</strong>
                            <div className="mini-stars-display">
                              <StarRating rating={rating} readOnly size="sm" />
                            </div>
                          </div>
                        </div>

                        <div className="guide-step-arrow">→</div>

                        <div className="guide-mini-step">
                          <div className="guide-step-number">2</div>
                          <div className="guide-step-body">
                            <strong>Tap &quot;Paste&quot;</strong>
                            <span>Text is in your clipboard</span>
                          </div>
                        </div>

                        <div className="guide-step-arrow">→</div>

                        <div className="guide-mini-step">
                          <div className="guide-step-number">3</div>
                          <div className="guide-step-body">
                            <strong>Click &quot;Post&quot;</strong>
                            <span>Done in 1 click!</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Review Quote Box */}
                    <div className="review-preview-summary card-flat">
                      <div className="review-copied-badge">✓ Copied to Clipboard</div>
                      <p className="review-summary-quote">&quot;{draftText}&quot;</p>
                    </div>

                    <div className="step-4-quick-actions">
                      <a
                        href={finalLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-primary btn-block btn-lg"
                        style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: '#ffffff' }}
                      >
                        🚀 Open Google Review Page
                      </a>
                      <button
                        type="button"
                        className={`btn-secondary btn-block ${copied ? 'btn-copied' : ''}`}
                        onClick={handleCopyText}
                      >
                        {copied ? '✓ Copied Again to Clipboard!' : '📋 Re-copy Review Text'}
                      </button>
                    </div>

                    <div className="mt-4">
                      <button
                        type="button"
                        className="btn-link"
                        onClick={() => {
                          setCurrentStep(1);
                          setWhatStoodOut('');
                          setWhatCouldImprove('');
                          setDraftText('');
                          setRating(5);
                          setBypassShieldToGoogle(false);
                          setPrivateFeedbackSubmitted(false);
                          setOpenedWhatsApp(false);
                        }}
                      >
                        Write Another Review
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="celebration-circle">✓</div>
                    <h2 className="success-heading">Review Saved!</h2>
                    <div style={{ background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a', borderRadius: '12px', padding: '14px 18px', margin: '16px auto', maxWidth: '420px', fontSize: '0.92rem', fontWeight: 600 }}>
                      ℹ️ This business hasn't set up its Google link yet.
                    </div>

                    {/* Review Quote Box */}
                    <div className="review-preview-summary card-flat">
                      <div className="review-copied-badge">✓ Copied to Clipboard</div>
                      <p className="review-summary-quote">&quot;{draftText}&quot;</p>
                    </div>

                    <div className="step-4-quick-actions">
                      <button
                        type="button"
                        className={`btn-secondary btn-block ${copied ? 'btn-copied' : ''}`}
                        onClick={handleCopyText}
                      >
                        {copied ? '✓ Copied Again to Clipboard!' : '📋 Re-copy Review Text'}
                      </button>
                    </div>

                    <div className="mt-4">
                      <button
                        type="button"
                        className="btn-link"
                        onClick={() => {
                          setCurrentStep(1);
                          setWhatStoodOut('');
                          setWhatCouldImprove('');
                          setDraftText('');
                          setRating(5);
                          setBypassShieldToGoogle(false);
                          setPrivateFeedbackSubmitted(false);
                          setOpenedWhatsApp(false);
                        }}
                      >
                        Write Another Review
                      </button>
                    </div>
                  </div>
                );
              })()
            )}
          </div>
        )}
      </div>
    </div>
  );
}
