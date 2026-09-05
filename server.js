require('dotenv').config();
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const os = require('os');
const crypto = require('crypto');
const { spawn } = require('child_process');
const sharp = require('sharp');
const XLSX = require('xlsx');
const JSZip = require('jszip');
const { createWorker, PSM } = require('tesseract.js');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { generateSecret: otpGenerateSecret, generateURI: otpGenerateURI, verifySync: otpVerifySync, TOTP, NobleCryptoPlugin, ScureBase32Plugin } = require('otplib');

// Configure TOTP with crypto plugin for code generation
const totpInstance = new TOTP({
  createHMAC: NobleCryptoPlugin.createHMAC,
  encoding: ScureBase32Plugin,
});
const QRCode = require('qrcode');


const app = express();
const upload = multer({ dest: path.join(__dirname, 'tmp', 'uploads') });
const PORT = process.env.PORT || 3001;
const appDataDir = path.join(__dirname, 'tmp', 'wealth-os');
const wealthDbPath = path.join(appDataDir, 'wealth-os-db.json');
const wealthDbKeyPath = path.join(appDataDir, 'wealth-os-db.key');
const wealthFilesDir = path.join(appDataDir, 'files');
const sessionMaxAgeMs = 1000 * 60 * 60 * 24 * 14;
let financeNewsCache = { fetchedAt: 0, items: [] };
let financeNewsRefreshIndex = 0;
let marketEventsCache = { fetchedAt: 0, items: [] };
let watchValuationCache = new Map();
const popplerDir = path.join(
  process.env.USERPROFILE || os.homedir(),
  '.cache',
  'codex-runtimes',
  'codex-primary-runtime',
  'dependencies',
  'native',
  'poppler',
  'Library',
  'bin'
);
const pdftoppm = process.env.PDFTOPPM || path.join(popplerDir, 'pdftoppm.exe');

app.use(express.json({ limit: '20mb' }));
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});
app.use(express.static(__dirname));

const taxIntegrationRoutes = require('./backend/routes/taxIntegration.routes');
const profileRoutes = require('./backend/routes/profile.routes');
const consentsRoutes = require('./backend/routes/consents.routes');
const calcRoutes = require('./backend/routes/calculator.routes');
const expensesRoutes = require('./backend/routes/expenses.routes');
const { parsePayslipText } = require('./backend/utils/payslipParser');
const { classifyAndExtractDocument } = require('./backend/utils/documentParser');

app.use('/api/wealth/tax-integration', taxIntegrationRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/consents', consentsRoutes);
app.use('/api/wealth/tax-calculator', calcRoutes);
app.use('/api/wealth/cashflow', expensesRoutes);

app.post('/api/wealth/income/parse-payslip', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    const filePath = req.file.path;
    let rawText = '';

    if (/\.pdf$/i.test(req.file.originalname)) {
      const pdfParse = require('pdf-parse');
      const dataBuffer = fs.readFileSync(filePath);
      const pdfData = await pdfParse(dataBuffer);
      rawText = pdfData.text;
    } else {
      const processedBuffer = await sharp(filePath)
        .resize({ width: 2400, withoutEnlargement: true })
        .grayscale()
        .normalize()
        .sharpen()
        .png()
        .toBuffer();

      const worker = await createWorker('eng');
      const ret = await worker.recognize(processedBuffer);
      await worker.terminate();
      rawText = ret.data.text;
    }

    fs.unlink(filePath, () => {});

    const parsed = parsePayslipText(rawText);
    res.json({ success: true, parsed, rawText });
  } catch (err) {
    console.error('Payslip parse error:', err);
    if (req.file?.path) fs.unlink(req.file.path, () => {});
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/wealth/documents/ai-scan', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    const filePath = req.file.path;
    let rawText = '';

    if (/\.pdf$/i.test(req.file.originalname)) {
      const pdfParse = require('pdf-parse');
      const dataBuffer = fs.readFileSync(filePath);
      const pdfData = await pdfParse(dataBuffer);
      rawText = pdfData.text;
    } else {
      const processedBuffer = await sharp(filePath)
        .resize({ width: 2400, withoutEnlargement: true })
        .grayscale()
        .normalize()
        .sharpen()
        .png()
        .toBuffer();

      const worker = await createWorker('eng');
      const ret = await worker.recognize(processedBuffer);
      await worker.terminate();
      rawText = ret.data.text;
    }

    // Save to encrypted vault
    let fileMeta = null;
    const token = getBearerToken(req);
    const db = readWealthDb();
    const session = token && db.sessions[token];
    const userId = session?.userId || (db.users && db.users.length > 0 ? db.users[0].id : null);
    if (userId) {
      const fileBuffer = fs.readFileSync(filePath);
      const stored = vaultService.storeVaultFile(
        userId,
        fileBuffer,
        req.file.originalname || 'scanned_document.jpg',
        req.file.mimetype || 'image/jpeg'
      );
      fileMeta = {
        id: stored.fileId,
        name: shortText(stored.originalName, 160),
        size: stored.size,
        mimeType: stored.mimeType,
        checksum: stored.checksum,
        url: `/api/wealth/files/${stored.fileId}`
      };
    }

    fs.unlink(filePath, () => {});

    const parsed = classifyAndExtractDocument(rawText, req.file.originalname);
    res.json({ success: true, parsed, file: fileMeta, rawTextLength: rawText.length });
  } catch (err) {
    console.error('Document scan error:', err);
    if (req.file?.path) fs.unlink(req.file.path, () => {});
    res.status(500).json({ success: false, error: err.message });
  }
});

const mkdir = dir => fs.mkdirSync(dir, { recursive: true });
const removeDir = dir => fs.rmSync(dir, { recursive: true, force: true });
mkdir(appDataDir);
mkdir(wealthFilesDir);

const {
  readWealthDb,
  writeWealthDb,
  cleanExpiredSessions,
  auditWealth,
  defaultWealthData,
  saveUserData,
  resetUserData,
  recordRateLimitAttempt,
  getDb,
  withTransaction
} = require('./backend/db/database');
const { runMigration } = require('./backend/db/migrate');
const vaultService = require('./backend/services/vault.service');

// Auto-run SQLite migration if not already migrated
try {
  runMigration();
} catch (migErr) {
  console.error('[Startup] Migration check error:', migErr);
}

const publicUser = user => ({
  id: user.id,
  name: user.name,
  email: user.email,
  createdAt: user.createdAt
});

// ============================================================================
// JWT Configuration
// ============================================================================
const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || crypto.randomBytes(48).toString('hex');
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || crypto.randomBytes(48).toString('hex');
const JWT_ACCESS_EXPIRY = process.env.JWT_ACCESS_EXPIRY || '15m';
const JWT_REFRESH_EXPIRY = process.env.JWT_REFRESH_EXPIRY || '7d';
const BCRYPT_ROUNDS = 12;

if (!process.env.JWT_ACCESS_SECRET) {
  console.warn('[Security] JWT_ACCESS_SECRET not set in .env — using ephemeral key (sessions will not survive restarts)');
}

// ============================================================================
// Password Hashing — bcrypt (12 rounds) with scrypt backward compatibility
// ============================================================================
const hashPasswordBcrypt = async (password) => {
  const hash = await bcrypt.hash(String(password), BCRYPT_ROUNDS);
  return { hash, algorithm: 'bcrypt' };
};

// Legacy scrypt hasher — only for verifying old passwords during migration
const hashPasswordScrypt = (password, salt) => {
  const hash = crypto.scryptSync(String(password), salt, 64).toString('hex');
  return { salt, hash };
};

const verifyPassword = async (password, user) => {
  const storedHash = user.passwordHash || user.password;
  if (!storedHash) return false;

  // Detect bcrypt hash (starts with $2b$ or $2a$)
  if (storedHash.startsWith('$2b$') || storedHash.startsWith('$2a$')) {
    return bcrypt.compare(String(password), storedHash);
  }

  // Legacy scrypt fallback — verify with timing-safe comparison
  if (user.salt) {
    try {
      const attempt = hashPasswordScrypt(password, user.salt).hash;
      return crypto.timingSafeEqual(Buffer.from(attempt, 'hex'), Buffer.from(storedHash, 'hex'));
    } catch {
      return false;
    }
  }

  return false;
};

// Auto-upgrade legacy scrypt passwords to bcrypt on successful login
const upgradePasswordIfNeeded = async (password, user) => {
  const storedHash = user.passwordHash || user.password;
  if (storedHash && !storedHash.startsWith('$2b$') && !storedHash.startsWith('$2a$')) {
    const { hash } = await hashPasswordBcrypt(password);
    const db = getDb();
    db.prepare('UPDATE users SET password_hash = ?, salt = NULL, updated_at = ? WHERE id = ?')
      .run(hash, new Date().toISOString(), user.id);
    console.log(`[Security] Upgraded password hash to bcrypt for user ${user.id}`);
  }
};

// ============================================================================
// JWT Token Generation & Verification
// ============================================================================
const generateTokenPair = (userId) => {
  const accessToken = jwt.sign({ sub: userId, type: 'access' }, JWT_ACCESS_SECRET, { expiresIn: JWT_ACCESS_EXPIRY });
  const refreshToken = jwt.sign({ sub: userId, type: 'refresh', jti: crypto.randomUUID() }, JWT_REFRESH_SECRET, { expiresIn: JWT_REFRESH_EXPIRY });

  // Store refresh token in SQLite sessions table
  const db = getDb();
  const now = new Date().toISOString();
  const decoded = jwt.decode(refreshToken);
  const expiresAt = new Date(decoded.exp * 1000).toISOString();
  db.prepare('INSERT OR REPLACE INTO user_sessions (token, user_id, refresh_token, expires_at, created_at, last_active_at) VALUES (?, ?, ?, ?, ?, ?)')
    .run(refreshToken, userId, refreshToken, expiresAt, now, now);

  return { accessToken, refreshToken };
};

const getBearerToken = req => {
  const header = req.headers.authorization || '';
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match ? match[1] : String(req.query?.token || '').trim().slice(0, 2048);
};

// ============================================================================
// Rate Limiting — persistent SQLite-backed (survives restarts)
// ============================================================================
const authRateLimit = (req, res, next) => {
  const key = req.ip || req.socket.remoteAddress || 'local';
  const windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000;
  const maxAttempts = parseInt(process.env.RATE_LIMIT_MAX_ATTEMPTS) || 30;
  const result = recordRateLimitAttempt(key, windowMs, maxAttempts);
  if (!result.allowed) {
    return res.status(429).json({
      error: 'Too many attempts. Try again later.',
      retryAfter: result.retryAfter || Math.ceil(windowMs / 1000)
    });
  }
  next();
};

// ============================================================================
// Auth Middleware — JWT verification with legacy session fallback
// ============================================================================
const requireWealthUser = (req, res, next) => {
  const token = getBearerToken(req);
  if (!token) return res.status(401).json({ error: 'Please log in again.' });

  // Try JWT verification first
  try {
    const decoded = jwt.verify(token, JWT_ACCESS_SECRET);
    if (decoded.type !== 'access') throw new Error('Invalid token type');
    const db = readWealthDb();
    const user = db.users.find(item => item.id === decoded.sub);
    if (!user) return res.status(401).json({ error: 'Account not found.' });
    req.wealthDb = db;
    req.wealthUser = user;
    req.wealthToken = token;
    return next();
  } catch {
    // Fall through to legacy session check
  }

  // Legacy session token fallback (for backward compatibility during migration)
  const db = readWealthDb();
  cleanExpiredSessions(db);
  const session = db.sessions[token];
  if (!session) return res.status(401).json({ error: 'Please log in again.' });
  const user = db.users.find(item => item.id === session.userId);
  if (!user) return res.status(401).json({ error: 'Account not found.' });
  req.wealthDb = db;
  req.wealthUser = user;
  req.wealthToken = token;
  next();
};

const shortText = (value, max = 160) => String(value || '').replace(/[<>]/g, '').trim().slice(0, max);
const cleanNumber = value => Math.max(0, Number(value) || 0);
const cleanDate = value => /^\d{4}-\d{2}-\d{2}$/.test(String(value || '')) ? String(value) : '';
const ensureId = value => String(value || '').trim() || crypto.randomUUID();

