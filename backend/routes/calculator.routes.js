const express = require('express');
const router = express.Router();
const TaxRulesProvider = require('../services/taxEngine/TaxRulesProvider');
const TaxCalculator = require('../services/taxEngine/TaxCalculator');

/**
 * POST /api/wealth/tax-calculator/compute
 * Computes the tax liability based on the provided profile and assessment year.
 */
router.post('/compute', (req, res) => {
  try {
    const { profile, assessmentYear } = req.body;

    if (!profile) {
      return res.status(400).json({ error: 'Taxpayer profile payload is required.' });
    }

    // Default to AY2025-26 if none provided (as per system specs for current FY)
    const ay = assessmentYear || 'AY2025-26';

    // 1. Load Rules
    const rules = TaxRulesProvider.getRules(ay);

    // 2. Compute
    const result = TaxCalculator.compute(profile, rules);

    // 3. Return explainable output with compliance disclaimer
    res.status(200).json({
      success: true,
      assessmentYear: ay,
      summary: {
        grossTotalIncome: result.grossTotalIncome,
        taxableIncome: result.taxableIncome,
        grossTaxLiability: result.grossTaxLiability,
        taxCredits: result.taxCredits,
        netPayable: result.netPayable
      },
      computationBreakdown: result.breakdown,
      disclaimer: "These computations are generated for informational purposes only and do not constitute official tax advice."
    });

  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
