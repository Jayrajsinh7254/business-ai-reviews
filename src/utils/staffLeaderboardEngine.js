/**
 * Staff Attribution & Star Leaderboard Engine
 * Handles staff review tracking, leaderboard calculations,
 * organic AI praise injection, and personal QR/link generation.
 */

export const DEFAULT_DEMO_STAFF = [
  {
    id: 'staff-priya',
    name: 'Priya Sharma',
    role: 'Senior Stylist & Service Lead',
    email: 'priya.sharma@example.com',
    avatar: '👩‍💼',
    initials: 'PS',
    badge: '🥇 Gold Star',
    reviewsCount: 38,
    fiveStarCount: 37,
    avgRating: 4.97,
    praiseTags: ['Attentive & Gentle', 'Super Polite', 'Flawless Styling'],
    monthlyTarget: 30,
    incentiveBonus: '₹2,500',
    joinedDate: '2025-08-15',
  },
  {
    id: 'staff-rahul',
    name: 'Rahul Verma',
    role: 'Front Desk & Guest Experience',
    email: 'rahul.verma@example.com',
    avatar: '👨‍💼',
    initials: 'RV',
    badge: '🥈 Silver Star',
    reviewsCount: 29,
    fiveStarCount: 27,
    avgRating: 4.88,
    praiseTags: ['Quick Turnaround', 'Welcoming Smile', 'Zero Wait Time'],
    monthlyTarget: 25,
    incentiveBonus: '₹1,800',
    joinedDate: '2025-10-01',
  },
  {
    id: 'staff-amit',
    name: 'Amit Patel',
    role: 'Senior Master Technician',
    email: 'amit.patel@example.com',
    avatar: '👨‍🔧',
    initials: 'AP',
    badge: '🥉 Bronze Star',
    reviewsCount: 24,
    fiveStarCount: 23,
    avgRating: 4.85,
    praiseTags: ['Honest Advice', 'Transparent Pricing', 'Thorough Inspection'],
    monthlyTarget: 20,
    incentiveBonus: '₹1,200',
    joinedDate: '2025-11-12',
  },
  {
    id: 'staff-sneha',
    name: 'Sneha Reddy',
    role: 'Customer Care Specialist',
    email: 'sneha.reddy@example.com',
    avatar: '👩‍⚕️',
    initials: 'SR',
    badge: 'Rising Star',
    reviewsCount: 16,
    fiveStarCount: 15,
    avgRating: 4.80,
    praiseTags: ['Friendly Tone', 'Patient Care', 'Very Knowledgeable'],
    monthlyTarget: 15,
    incentiveBonus: '₹800',
    joinedDate: '2026-01-10',
  },
];

const LOCAL_STORAGE_STAFF_KEY = 'reviewassist_staff_members';

/**
 * Gets staff list for a business, falling back to pre-seeded demo staff
 */
