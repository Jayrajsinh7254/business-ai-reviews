/**
 * Competitor Review Radar — AI Sentiment & Competitive Intelligence Engine
 * Extracts competitor vulnerabilities, negative review trends, and generates
 * high-converting counter-strike campaigns for local businesses.
 */

// Category-specific competitor presets with realistic competitor insights
export const CATEGORY_COMPETITOR_PRESETS = {
  restaurant: [
    {
      id: 'comp-rest-1',
      name: 'The Rustic Fork Bistro',
      rating: 4.1,
      reviewCount: 420,
      distance: '0.8 km away',
      address: 'Near Central Plaza',
      topWeaknesses: [
        {
          aspect: 'Wait Time & Seating',
          severity: 'Critical',
          score: 38, // Out of 100 satisfaction
          complaintsCount: 29,
          summary: 'Long 40+ min weekend wait times even with reservations; table turnover is chaotic.',
          sampleQuote: '"Had a reservation at 8 PM but was made to wait outside till 8:45 PM. Zero communication from the host."',
        },
        {
          aspect: 'Portion Size & Pricing',
          severity: 'High',
          score: 45,
          complaintsCount: 18,
          summary: 'Prices increased recently by 25% with noticeably smaller portions on main courses.',
          sampleQuote: '"Pasta was ₹480 for 5 mouthfuls. Left feeling hungry and overbilled."',
        },
        {
          aspect: 'Noise & Table Spacing',
          severity: 'Moderate',
          score: 52,
          complaintsCount: 12,
          summary: 'Tables packed too close together; loud acoustics make conversation difficult.',
          sampleQuote: '"Could literally hear the next table chewing. Not recommended for quiet dates."',
        },
      ],
      topStrengths: [
        'Aesthetic neon decor for Instagram photos',
        'Tasty truffle fries and mocktails',
      ],
      sentimentBreakdown: {
        foodQuality: 78,
        speedOfService: 42,
        valueForMoney: 46,
        ambiance: 65,
        staffCourtesy: 58,
      },
    },
    {
      id: 'comp-rest-2',
      name: 'Spice Garden Express',
      rating: 3.9,
      reviewCount: 290,
      distance: '1.2 km away',
      address: 'Main Market Road',
      topWeaknesses: [
        {
          aspect: 'Delivery & Packaging',
          severity: 'Critical',
          score: 32,
          complaintsCount: 34,
          summary: 'Frequent gravy leaks, missing condiments, and cold food delivery.',
          sampleQuote: '"Dal Makhani was spilled all over the paper bag. Container lids were loose."',
        },
        {
          aspect: 'Consistency',
          severity: 'High',
          score: 48,
          complaintsCount: 15,
          summary: 'Dishes taste completely different on weekdays vs weekends depending on the chef.',
          sampleQuote: '"Ordered the same Paneer Tikka twice this week. One was delicious, the second was burnt."',
        },
      ],
      topStrengths: [
        'Affordable thali lunch options',
        'Large outdoor seating area',
      ],
      sentimentBreakdown: {
        foodQuality: 62,
        speedOfService: 51,
        valueForMoney: 72,
        ambiance: 55,
        staffCourtesy: 50,
      },
    },
  ],

  salon: [
    {
      id: 'comp-salon-1',
      name: 'Glamour Locks & Spa Lounge',
      rating: 4.0,
      reviewCount: 360,
      distance: '0.5 km away',
      address: '1st Floor, City Center',
      topWeaknesses: [
        {
          aspect: 'Aggressive Product Upselling',
          severity: 'Critical',
          score: 36,
          complaintsCount: 31,
          summary: 'Stylists push ₹3,000+ serums and hair spas repeatedly during simple haircuts.',
          sampleQuote: '"The stylist would not stop nagging me to buy their ₹4,500 keratin shampoo. Felt like a high-pressure sales pitch rather than a relaxing haircut."',
        },
        {
          aspect: 'Appointment Delays',
          severity: 'High',
          score: 44,
          complaintsCount: 22,
          summary: 'Customers with confirmed slots routinely wait 25-35 minutes while walk-ins take priority.',
          sampleQuote: '"Booked a 4 PM hair color slot. They didn\'t even wash my hair till 4:45 PM."',
        },
        {
          aspect: 'Inconsistent Color Results',
          severity: 'Moderate',
          score: 55,
          complaintsCount: 14,
          summary: 'Balayage and highlights turning brassy or orange instead of ash blonde.',
          sampleQuote: '"Showed a picture of caramel balayage, ended up with copper orange streaks."',
        },
      ],
      topStrengths: [
        'Clean modern wash basins',
        'Free green tea & beverage service',
      ],
      sentimentBreakdown: {
        stylistSkill: 74,
        speedOfService: 46,
        valueForMoney: 49,
        ambiance: 82,
        customerRespect: 42,
      },
    },
    {
      id: 'comp-salon-2',
      name: 'The Barber & Style Co.',
      rating: 4.2,
      reviewCount: 210,
      distance: '1.4 km away',
      address: 'Opp. Metro Station',
      topWeaknesses: [
        {
          aspect: 'Hygiene & Cleanliness',
          severity: 'Critical',
          score: 41,
          complaintsCount: 19,
          summary: 'Unwashed aprons, hair clippings left on chairs, and dirty combs between clients.',
          sampleQuote: '"Used the same trimmer without sanitizing it in front of me. Found stray hair on the neck cape."',
        },
      ],
      topStrengths: [
        'Quick 15-minute express beard trims',
        'Economical ₹150 haircut price',
      ],
      sentimentBreakdown: {
        stylistSkill: 69,
        speedOfService: 80,
        valueForMoney: 78,
        ambiance: 48,
        customerRespect: 60,
      },
    },
  ],

  automobile: [
    {
      id: 'comp-auto-1',
      name: 'Apex Motor Care & Garage',
      rating: 3.8,
      reviewCount: 510,
      distance: '1.5 km away',
      address: 'Industrial Area Phase 2',
      topWeaknesses: [
        {
          aspect: 'Hidden Charges & Estimate Shocks',
          severity: 'Critical',
          score: 30,
          complaintsCount: 42,
          summary: 'Initial estimate of ₹4,000 balloons into ₹11,500 without prior phone authorization.',
          sampleQuote: '"Dropped car for regular 40,000 km oil service. Bill came out to ₹14,200 with random \'lubrication spray\' and \'sensor cleaning\' fees I never asked for."',
        },
        {
          aspect: 'Delivery Timeline Breaches',
          severity: 'High',
          score: 42,
          complaintsCount: 26,
          summary: 'Same-day promises regularly turn into 3-day hold-ups due to delayed part sourcing.',
          sampleQuote: '"Promised delivery by 6 PM. Kept calling till 9 PM with no response. Got my car 2 days later."',
        },
      ],
      topStrengths: [
        'Spacious waiting lounge with Wi-Fi',
        'Official diagnostic scanner tools',
      ],
      sentimentBreakdown: {
        workmanship: 71,
        transparency: 33,
        speedOfService: 44,
        valueForMoney: 39,
        staffCourtesy: 56,
      },
    },
  ],

  medical: [
    {
      id: 'comp-med-1',
      name: 'LifeCare Polyclinic & Diagnostics',
      rating: 3.9,
      reviewCount: 380,
      distance: '1.1 km away',
      address: 'Ring Road Junction',
      topWeaknesses: [
        {
          aspect: 'Overcrowded Waiting Room',
          severity: 'Critical',
          score: 35,
          complaintsCount: 38,
          summary: 'Patients with token numbers wait 1.5 to 2 hours in cramped, stuffy corridors.',
          sampleQuote: '"What is the point of online booking when you make a sick elderly patient wait 2 hours in a plastic chair?"',
        },
        {
          aspect: 'Rude Reception Staff',
          severity: 'High',
          score: 40,
          complaintsCount: 27,
          summary: 'Reception desk answers queries curtly and mishandles printed blood test reports.',
          sampleQuote: '"The billing lady acted like she was doing us a charity. Extremely disrespectful."',
        },
      ],
      topStrengths: [
        'Senior doctors with 20+ years experience',
        'In-house pharmacy stocked with rare medicines',
      ],
      sentimentBreakdown: {
        doctorCare: 82,
        speedOfService: 36,
        valueForMoney: 58,
        cleanliness: 62,
        staffCourtesy: 41,
      },
    },
  ],

  dental: [
    {
      id: 'comp-dent-1',
      name: 'SmileCraft Dental Studio',
      rating: 4.1,
      reviewCount: 195,
      distance: '0.9 km away',
      address: 'Sunrise Commercial Hub',
      topWeaknesses: [
        {
          aspect: 'Pain Management & Roughness',
          severity: 'High',
          score: 46,
          complaintsCount: 16,
          summary: 'Rushed scaling/cleaning causing gum bleeding without gentle local numbing gel.',
          sampleQuote: '"Cleaning was extremely painful. The assistant seemed in a massive hurry."',
        },
        {
          aspect: 'Root Canal Price Quotations',
          severity: 'Moderate',
          score: 50,
          complaintsCount: 12,
          summary: 'Crown prices quoted 40% higher than neighboring certified clinics.',
          sampleQuote: '"Quoted ₹18,000 for a single zirconia crown. Got the exact same 3M crown for ₹11,000 elsewhere."',
        },
      ],
      topStrengths: [
        'High-tech 3D intraoral scanner',
        'Painless digital X-rays',
      ],
      sentimentBreakdown: {
        treatmentQuality: 77,
        gentleness: 51,
        valueForMoney: 49,
        clinicHygiene: 88,
        staffCourtesy: 68,
      },
    },
  ],

  it_marketing: [
    {
      id: 'comp-it-1',
      name: 'PixelCraft Digital Agency',
      rating: 4.0,
      reviewCount: 145,
      distance: '2.5 km away',
      address: 'Tech Park Tower B',
      topWeaknesses: [
        {
          aspect: 'Ghosting After Advance Payment',
          severity: 'Critical',
          score: 32,
          complaintsCount: 19,
          summary: 'Communication drops dramatically once the 50% deposit is paid; weekly updates stop.',
          sampleQuote: '"Took 2 weeks just to reply to our website mockup feedback. Project delayed by 2 months."',
        },
        {
          aspect: 'Cookie-Cutter Templates',
          severity: 'High',
          score: 48,
          complaintsCount: 14,
          summary: 'Promised custom code but delivered a generic off-the-shelf WordPress theme.',
          sampleQuote: '"Our site looks identical to three other sites in our city. Very disappointing."',
        },
      ],
      topStrengths: [
        'Good graphic design and logo creation',
        'Active on LinkedIn and social media',
      ],
      sentimentBreakdown: {
        codeQuality: 64,
        communicationSpeed: 38,
        valueForMoney: 52,
        creativity: 75,
        deadlineAdherence: 43,
      },
    },
  ],

  fitness: [
    {
      id: 'comp-fit-1',
      name: 'IronCore Fitness & CrossFit',
      rating: 3.9,
      reviewCount: 310,
      distance: '1.0 km away',
      address: 'Clubhouse Road',
      topWeaknesses: [
        {
          aspect: 'Broken Equipment & Slow Repairs',
          severity: 'Critical',
          score: 37,
          complaintsCount: 28,
          summary: '3 out of 6 treadmills out of order for over 3 weeks during peak evening hours.',
          sampleQuote: '"Treadmills are broken constantly. Lines of 10 people waiting for cardio machines at 7 PM."',
        },
        {
          aspect: 'Unclean Showers & Lockers',
          severity: 'High',
          score: 43,
          complaintsCount: 21,
          summary: 'Damp locker room odor, mold in shower stalls, and lockers with missing keys.',
          sampleQuote: '"Shower water pressure is non-existent and the floor is constantly flooded."',
        },
      ],
      topStrengths: [
        'Heavy dumbbell rack up to 50kg',
        'Vibrant energetic music playlist',
      ],
      sentimentBreakdown: {
        equipmentVariety: 72,
        maintenanceSpeed: 39,
        hygiene: 44,
        trainerGuidance: 60,
        valueForMoney: 55,
      },
    },
  ],

  retail: [
    {
      id: 'comp-ret-1',
      name: 'SuperMart Essentials & Groceries',
      rating: 4.0,
      reviewCount: 480,
      distance: '0.6 km away',
      address: 'Sector 4 Corner',
      topWeaknesses: [
        {
          aspect: 'Long Billing Queues',
          severity: 'Critical',
          score: 34,
          complaintsCount: 39,
          summary: 'Only 2 out of 6 POS billing counters staffed during rush hours 6 PM - 9 PM.',
          sampleQuote: '"Spent 15 minutes picking items and 35 minutes standing in the billing queue. Total nightmare."',
        },
        {
          aspect: 'Price Discrepancy at POS',
          severity: 'High',
          score: 45,
          complaintsCount: 19,
          summary: 'Shelf tag shows promotional discount but computer scans at full MRP.',
          sampleQuote: '"Check your receipt! Shelf showed Buy 1 Get 1, bill charged full price for both."',
        },
      ],
      topStrengths: [
        'Wide variety of imported snacks and dry fruits',
        'Ample two-wheeler parking',
      ],
      sentimentBreakdown: {
        productStock: 82,
        billingSpeed: 38,
        priceHonesty: 51,
        storeCleanliness: 70,
        staffHelpfulness: 55,
      },
    },
  ],
};

