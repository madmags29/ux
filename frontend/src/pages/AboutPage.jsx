import { Link } from 'react-router-dom';

export default function AboutPage() {
  const features = [
    { icon: '🔍', title: 'AI Vision Analysis', desc: 'Expert AI examines every pixel of your design — layout, hierarchy, contrast, spacing — just like a senior designer would.' },
    { icon: '📸', title: 'Multi-Screen Crawling', desc: 'Automatically discovers and screenshots every page of your prototype or website for a comprehensive audit.' },
    { icon: '📊', title: '11-Point Evaluation', desc: 'Scored across First Impression, UI Design, UX, Accessibility, Mobile, Conversion, Nielsen Heuristics, and more.' },
    { icon: '⚡', title: 'Real-Time Streaming', desc: 'Results stream in screen by screen as the AI analyzes each one — no waiting for a batch result.' },
    { icon: '📄', title: 'PDF Reports', desc: 'Download beautiful, dark-themed multi-page PDF reports you can share with clients, founders, and dev teams.' },
    { icon: '🗺️', title: 'Prioritized Roadmap', desc: 'Every report includes a ranked improvement roadmap — Critical, Important, and Enhancement — with effort estimates.' },
  ];


  return (
    <div>
      {/* Hero */}
      <section className="page-hero">
        <div className="page-hero__badge">About UX Expert</div>
        <h1>Built for Designers, Founders<br />& Product Teams</h1>
        <p>
          UX Expert is an AI-powered evaluation platform that gives you the same quality
          of feedback as hiring a senior UX consultant — in seconds, not weeks.
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap', marginTop: '2rem' }}>
          <Link to="/" className="btn btn-primary">Try the Evaluator →</Link>
          <Link to="/contact" className="btn">Get in Touch</Link>
        </div>
      </section>

      {/* Mission */}
      <section className="page-section">
        <div className="about-mission glass-panel">
          <div className="about-mission__content">
            <h2>Our Mission</h2>
            <p>
              Good UX shouldn't be gatekept by expensive design agencies or slow review cycles.
              Every founder, product manager, and developer deserves access to world-class design
              critique — instantly, affordably, and with zero jargon.
            </p>
            <p style={{ marginTop: '1rem' }}>
              We combine the analytical rigour of Nielsen's 10 heuristics, WCAG accessibility
              standards, and conversion optimization principles with the raw intelligence of
              Expert AI Vision — delivering the kind of honest, evidence-based critique that previously
              required a director-level UX consultant.
            </p>
          </div>
          <div className="about-mission__stat-grid">
            {[
              { value: '11', label: 'Evaluation Dimensions' },
              { value: '10', label: 'Nielsen Heuristics' },
              { value: 'Expert AI', label: 'Vision Model' },
              { value: '∞', label: 'Screens Per Audit' },
            ].map(({ value, label }) => (
              <div key={label} className="about-stat glass-panel">
                <div className="about-stat__value text-gradient">{value}</div>
                <div className="about-stat__label">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="page-section">
        <div className="section-header">
          <h2>Everything You Need</h2>
          <p>Six powerful capabilities, one seamless workflow.</p>
        </div>
        <div className="features-grid">
          {features.map(({ icon, title, desc }) => (
            <div key={title} className="feature-card glass-panel">
              <div className="feature-card__icon">{icon}</div>
              <h3>{title}</h3>
              <p>{desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
