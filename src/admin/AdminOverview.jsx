import React from 'react';
import { Link } from 'react-router-dom';

// Mock stat data — replace with real API calls
const STATS = [
  {
    icon: '📥',
    label: 'New Contact Requests',
    value: '12',
    sub: '4 pending review',
    color: 'amber',
  },
  {
    icon: '🔲',
    label: 'QR Codes Sent',
    value: '87',
    sub: 'This month',
    color: 'violet',
  },
  {
    icon: '🏢',
    label: 'Active Clients',
    value: '43',
    sub: '+3 this week',
    color: 'emerald',
  },
  {
    icon: '⭐',
    label: 'Reviews Generated',
    value: '2,841',
    sub: 'Across all clients',
    color: 'cyan',
  },
  {
    icon: '🛡️',
    label: 'Negative Reviews Shielded',
    value: '142',
    sub: 'Intercepted from Google',
    color: 'rose',
  },
];

const RECENT_REQUESTS = [
  { name: 'Rajesh Auto Garage', type: 'Auto Repair', email: 'rajesh@autogarage.in', time: '10 min ago', status: 'new' },
  { name: 'Priya Beauty Salon', type: 'Salon & Spa', email: 'priya@beautysalon.com', time: '2 hrs ago', status: 'new' },
  { name: 'Mumbai Bites Cafe', type: 'Restaurant', email: 'hello@mumbaibites.com', time: '5 hrs ago', status: 'in_progress' },
  { name: 'SmileCare Dental', type: 'Dental Clinic', email: 'contact@smilecare.in', time: '1 day ago', status: 'done' },
  { name: 'FitZone Gym', type: 'Gym & Fitness', email: 'info@fitzone.in', time: '1 day ago', status: 'done' },
];

const STATUS_CONFIG = {
  new: { label: 'New', cls: 'status-new' },
  in_progress: { label: 'In Progress', cls: 'status-progress' },
  done: { label: 'QR Sent ✓', cls: 'status-done' },
};

export default function AdminOverview() {
  return (
    <div className="admin-overview-page">
      {/* Header */}
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Admin Overview</h1>
          <p className="admin-page-subtitle">
            Welcome back! Here's what's happening across your ReviewAssist platform today.
          </p>
        </div>
        <div className="admin-header-actions">
          <Link to="/admin/inbox" className="admin-btn-primary">
            📥 View Inbox
          </Link>
          <Link to="/admin/qr-builder" className="admin-btn-secondary">
            🔲 Create QR
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="admin-stats-grid">
        {STATS.map((stat) => (
          <div key={stat.label} className={`admin-stat-card admin-stat-${stat.color}`}>
            <div className="admin-stat-icon">{stat.icon}</div>
            <div className="admin-stat-body">
              <div className="admin-stat-value">{stat.value}</div>
              <div className="admin-stat-label">{stat.label}</div>
              <div className="admin-stat-sub">{stat.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="admin-activity-card">
        <div className="admin-card-header">
          <h2 className="admin-card-title">Recent Contact Requests</h2>
          <Link to="/admin/inbox" className="admin-card-link">
            View all →
          </Link>
        </div>

        <div className="admin-requests-list">
          {RECENT_REQUESTS.map((req, i) => (
            <div key={i} className="admin-request-row">
              <div className="admin-request-avatar">
                {req.name[0]}
              </div>
              <div className="admin-request-info">
                <div className="admin-request-name">{req.name}</div>
                <div className="admin-request-meta">
                  {req.type} · {req.email}
                </div>
              </div>
              <div className="admin-request-time">{req.time}</div>
              <div className={`admin-status-pill ${STATUS_CONFIG[req.status].cls}`}>
                {STATUS_CONFIG[req.status].label}
              </div>
              <Link
                to="/admin/inbox"
                className="admin-btn-xs"
              >
                View →
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="admin-quick-actions-grid">
        <Link to="/admin/qr-builder" className="admin-quick-card">
          <span className="admin-quick-icon">🔲</span>
          <strong>Build & Send QR</strong>
          <p>Generate a custom QR code for a client and email it to them.</p>
        </Link>
        <Link to="/admin/inbox" className="admin-quick-card">
          <span className="admin-quick-icon">📥</span>
          <strong>Review Inbox</strong>
          <p>Process new contact requests and move them through your pipeline.</p>
        </Link>
        <Link to="/admin/clients" className="admin-quick-card">
          <span className="admin-quick-icon">🏢</span>
          <strong>Manage Clients</strong>
          <p>View all active clients, their QR codes and review stats.</p>
        </Link>
        <a href="/review/demo-1" target="_blank" rel="noreferrer" className="admin-quick-card">
          <span className="admin-quick-icon">📱</span>
          <strong>Test Review Flow</strong>
          <p>Open the public-facing customer review experience in a new tab.</p>
        </a>
      </div>
    </div>
  );
}
