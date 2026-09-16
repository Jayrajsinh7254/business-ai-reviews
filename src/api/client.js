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

// Default initial demo business data
const DEFAULT_BUSINESSES = {
  'demo-1': {
    id: 'demo-1',
    name: 'Apex Auto Care & Diagnostics',
    category: 'automobile',
    services: ['Full Synthetic Oil Change', 'Brake Pad Replacement', 'Engine Diagnostic', 'Tire Rotation & Balance', 'AC System Recharge'],
    googleReviewUrl: 'https://search.google.com/local/writereview?placeid=ChIJN1t_tDeuEmsRUsoyG83frY4',
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
  },
  'demo-2': {
    id: 'demo-2',
    name: 'Lumina Skin & Hair Studio',
    category: 'salon',
    services: ['Balayage & Hair Styling', 'HydraFacial Glow', 'Keratin Smoothing Treatment', 'Gel Manicure & Pedicure'],
    googleReviewUrl: 'https://search.google.com/local/writereview?placeid=ChIJN1t_tDeuEmsRUsoyG83frY4',
    createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
  }
};

// Default initial demo users for mock login
const DEFAULT_USERS = [
  {
    email: 'admin@apexauto.com',
    password: 'password123',
    businessId: 'demo-1',
    name: 'Apex Auto Admin',
  },
  {
    email: 'admin@lumina.com',
    password: 'password123',
    businessId: 'demo-2',
    name: 'Lumina Studio Admin',
  },
  {
    email: 'demo@reviewassist.ai',
    password: 'password123',
    businessId: 'demo-1',
    name: 'Demo User',
  }
];

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

/**
 * Intelligent AI draft review generator fallback with authentic, human-sounding variations
 */
