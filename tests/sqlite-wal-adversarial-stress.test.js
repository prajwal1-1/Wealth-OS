const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');
const { spawn } = require('child_process');
const { getDb, withTransaction, closeDb, defaultDbPath } = require('../backend/db/sqlite');

// If executed as a worker thread:
if (!isMainThread) {
  const { workerId, numTransactions, testDbPath, mode } = workerData;
  const { DatabaseSync } = require('node:sqlite');
  
  // Independent thread database connection
  const db = new DatabaseSync(testDbPath);
  db.exec('PRAGMA journal_mode = WAL;');
  db.exec('PRAGMA synchronous = NORMAL;');
  db.exec('PRAGMA busy_timeout = 5000;');
  db.exec('PRAGMA foreign_keys = ON;');

  function threadWithTransaction(callback, maxRetries = 10) {
    let attempts = 0;
    while (attempts < maxRetries) {
      try {
        db.exec('BEGIN IMMEDIATE');
        try {
          const res = callback(db);
          db.exec('COMMIT');
          return res;
        } catch (err) {
          try { db.exec('ROLLBACK'); } catch (_) {}
          throw err;
        }
      } catch (err) {
        const isBusy = err.message && (
          err.message.includes('busy') || 
          err.message.includes('locked') || 
          err.code === 'SQLITE_BUSY'
        );
        if (isBusy && attempts < maxRetries - 1) {
          attempts++;
          const delay = Math.floor(Math.random() * 40) + (attempts * 20);
          const end = Date.now() + delay;
          while (Date.now() < end) {}
          continue;
        }
        throw err;
      }
    }
  }

  try {
    if (mode === 'multi_table_inserts') {
      let succeeded = 0;
      const nowIso = new Date().toISOString();
      for (let i = 0; i < numTransactions; i++) {
        const uId = `w-${workerId}-tx-${i}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        threadWithTransaction(d => {
          d.prepare('INSERT INTO users (id, name, email, created_at, updated_at) VALUES (?, ?, ?, ?, ?)').run(
            uId, `Worker User ${workerId}-${i}`, `${uId}@stress.local`, nowIso, nowIso
          );
          d.prepare('INSERT INTO assets (id, user_id, name, type, value, last_updated) VALUES (?, ?, ?, ?, ?, ?)').run(
            `asset-${uId}`, uId, `Asset ${i}`, 'Real Estate', 5000000 + (i * 1000), nowIso.slice(0, 10)
          );
          d.prepare('INSERT INTO liabilities (id, user_id, name, type, value, last_updated) VALUES (?, ?, ?, ?, ?, ?)').run(
            `liab-${uId}`, uId, `Liability ${i}`, 'Mortgage', 2000000 + (i * 500), nowIso.slice(0, 10)
          );
          d.prepare('INSERT INTO audit_logs (id, user_id, action, details_json, created_at) VALUES (?, ?, ?, ?, ?)').run(
            `audit-${uId}`, uId, 'WORKER_STRESS_WRITE', JSON.stringify({ workerId, txIndex: i }), nowIso
          );
        });
        succeeded++;
      }
      parentPort.postMessage({ status: 'ok', workerId, succeeded });
    } else if (mode === 'sum_invariance_transfers') {
      const { accounts, totalTransfers } = workerData;
      let transfersDone = 0;
      for (let i = 0; i < totalTransfers; i++) {
        const fromIdx = Math.floor(Math.random() * accounts.length);
        let toIdx = Math.floor(Math.random() * accounts.length);
        while (toIdx === fromIdx) {
          toIdx = Math.floor(Math.random() * accounts.length);
        }
        const fromId = accounts[fromIdx];
        const toId = accounts[toIdx];
        const amount = Math.floor(Math.random() * 5000) + 100;

        threadWithTransaction(d => {
          const fromRow = d.prepare('SELECT value FROM assets WHERE id = ?').get(fromId);
          if (fromRow && fromRow.value >= amount) {
            d.prepare('UPDATE assets SET value = value - ? WHERE id = ?').run(amount, fromId);
            d.prepare('UPDATE assets SET value = value + ? WHERE id = ?').run(amount, toId);
            d.prepare('INSERT INTO asset_transactions (id, asset_id, type, date, price, proceeds) VALUES (?, ?, ?, ?, ?, ?)').run(
              `tx-${workerId}-${i}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, fromId, 'TRANSFER', new Date().toISOString().slice(0, 10), amount, -amount
            );
          }
        });
        transfersDone++;
      }
      parentPort.postMessage({ status: 'ok', workerId, transfersDone });
    }
  } catch (err) {
    parentPort.postMessage({ status: 'error', workerId, error: err.message, stack: err.stack });
  } finally {
    try { db.close(); } catch (_) {}
  }
  return;
}

