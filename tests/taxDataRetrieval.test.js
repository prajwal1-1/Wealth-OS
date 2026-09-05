const assert = require('assert');
const TaxNormalizer = require('../backend/utils/taxNormalizer');
const MockTaxDataProvider = require('../backend/services/taxIntegration/MockTaxDataProvider');

async function runTests() {
  console.log('Running Tax Data Retrieval Tests...\n');
  try {
    const provider = new MockTaxDataProvider();

    // 1. Mock Provider Retrieval Tests
    console.log('Test 1: Provider returns strictly formatted metadata wrapper');
    const tdsData = await provider.getTDSData('ABCDE1234F', '2026');
    assert.strictEqual(tdsData.length, 2);
    assert.strictEqual(tdsData[0].metadata.source, 'MOCK_SANDBOX');
    assert.strictEqual(tdsData[0].metadata.data_status, 'ACTIVE');
    assert.ok(tdsData[0].metadata.source_reference.startsWith('MOCK-TDS'));
    assert.ok(tdsData[0].metadata.retrieved_at);
    assert.strictEqual(tdsData[0].value.deductor, 'TECH CORP LTD');
    assert.strictEqual(tdsData[0].value.amount, 45000);

    const aisData = await provider.getTaxInformation('ABCDE1234F', '2026');
    assert.strictEqual(aisData.length, 1);
    assert.strictEqual(aisData[0].metadata.source_reference, 'MOCK-AIS-2026-1');
    assert.strictEqual(aisData[0].value.category, 'Dividend');

    const itrData = await provider.getReturnInformation('ABCDE1234F', '2026');
    assert.strictEqual(itrData[0].value.form, 'ITR-1');

    // 2. Normalization Engine Tests
    console.log('Test 2: Normalization Engine Deduplication');
    const existingRecords = [
      { value: { amount: 1000 }, metadata: { source_reference: 'MOCK-TDS-2026-1' } }, // Existing mock record
      { value: { amount: 500 } } // User provided (no metadata)
    ];

    const newRecords = [
      { value: { amount: 1000 }, metadata: { source_reference: 'MOCK-TDS-2026-1' } }, // Duplicate! Should be skipped
      { value: { amount: 2000 }, metadata: { source_reference: 'MOCK-TDS-2026-3' } }  // New
    ];

    const merged = TaxNormalizer.deduplicate(existingRecords, newRecords);
    
    // We expect 3 records: The 2 existing ones, plus the 1 new one. The duplicate is dropped.
    assert.strictEqual(merged.length, 3);
    assert.strictEqual(merged[2].metadata.source_reference, 'MOCK-TDS-2026-3');

    console.log('Test 3: Normalization Calculator');
    const totalTds = TaxNormalizer.calculateTotalTDS(tdsData);
    assert.strictEqual(totalTds, 46500); // 45000 + 1500

    console.log('\n✅ All automated tests completed successfully.');
  } catch (e) {
    console.error('\n❌ Test failed:');
    console.error(e);
    process.exit(1);
  }
}

runTests();
