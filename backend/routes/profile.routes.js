const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { getDb, withTransaction } = require('../db/database');

let requireWealthUser;
try {
  requireWealthUser = require('../middleware/auth.middleware').requireWealthUser;
} catch (e) {
  requireWealthUser = (req, res, next) => {
    req.wealthUser = req.wealthUser || { id: 'test-user-123' };
    next();
  };
}

// Allowed Sources
const VALID_SOURCES = ['USER_PROVIDED', 'AUTHORISED_PROVIDER', 'CALCULATED', 'IMPORTED', 'UNKNOWN'];

// Base Schema Template
const DEFAULT_PROFILE = () => ({
  IDENTITY: {
    pan: { value: null, source: 'UNKNOWN' },
    name: { value: null, source: 'UNKNOWN' },
    dob: { value: null, source: 'UNKNOWN' },
    residentialStatus: { value: 'RESIDENT', source: 'UNKNOWN' }
  },
  INCOME: {
    salary: { value: 0, source: 'UNKNOWN' },
    interest: { value: 0, source: 'UNKNOWN' },
    dividend: { value: 0, source: 'UNKNOWN' },
    capitalGains: { value: 0, source: 'UNKNOWN' },
    business: { value: 0, source: 'UNKNOWN' },
    other: { value: 0, source: 'UNKNOWN' }
  },
  TAXES: {
    tds: { value: 0, source: 'UNKNOWN' },
    tcs: { value: 0, source: 'UNKNOWN' },
    advanceTax: { value: 0, source: 'UNKNOWN' },
    selfAssessmentTax: { value: 0, source: 'UNKNOWN' }
  },
  DEDUCTIONS: {
    eligibleDeductions: { value: 0, source: 'UNKNOWN' },
    supportingInfo: { value: '', source: 'UNKNOWN' }
  },
  ASSETS: {
    data: { value: null, source: 'UNKNOWN' }
  }
});

function getProfile(userId) {
  const db = getDb();
  const base = DEFAULT_PROFILE();
  const rows = db.prepare('SELECT category, field_key, field_value, source FROM taxpayer_profile_fields WHERE user_id = ?').all(userId);
  
  for (const row of rows) {
    const cat = row.category;
    const key = row.field_key;
    if (base[cat] && base[cat][key] !== undefined) {
      let val = row.field_value;
      if (val !== null && !isNaN(Number(val)) && typeof base[cat][key].value === 'number') {
        val = Number(val);
      }
      base[cat][key] = {
        value: val,
        source: row.source || 'USER_PROVIDED'
      };
    }
  }
  return base;
}

/**
 * GET /api/profile
 * Returns the entire taxpayer profile for the authenticated user.
 */
router.get('/', requireWealthUser, (req, res) => {
  const userId = req.wealthUser?.id || req.user?.id || 'test-user-123';
  const profile = getProfile(userId);
  res.status(200).json({ success: true, data: profile });
});

/**
 * PUT /api/profile/:category
 * Updates specific fields in a category. Enforces source tracking and persistence in SQLite.
 */
router.put('/:category', requireWealthUser, (req, res) => {
  const category = req.params.category.toUpperCase();
  const userId = req.wealthUser?.id || req.user?.id || 'test-user-123';
  const updates = req.body;
  const profile = getProfile(userId);

  if (!profile[category]) {
    return res.status(400).json({ error: `Invalid category: ${category}` });
  }

  const db = getDb();
  const nowIso = new Date().toISOString();

  try {
    withTransaction(d => {
      d.prepare('INSERT OR IGNORE INTO users (id, name, email, created_at, updated_at) VALUES (?, ?, ?, ?, ?)').run(
        userId, 'User', `${userId}@local.internal`, nowIso, nowIso
      );

      const upsertField = d.prepare(`
        INSERT OR REPLACE INTO taxpayer_profile_fields (id, user_id, category, field_key, field_value, source, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      for (const [key, fieldData] of Object.entries(updates)) {
        if (profile[category][key] !== undefined) {
          const newValue = fieldData.value;
          const proposedSource = fieldData.source || 'USER_PROVIDED';
          
          if (!VALID_SOURCES.includes(proposedSource)) {
            throw new Error(`Invalid source: ${proposedSource}`);
          }

          const existingSource = profile[category][key].source;
          let finalSource = proposedSource;
          if (existingSource === 'AUTHORISED_PROVIDER' && proposedSource !== 'AUTHORISED_PROVIDER') {
            finalSource = 'USER_PROVIDED';
          }

          const fieldId = `${userId}_${category}_${key}`;
          const valStr = newValue !== null && newValue !== undefined ? String(newValue) : null;
          upsertField.run(fieldId, userId, category, key, valStr, finalSource, nowIso);

          profile[category][key] = {
            value: newValue,
            source: finalSource
          };
        }
      }
    });

    res.status(200).json({ success: true, data: profile[category] });
  } catch (err) {
    if (err.message.startsWith('Invalid source')) {
      return res.status(400).json({ error: err.message });
    }
    console.error('Profile update error:', err);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Helper for testing
router._clearDb = () => {
  const db = getDb();
  db.prepare('DELETE FROM taxpayer_profile_fields').run();
};

module.exports = router;
