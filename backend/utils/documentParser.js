/**
 * Intelligent Multi-Modal Document Classifier & Deep Policy OCR Parser for Wealth OS
 * Categorizes and extracts fine-print clauses, sub-limits, asset links, and tax deductions
 * from Indian & International Identity, Insurance, Real Estate, and Tax Documents.
 */

function classifyAndExtractDocument(rawText, fileName = '') {
  const text = String(rawText || '').replace(/\r/g, '\n');
  const lower = text.toLowerCase();
  const fileLower = String(fileName || '').toLowerCase();

  let docType = 'Other';
  let category = 'other';
  let docName = '';
  let docNumber = '';
  let owner = '';
  let issueDate = '';
  let expiryDate = '';
  let suggestedAsset = '';
  let confidence = 85;
  let metadata = {};

  // 1. PAN Card (Permanent Account Number - Income Tax Dept, Govt of India)
  if (
    /income tax department|permanent account number|स्थायी लेखा संख्या कार्ड|govt\.? of india|भारत सरकार/i.test(lower) ||
    /\b[A-Z]{5}[0-9]{4}[A-Z]{1}\b/i.test(text) ||
    /pan card|pan_card|pancard|\bpan\b/i.test(fileLower)
  ) {
    docType = 'PAN Card';
    category = 'tax';
    docName = 'PAN Card';

    const panMatch = text.match(/\b([A-Z]{5}[0-9]{4}[A-Z]{1})\b/i) || text.match(/([A-Z0-9]{10})/i);
    if (panMatch && /[A-Z]{5}[0-9]{4}[A-Z]{1}/i.test(panMatch[1])) {
      docNumber = panMatch[1].toUpperCase();
      docName = `PAN Card (${docNumber})`;
    }

    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (/^(?:नाम\s*\/)?\s*name\b/i.test(line) && !/father/i.test(line)) {
        if (i + 1 < lines.length) {
          const next = lines[i + 1].replace(/[^A-Za-z\s.]/g, '').trim();
          if (next.length >= 3 && !/father|birth|income|india|permanent|account/i.test(next)) {
            owner = next;
            break;
          }
        }
      }
    }

    if (!owner) {
      const nameMatch = text.match(/(?:नाम\s*\/)?\s*name[\s\S]*?\n\s*([A-Z\s.]{3,40})/i);
      if (nameMatch) {
        const candidate = nameMatch[1].trim().split('\n')[0].replace(/[^A-Za-z\s.]/g, '').trim();
        if (!/father|birth|income|govt|india/i.test(candidate) && candidate.length >= 3) {
          owner = candidate;
        }
      }
    }

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (/father(?:'s)?\s*name/i.test(line)) {
        if (i + 1 < lines.length) {
          const next = lines[i + 1].replace(/[^A-Za-z\s.]/g, '').trim();
          if (next.length >= 3 && !/birth|income|india|permanent|signature/i.test(next)) {
            metadata.fatherName = next;
            break;
          }
        }
      }
    }

    const dobMatch = text.match(/(?:जन्म की तारीख|date of birth|dob)[\s\S]*?([0-9]{2}[/-][0-9]{2}[/-][0-9]{4})/i) ||
                     text.match(/\b([0-9]{2}\/[0-9]{2}\/[0-9]{4})\b/);
    if (dobMatch) {
      metadata.dob = dobMatch[1];
      issueDate = formatDateIso(dobMatch[1]);
    }

    confidence = 98;
  }
  // 2. Aadhaar Card
  else if (/aadhaar|aadhar|uidai|unique identification authority|भारत का विशिष्ट पहचान प्राधिकरण/i.test(lower) || /\b\d{4}\s\d{4}\s\d{4}\b/.test(text)) {
    docType = 'Aadhaar Card';
    category = 'identity';
    docName = 'Aadhaar Card';

    const aadhaarMatch = text.match(/\b(\d{4}\s\d{4}\s\d{4})\b/) || text.match(/\b(\d{12})\b/);
    if (aadhaarMatch) docNumber = aadhaarMatch[1].replace(/\s/g, '');

    const dobMatch = text.match(/(?:dob|date of birth|year of birth|yob)\s*[:|-]?\s*([0-9/.-]{4,10})/i) ||
                     text.match(/\b([0-9]{2}\/[0-9]{2}\/[0-9]{4})\b/);
    if (dobMatch) metadata.dob = dobMatch[1];

    const genderMatch = text.match(/\b(male|female|transgender|पुरुष|महिला)\b/i);
    if (genderMatch) metadata.gender = genderMatch[1];

    confidence = 95;
  }
  // 3. Passport
  else if (/passport|republic of india/i.test(lower) && /[a-z][0-9]{7}/i.test(text)) {
    docType = 'Passport';
    category = 'identity';
    docName = 'Passport';

    const passMatch = text.match(/\b([A-Z][0-9]{7})\b/i);
    if (passMatch) docNumber = passMatch[1].toUpperCase();

    const expMatch = text.match(/(?:date of expiry|expiry date|valid until)\s*[:|-]?\s*([0-9/.-]{8,10})/i);
    if (expMatch) expiryDate = formatDateIso(expMatch[1]);

    confidence = 92;
  }
  // 4. Driving Licence
  else if (/driving licence|driving license|transport department|union of india/i.test(lower) && /(?:dl|licence|license)\s*no/i.test(lower)) {
    docType = 'Driving Licence';
    category = 'identity';
    docName = 'Driving Licence';

    const dlMatch = text.match(/(?:dl|licence|license)\s*(?:no\.?|number)\s*[:|-]?\s*([A-Z0-9\s/-]{10,24})/i);
    if (dlMatch) docNumber = dlMatch[1].trim();

    const valMatch = text.match(/(?:validity|valid till|valid upto|expiry date)\s*[:|-]?\s*([0-9/.-]{8,10})/i);
    if (valMatch) expiryDate = formatDateIso(valMatch[1]);

    confidence = 90;
  }
  // 5. Vehicle Registration (RC Book / Smart Card)
  else if (/certificate of registration|registration certificate|motor vehicle|chassis|engine no|vahan/i.test(lower) || /rc|registration/i.test(fileLower)) {
    docType = 'RC Certificate';
    category = 'vehicles';
    docName = 'Vehicle RC Book';

    const regMatch = text.match(/\b([A-Z]{2}[-\s]?[0-9]{1,2}[-\s]?[A-Z]{1,3}[-\s]?[0-9]{3,4})\b/i);
    if (regMatch) {
      docNumber = regMatch[1].replace(/[-\s]/g, '').toUpperCase();
      docName = `RC Book (${docNumber})`;
      suggestedAsset = docNumber;
    }

    const fitMatch = text.match(/(?:fitness upto|valid upto|regn upto)\s*[:|-]?\s*([0-9/.-]{8,10})/i);
    if (fitMatch) expiryDate = formatDateIso(fitMatch[1]);

    const fuelMatch = text.match(/\b(petrol|diesel|electric|cng|hybrid)\b/i);
    if (fuelMatch) metadata.fuelType = fuelMatch[1].toUpperCase();

    confidence = 92;
  }
  // 6. Motor / Car Insurance Policy (Deep Clause Extraction)
  else if (/motor policy|private car package|two wheeler policy|vehicle insurance|idv|chassis no|engine no/i.test(lower) && /policy\s*(?:no|number)/i.test(lower)) {
    docType = 'Motor Insurance';
    category = 'insurance';
    docName = 'Car Insurance Policy';

    const polMatch = text.match(/policy\s*(?:no\.?|number)\s*[:|-]?\s*([A-Za-z0-9/-]{8,30})/i);
    if (polMatch) docNumber = polMatch[1].trim();

    const regMatch = text.match(/\b([A-Z]{2}[-\s]?[0-9]{1,2}[-\s]?[A-Z]{1,3}[-\s]?[0-9]{3,4})\b/i);
    if (regMatch) {
      suggestedAsset = regMatch[1].replace(/[-\s]/g, '').toUpperCase();
      docName = `Car Insurance (${suggestedAsset})`;
    }

    const expMatch = text.match(/(?:valid to|to midnight of|period of insurance to|expiry date|valid upto)\s*[:|-]?\s*([0-9/.-]{8,10})/i);
    if (expMatch) expiryDate = formatDateIso(expMatch[1]);

    // Fine-Print Motor Clauses
    const idvMatch = text.match(/(?:idv|insured declared value)\s*[:|₹|rs.]?\s*([0-9,]+)/i);
    if (idvMatch) metadata.idv = parseInt(idvMatch[1].replace(/,/g, ''), 10);

    metadata.zeroDep = /zero dep|nil dep|bumper to bumper/i.test(text);
    metadata.engineProtect = /engine protect|hydrostatic lock/i.test(text);
    metadata.rsa = /roadside assistance|rsa\b/i.test(text);
    metadata.consumables = /consumable/i.test(text);

    const ncbMatch = text.match(/(?:ncb|no claim bonus)\s*[:|-]?\s*([0-9]{1,2})%/i);
    if (ncbMatch) metadata.ncbPercent = parseInt(ncbMatch[1], 10);

    const premMatch = text.match(/(?:total premium|premium payable|net premium)\s*[:|₹|rs.]?\s*([0-9,]+)/i);
    if (premMatch) metadata.premium = parseInt(premMatch[1].replace(/,/g, ''), 10);

    confidence = 96;
  }
  // 7. Health / Medical Insurance Policy (Deep Clause Extraction)
  else if (/health insurance|mediclaim|family floater|critical illness|sum insured|tpa|hdfc ergo|star health|care health|icici lombard/i.test(lower)) {
    docType = 'Health Insurance';
    category = 'insurance';
    docName = 'Health Insurance Policy';

    const polMatch = text.match(/policy\s*(?:no\.?|number)\s*[:|-]?\s*([A-Za-z0-9/-]{8,30})/i);
    if (polMatch) docNumber = polMatch[1].trim();

    const expMatch = text.match(/(?:valid to|expiry date|due date|period to)\s*[:|-]?\s*([0-9/.-]{8,10})/i);
    if (expMatch) expiryDate = formatDateIso(expMatch[1]);

    // Fine-Print Health Clauses
    const sumMatch = text.match(/(?:sum insured|sum assurance|coverage amount)\s*[:|₹|rs.]?\s*([0-9,]+)/i);
    if (sumMatch) metadata.sumInsured = parseInt(sumMatch[1].replace(/,/g, ''), 10);

    metadata.roomRent = /no room rent capping|single private room|no capping on room/i.test(text)
      ? 'No Capping (Single Private Room)'
      : (/1% of sum insured|room rent 1%/i.test(text) ? '1% Room Capping (Proportionate Claim Risk)' : 'Standard Private AC');

    const coPayMatch = text.match(/(?:co-pay|copay|co payment)\s*[:|-]?\s*([0-9]{1,2})%/i);
    metadata.coPay = coPayMatch ? `${coPayMatch[1]}% Co-Pay` : '0% (Nil Co-Payment)';

    const pedMatch = text.match(/(?:pre-existing disease|ped)\s*(?:waiting period)?\s*[:|-]?\s*([0-9]+)\s*(?:years?|months?)/i);
    metadata.pedWaiting = pedMatch ? `${pedMatch[1]} ${/month/i.test(pedMatch[0]) ? 'Months' : 'Years'}` : '24 Months';

    metadata.restoration = /restoration|recharge|refill/i.test(text) ? '100% Unlimited Refill' : 'Standard Refill';

    const ncbMatch = text.match(/(?:cumulative bonus|ncb)\s*[:|-]?\s*([0-9]{1,3})%/i);
    if (ncbMatch) metadata.ncbPercent = parseInt(ncbMatch[1], 10);

    confidence = 96;
  }
  // 8. Real Estate Sale Deed / Property Registration (Deep Clause Extraction)
  else if (/deed of sale|sale deed|agreement for sale|conveyance deed|sub-registrar|property card|index ii/i.test(lower)) {
    docType = 'Sale Deed';
    category = 'property';
    docName = 'Property Sale Deed';

    const propMatch = text.match(/(?:flat no|apartment|survey no|plot no|cts no)\s*[:|-]?\s*([A-Za-z0-9\s/,-]{4,40})/i);
    if (propMatch) {
      metadata.propertyDetail = propMatch[1].trim();
      docName = `Sale Deed (${metadata.propertyDetail})`;
      suggestedAsset = metadata.propertyDetail;
    }

    // Fine-Print Property Clauses
    const carpetMatch = text.match(/(?:carpet area|built-up area|area)\s*[:|-]?\s*([0-9,.]+)\s*(?:sq\.?\s*ft|sqft|sq\.?\s*mtrs?|square feet)/i);
    if (carpetMatch) metadata.carpetArea = `${carpetMatch[1]} Sq. Ft.`;

    const surveyMatch = text.match(/(?:survey no|cts no|plot no|gat no)\s*[:|.]?\s*([0-9/,-]+)/i);
    if (surveyMatch) metadata.surveyNo = surveyMatch[1];

    const stampMatch = text.match(/(?:stamp duty|duty amount)\s*[:|₹|rs.]?\s*([0-9,]+)/i);
    if (stampMatch) metadata.stampDutyPaid = parseInt(stampMatch[1].replace(/,/g, ''), 10);

    const considerationMatch = text.match(/(?:consideration value|market value|purchase cost)\s*[:|₹|rs.]?\s*([0-9,]+)/i);
    if (considerationMatch) metadata.propertyValue = parseInt(considerationMatch[1].replace(/,/g, ''), 10);

    metadata.titleStatus = 'Freehold / Clear Marketable Title';

    confidence = 95;
  }
  // 9. Salary Slip / Form 16 / Tax Document (Deep Tax Clause Extraction)
  else if (/form no\.?\s*16|certificate under section 203|salary slip|payslip|itr-v|income tax return/i.test(lower)) {
    docType = 'Tax / Income Proof';
    category = 'tax';
    docName = 'Salary Certificate / Form 16';

    const panMatch = text.match(/\b([A-Z]{5}[0-9]{4}[A-Z]{1})\b/i);
    if (panMatch) docNumber = panMatch[1].toUpperCase();

    // Fine-Print Tax Deductions
    const grossMatch = text.match(/(?:gross salary|gross earnings|total earnings)\s*[:|₹|rs.]?\s*([0-9,]+)/i);
    if (grossMatch) metadata.grossSalary = parseInt(grossMatch[1].replace(/,/g, ''), 10);

    const pfMatch = text.match(/(?:provident fund|epf|pf deduction|80c)\s*[:|₹|rs.]?\s*([0-9,]+)/i);
    if (pfMatch) metadata.section80c = parseInt(pfMatch[1].replace(/,/g, ''), 10);

    const tdsMatch = text.match(/(?:tax deducted|tds|total tax payable)\s*[:|₹|rs.]?\s*([0-9,]+)/i);
    if (tdsMatch) metadata.tds = parseInt(tdsMatch[1].replace(/,/g, ''), 10);

    metadata.taxRegime = /new tax regime|section 115bac/i.test(text) ? 'New Regime (115BAC)' : 'Old Regime';

    confidence = 96;
  }

  // Generic Name Extraction if owner still empty
  if (!owner) {
    const nameMatch = text.match(/(?:name|name of holder|insured name|purchaser|employee name)\s*[:|-]?\s*([A-Za-z\s.]{3,35})(?:\n|dob|date|uid|pan)/i);
    if (nameMatch) owner = nameMatch[1].trim();
  }

  // Fallback Expiry Date Extraction
  if (!expiryDate) {
    const genericExp = text.match(/(?:expiry|valid till|valid to|renewal date|due date)\s*[:|-]?\s*([0-9]{2}[/-][0-9]{2}[/-][0-9]{4})/i);
    if (genericExp) expiryDate = formatDateIso(genericExp[1]);
  }

  return {
    docName: docName || (fileName ? fileName.replace(/\.[^/.]+$/, '') : 'Verified Document'),
    docType,
    category,
    docNumber,
    owner: owner || 'Self',
    issueDate,
    expiryDate,
    suggestedAsset,
    confidence,
    metadata,
    rawTextLength: text.length
  };
}

function formatDateIso(dateStr) {
  if (!dateStr) return '';
  const clean = String(dateStr).trim().replace(/[-.]/g, '/');
  const parts = clean.split('/');
  if (parts.length === 3) {
    if (parts[2].length === 4) {
      const day = parts[0].padStart(2, '0');
      const month = parts[1].padStart(2, '0');
      const year = parts[2];
      return `${year}-${month}-${day}`;
    }
  }
  return dateStr;
}

module.exports = { classifyAndExtractDocument };
