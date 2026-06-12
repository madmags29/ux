import { useState, useRef } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import MultiReport from './components/MultiReport';
import { generatePDF } from './utils/generatePDF';
import Navbar from './components/Navbar';
import AboutPage from './pages/AboutPage';
import PlansPage from './pages/PlansPage';
import ContactPage from './pages/ContactPage';
import './index.css';

function EvaluatorPage() {
  const [mode, setMode] = useState('url'); // 'url' | 'upload'
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
          <a href="/plans" style={{ color: 'var(--accent-primary)', textDecoration: 'underline', fontWeight: 600 }}>
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
      const response = await fetch('http://localhost:3001/api/evaluate', {
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
    <div className="container">
      <header className="header">
        <h1 className="text-gradient">AI UX Expert Evaluator</h1>
        <p>Evaluates every screen of your prototype with AI Vision — screenshots, scores, and actionable insights.</p>
      </header>

      {!hasResults && !loading && (
        <div style={{ maxWidth: 700, margin: '0 auto' }}>
          <div className="tabs-container" style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', marginBottom: '1.5rem', background: 'rgba(255,255,255,0.05)', padding: '4px', borderRadius: 'var(--radius-md)', border: '1px solid var(--glass-border)', maxWidth: 420, margin: '0 auto 1.5rem auto' }}>
            <button
              type="button"
              onClick={() => setMode('url')}
              className={`tab-btn ${mode === 'url' ? 'active' : ''}`}
              style={{
                flex: 1,
                padding: '0.6rem 1rem',
                border: 'none',
                borderRadius: 'calc(var(--radius-md) - 2px)',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.85rem',
                transition: 'all 0.3s ease',
                background: mode === 'url' ? 'var(--glass-bg)' : 'transparent',
                color: mode === 'url' ? 'var(--text-primary)' : 'var(--text-secondary)',
                boxShadow: mode === 'url' ? '0 4px 12px rgba(0,0,0,0.1)' : 'none',
                border: mode === 'url' ? '1px solid var(--glass-border)' : '1px solid transparent'
              }}
            >
              🌐 Evaluate URL / Figma
            </button>
            <button
              type="button"
              onClick={() => setMode('upload')}
              className={`tab-btn ${mode === 'upload' ? 'active' : ''}`}
              style={{
                flex: 1,
                padding: '0.6rem 1rem',
                border: 'none',
                borderRadius: 'calc(var(--radius-md) - 2px)',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.85rem',
                transition: 'all 0.3s ease',
                background: mode === 'upload' ? 'var(--glass-bg)' : 'transparent',
                color: mode === 'upload' ? 'var(--text-primary)' : 'var(--text-secondary)',
                boxShadow: mode === 'upload' ? '0 4px 12px rgba(0,0,0,0.1)' : 'none',
                border: mode === 'upload' ? '1px solid var(--glass-border)' : '1px solid transparent'
              }}
            >
              📁 Upload Screenshots
            </button>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {mode === 'url' ? (
              <>
                <input type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://your-prototype-or-website.com or figma.com/proto/..." className="input-field" required />
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', width: '100%' }}>
                  <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>🔍 Evaluate My UX</button>
                </div>
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
                    padding: '2rem',
                    textAlign: 'center',
                    cursor: 'pointer',
                    background: 'rgba(255,255,255,0.02)',
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
                  <h3 style={{ fontSize: '1.1rem', marginBottom: '0.25rem' }}>Drag & drop prototype screenshots here</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>or click to browse from your device (PNG, JPG, WEBP)</p>
                </div>

                {files.length > 0 && (
                  <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-md)', padding: '1rem', border: '1px solid var(--glass-border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                      <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Selected Screens ({files.length})</span>
                      <button type="button" onClick={() => setFiles([])} style={{ background: 'none', border: 'none', color: 'var(--error)', cursor: 'pointer', fontSize: '0.8rem' }}>Clear All</button>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: 200, overflowY: 'auto' }}>
                      {files.map((file, idx) => (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem', background: 'rgba(255,255,255,0.03)', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.05)' }}>
                          <span style={{ fontSize: '0.85rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '80%' }}>🖼 {file.name}</span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setFiles(prev => prev.filter((_, i) => i !== idx));
                            }}
                            style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '1rem', lineHeight: 1 }}
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={files.length === 0}
                  style={{ width: '100%', padding: '0.8rem' }}
                >
                  🚀 Evaluate My UX
                </button>
              </>
            )}
          </form>
          <p style={{ color: 'var(--text-tertiary)', fontSize: '0.8rem', textAlign: 'center', marginTop: '0.75rem' }}>
            {mode === 'url' 
              ? "Navigates your site/Figma, captures every screen, and runs a full AI audit on each one."
              : "Upload multiple screenshots of your app pages to evaluate the design coherence and individual screens."
            }
          </p>
        </div>
      )}

      {error && (
        <div style={{ color: 'var(--error)', textAlign: 'center', marginTop: '1rem', padding: '1rem', background: 'rgba(220,38,38,0.07)', borderRadius: 'var(--radius-md)', maxWidth: 700, margin: '1rem auto', border: '1px solid rgba(220,38,38,0.15)' }}>
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
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
          <MultiReport screens={screens} aggregate={aggregate} loading={loading} />
        </div>
      )}
    </div>
  );
}

function Footer() {
  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <div className="site-footer__brand">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <div className="navbar__logo-icon" style={{ overflow: 'hidden', width: '28px', height: '28px' }}>
              <img src="/logo.png" alt="UX Expert Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <span className="navbar__logo-text" style={{ fontSize: '1.1rem' }}>UX<span className="navbar__logo-accent">Expert</span></span>
          </div>
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
          </div>
        </div>
      </div>
      <div className="site-footer__bottom">
        <span>© {new Date().getFullYear()} UX Expert. All rights reserved.</span>
        <span>Powered by Expert AI Vision</span>
      </div>
    </footer>
  );
}

function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<EvaluatorPage />} />
        <Route path="/about" element={<div className="container"><AboutPage /></div>} />
        <Route path="/plans" element={<div className="container"><PlansPage /></div>} />
        <Route path="/contact" element={<div className="container"><ContactPage /></div>} />
      </Routes>
      <Footer />
    </>
  );
}

export default App;


