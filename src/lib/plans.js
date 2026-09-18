/**
 * SaaS Subscription Plans & Feature Gating
 * Defines pricing tiers, limits, and plan feature validation helpers.
 */

export const PLANS = {
  STARTER: {
    id: 'starter',
    name: 'Starter',
    tagline: 'Ideal for solo practitioners and single local shops',
    monthlyPrice: 19,
    annualPrice: 15, // $15/mo billed annually ($180/yr)
    currency: '$',
    badge: null,
    color: '#6366f1',
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
    monthlyPrice: 49,
    annualPrice: 39, // $39/mo billed annually ($468/yr)
    currency: '$',
    badge: 'Most Popular',
    color: '#7c3aed',
    isPopular: true,
    limits: {
      locations: 3,
      aiReviewsPerMonth: Infinity, // Unlimited
      whatsappInvitesPerMonth: Infinity, // Unlimited
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
    monthlyPrice: 99,
    annualPrice: 79, // $79/mo billed annually ($948/yr)
    currency: '$',
    badge: 'Scale',
    color: '#06b6d4',
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
