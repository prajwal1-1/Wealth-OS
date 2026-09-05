const assert = require('assert');
const TaxProviderFactory = require('../backend/services/taxIntegration/TaxProviderFactory');
const MockTaxDataProvider = require('../backend/services/taxIntegration/MockTaxDataProvider');
const AuthorisedTaxDataProvider = require('../backend/services/taxIntegration/AuthorisedTaxDataProvider');
const TaxDataProvider = require('../backend/services/taxIntegration/TaxDataProvider');

async function runTests() {
  console.log('Running Tax Integration Architecture Tests...\n');

  try {
    // 1. Test Factory (Mock)
    process.env.TAX_DATA_PROVIDER = 'mock';
    const mockProvider = TaxProviderFactory.getProvider();
    assert.ok(mockProvider instanceof MockTaxDataProvider, 'Factory should return MockTaxDataProvider');
    assert.ok(mockProvider instanceof TaxDataProvider, 'Provider should extend TaxDataProvider');
    console.log('✅ Factory loads MockProvider correctly');

    // 2. Test Factory (Government)
    process.env.TAX_DATA_PROVIDER = 'government';
    const govProvider = TaxProviderFactory.getProvider();
    assert.ok(govProvider instanceof AuthorisedTaxDataProvider, 'Factory should return AuthorisedTaxDataProvider');
    console.log('✅ Factory loads AuthorisedTaxDataProvider correctly');

    // 3. Test Invalid Config
    process.env.TAX_DATA_PROVIDER = 'invalid';
    try {
      TaxProviderFactory.getProvider();
      assert.fail('Should have thrown on invalid provider');
    } catch (e) {
      assert.match(e.message, /Invalid TAX_DATA_PROVIDER/);
      console.log('✅ Factory throws on invalid provider config');
    }

    // 4. Test Mock Provider Methods
    console.log('\nTesting MockTaxDataProvider...');
    const testProvider = new MockTaxDataProvider();
    
    // Test Masking
    const masked = testProvider.maskPan('ABCDE1234F');
    assert.strictEqual(masked, 'ABCDE****F');
    console.log('✅ PAN Masking works');

    // Test Initiate
    const initResult = await testProvider.initiateConnection({ pan: 'ABCDE1234F' });
    assert.ok(initResult.success);
    assert.ok(initResult.consentToken);
    console.log('✅ Initiate connection works');

    // Test Fetch Pre-fill
    const prefill = await testProvider.fetchPreFillData(initResult.consentToken, 'ABCDE1234F', '2024-25');
    assert.strictEqual(prefill.dataSource, 'SANDBOX_MOCK_PROVIDER');
    assert.strictEqual(prefill.data.salaryIncome, 1250000);
    console.log('✅ Fetch pre-fill data returns structured sandbox data');

    // Test Revoke
    const revoked = await testProvider.revokeConsent(initResult.consentToken);
    assert.strictEqual(revoked, true);
    console.log('✅ Revoke consent works');

    // 5. Test Government Provider Stubs
    console.log('\nTesting AuthorisedTaxDataProvider Stubs...');
    const authProvider = new AuthorisedTaxDataProvider();
    try {
      await authProvider.initiateConnection({ pan: 'ABCDE1234F' });
      assert.fail('Should have thrown Not Implemented');
    } catch (e) {
      assert.match(e.message, /Not yet implemented/);
      console.log('✅ Government provider correctly stubs methods');
    }

    console.log('\n🎉 All tests passed successfully!');

  } catch (err) {
    console.error('\n❌ Test failed:');
    console.error(err);
    process.exit(1);
  }
}

runTests();
