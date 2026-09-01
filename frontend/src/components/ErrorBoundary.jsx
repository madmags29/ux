import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary] Caught error:', error, info);
  }

  handleReload() {
    // Unregister service worker caches and hard reload
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((reg) => reg.unregister());
      });
      // Clear caches
      caches.keys().then((keys) => {
        keys.forEach((key) => caches.delete(key));
      });
    }
    window.location.reload(true);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#0a0a14',
            color: '#fff',
            fontFamily: 'Inter, sans-serif',
            textAlign: 'center',
            padding: '2rem',
          }}
        >
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚡</div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>
            Something went wrong
          </h1>
          <p style={{ color: '#8e8ea0', marginBottom: '1.5rem', maxWidth: 420 }}>
            An unexpected error occurred. This is usually caused by a cached version of the app.
            Click below to clear the cache and reload.
          </p>
          <button
            onClick={this.handleReload}
            style={{
              background: 'linear-gradient(135deg, #00f0ff, #8b5cf6)',
              color: '#000',
              border: 'none',
              borderRadius: '8px',
              padding: '0.75rem 1.75rem',
              fontWeight: 700,
              fontSize: '1rem',
              cursor: 'pointer',
            }}
          >
            🔄 Clear Cache &amp; Reload
          </button>
          {import.meta.env.DEV && (
            <pre
              style={{
                marginTop: '2rem',
                background: 'rgba(255,0,0,0.1)',
                border: '1px solid rgba(255,0,0,0.3)',
                borderRadius: '8px',
                padding: '1rem',
                fontSize: '0.75rem',
                color: '#ff6b6b',
                textAlign: 'left',
                maxWidth: 700,
                overflowX: 'auto',
              }}
            >
              {this.state.error?.toString()}
            </pre>
          )}
        </div>
      );
    }
    return this.props.children;
  }
}