const cleanWealthData = data => ({
  assets: (Array.isArray(data?.assets) ? data.assets : []).slice(0, 500).map(item => ({
    id: ensureId(item.id),
    name: shortText(item.name, 90) || 'Untitled asset',
    type: shortText(item.type, 60) || 'Asset',
    value: cleanNumber(item.value),
    purchasePrice: cleanNumber(item.purchasePrice),
    acquisitionDate: cleanDate(item.acquisitionDate),
    owner: shortText(item.owner, 80),
    location: shortText(item.location, 120),
    ticker: shortText(item.ticker, 30).toUpperCase(),
    assetSubType: shortText(item.assetSubType, 50),
    sector: shortText(item.sector, 80),
    tags: shortText(item.tags, 160),
    purchaseDate: cleanDate(item.purchaseDate),
    buyPrice: cleanNumber(item.buyPrice),
    quantity: cleanNumber(item.quantity),
    currentPrice: cleanNumber(item.currentPrice),
    currency: shortText(item.currency, 3).toUpperCase(),
    exchangeRate: cleanNumber(item.exchangeRate),
    brokerageFees: cleanNumber(item.brokerageFees),
    lotId: shortText(item.lotId, 80),
    dividendsReceived: cleanNumber(item.dividendsReceived),
    corporateActions: shortText(item.corporateActions, 240),
    taxLotMethod: shortText(item.taxLotMethod, 40),
    brand: shortText(item.brand, 80),
    model: shortText(item.model, 80),
    referenceNumber: shortText(item.referenceNumber, 80),
    watchBoxPapers: shortText(item.watchBoxPapers, 80),
    watchMarketJson: shortText(item.watchMarketJson, 4000),
    year: cleanNumber(item.year),
    odometer: cleanNumber(item.odometer),
    registrationNumber: shortText(item.registrationNumber, 50),
    serialNumber: shortText(item.serialNumber, 80),
    area: shortText(item.area, 80),
    condition: shortText(item.condition, 40),
    hasLoan: shortText(item.hasLoan, 20),
    loanAmount: cleanNumber(item.loanAmount),
    downPayment: cleanNumber(item.downPayment),
    interestRate: cleanNumber(item.interestRate),
    loanTenureYears: cleanNumber(item.loanTenureYears),
    loanStartDate: cleanDate(item.loanStartDate),
    emiAmount: cleanNumber(item.emiAmount),
    loanType: shortText(item.loanType, 40),
    source: shortText(item.source, 80) || 'Manual',
    valuationBasis: shortText(item.valuationBasis, 520),
    estimatedValueDate: cleanDate(item.estimatedValueDate),
    valuationLow: cleanNumber(item.valuationLow),
    valuationHigh: cleanNumber(item.valuationHigh),
    valuationConfidence: shortText(item.valuationConfidence, 40),
    lastUpdated: cleanDate(item.lastUpdated) || new Date().toISOString().slice(0, 10),
    note: shortText(item.note, 240),
    renewal: cleanDate(item.renewal),
    photoId: shortText(item.photoId, 80),
    photoName: shortText(item.photoName, 160),
    photoUrl: shortText(item.photoUrl, 220),
    valueHistory: (Array.isArray(item.valueHistory) ? item.valueHistory : []).slice(-120).map(row => ({
      id: ensureId(row.id),
      value: cleanNumber(row.value),
      date: cleanDate(row.date) || new Date().toISOString().slice(0, 10),
      note: shortText(row.note, 140)
    })),
    investmentTransactions: (Array.isArray(item.investmentTransactions) ? item.investmentTransactions : []).slice(-100).map(row => ({
      id: ensureId(row.id),
      type: shortText(row.type, 30) || 'Event',
      date: cleanDate(row.date) || new Date().toISOString().slice(0, 10),
      quantity: cleanNumber(row.quantity),
      price: cleanNumber(row.price),
      proceeds: cleanNumber(row.proceeds),
      costBasis: cleanNumber(row.costBasis),
      realizedGain: Number(row.realizedGain) || 0,
      taxLotMethod: shortText(row.taxLotMethod, 40),
      allocations: (Array.isArray(row.allocations) ? row.allocations : []).slice(0, 20).map(allocation => ({
        lotId: shortText(allocation.lotId, 80),
        name: shortText(allocation.name, 120),
        quantity: cleanNumber(allocation.quantity),
        costBasis: cleanNumber(allocation.costBasis)
      })),
      ratio: shortText(row.ratio, 20),
      amount: cleanNumber(row.amount),
      note: shortText(row.note, 220)
    }))
  })),
  liabilities: (Array.isArray(data?.liabilities) ? data.liabilities : []).slice(0, 500).map(item => ({
    id: ensureId(item.id),
    name: shortText(item.name, 90) || 'Untitled liability',
    type: shortText(item.type, 60) || 'Liability',
    value: cleanNumber(item.value),
    emi: cleanNumber(item.emi),
    rate: cleanNumber(item.rate),
    lender: shortText(item.lender, 80),
    source: shortText(item.source, 80) || 'Manual',
    lastUpdated: cleanDate(item.lastUpdated) || new Date().toISOString().slice(0, 10),
    dueDate: cleanDate(item.dueDate)
  })),
  documents: (Array.isArray(data?.documents) ? data.documents : []).slice(0, 1000).map(item => ({
    id: ensureId(item.id),
    name: shortText(item.name, 120) || 'Untitled document',
    type: shortText(item.type, 80) || 'Document',
    category: shortText(item.category, 60) || 'other',
    docNumber: shortText(item.docNumber, 80),
    owner: shortText(item.owner, 80) || 'Self',
    issueDate: cleanDate(item.issueDate),
    expiry: cleanDate(item.expiry || item.renewal),
    renewal: cleanDate(item.renewal || item.expiry),
    status: shortText(item.status, 80) || 'Stored',
    linkedTo: shortText(item.linkedTo, 120),
    requiredFor: shortText(item.requiredFor, 120),
    notes: shortText(item.notes, 300),
    fileId: shortText(item.fileId, 80),
    fileName: shortText(item.fileName, 160),
    fileUrl: shortText(item.fileUrl, 220),
    isMasked: Boolean(item.isMasked)
  })),
  alerts: (Array.isArray(data?.alerts) ? data.alerts : []).slice(0, 500).map(item => ({
    id: ensureId(item.id),
    name: shortText(item.name, 100) || 'Reminder',
    date: cleanDate(item.date),
    priority: shortText(item.priority, 30) || 'Normal',
    channel: shortText(item.channel, 40) || 'In-app',
    linkedTo: shortText(item.linkedTo, 100)
  })),
  family: (Array.isArray(data?.family) ? data.family : []).slice(0, 100).map(item => ({
    id: ensureId(item.id),
    name: shortText(item.name, 90) || 'Family member',
    relation: shortText(item.relation, 60),
    access: shortText(item.access, 60) || 'View only',
    phone: shortText(item.phone, 30),
    email: shortText(item.email, 120)
  })),
  goals: (Array.isArray(data?.goals) ? data.goals : []).slice(0, 200).map(item => ({
    id: ensureId(item.id),
    name: shortText(item.name, 100) || 'Goal',
    target: cleanNumber(item.target),
    saved: cleanNumber(item.saved),
    deadline: cleanDate(item.deadline),
    priority: shortText(item.priority, 40)
  })),
  activity: (Array.isArray(data?.activity) ? data.activity : []).slice(-100).map(item => ({
    id: ensureId(item.id),
    label: shortText(item.label, 120),
    detail: shortText(item.detail, 160),
    createdAt: shortText(item.createdAt, 40) || new Date().toISOString()
  })),
  cash: {
    income: cleanNumber(data?.cash?.income),
    expenses: cleanNumber(data?.cash?.expenses)
  },
  incomeDetails: {
    basicSalary: cleanNumber(data?.incomeDetails?.basicSalary),
    hra: cleanNumber(data?.incomeDetails?.hra),
    specialAllowance: cleanNumber(data?.incomeDetails?.specialAllowance),
    bonus: cleanNumber(data?.incomeDetails?.bonus),
    otherAllowances: cleanNumber(data?.incomeDetails?.otherAllowances),
    employerPf: cleanNumber(data?.incomeDetails?.employerPf),
    professionalTax: cleanNumber(data?.incomeDetails?.professionalTax),
    otherIncome: cleanNumber(data?.incomeDetails?.otherIncome),
    bankInterest: cleanNumber(data?.incomeDetails?.bankInterest),
    dividendIncome: cleanNumber(data?.incomeDetails?.dividendIncome),
    rentalIncome: cleanNumber(data?.incomeDetails?.rentalIncome),
    rentPaid: cleanNumber(data?.incomeDetails?.rentPaid),
    isMetro: Boolean(data?.incomeDetails?.isMetro),
    stcgEquity: cleanNumber(data?.incomeDetails?.stcgEquity),
    ltcgEquity: cleanNumber(data?.incomeDetails?.ltcgEquity),
    stclBroughtForward: cleanNumber(data?.incomeDetails?.stclBroughtForward),
    ltclBroughtForward: cleanNumber(data?.incomeDetails?.ltclBroughtForward),
    freelanceIncome: cleanNumber(data?.incomeDetails?.freelanceIncome),
    municipalTaxes: cleanNumber(data?.incomeDetails?.municipalTaxes),
    tdsPaid: cleanNumber(data?.incomeDetails?.tdsPaid),
    advanceTaxPaid: cleanNumber(data?.incomeDetails?.advanceTaxPaid),
    _frequency: shortText(data?.incomeDetails?._frequency, 20),
    _sourceDocument: shortText(data?.incomeDetails?._sourceDocument, 100)
  },
  taxDeductions: {
    selectedRegime: shortText(data?.taxDeductions?.selectedRegime, 20),
    sec80C: cleanNumber(data?.taxDeductions?.sec80C),
    sec80CCD1B: cleanNumber(data?.taxDeductions?.sec80CCD1B),
    sec80D: cleanNumber(data?.taxDeductions?.sec80D),
    homeLoanInterest: cleanNumber(data?.taxDeductions?.homeLoanInterest),
    profTax: cleanNumber(data?.taxDeductions?.profTax),
    sec80TTA: cleanNumber(data?.taxDeductions?.sec80TTA),
    sec80E: cleanNumber(data?.taxDeductions?.sec80E),
    sec80EEA: cleanNumber(data?.taxDeductions?.sec80EEA),
    sec80G: cleanNumber(data?.taxDeductions?.sec80G),
    sec80GG: cleanNumber(data?.taxDeductions?.sec80GG)
  },
  incomeStreams: (Array.isArray(data?.incomeStreams) ? data.incomeStreams : []).slice(0, 500).map(item => ({
    id: ensureId(item.id),
    name: shortText(item.name, 120) || 'Income Stream',
    category: shortText(item.category, 60) || 'salary',
    amount: cleanNumber(item.amount),
    frequency: shortText(item.frequency, 30) || 'monthly',
    isPassive: Boolean(item.isPassive),
    status: shortText(item.status, 20) || 'active',
    taxType: shortText(item.taxType, 40) || 'taxable',
    startDate: cleanDate(item.startDate) || new Date().toISOString().slice(0, 10),
    notes: shortText(item.notes, 500),
    createdAt: shortText(item.createdAt, 40) || new Date().toISOString(),
    updatedAt: shortText(item.updatedAt, 40) || new Date().toISOString()
  })),
  incomeTarget: cleanNumber(data?.incomeTarget || 200000),
  expenses: Array.isArray(data?.expenses) ? data.expenses : [],
  willVault: typeof data?.willVault === 'object' && data?.willVault !== null ? data.willVault : {},
  willDraft: typeof data?.willDraft === 'object' && data?.willDraft !== null ? data.willDraft : {},
  livingWill: typeof data?.livingWill === 'object' && data?.livingWill !== null ? data.livingWill : {},
  codicil: typeof data?.codicil === 'object' && data?.codicil !== null ? data.codicil : {},
  cameras: Array.isArray(data?.cameras) ? data.cameras : [],
  cameraEvents: Array.isArray(data?.cameraEvents) ? data.cameraEvents : [],
  securitySettings: typeof data?.securitySettings === 'object' && data?.securitySettings !== null ? data.securitySettings : {},
  lastParsedPayslip: typeof data?.lastParsedPayslip === 'object' && data?.lastParsedPayslip !== null ? data.lastParsedPayslip : null
});
const normalizeText = text => String(text || '')
  .replace(/\r/g, '\n')
  .replace(/[|*~<>]/g, ' ')
  .replace(/[^\S\n]+/g, ' ')
  .replace(/\n{3,}/g, '\n\n')
  .trim();
