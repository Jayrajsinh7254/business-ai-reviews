/**
 * API Client for review-assist
 * Seamlessly connects to Supabase backend when configured,
 * with fallback to local simulation for offline testing.
 */
import { supabase, isSupabaseConfigured } from '../lib/supabase.js';
import { getCategoryServices } from '../lib/categories.js';
import { sanitizeGoogleReviewUrl, generateSecurePassword } from '../lib/security.js';

/**
 * Validates whether a services array contains only generic placeholder strings
 */
export function isGenericOrEmptyServices(services) {
  if (!Array.isArray(services) || services.length === 0) return true;
  const genericSet = new Set([
    'general service',
    'customer support',
    'premium care',
    'customer service',
    'quality & value',
    'overall experience',
    'timely support',
    'standard service',
    'consultation',
    'custom project solution',
  ]);
  return services.every((s) => genericSet.has(String(s).trim().toLowerCase()));
}

/**
 * Resolves effective business services using explicit custom list or category presets
 */
export function resolveEffectiveServices(services, category, businessType) {
  if (Array.isArray(services) && services.length > 0 && !isGenericOrEmptyServices(services)) {
    return services;
  }
  if (typeof services === 'string' && services.trim()) {
    const parsed = services.split(',').map((s) => s.trim()).filter(Boolean);
    if (parsed.length > 0 && !isGenericOrEmptyServices(parsed)) {
      return parsed;
    }
  }
  return getCategoryServices(category || businessType);
}

const API_BASE_URL = import.meta.env?.VITE_API_BASE_URL || 'http://localhost:5000';

// In-memory / localStorage mock store for offline/standalone testing
const STORAGE_KEY_TOKEN = 'review_assist_token';
const STORAGE_KEY_BUSINESSES = 'review_assist_businesses';
const STORAGE_KEY_REVIEWS = 'review_assist_reviews';
const STORAGE_KEY_USERS = 'review_assist_users';
const STORAGE_KEY_SUBSCRIPTIONS = 'review_assist_subscriptions';
const STORAGE_KEY_TEAM = 'review_assist_team';

// Pre-seeded demo businesses with google_review_link configured for testing
const DEFAULT_BUSINESSES = {
  'demo-1': {
    id: 'demo-1',
    name: 'Apex Auto Care & Diagnostics',
    category: 'automobile',
    phone: '9537370561',
    services: ['Full Synthetic Oil Change', 'Brake Pad Replacement', 'Engine Diagnostic', 'Tire Rotation'],
    google_review_link: 'https://g.page/r/example/review',
    googleReviewLink: 'https://g.page/r/example/review',
    google_review_url: 'https://g.page/r/example/review',
    googleReviewUrl: 'https://g.page/r/example/review',
    status: 'active',
    subscriptionStatus: 'active',
    planId: 'pro',
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  'demo-2': {
    id: 'demo-2',
    name: 'Lumina Skin & Hair Studio',
    category: 'salon',
    phone: '9537370561',
    services: ['Haircut & Styling', 'Facial & Glow Therapy', 'Hair Spa', 'Keratin Treatment'],
    google_review_link: 'https://g.page/r/example/review',
    googleReviewLink: 'https://g.page/r/example/review',
    google_review_url: 'https://g.page/r/example/review',
    googleReviewUrl: 'https://g.page/r/example/review',
    status: 'active',
    subscriptionStatus: 'active',
    planId: 'pro',
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  'lakshmi-interior': {
    id: 'lakshmi-interior',
    name: 'Lakshmi Interior',
    category: 'interior',
    phone: '8528012365',
    address: 'Ck 55/25, Rajadarwaja',
    instagramUrl: 'https://www.instagram.com/lakshmi_interior_varanasi/',
    instagram_url: 'https://www.instagram.com/lakshmi_interior_varanasi/',
    websiteUrl: 'https://www.instagram.com/lakshmi_interior_varanasi/',
    website_url: 'https://www.instagram.com/lakshmi_interior_varanasi/',
    logoUrl: 'https://nzhlajxwpxvtcrjrygwv.supabase.co/storage/v1/object/public/logos/cb3ee9da-0c79-4570-8d3a-241f79c57416/79a64f5c-ff95-478c-a85a-4b79760ca3cf.png',
    logo_url: 'https://nzhlajxwpxvtcrjrygwv.supabase.co/storage/v1/object/public/logos/cb3ee9da-0c79-4570-8d3a-241f79c57416/79a64f5c-ff95-478c-a85a-4b79760ca3cf.png',
    services: [
      'PVC Panels',
      'Louvers',
      'Marble Sheets',
      '3D wall tiles',
      'mosaic tiles',
      'led mirror',
      'wallpaper',
      'upvc windows & doors',
      'charcoal panel',
      'fluted panel',
      'pu stone',
      'laminates',
      'mica',
      'ply'
    ],
    google_review_link: 'https://g.page/r/CRjGnJTCvAcbEAE/review',
    googleReviewLink: 'https://g.page/r/CRjGnJTCvAcbEAE/review',
    google_review_url: 'https://g.page/r/CRjGnJTCvAcbEAE/review',
    googleReviewUrl: 'https://g.page/r/CRjGnJTCvAcbEAE/review',
    status: 'active',
    subscriptionStatus: 'active',
    planId: 'pro',
    createdAt: '2026-01-01T00:00:00.000Z',
  },
};


// No users are pre-seeded client-side. All auth is handled server-side via Supabase.
const DEFAULT_USERS = [];


// Default subscriptions: empty — all data from real Supabase subscriptions
const DEFAULT_SUBSCRIPTIONS = {};

// Default team members: empty — loaded from Supabase per business
const DEFAULT_TEAM_MEMBERS = {};


// Reviews: no dummy data — all reviews come from real customer interactions
const DEFAULT_REVIEWS = {};


// Helper to get token
export function getToken() {
  try {
    return localStorage.getItem(STORAGE_KEY_TOKEN) || null;
  } catch {
    return null;
  }
}

// Helper to set token
export function setToken(token) {
  try {
    if (token) {
      localStorage.setItem(STORAGE_KEY_TOKEN, token);
    } else {
      localStorage.removeItem(STORAGE_KEY_TOKEN);
    }
  } catch (err) {
    console.warn('Could not store token:', err);
  }
}

// Helper to clear token
export function clearToken() {
  try {
    localStorage.removeItem(STORAGE_KEY_TOKEN);
  } catch (err) {
    console.warn('Could not clear token:', err);
  }
}

// Helper to get users from storage
function getStoredUsers() {
  try {
    const data = localStorage.getItem(STORAGE_KEY_USERS);
    return data ? JSON.parse(data) : DEFAULT_USERS;
  } catch {
    return DEFAULT_USERS;
  }
}

// Helper to save a user to storage
function saveStoredUser(user) {
  try {
    const users = getStoredUsers();
    const cleanEmail = user.email?.trim().toLowerCase();
    const idx = users.findIndex((u) =>
      (cleanEmail && u.email?.trim().toLowerCase() === cleanEmail) ||
      (user.businessId && u.businessId === user.businessId)
    );
    if (idx >= 0) {
      users[idx] = { ...users[idx], ...user };
    } else {
      users.push(user);
    }
    localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users));
  } catch (err) {
    console.warn('Could not save user to localStorage:', err);
  }
}

// Helper to get businesses from storage
function getStoredBusinesses() {
  try {
    const data = localStorage.getItem(STORAGE_KEY_BUSINESSES);
    return data ? { ...DEFAULT_BUSINESSES, ...JSON.parse(data) } : DEFAULT_BUSINESSES;
  } catch {
    return DEFAULT_BUSINESSES;
  }
}

// Helper to save businesses to storage
function saveStoredBusiness(biz) {
  try {
    const current = getStoredBusinesses();
    current[biz.id] = biz;
    localStorage.setItem(STORAGE_KEY_BUSINESSES, JSON.stringify(current));
  } catch (err) {
    console.warn('Could not save to localStorage:', err);
  }
}

// Helper to get reviews from storage
function getStoredReviews(businessId) {
  try {
    const data = localStorage.getItem(STORAGE_KEY_REVIEWS);
    const parsed = data ? JSON.parse(data) : {};
    return parsed[businessId] || DEFAULT_REVIEWS[businessId] || [];
  } catch {
    return DEFAULT_REVIEWS[businessId] || [];
  }
}

// Helper to save a review to storage
function saveStoredReview(review) {
  try {
    const data = localStorage.getItem(STORAGE_KEY_REVIEWS);
    const parsed = data ? JSON.parse(data) : { ...DEFAULT_REVIEWS };
    if (!parsed[review.businessId]) {
      parsed[review.businessId] = [];
    }
    parsed[review.businessId].unshift(review);
    localStorage.setItem(STORAGE_KEY_REVIEWS, JSON.stringify(parsed));
  } catch (err) {
    console.warn('Could not save review to localStorage:', err);
  }
}

// ── Negative Review Private Interceptor Storage ──────────────────
const STORAGE_KEY_PRIVATE_FEEDBACK = 'reviewassist_private_feedback';

// Private feedback: no dummy data — all feedback from real customers
const DEFAULT_PRIVATE_FEEDBACK = {};


function getStoredPrivateFeedback(businessId) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PRIVATE_FEEDBACK);
    const parsed = raw ? JSON.parse(raw) : {};
    if (businessId) {
      return parsed[businessId] || DEFAULT_PRIVATE_FEEDBACK[businessId] || [];
    }
    return parsed;
  } catch {
    return businessId ? DEFAULT_PRIVATE_FEEDBACK[businessId] || [] : {};
  }
}

function saveStoredPrivateFeedback(feedback) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PRIVATE_FEEDBACK);
    const parsed = raw ? JSON.parse(raw) : { ...DEFAULT_PRIVATE_FEEDBACK };
    if (!parsed[feedback.businessId]) {
      parsed[feedback.businessId] = [];
    }
    parsed[feedback.businessId].unshift(feedback);
    localStorage.setItem(STORAGE_KEY_PRIVATE_FEEDBACK, JSON.stringify(parsed));
  } catch (err) {
    console.warn('Could not save private feedback to localStorage:', err);
  }
}

import { generateMockDraft, selectDistinctDraft, recentDraftsHistory } from '../utils/reviewGenerator.js';
export { generateMockDraft, selectDistinctDraft, recentDraftsHistory };

/**
 * Safe fetch wrapper with automatic mock fallback if backend is unreachable
 */
