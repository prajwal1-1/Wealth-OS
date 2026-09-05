const assert = require('assert');
const AuthorisedTaxDataProvider = require('../backend/services/taxIntegration/AuthorisedTaxDataProvider');

async function runTests() {
  console.log('Running Authorised Provider Tests...\n');
  try {
    let provider = new AuthorisedTaxDataProvider();

    console.log('Test 1: Rejects if OFFICIAL_TAX_API_BASE_URL is missing');
    delete process.env.OFFICIAL_TAX_API_BASE_URL;
    provider = new AuthorisedTaxDataProvider();
    try {
      await provider._secureFetch('/test');
      assert.fail('Should have thrown error for missing base URL');
    } catch (e) {
      assert.ok(e.message.includes('FATAL: OFFICIAL_TAX_API_BASE_URL is not configured'));
    }

    console.log('Test 2: Rejects if API Keys are missing');
    process.env.OFFICIAL_TAX_API_BASE_URL = 'https://api.incometax.gov.in';
    delete process.env.OFFICIAL_TAX_API_KEY;
    delete process.env.OFFICIAL_TAX_API_SECRET;
    provider = new AuthorisedTaxDataProvider();
    try {
      await provider._secureFetch('/test');
      assert.fail('Should have thrown error for missing keys');
    } catch (e) {
      assert.ok(e.message.includes('FATAL: Official API credentials are not configured'));
    }

    console.log('Test 3: Rejects Non-HTTPS URLs');
    process.env.OFFICIAL_TAX_API_BASE_URL = 'http://api.incometax.gov.in';
    process.env.OFFICIAL_TAX_API_KEY = 'test_key';
    process.env.OFFICIAL_TAX_API_SECRET = 'test_secret';
    provider = new AuthorisedTaxDataProvider();
    try {
      await provider._secureFetch('/test');
      assert.fail('Should have thrown error for non-HTTPS');
    } catch (e) {
      assert.ok(e.message.includes('FATAL: Provider API must use HTTPS/TLS'));
    }

    console.log('Test 4: Endpoint blocked pending documentation');
    try {
      await provider.getTDSData('ABCDE1234F', '2026');
      assert.fail('Should have thrown blocked error');
    } catch (e) {
      assert.ok(e.message.includes('blocked pending Official API Documentation'));
    }

    console.log('\n✅ All automated tests completed successfully.');
  } catch (e) {
    console.error('\n❌ Test failed:');
    console.error(e);
    process.exit(1);
  }
}

runTests();
