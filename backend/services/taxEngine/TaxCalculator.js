/**
 * TaxCalculator.js
 * Pure functional calculation engine strictly separated from UI logic.
 */

class TaxCalculator {
  
  /**
   * Main computation engine.
   * @param {Object} inputProfile - Normalized data inputs
   * @param {Object} rules - Rules fetched from TaxRulesProvider
   */
  static compute(inputProfile, rules) {
    const breakdown = [];
    const _log = (step, amount, note = '') => breakdown.push({ step, amount, note });

    // 1. Inputs Extraction (Safely defaulting to 0)
    const p = inputProfile || {};
    const inc = p.INCOME || {};
    const tx = p.TAXES || {};
    const ded = p.DEDUCTIONS || {};

    const rawSalary = inc.salary?.value || 0;
    const houseProp = 0; // Placeholder for future property income
    const interest = inc.interest?.value || 0;
    const dividend = inc.dividend?.value || 0;
    const other = inc.other?.value || 0;
    const capitalGains = inc.capitalGains?.value || 0;
    const business = inc.business?.value || 0;

    const eligibleDeductions = ded.eligibleDeductions?.value || 0;
    const tds = tx.tds?.value || 0;
    const tcs = tx.tcs?.value || 0;
    const advanceTax = tx.advanceTax?.value || 0;
    const selfAssessment = tx.selfAssessmentTax?.value || 0;

    // 2. Gross Income Computation
    _log('Raw Salary', rawSalary, 'USER_PROVIDED/IMPORTED');
    
    // Standard Deduction on Salary (capped at actual salary)
    const stdDedAllowed = Math.min(rawSalary, rules.standardDeduction);
    const netSalary = Math.max(0, rawSalary - stdDedAllowed);
    _log('Less: Standard Deduction', -stdDedAllowed, `Statutory limit: ${rules.standardDeduction}`);
    _log('Income from Salary', netSalary);
    
    const otherSources = interest + dividend + other;
    _log('Income from Other Sources', otherSources, 'Interest + Dividend + Other');
    
    if (capitalGains > 0) _log('Income from Capital Gains', capitalGains);
    if (business > 0) _log('Income from Business/Profession', business);

    const grossTotalIncome = netSalary + houseProp + otherSources + capitalGains + business;
    _log('Gross Total Income (GTI)', grossTotalIncome, 'Sum of all heads');

    // 3. Deductions
    const maxDeductions = Math.min(grossTotalIncome, eligibleDeductions);
    _log('Less: Chapter VI-A Deductions', -maxDeductions, 'Subject to limits/regime rules');

    // 4. Taxable Income
    const taxableIncome = Math.max(0, grossTotalIncome - maxDeductions);
    _log('Total Taxable Income', taxableIncome);

    // 5. Tax Liability (Slab Computation)
    let taxLiability = 0;
    let remainingIncome = taxableIncome;
    let previousLimit = 0;

    for (const slab of rules.slabs) {
      if (remainingIncome <= 0) break;
      
      const taxableInThisSlab = Math.min(remainingIncome, slab.upTo - previousLimit);
      if (taxableInThisSlab > 0 && slab.rate > 0) {
        const taxInSlab = taxableInThisSlab * slab.rate;
        taxLiability += taxInSlab;
        _log(`Tax at ${slab.rate * 100}% on ₹${taxableInThisSlab}`, taxInSlab, `Slab: ${previousLimit} to ${slab.upTo}`);
      }
      remainingIncome -= taxableInThisSlab;
      previousLimit = slab.upTo;
    }

    _log('Tax Liability Before Rebate', taxLiability);

    // 6. Rebate u/s 87A & Marginal Relief (New Tax Regime)
    if (taxableIncome <= rules.rebateLimit87A && taxLiability > 0) {
      const rebate = Math.min(taxLiability, rules.rebateMaxAmount87A);
      taxLiability -= rebate;
      _log('Less: Rebate u/s 87A', -rebate, `Income <= ${rules.rebateLimit87A}`);
    } else if (taxableIncome > rules.rebateLimit87A && rules.rebateLimit87A === 700000) {
      // Statutory Marginal Relief under section 87A proviso
      const excessIncome = taxableIncome - rules.rebateLimit87A;
      if (taxLiability > excessIncome) {
        const marginalRelief = taxLiability - excessIncome;
        taxLiability = excessIncome;
        _log('Less: Marginal Relief u/s 87A', -marginalRelief, `Tax capped at excess income of ₹${excessIncome}`);
      }
    }

    // 7. Cess
    let healthEduCess = 0;
    if (taxLiability > 0) {
      healthEduCess = taxLiability * rules.healthAndEducationCessRate;
      taxLiability += healthEduCess;
      _log('Add: Health & Education Cess (4%)', healthEduCess);
    }
    
    // Round off to nearest 10
    taxLiability = Math.round(taxLiability / 10) * 10;
    _log('Gross Tax Liability', taxLiability, 'Rounded to nearest ₹10');

    // 8. Tax Credits & Output
    const totalCredits = tds + tcs + advanceTax + selfAssessment;
    _log('Less: Tax Paid (TDS/TCS/Advance)', -totalCredits);

    const netPayable = taxLiability - totalCredits;
    let finalNote = netPayable > 0 ? 'Tax Payable' : (netPayable < 0 ? 'Refund Due' : 'Nil Tax');

    _log('Net Tax Payable / (Refund)', netPayable, finalNote);

    return {
      grossTotalIncome,
      taxableIncome,
      grossTaxLiability: taxLiability,
      taxCredits: totalCredits,
      netPayable,
      breakdown
    };
  }
}

module.exports = TaxCalculator;
