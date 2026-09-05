const fs = require('fs');
const path = require('path');
const cp = require('child_process');

const testsDir = __dirname;
const files = fs.readdirSync(testsDir).filter(f => f.endsWith('.test.js'));

let passed = 0;
let failed = 0;

console.log('Running all unit test suites in tests/...\n');

for (const file of files) {
  const fullPath = path.join(testsDir, file);
  try {
    process.stdout.write(`Testing ${file.padEnd(45)} `);
    cp.execSync(`node "${fullPath}"`, { encoding: 'utf8', stdio: 'pipe' });
    console.log('✅ PASS');
    passed++;
  } catch (err) {
    console.log('❌ FAIL');
    console.error(err.stdout || err.stderr || err.message);
    failed++;
  }
}

console.log(`\n======================================================`);
console.log(`Summary: ${passed} passed, ${failed} failed out of ${files.length} suites.`);
console.log(`======================================================\n`);

if (failed > 0) process.exit(1);
