import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="app-footer" role="contentinfo">
      <div className="footer-container">
        {/* Brand & Mission Column */}
        <div className="footer-brand-col">
          <Link to="/" className="footer-brand-link">
            <div className="brand-logo-badge">
              <span className="star-icon">★</span>
            </div>
            <div className="brand-text">
              <span className="brand-name">ReviewAssist</span>
              <span className="brand-tag">AI-Powered</span>
            </div>
          </Link>
          <p className="footer-mission">
            The intelligent customer review copilot for local businesses. Generate authentic, high-converting 5-star Google reviews in 30 seconds via QR code.
          </p>
          <div className="footer-trust-badges">
            <span className="trust-pill">⚡ Powered by Gemini AI</span>
            <span className="trust-pill">🔒 100% Google Compliant</span>
          </div>
        </div>

        {/* Product & Solutions Navigation */}
        <div className="footer-links-group">
          <div className="footer-col">
            <h4 className="footer-col-title">Product</h4>
            <ul className="footer-links-list">
              <li><Link to="/signup">Register Business</Link></li>
              <li><Link to="/review/demo-1">Live Review Demo</Link></li>
              <li><Link to="/dashboard/demo-1">Analytics Dashboard</Link></li>
              <li><Link to="/login">Account Login</Link></li>
            </ul>
          </div>

          <div className="footer-col">
            <h4 className="footer-col-title">Industries</h4>
            <ul className="footer-links-list">
              <li><Link to="/signup?cat=automobile">Auto Care & Garages</Link></li>
              <li><Link to="/signup?cat=salon">Salons & Spas</Link></li>
              <li><Link to="/signup?cat=restaurant">Restaurants & Cafes</Link></li>
              <li><Link to="/signup?cat=healthcare">Clinics & Healthcare</Link></li>
              <li><Link to="/signup?cat=homeservices">Home & Trade Services</Link></li>
            </ul>
          </div>

          <div className="footer-col">
            <h4 className="footer-col-title">Features</h4>
            <ul className="footer-links-list">
              <li><span className="footer-static-link">Custom QR Standees</span></li>
              <li><span className="footer-static-link">Multilingual AI Polish</span></li>
              <li><span className="footer-static-link">Dynamic Star Sentiments</span></li>
              <li><span className="footer-static-link">Instant Clipboard Paste</span></li>
            </ul>
          </div>
        </div>
      </div>

      {/* Footer Bottom Bar */}
      <div className="footer-bottom-bar">
        <div className="footer-bottom-container">
          <p className="footer-copyright">
            © {currentYear} ReviewAssist Technologies Inc. All rights reserved.
          </p>
          <div className="footer-legal-links">
            <span className="legal-link">Privacy Policy</span>
            <span className="legal-dot">•</span>
            <span className="legal-link">Terms of Service</span>
            <span className="legal-dot">•</span>
            <span className="legal-link">Google Guidelines</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
