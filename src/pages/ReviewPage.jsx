import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { api, resolveGoogleReviewUrl } from '../api/client';
import { sanitizeGoogleReviewUrl } from '../lib/security';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { getBusinessStaffList } from '../utils/staffLeaderboardEngine';
import './ReviewPage.css';

/**
 * Normalizes phone number into international WhatsApp format (default 91 for India)
 */
export function normalizeWhatsAppNumber(rawPhone) {
  if (!rawPhone) return '';
  let cleaned = String(rawPhone).replace(/[^0-9]/g, '');
  if (cleaned.startsWith('0') && cleaned.length === 11) {
    cleaned = cleaned.substring(1);
  }
  if (cleaned.length === 10) {
    return '91' + cleaned;
  }
  return cleaned;
}

function safeExternalUrl(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  try {
    const url = new URL(raw);
    return url.protocol === 'https:' ? url.href : '';
  } catch {
    return '';
  }
}

/**
 * Generates natural Google Maps intent on Android, or direct URL on iOS / Desktop
 */
function getPlatformReviewUrl(url, platform) {
  if (!url) return 'https://g.page/r/example/review';
  if (platform === 'android') {
    try {
      const parsed = new URL(url);
      const encoded = encodeURIComponent(url);
      return `intent://${parsed.host}${parsed.pathname}${parsed.search}#Intent;scheme=${parsed.protocol.replace(':', '')};package=com.google.android.apps.maps;S.browser_fallback_url=${encoded};end`;
    } catch {
      return url;
    }
  }
  return url;
}

/**
 * In-app browser detection patterns (Instagram, WhatsApp, TikTok, FB, etc.)
 */
const IN_APP_BROWSER_REGEXES = [
  /FBAN|FBAV/i,
  /Instagram/i,
  /Line\//i,
  /MicroMessenger/i,
  /TikTok|musical_ly/i,
  /Snapchat/i,
  /Twitter/i,
];

function checkIsInAppBrowser(ua = '') {
  return IN_APP_BROWSER_REGEXES.some((rx) => rx.test(ua));
}

function checkPlatform(ua = '') {
  if (/android/i.test(ua)) return 'android';
  const isIos = /iPhone|iPad|iPod/i.test(ua) || (typeof navigator !== 'undefined' && /Macintosh/i.test(ua) && navigator.maxTouchPoints > 1);
  return isIos ? 'ios' : 'desktop';
}

/**
 * Default fallback products for Lakshmi Interior / home decor
 */
const DEFAULT_LAKSHMI_PRODUCTS = [
  'PVC Panels',
  'Louvers',
  'Marble Sheets',
  '3D wall tiles',
  'mosaic tiles',
  'led mirror',
  'wallpaper',
  'upvc windows & doors',
  'charcoal panel',
  'fluted panel',
  'pu stone',
  'laminates',
  'mica',
  'ply',
];

const REVIEW_LANGUAGES = [
  { code: 'en', label: 'English', nativeLabel: 'English' },
  { code: 'hi', label: 'Hindi', nativeLabel: 'हिन्दी' },
  { code: 'gu', label: 'Gujarati', nativeLabel: 'ગુજરાતી' },
  { code: 'mr', label: 'Marathi', nativeLabel: 'मराठी' },
  { code: 'es', label: 'Spanish', nativeLabel: 'Español' },
  { code: 'fr', label: 'French', nativeLabel: 'Français' },
  { code: 'ar', label: 'Arabic', nativeLabel: 'العربية' },
  { code: 'pt', label: 'Portuguese', nativeLabel: 'Português' },
  { code: 'de', label: 'German', nativeLabel: 'Deutsch' },
  { code: 'bn', label: 'Bengali', nativeLabel: 'বাংলা' },
];

/**
 * Returns category-specific praise options that match the business type
 */
export function getCategoryPraiseOptions(category = '') {
  const c = String(category || '').toLowerCase().trim();

  if (/interior|decor|furniture|real estate|property|architect|home/i.test(c)) {
    return [
      'All',
      'Top Quality',
      'Creative Design',
      'Fair Pricing',
      'Friendly Staff',
      'On-Time Delivery',
      'Flawless Finishing',
      'Great Variety',
    ];
  }
  if (/restaurant|cafe|café|food|dining|bakery|bar|kitchen|pizza|sweet|dhaba/i.test(c)) {
    return [
      'All',
      'Delicious Food',
      'Fast Service',
      'Friendly Staff',
      'Great Ambience',
      'Clean & Fresh',
      'Great Value',
      'Highly Recommended',
    ];
  }
  if (/salon|hair|beauty|spa|skin|barber|nail|grooming/i.test(c)) {
    return [
      'All',
      'Skilled Styling',
      'Relaxing Vibe',
      'Courteous Staff',
      'Clean & Hygienic',
      'Premium Care',
      'Punctual Service',
      'Worth Every Penny',
    ];
  }
  if (/auto|car|garage|mechanic|tyre|motor|bike|repair|vehicle/i.test(c)) {
    return [
      'All',
      'Honest Diagnosis',
      'Quick Turnaround',
      'Polite Team',
      'Fair & Clear Pricing',
      'Smooth Drive',
      'Genuine Work',
      'Highly Reliable',
    ];
  }
  if (/dental|clinic|doctor|hospital|medical|physio|health|care/i.test(c)) {
    return [
      'All',
      'Caring Doctor',
      'Minimal Wait',
      'Supportive Staff',
      'Spotless Clinic',
      'Clear Treatment Advice',
      'Gentle & Painless',
      'Experienced Team',
    ];
  }
  if (/gym|fitness|yoga|trainer|sports/i.test(c)) {
    return [
      'All',
      'Top Equipment',
      'Inspiring Trainers',
      'Clean & Fresh',
      'Motivating Vibe',
      'Flexible Hours',
      'Personal Attention',
    ];
  }
  if (/it|software|tech|marketing|web|app|digital/i.test(c)) {
    return [
      'All',
      'High Technical Skill',
      'Fast Delivery',
      'Clear Communication',
      'Measurable Results',
      'Proactive Ideas',
      'Reliable Partner',
    ];
  }
  return [
    'All',
    'Top Quality',
    'Fast & Prompt',
    'Friendly Staff',
    'Fair Pricing',
    'Super Clean',
    'Highly Professional',
    'Exceeded Expectations',
  ];
}

/**
 * Returns a contextual emoji/icon for each praise highlight
 */
export function getAspectIcon(aspect = '') {
  const a = String(aspect || '').toLowerCase();
  if (a.includes('all')) return '🌟';
  if (a.includes('quality')) return '🏆';
  if (a.includes('design') || a.includes('creative')) return '🎨';
  if (a.includes('pricing') || a.includes('fair') || a.includes('value')) return '🏷️';
  if (a.includes('staff') || a.includes('friendly') || a.includes('polite') || a.includes('courteous') || a.includes('supportive')) return '🤝';
  if (a.includes('time') || a.includes('delivery') || a.includes('punctual') || a.includes('quick') || a.includes('turnaround')) return '⏱️';
  if (a.includes('finish') || a.includes('flawless')) return '✨';
  if (a.includes('variety') || a.includes('collection')) return '📦';
  if (a.includes('food') || a.includes('delicious') || a.includes('taste')) return '🍽️';
  if (a.includes('service') || a.includes('prompt') || a.includes('fast')) return '⚡';
  if (a.includes('ambience') || a.includes('vibe') || a.includes('clean') || a.includes('spotless') || a.includes('fresh')) return '🌿';
  if (a.includes('styling') || a.includes('hair') || a.includes('beauty') || a.includes('care')) return '✂️';
  if (a.includes('honest') || a.includes('genuine') || a.includes('reliable') || a.includes('diagnosis')) return '🛡️';
  if (a.includes('doctor') || a.includes('clinic') || a.includes('treatment') || a.includes('painless')) return '🩺';
  if (a.includes('trainer') || a.includes('equip') || a.includes('motivat')) return '💪';
  if (a.includes('recommend') || a.includes('expect')) return '⭐';
  return '💎';
}


/**
 * Local AI Review Generator Engine
 * Blends selected products, single selected aspect, rating, language (English / Hindi / Gujarati), and length
 */
