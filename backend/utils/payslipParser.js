/**
 * Intelligent Payslip / Salary Slip Parser for Indian & Global formats
 */

function parsePayslipText(rawText) {
  const clean = String(rawText || '').replace(/\r/g, '\n');

  // Employee Name & Code
  let employeeName = '';
  let employeeCode = '';
  const empMatch = clean.match(/Employee\s*Name\s*:\s*(?:\(([^)]+)\))?\s*([A-Za-z\s]+?)(?:Designation|Date|UID|Pay|\n)/i);
  if (empMatch) {
    employeeCode = (empMatch[1] || '').trim();
    employeeName = (empMatch[2] || '').trim();
  }

  // Employer / Department Name
  let employerName = '';
  const lines = clean.split('\n').map(l => l.trim()).filter(Boolean);
  for (const line of lines) {
    if (/unit|hospital|ltd|limited|services|technologies|govt|department|pimpri|corp|corporation|ministry|enterprises|solutions/i.test(line) && !/employee|particulars|emolument|deduction/i.test(line)) {
      employerName = line.replace(/DDO\s*CODE.*$/i, '').replace(/^payslip\s*/i, '').trim();
      break;
    }
  }

  // Designation
  let designation = '';
  const desMatch = clean.match(/Designation\s*:\s*([A-Za-z\s_]+?)(?:Salary|Date|Pay|\n)/i);
  if (desMatch) designation = desMatch[1].trim();

  // Salary Month
  let salaryMonth = '';
  const monthMatch = clean.match(/Salary\s*Month\s*:\s*([A-Za-z0-9_-]+)/i);
  if (monthMatch) salaryMonth = monthMatch[1].trim();

  // Pay Commission / Level
  let payCommission = '';
  const pcMatch = clean.match(/Pay\s*Commission\s*:\s*([A-Za-z0-9\s_]+?)(?:Level|Date|Basic|\n)/i);
  if (pcMatch) payCommission = pcMatch[1].trim();

  // Basic Pay
  let basicPay = 0;
  const basicMatch = clean.match(/(?:Basic\s*Pay\s*:\s*|BASIC\s+)(\d+)/i);
  if (basicMatch) basicPay = parseInt(basicMatch[1], 10);

  // HRA
  let hra = 0;
  const hraMatch = clean.match(/H\.?\s*R\.?\s*A\.?\s+(\d+)/i);
  if (hraMatch) hra = parseInt(hraMatch[1], 10);

  // DA (Dearness Allowance)
  let da = 0;
  const daMatch = clean.match(/DA(?:_\w+)?\s+(\d+)/i);
  if (daMatch) da = parseInt(daMatch[1], 10);

  // DA Arrears
  let daArrears = 0;
  const daArrMatch = clean.match(/DA\s*Arr\s+(\d+)/i);
  if (daArrMatch) daArrears = parseInt(daArrMatch[1], 10);

  // TA (Transport Allowance)
  let ta = 0;
  const taMatch = clean.match(/TA(?:_\w+)?\s+(\d+)/i);
  if (taMatch) ta = parseInt(taMatch[1], 10);

  // Special Allowance / CLA
  let cla = 0;
  const claMatch = clean.match(/CLA(?:\s*\([^)]+\))?\s+(\d+)/i);
  if (claMatch) cla = parseInt(claMatch[1], 10);

  // Total Emoluments / Gross Monthly
  let grossMonthly = 0;
  const grossMatch = clean.match(/Total\s*Emolument(?:s)?\s*[:|]?\s*(\d+)/i);
  if (grossMatch) {
    grossMonthly = parseInt(grossMatch[1], 10);
  } else if (basicPay) {
    grossMonthly = basicPay + hra + da + (daArrears || 0) + ta + cla;
  }

  // Deductions: Income Tax (TDS)
  let incomeTaxTds = 0;
  const itMatch = clean.match(/I\.?\s*TAX\s+(\d+)/i);
  if (itMatch) incomeTaxTds = parseInt(itMatch[1], 10);

  // Deductions: Professional Tax (PT)
  let professionalTax = 0;
  const ptMatch = clean.match(/Prof\.?\s*Tax\.?\s+(\d+)/i);
  if (ptMatch) professionalTax = parseInt(ptMatch[1], 10);

  // Deductions: GPF / EPF
  let gpf = 0;
  const gpfMatch = clean.match(/GPF(?:_\w+)?\s+(\d+)/i);
  if (gpfMatch) gpf = parseInt(gpfMatch[1], 10);

  // Deductions: GIS (Insurance)
  let gis = 0;
  const gisMatch = clean.match(/GIS\s+(\d+)/i);
  if (gisMatch) gis = parseInt(gisMatch[1], 10);

  // Deductions: Loan / Advance Recovery
  let loanRecovery = 0;
  const faMatch = clean.match(/F\.?\s*A\.?\s+(\d+)/i);
  if (faMatch) loanRecovery = parseInt(faMatch[1], 10);

  // Stamp Revenue
  let stampRevenue = 0;
  const stampMatch = clean.match(/STAMP_REVENUE\s+(\d+)/i);
  if (stampMatch) stampRevenue = parseInt(stampMatch[1], 10);

  // Total Recoveries / Deductions
  let totalDeductions = 0;
  const dedMatch = clean.match(/Total\s*Govt\.?\s*Recoveries\s*[:|]?\s*(\d+)/i);
  if (dedMatch) {
    totalDeductions = parseInt(dedMatch[1], 10);
  } else {
    totalDeductions = incomeTaxTds + professionalTax + gpf + gis + loanRecovery + stampRevenue;
  }

  // Net Pay
  let netMonthly = 0;
  const netMatch = clean.match(/(?:Net\s*Pay|et\s*Pay)\s*[:|-]?\s*(\d+)/i);
  if (netMatch) {
    netMonthly = parseInt(netMatch[1], 10);
  } else if (grossMonthly) {
    netMonthly = grossMonthly - totalDeductions;
  }

  // Bank, PAN, IFSC
  const panMatch = clean.match(/Pan\s*No\s*:\s*([A-Z0-9]+)/i);
  const pan = panMatch ? panMatch[1] : '';

  const bankMatch = clean.match(/Bank\s*A\/c\s*No\s*:\s*([A-Za-z0-9]+)/i);
  const bankAccount = bankMatch ? bankMatch[1] : '';

  const ifscMatch = clean.match(/IFSC\s*Code\s*:\s*([A-Za-z0-9]+)/i);
  const ifsc = ifscMatch ? ifscMatch[1] : '';

  // Dates
  const dojMatch = clean.match(/Date\s*of\s*Joining\s*:\s*(\d{2}\/\d{2}\/\d{4})/i);
  const dateOfJoining = dojMatch ? dojMatch[1] : '';

  const dorMatch = clean.match(/Date\s*of\s*Retirement\s*:\s*(\d{2}\/\d{2}\/\d{4})/i);
  const dateOfRetirement = dorMatch ? dorMatch[1] : '';

  return {
    employerName: employerName || 'Government / Public Health Unit',
    employeeName: employeeName || 'Employee',
    employeeCode,
    designation: designation || 'Officer / Specialist',
    salaryMonth: salaryMonth || 'Current Month',
    payCommission,
    basicPay,
    hra,
    da,
    daArrears,
    ta,
    cla,
    grossMonthly: grossMonthly || (netMonthly + totalDeductions),
    grossAnnual: (grossMonthly || (netMonthly + totalDeductions)) * 12,
    deductions: {
      incomeTaxTds,
      professionalTax,
      gpf,
      gis,
      loanRecovery,
      stampRevenue,
      totalDeductions
    },
    netMonthly: netMonthly || (grossMonthly - totalDeductions),
    netAnnual: (netMonthly || (grossMonthly - totalDeductions)) * 12,
    pan,
    bankAccount,
    ifsc,
    dateOfJoining,
    dateOfRetirement
  };
}

module.exports = { parsePayslipText };
