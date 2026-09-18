import React, { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ROLES, getRoleBadgeInfo } from '../lib/rbac';
import { api } from '../api/client';

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, role, logout } = useAuth();

  const token = api.getToken();
  const userBizId = user?.businessId || 'demo-1';
  const roleBadge = getRoleBadgeInfo(role);

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
            <span className="brand-tag">SaaS Platform</span>
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
            to="/pricing"
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            onClick={closeMobileMenu}
          >
            <span className="nav-icon">💎</span> Pricing
          </NavLink>

          <NavLink
            to="/review/demo-1"
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            onClick={closeMobileMenu}
          >
            <span className="nav-icon">📱</span> Review Demo
          </NavLink>

          <NavLink
            to={`/dashboard/${userBizId}`}
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            onClick={closeMobileMenu}
          >
            <span className="nav-icon">📊</span> Dashboard
          </NavLink>

          {/* Super Admin SaaS Portal Link */}
          {role === ROLES.SUPER_ADMIN && (
            <NavLink
              to="/admin"
              className={({ isActive }) => `nav-link nav-admin-link ${isActive ? 'active' : ''}`}
              onClick={closeMobileMenu}
            >
              <span className="nav-icon">⚡</span> Admin Portal
            </NavLink>
          )}

          {!user && (
            <NavLink
              to="/login"
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              onClick={closeMobileMenu}
            >
              Log In
            </NavLink>
          )}

          <div className="mobile-nav-cta-row">
            <Link to="/signup" className="btn-primary btn-sm btn-nav-cta" onClick={closeMobileMenu}>
              ✨ Start 14-Day Free Trial
            </Link>
          </div>
        </nav>

        {/* Right CTA Actions */}
        <div className="navbar-right-group">
          {/* Active Role Indicator Pill */}
          <div className={`nav-role-badge ${roleBadge.className}`} title={`Logged in as ${roleBadge.label}`}>
            <span className="role-icon">{roleBadge.icon}</span>
            <span className="role-label">{roleBadge.label}</span>
          </div>

          <Link to="/signup" className="btn-primary btn-sm btn-nav-cta desktop-only">
            ✨ Start 14-Day Free Trial
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
