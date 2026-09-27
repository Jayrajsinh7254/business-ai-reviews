import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function PrivacyPolicyPage() {
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
            <span className="breadcrumb-current">Privacy Policy</span>
          </div>
          <div className="legal-badge-pill">🔒 Trust & Security</div>
          <h1 className="legal-page-title">Privacy Policy</h1>
          <p className="legal-page-subtitle">
            How ReviewAssist collects, protects, processes, and respects your personal and business data.
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
            <h2>1. Introduction & Scope</h2>
            <p>
              ReviewAssist Technologies (&quot;ReviewAssist&quot;, &quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) is committed to protecting the privacy and confidentiality of businesses and their end-customers. This Privacy Policy explains our practices regarding the collection, use, and disclosure of information when you use our website, QR code generation system, WhatsApp inviter, and AI-assisted review tools (collectively, the &quot;Service&quot;).
            </p>
            <p>
              By accessing or using ReviewAssist, you agree to the collection and handling of your information as described in this policy. We comply with applicable data protection regulations, including the Digital Personal Data Protection Act (DPDP Act, India) and international best practices (such as GDPR principles).
            </p>
          </section>

          <section className="legal-section">
            <h2>2. Information We Collect</h2>
            <p>We collect information in the following categories:</p>

            <h3>A. Business Account Information</h3>
            <ul>
              <li><strong>Contact & Profile Details:</strong> Business name, owner/manager name, email address, password hash, phone number, category (e.g. automobile, salon, clinic, restaurant), and physical address or Google Maps Place ID.</li>
              <li><strong>Google Review Destination URL:</strong> The public link provided by the business where customers are redirected to publish reviews.</li>
              <li><strong>Services & Offerings:</strong> List of tags and service offerings (e.g. &quot;Oil Change&quot;, &quot;Facial Glow&quot;) configured to assist customers during review drafting.</li>
            </ul>

            <h3>B. Customer Feedback & Review Drafting Data</h3>
            <ul>
              <li><strong>Feedback Attributes:</strong> Selected service tags, star rating (1–5), positive highlights, and optional improvement feedback entered by customers on the public review page.</li>
              <li><strong>Customer Name & Optional Contact:</strong> If provided voluntarily by the customer during review drafting or via WhatsApp invitations.</li>
              <li><strong>No Secret Surveillance:</strong> We do NOT scrape or harvest customer contacts without explicit authorization, nor do we track customer browsing outside our domain.</li>
            </ul>

            <h3>C. Payment & Billing Information</h3>
            <ul>
              <li>
                <strong>Processed Exclusively by Razorpay:</strong> All credit/debit card numbers, UPI IDs, net banking credentials, and wallet tokens are processed directly by our PCI-DSS Level 1 certified payment gateway, <strong>Razorpay</strong>.
              </li>
              <li>
                <strong>What We Store:</strong> ReviewAssist never stores raw credit/debit card numbers or CVVs on our servers. We only store anonymized transaction identifiers (e.g., Razorpay Payment ID, Order ID, subscription status, and billing renewal dates).
              </li>
            </ul>

            <h3>D. Technical & Usage Logs</h3>
            <ul>
              <li>IP addresses, browser type, device details, operating system, referring URLs, and timestamped QR scan metrics used strictly for fraud prevention, rate-limiting, and aggregate dashboard analytics.</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>3. How We Use Your Information</h2>
            <p>We utilize the collected information strictly for legitimate business purposes:</p>
            <ul>
              <li><strong>Operating the AI Review Copilot:</strong> Generating drafted review copy using AI models (e.g., Google Gemini) based strictly on user-selected tags and sentiments.</li>
              <li><strong>QR Code Generation & Standee Studio:</strong> Rendering high-resolution printable QR assets pointing to your public business review URL.</li>
              <li><strong>Billing & Account Maintenance:</strong> Administering subscriptions, verifying payments, managing trials, and preventing abuse or multiple free-trial exploits.</li>
              <li><strong>Service Optimization:</strong> Monitoring system uptime, response times, and improving model drafting accuracy without using private business data to train public foundation models.</li>
              <li><strong>Compliance & Legal Defense:</strong> Enforcing our Terms of Service and adhering to applicable commercial laws.</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>4. AI Review Generation & Data Handling</h2>
            <div className="legal-highlight-box">
              <span className="highlight-icon">🤖</span>
              <div>
                <strong>Zero Customer Review Trapping or Fake Data Mining:</strong>
                <p>
                  Prompts sent to our AI copilot contain only ephemeral service tags and rating sentiments. We do NOT use your customers&apos; names or sensitive personal information to train foundation AI models. ReviewAssist serves strictly as an assistive writing tool to help willing customers articulate their real experience faster.
                </p>
              </div>
            </div>
          </section>

          <section className="legal-section">
            <h2>5. Data Sharing & Third-Party Processors</h2>
            <p>We do not sell, rent, or trade personal data to third parties or data brokers. We share data only with trusted service providers essential for platform operations:</p>
            <ul>
              <li><strong>Supabase Inc.:</strong> Cloud database infrastructure, authentication, and encrypted storage with strict Row-Level Security (RLS).</li>
              <li><strong>Razorpay Software Private Limited:</strong> Payment processing, recurring subscriptions, and RBI-compliant payment settlements.</li>
              <li><strong>Google LLC:</strong> Gemini API for natural-language review text drafting. Final customer reviews are manually published by end-customers onto Google Maps/Business Profiles.</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>6. Data Security & Storage</h2>
            <p>
              We implement industry-standard administrative, physical, and electronic security safeguards. These include:
            </p>
            <ul>
              <li>256-bit TLS/SSL encryption for all data in transit.</li>
              <li>Row-Level Security (RLS) policies at the database layer ensuring businesses can only view their own records and metrics.</li>
              <li>Hashed and salted authentication credentials with zero plain-text password storage.</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>7. Data Retention & Your Rights</h2>
            <p>
              You maintain complete control over your business data:
            </p>
            <ul>
              <li><strong>Access & Correction:</strong> You can review and update your profile, branding, and services directly from the dashboard settings.</li>
              <li><strong>Data Deletion:</strong> You may request complete erasure of your business profile, historical reviews, and team members by contacting support.</li>
              <li><strong>Opt-Out of Communications:</strong> Transactional emails and invoices will still be sent as necessary for active subscriptions.</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>8. Contact Information</h2>
            <p>
              For privacy-related inquiries, data requests, or compliance questions, please contact our Data Protection Officer:
            </p>
            <div className="legal-contact-card">
              <p><strong>ReviewAssist Technologies Privacy Team</strong></p>
              <p>Email: <a href="mailto:privacy@reviewassist.ai">privacy@reviewassist.ai</a></p>
              <p>Support: <a href="mailto:support@reviewassist.ai">support@reviewassist.ai</a></p>
              <p>Address: Bengaluru, Karnataka, India</p>
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
