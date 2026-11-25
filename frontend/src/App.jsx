import { useState, useRef, lazy, Suspense } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import Navbar from './components/Navbar';
import ParticleCanvas from './components/ParticleCanvas';
import { AuthProvider, useAuth } from './context/AuthContext';
import Logo from './components/Logo';
import SEO from './components/SEO';
import './index.css';

const MultiReport = lazy(() => import('./components/MultiReport'));
const AuthModal = lazy(() => import('./components/AuthModal'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const PlansPage = lazy(() => import('./pages/PlansPage'));
const ContactPage = lazy(() => import('./pages/ContactPage'));
const AdminPage = lazy(() => import('./pages/AdminPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const BlogPage = lazy(() => import('./pages/BlogPage'));
const BlogPostPage = lazy(() => import('./pages/BlogPostPage'));
const TermsPage = lazy(() => import('./pages/TermsPage'));
const PrivacyPage = lazy(() => import('./pages/PrivacyPage'));
const UxLawsPage = lazy(() => import('./pages/UxLawsPage'));


const HOME_FAQS = [
  {
    q: 'What is Rate My UX and how does the AI audit work?',
    a: 'Rate My UX is an AI-powered UX evaluation platform built by Dev Designs. Paste any website URL, public Figma prototype link, or upload screenshots, and our Vision AI evaluates every screen across 11 usability dimensions, Jakob Nielsen’s 10 Heuristics, 10 Laws of UX, Color Psychology, and WCAG 2.2 accessibility standards in under 60 seconds.',
  },
  {
    q: 'Does Rate My UX evaluate Laws of UX and Color Psychology?',
    a: 'Yes. Every audit scores 10 foundational Laws of UX (including Hick’s Law, Fitts’s Law, Jakob’s Law, Miller’s Law, Law of Proximity, and Von Restorff Effect) plus a dedicated Color Psychology & Emotional Alignment score analyzing brand trust and CTA contrast.',
  },
  {
    q: 'Is Rate My UX free to use?',
    a: 'Yes! Our Free Starter tier lets you evaluate up to 3 screens per evaluation with full 11-dimension scores, Nielsen heuristics, Laws of UX, Color Psychology, saved audit history, and watermarked executive PDF exports.',
  },
  {
    q: 'Can I audit Figma prototypes as well as live websites?',
    a: 'Yes. You can paste a public Figma design or prototype URL, enter any live website URL, or drag and drop PNG, JPG, or WebP screenshots directly into the evaluator.',
  },
  {
    q: 'Who can help fix the UX issues discovered in my report?',
    a: 'You can share the prioritized effort-vs-impact roadmap PDF with your internal team or partner with Dev Designs (devdesigns.net), the UI/UX design and engineering studio behind Rate My UX, for fast, conversion-focused redesigns.',
  },
];

const HOME_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: HOME_FAQS.map((f) => ({
    '@type': 'Question',
    name: f.q,
    acceptedAnswer: { '@type': 'Answer', text: f.a },
  })),
};

function EvaluatorPage() {
  const { token, user } = useAuth();
  const [mode, setMode] = useState('url');
  const [url, setUrl] = useState('');
  const [files, setFiles] = useState([]);
  const [maxScreens] = useState(3);
  const [loading, setLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [screens, setScreens] = useState([]);
  const [aggregate, setAggregate] = useState(null);
  const [error, setError] = useState(null);
  const [done, setDone] = useState(false);
  const [currentPreview, setCurrentPreview] = useState(null);
  const [showAuthGate, setShowAuthGate] = useState(false);
  const [authGateReason, setAuthGateReason] = useState('evaluate');
  const [pendingSubmit, setPendingSubmit] = useState(false);
  const abortRef = useRef(null);

  const resetEvaluationState = () => {
    setLoading(false);
    setStatus('');
    setProgress({ current: 0, total: 0 });
    setScreens([]);
    setAggregate(null);
    setError(null);
    setDone(false);
    setCurrentPreview(null);
    setPendingSubmit(false);
  };

  const reset = () => {
    setUrl('');
    setFiles([]);
    resetEvaluationState();
  };

  const [showLimitModal, setShowLimitModal] = useState(false);
  const [openHomeFaq, setOpenHomeFaq] = useState(null);

  const runEvaluation = async (authToken, overrideFiles = null) => {
    const tkn = authToken || token || localStorage.getItem('userToken') || '';
    const activeFiles = overrideFiles || files;
    resetEvaluationState();
    setLoading(true);
    abortRef.current = new AbortController();

    if (mode === 'upload' && activeFiles.length > 0) {
      const reader = new FileReader();
      reader.onload = (event) => setCurrentPreview(event.target.result);
      reader.readAsDataURL(activeFiles[0]);
    }

    const formData = new FormData();
    if (mode === 'url') {
      formData.append('url', url);
      formData.append('maxScreens', maxScreens);
    } else {
      activeFiles.forEach(file => formData.append('images', file));
    }

    try {
      const API_URL = import.meta.env.VITE_API_URL || '';
      const response = await fetch(`${API_URL}/api/evaluate`, {
        method: 'POST',
        headers: tkn ? { Authorization: `Bearer ${tkn}` } : {},
        body: formData,
        signal: abortRef.current?.signal,
      });
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      while (true) {
        const { done: streamDone, value } = await reader.read();
        if (streamDone) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop();
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try { handleEvent(JSON.parse(line.slice(6))); } catch { /* ignore chunk split errors */ }
        }
      }
    } catch (err) {
      if (err.name !== 'AbortError') setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Called when user successfully signs in via the auth gate
  const handleAuthSuccess = async () => {
    setShowAuthGate(false);
    const freshToken = localStorage.getItem('userToken') || '';
    if (pendingSubmit) {
      setPendingSubmit(false);
      setTimeout(() => runEvaluation(freshToken), 150);
    } else if (done && screens.length > 0 && freshToken) {
      try {
        const API_URL = import.meta.env.VITE_API_URL || '';
        await fetch(`${API_URL}/api/user/evaluations/save`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${freshToken}`,
          },
          body: JSON.stringify({
            targetUrl: url || 'Uploaded Screenshots',
            mode,
            screens,
            aggregate,
          }),
        });
      } catch (err) {
        console.error('Failed to save report after sign-in:', err);
      }
    }
  };

  const handleProceedWithThree = () => {
    const sliced = files.slice(0, 3);
    setFiles(sliced);
    setShowLimitModal(false);
    if (!token) {
      setPendingSubmit(true);
      setAuthGateReason('evaluate');
      setShowAuthGate(true);
      return;
    }
    setTimeout(() => runEvaluation(token, sliced), 100);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (mode === 'url' && !url) return;
    if (mode === 'upload' && files.length === 0) return;

    // If upload has more than 3 files on Free Plan, prompt user with the Multi-Screen limit modal
    if (mode === 'upload' && files.length > 3) {
      setShowLimitModal(true);
      return;
    }

    // Require login before evaluating
    if (!token) {
      setPendingSubmit(true);
      setAuthGateReason('evaluate');
      setShowAuthGate(true);
      return;
    }

    runEvaluation();
  };

  const handleEvent = (event) => {
    switch (event.type) {
      case 'status': setStatus(event.message); break;
      case 'total': setProgress(p => ({ ...p, total: event.total })); break;
      case 'progress': setProgress({ current: event.current, total: event.total }); setStatus(`Analyzing ${event.current}/${event.total}: ${event.screenName}`); break;
      case 'screen': setScreens(prev => [...prev, event]); break;
      case 'screenshot_preview': setCurrentPreview(event.screenshotBase64); break;
      case 'aggregate': setAggregate(event.aggregate); break;
      case 'done': setDone(true); setLoading(false); break;
      case 'error': setError(event.message); setLoading(false); break;
      default: break;
    }
  };

  const handleDownload = async () => {
    if (!aggregate && screens.length === 0) return;
    if (!token) {
      setPendingSubmit(false);
      setAuthGateReason('download');
      setShowAuthGate(true);
      return;
    }
    setPdfLoading(true);
    try {
      const { generatePDF } = await import('./utils/generatePDF');
      await generatePDF(screens, aggregate);
    }
    catch (err) { alert('PDF generation failed: ' + err.message); }
    finally { setPdfLoading(false); }
  };

  const hasResults = screens.length > 0 || aggregate;

  return (
    <>
      <SEO
        title="Rate My UX | AI-Powered UX Evaluation & Design Auditing Tool"
        description="Rate My UX is an AI-powered UX evaluation platform that audits your website, app, or Figma prototype using advanced Vision AI. Get 11-dimension usability scores, Jakob Nielsen heuristic checks, 10 Laws of UX & Color Psychology audits, WCAG accessibility reports, and prioritized design roadmaps instantly."
        canonicalPath="/"
        schema={HOME_SCHEMA}
      />

      {/* Auth Gate */}
      {showAuthGate && (
        <Suspense fallback={null}>
          <AuthModal
            isOpen={true}
            onClose={() => { setShowAuthGate(false); setPendingSubmit(false); }}
            onSuccess={handleAuthSuccess}
            gateReason={authGateReason}
          />
        </Suspense>
      )}

      {/* ─── MULTI-SCREEN PLAN LIMIT MODAL (When > 3 screens submitted) ─── */}
      {showLimitModal && (
        <div className="auth-gate-modal-backdrop" onClick={() => setShowLimitModal(false)}>
          <div className="auth-gate-modal glass-panel" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 490, textAlign: 'center', padding: '2rem' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>⚡</div>
            <div className="hero__badge" style={{ margin: '0 auto 1rem auto', display: 'inline-flex' }}>
              Free Plan Limit: 3 Screens
            </div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '0.5rem' }}>
              Multi-Screen Audit Detected
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.55, marginBottom: '1.5rem' }}>
              You selected <strong style={{ color: 'var(--accent-cyan)' }}>{files.length} screens</strong>. Under the Free Plan, you can audit the top <strong style={{ color: '#fff' }}>3 screens</strong> with complete 11-dimension scoring and Nielsen checks.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleProceedWithThree}
                style={{ width: '100%', justifyContent: 'center', padding: '0.85rem', fontSize: '0.95rem' }}
              >
                ⚡ Evaluate First 3 Screens (Free)
              </button>

              <a
                href="/plans"
                className="btn btn-secondary"
                style={{ width: '100%', justifyContent: 'center', padding: '0.85rem', color: 'var(--accent-cyan)', fontSize: '0.95rem' }}
              >
                🚀 Upgrade to Pro for All {files.length} Screens
              </a>

              <button
                type="button"
                onClick={() => setShowLimitModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', fontSize: '0.85rem', marginTop: '0.4rem' }}
              >
                Cancel &amp; Select Different Files
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── HERO ─── */}
      {!hasResults && !loading && (
        <section className="hero">
          <div className="hero__orb hero__orb--cyan" />
          <div className="hero__orb hero__orb--violet" />
          <div className="hero__orb hero__orb--magenta" />
          <ParticleCanvas />

          <div className="hero__content">
            <div className="hero__badge">
              <span className="hero__badge-dot" />
              AI-Powered UX Intelligence
            </div>
            <h1 className="hero__title">
              Evaluate UX with
              <br />
              <span className="text-gradient-full">Neural Precision</span>
            </h1>
            <p className="hero__subtitle">
              Upload any prototype or paste a URL — our Vision AI dissects every screen,
              scores 11 dimensions, 10 Laws of UX &amp; Color Psychology, and delivers an actionable UX roadmap in seconds.
            </p>

            {/* Mode Tabs */}
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', marginBottom: '1.5rem', background: 'var(--glass-bg)', padding: '4px', borderRadius: 'var(--radius-md)', border: '1px solid var(--glass-border)', maxWidth: 420, margin: '0 auto 1.5rem auto' }}>
              <button
                type="button"
                onClick={() => setMode('url')}
                className={`tab-btn ${mode === 'url' ? 'active' : ''}`}
                style={{
                  flex: 1, padding: '0.6rem 1rem', border: 'none',
                  borderRadius: 'calc(var(--radius-md) - 2px)', cursor: 'pointer',
                  fontWeight: 600, fontSize: '0.85rem', transition: 'all 0.3s ease',
                  background: mode === 'url' ? 'rgba(0, 240, 255, 0.08)' : 'transparent',
                  color: mode === 'url' ? 'var(--accent-cyan)' : 'var(--text-secondary)',
                }}
              >
                🌐 Evaluate URL / Figma
              </button>
              <button
                type="button"
                onClick={() => setMode('upload')}
                className={`tab-btn ${mode === 'upload' ? 'active' : ''}`}
                style={{
                  flex: 1, padding: '0.6rem 1rem', border: 'none',
                  borderRadius: 'calc(var(--radius-md) - 2px)', cursor: 'pointer',
                  fontWeight: 600, fontSize: '0.85rem', transition: 'all 0.3s ease',
                  background: mode === 'upload' ? 'rgba(0, 240, 255, 0.08)' : 'transparent',
                  color: mode === 'upload' ? 'var(--accent-cyan)' : 'var(--text-secondary)',
                }}
              >
                📁 Upload Screenshots
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: 600, margin: '0 auto' }}>
              {mode === 'url' ? (
                <>
                  <div className="search-field-wrapper">
                    <span className="search-field-icon">🌐</span>
                    <input
                      type="url"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      placeholder="https://your-prototype.com or figma.com/design/... or figma.com/proto/..."
                      className="input-field input-field-highlight"
                      required
                    />
                  </div>

                  <button type="submit" className="btn btn-primary hero__cta-primary" style={{ width: '100%', justifyContent: 'center', fontSize: '1rem', padding: '0.9rem' }}>
                    <span className="pulse-ring" />
                    🔍 Evaluate My UX
                  </button>
                </>
              ) : (
                <>
                  <div
                    onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      const droppedFiles = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
                      setFiles(prev => [...prev, ...droppedFiles]);
                    }}
                    onClick={() => document.getElementById('file-upload-input').click()}
                    style={{
                      border: '2px dashed var(--glass-border)',
                      borderRadius: 'var(--radius-lg)',
                      padding: '2.5rem',
                      textAlign: 'center',
                      cursor: 'pointer',
                      background: 'var(--glass-bg)',
                      transition: 'all 0.3s ease',
                    }}
                  >
                    <input
                      id="file-upload-input"
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={(e) => {
                        if (e.target.files) {
                          setFiles(prev => [...prev, ...Array.from(e.target.files)]);
                        }
                      }}
                      style={{ display: 'none' }}
                    />
                    <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📤</div>
                    <h3 style={{ fontSize: '1rem', marginBottom: '0.25rem', color: 'var(--text-primary)' }}>Drag &amp; drop prototype screenshots here</h3>
                    <p style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>or click to browse (PNG, JPG, WEBP)</p>
                  </div>

                  {files.length > 0 && (
                    <div style={{ background: 'var(--glass-bg)', borderRadius: 'var(--radius-md)', padding: '1rem', border: '1px solid var(--glass-border)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                        <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Selected Screens ({files.length})</span>
                        <button type="button" onClick={() => setFiles([])} style={{ background: 'none', border: 'none', color: 'var(--error)', cursor: 'pointer', fontSize: '0.8rem' }}>Clear All</button>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: 200, overflowY: 'auto' }}>
                        {files.map((file, idx) => (
                          <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem', background: 'var(--glass-bg-strong)', borderRadius: '4px', border: '1px solid var(--glass-border)' }}>
                            <span style={{ fontSize: '0.85rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '80%' }}>🖼 {file.name}</span>
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); setFiles(prev => prev.filter((_, i) => i !== idx)); }}
                              style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '1rem', lineHeight: 1 }}
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <button type="submit" className="btn btn-primary" disabled={files.length === 0} style={{ width: '100%', justifyContent: 'center', padding: '0.9rem' }}>
                    🚀 Evaluate My UX
                  </button>
                </>
              )}
            </form>

            <p style={{ color: 'var(--text-tertiary)', fontSize: '0.8rem', textAlign: 'center', marginTop: '1rem' }}>
              {mode === 'url'
                ? 'Navigates your site/Figma, captures every screen, and runs a full AI audit on each one.'
                : 'Upload multiple screenshots to evaluate design coherence and individual screens.'
              }
            </p>

            {/* Live Evaluation Stats */}
            <div className="hero-evaluate-stats">
              <div className="hero-stat-card glass-panel">
                <span className="hero-stat-card__value">18,450+</span>
                <div className="hero-stat-card__label">Screens Audited</div>
                <div className="hero-stat-card__subtext">Websites &amp; Figma</div>
              </div>
              <div className="hero-stat-card glass-panel">
                <span className="hero-stat-card__value">&lt; 60s</span>
                <div className="hero-stat-card__label">Average Speed</div>
                <div className="hero-stat-card__subtext">Real-time Vision AI</div>
              </div>
              <div className="hero-stat-card glass-panel">
                <span className="hero-stat-card__value">11</span>
                <div className="hero-stat-card__label">UX Dimensions</div>
                <div className="hero-stat-card__subtext">Nielsen, UX Laws &amp; WCAG</div>
              </div>
              <div className="hero-stat-card glass-panel">
                <span className="hero-stat-card__value">4.9 / 5</span>
                <div className="hero-stat-card__label">Designer Rating</div>
                <div className="hero-stat-card__subtext">1,840+ Reviews</div>
              </div>
            </div>

            {/* Trust Badges */}
            <div className="hero-trust-bar">
              <span className="hero-trust-badge">⚡ 10 Nielsen Heuristics</span>
              <span className="hero-trust-badge">🧠 10 Laws of UX</span>
              <span className="hero-trust-badge">🎨 Color Psychology</span>
              <span className="hero-trust-badge">♿ WCAG 2.2 Accessibility</span>
              <span className="hero-trust-badge">📄 Executive PDF Export</span>
            </div>
          </div>
        </section>
      )}

      {/* ─── HOME AEO / FAQ SECTION (Matches HOME_SCHEMA cleanly) ─── */}
      {!hasResults && !loading && (
        <section className="container" style={{ maxWidth: '860px', margin: '0 auto 4rem', padding: '0 1rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
            <h2 style={{ fontSize: 'clamp(1.4rem, 3vw, 1.9rem)', marginBottom: '0.5rem' }}>
              Frequently Asked <span className="text-gradient">Questions</span>
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem' }}>
              Everything you need to know about AI UX evaluations, Laws of UX, Color Psychology, and PDF reports.
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {HOME_FAQS.map((faq, idx) => {
              const isOpen = openHomeFaq === idx;
              return (
                <div
                  key={faq.q}
                  className="glass-panel"
                  style={{ borderRadius: 'var(--radius-sm)', border: '1px solid var(--glass-border)', overflow: 'hidden' }}
                >
                  <button
                    type="button"
                    onClick={() => setOpenHomeFaq(isOpen ? null : idx)}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      background: 'transparent',
                      border: 'none',
                      padding: '1rem 1.25rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      cursor: 'pointer',
                      color: 'var(--text-primary)',
                      fontSize: '0.95rem',
                      fontWeight: 600,
                    }}
                  >
                    <span>{faq.q}</span>
                    <span style={{ fontSize: '1.2rem', color: 'var(--accent-cyan)' }}>{isOpen ? '−' : '+'}</span>
                  </button>
                  {isOpen && (
                    <div style={{ padding: '0 1.25rem 1rem', color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ─── RESULTS AREA ─── */}
      <div className="container">
        {error && (
          <div style={{ color: 'var(--error)', textAlign: 'center', marginTop: '1rem', padding: '1rem', background: 'rgba(239,68,68,0.07)', borderRadius: 'var(--radius-md)', maxWidth: 700, margin: '1rem auto', border: '1px solid rgba(239,68,68,0.15)' }}>
            ⚠ {error}
          </div>
        )}

        {loading && (
          <div className="loader-container">
            {currentPreview ? (
              <div className="scanner-container">
                <img src={currentPreview} alt="Scanning..." className="scanner-image" />
                <div className="scanner-laser"></div>
                <div className="scanner-overlay"></div>
              </div>
            ) : (
              <div className="spinner"></div>
            )}
            <h2>{progress.total > 0 ? `Evaluating Screen ${progress.current} of ${progress.total}` : 'Starting...'}</h2>
            <p style={{ color: 'var(--text-secondary)' }}>{status}</p>
            {progress.total > 0 && (
              <div style={{ width: 300, height: 6, background: 'var(--glass-border)', borderRadius: 3, overflow: 'hidden', marginTop: '1rem' }}>
                <div style={{ height: '100%', width: `${(progress.current / progress.total) * 100}%`, background: 'var(--accent-gradient)', borderRadius: 3, transition: 'width 0.5s ease' }}></div>
              </div>
            )}
          </div>
        )}

        {screens.length > 0 && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
              <h2 style={{ fontSize: '1.5rem' }}>{done ? `✅ ${screens.length} Screens Evaluated` : `⏳ Evaluating... (${screens.length} done)`}</h2>
              <div style={{ display: 'flex', gap: '1rem' }}>
                {done && (
                  <button className="btn" onClick={handleDownload} disabled={pdfLoading} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {pdfLoading ? <><span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }}></span> Generating PDF...</> : '⬇ Download PDF Report'}
                  </button>
                )}
                {done && <button className="btn btn-primary" onClick={reset}>+ New Evaluation</button>}
              </div>
            </div>

            {/* ── Save Report Banner for guests ── */}
            {done && !user && (
              <div
                style={{
                  marginBottom: '2rem',
                  padding: '1.25rem 1.75rem',
                  borderRadius: 'var(--radius-lg)',
                  background: 'linear-gradient(135deg, rgba(108,92,231,0.15), rgba(168,85,247,0.1))',
                  border: '1.5px solid rgba(108,92,231,0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '1rem',
                  boxShadow: '0 4px 24px rgba(108,92,231,0.15)',
                }}
              >
                <div>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#a855f7', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.3rem' }}>
                    💾 Report not saved
                  </div>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Create a free account to save, revisit & download this report
                  </h3>
                  <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    Sign in with Google in one click — history, PDF exports & more.
                  </p>
                </div>
                <button
                  onClick={() => { setAuthGateReason('download'); setShowAuthGate(true); }}
                  className="btn btn-primary"
                  style={{ whiteSpace: 'nowrap', padding: '0.75rem 1.5rem' }}
                >
                  🚀 Save My Report
                </button>
              </div>
            )}

            {/* Professional UX Fixes CTA Banner */}
            {done && (
              <div
                className="glass-panel"
                style={{
                  marginBottom: '2.5rem',
                  padding: '1.75rem 2rem',
                  background: 'linear-gradient(135deg, rgba(0,240,255,0.08), rgba(139,92,246,0.08))',
                  border: '1.5px solid rgba(0,240,255,0.3)',
                  borderRadius: 'var(--radius-lg)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '1.5rem',
                  boxShadow: '0 8px 32px rgba(0,240,255,0.12)',
                }}
              >
                <div style={{ flex: '1 1 380px' }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.25rem 0.75rem', background: 'rgba(0,240,255,0.15)', borderRadius: '50px', fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-cyan)', marginBottom: '0.5rem' }}>
                    ✨ Flat-Rate UX Optimization
                  </div>
                  <h3 style={{ fontSize: '1.25rem', color: 'var(--text-primary)', marginBottom: '0.35rem', fontFamily: 'var(--font-heading)' }}>
                    Want Us to Redesign & Fix These UX Issues For You?
                  </h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>
                    Don&apos;t let usability flaws cost you customers. Our senior design team at{' '}
                    <a href="https://devdesigns.net" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-cyan)', textDecoration: 'none', fontWeight: 600 }}>Dev Designs</a>{' '}
                    can fix all identified issues with a transparent, minimal fee.
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <a
                    href="https://devdesigns.net"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-primary"
                    style={{ padding: '0.85rem 1.75rem', fontSize: '0.95rem', whiteSpace: 'nowrap' }}
                  >
                    🚀 Hire DevDesigns.net →
                  </a>
                  <Link
                    to="/contact"
                    className="btn btn-secondary"
                    style={{ padding: '0.85rem 1.4rem', fontSize: '0.95rem', whiteSpace: 'nowrap' }}
                  >
                    💬 Contact Support
                  </Link>
                </div>
              </div>
            )}

            <Suspense fallback={<div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading report...</div>}>
              <MultiReport screens={screens} aggregate={aggregate} loading={loading} />
            </Suspense>
          </div>
        )}
      </div>
    </>
  );
}

function Footer() {
  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <div className="site-footer__brand">
          <Link to="/" style={{ textDecoration: 'none', display: 'inline-block', marginBottom: '0.5rem' }}>
            <Logo size="small" animated={true} />
          </Link>
          <p>AI-powered UX evaluation for designers, founders, and product teams.</p>
        </div>
        <div className="site-footer__links">
          <div>
            <p className="site-footer__heading">Product</p>
            <Link to="/">AI Evaluator</Link>
            <Link to="/plans">Pricing &amp; Plans</Link>
            <Link to="/dashboard">Dashboard</Link>
          </div>
          <div>
            <p className="site-footer__heading">Resources</p>
            <Link to="/ux-laws">10 Laws of UX</Link>
            <Link to="/blog">UX Blog &amp; Insights</Link>
            <Link to="/blog/how-to-conduct-ai-ux-audit-in-2026">AI Audit Guide</Link>
            <Link to="/blog/jakob-nielsen-10-heuristics-modern-web-examples">Nielsen Heuristics</Link>
            <Link to="/blog/wcag-2-2-accessibility-checklist-for-designers">WCAG 2.2 Checklist</Link>
          </div>
          <div>
            <p className="site-footer__heading">Company</p>
            <Link to="/about">About Us</Link>
            <a href="https://devdesigns.net" target="_blank" rel="noopener noreferrer">Dev Designs Studio</a>
            <Link to="/contact">Contact Support</Link>
            <Link to="/terms">Terms &amp; Conditions</Link>
            <Link to="/privacy">Privacy Policy</Link>
          </div>
        </div>
      </div>
      <div className="site-footer__bottom">
        <span>© {new Date().getFullYear()} Rate My UX. All rights reserved.</span>
        <span>
          Powered by <a href="https://devdesigns.net" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-cyan)', textDecoration: 'none', fontWeight: 600 }}>Dev Designs</a>
        </span>
      </div>
    </footer>
  );
}

function App() {
  return (
    <AuthProvider>
      <Navbar />
      <main id="main-content">
        <Suspense fallback={<div style={{ minHeight: '65vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>Loading...</div>}>
          <Routes>
            <Route path="/" element={<EvaluatorPage />} />
            <Route path="/about" element={<div className="container"><AboutPage /></div>} />
            <Route path="/plans" element={<div className="container"><PlansPage /></div>} />
            <Route path="/contact" element={<div className="container"><ContactPage /></div>} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/ux-laws" element={<div className="container"><UxLawsPage /></div>} />
            <Route path="/blog" element={<BlogPage />} />
            <Route path="/blog/:slug" element={<BlogPostPage />} />
            <Route path="/terms" element={<div className="container"><TermsPage /></div>} />
            <Route path="/privacy" element={<div className="container"><PrivacyPage /></div>} />
            <Route path="/admin" element={<div className="container"><AdminPage /></div>} />
          </Routes>
        </Suspense>
      </main>
      <Footer />
    </AuthProvider>
  );
}

export default App;
