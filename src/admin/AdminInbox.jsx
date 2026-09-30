import React, { useState, useEffect } from 'react';
import { api } from '../api/client';

const STATUS_CONFIG = {
  new: { label: 'New', cls: 'status-new', icon: '🔵' },
  in_progress: { label: 'In Progress', cls: 'status-progress', icon: '🟡' },
  done: { label: 'QR Sent ✓', cls: 'status-done', icon: '🟢' },
};

// Simulated inbox data — in production, fetch from Supabase table
const INITIAL_REQUESTS = [
  {
    id: 'req-001',
    ownerName: 'Rajesh Sharma',
    businessName: 'Rajesh Auto Garage',
    businessType: 'Auto Repair & Car Service',
    locations: '1 location',
    email: 'rajesh@autogarage.in',
    phone: '+91 98765 11111',
    googleProfileUrl: 'https://maps.google.com/?q=Rajesh+Auto+Garage',
    message: 'Looking for QR code for my garage reception.',
    submittedAt: '2026-09-28T08:30:00Z',
    status: 'new',
  },
  {
    id: 'req-002',
    ownerName: 'Priya Mehta',
    businessName: 'Priya Beauty Salon',
    businessType: 'Hair Salon & Barber',
    locations: '2–3 locations',
    email: 'priya@beautysalon.com',
    phone: '+91 97878 22222',
    googleProfileUrl: '',
    message: 'I have 2 branches and want separate QR for each.',
    submittedAt: '2026-09-28T06:15:00Z',
    status: 'new',
  },
  {
    id: 'req-003',
    ownerName: 'Arjun Nair',
    businessName: 'Mumbai Bites Cafe',
    businessType: 'Restaurant & Cafe',
    locations: '1 location',
    email: 'hello@mumbaibites.com',
    phone: '+91 90909 33333',
    googleProfileUrl: 'https://maps.google.com/search?q=Mumbai+Bites',
    message: '',
    submittedAt: '2026-09-27T14:00:00Z',
    status: 'in_progress',
  },
  {
    id: 'req-004',
    ownerName: 'Dr. Sonal Patel',
    businessName: 'SmileCare Dental',
    businessType: 'Dental Clinic',
    locations: '1 location',
    email: 'contact@smilecare.in',
    phone: '+91 99123 44444',
    googleProfileUrl: '',
    message: 'Please set up for my Ahmedabad clinic.',
    submittedAt: '2026-09-27T09:00:00Z',
    status: 'done',
  },
  {
    id: 'req-005',
    ownerName: 'Vikram Desai',
    businessName: 'FitZone Gym',
    businessType: 'Gym & Fitness Studio',
    locations: '4–10 locations',
    email: 'info@fitzone.in',
    phone: '+91 88812 55555',
    googleProfileUrl: 'https://maps.google.com/search?q=FitZone+Gym',
    message: 'We have 5 branches across Surat. Need QR for each.',
    submittedAt: '2026-09-26T11:30:00Z',
    status: 'done',
  },
];

