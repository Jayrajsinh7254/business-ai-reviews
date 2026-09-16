import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { api } from '../api/client';

export default function Navbar() {
  const baseUrl = api.getBaseUrl();

  return (
    <header className="navbar-header">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand">
          <div className="brand-logo-badge">
            <span className="star-icon">★</span>
          </div>
          <div className="brand-text">
            <span className="brand-name">ReviewAssist</span>
            <span className="brand-tag">AI-Powered</span>
          </div>
        </Link>

        <nav className="navbar-nav">
          <NavLink
            to="/signup"
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            Sign Up
          </NavLink>
          <NavLink
            to="/login"
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            Log In
          </NavLink>
          <NavLink
            to="/dashboard/demo-1"
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            Dashboard
          </NavLink>
          <NavLink
            to="/review/demo-1"
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            Review Demo
          </NavLink>
        </nav>

        <div className="navbar-env-badge" title={`API Base URL: ${baseUrl}`}>
          <span className="env-dot"></span>
          <span className="env-label">{baseUrl ? baseUrl.replace(/^https?:\/\//, '') : 'Local Mock'}</span>
        </div>
      </div>
    </header>
  );
}
