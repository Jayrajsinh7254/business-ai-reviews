/**
 * Standee High-Resolution Canvas Exporter & Print Engine
 * Exports 300-DPI print-ready standees with official Google styling,
 * mathematically centered elements, dynamic vertical distribution,
 * 30-second AI review flow, and ReviewAssist branding.
 */

// Draw a rounded rectangle on Canvas 2D
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

/**
 * Draw official Google G Logo SVG directly to an Image and paint to Canvas
 */
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

/**
 * Draw 5 Golden Rating Stars on Canvas
 */
function drawGoldenStars(ctx, startX, startY, count = 5, starSize = 28, gap = 8) {
  ctx.save();
  ctx.fillStyle = '#FBBC05';

  for (let s = 0; s < count; s++) {
    const cx = startX + s * (starSize + gap) + starSize / 2;
    const cy = startY + starSize / 2;
    const spikes = 5;
    const outerRadius = starSize / 2;
    const innerRadius = outerRadius / 2.3;

    let rot = (Math.PI / 2) * 3;
    let x = cx;
    let y = cy;
    const step = Math.PI / spikes;

    ctx.beginPath();
    ctx.moveTo(cx, cy - outerRadius);
    for (let i = 0; i < spikes; i++) {
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

/**
 * Load Image Helper from Data URL or regular URL
 */
function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
    img.src = src;
  });
}

/**
 * Export High-Resolution 300-DPI Standee Image
 * Supported formats: 'portrait' (5x7"), 'table_tent' (4x6"), 'poster' (A4), 'sticker' (4x4" square)
 */
