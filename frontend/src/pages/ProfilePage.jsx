import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import SEO from '../components/SEO';

export default function ProfilePage() {
  const { user, logout, changePassword } = useAuth();
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [passMsg, setPassMsg] = useState({ type: '', text: '' });
  const [updatingPass, setUpdatingPass] = useState(false);

  const handleGeneratePassword = () => {
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*()_+-=[]{}|';
    const all = uppercase + lowercase + numbers + symbols;

    let pass = '';
    pass += uppercase.charAt(Math.floor(Math.random() * uppercase.length));
    pass += lowercase.charAt(Math.floor(Math.random() * lowercase.length));
    pass += numbers.charAt(Math.floor(Math.random() * numbers.length));
    pass += symbols.charAt(Math.floor(Math.random() * symbols.length));

    for (let i = 4; i < 16; i++) {
      pass += all.charAt(Math.floor(Math.random() * all.length));
    }
    // Shuffle
    const shuffled = pass.split('').sort(() => 0.5 - Math.random()).join('');
    setNewPassword(shuffled);
    setShowPass(true);
    setPassMsg({ type: 'info', text: 'Strong 16-character password generated. Click "Save New Password" to apply.' });
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
      setPassMsg({ type: 'error', text: err.message || 'Failed to update password.' });
    } finally {
      setUpdatingPass(false);
    }
  };

  if (!user) {
    return (
      <div className="container" style={{ padding: '5rem 1rem', textAlign: 'center' }}>
        <SEO title="Profile - Rate My UX" description="User profile and account settings on Rate My UX." />
        <div className="glass-card" style={{ maxWidth: '500px', margin: '0 auto', padding: '3rem 2rem' }}>
          <h2>Access Denied</h2>
          <p style={{ color: 'var(--text-secondary)', margin: '1rem 0 1.5rem' }}>
            Please sign in to access your profile and security settings.
          </p>
          <button onClick={() => navigate('/')} className="btn btn-primary">
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  const isGoogleUser = user.provider === 'google';

  return (
    <div className="container" style={{ padding: '3rem 1rem 5rem', maxWidth: '1000px' }}>
      <SEO
        title={`${user.name} — Profile & Security | Rate My UX`}
        description="Manage your account profile, password, security credentials, and preferences on Rate My UX."
      />

      {/* Breadcrumb / Top Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
          <Link to="/" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>Home</Link>
          <span>/</span>
          <Link to="/dashboard" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>Dashboard</Link>
          <span>/</span>
          <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>Profile &amp; Security</span>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Link to="/dashboard" className="btn btn-secondary" style={{ fontSize: '0.85rem', padding: '0.45rem 0.9rem' }}>
            📊 My Dashboard
          </Link>
          <button onClick={() => { logout(); navigate('/'); }} className="btn btn-secondary" style={{ fontSize: '0.85rem', padding: '0.45rem 0.9rem' }}>
            Sign Out
          </button>
        </div>
      </div>

      {/* Main Profile Header Card */}
      <div
        className="glass-card"
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1.5rem',
          padding: '2.25rem',
          marginBottom: '2.5rem',
          borderRadius: 'var(--radius-lg, 16px)',
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.02))',
          border: '1px solid var(--glass-border)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative' }}>
            <img
              src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=6c5ce7&color=fff`}
              alt={user.name}
              style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                border: '3px solid var(--accent-purple, #6c5ce7)',
                objectFit: 'cover',
                boxShadow: '0 8px 24px rgba(108, 92, 231, 0.3)',
              }}
            />
            {isGoogleUser && (
              <span
                title="Google Account"
                style={{
                  position: 'absolute',
                  bottom: '0',
                  right: '0',
                  background: '#fff',
                  color: '#000',
                  borderRadius: '50%',
                  width: '24px',
                  height: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  fontWeight: 800,
                  boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
                }}
              >
                G
              </span>
            )}
          </div>

          <div>
            <h1 style={{ fontSize: '1.85rem', fontWeight: 800, margin: '0 0 0.25rem 0', fontFamily: 'var(--font-heading)' }}>
              {user.name}
            </h1>
            <p style={{ color: 'var(--text-secondary)', margin: '0 0 0.5rem 0', fontSize: '0.95rem' }}>
              {user.email}
            </p>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span
                style={{
                  padding: '0.2rem 0.65rem',
                  borderRadius: '20px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  background: isGoogleUser ? 'rgba(66, 133, 244, 0.15)' : 'rgba(108, 92, 231, 0.15)',
                  color: isGoogleUser ? '#60a5fa' : 'var(--accent-purple, #a78bfa)',
                  border: '1px solid currentColor',
                  textTransform: 'capitalize',
                }}
              >
                {isGoogleUser ? 'Google OAuth' : 'Email & Password'}
              </span>
              <span
                style={{
                  padding: '0.2rem 0.65rem',
                  borderRadius: '20px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  background: 'rgba(34, 197, 94, 0.15)',
                  color: '#22c55e',
                  border: '1px solid #22c55e',
                }}
              >
                Free Plan Active
              </span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem' }}>
          <Link to="/" className="btn btn-primary" style={{ padding: '0.65rem 1.25rem' }}>
            ⚡ Run New Evaluation
          </Link>
        </div>
      </div>

      {/* Grid: Password & Security + Account Details */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
        
        {/* 🔒 Password & Security Form */}
        <div className="glass-card" style={{ padding: '2rem', borderRadius: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '1.5rem' }}>🔒</span>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>Password &amp; Security</h2>
          </div>
          
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: 1.5 }}>
            {isGoogleUser
              ? 'You signed in via Google OAuth. You can also generate or set a password to enable email & password sign-in.'
              : 'Update your account password or generate a cryptographically strong password.'}
          </p>

          {passMsg.text && (
            <div
              style={{
                padding: '0.85rem 1rem',
                borderRadius: '8px',
                fontSize: '0.85rem',
                marginBottom: '1.25rem',
                lineHeight: 1.4,
                background:
                  passMsg.type === 'success'
                    ? 'rgba(34, 197, 94, 0.15)'
                    : passMsg.type === 'info'
                    ? 'rgba(56, 189, 248, 0.15)'
                    : 'rgba(239, 68, 68, 0.15)',
                color:
                  passMsg.type === 'success'
                    ? '#22c55e'
                    : passMsg.type === 'info'
                    ? '#38bdf8'
                    : '#ef4444',
                border: `1px solid ${
                  passMsg.type === 'success'
                    ? '#22c55e'
                    : passMsg.type === 'info'
                    ? '#38bdf8'
                    : '#ef4444'
                }`,
              }}
            >
              {passMsg.text}
            </div>
          )}

          <form onSubmit={handlePasswordSubmit}>
            <div style={{ marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  New Password
                </label>
                <button
                  type="button"
                  onClick={handleGeneratePassword}
                  style={{
                    background: 'rgba(56, 189, 248, 0.1)',
                    border: '1px solid rgba(56, 189, 248, 0.3)',
                    color: 'var(--accent-cyan, #38bdf8)',
                    fontSize: '0.78rem',
                    cursor: 'pointer',
                    fontWeight: 700,
                    padding: '0.25rem 0.5rem',
                    borderRadius: '6px',
                    transition: 'all 0.2s ease',
                  }}
                >
                  ⚡ Generate Strong Password
                </button>
              </div>

              <div style={{ position: 'relative' }}>
                <input
                  type={showPass ? 'text' : 'password'}
                  placeholder="Enter new password (min 6 chars)..."
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.8rem 2.75rem 0.8rem 0.85rem',
                    borderRadius: '8px',
                    border: '1px solid var(--glass-border)',
                    background: 'rgba(0, 0, 0, 0.25)',
                    color: 'var(--text-primary)',
                    fontSize: '0.92rem',
                    fontFamily: showPass ? 'monospace' : 'inherit',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  style={{
                    position: 'absolute',
                    right: '0.75rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                  }}
                  title={showPass ? 'Hide password' : 'Show password'}
                >
                  {showPass ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={updatingPass || !newPassword}
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center', padding: '0.75rem' }}
            >
              {updatingPass ? 'Updating Password...' : 'Save New Password'}
            </button>
          </form>
        </div>

        {/* ℹ️ Account Information & Plan Details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Account Details Box */}
          <div className="glass-card" style={{ padding: '2rem', borderRadius: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
              <span style={{ fontSize: '1.5rem' }}>👤</span>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>Account Information</h2>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.9rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.75rem', borderBottom: '1px solid var(--glass-border)' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Full Name</span>
                <span style={{ fontWeight: 600 }}>{user.name}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.75rem', borderBottom: '1px solid var(--glass-border)' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Email Address</span>
                <span style={{ fontWeight: 600 }}>{user.email}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.75rem', borderBottom: '1px solid var(--glass-border)' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Auth Method</span>
                <span style={{ fontWeight: 600, textTransform: 'capitalize' }}>{user.provider || 'Email'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Account Status</span>
                <span style={{ color: '#22c55e', fontWeight: 600 }}>● Active</span>
              </div>
            </div>
          </div>

          {/* Quick Plan Info */}
          <div className="glass-card" style={{ padding: '1.75rem', borderRadius: '16px', background: 'linear-gradient(135deg, rgba(108, 92, 231, 0.08), rgba(0, 206, 201, 0.05))' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>Current Subscription</h3>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: '12px', background: 'rgba(34, 197, 94, 0.15)', color: '#22c55e', border: '1px solid #22c55e' }}>
                Free Plan
              </span>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem', lineHeight: 1.4 }}>
              Includes up to 3 screen evaluations per month with full Nielsen heuristic checks and PDF report exports.
            </p>
            <Link to="/plans" className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center', fontSize: '0.85rem' }}>
              Upgrade Plan
            </Link>
          </div>

        </div>

      </div>
    </div>
  );
}
