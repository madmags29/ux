import express from 'express';
import cors from 'cors';
import multer from 'multer';
import OpenAI from 'openai';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import nodemailer from 'nodemailer';
import os from 'os';
import { connectDB } from './_db.js';
import Evaluation from './_models/Evaluation.js';
import Contact from './_models/Contact.js';
import User from './_models/User.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { OAuth2Client } from 'google-auth-library';

import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });


const app = express();
const port = process.env.PORT || 3001;
const getOpenAI = () => {
  const apiKey = (process.env.OPENAI_API_KEY || '').trim().split('\n')[0].trim();
  return new OpenAI({ apiKey });
};

app.use(cors());
app.use(express.json());
app.use((req, res, next) => {
  console.log(`[Express Request] ${req.method} ${req.url}`);
  next();
});

// Serve screenshots statically (using temp directory on Vercel serverless)
const isVercel = Boolean(process.env.VERCEL);
const screenshotsDir = isVercel ? path.join(os.tmpdir(), 'screenshots') : path.resolve('screenshots');
const uploadsDir = isVercel ? path.join(os.tmpdir(), 'uploads') : path.resolve('uploads');
const dataDir = isVercel ? path.join(os.tmpdir(), 'data') : path.resolve('data');

if (!fs.existsSync(screenshotsDir)) fs.mkdirSync(screenshotsDir, { recursive: true });
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
app.use('/screenshots', express.static(screenshotsDir));

// ─── Data Storage Helpers ───────────────────────────────────────────────────
const EVALUATIONS_FILE = path.join(dataDir, 'evaluations.json');
const CONTACTS_FILE = path.join(dataDir, 'contacts.json');
const USERS_FILE = path.join(dataDir, 'users.json');

const loadJSON = (filepath) => {
  try {
    if (!fs.existsSync(filepath)) return [];
    return JSON.parse(fs.readFileSync(filepath, 'utf8'));
  } catch (err) {
    return [];
  }
};

const saveJSON = (filepath, data) => {
  try {
    fs.writeFileSync(filepath, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error(`Failed to save ${filepath}:`, err);
  }
};

const findUserByEmail = async (email) => {
  const cleanEmail = email.trim().toLowerCase();
  try {
    const db = await connectDB();
    if (db) {
      const u = await User.findOne({ email: cleanEmail }).lean();
      if (u) return u;
    }
  } catch (e) {
    console.warn('MongoDB User find error, using local fallback:', e.message);
  }
  const users = loadJSON(USERS_FILE);
  return users.find(u => u.email === cleanEmail) || null;
};

const findUserById = async (id) => {
  try {
    const db = await connectDB();
    if (db) {
      const u = await User.findOne({ id }).select('-password').lean();
      if (u) return u;
    }
  } catch (e) {
    console.warn('MongoDB User findById error, using local fallback:', e.message);
  }
  const users = loadJSON(USERS_FILE);
  const u = users.find(user => user.id === id);
  if (!u) return null;
  const { password, ...userWithoutPass } = u;
  return userWithoutPass;
};

const saveUserRecord = async (userRecord) => {
  try {
    const db = await connectDB();
    if (db) {
      const existing = await User.findOne({ email: userRecord.email });
      if (existing) {
        Object.assign(existing, userRecord);
        await existing.save();
      } else {
        await User.create(userRecord);
      }
    }
  } catch (e) {
    console.warn('MongoDB User save error, using local fallback:', e.message);
  }
  const users = loadJSON(USERS_FILE);
  const existingIdx = users.findIndex(u => u.email === userRecord.email || u.id === userRecord.id);
  if (existingIdx >= 0) {
    users[existingIdx] = { ...users[existingIdx], ...userRecord };
  } else {
    users.unshift(userRecord);
  }
  saveJSON(USERS_FILE, users);
  return userRecord;
};

const JWT_SECRET = process.env.JWT_SECRET || 'rate-my-ux-jwt-secret-key-2026';

const getUserIdFromReq = (req) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded.id || null;
  } catch (err) {
    return null;
  }
};

const authUser = (req, res, next) => {
  const userId = getUserIdFromReq(req);
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized: Please log in' });
  }
  req.userId = userId;
  next();
};

