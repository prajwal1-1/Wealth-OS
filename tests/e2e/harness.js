/**
 * Wealth OS E2E Testing Harness & Specification Oracles
 * 
 * Provides:
 * 1. Self-contained asynchronous test runner with lifecycle hooks & structured reporter.
 * 2. Strict assertion library with numerical tolerance helpers (₹1 tolerance).
 * 3. Authoritative domain calculation oracles (Vehicle Depreciation, AY 2025-26 Tax, Loan Amortization, 50/30/20).
 * 4. Enterprise crypto & token verification utilities (AES-256-GCM, HMAC tokens, JWT rotation, bcrypt simulator).
 * 5. In-memory & WAL-mode SQLite database harness using Node.js built-in node:sqlite.
 */

const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');

// ==========================================
// 1. Standalone Lightweight Async Test Suite
// ==========================================

class TestSuite {
  constructor(name) {
    this.name = name;
    this.tests = [];
    this.beforeHooks = [];
    this.afterHooks = [];
    this.beforeEachHooks = [];
    this.afterEachHooks = [];
    this.results = [];
  }

  before(fn) { this.beforeHooks.push(fn); }
  after(fn) { this.afterHooks.push(fn); }
  beforeEach(fn) { this.beforeEachHooks.push(fn); }
  afterEach(fn) { this.afterEachHooks.push(fn); }

  test(title, fn) {
    this.tests.push({ title, fn });
  }

  async run() {
    console.log(`\n======================================================`);
    console.log(`RUNNING SUITE: ${this.name}`);
    console.log(`======================================================`);

    for (const hook of this.beforeHooks) {
      await hook();
    }

    let passed = 0;
    let failed = 0;
    const startTime = Date.now();

    for (const t of this.tests) {
      for (const hook of this.beforeEachHooks) {
        await hook();
      }

      const t0 = Date.now();
      try {
        await t.fn();
        const duration = Date.now() - t0;
        passed++;
        this.results.push({ title: t.title, status: 'PASS', duration });
        console.log(`  ✅ PASS: ${t.title} (${duration}ms)`);
      } catch (err) {
        const duration = Date.now() - t0;
        failed++;
        this.results.push({ title: t.title, status: 'FAIL', duration, error: err.message, stack: err.stack });
        console.error(`  ❌ FAIL: ${t.title} (${duration}ms)`);
        console.error(`     Error: ${err.message}`);
      }

      for (const hook of this.afterEachHooks) {
        await hook();
      }
    }

    for (const hook of this.afterHooks) {
      await hook();
    }

    const totalDuration = Date.now() - startTime;
    console.log(`------------------------------------------------------`);
    console.log(`Suite [${this.name}] Completed: ${passed} Passed, ${failed} Failed (${totalDuration}ms)`);
    console.log(`------------------------------------------------------\n`);

    return {
      suite: this.name,
      total: this.tests.length,
      passed,
      failed,
      duration: totalDuration,
      results: this.results
    };
  }
}

// ==========================================
// 2. Tolerance & Assertion Helpers
// ==========================================

function assertTolerance(actual, expected, tolerance = 1, message = '') {
  const diff = Math.abs(actual - expected);
  if (diff > tolerance) {
    throw new assert.AssertionError({
      message: `${message || 'Value out of tolerance'}: Expected ${expected} ± ${tolerance}, got ${actual} (diff: ${diff})`,
      actual,
      expected,
      operator: `±${tolerance}`
    });
  }
}

function roundToNearest(val, step = 10) {
  return Math.round(val / step) * step;
}

// ==========================================
// 3. Authoritative Mathematical Oracles
// ==========================================

/**
 * Deterministic Annual Vehicle Depreciation Model
 * Used in tests/investment-calculations.test.js and Clean Package
 */
