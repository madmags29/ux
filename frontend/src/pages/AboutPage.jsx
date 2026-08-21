import { Link } from 'react-router-dom';
import AnimatedSection from '../components/AnimatedSection';
import SEO from '../components/SEO';

const ABOUT_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'AboutPage',
  '@id': 'https://www.ratemyux.com/about#webpage',
  url: 'https://www.ratemyux.com/about',
  name: 'About Rate My UX — AI Vision Methodology & Usability Standards',
  description: 'Discover how Rate My UX evaluates websites and Figma prototypes using neural Vision AI models, Jakob Nielsen\'s 10 Heuristics, and WCAG 2.2 accessibility guidelines.',
  mainEntity: {
    '@type': 'Organization',
    name: 'Rate My UX',
    url: 'https://www.ratemyux.com',
    description: 'AI-powered UX design auditing platform built by Dev Designs.',
    parentOrganization: {
      '@type': 'Organization',
      name: 'Dev Designs',
      url: 'https://devdesigns.net'
    }
  }
};

export default function AboutPage() {
  const dimensions = [
    { num: '01', title: 'First Impression & Visual Hierarchy', desc: 'Evaluates 3-second emotional appeal, hero clarity, focal points, and cognitive scanability.' },
    { num: '02', title: 'UI Design & Spacing System', desc: 'Audits typography scales, 8pt grid consistency, whitespace balance, and component alignment.' },
    { num: '03', title: 'UX & Interaction Flow', desc: 'Checks journey progression, form ergonomics, intuitive next-steps, and friction reduction.' },
    { num: '04', title: 'WCAG 2.2 Accessibility', desc: 'Validates contrast ratios, minimum 48px touch targets, legibility, and inclusive structure.' },
    { num: '05', title: 'Content & Microcopy', desc: 'Scrutinizes headline persuasiveness, CTA action verbs, clarity, and cognitive overload.' },
    { num: '06', title: 'Mobile Ergonomics', desc: 'Thumb-zone analysis, responsive adaptation, viewport scaling, and sticky action bar utility.' },
    { num: '07', title: 'Conversion Optimization (CRO)', desc: 'Identifies drop-off bottlenecks, trust indicators, value proposition visibility, and checkout UX.' },
    { num: '08', title: 'Jakob Nielsen’s 10 Heuristics', desc: 'System status visibility, error prevention, user control, consistency, and minimalist design.' },
    { num: '09', title: 'Industry Benchmarks', desc: 'Comparative percentile scoring against world-class SaaS, eCommerce, and FinTech design patterns.' },
    { num: '10', title: 'Prioritized Action Roadmap', desc: 'Classifies every issue by Effort vs Impact into Critical, Important, and Polish priorities.' },
    { num: '11', title: 'AI Redesign Wireframes', desc: 'Generates concrete layout recommendations and CSS/HTML implementation guidance for developers.' }
  ];

  return (
    <div>
      <SEO
        title="About Rate My UX | Neural AI Vision Methodology &amp; UX Standards"
        description="Learn how Rate My UX uses neural Vision AI models, Nielsen's 10 Usability Heuristics, and WCAG 2.2 accessibility standards to deliver automated UX evaluations for web apps and Figma prototypes."
        canonicalPath="/about"
        keywords="About Rate My UX, AI UX Methodology, Nielsen Heuristic Audit, WCAG 2.2 Accessibility Check, AI Design Critique Framework, Usability Standards"
        schema={ABOUT_SCHEMA}
      />

      {/* Hero */}
      <AnimatedSection>
        <section className="page-hero">
          <div className="page-hero__badge">About Rate My UX</div>
          <h1>Built for Designers, Founders<br />&amp; <span className="text-gradient">Product Teams</span></h1>
          <p>
            Rate My UX is an AI-powered evaluation platform that gives you the depth, precision,
            and actionable feedback of a principal design agency — in seconds, directly from your browser.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap', marginTop: '2rem' }}>
            <Link to="/" className="btn btn-primary">⚡ Try the Evaluator</Link>
            <Link to="/plans" className="btn btn-secondary">View Pricing</Link>
          </div>
        </section>
      </AnimatedSection>

      {/* Mission */}
      <AnimatedSection delay={100}>
        <section className="page-section">
          <div className="about-mission glass-panel">
            <div className="about-mission__content">
              <h2>Our <span className="text-gradient">Mission</span></h2>
              <p>
                Exceptional UX should not be gatekept by $15,000 agency audit fees or multi-week review cycles.
                Every founder, product manager, and developer deserves access to rigorous, evidence-based usability
                feedback before launching to real users.
              </p>
              <p style={{ marginTop: '1rem' }}>
                We combine the analytical power of Jakob Nielsen's 10 Usability Heuristics, W3C WCAG 2.2 accessibility
                criteria, and conversion rate optimization (CRO) frameworks with multimodal neural Vision AI models —
                empowering teams to catch usability defects before they harm revenue.
              </p>
            </div>
            <div className="about-mission__stat-grid">
              {[
                { value: '11', label: 'Evaluation Dimensions' },
                { value: '10', label: 'Nielsen Heuristics' },
                { value: 'WCAG 2.2', label: 'Accessibility Standard' },
                { value: '100%', label: 'Automated & Instant' },
              ].map(({ value, label }) => (
                <div key={label} className="about-stat glass-panel">
                  <div className="about-stat__value text-gradient">{value}</div>
                  <div className="about-stat__label">{label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </AnimatedSection>

      {/* The 11 Dimensions */}
      <section className="page-section">
        <AnimatedSection>
          <div className="section-header">
            <h2>The 11 <span className="text-gradient">Evaluation Dimensions</span></h2>
            <p>Our comprehensive framework inspects every layer of your digital product experience.</p>
          </div>
        </AnimatedSection>
        <div className="features-grid">
          {dimensions.map(({ num, title, desc }, i) => (
            <AnimatedSection key={title} delay={i * 50}>
              <div className="feature-card glass-panel">
                <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--accent-cyan)', marginBottom: '0.5rem', fontFamily: 'monospace' }}>
                  DIMENSION {num}
                </div>
                <h3>{title}</h3>
                <p>{desc}</p>
              </div>
            </AnimatedSection>
          ))}
        </div>
      </section>
    </div>
  );
}
