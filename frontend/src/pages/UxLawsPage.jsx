import { useState } from 'react';
import { Link } from 'react-router-dom';
import AnimatedSection from '../components/AnimatedSection';
import SEO from '../components/SEO';

const UX_LAWS = [
  {
    num: '01',
    name: "Hick's Law",
    category: 'Cognitive Load',
    summary: 'The time it takes to make a decision increases with the number and complexity of choices.',
    example: 'Limit top-level navigation to 5–7 items, group secondary actions into menus, and highlight one primary CTA above the fold.',
    aiCheck: 'Counts simultaneous navigation links, competing CTAs, and unchunked filter options on every screen.',
  },
  {
    num: '02',
    name: "Fitts's Law",
    category: 'Ergonomics & Interaction',
    summary: 'The time to acquire a target is a function of the distance to and size of the target.',
    example: 'Ensure mobile buttons are at least 48×48px, place primary actions in the thumb zone, and keep related controls close together.',
    aiCheck: 'Measures interactive button bounding boxes, spacing gaps, and mobile thumb-zone accessibility.',
  },
  {
    num: '03',
    name: "Jakob's Law",
    category: 'Behavioral Psychology',
    summary: 'Users spend most of their time on other sites, so they prefer your site to work the same way as sites they already know.',
    example: 'Keep logos top-left, search bars top-center/right, shopping carts top-right, and standard form label placements.',
    aiCheck: 'Detects unconventional navigation placements, non-standard iconography, and broken mental-model patterns.',
  },
  {
    num: '04',
    name: "Miller's Law",
    category: 'Cognitive Load',
    summary: 'The average person can only keep around 7 (plus or minus 2) items in their working memory.',
    example: 'Chunk long forms into 3–4 logical steps, format phone/card numbers into groups, and cap dashboard KPIs at 4–5 cards.',
    aiCheck: 'Audits form field density, card grid counts, and paragraph scanability across viewports.',
  },
  {
    num: '05',
    name: 'Law of Proximity',
    category: 'Visual & Gestalt',
    summary: 'Objects that are near, or proximate to, each other tend to be grouped together.',
    example: 'Keep form labels closer to their input field than to the preceding field, and group card metadata cleanly with whitespace.',
    aiCheck: 'Evaluates 8pt spacing rhythm, label-to-input distance, and whitespace separation between unrelated sections.',
  },
  {
    num: '06',
    name: 'Law of Prägnanz',
    category: 'Visual & Gestalt',
    summary: 'People will perceive and interpret ambiguous or complex images as the simplest form possible.',
    example: 'Use clean geometric layouts, clear visual hierarchy, and simple iconography instead of noisy decorative borders.',
    aiCheck: 'Scores visual clutter, competing focal points, and structural simplicity at a 3-second glance.',
  },
  {
    num: '07',
    name: 'Peak-End Rule',
    category: 'Behavioral Psychology',
    summary: 'People judge an experience largely based on how they felt at its most intense point (peak) and at its end.',
    example: 'Delight users during onboarding milestones, provide reassuring checkout confirmations, and design empathetic empty/error states.',
    aiCheck: 'Reviews completion screens, empty states, error recovery clarity, and conversion feedback moments.',
  },
  {
    num: '08',
    name: "Tesler's Law",
    category: 'Cognitive Load',
    summary: 'Every application has an inherent amount of complexity that cannot be removed—only shifted between the system and the user.',
    example: 'Use smart defaults, auto-formatting inputs, postal-code address lookup, and one-click OAuth instead of manual entry.',
    aiCheck: 'Identifies unnecessary manual steps, missing smart defaults, and high-friction user workflows.',
  },
  {
    num: '09',
    name: 'Von Restorff Effect',
    category: 'Visual & Gestalt',
    summary: 'When multiple similar objects are present, the one that differs from the rest is most likely to be remembered.',
    example: 'Give the primary CTA high contrast and unique color treatment, and highlight the "Most Popular" pricing tier.',
    aiCheck: 'Checks CTA contrast isolation, primary-vs-secondary button differentiation, and visual emphasis.',
  },
  {
    num: '10',
    name: 'Aesthetic-Usability Effect',
    category: 'Visual & Gestalt',
    summary: 'Users often perceive aesthetically pleasing design as design that is more usable and trustworthy.',
    example: 'Maintain consistent typography scales, harmonious color contrast, balanced alignment, and crisp visual polish.',
    aiCheck: 'Evaluates overall UI polish, typography harmony, alignment precision, and brand trust perception.',
  },
];

