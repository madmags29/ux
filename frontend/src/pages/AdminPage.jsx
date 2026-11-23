import { useState, useEffect, useMemo } from 'react';
import MultiReport from '../components/MultiReport';
import AnimatedSection from '../components/AnimatedSection';
import { generatePDF } from '../utils/generatePDF';

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
  const [sortBy, setSortBy] = useState('newest');
  const [inspectItem, setInspectItem] = useState(null);
  const [toast, setToast] = useState('');
  const [pdfLoadingId, setPdfLoadingId] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const API_URL = import.meta.env.VITE_API_URL || '';

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => {
      setToast((prev) => (prev === msg ? '' : prev));
    }, 3200);
  };

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
      showToast('Authenticated as Administrator');
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
    setInspectItem(null);
    showToast('Signed out of Admin Portal');
  };

  useEffect(() => {
    if (!token) return;
    let isMounted = true;
    const fetchData = async () => {
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

    fetchData();
    return () => { isMounted = false; };
  }, [token, API_URL, refreshKey]);

  const handleRefresh = () => {
    setRefreshKey((k) => k + 1);
    showToast('Refreshing records...');
  };

  const deleteEval = async (id) => {
    if (!confirm('Are you sure you want to delete this evaluation record?')) return;
    try {
      await fetch(`${API_URL}/api/admin/evaluations/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      setEvaluations(prev => prev.filter(e => e.id !== id));
      if (inspectItem?.id === id) setInspectItem(null);
      showToast('Evaluation record deleted');
    } catch (err) {
      showToast('Delete failed: ' + (err.message || 'Error'));
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
      showToast('Inquiry deleted');
    } catch (err) {
      showToast('Delete failed: ' + (err.message || 'Error'));
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
      showToast('User account deleted');
    } catch (err) {
      showToast('Delete failed: ' + (err.message || 'Error'));
    }
  };

  const handleDownloadPDF = async (item) => {
    if (!item || !item.screens) return;
    setPdfLoadingId(item.id);
    try {
      await generatePDF(item.screens, item.aggregate || {}, item.targetUrl || 'UX_Evaluation');
      showToast('PDF Report generated');
    } catch (err) {
      console.error('PDF export error:', err);
      showToast('Failed to generate PDF');
    } finally {
      setPdfLoadingId(null);
    }
  };

  const copyToClipboard = (text, label = 'Email') => {
    navigator.clipboard.writeText(text);
    showToast(`${label} copied to clipboard!`);
  };

  const exportToCSV = () => {
    let headers = [];
    let rows = [];
    const dateStr = new Date().toISOString().slice(0, 10);
    const filename = `ratemyux-${activeTab}-${dateStr}.csv`;

    if (activeTab === 'evaluations') {
      headers = ['ID', 'Target URL', 'Product Name', 'Overall Score', 'Screens Count', 'Date'];
      rows = evaluations.map(e => [
        `"${e.id || ''}"`,
        `"${(e.targetUrl || '').replace(/"/g, '""')}"`,
        `"${(e.productName || '').replace(/"/g, '""')}"`,
        e.overallScore || 0,
        e.screens?.length || 1,
        `"${new Date(e.createdAt || e.timestamp).toISOString()}"`
      ]);
    } else if (activeTab === 'users') {
      headers = ['ID', 'Name', 'Email', 'Role', 'Provider', 'Audits Run', 'Joined Date'];
      rows = users.map(u => [
        `"${u.id || ''}"`,
        `"${(u.name || '').replace(/"/g, '""')}"`,
        `"${(u.email || '').replace(/"/g, '""')}"`,
        `"${u.role || 'user'}"`,
        `"${u.provider || 'email'}"`,
        u.evalCount || 0,
        `"${new Date(u.createdAt).toISOString()}"`
      ]);
    } else if (activeTab === 'contacts') {
      headers = ['ID', 'Name', 'Email', 'Subject', 'Message', 'Date'];
      rows = contacts.map(c => [
        `"${c.id || ''}"`,
        `"${(c.name || '').replace(/"/g, '""')}"`,
        `"${(c.email || '').replace(/"/g, '""')}"`,
        `"${(c.subject || '').replace(/"/g, '""')}"`,
        `"${(c.message || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`,
        `"${new Date(c.createdAt || c.timestamp).toISOString()}"`
      ]);
    }

    if (rows.length === 0) {
      showToast(`No ${activeTab} data to export`);
      return;
    }

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Exported ${rows.length} rows to ${filename}`);
  };

  const filteredEvals = useMemo(() => {
    const q = search.toLowerCase().trim();
    const list = evaluations.filter(e =>
      !q ||
      (e.targetUrl || '').toLowerCase().includes(q) ||
      (e.productName || '').toLowerCase().includes(q) ||
      (e.id || '').toLowerCase().includes(q)
    );
    if (sortBy === 'newest') {
      list.sort((a, b) => new Date(b.createdAt || b.timestamp) - new Date(a.createdAt || a.timestamp));
    } else if (sortBy === 'oldest') {
      list.sort((a, b) => new Date(a.createdAt || a.timestamp) - new Date(b.createdAt || b.timestamp));
    } else if (sortBy === 'score-high') {
      list.sort((a, b) => (b.overallScore || 0) - (a.overallScore || 0));
    } else if (sortBy === 'score-low') {
      list.sort((a, b) => (a.overallScore || 0) - (b.overallScore || 0));
    }
    return list;
  }, [evaluations, search, sortBy]);

  const filteredContacts = useMemo(() => {
    const q = search.toLowerCase().trim();
    const list = contacts.filter(c =>
      !q ||
      (c.name || '').toLowerCase().includes(q) ||
      (c.email || '').toLowerCase().includes(q) ||
      (c.subject || '').toLowerCase().includes(q) ||
      (c.message || '').toLowerCase().includes(q)
    );
    list.sort((a, b) => new Date(b.createdAt || b.timestamp) - new Date(a.createdAt || a.timestamp));
    return list;
  }, [contacts, search]);

  const filteredUsers = useMemo(() => {
    const q = search.toLowerCase().trim();
    const list = users.filter(u =>
      !q ||
      (u.name || '').toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q) ||
      (u.provider || '').toLowerCase().includes(q) ||
      (u.role || '').toLowerCase().includes(q)
    );
    list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return list;
  }, [users, search]);

  const avgScore = evaluations.length
    ? Math.round(evaluations.reduce((acc, curr) => acc + (curr.overallScore || 0), 0) / evaluations.length)
    : 0;

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
              autoFocus
            />
            <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
              Authenticate
            </button>
          </form>
        </div>
      </div>
    );
  }

  const currentCount = activeTab === 'evaluations' ? filteredEvals.length : (activeTab === 'users' ? filteredUsers.length : filteredContacts.length);
  const totalCount = activeTab === 'evaluations' ? evaluations.length : (activeTab === 'users' ? users.length : contacts.length);

  return (
    <div style={{ maxWidth: 1200, margin: '2rem auto', padding: '0 1rem' }}>
      {/* Toast Notification */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            background: 'linear-gradient(135deg, rgba(30, 27, 75, 0.95), rgba(15, 23, 42, 0.98))',
            border: '1px solid var(--accent-cyan)',
            color: '#fff',
            padding: '0.75rem 1.25rem',
            borderRadius: '10px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
            zIndex: 9999,
            fontSize: '0.88rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <span>✨</span> {toast}
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <span className="hero__badge" style={{ marginBottom: '0.5rem' }}>🛡️ Rate My UX Admin</span>
          <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>Admin Dashboard</h1>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="btn btn-secondary"
            title="Refresh dashboard data"
            style={{ padding: '0.55rem 1rem', fontSize: '0.85rem' }}
          >
            {loading ? '⏳ Refreshing...' : '🔄 Refresh Data'}
          </button>
          <button
            onClick={exportToCSV}
            className="btn btn-secondary"
            title="Export current tab records to CSV"
            style={{ padding: '0.55rem 1rem', fontSize: '0.85rem' }}
          >
            📥 Export CSV
          </button>
          <button onClick={handleLogout} className="btn btn-secondary" style={{ padding: '0.55rem 1rem', fontSize: '0.85rem', color: '#ef4444' }}>
            Sign Out
          </button>
        </div>
      </div>

      {/* Interactive Stat Cards (Click to switch tab) */}
      <AnimatedSection delay={50}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem', marginBottom: '2.5rem' }}>
          <div
            onClick={() => setActiveTab('evaluations')}
            className="glass-panel"
            style={{
              padding: '1.5rem',
              textAlign: 'center',
              cursor: 'pointer',
              border: activeTab === 'evaluations' ? '1px solid var(--accent-cyan)' : '1px solid var(--glass-border)',
              transition: 'all 0.2s ease',
              boxShadow: activeTab === 'evaluations' ? '0 0 15px rgba(0, 240, 255, 0.15)' : 'none',
            }}
          >
            <div style={{ fontSize: '0.75rem', color: activeTab === 'evaluations' ? 'var(--accent-cyan)' : 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>
              Total UX Audits {activeTab === 'evaluations' && '• Active'}
            </div>
            <div className="text-gradient" style={{ fontSize: '2.5rem', fontWeight: 700, fontFamily: 'var(--font-heading)' }}>{evaluations.length}</div>
          </div>

          <div
            onClick={() => setActiveTab('users')}
            className="glass-panel"
            style={{
              padding: '1.5rem',
              textAlign: 'center',
              cursor: 'pointer',
              border: activeTab === 'users' ? '1px solid var(--accent-purple, #6c5ce7)' : '1px solid var(--glass-border)',
              transition: 'all 0.2s ease',
              boxShadow: activeTab === 'users' ? '0 0 15px rgba(108, 92, 231, 0.2)' : 'none',
            }}
          >
            <div style={{ fontSize: '0.75rem', color: activeTab === 'users' ? 'var(--accent-purple, #a855f7)' : 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>
              Registered Users {activeTab === 'users' && '• Active'}
            </div>
            <div style={{ fontSize: '2.5rem', fontWeight: 700, fontFamily: 'var(--font-heading)', color: 'var(--accent-purple, #6c5ce7)' }}>{users.length}</div>
          </div>

          <div className="glass-panel" style={{ padding: '1.5rem', textAlign: 'center' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Average UX Score</div>
            <div className="text-gradient-warm" style={{ fontSize: '2.5rem', fontWeight: 700, fontFamily: 'var(--font-heading)' }}>{avgScore}/100</div>
          </div>

          <div
            onClick={() => setActiveTab('contacts')}
            className="glass-panel"
            style={{
              padding: '1.5rem',
              textAlign: 'center',
              cursor: 'pointer',
              border: activeTab === 'contacts' ? '1px solid var(--accent-cyan)' : '1px solid var(--glass-border)',
              transition: 'all 0.2s ease',
              boxShadow: activeTab === 'contacts' ? '0 0 15px rgba(0, 240, 255, 0.15)' : 'none',
            }}
          >
            <div style={{ fontSize: '0.75rem', color: activeTab === 'contacts' ? 'var(--accent-cyan)' : 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>
              Contact Form Leads {activeTab === 'contacts' && '• Active'}
            </div>
            <div style={{ fontSize: '2.5rem', fontWeight: 700, fontFamily: 'var(--font-heading)', color: 'var(--accent-cyan)' }}>{contacts.length}</div>
          </div>
        </div>
      </AnimatedSection>

      {/* Tabs & Search Filter Bar */}
      <AnimatedSection delay={100}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem', background: 'var(--glass-bg)', padding: '4px', borderRadius: 'var(--radius-md)', border: '1px solid var(--glass-border)', flexWrap: 'wrap' }}>
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

          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
            {activeTab === 'evaluations' && (
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="input-field"
                style={{ padding: '0.55rem 0.75rem', fontSize: '0.85rem', width: 'auto', background: 'var(--glass-bg)' }}
              >
                <option value="newest" style={{ background: '#0f1120' }}>Sort: Newest First</option>
                <option value="oldest" style={{ background: '#0f1120' }}>Sort: Oldest First</option>
                <option value="score-high" style={{ background: '#0f1120' }}>Sort: Highest Score</option>
                <option value="score-low" style={{ background: '#0f1120' }}>Sort: Lowest Score</option>
              </select>
            )}

            <div style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder={`Search ${activeTab}...`}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input-field"
                style={{ minWidth: 220, fontSize: '0.85rem', padding: '0.55rem 2rem 0.55rem 1rem' }}
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  style={{
                    position: 'absolute',
                    right: '8px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-tertiary)',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    padding: '2px 6px',
                  }}
                  title="Clear search"
                >
                  ✕
                </button>
              )}
            </div>

            {search && (
              <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
                Showing {currentCount} of {totalCount}
              </span>
            )}
          </div>
        </div>
      </AnimatedSection>

      {loading && (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
          <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>⏳</div>
          Loading admin records...
        </div>
      )}

      {/* ─── EVALUATIONS TAB ─── */}
      {!loading && activeTab === 'evaluations' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filteredEvals.length === 0 ? (
            <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-tertiary)' }}>
              No audits found matching &quot;{search}&quot;.
            </div>
          ) : (
            filteredEvals.map((item) => {
              const isInspecting = inspectItem?.id === item.id;
              const formattedDate = new Date(item.createdAt || item.timestamp).toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div
                  key={item.id}
                  className="glass-panel"
                  style={{
                    padding: '1.25rem 1.5rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1rem',
                    border: isInspecting ? '1px solid var(--accent-cyan)' : '1px solid var(--glass-border)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                    <div style={{ flex: '1 1 300px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.35rem', flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-primary)' }}>
                          {item.productName || item.targetUrl}
                        </span>
                        <span style={{
                          padding: '0.2rem 0.55rem',
                          borderRadius: '12px',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          background: (item.overallScore || 0) >= 80 ? 'rgba(34, 197, 94, 0.15)' : ((item.overallScore || 0) >= 60 ? 'rgba(234, 179, 8, 0.15)' : 'rgba(239, 68, 68, 0.15)'),
                          color: (item.overallScore || 0) >= 80 ? '#22c55e' : ((item.overallScore || 0) >= 60 ? '#eab308' : '#ef4444'),
                        }}>
                          Score: {item.overallScore || 0}/100
                        </span>
                        {item.screens && (
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', background: 'rgba(255,255,255,0.05)', padding: '0.15rem 0.5rem', borderRadius: '10px' }}>
                            📸 {item.screens.length} {item.screens.length === 1 ? 'screen' : 'screens'}
                          </span>
                        )}
                        {item.userId && (
                          <span style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)', background: 'rgba(0, 240, 255, 0.08)', padding: '0.15rem 0.5rem', borderRadius: '10px' }}>
                            👤 User Linked
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                        <span>📅 {formattedDate}</span>
                        {item.targetUrl && (
                          <a
                            href={item.targetUrl.startsWith('http') ? item.targetUrl : `https://${item.targetUrl}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: 'var(--accent-cyan)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '3px' }}
                            title="Open URL in new tab"
                          >
                            <span>🔗 {item.targetUrl}</span> ↗
                          </a>
                        )}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                      <button
                        onClick={() => handleDownloadPDF(item)}
                        disabled={pdfLoadingId === item.id}
                        className="btn btn-secondary"
                        style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
                        title="Download PDF report for this audit"
                      >
                        {pdfLoadingId === item.id ? '⏳ PDF...' : '📄 PDF'}
                      </button>
                      <button
                        onClick={() => setInspectItem(isInspecting ? null : item)}
                        className={`btn ${isInspecting ? 'btn-primary' : 'btn-secondary'}`}
                        style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
                      >
                        {isInspecting ? '✕ Close Report' : '🔍 Inspect'}
                      </button>
                      <button
                        onClick={() => deleteEval(item.id)}
                        className="btn btn-secondary"
                        style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem', color: '#ef4444' }}
                        title="Delete this evaluation record"
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>

                  {/* Inspected Audit Report Accordion */}
                  {isInspecting && (
                    <div style={{ marginTop: '0.5rem', paddingTop: '1.25rem', borderTop: '1px solid var(--glass-border)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', background: 'rgba(0, 240, 255, 0.05)', padding: '0.75rem 1rem', borderRadius: '8px' }}>
                        <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--accent-cyan)' }}>
                          Viewing Full Multi-Screen Audit Report: {item.productName || item.targetUrl}
                        </span>
                        <button
                          onClick={() => setInspectItem(null)}
                          className="btn btn-secondary"
                          style={{ padding: '0.3rem 0.65rem', fontSize: '0.75rem' }}
                        >
                          ✕ Close Report
                        </button>
                      </div>
                      <MultiReport screens={item.screens || []} aggregate={item.aggregate || {}} />
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ─── REGISTERED USERS TAB ─── */}
      {!loading && activeTab === 'users' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filteredUsers.length === 0 ? (
            <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-tertiary)' }}>
              No registered users found matching &quot;{search}&quot;.
            </div>
          ) : (
            filteredUsers.map((u) => {
              const joinedDate = new Date(u.createdAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              });

              return (
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: '1 1 300px' }}>
                    <img
                      src={u.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name || 'User')}&background=6c5ce7&color=fff`}
                      alt={u.name}
                      style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover' }}
                    />
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                        <span style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-primary)' }}>{u.name}</span>
                        {u.role === 'admin' && (
                          <span style={{ fontSize: '0.72rem', background: 'rgba(234, 179, 8, 0.15)', color: '#eab308', padding: '0.15rem 0.5rem', borderRadius: '10px', fontWeight: 700 }}>
                            🛡️ Admin
                          </span>
                        )}
                        <span style={{ fontSize: '0.72rem', background: 'rgba(0, 240, 255, 0.08)', color: 'var(--accent-cyan)', padding: '0.15rem 0.5rem', borderRadius: '10px', textTransform: 'capitalize' }}>
                          {u.provider || 'email'}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <a href={`mailto:${u.email}`} style={{ color: 'var(--text-secondary)', textDecoration: 'none' }} title="Send email">
                          ✉️ {u.email}
                        </a>
                        <span>&bull;</span>
                        <span>Joined: {joinedDate}</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <span style={{ padding: '0.35rem 0.75rem', borderRadius: '20px', background: 'rgba(255, 255, 255, 0.05)', fontSize: '0.85rem', fontWeight: 600 }}>
                      ⚡ Audits Run: {u.evalCount || 0}
                    </span>
                    <button
                      onClick={() => copyToClipboard(u.email, 'User email')}
                      className="btn btn-secondary"
                      style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
                      title="Copy user email to clipboard"
                    >
                      📋 Copy Email
                    </button>
                    {u.role !== 'admin' && (
                      <button
                        onClick={() => deleteUser(u.id)}
                        className="btn btn-secondary"
                        style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem', color: '#ef4444' }}
                        title="Delete user account"
                      >
                        🗑️ Delete
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ─── CONTACT INQUIRIES TAB ─── */}
      {!loading && activeTab === 'contacts' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filteredContacts.length === 0 ? (
            <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-tertiary)' }}>
              No contact inquiries found matching &quot;{search}&quot;.
            </div>
          ) : (
            filteredContacts.map((c) => {
              const submissionDate = new Date(c.createdAt || c.timestamp).toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div key={c.id} className="glass-panel" style={{ padding: '1.25rem 1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '0.75rem' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem', flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-primary)' }}>{c.name}</span>
                        <a href={`mailto:${c.email}`} style={{ color: 'var(--accent-cyan)', fontSize: '0.88rem', textDecoration: 'none' }}>
                          &lt;{c.email}&gt;
                        </a>
                      </div>
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-tertiary)' }}>
                        📅 Received: {submissionDate}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <a
                        href={`mailto:${c.email}?subject=Re: ${encodeURIComponent(c.subject || 'Rate My UX Inquiry')}`}
                        className="btn btn-primary"
                        style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem' }}
                        title="Reply via your email client"
                      >
                        ✉️ Reply
                      </a>
                      <button
                        onClick={() => copyToClipboard(c.email, 'Sender email')}
                        className="btn btn-secondary"
                        style={{ padding: '0.35rem 0.65rem', fontSize: '0.78rem' }}
                        title="Copy sender email"
                      >
                        📋 Copy
                      </button>
                      <button
                        onClick={() => deleteContact(c.id)}
                        className="btn btn-secondary"
                        style={{ padding: '0.35rem 0.65rem', fontSize: '0.78rem', color: '#ef4444' }}
                        title="Delete inquiry"
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                  <div style={{ fontWeight: 600, fontSize: '0.92rem', marginBottom: '0.5rem', color: 'var(--accent-cyan)' }}>
                    Subject: {c.subject}
                  </div>
                  <div style={{
                    fontSize: '0.88rem',
                    color: 'var(--text-secondary)',
                    whiteSpace: 'pre-wrap',
                    background: 'rgba(255,255,255,0.02)',
                    padding: '0.85rem',
                    borderRadius: '8px',
                    border: '1px solid rgba(255,255,255,0.04)',
                    lineHeight: 1.6,
                  }}>
                    {c.message}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
