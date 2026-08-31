import { useState, useMemo } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import AnimatedSection from '../components/AnimatedSection';
import SEO from '../components/SEO';
import { BLOG_POSTS } from '../data/blogData';

export default function BlogPostPage() {
  const { slug } = useParams();
  const [copied, setCopied] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);

  const post = useMemo(() => {
    return BLOG_POSTS.find((p) => p.slug === slug);
  }, [slug]);

  if (!post) {
    return <Navigate to="/blog" replace />;
  }

  const relatedPosts = useMemo(() => {
    return BLOG_POSTS.filter(
      (p) => p.slug !== post.slug && (p.category === post.category || p.author.name === post.author.name)
    ).slice(0, 3);
  }, [post]);

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    '@id': `https://www.ratemyux.com/blog/${post.slug}#article`,
    headline: post.title,
    description: post.excerpt,
    datePublished: `${post.date}T09:00:00+00:00`,
    dateModified: `${post.date}T12:00:00+00:00`,
    mainEntityOfPage: `https://www.ratemyux.com/blog/${post.slug}`,
    image: 'https://www.ratemyux.com/og-image.png',
    author: {
      '@type': 'Person',
      name: post.author.name,
      jobTitle: post.author.role,
      image: post.author.avatar,
    },
    publisher: {
      '@type': 'Organization',
      name: 'Rate My UX',
      url: 'https://www.ratemyux.com',
      logo: {
        '@type': 'ImageObject',
        url: 'https://www.ratemyux.com/logo.png',
      },
    },
    keywords: post.tags.join(', '),
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: 'https://www.ratemyux.com',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Blog',
        item: 'https://www.ratemyux.com/blog',
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: post.title,
        item: `https://www.ratemyux.com/blog/${post.slug}`,
      },
    ],
  };

  const faqSchema = post.faqs && post.faqs.length > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: post.faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  } : null;

  const combinedSchema = {
    '@context': 'https://schema.org',
    '@graph': [articleSchema, breadcrumbSchema, ...(faqSchema ? [faqSchema] : [])],
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Collect headings for Table of Contents
  const headings = post.content.filter((c) => c.type === 'heading');

  return (
    <div className="blog-post-page" style={{ paddingBottom: '5rem' }}>
      <SEO
        title={`${post.title} | Rate My UX Blog`}
        description={post.excerpt}
        canonicalPath={`/blog/${post.slug}`}
        keywords={post.tags.join(', ')}
        ogType="article"
        schema={combinedSchema}
      />

      <div className="container" style={{ maxWidth: '1040px', margin: '0 auto', paddingTop: '1.5rem' }}>
        {/* Breadcrumb Navigation */}
        <nav
          aria-label="Breadcrumb"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.82rem',
            color: 'var(--text-tertiary)',
            marginBottom: '1.5rem',
            flexWrap: 'wrap',
          }}
        >
          <Link to="/" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>
            Home
          </Link>
          <span>/</span>
          <Link to="/blog" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>
            Blog
          </Link>
          <span>/</span>
          <span style={{ color: 'var(--accent-cyan)', fontWeight: 500 }}>{post.category}</span>
        </nav>

        {/* Article Header */}
        <AnimatedSection>
          <header style={{ marginBottom: '2.5rem' }}>
            <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap' }}>
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  color: 'var(--accent-cyan)',
                  padding: '0.25rem 0.75rem',
                  borderRadius: '20px',
                  background: 'rgba(0, 240, 255, 0.1)',
                }}
              >
                {post.category}
              </span>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-tertiary)' }}>
                {post.readTime}
              </span>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-tertiary)' }}>•</span>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-tertiary)' }}>
                Published on {new Date(post.date).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
            </div>

            <h1
              style={{
                fontSize: 'clamp(2rem, 4vw, 2.75rem)',
                lineHeight: 1.25,
                fontFamily: 'var(--font-heading)',
                marginBottom: '1.25rem',
                color: 'var(--text-primary)',
              }}
            >
              {post.title}
            </h1>

            <p
              style={{
                fontSize: '1.15rem',
                color: 'var(--text-secondary)',
                lineHeight: 1.6,
                marginBottom: '1.75rem',
              }}
            >
              {post.excerpt}
            </p>

            {/* Author Bar & Share */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '1rem',
                padding: '1rem 0',
                borderTop: '1px solid var(--border)',
                borderBottom: '1px solid var(--border)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <img
                  src={post.author.avatar}
                  alt={post.author.name}
                  style={{ width: '44px', height: '44px', borderRadius: '50%', objectFit: 'cover' }}
                />
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.92rem', color: 'var(--text-primary)' }}>
                    {post.author.name}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)' }}>
                    {post.author.role} • Rate My UX
                  </div>
                </div>
              </div>

              {/* Share buttons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <button
                  onClick={handleCopyLink}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    padding: '0.45rem 0.85rem',
                    background: 'var(--glass-bg)',
                    border: '1px solid var(--glass-border)',
                    borderRadius: 'var(--radius-sm)',
                    color: 'var(--text-primary)',
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {copied ? '✓ Link Copied!' : '🔗 Copy Link'}
                </button>
                <a
                  href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(post.title)}&url=${encodeURIComponent(window.location.href)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    padding: '0.45rem 0.75rem',
                    background: 'var(--glass-bg)',
                    border: '1px solid var(--glass-border)',
                    borderRadius: 'var(--radius-sm)',
                    color: 'var(--text-primary)',
                    fontSize: '0.82rem',
                    textDecoration: 'none',
                  }}
                  title="Share on X / Twitter"
                >
                  𝕏
                </a>
                <a
                  href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    padding: '0.45rem 0.75rem',
                    background: 'var(--glass-bg)',
                    border: '1px solid var(--glass-border)',
                    borderRadius: 'var(--radius-sm)',
                    color: 'var(--text-primary)',
                    fontSize: '0.82rem',
                    textDecoration: 'none',
                  }}
                  title="Share on LinkedIn"
                >
                  in
                </a>
              </div>
            </div>
          </header>
        </AnimatedSection>

        {/* Quick Answer Callout (AEO / GEO Optimized) */}
        {post.quickAnswer && (
          <AnimatedSection delay={50}>
            <div
              className="glass-panel"
              style={{
                marginBottom: '2.5rem',
                padding: '1.75rem 2rem',
                borderRadius: 'var(--radius-md)',
                background: 'linear-gradient(135deg, rgba(0,240,255,0.06), rgba(139,92,246,0.06))',
                border: '1.5px solid var(--border-glow)',
                boxShadow: '0 8px 30px rgba(0,240,255,0.08)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  color: 'var(--accent-cyan)',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  marginBottom: '0.75rem',
                  letterSpacing: '0.05em',
                }}
              >
                <span>💡</span> QUICK ANSWER (AEO / LLM SUMMARY)
              </div>
              <p
                style={{
                  fontSize: '1rem',
                  color: 'var(--text-primary)',
                  lineHeight: 1.7,
                  margin: 0,
                  fontWeight: 400,
                }}
              >
                {post.quickAnswer}
              </p>
            </div>
          </AnimatedSection>
        )}

        {/* Article Layout with Sidebar Table of Contents */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: headings.length > 0 ? 'minmax(0, 1fr) 260px' : 'minmax(0, 1fr)',
            gap: '3rem',
            alignItems: 'start',
          }}
        >
          {/* Main Article Content */}
          <main className="article-body">
            {post.content.map((block, idx) => {
              if (block.type === 'intro' || block.type === 'paragraph') {
                return (
                  <p
                    key={idx}
                    style={{
                      fontSize: '1.05rem',
                      lineHeight: 1.75,
                      color: 'var(--text-secondary)',
                      marginBottom: '1.5rem',
                    }}
                  >
                    {block.text}
                  </p>
                );
              }

              if (block.type === 'heading') {
                return (
                  <h2
                    key={idx}
                    id={block.id}
                    style={{
                      fontSize: '1.5rem',
                      fontFamily: 'var(--font-heading)',
                      color: 'var(--text-primary)',
                      marginTop: '2.5rem',
                      marginBottom: '1rem',
                      scrollMarginTop: '100px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                    }}
                  >
                    <a
                      href={`#${block.id}`}
                      style={{ color: 'inherit', textDecoration: 'none' }}
                    >
                      {block.title}
                    </a>
                  </h2>
                );
              }

              if (block.type === 'callout') {
                return (
                  <div
                    key={idx}
                    className="glass-panel"
                    style={{
                      margin: '2rem 0',
                      padding: '1.5rem 1.75rem',
                      borderRadius: 'var(--radius-md)',
                      borderLeft: '4px solid var(--accent-cyan)',
                      background: 'var(--bg-card)',
                    }}
                  >
                    <h4
                      style={{
                        margin: '0 0 0.75rem',
                        fontSize: '1.05rem',
                        color: 'var(--text-primary)',
                      }}
                    >
                      {block.title}
                    </h4>
                    <ul
                      style={{
                        margin: 0,
                        paddingLeft: '1.25rem',
                        color: 'var(--text-secondary)',
                        fontSize: '0.95rem',
                        lineHeight: 1.65,
                      }}
                    >
                      {block.points.map((pt, pidx) => (
                        <li key={pidx} style={{ marginBottom: '0.4rem' }}>
                          {pt}
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              }

              if (block.type === 'steps') {
                return (
                  <div key={idx} style={{ margin: '2rem 0', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {block.items.map((step, sidx) => (
                      <div
                        key={sidx}
                        className="glass-panel"
                        style={{
                          padding: '1.25rem 1.5rem',
                          borderRadius: 'var(--radius-sm)',
                          border: '1px solid var(--glass-border)',
                        }}
                      >
                        <h4
                          style={{
                            margin: '0 0 0.4rem',
                            fontSize: '1rem',
                            color: 'var(--accent-cyan)',
                            fontFamily: 'var(--font-heading)',
                          }}
                        >
                          {step.title}
                        </h4>
                        <p
                          style={{
                            margin: 0,
                            fontSize: '0.92rem',
                            color: 'var(--text-secondary)',
                            lineHeight: 1.6,
                          }}
                        >
                          {step.description}
                        </p>
                      </div>
                    ))}
                  </div>
                );
              }

              if (block.type === 'table') {
                return (
                  <div
                    key={idx}
                    style={{
                      overflowX: 'auto',
                      margin: '2rem 0',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--glass-border)',
                    }}
                  >
                    <table
                      style={{
                        width: '100%',
                        borderCollapse: 'collapse',
                        fontSize: '0.9rem',
                        textAlign: 'left',
                      }}
                    >
                      <thead>
                        <tr style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--glass-border)' }}>
                          {block.headers.map((h, hidx) => (
                            <th
                              key={hidx}
                              style={{
                                padding: '0.85rem 1.25rem',
                                color: 'var(--text-primary)',
                                fontWeight: 600,
                              }}
                            >
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {block.rows.map((r, ridx) => (
                          <tr
                            key={ridx}
                            style={{
                              borderBottom: '1px solid var(--border)',
                              background: ridx % 2 === 0 ? 'var(--bg-card)' : 'transparent',
                            }}
                          >
                            {r.map((cell, cidx) => (
                              <td
                                key={cidx}
                                style={{
                                  padding: '0.85rem 1.25rem',
                                  color: cidx === 0 ? 'var(--text-primary)' : 'var(--text-secondary)',
                                  fontWeight: cidx === 0 ? 600 : 400,
                                }}
                              >
                                {cell}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              }

              return null;
            })}

            {/* Tags */}
            <div style={{ marginTop: '2.5rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  style={{
                    fontSize: '0.78rem',
                    padding: '0.35rem 0.85rem',
                    borderRadius: '20px',
                    background: 'var(--glass-bg)',
                    border: '1px solid var(--glass-border)',
                    color: 'var(--text-secondary)',
                  }}
                >
                  #{tag}
                </span>
              ))}
            </div>

            {/* Frequently Asked Questions (FAQ Section & Schema Target) */}
            {post.faqs && post.faqs.length > 0 && (
              <section style={{ marginTop: '3.5rem' }}>
                <h3
                  style={{
                    fontSize: '1.4rem',
                    fontFamily: 'var(--font-heading)',
                    marginBottom: '1.25rem',
                    color: 'var(--text-primary)',
                  }}
                >
                  Frequently Asked Questions
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {post.faqs.map((faq, fidx) => {
                    const isOpen = openFaq === fidx;
                    return (
                      <div
                        key={fidx}
                        className="glass-panel"
                        style={{
                          borderRadius: 'var(--radius-sm)',
                          border: '1px solid var(--glass-border)',
                          overflow: 'hidden',
                        }}
                      >
                        <button
                          onClick={() => setOpenFaq(isOpen ? null : fidx)}
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
                          <span>{faq.question}</span>
                          <span style={{ fontSize: '1.2rem', color: 'var(--accent-cyan)' }}>
                            {isOpen ? '−' : '+'}
                          </span>
                        </button>
                        {isOpen && (
                          <div
                            style={{
                              padding: '0 1.25rem 1rem',
                              color: 'var(--text-secondary)',
                              fontSize: '0.9rem',
                              lineHeight: 1.6,
                            }}
                          >
                            {faq.answer}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Contextual CTA Box */}
            <div
              className="glass-panel"
              style={{
                marginTop: '3.5rem',
                padding: '2rem',
                borderRadius: 'var(--radius-md)',
                background: 'linear-gradient(135deg, rgba(0,240,255,0.08), rgba(139,92,246,0.08))',
                border: '1px solid var(--border-glow)',
                textAlign: 'center',
              }}
            >
              <h3 style={{ fontSize: '1.3rem', marginBottom: '0.5rem' }}>
                Put These UX Insights to Work
              </h3>
              <p
                style={{
                  color: 'var(--text-secondary)',
                  fontSize: '0.92rem',
                  maxWidth: '540px',
                  margin: '0 auto 1.25rem',
                }}
              >
                Scan your website or upload Figma screens to get an automated 11-dimension UX audit in 10 seconds.
              </p>
              <Link to="/" className="btn btn-primary" style={{ padding: '0.75rem 1.75rem' }}>
                ⚡ Audit My Website Now
              </Link>
            </div>
          </main>

          {/* Sticky Table of Contents Sidebar */}
          {headings.length > 0 && (
            <aside
              style={{
                position: 'sticky',
                top: '90px',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
              }}
              className="blog-toc-sidebar"
            >
              <div
                className="glass-panel"
                style={{
                  padding: '1.25rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--glass-border)',
                }}
              >
                <div
                  style={{
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    color: 'var(--text-tertiary)',
                    letterSpacing: '0.05em',
                    marginBottom: '0.85rem',
                  }}
                >
                  Table of Contents
                </div>
                <nav>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                    {headings.map((h, hidx) => (
                      <li key={hidx} style={{ marginBottom: '0.6rem' }}>
                        <a
                          href={`#${h.id}`}
                          style={{
                            fontSize: '0.84rem',
                            color: 'var(--text-secondary)',
                            textDecoration: 'none',
                            display: 'block',
                            lineHeight: 1.4,
                            transition: 'color 0.2s ease',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--accent-cyan)')}
                          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
                        >
                          {h.title}
                        </a>
                      </li>
                    ))}
                  </ul>
                </nav>
              </div>

              {/* Sidebar Quick CTA */}
              <div
                className="glass-panel"
                style={{
                  padding: '1.25rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-glow)',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                  Free AI Usability Score
                </div>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: '0 0 0.85rem' }}>
                  Evaluate contrast, Nielsen rules &amp; CRO heuristics.
                </p>
                <Link to="/" className="btn btn-primary" style={{ width: '100%', padding: '0.55rem', fontSize: '0.8rem', justifyContent: 'center' }}>
                  Try Free Evaluator
                </Link>
              </div>
            </aside>
          )}
        </div>

        {/* Related Posts */}
        {relatedPosts.length > 0 && (
          <section style={{ marginTop: '5rem', borderTop: '1px solid var(--border)', paddingTop: '3rem' }}>
            <h3
              style={{
                fontSize: '1.4rem',
                fontFamily: 'var(--font-heading)',
                marginBottom: '1.5rem',
                color: 'var(--text-primary)',
              }}
            >
              Related UX Articles
            </h3>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '1.5rem',
              }}
            >
              {relatedPosts.map((rel) => (
                <article
                  key={rel.slug}
                  className="glass-panel"
                  style={{
                    padding: '1.5rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--glass-border)',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  <span
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      color: 'var(--accent-cyan)',
                      marginBottom: '0.5rem',
                    }}
                  >
                    {rel.category}
                  </span>
                  <h4 style={{ fontSize: '1.05rem', lineHeight: 1.4, marginBottom: '0.5rem' }}>
                    <Link to={`/blog/${rel.slug}`} style={{ color: 'var(--text-primary)', textDecoration: 'none' }}>
                      {rel.title}
                    </Link>
                  </h4>
                  <p
                    style={{
                      fontSize: '0.84rem',
                      color: 'var(--text-secondary)',
                      lineHeight: 1.55,
                      marginBottom: '1rem',
                      flex: 1,
                    }}
                  >
                    {rel.excerpt.slice(0, 95)}...
                  </p>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: '0.75rem',
                      color: 'var(--text-tertiary)',
                    }}
                  >
                    <span>{rel.readTime}</span>
                    <span>
                      {new Date(rel.date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
