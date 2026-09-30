import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';

/**
 * QRCodeDisplay Component
 * Generates an interactive, responsive Canvas QR code with copy & download actions.
 */
export default function QRCodeDisplay({
  url,
  title = 'Your Business QR Code',
  subtitle = 'Customers scan this on counter stands or table cards',
}) {
  const canvasRef = useRef(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (canvasRef.current && url) {
      QRCode.toCanvas(
        canvasRef.current,
        url,
        {
          width: 240,
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
    downloadLink.download = `review-qr-${Date.now()}.png`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };

  return (
    <div className="qr-display-card">
      <div className="qr-card-header text-center">
        <h3 className="qr-title">{title}</h3>
        <p className="qr-subtitle">{subtitle}</p>
      </div>

      <div className="qr-canvas-wrapper">
        <div className="qr-canvas-frame">
          <canvas ref={canvasRef} className="qr-canvas" />
        </div>
      </div>

      <div className="qr-url-copy-box">
        <input
          type="text"
          readOnly
          value={url}
          className="qr-link-input"
          onClick={(e) => e.target.select()}
          title="Click to select review URL"
        />
        <button
          type="button"
          onClick={handleCopy}
          className={`qr-copy-btn ${copied ? 'copied' : ''}`}
        >
          {copied ? '✓ Copied' : 'Copy Link'}
        </button>
      </div>

      <div className="qr-download-action-row">
        <button
          type="button"
          onClick={handleDownload}
          className="btn-primary btn-block btn-download-qr"
          title="Download standalone high-resolution QR code image"
        >
          <span>📱</span> Download Only QR Code (PNG)
        </button>
      </div>
    </div>
  );
}