// Generic fallback presets for any other industry
export const GENERIC_COMPETITOR_PRESET = [
  {
    id: 'comp-gen-1',
    name: 'Premier Local Competitor Hub',
    rating: 4.0,
    reviewCount: 310,
    distance: '1.1 km away',
    address: 'Commercial High Street',
    topWeaknesses: [
      {
        aspect: 'Customer Service & Response Time',
        severity: 'Critical',
        score: 38,
        complaintsCount: 26,
        summary: 'Slow to answer WhatsApp messages and calls; staff seems uninterested.',
        sampleQuote: '"Sent 3 messages asking for a quote. Got a reply after 48 hours with barely one line."',
      },
      {
        aspect: 'Billing Transparency',
        severity: 'High',
        score: 47,
        complaintsCount: 17,
        summary: 'Hidden GST or surcharge added after final service without prior explanation.',
        sampleQuote: '"Was told one price on the phone, charged 20% higher at final payment."',
      },
      {
        aspect: 'Punctuality & Turnaround',
        severity: 'Moderate',
        score: 53,
        complaintsCount: 13,
        summary: 'Deliverables and bookings consistently run 20-40 minutes late.',
        sampleQuote: '"Scheduled for 11 AM, service didn\'t begin until 11:45 AM."',
      },
    ],
    topStrengths: [
      'Prominent street frontage and brand name',
      'Wide product / service catalog',
    ],
    sentimentBreakdown: {
      qualityOfWork: 73,
      speedOfService: 48,
      valueForMoney: 52,
      communication: 40,
      ambiance: 66,
    },
  },
];

