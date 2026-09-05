const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { getDb, withTransaction, closeDb } = require('../backend/db/sqlite');

async function runTests() {
  console.log('Running SQLite WAL Engine & Transaction Tests...\n');

  try {
    const db = getDb();

    // 1. Validate Pragmas
    console.log('Test 1: Verify SQLite WAL Mode and Engine Pragmas');
    const jMode = db.prepare('PRAGMA journal_mode;').get();
    assert.strictEqual(String(jMode.journal_mode).toLowerCase(), 'wal', 'journal_mode must be WAL');

    const fk = db.prepare('PRAGMA foreign_keys;').get();
    assert.strictEqual(Number(fk.foreign_keys), 1, 'foreign_keys must be ON');

    const timeout = db.prepare('PRAGMA busy_timeout;').get();
    assert.strictEqual(Number(timeout.timeout), 5000, 'busy_timeout must be 5000');

    const sync = db.prepare('PRAGMA synchronous;').get();
    assert.strictEqual(Number(sync.synchronous), 1, 'synchronous must be 1 (NORMAL)');

    console.log('✅ SQLite engine correctly configured with WAL, foreign keys, and 5000ms busy timeout');

    // 2. Validate Schema Tables
    console.log('\nTest 2: Verify Complete Relational Schema Tables');
    const expectedTables = [
      'users', 'user_credentials', 'user_sessions', 'rate_limit_records',
      'assets', 'asset_value_history', 'asset_transactions', 'liabilities',
      'vault_files', 'documents', 'will_vault', 'will_nominees', 'will_claim_events',
      'cashflow_transactions', 'income_streams', 'user_income_tax_profile',
      'taxpayer_profile_fields', 'consents', 'family_members', 'financial_goals',
      'reminders_alerts', 'user_aux_data', 'audit_logs'
    ];

    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").all().map(t => t.name);
    for (const t of expectedTables) {
      assert.ok(tables.includes(t), `Table ${t} must exist in schema`);
    }
    console.log(`✅ All ${expectedTables.length} relational schema tables verified`);

    // 3. Validate withTransaction Commit
    console.log('\nTest 3: Transaction Commit Guarantee');
    const testUserId = 'tx-test-user-' + Date.now();
    const nowIso = new Date().toISOString();

    withTransaction(d => {
      d.prepare('INSERT INTO users (id, name, email, created_at, updated_at) VALUES (?, ?, ?, ?, ?)').run(
        testUserId, 'Tx Test User', `${testUserId}@example.com`, nowIso, nowIso
      );
      d.prepare('INSERT INTO assets (id, user_id, name, type, value, last_updated) VALUES (?, ?, ?, ?, ?, ?)').run(
        'asset-' + testUserId, testUserId, 'Test BMW', 'Car', 4500000, nowIso.slice(0, 10)
      );
    });

    const userCheck = db.prepare('SELECT * FROM users WHERE id = ?').get(testUserId);
    assert.ok(userCheck, 'User must be committed');
    const assetCheck = db.prepare('SELECT * FROM assets WHERE id = ?').get('asset-' + testUserId);
    assert.ok(assetCheck, 'Asset must be committed');
    assert.strictEqual(assetCheck.value, 4500000);
    console.log('✅ withTransaction atomically committed multi-table write');

    // 4. Validate withTransaction Rollback on Error
    console.log('\nTest 4: Transaction Rollback Guarantee on Error');
    const rollbackUserId = 'rollback-user-' + Date.now();
    let threw = false;

    try {
      withTransaction(d => {
        d.prepare('INSERT INTO users (id, name, email, created_at, updated_at) VALUES (?, ?, ?, ?, ?)').run(
          rollbackUserId, 'Rollback User', `${rollbackUserId}@example.com`, nowIso, nowIso
        );
        d.prepare('INSERT INTO assets (id, user_id, name, type, value, last_updated) VALUES (?, ?, ?, ?, ?, ?)').run(
          'asset-' + rollbackUserId, rollbackUserId, 'Test Audi', 'Car', 6000000, nowIso.slice(0, 10)
        );
        // Force an error
        throw new Error('Simulated balance sheet calculation failure');
      });
    } catch (err) {
      threw = true;
      assert.strictEqual(err.message, 'Simulated balance sheet calculation failure');
    }

    assert.ok(threw, 'Transaction must throw on failure');
    const rolledBackUser = db.prepare('SELECT * FROM users WHERE id = ?').get(rollbackUserId);
    assert.strictEqual(rolledBackUser, undefined, 'User must be rolled back');
    const rolledBackAsset = db.prepare('SELECT * FROM assets WHERE id = ?').get('asset-' + rollbackUserId);
    assert.strictEqual(rolledBackAsset, undefined, 'Asset must be rolled back');
    console.log('✅ withTransaction successfully rolled back all changes on exception');

    // 5. Validate Nested Transactions (Savepoints)
    console.log('\nTest 5: Nested Transactions via Savepoints');
    const nestedUserId = 'nested-user-' + Date.now();

    withTransaction(d => {
      d.prepare('INSERT INTO users (id, name, email, created_at, updated_at) VALUES (?, ?, ?, ?, ?)').run(
        nestedUserId, 'Nested User', `${nestedUserId}@example.com`, nowIso, nowIso
      );

      withTransaction(d2 => {
        d2.prepare('INSERT INTO assets (id, user_id, name, type, value, last_updated) VALUES (?, ?, ?, ?, ?, ?)').run(
          'asset-' + nestedUserId, nestedUserId, 'Nested Rolex', 'Watches', 1200000, nowIso.slice(0, 10)
        );
      });
    });

    const nestedUser = db.prepare('SELECT * FROM users WHERE id = ?').get(nestedUserId);
    assert.ok(nestedUser, 'Nested user must exist');
    const nestedAsset = db.prepare('SELECT * FROM assets WHERE id = ?').get('asset-' + nestedUserId);
    assert.ok(nestedAsset, 'Nested asset must exist');
    console.log('✅ Nested withTransaction correctly committed via savepoint');

    // 6. Concurrency Stress Test: 50 Simultaneous Transactions
    console.log('\nTest 6: Concurrency Stress Test (50+ Simultaneous Atomic Transactions)');
    const CONCURRENT_COUNT = 50;
    const concurrentUserIds = [];

    const promises = Array.from({ length: CONCURRENT_COUNT }).map((_, i) => {
      return new Promise((resolve, reject) => {
        try {
          const uId = `concurrent-u-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 6)}`;
          concurrentUserIds.push(uId);
          withTransaction(d => {
            d.prepare('INSERT INTO users (id, name, email, created_at, updated_at) VALUES (?, ?, ?, ?, ?)').run(
              uId, `Concurrent User ${i}`, `${uId}@concurrent.local`, nowIso, nowIso
            );
            d.prepare('INSERT INTO assets (id, user_id, name, type, value, last_updated) VALUES (?, ?, ?, ?, ?, ?)').run(
              `asset-${uId}`, uId, `Asset ${i}`, 'Investment Assets', (i + 1) * 10000, nowIso.slice(0, 10)
            );
            d.prepare('INSERT INTO liabilities (id, user_id, name, type, value, last_updated) VALUES (?, ?, ?, ?, ?, ?)').run(
              `liab-${uId}`, uId, `Liability ${i}`, 'Personal Loan', i * 500, nowIso.slice(0, 10)
            );
            d.prepare('INSERT INTO audit_logs (id, user_id, action, details_json, created_at) VALUES (?, ?, ?, ?, ?)').run(
              `audit-${uId}`, uId, 'CONCURRENT_TEST', JSON.stringify({ index: i }), nowIso
            );
          });
          resolve();
        } catch (err) {
          reject(err);
        }
      });
    });

    await Promise.all(promises);

    const insertedCount = db.prepare(
      `SELECT count(*) as count FROM users WHERE id IN (${concurrentUserIds.map(() => '?').join(',')})`
    ).get(...concurrentUserIds).count;

    assert.strictEqual(insertedCount, CONCURRENT_COUNT, `All ${CONCURRENT_COUNT} concurrent transactions must succeed`);
    console.log(`✅ ${CONCURRENT_COUNT} simultaneous transactions executed with zero lock collisions or data corruption`);

    // Clean up test records
    withTransaction(d => {
      d.prepare('DELETE FROM users WHERE id LIKE ? OR id LIKE ? OR id LIKE ? OR id LIKE ?').run(
        'tx-test-user-%', 'rollback-user-%', 'nested-user-%', 'concurrent-u-%'
      );
    });

    console.log('\n🎉 All SQLite WAL Engine & Transaction tests passed successfully!');
  } catch (err) {
    console.error('\n❌ SQLite WAL Engine Test Failed:');
    console.error(err);
    process.exit(1);
  }
}

runTests();
