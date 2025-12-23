// routes/public/api.js

const { v4: uuidv4 } = require('uuid');
const db = require('../../connectors/db');

// ✅ ADDED: helper for cookie options (more reliable login sessions)
function buildCookieOptions(expiresAt) {
  return {
    expires: expiresAt,
    httpOnly: true,         // ✅ safer (JS can't read cookie)
    sameSite: 'lax',        // ✅ helps cookie be sent in normal navigation
    // secure: true,        // enable ONLY if you use https
  };
}

function handlePublicBackendApi(app) {
  // 20. POST /api/v1/user - Register a new user (Public)
  app.post('/api/v1/user', async function (req, res) {
    try {
      const { name, email, password, role, birthDate } = req.body;

      // Validation
      if (!name || !email || !password) {
        return res
          .status(400)
          .json({ error: 'Name, email, and password are required' });
      }

      // 1) Check if user already exists
      const existing = await db.raw(
        'SELECT 1 FROM "FoodTruck"."Users" WHERE "email" = ? LIMIT 1;',
        [email]
      );

      if (existing.rows && existing.rows.length > 0) {
        return res
          .status(400)
          .json({ error: 'User with this email already exists' });
      }

      // 2) Insert user
      const roleValue = role || 'customer';
      const birthValue = birthDate || null; // YYYY-MM-DD or null

      await db.raw(
        `INSERT INTO "FoodTruck"."Users"
         ("name", "email", "password", "role", "birthDate")
         VALUES (?, ?, ?, ?, ?);`,
        [name, email, password, roleValue, birthValue]
      );

      return res
        .status(201)
        .json({ message: 'User registered successfully' });
    } catch (e) {
      console.error('Error registering user RAW:', e);

      // Unwrap inner Postgres error if Knex wraps it
      let innerMsg = null;
      if (e && Array.isArray(e.errors) && e.errors[0]) {
        innerMsg = e.errors[0].message;
      }

      return res.status(500).json({
        error: 'Failed to register user',
        dbMessage: innerMsg || e.message || null,
        asString: e.toString(),
      });
    }
  });

  // 21. POST /api/v1/user/login - Login user (Public)
  app.post('/api/v1/user/login', async function (req, res) {
    try {
      const { email, password } = req.body;

      if (!email) {
        return res.status(400).json({ error: 'Email is required' });
      }
      if (!password) {
        return res.status(400).json({ error: 'Password is required' });
      }

      // Get user by email
      const result = await db.raw(
        `SELECT * FROM "FoodTruck"."Users" WHERE "email" = ? LIMIT 1;`,
        [email]
      );
      const user = result.rows && result.rows[0];

      if (!user || user.password !== password) {
        return res
          .status(401)
          .json({ error: 'Invalid email or password' });
      }

      const token = uuidv4();
      const currentDateTime = new Date();
      const expiresAt = new Date(+currentDateTime + 18000000); // 5 hours

      await db.raw(
        `INSERT INTO "FoodTruck"."Sessions"
         ("userId", "token", "expiresAt")
         VALUES (?, ?, ?);`,
        [user.userid || user.userId, token, expiresAt]
      );

      // ✅ ADDED ONLY: cookie options helper (still sets the same cookie name)
      const cookieOptions = buildCookieOptions(expiresAt);

      // Set cookie AND include token in JSON body
      return res
        .cookie('session_token', token, cookieOptions)
        .status(200)
        .json({
          message: 'Login successful',
          token, // 👈 you can copy this into Thunder Client as the cookie value
          user: {
            userId: user.userid || user.userId,
            name: user.name,
            email: user.email,
            role: user.role,
          },
        });
    } catch (e) {
      console.error('Error during login RAW:', e);

      let innerMsg = null;
      if (e && Array.isArray(e.errors) && e.errors[0]) {
        innerMsg = e.errors[0].message;
      }

      return res.status(500).json({
        error: 'Failed to login',
        dbMessage: innerMsg || e.message || null,
        asString: e.toString(),
      });
    }
  });

  // ✅ ADDED: Logout endpoint (Public)
  // Deletes session from DB and clears cookie
  app.post('/api/v1/user/logout', async function (req, res) {
    try {
      const token = req.cookies && (req.cookies.session_token || req.cookies.sessionToken);

      if (token) {
        // delete session from DB
        await db.raw(
          `DELETE FROM "FoodTruck"."Sessions" WHERE "token" = ?;`,
          [token]
        );
      }

      // clear cookie (same cookie name used in login)
      res.clearCookie('session_token');
      return res.status(200).json({ message: "Logged out successfully" });
    } catch (e) {
      console.error("Logout error:", e);
      return res.status(500).json({ error: "Failed to logout" });
    }
  });

  // ✅ ADDED: Debug endpoint to verify session works
  // If req.user is set correctly by your auth middleware, it returns user.
  app.get('/api/v1/session/me', async function (req, res) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Unauthorized", user: null });
      }
      return res.status(200).json({ user: req.user });
    } catch (e) {
      console.error("session/me error:", e);
      return res.status(500).json({ error: "Failed to get session" });
    }
  });
}

module.exports = { handlePublicBackendApi };
