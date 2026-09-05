/**
 * LLM Parsing Service (Simulation)
 * In production, this would make an API call to Gemini 1.5 Pro or Claude 3.5 Sonnet
 * passing the raw extracted PDF text and a JSON schema.
 */

const parseTaxDocument = async (rawText, fileName) => {
  // Simulate network delay for LLM processing
  await new Promise(resolve => setTimeout(resolve, 2500));

  console.log(`[LLM Service] Parsing document: ${fileName}`);

  // In a real implementation, we would parse the rawText. 
  // For the UX demonstration, we return a structured JSON mock of a Form 16 / Capital Gains statement.
  
  const isCapitalGains = fileName.toLowerCase().includes('capital') || fileName.toLowerCase().includes('zerodha');
  
  if (isCapitalGains) {
    return {
      documentType: 'Capital Gains Statement',
      confidenceScore: 0.96,
      extractedData: {
        cgStcgEq: 125000,
        cgLtcgEq: 450000,
        cgStLossBf: 12000,
        tdsPaid: 15000
      }
    };
  }

  // Default: Assume Form 16 / Salary Slip
  return {
    documentType: 'Form 16 (Part B)',
    confidenceScore: 0.98,
    extractedData: {
      salaryBasic: 1850000,
      salaryBonus: 150000,
      salaryHraReceived: 450000,
      deduction80c: 150000,
      deduction80ccd1b: 50000,
      deduction80d: 25000,
      deductionProfTax: 2500,
      tdsPaid: 425000
    }
  };
};

module.exports = {
  parseTaxDocument
};
