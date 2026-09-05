const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const JSZip = require('jszip');
const vaultService = require('../services/vault.service');
const { getDb, auditWealth, readWealthDb } = require('../db/database');

const allowedMimes = new Set([
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/webp',
  'application/json',
  'text/plain',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
]);

function getBearerToken(req) {
  const auth = req.headers.authorization || '';
  if (auth.toLowerCase().startsWith('bearer ')) {
    return auth.slice(7).trim();
  }
  return req.headers['x-access-token'] || req.query.token || req.body?.token || '';
}

function resolveUserFromRequest(req) {
  if (req.wealthUser) return req.wealthUser;
  const token = getBearerToken(req);
  if (!token) return null;

  const db = getDb();
  const session = db.prepare('SELECT user_id, expires_at FROM user_sessions WHERE token = ?').get(token);
  if (!session) return null;

  if (new Date(session.expires_at).getTime() < Date.now()) {
    db.prepare('DELETE FROM user_sessions WHERE token = ?').run(token);
    return null;
  }

  const user = db.prepare('SELECT id, name, email, user_type FROM users WHERE id = ?').get(session.user_id);
  return user || null;
}

exports.uploadFile = async (req, res) => {
  try {
    const user = resolveUserFromRequest(req);
    if (!user) return res.status(401).json({ error: 'Authentication required' });

    if (!req.file) {
      return res.status(400).json({ error: 'File is required.' });
    }

    if (!allowedMimes.has(req.file.mimetype)) {
      if (req.file.path && fs.existsSync(req.file.path)) {
        fs.rmSync(req.file.path, { force: true });
      }
      return res.status(400).json({ error: 'Upload a supported PDF or image file.' });
    }

    if (req.file.size > 15 * 1024 * 1024) {
      if (req.file.path && fs.existsSync(req.file.path)) {
        fs.rmSync(req.file.path, { force: true });
      }
      return res.status(400).json({ error: 'File must be under 15 MB.' });
    }

    const fileBuffer = fs.readFileSync(req.file.path);
    // Remove temporary upload file immediately
    fs.rmSync(req.file.path, { force: true });

    const stored = vaultService.storeVaultFile(
      user.id,
      fileBuffer,
      req.file.originalname || 'uploaded_document',
      req.file.mimetype
    );

    auditWealth(null, user.id, 'file.uploaded', {
      fileId: stored.fileId,
      fileName: stored.originalName,
      size: stored.size,
      checksum: stored.checksum
    });

    return res.status(201).json({
      file: {
        id: stored.fileId,
        name: stored.originalName,
        size: stored.size,
        mimeType: stored.mimeType,
        checksum: stored.checksum,
        url: `/api/wealth/files/${stored.fileId}`
      }
    });
  } catch (err) {
    console.error('File upload error:', err);
    return res.status(500).json({ error: err.message || 'File upload failed' });
  }
};

exports.getFile = (req, res) => {
  try {
    const fileId = req.params.id;
    if (!fileId) return res.status(400).json({ error: 'File ID is required' });

    const token = getBearerToken(req);
    let authorizedUserId = null;

    // 1. Try validating as a short-lived download access token
    if (token) {
      const tokenVerification = vaultService.verifyAccessToken(token, fileId);
      if (tokenVerification.valid) {
        authorizedUserId = tokenVerification.userId;
      }
    }

    // 2. Try validating as a session user
    if (!authorizedUserId) {
      const user = resolveUserFromRequest(req);
      if (user) {
        authorizedUserId = user.id;
      }
    }

    if (!authorizedUserId) {
      return res.status(401).json({ error: 'Authentication required to access this file.' });
    }

    const fileData = vaultService.retrieveVaultFile(authorizedUserId, fileId);
    if (!fileData) {
      return res.status(404).json({ error: 'File not found.' });
    }

    res.setHeader('Content-Type', fileData.mimeType || 'application/octet-stream');
    res.setHeader('Content-Length', fileData.fileBuffer.length);
    res.setHeader('ETag', `"${fileData.checksum}"`);
    res.setHeader('Cache-Control', 'private, max-age=3600');

    if (req.query.download === 'true') {
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileData.originalName)}"`);
    }

    return res.send(fileData.fileBuffer);
  } catch (err) {
    if (err.message && err.message.includes('Access denied')) {
      return res.status(403).json({ error: 'Access denied: You do not own this document.' });
    }
    console.error('File retrieval error:', err);
    return res.status(500).json({ error: err.message || 'File retrieval failed' });
  }
};