const CATEGORIES = ['All', 'Cognitive Load', 'Ergonomics & Interaction', 'Visual & Gestalt', 'Behavioral Psychology'];

const FAQS = [
  {
    q: 'How does Rate My UX audit my product against the 10 Laws of UX?',
    a: 'Our Vision AI engine inspects your live website screenshots or Figma frames alongside Jakob Nielsen’s 10 Heuristics and automatically scores all 10 Laws of UX—highlighting specific UI elements that violate Hick’s Law, Fitts’s Law, Law of Proximity, or Von Restorff Effect.',
  },
  {
    q: 'What is the difference between Nielsen’s Heuristics and Laws of UX?',
    a: 'Jakob Nielsen’s 10 Heuristics are practical interface usability rules (like error prevention and system status), while the Laws of UX are rooted in cognitive psychology and human-computer ergonomics (like decision speed, target size, and visual grouping). Rate My UX audits both.',
  },
  {
    q: 'Who can fix the UX Law issues found in my audit?',
    a: 'You can use the prioritized effort-vs-impact roadmap in your PDF report with your own team, or partner directly with Dev Designs (devdesigns.net)—the design and engineering agency behind Rate My UX—for fast, conversion-focused redesigns.',
  },
];

const UX_LAWS_SCHEMA = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebPage',
      '@id': 'https://www.ratemyux.com/ux-laws#webpage',
      url: 'https://www.ratemyux.com/ux-laws',
      name: '10 Laws of UX Guide & Automated AI Audit — Rate My UX',
      description: 'Explore the 10 essential Laws of UX audited by Rate My UX Vision AI: Hick’s Law, Fitts’s Law, Jakob’s Law, Miller’s Law, Proximity, Prägnanz, Peak-End Rule, Tesler’s Law, Von Restorff Effect, and Aesthetic-Usability.',
      publisher: {
        '@type': 'Organization',
        name: 'Rate My UX',
        url: 'https://www.ratemyux.com',
      },
    },
    {
      '@type': 'FAQPage',
      mainEntity: FAQS.map((f) => ({
        '@type': 'Question',
        name: f.q,
        acceptedAnswer: { '@type': 'Answer', text: f.a },
      })),
    },
  ],
};

