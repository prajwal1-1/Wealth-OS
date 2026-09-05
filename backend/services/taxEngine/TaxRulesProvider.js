/**
 * TaxRulesProvider.js
 * Central abstraction for retrieving Assessment Year specific tax rules.
 */

const RULES_DB = {
  'AY2025-26': {
    standardDeduction: 75000,
    healthAndEducationCessRate: 0.04,
    rebateLimit87A: 700000, // No tax up to 7 Lakhs in new regime
    rebateMaxAmount87A: 25000,
    slabs: [
      { upTo: 300000, rate: 0 },
      { upTo: 700000, rate: 0.05 },
      { upTo: 1000000, rate: 0.10 },
      { upTo: 1200000, rate: 0.15 },
      { upTo: 1500000, rate: 0.20 },
      { upTo: Infinity, rate: 0.30 }
    ]
  },
  'AY2026-27': {
    standardDeduction: 75000,
    healthAndEducationCessRate: 0.04,
    rebateLimit87A: 700000,
    rebateMaxAmount87A: 25000,
    slabs: [
      { upTo: 300000, rate: 0 },
      { upTo: 700000, rate: 0.05 },
      { upTo: 1000000, rate: 0.10 },
      { upTo: 1200000, rate: 0.15 },
      { upTo: 1500000, rate: 0.20 },
      { upTo: Infinity, rate: 0.30 }
    ]
  }
};

class TaxRulesProvider {
  /**
   * Retrieves the tax rules for a specific assessment year.
   * Currently defaults to New Tax Regime rules for the requested year.
   * @param {string} assessmentYear (e.g., 'AY2025-26')
   */
  static getRules(assessmentYear) {
    const rules = RULES_DB[assessmentYear];
    if (!rules) {
      throw new Error(`Tax rules for ${assessmentYear} are not configured in the system.`);
    }
    return rules;
  }
}

module.exports = TaxRulesProvider;
