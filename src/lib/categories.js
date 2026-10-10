/**
 * Comprehensive Industry Categories & Suggested Services
 * Supports standard presets (IT & Digital Marketing, Automobile, Medical, etc.)
 * as well as dynamically specified custom industries ('other').
 */

export const CATEGORIES = [
  {
    id: 'it_marketing',
    value: 'it_marketing',
    label: 'IT, Software & Digital Marketing',
    icon: '💻',
    description: 'Web development, SEO, social media marketing, software, and IT services',
    defaultServices: [
      'Web Development',
      'SEO Optimization',
      'Social Media Marketing',
      'Google Ads (PPC)',
      'Custom Software Dev',
      'Mobile App Development',
      'UI/UX Design',
      'Cloud & IT Support',
    ],
  },
  {
    id: 'automobile',
    value: 'automobile',
    label: 'Automobile & Garage Services',
    icon: '🚗',
    description: 'Auto repair, car wash, detailing, tyre shops, and dealerships',
    defaultServices: [
      'Oil Change',
      'Brake Inspection',
      'Tire Rotation',
      'Engine Diagnostic',
      'Detailing & Polish',
      'AC Service',
    ],
  },
  {
    id: 'restaurant',
    value: 'restaurant',
    label: 'Restaurant, Cafe & Dining',
    icon: '🍽️',
    description: 'Restaurants, cafes, bakeries, bars, and catering services',
    defaultServices: [
      'Dine-in Dinner',
      'Weekend Brunch',
      'Takeout & Delivery',
      'Craft Cocktails',
      'Catering Service',
      'Private Events',
    ],
  },
  {
    id: 'salon',
    value: 'salon',
    label: 'Salon, Spa & Beauty Care',
    icon: '💇‍♀️',
    description: 'Hair salons, barbershops, skin clinics, nail studios, and spas',
    defaultServices: [
      'Haircut & Style',
      'Color & Highlights',
      'Hydra Facial Glow',
      'Manicure / Pedicure',
      'Aroma Massage',
      'Bridal Makeup',
    ],
  },
  {
    id: 'clinic',
    value: 'clinic',
    label: 'Clinic, Dental & Healthcare',
    icon: '🏥',
    description: 'Dentists, doctors, hospitals, diagnostics, and physiotherapists',
    defaultServices: [
      'General Consultation',
      'Dental Cleaning',
      'Eye Exam',
      'Physiotherapy',
      'Dermatology Checkup',
      'Diagnostic Tests',
    ],
  },
  {
    id: 'gym',
    value: 'gym',
    label: 'Gym, Fitness & Yoga Studios',
    icon: '🏋️',
    description: 'Gyms, crossfit boxes, personal trainers, yoga, and dance studios',
    defaultServices: [
      'Personal Training',
      'Weight Training',
      'Yoga Session',
      'Crossfit & HIIT',
      'Nutrition Consultation',
      'Zumba Dance',
    ],
  },
  {
    id: 'realestate',
    value: 'realestate',
    label: 'Real Estate, Interior & Architecture',
    icon: '🏢',
    description: 'Realtors, interior designers, architects, and builders',
    defaultServices: [
      'Property Buying/Selling',
      'Interior Design',
      'Architectural Planning',
      'Home Renovation',
      'Site Inspection',
      'Commercial Leasing',
    ],
  },
  {
    id: 'education',
    value: 'education',
    label: 'Education, Coaching & Tuition',
    icon: '🎓',
    description: 'Coaching centers, tutors, tech institutes, and language academies',
    defaultServices: [
      'Competitive Exam Coaching',
      'CBSE/ICSE Tuition',
      'Tech & Coding Bootcamp',
      'Spoken English & IELTS',
      'One-on-One Mentorship',
    ],
  },
  {
    id: 'homeservices',
    value: 'homeservices',
    label: 'Home Services & Trade Repairs',
    icon: '🛠️',
    description: 'Plumbing, electrical, AC repair, carpentry, painting, and cleaning',
    defaultServices: [
      'Plumbing Repair',
      'Electrical Wiring',
      'AC Installation & Repair',
      'Pest Control',
      'Deep Home Cleaning',
      'Carpentry Work',
    ],
  },
  {
    id: 'legal_finance',
    value: 'legal_finance',
    label: 'Legal, CA & Financial Advisory',
    icon: '⚖️',
    description: 'Law firms, chartered accountants, tax consultants, and loan advisors',
    defaultServices: [
      'Tax Audit & GST Filing',
      'Business Incorporation',
      'Legal Consultation',
      'Loan & Mortgage Advisory',
      'Accounting & Bookkeeping',
    ],
  },
  {
    id: 'hotel',
    value: 'hotel',
    label: 'Hotel, Resort & Hospitality',
    icon: '🏨',
    description: 'Hotels, resorts, homestays, and tour operators',
    defaultServices: [
      'Overnight Stay',
      'Luxury Suite',
      'Room Dining',
      'Concierge Service',
      'Swimming Pool & Spa',
      'Event Venue Booking',
    ],
  },
  {
    id: 'retail',
    value: 'retail',
    label: 'Retail Store, Fashion & Supermarket',
    icon: '🛍️',
    description: 'Boutiques, electronics, jewelry, supermarkets, and specialty stores',
    defaultServices: [
      'In-Store Shopping',
      'Custom Fitting',
      'Gift Packaging',
      'Express Curbside Pickup',
      'Bulk Orders',
    ],
  },
  {
    id: 'other',
    value: 'other',
    label: 'Other Industry / Custom Business (Specify Below)',
    icon: '✨',
    description: 'Any other business type (e.g. Photography, Pet Grooming, Solar Energy, Logistics)',
    defaultServices: [
      'Consultation',
      'Standard Service',
      'Express Delivery',
      'Custom Project Solution',
    ],
  },
];

