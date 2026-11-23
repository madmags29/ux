import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

export default function AuthModal({ isOpen, onClose, onSuccess, initialTab = 'login' }) {
  const { login, register, loginWithGoogle } = useAuth();
  const [tab, setTab] = useState(initialTab);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const googleBtnRef = useRef(null);
  const googleInitialized = useRef(false);

  const handleGoogleCredential = useCallback(async (response) => {
    setGoogleLoading(true);
    setError('');
    try {
      await loginWithGoogle({ credential: response.credential });
      if (onSuccess) onSuccess();
      else onClose();
    } catch (err) {
      setError(err.message || 'Google sign-in failed. Please try again.');
    } finally {
      setGoogleLoading(false);
    }
  }, [loginWithGoogle, onClose, onSuccess]);

  // Initialize Google Identity Services and render the button
  useEffect(() => {
    if (!isOpen || !GOOGLE_CLIENT_ID) return;
    if (googleInitialized.current) return;

    const initGoogle = () => {
      if (!window.google?.accounts?.id) return;
      googleInitialized.current = true;

      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleGoogleCredential,
        auto_select: false,
        cancel_on_tap_outside: false,
      });

      // Render the official Google button
      if (googleBtnRef.current) {
        googleBtnRef.current.innerHTML = '';
        window.google.accounts.id.renderButton(googleBtnRef.current, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          text: 'continue_with',
          shape: 'rectangular',
          logo_alignment: 'left',
          width: googleBtnRef.current.offsetWidth || 380,
        });
      }
    };

    if (window.google?.accounts?.id) {
      initGoogle();
    } else {
      // Wait for the script to load
      const interval = setInterval(() => {
        if (window.google?.accounts?.id) {
          clearInterval(interval);
          initGoogle();
        }
      }, 100);
      return () => clearInterval(interval);
    }
  }, [isOpen, handleGoogleCredential]);

  // Re-render button when tab changes
  useEffect(() => {
    if (!isOpen || !googleInitialized.current || !googleBtnRef.current) return;
    if (!window.google?.accounts?.id) return;
    setTimeout(() => {
      if (googleBtnRef.current) {
        googleBtnRef.current.innerHTML = '';
        window.google.accounts.id.renderButton(googleBtnRef.current, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          text: 'continue_with',
          shape: 'rectangular',
          logo_alignment: 'left',
          width: googleBtnRef.current.offsetWidth || 380,
        });
      }
    }, 50);
  }, [tab, isOpen]);

  // Note: reset is handled by the parent unmounting/remounting this component via key prop

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      if (tab === 'login') {
        await login(email, password);
      } else {
        await register(name, email, password);
      }
      if (onSuccess) onSuccess();
      else onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="auth-modal-overlay"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
      onClick={onClose}
    >
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        
        .auth-modal-overlay {
          background-color: rgba(0, 0, 0, 0.75);
          backdrop-filter: blur(8px);
          animation: fadeIn 0.2s ease;
        }
        [data-theme="light"] .auth-modal-overlay {
          background-color: rgba(15, 23, 42, 0.5);
        }

        .auth-modal-card {
          animation: slideUp 0.25s ease;
          background: linear-gradient(135deg, #0f1120 0%, #1a1035 100%);
          border: 1px solid rgba(108, 92, 231, 0.25);
          border-radius: 20px;
          width: 100%;
          max-width: 440px;
          padding: 2rem;
          box-shadow: 0 25px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04);
          position: relative;
          color: #ffffff;
          transition: background 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;
        }
        [data-theme="light"] .auth-modal-card {
          background: #ffffff;
          border: 1px solid rgba(99, 102, 241, 0.2);
          box-shadow: 0 25px 60px rgba(15, 23, 42, 0.15), 0 0 0 1px rgba(99, 102, 241, 0.08);
          color: #0f172a;
        }

        .auth-modal-close {
          position: absolute;
          top: 1rem;
          right: 1rem;
          background: none;
          border: none;
          color: rgba(255, 255, 255, 0.5);
          font-size: 1.5rem;
          cursor: pointer;
          line-height: 1;
          padding: 0.25rem 0.5rem;
          border-radius: 6px;
          transition: all 0.2s ease;
        }
        .auth-modal-close:hover {
          color: #ffffff;
          background: rgba(255, 255, 255, 0.1);
        }
        [data-theme="light"] .auth-modal-close {
          color: #64748b;
        }
        [data-theme="light"] .auth-modal-close:hover {
          color: #0f172a;
          background: rgba(0, 0, 0, 0.05);
        }

        .auth-modal-title {
          font-size: 1.5rem;
          font-weight: 800;
          margin: 0;
          color: #ffffff !important;
        }
        [data-theme="light"] .auth-modal-title {
          color: #0f172a !important;
        }

        .auth-modal-subtitle {
          font-size: 0.85rem;
          margin: 0.4rem 0 0;
          color: rgba(255, 255, 255, 0.6);
        }
        [data-theme="light"] .auth-modal-subtitle {
          color: #64748b;
        }

        .auth-tabs-wrap {
          display: flex;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.06);
          padding: 4px;
          border-radius: 12px;
          margin-bottom: 1.5rem;
          gap: 4px;
        }
        [data-theme="light"] .auth-tabs-wrap {
          background: #f1f5f9;
          border-color: #e2e8f0;
        }

        .auth-tab-btn {
          flex: 1;
          padding: 0.55rem;
          border-radius: 9px;
          border: none;
          background: transparent;
          color: rgba(255, 255, 255, 0.7);
          font-weight: 700;
          cursor: pointer;
          font-size: 0.88rem;
          transition: all 0.25s ease;
        }
        [data-theme="light"] .auth-tab-btn {
          color: #64748b;
        }
        .auth-tab-btn.active {
          background: linear-gradient(135deg, #6c5ce7, #a855f7) !important;
          color: #ffffff !important;
          box-shadow: 0 2px 12px rgba(108, 92, 231, 0.4);
        }

        .auth-divider-line {
          flex: 1;
          height: 1px;
          background: rgba(255, 255, 255, 0.1);
        }
        [data-theme="light"] .auth-divider-line {
          background: #e2e8f0;
        }

        .auth-divider-text {
          font-size: 0.75rem;
          color: rgba(255, 255, 255, 0.4);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        [data-theme="light"] .auth-divider-text {
          color: #94a3b8;
        }

        .auth-label {
          display: block;
          font-size: 0.82rem;
          font-weight: 600;
          margin-bottom: 0.4rem;
          color: rgba(255, 255, 255, 0.8);
        }
        [data-theme="light"] .auth-label {
          color: #334155;
        }

        .auth-input {
          width: 100%;
          padding: 0.75rem 1rem;
          border-radius: 8px;
          border: 1px solid rgba(255, 255, 255, 0.15);
          background: rgba(0, 0, 0, 0.25);
          color: #ffffff;
          font-size: 0.9rem;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s, background-color 0.2s;
          box-sizing: border-box;
        }
        .auth-input::placeholder {
          color: rgba(255, 255, 255, 0.35);
        }
        .auth-input:focus {
          border-color: #a855f7;
          box-shadow: 0 0 0 3px rgba(168, 85, 247, 0.25);
        }
        [data-theme="light"] .auth-input {
          background: #f8fafc;
          border: 1px solid #cbd5e1;
          color: #0f172a;
        }
        [data-theme="light"] .auth-input::placeholder {
          color: #94a3b8;
        }
        [data-theme="light"] .auth-input:focus {
          background: #ffffff;
          border-color: #6c5ce7;
          box-shadow: 0 0 0 3px rgba(108, 92, 231, 0.15);
        }

        .auth-eye-btn {
          position: absolute;
          right: 0.75rem;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          font-size: 1rem;
          color: rgba(255, 255, 255, 0.5);
          padding: 0;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        [data-theme="light"] .auth-eye-btn {
          color: #64748b;
        }

        .auth-fallback-google-btn {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          padding: 0.75rem;
          border-radius: 10px;
          border: 1px solid rgba(255, 255, 255, 0.2);
          background: rgba(255, 255, 255, 0.08);
          color: #ffffff;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .auth-fallback-google-btn:hover {
          background: rgba(255, 255, 255, 0.14);
        }
        [data-theme="light"] .auth-fallback-google-btn {
          border-color: #cbd5e1;
          background: #f8fafc;
          color: #1e293b;
        }
        [data-theme="light"] .auth-fallback-google-btn:hover {
          background: #f1f5f9;
        }

        .auth-footer-text {
          text-align: center;
          margin-top: 1.25rem;
          font-size: 0.8rem;
          color: rgba(255, 255, 255, 0.4);
        }
        [data-theme="light"] .auth-footer-text {
          color: #64748b;
        }
        .auth-footer-link {
          color: var(--accent-cyan, #00cec9);
          text-decoration: none;
          font-weight: 600;
        }
        [data-theme="light"] .auth-footer-link {
          color: #6c5ce7;
        }
      `}</style>

      <div
        className="auth-modal-card"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="auth-modal-close"
          aria-label="Close"
        >
          ×
        </button>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>👋</div>
          <h2 className="auth-modal-title">
            {tab === 'login' ? 'Welcome Back' : 'Create Your Account'}
          </h2>
          <p className="auth-modal-subtitle">
            {tab === 'login' ? 'Sign in to view your UX audit history' : 'Register to save and track all your evaluations'}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="auth-tabs-wrap">
          {['login', 'register'].map((t) => (
            <button
              key={t}
              onClick={() => { setTab(t); setError(''); }}
              className={`auth-tab-btn ${tab === t ? 'active' : ''}`}
            >
              {t === 'login' ? 'Sign In' : 'Register'}
            </button>
          ))}
        </div>

        {/* Official Google Sign-In Button */}
        <div style={{ marginBottom: '1.25rem' }}>
          {GOOGLE_CLIENT_ID ? (
            <div style={{ position: 'relative' }}>
              {/* Container for Google's official rendered button */}
              <div
                ref={googleBtnRef}
                id="google-signin-btn"
                style={{
                  width: '100%',
                  borderRadius: '10px',
                  overflow: 'hidden',
                  minHeight: '44px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              />
              {(googleLoading) && (
                <div style={{
                  position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)',
                  borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', fontSize: '0.875rem', fontWeight: 600,
                }}>
                  Signing in with Google...
                </div>
              )}
            </div>
          ) : (
            // Fallback if no client ID configured
            <button
              onClick={() => {
                const gEmail = prompt('Enter your Gmail address:');
                if (!gEmail) return;
                setGoogleLoading(true);
                loginWithGoogle({ email: gEmail.trim().toLowerCase(), name: gEmail.split('@')[0], avatar: '' })
                  .then(() => onClose())
                  .catch((err) => setError(err.message))
                  .finally(() => setGoogleLoading(false));
              }}
              disabled={googleLoading}
              className="auth-fallback-google-btn"
            >
              <GoogleIcon /> {googleLoading ? 'Signing in...' : 'Continue with Google'}
            </button>
          )}
        </div>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', margin: '1.25rem 0', gap: '0.75rem' }}>
          <div className="auth-divider-line" />
          <span className="auth-divider-text">
            or with email
          </span>
          <div className="auth-divider-line" />
        </div>

        {/* Error Message */}
        {error && (
          <div style={{
            padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1rem',
            background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#f87171', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem',
          }}>
            <span>⚠️</span> {error}
          </div>
        )}

        {/* Email/Password Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {tab === 'register' && (
            <div>
              <label className="auth-label">
                Full Name
              </label>
              <input
                type="text"
                className="auth-input"
                placeholder="e.g. Alex Morgan"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          )}

          <div>
            <label className="auth-label">
              Email Address
            </label>
            <input
              type="email"
              className="auth-input"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="auth-label">
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPass ? 'text' : 'password'}
                className="auth-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{ paddingRight: '3rem' }}
              />
              <button
                type="button"
                onClick={() => setShowPass(v => !v)}
                className="auth-eye-btn"
                aria-label="Toggle password visibility"
              >
                {showPass ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            style={{
              width: '100%', padding: '0.85rem',
              borderRadius: '10px', border: 'none',
              background: submitting ? 'rgba(108,92,231,0.5)' : 'linear-gradient(135deg, #6c5ce7 0%, #a855f7 100%)',
              color: '#fff', fontWeight: 700, fontSize: '1rem',
              cursor: submitting ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: submitting ? 'none' : '0 4px 20px rgba(108,92,231,0.4)',
              marginTop: '0.25rem',
            }}
          >
            {submitting ? 'Please wait...' : tab === 'login' ? '→ Sign In' : '→ Create Account'}
          </button>
        </form>

        <p className="auth-footer-text">
          By continuing, you agree to our{' '}
          <a href="/plans" className="auth-footer-link">Terms of Service</a>
        </p>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
    </svg>
  );
}
