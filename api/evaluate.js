import app from './_lib/server.js';

export default function handler(req, res) {
  if (!req.url.startsWith('/api/evaluate')) {
    req.url = '/api/evaluate';
  }
  return app(req, res);
}
