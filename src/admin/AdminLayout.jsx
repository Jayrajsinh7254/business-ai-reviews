import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NAV_ITEMS = [
  { to: '/admin', icon: '📊', label: 'Overview', end: true },
  { to: '/admin/inbox', icon: '📥', label: 'Contact Inbox' },
  { to: '/admin/qr-builder', icon: '🔲', label: 'QR Builder' },
  { to: '/admin/clients', icon: '🏢', label: 'Clients' },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login');
  };

  return (
    <div className="admin-shell">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div className="admin-sidebar-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`admin-sidebar ${sidebarOpen ? 'open' : ''}`}>
        {/* Brand */}
        <div className="admin-sidebar-brand">
          <div className="admin-brand-logo">
            <span>★</span>
          </div>
          <div className="admin-brand-text-wrap">
            <div className="admin-brand-name">ReviewAssist</div>
            <div className="admin-brand-tag">Admin Panel</div>
          </div>
          <button
            type="button"
            className="admin-sidebar-close-btn"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close admin menu"
          >
            &times;
          </button>
        </div>

        {/* Nav */}
        <nav className="admin-sidebar-nav">
          <div className="admin-nav-section-label">Management</div>
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `admin-nav-link ${isActive ? 'active' : ''}`
              }
            >
              <span className="admin-nav-icon">{item.icon}</span>
              <span className="admin-nav-label">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* User Footer */}
        <div className="admin-sidebar-footer">
          <div className="admin-user-info">
            <div className="admin-user-avatar">{user?.name?.[0] || 'A'}</div>
            <div className="admin-user-details">
              <div className="admin-user-name">{user?.name || 'Admin'}</div>
              <div className="admin-user-email">{user?.email || ''}</div>
            </div>
          </div>
          <button className="admin-logout-btn" onClick={handleLogout} title="Sign out">
            ⏻
          </button>
        </div>
      </aside>

      {/* Main Area */}
      <div className="admin-main">
        {/* Top Bar */}
        <header className="admin-topbar">
          <button
            className="admin-hamburger"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Toggle sidebar"
          >
            ☰
          </button>
          <div className="admin-topbar-right">
            <div className="admin-topbar-badge">⚡ Super Admin</div>
          </div>
        </header>

        {/* Page Content */}
        <div className="admin-page-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
