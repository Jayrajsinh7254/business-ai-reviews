import QRCode from 'qrcode';

/**
 * Sample Geometric Emblem Logo (Reference Style)
 */
export const SAMPLE_BRAND_LOGO = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
  <circle cx="100" cy="100" r="92" fill="#ffffff" stroke="#111827" stroke-width="6"/>
  <circle cx="100" cy="100" r="50" fill="none" stroke="#111827" stroke-width="8"/>
  <circle cx="100" cy="70" r="30" fill="none" stroke="#111827" stroke-width="6"/>
  <circle cx="100" cy="130" r="30" fill="none" stroke="#111827" stroke-width="6"/>
  <circle cx="70" cy="100" r="30" fill="none" stroke="#111827" stroke-width="6"/>
  <circle cx="130" cy="100" r="30" fill="none" stroke="#111827" stroke-width="6"/>
  <circle cx="100" cy="100" r="14" fill="#111827"/>
</svg>
`)}`;

/**
 * Load image helper safely handling Base64 and remote URLs
 */
export function loadImageSafely(src) {
  return new Promise((resolve) => {
    if (!src) return resolve(null);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

/**
 * Generates high-contrast QR Code with centered circular business logo
 * Uses Level 'H' Error Correction so QR code is scannable even with logo occlusion.
 */
export async function createQRDataUrlWithCenterLogo(text, logoUrl, size = 800) {
  if (!text) return '';

  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  // Render QR Code with error correction Level 'H' (allows up to 30% center coverage)
  await QRCode.toCanvas(canvas, text, {
    width: size,
    margin: 1,
    color: {
      dark: '#111827',
      light: '#ffffff',
    },
    errorCorrectionLevel: 'H',
  });

  if (logoUrl) {
    try {
      const img = await loadImageSafely(logoUrl);

      if (img && img.width && img.height) {
        const cx = size / 2;
        const cy = size / 2;
        // 22% diameter for logo maintains 100% scanner compatibility
        const logoDiameter = Math.round(size * 0.22);
        const badgeRadius = Math.round(logoDiameter / 2 + size * 0.024);

        // Circular white badge behind logo
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, badgeRadius, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.18)';
        ctx.shadowBlur = Math.round(size * 0.015);
        ctx.shadowOffsetY = Math.round(size * 0.005);
        ctx.fill();

        // Crisp border ring around badge
        ctx.lineWidth = Math.max(3, Math.round(size * 0.006));
        ctx.strokeStyle = '#e2e8f0';
        ctx.stroke();
        ctx.restore();

        // Draw clipped logo inside circle
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, Math.round(logoDiameter / 2), 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(
          img,
          cx - logoDiameter / 2,
          cy - logoDiameter / 2,
          logoDiameter,
          logoDiameter
        );
        ctx.restore();
      }
    } catch (err) {
      console.warn('QR center logo embedding note:', err);
    }
  }

  return canvas.toDataURL('image/png');
}
