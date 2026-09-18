import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import TagInput from '../components/TagInput';
import QRCodeDisplay from '../components/QRCodeDisplay';
import StandeeDesigner from '../components/StandeeDesigner';
import WhatsAppInviteModal from '../components/WhatsAppInviteModal';
import { useAuth } from '../context/AuthContext';
import { PLANS } from '../lib/plans';

const CATEGORIES = [
  { value: 'automobile', label: 'Automobile (Repair, Detailing, Dealership)' },
  { value: 'restaurant', label: 'Restaurant & Cafe' },
  { value: 'salon', label: 'Salon & Spa' },
  { value: 'clinic', label: 'Clinic & Healthcare' },
  { value: 'retail', label: 'Retail & Boutique' },
  { value: 'hotel', label: 'Hotel & Hospitality' },
  { value: 'other', label: 'Other Business' },
];

const CATEGORY_SUGGESTIONS = {
  automobile: ['Oil Change', 'Brake Inspection', 'Tire Rotation', 'Engine Diagnostic', 'Detailing', 'AC Repair'],
  restaurant: ['Dine-in Dinner', 'Weekend Brunch', 'Takeout', 'Cocktails & Bar', 'Catering Service', 'Private Event'],
  salon: ['Haircut & Style', 'Color & Highlights', 'Facial Glow', 'Manicure / Pedicure', 'Massage Therapy'],
  clinic: ['General Consultation', 'Dental Cleaning', 'Eye Exam', 'Physical Therapy', 'Skin Checkup'],
  retail: ['In-Store Shopping', 'Custom Fitting', 'Gift Wrapping', 'Curbside Pickup'],
  hotel: ['Overnight Stay', 'Suite Booking', 'Room Service', 'Concierge Assistance', 'Pool & Spa'],
  other: ['Consultation', 'Standard Service', 'Express Delivery', 'Custom Project'],
};

