import React from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * TrialExpiredModal
 * Full-screen blocking overlay shown when a user's 3-day free trial has ended
 * and they haven't upgraded. Provides WhatsApp contact and direct upgrade CTA.
 */
export default function TrialExpiredModal({ businessName }) {
  const navigate = useNavigate();

  const waText = encodeURIComponent(
    `Hi ReviewAssist team! My 3-day free trial for "${businessName || 'my business'}" has ended. I'd like to upgrade my plan to continue using the service. Please share the UPI QR / GPay details or activation instructions.`
  );

  return (
    <div className="trial-expired-overlay" role="dialog" aria-modal="true" aria-labelledby="trial-expired-title">
      <div className="trial-expired-modal animate-fade-in">
        {/* Header */}
        <div className="trial-expired-header">
          <div className="trial-expired-icon-ring">
            <span className="trial-expired-icon">⏰</span>
          </div>
          <div className="trial-expired-badge">Free Trial Ended</div>
        </div>

        {/* Body */}
        <div className="trial-expired-body">
          <h2 id="trial-expired-title" className="trial-expired-title">
            Your 3-Day Free Trial Has Ended
          </h2>
          <p className="trial-expired-desc">
            Thank you for trying ReviewAssist! Your trial period for{' '}
            <strong>{businessName || 'your business'}</strong> has expired.
            <br />
            <br />
            To continue collecting authentic Google reviews, using the QR standee, and accessing your dashboard — please choose a plan.
          </p>

          {/* What you'll lose callout */}
          <div className="trial-expired-features-box">
            <p className="trial-expired-features-title">🔒 Currently paused for you:</p>
            <ul className="trial-expired-features-list">
              <li>📱 Customer QR Review Page</li>
              <li>🤖 AI Review Generation (Gemini)</li>
              <li>💬 WhatsApp Inviter Tool</li>
              <li>🛡️ Negative Review Shield</li>
              <li>📊 Real-Time Analytics Dashboard</li>
            </ul>
          </div>

          {/* Pricing highlight */}
          <div className="trial-expired-pricing-row">
            <div className="trial-pricing-chip starter">
              <span className="chip-plan">Starter</span>
              <span className="chip-price">₹299/mo</span>
            </div>
            <div className="trial-pricing-chip pro popular">
              <span className="chip-badge">⭐ Most Popular</span>
              <span className="chip-plan">Pro Growth</span>
              <span className="chip-price">₹499/mo</span>
            </div>
            <div className="trial-pricing-chip enterprise">
              <span className="chip-plan">Enterprise</span>
              <span className="chip-price">₹799/mo</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="trial-expired-actions">
          <a
            href={`https://wa.me/919537370561?text=${waText}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-trial-whatsapp"
          >
            💬 Activate via WhatsApp / UPI (+91 95373 70561)
          </a>
          <button
            type="button"
            className="btn-trial-upgrade"
            onClick={() => navigate('/pricing')}
          >
            💎 View All Plans &amp; Pricing
          </button>
        </div>

        {/* Support note */}
        <p className="trial-expired-support-note">
          Questions? Email us at{' '}
          <a href="mailto:support.reviewassist@gmail.com">support.reviewassist@gmail.com</a>
          {' '}or WhatsApp <a href="https://wa.me/919537370561">+91 95373 70561</a>
        </p>
      </div>
    </div>
  );
}
