import app from './_lib/server.js';

export default function handler(req, res) {
  if (!req.url.startsWith('/api/contact')) {
    req.url = '/api/contact';
  }
  return app(req, res);
}