const unique = values => [...new Set(values.map(value => String(value || '').trim()).filter(Boolean))];
const titleCase = value => String(value || '').toLowerCase().replace(/\b[a-z]/g, char => char.toUpperCase());
const smartLineClean = value => normalizeText(value)
  .replace(/^[^a-zA-Z0-9+@]+/, '')
  .replace(/\s+([,.:])/g, '$1')
  .replace(/([@.])\s+/g, '$1')
  .replace(/\s+@/g, '@')
  .replace(/\bCo[\s-]+Foundes\b/ig, 'Co Founder')
  .replace(/\bCo[\s-]+Founder\b/ig, 'Co Founder')
  .replace(/\bFoundes\b/ig, 'Founder')
  .replace(/\bPRE SALES[\s-]*TECHNICAL\b/ig, 'Pre Sales Technical')
  .replace(/\bANA CEO\b/ig, 'CEO')
  .trim();

const truthy = value => ['true', '1', 'yes', 'on'].includes(String(value || '').toLowerCase());
const DATA_URL_PREFIX = 'data:image/jpeg;base64,';

const run = (command, args, options = {}) => new Promise((resolve, reject) => {
  const child = spawn(command, args, { windowsHide: true, ...options });
  let stderr = '';
  child.stderr.on('data', data => { stderr += data.toString(); });
  child.on('error', reject);
  child.on('close', code => {
    if (code === 0) resolve();
    else reject(new Error(stderr || `${path.basename(command)} exited with ${code}`));
  });
});

const renderPdf = async (pdfPath, jobDir, options = {}) => {
  const prefix = path.join(jobDir, 'page');
  const args = ['-png', '-r', String(options.dpi || 220)];
  if (options.firstPage) args.push('-f', String(options.firstPage));
  if (options.lastPage) args.push('-l', String(options.lastPage));
  args.push(pdfPath, prefix);
  await run(pdftoppm, args);
  return fs.readdirSync(jobDir)
    .filter(name => /^page-\d+\.png$/i.test(name))
    .sort()
    .map(name => path.join(jobDir, name));
};

const previewDataUrl = async imagePath => {
  const buffer = await sharp(imagePath)
    .resize({ width: 520, withoutEnlargement: true })
    .jpeg({ quality: 78 })
    .toBuffer();
  return DATA_URL_PREFIX + buffer.toString('base64');
};

const clampCrop = (meta, crop) => ({
  left: Math.max(0, Math.min(meta.width - 1, Math.round(crop.left))),
  top: Math.max(0, Math.min(meta.height - 1, Math.round(crop.top))),
  width: Math.max(1, Math.min(meta.width - Math.round(crop.left), Math.round(crop.width))),
  height: Math.max(1, Math.min(meta.height - Math.round(crop.top), Math.round(crop.height)))
});

const makeVariants = async (imagePath, outDir, pageIndex) => {
  const meta = await sharp(imagePath).metadata();
  const crops = {
    full: { left: 0, top: 0, width: meta.width, height: meta.height },
    right: { left: meta.width * 0.36, top: 0, width: meta.width * 0.64, height: meta.height },
    contactBand: { left: meta.width * 0.39, top: meta.height * 0.32, width: meta.width * 0.59, height: meta.height * 0.42 },
    lowerBand: { left: meta.width * 0.18, top: meta.height * 0.62, width: meta.width * 0.78, height: meta.height * 0.28 },
    leftBrand: { left: 0, top: meta.height * 0.12, width: meta.width * 0.5, height: meta.height * 0.82 }
  };

  const recipes = [
    ['full_original', 'full', s => s],
    ['full_clean', 'full', s => s.grayscale().normalize().sharpen()],
    ['contact_original', 'contactBand', s => s.resize({ width: Math.round(meta.width * 0.94) }).sharpen()],
    ['lower_invert', 'lowerBand', s => s.grayscale().normalize().negate().sharpen()],
    ['left_brand', 'leftBrand', s => s.grayscale().normalize().sharpen()]
  ];

  const files = [];
  for (const [name, cropName, transform] of recipes) {
    const file = path.join(outDir, `p${pageIndex}_${name}.png`);
    await transform(sharp(imagePath).extract(clampCrop(meta, crops[cropName])))
      .png()
      .toFile(file);
    files.push({ file, name });
  }
  return files;
};

const ocrPages = async (pageFiles, jobDir, options = {}) => {
  const worker = await createWorker('eng');
  const pages = [];
  try {
    for (let pageIndex = 0; pageIndex < pageFiles.length; pageIndex += 1) {
      const variants = await makeVariants(pageFiles[pageIndex], jobDir, pageIndex + 1);
      const parts = [];
      const metrics = [];
      let confidenceTotal = 0;
      let confidenceCount = 0;

      const selectedVariants = [];
      const fullVariant = variants.find(variant => variant.name === 'full_original');
      selectedVariants.push(fullVariant);

      for (let variantIndex = 0; variantIndex < selectedVariants.length; variantIndex += 1) {
        const variant = selectedVariants[variantIndex];
        const psm = variant.name.includes('contact') || variant.name.includes('lower') ? PSM.SPARSE_TEXT : PSM.SINGLE_BLOCK;
        await worker.setParameters({
          tessedit_pageseg_mode: psm,
          preserve_interword_spaces: '1'
        });
        const result = await worker.recognize(variant.file);
        const text = normalizeText(result.data.text);
        if (text) parts.push(text);
        if (variant.name === 'full_original') {
          (result.data.lines || []).forEach(line => {
            const lineText = smartLineClean(line.text);
            if (!lineText || !line.bbox) return;
            metrics.push({
              text: lineText,
              height: Math.max(1, line.bbox.y1 - line.bbox.y0),
              width: Math.max(1, line.bbox.x1 - line.bbox.x0),
              x: line.bbox.x0,
              y: line.bbox.y0,
              confidence: Math.round(Number(line.confidence) || 0)
            });
          });
        }
        confidenceTotal += Number(result.data.confidence) || 0;
        confidenceCount += 1;

        const combined = parts.join('\n');
        const hasContact = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(combined) &&
          /(?:\+?\d[\d\s().-]{7,}\d)/.test(combined);
        if (variantIndex === 0 && (!hasContact || options.accuracyMode === 'best')) {
          ['contact_original', 'lower_invert', 'left_brand', 'full_clean']
            .map(name => variants.find(candidate => candidate.name === name))
            .filter(Boolean)
            .forEach(candidate => selectedVariants.push(candidate));
        }
      }

      const lines = unique(parts.join('\n').split('\n').map(smartLineClean));
      pages.push({
        text: lines.join('\n'),
        confidence: confidenceCount ? Math.round(confidenceTotal / confidenceCount) : 0,
        metrics
      });
    }
  } finally {
    await worker.terminate();
  }
  return pages;
};

const cleanPhone = value => {
  const digits = String(value).replace(/\D/g, '');
  if (digits.length < 8) return '';
  if (digits.length === 10) return digits;
  if (digits.length === 12 && digits.startsWith('91')) return `+${digits}`;
  if (digits.length > 10 && digits.length <= 15) return `+${digits}`;
  return digits;
};

const cleanExtractionText = text => normalizeText(text)
  .replace(/\s*@\s*/g, '@')
  .replace(/\s*\.\s*/g, '.')
  .replace(/\bco\s+founder\b/ig, 'Co Founder')
  .replace(/\bco-founder\b/ig, 'Co Founder')
  .replace(/\bfoundes\b/ig, 'Founder')
  .replace(/\btranquilai\.in\b/ig, 'tranquilai.in');

const splitCompanyFromAddress = value => smartLineClean(value).split(/\b(?:Pimple|Nilakh|Pune|Kolkata|Bengaluru|Mumbai|Delhi|Sector|Road|Street|Lane|Tower|Floor|Plot|Waters Edge)\b/i)[0].replace(/[,\s]+$/, '').trim();
const cleanDesignation = value => {
  const match = smartLineClean(value).match(/(?:pre sales technical|director\s*-?\s*business development|director|ceo|cto|cfo|co founder|founder|manager|consultant|analyst|engineer|partner|proprietor|head|lead|associate).*/i);
  return match ? match[0] : smartLineClean(value);
};

const validEmail = value => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
const validTlds = new Set(['com', 'in', 'ai', 'co', 'io', 'org', 'net', 'edu', 'tech', 'dev', 'info']);
const hasValidTld = value => {
  const clean = String(value || '').toLowerCase().replace(/[^\w.-]/g, '');
  const tld = clean.split('.').pop();
  return validTlds.has(tld);
};
const repairEmail = value => {
  let email = String(value || '').toLowerCase().replace(/[^\w.@+-]/g, '');
  email = email.replace(/tranquilaiin\b/g, 'tranquilai.in');
  email = email.replace(/gmailcom\b/g, 'gmail.com');
  email = email.replace(/outlookcom\b/g, 'outlook.com');
  email = email.replace(/yahoocom\b/g, 'yahoo.com');
  email = email.replace(/hotmailcom\b/g, 'hotmail.com');
  return email;
};
const formatPhone = value => {
  const digits = String(value || '').replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) return `+91 ${digits.slice(2, 7)} ${digits.slice(7)}`;
  if (digits.length === 10) return `${digits.slice(0, 5)} ${digits.slice(5)}`;
  if (digits.length > 10) return `+${digits}`;
  return digits;
};