function calculateDeterministicCarValuation({
  purchasePrice,
  manufactureYear,
  currentYear = 2026,
  odometer = 0,
  ownerCount = 1,
  condition = 'Good',
  demand = 'Normal'
}) {
  if (!purchasePrice || purchasePrice <= 0) return null;
  const ageYears = Math.max(0, currentYear - manufactureYear);

  let ageMultiplier = 1.0;
  if (ageYears >= 1) {
    ageMultiplier = 0.80 * Math.pow(0.90, ageYears - 1);
  }

  // Mileage Adjustment
  const standardMileage = ageYears * 12000;
  const mileageDelta = odometer - standardMileage;
  const blocks = Math.floor(Math.abs(mileageDelta) / 5000);
  let mileageAdjPercent = 0;
  if (mileageDelta > 0) {
    mileageAdjPercent = -blocks;
  } else {
    mileageAdjPercent = Math.min(5, blocks);
  }

  // Ownership Penalty
  let ownerAdjPercent = 0;
  if (ownerCount === 2) ownerAdjPercent = -8;
  else if (ownerCount >= 3) ownerAdjPercent = -15;

  // Condition Multiplier
  const conditionMultipliers = {
    'Excellent': 1.00,
    'Good': 0.95,
    'Fair': 0.85,
    'Poor': 0.70
  };
  const condMult = conditionMultipliers[condition] || 0.95;

  // Demand Multiplier
  const demandMultipliers = {
    'High': 1.05,
    'Normal': 1.00,
    'Low': 0.90
  };
  const demandMult = demandMultipliers[demand] || 1.00;

  const rawVal = purchasePrice * ageMultiplier * (1 + mileageAdjPercent / 100) * (1 + ownerAdjPercent / 100) * condMult * demandMult;

  // Discrete rounding rules
  let rounded = rawVal;
  if (rawVal >= 10000000) {
    rounded = Math.round(rawVal / 100000) * 100000;
  } else if (rawVal >= 100000) {
    rounded = Math.round(rawVal / 10000) * 10000;
  } else if (rawVal >= 10000) {
    rounded = Math.round(rawVal / 1000) * 1000;
  } else {
    rounded = Math.round(rawVal);
  }

  return {
    rawVal,
    value: rounded,
    ageMultiplier,
    mileageAdjPercent,
    ownerAdjPercent,
    condMult,
    demandMult
  };
}

/**
 * Budget 2024 / AY 2025-26 New Tax Regime (Section 115BAC) Oracle
 */
function computeNewRegimeTaxOracle({
  grossSalary = 0,
  otherIncome = 0,
  stcg = 0,
  ltcg = 0
}) {
  // Salaried standard deduction: ₹75,000 (Budget 2024)
  const stdDed = grossSalary > 0 ? Math.min(grossSalary, 75000) : 0;
  const netSalary = Math.max(0, grossSalary - stdDed);
  const normalTaxable = netSalary + otherIncome;

  // Slabs:
  // 0 - 3L: 0%
  // 3L - 7L: 5% (max 20,000)
  // 7L - 10L: 10% (max 30,000)
  // 10L - 12L: 15% (max 30,000)
  // 12L - 15L: 20% (max 60,000)
  // > 15L: 30%
  let slabTax = 0;
  if (normalTaxable > 1500000) {
    slabTax += (normalTaxable - 1500000) * 0.30;
    slabTax += 60000; // 12L-15L
    slabTax += 30000; // 10L-12L
    slabTax += 30000; // 7L-10L
    slabTax += 20000; // 3L-7L
  } else if (normalTaxable > 1200000) {
    slabTax += (normalTaxable - 1200000) * 0.20;
    slabTax += 30000; // 10L-12L
    slabTax += 30000; // 7L-10L
    slabTax += 20000; // 3L-7L
  } else if (normalTaxable > 1000000) {
    slabTax += (normalTaxable - 1000000) * 0.15;
    slabTax += 30000; // 7L-10L
    slabTax += 20000; // 3L-7L
  } else if (normalTaxable > 700000) {
    slabTax += (normalTaxable - 700000) * 0.10;
    slabTax += 20000; // 3L-7L
  } else if (normalTaxable > 300000) {
    slabTax += (normalTaxable - 300000) * 0.05;
  }

  // Capital Gains: STCG @ 20%, LTCG @ 12.5% (above 1.25L)
  const taxableLtcg = Math.max(0, ltcg - 125000);
  const cgTax = (stcg * 0.20) + (taxableLtcg * 0.125);

  let taxBeforeRebate = slabTax + cgTax;
  let rebate87A = 0;
  let taxAfterRebate = taxBeforeRebate;

  const totalTaxable = normalTaxable + stcg + taxableLtcg;

  if (totalTaxable <= 700000) {
    rebate87A = taxBeforeRebate;
    taxAfterRebate = 0;
  } else if (totalTaxable <= 727777 && normalTaxable <= 727777) {
    // Section 87A Marginal Relief Proviso
    const excessIncome = normalTaxable - 700000;
    if (slabTax > excessIncome) {
      rebate87A = slabTax - excessIncome;
      taxAfterRebate = excessIncome + cgTax;
    }
  }

  const cess = Math.round(taxAfterRebate * 0.04);
  const totalTax = roundToNearest(taxAfterRebate + cess, 10);

  return {
    grossSalary,
    stdDed,
    netSalary,
    otherIncome,
    normalTaxable,
    totalTaxable,
    slabTax,
    cgTax,
    taxBeforeRebate,
    rebate87A,
    taxAfterRebate,
    cess,
    totalTax
  };
}

