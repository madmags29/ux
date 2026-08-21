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
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(8px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        animation: 'fadeIn 0.2s ease',
      }}
      onClick={onClose}
    >
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .auth-modal-card { animation: slideUp 0.25s ease; }
        .auth-input { width: 100%; padding: 0.75rem 1rem; border-radius: 8px; border: 1px solid rgba(255,255,255,0.15); background: rgba(0,0,0,0.25); color: var(--text-primary, #fff); font-size: 0.9rem; outline: none; transition: border-color 0.2s; box-sizing: border-box; }
        .auth-input:focus { border-color: var(--accent-purple, #6c5ce7); }
        .auth-input::placeholder { color: rgba(255,255,255,0.3); }
      `}</style>

      <div
        className="auth-modal-card"
        style={{
          background: 'linear-gradient(135deg, #0f1120 0%, #1a1035 100%)',
          border: '1px solid rgba(108, 92, 231, 0.25)',
          borderRadius: '20px',
          width: '100%',
          maxWidth: '440px',
          padding: '2rem',
          boxShadow: '0 25px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)',
          position: 'relative',
          color: '#fff',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', fontSize: '1.5rem', cursor: 'pointer', lineHeight: 1, padding: '0.25rem', borderRadius: '4px' }}
        >
          ×
        </button>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>👋</div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0 }}>
            {tab === 'login' ? 'Welcome Back' : 'Create Your Account'}
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)', margin: '0.4rem 0 0' }}>
            {tab === 'login' ? 'Sign in to view your UX audit history' : 'Register to save and track all your evaluations'}
          </p>
        </div>

        {/* Tab Switcher */}
        <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', padding: '4px', borderRadius: '12px', marginBottom: '1.5rem', gap: '4px' }}>
          {['login', 'register'].map((t) => (
            <button
              key={t}
              onClick={() => { setTab(t); setError(''); }}
              style={{
                flex: 1, padding: '0.55rem', borderRadius: '9px', border: 'none',
                background: tab === t ? 'linear-gradient(135deg, #6c5ce7, #a855f7)' : 'transparent',
                color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: '0.88rem',
                transition: 'all 0.25s ease',
                boxShadow: tab === t ? '0 2px 12px rgba(108, 92, 231, 0.4)' : 'none',
              }}
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
              style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                gap: '0.75rem', padding: '0.75rem', borderRadius: '10px',
                border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.08)',
                color: '#fff', fontWeight: 600, cursor: 'pointer',
              }}
            >
              <GoogleIcon /> {googleLoading ? 'Signing in...' : 'Continue with Google'}
            </button>
          )}
        </div>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', margin: '1.25rem 0', gap: '0.75rem' }}>
          <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }} />
          <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            or with email
          </span>
          <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }} />
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
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.4rem', color: 'rgba(255,255,255,0.7)' }}>
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
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.4rem', color: 'rgba(255,255,255,0.7)' }}>
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
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.4rem', color: 'rgba(255,255,255,0.7)' }}>
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
                style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', color: 'rgba(255,255,255,0.4)' }}
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

        <p style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.8rem', color: 'rgba(255,255,255,0.35)' }}>
          By continuing, you agree to our{' '}
          <a href="/plans" style={{ color: 'var(--accent-cyan, #00cec9)', textDecoration: 'none' }}>Terms of Service</a>
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