async function fetchWithFallback(url, options = {}, mockHandler) {
  try {
    const response = await fetch(`${API_BASE_URL}${url}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
      ...options,
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { message: errorText || `HTTP error ${response.status}` };
      }
      const error = new Error(errorData.message || `Request failed with status ${response.status}`);
      error.status = response.status;
      throw error;
    }

    return await response.json();
  } catch (err) {
    if (err.status === 401 || err.status === 403) {
      throw err;
    }

    if (mockHandler) {
      await new Promise((r) => setTimeout(r, 350));
      return mockHandler();
    }
    throw err;
  }
}

/**
 * Helper to safely resolve a functional Google Review URL
 * If a custom Google Review link is provided, use it. Otherwise, generate a real Google search link.
 */
export function resolveGoogleReviewUrl(url, businessName) {
  if (
    url &&
    !url.includes('placeid=biz-') &&
    !url.includes('placeid=undefined') &&
    (url.startsWith('https://') || url.startsWith('http://'))
  ) {
    return url;
  }
  const query = encodeURIComponent((businessName || 'Local Business') + ' Google Reviews');
  return `https://www.google.com/search?q=${query}`;
}

/**
 * Validates that a Google review link:
 * - Starts with https://
 * - Matches one of: g.page/r/, search.google.com/local/writereview, google.com/maps, maps.app.goo.gl, goo.gl/maps, or share.google
 */
export function isValidGoogleReviewLink(url) {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (!trimmed.startsWith('https://')) return false;

  const validPatterns = [
    'g.page/r/',
    'search.google.com/local/writereview',
    'google.com/maps',
    'maps.app.goo.gl',
    'goo.gl/maps',
    'share.google',
  ];

  return validPatterns.some((pattern) => trimmed.includes(pattern));
}

export const STORAGE_KEY_ADMIN_CLIENTS = 'reviewassist_admin_clients';

/**
 * Checks if admin portal has modified or deactivated a client
 */
export function getAdminClientOverride(businessId) {
  try {
    if (typeof localStorage === 'undefined') return null;
    const raw = localStorage.getItem(STORAGE_KEY_ADMIN_CLIENTS);
    if (!raw) return null;
    const clients = JSON.parse(raw);
    if (Array.isArray(clients)) {
      return clients.find((c) => c.id === businessId) || null;
    }
  } catch (err) {
    console.warn('Could not read admin clients override:', err);
  }
  return null;
}

/**
 * Centralized, authoritative helper to determine if a business/client is inactive
 */
export function isBusinessInactive(bizOrId) {
  if (!bizOrId) return false;
  const id = typeof bizOrId === 'string' ? bizOrId : bizOrId.id;

  // 1. Direct admin client override check in localStorage (synchronous & instant)
  if (id) {
    const override = getAdminClientOverride(id);
    if (override) {
      if (
        override.status === 'inactive' ||
        override.subscriptionStatus === 'canceled' ||
        override.subscriptionStatus === 'inactive'
      ) {
        return true;
      }
      if (override.status === 'active' || override.subscriptionStatus === 'active') {
        return false;
      }
      if (override.paidUntil && new Date(override.paidUntil) < new Date()) {
        return true;
      }
    }
  }

  // 2. Direct object property check
  if (typeof bizOrId === 'object') {
    // If explicitly set to inactive or has canceled/inactive status
    if (bizOrId.isInactive === true) {
      return true;
    }
    if (
      bizOrId.status === 'inactive' ||
      bizOrId.subscription_status === 'inactive' ||
      bizOrId.subscription_status === 'canceled' ||
      bizOrId.subscriptionStatus === 'inactive' ||
      bizOrId.subscriptionStatus === 'canceled'
    ) {
      return true;
    }

    // If marked active or trialing
    if (
      bizOrId.status === 'active' ||
      bizOrId.subscription_status === 'active' ||
      bizOrId.subscription_status === 'trialing' ||
      bizOrId.subscriptionStatus === 'active' ||
      bizOrId.subscriptionStatus === 'trialing' ||
      bizOrId.isInactive === false
    ) {
      const paidDate = bizOrId.paid_until || bizOrId.paidUntil;
      if (paidDate && new Date(paidDate) < new Date()) {
        return true;
      }
      return false;
    }

    if (bizOrId.paid_until && new Date(bizOrId.paid_until) < new Date()) {
      return true;
    }
    if (bizOrId.paidUntil && new Date(bizOrId.paidUntil) < new Date()) {
      return true;
    }
  }

  // 3. Stored businesses cache check
  if (id) {
    try {
      const rawBiz = localStorage.getItem('review_assist_businesses');
      const allBiz = rawBiz ? JSON.parse(rawBiz) : {};
      if (allBiz[id]) {
        const b = allBiz[id];
        if (b.status === 'active' || b.subscriptionStatus === 'active' || b.isInactive === false) {
          return false;
        }
        if (
          b.isInactive === true ||
          b.status === 'inactive' ||
          b.subscriptionStatus === 'canceled' ||
          b.subscriptionStatus === 'inactive'
        ) {
          return true;
        }
      }
    } catch {}

    // 4. Stored subscriptions cache check
    try {
      const rawSubs = localStorage.getItem('review_assist_subscriptions');
      const allSubs = rawSubs ? JSON.parse(rawSubs) : {};
      if (allSubs[id]) {
        const s = allSubs[id];
        if (s.status === 'active' || s.isInactive === false) {
          return false;
        }
        if (s.status === 'canceled' || s.status === 'inactive') {
          return true;
        }
      }
    } catch {}
  }

  return false;
}

/**
 * Helper to format raw database business row to frontend format
 */
function formatBusinessRow(row) {
  if (!row) return null;
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const resolvedName = row.name || row.businessName || 'Business Dashboard';
  const rawGoogleUrl = row.google_review_link || row.googleReviewLink || row.google_review_url || row.googleReviewUrl;
  const validGoogleUrl = rawGoogleUrl ? rawGoogleUrl.trim() : resolveGoogleReviewUrl(null, resolvedName);

  let isInactive = false;
  if (row.subscription_status === 'canceled' || row.subscription_status === 'inactive' || row.status === 'inactive') {
    isInactive = true;
  } else if (row.subscription_status === 'active' || row.subscription_status === 'trialing') {
    isInactive = false;
  } else {
    isInactive = isBusinessInactive(row) || isBusinessInactive(row.id);
  }

  const resolvedCategory = row.category || row.businessType || 'other';
  const effectiveServices = resolveEffectiveServices(row.services, resolvedCategory, row.businessType);

  return {
    id: row.id,
    name: resolvedName,
    businessName: resolvedName,
    category: resolvedCategory,
    businessType: resolvedCategory,
    services: effectiveServices,
    email: row.email || '',
    phone: row.phone || '',
    logoUrl: row.logo_url || row.logoUrl || '',
    tagline: row.tagline || 'Scan to Share Your Review',
    address: row.address || '',
    websiteUrl: row.website_url || row.websiteUrl || '',
    instagramUrl: row.instagram_url || row.instagramUrl || '',
    facebookUrl: row.facebook_url || row.facebookUrl || '',
    youtubeUrl: row.youtube_url || row.youtubeUrl || '',
    shareableUrl: `${origin}/review/${row.id}`,
    dashboardUrl: `${origin}/dashboard/${row.id}`,
    google_review_link: validGoogleUrl,
    googleReviewLink: validGoogleUrl,
    googleReviewUrl: validGoogleUrl,
    createdAt: row.created_at || row.createdAt || new Date().toISOString(),
    status: isInactive ? 'inactive' : row.status || (row.subscription_status === 'active' ? 'active' : 'trial'),
    subscriptionStatus: isInactive ? 'canceled' : row.subscription_status || row.subscriptionStatus || 'trialing',
    isInactive,
    planId: row.plan_id || row.planId || 'starter',
    paidUntil: row.paid_until || row.paidUntil || null,
    aiCreditsUsed: row.ai_credits_used || row.aiCreditsUsed || 0,
    whatsappInvitesUsed: row.whatsapp_invites_used || row.whatsappInvitesUsed || 0,
  };
}

/**
 * API Methods
 */
export const api = {
  getBaseUrl() {
    if (isSupabaseConfigured()) {
      return import.meta.env.VITE_SUPABASE_URL;
    }
    return API_BASE_URL;
  },

  isSupabaseEnabled() {
    return isSupabaseConfigured();
  },

  isDemoMode() {
    return !isSupabaseConfigured();
  },

  getToken() {
    return getToken();
  },

  getCurrentUser() {
    if (isSupabaseConfigured()) {
      return null;
    }
    try {
      const data = localStorage.getItem('reviewassist_current_user');
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  setToken(token) {
    return setToken(token);
  },

  clearToken() {
    return clearToken();
  },

  isAuthenticated() {
    return Boolean(getToken());
  },

  /**
   * POST /api/auth/signup
   * Creates Supabase auth account + inserts row into `businesses` table
   */
  async signup({
    name,
    category,
    services,
    email,
    password,
    google_review_link,
    googleReviewLink,
    googleReviewUrl,
    planId = 'starter',
    billingInterval = 'monthly',
  }) {
    const chosenPlan = planId || 'starter';
    const rawGoogleUrl = (google_review_link || googleReviewLink || googleReviewUrl || '').trim();

    if (isSupabaseConfigured() && supabase) {
      let authUser = null;
      let token = null;

      try {
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
        });

        if (authError) {
          const isRateLimit =
            authError.message?.toLowerCase().includes('rate limit') ||
            authError.message?.toLowerCase().includes('email rate') ||
            authError.code === 'over_email_send_rate_limit';

          if (isRateLimit) {
            throw new Error('Supabase Auth email rate limit reached. Please wait and try again.');
          }
          throw new Error(authError.message);
        } else {
          authUser = authData.user;
          token = authData.session?.access_token || authData.user?.id;
        }
      } catch (authErr) {
        throw authErr;
      }

      const id = 'biz-' + Math.random().toString(36).substring(2, 9);
      const newBizRow = {
        id,
        user_id: authUser?.id || null,
        name: name.trim(),
        category,
        services: Array.isArray(services) ? services : [],
        email: email.trim(),
        google_review_link: rawGoogleUrl,
        google_review_url: rawGoogleUrl,
        plan_id: chosenPlan,
        subscription_status: 'trialing',
      };

      try {
        let insertedBiz = null;
        const { data, error } = await supabase
          .from('businesses')
          .insert([newBizRow])
          .select()
          .maybeSingle();

        if (error && error.message?.includes('google_review_link')) {
          const fallbackRow = { ...newBizRow };
          delete fallbackRow.google_review_link;
          const { data: fbData } = await supabase
            .from('businesses')
            .insert([fallbackRow])
            .select()
            .maybeSingle();
          insertedBiz = fbData;
        } else {
          insertedBiz = data;
        }

        const formattedBiz = formatBusinessRow(insertedBiz || newBizRow);
        const activeToken = token || `dev-token-${Date.now()}`;
        setToken(activeToken);
        saveStoredBusiness(formattedBiz);

        // Persist trial subscription for the chosen plan
        const trialSub = {
          businessId: id,
          planId: chosenPlan,
          status: 'trialing',
          billingInterval,
          amount: chosenPlan === 'starter' ? 299 : chosenPlan === 'pro' ? 499 : 799,
          currentPeriodEnd: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          trialStartedAt: new Date().toISOString(),
          aiGenerationsUsed: 0,
          whatsappInvitesUsed: 0,
          razorpayPaymentId: null,
          razorpayOrderId: null,
        };
        try {
          const rawSubs = localStorage.getItem(STORAGE_KEY_SUBSCRIPTIONS);
          const subs = rawSubs ? JSON.parse(rawSubs) : {};
          subs[id] = trialSub;
          localStorage.setItem(STORAGE_KEY_SUBSCRIPTIONS, JSON.stringify(subs));
        } catch {}

        // Sync to admin clients for instant visibility
        try {
          const raw = localStorage.getItem('reviewassist_admin_clients');
          const list = raw ? JSON.parse(raw) : [];
          if (!list.some((c) => c.id === id)) {
            list.unshift({
              id,
              businessName: name.trim(),
              ownerName: email.trim(),
              businessType: category || 'Local Business',
              email: email.trim(),
              phone: '',
              services: Array.isArray(services) ? services : [],
              locations: '1',
              reviewsGenerated: 0,
              status: 'trial',
              subscriptionStatus: 'trialing',
              planId: chosenPlan,
              qrSentAt: new Date().toISOString().split('T')[0],
              paidUntil: null,
              googleReviewUrl: rawGoogleUrl,
              createdAt: new Date().toISOString(),
            });
            localStorage.setItem('reviewassist_admin_clients', JSON.stringify(list));
          }
        } catch {}

        const userData = {
          email: email.trim(),
          name: name.trim(),
          businessId: id,
          role: 'business_owner',
        };
        try {
          localStorage.setItem('reviewassist_current_user', JSON.stringify(userData));
        } catch {}

        return {
          token: activeToken,
          business: formattedBiz,
          user: authUser || userData,
        };
      } catch (bizErr) {
        throw new Error(bizErr?.message || 'Supabase business onboarding failed. Please try again.');
      }
    }

    // Fallback Mock / REST
    const data = await fetchWithFallback(
      '/api/auth/signup',
      {
        method: 'POST',
        body: JSON.stringify({ name, category, services, email, password, googleReviewUrl, planId: chosenPlan, billingInterval }),
      },
      () => {
        const id = 'biz-' + Math.random().toString(36).substring(2, 9);
        const origin = typeof window !== 'undefined' ? window.location.origin : '';
        const newBiz = {
          id,
          name,
          category,
          services: Array.isArray(services) ? services : [],
          email,
          shareableUrl: `${origin}/review/${id}`,
          dashboardUrl: `${origin}/dashboard/${id}`,
          google_review_link: rawGoogleUrl,
          googleReviewLink: rawGoogleUrl,
          google_review_url: rawGoogleUrl,
          googleReviewUrl: rawGoogleUrl,
          createdAt: new Date().toISOString(),
          planId: chosenPlan,
          subscriptionStatus: 'trialing',
          status: 'trial',
        };
        saveStoredBusiness(newBiz);

        // Persist trial subscription for the chosen plan
        const trialSub = {
          businessId: id,
          planId: chosenPlan,
          status: 'trialing',
          billingInterval,
          amount: chosenPlan === 'starter' ? 299 : chosenPlan === 'pro' ? 499 : 799,
          currentPeriodEnd: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          trialStartedAt: new Date().toISOString(),
          aiGenerationsUsed: 0,
          whatsappInvitesUsed: 0,
          razorpayPaymentId: null,
          razorpayOrderId: null,
        };
        try {
          const rawSubs = localStorage.getItem(STORAGE_KEY_SUBSCRIPTIONS);
          const subs = rawSubs ? JSON.parse(rawSubs) : {};
          subs[id] = trialSub;
          localStorage.setItem(STORAGE_KEY_SUBSCRIPTIONS, JSON.stringify(subs));
        } catch {}

        // Sync to admin clients for instant visibility
        try {
          const raw = localStorage.getItem('reviewassist_admin_clients');
          const list = raw ? JSON.parse(raw) : [];
          if (!list.some((c) => c.id === id)) {
            list.unshift({
              id,
              businessName: name.trim(),
              ownerName: email.trim(),
              businessType: category || 'Local Business',
              email: email.trim(),
              phone: '',
              password: password || 'welcome123',
              services: Array.isArray(services) ? services : [],
              locations: '1',
              reviewsGenerated: 0,
              status: 'trial',
              subscriptionStatus: 'trialing',
              planId: chosenPlan,
              qrSentAt: new Date().toISOString().split('T')[0],
              paidUntil: null,
              googleReviewUrl: rawGoogleUrl,
              createdAt: new Date().toISOString(),
            });
            localStorage.setItem('reviewassist_admin_clients', JSON.stringify(list));
          }
        } catch {}

        const newUser = {
          email: email.trim(),
          password: password || 'welcome123',
          businessId: id,
          name: name.trim(),
          role: 'business_owner',
        };
        saveStoredUser(newUser);

        const mockToken = `mock-jwt-${Math.random().toString(36).substring(2)}.${btoa(JSON.stringify({ email, businessId: id }))}.${Date.now()}`;
        return {
          token: mockToken,
          business: newBiz,
          user: { email, name, businessId: id },
        };
      }
    );

    if (data && data.token) {
      setToken(data.token);
      try {
        const u = data.user || { email, name, businessId: data.business?.id };
        localStorage.setItem('reviewassist_current_user', JSON.stringify(u));
      } catch {}
    }
    return data;
  },

  /**
   * Login attempt tracker to mitigate brute force credential attacks
   */
  _loginAttempts: {},

  /**
   * Helper to verify credentials locally across stored users, admin clients,
   * local businesses, and Supabase businesses table (offline/fallback mode).
   */
  async _verifyLocalCredentials(cleanEmail, password) {
    if (!cleanEmail || !password) return null;

    const isSuperAdminEmail =
      cleanEmail === 'support.reviewassist@gmail.com' ||
      cleanEmail.includes('admin@reviewassist');

    // Security fix (F-002): Super Admin identity MUST always be verified by Supabase Auth server.
    // Never allow bypassing super_admin authentication.
    if (isSuperAdminEmail && isSupabaseConfigured()) {
      return null;
    }

    // 2. Normalize inputs: support email, phone, or ID lookup
    const numericPhone = cleanEmail.replace(/[^0-9]/g, '');

    // 2b. Check local users store
    const localUsers = getStoredUsers();
    let matchedUser = localUsers.find((u) => {
      const uEmail = (u.email || '').trim().toLowerCase();
      const uPhone = (u.phone || '').replace(/[^0-9]/g, '');
      return (
        uEmail === cleanEmail ||
        u.businessId === cleanEmail ||
        (numericPhone && numericPhone.length >= 10 && uPhone.endsWith(numericPhone.slice(-10)))
      );
    });

    // 2c. Check team members store (reviewassist_team_members)
    if (!matchedUser) {
      try {
        const rawTeam = localStorage.getItem('reviewassist_team_members');
        const teamList = rawTeam ? JSON.parse(rawTeam) : [];
        const tMatch = teamList.find((m) => {
          const mEmail = (m.email || '').trim().toLowerCase();
          const mPhone = (m.phone || '').replace(/[^0-9]/g, '');
          return (
            mEmail === cleanEmail ||
            (numericPhone && numericPhone.length >= 10 && mPhone.endsWith(numericPhone.slice(-10)))
          );
        });
        if (tMatch) {
          matchedUser = {
            id: tMatch.id || `user-${Date.now()}`,
            email: tMatch.email,
            name: tMatch.name,
            businessId: tMatch.businessId,
            role: tMatch.role || 'business_staff',
            password: tMatch.password || 'staff123',
          };
        }
      } catch {}
    }

    // 3. Check admin clients list (reviewassist_admin_clients)
    let adminClient = null;
    try {
      const rawClients = localStorage.getItem('reviewassist_admin_clients');
      const clientsList = rawClients ? JSON.parse(rawClients) : [];
      adminClient = clientsList.find((c) => {
        const cEmail = (c.email || '').trim().toLowerCase();
        const cPhone = (c.phone || '').replace(/[^0-9]/g, '');
        return (
          cEmail === cleanEmail ||
          c.id === cleanEmail ||
          (numericPhone && numericPhone.length >= 10 && cPhone.endsWith(numericPhone.slice(-10)))
        );
      });
    } catch {}

    // 3b. Check admin leads list (reviewassist_admin_leads)
    let leadClient = null;
    if (!adminClient) {
      try {
        const rawLeads = localStorage.getItem('reviewassist_admin_leads');
        const leadsList = rawLeads ? JSON.parse(rawLeads) : [];
        leadClient = leadsList.find((l) => {
          const lEmail = (l.email || '').trim().toLowerCase();
          const lPhone = (l.phone || '').replace(/[^0-9]/g, '');
          return (
            lEmail === cleanEmail ||
            l.id === cleanEmail ||
            (numericPhone && numericPhone.length >= 10 && lPhone.endsWith(numericPhone.slice(-10)))
          );
        });
      } catch {}
    }

    const effectiveClientRecord = adminClient || leadClient;

    // 4. Also check local businesses
    const localBusinesses = getStoredBusinesses();
    const localBiz = Object.values(localBusinesses).find((b) => {
      const bEmail = (b.email || '').trim().toLowerCase();
      const bPhone = (b.phone || '').replace(/[^0-9]/g, '');
      return (
        bEmail === cleanEmail ||
        b.id === cleanEmail ||
        (numericPhone && numericPhone.length >= 10 && bPhone.endsWith(numericPhone.slice(-10)))
      );
    });

    // 5. Look up business from Supabase if not found locally
    let remoteBizId = null;
    let supaBiz = null;

    if (!matchedUser && !effectiveClientRecord && !localBiz) {
      return null;
    }

    // Verify password against stored user or client record only
    const candidatePasswords = [
      matchedUser?.password,
      matchedUser?.role === 'business_staff' ? 'staff123' : null,
      effectiveClientRecord?.password,
    ].filter(Boolean);

    const isPasswordMatch = candidatePasswords.some((p) => p === password);
    if (!isPasswordMatch) {
      return null;
    }

    // Resolve business ID and business details
    const bizId = matchedUser?.businessId || adminClient?.id || remoteBizId || supaBiz?.id || localBiz?.id || `biz-${Date.now().toString(36)}`;
    let biz = null;
    if (supaBiz) {
      biz = formatBusinessRow(supaBiz);
    } else if (localBusinesses[bizId]) {
      biz = { ...localBusinesses[bizId] };
    } else if (adminClient) {
      biz = {
        id: adminClient.id,
        name: adminClient.businessName,
        category: adminClient.businessType || 'other',
        services: adminClient.services || ['General Service'],
        email: adminClient.email,
        phone: adminClient.phone || '',
        googleReviewUrl: adminClient.googleReviewUrl || `https://www.google.com/search?q=${encodeURIComponent(adminClient.businessName + ' Google Reviews')}`,
        status: adminClient.status || 'active',
        subscriptionStatus: adminClient.subscriptionStatus || 'active',
        planId: adminClient.planId || 'pro',
        paidUntil: adminClient.paidUntil || null,
        logoUrl: adminClient.logoUrl || '',
        tagline: adminClient.tagline || 'Scan to Share Your Review',
      };
      saveStoredBusiness(biz);
    } else if (localBiz) {
      biz = { ...localBiz };
    } else {
      biz = {
        id: bizId,
        name: matchedUser?.name || 'My Business',
        email: cleanEmail,
        category: 'other',
        services: ['General Service'],
      };
      saveStoredBusiness(biz);
    }

    // Ensure user is in getStoredUsers()
    const userRole = matchedUser?.role || 'business_owner';
    const userName = matchedUser?.name || adminClient?.ownerName || adminClient?.businessName || biz.name;
    const resolvedUser = {
      id: matchedUser?.id || `user-${bizId}`,
      email: cleanEmail,
      name: userName,
      password: password,
      businessId: bizId,
      role: userRole,
    };
    saveStoredUser(resolvedUser);

    // In background, enroll user into Supabase Auth so future sign-ins succeed natively
    if (isSupabaseConfigured() && supabase) {
      (async () => {
        try {
          const { data: supaAuthData } = await supabase.auth.signUp({
            email: cleanEmail,
            password: password,
            options: {
              data: {
                name: userName,
                businessId: bizId,
                role: userRole,
              },
            },
          });
          if (supaAuthData?.user && bizId) {
            await supabase.from('businesses').update({ user_id: supaAuthData.user.id }).eq('id', bizId);
          }
        } catch {}
      })();
    }

    const token = `auth-jwt-${Date.now()}.${btoa(JSON.stringify({ email: cleanEmail, businessId: bizId }))}`;
    setToken(token);
    try {
      localStorage.setItem('reviewassist_current_user', JSON.stringify({
        id: resolvedUser.id,
        email: cleanEmail,
        name: userName,
        businessId: bizId,
        role: userRole,
        isSuperAdmin: false,
      }));
    } catch {}

    return {
      token,
      business: formatBusinessRow(biz),
      businessId: bizId,
      user: resolvedUser,
      role: userRole,
    };
  },

  /**
   * POST /api/auth/login
   * Signs in with Supabase auth or local verified credentials and retrieves linked business
   */
  async login({ email, password }) {
    let cleanEmail = email?.trim().toLowerCase();
    if (!cleanEmail) throw new Error('Please enter your email address.');

    if (isSupabaseConfigured() && !cleanEmail.includes('@')) {
      throw new Error('Please sign in with the email address linked to your account.');
    }

    // Local demo mode supports business IDs and phone identifiers.
    if (!cleanEmail.includes('@')) {
      const cleanPhone = cleanEmail.replace(/[^0-9]/g, '');
      const users = getStoredUsers();
      const uMatch = users.find(
        (u) =>
          u.businessId?.toLowerCase() === cleanEmail ||
          (cleanPhone.length >= 10 && (u.phone || '').replace(/[^0-9]/g, '').endsWith(cleanPhone.slice(-10)))
      );
      if (uMatch?.email) {
        cleanEmail = uMatch.email.toLowerCase();
      } else if (isSupabaseConfigured() && supabase) {
        try {
          const { data: bData } = await supabase
            .from('businesses')
            .select('email')
            .or(`id.eq.${cleanEmail},phone.eq.${cleanPhone}`)
            .limit(1)
            .maybeSingle();
          if (bData?.email) {
            cleanEmail = bData.email.toLowerCase();
          }
        } catch {}
      }
    }

    // Check brute force throttling (max 8 attempts per 5 minutes per email)
    const attempts = (this._loginAttempts[cleanEmail] || []).filter((t) => Date.now() - t < 300000);
    if (attempts.length >= 8) {
      const waitSec = Math.ceil((300000 - (Date.now() - attempts[0])) / 1000);
      throw new Error(`Too many login attempts. For security, please wait ${waitSec} seconds before trying again.`);
    }

    // 1. Supabase auth if configured
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });

        if (!authError && authData?.user) {
          if (cleanEmail) delete this._loginAttempts[cleanEmail];
          // Fetch user's business
          let biz = null;
          if (authData.user.id) {
            const { data: bizData } = await supabase
              .from('businesses')
              .select('*')
              .eq('user_id', authData.user.id)
              .maybeSingle();
            biz = bizData;
          }

          if (!biz && !isSupabaseConfigured()) {
            const { data: bizByEmail } = await supabase
              .from('businesses')
              .select('*')
              .eq('email', cleanEmail)
              .order('created_at', { ascending: false })
              .limit(1)
              .maybeSingle();
            biz = bizByEmail;
            if (biz && !biz.user_id && authData.user.id) {
              supabase.from('businesses').update({ user_id: authData.user.id }).eq('id', biz.id).then();
            }
          }

          let staffRole = null;
          // If not the owner, check if user is an invited staff/team member of a business
          if (!biz && !isSupabaseConfigured()) {
            try {
              const { data: teamRow } = await supabase
                .from('team_members')
                .select('*')
                .eq('email', cleanEmail)
                .maybeSingle();
              if (teamRow && teamRow.business_id) {
                const { data: teamBiz } = await supabase
                  .from('businesses')
                  .select('*')
                  .eq('id', teamRow.business_id)
                  .maybeSingle();
                if (teamBiz) {
                  biz = teamBiz;
                  staffRole = teamRow.role || 'business_staff';
                }
              }
            } catch (err) {
              console.warn('team_members lookup error in Supabase:', err);
            }
          }

          const formattedBiz = biz ? formatBusinessRow(biz) : {
            id: 'biz-' + authData.user.id.substring(0, 8),
            name: 'Business Dashboard',
            category: 'other',
            services: ['Standard Service'],
          };

          // Fetch profile role (super_admin, business_owner, etc.)
          let profileRole = null;
          try {
            const { data: profileData } = await supabase
              .from('profiles')
              .select('role')
              .eq('id', authData.user.id)
              .maybeSingle();
            if (profileData?.role) {
              profileRole = profileData.role;
            }
          } catch {
            // ignore
          }

          if (!profileRole && staffRole) {
            profileRole = staffRole;
          }

          const token = authData.session?.access_token || authData.user.id;
          setToken(token);

          const currentUser = {
            id: authData.user.id,
            email: authData.user.email || email,
            name: profileRole === 'super_admin' ? 'Super Admin' : formattedBiz.name,
            role: profileRole || 'business_owner',
            isSuperAdmin: profileRole === 'super_admin',
            businessId: formattedBiz.id,
          };
          try {
            localStorage.setItem('reviewassist_current_user', JSON.stringify(currentUser));
          } catch {}

          return {
            token,
            business: formattedBiz,
            businessId: formattedBiz.id,
            user: { ...authData.user, ...currentUser },
            role: profileRole || 'business_owner',
          };
        }

        const list = this._loginAttempts[cleanEmail] || [];
        list.push(Date.now());
        this._loginAttempts[cleanEmail] = list;
        throw new Error(authError?.message || 'Invalid email or password. Please check your credentials.');
      } catch (authErr) {
        const list = this._loginAttempts[cleanEmail] || [];
        list.push(Date.now());
        this._loginAttempts[cleanEmail] = list;
        throw authErr;
      }
    }

    // 2. Fallback when Supabase is not configured
    const localVerified = await this._verifyLocalCredentials(cleanEmail, password);
    if (localVerified) {
      if (cleanEmail) delete this._loginAttempts[cleanEmail];
      return localVerified;
    }

    const list = this._loginAttempts[cleanEmail] || [];
    list.push(Date.now());
    this._loginAttempts[cleanEmail] = list;
    throw new Error('Invalid email or password. Please try again.');
  },

  /**
   * Log out user
   */
  async logout() {
    clearToken();
    try {
      localStorage.removeItem('reviewassist_current_user');
      localStorage.removeItem('reviewassist_auth_state');
      localStorage.removeItem('reviewassist_token');
      localStorage.removeItem(STORAGE_KEY_TOKEN);
      localStorage.removeItem('reviewassist_session');
    } catch {}

    if (isSupabaseConfigured() && supabase) {
      try {
        await Promise.race([
          supabase.auth.signOut(),
          new Promise((resolve) => setTimeout(resolve, 800)),
        ]);
      } catch (err) {
        console.warn('Supabase signout error:', err);
      }
    }
  },

  getStoredBusinesses() {
    return getStoredBusinesses();
  },

  getStoredReviews(businessId) {
    return getStoredReviews(businessId || 'demo-1');
  },

  /**
   * GET business by ID
   * @param {string} businessId
   * @param {{ isPublic?: boolean }} [options] If isPublic=true, restricts select to safe public fields only
   */
  async getBusiness(businessId, options = {}) {
    const cleanId = businessId || 'demo-1';
    let biz = null;

    // 1. If Supabase is configured and not a demo ID, query Supabase FIRST to get real-time authoritative status!
    if (isSupabaseConfigured() && supabase && !cleanId.startsWith('demo-')) {
      try {
        // Public-safe columns allowed by Supabase RLS
        const publicSafeColumns = 'id, name, category, services, google_review_link, logo_url, tagline, phone, address, website_url, instagram_url, facebook_url, youtube_url, status, subscription_status, created_at';
        const selectFields = options.isPublic
          ? publicSafeColumns
          : '*';

        let { data, error } = await supabase
          .from('businesses')
          .select(selectFields)
          .eq('id', cleanId)
          .maybeSingle();

        // If select('*') or column list fails due to RLS/permissions (42501) or missing column, fallback to publicSafeColumns
        if (error) {
          const fb = await supabase
            .from('businesses')
            .select(publicSafeColumns)
            .eq('id', cleanId)
            .maybeSingle();
          if (!fb.error && fb.data) {
            data = fb.data;
            error = null;
          }
        }

        if (!error && data) {
          biz = formatBusinessRow(data);
          // Sync fresh status to local storage so other components stay updated
          try {
            const stored = getStoredBusinesses();
            stored[cleanId] = { ...stored[cleanId], ...biz };
            localStorage.setItem(STORAGE_KEY_BUSINESSES, JSON.stringify(stored));
          } catch {}
        }

        if (biz) {
          try {
            const stored = getStoredBusinesses();
            stored[cleanId] = { ...stored[cleanId], ...biz };
            localStorage.setItem(STORAGE_KEY_BUSINESSES, JSON.stringify(stored));
          } catch {}
        }
      } catch (err) {
        console.warn('Supabase getBusiness error:', err);
      }
    }

    // 2. If not found in Supabase or demo mode, check DEFAULT_BUSINESSES or local storage
    if (!biz) {
      const stored = getStoredBusinesses();
      if (stored[cleanId]) {
        biz = { ...stored[cleanId] };
      } else if (DEFAULT_BUSINESSES[cleanId]) {
        biz = { ...DEFAULT_BUSINESSES[cleanId] };
      }
    }

    // 2b. Check admin clients list for newly created or updated clients
    if (!biz && (!isSupabaseConfigured() || cleanId.startsWith('demo-'))) {
      try {
        const raw = localStorage.getItem('reviewassist_admin_clients');
        const list = raw ? JSON.parse(raw) : [];
        const found = list.find((c) => c.id === cleanId || c.email === cleanId);
        if (found) {
          biz = formatBusinessRow({
            id: found.id,
            name: found.businessName,
            category: found.businessType || 'other',
            services: found.services || ['General Service'],
            google_review_link: found.googleReviewLink || found.googleReviewUrl,
            google_review_url: found.googleReviewLink || found.googleReviewUrl,
            email: found.email,
            phone: found.phone || '',
            address: found.address || '',
            website_url: found.websiteUrl || '',
            instagram_url: found.instagramUrl || '',
            facebook_url: found.facebookUrl || '',
            youtube_url: found.youtubeUrl || '',
            status: found.status || 'active',
            subscription_status: found.subscriptionStatus || 'active',
            plan_id: found.planId || 'pro',
            paid_until: found.paidUntil || null,
            logo_url: found.logoUrl || '',
            tagline: found.tagline || 'Scan to Share Your Review',
          });
        }
      } catch {}
    }

    // 2c. Check admin leads list for inquiries converted or previewed
    if (!biz && !isSupabaseConfigured()) {
      try {
        const rawLeads = localStorage.getItem('reviewassist_admin_leads');
        const leads = rawLeads ? JSON.parse(rawLeads) : [];
        const foundLead = leads.find((l) => l.id === cleanId || l.email === cleanId || l.businessName?.toLowerCase().replace(/[^a-z0-9]/g, '-').includes(cleanId));
        if (foundLead) {
          const leadGoogleLink = foundLead.googleReviewLink || foundLead.googleProfileUrl || `https://www.google.com/search?q=${encodeURIComponent(foundLead.businessName + ' Google Reviews')}`;
          const leadCategory = foundLead.businessType || foundLead.rawCategory || 'service';
          biz = {
            id: cleanId,
            name: foundLead.businessName,
            category: leadCategory,
            services: resolveEffectiveServices(foundLead.services, leadCategory),
            google_review_link: leadGoogleLink,
            googleReviewLink: leadGoogleLink,
            googleReviewUrl: leadGoogleLink,
            email: foundLead.email || '',
            phone: foundLead.phone || '',
            status: 'active',
            subscriptionStatus: 'active',
            planId: 'pro',
            createdAt: new Date().toISOString(),
          };
        }
      } catch {}
    }

    // 3. Fallback mock business (ONLY for explicit demo IDs)
    if (!biz && cleanId.startsWith('demo-')) {
      biz = {
        id: cleanId,
        name: cleanId.startsWith('demo-2') ? 'Lumina Skin & Hair Studio' : 'Apex Auto Care & Diagnostics',
        category: cleanId.startsWith('demo-2') ? 'salon' : 'automobile',
        services: cleanId.startsWith('demo-2')
          ? getCategoryServices('salon')
          : getCategoryServices('automobile'),
        google_review_link: 'https://g.page/r/example/review',
        googleReviewLink: 'https://g.page/r/example/review',
        googleReviewUrl: 'https://g.page/r/example/review',
        createdAt: new Date().toISOString(),
        status: 'active',
        planId: 'pro',
      };
    }

    // 3b. Resilient auto-recovery: If accessed via QR scan / review URL, reconstruct business from slug & URL metadata
    if (!biz && !isSupabaseConfigured()) {
      let urlName = '';
      let urlCat = '';
      let urlServices = null;
      let urlGoogle = '';
      if (typeof window !== 'undefined' && window.location) {
        try {
          const sp = new URLSearchParams(window.location.search);
          urlName = sp.get('name') || '';
          urlCat = sp.get('cat') || sp.get('category') || '';
          const sParam = sp.get('services');
          if (sParam) {
            urlServices = sParam.split(',').map((s) => s.trim()).filter(Boolean);
          }
          const rawGoogle = sp.get('google') || sp.get('googleUrl') || '';
          urlGoogle = sanitizeGoogleReviewUrl(rawGoogle, '');
        } catch {}
      }

      // Format clean readable name from slug: "apex-auto-repair-q4f1" -> "Apex Auto Repair"
      const slugClean = cleanId
        .replace(/-[a-z0-9]{3,6}$/i, '')
        .replace(/[-_]+/g, ' ')
        .trim();
      const derivedName = urlName || (slugClean.length > 2
        ? slugClean.split(' ').map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')
        : 'Local Business');

      const derivedCategory = urlCat || 'service';
      const defaultServices = getCategoryServices(derivedCategory);
      const safeReviewLink = sanitizeGoogleReviewUrl(urlGoogle, 'https://g.page/r/example/review');

      biz = {
        id: cleanId,
        name: derivedName,
        category: derivedCategory,
        services: (urlServices && urlServices.length > 0 && !isGenericOrEmptyServices(urlServices))
          ? urlServices
          : defaultServices,
        google_review_link: safeReviewLink,
        googleReviewLink: safeReviewLink,
        googleReviewUrl: safeReviewLink,
        status: 'active',
        subscriptionStatus: 'active',
        planId: 'pro',
        createdAt: new Date().toISOString(),
      };

      // Persist to local storage so subsequent review steps & stats succeed
      try {
        const stored = getStoredBusinesses();
        stored[cleanId] = { ...biz };
        localStorage.setItem(STORAGE_KEY_BUSINESSES, JSON.stringify(stored));
      } catch {}
    }

    // 4. Apply admin client overrides (status, plan, paidUntil) if configured in Super Admin
    const adminOverride = getAdminClientOverride(cleanId);
    if (adminOverride) {
      if (adminOverride.status === 'active' || adminOverride.subscriptionStatus === 'active') {
        biz.status = 'active';
        biz.subscriptionStatus = 'active';
        biz.isInactive = false;
        if (adminOverride.paidUntil && new Date(adminOverride.paidUntil) < new Date()) {
          biz.paidUntil = null;
        }
      } else if (
        adminOverride.status === 'inactive' ||
        adminOverride.subscriptionStatus === 'canceled' ||
        adminOverride.subscriptionStatus === 'inactive'
      ) {
        biz.status = 'inactive';
        biz.subscriptionStatus = 'canceled';
        biz.isInactive = true;
      }
      if (adminOverride.planId) {
        biz.planId = adminOverride.planId;
      }
      if (adminOverride.paidUntil && !biz.isInactive) {
        biz.paidUntil = adminOverride.paidUntil;
      }
    }

    try {
      const rawSubs = localStorage.getItem(STORAGE_KEY_SUBSCRIPTIONS);
      if (rawSubs) {
        const subs = JSON.parse(rawSubs);
        if (subs[cleanId]) {
          if (biz.status === 'active' || biz.subscriptionStatus === 'active') {
            if (subs[cleanId].status !== 'active') {
              subs[cleanId].status = 'active';
              subs[cleanId].isInactive = false;
              localStorage.setItem(STORAGE_KEY_SUBSCRIPTIONS, JSON.stringify(subs));
            }
          } else if (subs[cleanId].status === 'inactive' || subs[cleanId].status === 'canceled') {
            biz.status = 'inactive';
            biz.subscriptionStatus = 'canceled';
          }
        }
      }
    } catch {}

    // 5. Authoritative final check
    if (isBusinessInactive(biz) || isBusinessInactive(cleanId)) {
      biz.status = 'inactive';
      biz.subscriptionStatus = 'canceled';
      biz.isInactive = true;
    } else {
      biz.isInactive = false;
      if (biz.status === 'inactive') biz.status = 'active';
      if (biz.subscriptionStatus === 'canceled') biz.subscriptionStatus = 'active';
    }

    return biz;
  },

  /**
   * Client-side rate limiting tracker for review draft & submission protection
   */
  _rateLimits: {
    drafts: [],
    confirmations: {},
  },

  _checkRateLimit(action, maxCalls = 10, windowMs = 60000, key = '') {
    const now = Date.now();
    if (action === 'draft') {
      this._rateLimits.drafts = this._rateLimits.drafts.filter((t) => now - t < windowMs);
      if (this._rateLimits.drafts.length >= maxCalls) {
        const waitSec = Math.ceil((windowMs - (now - this._rateLimits.drafts[0])) / 1000);
        throw new Error(`Rate limit reached: Please wait ${waitSec}s before generating another AI review.`);
      }
      this._rateLimits.drafts.push(now);
    } else if (action === 'confirm') {
      const list = (this._rateLimits.confirmations[key] || []).filter((t) => now - t < windowMs);
      if (list.length >= maxCalls) {
        throw new Error('Rate limit reached: You have already submitted a review recently. Please try again later.');
      }
      list.push(now);
      this._rateLimits.confirmations[key] = list;
    }
  },

  /**
   * POST /api/reviews/draft
   * AI draft review generator via Supabase Edge Function (Gemini 2.5 Flash Lite)
   */
  _edgeFunctionFailUntil: 0,

  async generateDraftReview({ businessId, serviceType, whatStoodOut, whatCouldImprove, rating = 5, previousDraft = '', businessCategory = '', seed, lengthPreference = 'auto', language = 'english', staffName = '' }) {
    // Generous limit for language switching & preview exploration (60/min)
    this._checkRateLimit('draft', 60, 60000);

    // Verify business service is not paused/inactive before generating
    const targetBiz = await this.getBusiness(businessId);
    if (targetBiz && (targetBiz.status === 'inactive' || targetBiz.subscriptionStatus === 'inactive' || targetBiz.subscriptionStatus === 'canceled')) {
      throw new Error("This business's review assistant service is temporarily paused by administration.");
    }

    // Only invoke Edge Function if Supabase is configured and not in failure cooloff
    if (isSupabaseConfigured() && supabase && Date.now() > (this._edgeFunctionFailUntil || 0)) {
      try {
        // Enforce 3.5s timeout so unconfigured/slow edge functions don't block language previewing
        const invokePromise = supabase.functions.invoke('generate-review', {
          body: {
            businessId,
            serviceType,
            whatStoodOut,
            whatCouldImprove,
            rating,
            businessCategory: businessCategory || targetBiz?.category || '',
            seed: typeof seed === 'number' ? seed : Date.now(),
            previousDraft: previousDraft || '',
            lengthPreference,
            language: language || 'english',
            staffName: staffName || '',
          },
        });

        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Edge Function timeout (falling back to fast local generator)')), 3500)
        );

        const { data, error } = await Promise.race([invokePromise, timeoutPromise]);

        if (error) {
          let detailedMsg = error.message;
          try {
            if (error.context && typeof error.context.json === 'function') {
              const errBody = await error.context.json();
              if (errBody?.error) detailedMsg = errBody.error;
            }
          } catch {
            // ignore
          }
          // If GEMINI_API_KEY is missing or edge function returns 500, enter a 2-minute cooloff
          // so subsequent clicks switch languages instantaneously
          this._edgeFunctionFailUntil = Date.now() + 120000;
          console.warn('Supabase Edge Function unavailable (cooloff active):', detailedMsg);
          // Fall through to local mock generator
        } else if (data?.draftText) {
          return { draftText: data.draftText };
        } else if (data?.error) {
          throw new Error(data.error);
        }
      } catch (fnErr) {
        if (
          fnErr.message?.includes('limit reached') ||
          fnErr.message?.includes('Starter Plan') ||
          fnErr.message?.includes('paused') ||
          fnErr.message?.includes('inactive')
        ) {
          throw fnErr;
        }
        this._edgeFunctionFailUntil = Date.now() + 120000;
        console.warn('Supabase Edge Function bypassed, using local generator:', fnErr.message || fnErr);
        // Fall back to local mock generator
      }
    }

    // Local storage enforcement & tracking
    const stored = this.getStoredBusinesses();
    if (stored[businessId] && !businessId.startsWith('demo-')) {
      const b = stored[businessId];
      if (b.planId === 'starter' && (b.aiCreditsUsed || 0) >= 100) {
        throw new Error('Monthly AI review limit reached (100/100 reviews on Starter Plan). Please upgrade to Pro for unlimited reviews.');
      }
      b.aiCreditsUsed = (b.aiCreditsUsed || 0) + 1;
      saveStoredBusiness(b);
    }

    const draftText = generateMockDraft({
      serviceType,
      whatStoodOut,
      whatCouldImprove,
      rating,
      previousDraft,
      businessCategory: businessCategory || targetBiz?.category || '',
      seed,
      lengthPreference,
      language: language || 'english',
      staffName: staffName || '',
    });
    return { draftText };
  },


  /**
   * POST review confirmation & persist to database
   */
  async confirmReview({ businessId, serviceType, finalText, rating, whatStoodOut = '', whatCouldImprove = '', staffId = '', staffName = '' }) {
    const cleanId = businessId || 'demo-1';

    // Generous rate limit (30 submissions per 5 minutes per business) so high-traffic stores & testing aren't throttled
    this._checkRateLimit('confirm', 30, 300000, cleanId);

    const reviewId = 'rev-' + Math.random().toString(36).substring(2, 9);
    const nowIso = new Date().toISOString();

    const review = {
      id: reviewId,
      businessId: cleanId,
      serviceType: serviceType || 'General Service',
      rating: Number(rating) || 5,
      text: finalText,
      whatStoodOut: whatStoodOut || '',
      whatCouldImprove: whatCouldImprove || '',
      staffId: staffId || '',
      staffName: staffName || '',
      createdAt: nowIso,
    };

    let targetGoogleUrl = 'https://g.page/r/example/review';

    let supabaseSyncSucceeded = false;

    if (isSupabaseConfigured() && supabase) {
      try {
        // Helper to detect column-related schema errors
        const isColumnError = (err) =>
          err?.message?.includes('column') ||
          err?.code === 'PGRST204' ||
          err?.message?.includes('schema');

        // Helper to detect RLS / permission errors
        const isRLSError = (err) =>
          err?.message?.toLowerCase().includes('row-level security') ||
          err?.message?.toLowerCase().includes('permission denied') ||
          err?.message?.toLowerCase().includes('rls') ||
          err?.code === '42501' ||
          err?.code === 'PGRST301';

        // First attempt: try stored procedure submit_customer_review (SECURITY DEFINER, auto-handles FK and credits)
        try {
          const { data: rpcRes, error: rpcErr } = await supabase.rpc('submit_customer_review', {
            p_id: reviewId,
            p_business_id: cleanId,
            p_service_type: review.serviceType,
            p_rating: review.rating,
            p_text: review.text,
            p_what_stood_out: review.whatStoodOut || '',
            p_what_could_improve: review.whatCouldImprove || '',
            p_staff_id: staffId || null,
            p_staff_name: staffName || null,
          });

          if (!rpcErr && rpcRes && rpcRes.success !== false) {
            supabaseSyncSucceeded = true;
            console.info('[ReviewAssist] ✅ Review saved to Supabase via submit_customer_review RPC.');
          }
        } catch {
          // RPC may not exist yet, proceed to direct table insert
        }

        // Second attempt: direct insert if RPC did not succeed
        if (!supabaseSyncSucceeded) {
          const newReviewRow = {
            id: reviewId,
            business_id: cleanId,
            service_type: review.serviceType,
            rating: review.rating,
            text: review.text,
            what_stood_out: review.whatStoodOut,
            what_could_improve: review.whatCouldImprove,
            staff_id: staffId || null,
            staff_name: staffName || null,
          };

          const { error: insertErr } = await supabase.from('reviews').insert([newReviewRow]);

          if (insertErr) {
            if (insertErr.code === '23503' || insertErr.message?.includes('foreign key')) {
              console.error(
                `[ReviewAssist] 🚫 Foreign Key Violation: Business '${cleanId}' does not exist in Supabase businesses table.\n` +
                'The review cannot be linked because the business was only created locally in localStorage.\n' +
                '👉 Fix: In Supabase SQL Editor, run the sync SQL or register this business in Supabase.'
              );
            } else if (isRLSError(insertErr)) {
              console.error(
                '[ReviewAssist] 🚫 Supabase RLS is blocking review submissions from customers!\n' +
                'Reviews are only saved locally and will NOT appear on the dashboard.\n' +
                '👉 Fix: Run the migration SQL in your Supabase SQL Editor.',
                insertErr
              );
            } else if (isColumnError(insertErr)) {
              // Schema mismatch — retry without staff columns
              console.warn('[ReviewAssist] Staff columns missing in reviews table. Retrying without staff fields.', insertErr.message);
              const baseReviewRow = {
                id: reviewId,
                business_id: cleanId,
                service_type: review.serviceType,
                rating: review.rating,
                text: review.text,
                what_stood_out: review.whatStoodOut,
                what_could_improve: review.whatCouldImprove,
              };
              const { error: retryErr } = await supabase.from('reviews').insert([baseReviewRow]);
              if (retryErr) {
                if (retryErr.code === '23503' || retryErr.message?.includes('foreign key')) {
                  console.error(`[ReviewAssist] 🚫 Foreign Key: Business '${cleanId}' not found in Supabase businesses table.`);
                } else if (isRLSError(retryErr)) {
                  console.error('[ReviewAssist] 🚫 Supabase RLS blocked review insert (retry):', retryErr.message);
                } else {
                  console.error('[ReviewAssist] Supabase review insert retry failed:', retryErr.message, retryErr);
                }
              } else {
                supabaseSyncSucceeded = true;
                console.info('[ReviewAssist] ✅ Review saved to Supabase (without staff columns).');
              }
            } else {
              console.error('[ReviewAssist] Supabase review insert failed with unknown error:', insertErr.message, insertErr);
            }
          } else {
            supabaseSyncSucceeded = true;
            console.info('[ReviewAssist] ✅ Review saved to Supabase successfully.');
          }
        }

        const { data: biz } = await supabase
          .from('businesses')
          .select('name, google_review_link')
          .eq('id', cleanId)
          .maybeSingle();

        const rawUrl = biz?.google_review_link || biz?.google_review_url;
        targetGoogleUrl = rawUrl ? rawUrl.trim() : resolveGoogleReviewUrl(null, biz?.name);
      } catch (err) {
        console.error('[ReviewAssist] Supabase review insert exception:', err);
      }
    } else {
      const businesses = getStoredBusinesses();
      const biz = businesses[cleanId] || {};
      targetGoogleUrl = biz.google_review_link || biz.googleReviewLink || biz.googleReviewUrl || 'https://g.page/r/example/review';
      supabaseSyncSucceeded = false; // localStorage-only mode
    }

    if (isSupabaseConfigured() && !supabaseSyncSucceeded) {
      throw new Error('We could not save your review. Please try again before opening Google Reviews.');
    }

    saveStoredReview(review);

    try {
      if (typeof BroadcastChannel !== 'undefined') {
        const bc = new BroadcastChannel('reviewassist_channel');
        bc.postMessage({
          type: 'review_confirmed',
          businessId: cleanId,
          review,
        });
        setTimeout(() => bc.close(), 100);
      }
    } catch (e) {
      console.warn('BroadcastChannel notice:', e);
    }

    try {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('storage'));
        window.dispatchEvent(new CustomEvent('reviewassist:review_confirmed', { detail: { businessId: cleanId, review } }));
        window.dispatchEvent(new CustomEvent('reviewassist:reviews_updated', { detail: { businessId: cleanId, review } }));
      }
    } catch (e) {
      console.warn('CustomEvent notice:', e);
    }

    return {
      success: true,
      supabaseSynced: supabaseSyncSucceeded,
      google_review_link: targetGoogleUrl,
      googleReviewLink: targetGoogleUrl,
      googleReviewUrl: targetGoogleUrl,
      review,
    };
  },

  /**
   * GET business customer reviews (unified Supabase + LocalStorage with deduplication)
   */
  async getBusinessReviews(businessId) {
    const cleanId = businessId || 'demo-1';
    const localReviews = isSupabaseConfigured() ? [] : (getStoredReviews(cleanId) || []);
    let supaReviews = [];

    if (isSupabaseConfigured() && supabase) {
      try {
        const { data: reviews, error } = await supabase
          .from('reviews')
          .select('*')
          .eq('business_id', cleanId)
          .order('created_at', { ascending: false });

        if (!error && Array.isArray(reviews)) {
          supaReviews = reviews.map((r) => ({
            id: r.id,
            businessId: r.business_id,
            serviceType: r.service_type || 'General Service',
            rating: Number(r.rating) || 5,
            text: r.text || '',
            whatStoodOut: r.what_stood_out || '',
            whatCouldImprove: r.what_could_improve || '',
            staffId: r.staff_id || '',
            staffName: r.staff_name || '',
            createdAt: r.created_at,
          }));
        }
      } catch (err) {
        if (isSupabaseConfigured()) {
          throw err;
        }
        console.warn('Supabase getBusinessReviews notice:', err);
      }
    }

    if (isSupabaseConfigured() && supabase && !cleanId.startsWith('demo-')) {
      return supaReviews;
    }

    // Merge Supabase + LocalStorage reviews without duplicate IDs or matching signatures
    const seen = new Set();
    const merged = [];

    for (const r of [...localReviews, ...supaReviews]) {
      if (!r) continue;
      const key = r.id || `${r.createdAt || ''}_${(r.text || '').trim().slice(0, 32)}`;
      if (!seen.has(key)) {
        seen.add(key);
        merged.push({
          id: r.id || 'rev-' + Math.random().toString(36).substring(2, 9),
          businessId: cleanId,
          serviceType: r.serviceType || 'General Service',
          rating: Number(r.rating) || 5,
          text: r.text || '',
          whatStoodOut: r.whatStoodOut || '',
          whatCouldImprove: r.whatCouldImprove || '',
          staffId: r.staffId || '',
          staffName: r.staffName || '',
          createdAt: r.createdAt || new Date().toISOString(),
        });
      }
    }

    // Sort by createdAt descending (newest reviews first)
    merged.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

    return merged;
  },

  /**
   * GET business dashboard statistics (calculated dynamically from unified reviews)
   */
  async getBusinessStats(businessId) {
    const cleanId = businessId || 'demo-1';
    const reviews = await this.getBusinessReviews(cleanId);
    const totalReviews = reviews.length;

    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const todayReviews = reviews.filter((r) => {
      const d = new Date(r.createdAt || 0);
      return d.toISOString().slice(0, 10) === todayStr;
    }).length;

    const thisMonthReviews = reviews.filter((r) => {
      const d = new Date(r.createdAt || 0);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    }).length;

    const avgRating =
      totalReviews > 0
        ? (reviews.reduce((acc, r) => acc + (Number(r.rating) || 5), 0) / totalReviews).toFixed(1)
        : '5.0';

    const scanToReviewRate =
      totalReviews > 0
        ? Math.min(100, Math.round((totalReviews / Math.max(totalReviews * 2, 10)) * 100)) + '%'
        : '0%';

    return {
      totalReviews,
      today: todayReviews,
      todayReviews,
      thisMonth: thisMonthReviews,
      thisMonthReviews,
      avgRating: Number(avgRating),
      scanToReviewRate,
    };
  },

  /**
   * GET business SaaS subscription
   */
  async getSubscription(businessId) {
    const cleanId = businessId || 'demo-1';
    let sub = null;

    // 1. Authoritative check from Supabase if configured
    if (isSupabaseConfigured() && supabase && !cleanId.startsWith('demo-')) {
      try {
        const { data: bData } = await supabase
          .from('businesses')
          .select('id, plan_id, subscription_status')
          .eq('id', cleanId)
          .maybeSingle();

        const { data: sData } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('business_id', cleanId)
          .maybeSingle();

        if (bData || sData) {
          const rawStatus = bData?.subscription_status || sData?.status || 'active';
          const isAct = rawStatus === 'active' || rawStatus === 'trialing';
          sub = {
            id: sData?.id || `sub-${cleanId}`,
            businessId: cleanId,
            planId: bData?.plan_id || sData?.plan_id || 'starter',
            status: isAct ? (rawStatus === 'trialing' ? 'trialing' : 'active') : 'canceled',
            billingInterval: sData?.billing_interval || 'monthly',
            amount: sData?.amount || 499,
            currentPeriodEnd: sData?.current_period_end || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            isInactive: !isAct,
          };
          try {
            const rawSubs = localStorage.getItem(STORAGE_KEY_SUBSCRIPTIONS);
            const allSubs = rawSubs ? JSON.parse(rawSubs) : {};
            allSubs[cleanId] = { ...allSubs[cleanId], ...sub };
            localStorage.setItem(STORAGE_KEY_SUBSCRIPTIONS, JSON.stringify(allSubs));
          } catch {}
          return sub;
        }
      } catch (err) {
        console.warn('Supabase getSubscription error:', err);
      }
    }

    if (isSupabaseConfigured() && supabase && !cleanId.startsWith('demo-')) {
      return sub;
    }

    try {
      const data = localStorage.getItem(STORAGE_KEY_SUBSCRIPTIONS);
      const parsed = data ? JSON.parse(data) : {};
      if (parsed[cleanId]) sub = { ...parsed[cleanId] };
    } catch {}

    if (!sub && DEFAULT_SUBSCRIPTIONS[cleanId]) {
      sub = { ...DEFAULT_SUBSCRIPTIONS[cleanId] };
    }

    if (!sub) {
      // 1. Check admin clients list for newly created or updated clients
      let adminClientPlan = null;
      let adminClientStatus = null;
      let adminClientPaidUntil = null;
      try {
        const rawClients = localStorage.getItem('reviewassist_admin_clients');
        const clientsList = rawClients ? JSON.parse(rawClients) : [];
        const found = clientsList.find((c) => c.id === cleanId || c.email === cleanId);
        if (found) {
          adminClientPlan = found.planId;
          adminClientStatus = found.status === 'inactive' ? 'inactive' : (found.subscriptionStatus || 'active');
          adminClientPaidUntil = found.paidUntil;
        }
      } catch {}

      // 2. Check admin leads list
      if (!adminClientPlan) {
        try {
          const rawLeads = localStorage.getItem('reviewassist_admin_leads');
          const leadsList = rawLeads ? JSON.parse(rawLeads) : [];
          const foundLead = leadsList.find((l) => l.id === cleanId || l.email === cleanId);
          if (foundLead) {
            adminClientPlan = foundLead.planId || 'pro';
            adminClientStatus = 'trialing';
          }
        } catch {}
      }

      // 3. Check stored businesses
      const storedBiz = getStoredBusinesses()[cleanId];
      const fallbackPlan = adminClientPlan || storedBiz?.planId || storedBiz?.plan_id || 'pro';
      const fallbackStatus = adminClientStatus || storedBiz?.subscriptionStatus || storedBiz?.subscription_status || 'active';
      const fallbackPaidUntil = adminClientPaidUntil || storedBiz?.paidUntil || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

      sub = {
        businessId: cleanId,
        planId: fallbackPlan,
        status: fallbackStatus,
        billingInterval: 'monthly',
        amount: fallbackPlan === 'starter' ? 299 : fallbackPlan === 'enterprise' ? 799 : 499,
        currentPeriodEnd: fallbackPaidUntil,
        aiGenerationsUsed: 0,
        whatsappInvitesUsed: 0,
      };
    }

    // Apply admin override
    const adminOverride = getAdminClientOverride(cleanId);
    if (adminOverride) {
      if (adminOverride.status) {
        sub.status = adminOverride.status;
      }
      if (adminOverride.planId) {
        sub.planId = adminOverride.planId;
      }
      if (adminOverride.paidUntil) {
        sub.currentPeriodEnd = adminOverride.paidUntil;
        if (new Date(adminOverride.paidUntil) < new Date()) {
          sub.status = 'inactive';
        }
      }
    }

    if (isBusinessInactive(cleanId) || isBusinessInactive(sub)) {
      sub.status = 'inactive';
      sub.isInactive = true;
    }

    return sub;
  },

  /**
   * UPDATE business SaaS subscription
   */
  async updateSubscription(businessId, subscriptionData) {
    const cleanId = businessId || 'demo-1';
    try {
      const data = localStorage.getItem(STORAGE_KEY_SUBSCRIPTIONS);
      const parsed = data ? JSON.parse(data) : { ...DEFAULT_SUBSCRIPTIONS };
      parsed[cleanId] = {
        ...(parsed[cleanId] || {}),
        ...subscriptionData,
        businessId: cleanId,
        updatedAt: new Date().toISOString(),
      };
      localStorage.setItem(STORAGE_KEY_SUBSCRIPTIONS, JSON.stringify(parsed));

      // Also update stored businesses list planId
      const bData = localStorage.getItem(STORAGE_KEY_BUSINESSES);
      const bParsed = bData ? JSON.parse(bData) : { ...DEFAULT_BUSINESSES };
      if (bParsed[cleanId]) {
        bParsed[cleanId].planId = subscriptionData.planId;
        bParsed[cleanId].subscriptionStatus = subscriptionData.status || 'active';
        localStorage.setItem(STORAGE_KEY_BUSINESSES, JSON.stringify(bParsed));
      }

      return parsed[cleanId];
    } catch (err) {
      console.warn('Could not save subscription:', err);
      return subscriptionData;
    }
  },

  /**
   * GET business team members
   */
  async getTeamMembers(businessId) {
    const cleanId = businessId || 'demo-1';
    try {
      const data = localStorage.getItem(STORAGE_KEY_TEAM);
      const parsed = data ? JSON.parse(data) : {};
      if (parsed[cleanId]) return parsed[cleanId];
    } catch {}

    return DEFAULT_TEAM_MEMBERS[cleanId] || [
      {
        id: 'mem-default-1',
        businessId: cleanId,
        email: 'owner@business.com',
        name: 'Workspace Owner',
        role: 'business_owner',
        status: 'active',
        invitedAt: new Date().toISOString(),
      },
    ];
  },

  /**
   * SAVE business team members
   */
  async saveTeamMembers(businessId, members) {
    const cleanId = businessId || 'demo-1';
    try {
      const data = localStorage.getItem(STORAGE_KEY_TEAM);
      const parsed = data ? JSON.parse(data) : { ...DEFAULT_TEAM_MEMBERS };
      parsed[cleanId] = members;
      localStorage.setItem(STORAGE_KEY_TEAM, JSON.stringify(parsed));
      return members;
    } catch (err) {
      console.warn('Could not save team members:', err);
      return members;
    }
  },

  /**
   * GET Super Admin SaaS Platform Overview Metrics
   */
  async getSaaSMetrics() {
    let businessesList = [];
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data } = await supabase.from('businesses').select('*');
        if (data) businessesList = data;
      } catch {}
    }
    const localBusinesses = Object.values(getStoredBusinesses());
    const mergedMap = new Map();
    businessesList.forEach((b) => mergedMap.set(b.id, b));
    localBusinesses.forEach((b) => {
      if (!mergedMap.has(b.id)) mergedMap.set(b.id, b);
    });
    const allBiz = Array.from(mergedMap.values());

    const activeList = allBiz.filter((b) => {
      const inactive =
        b.status === 'inactive' ||
        b.subscription_status === 'canceled' ||
        b.subscriptionStatus === 'canceled' ||
        b.subscription_status === 'inactive' ||
        b.subscriptionStatus === 'inactive' ||
        Boolean(b.paid_until && new Date(b.paid_until) < new Date());
      return !inactive;
    });

    const planPrices = { starter: 299, pro: 499, enterprise: 799 };
    const planCounts = { starter: 0, pro: 0, enterprise: 0 };
    let mrr = 0;
    activeList.forEach((b) => {
      const pid = (b.plan_id || b.planId || 'pro').toLowerCase();
      if (planCounts[pid] !== undefined) {
        planCounts[pid] += 1;
        mrr += planPrices[pid] || 499;
      } else {
        planCounts.pro += 1;
        mrr += 499;
      }
    });

    // Real total reviews
    let totalReviews = 0;
    if (isSupabaseConfigured() && supabase) {
      try {
        const { count } = await supabase.from('reviews').select('*', { count: 'exact', head: true });
        if (typeof count === 'number') totalReviews = count;
      } catch {}
    }
    try {
      const rawRevs = localStorage.getItem(STORAGE_KEY_REVIEWS);
      if (rawRevs) {
        const parsed = JSON.parse(rawRevs);
        Object.values(parsed).forEach((arr) => {
          if (Array.isArray(arr)) totalReviews = Math.max(totalReviews, arr.length);
        });
      }
    } catch {}

    return {
      mrr,
      activeSubscribers: activeList.length,
      churnRate: 0,
      totalAiReviewsGenerated: totalReviews,
      totalWhatsAppInvitesSent: 0,
      avgCustomerRating: totalReviews > 0 ? 5.0 : 0,
      planDistribution: planCounts,
    };
  },

  /**
   * GET All Businesses (Super Admin)
   */
  async getAllBusinessesAdmin() {
    const businesses = getStoredBusinesses();
    const subsData = (() => {
      try {
        const d = localStorage.getItem(STORAGE_KEY_SUBSCRIPTIONS);
        return d ? JSON.parse(d) : DEFAULT_SUBSCRIPTIONS;
      } catch {
        return DEFAULT_SUBSCRIPTIONS;
      }
    })();

    return Object.values(businesses).map((b) => {
      const sub = subsData[b.id] || DEFAULT_SUBSCRIPTIONS[b.id] || {
        planId: b.planId || 'pro',
        status: b.subscriptionStatus || 'active',
        billingInterval: 'monthly',
        amount: 49,
      };

      return {
        ...b,
        planId: sub.planId,
        subscriptionStatus: sub.status,
        billingInterval: sub.billingInterval,
        amount: sub.amount,
        reviewsCount: getStoredReviews(b.id).length,
      };
    });
  },

  /**
   * 1-Click Client Onboarding by Super Admin
   * Creates business record, login user credentials, sets plan and renewal date, and syncs admin clients list
   */
  async saveClientAccount({
    businessId,
    businessName,
    email,
    password,
    ownerName,
    category,
    planId = 'pro',
    paidUntil,
    phone = '',
    tagline,
    services = [],
    logoUrl = '',
    googleReviewUrl = '',
    google_review_link = '',
    googleReviewLink = '',
  }) {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase.functions.invoke('admin-manage-client', {
        body: {
          action: 'create',
          businessId,
          businessName,
          email,
          password,
          ownerName,
          category,
          planId,
          paidUntil,
          phone,
          tagline,
          services,
          logoUrl,
          googleReviewUrl: googleReviewUrl || google_review_link || googleReviewLink,
        },
      });
      if (error || !data?.success) {
        throw new Error(error?.message || data?.error || 'Secure admin onboarding failed.');
      }
      return {
        user: { email: data.credentials.email, role: 'business_owner', businessId: data.business.id },
        business: formatBusinessRow(data.business),
        credentials: data.credentials,
      };
    }

    const cleanBizId = businessId.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPass = (password || generateSecurePassword(16)).trim();
    const cleanOwner = (ownerName || businessName || '').trim();
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const now = new Date().toISOString();
    const defaultExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const expiryDate = paidUntil || defaultExpiry;

    // Demo mode stores its credentials only in the local demo store.
    const users = getStoredUsers();
    const uIdx = users.findIndex((u) => u.email.toLowerCase() === cleanEmail);
    const userObj = {
      id: `user-${Date.now().toString(36)}`,
      email: cleanEmail,
      password: cleanPass,
      name: cleanOwner,
      businessId: cleanBizId,
      role: 'business_owner',
    };
    if (uIdx >= 0) {
      users[uIdx] = { ...users[uIdx], ...userObj };
    } else {
      users.push(userObj);
    }
    localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users));

    // 2. Create or update business profile locally
    const defaultServices = getCategoryServices(category);
    const resolvedServices = resolveEffectiveServices(services, category);
    const rawGoogleInput = (google_review_link || googleReviewLink || googleReviewUrl || '').trim();
    const resolvedGoogleUrl = rawGoogleInput || `https://www.google.com/search?q=${encodeURIComponent(businessName + ' Google Reviews')}`;

    const newBiz = {
      id: cleanBizId,
      name: businessName,
      category: category || 'other',
      services: resolvedServices,
      email: cleanEmail,
      phone: phone || '',
      logoUrl: logoUrl || '',
      shareableUrl: `${origin}/review/${cleanBizId}`,
      dashboardUrl: `${origin}/dashboard/${cleanBizId}`,
      google_review_link: resolvedGoogleUrl,
      googleReviewLink: resolvedGoogleUrl,
      google_review_url: resolvedGoogleUrl,
      googleReviewUrl: resolvedGoogleUrl,
      createdAt: now,
      status: 'active',
      subscriptionStatus: 'active',
      planId: planId,
      paidUntil: expiryDate,
      tagline: tagline || 'Scan to Share Your Review',
    };
    saveStoredBusiness(newBiz);

    // 3. Create or update in Super Admin clients list
    try {
      const rawClients = localStorage.getItem('reviewassist_admin_clients');
      const clients = rawClients ? JSON.parse(rawClients) : [];
      const cIdx = clients.findIndex((c) => c.id === cleanBizId);
      const clientEntry = {
        id: cleanBizId,
        businessName,
        ownerName: ownerName || businessName,
        businessType: category || 'General Business',
        email: cleanEmail,
        phone: phone || '',
        services: resolvedServices,
        googleReviewUrl: resolvedGoogleUrl,
        logoUrl: logoUrl || '',
        tagline: tagline || 'Scan to Share Your Review',
        locations: '1',
        reviewsGenerated: 0,
        status: 'active',
        subscriptionStatus: 'active',
        planId: planId,
        qrSentAt: new Date().toISOString().split('T')[0],
        paidUntil: expiryDate,
      };
      if (cIdx >= 0) {
        clients[cIdx] = { ...clients[cIdx], ...clientEntry };
      } else {
        clients.unshift(clientEntry);
      }
      localStorage.setItem('reviewassist_admin_clients', JSON.stringify(clients));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('storage'));
        window.dispatchEvent(new CustomEvent('reviewassist:status_changed', { detail: { id: cleanBizId, status: 'active' } }));
      }
    } catch (err) {
      console.warn('Error saving to admin clients list:', err);
    }

    // 4. Set subscription record
    try {
      const rawSubs = localStorage.getItem(STORAGE_KEY_SUBSCRIPTIONS);
      const subs = rawSubs ? JSON.parse(rawSubs) : {};
      subs[cleanBizId] = {
        businessId: cleanBizId,
        planId: planId,
        status: 'active',
        billingInterval: 'monthly',
        currentPeriodEnd: expiryDate,
        aiGenerationsUsed: 0,
        whatsappInvitesUsed: 0,
      };
      localStorage.setItem(STORAGE_KEY_SUBSCRIPTIONS, JSON.stringify(subs));
    } catch (err) {
      console.warn('Error saving subscription record:', err);
    }

    return { user: userObj, business: newBiz };
  },

  /**
   * Super Admin Update Client Details & Credentials
   * Updates business, admin client entry, user login password, and subscription across all stores
   */
  async updateClientAccount({
    id,
    businessName,
    ownerName,
    email,
    phone,
    password,
    category,
    services,
    googleReviewUrl,
    planId,
    status,
    paidUntil,
    logoUrl,
    tagline,
    address,
    websiteUrl,
    instagramUrl,
    facebookUrl,
    youtubeUrl,
  }) {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase.functions.invoke('admin-manage-client', {
        body: {
          action: 'update',
          businessId: id,
          businessName,
          ownerName,
          email,
          phone,
          password,
          category,
          services,
          googleReviewUrl,
          planId,
          status,
          paidUntil,
          logoUrl,
          tagline,
          address,
          websiteUrl,
          instagramUrl,
          facebookUrl,
          youtubeUrl,
        },
      });
      if (error || !data?.success) {
        throw new Error(error?.message || data?.error || 'Secure admin client update failed.');
      }
      const updatedBusiness = formatBusinessRow(data.business);
      saveStoredBusiness(updatedBusiness);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('reviewassist:business_updated', {
          detail: { businessId: updatedBusiness.id, business: updatedBusiness },
        }));
      }
      return {
        business: updatedBusiness,
        credentials: data.credentials,
      };
    }

    const cleanId = id?.trim();
    if (!cleanId) throw new Error('Client ID is required for update.');
    const cleanEmail = email?.trim().toLowerCase();
    const cleanName = (businessName || '').trim();
    const cleanOwner = (ownerName || '').trim() || cleanName;
    const resolvedServices = resolveEffectiveServices(services, category);

    // 1. Update in reviewassist_admin_clients
    let updatedClient = null;
    try {
      const raw = localStorage.getItem('reviewassist_admin_clients');
      const list = raw ? JSON.parse(raw) : [];
      const idx = list.findIndex((c) => c.id === cleanId);
      const existing = idx >= 0 ? list[idx] : {};

      const subStatus = status === 'inactive' ? 'canceled' : status === 'trial' ? 'trialing' : 'active';

      updatedClient = {
        ...existing,
        id: cleanId,
        businessName: cleanName || existing.businessName,
        ownerName: cleanOwner || existing.ownerName,
        businessType: category || existing.businessType || 'General Business',
        email: cleanEmail || existing.email,
        phone: phone !== undefined ? phone : existing.phone || '',
        password: password !== undefined ? password : existing.password || '',
        services: resolvedServices,
        googleReviewUrl: googleReviewUrl || existing.googleReviewUrl,
        planId: planId || existing.planId || 'starter',
        status: status || existing.status || 'active',
        subscriptionStatus: subStatus,
        paidUntil: paidUntil !== undefined ? paidUntil : existing.paidUntil,
        logoUrl: logoUrl !== undefined ? logoUrl : existing.logoUrl || '',
        tagline: tagline !== undefined ? tagline : existing.tagline || '',
        address: address !== undefined ? address : existing.address || '',
        websiteUrl: websiteUrl !== undefined ? websiteUrl : existing.websiteUrl || '',
        instagramUrl: instagramUrl !== undefined ? instagramUrl : existing.instagramUrl || '',
        facebookUrl: facebookUrl !== undefined ? facebookUrl : existing.facebookUrl || '',
        youtubeUrl: youtubeUrl !== undefined ? youtubeUrl : existing.youtubeUrl || '',
        updatedAt: new Date().toISOString(),
      };

      if (idx >= 0) {
        list[idx] = updatedClient;
      } else {
        list.unshift(updatedClient);
      }
      localStorage.setItem('reviewassist_admin_clients', JSON.stringify(list));
    } catch (err) {
      console.warn('Error updating admin client cache:', err);
    }

    // 2. Update in review_assist_businesses
    try {
      const storedBusinesses = getStoredBusinesses();
      const existingBiz = storedBusinesses[cleanId] || {};
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const updatedBiz = {
        ...existingBiz,
        id: cleanId,
        name: cleanName || existingBiz.name,
        category: category || existingBiz.category || 'other',
        services: resolvedServices,
        email: cleanEmail || existingBiz.email,
        phone: phone !== undefined ? phone : existingBiz.phone || '',
        googleReviewUrl: googleReviewUrl || existingBiz.googleReviewUrl || `https://www.google.com/search?q=${encodeURIComponent((cleanName || 'business') + ' Google Reviews')}`,
        planId: planId || existingBiz.planId || 'starter',
        status: status || existingBiz.status || 'active',
        subscriptionStatus: status === 'inactive' ? 'canceled' : status === 'trial' ? 'trialing' : 'active',
        paidUntil: paidUntil !== undefined ? paidUntil : existingBiz.paidUntil,
        logoUrl: logoUrl !== undefined ? logoUrl : existingBiz.logoUrl || '',
        tagline: tagline !== undefined ? tagline : existingBiz.tagline || '',
        address: address !== undefined ? address : existingBiz.address || '',
        websiteUrl: websiteUrl !== undefined ? websiteUrl : existingBiz.websiteUrl || '',
        instagramUrl: instagramUrl !== undefined ? instagramUrl : existingBiz.instagramUrl || '',
        facebookUrl: facebookUrl !== undefined ? facebookUrl : existingBiz.facebookUrl || '',
        youtubeUrl: youtubeUrl !== undefined ? youtubeUrl : existingBiz.youtubeUrl || '',
        shareableUrl: existingBiz.shareableUrl || `${origin}/review/${cleanId}`,
        dashboardUrl: existingBiz.dashboardUrl || `${origin}/dashboard/${cleanId}`,
      };
      saveStoredBusiness(updatedBiz);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('reviewassist:business_updated', {
          detail: { businessId: updatedBiz.id, business: updatedBiz },
        }));
      }
    } catch (err) {
      console.warn('Error updating local business cache:', err);
    }

    // 3. Update in review_assist_users (for dashboard credentials)
    try {
      const users = getStoredUsers();
      let uIdx = users.findIndex((u) => u.businessId === cleanId || (cleanEmail && u.email?.toLowerCase() === cleanEmail));
      const userObj = {
        id: uIdx >= 0 ? users[uIdx].id : `user-${cleanId}`,
        email: cleanEmail || (uIdx >= 0 ? users[uIdx].email : ''),
        password: password || (uIdx >= 0 ? users[uIdx].password : ''),
        name: cleanOwner,
        businessId: cleanId,
        role: 'business_owner',
      };
      if (uIdx >= 0) {
        users[uIdx] = { ...users[uIdx], ...userObj };
      } else {
        users.push(userObj);
      }
      localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users));
    } catch (err) {
      console.warn('Error updating user credentials:', err);
    }

    // 4. Update in review_assist_subscriptions
    try {
      const rawSubs = localStorage.getItem(STORAGE_KEY_SUBSCRIPTIONS);
      const subs = rawSubs ? JSON.parse(rawSubs) : {};
      const subStatus = status === 'inactive' ? 'canceled' : status === 'trial' ? 'trialing' : 'active';
      subs[cleanId] = {
        ...(subs[cleanId] || {}),
        businessId: cleanId,
        planId: planId || subs[cleanId]?.planId || 'starter',
        status: subStatus,
        currentPeriodEnd: paidUntil || subs[cleanId]?.currentPeriodEnd,
      };
      localStorage.setItem(STORAGE_KEY_SUBSCRIPTIONS, JSON.stringify(subs));
    } catch (err) {
      console.warn('Error updating subscription cache:', err);
    }

    // 5. Broadcast sync events
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        const bc = new BroadcastChannel('reviewassist_channel');
        bc.postMessage({ type: 'client_updated', businessId: cleanId, status, client: updatedClient });
        bc.close();
      }
    } catch {}

    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(
      new CustomEvent('reviewassist:status_changed', {
        detail: { businessId: cleanId, status, source: 'admin_edit' },
      })
    );
    window.dispatchEvent(
      new CustomEvent('reviewassist:admin_sync', {
        detail: { businessId: cleanId, client: updatedClient },
      })
    );

    return { success: true, client: updatedClient };
  },

  async getAdminBusinesses() {
    if (!isSupabaseConfigured() || !supabase) return [];

    const { data, error } = await supabase.functions.invoke('admin-manage-client', {
      body: { action: 'list' },
    });
    if (error || !data?.success) {
      throw new Error(error?.message || data?.error || 'Secure admin client list failed.');
    }
    return Array.isArray(data.businesses) ? data.businesses : [];
  },

  async submitManualPaymentRequest({ businessId, planId, billingInterval, amount, upiReference, customerNote = '' }) {
    const cleanId = businessId?.trim();
    if (!cleanId || !planId || !billingInterval || !upiReference?.trim()) {
      throw new Error('Business, plan, billing interval, and UPI reference are required.');
    }

    if (isSupabaseConfigured() && supabase && !cleanId.startsWith('demo-')) {
      const request = {
        id: `upi-${globalThis.crypto?.randomUUID ? globalThis.crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`}`,
        business_id: cleanId,
        plan_id: planId,
        billing_interval: billingInterval,
        amount: Number(amount) || 0,
        upi_reference: upiReference.trim(),
        customer_note: customerNote.trim(),
      };
      const { data, error } = await supabase
        .from('manual_payment_requests')
        .insert(request)
        .select('*')
        .single();
      if (error) throw new Error(`Could not submit UPI payment request: ${error.message}`);
      return data;
    }

    const request = {
      id: `upi-${Date.now()}`,
      business_id: cleanId,
      plan_id: planId,
      billing_interval: billingInterval,
      amount: Number(amount) || 0,
      upi_reference: upiReference.trim(),
      customer_note: customerNote.trim(),
      status: 'pending',
      created_at: new Date().toISOString(),
    };
    const stored = JSON.parse(localStorage.getItem('reviewassist_manual_payment_requests') || '[]');
    stored.unshift(request);
    localStorage.setItem('reviewassist_manual_payment_requests', JSON.stringify(stored));
    return request;
  },

  async getManualPaymentRequests() {
    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase
        .from('manual_payment_requests')
        .select('*, businesses(name, email)')
        .order('created_at', { ascending: false });
      if (error) throw new Error(`Could not load UPI payment requests: ${error.message}`);
      return data || [];
    }

    return JSON.parse(localStorage.getItem('reviewassist_manual_payment_requests') || '[]');
  },

  async reviewManualPayment(requestId, decision, rejectionReason = '') {
    if (!isSupabaseConfigured() || !supabase) {
      throw new Error('Manual payment approval requires configured Supabase mode.');
    }
    const { data, error } = await supabase.functions.invoke('admin-manage-client', {
      body: {
        action: 'review-manual-payment',
        requestId,
        decision,
        rejectionReason,
      },
    });
    if (error || !data?.success) {
      throw new Error(error?.message || data?.error || 'Could not review manual payment.');
    }
    return data;
  },

  /**
   * Helper to retrieve credentials for a client
   */
  getClientCredentials(clientIdOrEmail) {
    const clean = clientIdOrEmail?.trim().toLowerCase();
    if (!clean) return { email: '', password: '' };

    let foundPassword = '';
    let foundEmail = clean;
    let businessName = '';
    let ownerName = '';
    let phone = '';

    // Check reviewassist_admin_clients
    try {
      const rawClients = localStorage.getItem('reviewassist_admin_clients');
      const clients = rawClients ? JSON.parse(rawClients) : [];
      const c = clients.find((item) => item.id?.toLowerCase() === clean || item.email?.toLowerCase() === clean);
      if (c) {
        foundPassword = c.password || '';
        foundEmail = c.email || clean;
        businessName = c.businessName || '';
        ownerName = c.ownerName || '';
        phone = c.phone || '';
      }
    } catch {}

    // Check getStoredUsers
    if (!foundPassword) {
      try {
        const users = getStoredUsers();
        const u = users.find((user) => user.businessId?.toLowerCase() === clean || user.email?.toLowerCase() === clean);
        if (u) {
          foundPassword = u.password || '';
          if (!foundEmail) foundEmail = u.email || '';
          if (!ownerName) ownerName = u.name || '';
        }
      } catch {}
    }

    return {
      email: foundEmail,
      password: foundPassword || '',
      businessName,
      ownerName,
      phone,
      loginUrl: typeof window !== 'undefined' ? `${window.location.origin}/login` : '/login',
    };
  },

  /**
   * Submit Private Feedback (Negative Review Shield Interceptor)
   */
  async submitPrivateFeedback({
    businessId,
    serviceType = 'General Service',
    rating = 2,
    issue = '',
    customerName = 'Anonymous Customer',
    customerContact = '',
    customerEmail = '',
    preferredResolution = 'Phone call from owner/manager',
  }) {
    const cleanId = businessId || 'demo-1';

    const feedback = {
      id: 'fb-' + Math.random().toString(36).substring(2, 9),
      businessId: cleanId,
      serviceType: serviceType || 'General Service',
      rating: Number(rating) || 2,
      issue: issue.trim(),
      customerName: customerName.trim() || 'Anonymous Customer',
      customerContact: customerContact.trim(),
      customerEmail: customerEmail.trim(),
      preferredResolution: preferredResolution || 'Owner reach out',
      status: 'pending', // 'pending' | 'resolved'
      createdAt: new Date().toISOString(),
    };

    if (isSupabaseConfigured() && supabase && !cleanId.startsWith('demo-')) {
      const { error } = await supabase.from('private_feedback').insert({
        id: feedback.id,
        business_id: cleanId,
        service_type: feedback.serviceType,
        rating: feedback.rating,
        issue: feedback.issue,
        customer_name: feedback.customerName,
        customer_contact: feedback.customerContact,
        customer_email: feedback.customerEmail,
        preferred_resolution: feedback.preferredResolution,
        status: feedback.status,
        created_at: feedback.createdAt,
      });
      if (error) {
        throw new Error(`Could not save private feedback to Supabase: ${error.message}`);
      }
    } else {
      saveStoredPrivateFeedback(feedback);
    }

    const biz = await this.getBusiness(cleanId, { isPublic: true });

    try {
      if (typeof BroadcastChannel !== 'undefined') {
        const bc = new BroadcastChannel('reviewassist_channel');
        bc.postMessage({ type: 'feedback_submitted', businessId: cleanId, feedback });
        setTimeout(() => bc.close(), 100);
      }
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('storage'));
        window.dispatchEvent(new CustomEvent('reviewassist:feedback_submitted', { detail: { businessId: cleanId, feedback } }));
      }
    } catch {}

    return {
      success: true,
      feedbackId: feedback.id,
      businessName: biz.name || 'Local Business',
      ownerPhone: biz.phone || '',
      ownerEmail: biz.email || '',
      googleReviewUrl: resolveGoogleReviewUrl(biz.googleReviewUrl, biz.name),
    };
  },

  /**
   * Get Private Feedbacks for a business
   */
  async getPrivateFeedback(businessId) {
    const cleanId = businessId || 'demo-1';
    if (isSupabaseConfigured() && supabase && !cleanId.startsWith('demo-')) {
      const { data, error } = await supabase
        .from('private_feedback')
        .select('*')
        .eq('business_id', cleanId)
        .order('created_at', { ascending: false });
      if (error) {
        throw new Error(`Could not load private feedback from Supabase: ${error.message}`);
      }
      return (data || []).map((row) => ({
        id: row.id,
        businessId: row.business_id,
        serviceType: row.service_type,
        rating: row.rating,
        issue: row.issue,
        customerName: row.customer_name,
        customerContact: row.customer_contact,
        customerEmail: row.customer_email,
        preferredResolution: row.preferred_resolution,
        status: row.status,
        resolvedAt: row.resolved_at,
        resolutionNote: row.resolution_note,
        createdAt: row.created_at,
      }));
    }
    return getStoredPrivateFeedback(cleanId);
  },

  /**
   * Update Private Feedback Resolution Status
   */
  async updatePrivateFeedbackStatus(businessId, feedbackId, status, resolutionNote = '') {
    const cleanId = businessId || 'demo-1';
    if (isSupabaseConfigured() && supabase && !cleanId.startsWith('demo-')) {
      const { data, error } = await supabase
        .from('private_feedback')
        .update({
          status,
          resolved_at: status === 'resolved' ? new Date().toISOString() : null,
          resolution_note: status === 'resolved' ? resolutionNote : '',
        })
        .eq('id', feedbackId)
        .eq('business_id', cleanId)
        .select('*')
        .maybeSingle();
      if (error) {
        throw new Error(`Could not update private feedback in Supabase: ${error.message}`);
      }
      return { success: true, item: data };
    }
    try {
      const raw = localStorage.getItem(STORAGE_KEY_PRIVATE_FEEDBACK);
      const parsed = raw ? JSON.parse(raw) : { ...DEFAULT_PRIVATE_FEEDBACK };
      const list = parsed[cleanId] || DEFAULT_PRIVATE_FEEDBACK[cleanId] || [];
      const item = list.find((f) => f.id === feedbackId);
      if (item) {
        item.status = status;
        if (status === 'resolved') {
          item.resolvedAt = new Date().toISOString();
          item.resolutionNote = resolutionNote;
        }
        parsed[cleanId] = list;
        localStorage.setItem(STORAGE_KEY_PRIVATE_FEEDBACK, JSON.stringify(parsed));
      }
      return { success: true, item };
    } catch (err) {
      console.warn('Error updating private feedback status:', err);
      return { success: false };
    }
  },

  /**
   * Get Total Intercepted Count across all businesses (for admin & stats)
   */
  async getAllPrivateFeedbackStats() {
    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase
        .from('private_feedback')
        .select('status');
      if (error) {
        throw new Error(`Could not load private feedback stats: ${error.message}`);
      }
      const rows = data || [];
      return {
        total: rows.length,
        pending: rows.filter((item) => item.status !== 'resolved').length,
        resolved: rows.filter((item) => item.status === 'resolved').length,
      };
    }

    try {
      const raw = localStorage.getItem(STORAGE_KEY_PRIVATE_FEEDBACK);
      const parsed = raw ? JSON.parse(raw) : { ...DEFAULT_PRIVATE_FEEDBACK };
      let total = 0;
      let pending = 0;
      let resolved = 0;
      Object.values(parsed).forEach((list) => {
        if (Array.isArray(list)) {
          total += list.length;
          list.forEach((item) => {
            if (item.status === 'resolved') resolved++;
            else pending++;
          });
        }
      });
      return { total, pending, resolved };
    } catch {
      return { total: 2, pending: 1, resolved: 1 };
    }
  },

  /**
   * Submit a new lead / contact inquiry
   * Saves to Supabase 'leads' table and syncs to localStorage fallback
   */
  async submitLead({
    ownerName,
    businessName,
    businessType,
    customBusinessType = '',
    services = [],
    locations,
    email,
    phone,
    googleProfileUrl = '',
    message = '',
  }) {
    const leadId = `lead-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    const nowIso = new Date().toISOString();

    const effectiveType =
      businessType === 'other' && customBusinessType?.trim()
        ? customBusinessType.trim()
        : businessType || '';

    const leadObject = {
      id: leadId,
      ownerName: ownerName?.trim() || '',
      businessName: businessName?.trim() || '',
      businessType: effectiveType,
      rawCategory: businessType || '',
      customBusinessType: customBusinessType?.trim() || '',
      services: Array.isArray(services) ? services : [],
      locations: locations || '',
      email: email?.trim().toLowerCase() || '',
      phone: phone?.trim() || '',
      googleProfileUrl: googleProfileUrl?.trim() || '',
      message: message?.trim() || '',
      status: 'new',
      submittedAt: nowIso,
      createdAt: nowIso,
    };

    // 1. Try Supabase first
    if (isSupabaseConfigured() && supabase) {
      try {
        const insertPayload = {
          id: leadId,
          owner_name: leadObject.ownerName,
          business_name: leadObject.businessName,
          business_type: leadObject.businessType,
          locations: leadObject.locations,
          email: leadObject.email,
          phone: leadObject.phone,
          google_profile_url: leadObject.googleProfileUrl,
          message: leadObject.message,
          services: leadObject.services,
          status: 'new',
          created_at: nowIso,
        };

        let { error } = await supabase.from('leads').insert([insertPayload]);

        if (error && error.message?.includes('services')) {
          // If Supabase table does not yet have services column, retry without services column
          const retryPayload = { ...insertPayload };
          delete retryPayload.services;
          const retry = await supabase.from('leads').insert([retryPayload]);
          error = retry.error;
        }

        if (error) {
          throw new Error(`Could not save lead to Supabase: ${error.message}`);
        } else {
          console.log('Lead saved to Supabase:', leadId);
        }
      } catch (err) {
        throw err instanceof Error
          ? err
          : new Error('Could not save lead to Supabase.');
      }
    }

    // LocalStorage is only the explicit demo-mode fallback.
    if (isSupabaseConfigured() && supabase) {
      return { success: true, lead: leadObject };
    }

    // 2. Persist local demo leads for instant offline/admin syncing.
    try {
      const raw = localStorage.getItem('reviewassist_admin_leads');
      const leads = raw ? JSON.parse(raw) : [];
      leads.unshift(leadObject);
      localStorage.setItem('reviewassist_admin_leads', JSON.stringify(leads));

      // 3. Dispatch multi-channel events for instant live admin inbox updating
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new CustomEvent('reviewassist:lead_submitted', { detail: leadObject }));
      if (typeof BroadcastChannel !== 'undefined') {
        const bc = new BroadcastChannel('reviewassist_leads_channel');
        bc.postMessage({ type: 'NEW_LEAD', lead: leadObject });
        bc.close();
      }
    } catch (saveErr) {
      console.warn('Could not save lead to localStorage:', saveErr);
    }

    return { success: true, lead: leadObject };
  },

  /**
   * Get all Leads / Inquiries for Admin Inbox
   * Fetches from Supabase 'leads' table with fallback to localStorage and demo defaults
   */
  async getLeads() {
    let supabaseLeads = [];
    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) {
        throw new Error(`Could not load leads from Supabase: ${error.message}`);
      }
      if (Array.isArray(data)) {
        supabaseLeads = data.map((row) => {
          const rawSrv = Array.isArray(row.services)
            ? row.services
            : typeof row.services === 'string' && row.services.trim()
            ? row.services.split(',').map((s) => s.trim()).filter(Boolean)
            : [];
          return {
            id: row.id,
            ownerName: row.owner_name || row.ownerName || '',
            businessName: row.business_name || row.businessName || '',
            businessType: row.business_type || row.businessType || '',
            locations: row.locations || '',
            email: row.email || '',
            phone: row.phone || '',
            googleProfileUrl: row.google_profile_url || row.googleProfileUrl || '',
            message: row.message || '',
            status: row.status || 'new',
            services: resolveEffectiveServices(rawSrv, row.business_type || ''),
            submittedAt: row.created_at || row.createdAt || new Date().toISOString(),
          };
        });
      }

      return supabaseLeads.filter((l) => !['req-001', 'req-002', 'req-003'].includes(l.id));
    }

    // Read local leads
    let localLeads = [];
    try {
      const raw = localStorage.getItem('reviewassist_admin_leads');
      if (raw) localLeads = JSON.parse(raw);
    } catch {}

    // Filter out any legacy demo IDs
    const demoIds = ['req-001', 'req-002', 'req-003'];
    supabaseLeads = supabaseLeads.filter((l) => !demoIds.includes(l.id));
    localLeads = localLeads.filter((l) => !demoIds.includes(l.id));

    // Merge without duplicates by ID, enriching Supabase leads with local rich fields (services, google link)
    const map = new Map();
    // Put Supabase leads first
    supabaseLeads.forEach((l) => map.set(l.id, { ...l }));
    // Merge local leads
    localLeads.forEach((l) => {
      if (!map.has(l.id)) {
        map.set(l.id, { ...l });
      } else {
        const existing = map.get(l.id);
        if (isGenericOrEmptyServices(existing.services) && Array.isArray(l.services) && l.services.length > 0) {
          existing.services = l.services;
        }
        if (!existing.googleProfileUrl && l.googleProfileUrl) {
          existing.googleProfileUrl = l.googleProfileUrl;
        }
        if (!existing.message && l.message) {
          existing.message = l.message;
        }
        if (!existing.phone && l.phone) {
          existing.phone = l.phone;
        }
      }
    });

    const combined = Array.from(map.values());
    // Sort newest first
    combined.sort((a, b) => {
      const da = new Date(a.submittedAt || a.createdAt || 0).getTime();
      const db = new Date(b.submittedAt || b.createdAt || 0).getTime();
      return db - da;
    });

    return combined;
  },

  /**
   * Update a lead's status (new -> in_progress -> done)
   */
  async updateLeadStatus(leadId, status) {
    if (isSupabaseConfigured() && supabase) {
      const { error } = await supabase
        .from('leads')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', leadId);
      if (error) {
        throw new Error(`Could not update lead in Supabase: ${error.message}`);
      }
      return { success: true };
    }

    // Also update in localStorage
    try {
      const raw = localStorage.getItem('reviewassist_admin_leads');
      if (raw) {
        const list = JSON.parse(raw);
        const item = list.find((l) => l.id === leadId);
        if (item) {
          item.status = status;
          localStorage.setItem('reviewassist_admin_leads', JSON.stringify(list));
        }
      }
      window.dispatchEvent(new Event('storage'));
      if (typeof BroadcastChannel !== 'undefined') {
        const bc = new BroadcastChannel('reviewassist_leads_channel');
        bc.postMessage({ type: 'UPDATE_LEAD', leadId, status });
        bc.close();
      }
    } catch {}

    return { success: true };
  },

  /**
   * Delete a lead from inbox
   */
  async deleteLead(leadId) {
    if (isSupabaseConfigured() && supabase) {
      const { error } = await supabase.from('leads').delete().eq('id', leadId);
      if (error) {
        throw new Error(`Could not delete lead from Supabase: ${error.message}`);
      }
      return { success: true };
    }

    try {
      const raw = localStorage.getItem('reviewassist_admin_leads');
      if (raw) {
        const list = JSON.parse(raw);
        const filtered = list.filter((l) => l.id !== leadId);
        localStorage.setItem('reviewassist_admin_leads', JSON.stringify(filtered));
      }
      window.dispatchEvent(new Event('storage'));
      if (typeof BroadcastChannel !== 'undefined') {
        const bc = new BroadcastChannel('reviewassist_leads_channel');
        bc.postMessage({ type: 'DELETE_LEAD', leadId });
        bc.close();
      }
    } catch {}

    return { success: true };
  },

  /**
   * Fetch team members for a business workspace
   */
  async getTeamMembers(businessId) {
    let list = [];
    if (isSupabaseConfigured() && supabase && businessId && !businessId.startsWith('demo-')) {
      try {
        const { data, error } = await supabase
          .from('team_members')
          .select('*')
          .eq('business_id', businessId)
          .order('invited_at', { ascending: false });
        if (!error && Array.isArray(data)) {
          list = data.map((m) => ({
            id: m.id,
            businessId: m.business_id,
            email: m.email,
            name: m.name,
            role: m.role || 'business_staff',
            status: m.status || 'active',
            invitedAt: m.invited_at,
          }));
        }
      } catch (err) {
        console.warn('Error fetching team members from Supabase:', err);
      }
    }

    if (list.length === 0 && !isSupabaseConfigured()) {
      try {
        const raw = localStorage.getItem('reviewassist_team_members');
        if (raw) {
          const parsed = JSON.parse(raw);
          list = parsed.filter((m) => m.businessId === businessId);
        }
      } catch {}
    }

    return list;
  },

  /**
   * Save / invite a new team member
   */
  async saveTeamMember(businessId, member) {
    const cleanId = member.id || `mem-${Math.random().toString(36).substring(2, 8)}`;
    const cleanEmail = member.email.trim().toLowerCase();

    if (isSupabaseConfigured() && supabase && businessId && !businessId.startsWith('demo-')) {
      try {
        const row = {
          id: cleanId,
          business_id: businessId,
          email: cleanEmail,
          name: member.name.trim(),
          role: member.role || 'business_staff',
          status: member.status || 'active',
          invited_at: member.invitedAt || new Date().toISOString(),
        };
        await supabase.from('team_members').upsert([row]);
      } catch (err) {
        console.warn('Error saving team member to Supabase:', err);
      }
    }

    try {
      const raw = localStorage.getItem('reviewassist_team_members');
      const team = raw ? JSON.parse(raw) : [];
      const updated = [
        { ...member, id: cleanId, businessId, email: cleanEmail },
        ...team.filter((m) => m.id !== cleanId && m.email !== cleanEmail),
      ];
      localStorage.setItem('reviewassist_team_members', JSON.stringify(updated));

      // Also register into users store so staff can log in
      const users = getStoredUsers();
      if (!users.some((u) => u.email?.toLowerCase() === cleanEmail)) {
        users.push({
          email: cleanEmail,
          name: member.name,
          businessId,
          role: member.role || 'business_staff',
          password: member.password || 'staff123',
        });
        localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users));
      }
    } catch {}

    return { ...member, id: cleanId, businessId };
  },

  /**
   * Save / sync team members list (called by AuthContext)
   */
  async saveTeamMembers(businessId, members) {
    if (!Array.isArray(members)) return { success: true };
    if (isSupabaseConfigured() && supabase && businessId && !businessId.startsWith('demo-')) {
      try {
        const rows = members.map((m) => ({
          id: m.id || `mem-${Math.random().toString(36).substring(2, 8)}`,
          business_id: businessId,
          email: (m.email || '').trim().toLowerCase(),
          name: (m.name || '').trim(),
          role: m.role || 'business_staff',
          status: m.status || 'active',
          invited_at: m.invitedAt || new Date().toISOString(),
        }));
        await supabase.from('team_members').upsert(rows);
      } catch (err) {
        console.warn('Error syncing team members to Supabase:', err);
      }
    }
    try {
      localStorage.setItem('reviewassist_team_members', JSON.stringify(members));
      // Register into users store so staff can log in
      const users = getStoredUsers();
      for (const m of members) {
        const cleanEmail = (m.email || '').trim().toLowerCase();
        if (cleanEmail) {
          const existingIdx = users.findIndex((u) => u.email?.toLowerCase() === cleanEmail);
          const staffUserObj = {
            id: m.id || `user-${Date.now()}`,
            email: cleanEmail,
            name: m.name,
            businessId,
            role: m.role || 'business_staff',
            password: m.password || 'staff123',
          };
          if (existingIdx >= 0) {
            users[existingIdx] = { ...users[existingIdx], ...staffUserObj };
          } else {
            users.push(staffUserObj);
          }
        }
      }
      localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users));
    } catch {}
    return { success: true, count: members.length };
  },

  /**
   * Remove a team member
   */
  async removeTeamMember(businessId, memberId) {
    if (isSupabaseConfigured() && supabase && businessId && !businessId.startsWith('demo-')) {
      try {
        await supabase.from('team_members').delete().eq('id', memberId);
      } catch (err) {
        console.warn('Error removing team member from Supabase:', err);
      }
    }
    try {
      const raw = localStorage.getItem('reviewassist_team_members');
      if (raw) {
        const team = JSON.parse(raw);
        const filtered = team.filter((m) => m.id !== memberId);
        localStorage.setItem('reviewassist_team_members', JSON.stringify(filtered));
      }
    } catch {}
    return { success: true };
  },

  /**
   * Directly save / update a stored business profile (offline / cache helper)
   */
  saveStoredBusiness(biz) {
    saveStoredBusiness(biz);
  },

  /**
   * Update Google Review Link for a business in Supabase and local storage
   */
  async updateGoogleReviewLink(businessId, link) {
    const cleanId = businessId || 'demo-1';
    const cleanLink = (link || '').trim();

    if (isSupabaseConfigured() && supabase && !cleanId.startsWith('demo-')) {
      try {
        const { error } = await supabase
          .from('businesses')
          .update({
            google_review_link: cleanLink,
            google_review_url: cleanLink,
          })
          .eq('id', cleanId);

        if (error) {
          console.warn('Supabase updateGoogleReviewLink error:', error);
          throw new Error(error.message || 'Failed to update Google Review link in Supabase.');
        }
      } catch (err) {
        console.warn('updateGoogleReviewLink error:', err);
        throw err;
      }
    }

    try {
      const stored = getStoredBusinesses();
      if (stored[cleanId]) {
        stored[cleanId] = {
          ...stored[cleanId],
          google_review_link: cleanLink,
          googleReviewLink: cleanLink,
          google_review_url: cleanLink,
          googleReviewUrl: cleanLink,
        };
        localStorage.setItem(STORAGE_KEY_BUSINESSES, JSON.stringify(stored));
      }
    } catch {}

    try {
      const rawClients = localStorage.getItem('reviewassist_admin_clients');
      if (rawClients) {
        const clients = JSON.parse(rawClients);
        const c = clients.find((item) => item.id === cleanId);
        if (c) {
          c.googleReviewLink = cleanLink;
          c.googleReviewUrl = cleanLink;
          c.google_review_link = cleanLink;
          localStorage.setItem('reviewassist_admin_clients', JSON.stringify(clients));
        }
      }
    } catch {}

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('reviewassist:status_changed', { detail: { businessId: cleanId } }));
    }

    return { success: true, google_review_link: cleanLink, googleReviewUrl: cleanLink };
  },

};
