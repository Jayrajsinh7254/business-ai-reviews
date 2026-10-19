import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { api, isGenericOrEmptyServices } from '../api/client';
import { getCategoryServices } from '../lib/categories';

/**
 * AdminClients — Real-Time Client & Lead Management
 * ─────────────────────────────────────────────────────────────────
 * Loads all clients from Supabase (businesses table) when configured.
 * Falls back to empty state (no dummy data) for a clean real launch.
 *
 * Client Types:
 *  - "trial"  → subscriptionStatus = 'trialing' (first 7 days after signup)
 *  - "member" → subscriptionStatus = 'active'   (paid / admin-activated)
 *  - "setup"  → no Google review URL yet
 *  - "inactive" → manually deactivated or trial expired
 */

const PLAN_OPTIONS = [
  { id: 'starter',    name: 'Starter',    price: '₹299/mo',   tag: '1 loc • 1 seat • was ₹499' },
  { id: 'pro',        name: 'Pro Growth', price: '₹499/mo',   tag: '3 loc • 5 seats • was ₹699' },
  { id: 'enterprise', name: 'Enterprise', price: '₹799/mo',   tag: 'unlimited • was ₹1,199' },
];

const EDIT_CATEGORY_OPTIONS = [
  'Automobile & Garage',
  'Salon & Beauty Studio',
  'Restaurant & Cafe',
  'Healthcare & Clinic',
  'Dental Clinic & Care',
  'Fitness & Gym Club',
  'Retail Store & Mart',
  'Hotel & Hospitality',
  'Real Estate & Property',
  'Education & Coaching',
  'Electronics & Repair',
  'Professional Services',
  'Other / Local Business',
];

const STATUS_FILTERS = ['all', 'member', 'trial', 'inactive', 'inquiries'];

function isPaidExpired(paidUntil) {
  if (!paidUntil) return false;
  return new Date(paidUntil) < new Date();
}

