import React, { useEffect, useRef } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { PLANS } from "../lib/plans";
import { useAuth } from "../context/AuthContext";
import confetti from "canvas-confetti";

export default function CheckoutSuccessPage() {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const hasConfettiFired = useRef(false);

  const planId = searchParams.get("plan") || "pro";
  const interval = searchParams.get("interval") || "monthly";
  const paymentId = searchParams.get("payment") || "";
  const planObj = PLANS[planId.toUpperCase()] || PLANS.PRO;
  const price = interval === "annual" ? planObj.annualPrice : planObj.monthlyPrice;
  const renewalDate = new Date(Date.now() + (interval === "annual" ? 365 : 30) * 24 * 60 * 60 * 1000);

  useEffect(() => {
    if (hasConfettiFired.current) return;
    hasConfettiFired.current = true;
    window.scrollTo(0, 0);

    const duration = 2500;
    const end = Date.now() + duration;
    const frame = () => {
      confetti({ particleCount: 3, angle: 60, spread: 55, origin: { x: 0 }, colors: ["#7c3aed", "#a855f7", "#fbbf24"] });
      confetti({ particleCount: 3, angle: 120, spread: 55, origin: { x: 1 }, colors: ["#7c3aed", "#a855f7", "#fbbf24"] });
      if (Date.now() < end) requestAnimationFrame(frame);
    };
    frame();
  }, []);

  return (
    <div className="success-page-wrapper">
      <div className="success-page-card animate-fade-in">
        {/* Success Icon */}
        <div className="success-circle-icon">
          <span className="success-tick">✓</span>
        </div>

        <div className="success-title-block">
          <h1 className="success-headline">Payment Successful! 🎉</h1>
          <p className="success-subline">
            Your <strong>{planObj.name} Plan</strong> is now active. Welcome to ReviewAssist!
          </p>
        </div>

        {/* Order Details */}
        <div className="success-details-grid">
          <div className="success-detail-item">
            <span className="detail-label">Plan</span>
            <span className="detail-value">{planObj.name}</span>
          </div>
          <div className="success-detail-item">
            <span className="detail-label">Billing</span>
            <span className="detail-value capitalize">{interval}</span>
          </div>
          <div className="success-detail-item">
            <span className="detail-label">Amount</span>
            <span className="detail-value">₹{price.toLocaleString("en-IN")}/mo</span>
          </div>
          <div className="success-detail-item">
            <span className="detail-label">Active Until</span>
            <span className="detail-value">
              {renewalDate.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
            </span>
          </div>
          {paymentId && (
            <div className="success-detail-item full-width">
              <span className="detail-label">Payment ID</span>
              <span className="detail-value mono">{paymentId}</span>
            </div>
          )}
        </div>

        {/* Next Steps */}
        <div className="success-next-steps">
          <h3 className="next-steps-title">Your Next Steps</h3>
          <div className="next-steps-list">
            <div className="next-step-item">
              <span className="step-num">1</span>
              <div>
                <strong>Set up your business profile</strong>
                <p>Add your Google Review link, brand colors, and logo.</p>
              </div>
            </div>
            <div className="next-step-item">
              <span className="step-num">2</span>
              <div>
                <strong>Print your QR standee</strong>
                <p>Design and download your counter standee or table tent for customers to scan.</p>
              </div>
            </div>
            <div className="next-step-item">
              <span className="step-num">3</span>
              <div>
                <strong>Send WhatsApp invites</strong>
                <p>Invite your first customers to leave a 5-star review in 30 seconds.</p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="success-cta-buttons">
          <Link to="/dashboard" className="btn-primary btn-xl success-dashboard-btn">
            🚀 Go to Dashboard
          </Link>
          <Link to="/pricing" className="btn-outline btn-lg">
            View My Plan
          </Link>
        </div>
      </div>
    </div>
  );
}
