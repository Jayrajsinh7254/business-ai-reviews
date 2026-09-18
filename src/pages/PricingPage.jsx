import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PLAN_LIST } from '../lib/plans';
import { useAuth } from '../context/AuthContext';
import SubscriptionModal from '../components/SubscriptionModal';

export default function PricingPage() {
  const [billingInterval, setBillingInterval] = useState('monthly');
  const [showSubModal, setShowSubModal] = useState(false);
  const [selectedPlanForModal, setSelectedPlanForModal] = useState('pro');
  const [openFaq, setOpenFaq] = useState(0);

  const { user, subscription } = useAuth();
  const navigate = useNavigate();

  const handleChoosePlan = (planId) => {
    setSelectedPlanForModal(planId);
    if (!user) {
      navigate(`/signup?plan=${planId}&interval=${billingInterval}`);
    } else {
      setShowSubModal(true);
    }
  };

  const pricingFaqs = [
    {
      q: 'Can I switch or cancel my monthly subscription anytime?',
      a: 'Yes, absolutely! ReviewAssist offers month-to-month flexibility with zero lock-in contracts. You can upgrade, downgrade, or cancel your subscription directly from your dashboard billing settings in 1 click.',
    },
    {
      q: 'How does the 14-day free trial work?',
      a: 'When you register your business, you get full 14-day access to our Pro Growth Plan with unlimited AI review generations, customized standee printing, and WhatsApp invite automation without being charged upfront.',
    },
    {
      q: 'What happens when my staff invites customers via WhatsApp or SMS?',
      a: 'Your team can send personalized 1-click review invites directly through WhatsApp Web or the WhatsApp app. Customers tap the secure link and our AI translates their thoughts and writes an authentic 5-star review in under 30 seconds.',
    },
    {
      q: 'Can I add multiple locations under one account?',
      a: 'Yes! The Pro Plan supports up to 3 locations, while the Enterprise Plan supports unlimited locations with centralized multi-store analytics and team role delegation.',
    },
    {
      q: 'Do you offer white-labeling for marketing agencies and multi-franchise owners?',
      a: 'Yes, our Enterprise Plan includes complete white-label standees, custom branding colors, and your own business domain links.',
    },
  ];

  return (
    <div className="pricing-page-wrapper">
      {/* 1. Header Hero */}
      <section className="pricing-hero-section text-center">
        <div className="section-container">
          <div className="pricing-hero-badge animate-fade-in">
            <span className="badge-sparkle">💎</span>
            <span>Simple, Transparent SaaS Pricing</span>
            <span className="badge-pill">14-Day Free Trial</span>
          </div>

          <h1 className="pricing-headline">
            Choose the Perfect Plan to <br />
            <span className="gradient-text">Skyrocket Your Google Reviews</span>
          </h1>

          <p className="pricing-subheadline">
            Get more 5-star reviews on autopilot. Start free for 14 days, upgrade as you grow, cancel anytime.
          </p>

          {/* Billing Interval Toggle */}
          <div className="pricing-billing-toggle-wrap">
            <div className="pricing-toggle-pill">
              <button
                type="button"
                className={`pricing-toggle-btn ${billingInterval === 'monthly' ? 'active' : ''}`}
                onClick={() => setBillingInterval('monthly')}
              >
                Monthly Billing
              </button>
              <button
                type="button"
                className={`pricing-toggle-btn ${billingInterval === 'annual' ? 'active' : ''}`}
                onClick={() => setBillingInterval('annual')}
              >
                Annual Billing <span className="save-badge">Save 20% + 2 Mo Free</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Pricing Cards Grid */}
      <section className="pricing-cards-section">
        <div className="section-container">
          <div className="pricing-cards-grid">
            {PLAN_LIST.map((plan) => {
              const isCurrent = subscription?.planId === plan.id;
              const price = billingInterval === 'annual' ? plan.annualPrice : plan.monthlyPrice;

              return (
                <div
                  key={plan.id}
                  className={`pricing-tier-card ${plan.isPopular ? 'popular-card' : ''}`}
                >
                  {plan.badge && (
                    <div className="tier-popular-badge">
                      <span>★ {plan.badge}</span>
                    </div>
                  )}

                  <div className="tier-card-header">
                    <h3 className="tier-name">{plan.name}</h3>
                    <p className="tier-tagline">{plan.tagline}</p>
                    <div className="tier-price-box">
                      <span className="tier-currency">{plan.currency}</span>
                      <span className="tier-price-val">{price}</span>
                      <span className="tier-period">/ month</span>
                    </div>
                    {billingInterval === 'annual' && (
                      <span className="tier-billed-annually">Billed annually (${price * 12}/yr)</span>
                    )}
                  </div>

                  <div className="tier-cta-box">
                    <button
                      type="button"
                      className={`btn-block btn-lg ${plan.isPopular ? 'btn-primary btn-glow' : 'btn-secondary'}`}
                      onClick={() => handleChoosePlan(plan.id)}
                    >
                      {isCurrent ? '✓ Current Plan' : `Get Started with ${plan.name}`}
                    </button>
                    <span className="tier-guarantee-note">14-day free trial • No credit card required</span>
                  </div>

                  <div className="tier-features-divider">
                    <span>What's included:</span>
                  </div>

                  <ul className="tier-features-list">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="tier-feature-item">
                        <span className="feature-check-icon">✓</span>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 3. Detailed Feature Comparison Matrix */}
      <section className="pricing-matrix-section">
        <div className="section-container">
          <div className="section-header text-center">
            <span className="section-tag">Feature Breakdown</span>
            <h2 className="section-title">Compare All Features & Limits</h2>
            <p className="section-desc">Full transparency into every tier so you can choose with confidence.</p>
          </div>

          <div className="matrix-table-card">
            <table className="matrix-table">
              <thead>
                <tr>
                  <th className="col-feature">Core Platform Features</th>
                  <th>Starter ($19/mo)</th>
                  <th className="col-highlight">Pro Growth ($49/mo)</th>
                  <th>Enterprise ($99/mo)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="feature-name-cell">
                    <strong>Business Locations Included</strong>
                    <span>Separate review hubs & QR codes</span>
                  </td>
                  <td>1 Location</td>
                  <td className="col-highlight"><strong>3 Locations</strong></td>
                  <td><strong>Unlimited</strong></td>
                </tr>

                <tr>
                  <td className="feature-name-cell">
                    <strong>AI Review Generations</strong>
                    <span>Multilingual authentic Google review drafts</span>
                  </td>
                  <td>100 / month</td>
                  <td className="col-highlight"><span className="tag-unlimited">Unlimited</span></td>
                  <td><span className="tag-unlimited">Unlimited</span></td>
                </tr>

                <tr>
                  <td className="feature-name-cell">
                    <strong>WhatsApp & SMS 1-Click Inviter</strong>
                    <span>Direct review requests to customer phones</span>
                  </td>
                  <td>100 invites / mo</td>
                  <td className="col-highlight"><span className="tag-unlimited">Unlimited</span></td>
                  <td><span className="tag-unlimited">Unlimited</span></td>
                </tr>

                <tr>
                  <td className="feature-name-cell">
                    <strong>QR Standee & Poster Designer</strong>
                    <span>Printable high-res counter standees and table tents</span>
                  </td>
                  <td>Counter & Table Tent</td>
                  <td className="col-highlight">All 4 Pro Templates + Custom Colors</td>
                  <td>All Templates + Custom Dimensions</td>
                </tr>

                <tr>
                  <td className="feature-name-cell">
                    <strong>AI Review Auto-Reply Copilot</strong>
                    <span>1-click intelligent owner responses to customer reviews</span>
                  </td>
                  <td>—</td>
                  <td className="col-highlight">✓ Included</td>
                  <td>✓ Included (Priority AI)</td>
                </tr>

                <tr>
                  <td className="feature-name-cell">
                    <strong>Team & Staff Seats (RBAC)</strong>
                    <span>Front-desk staff & manager user accounts</span>
                  </td>
                  <td>1 Seat</td>
                  <td className="col-highlight"><strong>Up to 5 Seats</strong></td>
                  <td><strong>Unlimited Seats</strong></td>
                </tr>

                <tr>
                  <td className="feature-name-cell">
                    <strong>CSV / Excel Export</strong>
                    <span>Download feedback reports & customer data</span>
                  </td>
                  <td>—</td>
                  <td className="col-highlight">✓ Included</td>
                  <td>✓ Included</td>
                </tr>

                <tr>
                  <td className="feature-name-cell">
                    <strong>White-Labeling & Custom Domain</strong>
                    <span>Custom brand styling and URL mapping</span>
                  </td>
                  <td>—</td>
                  <td className="col-highlight">—</td>
                  <td>✓ Full White-Label</td>
                </tr>

                <tr>
                  <td className="feature-name-cell">
                    <strong>Support & SLA</strong>
                    <span>Customer success assistance</span>
                  </td>
                  <td>Standard Email</td>
                  <td className="col-highlight">Priority Support</td>
                  <td>Dedicated Account Manager (24/7 SLA)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* 4. Pricing FAQs */}
      <section className="pricing-faq-section">
        <div className="section-container">
          <div className="section-header text-center">
            <span className="section-tag">Pricing Questions</span>
            <h2 className="section-title">Frequently Asked Questions</h2>
          </div>

          <div className="faq-accordion-list">
            {pricingFaqs.map((faq, idx) => (
              <div
                key={idx}
                className={`faq-accordion-item ${openFaq === idx ? 'open' : ''}`}
                onClick={() => setOpenFaq(openFaq === idx ? -1 : idx)}
              >
                <div className="faq-question-row">
                  <h3 className="faq-question">{faq.q}</h3>
                  <span className="faq-toggle-icon">{openFaq === idx ? '−' : '+'}</span>
                </div>
                {openFaq === idx && (
                  <div className="faq-answer-content animate-fade-in">
                    <p>{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Bottom Call to Action */}
      <section className="bottom-cta-section">
        <div className="section-container">
          <div className="bottom-cta-card">
            <div className="cta-glow-bg"></div>
            <div className="cta-content text-center">
              <h2 className="cta-headline">Start Your 14-Day Free Pro Trial Today</h2>
              <p className="cta-subtext">
                Set up your business profile in 2 minutes and start collecting 5-star Google reviews immediately.
              </p>
              <div className="cta-buttons-group">
                <Link to="/signup?plan=pro" className="btn-primary btn-xl">
                  🚀 Start Free Business Trial
                </Link>
                <Link to="/dashboard/demo-1" className="btn-outline-white btn-xl">
                  📊 Explore Interactive Dashboard
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Subscription Upgrade Checkout Modal */}
      {showSubModal && (
        <SubscriptionModal
          isOpen={showSubModal}
          onClose={() => setShowSubModal(false)}
          selectedPlanId={selectedPlanForModal}
        />
      )}
    </div>
  );
}
