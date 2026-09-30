/**
 * AI Owner Reply Generation Engine
 * Generates natural, human-sounding, category-aware, and SEO-optimized
 * responses for Google Business Profile reviews and private intercepts.
 */

// Sample demo presets for instant testing
export const SAMPLE_REVIEWS = [
  {
    label: '🌟 5★ Outstanding Service',
    rating: 5,
    customerName: 'Aarav Sharma',
    serviceType: 'Full Synthetic Oil Change',
    text: 'Top notch service! The team was super honest, explained everything clearly, and had my car ready in under 45 minutes. Definitely my go-to place from now on.',
  },
  {
    label: '🌟 5★ Great Ambience & Team',
    rating: 5,
    customerName: 'Pooja Patel',
    serviceType: 'Balayage & Hair Styling',
    text: 'Loved my experience here! The staff was incredibly welcoming, listened to exactly what I wanted, and the results exceeded my expectations. 10/10 recommend!',
  },
  {
    label: '⚖️ 3★ Good Quality but Slow',
    rating: 3,
    customerName: 'Rohan Verma',
    serviceType: 'Engine Diagnostics',
    text: 'The work done was solid and solved the issue, but I had to wait nearly 40 minutes past my appointment time before they started. Decent service otherwise.',
  },
  {
    label: '🚨 1★ Urgent Complaint',
    rating: 1,
    customerName: 'Kavita Desai',
    serviceType: 'AC Recharge & Repair',
    text: 'Very disappointed with the billing. The final invoice had surprise charges that were never discussed beforehand, and when I asked, the manager was dismissive.',
  },
];

// 5 Specialized AI Reply Tones
export const REPLY_TONES = [
  {
    id: 'warm',
    label: '🌟 Warm & Grateful',
    tagline: 'Heartfelt appreciation, warm hospitality & welcoming back',
    bestFor: '4★ & 5★ positive reviews',
  },
  {
    id: 'seo',
    label: '💼 Local SEO Boost',
    tagline: 'Strategically embeds category, services & location keywords for Google Maps ranking',
    bestFor: 'Boosting Google Local Pack visibility',
  },
  {
    id: 'community',
    label: '🤝 Neighborhood & Friendly',
    tagline: 'Personal, humble, local community pride',
    bestFor: 'Regulars, families & local neighborhood patrons',
  },
  {
    id: 'resolution',
    label: '🛡️ De-escalation & Resolution',
    tagline: 'Empathetic apology, zero defensiveness & direct offline resolution',
    bestFor: '1★, 2★ & 3★ complaints & shield intercepts',
  },
  {
    id: 'short',
    label: '⚡ Short & Punchy',
    tagline: '1-2 crisp, professional sentences for fast batch replying',
    bestFor: 'Busy owners managing dozens of reviews',
  },
];

// Helper: Pick random item from array
function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Generates 3 distinct AI owner reply variations
 */
export function generateAiReplies({
  rating = 5,
  customerName = '',
  customerText = '',
  serviceType = '',
  businessName = 'our team',
  businessCategory = 'business',
  businessCity = '',
  ownerSignature = '',
  tone = 'warm',
  isPrivateIntercept = false,
  customerContact = '',
}) {
  const numRating = Number(rating) || 5;
  const greetingName = customerName ? `${customerName}` : 'there';
  const cleanBiz = businessName || 'our business';
  const cleanService = serviceType || 'your visit';
  const locationPhrase = businessCity ? ` here in ${businessCity}` : '';
  const signOff = ownerSignature ? `\n\n— ${ownerSignature}` : '';

  // 1. FOR PRIVATE INTERCEPTS (Internal Shield)
  if (isPrivateIntercept) {
    return generatePrivateInterceptReplies({
      numRating,
      greetingName,
      cleanBiz,
      cleanService,
      customerText,
      customerContact,
      signOff,
    });
  }

  // 2. FOR 1-STAR & 2-STAR REVIEWS (Always prioritize de-escalation regardless of chosen tone)
  if (numRating <= 2) {
    return generateNegativeDeescalationReplies({
      numRating,
      greetingName,
      cleanBiz,
      cleanService,
      customerText,
      customerContact,
      signOff,
      tone,
    });
  }

  // 3. FOR 3-STAR REVIEWS (Balanced & constructive)
  if (numRating === 3) {
    return generateNeutralReplies({
      greetingName,
      cleanBiz,
      cleanService,
      customerText,
      signOff,
      tone,
      locationPhrase,
    });
  }

  // 4. FOR 4-STAR & 5-STAR REVIEWS (Tailored by Tone)
  return generatePositiveReplies({
    numRating,
    greetingName,
    cleanBiz,
    cleanService,
    customerText,
    signOff,
    tone,
    locationPhrase,
    businessCategory,
    businessCity,
  });
}

