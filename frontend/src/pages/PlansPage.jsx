import { Link } from 'react-router-dom';
import { useState } from 'react';

const PLANS = [
  {
    name: 'Starter',
    price: 'Free',
    period: '',
    desc: 'Perfect for trying out the AI UX Evaluator on your first prototype.',
    color: 'var(--text-secondary)',
    badge: null,
    features: [
      '3 evaluations per month',
      'Up to 3 screens per evaluation',
      'All 11 evaluation dimensions',
      'PDF report download',
      'Basic roadmap',
    ],
    cta: 'Start for Free',
    ctaTo: '/',
    primary: false,
  },
  {
    name: 'Pro',
    price: '$29',
    period: '/month',
    desc: 'For designers and founders who review products regularly and need full depth.',
    color: 'var(--accent-primary)',
    badge: 'Most Popular',
    features: [
      'Unlimited evaluations',
      'Up to 10 screens per evaluation',
      'All 11 evaluation dimensions',
      'PDF report download',
      'Prioritized roadmap with effort scores',
      'AI redesign suggestions',
      'Nielsen heuristic table',
      'Benchmark comparisons',
      'Priority processing',
    ],
    cta: 'Get Pro',
    ctaTo: '/contact',
    primary: true,
  },
  {
    name: 'Team',
    price: '$79',
    period: '/month',
    desc: 'For product teams running regular audits across multiple products.',
    color: 'var(--accent-secondary)',
    badge: null,
    features: [
      'Everything in Pro',
      'Up to 5 team members',
      'Shared report library',
      'Unlimited screens per evaluation',
      'White-label PDF reports',
      'Slack/email report delivery',
      'Custom evaluation criteria',
      'Dedicated support',
    ],
    cta: 'Talk to Sales',
    ctaTo: '/contact',
    primary: false,
  },
];

const FAQ = [
  { q: 'How does the AI analysis work?', a: 'We use OpenAI\'s advanced multimodal Vision model, combined with your expert UX evaluation prompt. Puppeteer takes a full screenshot of each page, which is sent to the AI along with our structured evaluation criteria to produce a detailed JSON report.' },
  { q: 'How long does an evaluation take?', a: 'Typically 30–90 seconds depending on the number of screens. Results stream in live screen by screen, so you start seeing insights almost immediately.' },
  { q: 'What kind of sites and prototypes can I evaluate?', a: 'Any publicly accessible URL — including live websites, Framer prototypes, Webflow sites, Vercel previews, and more. Figma links require the file to be made public.' },
  { q: 'Can I evaluate password-protected or local sites?', a: 'Not in the current version. The site must be publicly accessible. For local development, you can use tools like ngrok to expose your localhost temporarily.' },
  { q: 'Is my data stored or used for training?', a: 'Screenshots are processed in memory and deleted after evaluation. We do not store your designs, URLs, or AI outputs beyond your active session.' },
];

export default function PlansPage() {
  const [annual, setAnnual] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);

  return (
    <div>
      {/* Hero */}
      <section className="page-hero">
        <div className="page-hero__badge">Pricing</div>
        <h1>Simple, Transparent Pricing</h1>
        <p>Start for free. Scale as you grow. No hidden fees, no surprises.</p>

        {/* Toggle */}
        <div className="plans-toggle glass-panel">
          <span className={!annual ? 'plans-toggle__active' : ''} onClick={() => setAnnual(false)}>Monthly</span>
          <button
            className={`plans-toggle__switch${annual ? ' plans-toggle__switch--on' : ''}`}
            onClick={() => setAnnual(!annual)}
            aria-label="Toggle annual billing"
          >
            <span className="plans-toggle__knob" />
          </button>
          <span className={annual ? 'plans-toggle__active' : ''} onClick={() => setAnnual(true)}>
            Annual <span className="plans-toggle__save">Save 30%</span>
          </span>
        </div>
      </section>

      {/* Plans Grid */}
      <section className="page-section">
        <div className="plans-grid">
          {PLANS.map((plan) => {
            const price = annual && plan.price !== 'Free'
              ? `$${Math.round(parseInt(plan.price.replace('$', '')) * 0.7)}`
              : plan.price;

            return (
              <div key={plan.name} className={`plan-card glass-panel${plan.primary ? ' plan-card--primary' : ''}`}>
                {plan.badge && <div className="plan-card__badge">{plan.badge}</div>}
                <div className="plan-card__header">
                  <h3 className="plan-card__name">{plan.name}</h3>
                  <div className="plan-card__price">
                    <span className="plan-card__amount">{price}</span>
                    {plan.period && <span className="plan-card__period">{annual ? '/mo, billed annually' : plan.period}</span>}
                  </div>
                  <p className="plan-card__desc">{plan.desc}</p>
                </div>
                <ul className="plan-card__features">
                  {plan.features.map((f) => (
                    <li key={f}>
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <circle cx="8" cy="8" r="7.5" stroke="url(#ck)" strokeWidth="1"/>
                        <path d="M5 8l2 2 4-4" stroke="url(#ck)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        <defs>
                          <linearGradient id="ck" x1="0" y1="0" x2="16" y2="16" gradientUnits="userSpaceOnUse">
                            <stop stopColor="#6366f1"/><stop offset="1" stopColor="#a855f7"/>
                          </linearGradient>
                        </defs>
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  to={plan.ctaTo}
                  className={`btn plan-card__cta${plan.primary ? ' btn-primary' : ''}`}
                >
                  {plan.cta}
                </Link>
              </div>
            );
          })}
        </div>
      </section>

      {/* FAQ */}
      <section className="page-section">
        <div className="section-header">
          <h2>Frequently Asked Questions</h2>
          <p>Everything you need to know before getting started.</p>
        </div>
        <div className="faq-list" style={{ maxWidth: 700, margin: '0 auto' }}>
          {FAQ.map(({ q, a }, i) => (
            <div
              key={i}
              className={`faq-item glass-panel${openFaq === i ? ' faq-item--open' : ''}`}
              onClick={() => setOpenFaq(openFaq === i ? null : i)}
            >
              <div className="faq-item__question">
                <span>{q}</span>
                <svg className="faq-item__icon" width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M5 8l5 5 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              {openFaq === i && <p className="faq-item__answer">{a}</p>}
            </div>
          ))}
        </div>
      </section>

      {/* CTA Banner */}
      <section className="page-section" style={{ paddingBottom: '5rem' }}>
        <div className="cta-banner glass-panel">
          <h2>Ready to elevate your product?</h2>
          <p>Run your first free UX evaluation in under 60 seconds.</p>
          <Link to="/" className="btn btn-primary" style={{ fontSize: '1rem', padding: '0.875rem 2rem' }}>
            Analyze a Design →
          </Link>
        </div>
      </section>
    </div>
  );
}