/**
 * Get preloaded competitors for a business based on its category
 */
export function getCompetitorsForCategory(categoryKey) {
  if (!categoryKey) return CATEGORY_COMPETITOR_PRESETS.salon;
  const key = String(categoryKey).toLowerCase().replace(/[^a-z0-9_]/g, '_');
  
  for (const [cat, list] of Object.entries(CATEGORY_COMPETITOR_PRESETS)) {
    if (key.includes(cat) || cat.includes(key)) {
      return list;
    }
  }
  return CATEGORY_COMPETITOR_PRESETS.salon || GENERIC_COMPETITOR_PRESET;
}

/**
 * Generate Actionable "Counter-Strike" Marketing Campaigns
 * Designed to steal frustrated customers from the competitor's biggest weakness.
 */
export function generateCounterCampaigns(myBusinessName, competitor, topWeakness) {
  const biz = myBusinessName || 'Our Business';
  const comp = competitor?.name || 'Nearby Competitor';
  const weakness = topWeakness?.aspect || 'Service Quality';

  return [
    {
      id: 'camp-wa-1',
      channel: 'WhatsApp & SMS Broadcast',
      icon: '💬',
      badge: '🔥 Highest Conversion',
      headline: `The "No-Surprise Honesty Guarantee" Campaign`,
      strategy: `Directly targets patrons fed up with ${competitor.name}'s ${weakness.toLowerCase()}.`,
      copyText: `Hi there! 👋 Frustrated by ${weakness.toLowerCase()} and hidden fees at other local spots? \n\nAt *${biz}*, we believe in 100% upfront transparency, zero delays, and genuine 5-star service. \n\n🎁 *This Week Only:* Book your visit with code *HONESTY10* for a flat 10% privilege discount on all services! \n\n👉 Reserve your slot or view reviews: [Your Review Link]`,
      callToAction: 'Send to Customer WhatsApp List',
    },
    {
      id: 'camp-ig-2',
      channel: 'Instagram Post / Story Copy',
      icon: '📸',
      badge: '⭐ Local Social Proof',
      headline: `The "Contrast & Win" Social Post`,
      strategy: `Positions ${biz} as the premier premium alternative without mentioning competitor names directly.`,
      copyText: `Why do 500+ locals choose ${biz} over the rest? 🌟\n\n✅ 0 Wait Times with our Priority Booking\n✅ 100% Upfront Honest Estimates\n✅ Certified Warm & Attentive Professionals\n\nExperience the difference true 5-star hospitality makes. Link in bio to book your session! 📍✨\n\n#LocalFavorite #TopRated #CustomerFirst #${biz.replace(/\\s+/g, '')}`,
      callToAction: 'Copy Caption for Instagram',
    },
    {
      id: 'camp-staff-3',
      channel: 'Counter Staff Talking Point',
      icon: '🗣️',
      badge: '🤝 In-Store Retention',
      headline: `Front-Desk Verbal Pitch for Walk-Ins`,
      strategy: `Gives your front-desk staff the exact sentence to reassure first-time visitors who tried ${comp} previously.`,
      copyText: `"Welcome to ${biz}! If you've had frustrating wait times or unclear billing elsewhere in the neighborhood, rest assured you're in good hands today. We quote everything clearly before starting and guarantee on-time service."`,
      callToAction: 'Share with Staff Team',
    },
  ];
}