export function getBusinessStaffList(businessId = 'demo-1', registeredTeamMembers = []) {
  try {
    const raw = localStorage.getItem(`${LOCAL_STORAGE_STAFF_KEY}_${businessId}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.warn('Could not read staff list from localStorage:', e);
  }

  // If there are real registered team members from AuthContext/TeamManagement, merge them
  if (Array.isArray(registeredTeamMembers) && registeredTeamMembers.length > 0) {
    const registeredMapped = registeredTeamMembers.map((m, idx) => {
      const existingDemo = DEFAULT_DEMO_STAFF.find((d) => d.email === m.email || d.name?.toLowerCase() === m.name?.toLowerCase());
      return {
        id: m.id || `staff-${idx}`,
        name: m.name || m.email?.split('@')[0] || 'Staff Member',
        role: m.role === 'business_owner' ? 'Owner / Lead' : 'Staff Specialist',
        email: m.email || '',
        avatar: existingDemo?.avatar || (idx % 2 === 0 ? '👩‍💼' : '👨‍💼'),
        initials: (m.name || 'SM')
          .split(' ')
          .map((n) => n[0])
          .join('')
          .toUpperCase()
          .slice(0, 2),
        badge: existingDemo?.badge || 'Team Member',
        reviewsCount: existingDemo?.reviewsCount || (12 + (idx * 5)),
        fiveStarCount: existingDemo?.fiveStarCount || (11 + (idx * 5)),
        avgRating: existingDemo?.avgRating || 4.85,
        praiseTags: existingDemo?.praiseTags || ['Courteous Service', 'Fast & Reliable'],
        monthlyTarget: existingDemo?.monthlyTarget || 20,
        incentiveBonus: existingDemo?.incentiveBonus || '₹1,000',
        joinedDate: m.invitedAt || '2026-01-01',
      };
    });
    return registeredMapped;
  }

  return DEFAULT_DEMO_STAFF;
}

/**
 * Computes live leaderboard metrics by aggregating confirmed customer reviews
 */
export function calculateStaffLeaderboard(staffList = [], reviewsList = []) {
  if (!Array.isArray(staffList) || staffList.length === 0) {
    return [];
  }

  // Count reviews per staff member
  const staffStatsMap = {};
  staffList.forEach((s) => {
    staffStatsMap[s.id] = {
      ...s,
      liveReviewCount: 0,
      liveFiveStarCount: 0,
      liveRatingSum: 0,
      collectedPraise: [],
    };
  });

  if (Array.isArray(reviewsList)) {
    reviewsList.forEach((rev) => {
      const targetId = rev.staffId || rev.staff_id;
      const targetName = (rev.staffName || rev.staff_name || '').toLowerCase().trim();

      // Find staff by ID or Name
      let matchedStaff = staffList.find((s) => s.id === targetId);
      if (!matchedStaff && targetName) {
        matchedStaff = staffList.find((s) => s.name.toLowerCase().includes(targetName) || targetName.includes(s.name.toLowerCase()));
      }

      if (matchedStaff && staffStatsMap[matchedStaff.id]) {
        const stats = staffStatsMap[matchedStaff.id];
        stats.liveReviewCount += 1;
        const rating = Number(rev.rating) || 5;
        stats.liveRatingSum += rating;
        if (rating === 5) {
          stats.liveFiveStarCount += 1;
        }
        if (rev.whatStoodOut) {
          stats.collectedPraise.push(rev.whatStoodOut);
        }
      }
    });
  }

  // Calculate final aggregated score
  const computedList = staffList.map((s) => {
    const live = staffStatsMap[s.id] || {};
    const totalReviews = (s.reviewsCount || 0) + (live.liveReviewCount || 0);
    const totalFiveStars = (s.fiveStarCount || 0) + (live.liveFiveStarCount || 0);
    const baseSum = (s.reviewsCount || 0) * (s.avgRating || 4.8);
    const totalSum = baseSum + (live.liveRatingSum || 0);
    const effectiveAvg = totalReviews > 0 ? (totalSum / totalReviews).toFixed(2) : '5.00';
    const fiveStarPct = totalReviews > 0 ? Math.round((totalFiveStars / totalReviews) * 100) : 100;

    return {
      ...s,
      totalReviews,
      totalFiveStars,
      avgRating: parseFloat(effectiveAvg),
      fiveStarPercentage: fiveStarPct,
      isTargetMet: totalReviews >= (s.monthlyTarget || 20),
      targetProgress: Math.min(100, Math.round((totalReviews / (s.monthlyTarget || 20)) * 100)),
    };
  });

  // Sort by total reviews (descending), then by avgRating (descending)
  computedList.sort((a, b) => {
    if (b.totalReviews !== a.totalReviews) {
      return b.totalReviews - a.totalReviews;
    }
    return b.avgRating - a.avgRating;
  });

  // Assign ranks & podium badges
  return computedList.map((staff, idx) => {
    let rankBadge = `${idx + 1}th Place`;
    let medal = '';
    if (idx === 0) {
      rankBadge = '🥇 Gold Star Performer';
      medal = '🥇';
    } else if (idx === 1) {
      rankBadge = '🥈 Silver Star Performer';
      medal = '🥈';
    } else if (idx === 2) {
      rankBadge = '🥉 Bronze Star Performer';
      medal = '🥉';
    }

    return {
      ...staff,
      rank: idx + 1,
      rankBadge,
      medal,
    };
  });
}

/**
 * Generates an attributed review link for a specific staff member
 */
export function generateStaffReviewUrl(businessId, staffName, staffId) {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://reviewassist.ai';
  const cleanBiz = encodeURIComponent(businessId || 'demo-1');
  const cleanStaff = encodeURIComponent((staffName || '').trim());
  const cleanId = staffId ? encodeURIComponent(staffId) : '';

  let url = `${origin}/review/${cleanBiz}?staff=${cleanStaff}`;
  if (cleanId) {
    url += `&staffId=${cleanId}`;
  }
  return url;
}

/**
 * Returns natural, conversational praise phrases to insert into AI reviews
 */
export function getStaffPraisePhrase(staffName, language = 'english') {
  if (!staffName || !staffName.trim()) return '';
  const name = staffName.trim();
  const lang = (language || 'english').toLowerCase().trim();

  const phraseMap = {
    english: [
      `Special shoutout to ${name} for being exceptionally polite, attentive, and making the whole experience effortless!`,
      `Huge thanks to ${name} for taking great care of everything with utmost professionalism and patience.`,
      `${name} was truly outstanding—super courteous, knowledgeable, and delivered 5-star service throughout!`,
      `Really appreciate the personalized care and attention from ${name}. A true asset to the business!`,
      `Special appreciation to ${name} for their warm hospitality and prompt assistance.`,
    ],
    hindi: [
      `विशेष रूप से ${name} जी का व्यवहार और सेवा बहुत ही विनम्र, पेशेवर और सराहनीय रही।`,
      `${name} जी ने पूरे धैर्य और कुशलता के साथ बहुत ही बेहतरीन 5-स्टार सेवा प्रदान की। धन्यवाद!`,
      `खासतौर पर ${name} का काम और बात करने का तरीका बहुत ही शानदार और मददगार था।`,
    ],
    gujarati: [
      `ખાસ કરીને ${name} નું વર્તન અને સેવા ખૂબ જ નમ્ર, ઝડપી અને ઉત્તમ રહી. ખૂબ ખૂબ આભાર!`,
      `${name} ભાઈ/બેન એ દરેક બાબતમાં ખૂબ જ મદદ કરી અને ૫-સ્ટાર અનુભવ આપ્યો.`,
    ],
    spanish: [
      `¡Un agradecimiento especial a ${name} por una atención tan amable, dedicada y profesional en todo momento!`,
      `${name} nos brindó un servicio verdaderamente excepcional de 5 estrellas. ¡Muy recomendado!`,
    ],
    german: [
      `Ein ganz besonderes Dankeschön an ${name} für die hervorragende, freundliche und kompetente Betreuung!`,
      `${name} hat sich vorbildlich gekümmert und einen erstklassigen 5-Sterne-Service geboten.`,
    ],
    french: [
      `Un grand merci particulier à ${name} pour son accueil chaleureux, sa bienveillance et son professionnalisme remarquable!`,
      `${name} a offert un service 5 étoiles absolument parfait du début à la fin.`,
    ],
  };

  const pool = phraseMap[lang] || phraseMap.english;
  return pool[Math.floor(Math.random() * pool.length)];
}
