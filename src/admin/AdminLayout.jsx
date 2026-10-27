import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const NAV_ITEMS = [
  { to: '/admin', icon: '📊', label: 'Overview', end: true },
  { to: '/admin/inbox', icon: '📥', label: 'Contact Inbox', hasBadge: true },
  { to: '/admin/payments', icon: '💸', label: 'UPI Payments' },
  { to: '/admin/qr-builder', icon: '🔲', label: 'QR Builder' },
  { to: '/admin/clients', icon: '🏢', label: 'Clients' },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [newLeadsCount, setNewLeadsCount] = useState(0);

  const loadUnreadCount = async () => {
    try {
      const leads = await api.getLeads();
      if (Array.isArray(leads)) {
        const unread = leads.filter((l) => l.status === 'new').length;
        setNewLeadsCount(unread);
      }
    } catch {}
  };

  useEffect(() => {
    loadUnreadCount();

    const handleSync = () => loadUnreadCount();
    window.addEventListener('storage', handleSync);
    window.addEventListener('reviewassist:lead_submitted', handleSync);
    window.addEventListener('reviewassist:status_changed', handleSync);

    let bc = null;
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        bc = new BroadcastChannel('reviewassist_leads_channel');
        bc.onmessage = () => loadUnreadCount();
      } catch {}
    }

    let supaChan = null;
    if (isSupabaseConfigured() && supabase) {
      try {
        supaChan = supabase
          .channel('realtime-layout-leads')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, () => {
            loadUnreadCount();
          })
          .subscribe();
      } catch {}
    }

    return () => {
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('reviewassist:lead_submitted', handleSync);
      window.removeEventListener('reviewassist:status_changed', handleSync);
      if (bc) bc.close();
      if (supaChan && supabase) supabase.removeChannel(supaChan);
    };
  }, []);

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
              <span className="admin-nav-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                <span>{item.label}</span>
                {item.hasBadge && newLeadsCount > 0 && (
                  <span
                    style={{
                      background: '#ef4444',
                      color: '#ffffff',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      padding: '2px 7px',
                      borderRadius: '999px',
                      marginLeft: '6px',
                    }}
                  >
                    {newLeadsCount} new
                  </span>
                )}
              </span>
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
          <div className="admin-topbar-right" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {newLeadsCount > 0 && (
              <Link
                to="/admin/inbox"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: '#fee2e2',
                  border: '1px solid #fecaca',
                  color: '#b91c1c',
                  padding: '6px 12px',
                  borderRadius: '20px',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  textDecoration: 'none',
                  animation: 'pulse 2s infinite',
                }}
              >
                <span>🔔</span>
                <span>{newLeadsCount} New QR Request{newLeadsCount !== 1 ? 's' : ''}</span>
              </Link>
            )}
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
