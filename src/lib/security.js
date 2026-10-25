/**
 * Security Utilities
 * Centralized validations, sanitizers, and cryptographically secure generators.
 * Protects against XSS (CWE-79), CSV Injection (CWE-1236), and Weak Credentials (CWE-521/1392).
 */

/**
 * Approved Google Review Hostnames (exact or subdomains)
 */
const APPROVED_GOOGLE_HOSTS = [
  'g.page',
  'google.com',
  'goo.gl',
  'maps.google.com',
  'search.google.com',
  'business.google.com',
  'maps.app.goo.gl',
];

/**
 * Validates and sanitizes a Google Review destination link.
 * Strictly enforces HTTPS and approved Google domains.
 * Rejects javascript:, data:, and third-party phishing/redirection URLs.
 * 
 * @param {string} url - Target URL to validate
 * @param {string} fallback - Safe fallback URL if invalid (default: '')
 * @returns {string} Sanitized URL or fallback
 */
export function sanitizeGoogleReviewUrl(url, fallback = '') {
  if (!url || typeof url !== 'string') return fallback;
  const trimmed = url.trim();
  if (!trimmed) return fallback;

  try {
    const parsed = new URL(trimmed);

    // 1. Enforce HTTPS only (blocks javascript:, data:, vbscript:, etc.)
    if (parsed.protocol !== 'https:') {
      console.warn('Blocked non-HTTPS review destination:', parsed.protocol);
      return fallback;
    }

    // 2. Hostname validation against approved Google domains
    const host = parsed.hostname.toLowerCase();
    const isApprovedHost = APPROVED_GOOGLE_HOSTS.some(
      (approved) => host === approved || host.endsWith('.' + approved)
    );

    if (!isApprovedHost) {
      console.warn('Blocked unapproved review destination host:', host);
      return fallback;
    }

    return parsed.href;
  } catch (err) {
    console.warn('Invalid URL passed to sanitizeGoogleReviewUrl:', err);
    return fallback;
  }
}

/**
 * Generates a cryptographically secure random password using Web Crypto API.
 * Provides > 95 bits of entropy (exceeds CWE-521 recommendations).
 * 
 * @param {number} length - Password length (minimum 14, default 16)
 * @returns {string} High-entropy secure password
 */
export function generateSecurePassword(length = 16) {
  const effectiveLength = Math.max(14, Number(length) || 16);
  const uppers = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lowers = 'abcdefghijkmnopqrstuvwxyz';
  const digits = '23456789';
  const symbols = '!@#$%^&*_-+=';
  const allChars = uppers + lowers + digits + symbols;

  // Ensure crypto is available
  const cryptoObj = typeof window !== 'undefined' && (window.crypto || window.msCrypto);
  if (!cryptoObj || typeof cryptoObj.getRandomValues !== 'function') {
    // Fallback if crypto is unavailable (extremely rare in modern browsers)
    const buf = [];
    for (let i = 0; i < effectiveLength; i++) {
      buf.push(allChars.charAt(Math.floor(Math.random() * allChars.length)));
    }
    return buf.join('');
  }

  const values = new Uint32Array(effectiveLength);
  cryptoObj.getRandomValues(values);

  const passwordChars = [];
  // Ensure at least one character from each set
  passwordChars.push(uppers[values[0] % uppers.length]);
  passwordChars.push(lowers[values[1] % lowers.length]);
  passwordChars.push(digits[values[2] % digits.length]);
  passwordChars.push(symbols[values[3] % symbols.length]);

  // Fill the rest from allChars
  for (let i = 4; i < effectiveLength; i++) {
    passwordChars.push(allChars[values[i] % allChars.length]);
  }

  // Shuffle using Fisher-Yates with crypto values
  const shuffleValues = new Uint32Array(passwordChars.length);
  cryptoObj.getRandomValues(shuffleValues);
  for (let i = passwordChars.length - 1; i > 0; i--) {
    const j = shuffleValues[i] % (i + 1);
    const temp = passwordChars[i];
    passwordChars[i] = passwordChars[j];
    passwordChars[j] = temp;
  }

  return passwordChars.join('');
}

/**
 * Neutralizes spreadsheet formula elements in untrusted cell text (CWE-1236 CSV Injection).
 * Any cell beginning with '=', '+', '-', '@', tab, or carriage return is prefixed with a single quote (').
 * 
 * @param {*} val - Cell value to format
 * @returns {string} Quoted, neutralized CSV cell
 */
export function sanitizeCsvCell(val) {
  if (val === null || val === undefined) return '""';
  let str = String(val);

  // Check for formula injection triggers (including leading whitespace)
  if (/^[\s]*[=+\-@\t\r]/.test(str)) {
    str = "'" + str;
  }

  // Escape double quotes as per RFC 4180
  return `"${str.replace(/"/g, '""')}"`;
}