const decodeXml = value => String(value || '')
  .replace(/<!\[CDATA\[(.*?)\]\]>/gs, '$1')
  .replace(/&amp;/g, '&')
  .replace(/&quot;/g, '"')
  .replace(/&#39;/g, "'")
  .replace(/&apos;/g, "'")
  .replace(/&lt;/g, '<')
  .replace(/&gt;/g, '>')
  .replace(/<[^>]+>/g, '')
  .trim();

const tagValue = (xml, tag) => {
  const match = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'));
  return match ? decodeXml(match[1]) : '';
};

const fetchFinanceNews = async (force = false) => {
  const now = Date.now();
  if (!force && now - financeNewsCache.fetchedAt < 1000 * 60 * 20 && financeNewsCache.items.length) {
    return financeNewsCache.items;
  }
  const feeds = [
    'https://news.google.com/rss/search?q=India%20finance%20OR%20RBI%20OR%20stock%20market%20OR%20mutual%20funds&hl=en-IN&gl=IN&ceid=IN:en',
    'https://news.google.com/rss/search?q=personal%20finance%20India%20tax%20insurance%20EMI&hl=en-IN&gl=IN&ceid=IN:en',
    'https://news.google.com/rss/search?q=India%20stock%20market%20Nifty%20Sensex%20rupee%20oil&hl=en-IN&gl=IN&ceid=IN:en',
    'https://news.google.com/rss/search?q=India%20income%20tax%20GST%20RBI%20home%20loan&hl=en-IN&gl=IN&ceid=IN:en'
  ];
  const rows = [];
  for (const feed of feeds) {
    try {
      const response = await fetch(feed, {
        headers: { 'User-Agent': 'WealthOS/1.0 local finance dashboard' }
      });
      if (!response.ok) continue;
      const xml = await response.text();
      const items = xml.match(/<item>[\s\S]*?<\/item>/gi) || [];
      items.slice(0, 8).forEach(item => {
        const title = tagValue(item, 'title')
          .replace(/\s+-\s+[^-]{2,80}$/g, '')
          .slice(0, 120);
        const link = tagValue(item, 'link');
        const publishedAt = tagValue(item, 'pubDate');
        const source = tagValue(item, 'source') || 'Finance news';
        if (title && link && !rows.some(row => row.title === title)) {
          rows.push({ title, link, source, publishedAt });
        }
      });
    } catch (error) {
      console.warn('Finance news feed skipped:', error.message);
    }
  }
  financeNewsCache = {
    fetchedAt: now,
    items: rows.slice(0, 24)
  };
  return financeNewsCache.items;
};

const rotateNewsItems = (items, offset) => {
  if (!items.length) return [];
  const start = offset % items.length;
  return [...items.slice(start), ...items.slice(0, start)];
};

const marketEventType = text => {
  const value = String(text || '').toLowerCase();
  if (/ipo|listing|listed|gmp|subscription|issue opens|issue closes/.test(value)) return 'IPO';
  if (/rbi|monetary policy|repo rate|mpc/.test(value)) return 'RBI';
  if (/tax|itr|gst|deadline|filing|tds/.test(value)) return 'Tax';
  if (/nifty|sensex|market|results|earnings/.test(value)) return 'Market';
  return 'Finance';
};

const localDateKey = date => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const parseMarketEventDate = text => {
  const value = String(text || '');
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (/\btoday\b/i.test(value)) return localDateKey(today);
  if (/\btomorrow\b/i.test(value)) {
    const date = new Date(today);
    date.setDate(date.getDate() + 1);
    return localDateKey(date);
  }
  const match = value.match(/\b(?:on\s+)?(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\.?\s+(\d{1,2})(?:,?\s*(20\d{2}))?/i) ||
    value.match(/\b(\d{1,2})\s+(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)(?:,?\s*(20\d{2}))?/i);
  if (!match) return '';
  const monthText = Number.isNaN(Number(match[1])) ? match[1] : match[2];
  const dayText = Number.isNaN(Number(match[1])) ? match[2] : match[1];
  const yearText = Number.isNaN(Number(match[1])) ? match[3] : match[3];
  const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
  const month = months.findIndex(item => monthText.toLowerCase().startsWith(item));
  if (month < 0) return '';
  let year = yearText ? Number(yearText) : today.getFullYear();
  let date = new Date(year, month, Number(dayText));
  if (!yearText && date < today) date = new Date(year + 1, month, Number(dayText));
  return Number.isNaN(date.getTime()) ? '' : localDateKey(date);
};

const fetchMarketEvents = async (force = false) => {
  const now = Date.now();
  if (!force && now - marketEventsCache.fetchedAt < 1000 * 60 * 30 && marketEventsCache.items.length) {
    return marketEventsCache.items;
  }
  const feeds = [
    'https://news.google.com/rss/search?q=India%20upcoming%20IPO%20listing%20date%20GMP&hl=en-IN&gl=IN&ceid=IN:en',
    'https://news.google.com/rss/search?q=India%20IPO%20opens%20closes%20listing%20this%20week&hl=en-IN&gl=IN&ceid=IN:en',
    'https://news.google.com/rss/search?q=RBI%20monetary%20policy%20MPC%20date%20India&hl=en-IN&gl=IN&ceid=IN:en',
    'https://news.google.com/rss/search?q=India%20tax%20GST%20ITR%20deadline%20date&hl=en-IN&gl=IN&ceid=IN:en',
    'https://news.google.com/rss/search?q=India%20stock%20market%20results%20calendar%20earnings%20date&hl=en-IN&gl=IN&ceid=IN:en'
  ];
  const rows = [];
  for (const feed of feeds) {
    try {
      const response = await fetch(feed, {
        headers: { 'User-Agent': 'WealthOS/1.0 local finance timetable' }
      });
      if (!response.ok) continue;
      const xml = await response.text();
      const items = xml.match(/<item>[\s\S]*?<\/item>/gi) || [];
      items.slice(0, 8).forEach(item => {
        const title = tagValue(item, 'title').replace(/\s+-\s+[^-]{2,80}$/g, '').slice(0, 120);
        const description = tagValue(item, 'description').slice(0, 220);
        const link = tagValue(item, 'link');
        const source = tagValue(item, 'source') || 'Market calendar';
        const publishedAt = tagValue(item, 'pubDate');
        const date = parseMarketEventDate(`${title} ${description}`);
        const type = marketEventType(`${title} ${description}`);
        if (title && link && !rows.some(row => row.title === title)) {
          rows.push({ title, link, source, type, date, publishedAt });
        }
      });
    } catch (error) {
      console.warn('Market events feed skipped:', error.message);
    }
  }
  marketEventsCache = {
    fetchedAt: now,
    items: rows
      .filter(item => !item.date || item.date >= localDateKey(new Date()))
      .sort((a, b) => (a.date || '9999-99-99').localeCompare(b.date || '9999-99-99'))
      .slice(0, 18)
  };
  return marketEventsCache.items;
};

const moneyToInr = (amount, currency) => {
  const rates = { INR: 1, USD: 84, EUR: 91, GBP: 106, CHF: 94, AUD: 55 };
  return Math.round((Number(amount) || 0) * (rates[currency] || 1));
};

const parseMarketPrices = text => {
  const value = String(text || '');
  const prices = [];
  const patterns = [
    { currency: 'INR', regex: /(?:₹|INR|Rs\.?)\s*([0-9][0-9,]*(?:\.\d+)?)(\s*(?:lakh|lac|l|cr|crore))?/gi },
    { currency: 'USD', regex: /(?:US\$|\$|USD)\s*([0-9][0-9,]*(?:\.\d+)?)(\s*(?:k|m))?/gi },
    { currency: 'EUR', regex: /(?:€|EUR)\s*([0-9][0-9,]*(?:\.\d+)?)(\s*(?:k|m))?/gi },
    { currency: 'GBP', regex: /(?:£|GBP)\s*([0-9][0-9,]*(?:\.\d+)?)(\s*(?:k|m))?/gi },
    { currency: 'CHF', regex: /(?:CHF)\s*([0-9][0-9,]*(?:\.\d+)?)(\s*(?:k|m))?/gi }
  ];
  patterns.forEach(({ currency, regex }) => {
    let match;
    while ((match = regex.exec(value))) {
      let amount = Number(String(match[1] || '').replace(/,/g, ''));
      const suffix = String(match[2] || '').toLowerCase();
      if (!amount) continue;
      if (/crore|cr/.test(suffix)) amount *= 10000000;
      if (/lakh|lac|\bl\b/.test(suffix)) amount *= 100000;
      if (/\bk\b/.test(suffix)) amount *= 1000;
      if (/\bm\b/.test(suffix)) amount *= 1000000;
      const inr = moneyToInr(amount, currency);
      if (inr >= 5000 && inr <= 500000000) prices.push(inr);
    }
  });
  return prices;
};

const median = values => {
  const rows = values.filter(Number.isFinite).sort((a, b) => a - b);
  if (!rows.length) return 0;
  const mid = Math.floor(rows.length / 2);
  return rows.length % 2 ? rows[mid] : Math.round((rows[mid - 1] + rows[mid]) / 2);
};

const watchBrandProfile = asset => {
  const text = `${asset.brand || ''} ${asset.model || ''} ${asset.name || ''}`.toLowerCase();
  const collectibleBrands = /rolex|patek|philippe|audemars|vacheron|richard mille|fp journe|lange|a\. lange/.test(text);
  const strongBrands = collectibleBrands || /omega|cartier|tudor|iwc|jaeger|jlc|breitling|panerai|grand seiko|zenith|tag heuer/.test(text);
  const hotModels = /daytona|submariner|gmt|nautilus|aquanaut|royal oak|speedmaster|seamaster|santos|tank|monaco|navitimer|pelagos|black bay/.test(text);
  if (collectibleBrands || hotModels) return { label: 'Collectible reseller watch', annual: hotModels ? 0.045 : 0.032, floor: 0.72, spread: 0.12 };
  if (strongBrands) return { label: 'Luxury pre-owned watch', annual: 0.012, floor: 0.55, spread: 0.16 };
  return { label: 'Standard resale watch', annual: -0.055, floor: 0.30, spread: 0.24 };
};

const watchConditionMultiplier = value => {
  const text = String(value || '').toLowerCase();
  if (/unworn|mint|new|excellent/.test(text)) return 1;
  if (/fair|scratches|used|polish/.test(text)) return 0.82;
  if (/poor|damaged|repair|service due/.test(text)) return 0.62;
  return 0.92;
};

const watchCompletenessMultiplier = value => {
  const text = String(value || '').toLowerCase();
  if (/full|box.*paper|paper.*box|certificate|bill/.test(text)) return 1.07;
  if (/box only|papers only|partial/.test(text)) return 0.98;
  if (/watch only|no paper|missing/.test(text)) return 0.88;
  return 1;
};

const localWatchEstimate = asset => {
  const purchasePrice = cleanNumber(asset.purchasePrice || asset.value);
  if (!purchasePrice) return 0;
  const profile = watchBrandProfile(asset);
  const purchaseDate = cleanDate(asset.acquisitionDate || asset.purchaseDate);
  const year = cleanNumber(asset.year);
  let ageYears = 1;
  if (purchaseDate) ageYears = Math.max(0, (Date.now() - new Date(`${purchaseDate}T00:00:00`).getTime()) / 31557600000);
  else if (year) ageYears = Math.max(0, new Date().getFullYear() - year);
  const value = purchasePrice *
    Math.pow(1 + profile.annual, Math.min(ageYears, 12)) *
    watchConditionMultiplier(asset.condition) *
    watchCompletenessMultiplier(asset.watchBoxPapers);
  return Math.max(Math.round(purchasePrice * profile.floor), Math.round(value));
};

const fetchWatchMarketSignals = async (asset, force = false) => {
  const query = [asset.brand, asset.model, asset.referenceNumber, asset.name]
    .filter(Boolean)
    .join(' ')
    .replace(/[^\w\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const cacheKey = query.toLowerCase();
  const cached = watchValuationCache.get(cacheKey);
  if (!force && cached && Date.now() - cached.fetchedAt < 1000 * 60 * 60 * 6) return cached.items;
  if (!query) return [];
  const feeds = [
    `https://news.google.com/rss/search?q=${encodeURIComponent(`${query} watch market price WatchCharts Chrono24 pre owned`)}&hl=en-IN&gl=IN&ceid=IN:en`,
    `https://news.google.com/rss/search?q=${encodeURIComponent(`${query} used watch price resale secondary market`)}&hl=en-IN&gl=IN&ceid=IN:en`
  ];
  const rows = [];
  for (const feed of feeds) {
    try {
      const response = await fetch(feed, { headers: { 'User-Agent': 'WealthOS/1.0 local watch valuation' } });
      if (!response.ok) continue;
      const xml = await response.text();
      const items = xml.match(/<item>[\s\S]*?<\/item>/gi) || [];
      items.slice(0, 10).forEach(item => {
        const title = tagValue(item, 'title').replace(/\s+-\s+[^-]{2,80}$/g, '').slice(0, 140);
        const description = tagValue(item, 'description').slice(0, 260);
        const link = tagValue(item, 'link');
        const source = tagValue(item, 'source') || 'Watch market';
        const prices = parseMarketPrices(`${title} ${description}`);
        if (title && link && !rows.some(row => row.title === title)) {
          rows.push({ title, link, source, prices });
        }
      });
    } catch (error) {
      console.warn('Watch market feed skipped:', error.message);
    }
  }
  watchValuationCache.set(cacheKey, { fetchedAt: Date.now(), items: rows.slice(0, 12) });
  return rows.slice(0, 12);
};

const estimateWatchMarketValue = async (asset, force = false) => {
  const signals = await fetchWatchMarketSignals(asset, force);
  const marketPrices = signals.flatMap(item => item.prices || []);
  const marketEstimate = median(marketPrices);
  const modelEstimate = localWatchEstimate(asset);
  const profile = watchBrandProfile(asset);
  const value = marketEstimate && modelEstimate
    ? Math.round((marketEstimate * 0.7) + (modelEstimate * 0.3))
    : marketEstimate || modelEstimate;
  const spread = marketEstimate ? profile.spread : Math.min(0.30, profile.spread + 0.08);
  const low = Math.round(value * (1 - spread));
  const high = Math.round(value * (1 + spread));
  const confidence = marketEstimate && marketPrices.length >= 3 ? 'High' : marketEstimate ? 'Medium' : 'Model';
  return {
    value,
    low,
    high,
    confidence,
    label: marketEstimate ? 'Live watch market estimate' : 'Collectible watch model estimate',
    basis: marketEstimate
      ? `${profile.label}: blended live market signals (${marketPrices.length} price mentions) with your purchase cost, condition and box/papers.`
      : `${profile.label}: no reliable live price signal found, so value uses brand/model collectability, age, condition and box/papers.`,
    marketEstimate,
    modelEstimate,
    signals: signals.slice(0, 5).map(item => ({
      title: shortText(item.title, 140),
      source: shortText(item.source, 80),
      link: shortText(item.link, 300),
      prices: (item.prices || []).slice(0, 4)
    })),
    updatedAt: new Date().toISOString()
  };
};

const cleanWebsite = value => String(value || '')
  .toLowerCase()
  .replace(/[^\w.:/-]/g, '')
  .replace(/^https?:\/\//, '')
  .replace(/\/$/, '');

const likelyJunk = line => /^(o|0|\u00a9|\u00ae|\W+)$/.test(line) || line.length < 2;
const importantLines = group => {
  const all = [
    ...String(group.text || '').split('\n').map(text => ({ text: smartLineClean(text), height: 0, confidence: 0 })),
    ...(group.metrics || [])
  ].filter(item => item.text && !likelyJunk(item.text));
  const byText = new Map();
  all.forEach(item => {
    const key = item.text.toLowerCase();
    const existing = byText.get(key);
    if (!existing || item.height > existing.height || item.confidence > existing.confidence) byText.set(key, item);
  });
  return [...byText.values()];
};

const extractFields = pageGroup => {
  const text = cleanExtractionText(pageGroup.text);
  const lineObjects = importantLines(pageGroup);
  const lines = unique(lineObjects.map(line => line.text));
  const emailCandidates = unique([
    ...(text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi) || []),
    ...(text.match(/[A-Z0-9._%+-]+@[A-Z0-9._-]{5,}/gi) || [])
  ]).map(repairEmail);
  const emails = unique(emailCandidates).filter(validEmail);
  const websites = unique(text.match(/(?:https?:\/\/)?(?:www\.)?[a-z0-9-]+(?:\.[a-z0-9-]+)+[^\s,;)]*/gi) || [])
    .map(cleanWebsite)
    .filter(site => hasValidTld(site) && !emails.some(email => email.includes(site)) && !site.includes('@'));
  const phones = unique((text.match(/(?:\+?\d[\d\s().-]{7,}\d)/g) || []).map(cleanPhone).map(formatPhone))
    .filter(phone => phone.replace(/\D/g, '').length >= 8);
  const companyHints = /(pvt|private|limited|ltd|llp|inc|corp|enterprise|industries|solutions|technologies|exports|overseas|group|agency|associates|services|consultants|studio|digital|labs|code|forms|innovation|secure|blink|one|ai)/i;
  const titleHints = /(founder|co founder|director|manager|executive|officer|ceo|cfo|cto|partner|proprietor|consultant|analyst|engineer|sales|marketing|business|head|lead|president|advisor|associate|technical)/i;
  const contactHints = /(phone|mobile|email|mail|www|http|tel|fax|address|road|street|lane|nagar|city|pin|india|edge|pune|kolkata|sector|tower|floor|plot|\d|@)/i;

  const ranked = [...lineObjects].sort((a, b) => (b.height - a.height) || (b.confidence - a.confidence));
  const companyRaw = ranked.find(line => companyHints.test(line.text) && !/@/.test(line.text))?.text ||
    lines.find(line => companyHints.test(line) && !/@/.test(line)) || '';
  const company = splitCompanyFromAddress(companyRaw);
  const designationRaw = lines.find(line => titleHints.test(line) && line !== companyRaw && line !== company) || '';
  const designation = cleanDesignation(designationRaw);
  const name = ranked.find(line => {
    const value = line.text;
    const clean = value.replace(/[^a-zA-Z .'-]/g, '').trim();
    const words = clean.split(/\s+/).filter(Boolean);
    return words.length >= 2 && words.length <= 4 && !contactHints.test(value) && !companyHints.test(value) && !titleHints.test(value);
  })?.text || lines.find(line => {
    const clean = line.replace(/[^a-zA-Z .'-]/g, '').trim();
    const words = clean.split(/\s+/).filter(Boolean);
    return words.length >= 2 && words.length <= 4 && !contactHints.test(line) && !companyHints.test(line) && !titleHints.test(line);
  }) || '';
  const cleanAddressLine = line => smartLineClean(line)
    .replace(/[\u00ae\u00a9()]/g, '')
    .replace(company, '')
    .replace(/\bO\b/g, '')
    .replace(/^\d\s+(?=[A-Z0-9-])/, '')
    .replace(/\.[a-z]$/i, '')
    .replace(/\s{2,}/g, ' ')
    .replace(/^[,.\s]+|[,.\s]+$/g, '');
  const addressPieces = unique(lines.filter(line => {
    if ([name, company, designation].includes(line)) return false;
    if (emails.some(email => line.includes(email))) return false;
    if (websites.some(site => line.includes(site))) return false;
    if (phones.some(phone => line.replace(/\D/g, '').includes(phone.replace(/\D/g, '')))) return false;
    return /(road|street|lane|sector|plot|floor|tower|city|nagar|complex|building|area|india|near|edge|pune|kolkata|\b\d{5,6}\b)/i.test(line);
  }).map(cleanAddressLine))
    .filter(line => line && line.length >= 4 && !companyHints.test(line))
    .sort((a, b) => {
      const score = value => (/\d/.test(value) ? 2 : 0) + (/(pune|kolkata|mumbai|delhi|bengaluru|india)/i.test(value) ? 2 : 0) + Math.min(4, value.length / 20);
      return score(b) - score(a);
    });
  const streetPiece = addressPieces.find(piece => /\d/.test(piece) || /(edge|road|street|lane|plot|floor|tower|sector)/i.test(piece));
  const cityPiece = addressPieces.find(piece => piece !== streetPiece && /(pune|kolkata|mumbai|delhi|bengaluru|india|nilakh|nagar|city)/i.test(piece));
  const address = unique([streetPiece, cityPiece, ...addressPieces].filter(Boolean)).slice(0, 3).join(', ');

  const warnings = [];
  if (!name) warnings.push('Name missing');
  if (!company) warnings.push('Company missing');
  if (!phones.length) warnings.push('Phone missing');
  if (!emails.length) warnings.push('Email missing');
  if (emails.some(email => !validEmail(email))) warnings.push('Email format issue');
  const score = Math.max(0, Math.min(100,
    pageGroup.confidence + (name ? 10 : 0) + (company ? 10 : 0) + (phones.length ? 12 : 0) +
    (emails.length ? 12 : 0) + (websites.length ? 5 : 0) + (address ? 5 : 0) - warnings.length * 6
  ));

  return {
    name: titleCase(name).replace(/\bAi\b/g, 'AI'),
    company: company.replace(/\s+/g, ' ').trim(),
    designation: titleCase(designation).replace(/\bCeo\b/g, 'CEO').replace(/\bCto\b/g, 'CTO').replace(/\bCfo\b/g, 'CFO'),
    phones: phones.join(', '),
    email: emails.join(', '),
    website: websites.join(', '),
    address,
    ocrConfidence: pageGroup.confidence,
    qualityScore: Math.round(score),
    quality: score >= 82 ? 'Good' : score >= 62 ? 'Check' : 'Review',
    warnings,
    rawText: text,
    previewImages: pageGroup.previewImages || [],
    pageNumbers: pageGroup.pageNumbers || []
  };
};

const groupPages = (pages, options = {}) => {
  if (!options.pairSides) {
    return pages.map((page, index) => ({
      text: page.text,
      confidence: page.confidence,
      metrics: page.metrics || [],
      previewImages: [page.preview].filter(Boolean),
      pageNumbers: [index + 1]
    }));
  }

  const paired = [];
  for (let index = 0; index < pages.length; index += 2) {
    const sides = [pages[index], pages[index + 1]].filter(Boolean);
    paired.push({
      text: unique(sides.flatMap(side => side.text.split('\n'))).join('\n'),
      confidence: Math.round(sides.reduce((sum, side) => sum + side.confidence, 0) / sides.length),
      metrics: sides.flatMap(side => side.metrics || []),
      previewImages: sides.map(side => side.preview).filter(Boolean),
      pageNumbers: sides.map((_, sideIndex) => index + sideIndex + 1)
    });
  }
  return paired;
};

const addDuplicateWarnings = rows => {
  const seen = new Map();
  rows.forEach((row, index) => {
    const key = [row.email.toLowerCase(), row.phones.replace(/\D/g, ''), row.name.toLowerCase()].filter(Boolean).join('|');
    row.duplicateOf = '';
    if (key && seen.has(key)) {
      row.duplicateOf = String(seen.get(key) + 1);
      row.warnings.push(`Possible duplicate of row ${seen.get(key) + 1}`);
    }
    if (key && !seen.has(key)) seen.set(key, index);
  });
  return rows;
};

const tryAiCleanup = async rows => {
  if (!process.env.OPENAI_API_KEY) return rows;
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        temperature: 0,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content: 'You clean OCR output from visiting cards. Return JSON only: {"rows":[...]} with the same number of rows. Keep only evidence from OCR text. Fix obvious OCR mistakes in names, company, designation, phone, email, website, address. Use empty string when uncertain.'
          },
          {
            role: 'user',
            content: JSON.stringify(rows.map(row => ({
              name: row.name,
              company: row.company,
              designation: row.designation,
              phones: row.phones,
              email: row.email,
              website: row.website,
              address: row.address,
              rawText: row.rawText
            })))
          }
        ]
      })
    });
    if (!response.ok) return rows;
    const payload = await response.json();
    const parsed = JSON.parse(payload.choices?.[0]?.message?.content || '{}');
    if (!Array.isArray(parsed.rows) || parsed.rows.length !== rows.length) return rows;
    return rows.map((row, index) => ({
      ...row,
      ...['name', 'company', 'designation', 'phones', 'email', 'website', 'address'].reduce((acc, field) => {
        if (typeof parsed.rows[index][field] === 'string') acc[field] = parsed.rows[index][field].trim();
        return acc;
      }, {}),
      aiCleaned: true
    }));
  } catch (error) {
    console.warn('AI cleanup skipped:', error.message);
    return rows;
  }
};

