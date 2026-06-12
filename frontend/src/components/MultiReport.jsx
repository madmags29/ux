import React, { useState } from 'react';

const scoreToColor = (s) => {
  if (s >= 8) return '#10b981';
  if (s >= 6) return '#3b82f6';
  if (s >= 4) return '#f59e0b';
  return '#ef4444';
};

const scoreToClass = (s) => {
  if (s >= 8) return 'score-excellent';
  if (s >= 6) return 'score-good';
  if (s >= 4) return 'score-average';
  return 'score-poor';
};

const ScorePill = ({ label, score }) => (
  <div style={{ textAlign: 'center' }}>
    <div style={{ fontSize: '1.25rem', fontWeight: 700, fontFamily: "'Outfit', sans-serif", color: scoreToColor(score) }}>{score}</div>
    <div style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', textTransform: 'capitalize', marginTop: '2px' }}>{label}</div>
  </div>
);

const ScreenCard = ({ screen, isActive, onClick }) => {
  const ev = screen.evaluation;
  return (
    <div
      onClick={onClick}
      style={{
        cursor: 'pointer',
        borderRadius: 'var(--radius-md)',
        border: isActive ? '2px solid var(--accent-primary)' : '1px solid var(--glass-border)',
        background: isActive ? 'rgba(99, 102, 241, 0.06)' : 'var(--glass-bg)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        overflow: 'hidden',
        transition: 'all 0.2s ease',
        boxShadow: isActive ? '0 0 0 4px rgba(99,102,241,0.12), var(--glass-shadow)' : 'var(--glass-shadow)',
      }}
    >
      {/* Screenshot thumbnail */}
      <div style={{ position: 'relative', background: 'rgba(240,244,255,0.6)', aspectRatio: '16/10', overflow: 'hidden', borderRadius: 'var(--radius-md) var(--radius-md) 0 0' }}>
        {screen.screenshotBase64 ? (
          <img src={screen.screenshotBase64} alt={screen.title}         style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top', display: 'block' }} />
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-tertiary)' }}>
            No preview
          </div>
        )}
        {/* Score overlay */}
        <div style={{
          position: 'absolute', top: '0.5rem', right: '0.5rem',
          width: '36px', height: '36px', borderRadius: '50%',
          background: scoreToColor(ev?.overallScore),
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 800, fontSize: '0.85rem', color: '#fff',
          fontFamily: "'Outfit', sans-serif",
          boxShadow: '0 2px 8px rgba(0,0,0,0.5)'
        }}>
          {ev?.overallScore}
        </div>
        <div style={{
          position: 'absolute', top: '0.5rem', left: '0.5rem',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--glass-border)',
          background: 'var(--glass-bg-strong)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          padding: '2px 8px',
          fontSize: '0.7rem',
          color: 'var(--text-primary)'
        }}>
          Screen {screen.index}
        </div>
      </div>
      {/* Card footer */}
      <div style={{ padding: '0.875rem' }}>
        <p style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.25rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {screen.title}
        </p>
        <p style={{ fontSize: '0.7rem', color: 'var(--accent-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {screen.url}
        </p>
        <p style={{ fontSize: '0.7rem', color: 'var(--accent-secondary)', marginTop: '0.25rem' }}>
          {ev?.pageRole}
        </p>
      </div>
    </div>
  );
};