export default function UxLawsPage() {
  const [activeCategory, setActiveCategory] = useState('All');
  const [openFaq, setOpenFaq] = useState(null);

  const filteredLaws = activeCategory === 'All'
    ? UX_LAWS
    : UX_LAWS.filter((l) => l.category === activeCategory);

  return (
    <div style={{ paddingBottom: '5rem' }}>
      <SEO
        title="10 Laws of UX Guide &amp; Automated AI Audit | Rate My UX"
        description="Learn how the 10 Laws of UX—Hick's Law, Fitts's Law, Jakob's Law, Miller's Law, and more—shape high-converting digital products, and audit your site with Rate My UX."
        canonicalPath="/ux-laws"
        keywords="Laws of UX, Hicks Law, Fitts Law, Jakobs Law, Millers Law, Law of Proximity, Von Restorff Effect, AI UX Audit, Dev Designs"
        schema={UX_LAWS_SCHEMA}
      />

      {/* Hero */}
      <AnimatedSection>
        <section className="page-hero">
          <div className="page-hero__badge">Cognitive &amp; Ergonomic UX Science</div>
          <h1>The 10 <span className="text-gradient">Laws of UX</span></h1>
          <p>
            Every screen evaluated on Rate My UX is audited against these 10 foundational psychological and
            ergonomic principles—turning behavioral science into concrete, actionable fixes.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap', marginTop: '2rem' }}>
            <Link to="/" className="btn btn-primary">⚡ Audit Your Site Against UX Laws</Link>
            <a
              href="https://devdesigns.net"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary"
            >
              🎨 Redesign with Dev Designs →
            </a>
          </div>
        </section>
      </AnimatedSection>

      {/* Filter Tabs */}
      <section className="page-section" style={{ paddingTop: 0 }}>
        <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '2.5rem' }}>
          {CATEGORIES.map((cat) => {
            const active = activeCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                style={{
                  padding: '0.55rem 1.15rem',
                  borderRadius: '50px',
                  border: active ? '1px solid var(--accent-cyan)' : '1px solid var(--glass-border)',
                  background: active ? 'rgba(0, 240, 255, 0.12)' : 'var(--glass-bg)',
                  color: active ? 'var(--accent-cyan)' : 'var(--text-secondary)',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* UX Laws Grid */}
        <div className="features-grid">
          {filteredLaws.map((law, i) => (
            <AnimatedSection key={law.name} delay={i * 40}>
              <div className="feature-card glass-panel" style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--accent-violet)', fontFamily: 'monospace' }}>
                    LAW {law.num}
                  </span>
                  <span
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      padding: '0.2rem 0.6rem',
                      borderRadius: '20px',
                      background: 'rgba(0, 240, 255, 0.1)',
                      color: 'var(--accent-cyan)',
                    }}
                  >
                    {law.category}
                  </span>
                </div>

                <h2 style={{ fontSize: '1.2rem', margin: 0, color: 'var(--text-primary)' }}>{law.name}</h2>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
                  {law.summary}
                </p>

                <div style={{ marginTop: 'auto', paddingTop: '0.75rem', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    <strong style={{ color: 'var(--text-primary)' }}>Best Practice:</strong> {law.example}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', lineHeight: 1.5 }}>
                    <strong style={{ color: 'var(--accent-cyan)' }}>AI Audit Check:</strong> {law.aiCheck}
                  </div>
                </div>
              </div>
            </AnimatedSection>
          ))}
        </div>
      </section>

      {/* Dev Designs Agency Promotion Banner */}
      <AnimatedSection delay={100}>
        <section className="page-section">
          <div
            className="glass-panel"
            style={{
              padding: '2.5rem',
              borderRadius: 'var(--radius-lg)',
              background: 'linear-gradient(135deg, rgba(108,92,231,0.12), rgba(0,240,255,0.08))',
              border: '1.5px solid var(--border-glow)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '2rem',
            }}
          >
            <div style={{ flex: '1 1 460px' }}>
              <div
                style={{
                  display: 'inline-block',
                  padding: '0.25rem 0.75rem',
                  borderRadius: '20px',
                  background: 'rgba(0, 240, 255, 0.14)',
                  color: 'var(--accent-cyan)',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  marginBottom: '0.75rem',
                  letterSpacing: '0.04em',
                }}
              >
                ✨ BUILT BY DEV DESIGNS
              </div>
              <h2 style={{ fontSize: '1.65rem', marginBottom: '0.65rem', color: 'var(--text-primary)' }}>
                Want Experts to Apply These UX Laws to Your Product?
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.65, margin: 0 }}>
                <strong>Dev Designs</strong> (<a href="https://devdesigns.net" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-cyan)', textDecoration: 'none', fontWeight: 600 }}>devdesigns.net</a>) is the UI/UX design and full-stack product studio behind Rate My UX. We craft high-converting SaaS interfaces, design systems, websites, and mobile apps engineered around proven UX laws.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '0.85rem', flexWrap: 'wrap' }}>
              <a
                href="https://devdesigns.net"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary"
                style={{ padding: '0.85rem 1.75rem', fontSize: '0.95rem' }}
              >
                🚀 Visit DevDesigns.net →
              </a>
              <Link to="/contact" className="btn btn-secondary" style={{ padding: '0.85rem 1.4rem' }}>
                Book UX Consultation
              </Link>
            </div>
          </div>
        </section>
      </AnimatedSection>

      {/* FAQ Section */}
      <AnimatedSection delay={120}>
        <section className="page-section" style={{ maxWidth: '820px', margin: '0 auto' }}>
          <div className="section-header">
            <h2>Frequently Asked <span className="text-gradient">Questions</span></h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {FAQS.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={faq.q}
                  className="glass-panel"
                  style={{ borderRadius: 'var(--radius-sm)', border: '1px solid var(--glass-border)', overflow: 'hidden' }}
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      background: 'transparent',
                      border: 'none',
                      padding: '1rem 1.25rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      cursor: 'pointer',
                      color: 'var(--text-primary)',
                      fontSize: '0.95rem',
                      fontWeight: 600,
                    }}
                  >
                    <span>{faq.q}</span>
                    <span style={{ fontSize: '1.2rem', color: 'var(--accent-cyan)' }}>{isOpen ? '−' : '+'}</span>
                  </button>
                  {isOpen && (
                    <div style={{ padding: '0 1.25rem 1rem', color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </AnimatedSection>
    </div>
  );
}