function generatePositiveReplies({
  numRating,
  greetingName,
  cleanBiz,
  cleanService,
  customerText,
  signOff,
  tone,
  locationPhrase,
  businessCategory,
  businessCity = '',
}) {
  const mentionsReviewSnippet = customerText && customerText.length > 15
    ? `We especially appreciate you highlighting your experience with ${cleanService}.`
    : `We are delighted that you had such a wonderful visit for ${cleanService}.`;

  if (tone === 'seo') {
    return [
      {
        id: 'seo-1',
        title: '🎯 Google Local Pack Booster',
        badge: '⚡ Max SEO Value',
        text: `Hi ${greetingName}, thank you so much for the glowing ${numRating}-star rating! As a premier ${businessCategory || 'local service'} provider${locationPhrase}, our goal at ${cleanBiz} is always to deliver top-tier ${cleanService} with honest pricing and exceptional customer care. ${mentionsReviewSnippet} We look forward to serving you again soon!${signOff}`,
        keywords: [cleanBiz, cleanService, businessCategory, businessCity].filter(Boolean),
      },
      {
        id: 'seo-2',
        title: '📍 Local Reputation Anchor',
        badge: '🔍 Search Ranked',
        text: `Thank you for choosing ${cleanBiz}${locationPhrase}! We take tremendous pride in being the trusted local choice for ${cleanService} and high-quality ${businessCategory || 'service'}. Your feedback motivates our entire team to maintain the highest 5-star standard. See you on your next visit!${signOff}`,
        keywords: [cleanBiz, cleanService, businessCategory].filter(Boolean),
      },
      {
        id: 'seo-3',
        title: '⚡ Fast SEO Acknowledgement',
        badge: '🚀 High CTR',
        text: `We really appreciate your 5-star review, ${greetingName}! Providing outstanding ${cleanService} is what we strive for every single day at ${cleanBiz}${locationPhrase}. Thank you for your support and recommendation!${signOff}`,
        keywords: [cleanBiz, cleanService].filter(Boolean),
      },
    ];
  }

  if (tone === 'community') {
    return [
      {
        id: 'comm-1',
        title: '🤝 Local Neighbor Warmth',
        badge: '❤️ Highly Personal',
        text: `Hi ${greetingName}! Hearing from wonderful patrons like you truly makes our day. Small local businesses thrive on community support, and everyone on our team at ${cleanBiz} is grateful you trusted us with your ${cleanService}. Consider yourself family here, and we can’t wait to welcome you back!${signOff}`,
        keywords: [cleanBiz, cleanService],
      },
      {
        id: 'comm-2',
        title: '🌟 Humble & Heartfelt',
        badge: '🏡 Neighborhood Pride',
        text: `Thank you so much, ${greetingName}! We love serving our community${locationPhrase} and making sure each guest leaves with a smile after their ${cleanService}. Thank you for supporting ${cleanBiz}—we appreciate you!${signOff}`,
        keywords: [cleanBiz, cleanService],
      },
      {
        id: 'comm-3',
        title: '✨ Welcoming Invitation',
        badge: '☕ Casual & Friendly',
        text: `Thank you for the kind words, ${greetingName}! The entire staff at ${cleanBiz} was thrilled to see this. Your support means the world to our team. Drop by anytime!${signOff}`,
        keywords: [cleanBiz],
      },
    ];
  }

  if (tone === 'short') {
    return [
      {
        id: 'short-1',
        title: '⚡ Quick & Polite',
        badge: '⏱️ 5-Sec Read',
        text: `Thank you so much for the 5-star review, ${greetingName}! We’re thrilled you were happy with your ${cleanService} at ${cleanBiz}. See you next time!${signOff}`,
        keywords: [cleanBiz, cleanService],
      },
      {
        id: 'short-2',
        title: '💼 Clean & Direct',
        badge: '✨ Professional',
        text: `We truly appreciate your feedback and support, ${greetingName}! Thanks for choosing ${cleanBiz} for your ${cleanService}.${signOff}`,
        keywords: [cleanBiz, cleanService],
      },
      {
        id: 'short-3',
        title: '👍 Warm & Concise',
        badge: '🌟 High Impact',
        text: `Thanks for the wonderful review, ${greetingName}! It was our pleasure taking care of your ${cleanService}. Team ${cleanBiz}.${signOff}`,
        keywords: [cleanBiz],
      },
    ];
  }

  // Default: 'warm' (Warm & Grateful)
  return [
    {
      id: 'warm-1',
      title: '🌟 Warm & Grateful (Recommended)',
      badge: '👑 Best All-Round',
      text: `Hi ${greetingName}, thank you so much for taking the time to share your 5-star experience! The entire team at ${cleanBiz} is thrilled to hear you had such a wonderful visit for ${cleanService}. ${mentionsReviewSnippet} We take immense pride in our work, and your kind words mean the world to us. We look forward to seeing you again soon!${signOff}`,
      keywords: [cleanBiz, cleanService],
    },
    {
      id: 'warm-2',
      title: '🎉 Enthusiastic Appreciation',
      badge: '✨ Uplifting',
      text: `Thank you for the fantastic review, ${greetingName}! Delivering top-quality ${cleanService} and ensuring our guests feel genuinely cared for is our passion at ${cleanBiz}. Your recommendation inspires our whole team to keep raising the bar. Have a great day and see you next time!${signOff}`,
      keywords: [cleanBiz, cleanService],
    },
    {
      id: 'warm-3',
      title: '💼 Professional & Appreciative',
      badge: '🤝 Trusted Tone',
      text: `We sincerely appreciate your positive review, ${greetingName}. It was an absolute pleasure assisting you with ${cleanService}. Thank you for choosing ${cleanBiz} and for being such a valued customer!${signOff}`,
      keywords: [cleanBiz, cleanService],
    },
  ];
}

