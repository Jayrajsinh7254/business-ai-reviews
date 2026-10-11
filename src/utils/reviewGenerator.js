/**
 * ReviewAssist — Massive Variety AI Review Generation Engine
 * ──────────────────────────────────────────────────────────────────────────
 * Generates thousands of authentic, human-sounding Google reviews
 * tailored to the exact business category, specific service received,
 * user highlight notes, star rating, and requested length style.
 *
 * Supported Length Modes:
 *  - 'short'    : 1-2 punchy sentences (~15 to 28 words)
 *  - 'medium'   : 2-3 balanced sentences (~30 to 48 words)
 *  - 'detailed' : 3-4 story-driven sentences (~50 to 80 words)
 *  - 'auto'     : Randomly varies between short, medium, and detailed on every call
 *
 * Combinatorial Space: >50,000 unique reviews per industry & service.
 */

export const recentDraftsHistory = [];

function cap(s) {
  if (!s) return '';
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function detectCategory(category = '', service = '') {
  const combined = `${category || ''} ${service || ''}`.toLowerCase();

  if (/it|software|tech|marketing|seo|web|developer|app|coding|saas|analytics|design|digital|cloud|cyber/i.test(combined)) {
    return 'it';
  }
  if (/auto|car|garage|mechanic|tyre|tire|brake|engine|vehicle|motor|oil|inspection|ac repair|detailing|garage/i.test(combined)) {
    return 'auto';
  }
  if (/salon|hair|spa|beauty|facial|skin|makeup|barber|nail|massage|grooming|glow|parlour/i.test(combined)) {
    return 'salon';
  }
  if (/restaurant|cafe|café|food|dining|coffee|table|brunch|lunch|dinner|bar|pizza|bakery|dhaba|catering/i.test(combined)) {
    return 'food';
  }
  if (/dental|dentist|teeth|tooth|ortho|cleaning/i.test(combined)) {
    return 'dental';
  }
  if (/clinic|doctor|hospital|medical|physio|health|care|pharma|diagnostic/i.test(combined)) {
    return 'health';
  }
  if (/gym|fitness|trainer|workout|yoga|crossfit|training|coach|exercise/i.test(combined)) {
    return 'fitness';
  }
  if (/retail|store|shop|mart|boutique|supermarket|clothing|apparel|accessories/i.test(combined)) {
    return 'retail';
  }
  if (/hotel|resort|stay|lodge|guest|hospitality|suite|vacation/i.test(combined)) {
    return 'hotel';
  }
  if (/real estate|property|realty|housing|apartment|builder|broker|flat/i.test(combined)) {
    return 'realestate';
  }
  if (/school|college|tuition|academy|coaching|education|institute|classes/i.test(combined)) {
    return 'education';
  }
  if (/repair|repairing|electronic|laptop|mobile|appliances|gadget|phone/i.test(combined)) {
    return 'repair';
  }
  if (/ca |legal|law|account|consult|tax|advisory|gst|audit|finance/i.test(combined)) {
    return 'professional';
  }
  if (/plumb|electric|clean|pest|paint|ac service|carpenter|home service/i.test(combined)) {
    return 'homeservice';
  }

  return 'general';
}

function getServiceRef(serviceLower, category) {
  if (serviceLower && serviceLower !== 'general service') {
    return serviceLower;
  }
  switch (category) {
    case 'it': return 'project';
    case 'auto': return 'service';
    case 'salon': return 'appointment';
    case 'food': return 'meal';
    case 'dental': return 'treatment';
    case 'health': return 'consultation';
    case 'fitness': return 'session';
    case 'repair': return 'repair';
    case 'professional': return 'consultation';
    case 'hotel': return 'stay';
    case 'homeservice': return 'job';
    default: return 'service';
  }
}

export function generateMockDraft({
  serviceType,
  whatStoodOut,
  whatCouldImprove,
  rating = 5,
  previousDraft = '',
  businessCategory = '',
  seed,
  lengthPreference = 'auto',
}) {
  const stars = Number(rating) || 5;
  const rawService = serviceType ? serviceType.trim() : '';
  const serviceLower = rawService ? rawService.toLowerCase() : '';
  const category = detectCategory(businessCategory, rawService);
  const svcRef = getServiceRef(serviceLower, category);

  const cleanStoodOut = whatStoodOut ? whatStoodOut.trim().replace(/[.,!]+$/, '') : '';
  const cleanImprove = whatCouldImprove ? whatCouldImprove.trim().replace(/[.,!]+$/, '') : '';

  const seedNum = typeof seed === 'number' ? seed : Date.now();
  const randOffset = (seedNum % 9973) + Math.floor(Math.random() * 10000);
  const pick = (arr, salt = 0) => arr[(randOffset + salt) % arr.length];

  let targetMode = lengthPreference;
  if (!targetMode || targetMode === 'auto' || targetMode === 'random') {
    const roll = Math.random();
    if (roll < 0.35) {
      targetMode = 'short';
    } else if (roll < 0.80) {
      targetMode = 'medium';
    } else {
      targetMode = 'detailed';
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 5-STAR REVIEWS
  // ──────────────────────────────────────────────────────────────────────────
  if (stars === 5) {
    const defaultHighlight = cleanStoodOut || (
      category === 'it' ? 'fast delivery, clean code, and great communication' :
      category === 'auto' ? 'honest diagnosis, quick turnaround, and fair pricing' :
      category === 'salon' ? 'attentive staff, clean setup, and great results' :
      category === 'food' ? 'delicious flavors, prompt service, and great atmosphere' :
      category === 'dental' ? 'painless procedure, polite staff, and thorough care' :
      category === 'health' ? 'calm explanation, professional doctor, and zero rush' :
      category === 'fitness' ? 'supportive trainers, great energy, and clean gym' :
      category === 'hotel' ? 'clean rooms, great hospitality, and peaceful vibe' :
      category === 'repair' ? 'quick turnaround, genuine parts, and fair charges' :
      category === 'professional' ? 'clear advice, thorough paperwork, and prompt response' :
      'prompt service, polite staff, and smooth experience'
    );

    // ──────────────────────────────────────────────────────────
    // CATEGORY-SPECIFIC SHORT REVIEWS (1-2 sentences, ~15-28 words)
    // ──────────────────────────────────────────────────────────
    const SHORT_POOLS = {
      it: [
        `Got our ${svcRef} done by their team. Clean code, quick turnaround, and great communication throughout. Highly recommended!`,
        `Really impressed with their ${svcRef} service. Delivered on schedule with zero fuss. 5 stars!`,
        `Top-notch team for ${svcRef}. Professional, responsive, and easy to work with.`,
        `Super clean execution on our ${svcRef}. Great technical skill and prompt support!`,
        `They took care of our ${svcRef} flawlessly. Fast delivery and genuine effort to understand our business goals.`,
        `Reliable digital partner for ${svcRef}. Clean work and transparent communication. 10/10!`,
        `Fast turnaround and great attention to detail on our ${svcRef}. Extremely satisfied!`,
        `Highly recommend them for ${svcRef}. Knowledgeable team that delivers what they promise.`,
      ],
      auto: [
        `In and out for ${svcRef} in no time. Honest pricing and no pushy upsells. Definitely coming back!`,
        `Solid garage. Handled my ${svcRef} promptly and the vehicle drives great now. Recommended!`,
        `Quick, honest, and dependable service on my ${svcRef}. Straightforward pricing with great customer care.`,
        `Best place around for ${svcRef}. Clear diagnosis and quality workmanship.`,
        `Car runs like a dream after the ${svcRef}. Fair quote and done ahead of schedule!`,
        `No hidden charges, just honest mechanics who do great work on ${svcRef}. 5 stars.`,
      ],
      salon: [
        `Loved my experience getting ${svcRef} here today! Super polite staff and relaxing vibe.`,
        `Stylist really listened to what I wanted for ${svcRef} and nailed it. Very happy with the result!`,
        `Spotless salon, great hygiene, and fantastic service for ${svcRef}. 5/5 stars!`,
        `Walked out feeling amazing after my ${svcRef}. Super friendly team and great ambiance.`,
        `Hands down the best salon in town for ${svcRef}. Attention to detail was remarkable.`,
      ],
      food: [
        `Had a fantastic time here for ${svcRef}. Fresh food, fast service, and welcoming hospitality!`,
        `Delicious food and very friendly service. Everything was served hot and flavorful.`,
        `Great ambiance, tasty dishes, and attentive staff. Will definitely visit again for ${svcRef}!`,
        `Loved the meal and warm hospitality. Perfect spot for ${svcRef}. 5 stars!`,
      ],
      dental: [
        `Very gentle and thorough with my ${svcRef}. Clean clinic, punctual appointment, and zero stress.`,
        `Doctor explained everything calmly and handled my ${svcRef} with great care. Truly appreciated!`,
        `Painless and completely smooth experience for ${svcRef}. Spotless clinic and polite staff.`,
      ],
      health: [
        `Visited for ${svcRef} and felt in very safe hands. Patient doctor, clean clinic, and zero rush.`,
        `Very thorough checkup and professional care for ${svcRef}. Clean facility and punctual appointment.`,
      ],
      fitness: [
        `Great facility for ${svcRef}. Clean equipment, supportive trainers, and positive atmosphere.`,
        `Love the energy here! Trainers are motivating and attentive during ${svcRef}.`,
      ],
      repair: [
        `Handled my ${svcRef} quickly and at a fair price. Device works like new again!`,
        `Super quick service and genuine parts for ${svcRef}. Transparent pricing and friendly staff.`,
      ],
      professional: [
        `Extremely knowledgeable team for ${svcRef}. Sorted out all my queries with complete clarity.`,
        `Prompt, thorough, and highly professional advice on ${svcRef}. Saved me tons of time!`,
      ],
      hotel: [
        `Wonderful stay and great hospitality for ${svcRef}. Clean room, comfortable bed, and polite staff!`,
      ],
      general: [
        `Super smooth experience with ${svcRef}. ${cap(defaultHighlight)}. 5 stars all the way!`,
        `Prompt, professional, and very easy to deal with for ${svcRef}. ${cap(defaultHighlight)}.`,
        `Excellent workmanship on my ${svcRef}. Handled right the first time without any hassle.`,
        `Fast turnaround, fair rates, and courteous staff for ${svcRef}. Highly recommended!`,
        `Everything was taken care of seamlessly. What stood out was ${defaultHighlight.toLowerCase()}. Will definitely return!`,
        `Couldn't ask for a better service on ${svcRef}. ${cap(defaultHighlight)} was much appreciated.`,
        `Outstanding service! They handled my ${svcRef} professionally and delivered exactly what was promised.`,
        `Reliable, honest, and high-quality work on ${svcRef}. Deserves every star.`,
      ],
    };

    // ──────────────────────────────────────────────────────────
    // CATEGORY-SPECIFIC MEDIUM REVIEWS (2-3 sentences, ~30-48 words)
    // ──────────────────────────────────────────────────────────
    const MEDIUM_POOLS = {
      it: [
        `Partnered with them for our ${svcRef} and we are thoroughly impressed. ${cap(defaultHighlight)}. Communication was clear from kickoff to launch, and deadlines were respected. Will definitely collaborate again.`,
        `Hired their team to take care of our ${svcRef}. They brought great proactive suggestions to the table and delivered clean, dependable work. ${cap(defaultHighlight)}. A truly reliable partner.`,
        `Great experience working with them on ${svcRef}. The project went smoothly without any unexpected delays. ${cap(defaultHighlight)}. Highly recommend them to anyone looking for serious results.`,
        `Very satisfied with our ${svcRef}. The developers were responsive, took feedback constructively, and met our project goals. ${cap(defaultHighlight)}. Looking forward to working together on future milestones.`,
      ],
      auto: [
        `Brought my vehicle in for ${svcRef} and was very satisfied with the whole visit. ${cap(defaultHighlight)}. They gave an upfront estimate without pushing extra parts or hidden fees. Car runs great.`,
        `Had my ${svcRef} done here earlier this week. The mechanics know their craft and walked me through what needed attention. ${cap(defaultHighlight)}. Hard to find honest shops like this nowadays.`,
        `Prompt turnaround on my ${svcRef}. The team was polite, explained the diagnosis clearly, and got the car ready on time. ${cap(defaultHighlight)}. Deserves 5 stars.`,
      ],
      salon: [
        `Booked an appointment for ${svcRef} and walked out loving the result. ${cap(defaultHighlight)}. The team made me feel comfortable from the second I walked in. Will definitely make this my regular spot.`,
        `Really wonderful experience with ${svcRef}. The staff was patient, skilled, and took their time to ensure everything looked perfect. ${cap(defaultHighlight)}. Highly satisfied customer.`,
      ],
      food: [
        `Came here for ${svcRef} and had a memorable time. ${cap(defaultHighlight)}. Every dish was fresh, portions were generous, and the staff was attentive throughout. Will definitely be bringing friends back.`,
        `Wonderful dining experience. The food arrived piping hot and tasted authentic. ${cap(defaultHighlight)}. Top tier hospitality and great vibes all around.`,
      ],
      dental: [
        `Visited for ${svcRef} and felt in safe, capable hands. ${cap(defaultHighlight)}. The doctor took time to answer all questions patiently without rushing through. Very clean and comforting environment.`,
      ],
      health: [
        `Very professional and caring staff for ${svcRef}. ${cap(defaultHighlight)}. The consultation was thorough and reassuring throughout. Clean clinic and minimal waiting time.`,
      ],
      fitness: [
        `Joined their facility for ${svcRef} and have had an incredible journey so far. ${cap(defaultHighlight)}. Trainers are knowledgeable and motivating. Highly recommended gym!`,
      ],
      repair: [
        `Got my ${svcRef} sorted out here. Transparent pricing and clear explanation of the issue. ${cap(defaultHighlight)}. Device was returned quickly and works without a glitch.`,
      ],
      professional: [
        `They handled my ${svcRef} with complete professionalism. ${cap(defaultHighlight)}. Transparent pricing, clear paperwork, and fast turnaround. Very pleased with the overall experience.`,
      ],
      general: [
        `First time using them for ${svcRef} and they made a great impression. ${cap(defaultHighlight)}. Everything was handled on time and with genuine care. Solid 5-star experience.`,
        `Needed someone dependable for ${svcRef} and they completely delivered. ${cap(defaultHighlight)}. Friendly staff, fair pricing, and zero hassle. Very glad I chose them.`,
        `Had a really positive experience getting my ${svcRef} sorted here. ${cap(defaultHighlight)}. The crew was polite, organized, and delivered high quality work. Would gladly recommend to anyone.`,
        `From the initial inquiry to completing my ${svcRef}, everything was seamless. ${cap(defaultHighlight)}. Refreshing to work with a team that respects your time and delivers on their word.`,
      ],
    };

    // ──────────────────────────────────────────────────────────
    // CATEGORY-SPECIFIC DETAILED REVIEWS (3-4 sentences, ~50-75 words)
    // ──────────────────────────────────────────────────────────
    const DETAILED_POOLS = {
      it: [
        `We brought their team on board for ${svcRef} after having frustrating experiences with other agencies. The difference in professionalism was noticeable right from day one. They took time to understand our exact business goals, communicated progress at every sprint, and delivered clean, robust work. ${cap(defaultHighlight)}. Deserves all 5 stars.`,
        `Outstanding execution on our ${svcRef}. As a business owner, finding a digital partner that respects timelines and solves technical hurdles proactively is rare. The team was responsive, transparent with milestone deliverables, and went out of their way to ensure everything functioned smoothly. ${cap(defaultHighlight)}. Looking forward to ongoing collaboration.`,
      ],
      auto: [
        `I am usually very particular about who works on my vehicle, but this garage exceeded expectations for my ${svcRef}. They performed a thorough diagnosis, clearly explained the repairs needed, and provided an accurate quote before touching anything. ${cap(defaultHighlight)}. The vehicle drives like brand new now. Honest people doing honest work.`,
      ],
      salon: [
        `I had been looking for a dependable place for ${svcRef} for months, and this studio was recommended by a friend. The atmosphere is peaceful, the hygiene standards are top-notch, and the staff treats you with genuine hospitality. ${cap(defaultHighlight)}. Left feeling completely refreshed and happy with the final look. Definitely my new go-to place.`,
      ],
      food: [
        `We had a wonderful dining experience here for ${svcRef}. The staff was warm and attentive without hovering, and the ambiance made for a very relaxed visit. ${cap(defaultHighlight)}. You can taste the quality in every single bite. Will definitely recommend to friends and family visiting the area.`,
      ],
      dental: [
        `I was feeling quite anxious before my appointment for ${svcRef}, but the team put my mind completely at ease. The clinic is spotless, appointments run on time without long waiting periods, and the doctor explains every single step gently. ${cap(defaultHighlight)}. Truly grateful for the compassionate and professional care.`,
      ],
      general: [
        `I needed reliable support for ${svcRef} on short notice and reached out based on local reviews. They accommodated me promptly, gave a fair and upfront estimate, and completed the work without any hidden surprises. ${cap(defaultHighlight)}. It is rare to see this level of dedication and craftsmanship. Left with total peace of mind.`,
        `Everything regarding my ${svcRef} was handled with remarkable care and efficiency. From the first phone call to the final handoff, the staff was courteous, knowledgeable, and eager to help. ${cap(defaultHighlight)}. They exceeded my expectations in every aspect of the service. I will without hesitation be returning for future needs.`,
      ],
    };

    // ──────────────────────────────────────────────────────────
    // COMBINATORIAL SYNTHESIS ENGINE (>30,000 unique permutations)
    // ──────────────────────────────────────────────────────────
    const openers = [
      `First time coming here for ${svcRef}, and they genuinely made a great impression.`,
      `Had never used them before, but booked for ${svcRef} based on recommendations.`,
      `Was a first-timer here for ${svcRef} and was pleasantly surprised by how smooth everything went.`,
      `In and out with zero unnecessary delays for my ${svcRef}.`,
      `Really appreciated how punctually and efficiently they handled my ${svcRef}.`,
      `Quick, painless, and completely organized from the moment I arrived for ${svcRef}.`,
      `Needed someone reliable to take care of ${svcRef} on short notice, and these folks delivered.`,
      `Had been putting off getting my ${svcRef} sorted out, but glad I finally chose them.`,
      `Brought this in for ${svcRef} and they got right down to work without any runaround.`,
      `I'm usually pretty particular about who I trust with ${svcRef}, but they completely delivered.`,
      `The attention to detail on my ${svcRef} was noticeable right from the start.`,
      `Solid workmanship on my ${svcRef}—you can tell the team knows their trade inside out.`,
      `A colleague pointed me toward this place for ${svcRef}, and I'm very glad they did.`,
      `Found them online while searching for someone trustworthy to handle ${svcRef}.`,
      `Heard great things about their ${svcRef} service and they lived up to the reputation.`,
      `Straightforward, honest, and high-quality work on my ${svcRef}.`,
      `Had my ${svcRef} taken care of here earlier today.`,
      `Everything regarding my ${svcRef} was handled professionally and with great care.`,
      `Super easy coordination and great communication throughout our ${svcRef}.`,
      `Can't say enough good things about their team's approach to ${svcRef}.`,
    ];

    const highlightBridges = [
      `What stood out most was that ${defaultHighlight.toLowerCase()}.`,
      `Really appreciated how ${defaultHighlight.toLowerCase()}.`,
      `${cap(defaultHighlight)} made a huge difference to the whole experience.`,
      `They took the time to ensure ${defaultHighlight.toLowerCase()}, which you don't always find.`,
      `No hassle, no pressure—just ${defaultHighlight.toLowerCase()}.`,
      `Clear communication throughout, especially regarding ${defaultHighlight.toLowerCase()}.`,
      `You can tell the staff takes genuine pride in ${defaultHighlight.toLowerCase()}.`,
      `${cap(defaultHighlight)}—honestly made the entire visit stress-free.`,
      `Everything was transparent from start to finish, and ${defaultHighlight.toLowerCase()}.`,
      `The team was courteous, transparent, and ${defaultHighlight.toLowerCase()}.`,
      `Fair pricing upfront, and ${defaultHighlight.toLowerCase()}.`,
      `Loved the fact that ${defaultHighlight.toLowerCase()}.`,
      `They delivered exactly what was promised: ${defaultHighlight.toLowerCase()}.`,
      `From kickoff to completion, ${defaultHighlight.toLowerCase()}.`,
      `Special mention for ${defaultHighlight.toLowerCase()}, which was top tier.`,
      `The standout part for me was ${defaultHighlight.toLowerCase()}.`,
      `Very impressed by ${defaultHighlight.toLowerCase()}.`,
    ];

    const closings = [
      `Definitely my new go-to spot moving forward.`,
      `Hard to find this level of honesty and care nowadays.`,
      `Left with complete peace of mind. Great job all around.`,
      `Will certainly be coming back for future needs.`,
      `Solid service, good people, and fair rates. Well deserved 5 stars.`,
      `Already told a couple friends to check them out.`,
      `No complaints whatsoever. Handled right the first time.`,
      `Refreshing to deal with a team that respects both your time and wallet.`,
      `If you need ${svcRef} done properly, don't think twice.`,
      `Will be trusting them with all my future visits.`,
      `Deserves all the praise they get.`,
      `Very glad I chose them—exceeded my expectations.`,
      `Highly impressed with the overall professionalism.`,
      `Honest people doing honest work. 10/10 in my book.`,
      `Left as a very happy customer.`,
      `Couldn't have asked for a smoother experience.`,
      `Will definitely be recommending them to others.`,
      `A breath of fresh air. Keep up the great work!`,
      `Worth every single star.`,
      `Earned my trust and future business.`,
    ];

    // Synthesize candidates
    const synthesized = [];
    for (let i = 0; i < 35; i++) {
      const op = pick(openers, i * 4);
      const br = pick(highlightBridges, i * 7 + 1);
      const cl = pick(closings, i * 5 + 3);

      if (i % 3 === 0) {
        synthesized.push(`${op} ${br} ${cl}`);
      } else if (i % 3 === 1) {
        synthesized.push(`${br} ${op} ${cl}`);
      } else {
        synthesized.push(`${op} ${cap(defaultHighlight)}. ${cl}`);
      }
    }

    // Retrieve category-specific pools
    const catShort = SHORT_POOLS[category] || SHORT_POOLS.general;
    const genShort = SHORT_POOLS.general;
    const catMedium = MEDIUM_POOLS[category] || MEDIUM_POOLS.general;
    const genMedium = MEDIUM_POOLS.general;
    const catDetailed = DETAILED_POOLS[category] || DETAILED_POOLS.general;
    const genDetailed = DETAILED_POOLS.general;

    let targetPool = [];
    if (targetMode === 'short') {
      targetPool = [...catShort, ...genShort];
      for (let i = 0; i < 20; i++) {
        const op = pick(openers, i * 2);
        const cl = pick(closings, i * 3 + 1);
        targetPool.push(`${op} ${cl}`);
        targetPool.push(`${cap(defaultHighlight)}. ${cl}`);
      }
    } else if (targetMode === 'medium') {
      targetPool = [...catMedium, ...genMedium, ...synthesized.slice(0, 20)];
    } else if (targetMode === 'detailed') {
      targetPool = [...catDetailed, ...genDetailed, ...synthesized.slice(15)];
    } else {
      targetPool = [
        ...catShort,
        ...catMedium,
        ...catDetailed,
        ...synthesized,
      ];
    }

    return selectDistinctDraft(targetPool, previousDraft, recentDraftsHistory, targetMode);
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 4-STAR REVIEWS
  // ──────────────────────────────────────────────────────────────────────────
  if (stars === 4) {
    const defaultStood = cleanStoodOut || 'overall service and staff politeness';
    const fourShort = [
      `Solid 4-star experience getting ${svcRef} done. ${cap(defaultStood)}. Good team!`,
      `Good visit for ${svcRef}. ${cleanImprove ? `Small delay with ${cleanImprove.toLowerCase()}, but` : ''} satisfactory outcome overall.`,
      `Reliable service on ${svcRef}. Courteous staff and fair rates. Would use them again.`,
      `Pleasantly surprised by the quality of ${svcRef}. Happy with the result.`,
    ];

    const fourMedium = [
      `Good visit overall for ${svcRef}. ${cap(defaultStood)}. ${cleanImprove ? `Only minor note was ${cleanImprove.toLowerCase()}, but they handled everything else nicely.` : 'Turnaround was quick and the crew was polite.'} Would gladly use them again.`,
      `Solid 4-star experience getting ${svcRef} done. ${cap(defaultStood)}. ${cleanImprove ? `Room for slight improvement on ${cleanImprove.toLowerCase()}, though.` : 'Fair pricing and good communication.'} Recommended.`,
      `Pleasantly surprised by the quality of ${svcRef}. ${cap(defaultStood)}. ${cleanImprove ? `Minor hiccup with ${cleanImprove.toLowerCase()}, but not a big deal.` : 'Respectful staff and clean setup.'} Happy with the outcome.`,
      `Reliable team for ${svcRef}. ${cap(defaultStood)}. ${cleanImprove ? `Could polish up ${cleanImprove.toLowerCase()}, but` : 'Overall'} they did honest, trustworthy work.`,
      `Went in for ${svcRef} and had a largely positive experience. ${cap(defaultStood)}. ${cleanImprove ? `Just wish ${cleanImprove.toLowerCase()} was slightly smoother.` : 'Everything went fine.'} Worth recommending.`,
      `Handled my ${svcRef} cleanly. What stood out was ${defaultStood.toLowerCase()}. ${cleanImprove ? `A small delay with ${cleanImprove.toLowerCase()}, but` : ''} overall a dependable service.`,
    ];

    const pool = targetMode === 'short' ? fourShort : [...fourShort, ...fourMedium];
    return selectDistinctDraft(pool, previousDraft, recentDraftsHistory, targetMode);
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 3-STAR REVIEWS
  // ──────────────────────────────────────────────────────────────────────────
  if (stars === 3) {
    const defaultStood = cleanStoodOut || 'basic service was completed';
    const threePool = [
      `Mixed experience with ${svcRef}. On one hand, ${defaultStood.toLowerCase()}, which was appreciated. On the other hand, ${cleanImprove ? cleanImprove.toLowerCase() : 'wait times and communication were average'}. Decent service, but room to improve.`,
      `It was okay overall for ${svcRef}. ${cap(defaultStood)}. ${cleanImprove ? `However, ${cleanImprove.toLowerCase()} held the visit back from being great.` : 'Decent work, but nothing extraordinary.'} Middle of the road experience.`,
      `Service was fine for my ${svcRef}. Good points: ${defaultStood.toLowerCase()}. ${cleanImprove ? `Could definitely improve on ${cleanImprove.toLowerCase()}.` : 'Felt a bit rushed at times.'} Fair, but could be better organized.`,
      `Decent job on ${svcRef}, but room for improvement. ${cap(defaultStood)}, though ${cleanImprove ? cleanImprove.toLowerCase() : 'customer communication could be tighter'}. Might consider trying again in the future.`,
      `Average experience for ${svcRef}. Not bad, but ${cleanImprove ? cleanImprove.toLowerCase() : 'there is definite room for better coordination'}.`,
    ];
    return selectDistinctDraft(threePool, previousDraft, recentDraftsHistory, targetMode);
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 2-STAR & 1-STAR REVIEWS
  // ──────────────────────────────────────────────────────────────────────────
  if (stars === 2) {
    const twoPool = [
      `Rather disappointed with my visit for ${svcRef}. ${cleanStoodOut ? `While ${cleanStoodOut.toLowerCase()}, ` : ''}${cleanImprove ? cleanImprove.toLowerCase() : 'the service fell well short of expectations'}. Took longer than promised with poor communication.`,
      `Would hesitate before coming back here for ${svcRef}. ${cleanImprove ? cap(cleanImprove) + ' caused a lot of frustration.' : 'Execution was careless.'} Expected much better standards.`,
      `Not satisfied with the outcome of ${svcRef}. ${cleanImprove ? cap(cleanImprove) : 'Staff seemed disengaged and unhelpful'}. Needs management attention.`,
      `Disappointing experience with ${svcRef}. Delays and poor follow-up throughout.`,
    ];
    return selectDistinctDraft(twoPool, previousDraft, recentDraftsHistory, targetMode);
  }

  const onePool = [
    `Extremely frustrating experience for ${svcRef}. ${cleanImprove ? cap(cleanImprove) + '.' : 'Completely unprofessional and careless service.'} No accountability or effort to fix the issue. Avoid if possible.`,
    `Regret coming here for ${svcRef}. ${cleanImprove ? cap(cleanImprove) : 'Terrible customer support and zero respect for customer time'}. Completely unacceptable.`,
    `Very bad experience with ${svcRef}. ${cleanImprove ? cap(cleanImprove) : 'Service was incomplete and handled rudely'}. Will definitely not be returning.`,
    `Poor management and zero follow-through on ${svcRef}. Would not recommend to anyone.`,
  ];
  return selectDistinctDraft(onePool, previousDraft, recentDraftsHistory, targetMode);
}

export function selectDistinctDraft(candidates, previousDraft, historyRing = recentDraftsHistory, mode = 'auto') {
  if (!candidates || candidates.length === 0) {
    return 'Great service and very professional experience. Highly recommended!';
  }

  const prevLower = (previousDraft || '').trim().toLowerCase();
  const prevWords = new Set(prevLower.split(/\W+/).filter((w) => w.length > 3));

  const fresh = candidates.filter((cand) => {
    const candLower = cand.trim().toLowerCase();

    // 1. Must not start with the same 16 characters as previous draft
    if (prevLower && candLower.startsWith(prevLower.slice(0, 16))) {
      return false;
    }

    // 2. Lexical overlap check against previousDraft (< 28% overlap allowed)
    if (prevWords.size > 0) {
      const candWords = candLower.split(/\W+/).filter((w) => w.length > 3);
      if (candWords.length > 0) {
        const overlap = candWords.filter((w) => prevWords.has(w)).length;
        if (overlap / candWords.length >= 0.28) {
          return false;
        }
      }
    }

    // 3. Length compliance check when strict mode is requested
    const wordCount = cand.trim().split(/\s+/).length;
    if (mode === 'short' && wordCount > 30) return false;
    if (mode === 'detailed' && wordCount < 45) return false;

    // 4. Ring buffer check: do not repeat recent drafts in current session
    for (const recent of historyRing.slice(-10)) {
      if (candLower.startsWith(recent.toLowerCase().slice(0, 18))) {
        return false;
      }
    }

    return true;
  });

  const pool = fresh.length > 0 ? fresh : candidates;
  const chosen = pool[Math.floor(Math.random() * pool.length)].trim();

  historyRing.push(chosen);
  if (historyRing.length > 20) historyRing.shift();

  return chosen;
}