// -------------------------------------------------------------
// USER AUTHENTICATION & USER DASHBOARD ENDPOINTS
// -------------------------------------------------------------
app.post(['/api/auth/register', '/auth/register'], async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const existingUser = await findUserByEmail(cleanEmail);
    if (existingUser) {
      return res.status(400).json({ error: 'An account with this email already exists.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = 'usr_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);

    const newUserRecord = {
      id: userId,
      name: name.trim(),
      email: cleanEmail,
      password: hashedPassword,
      avatar: '',
      provider: 'email',
      createdAt: new Date().toISOString(),
    };

    await saveUserRecord(newUserRecord);

    const token = jwt.sign(
      { id: newUserRecord.id, email: newUserRecord.email, name: newUserRecord.name },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    return res.status(201).json({
      success: true,
      token,
      user: {
        id: newUserRecord.id,
        name: newUserRecord.name,
        email: newUserRecord.email,
        avatar: newUserRecord.avatar,
        provider: newUserRecord.provider,
      },
    });
  } catch (err) {
    console.error('Registration Error:', err);
    return res.status(500).json({ error: 'Server error during registration' });
  }
});

app.post(['/api/auth/login', '/auth/login'], async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = await findUserByEmail(cleanEmail);
    if (!user || !user.password) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    return res.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        provider: user.provider,
      },
    });
  } catch (err) {
    console.error('Login Error:', err);
    return res.status(500).json({ error: 'Server error during login' });
  }
});

app.post(['/api/auth/google', '/auth/google'], async (req, res) => {
  try {
    const { credential, googleId, email, name, avatar } = req.body;
    let cleanEmail = email ? email.trim().toLowerCase() : '';
    let displayName = name || '';
    let userAvatar = avatar || '';
    let gId = googleId || '';

    if (credential) {
      const clientId = process.env.GOOGLE_CLIENT_ID;
      if (!clientId) {
        return res.status(500).json({ error: 'Google OAuth not configured on server.' });
      }
      try {
        const client = new OAuth2Client(clientId);
        const ticket = await client.verifyIdToken({
          idToken: credential,
          audience: clientId,
        });
        const payload = ticket.getPayload();
        cleanEmail = payload.email.toLowerCase();
        displayName = payload.name || cleanEmail.split('@')[0];
        userAvatar = payload.picture || '';
        gId = payload.sub;
        console.log('[Google Auth] Token verified for:', cleanEmail);
      } catch (verifyErr) {
        console.error('[Google Auth] Token verification failed:', verifyErr.message);
        return res.status(401).json({ error: 'Google token verification failed: ' + verifyErr.message });
      }
    }

    if (!cleanEmail) {
      return res.status(400).json({ error: 'Google authentication payload missing email.' });
    }

    let user = await findUserByEmail(cleanEmail);
    if (!user) {
      const userId = 'usr_g_' + Date.now();
      user = {
        id: userId,
        name: displayName || cleanEmail.split('@')[0],
        email: cleanEmail,
        googleId: gId,
        avatar: userAvatar,
        provider: 'google',
        createdAt: new Date().toISOString(),
      };
      await saveUserRecord(user);
    } else {
      user.googleId = gId || user.googleId;
      user.avatar = userAvatar || user.avatar;
      user.provider = user.provider || 'google';
      await saveUserRecord(user);
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    return res.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        provider: user.provider,
      },
    });
  } catch (err) {
    console.error('Google Auth Error:', err);
    return res.status(500).json({ error: 'Server error during Google login' });
  }
});

app.get(['/api/auth/me', '/auth/me'], authUser, async (req, res) => {
  try {
    const user = await findUserById(req.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    let evalCount = 0;
    try {
      const db = await connectDB();
      if (db) {
        evalCount = await Evaluation.countDocuments({ userId: user.id });
      } else {
        const evaluations = loadJSON(EVALUATIONS_FILE);
        evalCount = evaluations.filter(e => e.userId === user.id).length;
      }
    } catch {
      const evaluations = loadJSON(EVALUATIONS_FILE);
      evalCount = evaluations.filter(e => e.userId === user.id).length;
    }

    return res.json({
      success: true,
      user: {
        ...user,
        evalCount,
      },
    });
  } catch (err) {
    console.error('Fetch Profile Error:', err);
    return res.status(500).json({ error: 'Server error fetching user profile' });
  }
});

app.post(['/api/auth/change-password', '/auth/change-password'], authUser, async (req, res) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters long.' });
    }

    const user = await findUserById(req.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await saveUserRecord(user);

    return res.json({ success: true, message: 'Password updated successfully!' });
  } catch (err) {
    console.error('Change Password Error:', err);
    return res.status(500).json({ error: 'Server error updating password' });
  }
});

