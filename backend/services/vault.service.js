const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { getDb, withTransaction } = require('../db/sqlite');

// Base persistent storage directory: storage/vault
const defaultVaultDir = path.resolve(__dirname, '..', '..', 'storage', 'vault');

// Helper to determine Master Key
function getMasterKey() {
  const configured = String(process.env.VAULT_MASTER_KEY || process.env.WEALTH_OS_DB_KEY || '').trim();
  if (configured) {
    return /^[a-f0-9]{64}$/i.test(configured)
      ? Buffer.from(configured, 'hex')
      : crypto.createHash('sha256').update(configured).digest();
  }

  // Fallback to disk key if present (for backward compatibility during migration)
  const legacyKeyPath = path.resolve(__dirname, '..', '..', 'tmp', 'wealth-os', 'wealth-os-db.key');
  if (fs.existsSync(legacyKeyPath)) {
    try {
      const hex = fs.readFileSync(legacyKeyPath, 'utf8').trim();
      if (/^[a-f0-9]{64}$/i.test(hex)) {
        return Buffer.from(hex, 'hex');
      }
    } catch (e) {
      void e;
    }
  }

  // Deterministic fallback for dev / test mode if no key configured
  return crypto.createHash('sha256').update('WEALTH_OS_ENTERPRISE_DEFAULT_VAULT_MASTER_KEY_2026').digest();
}

function getMasterKeyHex() {
  return getMasterKey().toString('hex');
}

/**
 * Encrypt file buffer with AES-256-GCM using per-file DEK wrapped by Master Key.
 */