// Helper for main thread transactions on custom DB path
function execCustomTransaction(db, callback, maxRetries = 10) {
  let attempts = 0;
  while (attempts < maxRetries) {
    try {
      db.exec('BEGIN IMMEDIATE');
      try {
        const res = callback(db);
        db.exec('COMMIT');
        return res;
      } catch (err) {
        try { db.exec('ROLLBACK'); } catch (_) {}
        throw err;
      }
    } catch (err) {
      const isBusy = err.message && (
        err.message.includes('busy') || 
        err.message.includes('locked') || 
        err.code === 'SQLITE_BUSY'
      );
      if (isBusy && attempts < maxRetries - 1) {
        attempts++;
        const delay = Math.floor(Math.random() * 40) + (attempts * 20);
        const end = Date.now() + delay;
        while (Date.now() < end) {}
        continue;
      }
      throw err;
    }
  }
}

// MAIN THREAD TEST RUNNER
async function runAdversarialStressTests() {
  console.log('================================================================');
  console.log('  EMPIRICAL ADVERSARIAL STRESS HARNESS — SQLITE WAL ENGINE');
  console.log('================================================================\n');

  const testDbDir = path.resolve(__dirname, '..', 'storage', 'database');
  const stressDbPath = path.join(testDbDir, 'wealth-os-stress-test.db');

  // Clean up any prior stress test database
  function cleanupStressDb() {
    closeDb();
    const files = [stressDbPath, `${stressDbPath}-wal`, `${stressDbPath}-shm`];
    for (const f of files) {
      if (fs.existsSync(f)) {
        try { fs.unlinkSync(f); } catch (_) {}
      }
    }
  }

  cleanupStressDb();

  try {
    // Initialize schema on stress database
    let db = getDb(stressDbPath);

    // =========================================================================
    // TEST 1: 120 CONCURRENT TRANSACTIONS ACROSS 12 PARALLEL WORKER THREADS
    // =========================================================================
    console.log('TEST 1: True Parallel High-Concurrency (120 Atomic Transactions across 12 Worker Threads)');
    const NUM_WORKERS = 12;
    const TX_PER_WORKER = 10;
    const EXPECTED_TOTAL_TX = NUM_WORKERS * TX_PER_WORKER; // 120 transactions

    const startTime = Date.now();
    const workerPromises = [];

    for (let w = 0; w < NUM_WORKERS; w++) {
      workerPromises.push(new Promise((resolve, reject) => {
        const worker = new Worker(__filename, {
          workerData: {
            workerId: w,
            numTransactions: TX_PER_WORKER,
            testDbPath: stressDbPath,
            mode: 'multi_table_inserts'
          }
        });

        worker.on('message', msg => {
          if (msg.status === 'ok') resolve(msg);
          else reject(new Error(`Worker ${msg.workerId} failed: ${msg.error}`));
        });
        worker.on('error', reject);
        worker.on('exit', code => {
          if (code !== 0) reject(new Error(`Worker exited with code ${code}`));
        });
      }));
    }

    const results = await Promise.all(workerPromises);
    const elapsed = Date.now() - startTime;
    const totalSucceeded = results.reduce((acc, r) => acc + r.succeeded, 0);

    console.log(`  -> Executed ${totalSucceeded} concurrent multi-table transactions in ${elapsed}ms (${(totalSucceeded / (elapsed / 1000)).toFixed(2)} tx/s)`);

    // Verify row counts across all affected tables
    const userCount = db.prepare("SELECT count(*) as c FROM users WHERE email LIKE '%@stress.local'").get().c;
    const assetCount = db.prepare("SELECT count(*) as c FROM assets WHERE name LIKE 'Asset %'").get().c;
    const liabCount = db.prepare("SELECT count(*) as c FROM liabilities WHERE name LIKE 'Liability %'").get().c;
    const auditCount = db.prepare("SELECT count(*) as c FROM audit_logs WHERE action = 'WORKER_STRESS_WRITE'").get().c;

    assert.strictEqual(totalSucceeded, EXPECTED_TOTAL_TX, `Expected ${EXPECTED_TOTAL_TX} transactions to succeed`);
    assert.strictEqual(userCount, EXPECTED_TOTAL_TX, `Users count must match ${EXPECTED_TOTAL_TX}`);
    assert.strictEqual(assetCount, EXPECTED_TOTAL_TX, `Assets count must match ${EXPECTED_TOTAL_TX}`);
    assert.strictEqual(liabCount, EXPECTED_TOTAL_TX, `Liabilities count must match ${EXPECTED_TOTAL_TX}`);
    assert.strictEqual(auditCount, EXPECTED_TOTAL_TX, `Audit logs count must match ${EXPECTED_TOTAL_TX}`);

    console.log(`  -> Verified ${userCount} users, ${assetCount} assets, ${liabCount} liabilities, ${auditCount} audit logs`);
    console.log('✅ PASS: 120 concurrent multi-worker transactions committed with 100% integrity and zero lost updates\n');

    // =========================================================================
    // TEST 2: SUM INVARIANCE UNDER CONCURRENT TRANSFERS (CONSERVATION OF WEALTH)
    // =========================================================================
    console.log('TEST 2: Financial Sum Invariance & Wealth Conservation (100 Concurrent Transfers)');
    const transferUserId = 'transfer-user-' + Date.now();
    const nowIso = new Date().toISOString();
    const INITIAL_PER_ACCOUNT = 1000000; // ₹10,00,000
    const ACCOUNTS_COUNT = 4;
    const EXPECTED_SUM = INITIAL_PER_ACCOUNT * ACCOUNTS_COUNT; // ₹40,00,000

    const accountIds = [];
    execCustomTransaction(db, d => {
      d.prepare('INSERT INTO users (id, name, email, created_at, updated_at) VALUES (?, ?, ?, ?, ?)').run(
        transferUserId, 'Transfer User', `${transferUserId}@example.com`, nowIso, nowIso
      );
      for (let a = 0; a < ACCOUNTS_COUNT; a++) {
        const accId = `acc-${transferUserId}-${a}`;
        accountIds.push(accId);
        d.prepare('INSERT INTO assets (id, user_id, name, type, value, last_updated) VALUES (?, ?, ?, ?, ?, ?)').run(
          accId, transferUserId, `Account ${a}`, 'Bank Account', INITIAL_PER_ACCOUNT, nowIso.slice(0, 10)
        );
      }
    });

    const preSum = db.prepare(
      `SELECT sum(value) as total FROM assets WHERE id IN (${accountIds.map(() => '?').join(',')})`
    ).get(...accountIds).total;
    assert.strictEqual(preSum, EXPECTED_SUM, `Initial sum must be ${EXPECTED_SUM}`);

    // Spawn 10 workers performing 10 concurrent transfers each = 100 total concurrent transfers
    const TRANSFER_WORKERS = 10;
    const TRANSFERS_PER_WORKER = 10;
    const transferPromises = [];

    for (let w = 0; w < TRANSFER_WORKERS; w++) {
      transferPromises.push(new Promise((resolve, reject) => {
        const worker = new Worker(__filename, {
          workerData: {
            workerId: w + 100,
            accounts: accountIds,
            totalTransfers: TRANSFERS_PER_WORKER,
            testDbPath: stressDbPath,
            mode: 'sum_invariance_transfers'
          }
        });
        worker.on('message', msg => {
          if (msg.status === 'ok') resolve(msg);
          else reject(new Error(`Transfer worker ${msg.workerId} failed: ${msg.error}`));
        });
        worker.on('error', reject);
      }));
    }

    await Promise.all(transferPromises);

    const postSum = db.prepare(
      `SELECT sum(value) as total FROM assets WHERE id IN (${accountIds.map(() => '?').join(',')})`
    ).get(...accountIds).total;

    const accountRows = db.prepare(
      `SELECT id, name, value FROM assets WHERE id IN (${accountIds.map(() => '?').join(',')})`
    ).all(...accountIds);

    console.log('  -> Final account balances post 100 concurrent transfers:');
    accountRows.forEach(r => console.log(`     * ${r.name} (${r.id}): ₹${r.value.toLocaleString('en-IN')}`));
    console.log(`  -> Initial Sum: ₹${preSum.toLocaleString('en-IN')} | Post-Transfer Sum: ₹${postSum.toLocaleString('en-IN')}`);

    assert.strictEqual(postSum, EXPECTED_SUM, `Sum invariance violated! Expected ${EXPECTED_SUM}, got ${postSum}`);
    console.log('✅ PASS: Sum Invariance strictly maintained across 100 concurrent transfers (Discrepancy: ₹0.00)\n');

    // =========================================================================
    // TEST 3: TRANSACTION ROLLBACK & UNTOUCHED STATE ON RUNTIME EXCEPTION
    // =========================================================================
    console.log('TEST 3: Transaction Rollback Integrity on Multi-Table Exception');
    const failUserId = 'fail-user-' + Date.now();
    let caughtException = false;

    try {
      execCustomTransaction(db, d => {
        d.prepare('INSERT INTO users (id, name, email, created_at, updated_at) VALUES (?, ?, ?, ?, ?)').run(
          failUserId, 'Failing User', `${failUserId}@example.com`, nowIso, nowIso
        );
        d.prepare('INSERT INTO assets (id, user_id, name, type, value, last_updated) VALUES (?, ?, ?, ?, ?, ?)').run(
          `asset-${failUserId}`, failUserId, 'Ghost Asset', 'Art', 999999, nowIso.slice(0, 10)
        );
        d.prepare('INSERT INTO liabilities (id, user_id, name, type, value, last_updated) VALUES (?, ?, ?, ?, ?, ?)').run(
          `liab-${failUserId}`, failUserId, 'Ghost Debt', 'Credit Card', 50000, nowIso.slice(0, 10)
        );
        // Deliberate throw to trigger rollback
        throw new Error('SIMULATED_ABORT_AFTER_3_TABLE_WRITES');
      });
    } catch (err) {
      caughtException = true;
      assert.strictEqual(err.message, 'SIMULATED_ABORT_AFTER_3_TABLE_WRITES');
    }

    assert.ok(caughtException, 'Exception should have been thrown and caught');
    const ghostUser = db.prepare('SELECT * FROM users WHERE id = ?').get(failUserId);
    const ghostAsset = db.prepare('SELECT * FROM assets WHERE id = ?').get(`asset-${failUserId}`);
    const ghostLiab = db.prepare('SELECT * FROM liabilities WHERE id = ?').get(`liab-${failUserId}`);

    assert.strictEqual(ghostUser, undefined, 'User must not exist after rollback');
    assert.strictEqual(ghostAsset, undefined, 'Asset must not exist after rollback');
    assert.strictEqual(ghostLiab, undefined, 'Liability must not exist after rollback');

    console.log('✅ PASS: Atomic rollback verified; 0 orphan rows left in any table on aborted transaction\n');

    // =========================================================================
    // TEST 4: POWER LOSS / PROCESS CRASH SIMULATION & WAL RECOVERY
    // =========================================================================
    console.log('TEST 4: Power Loss / SIGKILL Simulation & WAL Recovery');
    const crashScript = `
      const { DatabaseSync } = require('node:sqlite');
      const db = new DatabaseSync('${stressDbPath.replace(/\\/g, '\\\\')}');
      db.exec('PRAGMA journal_mode = WAL;');
      db.exec('PRAGMA synchronous = NORMAL;');
      db.exec('PRAGMA busy_timeout = 5000;');
      db.exec('PRAGMA foreign_keys = ON;');

      // Pre-create user so foreign key succeeds
      db.exec("INSERT INTO users (id, name, email, created_at, updated_at) VALUES ('crash-u', 'Crash User', 'crash@u.local', '2026-08-29', '2026-08-29')");

      // Signal parent we are starting dirty transaction
      process.stdout.write('READY_FOR_DIRTY_WRITE\\n');

      db.exec('BEGIN IMMEDIATE');
      for (let i = 0; i < 500; i++) {
        db.prepare("INSERT INTO audit_logs (id, user_id, action, details_json, created_at) VALUES (?, ?, ?, ?, ?)").run(
          'uncommitted-' + i, 'crash-u', 'DIRTY_WRITE', '{}', '2026-08-29'
        );
      }
      process.stdout.write('DIRTY_WRITE_DONE\\n');
      // Intentionally hang without commit to allow SIGKILL
      setTimeout(() => {}, 60000);
    `;

    const crashScriptPath = path.join(testDbDir, 'crash_sim_child.js');
    fs.writeFileSync(crashScriptPath, crashScript, 'utf8');

    closeDb(); // Close main thread connection during child write

    const child = spawn('node', [crashScriptPath], { stdio: ['pipe', 'pipe', 'inherit'] });
    await new Promise((resolve, reject) => {
      child.stdout.on('data', data => {
        const text = data.toString();
        if (text.includes('DIRTY_WRITE_DONE')) {
          // Immediately kill child abruptly to simulate power loss / ungraceful abort
          child.kill('SIGKILL');
          resolve();
        }
      });
      child.on('error', reject);
    });

    try { fs.unlinkSync(crashScriptPath); } catch (_) {}

    // Wait a brief moment for OS file locks to clear
    await new Promise(r => setTimeout(r, 600));

    // Reopen database with fresh connection
    const recoveredDb = getDb(stressDbPath);

    // Verify WAL recovery rolled back all 500 dirty uncommitted writes
    const uncommittedRows = recoveredDb.prepare("SELECT count(*) as c FROM audit_logs WHERE id LIKE 'uncommitted-%'").get().c;
    assert.strictEqual(uncommittedRows, 0, `Dirty uncommitted rows must be 0, found ${uncommittedRows}`);

    // Verify that the committed user before the uncommitted transaction is preserved
    const preCrashUser = recoveredDb.prepare("SELECT * FROM users WHERE id = 'crash-u'").get();
    assert.ok(preCrashUser, 'Committed user prior to crash must be intact');

    // Verify integrity of stress DB immediately after WAL recovery
    const stressIntegrity = recoveredDb.prepare('PRAGMA integrity_check;').all();
    assert.strictEqual(stressIntegrity[0].integrity_check, 'ok', 'Stress DB integrity_check must return ok');

    const stressQuick = recoveredDb.prepare('PRAGMA quick_check;').all();
    assert.strictEqual(stressQuick[0].quick_check, 'ok', 'Stress DB quick_check must return ok');

    const stressFk = recoveredDb.prepare('PRAGMA foreign_key_check;').all();
    assert.strictEqual(stressFk.length, 0, `Stress DB foreign_key_check must have 0 errors, got ${stressFk.length}`);
    console.log('  -> Stress DB: PRAGMA integrity_check = ok, quick_check = ok, FK errors = 0');
    console.log('✅ PASS: Power-loss / SIGKILL crash test recovered cleanly via WAL with 0 dirty rows leaked\n');

    // =========================================================================
    // TEST 5: NESTED SAVEPOINT PARTIAL ROLLBACK ISOLATION
    // =========================================================================
    console.log('TEST 5: Nested Savepoint Partial Rollback Isolation');
    const nestedTestUser = 'nested-iso-' + Date.now();
    withTransaction(d => {
      // 1. Insert user in outer transaction
      d.prepare('INSERT INTO users (id, name, email, created_at, updated_at) VALUES (?, ?, ?, ?, ?)').run(
        nestedTestUser, 'Outer User', `${nestedTestUser}@example.com`, nowIso, nowIso
      );

      // 2. Nested transaction that fails
      try {
        withTransaction(d2 => {
          d2.prepare('INSERT INTO assets (id, user_id, name, type, value, last_updated) VALUES (?, ?, ?, ?, ?, ?)').run(
            'asset-fail-' + nestedTestUser, nestedTestUser, 'Failing Asset', 'Stock', 500000, nowIso.slice(0, 10)
          );
          throw new Error('NESTED_SAVEPOINT_ABORT');
        });
      } catch (nestedErr) {
        assert.strictEqual(nestedErr.message, 'NESTED_SAVEPOINT_ABORT');
      }

      // 3. Insert asset in outer transaction after inner failure
      d.prepare('INSERT INTO assets (id, user_id, name, type, value, last_updated) VALUES (?, ?, ?, ?, ?, ?)').run(
        'asset-ok-' + nestedTestUser, nestedTestUser, 'Successful Asset', 'Stock', 800000, nowIso.slice(0, 10)
      );
    });

    const outerUserCheck = getDb().prepare('SELECT * FROM users WHERE id = ?').get(nestedTestUser);
    const failedAssetCheck = getDb().prepare('SELECT * FROM assets WHERE id = ?').get('asset-fail-' + nestedTestUser);
    const successfulAssetCheck = getDb().prepare('SELECT * FROM assets WHERE id = ?').get('asset-ok-' + nestedTestUser);

    assert.ok(outerUserCheck, 'Outer user must exist');
    assert.strictEqual(failedAssetCheck, undefined, 'Failed nested asset must be rolled back');
    assert.ok(successfulAssetCheck, 'Successful outer asset must exist');
    assert.strictEqual(successfulAssetCheck.value, 800000);

    // Cleanup nested test records
    withTransaction(d => {
      d.prepare('DELETE FROM users WHERE id = ?').run(nestedTestUser);
    });

    console.log('✅ PASS: Nested savepoint rollback isolated: inner failure rolled back without corrupting outer commit\n');

    // =========================================================================
    // TEST 6: PRAGMA INTEGRITY CHECKS (PRODUCTION DB)
    // =========================================================================
    console.log('TEST 6: PRAGMA Integrity Checks on Production DB');
    
    // Check Production DB (wealth-os.db)
    const prodDb = getDb(defaultDbPath);
    const prodIntegrity = prodDb.prepare('PRAGMA integrity_check;').all();
    assert.strictEqual(prodIntegrity[0].integrity_check, 'ok', 'Production DB integrity_check must return ok');

    const prodFk = prodDb.prepare('PRAGMA foreign_key_check;').all();
    assert.strictEqual(prodFk.length, 0, `Production DB foreign_key_check must have 0 errors, got ${prodFk.length}`);
    console.log('  -> Production DB (wealth-os.db): PRAGMA integrity_check = ok, FK errors = 0');

    console.log('✅ PASS: Production database integrity check and foreign key validations passed with 100% clean status\n');

    // =========================================================================
    // TEST 7: PRODUCTION DB CONCURRENCY STRESS (100 CONCURRENT TXS ON PROD DB)
    // =========================================================================
    console.log('TEST 7: Production DB Concurrency Stress (100 Concurrent Writes on wealth-os.db)');
    const PROD_WORKERS = 10;
    const PROD_TX_PER_WORKER = 10;
    const prodWorkerPromises = [];

    for (let w = 0; w < PROD_WORKERS; w++) {
      prodWorkerPromises.push(new Promise((resolve, reject) => {
        const worker = new Worker(__filename, {
          workerData: {
            workerId: w + 200,
            numTransactions: PROD_TX_PER_WORKER,
            testDbPath: defaultDbPath,
            mode: 'multi_table_inserts'
          }
        });

        worker.on('message', msg => {
          if (msg.status === 'ok') resolve(msg);
          else reject(new Error(`Prod Worker ${msg.workerId} failed: ${msg.error}`));
        });
        worker.on('error', reject);
        worker.on('exit', code => {
          if (code !== 0) reject(new Error(`Prod Worker exited with code ${code}`));
        });
      }));
    }

    const prodResults = await Promise.all(prodWorkerPromises);
    const prodSucceeded = prodResults.reduce((acc, r) => acc + r.succeeded, 0);
    assert.strictEqual(prodSucceeded, PROD_WORKERS * PROD_TX_PER_WORKER);
    console.log(`  -> Successfully committed ${prodSucceeded} concurrent transactions on production database`);

    // Clean up production DB stress test user records
    withTransaction(d => {
      d.prepare("DELETE FROM users WHERE email LIKE '%@stress.local'").run();
    });

    const prodPostIntegrity = prodDb.prepare('PRAGMA integrity_check;').all();
    assert.strictEqual(prodPostIntegrity[0].integrity_check, 'ok');
    console.log('✅ PASS: Production database maintained integrity and clean state post-concurrency load\n');

    // Cleanup stress db files
    cleanupStressDb();

    console.log('================================================================');
    console.log('  ALL EMPIRICAL CHALLENGER STRESS TESTS PASSED (VERDICT: APPROVE)');
    console.log('================================================================');
  } catch (err) {
    console.error('\n❌ ADVERSARIAL STRESS TEST FAILED:');
    console.error(err);
    cleanupStressDb();
    process.exit(1);
  }
}

if (isMainThread) {
  runAdversarialStressTests();
}
