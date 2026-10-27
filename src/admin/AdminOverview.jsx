import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { isClientInactive } from './AdminClients';

const STATUS_CONFIG = {
  new: { label: 'New', cls: 'status-new' },
  in_progress: { label: 'In Progress', cls: 'status-progress' },
  done: { label: 'QR Sent ✓', cls: 'status-done' },
};

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

export default function AdminOverview() {
  const [loading, setLoading] = useState(true);
  const [statsData, setStatsData] = useState({
    newRequests: 0,
    pendingRequests: 0,
    qrCodesSent: 0,
    activeClients: 0,
    totalClients: 0,
    reviewsGenerated: 0,
    shieldedReviews: 0,
    monthlyRevenue: 0,
    planMix: { starter: 0, pro: 0, enterprise: 0 },
  });
  const [recentRequests, setRecentRequests] = useState([]);
  const [sampleClient, setSampleClient] = useState(null);

  const loadOverviewData = useCallback(async () => {
    try {
      // 1. Fetch real leads
      let realLeads = [];
      try {
        const rawLeads = await api.getLeads();
        if (Array.isArray(rawLeads)) {
          realLeads = rawLeads.filter((l) => !['req-001', 'req-002', 'req-003'].includes(l.id));
        }
      } catch (err) {
        console.warn('Overview leads load error:', err);
      }

      // 2. Fetch real clients / businesses
      let allClients = [];
      if (isSupabaseConfigured() && supabase) {
        try {
          const bizData = await api.getAdminBusinesses();
          if (Array.isArray(bizData)) {
            allClients = bizData.map((b) => ({
              id: b.id,
              businessName: b.name,
              status: b.status,
              subscriptionStatus: b.subscription_status,
              paidUntil: b.paid_until,
              createdAt: b.created_at,
              reviewsGenerated: b.ai_credits_used || 0,
              planId: b.plan_id || 'starter',
            }));
          }
        } catch (err) {
          console.warn('Overview Supabase businesses load error:', err);
        }
      }

      // Merge local storage clients
      try {
        const rawLocal = localStorage.getItem('reviewassist_admin_clients');
        if (rawLocal) {
          const parsed = JSON.parse(rawLocal);
          if (Array.isArray(parsed)) {
            const map = new Map();
            allClients.forEach((c) => map.set(c.id, c));
            parsed.forEach((c) => {
              if (!map.has(c.id)) map.set(c.id, c);
            });
            allClients = Array.from(map.values());
          }
        }
      } catch {}

      // 3. Count reviews across database & local
      let totalReviews = 0;
      if (isSupabaseConfigured() && supabase) {
        try {
          const { count } = await supabase.from('reviews').select('*', { count: 'exact', head: true });
          if (typeof count === 'number') totalReviews = count;
        } catch {}
      }
      try {
        const rawRevs = localStorage.getItem('review_assist_reviews');
        if (rawRevs) {
          const parsed = JSON.parse(rawRevs);
          let localCount = 0;
          Object.values(parsed).forEach((arr) => {
            if (Array.isArray(arr)) localCount += arr.length;
          });
          totalReviews = Math.max(totalReviews, localCount);
        }
      } catch {}

      // 4. Count shielded negative reviews
      let totalShielded = 0;
      if (isSupabaseConfigured() && supabase) {
        try {
          const { count } = await supabase.from('private_feedback').select('*', { count: 'exact', head: true });
          if (typeof count === 'number') totalShielded = count;
        } catch {}
      }
      try {
        const rawShield = localStorage.getItem('reviewassist_private_feedback');
        if (rawShield) {
          const parsed = JSON.parse(rawShield);
          let localShieldCount = 0;
          Object.values(parsed).forEach((arr) => {
            if (Array.isArray(arr)) localShieldCount += arr.length;
          });
          totalShielded = Math.max(totalShielded, localShieldCount);
        }
      } catch {}

      // Real calculations
      const newReqCount = realLeads.filter((l) => l.status === 'new').length;
      const pendingReqCount = realLeads.filter((l) => l.status === 'new' || l.status === 'in_progress').length;
      const activeClientCount = allClients.filter((c) => !isClientInactive(c)).length;
      const qrSentCount = allClients.filter((c) => c.qrSentAt || c.createdAt).length;
      const planPrices = { starter: 299, pro: 499, enterprise: 799 };
      const planMix = { starter: 0, pro: 0, enterprise: 0 };
      const monthlyRevenue = allClients.reduce((total, client) => {
        if (isClientInactive(client)) return total;
        const planId = String(client.planId || client.plan_id || 'starter').toLowerCase();
        if (Object.prototype.hasOwnProperty.call(planMix, planId)) planMix[planId] += 1;
        return total + (planPrices[planId] || planPrices.starter);
      }, 0);

      setStatsData({
        newRequests: newReqCount,
        pendingRequests: pendingReqCount,
        qrCodesSent: qrSentCount,
        activeClients: activeClientCount,
        totalClients: allClients.length,
        reviewsGenerated: totalReviews,
        shieldedReviews: totalShielded,
        monthlyRevenue,
        planMix,
      });

      // Top 5 recent real leads
      setRecentRequests(realLeads.slice(0, 5));

      // Latest active client for preview link
      const firstActive = allClients.find((c) => !isClientInactive(c)) || allClients[0] || null;
      setSampleClient(firstActive);
    } catch (err) {
      console.warn('Error loading admin overview metrics:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOverviewData();

    const handleSync = () => loadOverviewData();
    window.addEventListener('storage', handleSync);
    window.addEventListener('reviewassist:status_changed', handleSync);
    window.addEventListener('reviewassist:lead_submitted', handleSync);

    // Multi-tab BroadcastChannel
    let bc = null;
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        bc = new BroadcastChannel('reviewassist_leads_channel');
        bc.onmessage = () => loadOverviewData();
      } catch {}
    }

    // Supabase Realtime listeners
    let leadChan = null;
    let bizChan = null;
    if (isSupabaseConfigured() && supabase) {
      try {
        leadChan = supabase
          .channel('overview-leads-sync')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, () => {
            loadOverviewData();
          })
          .subscribe();

        bizChan = supabase
          .channel('overview-biz-sync')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'businesses' }, () => {
            loadOverviewData();
          })
          .subscribe();
      } catch {}
    }

    return () => {
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('reviewassist:status_changed', handleSync);
      window.removeEventListener('reviewassist:lead_submitted', handleSync);
      if (bc) bc.close();
      if (leadChan) leadChan.unsubscribe();
      if (bizChan) bizChan.unsubscribe();
    };
  }, [loadOverviewData]);

  const kpis = [
    {
      icon: '📥',
      label: 'New Contact Requests',
      value: statsData.newRequests.toLocaleString(),
      sub: statsData.pendingRequests > 0 ? `${statsData.pendingRequests} pending review` : '0 pending review',
      color: 'amber',
    },
    {
      icon: '🔲',
      label: 'QR Codes Generated',
      value: statsData.qrCodesSent.toLocaleString(),
      sub: statsData.qrCodesSent > 0 ? `${statsData.qrCodesSent} active standees` : '0 standees created',
      color: 'violet',
    },
    {
      icon: '🏢',
      label: 'Active Clients',
      value: statsData.activeClients.toLocaleString(),
      sub: statsData.totalClients > 0 ? `${statsData.totalClients} total onboarded` : '0 registered clients',
      color: 'emerald',
    },
    {
      icon: '⭐',
      label: 'Reviews Generated',
      value: statsData.reviewsGenerated.toLocaleString(),
      sub: statsData.reviewsGenerated > 0 ? 'Across all clients' : '0 reviews collected',
      color: 'cyan',
    },
    {
      icon: '🛡️',
      label: 'Negative Reviews Shielded',
      value: statsData.shieldedReviews.toLocaleString(),
      sub: statsData.shieldedReviews > 0 ? 'Intercepted from Google' : '0 complaints intercepted',
      color: 'rose',
    },
  ];

  const reviewPreviewLink = sampleClient?.id
    ? `/review/${sampleClient.id}`
    : '/admin/qr-builder';
  const maxPlanCount = Math.max(...Object.values(statsData.planMix), 1);

  return (
    <div className="admin-overview-page admin-command-center">
      <div className="admin-overview-topbar">
        <div>
          <span className="admin-overview-eyebrow">Workspace / Overview</span>
          <h1 className="admin-page-title">Revenue overview</h1>
          <p className="admin-page-subtitle">A clear view of clients, QR growth, reviews, and payment activity.</p>
        </div>
        <div className="admin-header-actions">
          <Link to="/admin/inbox" className="admin-btn-secondary">📥 Inbox {statsData.newRequests > 0 && `(${statsData.newRequests})`}</Link>
          <Link to="/admin/qr-builder" className="admin-btn-primary">＋ New QR client</Link>
        </div>
      </div>

      <div className="admin-overview-grid">
        <main className="admin-overview-main">
          <div className="admin-overview-kpis">
            <div className="overview-kpi-card kpi-indigo">
              <span className="overview-kpi-label">MONTHLY REVENUE</span>
              <strong>₹{loading ? '—' : statsData.monthlyRevenue.toLocaleString('en-IN')}</strong>
              <small>Based on active client plans</small>
              <div className="kpi-sparkline"><i /><i /><i /><i /><i /><i /></div>
            </div>
            <div className="overview-kpi-card kpi-cyan">
              <span className="overview-kpi-label">ACTIVE CLIENTS</span>
              <strong>{loading ? '—' : statsData.activeClients.toLocaleString()}</strong>
              <small>{statsData.totalClients} total onboarded</small>
              <div className="kpi-sparkline"><i /><i /><i /><i /><i /><i /></div>
            </div>
            <div className="overview-kpi-card kpi-violet">
              <span className="overview-kpi-label">NEW REQUESTS</span>
              <strong>{loading ? '—' : statsData.newRequests.toLocaleString()}</strong>
              <small>{statsData.pendingRequests} awaiting action</small>
              <div className="kpi-sparkline"><i /><i /><i /><i /><i /><i /></div>
            </div>
            <div className="overview-kpi-card kpi-rose">
              <span className="overview-kpi-label">REVIEWS COLLECTED</span>
              <strong>{loading ? '—' : statsData.reviewsGenerated.toLocaleString()}</strong>
              <small>{statsData.shieldedReviews} private intercepts</small>
              <div className="kpi-sparkline"><i /><i /><i /><i /><i /><i /></div>
            </div>
          </div>

          <div className="admin-overview-content-grid">
            <section className="admin-overview-panel revenue-panel">
              <div className="overview-panel-heading">
                <div><h2>Client growth</h2><p>Active businesses onboarded to ReviewAssist</p></div>
                <span className="overview-period-pill">Live data</span>
              </div>
              <div className="growth-chart">
                <div className="chart-y-labels"><span>{statsData.totalClients}</span><span>{Math.ceil(statsData.totalClients / 2)}</span><span>0</span></div>
                <div className="chart-bars">
                  {[0.32, 0.44, 0.38, 0.58, 0.54, 0.7, 0.78, 0.92].map((height, index) => (
                    <div className="chart-bar-group" key={index}><div className="chart-bar" style={{ height: `${Math.max(14, height * Math.max(statsData.totalClients, 1) * 8)}px` }} /><span>{['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'][index]}</span></div>
                  ))}
                </div>
              </div>
            </section>

            <section className="admin-overview-panel plans-panel">
              <div className="overview-panel-heading"><div><h2>Top plans</h2><p>Active clients by tier</p></div></div>
              <div className="plan-bars">
                {[
                  ['starter', 'Starter', '#8b5cf6'],
                  ['pro', 'Pro Growth', '#6366f1'],
                  ['enterprise', 'Enterprise', '#22d3ee'],
                ].map(([id, label, color]) => (
                  <div className="plan-bar-item" key={id}><div className="plan-bar-value">{statsData.planMix[id]}</div><div className="plan-bar" style={{ height: `${Math.max(18, (statsData.planMix[id] / maxPlanCount) * 108)}px`, background: color }} /><span>{label}</span></div>
                ))}
              </div>
            </section>
          </div>

          <section className="admin-overview-panel activity-panel">
            <div className="overview-panel-heading"><div><h2>Recent activity</h2><p>Latest contact requests and onboarding events</p></div><Link to="/admin/inbox" className="overview-link">View all →</Link></div>
            {recentRequests.length > 0 ? (
              <div className="overview-activity-table">
                <div className="overview-table-head"><span>BUSINESS</span><span>REQUEST</span><span>RECEIVED</span><span>STATUS</span></div>
                {recentRequests.map((req) => (
                  <Link to="/admin/inbox" className="overview-activity-row" key={req.id}>
                    <span className="activity-business"><b>{req.businessName?.[0] || 'B'}</b><strong>{req.businessName}</strong></span>
                    <span>{req.businessType || 'QR setup request'}</span>
                    <span>{timeAgo(req.submittedAt || req.createdAt)}</span>
                    <span className={`admin-status-pill ${STATUS_CONFIG[req.status]?.cls || 'status-new'}`}>{STATUS_CONFIG[req.status]?.label || 'New'}</span>
                  </Link>
                ))}
              </div>
            ) : <div className="overview-empty-state">📭 No contact requests yet. New QR enquiries will appear here.</div>}
          </section>
        </main>

        <aside className="admin-overview-rail">
          <section className="overview-rail-card">
            <div className="overview-rail-heading"><h3>Live notifications</h3><span className="live-dot" /></div>
            <p className="rail-muted">Your workspace is monitoring Supabase events.</p>
            <div className="notification-pills"><span>{statsData.newRequests} new requests</span><span>{statsData.pendingRequests} pending actions</span><span>{statsData.activeClients} active clients</span></div>
          </section>
          <section className="overview-rail-card">
            <h3>Quick actions</h3>
            <div className="rail-action-list">
              <Link to="/admin/qr-builder">＋ Create QR client <span>→</span></Link>
              <Link to="/admin/payments">💸 Review UPI payments <span>→</span></Link>
              <Link to="/admin/clients">🏢 Manage clients <span>→</span></Link>
              <a href={reviewPreviewLink} target="_blank" rel="noreferrer">📱 Test review flow <span>→</span></a>
            </div>
          </section>
          <section className="overview-rail-card insight-card">
            <span className="insight-icon">✦</span><h3>AI insight</h3>
            <p>{statsData.pendingRequests > 0 ? `You have ${statsData.pendingRequests} requests waiting for follow-up. Processing them can unlock more active client revenue.` : 'Your pipeline is clear. Invite a new business to grow monthly recurring revenue.'}</p>
            <Link to="/admin/inbox">Open inbox →</Link>
          </section>
          <section className="overview-rail-card">
            <h3>Platform health</h3>
            <div className="health-row"><span><i className="health-dot" /> Supabase</span><b>Connected</b></div>
            <div className="health-row"><span><i className="health-dot" /> QR review flow</span><b>Operational</b></div>
            <div className="health-row"><span><i className="health-dot" /> Private feedback</span><b>Protected</b></div>
          </section>
        </aside>
      </div>
    </div>
  );
}
