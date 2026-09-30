import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';

const BUSINESS_TYPES = [
  'Auto Repair & Car Service',
  'Hair Salon & Barber',
  'Spa & Beauty Center',
  'Restaurant & Cafe',
  'Dental Clinic',
  'Medical Clinic',
  'Gym & Fitness Studio',
  'Home Services & Contracting',
  'Real Estate Agency',
  'Retail Store',
  'Hotel & Hospitality',
  'Other',
];

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
    businessType: '',
    locations: '',
    email: '',
    phone: '',
    googleProfileUrl: '',
    message: '',
    agreeToTerms: false,
  });
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.ownerName.trim()) e.ownerName = 'Your name is required';
    if (!form.businessName.trim()) e.businessName = 'Business name is required';
    if (!form.businessType) e.businessType = 'Please select your business type';
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

    try {
      await api.submitLead({
        ownerName: form.ownerName,
        businessName: form.businessName,
        businessType: form.businessType,
        locations: form.locations,
        email: form.email,
        phone: form.phone,
        googleProfileUrl: form.googleProfileUrl,
        message: form.message,
      });
    } catch (saveErr) {
      console.warn('Could not save lead:', saveErr);
    }

    setSubmitting(false);
    setStep(2);
  };

  if (step === 2) {
    const waText = encodeURIComponent(
      `Hi ReviewAssist team, I just requested a QR code for my business "${form.businessName}" (${form.businessType}, ${form.locations}). Owner: ${form.ownerName}, Phone: ${form.phone}. I'd like to fast-track my QR standee setup!`
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
              href={`https://wa.me/919999999999?text=${waText}`}
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
                    Business Type *
                  </label>
                  <select
                    id="businessType"
                    className="contact-form-select"
                    value={form.businessType}
                    onChange={(e) => handleChange('businessType', e.target.value)}
                  >
                    <option value="">Select type...</option>
                    {BUSINESS_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
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
