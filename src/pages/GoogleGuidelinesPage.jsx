import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function GoogleGuidelinesPage() {
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
            <span>Policy</span>
            <span className="breadcrumb-sep">/</span>
            <span className="breadcrumb-current">Google Guidelines</span>
          </div>
          <div className="legal-badge-pill google-pill">⭐ Google Compliance</div>
          <h1 className="legal-page-title">Google Review Compliance &amp; Guidelines</h1>
          <p className="legal-page-subtitle">
            How ReviewAssist ensures 100% compliance with Google Maps, Google Business Profile policies, and FTC guidelines for honest customer reviews.
          </p>
          <div className="legal-meta-bar">
            <span>Last Verified with Google Policies: <strong>{lastUpdated}</strong></span>
            <span>•</span>
            <span>Status: <strong className="status-compliant">✓ Fully Compliant Architecture</strong></span>
          </div>
        </div>

        {/* Content Body */}
        <div className="legal-content-card">
          {/* Core Philosophy Banner */}
          <div className="google-compliance-hero-card">
            <div className="hero-badge-icon">🛡️</div>
            <div>
              <h3>Built from Day 1 to Respect Google&apos;s Review Integrity</h3>
              <p>
                Google enforces strict policies to protect the authenticity of Google Maps and local search results. ReviewAssist is purposefully designed as an <strong>in-person customer enablement tool</strong>, NOT a fake review farm, gating bot, or manipulative funnel. Every single architecture decision in ReviewAssist aligns with Google&apos;s Prohibited and Restricted Content policies.
              </p>
            </div>
          </div>

          <section className="legal-section">
            <h2>1. The Four Golden Rules of Google Review Compliance</h2>

            <div className="compliance-pillars-grid">
              {/* Pillar 1: No Review Gating */}
              <div className="pillar-card">
                <div className="pillar-icon">🚫</div>
                <h4>1. No Review Gating</h4>
                <p>
                  <strong>Google Policy:</strong> Businesses must not selectively solicit reviews from satisfied customers while discouraging, suppressing, or trapping negative feedback.
                </p>
                <div className="pillar-our-solution">
                  <span className="solution-tag">How We Comply:</span>
                  <p>
                    ReviewAssist allows <strong>all customers (1 to 5 stars)</strong> to navigate directly to your Google Maps review page. We never block, conceal, or manipulate negative sentiment from reaching Google.
                  </p>
                </div>
              </div>

              {/* Pillar 2: No Incentivization */}
              <div className="pillar-card">
                <div className="pillar-icon">🎁</div>
                <h4>2. Zero Incentivization</h4>
                <p>
                  <strong>Google Policy:</strong> Offering incentives, discounts, free gifts, contest entries, or payment in exchange for customer reviews is strictly forbidden.
                </p>
                <div className="pillar-our-solution">
                  <span className="solution-tag">How We Comply:</span>
                  <p>
                    ReviewAssist provides no mechanism for discounts or bribes in exchange for reviews. Standee templates promote honest feedback (&quot;Tell us how we did today!&quot;).
                  </p>
                </div>
              </div>

              {/* Pillar 3: Genuine Customer Voice */}
              <div className="pillar-card">
                <div className="pillar-icon">✍️</div>
                <h4>3. Authentic Customer Voice</h4>
                <p>
                  <strong>Google Policy:</strong> Reviews must represent the actual, genuine personal experience of real clients who visited the business.
                </p>
                <div className="pillar-our-solution">
                  <span className="solution-tag">How We Comply:</span>
                  <p>
                    The customer selects specific service tags (e.g. &quot;Brake Inspection&quot;) and personal impressions. The AI generates a draft that the customer <em>reads, edits, and manually posts</em> from their own personal Google account.
                  </p>
                </div>
              </div>

              {/* Pillar 4: Conflict of Interest */}
              <div className="pillar-card">
                <div className="pillar-icon">👥</div>
                <h4>4. Conflict of Interest</h4>
                <p>
                  <strong>Google Policy:</strong> Business owners, managers, employees, and hired marketing agencies are prohibited from reviewing their own business.
                </p>
                <div className="pillar-our-solution">
                  <span className="solution-tag">How We Comply:</span>
                  <p>
                    Standees and QR codes are placed in public customer-facing areas (counters, table tents, checkout areas) for real patrons to scan on their personal devices.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="legal-section">
            <h2>2. How AI is Used Responsibly (Assistance vs. Fake Content)</h2>
            <p>
              Many customers struggle to write detailed online reviews due to lack of time, language barriers, or difficulty formulating their thoughts into full sentences. ReviewAssist bridges this gap responsibly:
            </p>
            <div className="ai-comparison-table-wrapper">
              <table className="legal-table">
                <thead>
                  <tr>
                    <th>ReviewAssist AI Copilot (Allowed)</th>
                    <th>Spam / Fake Review Bots (Prohibited by Google)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>
                      <span className="table-check">✓</span> Customer initiates the review in-store on their own smartphone.
                    </td>
                    <td>
                      <span className="table-cross">✗</span> Automated headless bots mass-posting fabricated reviews from fake accounts.
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <span className="table-check">✓</span> Customer selects true tags reflecting their real service (e.g. &quot;Prompt service&quot;, &quot;Honest pricing&quot;).
                    </td>
                    <td>
                      <span className="table-cross">✗</span> AI hallucinating fictitious experiences for customers who never visited the business.
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <span className="table-check">✓</span> Review text is placed onto clipboard for customer to review and modify before posting.
                    </td>
                    <td>
                      <span className="table-cross">✗</span> Reviews posted via API without customer knowledge or consent.
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <span className="table-check">✓</span> Review is submitted by the authentic Google account of the patron on Google Maps.
                    </td>
                    <td>
                      <span className="table-cross">✗</span> Bulk Google accounts managed through proxies to artificially inflate ratings.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section className="legal-section">
            <h2>3. Best Practices Checklist for Business Owners</h2>
            <p>
              To maximize your Google ranking, reputation, and customer loyalty while remaining 100% compliant, follow these operational best practices:
            </p>

            <div className="best-practices-grid">
              <div className="bp-card do-card">
                <div className="bp-header">
                  <span className="bp-icon">✅</span>
                  <h4>Do&apos;s</h4>
                </div>
                <ul>
                  <li>Place high-quality acrylic QR standees right at your checkout counter, reception desk, or restaurant tables.</li>
                  <li>Train your frontline staff to politely invite customers: <em>&quot;If you enjoyed your service today, please scan this QR code to share your feedback on Google!&quot;</em></li>
                  <li>Use our <strong>WhatsApp Customer Inviter</strong> to follow up with real clients within 2 hours of their visit.</li>
                  <li>Respond to every Google review (both positive and negative) within 24–48 hours using professional, constructive replies.</li>
                </ul>
              </div>

              <div className="bp-card dont-card">
                <div className="bp-header">
                  <span className="bp-icon">❌</span>
                  <h4>Don&apos;ts</h4>
                </div>
                <ul>
                  <li><strong>Never offer discounts, coupons, or free products</strong> in exchange for a 5-star Google review.</li>
                  <li><strong>Never ask staff or friends to review your business</strong> if they were not genuine customers.</li>
                  <li><strong>Never use a single tablet or in-store computer kiosk</strong> for customers to log in and review (Google filters multiple reviews submitted from the same IP or shared device as spam).</li>
                  <li><strong>Never delete or hide negative reviews</strong>—treat constructive feedback as an opportunity to demonstrate world-class service.</li>
                </ul>
              </div>
            </div>
          </section>

          <section className="legal-section">
            <h2>4. FTC (Federal Trade Commission) &amp; Consumer Protection Compliance</h2>
            <p>
              In addition to Google&apos;s rules, regulatory bodies such as the U.S. Federal Trade Commission (FTC), the Advertising Standards Council of India (ASCI), and consumer protection authorities penalize deceptive endorsements:
            </p>
            <ul>
              <li><strong>No Undisclosed Endorsements:</strong> Any review originating from a person who received compensation or has an affiliation must state this clearly. ReviewAssist strictly prohibits incentivized campaigns.</li>
              <li><strong>Truth in Advertising:</strong> Business claims must be substantiated and cannot mislead local shoppers looking for genuine service providers.</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>5. Official Reference Links</h2>
            <p>For more detailed information directly from Google, review their official policies:</p>
            <ul className="legal-links-bulleted">
              <li>
                <a href="https://support.google.com/contributionpolicy/answer/7400114" target="_blank" rel="noopener noreferrer">
                  Google Maps User Contributed Content Policy &rarr;
                </a>
              </li>
              <li>
                <a href="https://support.google.com/business/answer/3474122" target="_blank" rel="noopener noreferrer">
                  Google Business Profile Policies on Managing &amp; Requesting Reviews &rarr;
                </a>
              </li>
              <li>
                <a href="https://www.ftc.gov/business-guidance/resources/ftcs-endorsement-guides-what-people-are-asking" target="_blank" rel="noopener noreferrer">
                  FTC Endorsement Guides for Online Reviews &rarr;
                </a>
              </li>
            </ul>
          </section>
        </div>

        {/* Bottom Navigation */}
        <div className="legal-bottom-nav">
          <Link to="/privacy" className="legal-nav-btn">
            &larr; Privacy Policy
          </Link>
          <Link to="/terms" className="legal-nav-btn">
            &larr; Terms of Service
          </Link>
        </div>
      </div>
    </div>
  );
}
