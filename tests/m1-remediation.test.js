/**
 * tests/m1-remediation.test.js
 * 
 * Verifies the 4 Milestone 1 remediations:
 * 1. saveUserDataSync in backend/db/database.js syncs data.expenses into cashflow_transactions and data.willVault into will_vault.
 * 2. expenses.controller.js CRUD operations read/write user.data.expenses and persist to SQLite.
 * 3. withTransaction in backend/db/sqlite.js supports explicit/custom DB handle.
 * 4. migrate.js uses deterministic IDs for records lacking IDs.
 */

const assert = require('assert');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { getDb, closeDb, withTransaction, defaultDbPath } = require('../backend/db/sqlite');
const { saveUserData, getUserById, readWealthDb, defaultWealthData } = require('../backend/db/database');
const expensesController = require('../backend/controllers/expenses.controller');
const { runMigration } = require('../backend/db/migrate');

const TEST_DIR = path.resolve(__dirname, '..', 'storage', 'test_remediation');

function setup() {
  if (!fs.existsSync(TEST_DIR)) {
    fs.mkdirSync(TEST_DIR, { recursive: true });
  }
}

function cleanup() {
  if (fs.existsSync(TEST_DIR)) {
    try {
      fs.rmSync(TEST_DIR, { recursive: true, force: true });
    } catch (_) {}
  }
}

