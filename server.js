// server.js
const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');   // ✅ to read cookies
require('dotenv').config();

const { handlePrivateBackendApi } = require('./routes/private/handlePrivateBackendApi');
const { handlePublicBackendApi } = require('./routes/public/api');
const { handlePublicFrontEndView } = require('./routes/public/view');
const { handlePrivateFrontEndView } = require('./routes/private/view');
const { authMiddleware } = require('./middleware/auth');
const db = require('./connectors/db');

const app = express();
const PORT = process.env.PORT || 3001;

// =========================================
// VIEW ENGINE + STATIC FILES
// =========================================
app.set('views', './views');
app.set('view engine', 'hjs');
app.use(express.static('./public'));

// =========================================
// MIDDLEWARE
// =========================================
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());   // ✅ Express will parse "Cookie: session_token=...."

// Optional: debug every request's cookies
app.use((req, res, next) => {
  console.log('🔍 Incoming cookie header:', req.headers.cookie);
  console.log('🍪 Parsed cookies:', req.cookies);
  next();
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
// START SERVER
// =========================================
app.listen(PORT, () => {
  console.log(`Server is now listening at port ${PORT} on http://localhost:${PORT}/`);
});