app.get(['/api/user/evaluations', '/user/evaluations'], authUser, async (req, res) => {
  try {
    try {
      const db = await connectDB();
      if (db) {
        const evaluations = await Evaluation.find({ userId: req.userId }).sort({ createdAt: -1 }).lean();
        return res.json({ success: true, count: evaluations.length, evaluations });
      }
    } catch {}
    const evaluations = loadJSON(EVALUATIONS_FILE);
    const userEvals = evaluations.filter(e => e.userId === req.userId);
    return res.json({ success: true, count: userEvals.length, evaluations: userEvals });
  } catch (err) {
    console.error('User Evaluations Error:', err);
    return res.status(500).json({ error: 'Server error fetching user evaluations' });
  }
});

// Helper for browser launch (supporting local Dev & Vercel serverless)
const launchBrowser = async () => {
  if (process.env.VERCEL) {
    const chromium = (await import('@sparticuz/chromium')).default;
    const puppeteerCore = (await import('puppeteer-core')).default;
    return await puppeteerCore.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
    });
  }
  const puppeteer = (await import('puppeteer')).default;
  return await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security', '--disable-features=IsolateOrigins,site-per-process']
  });
};

// ─── Prompts ──────────────────────────────────────────────────────────────────
const PER_SCREEN_PROMPT = `
You are a world-class UX Researcher and Design Critic (ex-Apple, Google, Airbnb, Stripe).
Evaluate this single screen/page screenshot and return a JSON object with exactly this structure:

{
  "pageTitle": "string — inferred name of this screen",
  "pageRole": "string — what this screen does in the user journey (e.g. Landing, Sign Up, Dashboard, Settings)",
  "firstImpression": { "score": 0-10, "strengths": ["string"], "weaknesses": ["string"] },
  "uiDesign": { "score": 0-10, "criticalIssues": ["string"], "recommendations": ["string"] },
  "uxAudit": { "score": 0-10, "confusingAreas": ["string"], "improvements": ["string"] },
  "accessibility": { "score": 0-10, "issues": ["string"], "fixes": ["string"] },
  "conversion": { "score": 0-10, "ctaEffectiveness": "string", "suggestions": ["string"] },
  "contentSuggestions": { "score": 0-10, "issues": ["string"], "improvements": ["string"] },
  "topPriority": "string — the single most important improvement for this screen",
  "overallScore": 0-100
}

Be brutally honest. Evidence-based. Reference specific UI elements visible in the screenshot.
`;

const AGGREGATE_PROMPT = `
You are a world-class UX Director (ex-Apple, Google, Airbnb, Stripe, Linear).
Based on the per-screen evaluations provided, write an aggregate executive summary and return a JSON object:

{
  "productName": "string",
  "productCategory": "string",
  "targetAudience": "string",
  "coreValueProposition": "string",
  "overallScore": 0-100,
  "finalVerdict": "Exceptional" | "Strong" | "Good" | "Average" | "Below Standard" | "Needs Major Redesign",
  "breakdown": { "uiDesign": 0-100, "ux": 0-100, "accessibility": 0-100, "conversion": 0-100, "content": 0-100, "consistency": 0-100, "usability": 0-100 },
  "heuristicsCheck": [
    { "heuristic": "Visibility of system status", "passed": boolean, "notes": "string" },
    { "heuristic": "Match between system and the real world", "passed": boolean, "notes": "string" },
    { "heuristic": "User control and freedom", "passed": boolean, "notes": "string" },
    { "heuristic": "Consistency and standards", "passed": boolean, "notes": "string" },
    { "heuristic": "Error prevention", "passed": boolean, "notes": "string" },
    { "heuristic": "Recognition rather than recall", "passed": boolean, "notes": "string" },
    { "heuristic": "Flexibility and efficiency of use", "passed": boolean, "notes": "string" },
    { "heuristic": "Aesthetic and minimalist design", "passed": boolean, "notes": "string" },
    { "heuristic": "Help users recognize, diagnose, and recover from errors", "passed": boolean, "notes": "string" },
    { "heuristic": "Help and documentation", "passed": boolean, "notes": "string" }
  ],
  "crossScreenIssues": ["string"],
  "consistencyNotes": "string",
  "prioritizedRoadmap": {
    "critical": [{ "problem": "string", "affectedScreens": ["string"], "suggestedSolution": "string", "effort": "Low|Medium|High" }],
    "important": [{ "problem": "string", "affectedScreens": ["string"], "suggestedSolution": "string", "effort": "Low|Medium|High" }],
    "enhancements": [{ "problem": "string", "affectedScreens": ["string"], "suggestedSolution": "string", "effort": "Low|Medium|High" }]
  },
  "seniorDesignerAdvice": "string"
}
`;