/**
 * Analyze a custom pasted competitor review
 * Deconstructs negative sentiment, flags root cause, and provides a business counter-move.
 */
export function deconstructCompetitorReview(reviewText, myBusinessName = 'Our Business') {
  if (!reviewText || !reviewText.trim()) {
    return null;
  }

  const textLower = reviewText.toLowerCase();

  // Root cause classification
  let rootCause = 'General Customer Dissatisfaction';
  let emotion = 'Frustration';
  let counterMove = 'Highlight attentive, personalized care and responsive communication.';

  if (textLower.includes('wait') || textLower.includes('delay') || textLower.includes('late') || textLower.includes('hour') || textLower.includes('slow')) {
    rootCause = 'Excessive Wait Time & Operational Inefficiency';
    emotion = 'Time Disrespect & Impatience';
    counterMove = `Emphasize ${myBusinessName}'s 'On-Time Appointment Guarantee' and express service slots in your marketing.`;
  } else if (textLower.includes('bill') || textLower.includes('charge') || textLower.includes('price') || textLower.includes('cost') || textLower.includes('money') || textLower.includes('hidden') || textLower.includes('expensive')) {
    rootCause = 'Price Discrepancy & Perceived Lack of Value';
    emotion = 'Feeling Cheated / Betrayed';
    counterMove = `Promote transparent digital billing estimates with zero hidden add-ons before work begins.`;
  } else if (textLower.includes('rude') || textLower.includes('attitude') || textLower.includes('arrogant') || textLower.includes('behavior') || textLower.includes('shout') || textLower.includes('ignore')) {
    rootCause = 'Staff Unprofessionalism & Poor Hospitality';
    emotion = 'Anger & Humiliation';
    counterMove = `Spotlight your certified, smiling team members on social media and share your customer-first hospitality pledge.`;
  } else if (textLower.includes('dirty') || textLower.includes('hair') || textLower.includes('hygiene') || textLower.includes('clean') || textLower.includes('smell') || textLower.includes('cockroach') || textLower.includes('dust')) {
    rootCause = 'Hygiene & Cleanliness Failure';
    emotion = 'Disgust & Distrust';
    counterMove = `Showcase behind-the-scenes sterilization, clean towels, and spotless hygiene on your WhatsApp status and Instagram reels.`;
  }

  // Calculate sentiment negativity score
  const negativeWordTriggers = ['worst', 'bad', 'horrible', 'terrible', 'disappointed', 'waste', 'cheat', 'never', 'poor', 'rude', 'dirty', 'useless'];
  let triggerCount = 0;
  negativeWordTriggers.forEach((word) => {
    if (textLower.includes(word)) triggerCount += 1;
  });

  const severityScore = Math.min(95, 60 + triggerCount * 8);

  return {
    rootCause,
    emotion,
    severityScore,
    counterMove,
    strategicSummary: `This review highlights an acute pain point in ${rootCause}. By addressing this head-on in your local messaging, ${myBusinessName} can attract their dissatisfied clientele.`,
  };
}
