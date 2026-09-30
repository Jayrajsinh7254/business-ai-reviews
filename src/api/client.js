/**
 * API Client for review-assist
 * Seamlessly connects to Supabase backend when configured,
 * with fallback to local simulation for offline testing.
 */
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

// In-memory / localStorage mock store for offline/standalone testing
const STORAGE_KEY_TOKEN = 'review_assist_token';
const STORAGE_KEY_BUSINESSES = 'review_assist_businesses';
const STORAGE_KEY_REVIEWS = 'review_assist_reviews';
const STORAGE_KEY_USERS = 'review_assist_users';
const STORAGE_KEY_SUBSCRIPTIONS = 'review_assist_subscriptions';
const STORAGE_KEY_TEAM = 'review_assist_team';

// Default initial demo business data
const DEFAULT_BUSINESSES = {
  'demo-1': {
    id: 'demo-1',
    name: 'Apex Auto Care & Diagnostics',
    category: 'automobile',
    services: ['Full Synthetic Oil Change', 'Brake Pad Replacement', 'Engine Diagnostic', 'Tire Rotation & Balance', 'AC System Recharge'],
    googleReviewUrl: 'https://search.google.com/local/writereview?placeid=ChIJN1t_tDeuEmsRUsoyG83frY4',
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    planId: 'pro',
    status: 'active',
    subscriptionStatus: 'active',
    paidUntil: '2026-10-25',
  },
  'demo-2': {
    id: 'demo-2',
    name: 'Lumina Skin & Hair Studio',
    category: 'salon',
    services: ['Balayage & Hair Styling', 'HydraFacial Glow', 'Keratin Smoothing Treatment', 'Gel Manicure & Pedicure'],
    googleReviewUrl: 'https://search.google.com/local/writereview?placeid=ChIJN1t_tDeuEmsRUsoyG83frY4',
    createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
    planId: 'starter',
    status: 'active',
    subscriptionStatus: 'active',
    paidUntil: '2026-10-25',
  },
  'demo-3': {
    id: 'demo-3',
    name: 'Apex Auto - West Coast Hub',
    category: 'automobile',
    services: ['Complete Transmission Flush', 'EV Battery Diagnostics', 'Hybrid Service'],
    googleReviewUrl: 'https://search.google.com/local/writereview',
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    planId: 'enterprise',
    status: 'active',
    subscriptionStatus: 'active',
    paidUntil: '2026-10-25',
  },
  'rajesh-auto-q3f2': {
    id: 'rajesh-auto-q3f2',
    name: 'Rajesh Auto Garage',
    category: 'automobile',
    services: ['General Auto Service', 'Oil & Filter Change', 'Engine Tuning', 'Brake Inspection'],
    googleReviewUrl: 'https://search.google.com/local/writereview',
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    planId: 'starter',
    status: 'active',
    subscriptionStatus: 'active',
    paidUntil: '2026-10-25',
  },
  'fitzone-gym-v7r3': {
    id: 'fitzone-gym-v7r3',
    name: 'FitZone Gym',
    category: 'gym',
    services: ['Personal Training', 'CrossFit', 'Cardio & Strength', 'Nutrition Guidance'],
    googleReviewUrl: 'https://search.google.com/local/writereview',
    createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
    planId: 'enterprise',
    status: 'inactive',
    subscriptionStatus: 'inactive',
    paidUntil: '2026-09-10',
  },
};

// Default initial demo users for mock login
const DEFAULT_USERS = [
  {
    email: 'admin@reviewassist.ai',
    password: 'password123',
    businessId: 'demo-1',
    name: 'Alex Rivera (SaaS Admin)',
    role: 'super_admin',
    isSuperAdmin: true,
  },
  {
    email: 'admin@apexauto.com',
    password: 'password123',
    businessId: 'demo-1',
    name: 'Marcus Vance (Apex Owner)',
    role: 'business_owner',
  },
  {
    email: 'owner@apexauto.com',
    password: 'password123',
    businessId: 'demo-1',
    name: 'Marcus Vance (Apex Owner)',
    role: 'business_owner',
  },
  {
    email: 'staff@apexauto.com',
    password: 'password123',
    businessId: 'demo-1',
    name: 'Elena Rostova (Front Desk)',
    role: 'business_staff',
  },
  {
    email: 'admin@lumina.com',
    password: 'password123',
    businessId: 'demo-2',
    name: 'Lumina Studio Admin',
    role: 'business_owner',
  },
  {
    email: 'demo@reviewassist.ai',
    password: 'password123',
    businessId: 'demo-1',
    name: 'Demo User',
    role: 'business_owner',
  },
];

