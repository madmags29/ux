import React from 'react';

const ScoreCircle = ({ score }) => {
  let colorClass = 'score-average';
  if (score >= 8) colorClass = 'score-excellent';
  else if (score >= 6) colorClass = 'score-good';
  else if (score < 4) colorClass = 'score-poor';

  return <div className={'score-circle ' + colorClass}>{score}</div>;
};

const SectionCard = ({ title, score, children }) => (
  <div className="report-card">
    <div className="score-display">
      <ScoreCircle score={score} />
      <h3>{title}</h3>
    </div>
    {children}
  </div>
);

const Report = ({ data }) => {
  if (!data || !data.executiveSummary) return null;

  const {
    productUnderstanding,
    firstImpression,
    uiDesign,
    uxAudit,
    accessibility,
    contentSuggestions,
    mobileExperience,
    conversionOptimization,
    heuristicEvaluation,
    benchmarkComparison,
    prioritizedRoadmap,
    aiRedesignSuggestions,
    executiveSummary,
  } = data;

  const verdictColor = {
    'Exceptional': '#10b981',
    'Strong': '#3b82f6',
    'Good': '#8b5cf6',
    'Average': '#f59e0b',
    'Below Standard': '#ef4444',
    'Needs Major Redesign': '#dc2626',
  }[executiveSummary.finalVerdict] || '#9ca3af';

  return (
    <div className="report-container">

      {/* Executive Summary */}
      <div className="executive-summary">
        <h2>Executive Summary</h2>
        <div className="overall-score text-gradient">{executiveSummary.overallScore}<span style={{fontSize:'2rem'}}>/100</span></div>
        <div className="verdict" style={{ color: verdictColor }}>{executiveSummary.finalVerdict}</div>
        {productUnderstanding && (
          <p style={{ marginTop: '0.5rem', color: 'var(--text-tertiary)', fontSize: '0.875rem' }}>
            {productUnderstanding.productName} · {productUnderstanding.productCategory} · {productUnderstanding.targetAudience}
          </p>
        )}
        <p style={{ marginTop: '1.5rem', color: 'var(--text-secondary)', maxWidth: '800px', margin: '1.5rem auto 0', fontStyle: 'italic', lineHeight: 1.8 }}>
          "{executiveSummary.seniorDesignerAdvice}"
        </p>

        {/* Score breakdown */}
        {executiveSummary.breakdown && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', marginTop: '2rem', flexWrap: 'wrap' }}>
            {Object.entries(executiveSummary.breakdown).map(([key, val]) => (
              <div key={key} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: val >= 80 ? '#10b981' : val >= 60 ? '#3b82f6' : '#f59e0b' }}>{val}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', textTransform: 'capitalize', marginTop: '0.25rem' }}>{key}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Product Understanding */}
      {productUnderstanding && (
        <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
          <h3 style={{ marginBottom: '1rem' }}>Product Understanding</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
            <div>
              <p style={{ color: 'var(--text-tertiary)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Value Proposition</p>
              <p style={{ marginTop: '0.25rem' }}>{productUnderstanding.coreValueProposition}</p>
            </div>
            <div>
              <p style={{ color: 'var(--text-tertiary)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Primary User Goals</p>
              <ul className="feature-list" style={{ marginTop: '0.25rem' }}>
                {productUnderstanding.primaryUserGoals?.map((g, i) => <li key={i}>{g}</li>)}
              </ul>
            </div>
            <div>
              <p style={{ color: 'var(--text-tertiary)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Business Goals</p>
              <ul className="feature-list" style={{ marginTop: '0.25rem' }}>
                {productUnderstanding.businessGoals?.map((g, i) => <li key={i}>{g}</li>)}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Score Cards Grid */}
      <div className="report-grid">
        <SectionCard title="First Impression" score={firstImpression?.score}>
          <h4 style={{ marginTop: '1rem', color: 'var(--success)', fontSize: '0.875rem' }}>Strengths</h4>
          <ul className="feature-list success">
            {firstImpression?.strengths?.map((s, i) => <li key={i}>{s}</li>)}
          </ul>
          <h4 style={{ marginTop: '1rem', color: 'var(--error)', fontSize: '0.875rem' }}>Weaknesses</h4>
          <ul className="feature-list danger">
            {firstImpression?.weaknesses?.map((w, i) => <li key={i}>{w}</li>)}
          </ul>
        </SectionCard>

        <SectionCard title="UI Design" score={uiDesign?.score}>
          <h4 style={{ marginTop: '1rem', color: 'var(--error)', fontSize: '0.875rem' }}>Critical Issues</h4>
          <ul className="feature-list danger">
            {uiDesign?.criticalIssues?.map((c, i) => <li key={i}>{c}</li>)}
          </ul>
          <h4 style={{ marginTop: '1rem', color: 'var(--accent-primary)', fontSize: '0.875rem' }}>Recommendations</h4>
          <ul className="feature-list">
            {uiDesign?.recommendations?.map((r, i) => <li key={i}>{r}</li>)}
          </ul>
        </SectionCard>

        <SectionCard title="UX Audit" score={uxAudit?.score}>
          <h4 style={{ marginTop: '1rem', color: 'var(--error)', fontSize: '0.875rem' }}>Confusing Areas</h4>
          <ul className="feature-list danger">
            {uxAudit?.confusingAreas?.map((c, i) => <li key={i}>{c}</li>)}
          </ul>
          <h4 style={{ marginTop: '1rem', color: 'var(--warning)', fontSize: '0.875rem' }}>Unnecessary Steps</h4>
          <ul className="feature-list danger">
            {uxAudit?.unnecessarySteps?.map((u, i) => <li key={i}>{u}</li>)}
          </ul>
          {uxAudit?.informationOverload?.length > 0 && (
            <>
              <h4 style={{ marginTop: '1rem', color: 'var(--warning)', fontSize: '0.875rem' }}>Information Overload</h4>
              <ul className="feature-list danger">
                {uxAudit.informationOverload.map((x, i) => <li key={i}>{x}</li>)}
              </ul>
            </>
          )}
        </SectionCard>

        <SectionCard title="Accessibility" score={accessibility?.score}>
          <h4 style={{ marginTop: '1rem', color: 'var(--error)', fontSize: '0.875rem' }}>Issues</h4>
          <ul className="feature-list danger">
            {accessibility?.issues?.map((c, i) => <li key={i}>{c}</li>)}
          </ul>
          <h4 style={{ marginTop: '1rem', color: 'var(--success)', fontSize: '0.875rem' }}>Fixes</h4>
          <ul className="feature-list success">
            {accessibility?.fixes?.map((f, i) => <li key={i}>{f}</li>)}
          </ul>
        </SectionCard>

        <SectionCard title="Content Suggestions" score={contentSuggestions?.score}>
          <h4 style={{ marginTop: '1rem', color: 'var(--error)', fontSize: '0.875rem' }}>Issues</h4>
          <ul className="feature-list danger">
            {contentSuggestions?.issues?.map((c, i) => <li key={i}>{c}</li>)}
          </ul>
          <h4 style={{ marginTop: '1rem', color: 'var(--accent-primary)', fontSize: '0.875rem' }}>Improvements</h4>
          <ul className="feature-list">
            {contentSuggestions?.improvements?.map((f, i) => <li key={i}>{f}</li>)}
          </ul>
        </SectionCard>

        <SectionCard title="Mobile Experience" score={mobileExperience?.score}>
          <ul className="feature-list" style={{ marginTop: '0.5rem' }}>
            {mobileExperience?.notes?.map((n, i) => <li key={i}>{n}</li>)}
          </ul>
        </SectionCard>

        <SectionCard title="Conversion Optimization" score={conversionOptimization?.score}>
          <div style={{ marginBottom: '1rem', marginTop: '0.5rem' }}>
            <span className="badge">Expected Impact: {conversionOptimization?.expectedImpact}</span>
          </div>
          <ul className="feature-list">
            {conversionOptimization?.notes?.map((n, i) => <li key={i}>{n}</li>)}
          </ul>
        </SectionCard>
      </div>

      {/* Heuristic Evaluation */}
      {heuristicEvaluation?.length > 0 && (
        <div className="glass-panel" style={{ padding: '2rem', marginTop: '2rem' }}>
          <h3 style={{ marginBottom: '1.5rem' }}>Nielsen's 10 Heuristic Evaluation</h3>
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            {heuristicEvaluation.map((h, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '2rem 1fr auto', gap: '1rem', alignItems: 'start', padding: '0.75rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                <ScoreCircle score={h.rating} />
                <div>
                  <p style={{ fontWeight: 600, fontSize: '0.9rem' }}>{h.heuristic}</p>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.25rem' }}>{h.notes}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Benchmark */}
      {benchmarkComparison && (
        <div className="glass-panel" style={{ padding: '2rem', marginTop: '2rem', display: 'flex', gap: '2rem', alignItems: 'center' }}>
          <div style={{ textAlign: 'center', minWidth: '80px' }}>
            <ScoreCircle score={benchmarkComparison.score} />
            <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '0.5rem' }}>Benchmark</p>
          </div>
          <div>
            <h3>World-Class Benchmark</h3>
            <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>{benchmarkComparison.notes}</p>
          </div>
        </div>
      )}

      {/* Prioritized Roadmap */}
      {prioritizedRoadmap && (
        <div className="glass-panel" style={{ padding: '2rem', marginTop: '2rem' }}>
          <h3 style={{ marginBottom: '1.5rem' }}>Prioritized Improvement Roadmap</h3>

          {prioritizedRoadmap.critical?.length > 0 && (
            <div style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ color: 'var(--error)', marginBottom: '0.75rem' }}>🔴 Critical (Must Fix)</h4>
              {prioritizedRoadmap.critical.map((item, i) => (
                <RoadmapItem key={i} item={item} />
              ))}
            </div>
          )}
          {prioritizedRoadmap.important?.length > 0 && (
            <div style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ color: 'var(--warning)', marginBottom: '0.75rem' }}>🟡 Important (Should Fix)</h4>
              {prioritizedRoadmap.important.map((item, i) => (
                <RoadmapItem key={i} item={item} />
              ))}
            </div>
          )}
          {prioritizedRoadmap.enhancements?.length > 0 && (
            <div>
              <h4 style={{ color: 'var(--success)', marginBottom: '0.75rem' }}>🟢 Enhancements (Nice to Have)</h4>
              {prioritizedRoadmap.enhancements.map((item, i) => (
                <RoadmapItem key={i} item={item} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* AI Redesign Suggestions */}
      {aiRedesignSuggestions && (
        <div className="glass-panel" style={{ padding: '2rem', marginTop: '2rem', marginBottom: '4rem' }}>
          <h3 style={{ marginBottom: '1.5rem' }}>AI Redesign Suggestions</h3>
          <div className="report-grid">
            {[
              { key: 'layout', label: 'Layout' },
              { key: 'uxFlow', label: 'UX Flow' },
              { key: 'informationArchitecture', label: 'Information Architecture' },
              { key: 'accessibility', label: 'Accessibility' },
              { key: 'conversion', label: 'Conversion' },
              { key: 'modernDesign', label: 'Modern Design' },
            ].map(({ key, label }) => aiRedesignSuggestions[key]?.length > 0 && (
              <div key={key} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '8px', padding: '1rem' }}>
                <h4 style={{ color: 'var(--accent-primary)', marginBottom: '0.5rem', fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '1px' }}>{label}</h4>
                <ul className="feature-list">
                  {aiRedesignSuggestions[key].map((s, i) => <li key={i}>{s}</li>)}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const RoadmapItem = ({ item }) => (
  <div style={{ background: 'rgba(255,255,255,0.04)', padding: '1rem', borderRadius: '8px', marginBottom: '0.5rem', display: 'grid', gridTemplateColumns: '1fr auto', gap: '1rem', alignItems: 'start' }}>
    <div>
      <p style={{ fontWeight: 600 }}>{item.problem}</p>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.25rem' }}>{item.suggestedSolution}</p>
      <p style={{ color: 'var(--text-tertiary)', fontSize: '0.8rem', marginTop: '0.25rem' }}>Expected gain: {item.expectedUxGain}</p>
    </div>
    <div style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
      <span className="badge" style={{ fontSize: '0.75rem' }}>Effort: {item.effort}</span>
    </div>
  </div>
);

export default Report;
