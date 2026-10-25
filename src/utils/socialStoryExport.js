/**
 * Social Story & Poster Canvas Exporter
 * Generates ultra high-resolution (1080x1920 Story and 1080x1080 Square Post)
 * graphics of 5-star Google reviews for Instagram Stories, WhatsApp Status & Facebook.
 */
import QRCode from 'qrcode';

// Wrap text onto multiple lines with maximum width and line count
function wrapText(ctx, text, maxWidth) {
  const words = text.split(' ');
  const lines = [];
  let currentLine = '';

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const metrics = ctx.measureText(testLine);

    if (metrics.width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) {
    lines.push(currentLine);
  }
  return lines;
}

// Draw rounded rectangle
function roundRect(ctx, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r);
  ctx.lineTo(x + width, y + height - r);
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  ctx.lineTo(x + r, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

// Draw official Google G Logo SVG
async function drawGoogleGLogo(ctx, x, y, size) {
  const svgString = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="${size}" height="${size}">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
    </svg>
  `;
  const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const img = new Image();

  return new Promise((resolve) => {
    img.onload = () => {
      ctx.drawImage(img, x, y, size, size);
      URL.revokeObjectURL(url);
      resolve();
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve();
    };
    img.src = url;
  });
}

// Draw 5 glowing golden stars
function drawStars(ctx, startX, startY, count = 5, starSize = 36, gap = 12) {
  ctx.save();
  ctx.fillStyle = '#FBBC05';

  for (let i = 0; i < count; i++) {
    const cx = startX + i * (starSize + gap) + starSize / 2;
    const cy = startY + starSize / 2;
    const spikes = 5;
    const outerRadius = starSize / 2;
    const innerRadius = outerRadius * 0.42;

    ctx.beginPath();
    let rot = (Math.PI / 2) * 3;
    let x = cx;
    let y = cy;
    const step = Math.PI / spikes;

    ctx.moveTo(cx, cy - outerRadius);
    for (let s = 0; s < spikes; s++) {
      x = cx + Math.cos(rot) * outerRadius;
      y = cy + Math.sin(rot) * outerRadius;
      ctx.lineTo(x, y);
      rot += step;

      x = cx + Math.cos(rot) * innerRadius;
      y = cy + Math.sin(rot) * innerRadius;
      ctx.lineTo(x, y);
      rot += step;
    }
    ctx.lineTo(cx, cy - outerRadius);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

export const STORY_THEMES = [
  {
    id: 'dark_neon',
    name: 'Dark Luxe Neon',
    icon: '✨',
    bgType: 'gradient',
    bgColors: ['#090d16', '#131b2e', '#1f1338'],
    cardBg: 'rgba(255, 255, 255, 0.07)',
    cardBorder: 'rgba(255, 255, 255, 0.16)',
    textColor: '#ffffff',
    quoteColor: '#f1f5f9',
    mutedColor: '#94a3b8',
    accentColor: '#38bdf8',
    tagBg: 'rgba(56, 189, 248, 0.15)',
    tagText: '#38bdf8',
  },
  {
    id: 'clean_pearl',
    name: 'Clean Minimalist Pearl',
    icon: '🕊️',
    bgType: 'gradient',
    bgColors: ['#f8fafc', '#edf2f7', '#e2e8f0'],
    cardBg: '#ffffff',
    cardBorder: '#cbd5e1',
    textColor: '#0f172a',
    quoteColor: '#1e293b',
    mutedColor: '#64748b',
    accentColor: '#4f46e5',
    tagBg: '#eef2ff',
    tagText: '#4f46e5',
    cardShadow: true,
  },
  {
    id: 'festive_gold',
    name: 'Royal Gold & Emerald',
    icon: '🪔',
    bgType: 'gradient',
    bgColors: ['#062319', '#0d3b2c', '#1a2e1d'],
    cardBg: 'rgba(255, 255, 255, 0.08)',
    cardBorder: 'rgba(245, 158, 11, 0.35)',
    textColor: '#ffffff',
    quoteColor: '#fef3c7',
    mutedColor: '#a7f3d0',
    accentColor: '#fbbf24',
    tagBg: 'rgba(245, 158, 11, 0.2)',
    tagText: '#fde68a',
  },
  {
    id: 'sunset_glow',
    name: 'Sunset Glow Gradient',
    icon: '🌅',
    bgType: 'gradient',
    bgColors: ['#311042', '#581c87', '#be185d'],
    cardBg: 'rgba(255, 255, 255, 0.12)',
    cardBorder: 'rgba(255, 255, 255, 0.22)',
    textColor: '#ffffff',
    quoteColor: '#ffffff',
    mutedColor: '#fbcfe8',
    accentColor: '#f43f5e',
    tagBg: 'rgba(255, 255, 255, 0.2)',
    tagText: '#ffffff',
  },
];

/**
 * Render Review to Canvas
 * @param {HTMLCanvasElement} canvas
 * @param {Object} options
 */
export async function renderSocialStory(canvas, options = {}) {
  const {
    format = 'story', // 'story' (9:16: 1080x1920) or 'post' (1:1: 1080x1080)
    themeId = 'dark_neon',
    businessName = 'Our Business',
    customerName = 'Happy Customer',
    reviewText = 'Absolutely outstanding service! The team was super attentive, professional, and delivered beyond my expectations. 10/10 recommend!',
    serviceType = '5-Star Experience',
    dateText = 'Verified Google Review',
    showQr = true,
    qrUrl = 'https://reviewassist.ai',
    showGoogleBadge = true,
  } = options;

  const isStory = format === 'story';
  const width = 1080;
  const height = isStory ? 1920 : 1080;

  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  const theme = STORY_THEMES.find((t) => t.id === themeId) || STORY_THEMES[0];

  // 1. Background Fill
  const bgGrad = ctx.createLinearGradient(0, 0, width, height);
  bgGrad.addColorStop(0, theme.bgColors[0]);
  bgGrad.addColorStop(0.5, theme.bgColors[1]);
  bgGrad.addColorStop(1, theme.bgColors[2]);
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // Background ambient circles
  ctx.save();
  ctx.globalAlpha = 0.15;
  ctx.fillStyle = theme.accentColor;
  ctx.beginPath();
  ctx.arc(width * 0.85, height * 0.15, isStory ? 350 : 250, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#f59e0b';
  ctx.beginPath();
  ctx.arc(width * 0.15, height * 0.85, isStory ? 300 : 200, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // 2. Header Area
  const headerTop = isStory ? 130 : 90;

  // Business Name
  ctx.font = 'bold 46px Inter, system-ui, -apple-system, sans-serif';
  ctx.fillStyle = theme.textColor;
  ctx.textAlign = 'center';
  ctx.fillText(businessName, width / 2, headerTop);

  // Google Verified Pill
  if (showGoogleBadge) {
    const pillY = headerTop + 36;
    const pillWidth = 320;
    const pillHeight = 44;
    const pillX = (width - pillWidth) / 2;

    ctx.fillStyle = theme.tagBg;
    roundRect(ctx, pillX, pillY, pillWidth, pillHeight, 22);
    ctx.fill();

    // Draw Google 'G' icon inside pill
    await drawGoogleGLogo(ctx, pillX + 16, pillY + 10, 24);

    ctx.font = '600 21px Inter, system-ui, sans-serif';
    ctx.fillStyle = theme.tagText;
    ctx.textAlign = 'left';
    ctx.fillText('Verified Google Review', pillX + 50, pillY + 30);
  }

  // 3. Central Review Card
  const cardMargin = 70;
  const cardWidth = width - cardMargin * 2;
  const cardY = isStory ? headerTop + 140 : headerTop + 110;
  const cardHeight = isStory ? 940 : 540;

  ctx.save();
  if (theme.cardShadow) {
    ctx.shadowColor = 'rgba(0, 0, 0, 0.12)';
    ctx.shadowBlur = 30;
    ctx.shadowOffsetY = 15;
  }
  ctx.fillStyle = theme.cardBg;
  roundRect(ctx, cardMargin, cardY, cardWidth, cardHeight, 28);
  ctx.fill();

  ctx.strokeStyle = theme.cardBorder;
  ctx.lineWidth = 2;
  roundRect(ctx, cardMargin, cardY, cardWidth, cardHeight, 28);
  ctx.stroke();
  ctx.restore();

  // Inside Card: 5 Golden Stars
  const starsY = cardY + (isStory ? 60 : 45);
  const starSize = isStory ? 44 : 36;
  const starGap = isStory ? 14 : 10;
  const totalStarsWidth = 5 * starSize + 4 * starGap;
  const starsStartX = (width - totalStarsWidth) / 2;
  drawStars(ctx, starsStartX, starsY, 5, starSize, starGap);

  // Big Decorative Quotation Mark
  ctx.save();
  ctx.font = `bold ${isStory ? '140px' : '90px'} Georgia, serif`;
  ctx.fillStyle = theme.accentColor;
  ctx.globalAlpha = 0.35;
  ctx.textAlign = 'center';
  ctx.fillText('“', width / 2, starsY + (isStory ? 120 : 80));
  ctx.restore();

  // Review Text Lines
  const quoteFontSize = isStory ? 38 : 31;
  ctx.font = `italic 500 ${quoteFontSize}px Inter, system-ui, sans-serif`;
  ctx.fillStyle = theme.quoteColor;
  ctx.textAlign = 'center';

  const maxQuoteWidth = cardWidth - (isStory ? 120 : 80);
  const cleanQuote = `"${reviewText.trim().replace(/^["']|["']$/g, '')}"`;
  const quoteLines = wrapText(ctx, cleanQuote, maxQuoteWidth);

  // Limit lines to fit card comfortably
  const maxLines = isStory ? 9 : 5;
  const visibleLines = quoteLines.slice(0, maxLines);
  if (quoteLines.length > maxLines) {
    visibleLines[maxLines - 1] = visibleLines[maxLines - 1] + '...';
  }

  const lineHeight = quoteFontSize * 1.5;
  const textBlockHeight = visibleLines.length * lineHeight;
  const textStartY = starsY + (isStory ? 180 : 120) + (isStory ? (420 - textBlockHeight) / 2 : (240 - textBlockHeight) / 2);

  visibleLines.forEach((line, idx) => {
    ctx.fillText(line, width / 2, textStartY + idx * lineHeight);
  });

  // Divider Line inside card
  const dividerY = cardY + cardHeight - (isStory ? 130 : 95);
  ctx.strokeStyle = theme.cardBorder;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cardMargin + 60, dividerY);
  ctx.lineTo(cardMargin + cardWidth - 60, dividerY);
  ctx.stroke();

  // Author Info & Service Badge
  const authorY = dividerY + (isStory ? 55 : 42);
  ctx.font = 'bold 30px Inter, system-ui, sans-serif';
  ctx.fillStyle = theme.textColor;
  ctx.textAlign = 'center';
  ctx.fillText(customerName, width / 2, authorY);

  if (serviceType) {
    ctx.font = '500 22px Inter, system-ui, sans-serif';
    ctx.fillStyle = theme.mutedColor;
    ctx.fillText(`${serviceType} • ${dateText}`, width / 2, authorY + (isStory ? 36 : 28));
  }

  // 4. Bottom Footer Area (QR Code & Review Call-to-Action)
  if (isStory) {
    const footerY = cardY + cardHeight + 50;

    if (showQr && qrUrl) {
      try {
        const qrDataUrl = await QRCode.toDataURL(qrUrl, {
          width: 200,
          margin: 1,
          color: {
            dark: '#000000',
            light: '#ffffff',
          },
        });

        const qrImg = new Image();
        await new Promise((res) => {
          qrImg.onload = res;
          qrImg.onerror = res;
          qrImg.src = qrDataUrl;
        });

        const qrSize = 150;
        const qrX = width / 2 - qrSize / 2;
        const qrBoxY = footerY + 10;

        // White background tile for QR code
        ctx.fillStyle = '#ffffff';
        roundRect(ctx, qrX - 10, qrBoxY - 10, qrSize + 20, qrSize + 20, 16);
        ctx.fill();

        ctx.drawImage(qrImg, qrX, qrBoxY, qrSize, qrSize);

        // QR instruction label
        ctx.font = 'bold 24px Inter, system-ui, sans-serif';
        ctx.fillStyle = theme.textColor;
        ctx.textAlign = 'center';
        ctx.fillText('Scan to experience & review us on Google', width / 2, qrBoxY + qrSize + 48);

        ctx.font = '500 19px Inter, system-ui, sans-serif';
        ctx.fillStyle = theme.mutedColor;
        ctx.fillText('⭐ Rated 4.9+ Stars by Verified Local Patrons', width / 2, qrBoxY + qrSize + 78);
      } catch (qrErr) {
        console.warn('QR render notice:', qrErr);
      }
    } else {
      // Text-only footer callout
      ctx.font = 'bold 32px Inter, system-ui, sans-serif';
      ctx.fillStyle = theme.textColor;
      ctx.textAlign = 'center';
      ctx.fillText('Visit us today & share your experience!', width / 2, footerY + 80);

      ctx.font = '500 22px Inter, system-ui, sans-serif';
      ctx.fillStyle = theme.mutedColor;
      ctx.fillText('Find us on Google Maps • Real Reviews from Real Customers', width / 2, footerY + 120);
    }

    // Micro branding watermark
    ctx.font = '500 17px Inter, system-ui, sans-serif';
    ctx.fillStyle = theme.mutedColor;
    ctx.textAlign = 'center';
    ctx.fillText('Powered by ReviewAssist SaaS', width / 2, height - 40);
  } else {
    // Square post footer: compact
    ctx.font = '500 20px Inter, system-ui, sans-serif';
    ctx.fillStyle = theme.mutedColor;
    ctx.textAlign = 'center';
    ctx.fillText('⭐ Rated 4.9+ on Google Maps • Real Local Reviews', width / 2, height - 45);
  }
}

/**
 * Trigger immediate PNG download
 */
export function downloadCanvasImage(canvas, filename = 'Google-Review-Story.png') {
  const link = document.createElement('a');
  link.download = filename;
  link.href = canvas.toDataURL('image/png', 1.0);
  link.click();
}

/**
 * Copy Canvas Image to Clipboard (async)
 */
export async function copyCanvasToClipboard(canvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(async (blob) => {
      if (!blob) {
        reject(new Error('Canvas toBlob failed'));
        return;
      }
      try {
        if (navigator.clipboard && window.ClipboardItem) {
          const item = new ClipboardItem({ 'image/png': blob });
          await navigator.clipboard.write([item]);
          resolve(true);
        } else {
          reject(new Error('ClipboardItem API not supported in this browser'));
        }
      } catch (err) {
        reject(err);
      }
    }, 'image/png');
  });
}
