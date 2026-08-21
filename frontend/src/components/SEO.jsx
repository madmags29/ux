import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const DEFAULT_TITLE = 'Rate My UX | AI-Powered UX Evaluation & Design Auditing Tool';
const DEFAULT_DESC = 'Rate My UX is an AI-powered UX evaluation platform that audits your website, app, or Figma prototype using advanced Vision AI. Get 11-dimension usability scores, Nielsen heuristic checks, WCAG accessibility reports, and prioritized design roadmaps instantly.';
const DEFAULT_KEYWORDS = 'Rate My UX, UX Audit Tool, AI UX Evaluation, Usability Testing AI, Figma Prototype Audit, Design Critique AI, Heuristic Evaluation Tool, Accessibility Audit, Conversion Rate Optimization, UX Score Checker';
const BASE_URL = 'https://www.ratemyux.com';
const DEFAULT_OG_IMAGE = 'https://www.ratemyux.com/og-image.png';

export default function SEO({
  title = DEFAULT_TITLE,
  description = DEFAULT_DESC,
  keywords = DEFAULT_KEYWORDS,
  canonicalPath = '',
  ogType = 'website',
  ogImage = DEFAULT_OG_IMAGE,
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

  }, [title, description, keywords, canonicalUrl, ogType, ogImage]);

  return null;
}