function generateNeutralReplies({
  greetingName,
  cleanBiz,
  cleanService,
  customerText,
  signOff,
  tone,
  locationPhrase,
}) {
  return [
    {
      id: 'neu-1',
      title: '⚖️ Balanced & Reassuring',
      badge: '🌟 Recommended for 3★',
      text: `Hi ${greetingName}, thank you for your candid feedback regarding your recent ${cleanService} at ${cleanBiz}${locationPhrase}. While we are glad certain aspects met your expectations, our goal is always to deliver an unequivocal 5-star experience. We have shared your comments with our team to refine our processes, and we would love the opportunity to exceed your expectations on your next visit!${signOff}`,
      keywords: [cleanBiz, cleanService],
    },
    {
      id: 'neu-2',
      title: '🤝 Management Follow-Up',
      badge: '📞 Direct Contact',
      text: `Thank you for taking the time to leave a review, ${greetingName}. We appreciate you choosing ${cleanBiz} for ${cleanService}. We take customer feedback very seriously as an opportunity to improve our service speed and communication. If you have any further suggestions on how we can improve, please feel free to reach out to us directly.${signOff}`,
      keywords: [cleanBiz, cleanService],
    },
    {
      id: 'neu-3',
      title: '⚡ Courteous & Constructive',
      badge: '✨ Concise',
      text: `Hi ${greetingName}, thank you for your review. We appreciate your honest thoughts on your ${cleanService}. We are constantly working to improve, and we hope to welcome you back soon for a seamless 5-star experience!${signOff}`,
      keywords: [cleanBiz, cleanService],
    },
  ];
}

