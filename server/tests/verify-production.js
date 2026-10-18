const http = require('http');

async function testEndpoint(url, options = {}) {
  const res = await fetch(url, options);
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {}
  return { status: res.status, headers: res.headers, text, json };
}

async function runTests() {
  console.log('🧪 Starting VISHNUFIT Production Deployment Smoke Tests...\n');

  // Test 1: Root React SPA
  const root = await testEndpoint('http://localhost:5000/');
  console.log('1. GET / (Frontend React SPA Root):');
  console.log('   Status:', root.status);
  console.log('   Contains VISHNUFIT title:', root.text.includes('VISHNUFIT'));
  console.log('   Contains script dist tag:', root.text.includes('/assets/index-'));
  if (root.status !== 200 || !root.text.includes('VISHNUFIT')) {
    throw new Error('Failed GET /');
  }

  // Test 2: API Health Check
  const health = await testEndpoint('http://localhost:5000/api/health');
  console.log('\n2. GET /api/health (Backend Health Check):');
  console.log('   Status:', health.status);
  console.log('   JSON Response:', health.json);
  if (health.status !== 200 || !health.json || health.json.status !== 'healthy') {
    throw new Error('Failed GET /api/health');
  }

  // Test 3: SPA Deep Route /scanner (React Router Refresh)
  const scanner = await testEndpoint('http://localhost:5000/scanner');
  console.log('\n3. GET /scanner (SPA Deep Routing Refresh):');
  console.log('   Status:', scanner.status);
  console.log('   Served index.html HTML:', scanner.text.toLowerCase().includes('<!doctype html>'));
  if (scanner.status !== 200 || !scanner.text.toLowerCase().includes('<!doctype html>')) {
    throw new Error('Failed SPA fallback for /scanner');
  }

  // Test 4: SPA Deep Route /student
  const student = await testEndpoint('http://localhost:5000/student');
  console.log('\n4. GET /student (SPA Deep Routing Refresh):');
  console.log('   Status:', student.status);
  if (student.status !== 200) {
    throw new Error('Failed SPA fallback for /student');
  }

  // Test 5: Static Asset Serving (.js bundle)
  // Extract asset path from index.html
  const match = root.text.match(/src="(\/assets\/[^"]+)"/);
  if (match) {
    const assetUrl = `http://localhost:5000${match[1]}`;
    const asset = await testEndpoint(assetUrl);
    console.log(`\n5. GET ${match[1]} (Vite Bundled JavaScript):`);
    console.log('   Status:', asset.status);
    console.log('   Content-Type:', asset.headers.get('content-type'));
    if (asset.status !== 200 || !asset.headers.get('content-type').includes('javascript')) {
      throw new Error('Failed static asset serving');
    }
  }

  // Test 6: Unknown API Route (Must return JSON 404, NOT HTML)
  const unknownApi = await testEndpoint('http://localhost:5000/api/nonexistent-endpoint');
  console.log('\n6. GET /api/nonexistent-endpoint (Invalid API route):');
  console.log('   Status:', unknownApi.status);
  console.log('   Returns JSON 404:', unknownApi.json && unknownApi.json.success === false);
  console.log('   Error Message:', unknownApi.json && unknownApi.json.message);
  if (unknownApi.status !== 404 || !unknownApi.json) {
    throw new Error('Failed API 404 isolation test');
  }

  // Test 7: Socket.IO Handshake
  const socketRes = await testEndpoint('http://localhost:5000/socket.io/?EIO=4&transport=polling');
  console.log('\n7. GET /socket.io/?EIO=4&transport=polling (Socket.IO Real-time Handshake):');
  console.log('   Status:', socketRes.status);
  console.log('   Engine.io packet:', socketRes.text);
  if (socketRes.status !== 200 || !socketRes.text.startsWith('0{')) {
    throw new Error('Failed Socket.IO handshake');
  }

  // Test 8: Authentication Login Attempt (Valid Credentials test)
  const loginRes = await testEndpoint('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'superadmin@vishnu.edu.in',
      password: 'SuperAdmin@123',
    }),
  });
  console.log('\n8. POST /api/auth/login (Authentication & JWT Cookie):');
  console.log('   Status:', loginRes.status);
  console.log('   Login Success:', loginRes.json && loginRes.json.success);
  console.log('   Role:', loginRes.json && loginRes.json.user && loginRes.json.user.role);
  console.log('   Cookie Header Present:', loginRes.headers.get('set-cookie') ? 'Yes (HttpOnly jwt)' : 'None');
  if (loginRes.status !== 200 || !loginRes.json || !loginRes.json.success) {
    throw new Error('Failed Authentication Login');
  }

  console.log('\n🎉 ALL 8 PRODUCTION DEPLOYMENT TESTS PASSED PERFECTLY!\n');
}

runTests().catch((err) => {
  console.error('\n❌ Test Failure:', err.message);
  process.exit(1);
});
