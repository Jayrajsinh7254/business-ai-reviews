import React, { useState } from 'react';

export default function WhatsAppInviteModal({
  business,
  reviewUrl,
  onClose,
}) {
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [service, setService] = useState('');
  const [templateType, setTemplateType] = useState('friendly'); // 'friendly' | 'short' | 'offer'
  const [copied, setCopied] = useState(false);
  const [toast, setToast] = useState('');

  const bizName = business?.name || 'our business';

  // Construct message based on template
  const generateMessage = () => {
    const namePart = customerName.trim() ? `Hi ${customerName.trim()}!` : 'Hi there!';
    const servicePart = service.trim() ? ` for your ${service.trim()}` : '';

    if (templateType === 'short') {
      return `${namePart} Thanks for choosing ${bizName}! We'd love your feedback in 30 seconds — our AI will help write your review: ${reviewUrl}`;
    }

    if (templateType === 'offer') {
      return `${namePart} Thank you for visiting ${bizName}${servicePart}! Leave a quick Google review here: ${reviewUrl} and show it to us on your next visit for a special discount! 🎁`;
    }

    // Default 'friendly'
    return `${namePart} Thanks for visiting ${bizName}${servicePart} today! Could you take 30 seconds to share your experience? Our smart AI will help craft your review in one click: ${reviewUrl} ⭐`;
  };

  const messageText = generateMessage();

  const handleSendWhatsApp = () => {
    let cleanPhone = phone.replace(/[^0-9]/g, '');
    const encodedText = encodeURIComponent(messageText);

    let targetUrl = '';
    if (cleanPhone) {
      targetUrl = `https://wa.me/${cleanPhone}?text=${encodedText}`;
    } else {
      targetUrl = `https://wa.me/?text=${encodedText}`;
    }

    window.open(targetUrl, '_blank', 'noopener,noreferrer');
  };

  const handleSendSMS = () => {
    let cleanPhone = phone.replace(/[^0-9]/g, '');
    const encodedText = encodeURIComponent(messageText);
    const smsUrl = `sms:${cleanPhone}?body=${encodedText}`;
    window.location.href = smsUrl;
  };

  const handleCopyMessage = async () => {
    try {
      await navigator.clipboard.writeText(messageText);
      setCopied(true);
      setToast('✓ Message & review link copied to clipboard!');
      setTimeout(() => {
        setCopied(false);
        setToast('');
      }, 3000);
    } catch (err) {
      console.warn('Clipboard write error:', err);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content whatsapp-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="whatsapp-modal-title-row">
            <span className="whatsapp-icon-circle">💬</span>
            <div>
              <h3>Send WhatsApp & SMS Review Invite</h3>
              <p className="modal-subtitle-text">
                Invite recent customers to leave a review directly on their phone
              </p>
            </div>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose}>
            &times;
          </button>
        </div>

        <div className="modal-body">
          {toast && <div className="floating-toast">{toast}</div>}

          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Customer Name</label>
              <input
                type="text"
                className="form-input"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="e.g. Sarah Jenkins"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Phone Number (with Country Code)</label>
              <input
                type="tel"
                className="form-input"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. +1 555 123 4567 or +91 9876543210"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Service Received (Optional)</label>
            <input
              type="text"
              className="form-input"
              value={service}
              onChange={(e) => setService(e.target.value)}
              placeholder="e.g. Brake Repair, Haircut, Dinner..."
            />
          </div>

          {/* Template Selector */}
          <div className="form-group">
            <label className="form-label">Select Message Style</label>
            <div className="template-pills-row">
              <button
                type="button"
                className={`template-pill-btn ${templateType === 'friendly' ? 'active' : ''}`}
                onClick={() => setTemplateType('friendly')}
              >
                🌟 Warm & Friendly
              </button>
              <button
                type="button"
                className={`template-pill-btn ${templateType === 'short' ? 'active' : ''}`}
                onClick={() => setTemplateType('short')}
              >
                ⚡ Short & Quick
              </button>
              <button
                type="button"
                className={`template-pill-btn ${templateType === 'offer' ? 'active' : ''}`}
                onClick={() => setTemplateType('offer')}
              >
                🎁 Loyalty / Discount Offer
              </button>
            </div>
          </div>

          {/* Live Message Preview Box */}
          <div className="whatsapp-preview-box">
            <div className="whatsapp-preview-header">
              <span className="wa-dot"></span>
              <span className="wa-header-label">WhatsApp Live Message Preview</span>
            </div>
            <p className="whatsapp-preview-bubble">{messageText}</p>
          </div>

          {/* Action Buttons */}
          <div className="whatsapp-action-buttons">
            <button
              type="button"
              className="btn-whatsapp-send btn-block"
              onClick={handleSendWhatsApp}
            >
              <span className="wa-btn-icon">🟢</span>
              Launch & Send in WhatsApp
            </button>

            <div className="whatsapp-sub-actions">
              <button
                type="button"
                className="btn-secondary flex-1"
                onClick={handleSendSMS}
              >
                📱 Send via SMS
              </button>
              <button
                type="button"
                className="btn-secondary flex-1"
                onClick={handleCopyMessage}
              >
                {copied ? '✓ Copied!' : '📋 Copy Text'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
