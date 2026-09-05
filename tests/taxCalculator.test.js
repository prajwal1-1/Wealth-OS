const assert = require('assert');
const TaxRulesProvider = require('../backend/services/taxEngine/TaxRulesProvider');
const TaxCalculator = require('../backend/services/taxEngine/TaxCalculator');

function runTests() {
  console.log('Running Modular Tax Calculation Engine Tests...\n');
  try {
    const rules = TaxRulesProvider.getRules('AY2025-26');

    console.log('Test 1: Standard Salary with No Tax (Rebate 87A)');
    const profile1 = {
      INCOME: { salary: { value: 700000 } }
    };
    let res = TaxCalculator.compute(profile1, rules);
    assert.strictEqual(res.grossTotalIncome, 625000); // 700k - 75k Std Ded
    assert.strictEqual(res.taxableIncome, 625000);
    assert.strictEqual(res.grossTaxLiability, 0); // tax negated by 87A rebate
    assert.strictEqual(res.netPayable, 0);

    console.log('Test 2: High Income (Slabs & Cess)');
    const profile2 = {
      INCOME: {
        salary: { value: 1575000 }, // 1.575M - 75k std ded = 1.5M
        interest: { value: 100000 } // Total = 1.6M
      }
    };
    res = TaxCalculator.compute(profile2, rules);
    assert.strictEqual(res.grossTotalIncome, 1600000);
    // Slab breakdown for 1.6M (Budget 2024 AY 2025-26):
    // 0-3L: 0
    // 3L-7L: 5% of 4L = 20k
    // 7L-10L: 10% of 3L = 30k
    // 10L-12L: 15% of 2L = 30k
    // 12L-15L: 20% of 3L = 60k
    // 15L-16L: 30% of 1L = 30k
    // Total Tax = 170,000
    // Cess (4%) = 6,800
    // Total Liability = 176,800
    assert.strictEqual(res.grossTaxLiability, 176800);

    console.log('Test 3: Refund Scenario (TDS Offset)');
    const profile3 = {
      INCOME: { salary: { value: 500000 } },
      TAXES: { tds: { value: 20000 } }
    };
    res = TaxCalculator.compute(profile3, rules);
    // Tax is 0 due to rebate. TDS is 20k. Net is -20k (Refund)
    assert.strictEqual(res.grossTaxLiability, 0);
    assert.strictEqual(res.netPayable, -20000);

    console.log('Test 4: Explainability Breakdown Array');
    // Ensure the breakdown array exists and has structured data
    assert.ok(res.breakdown.length > 5);
    const tdsLog = res.breakdown.find(b => b.step.includes('Tax Paid'));
    assert.strictEqual(tdsLog.amount, -20000);
    
    const finalLog = res.breakdown[res.breakdown.length - 1];
    assert.strictEqual(finalLog.step, 'Net Tax Payable / (Refund)');
    assert.strictEqual(finalLog.note, 'Refund Due');

    console.log('\n✅ All automated tests completed successfully.');
  } catch (e) {
    console.error('\n❌ Test failed:');
    console.error(e);
    process.exit(1);
  }
}

runTests();