/**
 * Standard Reducing Balance Loan Amortization Oracle
 */
function computeLoanAmortizationOracle({
  loanAmount,
  annualInterestRate,
  tenureYears,
  elapsedMonths = 0,
  emiAmount = 0
}) {
  const totalMonths = tenureYears * 12;
  if (annualInterestRate === 0) {
    const emi = emiAmount > 0 ? emiAmount : (loanAmount / totalMonths);
    const principalPaid = Math.min(loanAmount, emi * elapsedMonths);
    const remainingBalance = Math.max(0, loanAmount - principalPaid);
    return {
      emi: Math.round(emi),
      totalRepayment: loanAmount,
      totalInterest: 0,
      principalPaidToDate: Math.round(principalPaid),
      interestPaidToDate: 0,
      remainingBalance: Math.round(remainingBalance),
      completedEmis: elapsedMonths
    };
  }

  const monthlyRate = annualInterestRate / (12 * 100);
  const factor = Math.pow(1 + monthlyRate, totalMonths);
  const calculatedEmi = loanAmount * monthlyRate * factor / (factor - 1);
  const emi = emiAmount > 0 ? emiAmount : calculatedEmi;

  const compFactor = Math.pow(1 + monthlyRate, elapsedMonths);
  const remainingBalance = loanAmount * compFactor - emi * ((compFactor - 1) / monthlyRate);
  const roundedRemaining = Math.round(Math.min(loanAmount, Math.max(0, remainingBalance)));
  const principalPaidToDate = Math.round(Math.min(loanAmount, Math.max(0, loanAmount - roundedRemaining)));
  const interestPaidToDate = Math.round(Math.max(0, (emi * elapsedMonths) - principalPaidToDate));

  const totalRepayment = Math.round(emi * totalMonths);
  const totalInterest = Math.round(totalRepayment - loanAmount);

  return {
    exactEmi: calculatedEmi,
    emi: Math.round(emi),
    totalRepayment,
    totalInterest,
    principalPaidToDate,
    interestPaidToDate,
    remainingBalance: roundedRemaining,
    completedEmis: elapsedMonths,
    remainingMonths: Math.max(0, totalMonths - elapsedMonths)
  };
}

function loadLegacyDatabase(workspaceRoot = path.join(__dirname, '..', '..')) {
  // Try encrypted tmp/wealth-os/wealth-os-db.json first
  const tmpDbPath = path.join(workspaceRoot, 'tmp', 'wealth-os', 'wealth-os-db.json');
  const tmpKeyPath = path.join(workspaceRoot, 'tmp', 'wealth-os', 'wealth-os-db.key');
  if (fs.existsSync(tmpDbPath) && fs.existsSync(tmpKeyPath)) {
    try {
      const keyHex = fs.readFileSync(tmpKeyPath, 'utf8').trim();
      const key = Buffer.from(keyHex, 'hex');
      const enc = JSON.parse(fs.readFileSync(tmpDbPath, 'utf8'));
      if (enc.encrypted && enc.data) {
        const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(enc.iv, 'base64'));
        decipher.setAuthTag(Buffer.from(enc.tag, 'base64'));
        const dec = Buffer.concat([decipher.update(Buffer.from(enc.data, 'base64')), decipher.final()]);
        return JSON.parse(dec.toString('utf8'));
      }
    } catch (e) {
      // Fallback
    }
  }

  const exportPath = path.join(workspaceRoot, 'wealth_os_database_export.json');
  if (fs.existsSync(exportPath)) {
    return JSON.parse(fs.readFileSync(exportPath, 'utf8'));
  }

  return { users: [], audit: [] };
}

// ==========================================
// 4. Crypto & Token Security Utilities
// ==========================================

function createMasterKey() {
  return crypto.randomBytes(32).toString('hex');
}

