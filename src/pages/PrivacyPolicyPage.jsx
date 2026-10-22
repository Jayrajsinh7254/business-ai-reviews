import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function PrivacyPolicyPage() {
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
            <span className="breadcrumb-current">Privacy Policy</span>
          </div>
          <div className="legal-badge-pill">🔒 Trust &amp; Security</div>
          <h1 className="legal-page-title">Privacy Policy</h1>
          <p className="legal-page-subtitle">
            How ReviewAssist collects, protects, processes, and respects your personal and business data.
          </p>
          <div className="legal-meta-bar">
            <span>Last Updated: <strong>{lastUpdated}</strong></span>
            <span>•</span>
            <span>Effective Date: <strong>October 22, 2026</strong></span>
          </div>
        </div>

        {/* Content Body */}
        <div className="legal-content-card">

          {/* 1. Introduction */}
          <section className="legal-section">
            <h2>1. Introduction &amp; Scope</h2>
            <p>
              ReviewAssist Technologies (&quot;ReviewAssist&quot;, &quot;we&quot;, &quot;our&quot;, or
              &quot;us&quot;) is committed to protecting the privacy and confidentiality of local
              businesses and their end-customers. This Privacy Policy explains our practices regarding
              the collection, use, storage, and disclosure of information when you use our website,
              AI review drafting system, QR code standee generator, WhatsApp inviter, team management
              portal, analytics dashboard, and subscription billing tools (collectively, the
              &quot;Service&quot;).
            </p>
            <p>
              By accessing or using ReviewAssist, you consent to the practices described in this policy.
              We comply with applicable data protection regulations, including the{' '}
              <strong>Digital Personal Data Protection Act 2023 (DPDP Act, India)</strong> and
              international best practices aligned with GDPR principles.
            </p>
          </section>

          {/* 2. Information We Collect */}
          <section className="legal-section">
            <h2>2. Information We Collect</h2>
            <p>We collect the following categories of information:</p>

            <h3>A. Business Account Information</h3>
            <ul>
              <li>
                <strong>Profile &amp; Contact Details:</strong> Business name, owner/manager name, email
                address (used as login), hashed password, phone number, business category (e.g. salon,
                auto-garage, clinic, restaurant, coaching centre, gym, retail, legal, hotel, home services,
                real estate, IT &amp; marketing), and custom industry if applicable.
              </li>
              <li>
                <strong>Google Review Destination URL:</strong> The public Google review link you provide,
                where your customers are redirected to publish their reviews.
              </li>
              <li>
                <strong>Services &amp; Offerings:</strong> The list of services you configure (e.g.
                &quot;Oil Change&quot;, &quot;Haircut &amp; Style&quot;, &quot;Dental Cleaning&quot;) to
                assist customers during the AI review drafting flow.
              </li>
              <li>
                <strong>Branding Assets:</strong> Business logo, custom brand colour, and any design
                preferences configured in the Standee Designer.
              </li>
              <li>
                <strong>Team Member Data:</strong> Names, email addresses, and assigned roles (Admin /
                Manager / Staff / Agent) of team members you invite to the platform under your business
                account.
              </li>
            </ul>

            <h3>B. Customer Feedback &amp; Review Drafting Data</h3>
            <ul>
              <li>
                <strong>Review Inputs:</strong> Selected service, star rating (1–5 stars), positive
                highlights, improvement notes, preferred review language, and review length preference
                entered by your customers on the public review page after scanning your QR code.
              </li>
              <li>
                <strong>AI Draft Text:</strong> The AI-generated review draft shown to the customer for
                copying. This draft is never posted by ReviewAssist — the customer pastes it to Google
                themselves.
              </li>
              <li>
                <strong>Private Feedback (Negative Review Shield):</strong> If a customer gives 1–3 stars,
                their name and optional contact (WhatsApp/email) — as voluntarily provided by the customer —
                along with their private feedback message, are stored securely and made visible only to the
                business owner in their Private Feedback Inbox.
              </li>
              <li>
                <strong>WhatsApp Inviter Records:</strong> Customer name and phone number that you manually
                enter when sending a WhatsApp review invite. This data is stored for your business&apos;s
                own records and tracking purposes.
              </li>
              <li>
                <strong>No Secret Surveillance:</strong> We do not scrape, harvest, or purchase customer
                contact data from any third party. We do not track customer behaviour outside our platform.
              </li>
            </ul>

            <h3>C. Payment &amp; Billing Information</h3>
            <ul>
              <li>
                <strong>Processed Exclusively by Razorpay:</strong> All credit/debit card numbers, UPI IDs,
                net banking credentials, and wallet tokens are processed directly by{' '}
                <strong>Razorpay Software Private Limited</strong>, a PCI-DSS Level 1 certified gateway.
                ReviewAssist never sees or stores your raw payment credentials.
              </li>
              <li>
                <strong>What We Store:</strong> We only retain anonymised transaction identifiers —
                Razorpay Payment ID, Order ID, subscription status, plan tier, billing interval, and
                renewal date — solely for account management and invoice generation.
              </li>
            </ul>

            <h3>D. Technical &amp; Usage Data</h3>
            <ul>
              <li>
                IP addresses, browser type and version, device type and OS, referring URLs, session
                duration, QR scan timestamps, and feature usage patterns — collected and used strictly for
                fraud prevention, rate-limiting, platform stability, and aggregate analytics (scan-to-review
                conversion rates shown on your dashboard).
              </li>
            </ul>
          </section>

          {/* 3. How We Use Your Information */}
          <section className="legal-section">
            <h2>3. How We Use Your Information</h2>
            <p>We use collected information strictly for the following legitimate business purposes:</p>
            <ul>
              <li>
                <strong>Operating the AI Review Drafting Copilot:</strong> Generating review drafts using
                AI language models (Google Gemini API) based strictly on the customer&apos;s selected
                service, star rating, and optional notes. Customer notes are sent to the AI API ephemerally
                — they are not stored in any AI training dataset.
              </li>
              <li>
                <strong>QR Code &amp; Standee Generation:</strong> Rendering high-resolution, print-ready
                QR assets and standee designs pointing to your unique business review URL.
              </li>
              <li>
                <strong>WhatsApp Review Inviter:</strong> Constructing personalised wa.me deep-link
                messages using the customer name and phone number you provide, to help you invite customers
                to leave reviews.
              </li>
              <li>
                <strong>AI Auto-Reply Copilot:</strong> Generating professional reply drafts to Google
                reviews shown in your dashboard, using review text and business context.
              </li>
              <li>
                <strong>Analytics &amp; Dashboard:</strong> Computing and displaying your scan-to-review
                rate, average rating, monthly review volume, top services reviewed, and private feedback
                inbox to help you understand your business performance.
              </li>
              <li>
                <strong>Billing &amp; Account Maintenance:</strong> Administering subscriptions, processing
                renewals, verifying trial eligibility, issuing invoices, and preventing abuse such as
                multiple free-trial exploitation.
              </li>
              <li>
                <strong>Team &amp; RBAC Management:</strong> Sending invitation emails to team members and
                enforcing role-based access control on your account.
              </li>
              <li>
                <strong>Service Improvement:</strong> Monitoring system uptime, response times, and error
                rates to improve platform performance. We do not use your private business data to train
                public AI foundation models.
              </li>
              <li>
                <strong>Legal Compliance &amp; Safety:</strong> Enforcing our Terms of Service, preventing
                fraud, and complying with applicable law including Indian Information Technology laws.
              </li>
            </ul>
          </section>

          {/* 4. AI Data Handling */}
          <section className="legal-section">
            <h2>4. AI Review Generation &amp; Data Handling</h2>
            <div className="legal-highlight-box">
              <span className="highlight-icon">🤖</span>
              <div>
                <strong>Customer Data Is Never Used to Train AI Models:</strong>
                <p>
                  When generating a review draft, our system sends only the selected service tag, star
                  rating level, optional customer notes, and business category to the AI API (Google
                  Gemini). We do not send customer names, phone numbers, or any personally identifiable
                  information to the AI model. Customer inputs are processed ephemerally and are not used
                  to fine-tune or train any public foundation AI model.
                </p>
              </div>
            </div>
            <p>
              The multilingual review engine supports inputs in Hindi, Gujarati, Marathi, English, Hinglish,
              and other languages. Customer notes in any language are processed temporarily to generate an
              English-language review draft. No raw customer notes are stored in plain text after draft
              generation — only the resulting review record (rating, service, collected timestamp) is
              retained in your business dashboard.
            </p>
          </section>

          {/* 5. Data Sharing */}
          <section className="legal-section">
            <h2>5. Data Sharing &amp; Third-Party Processors</h2>
            <p>
              We do <strong>not</strong> sell, rent, or trade personal data to third parties or data
              brokers. We share data only with trusted service providers strictly necessary for platform
              operations:
            </p>
            <ul>
              <li>
                <strong>Supabase Inc. (USA):</strong> Cloud database infrastructure, user authentication,
                and encrypted file storage. All data is stored with strict Row-Level Security (RLS)
                policies ensuring each business can only access its own records.
              </li>
              <li>
                <strong>Razorpay Software Pvt. Ltd. (India):</strong> Payment processing, recurring
                subscription billing, and RBI-compliant payment settlements. Governed by Razorpay&apos;s
                own Privacy Policy.
              </li>
              <li>
                <strong>Google LLC (USA) — Gemini API:</strong> Natural-language AI processing for review
                draft generation. Only ephemeral, anonymised service and rating context is transmitted.
                Governed by Google&apos;s API Terms of Service.
              </li>
              <li>
                <strong>Meta (WhatsApp) — wa.me Links:</strong> The WhatsApp Review Inviter constructs
                wa.me deep links that open the WhatsApp app. ReviewAssist does not access or store your
                WhatsApp account credentials or messages.
              </li>
            </ul>
          </section>

          {/* 6. Data Security */}
          <section className="legal-section">
            <h2>6. Data Security &amp; Storage</h2>
            <p>
              We implement industry-standard administrative, physical, and technical safeguards to protect
              your data:
            </p>
            <ul>
              <li>
                <strong>Encryption in Transit:</strong> All data transmitted between your browser and our
                servers is protected by 256-bit TLS/SSL encryption.
              </li>
              <li>
                <strong>Encryption at Rest:</strong> Database records are encrypted at rest on Supabase
                servers with AES-256 encryption.
              </li>
              <li>
                <strong>Row-Level Security (RLS):</strong> Database-level access policies ensure that each
                business account can only read and write its own data — no cross-contamination between
                business accounts is possible.
              </li>
              <li>
                <strong>Password Security:</strong> Passwords are hashed and salted using industry-standard
                algorithms (managed by Supabase Auth). Plain-text passwords are never stored on our servers.
              </li>
              <li>
                <strong>Role-Based Access Control:</strong> Your team members can only access features
                permitted by the role (Admin / Manager / Staff / Agent) you assign them within your
                business account.
              </li>
            </ul>
            <p>
              While we take every reasonable precaution, no method of electronic transmission or storage is
              100% secure. We encourage you to use a strong, unique password and to log out of the platform
              on shared devices.
            </p>
          </section>

          {/* 7. Data Retention */}
          <section className="legal-section">
            <h2>7. Data Retention &amp; Your Rights</h2>
            <p>
              You maintain meaningful control over your business data on ReviewAssist:
            </p>
            <ul>
              <li>
                <strong>Active Accounts:</strong> Business profile data, collected reviews, private
                feedback records, team configurations, and billing history are retained for the lifetime
                of your active account plus 90 days after cancellation.
              </li>
              <li>
                <strong>Access &amp; Correction:</strong> You can update your business name, category,
                services, Google review link, and branding from the <strong>Settings</strong> tab on your
                dashboard at any time.
              </li>
              <li>
                <strong>Data Export:</strong> Pro Growth and Enterprise subscribers can export all review
                and customer data as a CSV file directly from the dashboard.
              </li>
              <li>
                <strong>Data Deletion:</strong> You may request complete erasure of your business profile,
                all historical reviews, team members, private feedback records, and billing history by
                emailing{' '}
                <a href="mailto:support.reviewassist@gmail.com">support.reviewassist@gmail.com</a>. We
                will process verified deletion requests within 30 days.
              </li>
              <li>
                <strong>Transactional Communications:</strong> Billing invoices, subscription renewal
                reminders, and critical account security alerts will still be sent while your subscription
                is active, as these are necessary for account management.
              </li>
              <li>
                <strong>Marketing Communications:</strong> You may opt out of non-essential marketing
                emails at any time by clicking &quot;Unsubscribe&quot; in any marketing email or by
                contacting our support team.
              </li>
            </ul>
          </section>

          {/* 8. Cookies */}
          <section className="legal-section">
            <h2>8. Cookies &amp; Local Storage</h2>
            <p>
              ReviewAssist uses browser local storage and session cookies strictly for functional purposes:
            </p>
            <ul>
              <li>
                <strong>Authentication Session Tokens:</strong> To keep you logged in to your dashboard
                securely across page refreshes.
              </li>
              <li>
                <strong>UI Preferences:</strong> To remember dashboard tab selections, filter preferences,
                and language settings.
              </li>
            </ul>
            <p>
              We do <strong>not</strong> use third-party advertising cookies, cross-site tracking pixels,
              or behavioural profiling cookies of any kind.
            </p>
          </section>

          {/* 9. Children */}
          <section className="legal-section">
            <h2>9. Children&apos;s Privacy</h2>
            <p>
              ReviewAssist is a B2B SaaS platform intended for use by business owners and their adult
              staff members. We do not knowingly collect personal information from individuals under the
              age of 18. If you believe a minor has submitted personal data through our Service, please
              contact us immediately and we will delete such data promptly.
            </p>
          </section>

          {/* 10. Changes */}
          <section className="legal-section">
            <h2>10. Changes to This Privacy Policy</h2>
            <p>
              We may update this Privacy Policy periodically to reflect changes in our practices,
              technology, or legal requirements. We will notify you of material changes via email at least{' '}
              <strong>14 days before</strong> the updated policy takes effect. Your continued use of the
              Service after the effective date constitutes acceptance of the revised policy.
            </p>
          </section>

          {/* 11. Contact */}
          <section className="legal-section">
            <h2>11. Contact — Data Protection</h2>
            <p>
              For privacy-related inquiries, data access requests, deletion requests, or compliance
              questions, please contact our support team:
            </p>
            <div className="legal-contact-card">
              <p><strong>ReviewAssist Privacy &amp; Data Team</strong></p>
              <p>Email: <a href="mailto:support.reviewassist@gmail.com">support.reviewassist@gmail.com</a></p>
              <p>WhatsApp: <a href="https://wa.me/919537370561" target="_blank" rel="noopener noreferrer">+91 95373 70561</a></p>
              <p>ReviewAssist Technologies &bull; Gujarat, India</p>
            </div>
          </section>

        </div>

        {/* Bottom Navigation */}
        <div className="legal-bottom-nav">
          <Link to="/terms" className="legal-nav-btn">
            Terms of Service &rarr;
          </Link>
          <Link to="/google-guidelines" className="legal-nav-btn">
            Google Review Guidelines &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}
