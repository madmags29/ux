import app from './server.js';

export default function handler(req, res) {
  return new Promise((resolve, reject) => {
    try {
      app(req, res, (result) => {
        if (result instanceof Error) {
          console.error('Express Error:', result);
          if (!res.headersSent) {
            res.status(500).json({ error: result.message, stack: result.stack });
          }
          return resolve();
        }
        return resolve(result);
      });
    } catch (err) {
      console.error('Handler catch error:', err);
      if (!res.headersSent) {
        res.status(500).json({ error: err.message, stack: err.stack });
      }
      resolve();
    }
  });
}