function encryptVaultFile(fileBuffer, masterKeyHex) {
  const masterKey = Buffer.from(masterKeyHex, 'hex');
  const dek = crypto.randomBytes(32); // Data Encryption Key
  const fileIv = crypto.randomBytes(12);
  
  // Encrypt payload with DEK
  const cipher = crypto.createCipheriv('aes-256-gcm', dek, fileIv);
  const ciphertext = Buffer.concat([cipher.update(fileBuffer), cipher.final()]);
  const tag = cipher.getAuthTag();

  // Wrap DEK with Master Key
  const dekIv = crypto.randomBytes(12);
  const dekCipher = crypto.createCipheriv('aes-256-gcm', masterKey, dekIv);
  const wrappedDek = Buffer.concat([dekCipher.update(dek), dekCipher.final()]);
  const dekTag = dekCipher.getAuthTag();

  const checksum = crypto.createHash('sha256').update(fileBuffer).digest('hex');

  return {
    ciphertext,
    fileIv: fileIv.toString('hex'),
    tag: tag.toString('hex'),
    wrappedDek: wrappedDek.toString('hex'),
    dekIv: dekIv.toString('hex'),
    dekTag: dekTag.toString('hex'),
    checksum,
    size: fileBuffer.length
  };
}

function decryptVaultFile(encryptedEnvelope, masterKeyHex) {
  const masterKey = Buffer.from(masterKeyHex, 'hex');

  // Unwrap DEK
  const dekIv = Buffer.from(encryptedEnvelope.dekIv, 'hex');
  const dekTag = Buffer.from(encryptedEnvelope.dekTag, 'hex');
  const wrappedDek = Buffer.from(encryptedEnvelope.wrappedDek, 'hex');

  const dekDecipher = crypto.createDecipheriv('aes-256-gcm', masterKey, dekIv);
  dekDecipher.setAuthTag(dekTag);
  const dek = Buffer.concat([dekDecipher.update(wrappedDek), dekDecipher.final()]);

  // Decrypt File
  const fileIv = Buffer.from(encryptedEnvelope.fileIv, 'hex');
  const tag = Buffer.from(encryptedEnvelope.tag, 'hex');
  const ciphertext = Buffer.isBuffer(encryptedEnvelope.ciphertext) 
    ? encryptedEnvelope.ciphertext 
    : Buffer.from(encryptedEnvelope.ciphertext, 'hex');

  const fileDecipher = crypto.createDecipheriv('aes-256-gcm', dek, fileIv);
  fileDecipher.setAuthTag(tag);
  const decrypted = Buffer.concat([fileDecipher.update(ciphertext), fileDecipher.final()]);

  const verifiedChecksum = crypto.createHash('sha256').update(decrypted).digest('hex');
  if (verifiedChecksum !== encryptedEnvelope.checksum) {
    throw new Error(`Stream integrity check failed: Expected ${encryptedEnvelope.checksum}, computed ${verifiedChecksum}`);
  }

  return decrypted;
}

function generateDownloadAccessToken(userId, fileId, masterSecret, expiresInSeconds = 60) {
  const expiresAt = Date.now() + (expiresInSeconds * 1000);
  const payload = `${userId}:${fileId}:${expiresAt}`;
  const signature = crypto.createHmac('sha256', masterSecret).update(payload).digest('hex');
  return Buffer.from(JSON.stringify({ userId, fileId, expiresAt, sig: signature })).toString('base64url');
}

function verifyDownloadAccessToken(tokenBase64, targetFileId, masterSecret) {
  try {
    const raw = Buffer.from(tokenBase64, 'base64url').toString('utf8');
    const parsed = JSON.parse(raw);
    if (!parsed.userId || !parsed.fileId || !parsed.expiresAt || !parsed.sig) {
      return { valid: false, reason: 'MALFORMED_PAYLOAD' };
    }
    if (parsed.fileId !== targetFileId) {
      return { valid: false, reason: 'FILE_MISMATCH' };
    }
    if (Date.now() > parsed.expiresAt) {
      return { valid: false, reason: 'TOKEN_EXPIRED' };
    }
    const expectedPayload = `${parsed.userId}:${parsed.fileId}:${parsed.expiresAt}`;
    const expectedSig = crypto.createHmac('sha256', masterSecret).update(expectedPayload).digest('hex');
    if (!crypto.timingSafeEqual(Buffer.from(parsed.sig, 'hex'), Buffer.from(expectedSig, 'hex'))) {
      return { valid: false, reason: 'INVALID_SIGNATURE' };
    }
    return { valid: true, userId: parsed.userId };
  } catch (err) {
    return { valid: false, reason: 'PARSE_ERROR' };
  }
}

// ==========================================
// 5. JWT & Refresh Token Utilities
// ==========================================

