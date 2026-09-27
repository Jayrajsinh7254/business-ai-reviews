/**
 * SaaS Subscription Plans & Feature Gating
 * Defines pricing tiers, limits, and plan feature validation helpers.
 * All pricing is in INR (Indian Rupees).
 */

export const PLANS = {
  STARTER: {
    id: 'starter',
    name: 'Starter',
    tagline: 'Ideal for solo practitioners and single local shops',
    monthlyPrice: 499,
    annualPrice: 399, // ₹399/mo billed annually (₹4,788/yr — save ₹1,200)
    currency: '₹',
    // Razorpay Plan IDs — create plans in Razorpay Dashboard → Plans
    razorpayPlanIdMonthly: import.meta.env.VITE_RAZORPAY_PLAN_STARTER_MONTHLY || '',
    razorpayPlanIdAnnual: import.meta.env.VITE_RAZORPAY_PLAN_STARTER_ANNUAL || '',
    // Amount in paise (1 INR = 100 paise) for Razorpay API
    monthlyAmountPaise: 49900,
    annualAmountPaise: 39900,
    badge: null,
    color: '#6366f1',
    isPopular: false,
    limits: {
      locations: 1,
      aiReviewsPerMonth: 100,
      whatsappInvitesPerMonth: 100,
      teamSeats: 1,
      standeeTemplates: ['counter', 'table_tent'],
      aiReplyCopilot: false,
      customBranding: false,
      csvExport: false,
      priorityAi: false,
      dedicatedSupport: false,
    },
    features: [
      '1 Business Location',
      '100 AI-Crafted Reviews / month',
      '100 Direct WhatsApp Invites / month',
      'Standard QR Standees & Table Tents',
      'Real-time Analytics Dashboard',
      '1 Staff Seat',
      'Email Support',
    ],
  },
  PRO: {
    id: 'pro',
    name: 'Pro Growth',
    tagline: 'Most popular for growing local businesses and multi-service clinics',
    monthlyPrice: 1299,
    annualPrice: 999, // ₹999/mo billed annually (₹11,988/yr — save ₹3,600)
    currency: '₹',
    razorpayPlanIdMonthly: import.meta.env.VITE_RAZORPAY_PLAN_PRO_MONTHLY || '',
    razorpayPlanIdAnnual: import.meta.env.VITE_RAZORPAY_PLAN_PRO_ANNUAL || '',
    monthlyAmountPaise: 129900,
    annualAmountPaise: 99900,
    badge: 'Most Popular',
    color: '#7c3aed',
    isPopular: true,
    limits: {
      locations: 3,
      aiReviewsPerMonth: Infinity,
      whatsappInvitesPerMonth: Infinity,
      teamSeats: 5,
      standeeTemplates: ['counter', 'table_tent', 'poster', 'card'],
      aiReplyCopilot: true,
      customBranding: true,
      csvExport: true,
      priorityAi: true,
      dedicatedSupport: false,
    },
    features: [
      'Up to 3 Business Locations',
      'Unlimited AI Review Generations',
      'Unlimited WhatsApp & SMS Review Invites',
      'AI Review Auto-Reply Copilot (1-click responses)',
      'All QR Standee, Poster & Table Tent Styles',
      'Custom Brand Colors & Logo Integration',
      'Up to 5 Team & Staff Seats (RBAC)',
      'CSV / Excel Review & Customer Export',
      'Priority Fast AI Generation Throughput',
    ],
  },
  ENTERPRISE: {
    id: 'enterprise',
    name: 'Enterprise / Agency',
    tagline: 'For franchises, multi-location brands, and marketing agencies',
    monthlyPrice: 2999,
    annualPrice: 2399, // ₹2,399/mo billed annually (₹28,788/yr — save ₹7,200)
    currency: '₹',
    razorpayPlanIdMonthly: import.meta.env.VITE_RAZORPAY_PLAN_ENTERPRISE_MONTHLY || '',
    razorpayPlanIdAnnual: import.meta.env.VITE_RAZORPAY_PLAN_ENTERPRISE_ANNUAL || '',
    monthlyAmountPaise: 299900,
    annualAmountPaise: 239900,
    badge: 'Scale',
    color: '#06b6d4',
    isPopular: false,
    limits: {
      locations: Infinity,
      aiReviewsPerMonth: Infinity,
      whatsappInvitesPerMonth: Infinity,
      teamSeats: Infinity,
      standeeTemplates: ['counter', 'table_tent', 'poster', 'card', 'custom_dimension'],
      aiReplyCopilot: true,
      customBranding: true,
      csvExport: true,
      priorityAi: true,
      dedicatedSupport: true,
    },
    features: [
      'Unlimited Locations & Multi-Store Switcher',
      'Unlimited AI Generations & Review Invites',
      'Unlimited Staff & Manager Seats with Granular RBAC',
      'Complete White-Label Standee & Review Pages',
      'Custom Domain Support & Webhook Integration',
      'Dedicated Account Manager & 24/7 SLA Support',
      'Custom AI Tone Fine-Tuning for Your Brand Voice',
    ],
  },
};

export const PLAN_LIST = Object.values(PLANS);

/**
 * Get plan configuration by plan ID
 */
export function getPlan(planId) {
  if (!planId) return PLANS.STARTER;
  const key = String(planId).toUpperCase();
  return PLANS[key] || PLANS.STARTER;
}

/**
 * Check if a plan allows a specific feature
 */
export function isFeatureAllowed(planId, featureKey) {
  const plan = getPlan(planId);
  if (!plan || !plan.limits) return false;
  return Boolean(plan.limits[featureKey]);
}

/**
 * Check if business has reached a numeric limit (e.g. team seats or locations)
 */
export function isWithinPlanLimit(planId, limitKey, currentCount) {
  const plan = getPlan(planId);
  if (!plan || !plan.limits) return true;
  const max = plan.limits[limitKey];
  if (max === Infinity || max === undefined) return true;
  return Number(currentCount) < Number(max);
}
