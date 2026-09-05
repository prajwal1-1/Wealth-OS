const assert = require('assert');
const { app } = require('../server');
const { getDb } = require('../backend/db/sqlite');

// Helper to simulate request to Express app
function makeRequest(app, method, url, headers = {}, body = null) {
  return new Promise((resolve) => {
    const http = require('http');
    const server = http.createServer(app);
    server.listen(0, () => {
      const port = server.address().port;
      const parsedUrl = new URL(url, `http://127.0.0.1:${port}`);
      
      const reqOptions = {
        method,
        hostname: parsedUrl.hostname,
        port: parsedUrl.port,
        path: parsedUrl.pathname + parsedUrl.search,
        headers: {
          'Content-Type': 'application/json',
          ...headers
        }
      };

      const req = http.request(reqOptions, (res) => {
        let data = '';
        res.on('data', chunk => { data += chunk; });
        res.on('end', () => {
          server.close(() => {
            let json = null;
            try { json = JSON.parse(data); } catch (_) {}
            resolve({ status: res.statusCode, headers: res.headers, body: json || data });
          });
        });
      });

      req.on('error', (err) => {
        server.close(() => {
          resolve({ status: 500, error: err.message });
        });
      });

      if (body) {
        if (Buffer.isBuffer(body)) {
          req.write(body);
        } else if (typeof body === 'object') {
          req.write(JSON.stringify(body));
        } else {
          req.write(String(body));
        }
      }
      req.end();
    });
  });
}

