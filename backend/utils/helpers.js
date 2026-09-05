const crypto = require("crypto");

const defaultWealthData = (ownerName = 'User') => ({
  assets: [],
  liabilities: [],
  documents: [],
  alerts: [],
  family: [
    { id: crypto.randomUUID(), name: ownerName, relation: 'Self', access: 'Owner', phone: '', email: '' }
  ],
  goals: [],
  activity: [],
  incomeStreams: [],
  incomeTarget: 200000,
  cash: { income: 0, expenses: 0 }
});

const shortText = (value, max = 160) => String(value || '').replace(/[<>]/g, '').trim().slice(0, max);
const cleanNumber = value => Math.max(0, Number(value) || 0);
const cleanDate = value => /^\d{4}-\d{2}-\d{2}$/.test(String(value || '')) ? String(value) : '';
const ensureId = value => String(value || '').trim() || crypto.randomUUID();

const cleanWealthData = data => ({
  assets: (Array.isArray(data?.assets) ? data.assets : []).slice(0, 500).map(item => ({
    id: ensureId(item.id),
    name: shortText(item.name, 90) || 'Untitled asset',
    type: shortText(item.type, 60) || 'Asset',
    value: cleanNumber(item.value),
    purchasePrice: cleanNumber(item.purchasePrice),
    acquisitionDate: cleanDate(item.acquisitionDate),
    owner: shortText(item.owner, 80),
    location: shortText(item.location, 120),
    ticker: shortText(item.ticker, 30).toUpperCase(),
    assetSubType: shortText(item.assetSubType, 50),
    sector: shortText(item.sector, 80),
    tags: shortText(item.tags, 160),
    purchaseDate: cleanDate(item.purchaseDate),
    buyPrice: cleanNumber(item.buyPrice),
    quantity: cleanNumber(item.quantity),
    currentPrice: cleanNumber(item.currentPrice),
    currency: shortText(item.currency, 3).toUpperCase(),
    exchangeRate: cleanNumber(item.exchangeRate),
    brokerageFees: cleanNumber(item.brokerageFees),
    lotId: shortText(item.lotId, 80),
    dividendsReceived: cleanNumber(item.dividendsReceived),
    corporateActions: shortText(item.corporateActions, 240),
    taxLotMethod: shortText(item.taxLotMethod, 40),
    brand: shortText(item.brand, 80),
    model: shortText(item.model, 80),
    referenceNumber: shortText(item.referenceNumber, 80),
    watchBoxPapers: shortText(item.watchBoxPapers, 80),
    watchMarketJson: shortText(item.watchMarketJson, 4000),
    year: cleanNumber(item.year),
    odometer: cleanNumber(item.odometer),
    registrationNumber: shortText(item.registrationNumber, 50),
    serialNumber: shortText(item.serialNumber, 80),
    area: shortText(item.area, 80),
    condition: shortText(item.condition, 40),
    hasLoan: shortText(item.hasLoan, 20),
    loanAmount: cleanNumber(item.loanAmount),
    downPayment: cleanNumber(item.downPayment),
    interestRate: cleanNumber(item.interestRate),
    loanTenureYears: cleanNumber(item.loanTenureYears),
    loanStartDate: cleanDate(item.loanStartDate),
    emiAmount: cleanNumber(item.emiAmount),
    loanType: shortText(item.loanType, 40),
    source: shortText(item.source, 80) || 'Manual',
    valuationBasis: shortText(item.valuationBasis, 520),
    estimatedValueDate: cleanDate(item.estimatedValueDate),
    valuationLow: cleanNumber(item.valuationLow),
    valuationHigh: cleanNumber(item.valuationHigh),
    valuationConfidence: shortText(item.valuationConfidence, 40),
    lastUpdated: cleanDate(item.lastUpdated) || new Date().toISOString().slice(0, 10),
    note: shortText(item.note, 240),
    renewal: cleanDate(item.renewal),
    photoId: shortText(item.photoId, 80),
    photoName: shortText(item.photoName, 160),
    photoUrl: shortText(item.photoUrl, 220),
    valueHistory: (Array.isArray(item.valueHistory) ? item.valueHistory : []).slice(-120).map(row => ({
      id: ensureId(row.id),
      value: cleanNumber(row.value),
      date: cleanDate(row.date) || new Date().toISOString().slice(0, 10),
      note: shortText(row.note, 140)
    })),
    investmentTransactions: (Array.isArray(item.investmentTransactions) ? item.investmentTransactions : []).slice(-100).map(row => ({
      id: ensureId(row.id),
      type: shortText(row.type, 30) || 'Event',
      date: cleanDate(row.date) || new Date().toISOString().slice(0, 10),
      quantity: cleanNumber(row.quantity),
      price: cleanNumber(row.price),
      proceeds: cleanNumber(row.proceeds),
      costBasis: cleanNumber(row.costBasis),
      realizedGain: Number(row.realizedGain) || 0,
      taxLotMethod: shortText(row.taxLotMethod, 40),
      allocations: (Array.isArray(row.allocations) ? row.allocations : []).slice(0, 20).map(allocation => ({
        lotId: shortText(allocation.lotId, 80),
        name: shortText(allocation.name, 120),
        quantity: cleanNumber(allocation.quantity),
        costBasis: cleanNumber(allocation.costBasis)
      })),
      ratio: shortText(row.ratio, 20),
      amount: cleanNumber(row.amount),
      note: shortText(row.note, 220)
    }))
  })),
  liabilities: (Array.isArray(data?.liabilities) ? data.liabilities : []).slice(0, 500).map(item => ({
    id: ensureId(item.id),
    name: shortText(item.name, 90) || 'Untitled liability',
    type: shortText(item.type, 60) || 'Liability',
    value: cleanNumber(item.value),
    emi: cleanNumber(item.emi),
    rate: cleanNumber(item.rate),
    lender: shortText(item.lender, 80),
    source: shortText(item.source, 80) || 'Manual',
    lastUpdated: cleanDate(item.lastUpdated) || new Date().toISOString().slice(0, 10),
    dueDate: cleanDate(item.dueDate)
  })),
  documents: (Array.isArray(data?.documents) ? data.documents : []).slice(0, 1000).map(item => ({
    id: ensureId(item.id),
    name: shortText(item.name, 120) || 'Untitled document',
    type: shortText(item.type, 80) || 'Document',
    category: shortText(item.category, 60) || 'other',
    docNumber: shortText(item.docNumber, 80),
    owner: shortText(item.owner, 80) || 'Self',
    issueDate: cleanDate(item.issueDate),
    expiry: cleanDate(item.expiry || item.renewal),
    renewal: cleanDate(item.renewal || item.expiry),
    status: shortText(item.status, 80) || 'Stored',
    linkedTo: shortText(item.linkedTo, 120),
    requiredFor: shortText(item.requiredFor, 120),
    notes: shortText(item.notes, 300),
    fileId: shortText(item.fileId, 80),
    fileName: shortText(item.fileName, 160),
    fileUrl: shortText(item.fileUrl, 220),
    isMasked: Boolean(item.isMasked)
  })),
  alerts: (Array.isArray(data?.alerts) ? data.alerts : []).slice(0, 500).map(item => ({
    id: ensureId(item.id),
    name: shortText(item.name, 100) || 'Reminder',
    date: cleanDate(item.date),
    priority: shortText(item.priority, 30) || 'Normal',
    channel: shortText(item.channel, 40) || 'In-app',
    linkedTo: shortText(item.linkedTo, 100)
  })),
  family: (Array.isArray(data?.family) ? data.family : []).slice(0, 100).map(item => ({
    id: ensureId(item.id),
    name: shortText(item.name, 90) || 'Family member',
    relation: shortText(item.relation, 60),
    access: shortText(item.access, 60) || 'View only',
    phone: shortText(item.phone, 30),
    email: shortText(item.email, 120)
  })),
  goals: (Array.isArray(data?.goals) ? data.goals : []).slice(0, 200).map(item => ({
    id: ensureId(item.id),
    name: shortText(item.name, 100) || 'Goal',
    target: cleanNumber(item.target),
    saved: cleanNumber(item.saved),
    deadline: cleanDate(item.deadline),
    priority: shortText(item.priority, 40)
  })),
  activity: (Array.isArray(data?.activity) ? data.activity : []).slice(-100).map(item => ({
    id: ensureId(item.id),
    label: shortText(item.label, 120),
    detail: shortText(item.detail, 160),
    createdAt: shortText(item.createdAt, 40) || new Date().toISOString()
  })),
  cash: {
    income: cleanNumber(data?.cash?.income),
    expenses: cleanNumber(data?.cash?.expenses)
  },
  incomeDetails: {
    basicSalary: cleanNumber(data?.incomeDetails?.basicSalary),
    hra: cleanNumber(data?.incomeDetails?.hra),
    specialAllowance: cleanNumber(data?.incomeDetails?.specialAllowance),
    bonus: cleanNumber(data?.incomeDetails?.bonus),
    otherAllowances: cleanNumber(data?.incomeDetails?.otherAllowances),
    employerPf: cleanNumber(data?.incomeDetails?.employerPf),
    professionalTax: cleanNumber(data?.incomeDetails?.professionalTax),
    otherIncome: cleanNumber(data?.incomeDetails?.otherIncome),
    bankInterest: cleanNumber(data?.incomeDetails?.bankInterest),
    dividendIncome: cleanNumber(data?.incomeDetails?.dividendIncome),
    rentalIncome: cleanNumber(data?.incomeDetails?.rentalIncome),
    rentPaid: cleanNumber(data?.incomeDetails?.rentPaid),
    isMetro: Boolean(data?.incomeDetails?.isMetro),
    stcgEquity: cleanNumber(data?.incomeDetails?.stcgEquity),
    ltcgEquity: cleanNumber(data?.incomeDetails?.ltcgEquity),
    stclBroughtForward: cleanNumber(data?.incomeDetails?.stclBroughtForward),
    ltclBroughtForward: cleanNumber(data?.incomeDetails?.ltclBroughtForward),
    freelanceIncome: cleanNumber(data?.incomeDetails?.freelanceIncome),
    municipalTaxes: cleanNumber(data?.incomeDetails?.municipalTaxes),
    tdsPaid: cleanNumber(data?.incomeDetails?.tdsPaid),
    advanceTaxPaid: cleanNumber(data?.incomeDetails?.advanceTaxPaid),
    _frequency: shortText(data?.incomeDetails?._frequency, 20),
    _sourceDocument: shortText(data?.incomeDetails?._sourceDocument, 100)
  },
  taxDeductions: {
    selectedRegime: shortText(data?.taxDeductions?.selectedRegime, 20),
    sec80C: cleanNumber(data?.taxDeductions?.sec80C),
    sec80CCD1B: cleanNumber(data?.taxDeductions?.sec80CCD1B),
    sec80D: cleanNumber(data?.taxDeductions?.sec80D),
    homeLoanInterest: cleanNumber(data?.taxDeductions?.homeLoanInterest),
    profTax: cleanNumber(data?.taxDeductions?.profTax),
    sec80TTA: cleanNumber(data?.taxDeductions?.sec80TTA),
    sec80E: cleanNumber(data?.taxDeductions?.sec80E),
    sec80EEA: cleanNumber(data?.taxDeductions?.sec80EEA),
    sec80G: cleanNumber(data?.taxDeductions?.sec80G),
    sec80GG: cleanNumber(data?.taxDeductions?.sec80GG)
  },
  incomeStreams: (Array.isArray(data?.incomeStreams) ? data.incomeStreams : []).slice(0, 500).map(item => ({
    id: ensureId(item.id),
    name: shortText(item.name, 120) || 'Income Stream',
    category: shortText(item.category, 60) || 'salary',
    amount: cleanNumber(item.amount),
    frequency: shortText(item.frequency, 30) || 'monthly',
    isPassive: Boolean(item.isPassive),
    status: shortText(item.status, 20) || 'active',
    taxType: shortText(item.taxType, 40) || 'taxable',
    startDate: cleanDate(item.startDate) || new Date().toISOString().slice(0, 10),
    notes: shortText(item.notes, 500),
    createdAt: shortText(item.createdAt, 40) || new Date().toISOString(),
    updatedAt: shortText(item.updatedAt, 40) || new Date().toISOString()
  })),
  incomeTarget: cleanNumber(data?.incomeTarget || 200000),
  expenses: Array.isArray(data?.expenses) ? data.expenses : [],
  willVault: typeof data?.willVault === 'object' && data?.willVault !== null ? data.willVault : {},
  lastParsedPayslip: typeof data?.lastParsedPayslip === 'object' && data?.lastParsedPayslip !== null ? data.lastParsedPayslip : null
});
const normalizeText = text => String(text || '')
  .replace(/\r/g, '\n')
  .replace(/[|*~<>]/g, ' ')
  .replace(/[^\S\n]+/g, ' ')
  .replace(/\n{3,}/g, '\n\n')
  .trim();
