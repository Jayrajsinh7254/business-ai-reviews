import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import TagInput from '../components/TagInput';
import QRCodeDisplay from '../components/QRCodeDisplay';
import StandeeDesigner from '../components/StandeeDesigner';
import WhatsAppInviteModal from '../components/WhatsAppInviteModal';
import { useAuth } from '../context/AuthContext';
import { PLANS, PLAN_LIST } from '../lib/plans';

const CATEGORIES = [
  { value: 'automobile', label: 'Automobile (Repair, Detailing, Dealership)' },
  { value: 'restaurant', label: 'Restaurant, Cafe & Dining' },
  { value: 'salon', label: 'Salon, Spa & Beauty' },
  { value: 'clinic', label: 'Clinic, Hospital & Healthcare' },
  { value: 'retail', label: 'Retail Store & Boutique' },
  { value: 'hotel', label: 'Hotel & Hospitality' },
  { value: 'other', label: 'Other Business / Trade Services' },
];

const CATEGORY_SUGGESTIONS = {
  automobile: ['Oil Change', 'Brake Inspection', 'Tire Rotation', 'Engine Diagnostic', 'Detailing & Polish', 'AC Service'],
  restaurant: ['Dine-in Dinner', 'Weekend Brunch', 'Takeout & Delivery', 'Craft Cocktails', 'Catering Service', 'Private Events'],
  salon: ['Haircut & Style', 'Color & Highlights', 'Hydra Facial Glow', 'Manicure / Pedicure', 'Aroma Massage'],
  clinic: ['General Consultation', 'Dental Cleaning', 'Eye Exam', 'Physiotherapy', 'Dermatology Checkup'],
  retail: ['In-Store Shopping', 'Custom Fitting', 'Gift Packaging', 'Express Curbside Pickup'],
  hotel: ['Overnight Stay', 'Luxury Suite', 'Room Dining', 'Concierge Service', 'Swimming Pool & Spa'],
  other: ['Consultation', 'Standard Service', 'Fast Delivery', 'Custom Project Solution'],
};

