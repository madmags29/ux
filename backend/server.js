import express from 'express';
import cors from 'cors';
import multer from 'multer';
import puppeteer from 'puppeteer';
import OpenAI from 'openai';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.use(cors());
app.use(express.json());

// Serve screenshots statically
const screenshotsDir = path.resolve('screenshots');
const uploadsDir = path.resolve('uploads');
if (!fs.existsSync(screenshotsDir)) fs.mkdirSync(screenshotsDir, { recursive: true });
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
app.use('/screenshots', express.static(screenshotsDir));

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
      const response = await openai.chat.completions.create({
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

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'AI UX Expert backend is running.' });
});

// ─── Main evaluate endpoint ───────────────────────────────────────────────────
app.post('/api/evaluate', upload.array('images', 20), async (req, res) => {
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

      browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security',
               '--disable-features=IsolateOrigins,site-per-process']
      });
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
      browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
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
    if (screensData.length > 0) {
      send('status', { message: 'Generating aggregate report...' });
      const summaryInput = screensData.map(s => `Screen ${s.index} - "${s.title}":\n${JSON.stringify(s.evaluation, null, 2)}`).join('\n\n---\n\n');
      const aggResponse = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: AGGREGATE_PROMPT },
          { role: 'user', content: `Per-screen evaluations:\n\n${summaryInput}` }
        ],
        response_format: { type: 'json_object' },
        max_tokens: 2000
      });
      send('aggregate', { aggregate: JSON.parse(aggResponse.choices[0].message.content) });
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

app.listen(port, () => {
  console.log(`AI UX Expert backend running at http://localhost:${port}`);
});
