import { Link } from 'react-router-dom';
import AnimatedSection from '../components/AnimatedSection';
import SEO from '../components/SEO';

const TERMS_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  '@id': 'https://www.ratemyux.com/terms#webpage',
  url: 'https://www.ratemyux.com/terms',
  name: 'Terms & Conditions — Rate My UX',
  description: 'Terms and Conditions governing the use of Rate My UX, our AI-powered UX evaluation platform, Figma prototype audits, and subscription plans.',
  publisher: {
    '@type': 'Organization',
    name: 'Rate My UX',
    url: 'https://www.ratemyux.com',
  },
};

const SECTIONS = [
  {
    title: '1. Acceptance of Terms',
    paragraphs: [
      'By accessing or using Rate My UX (https://www.ratemyux.com), operated by Dev Designs ("we", "us", or "our"), you agree to be bound by these Terms & Conditions and our Privacy Policy. If you do not agree to all terms set forth herein, you may not access or use the platform.',
    ],
  },
  {
    title: '2. Description of Service',
    paragraphs: [
      'Rate My UX provides an automated AI-powered user experience (UX) evaluation and design auditing service. Users may submit live website URLs, public Figma prototype links, or uploaded interface screenshots (PNG, JPG, WebP) to receive automated multi-dimension usability scores, Jakob Nielsen heuristic checks, 10 Laws of UX audits, WCAG 2.2 accessibility observations, prioritized improvement roadmaps, and downloadable PDF reports.',
    ],
  },
  {
    title: '3. User Accounts & Authentication',
    paragraphs: [
      'Certain features—such as saving evaluation history, accessing your personal dashboard, and exporting unlimited reports—require registering an account via email/password or Google OAuth. You are responsible for maintaining the confidentiality of your login credentials and for all activities occurring under your account.',
      'You agree to provide accurate, current information and notify us immediately at hello@ratemyux.com if you suspect unauthorized access to your account.',
    ],
  },
  {
    title: '4. Acceptable Use & Prohibited Conduct',
    paragraphs: [
      'You agree to use Rate My UX strictly for lawful design evaluation, research, and product improvement purposes. You may not:',
    ],
    bullets: [
      'Submit URLs, prototypes, or screenshots containing illegal, defamatory, infringing, or malicious content.',
      'Use automated bots, scrapers, or excessive API calls to bypass usage limits or disrupt platform stability.',
      'Attempt to reverse-engineer, decompile, or extract proprietary prompts, scoring models, or source code.',
      'Misrepresent automated AI UX reports as official legal accessibility certifications (e.g., formal ADA or Section 508 compliance sign-off).',
    ],
  },
  {
    title: '5. Subscription Plans, Usage Limits & Billing',
    paragraphs: [
      'Rate My UX offers a Free Starter tier (up to 3 screens per evaluation and monthly usage limits) as well as paid Pro and Team subscription tiers. Features, screen limits, and pricing are detailed on our Pricing & Plans page and may be updated with prior notice.',
      'Paid subscriptions renew automatically unless canceled prior to the end of the current billing cycle. You may request cancellation or billing assistance at any time through our Contact page or by emailing hello@ratemyux.com.',
    ],
  },
  {
    title: '6. Intellectual Property & Content Ownership',
    paragraphs: [
      'You retain 100% ownership and intellectual property rights to all websites, Figma prototypes, and interface screenshots you submit for evaluation. By submitting content, you grant Rate My UX a limited, temporary license solely to capture, process, and analyze the screens required to generate your UX audit report.',
      'All platform branding, UI components, evaluation frameworks, blog content, and PDF report templates remain the exclusive intellectual property of Rate My UX and Dev Designs.',
    ],
  },
  {
    title: '7. AI Evaluation Disclaimer',
    paragraphs: [
      'Rate My UX utilizes multimodal neural Vision AI models to evaluate interfaces against established usability heuristics, Laws of UX, and accessibility principles. While engineered for high precision, AI-generated critiques and scores are advisory in nature and do not replace formal legal accessibility audits, manual assistive-technology testing, or qualitative usability testing with human participants.',
    ],
  },
  {
    title: '8. Limitation of Liability & Warranties',
    paragraphs: [
      'The service is provided on an "as-is" and "as-available" basis without warranties of any kind, whether express or implied. To the maximum extent permitted by applicable law, Rate My UX and Dev Designs shall not be liable for any indirect, incidental, consequential, or business-interruption damages arising out of your use of, or inability to use, the platform or its audit recommendations.',
    ],
  },
  {
    title: '9. Termination & Modifications',
    paragraphs: [
      'We reserve the right to suspend or terminate accounts that violate these Terms & Conditions or engage in abusive traffic patterns. We may also update these terms periodically; continued use of Rate My UX following any revision constitutes acceptance of the updated terms.',
    ],
  },
  {
    title: '10. Contact Information',
    paragraphs: [
      'If you have any questions regarding these Terms & Conditions, please contact us at hello@ratemyux.com or visit our Contact Support page.',
    ],
  },
];

