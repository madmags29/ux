import app from '../_lib/server.js';

export default function handler(req, res) {
  if (!req.url.startsWith('/api/admin')) {
    req.url = '/api/admin' + (req.url.startsWith('/') ? req.url : '/' + req.url);
  }
  return app(req, res);
}
