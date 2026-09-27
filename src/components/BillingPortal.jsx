import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { PLANS } from "../lib/plans";
import { initiateRazorpayCheckout } from "../lib/razorpay";

export default function BillingPortal() {
  const { user, subscription, updateSubscriptionPlan } = useAuth();
  const navigate = useNavigate();
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [upgradeError, setUpgradeError] = useState("");

  const planId = subscription?.planId || "starter";
  const planObj = PLANS[planId.toUpperCase()] || PLANS.STARTER;
  const billingInterval = subscription?.billingInterval || "monthly";
  const price = billingInterval === "annual" ? planObj.annualPrice : planObj.monthlyPrice;
  const status = subscription?.status || "trialing";

  const trialEnd = subscription?.currentPeriodEnd
    ? new Date(subscription.currentPeriodEnd)
    : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
  const nextBillingDate = trialEnd.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const daysRemaining = Math.max(0, Math.ceil((trialEnd - Date.now()) / (1000 * 60 * 60 * 24)));

  const aiUsed = subscription?.aiGenerationsUsed || 0;
  const waUsed = subscription?.whatsappInvitesUsed || 0;
  const aiLimit = planObj.limits.aiReviewsPerMonth === Infinity ? null : planObj.limits.aiReviewsPerMonth;
  const waLimit = planObj.limits.whatsappInvitesPerMonth === Infinity ? null : planObj.limits.whatsappInvitesPerMonth;

  const statusConfig = {
    trialing: { label: "14-Day Free Trial", color: "status-trial", icon: "🎁" },
    active: { label: "Active", color: "status-active", icon: "✅" },
    past_due: { label: "Payment Failed", color: "status-danger", icon: "⚠️" },
    canceled: { label: "Canceled", color: "status-canceled", icon: "❌" },
  };
  const statusInfo = statusConfig[status] || statusConfig.trialing;

  const handleUpgrade = async (newPlanId, interval) => {
    setIsUpgrading(true);
    setUpgradeError("");
    try {
      const result = await initiateRazorpayCheckout({
        businessId: user?.businessId || "demo-1",
        planId: newPlanId,
        billingInterval: interval || billingInterval,
        customerName: user?.name || "",
        customerEmail: user?.email || "",
        planDisplayName: PLANS[newPlanId.toUpperCase()]?.name || newPlanId,
        amountInr:
          interval === "annual"
            ? PLANS[newPlanId.toUpperCase()]?.annualPrice
            : PLANS[newPlanId.toUpperCase()]?.monthlyPrice,
      });
      await updateSubscriptionPlan(newPlanId, interval || billingInterval, {
        razorpayPaymentId: result.paymentId,
        razorpayOrderId: result.orderId,
        periodEnd: result.periodEnd,
      });
    } catch (err) {
      if (err.message !== "Payment cancelled by user") {
        setUpgradeError(err.message || "Payment failed. Please try again.");
      }
    } finally {
      setIsUpgrading(false);
    }
  };

  const handleChangePlan = () => {
    navigate(`/pricing`);
  };

  return (
    <div className="billing-portal-wrapper">
      {/* Current Plan Card */}
      <div className="billing-plan-card">
        <div className="billing-plan-header">
          <div className="billing-plan-info">
            <div className="billing-plan-title-row">
              <h3 className="billing-plan-name">{planObj.name} Plan</h3>
              <span className={`billing-status-badge ${statusInfo.color}`}>
                {statusInfo.icon} {statusInfo.label}
              </span>
            </div>
            <p className="billing-plan-desc">{planObj.tagline}</p>
          </div>

          <div className="billing-price-block">
            <span className="billing-currency">₹</span>
            <span className="billing-price">{price.toLocaleString("en-IN")}</span>
            <span className="billing-period">/ month</span>
            {billingInterval === "annual" && (
              <span className="billing-annual-tag">Billed Annually</span>
            )}
          </div>
        </div>

        {/* Trial Alert */}
        {status === "trialing" && (
          <div className="billing-trial-alert">
            <span>🎁</span>
            <div style={{ flex: 1 }}>
              <strong>14-Day Free Trial Active ({daysRemaining} days remaining)</strong>
              <p>
                No debit or credit card required for trial. Your trial expires on{" "}
                <strong>{nextBillingDate}</strong>. Upgrade anytime to keep full access.
              </p>
            </div>
            <button
              type="button"
              className="btn-primary btn-sm"
              onClick={() => navigate("/pricing")}
            >
              Upgrade Plan
            </button>
          </div>
        )}

        {/* Past Due Alert */}
        {status === "past_due" && (
          <div className="billing-pastdue-alert">
            <span>⚠️</span>
            <div style={{ flex: 1 }}>
              <strong>Payment Failed</strong>
              <p>Your last payment could not be processed. Update payment method to restore full access.</p>
            </div>
            <button type="button" className="btn-danger btn-sm" onClick={() => navigate("/pricing")}>
              Retry Payment
            </button>
          </div>
        )}

        {/* Next Billing */}
        {status === "active" && (
          <div className="billing-next-charge-row">
            <span className="billing-next-label">Active until:</span>
            <span className="billing-next-date">{nextBillingDate}</span>
            <span className="billing-next-amount">
              ₹{(billingInterval === "annual" ? planObj.annualPrice * 12 : planObj.monthlyPrice).toLocaleString("en-IN")}
            </span>
          </div>
        )}

        {/* Actions */}
        <div className="billing-actions-row">
          <button
            type="button"
            className="btn-primary btn-sm"
            onClick={handleChangePlan}
            disabled={isUpgrading}
          >
            {isUpgrading ? "Processing..." : "Change / Upgrade Plan"}
          </button>
          <button
            type="button"
            className="btn-outline btn-sm"
            onClick={() => setShowCancelConfirm(true)}
          >
            Cancel Subscription
          </button>
        </div>
        {upgradeError && <p className="billing-error-msg">{upgradeError}</p>}
      </div>

      {/* Usage Meters */}
      <div className="billing-usage-card">
        <h4 className="billing-section-title">Plan Usage This Month</h4>
        <div className="usage-meters-grid">
          <UsageMeter
            label="AI Review Generations"
            used={aiUsed}
            limit={aiLimit}
            icon="🤖"
          />
          <UsageMeter
            label="WhatsApp Invites Sent"
            used={waUsed}
            limit={waLimit}
            icon="💬"
          />
          <UsageMeter
            label="Team Seats"
            used={1}
            limit={planObj.limits.teamSeats === Infinity ? null : planObj.limits.teamSeats}
            icon="👥"
          />
          <UsageMeter
            label="Business Locations"
            used={1}
            limit={planObj.limits.locations === Infinity ? null : planObj.limits.locations}
            icon="📍"
          />
        </div>
      </div>

      {/* Plan Features Unlocked */}
      <div className="billing-features-card">
        <h4 className="billing-section-title">Features Unlocked on Your Plan</h4>
        <div className="billing-features-grid">
          {planObj.features.map((f, i) => (
            <div key={i} className="billing-feature-item">
              <span className="billing-feature-check">✓</span>
              <span>{f}</span>
            </div>
          ))}
        </div>

        {/* Upgrade Prompt for Starter */}
        {planId === "starter" && (
          <div className="billing-upgrade-prompt">
            <div className="upgrade-prompt-content">
              <span className="upgrade-prompt-icon">🚀</span>
              <div>
                <strong>Need more reviews & invites?</strong>
                <p>Upgrade to Pro for ₹1,299/mo to unlock unlimited AI reviews, WhatsApp invites & 3 team seats.</p>
              </div>
            </div>
            <button
              type="button"
              className="btn-primary btn-sm"
              onClick={() => handleUpgrade("pro", billingInterval)}
              disabled={isUpgrading}
            >
              Upgrade to Pro →
            </button>
          </div>
        )}
      </div>

      {/* Payment Info */}
      <div className="billing-payment-card">
        <h4 className="billing-section-title">Payment Method &amp; Security</h4>
        <div className="billing-payment-info-row">
          <div className="billing-payment-method">
            <span className="pm-icon">💳</span>
            <div>
              <strong>Payment Gateway</strong>
              <p className="pm-detail">
                {subscription?.razorpayPaymentId
                  ? `Razorpay Verified · Payment ID: ${subscription.razorpayPaymentId}`
                  : "Free trial active — no payment method required"}
              </p>
            </div>
          </div>
          <button
            type="button"
            className="btn-secondary btn-sm"
            onClick={handleChangePlan}
          >
            Manage via Pricing
          </button>
        </div>
        <div className="billing-security-row">
          <span className="security-chip">🔒 256-bit SSL</span>
          <span className="security-chip">🛡️ PCI DSS Compliant</span>
          <span className="security-chip">✓ Razorpay Secured</span>
          <span className="security-chip">✓ RBI Compliant</span>
        </div>
      </div>

      {/* Cancel Confirmation Modal */}
      {showCancelConfirm && (
        <div className="modal-backdrop" onClick={() => setShowCancelConfirm(false)}>
          <div className="modal-content cancel-confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="cancel-modal-icon">⚠️</div>
            <h3>Cancel Your Subscription?</h3>
            <p>
              If you cancel, your <strong>{planObj.name} Plan</strong> will remain active until{" "}
              <strong>{nextBillingDate}</strong>, after which your account will revert to the free tier.
            </p>
            <p className="cancel-modal-warning">
              You will lose access to premium AI features and extended invite quotas.
            </p>
            <div className="cancel-modal-actions">
              <button
                type="button"
                className="btn-outline btn-lg"
                onClick={() => setShowCancelConfirm(false)}
              >
                Keep My Plan
              </button>
              <button
                type="button"
                className="btn-danger btn-lg"
                onClick={() => {
                  setShowCancelConfirm(false);
                  alert("Subscription cancellation scheduled at end of billing period.");
                }}
              >
                Confirm Cancellation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function UsageMeter({ label, used, limit, icon }) {
  const isUnlimited = limit === null;
  const percent = isUnlimited ? 0 : Math.min(100, Math.round((used / limit) * 100));
  const isWarning = !isUnlimited && percent >= 80;
  const isDanger = !isUnlimited && percent >= 95;

  return (
    <div className="usage-meter-item">
      <div className="usage-meter-header">
        <span className="usage-meter-icon">{icon}</span>
        <span className="usage-meter-label">{label}</span>
        <span className="usage-meter-val">
          {used} / {isUnlimited ? "∞" : limit}
        </span>
      </div>
      {!isUnlimited && (
        <div className="usage-meter-bar-track">
          <div
            className={`usage-meter-bar-fill ${isDanger ? "danger" : isWarning ? "warning" : "normal"}`}
            style={{ width: `${percent}%` }}
          />
        </div>
      )}
      {isUnlimited && <span className="usage-meter-unlimited-badge">Unlimited</span>}
    </div>
  );
}
