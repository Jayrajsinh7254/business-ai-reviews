import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import TagInput from '../components/TagInput';
import QRCodeDisplay from '../components/QRCodeDisplay';
import StandeeDesigner from '../components/StandeeDesigner';
import WhatsAppInviteModal from '../components/WhatsAppInviteModal';
import { useAuth } from '../context/AuthContext';
import { api, isValidGoogleReviewLink } from '../api/client';
import { PLANS, PLAN_LIST } from '../lib/plans';

import { CATEGORIES, CATEGORY_SUGGESTIONS, getCategoryLabel } from '../lib/categories';

export default function SignupPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const catParam = searchParams.get('cat');
  const planParam = searchParams.get('plan') || 'starter';
  const intervalParam = searchParams.get('interval') || 'monthly';

  const { signup } = useAuth();

  const initialCat = (() => {
    if (!catParam) return 'it_marketing';
    const clean = catParam.toLowerCase();
    if (clean === 'healthcare') return 'clinic';
    if (clean === 'homeservices') return 'homeservices';
    if (clean === 'tech' || clean === 'marketing' || clean === 'it') return 'it_marketing';
    if (CATEGORIES.some((c) => c.value === clean)) return clean;
    return 'it_marketing';
  })();

  // Multi-step Wizard State
  const [step, setStep] = useState(1); // 1: Account & Biz, 2: Services & Google, 3: Plan & Trial

  // Form Fields
  const [ownerName, setOwnerName] = useState('');
  const [bizName, setBizName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [category, setCategory] = useState(initialCat);
  const [customCategory, setCustomCategory] = useState('');
  const [selectedPlan, setSelectedPlan] = useState(planParam);
  const [billingInterval, setBillingInterval] = useState(intervalParam);
  const [googleReviewLink, setGoogleReviewLink] = useState('');
  const [googleLinkTouched, setGoogleLinkTouched] = useState(false);
  const [services, setServices] = useState(CATEGORY_SUGGESTIONS[initialCat]?.slice(0, 3) || ['Web Development', 'SEO Optimization']);
  const [agreeTerms, setAgreeTerms] = useState(true);

  const isGoogleLinkValid = isValidGoogleReviewLink(googleReviewLink);
  const googleLinkError = googleLinkTouched && googleReviewLink.trim() && !isGoogleLinkValid
    ? "Link must start with https:// and match one of Google's formats (g.page/r/, search.google.com/local/writereview, google.com/maps, maps.app.goo.gl, goo.gl/maps, or share.google)."
    : (googleLinkTouched && !googleReviewLink.trim() ? "Google Review Link is required." : "");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [createdBusiness, setCreatedBusiness] = useState(null);

  useEffect(() => {
    if (catParam) {
      const clean = catParam.toLowerCase();
      const mapped = clean === 'healthcare' ? 'clinic' : clean === 'homeservices' ? 'other' : clean;
      if (CATEGORIES.some((c) => c.value === mapped)) {
        setCategory(mapped);
        setServices(CATEGORY_SUGGESTIONS[mapped]?.slice(0, 3) || []);
      }
    }
  }, [catParam]);

  const handleAddSuggestion = (suggestion) => {
    if (!services.some((s) => s.toLowerCase() === suggestion.toLowerCase())) {
      setServices([...services, suggestion]);
    }
  };

  const handleNextStep = (e) => {
    e?.preventDefault();
    setError('');

    if (step === 1) {
      if (!bizName.trim()) {
        setError('Please enter your business name.');
        return;
      }
      if (!phone.trim() || phone.replace(/\D/g, '').length < 10) {
        setError('Please enter a valid 10-digit WhatsApp / phone number.');
        return;
      }
      if (!email.trim() || !email.includes('@')) {
        setError('Please enter a valid work email address.');
        return;
      }
      if (!password || password.length < 8) {
        setError('Password must be at least 8 characters long.');
        return;
      }
      if (!/[A-Z]/.test(password)) {
        setError('Password must contain at least one uppercase letter.');
        return;
      }
      if (!/[0-9!@#$%^&*(),.?":{}|<>]/.test(password)) {
        setError('Password must contain at least one number or special character.');
        return;
      }
      if (category === 'other' && !customCategory.trim()) {
        setError('Please specify your industry or business type.');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      setGoogleLinkTouched(true);
      if (services.length === 0) {
        setError('Please add at least 1 service your business offers.');
        return;
      }
      if (!googleReviewLink.trim()) {
        setError("Please enter the business's Google Review Link.");
        return;
      }
      if (!isValidGoogleReviewLink(googleReviewLink)) {
        setError("Invalid Google Review Link. It must start with https:// and match one of Google's link patterns.");
        return;
      }
      setStep(3);
    }
  };

  const handleSubmitRegistration = async (e) => {
    e?.preventDefault();
    if (!agreeTerms) {
      setError('Please accept the Terms of Service & Privacy Policy.');
      return;
    }

    const cleanGoogleLink = googleReviewLink.trim();
    if (!cleanGoogleLink || !isValidGoogleReviewLink(cleanGoogleLink)) {
      setError('A valid Google Review Link is required to register.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const effectiveCategory = category === 'other'
        ? (customCategory.trim() || 'Custom Business')
        : (CATEGORIES.find((c) => c.value === category)?.label || category);

      // 1. Register business & user
      const result = await signup({
        name: bizName.trim(),
        ownerName: ownerName.trim() || bizName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        password,
        category: effectiveCategory,
        services,
        planId: selectedPlan,
        billingInterval,
        google_review_link: cleanGoogleLink,
        googleReviewLink: cleanGoogleLink,
        googleReviewUrl: cleanGoogleLink,
      });

      const biz = result.business || result;

      // 2. Submit lead immediately to Admin Inbox for instant WhatsApp outreach
      try {
        await api.submitLead({
          ownerName: ownerName.trim() || bizName.trim(),
          businessName: bizName.trim(),
          businessType: effectiveCategory,
          services,
          locations: '1 location',
          email: email.trim(),
          phone: phone.trim(),
          googleProfileUrl: cleanGoogleLink,
          message: `New signup from registration page. Selected Plan: ${selectedPlan.toUpperCase()} (7-day trial). Configured Google Review Link: ${cleanGoogleLink}`,
        });
      } catch (leadErr) {
        console.warn('Lead capture notice:', leadErr);
      }

      setCreatedBusiness(biz);
    } catch (err) {
      console.error('Failed to register business:', err);
      setError(err.message || 'Failed to complete registration. Please try again.');
    } finally {
      setLoading(false);
    }
  };


  const selectedPlanObj = PLANS[selectedPlan.toUpperCase()] || PLANS.PRO;

  return (
    <div className="page-container signup-page-wrapper">
      <div className="section-container">
        {/* Header */}
        <div className="page-header text-center auth-header-wrap">
          <div className="signup-badge animate-fade-in">
            <span>🎁 7-Day Free Trial • Instant QR Generation</span>
          </div>
          <h1 className="page-title">
            Register Your Business &amp; <br />
            <span className="gradient-text">Automate 5-Star Google Reviews</span>
          </h1>
          <p className="page-subtitle">
            Zero credit or debit card required. Set up your AI review assistant and print table standees in 2 minutes.
          </p>
        </div>

        {!createdBusiness ? (
          <div className="signup-wizard-container">
            {/* Step Progress Navigation Bar */}
            <div className="wizard-stepper">
              <div className={`step-item ${step >= 1 ? 'active' : ''} ${step > 1 ? 'completed' : ''}`}>
                <div className="step-circle">{step > 1 ? '✓' : '1'}</div>
                <span className="step-label">Account &amp; Business</span>
              </div>
              <div className="step-connector" />
              <div className={`step-item ${step >= 2 ? 'active' : ''} ${step > 2 ? 'completed' : ''}`}>
                <div className="step-circle">{step > 2 ? '✓' : '2'}</div>
                <span className="step-label">Services &amp; Google</span>
              </div>
              <div className="step-connector" />
              <div className={`step-item ${step >= 3 ? 'active' : ''}`}>
                <div className="step-circle">3</div>
                <span className="step-label">Plan &amp; Trial</span>
              </div>
            </div>

            <div className="card signup-card">
              {error && <div className="alert-banner alert-error animate-fade-in">{error}</div>}

              {/* STEP 1: Account & Business Profile */}
              {step === 1 && (
                <div className="wizard-step-content animate-fade-in">
                  <div className="step-content-header">
                    <h2 className="step-title">Step 1: Your Business Profile</h2>
                    <p className="step-desc">Enter your business information to customize your AI assistant.</p>
                  </div>


                  <form onSubmit={handleNextStep} className="form-layout">
                    <div className="form-grid-2">
                      <div className="form-group">
                        <label className="form-label">
                          Business Name <span className="required-star">*</span>
                        </label>
                        <input
                          type="text"
                          className="form-input"
                          value={bizName}
                          onChange={(e) => setBizName(e.target.value)}
                          placeholder="e.g. Apex Auto Care"
                          required
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Owner / Manager Name</label>
                        <input
                          type="text"
                          className="form-input"
                          value={ownerName}
                          onChange={(e) => setOwnerName(e.target.value)}
                          placeholder="e.g. Rahul Sharma"
                        />
                      </div>
                    </div>

                    <div className="form-grid-2">
                      <div className="form-group">
                        <label className="form-label">
                          Work Email <span className="required-star">*</span>
                        </label>
                        <input
                          type="email"
                          className="form-input"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="owner@yourbusiness.com"
                          required
                          autoComplete="email"
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">
                          WhatsApp / Phone Number <span className="required-star">*</span>
                        </label>
                        <input
                          type="tel"
                          className="form-input"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="e.g. +91 98765 43210"
                          required
                          autoComplete="tel"
                        />
                        <span className="field-hint" style={{ fontSize: '0.72rem', color: '#64748b', display: 'block', marginTop: '3px' }}>
                          We will send your custom QR Standee directly to this WhatsApp.
                        </span>
                      </div>
                    </div>

                    <div className="form-grid-2">
                      <div className="form-group">
                        <div className="form-label-row">
                          <label className="form-label">
                            Password <span className="required-star">*</span>
                          </label>
                          <button
                            type="button"
                            className="btn-link-sm"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? 'Hide' : 'Show'}
                          </button>
                        </div>
                        <input
                          type={showPassword ? 'text' : 'password'}
                          className="form-input"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Min. 8 chars, 1 uppercase & 1 number"
                          required
                          autoComplete="new-password"
                        />
                        {password && (
                          <div style={{ marginTop: '6px' }}>
                            <div style={{ display: 'flex', gap: '4px', height: '4px' }}>
                              <div style={{ flex: 1, borderRadius: '2px', background: password.length >= 8 ? '#10b981' : '#f59e0b', transition: 'background 0.3s' }} />
                              <div style={{ flex: 1, borderRadius: '2px', background: password.length >= 8 && /[A-Z]/.test(password) ? '#10b981' : 'rgba(148, 163, 184, 0.25)', transition: 'background 0.3s' }} />
                              <div style={{ flex: 1, borderRadius: '2px', background: password.length >= 8 && /[A-Z]/.test(password) && /[0-9!@#$%^&*(),.?":{}|<>]/.test(password) ? '#10b981' : 'rgba(148, 163, 184, 0.25)', transition: 'background 0.3s' }} />
                            </div>
                            <span style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '3px', display: 'block' }}>
                              {password.length < 8 ? 'Requires at least 8 characters' : !/[A-Z]/.test(password) ? 'Needs an uppercase letter' : !/[0-9!@#$%^&*(),.?":{}|<>]/.test(password) ? 'Needs at least 1 number or symbol' : '✓ Strong password'}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="form-group">
                        <label className="form-label" htmlFor="business-category-select">
                          Business Industry / Category <span className="required-star">*</span>
                        </label>
                        <div className="select-wrapper">
                          <select
                            id="business-category-select"
                            className="form-select"
                            value={category}
                            onChange={(e) => {
                              const newCat = e.target.value;
                              setCategory(newCat);
                              setServices(CATEGORY_SUGGESTIONS[newCat]?.slice(0, 3) || ['Consultation']);
                            }}
                          >
                            {CATEGORIES.map((cat) => (
                              <option key={cat.value} value={cat.value}>
                                {cat.icon} {cat.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>

                    {category === 'other' && (
                      <div className="form-group custom-category-field animate-fade-in" style={{ marginTop: '0.75rem' }}>
                        <label className="form-label" htmlFor="custom-industry-input">
                          Specify Your Industry / Business Type <span className="required-star">*</span>
                        </label>
                        <input
                          id="custom-industry-input"
                          type="text"
                          className="form-input"
                          value={customCategory}
                          onChange={(e) => setCustomCategory(e.target.value)}
                          placeholder="e.g. IT & Digital Marketing, Photography Studio, Pet Grooming, Solar Energy, Logistics..."
                          required
                          autoFocus
                        />
                        <span className="field-hint">
                          Our AI review generator will craft authentic, high-converting customer reviews tailored specifically to your exact industry.
                        </span>
                      </div>
                    )}

                    <div className="form-actions">
                      <button type="submit" className="btn-primary btn-block btn-lg">
                        Continue to Step 2: Services &amp; Google Link &rarr;
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* STEP 2: Services & Google Review Setup */}
              {step === 2 && (
                <div className="wizard-step-content animate-fade-in">
                  <div className="step-content-header">
                    <h2 className="step-title">Step 2: Services &amp; Google Review Hub</h2>
                    <p className="step-desc">
                      Our AI will draft positive reviews specifically referencing these services.
                    </p>
                  </div>

                  <form onSubmit={handleNextStep} className="form-layout">
                    {/* Services Tag Input */}
                    <div className="form-group">
                      <div className="form-label-row">
                        <label className="form-label">
                          Services Offered <span className="required-star">*</span>
                        </label>
                        <span className="form-label-hint">
                          {services.length} selected (at least 1 required)
                        </span>
                      </div>

                      <TagInput
                        tags={services}
                        onChange={setServices}
                        placeholder="Type service (e.g. AC Repair) and press Enter"
                      />

                      {CATEGORY_SUGGESTIONS[category] && (
                        <div className="suggestions-section">
                          <span className="suggestions-label">Click to add popular services:</span>
                          <div className="suggestions-list">
                            {CATEGORY_SUGGESTIONS[category].map((item) => (
                              <button
                                key={item}
                                type="button"
                                className="suggestion-pill"
                                onClick={() => handleAddSuggestion(item)}
                              >
                                + {item}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Google Review Link (Required - Placed below services) */}
                    <div className="form-group google-review-link-field">
                      <div className="form-label-row">
                        <label className="form-label" htmlFor="google-review-link-input">
                          Google Review Link <span className="required-star">*</span>
                        </label>
                        {googleReviewLink && isGoogleLinkValid && (
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#16a34a' }}>
                            ✓ Valid Google Review Link
                          </span>
                        )}
                      </div>
                      <input
                        id="google-review-link-input"
                        type="url"
                        className={`form-input ${googleLinkError ? 'input-error' : ''}`}
                        value={googleReviewLink}
                        onChange={(e) => {
                          setGoogleReviewLink(e.target.value);
                          if (!googleLinkTouched) setGoogleLinkTouched(true);
                        }}
                        onBlur={() => setGoogleLinkTouched(true)}
                        placeholder="Paste the business's Google review link"
                        required
                      />
                      <span className="field-hint" style={{ fontSize: '0.78rem', color: '#64748b', display: 'block', marginTop: '4px' }}>
                        Find it in Google Business Profile &rarr; Get more reviews &rarr; Share review form
                      </span>
                      {googleLinkError && (
                        <div className="field-error-msg animate-fade-in" style={{ color: '#dc2626', fontSize: '0.78rem', fontWeight: 600, marginTop: '4px' }}>
                          ⚠️ {googleLinkError}
                        </div>
                      )}
                    </div>

                    <div className="form-grid-2 form-actions-wizard">
                      <button
                        type="button"
                        className="btn-outline btn-lg"
                        onClick={() => setStep(1)}
                      >
                        &larr; Back to Step 1
                      </button>
                      <button
                        type="submit"
                        className="btn-primary btn-lg"
                        disabled={services.length === 0 || !isGoogleLinkValid}
                      >
                        Continue to Step 3: Choose Plan &rarr;
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* STEP 3: Plan Selection & 7-Day Free Trial */}
              {step === 3 && (
                <div className="wizard-step-content animate-fade-in">
                  <div className="step-content-header">
                    <h2 className="step-title">Step 3: Select Plan &amp; Start 7-Day Trial</h2>
                    <p className="step-desc">
                      Enjoy 7 days of full unrestricted access. No credit/debit card charged today.
                    </p>
                  </div>

                  {/* Billing Toggle */}
                  <div className="signup-interval-toggle-box">
                    <div className="pricing-toggle-pill">
                      <button
                        type="button"
                        className={`pricing-toggle-btn ${billingInterval === 'monthly' ? 'active' : ''}`}
                        onClick={() => setBillingInterval('monthly')}
                      >
                        Monthly Billing
                      </button>
                      <button
                        type="button"
                        className={`pricing-toggle-btn ${billingInterval === 'annual' ? 'active' : ''}`}
                        onClick={() => setBillingInterval('annual')}
                      >
                        Annual Billing <span className="save-badge">Save up to 60% + Free Standee 🪔</span>
                      </button>
                    </div>
                  </div>

                  {/* Tier Picker Cards */}
                  <div className="signup-plan-cards-grid">
                    {PLAN_LIST.map((plan) => {
                      const isSelected = selectedPlan === plan.id;
                      const price = billingInterval === 'annual' ? plan.annualPrice : plan.monthlyPrice;

                      return (
                        <div
                          key={plan.id}
                          className={`signup-tier-card ${isSelected ? 'selected' : ''}`}
                          onClick={() => setSelectedPlan(plan.id)}
                        >
                          {plan.badge && <span className="signup-popular-pill">{plan.badge}</span>}
                          <div className="signup-tier-radio">
                            <div className={`radio-dot ${isSelected ? 'checked' : ''}`} />
                          </div>
                          <div className="signup-tier-info">
                            <h4>{plan.name}</h4>
                            <div className="signup-tier-price">
                              {plan.originalMonthlyPrice && (
                                <span style={{ textDecoration: 'line-through', color: 'var(--text-muted, #94a3b8)', fontSize: '0.85rem', marginRight: '6px' }}>
                                  ₹{plan.originalMonthlyPrice}
                                </span>
                              )}
                              <strong>₹{price.toLocaleString('en-IN')}</strong> / mo
                            </div>
                            <span style={{ display: 'inline-block', fontSize: '0.72rem', fontWeight: 700, color: billingInterval === 'annual' ? '#15803d' : '#ea580c', marginTop: '2px' }}>
                              🪔 {billingInterval === 'annual' ? plan.annualSavingsText : plan.diwaliDiscountText}
                            </span>
                            <span className="signup-tier-tagline">{plan.tagline}</span>
                            {billingInterval === 'annual' && plan.annualPerk && (
                              <span style={{ display: 'block', fontSize: '0.72rem', color: '#059669', fontWeight: 600, marginTop: '4px' }}>
                                {plan.annualPerk}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Trial Highlights Box */}
                  <div className="trial-summary-banner">
                    <div className="trial-icon-col">🎁</div>
                    <div className="trial-info-col">
                      <strong>7-Day Free Trial on {selectedPlanObj.name}</strong>
                      <p>
                        Full access to unlimited AI reviews, WhatsApp 1-click sharing &amp; high-res QR standees.
                        Zero upfront payment required.
                      </p>
                    </div>
                  </div>

                  {/* Terms & Conditions Checkbox */}
                  <div className="signup-terms-check">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={agreeTerms}
                        onChange={(e) => setAgreeTerms(e.target.checked)}
                      />
                      <span>
                        I agree to the{' '}
                        <Link to="/terms" target="_blank">
                          Terms of Service
                        </Link>
                        ,{' '}
                        <Link to="/privacy" target="_blank">
                          Privacy Policy
                        </Link>
                        , and{' '}
                        <Link to="/google-guidelines" target="_blank">
                          Google Guidelines
                        </Link>
                        .
                      </span>
                    </label>
                  </div>

                  <div className="form-grid-2 form-actions-wizard">
                    <button
                      type="button"
                      className="btn-outline btn-lg"
                      onClick={() => setStep(2)}
                      disabled={loading}
                    >
                      &larr; Back to Step 2
                    </button>
                    <button
                      type="button"
                      className="btn-primary btn-lg"
                      onClick={handleSubmitRegistration}
                      disabled={
                        loading ||
                        !agreeTerms ||
                        !bizName.trim() ||
                        !category ||
                        services.length === 0 ||
                        !isGoogleLinkValid
                      }
                    >
                      {loading ? (
                        <span className="btn-loading-state">
                          <span className="spinner" /> Generating QR &amp; Account...
                        </span>
                      ) : (
                        `Start Free ${selectedPlanObj.name} Trial &rarr;`
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Footer Login Link */}
              <div className="auth-footer-links text-center">
                <p>
                  Already have an account?{' '}
                  <Link to="/login" className="auth-action-link font-semibold">
                    Sign in to your dashboard &rarr;
                  </Link>
                </p>
              </div>
            </div>
          </div>
        ) : (
          /* Post-Registration: Dedicated Shop-Owner Friendly Confirmation */
          <div className="success-onboarding-container animate-fade-in" style={{ maxWidth: '640px', margin: '0 auto' }}>
            <div className="card text-center" style={{ padding: '2.5rem 2rem', borderRadius: '24px', boxShadow: '0 20px 40px -10px rgba(0,0,0,0.1)' }}>
              <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: '#ecfdf5', color: '#059669', fontSize: '2.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem', border: '2px solid #a7f3d0' }}>
                ✓
              </div>

              <span style={{ background: '#e0e7ff', color: '#4338ca', fontSize: '0.8rem', fontWeight: 700, padding: '4px 14px', borderRadius: '999px', display: 'inline-block', marginBottom: '0.85rem' }}>
                🎉 SETUP REQUEST RECEIVED
              </span>

              <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#111827', margin: '0 0 0.5rem' }}>
                Your Standee Kit is Being Prepared!
              </h2>

              <p style={{ color: '#4b5563', fontSize: '0.98rem', lineHeight: '1.6', margin: '0 0 1.5rem' }}>
                Thank you, <strong>{createdBusiness.name || bizName}</strong>! Our design specialists have received your request and are creating your custom <strong>Google Review QR Standee</strong> with brand integration.
              </p>

              {/* Business Overview Box */}
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '1.25rem', textAlign: 'left', margin: '0 0 1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid #edf2f7' }}>
                  <span style={{ color: '#64748b', fontSize: '0.86rem' }}>Business Name:</span>
                  <strong style={{ color: '#1e293b', fontSize: '0.88rem' }}>{createdBusiness.name || bizName}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid #edf2f7' }}>
                  <span style={{ color: '#64748b', fontSize: '0.86rem' }}>WhatsApp Contact:</span>
                  <strong style={{ color: '#059669', fontSize: '0.88rem' }}>{phone || 'Submitted'}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid #edf2f7' }}>
                  <span style={{ color: '#64748b', fontSize: '0.86rem' }}>Industry:</span>
                  <strong style={{ color: '#1e293b', fontSize: '0.88rem', textTransform: 'capitalize' }}>
                    {createdBusiness.category || category}
                  </strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0' }}>
                  <span style={{ color: '#64748b', fontSize: '0.86rem' }}>Kit Status:</span>
                  <span style={{ background: '#fef3c7', color: '#92400e', fontSize: '0.78rem', fontWeight: 700, padding: '2px 8px', borderRadius: '4px' }}>
                    ⏳ Under Preparation • Admin will WhatsApp you
                  </span>
                </div>
              </div>

              {/* Saved Google Review Link Test Card */}
              <div className="google-link-summary-card" style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '16px', padding: '1.25rem', textAlign: 'left', margin: '0 0 1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '1.2rem' }}>🔗</span>
                    <strong style={{ color: '#0f172a', fontSize: '0.92rem' }}>Configured Google Review Link</strong>
                  </div>
                  <span style={{ background: '#dcfce7', color: '#15803d', fontSize: '0.74rem', fontWeight: 700, padding: '2px 8px', borderRadius: '999px' }}>
                    ✓ Forwarding Ready
                  </span>
                </div>
                <p style={{ margin: '0 0 8px', fontSize: '0.8rem', color: '#64748b' }}>
                  Customers completing your review flow will be forwarded directly to this Google destination:
                </p>
                <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '8px 12px', fontSize: '0.8rem', wordBreak: 'break-all', fontFamily: 'monospace', color: '#1e293b', marginBottom: '10px' }}>
                  {createdBusiness.google_review_link || createdBusiness.googleReviewLink || createdBusiness.googleReviewUrl || googleReviewLink.trim()}
                </div>
                <button
                  type="button"
                  className="btn-outline btn-sm btn-block"
                  onClick={() => {
                    const linkToTest = createdBusiness.google_review_link || createdBusiness.googleReviewLink || createdBusiness.googleReviewUrl || googleReviewLink.trim();
                    window.open(linkToTest, '_blank', 'noopener,noreferrer');
                  }}
                  style={{ borderColor: '#4f46e5', color: '#4f46e5', fontWeight: 600, padding: '8px' }}
                >
                  ↗ Open Google link (Test before printing)
                </button>
              </div>

              {/* Customer Flow QR Code Display */}
              <div style={{ margin: '0 0 1.5rem', textAlign: 'center' }}>
                <QRCodeDisplay
                  url={`${window.location.origin}/review/${createdBusiness.id}`}
                  title="Customer Review Flow QR Code"
                  subtitle={`Directs customer smartphones to ${window.location.origin}/review/${createdBusiness.id}`}
                />
              </div>

              {/* Reassuring Hands-free Note */}
              <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '14px', padding: '1rem', textAlign: 'left', marginBottom: '1.75rem', display: 'flex', gap: '10px' }}>
                <span style={{ fontSize: '1.4rem' }}>💬</span>
                <div style={{ fontSize: '0.86rem', color: '#065f46', lineHeight: '1.5' }}>
                  <strong>Zero complex setup needed:</strong><br />
                  Our team will contact you directly on WhatsApp at <strong>{phone || 'your phone'}</strong> with your ready-to-print acrylic Standee design. No confusing dashboards to manage!
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(
                    `Hi Admin, I just registered my business "${createdBusiness.name || bizName}" (Phone: ${phone}). I'd like to fast-track my custom Google Review QR Standee design!`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary btn-block btn-lg"
                  style={{ background: '#16a34a', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                >
                  <span>💬</span> Fast-Track with Admin on WhatsApp
                </a>

                <Link
                  to={`/review/${createdBusiness.id}?name=${encodeURIComponent(createdBusiness.name || bizName)}&cat=${encodeURIComponent(createdBusiness.category || category)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-outline btn-block"
                  style={{ textDecoration: 'none' }}
                >
                  📱 Preview Your Live Customer Review Flow ↗
                </Link>
              </div>

              <div style={{ marginTop: '1.5rem', borderTop: '1px solid #f1f5f9', paddingTop: '1rem' }}>
                <Link
                  to={`/dashboard/${createdBusiness.id}`}
                  style={{ color: '#94a3b8', fontSize: '0.78rem', textDecoration: 'none' }}
                >
                  Advanced: Sign in to business dashboard &rarr;
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