async function runRemediationTests() {
  console.log('====================================================');
  console.log('  MILESTONE 1 REMEDIATION VERIFICATION SUITE');
  console.log('====================================================\n');

  setup();

  try {
    const db = getDb();

    // -------------------------------------------------------------------------
    // TEST 1: saveUserDataSync Expenses and Will Vault Synchronization
    // -------------------------------------------------------------------------
    console.log('Test 1: saveUserDataSync synchronizes expenses and willVault to SQLite');
    const testUserId = 'test-rem-user-' + Date.now();
    const testUserEmail = `rem_${Date.now()}@example.com`;

    db.prepare(`
      INSERT INTO users (id, name, email, user_type, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(testUserId, 'Remediation User', testUserEmail, 'user', '2026-01-01', '2026-01-01');

    const sampleExpenses = [
      {
        id: 'exp-rem-1',
        amount: 25000,
        currency: 'INR',
        type: 'debit',
        transactionDate: '2026-05-15',
        merchantOrPayee: 'Property Tax Authority',
        description: 'Annual Municipal Property Tax',
        category: 'Tax & Legal',
        subCategory: 'Property Tax',
        paymentMethod: 'Net Banking',
        isTaxDeductible: true,
        receiptUrl: 'https://example.com/receipt1.pdf',
        notes: 'Section 24 deduction'
      },
      {
        id: 'exp-rem-2',
        amount: 150000,
        currency: 'INR',
        type: 'credit',
        transactionDate: '2026-05-20',
        merchantOrPayee: 'Tech Corp Client',
        description: 'Consulting Retainer',
        category: 'Income & Reimbursements',
        subCategory: 'Consulting',
        paymentMethod: 'Wire Transfer',
        isTaxDeductible: false,
        receiptUrl: '',
        notes: 'Professional income'
      }
    ];

    const sampleWillVault = {
      status: 'VERIFIED',
      vaultFileId: 'vault-file-uuid-1',
      encrypted_blob: 'encrypted-will-blob-base64',
      iv: 'iv-base64-1234',
      authTag: 'auth-tag-base64-5678',
      encrypted_dek: 'wrapped-dek-base64-9012',
      uploadedAt: '2026-03-01T10:00:00Z',
      verifiedAt: '2026-03-02T12:00:00Z',
      nominees: [
        {
          id: 'nom-1',
          name: 'Primary Beneficiary',
          email: 'beneficiary@example.com',
          phone: '+91 9876543210',
          relationship: 'Daughter',
          addedAt: '2026-03-01T10:00:00Z'
        }
      ],
      trigger_event: {
        nomineeId: 'nom-1',
        status: 'UNDER_REVIEW',
        proofFileName: 'death_certificate.pdf',
        submittedAt: '2026-03-05T00:00:00Z'
      }
    };

    const sampleWillDraft = {
      executor: 'Family Lawyer',
      primaryHeir: 'Daughter',
      clauses: ['Clause 1: Real estate to daughter', 'Clause 2: Liquid portfolio 50/50 split']
    };

    const userDataToSave = {
      ...defaultWealthData('Remediation User'),
      expenses: sampleExpenses,
      willVault: sampleWillVault,
      willDraft: sampleWillDraft
    };

    saveUserData(testUserId, userDataToSave, testUserId);

    // Verify in SQLite cashflow_transactions
    const expRows = db.prepare('SELECT * FROM cashflow_transactions WHERE user_id = ? ORDER BY amount ASC').all(testUserId);
    assert.strictEqual(expRows.length, 2, 'Must have 2 expense rows in cashflow_transactions');
    assert.strictEqual(expRows[0].id, 'exp-rem-1');
    assert.strictEqual(expRows[0].amount, 25000);
    assert.strictEqual(expRows[0].merchant_payee, 'Property Tax Authority');
    assert.strictEqual(expRows[0].is_tax_deductible, 1);
    assert.strictEqual(expRows[1].id, 'exp-rem-2');
    assert.strictEqual(expRows[1].amount, 150000);
    assert.strictEqual(expRows[1].type, 'credit');

    // Verify in SQLite will_vault
    const willRow = db.prepare('SELECT * FROM will_vault WHERE user_id = ?').get(testUserId);
    assert.ok(willRow, 'Will vault row must exist');
    assert.strictEqual(willRow.status, 'VERIFIED');
    assert.strictEqual(willRow.encrypted_blob, 'encrypted-will-blob-base64');
    assert.strictEqual(willRow.auth_tag, 'auth-tag-base64-5678');
    const parsedDraft = JSON.parse(willRow.will_draft_json);
    assert.strictEqual(parsedDraft.executor, 'Family Lawyer');

    // Verify in SQLite will_nominees
    const nomRows = db.prepare('SELECT * FROM will_nominees WHERE user_id = ?').all(testUserId);
    assert.strictEqual(nomRows.length, 1);
    assert.strictEqual(nomRows[0].name, 'Primary Beneficiary');

    // Verify getUserById reconstitutes expenses and willVault properly
    const reconstituted = getUserById(testUserId);
    assert.strictEqual(reconstituted.data.expenses.length, 2);
    assert.strictEqual(reconstituted.data.expenses[0].id, 'exp-rem-2'); // Sorted DESC by date
    assert.strictEqual(reconstituted.data.willVault.status, 'VERIFIED');
    assert.strictEqual(reconstituted.data.willVault.nominees.length, 1);
    assert.strictEqual(reconstituted.data.willDraft.executor, 'Family Lawyer');
    console.log('✅ saveUserDataSync correctly synchronized data.expenses and willVault into SQLite\n');

    // -------------------------------------------------------------------------
    // TEST 2: expenses.controller.js CRUD operations persistence
    // -------------------------------------------------------------------------
    console.log('Test 2: expenses.controller.js properly interfaces with user.data.expenses and SQLite');

    // Mock Express req/res
    function mockRes() {
      const res = {
        statusCode: 200,
        headers: {},
        body: null,
        status(code) { this.statusCode = code; return this; },
        json(data) { this.body = data; return this; }
      };
      return res;
    }

    const mockReqUser = { wealthUser: { id: testUserId, name: 'Remediation User', email: testUserEmail } };

    // 2A: Create Expense via Controller
    const createReq = {
      ...mockReqUser,
      body: {
        amount: 8500,
        merchantOrPayee: 'Oberoi Grand Hotel',
        category: 'Travel',
        description: 'Business Stay Dinner',
        isTaxDeductible: true,
        notes: 'Client meeting dinner'
      }
    };
    const createRes = mockRes();
    expensesController.createExpense(createReq, createRes);
    assert.strictEqual(createRes.statusCode, 201);
    assert.strictEqual(createRes.body.success, true);
    const createdExpId = createRes.body.data[0].id;
    assert.ok(createdExpId, 'Created expense must have an ID');

    // Verify persistence in SQLite
    const createdInDb = db.prepare('SELECT * FROM cashflow_transactions WHERE id = ?').get(createdExpId);
    assert.ok(createdInDb, 'Newly created expense must be in cashflow_transactions table');
    assert.strictEqual(createdInDb.amount, 8500);
    assert.strictEqual(createdInDb.merchant_payee, 'Oberoi Grand Hotel');

    // 2B: Get Expenses via Controller
    const getReq = { ...mockReqUser, query: {} };
    const getRes = mockRes();
    expensesController.getExpenses(getReq, getRes);
    assert.strictEqual(getRes.statusCode, 200);
    assert.strictEqual(getRes.body.success, true);
    assert.strictEqual(getRes.body.count, 3, 'Must have 3 total expenses now');

    // 2C: Update Expense via Controller
    const updateReq = {
      ...mockReqUser,
      params: { id: createdExpId },
      body: {
        amount: 9200,
        notes: 'Updated client meeting dinner note'
      }
    };
    const updateRes = mockRes();
    expensesController.updateExpense(updateReq, updateRes);
    assert.strictEqual(updateRes.statusCode, 200);
    assert.strictEqual(updateRes.body.expense.amount, 9200);

    const updatedInDb = db.prepare('SELECT * FROM cashflow_transactions WHERE id = ?').get(createdExpId);
    assert.strictEqual(updatedInDb.amount, 9200, 'Updated amount must be saved in SQLite');
    assert.strictEqual(updatedInDb.notes, 'Updated client meeting dinner note');

    // 2D: Delete Expense via Controller
    const deleteReq = {
      ...mockReqUser,
      params: { id: createdExpId }
    };
    const deleteRes = mockRes();
    expensesController.deleteExpense(deleteReq, deleteRes);
    assert.strictEqual(deleteRes.statusCode, 200);

    const deletedInDb = db.prepare('SELECT * FROM cashflow_transactions WHERE id = ?').get(createdExpId);
    assert.strictEqual(deletedInDb, undefined, 'Deleted expense must no longer exist in SQLite');
    console.log('✅ expenses.controller.js CRUD properly persisted and retrieved from SQLite\n');

    // -------------------------------------------------------------------------
    // TEST 3: withTransaction with explicit/custom DB handle
    // -------------------------------------------------------------------------
    console.log('Test 3: withTransaction supports explicit DB handle and custom paths');
    const customDbPath = path.join(TEST_DIR, 'custom-tx-test.db');
    const customDb = getDb(customDbPath);

    // Call withTransaction passing customDb instance directly
    withTransaction(d => {
      d.prepare('INSERT INTO users (id, name, email, created_at, updated_at) VALUES (?, ?, ?, ?, ?)').run(
        'custom-user-1', 'Custom DB User', 'custom@test.local', '2026-01-01', '2026-01-01'
      );
    }, 5, customDb);

    const checkCustomUser = customDb.prepare("SELECT * FROM users WHERE id = 'custom-user-1'").get();
    assert.ok(checkCustomUser, 'Record must be written to custom DB');
    assert.strictEqual(checkCustomUser.name, 'Custom DB User');

    // Verify main DB was not affected by custom DB transaction
    const checkMainDb = getDb(defaultDbPath).prepare("SELECT * FROM users WHERE id = 'custom-user-1'").get();
    assert.strictEqual(checkMainDb, undefined, 'Main DB must not have record inserted into custom DB');

    // Test nested savepoint on customDb
    withTransaction(d => {
      d.prepare('INSERT INTO users (id, name, email, created_at, updated_at) VALUES (?, ?, ?, ?, ?)').run(
        'custom-user-outer', 'Outer User', 'outer@test.local', '2026-01-01', '2026-01-01'
      );
      try {
        withTransaction(d2 => {
          d2.prepare('INSERT INTO assets (id, user_id, name, type, value, last_updated) VALUES (?, ?, ?, ?, ?, ?)').run(
            'fail-asset', 'custom-user-outer', 'Failing Asset', 'Stock', 1000, '2026-01-01'
          );
          throw new Error('FAIL_NESTED');
        }, 5, d);
      } catch (err) {
        assert.strictEqual(err.message, 'FAIL_NESTED');
      }
    }, 5, customDb);

    const outerCheck = customDb.prepare("SELECT * FROM users WHERE id = 'custom-user-outer'").get();
    const failAssetCheck = customDb.prepare("SELECT * FROM assets WHERE id = 'fail-asset'").get();
    assert.ok(outerCheck, 'Outer user on customDb must exist');
    assert.strictEqual(failAssetCheck, undefined, 'Failed nested asset on customDb must be rolled back');
    console.log('✅ withTransaction successfully executed transactions on explicit custom DB handles\n');

    // -------------------------------------------------------------------------
    // TEST 4: migrate.js Deterministic IDs
    // -------------------------------------------------------------------------
    console.log('Test 4: migrate.js deterministic ID generation on multiple runs');

    // Run migration twice on a test DB
    const migrationTestDbPath = path.join(TEST_DIR, 'migration-id-test.db');
    const migResult1 = runMigration({ customDbPath: migrationTestDbPath, force: true });
    assert.strictEqual(migResult1.success, true);

    const migDb = getDb(migrationTestDbPath);
    const usersRun1 = migDb.prepare('SELECT count(*) as c FROM users').get().c;
    const assetsRun1 = migDb.prepare('SELECT count(*) as c FROM assets').get().c;
    const auditRun1 = migDb.prepare('SELECT count(*) as c FROM audit_logs').get().c;
    const expRun1 = migDb.prepare('SELECT count(*) as c FROM cashflow_transactions').get().c;

    // Force re-run migration on same DB
    const migResult2 = runMigration({ customDbPath: migrationTestDbPath, force: true });
    assert.strictEqual(migResult2.success, true);

    const usersRun2 = migDb.prepare('SELECT count(*) as c FROM users').get().c;
    const assetsRun2 = migDb.prepare('SELECT count(*) as c FROM assets').get().c;
    const auditRun2 = migDb.prepare('SELECT count(*) as c FROM audit_logs').get().c;
    const expRun2 = migDb.prepare('SELECT count(*) as c FROM cashflow_transactions').get().c;

    assert.strictEqual(usersRun2, usersRun1, 'User count must remain identical on forced re-run');
    assert.strictEqual(assetsRun2, assetsRun1, 'Asset count must remain identical on forced re-run');
    assert.strictEqual(auditRun2, auditRun1, 'Audit logs count must remain identical (no duplicates)');
    assert.strictEqual(expRun2, expRun1, 'Expense count must remain identical (no duplicates)');

    console.log(`✅ Deterministic ID migration verified: Users (${usersRun2}), Assets (${assetsRun2}), Audit (${auditRun2}), Expenses (${expRun2}) preserved without duplication\n`);

    // Clean up test user in main DB
    withTransaction(d => {
      d.prepare('DELETE FROM users WHERE id = ?').run(testUserId);
    });

    console.log('====================================================');
    console.log('🎉 ALL MILESTONE 1 REMEDIATION TESTS PASSED!');
    console.log('====================================================\n');
  } finally {
    closeDb();
    cleanup();
  }
}

if (require.main === module) {
  runRemediationTests().catch(err => {
    console.error('\n❌ REMEDIATION TEST FAILED:', err);
    process.exit(1);
  });
}

module.exports = { runRemediationTests };
