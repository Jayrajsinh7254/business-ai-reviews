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
  const totalCharge = billingInterval === "annual" ? (planObj.annualTotalAmount || planObj.annualPrice * 12) : planObj.monthlyPrice;
  const annualSaving = (planObj.monthlyPrice - planObj.annualPrice) * 12;
  const customerName = user?.name || business?.name || "Valued Business";
  const businessName = business?.name || user?.businessName || customerName;

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
        amountInr: totalCharge,
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
              {billingInterval === "monthly" && planObj.originalMonthlyPrice && (
                <span style={{ textDecoration: "line-through", color: "#94a3b8", fontSize: "1.1rem", marginLeft: "8px" }}>
                  ₹{planObj.originalMonthlyPrice}
                </span>
              )}
            </div>

            <div style={{ marginTop: "4px", marginBottom: "8px" }}>
              <span style={{ fontSize: "0.78rem", fontWeight: 700, color: billingInterval === "annual" ? "#15803d" : "#ea580c", background: billingInterval === "annual" ? "#f0fdf4" : "#fff7ed", padding: "3px 8px", borderRadius: "4px", border: billingInterval === "annual" ? "1px solid #dcfce7" : "1px solid #ffedd5" }}>
                🪔 {billingInterval === "annual" ? planObj.annualSavingsText : planObj.diwaliDiscountText}
              </span>
            </div>

            {billingInterval === "annual" && (
              <div style={{ marginBottom: "12px" }}>
                <p className="checkout-billed-note">
                  Billed ₹{totalCharge.toLocaleString("en-IN")} annually
                </p>
                {planObj.annualPerk && (
                  <p style={{ fontSize: "0.82rem", color: "#059669", fontWeight: 600, marginTop: "4px" }}>
                    {planObj.annualPerk}
                  </p>
                )}
              </div>
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
                <strong>3-Day Free Trial Active</strong>
                <p>
                  Enjoy 3 days completely free with zero upfront charge. First payment on{" "}
                  <strong>
                    {new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString("en-IN", {
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
              {billingInterval === "annual" ? (
                <div className="checkout-line-item discount-line">
                  <span>Annual Deal ({planObj.annualSavingsText})</span>
                  <span className="discount-amount">-₹{annualSaving.toLocaleString("en-IN")}/yr</span>
                </div>
              ) : (
                <div className="checkout-line-item discount-line">
                  <span>Diwali Special Discount</span>
                  <span className="discount-amount">-₹{(planObj.originalMonthlyPrice - planObj.monthlyPrice).toLocaleString("en-IN")}/mo</span>
                </div>
              )}
              <div className="checkout-line-divider" />
              <div className="checkout-line-item total-line">
                <span><strong>Pay Now to Activate</strong></span>
                <span className="checkout-total-amount">
                  <strong>₹{totalCharge.toLocaleString("en-IN")}</strong>
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

            {/* Option B: Direct UPI & WhatsApp Activation */}
            <div className="offline-payment-callout" style={{ marginBottom: "16px", marginTop: "8px" }}>
              <div className="offline-payment-info">
                <span className="offline-icon">⚡</span>
                <div>
                  <strong className="offline-title">Instant UPI & Direct Activation</strong>
                  <p className="offline-desc">
                    Pay ₹{totalCharge.toLocaleString("en-IN")} directly via GPay / PhonePe / Paytm / UPI QR. Instant plan activation by admin.
                  </p>
                </div>
              </div>
              <a
                href={`https://wa.me/919537370561?text=${encodeURIComponent(
                  `Hi ReviewAssist Admin, I want to activate the ${planObj.name} plan (${billingInterval === 'annual' ? `₹${totalCharge.toLocaleString('en-IN')}/yr (Annual Deal)` : `₹${planObj.monthlyPrice.toLocaleString('en-IN')}/mo (Diwali Special)`}) for my business: ${businessName}. Please share your UPI QR / GPay details for instant activation.`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-offline-wa"
                style={{ width: "100%", textAlign: "center", display: "block", textDecoration: "none", marginTop: "10px" }}
              >
                💬 Pay Directly via UPI / WhatsApp
              </a>
            </div>

            <div style={{ textAlign: "center", margin: "14px 0 10px", color: "var(--text-muted, #94a3b8)", fontSize: "0.85rem", fontWeight: 600 }}>
              — OR PAY VIA GATEWAY —
            </div>

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
                  Pay ₹{totalCharge.toLocaleString("en-IN")} via Gateway
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
