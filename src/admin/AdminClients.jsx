import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const INITIAL_CLIENTS = [
  {
    id: 'demo-1',
    businessName: 'Apex Auto Care & Diagnostics',
    ownerName: 'Marcus Vance',
    businessType: 'Auto Repair & Diagnostics',
    email: 'owner@apexauto.com',
    phone: '+91 98220 77777',
    locations: '1',
    reviewsGenerated: 48,
    status: 'active',
    planId: 'pro',
    qrSentAt: '2026-09-20',
    paidUntil: '2026-10-25',
  },
  {
    id: 'rajesh-auto-q3f2',
    businessName: 'Rajesh Auto Garage',
    ownerName: 'Rajesh Sharma',
    businessType: 'Auto Repair',
    email: 'rajesh@autogarage.in',
    phone: '+91 98765 11111',
    locations: '1',
    reviewsGenerated: 47,
    status: 'active',
    planId: 'starter',
    qrSentAt: '2026-09-25',
    paidUntil: '2026-10-25',
  },
  {
    id: 'mumbai-bites-k9x1',
    businessName: 'Mumbai Bites Cafe',
    ownerName: 'Arjun Nair',
    businessType: 'Restaurant',
    email: 'hello@mumbaibites.com',
    phone: '+91 90909 33333',
    locations: '1',
    reviewsGenerated: 23,
    status: 'active',
    planId: 'pro',
    qrSentAt: '2026-09-22',
    paidUntil: '2026-10-22',
  },
  {
    id: 'smilecare-dental-m2p4',
    businessName: 'SmileCare Dental',
    ownerName: 'Dr. Sonal Patel',
    businessType: 'Dental Clinic',
    email: 'contact@smilecare.in',
    phone: '+91 99123 44444',
    locations: '1',
    reviewsGenerated: 61,
    status: 'active',
    planId: 'pro',
    qrSentAt: '2026-09-18',
    paidUntil: '2026-10-18',
  },
  {
    id: 'fitzone-gym-v7r3',
    businessName: 'FitZone Gym',
    ownerName: 'Vikram Desai',
    businessType: 'Gym & Fitness',
    email: 'info@fitzone.in',
    phone: '+91 88812 55555',
    locations: '5',
    reviewsGenerated: 128,
    status: 'inactive',
    planId: 'enterprise',
    qrSentAt: '2026-09-10',
    paidUntil: '2026-09-10', // expired
  },
  {
    id: 'priya-salon-b6w2',
    businessName: 'Priya Beauty Salon',
    ownerName: 'Priya Mehta',
    businessType: 'Hair Salon',
    email: 'priya@beautysalon.com',
    phone: '+91 97878 22222',
    locations: '2',
    reviewsGenerated: 0,
    status: 'setup',
    planId: 'starter',
    qrSentAt: null,
    paidUntil: null,
  },
];

const INITIAL_LEADS = [
  {
    id: 'lead-dr-vivek-dental',
    ownerName: 'Dr. Vivek Sharma',
    businessName: 'Sharma Advanced Dental Clinic',
    businessType: 'Dental Clinic',
    locations: '2–3 locations',
    email: 'drvivek@sharmadental.com',
    phone: '+91 98210 99881',
    googleProfileUrl: 'https://maps.google.com',
    message: 'We want 3 acrylic counter standees for our reception desks. Ready for Pro Growth plan.',
    status: 'pending',
    createdAt: '2026-09-29T10:15:00.000Z',
  },
  {
    id: 'lead-curry-leaf-bistro',
    ownerName: 'Kavita Iyer',
    businessName: 'The Curry Leaf Bistro',
    businessType: 'Restaurant & Cafe',
    locations: '1 location',
    email: 'kavita@curryleafbistro.in',
    phone: '+91 97110 44552',
    googleProfileUrl: 'https://maps.google.com',
    message: 'Need QR table tents for our dining tables so customers can leave AI reviews easily.',
    status: 'pending',
    createdAt: '2026-09-28T16:30:00.000Z',
  },
];

const STATUS_FILTERS = ['all', 'active', 'inactive', 'inquiries', 'setup'];

const PLAN_OPTIONS = [
  { id: 'starter', name: 'Starter', price: '₹499/mo', tag: '1 loc • 1 seat • basic' },
  { id: 'pro', name: 'Pro Growth', price: '₹1,299/mo', tag: '3 loc • 5 seats • AI reply' },
  { id: 'enterprise', name: 'Enterprise', price: '₹2,999/mo', tag: 'unlimited • custom' },
];

