const assert = require('assert');
const TaxProviderFactory = require('../backend/services/taxIntegration/TaxProviderFactory');
// Mock the auth middleware before loading routes
jest = { mock: () => {} }; // Dummy jest object to prevent errors if any
process.env.TAX_DATA_PROVIDER = 'mock'; // Ensure mock provider is used

const router = require('../backend/routes/taxIntegration.routes');

// Helper to simulate Express route execution
async function simulateRequest(method, path, body) {
  // Find the route
  const route = router.stack.find(layer => layer.route && layer.route.path === path && layer.route.methods[method.toLowerCase()]);
  if (!route) throw new Error(`Route ${method} ${path} not found`);

  // We know the handler is the last one (index 1 if middleware is index 0)
  const handler = route.route.stack[route.route.stack.length - 1].handle;
  
  let responseData = null;
  let responseStatus = 200;
  
  const req = { body };
  const res = {
    status: (code) => { responseStatus = code; return res; },
    json: (data) => { responseData = data; return res; }
  };

  await handler(req, res);
  return { status: responseStatus, data: responseData };
}

async function runTests() {
  console.log('Running PAN Verification Automated Tests...\n');
  try {
    // 1. Valid PAN
    console.log('Test 1: Valid PAN');
    let res = await simulateRequest('POST', '/pan-verify', { pan: 'ABCDE1234F', consentGranted: true });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.success, true);
    assert.strictEqual(res.data.data.status, 'VERIFIED');
    
    // 2. Invalid PAN format
    console.log('Test 2: Invalid PAN Format');
    res = await simulateRequest('POST', '/pan-verify', { pan: 'INVALIDPAN', consentGranted: true });
    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.data.error, 'Invalid PAN format.');
    
    // 3. Malformed request
    console.log('Test 3: Malformed Request');
    res = await simulateRequest('POST', '/pan-verify', { consentGranted: true });
    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.data.error, 'PAN is required.');
    
    // 4. Missing consent
    console.log('Test 4: Missing Consent');
    res = await simulateRequest('POST', '/pan-verify', { pan: 'ABCDE1234F', consentGranted: false });
    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.data.error, 'Explicit user consent is required.');
    
    // 5. Provider Timeout
    console.log('Test 5: Provider Timeout');
    res = await simulateRequest('POST', '/pan-verify', { pan: 'TIMEO1234Z', consentGranted: true });
    assert.strictEqual(res.status, 504);
    assert.strictEqual(res.data.error, 'Service unavailable. Verification timed out.');

    // 6. Provider Failure
    console.log('Test 6: Provider Failure');
    res = await simulateRequest('POST', '/pan-verify', { pan: 'FAILS1234Z', consentGranted: true });
    assert.strictEqual(res.status, 500);
    assert.strictEqual(res.data.error, 'Verification failed due to a provider error.');

    // 7. Invalid PAN format (valid regex, invalid at provider)
    console.log('Test 7: Valid regex, but invalid at provider');
    res = await simulateRequest('POST', '/pan-verify', { pan: 'INVAL1234Z', consentGranted: true });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.data.status, 'INVALID');
    
    console.log('\n✅ All automated tests completed successfully.');
  } catch (e) {
    console.error('\n❌ Test failed:');
    console.error(e);
    process.exit(1);
  }
}

runTests();
