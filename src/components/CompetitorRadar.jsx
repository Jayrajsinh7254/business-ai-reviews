import React, { useState, useMemo } from 'react';
import {
  getCompetitorsForCategory,
  generateCounterCampaigns,
  deconstructCompetitorReview,
} from '../utils/competitorRadarEngine';

export default function CompetitorRadar({ business, currentPlan, onUpgradeClick }) {
  const bizName = business?.name || 'Your Business';
  const bizCategory = business?.category || 'salon';

  // Load category competitors
  const initialCompetitors = useMemo(() => {
    return getCompetitorsForCategory(bizCategory);
  }, [bizCategory]);

  const [competitorsList, setCompetitorsList] = useState(initialCompetitors);
  const [selectedCompId, setSelectedCompId] = useState(initialCompetitors[0]?.id || 'comp-1');
  const [copiedId, setCopiedId] = useState(null);

  // New Competitor Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCompName, setNewCompName] = useState('');
  const [newCompAddress, setNewCompAddress] = useState('');
  const [newCompRating, setNewCompRating] = useState('4.0');
  const [newCompReviewsText, setNewCompReviewsText] = useState('');

  // Live Review Deconstructor State
  const [sampleReviewInput, setSampleReviewInput] = useState(
    'Waited for 45 minutes even with an appointment. Staff was completely unbothered and when I finally went to pay, the final bill had 2 extra surprise charges that were never mentioned beforehand. Would not recommend!'
  );
  const [deconstructedResult, setDeconstructedResult] = useState(() =>
    deconstructCompetitorReview(sampleReviewInput, bizName)
  );
  const [isDeconstructing, setIsDeconstructing] = useState(false);

  // Active Competitor Object
  const activeCompetitor = useMemo(() => {
    return competitorsList.find((c) => c.id === selectedCompId) || competitorsList[0];
  }, [competitorsList, selectedCompId]);

  // Generate campaigns for active competitor's top weakness
  const topWeakness = activeCompetitor?.topWeaknesses?.[0];
  const counterCampaigns = useMemo(() => {
    if (!activeCompetitor || !topWeakness) return [];
    return generateCounterCampaigns(bizName, activeCompetitor, topWeakness);
  }, [bizName, activeCompetitor, topWeakness]);

  const handleCopy = (id, text) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleDeconstruct = () => {
    if (!sampleReviewInput.trim()) return;
    setIsDeconstructing(true);
    setTimeout(() => {
      const res = deconstructCompetitorReview(sampleReviewInput, bizName);
      setDeconstructedResult(res);
      setIsDeconstructing(false);
    }, 400);
  };

  const handleAddCustomCompetitor = (e) => {
    e.preventDefault();
    if (!newCompName.trim()) return;

    const customId = `custom-comp-${Date.now()}`;
    const deconstructed = deconstructCompetitorReview(newCompReviewsText, bizName);

    const newComp = {
      id: customId,
      name: newCompName.trim(),
      rating: parseFloat(newCompRating) || 4.0,
      reviewCount: Math.floor(Math.random() * 200) + 120,
      distance: 'Local Area',
      address: newCompAddress.trim() || 'Neighborhood',
      topWeaknesses: [
        {
          aspect: deconstructed?.rootCause || 'Customer Experience & Reliability',
          severity: 'High',
          score: 42,
          complaintsCount: 16,
          summary: deconstructed?.strategicSummary || 'Recurring customer dissatisfaction with service consistency.',
          sampleQuote: newCompReviewsText ? `"${newCompReviewsText.substring(0, 140)}..."` : '"Service did not meet expectations."',
        },
      ],
      topStrengths: ['Established local presence', 'Good neighborhood visibility'],
      sentimentBreakdown: {
        quality: 68,
        speedOfService: 45,
        valueForMoney: 49,
        hospitality: 52,
        hygiene: 60,
      },
    };

    setCompetitorsList((prev) => [newComp, ...prev]);
    setSelectedCompId(customId);
    setShowAddModal(false);
    setNewCompName('');
    setNewCompAddress('');
    setNewCompReviewsText('');
  };

  return (
    <div className="competitor-radar-wrapper animate-fade-in">
      {/* 1. Radar Hero Header */}
      <div className="radar-hero-banner">
        <div className="radar-glow-bg" />
        <div className="radar-header-content">
          <div className="radar-badge-pill">
            <span className="radar-pulse-dot" />
            <span>AI Competitive Intelligence Radar</span>
            <span className="radar-pro-tag">PRO &amp; ENTERPRISE</span>
          </div>

          <h2 className="radar-title">
            Competitor Sentiment Spy &amp; <span className="gradient-text">Counter-Strike Studio</span>
          </h2>
          <p className="radar-subtitle">
            Track nearby rivals, expose what their customers complain about most, and launch ready-to-run marketing campaigns that win them over to <strong>{bizName}</strong>.
          </p>

          <div className="radar-kpi-row">
            <div className="radar-kpi-card">
              <span className="radar-kpi-icon">🎯</span>
              <div>
                <strong className="radar-kpi-val">+18% Advantage</strong>
                <span className="radar-kpi-lbl">Your Sentiment Lead</span>
              </div>
            </div>
            <div className="radar-kpi-card">
              <span className="radar-kpi-icon">🚨</span>
              <div>
                <strong className="radar-kpi-val">{topWeakness?.aspect || 'Operational Delays'}</strong>
                <span className="radar-kpi-lbl">Competitor Primary Flaw</span>
              </div>
            </div>
            <div className="radar-kpi-card">
              <span className="radar-kpi-icon">⚡</span>
              <div>
                <strong className="radar-kpi-val">3 Ready Campaigns</strong>
                <span className="radar-kpi-lbl">Instant Counter-Punches</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Competitor Tracker Switcher Bar */}
      <div className="radar-selector-bar">
        <div className="radar-selector-label">
          <span className="selector-icon">📡</span>
          <span>TRACKING LOCAL RIVALS:</span>
        </div>

        <div className="radar-selector-pills">
          {competitorsList.map((comp) => {
            const isSelected = comp.id === selectedCompId;
            return (
              <button
                key={comp.id}
                type="button"
                className={`radar-comp-pill ${isSelected ? 'active' : ''}`}
                onClick={() => setSelectedCompId(comp.id)}
              >
                <span className="pill-dot" />
                <span className="pill-name">{comp.name}</span>
                <span className="pill-rating">★ {comp.rating}</span>
              </button>
            );
          })}

          <button
            type="button"
            className="radar-comp-add-btn"
            onClick={() => setShowAddModal(true)}
          >
            + Add Competitor
          </button>
        </div>
      </div>

      {/* 3. Main 2-Column Grid: Head-to-Head & Vulnerability Heatmap */}
      <div className="radar-grid-layout">
        {/* Column A: Head-to-Head Matchup Scorecard */}
        <div className="card radar-scorecard-card">
          <div className="radar-card-header">
            <div className="radar-title-with-badge">
              <span className="radar-card-icon">⚔️</span>
              <div>
                <h3 className="radar-card-title">Head-to-Head Benchmark</h3>
                <p className="radar-card-sub">Your reputation metrics vs {activeCompetitor?.name}</p>
              </div>
            </div>
            <span className="radar-status-badge win">🏆 {bizName} Leading</span>
          </div>

          <div className="matchup-versus-display">
            {/* Left: Your Business */}
            <div className="matchup-team you">
              <span className="team-tag">YOU (WINNING)</span>
              <h4 className="team-name">{bizName}</h4>
              <div className="team-rating">
                <span className="star-gold">★</span>
                <span className="score-num">4.9</span>
                <span className="score-scale">/ 5.0</span>
              </div>
              <span className="team-metric">98% Positive Feedback</span>
            </div>

            <div className="versus-badge-circle">VS</div>

            {/* Right: Competitor */}
            <div className="matchup-team rival">
              <span className="team-tag rival-tag">RIVAL</span>
              <h4 className="team-name">{activeCompetitor?.name}</h4>
              <div className="team-rating rival-rating">
                <span className="star-muted">★</span>
                <span className="score-num">{activeCompetitor?.rating}</span>
                <span className="score-scale">/ 5.0</span>
              </div>
              <span className="team-metric text-muted">{activeCompetitor?.reviewCount} Google Reviews</span>
            </div>
          </div>

          {/* 5-Pillar Sentiment Radar Breakdown */}
          <div className="radar-pillars-box">
            <h4 className="pillars-title">5-Pillar Customer Sentiment Comparison</h4>

            <div className="sentiment-pillar-row">
              <div className="pillar-info">
                <span>Speed of Service &amp; Punctuality</span>
                <strong>{bizName} (94%) vs Rival ({activeCompetitor?.sentimentBreakdown?.speedOfService || 45}%)</strong>
              </div>
              <div className="pillar-bar-track">
                <div className="pillar-fill you-fill" style={{ width: '94%' }} />
                <div
                  className="pillar-fill rival-fill"
                  style={{ width: `${activeCompetitor?.sentimentBreakdown?.speedOfService || 45}%` }}
                />
              </div>
            </div>

            <div className="sentiment-pillar-row">
              <div className="pillar-info">
                <span>Pricing Honesty &amp; Transparency</span>
                <strong>{bizName} (96%) vs Rival ({activeCompetitor?.sentimentBreakdown?.valueForMoney || 48}%)</strong>
              </div>
              <div className="pillar-bar-track">
                <div className="pillar-fill you-fill" style={{ width: '96%' }} />
                <div
                  className="pillar-fill rival-fill"
                  style={{ width: `${activeCompetitor?.sentimentBreakdown?.valueForMoney || 48}%` }}
                />
              </div>
            </div>

            <div className="sentiment-pillar-row">
              <div className="pillar-info">
                <span>Staff Hospitality &amp; Friendliness</span>
                <strong>{bizName} (98%) vs Rival ({activeCompetitor?.sentimentBreakdown?.staffCourtesy || 55}%)</strong>
              </div>
              <div className="pillar-bar-track">
                <div className="pillar-fill you-fill" style={{ width: '98%' }} />
                <div
                  className="pillar-fill rival-fill"
                  style={{ width: `${activeCompetitor?.sentimentBreakdown?.staffCourtesy || 55}%` }}
                />
              </div>
            </div>

            <div className="sentiment-pillar-legend">
              <span className="legend-item"><span className="legend-color you-color" /> {bizName}</span>
              <span className="legend-item"><span className="legend-color rival-color" /> {activeCompetitor?.name}</span>
            </div>
          </div>
        </div>

        {/* Column B: Top Competitor Vulnerabilities Heatmap */}
        <div className="card radar-vulnerabilities-card">
          <div className="radar-card-header">
            <div className="radar-title-with-badge">
              <span className="radar-card-icon">🎯</span>
              <div>
                <h3 className="radar-card-title">Where {activeCompetitor?.name} is Failing</h3>
                <p className="radar-card-sub">Extracting negative 1★–3★ review trends with AI</p>
              </div>
            </div>
            <span className="radar-status-badge alert">🚨 {activeCompetitor?.topWeaknesses?.length || 0} Pain Points</span>
          </div>

          <div className="weaknesses-list">
            {activeCompetitor?.topWeaknesses?.map((weakness, idx) => (
              <div key={idx} className="weakness-item-card">
                <div className="weakness-head">
                  <div className="weakness-title-wrap">
                    <span className="weakness-num">#{idx + 1}</span>
                    <strong className="weakness-name">{weakness.aspect}</strong>
                  </div>
                  <span className={`severity-tag ${weakness.severity.toLowerCase()}`}>
                    {weakness.severity} Severity
                  </span>
                </div>

                <p className="weakness-summary">{weakness.summary}</p>

                {weakness.sampleQuote && (
                  <div className="weakness-quote-box">
                    <span className="quote-mark">“</span>
                    <p className="quote-text">{weakness.sampleQuote}</p>
                    <span className="quote-complaints-badge">⚠️ Mentioned in {weakness.complaintsCount} recent reviews</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {activeCompetitor?.topStrengths && (
            <div className="competitor-strengths-callout">
              <strong className="strengths-title">💡 What They Do Well (Don't Compete Here Directly):</strong>
              <ul className="strengths-list">
                {activeCompetitor.topStrengths.map((str, i) => (
                  <li key={i}>✓ {str}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* 4. AI Counter-Strike Marketing Campaigns (Ready to Run) */}
      <div className="card radar-campaigns-section">
        <div className="campaigns-section-header">
          <div>
            <div className="campaigns-tag">
              <span>🚀 INSTANT REPUTATION ARBITRAGE</span>
            </div>
            <h3 className="campaigns-main-title">
              Steal {activeCompetitor?.name}&apos;s Customers with These Counter-Campaigns
            </h3>
            <p className="campaigns-subtext">
              Our AI wrote 3 customized campaigns specifically designed to exploit their top weakness: <strong>{topWeakness?.aspect}</strong>.
            </p>
          </div>
          <span className="ai-certified-badge">🤖 Gemini AI Optimized</span>
        </div>

        <div className="campaign-cards-grid">
          {counterCampaigns.map((camp) => (
            <div key={camp.id} className="campaign-card">
              <div className="camp-card-header">
                <div className="camp-channel-badge">
                  <span>{camp.icon}</span>
                  <span>{camp.channel}</span>
                </div>
                <span className="camp-pill">{camp.badge}</span>
              </div>

              <h4 className="camp-headline">{camp.headline}</h4>
              <p className="camp-strategy">{camp.strategy}</p>

              <div className="camp-copy-box">
                <pre className="camp-copy-text">{camp.copyText}</pre>
                <button
                  type="button"
                  className={`btn-camp-copy ${copiedId === camp.id ? 'copied' : ''}`}
                  onClick={() => handleCopy(camp.id, camp.copyText)}
                >
                  {copiedId === camp.id ? '✓ Copied to Clipboard!' : '📋 Copy Campaign Copy'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 5. Live Review Deconstructor Sandbox ("Spy on Any Review") */}
      <div className="card radar-deconstructor-card">
        <div className="deconstructor-header">
          <div className="deconstructor-title-row">
            <span className="deconstructor-icon">🔬</span>
            <div>
              <h3 className="deconstructor-title">Live Review Deconstructor Sandbox</h3>
              <p className="deconstructor-sub">
                Paste any negative Google review from a competitor down the street to extract their fatal flaw and get an instant counter-move.
              </p>
            </div>
          </div>
          <span className="sandbox-pill">Interactive AI Sandbox</span>
        </div>

        <div className="deconstructor-input-box">
          <textarea
            className="deconstructor-textarea"
            rows={3}
            value={sampleReviewInput}
            onChange={(e) => setSampleReviewInput(e.target.value)}
            placeholder="Paste competitor's 1-star or 2-star review here..."
          />
          <div className="deconstructor-actions">
            <button
              type="button"
              className="btn-deconstruct-run"
              onClick={handleDeconstruct}
              disabled={isDeconstructing || !sampleReviewInput.trim()}
            >
              {isDeconstructing ? 'Analyzing Review...' : '⚡ Deconstruct with AI'}
            </button>
          </div>
        </div>

        {deconstructedResult && (
          <div className="deconstructor-results-box animate-fade-in">
            <div className="results-badge-row">
              <span className="result-pill emotion">
                <span>Emotion Detected:</span> <strong>{deconstructedResult.emotion}</strong>
              </span>
              <span className="result-pill cause">
                <span>Root Cause:</span> <strong>{deconstructedResult.rootCause}</strong>
              </span>
              <span className="result-pill severity">
                <span>Severity Score:</span> <strong>{deconstructedResult.severityScore}/100</strong>
              </span>
            </div>

            <div className="counter-move-card">
              <span className="counter-move-icon">💡</span>
              <div className="counter-move-content">
                <strong>Recommended Counter-Move for {bizName}:</strong>
                <p>{deconstructedResult.counterMove}</p>
                <span className="counter-move-note">{deconstructedResult.strategicSummary}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 6. Add Custom Competitor Modal */}
      {showAddModal && (
        <div className="modal-backdrop" onClick={() => setShowAddModal(false)}>
          <div className="modal-content radar-add-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-row">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1.4rem' }}>📡</span>
                <h3 className="modal-title">Track a New Local Competitor</h3>
              </div>
              <button
                type="button"
                className="btn-modal-close"
                onClick={() => setShowAddModal(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddCustomCompetitor} className="radar-add-form">
              <div className="form-group">
                <label className="form-label">Competitor Business Name *</label>
                <input
                  type="text"
                  className="form-input"
                  required
                  placeholder="e.g. Royal Barber Shop, Cafe Mocha, City Garage..."
                  value={newCompName}
                  onChange={(e) => setNewCompName(e.target.value)}
                />
              </div>

              <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Approximate Star Rating</label>
                  <select
                    className="form-select"
                    value={newCompRating}
                    onChange={(e) => setNewCompRating(e.target.value)}
                  >
                    <option value="3.5">3.5 ★ (Frequent Complaints)</option>
                    <option value="3.8">3.8 ★ (Moderate Quality)</option>
                    <option value="4.0">4.0 ★ (Standard Local Rival)</option>
                    <option value="4.2">4.2 ★ (Strong Presence)</option>
                    <option value="4.5">4.5 ★ (Top Tier Rival)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Location / Landmark</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Main Market, 1 km away..."
                    value={newCompAddress}
                    onChange={(e) => setNewCompAddress(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Paste a Sample Negative Review They Received (Optional)</label>
                <textarea
                  className="form-textarea"
                  rows={3}
                  placeholder="Paste any 1★ or 2★ review you saw on their Google Maps profile to analyze their exact weakness..."
                  value={newCompReviewsText}
                  onChange={(e) => setNewCompReviewsText(e.target.value)}
                />
              </div>

              <div className="modal-actions-row">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  🚀 Launch Radar Tracking
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
