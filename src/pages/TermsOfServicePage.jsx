import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function TermsOfServicePage() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const lastUpdated = 'September 19, 2026';

  return (
    <div className="legal-page-wrapper">
      <div className="legal-container">
        {/* Breadcrumb Header */}
        <div className="legal-header-block">
          <div className="legal-breadcrumbs">
            <Link to="/">Home</Link>
            <span className="breadcrumb-sep">/</span>
            <span>Legal</span>
            <span className="breadcrumb-sep">/</span>
            <span className="breadcrumb-current">Terms of Service</span>
          </div>
          <div className="legal-badge-pill">📜 Terms & Agreement</div>
          <h1 className="legal-page-title">Terms of Service</h1>
          <p className="legal-page-subtitle">
            The legally binding agreement governing your access to and use of the ReviewAssist platform.
          </p>
          <div className="legal-meta-bar">
            <span>Last Updated: <strong>{lastUpdated}</strong></span>
            <span>•</span>
            <span>Effective Date: <strong>September 1, 2026</strong></span>
          </div>
        </div>

        {/* Content Body */}
        <div className="legal-content-card">
          <section className="legal-section">
            <h2>1. Acceptance of Terms</h2>
            <p>
              By accessing, registering for, or utilizing ReviewAssist (the &quot;Service&quot;), provided by ReviewAssist Technologies (&quot;ReviewAssist&quot;, &quot;we&quot;, &quot;us&quot;, &quot;our&quot;), you (&quot;Subscriber&quot;, &quot;User&quot;, or &quot;Customer&quot;) agree to be bound by these Terms of Service (&quot;Terms&quot;) and our Privacy Policy.
            </p>
            <p>
              If you are accepting on behalf of a company, clinic, restaurant, or other commercial entity, you represent and warrant that you possess the full legal authority to bind that entity to these Terms. If you do not agree to these Terms, you must not access or use the Service.
            </p>
          </section>

          <section className="legal-section">
            <h2>2. Description of SaaS Services</h2>
            <p>
              ReviewAssist provides a Software-as-a-Service (SaaS) suite designed to help legitimate businesses simplify review collection from their genuine in-person and online customers:
            </p>
            <ul>
              <li><strong>Dynamic QR Standee & Poster Generator:</strong> High-resolution vector-rendered physical print collateral tailored to your location.</li>
              <li><strong>AI Review Drafting Copilot:</strong> Assistive AI tooling that converts customer-selected feedback tags into articulate draft reviews for customers to review, customize, and publish onto Google Maps.</li>
              <li><strong>WhatsApp Customer Inviter:</strong> Direct pre-formatted messaging templates to prompt real recent clients to leave their feedback.</li>
              <li><strong>Dashboard & Multi-User RBAC:</strong> Role-based access control allowing business owners and staff to manage feedback, analytics, and business profiles.</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>3. Subscriptions, 14-Day Free Trial & Razorpay Billing</h2>

            <h3>A. 14-Day Card-Free Trial</h3>
            <p>
              New registered businesses receive an unrestricted <strong>14-day free trial</strong> of the selected plan. <strong>No credit or debit card is required upfront</strong> to initiate the trial. You can create standees, invite team members, and test the review generation flow risk-free.
            </p>

            <h3>B. Pricing & Renewal in Indian Rupees (INR)</h3>
            <p>
              Following your 14-day trial, continuous access requires choosing an active subscription tier:
            </p>
            <ul>
              <li><strong>Starter Plan:</strong> ₹499/month (or ₹399/month billed annually at ₹4,788/year).</li>
              <li><strong>Pro Growth Plan:</strong> ₹1,299/month (or ₹999/month billed annually at ₹11,988/year).</li>
              <li><strong>Enterprise Plan:</strong> ₹2,999/month (or ₹2,399/month billed annually at ₹28,788/year).</li>
            </ul>

            <h3>C. Payment Processing via Razorpay</h3>
            <p>
              All online payments, UPI transfers, credit/debit card authorizations, and recurring charges are processed through <strong>Razorpay Software Private Limited</strong>. By completing payment on ReviewAssist, you authorize Razorpay and ReviewAssist to bill your chosen payment method for the applicable subscription fees according to your selected interval (monthly or annual).
            </p>

            <h3>D. Cancellation & Refund Policy</h3>
            <p>
              You may cancel your subscription at any time directly through the <strong>Subscription & Billing</strong> tab on your dashboard. Upon cancellation, your account retains full premium access until the end of your current paid billing period. Because we offer an unrestricted 14-day free trial prior to payment, subscription payments are non-refundable once processed, except where required by applicable consumer protection laws.
            </p>
          </section>

          <section className="legal-section">
            <h2>4. Acceptable Use Policy & Review Integrity</h2>
            <div className="legal-highlight-box warning-theme">
              <span className="highlight-icon">⚠️</span>
              <div>
                <strong>Zero Tolerance for Fake Reviews or Incentivization:</strong>
                <p>
                  ReviewAssist is strictly built for authentic customer feedback. You agree NOT to use the platform to generate fraudulent, paid, incentivized, or deceptive reviews. Violating third-party platform rules (such as Google&apos;s Review Policies) will result in immediate termination without refund.
                </p>
              </div>
            </div>

            <p>As a condition of use, you agree NOT to:</p>
            <ul>
              <li>Compensate, discount, gift, or pay customers in exchange for positive reviews (review gating or bribery).</li>
              <li>Publish false reviews for your own business or post negative retaliatory reviews against competitors.</li>
              <li>Filter or block unhappy customers from reviewing on Google (our customer review flow always provides a direct link to Google Maps regardless of selected rating).</li>
              <li>Upload defamatory, abusive, obscene, hateful, or infringing content into review templates or standee designs.</li>
              <li>Reverse engineer, decompile, scrape, or exploit platform software or AI prompt mechanisms.</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>5. Intellectual Property Rights</h2>
            <ul>
              <li><strong>ReviewAssist Platform:</strong> All software, designs, algorithms, logos, trademarks, and standee templates are the exclusive intellectual property of ReviewAssist Technologies Inc.</li>
              <li><strong>Subscriber Brand Assets:</strong> You retain full ownership of your business name, logos, trademarks, and service descriptions uploaded to the platform. You grant us a non-exclusive license to use these assets solely to render your standees, review links, and dashboard preview.</li>
              <li><strong>Generated Reviews:</strong> Text generated by the AI copilot is provided for the customer&apos;s voluntary edit and review. The customer owns and controls the final review text they copy and post to Google Maps.</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>6. Third-Party Services Disclaimer (Google, Razorpay, WhatsApp)</h2>
            <p>
              ReviewAssist integrates with and references third-party platforms, including Google LLC, Razorpay, and WhatsApp (Meta Platforms). ReviewAssist is an independent technology provider and is <strong>not affiliated with, endorsed by, or sponsored by Google LLC or Meta</strong>.
            </p>
            <p>
              Google retains sole authority over which reviews appear, remain, or are moderated on Google Business Profiles. ReviewAssist does not and cannot guarantee specific search ranking improvements, star rating algorithms, or review retention on Google Maps.
            </p>
          </section>

          <section className="legal-section">
            <h2>7. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by applicable law, ReviewAssist and its officers, directors, employees, and partners shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of business profits, data loss, goodwill, or business reputation resulting from:
            </p>
            <ul>
              <li>Your use of or inability to use the Service.</li>
              <li>Actions taken by Google, such as review filtering, profile suspensions, or algorithmic adjustments.</li>
              <li>Payment disputes or interruptions arising from third-party gateway providers.</li>
            </ul>
            <p>
              In no event shall ReviewAssist&apos;s total aggregate liability exceed the total subscription fees paid by you to ReviewAssist in the twelve (12) months preceding the claim.
            </p>
          </section>

          <section className="legal-section">
            <h2>8. Governing Law & Dispute Resolution</h2>
            <p>
              These Terms shall be governed by and construed in accordance with the laws of <strong>India</strong>, without regard to conflict of law principles. Any dispute, claim, or controversy arising out of or in connection with these Terms shall be subject to the exclusive jurisdiction of the competent courts in <strong>Bengaluru, Karnataka, India</strong>.
            </p>
          </section>

          <section className="legal-section">
            <h2>9. Contact & Support</h2>
            <p>
              If you have any questions regarding these Terms of Service, please reach out to:
            </p>
            <div className="legal-contact-card">
              <p><strong>ReviewAssist Legal Affairs</strong></p>
              <p>Email: <a href="mailto:legal@reviewassist.ai">legal@reviewassist.ai</a></p>
              <p>Support: <a href="mailto:support@reviewassist.ai">support@reviewassist.ai</a></p>
              <p>ReviewAssist Technologies Inc. • Bengaluru, Karnataka, India</p>
            </div>
          </section>
        </div>

        {/* Bottom Navigation */}
        <div className="legal-bottom-nav">
          <Link to="/privacy" className="legal-nav-btn">
            &larr; Privacy Policy
          </Link>
          <Link to="/google-guidelines" className="legal-nav-btn">
            Google Review Guidelines &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}