exports.createDownloadToken = (req, res) => {
  try {
    const user = resolveUserFromRequest(req);
    if (!user) return res.status(401).json({ error: 'Authentication required' });

    const fileId = req.params.id;
    const db = getDb();
    const vaultFile = db.prepare('SELECT id, user_id FROM vault_files WHERE id = ?').get(fileId);

    if (!vaultFile) {
      const doc = db.prepare('SELECT id, user_id FROM documents WHERE file_id = ?').get(fileId);
      if (!doc || doc.user_id !== user.id) {
        return res.status(404).json({ error: 'File not found or access denied.' });
      }
    } else if (vaultFile.user_id !== user.id) {
      return res.status(403).json({ error: 'Access denied: You do not own this file.' });
    }

    const expirySeconds = parseInt(req.body.expiresIn || req.query.expiresIn || '60', 10);
    const token = vaultService.generateAccessToken(user.id, fileId, expirySeconds);

    return res.json({
      token,
      expiresIn: expirySeconds,
      fileId,
      downloadUrl: `/api/wealth/files/${fileId}?token=${token}`
    });
  } catch (err) {
    console.error('Create download token error:', err);
    return res.status(500).json({ error: err.message || 'Failed to generate token' });
  }
};

exports.downloadFile = (req, res) => {
  req.query.download = 'true';
  return exports.getFile(req, res);
};

exports.deleteFile = (req, res) => {
  try {
    const user = resolveUserFromRequest(req);
    if (!user) return res.status(401).json({ error: 'Authentication required' });

    const fileId = req.params.id;
    const deleted = vaultService.deleteVaultFile(user.id, fileId);

    if (!deleted) {
      return res.status(404).json({ error: 'File not found or access denied.' });
    }

    auditWealth(null, user.id, 'file.deleted', { fileId });
    return res.json({ success: true, message: 'File deleted from vault.' });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Delete failed' });
  }
};

exports.exportFiles = async (req, res) => {
  try {
    const user = resolveUserFromRequest(req);
    if (!user) return res.status(401).json({ error: 'Authentication required' });

    const files = vaultService.listVaultFiles(user.id);
    const zip = new JSZip();

    for (const f of files) {
      try {
        const decrypted = vaultService.retrieveVaultFile(user.id, f.fileId);
        if (decrypted) {
          zip.file(f.originalName || `${f.fileId}.bin`, decrypted.fileBuffer);
        }
      } catch (e) {
        console.warn(`Could not add file ${f.fileId} to export zip:`, e.message);
      }
    }

    const content = await zip.generateAsync({ type: 'nodebuffer' });
    const safeName = (user.name || 'User').replace(/[^a-z0-9]/gi, '_');

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${safeName}_Vault_Export.zip"`);
    return res.send(content);
  } catch (err) {
    console.error('Export files error:', err);
    return res.status(500).json({ error: err.message || 'Export failed' });
  }
};

exports.analyzeFile = async (req, res) => {
  try {
    const user = resolveUserFromRequest(req);
    if (!user) return res.status(401).json({ error: 'Authentication required' });

    const fileId = req.params.id;
    const fileData = vaultService.retrieveVaultFile(user.id, fileId);
    if (!fileData) return res.status(404).json({ error: 'File not found.' });

    // Mock OCR/Analysis payload for tax & documents
    return res.json({
      success: true,
      fileId,
      fileName: fileData.originalName,
      mimeType: fileData.mimeType,
      size: fileData.size,
      checksum: fileData.checksum,
      analyzed: true,
      extractedData: {}
    });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Analysis failed' });
  }
};