// ─── Helpers ──────────────────────────────────────────────────────────────────
const isFigmaUrl = (u) => u && /figma\.com\/(proto|file|design)\//.test(u);
const toBase64 = (filepath) => Buffer.from(fs.readFileSync(filepath)).toString('base64');

async function evaluateScreen(base64Image, retries = 2) {
  for (let i = 0; i <= retries; i++) {
    try {
      const response = await getOpenAI().chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: PER_SCREEN_PROMPT },
          {
            role: 'user',
            content: [
              { type: 'text', text: 'Evaluate this screen.' },
              { type: 'image_url', image_url: { url: `data:image/png;base64,${base64Image}` } }
            ]
          }
        ],
        response_format: { type: 'json_object' },
        max_tokens: 1500
      });
      return JSON.parse(response.choices[0].message.content);
    } catch (err) {
      if (i === retries) throw err;
      await new Promise(r => setTimeout(r, 1000));
    }
  }
}

async function saveUploadedImage(file, index) {
  const ext = path.extname(file.originalname) || '.png';
  const filename = `upload-${index}-${Date.now()}${ext}`;
  const filepath = path.join(screenshotsDir, filename);
  fs.copyFileSync(file.path, filepath);
  try { fs.unlinkSync(file.path); } catch {}
  const base64 = toBase64(filepath);
  return { filepath, filename, base64 };
}

async function screenshotUrl(page, url, label) {
  const filename = `screen-${label}-${Date.now()}.png`;
  const filepath = path.join(screenshotsDir, filename);
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 40000 });
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: filepath, fullPage: false });
  const base64 = toBase64(filepath);
  return { filepath, filename, base64, url };
}

// ─── Multer ───────────────────────────────────────────────────────────────────
const upload = multer({
  dest: uploadsDir,
  limits: { fileSize: 25 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /\.(png|jpg|jpeg|webp|gif)$/i;
    if (allowed.test(file.originalname)) cb(null, true);
    else cb(new Error('Only image files are allowed'));
  }
});

// ─── SMTP Transporter ─────────────────────────────────────────────────────────
const smtpTransporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'IN10.FASTWEBHOST.COM',
  port: parseInt(process.env.SMTP_PORT || '465'),
  secure: true, // SSL
  auth: {
    user: process.env.SMTP_USER || 'hello@ratemyux.com',
    pass: process.env.SMTP_PASS,
  },
  authMethod: 'LOGIN',
  tls: {
    rejectUnauthorized: false,
  },
});

