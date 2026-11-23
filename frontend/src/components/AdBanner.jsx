import { useEffect, useRef } from 'react';

/**
 * AdBanner Component for Google AdSense
 * Client: ca-pub-9460255466960810
 *
 * Designed to remain completely hidden before AdSense approval,
 * preventing blank box placeholders, layout shifts, or policy flags.
 * Once approved, setting VITE_ADSENSE_APPROVED=true activates manual slots.
 */
export default function AdBanner({
  slot = '',
  format = 'auto',
  responsive = 'true',
  style = {},
  className = '',
  label = 'Advertisement',
}) {
  const adRef = useRef(null);
  const isApproved = import.meta.env.VITE_ADSENSE_APPROVED === 'true';

  useEffect(() => {
    if (!isApproved) return;
    try {
      if (typeof window !== 'undefined' && window.adsbygoogle) {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      }
    } catch (err) {
      // Safe catch for react re-renders
      console.debug('AdSense notification:', err);
    }
  }, [isApproved]);

  // Completely hidden prior to approval to keep UX clean and compliant
  if (!isApproved) {
    return (
      <div
        className="adsense-slot-unapproved"
        data-ad-client="ca-pub-9460255466960810"
        style={{ display: 'none' }}
        aria-hidden="true"
      />
    );
  }

  return (
    <div
      className={`adsense-slot-container ${className}`}
      style={{
        margin: '2rem 0',
        textAlign: 'center',
        overflow: 'hidden',
        minHeight: '0',
        ...style,
      }}
    >
      <div
        style={{
          fontSize: '0.65rem',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: 'var(--text-tertiary, #94a3b8)',
          marginBottom: '0.35rem',
          fontWeight: 600,
        }}
      >
        {label}
      </div>
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{ display: 'block', minHeight: '90px', ...style }}
        data-ad-client="ca-pub-9460255466960810"
        {...(slot ? { 'data-ad-slot': slot } : {})}
        data-ad-format={format}
        data-full-width-responsive={responsive}
      />
    </div>
  );
}