async function runTests() {
  console.log('Running Server Express API & SQLite Integration Tests...\n');

  try {
    const db = getDb();

    // 1. Test Register and Login flow
    console.log('Test 1: POST /api/wealth/register & POST /api/wealth/login');
    const testEmail = `api-test-${Date.now()}@example.com`;
    const signupRes = await makeRequest(app, 'POST', '/api/wealth/register', {}, {
      name: 'API Test User',
      email: testEmail,
      password: 'password123'
    });
    assert.strictEqual(signupRes.status, 201, 'Signup must return 201');
    assert.ok(signupRes.body.token, 'Signup must return token');
    console.log(`✅ Registration successful for ${testEmail}`);

    const loginRes = await makeRequest(app, 'POST', '/api/wealth/login', {}, {
      email: testEmail,
      password: 'password123'
    });
    assert.strictEqual(loginRes.status, 200, 'Login must return 200');
    assert.ok(loginRes.body.token, 'Login must return token');
    const token = loginRes.body.token;
    const userId = loginRes.body.user.id;
    console.log(`✅ Login successful, session token acquired: ${token.slice(0, 16)}...`);

    const authHeaders = { Authorization: `Bearer ${token}` };

    // 2. Test GET /api/wealth/me
    console.log('\nTest 2: GET /api/wealth/me (Session verification)');
    const meRes = await makeRequest(app, 'GET', '/api/wealth/me', authHeaders);
    assert.strictEqual(meRes.status, 200);
    assert.ok(meRes.body.user, 'User must exist in response');
    assert.ok(meRes.body.data, 'Data object must exist in response');
    console.log(`✅ /api/wealth/me returned user: ${meRes.body.user.name} (${meRes.body.user.email})`);

    // 3. Test GET /api/wealth/data
    console.log('\nTest 3: GET /api/wealth/data');
    const dataRes = await makeRequest(app, 'GET', '/api/wealth/data', authHeaders);
    assert.strictEqual(dataRes.status, 200);
    assert.ok(Array.isArray(dataRes.body.data.assets), 'Assets array must exist');
    console.log(`✅ /api/wealth/data returned ${dataRes.body.data.assets.length} assets`);

    // 4. Test PUT /api/wealth/data (Transactional Balance Sheet Update)
    console.log('\nTest 4: PUT /api/wealth/data (Atomic Transaction Update)');
    const currentData = dataRes.body.data;
    const testAsset = {
      id: 'test-car-' + Date.now(),
      name: 'Porsche 911 GT3',
      type: 'Car',
      value: 25000000,
      purchasePrice: 24000000,
      year: 2025,
      condition: 'Mint',
      lastUpdated: new Date().toISOString().slice(0, 10)
    };
    currentData.assets.push(testAsset);

    const putRes = await makeRequest(app, 'PUT', '/api/wealth/data', authHeaders, {
      data: currentData
    });
    assert.strictEqual(putRes.status, 200);
    assert.strictEqual(putRes.body.ok, true);

    // Verify written to SQLite directly
    const sqliteAsset = db.prepare('SELECT * FROM assets WHERE id = ?').get(testAsset.id);
    assert.ok(sqliteAsset, 'Asset must be persisted in SQLite table assets');
    assert.strictEqual(sqliteAsset.value, 25000000);
    console.log('✅ Balance sheet updated atomically via SQLite transaction');

    // 5. Test GET /api/wealth/audit
    console.log('\nTest 5: GET /api/wealth/audit');
    const auditRes = await makeRequest(app, 'GET', '/api/wealth/audit', authHeaders);
    assert.strictEqual(auditRes.status, 200);
    assert.ok(Array.isArray(auditRes.body.rows), 'Audit rows must be returned');
    assert.ok(auditRes.body.rows.length > 0, 'Audit rows must have entries');
    console.log(`✅ /api/wealth/audit returned ${auditRes.body.rows.length} audit entries`);

    // 6. Test GET /api/wealth/ca/clients
    console.log('\nTest 6: GET /api/wealth/ca/clients');
    const caRes = await makeRequest(app, 'GET', '/api/wealth/ca/clients', authHeaders);
    assert.strictEqual(caRes.status, 200);
    assert.ok(Array.isArray(caRes.body.clients), 'Clients list must be returned');
    console.log(`✅ /api/wealth/ca/clients returned ${caRes.body.clients.length} clients`);

    // 7. Test File Upload to Persistent Vault
    console.log('\nTest 7: POST /api/wealth/files (Persistent Vault Enveloped Upload)');
    const filePayload = Buffer.from('REST_API_ENCRYPTED_VAULT_TEST_DOCUMENT_2026', 'utf8');
    const boundary = '----WebKitFormBoundary' + require('crypto').randomBytes(16).toString('hex');
    const pre = Buffer.from(
      `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="sample_tax_return.pdf"\r\nContent-Type: application/pdf\r\n\r\n`
    );
    const post = Buffer.from(`\r\n--${boundary}--\r\n`);
    const multipartBody = Buffer.concat([pre, filePayload, post]);

    const uploadRes = await makeRequest(app, 'POST', '/api/wealth/files', {
      ...authHeaders,
      'Content-Type': `multipart/form-data; boundary=${boundary}`,
      'Content-Length': multipartBody.length
    }, multipartBody);

    assert.strictEqual(uploadRes.status, 201, 'Upload must return 201 Created');
    assert.ok(uploadRes.body.file && uploadRes.body.file.id, 'File metadata must be returned');
    const uploadedFileId = uploadRes.body.file.id;
    console.log(`✅ File uploaded successfully: ID ${uploadedFileId}, Checksum: ${uploadRes.body.file.checksum}`);

    // 8. Test Access Token Generation & Download
    console.log('\nTest 8: POST /api/wealth/files/:id/token & GET /api/wealth/files/:id');
    const tokenRes = await makeRequest(app, 'POST', `/api/wealth/files/${uploadedFileId}/token`, authHeaders, { expiresIn: 60 });
    assert.strictEqual(tokenRes.status, 200);
    assert.ok(tokenRes.body.token, 'HMAC token must be returned');
    const downloadToken = tokenRes.body.token;
    console.log(`✅ Signed download access token acquired (60s lifetime)`);

    // Download using access token without session
    const downloadRes = await makeRequest(app, 'GET', `/api/wealth/files/${uploadedFileId}?token=${downloadToken}`, {});
    assert.strictEqual(downloadRes.status, 200, 'Download with valid token must succeed');
    assert.strictEqual(downloadRes.body, filePayload.toString('utf8'), 'Decrypted content must match uploaded buffer');
    console.log('✅ File retrieved and decrypted accurately via HMAC download token');

    // 9. Test IDOR Protection over HTTP
    console.log('\nTest 9: IDOR Attack Prevention over HTTP');
    // Create second user
    const user2Signup = await makeRequest(app, 'POST', '/api/wealth/register', {}, {
      name: 'Attacker Bob',
      email: `attacker-${Date.now()}@example.com`,
      password: 'password123'
    });
    const user2Token = user2Signup.body.token;
    const user2Headers = { Authorization: `Bearer ${user2Token}` };

    // Attacker tries to download User 1's file using their own session
    const idorRes = await makeRequest(app, 'GET', `/api/wealth/files/${uploadedFileId}`, user2Headers);
    assert.ok(idorRes.status === 401 || idorRes.status === 403 || idorRes.status === 404, `IDOR request must be rejected with 401, 403, or 404 (got ${idorRes.status})`);
    console.log(`✅ IDOR attack rejected with HTTP ${idorRes.status} (Access Denied)`);

    // 10. Test POST /api/wealth/logout
    console.log('\nTest 10: POST /api/wealth/logout');
    const logoutRes = await makeRequest(app, 'POST', '/api/wealth/logout', authHeaders);
    assert.strictEqual(logoutRes.status, 200);
    assert.strictEqual(logoutRes.body.ok, true);

    // Check session revoked in SQLite
    const sessionCheck = db.prepare('SELECT * FROM user_sessions WHERE token = ?').get(token);
    assert.strictEqual(sessionCheck, undefined, 'Session token must be deleted from SQLite');
    console.log('✅ Session token deleted from SQLite table user_sessions on logout');

    console.log('\n🎉 All Server Express API & SQLite Integration tests passed successfully!');
  } catch (err) {
    console.error('\n❌ Server API SQLite Test Failed:');
    console.error(err);
    process.exit(1);
  }
}

runTests();
