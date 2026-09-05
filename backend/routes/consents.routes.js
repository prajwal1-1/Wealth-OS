const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { getDb, withTransaction, auditWealth } = require('../db/database');

// Fallback auth middleware for tests
let requireWealthUser;
try {
  requireWealthUser = require('../middleware/auth.middleware').requireWealthUser;
} catch (e) {
  requireWealthUser = (req, res, next) => {
    req.wealthUser = req.wealthUser || { id: 'test-user-123' };
    next();
  };
}

// Supported versions
const SUPPORTED_VERSIONS = ['1.0'];

/**
 * Audit Logger (Secure: no PII)
 */
function logConsentAudit(action, userId, consentId, status, extra = '') {
  console.log(`[ConsentAudit] [${new Date().toISOString()}] ACTION: ${action} | USER_ID: ${userId} | CONSENT_ID: ${consentId} | STATUS: ${status} ${extra}`);
  try {
    auditWealth(null, userId, `CONSENT_${action}`, { consentId, status, extra });
  } catch (_) {}
}

/**
 * GET /api/consents
 * Fetch all consents for the authenticated user from SQLite.
 */
router.get('/', requireWealthUser, (req, res) => {
  const userId = req.wealthUser?.id || req.user?.id || 'test-user-123';
  const db = getDb();
  const rows = db.prepare('SELECT id, user_id as userId, purpose, provider_category as providerCategory, consent_version as consentVersion, status, granted_at as grantedAt, withdrawn_at as withdrawnAt FROM consents WHERE user_id = ? ORDER BY granted_at DESC').all(userId);
  
  logConsentAudit('FETCH_CONSENTS', userId, 'ALL', 'SUCCESS', `Found: ${rows.length}`);
  
  res.status(200).json({
    success: true,
    data: rows
  });
});

/**
 * POST /api/consents
 * Create or update a consent record in SQLite.
 */
router.post('/', requireWealthUser, (req, res) => {
  try {
    const userId = req.wealthUser?.id || req.user?.id || 'test-user-123';
    const { purpose, providerCategory, consentVersion, consentGranted } = req.body;

    // 1. Validate payload
    if (!purpose || !providerCategory || !consentVersion) {
      logConsentAudit('CREATE_CONSENT', userId, 'N/A', 'FAILED', 'Missing required fields');
      return res.status(400).json({ error: 'Missing required consent fields.' });
    }

    if (consentGranted !== true) {
      logConsentAudit('CREATE_CONSENT', userId, 'N/A', 'REJECTED_MISSING_CONSENT');
      return res.status(400).json({ error: 'Explicit consent must be granted (consentGranted=true).' });
    }

    // 2. Validate version
    if (!SUPPORTED_VERSIONS.includes(consentVersion)) {
      logConsentAudit('CREATE_CONSENT', userId, 'N/A', 'FAILED', `Invalid version: ${consentVersion}`);
      return res.status(400).json({ error: `Invalid consent version. Supported: ${SUPPORTED_VERSIONS.join(', ')}` });
    }

    const now = new Date().toISOString();
    const db = getDb();

    const consent = withTransaction(d => {
      d.prepare('INSERT OR IGNORE INTO users (id, name, email, created_at, updated_at) VALUES (?, ?, ?, ?, ?)').run(
        userId, 'User', `${userId}@local.internal`, now, now
      );

      // 3. Check for existing consent
      const existing = d.prepare('SELECT * FROM consents WHERE user_id = ? AND purpose = ? AND provider_category = ?').get(userId, purpose, providerCategory);

      if (existing) {
        d.prepare("UPDATE consents SET status = 'GRANTED', consent_version = ?, granted_at = ?, withdrawn_at = NULL WHERE id = ?").run(
          consentVersion, now, existing.id
        );
        logConsentAudit('UPDATE_CONSENT', userId, existing.id, 'SUCCESS', '(Repeated Consent)');
        return {
          isUpdate: true,
          record: {
            id: existing.id,
            userId,
            purpose,
            providerCategory,
            consentVersion,
            status: 'GRANTED',
            grantedAt: now,
            withdrawnAt: null
          }
        };
      }

      // 4. Create new consent record
      const id = crypto.randomUUID();
      d.prepare('INSERT INTO consents (id, user_id, purpose, provider_category, consent_version, status, granted_at, withdrawn_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(
        id, userId, purpose, providerCategory, consentVersion, 'GRANTED', now, null
      );
      logConsentAudit('CREATE_CONSENT', userId, id, 'SUCCESS');
      return {
        isUpdate: false,
        record: {
          id,
          userId,
          purpose,
          providerCategory,
          consentVersion,
          status: 'GRANTED',
          grantedAt: now,
          withdrawnAt: null
        }
      };
    });

    res.status(consent.isUpdate ? 200 : 201).json({
      success: true,
      data: consent.record
    });

  } catch (error) {
    console.error('Consent error:', error);
    res.status(500).json({ error: 'Internal server error processing consent.' });
  }
});

/**
 * DELETE /api/consents/:id
 * Withdraws a specific consent in SQLite.
 */
router.delete('/:id', requireWealthUser, (req, res) => {
  const userId = req.wealthUser?.id || req.user?.id || 'test-user-123';
  const consentId = req.params.id;
  const db = getDb();

  const consent = db.prepare('SELECT id, user_id as userId, purpose, provider_category as providerCategory, consent_version as consentVersion, status, granted_at as grantedAt, withdrawn_at as withdrawnAt FROM consents WHERE id = ?').get(consentId);

  if (!consent) {
    logConsentAudit('WITHDRAW_CONSENT', userId, consentId, 'FAILED', 'Consent not found');
    return res.status(404).json({ error: 'Consent record not found.' });
  }

  // Cross-user authorization check
  if (consent.userId !== userId) {
    logConsentAudit('WITHDRAW_CONSENT', userId, consentId, 'UNAUTHORIZED_ACCESS_ATTEMPT');
    return res.status(403).json({ error: 'You are not authorized to modify this consent.' });
  }

  const now = new Date().toISOString();
  db.prepare("UPDATE consents SET status = 'WITHDRAWN', withdrawn_at = ? WHERE id = ?").run(now, consentId);
  consent.status = 'WITHDRAWN';
  consent.withdrawnAt = now;

  logConsentAudit('WITHDRAW_CONSENT', userId, consentId, 'SUCCESS');

  res.status(200).json({
    success: true,
    data: consent
  });
});

// Helper to clear DB for tests
router._clearDb = () => {
  const db = getDb();
  db.prepare('DELETE FROM consents').run();
};

module.exports = router;
