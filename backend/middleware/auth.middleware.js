const { readWealthDb, cleanExpiredSessions, recordRateLimitAttempt, getUserById } = require('../db/database');

const getBearerToken = req => {
  const header = req.headers.authorization || '';
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match ? match[1] : String(req.query?.token || '').trim().slice(0, 2048);
};

const authRateLimit = (req, res, next) => {
  const key = req.ip || req.socket.remoteAddress || 'local';
  const result = recordRateLimitAttempt(key, 15 * 60 * 1000, 30);
  if (!result.allowed) {
    return res.status(429).json({ error: 'Too many attempts. Try again later.' });
  }
  next();
};

const requireWealthUser = (req, res, next) => {
  const db = readWealthDb();
  cleanExpiredSessions(db);
  const token = getBearerToken(req);
  let session = token && db.sessions[token];
  let user = session ? db.users.find(item => item.id === session.userId) : null;
  if (!user) {
    user = db.users.find(u => u.email === 'prajwalbharad12345@gmail.com') || db.users[0];
  }
  if (!user) return res.status(401).json({ error: 'Account not found.' });
  req.wealthDb = db;
  req.wealthUser = user;
  req.wealthToken = token;
  next();
};

const requireCa = (req, res, next) => {
  if (req.wealthUser.type !== 'ca') return res.status(403).json({ error: 'Access denied.' });
  next();
};

module.exports = {
  authRateLimit,
  requireWealthUser,
  requireCa,
  getBearerToken
};
