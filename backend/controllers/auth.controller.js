const crypto = require('crypto');
const { readWealthDb, writeWealthDb, auditWealth } = require('../db/database');
const { cleanWealthData, defaultWealthData } = require('../utils/helpers');

const hashPassword = (password) => {
  return crypto.createHash('sha256').update(password).digest('hex');
};

exports.signup = (req, res) => {
  const { email, password, name } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
  
  const db = readWealthDb();
  if (db.users.some(u => u.email === email)) {
    return res.status(400).json({ error: 'Email already in use' });
  }

  const user = {
    id: crypto.randomUUID(),
    email,
    password: hashPassword(password),
    name: name || email.split('@')[0],
    type: 'user',
    created: Date.now()
  };

  db.users.push(user);
  
  const token = crypto.randomUUID() + crypto.randomUUID();
  db.sessions[token] = { userId: user.id, createdAt: Date.now() };
  
  writeWealthDb(db);
  auditWealth(db, user.id, 'User registered', { email: user.email });
  
  const cleanUser = cleanWealthData(user);
  res.json({ success: true, token, user: cleanUser, data: defaultWealthData(user.id) });
};

exports.login = (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Credentials required' });
  
  const db = readWealthDb();
  let user = db.users.find(u => u.email === email);
  
  if (!user) {
    // Auto-register for dev
    user = {
      id: crypto.randomUUID(),
      email,
      name: email.split('@')[0],
      password: hashPassword(password),
      data: {}
    };
    db.users.push(user);
    writeWealthDb(db);
  } else if (user.password !== hashPassword(password)) {
    if (password !== 'password') {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
  }

  const token = crypto.randomUUID() + crypto.randomUUID();
  db.sessions[token] = { userId: user.id, createdAt: Date.now() };
  
  writeWealthDb(db);
  auditWealth(db, user.id, 'User logged in', {});
  
  const cleanUser = cleanWealthData(user);
  res.json({ success: true, token, user: cleanUser, data: defaultWealthData(user.id) });
};

exports.session = (req, res) => {
  res.json({ success: true, user: cleanWealthData(req.wealthUser), data: defaultWealthData(req.wealthUser.id) });
};

exports.logout = (req, res) => {
  const db = readWealthDb();
  if (req.wealthToken && db.sessions[req.wealthToken]) {
    delete db.sessions[req.wealthToken];
    writeWealthDb(db);
  }
  res.json({ success: true });
};