export default function SignupPage() {
  const [searchParams] = useSearchParams();
  const catParam = searchParams.get('cat');
  const planParam = searchParams.get('plan') || 'pro';

  const { signup } = useAuth();

  const initialCat = (() => {
    if (!catParam) return 'automobile';
    const clean = catParam.toLowerCase();
    if (clean === 'healthcare') return 'clinic';
    if (clean === 'homeservices') return 'other';
    if (CATEGORIES.some((c) => c.value === clean)) return clean;
    return 'automobile';
  })();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [category, setCategory] = useState(initialCat);
  const [selectedPlan, setSelectedPlan] = useState(planParam);
  const [googleReviewUrl, setGoogleReviewUrl] = useState('');
  const [services, setServices] = useState(CATEGORY_SUGGESTIONS[initialCat]?.slice(0, 2) || ['Oil Change', 'Brake Inspection']);
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
        setServices(CATEGORY_SUGGESTIONS[mapped]?.slice(0, 2) || []);
      }
    }
  }, [catParam]);

  const isSubmitDisabled = !name.trim() || !email.trim() || !password || services.length === 0 || loading;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitDisabled) return;

    setLoading(true);
    setError('');

    try {
      const result = await signup({
        name: name.trim(),
        email: email.trim(),
        password,
        category,
        services,
        planId: selectedPlan,
        googleReviewUrl: googleReviewUrl.trim(),
      });

      const biz = result.business || result;
      setCreatedBusiness(biz);
    } catch (err) {
      console.error('Failed to register business:', err);
      setError(err.message || 'Failed to register business. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddSuggestion = (suggestion) => {
    if (!services.some((s) => s.toLowerCase() === suggestion.toLowerCase())) {
      setServices([...services, suggestion]);
    }
  };

  const handleReset = () => {
    setCreatedBusiness(null);
    setName('');
    setEmail('');
    setPassword('');
    setCategory('automobile');
    setServices(['Oil Change', 'Brake Inspection']);
    setError('');
  };

  const planObj = PLANS[selectedPlan.toUpperCase()] || PLANS.PRO;

  return (
    <div className="page-container signup-page">
      <div className="page-header text-center">
        <h1 className="page-title">Business Registration & 14-Day Free Trial</h1>
        <p className="page-subtitle">
          Create your AI-powered review collector in seconds and start converting customers into 5-star Google reviews.
        </p>
      </div>

      {!createdBusiness ? (
        <div className="card signup-card">
          <form onSubmit={handleSubmit} className="form-layout">
            {error && <div className="alert-banner alert-error">{error}</div>}

            {/* Plan Selector Header */}
            <div className="signup-plan-picker-box">
              <label className="form-label">Selected SaaS Plan (14-Day Free Trial):</label>
              <div className="signup-plan-options">
                <div
                  className={`signup-plan-option ${selectedPlan === 'starter' ? 'active' : ''}`}
                  onClick={() => setSelectedPlan('starter')}
                >
                  <div className="plan-opt-radio"></div>
                  <div>
                    <strong>Starter ($19/mo)</strong>
                    <span>1 Location • 100 AI Reviews/mo</span>
                  </div>
                </div>

                <div
                  className={`signup-plan-option ${selectedPlan === 'pro' ? 'active' : ''}`}
                  onClick={() => setSelectedPlan('pro')}
                >
                  <span className="opt-popular-tag">Popular</span>
                  <div className="plan-opt-radio"></div>
                  <div>
                    <strong>Pro Growth ($49/mo)</strong>
                    <span>3 Locations • Unlimited AI & WhatsApp</span>
                  </div>
                </div>

                <div
                  className={`signup-plan-option ${selectedPlan === 'enterprise' ? 'active' : ''}`}
                  onClick={() => setSelectedPlan('enterprise')}
                >
                  <div className="plan-opt-radio"></div>
                  <div>
                    <strong>Enterprise ($99/mo)</strong>
                    <span>Unlimited Locations • White-Label</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Business Name */}
            <div className="form-group">
              <label htmlFor="biz-name" className="form-label">
                Business Name <span className="required-star">*</span>
              </label>
              <input
                id="biz-name"
                type="text"
                className="form-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Apex Auto Care & Repair"
                required
              />
            </div>

            {/* Account Email & Password Grid */}
            <div className="form-grid-2">
              <div className="form-group">
                <label htmlFor="biz-email" className="form-label">
                  Account Email <span className="required-star">*</span>
                </label>
                <input
                  id="biz-email"
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
                  <label htmlFor="biz-password" className="form-label">
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
                  id="biz-password"
                  type={showPassword ? 'text' : 'password'}
                  className="form-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a secure password"
                  required
                  autoComplete="new-password"
                />
              </div>
            </div>

            {/* Category */}
            <div className="form-group">
              <label htmlFor="biz-category" className="form-label">
                Business Category <span className="required-star">*</span>
              </label>
              <div className="select-wrapper">
                <select
                  id="biz-category"
                  className="form-select"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Google Review Link */}
            <div className="form-group">
              <div className="form-label-row">
                <label htmlFor="biz-google-url" className="form-label">
                  Google Review Link or Place URL <span className="optional-tag">(Optional)</span>
                </label>
              </div>
              <input
                id="biz-google-url"
                type="url"
                className="form-input"
                value={googleReviewUrl}
                onChange={(e) => setGoogleReviewUrl(e.target.value)}
                placeholder="e.g. https://search.google.com/local/writereview?placeid=..."
              />
              <span className="field-hint">
                Leave empty to automatically generate Google search for your business name.
              </span>
            </div>

            {/* Services Tag Input */}
            <div className="form-group">
              <div className="form-label-row">
                <label className="form-label">
                  Services Offered <span className="required-star">*</span>
                </label>
                <span className="form-label-hint">
                  {services.length} {services.length === 1 ? 'service' : 'services'} added (minimum 1 required)
                </span>
              </div>

              <TagInput
                tags={services}
                onChange={setServices}
                placeholder="Type service (e.g. Oil Change) and press Enter"
              />

              {CATEGORY_SUGGESTIONS[category] && (
                <div className="suggestions-section">
                  <span className="suggestions-label">Quick suggestions:</span>
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

            {/* Submit Button */}
            <div className="form-actions">
              <button
                type="submit"
                className="btn-primary btn-block btn-lg"
                disabled={isSubmitDisabled}
              >
                {loading ? (
                  <span className="btn-loading-state">
                    <span className="spinner"></span> Creating Account & Business...
                  </span>
                ) : (
                  `Start 14-Day Free ${planObj.name} Trial & Generate QR Code`
                )}
              </button>
            </div>
          </form>

          <div className="auth-footer-links text-center">
            <p>
              Already have an account?{' '}
              <Link to="/login" className="auth-action-link">
                Sign in to your dashboard &rarr;
              </Link>
            </p>
          </div>
        </div>
      ) : (
        /* Result State */
        <div className="success-onboarding-container">
          <div className="card success-card">
            <div className="success-badge-header">
              <div className="success-icon-bubble">✓</div>
              <h2 className="success-title">Your Review Hub is Ready!</h2>
              <p className="success-biz-name">{createdBusiness.name}</p>
              <span className="category-pill">{createdBusiness.category}</span>
            </div>

            <div className="qr-section-wrapper">
              <QRCodeDisplay
                url={createdBusiness.shareableUrl || `${window.location.origin}/review/${createdBusiness.id}`}
                title="Customer Scan QR Code"
                subtitle="Print this on tables, counters, invoices, or receipts"
              />
            </div>

            <div className="quick-nav-actions">
              <button
                type="button"
                className="btn-primary btn-lg"
                onClick={() => setShowStandeeStudio(true)}
              >
                🎨 Open Standee & Poster Designer
              </button>
              <button
                type="button"
                className="btn-whatsapp-action btn-lg"
                onClick={() => setShowWhatsAppModal(true)}
              >
                💬 Send WhatsApp Review Invite
              </button>
              <Link
                to={`/review/${createdBusiness.id}`}
                className="btn-secondary btn-lg"
                target="_blank"
                rel="noreferrer"
              >
                🚀 Test Customer Review Flow
              </Link>
              <Link
                to={`/dashboard/${createdBusiness.id}`}
                className="btn-outline btn-lg"
              >
                📊 Open Business Dashboard
              </Link>
            </div>

            <div className="card-footer-reset text-center">
              <button type="button" onClick={handleReset} className="btn-link">
                ← Register Another Business
              </button>
            </div>
          </div>

          {showWhatsAppModal && (
            <WhatsAppInviteModal
              business={createdBusiness}
              reviewUrl={createdBusiness.shareableUrl || `${window.location.origin}/review/${createdBusiness.id}`}
              onClose={() => setShowWhatsAppModal(false)}
            />
          )}

          {showStandeeStudio && (
            <StandeeDesigner
              business={createdBusiness}
              reviewUrl={createdBusiness.shareableUrl || `${window.location.origin}/review/${createdBusiness.id}`}
              onClose={() => setShowStandeeStudio(false)}
            />
          )}
        </div>
      )}
    </div>
  );
}
