import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { PLANS, PLAN_LIST } from '../lib/plans';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
export default function SubscriptionModal({ isOpen, onClose, selectedPlanId = null }) {
  const navigate = useNavigate();
  const { user, business, subscription } = useAuth();
  const [billingInterval, setBillingInterval] = useState('monthly');
  const [chosenPlan, setChosenPlan] = useState(selectedPlanId || subscription?.planId || 'pro');
  const [paymentError, setPaymentError] = useState('');
  const [showCheckoutSuccess, setShowCheckoutSuccess] = useState(false);
  const [upiReference, setUpiReference] = useState('');
  const [submittingUpi, setSubmittingUpi] = useState(false);

  if (!isOpen) return null;

  const currentPlanId = subscription?.planId || 'starter';

  const handleSelectPlan = (planId) => {
    setChosenPlan(planId);
    setPaymentError('');
  };

  const activePlanObj = PLANS[chosenPlan.toUpperCase()] || PLANS.PRO;
  const price = billingInterval === 'annual' ? activePlanObj.annualPrice : activePlanObj.monthlyPrice;
  const totalAmount = billingInterval === 'annual'
    ? (activePlanObj.annualTotalAmount || activePlanObj.annualPrice * 12)
    : activePlanObj.monthlyPrice;

  const handleSubmitUpi = async (event) => {
    event.preventDefault();
    if (!upiReference.trim()) return;
    setSubmittingUpi(true);
    setPaymentError('');
    try {
      await api.submitManualPaymentRequest({
        businessId: user?.businessId || business?.id,
        planId: activePlanObj.id,
        billingInterval,
        amount: totalAmount,
        upiReference,
      });
      setUpiReference('');
      setShowCheckoutSuccess(true);
    } catch (err) {
      setPaymentError(err.message || 'Could not submit UPI payment details.');
    } finally {
      setSubmittingUpi(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content modal-subscription-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <span className="modal-badge-tag">💎 SaaS Subscription Tier</span>
            <h3 className="modal-title">Upgrade Your ReviewAssist Plan</h3>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose}>
            &times;
          </button>
        </div>

        <div className="modal-body subscription-modal-body">
          {showCheckoutSuccess ? (
            <div className="checkout-success-state text-center animate-fade-in">
              <div className="checkout-success-icon">🎉</div>
              <h3>Payment Submitted for Verification</h3>
              <p>
                Your request for the <strong>{activePlanObj.name} Plan</strong> was submitted.
                The plan will activate after the admin verifies your UPI payment.
              </p>
            </div>
          ) : (
            <>
              {/* Billing Interval Toggle */}
              <div className="billing-interval-toggle-container">
                <div className="interval-toggle-pill">
                  <button
                    type="button"
                    className={`interval-toggle-btn ${billingInterval === 'monthly' ? 'active' : ''}`}
                    onClick={() => setBillingInterval('monthly')}
                  >
                    Monthly Billing
                  </button>
                  <button
                    type="button"
                    className={`interval-toggle-btn ${billingInterval === 'annual' ? 'active' : ''}`}
                    onClick={() => setBillingInterval('annual')}
                  >
                    Annual Billing <span className="discount-pill">Save up to 50% 🪔</span>
                  </button>
                </div>
              </div>

              {/* Plans Comparison Grid */}
              <div className="sub-modal-plans-grid">
                {PLAN_LIST.map((plan) => {
                  const isCurrent = plan.id === currentPlanId;
                  const isSelected = plan.id === chosenPlan;
                  const planPrice = billingInterval === 'annual' ? plan.annualPrice : plan.monthlyPrice;

                  return (
                    <div
                      key={plan.id}
                      className={`sub-plan-card ${isSelected ? 'selected' : ''} ${plan.isPopular ? 'popular' : ''}`}
                      onClick={() => handleSelectPlan(plan.id)}
                    >
                      {plan.badge && <span className="sub-card-badge">{plan.badge}</span>}
                      {isCurrent && <span className="current-plan-pill">Active Plan</span>}

                      <div className="sub-card-header">
                        <h4 className="sub-plan-name">{plan.name}</h4>
                        <div className="sub-plan-price-row" style={{ flexWrap: 'wrap', gap: '6px', alignItems: 'baseline' }}>
                          <span className="price-currency">₹</span>
                          <span className="price-number">{planPrice.toLocaleString('en-IN')}</span>
                          <span className="price-period">/ mo</span>
                          <span style={{ textDecoration: 'line-through', color: '#94a3b8', fontSize: '0.95rem' }}>
                            ₹{plan.originalMonthlyPrice}
                          </span>
                        </div>
                        <div style={{
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          color: billingInterval === 'annual' ? '#15803d' : '#ea580c',
                          background: billingInterval === 'annual' ? '#f0fdf4' : '#fff7ed',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          margin: '4px 0 6px',
                          display: 'inline-block'
                        }}>
                          🪔 {billingInterval === 'annual' ? plan.annualSavingsText : plan.diwaliDiscountText}
                        </div>
                        {billingInterval === 'annual' && (
                          <div style={{ fontSize: '0.74rem', color: '#0369a1', fontWeight: 600, marginBottom: '6px' }}>
                            Billed ₹{plan.annualTotalAmount?.toLocaleString('en-IN')}/yr • {plan.annualPerk}
                          </div>
                        )}
                        <p className="sub-plan-tagline">{plan.tagline}</p>
                      </div>

                      <ul className="sub-features-list">
                        {plan.features.slice(0, 5).map((f, i) => (
                          <li key={i} className="sub-feature-item">
                            <span className="check-icon">✓</span>
                            <span>{f}</span>
                          </li>
                        ))}
                      </ul>

                      <button
                        type="button"
                        className={`btn-select-plan ${isSelected ? 'btn-selected' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectPlan(plan.id);
                        }}
                      >
                        {isCurrent && isSelected
                          ? '✓ Current Plan'
                          : isSelected
                          ? 'Selected'
                          : 'Select Plan'}
                      </button>
                    </div>
                  );
                })}
              </div>

              {paymentError && (
                <div className="checkout-error-banner" style={{ marginTop: '12px' }}>
                  <span>⚠️</span>
                  <span>{paymentError}</span>
                </div>
              )}

              {/* Separate UPI and WhatsApp payment options */}
              <div className="offline-payment-callout">
                <div className="offline-payment-info">
                  <span className="offline-icon">🤝</span>
                  <div>
                    <strong className="offline-title">Choose your payment method</strong>
                    <p className="offline-desc">
                      Selected Tier: <strong>{activePlanObj.name} — ₹{totalAmount.toLocaleString('en-IN')}</strong>. UPI payment requires admin verification.
                    </p>
                  </div>
                </div>
                <div style={{ display: 'grid', gap: '10px', marginTop: '12px' }}>
                  <div>
                    <div className="offline-desc">
                      UPI ID: <strong>{import.meta.env.VITE_REVIEWASSIST_UPI_ID || 'Configure VITE_REVIEWASSIST_UPI_ID'}</strong>
                    </div>
                    <form onSubmit={handleSubmitUpi} style={{ display: 'flex', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
                      <input
                        className="form-input"
                        value={upiReference}
                        onChange={(event) => setUpiReference(event.target.value)}
                        placeholder="UPI transaction reference / UTR"
                        aria-label="UPI transaction reference"
                        required
                        style={{ flex: '1 1 220px' }}
                      />
                      <button type="submit" className="btn-primary" disabled={submittingUpi || !upiReference.trim()}>
                        {submittingUpi ? 'Submitting...' : 'Pay via UPI'}
                      </button>
                    </form>
                  </div>
                  <a
                    href={`https://wa.me/919537370561?text=${encodeURIComponent(
                      `Hi ReviewAssist Admin, I need help activating the ${activePlanObj.name} plan (${billingInterval === 'annual' ? `₹${totalAmount.toLocaleString('en-IN')}/yr` : `₹${totalAmount.toLocaleString('en-IN')}/mo`}) for ${business?.name || user?.name || 'my business'}.`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-offline-wa"
                  >
                    💬 Ask for help via WhatsApp
                  </a>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
