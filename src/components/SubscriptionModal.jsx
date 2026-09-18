import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { PLANS, PLAN_LIST } from '../lib/plans';
import { useAuth } from '../context/AuthContext';

export default function SubscriptionModal({ isOpen, onClose, selectedPlanId = null }) {
  const { subscription, updateSubscriptionPlan } = useAuth();
  const [billingInterval, setBillingInterval] = useState('monthly');
  const [chosenPlan, setChosenPlan] = useState(selectedPlanId || subscription?.planId || 'pro');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showCheckoutSuccess, setShowCheckoutSuccess] = useState(false);
  const [simulatedCard, setSimulatedCard] = useState({
    number: '•••• •••• •••• 4242',
    expiry: '12/28',
    cvc: '•••',
    name: 'Business Owner Card',
  });

  if (!isOpen) return null;

  const currentPlanId = subscription?.planId || 'starter';

  const handleSelectPlan = (planId) => {
    setChosenPlan(planId);
  };

  const handleConfirmSubscription = async () => {
    setIsProcessing(true);
    try {
      // Simulate network checkout latency
      await new Promise((resolve) => setTimeout(resolve, 800));
      await updateSubscriptionPlan(chosenPlan, billingInterval);

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
      console.error('Subscription update failed:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const activePlanObj = PLANS[chosenPlan.toUpperCase()] || PLANS.PRO;
  const price = billingInterval === 'annual' ? activePlanObj.annualPrice : activePlanObj.monthlyPrice;

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
                          <span className="price-currency">{plan.currency}</span>
                          <span className="price-number">{planPrice}</span>
                          <span className="price-period">/ month</span>
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

              {/* Simulated Card & Summary Box */}
              <div className="checkout-summary-bar">
                <div className="summary-left">
                  <div className="payment-method-chip">
                    <span className="card-brand-icon">💳</span>
                    <span className="card-mask">Visa ending in 4242</span>
                    <span className="card-test-badge">Live Sandbox</span>
                  </div>
                  <span className="summary-charge-desc">
                    Total: <strong>${price}</strong> / {billingInterval === 'annual' ? 'month (billed annually)' : 'month'}. Cancel or change anytime.
                  </span>
                </div>

                <button
                  type="button"
                  className="btn-primary btn-lg btn-confirm-sub"
                  onClick={handleConfirmSubscription}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <span className="btn-loading-state">
                      <span className="spinner"></span> Processing...
                    </span>
                  ) : chosenPlan === currentPlanId ? (
                    'Keep Active Plan'
                  ) : (
                    `Confirm & Activate ${activePlanObj.name}`
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
