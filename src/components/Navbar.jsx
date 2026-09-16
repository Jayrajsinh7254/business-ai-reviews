import React, { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { api } from '../api/client';

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const baseUrl = api.getBaseUrl();
  const token = api.getToken();
  const storedUser = api.getCurrentUser();
  const userBizId = storedUser?.businessId || 'demo-1';

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <header className="navbar-header" role="banner">
      <div className="navbar-container">
        {/* Brand Logo */}
        <Link to="/" className="navbar-brand" onClick={closeMobileMenu}>
          <div className="brand-logo-badge">
            <span className="star-icon">★</span>
          </div>
          <div className="brand-text">
            <span className="brand-name">ReviewAssist</span>
            <span className="brand-tag">AI Powered</span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className={`navbar-nav ${mobileMenuOpen ? 'mobile-open' : ''}`} role="navigation">
          <NavLink
            to="/"
            end
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            onClick={closeMobileMenu}
          >
            Home
          </NavLink>
          <NavLink
            to="/review/demo-1"
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            onClick={closeMobileMenu}
          >
            <span className="nav-icon">📱</span> Review Demo
          </NavLink>
          {token ? (
            <NavLink
              to={`/dashboard/${userBizId}`}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              onClick={closeMobileMenu}
            >
              <span className="nav-icon">📊</span> Dashboard
            </NavLink>
          ) : (
            <>
              <NavLink
                to="/dashboard/demo-1"
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                onClick={closeMobileMenu}
              >
                Dashboard Demo
              </NavLink>
              <NavLink
                to="/login"
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                onClick={closeMobileMenu}
              >
                Log In
              </NavLink>
            </>
          )}

          <div className="mobile-nav-cta-row">
            <Link to="/signup" className="btn-primary btn-sm btn-nav-cta" onClick={closeMobileMenu}>
              ✨ Get Started Free
            </Link>
          </div>
        </nav>

        {/* Right CTA Actions */}
        <div className="navbar-right-group">
          <div className="navbar-env-badge" title={`API Backend: ${baseUrl || 'Local Simulation'}`}>
            <span className="env-dot"></span>
            <span className="env-label">AI Ready</span>
          </div>

          <Link to="/signup" className="btn-primary btn-sm btn-nav-cta desktop-only">
            ✨ Get Started Free
          </Link>

          {/* Mobile Hamburger Toggle */}
          <button
            type="button"
            className="mobile-hamburger-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
            aria-expanded={mobileMenuOpen}
          >
            <span className={`hamburger-bar ${mobileMenuOpen ? 'open' : ''}`}></span>
          </button>
        </div>
      </div>
    </header>
  );
}
