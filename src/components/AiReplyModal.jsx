import React, { useState } from 'react';

export default function AiReplyModal({
  review,
  business,
  onClose,
}) {
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [toast, setToast] = useState('');

  const bizName = business?.name || 'our team';
  const rating = Number(review?.rating) || 5;
  const customerText = review?.text || review?.draftText || 'Great experience!';
  const serviceType = review?.serviceType || 'your visit';

  // Generate 3 authentic AI owner replies based on rating & content
  const generateReplies = () => {
    if (rating === 5) {
      return [
        {
          label: '🌟 Warm & Grateful (Recommended)',
          text: `Thank you so much for the fantastic 5-star review! We're thrilled to hear you had such a great experience with ${serviceType}. The entire team at ${bizName} appreciates your support and we can't wait to welcome you back!`,
        },
        {
          label: '💼 Short & Professional',
          text: `Thank you for taking the time to share your feedback! We strive to deliver top-quality service every day, and we're so glad you were happy with your ${serviceType}. See you next time!`,
        },
        {
          label: '🤝 Community & Personal',
          text: `We truly appreciate your kind words! Knowing that you were happy with ${serviceType} means the world to our small team. Thank you for choosing ${bizName}!`,
        },
      ];
    }

    if (rating === 4) {
      return [
        {
          label: '👍 Grateful with Appreciation',
          text: `Thank you for the positive review and for choosing ${bizName}! We're really happy you had a good experience with ${serviceType}. We appreciate your feedback as we always strive for a 5-star standard!`,
        },
        {
          label: '🔧 Continuous Improvement',
          text: `Thanks for sharing your experience! We're glad the service went well and we've noted your feedback to make your next visit even smoother. We look forward to seeing you again soon!`,
        },
      ];
    }

    if (rating === 3) {
      return [
        {
          label: '⚖️ Balanced & Reassuring',
          text: `Thank you for your honest feedback regarding your recent visit for ${serviceType}. We're glad certain parts went well, but we always aim for excellence. We would love the chance to exceed your expectations on your next visit!`,
        },
        {
          label: '📞 Manager Reach-out',
          text: `Thank you for sharing your thoughts with us. We take all customer feedback seriously to improve our service speed and communication. Please feel free to reach out to us directly so we can ensure a 5-star experience next time!`,
        },
      ];
    }

    // 1 - 2 Stars
    return [
      {
        label: '🛠️ Manager Resolution & Apology',
        text: `We are truly sorry to hear that your experience with ${serviceType} fell short of expectations. This does not reflect the standard of service we hold ourselves to at ${bizName}. We would appreciate the opportunity to discuss this with you directly and make things right. Please contact us at your earliest convenience.`,
      },
      {
        label: '🤝 Sincere Accountability',
        text: `Thank you for bringing this to our attention. We apologize for the inconvenience and frustration you experienced. We are addressing this with our staff immediately to prevent it from happening again. We hope for the chance to regain your trust.`,
      },
    ];
  };

  const replies = generateReplies();

  const handleCopy = async (text, index) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setToast('✓ Owner reply copied to clipboard! Paste it into Google Business Profile.');
      setTimeout(() => {
        setCopiedIndex(null);
        setToast('');
      }, 3500);
    } catch (err) {
      console.warn('Clipboard write error:', err);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content ai-reply-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="ai-reply-title-row">
            <span className="ai-reply-icon-circle">🤖</span>
            <div>
              <h3>AI Review Reply Assistant</h3>
              <p className="modal-subtitle-text">
                Generate 1-click professional owner responses to boost Google rankings
              </p>
            </div>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose}>
            &times;
          </button>
        </div>

        <div className="modal-body">
          {toast && <div className="floating-toast">{toast}</div>}

          {/* Customer Review Summary Box */}
          <div className="customer-review-context-box">
            <div className="review-context-header">
              <span className="context-label">Customer's Review ({rating} Stars):</span>
              <span className="context-stars">{'★'.repeat(rating)}</span>
            </div>
            <p className="context-quote">"{customerText}"</p>
          </div>

          <h4 className="suggested-replies-heading">Select an AI-Crafted Response:</h4>

          <div className="replies-options-list">
            {replies.map((r, idx) => (
              <div key={idx} className="reply-option-card">
                <div className="reply-option-header">
                  <span className="reply-type-badge">{r.label}</span>
                  <button
                    type="button"
                    className={`btn-sm ${copiedIndex === idx ? 'btn-success-sm' : 'btn-primary-sm'}`}
                    onClick={() => handleCopy(r.text, idx)}
                  >
                    {copiedIndex === idx ? '✓ Copied!' : '📋 Copy Reply'}
                  </button>
                </div>
                <p className="reply-option-text">{r.text}</p>
              </div>
            ))}
          </div>

          <div className="google-reply-hint-box">
            <span>💡</span>
            <p>
              <strong>Pro SEO Tip:</strong> Google's local algorithm ranks businesses higher when owners reply to reviews within 24 hours. Copy your preferred reply above and paste it directly into your <strong>Google Business Profile</strong>!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