export default function SignupPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const catParam = searchParams.get('cat');
  const planParam = searchParams.get('plan') || 'pro';
  const intervalParam = searchParams.get('interval') || 'monthly';

  const { signup } = useAuth();

  const initialCat = (() => {
    if (!catParam) return 'automobile';
    const clean = catParam.toLowerCase();
    if (clean === 'healthcare') return 'clinic';
    if (clean === 'homeservices') return 'other';
    if (CATEGORIES.some((c) => c.value === clean)) return clean;
    return 'automobile';
  })();

  // Multi-step Wizard State
  const [step, setStep] = useState(1); // 1: Account & Biz, 2: Services & Google, 3: Plan & Trial

  // Form Fields
  const [ownerName, setOwnerName] = useState('');
  const [bizName, setBizName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [category, setCategory] = useState(initialCat);
  const [selectedPlan, setSelectedPlan] = useState(planParam);
  const [billingInterval, setBillingInterval] = useState(intervalParam);
  const [googleReviewUrl, setGoogleReviewUrl] = useState('');
  const [services, setServices] = useState(CATEGORY_SUGGESTIONS[initialCat]?.slice(0, 3) || ['Oil Change', 'Brake Inspection']);
  const [agreeTerms, setAgreeTerms] = useState(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [createdBusiness, setCreatedBusiness] = useState(null);
  const [showStandeeStudio, setShowStandeeStudio] = useState(false);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);

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
      if (!email.trim() || !email.includes('@')) {
        setError('Please enter a valid work email address.');
        return;
      }
      if (!password || password.length < 6) {
        setError('Password must be at least 6 characters.');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (services.length === 0) {
        setError('Please add at least 1 service your business offers.');
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

    setLoading(true);
    setError('');

    try {
      const result = await signup({
        name: bizName.trim(),
        ownerName: ownerName.trim() || bizName.trim(),
        email: email.trim(),
        password,
        category,
        services,
        planId: selectedPlan,
        billingInterval,
        googleReviewUrl: googleReviewUrl.trim(),
      });

      const biz = result.business || result;
      setCreatedBusiness(biz);
    } catch (err) {
      console.error('Failed to register business:', err);
      setError(err.message || 'Failed to complete registration. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleQuickSignup = () => {
    setOwnerName('Marcus Vance');
    setBizName('Apex Auto Care & Diagnostics');
    setEmail('owner@apexauto.com');
    setPassword('securePassword123');
    setCategory('automobile');
    setServices(['Oil Change', 'Brake Inspection', 'Engine Diagnostic']);
    setStep(3);
  };

  const selectedPlanObj = PLANS[selectedPlan.toUpperCase()] || PLANS.PRO;
  const currentPrice = billingInterval === 'annual' ? selectedPlanObj.annualPrice : selectedPlanObj.monthlyPrice;

  return (
    <div className="page-container signup-page-wrapper">
      <div className="section-container">
        {/* Header */}
        <div className="page-header text-center auth-header-wrap">
          <div className="signup-badge animate-fade-in">
            <span>🎁 14-Day Free Trial • Instant QR Generation</span>
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

                  {/* Google 1-Click Fast Fill */}
                  <button
                    type="button"
                    className="btn-google-auth btn-block"
                    onClick={handleGoogleQuickSignup}
                  >
                    <svg className="google-icon" viewBox="0 0 24 24" width="20" height="20">
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
                    <span>Autofill with Google</span>
                  </button>

                  <div className="auth-divider">
                    <span>or fill details manually</span>
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
                          placeholder="e.g. Marcus Vance"
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
                          placeholder="Min 6 characters"
                          required
                          autoComplete="new-password"
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">
                        Business Category <span className="required-star">*</span>
                      </label>
                      <div className="select-wrapper">
                        <select
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
                              {cat.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

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
                    {/* Google URL */}
                    <div className="form-group">
                      <div className="form-label-row">
                        <label className="form-label">
                          Google Maps / Place Review Link <span className="optional-tag">(Optional)</span>
                        </label>
                      </div>
                      <input
                        type="url"
                        className="form-input"
                        value={googleReviewUrl}
                        onChange={(e) => setGoogleReviewUrl(e.target.value)}
                        placeholder="e.g. https://search.google.com/local/writereview?placeid=..."
                      />
                      <span className="field-hint">
                        Leave blank to automatically use standard Google search for{' '}
                        <strong>{bizName || 'your business'}</strong>.
                      </span>
                    </div>

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

                    <div className="form-grid-2 form-actions-wizard">
                      <button
                        type="button"
                        className="btn-outline btn-lg"
                        onClick={() => setStep(1)}
                      >
                        &larr; Back to Step 1
                      </button>
                      <button type="submit" className="btn-primary btn-lg">
                        Continue to Step 3: Choose Plan &rarr;
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* STEP 3: Plan Selection & 14-Day Free Trial */}
              {step === 3 && (
                <div className="wizard-step-content animate-fade-in">
                  <div className="step-content-header">
                    <h2 className="step-title">Step 3: Select Plan &amp; Start 14-Day Trial</h2>
                    <p className="step-desc">
                      Enjoy 14 days of full unrestricted access. No credit/debit card charged today.
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
                        Annual Billing <span className="save-badge">Save 20%</span>
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
                              <strong>₹{price.toLocaleString('en-IN')}</strong> / mo
                            </div>
                            <span className="signup-tier-tagline">{plan.tagline}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Trial Highlights Box */}
                  <div className="trial-summary-banner">
                    <div className="trial-icon-col">🎁</div>
                    <div className="trial-info-col">
                      <strong>14-Day Free Trial on {selectedPlanObj.name}</strong>
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
                      disabled={loading || !agreeTerms}
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
          /* Post-Registration Onboarding Launchpad */
          <div className="success-onboarding-container animate-fade-in">
            <div className="success-launchpad-card">
              {/* Top Hero Banner */}
              <div className="launchpad-hero-banner">
                <div className="launchpad-icon-bubble">
                  <span>✓</span>
                </div>
                <div className="launchpad-hero-text">
                  <div className="launchpad-badges-row">
                    <span className="launchpad-cat-badge capitalize">
                      📍 {createdBusiness.category || category}
                    </span>
                    <span className="launchpad-trial-badge">
                      🎁 14-Day Pro Trial Active
                    </span>
                  </div>
                  <h2 className="launchpad-title">Your Review Hub is Live!</h2>
                  <p className="launchpad-biz-name">
                    Ready to collect reviews for <strong className="gradient-text">{createdBusiness.name}</strong>
                  </p>
                </div>
              </div>

              {/* Main 2-Column Responsive Body */}
              <div className="launchpad-body-grid">
                {/* Left Column: QR Code Display Card */}
                <div className="launchpad-qr-col">
                  <QRCodeDisplay
                    url={
                      createdBusiness.shareableUrl ||
                      `${window.location.origin}/review/${createdBusiness.id}`
                    }
                    title="Customer Review QR Code"
                    subtitle="Scan or print this to let customers write AI-assisted Google reviews in seconds"
                  />
                </div>

                {/* Right Column: Launchpad Actions */}
                <div className="launchpad-actions-col">
                  <h3 className="launchpad-actions-title">🚀 What would you like to do next?</h3>
                  
                  <div className="launchpad-cards-grid">
                    {/* Action 1: Standee Designer */}
                    <div
                      className="launchpad-action-card primary-action"
                      onClick={() => setShowStandeeStudio(true)}
                    >
                      <div className="action-card-icon">🎨</div>
                      <div className="action-card-info">
                        <div className="action-card-header">
                          <h4>Standee &amp; Poster Studio</h4>
                          <span className="action-chip">Recommended</span>
                        </div>
                        <p>Generate high-res table tents, acrylic counter standees, and posters with your QR code.</p>
                      </div>
                      <button type="button" className="btn-action-arrow">
                        Design Now &rarr;
                      </button>
                    </div>

                    {/* Action 2: WhatsApp Inviter */}
                    <div
                      className="launchpad-action-card whatsapp-action"
                      onClick={() => setShowWhatsAppModal(true)}
                    >
                      <div className="action-card-icon">💬</div>
                      <div className="action-card-info">
                        <div className="action-card-header">
                          <h4>WhatsApp &amp; SMS Inviter</h4>
                        </div>
                        <p>Send instant 1-click personalized review requests directly to your customers' WhatsApp.</p>
                      </div>
                      <button type="button" className="btn-action-arrow">
                        Send Invites &rarr;
                      </button>
                    </div>

                    {/* Action 3: Test Review Experience */}
                    <Link
                      to={`/review/${createdBusiness.id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="launchpad-action-card test-action"
                    >
                      <div className="action-card-icon">📱</div>
                      <div className="action-card-info">
                        <div className="action-card-header">
                          <h4>Test Customer Review Flow</h4>
                          <span className="action-chip-subtle">Live Demo</span>
                        </div>
                        <p>Experience the exact multilingual AI review generation flow your customers will see.</p>
                      </div>
                      <span className="btn-action-arrow">
                        Test Flow ↗
                      </span>
                    </Link>

                    {/* Action 4: Dashboard */}
                    <Link
                      to={`/dashboard/${createdBusiness.id}`}
                      className="launchpad-action-card dashboard-action"
                    >
                      <div className="action-card-icon">📊</div>
                      <div className="action-card-info">
                        <div className="action-card-header">
                          <h4>Business Analytics Dashboard</h4>
                        </div>
                        <p>Manage customer feedback, staff seats, Google place connection, and AI auto-replies.</p>
                      </div>
                      <span className="btn-action-arrow">
                        Open Dashboard &rarr;
                      </span>
                    </Link>
                  </div>

                  {/* Bottom Secondary Links */}
                  <div className="launchpad-footer-bar">
                    <Link to="/subscription" className="launchpad-footer-link">
                      💳 View 14-Day Trial &amp; Subscription Quotas &rarr;
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        setCreatedBusiness(null);
                        setStep(1);
                        setBizName('');
                        setOwnerName('');
                        setEmail('');
                        setPassword('');
                      }}
                      className="btn-link-reset"
                    >
                      + Register Another Location
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {showWhatsAppModal && (
              <WhatsAppInviteModal
                business={createdBusiness}
                reviewUrl={
                  createdBusiness.shareableUrl ||
                  `${window.location.origin}/review/${createdBusiness.id}`
                }
                onClose={() => setShowWhatsAppModal(false)}
              />
            )}

            {showStandeeStudio && (
              <StandeeDesigner
                business={createdBusiness}
                reviewUrl={
                  createdBusiness.shareableUrl ||
                  `${window.location.origin}/review/${createdBusiness.id}`
                }
                onClose={() => setShowStandeeStudio(false)}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
