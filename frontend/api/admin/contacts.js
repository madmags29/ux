export default async function handler(req, res) {
  try {
    const { default: app } = await import('../server.js');
    return app(req, res);
  } catch (err) {
    console.error('Vercel Execution Error in api/admin/contacts:', err);
    res.status(500).json({ error: err.message, stack: err.stack });
  }
}