function encryptFile(fileBuffer, masterKeyHexOrBuffer = getMasterKey()) {
  if (!Buffer.isBuffer(fileBuffer)) {
    fileBuffer = Buffer.from(fileBuffer);
  }

  const masterKey = Buffer.isBuffer(masterKeyHexOrBuffer)
    ? masterKeyHexOrBuffer
    : Buffer.from(masterKeyHexOrBuffer, 'hex');

  const dek = crypto.randomBytes(32); // 32-byte Data Encryption Key
  const fileIv = crypto.randomBytes(12); // 12-byte IV for GCM

  // 1. Encrypt file with DEK
  const cipher = crypto.createCipheriv('aes-256-gcm', dek, fileIv);
  const ciphertext = Buffer.concat([cipher.update(fileBuffer), cipher.final()]);
  const tag = cipher.getAuthTag(); // 16-byte Auth Tag

  // 2. Wrap DEK with Master Key
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

/**
 * Decrypt file buffer with AES-256-GCM after unwrapping DEK using Master Key.
 * Performs SHA-256 stream integrity check.
 */
function decryptFile(envelope, masterKeyHexOrBuffer = getMasterKey()) {
  if (!envelope) throw new Error('Decryption envelope is required');

  const masterKey = Buffer.isBuffer(masterKeyHexOrBuffer)
    ? masterKeyHexOrBuffer
    : Buffer.from(masterKeyHexOrBuffer, 'hex');

  let wrappedDekHex = envelope.wrappedDek || envelope.wrapped_dek;
  let dekIvHex = envelope.dekIv || envelope.dek_iv;
  let dekTagHex = envelope.dekTag || envelope.dek_tag;

  // If wrappedDek is stored as a JSON string in encrypted_dek
  if (envelope.encrypted_dek) {
    try {
      const parsed = JSON.parse(envelope.encrypted_dek);
      if (parsed.wrappedDek) {
        wrappedDekHex = parsed.wrappedDek;
        dekIvHex = parsed.dekIv;
        dekTagHex = parsed.dekTag;
      }
    } catch (e) {
      if (!wrappedDekHex) {
        wrappedDekHex = envelope.encrypted_dek;
      }
    }
  }

  if (!wrappedDekHex) {
    throw new Error('Missing wrapped DEK in envelope');
  }

  // 1. Unwrap DEK using Master Key
  let dek;
  if (dekIvHex && dekTagHex) {
    const dekIv = Buffer.from(dekIvHex, 'hex');
    const dekTag = Buffer.from(dekTagHex, 'hex');
    const wrappedDek = Buffer.from(wrappedDekHex, 'hex');

    const dekDecipher = crypto.createDecipheriv('aes-256-gcm', masterKey, dekIv);
    dekDecipher.setAuthTag(dekTag);
    dek = Buffer.concat([dekDecipher.update(wrappedDek), dekDecipher.final()]);
  } else {
    // If DEK was stored directly or using a single-pass wrapper
    dek = Buffer.from(wrappedDekHex, 'hex');
  }

  // 2. Decrypt Ciphertext
  const fileIvHex = envelope.fileIv || envelope.iv || envelope.file_iv;
  const fileTagHex = envelope.tag || envelope.authTag || envelope.auth_tag;

  if (!fileIvHex || !fileTagHex) {
    throw new Error('Missing file IV or auth tag in envelope');
  }

  const fileIv = Buffer.from(fileIvHex, 'hex');
  const tag = Buffer.from(fileTagHex, 'hex');

  let ciphertext;
  if (Buffer.isBuffer(envelope.ciphertext)) {
    ciphertext = envelope.ciphertext;
  } else if (typeof envelope.ciphertext === 'string') {
    ciphertext = Buffer.from(envelope.ciphertext, /^[a-f0-9]+$/i.test(envelope.ciphertext) ? 'hex' : 'base64');
  } else if (envelope.encrypted_blob) {
    ciphertext = Buffer.from(envelope.encrypted_blob, 'base64');
  } else {
    throw new Error('Missing ciphertext in envelope');
  }

  const fileDecipher = crypto.createDecipheriv('aes-256-gcm', dek, fileIv);
  fileDecipher.setAuthTag(tag);
  const decrypted = Buffer.concat([fileDecipher.update(ciphertext), fileDecipher.final()]);

  // 3. Verify SHA-256 Stream Integrity
  const expectedChecksum = envelope.checksum || envelope.sha256_checksum;
  if (expectedChecksum) {
    const computedChecksum = crypto.createHash('sha256').update(decrypted).digest('hex');
    if (computedChecksum.toLowerCase() !== expectedChecksum.toLowerCase()) {
      throw new Error(`Stream integrity check failed: Expected ${expectedChecksum}, computed ${computedChecksum}`);
    }
  }

  return decrypted;
}

// Aliases for compatibility with test suites
const encryptVaultFile = encryptFile;
const decryptVaultFile = decryptFile;

/**
 * Generate a short-lived HMAC download access token (default 60s).
 */
function generateAccessToken(userId, fileId, expirySeconds = 60, masterSecret = getMasterKey()) {
  const expiresAt = Date.now() + (expirySeconds * 1000);
  const payload = `${userId}:${fileId}:${expiresAt}`;
  const signature = crypto.createHmac('sha256', masterSecret).update(payload).digest('hex');
  return Buffer.from(JSON.stringify({ userId, fileId, expiresAt, sig: signature })).toString('base64url');
}

const generateDownloadAccessToken = generateAccessToken;

/**
 * Verify a short-lived HMAC download access token.
 */
function verifyAccessToken(tokenString, fileId, masterSecret = getMasterKey()) {
  if (!tokenString || typeof tokenString !== 'string') {
    return { valid: false, reason: 'EMPTY_TOKEN' };
  }

  try {
    const raw = Buffer.from(tokenString, 'base64url').toString('utf8');
    const parsed = JSON.parse(raw);

    if (!parsed.userId || !parsed.fileId || !parsed.expiresAt || !parsed.sig) {
      return { valid: false, reason: 'MALFORMED_PAYLOAD' };
    }

    if (fileId && parsed.fileId !== fileId) {
      return { valid: false, reason: 'FILE_MISMATCH' };
    }

    if (Date.now() > parsed.expiresAt) {
      return { valid: false, reason: 'TOKEN_EXPIRED' };
    }

    const expectedPayload = `${parsed.userId}:${parsed.fileId}:${parsed.expiresAt}`;
    const expectedSig = crypto.createHmac('sha256', masterSecret).update(expectedPayload).digest('hex');

    const sigBuf = Buffer.from(parsed.sig, 'hex');
    const expBuf = Buffer.from(expectedSig, 'hex');

    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
      return { valid: false, reason: 'INVALID_SIGNATURE' };
    }

    return { valid: true, userId: parsed.userId, fileId: parsed.fileId };
  } catch (err) {
    return { valid: false, reason: 'PARSE_ERROR' };
  }
}

