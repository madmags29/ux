import { useState, useRef } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import MultiReport from './components/MultiReport';
import { generatePDF } from './utils/generatePDF';
import Navbar from './components/Navbar';
import ParticleCanvas from './components/ParticleCanvas';
import AnimatedSection from './components/AnimatedSection';
import AboutPage from './pages/AboutPage';
import PlansPage from './pages/PlansPage';
import ContactPage from './pages/ContactPage';
import AdminPage from './pages/AdminPage';
import Logo from './components/Logo';
import SEO from './components/SEO';
import './index.css';

function EvaluatorPage() {
  const [mode, setMode] = useState('url');
  const [url, setUrl] = useState('');
  const [files, setFiles] = useState([]);
  const [maxScreens, setMaxScreens] = useState(3);
  const [loading, setLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [screens, setScreens] = useState([]);
  const [aggregate, setAggregate] = useState(null);
  const [error, setError] = useState(null);
  const [done, setDone] = useState(false);
  const [currentPreview, setCurrentPreview] = useState(null);
  const abortRef = useRef(null);

  const reset = () => {
    setUrl('');
    setFiles([]);
    setLoading(false);
    setStatus('');
    setProgress({ current: 0, total: 0 });
    setScreens([]);
    setAggregate(null);
    setError(null);
    setDone(false);
    setCurrentPreview(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (mode === 'url' && !url) return;
    if (mode === 'upload' && files.length === 0) return;

    if (mode === 'upload' && files.length > 3) {
      setError(
        <span>
          <strong>⚠️ Free Plan Limit Exceeded:</strong> You have uploaded {files.length} screens. The free plan only supports evaluating up to 3 screens. Please{' '}
          <a href="/plans" style={{ color: 'var(--accent-cyan)', textDecoration: 'underline', fontWeight: 600 }}>
            purchase a plan
          </a>{' '}
          to evaluate more screens.
        </span>
      );
      return;
    }

    reset();
    setLoading(true);
    abortRef.current = new AbortController();

    if (mode === 'upload' && files.length > 0) {
      const reader = new FileReader();
      reader.onload = (event) => setCurrentPreview(event.target.result);
      reader.readAsDataURL(files[0]);
    }

    const formData = new FormData();
    if (mode === 'url') {
      formData.append('url', url);
      formData.append('maxScreens', maxScreens);
    } else {
      files.forEach(file => {
        formData.append('images', file);
      });
    }

    try {
      const API_URL = import.meta.env.VITE_API_URL || 'https://www.ratemyux.com';
      const response = await fetch(`${API_URL}/api/evaluate`, {
        method: 'POST',
        body: formData,
        signal: abortRef.current?.signal
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
          try { handleEvent(JSON.parse(line.slice(6))); } catch {}
        }
      }
    } catch (err) {
      if (err.name !== 'AbortError') setError(err.message);
    } finally {
      setLoading(false);
    }
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
    setPdfLoading(true);
    try { await generatePDF(screens, aggregate); }
    catch (err) { alert('PDF generation failed: ' + err.message); }
    finally { setPdfLoading(false); }
  };

  const hasResults = screens.length > 0 || aggregate;

  return (
    <>
      <SEO
        title="Rate My UX | AI-Powered UX Evaluation & Design Auditing Tool"
        description="Rate My UX is an AI-powered UX evaluation platform that audits your website, app, or Figma prototype using advanced Vision AI. Get 11-dimension usability scores, Nielsen heuristic checks, WCAG accessibility reports, and prioritized design roadmaps instantly."
        canonicalPath="/"
      />
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
              scores 11 dimensions, and delivers an actionable UX roadmap in seconds.
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
                      placeholder="https://your-prototype.com or figma.com/proto/..."
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
                    <h3 style={{ fontSize: '1rem', marginBottom: '0.25rem', color: 'var(--text-primary)' }}>Drag & drop prototype screenshots here</h3>
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
                ? "Navigates your site/Figma, captures every screen, and runs a full AI audit on each one."
                : "Upload multiple screenshots to evaluate design coherence and individual screens."
              }
            </p>
          </div>
        </section>
      )}

      {/* ─── RESULTS AREA (inside container) ─── */}
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

            {/* Professional UX Fixes CTA Banner */}
            {done && (
              <div
                className="glass-panel"
                style={{
                  marginBottom: '2.5rem',
                  padding: '1.75rem 2rem',
                  background: 'linear-gradient(135deg, rgba(0, 240, 255, 0.08), rgba(139, 92, 246, 0.08))',
                  border: '1.5px solid rgba(0, 240, 255, 0.3)',
                  borderRadius: 'var(--radius-lg)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '1.5rem',
                  boxShadow: '0 8px 32px rgba(0, 240, 255, 0.12)'
                }}
              >
                <div style={{ flex: '1 1 380px' }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.25rem 0.75rem', background: 'rgba(0, 240, 255, 0.15)', borderRadius: '50px', fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-cyan)', marginBottom: '0.5rem' }}>
                    ✨ Flat-Rate UX Optimization
                  </div>
                  <h3 style={{ fontSize: '1.25rem', color: 'var(--text-primary)', marginBottom: '0.35rem', fontFamily: 'var(--font-heading)' }}>
                    Want Us to Redesign & Fix These UX Issues For You?
                  </h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>
                    Don't let usability flaws cost you customers. Our senior design team can fix all identified issues with a transparent, minimal fee.
                  </p>
                </div>
                <Link
                  to="/contact"
                  className="btn btn-primary"
                  style={{
                    padding: '0.85rem 1.75rem',
                    fontSize: '0.95rem',
                    whiteSpace: 'nowrap'
                  }}
                >
                  💬 Get UX Help Now →
                </Link>
              </div>
            )}

            <MultiReport screens={screens} aggregate={aggregate} loading={loading} />
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
            <Link to="/">Evaluator</Link>
            <Link to="/plans">Pricing</Link>
          </div>
          <div>
            <p className="site-footer__heading">Company</p>
            <Link to="/about">About</Link>
            <Link to="/contact">Contact</Link>
            <Link to="/admin" style={{ opacity: 0.6 }}>Admin</Link>
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
    <>
      <Navbar />
      <main id="main-content">
        <Routes>
          <Route path="/" element={<EvaluatorPage />} />
          <Route path="/about" element={<div className="container"><AboutPage /></div>} />
          <Route path="/plans" element={<div className="container"><PlansPage /></div>} />
          <Route path="/contact" element={<div className="container"><ContactPage /></div>} />
          <Route path="/admin" element={<div className="container"><AdminPage /></div>} />
        </Routes>
      </main>
      <Footer />
    </>
  );
}

export default App;
