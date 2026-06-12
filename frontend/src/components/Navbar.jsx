import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';

const NAV_LINKS = [
  { to: '/', label: 'Evaluator' },
  { to: '/about', label: 'About' },
  { to: '/plans', label: 'Plans' },
  { to: '/contact', label: 'Contact' },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [location]);

  return (
    <>
      <nav className={`navbar${scrolled ? ' navbar--scrolled' : ''}`}>
        <div className="navbar__inner">
          {/* Logo */}
          <NavLink to="/" className="navbar__logo">
            <div className="navbar__logo-icon" style={{ overflow: 'hidden' }}>
              <img src="/logo.png" alt="UX Expert Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <span className="navbar__logo-text">
              UX<span className="navbar__logo-accent">Expert</span>
            </span>
          </NavLink>

          {/* Desktop Links */}
          <div className="navbar__links">
            {NAV_LINKS.map(({ to, label }) => (
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

          {/* CTA */}
          <div className="navbar__cta">
            <NavLink to="/plans" className="btn btn-primary navbar__cta-btn">
              Get Started
            </NavLink>
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
          {NAV_LINKS.map(({ to, label }) => (
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
          <NavLink to="/plans" className="btn btn-primary" style={{ marginTop: '0.5rem', justifyContent: 'center' }}>
            Get Started
          </NavLink>
        </div>
      </nav>
      <div className="navbar__spacer" />
    </>
  );
}