const DEFAULT_SUBSCRIPTIONS = {
  'demo-1': {
    businessId: 'demo-1',
    planId: 'pro',
    status: 'active',
    billingInterval: 'monthly',
    amount: 49,
    currentPeriodEnd: new Date(Date.now() + 24 * 24 * 60 * 60 * 1000).toISOString(),
    aiGenerationsUsed: 48,
    whatsappInvitesUsed: 72,
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
  },
  'demo-2': {
    businessId: 'demo-2',
    planId: 'starter',
    status: 'active',
    billingInterval: 'monthly',
    amount: 19,
    currentPeriodEnd: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    aiGenerationsUsed: 22,
    whatsappInvitesUsed: 35,
    createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
  },
  'demo-3': {
    businessId: 'demo-3',
    planId: 'enterprise',
    status: 'active',
    billingInterval: 'monthly',
    amount: 99,
    currentPeriodEnd: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toISOString(),
    aiGenerationsUsed: 140,
    whatsappInvitesUsed: 310,
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
  },
};

const DEFAULT_TEAM_MEMBERS = {
  'demo-1': [
    {
      id: 'mem-1',
      businessId: 'demo-1',
      email: 'owner@apexauto.com',
      name: 'Marcus Vance',
      role: 'business_owner',
      status: 'active',
      invitedAt: new Date(Date.now() - 30 * 86400000).toISOString(),
    },
    {
      id: 'mem-2',
      businessId: 'demo-1',
      email: 'staff@apexauto.com',
      name: 'Elena Rostova',
      role: 'business_staff',
      status: 'active',
      invitedAt: new Date(Date.now() - 15 * 86400000).toISOString(),
    },
    {
      id: 'mem-3',
      businessId: 'demo-1',
      email: 'service@apexauto.com',
      name: 'Liam Scott',
      role: 'business_staff',
      status: 'active',
      invitedAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    },
  ],
  'demo-2': [
    {
      id: 'mem-4',
      businessId: 'demo-2',
      email: 'admin@lumina.com',
      name: 'Sophia Chang',
      role: 'business_owner',
      status: 'active',
      invitedAt: new Date(Date.now() - 60 * 86400000).toISOString(),
    },
  ],
};

const DEFAULT_REVIEWS = {
  'demo-1': [
    {
      id: 'rev-101',
      businessId: 'demo-1',
      serviceType: 'Brake Pad Replacement',
      rating: 5,
      text: 'Had an outstanding experience getting my brake pads replaced. The technicians diagnosed the squeaking sound within minutes, explained everything transparently, and got me back on the road in under two hours. Clean waiting lounge and super friendly staff!',
      whatStoodOut: 'Fast turnaround time and honest pricing without pushy upselling.',
      whatCouldImprove: 'Coffee machine in the lounge was out of order.',
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'rev-102',
      businessId: 'demo-1',
      serviceType: 'Full Synthetic Oil Change',
      rating: 5,
      text: 'Super efficient oil change and complimentary 20-point safety inspection. The team treated my car with utmost care and even wiped down the dashboard. Highly recommend Apex Auto Care!',
      whatStoodOut: 'Attention to detail and warm customer service.',
      whatCouldImprove: '',
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'rev-103',
      businessId: 'demo-1',
      serviceType: 'Engine Diagnostic',
      rating: 4,
      text: 'Great diagnostic work! They pinpointed a tricky check-engine light issue that another shop missed. The bill was reasonable. Would definitely return.',
      whatStoodOut: 'Master mechanics who clearly know modern engine systems.',
      whatCouldImprove: 'Waited about 15 minutes past appointment time before car was taken in.',
      createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'rev-104',
      businessId: 'demo-1',
      serviceType: 'AC System Recharge',
      rating: 5,
      text: 'Brought my car in on a 95-degree day with warm air blowing. They recharged the AC system promptly and it has been ice cold ever since! Top notch service.',
      whatStoodOut: 'Prompt service on short notice.',
      whatCouldImprove: '',
      createdAt: new Date(Date.now() - 22 * 24 * 60 * 60 * 1000).toISOString(),
    }
  ]
};

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
    users.push(user);
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