function isPaidExpired(paidUntil) {
  if (!paidUntil) return false;
  return new Date(paidUntil) < new Date();
}

function daysUntil(dateStr) {
  if (!dateStr) return null;
  const diff = new Date(dateStr) - new Date();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export default function AdminClients() {
  const [clients, setClients] = useState(() => {
    try {
      const saved = localStorage.getItem('reviewassist_admin_clients');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return INITIAL_CLIENTS;
  });

  const [leads, setLeads] = useState(() => {
    try {
      const saved = localStorage.getItem('reviewassist_admin_leads');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return INITIAL_LEADS;
  });

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [confirmAction, setConfirmAction] = useState(null); // { client, action: 'deactivate'|'activate' }
  const [toastMsg, setToastMsg] = useState('');

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3500);
  };

  const persistClients = (updatedList) => {
    setClients(updatedList);
    try {
      localStorage.setItem('reviewassist_admin_clients', JSON.stringify(updatedList));
    } catch (err) {
      console.warn('Could not persist clients:', err);
    }
  };

  const persistLeads = (updatedLeads) => {
    setLeads(updatedLeads);
    try {
      localStorage.setItem('reviewassist_admin_leads', JSON.stringify(updatedLeads));
    } catch (err) {
      console.warn('Could not persist leads:', err);
    }
  };

  const handleToggleStatus = (client) => {
    if (client.status === 'active') {
      setConfirmAction({ client, action: 'deactivate' });
    } else if (client.status === 'inactive') {
      setConfirmAction({ client, action: 'activate' });
    }
  };

  const confirmToggle = () => {
    if (!confirmAction) return;
    const { client, action } = confirmAction;
    const newStatus = action === 'deactivate' ? 'inactive' : 'active';
    const updated = clients.map((c) => (c.id === client.id ? { ...c, status: newStatus } : c));
    persistClients(updated);

    // Also sync with stored businesses if cached
    try {
      const bizData = localStorage.getItem('review_assist_businesses');
      const storedBiz = bizData ? JSON.parse(bizData) : {};
      if (storedBiz[client.id]) {
        storedBiz[client.id].status = newStatus;
        storedBiz[client.id].subscriptionStatus = newStatus;
        localStorage.setItem('review_assist_businesses', JSON.stringify(storedBiz));
      }
    } catch {}

    showToast(
      action === 'deactivate'
        ? `⛔ ${client.businessName} service deactivated. Review portal & QR paused.`
        : `✅ ${client.businessName} service reactivated. Review portal & QR live.`
    );
    setConfirmAction(null);
  };

  const handlePlanChange = (clientId, newPlanId) => {
    const updated = clients.map((c) => (c.id === clientId ? { ...c, planId: newPlanId } : c));
    persistClients(updated);
    const planName = PLAN_OPTIONS.find((p) => p.id === newPlanId)?.name || newPlanId;
    showToast(`💎 Assigned ${planName} plan to client.`);
  };

  const handlePaidUntilChange = (clientId, newDate) => {
    const isNowExpired = isPaidExpired(newDate);
    const updated = clients.map((c) => {
      if (c.id === clientId) {
        return {
          ...c,
          paidUntil: newDate,
          status: isNowExpired ? 'inactive' : c.status === 'inactive' ? 'active' : c.status,
        };
      }
      return c;
    });
    persistClients(updated);
    showToast(`📅 Updated renewal date to ${newDate}.`);
  };

  const handleDismissLead = (leadId) => {
    const updated = leads.filter((l) => l.id !== leadId);
    persistLeads(updated);
    showToast('Inquiry removed from list.');
  };

  const filteredClients = clients.filter((c) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      c.businessName.toLowerCase().includes(q) ||
      c.ownerName.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q);
    const matchStatus = statusFilter === 'all' || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const filteredLeads = leads.filter((l) => {
    const q = search.toLowerCase();
    return (
      !q ||
      l.businessName?.toLowerCase().includes(q) ||
      l.ownerName?.toLowerCase().includes(q) ||
      l.email?.toLowerCase().includes(q) ||
      l.phone?.includes(q)
    );
  });

  const counts = {
    all: clients.length,
    active: clients.filter((c) => c.status === 'active').length,
    inactive: clients.filter((c) => c.status === 'inactive').length,
    inquiries: leads.filter((l) => l.status === 'pending').length,
    setup: clients.filter((c) => c.status === 'setup').length,
  };

  return (
    <div className="admin-clients-page">
      {toastMsg && <div className="admin-toast">{toastMsg}</div>}

      {/* Deactivate / Reactivate Confirmation Modal */}
      {confirmAction && (
        <div className="admin-confirm-overlay" onClick={() => setConfirmAction(null)}>
          <div className="admin-confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-confirm-icon">
              {confirmAction.action === 'deactivate' ? '⛔' : '✅'}
            </div>
            <h3 className="admin-confirm-title">
              {confirmAction.action === 'deactivate' ? 'Deactivate Service?' : 'Reactivate Service?'}
            </h3>
            <div className="admin-confirm-desc">
              {confirmAction.action === 'deactivate' ? (
                <>
                  This will <strong>disable the QR review portal</strong> for{' '}
                  <strong>{confirmAction.client.businessName}</strong>.
                  <br /><br />
                  Customer scans will show a friendly <em>"Service Currently Paused"</em> notice.
                  The client's dashboard will display an inactive warning with instructions to renew.
                </>
              ) : (
                <>
                  This will <strong>restore the QR review service</strong> for{' '}
                  <strong>{confirmAction.client.businessName}</strong>.
                  <br /><br />
                  Their QR standee link and dashboard will become fully operational immediately.
                </>
              )}
            </div>
            <div className="admin-confirm-actions">
              <button
                className={`admin-confirm-btn ${confirmAction.action === 'deactivate' ? 'danger' : 'success'}`}
                onClick={confirmToggle}
              >
                {confirmAction.action === 'deactivate' ? '⛔ Yes, Deactivate Service' : '✅ Yes, Reactivate Service'}
              </button>
              <button
                className="admin-confirm-btn cancel"
                onClick={() => setConfirmAction(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Clients & Subscriptions</h1>
          <p className="admin-page-subtitle">
            External billing & access management — review website inquiries, onboard new clients, and control QR active status.
          </p>
        </div>
        <Link to="/admin/qr-builder" className="admin-btn-primary">
          + Add New Client
        </Link>
      </div>

      {/* Toolbar */}
      <div className="admin-clients-toolbar">
        <input
          type="text"
          className="admin-search-input"
          placeholder="🔍 Search clients or inquiries..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="admin-filter-tabs">
          {STATUS_FILTERS.map((s) => (
            <button
              key={s}
              className={`admin-filter-tab ${statusFilter === s ? 'active' : ''}`}
              onClick={() => setStatusFilter(s)}
            >
              {s === 'all'
                ? 'All Clients'
                : s === 'active'
                ? '✅ Active'
                : s === 'inactive'
                ? '⛔ Inactive'
                : s === 'inquiries'
                ? '📬 Inquiries (Leads)'
                : '⏳ Setup'}
              <span className={`admin-filter-count ${s === 'inquiries' && counts.inquiries > 0 ? 'badge-pulse' : ''}`}>
                {counts[s]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* =========================================================================
          VIEW 1: INCOMING INQUIRIES / LEADS TAB
          ========================================================================= */}
      {statusFilter === 'inquiries' ? (
        <div className="admin-leads-section animate-fade-in">
          <div className="admin-section-banner">
            <div>
              <h3>📬 Website Requests for QR Standees</h3>
              <p>Visitors who filled out the "Get QR Code" contact form. Convert them to active clients with 1 click.</p>
            </div>
            <span className="leads-pending-tag">{counts.inquiries} Pending Request{counts.inquiries !== 1 ? 's' : ''}</span>
          </div>

          <div className="admin-leads-grid">
            {filteredLeads.map((lead) => {
              const waText = encodeURIComponent(
                `Hi ${lead.ownerName || 'there'}, thank you for requesting ReviewAssist QR standees for "${lead.businessName}". I have your review portal ready to activate!`
              );
              const cleanPhone = lead.phone ? lead.phone.replace(/[^0-9]/g, '') : '';

              return (
                <div key={lead.id} className="admin-lead-card">
                  <div className="lead-card-header">
                    <div className="lead-biz-avatar">{lead.businessName?.[0] || '🏢'}</div>
                    <div className="lead-header-meta">
                      <h4 className="lead-biz-name">{lead.businessName}</h4>
                      <span className="lead-biz-type">{lead.businessType || 'Local Business'}</span>
                    </div>
                    <span className="lead-status-pill">
                      {lead.status === 'converted' ? '✅ Onboarded' : '⚡ New Lead'}
                    </span>
                  </div>

                  <div className="lead-details-grid">
                    <div className="lead-detail-item">
                      <span className="lead-detail-label">👤 Owner Name:</span>
                      <span className="lead-detail-val">{lead.ownerName}</span>
                    </div>
                    <div className="lead-detail-item">
                      <span className="lead-detail-label">📞 Phone:</span>
                      <a href={`tel:${lead.phone}`} className="lead-phone-link">
                        {lead.phone}
                      </a>
                    </div>
                    <div className="lead-detail-item">
                      <span className="lead-detail-label">📧 Email:</span>
                      <a href={`mailto:${lead.email}`} className="lead-email-link">
                        {lead.email}
                      </a>
                    </div>
                    <div className="lead-detail-item">
                      <span className="lead-detail-label">📍 Locations:</span>
                      <span className="lead-detail-val">{lead.locations || '1 location'}</span>
                    </div>
                  </div>

                  {lead.message && (
                    <div className="lead-message-box">
                      <span className="lead-message-title">Client Note:</span>
                      <p className="lead-message-text">"{lead.message}"</p>
                    </div>
                  )}

                  <div className="lead-date-row">
                    <span>Received on {new Date(lead.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  </div>

                  <div className="lead-actions-bar">
                    <Link
                      to={`/admin/qr-builder?name=${encodeURIComponent(lead.businessName)}&owner=${encodeURIComponent(lead.ownerName)}&email=${encodeURIComponent(lead.email)}&phone=${encodeURIComponent(lead.phone || '')}&bizType=${encodeURIComponent(lead.businessType || '')}&leadId=${lead.id}`}
                      className="btn-convert-lead"
                    >
                      ⚡ Convert to Client & Make QR
                    </Link>

                    {cleanPhone && (
                      <a
                        href={`https://wa.me/${cleanPhone}?text=${waText}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-whatsapp-lead-admin"
                        title="Chat with lead on WhatsApp"
                      >
                        💬 WhatsApp
                      </a>
                    )}

                    <button
                      type="button"
                      className="btn-dismiss-lead"
                      onClick={() => handleDismissLead(lead.id)}
                      title="Dismiss lead"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredLeads.length === 0 && (
            <div className="admin-empty-state">
              <span>📬</span>
              <p>No new customer inquiries found.</p>
            </div>
          )}
        </div>
      ) : (
        /* =========================================================================
            VIEW 2: ONBOARDED CLIENTS GRID
            ========================================================================= */
        <div className="admin-clients-grid">
          {filteredClients.map((client) => {
            const expired = isPaidExpired(client.paidUntil);
            const days = daysUntil(client.paidUntil);
            const currentPlan = PLAN_OPTIONS.find((p) => p.id === (client.planId || 'starter')) || PLAN_OPTIONS[0];

            return (
              <div
                key={client.id}
                className={`admin-client-card ${client.status === 'inactive' ? 'client-card-inactive' : ''}`}
              >
                <div className="admin-client-card-header">
                  <div className={`admin-client-avatar ${client.status === 'inactive' ? 'avatar-inactive' : ''}`}>
                    {client.businessName[0]}
                  </div>
                  <div className="admin-client-header-info">
                    <div className="admin-client-name">{client.businessName}</div>
                    <div className="admin-client-type">{client.businessType}</div>
                  </div>
                  <div
                    className={`admin-client-status-badge ${
                      client.status === 'active'
                        ? 'status-active'
                        : client.status === 'inactive'
                        ? 'status-inactive-badge'
                        : 'status-setup'
                    }`}
                  >
                    {client.status === 'active'
                      ? '✅ Active'
                      : client.status === 'inactive'
                      ? '⛔ Inactive'
                      : '⏳ Setup'}
                  </div>
                </div>

                {/* Payment expiry warning / renewal status */}
                {client.paidUntil && (
                  <div className={`client-payment-bar ${expired ? 'payment-expired' : days !== null && days <= 7 ? 'payment-warning' : 'payment-ok'}`}>
                    {expired ? (
                      <span>⚠️ Service expired on {client.paidUntil} — review portal paused</span>
                    ) : days !== null && days <= 7 ? (
                      <span>⏰ Renewal due in {days} day{days !== 1 ? 's' : ''} ({client.paidUntil})</span>
                    ) : (
                      <span>💳 Paid until {client.paidUntil} ({days} days remaining)</span>
                    )}
                  </div>
                )}

                {/* Offline / External Billing Controls: Plan & Paid Until */}
                <div className="admin-external-billing-controls">
                  <div className="admin-control-field">
                    <label className="admin-field-label">Assigned Plan Tier</label>
                    <select
                      className="admin-field-select"
                      value={client.planId || 'starter'}
                      onChange={(e) => handlePlanChange(client.id, e.target.value)}
                    >
                      {PLAN_OPTIONS.map((opt) => (
                        <option key={opt.id} value={opt.id}>
                          💎 {opt.name} ({opt.price})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="admin-control-field">
                    <label className="admin-field-label">Paid Until (Renewal Date)</label>
                    <input
                      type="date"
                      className="admin-field-date"
                      value={client.paidUntil || ''}
                      onChange={(e) => handlePaidUntilChange(client.id, e.target.value)}
                      title="Change renewal date when offline payment is received"
                    />
                  </div>
                </div>

                <div className="admin-client-details">
                  <div className="admin-client-detail-row">
                    <span className="admin-client-detail-icon">👤</span>
                    <span>{client.ownerName}</span>
                  </div>
                  <div className="admin-client-detail-row">
                    <span className="admin-client-detail-icon">📧</span>
                    <a href={`mailto:${client.email}`} className="admin-client-link">
                      {client.email}
                    </a>
                  </div>
                  <div className="admin-client-detail-row">
                    <span className="admin-client-detail-icon">📞</span>
                    <span>{client.phone}</span>
                  </div>
                  {client.qrSentAt && (
                    <div className="admin-client-detail-row">
                      <span className="admin-client-detail-icon">🔲</span>
                      <span>QR sent on {client.qrSentAt}</span>
                    </div>
                  )}
                </div>

                <div className="admin-client-stat-bar">
                  <div className="admin-client-stat">
                    <div className="admin-client-stat-val">{client.reviewsGenerated}</div>
                    <div className="admin-client-stat-label">Reviews Generated</div>
                  </div>
                  <div className="admin-client-stat">
                    <div className="admin-client-stat-val">{client.locations}</div>
                    <div className="admin-client-stat-label">Location{client.locations !== '1' ? 's' : ''}</div>
                  </div>
                  <div className="admin-client-stat">
                    <div className="admin-client-stat-val">{currentPlan.name}</div>
                    <div className="admin-client-stat-label">Plan Tier</div>
                  </div>
                </div>

                <div className="admin-client-card-actions">
                  {client.status !== 'setup' && (
                    <a
                      href={`/review/${client.id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="admin-btn-xs"
                    >
                      📱 Review Page
                    </a>
                  )}
                  <Link
                    to={`/admin/qr-builder?name=${encodeURIComponent(client.businessName)}&bizId=${client.id}&email=${encodeURIComponent(client.email)}&owner=${encodeURIComponent(client.ownerName || '')}&phone=${encodeURIComponent(client.phone || '')}&planId=${client.planId || 'pro'}`}
                    className="admin-btn-xs"
                  >
                    🔲 Standee QR
                  </Link>
                  {client.status !== 'setup' && (
                    <a
                      href={`/dashboard/${client.id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="admin-btn-xs"
                    >
                      📊 Dashboard
                    </a>
                  )}
                </div>

                {/* Activate / Deactivate Button */}
                {client.status !== 'setup' && (
                  <button
                    className={`client-toggle-btn ${client.status === 'active' ? 'btn-deactivate' : 'btn-reactivate'}`}
                    onClick={() => handleToggleStatus(client)}
                  >
                    {client.status === 'active' ? '⛔ Deactivate Service' : '✅ Reactivate Service'}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {statusFilter !== 'inquiries' && filteredClients.length === 0 && (
        <div className="admin-empty-state">
          <span>🏢</span>
          <p>No clients found matching your search.</p>
        </div>
      )}
    </div>
  );
}
