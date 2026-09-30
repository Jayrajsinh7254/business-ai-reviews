import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import confetti from 'canvas-confetti';
import StarRating from '../components/StarRating';
import { api, resolveGoogleReviewUrl } from '../api/client';

export default function ReviewPage() {
  const { businessId } = useParams();

  // Business state
  const [business, setBusiness] = useState(null);
  const [loadingBusiness, setLoadingBusiness] = useState(true);
  const [businessError, setBusinessError] = useState('');

  // Step state (1: Service, 2: Experience Text, 3: AI Draft & Confirm, 4: Done)
  const [currentStep, setCurrentStep] = useState(1);

  // Form fields
  const [serviceType, setServiceType] = useState('');
  const [customServiceText, setCustomServiceText] = useState('');
  const [whatStoodOut, setWhatStoodOut] = useState('');
  const [whatCouldImprove, setWhatCouldImprove] = useState('');
  const [draftText, setDraftText] = useState('');
  const [rating, setRating] = useState(5);

  // Negative Review Shield Interceptor Form Fields (for ratings <= 3)
  const [customerName, setCustomerName] = useState('');
  const [customerContact, setCustomerContact] = useState('');
  const [preferredResolution, setPreferredResolution] = useState('phone_call');
  const [submittingPrivate, setSubmittingPrivate] = useState(false);
  const [privateFeedbackSubmitted, setPrivateFeedbackSubmitted] = useState(false);
  const [bypassShieldToGoogle, setBypassShieldToGoogle] = useState(false);

  // Action states
  const [generatingDraft, setGeneratingDraft] = useState(false);
  const [postingReview, setPostingReview] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [copied, setCopied] = useState(false);

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(draftText.trim());
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.warn('Clipboard write error:', err);
    }
  };

  // Fetch business details on mount
  useEffect(() => {
    async function loadBusiness() {
      setLoadingBusiness(true);
      setBusinessError('');
      try {
        const data = await api.getBusiness(businessId);
        setBusiness(data);
        if (data.services && data.services.length > 0) {
          setServiceType(data.services[0]);
        }
      } catch (err) {
        console.error('Error loading business:', err);
        setBusinessError('Could not find business details. Please check the review link.');
      } finally {
        setLoadingBusiness(false);
      }
    }

    if (businessId) {
      loadBusiness();
    }
  }, [businessId]);

  const getEffectiveService = () => {
    if (serviceType === '__custom__' || (!business?.services || business.services.length === 0)) {
      return customServiceText.trim();
    }
    return serviceType;
  };

  // Step 1 -> Step 2 validation & transition
  const handleProceedToStep2 = () => {
    const effective = getEffectiveService();
    if (!effective) {
      setErrorMsg('Please select or specify what service you received.');
      return;
    }
    setErrorMsg('');
    setCurrentStep(2);
  };

  // Step 2 -> Step 3: Trigger draft review generation
  const handleGenerateReview = async () => {
    if (!whatStoodOut.trim()) {
      setErrorMsg('Please share what stood out to you during your visit.');
      return;
    }

    setErrorMsg('');
    setGeneratingDraft(true);

    try {
      const effectiveService = getEffectiveService();
      const response = await api.generateDraftReview({
        businessId,
        serviceType: effectiveService,
        whatStoodOut: whatStoodOut.trim(),
        whatCouldImprove: whatCouldImprove.trim(),
        rating,
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

  // Preferred resolution options for Shield Interceptor
  const RESOLUTION_OPTIONS = [
    { id: 'phone_call', label: '📞 Direct phone call from owner / manager' },
    { id: 'refund_replace', label: '🎁 Free replacement or refund' },
    { id: 'apology', label: '✉️ Apology & explanation of what happened' },
    { id: 'feedback_only', label: '💬 Just sharing feedback to help you improve' },
  ];

  // Submit Private Feedback (Negative Review Shield Interceptor)
  const handleSubmitPrivateFeedback = async (e) => {
    if (e) e.preventDefault();
    if (!whatStoodOut.trim()) {
      setErrorMsg('Please describe what went wrong so management can assist you.');
      return;
    }

    setSubmittingPrivate(true);
    setErrorMsg('');

    try {
      const effectiveService = getEffectiveService();
      const resolutionLabel = RESOLUTION_OPTIONS.find((r) => r.id === preferredResolution)?.label || preferredResolution;
      await api.submitPrivateFeedback({
        businessId,
        serviceType: effectiveService,
        rating,
        issue: whatStoodOut.trim() + (whatCouldImprove.trim() ? `\n\nAdditional notes: ${whatCouldImprove.trim()}` : ''),
        customerName: customerName.trim() || 'Anonymous Customer',
        customerContact: customerContact.trim(),
        preferredResolution: resolutionLabel,
      });

      setPrivateFeedbackSubmitted(true);
      setCurrentStep(4);
    } catch (err) {
      console.error('Failed to submit private feedback:', err);
      setErrorMsg('Could not submit private feedback. Please try again.');
    } finally {
      setSubmittingPrivate(false);
    }
  };

  // Step 3: Regenerate draft with rating adaptation
  const handleRegenerate = async (customRating) => {
    const activeRating = typeof customRating === 'number' ? customRating : rating;
    setGeneratingDraft(true);
    setErrorMsg('');

    try {
      const effectiveService = getEffectiveService();
      const response = await api.generateDraftReview({
        businessId,
        serviceType: effectiveService,
        whatStoodOut: whatStoodOut.trim(),
        whatCouldImprove: whatCouldImprove.trim(),
        rating: activeRating,
        previousDraft: draftText || '',
      });
      setDraftText(response.draftText || '');
    } catch (err) {
      console.error('Failed to regenerate review:', err);
      setErrorMsg(err.message || 'Could not regenerate review. Please try again.');
    } finally {
      setGeneratingDraft(false);
    }
  };

  const handleRatingChange = (newRating) => {
    setRating(newRating);
    handleRegenerate(newRating);
  };

  // Step 3: Post to Google
  const handlePostToGoogle = async () => {
    if (!draftText.trim()) {
      setErrorMsg('Review text cannot be empty.');
      return;
    }

    setPostingReview(true);
    setErrorMsg('');

    try {
      const effectiveService = getEffectiveService();
      const result = await api.confirmReview({
        businessId,
        serviceType: effectiveService,
        finalText: draftText.trim(),
        rating,
        whatStoodOut,
        whatCouldImprove,
      });

      // Try copying finalized review to clipboard for quick paste
      try {
        await navigator.clipboard.writeText(draftText.trim());
        showToast('✓ Review copied to clipboard! Opening Google Reviews...');
      } catch (clipErr) {
        console.warn('Clipboard write error:', clipErr);
      }

      // Fire celebratory confetti!
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });

      // Open business Google Review link in a new tab (real Google review dialog or Google search)
      const rawUrl = result.googleReviewUrl || business?.googleReviewUrl;
      const targetUrl = resolveGoogleReviewUrl(rawUrl, business?.name);
      window.open(targetUrl, '_blank', 'noopener,noreferrer');

      setCurrentStep(4);
    } catch (err) {
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

  const isInactive =
    business?.status === 'inactive' ||
    business?.subscriptionStatus === 'inactive' ||
    (business?.paidUntil && new Date(business.paidUntil) < new Date());

  if (isInactive) {
    const directGoogleUrl = resolveGoogleReviewUrl(business?.googleReviewUrl, business?.name);
    return (
      <div className="mobile-review-viewport">
        <div className="mobile-card service-inactive-card text-center animate-fade-in">
          <div className="service-inactive-icon-wrap">
            <span className="service-inactive-icon">⏸️</span>
          </div>
          <span className="service-inactive-badge">Review Service Paused</span>
          <h2 className="service-inactive-biz-name">{business?.name || 'Local Business'}</h2>
          <p className="service-inactive-desc">
            This business's automated AI review collection is temporarily paused for scheduled maintenance or renewal.
          </p>

          <div className="service-inactive-card-box">
            <div className="inactive-box-row">
              <span className="inactive-box-label">Business:</span>
              <span className="inactive-box-value">{business?.name || 'Business Partner'}</span>
            </div>
            <div className="inactive-box-row">
              <span className="inactive-box-label">Status:</span>
              <span className="inactive-status-pill">⏸️ Service Paused</span>
            </div>
          </div>

          {business?.googleReviewUrl && (
            <div className="service-inactive-google-cta">
              <p className="inactive-direct-prompt">
                You can still share your feedback directly on Google Maps:
              </p>
              <a
                href={directGoogleUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary btn-block btn-direct-google"
              >
                ⭐ Review Directly on Google
              </a>
            </div>
          )}

          <div className="service-inactive-powered-by">
            <span>Powered by <strong>ReviewAssist</strong></span>
          </div>
        </div>
      </div>
    );
  }

  const hasServices = business?.services && business.services.length > 0;

  return (
    <div className="mobile-review-viewport">
      {/* Mobile container wrapper */}
      <div className="mobile-card review-flow-card">
        {/* Header with Business Brand */}
        <div className="review-header">
          <div className="review-biz-badge">
            <span className="biz-badge-icon">🏪</span>
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

        {/* STEP 1: Service Selection */}
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

            <div className="step-actions">
              <button
                type="button"
                className="btn-primary btn-block btn-lg"
                onClick={handleProceedToStep2}
              >
                Next: Share Your Experience →
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Rating & What stood out / could improve */}
        {currentStep === 2 && (
          <div className="step-content step-2 animate-fade-in">
            <div className="step-title-row">
              <span className="step-tag">Step 2 of 3</span>
              <h2 className="step-heading">How was your visit?</h2>
            </div>

            <div className="service-selected-pill">
              <span>Service:</span> <strong>{getEffectiveService()}</strong>
            </div>

            {/* Star Rating Picker */}
            <div className="star-picker-section">
              <label className="form-label text-center" style={{ marginBottom: '0.25rem', fontWeight: 600 }}>
                How would you rate your overall experience?
              </label>
              <StarRating
                rating={rating}
                onChange={(r) => {
                  setRating(r);
                  setBypassShieldToGoogle(false);
                }}
                size="lg"
              />
            </div>

            {/* BIFURCATION: Negative Review Shield Interceptor (rating <= 3 && !bypassShieldToGoogle) */}
            {rating <= 3 && !bypassShieldToGoogle ? (
              <form onSubmit={handleSubmitPrivateFeedback} className="shield-intercept-form animate-fade-in">
                {/* Shield Alert Notice */}
                <div className="shield-intercept-card">
                  <div className="shield-card-header">
                    <span className="shield-icon-lg">🛡️</span>
                    <div className="shield-header-text">
                      <span className="shield-badge">Private Resolution Channel</span>
                      <h3 className="shield-title">We want to make this right!</h3>
                      <p className="shield-desc">
                        Your satisfaction is our priority. Since your visit wasn't 5-star, your feedback is sent <strong>directly & privately to management</strong> so we can resolve your issue immediately.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Complaint textarea */}
                <div className="form-group">
                  <label htmlFor="what-went-wrong" className="form-label">
                    Please describe what went wrong during your visit <span className="required-star">*</span>
                  </label>
                  <textarea
                    id="what-went-wrong"
                    rows="3"
                    className="form-textarea"
                    value={whatStoodOut}
                    onChange={(e) => setWhatStoodOut(e.target.value)}
                    placeholder="e.g. Long wait time, staff miscommunication, billing discrepancy, service did not match expectations..."
                    required
                  />
                  <span className="field-hint">
                    Management reads every message directly and will use this to address the problem.
                  </span>
                </div>

                {/* Customer Contact */}
                <div className="form-row-2">
                  <div className="form-group">
                    <label htmlFor="customer-name" className="form-label">
                      Your Name (Optional)
                    </label>
                    <input
                      id="customer-name"
                      type="text"
                      className="form-input"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="e.g. Vikram Sharma"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="customer-contact" className="form-label">
                      Phone Number / WhatsApp <span className="required-star">*</span>
                    </label>
                    <input
                      id="customer-contact"
                      type="tel"
                      className="form-input"
                      value={customerContact}
                      onChange={(e) => setCustomerContact(e.target.value)}
                      placeholder="e.g. +91 98765 43210"
                      required
                    />
                  </div>
                </div>

                {/* Preferred Resolution */}
                <div className="form-group">
                  <label className="form-label">Preferred Resolution:</label>
                  <div className="resolution-options-list">
                    {RESOLUTION_OPTIONS.map((opt) => (
                      <label key={opt.id} className={`resolution-option-card ${preferredResolution === opt.id ? 'active' : ''}`}>
                        <input
                          type="radio"
                          name="preferredResolution"
                          value={opt.id}
                          checked={preferredResolution === opt.id}
                          onChange={() => setPreferredResolution(opt.id)}
                        />
                        <span className="resolution-opt-label">{opt.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="step-actions-split">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setCurrentStep(1)}
                  >
                    ← Back
                  </button>
                  <button
                    type="submit"
                    className="btn-shield-submit flex-1"
                    disabled={submittingPrivate || !whatStoodOut.trim() || !customerContact.trim()}
                  >
                    {submittingPrivate ? (
                      <span className="btn-loading-state">
                        <span className="spinner"></span> Sending to Management...
                      </span>
                    ) : (
                      '🛡️ Submit Privately to Management'
                    )}
                  </button>
                </div>

                {/* Google Compliance Link */}
                <div className="shield-compliance-footer">
                  <button
                    type="button"
                    className="compliance-bypass-btn"
                    onClick={() => setBypassShieldToGoogle(true)}
                  >
                    Prefer to post publicly on Google Maps instead? Click here →
                  </button>
                </div>
              </form>
            ) : (
              /* Positive Flow (4-5 Stars or user explicitly chose to bypass) */
              <div className="positive-flow-container">
                {bypassShieldToGoogle && (
                  <div className="bypass-notice-banner animate-fade-in">
                    <span>⚠️ Public Google review mode selected for {rating}★ feedback.</span>
                    <button
                      type="button"
                      className="btn-link-sm"
                      onClick={() => setBypassShieldToGoogle(false)}
                    >
                      ← Return to Private Resolution
                    </button>
                  </div>
                )}

                {/* What stood out to you? (required) */}
                <div className="form-group">
                  <label htmlFor="what-stood-out" className="form-label">
                    {rating >= 4 ? 'What did you love most about your visit?' : 'What went wrong?'} <span className="required-star">*</span>
                  </label>
                  <textarea
                    id="what-stood-out"
                    rows="3"
                    className="form-textarea"
                    value={whatStoodOut}
                    onChange={(e) => setWhatStoodOut(e.target.value)}
                    placeholder={
                      rating >= 4
                        ? 'e.g. Fast service, super friendly team, very clean environment, great quality...'
                        : 'e.g. Issues faced during service...'
                    }
                    required
                  />
                  <span className="field-hint">
                    Write in any language or rough notes — AI will construct an authentic review!
                  </span>
                </div>

                {/* Anything that could've been better? (optional) */}
                <div className="form-group">
                  <label htmlFor="what-could-improve" className="form-label">
                    Anything that could've been better? <span className="optional-tag">(Optional)</span>
                  </label>
                  <textarea
                    id="what-could-improve"
                    rows="2"
                    className="form-textarea"
                    value={whatCouldImprove}
                    onChange={(e) => setWhatCouldImprove(e.target.value)}
                    placeholder="e.g. Parking was tight, waiting area was busy..."
                  />
                </div>

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
                    className="btn-primary flex-1"
                    onClick={handleGenerateReview}
                    disabled={generatingDraft || !whatStoodOut.trim()}
                  >
                    {generatingDraft ? (
                      <span className="btn-loading-state">
                        <span className="spinner"></span> Generating {rating}-Star Review...
                      </span>
                    ) : (
                      `✨ Generate ${rating}-Star Review →`
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP 3: Review Draft, Star Picker, Regenerate & Post */}
        {currentStep === 3 && (
          <div className="step-content step-3 animate-fade-in">
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
              <StarRating rating={rating} onChange={handleRatingChange} size="lg" />
              <span className="star-picker-subhint">
                Tap any star above to instantly regenerate the review with that tone!
              </span>
            </div>

            {/* Editable Draft Textarea */}
            <div className="form-group">
              <div className="form-label-row">
                <label htmlFor="draft-review-text" className="form-label">
                  Review Text (Feel free to edit)
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
                    {generatingDraft ? (
                      <span className="btn-inline-loader">
                        <span className="spinner spinner-xs spinner-brand"></span> Rewriting...
                      </span>
                    ) : (
                      '🔄 Re-write'
                    )}
                  </button>
                </div>
              </div>

              <div className="draft-textarea-container">
                {generatingDraft && (
                  <div className="draft-regenerating-overlay animate-fade-in">
                    <div className="draft-ai-loader-card">
                      <div className="draft-ai-loader-badge">
                        <span className="pulse-dot"></span>
                        <span className="loader-sparkle">✨</span>
                        <span>AI Drafting Engine</span>
                      </div>
                      <p className="draft-ai-loader-msg">
                        Polishing fresh {rating}-star review...
                      </p>
                      <div className="draft-ai-skeleton-bar">
                        <div className="skeleton-bar-fill"></div>
                      </div>
                    </div>
                  </div>
                )}

                <textarea
                  id="draft-review-text"
                  rows="6"
                  className={`form-textarea draft-textarea ${generatingDraft ? 'is-loading' : ''}`}
                  value={draftText}
                  onChange={(e) => setDraftText(e.target.value)}
                  placeholder="Your generated review will appear here..."
                  disabled={generatingDraft}
                />
              </div>
            </div>

            {/* Post to Google Button */}
            <div className="step-actions-vertical">
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
                {postingReview ? 'Opening Google...' : 'Copy & Post to Google Reviews'}
              </button>

              <div className="google-paste-hint-box">
                <span className="hint-icon">💡</span>
                <p className="hint-text">
                  <strong>Easy 1-Click:</strong> Clicking above auto-copies this text and opens Google. Just <strong>Paste (Ctrl+V / Long-press Paste)</strong> into Google and click Post!
                </p>
              </div>

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
                  onClick={handleRegenerate}
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
          </div>
        )}

        {/* STEP 4: Success / Confirmation State with 1-Click Paste Helper */}
        {currentStep === 4 && (
          <div className="step-content step-4 animate-fade-in text-center">
            {privateFeedbackSubmitted ? (
              <div className="private-resolution-success-container">
                <div className="shield-celebration-circle">🛡️</div>
                <h2 className="success-heading">Feedback Sent to Management</h2>
                <p className="success-subtext">
                  Thank you for your honesty. The owner and management of <strong>{business?.name}</strong> have received your private report and will review it immediately.
                </p>

                {/* Summary Card */}
                <div className="shield-confirmation-card">
                  <div className="shield-summary-row">
                    <span className="shield-summary-label">Rating:</span>
                    <span className="shield-summary-val">{rating} ★ ({rating <= 2 ? 'Needs Attention' : 'Fair'})</span>
                  </div>
                  <div className="shield-summary-row">
                    <span className="shield-summary-label">Service:</span>
                    <span className="shield-summary-val">{getEffectiveService()}</span>
                  </div>
                  <div className="shield-summary-row">
                    <span className="shield-summary-label">Resolution Requested:</span>
                    <span className="shield-summary-val">
                      {RESOLUTION_OPTIONS.find((r) => r.id === preferredResolution)?.label || preferredResolution}
                    </span>
                  </div>
                  <div className="shield-summary-quote">
                    "{whatStoodOut}"
                  </div>
                </div>

                {/* Direct WhatsApp button to owner if phone exists */}
                {business?.phone && (
                  <div className="shield-wa-direct-box">
                    <p className="shield-wa-text">Need urgent resolution right away?</p>
                    <a
                      href={`https://wa.me/${business.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                        `Hi ${business?.name || ''}, I just submitted private feedback (${rating}★) regarding my recent visit (${getEffectiveService()}). Can we discuss this?`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-whatsapp-direct btn-block"
                    >
                      💬 Message Owner on WhatsApp
                    </a>
                  </div>
                )}

                {/* Google Compliance Link */}
                <div className="shield-google-compliance-note">
                  <span>We respect your choice. If you still wish to post on Google Maps:</span>
                  <button
                    type="button"
                    className="compliance-google-link"
                    onClick={() => {
                      const rawUrl = business?.googleReviewUrl;
                      const targetUrl = resolveGoogleReviewUrl(rawUrl, business?.name);
                      window.open(targetUrl, '_blank', 'noopener,noreferrer');
                    }}
                  >
                    Open Public Google Reviews Page →
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
                      setCustomerName('');
                      setCustomerContact('');
                      setPrivateFeedbackSubmitted(false);
                      setBypassShieldToGoogle(false);
                    }}
                  >
                    ← Start Over
                  </button>
                </div>
              </div>
            ) : (
              /* Standard 4-5 Star Google Review Success */
              <div>
                <div className="celebration-circle">🎉</div>
                <h2 className="success-heading">Review Ready & Copied!</h2>
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
                        <strong>Tap "Paste"</strong>
                        <span>Text is in your clipboard</span>
                      </div>
                    </div>

                    <div className="guide-step-arrow">→</div>

                    <div className="guide-mini-step">
                      <div className="guide-step-number">3</div>
                      <div className="guide-step-body">
                        <strong>Click "Post"</strong>
                        <span>Done in 1 click!</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Review Quote Box */}
                <div className="review-preview-summary card-flat">
                  <div className="review-copied-badge">✓ Copied to Clipboard</div>
                  <p className="review-summary-quote">"{draftText}"</p>
                </div>

                <div className="step-4-quick-actions">
                  <button
                    type="button"
                    className="btn-primary btn-block btn-lg"
                    onClick={() => {
                      const rawUrl = business?.googleReviewUrl;
                      const targetUrl = resolveGoogleReviewUrl(rawUrl, business?.name);
                      window.open(targetUrl, '_blank', 'noopener,noreferrer');
                    }}
                  >
                    🚀 Open Google Review Page Again
                  </button>
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
                    }}
                  >
                    Write Another Review
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
