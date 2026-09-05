const assert = require('assert');
const router = require('../backend/routes/consents.routes');

// Helper to simulate Express route execution
async function simulateRequest(method, path, body, params = {}, authUserId = 'user-a') {
  // Clear DB before each top-level test block if needed, but here we run sequentially
  
  // Find the route
  const route = router.stack.find(layer => layer.route && layer.route.path === path && layer.route.methods[method.toLowerCase()]);
  if (!route) throw new Error(`Route ${method} ${path} not found`);

  // Handler is the last one
  const handler = route.route.stack[route.route.stack.length - 1].handle;
  
  let responseData = null;
  let responseStatus = 200;
  
  const req = { 
    body, 
    params,
    user: { id: authUserId } 
  };
  
  const res = {
    status: (code) => { responseStatus = code; return res; },
    json: (data) => { responseData = data; return res; }
  };

  await handler(req, res);
  return { status: responseStatus, data: responseData };
}

async function runTests() {
  console.log('Running Consent System Automated Tests...\n');
  try {
    router._clearDb();
    
    // 1. Consent Granted
    console.log('Test 1: Consent Granted');
    let res = await simulateRequest('POST', '/', { 
      purpose: 'TAX_PREPARATION', 
      providerCategory: 'INCOME_TAX', 
      consentVersion: '1.0', 
      consentGranted: true 
    });
    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.data.data.status, 'GRANTED');
    const consentId = res.data.data.id;
    
    // 2. Consent Missing
    console.log('Test 2: Consent Missing');
    res = await simulateRequest('POST', '/', { 
      purpose: 'TAX_PREPARATION', 
      providerCategory: 'INCOME_TAX', 
      consentVersion: '1.0',
      consentGranted: false // Missing or false
    });
    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.data.error, 'Explicit consent must be granted (consentGranted=true).');

    // 3. Invalid Consent Version
    console.log('Test 3: Invalid Consent Version');
    res = await simulateRequest('POST', '/', { 
      purpose: 'TAX_PREPARATION', 
      providerCategory: 'INCOME_TAX', 
      consentVersion: '2.0', // Unsupported
      consentGranted: true 
    });
    assert.strictEqual(res.status, 400);
    assert.ok(res.data.error.includes('Invalid consent version'));

    // 4. Repeated Consent (Idempotent update)
    console.log('Test 4: Repeated Consent');
    res = await simulateRequest('POST', '/', { 
      purpose: 'TAX_PREPARATION', 
      providerCategory: 'INCOME_TAX', 
      consentVersion: '1.0', 
      consentGranted: true 
    });
    assert.strictEqual(res.status, 200); // 200 instead of 201 for update
    assert.strictEqual(res.data.data.id, consentId); // Same ID

    // 5. Unauthorized User Attempting to Access
    console.log('Test 5: Unauthorized User Access Attempt');
    // User B tries to delete User A's consent
    res = await simulateRequest('DELETE', '/:id', null, { id: consentId }, 'user-b');
    assert.strictEqual(res.status, 403);
    assert.strictEqual(res.data.error, 'You are not authorized to modify this consent.');

    // 6. Consent Withdrawn
    console.log('Test 6: Consent Withdrawn');
    res = await simulateRequest('DELETE', '/:id', null, { id: consentId }, 'user-a');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.data.status, 'WITHDRAWN');
    assert.ok(res.data.data.withdrawnAt !== null);

    console.log('\n✅ All automated tests completed successfully.');
  } catch (e) {
    console.error('\n❌ Test failed:');
    console.error(e);
    process.exit(1);
  }
}

runTests();