const ScreenDetail = ({ screen }) => {
  const ev = screen.evaluation;
  if (!ev) return null;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '2rem', alignItems: 'start' }}>
      {/* Left: Screenshot */}
      <div>
        <div style={{ position: 'relative', borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--glass-border)', boxShadow: 'var(--glass-shadow)' }}>
          {screen.screenshotBase64 ? (
            <img
              src={screen.screenshotBase64}
              alt={screen.title}
              style={{ width: '100%', display: 'block' }}
            />
          ) : (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-tertiary)', background: 'var(--bg-secondary)' }}>
              No screenshot
            </div>
          )}
          <div style={{
            position: 'absolute', top: '1rem', right: '1rem',
            width: '52px', height: '52px', borderRadius: '50%',
            background: scoreToColor(ev.overallScore),
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 800, fontSize: '1.125rem', color: '#fff',
            fontFamily: "'Outfit', sans-serif",
            boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
            border: '2px solid rgba(255,255,255,0.2)'
          }}>
            {ev.overallScore}
          </div>
        </div>
        {/* Mini score breakdown */}
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'space-between', marginTop: '1rem', background: 'var(--glass-bg-strong)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--glass-border)', boxShadow: 'var(--glass-shadow)', flexWrap: 'wrap' }}>
          <ScorePill label="Impression" score={ev.firstImpression?.score} />
          <ScorePill label="UI Design" score={ev.uiDesign?.score} />
          <ScorePill label="UX" score={ev.uxAudit?.score} />
          <ScorePill label="Copywriting" score={ev.contentSuggestions?.score} />
          <ScorePill label="A11y" score={ev.accessibility?.score} />
          <ScorePill label="Conversion" score={ev.conversion?.score} />
        </div>
      </div>

      {/* Right: Evaluation details */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {/* Page role */}
        <div style={{ padding: '0.75rem 1rem', background: 'rgba(99, 102, 241, 0.07)', border: '1px solid rgba(99, 102, 241, 0.18)', borderRadius: '10px' }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--accent-primary)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}>Page Role</span>
          <p style={{ marginTop: '0.25rem', fontWeight: 500 }}>{ev.pageRole}</p>
        </div>

        {/* Top Priority */}
        {ev.topPriority && (
          <div style={{ padding: '0.75rem 1rem', background: 'rgba(217, 119, 6, 0.07)', border: '1px solid rgba(217,119,6,0.2)', borderRadius: '10px' }}>
            <span style={{ fontSize: '0.7rem', color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}>⚡ Top Priority</span>
            <p style={{ marginTop: '0.25rem', color: '#92400e', fontSize: '0.9rem' }}>{ev.topPriority}</p>
          </div>
        )}

        {/* Strengths */}
        {ev.firstImpression?.strengths?.length > 0 && (
          <div className="report-card" style={{ padding: '1rem' }}>
            <h4 style={{ color: '#10b981', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.5rem' }}>✓ Strengths</h4>
            <ul className="feature-list success">
              {ev.firstImpression.strengths.map((s, i) => <li key={i}>{s}</li>)}
            </ul>
          </div>
        )}

        {/* Critical Issues */}
        {(ev.uiDesign?.criticalIssues?.length > 0 || ev.uxAudit?.confusingAreas?.length > 0) && (
          <div className="report-card" style={{ padding: '1rem' }}>
            <h4 style={{ color: '#ef4444', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.5rem' }}>× Issues</h4>
            <ul className="feature-list danger">
              {[...(ev.uiDesign?.criticalIssues || []), ...(ev.uxAudit?.confusingAreas || [])].map((c, i) => <li key={i}>{c}</li>)}
            </ul>
          </div>
        )}

        {/* Accessibility */}
        {ev.accessibility?.issues?.length > 0 && (
          <div className="report-card" style={{ padding: '1rem' }}>
            <h4 style={{ color: '#f59e0b', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.5rem' }}>⚠ Accessibility</h4>
            <ul className="feature-list danger">
              {ev.accessibility.issues.map((c, i) => <li key={i}>{c}</li>)}
            </ul>
          </div>
        )}

        {/* Content Suggestions */}
        {ev.contentSuggestions?.improvements?.length > 0 && (
          <div className="report-card" style={{ padding: '1rem' }}>
            <h4 style={{ color: 'var(--accent-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.5rem' }}>✍ Content & Copy Suggestions</h4>
            <ul className="feature-list">
              {ev.contentSuggestions.improvements.map((imp, i) => <li key={i}>{imp}</li>)}
            </ul>
          </div>
        )}

        {/* Recommendations */}
        {(ev.uiDesign?.recommendations?.length > 0 || ev.uxAudit?.improvements?.length > 0) && (
          <div className="report-card" style={{ padding: '1rem' }}>
            <h4 style={{ color: 'var(--accent-primary)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.5rem' }}>→ Recommendations</h4>
            <ul className="feature-list">
              {[...(ev.uiDesign?.recommendations || []), ...(ev.uxAudit?.improvements || [])].map((r, i) => <li key={i}>{r}</li>)}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

const AggregatePanel = ({ aggregate }) => {
  if (!aggregate) return null;
  const verdictColor = {
    'Exceptional': '#10b981', 'Strong': '#3b82f6', 'Good': '#8b5cf6',
    'Average': '#f59e0b', 'Below Standard': '#ef4444', 'Needs Major Redesign': '#dc2626'
  }[aggregate.finalVerdict] || '#9ca3af';

  return (
    <div style={{ marginTop: '3rem' }}>
      <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>Overall Report</h2>

      <div className="executive-summary" style={{ marginBottom: '2rem' }}>
        <h3 style={{ marginBottom: '0.5rem', fontFamily: "'Inter', sans-serif", fontWeight: 400, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
          {aggregate.productName} · {aggregate.productCategory}
        </h3>
        <div className="overall-score text-gradient">{aggregate.overallScore}<span style={{ fontSize: '2rem' }}>/100</span></div>
        <div className="verdict" style={{ color: verdictColor }}>{aggregate.finalVerdict}</div>
        <p style={{ color: 'var(--text-secondary)', maxWidth: '700px', margin: '1rem auto', fontSize: '0.9rem' }}>
          {aggregate.coreValueProposition}
        </p>

        {aggregate.breakdown && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
            {Object.entries(aggregate.breakdown).map(([key, val]) => (
              <div key={key} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.75rem', fontWeight: 700, fontFamily: "'Outfit', sans-serif", color: val >= 80 ? '#10b981' : val >= 60 ? '#3b82f6' : '#f59e0b' }}>{val}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', textTransform: 'capitalize', marginTop: '2px' }}>{key}</div>
              </div>
            ))}
          </div>
        )}

        <div style={{ marginTop: '1.5rem', padding: '1.25rem', background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: '12px', maxWidth: '700px', margin: '1.5rem auto 0', fontStyle: 'italic', color: '#c4b5fd' }}>
          "{aggregate.seniorDesignerAdvice}"
        </div>
      </div>

      {/* Cross-screen issues */}
      {aggregate.crossScreenIssues?.length > 0 && (
        <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
          <h3 style={{ marginBottom: '1rem', color: '#f59e0b' }}>⚠ Cross-Screen Issues</h3>
          <ul className="feature-list danger">
            {aggregate.crossScreenIssues.map((i, idx) => <li key={idx}>{i}</li>)}
          </ul>
        </div>
      )}

      {/* Usability Heuristics Checklist */}
      {aggregate.heuristicsCheck?.length > 0 && (
        <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
          <h3 style={{ marginBottom: '1.25rem' }}> Jakob Nielsen's Usability Heuristics Audit</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
            {aggregate.heuristicsCheck.map((hc, idx) => (
              <div key={idx} style={{ padding: '0.875rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{
                    fontSize: '1rem',
                    color: hc.passed ? '#10b981' : '#ef4444',
                    fontWeight: 'bold'
                  }}>
                    {hc.passed ? '✓' : '×'}
                  </span>
                  <span style={{ fontWeight: 600, fontSize: '0.85rem', color: hc.passed ? 'var(--text-primary)' : '#f87171' }}>
                    {hc.heuristic}
                  </span>
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginLeft: '1.25rem', lineHeight: 1.4 }}>
                  {hc.notes}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Roadmap */}
      {aggregate.prioritizedRoadmap && (
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h3 style={{ marginBottom: '1.5rem' }}>Prioritized Improvement Roadmap</h3>
          {[
            { label: '🔴 Critical (Must Fix)', color: '#ef4444', items: aggregate.prioritizedRoadmap.critical },
            { label: '🟡 Important (Should Fix)', color: '#f59e0b', items: aggregate.prioritizedRoadmap.important },
            { label: '🟢 Enhancements', color: '#10b981', items: aggregate.prioritizedRoadmap.enhancements },
          ].map(({ label, color, items }) => items?.length > 0 && (
            <div key={label} style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ color, marginBottom: '0.75rem', fontFamily: "'Outfit', sans-serif" }}>{label}</h4>
              {items.map((item, i) => (
                <div key={i} style={{ background: 'var(--glass-bg)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1px solid var(--glass-border)', padding: '1rem', borderRadius: 'var(--radius-sm)', marginBottom: '0.5rem', display: 'grid', gridTemplateColumns: '1fr auto', gap: '1rem', alignItems: 'start', boxShadow: 'var(--glass-shadow)' }}>
                  <div>
                    <p style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{item.problem}</p>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '0.4rem' }}>{item.suggestedSolution}</p>
                    {item.affectedScreens?.length > 0 && (
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Affects: {item.affectedScreens.join(', ')}</p>
                    )}
                  </div>
                  <span className="badge" style={{ whiteSpace: 'nowrap' }}>Effort: {item.effort}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const MultiReport = ({ screens, aggregate, loading }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeScreen = screens[activeIndex];

  return (
    <div>
      {/* Screen Thumbnails Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        {screens.map((screen, i) => (
          <ScreenCard
            key={i}
            screen={screen}
            isActive={activeIndex === i}
            onClick={() => setActiveIndex(i)}
          />
        ))}
        {loading && (
          <div style={{
            borderRadius: 'var(--radius-md)', border: '1px dashed var(--border)',
            background: 'var(--bg-surface)', aspectRatio: '16/13',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            gap: '0.5rem', color: 'var(--text-tertiary)'
          }}>
            <div className="spinner" style={{ width: 28, height: 28, borderWidth: 3 }}></div>
            <span style={{ fontSize: '0.8rem' }}>Analyzing...</span>
          </div>
        )}
      </div>

      {/* Active Screen Detail */}
      {activeScreen && (
        <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <div style={{
                width: '28px', height: '28px', borderRadius: '50%',
                background: 'var(--accent-gradient)', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                fontWeight: 700, fontSize: '0.85rem', color: '#fff',
                fontFamily: "'Outfit', sans-serif", flexShrink: 0
              }}>{activeScreen.index}</div>
              <h2 style={{ fontSize: '1.25rem' }}>{activeScreen.title}</h2>
            </div>
            <a href={activeScreen.url} target="_blank" rel="noreferrer" style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', textDecoration: 'none' }}>
              {activeScreen.url}
            </a>
          </div>
          <ScreenDetail screen={activeScreen} />
        </div>
      )}

      {/* Aggregate Summary */}
      <AggregatePanel aggregate={aggregate} />
    </div>
  );
};

export default MultiReport;