/**
 * Suggestions mapping keyed by category id/value
 */
export const CATEGORY_SUGGESTIONS = CATEGORIES.reduce((acc, cat) => {
  acc[cat.id] = cat.defaultServices;
  acc[cat.value] = cat.defaultServices;
  return acc;
}, {});

/**
 * Resolves a human-friendly display label for any category.
 * If user selected 'other', returns customCategory if provided.
 */
export function getCategoryLabel(categoryId, customCategory = '') {
  if (customCategory && customCategory.trim()) {
    return customCategory.trim();
  }
  const found = CATEGORIES.find((c) => c.id === categoryId || c.value === categoryId);
  if (found) {
    if (found.id === 'other') {
      return customCategory.trim() || 'Custom Business';
    }
    return found.label;
  }
  // Return the raw value if it's already a custom category string (e.g. "Pet Grooming")
  return categoryId || 'Service';
}

/**
 * Returns suggested services for any category.
 * Matches exact id/value, full labels, or common industry keywords.
 */
export function getCategoryServices(categoryId) {
  if (!categoryId) return CATEGORY_SUGGESTIONS['other'] || ['General Service'];
  if (CATEGORY_SUGGESTIONS[categoryId]) return CATEGORY_SUGGESTIONS[categoryId];

  const clean = String(categoryId).trim().toLowerCase();
  for (const cat of CATEGORIES) {
    if (
      cat.id.toLowerCase() === clean ||
      cat.value.toLowerCase() === clean ||
      cat.label.toLowerCase() === clean ||
      clean.includes(cat.id)
    ) {
      return cat.defaultServices;
    }
  }

  // Keyword-based fallback matching
  if (/it|software|marketing|web|tech|digital|developer|app|agency/i.test(clean)) return CATEGORY_SUGGESTIONS['it_marketing'];
  if (/auto|car|garage|motor|mechanic|tyre|vehicle/i.test(clean)) return CATEGORY_SUGGESTIONS['automobile'];
  if (/salon|beauty|spa|hair|barber|nail|glow/i.test(clean)) return CATEGORY_SUGGESTIONS['salon'];
  if (/restaurant|cafe|café|food|dining|bakery|bar|dhaba/i.test(clean)) return CATEGORY_SUGGESTIONS['restaurant'];
  if (/dental|dentist|teeth|ortho/i.test(clean)) return CATEGORY_SUGGESTIONS['dental'];
  if (/clinic|doctor|health|medical|physio|hospital/i.test(clean)) return CATEGORY_SUGGESTIONS['healthcare'];
  if (/gym|fitness|yoga|crossfit|trainer/i.test(clean)) return CATEGORY_SUGGESTIONS['fitness'];
  if (/retail|store|shop|mart|boutique/i.test(clean)) return CATEGORY_SUGGESTIONS['retail'];
  if (/hotel|resort|stay|lodge|hospitality/i.test(clean)) return CATEGORY_SUGGESTIONS['hotel'];
  if (/real estate|property|realty|housing/i.test(clean)) return CATEGORY_SUGGESTIONS['real_estate'];
  if (/school|college|tuition|academy|coaching|education/i.test(clean)) return CATEGORY_SUGGESTIONS['education'];
  if (/repair|repairing|electronic|appliances/i.test(clean)) return CATEGORY_SUGGESTIONS['electronics'];
  if (/ca |legal|law|account|consult|tax|advisory/i.test(clean)) return CATEGORY_SUGGESTIONS['professional'];

  return CATEGORY_SUGGESTIONS['other'] || ['Consultation', 'Standard Service', 'Custom Project Solution'];
}
