import { useState, useEffect } from 'react';
import MultiReport from '../components/MultiReport';
import AnimatedSection from '../components/AnimatedSection';

export default function AdminPage() {
  const [token, setToken] = useState(() => localStorage.getItem('adminToken') || '');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [activeTab, setActiveTab] = useState('evaluations');
  const [evaluations, setEvaluations] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [inspectItem, setInspectItem] = useState(null);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError('');
    try {
      const res = await fetch(`${API_URL}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');
      localStorage.setItem('adminToken', data.token);
      setToken(data.token);
      setPassword('');
    } catch (err) {
      setAuthError(err.message);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    setToken('');
    setEvaluations([]);
    setContacts([]);
  };

  const fetchData = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [evalRes, contactRes] = await Promise.all([
        fetch(`${API_URL}/api/admin/evaluations`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/api/admin/contacts`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      const evalData = await evalRes.json();
      const contactData = await contactRes.json();

      if (evalRes.ok) setEvaluations(evalData.evaluations || []);
      if (contactRes.ok) setContacts(contactData.contacts || []);
    } catch (err) {
      console.error('Failed to fetch admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchData();
  }, [token]);

  const deleteEval = async (id) => {
    if (!confirm('Are you sure you want to delete this evaluation record?')) return;
    try {
      await fetch(`${API_URL}/api/admin/evaluations/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      setEvaluations(prev => prev.filter(e => e.id !== id));
      if (inspectItem?.id === id) setInspectItem(null);
    } catch (err) {
      alert('Delete failed');
    }
  };

  const deleteContact = async (id) => {
    if (!confirm('Are you sure you want to delete this inquiry?')) return;
    try {
      await fetch(`${API_URL}/api/admin/contacts/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      setContacts(prev => prev.filter(c => c.id !== id));
    } catch (err) {
      alert('Delete failed');
    }
  };

  // Filtering
  const filteredEvals = evaluations.filter(e =>
    (e.targetUrl || '').toLowerCase().includes(search.toLowerCase()) ||
    (e.productName || '').toLowerCase().includes(search.toLowerCase()) ||
    (e.finalVerdict || '').toLowerCase().includes(search.toLowerCase())
  );

  const filteredContacts = contacts.filter(c =>
    (c.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.email || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.subject || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.message || '').toLowerCase().includes(search.toLowerCase())
  );

  const avgScore = evaluations.length > 0
    ? Math.round(evaluations.reduce((acc, e) => acc + (e.overallScore || 0), 0) / evaluations.length)
    : 0;

  // ─── LOGIN SHIELD ───
  if (!token) {
    return (
      <div style={{ maxWidth: 420, margin: '6rem auto', padding: '1rem' }}>
        <AnimatedSection>
          <div className="glass-panel" style={{ padding: '2.5rem 2rem', textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🔐</div>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Admin Portal</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.75rem' }}>
              Enter password to access saved evaluations & contact inquiries.
            </p>

            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <input
                type="password"
                placeholder="Enter Admin Password..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
                required
                style={{ textAlign: 'center', fontSize: '1rem', letterSpacing: '0.1em' }}
              />
              {authError && (
                <div style={{ color: 'var(--error)', fontSize: '0.85rem', background: 'rgba(239,68,68,0.1)', padding: '0.5rem', borderRadius: '6px' }}>
                  ⚠️ {authError}
                </div>
              )}
              <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                Unlock Dashboard →
              </button>
            </form>
          </div>
        </AnimatedSection>
      </div>
    );
  }

  // ─── DASHBOARD ───
  return (
    <div style={{ paddingBottom: '5rem' }}>
      <AnimatedSection>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '2rem 0', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <span className="hero__badge" style={{ marginBottom: '0.5rem' }}>🛡️ Rate My UX Admin</span>
            <h1 style={{ fontSize: '2rem' }}>Control Center & Analytics</h1>
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button onClick={fetchData} className="btn" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
              🔄 Refresh
            </button>
            <button onClick={handleLogout} className="btn" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', color: 'var(--error)' }}>
              🔒 Logout
            </button>
          </div>
        </div>
      </AnimatedSection>

      {/* Overview Stat Cards */}
      <AnimatedSection delay={50}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '2.5rem' }}>
          <div className="glass-panel" style={{ padding: '1.5rem', textAlign: 'center' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Total UX Audits Run</div>
            <div className="text-gradient" style={{ fontSize: '2.5rem', fontWeight: 700, fontFamily: 'var(--font-heading)' }}>{evaluations.length}</div>
          </div>
          <div className="glass-panel" style={{ padding: '1.5rem', textAlign: 'center' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Average UX Score</div>
            <div className="text-gradient-warm" style={{ fontSize: '2.5rem', fontWeight: 700, fontFamily: 'var(--font-heading)' }}>{avgScore}/100</div>
          </div>
          <div className="glass-panel" style={{ padding: '1.5rem', textAlign: 'center' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Contact Form Leads</div>
            <div style={{ fontSize: '2.5rem', fontWeight: 700, fontFamily: 'var(--font-heading)', color: 'var(--accent-cyan)' }}>{contacts.length}</div>
          </div>
        </div>
      </AnimatedSection>

      {/* Tabs & Search */}
      <AnimatedSection delay={100}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem', background: 'var(--glass-bg)', padding: '4px', borderRadius: 'var(--radius-md)', border: '1px solid var(--glass-border)' }}>
            <button
              onClick={() => setActiveTab('evaluations')}
              className={`tab-btn ${activeTab === 'evaluations' ? 'active' : ''}`}
              style={{ padding: '0.6rem 1.25rem', border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontWeight: 600, fontSize: '0.88rem' }}
            >
              📊 Saved Audits ({evaluations.length})
            </button>
            <button
              onClick={() => setActiveTab('contacts')}
              className={`tab-btn ${activeTab === 'contacts' ? 'active' : ''}`}
              style={{ padding: '0.6rem 1.25rem', border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontWeight: 600, fontSize: '0.88rem' }}
            >
              ✉️ Contact Inquiries ({contacts.length})
            </button>
          </div>

          <input
            type="text"
            placeholder="Filter by keyword, URL, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field"
            style={{ maxWidth: 300, fontSize: '0.85rem', padding: '0.55rem 1rem' }}
          />
        </div>
      </AnimatedSection>

      {loading && (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
          <span className="spinner" style={{ width: 24, height: 24, margin: '0 auto 1rem auto' }} />
          Loading admin records...
        </div>
      )}

      {/* ─── EVALUATIONS TAB ─── */}
      {!loading && activeTab === 'evaluations' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filteredEvals.length === 0 ? (
            <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-tertiary)' }}>
              No evaluations found.
            </div>
          ) : (
            filteredEvals.map((item) => (
              <div
                key={item.id}
                className="glass-panel"
                style={{
                  padding: '1.25rem 1.5rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '1rem',
                }}
              >
                <div style={{ flex: '1 1 300px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.35rem' }}>
                    <span style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-primary)' }}>
                      {item.productName || 'Evaluated Product'}
                    </span>
                    <span style={{ fontSize: '0.75rem', padding: '0.15rem 0.5rem', background: 'rgba(0, 240, 255, 0.1)', border: '1px solid rgba(0, 240, 255, 0.2)', borderRadius: '50px', color: 'var(--accent-cyan)' }}>
                      {item.productCategory || 'Web App'}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                      {item.screenCount} screens · {new Date(item.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    🌐 {item.targetUrl}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                  <div style={{ textAlign: 'right' }}>
                    <div className="text-gradient" style={{ fontSize: '1.4rem', fontWeight: 700, fontFamily: 'var(--font-heading)' }}>
                      {item.overallScore}/100
                    </div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--accent-cyan)' }}>
                      {item.finalVerdict}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      onClick={() => setInspectItem(item)}
                      className="btn"
                      style={{ padding: '0.45rem 0.9rem', fontSize: '0.8rem' }}
                    >
                      👁 View Report
                    </button>
                    <button
                      onClick={() => deleteEval(item.id)}
                      className="btn"
                      style={{ padding: '0.45rem 0.6rem', fontSize: '0.8rem', color: 'var(--error)' }}
                    >
                      🗑
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ─── CONTACTS TAB ─── */}
      {!loading && activeTab === 'contacts' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filteredContacts.length === 0 ? (
            <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-tertiary)' }}>
              No contact messages received yet.
            </div>
          ) : (
            filteredContacts.map((c) => (
              <div
                key={c.id}
                className="glass-panel"
                style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-primary)' }}>{c.name}</span>
                    <a href={`mailto:${c.email}`} style={{ color: 'var(--accent-cyan)', fontSize: '0.9rem', fontWeight: 500 }}>
                      ✉️ {c.email}
                    </a>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                      {new Date(c.timestamp).toLocaleString()}
                    </span>
                    <button
                      onClick={() => deleteContact(c.id)}
                      className="btn"
                      style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem', color: 'var(--error)' }}
                    >
                      🗑 Delete
                    </button>
                  </div>
                </div>

                <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--accent-violet)' }}>
                  Topic: {c.subject}
                </div>

                <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)', padding: '1rem', borderRadius: 'var(--radius-sm)', fontSize: '0.9rem', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                  {c.message}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ─── REPORT INSPECTOR MODAL ─── */}
      {inspectItem && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(10,10,26,0.92)', backdropFilter: 'blur(15px)', zIndex: 9999, overflowY: 'auto', padding: '2rem 1rem' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', background: 'var(--glass-bg)', padding: '1rem 1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--glass-border)' }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', color: 'var(--text-primary)' }}>
                  Inspecting Audit: {inspectItem.productName || inspectItem.targetUrl}
                </h2>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
                  {inspectItem.targetUrl} · Recorded {new Date(inspectItem.timestamp).toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => setInspectItem(null)}
                className="btn btn-primary"
                style={{ padding: '0.5rem 1.25rem' }}
              >
                ✕ Close Inspector
              </button>
            </div>

            <MultiReport screens={inspectItem.screens || []} aggregate={inspectItem.aggregate} loading={false} />
          </div>
        </div>
      )}
    </div>
  );
}