const unique = values => [...new Set(values.map(value => String(value || '').trim()).filter(Boolean))];
const titleCase = value => String(value || '').toLowerCase().replace(/\b[a-z]/g, char => char.toUpperCase());
const smartLineClean = value => normalizeText(value)
  .replace(/^[^a-zA-Z0-9+@]+/, '')
  .replace(/\s+([,.:])/g, '$1')
  .replace(/([@.])\s+/g, '$1')
  .replace(/\s+@/g, '@')
  .replace(/\bCo[\s-]+Foundes\b/ig, 'Co Founder')
  .replace(/\bCo[\s-]+Founder\b/ig, 'Co Founder')
  .replace(/\bFoundes\b/ig, 'Founder')
  .replace(/\bPRE SALES[\s-]*TECHNICAL\b/ig, 'Pre Sales Technical')
  .replace(/\bANA CEO\b/ig, 'CEO')
  .trim();

const truthy = value => ['true', '1', 'yes', 'on'].includes(String(value || '').toLowerCase());
const DATA_URL_PREFIX = 'data:image/jpeg;base64,';

const run = (command, args, options = {}) => new Promise((resolve, reject) => {
  const child = spawn(command, args, { windowsHide: true, ...options });
  let stderr = '';
  child.stderr.on('data', data => { stderr += data.toString(); });
  child.on('error', reject);
  child.on('close', code => {
    if (code === 0) resolve();
    else reject(new Error(stderr || `${path.basename(command)} exited with ${code}`));
  });
});