const makeWorkbookBuffer = rows => {
  const exportRows = rows.map((row, index) => ({
    'Sr No': index + 1,
    Name: row.name,
    Company: row.company,
    Designation: row.designation,
    Phones: row.phones,
    Email: row.email,
    Website: row.website,
    Address: row.address,
    Quality: row.quality,
    'Quality Score': row.qualityScore,
    'OCR Confidence': row.ocrConfidence,
    'Duplicate Of Row': row.duplicateOf || '',
    'Pages': Array.isArray(row.pageNumbers) ? row.pageNumbers.join(', ') : '',
    'AI Cleaned': row.aiCleaned ? 'Yes' : 'No',
    Warnings: row.warnings.join(', '),
    'Raw OCR Text': row.rawText
  }));
  const worksheet = XLSX.utils.json_to_sheet(exportRows);
  worksheet['!cols'] = [
    { wch: 8 }, { wch: 24 }, { wch: 28 }, { wch: 24 }, { wch: 24 },
    { wch: 30 }, { wch: 30 }, { wch: 48 }, { wch: 16 }, { wch: 14 },
    { wch: 16 }, { wch: 16 }, { wch: 10 }, { wch: 12 }, { wch: 36 }, { wch: 64 }
  ];
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Visiting Cards');
  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
};