export default function TermsPage() {
  return (
    <div style={{ paddingBottom: '5rem' }}>
      <SEO
        title="Terms & Conditions | Rate My UX"
        description="Read the Terms & Conditions for using Rate My UX, including acceptable use, account terms, intellectual property rights, and AI evaluation disclaimers."
        canonicalPath="/terms"
        keywords="Rate My UX Terms and Conditions, Terms of Service, AI UX Audit Terms, Dev Designs Legal"
        schema={TERMS_SCHEMA}
      />

      <AnimatedSection>
        <section className="page-hero">
          <div className="page-hero__badge">Legal</div>
          <h1>Terms &amp; <span className="text-gradient">Conditions</span></h1>
          <p>
            Last updated: November 25, 2026 &middot; Please read these terms carefully before using Rate My UX.
          </p>
        </section>
      </AnimatedSection>

      <section className="page-section" style={{ maxWidth: '860px', margin: '0 auto' }}>
        <AnimatedSection delay={80}>
          <div className="glass-panel" style={{ padding: '2.25rem', borderRadius: 'var(--radius-lg)' }}>
            {SECTIONS.map((sec, idx) => (
              <div
                key={sec.title}
                style={{
                  marginBottom: idx === SECTIONS.length - 1 ? 0 : '2rem',
                  paddingBottom: idx === SECTIONS.length - 1 ? 0 : '1.75rem',
                  borderBottom: idx === SECTIONS.length - 1 ? 'none' : '1px solid var(--border)',
                }}
              >
                <h2 style={{ fontSize: '1.25rem', marginBottom: '0.75rem', color: 'var(--text-primary)' }}>
                  {sec.title}
                </h2>
                {sec.paragraphs.map((p, pidx) => (
                  <p
                    key={pidx}
                    style={{
                      color: 'var(--text-secondary)',
                      lineHeight: 1.75,
                      fontSize: '0.95rem',
                      marginBottom: pidx === sec.paragraphs.length - 1 && !sec.bullets ? 0 : '0.75rem',
                    }}
                  >
                    {p}
                  </p>
                ))}
                {sec.bullets && (
                  <ul
                    style={{
                      paddingLeft: '1.25rem',
                      margin: '0.5rem 0 0',
                      color: 'var(--text-secondary)',
                      fontSize: '0.94rem',
                      lineHeight: 1.75,
                    }}
                  >
                    {sec.bullets.map((b, bidx) => (
                      <li key={bidx} style={{ marginBottom: '0.4rem' }}>{b}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}

            <div
              style={{
                marginTop: '2.25rem',
                paddingTop: '1.5rem',
                borderTop: '1px solid var(--border)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '1rem',
              }}
            >
              <Link to="/privacy" style={{ color: 'var(--accent-cyan)', fontWeight: 600, textDecoration: 'none', fontSize: '0.9rem' }}>
                Read our Privacy Policy →
              </Link>
              <Link to="/contact" className="btn btn-secondary" style={{ fontSize: '0.85rem', padding: '0.55rem 1.15rem' }}>
                Contact Legal Support
              </Link>
            </div>
          </div>
        </AnimatedSection>
      </section>
    </div>
  );
}