const renderPdf = async (pdfPath, jobDir, options = {}) => {
  const prefix = path.join(jobDir, 'page');
  const args = ['-png', '-r', String(options.dpi || 220)];
  if (options.firstPage) args.push('-f', String(options.firstPage));
  if (options.lastPage) args.push('-l', String(options.lastPage));
  args.push(pdfPath, prefix);
  await run(pdftoppm, args);
  return fs.readdirSync(jobDir)
    .filter(name => /^page-\d+\.png$/i.test(name))
    .sort()
    .map(name => path.join(jobDir, name));
};

const previewDataUrl = async imagePath => {
  const buffer = await sharp(imagePath)
    .resize({ width: 520, withoutEnlargement: true })
    .jpeg({ quality: 78 })
    .toBuffer();
  return DATA_URL_PREFIX + buffer.toString('base64');
};

const clampCrop = (meta, crop) => ({
  left: Math.max(0, Math.min(meta.width - 1, Math.round(crop.left))),
  top: Math.max(0, Math.min(meta.height - 1, Math.round(crop.top))),
  width: Math.max(1, Math.min(meta.width - Math.round(crop.left), Math.round(crop.width))),
  height: Math.max(1, Math.min(meta.height - Math.round(crop.top), Math.round(crop.height)))
});

module.exports = {
  shortText,
  cleanNumber,
  cleanDate,
  ensureId,
  cleanWealthData,
  defaultWealthData
};