function signJwt(payload, secret, expiresInSeconds = 900) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const exp = Math.floor(Date.now() / 1000) + expiresInSeconds;
  const claims = { ...payload, exp, iat: Math.floor(Date.now() / 1000) };

  const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
  const encodedClaims = Buffer.from(JSON.stringify(claims)).toString('base64url');
  const signature = crypto.createHmac('sha256', secret)
    .update(`${encodedHeader}.${encodedClaims}`)
    .digest('base64url');

  return `${encodedHeader}.${encodedClaims}.${signature}`;
}

function verifyJwt(jwtString, secret) {
  if (!jwtString || typeof jwtString !== 'string') return { valid: false, reason: 'EMPTY_TOKEN' };
  const parts = jwtString.split('.');
  if (parts.length !== 3) return { valid: false, reason: 'INVALID_FORMAT' };

  const [headerB64, claimsB64, signature] = parts;
  const expectedSig = crypto.createHmac('sha256', secret)
    .update(`${headerB64}.${claimsB64}`)
    .digest('base64url');

  if (signature !== expectedSig) {
    return { valid: false, reason: 'INVALID_SIGNATURE' };
  }

  try {
    const claims = JSON.parse(Buffer.from(claimsB64, 'base64url').toString('utf8'));
    const now = Math.floor(Date.now() / 1000);
    if (claims.exp && now > claims.exp) {
      return { valid: false, reason: 'TOKEN_EXPIRED', claims };
    }
    return { valid: true, claims };
  } catch (e) {
    return { valid: false, reason: 'PARSE_ERROR' };
  }
}

// ==========================================
// 6. SQLite Relational Schema & Test Harness
// ==========================================

const ENTERPRISE_SCHEMA_SQL = `
PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;
PRAGMA synchronous = NORMAL;
PRAGMA busy_timeout = 5000;

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT,
  role TEXT DEFAULT 'client',
  mfa_secret TEXT,
  mfa_enabled INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS user_profiles (
  user_id TEXT PRIMARY KEY,
  data_json TEXT NOT NULL,
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS assets (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  value REAL NOT NULL,
  purchase_price REAL,
  acquisition_date TEXT,
  year INTEGER,
  details_json TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS liabilities (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  value REAL NOT NULL,
  emi REAL,
  rate REAL,
  details_json TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS documents (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  file_id TEXT,
  stored_path TEXT,
  checksum TEXT,
  size_bytes INTEGER,
  metadata_json TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS will_vault (
  user_id TEXT PRIMARY KEY,
  status TEXT DEFAULT 'PENDING_VERIFICATION',
  encrypted_blob TEXT,
  iv TEXT,
  auth_tag TEXT,
  wrapped_dek TEXT,
  uploaded_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS cashflow_transactions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  account_id TEXT,
  amount REAL NOT NULL,
  currency TEXT DEFAULT 'INR',
  type TEXT NOT NULL, -- 'debit' | 'credit'
  category TEXT,
  merchant TEXT,
  transaction_date TEXT NOT NULL,
  notes TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS refresh_tokens (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  token_hash TEXT UNIQUE NOT NULL,
  expires_at TEXT NOT NULL,
  revoked INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS rate_limit_records (
  key TEXT PRIMARY KEY,
  attempts INTEGER DEFAULT 1,
  first_attempt_at INTEGER NOT NULL,
  last_attempt_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS consents (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  purpose TEXT NOT NULL,
  status TEXT DEFAULT 'GRANTED',
  granted_at TEXT DEFAULT (datetime('now')),
  withdrawn_at TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  action TEXT NOT NULL,
  details_json TEXT,
  timestamp TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_assets_user ON assets(user_id);
CREATE INDEX IF NOT EXISTS idx_liabilities_user ON liabilities(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_user ON documents(user_id);
CREATE INDEX IF NOT EXISTS idx_cashflow_user ON cashflow_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_logs(user_id);
`;

function createTestDatabase(dbPath = ':memory:') {
  const db = new DatabaseSync(dbPath);
  db.exec(ENTERPRISE_SCHEMA_SQL);
  return db;
}

// Export everything
module.exports = {
  TestSuite,
  assert,
  assertTolerance,
  roundToNearest,
  calculateDeterministicCarValuation,
  computeNewRegimeTaxOracle,
  computeLoanAmortizationOracle,
  createMasterKey,
  encryptVaultFile,
  decryptVaultFile,
  generateDownloadAccessToken,
  verifyDownloadAccessToken,
  signJwt,
  verifyJwt,
  loadLegacyDatabase,
  ENTERPRISE_SCHEMA_SQL,
  createTestDatabase
};
