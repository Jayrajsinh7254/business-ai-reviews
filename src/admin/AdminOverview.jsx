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
          const { data: bizData } = await supabase
            .from('businesses')
            .select('id, name, email, category, status, subscription_status, paid_until, created_at, ai_credits_used')
            .order('created_at', { ascending: false });
          if (Array.isArray(bizData)) {
            allClients = bizData.map((b) => ({
              id: b.id,
              businessName: b.name,
              status: b.status,
              subscriptionStatus: b.subscription_status,
              paidUntil: b.paid_until,
              createdAt: b.created_at,
              reviewsGenerated: b.ai_credits_used || 0,
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

      setStatsData({
        newRequests: newReqCount,
        pendingRequests: pendingReqCount,
        qrCodesSent: qrSentCount,
        activeClients: activeClientCount,
        totalClients: allClients.length,
        reviewsGenerated: totalReviews,
        shieldedReviews: totalShielded,
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

  return (
    <div className="admin-overview-page">
      {/* Header */}
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Admin Overview</h1>
          <p className="admin-page-subtitle">
            Real-time command center for your ReviewAssist client pipeline, QR standees, and review generation.
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
        {kpis.map((stat) => (
          <div key={stat.label} className={`admin-stat-card admin-stat-${stat.color}`}>
            <div className="admin-stat-icon">{stat.icon}</div>
            <div className="admin-stat-body">
              <div className="admin-stat-value">{loading ? '…' : stat.value}</div>
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

        {recentRequests.length > 0 ? (
          <div className="admin-requests-list">
            {recentRequests.map((req) => (
              <div key={req.id} className="admin-request-row">
                <div className="admin-request-avatar">
                  {req.businessName?.[0] || req.ownerName?.[0] || '🏢'}
                </div>
                <div className="admin-request-info">
                  <div className="admin-request-name">{req.businessName}</div>
                  <div className="admin-request-meta">
                    {req.ownerName} · {req.businessType || 'Local Business'} · {req.phone || req.email}
                  </div>
                </div>
                <div className="admin-request-time">{timeAgo(req.submittedAt || req.createdAt)}</div>
                <div className={`admin-status-pill ${STATUS_CONFIG[req.status]?.cls || 'status-new'}`}>
                  {STATUS_CONFIG[req.status]?.label || 'New'}
                </div>
                <Link to="/admin/inbox" className="admin-btn-xs">
                  View →
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <div className="admin-empty-state" style={{ padding: '40px 20px', textAlign: 'center' }}>
            <span style={{ fontSize: '2.5rem' }}>📭</span>
            <h3 style={{ margin: '12px 0 6px', fontSize: '1.05rem', fontWeight: 700, color: '#334155' }}>
              No Contact Requests Yet
            </h3>
            <p style={{ color: '#64748b', fontSize: '0.88rem', maxWidth: '420px', margin: '0 auto 16px' }}>
              When shop owners submit registration or QR standee requests, they will appear here in real-time.
            </p>
            <Link to="/admin/qr-builder" className="admin-btn-primary" style={{ display: 'inline-flex' }}>
              ➕ Create First Client &amp; Standee
            </Link>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="admin-quick-actions-grid">
        <Link to="/admin/qr-builder" className="admin-quick-card">
          <span className="admin-quick-icon">🔲</span>
          <strong>Build &amp; Send QR</strong>
          <p>Generate a custom 4-Color Google QR standee with centered logo for a client.</p>
        </Link>
        <Link to="/admin/inbox" className="admin-quick-card">
          <span className="admin-quick-icon">📥</span>
          <strong>Review Inbox</strong>
          <p>Process incoming QR setup requests and contact clients directly on WhatsApp.</p>
        </Link>
        <Link to="/admin/clients" className="admin-quick-card">
          <span className="admin-quick-icon">🏢</span>
          <strong>Manage Clients</strong>
          <p>View all active clients, toggle active/inactive status, and manage subscriptions.</p>
        </Link>
        <a href={reviewPreviewLink} target="_blank" rel="noreferrer" className="admin-quick-card">
          <span className="admin-quick-icon">📱</span>
          <strong>Test Review Flow</strong>
          <p>
            {sampleClient
              ? `Open live 30s customer review experience for "${sampleClient.businessName}".`
              : 'Open the customer review experience or generate your first test QR standee.'}
          </p>
        </a>
      </div>
    </div>
  );
}
