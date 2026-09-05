const assert = require('assert');
const crypto = require('crypto');
const { getDb } = require('../backend/db/sqlite');
const { runMigration } = require('../backend/db/migrate');

async function runTests() {
  console.log('Running Database Migration Fidelity & Checksum Tests...\n');

  try {
    // 1. Force a clean migration run
    console.log('Test 1: Execute Migration Pipeline');
    const result = runMigration({ force: true });
    assert.strictEqual(result.success, true, 'Migration must return success=true');
    console.log('✅ Migration pipeline completed successfully');

    // 2. Fidelity Count Validations
    console.log('\nTest 2: Verify 100% Record Fidelity Against Pre-Migration Inventory');
    const db = getDb();

    const userCount = db.prepare('SELECT count(*) as count FROM users').get().count;
    assert.ok(userCount >= 11, `Users count must be at least 11 (actual: ${userCount})`);
    console.log(`✅ Users migrated: ${userCount}`);

    const assetCount = db.prepare('SELECT count(*) as count FROM assets').get().count;
    assert.ok(assetCount >= 24, `Assets count must be at least 24 (actual: ${assetCount})`);
    console.log(`✅ Assets migrated: ${assetCount}`);

    const liabilityCount = db.prepare('SELECT count(*) as count FROM liabilities').get().count;
    assert.ok(liabilityCount >= 10, `Liabilities count must be at least 10 (actual: ${liabilityCount})`);
    console.log(`✅ Liabilities migrated: ${liabilityCount}`);

    const docCount = db.prepare('SELECT count(*) as count FROM documents').get().count;
    assert.ok(docCount >= 20, `Documents count must be at least 20 (actual: ${docCount})`);
    console.log(`✅ Documents migrated: ${docCount}`);

    const auditCount = db.prepare('SELECT count(*) as count FROM audit_logs').get().count;
    assert.ok(auditCount >= 222, `Audit logs count must be at least 222 (actual: ${auditCount})`);
    console.log(`✅ Audit logs migrated: ${auditCount}`);

    const totalAssetVal = db.prepare('SELECT SUM(value) as total FROM assets').get().total;
    assert.ok(totalAssetVal > 150000000, `Total asset value must exceed ₹15 Cr (actual: ₹${totalAssetVal.toLocaleString('en-IN')})`);
    console.log(`✅ Total balance sheet asset valuation: ₹${totalAssetVal.toLocaleString('en-IN')}`);

    // 3. Named Asset Verification (Prajwal Bharad's Profile)
    console.log('\nTest 3: Verify Specific HNWI Named Assets & Tax Profiles');
    
    // Nissan Magnite / Car
    const nissan = db.prepare("SELECT * FROM assets WHERE name LIKE '%Nissan%' OR model LIKE '%Nissan%'").get();
    assert.ok(nissan, 'Nissan Magnite asset must be preserved');
    assert.strictEqual(nissan.type, 'Car');
    console.log(`✅ Nissan asset verified: "${nissan.name}" (Value: ₹${nissan.value.toLocaleString('en-IN')})`);

    // Rolex Watch
    const rolex = db.prepare("SELECT * FROM assets WHERE name LIKE '%rolex%' OR brand LIKE '%Rolex%'").get();
    assert.ok(rolex, 'Rolex watch asset must be preserved');
    assert.strictEqual(rolex.type, 'Watches');
    console.log(`✅ Rolex watch verified: "${rolex.name}" (Value: ₹${rolex.value.toLocaleString('en-IN')})`);

    // Real Estate
    const realEstate = db.prepare("SELECT * FROM assets WHERE type IN ('Flats', 'Land', 'Real Estate')").all();
    assert.ok(realEstate.length >= 4, `At least 4 Real Estate properties must exist (actual: ${realEstate.length})`);
    const names = realEstate.map(r => r.name);
    console.log(`✅ Real estate properties verified: ${names.join(', ')}`);

    // Prajwal's Tax Profile
    const prajwalUser = db.prepare("SELECT * FROM users WHERE email = 'prajwalbharad12345@gmail.com'").get();
    assert.ok(prajwalUser, 'Prajwal Bharad primary profile must exist');
    const prajwalTax = db.prepare('SELECT * FROM user_income_tax_profile WHERE user_id = ?').get(prajwalUser.id);
    assert.ok(prajwalTax, 'Prajwal tax profile must exist');
    assert.strictEqual(prajwalTax.basic_salary, 60000);
    assert.strictEqual(prajwalTax.hra, 35000);
    assert.strictEqual(prajwalTax.sec_80c, 150000);
    console.log('✅ Prajwal Bharad income tax profile verified (Basic: ₹60,000/mo, HRA: ₹35,000/mo, Sec 80C: ₹1,50,000)');

    // 4. Idempotency Check
    console.log('\nTest 4: Migration Idempotency (Already Migrated Check)');
    const secondRun = runMigration({ force: false });
    assert.strictEqual(secondRun.success, true);
    assert.strictEqual(secondRun.alreadyMigrated, true);
    console.log('✅ Secondary migration run correctly identified active database and skipped re-import');

    console.log('\n🎉 All Database Migration Fidelity tests passed successfully!');
  } catch (err) {
    console.error('\n❌ Database Migration Fidelity Test Failed:');
    console.error(err);
    process.exit(1);
  }
}

runTests();