// ─── Contact form endpoint ───────────────────────────────────────────────────
app.post(['/api/contact', '/contact'], async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !subject || !message) {
      return res.status(400).json({ error: 'All fields are required.' });
    }

    // Save contact record (MongoDB with JSON fallback)
    const contactRecord = {
      id: 'contact_' + Date.now(),
      timestamp: new Date().toISOString(),
      name,
      email,
      subject,
      message,
    };

    try {
      const db = await connectDB();
      if (db) {
        await Contact.create(contactRecord);
      } else {
        const contacts = loadJSON(CONTACTS_FILE);
        contacts.unshift(contactRecord);
        saveJSON(CONTACTS_FILE, contacts);
      }
    } catch (dbErr) {
      console.error('Failed to save contact to DB:', dbErr);
      const contacts = loadJSON(CONTACTS_FILE);
      contacts.unshift(contactRecord);
      saveJSON(CONTACTS_FILE, contacts);
    }

    await smtpTransporter.sendMail({
      from: `"Rate My UX Contact" <${process.env.SMTP_USER || 'hello@ratemyux.com'}>`,
      replyTo: email,
      to: 'hello@ratemyux.com',
      subject: `[Contact Form] ${subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #6c5ce7;">New Contact Form Submission</h2>
          <hr style="border: 1px solid #eee;" />
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
          <p><strong>Subject:</strong> ${subject}</p>
          <hr style="border: 1px solid #eee;" />
          <h3>Message:</h3>
          <p style="white-space: pre-wrap;">${message}</p>
          <hr style="border: 1px solid #eee;" />
          <p style="color: #999; font-size: 12px;">Sent from Rate My UX Contact Form — ratemyux.com</p>
        </div>
      `,
    });

    res.json({ success: true, message: 'Email sent successfully.' });
  } catch (error) {
    console.error('Contact email error:', error);
    // If SMTP fails, still save inquiry so admin can view it!
    const contactRecord = {
      id: 'contact_' + Date.now(),
      timestamp: new Date().toISOString(),
      name: req.body?.name || 'Anonymous',
      email: req.body?.email || 'Unknown',
      subject: req.body?.subject || 'Contact Inquiry',
      message: req.body?.message || '',
    };
    const contacts = loadJSON(CONTACTS_FILE);
    if (!contacts.some(c => c.id === contactRecord.id)) {
      contacts.unshift(contactRecord);
      saveJSON(CONTACTS_FILE, contacts);
    }
    res.json({ success: true, message: 'Inquiry received and saved.' });
  }
});

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'AI UX Expert backend is running.' });
});