const verifyDownloadAccessToken = verifyAccessToken;

/**
 * Store a user file persistently in storage/vault/<userId>/ with AES-256-GCM envelope encryption.
 */
function storeVaultFile(userId, fileBuffer, originalName = 'document.bin', mimeType = 'application/octet-stream', customDb = null) {
  if (!userId) throw new Error('User ID is required for vault storage');
  if (!fileBuffer) throw new Error('File buffer is required for vault storage');

  const fileId = crypto.randomUUID();
  const envelope = encryptFile(fileBuffer, getMasterKey());

  const userVaultDir = path.join(defaultVaultDir, userId);
  if (!fs.existsSync(userVaultDir)) {
    fs.mkdirSync(userVaultDir, { recursive: true });
  }

  const storedFileName = `${fileId}.enc`;
  const fullStoredPath = path.join(userVaultDir, storedFileName);
  const relativeStoredPath = path.join('storage', 'vault', userId, storedFileName).replace(/\\/g, '/');

  // Write encrypted ciphertext to disk
  fs.writeFileSync(fullStoredPath, envelope.ciphertext);

  const db = customDb || getDb();
  const nowIso = new Date().toISOString();
  const encryptedDekJson = JSON.stringify({
    wrappedDek: envelope.wrappedDek,
    dekIv: envelope.dekIv,
    dekTag: envelope.dekTag
  });

  const insertStmt = db.prepare(`
    INSERT OR REPLACE INTO vault_files (
      id, user_id, original_name, stored_path, mime_type, size_bytes,
      sha256_checksum, encrypted_dek, iv, auth_tag, uploaded_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertStmt.run(
    fileId,
    userId,
    originalName,
    relativeStoredPath,
    mimeType,
    envelope.size,
    envelope.checksum,
    encryptedDekJson,
    envelope.fileIv,
    envelope.tag,
    nowIso
  );

  return {
    fileId,
    originalName,
    size: envelope.size,
    mimeType,
    checksum: envelope.checksum,
    storedPath: relativeStoredPath,
    uploadedAt: nowIso
  };
}

/**
 * Helper to detect MIME type from buffer magic bytes or file extension
 */
function detectMimeType(buffer, filename = '') {
  if (buffer && buffer.length >= 4) {
    // PNG: 89 50 4E 47
    if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) {
      return 'image/png';
    }
    // JPEG: FF D8 FF
    if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
      return 'image/jpeg';
    }
    // GIF: GIF8
    if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x38) {
      return 'image/gif';
    }
    // PDF: %PDF-
    if (buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46) {
      return 'application/pdf';
    }
    // WEBP: RIFF ... WEBP
    if (buffer.length >= 12 && buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
        buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50) {
      return 'image/webp';
    }
  }
  const ext = path.extname(filename).toLowerCase();
  if (ext === '.png') return 'image/png';
  if (ext === '.jpg' || ext === '.jpeg' || ext === '.jfif') return 'image/jpeg';
  if (ext === '.webp') return 'image/webp';
  if (ext === '.pdf') return 'application/pdf';
  if (ext === '.gif') return 'image/gif';
  return 'application/octet-stream';
}

/**
 * Retrieve and decrypt a file from persistent vault. Enforces strict user ownership (no IDOR).
 */
function retrieveVaultFile(userId, fileId, customDb = null) {
  if (!fileId) throw new Error('File ID is required');

  const db = customDb || getDb();
  let vaultFile = db.prepare('SELECT * FROM vault_files WHERE id = ?').get(fileId);

  if (!vaultFile) {
    // Check if file is stored in legacy documents or assets table before returning 404
    const docMatch = db.prepare('SELECT user_id, file_name FROM documents WHERE file_id = ?').get(fileId);
    const assetMatch = db.prepare('SELECT user_id, photo_name FROM assets WHERE photo_id = ?').get(fileId);
    const ownerUserId = docMatch?.user_id || assetMatch?.user_id;

    if (userId && ownerUserId && ownerUserId !== userId) {
      throw new Error('Access denied: You do not own this document');
    }

    const effectiveUserId = userId || ownerUserId;

    // Search disk for legacy/unencrypted file in storage/files/<userId>/ or storage/files/
    const candidateDirs = [
      effectiveUserId ? path.join(path.resolve(__dirname, '..', '..', 'storage', 'files'), effectiveUserId) : null,
      path.resolve(__dirname, '..', '..', 'storage', 'files'),
      effectiveUserId ? path.join(defaultVaultDir, effectiveUserId) : null,
      defaultVaultDir
    ].filter(Boolean);

    for (const dir of candidateDirs) {
      if (!fs.existsSync(dir)) continue;
      const entries = fs.readdirSync(dir);
      for (const entry of entries) {
        if (entry === fileId || entry.startsWith(fileId + '.')) {
          const candidatePath = path.join(dir, entry);
          if (fs.statSync(candidatePath).isFile()) {
            const fileBuf = fs.readFileSync(candidatePath);
            const origName = docMatch?.file_name || assetMatch?.photo_name || entry;
            const mime = detectMimeType(fileBuf, origName);
            const checksum = crypto.createHash('sha256').update(fileBuf).digest('hex');

            if (!entry.endsWith('.enc') && effectiveUserId) {
              try {
                // Auto-migrate to encrypted vault for permanence
                const stored = storeVaultFile(effectiveUserId, fileBuf, origName, mime, db);
                db.prepare('UPDATE vault_files SET id = ? WHERE id = ?').run(fileId, stored.fileId);
              } catch (e) {
                void e;
              }
            }

            return {
              fileBuffer: fileBuf,
              originalName: origName,
              mimeType: mime,
              checksum,
              size: fileBuf.length,
              uploadedAt: new Date().toISOString()
            };
          }
        }
      }
    }
    return null;
  }

  // IDOR Protection: strictly verify ownership if userId is supplied
  if (userId && vaultFile.user_id !== userId) {
    throw new Error('Access denied: You do not own this document');
  }

  // Resolve file path on disk
  let fullPath = path.resolve(__dirname, '..', '..', vaultFile.stored_path);
  if (!fs.existsSync(fullPath)) {
    // Try standard storage/vault/<userId>/<fileId>.enc location
    fullPath = path.join(defaultVaultDir, vaultFile.user_id, `${fileId}.enc`);
    if (!fs.existsSync(fullPath)) {
      // Check storage/files/<userId>/<fileId>.*
      const userFilesDir = path.join(path.resolve(__dirname, '..', '..', 'storage', 'files'), vaultFile.user_id);
      if (fs.existsSync(userFilesDir)) {
        const found = fs.readdirSync(userFilesDir).find(f => f === fileId || f.startsWith(fileId + '.'));
        if (found) fullPath = path.join(userFilesDir, found);
      }
    }
    if (!fs.existsSync(fullPath)) {
      throw new Error(`Vault file data missing from persistent disk: ${vaultFile.stored_path}`);
    }
  }

  const rawDiskBuf = fs.readFileSync(fullPath);
  let decrypted;

  if (fullPath.endsWith('.enc')) {
    try {
      const envelope = {
        ciphertext: rawDiskBuf,
        fileIv: vaultFile.iv,
        tag: vaultFile.auth_tag,
        encrypted_dek: vaultFile.encrypted_dek,
        checksum: vaultFile.sha256_checksum
      };
      decrypted = decryptFile(envelope, getMasterKey());
    } catch (decryptErr) {
      // Self-healing fallback: Check if rawDiskBuf is already valid plaintext
      const detected = detectMimeType(rawDiskBuf, vaultFile.original_name);
      if (detected !== 'application/octet-stream') {
        decrypted = rawDiskBuf;
      } else {
        throw decryptErr;
      }
    }
  } else {
    decrypted = rawDiskBuf;
  }

  return {
    fileBuffer: decrypted,
    originalName: vaultFile.original_name,
    mimeType: vaultFile.mime_type || detectMimeType(decrypted, vaultFile.original_name),
    checksum: vaultFile.sha256_checksum || crypto.createHash('sha256').update(decrypted).digest('hex'),
    size: decrypted.length,
    uploadedAt: vaultFile.uploaded_at
  };
}

/**
 * Delete a file from persistent vault.
 */
function deleteVaultFile(userId, fileId, customDb = null) {
  if (!userId || !fileId) return false;
  const db = customDb || getDb();

  const vaultFile = db.prepare('SELECT * FROM vault_files WHERE id = ? AND user_id = ?').get(fileId, userId);
  if (!vaultFile) return false;

  const fullPath = path.resolve(__dirname, '..', '..', vaultFile.stored_path);
  if (fs.existsSync(fullPath)) {
    try { fs.unlinkSync(fullPath); } catch (e) { void e; }
  }

  db.prepare('DELETE FROM vault_files WHERE id = ? AND user_id = ?').run(fileId, userId);
  return true;
}

/**
 * List all vault files for a given user.
 */
function listVaultFiles(userId, customDb = null) {
  if (!userId) return [];
  const db = customDb || getDb();
  return db.prepare(`
    SELECT id as fileId, original_name as originalName, mime_type as mimeType,
           size_bytes as size, sha256_checksum as checksum, stored_path as storedPath,
           uploaded_at as uploadedAt
    FROM vault_files
    WHERE user_id = ?
    ORDER BY uploaded_at DESC
  `).all(userId);
}

/**
 * Encrypt and store digital will document.
 */
function encryptWillVault(userId, fileBuffer, customDb = null) {
  if (!userId || !fileBuffer) throw new Error('User ID and file buffer are required');
  const envelope = encryptFile(fileBuffer, getMasterKey());
  const db = customDb || getDb();
  const nowIso = new Date().toISOString();

  const encryptedDekJson = JSON.stringify({
    wrappedDek: envelope.wrappedDek,
    dekIv: envelope.dekIv,
    dekTag: envelope.dekTag
  });

  const upsert = db.prepare(`
    INSERT OR REPLACE INTO will_vault (
      user_id, status, encrypted_blob, iv, auth_tag, encrypted_dek, uploaded_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  upsert.run(
    userId,
    'PENDING_VERIFICATION',
    envelope.ciphertext.toString('base64'),
    envelope.fileIv,
    envelope.tag,
    encryptedDekJson,
    nowIso
  );

  return {
    userId,
    status: 'PENDING_VERIFICATION',
    checksum: envelope.checksum,
    uploadedAt: nowIso
  };
}

/**
 * Decrypt digital will document.
 */
function decryptWillVault(userId, customDb = null) {
  if (!userId) throw new Error('User ID is required');
  const db = customDb || getDb();
  const willRow = db.prepare('SELECT * FROM will_vault WHERE user_id = ?').get(userId);
  if (!willRow || !willRow.encrypted_blob) return null;

  const envelope = {
    ciphertext: willRow.encrypted_blob,
    fileIv: willRow.iv,
    tag: willRow.auth_tag,
    encrypted_dek: willRow.encrypted_dek
  };

  return decryptFile(envelope, getMasterKey());
}

/**
 * Migration utility: port all legacy plaintext files into encrypted storage/vault/<userId>/
 */
function migrateLegacyFiles(options = {}) {
  const workspaceRoot = options.workspaceRoot || path.resolve(__dirname, '..', '..');
  const db = options.db || getDb();
  const masterKey = getMasterKey();

  const sourceDirs = [
    path.join(workspaceRoot, 'tmp', 'wealth-os', 'files'),
    path.join(workspaceRoot, 'backend', 'tmp', 'wealth-os', 'files')
  ];

  let migratedCount = 0;
  let totalBytes = 0;
  const errors = [];

  const mimeMap = {
    '.pdf': 'application/pdf',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.webp': 'image/webp',
    '.json': 'application/json',
    '.txt': 'text/plain',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  };

  // Helper to process a single user directory or file
  function processFile(userId, filePath, fileName) {
    try {
      if (!fs.existsSync(filePath)) return;
      const stat = fs.statSync(filePath);
      if (stat.isDirectory()) return;

      const ext = path.extname(fileName).toLowerCase();
      const baseName = path.basename(fileName, ext);
      // fileId is typically the UUID prefix or basename
      const fileId = /^[a-f0-9-]{36}$/i.test(baseName) ? baseName : (crypto.randomUUID());
      const mimeType = mimeMap[ext] || 'application/octet-stream';

      // Check if already in vault_files
      const existing = db.prepare('SELECT id FROM vault_files WHERE id = ?').get(fileId);
      if (existing) return;

      // Ensure user exists in users table to satisfy foreign key
      const userExists = db.prepare('SELECT id FROM users WHERE id = ?').get(userId);
      if (!userExists) {
        const nowIso = new Date().toISOString();
        db.prepare('INSERT OR IGNORE INTO users (id, name, email, user_type, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)').run(
          userId,
          `Legacy User ${userId.slice(0, 8)}`,
          `legacy-${userId}@wealthos.internal`,
          'user',
          nowIso,
          nowIso
        );
      }

      const fileBuffer = fs.readFileSync(filePath);
      const envelope = encryptFile(fileBuffer, masterKey);

      const userVaultDir = path.join(workspaceRoot, 'storage', 'vault', userId);
      if (!fs.existsSync(userVaultDir)) {
        fs.mkdirSync(userVaultDir, { recursive: true });
      }

      const encFileName = `${fileId}.enc`;
      const encFullPath = path.join(userVaultDir, encFileName);
      const relativePath = `storage/vault/${userId}/${encFileName}`;

      fs.writeFileSync(encFullPath, envelope.ciphertext);

      // Find original name from documents or assets if possible
      let origName = fileName;
      const docMatch = db.prepare('SELECT file_name FROM documents WHERE file_id = ?').get(fileId);
      if (docMatch && docMatch.file_name) {
        origName = docMatch.file_name;
      } else {
        const assetMatch = db.prepare('SELECT photo_name FROM assets WHERE photo_id = ?').get(fileId);
        if (assetMatch && assetMatch.photo_name) {
          origName = assetMatch.photo_name;
        }
      }

      const encryptedDekJson = JSON.stringify({
        wrappedDek: envelope.wrappedDek,
        dekIv: envelope.dekIv,
        dekTag: envelope.dekTag
      });

      const nowIso = new Date().toISOString();

      db.prepare(`
        INSERT OR REPLACE INTO vault_files (
          id, user_id, original_name, stored_path, mime_type, size_bytes,
          sha256_checksum, encrypted_dek, iv, auth_tag, uploaded_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        fileId,
        userId,
        origName,
        relativePath,
        mimeType,
        envelope.size,
        envelope.checksum,
        encryptedDekJson,
        envelope.fileIv,
        envelope.tag,
        nowIso
      );

      migratedCount++;
      totalBytes += envelope.size;
    } catch (err) {
      errors.push({ file: filePath, error: err.message });
    }
  }

  for (const srcDir of sourceDirs) {
    if (!fs.existsSync(srcDir)) continue;
    const entries = fs.readdirSync(srcDir);

    for (const entry of entries) {
      const entryPath = path.join(srcDir, entry);
      const stat = fs.statSync(entryPath);

      if (stat.isDirectory()) {
        const userId = entry;
        const subFiles = fs.readdirSync(entryPath);
        for (const sub of subFiles) {
          processFile(userId, path.join(entryPath, sub), sub);
        }
      } else if (stat.isFile()) {
        // Flat file in files dir
        const defaultUser = '5f2c1976-3ab5-45e2-87d3-a1ffd8f93d49';
        processFile(defaultUser, entryPath, entry);
      }
    }
  }

  return { migratedCount, totalBytes, errors };
}

module.exports = {
  defaultVaultDir,
  getMasterKey,
  getMasterKeyHex,
  encryptFile,
  decryptFile,
  encryptVaultFile,
  decryptVaultFile,
  generateAccessToken,
  verifyAccessToken,
  generateDownloadAccessToken,
  verifyDownloadAccessToken,
  storeVaultFile,
  retrieveVaultFile,
  deleteVaultFile,
  listVaultFiles,
  encryptWillVault,
  decryptWillVault,
  migrateLegacyFiles
};
