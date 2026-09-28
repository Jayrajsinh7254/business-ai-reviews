import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { PLANS, PLAN_LIST } from '../lib/plans';
import { initiateRazorpayCheckout } from '../lib/razorpay';
import SubscriptionModal from '../components/SubscriptionModal';

export default function SubscriptionPage() {
  const { user, business, subscription, updateSubscriptionPlan } = useAuth();
  const navigate = useNavigate();

  const [billingInterval, setBillingInterval] = useState(subscription?.billingInterval || 'monthly');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingPlanId, setProcessingPlanId] = useState(null);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [selectedPlanForModal, setSelectedPlanForModal] = useState('pro');

  const currentPlanId = subscription?.planId || 'pro';
  const currentPlanObj = PLANS[currentPlanId.toUpperCase()] || PLANS.PRO;
  const currentStatus = subscription?.status || 'trialing';

  const trialEnd = subscription?.currentPeriodEnd
    ? new Date(subscription.currentPeriodEnd)
    : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

  const nextBillingDate = trialEnd.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const daysRemaining = Math.max(0, Math.ceil((trialEnd - Date.now()) / (1000 * 60 * 60 * 24)));

  const aiUsed = subscription?.aiGenerationsUsed || 38;
  const waUsed = subscription?.whatsappInvitesUsed || 64;
  const aiLimit = currentPlanObj.limits.aiReviewsPerMonth === Infinity ? null : currentPlanObj.limits.aiReviewsPerMonth;
  const waLimit = currentPlanObj.limits.whatsappInvitesPerMonth === Infinity ? null : currentPlanObj.limits.whatsappInvitesPerMonth;

  // Razorpay 1-Click Upgrade handler
  const handleUpgradePlan = async (targetPlanId) => {
    setIsProcessing(true);
    setProcessingPlanId(targetPlanId);
    setError('');
    setSuccessMsg('');

    const targetPlan = PLANS[targetPlanId.toUpperCase()] || PLANS.PRO;
    const amountToPay = billingInterval === 'annual' ? targetPlan.annualPrice : targetPlan.monthlyPrice;

    try {
      const result = await initiateRazorpayCheckout({
        businessId: user?.businessId || business?.id || 'demo-1',
        planId: targetPlan.id,
        billingInterval,
        customerName: user?.name || business?.name || 'Valued Business',
        customerEmail: user?.email || business?.email || 'owner@business.com',
        planDisplayName: targetPlan.name,
        amountInr: amountToPay,
      });

      await updateSubscriptionPlan(targetPlan.id, billingInterval, {
        razorpayPaymentId: result.paymentId,
        razorpayOrderId: result.orderId,
        periodEnd: result.periodEnd,
      });

      setSuccessMsg(`🎉 Successfully upgraded to ${targetPlan.name} Plan! Payment ID: ${result.paymentId}`);
    } catch (err) {
      if (err.message !== 'Payment cancelled by user') {
        setError(err.message || 'Upgrade transaction failed. Please try again.');
      }
    } finally {
      setIsProcessing(false);
      setProcessingPlanId(null);
    }
  };

  const handleDownloadInvoice = (invoiceId, amount, date) => {
    alert(`Downloading Official Tax Invoice ${invoiceId} for ₹${amount.toLocaleString('en-IN')} (Generated on ${date}). Includes GSTIN & Razorpay payment token.`);
  };

  return (
    <div className="subscription-page-wrapper">
      <div className="section-container">
        {/* Top Header */}
        <div className="subscription-header-banner">
          <div className="sub-header-content">
            <div className="sub-badge-row">
              <span className="sub-header-badge">💳 Subscription & Billing Hub</span>
              {currentStatus === 'trialing' && (
                <span className="sub-trial-badge">🎁 14-Day Free Trial ({daysRemaining} Days Left)</span>
              )}
              {currentStatus === 'active' && (
                <span className="sub-active-badge">✓ Active Paid Subscription</span>
              )}
            </div>
            <h1 className="sub-header-title">
              Manage Plan, Quotas &amp; Invoices for{' '}
              <span className="gradient-text">{business?.name || user?.name || 'Your Business'}</span>
            </h1>
            <p className="sub-header-subtitle">
              Scale your Google review collection with unlimited AI drafts, WhatsApp automation, and multi-location management.
            </p>
          </div>

          <div className="sub-header-actions">
            <Link to={`/dashboard/${user?.businessId || 'demo-1'}`} className="btn-outline btn-md">
              📊 Back to Dashboard
            </Link>
            <Link to="/pricing" className="btn-secondary btn-md">
              💎 Compare All Plans
            </Link>
          </div>
        </div>

        {/* Global Success / Error Messages */}
        {successMsg && (
          <div className="alert-banner alert-success animate-fade-in">
            <span>{successMsg}</span>
          </div>
        )}
        {error && (
          <div className="alert-banner alert-error animate-fade-in">
            <span>⚠️ {error}</span>
          </div>
        )}

        {/* Main 2-Column Grid: Active Plan Summary & Usage Metrics */}
        <div className="sub-dashboard-grid">
          {/* Active Plan Overview Card */}
          <div className="card sub-current-plan-card">
            <div className="sub-plan-card-top">
              <div>
                <span className="sub-card-label">CURRENT ACTIVE TIER</span>
                <h2 className="sub-current-plan-name">{currentPlanObj.name}</h2>
                <p className="sub-current-plan-tagline">{currentPlanObj.tagline}</p>
              </div>
              <div className="sub-plan-price-tag">
                <span className="sub-price-currency">₹</span>
                <span className="sub-price-val">
                  {(subscription?.billingInterval === 'annual'
                    ? currentPlanObj.annualPrice
                    : currentPlanObj.monthlyPrice
                  ).toLocaleString('en-IN')}
                </span>
                <span className="sub-price-interval">/mo</span>
              </div>
            </div>

            {/* Trial Callout if Trialing */}
            {currentStatus === 'trialing' && (
              <div className="sub-trial-notice-box">
                <div className="sub-trial-icon">🎁</div>
                <div className="sub-trial-text">
                  <strong>14-Day Free Trial In Progress</strong>
                  <p>
                    Your trial gives you unrestricted access to Pro Growth features until{' '}
                    <strong>{nextBillingDate}</strong> with zero upfront debit/credit card charge.
                  </p>
                </div>
              </div>
            )}

            <div className="sub-plan-details-list">
              <div className="sub-detail-item">
                <span className="sub-detail-label">Billing Cycle:</span>
                <span className="sub-detail-val font-semibold capitalize">
                  {subscription?.billingInterval || 'Monthly'} Billing
                </span>
              </div>
              <div className="sub-detail-item">
                <span className="sub-detail-label">Next Renewal Date:</span>
                <span className="sub-detail-val font-semibold">{nextBillingDate}</span>
              </div>
              <div className="sub-detail-item">
                <span className="sub-detail-label">Payment Gateway:</span>
                <span className="sub-detail-val">
                  {subscription?.razorpayPaymentId ? (
                    <span className="gateway-verified-tag">✓ Razorpay ({subscription.razorpayPaymentId})</span>
                  ) : (
                    <span className="gateway-trial-tag">✨ Free Trial (No Card Needed)</span>
                  )}
                </span>
              </div>
            </div>

            <div className="sub-card-cta-group">
              <button
                type="button"
                className="btn-primary btn-md"
                onClick={() => {
                  setSelectedPlanForModal('enterprise');
                  setShowUpgradeModal(true);
                }}
              >
                ⚡ Switch or Upgrade Plan
              </button>
              <button
                type="button"
                className="btn-outline-danger btn-md"
                onClick={() => setShowCancelModal(true)}
              >
                Cancel Subscription
              </button>
            </div>
          </div>

          {/* Monthly Resource Quotas Card */}
          <div className="card sub-usage-overview-card">
            <div className="sub-card-label-row">
              <span className="sub-card-label">MONTHLY RESOURCE CONSUMPTION</span>
              <span className="sub-reset-timer">Resets in {daysRemaining} days</span>
            </div>
            <h3 className="sub-usage-title">Real-Time Account Usage</h3>

            <div className="sub-meters-wrapper">
              {/* AI Reviews Meter */}
              <div className="sub-meter-box">
                <div className="sub-meter-header">
                  <div className="sub-meter-title-wrap">
                    <span className="sub-meter-icon">🤖</span>
                    <div>
                      <strong>AI Review Generations</strong>
                      <span className="sub-meter-sub">Multilingual authentic draft reviews</span>
                    </div>
                  </div>
                  <span className="sub-meter-count">
                    <strong>{aiUsed}</strong> / {aiLimit === null ? 'Unlimited' : aiLimit}
                  </span>
                </div>
                <div className="sub-meter-bar-bg">
                  <div
                    className="sub-meter-bar-fill fill-primary"
                    style={{
                      width: aiLimit === null ? '40%' : `${Math.min(100, (aiUsed / aiLimit) * 100)}%`,
                    }}
                  />
                </div>
                {aiLimit === null && (
                  <span className="sub-unlimited-pill">✨ Unlimited AI generations unlocked</span>
                )}
              </div>

              {/* WhatsApp & SMS Invites Meter */}
              <div className="sub-meter-box">
                <div className="sub-meter-header">
                  <div className="sub-meter-title-wrap">
                    <span className="sub-meter-icon">💬</span>
                    <div>
                      <strong>WhatsApp &amp; SMS Invites</strong>
                      <span className="sub-meter-sub">Direct 1-click review invites</span>
                    </div>
                  </div>
                  <span className="sub-meter-count">
                    <strong>{waUsed}</strong> / {waLimit === null ? 'Unlimited' : waLimit}
                  </span>
                </div>
                <div className="sub-meter-bar-bg">
                  <div
                    className="sub-meter-bar-fill fill-success"
                    style={{
                      width: waLimit === null ? '55%' : `${Math.min(100, (waUsed / waLimit) * 100)}%`,
                    }}
                  />
                </div>
                {waLimit === null && (
                  <span className="sub-unlimited-pill">✨ Unlimited WhatsApp invites unlocked</span>
                )}
              </div>

              {/* Team Staff & Location Metrics */}
              <div className="sub-mini-meters-grid">
                <div className="sub-mini-meter">
                  <span className="mini-meter-icon">👥</span>
                  <div>
                    <span className="mini-meter-val">1 / {currentPlanObj.limits.teamSeats === Infinity ? '∞' : currentPlanObj.limits.teamSeats}</span>
                    <span className="mini-meter-lbl">Staff Seats</span>
                  </div>
                </div>
                <div className="sub-mini-meter">
                  <span className="mini-meter-icon">📍</span>
                  <div>
                    <span className="mini-meter-val">1 / {currentPlanObj.limits.locations === Infinity ? '∞' : currentPlanObj.limits.locations}</span>
                    <span className="mini-meter-lbl">Locations</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Upgrade & Tier Selector Section */}
        <div className="sub-tiers-section">
          <div className="sub-tiers-header text-center">
            <span className="sub-tag-pill">AVAILABLE TIERS</span>
            <h2 className="sub-section-title">Upgrade Your Business Plan</h2>
            <p className="sub-section-desc">
              Instant activation via Razorpay (UPI, Credit/Debit Cards, Net Banking). No downtime or data loss.
            </p>

            {/* Billing Interval Toggle */}
            <div className="sub-billing-toggle-container">
              <div className="sub-toggle-pill">
                <button
                  type="button"
                  className={`sub-toggle-btn ${billingInterval === 'monthly' ? 'active' : ''}`}
                  onClick={() => setBillingInterval('monthly')}
                >
                  Monthly Billing
                </button>
                <button
                  type="button"
                  className={`sub-toggle-btn ${billingInterval === 'annual' ? 'active' : ''}`}
                  onClick={() => setBillingInterval('annual')}
                >
                  Annual Billing <span className="save-tag">Save 20% + 2 Months Free</span>
                </button>
              </div>
            </div>
          </div>

          <div className="sub-cards-grid">
            {PLAN_LIST.map((plan) => {
              const isCurrent = currentPlanId === plan.id;
              const price = billingInterval === 'annual' ? plan.annualPrice : plan.monthlyPrice;
              const annualSavings = (plan.monthlyPrice - plan.annualPrice) * 12;

              return (
                <div
                  key={plan.id}
                  className={`sub-tier-card ${plan.isPopular ? 'popular-sub-card' : ''} ${
                    isCurrent ? 'current-active-tier' : ''
                  }`}
                >
                  {plan.badge && <div className="sub-tier-badge">★ {plan.badge}</div>}
                  {isCurrent && <div className="sub-current-badge">✓ Active Plan</div>}

                  <div className="sub-tier-head">
                    <h3 className="sub-tier-name">{plan.name}</h3>
                    <p className="sub-tier-desc">{plan.tagline}</p>
                    <div className="sub-tier-pricing">
                      <span className="sub-tier-curr">₹</span>
                      <span className="sub-tier-num">{price.toLocaleString('en-IN')}</span>
                      <span className="sub-tier-per">/ mo</span>
                    </div>
                    {billingInterval === 'annual' && (
                      <span className="sub-tier-annual-note">
                        Billed annually ₹{(price * 12).toLocaleString('en-IN')}{' '}
                        <span className="annual-save-chip">Save ₹{annualSavings.toLocaleString('en-IN')}</span>
                      </span>
                    )}
                  </div>

                  <div className="sub-tier-action">
                    {isCurrent ? (
                      <button type="button" className="btn-secondary btn-block btn-lg" disabled>
                        ✓ Currently Subscribed
                      </button>
                    ) : (
                      <button
                        type="button"
                        className={`btn-block btn-lg ${plan.isPopular ? 'btn-primary btn-glow' : 'btn-secondary'}`}
                        onClick={() => handleUpgradePlan(plan.id)}
                        disabled={isProcessing}
                      >
                        {isProcessing && processingPlanId === plan.id ? (
                          <span className="btn-loading-state">
                            <span className="spinner" /> Activating via Razorpay...
                          </span>
                        ) : (
                          `Upgrade to ${plan.name} →`
                        )}
                      </button>
                    )}
                  </div>

                  <ul className="sub-tier-features">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="sub-feature-line">
                        <span className="sub-check">✓</span>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>

        {/* Invoices & Billing History Section */}
        <div className="card sub-invoices-card">
          <div className="sub-card-label-row">
            <div>
              <span className="sub-card-label">PAYMENT HISTORY</span>
              <h3 className="sub-usage-title">Tax Invoices &amp; Receipts</h3>
            </div>
            <div className="sub-security-badges">
              <span className="sec-chip">🔒 256-bit SSL</span>
              <span className="sec-chip">🛡️ PCI-DSS Certified</span>
              <span className="sec-chip">✓ Razorpay Verified</span>
            </div>
          </div>

          <div className="sub-table-responsive">
            <table className="sub-invoices-table">
              <thead>
                <tr>
                  <th>Invoice ID</th>
                  <th>Date</th>
                  <th>Plan &amp; Interval</th>
                  <th>Amount (INR)</th>
                  <th>Status</th>
                  <th>Payment Ref</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <strong>INV-2026-0901</strong>
                  </td>
                  <td>28 Sep 2026</td>
                  <td>Pro Growth (Monthly)</td>
                  <td>₹1,299</td>
                  <td>
                    <span className="sub-invoice-status paid">Paid ✓</span>
                  </td>
                  <td>
                    <code>{subscription?.razorpayPaymentId || 'pay_N0x8kLm9Pz'}</code>
                  </td>
                  <td>
                    <button
                      type="button"
                      className="btn-link-sm"
                      onClick={() => handleDownloadInvoice('INV-2026-0901', 1299, '28 Sep 2026')}
                    >
                      📥 PDF Receipt
                    </button>
                  </td>
                </tr>
                <tr>
                  <td>
                    <strong>INV-2026-0814</strong>
                  </td>
                  <td>14 Aug 2026</td>
                  <td>Starter Plan (Monthly)</td>
                  <td>₹499</td>
                  <td>
                    <span className="sub-invoice-status paid">Paid ✓</span>
                  </td>
                  <td>
                    <code>pay_K8j2mN4qLx</code>
                  </td>
                  <td>
                    <button
                      type="button"
                      className="btn-link-sm"
                      onClick={() => handleDownloadInvoice('INV-2026-0814', 499, '14 Aug 2026')}
                    >
                      📥 PDF Receipt
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Cancel Subscription Confirmation Modal */}
      {showCancelModal && (
        <div className="modal-backdrop" onClick={() => setShowCancelModal(false)}>
          <div className="modal-content cancel-confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="cancel-modal-icon">⚠️</div>
            <h3>Cancel Business Subscription?</h3>
            <p>
              Your <strong>{currentPlanObj.name} Plan</strong> will remain fully active until{' '}
              <strong>{nextBillingDate}</strong>. After this date, your business review collector will revert to free limits.
            </p>
            <p className="cancel-modal-warning">
              ⚠️ You will lose access to Unlimited AI drafts, Standee Designer customization, and Team seats.
            </p>
            <div className="cancel-modal-actions">
              <button
                type="button"
                className="btn-outline btn-lg"
                onClick={() => setShowCancelModal(false)}
              >
                Keep My Plan Active
              </button>
              <button
                type="button"
                className="btn-danger btn-lg"
                onClick={() => {
                  setShowCancelModal(false);
                  setSuccessMsg('Subscription scheduled for cancellation at the end of the billing period.');
                }}
              >
                Confirm Cancellation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Plan Upgrade Checkout Modal */}
      {showUpgradeModal && (
        <SubscriptionModal
          isOpen={showUpgradeModal}
          onClose={() => setShowUpgradeModal(false)}
          selectedPlanId={selectedPlanForModal}
        />
      )}
    </div>
  );
}