function generateMockDraft({ serviceType, whatStoodOut, whatCouldImprove, rating = 5 }) {
  const service = serviceType ? serviceType.toLowerCase() : 'service';
  const cleanStoodOut = whatStoodOut ? whatStoodOut.trim().replace(/[.,!]+$/, '') : 'honest service and friendly team';
  const cleanImprove = whatCouldImprove ? whatCouldImprove.trim().replace(/[.,!]+$/, '') : '';
  const stars = Number(rating) || 5;

  // Capitalize first letter helper
  const cap = (s) => s ? s.charAt(0).toUpperCase() + s.slice(1) : '';

  if (stars === 5) {
    const templates = [
      `Came in for ${service} and they did an awesome job. ${cap(cleanStoodOut)}. Really friendly crew and fair pricing from start to finish. Will definitely be coming back!`,
      `Had my ${service} taken care of here today and couldn't be happier. ${cap(cleanStoodOut)}. Super quick, transparent, and hassle-free. Definitely recommend checking them out!`,
      `Great experience getting my ${service} done. What really stood out was ${cleanStoodOut.toLowerCase()}. The staff was super helpful and honest without any pushy sales. 10/10 service!`,
    ];
    // Pick based on notes length to keep deterministic yet varied
    const idx = cleanStoodOut.length % templates.length;
    return templates[idx];
  }

  if (stars === 4) {
    const templates = [
      `Solid work on my ${service}. ${cap(cleanStoodOut)}. ${cleanImprove ? `Had a minor issue with ${cleanImprove.toLowerCase()}, but the ` : 'The '}team was polite and did a great job overall. Would visit again.`,
      `Good, reliable service for ${service}. ${cap(cleanStoodOut)}. Everything went smoothly and pricing was fair. Satisfied with the results!`,
    ];
    const idx = cleanStoodOut.length % templates.length;
    return templates[idx];
  }

  if (stars === 3) {
    return `My experience for ${service} was average. On the positive side, ${cleanStoodOut.toLowerCase()}, but ${cleanImprove ? cleanImprove.toLowerCase() : 'communication and wait times could definitely be improved'}. An okay visit overall.`;
  }

  if (stars === 2) {
    return `Pretty disappointed with my visit for ${service}. ${cleanStoodOut ? `Although ${cleanStoodOut.toLowerCase()}, ` : ''}${cleanImprove ? cleanImprove : 'the service felt rushed and didn\'t meet expectations'}. Expected better based on the reviews.`;
  }

  // 1 star
  return `Terrible experience getting ${service} done here. ${cleanStoodOut ? `${cap(cleanStoodOut)}, but ` : ''}${cleanImprove ? cleanImprove : 'the customer service was completely unprofessional and unhelpful'}. Would not recommend this place to anyone.`;
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

        return {
          token: activeToken,
          business: formattedBiz,
          user: authUser || { email, name, businessId: id },
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
    }
    return data;
  },

  /**
   * POST /api/auth/login
   * Signs in with Supabase auth and retrieves linked business
   */
  async login({ email, password }) {
    if (isSupabaseConfigured() && supabase) {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (authError) {
        throw new Error(authError.message || 'Invalid email or password.');
      }

      // Fetch user's business
      let biz = null;
      if (authData.user?.id) {
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
          .eq('email', email.trim().toLowerCase())
          .maybeSingle();
        biz = bizByEmail;
      }

      const formattedBiz = biz ? formatBusinessRow(biz) : {
        id: 'demo-1',
        name: 'Business Dashboard',
        category: 'other',
        services: ['Standard Service'],
      };

      const token = authData.session?.access_token || authData.user?.id;
      setToken(token);

      return {
        token,
        business: formattedBiz,
        businessId: formattedBiz.id,
        user: authData.user,
      };
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
          (u) => u.email?.toLowerCase() === email?.trim().toLowerCase() && u.password === password
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
          user: { email: user.email, name: user.name, businessId: business.id },
        };
      }
    );

    if (data && data.token) {
      setToken(data.token);
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
  },

  /**
   * GET business by ID
   */
  async getBusiness(businessId) {
    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase
        .from('businesses')
        .select('*')
        .eq('id', businessId)
        .maybeSingle();

      if (!error && data) {
        return formatBusinessRow(data);
      }
    }

    const token = getToken();
    return fetchWithFallback(
      `/api/businesses/${businessId}`,
      {
        method: 'GET',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      },
      () => {
        const businesses = getStoredBusinesses();
        const biz = businesses[businessId];
        if (biz) return biz;
        return {
          id: businessId,
          name: 'Partner Business',
          category: 'other',
          services: ['Standard Service', 'Consultation', 'Custom Package'],
          googleReviewUrl: 'https://search.google.com/local/writereview',
          createdAt: new Date().toISOString(),
        };
      }
    );
  },

  /**
   * POST /api/reviews/draft
   * AI draft review generator via Supabase Edge Function (Gemini 2.5 Flash Lite)
   */
  async generateDraftReview({ businessId, serviceType, whatStoodOut, whatCouldImprove, rating = 5 }) {
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase.functions.invoke('generate-review', {
          body: {
            businessId,
            serviceType,
            whatStoodOut,
            whatCouldImprove,
            rating,
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
        throw fnErr;
      }
    }

    return fetchWithFallback(
      '/api/reviews/draft',
      {
        method: 'POST',
        body: JSON.stringify({ businessId, serviceType, whatStoodOut, whatCouldImprove, rating }),
      },
      () => {
        const draftText = generateMockDraft({ serviceType, whatStoodOut, whatCouldImprove, rating });
        return { draftText };
      }
    );
  },

  /**
   * POST review confirmation & persist to database
   */
  async confirmReview({ businessId, serviceType, finalText, rating, whatStoodOut = '', whatCouldImprove = '' }) {
    if (isSupabaseConfigured() && supabase) {
      const reviewId = 'rev-' + Math.random().toString(36).substring(2, 9);
      const newReviewRow = {
        id: reviewId,
        business_id: businessId,
        service_type: serviceType || 'General Service',
        rating: rating || 5,
        text: finalText,
        what_stood_out: whatStoodOut || '',
        what_could_improve: whatCouldImprove || '',
      };

      const { error } = await supabase.from('reviews').insert([newReviewRow]);
      if (error) {
        console.error('Error inserting review to Supabase:', error);
      }

      // Fetch business Google Review URL
      const { data: biz } = await supabase
        .from('businesses')
        .select('name, google_review_url')
        .eq('id', businessId)
        .maybeSingle();

      const targetGoogleUrl = resolveGoogleReviewUrl(biz?.google_review_url, biz?.name);

      return {
        success: true,
        googleReviewUrl: targetGoogleUrl,
      };
    }

    return fetchWithFallback(
      '/api/reviews/confirm',
      {
        method: 'POST',
        body: JSON.stringify({ businessId, serviceType, finalText, rating, whatStoodOut, whatCouldImprove }),
      },
      () => {
        const businesses = getStoredBusinesses();
        const biz = businesses[businessId] || {};
        const review = {
          id: 'rev-' + Math.random().toString(36).substring(2, 9),
          businessId,
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
      }
    );
  },

  /**
   * GET business dashboard statistics
   */
  async getBusinessStats(businessId) {
    if (isSupabaseConfigured() && supabase) {
      const { data: reviews, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('business_id', businessId);

      if (!error && Array.isArray(reviews)) {
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
    }

    const token = getToken();
    return fetchWithFallback(
      `/api/businesses/${businessId}/stats`,
      {
        method: 'GET',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      },
      () => {
        const reviews = getStoredReviews(businessId);
        const totalReviews = reviews.length;
        
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        const thisMonthReviews = reviews.filter((r) => {
          const d = new Date(r.createdAt);
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
    );
  },

  /**
   * GET business customer reviews
   */
  async getBusinessReviews(businessId) {
    if (isSupabaseConfigured() && supabase) {
      const { data: reviews, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('business_id', businessId)
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(reviews)) {
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
    }

    const token = getToken();
    return fetchWithFallback(
      `/api/businesses/${businessId}/reviews`,
      {
        method: 'GET',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      },
      () => {
        return getStoredReviews(businessId);
      }
    );
  },
};