const DEFAULT_PRIVATE_FEEDBACK = {
  'demo-1': [
    {
      id: 'fb-demo-1',
      businessId: 'demo-1',
      serviceType: 'Brake Inspection',
      rating: 2,
      issue: 'Wait time was 45 minutes longer than quoted and no one gave me an update while waiting in the lobby.',
      customerName: 'Vikram Mehta',
      customerContact: '+91 98221 44332',
      customerEmail: 'vikram.mehta@gmail.com',
      preferredResolution: 'Phone call from owner/manager',
      status: 'pending',
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'fb-demo-2',
      businessId: 'demo-1',
      serviceType: 'Oil Change',
      rating: 3,
      issue: 'Service was done properly, but invoice charges were confusing without line-item explanation.',
      customerName: 'Pooja Patel',
      customerContact: '+91 97123 88990',
      customerEmail: 'pooja.p@yahoo.com',
      preferredResolution: 'Apology & explanation',
      status: 'resolved',
      resolvedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
      resolutionNote: 'Called Pooja, explained line items and offered 10% coupon on next service. Issue resolved peacefully!',
      createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ],
};

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

/**
 * Ring buffer tracking recently generated drafts to prevent repeats across successive regenerations
 */
const recentDraftsHistory = [];

/**
 * Intelligent AI draft review generator fallback with authentic, human-sounding variations
 */
function generateMockDraft({ serviceType, whatStoodOut, whatCouldImprove, rating = 5, previousDraft = '' }) {
  const service = serviceType ? serviceType.trim() : '';
  const serviceLower = service ? service.toLowerCase() : '';
  const cleanStoodOut = whatStoodOut ? whatStoodOut.trim().replace(/[.,!]+$/, '') : 'friendly team and prompt service';
  const cleanImprove = whatCouldImprove ? whatCouldImprove.trim().replace(/[.,!]+$/, '') : '';
  const stars = Number(rating) || 5;
  const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : '');

  const svcRef = serviceLower ? serviceLower : 'service';
  const svcPhrase = serviceLower ? `for ${serviceLower}` : 'today';

  const five = [
    `Came in ${svcPhrase} and they completely exceeded my expectations. ${cap(cleanStoodOut)}. The crew was transparent, quick, and very easy to talk to. Will definitely be coming back.`,
    `Solid experience from start to finish. ${cap(cleanStoodOut)} made a real difference. No pushy upsells, fair pricing, and they wrapped up right on schedule.`,
    `Had my ${svcRef} taken care of here and couldn't be happier. ${cap(cleanStoodOut)}. It's rare to find this level of attention to detail and honest customer care.`,
    `First time visiting this spot and I was genuinely impressed. ${cap(cleanStoodOut)}. Everything was clearly explained upfront and handled professionally.`,
    `Super smooth visit ${svcPhrase}. ${cap(cleanStoodOut)}. Staff was welcoming from the minute I walked in. Highly recommend them to anyone in the area.`,
    `What stood out most was ${cleanStoodOut.toLowerCase()}. They got the ${svcRef} done quickly without cutting corners. Honest, skilled, and reliable.`,
    `Took a chance on them for ${svcRef} based on reviews, and they totally delivered. ${cap(cleanStoodOut)}. Transparent pricing and top-tier professionalism.`,
    `Really appreciate how courteous and thorough everyone was. ${cap(cleanStoodOut)}. Left feeling like a valued customer rather than just another transaction.`,
    `Quick, painless, and high quality. ${cap(cleanStoodOut)}. You can tell the team takes genuine pride in what they do. 10/10 experience.`,
    `Deserves every bit of a 5-star rating. ${cap(cleanStoodOut)}. Handled my ${svcRef} promptly with great communication throughout.`,
    `From reception to completion, everything was seamless. ${cap(cleanStoodOut)}. Will definitely recommend them to friends and family.`,
    `Clean facility, respectful team, and great turnaround. ${cap(cleanStoodOut)}. Couldn't ask for better service.`,
    `I rarely leave reviews, but these folks earned it. ${cap(cleanStoodOut)}. Done on time and exactly as promised.`,
    `Professional, courteous, and efficient. Getting ${svcRef} handled here was completely stress-free. ${cap(cleanStoodOut)}. Definitely my new go-to.`,
  ];

  const four = [
    `Good visit overall ${svcPhrase}. ${cap(cleanStoodOut)}. ${cleanImprove ? `Only small downside was ${cleanImprove.toLowerCase()}, but they handled everything else nicely.` : 'Turnaround was quick and communication was clear.'} Would gladly use them again.`,
    `Solid 4-star experience getting ${svcRef} done. ${cap(cleanStoodOut)}. ${cleanImprove ? `Room for improvement on ${cleanImprove.toLowerCase()}, though.` : 'Pricing was reasonable and staff was polite.'} Recommended.`,
    `Pleasantly surprised by the service. ${cap(cleanStoodOut)}. ${cleanImprove ? `Minor hitch with ${cleanImprove.toLowerCase()}, but not a dealbreaker.` : 'Good quality work and respectful team.'} Happy with the outcome.`,
    `Reliable team for ${svcRef}. ${cap(cleanStoodOut)}. ${cleanImprove ? `Could tighten up ${cleanImprove.toLowerCase()}, but` : 'Overall'} they did solid, trustworthy work.`,
    `Decent turnaround and courteous staff. ${cap(cleanStoodOut)}. ${cleanImprove ? `Hope they address ${cleanImprove.toLowerCase()} in the future.` : 'Very satisfactory visit.'}`,
    `Went in ${svcPhrase} and had a largely positive experience. ${cap(cleanStoodOut)}. ${cleanImprove ? `Just wish ${cleanImprove.toLowerCase()} was a bit smoother.` : 'Everything went fine.'} Overall satisfied.`,
  ];

  const three = [
    `Mixed experience ${svcPhrase}. On one hand, ${cleanStoodOut.toLowerCase()}, which was appreciated. On the other hand, ${cleanImprove ? cleanImprove.toLowerCase() : 'communication and wait times were just average'}. Fair service, but room to improve.`,
    `It was okay overall. ${cap(cleanStoodOut)}. ${cleanImprove ? `However, ${cleanImprove.toLowerCase()} held the visit back from being great.` : 'Decent work, but nothing extraordinary.'} Average experience.`,
    `Service was fine for my ${svcRef}. ${cleanStoodOut ? `Good points: ${cleanStoodOut.toLowerCase()}.` : ''} ${cleanImprove ? `Could definitely improve on ${cleanImprove.toLowerCase()}.` : 'Felt a bit rushed.'} Moderate satisfaction.`,
    `Decent job, but middle of the road. ${cap(cleanStoodOut)}, though ${cleanImprove ? cleanImprove.toLowerCase() : 'service could be more organized'}. Might consider trying again.`,
  ];

  const two = [
    `Rather disappointed with my visit ${svcPhrase}. ${cleanStoodOut ? `While ${cleanStoodOut.toLowerCase()}, ` : ''}${cleanImprove ? cleanImprove.toLowerCase() : 'the service fell well short of expectations'}. Communication was poor and it took longer than promised.`,
    `Would hesitate before coming back here for ${svcRef}. ${cleanImprove ? cap(cleanImprove) + ' caused a lot of inconvenience.' : 'Execution was careless.'} ${cleanStoodOut ? `The only small positive was ${cleanStoodOut.toLowerCase()}.` : ''} Expected much better.`,
    `Not satisfied with the outcome. ${cleanImprove ? cap(cleanImprove) : 'Staff seemed disengaged and unhelpful'}. Needs serious management attention.`,
  ];

  const one = [
    `Extremely frustrating experience ${svcPhrase}. ${cleanImprove ? cap(cleanImprove) + '.' : 'Completely unprofessional and careless service.'} No accountability or effort to fix the issue. Avoid if possible.`,
    `Regret coming here for ${svcRef}. ${cleanImprove ? cap(cleanImprove) : 'Terrible customer support and zero respect for customer time'}. Would give zero stars if that was an option.`,
    `Very bad experience. ${cleanImprove ? cap(cleanImprove) : 'Service was incomplete and handled rudely'}. Will definitely not be returning.`,
  ];

  const pool = stars === 5 ? five : stars === 4 ? four : stars === 3 ? three : stars === 2 ? two : one;

  const prevLower = (previousDraft || '').trim().toLowerCase();
  const fresh = pool.filter((t) => {
    // 1. Check against previousDraft
    if (prevLower) {
      if (prevLower.startsWith(t.slice(0, 15).toLowerCase())) return false;
      const prevWords = new Set(prevLower.split(/\W+/).filter((w) => w.length > 3));
      const words = t.toLowerCase().split(/\W+/).filter((w) => w.length > 3);
      if (words.length > 0) {
        const overlap = words.filter((w) => prevWords.has(w)).length;
        if (overlap / words.length >= 0.35) return false;
      }
    }
    // 2. Check against recent session history
    for (const recent of recentDraftsHistory.slice(-4)) {
      if (recent.toLowerCase().startsWith(t.slice(0, 15).toLowerCase())) {
        return false;
      }
    }
    return true;
  });

  const candidates = fresh.length > 0 ? fresh : pool;
  const nonMatchingStart = candidates.filter(
    (c) => !prevLower || !prevLower.startsWith(c.slice(0, 12).toLowerCase())
  );
  const finalPool = nonMatchingStart.length > 0 ? nonMatchingStart : candidates;

  const chosen = finalPool[Math.floor(Math.random() * finalPool.length)].trim();
  recentDraftsHistory.push(chosen);
  if (recentDraftsHistory.length > 8) recentDraftsHistory.shift();

  return chosen;
}

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

