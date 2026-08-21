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
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [inspectItem, setInspectItem] = useState(null);

  const API_URL = import.meta.env.VITE_API_URL || '';

  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError('');
    try {
      const res = await fetch(`${API_URL}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      let data = {};
      try {
        data = await res.json();
      } catch (jsonErr) {
        throw new Error(`Server returned HTTP ${res.status}`, { cause: jsonErr });
      }
      if (!res.ok) throw new Error(data.error || `Login failed (HTTP ${res.status})`);
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
    setUsers([]);
  };

  useEffect(() => {
    if (!token) return;
    let isMounted = true;
    const loadAdminData = async () => {
      setLoading(true);
      try {
        const [evalRes, contactRes, userRes] = await Promise.all([
          fetch(`${API_URL}/api/admin/evaluations`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API_URL}/api/admin/contacts`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API_URL}/api/admin/users`, { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        let evalData = {};
        let contactData = {};
        let userData = {};
        try { evalData = await evalRes.json(); } catch (err) { console.warn('Invalid eval JSON response:', err); }
        try { contactData = await contactRes.json(); } catch (err) { console.warn('Invalid contact JSON response:', err); }
        try { userData = await userRes.json(); } catch (err) { console.warn('Invalid user JSON response:', err); }

        if (isMounted) {
          if (evalRes.ok) setEvaluations(evalData.evaluations || []);
          if (contactRes.ok) setContacts(contactData.contacts || []);
          if (userRes.ok) setUsers(userData.users || []);
        }
      } catch (err) {
        console.error('Failed to fetch admin data:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadAdminData();
    return () => { isMounted = false; };
  }, [token, API_URL]);

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
      alert('Delete failed: ' + (err.message || 'Error'));
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
      alert('Delete failed: ' + (err.message || 'Error'));
    }
  };

  const deleteUser = async (id) => {
    if (!confirm('Are you sure you want to delete this user account?')) return;
    try {
      await fetch(`${API_URL}/api/admin/users/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(prev => prev.filter(u => u.id !== id));
    } catch (err) {
      alert('Delete failed: ' + (err.message || 'Error'));
    }
  };

  if (!token) {
    return (
      <div style={{ maxWidth: 420, margin: '4rem auto', padding: '0 1rem' }}>
        <div className="glass-panel" style={{ padding: '2.5rem', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔐</div>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Admin Portal</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
            Enter administrator password to access dashboard details.
          </p>
          {authError && (
            <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444', padding: '0.75rem', borderRadius: 'var(--radius-sm)', marginBottom: '1rem', fontSize: '0.85rem' }}>
              {authError}
            </div>
          )}
          <form onSubmit={handleLogin}>
            <input
              type="password"
              placeholder="Enter Admin Password..."
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field"
              style={{ marginBottom: '1rem' }}
            />
            <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
              Authenticate
            </button>
          </form>
        </div>
      </div>
    );
  }

  const filteredEvals = evaluations.filter(e =>
    (e.targetUrl || '').toLowerCase().includes(search.toLowerCase()) ||
    (e.productName || '').toLowerCase().includes(search.toLowerCase()) ||
    (e.id || '').toLowerCase().includes(search.toLowerCase())
  );

  const filteredContacts = contacts.filter(c =>
    (c.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.email || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.subject || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.message || '').toLowerCase().includes(search.toLowerCase())
  );

  const filteredUsers = users.filter(u =>
    (u.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (u.email || '').toLowerCase().includes(search.toLowerCase()) ||
    (u.provider || '').toLowerCase().includes(search.toLowerCase())
  );

  const avgScore = evaluations.length
    ? Math.round(evaluations.reduce((acc, curr) => acc + (curr.overallScore || 0), 0) / evaluations.length)
    : 0;

  return (
    <div style={{ maxWidth: 1200, margin: '2rem auto', padding: '0 1rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <span className="hero__badge" style={{ marginBottom: '0.5rem' }}>🛡️ Rate My UX Admin</span>
          <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>Admin Dashboard</h1>
        </div>
        <button onClick={handleLogout} className="btn btn-secondary">
          Sign Out Admin
        </button>
      </div>

      {/* Overview Stat Cards */}
      <AnimatedSection delay={50}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem', marginBottom: '2.5rem' }}>
          <div className="glass-panel" style={{ padding: '1.5rem', textAlign: 'center' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Total UX Audits Run</div>
            <div className="text-gradient" style={{ fontSize: '2.5rem', fontWeight: 700, fontFamily: 'var(--font-heading)' }}>{evaluations.length}</div>
          </div>
          <div className="glass-panel" style={{ padding: '1.5rem', textAlign: 'center' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Registered Users</div>
            <div style={{ fontSize: '2.5rem', fontWeight: 700, fontFamily: 'var(--font-heading)', color: 'var(--accent-purple, #6c5ce7)' }}>{users.length}</div>
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
              onClick={() => setActiveTab('users')}
              className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
              style={{ padding: '0.6rem 1.25rem', border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontWeight: 600, fontSize: '0.88rem' }}
            >
              👥 Registered Users ({users.length})
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
            placeholder="Filter records..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field"
            style={{ maxWidth: 300, fontSize: '0.85rem', padding: '0.55rem 1rem' }}
          />
        </div>
      </AnimatedSection>

      {loading && (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
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
                      {item.productName || item.targetUrl}
                    </span>
                    <span style={{
                      padding: '0.2rem 0.5rem',
                      borderRadius: '12px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      background: (item.overallScore || 0) >= 80 ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                      color: (item.overallScore || 0) >= 80 ? '#22c55e' : '#ef4444',
                    }}>
                      Score: {item.overallScore || 0}/100
                    </span>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)' }}>
                    URL: {item.targetUrl} &bull; Date: {new Date(item.createdAt || item.timestamp).toLocaleString()}
                    {item.userId && <span style={{ color: 'var(--accent-cyan)', marginLeft: '0.5rem' }}>&bull; User Linked</span>}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button onClick={() => setInspectItem(inspectItem?.id === item.id ? null : item)} className="btn btn-secondary" style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}>
                    {inspectItem?.id === item.id ? 'Close' : 'Inspect'}
                  </button>
                  <button onClick={() => deleteEval(item.id)} className="btn btn-secondary" style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem', color: '#ef4444' }}>
                    Delete
                  </button>
                </div>

                {inspectItem?.id === item.id && (
                  <div style={{ width: '100%', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--glass-border)' }}>
                    <MultiReport screens={item.screens || []} aggregate={item.aggregate || {}} />
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* ─── REGISTERED USERS TAB ─── */}
      {!loading && activeTab === 'users' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filteredUsers.length === 0 ? (
            <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-tertiary)' }}>
              No registered users found.
            </div>
          ) : (
            filteredUsers.map((u) => (
              <div
                key={u.id}
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <img
                    src={u.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}&background=6c5ce7&color=fff`}
                    alt={u.name}
                    style={{ width: '48px', height: '48px', borderRadius: '50%' }}
                  />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-primary)' }}>{u.name}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)' }}>
                      {u.email} &bull; Provider: <span style={{ textTransform: 'capitalize', color: 'var(--accent-cyan)' }}>{u.provider || 'email'}</span> &bull; Joined: {new Date(u.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <span style={{ padding: '0.35rem 0.75rem', borderRadius: '20px', background: 'rgba(255, 255, 255, 0.05)', fontSize: '0.85rem', fontWeight: 600 }}>
                    Audits Run: {u.evalCount || 0}
                  </span>
                  <button onClick={() => deleteUser(u.id)} className="btn btn-secondary" style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem', color: '#ef4444' }}>
                    Delete Account
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ─── CONTACT INQUIRIES TAB ─── */}
      {!loading && activeTab === 'contacts' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filteredContacts.length === 0 ? (
            <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-tertiary)' }}>
              No contact form submissions found.
            </div>
          ) : (
            filteredContacts.map((c) => (
              <div key={c.id} className="glass-panel" style={{ padding: '1.25rem 1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '0.75rem' }}>
                  <div>
                    <span style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-primary)' }}>{c.name}</span>
                    <span style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem', marginLeft: '0.5rem' }}>({c.email})</span>
                  </div>
                  <button onClick={() => deleteContact(c.id)} className="btn btn-secondary" style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem', color: '#ef4444' }}>
                    Delete
                  </button>
                </div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.35rem', color: 'var(--accent-cyan)' }}>Subject: {c.subject}</div>
                <div style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>{c.message}</div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