function generateLocalReviewText({
  businessName = 'Lakshmi Interior',
  category = 'local business',
  products = [],
  aspect = 'All',
  rating = 5,
  language = 'en',
  length = 'short',
  seed = 0,
  staffName = '',
}) {
  const categoryText = String(category || 'local business').trim();
  const prodList = products.length > 0 ? products : [];
  const prodTextEn = prodList.length === 0
    ? 'materials'
    : prodList.length === 1
    ? prodList[0]
    : prodList.length === 2
    ? `${prodList[0]} and ${prodList[1]}`
    : `${prodList.slice(0, -1).join(', ')} and ${prodList[prodList.length - 1]}`;

  const prodTextHi = prodList.length === 0
    ? 'सामान'
    : prodList.length === 1
    ? prodList[0]
    : prodList.length === 2
    ? `${prodList[0]} और ${prodList[1]}`
    : `${prodList.slice(0, -1).join(', ')} और ${prodList[prodList.length - 1]}`;

  const prodTextGu = prodList.length === 0
    ? 'પ્રોડક્ટ્સ'
    : prodList.length === 1
    ? prodList[0]
    : prodList.length === 2
    ? `${prodList[0]} અને ${prodList[1]}`
    : `${prodList.slice(0, -1).join(', ')} અને ${prodList[prodList.length - 1]}`;

  const staffMention = staffName ? staffName : 'staff';
  const staffMentionHi = staffName ? staffName : 'स्टाफ';
  const staffMentionGu = staffName ? staffName : 'સ્ટાફ';
  const variant = Math.abs(seed) % 4;

  const aspectLower = String(aspect || 'All').toLowerCase();
  const isQuality = /quality|solid|material|durab|genuine/i.test(aspectLower);
  const isDesign = /design|creative|modern|ambience|vibe|style|styling/i.test(aspectLower);
  const isPricing = /pric|rate|value|cost|penny|worth|fair/i.test(aspectLower);
  const isStaff = /staff|team|doctor|trainer|courteous|polite|helpful|supportive|caring/i.test(aspectLower);
  const isDelivery = /delivery|fast|prompt|quick|turnaround|punctual|wait/i.test(aspectLower);
  const isFinishing = /finish|clean|neat|spotless|hygienic/i.test(aspectLower);
  const isVariety = /variety|selection|equipment/i.test(aspectLower);
  const isFood = /food|delicious|drink|menu/i.test(aspectLower);

  // ----------------------------------------------------
  // HINDI GENERATION
  // ----------------------------------------------------
  if (language === 'hi') {
    if (rating >= 4) {
      if (isQuality) {
        if (length === 'short') {
          const v = [
            `${businessName} से ${prodTextHi} खरीदे। क्वालिटी बहुत ही शानदार और मजबूत है। फिनिशिंग देखकर बहुत खुशी हुई। 5 स्टार!`,
            `घर के रेनोवेशन के लिए ${prodTextHi} लिए थे। मटेरियल की मजबूती और क्वालिटी सच में लाजवाब है। बहुत संतुष्ट!`,
            `${prodTextHi} की बनावट और ड्यूरेबिलिटी बेहतरीन है। क्वालिटी में कोई समझौता नहीं। बहुत बढ़िया काम!`,
          ];
          return v[variant % v.length];
        } else if (length === 'medium') {
          return `${businessName} से ${prodTextHi} लिए थे। मटेरियल की मजबूती और फिनिशिंग ने काफी प्रभावित किया। यह काफी लंबे समय तक चलने वाला मजबूत मटेरियल है और लगने के बाद लुक बहुत ही शानदार आ रहा है। पूरी तरह संतुष्ट!`;
        } else {
          return `${businessName} के साथ हमारा अनुभव बहुत ही सुखद रहा। हमने यहाँ से ${prodTextHi} पसंद किए थे। क्वालिटी बहुत उच्च स्तर की है और मटेरियल काफी टिकाऊ है। लगने के बाद घर का रूप पूरी तरह बदल गया है। प्रीमियम क्वालिटी के लिए अत्यधिक अनुशंसित!`;
        }

      }

      if (isDesign) {
        if (length === 'short') {
          const v = [
            `${prodTextHi} के डिज़ाइन्स और नए पैटर्न बहुत ही आधुनिक और आकर्षक हैं। घर का लुक बहुत सुंदर लग रहा है!`,
            `डिज़ाइन और टेक्सचर का बहुत बेहतरीन कलेक्शन है। ${prodTextHi} लगने के बाद सब तारीफ कर रहे हैं। बहुत खुश हैं!`,
            `यूनिक और ट्रेंडी डिज़ाइन्स मिले ${businessName} में। हमारा इंटीरियर बहुत खूबसूरत लग रहा है!`,
          ];
          return v[variant % v.length];
        } else if (length === 'medium') {
          return `यहाँ ${prodTextHi} के डिज़ाइन्स और नए पैटर्न्स का बहुत सुंदर कलेक्शन है। ऐसे आधुनिक डिज़ाइन आसानी से हर जगह नहीं मिलते। हमारा इंटीरियर बहुत स्टाइलिश लग रहा है!`;
        } else {
          return `${businessName} में डिज़ाइन वैरायटी देखकर मन खुश हो गया। ${prodTextHi} का फिनिश और लुक बहुत खूबसूरत है। जैसा हमने सोचा था वैसा ही शानदार रूप मिला। हर कोई डिज़ाइन की सराहना कर रहा है!`;
        }
      }

      if (isPricing) {
        if (length === 'short') {
          const v = [
            `${businessName} में ${prodTextHi} के दाम बहुत ही वाजिब और सही हैं। पूरी तरह पैसा वसूल सौदा रहा!`,
            `${prodTextHi} के लिए जो कीमत दी वह पूरी तरह उचित थी। ईमानदार कीमतें और बेहतरीन क्वालिटी। बहुत खुश!`,
            `मार्केट से तुलना करने पर यहाँ ${prodTextHi} के रेट्स सबसे सही और रीजनेबल मिले। बेस्ट डील!`,
          ];
          return v[variant % v.length];
        } else if (length === 'medium') {
          return `${prodTextHi} खरीदे यहाँ से। मार्केट की तुलना में कीमतें बहुत सही हैं और क्वालिटी भी टॉप क्लास है। पूरी तरह पारदर्शी और ईमानदार सेवा!`;
        } else {
          return `कीमत और क्वालिटी दोनों के मामले में ${businessName} सबसे सही जगह है। ${prodTextHi} के लिए जो दाम दिए वो पूरी तरह उचित थे। कोई हिडन चार्ज नहीं, बिल्कुल साफ और ईमानदार व्यवहार। अत्यधिक संतुष्ट!`;
        }
      }

      if (isStaff) {
        if (length === 'short') {
          const v = [
            `${businessName} का स्टाफ बहुत ही विनम्र और मददगार है। ${staffMentionHi} ने ${prodTextHi} चुनने में बहुत अच्छा मार्गदर्शन किया।`,
            `कस्टमर सर्विस बहुत बेहतरीन है। स्टाफ ने धैर्यपूर्वक ${prodTextHi} के सभी विकल्प दिखाए और सही सलाह दी।`,
            `बहुत ही सहयोगी और पेशेवर टीम है। पूरा अनुभव बहुत ही सहज और सुखद रहा। धन्यवाद!`,
          ];
          return v[variant % v.length];
        } else if (length === 'medium') {
          return `${businessName} की टीम के साथ बहुत ही अच्छा अनुभव रहा। ${staffMentionHi} ने बहुत धैर्य के साथ हमारी जरूरतों को समझा और ${prodTextHi} के लिए बेहतरीन विकल्प सुझाए। शानदार सेवा!`;
        } else {
          return `${businessName} विज़िट किया और बहुत ही शानदार सहायता मिली। स्टाफ बहुत ही विनम्र, समझदार और अनुभवी है। बिना किसी दबाव के उन्होंने हमें सही सुझाव दिए। पूरी टीम का बहुत-बहुत धन्यवाद!`;
        }
      }

      if (isDelivery) {
        if (length === 'short') {
          const v = [
            `${prodTextHi} की डिलीवरी बिल्कुल समय पर और सुरक्षित पैकिंग के साथ मिली। बहुत संतुष्ट!`,
            `त्वरित सेवा और समय पर डिलीवरी। सारा सामान बिल्कुल सही स्थिति में पहुँचा। 5 स्टार!`,
            `समय की पूरी पाबंदी। जो तारीख तय हुई थी उसी दिन ${prodTextHi} प्राप्त हुए। बहुत बढ़िया!`,
          ];
          return v[variant % v.length];
        } else if (length === 'medium') {
          return `${businessName} से ${prodTextHi} मँगवाए थे। डिलीवरी समय पर और बिना किसी नुकसान के सुरक्षित पहुँची। बहुत ही भरोसेमंद सेवा!`;
        } else {
          return `${businessName} की समयबद्धता और कार्यप्रणाली बहुत सराहनीय है। हमारा ${prodTextHi} तय समय पर और बेहतरीन पैकिंग में मिला। ऑर्डर से लेकर डिलीवरी तक सब कुछ आसान रहा!`;
        }
      }

      if (isFinishing) {
        if (length === 'short') {
          return `${prodTextHi} का फिनिशिंग वर्क बहुत ही सफाई और बारीकी से किया गया है। बहुत बढ़िया कारीगरी! 5 स्टार।`;
        } else if (length === 'medium') {
          return `${businessName} से ${prodTextHi} लिए और इनकी फिनिशिंग वाकई लाजवाब है। कमरे का लुक एकदम रिच और क्लासिक हो गया है!`;
        } else {
          return `${prodTextHi} में फिनिशिंग और डीटेलिंग बहुत ही बेहतरीन है। कहीं कोई कमी नहीं, साफ-सुथरा और लक्ज़री लुक। हमारी उम्मीदों से कहीं बेहतर!`;
        }
      }

      if (isVariety) {
        if (length === 'short') {
          return `यहाँ एक ही छत के नीचे ${prodTextHi} का बहुत बड़ा कलेक्शन है। चुनने के लिए ढेरों विकल्प उपलब्ध हैं।`;
        } else {
          return `${businessName} में उपलब्ध विशाल कलेक्शन बहुत पसंद आया। जो भी स्टाइल दिमाग में हो, यहाँ हर तरह के विकल्प मौजूद हैं। बेहतरीन चयन!`;
        }
      }

      if (isFood) {
        return `स्वादिष्ट भोजन और प्रामाणिक स्वाद। हर व्यंजन ताज़ा, लज़ीज़ और तुरंत परोसा गया। अत्यधिक अनुशंसित!`;
      }

      // Default 'All' Hindi
      if (length === 'short') {
        const v = [
          `${businessName} से ${prodTextHi} लिए। क्वालिटी बेहतरीन है, कीमतें वाजिब हैं और स्टाफ बहुत मददगार रहा। बहुत खुश हैं।`,
          `घर के रेनोवेशन के लिए यहाँ आए थे। ${prodTextHi} का लुक बहुत अच्छा है और सही मार्गदर्शन मिला। फाइव स्टार!`,
          `यहाँ का अनुभव बहुत बढ़िया रहा। क्वालिटी, डिज़ाइन और सर्विस सब कुछ बहुत अच्छा है। अत्यधिक संतुष्ट!`,
          `${businessName} बहुत अच्छी जगह है। उचित दाम और बढ़िया काम। सभी को यहाँ आने की सलाह दूँगा।`,
        ];
        return v[variant % v.length];
      } else if (length === 'medium') {
        return `हाल ही में ${businessName} विज़िट किया। ${prodTextHi} की बनावट और फिनिश बहुत ही उत्तम है। स्टाफ बहुत पेशेवर और सहयोगी रहा। कीमतें भी बिल्कुल वाजिब हैं।`;
      } else {
        return `${businessName} में हमारा अनुभव बहुत ही शानदार रहा। हमने अपने घर के लिए ${prodTextHi} यहाँ से लिए। मटेरियल की मजबूती और सुंदरता वाकई तारीफ के काबिल है। स्टाफ ने पूरी ईमानदारी से मदद की और डिलीवरी भी समय पर हुई। बहुत ही बढ़िया काम!`;
      }
    } else {
      return `अनुभव सामान्य रहा। ${prodTextHi} लिए थे, लेकिन सेवा और बातचीत में थोड़ा सुधार हो सकता है।`;
    }
  }

  // ----------------------------------------------------
  // GUJARATI GENERATION
  // ----------------------------------------------------
  if (language === 'gu') {
    if (rating >= 4) {
      if (isQuality) {
        if (length === 'short') {
          const v = [
            `${businessName} માંથી ${prodTextGu} ખરીદ્યા. મટીરિયલની ક્વોલિટી ખૂબ જ મજબૂત અને પ્રીમિયમ છે. ફિનિશિંગ જોઈને ઘણો સંતોષ થયો. 5 સ્ટાર!`,
            `ઘરના નવનિર્માણ માટે ${prodTextGu} લીધા હતા. ક્વોલિટી ખરેખર ઉત્તમ છે અને ટકાઉ પણ છે. ખૂબ જ સંતોષકારક અનુભવ!`,
            `${prodTextGu} ની મજબૂતી અને ક્વોલિટી એકદમ એ-વન છે. કોઈ ફરિયાદ નથી. ખૂબ જ સરસ ગુણવત્તા!`,
          ];
          return v[variant % v.length];
        } else if (length === 'medium') {
          return `${businessName} માંથી ${prodTextGu} લીધા હતા. મટીરિયલની ગુણવત્તા અને ફિનિશિંગ ખૂબ જ પ્રભાવશાળી છે. લાંબા સમય સુધી ચાલે તેવું મજબૂત મટીરિયલ છે અને લુક પણ ખૂબ આકર્ષક લાગે છે. ખૂબ સરસ કામ!`;
        } else {
          return `${businessName} સાથેનો અમારો અનુભવ ખૂબ જ ઉત્તમ રહ્યો. અમે અહીંથી ${prodTextGu} પસંદ કર્યા હતા. ગુણવત્તા ખૂબ જ ઉત્કૃષ્ટ છે અને મજબૂતી પણ લાજવાબ છે. લગાવ્યા પછી ઘરનો લુક એકદમ સુંદર લાગે છે. પ્રીમિયમ ક્વોલિટી માટે ચોક્કસ મુલાકાત લેવા જેવી છે!`;
        }
      }

      if (isDesign) {
        if (length === 'short') {
          const v = [
            `${prodTextGu} ની ડિઝાઇન્સ અને કલેક્શન ખૂબ જ નવું અને આકર્ષક છે. ઘરનો લુક એકદમ બદલાઈ ગયો!`,
            `ડિઝાઇન અને ટેક્સચરમાં ઘણી બધી નવી વેરાયટી મળી. ${prodTextGu} લગાવ્યા પછી બધા પ્રશંસા કરે છે. ખૂબ ખુશ છીએ!`,
            `ટ્રેન્ડી અને યુનિક ડિઝાઇન્સ મળ્યા ${businessName} માં. અમારું ઇન્ટિરિયર ખૂબ જ સુંદર દેખાય છે!`,
          ];
          return v[variant % v.length];
        } else if (length === 'medium') {
          return `અહીં ${prodTextGu} ની અવનવી ડિઝાઇન્સ અને પેટર્ન ઉપલબ્ધ છે. આવા યુનિક પેટર્ન બીજી જગ્યાએ સરળતાથી નથી મળતા. અમારું ઇન્ટિરિયર ખૂબ જ આધુનિક અને સુંદર દેખાય છે!`;
        } else {
          return `${businessName} માં ડિઝાઇન કલેક્શન જોઈને ખૂબ આનંદ થયો. ${prodTextGu} નું ફિનિશ અને ટેક્સચર ખૂબ જ સુંદર છે. જેવો લુક વિચાર્યો હતો તેવો જ મળ્યો. દરેક વ્યક્તિ ડિઝાઇનની પ્રશંસા કરે છે!`;
        }
      }

      if (isPricing) {
        if (length === 'short') {
          const v = [
            `${businessName} માં ${prodTextGu} ના ભાવ એકદમ વ્યાજબી અને પ્રમાણિક છે. પૈસા વસૂલ ડીલ રહી!`,
            `${prodTextGu} માટે જે કિંમત ચૂકવી તે સાચે જ યોગ્ય છે. વ્યાજબી ભાવ અને બેસ્ટ ક્વોલિટી. ખૂબ સંતોષ!`,
            `માર્કેટ સાથે સરખામણી કરતા અહીં ${prodTextGu} ના રેટ સૌથી વ્યાજબી અને યોગ્ય મળ્યા. ઉત્તમ ડીલ!`,
          ];
          return v[variant % v.length];
        } else if (length === 'medium') {
          return `અહીંથી ${prodTextGu} ખરીદ્યા. માર્કેટની સરખામણીમાં ભાવ ખૂબ જ યોગ્ય છે અને ગુણવત્તા પણ શ્રેષ્ઠ છે. કોઈ છુપા ચાર્જ વગરનું પારદર્શક અને પ્રમાણિક કામ!`;
        } else {
          return `ભાવ અને ગુણવત્તા બંને બાબતે ${businessName} ઉત્તમ છે. ${prodTextGu} માટે જે રકમ ચૂકવી તે પૂરેપૂરી યોગ્ય લાગી. એકદમ ચોખ્ખો અને પારદર્શક વ્યવહાર. ખૂબ જ સંતોષ થયો!`;
        }
      }

      if (isStaff) {
        if (length === 'short') {
          const v = [
            `${businessName} નો સ્ટાફ ખૂબ જ નમ્ર અને મદદરૂપ છે. ${staffMentionGu} એ ${prodTextGu} ની પસંદગીમાં ઉત્તમ માર્ગદર્શન આપ્યું.`,
            `સ્ટાફનો વ્યવહાર ખૂબ જ સારો અને વિવેકી હતો. ધીરજપૂર્વક બધા વિકલ્પો બતાવ્યા. આભાર!`,
            `ખૂબ જ સહકારી અને પ્રોફેશનલ ટીમ છે. શરૂઆતથી અંત સુધી ઉત્તમ સેવા મળી!`,
          ];
          return v[variant % v.length];
        } else if (length === 'medium') {
          return `${businessName} ની ટીમ સાથેનો અનુભવ ખૂબ જ સરસ રહ્યો. ${staffMentionGu} એ ખૂબ ધીરજ સાથે અમારી જરૂરિયાતો સમજી અને ${prodTextGu} માટે શ્રેષ્ઠ વિકલ્પો સૂચવ્યા. ઉત્તમ સેવા!`;
        } else {
          return `${businessName} ની મુલાકાત લીધી અને ખૂબ જ સરસ સહકાર મળ્યો. સ્ટાફ ખૂબ જ વિનમ્ર, અનુભવી અને મદદગાર છે. કોઈપણ દબાણ વગર સાચું માર્ગદર્શન આપ્યું. આખી ટીમનો ખૂબ ખૂબ આભાર!`;
        }
      }

      if (isDelivery) {
        if (length === 'short') {
          const v = [
            `${prodTextGu} ની ડિલિવરી એકદમ સમયસર અને સુરક્ષિત પેકિંગ સાથે મળી ગઈ. ખૂબ સંતોષ થયો!`,
            `ઝડપી સેવા અને સમયસર ડિલિવરી. તમામ સામાન યોગ્ય સ્થિતિમાં પહોંચ્યો. 5 સ્ટાર!`,
            `સમયની પૂરેપૂરી પાબંદી. જે તારીખ કહી હતી તે જ દિવસે ${prodTextGu} મળી ગયા. ઉત્તમ સેવા!`,
          ];
          return v[variant % v.length];
        } else if (length === 'medium') {
          return `${businessName} માંથી ${prodTextGu} મંગાવ્યા હતા. ડિલિવરી સમયસર અને કોઈ નુકસાન વગર સુરક્ષિત રીતે મળી ગઈ. ખૂબ જ વિશ્વસનીય સેવા!`;
        } else {
          return `${businessName} ની સમયપાલન અને કાર્યપદ્ધતિ ખૂબ જ પ્રશંસનીય છે. અમારો ${prodTextGu} વચન આપેલા સમયે અને સુરક્ષિત રીતે મળ્યો. ઓર્ડરથી ડિલિવરી સુધીનો અનુભવ ખૂબ સરસ રહ્યો!`;
        }
      }

      if (isFinishing) {
        if (length === 'short') {
          return `${prodTextGu} નું ફિનિશિંગ વર્ક ખૂબ જ સુંદર અને ચોકસાઈપૂર્વક થયેલું છે. ઉત્તમ કારીગરી! 5 સ્ટાર.`;
        } else if (length === 'medium') {
          return `${businessName} માંથી ${prodTextGu} લીધા અને તેનું ફિનિશિંગ ખરેખર અદ્ભુત છે. રૂમનો લુક એકદમ પ્રીમિયમ બની ગયો છે!`;
        } else {
          return `${prodTextGu} માં ફિનિશિંગ અને વિગતો ખૂબ જ સુંદર છે. ક્યાંય કોઈ ખામી નથી, એકદમ સાફ-સુથરો અને લક્ઝરી લુક. અમારી અપેક્ષા કરતા પણ ઉત્તમ કામ!`;
        }
      }

      if (isVariety) {
        if (length === 'short') {
          return `અહીં એક જ જગ્યાએ ${prodTextGu} નું વિશાળ કલેક્શન છે. પસંદગી માટે ઘણા બધા વિકલ્પો ઉપલબ્ધ છે.`;
        } else {
          return `${businessName} માં ઉપલબ્ધ વિશાળ કલેક્શન ખૂબ ગમ્યું. જે પણ સ્ટાઇલ મનમાં હોય, અહીં દરેક પ્રકારના વિકલ્પો હાજર છે. ઉત્તમ પસંદગી!`;
        }
      }

      if (isFood) {
        return `ખૂબ જ સ્વાદિષ્ટ ભોજન અને અસલી સ્વાદ. દરેક વાનગી તાજી, ટેસ્ટી અને સમયસર પીરસવામાં આવી. અત્યંત ભલામણપાત્ર!`;
      }

      // Default 'All' Gujarati
      if (length === 'short') {
        const v = [
          `${businessName} માંથી ${prodTextGu} લીધા. ક્વોલિટી ઉત્તમ છે, ભાવ વ્યાજબી છે અને સ્ટાફ ખૂબ મદદરૂપ રહ્યો. ખૂબ સંતોષ થયો.`,
          `ઘરના નવનિર્માણ માટે અહીં આવ્યા હતા. ${prodTextGu} નો લુક ખૂબ સારો છે અને ઉત્તમ માર્ગદર્શન મળ્યું. ફાઇવ સ્ટાર!`,
          `અહીંનો અનુભવ ખૂબ જ સરસ રહ્યો. ક્વોલિટી, ડિઝાઇન અને સર્વિસ બધું જ ઉત્તમ છે. અત્યંત સંતોષકારક!`,
          `${businessName} ખૂબ જ સરસ જગ્યા છે. વ્યાજબી ભાવ અને ઉત્કૃષ્ટ કામ. દરેકને મુલાકાત લેવા ભલામણ કરું છું.`,
        ];
        return v[variant % v.length];
      } else if (length === 'medium') {
        return `તાજેતરમાં ${businessName} ની મુલાકાત લીધી. ${prodTextGu} ની ગુણવત્તા અને ફિનિશિંગ ખૂબ જ ઉત્તમ છે. સ્ટાફ ખૂબ નમ્ર અને સહકારી રહ્યો. ભાવ પણ એકદમ વ્યાજબી છે.`;
      } else {
        return `${businessName} માં અમારો અનુભવ ખૂબ જ શાનદાર રહ્યો. અમે અમારા ઘર માટે ${prodTextGu} અહીંથી લીધા. મટીરિયલની મજબૂતી અને સુંદરતા ખરેખર પ્રશંસાને પાત્ર છે. સ્ટાફે પ્રમાણિકપણે મદદ કરી અને ડિલિવરી પણ સમયસર થઈ. ખૂબ જ સરસ કામ!`;
      }
    } else {
      return `અનુભવ સાધારણ રહ્યો. ${prodTextGu} લીધા હતા, પરંતુ સર્વિસ અને સંચારમાં સુધારાની જરૂર જણાઈ.`;
    }
  }

  // English
  if (rating >= 4) {
    if (isQuality) {
      if (length === 'short') {
        const v = [
          `Came here for new wall panels. The build quality of the ${prodTextEn} is exceptional. Very solid materials and feels built to last. Happy!`,
          `Purchased ${prodTextEn} from ${businessName}. Superior material quality and robust durability. Very pleased!`,
          `The quality of ${prodTextEn} is top notch. Genuine materials with great structural integrity. 5 stars!`,
        ];
        return v[variant % v.length];
      } else if (length === 'medium') {
        return `Purchased ${prodTextEn} from ${businessName}. What truly stood out was the superior material quality and craftsmanship. Everything feels robust, premium, and durable. Highly recommended!`;
      } else {
        return `Recently visited ${businessName} to get ${prodTextEn} for our home renovation. The build quality and finish exceeded our expectations. The materials feel solid, durable, and truly high-end. If you are looking for long-lasting, superior quality materials, this is definitely the place!`;
      }
    }

    if (isDesign) {
      if (length === 'short') {
        const v = [
          `Loved the modern designs and unique finish of the ${prodTextEn}. Completely transformed the space with a stunning look!`,
          `Great contemporary aesthetics. The ${prodTextEn} give our interior a fresh, classy appeal. Looks wonderful!`,
          `Impressive creative styles available. Found the exact texture and finish we wanted for ${prodTextEn}. Highly recommend!`,
        ];
        return v[variant % v.length];
      } else if (length === 'medium') {
        return `Visited ${businessName} for ${prodTextEn}. Their creative collection and modern styles are absolutely gorgeous. Our interior looks rich, elegant, and perfectly coordinated now!`;
      } else {
        return `Had a wonderful experience exploring the designs at ${businessName}. Their creative selection of ${prodTextEn} is unmatched, with contemporary patterns that elevated the entire aesthetic of our room. Super happy with how it turned out!`;
      }
    }

    if (isPricing) {
      if (length === 'short') {
        const v = [
          `Bought ${prodTextEn} from ${businessName}. Prices are very fair, honest, and transparent. Excellent value for money!`,
          `Best rates in town for ${prodTextEn}. Honest pricing without compromising an ounce of quality. Happy!`,
          `Very reasonable and genuine pricing for ${prodTextEn}. You get maximum return on your investment here!`,
        ];
        return v[variant % v.length];
      } else if (length === 'medium') {
        return `Came here for ${prodTextEn}. What impressed us most was their reasonable pricing compared to other stores in the market. Top quality at honest, transparent rates!`;
      } else {
        return `Found the best rates for ${prodTextEn} at ${businessName}. Pricing is honest, upfront, and gives you incredible value for money without cutting corners on quality. Really glad we chose them!`;
      }
    }

    if (isStaff) {
      if (length === 'short') {
        const v = [
          `Staff was extremely polite, honest, and helped us select the perfect ${prodTextEn}. Great customer service today!`,
          `Outstanding customer service. ${staffMention} patiently guided us through the options for ${prodTextEn}. Very happy!`,
          `Very courteous and knowledgeable team at ${businessName}. Smooth assistance from start to finish!`,
        ];
        return v[variant % v.length];
      } else if (length === 'medium') {
        return `Outstanding experience with the team at ${businessName}. ${staffMention} was patient, knowledgeable, and guided us through every option for our ${prodTextEn}. Truly exceptional service!`;
      } else {
        return `Visited ${businessName} for ${prodTextEn} and received fantastic assistance. The staff was warm, courteous, and took the time to understand our exact requirements. No pushy sales talk, just genuine and honest guidance. A big thank you to the team!`;
      }
    }

    if (isDelivery) {
      if (length === 'short') {
        const v = [
          `Prompt service and on-time delivery for our ${prodTextEn}. Arrived in pristine condition. Very satisfied!`,
          `Quick turnaround and punctual delivery. ${prodTextEn} were packed securely and delivered without any issues!`,
          `Punctual and reliable service. Got our ${prodTextEn} exactly on the promised date. 5 stars!`,
        ];
        return v[variant % v.length];
      } else if (length === 'medium') {
        return `Ordered ${prodTextEn} from ${businessName}. The delivery was punctual, quick, and carefully handled with zero delays or damages. Super reliable service!`;
      } else {
        return `Impressive punctuality and professionalism from ${businessName}. Our ${prodTextEn} arrived right on the promised schedule and in immaculate condition. Seamless experience from order to doorstep delivery!`;
      }
    }

    if (isFinishing) {
      if (length === 'short') {
        return `The finishing on the ${prodTextEn} is flawless. Clean edges, smooth texture, and looks wonderful. 5 stars!`;
      } else if (length === 'medium') {
        return `Got ${prodTextEn} from ${businessName} and the precision and finishing are extraordinary. Adds a classy, rich feel to the entire room!`;
      } else {
        return `Every piece of ${prodTextEn} delivered by ${businessName} has immaculate finishing and attention to detail. No flaws, clean lines, and luxurious look. Exceeded our expectations in every way!`;
      }
    }

    if (isVariety) {
      if (length === 'short') {
        return `Massive variety of ${prodTextEn} under one roof. So many textures and patterns to choose from. Great store!`;
      } else {
        return `Loved the extensive collection of ${prodTextEn} at ${businessName}. Whatever style you have in mind, they have options ready to browse. Superb selection!`;
      }
    }

    if (isFood) {
      return `Delicious food and authentic taste. Every dish was fresh, flavorful, and served promptly. Highly recommended!`;
    }

    // Default 'All'
    if (length === 'short') {
      const v = [
        `Came here for new wall panels. Staff was helpful and honest. ${prodTextEn} look good. Prices are very fair. Happy.`,
        `Came here for a home makeover and found good ${prodTextEn}. Prices were fair and staff was helpful today.`,
        `Purchased ${prodTextEn} from ${businessName}. Excellent quality, modern designs, and very reasonable pricing.`,
        `Great experience finding ${prodTextEn}. The team was honest, polite, and guided us well. Highly recommended!`,
      ];
      return v[variant % v.length];
    } else if (length === 'medium') {
      return `Recently visited ${businessName} for ${prodTextEn}. The build quality and finish are exceptional. Staff was very helpful and professional. Pricing was fair and transparent.`;
    } else {
      return `Had a wonderful experience at ${businessName}. We purchased ${prodTextEn} for our home renovation. The aesthetic appeal and build quality are truly remarkable. The staff was attentive, knowledgeable, and honest. Prices were very reasonable compared to the market, and delivery was timely. Highly recommended!`;
    }
  } else {
    if (language === 'hi') {
      return `अनुभव सामान्य रहा। ${prodTextHi} लिए थे, लेकिन सेवा और बातचीत में सुधार की गुंजाइश है।`;
    } else if (language === 'gu') {
      return `અનુભવ સાધારણ રહ્યો. ${prodTextGu} લીધા હતા, પરંતુ સર્વિસ અને સંચારમાં સુધારાની જરૂર જણાઈ.`;
    } else {
      return `Service was average. Purchased ${prodTextEn}, but there was room for improvement in communication and wait time.`;
    }
  }
}

