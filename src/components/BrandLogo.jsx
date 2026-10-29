import React from 'react';
import logoUrl from '../assets/reviewassist-logo.png';

export default function BrandLogo({ className = '', alt = 'ReviewAssist AI-Powered Google Reviews Copilot' }) {
  return <img className={`brand-logo-image ${className}`.trim()} src={logoUrl} alt={alt} />;
}
