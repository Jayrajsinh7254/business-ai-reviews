import React, { useState } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ROLES, getRoleBadgeInfo } from '../lib/rbac';

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();

  const isClient = user && (role === ROLES.BUSINESS_OWNER || role === ROLES.BUSINESS_STAFF);
  const isSuperAdmin = user && role === ROLES.SUPER_ADMIN;
  const roleBadge = getRoleBadgeInfo(role);

  const closeMobileMenu = () => setMobileMenuOpen(false);

  const handleLogout = async () => {
    closeMobileMenu();
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <header className="navbar-header" role="banner">
      <div className="navbar-container">
        {/* Brand Logo - clients go to dashboard, visitors go home */}
        <Link
          to={isClient ? '/dashboard' : isSuperAdmin ? '/admin' : '/'}
          className="navbar-brand"
          onClick={closeMobileMenu}
        >
          <div className="brand-logo-badge">
            <span className="star-icon">★</span>
          </div>
          <div className="brand-text">
            <span className="brand-name">ReviewAssist</span>
            <span className="brand-tag">{isClient ? 'Client Portal' : 'SaaS Platform'}</span>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className={`navbar-nav ${mobileMenuOpen ? 'mobile-open' : ''}`} role="navigation">
          {/* CLIENT VIEW (Owner or Staff): ONLY see Dashboard. Marketing links are hidden */}
          {isClient ? (
            <>
              <NavLink
                to="/dashboard"
                end
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                onClick={closeMobileMenu}
              >
                <span className="nav-icon">📊</span> Dashboard
              </NavLink>

              <button
                type="button"
                className="nav-link nav-logout-btn mobile-only"
                onClick={handleLogout}
              >
                🚪 Sign Out
              </button>
            </>
          ) : isSuperAdmin ? (
            /* SUPER ADMIN VIEW */
            <>
              <NavLink
                to="/admin"
                className={({ isActive }) => `nav-link nav-admin-link ${isActive ? 'active' : ''}`}
                onClick={closeMobileMenu}
              >
                <span className="nav-icon">⚡</span> Admin Portal
              </NavLink>

              <NavLink
                to="/dashboard"
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                onClick={closeMobileMenu}
              >
                <span className="nav-icon">📊</span> Client Dashboard View
              </NavLink>

              <button
                type="button"
                className="nav-link nav-logout-btn mobile-only"
                onClick={handleLogout}
              >
                🚪 Sign Out
              </button>
            </>
          ) : (
            /* VISITOR / MARKETING VIEW */
            <>
              <NavLink
                to="/"
                end
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                onClick={closeMobileMenu}
              >
                Home
              </NavLink>

              <NavLink
                to="/contact"
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                onClick={closeMobileMenu}
              >
                <span className="nav-icon">📲</span> Get QR Code
              </NavLink>

              <NavLink
                to="/review/demo-1"
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                onClick={closeMobileMenu}
              >
                <span className="nav-icon">📱</span> Review Demo
              </NavLink>

              <NavLink
                to="/login"
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                onClick={closeMobileMenu}
              >
                🔐 Log In
              </NavLink>

              <div className="mobile-nav-cta-row">
                <Link to="/contact" className="btn-primary btn-sm btn-nav-cta" onClick={closeMobileMenu}>
                  ✨ Get Your QR Code
                </Link>
              </div>
            </>
          )}
        </nav>

        {/* Right Actions */}
        <div className="navbar-right-group">
          {isClient ? (
            <div className="client-nav-profile-group">
              <span className="client-nav-biz-name" title={user.email}>
                🏢 {user.name || 'Business'}
              </span>
              <div className={`nav-role-badge ${roleBadge.className}`} title={`Role: ${roleBadge.label}`}>
                <span className="role-icon">{roleBadge.icon}</span>
                <span className="role-label">{roleBadge.label}</span>
              </div>
              <button
                type="button"
                className="btn-secondary btn-sm nav-desktop-logout desktop-only"
                onClick={handleLogout}
                title="Sign out of your business account"
              >
                🚪 Sign Out
              </button>
            </div>
          ) : isSuperAdmin ? (
            <div className="client-nav-profile-group">
              <div className={`nav-role-badge ${roleBadge.className}`}>
                <span className="role-icon">⚡</span>
                <span className="role-label">Super Admin</span>
              </div>
              <button
                type="button"
                className="btn-secondary btn-sm nav-desktop-logout desktop-only"
                onClick={handleLogout}
              >
                🚪 Sign Out
              </button>
            </div>
          ) : (
            <Link to="/contact" className="btn-primary btn-sm btn-nav-cta desktop-only">
              ✨ Get Your QR Code
            </Link>
          )}

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
