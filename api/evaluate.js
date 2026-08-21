import app from './server.js';

export default async function handler(req, res) {
  try {
    return await app(req, res);
  } catch (err) {
    console.error('Vercel Serverless Error in api/evaluate:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: err.message, stack: err.stack });
    }
  }
}
