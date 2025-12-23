// server.js
const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');   // ✅ to read cookies
require('dotenv').config();

const path = require('path'); // ✅ ADDED
const { handlePrivateBackendApi } = require('./routes/private/handlePrivateBackendApi');
const { handlePublicBackendApi } = require('./routes/public/api');
const { handlePublicFrontEndView } = require('./routes/public/view');
const { handlePrivateFrontEndView } = require('./routes/private/view');
const { authMiddleware } = require('./middleware/auth');
const db = require('./connectors/db');

const app = express();
const PORT = process.env.PORT || 3001;

// ✅ ADDED: trust proxy (helps cookies/sessions if you run behind proxy)
app.set('trust proxy', 1);

// =========================================
// VIEW ENGINE + STATIC FILES
// =========================================
app.set('views', './views');
app.set('view engine', 'hjs');

// ✅ UPDATED (keep your original but improved):
// app.use(express.static('./public'));
app.use(express.static(path.join(__dirname, 'public'), {
  // ✅ ADDED: control cache in dev
  etag: true,
  maxAge: 0,
  setHeaders: (res, filePath) => {
    // No aggressive caching during development
    res.setHeader('Cache-Control', 'no-store');

    // ✅ ADDED: basic content security for static files
    // (very light, won't break your app)
    res.setHeader('X-Content-Type-Options', 'nosniff');
  }
}));

// =========================================
// MIDDLEWARE
// =========================================

// ✅ UPDATED: allow bigger JSON payloads safely
app.use(bodyParser.json({ limit: '2mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '2mb' }));

app.use(cookieParser());   // ✅ Express will parse "Cookie: session_token=...."

// ✅ ADDED: basic security headers (no breaking)
app.use((req, res, next) => {
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// ✅ Optional: debug every request's cookies
app.use((req, res, next) => {
  console.log('🔍 Incoming cookie header:', req.headers.cookie);
  console.log('🍪 Parsed cookies:', req.cookies);
  next();
});

// ✅ ADDED: request log (short)
app.use((req, res, next) => {
  console.log(`➡️ ${req.method} ${req.originalUrl}`);
  next();
});

// =========================================
// HEALTH CHECK (useful for grading / demo)
// =========================================
app.get('/health', (req, res) => {
  return res.json({ ok: true, status: 'UP', port: PORT });
});

// =========================================
// DEBUG ROUTE (DB TEST)
// =========================================
app.get('/debug/users', async (req, res) => {
  try {
    const result = await db.raw('SELECT * FROM "FoodTruck"."Users" LIMIT 5;');
    return res.json({ ok: true, rows: result.rows || result });
  } catch (e) {
    console.error('DEBUG /debug/users error:', e);
    return res.status(500).json({
      ok: false,
      message: e.message,
      asString: e.toString(),
    });
  }
});

// =========================================
// PUBLIC ENDPOINTS (NO AUTH)
// =========================================
handlePublicFrontEndView(app);
handlePublicBackendApi(app);

// =========================================
// PROTECTED ENDPOINTS (AUTH REQUIRED)
// =========================================
app.use(authMiddleware);          // ✅ everything after this needs a valid session

// ✅ IMPORTANT: private *API* routes FIRST
handlePrivateBackendApi(app);

// ✅ Then private FRONTEND views (they may use catch-all '*' routes)
handlePrivateFrontEndView(app);

// =========================================
// ✅ ADDED: 404 HANDLER (professional)
// =========================================
app.use((req, res) => {
  // Try to serve 404 page if you have it
  // If you have public/images/404.jpg, you can create views/404.hjs later.
  return res.status(404).send('404 - Not Found');
});

// =========================================
// ✅ ADDED: ERROR HANDLER (professional)
// =========================================
app.use((err, req, res, next) => {
  console.error('🔥 Unhandled error:', err);
  return res.status(500).json({
    error: 'Internal server error',
    message: err && err.message ? err.message : 'Unknown error'
  });
});

// =========================================
// START SERVER
// =========================================
app.listen(PORT, () => {
  console.log(`Server is now listening at port ${PORT} on http://localhost:${PORT}/`);
});
