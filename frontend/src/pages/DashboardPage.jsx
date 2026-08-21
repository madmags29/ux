import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import SEO from '../components/SEO';
import MultiReport from '../components/MultiReport';
import { generatePDF } from '../utils/generatePDF';

const API_URL = import.meta.env.VITE_API_URL || '';

export default function DashboardPage() {
  const { user, token, logout } = useAuth();
  const [evaluations, setEvaluations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEval, setSelectedEval] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [pdfLoadingId, setPdfLoadingId] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const loadUserEvaluations = async () => {
      if (!token) return;
      setLoading(true);
      try {
        const res = await fetch(`${API_URL}/api/user/evaluations`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          if (isMounted) setEvaluations(data.evaluations || []);
        }
      } catch (err) {
        console.error('Failed to load user audits:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadUserEvaluations();
    return () => { isMounted = false; };
  }, [token]);

  const handleDownloadPDF = async (item) => {
    if (!item || !item.screens) return;
    setPdfLoadingId(item.id);
    try {
      await generatePDF(item.screens, item.aggregate || {}, item.targetUrl || 'UX_Evaluation');
    } catch (err) {
      console.error('PDF export error:', err);
    } finally {
      setPdfLoadingId(null);
    }
  };

  if (!user) {
    return (
      <div className="container" style={{ padding: '4rem 1rem', textAlign: 'center' }}>
        <h2>Access Denied</h2>
        <p style={{ color: 'var(--text-secondary)' }}>Please sign in to view your user dashboard and audit history.</p>
      </div>
    );
  }

  const filteredEvals = evaluations.filter((item) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      (item.targetUrl && item.targetUrl.toLowerCase().includes(term)) ||
      (item.productName && item.productName.toLowerCase().includes(term)) ||
      (item.productCategory && item.productCategory.toLowerCase().includes(term))
    );
  });

  const avgScore = evaluations.length
    ? Math.round(evaluations.reduce((acc, curr) => acc + (curr.overallScore || 0), 0) / evaluations.length)
    : 0;

  const highestScore = evaluations.length
    ? Math.max(...evaluations.map((e) => e.overallScore || 0))
    : 0;

  return (
    <div className="container" style={{ padding: '3rem 1rem 5rem' }}>
      <SEO
        title="My Dashboard - Rate My UX"
        description="View your UX audit history, download evaluation reports, and track usability scores."
      />

      {/* Header Banner */}
      <div
        className="glass-card"
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1.5rem',
          padding: '2rem',
          marginBottom: '2rem',
          borderRadius: 'var(--radius-lg, 16px)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <img
            src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=6c5ce7&color=fff`}
            alt={user.name}
            style={{ width: '64px', height: '64px', borderRadius: '50%', border: '2px solid var(--accent-purple)' }}
          />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0 }}>{user.name}</h1>
              <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem', borderRadius: '20px', background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', border: '1px solid #38bdf8', fontWeight: 700 }}>
                {user.provider === 'google' ? 'Google Account' : 'Member'}
              </span>
            </div>
            <p style={{ color: 'var(--text-secondary)', margin: '0.25rem 0 0 0', fontSize: '0.9rem' }}>
              {user.email}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <Link to="/" className="btn btn-primary" style={{ padding: '0.55rem 1.1rem', fontSize: '0.875rem' }}>
            ⚡ Run Audit
          </Link>
          <Link to="/profile" className="btn btn-secondary" style={{ padding: '0.55rem 1.1rem', fontSize: '0.875rem' }}>
            ⚙️ Profile &amp; Security
          </Link>
          <button onClick={logout} className="btn btn-secondary" style={{ padding: '0.55rem 1.1rem', fontSize: '0.875rem' }}>
            Sign Out
          </button>
        </div>
      </div>

      {/* Stats Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2.5rem' }}>
        <div className="glass-card" style={{ padding: '1.25rem', borderRadius: '12px', textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--accent-cyan)' }}>{evaluations.length}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '0.25rem' }}>Total Audits</div>
        </div>

        <div className="glass-card" style={{ padding: '1.25rem', borderRadius: '12px', textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: avgScore >= 75 ? '#22c55e' : avgScore >= 50 ? '#eab308' : '#ef4444' }}>
            {avgScore ? `${avgScore}/100` : '—'}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '0.25rem' }}>Average Score</div>
        </div>

        <div className="glass-card" style={{ padding: '1.25rem', borderRadius: '12px', textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#a78bfa' }}>
            {highestScore ? `${highestScore}/100` : '—'}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '0.25rem' }}>Best Score</div>
        </div>
      </div>

      {/* Audit History Header & Filter */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: '1.25rem' }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          📊 My Audit History
        </h2>

        {evaluations.length > 0 && (
          <input
            type="text"
            placeholder="Search audits by URL or name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '8px',
              border: '1px solid var(--glass-border)',
              background: 'rgba(0, 0, 0, 0.25)',
              color: 'var(--text-primary)',
              fontSize: '0.875rem',
              minWidth: '260px',
            }}
          />
        )}
      </div>

      {/* Audit History List */}
      {loading ? (
        <div className="glass-card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
          Loading your evaluation records...
        </div>
      ) : evaluations.length === 0 ? (
        <div className="glass-card" style={{ padding: '3.5rem 2rem', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📋</div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>No evaluations yet</h3>
          <p style={{ fontSize: '1rem', marginBottom: '1.5rem', color: 'var(--text-secondary)', maxWidth: '400px', margin: '0 auto 1.5rem' }}>
            Run your first AI UX evaluation on your website or screenshot designs to see scores and recommendations here.
          </p>
          <Link to="/" className="btn btn-primary" style={{ padding: '0.75rem 1.5rem' }}>
            ⚡ Start Your First Evaluation
          </Link>
        </div>
      ) : filteredEvals.length === 0 ? (
        <div className="glass-card" style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
          No audits found matching "{searchTerm}".
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filteredEvals.map((item) => (
            <div
              key={item.id}
              className="glass-card"
              style={{
                padding: '1.25rem 1.5rem',
                borderRadius: '12px',
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '1rem',
              }}
            >
              <div style={{ flex: '1 1 300px' }}>
                <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-primary)' }}>
                  {item.productName || item.targetUrl}
                </div>
                <div style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                  {item.targetUrl} &bull; {new Date(item.createdAt || item.timestamp).toLocaleDateString()} &bull; {item.screenCount || 1} screen(s)
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                <div
                  style={{
                    padding: '0.35rem 0.75rem',
                    borderRadius: '20px',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    background:
                      (item.overallScore || 0) >= 80
                        ? 'rgba(34, 197, 94, 0.15)'
                        : (item.overallScore || 0) >= 60
                        ? 'rgba(234, 179, 8, 0.15)'
                        : 'rgba(239, 68, 68, 0.15)',
                    color:
                      (item.overallScore || 0) >= 80
                        ? '#22c55e'
                        : (item.overallScore || 0) >= 60
                        ? '#eab308'
                        : '#ef4444',
                    border: '1px solid currentColor',
                  }}
                >
                  Score: {item.overallScore || 0}/100
                </div>

                <button
                  onClick={() => setSelectedEval(selectedEval?.id === item.id ? null : item)}
                  className="btn btn-secondary"
                  style={{ padding: '0.4rem 0.85rem', fontSize: '0.85rem' }}
                >
                  {selectedEval?.id === item.id ? 'Hide Report' : '👁️ View Report'}
                </button>

                <button
                  onClick={() => handleDownloadPDF(item)}
                  disabled={pdfLoadingId === item.id}
                  className="btn btn-primary"
                  style={{ padding: '0.4rem 0.85rem', fontSize: '0.85rem' }}
                >
                  {pdfLoadingId === item.id ? 'Exporting...' : '📄 PDF'}
                </button>
              </div>

              {/* Expanded Report View */}
              {selectedEval?.id === item.id && (
                <div style={{ width: '100%', marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--glass-border)' }}>
                  <MultiReport screens={item.screens || []} aggregate={item.aggregate || {}} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