const extractPdf = async (pdfPath, options = {}) => {
  const jobDir = path.join(__dirname, 'tmp', `ocr-${Date.now()}-${Math.random().toString(16).slice(2)}`);
  mkdir(jobDir);
  try {
    const pageFiles = await renderPdf(pdfPath, jobDir, options);
    const pages = await ocrPages(pageFiles, jobDir, options);
    for (let index = 0; index < pages.length; index += 1) {
      pages[index].preview = await previewDataUrl(pageFiles[index]);
    }
    let rows = addDuplicateWarnings(groupPages(pages, { pairSides: options.pairSides !== false }).map(extractFields));
    rows = await tryAiCleanup(rows);
    return {
      rows,
      pages: pageFiles.length,
      backend: true,
      aiAvailable: Boolean(process.env.OPENAI_API_KEY)
    };
  } finally {
    removeDir(jobDir);
  }
};

app.post('/api/extract-cards', upload.single('pdf'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'PDF file is required.' });
  try {
    res.json(await extractPdf(req.file.path, {
      pairSides: req.body.pairSides === undefined ? true : truthy(req.body.pairSides),
      accuracyMode: req.body.accuracyMode === 'fast' ? 'fast' : 'best',
      dpi: Number(req.body.dpi) || (req.body.accuracyMode === 'fast' ? 200 : 260)
    }));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message || 'Extraction failed.' });
  } finally {
    fs.rmSync(req.file.path, { force: true });
  }
});

app.post('/api/wealth/register', authRateLimit, async (req, res) => {
  try {
    const name = String(req.body.name || '').trim();
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    if (name.length < 2) return res.status(400).json({ error: 'Enter your name.' });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: 'Enter a valid email.' });
    if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters.' });

    const db = readWealthDb();
    if (db.users.some(user => user.email === email)) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    const { hash } = await hashPasswordBcrypt(password);
    const userId = crypto.randomUUID();
    const now = new Date().toISOString();
    const sqliteDb = getDb();
    sqliteDb.prepare('INSERT INTO users (id, name, email, user_type, password_hash, salt, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
      .run(userId, name, email, 'user', hash, null, now, now);

    // Initialize default user data
    const userData = defaultWealthData(name);
    const saveDb = readWealthDb();
    const newUser = saveDb.users.find(u => u.id === userId);
    if (newUser) {
      newUser.data = userData;
    }

    const tokens = generateTokenPair(userId);
    auditWealth(saveDb, userId, 'account.created', { email });

    res.status(201).json({
      token: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: { id: userId, name, email, createdAt: now },
      data: userData
    });
  } catch (err) {
    console.error('[Register Error]', err);
    res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
});

app.post('/api/wealth/login', authRateLimit, async (req, res) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    const mfaCode = String(req.body.mfaCode || '').trim();

    const db = readWealthDb();
    cleanExpiredSessions(db);
    const user = db.users.find(item => item.email === email);

    if (!user || !(await verifyPassword(password, user))) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Check MFA requirement
    const sqliteDb = getDb();
    const creds = sqliteDb.prepare('SELECT mfa_secret, mfa_enabled FROM user_credentials WHERE user_id = ?').get(user.id);
    if (creds && creds.mfa_enabled) {
      if (!mfaCode) {
        return res.status(403).json({ error: 'MFA code required.', mfaRequired: true });
      }
      const isValid = otpVerifySync(mfaCode, creds.mfa_secret);
      if (!isValid) {
        return res.status(401).json({ error: 'Invalid MFA code.' });
      }
    }

    // Auto-upgrade legacy scrypt password to bcrypt
    await upgradePasswordIfNeeded(password, user);

    const tokens = generateTokenPair(user.id);
    auditWealth(db, user.id, 'account.login', {});

    res.json({
      token: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: publicUser(user),
      data: user.data || defaultWealthData(user.name)
    });
  } catch (err) {
    console.error('[Login Error]', err);
    res.status(500).json({ error: 'Login failed. Please try again.' });
  }
});

// JWT Refresh Token Rotation
app.post('/api/wealth/refresh', async (req, res) => {
  try {
    const refreshToken = String(req.body.refreshToken || '').trim();
    if (!refreshToken) return res.status(400).json({ error: 'Refresh token required.' });

    const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
    if (decoded.type !== 'refresh') return res.status(401).json({ error: 'Invalid token type.' });

    // Verify refresh token exists in DB (not revoked)
    const sqliteDb = getDb();
    const session = sqliteDb.prepare('SELECT * FROM user_sessions WHERE token = ? AND user_id = ?').get(refreshToken, decoded.sub);
    if (!session) return res.status(401).json({ error: 'Refresh token revoked or expired.' });

    // Revoke old refresh token (rotation)
    sqliteDb.prepare('DELETE FROM user_sessions WHERE token = ?').run(refreshToken);

    // Issue new token pair
    const tokens = generateTokenPair(decoded.sub);

    res.json({
      token: tokens.accessToken,
      refreshToken: tokens.refreshToken
    });
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Refresh token expired. Please log in again.' });
    }
    res.status(401).json({ error: 'Invalid refresh token.' });
  }
});

// MFA Setup — Generate TOTP secret & QR code
app.post('/api/wealth/mfa/setup', requireWealthUser, async (req, res) => {
  try {
    const secret = otpGenerateSecret();
    const otpauth = otpGenerateURI({ secret, issuer: 'WealthOS', account: req.wealthUser.email });
    const qrCodeDataUrl = await QRCode.toDataURL(otpauth);

    // Store secret temporarily (not yet enabled until verified)
    const sqliteDb = getDb();
    sqliteDb.prepare('INSERT OR REPLACE INTO user_credentials (user_id, password_hash, mfa_secret, mfa_enabled, failed_login_attempts, updated_at) VALUES (?, ?, ?, 0, 0, ?)')
      .run(req.wealthUser.id, req.wealthUser.passwordHash || '', secret, new Date().toISOString());

    res.json({ secret, qrCode: qrCodeDataUrl });
  } catch (err) {
    console.error('[MFA Setup Error]', err);
    res.status(500).json({ error: 'MFA setup failed.' });
  }
});

// MFA Verify — Enable MFA after confirming first code
app.post('/api/wealth/mfa/verify', requireWealthUser, (req, res) => {
  const code = String(req.body.code || '').trim();
  if (!code) return res.status(400).json({ error: 'Enter the 6-digit code from your authenticator app.' });

  const sqliteDb = getDb();
  const creds = sqliteDb.prepare('SELECT mfa_secret FROM user_credentials WHERE user_id = ?').get(req.wealthUser.id);
  if (!creds || !creds.mfa_secret) return res.status(400).json({ error: 'MFA not set up. Call /mfa/setup first.' });

  const isValid = otpVerifySync(code, creds.mfa_secret);
  if (!isValid) return res.status(401).json({ error: 'Invalid code. Please try again.' });

  sqliteDb.prepare('UPDATE user_credentials SET mfa_enabled = 1, updated_at = ? WHERE user_id = ?')
    .run(new Date().toISOString(), req.wealthUser.id);

  auditWealth(readWealthDb(), req.wealthUser.id, 'mfa.enabled', {});
  res.json({ ok: true, message: 'MFA enabled successfully.' });
});

// MFA Disable
app.post('/api/wealth/mfa/disable', requireWealthUser, (req, res) => {
  const sqliteDb = getDb();
  sqliteDb.prepare('UPDATE user_credentials SET mfa_enabled = 0, mfa_secret = NULL, updated_at = ? WHERE user_id = ?')
    .run(new Date().toISOString(), req.wealthUser.id);
  auditWealth(readWealthDb(), req.wealthUser.id, 'mfa.disabled', {});
  res.json({ ok: true, message: 'MFA disabled.' });
});

app.post('/api/wealth/logout', requireWealthUser, (req, res) => {
  // Revoke all refresh tokens for this user
  const sqliteDb = getDb();
  sqliteDb.prepare('DELETE FROM user_sessions WHERE user_id = ?').run(req.wealthUser.id);
  auditWealth(readWealthDb(), req.wealthUser.id, 'account.logout', {});
  res.json({ ok: true });
});

app.get('/api/wealth/me', requireWealthUser, (req, res) => {
  res.json({ user: publicUser(req.wealthUser), data: req.wealthUser.data || defaultWealthData(req.wealthUser.name) });
});

// CA Practice Management: List all clients (for demo purposes, returns all users except self)
app.get('/api/wealth/ca/clients', requireWealthUser, (req, res) => {
  const allUsers = req.wealthDb.users.map(u => ({
    id: u.id,
    name: u.name,
    email: u.email,
    lastUpdated: u.updatedAt,
    regime: u.data?.taxDeductions?.selectedRegime || 'Not Locked',
    grossIncome: u.data?.incomeDetails?.basicSalary ? "Configured" : "Pending"
  }));
  res.json({ clients: allUsers });
});

// CA Practice Management: Impersonate Client (Fetch their data)
app.get('/api/wealth/ca/client/:id', requireWealthUser, (req, res) => {
  const targetUser = req.wealthDb.users.find(u => u.id === req.params.id);
  if (!targetUser) return res.status(404).json({ error: "Client not found." });
  res.json({ user: publicUser(targetUser), data: targetUser.data || defaultWealthData(targetUser.name) });
});

app.get('/api/wealth/export-ca', requireWealthUser, async (req, res) => {
  try {
    const targetUserId = req.query.clientId || req.wealthUser.id;
    const user = req.wealthDb.users.find(u => u.id === targetUserId);
    if (!user) return res.status(404).send("User not found");
    const data = user.data || defaultWealthData(user.name);
    const zip = new JSZip();
    
    zip.file('Tax_Profile_Summary.json', JSON.stringify(data, null, 2));
    
    const docsFolder = zip.folder('Uploaded_Documents');
    const uploadDir = path.join(__dirname, '.user_uploaded');
    
    (data.documents || []).forEach(doc => {
      if (doc.url && doc.url.startsWith('/api/wealth/files/')) {
        const filename = doc.url.split('/').pop();
        const filePath = path.join(uploadDir, filename);
        if (fs.existsSync(filePath)) {
          docsFolder.file(doc.name || filename, fs.readFileSync(filePath));
        }
      }
    });
    
    const content = await zip.generateAsync({ type: 'nodebuffer' });
    const safeName = (user.name || 'User').replace(/[^a-z0-9]/gi, '_');
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${safeName}_Tax_Export.zip"`);
    res.send(content);
  } catch (err) {
    console.error(err);
    res.status(500).send('Export failed.');
  }
});

app.get('/api/wealth/data', requireWealthUser, (req, res) => {
  res.json({ data: req.wealthUser.data || defaultWealthData(req.wealthUser.name), updatedAt: req.wealthUser.updatedAt });
});

app.put('/api/wealth/data', requireWealthUser, (req, res) => {
  const data = req.body.data;
  if (!data || typeof data !== 'object') return res.status(400).json({ error: 'Data is required.' });
  const clean = cleanWealthData(data);
  const targetUserId = req.body.impersonateClientId || req.wealthUser.id;
  try {
    const result = saveUserData(targetUserId, clean, req.wealthUser.id);
    res.json({ ok: true, updatedAt: result.updatedAt });
  } catch (err) {
    console.error('Data save error:', err);
    res.status(500).json({ error: err.message || 'Failed to save data.' });
  }
});

app.delete('/api/wealth/data', requireWealthUser, (req, res) => {
  try {
    const result = resetUserData(req.wealthUser.id);
    res.json({ ok: true, data: result.data, updatedAt: result.updatedAt });
  } catch (err) {
    console.error('Data reset error:', err);
    res.status(500).json({ error: err.message || 'Failed to reset data.' });
  }
});

app.get('/api/wealth/audit', requireWealthUser, (req, res) => {
  const rows = (req.wealthDb.audit || [])
    .filter(item => item.userId === req.wealthUser.id)
    .slice(-50)
    .reverse();
  res.json({ rows });
});

app.get('/api/wealth/news', requireWealthUser, async (req, res) => {
  try {
    const force = req.query.refresh === '1';
    const items = await fetchFinanceNews(force);
    if (force && items.length > 3) financeNewsRefreshIndex = (financeNewsRefreshIndex + 3) % items.length;
    const visibleItems = rotateNewsItems(items, force ? financeNewsRefreshIndex : 0).slice(0, 6);
    res.json({
      updatedAt: new Date(financeNewsCache.fetchedAt || Date.now()).toISOString(),
      items: visibleItems
    });
  } catch (error) {
    res.status(502).json({ error: 'Could not load finance news right now.' });
  }
});

