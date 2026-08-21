import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const DEFAULT_TITLE = 'Rate My UX | Free AI-Powered UX Evaluation & Design Auditing Tool';
const DEFAULT_DESC = 'Rate My UX is an industry-leading AI UX evaluator that audits websites, Figma prototypes, and mobile apps using Vision AI. Get 11-dimension usability scores, Nielsen heuristic checks, WCAG 2.2 accessibility reports, and prioritized design roadmaps.';
const DEFAULT_KEYWORDS = 'Rate My UX, AI UX Audit, UX Evaluation Tool, Usability Testing AI, Figma Prototype UX Review, AI Design Critique, Jakob Nielsen 10 Heuristics, WCAG 2.2 Accessibility Checker, Conversion Rate Optimization CRO, UX Score Calculator';
const BASE_URL = 'https://www.ratemyux.com';
const DEFAULT_OG_IMAGE = 'https://www.ratemyux.com/og-image.png';

export default function SEO({
  title = DEFAULT_TITLE,
  description = DEFAULT_DESC,
  keywords = DEFAULT_KEYWORDS,
  canonicalPath = '',
  ogType = 'website',
  ogImage = DEFAULT_OG_IMAGE,
  schema = null,
}) {
  const location = useLocation();
  const currentPath = canonicalPath || location.pathname;
  const canonicalUrl = `${BASE_URL}${currentPath === '/' ? '' : currentPath}`;

  useEffect(() => {
    // 1. Update Title
    document.title = title;

    // Helper function to update or create meta tags
    const updateMetaTag = (selector, propertyAttr, propertyValue, content) => {
      let element = document.querySelector(selector);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(propertyAttr, propertyValue);
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };

    // Helper function for canonical link
    const updateCanonicalLink = (url) => {
      let element = document.querySelector('link[rel="canonical"]');
      if (!element) {
        element = document.createElement('link');
        element.setAttribute('rel', 'canonical');
        document.head.appendChild(element);
      }
      element.setAttribute('href', url);
    };

    // 2. Update Primary Meta Tags
    updateMetaTag('meta[name="title"]', 'name', 'title', title);
    updateMetaTag('meta[name="description"]', 'name', 'description', description);
    updateMetaTag('meta[name="keywords"]', 'name', 'keywords', keywords);
    updateCanonicalLink(canonicalUrl);

    // 3. Update Open Graph Tags
    updateMetaTag('meta[property="og:title"]', 'property', 'og:title', title);
    updateMetaTag('meta[property="og:description"]', 'property', 'og:description', description);
    updateMetaTag('meta[property="og:url"]', 'property', 'og:url', canonicalUrl);
    updateMetaTag('meta[property="og:type"]', 'property', 'og:type', ogType);
    updateMetaTag('meta[property="og:image"]', 'property', 'og:image', ogImage);

    // 4. Update Twitter Card Tags
    updateMetaTag('meta[name="twitter:title"]', 'name', 'twitter:title', title);
    updateMetaTag('meta[name="twitter:description"]', 'name', 'twitter:description', description);
    updateMetaTag('meta[name="twitter:url"]', 'name', 'twitter:url', canonicalUrl);
    updateMetaTag('meta[name="twitter:image"]', 'name', 'twitter:image', ogImage);

    // 5. Dynamic Page-Specific Structured Data (JSON-LD)
    let scriptTag = document.getElementById('dynamic-page-schema');
    if (schema) {
      if (!scriptTag) {
        scriptTag = document.createElement('script');
        scriptTag.id = 'dynamic-page-schema';
        scriptTag.type = 'application/ld+json';
        document.head.appendChild(scriptTag);
      }
      scriptTag.textContent = JSON.stringify(schema);
    } else if (scriptTag) {
      scriptTag.remove();
    }

  }, [title, description, keywords, canonicalUrl, ogType, ogImage, schema]);

  return null;
}
