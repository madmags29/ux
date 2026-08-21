import app from '../backend/server.js';

export const config = {
  maxDuration: 60,
  api: {
    bodyParser: false, // Allow multer to process multipart/form-data
  },
};

export default function handler(req, res) {
  return app(req, res);
}
