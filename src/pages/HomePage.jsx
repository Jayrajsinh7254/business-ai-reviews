import React from 'react';
import { Link } from 'react-router-dom';

export default function HomePage() {
  return (
    <div className="page-container home-page">
      <div className="hero-section text-center">
        <div className="hero-badge">
          <span>✨ AI-Powered Review Generation</span>
        </div>
        <h1 className="hero-title">
          Turn Happy Customers into <span className="highlight-text">5-Star Google Reviews</span>
        </h1>
        <p className="hero-description">
          ReviewAssist helps businesses collect detailed, authentic Google reviews in 30 seconds.
          Customers scan a QR code, answer two quick questions, and let AI craft a ready-to-post review.
        </p>

        <div className="hero-cta-group">
          <Link to="/signup" className="btn-primary btn-lg">
            🚀 Register Your Business
          </Link>
          <Link to="/review/demo-1" className="btn-secondary btn-lg">
            📱 Try Customer Review Demo
          </Link>
          <Link to="/dashboard/demo-1" className="btn-outline btn-lg">
            📊 View Demo Dashboard
          </Link>
        </div>
      </div>

      {/* Feature Flow Showcase */}
      <div className="features-grid">
        <div className="feature-card">
          <div className="feature-number">1</div>
          <h3 className="feature-title">1. Business Setup</h3>
          <p className="feature-desc">
            Register your business name, pick a category, and list your services as tags to generate a customized QR code.
          </p>
          <Link to="/signup" className="feature-link">
            Go to Signup &rarr;
          </Link>
        </div>

        <div className="feature-card">
          <div className="feature-number">2</div>
          <h3 className="feature-title">2. Customer Experience</h3>
          <p className="feature-desc">
            Mobile-first 3-step review flow. Customers pick what they got done, state what stood out, and get an AI draft.
          </p>
          <Link to="/review/demo-1" className="feature-link">
            Try Mobile Review &rarr;
          </Link>
        </div>

        <div className="feature-card">
          <div className="feature-number">3</div>
          <h3 className="feature-title">3. Business Dashboard</h3>
          <p className="feature-desc">
            Track metrics: Total reviews, this month's growth, average star ratings, and conversion rates in real time.
          </p>
          <Link to="/dashboard/demo-1" className="feature-link">
            Open Dashboard &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}