function daysUntil(dateStr) {
  if (!dateStr) return null;
  const diff = new Date(dateStr) - new Date();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function isClientInactive(client) {
  if (!client) return false;
  const isExpired = Boolean(client.paidUntil && new Date(client.paidUntil) < new Date());
  return Boolean(
    client.status === 'inactive' ||
    client.subscription_status === 'inactive' ||
    client.subscription_status === 'canceled' ||
    client.subscriptionStatus === 'inactive' ||
    client.subscriptionStatus === 'canceled' ||
    isExpired
  );
}

function getClientType(client) {
  if (isClientInactive(client)) return 'inactive';
  const status = client.subscription_status || client.subscriptionStatus || client.status || '';
  if (status === 'trialing' || status === 'trial') return 'trial';
  if (status === 'active') return 'member';
  return 'setup';
}

function ClientTypeBadge({ clientType }) {
  const config = {
    trial:    { label: '🎁 Free Trial', cls: 'client-type-trial' },
    member:   { label: '✅ Active Member', cls: 'client-type-member' },
    inactive: { label: '⛔ Inactive', cls: 'client-type-inactive' },
    setup:    { label: '⏳ Setup', cls: 'client-type-setup' },
  };
  const c = config[clientType] || config.setup;
  return <span className={`client-type-badge ${c.cls}`}>{c.label}</span>;
}

export default function AdminClients() {
  const [clients, setClients] = useState([]);
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [toastMsg, setToastMsg] = useState('');

  // ── Edit Client Modal State ────────────────────────────────────────────────
  const [editingClient, setEditingClient] = useState(null);
  const [editForm, setEditForm] = useState({
    id: '',
    businessName: '',
    ownerName: '',
    email: '',
    phone: '',
    password: '',
    category: 'Other / Local Business',
    services: '',
    googleReviewUrl: '',
    planId: 'starter',
    status: 'active',
    paidUntil: '',
    logoUrl: '',
    tagline: '',
  });
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState(false);

  // ── Load from Supabase (or localStorage fallback) ──────────────────────────
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      let supaMapped = [];
      if (isSupabaseConfigured() && supabase) {
        // Load businesses (clients)
        const { data: bizData, error: bizErr } = await supabase
          .from('businesses')
          .select('*')
          .order('created_at', { ascending: false });

        if (!bizErr && bizData) {
          supaMapped = bizData.map((b) => {
            const inactive =
              b.subscription_status === 'canceled' ||
              b.subscription_status === 'inactive' ||
              b.status === 'inactive' ||
              Boolean(b.paid_until && new Date(b.paid_until) < new Date());

            return {
              id: b.id,
              businessName: b.name,
              ownerName: b.email || '—',
              businessType: b.category || '—',
              email: b.email || '',
              phone: b.phone || '',
              services: b.services || [],
              locations: '1',
              reviewsGenerated: b.ai_credits_used || 0,
              status: inactive ? 'inactive' : b.subscription_status === 'trialing' ? 'trial' : 'active',
              subscriptionStatus: inactive ? 'canceled' : b.subscription_status || 'active',
              planId: b.plan_id || 'starter',
              qrSentAt: b.created_at ? b.created_at.split('T')[0] : null,
              paidUntil: b.paid_until || null,
              googleReviewUrl: b.google_review_url,
              logoUrl: b.logo_url || '',
              tagline: b.tagline || '',
              createdAt: b.created_at,
            };
          });
        }
      }

      // Read local clients
      let localClients = [];
      try {
        const storedClients = localStorage.getItem('reviewassist_admin_clients');
        if (storedClients) {
          const parsed = JSON.parse(storedClients);
          if (Array.isArray(parsed)) localClients = parsed;
        }
      } catch {}

      // Merge clients (Supabase first, local if not present, and respect local overrides)
      const clientMap = new Map();
      supaMapped.forEach((c) => clientMap.set(c.id, c));
      localClients.forEach((c) => {
        if (!clientMap.has(c.id)) {
          clientMap.set(c.id, c);
        } else {
          const existing = clientMap.get(c.id);
          if (c.status === 'inactive' || c.subscriptionStatus === 'canceled') {
            existing.status = 'inactive';
            existing.subscriptionStatus = 'canceled';
          } else if (c.status === 'active' || c.subscriptionStatus === 'active') {
            existing.status = 'active';
            existing.subscriptionStatus = 'active';
            if (isPaidExpired(existing.paidUntil)) {
              existing.paidUntil = null;
            }
          }
          if (c.paidUntil && !existing.paidUntil) existing.paidUntil = c.paidUntil;
          if (c.phone) existing.phone = c.phone;
          if (c.ownerName && (!existing.ownerName || existing.ownerName === '—')) existing.ownerName = c.ownerName;
          if (c.password) existing.password = c.password;
          if (c.services && (!existing.services || existing.services.length === 0)) existing.services = c.services;
          if (c.googleReviewUrl && !existing.googleReviewUrl) existing.googleReviewUrl = c.googleReviewUrl;
          if (c.logoUrl) existing.logoUrl = c.logoUrl;
          if (c.tagline) existing.tagline = c.tagline;
        }
      });
      setClients(Array.from(clientMap.values()));

      // Load unified leads
      try {
        const unifiedLeads = await api.getLeads();
        setLeads(unifiedLeads || []);
      } catch (leadErr) {
        console.warn('AdminClients: leads load notice:', leadErr);
      }
    } catch (err) {
      console.warn('AdminClients: data load error', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const handleSync = (e) => {
      // Do not re-fetch if this was dispatched by our own action
      if (e?.detail?.source === 'admin_clients') return;
      loadData();
    };
    window.addEventListener('storage', handleSync);
    window.addEventListener('reviewassist:status_changed', handleSync);
    window.addEventListener('reviewassist:admin_sync', handleSync);
    window.addEventListener('reviewassist:lead_submitted', handleSync);

    // Multi-tab BroadcastChannel for instant client-to-admin lead sync
    let bc = null;
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        bc = new BroadcastChannel('reviewassist_leads_channel');
        bc.onmessage = () => loadData();
      } catch {}
    }

    // Supabase Realtime listeners on leads and businesses
    let supaChannel = null;
    if (isSupabaseConfigured() && supabase) {
      try {
        supaChannel = supabase
          .channel('realtime-clients-leads')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, () => {
            loadData();
          })
          .on('postgres_changes', { event: '*', schema: 'public', table: 'businesses' }, () => {
            loadData();
          })
          .subscribe();
      } catch (err) {
        console.warn('AdminClients realtime listener notice:', err);
      }
    }

    return () => {
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('reviewassist:status_changed', handleSync);
      window.removeEventListener('reviewassist:admin_sync', handleSync);
      window.removeEventListener('reviewassist:lead_submitted', handleSync);
      if (bc) bc.close();
      if (supaChannel && supabase) supabase.removeChannel(supaChannel);
    };
  }, [loadData]);

  // ── Persist helpers (for offline / localStorage mode) ─────────────────────
  const persistClients = (updatedList) => {
    setClients(updatedList);
    try { localStorage.setItem('reviewassist_admin_clients', JSON.stringify(updatedList)); } catch {}
  };

  const persistLeads = (updatedLeads) => {
    setLeads(updatedLeads);
    try { localStorage.setItem('reviewassist_admin_leads', JSON.stringify(updatedLeads)); } catch {}
  };

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3500);
  };

  // ── Edit Modal Handlers ────────────────────────────────────────────────────
  const handleOpenEditModal = (client) => {
    const creds = api.getClientCredentials(client.id || client.email);
    const hasCustomServices = Array.isArray(client.services) && client.services.length > 0 && !isGenericOrEmptyServices(client.services);
    const servicesStr = hasCustomServices
      ? client.services.join(', ')
      : getCategoryServices(client.businessType || client.category).join(', ');

    setEditForm({
      id: client.id,
      businessName: client.businessName || '',
      ownerName: client.ownerName && client.ownerName !== '—' ? client.ownerName : (client.businessName || ''),
      email: client.email || '',
      phone: client.phone || '',
      password: client.password || creds.password || 'welcome123',
      category: client.businessType || 'Other / Local Business',
      services: servicesStr,
      googleReviewUrl: client.googleReviewUrl || '',
      planId: client.planId || 'starter',
      status: isClientInactive(client) ? 'inactive' : (client.status === 'trial' ? 'trial' : 'active'),
      paidUntil: client.paidUntil || '',
      logoUrl: client.logoUrl || '',
      tagline: client.tagline || 'Scan to Share Your Review',
    });
    setShowEditPassword(false);
    setEditingClient(client);
  };

  const handleGenerateRandomPassword = () => {
    const prefixes = ['Review', 'Apex', 'Star', 'Trust', 'Growth', 'Boost', 'Prime'];
    const p = prefixes[Math.floor(Math.random() * prefixes.length)];
    const n = Math.floor(1000 + Math.random() * 9000);
    const symbols = ['!', '@', '#', '$'];
    const s = symbols[Math.floor(Math.random() * symbols.length)];
    const newPass = `${p}${n}${s}`;
    setEditForm((prev) => ({ ...prev, password: newPass }));
    setShowEditPassword(true);
    showToast(`🎲 Generated password: ${newPass}`);
  };

  const handleCopyCredentials = (targetForm) => {
    const form = targetForm || editForm;
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const text = `ReviewAssist Dashboard Login Details:\n🏢 Business: ${form.businessName}\n🔗 Portal: ${origin}/login\n📧 Email: ${form.email}\n🔑 Password: ${form.password || 'welcome123'}`;
    navigator.clipboard.writeText(text);
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 2500);
    showToast('📋 Login credentials copied to clipboard!');
  };

  const handleShareCredentialsWhatsApp = (clientOrForm) => {
    const target = clientOrForm || editForm;
    const cleanPhone = (target.phone || '').replace(/[^0-9]/g, '');
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const creds = api.getClientCredentials(target.id || target.email);
    const pass = target.password || creds.password || 'welcome123';
    const bName = target.businessName || target.name || 'Your Business';
    const oName = target.ownerName && target.ownerName !== '—' ? target.ownerName : bName;
    const mail = target.email || creds.email;

    const msg = encodeURIComponent(
      `Hi ${oName}! 👋\n\n` +
      `Here are your official login details for your *${bName}* AI Review Dashboard:\n\n` +
      `🔗 *Login Portal:* ${origin}/login\n` +
      `📧 *Email:* ${mail}\n` +
      `🔑 *Password:* ${pass}\n\n` +
      `Sign in to view customer reviews, customize feedback replies, and track Google rating growth!\n\n` +
      `Feel free to reach out if you have any questions.`
    );

    if (cleanPhone) {
      window.open(`https://wa.me/${cleanPhone}?text=${msg}`, '_blank');
    } else {
      window.open(`https://wa.me/?text=${msg}`, '_blank');
    }
    showToast(`💬 Opening WhatsApp for ${bName}...`);
  };

  const handleSaveEdit = async (e) => {
    e?.preventDefault();
    if (!editForm.businessName.trim()) {
      showToast('⚠️ Business name is required.');
      return;
    }
    if (!editForm.email.trim()) {
      showToast('⚠️ Login email is required.');
      return;
    }

    setSavingEdit(true);
    try {
      const servicesArray = editForm.services
        ? editForm.services.split(',').map((s) => s.trim()).filter(Boolean)
        : ['General Service'];

      await api.updateClientAccount({
        id: editForm.id,
        businessName: editForm.businessName.trim(),
        ownerName: editForm.ownerName.trim(),
        email: editForm.email.trim(),
        phone: editForm.phone.trim(),
        password: editForm.password.trim() || 'welcome123',
        category: editForm.category,
        services: servicesArray,
        googleReviewUrl: editForm.googleReviewUrl.trim(),
        planId: editForm.planId,
        status: editForm.status,
        paidUntil: editForm.paidUntil || null,
        logoUrl: editForm.logoUrl.trim(),
        tagline: editForm.tagline.trim(),
      });

      showToast(`✅ Updated details & credentials for "${editForm.businessName}"!`);
      setEditingClient(null);
      await loadData();
    } catch (err) {
      console.error('Failed to update client:', err);
      showToast(`⚠️ Could not save updates: ${err.message}`);
    } finally {
      setSavingEdit(false);
    }
  };

  // ── Actions ────────────────────────────────────────────────────────────────
  const handleToggleStatus = async (client) => {
    if (!client) return;
    const currentlyInactive = isClientInactive(client);
    const newStatus = currentlyInactive ? 'active' : 'inactive';
    const subStatusVal = currentlyInactive ? 'active' : 'canceled';

    // 1. Instant optimistic state update (counts and card update in 0ms!)
    const updated = clients.map((c) => {
      if (c.id === client.id) {
        return {
          ...c,
          status: newStatus,
          subscriptionStatus: subStatusVal,
          paidUntil: currentlyInactive && isPaidExpired(c.paidUntil) ? null : c.paidUntil,
        };
      }
      return c;
    });
    persistClients(updated);

    // 2. Persist to localStorage immediately
    try {
      localStorage.setItem('reviewassist_admin_clients', JSON.stringify(updated));

      const bizData = localStorage.getItem('review_assist_businesses');
      const storedBiz = bizData ? JSON.parse(bizData) : {};
      storedBiz[client.id] = {
        ...(storedBiz[client.id] || {}),
        id: client.id,
        name: client.businessName,
        status: newStatus,
        subscriptionStatus: subStatusVal,
        isInactive: currentlyInactive ? false : true,
      };
      if (currentlyInactive && isPaidExpired(storedBiz[client.id].paidUntil)) {
        storedBiz[client.id].paidUntil = null;
      }
      localStorage.setItem('review_assist_businesses', JSON.stringify(storedBiz));
      try { localStorage.setItem('reviewassist_businesses', JSON.stringify(storedBiz)); } catch {}

      const subData = localStorage.getItem('review_assist_subscriptions');
      const storedSubs = subData ? JSON.parse(subData) : {};
      storedSubs[client.id] = {
        ...(storedSubs[client.id] || {}),
        businessId: client.id,
        status: subStatusVal,
        isInactive: currentlyInactive ? false : true,
      };
      localStorage.setItem('review_assist_subscriptions', JSON.stringify(storedSubs));
      try { localStorage.setItem('reviewassist_subscriptions', JSON.stringify(storedSubs)); } catch {}

      // Notify other tabs / views via BroadcastChannel and window events
      try {
        if (typeof BroadcastChannel !== 'undefined') {
          const bc = new BroadcastChannel('reviewassist_channel');
          bc.postMessage({ type: 'status_changed', businessId: client.id, status: newStatus });
          bc.close();
        }
      } catch {}

      window.dispatchEvent(
        new CustomEvent('reviewassist:status_changed', {
          detail: { businessId: client.id, status: newStatus, source: 'admin_clients' },
        })
      );
    } catch (err) {
      console.warn('Local storage status sync notice:', err);
    }

    // 3. Show instant feedback toast
    showToast(
      currentlyInactive
        ? `✅ ${client.businessName} service reactivated.`
        : `⛔ ${client.businessName} service deactivated. Customer QR scans will show Paused.`
    );

    // 4. Asynchronously sync to Supabase (if configured)
    if (isSupabaseConfigured() && supabase) {
      try {
        const bizUpdatePayload = {
          subscription_status: subStatusVal,
          status: newStatus,
        };
        if (currentlyInactive) {
          bizUpdatePayload.paid_until = null;
        }
        await supabase
          .from('businesses')
          .update(bizUpdatePayload)
          .eq('id', client.id);

        try {
          await supabase
            .from('subscriptions')
            .update({ status: subStatusVal })
            .eq('business_id', client.id);
        } catch {}

        // Also sync deactivation status to the cloud credential record in leads table
        try {
          const { data: leadRec } = await supabase
            .from('leads')
            .select('*')
            .eq('id', `cred-${client.id}`)
            .maybeSingle();

          let parsed = {};
          if (leadRec && leadRec.message) {
            try { parsed = JSON.parse(leadRec.message); } catch {}
          }
          parsed.businessId = client.id;
          parsed.status = newStatus;
          parsed.subscriptionStatus = subStatusVal;
          parsed.isInactive = currentlyInactive ? false : true;
          parsed.updatedAt = new Date().toISOString();

          await supabase
            .from('leads')
            .upsert({
              id: `cred-${client.id}`,
              email: client.email || leadRec?.email || '',
              name: client.businessName || leadRec?.name || 'Business',
              status: 'done',
              message: JSON.stringify(parsed),
            });
        } catch (leadSyncErr) {
          console.warn('Leads status sync note:', leadSyncErr);
        }
      } catch (dbErr) {
        console.error('Supabase status toggle sync error:', dbErr);
      }
    }
  };

  const handlePlanChange = async (clientId, newPlanId) => {
    // 1. Asynchronously update Supabase if configured
    if (isSupabaseConfigured() && supabase) {
      try {
        await supabase.from('businesses').update({ plan_id: newPlanId }).eq('id', clientId);
        try {
          await supabase.from('subscriptions').update({ plan_id: newPlanId }).eq('business_id', clientId);
        } catch {}
      } catch (err) {
        console.warn('Plan change Supabase error:', err);
      }
    }

    // 2. Update React state & admin clients cache
    const updated = clients.map((c) => (c.id === clientId ? { ...c, planId: newPlanId } : c));
    persistClients(updated);

    // 3. Update review_assist_businesses cache so dashboard immediately resolves the new plan
    try {
      const rawBiz = localStorage.getItem('review_assist_businesses');
      if (rawBiz) {
        const storedBiz = JSON.parse(rawBiz);
        if (storedBiz[clientId]) {
          storedBiz[clientId].planId = newPlanId;
          storedBiz[clientId].plan_id = newPlanId;
          localStorage.setItem('review_assist_businesses', JSON.stringify(storedBiz));
        }
      }
      const rawAltBiz = localStorage.getItem('reviewassist_businesses');
      if (rawAltBiz) {
        const altBiz = JSON.parse(rawAltBiz);
        if (altBiz[clientId]) {
          altBiz[clientId].planId = newPlanId;
          altBiz[clientId].plan_id = newPlanId;
          localStorage.setItem('reviewassist_businesses', JSON.stringify(altBiz));
        }
      }
    } catch (e) {
      console.warn('Could not update stored businesses for plan change:', e);
    }

    // 4. Update review_assist_subscriptions cache
    try {
      const rawSubs = localStorage.getItem('review_assist_subscriptions');
      const subs = rawSubs ? JSON.parse(rawSubs) : {};
      subs[clientId] = {
        ...(subs[clientId] || {}),
        businessId: clientId,
        planId: newPlanId,
      };
      localStorage.setItem('review_assist_subscriptions', JSON.stringify(subs));
    } catch (e) {
      console.warn('Could not update stored subscriptions for plan change:', e);
    }

    // 5. Update reviewassist_current_user if the logged-in user belongs to this client
    try {
      const rawUser = localStorage.getItem('reviewassist_current_user');
      if (rawUser) {
        const u = JSON.parse(rawUser);
        if (u.businessId === clientId) {
          u.planId = newPlanId;
          localStorage.setItem('reviewassist_current_user', JSON.stringify(u));
        }
      }
    } catch {}

    // 6. Broadcast sync event across tabs / active views
    try {
      window.dispatchEvent(
        new CustomEvent('reviewassist:admin_sync', {
          detail: { businessId: clientId, planId: newPlanId, type: 'plan_changed' },
        })
      );
      window.dispatchEvent(new Event('storage'));
      if (typeof BroadcastChannel !== 'undefined') {
        const bc = new BroadcastChannel('reviewassist_channel');
        bc.postMessage({ type: 'plan_changed', businessId: clientId, planId: newPlanId });
        bc.close();
      }
    } catch {}

    const planName = PLAN_OPTIONS.find((p) => p.id === newPlanId)?.name || newPlanId;
    showToast(`💎 Assigned ${planName} plan.`);
  };

  const handlePaidUntilChange = async (clientId, newDate) => {
    const isNowExpired = isPaidExpired(newDate);
    const subStatusVal = isNowExpired ? 'canceled' : 'active';
    const newStatus = isNowExpired ? 'inactive' : 'active';
    const updated = clients.map((c) => {
      if (c.id === clientId) {
        return {
          ...c,
          paidUntil: newDate,
          status: newStatus,
          subscriptionStatus: subStatusVal,
        };
      }
      return c;
    });
    persistClients(updated);

    if (isSupabaseConfigured() && supabase) {
      try {
        await supabase
          .from('businesses')
          .update({
            subscription_status: subStatusVal,
          })
          .eq('id', clientId);
      } catch (err) {
        console.warn('PaidUntil Supabase sync error:', err);
      }
    }

    showToast(`📅 Renewal date updated to ${newDate}.`);
  };

  const handleActivateMember = async (clientId) => {
    if (isSupabaseConfigured() && supabase) {
      try {
        await supabase.from('businesses').update({ subscription_status: 'active' }).eq('id', clientId);
        try {
          await supabase.from('subscriptions').update({ status: 'active' }).eq('business_id', clientId);
        } catch {}
        try {
          const { data: leadRec } = await supabase.from('leads').select('message').eq('id', `cred-${clientId}`).maybeSingle();
          if (leadRec && leadRec.message) {
            let parsed = {};
            try { parsed = JSON.parse(leadRec.message); } catch {}
            parsed.status = 'active';
            parsed.subscriptionStatus = 'active';
            parsed.isInactive = false;
            parsed.updatedAt = new Date().toISOString();
            await supabase.from('leads').update({ message: JSON.stringify(parsed) }).eq('id', `cred-${clientId}`);
          }
        } catch {}
      } catch (err) {
        console.warn('Activate member Supabase error:', err);
      }
    }
    const updated = clients.map((c) =>
      c.id === clientId ? { ...c, status: 'active', subscriptionStatus: 'active' } : c
    );
    persistClients(updated);
    showToast(`✅ User converted to Active Member!`);
  };

  const handlePrepareClientDashboard = (client) => {
    if (!client || !client.id) return;
    try {
      // 1. Ensure business is saved with all latest details
      const rawBiz = localStorage.getItem('review_assist_businesses');
      const storedBiz = rawBiz ? JSON.parse(rawBiz) : {};
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      storedBiz[client.id] = {
        id: client.id,
        name: client.businessName,
        businessName: client.businessName,
        category: client.businessType || 'other',
        services: Array.isArray(client.services) ? client.services : ['General Service'],
        email: client.email || '',
        phone: client.phone || '',
        googleReviewUrl: client.googleReviewUrl || `https://www.google.com/search?q=${encodeURIComponent(client.businessName + ' Google Reviews')}`,
        planId: client.planId || 'starter',
        status: isClientInactive(client) ? 'inactive' : (client.status === 'trial' ? 'trial' : 'active'),
        subscriptionStatus: isClientInactive(client) ? 'canceled' : (client.subscriptionStatus || 'active'),
        paidUntil: client.paidUntil || null,
        logoUrl: client.logoUrl || '',
        tagline: client.tagline || 'Scan to Share Your Review',
        shareableUrl: `${origin}/review/${client.id}`,
        dashboardUrl: `${origin}/dashboard/${client.id}`,
      };
      localStorage.setItem('review_assist_businesses', JSON.stringify(storedBiz));
      localStorage.setItem('reviewassist_businesses', JSON.stringify(storedBiz));

      // 2. Ensure subscription is saved with client's actual plan
      const rawSubs = localStorage.getItem('review_assist_subscriptions');
      const subs = rawSubs ? JSON.parse(rawSubs) : {};
      subs[client.id] = {
        businessId: client.id,
        planId: client.planId || 'starter',
        status: isClientInactive(client) ? 'inactive' : (client.subscriptionStatus || 'active'),
        billingInterval: 'monthly',
        amount: client.planId === 'starter' ? 299 : client.planId === 'enterprise' ? 799 : 499,
        currentPeriodEnd: client.paidUntil || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        aiGenerationsUsed: client.reviewsGenerated || 0,
        whatsappInvitesUsed: 0,
      };
      localStorage.setItem('review_assist_subscriptions', JSON.stringify(subs));
      localStorage.setItem('reviewassist_admin_viewing_biz', client.id);
    } catch (err) {
      console.warn('Dashboard prepare notice:', err);
    }
  };

  const handleDismissLead = (leadId) => {
    const updated = leads.filter((l) => l.id !== leadId);
    persistLeads(updated);
    showToast('Inquiry removed.');
  };

  // ── Filter & count ─────────────────────────────────────────────────────────
  const filteredClients = clients.filter((c) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      (c.businessName || '').toLowerCase().includes(q) ||
      (c.ownerName || '').toLowerCase().includes(q) ||
      (c.email || '').toLowerCase().includes(q);
    if (!matchSearch) return false;

    const inactive = isClientInactive(c);
    if (statusFilter === 'all') return true;
    if (statusFilter === 'inactive') return inactive;
    if (statusFilter === 'member') return !inactive && (c.status === 'active' || c.subscriptionStatus === 'active' || c.subscription_status === 'active');
    if (statusFilter === 'trial') return !inactive && (c.status === 'trial' || c.status === 'trialing' || c.subscriptionStatus === 'trialing' || c.subscription_status === 'trialing');
    return false;
  });

  const filteredLeads = leads.filter((l) => {
    const q = search.toLowerCase();
    return (
      !q ||
      (l.businessName || '').toLowerCase().includes(q) ||
      (l.ownerName || '').toLowerCase().includes(q) ||
      (l.email || '').toLowerCase().includes(q) ||
      (l.phone || '').includes(q)
    );
  });

  const counts = {
    all: clients.length,
    inactive: clients.filter((c) => isClientInactive(c)).length,
    member: clients.filter((c) => {
      if (isClientInactive(c)) return false;
      const s = c.status || c.subscriptionStatus || c.subscription_status || '';
      return s === 'active';
    }).length,
    trial: clients.filter((c) => {
      if (isClientInactive(c)) return false;
      const s = c.status || c.subscriptionStatus || c.subscription_status || '';
      return s === 'trial' || s === 'trialing';
    }).length,
    inquiries: leads.filter((l) => l.status === 'new' || l.status === 'pending').length,
  };

  return (
    <div className="admin-clients-page">
      {toastMsg && <div className="admin-toast">{toastMsg}</div>}

      {/* Page Header */}
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Clients, Trials & Leads</h1>
          <p className="admin-page-subtitle">
            Real-time view of all signups — free trial users, active paid members, and website inquiries (leads).
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            type="button"
            className="admin-btn-secondary"
            onClick={loadData}
            title="Refresh from Supabase"
          >
            🔄 Refresh
          </button>
          <Link to="/admin/qr-builder" className="admin-btn-primary">
            + Onboard New Client
          </Link>
        </div>
      </div>

      {/* Summary Stats Row — Clickable Filter Chips */}
      <div className="admin-clients-stats-row">
        <div
          className={`admin-stat-chip total ${statusFilter === 'all' ? 'chip-active' : ''}`}
          onClick={() => setStatusFilter('all')}
          style={{ cursor: 'pointer' }}
          title="Filter: All Clients"
        >
          <span className="stat-chip-val">{counts.all}</span>
          <span className="stat-chip-label">Total Signups</span>
        </div>
        <div
          className={`admin-stat-chip member ${statusFilter === 'member' ? 'chip-active' : ''}`}
          onClick={() => setStatusFilter('member')}
          style={{ cursor: 'pointer' }}
          title="Filter: Active Members"
        >
          <span className="stat-chip-val">{counts.member}</span>
          <span className="stat-chip-label">✅ Active Members</span>
        </div>
        <div
          className={`admin-stat-chip trial ${statusFilter === 'trial' ? 'chip-active' : ''}`}
          onClick={() => setStatusFilter('trial')}
          style={{ cursor: 'pointer' }}
          title="Filter: Free Trial Users"
        >
          <span className="stat-chip-val">{counts.trial}</span>
          <span className="stat-chip-label">🎁 Free Trial Users</span>
        </div>
        <div
          className={`admin-stat-chip inactive ${statusFilter === 'inactive' ? 'chip-active' : ''}`}
          onClick={() => setStatusFilter('inactive')}
          style={{ cursor: 'pointer' }}
          title="Filter: Inactive Clients"
        >
          <span className="stat-chip-val">{counts.inactive}</span>
          <span className="stat-chip-label">⛔ Inactive</span>
        </div>
        <div
          className={`admin-stat-chip leads ${statusFilter === 'inquiries' ? 'chip-active' : ''}`}
          onClick={() => setStatusFilter('inquiries')}
          style={{ cursor: 'pointer' }}
          title="Filter: Website Inquiries"
        >
          <span className="stat-chip-val">{counts.inquiries}</span>
          <span className="stat-chip-label">📬 New Leads</span>
        </div>
      </div>

      {/* Toolbar */}
      <div className="admin-clients-toolbar">
        <input
          type="text"
          className="admin-search-input"
          placeholder="🔍 Search clients, trials, or leads..."
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
              {s === 'all' ? '👥 All'
                : s === 'member' ? '✅ Members'
                : s === 'trial' ? '🎁 Free Trial'
                : s === 'inactive' ? '⛔ Inactive'
                : '📬 Inquiries'}
              <span
                className={`admin-filter-count ${
                  s === 'inquiries' && counts.inquiries > 0 ? 'badge-pulse' : ''
                } ${s === 'trial' && counts.trial > 0 ? 'badge-trial-pulse' : ''}`}
              >
                {counts[s]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="admin-loading-state">
          <div className="admin-loading-spinner" />
          <p>Loading clients from database...</p>
        </div>
      )}

      {/* =====================================================================
          VIEW 1: INQUIRIES / LEADS TAB
          ===================================================================== */}
      {!loading && statusFilter === 'inquiries' && (
        <div className="admin-leads-section animate-fade-in">
          <div className="admin-section-banner">
            <div>
              <h3>📬 Website Inquiries & Leads</h3>
              <p>
                Visitors who filled the "Get QR Code" contact form. Every inquiry is a potential paying client.
              </p>
            </div>
            <span className="leads-pending-tag">
              {counts.inquiries} New Lead{counts.inquiries !== 1 ? 's' : ''}
            </span>
          </div>

          <div className="admin-leads-grid">
            {filteredLeads.map((lead) => {
              const waText = encodeURIComponent(
                `Hi ${lead.ownerName || 'there'}, thank you for requesting ReviewAssist QR standees for "${lead.businessName}". I'd love to activate your review portal today!`
              );
              const cleanPhone = (lead.phone || '').replace(/[^0-9]/g, '');
              return (
                <div key={lead.id} className="admin-lead-card">
                  <div className="lead-card-header">
                    <div className="lead-biz-avatar">{(lead.businessName?.[0] || '🏢').toUpperCase()}</div>
                    <div className="lead-header-meta">
                      <h4 className="lead-biz-name">{lead.businessName}</h4>
                      <span className="lead-biz-type">{lead.businessType || 'Local Business'}</span>
                    </div>
                    <span className={`lead-status-pill ${lead.status === 'done' ? 'lead-done' : ''}`}>
                      {lead.status === 'done' ? '✅ Converted' : '⚡ New Lead'}
                    </span>
                  </div>

                  <div className="lead-details-grid">
                    <div className="lead-detail-item">
                      <span className="lead-detail-label">👤 Owner:</span>
                      <span className="lead-detail-val">{lead.ownerName}</span>
                    </div>
                    <div className="lead-detail-item">
                      <span className="lead-detail-label">📞 Phone:</span>
                      <a href={`tel:${lead.phone}`} className="lead-phone-link">{lead.phone}</a>
                    </div>
                    <div className="lead-detail-item">
                      <span className="lead-detail-label">📧 Email:</span>
                      <a href={`mailto:${lead.email}`} className="lead-email-link">{lead.email}</a>
                    </div>
                    <div className="lead-detail-item">
                      <span className="lead-detail-label">📍 Locations:</span>
                      <span className="lead-detail-val">{lead.locations || '1 location'}</span>
                    </div>
                  </div>

                  {lead.services && lead.services.length > 0 && (
                    <div className="lead-services-pills-wrap">
                      <span className="lead-services-title">🛠️ Services Offered:</span>
                      <div className="lead-services-pills">
                        {lead.services.map((srv, idx) => (
                          <span key={idx} className="lead-service-pill">
                            {srv}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {lead.message && (
                    <div className="lead-message-box">
                      <span className="lead-message-title">Client Note:</span>
                      <p className="lead-message-text">"{lead.message}"</p>
                    </div>
                  )}

                  <div className="lead-date-row">
                    <span>
                      Received:{' '}
                      {new Date(lead.createdAt || lead.created_at).toLocaleDateString('en-IN', {
                        month: 'short', day: 'numeric', year: 'numeric',
                      })}
                    </span>
                  </div>

                  <div className="lead-actions-bar">
                    <Link
                      to={`/admin/qr-builder?name=${encodeURIComponent(lead.businessName)}&owner=${encodeURIComponent(lead.ownerName)}&email=${encodeURIComponent(lead.email)}&phone=${encodeURIComponent(lead.phone || '')}&bizType=${encodeURIComponent(lead.businessType || '')}&services=${encodeURIComponent((Array.isArray(lead.services) && lead.services.length > 0 && !isGenericOrEmptyServices(lead.services)) ? lead.services.join(',') : getCategoryServices(lead.businessType || lead.rawCategory || '').join(','))}&google=${encodeURIComponent(lead.googleProfileUrl || lead.google_profile_url || '')}&leadId=${lead.id}`}
                      className="btn-convert-lead"
                    >
                      ⚡ Convert to Client &amp; Make QR
                    </Link>
                    {cleanPhone && (
                      <a
                        href={`https://wa.me/${cleanPhone}?text=${waText}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-whatsapp-lead-admin"
                      >
                        💬 WhatsApp
                      </a>
                    )}
                    <button
                      type="button"
                      className="btn-dismiss-lead"
                      onClick={() => handleDismissLead(lead.id)}
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
              <p>No new inquiries yet. Once visitors fill the contact form, they'll appear here.</p>
            </div>
          )}
        </div>
      )}

      {/* =====================================================================
          VIEW 2: CLIENTS GRID (Members + Trial Users + Inactive)
          ===================================================================== */}
      {!loading && statusFilter !== 'inquiries' && (
        <>
          {/* Trial Users Notice */}
          {(statusFilter === 'all' || statusFilter === 'trial') && counts.trial > 0 && (
            <div className="admin-trial-notice-bar">
              <span>🎁</span>
              <span>
                <strong>{counts.trial} user{counts.trial > 1 ? 's are' : ' is'} on a free 7-day trial.</strong>{' '}
                When they're ready to pay, click <em>"Activate as Member"</em> to convert them instantly.
              </span>
            </div>
          )}

          <div className="admin-clients-grid">
            {filteredClients.map((client) => {
              const clientType = getClientType(client);
              const expired = isPaidExpired(client.paidUntil);
              const days = daysUntil(client.paidUntil);
              const currentPlan = PLAN_OPTIONS.find((p) => p.id === (client.planId || 'starter')) || PLAN_OPTIONS[0];

              return (
                <div
                  key={client.id}
                  className={`admin-client-card ${
                    isClientInactive(client) ? 'client-card-inactive' : ''
                  } ${clientType === 'trial' ? 'client-card-trial' : ''}`}
                >
                  <div className="admin-client-card-header">
                    <div className={`admin-client-avatar ${isClientInactive(client) ? 'avatar-inactive' : clientType === 'trial' ? 'avatar-trial' : ''}`}>
                      {(client.businessName?.[0] || '?').toUpperCase()}
                    </div>
                    <div className="admin-client-header-info">
                      <div className="admin-client-name">{client.businessName}</div>
                      <div className="admin-client-type">{client.businessType}</div>
                    </div>
                    <ClientTypeBadge clientType={clientType} />
                  </div>

                  {/* Payment/trial bar */}
                  {client.paidUntil ? (
                    <div className={`client-payment-bar ${
                      expired ? 'payment-expired'
                      : days !== null && days <= 7 ? 'payment-warning'
                      : 'payment-ok'
                    }`}>
                      {expired
                        ? <span>⚠️ Service expired on {client.paidUntil}</span>
                        : days !== null && days <= 7
                        ? <span>⏰ Renewal due in {days} day{days !== 1 ? 's' : ''} ({client.paidUntil})</span>
                        : <span>💳 Paid until {client.paidUntil} ({days} days remaining)</span>
                      }
                    </div>
                  ) : clientType === 'trial' ? (
                    <div className="client-payment-bar payment-trial">
                      <span>🎁 Free 7-day trial — pending payment activation</span>
                    </div>
                  ) : null}

                  {/* Billing Controls */}
                  <div className="admin-external-billing-controls">
                    <div className="admin-control-field">
                      <label className="admin-field-label">Plan Tier</label>
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
                      <label className="admin-field-label">Paid Until</label>
                      <input
                        type="date"
                        className="admin-field-date"
                        value={client.paidUntil || ''}
                        onChange={(e) => handlePaidUntilChange(client.id, e.target.value)}
                        title="Set renewal date after receiving offline payment"
                      />
                    </div>
                  </div>

                  {/* Client Details */}
                  <div className="admin-client-details">
                    <div className="admin-client-detail-row">
                      <span className="admin-client-detail-icon">📧</span>
                      <a href={`mailto:${client.email}`} className="admin-client-link">
                        {client.email || '—'}
                      </a>
                    </div>
                    {client.phone && (
                      <div className="admin-client-detail-row">
                        <span className="admin-client-detail-icon">📞</span>
                        <a href={`tel:${client.phone}`} className="admin-client-link">
                          {client.phone}
                        </a>
                      </div>
                    )}
                    <div className="admin-client-detail-row">
                      <span className="admin-client-detail-icon">📅</span>
                      <span>
                        Signed up:{' '}
                        {client.createdAt
                          ? new Date(client.createdAt).toLocaleDateString('en-IN', {
                              month: 'short', day: 'numeric', year: 'numeric',
                            })
                          : '—'}
                      </span>
                    </div>
                    {client.qrSentAt && (
                      <div className="admin-client-detail-row">
                        <span className="admin-client-detail-icon">🔲</span>
                        <span>QR generated: {client.qrSentAt}</span>
                      </div>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="admin-client-stat-bar">
                    <div className="admin-client-stat">
                      <div className="admin-client-stat-val">{client.reviewsGenerated || 0}</div>
                      <div className="admin-client-stat-label">AI Reviews</div>
                    </div>
                    <div className="admin-client-stat">
                      <div className="admin-client-stat-val">{client.locations || 1}</div>
                      <div className="admin-client-stat-label">Location(s)</div>
                    </div>
                    <div className="admin-client-stat">
                      <div className="admin-client-stat-val">{currentPlan.name}</div>
                      <div className="admin-client-stat-label">Plan</div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="admin-client-card-actions">
                    <button
                      type="button"
                      className="admin-btn-xs admin-btn-edit-details"
                      onClick={() => handleOpenEditModal(client)}
                      title="Edit business profile, services, review URL, and login password"
                    >
                      ✏️ Edit Details
                    </button>
                    <button
                      type="button"
                      className="admin-btn-xs admin-btn-wa-creds"
                      onClick={() => handleShareCredentialsWhatsApp(client)}
                      title="Send dashboard login link, email, and password via WhatsApp"
                    >
                      💬 WhatsApp Login
                    </button>
                    <a href={`/review/${client.id}`} target="_blank" rel="noreferrer" className="admin-btn-xs">
                      📱 Review Page
                    </a>
                    <Link
                      to={`/admin/qr-builder?name=${encodeURIComponent(client.businessName)}&bizId=${client.id}&email=${encodeURIComponent(client.email)}&phone=${encodeURIComponent(client.phone || '')}&bizType=${encodeURIComponent(client.category || client.businessType || '')}&services=${encodeURIComponent((Array.isArray(client.services) && client.services.length > 0 && !isGenericOrEmptyServices(client.services)) ? client.services.join(',') : getCategoryServices(client.category || client.businessType || '').join(','))}&google=${encodeURIComponent(client.googleReviewLink || client.google_review_link || client.googleReviewUrl || '')}&planId=${client.planId || 'pro'}`}
                      className="admin-btn-xs"
                    >
                      🔲 Standee QR
                    </Link>
                    <a
                      href={`/dashboard/${client.id}?admin=1`}
                      target="_blank"
                      rel="noreferrer"
                      className="admin-btn-xs"
                      onClick={() => handlePrepareClientDashboard(client)}
                      title="Open client's interactive workspace dashboard in administrative preview"
                    >
                      📊 Dashboard
                    </a>
                  </div>

                  {/* Always allow Deactivate or Reactivate for ANY client */}
                  {client.status !== 'setup' && (
                    <button
                      type="button"
                      className={`client-toggle-btn ${
                        isClientInactive(client)
                          ? 'btn-reactivate'
                          : 'btn-deactivate'
                      }`}
                      onClick={() => handleToggleStatus(client)}
                    >
                      {isClientInactive(client)
                        ? '✅ Reactivate Service'
                        : '⛔ Deactivate Service'}
                    </button>
                  )}

                  {/* For trial users, also offer the convert to paid member shortcut */}
                  {clientType === 'trial' && !isClientInactive(client) && (
                    <button
                      type="button"
                      className="client-toggle-btn btn-activate-member"
                      style={{ marginTop: '6px' }}
                      onClick={() => handleActivateMember(client.id)}
                    >
                      💎 Convert to Active Paid Member
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {filteredClients.length === 0 && !loading && (
            <div className="admin-empty-state">
              {counts.all === 0 ? (
                <>
                  <span>🚀</span>
                  <p>
                    <strong>No clients yet — ready for launch!</strong><br />
                    Once users sign up via the website, they'll appear here automatically.
                  </p>
                </>
              ) : (
                <>
                  <span>🏢</span>
                  <p>No clients match your current filter.</p>
                </>
              )}
            </div>
          )}
        </>
      )}

      {/* ═════════════════════════════════════════════════════════════════
          EDIT CLIENT & CREDENTIALS MODAL
          ═════════════════════════════════════════════════════════════════ */}
      {editingClient && (
        <div className="admin-edit-modal-backdrop" onClick={() => !savingEdit && setEditingClient(null)}>
          <div className="admin-edit-modal-dialog" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="admin-edit-modal-header">
              <div className="admin-edit-modal-title-group">
                <div className="admin-edit-avatar">
                  {(editForm.businessName?.[0] || '🏢').toUpperCase()}
                </div>
                <div>
                  <h3 className="admin-edit-title">Edit Client Details &amp; Login Access</h3>
                  <p className="admin-edit-subtitle">
                    Update business profile, Google review link, and manage dashboard credentials.
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="admin-edit-close-btn"
                onClick={() => !savingEdit && setEditingClient(null)}
                title="Close modal"
              >
                ✕
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveEdit} className="admin-edit-modal-form">
              <div className="admin-edit-modal-body">
                {/* SECTION 1: BUSINESS & OWNER */}
                <div className="admin-edit-section">
                  <div className="admin-edit-section-header">
                    <span className="admin-edit-section-icon">🏢</span>
                    <span className="admin-edit-section-title">Business &amp; Contact Profile</span>
                  </div>
                  <div className="admin-edit-grid-2">
                    <div className="admin-edit-field">
                      <label className="admin-edit-label">
                        Business Name <span className="req-star">*</span>
                      </label>
                      <input
                        type="text"
                        className="admin-edit-input"
                        value={editForm.businessName}
                        onChange={(e) => setEditForm({ ...editForm, businessName: e.target.value })}
                        placeholder="e.g. Apex Auto Care & Diagnostics"
                        required
                      />
                    </div>
                    <div className="admin-edit-field">
                      <label className="admin-edit-label">Owner / Contact Name</label>
                      <input
                        type="text"
                        className="admin-edit-input"
                        value={editForm.ownerName}
                        onChange={(e) => setEditForm({ ...editForm, ownerName: e.target.value })}
                        placeholder="e.g. Marcus Vance"
                      />
                    </div>
                  </div>

                  <div className="admin-edit-grid-2">
                    <div className="admin-edit-field">
                      <label className="admin-edit-label">Business Category</label>
                      <select
                        className="admin-edit-select"
                        value={editForm.category}
                        onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                      >
                        {EDIT_CATEGORY_OPTIONS.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="admin-edit-field">
                      <label className="admin-edit-label">Phone / WhatsApp Number</label>
                      <input
                        type="tel"
                        className="admin-edit-input"
                        value={editForm.phone}
                        onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                        placeholder="e.g. +91 98765 43210"
                      />
                    </div>
                  </div>

                  <div className="admin-edit-field">
                    <label className="admin-edit-label">
                      Services Offered <span className="admin-label-hint">(comma separated)</span>
                    </label>
                    <input
                      type="text"
                      className="admin-edit-input"
                      value={editForm.services}
                      onChange={(e) => setEditForm({ ...editForm, services: e.target.value })}
                      placeholder="e.g. Oil Change, Brake Pad Replacement, Engine Diagnostic"
                    />
                  </div>
                </div>

                {/* SECTION 2: DASHBOARD LOGIN CREDENTIALS */}
                <div className="admin-edit-section admin-edit-creds-section">
                  <div className="admin-edit-section-header">
                    <span className="admin-edit-section-icon">🔐</span>
                    <div style={{ flex: 1 }}>
                      <span className="admin-edit-section-title">Dashboard Login Credentials</span>
                      <p className="admin-edit-section-sub">
                        The shop owner signs in at <code>/login</code> using this email and password to access their reviews.
                      </p>
                    </div>
                  </div>

                  <div className="admin-edit-grid-2">
                    <div className="admin-edit-field">
                      <label className="admin-edit-label">
                        Login Email Address <span className="req-star">*</span>
                      </label>
                      <input
                        type="email"
                        className="admin-edit-input"
                        value={editForm.email}
                        onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                        placeholder="owner@business.com"
                        required
                      />
                    </div>

                    <div className="admin-edit-field">
                      <div className="admin-field-header-row">
                        <label className="admin-edit-label">Dashboard Password</label>
                        <button
                          type="button"
                          className="admin-text-btn"
                          onClick={() => setShowEditPassword(!showEditPassword)}
                        >
                          {showEditPassword ? 'Hide 👁️' : 'Show 👁️'}
                        </button>
                      </div>
                      <div className="admin-input-with-actions">
                        <input
                          type={showEditPassword ? 'text' : 'password'}
                          className="admin-edit-input"
                          value={editForm.password}
                          onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                          placeholder="Account password"
                        />
                        <button
                          type="button"
                          className="admin-input-action-btn"
                          onClick={handleGenerateRandomPassword}
                          title="Generate a secure random password"
                        >
                          🎲 Generate
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Credential Action Shortcuts */}
                  <div className="admin-creds-quick-bar">
                    <button
                      type="button"
                      className="admin-creds-btn"
                      onClick={() => handleCopyCredentials()}
                    >
                      {copyFeedback ? '✅ Copied!' : '📋 Copy Login Details'}
                    </button>
                    <button
                      type="button"
                      className="admin-creds-btn admin-creds-btn-wa"
                      onClick={() => handleShareCredentialsWhatsApp(editForm)}
                    >
                      💬 Send Credentials via WhatsApp
                    </button>
                  </div>
                </div>

                {/* SECTION 3: GOOGLE REVIEW LINK */}
                <div className="admin-edit-section">
                  <div className="admin-edit-section-header">
                    <span className="admin-edit-section-icon">⭐</span>
                    <span className="admin-edit-section-title">Google Review Link</span>
                  </div>
                  <div className="admin-edit-field">
                    <label className="admin-edit-label">Google Maps Review Link</label>
                    <input
                      type="url"
                      className="admin-edit-input"
                      value={editForm.googleReviewUrl}
                      onChange={(e) => setEditForm({ ...editForm, googleReviewUrl: e.target.value })}
                      placeholder="https://search.google.com/local/writereview?placeid=..."
                    />
                    <span className="admin-field-help">
                      High rating (4★ &amp; 5★) scans redirect straight to this Google link. If empty, a search link will be generated.
                    </span>
                  </div>
                </div>

                {/* SECTION 4: SUBSCRIPTION, STATUS & RENEWAL */}
                <div className="admin-edit-section">
                  <div className="admin-edit-section-header">
                    <span className="admin-edit-section-icon">💳</span>
                    <span className="admin-edit-section-title">Subscription &amp; Service Status</span>
                  </div>
                  <div className="admin-edit-grid-3">
                    <div className="admin-edit-field">
                      <label className="admin-edit-label">Plan Tier</label>
                      <select
                        className="admin-edit-select"
                        value={editForm.planId}
                        onChange={(e) => setEditForm({ ...editForm, planId: e.target.value })}
                      >
                        {PLAN_OPTIONS.map((opt) => (
                          <option key={opt.id} value={opt.id}>
                            💎 {opt.name} ({opt.price})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="admin-edit-field">
                      <label className="admin-edit-label">Service Status</label>
                      <select
                        className="admin-edit-select"
                        value={editForm.status}
                        onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                      >
                        <option value="active">✅ Active (Live)</option>
                        <option value="trial">🎁 Free 7-Day Trial</option>
                        <option value="inactive">⛔ Inactive (Paused)</option>
                      </select>
                    </div>

                    <div className="admin-edit-field">
                      <label className="admin-edit-label">Paid Until (Renewal Date)</label>
                      <input
                        type="date"
                        className="admin-edit-input"
                        value={editForm.paidUntil || ''}
                        onChange={(e) => setEditForm({ ...editForm, paidUntil: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                {/* SECTION 5: BRANDING */}
                <div className="admin-edit-section">
                  <div className="admin-edit-section-header">
                    <span className="admin-edit-section-icon">🎨</span>
                    <span className="admin-edit-section-title">Standee &amp; Review Branding</span>
                  </div>
                  <div className="admin-edit-grid-2">
                    <div className="admin-edit-field">
                      <label className="admin-edit-label">Standee Tagline</label>
                      <input
                        type="text"
                        className="admin-edit-input"
                        value={editForm.tagline}
                        onChange={(e) => setEditForm({ ...editForm, tagline: e.target.value })}
                        placeholder="e.g. Scan to Share Your Review"
                      />
                    </div>
                    <div className="admin-edit-field">
                      <label className="admin-edit-label">Logo Image URL</label>
                      <input
                        type="url"
                        className="admin-edit-input"
                        value={editForm.logoUrl}
                        onChange={(e) => setEditForm({ ...editForm, logoUrl: e.target.value })}
                        placeholder="https://... (Optional)"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="admin-edit-modal-footer">
                <button
                  type="button"
                  className="btn-admin-cancel"
                  onClick={() => !savingEdit && setEditingClient(null)}
                  disabled={savingEdit}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-admin-save-primary"
                  disabled={savingEdit}
                >
                  {savingEdit ? '💾 Saving Updates...' : '💾 Save All Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
