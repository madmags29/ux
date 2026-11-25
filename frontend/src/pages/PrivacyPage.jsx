import { Link } from 'react-router-dom';
import AnimatedSection from '../components/AnimatedSection';
import SEO from '../components/SEO';

const PRIVACY_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  '@id': 'https://www.ratemyux.com/privacy#webpage',
  url: 'https://www.ratemyux.com/privacy',
  name: 'Privacy Policy — Rate My UX',
  description: 'Privacy Policy detailing how Rate My UX collects, processes, and protects your account information, design prototypes, and cookie preferences.',
  publisher: {
    '@type': 'Organization',
    name: 'Rate My UX',
    url: 'https://www.ratemyux.com',
  },
};

const SECTIONS = [
  {
    title: '1. Introduction & Data Controller',
    paragraphs: [
      'Rate My UX (https://www.ratemyux.com), operated by Dev Designs, respects your privacy and is committed to protecting your personal data. This Privacy Policy explains how we collect, use, store, and safeguard information when you visit our website or run AI-powered UX evaluations.',
    ],
  },
  {
    title: '2. Information We Collect',
    paragraphs: [
      'Depending on how you interact with Rate My UX, we may collect the following categories of information:',
    ],
    bullets: [
      'Account Information: Name, email address, hashed password (if registered via email), or basic Google profile details (name, email, avatar) when signing in via Google OAuth.',
      'Evaluation Submissions: Website URLs, Figma prototype links, and PNG/JPG/WebP screenshots you submit for UX evaluation, along with the generated audit scores and recommendations.',
      'Support & Contact Inquiries: Name, email, and message details submitted through our Contact form.',
      'Technical & Usage Data: Standard log metadata such as browser type, viewport size, theme preference (stored locally), and anonymized traffic analytics.',
    ],
  },
  {
    title: '3. How We Process Prototypes & Screenshots',
    paragraphs: [
      'Uploaded design screenshots and captured webpage viewports are processed in ephemeral server memory strictly to perform your requested UX audit via multimodal Vision AI.',
      'We do NOT sell your prototypes, screenshots, or audit reports to third parties, and your private design submissions are not used to train public third-party AI models.',
    ],
  },
  {
    title: '4. Cookies, Analytics & Advertising (Google AdSense)',
    paragraphs: [
      'Rate My UX uses essential browser storage (such as localStorage) to preserve your authentication session and dark/light theme preference.',
      'We also partner with Google AdSense and analytics providers to keep our free tier accessible. Third-party vendors, including Google, use cookies to serve ads based on a user’s prior visits to this website or other websites. Google’s use of advertising cookies enables it and its partners to serve ads based on your visit to Rate My UX and/or other sites on the Internet.',
      'You may opt out of personalized advertising at any time by visiting Google Ads Settings (https://adssettings.google.com) or via the Digital Advertising Alliance opt-out portal (https://optout.aboutads.info).',
    ],
  },
  {
    title: '5. Data Storage & Security',
    paragraphs: [
      'Account records and saved evaluation reports are stored in encrypted MongoDB Atlas databases protected by industry-standard access controls, HTTPS/TLS transport encryption, JWT session tokens, and bcrypt password hashing.',
      'While no online service can guarantee absolute security, we continuously monitor and harden our infrastructure to protect user data.',
    ],
  },
  {
    title: '6. Third-Party Service Providers',
    paragraphs: [
      'To deliver core functionality, Rate My UX integrates with trusted infrastructure providers:',
    ],
    bullets: [
      'OpenAI API: Multimodal Vision AI analysis of submitted screens.',
      'Google Identity Services: Optional one-click OAuth authentication.',
      'Vercel & MongoDB Atlas: Secure serverless hosting and encrypted database storage.',
      'Google AdSense: Compliant display advertising to support free UX evaluations.',
    ],
  },
  {
    title: '7. Your Privacy Rights (GDPR & CCPA)',
    paragraphs: [
      'Regardless of your location, you have the right to access, export, correct, or request permanent deletion of your account and saved UX audit history. You can update your profile directly in your Account Settings or email hello@ratemyux.com to request full data deletion.',
    ],
  },
  {
    title: "8. Children's Privacy",
    paragraphs: [
      'Rate My UX is designed for product teams, designers, and developers and is not intended for individuals under the age of 13 (or 16 in applicable EEA jurisdictions). We do not knowingly collect personal information from children.',
    ],
  },
  {
    title: '9. Changes to This Policy & Contact',
    paragraphs: [
      'We may update this Privacy Policy periodically to reflect improvements to our platform or regulatory changes. Any updates will be posted on this page with a revised "Last updated" date.',
      'Questions or data requests can be directed to hello@ratemyux.com or submitted via our Contact Support page.',
    ],
  },
];

export default function PrivacyPage() {
  return (
    <div style={{ paddingBottom: '5rem' }}>
      <SEO
        title="Privacy Policy | Rate My UX"
        description="Learn how Rate My UX collects, processes, and safeguards your account data, uploaded prototypes, cookies, and Google AdSense preferences."
        canonicalPath="/privacy"
        keywords="Rate My UX Privacy Policy, Data Protection, Prototype Confidentiality, AdSense Privacy, GDPR CCPA UX Tool"
        schema={PRIVACY_SCHEMA}
      />

      <AnimatedSection>
        <section className="page-hero">
          <div className="page-hero__badge">Privacy &amp; Security</div>
          <h1>Privacy <span className="text-gradient">Policy</span></h1>
          <p>
            Last updated: November 25, 2026 &middot; How we protect your data, prototypes, and privacy.
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
              <Link to="/terms" style={{ color: 'var(--accent-cyan)', fontWeight: 600, textDecoration: 'none', fontSize: '0.9rem' }}>
                Read our Terms &amp; Conditions →
              </Link>
              <Link to="/contact" className="btn btn-secondary" style={{ fontSize: '0.85rem', padding: '0.55rem 1.15rem' }}>
                Privacy Inquiries
              </Link>
            </div>
          </div>
        </AnimatedSection>
      </section>
    </div>
  );
}