const FILTERS = ['all', 'new', 'in_progress', 'done'];

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function AdminInbox() {
  const [requests, setRequests] = useState(INITIAL_REQUESTS);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [note, setNote] = useState('');
  const [toastMsg, setToastMsg] = useState('');

  const loadLeads = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const liveLeads = await api.getLeads();
      if (Array.isArray(liveLeads) && liveLeads.length > 0) {
        // Merge without losing initial demo leads
        const map = new Map();
        liveLeads.forEach((l) => map.set(l.id, l));
        INITIAL_REQUESTS.forEach((r) => {
          if (!map.has(r.id)) map.set(r.id, r);
        });
        const combined = Array.from(map.values());
        setRequests(combined);
        // If an item is currently selected, update its reference
        if (selected) {
          const updatedSelected = combined.find((r) => r.id === selected.id);
          if (updatedSelected) setSelected(updatedSelected);
        }
      }
    } catch (err) {
      console.warn('Could not fetch live leads:', err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    loadLeads();
  }, []);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3000);
  };

  const updateStatus = async (id, status) => {
    setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
    if (selected?.id === id) setSelected((s) => ({ ...s, status }));
    try {
      await api.updateLeadStatus(id, status);
    } catch (err) {
      console.warn('Failed to update status in backend:', err);
    }
    showToast(`✓ Status updated to "${STATUS_CONFIG[status].label}"`);
  };

  const filtered = requests.filter((r) => {
    const matchFilter = filter === 'all' || r.status === filter;
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      r.businessName.toLowerCase().includes(q) ||
      r.ownerName.toLowerCase().includes(q) ||
      r.email.toLowerCase().includes(q);
    return matchFilter && matchSearch;
  });

  const counts = {
    all: requests.length,
    new: requests.filter((r) => r.status === 'new').length,
    in_progress: requests.filter((r) => r.status === 'in_progress').length,
    done: requests.filter((r) => r.status === 'done').length,
  };

  return (
    <div className="admin-inbox-page">
      {toastMsg && <div className="admin-toast">{toastMsg}</div>}

      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Contact Inbox</h1>
          <p className="admin-page-subtitle">
            Manage incoming QR code requests from businesses.
          </p>
        </div>
        <div className="admin-header-actions">
          <button
            type="button"
            className="admin-btn-secondary"
            onClick={() => loadLeads(false)}
            disabled={loading}
          >
            <span>{loading ? '⏳' : '🔄'}</span> {loading ? 'Fetching...' : 'Refresh Inbox'}
          </button>
        </div>
      </div>

      <div className="admin-inbox-layout">
        {/* Left: Request List */}
        <div className="admin-inbox-list-panel">
          {/* Search */}
          <div className="admin-inbox-search">
            <input
              type="text"
              placeholder="🔍 Search business or email..."
              className="admin-search-input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Filter Tabs */}
          <div className="admin-filter-tabs">
            {FILTERS.map((f) => (
              <button
                key={f}
                className={`admin-filter-tab ${filter === f ? 'active' : ''}`}
                onClick={() => setFilter(f)}
              >
                {f === 'all' ? 'All' : STATUS_CONFIG[f].label}
                <span className="admin-filter-count">{counts[f]}</span>
              </button>
            ))}
          </div>

          {/* Request Items */}
          <div className="admin-request-items">
            {filtered.length === 0 && (
              <div className="admin-empty-state">
                <span>📭</span>
                <p>No requests found</p>
              </div>
            )}
            {filtered.map((req) => (
              <div
                key={req.id}
                className={`admin-request-item ${selected?.id === req.id ? 'selected' : ''} ${req.status === 'new' ? 'is-new' : ''}`}
                onClick={() => setSelected(req)}
              >
                <div className="admin-req-item-avatar">{req.businessName[0]}</div>
                <div className="admin-req-item-info">
                  <div className="admin-req-item-biz">{req.businessName}</div>
                  <div className="admin-req-item-owner">{req.ownerName} · {req.businessType}</div>
                  <div className="admin-req-item-time">{timeAgo(req.submittedAt)}</div>
                </div>
                <div className={`admin-status-dot ${STATUS_CONFIG[req.status].cls}`} />
              </div>
            ))}
          </div>
        </div>

        {/* Right: Detail Panel */}
        <div className="admin-inbox-detail-panel">
          {!selected ? (
            <div className="admin-detail-empty">
              <span className="admin-detail-empty-icon">📋</span>
              <h3>Select a request</h3>
              <p>Click on a contact request from the list to view full details and take action.</p>
            </div>
          ) : (
            <div className="admin-detail-content">
              {/* Detail Header */}
              <div className="admin-detail-header">
                <div className="admin-detail-avatar">{selected.businessName[0]}</div>
                <div className="admin-detail-title-group">
                  <h2 className="admin-detail-biz-name">{selected.businessName}</h2>
                  <p className="admin-detail-owner">{selected.ownerName} · {selected.businessType}</p>
                </div>
                <div className={`admin-status-pill ${STATUS_CONFIG[selected.status].cls}`}>
                  {STATUS_CONFIG[selected.status].icon} {STATUS_CONFIG[selected.status].label}
                </div>
              </div>

              {/* Info Grid */}
              <div className="admin-detail-info-grid">
                <div className="admin-detail-info-item">
                  <span className="admin-detail-info-label">📧 Email</span>
                  <a href={`mailto:${selected.email}`} className="admin-detail-info-val link">
                    {selected.email}
                  </a>
                </div>
                <div className="admin-detail-info-item">
                  <span className="admin-detail-info-label">📞 Phone</span>
                  <a href={`tel:${selected.phone}`} className="admin-detail-info-val link">
                    {selected.phone}
                  </a>
                </div>
                <div className="admin-detail-info-item">
                  <span className="admin-detail-info-label">📍 Locations</span>
                  <span className="admin-detail-info-val">{selected.locations}</span>
                </div>
                <div className="admin-detail-info-item">
                  <span className="admin-detail-info-label">🕐 Submitted</span>
                  <span className="admin-detail-info-val">{timeAgo(selected.submittedAt)}</span>
                </div>
                {selected.googleProfileUrl && (
                  <div className="admin-detail-info-item full-span">
                    <span className="admin-detail-info-label">🗺️ Google Profile</span>
                    <a
                      href={selected.googleProfileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="admin-detail-info-val link"
                    >
                      {selected.googleProfileUrl}
                    </a>
                  </div>
                )}
                {selected.message && (
                  <div className="admin-detail-info-item full-span">
                    <span className="admin-detail-info-label">💬 Message</span>
                    <p className="admin-detail-info-val admin-message-text">"{selected.message}"</p>
                  </div>
                )}
              </div>

              {/* Admin Notes */}
              <div className="admin-notes-section">
                <label className="admin-notes-label">📝 Internal Notes</label>
                <textarea
                  className="admin-notes-textarea"
                  placeholder="Add private notes about this client setup..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={3}
                />
              </div>

              {/* Actions */}
              <div className="admin-detail-actions">
                <div className="admin-status-actions">
                  <span className="admin-action-label">Move to:</span>
                  {['new', 'in_progress', 'done'].map((s) => (
                    <button
                      key={s}
                      className={`admin-status-action-btn ${selected.status === s ? 'active' : ''} status-btn-${s.replace('_', '-')}`}
                      onClick={() => updateStatus(selected.id, s)}
                    >
                      {STATUS_CONFIG[s].icon} {STATUS_CONFIG[s].label}
                    </button>
                  ))}
                </div>

                <div className="admin-primary-actions">
                  <a
                    href={`https://wa.me/${selected.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                      `Hi ${selected.ownerName}! This is the ReviewAssist onboarding team regarding your QR setup request for "${selected.businessName}". Your custom 5-star Google review standee is ready for preview!`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="admin-btn-primary"
                    style={{ background: '#16a34a' }}
                  >
                    💬 WhatsApp Client
                  </a>
                  <a
                    href={`mailto:${selected.email}?subject=Your ReviewAssist QR Code is Ready!&body=Hi ${selected.ownerName},%0A%0AThank you for your interest in ReviewAssist!%0A%0AYour custom QR code for ${selected.businessName} has been set up. Please find it attached.%0A%0AHere's how it works:%0A1. Place the QR standee on your reception counter%0A2. Customers scan and leave a review in 30 seconds%0A3. Track reviews on your dashboard%0A%0ABest regards,%0AReviewAssist Team`}
                    className="admin-btn-secondary"
                  >
                    📧 Email Client
                  </a>
                  <a
                    href={`/admin/qr-builder?email=${selected.email}&name=${encodeURIComponent(selected.businessName)}&bizId=${selected.id}`}
                    className="admin-btn-secondary"
                  >
                    🔲 Build QR Code
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
