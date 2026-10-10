import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api, isGenericOrEmptyServices } from '../api/client';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { getCategoryServices } from '../lib/categories';

const STATUS_CONFIG = {
  new: { label: 'New', cls: 'status-new', icon: '🔵' },
  in_progress: { label: 'In Progress', cls: 'status-progress', icon: '🟡' },
  done: { label: 'QR Sent ✓', cls: 'status-done', icon: '🟢' },
};

// No dummy leads on launch — inbox is populated exclusively by real incoming requests
const FILTERS = ['all', 'new', 'in_progress', 'done'];

function timeAgo(iso) {
  if (!iso) return 'Just now';
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60000) return 'Just now';
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function AdminInbox() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [note, setNote] = useState('');
  const [toastMsg, setToastMsg] = useState('');

  const loadLeads = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      // Clean up any legacy demo IDs from localStorage
      try {
        const raw = localStorage.getItem('reviewassist_admin_leads');
        if (raw) {
          const parsed = JSON.parse(raw);
          const cleaned = parsed.filter((l) => !['req-001', 'req-002', 'req-003'].includes(l.id));
          if (cleaned.length !== parsed.length) {
            localStorage.setItem('reviewassist_admin_leads', JSON.stringify(cleaned));
          }
        }
      } catch {}

      const liveLeads = await api.getLeads();
      const map = new Map();

      // Add real live leads, ignoring demo IDs
      if (Array.isArray(liveLeads) && liveLeads.length > 0) {
        liveLeads
          .filter((l) => !['req-001', 'req-002', 'req-003'].includes(l.id))
          .forEach((l) => map.set(l.id, l));
      }

      const combined = Array.from(map.values());
      // Always sort newest first
      combined.sort((a, b) => {
        const da = new Date(a.submittedAt || a.createdAt || 0).getTime();
        const db = new Date(b.submittedAt || b.createdAt || 0).getTime();
        return db - da;
      });

      setRequests(combined);

      // Keep selection in sync
      if (selected) {
        const updatedSelected = combined.find((r) => r.id === selected.id);
        setSelected(updatedSelected || (combined.length > 0 ? combined[0] : null));
      } else if (combined.length > 0) {
        setSelected(combined[0]);
      } else {
        setSelected(null);
      }
    } catch (err) {
      console.warn('Could not fetch live leads:', err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    loadLeads();

    // 1. Storage event across tabs
    const handleStorage = () => loadLeads(true);
    window.addEventListener('storage', handleStorage);

    // 2. Custom same-tab event when lead is submitted
    const handleCustomLead = (e) => {
      loadLeads(true);
      if (e?.detail?.businessName) {
        showToast(`🔔 New QR Request: "${e.detail.businessName}"`);
      }
    };
    window.addEventListener('reviewassist:lead_submitted', handleCustomLead);

    // 3. Broadcast channel for multi-tab realtime
    let bc = null;
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        bc = new BroadcastChannel('reviewassist_leads_channel');
        bc.onmessage = (msg) => {
          loadLeads(true);
          if (msg.data?.type === 'NEW_LEAD' && msg.data.lead?.businessName) {
            showToast(`🔔 New QR Inquiry: "${msg.data.lead.businessName}"`);
          }
        };
      } catch {}
    }

    // 4. Supabase Realtime listener on 'leads' table
    let supaChannel = null;
    if (isSupabaseConfigured() && supabase) {
      try {
        supaChannel = supabase
          .channel('realtime-admin-leads')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, () => {
            loadLeads(true);
          })
          .subscribe();
      } catch (err) {
        console.warn('Supabase realtime listener notice:', err);
      }
    }

    // 5. Polling fallback every 15s
    const pollInterval = setInterval(() => {
      loadLeads(true);
    }, 15000);

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('reviewassist:lead_submitted', handleCustomLead);
      if (bc) bc.close();
      if (supaChannel && supabase) supabase.removeChannel(supaChannel);
      clearInterval(pollInterval);
    };
  }, []);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3500);
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

  const handleDeleteLead = async (id) => {
    const target = requests.find((r) => r.id === id);
    const confirmDel = window.confirm(`Are you sure you want to delete inquiry for "${target?.businessName || id}"?`);
    if (!confirmDel) return;

    try {
      await api.deleteLead(id);
      setRequests((prev) => prev.filter((r) => r.id !== id));
      if (selected?.id === id) {
        setSelected(requests.find((r) => r.id !== id) || null);
      }
      showToast('✓ Inquiry deleted successfully.');
    } catch (err) {
      console.error('Failed to delete lead:', err);
      showToast('⚠️ Could not delete inquiry.');
    }
  };

  // 1-Click Fast-Track Provisioning directly from Inbox
  const handleFastTrackOnboard = async (req) => {
    if (!req) return;
    const confirmFast = window.confirm(
      `Fast-track provision business account for "${req.businessName}" (${req.email})?\n\nThis will create an active client account and generate login credentials.`
    );
    if (!confirmFast) return;

    try {
      const cleanBizId =
        req.businessName
          .toLowerCase()
          .replace(/[^a-z0-9]/g, '-')
          .replace(/-+/g, '-')
          .substring(0, 18) +
        '-' +
        Math.random().toString(36).substring(2, 6);

      const reqServices = (Array.isArray(req.services) && req.services.length > 0 && !isGenericOrEmptyServices(req.services))
        ? req.services
        : getCategoryServices(req.businessType);

      api.saveClientAccount({
        businessId: cleanBizId,
        businessName: req.businessName,
        email: req.email,
        password: 'welcome123',
        ownerName: req.ownerName,
        category: req.businessType,
        planId: 'pro',
        phone: req.phone,
        services: reqServices,
      });

      await updateStatus(req.id, 'done');
      showToast(`🎉 ${req.businessName} account created! Default password: welcome123`);
    } catch (err) {
      console.error('Fast-track error:', err);
      showToast('⚠️ Could not provision account.');
    }
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
          <h1 className="admin-page-title">Contact &amp; QR Inquiries Inbox</h1>
          <p className="admin-page-subtitle">
            Manage incoming QR standee setup requests from businesses in real-time.
          </p>
        </div>
        <div className="admin-header-actions" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {counts.new > 0 && (
            <span
              style={{
                background: '#fee2e2',
                color: '#dc2626',
                border: '1px solid #fca5a5',
                padding: '4px 12px',
                borderRadius: '999px',
                fontSize: '0.82rem',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <span style={{ width: '8px', height: '8px', background: '#dc2626', borderRadius: '50%', display: 'inline-block' }}></span>
              {counts.new} New Request{counts.new > 1 ? 's' : ''}
            </span>
          )}
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
            {requests.length === 0 ? (
              <div className="admin-empty-state" style={{ padding: '36px 16px', textAlign: 'center' }}>
                <span style={{ fontSize: '2rem' }}>📭</span>
                <p style={{ fontWeight: 700, margin: '8px 0 4px', color: '#334155' }}>No Inquiries Yet</p>
                <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: 0 }}>
                  Incoming registration &amp; QR setup requests will appear here in real-time.
                </p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="admin-empty-state">
                <span>🔍</span>
                <p>No requests found in this filter</p>
              </div>
            ) : null}
            {filtered.map((req) => (
              <div
                key={req.id}
                className={`admin-request-item ${selected?.id === req.id ? 'selected' : ''} ${req.status === 'new' ? 'is-new' : ''}`}
                onClick={() => setSelected(req)}
              >
                <div className="admin-req-item-avatar">{req.businessName?.[0] || '🏢'}</div>
                <div className="admin-req-item-info">
                  <div className="admin-req-item-biz" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>{req.businessName}</span>
                    {req.status === 'new' && (
                      <span style={{ background: '#2563eb', color: '#fff', fontSize: '0.65rem', fontWeight: 800, padding: '1px 5px', borderRadius: '4px' }}>
                        NEW
                      </span>
                    )}
                  </div>
                  <div className="admin-req-item-owner">{req.ownerName} · {req.businessType}</div>
                  <div className="admin-req-item-time">{timeAgo(req.submittedAt || req.createdAt)}</div>
                </div>
                <div className={`admin-status-dot ${STATUS_CONFIG[req.status]?.cls || 'status-new'}`} />
              </div>
            ))}
          </div>
        </div>

        {/* Right: Detail Panel */}
        <div className="admin-inbox-detail-panel">
          {!selected ? (
            <div className="admin-detail-empty">
              <span className="admin-detail-empty-icon">📋</span>
              <h3>{requests.length === 0 ? 'No Request Selected' : 'Select a request'}</h3>
              <p>
                {requests.length === 0
                  ? 'No incoming inquiries yet. Once a business submits a registration or contact request, you can contact them on WhatsApp, approve, and generate their QR Standee here.'
                  : 'Click on an inquiry from the list on the left to view full details and take action.'}
              </p>
            </div>
          ) : (
            <div className="admin-detail-content">
              {/* Detail Header */}
              <div className="admin-detail-header">
                <div className="admin-detail-avatar">{selected.businessName?.[0] || '🏢'}</div>
                <div className="admin-detail-title-group">
                  <h2 className="admin-detail-biz-name">{selected.businessName}</h2>
                  <p className="admin-detail-owner">
                    {selected.ownerName} · <strong style={{ color: '#4f46e5' }}>{selected.businessType}</strong>
                  </p>
                </div>
                <div className={`admin-status-pill ${STATUS_CONFIG[selected.status]?.cls || 'status-new'}`}>
                  {STATUS_CONFIG[selected.status]?.icon} {STATUS_CONFIG[selected.status]?.label}
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
                  <span className="admin-detail-info-label">📞 Phone Number</span>
                  <a href={`tel:${selected.phone}`} className="admin-detail-info-val link">
                    {selected.phone}
                  </a>
                </div>
                <div className="admin-detail-info-item">
                  <span className="admin-detail-info-label">📍 Store Locations</span>
                  <span className="admin-detail-info-val">{selected.locations || '1 location'}</span>
                </div>
                <div className="admin-detail-info-item">
                  <span className="admin-detail-info-label">🕐 Inquiry Received</span>
                  <span className="admin-detail-info-val">{timeAgo(selected.submittedAt || selected.createdAt)}</span>
                </div>

                {/* Services list if selected */}
                {Array.isArray(selected.services) && selected.services.length > 0 && (
                  <div className="admin-detail-info-item full-span">
                    <span className="admin-detail-info-label">🏷️ Requested Services ({selected.services.length})</span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
                      {selected.services.map((srv, idx) => (
                        <span
                          key={idx}
                          style={{
                            background: '#e0e7ff',
                            color: '#3730a3',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            padding: '3px 10px',
                            borderRadius: '999px',
                          }}
                        >
                          ✓ {srv}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {selected.googleProfileUrl && (
                  <div className="admin-detail-info-item full-span">
                    <span className="admin-detail-info-label">🗺️ Google Profile / Maps Link</span>
                    <a
                      href={selected.googleProfileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="admin-detail-info-val link"
                      style={{ wordBreak: 'break-all' }}
                    >
                      {selected.googleProfileUrl}
                    </a>
                  </div>
                )}

                {selected.message && (
                  <div className="admin-detail-info-item full-span">
                    <span className="admin-detail-info-label">💬 Inquiry Note / Requirements</span>
                    <p className="admin-detail-info-val admin-message-text">&quot;{selected.message}&quot;</p>
                  </div>
                )}
              </div>

              {/* Internal Notes */}
              <div className="admin-notes-section">
                <label className="admin-notes-label">📝 Internal Admin Notes</label>
                <textarea
                  className="admin-notes-textarea"
                  placeholder="Add private notes about this client setup..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={2}
                />
              </div>

              {/* Status and Action Buttons */}
              <div className="admin-detail-actions">
                <div className="admin-status-actions">
                  <span className="admin-action-label">Move Status:</span>
                  {['new', 'in_progress', 'done'].map((s) => (
                    <button
                      key={s}
                      className={`admin-status-action-btn ${selected.status === s ? 'active' : ''} status-btn-${s.replace('_', '-')}`}
                      onClick={() => updateStatus(selected.id, s)}
                    >
                      {STATUS_CONFIG[s].icon} {STATUS_CONFIG[s].label}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => handleDeleteLead(selected.id)}
                    style={{
                      background: 'transparent',
                      border: '1px solid #fca5a5',
                      color: '#dc2626',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontSize: '0.78rem',
                      cursor: 'pointer',
                      marginLeft: 'auto',
                    }}
                  >
                    🗑️ Delete
                  </button>
                </div>

                <div className="admin-primary-actions" style={{ flexWrap: 'wrap', gap: '8px' }}>
                  <a
                    href={`https://wa.me/${(selected.phone || '').replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                      `Hi ${selected.ownerName}! This is the ReviewAssist team regarding your QR review setup request for "${selected.businessName}". Your custom 5-star Google review system and counter standee design are ready for preview!`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="admin-btn-primary"
                    style={{ background: '#16a34a', color: '#fff', textDecoration: 'none' }}
                  >
                    💬 WhatsApp Client
                  </a>

                  <a
                    href={`mailto:${selected.email}?subject=Your ReviewAssist QR Standee is Ready!&body=Hi ${selected.ownerName},%0A%0AThank you for requesting ReviewAssist for ${selected.businessName}!%0A%0AWe have prepared your custom QR standee and review system.%0A%0ABest regards,%0AReviewAssist Team`}
                    className="admin-btn-secondary"
                    style={{ textDecoration: 'none' }}
                  >
                    📧 Email Client
                  </a>

                  <Link
                    to={`/admin/qr-builder?name=${encodeURIComponent(selected.businessName || '')}&owner=${encodeURIComponent(selected.ownerName || '')}&email=${encodeURIComponent(selected.email || '')}&phone=${encodeURIComponent(selected.phone || '')}&bizType=${encodeURIComponent(selected.businessType || '')}&services=${encodeURIComponent((Array.isArray(selected.services) && selected.services.length > 0 && !isGenericOrEmptyServices(selected.services)) ? selected.services.join(',') : getCategoryServices(selected.businessType || '').join(','))}&google=${encodeURIComponent(selected.googleProfileUrl || selected.google_profile_url || '')}&leadId=${encodeURIComponent(selected.id)}`}
                    className="admin-btn-secondary"
                    style={{ background: '#6366f1', color: '#fff', textDecoration: 'none', fontWeight: 700 }}
                  >
                    🔲 Build Standee &amp; QR
                  </Link>

                  <button
                    type="button"
                    className="admin-btn-secondary"
                    onClick={() => handleFastTrackOnboard(selected)}
                    style={{ background: '#f59e0b', color: '#fff', fontWeight: 700 }}
                  >
                    ⚡ Fast-Track Provision
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
