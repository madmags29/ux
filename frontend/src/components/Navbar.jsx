import { useState, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import Logo from './Logo';
import { useAuth } from '../context/AuthContext';
import AuthModal from './AuthModal';

const BASE_NAV_LINKS = [
  { to: '/', label: 'Evaluator' },
  { to: '/blog', label: 'Blog' },
  { to: '/about', label: 'About' },
  { to: '/plans', label: 'Plans' },
  { to: '/contact', label: 'Contact' },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState('login');
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setMenuOpen(false), 0);
    return () => clearTimeout(timer);
  }, [location.pathname]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  const navLinks = user
    ? [
        ...BASE_NAV_LINKS,
        { to: '/dashboard', label: 'Dashboard' },
        { to: '/profile', label: 'Profile' },
      ]
    : BASE_NAV_LINKS;

  return (
    <>
      <nav className={`navbar${scrolled ? ' navbar--scrolled' : ''}`}>
        <div className="navbar__inner">
          {/* Logo */}
          <NavLink to="/" style={{ textDecoration: 'none' }}>
            <Logo size="medium" animated={true} />
          </NavLink>

          {/* Desktop Links */}
          <div className="navbar__links">
            {navLinks.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  `navbar__link${isActive ? ' navbar__link--active' : ''}`
                }
              >
                {label}
              </NavLink>
            ))}
          </div>

          {/* CTA, Theme Toggle & User Auth */}
          <div className="navbar__cta">
            <button
              onClick={toggleTheme}
              className="theme-toggle-btn"
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
              aria-label="Toggle Light/Dark Theme"
              style={{
                background: 'var(--glass-bg)',
                border: '1px solid var(--glass-border)',
                color: 'var(--text-primary)',
                padding: '0.45rem 0.75rem',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                fontSize: '0.85rem',
                fontWeight: 600,
                transition: 'all 0.3s ease'
              }}
            >
              {theme === 'dark' ? '☀️ Light' : '🌙 Dark'}
            </button>

            {user ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <NavLink
                  to="/profile"
                  title="My Profile & Security"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    textDecoration: 'none',
                    color: 'var(--text-primary)',
                    background: 'var(--glass-bg)',
                    padding: '0.35rem 0.75rem',
                    borderRadius: '20px',
                    border: '1px solid var(--glass-border)',
                  }}
                >
                  <img
                    src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=6c5ce7&color=fff`}
                    alt={user.name}
                    style={{ width: '26px', height: '26px', borderRadius: '50%' }}
                  />
                  <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{user.name.split(' ')[0]}</span>
                </NavLink>

                <button
                  onClick={() => { logout(); navigate('/'); }}
                  className="btn btn-secondary navbar__cta-btn"
                  style={{ padding: '0.45rem 0.85rem', fontSize: '0.85rem' }}
                >
                  Logout
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={() => { setAuthModalTab('login'); setAuthModalOpen(true); }}
                  className="btn btn-secondary navbar__cta-btn"
                  style={{ padding: '0.45rem 0.85rem', fontSize: '0.85rem' }}
                >
                  Sign In
                </button>
                <button
                  onClick={() => { setAuthModalTab('register'); setAuthModalOpen(true); }}
                  className="btn btn-primary navbar__cta-btn"
                  style={{ padding: '0.45rem 0.85rem', fontSize: '0.85rem' }}
                >
                  Register
                </button>
              </div>
            )}

            {/* Hamburger */}
            <button
              className={`navbar__hamburger${menuOpen ? ' navbar__hamburger--open' : ''}`}
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Toggle menu"
            >
              <span /><span /><span />
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <div className={`navbar__mobile${menuOpen ? ' navbar__mobile--open' : ''}`}>
          {navLinks.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `navbar__mobile-link${isActive ? ' navbar__mobile-link--active' : ''}`
              }
            >
              {label}
            </NavLink>
          ))}
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
            <button
              onClick={toggleTheme}
              style={{
                flex: 1,
                background: 'var(--glass-bg)',
                border: '1px solid var(--glass-border)',
                color: 'var(--text-primary)',
                padding: '0.6rem',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.85rem'
              }}
            >
              {theme === 'dark' ? '☀️ Light' : '🌙 Dark'}
            </button>
            {user ? (
              <button
                onClick={() => { logout(); navigate('/'); }}
                className="btn btn-secondary"
                style={{ flex: 1, justifyContent: 'center' }}
              >
                Logout
              </button>
            ) : (
              <button
                onClick={() => { setAuthModalTab('login'); setAuthModalOpen(true); }}
                className="btn btn-primary"
                style={{ flex: 1, justifyContent: 'center' }}
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </nav>

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialTab={authModalTab}
      />
      <div className="navbar__spacer" />
    </>
  );
}
