const publicUser = user => ({
  id: user.id,
  name: user.name,
  email: user.email,
  createdAt: user.createdAt
});

const hashPassword = (password, salt = crypto.randomBytes(16).toString('hex')) => {
  const hash = crypto.scryptSync(String(password), salt, 64).toString('hex');
  return { salt, hash };
};

const verifyPassword = (password, user) => {
  const attempt = hashPassword(password, user.salt).hash;
  return crypto.timingSafeEqual(Buffer.from(attempt, 'hex'), Buffer.from(user.passwordHash, 'hex'));
};

const getBearerToken = req => {
  const header = req.headers.authorization || '';
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match ? match[1] : String(req.query?.token || '').trim().slice(0, 160);
};

const authRateLimit = (req, res, next) => {
  const key = req.ip || req.socket.remoteAddress || 'local';
  const now = Date.now();
  const recent = (authAttempts.get(key) || []).filter(time => now - time < 15 * 60 * 1000);
  recent.push(now);
  authAttempts.set(key, recent);
  if (recent.length > 30) return res.status(429).json({ error: 'Too many attempts. Try again later.' });
  next();
};

const requireWealthUser = (req, res, next) => {
  const db = readWealthDb();
  cleanExpiredSessions(db);
  const token = getBearerToken(req);
  const session = token && db.sessions[token];
  if (!session) return res.status(401).json({ error: 'Please log in again.' });
  const user = db.users.find(item => item.id === session.userId);
  if (!user) return res.status(401).json({ error: 'Account not found.' });
  req.wealthDb = db;
  req.wealthUser = user;
  req.wealthToken = token;
  next();
};