app.get('/api/wealth/market-events', requireWealthUser, async (req, res) => {
  try {
    const items = await fetchMarketEvents(req.query.refresh === '1');
    res.json({
      updatedAt: new Date(marketEventsCache.fetchedAt || Date.now()).toISOString(),
      items
    });
  } catch (error) {
    res.status(502).json({ error: 'Could not load market events right now.' });
  }
});

app.post('/api/wealth/watch-valuation', requireWealthUser, async (req, res) => {
  try {
    const estimate = await estimateWatchMarketValue({
      name: shortText(req.body?.name, 90),
      brand: shortText(req.body?.brand, 80),
      model: shortText(req.body?.model, 80),
      referenceNumber: shortText(req.body?.referenceNumber, 80),
      serialNumber: shortText(req.body?.serialNumber, 80),
      purchasePrice: cleanNumber(req.body?.purchasePrice),
      acquisitionDate: cleanDate(req.body?.acquisitionDate),
      year: cleanNumber(req.body?.year),
      condition: shortText(req.body?.condition, 40),
      watchBoxPapers: shortText(req.body?.watchBoxPapers, 80)
    }, req.query.refresh === '1');
    if (!estimate.value) return res.status(400).json({ error: 'Add watch name/model and purchase price first.' });
    res.json(estimate);
  } catch (error) {
    console.error('Watch valuation failed:', error.message);
    res.status(502).json({ error: 'Could not estimate watch value right now.' });
  }
});

app.post('/api/wealth/extract-tax-doc', requireWealthUser, upload.single('document'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Document file is required.' });
  const jobDir = path.join(__dirname, 'tmp', `tax-ocr-${Date.now()}-${Math.random().toString(16).slice(2)}`);
  fs.mkdirSync(jobDir, { recursive: true });
  
  try {
    let pageFiles = [];
    if (req.file.mimetype === 'application/pdf') {
      pageFiles = await renderPdf(req.file.path, jobDir, { dpi: 200 });
    } else {
      const imgDest = path.join(jobDir, 'page-1' + path.extname(req.file.originalname));
      fs.copyFileSync(req.file.path, imgDest);
      pageFiles.push(imgDest);
    }
    
    const pages = await ocrPages(pageFiles, jobDir, {});
    const rawText = pages.map(p => p.text).join('\n');
    
    if (!process.env.OPENAI_API_KEY) {
      console.log('OpenAI API key missing. Returning mock data.');
      return res.json({
        basicSalary: 1500000,
        hra: 350000,
        specialAllowance: 100000,
        bonus: 50000,
        employerPf: 80000,
        professionalTax: 2500,
        bankInterest: 12000
      });
    }
    
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: 'You extract tax details from Form 16 or Salary slips OCR text. Return JSON with numeric values (0 if missing) and the exact keys: basicSalary, hra, specialAllowance, bonus, otherAllowances, employerPf, professionalTax, otherIncome, bankInterest, dividendIncome, rentalIncome. CRITICAL: Also return a boolean key "isMonthly" set to true ONLY IF the document is clearly a single month\'s payslip (e.g. "Payslip for July"). If it is an annual document (like Form 16 or Annual Tax Statement), set "isMonthly" to false. Do NOT annualize the numbers yourself; extract the exact raw numbers you see.'
        },
        { role: 'user', content: rawText }
      ],
      temperature: 0.1
    });
    
    const extracted = JSON.parse(response.choices[0].message.content);
    if (extracted.isMonthly) {
      const multiplyBy12Keys = ['basicSalary', 'hra', 'specialAllowance', 'bonus', 'otherAllowances', 'employerPf', 'professionalTax'];
      for (const key of multiplyBy12Keys) {
        if (typeof extracted[key] === 'number') {
          extracted[key] = extracted[key] * 12;
        }
      }
    }
    
    res.json(extracted);
  } catch (error) {
    console.error('Tax OCR Error:', error);
    res.status(500).json({ error: error.message || 'Tax document extraction failed.' });
  } finally {
    fs.rmSync(req.file.path, { force: true });
    fs.rmSync(jobDir, { recursive: true, force: true });
  }
});

app.post('/api/wealth/files', requireWealthUser, upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'File is required.' });
  const allowed = new Set(['application/pdf', 'image/png', 'image/jpeg', 'image/webp']);
  if (!allowed.has(req.file.mimetype)) {
    fs.rmSync(req.file.path, { force: true });
    return res.status(400).json({ error: 'Upload a PDF or image file.' });
  }
  if (req.file.size > 15 * 1024 * 1024) {
    fs.rmSync(req.file.path, { force: true });
    return res.status(400).json({ error: 'File must be under 15 MB.' });
  }
  try {
    const fileBuffer = fs.readFileSync(req.file.path);
    fs.rmSync(req.file.path, { force: true });

    const stored = vaultService.storeVaultFile(
      req.wealthUser.id,
      fileBuffer,
      req.file.originalname || 'document.bin',
      req.file.mimetype
    );

    auditWealth(req.wealthDb, req.wealthUser.id, 'file.uploaded', {
      fileId: stored.fileId,
      fileName: stored.originalName,
      size: stored.size,
      checksum: stored.checksum
    });
    writeWealthDb(req.wealthDb);

    res.status(201).json({
      file: {
        id: stored.fileId,
        name: shortText(stored.originalName, 160),
        size: stored.size,
        mimeType: stored.mimeType,
        checksum: stored.checksum,
        url: `/api/wealth/files/${stored.fileId}`
      }
    });
  } catch (err) {
    if (req.file?.path && fs.existsSync(req.file.path)) {
      fs.rmSync(req.file.path, { force: true });
    }
    res.status(500).json({ error: err.message || 'File upload failed' });
  }
});

app.post('/api/wealth/files/:id/token', requireWealthUser, (req, res) => {
  try {
    const id = shortText(req.params.id, 80);
    const expirySeconds = parseInt(req.body.expiresIn || req.query.expiresIn || '60', 10);
    const token = vaultService.generateAccessToken(req.wealthUser.id, id, expirySeconds);
    res.json({
      token,
      expiresIn: expirySeconds,
      fileId: id,
      downloadUrl: `/api/wealth/files/${id}?token=${token}`
    });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to create access token' });
  }
});

app.get('/api/wealth/files/:id', (req, res) => {
  try {
    const token = getBearerToken(req);
    const id = shortText(req.params.id, 80);
    let authorizedUserId = null;

    // 1. Check if token is a short-lived download token
    if (token) {
      const tokenVerification = vaultService.verifyAccessToken(token, id);
      if (tokenVerification.valid) {
        authorizedUserId = tokenVerification.userId;
      }
    }

    // 2. Check if token is a valid JWT access token
    if (!authorizedUserId && token) {
      try {
        const decoded = jwt.verify(token, JWT_ACCESS_SECRET);
        if (decoded && decoded.sub) {
          authorizedUserId = decoded.sub;
        }
      } catch {
        // Fall through to other auth mechanisms
      }
    }

    // 3. Check if token is a valid session token (legacy)
    if (!authorizedUserId && token) {
      const db = readWealthDb();
      const session = db.sessions && db.sessions[token];
      if (session) {
        authorizedUserId = session.userId;
      } else {
        const rawDb = getDb();
        const dbSess = rawDb.prepare('SELECT user_id, expires_at FROM user_sessions WHERE token = ?').get(token);
        if (dbSess && new Date(dbSess.expires_at).getTime() >= Date.now()) {
          authorizedUserId = dbSess.user_id;
        }
      }
    }

    // 4. Fallback for registered asset photos (e.g. car, property, watch images in UI cards)
    if (!authorizedUserId) {
      const rawDb = getDb();
      const assetPhoto = rawDb.prepare('SELECT user_id FROM assets WHERE photo_id = ?').get(id);
      if (assetPhoto) {
        authorizedUserId = assetPhoto.user_id;
      }
    }

    if (!authorizedUserId) {
      return res.status(401).json({ error: 'Authentication required to access this file.' });
    }

    // Retrieve file from persistent vault
    const fileData = vaultService.retrieveVaultFile(authorizedUserId, id);
    if (!fileData) {
      return res.status(404).json({ error: 'File not found.' });
    }

    res.setHeader('Content-Type', fileData.mimeType || 'application/octet-stream');
    res.setHeader('Content-Length', fileData.fileBuffer.length);
    res.setHeader('ETag', `"${fileData.checksum}"`);
    res.setHeader('Cache-Control', 'public, max-age=86400');

    if (req.query.download === 'true') {
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileData.originalName)}"`);
    }

    return res.send(fileData.fileBuffer);
  } catch (err) {
    if (err.message && err.message.includes('Access denied')) {
      return res.status(403).json({ error: 'Access denied: You do not own this document.' });
    }
    return res.status(500).json({ error: err.message || 'Failed to retrieve file.' });
  }
});

