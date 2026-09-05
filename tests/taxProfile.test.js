const assert = require('assert');
const router = require('../backend/routes/profile.routes');

async function simulateRequest(method, path, body, params = {}, authUserId = 'user-a') {
  const route = router.stack.find(layer => {
    if (!layer.route) return false;
    // Basic dynamic route matching
    const match = layer.route.path.split('/').length === path.split('/').length;
    return match && layer.route.methods[method.toLowerCase()];
  });
  
  if (!route) throw new Error(`Route ${method} ${path} not found`);

  const handler = route.route.stack[route.route.stack.length - 1].handle;
  let responseData = null;
  let responseStatus = 200;
  
  const req = { body, params, user: { id: authUserId } };
  const res = {
    status: (code) => { responseStatus = code; return res; },
    json: (data) => { responseData = data; return res; }
  };

  await handler(req, res);
  return { status: responseStatus, data: responseData };
}

async function runTests() {
  console.log('Running Taxpayer Profile Tests...\n');
  try {
    router._clearDb();
    
    // 1. Fetch Profile
    console.log('Test 1: Fetch Profile (Initial State)');
    let res = await simulateRequest('GET', '/');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.data.IDENTITY.pan.source, 'UNKNOWN');
    assert.strictEqual(res.data.data.INCOME.salary.value, 0);

    // 2. Update Profile Category (USER_PROVIDED)
    console.log('Test 2: Update Profile (USER_PROVIDED)');
    res = await simulateRequest('PUT', '/:category', {
      salary: { value: 1500000, source: 'USER_PROVIDED' }
    }, { category: 'INCOME' });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.data.salary.value, 1500000);
    assert.strictEqual(res.data.data.salary.source, 'USER_PROVIDED');

    // 3. Update Profile Category (Invalid Category)
    console.log('Test 3: Update Invalid Category');
    res = await simulateRequest('PUT', '/:category', {}, { category: 'INVALID' });
    assert.strictEqual(res.status, 400);

    // 4. Update Profile Category (Invalid Source)
    console.log('Test 4: Update with Invalid Source');
    res = await simulateRequest('PUT', '/:category', {
      salary: { value: 1500000, source: 'HACKED_SOURCE' }
    }, { category: 'INCOME' });
    assert.strictEqual(res.status, 400);
    
    // 5. Source Downgrade (Overwriting AUTHORISED_PROVIDER)
    console.log('Test 5: Source Downgrade Logic');
    // First, set to authorised
    await simulateRequest('PUT', '/:category', {
      tds: { value: 50000, source: 'AUTHORISED_PROVIDER' }
    }, { category: 'TAXES' });
    
    // Then, user updates it
    res = await simulateRequest('PUT', '/:category', {
      tds: { value: 60000, source: 'USER_PROVIDED' }
    }, { category: 'TAXES' });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.data.tds.value, 60000);
    assert.strictEqual(res.data.data.tds.source, 'USER_PROVIDED');

    console.log('\n✅ All automated tests completed successfully.');
  } catch (e) {
    console.error('\n❌ Test failed:');
    console.error(e);
    process.exit(1);
  }
}

runTests();
