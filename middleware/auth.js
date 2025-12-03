// middleware/auth.js
const db = require('../connectors/db');
const { getSessionToken } = require('../utils/session');

async function authMiddleware(req, res, next) {
  try {
    const sessionToken = getSessionToken(req);

    if (!sessionToken) {
      console.log('session token is null');
      return res.status(301).redirect('/');  // or res.status(401).json(...)
    }

    // 1) Find the session row
    const userSession = await db('Sessions')
      .withSchema('FoodTruck')
      .where('token', sessionToken)
      .first();

    if (!userSession) {
      console.log('user session token is not found you need to login');
      return res.status(301).redirect('/');
    }

    // 2) Check expiry
    if (new Date() > userSession.expiresAt) {
      console.log('expired session you need to login again');
      return res.status(301).redirect('/');
    }

    // 3) Load the user for this session
    const user = await db('Users')
      .withSchema('FoodTruck')
      .where('userId', userSession.userId || userSession.userid)
      .first();

    if (!user) {
      console.log('no user found for this session');
      return res.status(401).json({ error: 'User not found for this session' });
    }

    // 4) Attach user to request so controllers can use it
    req.user = {
      userId: user.userId || user.userid,
      name:   user.name,
      email:  user.email,
      role:   user.role,
    };

    // 5) All good – continue to the private route
    next();
  } catch (err) {
    console.error('authMiddleware error:', err);
    return res.status(500).json({ error: 'Internal auth error' });
  }
}

module.exports = { authMiddleware };
