const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');

const defaultDbDir = path.resolve(__dirname, '..', '..', 'storage', 'database');
const defaultDbPath = path.join(defaultDbDir, 'wealth-os.db');

const instances = new Map();
const activeTxHandles = new Set();

function ensureDbDirectory(dbFilePath) {
  const dir = path.dirname(dbFilePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function applyPragmas(db) {
  db.exec('PRAGMA journal_mode = WAL;');
  db.exec('PRAGMA synchronous = NORMAL;');
  db.exec('PRAGMA busy_timeout = 5000;');
  db.exec('PRAGMA foreign_keys = ON;');
  db.exec("PRAGMA encoding = 'UTF-8';");
}

function initSchema(db) {
  const schemaPath = path.join(__dirname, 'schema.sql');
  if (fs.existsSync(schemaPath)) {
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    db.exec(schemaSql);
  }
}

function getDb(customPath) {
  const targetPath = customPath ? path.resolve(customPath) : defaultDbPath;
  if (instances.has(targetPath)) {
    const existing = instances.get(targetPath);
    if (existing.isOpen) {
      return existing;
    }
    instances.delete(targetPath);
  }

  ensureDbDirectory(targetPath);
  const db = new DatabaseSync(targetPath);
  applyPragmas(db);
  initSchema(db);
  instances.set(targetPath, db);
  return db;
}

function closeDb(customPath) {
  if (customPath) {
    const targetPath = path.resolve(customPath);
    const db = instances.get(targetPath);
    if (db) {
      activeTxHandles.delete(db);
      try { db.close(); } catch (e) { void e; }
      instances.delete(targetPath);
    }
  } else {
    for (const [p, db] of instances.entries()) {
      activeTxHandles.delete(db);
      try { db.close(); } catch (e) { void e; }
    }
    instances.clear();
  }
}

function withTransaction(callback, maxRetries = 5, customDb = null) {
  let db;
  if (customDb && typeof customDb === 'object') {
    db = customDb;
  } else if (typeof customDb === 'string') {
    db = getDb(customDb);
  } else {
    db = getDb();
  }

  let attempts = 0;

  while (attempts < maxRetries) {
    const inTx = activeTxHandles.has(db);
    try {
      if (inTx) {
        const spName = `sp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        db.exec(`SAVEPOINT ${spName}`);
        try {
          const result = callback(db);
          db.exec(`RELEASE SAVEPOINT ${spName}`);
          return result;
        } catch (err) {
          try {
            db.exec(`ROLLBACK TO SAVEPOINT ${spName}`);
          } catch (rbErr) {
            void rbErr;
          }
          throw err;
        }
      }

      activeTxHandles.add(db);
      db.exec('BEGIN IMMEDIATE');
      try {
        const result = callback(db);
        db.exec('COMMIT');
        activeTxHandles.delete(db);
        return result;
      } catch (err) {
        try {
          db.exec('ROLLBACK');
        } catch (rbErr) {
          void rbErr;
        }
        activeTxHandles.delete(db);
        throw err;
      }
    } catch (err) {
      const isBusy = err.message && (
        err.message.includes('busy') || 
        err.message.includes('locked') || 
        err.code === 'SQLITE_BUSY'
      );
      if (isBusy && attempts < maxRetries - 1 && !activeTxHandles.has(db)) {
        attempts++;
        const delay = Math.floor(Math.random() * 50) + (attempts * 25);
        const end = Date.now() + delay;
        while (Date.now() < end) {
          // Busy retry backoff delay
        }
        continue;
      }
      throw err;
    }
  }
}

module.exports = {
  getDb,
  closeDb,
  withTransaction,
  defaultDbPath,
  defaultDbDir
};
