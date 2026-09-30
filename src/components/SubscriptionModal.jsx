import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { PLANS, PLAN_LIST } from '../lib/plans';
import { useAuth } from '../context/AuthContext';
import { initiateRazorpayCheckout } from '../lib/razorpay';

export default function SubscriptionModal({ isOpen, onClose, selectedPlanId = null }) {
  const navigate = useNavigate();
  const { user, business, subscription, updateSubscriptionPlan } = useAuth();
  const [billingInterval, setBillingInterval] = useState('monthly');
  const [chosenPlan, setChosenPlan] = useState(selectedPlanId || subscription?.planId || 'pro');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  const [showCheckoutSuccess, setShowCheckoutSuccess] = useState(false);

  if (!isOpen) return null;

  const currentPlanId = subscription?.planId || 'starter';

  const handleSelectPlan = (planId) => {
    setChosenPlan(planId);
    setPaymentError('');
  };

  const activePlanObj = PLANS[chosenPlan.toUpperCase()] || PLANS.PRO;
  const price = billingInterval === 'annual' ? activePlanObj.annualPrice : activePlanObj.monthlyPrice;

  const handleProceedToRazorpay = async () => {
    if (chosenPlan === currentPlanId) {
      onClose();
      return;
    }

    setIsProcessing(true);
    setPaymentError('');

    try {
      const result = await initiateRazorpayCheckout({
        businessId: user?.businessId || business?.id || 'demo-1',
        planId: chosenPlan,
        billingInterval,
        customerName: user?.name || business?.name || '',
        customerEmail: user?.email || business?.email || '',
        planDisplayName: activePlanObj.name,
        amountInr: price,
      });

      await updateSubscriptionPlan(chosenPlan, billingInterval, {
        razorpayPaymentId: result.paymentId,
        razorpayOrderId: result.orderId,
        periodEnd: result.periodEnd,
      });

      try {
        confetti({
          particleCount: 90,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {}

      setShowCheckoutSuccess(true);
      setTimeout(() => {
        setShowCheckoutSuccess(false);
        onClose();
      }, 1800);
    } catch (err) {
      if (err.message !== 'Payment cancelled by user') {
        setPaymentError(err.message || 'Payment initiation failed. Opening checkout page...');
        // If popup script failed, fallback to full checkout page
        navigate(`/checkout?plan=${chosenPlan}&interval=${billingInterval}`);
        onClose();
      }
    } finally {
      setIsProcessing(false);
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
              <h3>Plan Successfully Updated!</h3>
              <p>
                Your business is now upgraded to <strong>{activePlanObj.name} Plan</strong>.
                All features and limits have been unlocked immediately.
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
                    Annual Billing <span className="discount-pill">Save 20%</span>
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
                        <div className="sub-plan-price-row">
                          <span className="price-currency">₹</span>
                          <span className="price-number">{planPrice.toLocaleString('en-IN')}</span>
                          <span className="price-period">/ mo</span>
                        </div>
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

              {/* External / Offline Payment Option */}
              <div className="offline-payment-callout">
                <div className="offline-payment-info">
                  <span className="offline-icon">🤝</span>
                  <div>
                    <strong className="offline-title">Direct / Offline Payment (UPI or Hand-to-Hand)</strong>
                    <p className="offline-desc">
                      Pay via direct UPI QR, bank transfer, or offline invoice. Admin will activate your tier instantly.
                    </p>
                  </div>
                </div>
                <a
                  href={`https://wa.me/919999999999?text=${encodeURIComponent(
                    `Hi ReviewAssist Admin, I would like to activate/renew the ${activePlanObj.name} plan (${billingInterval === 'annual' ? `₹${(activePlanObj.annualPrice * 12).toLocaleString('en-IN')}/yr` : `₹${activePlanObj.monthlyPrice.toLocaleString('en-IN')}/mo`}) for ${business?.name || user?.name || 'my business'}. Please share the UPI QR code or bank transfer details.`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-offline-wa"
                >
                  💬 Pay Offline via WhatsApp / UPI
                </a>
              </div>

              {/* Razorpay Checkout Summary Bar */}
              <div className="checkout-summary-bar">
                <div className="summary-left">
                  <div className="payment-method-chip">
                    <span className="card-brand-icon">💳</span>
                    <span className="card-mask">Razorpay Secured</span>
                    <span className="card-test-badge">UPI / Card / NetBanking</span>
                  </div>
                  <span className="summary-charge-desc">
                    Total: <strong>₹{price.toLocaleString('en-IN')}</strong> / {billingInterval === 'annual' ? 'month (billed annually)' : 'month'}. Cancel anytime.
                  </span>
                </div>

                <button
                  type="button"
                  className="btn-primary btn-lg btn-confirm-sub"
                  onClick={handleProceedToRazorpay}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <span className="btn-loading-state">
                      <span className="spinner"></span> Opening Razorpay...
                    </span>
                  ) : chosenPlan === currentPlanId ? (
                    'Keep Current Plan'
                  ) : (
                    `Pay ₹${(billingInterval === 'annual' ? activePlanObj.annualPrice * 12 : activePlanObj.monthlyPrice).toLocaleString('en-IN')} via Razorpay`
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
