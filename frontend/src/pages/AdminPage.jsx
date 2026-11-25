import { Fragment, useState, useEffect, useMemo } from 'react';
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
  const [sortBy, setSortBy] = useState('newest');
  const [inspectItem, setInspectItem] = useState(null);
  const [toast, setToast] = useState('');
  const [pdfLoadingId, setPdfLoadingId] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

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
      const { generatePDF } = await import('../utils/generatePDF');
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

  const currentList = activeTab === 'evaluations' ? filteredEvals : activeTab === 'users' ? filteredUsers : filteredContacts;
  const totalPages = Math.max(1, Math.ceil(currentList.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const startIdx = (safePage - 1) * pageSize;
  const paginatedEvals = filteredEvals.slice(startIdx, startIdx + pageSize);
  const paginatedUsers = filteredUsers.slice(startIdx, startIdx + pageSize);
  const paginatedContacts = filteredContacts.slice(startIdx, startIdx + pageSize);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setCurrentPage(1);
    setInspectItem(null);
  };

  const renderPagination = (totalItems) => {
    if (totalItems === 0) return null;
    const endIdx = Math.min(startIdx + pageSize, totalItems);
    const pages = [];
    for (let p = 1; p <= totalPages; p++) {
      if (p === 1 || p === totalPages || Math.abs(p - safePage) <= 1) {
        pages.push(p);
      } else if (pages[pages.length - 1] !== '...') {
        pages.push('...');
      }
    }

    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          padding: '1rem 1.25rem',
          borderTop: '1px solid var(--glass-border)',
          fontSize: '0.84rem',
          color: 'var(--text-secondary)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <span>
            Showing <strong style={{ color: 'var(--text-primary)' }}>{startIdx + 1}–{endIdx}</strong> of{' '}
            <strong style={{ color: 'var(--text-primary)' }}>{totalItems}</strong>
          </span>
          <select
            value={pageSize}
            onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
            style={{
              padding: '0.3rem 0.55rem',
              borderRadius: '6px',
              border: '1px solid var(--glass-border)',
              background: 'var(--glass-bg)',
              color: 'var(--text-primary)',
              fontSize: '0.8rem',
              cursor: 'pointer',
            }}
          >
            {[10, 25, 50].map((sz) => (
              <option key={sz} value={sz} style={{ background: '#0f1120', color: '#fff' }}>
                {sz} / page
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={safePage <= 1}
            className="btn btn-secondary"
            style={{ padding: '0.35rem 0.7rem', fontSize: '0.8rem', opacity: safePage <= 1 ? 0.45 : 1 }}
          >
            ← Prev
          </button>
          {pages.map((p, idx) =>
            p === '...' ? (
              <span key={`el-${idx}`} style={{ padding: '0 0.35rem', color: 'var(--text-tertiary)' }}>…</span>
            ) : (
              <button
                key={p}
                onClick={() => setCurrentPage(p)}
                className={`btn ${safePage === p ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem', minWidth: '32px', justifyContent: 'center' }}
              >
                {p}
              </button>
            )
          )}
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={safePage >= totalPages}
            className="btn btn-secondary"
            style={{ padding: '0.35rem 0.7rem', fontSize: '0.8rem', opacity: safePage >= totalPages ? 0.45 : 1 }}
          >
            Next →
          </button>
        </div>
      </div>
    );
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
              onClick={() => handleTabChange('evaluations')}
              className={`tab-btn ${activeTab === 'evaluations' ? 'active' : ''}`}
              style={{ padding: '0.6rem 1.25rem', border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontWeight: 600, fontSize: '0.88rem' }}
            >
              📊 Saved Audits ({evaluations.length})
            </button>
            <button
              onClick={() => handleTabChange('users')}
              className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
              style={{ padding: '0.6rem 1.25rem', border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontWeight: 600, fontSize: '0.88rem' }}
            >
              👥 Registered Users ({users.length})
            </button>
            <button
              onClick={() => handleTabChange('contacts')}
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
                onChange={(e) => { setSortBy(e.target.value); setCurrentPage(1); }}
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
                onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
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

      {/* ─── EVALUATIONS TAB (TABLE) ─── */}
      {!loading && activeTab === 'evaluations' && (
        <div className="glass-panel" style={{ overflow: 'hidden' }}>
          {filteredEvals.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-tertiary)' }}>
              No audits found{search ? ` matching "${search}"` : ''}.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
                <thead>
                  <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid var(--glass-border)', color: 'var(--text-tertiary)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    <th style={{ padding: '0.9rem 1rem' }}>Product / URL</th>
                    <th style={{ padding: '0.9rem 1rem' }}>Score</th>
                    <th style={{ padding: '0.9rem 1rem' }}>Screens</th>
                    <th style={{ padding: '0.9rem 1rem' }}>User</th>
                    <th style={{ padding: '0.9rem 1rem' }}>Date</th>
                    <th style={{ padding: '0.9rem 1rem', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedEvals.map((item) => {
                    const isInspecting = inspectItem?.id === item.id;
                    const formattedDate = new Date(item.createdAt || item.timestamp).toLocaleString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    });
                    const score = item.overallScore || 0;
                    const scoreColor = score >= 80 ? '#22c55e' : score >= 60 ? '#eab308' : '#ef4444';
                    const scoreBg = score >= 80 ? 'rgba(34, 197, 94, 0.15)' : score >= 60 ? 'rgba(234, 179, 8, 0.15)' : 'rgba(239, 68, 68, 0.15)';

                    return (
                      <Fragment key={item.id}>
                        <tr
                          style={{
                            borderBottom: '1px solid var(--glass-border)',
                            background: isInspecting ? 'rgba(0, 240, 255, 0.04)' : 'transparent',
                            transition: 'background 0.2s ease',
                          }}
                        >
                          <td style={{ padding: '0.9rem 1rem', maxWidth: '280px' }}>
                            <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.2rem' }}>
                              {item.productName || 'Evaluated Product'}
                            </div>
                            {item.targetUrl && (
                              <a
                                href={item.targetUrl.startsWith('http') ? item.targetUrl : `https://${item.targetUrl}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ color: 'var(--accent-cyan)', textDecoration: 'none', fontSize: '0.78rem', display: 'inline-block', maxWidth: '260px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                                title={item.targetUrl}
                              >
                                🔗 {item.targetUrl}
                              </a>
                            )}
                          </td>
                          <td style={{ padding: '0.9rem 1rem', whiteSpace: 'nowrap' }}>
                            <span style={{ padding: '0.25rem 0.6rem', borderRadius: '12px', fontSize: '0.78rem', fontWeight: 700, background: scoreBg, color: scoreColor }}>
                              {score}/100
                            </span>
                          </td>
                          <td style={{ padding: '0.9rem 1rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                            📸 {item.screenCount || item.screens?.length || 0}
                          </td>
                          <td style={{ padding: '0.9rem 1rem', whiteSpace: 'nowrap' }}>
                            {item.userEmail ? (
                              <span style={{ fontSize: '0.78rem', color: 'var(--accent-cyan)' }}>{item.userEmail}</span>
                            ) : item.userId ? (
                              <span style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)' }}>👤 Linked</span>
                            ) : (
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Guest</span>
                            )}
                          </td>
                          <td style={{ padding: '0.9rem 1rem', color: 'var(--text-tertiary)', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                            {formattedDate}
                          </td>
                          <td style={{ padding: '0.9rem 1rem', textAlign: 'right', whiteSpace: 'nowrap' }}>
                            <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                              <button
                                onClick={() => handleDownloadPDF(item)}
                                disabled={pdfLoadingId === item.id}
                                className="btn btn-secondary"
                                style={{ padding: '0.35rem 0.65rem', fontSize: '0.78rem' }}
                                title="Download PDF report"
                              >
                                {pdfLoadingId === item.id ? '⏳' : '📄 PDF'}
                              </button>
                              <button
                                onClick={() => setInspectItem(isInspecting ? null : item)}
                                className={`btn ${isInspecting ? 'btn-primary' : 'btn-secondary'}`}
                                style={{ padding: '0.35rem 0.65rem', fontSize: '0.78rem' }}
                              >
                                {isInspecting ? '✕ Close' : '🔍 Inspect'}
                              </button>
                              <button
                                onClick={() => deleteEval(item.id)}
                                className="btn btn-secondary"
                                style={{ padding: '0.35rem 0.65rem', fontSize: '0.78rem', color: '#ef4444' }}
                                title="Delete evaluation"
                              >
                                🗑️
                              </button>
                            </div>
                          </td>
                        </tr>
                        {isInspecting && (
                          <tr key={`${item.id}-inspect`}>
                            <td colSpan={6} style={{ padding: '1.25rem', background: 'rgba(0, 0, 0, 0.15)', borderBottom: '1px solid var(--glass-border)' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', background: 'rgba(0, 240, 255, 0.05)', padding: '0.75rem 1rem', borderRadius: '8px' }}>
                                <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--accent-cyan)' }}>
                                  Full Multi-Screen Audit Report: {item.productName || item.targetUrl}
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
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          {renderPagination(filteredEvals.length)}
        </div>
      )}

      {/* ─── REGISTERED USERS TAB (TABLE) ─── */}
      {!loading && activeTab === 'users' && (
        <div className="glass-panel" style={{ overflow: 'hidden' }}>
          {filteredUsers.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-tertiary)' }}>
              No registered users found{search ? ` matching "${search}"` : ''}.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
                <thead>
                  <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid var(--glass-border)', color: 'var(--text-tertiary)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    <th style={{ padding: '0.9rem 1rem' }}>User</th>
                    <th style={{ padding: '0.9rem 1rem' }}>Email</th>
                    <th style={{ padding: '0.9rem 1rem' }}>Provider</th>
                    <th style={{ padding: '0.9rem 1rem' }}>Audits Run</th>
                    <th style={{ padding: '0.9rem 1rem' }}>Joined</th>
                    <th style={{ padding: '0.9rem 1rem', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedUsers.map((u) => {
                    const joinedDate = new Date(u.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    });

                    return (
                      <tr key={u.id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                        <td style={{ padding: '0.85rem 1rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <img
                              src={u.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name || 'User')}&background=6c5ce7&color=fff`}
                              alt={u.name}
                              style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
                            />
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                              <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{u.name}</span>
                              {u.role === 'admin' && (
                                <span style={{ fontSize: '0.7rem', background: 'rgba(234, 179, 8, 0.15)', color: '#eab308', padding: '0.12rem 0.45rem', borderRadius: '10px', fontWeight: 700 }}>
                                  🛡️ Admin
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '0.85rem 1rem' }}>
                          <a href={`mailto:${u.email}`} style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>
                            {u.email}
                          </a>
                        </td>
                        <td style={{ padding: '0.85rem 1rem' }}>
                          <span style={{ fontSize: '0.75rem', background: 'rgba(0, 240, 255, 0.08)', color: 'var(--accent-cyan)', padding: '0.18rem 0.55rem', borderRadius: '10px', textTransform: 'capitalize' }}>
                            {u.provider || 'email'}
                          </span>
                        </td>
                        <td style={{ padding: '0.85rem 1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                          ⚡ {u.evalCount || 0}
                        </td>
                        <td style={{ padding: '0.85rem 1rem', color: 'var(--text-tertiary)', fontSize: '0.82rem', whiteSpace: 'nowrap' }}>
                          {joinedDate}
                        </td>
                        <td style={{ padding: '0.85rem 1rem', textAlign: 'right', whiteSpace: 'nowrap' }}>
                          <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                            <button
                              onClick={() => copyToClipboard(u.email, 'User email')}
                              className="btn btn-secondary"
                              style={{ padding: '0.35rem 0.65rem', fontSize: '0.78rem' }}
                              title="Copy email"
                            >
                              📋 Copy
                            </button>
                            {u.role !== 'admin' && (
                              <button
                                onClick={() => deleteUser(u.id)}
                                className="btn btn-secondary"
                                style={{ padding: '0.35rem 0.65rem', fontSize: '0.78rem', color: '#ef4444' }}
                                title="Delete user"
                              >
                                🗑️
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          {renderPagination(filteredUsers.length)}
        </div>
      )}

      {/* ─── CONTACT INQUIRIES TAB (TABLE) ─── */}
      {!loading && activeTab === 'contacts' && (
        <div className="glass-panel" style={{ overflow: 'hidden' }}>
          {filteredContacts.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-tertiary)' }}>
              No contact inquiries found{search ? ` matching "${search}"` : ''}.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
                <thead>
                  <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid var(--glass-border)', color: 'var(--text-tertiary)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    <th style={{ padding: '0.9rem 1rem' }}>Sender</th>
                    <th style={{ padding: '0.9rem 1rem' }}>Subject &amp; Message</th>
                    <th style={{ padding: '0.9rem 1rem' }}>Received</th>
                    <th style={{ padding: '0.9rem 1rem', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedContacts.map((c) => {
                    const submissionDate = new Date(c.createdAt || c.timestamp).toLocaleString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    });

                    return (
                      <tr key={c.id} style={{ borderBottom: '1px solid var(--glass-border)', verticalAlign: 'top' }}>
                        <td style={{ padding: '0.9rem 1rem', minWidth: '180px' }}>
                          <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{c.name}</div>
                          <a href={`mailto:${c.email}`} style={{ color: 'var(--accent-cyan)', fontSize: '0.8rem', textDecoration: 'none' }}>
                            {c.email}
                          </a>
                        </td>
                        <td style={{ padding: '0.9rem 1rem', maxWidth: '420px' }}>
                          <div style={{ fontWeight: 600, color: 'var(--accent-cyan)', marginBottom: '0.25rem' }}>
                            {c.subject}
                          </div>
                          <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                            {c.message}
                          </div>
                        </td>
                        <td style={{ padding: '0.9rem 1rem', color: 'var(--text-tertiary)', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                          {submissionDate}
                        </td>
                        <td style={{ padding: '0.9rem 1rem', textAlign: 'right', whiteSpace: 'nowrap' }}>
                          <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                            <a
                              href={`mailto:${c.email}?subject=Re: ${encodeURIComponent(c.subject || 'Rate My UX Inquiry')}`}
                              className="btn btn-primary"
                              style={{ padding: '0.35rem 0.65rem', fontSize: '0.78rem' }}
                              title="Reply"
                            >
                              ✉️ Reply
                            </a>
                            <button
                              onClick={() => copyToClipboard(c.email, 'Sender email')}
                              className="btn btn-secondary"
                              style={{ padding: '0.35rem 0.65rem', fontSize: '0.78rem' }}
                              title="Copy email"
                            >
                              📋
                            </button>
                            <button
                              onClick={() => deleteContact(c.id)}
                              className="btn btn-secondary"
                              style={{ padding: '0.35rem 0.65rem', fontSize: '0.78rem', color: '#ef4444' }}
                              title="Delete inquiry"
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          {renderPagination(filteredContacts.length)}
        </div>
      )}
    </div>
  );
}