app.get('/api/wealth/ca-package', requireWealthUser, async (req, res) => {
  try {
    const JSZip = require('jszip');
    const zip = new JSZip();
    const user = req.wealthUser;
    const data = user.data || {};
    const inc = data.incomeDetails || {};
    const ded = data.taxDeductions || {};
    const docs = Array.isArray(data.documents) ? data.documents : [];
    const userDir = path.join(wealthFilesDir, user.id);

    // 1. Create Tax Summary Text File
    let summaryText = `=====================================================\n`;
    summaryText += `     CHARTERED ACCOUNTANT TAX SUMMARY PACKAGE\n`;
    summaryText += `=====================================================\n\n`;
    summaryText += `Client Name    : ${user.name || 'Valued Client'}\n`;
    summaryText += `Client Email   : ${user.email || 'N/A'}\n`;
    summaryText += `Generated Date : ${new Date().toLocaleDateString('en-IN')}\n\n`;

    summaryText += `-----------------------------------------------------\n`;
    summaryText += ` 1. GROSS ANNUAL INCOME BREAKDOWN\n`;
    summaryText += `-----------------------------------------------------\n`;
    summaryText += `Basic Salary       : INR ${Number(inc.basicSalary || 0).toLocaleString('en-IN')}\n`;
    summaryText += `HRA                : INR ${Number(inc.hra || 0).toLocaleString('en-IN')}\n`;
    summaryText += `Freelance (44ADA)  : INR ${Number(inc.freelanceIncome || 0).toLocaleString('en-IN')}\n`;
    summaryText += `Special Allowance  : INR ${Number(inc.specialAllowance || 0).toLocaleString('en-IN')}\n`;
    summaryText += `Bonus              : INR ${Number(inc.bonus || 0).toLocaleString('en-IN')}\n`;
    summaryText += `Other Allowances   : INR ${Number(inc.otherAllowances || 0).toLocaleString('en-IN')}\n`;
    summaryText += `Employer PF        : INR ${Number(inc.employerPf || 0).toLocaleString('en-IN')}\n`;
    summaryText += `Professional Tax   : INR ${Number(inc.professionalTax || 0).toLocaleString('en-IN')}\n`;
    summaryText += `Other Income       : INR ${Number(inc.otherIncome || 0).toLocaleString('en-IN')}\n`;
    summaryText += `Bank Interest      : INR ${Number(inc.bankInterest || 0).toLocaleString('en-IN')}\n`;
    summaryText += `Dividend Income    : INR ${Number(inc.dividendIncome || 0).toLocaleString('en-IN')}\n`;
    summaryText += `Rental Income      : INR ${Number(inc.rentalIncome || 0).toLocaleString('en-IN')}\n`;
    summaryText += `Municipal Taxes    : INR ${Number(inc.municipalTaxes || 0).toLocaleString('en-IN')}\n`;
    summaryText += `STCG (Equity)      : INR ${Number(inc.stcgEquity || 0).toLocaleString('en-IN')}\n`;
    summaryText += `LTCG (Equity)      : INR ${Number(inc.ltcgEquity || 0).toLocaleString('en-IN')}\n`;
    summaryText += `STCL (Brought Fwd) : INR ${Number(inc.stclBroughtForward || 0).toLocaleString('en-IN')}\n`;
    summaryText += `LTCL (Brought Fwd) : INR ${Number(inc.ltclBroughtForward || 0).toLocaleString('en-IN')}\n`;
    
    summaryText += `\n-----------------------------------------------------\n`;
    summaryText += ` 2. TAX PREFERENCES & DETAILS\n`;
    summaryText += `-----------------------------------------------------\n`;
    summaryText += `Selected Regime    : ${ded.selectedRegime || 'Not Locked In'}\n`;
    summaryText += `Rent Paid (Annual) : INR ${Number(inc.rentPaid || 0).toLocaleString('en-IN')}\n`;
    summaryText += `City Type          : ${inc.isMetro ? 'Metro' : 'Non-Metro'}\n\n`;

    zip.file("Tax_Summary_Report.txt", summaryText);
    
    const itrDataMap = {
      client: { name: user.name, email: user.email },
      regime: ded.selectedRegime || 'New Regime',
      income: {
        salary: {
          basic: Number(inc.basicSalary || 0),
          hra: Number(inc.hra || 0),
          allowances: Number(inc.specialAllowance || 0) + Number(inc.otherAllowances || 0),
          bonus: Number(inc.bonus || 0)
        },
        business_profession: {
          sec44ADA_gross_receipts: Number(inc.freelanceIncome || 0),
          presumptive_income: Number(inc.freelanceIncome || 0) * 0.5
        },
        house_property: {
          gross_rent: Number(inc.rentalIncome || 0),
          municipal_taxes: Number(inc.municipalTaxes || 0),
          interest_borrowed_capital: Number(ded.homeLoanInterest || 0)
        },
        capital_gains: {
          stcg_111A: Number(inc.stcgEquity || 0),
          ltcg_112A: Number(inc.ltcgEquity || 0),
          brought_forward_stcl: Number(inc.stclBroughtForward || 0),
          brought_forward_ltcl: Number(inc.ltclBroughtForward || 0)
        },
        other_sources: {
          bank_interest: Number(inc.bankInterest || 0),
          dividend: Number(inc.dividendIncome || 0),
          any_other: Number(inc.otherIncome || 0)
        }
      },
      deductions: ded
    };
    zip.file("ITR_Data_Map.json", JSON.stringify(itrDataMap, null, 2));

    // 2. Attach Uploaded Documents from Vault
    const docsFolder = zip.folder("Uploaded_Documents");
    for (const doc of docs) {
      if (doc.fileId) {
        try {
          const fileData = vaultService.retrieveVaultFile(user.id, doc.fileId);
          if (fileData) {
            docsFolder.file(doc.fileName || doc.name || `${doc.fileId}.bin`, fileData.fileBuffer);
          }
        } catch (e) {
          if (fs.existsSync(userDir)) {
            const match = fs.readdirSync(userDir).find(f => f.startsWith(`${doc.fileId}.`));
            if (match) {
              docsFolder.file(doc.fileName || doc.name || match, fs.readFileSync(path.join(userDir, match)));
            }
          }
        }
      }
    }

    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="Wealth_OS_CA_Tax_Package.zip"`);
    res.send(zipBuffer);
  } catch (error) {
    res.status(500).json({ error: error.message || 'Failed to generate CA package ZIP' });
  }
});

app.get('/api/status', (req, res) => {
  res.json({
    ok: true,
    aiAvailable: Boolean(process.env.OPENAI_API_KEY),
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini'
  });
});

app.post('/api/export-cards', (req, res) => {
  const rows = Array.isArray(req.body.rows) ? req.body.rows : [];
  const buffer = makeWorkbookBuffer(rows);
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="visiting-card-data-${new Date().toISOString().slice(0, 10)}.xlsx"`);
  res.send(buffer);
});

app.get('/api/wealth/documents/export-emergency-pack', requireWealthUser, async (req, res) => {
  try {
    const JSZip = require('jszip');
    const zip = new JSZip();
    const user = req.wealthUser;
    const data = user.data || {};
    const docs = Array.isArray(data.documents) ? data.documents : [];
    const userDir = path.join(wealthFilesDir, user.id);

    let summaryText = `=====================================================\n`;
    summaryText += `       WEALTH OS — EMERGENCY HOSPITAL & FAMILY DOSSIER\n`;
    summaryText += `       CONFIDENTIAL & SENSITIVE MEDICAL/LEGAL ARCHIVE\n`;
    summaryText += `=====================================================\n\n`;
    summaryText += `Primary Holder : ${user.name || 'User'}\n`;
    summaryText += `Generated Date : ${new Date().toLocaleDateString('en-IN')}\n\n`;

    summaryText += `--- 1. CRITICAL EMERGENCY CONTACTS ---\n`;
    (data.family || []).forEach((f, idx) => {
      summaryText += `[${idx + 1}] ${f.name} (${f.relation}) — Access: ${f.access}, Phone: ${f.phone || 'N/A'}, Email: ${f.email || 'N/A'}\n`;
    });
    summaryText += `\n`;

    summaryText += `--- 2. STORED POLICIES & DOCUMENTS ---\n`;
    docs.forEach((d, idx) => {
      summaryText += `[${idx + 1}] ${d.name} (${d.type}) — Owner: ${d.owner || 'Self'}, Expiry: ${d.expiry || d.renewal || 'Permanent'}\n`;
    });

    zip.file('00_EMERGENCY_INSTRUCTIONS.txt', summaryText);

    const docFolder = zip.folder('Emergency_Documents');
    for (const doc of docs) {
      if (doc.fileId) {
        try {
          const fileData = vaultService.retrieveVaultFile(user.id, doc.fileId);
          if (fileData) {
            docFolder.file(doc.fileName || `${doc.name}.pdf`, fileData.fileBuffer);
          }
        } catch (e) {
          if (fs.existsSync(userDir)) {
            const fileMatch = fs.readdirSync(userDir).find(name => name.startsWith(`${doc.fileId}.`));
            if (fileMatch) {
              const content = fs.readFileSync(path.join(userDir, fileMatch));
              docFolder.file(doc.fileName || `${doc.name}.pdf`, content);
            }
          }
        }
      }
    }

    const content = await zip.generateAsync({ type: 'nodebuffer' });
    const safeName = (user.name || 'User').replace(/[^a-z0-9]/gi, '_');
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${safeName}_Emergency_Family_Pack.zip"`);
    res.send(content);
  } catch (err) {
    console.error('Emergency pack export failed:', err);
    res.status(500).send('Emergency pack export failed.');
  }
});

// --- DIGITAL WILL VAULT ENDPOINTS ---

app.post('/api/wealth/will/upload', requireWealthUser, upload.single('will_document'), (req, res) => {
  try {
    const db = req.wealthDb;
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    
    const fileBuffer = fs.readFileSync(req.file.path);
    fs.rmSync(req.file.path, { force: true });

    // 1. Store persistently in encrypted vault
    const stored = vaultService.storeVaultFile(
      req.wealthUser.id,
      fileBuffer,
      req.file.originalname || 'will_document.pdf',
      req.file.mimetype || 'application/pdf'
    );

    // 2. Compute envelope crypto with Master Key wrapped DEK
    const env = vaultService.encryptFile(fileBuffer);
    const encryptedDekJson = JSON.stringify({
      wrappedDek: env.wrappedDek,
      dekIv: env.dekIv,
      dekTag: env.dekTag
    });

    db.will_vault = db.will_vault || {};
    db.will_vault[req.wealthUser.id] = {
      status: 'PENDING_VERIFICATION',
      vault_file_id: stored.fileId,
      encrypted_blob: env.ciphertext.toString('base64'),
      iv: env.fileIv,
      authTag: env.tag,
      encrypted_dek: encryptedDekJson,
      uploadedAt: new Date().toISOString()
    };
    
    auditWealth(db, req.wealthUser.id, 'WILL_UPLOADED', {
      filename: req.file.originalname,
      vaultFileId: stored.fileId,
      checksum: stored.checksum
    });
    writeWealthDb(db);
    res.json({ success: true, status: 'PENDING_VERIFICATION', fileId: stored.fileId });
  } catch (err) {
    if (req.file?.path && fs.existsSync(req.file.path)) {
      fs.rmSync(req.file.path, { force: true });
    }
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/wealth/will/download', requireWealthUser, (req, res) => {
  try {
    const decrypted = vaultService.decryptWillVault(req.wealthUser.id);
    if (!decrypted) return res.status(404).json({ error: 'No will document found.' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="Decrypted_Will_Document.pdf"');
    res.send(decrypted);
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to decrypt will document.' });
  }
});

app.post('/api/wealth/will/nominee', requireWealthUser, (req, res) => {
  try {
    const db = req.wealthDb;
    db.will_vault = db.will_vault || {};
    const vault = db.will_vault[req.wealthUser.id] || {};
    vault.nominees = vault.nominees || [];
    
    const nominee = {
      id: crypto.randomUUID(),
      name: req.body.name,
      email: req.body.email,
      phone: req.body.phone,
      relationship: req.body.relationship,
      addedAt: new Date().toISOString()
    };
    vault.nominees.push(nominee);
    db.will_vault[req.wealthUser.id] = vault;
    
    auditWealth(db, req.wealthUser.id, 'NOMINEE_ADDED', { nominee_name: nominee.name });
    writeWealthDb(db);
    res.json({ success: true, nominees: vault.nominees });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/wealth/will/trigger-claim', upload.single('proof_document'), (req, res) => {
  try {
    const db = readWealthDb();
    const { userEmail, nomineeEmail } = req.body;
    
    const user = db.users.find(u => u.email === userEmail);
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    const vault = db.will_vault && db.will_vault[user.id];
    if (!vault || !vault.nominees) return res.status(404).json({ error: 'No active Will Vault found' });
    
    const nominee = vault.nominees.find(n => n.email === nomineeEmail);
    if (!nominee) return res.status(401).json({ error: 'Unauthorized Nominee' });

    vault.trigger_event = {
      status: 'UNDER_REVIEW',
      nomineeId: nominee.id,
      proofFileName: req.file ? req.file.originalname : 'No file',
      submittedAt: new Date().toISOString()
    };
    
    auditWealth(db, user.id, 'TRIGGER_FILED', { nominee: nominee.name });
    writeWealthDb(db);
    res.json({ success: true, message: 'Claim submitted for legal review.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/wealth/will/admin/approve', (req, res) => {
  try {
    const db = readWealthDb();
    const { userId, action } = req.body; 
    const vault = db.will_vault && db.will_vault[userId];
    if (!vault) return res.status(404).json({ error: 'Vault not found' });

    if (action === 'VERIFY_WILL') {
      vault.status = 'VERIFIED';
      auditWealth(db, userId, 'WILL_VERIFIED', { by: 'Legal Admin' });
    } else if (action === 'APPROVE_CLAIM') {
      if (vault.trigger_event) vault.trigger_event.status = 'APPROVED';
      auditWealth(db, userId, 'WILL_DISCLOSED', { to: vault.trigger_event.nomineeId });
    }
    
    writeWealthDb(db);
    res.json({ success: true, vault });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/wealth/will', requireWealthUser, (req, res) => {
  try {
    const db = req.wealthDb;
    const vault = (db.will_vault && db.will_vault[req.wealthUser.id]) || null;
    const auditLogs = (db.audit || []).filter(a => a.userId === req.wealthUser.id && String(a.action).startsWith('WILL') || String(a.action).startsWith('NOMINEE') || String(a.action).startsWith('TRIGGER'));
    res.json({ vault, auditLogs });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.use((req, res) => {
  if (req.accepts('html')) {
    res.status(404).sendFile(path.join(__dirname, '404.html'));
  } else {
    res.status(404).json({ error: 'Route not found' });
  }
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Wealth OS running at http://localhost:${PORT}/wealth-os.html`);
    console.log(`Card OCR backend running at http://localhost:${PORT}/visiting-card-extractor.html`);
  });
}

module.exports = { app, extractPdf, makeWorkbookBuffer };
