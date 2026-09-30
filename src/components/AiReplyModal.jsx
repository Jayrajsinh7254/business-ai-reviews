import React, { useState, useEffect } from 'react';
import {
  generateAiReplies,
  calculateReplySeoScore,
  SAMPLE_REVIEWS,
  REPLY_TONES,
} from '../utils/aiReplyEngine';
import { isFeatureAllowed } from '../lib/plans';
import { hasPermission, PERMISSIONS } from '../lib/rbac';

export default function AiReplyModal({
  review,
  business,
  planId = 'starter',
  userRole = 'business_owner',
  onOpenUpgradeModal,
  onClose,
}) {
  const isAllowedByPlan = isFeatureAllowed(planId, 'aiReplyCopilot');
  const isAllowedByRole = hasPermission(userRole, PERMISSIONS.REVIEWS_AI_REPLY);

  const isInitialPrivate = Boolean(review?.isPrivateIntercept);
  const isInitialExternal = Boolean(!review || review.isExternal);

  // Mode: 'context' (existing review/intercept) or 'paste' (external Google review)
  const [activeMode, setActiveMode] = useState(isInitialExternal ? 'paste' : 'context');

  // Input States
  const [rating, setRating] = useState(Number(review?.rating) || 5);
  const [customerName, setCustomerName] = useState(review?.customerName || '');
  const [customerText, setCustomerText] = useState(
    review?.text || review?.draftText || review?.issue || ''
  );
  const [serviceType, setServiceType] = useState(
    review?.serviceType || (business?.services && business.services[0]) || ''
  );

  // Owner Customization State
  const [ownerSignature, setOwnerSignature] = useState(
    business?.ownerName || `The Team at ${business?.name || 'ReviewAssist'}`
  );
  const [businessCity, setBusinessCity] = useState(business?.city || '');
  const [selectedTone, setSelectedTone] = useState(
    Number(review?.rating || 5) <= 2 || isInitialPrivate ? 'resolution' : 'warm'
  );

  // Generation & Output State
  const [replies, setReplies] = useState([]);
  const [editedReplies, setEditedReplies] = useState({});
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [toast, setToast] = useState('');
  const [isRegenerating, setIsRegenerating] = useState(false);

  const bizName = business?.name || 'our business';
  const bizCategory = business?.category || 'business';
  const googleUrl = business?.googleReviewUrl || 'https://business.google.com';

  // Generate replies whenever inputs change
  const refreshReplies = (forcedTone = selectedTone) => {
    setIsRegenerating(true);
    setTimeout(() => {
      const generated = generateAiReplies({
        rating,
        customerName,
        customerText,
        serviceType,
        businessName: bizName,
        businessCategory: bizCategory,
        businessCity,
        ownerSignature,
        tone: forcedTone,
        isPrivateIntercept: isInitialPrivate,
        customerContact: review?.customerContact || '',
      });

      setReplies(generated);
      // Reset edited overrides
      const initialEdited = {};
      generated.forEach((r, idx) => {
        initialEdited[idx] = r.text;
      });
      setEditedReplies(initialEdited);
      setIsRegenerating(false);
    }, 180);
  };

  useEffect(() => {
    refreshReplies(selectedTone);
  }, [rating, serviceType, ownerSignature, businessCity, selectedTone]);

  // Handle switching tone
  const handleToneChange = (toneId) => {
    setSelectedTone(toneId);
    refreshReplies(toneId);
  };

  // Load a quick sample
  const handleLoadSample = (sample) => {
    setRating(sample.rating);
    setCustomerName(sample.customerName);
    setCustomerText(sample.text);
    setServiceType(sample.serviceType);
    if (sample.rating <= 2) {
      setSelectedTone('resolution');
    } else if (sample.rating === 3) {
      setSelectedTone('warm');
    } else {
      setSelectedTone('seo');
    }
    showToast(`Loaded sample: ${sample.label}`);
  };

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  };

  const handleCopy = async (text, index) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      showToast('✓ AI reply copied to clipboard! Ready to paste into Google Business Profile.');
      setTimeout(() => {
        setCopiedIndex(null);
      }, 3500);
    } catch (err) {
      console.warn('Clipboard write error:', err);
    }
  };

  const handleOpenGoogle = () => {
    window.open(googleUrl, '_blank', 'noopener,noreferrer');
  };

  const handleOpenWhatsAppCustomer = (replyContent) => {
    const rawContact = review?.customerContact || '';
    const phone = rawContact.replace(/[^0-9]/g, '');
    const waUrl = phone
      ? `https://wa.me/${phone}?text=${encodeURIComponent(replyContent)}`
      : `https://wa.me/?text=${encodeURIComponent(replyContent)}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-content ai-copilot-studio-modal"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Studio Top Header */}
        <div className="modal-header ai-copilot-studio-header">
          <div className="ai-reply-title-row">
            <div className="ai-copilot-brand-icon">🤖</div>
            <div>
              <div className="ai-copilot-title-flex">
                <h3 className="ai-copilot-heading">AI Owner Reply Copilot</h3>
                <span className="copilot-pro-badge">PRO COPILOT</span>
                {isInitialPrivate && (
                  <span className="copilot-shield-badge">🛡️ Shield Intercept</span>
                )}
              </div>
              <p className="modal-subtitle-text">
                Craft 1-click SEO-optimized, human responses for Google Business Profile & protect your 5-star reputation.
              </p>
            </div>
          </div>

          <div className="ai-copilot-header-actions">
            <button
              type="button"
              className="btn-google-direct-tab"
              onClick={handleOpenGoogle}
              title="Open Google Business Profile review manager in new tab"
            >
              <span>🌐</span> Open Google Reviews
            </button>
            <button type="button" className="modal-close-btn" onClick={onClose}>
              &times;
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="modal-body ai-copilot-body">
          {toast && <div className="floating-toast animate-bounce">{toast}</div>}

          {!isAllowedByPlan ? (
            <div className="feature-locked-modal-state text-center">
              <div className="locked-shield-icon">🤖🔒</div>
              <h3 className="locked-state-heading">AI Owner Reply Copilot is a Pro Feature</h3>
              <p className="locked-state-desc">
                Your business is currently on the <strong>Starter (Basic)</strong> plan. 1-click SEO-optimized AI responses with Google ranking keyword integration are available exclusively on the <strong>Pro Growth</strong> and <strong>Enterprise</strong> plans.
              </p>

              <div className="locked-feature-perks-card">
                <div className="locked-perk-line"><span>✓</span> 5 Specialized AI Tones (SEO Boost, Grateful, De-escalation)</div>
                <div className="locked-perk-line"><span>✓</span> 1.4x Higher Google Maps Local Pack Ranking</div>
                <div className="locked-perk-line"><span>✓</span> 1-Click Clipboard Copy & Google Business Profile Sync</div>
              </div>

              <div className="locked-state-actions">
                <button
                  type="button"
                  className="btn-primary btn-lg"
                  onClick={onOpenUpgradeModal}
                >
                  💎 Upgrade to Pro Growth (₹1,299/mo)
                </button>
                <button
                  type="button"
                  className="btn-secondary btn-lg"
                  onClick={onClose}
                >
                  Close
                </button>
              </div>
            </div>
          ) : !isAllowedByRole ? (
            <div className="feature-locked-modal-state text-center">
              <div className="locked-shield-icon">⚠️</div>
              <h3 className="locked-state-heading">Role Permission Restricted</h3>
              <p className="locked-state-desc">
                Only Business Owners and authorized managers can generate and post official owner responses. Please contact your business owner.
              </p>
              <button type="button" className="btn-secondary btn-lg" onClick={onClose}>
                Close
              </button>
            </div>
          ) : (
            <>
              {/* Mode Switcher Tabs */}
              {!isInitialPrivate && (
                <div className="copilot-mode-tabs">
                  <button
                    type="button"
                    className={`copilot-mode-tab-btn ${activeMode === 'context' ? 'active' : ''}`}
                    onClick={() => setActiveMode('context')}
                  >
                    <span>💬</span> Selected Review
                  </button>
                  <button
                    type="button"
                    className={`copilot-mode-tab-btn ${activeMode === 'paste' ? 'active' : ''}`}
                    onClick={() => setActiveMode('paste')}
                  >
                    <span>📋</span> Paste Any External Google Review
                  </button>
                </div>
              )}

          {/* Context Mode View */}
          {activeMode === 'context' && (
            <div className={`customer-review-context-box ${isInitialPrivate ? 'shield-border' : ''}`}>
              <div className="review-context-header">
                <div className="context-left">
                  <span className="context-label">
                    {isInitialPrivate ? '🛡️ Intercepted Customer Complaint:' : "Customer's Review:"}
                  </span>
                  {customerName && <span className="context-customer-name">— {customerName}</span>}
                  {review?.customerContact && (
                    <span className="context-customer-contact">📱 {review.customerContact}</span>
                  )}
                </div>
                <div className="context-stars">
                  {'★'.repeat(rating)}{'☆'.repeat(Math.max(0, 5 - rating))}
                </div>
              </div>
              <p className="context-quote">
                "{customerText || 'Customer provided rating without text comments.'}"
              </p>
              {serviceType && (
                <div className="context-service-tag">
                  <span>Service:</span> <strong>{serviceType}</strong>
                </div>
              )}
            </div>
          )}

          {/* Paste External Review Mode */}
          {activeMode === 'paste' && (
            <div className="external-review-paste-container animate-fade-in">
              <div className="paste-mode-header-row">
                <span className="paste-mode-label">Paste Review from Google Maps or Swiggy / Zomato:</span>
                {/* Sample Presets */}
                <div className="sample-presets-group">
                  <span className="preset-label">Test Samples:</span>
                  {SAMPLE_REVIEWS.map((sample, idx) => (
                    <button
                      key={idx}
                      type="button"
                      className="btn-preset-pill"
                      onClick={() => handleLoadSample(sample)}
                    >
                      {sample.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="external-inputs-grid">
                {/* Star Rating Picker */}
                <div className="input-group-compact">
                  <label className="input-label-sm">Star Rating Received:</label>
                  <div className="rating-selector-buttons">
                    {[5, 4, 3, 2, 1].map((star) => (
                      <button
                        key={star}
                        type="button"
                        className={`star-pick-btn ${rating === star ? 'selected' : ''}`}
                        onClick={() => {
                          setRating(star);
                          if (star <= 2) setSelectedTone('resolution');
                        }}
                      >
                        {star} ★
                      </button>
                    ))}
                  </div>
                </div>

                {/* Reviewer Name */}
                <div className="input-group-compact">
                  <label className="input-label-sm">Reviewer Name (Optional):</label>
                  <input
                    type="text"
                    className="form-input-sm"
                    placeholder="e.g. Priya Sharma"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                  />
                </div>

                {/* Service Mention */}
                <div className="input-group-compact">
                  <label className="input-label-sm">Service Mentioned:</label>
                  <input
                    type="text"
                    className="form-input-sm"
                    placeholder="e.g. Oil Change, Hair Spa, Dinner"
                    value={serviceType}
                    onChange={(e) => setServiceType(e.target.value)}
                  />
                </div>
              </div>

              {/* Review Textarea */}
              <div className="external-textarea-wrap">
                <textarea
                  className="external-review-textarea"
                  rows={3}
                  placeholder="Paste the customer's Google review text here..."
                  value={customerText}
                  onChange={(e) => setCustomerText(e.target.value)}
                />
                {customerText && (
                  <button
                    type="button"
                    className="btn-clear-textarea"
                    onClick={() => setCustomerText('')}
                  >
                    ✕ Clear
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Tone & Strategy Selector */}
          <div className="copilot-tone-section">
            <div className="tone-section-header">
              <span className="section-label">Select Response Strategy & Tone:</span>
              <span className="tone-recommended-badge">
                {rating <= 2 ? '🛡️ De-escalation Recommended for ≤2★' : '⚡ Local SEO Recommended'}
              </span>
            </div>

            <div className="tone-options-grid">
              {REPLY_TONES.map((t) => {
                const isSelected = selectedTone === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    className={`tone-card-btn ${isSelected ? 'active' : ''}`}
                    onClick={() => handleToneChange(t.id)}
                  >
                    <div className="tone-card-title">{t.label}</div>
                    <div className="tone-card-desc">{t.tagline}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Owner Signature & Location Settings */}
          <div className="copilot-signature-bar">
            <div className="signature-input-item">
              <label className="sig-label">Owner Sign-off:</label>
              <input
                type="text"
                className="sig-input"
                placeholder="e.g. Marcus Vance (Owner)"
                value={ownerSignature}
                onChange={(e) => setOwnerSignature(e.target.value)}
              />
            </div>
            <div className="signature-input-item">
              <label className="sig-label">Business Location / City (for SEO):</label>
              <input
                type="text"
                className="sig-input"
                placeholder="e.g. Ahmedabad, Gujarat"
                value={businessCity}
                onChange={(e) => setBusinessCity(e.target.value)}
              />
            </div>
            <button
              type="button"
              className={`btn-regenerate-replies ${isRegenerating ? 'loading' : ''}`}
              onClick={() => refreshReplies()}
              disabled={isRegenerating}
            >
              <span>{isRegenerating ? '⏳' : '🔄'}</span> Regenerate Fresh AI
            </button>
          </div>

          {/* Generated AI Replies Output List */}
          <div className="generated-replies-container">
            <div className="replies-list-header">
              <h4 className="suggested-replies-heading">
                AI-Generated Owner Replies ({replies.length} variations):
              </h4>
              <span className="replies-edit-hint">
                ✏️ Click inside any reply box below to customize words before copying
              </span>
            </div>

            <div className="replies-options-list">
              {replies.map((r, idx) => {
                const currentText = editedReplies[idx] ?? r.text;
                const seoScoreObj = calculateReplySeoScore(currentText, {
                  businessName: bizName,
                  serviceType,
                  tone: selectedTone,
                });

                return (
                  <div key={r.id || idx} className="reply-option-card">
                    <div className="reply-option-header">
                      <div className="reply-badge-group">
                        <span className="reply-type-badge">{r.badge || r.title}</span>
                        <span
                          className={`seo-score-pill ${
                            seoScoreObj.score >= 80 ? 'high' : 'medium'
                          }`}
                        >
                          ⚡ Local SEO Score: {seoScoreObj.score}/100
                        </span>
                      </div>

                      <div className="reply-action-buttons">
                        <button
                          type="button"
                          className={`btn-reply-action copy ${
                            copiedIndex === idx ? 'btn-success-sm' : 'btn-primary-sm'
                          }`}
                          onClick={() => handleCopy(currentText, idx)}
                        >
                          {copiedIndex === idx ? '✓ Copied!' : '📋 Copy Reply'}
                        </button>

                        {isInitialPrivate && review?.customerContact && (
                          <button
                            type="button"
                            className="btn-reply-action wa"
                            onClick={() => handleOpenWhatsAppCustomer(currentText)}
                            title="Send this response to customer via WhatsApp"
                          >
                            💬 Send WhatsApp
                          </button>
                        )}

                        <button
                          type="button"
                          className="btn-reply-action google"
                          onClick={handleOpenGoogle}
                          title="Open Google Business Profile to paste"
                        >
                          🚀 Open Google
                        </button>
                      </div>
                    </div>

                    {/* Editable Text Area for Customizing Reply */}
                    <div className="reply-text-editable-wrap">
                      <textarea
                        className="reply-editable-textarea"
                        rows={4}
                        value={currentText}
                        onChange={(e) => {
                          setEditedReplies((prev) => ({
                            ...prev,
                            [idx]: e.target.value,
                          }));
                        }}
                      />
                    </div>

                    {/* Footer info: SEO tags detected */}
                    <div className="reply-card-footer-meta">
                      <div className="meta-seo-tags">
                        {seoScoreObj.items.map((it, i) => (
                          <span
                            key={i}
                            className={`seo-check-tag ${it.passed ? 'pass' : 'fail'}`}
                          >
                            {it.passed ? '✓' : '•'} {it.label}
                          </span>
                        ))}
                      </div>
                      <span className="reply-word-count">
                        {currentText.trim().split(/\s+/).length} words
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Pro Local SEO Educational Banner */}
          <div className="google-reply-hint-box seo-pro-banner">
            <span className="banner-icon">📈</span>
            <div className="banner-content">
              <strong>How Owner Replies Boost Google Local Pack Rankings:</strong>
              <p>
                Google algorithm studies show that businesses with a <strong>&gt;85% owner reply rate</strong> rank up to <strong>1.4x higher</strong> in Google Maps search. By mentioning specific services (e.g. <em>"{serviceType || 'your service'}"</em>) and your city in owner replies, you feed high-intent relevance signals directly into Google's local indexing engine!
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  </div>
</div>
  );
}
