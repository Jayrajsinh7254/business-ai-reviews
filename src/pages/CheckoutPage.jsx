import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { PLANS } from "../lib/plans";
import { initiateRazorpayCheckout, formatInr } from "../lib/razorpay";
import { useAuth } from "../context/AuthContext";

export default function CheckoutPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, business, updateSubscriptionPlan } = useAuth();

  const planId = searchParams.get("plan") || "pro";
  const interval = searchParams.get("interval") || "monthly";
  const businessId = searchParams.get("businessId") || user?.businessId || "demo-1";

  const [billingInterval, setBillingInterval] = useState(interval);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");

  const planObj = PLANS[planId.toUpperCase()] || PLANS.PRO;
  const price = billingInterval === "annual" ? planObj.annualPrice : planObj.monthlyPrice;
  const annualSaving = (planObj.monthlyPrice - planObj.annualPrice) * 12;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handlePayNow = async () => {
    setIsProcessing(true);
    setError("");
    try {
      const result = await initiateRazorpayCheckout({
        businessId,
        planId: planObj.id,
        billingInterval,
        customerName: user?.name || business?.name || "",
        customerEmail: user?.email || business?.email || "",
        planDisplayName: planObj.name,
        amountInr: price,
      });

      // Update local subscription state
      await updateSubscriptionPlan(planObj.id, billingInterval, {
        razorpayPaymentId: result.paymentId,
        razorpayOrderId: result.orderId,
        periodEnd: result.periodEnd,
      });

      navigate(`/checkout/success?plan=${planObj.id}&interval=${billingInterval}&payment=${result.paymentId}`);
    } catch (err) {
      if (err.message === "Payment cancelled by user") {
        setError("");
      } else {
        setError(err.message || "Payment failed. Please try again.");
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const features = planObj.features.slice(0, 5);

  return (
    <div className="checkout-page-wrapper">
      <div className="checkout-container">
        {/* Left: Order Summary */}
        <div className="checkout-summary-panel">
          <div className="checkout-summary-header">
            <Link to="/pricing" className="checkout-back-link">
              ← Back to Pricing
            </Link>
            <div className="checkout-brand-logo">
              <span className="brand-icon-checkout">⭐</span>
              <span>ReviewAssist</span>
            </div>
          </div>

          <div className="checkout-plan-summary-card">
            <div className="plan-summary-badge">
              {planObj.badge && <span className="plan-badge-tag">★ {planObj.badge}</span>}
            </div>

            <h2 className="plan-summary-name">{planObj.name} Plan</h2>
            <p className="plan-summary-tagline">{planObj.tagline}</p>

            {/* Billing Toggle */}
            <div className="checkout-interval-toggle">
              <button
                type="button"
                className={`interval-btn ${billingInterval === "monthly" ? "active" : ""}`}
                onClick={() => setBillingInterval("monthly")}
              >
                Monthly
              </button>
              <button
                type="button"
                className={`interval-btn ${billingInterval === "annual" ? "active" : ""}`}
                onClick={() => setBillingInterval("annual")}
              >
                Annual
                <span className="save-chip">Save ₹{annualSaving.toLocaleString("en-IN")}</span>
              </button>
            </div>

            <div className="checkout-price-display">
              <span className="checkout-currency">₹</span>
              <span className="checkout-price-big">{price.toLocaleString("en-IN")}</span>
              <span className="checkout-per-month">/ month</span>
            </div>
            {billingInterval === "annual" && (
              <p className="checkout-billed-note">
                Billed ₹{(planObj.annualPrice * 12).toLocaleString("en-IN")} annually
              </p>
            )}

            <div className="checkout-features-list">
              <p className="checkout-features-title">What&apos;s included:</p>
              {features.map((f, i) => (
                <div key={i} className="checkout-feature-row">
                  <span className="feature-check-green">✓</span>
                  <span>{f}</span>
                </div>
              ))}
            </div>

            <div className="checkout-trial-note">
              <span className="trial-icon">🎁</span>
              <div>
                <strong>14-Day Free Trial Active</strong>
                <p>
                  Enjoy 14 days completely free with zero upfront charge. First payment on{" "}
                  <strong>
                    {new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </strong>.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Payment Panel */}
        <div className="checkout-payment-panel">
          <div className="checkout-payment-card">
            <h3 className="checkout-payment-title">Order Summary &amp; Checkout</h3>
            <p className="checkout-payment-subtitle">
              Instant activation via Razorpay — UPI, Cards, Net Banking accepted
            </p>

            <div className="checkout-order-line-items">
              <div className="checkout-line-item">
                <span>{planObj.name} Plan ({billingInterval})</span>
                <span>₹{price.toLocaleString("en-IN")}/mo</span>
              </div>
              {billingInterval === "annual" && (
                <div className="checkout-line-item discount-line">
                  <span>Annual Discount (Save 20%)</span>
                  <span className="discount-amount">-₹{annualSaving.toLocaleString("en-IN")}/yr</span>
                </div>
              )}
              <div className="checkout-line-divider" />
              <div className="checkout-line-item total-line">
                <span><strong>Pay Now to Activate</strong></span>
                <span className="checkout-total-amount">
                  <strong>₹{(billingInterval === "annual" ? planObj.annualPrice * 12 : planObj.monthlyPrice).toLocaleString("en-IN")}</strong>
                </span>
              </div>
              <div className="checkout-line-item renewal-line">
                <span>Next billing date</span>
                <span>
                  {new Date(Date.now() + (billingInterval === "annual" ? 365 : 30) * 24 * 60 * 60 * 1000).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              </div>
            </div>

            {error && (
              <div className="checkout-error-banner">
                <span>⚠️</span>
                <span>{error}</span>
              </div>
            )}

            <button
              type="button"
              id="btn-razorpay-pay"
              className="btn-primary btn-block btn-xl checkout-pay-btn"
              onClick={handlePayNow}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <span className="btn-loading-state">
                  <span className="spinner" />
                  Opening Razorpay...
                </span>
              ) : (
                <>
                  <span className="razorpay-icon">💳</span>
                  Pay ₹{(billingInterval === "annual" ? planObj.annualPrice * 12 : planObj.monthlyPrice).toLocaleString("en-IN")} via Razorpay
                </>
              )}
            </button>

            <div className="checkout-payment-methods">
              <span className="pm-label">Accepts:</span>
              <span className="pm-chip">UPI (GPay, PhonePe, Paytm)</span>
              <span className="pm-chip">Visa</span>
              <span className="pm-chip">Mastercard</span>
              <span className="pm-chip">RuPay</span>
              <span className="pm-chip">Net Banking</span>
            </div>

            <div className="checkout-security-badges">
              <span className="security-badge">🔒 256-bit SSL</span>
              <span className="security-badge">🛡️ PCI DSS Compliant</span>
              <span className="security-badge">✓ RBI Approved</span>
            </div>

            <p className="checkout-cancel-note">
              Cancel anytime directly from your dashboard. No hidden charges.
              <br />
              By proceeding, you agree to our <Link to="/terms" target="_blank">Terms</Link>, <Link to="/privacy" target="_blank">Privacy Policy</Link>, and <Link to="/google-guidelines" target="_blank">Google Guidelines</Link>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
