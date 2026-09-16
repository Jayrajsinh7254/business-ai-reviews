import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';

/**
 * QRCodeDisplay Component
 * Generates an SVG or Canvas QR code for a given URL, with copy and download actions.
 */
export default function QRCodeDisplay({ url, title = 'Scan to Review', subtitle = 'Point camera here to open review page' }) {
  const canvasRef = useRef(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (canvasRef.current && url) {
      QRCode.toCanvas(
        canvasRef.current,
        url,
        {
          width: 220,
          margin: 2,
          color: {
            dark: '#0f172a',
            light: '#ffffff',
          },
        },
        (error) => {
          if (error) console.error('Error generating QR code:', error);
        }
      );
    }
  }, [url]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.warn('Failed to copy via clipboard API', err);
    }
  };

  const handleDownload = () => {
    if (!canvasRef.current) return;
    const pngUrl = canvasRef.current.toDataURL('image/png');
    const downloadLink = document.createElement('a');
    downloadLink.href = pngUrl;
    downloadLink.download = `review-assist-qr-${Date.now()}.png`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };

  return (
    <div className="qr-display-card">
      <div className="qr-header">
        <h3 className="qr-title">{title}</h3>
        <p className="qr-subtitle">{subtitle}</p>
      </div>

      <div className="qr-canvas-frame">
        <canvas ref={canvasRef} className="qr-canvas" />
      </div>

      <div className="qr-link-box">
        <input
          type="text"
          readOnly
          value={url}
          className="qr-link-input"
          onClick={(e) => e.target.select()}
        />
        <button
          type="button"
          onClick={handleCopy}
          className={`qr-copy-btn ${copied ? 'copied' : ''}`}
        >
          {copied ? '✓ Copied!' : 'Copy Link'}
        </button>
      </div>

      <div className="qr-actions">
        <button type="button" onClick={handleDownload} className="btn-secondary-sm">
          ⬇ Download QR Image
        </button>
      </div>
    </div>
  );
}
