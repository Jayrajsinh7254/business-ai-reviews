import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { CATEGORIES, getCategoryLabel, getCategoryServices } from '../lib/categories';

const LOCATION_COUNTS = [
  '1 location',
  '2–3 locations',
  '4–10 locations',
  '10+ locations (franchise)',
];

export default function ContactPage() {
  const [step, setStep] = useState(1); // 1 = form, 2 = success
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    ownerName: '',
    businessName: '',
    businessType: 'it_marketing',
    customBusinessType: '',
    services: getCategoryServices('it_marketing').slice(0, 4),
    locations: '1 location',
    email: '',
    phone: '',
    googleProfileUrl: '',
    message: '',
    agreeToTerms: false,
  });
  const [newServiceInput, setNewServiceInput] = useState('');
  const [errors, setErrors] = useState({});

  const handleBusinessTypeChange = (newType) => {
    const defaultSrvs = newType ? getCategoryServices(newType).slice(0, 4) : [];
    setForm((f) => ({
      ...f,
      businessType: newType,
      customBusinessType: newType === 'other' ? f.customBusinessType : '',
      services: defaultSrvs,
    }));
    if (errors.businessType) setErrors((e) => ({ ...e, businessType: '' }));
    if (errors.customBusinessType) setErrors((e) => ({ ...e, customBusinessType: '' }));
    if (errors.services) setErrors((e) => ({ ...e, services: '' }));
  };

  const handleToggleService = (srv) => {
    setForm((f) => {
      const exists = f.services.some((s) => s.toLowerCase() === srv.toLowerCase());
      const updated = exists
        ? f.services.filter((s) => s.toLowerCase() !== srv.toLowerCase())
        : [...f.services, srv];
      return { ...f, services: updated };
    });
    if (errors.services) setErrors((e) => ({ ...e, services: '' }));
  };

  const handleAddCustomService = (e) => {
    if (e) e.preventDefault();
    const clean = newServiceInput.trim();
    if (!clean) return;
    if (!form.services.some((s) => s.toLowerCase() === clean.toLowerCase())) {
      setForm((f) => ({ ...f, services: [...f.services, clean] }));
    }
    setNewServiceInput('');
    if (errors.services) setErrors((e) => ({ ...e, services: '' }));
  };

  const handleSelectAllServices = () => {
    if (!form.businessType) return;
    const all = getCategoryServices(form.businessType);
    setForm((f) => {
      const merged = Array.from(new Set([...f.services, ...all]));
      return { ...f, services: merged };
    });
    if (errors.services) setErrors((e) => ({ ...e, services: '' }));
  };

  const handleClearAllServices = () => {
    setForm((f) => ({ ...f, services: [] }));
  };

  const validate = () => {
    const e = {};
    if (!form.ownerName.trim()) e.ownerName = 'Your full name is required';
    if (!form.businessName.trim()) e.businessName = 'Business name is required';
    if (!form.businessType) e.businessType = 'Please select your business type';
    if (form.businessType === 'other' && !form.customBusinessType.trim()) {
      e.customBusinessType = 'Please specify your industry or business type name';
    }
    if (!form.services || form.services.length === 0) {
      e.services = 'Please select or add at least 1 service your business offers';
    }
    if (!form.locations) e.locations = 'Please select number of locations';
    if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) e.email = 'Valid email is required';
    if (!form.phone.trim()) e.phone = 'Phone number is required';
    if (!form.agreeToTerms) e.agreeToTerms = 'Please agree to continue';
    return e;
  };

  const handleChange = (field, value) => {
    setForm((f) => ({ ...f, [field]: value }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setSubmitting(true);

    const effectiveCategoryLabel = form.businessType === 'other'
      ? (form.customBusinessType.trim() || 'Other')
      : (getCategoryLabel(form.businessType) || form.businessType);

    try {
      await api.submitLead({
        ownerName: form.ownerName,
        businessName: form.businessName,
        businessType: effectiveCategoryLabel,
        rawCategory: form.businessType,
        customBusinessType: form.customBusinessType,
        services: form.services,
        locations: form.locations,
        email: form.email,
        phone: form.phone,
        googleProfileUrl: form.googleProfileUrl,
        message: form.message,
      });
    } catch (saveErr) {
      console.error('Could not save lead:', saveErr);
      setErrors((current) => ({
        ...current,
        submit: saveErr?.message || 'Could not submit your request. Please try again.',
      }));
      setSubmitting(false);
      return;
    }

    setSubmitting(false);
    setStep(2);
    try {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {}
  };

  if (step === 2) {
    const effectiveCategoryLabel = form.businessType === 'other'
      ? (form.customBusinessType.trim() || 'Other')
      : (getCategoryLabel(form.businessType) || form.businessType);
    const srvSnippet = form.services?.length ? ` Services: ${form.services.slice(0, 4).join(', ')}.` : '';
    const waText = encodeURIComponent(
      `Hi ReviewAssist team, I just requested a QR review system for my business "${form.businessName}" (${effectiveCategoryLabel}, ${form.locations}).${srvSnippet} Owner: ${form.ownerName}, Phone: ${form.phone}. I'd like to fast-track my QR standee setup!`
    );

    return (
      <div className="contact-page-wrapper">
        {/* Glow blobs */}
        <div className="contact-glow-1"></div>
        <div className="contact-glow-2"></div>

        <div className="contact-success-card animate-fade-in">
          <div className="success-icon-ring">
            <span className="success-checkmark">✓</span>
          </div>
          <h1 className="success-title">Request Received! 🎉</h1>
          <p className="success-subtitle">
            Thank you, <strong>{form.ownerName}</strong>! We've received your inquiry for{' '}
            <strong>{form.businessName}</strong>.
          </p>

          {/* Priority WhatsApp Fast Track */}
          <div className="contact-fast-track-box">
            <div className="fast-track-header">
              <span className="fast-track-badge">⚡ Instant Setup Available</span>
              <p className="fast-track-desc">
                Want your acrylic QR standee and review portal prepared today? Connect with our onboarding team on WhatsApp:
              </p>
            </div>
            <a
              href={`https://wa.me/919537370561?text=${waText}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-whatsapp-priority"
            >
              💬 Fast-Track Setup on WhatsApp
            </a>
          </div>

          <div className="success-timeline">
            <div className="timeline-step">
              <div className="tl-icon tl-done">✓</div>
              <div className="tl-content">
                <strong>Request Submitted</strong>
                <span>We have your business details</span>
              </div>
            </div>
            <div className="timeline-step">
              <div className="tl-icon tl-pending">2</div>
              <div className="tl-content">
                <strong>Our Team Reviews & Generates QR (24 hrs)</strong>
                <span>We'll verify your Google Business profile & design standee</span>
              </div>
            </div>
            <div className="timeline-step">
              <div className="tl-icon tl-pending">3</div>
              <div className="tl-content">
                <strong>QR Standee & Setup Kit Delivery</strong>
                <span>Print-ready standee PDF and table tents sent to your email</span>
              </div>
            </div>
            <div className="timeline-step">
              <div className="tl-icon tl-pending">4</div>
              <div className="tl-content">
                <strong>Dashboard Access Granted</strong>
                <span>Login credentials provided — start collecting 5-star reviews!</span>
              </div>
            </div>
          </div>

          <p className="success-note">
            📧 A confirmation receipt was recorded for <strong>{form.email}</strong>.
          </p>

          <div className="success-actions">
            <Link to="/" className="btn-primary">
              ← Back to Home
            </Link>
            <Link to="/review/demo-1" className="btn-secondary">
              📱 Test Reviewer Demo
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="contact-page-wrapper">
      {/* Background glow blobs */}
      <div className="contact-glow-1"></div>
      <div className="contact-glow-2"></div>

      <div className="contact-page-inner">
        {/* Left Info Panel */}
        <div className="contact-info-panel animate-fade-in">
          <div className="contact-info-badge">
            <span>📲</span> Managed Onboarding
          </div>
          <h1 className="contact-info-title">
            Get Your <span className="gradient-text">Custom QR Code</span> for Google Reviews
          </h1>
          <p className="contact-info-desc">
            We handle everything for you — from QR setup to dashboard access. Just fill in your
            business details and our team will configure, brand, and deliver your ReviewAssist QR
            system personally.
          </p>

          <div className="contact-benefits-list">
            <div className="contact-benefit-item">
              <span className="benefit-icon">🎨</span>
              <div>
                <strong>Custom Branded QR Standee</strong>
                <p>Professionally designed with your business name and logo, print-ready.</p>
              </div>
            </div>
            <div className="contact-benefit-item">
              <span className="benefit-icon">⚙️</span>
              <div>
                <strong>Full White-Glove Setup</strong>
                <p>We configure your Google Business Profile link, services, and AI settings.</p>
              </div>
            </div>
            <div className="contact-benefit-item">
              <span className="benefit-icon">📊</span>
              <div>
                <strong>Dashboard & Analytics Access</strong>
                <p>Track every review, rating trend, and customer sentiment in real-time.</p>
              </div>
            </div>
            <div className="contact-benefit-item">
              <span className="benefit-icon">🛡️</span>
              <div>
                <strong>100% Google Compliant</strong>
                <p>Every review is written by the customer, from their own thoughts and account.</p>
              </div>
            </div>
            <div className="contact-benefit-item">
              <span className="benefit-icon">⚡</span>
              <div>
                <strong>Live in 24–48 Hours</strong>
                <p>From request to first customer scan — in under two business days.</p>
              </div>
            </div>
          </div>

          <div className="contact-social-proof">
            <div className="proof-avatars">
              <span className="proof-avatar">🏪</span>
              <span className="proof-avatar">🍔</span>
              <span className="proof-avatar">🦷</span>
              <span className="proof-avatar">🚗</span>
              <span className="proof-avatar">💇</span>
            </div>
            <p>
              <strong>Trusted by 500+ local businesses</strong> across restaurants, clinics, salons &
              auto shops
            </p>
          </div>
        </div>

        {/* Right Form Panel */}
        <div className="contact-form-panel animate-fade-in">
          <div className="contact-form-card">
            <div className="contact-form-header">
              <h2>Request Your QR Review System</h2>
              <p>Fill in your details below. Our team will reach out within 24 hours.</p>
            </div>

            <form className="contact-form" onSubmit={handleSubmit} noValidate>
              {/* Owner Name */}
              <div className={`contact-form-group ${errors.ownerName ? 'has-error' : ''}`}>
                <label className="contact-form-label" htmlFor="ownerName">
                  Your Full Name *
                </label>
                <input
                  id="ownerName"
                  type="text"
                  className="contact-form-input"
                  placeholder="e.g. Jayraj Chavda"
                  value={form.ownerName}
                  onChange={(e) => handleChange('ownerName', e.target.value)}
                />
                {errors.ownerName && <span className="contact-field-error">{errors.ownerName}</span>}
              </div>

              {/* Business Name */}
              <div className={`contact-form-group ${errors.businessName ? 'has-error' : ''}`}>
                <label className="contact-form-label" htmlFor="businessName">
                  Business Name *
                </label>
                <input
                  id="businessName"
                  type="text"
                  className="contact-form-input"
                  placeholder="e.g. Chavda Auto Garage"
                  value={form.businessName}
                  onChange={(e) => handleChange('businessName', e.target.value)}
                />
                {errors.businessName && (
                  <span className="contact-field-error">{errors.businessName}</span>
                )}
              </div>

              {/* Business Type + Locations (2 columns) */}
              <div className="contact-form-row">
                <div className={`contact-form-group ${errors.businessType ? 'has-error' : ''}`}>
                  <label className="contact-form-label" htmlFor="businessType">
                    Business Type / Category *
                  </label>
                  <select
                    id="businessType"
                    className="contact-form-select"
                    value={form.businessType}
                    onChange={(e) => handleBusinessTypeChange(e.target.value)}
                  >
                    <option value="">Select industry category...</option>
                    {CATEGORIES.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.icon} {c.label}
                      </option>
                    ))}
                  </select>
                  {errors.businessType && (
                    <span className="contact-field-error">{errors.businessType}</span>
                  )}
                </div>

                <div className={`contact-form-group ${errors.locations ? 'has-error' : ''}`}>
                  <label className="contact-form-label" htmlFor="locations">
                    Number of Locations *
                  </label>
                  <select
                    id="locations"
                    className="contact-form-select"
                    value={form.locations}
                    onChange={(e) => handleChange('locations', e.target.value)}
                  >
                    <option value="">Select...</option>
                    {LOCATION_COUNTS.map((l) => (
                      <option key={l} value={l}>
                        {l}
                      </option>
                    ))}
                  </select>
                  {errors.locations && (
                    <span className="contact-field-error">{errors.locations}</span>
                  )}
                </div>
              </div>

              {/* Conditional Field if 'Other' is selected */}
              {form.businessType === 'other' && (
                <div className={`contact-form-group custom-type-field animate-fade-in ${errors.customBusinessType ? 'has-error' : ''}`}>
                  <label className="contact-form-label" htmlFor="customBusinessType">
                    Specify Your Business Type / Industry Name *
                  </label>
                  <div className="custom-input-wrap">
                    <span className="custom-input-icon">✨</span>
                    <input
                      id="customBusinessType"
                      type="text"
                      className="contact-form-input highlight-field"
                      placeholder="e.g. Pet Grooming, Photography Studio, Solar Energy, Wedding Planning..."
                      value={form.customBusinessType}
                      onChange={(e) => handleChange('customBusinessType', e.target.value)}
                      autoFocus
                    />
                  </div>
                  {errors.customBusinessType && (
                    <span className="contact-field-error">{errors.customBusinessType}</span>
                  )}
                  <span className="field-hint">
                    Enter your specific business type so our team can customize your QR standee &amp; review portal.
                  </span>
                </div>
              )}

              {/* ALL SERVICES OFFERED SECTION */}
              {form.businessType && (
                <div className={`contact-services-section animate-fade-in ${errors.services ? 'has-error' : ''}`}>
                  <div className="contact-services-header">
                    <div className="contact-services-title-wrap">
                      <label className="contact-form-label" style={{ marginBottom: 0 }}>
                        What Services Does Your Business Offer? *
                      </label>
                      <span className="contact-services-hint">
                        Select all that apply or add custom services (these appear on your QR review portal)
                      </span>
                    </div>
                    <div className="contact-services-actions">
                      <button
                        type="button"
                        className="btn-link-action"
                        onClick={handleSelectAllServices}
                      >
                        Select All
                      </button>
                      <span className="action-divider">•</span>
                      <button
                        type="button"
                        className="btn-link-action"
                        onClick={handleClearAllServices}
                      >
                        Clear All
                      </button>
                    </div>
                  </div>

                  {/* Suggested Service Chips Grid */}
                  <div className="contact-services-grid">
                    {getCategoryServices(form.businessType).map((srv, idx) => {
                      const selected = form.services.some((s) => s.toLowerCase() === srv.toLowerCase());
                      return (
                        <button
                          key={idx}
                          type="button"
                          className={`contact-service-chip ${selected ? 'selected' : ''}`}
                          onClick={() => handleToggleService(srv)}
                        >
                          <span className="chip-check-box">{selected ? '✓' : '+'}</span>
                          <span>{srv}</span>
                        </button>
                      );
                    })}

                    {/* Custom services added by user */}
                    {form.services
                      .filter((s) => !getCategoryServices(form.businessType).some((ds) => ds.toLowerCase() === s.toLowerCase()))
                      .map((customSrv, idx) => (
                        <button
                          key={`custom-${idx}`}
                          type="button"
                          className="contact-service-chip selected custom-chip"
                          onClick={() => handleToggleService(customSrv)}
                        >
                          <span className="chip-check-box">✓</span>
                          <span>{customSrv}</span>
                          <span className="chip-remove-icon" title="Remove">✕</span>
                        </button>
                      ))}
                  </div>

                  {/* Add Custom Service Input */}
                  <div className="contact-add-service-row">
                    <input
                      type="text"
                      className="contact-form-input contact-add-service-input"
                      placeholder="+ Add another service (e.g. Ceramic Coating, Deep Cleaning, Root Canal...)"
                      value={newServiceInput}
                      onChange={(e) => setNewServiceInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddCustomService();
                        }
                      }}
                    />
                    <button
                      type="button"
                      className="btn-add-service"
                      onClick={handleAddCustomService}
                      disabled={!newServiceInput.trim()}
                    >
                      + Add Service
                    </button>
                  </div>

                  {errors.services && (
                    <span className="contact-field-error" style={{ display: 'block', marginTop: '0.4rem' }}>
                      {errors.services}
                    </span>
                  )}

                  <div className="contact-services-footer">
                    <span className="services-count-badge">
                      ✓ {form.services.length} service{form.services.length !== 1 ? 's' : ''} selected
                    </span>
                  </div>
                </div>
              )}

              {/* Email + Phone (2 columns) */}
              <div className="contact-form-row">
                <div className={`contact-form-group ${errors.email ? 'has-error' : ''}`}>
                  <label className="contact-form-label" htmlFor="contactEmail">
                    Email Address *
                  </label>
                  <input
                    id="contactEmail"
                    type="email"
                    className="contact-form-input"
                    placeholder="you@yourbusiness.com"
                    value={form.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                  />
                  {errors.email && <span className="contact-field-error">{errors.email}</span>}
                </div>

                <div className={`contact-form-group ${errors.phone ? 'has-error' : ''}`}>
                  <label className="contact-form-label" htmlFor="contactPhone">
                    Phone Number *
                  </label>
                  <input
                    id="contactPhone"
                    type="tel"
                    className="contact-form-input"
                    placeholder="+91 98765 43210"
                    value={form.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                  />
                  {errors.phone && <span className="contact-field-error">{errors.phone}</span>}
                </div>
              </div>

              {/* Google Profile URL */}
              <div className="contact-form-group">
                <label className="contact-form-label" htmlFor="googleProfileUrl">
                  Google Business Profile URL{' '}
                  <span className="optional-label">(optional but helps speed things up)</span>
                </label>
                <input
                  id="googleProfileUrl"
                  type="url"
                  className="contact-form-input"
                  placeholder="https://maps.google.com/..."
                  value={form.googleProfileUrl}
                  onChange={(e) => handleChange('googleProfileUrl', e.target.value)}
                />
              </div>

              {/* Message */}
              <div className="contact-form-group">
                <label className="contact-form-label" htmlFor="contactMessage">
                  Anything else we should know?{' '}
                  <span className="optional-label">(optional)</span>
                </label>
                <textarea
                  id="contactMessage"
                  className="contact-form-textarea"
                  rows={3}
                  placeholder="e.g. We run 2 branches and want different QR codes per branch..."
                  value={form.message}
                  onChange={(e) => handleChange('message', e.target.value)}
                />
              </div>

              {/* Terms Agreement */}
              <div className={`contact-form-group contact-checkbox-group ${errors.agreeToTerms ? 'has-error' : ''}`}>
                <label className="contact-checkbox-label" htmlFor="agreeToTerms">
                  <input
                    id="agreeToTerms"
                    type="checkbox"
                    checked={form.agreeToTerms}
                    onChange={(e) => handleChange('agreeToTerms', e.target.checked)}
                  />
                  <span>
                    I agree to the{' '}
                    <Link to="/terms" className="contact-form-link" target="_blank">
                      Terms of Service
                    </Link>{' '}
                    and{' '}
                    <Link to="/privacy" className="contact-form-link" target="_blank">
                      Privacy Policy
                    </Link>
                    . I confirm that customers will submit reviews voluntarily.
                  </span>
                </label>
                {errors.agreeToTerms && (
                  <span className="contact-field-error">{errors.agreeToTerms}</span>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className={`contact-submit-btn ${submitting ? 'submitting' : ''}`}
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <span className="btn-spinner"></span>
                    Sending Request...
                  </>
                ) : (
                  <>🚀 Send My QR Code Request</>
                )}
              </button>
              {errors.submit && (
                <span className="contact-field-error" role="alert" style={{ display: 'block', marginTop: '0.5rem' }}>
                  {errors.submit}
                </span>
              )}

              <p className="contact-form-footer-note">
                🔒 Your data is private. We never share your information with third parties.
                <br />
                Expect a response within <strong>24–48 business hours</strong>.
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
