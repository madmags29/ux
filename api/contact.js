export default async function handler(req, res) {
  try {
    const { default: app } = await import('./server.js');
    return app(req, res);
  } catch (err) {
    console.error('Vercel Import/Execution Error in api/contact:', err);
    res.status(500).json({ error: err.message, stack: err.stack });
  }
}
