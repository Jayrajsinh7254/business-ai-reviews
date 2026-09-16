import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import StarRating from '../components/StarRating';
import { api } from '../api/client';

export default function HomePage() {
  // Live Demo Sandbox State
  const [demoRating, setDemoRating] = useState(5);
  const [demoService, setDemoService] = useState('Oil Change & Inspection');
  const [demoDraft, setDemoDraft] = useState(
    'Came in for an oil change and inspection this morning. Super quick service, honest pricing, and the technician was really polite and helpful. Will definitely be coming back for future maintenance!'
  );
  const [generatingDemo, setGeneratingDemo] = useState(false);
  const [openFaq, setOpenFaq] = useState(0);

  const handleGenerateLiveDemo = async (newRating) => {
    const activeRating = typeof newRating === 'number' ? newRating : demoRating;
    setGeneratingDemo(true);
    try {
      const res = await api.generateDraftReview({
        businessId: 'demo-1',
        serviceType: demoService,
        whatStoodOut: demoNotes || 'friendly team and prompt service',
        rating: activeRating,
      });
      if (res?.draftText) {
        setDemoDraft(res.draftText);
      }
    } catch (err) {
      console.warn('Demo generation error:', err);
    } finally {
      setGeneratingDemo(false);
    }
  };

  const handleDemoRatingChange = (r) => {
    setDemoRating(r);
    handleGenerateLiveDemo(r);
  };

  const faqs = [
    {
      q: 'How does ReviewAssist collect Google reviews without friction?',
      a: 'Most customers abandon reviews because they don’t know what to write or find the process tedious. ReviewAssist provides a custom QR code standee for your counter. Customers scan with any phone, select their star rating, type 2–3 rough bullet points or speak in any language, and our AI writes an authentic, grammatically flawless review that they paste directly to Google in one click.',
    },
    {
      q: 'Can customers write in Hindi, Spanish, or rough informal notes?',
      a: 'Yes! ReviewAssist supports notes in any language (Hindi, Hinglish, Spanish, French, Gujarati, broken English, etc.). The AI translates and transforms their thoughts into clear, fluent, authentic English tailored to their selected star rating.',
    },
    {
      q: 'Does this comply with Google’s review policies?',
      a: '100% compliant. ReviewAssist does not gate or fabricate reviews. The review is written from the customer’s actual firsthand thoughts and submitted by the customer directly from their personal Google account.',
    },
    {
      q: 'What kind of businesses benefit most from ReviewAssist?',
      a: 'Any local business with in-person or service-based customer interactions: Auto Repair shops, Hair Salons & Spas, Dental & Medical Clinics, Restaurants & Cafes, Real Estate agencies, Gyms, and Home Trade Contractors.',
    },
    {
      q: 'How fast can I set up my business?',
      a: 'Under 2 minutes! Just sign up, enter your business name and services, and instantly download or print your customized QR code standee.',
    },
  ];

  return (
    <div className="landing-page-wrapper">
      {/* 1. HERO SECTION */}
      <section className="hero-section" aria-label="Introduction">
        <div className="hero-glow-blob hero-glow-1"></div>
        <div className="hero-glow-blob hero-glow-2"></div>

        <div className="hero-container">
          <div className="hero-badge animate-fade-in">
            <span className="badge-sparkle">✨</span>
            <span>AI-Powered Google Reviews Copilot</span>
            <span className="badge-pill">30s Flow</span>
          </div>

          <h1 className="hero-headline">
            Turn In-Store Customers Into <br />
            <span className="gradient-text">Authentic 5-Star Google Reviews</span>
          </h1>

          <p className="hero-subheadline">
            Stop losing 90% of happy customers to review friction. Customers scan a custom QR code, share 2 quick thoughts in <em>any language</em>, and our AI crafts a ready-to-post Google review in seconds.
          </p>

          <div className="hero-cta-buttons">
            <Link to="/signup" className="btn-primary btn-xl hero-btn-glow">
              🚀 Start Free Business Setup
            </Link>
            <Link to="/review/demo-1" className="btn-secondary btn-xl">
              📱 Test Customer Flow
            </Link>
          </div>

          <div className="hero-trust-bar">
            <div className="trust-item">
              <span className="trust-stars">★★★★★</span>
              <span><strong>4.9 / 5</strong> Average Rating</span>
            </div>
            <div className="trust-divider">•</div>
            <div className="trust-item">
              <span>⚡ <strong>5x Faster</strong> Review Completion</span>
            </div>
            <div className="trust-divider">•</div>
            <div className="trust-item">
              <span>🔒 <strong>100%</strong> Google Compliant</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. INTERACTIVE LIVE AI DEMO SANDBOX */}
      <section className="demo-sandbox-section" aria-label="Interactive AI Demo">
        <div className="section-container">
          <div className="section-header text-center">
            <span className="section-tag">Interactive Preview</span>
            <h2 className="section-title">See How AI Shapes Reviews in Real Time</h2>
            <p className="section-desc">
              Try picking a star rating below and see how the AI dynamically adapts tone, vocabulary, and sentiment!
            </p>
          </div>

          <div className="sandbox-card">
            <div className="sandbox-grid">
              {/* Left Sandbox Controls */}
              <div className="sandbox-inputs">
                <div className="sandbox-input-header">
                  <span className="sandbox-step-num">1</span>
                  <h3>Customer Inputs (Any Language)</h3>
                </div>

                <div className="form-group">
                  <label className="form-label">Service Received</label>
                  <select
                    className="form-select"
                    value={demoService}
                    onChange={(e) => {
                      setDemoService(e.target.value);
                      handleGenerateLiveDemo();
                    }}
                  >
                    <option value="Oil Change & Inspection">Auto: Oil Change & Inspection</option>
                    <option value="Hair Styling & Balayage">Salon: Hair Styling & Balayage</option>
                    <option value="Chef's Special Dinner">Dining: Chef's Special Dinner</option>
                    <option value="Teeth Whitening Consultation">Clinic: Dental Whitening</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Customer Rating Selected</label>
                  <div className="sandbox-star-picker">
                    <StarRating
                      rating={demoRating}
                      onChange={handleDemoRatingChange}
                      size="md"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Customer's Raw Notes</label>
                  <textarea
                    className="form-textarea"
                    rows="3"
                    value={demoNotes}
                    onChange={(e) => setDemoNotes(e.target.value)}
                    placeholder="Type rough notes or bullet points..."
                  />
                </div>

                <button
                  type="button"
                  className="btn-primary btn-block"
                  onClick={() => handleGenerateLiveDemo(demoRating)}
                  disabled={generatingDemo}
                >
                  {generatingDemo ? '✨ Crafting with AI...' : '✨ Re-Generate Review'}
                </button>
              </div>

              {/* Right Sandbox Output */}
              <div className="sandbox-output">
                <div className="sandbox-output-header">
                  <div className="sandbox-step-num step-success">2</div>
                  <div>
                    <h3>AI-Generated Google Review</h3>
                    <span className={`sentiment-badge rating-${demoRating}`}>
                      {demoRating === 5 && '🌟 5-Star (Enthusiastic)'}
                      {demoRating === 4 && '👍 4-Star (Positive)'}
                      {demoRating === 3 && '⚖️ 3-Star (Balanced)'}
                      {demoRating === 2 && '👎 2-Star (Dissatisfied)'}
                      {demoRating === 1 && '⚠️ 1-Star (Critical)'}
                    </span>
                  </div>
                </div>

                <div className="sandbox-review-bubble">
                  <div className="review-bubble-stars">
                    <StarRating rating={demoRating} readOnly size="sm" />
                  </div>
                  <p className="review-bubble-text">
                    {generatingDemo ? (
                      <span className="demo-skeleton-loading">
                        <span className="spinner"></span> Polishing review draft...
                      </span>
                    ) : (
                      `"${demoDraft}"`
                    )}
                  </p>
                </div>

                <div className="sandbox-output-footer">
                  <div className="sandbox-action-badge">
                    <span>📋 Auto-Copied to Clipboard</span>
                  </div>
                  <div className="sandbox-action-badge">
                    <span>🚀 1-Click Launch into Google Reviews</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. HOW IT WORKS TIMELINE */}
      <section className="how-it-works-section" aria-label="How It Works">
        <div className="section-container">
          <div className="section-header text-center">
            <span className="section-tag">Frictionless 30-Second Flow</span>
            <h2 className="section-title">How ReviewAssist Works for Your Customers</h2>
            <p className="section-desc">
              Eliminate writer’s block and turn quick visits into long-form Google reviews.
            </p>
          </div>

          <div className="steps-cards-grid">
            <div className="step-card">
              <div className="step-badge-icon">📱 1</div>
              <h3 className="step-card-title">Scan Custom QR Standee</h3>
              <p className="step-card-text">
                Place your branded QR code standee on reception desks, tables, or checkout counters. Customers open camera and tap.
              </p>
            </div>

            <div className="step-card">
              <div className="step-badge-icon">✍️ 2</div>
              <h3 className="step-card-title">Select Stars & Quick Notes</h3>
              <p className="step-card-text">
                Customers choose their star rating and write 2 quick bullet points in any language or slang. No complex typing needed.
              </p>
            </div>

            <div className="step-card">
              <div className="step-badge-icon">🚀 3</div>
              <h3 className="step-card-title">1-Click Post to Google</h3>
              <p className="step-card-text">
                AI generates a fluent, authentic review. ReviewAssist auto-copies it to clipboard and opens Google Reviews for instant pasting.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. CORE FEATURE PILLARS */}
      <section className="features-section" aria-label="Key Features">
        <div className="section-container">
          <div className="section-header text-center">
            <span className="section-tag">Engineered for Growth</span>
            <h2 className="section-title">Everything Your Business Needs to Dominate Local Search</h2>
            <p className="section-desc">
              Rank higher on Google Maps with consistent, detailed 5-star customer reviews.
            </p>
          </div>

          <div className="features-showcase-grid">
            <div className="feature-box">
              <div className="feature-icon-wrapper icon-violet">
                <span>🤖</span>
              </div>
              <h3 className="feature-box-title">Multilingual AI Ghostwriter</h3>
              <p className="feature-box-desc">
                Translates customer notes from Hindi, Spanish, French, or informal speech into eloquent, authentic English reviews.
              </p>
            </div>

            <div className="feature-box">
              <div className="feature-icon-wrapper icon-emerald">
                <span>🎯</span>
              </div>
              <h3 className="feature-box-title">Dynamic Star Sentiment</h3>
              <p className="feature-box-desc">
                Review wording adjusts precisely to match selected stars (from 5-star enthusiasm to constructive feedback).
              </p>
            </div>

            <div className="feature-box">
              <div className="feature-icon-wrapper icon-cyan">
                <span>📊</span>
              </div>
              <h3 className="feature-box-title">Live Analytics Dashboard</h3>
              <p className="feature-box-desc">
                Track review growth, average scores, service breakdown, and customer sentiment trends in real-time.
              </p>
            </div>

            <div className="feature-box">
              <div className="feature-icon-wrapper icon-amber">
                <span>🖨️</span>
              </div>
              <h3 className="feature-box-title">Printable QR Standees</h3>
              <p className="feature-box-desc">
                Instantly generate high-resolution QR standees and table tents ready for professional printing in seconds.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. INDUSTRY SOLUTIONS */}
      <section className="industries-section" aria-label="Industries">
        <div className="section-container">
          <div className="section-header text-center">
            <span className="section-tag">Tailored for Local Businesses</span>
            <h2 className="section-title">Proven Across High-Volume Industries</h2>
          </div>

          <div className="industry-pills-grid">
            <div className="industry-pill-card">
              <span className="industry-icon">🚗</span>
              <h4>Auto Care & Garages</h4>
              <p>Highlight quick turnaround, honest diagnostics, and certified technicians.</p>
            </div>

            <div className="industry-pill-card">
              <span className="industry-icon">💇‍♀️</span>
              <h4>Salons, Spas & Beauty</h4>
              <p>Capture compliments on stylists, hygiene, ambience, and relaxation.</p>
            </div>

            <div className="industry-pill-card">
              <span className="industry-icon">🍽️</span>
              <h4>Restaurants & Cafes</h4>
              <p>Get dish-specific reviews mentioning fresh ingredients and friendly staff.</p>
            </div>

            <div className="industry-pill-card">
              <span className="industry-icon">🦷</span>
              <h4>Dental & Medical Clinics</h4>
              <p>Reassure new patients with reviews emphasizing gentle care and cleanliness.</p>
            </div>

            <div className="industry-pill-card">
              <span className="industry-icon">🛠️</span>
              <h4>Home & Trade Services</h4>
              <p>Turn on-site repairs into reviews praising punctual, professional contractors.</p>
            </div>

            <div className="industry-pill-card">
              <span className="industry-icon">🏋️</span>
              <h4>Gyms & Fitness Studios</h4>
              <p>Highlight motivating trainers, modern equipment, and welcoming community.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. FAQ ACCORDION */}
      <section className="faq-section" aria-label="Frequently Asked Questions">
        <div className="section-container">
          <div className="section-header text-center">
            <span className="section-tag">Frequently Asked Questions</span>
            <h2 className="section-title">Common Questions About ReviewAssist</h2>
          </div>

          <div className="faq-accordion-list">
            {faqs.map((faq, idx) => (
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

      {/* 7. BOTTOM CTA SECTION */}
      <section className="bottom-cta-section" aria-label="Get Started">
        <div className="section-container">
          <div className="bottom-cta-card">
            <div className="cta-glow-bg"></div>
            <div className="cta-content text-center">
              <h2 className="cta-headline">Ready to Get 5x More 5-Star Reviews?</h2>
              <p className="cta-subtext">
                Set up your business profile in 2 minutes and generate your first QR code standee right now.
              </p>
              <div className="cta-buttons-group">
                <Link to="/signup" className="btn-primary btn-xl">
                  🚀 Register Your Business Free
                </Link>
                <Link to="/dashboard/demo-1" className="btn-outline-white btn-xl">
                  📊 Explore Demo Dashboard
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
