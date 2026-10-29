/**
 * SaaS Subscription Plans & Feature Gating
 * Defines pricing tiers, limits, and plan feature validation helpers.
 * All pricing is in INR (Indian Rupees).
 * Includes special Diwali Festive Discounts with deep annual customer savings.
 */

export const PLANS = {
  STARTER: {
    id: 'starter',
    name: 'Starter',
    tagline: 'Ideal for solo practitioners and single local shops',
    monthlyPrice: 299,
    originalMonthlyPrice: 499, // Strikethrough for Diwali (₹200 OFF)
    annualPrice: 249, // ₹249/mo billed annually (₹2,988/yr — save ₹3,000 vs original monthly)
    originalAnnualPrice: 399,
    annualTotalAmount: 2988,
    currency: '₹',
    diwaliDiscountText: 'Diwali Special: Flat ₹200 OFF',
    annualSavingsText: 'Save ₹3,000/yr (50% OFF)',
    annualPerk: '🎁 Printable QR Standee',
    // Razorpay Plan IDs — create plans in Razorpay Dashboard → Plans
    razorpayPlanIdMonthly: import.meta.env?.VITE_RAZORPAY_PLAN_STARTER_MONTHLY || '',
    razorpayPlanIdAnnual: import.meta.env?.VITE_RAZORPAY_PLAN_STARTER_ANNUAL || '',
    // Amount in paise (1 INR = 100 paise) for Razorpay API
    monthlyAmountPaise: 29900,
    annualAmountPaise: 298800,
    badge: null,
    color: '#6366f1',
    isPopular: false,
    limits: {
      locations: 1,
      aiReviewsPerMonth: Infinity,
      whatsappInviter: false,
      whatsappInvitesPerMonth: 0,
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
      '100 AI Customer Reviews / month',
      'Standard QR Standees & Table Tents',
      'Real-time Analytics Dashboard',
      'Private Negative Review Shield',
      '1 Staff Seat',
      'Email Support',
    ],
  },
  PRO: {
    id: 'pro',
    name: 'Pro Growth',
    tagline: 'Most popular for growing salons, garages, restaurants & multi-service clinics',
    monthlyPrice: 499,
    originalMonthlyPrice: 699, // Strikethrough for Diwali (₹200 OFF)
    annualPrice: 449, // ₹449/mo billed annually (₹5,388/yr — save ₹3,000 vs original monthly)
    originalAnnualPrice: 599,
    annualTotalAmount: 5388,
    currency: '₹',
    diwaliDiscountText: 'Diwali Special: Flat ₹200 OFF',
    annualSavingsText: 'Save ₹3,000/yr (36% OFF)',
    annualPerk: '🪔 FREE QR Standee',
    razorpayPlanIdMonthly: import.meta.env?.VITE_RAZORPAY_PLAN_PRO_MONTHLY || '',
    razorpayPlanIdAnnual: import.meta.env?.VITE_RAZORPAY_PLAN_PRO_ANNUAL || '',
    monthlyAmountPaise: 49900,
    annualAmountPaise: 538800,
    badge: 'Most Popular · Diwali Deal',
    color: '#7c3aed',
    isPopular: true,
    limits: {
      locations: 1,
      aiReviewsPerMonth: Infinity,
      whatsappInviter: true,
      whatsappInvitesPerMonth: Infinity,
      teamSeats: 1,
      standeeTemplates: ['counter', 'table_tent', 'poster', 'card'],
      aiReplyCopilot: true,
      customBranding: true,
      csvExport: true,
      priorityAi: true,
      dedicatedSupport: false,
    },
    features: [
      'Up to 1 Business Location',
      'Unlimited AI Review Generations',
      'Unlimited WhatsApp Review Invites',
      'AI Review Auto-Reply Copilot Studio',
      'All QR Standee, Poster & Decal Styles',
      'Custom Brand Colors & Logo Integration',
      'CSV / Excel Review & Customer Export',
      'Priority Fast AI Generation Throughput',
    ],
  },
  ENTERPRISE: {
    id: 'enterprise',
    name: 'Enterprise / Agency',
    tagline: 'For franchises, multi-location brands, and marketing agencies',
    monthlyPrice: 799,
    originalMonthlyPrice: 1199, // Strikethrough for Diwali (₹400 OFF)
    annualPrice: 699, // ₹699/mo billed annually (₹8,388/yr — save ₹6,000 vs original monthly)
    originalAnnualPrice: 999,
    annualTotalAmount: 8388,
    currency: '₹',
    diwaliDiscountText: 'Diwali Special: Flat ₹400 OFF',
    annualSavingsText: 'Save ₹6,000/yr (42% OFF)',
    annualPerk: '📦 Pack of 3 Custom Acrylic Standees + 1-on-1 VIP Onboarding',
    razorpayPlanIdMonthly: import.meta.env?.VITE_RAZORPAY_PLAN_ENTERPRISE_MONTHLY || '',
    razorpayPlanIdAnnual: import.meta.env?.VITE_RAZORPAY_PLAN_ENTERPRISE_ANNUAL || '',
    monthlyAmountPaise: 79900,
    annualAmountPaise: 838800,
    badge: 'Scale',
    color: '#06b6d4',
    isPopular: false,
    limits: {
      locations: 3,
      aiReviewsPerMonth: Infinity,
      whatsappInviter: true,
      whatsappInvitesPerMonth: Infinity,
      teamSeats: 5,
      standeeTemplates: ['counter', 'table_tent', 'poster', 'card', 'custom_dimension'],
      aiReplyCopilot: true,
      customBranding: true,
      csvExport: true,
      priorityAi: true,
      dedicatedSupport: true,
    },
    features: [
      '3 Locations & Multi-Store Switcher',
      'Unlimited AI Generations & Review Invites',
      '5 Staff & Manager Seats with Granular RBAC',
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