function getUniqueReviewClosing(language, category, seed) {
  const variant = Math.abs(seed) % 4;
  const categoryText = String(category || 'local business').trim();
  const closings = {
    en: [
      `The ${categoryText} experience felt genuinely thoughtful and well handled.`,
      `A dependable ${categoryText} with service that feels personal.`,
      `The attention to detail made this ${categoryText} visit memorable.`,
      `I would happily return to this ${categoryText} again.`,
    ],
    hi: [
      `${categoryText} का पूरा अनुभव बहुत सोच-समझकर और अच्छी तरह संभाला गया।`,
      `यह एक भरोसेमंद ${categoryText} है जहाँ सेवा व्यक्तिगत लगती है।`,
      `बारीकियों पर ध्यान ने इस ${categoryText} के अनुभव को यादगार बना दिया।`,
      `मैं इस ${categoryText} में दोबारा खुशी से आऊँगा।`,
    ],
    gu: [
      `${categoryText} નો આખો અનુભવ ખૂબ વિચારપૂર્વક અને સારી રીતે સંભાળવામાં આવ્યો.`,
      `આ એક વિશ્વસનીય ${categoryText} છે જ્યાં સેવા વ્યક્તિગત લાગે છે.`,
      `વિગતો પરના ધ્યાનથી આ ${categoryText} નો અનુભવ યાદગાર બન્યો.`,
      `હું આ ${categoryText} માં ફરીથી ખુશીથી આવીશ.`,
    ],
  };
  return (closings[language] || closings.en)[variant];
}

