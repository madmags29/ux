import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const subjects = [
    'UX Audit Consultation',
    'Prototype Usability Feedback',
    'Design System Consistency Audit',
    'Custom Heuristic Criteria Request',
    'Technical Help with Evaluator',
    'Enterprise UX Team Plan Inquiry',
  ];

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    setSending(true);
    setTimeout(() => {
      setSending(false);
      setSent(true);
    }, 1500);
  };

  return (
    <div>
      {/* Hero */}
      <section className="page-hero">
        <div className="page-hero__badge">Contact Us</div>
        <h1>We'd Love to Hear<br />From You</h1>
        <p>Have a question, feedback, or want to explore a custom plan? Drop us a message and we'll get back to you within 24 hours.</p>
      </section>

      <section className="page-section" style={{ paddingBottom: '5rem' }}>
        <div className="contact-layout">
          {/* Left: Info */}
          <div className="contact-info">
            <div className="glass-panel contact-info__card">
              <h3>Get in Touch</h3>
              <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', lineHeight: 1.7 }}>
                Whether you're a solo designer evaluating your first prototype, or a product team
                looking for an enterprise plan — we're here to help.
              </p>
              <div className="contact-info__items">
                {[
                  { icon: '✉️', label: 'Email', value: 'hello@uxexpert.ai' },
                  { icon: '💬', label: 'Response time', value: 'Within 24 hours' },
                  { icon: '🌍', label: 'Location', value: 'Remote-first, Global' },
                ].map(({ icon, label, value }) => (
                  <div key={label} className="contact-info__item">
                    <span className="contact-info__item-icon">{icon}</span>
                    <div>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>{label}</p>
                      <p style={{ fontWeight: 500 }}>{value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-panel contact-info__card">
              <h4 style={{ marginBottom: '0.75rem' }}>Looking for pricing?</h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1rem' }}>
                Check out our transparent plans — including a free tier to get started immediately.
              </p>
              <Link to="/plans" className="btn" style={{ width: '100%', justifyContent: 'center' }}>
                View Plans →
              </Link>
            </div>
          </div>

          {/* Right: Form */}
          <div className="glass-panel contact-form">
            {sent ? (
              <div className="contact-form__success">
                <div className="contact-form__success-icon">✓</div>
                <h3>Message Sent!</h3>
                <p>Thanks for reaching out. We'll get back to you within 24 hours.</p>
                <button className="btn btn-primary" onClick={() => { setSent(false); setForm({ name: '', email: '', subject: '', message: '' }); }}>
                  Send Another Message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="contact-form__fields">
                <h3>Send a Message</h3>

                <div className="contact-form__row">
                  <div className="contact-form__group">
                    <label className="contact-form__label">Full Name</label>
                    <input
                      type="text"
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      placeholder="Jane Smith"
                      className="input-field"
                      required
                    />
                  </div>
                  <div className="contact-form__group">
                    <label className="contact-form__label">Email Address</label>
                    <input
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      placeholder="jane@company.com"
                      className="input-field"
                      required
                    />
                  </div>
                </div>

                <div className="contact-form__group">
                  <label className="contact-form__label">Subject</label>
                  <select
                    name="subject"
                    value={form.subject}
                    onChange={handleChange}
                    className="input-field"
                    required
                  >
                    <option value="" disabled>Select a topic…</option>
                    {subjects.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                <div className="contact-form__group">
                  <label className="contact-form__label">Message</label>
                  <textarea
                    name="message"
                    value={form.message}
                    onChange={handleChange}
                    placeholder="Tell us what's on your mind…"
                    className="input-field contact-form__textarea"
                    rows={5}
                    required
                  />
                </div>

                <button type="submit" className="btn btn-primary contact-form__submit" disabled={sending}>
                  {sending ? (
                    <><span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> Sending…</>
                  ) : 'Send Message →'}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
