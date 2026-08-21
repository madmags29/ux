import app from '../backend/server.js';

export default async function handler(req, res) {
  try {
    return await app(req, res);
  } catch (err) {
    console.error('Vercel Serverless Error in api/admin:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: err.message, stack: err.stack });
    }
  }
}