export async function exportHighResStandee({
  business,
  reviewUrl,
  qrDataUrl,
  theme = 'google',
  showBackdrop = true,
  headline = 'Review us on Google',
  tagline = 'Scan the above QR code with your smartphone and make our day by leaving us a review on Google!',
  show30sFlow = true,
  format = 'portrait', // 'portrait' | 'table_tent' | 'poster' | 'sticker'
}) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  // 1. Precise dimensions at 300 DPI per format
  let width = 1500;
  let height = 2100;

  if (format === 'table_tent') {
    // 4x6" table tent (2:3)
    width = 1400;
    height = 2100;
  } else if (format === 'poster') {
    // A4 Wall Poster (1:1.414)
    width = 1754;
    height = 2480;
  } else if (format === 'sticker') {
    // 4x4" Square Decal (1:1)
    width = 1500;
    height = 1500;
  } else {
    // Default 'portrait' 5x7" counter standee (5:7 ratio)
    width = 1500;
    height = 2100;
  }

  canvas.width = width;
  canvas.height = height;

  // 2. Draw Outer Multi-color Google Backdrop
  if (showBackdrop && theme === 'google') {
    // Fill base with Google Blue
    ctx.fillStyle = '#4285F4';
    ctx.fillRect(0, 0, width, height);

    // Diagonal Green block (Right side)
    ctx.fillStyle = '#34A853';
    ctx.beginPath();
    ctx.moveTo(width * 0.42, 0);
    ctx.lineTo(width, 0);
    ctx.lineTo(width, height * 0.62);
    ctx.closePath();
    ctx.fill();

    // Diagonal Yellow block (Bottom right)
    ctx.fillStyle = '#FBBC05';
    ctx.beginPath();
    ctx.moveTo(width, height * 0.48);
    ctx.lineTo(width, height);
    ctx.lineTo(width * 0.48, height);
    ctx.closePath();
    ctx.fill();

    // Diagonal Red block (Bottom left)
    ctx.fillStyle = '#EA4335';
    ctx.beginPath();
    ctx.moveTo(0, height * 0.44);
    ctx.lineTo(width * 0.54, height);
    ctx.lineTo(0, height);
    ctx.closePath();
    ctx.fill();
  } else if (theme === 'midnight') {
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, width, height);
  } else {
    ctx.fillStyle = '#f1f5f9';
    ctx.fillRect(0, 0, width, height);
  }

  // 3. Draw Inner Standee Plaque Card
  const cardMarginX = showBackdrop ? Math.round(width * 0.075) : Math.round(width * 0.038);
  const cardMarginY = showBackdrop ? Math.round(height * 0.055) : Math.round(height * 0.032);
  const cardW = width - cardMarginX * 2;
  const cardH = height - cardMarginY * 2;
  const cardRadius = Math.round(cardW * 0.032);

  // Drop shadow for acrylic card
  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.25)';
  ctx.shadowBlur = 40;
  ctx.shadowOffsetY = 20;
  ctx.fillStyle = theme === 'midnight' ? '#1e293b' : '#ffffff';
  roundRect(ctx, cardMarginX, cardMarginY, cardW, cardH, cardRadius);
  ctx.fill();
  ctx.restore();

  // Subtle plaque border
  ctx.strokeStyle = theme === 'midnight' ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.06)';
  ctx.lineWidth = 3;
  roundRect(ctx, cardMarginX, cardMarginY, cardW, cardH, cardRadius);
  ctx.stroke();

  // 4. Mathematical Vertical Distribution (Proportional to height, NO empty voids!)
  const topPad = Math.round(cardH * 0.045);
  const bottomPad = Math.round(cardH * 0.04);
  const usableH = cardH - topPad - bottomPad;

  // Determine if 30s flow banner fits in this format
  const canShowFlow = show30sFlow && format !== 'sticker';

  // Dynamic element sizing based on card dimensions and whether flow is enabled
  const pillH = Math.round(cardH * 0.030);
  const gSize = Math.round(cardW * (canShowFlow ? 0.092 : 0.102));
  const headerH = gSize;
  const promptH = Math.round(cardH * (canShowFlow ? 0.026 : 0.032));
  const flowH = canShowFlow ? Math.round(cardH * 0.082) : 0;
  const taglineH = Math.round(cardH * (canShowFlow ? 0.045 : 0.058));
  const footerH = Math.round(cardH * 0.040);

  // QR Frame size: expands to fill space gracefully when 30s flow is off!
  let qrFrameSize;
  if (format === 'sticker') {
    qrFrameSize = Math.round(cardW * 0.62);
  } else if (canShowFlow) {
    qrFrameSize = Math.min(Math.round(cardW * 0.52), Math.round(cardH * 0.30));
  } else {
    // When 30s flow is turned off, make QR frame prominent and bold so it naturally commands the visual center
    qrFrameSize = Math.min(Math.round(cardW * 0.62), Math.round(cardH * 0.38));
  }

  // Calculate gaps dynamically
  const totalContentH = pillH + headerH + qrFrameSize + promptH + flowH + taglineH + footerH;
  const numGaps = canShowFlow ? 7 : 6;
  const gap = Math.max(16, (usableH - totalContentH) / numGaps);

  // Progressive dynamic Y positions
  let currentY = cardMarginY + topPad + gap * 0.35;

  const pillY = currentY;
  currentY += pillH + gap;

  const headerY = currentY;
  currentY += headerH + gap;

  const qrFrameY = currentY;
  currentY += qrFrameSize + Math.round(gap * 0.55);

  const promptY = currentY;
  currentY += promptH + gap;

  let flowY = 0;
  if (canShowFlow) {
    flowY = currentY;
    currentY += flowH + gap;
  }

  const taglineY = currentY;
  const footerY = cardMarginY + cardH - bottomPad - footerH * 0.45;

  // ─────────────────────────────────────────────────────────────
  // 5. RENDER: Top Business Name Pill (Centered)
  // ─────────────────────────────────────────────────────────────
  const bizName = business?.name || 'Local Business';
  const bizPillText = `🏪 ${bizName}`;
  const pillFontSize = Math.round(cardW * 0.02);

  ctx.save();
  ctx.font = `bold ${pillFontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
  const bizTextW = ctx.measureText(bizPillText).width;
  const pillW = Math.min(cardW * 0.78, bizTextW + 54);
  const pillX = width / 2 - pillW / 2;

  ctx.fillStyle = theme === 'midnight' ? '#334155' : '#f1f5f9';
  ctx.strokeStyle = theme === 'midnight' ? 'rgba(255,255,255,0.1)' : '#e2e8f0';
  ctx.lineWidth = 1.5;
  roundRect(ctx, pillX, pillY, pillW, pillH, pillH / 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = theme === 'midnight' ? '#f8fafc' : '#0f172a';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(bizPillText, width / 2, pillY + pillH / 2);
  ctx.restore();

  // ─────────────────────────────────────────────────────────────
  // 6. RENDER: Google Header Band (100% Mathematically Centered!)
  // ─────────────────────────────────────────────────────────────
  const line1Font = `bold ${Math.round(cardW * 0.038)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
  const line2Font = `900 ${Math.round(cardW * 0.044)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;

  ctx.save();
  ctx.font = line1Font;
  const line1W = ctx.measureText('Review us').width;
  ctx.font = line2Font;
  const line2W = ctx.measureText('on Google').width;
  ctx.restore();

  const starSize = Math.round(cardW * 0.024); // ~32px
  const starGap = Math.round(starSize * 0.22); // ~7px
  const starsTotalW = 5 * starSize + 4 * starGap;

  const headerTextW = Math.max(line1W, line2W, starsTotalW);
  const headerGapX = Math.round(cardW * 0.025); // ~30px gap between logo and text
  const totalHeaderW = gSize + headerGapX + headerTextW;

  // Exact horizontal centering:
  const headerStartX = width / 2 - totalHeaderW / 2;
  const gLogoX = headerStartX;
  const textX = headerStartX + gSize + headerGapX;

  // Draw Google G Logo
  await drawGoogleGLogo(ctx, gLogoX, headerY, gSize);

  // Draw Header Text Block (aligned with logo)
  ctx.save();
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = theme === 'midnight' ? '#ffffff' : '#111827';

  // Line 1: "Review us"
  ctx.font = line1Font;
  ctx.fillText('Review us', textX, headerY + gSize * 0.24);

  // Line 2: "on Google"
  ctx.font = line2Font;
  ctx.fillText('on Google', textX, headerY + gSize * 0.60);

  // 5 Golden Stars
  drawGoldenStars(ctx, textX, headerY + gSize * 0.78, 5, starSize, starGap);
  ctx.restore();

  // ─────────────────────────────────────────────────────────────
  // 7. RENDER: Center Framed QR Code (Centered)
  // ─────────────────────────────────────────────────────────────
  const qrFrameX = width / 2 - qrFrameSize / 2;
  const qrRadius = Math.round(qrFrameSize * 0.065);

  ctx.save();
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = theme === 'midnight' ? '#38bdf8' : '#111827';
  ctx.lineWidth = Math.round(cardW * 0.0035) + 2;
  roundRect(ctx, qrFrameX, qrFrameY, qrFrameSize, qrFrameSize, qrRadius);
  ctx.fill();
  ctx.stroke();

  // Draw QR Image inside frame
  if (qrDataUrl) {
    try {
      const qrImg = await loadImage(qrDataUrl);
      const qrPadding = Math.round(qrFrameSize * 0.065);
      ctx.drawImage(
        qrImg,
        qrFrameX + qrPadding,
        qrFrameY + qrPadding,
        qrFrameSize - qrPadding * 2,
        qrFrameSize - qrPadding * 2
      );
    } catch (e) {
      console.warn('Could not draw QR code image to canvas:', e);
    }
  }
  ctx.restore();

  // ─────────────────────────────────────────────────────────────
  // 8. RENDER: Scan Prompt Chip ("Point camera to review")
  // ─────────────────────────────────────────────────────────────
  const promptText = '📱 Point phone camera to review';
  const promptFontSize = Math.round(cardW * 0.018);

  ctx.save();
  ctx.font = `bold ${promptFontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
  const promptTextW = ctx.measureText(promptText).width;
  const promptW = Math.min(cardW * 0.65, promptTextW + 48);
  const promptX = width / 2 - promptW / 2;

  ctx.fillStyle = theme === 'midnight' ? '#1e293b' : '#f8fafc';
  ctx.strokeStyle = theme === 'midnight' ? '#334155' : '#e2e8f0';
  ctx.lineWidth = 1.5;
  roundRect(ctx, promptX, promptY, promptW, promptH, promptH / 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = theme === 'midnight' ? '#cbd5e1' : '#334155';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(promptText, width / 2, promptY + promptH / 2);
  ctx.restore();

  // ─────────────────────────────────────────────────────────────
  // 9. RENDER: 30-Second AI Flow Step Banner (if enabled)
  // ─────────────────────────────────────────────────────────────
  if (canShowFlow) {
    const flowBoxW = Math.round(cardW * 0.88);
    const flowBoxX = width / 2 - flowBoxW / 2;
    const flowRadius = 18;

    ctx.save();
    const flowGrad = ctx.createLinearGradient(flowBoxX, flowY, flowBoxX + flowBoxW, flowY + flowH);
    if (theme === 'midnight') {
      flowGrad.addColorStop(0, '#1e293b');
      flowGrad.addColorStop(1, '#0f172a');
      ctx.strokeStyle = '#38bdf8';
    } else {
      flowGrad.addColorStop(0, '#f0fdf4');
      flowGrad.addColorStop(1, '#ecfeff');
      ctx.strokeStyle = '#86efac';
    }
    ctx.fillStyle = flowGrad;
    ctx.lineWidth = 2;
    roundRect(ctx, flowBoxX, flowY, flowBoxW, flowH, flowRadius);
    ctx.fill();
    ctx.stroke();

    // Flow Header
    ctx.fillStyle = theme === 'midnight' ? '#38bdf8' : '#166534';
    ctx.font = `bold ${Math.round(flowH * 0.18)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('⚡ Fast 30-Second Review (Powered by AI)', width / 2, flowY + flowH * 0.28);

    // Flow 3 Steps row
    ctx.fillStyle = theme === 'midnight' ? '#f8fafc' : '#0f172a';
    ctx.font = `600 ${Math.round(flowH * 0.15)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
    ctx.fillText('1️⃣ Scan QR   ➔   2️⃣ Pick 1-Tap Experience   ➔   3️⃣ AI Drafts 5★ Review!', width / 2, flowY + flowH * 0.58);

    // Helper text
    ctx.fillStyle = theme === 'midnight' ? '#94a3b8' : '#64748b';
    ctx.font = `italic ${Math.round(flowH * 0.125)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
    ctx.fillText('No typing needed • Customers love this quick experience', width / 2, flowY + flowH * 0.82);
    ctx.restore();
  }

  // ─────────────────────────────────────────────────────────────
  // 10. RENDER: Callout Tagline
  // ─────────────────────────────────────────────────────────────
  ctx.save();
  ctx.fillStyle = theme === 'midnight' ? '#94a3b8' : '#475569';
  const taglineFontSize = Math.round(cardW * 0.0185);
  ctx.font = `500 ${taglineFontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const maxChars = format === 'table_tent' ? 44 : 52;
  if (tagline.length > maxChars) {
    const mid = tagline.lastIndexOf(' ', maxChars);
    const line1 = tagline.substring(0, mid > 0 ? mid : maxChars);
    const line2 = tagline.substring(mid > 0 ? mid + 1 : maxChars);
    ctx.fillText(line1, width / 2, taglineY + 8);
    ctx.fillText(line2, width / 2, taglineY + Math.round(taglineFontSize * 1.4) + 8);
  } else {
    ctx.fillText(tagline, width / 2, taglineY + taglineH / 2);
  }
  ctx.restore();

  // ─────────────────────────────────────────────────────────────
  // 11. RENDER: Footer: Review URL & ReviewAssist AI Branding
  // ─────────────────────────────────────────────────────────────
  const displayUrl = business?.website || reviewUrl?.replace(/^https?:\/\//, '') || 'www.reviewassist.ai';

  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  ctx.fillStyle = theme === 'midnight' ? '#38bdf8' : '#0284c7';
  ctx.font = `bold ${Math.round(cardW * 0.0175)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
  ctx.fillText(displayUrl, width / 2, footerY - Math.round(footerH * 0.28));

  ctx.fillStyle = theme === 'midnight' ? '#64748b' : '#94a3b8';
  ctx.font = `600 ${Math.round(cardW * 0.0145)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
  ctx.fillText('⚡ Powered by ReviewAssist AI', width / 2, footerY + Math.round(footerH * 0.22));
  ctx.restore();

  // ─────────────────────────────────────────────────────────────
  // 12. Trigger Instant Download
  // ─────────────────────────────────────────────────────────────
  const safeName = (bizName || 'google-standee').toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
  const link = document.createElement('a');
  link.download = `${safeName}-${format}-standee-300dpi.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
}
