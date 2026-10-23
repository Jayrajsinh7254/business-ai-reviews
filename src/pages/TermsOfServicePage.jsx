import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function TermsOfServicePage() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const lastUpdated = 'October 22, 2026';

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
          <div className="legal-badge-pill">📜 Terms &amp; Agreement</div>
          <h1 className="legal-page-title">Terms of Service</h1>
          <p className="legal-page-subtitle">
            The legally binding agreement governing your access to and use of the ReviewAssist platform.
          </p>
          <div className="legal-meta-bar">
            <span>Last Updated: <strong>{lastUpdated}</strong></span>
            <span>•</span>
            <span>Effective Date: <strong>October 22, 2026</strong></span>
          </div>
        </div>

        {/* Content Body */}
        <div className="legal-content-card">

          {/* 1. Acceptance */}
          <section className="legal-section">
            <h2>1. Acceptance of Terms</h2>
            <p>
              By accessing, registering for, or using ReviewAssist (the &quot;Service&quot;), provided
              by ReviewAssist Technologies (&quot;ReviewAssist&quot;, &quot;we&quot;, &quot;us&quot;,
              &quot;our&quot;), you (&quot;Subscriber&quot;, &quot;User&quot;, or &quot;Customer&quot;)
              agree to be bound by these Terms of Service (&quot;Terms&quot;) and our{' '}
              <Link to="/privacy">Privacy Policy</Link>.
            </p>
            <p>
              If you are accepting on behalf of a company, clinic, restaurant, salon, or any other
              commercial entity, you represent and warrant that you have the full legal authority to bind
              that entity to these Terms. If you do not agree to these Terms, you must immediately stop
              accessing or using the Service.
            </p>
          </section>

          {/* 2. Description of Service */}
          <section className="legal-section">
            <h2>2. Description of Services</h2>
            <p>
              ReviewAssist is an AI-powered Software-as-a-Service (SaaS) platform that helps Indian local
              businesses collect genuine, detailed Google Reviews from their in-person customers — in under
              30 seconds. The platform provides the following features:
            </p>
            <ul>
              <li>
                <strong>AI Review Drafting Copilot:</strong> Converts customer-provided star ratings,
                selected services, and rough notes (in any language — Hindi, Gujarati, Marathi, English,
                Hinglish, etc.) into polished, authentic English review drafts. The customer reviews,
                edits, and copies the draft before posting it themselves directly on Google Maps from their
                own Google account.
              </li>
              <li>
                <strong>QR Code Standee &amp; Poster Designer:</strong> Generates high-resolution,
                print-ready QR standees, table tents, A4 posters, and business cards customised with your
                business name and branding — for placement on counters, tables, or walls.
              </li>
              <li>
                <strong>Negative Review Shield (Private Intercept):</strong> When a customer selects a
                rating of 1–3 stars, they are redirected to submit their feedback privately to the business
                owner via WhatsApp or email — instead of going to Google publicly — giving the business a
                chance to resolve the issue first.
              </li>
              <li>
                <strong>WhatsApp Review Inviter:</strong> Allows business owners to send personalised
                WhatsApp messages to individual customers with a direct one-tap link to the review wizard.
                Tracks invite sends and conversions.
              </li>
              <li>
                <strong>AI Auto-Reply Copilot:</strong> Generates professional, personalised reply drafts
                for every collected Google review, directly from the business dashboard.
              </li>
              <li>
                <strong>Real-Time Analytics Dashboard:</strong> Displays total reviews collected, average
                star rating, scan-to-review conversion rate, monthly review growth chart, top services
                reviewed, and a private feedback (negative intercept) inbox.
              </li>
              <li>
                <strong>Team &amp; Staff Management (RBAC):</strong> Invite team members with granular
                role-based access control (Admin, Manager, Staff, Agent) across one or multiple business
                locations.
              </li>
              <li>
                <strong>Multi-Location Support:</strong> Manage multiple business branches from a single
                dashboard using a store-switcher.
              </li>
              <li>
                <strong>Custom Branding:</strong> Apply your brand colour and business logo to the
                customer-facing review page.
              </li>
              <li>
                <strong>CSV / Excel Export:</strong> Export all collected reviews and customer data for
                CRM tools or internal reporting.
              </li>
              <li>
                <strong>Subscription &amp; Billing Portal:</strong> Manage your Razorpay subscription,
                view invoices, and upgrade or downgrade your plan directly from the dashboard.
              </li>
            </ul>
          </section>

          {/* 3. Trial & Billing */}
          <section className="legal-section">
            <h2>3. Subscriptions, 3-Day Free Trial &amp; Razorpay Billing</h2>

            <h3>A. 3-Day Card-Free Trial</h3>
            <p>
              New registered businesses receive an unrestricted <strong>3-day free trial</strong> of their
              selected subscription plan. <strong>No credit card or debit card is required</strong> to
              begin the trial. During the trial, you may use all platform features including QR standee
              generation, AI review drafting, WhatsApp inviter, team management, and the analytics
              dashboard — completely free of charge.
            </p>
            <p>
              Each business is entitled to one (1) free trial. Creating multiple accounts to exploit
              repeated free trials is a violation of these Terms and may result in immediate suspension of
              all associated accounts without notice.
            </p>

            <h3>B. Pricing &amp; Renewal in Indian Rupees (INR)</h3>
            <p>
              Following your 3-day trial, continued access requires an active paid subscription. Current
              pricing tiers are:
            </p>
            <ul>
              <li>
                <strong>Starter Plan:</strong> ₹299/month or ₹249/month billed annually (₹2,988/year).
                Includes 1 business location, 100 AI review generations per month, standard QR standees,
                and 1 staff seat.
              </li>
              <li>
                <strong>Pro Growth Plan:</strong> ₹499/month or ₹449/month billed annually (₹5,388/year).
                Includes up to 1 business location, unlimited AI reviews, unlimited WhatsApp invites, AI Auto-Reply
                Copilot, all standee styles, custom branding, CSV export, and 1 staff seat.
              </li>
              <li>
                <strong>Enterprise / Agency Plan:</strong> ₹799/month or ₹699/month billed annually
                (₹8,388/year). Includes up to 3 business locations with multi-store switcher, unlimited reviews and invites, up to 5 staff
                seats with full RBAC, white-label review pages, custom domain support, webhook integration,
                custom AI tone fine-tuning, and a dedicated account manager with 24/7 SLA support.
              </li>
            </ul>
            <p>
              All prices are in Indian Rupees (INR). ReviewAssist reserves the right to revise pricing
              with at least 30 days&apos; advance written notice to active subscribers.
            </p>

            <h3>C. Payment Processing via Razorpay</h3>
            <p>
              All online payments — including UPI, credit/debit card charges, net banking, and recurring
              subscription renewals — are processed by <strong>Razorpay Software Private Limited</strong>,
              a PCI-DSS Level 1 certified payment gateway regulated by the Reserve Bank of India (RBI).
              By completing payment, you authorise Razorpay and ReviewAssist to charge your selected
              payment method for the applicable subscription fee on each scheduled renewal date.
            </p>

            <h3>D. Cancellation Policy</h3>
            <p>
              You may cancel your subscription at any time from the <strong>Billing</strong> tab on your
              dashboard. Upon cancellation, your account retains full premium access until the end of the
              current paid billing period. After expiry, your account is downgraded to a restricted free
              tier — your data is not deleted unless you specifically request erasure.
            </p>

            <h3>E. Refund Policy</h3>
            <p>
              Because ReviewAssist provides a full-featured 3-day free trial before any payment is
              collected, all subscription fees are <strong>non-refundable</strong> once processed, except
              where mandated by applicable consumer protection law in India (e.g. the Consumer Protection
              Act, 2019). If you believe a charge was made in error, please contact us within 7 days at{' '}
              <a href="mailto:support.reviewassist@gmail.com">support.reviewassist@gmail.com</a> and we
              will investigate and resolve it promptly.
            </p>
          </section>

          {/* 4. Acceptable Use */}
          <section className="legal-section">
            <h2>4. Acceptable Use Policy &amp; Review Integrity</h2>
            <div className="legal-highlight-box warning-theme">
              <span className="highlight-icon">⚠️</span>
              <div>
                <strong>Zero Tolerance for Fake Reviews or Incentivization:</strong>
                <p>
                  ReviewAssist is built exclusively for collecting authentic customer feedback. Using the
                  platform to generate fraudulent, paid, incentivized, or deceptive Google reviews is a
                  direct violation of Google&apos;s Review Policies and of these Terms, and will result in
                  immediate account termination without refund.
                </p>
              </div>
            </div>
            <p>As a condition of use, you agree <strong>NOT</strong> to:</p>
            <ul>
              <li>
                Compensate, discount, gift, or incentivize customers in exchange for positive reviews
                (review gating or bribery).
              </li>
              <li>
                Publish false, fabricated, or ghost-written reviews for your own business, or post
                retaliatory negative reviews targeting competitors.
              </li>
              <li>
                Misuse the Negative Review Shield to permanently prevent genuine unhappy customers from
                exercising their right to post a public Google review. The Shield is intended for
                customer service recovery — not to suppress legitimate criticism indefinitely.
              </li>
              <li>
                Send unsolicited bulk WhatsApp messages to people who have not interacted with your business.
              </li>
              <li>
                Upload defamatory, obscene, hateful, unlawful, or infringing content into standee designs,
                review templates, or business profiles.
              </li>
              <li>
                Reverse engineer, decompile, scrape, or systematically extract platform data, AI prompts,
                or generated review content.
              </li>
              <li>
                Use the Service for any purpose that violates Indian law, including the Information
                Technology Act 2000, IT (Intermediary Guidelines and Digital Media Ethics Code) Rules 2021,
                or the Consumer Protection Act 2019.
              </li>
            </ul>
          </section>

          {/* 5. Google Compliance */}
          <section className="legal-section">
            <h2>5. Google Review Policy Compliance</h2>
            <p>
              ReviewAssist is designed to be <strong>100% compliant</strong> with Google&apos;s Review
              Policies. Key compliance commitments:
            </p>
            <ul>
              <li>
                All reviews generated through the platform are based on real, first-hand customer
                experiences. The AI drafting tool assists the customer in articulating their genuine
                thoughts — it does not fabricate experiences or sentiments.
              </li>
              <li>
                Reviews are always published by the customer from their own personal Google account.
                ReviewAssist never posts reviews on the customer&apos;s behalf.
              </li>
              <li>
                Customers are never incentivised, coerced, or paid to leave a positive review.
              </li>
              <li>
                Customers who wish to post a negative review on Google always retain that right. The
                Negative Review Shield provides an additional private channel but does not remove the
                option to post publicly on Google.
              </li>
            </ul>
            <p>
              Google LLC retains sole authority over which reviews appear, remain, or are moderated on
              Google Business Profiles. ReviewAssist does not guarantee improvements to search rankings,
              changes to star rating algorithms, or the permanent retention of any review on Google Maps.
            </p>
          </section>

          {/* 6. IP */}
          <section className="legal-section">
            <h2>6. Intellectual Property Rights</h2>
            <ul>
              <li>
                <strong>ReviewAssist Platform:</strong> All software, designs, algorithms, AI models,
                logos, trademarks, standee templates, and branding assets are the exclusive intellectual
                property of ReviewAssist Technologies.
              </li>
              <li>
                <strong>Subscriber Brand Assets:</strong> You retain full ownership of your business
                name, logos, trademarks, and service descriptions uploaded to the platform. You grant
                ReviewAssist a limited, non-exclusive, royalty-free licence to use these assets solely
                to render your standees, review pages, and dashboard previews.
              </li>
              <li>
                <strong>AI-Generated Review Drafts:</strong> Review drafts generated by the AI copilot
                are provided as a writing aid for the customer&apos;s voluntary use. The customer owns
                and controls the final text they choose to copy and post to Google Maps.
              </li>
            </ul>
          </section>

          {/* 7. Third-Party */}
          <section className="legal-section">
            <h2>7. Third-Party Services Disclaimer</h2>
            <p>
              ReviewAssist integrates with the following third-party platforms for core functionality:
            </p>
            <ul>
              <li><strong>Google LLC</strong> — Google Maps review destination links and Google Gemini API for AI review drafting.</li>
              <li><strong>Razorpay Software Pvt. Ltd.</strong> — Payment processing and recurring subscription billing.</li>
              <li><strong>Meta (WhatsApp)</strong> — WhatsApp Review Inviter deep links (wa.me).</li>
              <li><strong>Supabase Inc.</strong> — Encrypted cloud database, authentication, and file storage.</li>
            </ul>
            <p>
              ReviewAssist is an <strong>independent technology provider</strong> and is not affiliated
              with, endorsed by, or officially partnered with Google LLC, Meta Platforms, or Razorpay.
              Each third-party service is governed by its own separate terms and privacy policy.
            </p>
          </section>

          {/* 8. Limitation of Liability */}
          <section className="legal-section">
            <h2>8. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by applicable law, ReviewAssist and its officers, directors,
              employees, and partners shall not be liable for any indirect, incidental, special,
              consequential, or punitive damages — including loss of business profits, data loss, goodwill,
              or business reputation — arising from:
            </p>
            <ul>
              <li>Your use of or inability to use the Service.</li>
              <li>Actions by Google, such as review filtering, removal, profile suspension, or algorithmic rating changes.</li>
              <li>Disputes, failures, or interruptions from Razorpay or any other third-party payment gateway.</li>
              <li>Unauthorised access to your account due to your failure to maintain password security.</li>
              <li>Force majeure events beyond our reasonable control.</li>
            </ul>
            <p>
              In no event shall ReviewAssist&apos;s total aggregate liability exceed the total subscription
              fees paid by you to ReviewAssist in the <strong>twelve (12) months</strong> preceding the claim.
            </p>
          </section>

          {/* 9. Governing Law */}
          <section className="legal-section">
            <h2>9. Governing Law &amp; Dispute Resolution</h2>
            <p>
              These Terms are governed by and construed in accordance with the laws of the{' '}
              <strong>Republic of India</strong>, without regard to conflict of law principles. Any
              dispute, claim, or controversy arising out of or relating to these Terms shall be subject
              to the exclusive jurisdiction of the competent courts in{' '}
              <strong>Ahmedabad, Gujarat, India</strong>.
            </p>
            <p>
              Before initiating any formal legal proceeding, both parties agree to attempt to resolve
              disputes amicably through good-faith written communication for a minimum of 30 days.
            </p>
          </section>

          {/* 10. Modifications */}
          <section className="legal-section">
            <h2>10. Modifications to These Terms</h2>
            <p>
              ReviewAssist reserves the right to update or amend these Terms at any time. Material changes
              will be communicated via email to the registered account address at least{' '}
              <strong>14 days before</strong> the updated Terms take effect. Continued use of the Service
              after the effective date constitutes your acceptance of the revised Terms.
            </p>
          </section>

          {/* 11. Contact */}
          <section className="legal-section">
            <h2>11. Contact &amp; Support</h2>
            <p>
              For questions, concerns, or legal notices regarding these Terms of Service, please contact:
            </p>
            <div className="legal-contact-card">
              <p><strong>ReviewAssist Legal &amp; Support Team</strong></p>
              <p>Email: <a href="mailto:support.reviewassist@gmail.com">support.reviewassist@gmail.com</a></p>
              <p>WhatsApp Support: <a href="https://wa.me/919537370561" target="_blank" rel="noopener noreferrer">+91 95373 70561</a></p>
              <p>ReviewAssist Technologies &bull; Gujarat, India</p>
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
