import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import AnimatedSection from '../components/AnimatedSection';
import SEO from '../components/SEO';
import { BLOG_POSTS, BLOG_CATEGORIES } from '../data/blogData';

const BLOG_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'Blog',
  '@id': 'https://www.ratemyux.com/blog#blog',
  url: 'https://www.ratemyux.com/blog',
  name: 'Rate My UX Insights — AI UX Design & Usability Engineering Blog',
  description: 'Authoritative UX research, Nielsen heuristic guides, WCAG 2.2 checklists, and Vision AI design engineering strategies for modern product teams.',
  publisher: {
    '@type': 'Organization',
    name: 'Rate My UX',
    url: 'https://www.ratemyux.com',
    logo: 'https://www.ratemyux.com/logo.png'
  }
};

export default function BlogPage() {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredPosts = useMemo(() => {
    return BLOG_POSTS.filter((post) => {
      const matchesCategory =
        selectedCategory === 'All' || post.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        post.title.toLowerCase().includes(q) ||
        post.excerpt.toLowerCase().includes(q) ||
        post.tags.some((tag) => tag.toLowerCase().includes(q)) ||
        post.author.name.toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  const featuredPost = BLOG_POSTS[0];

  return (
    <div className="blog-page">
      <SEO
        title="UX Design & AI Usability Blog | Rate My UX Insights"
        description="Explore 16+ expert UX guides, Nielsen heuristic deep dives, WCAG 2.2 accessibility checklists, CRO playbooks, and Vision AI design engineering case studies."
        canonicalPath="/blog"
        keywords="UX Design Blog, AI UX Audits, Usability Research, Jakob Nielsen Heuristics, WCAG 2.2 Checklist, Conversion Rate Optimization, Mobile UX, Design Tokens"
        schema={BLOG_SCHEMA}
      />

      {/* Hero Section */}
      <AnimatedSection>
        <section className="page-hero" style={{ paddingBottom: '2rem' }}>
          <div className="page-hero__badge">⚡ Design Knowledge &amp; Research</div>
          <h1>
            Rate My UX <span className="text-gradient">Insights</span>
          </h1>
          <p>
            Master evidence-based usability, Nielsen heuristics, WCAG 2.2 accessibility,
            and next-generation Vision AI design workflows.
          </p>

          {/* Search Bar */}
          <div
            style={{
              maxWidth: '560px',
              margin: '2rem auto 1rem',
              position: 'relative',
            }}
          >
            <input
              type="text"
              placeholder="Search articles by topic, heuristic, or keyword..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="glass-panel"
              style={{
                width: '100%',
                padding: '0.85rem 1.25rem 0.85rem 2.75rem',
                borderRadius: '50px',
                fontSize: '0.95rem',
                color: 'var(--text-primary)',
                background: 'var(--bg-elevated)',
                border: '1px solid var(--glass-border)',
                outline: 'none',
                boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
              }}
            />
            <span
              style={{
                position: 'absolute',
                left: '1rem',
                top: '50%',
                transform: 'translateY(-50%)',
                fontSize: '1rem',
                opacity: 0.6,
              }}
            >
              🔍
            </span>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute',
                  right: '1rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                }}
              >
                ✕
              </button>
            )}
          </div>

          {/* Category Filter Pills */}
          <div
            style={{
              display: 'flex',
              gap: '0.5rem',
              justifyContent: 'center',
              flexWrap: 'wrap',
              marginTop: '1.25rem',
            }}
          >
            {BLOG_CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                style={{
                  padding: '0.45rem 1rem',
                  borderRadius: '20px',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: '1px solid',
                  transition: 'all 0.2s ease',
                  background:
                    selectedCategory === cat
                      ? 'var(--accent-gradient)'
                      : 'var(--glass-bg)',
                  borderColor:
                    selectedCategory === cat
                      ? 'transparent'
                      : 'var(--glass-border)',
                  color:
                    selectedCategory === cat ? '#fff' : 'var(--text-secondary)',
                  boxShadow:
                    selectedCategory === cat
                      ? '0 4px 15px rgba(0, 240, 255, 0.25)'
                      : 'none',
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        </section>
      </AnimatedSection>

      {/* Featured Post Spotlight (shown if no search and on 'All' or match) */}
      {!searchQuery && selectedCategory === 'All' && (
        <AnimatedSection delay={100}>
          <div className="container" style={{ marginBottom: '3.5rem' }}>
            <div
              className="glass-panel"
              style={{
                padding: '2.5rem',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-glow)',
                background:
                  'linear-gradient(135deg, rgba(0, 240, 255, 0.05), rgba(139, 92, 246, 0.05))',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                gap: '2rem',
                alignItems: 'center',
                boxShadow: 'var(--glass-shadow-hover)',
              }}
            >
              <div>
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    padding: '0.3rem 0.85rem',
                    background: 'rgba(0, 240, 255, 0.12)',
                    borderRadius: '20px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    color: 'var(--accent-cyan)',
                    marginBottom: '1rem',
                  }}
                >
                  ⭐ FEATURED GUIDE
                </div>
                <h2
                  style={{
                    fontSize: '1.75rem',
                    lineHeight: 1.3,
                    marginBottom: '1rem',
                    fontFamily: 'var(--font-heading)',
                  }}
                >
                  <Link
                    to={`/blog/${featuredPost.slug}`}
                    style={{
                      color: 'var(--text-primary)',
                      textDecoration: 'none',
                    }}
                  >
                    {featuredPost.title}
                  </Link>
                </h2>
                <p
                  style={{
                    color: 'var(--text-secondary)',
                    fontSize: '0.95rem',
                    lineHeight: 1.65,
                    marginBottom: '1.5rem',
                  }}
                >
                  {featuredPost.excerpt}
                </p>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '1rem',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                    }}
                  >
                    <img
                      src={featuredPost.author.avatar}
                      alt={featuredPost.author.name}
                      style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '50%',
                        objectFit: 'cover',
                      }}
                    />
                    <div>
                      <div
                        style={{
                          fontSize: '0.85rem',
                          fontWeight: 600,
                          color: 'var(--text-primary)',
                        }}
                      >
                        {featuredPost.author.name}
                      </div>
                      <div
                        style={{
                          fontSize: '0.75rem',
                          color: 'var(--text-tertiary)',
                        }}
                      >
                        {new Date(featuredPost.date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}{' '}
                        • {featuredPost.readTime}
                      </div>
                    </div>
                  </div>
                  <Link
                    to={`/blog/${featuredPost.slug}`}
                    className="btn btn-primary"
                    style={{
                      padding: '0.65rem 1.25rem',
                      fontSize: '0.85rem',
                      textDecoration: 'none',
                    }}
                  >
                    Read Full Article →
                  </Link>
                </div>
              </div>

              {/* Quick Answer Summary card */}
              <div
                className="glass-panel"
                style={{
                  padding: '1.75rem',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--glass-border)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    color: 'var(--accent-cyan)',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    marginBottom: '0.75rem',
                  }}
                >
                  <span>💡</span> AEO QUICK ANSWER
                </div>
                <p
                  style={{
                    fontSize: '0.9rem',
                    color: 'var(--text-secondary)',
                    lineHeight: 1.6,
                    margin: 0,
                  }}
                >
                  {featuredPost.quickAnswer}
                </p>
                <div
                  style={{
                    display: 'flex',
                    gap: '0.4rem',
                    flexWrap: 'wrap',
                    marginTop: '1rem',
                  }}
                >
                  {featuredPost.tags.map((tag) => (
                    <span
                      key={tag}
                      style={{
                        fontSize: '0.72rem',
                        padding: '0.2rem 0.6rem',
                        borderRadius: '12px',
                        background: 'rgba(255,255,255,0.05)',
                        color: 'var(--text-secondary)',
                      }}
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </AnimatedSection>
      )}

      {/* Main Articles Grid */}
      <section className="container" style={{ paddingBottom: '4rem' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1.75rem',
          }}
        >
          <h2
            style={{
              fontSize: '1.35rem',
              fontFamily: 'var(--font-heading)',
              color: 'var(--text-primary)',
            }}
          >
            {selectedCategory === 'All'
              ? 'All UX Articles'
              : `${selectedCategory} Articles`}{' '}
            <span
              style={{
                fontSize: '0.9rem',
                color: 'var(--text-tertiary)',
                fontWeight: 400,
              }}
            >
              ({filteredPosts.length})
            </span>
          </h2>
        </div>

        {filteredPosts.length === 0 ? (
          <div
            className="glass-panel"
            style={{
              textAlign: 'center',
              padding: '3.5rem 2rem',
              borderRadius: 'var(--radius-lg)',
            }}
          >
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🔎</div>
            <h3>No matching articles found</h3>
            <p
              style={{
                color: 'var(--text-secondary)',
                marginTop: '0.5rem',
                marginBottom: '1.5rem',
              }}
            >
              We couldn&apos;t find any posts matching &ldquo;{searchQuery}&rdquo;. Try another search term or reset filters.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('All');
              }}
              className="btn btn-secondary"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: '1.75rem',
            }}
          >
            {filteredPosts.map((post, idx) => (
              <AnimatedSection key={post.slug} delay={(idx % 6) * 60}>
                <article
                  className="glass-panel"
                  style={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    padding: '1.75rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--glass-border)',
                    transition: 'transform 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.borderColor = 'var(--glass-border-hover)';
                    e.currentTarget.style.boxShadow = 'var(--glass-shadow-hover)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.borderColor = 'var(--glass-border)';
                    e.currentTarget.style.boxShadow = 'var(--glass-shadow)';
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '0.85rem',
                    }}
                  >
                    <span
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        color: 'var(--accent-cyan)',
                        padding: '0.2rem 0.6rem',
                        borderRadius: '12px',
                        background: 'rgba(0, 240, 255, 0.1)',
                      }}
                    >
                      {post.category}
                    </span>
                    <span
                      style={{
                        fontSize: '0.75rem',
                        color: 'var(--text-tertiary)',
                      }}
                    >
                      {post.readTime}
                    </span>
                  </div>

                  <h3
                    style={{
                      fontSize: '1.15rem',
                      lineHeight: 1.4,
                      marginBottom: '0.75rem',
                      fontFamily: 'var(--font-heading)',
                    }}
                  >
                    <Link
                      to={`/blog/${post.slug}`}
                      style={{
                        color: 'var(--text-primary)',
                        textDecoration: 'none',
                      }}
                    >
                      {post.title}
                    </Link>
                  </h3>

                  <p
                    style={{
                      fontSize: '0.88rem',
                      color: 'var(--text-secondary)',
                      lineHeight: 1.6,
                      marginBottom: '1.25rem',
                      flex: 1,
                    }}
                  >
                    {post.excerpt}
                  </p>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      paddingTop: '1rem',
                      borderTop: '1px solid var(--border)',
                      marginTop: 'auto',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                      }}
                    >
                      <img
                        src={post.author.avatar}
                        alt={post.author.name}
                        style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '50%',
                          objectFit: 'cover',
                        }}
                      />
                      <span
                        style={{
                          fontSize: '0.8rem',
                          color: 'var(--text-primary)',
                          fontWeight: 500,
                        }}
                      >
                        {post.author.name}
                      </span>
                    </div>

                    <span
                      style={{
                        fontSize: '0.75rem',
                        color: 'var(--text-tertiary)',
                      }}
                    >
                      {new Date(post.date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                </article>
              </AnimatedSection>
            ))}
          </div>
        )}

        {/* Global Bottom CTA */}
        <AnimatedSection delay={200}>
          <div
            className="glass-panel"
            style={{
              marginTop: '4rem',
              padding: '2.5rem 2rem',
              borderRadius: 'var(--radius-lg)',
              background:
                'linear-gradient(135deg, rgba(0,240,255,0.08), rgba(139,92,246,0.08))',
              border: '1.5px solid rgba(0,240,255,0.25)',
              textAlign: 'center',
            }}
          >
            <h2
              style={{
                fontSize: '1.6rem',
                fontFamily: 'var(--font-heading)',
                marginBottom: '0.5rem',
              }}
            >
              Audit Your Website with Vision AI in <span className="text-gradient">10 Seconds</span>
            </h2>
            <p
              style={{
                color: 'var(--text-secondary)',
                maxWidth: '600px',
                margin: '0 auto 1.5rem',
                fontSize: '0.95rem',
              }}
            >
              Get an instant 11-dimension usability report with Nielsen heuristic checks,
              WCAG 2.2 accessibility scoring, and prioritized redesign recommendations.
            </p>
            <Link to="/" className="btn btn-primary" style={{ padding: '0.8rem 2rem' }}>
              ⚡ Start Free AI UX Audit →
            </Link>
          </div>
        </AnimatedSection>
      </section>
    </div>
  );
}
