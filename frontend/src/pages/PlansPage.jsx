import { Link } from 'react-router-dom';
import { useState } from 'react';
import AnimatedSection from '../components/AnimatedSection';
import SEO from '../components/SEO';

const PLANS_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'ItemPage',
  '@id': 'https://www.ratemyux.com/plans#webpage',
  url: 'https://www.ratemyux.com/plans',
  name: 'Rate My UX Subscription Plans & Pricing',
  description: 'Compare Free, Pro, and Team subscription pricing plans for Rate My UX AI evaluation tool.',
  mainEntity: {
    '@type': 'OfferCatalog',
    name: 'Rate My UX Audit Plans',
    itemListElement: [
      {
        '@type': 'Offer',
        name: 'Free Starter Plan',
        price: '0',
        priceCurrency: 'USD',
        description: '3 UX evaluations per month with full 11-dimension scores, Nielsen heuristic audit, and PDF exports.'
      },
      {
        '@type': 'Offer',
        name: 'Pro Plan',
        price: '29',
        priceCurrency: 'USD',
        description: 'Unlimited evaluations, up to 10 screens per audit, prioritized roadmap with effort scores, and AI redesign suggestions.'
      },
      {
        '@type': 'Offer',
        name: 'Team Plan',
        price: '79',
        priceCurrency: 'USD',
        description: 'Team collaboration with 5 member seats, white-label PDF reports, shared audit library, and custom heuristic criteria.'
      }
    ]
  }
};

const PLANS = [
  {
    name: 'Starter',
    price: 'Free',
    period: '',
    desc: 'Perfect for testing the AI UX Evaluator on your website or Figma prototype.',
    badge: null,
    features: [
      '3 evaluations per month',
      'Up to 3 screens per evaluation',
      'All 11 evaluation dimensions',
      'Jakob Nielsen heuristic checks',
      'WCAG 2.2 accessibility score',
      'Downloadable PDF audit report',
      'Audit history saved in dashboard',
    ],
    cta: 'Start for Free',
    ctaTo: '/',
    primary: false,
  },
  {
    name: 'Pro',
    price: '$29',
    period: '/month',
    desc: 'For product designers, indie founders, and UX teams running regular product audits.',
    badge: 'Most Popular',
    features: [
      'Unlimited evaluations',
      'Up to 10 screens per audit',
      'All 11 evaluation dimensions',
      'Prioritized effort vs impact roadmap',
      'AI wireframe & redesign advice',
      'Industry benchmark comparisons',
      'Priority Vision AI processing',
      'Executive dark-mode PDF export',
    ],
    cta: 'Get Pro',
    ctaTo: '/contact',
    primary: true,
  },
  {
    name: 'Team',
    price: '$79',
    period: '/month',
    desc: 'For agencies and design teams managing client audits and multiple products.',
    badge: null,
    features: [
      'Everything in Pro',
      'Up to 5 team member seats',
      'Unlimited screens per audit',
      'White-label executive PDF exports',
      'Shared team audit library',
      'Custom evaluation criteria',
      'Direct Slack & email support',
    ],
    cta: 'Talk to Sales',
    ctaTo: '/contact',
    primary: false,
  },
];

const FAQ = [
  {
    q: 'How does Rate My UX analyze my design with AI?',
    a: 'Rate My UX uses multimodal neural Vision AI models. When you provide a website URL, Figma link, or upload screenshots, our engine crawls the visual viewport, inspects layout hierarchies, typography scales, contrast ratios, and interactive touch targets, producing structured scores across 11 usability dimensions in under 60 seconds.'
  },
  {
    q: 'Can I start using Rate My UX for free?',
    a: 'Yes! Our Free Starter tier allows you to evaluate up to 3 screens per month with complete 11-dimension scoring, Nielsen heuristic checks, and executive PDF exports with zero credit card required.'
  },
  {
    q: 'What types of websites and prototypes are supported?',
    a: 'Rate My UX supports live website URLs, SaaS applications, eCommerce stores, public Figma prototype links, Framer sites, Webflow builds, and direct PNG/JPG/WebP screenshot uploads.'
  },
  {
    q: 'How does Rate My UX evaluate Jakob Nielsen’s 10 Heuristics?',
    a: 'The Vision engine systematically evaluates each screen against all 10 heuristics: 1) System status visibility, 2) Match between system and real world, 3) User control & freedom, 4) Consistency & standards, 5) Error prevention, 6) Recognition over recall, 7) Flexibility & efficiency, 8) Aesthetic & minimalist design, 9) Error recovery, and 10) Help & documentation.'
  },
  {
    q: 'Is my prototype data confidential and secure?',
    a: 'Yes. All screenshots and design assets are processed in secure ephemeral memory and never used for public training datasets. Your audit reports remain private to your authenticated account.'
  }
];

export default function PlansPage() {
  const [annual, setAnnual] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);

  return (
    <div>
      <SEO
        title="Pricing &amp; Plans | Rate My UX — Free, Pro &amp; Team Subscription Tiers"
        description="Choose the right Rate My UX subscription plan for your product. Free tier includes 3 screen audits monthly. Pro plan offers unlimited audits with effort vs impact roadmaps."
        canonicalPath="/plans"
        keywords="Rate My UX Pricing, AI UX Evaluation Cost, Pro UX Audit Plan, Free Usability Audit Tool, Enterprise UX Review, Design Audit Agency"
        schema={PLANS_SCHEMA}
      />

      {/* Hero */}
      <AnimatedSection>
        <section className="page-hero">
          <div className="page-hero__badge">Transparent Pricing</div>
          <h1>Simple, Predictable <span className="text-gradient">Pricing</span></h1>
          <p>Start free. Upgrade as your product scales. No hidden fees or surprise charges.</p>

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
      </AnimatedSection>

      {/* Plans Grid */}
      <section className="page-section">
        <div className="plans-grid">
          {PLANS.map((plan, i) => {
            const price = annual && plan.price !== 'Free'
              ? `$${Math.round(parseInt(plan.price.replace('$', '')) * 0.7)}`
              : plan.price;

            return (
              <AnimatedSection key={plan.name} delay={i * 100}>
                <div className={`plan-card glass-panel${plan.primary ? ' plan-card--primary' : ''}`}>
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
                              <stop stopColor="#00f0ff"/><stop offset="1" stopColor="#8b5cf6"/>
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
              </AnimatedSection>
            );
          })}
        </div>
      </section>

      {/* FAQ */}
      <section className="page-section">
        <AnimatedSection>
          <div className="section-header">
            <h2>Frequently Asked <span className="text-gradient">Questions</span></h2>
            <p>Everything you need to know about AI-driven UX evaluations.</p>
          </div>
        </AnimatedSection>
        <div className="faq-list" style={{ maxWidth: 740, margin: '0 auto' }}>
          {FAQ.map(({ q, a }, i) => (
            <AnimatedSection key={i} delay={i * 60}>
              <div
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
            </AnimatedSection>
          ))}
        </div>
      </section>
    </div>
  );
}