function generateNegativeDeescalationReplies({
  numRating,
  greetingName,
  cleanBiz,
  cleanService,
  customerText,
  customerContact,
  signOff,
  tone,
}) {
  return [
    {
      id: 'neg-1',
      title: '🛡️ Diplomatic Resolution (Recommended)',
      badge: '🏆 De-escalation Gold Standard',
      text: `Dear ${greetingName}, we are truly sorry to hear that your experience with ${cleanService} fell short of your expectations. This is certainly not the standard of service or transparency we strive to uphold at ${cleanBiz}. We take your feedback very seriously and would appreciate the chance to discuss this with you directly so we can make things right. Please reach out to our management team directly so we can resolve this for you immediately.${signOff}`,
      keywords: [cleanBiz, 'management', 'resolution'],
    },
    {
      id: 'neg-2',
      title: '🤝 Sincere Accountability & Offline Fix',
      badge: '🕊️ Defuses Public Tension',
      text: `Hello ${greetingName}, thank you for bringing this issue to our attention. We deeply apologize for any frustration or inconvenience caused during your recent visit. We are already reviewing our internal procedures with our staff to ensure this does not happen again. Your satisfaction is our utmost priority, and we would welcome the opportunity to regain your trust. Please contact us directly at your earliest convenience.${signOff}`,
      keywords: [cleanBiz, 'accountability', 'customer satisfaction'],
    },
    {
      id: 'neg-3',
      title: '⚡ Concise & Professional Apology',
      badge: '⏱️ Direct & Calm',
      text: `Dear ${greetingName}, we sincerely apologize for your disappointing experience with our ${cleanService}. We hold ${cleanBiz} to high standards, and we clearly missed the mark here. Please contact our leadership directly so we can personally address your concerns and find an appropriate resolution.${signOff}`,
      keywords: [cleanBiz, 'resolution'],
    },
  ];
}

function generatePrivateInterceptReplies({
  numRating,
  greetingName,
  cleanBiz,
  cleanService,
  customerText,
  customerContact,
  signOff,
}) {
  return [
    {
      id: 'pi-1',
      title: '💬 WhatsApp Direct Outreach (High Empathy)',
      badge: '⚡ Direct Customer Chat',
      text: `Hi ${greetingName}, this is the management team at ${cleanBiz}. We received your private feedback regarding your recent ${cleanService}. First and foremost, we sincerely apologize for the inconvenience you experienced. Your satisfaction is our top priority, and we want to personally make this right for you. Could we arrange a quick call or offer a complimentary follow-up to resolve this to your complete satisfaction?${signOff}`,
      keywords: [cleanBiz, cleanService, 'private resolution'],
    },
    {
      id: 'pi-2',
      title: '🎁 Immediate Resolution & Goodwill Offer',
      badge: '🤝 Customer Retention',
      text: `Hello ${greetingName}, thank you for sharing your candid feedback with us privately. We take your comments regarding "${customerText ? customerText.slice(0, 60) + '...' : cleanService}" very seriously. To make up for this, we would love to offer you an immediate solution or complimentary adjustment on your next visit. Please let us know what works best for you!${signOff}`,
      keywords: [cleanBiz, 'goodwill offer'],
    },
    {
      id: 'pi-3',
      title: '📞 Quick Call Request',
      badge: '🛡️ Personal Attention',
      text: `Hi ${greetingName}, we are truly sorry your recent visit for ${cleanService} at ${cleanBiz} didn't go smoothly. We are addressing this directly with our team today. When would be a convenient time for our manager to give you a quick 2-minute call to ensure you are taken care of?${signOff}`,
      keywords: [cleanBiz, 'direct call'],
    },
  ];
}

/**
 * Calculates SEO & Quality score of a generated reply
 */
export function calculateReplySeoScore(replyText = '', { businessName, serviceType, tone }) {
  if (!replyText) return { score: 0, items: [] };

  let score = 50;
  const items = [];

  // 1. Business Name Check
  if (businessName && replyText.toLowerCase().includes(businessName.toLowerCase())) {
    score += 15;
    items.push({ label: 'Business Name included', passed: true });
  } else {
    items.push({ label: 'Business Name mention', passed: false });
  }

  // 2. Service/Keyword Check
  if (serviceType && replyText.toLowerCase().includes(serviceType.toLowerCase())) {
    score += 15;
    items.push({ label: 'Specific Service keyword', passed: true });
  } else {
    items.push({ label: 'Service keyword inclusion', passed: false });
  }

  // 3. Length / Word Count Check (Ideal Google response length is 35 - 90 words)
  const wordCount = replyText.trim().split(/\s+/).length;
  if (wordCount >= 25 && wordCount <= 110) {
    score += 10;
    items.push({ label: `Optimal length (${wordCount} words)`, passed: true });
  } else {
    items.push({ label: `Word count (${wordCount} words)`, passed: false });
  }

  // 4. Call-to-action / Polite Closing Check
  const hasCta = /again|welcome back|next visit|see you|contact us|reach out|appreciate/i.test(replyText);
  if (hasCta) {
    score += 10;
    items.push({ label: 'Call-to-Action / Welcome Back', passed: true });
  } else {
    items.push({ label: 'Call-to-Action hook', passed: false });
  }

  return {
    score: Math.min(100, score),
    items,
  };
}