// ─── Main evaluate endpoint ───────────────────────────────────────────────────
app.post(['/api/evaluate', '/evaluate'], upload.array('images', 20), async (req, res) => {
  const { url, maxScreens = 6 } = req.body;
  const uploadedFiles = req.files || [];
  let browser;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');

  const send = (type, data) => res.write(`data: ${JSON.stringify({ type, ...data })}\n\n`);

  const filePaths = [];
  const cleanup = () => filePaths.forEach(fp => { try { if (fs.existsSync(fp)) fs.unlinkSync(fp); } catch {} });

  try {
    if (!url && uploadedFiles.length === 0) {
      send('error', { message: 'Please provide a URL or upload at least one design image.' });
      return res.end();
    }

    if (!process.env.OPENAI_API_KEY) {
      send('error', { message: 'OPENAI_API_KEY is missing in .env' });
      return res.end();
    }

    const screensData = [];

    // ── PATH A: Uploaded images ─────────────────────────────────────────────
    if (uploadedFiles.length > 0) {
      send('status', { message: `Processing ${uploadedFiles.length} uploaded image(s)...` });
      send('total', { total: uploadedFiles.length });

      for (let i = 0; i < uploadedFiles.length; i++) {
        const file = uploadedFiles[i];
        const label = file.originalname.replace(/\.[^.]+$/, '') || `Screen ${i + 1}`;
        send('progress', { current: i + 1, total: uploadedFiles.length, screenName: label, url: label });

        const { filepath, filename, base64 } = await saveUploadedImage(file, i);
        filePaths.push(filepath);
        send('screenshot_preview', { screenshotBase64: `data:image/png;base64,${base64}` });

        send('status', { message: `Analyzing: ${label} (${i + 1}/${uploadedFiles.length})` });
        const evaluation = await evaluateScreen(base64);

        const screenData = {
          index: i + 1, url: label, title: label || evaluation.pageTitle,
          screenshotUrl: `http://localhost:${port}/screenshots/${filename}`,
          screenshotBase64: `data:image/png;base64,${base64}`,
          evaluation,
        };
        screensData.push(screenData);
        send('screen', screenData);
      }
    }

    // ── PATH B: Figma URL ────────────────────────────────────────────────────
    else if (isFigmaUrl(url)) {
      const isProto = /figma\.com\/proto\//.test(url);
      send('status', { message: `Figma ${isProto ? 'prototype' : 'design'} detected — launching browser...` });
      send('total', { total: 1 });
      send('progress', { current: 1, total: 1, screenName: 'Figma Design', url });

      browser = await launchBrowser();
      const page = await browser.newPage();
      await page.setViewport({ width: 1440, height: 900 });

      // Set a realistic user agent
      await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

      let screenshotResult;
      try {
        if (isProto) {
          send('status', { message: 'Loading Figma prototype (this takes ~10s)...' });
          await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 50000 });
          await new Promise(r => setTimeout(r, 10000)); // Figma needs time to render the canvas
        } else {
          // For file/design links, use the embed URL which is more accessible
          const embedUrl = `https://www.figma.com/embed?embed_host=share&url=${encodeURIComponent(url)}`;
          send('status', { message: 'Loading Figma design embed (this takes ~8s)...' });
          await page.goto(embedUrl, { waitUntil: 'domcontentloaded', timeout: 50000 });
          await new Promise(r => setTimeout(r, 8000));
        }

        const filename = `figma-${Date.now()}.png`;
        const filepath = path.join(screenshotsDir, filename);
        await page.screenshot({ path: filepath, fullPage: false });
        const base64 = toBase64(filepath);
        screenshotResult = { filepath, filename, base64, url };
        filePaths.push(filepath);
        send('screenshot_preview', { screenshotBase64: `data:image/png;base64,${base64}` });
      } catch (figmaErr) {
        await browser.close(); browser = null;
        send('error', {
          message: `❌ Figma link failed to load: ${figmaErr.message}\n\n` +
            `✅ Fix options:\n` +
            `1. Make sure "Anyone with the link" can view the prototype in Figma share settings.\n` +
            `2. Export your Figma frames as PNG images and use the "Upload Images" tab — this gives more accurate results.\n` +
            `3. If it's a Figma file link, try sharing the prototype link (figma.com/proto/...) instead.`
        });
        return res.end();
      }

      await browser.close(); browser = null;

      send('status', { message: 'Analyzing Figma design with AI...' });
      const evaluation = await evaluateScreen(screenshotResult.base64);
      const screenData = {
        index: 1, url, title: 'Figma Design',
        screenshotUrl: `http://localhost:${port}/screenshots/${screenshotResult.filename}`,
        screenshotBase64: `data:image/png;base64,${screenshotResult.base64}`,
        evaluation,
      };
      screensData.push(screenData);
      send('screen', screenData);
    }

    // ── PATH C: Regular URL ─────────────────────────────────────────────────
    else {
      send('status', { message: 'Launching browser...' });
      browser = await launchBrowser();
      const page = await browser.newPage();
      await page.setViewport({ width: 1440, height: 900 });

      send('status', { message: `Navigating to ${url}...` });
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 35000 });
      const pageTitle = await page.title();
      const baseUrl = new URL(url).origin;

      send('status', { message: 'Discovering screens...' });
      const links = await page.evaluate((base) => {
        return Array.from(document.querySelectorAll('a[href]')).reduce((acc, a) => {
          try {
            const href = new URL(a.href, base).href;
            if (href.startsWith(base) && !acc.find(l => l.href === href) && !href.includes('#') && !href.match(/\.(pdf|zip|png|jpg|svg)$/i))
              acc.push({ href, text: a.innerText.trim().slice(0, 40) || href });
          } catch {}
          return acc;
        }, []);
      }, baseUrl);

      const screensToVisit = [{ href: url, text: pageTitle || 'Home' }, ...links.filter(l => l.href !== url)].slice(0, parseInt(maxScreens));
      send('status', { message: `Found ${screensToVisit.length} screen(s). Evaluating...` });
      send('total', { total: screensToVisit.length });

      for (let i = 0; i < screensToVisit.length; i++) {
        const screen = screensToVisit[i];
        send('progress', { current: i + 1, total: screensToVisit.length, screenName: screen.text, url: screen.href });
        try {
          const result = await screenshotUrl(page, screen.href, i);
          filePaths.push(result.filepath);
          send('screenshot_preview', { screenshotBase64: `data:image/png;base64,${result.base64}` });
          send('status', { message: `Analyzing screen ${i + 1}/${screensToVisit.length}: ${screen.text}...` });
          const evaluation = await evaluateScreen(result.base64);
          const screenData = {
            index: i + 1, url: result.url, title: screen.text || evaluation.pageTitle,
            screenshotUrl: `http://localhost:${port}/screenshots/${result.filename}`,
            screenshotBase64: `data:image/png;base64,${result.base64}`,
            evaluation,
          };
          screensData.push(screenData);
          send('screen', screenData);
        } catch (err) {
          send('screenError', { index: i + 1, url: screen.href, message: err.message });
        }
      }

      await browser.close(); browser = null;
    }

    // ── Aggregate ───────────────────────────────────────────────────────────
    let finalAggregate = null;
    if (screensData.length > 0) {
      send('status', { message: 'Generating aggregate report...' });
      const summaryInput = screensData.map(s => `Screen ${s.index} - "${s.title}":\n${JSON.stringify(s.evaluation, null, 2)}`).join('\n\n---\n\n');
      const aggResponse = await getOpenAI().chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: AGGREGATE_PROMPT },
          { role: 'user', content: `Per-screen evaluations:\n\n${summaryInput}` }
        ],
        response_format: { type: 'json_object' },
        max_tokens: 2000
      });
      finalAggregate = JSON.parse(aggResponse.choices[0].message.content);
      send('aggregate', { aggregate: finalAggregate });
    }

    // Persist evaluation record (MongoDB with JSON fallback)
    try {
      const currentUserId = getUserIdFromReq(req);
      const evalRecord = {
        id: 'eval_' + Date.now(),
        userId: currentUserId,
        timestamp: new Date().toISOString(),
        targetUrl: url || 'Uploaded Screenshots',
        mode: url ? 'url' : 'upload',
        screenCount: screensData.length,
        overallScore: finalAggregate?.overallScore || (screensData[0]?.evaluation?.overallScore || 0),
        finalVerdict: finalAggregate?.finalVerdict || 'Good',
        productName: finalAggregate?.productName || 'Evaluated Product',
        productCategory: finalAggregate?.productCategory || 'General Web App',
        screens: screensData,
        aggregate: finalAggregate,
      };

      const db = await connectDB();
      if (db) {
        await Evaluation.create(evalRecord);
      } else {
        const evaluations = loadJSON(EVALUATIONS_FILE);
        evaluations.unshift(evalRecord);
        saveJSON(EVALUATIONS_FILE, evaluations);
      }
    } catch (saveErr) {
      console.error('Failed to persist evaluation record:', saveErr);
      try {
        const evalRecord = {
          id: 'eval_' + Date.now(),
          timestamp: new Date().toISOString(),
          targetUrl: url || 'Uploaded Screenshots',
          mode: url ? 'url' : 'upload',
          screenCount: screensData.length,
          overallScore: finalAggregate?.overallScore || (screensData[0]?.evaluation?.overallScore || 0),
          finalVerdict: finalAggregate?.finalVerdict || 'Good',
          productName: finalAggregate?.productName || 'Evaluated Product',
          productCategory: finalAggregate?.productCategory || 'General Web App',
          screens: screensData,
          aggregate: finalAggregate,
        };
        const evaluations = loadJSON(EVALUATIONS_FILE);
        evaluations.unshift(evalRecord);
        saveJSON(EVALUATIONS_FILE, evaluations);
      } catch {}
    }

    setTimeout(() => cleanup(), 300000);
    send('done', { message: 'Evaluation complete!' });
    res.end();

  } catch (error) {
    console.error('Evaluation Error:', error);
    if (browser) { try { await browser.close(); } catch {} }
    cleanup();
    send('error', { message: error.message || 'Evaluation failed.' });
    res.end();
  }
});

