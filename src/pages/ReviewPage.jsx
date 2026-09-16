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

  // Action states
  const [generatingDraft, setGeneratingDraft] = useState(false);
  const [postingReview, setPostingReview] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [toastMsg, setToastMsg] = useState('');

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

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 4000);
  };

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

  // Step 3: Regenerate draft
  const handleRegenerate = async () => {
    setGeneratingDraft(true);
    setErrorMsg('');

    try {
      const effectiveService = getEffectiveService();
      const response = await api.generateDraftReview({
        businessId,
        serviceType: effectiveService,
        whatStoodOut: whatStoodOut.trim(),
        whatCouldImprove: whatCouldImprove.trim(),
      });
      setDraftText(response.draftText || '');
      showToast('✨ Review regenerated with new phrasing!');
    } catch (err) {
      console.error('Failed to regenerate review:', err);
      setErrorMsg(err.message || 'Could not regenerate review. Please try again.');
    } finally {
      setGeneratingDraft(false);
    }
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
        <div className="mobile-card loading-card text-center">
          <div className="spinner spinner-lg"></div>
          <p className="loading-text">Loading business review page...</p>
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

        {/* Global Toast Notification */}
        {toastMsg && <div className="floating-toast">{toastMsg}</div>}

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

        {/* STEP 2: What stood out & What could improve */}
        {currentStep === 2 && (
          <div className="step-content step-2 animate-fade-in">
            <div className="step-title-row">
              <span className="step-tag">Step 2 of 3</span>
              <h2 className="step-heading">Tell us about your visit</h2>
            </div>

            <div className="service-selected-pill">
              <span>Service:</span> <strong>{getEffectiveService()}</strong>
            </div>

            {/* What stood out to you? (required) */}
            <div className="form-group">
              <label htmlFor="what-stood-out" className="form-label">
                What stood out to you? <span className="required-star">*</span>
              </label>
              <textarea
                id="what-stood-out"
                rows="3"
                className="form-textarea"
                value={whatStoodOut}
                onChange={(e) => setWhatStoodOut(e.target.value)}
                placeholder="e.g. Fast service, super friendly team, very clean environment, explained everything clearly..."
                required
              />
              <span className="field-hint">A few quick words or bullet points are plenty!</span>
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
                placeholder="e.g. Waiting area was a bit busy, parking was tight..."
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
                    <span className="spinner"></span> Generating AI Draft...
                  </span>
                ) : (
                  '✨ Generate Review →'
                )}
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Review Draft, Star Picker, Regenerate & Post */}
        {currentStep === 3 && (
          <div className="step-content step-3 animate-fade-in">
            <div className="step-title-row">
              <span className="step-tag">Step 3 of 3</span>
              <h2 className="step-heading">Your Ready-to-Post Review</h2>
            </div>

            {/* Star Rating Picker */}
            <div className="star-picker-section">
              <label className="form-label text-center">Your Rating</label>
              <StarRating rating={rating} onChange={setRating} size="lg" />
            </div>

            {/* Editable Draft Textarea */}
            <div className="form-group">
              <div className="form-label-row">
                <label htmlFor="draft-review-text" className="form-label">
                  Review Text (Feel free to edit)
                </label>
                <button
                  type="button"
                  className="btn-link-sm"
                  onClick={handleRegenerate}
                  disabled={generatingDraft}
                >
                  {generatingDraft ? 'Regenerating...' : '🔄 Regenerate wording'}
                </button>
              </div>

              <textarea
                id="draft-review-text"
                rows="6"
                className="form-textarea draft-textarea"
                value={draftText}
                onChange={(e) => setDraftText(e.target.value)}
                placeholder="Your generated review will appear here..."
              />
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
                {postingReview ? 'Confirming...' : 'Post to Google Reviews'}
              </button>

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
                  🔄 Regenerate
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: Success / Confirmation State */}
        {currentStep === 4 && (
          <div className="step-content step-4 animate-fade-in text-center">
            <div className="celebration-circle">🎉</div>
            <h2 className="success-heading">You are awesome!</h2>
            <p className="success-subtext">
              Thank you for supporting <strong>{business?.name}</strong>. Your feedback was copied to your clipboard so you can paste it directly onto Google.
            </p>

            <div className="review-preview-summary card-flat">
              <StarRating rating={rating} readOnly size="sm" />
              <p className="review-summary-quote">"{draftText}"</p>
            </div>

            <div className="mt-4">
              <button
                type="button"
                className="btn-secondary btn-block"
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
    </div>
  );
}
