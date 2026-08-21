import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import SEO from '../components/SEO';
import MultiReport from '../components/MultiReport';
import { generatePDF } from '../utils/generatePDF';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export default function DashboardPage() {
  const { user, token, logout, changePassword } = useAuth();
  const [evaluations, setEvaluations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEval, setSelectedEval] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [passMsg, setPassMsg] = useState({ type: '', text: '' });
  const [updatingPass, setUpdatingPass] = useState(false);
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

  const handleGeneratePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()';
    let pass = '';
    for (let i = 0; i < 14; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewPassword(pass);
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPassMsg({ type: '', text: '' });
    if (!newPassword || newPassword.length < 6) {
      setPassMsg({ type: 'error', text: 'Password must be at least 6 characters long.' });
      return;
    }
    setUpdatingPass(true);
    try {
      const msg = await changePassword(newPassword);
      setPassMsg({ type: 'success', text: msg || 'Password updated successfully!' });
      setNewPassword('');
    } catch (err) {
      setPassMsg({ type: 'error', text: err.message });
    } finally {
      setUpdatingPass(false);
    }
  };

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

  return (
    <div className="container" style={{ padding: '3rem 1rem 5rem' }}>
      <SEO
        title="My Dashboard - Rate My UX"
        description="View your UX audit history, download evaluation reports, and manage account settings."
      />

      {/* Profile Header */}
      <div
        className="glass-card"
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1.5rem',
          padding: '2rem',
          marginBottom: '2.5rem',
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
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0 }}>{user.name}</h1>
            <p style={{ color: 'var(--text-secondary)', margin: '0.25rem 0 0 0', fontSize: '0.9rem' }}>
              {user.email} &bull; <span style={{ textTransform: 'capitalize', color: 'var(--accent-cyan)' }}>{user.provider || 'Email'} Account</span>
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem' }}>
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              padding: '0.75rem 1.25rem',
              borderRadius: '12px',
              textAlign: 'center',
              border: '1px solid var(--glass-border)',
            }}
          >
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent-cyan)' }}>{evaluations.length}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Audits Run</div>
          </div>

          <button onClick={logout} className="btn btn-secondary" style={{ height: 'fit-content', alignSelf: 'center' }}>
            Sign Out
          </button>
        </div>
      </div>

      {/* Main Grid: Audit History & Account Security */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
        
        {/* Audit History Column */}
        <div style={{ gridColumn: 'span 2' }}>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            📊 My Audit History
          </h2>

          {loading ? (
            <div className="glass-card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
              Loading your evaluation records...
            </div>
          ) : evaluations.length === 0 ? (
            <div className="glass-card" style={{ padding: '3rem', textAlign: 'center' }}>
              <p style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--text-secondary)' }}>You haven't run any UX evaluations yet.</p>
              <a href="/" className="btn btn-primary">Start Your First Evaluation</a>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {evaluations.map((item) => (
                <div
                  key={item.id}
                  className="glass-card"
                  style={{
                    padding: '1.25rem',
                    borderRadius: '12px',
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '1rem',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-primary)' }}>
                      {item.productName || item.targetUrl}
                    </div>
                    <div style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                      {item.targetUrl} &bull; {new Date(item.createdAt || item.timestamp).toLocaleDateString()}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div
                      style={{
                        padding: '0.35rem 0.75rem',
                        borderRadius: '20px',
                        fontSize: '0.85rem',
                        fontWeight: 700,
                        background: (item.overallScore || 0) >= 80 ? 'rgba(34, 197, 94, 0.15)' : (item.overallScore || 0) >= 60 ? 'rgba(234, 179, 8, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                        color: (item.overallScore || 0) >= 80 ? '#22c55e' : (item.overallScore || 0) >= 60 ? '#eab308' : '#ef4444',
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
                      {selectedEval?.id === item.id ? 'Hide Report' : 'View Report'}
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

        {/* Security & Password Column */}
        <div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            🔒 Password & Security
          </h2>

          <div className="glass-card" style={{ padding: '1.5rem', borderRadius: '16px' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: '0.5rem' }}>Generate or Update Password</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
              Create a strong new password for your Rate My UX account.
            </p>

            {passMsg.text && (
              <div
                style={{
                  padding: '0.75rem',
                  borderRadius: '8px',
                  fontSize: '0.85rem',
                  marginBottom: '1rem',
                  background: passMsg.type === 'success' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                  color: passMsg.type === 'success' ? '#22c55e' : '#ef4444',
                  border: `1px solid ${passMsg.type === 'success' ? '#22c55e' : '#ef4444'}`,
                }}
              >
                {passMsg.text}
              </div>
            )}

            <form onSubmit={handlePasswordSubmit}>
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>New Password</label>
                  <button
                    type="button"
                    onClick={handleGeneratePassword}
                    style={{ background: 'none', border: 'none', color: 'var(--accent-cyan)', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 600 }}
                  >
                    ⚡ Generate Password
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="Enter or generate password..."
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    border: '1px solid var(--glass-border)',
                    background: 'rgba(0, 0, 0, 0.2)',
                    color: 'var(--text-primary)',
                    fontSize: '0.9rem',
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={updatingPass}
                className="btn btn-primary"
                style={{ width: '100%', justifyContent: 'center' }}
              >
                {updatingPass ? 'Updating...' : 'Save New Password'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