// ─── Admin Endpoints ────────────────────────────────────────────────────────
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

const authAdmin = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];
  const customHeader = req.headers['x-admin-token'];
  if (token === 'admin-authenticated-token' || customHeader === 'admin-authenticated-token') {
    return next();
  }
  return res.status(401).json({ error: 'Unauthorized: Invalid Admin Token' });
};

app.post(['/api/admin/login', '/admin/login'], (req, res) => {
  const { password } = req.body;
  if (password === ADMIN_PASSWORD) {
    return res.json({ success: true, token: 'admin-authenticated-token' });
  }
  return res.status(401).json({ error: 'Incorrect admin password' });
});

app.get(['/api/admin/evaluations', '/admin/evaluations'], authAdmin, async (req, res) => {
  try {
    const db = await connectDB();
    if (db) {
      const evaluations = await Evaluation.find().sort({ createdAt: -1 }).lean();
      return res.json({ success: true, count: evaluations.length, evaluations });
    }
  } catch (err) {
    console.error('MongoDB evaluations fetch error:', err);
  }
  const evaluations = loadJSON(EVALUATIONS_FILE);
  res.json({ success: true, count: evaluations.length, evaluations });
});

app.get(['/api/admin/contacts', '/admin/contacts'], authAdmin, async (req, res) => {
  try {
    const db = await connectDB();
    if (db) {
      const contacts = await Contact.find().sort({ createdAt: -1 }).lean();
      return res.json({ success: true, count: contacts.length, contacts });
    }
  } catch (err) {
    console.error('MongoDB contacts fetch error:', err);
  }
  const contacts = loadJSON(CONTACTS_FILE);
  res.json({ success: true, count: contacts.length, contacts });
});