export default function ReviewPage() {
  const { businessId } = useParams();

  // Business details
  const [business, setBusiness] = useState(null);
  const [loadingBusiness, setLoadingBusiness] = useState(true);

  // Flow State
  const [rating, setRating] = useState(5);
  const [language, setLanguage] = useState('en');
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [selectedAspect, setSelectedAspect] = useState('All'); // Single-select only
  const [lengthMode, setLengthMode] = useState('short'); // 'short' | 'medium' | 'detailed'
  const [draftText, setDraftText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [seedCounter, setSeedCounter] = useState(0);
  const generationRequestRef = useRef(0);

  // Button & Interaction State
  const [buttonState, setButtonState] = useState('idle'); // 'idle' | 'copied'
  const [toastMessage, setToastMessage] = useState('');
  const [showSafariModal, setShowSafariModal] = useState(false);
  const [linkCopiedInModal, setLinkCopiedInModal] = useState(false);

  // Device & Platform Detection
  const [platform, setPlatform] = useState('desktop');
  const [isInAppBrowser, setIsInAppBrowser] = useState(false);

  // Negative Shield State (1-3 stars)
  const [negativeMessage, setNegativeMessage] = useState('');
  const [negativeContact, setNegativeContact] = useState('');
  const [submittingNegative, setSubmittingNegative] = useState(false);
  const [negativeSubmitted, setNegativeSubmitted] = useState(false);

  // Staff Attribution
  const [attributedStaff, setAttributedStaff] = useState(null);

  const debounceTimerRef = useRef(null);
  const hasInitializedDraftRef = useRef(false);
  const textareaRef = useRef(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [draftText]);

  // Toast Helper
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  // Safe clipboard helper
  const copyToClipboard = async (text) => {
    const clean = String(text || '').trim();
    if (!clean) return false;

    // Modern API
    if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
      try {
        await navigator.clipboard.writeText(clean);
        return true;
      } catch (err) {
        console.warn('navigator.clipboard write failed, falling back:', err);
      }
    }

    // Hidden textarea fallback for iOS / Android WebViews
    try {
      const textArea = document.createElement('textarea');
      textArea.value = clean;
      textArea.setAttribute('readonly', '');
      textArea.style.position = 'fixed';
      textArea.style.top = '-9999px';
      textArea.style.left = '-9999px';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      textArea.setSelectionRange(0, 99999);
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      if (successful) return true;
    } catch (e) {
      console.warn('execCommand copy fallback failed:', e);
    }
    return false;
  };

  // Detect platform & in-app browser on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && window.navigator) {
      const ua = window.navigator.userAgent || '';
      setIsInAppBrowser(checkIsInAppBrowser(ua));
      setPlatform(checkPlatform(ua));
    }
  }, []);

  // Fetch Business Information
  useEffect(() => {
    async function loadBusinessData() {
      setLoadingBusiness(true);
      try {
        const sp = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();
        const effectiveId = businessId || sp.get('businessId') || sp.get('bizId') || sp.get('id') || 'lakshmi-interior';

        let data = await api.getBusiness(effectiveId, { isPublic: true });

        // If data not found, or for generic fallback, populate default
        if (!data) {
          data = {
            id: effectiveId,
            name: effectiveId === 'lakshmi-interior' ? 'Lakshmi Interior' : 'Lakshmi Interior',
            category: 'interior',
            address: 'Ck 55/25, Rajadarwaja',
            phone: '8528012365',
            logoUrl: 'https://nzhlajxwpxvtcrjrygwv.supabase.co/storage/v1/object/public/logos/cb3ee9da-0c79-4570-8d3a-241f79c57416/79a64f5c-ff95-478c-a85a-4b79760ca3cf.png',
            services: DEFAULT_LAKSHMI_PRODUCTS,
            googleReviewUrl: 'https://g.page/r/CRjGnJTCvAcbEAE/review',
            google_review_link: 'https://g.page/r/CRjGnJTCvAcbEAE/review',
            instagramUrl: 'https://www.instagram.com/lakshmi_interior_varanasi/',
            websiteUrl: 'https://www.instagram.com/lakshmi_interior_varanasi/',
            status: 'active',
          };
        }

        // Ensure products list is set
        if (!data.services || data.services.length === 0) {
          data.services = DEFAULT_LAKSHMI_PRODUCTS;
        }

        // Staff attribution check
        const urlStaff = sp.get('staff') || sp.get('staffName') || '';
        const urlStaffId = sp.get('staffId') || '';
        const staffList = getBusinessStaffList(data.id || effectiveId);
        if (urlStaff || urlStaffId) {
          const matched = staffList.find(
            (s) => (urlStaffId && s.id === urlStaffId) ||
                   (urlStaff && s.name.toLowerCase().includes(urlStaff.toLowerCase()))
          );
          if (matched) {
            setAttributedStaff(matched);
          } else if (urlStaff) {
            setAttributedStaff({ id: urlStaffId || 'staff-url', name: urlStaff });
          }
        }

        setBusiness(data);
      } catch (err) {
        console.error('Error loading review business:', err);
        setBusiness({
          id: 'lakshmi-interior',
          name: 'Lakshmi Interior',
          category: 'interior',
          address: 'Ck 55/25, Rajadarwaja',
          phone: '8528012365',
          logoUrl: 'https://nzhlajxwpxvtcrjrygwv.supabase.co/storage/v1/object/public/logos/cb3ee9da-0c79-4570-8d3a-241f79c57416/79a64f5c-ff95-478c-a85a-4b79760ca3cf.png',
          services: DEFAULT_LAKSHMI_PRODUCTS,
          googleReviewUrl: 'https://g.page/r/CRjGnJTCvAcbEAE/review',
          instagramUrl: 'https://www.instagram.com/lakshmi_interior_varanasi/',
          websiteUrl: 'https://www.instagram.com/lakshmi_interior_varanasi/',
          status: 'active',
        });
      } finally {
        setLoadingBusiness(false);
      }
    }

    loadBusinessData();
  }, [businessId]);

  // Keep the public review page synchronized with admin profile changes.
  useEffect(() => {
    let active = true;
    const effectiveId = businessId || new URLSearchParams(window.location.search).get('businessId') || 'lakshmi-interior';

    const applyBusinessUpdate = (nextBusiness) => {
      if (!active || !nextBusiness || nextBusiness.id !== effectiveId) return;
      setBusiness({
        ...nextBusiness,
        services: Array.isArray(nextBusiness.services) && nextBusiness.services.length > 0
          ? nextBusiness.services
          : DEFAULT_LAKSHMI_PRODUCTS,
      });
    };

    const refreshBusiness = async () => {
      try {
        const freshBusiness = await api.getBusiness(effectiveId, { isPublic: true });
        applyBusinessUpdate(freshBusiness);
      } catch (error) {
        console.warn('Unable to refresh public business details:', error);
      }
    };

    const handleBusinessUpdated = (event) => {
      applyBusinessUpdate(event.detail?.business);
    };

    window.addEventListener('reviewassist:business_updated', handleBusinessUpdated);
    const intervalId = window.setInterval(refreshBusiness, 5000);
    const realtimeChannel = isSupabaseConfigured() && supabase
      ? supabase
        .channel(`public-business-${effectiveId}`)
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'businesses', filter: `id=eq.${effectiveId}` },
          () => refreshBusiness()
        )
        .subscribe()
      : null;
    return () => {
      active = false;
      window.clearInterval(intervalId);
      window.removeEventListener('reviewassist:business_updated', handleBusinessUpdated);
      if (realtimeChannel) supabase.removeChannel(realtimeChannel);
    };
  }, [businessId]);

  // Available Products & Aspects
  const availableProducts = useMemo(() => {
    if (business?.services && Array.isArray(business.services) && business.services.length > 0) {
      return business.services;
    }
    return DEFAULT_LAKSHMI_PRODUCTS;
  }, [business]);

  const availableAspects = useMemo(() => {
    return getCategoryPraiseOptions(business?.category);
  }, [business?.category]);

  // Central Review Text Synthesis
  const triggerReviewSynthesis = (overrideParams = {}) => {
    const requestedProducts = overrideParams.products !== undefined ? overrideParams.products : selectedProducts;
    const activeProducts = requestedProducts.length > 0
      ? requestedProducts
      : availableProducts.slice(0, 2);
    const activeAspect = overrideParams.aspect !== undefined ? overrideParams.aspect : selectedAspect;
    const activeRating = overrideParams.rating !== undefined ? overrideParams.rating : rating;
    const activeLang = overrideParams.language !== undefined ? overrideParams.language : language;
    const activeLength = overrideParams.length !== undefined ? overrideParams.length : lengthMode;
    const activeSeed = overrideParams.seed !== undefined ? overrideParams.seed : seedCounter + 1;
    setSeedCounter(activeSeed);
    const requestId = generationRequestRef.current + 1;
    generationRequestRef.current = requestId;

    setIsGenerating(true);

    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

    debounceTimerRef.current = setTimeout(async () => {
      try {
        const languageName = REVIEW_LANGUAGES.find((item) => item.code === activeLang)?.label || 'English';
        const response = await api.generateDraftReview({
          businessId: business?.id || businessId || 'demo-1',
          serviceType: activeProducts.join(', '),
          whatStoodOut: activeAspect,
          whatCouldImprove: activeRating <= 3 ? 'Please keep the tone honest and constructive.' : '',
          rating: activeRating,
          previousDraft: draftText,
          businessCategory: business?.category || '',
          seed: activeSeed,
          lengthPreference: activeLength,
          language: languageName.toLowerCase(),
          staffName: attributedStaff?.name || '',
        });
        if (generationRequestRef.current === requestId) {
          setDraftText(response.draftText || '');
        }
      } catch (e) {
        console.error('Review generation failed:', e);
        if (generationRequestRef.current === requestId) {
          showToast(e.message || 'Unable to generate a review right now.');
        }
      } finally {
        if (generationRequestRef.current === requestId) {
          setIsGenerating(false);
        }
      }
    }, 180);
  };

  // Initial Draft Generation once business is loaded
  useEffect(() => {
    if (business && !hasInitializedDraftRef.current) {
      hasInitializedDraftRef.current = true;
      triggerReviewSynthesis({ seed: Date.now() });
    }
  }, [business]);

  // Product Chip Toggle
  const handleToggleProduct = (productName) => {
    const next = selectedProducts.includes(productName)
      ? selectedProducts.filter((p) => p !== productName)
      : [...selectedProducts, productName];
    setSelectedProducts(next);
    triggerReviewSynthesis({ products: next });
  };

  // Aspect Chip Single-Select (Only one aspect can be chosen at a time)
  const handleSelectAspect = (aspectName) => {
    setSelectedAspect(aspectName);
    triggerReviewSynthesis({ aspect: aspectName });
  };

  // Language Pill Toggle
  const handleLanguageChange = (langCode) => {
    if (language === langCode) return;
    setLanguage(langCode);
    triggerReviewSynthesis({ language: langCode });
  };

  // Star Rating Click
  const handleStarClick = (starVal) => {
    setRating(starVal);
    if (starVal >= 4) {
      triggerReviewSynthesis({ rating: starVal });
    }
  };

  // "Generate another" click
  const handleGenerateAnother = () => {
    const nextSeed = seedCounter + 1;
    setSeedCounter(nextSeed);
    triggerReviewSynthesis({ seed: nextSeed });
  };

  // Change Length ('short' | 'medium' | 'detailed')
  const handleChangeLength = (newLength) => {
    setLengthMode(newLength);
    triggerReviewSynthesis({ length: newLength });
  };

  // Primary Action: "Copy Review & Open Google Maps"
  const handleCopyAndOpenGoogle = async () => {
    const textToCopy = (draftText || '').trim();
    if (!textToCopy) return;

    // In-App browser check on iOS: prompt to open in Safari
    if (platform === 'ios' && isInAppBrowser) {
      setShowSafariModal(true);
      return;
    }

    // 1. Immediately copy to clipboard
    const success = await copyToClipboard(textToCopy);
    if (success) {
      setButtonState('copied');
      showToast('✓ Review copied to clipboard!');
    }

    // 2. Celebratory Confetti
    try {
      confetti({
        particleCount: 75,
        spread: 65,
        origin: { y: 0.65 },
      });
    } catch {}

    // 3. Log confirmed review asynchronously (leaderboard & metrics)
    const targetGoogleUrl = sanitizeGoogleReviewUrl(
      business?.googleReviewUrl || business?.google_review_link || business?.googleReviewLink,
      'https://g.page/r/CRjGnJTCvAcbEAE/review'
    );

    try {
      api.confirmReview({
        businessId: business?.id || businessId || 'lakshmi-interior',
        serviceType: selectedProducts.join(', ') || 'Interior Design & Materials',
        finalText: textToCopy,
        rating,
        whatStoodOut: selectedAspect === 'All' ? 'Overall satisfaction' : selectedAspect,
        staffId: attributedStaff?.id || '',
        staffName: attributedStaff?.name || '',
      }).catch(() => {});
    } catch {}

    // 4. Open Google Maps Destination
    const destinationUrl = getPlatformReviewUrl(targetGoogleUrl, platform);
    setTimeout(() => {
      window.open(destinationUrl, '_blank', 'noopener,noreferrer');
      setTimeout(() => setButtonState('idle'), 6000);
    }, 400);
  };

  // Negative Shield Feedback Submit
  const handleSendNegativeFeedback = async (e) => {
    if (e) e.preventDefault();
    if (!negativeMessage.trim()) {
      showToast('Please tell us what went wrong.');
      return;
    }

    setSubmittingNegative(true);
    try {
      await api.submitPrivateFeedback({
        businessId: business?.id || businessId || 'lakshmi-interior',
        serviceType: selectedProducts.join(', ') || 'Customer Feedback',
        rating,
        issue: negativeMessage.trim(),
        customerContact: negativeContact.trim() || 'Private feedback',
        customerName: 'Valued Customer',
      });
      setNegativeSubmitted(true);
      showToast('✓ Feedback delivered privately to owner.');
    } catch (err) {
      console.warn('Private feedback submission error:', err);
      setNegativeSubmitted(true);
    } finally {
      setSubmittingNegative(false);
    }
  };

  // Direct WhatsApp Message for negative feedback
  const handleDirectWhatsAppOwner = () => {
    const rawPhone = business?.phone || '8528012365';
    const waNum = normalizeWhatsAppNumber(rawPhone);
    const msg = `Hi ${business?.name || 'Owner'}, I visited recently and had some feedback regarding my experience: "${negativeMessage.trim()}". Reaching out directly to resolve this.`;
    const waUrl = `https://wa.me/${waNum}?text=${encodeURIComponent(msg)}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  if (loadingBusiness) {
    return (
      <div className="ra-review-viewport" style={{ justifyContent: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' }}>
          <span className="ra-spinner" style={{ width: '32px', height: '32px', borderWidth: '3px' }} />
          <p style={{ fontSize: '14px', color: '#64748b', margin: 0, fontWeight: 500 }}>
            Loading ReviewAssist Portal...
          </p>
        </div>
      </div>
    );
  }

  const isPositive = rating >= 4;
  const rawTargetGoogleLink = sanitizeGoogleReviewUrl(
    business?.googleReviewUrl || business?.google_review_link || business?.googleReviewLink,
    'https://g.page/r/CRjGnJTCvAcbEAE/review'
  );

  return (
    <main className="ra-review-viewport">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="ra-toast animate-fade-in">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Structured Floating Review Card */}
      <div className="ra-review-card-shell animate-fade-in">

        {/* ReviewAssist Branded Hero Banner */}
        <div className="ra-brand-hero-banner">
          <div className="ra-hero-top-row">
            {/* Segmented Language Switcher */}
            <div className="ra-lang-switcher" role="radiogroup" aria-label="Review language">
              {REVIEW_LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  type="button"
                  className={`ra-lang-tab ${language === lang.code ? 'active' : ''}`}
                  onClick={() => handleLanguageChange(lang.code)}
                  aria-pressed={language === lang.code}
                  title={lang.label}
                >
                  {lang.nativeLabel}
                </button>
              ))}
            </div>
          </div>

          <div className="ra-hero-profile-card">
            <div className="ra-profile-avatar-frame">
              {business?.logoUrl ? (
                <img
                  src={business.logoUrl}
                  alt={business.name || 'Business Logo'}
                  className="ra-biz-logo-img"
                />
              ) : (
                <div className="ra-biz-logo-avatar">
                  <span>{(business?.name || 'B').slice(0, 1).toUpperCase()}</span>
                </div>
              )}
            </div>
            <div className="ra-hero-profile-info">
              <div className="ra-hero-title-row">
                <h1 className="ra-biz-name">{business?.name || 'Lakshmi Interior'}</h1>
                <span className="ra-verified-badge" title="Verified Business">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="#38bdf8">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                  </svg>
                </span>
              </div>
              <p className="ra-biz-category-line">
                {business?.category || 'Interior Design & Home Decor'}
              </p>
            </div>
          </div>
        </div>

        {/* Card Body */}
        <div className="ra-card-body">
          {/* Rating Block with Left-aligned Kicker & Score Pill */}
          <div className="ra-rating-block">
            <div className="ra-rating-header">
              <span className="ra-rating-kicker">YOUR EXPERIENCE</span>
              <span className={`ra-rating-score-pill ${isPositive ? 'positive' : 'negative'}`}>
                {isPositive ? `⭐ ${rating}.0 — ${rating === 5 ? 'Outstanding!' : 'Great Visit!'}` : `💬 ${rating}.0 — Private Care`}
              </span>
            </div>

            <div className="ra-stars-row" role="radiogroup" aria-label="Rating Stars">
              {[1, 2, 3, 4, 5].map((starVal) => (
                <button
                  key={starVal}
                  type="button"
                  className="ra-star-btn"
                  onClick={() => handleStarClick(starVal)}
                  aria-label={`${starVal} star rating`}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={`ra-star-svg ${starVal <= rating ? 'filled' : 'empty'}`}
                  >
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                </button>
              ))}
            </div>

            <p className="ra-rating-prompt">
              {isPositive
                ? 'Tap stars to update • What made your experience stand out?'
                : 'We value your honesty. Let us know how management can make this right.'}
            </p>
          </div>

          {/* Positive Review Flow (4 or 5 Stars) */}
          {isPositive && (
            <>
              {/* Step 1: Products & Services (Structured Multi-Select Grid) */}
              {availableProducts.length > 0 && (
                <div className="ra-module-card">
                  <div className="ra-module-header">
                    <span className="ra-step-badge">1</span>
                    <div className="ra-module-titles">
                      <h2 className="ra-module-title">Products & Services</h2>
                      <span className="ra-module-sub">Select items you purchased or inquired about</span>
                    </div>
                  </div>
                  <div className="ra-products-grid">
                    {availableProducts.map((prod) => {
                      const isSelected = selectedProducts.includes(prod);
                      return (
                        <button
                          key={prod}
                          type="button"
                          className={`ra-product-tile ${isSelected ? 'selected' : ''}`}
                          onClick={() => handleToggleProduct(prod)}
                          aria-pressed={isSelected}
                        >
                          <span className="ra-checkbox-box">
                            {isSelected && (
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            )}
                          </span>
                          <span className="ra-product-name">{prod}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Step 2: What Stood Out (Structured Single-Select Highlight Grid) */}
              <div className="ra-module-card">
                <div className="ra-module-header">
                  <span className="ra-step-badge">2</span>
                  <div className="ra-module-titles">
                    <h2 className="ra-module-title">What Stood Out Most?</h2>
                    <span className="ra-module-sub">Pick 1 key impression to emphasize in your review</span>
                  </div>
                  <span className="ra-single-badge">Select 1</span>
                </div>
                <div className="ra-aspects-grid">
                  {availableAspects.map((aspect) => {
                    const isSelected = selectedAspect === aspect;
                    const icon = getAspectIcon(aspect);
                    return (
                      <button
                        key={aspect}
                        type="button"
                        className={`ra-aspect-card ${isSelected ? 'selected' : ''}`}
                        onClick={() => handleSelectAspect(aspect)}
                        aria-pressed={isSelected}
                      >
                        <span className="ra-aspect-icon">{icon}</span>
                        <span className="ra-aspect-text">{aspect}</span>
                        {isSelected && (
                          <span className="ra-aspect-check">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* In-App Browser Warning Alert (if applicable) */}
              {isInAppBrowser && (
                <div className="ra-inapp-alert">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" style={{ flexShrink: 0, marginTop: '2px' }}>
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                    <line x1="12" y1="9" x2="12" y2="13" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                  <p className="ra-inapp-text">
                    You’re viewing inside an in-app browser. Tap <b>⋯</b> or <b>share</b> above and choose <b>“Open in Browser”</b> for 1-tap Google sign-in.
                  </p>
                </div>
              )}

              {/* Live Generating State */}
              {isGenerating && (
                <div className="ra-status-row">
                  <span className="ra-spinner" />
                  <span>Synthesizing smart draft…</span>
                </div>
              )}

              {/* Step 3: AI Review Studio Card */}
              <div className="ra-module-card ra-ai-studio-card">
                <div className="ra-studio-topbar">
                  <div className="ra-studio-badge">
                    <span className="ra-ai-sparkle">✨</span>
                    <span>ReviewAssist AI Draft</span>
                  </div>

                  {/* Length Pills */}
                  <div className="ra-length-controls" role="group" aria-label="Review Length">
                    {['short', 'medium', 'detailed'].map((len) => (
                      <button
                        key={len}
                        type="button"
                        className={`ra-length-btn ${lengthMode === len ? 'active' : ''}`}
                        onClick={() => handleChangeLength(len)}
                      >
                        {len === 'short' ? 'Brief' : len === 'medium' ? 'Standard' : 'Detailed'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Auto-Expanding Editable Textarea */}
                <div className="ra-textarea-wrapper">
                  <textarea
                    ref={textareaRef}
                    className="ra-smart-textarea"
                    value={draftText}
                    onChange={(e) => {
                      setDraftText(e.target.value);
                      if (textareaRef.current) {
                        textareaRef.current.style.height = 'auto';
                        textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
                      }
                    }}
                    rows={2}
                    aria-label="AI Generated Review Draft"
                  />
                </div>

                {/* Studio Footer */}
                <div className="ra-studio-footer">
                  <span className="ra-studio-hint">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                    <span>Tap text to customize</span>
                  </span>
                  <button
                    type="button"
                    className="ra-variation-btn"
                    onClick={handleGenerateAnother}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                      <path d="M21 3v5h-5" />
                      <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
                      <path d="M8 16H3v5" />
                    </svg>
                    <span>New Variation</span>
                  </button>
                </div>
              </div>

              {/* Primary High-Impact CTA Button Cluster */}
              <div className="ra-cta-cluster">
                <button
                  type="button"
                  className={`ra-submit-cta ${buttonState === 'copied' ? 'is-copied' : ''}`}
                  onClick={handleCopyAndOpenGoogle}
                >
                  {buttonState === 'idle' ? (
                    <>
                      <div className="ra-cta-icon-wrap">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                          <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                        </svg>
                      </div>
                      <div className="ra-cta-text-col">
                        <span className="ra-cta-main-text">Copy Review & Open Google Maps</span>
                        <span className="ra-cta-sub-text">1-Click Auto Copy • Direct Google Submit</span>
                      </div>
                      <svg className="ra-cta-arrow" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="5" y1="12" x2="19" y2="12" />
                        <polyline points="12 5 19 12 12 19" />
                      </svg>
                    </>
                  ) : (
                    <>
                      <div className="ra-cta-icon-wrap success">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </div>
                      <div className="ra-cta-text-col">
                        <span className="ra-cta-main-text">Copied! Opening Google Maps…</span>
                        <span className="ra-cta-sub-text">Paste and submit on Google</span>
                      </div>
                    </>
                  )}
                </button>

                <p className="ra-cta-disclaimer">
                  <span className="ra-lock-dot">🔒</span> Review copied to clipboard. You can paste and submit directly on Google Maps.
                </p>
              </div>
            </>
          )}

          {/* Negative Protection Shield (1 to 3 Stars) */}
          {!isPositive && (
            <div className="ra-private-shield">
              {!negativeSubmitted ? (
                <>
                  <div className="ra-shield-header">
                    <div className="ra-shield-badge">🛡️</div>
                    <div>
                      <h3 className="ra-shield-title">Private Management Feedback</h3>
                      <p className="ra-shield-desc">
                        Sent directly to business leadership, not posted on Google.
                      </p>
                    </div>
                  </div>

                  <textarea
                    className="ra-textarea"
                    placeholder="Tell us what went wrong so we can fix it..."
                    rows={4}
                    value={negativeMessage}
                    onChange={(e) => setNegativeMessage(e.target.value)}
                  />

                  <input
                    type="text"
                    className="ra-input"
                    placeholder="Your Phone or Email (for owner follow-up)"
                    value={negativeContact}
                    onChange={(e) => setNegativeContact(e.target.value)}
                  />

                  <button
                    type="button"
                    className="ra-primary-cta"
                    onClick={handleSendNegativeFeedback}
                    disabled={submittingNegative || !negativeMessage.trim()}
                  >
                    <span>{submittingNegative ? 'Sending Feedback…' : 'Submit Private Feedback'}</span>
                  </button>

                  {business?.phone && (
                    <button
                      type="button"
                      className="ra-wa-owner-btn"
                      onClick={handleDirectWhatsAppOwner}
                    >
                      <span>💬 Direct WhatsApp with Owner</span>
                    </button>
                  )}

                  <a
                    href={getPlatformReviewUrl(rawTargetGoogleLink, platform)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ra-skip-link"
                  >
                    Skip and review on Google anyway →
                  </a>
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: '16px 0' }}>
                  <div style={{ fontSize: '36px', marginBottom: '8px' }}>✅</div>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', margin: '4px 0' }}>
                    Feedback Received
                  </h3>
                  <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
                    Thank you. The business owner will review this and follow up directly.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Business Contact & Quick Directions Dock */}
        <div className="ra-biz-contact-module">
          <div className="ra-location-line">
            <div className="ra-loc-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
            </div>
            <div className="ra-loc-text">
              <span className="ra-loc-name">{business?.name || 'Lakshmi Interior'}</span>
              <span className="ra-loc-address">{business?.address || 'Ck 55/25, Rajadarwaja'}</span>
            </div>
          </div>

          <div className="ra-quick-actions-grid">
            {/* Call */}
            <a
              href={`tel:${business?.phone || '8528012365'}`}
              className="ra-quick-action-btn"
              title="Call Business"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
              <span>Call</span>
            </a>

            {/* WhatsApp */}
            <a
              href={`https://wa.me/${normalizeWhatsAppNumber(business?.phone || '8528012365')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="ra-quick-action-btn"
              title="WhatsApp"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
              </svg>
              <span>WhatsApp</span>
            </a>

            {/* Instagram */}
            <a
              href={safeExternalUrl(business?.instagramUrl) || 'https://www.instagram.com/lakshmi_interior_varanasi/'}
              target="_blank"
              rel="noopener noreferrer"
              className="ra-quick-action-btn"
              title="Instagram"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
              </svg>
              <span>Instagram</span>
            </a>

            {safeExternalUrl(business?.websiteUrl) && (
              <a
                href={safeExternalUrl(business.websiteUrl)}
                target="_blank"
                rel="noopener noreferrer"
                className="ra-quick-action-btn"
                title="Website"
              >
                <span aria-hidden="true">🌐</span>
                <span>Website</span>
              </a>
            )}

            {safeExternalUrl(business?.facebookUrl) && (
              <a
                href={safeExternalUrl(business.facebookUrl)}
                target="_blank"
                rel="noopener noreferrer"
                className="ra-quick-action-btn"
                title="Facebook"
              >
                <span aria-hidden="true">f</span>
                <span>Facebook</span>
              </a>
            )}

            {safeExternalUrl(business?.youtubeUrl) && (
              <a
                href={safeExternalUrl(business.youtubeUrl)}
                target="_blank"
                rel="noopener noreferrer"
                className="ra-quick-action-btn"
                title="YouTube"
              >
                <span aria-hidden="true">▶</span>
                <span>YouTube</span>
              </a>
            )}

            {/* Directions / Maps */}
            <a
              href={rawTargetGoogleLink}
              target="_blank"
              rel="noopener noreferrer"
              className="ra-quick-action-btn directions"
              title="Directions"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="3 11 22 2 13 21 11 13 3 11" />
              </svg>
              <span>Directions</span>
            </a>
          </div>
        </div>
      </div>

      {/* Verified Portal Stamp */}
      <div className="ra-trust-stamp">
        <span>Protected by</span>
        <span className="ra-trust-logo">ReviewAssist</span>
        <span>• Smart AI Reputation Platform</span>
      </div>

      {/* Safari Helper Modal for iOS In-App Browsers */}
      {showSafariModal && (
        <div className="ra-modal-backdrop" onClick={() => setShowSafariModal(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', zIndex: 9999 }}>
          <div style={{ background: '#ffffff', borderRadius: '20px', maxWidth: '380px', width: '100%', padding: '24px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', textAlign: 'left' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '17px', fontWeight: 700, margin: 0, color: '#0f172a' }}>Open in Safari</h3>
              <button
                type="button"
                onClick={() => setShowSafariModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                ✕
              </button>
            </div>
            <p style={{ fontSize: '13px', color: '#64748b', margin: '12px 0', lineHeight: 1.5 }}>
              Google blocks review logins inside social app browsers. To post smoothly:
            </p>
            <ol style={{ fontSize: '13px', color: '#334155', paddingLeft: '18px', margin: '10px 0', lineHeight: 1.6 }}>
              <li>Tap the <b>share</b> icon or <b>⋯</b> menu above</li>
              <li>Select <b>“Open in Safari / Chrome”</b></li>
              <li>Paste your copied review text</li>
            </ol>
            <button
              type="button"
              className="ra-primary-cta"
              style={{ marginTop: '16px', padding: '12px 16px' }}
              onClick={async () => {
                await copyToClipboard(window.location.href);
                setLinkCopiedInModal(true);
                setTimeout(() => setLinkCopiedInModal(false), 3000);
              }}
            >
              {linkCopiedInModal ? '✓ Page Link Copied!' : '📋 Copy Link for Browser'}
            </button>
            <a
              href={getPlatformReviewUrl(rawTargetGoogleLink, platform)}
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: 'block', textAlign: 'center', fontSize: '12px', color: '#64748b', marginTop: '12px', textDecoration: 'underline' }}
              onClick={() => setShowSafariModal(false)}
            >
              Continue in this browser anyway
            </a>
          </div>
        </div>
      )}
    </main>
  );
}
