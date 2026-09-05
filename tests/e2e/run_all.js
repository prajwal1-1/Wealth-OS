/**
 * Master E2E Test Suite Runner
 * Executes Tier 1, Tier 2, Tier 3, and Tier 4 verification suites.
 */

const tier1 = require('./tier1_features.test');
const tier2 = require('./tier2_boundaries.test');
const tier3 = require('./tier3_pairwise.test');
const tier4 = require('./tier4_realworld.test');

async function runAllSuites() {
  console.log(`
╔══════════════════════════════════════════════════════════════════════════════╗
║               WEALTH OS ENTERPRISE E2E VERIFICATION SUITE                    ║
║              4-Tier Comprehensive Quality Assurance Harness                  ║
╚══════════════════════════════════════════════════════════════════════════════╝
`);

  const startTime = Date.now();
  const suites = [tier1, tier2, tier3, tier4];
  const summaries = [];

  for (const suite of suites) {
    const summary = await suite.run();
    summaries.push(summary);
  }

  const totalTime = Date.now() - startTime;
  let totalTests = 0;
  let totalPassed = 0;
  let totalFailed = 0;

  console.log(`\n================================================================================`);
  console.log(`                          E2E EXECUTION SUMMARY                                  `);
  console.log(`================================================================================`);
  console.log(`| # | Suite Name                                    | Total | Pass | Fail | Time `);
  console.log(`|---|-----------------------------------------------|-------|------|------|------`);

  summaries.forEach((s, idx) => {
    totalTests += s.total;
    totalPassed += s.passed;
    totalFailed += s.failed;
    const namePadded = s.suite.padEnd(45, ' ');
    const totalPadded = String(s.total).padStart(5, ' ');
    const passPadded = String(s.passed).padStart(4, ' ');
    const failPadded = String(s.failed).padStart(4, ' ');
    const timePadded = `${s.duration}ms`.padStart(6, ' ');
    console.log(`| ${idx + 1} | ${namePadded} | ${totalPadded} | ${passPadded} | ${failPadded} | ${timePadded} `);
  });

  console.log(`|---|-----------------------------------------------|-------|------|------|------`);
  const grandTotal = String(totalTests).padStart(5, ' ');
  const grandPass = String(totalPassed).padStart(4, ' ');
  const grandFail = String(totalFailed).padStart(4, ' ');
  const grandTime = `${totalTime}ms`.padStart(6, ' ');
  console.log(`|   | TOTAL                                         | ${grandTotal} | ${grandPass} | ${grandFail} | ${grandTime} `);
  console.log(`================================================================================\n`);

  if (totalFailed > 0) {
    console.error(`❌ E2E TEST RUN FAILED: ${totalFailed} tests failed out of ${totalTests}.\n`);
    process.exit(1);
  } else {
    console.log(`🎉 100% PASS RATE: All ${totalTests} E2E test cases passed across Tiers 1-4.\n`);
    process.exit(0);
  }
}

if (require.main === module) {
  runAllSuites();
}

module.exports = { runAllSuites };