export const STORAGE_KEY_ADMIN_CLIENTS = 'reviewassist_admin_clients';

/**
 * Checks if admin portal has modified or deactivated a client
 */
export function getAdminClientOverride(businessId) {
  try {
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
 * Helper to format raw database business row to frontend format
 */
function formatBusinessRow(row) {
  if (!row) return null;
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const rawGoogleUrl = row.google_review_url || row.googleReviewUrl;
  const validGoogleUrl = resolveGoogleReviewUrl(rawGoogleUrl, row.name);
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    services: Array.isArray(row.services) ? row.services : [],
    email: row.email || '',
    shareableUrl: `${origin}/review/${row.id}`,
    dashboardUrl: `${origin}/dashboard/${row.id}`,
    googleReviewUrl: validGoogleUrl,
    createdAt: row.created_at || row.createdAt || new Date().toISOString(),
    status: row.status || 'active',
    planId: row.plan_id || row.planId || 'pro',
    paidUntil: row.paid_until || row.paidUntil || null,
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

  getToken() {
    return getToken();
  },

  getCurrentUser() {
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
  async signup({ name, category, services, email, password, googleReviewUrl }) {
    const rawGoogleUrl = googleReviewUrl?.trim() || `https://www.google.com/search?q=${encodeURIComponent(name.trim() + ' Google Reviews')}`;

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
            console.warn('Supabase Auth email rate limit reached. Proceeding with direct business onboarding.');
          } else {
            throw new Error(authError.message);
          }
        } else {
          authUser = authData.user;
          token = authData.session?.access_token || authData.user?.id;
        }
      } catch (authErr) {
        if (!authErr.message?.toLowerCase().includes('rate limit')) {
          throw authErr;
        }
      }

      const id = 'biz-' + Math.random().toString(36).substring(2, 9);
      const newBizRow = {
        id,
        user_id: authUser?.id || null,
        name: name.trim(),
        category,
        services: Array.isArray(services) ? services : [],
        email: email.trim(),
        google_review_url: rawGoogleUrl,
      };

      try {
        const { data: insertedBiz } = await supabase
          .from('businesses')
          .insert([newBizRow])
          .select()
          .single();

        const formattedBiz = formatBusinessRow(insertedBiz || newBizRow);
        const activeToken = token || `dev-token-${Date.now()}`;
        setToken(activeToken);
        saveStoredBusiness(formattedBiz);

        const userData = { email, name, businessId: id };
        try {
          localStorage.setItem('reviewassist_current_user', JSON.stringify(userData));
        } catch {}

        return {
          token: activeToken,
          business: formattedBiz,
          user: authUser || userData,
        };
      } catch (bizErr) {
        console.warn('Direct business insert fallback:', bizErr);
      }
    }

    // Fallback Mock / REST
    const data = await fetchWithFallback(
      '/api/auth/signup',
      {
        method: 'POST',
        body: JSON.stringify({ name, category, services, email, password, googleReviewUrl }),
      },
      () => {
        const id = 'biz-' + Math.random().toString(36).substring(2, 9);
        const origin = window.location.origin;
        const newBiz = {
          id,
          name,
          category,
          services: Array.isArray(services) ? services : [],
          email,
          shareableUrl: `${origin}/review/${id}`,
          dashboardUrl: `${origin}/dashboard/${id}`,
          googleReviewUrl: rawGoogleUrl,
          createdAt: new Date().toISOString(),
        };
        saveStoredBusiness(newBiz);

        const newUser = {
          email,
          password,
          businessId: id,
          name,
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
   * POST /api/auth/login
   * Signs in with Supabase auth and retrieves linked business
   */
  async login({ email, password }) {
    const cleanEmail = email?.trim().toLowerCase();
    const isSuperAdminCreds =
      cleanEmail === 'admin@reviewassist.ai' &&
      (password === 'reviewassist@admin2024' || password === 'password123');

    // 1. Direct Super Admin instant authentication
    if (isSuperAdminCreds) {
      const adminToken = `admin-jwt-${Date.now()}.${btoa(JSON.stringify({ email: cleanEmail, role: 'super_admin' }))}`;
      setToken(adminToken);
      const adminUser = {
        id: 'admin-super-user',
        email: 'admin@reviewassist.ai',
        name: 'Alex Rivera (SaaS Admin)',
        role: 'super_admin',
        isSuperAdmin: true,
        businessId: 'demo-1',
      };
      try {
        localStorage.setItem('reviewassist_current_user', JSON.stringify(adminUser));
      } catch {}
      return {
        token: adminToken,
        user: adminUser,
        role: 'super_admin',
        isSuperAdmin: true,
        businessId: 'demo-1',
        business: {
          id: 'demo-1',
          name: 'Apex Auto Care & Diagnostics',
          category: 'automobile',
          services: ['General Auto Care'],
        },
      };
    }

    // 2. Supabase auth if configured
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });

        if (!authError && authData?.user) {
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

          if (!biz) {
            const { data: bizByEmail } = await supabase
              .from('businesses')
              .select('*')
              .eq('email', cleanEmail)
              .maybeSingle();
            biz = bizByEmail;
          }

          const formattedBiz = biz ? formatBusinessRow(biz) : {
            id: 'demo-1',
            name: 'Business Dashboard',
            category: 'other',
            services: ['Standard Service'],
          };

          const token = authData.session?.access_token || authData.user.id;
          setToken(token);

          const currentUser = {
            email: authData.user.email || email,
            name: formattedBiz.name,
            businessId: formattedBiz.id,
          };
          try {
            localStorage.setItem('reviewassist_current_user', JSON.stringify(currentUser));
          } catch {}

          return {
            token,
            business: formattedBiz,
            businessId: formattedBiz.id,
            user: authData.user || currentUser,
          };
        }
      } catch (authErr) {
        console.warn('Supabase signIn notice:', authErr.message);
      }
    }

    // Fallback Mock / REST
    const data = await fetchWithFallback(
      '/api/auth/login',
      {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      },
      () => {
        const users = getStoredUsers();
        const user = users.find(
          (u) =>
            u.email?.toLowerCase() === email?.trim().toLowerCase() &&
            (u.password === password ||
              (u.email?.toLowerCase() === 'admin@reviewassist.ai' &&
                (password === 'reviewassist@admin2024' || password === 'password123')))
        );

        if (!user) {
          throw new Error('Invalid email or password. Please try again.');
        }

        const businesses = getStoredBusinesses();
        const business = businesses[user.businessId] || {
          id: user.businessId || 'demo-1',
          name: user.name || 'Business Dashboard',
          category: 'other',
          services: ['Standard Service'],
        };

        const mockToken = `mock-jwt-${Math.random().toString(36).substring(2)}.${btoa(JSON.stringify({ email: user.email, businessId: business.id }))}.${Date.now()}`;

        return {
          token: mockToken,
          business,
          businessId: business.id,
          user: { email: user.email, name: user.name, businessId: business.id, role: user.role },
          role: user.role,
        };
      }
    );

    if (data && data.token) {
      setToken(data.token);
      try {
        const u = data.user || { email, businessId: data.businessId || data.business?.id };
        localStorage.setItem('reviewassist_current_user', JSON.stringify(u));
      } catch {}
    }
    return data;
  },

  /**
   * Log out user
   */
  async logout() {
    if (isSupabaseConfigured() && supabase) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.warn('Supabase signout error:', err);
      }
    }
    clearToken();
    try {
      localStorage.removeItem('reviewassist_current_user');
    } catch {}
  },

  getStoredBusinesses() {
    return getStoredBusinesses();
  },

  getStoredReviews(businessId) {
    return getStoredReviews(businessId || 'demo-1');
  },

  /**
   * GET business by ID
   */
  async getBusiness(businessId) {
    const cleanId = businessId || 'demo-1';
    let biz = null;

    // 1. Instant resolution for demo businesses or stored businesses
    const stored = getStoredBusinesses();
    if (stored[cleanId]) {
      biz = { ...stored[cleanId] };
    } else if (isSupabaseConfigured() && supabase) {
      // 2. Supabase resolution if configured
      try {
        const { data, error } = await supabase
          .from('businesses')
          .select('*')
          .eq('id', cleanId)
          .maybeSingle();

        if (!error && data) {
          biz = formatBusinessRow(data);
        }
      } catch (err) {
        console.warn('Supabase getBusiness error:', err);
      }
    }

    // 3. Fallback mock business
    if (!biz) {
      biz = {
        id: cleanId,
        name: cleanId.startsWith('demo-2') ? 'Lumina Skin & Hair Studio' : 'Apex Auto Care & Diagnostics',
        category: cleanId.startsWith('demo-2') ? 'salon' : 'automobile',
        services: ['Full Synthetic Oil Change', 'Brake Pad Replacement', 'Engine Diagnostic'],
        googleReviewUrl: 'https://search.google.com/local/writereview',
        createdAt: new Date().toISOString(),
        status: 'active',
        planId: 'pro',
      };
    }

    // 4. Apply admin client overrides (status, plan, paidUntil) if configured in Super Admin
    const adminOverride = getAdminClientOverride(cleanId);
    if (adminOverride) {
      if (adminOverride.status) {
        biz.status = adminOverride.status;
        biz.subscriptionStatus = adminOverride.status;
      }
      if (adminOverride.planId) {
        biz.planId = adminOverride.planId;
      }
      if (adminOverride.paidUntil) {
        biz.paidUntil = adminOverride.paidUntil;
        // Auto-mark inactive if paidUntil has expired
        if (new Date(adminOverride.paidUntil) < new Date()) {
          biz.status = 'inactive';
          biz.subscriptionStatus = 'inactive';
        }
      }
    }

    return biz;
  },

  /**
   * POST /api/reviews/draft
   * AI draft review generator via Supabase Edge Function (Gemini 2.5 Flash Lite)
   */
  async generateDraftReview({ businessId, serviceType, whatStoodOut, whatCouldImprove, rating = 5, previousDraft = '' }) {
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase.functions.invoke('generate-review', {
          body: {
            businessId,
            serviceType,
            whatStoodOut,
            whatCouldImprove,
            rating,
            // Unique seed forces genuinely different output on every call
            seed: Date.now(),
            // Pass previous draft so Edge Function can explicitly avoid repeating it
            previousDraft: previousDraft || '',
          },
        });

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
          console.error('Supabase Edge Function error:', detailedMsg, error);
          throw new Error(detailedMsg || 'Failed to generate review draft');
        }

        if (data?.draftText) {
          return { draftText: data.draftText };
        }

        if (data?.error) {
          throw new Error(data.error);
        }
      } catch (fnErr) {
        console.warn('Supabase Edge Function failed:', fnErr);
        // Fall back to local mock generator
      }
    }

    const draftText = generateMockDraft({ serviceType, whatStoodOut, whatCouldImprove, rating, previousDraft });
    return { draftText };
  },

  /**
   * POST review confirmation & persist to database
   */
  async confirmReview({ businessId, serviceType, finalText, rating, whatStoodOut = '', whatCouldImprove = '' }) {
    const cleanId = businessId || 'demo-1';

    if (isSupabaseConfigured() && supabase && !cleanId.startsWith('demo-')) {
      try {
        const reviewId = 'rev-' + Math.random().toString(36).substring(2, 9);
        const newReviewRow = {
          id: reviewId,
          business_id: cleanId,
          service_type: serviceType || 'General Service',
          rating: rating || 5,
          text: finalText,
          what_stood_out: whatStoodOut || '',
          what_could_improve: whatCouldImprove || '',
        };

        await supabase.from('reviews').insert([newReviewRow]);

        const { data: biz } = await supabase
          .from('businesses')
          .select('name, google_review_url')
          .eq('id', cleanId)
          .maybeSingle();

        const targetGoogleUrl = resolveGoogleReviewUrl(biz?.google_review_url, biz?.name);

        return {
          success: true,
          googleReviewUrl: targetGoogleUrl,
        };
      } catch (err) {
        console.warn('Supabase review insert notice:', err);
      }
    }

    const businesses = getStoredBusinesses();
    const biz = businesses[cleanId] || {};
    const review = {
      id: 'rev-' + Math.random().toString(36).substring(2, 9),
      businessId: cleanId,
      serviceType: serviceType || 'General Service',
      rating: rating || 5,
      text: finalText,
      whatStoodOut,
      whatCouldImprove,
      createdAt: new Date().toISOString(),
    };
    saveStoredReview(review);
    return {
      success: true,
      googleReviewUrl: biz.googleReviewUrl || 'https://search.google.com/local/writereview',
    };
  },

  /**
   * GET business dashboard statistics
   */
  async getBusinessStats(businessId) {
    const cleanId = businessId || 'demo-1';

    // 1. Supabase stats if available
    if (isSupabaseConfigured() && supabase && !cleanId.startsWith('demo-')) {
      try {
        const { data: reviews, error } = await supabase
          .from('reviews')
          .select('*')
          .eq('business_id', cleanId);

        if (!error && Array.isArray(reviews) && reviews.length > 0) {
          const totalReviews = reviews.length;
          const now = new Date();
          const currentMonth = now.getMonth();
          const currentYear = now.getFullYear();

          const thisMonthReviews = reviews.filter((r) => {
            const d = new Date(r.created_at);
            return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
          }).length;

          const avgRating =
            totalReviews > 0
              ? (reviews.reduce((acc, r) => acc + (Number(r.rating) || 5), 0) / totalReviews).toFixed(1)
              : '5.0';

          const estimatedScans = Math.max(totalReviews * 2 + 5, 24);
          const scanToReviewRate =
            totalReviews > 0
              ? Math.min(100, Math.round((totalReviews / estimatedScans) * 100)) + '%'
              : '0%';

          return {
            totalReviews,
            thisMonth: thisMonthReviews,
            avgRating: Number(avgRating),
            scanToReviewRate,
          };
        }
      } catch (err) {
        console.warn('Supabase getBusinessStats notice:', err);
      }
    }

    // 2. Local fallback stats calculated directly
    const reviews = getStoredReviews(cleanId);
    const totalReviews = reviews.length;
    
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const thisMonthReviews = reviews.filter((r) => {
      const d = new Date(r.createdAt || r.created_at);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    }).length;

    const avgRating =
      totalReviews > 0
        ? (reviews.reduce((acc, r) => acc + (Number(r.rating) || 5), 0) / totalReviews).toFixed(1)
        : '5.0';

    const estimatedScans = Math.max(totalReviews * 2 + 5, 24);
    const scanToReviewRate =
      totalReviews > 0
        ? Math.min(100, Math.round((totalReviews / estimatedScans) * 100)) + '%'
        : '0%';

    return {
      totalReviews,
      thisMonth: thisMonthReviews,
      avgRating: Number(avgRating),
      scanToReviewRate,
    };
  },

  /**
   * GET business customer reviews
   */
  async getBusinessReviews(businessId) {
    const cleanId = businessId || 'demo-1';

    if (isSupabaseConfigured() && supabase && !cleanId.startsWith('demo-')) {
      try {
        const { data: reviews, error } = await supabase
          .from('reviews')
          .select('*')
          .eq('business_id', cleanId)
          .order('created_at', { ascending: false });

        if (!error && Array.isArray(reviews) && reviews.length > 0) {
          return reviews.map((r) => ({
            id: r.id,
            businessId: r.business_id,
            serviceType: r.service_type,
            rating: r.rating,
            text: r.text,
            whatStoodOut: r.what_stood_out,
            whatCouldImprove: r.what_could_improve,
            createdAt: r.created_at,
          }));
        }
      } catch (err) {
        console.warn('Supabase getBusinessReviews notice:', err);
      }
    }

    return getStoredReviews(cleanId);
  },

  /**
   * GET business SaaS subscription
   */
  async getSubscription(businessId) {
    const cleanId = businessId || 'demo-1';
    let sub = null;
    try {
      const data = localStorage.getItem(STORAGE_KEY_SUBSCRIPTIONS);
      const parsed = data ? JSON.parse(data) : {};
      if (parsed[cleanId]) sub = { ...parsed[cleanId] };
    } catch {}

    if (!sub && DEFAULT_SUBSCRIPTIONS[cleanId]) {
      sub = { ...DEFAULT_SUBSCRIPTIONS[cleanId] };
    }

    if (!sub) {
      sub = {
        businessId: cleanId,
        planId: 'pro',
        status: 'active',
        billingInterval: 'monthly',
        amount: 49,
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        aiGenerationsUsed: 15,
        whatsappInvitesUsed: 28,
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
    const businesses = getStoredBusinesses();
    const count = Object.keys(businesses).length;

    return {
      mrr: 18450,
      activeSubscribers: Math.max(count * 82, 246),
      churnRate: 1.4,
      totalAiReviewsGenerated: 48920,
      totalWhatsAppInvitesSent: 112450,
      avgCustomerRating: 4.88,
      planDistribution: {
        starter: 42,
        pro: 168,
        enterprise: 36,
      },
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
  saveClientAccount({
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
  }) {
    const cleanBizId = businessId.trim();
    const cleanEmail = email.trim().toLowerCase();
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const now = new Date().toISOString();
    const defaultExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const expiryDate = paidUntil || defaultExpiry;

    // 1. Create or update user login account
    const users = getStoredUsers();
    const uIdx = users.findIndex((u) => u.email.toLowerCase() === cleanEmail);
    const userObj = {
      id: `user-${Date.now().toString(36)}`,
      email: cleanEmail,
      password: password || 'welcome123',
      name: ownerName || businessName,
      businessId: cleanBizId,
      role: 'business_owner',
    };
    if (uIdx >= 0) {
      users[uIdx] = { ...users[uIdx], ...userObj };
    } else {
      users.push(userObj);
    }
    localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users));

    // 2. Create or update business profile
    const newBiz = {
      id: cleanBizId,
      name: businessName,
      category: category || 'other',
      services: ['General Service', 'Customer Support', 'Premium Care'],
      email: cleanEmail,
      phone: phone || '',
      shareableUrl: `${origin}/review/${cleanBizId}`,
      dashboardUrl: `${origin}/dashboard/${cleanBizId}`,
      googleReviewUrl: `https://www.google.com/search?q=${encodeURIComponent(businessName + ' Google Reviews')}`,
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
        locations: '1',
        reviewsGenerated: 0,
        status: 'active',
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
    const businesses = getStoredBusinesses();
    const biz = businesses[cleanId] || {};

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

    saveStoredPrivateFeedback(feedback);

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
    return getStoredPrivateFeedback(cleanId);
  },

  /**
   * Update Private Feedback Resolution Status
   */
  async updatePrivateFeedbackStatus(businessId, feedbackId, status, resolutionNote = '') {
    const cleanId = businessId || 'demo-1';
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
    locations,
    email,
    phone,
    googleProfileUrl = '',
    message = '',
  }) {
    const leadId = `lead-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    const nowIso = new Date().toISOString();

    const leadObject = {
      id: leadId,
      ownerName: ownerName?.trim() || '',
      businessName: businessName?.trim() || '',
      businessType: businessType || '',
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
        const { data, error } = await supabase.from('leads').insert([
          {
            id: leadId,
            owner_name: leadObject.ownerName,
            business_name: leadObject.businessName,
            business_type: leadObject.businessType,
            locations: leadObject.locations,
            email: leadObject.email,
            phone: leadObject.phone,
            google_profile_url: leadObject.googleProfileUrl,
            message: leadObject.message,
            status: 'new',
            created_at: nowIso,
          },
        ]).select().single();

        if (error) {
          console.warn('Supabase leads insert notice:', error.message);
        } else if (data) {
          console.log('✓ Lead saved to Supabase:', data.id);
        }
      } catch (err) {
        console.warn('Could not insert to Supabase leads table:', err);
      }
    }

    // 2. Always persist to localStorage for instant offline/admin syncing
    try {
      const raw = localStorage.getItem('reviewassist_admin_leads');
      const leads = raw ? JSON.parse(raw) : [];
      leads.unshift(leadObject);
      localStorage.setItem('reviewassist_admin_leads', JSON.stringify(leads));
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
      try {
        const { data, error } = await supabase
          .from('leads')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && Array.isArray(data)) {
          supabaseLeads = data.map((row) => ({
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
            submittedAt: row.created_at || row.createdAt || new Date().toISOString(),
          }));
        }
      } catch (err) {
        console.warn('Could not fetch leads from Supabase:', err);
      }
    }

    // Read local leads
    let localLeads = [];
    try {
      const raw = localStorage.getItem('reviewassist_admin_leads');
      if (raw) localLeads = JSON.parse(raw);
    } catch {}

    // Merge without duplicates by ID
    const map = new Map();
    // Put Supabase leads first
    supabaseLeads.forEach((l) => map.set(l.id, l));
    // Put local leads if not present
    localLeads.forEach((l) => {
      if (!map.has(l.id)) map.set(l.id, l);
    });

    return Array.from(map.values());
  },

  /**
   * Update a lead's status (new -> in_progress -> done)
   */
  async updateLeadStatus(leadId, status) {
    if (isSupabaseConfigured() && supabase) {
      try {
        await supabase
          .from('leads')
          .update({ status, updated_at: new Date().toISOString() })
          .eq('id', leadId);
      } catch (err) {
        console.warn('Error updating lead status in Supabase:', err);
      }
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
    } catch {}

    return { success: true };
  },
};