app.delete(['/api/admin/evaluations/:id', '/admin/evaluations/:id'], authAdmin, async (req, res) => {
  try {
    const db = await connectDB();
    if (db) {
      await Evaluation.deleteOne({ id: req.params.id });
    }
  } catch (err) {
    console.error('MongoDB evaluation delete error:', err);
  }
  let evaluations = loadJSON(EVALUATIONS_FILE);
  evaluations = evaluations.filter(e => e.id !== req.params.id);
  saveJSON(EVALUATIONS_FILE, evaluations);
  res.json({ success: true, message: 'Evaluation deleted' });
});

app.delete(['/api/admin/contacts/:id', '/admin/contacts/:id'], authAdmin, async (req, res) => {
  try {
    const db = await connectDB();
    if (db) {
      await Contact.deleteOne({ id: req.params.id });
    }
  } catch (err) {
    console.error('MongoDB contact delete error:', err);
  }
  let contacts = loadJSON(CONTACTS_FILE);
  contacts = contacts.filter(c => c.id !== req.params.id);
  saveJSON(CONTACTS_FILE, contacts);
  res.json({ success: true, message: 'Contact deleted' });
});

app.get(['/api/admin/users', '/admin/users'], authAdmin, async (req, res) => {
  try {
    let usersList = [];
    try {
      const db = await connectDB();
      if (db) {
        usersList = await User.find().select('-password').sort({ createdAt: -1 }).lean();
      }
    } catch (err) {
      console.warn('MongoDB users fetch error:', err);
    }
    if (!usersList || usersList.length === 0) {
      usersList = loadJSON(USERS_FILE).map(({ password, ...u }) => u);
    }
    const evaluations = loadJSON(EVALUATIONS_FILE);
    const usersWithCounts = usersList.map((u) => {
      const evalCount = evaluations.filter(e => e.userId === u.id).length;
      return { ...u, evalCount };
    });
    return res.json({ success: true, count: usersWithCounts.length, users: usersWithCounts });
  } catch (err) {
    console.error('Admin users error:', err);
    const usersList = loadJSON(USERS_FILE).map(({ password, ...u }) => u);
    return res.json({ success: true, count: usersList.length, users: usersList });
  }
});

app.delete(['/api/admin/users/:id', '/admin/users/:id'], authAdmin, async (req, res) => {
  try {
    try {
      const db = await connectDB();
      if (db) {
        await User.deleteOne({ id: req.params.id });
      }
    } catch (err) {
      console.error('MongoDB user delete error:', err);
    }
    let users = loadJSON(USERS_FILE);
    users = users.filter(u => u.id !== req.params.id);
    saveJSON(USERS_FILE, users);
    res.json({ success: true, message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

if (!process.env.VERCEL) {
  app.listen(port, () => {
    console.log(`AI UX Expert backend running at http://localhost:${port}`);
  });
}

export default app;

