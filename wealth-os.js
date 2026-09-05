const tokenKey = "wealth-os-token";
const localApiBase = "http://localhost:3001";

function apiUrl(path, useFallback = false) {
  if (useFallback || location.protocol === "file:") return `${localApiBase}${path}`;
  return path;
}

const config = {
  home: {
    label: "Home",
    title: "Dashboard",
    action: "Add Asset",
    color: "linear-gradient(135deg, #162848 0%, #32266a 100%)"
  },
  assets: {
    label: "Assets",
    title: "Your Assets",
    action: "Add Asset",
    color: "linear-gradient(135deg, #11231f 0%, #1f6f65 100%)"
  },
  documents: {
    label: "Documents",
    title: "Document Vault",
    action: "Add Document",
    color: "linear-gradient(135deg, #112f47 0%, #3d5fa8 100%)"
  },
  taxDocuments: {
    label: "Documents",
    title: "Tax Documents",
    action: "Add Tax Document",
    color: "linear-gradient(135deg, #111820 0%, #6f7f74 100%)"
  },
  messages: {
    label: "Alerts",
    title: "Alerts",
    action: "Add Alert",
    color: "linear-gradient(135deg, #173b45 0%, #3aa37d 100%)"
  },
  manager: {
    label: "Family",
    title: "Family",
    action: "Add Member",
    color: "linear-gradient(135deg, #17304d 0%, #4a69b3 100%)"
  },
  reports: {
    label: "Reports",
    title: "Reports",
    action: "Add Goal",
    color: "linear-gradient(135deg, #132f4c 0%, #337bb8 100%)"
  },
  ai: {
    label: "AI",
    title: "AI Advisor",
    action: "Ask",
    color: "linear-gradient(135deg, #162a4d 0%, #6152bd 100%)"
  }
};

const assetCategories = [
  ["Car", "Vehicles and service papers"],
  ["Land", "Plots, sites, farmland"],
  ["Shoes", "Sneakers and collectibles"],
  ["Watches", "Luxury watches and certificates"],
  ["Flats", "Apartments and houses"],
  ["Investment Assets", "Stocks, mutual funds, ESOPs"],
  ["Other Funds", "FD, PPF, EPF, NPS"],
  ["Cash", "Bank balance and cash reserves"]
];

const assetCategoryViews = {
  vehicles: {
    title: "Vehicles",
    tile: "Car",
    addLabel: "Add your vehicle",
    emptyTitle: "Add your first vehicle",
    emptyText: "Save buying price, current value, registration, renewal date, owner, and documents in one place.",
    fallback: "assets/wealth-hero-suv-cutout.png",
    addType: "Car",
    matcher: asset => {
      const text = assetSearchText(asset);
      if (isInvestmentLikeAsset(asset)) return false;
      return /\bcar\b|\bbike\b|\bvehicle\b|\bscooter\b|\bmotorcycle\b|fortuner|bmw|nissan|magnite|honda|toyota|maruti|hyundai|mahindra|nexon|harrier|safari|tiago|tigor|punch|altroz|curvv/.test(text);
    },
    specs: asset => [asset.brand, asset.model, asset.year ? String(asset.year) : "", asset.registrationNumber].filter(Boolean),
    detailSpecs: asset => [
      ["Brand", asset.brand],
      ["Model", asset.model],
      ["Year", asset.year],
      ["Registration", asset.registrationNumber],
      ["Condition", asset.condition],
      ["Insurance", asset.renewal]
    ]
  },
  land: {
    title: "Land",
    tile: "Land",
    addLabel: "Add land",
    emptyTitle: "Add your first land record",
    emptyText: "Track plot location, survey number, area, title quality, buying price, current value, and papers.",
    fallback: "assets/wealth-fallback-land.png",
    addType: "Land",
    matcher: asset => {
      const type = assetTypeText(asset);
      if (type === "flats") return false;
      if (type === "land") return true;
      return /\bland\b|plot|site|farmland|survey/.test(assetSearchText(asset));
    },
    specs: asset => [asset.location, asset.area, asset.serialNumber].filter(Boolean),
    detailSpecs: asset => [
      ["Location", asset.location],
      ["Area", asset.area],
      ["Survey / Plot", asset.serialNumber],
      ["Title", asset.condition],
      ["Owner", asset.owner],
      ["Updated", asset.lastUpdated]
    ]
  },
  shoes: {
    title: "Shoes",
    tile: "Shoes",
    addLabel: "Add shoes",
    emptyTitle: "Add your first collectible pair",
    emptyText: "Track brand, edition, buying price, current resale value, condition, and proof of purchase.",
    fallback: "assets/wealth-fallback-shoes-box.png",
    addType: "Shoes",
    matcher: asset => /\bshoe\b|\bshoes\b|sneaker|collectible pair/.test(assetSearchText(asset)),
    specs: asset => [asset.brand, asset.model, asset.condition].filter(Boolean),
    detailSpecs: asset => [
      ["Brand", asset.brand],
      ["Edition", asset.model],
      ["Condition", asset.condition],
      ["Owner", asset.owner],
      ["Source", asset.source],
      ["Updated", asset.lastUpdated]
    ]
  },
  watches: {
    title: "Watches",
    tile: "Watches",
    addLabel: "Add watch",
    emptyTitle: "Add your first watch",
    emptyText: "Save model, serial number, box/papers status, buying price, current value, and certificate details.",
    fallback: "assets/wealth-fallback-watch.png",
    addType: "Watches",
    matcher: asset => /\bwatch\b|\bwatches\b|rolex|omega|patek|cartier|timepiece/.test(assetSearchText(asset)),
    specs: asset => [asset.brand, asset.model, asset.serialNumber].filter(Boolean),
    detailSpecs: asset => [
      ["Brand", asset.brand],
      ["Model", asset.model],
      ["Serial", asset.serialNumber],
      ["Condition", asset.condition],
      ["Owner", asset.owner],
      ["Updated", asset.lastUpdated]
    ]
  },
  flats: {
    title: "Flats",
    tile: "Flats",
    addLabel: "Add flat",
    emptyTitle: "Add your first flat",
    emptyText: "Track apartment value, purchase price, location, ownership details, loan papers, and tax documents.",
    fallback: "assets/wealth-fallback-land.png",
    addType: "Flats",
    matcher: asset => {
      const type = assetTypeText(asset);
      if (type === "land") return false;
      if (type === "flats") return true;
      return /\bflat\b|\bflats\b|apartment|house|home|residence/.test(assetSearchText(asset));
    },
    specs: asset => [asset.location, asset.area, asset.condition].filter(Boolean),
    detailSpecs: asset => [
      ["Location", asset.location],
      ["Area", asset.area],
      ["Title", asset.condition],
      ["Owner", asset.owner],
      ["Source", asset.source],
      ["Updated", asset.lastUpdated]
    ]
  },
  investments: {
    title: "Investment Assets",
    tile: "Investment Assets",
    addLabel: "Add investment",
    emptyTitle: "Add your first investment",
    emptyText: "Track mutual funds, stocks, ESOPs, statements, current value, source, and nominee details.",
    fallback: "assets/wealth-fallback-investments.png",
    addType: "Investment Assets",
    matcher: asset => /investment|stock|mutual|esop|equity|shares/.test(assetSearchText(asset)),
    specs: asset => investmentSpecs(asset),
    detailSpecs: asset => [
      ["Ticker", asset.ticker],
      ["Type", asset.assetSubType],
      ["Sector", asset.sector],
      ["Tags", asset.tags],
      ["Quantity", asset.quantity],
      ["Avg buy", asset.buyPrice ? money(asset.buyPrice) : ""],
      ["Current price", asset.currentPrice ? money(asset.currentPrice) : ""],
      ["Account", asset.location],
      ["Owner", asset.owner],
      ["Updated", asset.lastUpdated]
    ]
  },
  funds: {
    title: "Other Funds",
    tile: "Other Funds",
    addLabel: "Add fund",
    emptyTitle: "Add your first fund",
    emptyText: "Save FD, PPF, EPF, NPS, account proof, latest balance, source, and nominee record.",
    fallback: "assets/wealth-fallback-investments.png",
    addType: "Other Funds",
    matcher: asset => /other fund|fd|fixed deposit|ppf|epf|nps|bond|deposit/.test(assetSearchText(asset)),
    specs: asset => [asset.location, asset.source, asset.condition].filter(Boolean),
    detailSpecs: asset => [
      ["Account", asset.location],
      ["Profile", asset.condition],
      ["Source", asset.source],
      ["Owner", asset.owner],
      ["Updated", asset.lastUpdated]
    ]
  },
  cash: {
    title: "Cash",
    tile: "Cash",
    addLabel: "Add cash",
    emptyTitle: "Add your cash balance",
    emptyText: "Track cash, bank balances, wallet money, reserve accounts, and where each balance is kept.",
    fallback: "assets/wealth-fallback-cash.png",
    addType: "Cash",
    matcher: asset => isCashAsset(asset),
    specs: asset => [asset.location, asset.source, asset.owner].filter(Boolean),
    detailSpecs: asset => [
      ["Bank / Place", asset.location],
      ["Source", asset.source],
      ["Owner", asset.owner],
      ["Updated", asset.lastUpdated]
    ]
  }
};

const documentFilters = [
  ["all", "All"],
  ["personal", "Personal"],
  ["missing", "Missing"],
  ["due", "Due soon"],
  ["expired", "Expired"],
  ["stored", "Stored"]
];

let documentFilter = "all";

const personalDocumentTypes = [
  { name: "Aadhaar Card", type: "Identity", aliases: ["aadhaar", "aadhar", "uidai"] },
  { name: "PAN Card", type: "Tax", aliases: ["pan card", "pan"] },
  { name: "Passport", type: "Identity", aliases: ["passport"] },
  { name: "Driving Licence", type: "Identity", aliases: ["driving licence", "driving license", "dl"] },
  { name: "Voter ID", type: "Identity", aliases: ["voter id", "election card"] },
  { name: "Birth Certificate", type: "Certificate", aliases: ["birth certificate"] },
  { name: "Bank Passbook / Cancelled Cheque", type: "Bank", aliases: ["passbook", "cancelled cheque", "bank proof"] },
  { name: "Income Tax Return", type: "Tax", aliases: ["itr", "income tax return", "tax return"] },
  { name: "Health Insurance", type: "Insurance", aliases: ["health insurance", "medical insurance"] },
  { name: "Term Insurance", type: "Insurance", aliases: ["term insurance", "life insurance"] }
];

const taxDocumentGroups = [
  ["Identity", ["PAN Card", "Aadhaar Card"]],
  ["Salary", ["Form 16", "Last 3 Salary Slips"]],
  ["Tax Records", ["Form 26AS", "AIS (Annual Information Statement)"]],
  ["Investments", ["PPF Statement", "ELSS Statement", "NPS Statement", "Life Insurance Premium Receipt"]],
  ["Home Loan (Optional)", ["Interest Certificate"]],
  ["Medical Insurance", ["Health Insurance Premium Receipt"]],
  ["House Rent (Optional)", ["Rent Receipts"]],
  ["Other Income (Optional)", ["Bank Interest Certificate", "Dividend Statement"]]
];

const fields = {
  assets: [
    ["name", "Asset name", "text"],
    ["type", "Type", "text"],
    ["value", "Current value", "number"],
    ["purchasePrice", "Purchase price", "number"],
    ["acquisitionDate", "Acquisition date", "date"],
    ["owner", "Owner", "text"],
    ["location", "Location / account", "text"],
    ["source", "Value source", "text"],
    ["lastUpdated", "Value last updated", "date"],
    ["note", "Notes", "text"],
    ["renewal", "Renewal date", "date"]
  ],
  liabilities: [
    ["name", "Liability name", "text"],
    ["type", "Type", "text"],
    ["value", "Outstanding amount", "number"],
    ["emi", "Monthly EMI", "number"],
    ["rate", "Interest rate", "number"],
    ["lender", "Lender", "text"],
    ["source", "Balance source", "text"],
    ["lastUpdated", "Balance last updated", "date"],
    ["dueDate", "Next due date", "date"]
  ],
  documents: [
    ["name", "Document name", "text"],
    ["type", "Type", "text"],
    ["expiry", "Expiry date", "date"],
    ["status", "Status", "text"],
    ["linkedTo", "Linked asset/person", "text"],
    ["requiredFor", "Required for", "text"],
    ["file", "Upload PDF or image", "file"]
  ],
  alerts: [
    ["name", "Reminder", "text"],
    ["date", "Due date", "date"],
    ["priority", "Priority", "text"],
    ["channel", "Reminder channel", "text"],
    ["linkedTo", "Linked asset", "text"]
  ],
  family: [
    ["name", "Name", "text"],
    ["relation", "Relation", "text"],
    ["access", "Access", "text"],
    ["phone", "Phone", "text"],
    ["email", "Email", "email"]
  ],
  goals: [
    ["name", "Goal", "text"],
    ["target", "Target amount", "number"],
    ["saved", "Saved amount", "number"],
    ["deadline", "Deadline", "date"],
    ["priority", "Priority", "text"]
  ]
};

const assetFieldSets = {
  Car: [
    ["name", "Car name", "text"],
    ["brand", "Brand", "text"],
    ["model", "Model", "text"],
    ["year", "Manufacturing year", "number"],
    ["purchasePrice", "Purchase price", "number"],
    ["acquisitionDate", "Purchase date", "date"],
    ["value", "Current value", "number"],
    ["odometer", "Current odometer in km", "number"],
    ["ownerCount", "Owner number (1, 2, 3+)", "number"],
    ["owner", "Owner", "text"],
    ["condition", "Condition (Excellent / Good / Fair / Poor)", "text"],
    ["demand", "Market demand (High / Normal / Low)", "text"],
    ["registrationNumber", "Registration number", "text"],
    ["hasLoan", "Was this vehicle purchased using a loan? (Yes/No)", "text"],
    ["loanAmount", "Loan amount", "number"],
    ["downPayment", "Down payment", "number"],
    ["interestRate", "Interest rate (% per annum)", "number"],
    ["loanTenureYears", "Loan tenure (years)", "number"],
    ["loanStartDate", "Loan start date", "date"],
    ["emiAmount", "EMI amount (optional)", "number"],
    ["loanType", "Loan type (Reducing Balance / Flat Interest)", "text"],
    ["source", "Valuation / service source", "text"],
    ["renewal", "Insurance renewal date", "date"],
    ["note", "Notes", "text"]
  ],
  Land: [
    ["name", "Land name", "text"],
    ["location", "Location", "text"],
    ["area", "Area", "text"],
    ["serialNumber", "Survey / plot number", "text"],
    ["purchasePrice", "Purchase price", "number"],
    ["acquisitionDate", "Purchase date", "date"],
    ["value", "Current value", "number"],
    ["owner", "Owner", "text"],
    ["condition", "Title / location quality", "text"],
    ["source", "Value source", "text"],
    ["lastUpdated", "Value last updated", "date"],
    ["note", "Notes", "text"]
  ],
  Shoes: [
    ["name", "Shoe name", "text"],
    ["brand", "Brand", "text"],
    ["model", "Model / edition", "text"],
    ["purchasePrice", "Purchase price", "number"],
    ["acquisitionDate", "Purchase date", "date"],
    ["value", "Current value", "number"],
    ["owner", "Owner", "text"],
    ["condition", "Condition / rarity", "text"],
    ["source", "Value source", "text"],
    ["note", "Notes", "text"]
  ],
  Watches: [
    ["name", "Watch name", "text"],
    ["brand", "Brand", "text"],
    ["model", "Model", "text"],
    ["referenceNumber", "Reference number", "text"],
    ["serialNumber", "Serial number", "text"],
    ["purchasePrice", "Purchase price", "number"],
    ["acquisitionDate", "Purchase date", "date"],
    ["value", "Current value", "number"],
    ["owner", "Owner", "text"],
    ["condition", "Condition / rarity", "text"],
    ["watchBoxPapers", "Box and papers", "text"],
    ["source", "Value source", "text"],
    ["note", "Notes", "text"]
  ],
  Flats: [
    ["name", "Flat / house name", "text"],
    ["location", "Location", "text"],
    ["area", "Carpet / built-up area", "text"],
    ["serialNumber", "Registration / unit number", "text"],
    ["purchasePrice", "Purchase cost", "number"],
    ["acquisitionDate", "Purchase date", "date"],
    ["value", "Current value", "number"],
    ["owner", "Owner", "text"],
    ["condition", "Condition / location quality", "text"],
    ["source", "Value source", "text"],
    ["lastUpdated", "Value last updated", "date"],
    ["renewal", "Property tax / renewal date", "date"],
    ["note", "Notes", "text"]
  ],
  "Investment Assets": [
    ["ticker", "Ticker / symbol", "text"],
    ["name", "Asset name", "text"],
    ["assetSubType", "Asset type (Stock / Mutual Fund / ETF / ESOP)", "text"],
    ["sector", "Sector / theme", "text"],
    ["tags", "Tags", "text"],
    ["purchaseDate", "Purchase date", "date"],
    ["buyPrice", "Buy price per unit", "number"],
    ["quantity", "Quantity / units", "number"],
    ["currentPrice", "Current price per unit", "number"],
    ["brokerageFees", "Brokerage / fees", "number"],
    ["lotId", "Lot / batch ID", "text"],
    ["owner", "Owner", "text"],
    ["location", "Broker / platform", "text"],
    ["dividendsReceived", "Dividends received", "number"],
    ["corporateActions", "Corporate actions", "text"],
    ["taxLotMethod", "Tax lot method", "text"],
    ["source", "Statement / price source", "text"],
    ["lastUpdated", "Value last updated", "date"],
    ["note", "Notes", "text"]
  ],
  "Other Funds": [
    ["name", "Fund name", "text"],
    ["location", "Bank / platform", "text"],
    ["purchasePrice", "Deposited amount", "number"],
    ["acquisitionDate", "Start date", "date"],
    ["value", "Current value", "number"],
    ["owner", "Owner", "text"],
    ["condition", "Risk profile", "text"],
    ["source", "Statement / source", "text"],
    ["lastUpdated", "Value last updated", "date"],
    ["note", "Notes", "text"]
  ],
  Cash: [
    ["name", "Cash / account name", "text"],
    ["location", "Bank / place", "text"],
    ["value", "Balance", "number"],
    ["owner", "Owner", "text"],
    ["source", "Source", "text"],
    ["lastUpdated", "Balance last updated", "date"],
    ["note", "Notes", "text"]
  ]
};

let state = emptyState();
let activeUser = null;
let activeView = "home";
let authMode = "login";
let modalContext = { collection: "assets", id: null };
let saveTimer = null;
let previewUrl = "";
let activeAssetCategory = null;
let financeNews = [];
let financeNewsLoadedAt = 0;
let financeNewsLoading = false;
let marketEvents = [];
let marketEventsLoadedAt = 0;
let marketEventsLoading = false;
let assetFilter = "all";
let assetSort = "value";
let investmentSort = "value";
let investmentFilters = { owner: "all", type: "all", sector: "all" };
let investmentHistoryRange = "ALL";

const authScreen = document.querySelector("#auth-screen");
const appShell = document.querySelector("#app-shell");
const authForm = document.querySelector("#auth-form");
const authTabs = document.querySelectorAll(".auth-tab");
const authError = document.querySelector("#auth-error");
const authTitle = document.querySelector("#auth-title");
const authKicker = document.querySelector("#auth-kicker");
const authSubmit = document.querySelector("#auth-submit");
const grid = document.querySelector("#module-grid");
const list = document.querySelector("#app-list");
const actions = document.querySelector("#app-actions");
const title = document.querySelector("#screen-title");
const viewLabel = document.querySelector("#view-label");
const tabs = document.querySelectorAll(".tab, .mobile-tab");
const modal = document.querySelector("#entry-modal");
const previewModal = document.querySelector("#preview-modal");
const previewTitle = document.querySelector("#preview-title");
const previewBody = document.querySelector("#preview-body");
const form = document.querySelector("#entry-form");
const fieldHost = document.querySelector("#entry-fields");
const deleteButton = document.querySelector("#delete-record");
const saveStateLabel = document.querySelector("#save-state");
const searchInput = document.querySelector("#global-search");
const importFile = document.querySelector("#import-file");

function emptyState() {
  return {
    assets: [],
    liabilities: [],
    documents: [],
    alerts: [],
    family: [],
    goals: [],
    activity: [],
    cash: { income: 0, expenses: 0 }
  };
}

function normalizeState(data) {
  const safeData = data || {};
  return {
    ...emptyState(),
    ...safeData,
    assets: Array.isArray(safeData.assets) ? safeData.assets.map(normalizeAssetRecord) : [],
    liabilities: Array.isArray(safeData.liabilities) ? safeData.liabilities.map(normalizeLiabilityRecord) : [],
    documents: Array.isArray(safeData.documents) ? safeData.documents : [],
    alerts: Array.isArray(safeData.alerts) ? safeData.alerts : [],
    family: Array.isArray(safeData.family) ? safeData.family : [],
    goals: Array.isArray(safeData.goals) ? safeData.goals : [],
    activity: Array.isArray(safeData.activity) ? safeData.activity : [],
    cash: {
      income: nonNegativeNumber(safeData.cash?.income),
      expenses: nonNegativeNumber(safeData.cash?.expenses)
    }
  };
}

function nonNegativeNumber(value) {
  return Math.max(0, Number(value) || 0);
}

function nonNegativeRupees(value) {
  return Math.max(0, Math.round(Number(value) || 0));
}

function normalizeMoneyHistory(rows) {
  return (Array.isArray(rows) ? rows : []).map(row => ({
    ...row,
    value: nonNegativeRupees(row?.value)
  }));
}

function normalizeAssetRecord(asset) {
  const safeAsset = asset || {};
  const typeText = `${safeAsset.type || ""} ${safeAsset.assetSubType || ""}`.toLowerCase();
  const isInvestment = /investment|stock|mutual|etf|esop|equity|shares/.test(typeText) || Boolean(safeAsset.ticker);
  return {
    ...safeAsset,
    sector: String(safeAsset.sector || "").trim(),
    tags: String(safeAsset.tags || "").trim(),
    referenceNumber: String(safeAsset.referenceNumber || "").trim(),
    watchBoxPapers: String(safeAsset.watchBoxPapers || "").trim(),
    watchMarketJson: String(safeAsset.watchMarketJson || "").trim(),
    currency: isInvestment ? "INR" : safeAsset.currency,
    exchangeRate: isInvestment ? 1 : nonNegativeNumber(safeAsset.exchangeRate),
    value: nonNegativeRupees(safeAsset.value),
    purchasePrice: nonNegativeRupees(safeAsset.purchasePrice),
    buyPrice: nonNegativeNumber(safeAsset.buyPrice),
    quantity: nonNegativeNumber(safeAsset.quantity),
    currentPrice: nonNegativeNumber(safeAsset.currentPrice),
    brokerageFees: nonNegativeNumber(safeAsset.brokerageFees),
    dividendsReceived: nonNegativeNumber(safeAsset.dividendsReceived),
    valuationLow: nonNegativeRupees(safeAsset.valuationLow),
    valuationHigh: nonNegativeRupees(safeAsset.valuationHigh),
    loanAmount: nonNegativeRupees(safeAsset.loanAmount),
    downPayment: nonNegativeRupees(safeAsset.downPayment),
    interestRate: nonNegativeNumber(safeAsset.interestRate),
    loanTenureYears: nonNegativeNumber(safeAsset.loanTenureYears),
    emiAmount: nonNegativeRupees(safeAsset.emiAmount),
    odometer: nonNegativeNumber(safeAsset.odometer),
    mileageKm: nonNegativeNumber(safeAsset.mileageKm || safeAsset.odometer),
    ownerCount: nonNegativeNumber(safeAsset.ownerCount),
    valueHistory: normalizeMoneyHistory(safeAsset.valueHistory)
  };
}

function normalizeLiabilityRecord(item) {
  const safeItem = item || {};
  return {
    ...safeItem,
    value: nonNegativeRupees(safeItem.value),
    emi: nonNegativeRupees(safeItem.emi),
    rate: nonNegativeNumber(safeItem.rate)
  };
}

async function api(path, options = {}) {
  const token = localStorage.getItem(tokenKey);
  const request = useFallback => fetch(apiUrl(path, useFallback), {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {})
    }
  });
  let response;
  try {
    response = await request(false);
    if (response.status === 404 && !location.href.includes("localhost:3001")) {
      response = await request(true);
    }
  } catch {
    try {
      response = await request(true);
    } catch {
      throw new Error("SERVER_OFFLINE");
    }
  }
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || "Something went wrong.");
  return payload;
}

async function uploadDocumentFile(file) {
  const token = localStorage.getItem(tokenKey);
  const body = new FormData();
  body.append("file", file);
  const request = useFallback => fetch(apiUrl("/api/wealth/files", useFallback), {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body
  });
  let response;
  try {
    response = await request(false);
    if (response.status === 404 && !location.href.includes("localhost:3001")) {
      response = await request(true);
    }
  } catch {
    response = await request(true);
  }
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || "Upload failed.");
  return payload.file;
}

function fileViewUrl(fileId) {
  const token = localStorage.getItem(tokenKey);
  const suffix = token ? `?token=${encodeURIComponent(token)}` : "";
  return apiUrl(`/api/wealth/files/${encodeURIComponent(fileId)}`) + suffix;
}

async function previewFile(fileId, fileName = "Saved file") {
  if (!fileId) return;
  const token = localStorage.getItem(tokenKey);
  if (previewUrl) URL.revokeObjectURL(previewUrl);
  previewTitle.textContent = fileName;
  previewBody.innerHTML = `<div class="empty-state">Loading preview...</div>`;
  previewModal.showModal();
  const response = await fetch(apiUrl(`/api/wealth/files/${encodeURIComponent(fileId)}`), {
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  });
  if (!response.ok) {
    previewBody.innerHTML = `<div class="empty-state">Could not open this file. Please log in again and try once more.</div>`;
    return;
  }
  const blob = await response.blob();
  previewUrl = URL.createObjectURL(blob);
  if (blob.type.startsWith("image/")) {
    previewBody.innerHTML = `<img src="${previewUrl}" alt="${escapeAttribute(fileName)}">`;
  } else if (blob.type === "application/pdf") {
    previewBody.innerHTML = `<iframe src="${previewUrl}" title="${escapeAttribute(fileName)}"></iframe>`;
  } else {
    previewBody.innerHTML = `<a class="save-button preview-download" href="${previewUrl}" download="${escapeAttribute(fileName)}">Download file</a>`;
  }
}

function showAuth() {
  authScreen.classList.remove("hidden");
  appShell.classList.add("locked");
  document.querySelector(".mobile-nav").style.display = "none";
}

function showApp() {
  authScreen.classList.add("hidden");
  appShell.classList.remove("locked");
  document.querySelector(".mobile-nav").style.removeProperty("display");
}

function setAuthMode(mode) {
  authMode = mode;
  authForm.classList.toggle("register-mode", mode === "register");
  authTabs.forEach(tab => tab.classList.toggle("active", tab.dataset.authMode === mode));
  authKicker.textContent = mode === "register" ? "Create your vault" : "Welcome back";
  authTitle.textContent = mode === "register" ? "Start your private wealth workspace." : "Open your family dashboard.";
  authSubmit.textContent = mode === "register" ? "Create account" : "Login";
  authError.textContent = "";
}

function showAuthError(error) {
  const message = error?.message || String(error || "");
  if (message === "SERVER_OFFLINE") {
    authError.innerHTML = `
      <strong>Wealth OS server is not running.</strong>
      <span>Open <b>Start_Wealth_OS.bat</b> from this project folder, then refresh this page.</span>
    `;
    return;
  }
  authError.textContent = message;
}

async function handleAuth(event) {
  event.preventDefault();
  authError.textContent = "";
  authSubmit.disabled = true;
  authSubmit.textContent = authMode === "register" ? "Creating..." : "Logging in...";
  const values = Object.fromEntries(new FormData(authForm).entries());
  try {
    const payload = await api(`/api/wealth/${authMode === "register" ? "register" : "login"}`, {
      method: "POST",
      body: JSON.stringify(values)
    });
    localStorage.setItem(tokenKey, payload.token);
    activeUser = payload.user;
    state = normalizeState(payload.data);
    hydrateUser();
    showApp();
    renderView("home");
    loadFinanceNews();
    loadMarketEvents();
  } catch (error) {
    showAuthError(error);
  } finally {
    authSubmit.disabled = false;
    authSubmit.textContent = authMode === "register" ? "Create account" : "Login";
  }
}

async function boot() {
  setAuthMode("login");
  const token = localStorage.getItem(tokenKey);
  if (!token) {
    showAuth();
    return;
  }
  try {
    const payload = await api("/api/wealth/me");
    activeUser = payload.user;
    state = normalizeState(payload.data);
    hydrateUser();
    showApp();
    renderView("home");
    loadFinanceNews();
    loadMarketEvents();
  } catch (error) {
    localStorage.removeItem(tokenKey);
    showAuth();
    if (error?.message === "SERVER_OFFLINE") showAuthError(error);
  }
}

async function loadMarketEvents(force = false) {
  const now = Date.now();
  if (marketEventsLoading) return;
  if (!force && marketEvents.length && now - marketEventsLoadedAt < 1000 * 60 * 30) {
    updateMarketEventsPanel();
    return;
  }
  marketEventsLoading = true;
  updateMarketEventsPanel("Loading market timetable...");
  try {
    const payload = await api(`/api/wealth/market-events${force ? "?refresh=1" : ""}`);
    marketEvents = Array.isArray(payload.items) ? payload.items : [];
    marketEventsLoadedAt = Date.now();
    updateMarketEventsPanel();
    if (activeView === "home") updateCalendarDayMarkers();
  } catch (error) {
    updateMarketEventsPanel("Market timetable is unavailable right now.");
  } finally {
    marketEventsLoading = false;
  }
}

function updateMarketEventsPanel(message = "") {
  const host = document.querySelector("#market-events-list");
  if (!host) return;
  host.innerHTML = marketEventsMarkup(message);
}

function marketEventsMarkup(message = "") {
  if (message) return `<p>${escapeHtml(message)}</p>`;
  if (!marketEvents.length) return `<p>IPO listings, RBI, tax and market events will appear here.</p>`;
  return marketEvents.slice(0, 4).map(item => {
    const label = item.date ? shortEventDate(item.date) : "Watch";
    return `
      <a href="${escapeAttribute(item.link)}" target="_blank" rel="noopener noreferrer">
        <b>${escapeHtml(label)}</b>
        <span>${escapeHtml(item.type || "Finance")}</span>
        <strong>${escapeHtml(item.title)}</strong>
      </a>
    `;
  }).join("");
}

function shortEventDate(dateValue) {
  const date = new Date(`${dateValue}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "Watch";
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

function marketEventDatesFor(year, month) {
  return new Set(marketEvents.map(item => {
    if (!item.date) return null;
    const date = new Date(`${item.date}T00:00:00`);
    return date.getFullYear() === year && date.getMonth() === month ? date.getDate() : null;
  }).filter(Boolean));
}

function updateCalendarDayMarkers() {
  const today = startOfToday();
  const dates = marketEventDatesFor(today.getFullYear(), today.getMonth());
  document.querySelectorAll(".calendar-days b").forEach(day => {
    const dayNumber = Number(day.textContent);
    day.classList.toggle("market-marked", dates.has(dayNumber));
  });
}

async function loadFinanceNews(force = false) {
  const now = Date.now();
  if (financeNewsLoading) return;
  if (!force && financeNews.length && now - financeNewsLoadedAt < 1000 * 60 * 20) {
    updateFinanceNewsPanel();
    return;
  }
  financeNewsLoading = true;
  updateFinanceNewsPanel("Loading market news...");
  try {
    const payload = await api(`/api/wealth/news${force ? "?refresh=1" : ""}`);
    financeNews = Array.isArray(payload.items) ? payload.items : [];
    financeNewsLoadedAt = Date.now();
    updateFinanceNewsPanel();
  } catch (error) {
    updateFinanceNewsPanel("Finance news is unavailable right now.");
  } finally {
    financeNewsLoading = false;
  }
}

function updateFinanceNewsPanel(message = "") {
  const host = document.querySelector("#finance-news-list");
  if (!host) return;
  host.innerHTML = financeNewsMarkup(message);
}

function financeNewsMarkup(message = "") {
  if (message) return `<p>${escapeHtml(message)}</p>`;
  if (!financeNews.length) return `<p>Latest finance headlines will appear here.</p>`;
  return financeNews.slice(0, 3).map(item => `
    <a href="${escapeAttribute(item.link)}" target="_blank" rel="noopener noreferrer">
      <span>${escapeHtml(item.source || "Finance")}</span>
      <strong>${escapeHtml(item.title)}</strong>
    </a>
  `).join("");
}

function hydrateUser() {
  const name = activeUser?.name || "User";
  document.querySelector("#user-name").textContent = name;
  document.querySelector("#user-email").textContent = activeUser?.email || "";
  document.querySelector("#user-initials").textContent = name.split(/\s+/).slice(0, 2).map(part => part[0]).join("").toUpperCase() || "U";
}

function scheduleSave() {
  saveStateLabel.textContent = "Saving...";
  clearTimeout(saveTimer);
  saveTimer = setTimeout(async () => {
    try {
      await api("/api/wealth/data", {
        method: "PUT",
        body: JSON.stringify({ data: state })
      });
      saveStateLabel.textContent = "Saved";
    } catch (error) {
      saveStateLabel.textContent = "Save failed";
      console.error(error);
    }
  }, 250);
}

function addActivity(label, detail) {
  state.activity = Array.isArray(state.activity) ? state.activity : [];
  state.activity.push({
    id: crypto.randomUUID(),
    label,
    detail,
    createdAt: new Date().toISOString()
  });
  state.activity = state.activity.slice(-100);
}

function allRecords() {
  return ["assets", "liabilities", "documents", "alerts", "family", "goals"].flatMap(collection =>
    (state[collection] || []).map(item => ({ collection, item }))
  );
}

function searchRecords(query) {
  const term = String(query || "").trim().toLowerCase();
  if (!term) return "";
  const matches = allRecords().filter(({ collection, item }) =>
    `${collection} ${Object.values(item).join(" ")}`.toLowerCase().includes(term)
  );
  if (!matches.length) return `<div class="empty-state">No matches found for "${escapeHtml(query)}".</div>`;
  const groups = matches.reduce((acc, match) => {
    acc[match.collection] = acc[match.collection] || [];
    acc[match.collection].push(match.item);
    return acc;
  }, {});
  return `
    ${sectionHeader("Search Results", `${matches.length} matches`)}
    ${Object.entries(groups).map(([collection, items]) => `
      <section class="search-result-group">
        <div class="search-result-title">${escapeHtml(collectionLabel(collection))}<span>${items.length}</span></div>
        ${items.slice(0, 5).map(item => recordButton(collection, item)).join("")}
      </section>
    `).join("")}
  `;
}

function missingDocuments() {
  const docs = state.documents.map(item => `${item.name} ${item.type} ${item.requiredFor} ${item.linkedTo}`.toLowerCase());
  const required = personalDocumentTypes
    .filter(doc => !hasDocumentMatch(doc))
    .map(doc => [doc.name, "Personal"]);
  state.assets.forEach(asset => {
    const type = `${asset.type} ${asset.name}`.toLowerCase();
    if (/vehicle|car|bike|bmw|fortuner/.test(type)) {
      required.push(["RC", asset.name], ["Insurance", asset.name], ["PUC", asset.name], ["Service record", asset.name]);
    }
    if (/real estate|property|house|home|land|apartment|residence/.test(type)) {
      required.push(["Sale deed", asset.name], ["Property tax", asset.name], ["Insurance", asset.name]);
    }
    if (/gold|jewellery|watch|art|collectible/.test(type)) {
      required.push(["Valuation certificate", asset.name], ["Insurance", asset.name]);
    }
  });
  state.liabilities.forEach(loan => required.push(["Loan statement", loan.name]));
  return required
    .filter(([docName, linkedTo]) => !docs.some(row => row.includes(docName.toLowerCase()) && row.includes(String(linkedTo).toLowerCase().split(" ")[0])))
    .slice(0, 12);
}

function hasDocumentMatch(requirement) {
  return state.documents.some(doc => {
    const text = `${doc.name} ${doc.type} ${doc.requiredFor} ${doc.linkedTo}`.toLowerCase();
    return requirement.aliases.some(alias => text.includes(alias));
  });
}

function isPersonalDocument(doc) {
  const text = `${doc.name} ${doc.type} ${doc.requiredFor} ${doc.linkedTo}`.toLowerCase();
  return /personal|identity|tax|aadhaar|aadhar|pan|passport|driving|licence|license|voter|birth certificate|passbook|cancelled cheque|itr|income tax|health insurance|term insurance/.test(text);
}

function documentStatus(doc) {
  if (!doc.expiry) return { key: "stored", label: doc.status || "Stored" };
  const days = daysUntil(doc.expiry);
  if (days < 0) return { key: "expired", label: "Expired" };
  if (days <= 30) return { key: "due", label: `${days} days` };
  return { key: "stored", label: doc.status || "Stored" };
}

function filteredDocuments() {
  const docs = [...state.documents].sort((a, b) => {
    const aDays = a.expiry ? daysUntil(a.expiry) : 99999;
    const bDays = b.expiry ? daysUntil(b.expiry) : 99999;
    return aDays - bDays;
  });
  if (documentFilter === "all") return docs;
  if (documentFilter === "personal") return docs.filter(isPersonalDocument);
  if (documentFilter === "missing") return [];
  return docs.filter(doc => documentStatus(doc).key === documentFilter);
}

function requiredDocsForAsset(asset) {
  const type = `${asset.type} ${asset.name}`.toLowerCase();
  if (/car|vehicle|bike|bmw|fortuner/.test(type)) return ["RC", "Insurance", "PUC", "Service record", "Purchase invoice"];
  if (/flat|real estate|property|house|home|land|apartment|residence/.test(type)) return ["Sale deed", "Registration", "Property tax", "Loan statement", "Insurance"];
  if (/watch|watches/.test(type)) return ["Purchase bill", "Warranty card", "Authenticity certificate", "Insurance"];
  if (/shoe|shoes|sneaker/.test(type)) return ["Purchase bill", "Authenticity proof", "Photos"];
  if (/investment|fund|fd|ppf|epf|nps|cash/.test(type)) return ["Latest statement", "Account proof", "Nominee record"];
  return ["Purchase proof", "Valuation proof", "Insurance"];
}

function linkedDocuments(asset) {
  const assetName = String(asset.name || "").toLowerCase();
  return state.documents.filter(doc => {
    const haystack = `${doc.name} ${doc.linkedTo} ${doc.requiredFor} ${doc.type}`.toLowerCase();
    return assetName && haystack.includes(assetName);
  });
}

function missingDocsForAsset(asset) {
  const docs = linkedDocuments(asset).map(doc => `${doc.name} ${doc.type} ${doc.requiredFor}`.toLowerCase());
  return requiredDocsForAsset(asset).filter(required =>
    !docs.some(row => row.includes(required.toLowerCase().split(" ")[0]))
  );
}

function sameDoc(value, required) {
  const firstWord = String(required || "").toLowerCase().split(" ")[0];
  return firstWord && String(value || "").toLowerCase().includes(firstWord);
}

function nextActions() {
  const data = totals();
  const actions = [];
  const nextRenewal = upcoming()[0];
  if (nextRenewal && nextRenewal.days <= 30) actions.push(`Renew ${nextRenewal.name} in ${nextRenewal.days} days.`);
  if (data.debtRatio > 35) actions.push(`Debt ratio is ${data.debtRatio}%. Review prepayment or avoid new debt.`);
  if (data.cashFlow < 0) actions.push("Monthly cash flow is negative. Reduce expenses or restructure EMI.");
  if (!data.cash && state.cash.income) actions.push("Cash balance is empty. Add bank or cash reserves separately from income.");
  if (missingDocuments().length) actions.push(`${missingDocuments().length} important documents appear missing.`);
  if (staleValues().length) actions.push(`${staleValues().length} values are more than 180 days old.`);
  if (!actions.length) actions.push("Your dashboard looks stable. Keep values and documents updated monthly.");
  return actions.slice(0, 5);
}

function staleValues() {
  const today = startOfToday();
  return [...state.assets, ...state.liabilities].filter(item => {
    if (!item.lastUpdated) return true;
    return (today - new Date(`${item.lastUpdated}T00:00:00`)) / 86400000 > 180;
  });
}

function allocationRows() {
  const assets = nonCashAssets();
  const total = assets.reduce((sum, item) => sum + Number(item.value || 0), 0) || 1;
  const groups = assets.reduce((acc, item) => {
    const key = item.type || "Asset";
    acc[key] = (acc[key] || 0) + Number(item.value || 0);
    return acc;
  }, {});
  return Object.entries(groups)
    .sort((a, b) => b[1] - a[1])
    .map(([label, value]) => ({ label, value, percent: Math.round((value / total) * 100) }));
}

function estimateAssetValue(input) {
  const type = String(input.type || "").toLowerCase();
  const name = String(input.name || "").toLowerCase();
  const purchasePrice = Number(input.purchasePrice || input.value || 0);
  if (!purchasePrice) return null;
  const ageYears = assetAgeYears(input);
  const descriptor = `${type} ${name} ${input.brand || ""} ${input.model || ""} ${input.condition || ""}`.toLowerCase();
  if (/car|vehicle|bike|scooter|motorcycle/.test(descriptor)) return usedCarValuation(input);
  const condition = conditionMultiplier(input.condition);
  let label = "Estimated realizable value";
  let fairValue = purchasePrice * Math.pow(0.92, ageYears);
  let haircut = 0.18;
  let floor = 0.1;
  let method = "Cost approach with age-based depreciation and resale liquidity haircut.";

  if (/car|vehicle|bike/.test(descriptor)) {
    const firstYear = ageYears <= 0 ? 1 : 0.82;
    const laterYears = Math.max(0, ageYears - 1);
    const annualDepreciation = /luxury|bmw|mercedes|audi|jaguar|volvo|land rover/.test(descriptor) ? 0.13 : 0.10;
    fairValue = purchasePrice * firstYear * Math.pow(1 - annualDepreciation, laterYears);
    haircut = 0.06;
    floor = 0.18;
    label = "Vehicle resale value";
    method = `Depreciated replacement cost: 18% first-year depreciation, then ${Math.round(annualDepreciation * 100)}% yearly depreciation, plus resale spread.`;
  } else if (/land/.test(descriptor)) {
    const cagr = /prime|metro|corner|commercial/.test(descriptor) ? 0.085 : 0.065;
    fairValue = purchasePrice * Math.pow(1 + cagr, ageYears);
    haircut = 0.10;
    floor = 0.65;
    label = "Land realizable value";
    method = `Market-comparable proxy: ${Math.round(cagr * 1000) / 10}% CAGR, less stamp-duty/brokerage/liquidity haircut.`;
  } else if (/flat|real estate|property|house|home|apartment|residence/.test(descriptor)) {
    const cagr = /prime|metro|commercial|sea|central/.test(descriptor) ? 0.065 : 0.045;
    const buildingWear = 0.012;
    fairValue = purchasePrice * Math.pow(1 + cagr - buildingWear, ageYears);
    haircut = 0.12;
    floor = 0.62;
    label = "Property realizable value";
    method = `Market-comparable proxy: ${Math.round(cagr * 1000) / 10}% location CAGR less ${Math.round(buildingWear * 1000) / 10}% building ageing and selling costs.`;
  } else if (/watch|watches/.test(descriptor)) {
    const collectible = /rolex|patek|audemars|ap|vacheron|omega|cartier|tudor|iwc|grand seiko|daytona|submariner|gmt|nautilus|royal oak|speedmaster|santos|tank|limited|discontinued/.test(descriptor);
    const cagr = collectible ? 0.035 : -0.045;
    const papers = /full|box|paper|certificate|bill/.test(String(input.watchBoxPapers || "").toLowerCase()) ? 1.07 : /watch only|missing|no paper/.test(String(input.watchBoxPapers || "").toLowerCase()) ? 0.88 : 1;
    fairValue = purchasePrice * Math.pow(1 + cagr, ageYears);
    haircut = collectible ? 0.08 : 0.18;
    fairValue *= papers;
    floor = collectible ? 0.62 : 0.45;
    label = collectible ? "Collectible watch resale value" : "Watch resale value";
    method = `${collectible ? "Collectible reseller" : "Used-good"} estimate using ${Math.round(cagr * 1000) / 10}% CAGR, box/papers adjustment, and dealer/liquidity spread.`;
  } else if (/shoe|shoes|sneaker/.test(descriptor)) {
    const collectible = /limited|jordan|yeezy|travis|off-white|dior|deadstock|rare/.test(descriptor);
    if (collectible) {
      fairValue = purchasePrice * Math.pow(1.06, Math.min(ageYears, 5));
      haircut = 0.15;
    } else {
      fairValue = purchasePrice * 0.5 * Math.pow(0.82, Math.max(0, ageYears - 1));
      haircut = 0.20;
    }
    floor = 0.2;
    label = collectible ? "Collectible sneaker resale value" : "Footwear resale value";
    method = collectible ? "Collectible resale estimate with marketability discount." : "Used-good resale estimate with immediate wear discount.";
  } else if (/investment|stock|mutual|esop|equity/.test(descriptor)) {
    const cagr = /debt|conservative|bond/.test(descriptor) ? 0.07 : /aggressive|equity|stock|esop/.test(descriptor) ? 0.11 : 0.09;
    fairValue = purchasePrice * Math.pow(1 + cagr, ageYears);
    haircut = /listed|mutual|fund/.test(descriptor) ? 0.01 : 0.15;
    floor = 0.5;
    label = "Investment estimate";
    method = `Compounded cost basis using ${Math.round(cagr * 1000) / 10}% assumed annual return, then liquidity haircut. Replace with statement/NAV when available.`;
  } else if (/fund|fd|ppf|epf|nps|bond/.test(descriptor)) {
    const cagr = /fd|deposit/.test(descriptor) ? 0.065 : /ppf|epf/.test(descriptor) ? 0.075 : 0.08;
    fairValue = purchasePrice * Math.pow(1 + cagr, ageYears);
    haircut = /fd|ppf|epf/.test(descriptor) ? 0 : 0.02;
    floor = 0.85;
    label = "Fund maturity/current estimate";
    method = `Conservative compounding estimate using ${Math.round(cagr * 1000) / 10}% annual return. Prefer latest account statement for exact value.`;
  } else if (/cash|bank|balance/.test(descriptor)) {
    fairValue = purchasePrice;
    haircut = 0;
    floor = 1;
    label = "Cash face value";
    method = "Cash and bank balances are carried at nominal face value.";
  }

  const realizable = Math.max(purchasePrice * floor, fairValue * condition * (1 - haircut));
  const rounded = roundEstimate(realizable);
  const fairRounded = roundEstimate(fairValue * condition);
  const haircutPercent = Math.round(haircut * 100);
  const spread = valuationSpread(descriptor);
  const low = roundEstimate(rounded * (1 - spread));
  const high = roundEstimate(rounded * (1 + spread));
  const confidence = spread <= 0.1 ? "High" : spread <= 0.18 ? "Medium" : "Low";
  return {
    value: rounded,
    low,
    high,
    confidence,
    label,
    basis: `${label}: fair value about ${money(fairRounded)}, less ${haircutPercent}% transaction/liquidity haircut = ${money(rounded)}. Range ${money(low)} - ${money(high)} (${confidence} confidence). ${method} Condition multiplier ${condition.toFixed(2)}; age ${ageYears.toFixed(1)} years. Planning estimate only, not a live quote.`
  };
}

function usedCarValuation(input = {}) {
  const originalPrice = nonNegativeRupees(input.original_price ?? input.originalPrice ?? input.purchasePrice ?? input.value);
  if (!originalPrice) return null;
  const currentYear = startOfToday().getFullYear();
  const manufactureYear = Number(input.year || input.manufacturingYear || currentYear);
  const ageYears = Math.max(0, Number.isFinite(manufactureYear) ? currentYear - manufactureYear : assetAgeYears(input));
  let currentValue = originalPrice;

  const ageMultiplier = ageYears <= 0 ? 1 : 0.8 * Math.pow(0.9, Math.max(0, ageYears - 1));
  currentValue *= ageMultiplier;

  const actualMileage = nonNegativeNumber(input.mileageKm || input.odometer || input.kilometersDriven || input.kmDriven);
  const standardMileage = ageYears * 12000;
  const mileageDelta = actualMileage - standardMileage;
  const mileageBlocks = Math.floor(Math.abs(mileageDelta) / 5000);
  const mileageAdjustmentPercent = mileageDelta > 0
    ? -mileageBlocks
    : Math.min(5, mileageBlocks);
  currentValue *= 1 + mileageAdjustmentPercent / 100;

  const ownerCount = vehicleOwnerCount(input.ownerCount || input.ownership || input.ownerNumber || input.owner);
  const ownershipPenaltyPercent = ownerCount <= 1 ? 0 : ownerCount === 2 ? -8 : -15;
  currentValue *= 1 + ownershipPenaltyPercent / 100;

  const condition = vehicleConditionMultiplier(input.condition);
  currentValue *= condition.multiplier;

  const demand = vehicleDemandMultiplier(input.demand || input.marketDemand);
  currentValue *= demand.multiplier;

  const rounded = roundEstimate(Math.max(0, currentValue));
  const spread = vehicleValuationConfidence(input).spread;
  const low = roundEstimate(rounded * (1 - spread));
  const high = roundEstimate(rounded * (1 + spread));
  const confidence = vehicleValuationConfidence(input).confidence;
  const engineJson = {
    estimated_resale_price: rounded,
    currency: "INR",
    price_range: { low, high },
    confidence,
    inputs: {
      original_price: originalPrice,
      manufacturing_year: manufactureYear || null,
      age_years: Math.round(ageYears * 10) / 10,
      actual_mileage_km: actualMileage,
      standard_mileage_km: standardMileage,
      owner_count: ownerCount,
      condition: condition.label,
      demand: demand.label
    },
    adjustments: {
      age_depreciation_multiplier: Number(ageMultiplier.toFixed(4)),
      mileage_adjustment_percent: mileageAdjustmentPercent,
      ownership_adjustment_percent: ownershipPenaltyPercent,
      condition_multiplier: condition.multiplier,
      demand_multiplier: demand.multiplier
    }
  };
  return {
    value: rounded,
    low,
    high,
    confidence,
    label: "Used car resale estimate",
    engineJson,
    basis: `Used car resale estimate: start from buying price ${money(originalPrice)}, apply age depreciation (${ageYears.toFixed(1)} years), mileage ${actualMileage ? `${Math.round(actualMileage).toLocaleString("en-IN")} km` : "not added"}, ${ownerCount}${ownerCount === 1 ? "st" : ownerCount === 2 ? "nd" : "rd+"} owner, ${condition.label} condition, and ${demand.label} demand = ${money(rounded)}. Range ${money(low)} - ${money(high)} (${confidence} confidence).`
  };
}

function vehicleOwnerCount(value) {
  const text = String(value || "").toLowerCase();
  const numeric = Number(text.match(/\d+/)?.[0] || value || 1);
  if (Number.isFinite(numeric) && numeric >= 3) return 3;
  if (Number.isFinite(numeric) && numeric >= 2) return 2;
  if (/third|3rd|3\+|multiple/.test(text)) return 3;
  if (/second|2nd/.test(text)) return 2;
  return 1;
}

function vehicleConditionMultiplier(value) {
  const text = String(value || "").trim().toLowerCase();
  if (/excellent|mint|new/.test(text)) return { label: "Excellent", multiplier: 1 };
  if (/fair|average|minor|used/.test(text)) return { label: "Fair", multiplier: 0.85 };
  if (/poor|bad|damaged|repair/.test(text)) return { label: "Poor", multiplier: 0.7 };
  return { label: "Good", multiplier: 0.95 };
}

function vehicleDemandMultiplier(value) {
  const text = String(value || "").trim().toLowerCase();
  if (/high|strong|hot|fast/.test(text)) return { label: "High", multiplier: 1.05 };
  if (/low|weak|slow/.test(text)) return { label: "Low", multiplier: 0.9 };
  return { label: "Normal", multiplier: 1 };
}

function vehicleValuationConfidence(input = {}) {
  const present = [
    input.purchasePrice || input.original_price,
    input.year || input.manufacturingYear,
    input.odometer || input.mileageKm,
    input.ownerCount || input.ownerNumber,
    input.condition,
    input.demand || input.marketDemand
  ].filter(Boolean).length;
  if (present >= 6) return { confidence: "High", spread: 0.07 };
  if (present >= 4) return { confidence: "Medium", spread: 0.1 };
  return { confidence: "Low", spread: 0.14 };
}

function valuationSpread(descriptor) {
  if (/cash|bank|fd|deposit|ppf|epf/.test(descriptor)) return 0.02;
  if (/mutual|listed|fund|nps|bond/.test(descriptor)) return 0.08;
  if (/car|vehicle|bike/.test(descriptor)) return 0.12;
  if (/flat|land|property|house|apartment|residence/.test(descriptor)) return 0.15;
  if (/watch|shoe|sneaker|collectible/.test(descriptor)) return 0.25;
  return 0.18;
}

function financedAssetSnapshot(asset, options = {}) {
  const today = options.today || startOfToday();
  const purchasePrice = nonNegativeRupees(asset.purchasePrice);
  const currentValue = nonNegativeRupees(asset.value) || estimateAssetValue(asset)?.value || 0;
  const purchaseDate = asset.acquisitionDate || "";
  const depreciation = Math.max(0, purchasePrice - currentValue);
  const loan = loanSnapshot({
    hasLoan: asset.hasLoan,
    loanAmount: asset.loanAmount,
    downPayment: asset.downPayment,
    interestRate: asset.interestRate,
    loanTenureYears: asset.loanTenureYears,
    loanStartDate: asset.loanStartDate || purchaseDate,
    emiAmount: asset.emiAmount,
    loanType: asset.loanType
  }, today);
  const outstandingLoan = loan.hasLoan ? loan.remainingBalance : 0;
  const equity = currentValue - outstandingLoan;
  const afterInterestPosition = equity - (loan.hasLoan ? loan.interestPaidToDate : 0);
  return {
    currentValue,
    purchasePrice,
    purchaseDate,
    ageYears: assetAgeYears({ acquisitionDate: purchaseDate, year: asset.year }),
    depreciation,
    depreciationPercent: purchasePrice ? Math.round((depreciation / purchasePrice) * 100) : 0,
    loan,
    outstandingLoan,
    equity,
    afterInterestPosition,
    netWorthContribution: equity
  };
}

function loanSnapshot(input, today = startOfToday()) {
  const hasLoan = isTruthy(input.hasLoan);
  const loanAmount = Number(input.loanAmount || 0);
  const downPayment = Number(input.downPayment || 0);
  const loanType = /flat/i.test(input.loanType || "") ? "Flat Interest" : "Reducing Balance";
  if (!hasLoan || loanAmount <= 0) {
    return emptyLoanSnapshot({ downPayment, loanType });
  }
  const annualRate = Number(input.interestRate || 0);
  const tenureMonths = Math.max(1, Math.round(Number(input.loanTenureYears || 0) * 12));
  const startDate = input.loanStartDate || new Date().toISOString().slice(0, 10);
  const completedEmis = Math.min(tenureMonths, Math.max(0, monthsBetween(startDate, today)));
  const monthlyRate = annualRate / 12 / 100;
  const flatInterest = loanAmount * (annualRate / 100) * (tenureMonths / 12);
  const calculatedEmi = loanType === "Flat Interest"
    ? (loanAmount + flatInterest) / tenureMonths
    : monthlyRate
      ? loanAmount * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths) / (Math.pow(1 + monthlyRate, tenureMonths) - 1)
      : loanAmount / tenureMonths;
  const enteredEmi = Number(input.emiAmount || 0);
  const emi = enteredEmi > 0 ? enteredEmi : calculatedEmi;
  let principalPaidToDate = 0;
  let interestPaidToDate = 0;
  let remainingBalance = loanAmount;
  if (loanType === "Flat Interest") {
    const principalPerMonth = loanAmount / tenureMonths;
    const interestPerMonth = flatInterest / tenureMonths;
    principalPaidToDate = Math.min(loanAmount, principalPerMonth * completedEmis);
    interestPaidToDate = Math.max(0, interestPerMonth * completedEmis);
    remainingBalance = Math.max(0, loanAmount - principalPaidToDate);
  } else {
    remainingBalance = monthlyRate
      ? loanAmount * Math.pow(1 + monthlyRate, completedEmis) - emi * ((Math.pow(1 + monthlyRate, completedEmis) - 1) / monthlyRate)
      : loanAmount - emi * completedEmis;
    remainingBalance = Math.min(loanAmount, Math.max(0, remainingBalance));
    principalPaidToDate = Math.min(loanAmount, Math.max(0, loanAmount - remainingBalance));
    interestPaidToDate = Math.max(0, emi * completedEmis - principalPaidToDate);
  }
  const totalRepayment = emi * tenureMonths;
  const totalInterestPayable = Math.max(0, totalRepayment - loanAmount);
  const roundedRemaining = roundRupees(remainingBalance);
  return {
    hasLoan: true,
    loanAmount: roundRupees(loanAmount),
    downPayment: roundRupees(downPayment),
    annualRate,
    tenureMonths,
    loanStartDate: startDate,
    emi: roundRupees(emi),
    completedEmis,
    remainingMonths: Math.max(0, tenureMonths - completedEmis),
    totalInterestPayable: roundRupees(totalInterestPayable),
    totalRepayment: roundRupees(totalRepayment),
    interestPaidToDate: roundRupees(interestPaidToDate),
    principalPaidToDate: roundRupees(principalPaidToDate),
    remainingPrincipal: roundedRemaining,
    remainingBalance: roundedRemaining,
    totalPaid: roundRupees(downPayment + emi * completedEmis),
    loanType
  };
}

function emptyLoanSnapshot({ downPayment = 0, loanType = "Reducing Balance" } = {}) {
  return {
    hasLoan: false,
    loanAmount: 0,
    downPayment,
    annualRate: 0,
    tenureMonths: 0,
    loanStartDate: "",
    emi: 0,
    completedEmis: 0,
    remainingMonths: 0,
    totalInterestPayable: 0,
    totalRepayment: 0,
    interestPaidToDate: 0,
    principalPaidToDate: 0,
    remainingPrincipal: 0,
    remainingBalance: 0,
    totalPaid: downPayment,
    loanType
  };
}

function monthsBetween(startDateValue, endDate) {
  if (!startDateValue) return 0;
  const start = new Date(`${startDateValue}T00:00:00`);
  if (Number.isNaN(start.getTime())) return 0;
  let months = (endDate.getFullYear() - start.getFullYear()) * 12 + (endDate.getMonth() - start.getMonth());
  if (endDate.getDate() < start.getDate()) months -= 1;
  return Math.max(0, months);
}

function isTruthy(value) {
  return ["yes", "true", "1", "on", "loan"].includes(String(value || "").trim().toLowerCase());
}

function conditionMultiplier(value) {
  const text = String(value || "").toLowerCase();
  if (/new|mint|excellent|prime|deadstock/.test(text)) return 1.08;
  if (/good|clear|average|normal|standard|moderate/.test(text)) return 1;
  if (/fair|used|minor|old/.test(text)) return 0.88;
  if (/poor|damaged|disputed|repair|bad/.test(text)) return 0.7;
  if (/aggressive|high risk/.test(text)) return 1.06;
  if (/conservative|low risk/.test(text)) return 0.97;
  return 1;
}

function assetAgeYears(input) {
  if (input.acquisitionDate) {
    const date = new Date(`${input.acquisitionDate}T00:00:00`);
    if (!Number.isNaN(date.getTime())) return Math.max(0, (startOfToday() - date) / 31557600000);
  }
  if (input.year) return Math.max(0, startOfToday().getFullYear() - Number(input.year));
  return 1;
}

function roundEstimate(value) {
  if (value >= 10000000) return Math.round(value / 100000) * 100000;
  if (value >= 100000) return Math.round(value / 10000) * 10000;
  if (value >= 10000) return Math.round(value / 1000) * 1000;
  return Math.round(value);
}

function roundRupees(value) {
  return Math.round(Number(value) || 0);
}

function exportData() {
  const fileManifest = state.documents
    .filter(item => item.fileId)
    .map(item => ({ name: item.name, fileName: item.fileName, linkedTo: item.linkedTo, fileId: item.fileId }));
  const blob = new Blob([JSON.stringify({ exportedAt: new Date().toISOString(), fileManifest, data: state }, null, 2)], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `wealth-os-backup-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(link.href);
}

function downloadTextFile(fileName, text, type = "text/csv") {
  const blob = new Blob([text], { type });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(link.href);
}

function csvEscape(value) {
  const text = String(value ?? "");
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function investmentCsvHeader() {
  return [
    "Ticker",
    "Buy Date",
    "Buy Price",
    "Quantity",
    "Current Price",
    "Fees",
    "Lot ID",
    "Owner",
    "Asset Type",
    "Sector",
    "Tags",
    "Notes",
    "Dividends",
    "Corporate Actions",
    "Tax Lot Method"
  ];
}

function exportInvestmentCsv() {
  const items = state.assets.filter(assetCategoryViews.investments.matcher);
  const rows = items.map(item => [
    item.ticker || "",
    item.purchaseDate || item.acquisitionDate || "",
    item.buyPrice || "",
    item.quantity || "",
    item.currentPrice || "",
    item.brokerageFees || 0,
    item.lotId || "",
    item.owner || "",
    item.assetSubType || "Stock",
    item.sector || "",
    item.tags || "",
    item.note || "",
    item.dividendsReceived || 0,
    item.corporateActions || "",
    item.taxLotMethod || "FIFO"
  ]);
  const csv = [investmentCsvHeader(), ...rows].map(row => row.map(csvEscape).join(",")).join("\n");
  downloadTextFile(`wealth-os-investments-${new Date().toISOString().slice(0, 10)}.csv`, csv);
}

function investmentReportHeader() {
  return [
    "Ticker",
    "Name",
    "Owner",
    "Asset Type",
    "Sector",
    "Tags",
    "Quantity",
    "Average Buy",
    "Current Price",
    "Cost Basis INR",
    "Current Value INR",
    "Unrealized P/L INR",
    "Realized P/L INR",
    "Dividends INR",
    "Total Return INR",
    "ROI %",
    "Portfolio Weight %",
    "Tax Lot Method",
    "Lot ID",
    "Last Updated"
  ];
}

function exportInvestmentReportCsv() {
  const items = state.assets.filter(assetCategoryViews.investments.matcher);
  if (!items.length) {
    saveStateLabel.textContent = "No investment holdings to export.";
    return;
  }
  const summary = investmentPortfolioSummary(items);
  const rows = items.map(item => {
    const snap = investmentSnapshot(item);
    const weight = summary.currentValue ? Math.round((snap.currentValueInr / summary.currentValue) * 1000) / 10 : 0;
    return [
      item.ticker || "",
      item.name || "",
      item.owner || "",
      item.assetSubType || "Investment",
      item.sector || "",
      item.tags || "",
      snap.quantity,
      snap.averageBuyPrice,
      snap.currentPrice,
      snap.costBasisInr,
      snap.currentValueInr,
      snap.unrealizedGainInr,
      snap.realizedGainInr,
      snap.dividendsInr,
      snap.totalReturnInr,
      snap.roi ?? "",
      weight,
      item.taxLotMethod || "FIFO",
      item.lotId || "",
      item.lastUpdated || ""
    ];
  });
  rows.push([]);
  rows.push(["TOTAL", "", "", "", "", "", "", "", "", summary.costBasis, summary.currentValue, summary.unrealizedGain, summary.realizedGain, summary.dividends, summary.totalReturn, summary.roi ?? "", 100, "", "", new Date().toISOString().slice(0, 10)]);
  const csv = [investmentReportHeader(), ...rows].map(row => row.map(csvEscape).join(",")).join("\n");
  downloadTextFile(`wealth-os-investment-pl-${new Date().toISOString().slice(0, 10)}.csv`, csv);
  addActivity("Investment report exported", `${items.length} holdings P/L report`);
}

function investmentPriceHistoryHeader() {
  return [
    "Ticker",
    "Date",
    "Current Price",
    "Owner",
    "Lot ID",
    "Note"
  ];
}

function downloadInvestmentPriceHistoryTemplate() {
  const rows = [
    investmentPriceHistoryHeader(),
    ["RELIANCE", "2026-01-31", "2820.00", "Self", "lot001", "Month-end close"],
    ["RELIANCE", "2026-02-28", "2920.00", "Self", "lot001", "Month-end close"]
  ];
  downloadTextFile("wealth-os-investment-price-history-template.csv", rows.map(row => row.map(csvEscape).join(",")).join("\n"));
}

function importInvestmentPriceHistoryCsv() {
  const holdings = state.assets.filter(isInvestmentAsset);
  if (!holdings.length) {
    saveStateLabel.textContent = "Add an investment first.";
    return;
  }
  const sample = [
    investmentPriceHistoryHeader().join(","),
    `${holdings[0].ticker || "RELIANCE"},${new Date().toISOString().slice(0, 10)},${holdings[0].currentPrice || ""},${holdings[0].owner || ""},${holdings[0].lotId || ""},Manual history`
  ].join("\n");
  const pasted = window.prompt("Paste price history CSV rows:", sample);
  if (!pasted) return;
  const result = applyInvestmentPriceHistoryCsv(pasted);
  if (result.errors.length) {
    alert(`Some history rows were skipped:\n${result.errors.slice(0, 8).join("\n")}`);
  }
  if (!result.updated) {
    saveStateLabel.textContent = "No price history imported.";
    return;
  }
  addActivity("Investment price history imported", `${result.updated} history ${result.updated === 1 ? "point" : "points"} imported`);
  saveStateLabel.textContent = `${result.updated} investment history ${result.updated === 1 ? "point" : "points"} imported.`;
  scheduleSave();
  renderInvestmentCategory(assetCategoryViews.investments, state.assets.filter(assetCategoryViews.investments.matcher));
}

function applyInvestmentPriceHistoryCsv(text) {
  const lines = String(text || "").split(/\r?\n/).filter(Boolean);
  const [headerLine, ...rows] = lines;
  if (!headerLine) return { updated: 0, errors: ["CSV is empty."] };
  const headers = splitCsvLine(headerLine).map(csvHeaderKey);
  const today = new Date().toISOString().slice(0, 10);
  let updated = 0;
  const errors = [];
  rows.forEach((line, index) => {
    const row = splitCsvLine(line).reduce((acc, value, columnIndex) => ({ ...acc, [headers[columnIndex]]: value || "" }), {});
    const rowNumber = index + 2;
    const ticker = String(row.ticker || row.symbol || "").trim().toUpperCase();
    const date = row.date || row.lastUpdated || "";
    const price = Number(row.currentPrice || row.marketPrice || row.latestPrice || row.price || 0);
    if (!ticker) {
      errors.push(`Row ${rowNumber}: ticker is required.`);
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(date))) {
      errors.push(`Row ${rowNumber}: date must be YYYY-MM-DD.`);
      return;
    }
    if (date > today) {
      errors.push(`Row ${rowNumber}: date cannot be in the future.`);
      return;
    }
    if (!Number.isFinite(price) || price < 0) {
      errors.push(`Row ${rowNumber}: current price must be zero or greater.`);
      return;
    }
    const owner = String(row.owner || "").trim().toLowerCase();
    const lotId = String(row.lotId || row.batchId || "").trim().toLowerCase();
    const matches = state.assets.filter(asset => {
      if (!isInvestmentAsset(asset)) return false;
      if (String(asset.ticker || "").trim().toUpperCase() !== ticker) return false;
      if (owner && String(asset.owner || "").trim().toLowerCase() !== owner) return false;
      if (lotId && String(asset.lotId || "").trim().toLowerCase() !== lotId) return false;
      return true;
    });
    if (!matches.length) {
      errors.push(`Row ${rowNumber}: ${ticker} holding not found.`);
      return;
    }
    matches.forEach(asset => {
      const currency = "INR";
      asset.currency = "INR";
      asset.exchangeRate = 1;
      const pointValue = roundRupees(Number(asset.quantity || 0) * price);
      asset.valueHistory = [
        ...(Array.isArray(asset.valueHistory) ? asset.valueHistory : []),
        {
          id: crypto.randomUUID(),
          value: pointValue,
          date,
          note: row.note || `Imported price: ${nativeMoney(price, currency)} per unit`
        }
      ].slice(-80);
      if (!asset.lastUpdated || date >= asset.lastUpdated) {
        asset.currentPrice = price;
        asset.value = pointValue;
        asset.lastUpdated = date;
        asset.source = "Imported price history";
      }
      updated += 1;
    });
  });
  return { updated, errors };
}

function downloadInvestmentTemplate() {
  const rows = [
    investmentCsvHeader(),
    ["RELIANCE", "2023-01-15", "2450.00", "10", "2920.00", "20.00", "lot001", "Self", "Stock", "Energy", "Large cap", "Long-term holding", "0.00", "", "FIFO"],
    ["NIFTYBEES", "2024-06-20", "240.00", "50", "280.00", "7.50", "lot002", "Family", "ETF", "Index", "ETF", "Index holding", "2.10", "", "Average"]
  ];
  downloadTextFile("wealth-os-investment-template.csv", rows.map(row => row.map(csvEscape).join(",")).join("\n"));
}

async function importData(file) {
  const text = await file.text();
  if (/\.csv$/i.test(file.name) || file.type === "text/csv") {
    importCsv(text, file.name);
    return;
  }
  const parsed = JSON.parse(text);
  state = normalizeState(parsed.data || parsed);
  addActivity("Data imported", file.name);
  scheduleSave();
  renderView(activeView);
}

function importCsv(text, fileName) {
  const lines = text.split(/\r?\n/).filter(Boolean);
  const [headerLine, ...rows] = lines;
  if (!headerLine) throw new Error("CSV is empty.");
  const headers = splitCsvLine(headerLine).map(csvHeaderKey);
  const imported = rows.map(row => {
    const values = splitCsvLine(row);
    return headers.reduce((acc, key, index) => ({ ...acc, [key]: values[index] || "" }), {});
  });
  const importedAssets = [];
  const importErrors = [];
  const seenLotIds = new Set();
  imported.forEach((row, index) => {
    if (row.ticker || row.symbol || /stock|mutual|etf|esop|investment/i.test(`${row.type || ""} ${row.assetType || ""}`)) {
      const values = {
        ticker: row.ticker || row.symbol || "",
        name: row.name || row.assetName || row.asset || row.ticker || "Imported holding",
        assetSubType: row.assetType || row.type || "Stock",
        purchaseDate: row.purchaseDate || row.buyDate || row.date || "",
        buyPrice: Number(row.buyPrice || row.price || row.costPerUnit || 0),
        quantity: Number(row.quantity || row.shares || row.units || 0),
        currentPrice: Number(row.currentPrice || row.marketPrice || row.latestPrice || row.buyPrice || row.price || 0),
        currency: "INR",
        exchangeRate: 1,
        brokerageFees: Number(row.brokerageFees || row.fees || row.commission || 0),
        lotId: row.lotId || row.batchId || "",
        owner: row.owner || "",
        sector: row.sector || row.theme || "",
        tags: row.tags || row.labels || "",
        location: row.location || row.account || row.broker || "",
        dividendsReceived: Number(row.dividendsReceived || row.dividends || 0),
        corporateActions: row.corporateActions || "",
        taxLotMethod: row.taxLotMethod || "FIFO",
        source: row.source || "CSV import",
        lastUpdated: row.lastUpdated || new Date().toISOString().slice(0, 10),
        note: row.note || row.notes || "",
        type: "Investment Assets"
      };
      const validationError = validateInvestmentImportValues(values, index + 2, seenLotIds);
      if (validationError) {
        importErrors.push(validationError);
        return;
      }
      applyInvestmentDerivedValues(values);
      seenLotIds.add(String(values.lotId || "").toLowerCase());
      importedAssets.push({
        id: crypto.randomUUID(),
        ...values,
        valueHistory: values.value > 0 ? [{ id: crypto.randomUUID(), value: values.value, date: values.lastUpdated, note: "CSV import" }] : []
      });
      return;
    }
    const value = Number(row.value || row.currentValue || 0);
    const lastUpdated = row.lastUpdated || new Date().toISOString().slice(0, 10);
    importedAssets.push({
      id: crypto.randomUUID(),
      name: row.name || row.asset || "Imported asset",
      type: row.type || row.category || "Asset",
      value,
      purchasePrice: Number(row.purchasePrice || row.cost || 0),
      owner: row.owner || "",
      location: row.location || row.account || "",
      source: row.source || "CSV import",
      lastUpdated,
      note: row.note || "",
      valueHistory: value > 0 ? [{ id: crypto.randomUUID(), value, date: lastUpdated, note: "CSV import" }] : []
    });
  });
  if (importErrors.length) {
    throw new Error(`CSV import stopped: ${importErrors.slice(0, 5).join(" | ")}`);
  }
  state.assets.push(...importedAssets);
  addActivity("CSV imported", `${imported.length} assets from ${fileName}`);
  scheduleSave();
  renderView("assets");
}

function csvHeaderKey(header) {
  const key = String(header || "").trim().toLowerCase().replace(/[^a-z0-9]/g, "");
  const aliases = {
    ticker: "ticker",
    symbol: "symbol",
    assetname: "assetName",
    name: "name",
    asset: "asset",
    buydate: "buyDate",
    purchasedate: "purchaseDate",
    date: "date",
    buyprice: "buyPrice",
    price: "price",
    costperunit: "costPerUnit",
    quantity: "quantity",
    shares: "shares",
    units: "units",
    currentprice: "currentPrice",
    marketprice: "marketPrice",
    latestprice: "latestPrice",
    currency: "currency",
    exchangerate: "exchangeRate",
    inrexchangerate: "inrExchangeRate",
    fxrate: "fxRate",
    fees: "fees",
    brokeragefees: "brokerageFees",
    commission: "commission",
    lotid: "lotId",
    batchid: "batchId",
    owner: "owner",
    sector: "sector",
    theme: "theme",
    tags: "tags",
    labels: "labels",
    assettype: "assetType",
    type: "type",
    notes: "notes",
    note: "note",
    dividends: "dividends",
    dividendsreceived: "dividendsReceived",
    corporateactions: "corporateActions",
    taxlotmethod: "taxLotMethod",
    broker: "broker",
    account: "account",
    location: "location",
    source: "source",
    lastupdated: "lastUpdated",
    value: "value",
    currentvalue: "currentValue",
    purchaseprice: "purchasePrice",
    cost: "cost",
    category: "category"
  };
  return aliases[key] || key;
}

function validateInvestmentImportValues(values, rowNumber, seenLotIds) {
  if (!String(values.ticker || "").trim()) return `Row ${rowNumber}: ticker is required.`;
  if (!/^[A-Z0-9.\-_]{1,30}$/i.test(String(values.ticker || "").trim())) return `Row ${rowNumber}: ticker format is invalid.`;
  if (!values.purchaseDate) return `Row ${rowNumber}: buy date is required.`;
  if (new Date(`${values.purchaseDate}T00:00:00`) > startOfToday()) return `Row ${rowNumber}: buy date cannot be in the future.`;
  if (Number(values.buyPrice || 0) <= 0) return `Row ${rowNumber}: buy price must be greater than zero.`;
  if (Number(values.quantity || 0) <= 0) return `Row ${rowNumber}: quantity must be greater than zero.`;
  if (Number(values.currentPrice || 0) < 0) return `Row ${rowNumber}: current price cannot be negative.`;
  values.currency = "INR";
  values.exchangeRate = 1;
  if (!String(values.owner || "").trim()) return `Row ${rowNumber}: owner is required.`;
  const lotId = String(values.lotId || `${values.ticker}-${values.purchaseDate}`).trim().toLowerCase();
  if (seenLotIds.has(lotId)) return `Row ${rowNumber}: duplicate lot ID in this CSV.`;
  const existingLot = state.assets.find(asset =>
    isInvestmentAsset(asset) &&
    String(asset.lotId || "").trim().toLowerCase() === lotId
  );
  if (existingLot) return `Row ${rowNumber}: lot ID already exists in Wealth OS.`;
  return "";
}

function splitCsvLine(line) {
  const values = [];
  let current = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === "\"") {
      if (quoted && line[index + 1] === "\"") {
        current += "\"";
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (char === "," && !quoted) {
      values.push(current.trim());
      current = "";
    } else current += char;
  }
  values.push(current.trim());
  return values;
}

async function resetWorkspace() {
  const confirmed = window.confirm("Start fresh for this account? This clears all saved assets, documents, reminders, cash flow, and activity from Wealth OS.");
  if (!confirmed) return;
  saveStateLabel.textContent = "Resetting...";
  const payload = await api("/api/wealth/data", { method: "DELETE" });
  state = normalizeState(payload.data);
  saveStateLabel.textContent = "Saved";
  renderView("home");
}

function money(value) {
  const amount = Math.round(Number(value) || 0);
  const abs = Math.abs(amount);
  if (abs >= 10000000) return `INR ${(amount / 10000000).toFixed(abs >= 100000000 ? 1 : 2)} Cr`;
  if (abs >= 100000) return `INR ${(amount / 100000).toFixed(abs >= 1000000 ? 1 : 2)} L`;
  return `INR ${amount.toLocaleString("en-IN")}`;
}

function currencyRateToInr(currency) {
  return 1;
}

function investmentExchangeRate(asset) {
  return 1;
}

function nativeMoney(value, currency = "INR") {
  const code = String(currency || "INR").trim().toUpperCase() || "INR";
  const amount = Number(value) || 0;
  if (code === "INR") return money(amount);
  return `${code} ${amount.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

function daysUntil(dateValue) {
  if (!dateValue) return null;
  const today = startOfToday();
  const date = new Date(`${dateValue}T00:00:00`);
  return Math.ceil((date - today) / 86400000);
}

function startOfToday() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

function totals() {
  const assetItems = nonCashAssets();
  const cash = cashBalance();
  const marketAssets = assetItems.reduce((sum, item) => sum + nonNegativeRupees(item.value), 0);
  const assetEquity = assetItems.reduce((sum, item) => sum + assetNetWorthContribution(item), 0);
  const vehicleLoanBalance = assetItems.reduce((sum, item) => sum + vehicleOutstandingLoan(item), 0);
  const liabilities = state.liabilities.reduce((sum, item) => sum + nonNegativeRupees(item.value), 0);
  const emi = state.liabilities.reduce((sum, item) => sum + nonNegativeRupees(item.emi), 0) +
    assetItems.reduce((sum, item) => sum + vehicleEmi(item), 0);
  const cashFlow = Number(state.cash.income || 0) - Number(state.cash.expenses || 0) - emi;
  const renewalCount = upcoming().length;
  const debtRatio = marketAssets ? Math.round(((liabilities + vehicleLoanBalance) / marketAssets) * 100) : 0;
  const savingsRate = state.cash.income ? Math.max(0, Math.round((cashFlow / state.cash.income) * 100)) : 0;
  const insuranceDocs = state.documents.filter(item => /insurance/i.test(`${item.type} ${item.name}`)).length;
  const health = Math.max(0, Math.min(100, 60 + savingsRate - Math.round(debtRatio / 2) + insuranceDocs * 4));
  return {
    assets: marketAssets,
    marketAssets,
    assetEquity,
    cash,
    liabilities: liabilities + vehicleLoanBalance,
    explicitLiabilities: liabilities,
    vehicleLoanBalance,
    netWorth: assetEquity + cash - liabilities,
    emi,
    cashFlow,
    renewalCount,
    debtRatio,
    savingsRate,
    health
  };
}

function assetNetWorthContribution(asset) {
  if (isVehicleAsset(asset) && isTruthy(asset.hasLoan)) return financedAssetSnapshot(asset).netWorthContribution;
  return nonNegativeRupees(asset.value);
}

function vehicleOutstandingLoan(asset) {
  if (!isVehicleAsset(asset) || !isTruthy(asset.hasLoan)) return 0;
  return financedAssetSnapshot(asset).outstandingLoan;
}

function vehicleEmi(asset) {
  if (!isVehicleAsset(asset) || !isTruthy(asset.hasLoan)) return 0;
  return financedAssetSnapshot(asset).loan.emi;
}

function assetSearchText(asset) {
  return `${asset.type || ""} ${asset.name || ""} ${asset.ticker || ""} ${asset.assetSubType || ""} ${asset.sector || ""} ${asset.tags || ""} ${asset.brand || ""} ${asset.model || ""} ${asset.location || ""} ${asset.source || ""}`.toLowerCase();
}

function assetTypeText(asset) {
  return String(asset?.type || "").trim().toLowerCase();
}

function isCashAsset(asset) {
  const text = assetSearchText(asset);
  return /\bcash\b|bank balance|savings account|current account|wallet|liquid fund/.test(text);
}

function isVehicleAsset(asset) {
  return !isInvestmentAsset(asset) && assetCategoryViews.vehicles.matcher(asset);
}

function isInvestmentAsset(asset) {
  return assetCategoryViews.investments.matcher(asset);
}

function isWatchAsset(asset) {
  return assetCategoryForAsset(asset) === "watches";
}

function isInvestmentLikeAsset(asset) {
  const text = assetSearchText(asset);
  const typeText = `${asset.type || ""} ${asset.assetSubType || ""}`.toLowerCase();
  return Boolean(asset.ticker) || /investment|stock|mutual|etf|esop|equity|shares/.test(typeText) || /stock|mutual fund|sip|demat|broker|portfolio/.test(text);
}

function investmentSpecs(asset) {
  const snapshot = investmentSnapshot(asset);
  return [
    asset.ticker,
    asset.assetSubType,
    snapshot.quantity ? `${snapshot.quantity} units` : "",
    snapshot.roi !== null ? `${snapshot.roi}% ROI` : ""
  ].filter(Boolean);
}

function assetCategoryForAsset(asset) {
  const type = assetTypeText(asset);
  if (type === "car") return "vehicles";
  if (type === "land") return "land";
  if (type === "shoes") return "shoes";
  if (type === "watches") return "watches";
  if (type === "flats") return "flats";
  if (type === "other funds") return "funds";
  if (type === "cash") return "cash";
  if (type === "investment assets") return "investments";
  if (isInvestmentAsset(asset)) return "investments";
  if (isCashAsset(asset)) return "cash";
  return Object.entries(assetCategoryViews).find(([, category]) => category.matcher(asset))?.[0] || null;
}

function nonCashAssets() {
  return state.assets.filter(asset => !isCashAsset(asset));
}

function cashBalance() {
  return state.assets
    .filter(isCashAsset)
    .reduce((sum, item) => sum + Number(item.value || 0), 0);
}

function upcoming() {
  const fromDocs = state.documents
    .filter(item => item.expiry)
    .map(item => ({ name: item.name, date: item.expiry, type: "Document" }));
  const fromAssets = state.assets
    .filter(item => item.renewal)
    .map(item => ({ name: item.name, date: item.renewal, type: "Asset" }));
  const fromAlerts = state.alerts.map(item => ({ name: item.name, date: item.date, type: item.priority }));
  return [...fromDocs, ...fromAssets, ...fromAlerts]
    .map(item => ({ ...item, days: daysUntil(item.date) }))
    .filter(item => item.days !== null)
    .sort((a, b) => a.days - b.days);
}

function refreshMetrics() {
  const data = totals();
  setText("#summary-assets", money(data.assets));
  setText("#summary-liabilities", money(data.liabilities));
  setText("#summary-renewals", data.renewalCount);
  setText("#summary-documents", state.documents.length);
  setText("#summary-cash", money(data.cash));
  setText("#hero-net-worth", money(data.netWorth));
  setText("#hero-health-score", `${data.health}/100`);
  setText("#hero-cash-flow", money(data.cashFlow));
  setText("#advisor-answer", advisorText());
  renderTimeline();
}

function setText(selector, value) {
  const element = document.querySelector(selector);
  if (element) element.textContent = value;
}

function advisorText(question = "What should I add first?") {
  const data = totals();
  if (!state.assets.length) {
    return "Start with one big purchase: car, flat, land, watch, shoes, investment, fund, or cash. Then upload the ownership or proof document.";
  }
  if (/first|start|add/i.test(question)) {
    const missing = missingDocuments()[0];
    return missing ? `Next, add ${missing[0]} for ${missing[1]}.` : "Your main assets have basic documents covered. Keep values updated monthly.";
  }
  if (/fortuner|car/i.test(question)) {
    const estimatedEmi = 92000;
    const projectedDebt = state.cash.income ? Math.round(((data.emi + estimatedEmi) / state.cash.income) * 100) : 0;
    return projectedDebt > 40
      ? `Not yet. A new EMI could push fixed debt payments to ${projectedDebt}% of income. Reduce loans or increase cash flow first.`
      : `Possible. A new EMI would put fixed debt payments near ${projectedDebt}% of income, but keep insurance and emergency fund intact.`;
  }
  if (/retire/i.test(question)) {
    const target = state.goals.find(item => /retire/i.test(item.name));
    if (!target) return "Create a retirement goal first, then I can estimate the gap.";
    return `Retirement goal progress is ${Math.round((target.saved / target.target) * 100)}%. Current gap is ${money(target.target - target.saved)}.`;
  }
  if (/loan|debt/i.test(question)) return `Your debt ratio is ${data.debtRatio}%. Monthly EMI total is ${money(data.emi)}.`;
  if (/renew|expire|insurance/i.test(question)) {
    const next = upcoming()[0];
    return next ? `${next.name} is next, due in ${next.days} days.` : "No upcoming renewals are recorded.";
  }
  return `Net worth is ${money(data.netWorth)}, cash balance is ${money(data.cash)}, monthly cash flow is ${money(data.cashFlow)}, and health score is ${data.health}/100.`;
}

function renderTimeline() {
  const host = document.querySelector("#timeline-list");
  const items = upcoming().slice(0, 5);
  host.innerHTML = items.length
    ? items.map(item => `<li><b>${item.days} days</b> ${escapeHtml(item.name)}</li>`).join("")
    : "<li><b>Clear</b> No renewals due</li>";
}

function renderView(viewName = activeView) {
  activeView = viewName;
  document.body.classList.toggle("map-dashboard", viewName === "home");
  if (searchInput.value.trim()) {
    title.textContent = "Search";
    viewLabel.textContent = "Global";
    actions.innerHTML = "";
    grid.innerHTML = "";
    list.innerHTML = searchRecords(searchInput.value);
    refreshMetrics();
    syncTabs(viewName);
    return;
  }
  const view = config[viewName];
  title.textContent = view.title;
  viewLabel.textContent = view.label;
  actions.innerHTML = "";
  grid.innerHTML = "";
  list.innerHTML = "";

  if (viewName === "home") renderDashboard();
  if (viewName === "assets") renderAssets();
  if (viewName === "documents") renderCollection("documents");
  if (viewName === "taxDocuments") renderTaxDocuments();
  if (viewName === "reports") renderReports();
  if (viewName === "ai") renderAi();

  refreshMetrics();
  syncTabs(viewName);
}

function setActions(collection, extra = "") {
  actions.innerHTML = `
    <button class="primary-action" type="button" data-add="${collection}">+ ${config[activeView].action}</button>
    ${extra}
  `;
}

function renderDashboard() {
  const data = totals();
  const highlightAsset = nonCashAssets()[0] || state.assets[0];
  actions.innerHTML = "";
  grid.innerHTML = "";
  list.innerHTML = `
    <div class="wellness-dashboard">
      <div class="asset-highlight">
        <div class="asset-highlight-head">
          <span>Asset Highlight: <b>${escapeHtml(highlightAsset?.name || "Rivian R1S")}</b></span>
        </div>
        <div class="hero-car-stage" aria-label="Premium SUV preview">
          <img src="assets/wealth-hero-suv-transparent.png" alt="Premium electric SUV">
        </div>
        <div class="highlight-actions">
          <button class="secondary-action" type="button" data-view-shortcut="assets">Add a big purchase</button>
          <button class="secondary-action" type="button" data-view-shortcut="documents">Store a document</button>
        </div>
        <div class="highlight-metrics">
          <div><strong>${money(data.netWorth)}</strong><span>Net Worth</span></div>
          <div><strong>${money(data.assets)}</strong><span>Assets</span></div>
          <div><strong>${state.documents.length}</strong><span>Documents</span></div>
        </div>
      </div>
      ${dashboardCalendarCard()}
      <div class="wellness-mini-card cash-card">
        <span>Cash balance</span>
        <strong>${money(data.cash)}</strong>
        <p>Bank and reserve assets</p>
        <button class="secondary-action" type="button" data-asset-category="cash">Open cash</button>
      </div>
      ${netWorthRingCard(data)}
      ${wholeProjectIntelligenceStrip()}
      <div class="wellness-mini-card documents-card">
        <span>Document readiness</span>
        <strong>${documentReadiness()}%</strong>
        <p>${state.documents.length} saved documents</p>
        <button class="secondary-action" type="button" data-view-shortcut="documents">Review vault</button>
      </div>
      ${needsAttentionCard()}
      ${quickAddCard()}
      ${dashboardActivityCard()}
    </div>
  `;
  if (!state.assets.length && !state.documents.length) {
    list.innerHTML += `
      <div class="quick-start-panel">
        <strong>Start with 3 details only</strong>
        <span>What did you buy?</span>
        <span>How much did you spend?</span>
        <span>When did you buy it?</span>
      </div>
    `;
  }
  loadFinanceNews();
  loadMarketEvents();
}

function needsAttentionCard() {
  const items = nextActions().slice(0, 3);
  return `
    <section class="needs-attention-card">
      <span>Needs attention</span>
      <strong>${items.length}</strong>
      <div>
        ${items.map(item => `<p>${escapeHtml(item)}</p>`).join("")}
      </div>
    </section>
  `;
}

function wholeProjectIntelligenceStrip() {
  const assets = state.assets;
  const readiness = assets.length ? Math.round(assets.reduce((sum, asset) => sum + assetCompletion(asset), 0) / assets.length) : 0;
  const stale = assets.filter(isAssetValueOutdated).length;
  const missing = assets.reduce((sum, asset) => sum + missingDocsForAsset(asset).length, 0);
  const top = topAssetConcentration();
  const titleText = missing ? "Document risk" : stale ? "Value freshness risk" : top.percent >= 50 ? "Concentration watch" : assets.length ? "Wealth network healthy" : "Start wealth network";
  const copy = missing
    ? `${missing} document gaps can affect ownership proof, resale or claims.`
    : stale
      ? `${stale} asset values need a refresh for accurate net worth.`
      : top.percent >= 50
        ? `${top.label} is ${top.percent}% of tracked wealth.`
        : assets.length
          ? "Assets, documents and reminders are connected enough to read quickly."
          : "Add one asset and one document to activate intelligence.";
  return `
    <section class="project-intelligence-strip">
      <div class="intelligence-ring" style="--score:${readiness}"><strong>${readiness}%</strong></div>
      <div><span>Wealth intelligence</span><strong>${escapeHtml(titleText)}</strong><p>${escapeHtml(copy)}</p></div>
    </section>
  `;
}

function quickAddCard() {
  return `
    <section class="quick-add-card">
      <span>Quick add</span>
      <strong>Save the next important thing</strong>
      <div>
        <button type="button" data-add="assets">Asset</button>
        <button type="button" data-add="documents">Document</button>
        <button type="button" data-add="alerts">Reminder</button>
        <button type="button" data-add="assets" data-asset-type="Cash">Cash</button>
      </div>
    </section>
  `;
}

function netWorthRingCard(data) {
  const total = Math.max(1, data.assets + data.cash + data.liabilities);
  const assetPercent = Math.round((data.assets / total) * 100);
  const cashPercent = Math.round((data.cash / total) * 100);
  const liabilityPercent = Math.max(0, 100 - assetPercent - cashPercent);
  return `
    <section class="net-worth-ring-card">
      <div class="wealth-ring" style="--asset:${assetPercent}; --cash:${cashPercent}; --debt:${liabilityPercent}">
        <span>${money(data.netWorth)}</span>
      </div>
      <div>
        <small>What you own</small>
        <strong>Assets, cash and debt</strong>
        <p><b>Assets</b> ${money(data.assets)}</p>
        <p><b>Asset equity</b> ${money(data.assetEquity)}</p>
        <p><b>Cash</b> ${money(data.cash)}</p>
        <p><b>Debt</b> ${money(data.liabilities)}</p>
      </div>
    </section>
  `;
}

function documentReadiness() {
  const total = personalDocumentTypes.length || 1;
  const saved = personalDocumentTypes.filter(hasDocumentMatch).length;
  return Math.round((saved / total) * 100);
}

function dashboardCalendarCard() {
  const today = startOfToday();
  const monthName = today.toLocaleDateString("en-US", { month: "long" });
  const year = today.getFullYear();
  const month = today.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const upcomingDates = new Set(upcoming().map(item => {
    const date = new Date(`${item.date}T00:00:00`);
    return date.getFullYear() === year && date.getMonth() === month ? date.getDate() : null;
  }).filter(Boolean));
  const marketDates = marketEventDatesFor(year, month);
  const cells = [];
  for (let index = 0; index < firstDay; index += 1) cells.push(`<i></i>`);
  for (let day = 1; day <= daysInMonth; day += 1) {
    const classes = [
      day === today.getDate() ? "today" : "",
      upcomingDates.has(day) ? "marked" : "",
      marketDates.has(day) ? "market-marked" : ""
    ].filter(Boolean).join(" ");
    cells.push(`<b class="${classes}">${day}</b>`);
  }
  const eventItems = upcoming().slice(0, 3);
  return `
    <section class="dashboard-calendar">
      <div>
        <span>Your calendar</span>
        <strong>${monthName}</strong>
        <button class="calendar-add" type="button" data-add="alerts">Add meeting</button>
      </div>
      <small>${year}</small>
      <div class="calendar-weekdays"><em>S</em><em>M</em><em>T</em><em>W</em><em>T</em><em>F</em><em>S</em></div>
      <div class="calendar-days">${cells.join("")}</div>
      <div class="calendar-events">
        <div><span>Upcoming finance events</span><button type="button" data-refresh-market-events>Update</button></div>
        <div id="market-events-list">${marketEventsMarkup(eventItems.length ? "" : "")}</div>
        ${eventItems.length ? `<div class="personal-events">${eventItems.map(item => `
          <button type="button" data-add="alerts" data-prefill-name="${escapeAttribute(item.name)}" data-prefill-linked="${escapeAttribute(item.type || "")}">
            <b>${escapeHtml(item.days < 0 ? "Overdue" : item.days === 0 ? "Today" : `${item.days}d`)}</b>
            <span>${escapeHtml(item.name)}</span>
          </button>
        `).join("")}</div>` : ""}
      </div>
      <div class="finance-news">
        <div><span>Financial news</span><button type="button" data-refresh-news>Refresh</button></div>
        <div id="finance-news-list">${financeNewsMarkup()}</div>
      </div>
    </section>
  `;
}

function dashboardActivityCard() {
  const actions = nextActions().slice(0, 4);
  return `
    <section class="dashboard-habits">
      <div class="habit-head">
        <strong>Today in Wealth OS</strong>
        <button type="button" data-add="alerts">+</button>
      </div>
      ${actions.map((item, index) => `
        <div class="habit-row">
          <span>${index + 1}</span>
          <b>${escapeHtml(item)}</b>
          <i><em style="width:${Math.max(18, 95 - index * 16)}%"></em></i>
        </div>
      `).join("")}
    </section>
  `;
}

function renderAssets() {
  if (activeAssetCategory && assetCategoryViews[activeAssetCategory]) {
    renderAssetCategory(activeAssetCategory);
    return;
  }
  const data = totals();
  const assetItems = nonCashAssets();
  const cashItems = state.assets.length - assetItems.length;
  const filteredAssets = filteredSortedAssets();
  actions.innerHTML = `<button class="primary-action" type="button" data-add="assets">Add Custom Asset</button>`;
  grid.innerHTML = [
    metricModule("Total Assets", money(data.assets), `${assetItems.length} ${assetItems.length === 1 ? "asset" : "assets"}, ${cashItems} cash`, config.assets.color),
    metricModule("Cash", money(data.cash), "Bank and reserves", "linear-gradient(135deg, #151f1c 0%, #334021 100%)"),
    metricModule("Missing Docs", missingDocuments().length, "Across assets and personal papers", "linear-gradient(135deg, #151f1c 0%, #334021 100%)")
  ].join("");
  list.innerHTML = `
    ${assetPortfolioSummary()}
    ${assetCockpitPanel()}
    ${assetIntelligencePanel()}
    ${assetVisualDashboard()}
    ${assetConcentrationAlert()}
    ${sectionHeader("Asset categories", "Pick a vault")}
    ${categoryTiles()}
    ${assetControlBar()}
    ${sectionHeader("Saved Assets", `${filteredAssets.length} shown`)}
    ${assetPortfolioCards(filteredAssets)}
  `;
}

function assetPortfolioSummary() {
  const nonCash = nonCashAssets();
  const cash = cashBalance();
  const totalCurrent = nonCash.reduce((sum, item) => sum + Number(item.value || 0), 0);
  const totalBought = nonCash.reduce((sum, item) => sum + Number(item.purchasePrice || 0), 0);
  const gain = totalCurrent - totalBought;
  const complete = state.assets.filter(item => assetCompletion(item) >= 80).length;
  return `
    <section class="asset-command-center">
      <div>
        <span>Portfolio value</span>
        <strong>${money(totalCurrent + cash)}</strong>
        <small>${nonCash.length} assets, ${state.assets.length - nonCash.length} cash accounts</small>
      </div>
      <div>
        <span>Purchase value</span>
        <strong>${money(totalBought)}</strong>
        <small>${totalBought ? `${gain >= 0 ? "Gain" : "Loss"} ${money(Math.abs(gain))}` : "Add buying prices"}</small>
      </div>
      <div>
        <span>Asset health</span>
        <strong>${state.assets.length ? Math.round((complete / state.assets.length) * 100) : 0}%</strong>
        <small>${complete}/${state.assets.length || 0} assets mostly complete</small>
      </div>
    </section>
  `;
}

function assetCockpitPanel() {
  const assets = state.assets;
  const nonCash = nonCashAssets();
  const data = totals();
  const marketValue = nonCash.reduce((sum, item) => sum + Number(item.value || 0), 0);
  const liquidValue = state.assets
    .filter(asset => isCashAsset(asset) || /investment|fund|stock|mutual|fd|ppf|epf|nps/i.test(`${asset.type} ${asset.name}`))
    .reduce((sum, item) => sum + Number(item.value || 0), 0);
  const documentGaps = assets.reduce((sum, asset) => sum + missingDocsForAsset(asset).length, 0);
  const freshValues = assets.filter(asset => !isAssetValueOutdated(asset)).length;
  const loanExposure = data.vehicleLoanBalance;
  const totalReference = Math.max(1, marketValue + data.cash);
  const liquidityPercent = Math.min(100, Math.round(((liquidValue + data.cash) / totalReference) * 100));
  const documentPercent = assets.length
    ? Math.round((assets.filter(asset => !missingDocsForAsset(asset).length).length / assets.length) * 100)
    : 0;
  const valueFreshness = assets.length ? Math.round((freshValues / assets.length) * 100) : 0;
  const loanPercent = Math.min(100, Math.round((loanExposure / Math.max(1, marketValue)) * 100));
  const spotlight = assetCockpitSpotlight();
  return `
    <section class="asset-cockpit-panel">
      <div class="cockpit-hero">
        <span>Asset cockpit</span>
        <strong>${escapeHtml(spotlight.title)}</strong>
        <p>${escapeHtml(spotlight.copy)}</p>
      </div>
      <div class="cockpit-dials">
        ${cockpitDial("Liquidity", liquidityPercent, `${money(data.cash)} cash`)}
        ${cockpitDial("Documents", documentPercent, `${documentGaps} gaps`)}
        ${cockpitDial("Fresh values", valueFreshness, `${assets.length - freshValues} stale`)}
        ${cockpitDial("Loan load", loanPercent, money(loanExposure), true)}
      </div>
      <div class="cockpit-stack">
        ${assetCockpitTimeline()}
      </div>
    </section>
  `;
}

function cockpitDial(label, score, detail, inverse = false) {
  const displayScore = inverse ? Math.max(0, 100 - score) : score;
  return `
    <div class="cockpit-dial" style="--score:${displayScore}">
      <i><b>${score}%</b></i>
      <span>${escapeHtml(label)}</span>
      <small>${escapeHtml(detail)}</small>
    </div>
  `;
}

function assetCockpitSpotlight() {
  const missingAsset = state.assets.find(asset => missingDocsForAsset(asset).length);
  if (missingAsset) {
    const missing = missingDocsForAsset(missingAsset)[0];
    return {
      title: "Proof gap detected",
      copy: `${missingAsset.name} needs ${missing}. Fixing proof first makes resale, claims, and family handover easier.`
    };
  }
  const loanAsset = nonCashAssets().find(asset => isVehicleAsset(asset) && isTruthy(asset.hasLoan));
  if (loanAsset) {
    const snapshot = financedAssetSnapshot(loanAsset);
    return {
      title: "Vehicle equity tracked",
      copy: `${loanAsset.name} currently contributes ${money(snapshot.netWorthContribution)} after subtracting the outstanding loan.`
    };
  }
  const staleAsset = state.assets.find(isAssetValueOutdated);
  if (staleAsset) {
    return {
      title: "Value refresh needed",
      copy: `${staleAsset.name} should be updated so your net worth stays realistic.`
    };
  }
  return {
    title: state.assets.length ? "Portfolio readable" : "Start with one asset",
    copy: state.assets.length
      ? "Your saved assets have enough structure to read value, proof, and next action quickly."
      : "Add one vehicle, flat, land, watch, shoe, investment, fund, or cash balance to activate the cockpit."
  };
}

function assetCockpitTimeline() {
  const events = [
    ...upcoming().slice(0, 2).map(item => ({
      label: item.name,
      detail: item.days < 0 ? "Overdue" : item.days === 0 ? "Today" : `${item.days} days`
    })),
    ...state.assets
      .filter(isAssetValueOutdated)
      .slice(0, 2)
      .map(asset => ({ label: asset.name, detail: "Value review" })),
    ...state.assets
      .filter(asset => missingDocsForAsset(asset).length)
      .slice(0, 2)
      .map(asset => ({ label: asset.name, detail: `${missingDocsForAsset(asset).length} docs missing` }))
  ].slice(0, 4);
  if (!events.length) {
    return `
      <div class="cockpit-timeline">
        <span>Signal timeline</span>
        <button type="button" data-add="alerts"><b>All clear</b><small>Add reminder</small></button>
      </div>
    `;
  }
  return `
    <div class="cockpit-timeline">
      <span>Signal timeline</span>
      ${events.map(item => `
        <button type="button" data-add="alerts" data-prefill-name="${escapeAttribute(item.label)}">
          <b>${escapeHtml(item.label)}</b>
          <small>${escapeHtml(item.detail)}</small>
        </button>
      `).join("")}
    </div>
  `;
}

function assetIntelligencePanel() {
  const assets = state.assets;
  const stale = assets.filter(isAssetValueOutdated).length;
  const missing = assets.reduce((sum, asset) => sum + missingDocsForAsset(asset).length, 0);
  const highValue = assets.filter(asset => Number(asset.value || 0) >= 1000000).length;
  const completeAvg = assets.length
    ? Math.round(assets.reduce((sum, asset) => sum + assetCompletion(asset), 0) / assets.length)
    : 0;
  const liquidity = assets.length
    ? Math.round((assets.filter(asset => isCashAsset(asset) || /investment|fund|stock|mutual|fd|ppf|epf|nps/i.test(`${asset.type} ${asset.name}`)).length / assets.length) * 100)
    : 0;
  const signal = missing ? "Document risk" : stale ? "Value review" : assets.length ? "Portfolio clean" : "Start scanning";
  return `
    <section class="asset-intelligence-panel">
      <div class="asset-orbit" style="--health:${completeAvg}; --liquidity:${liquidity}">
        <span></span>
        <b>${completeAvg}%</b>
      </div>
      <div class="asset-ai-copy">
        <span>Asset intelligence</span>
        <strong>${escapeHtml(signal)}</strong>
        <p>${escapeHtml(assetIntelligenceCopy({ stale, missing, highValue, assets: assets.length }))}</p>
      </div>
      <div class="asset-signal-grid">
        <span><b>${stale}</b><small>stale values</small></span>
        <span><b>${missing}</b><small>docs missing</small></span>
        <span><b>${highValue}</b><small>high-value items</small></span>
      </div>
    </section>
  `;
}

function assetIntelligenceCopy({ stale, missing, highValue, assets }) {
  if (!assets) return "Add one asset and Wealth OS will start checking value freshness, document gaps, and completion quality.";
  if (missing) return `${missing} document gaps can affect resale, insurance claims, or ownership proof.`;
  if (stale) return `${stale} asset values need a market refresh to keep net worth realistic.`;
  if (highValue) return `${highValue} high-value assets are being tracked. Keep insurance and ownership papers complete.`;
  return "Your tracked assets look clean. Keep values and reminders updated monthly.";
}

function assetVisualDashboard() {
  const categoryRows = assetCategoryVisualRows();
  const actionRows = assetNextBestActions();
  return `
    <section class="asset-visual-dashboard">
      <div class="asset-map-card">
        <div class="asset-map-head">
          <span>Asset map</span>
          <strong>Where your wealth sits</strong>
        </div>
        <div class="asset-map-bars">
          ${categoryRows.length ? categoryRows.map(row => `
            <button type="button" data-asset-category="${escapeAttribute(row.key)}">
              <span>${escapeHtml(row.label)}</span>
              <i><b style="width:${row.percent}%"></b></i>
              <strong>${money(row.value)}</strong>
            </button>
          `).join("") : `<p>Add assets to see your portfolio map.</p>`}
        </div>
      </div>
      <div class="asset-radar-card">
        <span>Readiness scan</span>
        ${assetRadarRings()}
      </div>
      <div class="asset-next-card">
        <div class="asset-map-head">
          <span>Next best actions</span>
          <strong>Fix these first</strong>
        </div>
        ${actionRows.map(item => `
          <button type="button" ${item.action}>
            <b>${escapeHtml(item.label)}</b>
            <small>${escapeHtml(item.detail)}</small>
          </button>
        `).join("")}
      </div>
    </section>
  `;
}

function topAssetConcentration() {
  const rows = state.assets
    .filter(asset => Number(asset.value || 0) > 0)
    .map(asset => ({ asset, value: Number(asset.value || 0) }))
    .sort((a, b) => b.value - a.value);
  const total = rows.reduce((sum, row) => sum + row.value, 0);
  const top = rows[0];
  return {
    asset: top?.asset || null,
    label: top?.asset?.name || "Top asset",
    value: top?.value || 0,
    percent: top && total ? Math.round((top.value / total) * 100) : 0
  };
}

function assetConcentrationAlert() {
  const top = topAssetConcentration();
  if (!top.asset || top.percent < 45) return "";
  return `
    <section class="investment-concentration-alert asset-wide-alert">
      <span>Wealth concentration alert</span>
      <strong>${escapeHtml(top.label)} is ${top.percent}% of tracked wealth.</strong>
      <p>That can be fine if intentional. Review cover, documents, liquidity and family ownership clarity.</p>
    </section>
  `;
}

function assetCategoryVisualRows() {
  const rows = Object.entries(assetCategoryViews).map(([key, category]) => {
    const items = state.assets.filter(category.matcher);
    const value = items.reduce((sum, item) => sum + Number(item.value || 0), 0);
    return { key, label: category.tile, value };
  }).filter(row => row.value > 0);
  const total = rows.reduce((sum, row) => sum + row.value, 0) || 1;
  return rows
    .sort((a, b) => b.value - a.value)
    .slice(0, 6)
    .map(row => ({ ...row, percent: Math.max(5, Math.round((row.value / total) * 100)) }));
}

function assetRadarRings() {
  const total = Math.max(1, state.assets.length);
  const docsReady = Math.round((state.assets.filter(asset => !missingDocsForAsset(asset).length).length / total) * 100);
  const valuesFresh = Math.round((state.assets.filter(asset => !isAssetValueOutdated(asset)).length / total) * 100);
  const insured = Math.round((state.assets.filter(asset => asset.renewal || /cash|investment|fund/i.test(`${asset.type} ${asset.name}`)).length / total) * 100);
  return `
    <div class="radar-rings">
      <i style="--score:${docsReady}"><b>${docsReady}%</b><small>Docs</small></i>
      <i style="--score:${valuesFresh}"><b>${valuesFresh}%</b><small>Values</small></i>
      <i style="--score:${insured}"><b>${insured}%</b><small>Cover</small></i>
    </div>
  `;
}

function assetQualityBadges(asset) {
  const badges = [];
  if (!isAssetValueOutdated(asset)) badges.push(["Fresh value", "good"]);
  else badges.push(["Update value", "warn"]);
  if (missingDocsForAsset(asset).length) badges.push(["Docs missing", "warn"]);
  else badges.push(["Docs ready", "good"]);
  if (Number(asset.value || 0) >= 1000000) badges.push(["High value", "warn"]);
  if (asset.renewal) badges.push(["Reminder set", "good"]);
  if (!asset.owner) badges.push(["Needs owner", "warn"]);
  return `<span class="investment-badges asset-badges">${badges.slice(0, 4).map(([label, tone]) => `<em class="${tone}">${escapeHtml(label)}</em>`).join("")}</span>`;
}

function assetNextBestActions() {
  const missingAsset = state.assets.find(asset => missingDocsForAsset(asset).length);
  const staleAsset = state.assets.find(isAssetValueOutdated);
  const noPhotoAsset = state.assets.find(asset => !asset.photoId);
  const actions = [];
  if (missingAsset) actions.push({
    label: "Complete papers",
    detail: `${missingDocsForAsset(missingAsset)[0]} missing for ${missingAsset.name}`,
    action: `data-detail="assets" data-id="${escapeAttribute(missingAsset.id)}"`
  });
  if (staleAsset) actions.push({
    label: "Refresh value",
    detail: `${staleAsset.name} valuation is old or missing`,
    action: `data-detail="assets" data-id="${escapeAttribute(staleAsset.id)}"`
  });
  if (noPhotoAsset) actions.push({
    label: "Add photo",
    detail: `${noPhotoAsset.name} will be easier to identify`,
    action: `data-edit="assets" data-id="${escapeAttribute(noPhotoAsset.id)}"`
  });
  if (!actions.length) actions.push({
    label: "Add next asset",
    detail: "Track one more purchase, cash balance, or document-backed holding",
    action: `data-add="assets"`
  });
  return actions.slice(0, 3);
}

function assetControlBar() {
  const filters = [
    ["all", "All"],
    ["missing-docs", "Missing docs"],
    ["stale", "Value outdated"],
    ["gain", "Profitable"],
    ["loss", "Loss-making"],
    ["cash", "Cash"]
  ];
  const sorts = [
    ["value", "Highest value"],
    ["newest", "Newest"],
    ["gain", "Biggest gain"],
    ["docs", "Docs missing"]
  ];
  return `
    <section class="asset-controls">
      <div>
        ${filters.map(([key, label]) => `<button class="${assetFilter === key ? "active" : ""}" type="button" data-asset-filter="${escapeAttribute(key)}">${escapeHtml(label)}</button>`).join("")}
      </div>
      <label>
        Sort
        <select id="asset-sort">
          ${sorts.map(([key, label]) => `<option value="${escapeAttribute(key)}" ${assetSort === key ? "selected" : ""}>${escapeHtml(label)}</option>`).join("")}
        </select>
      </label>
    </section>
  `;
}

function filteredSortedAssets() {
  const rows = [...state.assets].filter(asset => {
    const gain = Number(asset.value || 0) - Number(asset.purchasePrice || 0);
    if (assetFilter === "cash") return isCashAsset(asset);
    if (assetFilter === "missing-docs") return missingDocsForAsset(asset).length > 0;
    if (assetFilter === "stale") return isAssetValueOutdated(asset);
    if (assetFilter === "gain") return Number(asset.purchasePrice || 0) > 0 && gain >= 0;
    if (assetFilter === "loss") return Number(asset.purchasePrice || 0) > 0 && gain < 0;
    return true;
  });
  return rows.sort((a, b) => {
    if (assetSort === "newest") return String(b.lastUpdated || "").localeCompare(String(a.lastUpdated || ""));
    if (assetSort === "gain") return assetGain(b) - assetGain(a);
    if (assetSort === "docs") return missingDocsForAsset(b).length - missingDocsForAsset(a).length;
    return Number(b.value || 0) - Number(a.value || 0);
  });
}

function assetGain(asset) {
  return Number(asset.value || 0) - Number(asset.purchasePrice || 0);
}

function investmentSnapshot(asset) {
  const quantity = Number(asset.quantity || 0);
  const buyPrice = Number(asset.buyPrice || 0);
  const currentPrice = Number(asset.currentPrice || 0);
  const fees = Number(asset.brokerageFees || 0);
  const dividends = Number(asset.dividendsReceived || 0);
  const currency = "INR";
  const exchangeRate = 1;
  const hasConversionRate = true;
  const realizedGain = investmentTransactions(asset)
    .filter(item => item.type === "Sell")
    .reduce((sum, item) => sum + Number(item.realizedGain || 0), 0);
  const costBasis = Number(asset.purchasePrice || 0) || (quantity * buyPrice) + fees;
  const currentValue = Number(asset.value || 0) || quantity * currentPrice;
  const averageBuyPrice = quantity ? costBasis / quantity : 0;
  const unrealizedGain = currentValue - costBasis;
  const totalReturn = unrealizedGain + realizedGain + dividends;
  const roi = costBasis ? Math.round((totalReturn / costBasis) * 1000) / 10 : null;
  const weightValue = Math.max(0, currentValue);
  const conversionRate = hasConversionRate ? exchangeRate : 1;
  return {
    quantity,
    buyPrice,
    currentPrice,
    currency,
    exchangeRate,
    hasConversionRate,
    fees,
    dividends,
    costBasis: roundRupees(costBasis),
    currentValue: roundRupees(currentValue),
    costBasisInr: roundRupees(costBasis * conversionRate),
    currentValueInr: roundRupees(currentValue * conversionRate),
    unrealizedGainInr: roundRupees(unrealizedGain * conversionRate),
    realizedGainInr: roundRupees(realizedGain * conversionRate),
    dividendsInr: roundRupees(dividends * conversionRate),
    totalReturnInr: roundRupees(totalReturn * conversionRate),
    averageBuyPrice: Math.round(averageBuyPrice * 100) / 100,
    unrealizedGain: roundRupees(unrealizedGain),
    realizedGain: roundRupees(realizedGain),
    totalReturn: roundRupees(totalReturn),
    roi,
    weightValue
  };
}

function investmentTransactions(asset) {
  return Array.isArray(asset.investmentTransactions) ? asset.investmentTransactions : [];
}

function validateInvestmentValues(values, existingId = null) {
  if (!String(values.ticker || "").trim()) return "Add a ticker or symbol for this investment.";
  if (!/^[A-Z0-9.\-_]{1,30}$/i.test(String(values.ticker || "").trim())) return "Ticker should use letters, numbers, dot, dash or underscore only.";
  if (!String(values.name || "").trim()) return "Add the asset name.";
  if (!values.purchaseDate) return "Add the purchase date.";
  if (new Date(`${values.purchaseDate}T00:00:00`) > startOfToday()) return "Purchase date cannot be in the future.";
  if (Number(values.buyPrice || 0) <= 0) return "Buy price per unit must be greater than zero.";
  if (Number(values.quantity || 0) <= 0) return "Quantity / units must be greater than zero.";
  if (Number(values.currentPrice || 0) < 0) return "Current price cannot be negative.";
  values.currency = "INR";
  values.exchangeRate = 1;
  if (!String(values.owner || "").trim()) return "Add the owner or family member for this holding.";
  const lotId = String(values.lotId || "").trim();
  if (lotId) {
    const duplicate = state.assets.find(asset =>
      asset.id !== existingId &&
      isInvestmentAsset(asset) &&
      String(asset.lotId || "").trim().toLowerCase() === lotId.toLowerCase()
    );
    if (duplicate) return `Lot ID "${lotId}" is already used for ${duplicate.name || duplicate.ticker}.`;
  }
  return "";
}

function applyInvestmentDerivedValues(values) {
  values.ticker = String(values.ticker || "").trim().toUpperCase();
  values.currency = "INR";
  values.exchangeRate = 1;
  values.assetSubType = values.assetSubType || "Stock";
  values.sector = String(values.sector || "").trim();
  values.tags = String(values.tags || "").trim();
  values.taxLotMethod = values.taxLotMethod || "FIFO";
  values.lotId = values.lotId || `${values.ticker || "LOT"}-${values.purchaseDate || new Date().toISOString().slice(0, 10)}`;
  values.acquisitionDate = values.purchaseDate;
  values.purchasePrice = roundRupees((Number(values.quantity || 0) * Number(values.buyPrice || 0)) + Number(values.brokerageFees || 0));
  values.value = roundRupees(Number(values.quantity || 0) * Number(values.currentPrice || 0));
  values.source = values.source || "Manual price";
}

function assetPortfolioCards(items) {
  if (!items.length) return `<div class="empty-state">${escapeHtml(emptyStateText("assets"))}</div>`;
  return `<div class="asset-card-grid">${items.map(assetPortfolioCard).join("")}</div>`;
}

function assetPortfolioCard(asset) {
  if (isInvestmentAsset(asset)) return investmentPortfolioAssetCard(asset);
  const categoryKey = assetCategoryForAsset(asset);
  const category = categoryKey ? assetCategoryViews[categoryKey] : null;
  const image = asset.photoId ? fileViewUrl(asset.photoId) : category?.fallback || "assets/wealth-fallback-investments.png";
  const gain = assetGain(asset);
  const bought = Number(asset.purchasePrice || 0);
  const current = Number(asset.value || 0);
  const missing = missingDocsForAsset(asset);
  const completion = assetCompletion(asset);
  return `
    <button class="asset-portfolio-card" type="button" data-detail="assets" data-id="${escapeAttribute(asset.id)}">
      <span class="asset-card-photo"><img src="${escapeAttribute(image)}" alt="${escapeAttribute(asset.name || "Asset")}"></span>
      <span class="asset-card-main">
        <small>${escapeHtml(asset.type || category?.title || "Asset")}</small>
        <strong>${escapeHtml(asset.name || "Untitled asset")}</strong>
        <em>${escapeHtml([asset.brand, asset.model, asset.location, asset.owner].filter(Boolean).slice(0, 2).join(" - ") || "Add owner, location or specs")}</em>
        ${assetQualityBadges(asset)}
      </span>
      <span class="asset-card-values">
        <b><small>Current</small>${money(current)}</b>
        <b><small>Bought</small>${money(bought)}</b>
        <i class="${gain >= 0 ? "up" : "down"}">${bought ? `${gain >= 0 ? "+" : "-"} ${money(Math.abs(gain))}` : "Add cost"}</i>
      </span>
      <span class="asset-card-health">
        <b>${completion}% complete</b>
        <i><em style="width:${completion}%"></em></i>
        <small>${missing.length ? `${missing.length} docs missing` : "Documents ready"}</small>
      </span>
      <span class="asset-card-signal">${escapeHtml(assetSmartSignal(asset))}</span>
    </button>
  `;
}

function investmentPortfolioAssetCard(asset) {
  const snapshot = investmentSnapshot(asset);
  const gain = snapshot.totalReturnInr;
  const missing = missingDocsForAsset(asset);
  const completion = assetCompletion(asset);
  return `
    <button class="asset-portfolio-card investment-asset-card" type="button" data-detail="assets" data-id="${escapeAttribute(asset.id)}">
      ${investmentMarketVisual(asset, "card")}
      <span class="asset-card-main">
        <small>${escapeHtml(asset.assetSubType || asset.type || "Investment Assets")}</small>
        <strong>${escapeHtml(asset.name || asset.ticker || "Investment holding")}</strong>
        <em>${escapeHtml([asset.ticker, asset.sector, asset.owner].filter(Boolean).join(" - ") || "Add ticker, sector or owner")}</em>
      </span>
      <span class="asset-card-values investment-card-values">
        <b><small>Current</small>${money(snapshot.currentValueInr)}</b>
        <b><small>Invested</small>${money(snapshot.costBasisInr)}</b>
        <i class="${gain >= 0 ? "up" : "down"}">${gain >= 0 ? "+" : "-"} ${money(Math.abs(gain))}${snapshot.roi !== null ? ` / ${snapshot.roi}%` : ""}</i>
      </span>
      <span class="asset-card-health">
        <b>${completion}% complete</b>
        <i><em style="width:${completion}%"></em></i>
        <small>${missing.length ? `${missing.length} docs missing` : "Documents ready"}</small>
      </span>
      <span class="asset-card-signal">${isAssetValueOutdated(asset) ? "Update price" : "Market tracked"}</span>
    </button>
  `;
}

function investmentMarketVisual(asset, variant = "card") {
  const ticker = String(asset.ticker || "INV").trim().toUpperCase().slice(0, 8);
  const snapshot = investmentSnapshot(asset);
  const gain = snapshot.totalReturnInr;
  const rows = Array.isArray(asset.valueHistory) && asset.valueHistory.length
    ? asset.valueHistory.slice(-6)
    : [
        { value: snapshot.costBasisInr || snapshot.currentValueInr || 1 },
        { value: snapshot.currentValueInr || snapshot.costBasisInr || 1 }
      ];
  const values = rows.map(row => Number(row.value || 0));
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = Math.max(1, max - min);
  return `
    <span class="investment-market-visual ${variant === "detail" ? "detail" : ""}" aria-label="${escapeAttribute(ticker)} market visual">
      <span class="market-visual-head">
        <b>${escapeHtml(ticker)}</b>
        <small class="${gain >= 0 ? "up" : "down"}">${gain >= 0 ? "+" : "-"}${snapshot.roi ?? 0}%</small>
      </span>
      <span class="market-visual-grid">
        <i></i><i></i><i></i><i></i>
      </span>
      <span class="market-bars">
        ${rows.map((row, index) => {
          const height = 30 + Math.round(((Number(row.value || 0) - min) / range) * 54);
          const up = index === 0 || Number(row.value || 0) >= Number(rows[index - 1]?.value || 0);
          return `<i class="${up ? "up" : "down"}" style="height:${height}%"></i>`;
        }).join("")}
      </span>
      <span class="market-line"><i></i></span>
    </span>
  `;
}

function assetSmartSignal(asset) {
  if (missingDocsForAsset(asset).length) return "Scan papers";
  if (isAssetValueOutdated(asset)) return "Refresh value";
  if (asset.valuationBasis) return "AI estimated";
  if (Number(asset.value || 0) >= 1000000) return "High value";
  return "Tracked";
}

function renderAssetCategory(categoryKey) {
  const category = assetCategoryViews[categoryKey];
  const items = state.assets.filter(asset => assetCategoryForAsset(asset) === categoryKey);
  if (categoryKey === "investments") {
    renderInvestmentCategory(category, items);
    return;
  }
  const totalCurrent = items.reduce((sum, item) => sum + Number(item.value || 0), 0);
  const totalBought = items.reduce((sum, item) => sum + Number(item.purchasePrice || 0), 0);
  const gain = totalCurrent - totalBought;
  title.textContent = category.title;
  viewLabel.textContent = "Assets";
  actions.innerHTML = `
    <button class="secondary-action" type="button" data-asset-home>Back</button>
    <button class="primary-action" type="button" data-add="assets" data-asset-type="${escapeAttribute(category.addType)}">${escapeHtml(category.addLabel)}</button>
  `;
  grid.innerHTML = [
    metricModule("Current Value", money(totalCurrent), `${items.length} ${items.length === 1 ? "item" : "items"}`, config.assets.color),
    metricModule("Buying Price", money(totalBought), gain >= 0 ? `Gain ${money(gain)}` : `Loss ${money(Math.abs(gain))}`, "linear-gradient(135deg, #151f1c 0%, #334021 100%)")
  ].join("");
  list.innerHTML = `
    ${categoryOverview(category, items, totalCurrent, totalBought, gain)}
    ${sectionHeader(`Your ${category.title.toLowerCase()}`, items.length ? "Click to see specifications" : category.emptyText)}
    ${items.length ? categoryCards(items, category) : categoryEmptyState(category)}
  `;
}

function renderInvestmentCategory(category, items) {
  const filteredItems = filterInvestmentHoldings(items, investmentFilters);
  const sortedItems = sortedInvestmentHoldings(filteredItems, investmentSort);
  const summary = investmentPortfolioSummary(items);
  const filteredSummary = investmentPortfolioSummary(filteredItems);
  title.textContent = category.title;
  viewLabel.textContent = "Assets";
  actions.innerHTML = `
    <button class="secondary-action" type="button" data-asset-home>Back</button>
    <button class="primary-action" type="button" data-add="assets" data-asset-type="${escapeAttribute(category.addType)}">Add holding</button>
    <button class="secondary-action" type="button" data-bulk-update-investments>Update prices</button>
    <button class="secondary-action" type="button" data-import-investment-history>Import history</button>
    <button class="secondary-action" type="button" data-export-investments>Export holdings CSV</button>
    <button class="secondary-action" type="button" data-export-investment-report>Export P/L report</button>
    <button class="secondary-action" type="button" data-download-price-history-template>History template</button>
    <button class="secondary-action" type="button" data-download-investment-template>CSV template</button>
  `;
  grid.innerHTML = [
    metricModule("Portfolio Value", money(summary.currentValue), `${items.length} ${items.length === 1 ? "holding" : "holdings"} in INR`, config.assets.color),
    metricModule("Cost Basis", money(summary.costBasis), `Invested amount + fees`, "linear-gradient(135deg, #151f1c 0%, #334021 100%)"),
    metricModule("Unrealized P/L", money(summary.unrealizedGain), `${summary.roi === null ? "Add cost basis" : `${summary.roi}% total return`}`, "linear-gradient(135deg, #151f1c 0%, #334021 100%)")
  ].join("");
  list.innerHTML = `
    ${investmentOverview(summary)}
    ${investmentIntelligenceHero(items, summary)}
    ${investmentVisualScan(items, summary)}
    ${investmentConcentrationAlert(items, summary)}
    ${investmentActionQueue(items, summary)}
    ${investmentPerformancePanel(items)}
    ${investmentAllocationPanel(items, summary.currentValue)}
    ${investmentOwnerAllocation(items, summary.currentValue)}
    ${sectionHeader("Holdings", items.length ? "Ticker, value, P/L and ROI" : category.emptyText)}
    ${items.length ? investmentControlBar(items, filteredItems, filteredSummary) : ""}
    ${items.length ? (sortedItems.length ? investmentHoldingCards(sortedItems, summary.currentValue) : investmentFilterEmptyState()) : categoryEmptyState(category)}
    ${sortedItems.length ? `${sectionHeader("Holdings Table", "Sortable spreadsheet-style view")}${investmentHoldingsTable(sortedItems, summary.currentValue)}` : ""}
    ${items.length ? `${sectionHeader("P/L Statement", "Realized, unrealized and dividend return")}${investmentPlStatement(items, summary)}` : ""}
  `;
}

function investmentSignalDeck(items, summary) {
  const snapshots = items.map(item => ({ item, snap: investmentSnapshot(item) }));
  const best = snapshots
    .filter(row => row.snap.costBasisInr || row.snap.currentValueInr)
    .sort((a, b) => b.snap.totalReturnInr - a.snap.totalReturnInr)[0];
  const needsUpdate = items.filter(isAssetValueOutdated).length;
  const profitable = snapshots.filter(row => row.snap.totalReturnInr > 0).length;
  const loss = snapshots.filter(row => row.snap.totalReturnInr < 0).length;
  const sectors = new Set(items.map(item => String(item.sector || "").trim()).filter(Boolean));
  const concentration = investmentTopHoldingWeight(snapshots, summary.currentValue);
  const qualityScore = investmentQualityScore(items, summary);
  return `
    <section class="investment-signal-deck">
      <div class="signal-card hero-signal">
        <span>AI portfolio signal</span>
        <strong>${qualityScore}/100</strong>
        <p>${escapeHtml(investmentSignalText({ items, needsUpdate, sectors, concentration, loss }))}</p>
      </div>
      <div class="signal-card">
        <span>Top mover</span>
        <strong>${escapeHtml(best?.item?.ticker || best?.item?.name || "Add holding")}</strong>
        <p>${best ? `${best.snap.totalReturnInr >= 0 ? "+" : "-"} ${money(Math.abs(best.snap.totalReturnInr))}${best.snap.roi !== null ? ` / ${best.snap.roi}%` : ""}` : "No investment return yet"}</p>
      </div>
      <div class="signal-card">
        <span>Portfolio breadth</span>
        <strong>${sectors.size || 0}</strong>
        <p>${sectors.size ? `${sectors.size} sectors tracked` : "Add sectors to understand concentration"}</p>
      </div>
      <div class="signal-card">
        <span>Price freshness</span>
        <strong>${items.length ? Math.max(0, items.length - needsUpdate) : 0}/${items.length}</strong>
        <p>${needsUpdate ? `${needsUpdate} prices need update` : "All holdings look fresh"}</p>
      </div>
      <div class="signal-card">
        <span>Gain / loss split</span>
        <strong>${profitable}/${loss}</strong>
        <p>Winners vs positions currently below cost</p>
      </div>
    </section>
  `;
}

function investmentTopHoldingWeight(rows, totalValue) {
  if (!totalValue) return 0;
  const max = rows.reduce((highest, row) => Math.max(highest, row.snap.currentValueInr), 0);
  return Math.round((max / totalValue) * 100);
}

function investmentQualityScore(items, summary) {
  if (!items.length) return 0;
  const withTicker = items.filter(item => item.ticker).length / items.length;
  const withSector = items.filter(item => item.sector).length / items.length;
  const fresh = items.filter(item => !isAssetValueOutdated(item)).length / items.length;
  const docs = items.filter(item => !missingDocsForAsset(item).length).length / items.length;
  const concentration = investmentTopHoldingWeight(items.map(item => ({ item, snap: investmentSnapshot(item) })), summary.currentValue);
  const diversification = concentration ? Math.max(0, 1 - Math.max(0, concentration - 35) / 65) : 0.5;
  return Math.round(((withTicker * .22) + (withSector * .18) + (fresh * .22) + (docs * .18) + (diversification * .20)) * 100);
}

function investmentSignalText({ items, needsUpdate, sectors, concentration, loss }) {
  if (!items.length) return "Add your first stock, mutual fund, ETF or ESOP to activate portfolio intelligence.";
  if (needsUpdate) return "Update stale prices first. Accurate market value makes every return and allocation number reliable.";
  if (concentration > 55) return "One holding is dominating the portfolio. Check whether that concentration is intentional.";
  if (sectors.size < 2 && items.length > 1) return "Add sectors to each holding so the app can show real diversification.";
  if (loss > 0) return "Some holdings are below cost. Review thesis, time horizon and position size before adding more.";
  return "Portfolio data looks clean. Keep price history updated to improve trend and return signals.";
}

function investmentIntelligenceHero(items, summary) {
  const snapshots = items.map(item => ({ item, snap: investmentSnapshot(item) }));
  const needsUpdate = items.filter(isAssetValueOutdated).length;
  const sectors = new Set(items.map(item => String(item.sector || "").trim()).filter(Boolean));
  const loss = snapshots.filter(row => row.snap.totalReturnInr < 0).length;
  const concentration = investmentTopHoldingWeight(snapshots, summary.currentValue);
  const docsPercent = investmentReadinessPercent(items, item => !missingDocsForAsset(item).length);
  const qualityScore = investmentQualityScore(items, summary);
  const risk = investmentMainRisk(items, summary, { needsUpdate, sectors, concentration, loss, docsPercent });
  return `
    <section class="investment-intelligence-hero">
      <div class="intelligence-ring" style="--score:${qualityScore}">
        <strong>${qualityScore}%</strong>
      </div>
      <div>
        <span>Asset intelligence</span>
        <strong>${escapeHtml(risk.title)}</strong>
        <p>${escapeHtml(risk.copy)}</p>
      </div>
      <div class="intelligence-mini-stack">
        <b><small>Holdings</small>${items.length}</b>
        <b><small>Fresh prices</small>${items.length ? `${Math.max(0, items.length - needsUpdate)}/${items.length}` : "0/0"}</b>
        <b><small>Documents</small>${docsPercent}%</b>
      </div>
    </section>
  `;
}

function investmentMainRisk(items, summary, { needsUpdate, sectors, concentration, loss, docsPercent }) {
  if (!items.length) return {
    title: "Start portfolio intelligence",
    copy: "Add one holding with ticker, price, quantity and owner to activate investment scans."
  };
  if (needsUpdate) return {
    title: "Price freshness risk",
    copy: `${needsUpdate} holding ${needsUpdate === 1 ? "price is" : "prices are"} stale. Update prices to keep net worth and returns accurate.`
  };
  if (concentration > 55) return {
    title: "Concentration risk",
    copy: `One holding is ${concentration}% of the investment portfolio. Review whether that exposure is intentional.`
  };
  if (docsPercent < 70) return {
    title: "Document risk",
    copy: `${100 - docsPercent}% of investment document readiness is missing or incomplete.`
  };
  if (sectors.size < 2 && items.length > 1) return {
    title: "Diversification blind spot",
    copy: "Add sectors to holdings so the app can reveal concentration and portfolio breadth."
  };
  if (loss > 0 || summary.totalReturn < 0) return {
    title: "Return pressure",
    copy: "Some holdings are below cost. Review thesis, time horizon and position size."
  };
  return {
    title: "Portfolio looks healthy",
    copy: "Prices, documents and allocation signals are in good shape. Keep value history updated."
  };
}

function investmentVisualScan(items, summary) {
  return `
    <section class="investment-visual-scan">
      ${investmentAllocationMap(items, summary)}
      ${investmentReadinessScan(items, summary)}
    </section>
  `;
}

function investmentAllocationMap(items, summary) {
  const rows = investmentAllocationRows(items, summary.currentValue, item => item.assetSubType || "Investment").slice(0, 6);
  if (!rows.length) return `
    <div class="investment-map-card">
      <span>Allocation map</span>
      <strong>Where your investments sit</strong>
      <p>Add holdings to see stocks, mutual funds, ETFs and ESOPs by value.</p>
    </div>
  `;
  return `
    <div class="investment-map-card">
      <span>Allocation map</span>
      <strong>Where your investments sit</strong>
      <div class="investment-map-rows">
        ${rows.map(row => `
          <div>
            <b>${escapeHtml(row.label)}</b>
            <i><em style="width:${Math.max(4, row.percent)}%"></em></i>
            <strong>${money(row.value)}</strong>
          </div>
        `).join("")}
      </div>
    </div>
  `;
}

function investmentReadinessScan(items, summary) {
  const rings = [
    ["Docs", investmentReadinessPercent(items, item => !missingDocsForAsset(item).length)],
    ["Values", investmentReadinessPercent(items, item => !isAssetValueOutdated(item) && Number(item.currentPrice || item.value || 0) > 0)],
    ["Spread", investmentDiversificationPercent(items, summary)]
  ];
  return `
    <div class="investment-readiness-card">
      <span>Readiness scan</span>
      <div class="readiness-rings">
        ${rings.map(([label, value]) => `
          <b class="readiness-ring" style="--score:${value}">
            <strong>${value}%</strong>
            <small>${escapeHtml(label)}</small>
          </b>
        `).join("")}
      </div>
    </div>
  `;
}

function investmentReadinessPercent(items, predicate) {
  if (!items.length) return 0;
  return Math.round((items.filter(predicate).length / items.length) * 100);
}

function investmentDiversificationPercent(items, summary) {
  if (!items.length) return 0;
  const sectors = new Set(items.map(item => String(item.sector || "").trim()).filter(Boolean));
  const concentration = investmentTopHoldingWeight(items.map(item => ({ item, snap: investmentSnapshot(item) })), summary.currentValue);
  const sectorScore = Math.min(100, sectors.size * 25);
  const concentrationScore = concentration ? Math.max(0, 100 - Math.max(0, concentration - 35)) : 50;
  return Math.round((sectorScore * .55) + (concentrationScore * .45));
}

function investmentConcentrationAlert(items, summary) {
  const top = items.map(item => ({ item, snap: investmentSnapshot(item) }))
    .sort((a, b) => b.snap.currentValueInr - a.snap.currentValueInr)[0];
  const percent = top && summary.currentValue ? Math.round((top.snap.currentValueInr / summary.currentValue) * 100) : 0;
  if (!top || percent < 45) return "";
  return `
    <section class="investment-concentration-alert">
      <span>Concentration alert</span>
      <strong>${escapeHtml(top.item.ticker || top.item.name || "Top holding")} is ${percent}% of this portfolio.</strong>
      <p>Useful if intentional. Risky if accidental. Review position size, sector exposure and time horizon.</p>
    </section>
  `;
}

function investmentActionQueue(items, summary) {
  const actionsList = investmentNextActions(items, summary).slice(0, 4);
  if (!actionsList.length) return "";
  return `
    <section class="investment-action-queue">
      <div>
        <span>Fix next</span>
        <strong>Investment action queue</strong>
      </div>
      ${actionsList.map((item, index) => `
        <button type="button" ${item.assetId ? `data-detail="assets" data-id="${escapeAttribute(item.assetId)}"` : `data-add="assets" data-asset-type="Investment Assets"`}>
          <b>${index + 1}</b>
          <span><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(item.copy)}</small></span>
        </button>
      `).join("")}
    </section>
  `;
}

function investmentNextActions(items, summary) {
  const rows = items.map(item => ({ item, snap: investmentSnapshot(item), missing: missingDocsForAsset(item) }));
  const actionsList = [];
  rows.filter(row => isAssetValueOutdated(row.item)).forEach(row => actionsList.push({
    title: `Update ${row.item.ticker || row.item.name} price`,
    copy: "Refresh current value for accurate net worth.",
    assetId: row.item.id
  }));
  rows.filter(row => row.missing.length).forEach(row => actionsList.push({
    title: `Upload ${row.missing[0]} for ${row.item.ticker || row.item.name}`,
    copy: `${row.missing.length} investment document ${row.missing.length === 1 ? "gap" : "gaps"} still open.`,
    assetId: row.item.id
  }));
  rows.filter(row => !row.item.sector).forEach(row => actionsList.push({
    title: `Add sector to ${row.item.ticker || row.item.name}`,
    copy: "This improves allocation and concentration scans.",
    assetId: row.item.id
  }));
  if (!items.length) actionsList.push({
    title: "Add your first holding",
    copy: "Start with ticker, quantity, buy price and current price."
  });
  if (items.length && investmentTopHoldingWeight(rows, summary.currentValue) > 55) {
    const top = rows.sort((a, b) => b.snap.currentValueInr - a.snap.currentValueInr)[0];
    actionsList.push({
      title: `Review ${top.item.ticker || top.item.name} concentration`,
      copy: "This holding dominates portfolio value.",
      assetId: top.item.id
    });
  }
  return actionsList;
}

function filterInvestmentHoldings(items, filters = investmentFilters) {
  return items.filter(item => {
    const owner = String(item.owner || "Unassigned").trim() || "Unassigned";
    const type = String(item.assetSubType || "Investment").trim() || "Investment";
    const sector = String(item.sector || "Unassigned sector").trim() || "Unassigned sector";
    if (filters.owner && filters.owner !== "all" && owner !== filters.owner) return false;
    if (filters.type && filters.type !== "all" && type !== filters.type) return false;
    if (filters.sector && filters.sector !== "all" && sector !== filters.sector) return false;
    return true;
  });
}

function sortedInvestmentHoldings(items, sortKey = "value") {
  const rows = [...items];
  const compareText = (a, b) => String(a || "").localeCompare(String(b || ""));
  return rows.sort((a, b) => {
    const snapA = investmentSnapshot(a);
    const snapB = investmentSnapshot(b);
    if (sortKey === "return") return snapB.totalReturnInr - snapA.totalReturnInr;
    if (sortKey === "roi") return (snapB.roi ?? -Infinity) - (snapA.roi ?? -Infinity);
    if (sortKey === "ticker") return compareText(a.ticker || a.name, b.ticker || b.name);
    if (sortKey === "owner") return compareText(a.owner || "", b.owner || "") || compareText(a.ticker || a.name, b.ticker || b.name);
    if (sortKey === "newest") return String(b.lastUpdated || b.purchaseDate || "").localeCompare(String(a.lastUpdated || a.purchaseDate || ""));
    return snapB.currentValueInr - snapA.currentValueInr;
  });
}

function investmentControlBar(items, filteredItems, filteredSummary) {
  return `
    <div class="investment-control-panel">
      <div class="investment-filter-summary">
        <span>${filteredItems.length} of ${items.length} holdings</span>
        <strong>${money(filteredSummary.currentValue)}</strong>
        <small>${filteredSummary.roi === null ? "Add cost basis" : `${filteredSummary.roi}% return`} in selected view</small>
      </div>
      ${investmentFilterControls(items)}
      ${investmentSortToolbar()}
    </div>
  `;
}

function investmentFilterControls(items) {
  return `
    <div class="investment-filter-controls" aria-label="Filter investment holdings">
      ${investmentFilterSelect("owner", "Owner", investmentFilterOptions(items, item => item.owner || "Unassigned"))}
      ${investmentFilterSelect("type", "Type", investmentFilterOptions(items, item => item.assetSubType || "Investment"))}
      ${investmentFilterSelect("sector", "Sector", investmentFilterOptions(items, item => item.sector || "Unassigned sector"))}
      ${hasActiveInvestmentFilter() ? `<button type="button" data-investment-filter-reset>Clear</button>` : ""}
    </div>
  `;
}

function investmentFilterOptions(items, keyFn) {
  return [...new Set(items.map(item => String(keyFn(item) || "").trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b));
}

function investmentFilterSelect(filterKey, label, options) {
  const selected = investmentFilters[filterKey] || "all";
  return `
    <label>
      <span>${escapeHtml(label)}</span>
      <select data-investment-filter="${escapeAttribute(filterKey)}">
        <option value="all">All</option>
        ${options.map(option => `<option value="${escapeAttribute(option)}" ${selected === option ? "selected" : ""}>${escapeHtml(option)}</option>`).join("")}
      </select>
    </label>
  `;
}

function hasActiveInvestmentFilter(filters = investmentFilters) {
  return Object.values(filters).some(value => value && value !== "all");
}

function investmentFilterEmptyState() {
  return `<div class="empty-state">No holdings match these filters. Clear filters or choose a different owner, type, or sector.</div>`;
}

function investmentSortToolbar() {
  const sorts = [
    ["value", "Value"],
    ["return", "Return"],
    ["roi", "ROI"],
    ["ticker", "Ticker"],
    ["owner", "Owner"],
    ["newest", "Newest"]
  ];
  return `
    <div class="investment-sort-toolbar" aria-label="Sort investment holdings">
      <span>Sort holdings</span>
      ${sorts.map(([key, label]) => `
        <button class="${investmentSort === key ? "active" : ""}" type="button" data-investment-sort="${key}">
          ${escapeHtml(label)}
        </button>
      `).join("")}
    </div>
  `;
}

function investmentPortfolioSummary(items) {
  const snapshots = items.map(investmentSnapshot);
  const costBasis = snapshots.reduce((sum, item) => sum + item.costBasisInr, 0);
  const currentValue = snapshots.reduce((sum, item) => sum + item.currentValueInr, 0);
  const dividends = snapshots.reduce((sum, item) => sum + item.dividendsInr, 0);
  const realizedGain = snapshots.reduce((sum, item) => sum + item.realizedGainInr, 0);
  const unrealizedGain = currentValue - costBasis;
  const totalReturn = unrealizedGain + realizedGain + dividends;
  const roi = costBasis ? Math.round((totalReturn / costBasis) * 1000) / 10 : null;
  return { costBasis, currentValue, dividends, realizedGain, unrealizedGain, totalReturn, roi };
}

function investmentPortfolioPeriodChange(items, today = new Date()) {
  const points = investmentPortfolioHistory(items, "ALL", today);
  if (points.length < 2) return null;
  const latest = points[points.length - 1];
  const monthStart = investmentHistoryRangeStart("1M", today);
  const previous = points
    .slice(0, -1)
    .filter(point => point.date <= monthStart)
    .pop() || points[points.length - 2];
  const base = Number(previous?.value || 0);
  if (!base) return null;
  const change = Number(latest.value || 0) - base;
  return {
    amount: roundRupees(change),
    percent: Math.round((change / base) * 1000) / 10,
    fromDate: previous.date,
    toDate: latest.date
  };
}

function investmentOverview(summary) {
  const isGain = summary.totalReturn >= 0;
  const monthlyChange = investmentPortfolioPeriodChange(state.assets.filter(isInvestmentAsset));
  const monthlyPositive = !monthlyChange || monthlyChange.amount >= 0;
  return `
    <section class="investment-overview">
      <div class="investment-overview-copy">
        <span>Investment cockpit</span>
        <strong>${money(summary.currentValue)}</strong>
        <p>${monthlyChange ? `${monthlyPositive ? "+" : "-"}${Math.abs(monthlyChange.percent)}% vs last month` : "Add one more price update to compare vs last month"}</p>
        ${investmentFloatingMetricStack(summary, monthlyChange)}
      </div>
      ${investmentFloatingObjects(summary)}
      <div class="investment-overview-grid">
        <b><small>Net Worth</small>${money(summary.currentValue)}<em>${monthlyChange ? `${monthlyPositive ? "+" : "-"}${Math.abs(monthlyChange.percent)}%` : "History needed"}</em><i>vs last month</i></b>
        <b><small>Cost Basis</small>${money(summary.costBasis)}<em>Invested</em><i>including fees</i></b>
        <b class="${isGain ? "up" : "down"}"><small>Total Return</small>${isGain ? "+" : "-"} ${money(Math.abs(summary.totalReturn))}<em>${summary.roi === null ? "Add cost" : `${summary.roi}%`}</em><i>overall ROI</i></b>
        <b><small>Cash Returns</small>${money(summary.realizedGain + summary.dividends)}<em>Realized</em><i>sells + dividends</i></b>
      </div>
    </section>
  `;
}

function investmentFloatingMetricStack(summary, monthlyChange) {
  const monthlyPositive = !monthlyChange || monthlyChange.amount >= 0;
  const cashReturns = summary.realizedGain + summary.dividends;
  const cards = [
    ["Cash", money(cashReturns), cashReturns ? "realized + dividends" : "No realized cash yet", ""],
    ["Net Worth", money(summary.currentValue), monthlyChange ? `${monthlyPositive ? "+" : "-"}${Math.abs(monthlyChange.percent)}%` : "History needed", "vs last month"],
    ["Invested", money(summary.costBasis), summary.roi === null ? "Add cost" : `${summary.roi}% ROI`, "cost basis"]
  ];
  return `
    <div class="floating-metric-stack" aria-label="Investment floating metric cards">
      ${cards.map(([label, value, signal, note], index) => `
        <span class="floating-metric-card card-${index + 1}">
          <small>${escapeHtml(label)}</small>
          <strong>${escapeHtml(value)}</strong>
          <em>${escapeHtml(signal)}</em>
          ${note ? `<i>${escapeHtml(note)}</i>` : ""}
        </span>
      `).join("")}
    </div>
  `;
}

function investmentFloatingObjects(summary) {
  const categoryValue = key => {
    const category = assetCategoryViews[key];
    if (!category) return 0;
    return state.assets.filter(category.matcher).reduce((sum, item) => sum + Number(item.value || 0), 0);
  };
  const objects = [
    ["house", "House model", money(categoryValue("flats") + categoryValue("land"))],
    ["car", "Car model", money(categoryValue("vehicles"))],
    ["gold", "Gold bar", money(categoryValue("funds"))],
    ["stock", "Stock chart", money(summary.currentValue)]
  ];
  return `
    <div class="investment-object-cloud" aria-label="Floating investment assets">
      ${investmentParticleNetwork()}
      <span class="object-line line-a"></span>
      <span class="object-line line-b"></span>
      <span class="object-line line-c"></span>
      ${objects.map(([type, label, value]) => `
        <span class="floating-object ${escapeAttribute(type)}">
          <i></i>
          <b>${escapeHtml(label)}</b>
          <small>${escapeHtml(value)}</small>
        </span>
      `).join("")}
    </div>
  `;
}

function investmentParticleNetwork() {
  const dots = [
    [18, 22], [36, 14], [62, 20], [80, 34], [70, 62], [46, 72], [24, 58]
  ];
  return `
    <span class="particle-network" aria-hidden="true">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none">
        <polyline points="${dots.map(([x, y]) => `${x},${y}`).join(" ")}" />
        <line x1="${dots[1][0]}" y1="${dots[1][1]}" x2="${dots[5][0]}" y2="${dots[5][1]}" />
        <line x1="${dots[2][0]}" y1="${dots[2][1]}" x2="${dots[6][0]}" y2="${dots[6][1]}" />
      </svg>
      ${dots.map(([x, y], index) => `<i style="left:${x}%; top:${y}%; animation-delay:${index * .22}s"></i>`).join("")}
    </span>
  `;
}

function investmentPerformancePanel(items) {
  const points = investmentPortfolioHistory(items, investmentHistoryRange);
  const allPoints = investmentPortfolioHistory(items, "ALL");
  if (!points.length) {
    return `
      <section class="investment-performance-panel">
        <div>
          <span>Portfolio value over time</span>
          <strong>No price history yet</strong>
          <p>${allPoints.length ? "No points in this range. Try YTD or ALL." : "Use Update Value on holdings to build a manual performance trail."}</p>
          ${investmentHistoryRangeControls()}
        </div>
      </section>
    `;
  }
  const values = points.map(point => point.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = Math.max(1, max - min);
  const linePoints = points.map((point, index) => {
    const x = points.length === 1 ? 50 : Math.round((index / (points.length - 1)) * 100);
    const y = 88 - Math.round(((point.value - min) / range) * 70);
    return `${x},${y}`;
  }).join(" ");
  return `
    <section class="investment-performance-panel">
      <div>
        <span>Portfolio value over time</span>
        <strong>${money(points[points.length - 1].value)}</strong>
        <p>${points[0].date} to ${points[points.length - 1].date}</p>
        ${investmentHistoryRangeControls()}
      </div>
      <div class="investment-performance-chart" aria-label="Investment portfolio value history">
        <svg class="investment-live-line" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          <polyline points="${escapeAttribute(linePoints || "0,84 100,84")}" />
        </svg>
        ${points.map(point => {
          const height = 18 + Math.round(((point.value - min) / range) * 72);
          return `<i style="height:${height}%"><b>${escapeHtml(point.date)}</b><small>${money(point.value)}</small></i>`;
        }).join("")}
      </div>
    </section>
  `;
}

function investmentHistoryRangeControls() {
  const ranges = [
    ["1M", "1M"],
    ["YTD", "YTD"],
    ["ALL", "ALL"]
  ];
  return `
    <div class="investment-range-toggle" aria-label="Investment history range">
      ${ranges.map(([key, label]) => `
        <button class="${investmentHistoryRange === key ? "active" : ""}" type="button" data-investment-history-range="${key}">
          ${label}
        </button>
      `).join("")}
    </div>
  `;
}

function investmentPortfolioHistory(items, rangeKey = "ALL", today = new Date()) {
  const byDate = {};
  items.forEach(item => {
    const snap = investmentSnapshot(item);
    const rows = Array.isArray(item.valueHistory) && item.valueHistory.length
      ? item.valueHistory
      : [{ date: item.lastUpdated || new Date().toISOString().slice(0, 10), value: snap.currentValue }];
    rows.forEach(row => {
      const date = row.date || item.lastUpdated || "";
      if (!date) return;
      byDate[date] = (byDate[date] || 0) + Number(row.value || 0);
    });
  });
  const rangeStart = investmentHistoryRangeStart(rangeKey, today);
  return Object.entries(byDate)
    .map(([date, value]) => ({ date, value: roundRupees(value) }))
    .filter(point => !rangeStart || point.date >= rangeStart)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-12);
}

function investmentHistoryRangeStart(rangeKey = "ALL", today = new Date()) {
  const current = today instanceof Date ? today : new Date(today);
  if (Number.isNaN(current.getTime())) return "";
  const yyyy = current.getFullYear();
  const mm = String(current.getMonth() + 1).padStart(2, "0");
  const dd = String(current.getDate()).padStart(2, "0");
  if (rangeKey === "YTD") return `${yyyy}-01-01`;
  if (rangeKey === "1M") {
    const monthAgo = new Date(Date.UTC(current.getFullYear(), current.getMonth(), current.getDate()));
    monthAgo.setUTCMonth(monthAgo.getUTCMonth() - 1);
    return monthAgo.toISOString().slice(0, 10);
  }
  if (rangeKey === "TODAY") return `${yyyy}-${mm}-${dd}`;
  return "";
}

function investmentAllocationPanel(items, totalValue) {
  if (!items.length) return "";
  const byType = investmentAllocationRows(items, totalValue, item => item.assetSubType || "Investment");
  const bySector = investmentAllocationRows(items, totalValue, item => item.sector || "Unassigned sector");
  return `
    <section class="investment-allocation-panel">
      <div class="asset-map-head">
        <span>Portfolio allocation</span>
        <strong>Value split in INR</strong>
      </div>
      <div class="investment-allocation-grid">
        ${investmentAllocationGroup("By asset type", byType)}
        ${investmentAllocationGroup("By sector", bySector)}
      </div>
    </section>
  `;
}

function investmentAllocationRows(items, totalValue, keyFn) {
  return Object.entries(items.reduce((acc, item) => {
    const key = keyFn(item);
    const snap = investmentSnapshot(item);
    acc[key] = acc[key] || { value: 0, return: 0, count: 0 };
    acc[key].value += snap.currentValueInr;
    acc[key].return += snap.totalReturnInr;
    acc[key].count += 1;
    return acc;
  }, {})).map(([label, row]) => ({
    label,
    value: roundRupees(row.value),
    return: roundRupees(row.return),
    count: row.count,
    percent: totalValue ? Math.round((row.value / totalValue) * 100) : 0
  })).sort((a, b) => b.value - a.value);
}

function investmentAllocationGroup(titleText, rows) {
  return `
    <div class="investment-allocation-group">
      <strong>${escapeHtml(titleText)}</strong>
      ${rows.map(row => `
        <div class="investment-owner-row">
          <span><b>${escapeHtml(row.label)}</b><small>${row.count} ${row.count === 1 ? "holding" : "holdings"}</small></span>
          <i><em style="width:${Math.max(3, row.percent)}%"></em></i>
          <strong>${money(row.value)}</strong>
          <small>${row.percent}% / ${row.return >= 0 ? "+" : "-"} ${money(Math.abs(row.return))}</small>
        </div>
      `).join("")}
    </div>
  `;
}

function investmentOwnerAllocation(items, totalValue) {
  const rows = Object.entries(items.reduce((acc, item) => {
    const owner = item.owner || "Unassigned";
    const snap = investmentSnapshot(item);
    acc[owner] = acc[owner] || { value: 0, cost: 0, return: 0, count: 0 };
    acc[owner].value += snap.currentValueInr;
    acc[owner].cost += snap.costBasisInr;
    acc[owner].return += snap.totalReturnInr;
    acc[owner].count += 1;
    return acc;
  }, {})).sort((a, b) => b[1].value - a[1].value);
  if (!rows.length) return "";
  return `
    <section class="investment-owner-panel">
      <div class="asset-map-head">
        <span>Household allocation</span>
        <strong>Grouped by owner</strong>
      </div>
      ${rows.map(([owner, row]) => {
        const percent = totalValue ? Math.round((row.value / totalValue) * 100) : 0;
        return `
          <div class="investment-owner-row">
            <span><b>${escapeHtml(owner)}</b><small>${row.count} ${row.count === 1 ? "holding" : "holdings"}</small></span>
            <i><em style="width:${Math.max(3, percent)}%"></em></i>
            <strong>${money(row.value)}</strong>
            <small>${percent}% / ${row.return >= 0 ? "+" : "-"} ${money(Math.abs(row.return))}</small>
          </div>
        `;
      }).join("")}
    </section>
  `;
}

function investmentHoldingCards(items, totalValue) {
  return `<div class="investment-holdings-grid">${items.map(item => investmentHoldingCard(item, totalValue)).join("")}</div>`;
}

function investmentHoldingCard(item, totalValue) {
  const snapshot = investmentSnapshot(item);
  const gain = snapshot.totalReturnInr;
  const weight = totalValue ? Math.round((snapshot.currentValueInr / totalValue) * 100) : 0;
  return `
    <article class="investment-holding-card" data-detail="assets" data-id="${escapeAttribute(item.id)}" tabindex="0">
      <span class="investment-symbol">${escapeHtml(item.ticker || "INV")}</span>
      <span class="investment-main">
        <strong>${escapeHtml(item.name || item.ticker || "Investment")}</strong>
        <small>${escapeHtml([item.assetSubType || "Stock", item.sector, item.owner, item.location].filter(Boolean).join(" - "))}</small>
        ${item.tags ? `<small>${escapeHtml(item.tags)}</small>` : ""}
        ${investmentHoldingBadges(item, snapshot, totalValue)}
      </span>
      <span class="investment-values">
        <b><small>Current value</small>${money(snapshot.currentValueInr)}</b>
        <b><small>Cost basis</small>${money(snapshot.costBasisInr)}</b>
        <i class="${gain >= 0 ? "up" : "down"}">${gain >= 0 ? "+" : "-"} ${money(Math.abs(gain))}${snapshot.roi !== null ? ` / ${snapshot.roi}%` : ""}</i>
      </span>
      <span class="investment-quantity">
        <b>${snapshot.quantity}</b>
        <small>${money(snapshot.currentPrice)} per unit</small>
      </span>
      <span class="investment-weight">
        <small>${weight}% of portfolio</small>
        <i><em style="width:${Math.max(3, weight)}%"></em></i>
      </span>
      <span class="investment-card-actions">
        <button type="button" data-update-value="${escapeAttribute(item.id)}">Update price</button>
        <button type="button" data-detail="assets" data-id="${escapeAttribute(item.id)}">Details</button>
      </span>
      ${investmentSparkline(item)}
    </article>
  `;
}

function investmentHoldingBadges(item, snapshot, totalValue) {
  const badges = [];
  const weight = totalValue ? Math.round((snapshot.currentValueInr / totalValue) * 100) : 0;
  if (!isAssetValueOutdated(item)) badges.push(["Fresh price", "good"]);
  else badges.push(["Update price", "warn"]);
  if (missingDocsForAsset(item).length) badges.push(["Docs missing", "warn"]);
  else badges.push(["Docs ready", "good"]);
  if (weight >= 45) badges.push(["High weight", "warn"]);
  if (snapshot.totalReturnInr > 0) badges.push(["Profitable", "good"]);
  if (!item.sector) badges.push(["Needs sector", "warn"]);
  return `<span class="investment-badges">${badges.slice(0, 4).map(([label, tone]) => `<em class="${tone}">${escapeHtml(label)}</em>`).join("")}</span>`;
}

function investmentSparkline(item) {
  const rows = Array.isArray(item.valueHistory) && item.valueHistory.length
    ? item.valueHistory.slice(-8)
    : [{ value: investmentSnapshot(item).currentValue, date: item.lastUpdated || "" }];
  const values = rows.map(row => Number(row.value || 0));
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = Math.max(1, max - min);
  return `
    <span class="investment-sparkline">
      ${rows.map(row => {
        const height = 22 + Math.round(((Number(row.value || 0) - min) / range) * 58);
        return `<i style="height:${height}%"></i>`;
      }).join("")}
    </span>
  `;
}

function investmentHoldingsTable(items, totalValue) {
  return `
    <div class="investment-table-wrap">
      <table class="investment-table">
        <thead>
          <tr>
            <th>Ticker</th>
            <th>Owner</th>
            <th>Sector</th>
            <th>Qty</th>
            <th>Avg Buy</th>
            <th>Current</th>
            <th>Value</th>
            <th>P/L</th>
            <th>ROI</th>
            <th>Weight</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          ${items.map(item => {
            const snapshot = investmentSnapshot(item);
            const weight = totalValue ? Math.round((snapshot.currentValueInr / totalValue) * 100) : 0;
            return `
              <tr data-detail="assets" data-id="${escapeAttribute(item.id)}">
                <td><b>${escapeHtml(item.ticker || "-")}</b><small>${escapeHtml(item.name || "")}</small></td>
                <td>${escapeHtml(item.owner || "-")}</td>
                <td>${escapeHtml(item.sector || "-")}</td>
                <td>${escapeHtml(String(snapshot.quantity || 0))}</td>
                <td>${money(snapshot.averageBuyPrice)}</td>
                <td>${money(snapshot.currentPrice)}</td>
                <td>${money(snapshot.currentValueInr)}</td>
                <td class="${snapshot.totalReturnInr >= 0 ? "up" : "down"}">${snapshot.totalReturnInr >= 0 ? "+" : "-"} ${money(Math.abs(snapshot.totalReturnInr))}</td>
                <td>${snapshot.roi === null ? "-" : `${snapshot.roi}%`}</td>
                <td>${weight}%</td>
                <td><button class="investment-table-action" type="button" data-update-value="${escapeAttribute(item.id)}">Update price</button></td>
              </tr>
            `;
          }).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function investmentPlStatement(items, summary) {
  const byType = items.reduce((acc, item) => {
    const key = item.assetSubType || "Investment";
    const snap = investmentSnapshot(item);
    acc[key] = acc[key] || { costBasis: 0, currentValue: 0, dividends: 0, totalReturn: 0 };
    acc[key].costBasis += snap.costBasisInr;
    acc[key].currentValue += snap.currentValueInr;
    acc[key].dividends += snap.dividendsInr;
    acc[key].totalReturn += snap.totalReturnInr;
    return acc;
  }, {});
  return `
    <div class="investment-pl-card">
      <div class="investment-pl-total">
        <span>Total return</span>
        <strong>${summary.totalReturn >= 0 ? "+" : "-"} ${money(Math.abs(summary.totalReturn))}</strong>
        <small>${summary.roi === null ? "Add cost basis" : `${summary.roi}% ROI`} including ${money(summary.realizedGain)} realized and ${money(summary.dividends)} dividends</small>
      </div>
      <div class="investment-pl-rows">
        ${Object.entries(byType).map(([type, row]) => `
          <div>
            <span>${escapeHtml(type)}</span>
            <b>${money(row.currentValue)}</b>
            <small>${row.totalReturn >= 0 ? "+" : "-"} ${money(Math.abs(row.totalReturn))} return</small>
          </div>
        `).join("")}
      </div>
    </div>
  `;
}

function categoryOverview(category, items, totalCurrent, totalBought, gain) {
  return `
    <section class="category-overview">
      <div class="category-overview-copy">
        <span>${escapeHtml(category.title)} vault</span>
        <strong>${escapeHtml(items.length ? `${items.length} saved ${items.length === 1 ? "item" : "items"}` : category.emptyTitle)}</strong>
        <p>${escapeHtml(category.emptyText)}</p>
      </div>
      <img src="${escapeAttribute(category.fallback)}" alt="${escapeAttribute(category.title)} preview">
      <div class="category-overview-stats">
        <b><small>Current</small>${money(totalCurrent)}</b>
        <b><small>Bought</small>${money(totalBought)}</b>
        <b class="${gain >= 0 ? "up" : "down"}"><small>Change</small>${totalBought ? `${gain >= 0 ? "+" : "-"} ${money(Math.abs(gain))}` : "Not added"}</b>
      </div>
    </section>
  `;
}

function categoryEmptyState(category) {
  return `
    <div class="vehicle-empty">
      <img src="${escapeAttribute(category.fallback)}" alt="${escapeAttribute(category.title)} preview">
      <div>
        <span>${escapeHtml(category.title)} vault</span>
        <strong>${escapeHtml(category.emptyTitle)}</strong>
        <p>${escapeHtml(category.emptyText)}</p>
        <button class="primary-action" type="button" data-add="assets" data-asset-type="${escapeAttribute(category.addType)}">${escapeHtml(category.addLabel)}</button>
      </div>
    </div>
  `;
}

function categoryCards(items, category) {
  return `<div class="vehicle-grid">${items.map(item => categoryCard(item, category)).join("")}</div>`;
}

function categoryCard(item, category) {
  const current = Number(item.value || 0);
  const bought = Number(item.purchasePrice || 0);
  const gain = current - bought;
  const image = item.photoId ? fileViewUrl(item.photoId) : category.fallback;
  const specs = category.specs(item);
  return `
    <button class="vehicle-card" type="button" data-detail="assets" data-id="${escapeAttribute(item.id)}">
      <span class="vehicle-photo">
        <img src="${escapeAttribute(image)}" alt="${escapeAttribute(item.name || category.title)}">
      </span>
      <span class="vehicle-info">
        <small>${escapeHtml(item.type || category.title)}</small>
        <strong>${escapeHtml(item.name || item.model || category.title)}</strong>
        <em>${escapeHtml(specs.length ? specs.join(" - ") : "Add important specifications")}</em>
      </span>
      <span class="vehicle-value-box">
        <small>Current Value</small>
        <strong>${money(current)}</strong>
        <b class="${gain >= 0 ? "up" : "down"}">${bought ? `${gain >= 0 ? "+" : "-"} ${money(Math.abs(gain))}` : "Buying price missing"}</b>
      </span>
      <span class="vehicle-price-strip">
        <b>Bought ${money(bought)}</b>
        <b>Now ${money(current)}</b>
      </span>
    </button>
  `;
}

function renderAssetDetail(assetId) {
  const asset = state.assets.find(item => item.id === assetId);
  if (!asset) {
    renderView("assets");
    return;
  }
  activeView = "assets";
  title.textContent = asset.name || "Asset Detail";
  viewLabel.textContent = asset.type || "Asset";
  actions.innerHTML = `
    <button class="secondary-action" type="button" data-view-shortcut="assets">Back</button>
    <button class="primary-action" type="button" data-edit="assets" data-id="${escapeAttribute(asset.id)}">Edit Asset</button>
    <button class="secondary-action" type="button" data-update-value="${escapeAttribute(asset.id)}">Update Value</button>
    <button class="secondary-action" type="button" data-reestimate-value="${escapeAttribute(asset.id)}">Estimate Value</button>
    ${isWatchAsset(asset) ? `<button class="secondary-action" type="button" data-fetch-watch-value="${escapeAttribute(asset.id)}">Fetch Market</button>` : ""}
    <button class="secondary-action" type="button" data-add="documents" data-prefill-linked="${escapeAttribute(asset.name)}">Add Document</button>
    <button class="secondary-action" type="button" data-add="alerts" data-prefill-name="Review ${escapeAttribute(asset.name)}" data-prefill-linked="${escapeAttribute(asset.name)}">Add Reminder</button>
    <button class="secondary-action danger-utility" type="button" data-delete-asset="${escapeAttribute(asset.id)}">Delete Asset</button>
  `;
  const gain = Number(asset.value || 0) - Number(asset.purchasePrice || 0);
  grid.innerHTML = [
    metricModule("Current Value", money(asset.value), asset.source || "Manual value", config.assets.color),
    metricModule("Purchase Value", money(asset.purchasePrice), asset.acquisitionDate || "No date added", "linear-gradient(135deg, #11231f 0%, #1f6f65 100%)"),
    metricModule("Gain / Loss", money(gain), gain >= 0 ? "Estimated gain" : "Estimated loss", "linear-gradient(135deg, #11231f 0%, #1f6f65 100%)"),
    metricModule("Documents", linkedDocuments(asset).length, "Linked to this asset", "linear-gradient(135deg, #11231f 0%, #1f6f65 100%)")
  ].join("");
  const categoryKey = assetCategoryForAsset(asset);
  list.innerHTML = `
    ${categoryKey && !isInvestmentAsset(asset) ? categoryDetailHero(asset, assetCategoryViews[categoryKey]) : ""}
    ${isWatchAsset(asset) ? watchMarketDashboard(asset) : ""}
    ${isVehicleAsset(asset) ? vehicleAppraisalWorkflow(asset) : ""}
    ${isVehicleAsset(asset) ? vehicleFinanceDashboard(asset) : ""}
    ${isInvestmentAsset(asset) ? investmentDetailDashboard(asset) : ""}
    ${assetProfileSummary(asset)}
    ${isInvestmentAsset(asset) ? investmentMiniTimeline(asset) : ""}
    ${!isInvestmentAsset(asset) ? assetMiniTimeline(asset) : ""}
    ${asset.photoId && !categoryKey ? `
      <button class="asset-photo" type="button" data-preview-file="${escapeAttribute(asset.photoId)}" data-file-name="${escapeAttribute(asset.photoName || asset.name)}">
        <img src="${escapeAttribute(fileViewUrl(asset.photoId))}" alt="${escapeAttribute(asset.name)}">
      </button>
    ` : ""}
    <div class="asset-detail-card">
      <div><span>Type</span><strong>${escapeHtml(asset.type || "Asset")}</strong></div>
      <div><span>Owner</span><strong>${escapeHtml(asset.owner || "Not added")}</strong></div>
      <div><span>Location / Account</span><strong>${escapeHtml(asset.location || "Not added")}</strong></div>
      <div><span>Last Updated</span><strong>${escapeHtml(asset.lastUpdated || "Not added")}</strong></div>
      ${asset.brand ? `<div><span>Brand</span><strong>${escapeHtml(asset.brand)}</strong></div>` : ""}
      ${asset.model ? `<div><span>Model</span><strong>${escapeHtml(asset.model)}</strong></div>` : ""}
      ${asset.registrationNumber ? `<div><span>Registration</span><strong>${escapeHtml(asset.registrationNumber)}</strong></div>` : ""}
      ${asset.serialNumber ? `<div><span>Serial</span><strong>${escapeHtml(asset.serialNumber)}</strong></div>` : ""}
      ${asset.valuationBasis ? `<div><span>Valuation</span><strong>${escapeHtml(asset.estimatedValueDate || "Estimated")}</strong></div>` : ""}
      ${asset.valuationLow || asset.valuationHigh ? `<div><span>Range</span><strong>${money(asset.valuationLow)} - ${money(asset.valuationHigh)}</strong></div>` : ""}
      ${asset.valuationConfidence ? `<div><span>Confidence</span><strong>${escapeHtml(asset.valuationConfidence)}</strong></div>` : ""}
      <p>${escapeHtml(asset.note || "No notes added.")}</p>
      ${asset.valuationBasis ? `<p class="valuation-copy">${escapeHtml(asset.valuationBasis)}</p>` : ""}
    </div>
    ${sectionHeader("Document Checklist", "Keep the important papers together")}
    ${assetChecklist(asset)}
    ${sectionHeader("Linked Documents", "Files saved for this asset")}
    ${assetDocumentCards(asset)}
    ${isInvestmentAsset(asset) ? `${sectionHeader("Investment Transactions", "Sells, splits and dividends")}${investmentTransactionHistory(asset)}` : ""}
    ${sectionHeader("Value History", "Manual value updates")}
    ${assetValueHistory(asset)}
  `;
  syncTabs("assets");
  refreshMetrics();
}

function vehicleAppraisalWorkflow(asset) {
  const estimate = estimateAssetValue(asset);
  if (!estimate) {
    return `
      <section class="vehicle-appraisal">
        <div class="vehicle-appraisal-copy">
          <span>Car price engine</span>
          <strong>Add buying price to estimate resale value</strong>
          <p>Enter manufacturing year, kilometers, owner number, condition and demand for a cleaner used-car quote.</p>
        </div>
      </section>
    `;
  }
  const engine = estimate.engineJson || parseVehicleValuationJson(asset.vehicleValuationJson) || {};
  const inputs = engine.inputs || {};
  const adjustments = engine.adjustments || {};
  const bought = nonNegativeRupees(inputs.original_price || asset.purchasePrice);
  const estimated = nonNegativeRupees(engine.estimated_resale_price || estimate.value);
  const retained = bought ? Math.max(0, Math.min(100, Math.round((estimated / bought) * 100))) : 0;
  const pricePosition = Math.max(8, Math.min(92, retained));
  const delta = estimated - bought;
  const rows = [
    ["Age depreciation", `${Math.round((1 - Number(adjustments.age_depreciation_multiplier || 1)) * 100)}%`, inputs.age_years ? `${inputs.age_years} years old` : "Year missing"],
    ["Mileage", `${Number(adjustments.mileage_adjustment_percent || 0) >= 0 ? "+" : ""}${Number(adjustments.mileage_adjustment_percent || 0)}%`, inputs.actual_mileage_km ? `${Number(inputs.actual_mileage_km).toLocaleString("en-IN")} km driven` : "Kilometers missing"],
    ["Ownership", `${Number(adjustments.ownership_adjustment_percent || 0)}%`, `${inputs.owner_count || 1}${Number(inputs.owner_count || 1) === 1 ? "st" : Number(inputs.owner_count || 1) === 2 ? "nd" : "rd+"} owner`],
    ["Condition", `x${Number(adjustments.condition_multiplier || 1).toFixed(2)}`, inputs.condition || "Good"],
    ["Demand", `x${Number(adjustments.demand_multiplier || 1).toFixed(2)}`, inputs.demand || "Normal"]
  ];
  return `
    <section class="vehicle-appraisal">
      <div class="vehicle-appraisal-copy">
        <span>Used car valuation</span>
        <strong>${money(estimated)}</strong>
        <p>Estimated resale price using age, kilometers, ownership, condition and demand.</p>
        <div class="vehicle-price-range">
          <b>${money(estimate.low)}</b>
          <i><em style="left:${pricePosition}%"></em></i>
          <b>${money(estimate.high)}</b>
        </div>
      </div>
      <div class="vehicle-appraisal-score">
        <span>${estimate.confidence} confidence</span>
        <strong>${retained}%</strong>
        <p>Value retained from buying price</p>
        <b class="${delta >= 0 ? "up" : "down"}">${delta >= 0 ? "+" : "-"} ${money(Math.abs(delta))}</b>
      </div>
      <div class="vehicle-appraisal-steps">
        ${rows.map(([label, value, detail], index) => `
          <div>
            <small>0${index + 1}</small>
            <span>${escapeHtml(label)}</span>
            <strong>${escapeHtml(value)}</strong>
            <p>${escapeHtml(detail)}</p>
          </div>
        `).join("")}
      </div>
    </section>
  `;
}

function parseVehicleValuationJson(value) {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function watchMarketDashboard(asset) {
  const market = parseJsonSafe(asset.watchMarketJson);
  const current = nonNegativeRupees(asset.value);
  const bought = nonNegativeRupees(asset.purchasePrice);
  const delta = current - bought;
  const signals = Array.isArray(market?.signals) ? market.signals : [];
  return `
    <section class="watch-market-dashboard">
      <div class="watch-market-hero">
        <span>Collectible watch appraisal</span>
        <strong>${money(current)}</strong>
        <p>${market?.basis ? escapeHtml(market.basis) : "Fetch market value to compare this watch with current resale signals."}</p>
        <div class="watch-market-band">
          <b>${money(asset.valuationLow || Math.round(current * .82))}</b>
          <i></i>
          <b>${money(asset.valuationHigh || Math.round(current * 1.18))}</b>
        </div>
      </div>
      <div class="watch-market-facts">
        ${vehicleFinanceTile("Bought", money(bought), asset.acquisitionDate || "Purchase date missing")}
        ${vehicleFinanceTile("Change", `${delta >= 0 ? "+" : "-"} ${money(Math.abs(delta))}`, asset.valuationConfidence || "Confidence pending")}
        ${vehicleFinanceTile("Reference", asset.referenceNumber || "Add reference", "Improves match quality")}
        ${vehicleFinanceTile("Box / Papers", asset.watchBoxPapers || "Not added", "Affects resale premium")}
      </div>
      <div class="watch-signal-list">
        <div>
          <span>Market signals</span>
          <button type="button" data-fetch-watch-value="${escapeAttribute(asset.id)}">Refresh</button>
        </div>
        ${signals.length ? signals.map(item => `
          <a href="${escapeAttribute(item.link)}" target="_blank" rel="noopener noreferrer">
            <small>${escapeHtml(item.source || "Watch market")}</small>
            <strong>${escapeHtml(item.title || "Market signal")}</strong>
            <em>${(item.prices || []).length ? (item.prices || []).map(price => money(price)).join(" / ") : "No price in snippet"}</em>
          </a>
        `).join("") : `<p>No live signals saved yet. Use Refresh to fetch current watch market data.</p>`}
      </div>
    </section>
  `;
}

function parseJsonSafe(value) {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function vehicleFinanceDashboard(asset) {
  const snapshot = financedAssetSnapshot(asset);
  const loan = snapshot.loan;
  const equityIsNegative = snapshot.equity < 0;
  const afterInterestIsNegative = snapshot.afterInterestPosition < 0;
  return `
    <section class="vehicle-finance-dashboard">
      <div class="vehicle-equity-hero ${afterInterestIsNegative ? "negative-equity" : ""}">
        <span>${afterInterestIsNegative ? "After-interest shortfall" : "After-interest position"}</span>
        <strong>${money(snapshot.afterInterestPosition)}</strong>
        <p>${afterInterestIsNegative
          ? `Current value minus loan payoff minus interest paid is short by ${money(Math.abs(snapshot.afterInterestPosition))}.`
          : "Current value minus loan payoff minus interest paid till now."}</p>
      </div>
      <div class="vehicle-finance-grid">
        ${vehicleFinanceTile("Current Vehicle Value", money(snapshot.currentValue), "Estimated resale value")}
        ${vehicleFinanceTile("Outstanding Loan", money(snapshot.outstandingLoan), loan.hasLoan ? `${loan.remainingMonths} EMIs left` : "Fully owned")}
        ${vehicleFinanceTile("Vehicle Equity", money(snapshot.equity), equityIsNegative ? "Value minus loan payoff" : "Net worth contribution")}
        ${vehicleFinanceTile("After Interest", money(snapshot.afterInterestPosition), "Value - loan - interest paid")}
        ${vehicleFinanceTile("Purchase Price", money(snapshot.purchasePrice), snapshot.purchaseDate || "No purchase date")}
        ${vehicleFinanceTile("Total Amount Paid", money(loan.totalPaid || snapshot.purchasePrice), loan.hasLoan ? "Down payment + EMIs paid" : "Paid upfront")}
        ${vehicleFinanceTile("Total Interest Paid", money(loan.interestPaidToDate), loan.hasLoan ? `${loan.completedEmis} EMIs completed` : "No loan interest")}
        ${vehicleFinanceTile("Remaining Loan", money(loan.remainingBalance), loan.loanType)}
        ${vehicleFinanceTile("Depreciation Since Purchase", money(snapshot.depreciation), `${snapshot.depreciationPercent}% from purchase`)}
      </div>
      <div class="vehicle-loan-strip">
        <span><b>Loan amount</b>${money(loan.loanAmount)}</span>
        <span><b>Total interest payable</b>${money(loan.totalInterestPayable)}</span>
        <span><b>Total repayment</b>${money(loan.totalRepayment)}</span>
        <span><b>Interest paid to date</b>${money(loan.interestPaidToDate)}</span>
        <span><b>Remaining principal</b>${money(loan.remainingPrincipal)}</span>
      </div>
    </section>
  `;
}

function vehicleFinanceTile(label, value, detail) {
  return `
    <div>
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(String(value))}</strong>
      <small>${escapeHtml(detail)}</small>
    </div>
  `;
}

function investmentDetailDashboard(asset) {
  const snapshot = investmentSnapshot(asset);
  const gain = snapshot.totalReturnInr;
  return `
    <section class="investment-detail-dashboard">
      <div class="investment-detail-hero">
        ${investmentMarketVisual(asset, "detail")}
        <span>${escapeHtml(asset.assetSubType || "Investment holding")}</span>
        <strong>${escapeHtml(asset.name || asset.ticker || "Investment")}</strong>
        <p>${escapeHtml(asset.ticker || "Ticker")} is ${gain >= 0 ? "up" : "down"} ${money(Math.abs(gain))}${snapshot.roi !== null ? ` (${snapshot.roi}%)` : ""} including dividends.</p>
      </div>
      <div class="investment-detail-grid">
        ${vehicleFinanceTile("Market Value", money(snapshot.currentValueInr), "Quantity x current price")}
        ${vehicleFinanceTile("Invested", money(snapshot.costBasisInr), "Buy amount + fees")}
        ${vehicleFinanceTile("Current Price", money(snapshot.currentPrice), "Manual latest price")}
        ${vehicleFinanceTile("Average Buy", money(snapshot.averageBuyPrice), "Cost per unit")}
        ${vehicleFinanceTile("Unrealized P/L", money(snapshot.unrealizedGainInr), "Current value - cost basis")}
        ${vehicleFinanceTile("Realized P/L", money(snapshot.realizedGainInr), "Recorded sell transactions")}
        ${vehicleFinanceTile("Dividends", money(snapshot.dividendsInr), "Cash return recorded")}
        ${vehicleFinanceTile("Total Return", money(snapshot.totalReturnInr), snapshot.roi === null ? "Add cost basis" : `${snapshot.roi}% ROI`)}
      </div>
      <div class="investment-action-strip">
        <button type="button" data-sell-investment="${escapeAttribute(asset.id)}">Record sell</button>
        <button type="button" data-split-investment="${escapeAttribute(asset.id)}">Apply split</button>
        <button type="button" data-dividend-investment="${escapeAttribute(asset.id)}">Add dividend</button>
      </div>
    </section>
  `;
}

function investmentTransactionHistory(asset) {
  const transactions = investmentTransactions(asset).slice().reverse();
  if (!transactions.length) return `<div class="empty-state">No investment transactions recorded yet.</div>`;
  return `
    <div class="investment-transaction-list">
      ${transactions.map(item => `
        <div>
          <span>${escapeHtml(item.type || "Event")}</span>
          <strong>${escapeHtml(item.date || "")}</strong>
          <p>${escapeHtml(item.note || "")}</p>
          ${Array.isArray(item.allocations) && item.allocations.length ? `
            <small>${item.allocations.map(row => `${escapeHtml(row.quantity)} units from ${escapeHtml(row.lotId || row.name || "lot")}`).join(" / ")}</small>
          ` : ""}
          ${item.realizedGain !== undefined ? `<b class="${Number(item.realizedGain || 0) >= 0 ? "up" : "down"}">${nativeMoney(item.realizedGain, asset.currency)}</b>` : ""}
        </div>
      `).join("")}
    </div>
  `;
}

function investmentMiniTimeline(asset) {
  const snapshot = investmentSnapshot(asset);
  const events = [
    ["Bought", asset.purchaseDate || asset.acquisitionDate || "Not added"],
    ["Price update", asset.lastUpdated || "Not added"],
    ["Dividend", snapshot.dividendsInr ? money(snapshot.dividendsInr) : "None"],
    ["Sell", investmentTransactions(asset).some(item => item.type === "Sell") ? "Recorded" : "None"]
  ];
  return `
    <section class="investment-mini-timeline">
      ${events.map(([label, value], index) => `
        <span class="${value === "None" || value === "Not added" ? "muted" : "complete"}">
          <b>${index + 1}</b>
          <strong>${escapeHtml(label)}</strong>
          <small>${escapeHtml(String(value))}</small>
        </span>
      `).join("")}
    </section>
  `;
}

function assetMiniTimeline(asset) {
  const docs = linkedDocuments(asset);
  const reminder = upcoming().find(item => `${item.name} ${item.type}`.toLowerCase().includes(String(asset.name || "").toLowerCase()));
  const events = [
    ["Bought", asset.acquisitionDate || asset.purchaseDate || "Not added"],
    ["Value update", asset.lastUpdated || "Not added"],
    ["Document", docs.length ? `${docs.length} saved` : "None"],
    ["Reminder", reminder ? (reminder.days < 0 ? "Overdue" : `${reminder.days} days`) : "None"]
  ];
  return `
    <section class="investment-mini-timeline asset-mini-timeline">
      ${events.map(([label, value], index) => `
        <span class="${value === "None" || value === "Not added" ? "muted" : "complete"}">
          <b>${index + 1}</b>
          <strong>${escapeHtml(label)}</strong>
          <small>${escapeHtml(String(value))}</small>
        </span>
      `).join("")}
    </section>
  `;
}

function assetProfileSummary(asset) {
  const bought = Number(asset.purchasePrice || 0);
  const current = Number(asset.value || 0);
  const gain = current - bought;
  const required = requiredDocsForAsset(asset);
  const missing = missingDocsForAsset(asset);
  const savedDocs = Math.max(0, required.length - missing.length);
  const completion = assetCompletion(asset);
  const reminder = upcoming().find(item => `${item.name} ${item.type}`.toLowerCase().includes(String(asset.name || "").toLowerCase()));
  return `
    <section class="asset-profile-summary">
      <div>
        <span>Asset completion</span>
        <strong>${completion}%</strong>
        <i><b style="width:${completion}%"></b></i>
      </div>
      <div>
        <span>Bought for</span>
        <strong>${money(bought)}</strong>
        <small>${asset.acquisitionDate || "Add purchase date"}</small>
      </div>
      <div>
        <span>Current value</span>
        <strong>${money(current)}</strong>
        <small>${asset.valuationBasis ? "Estimated value" : asset.source || "Manual value"}</small>
      </div>
      <div>
        <span>Gain / loss</span>
        <strong class="${gain >= 0 ? "up" : "down"}">${bought ? `${gain >= 0 ? "+" : "-"} ${money(Math.abs(gain))}` : "Add cost"}</strong>
        <small>${asset.valuationLow || asset.valuationHigh ? `${money(asset.valuationLow)} - ${money(asset.valuationHigh)}` : "No range yet"}</small>
      </div>
      <div>
        <span>Documents</span>
        <strong>${savedDocs}/${required.length}</strong>
        <small>${missing.length ? `${missing.length} missing` : "Complete"}</small>
      </div>
      <div>
        <span>Reminder</span>
        <strong>${reminder ? (reminder.days < 0 ? "Overdue" : `${reminder.days} days`) : "None"}</strong>
        <small>${reminder ? reminder.name : "Add renewal or review"}</small>
      </div>
    </section>
  `;
}

function assetCompletion(asset) {
  const checks = [
    Boolean(asset.name),
    Boolean(asset.value),
    Boolean(asset.purchasePrice),
    Boolean(asset.photoId),
    !missingDocsForAsset(asset).length,
    Boolean(asset.renewal)
  ];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

function categoryDetailHero(asset, category) {
  const current = Number(asset.value || 0);
  const bought = Number(asset.purchasePrice || 0);
  const gain = current - bought;
  const image = asset.photoId ? fileViewUrl(asset.photoId) : category.fallback;
  const specs = category.detailSpecs(asset).filter(([, value]) => value);
  return `
    <div class="vehicle-detail-hero">
      <img src="${escapeAttribute(image)}" alt="${escapeAttribute(asset.name || category.title)}">
      <div class="vehicle-detail-copy">
        <span>${escapeHtml(asset.type || category.title)}</span>
        <strong>${escapeHtml(asset.name || asset.model || category.title)}</strong>
        <div class="vehicle-detail-prices">
          <b><small>Buying Price</small>${money(bought)}</b>
          <b><small>Current Price</small>${money(current)}</b>
          <b class="${gain >= 0 ? "up" : "down"}"><small>Change</small>${bought ? `${gain >= 0 ? "+" : "-"} ${money(Math.abs(gain))}` : "Add buying price"}</b>
        </div>
        <div class="vehicle-spec-grid">
          ${specs.length ? specs.map(([label, value]) => `<i><small>${escapeHtml(label)}</small>${escapeHtml(String(value))}</i>`).join("") : `<i><small>Specs</small>Add brand, model, year and registration</i>`}
        </div>
      </div>
    </div>
  `;
}

function assetDocumentCards(asset) {
  const docs = linkedDocuments(asset);
  if (!docs.length) return `<div class="empty-state">No documents linked yet.</div>`;
  return docs.map(doc => recordButton("documents", doc)).join("");
}

function assetMissingDocumentCards(asset) {
  const missing = missingDocsForAsset(asset);
  if (!missing.length) return `<div class="empty-state">No obvious document gaps for this asset.</div>`;
  return missing.map(name => `
    <button class="record-card" type="button" data-add="documents" data-prefill-name="${escapeAttribute(name)}" data-prefill-linked="${escapeAttribute(asset.name)}">
      <span class="record-icon"></span>
      <span>
        <strong>${escapeHtml(name)}</strong>
        <small>Suggested for ${escapeHtml(asset.name)}</small>
      </span>
    </button>
  `).join("");
}

function assetChecklist(asset) {
  const required = requiredDocsForAsset(asset);
  if (!required.length) return `<div class="empty-state">No checklist needed for this asset type yet.</div>`;
  const docs = linkedDocuments(asset);
  return `<div class="checklist-grid">${required.map(name => {
    const found = docs.find(doc => sameDoc(doc.name, name) || sameDoc(doc.type, name));
    return `
      <button class="checklist-row ${found ? "complete" : ""}" type="button" ${found ? `data-edit="documents" data-id="${escapeAttribute(found.id)}"` : `data-add="documents" data-prefill-name="${escapeAttribute(name)}" data-prefill-linked="${escapeAttribute(asset.name)}"`}>
        <span></span>
        <strong>${escapeHtml(name)}</strong>
        <small>${found ? "Saved" : "Missing"}</small>
      </button>
    `;
  }).join("")}</div>`;
}

function assetValueHistory(asset) {
  const rows = Array.isArray(asset.valueHistory) ? [...asset.valueHistory].reverse() : [];
  if (!rows.length) return `<div class="empty-state">No value updates yet. Use Update Value when the market value changes.</div>`;
  return `<div class="value-history">${rows.slice(0, 8).map(row => `
    <div class="allocation-row">
      <span><strong>${money(row.value)}</strong><small>${escapeHtml(row.date || "")}</small></span>
      ${row.note ? `<small>${escapeHtml(row.note)}</small>` : ""}
    </div>
  `).join("")}</div>`;
}

function categoryTiles() {
  return `<div class="category-grid">${assetCategories.map(([name, help]) => {
    const key = categoryKeyForTile(name);
    const summary = categoryTileStats(key);
    return `
    <button class="category-card" type="button" data-asset-category="${escapeAttribute(categoryKeyForTile(name))}">
      <strong>${escapeHtml(name)}</strong>
      <span>${escapeHtml(help)}</span>
      <small>${escapeHtml(summary.primary)}</small>
      <em>${escapeHtml(summary.secondary)}</em>
    </button>
  `;
  }).join("")}</div>`;
}

function categoryKeyForTile(name) {
  return Object.entries(assetCategoryViews).find(([, category]) => category.tile === name)?.[0] || "";
}

function categoryTileSummary(key) {
  const category = assetCategoryViews[key];
  if (!category) return "";
  const items = state.assets.filter(category.matcher);
  const value = items.reduce((sum, item) => sum + Number(item.value || 0), 0);
  if (key === "cash") return money(value);
  return `${items.length} ${items.length === 1 ? "item" : "items"}${value ? ` - ${money(value)}` : ""}`;
}

function categoryTileStats(key) {
  const category = assetCategoryViews[key];
  if (!category) return { primary: "", secondary: "" };
  const items = state.assets.filter(category.matcher);
  const value = items.reduce((sum, item) => sum + Number(item.value || 0), 0);
  const bought = items.reduce((sum, item) => sum + Number(item.purchasePrice || 0), 0);
  const missing = items.reduce((sum, item) => sum + missingDocsForAsset(item).length, 0);
  const gain = value - bought;
  if (key === "cash") return { primary: money(value), secondary: `${items.length} balance ${items.length === 1 ? "record" : "records"}` };
  return {
    primary: `${items.length} ${items.length === 1 ? "item" : "items"} - ${money(value)}`,
    secondary: bought ? `${gain >= 0 ? "Gain" : "Loss"} ${money(Math.abs(gain))}${missing ? ` - ${missing} docs missing` : ""}` : `${missing ? `${missing} docs missing` : "Add purchase value"}`
  };
}

function metricModule(label, value, subtext, color) {
  return `
    <article class="module stat-module" style="--module-bg: ${color}">
      <span class="tile-count">${escapeHtml(subtext)}</span>
      <strong class="stat-value">${escapeHtml(String(value))}</strong>
      <span class="module-title">${escapeHtml(label)}</span>
    </article>
  `;
}

function renderCollection(collection) {
  setActions(collection);
  const count = state[collection].length;
  if (collection === "documents") {
    const due = state.documents.filter(doc => documentStatus(doc).key === "due").length;
    const expired = state.documents.filter(doc => documentStatus(doc).key === "expired").length;
    const missing = missingDocuments().length;
    grid.innerHTML = `
      ${metricModule("Stored Documents", count, "Files and records", config.documents.color)}
      ${metricModule("Needs Attention", due + expired + missing, `${due} due, ${expired} expired, ${missing} missing`, "linear-gradient(135deg, #111 0%, #36423d 100%)")}
    `;
    list.innerHTML = `
      ${documentFilterBar()}
      ${documentReadinessPanel()}
      ${sectionHeader("Basic personal documents", "Tap missing items to upload")}
      ${personalDocumentChecklistCards()}
      ${documentFilter === "missing" ? missingDocumentCards() : documentVaultCards()}
      ${documentFilter === "missing" ? "" : `${sectionHeader("Suggested Documents", "Based on assets you added")}${missingDocumentCards()}`}
    `;
    return;
  }
  grid.innerHTML = `${metricModule(config[activeView].title, count, "Saved files and records", config[activeView].color)}`;
  list.innerHTML = cards(collection);
}

function documentReadinessPanel() {
  const saved = personalDocumentTypes.filter(hasDocumentMatch).length;
  const total = personalDocumentTypes.length;
  const percent = documentReadiness();
  const due = state.documents.filter(doc => documentStatus(doc).key === "due").length;
  const expired = state.documents.filter(doc => documentStatus(doc).key === "expired").length;
  return `
    <section class="document-readiness-panel">
      <div>
        <span>Personal documents</span>
        <strong>${saved}/${total} saved</strong>
        <i><b style="width:${percent}%"></b></i>
      </div>
      <p>${due + expired ? `${due} due soon, ${expired} expired` : "No expiry issue found"}</p>
      <button type="button" data-add="documents" data-prefill-linked="Personal" data-prefill-required="Personal">Add document</button>
    </section>
  `;
}

function documentFilterBar() {
  return `
    <div class="filter-bar" role="group" aria-label="Document filters">
      ${documentFilters.map(([key, label]) => `
        <button class="${documentFilter === key ? "active" : ""}" type="button" data-doc-filter="${escapeAttribute(key)}">${escapeHtml(label)}</button>
      `).join("")}
    </div>
  `;
}

function documentVaultCards() {
  const docs = filteredDocuments();
  if (!docs.length) return `<div class="empty-state">No documents in this filter yet.</div>`;
  if (documentFilter !== "all" && documentFilter !== "personal") return docs.map(doc => recordButton("documents", doc)).join("");
  return groupedDocumentCards(docs);
}

function groupedDocumentCards(docs) {
  const groups = docs.reduce((acc, doc) => {
    const key = documentGroup(doc);
    acc[key] = acc[key] || [];
    acc[key].push(doc);
    return acc;
  }, {});
  return Object.entries(groups).map(([group, items]) => `
    ${sectionHeader(group, `${items.length} saved`)}
    ${items.map(doc => recordButton("documents", doc)).join("")}
  `).join("");
}

function documentGroup(doc) {
  const text = `${doc.name} ${doc.type} ${doc.requiredFor}`.toLowerCase();
  if (/aadhaar|aadhar|pan|passport|driving|licence|license|voter|birth/.test(text)) return "Identity";
  if (/tax|itr|income/.test(text)) return "Tax";
  if (/bank|passbook|cheque|account/.test(text)) return "Bank";
  if (/insurance|policy/.test(text)) return "Insurance";
  if (/rc|puc|service|sale deed|registration|property|invoice|certificate|statement/.test(text)) return "Asset papers";
  return "Other documents";
}

function personalDocumentChecklistCards() {
  return `
    <div class="personal-doc-grid">
      ${personalDocumentTypes.map(item => {
        const saved = state.documents.find(doc => {
          const text = `${doc.name} ${doc.type} ${doc.requiredFor} ${doc.linkedTo}`.toLowerCase();
          return item.aliases.some(alias => text.includes(alias));
        });
        return `
          <button class="personal-doc-card ${saved ? "complete" : ""}" type="button" ${saved ? `data-edit="documents" data-id="${escapeAttribute(saved.id)}"` : `data-add="documents" data-prefill-name="${escapeAttribute(item.name)}" data-prefill-type="${escapeAttribute(item.type)}" data-prefill-linked="Personal" data-prefill-required="Personal"`}>
            <span></span>
            <strong>${escapeHtml(item.name)}</strong>
            <small>${saved ? "Saved" : "Missing"}</small>
          </button>
        `;
      }).join("")}
    </div>
  `;
}

function renderReports() {
  actions.innerHTML = `<button class="secondary-action" type="button" id="edit-cash">Update Monthly Flow</button>`;
  const data = totals();
  const assetCount = nonCashAssets().length;
  grid.innerHTML = `
    ${metricModule("Asset Value", money(data.assets), `${assetCount} assets tracked`, config.reports.color)}
    ${metricModule("Cash Balance", money(data.cash), "Bank and reserves", "linear-gradient(135deg, #151f1c 0%, #334021 100%)")}
    ${metricModule("Documents", state.documents.length, "Stored files and records", "linear-gradient(135deg, #151f1c 0%, #334021 100%)")}
  `;
  list.innerHTML = `${sectionHeader("Asset Breakdown", "Current value by category")}${allocationCards()}`;
  list.innerHTML += `${sectionHeader("Action Checklist", "What to fix next")}${actionChecklistCards()}`;
  list.innerHTML += `${sectionHeader("Upcoming Reminders", "Renewals, reviews, and follow-ups")}${reminderCards()}`;
  list.innerHTML += `${sectionHeader("Simple Checks", "Keep ownership clear")}${calculatorCards()}`;
}

function renderAi() {
  actions.innerHTML = `
    <form class="ai-form" id="ai-form">
      <input id="ai-question" placeholder="Ask what is missing or what to add next..." value="What should I add first?">
      <button class="primary-action" type="submit">Ask</button>
    </form>
  `;
  grid.innerHTML = `
    ${metricModule("Advisor", "Ready", "Answers use your saved data", config.ai.color)}
    ${metricModule("Health", `${totals().health}/100`, "Debt, cash flow, cover", "linear-gradient(135deg, #123c46 0%, #2d9b8d 100%)")}
  `;
  list.innerHTML = `<div class="answer-card" id="ai-answer">${escapeHtml(advisorText())}</div>`;
}

function goalAverage() {
  if (!state.goals.length) return 0;
  const avg = state.goals.reduce((sum, item) => sum + Math.min(100, Math.round((Number(item.saved || 0) / Number(item.target || 1)) * 100)), 0) / state.goals.length;
  return Math.round(avg);
}

function sectionHeader(heading, text) {
  return `<div class="list-heading"><strong>${escapeHtml(heading)}</strong><span>${escapeHtml(text)}</span></div>`;
}

function insightCards(items) {
  return items.map(item => `
    <div class="record-card static-record insight-record">
      <span class="record-icon"></span>
      <span>
        <strong>${escapeHtml(item)}</strong>
        <small>Recommended next step</small>
      </span>
    </div>
  `).join("");
}

function cards(collection) {
  const items = state[collection] || [];
  if (!items.length) return `<div class="empty-state">${escapeHtml(emptyStateText(collection))}</div>`;
  return items.map(item => {
    return recordButton(collection, item);
  }).join("");
}

function emptyStateText(collection) {
  if (collection === "assets") return "Add your first big purchase, cash balance, land, vehicle, watch, shoes or investment.";
  if (collection === "documents") return "Upload Aadhaar, PAN, RC, insurance, statements or ownership papers.";
  if (collection === "alerts") return "Add renewal, EMI, service, tax or advisor meeting reminders.";
  if (collection === "goals") return "Create one money target to track progress.";
  if (collection === "family") return "Add trusted family members only when you want shared visibility.";
  return "No records yet. Add one to start tracking.";
}

function recordButton(collection, item) {
  const meta = describeItem(collection, item);
  const status = collection === "documents" ? documentStatus(item) : null;
  const assetStatus = collection === "assets" ? assetValueStatus(item) : null;
  const assetMoney = collection === "assets" ? assetMoneyLine(item) : "";
  const assetChecklist = collection === "assets" ? assetChecklistSummary(item) : "";
  const fileLink = collection === "documents" && item.fileUrl
    ? `<span class="file-link" data-preview-file="${escapeAttribute(item.fileId)}" data-file-name="${escapeAttribute(item.fileName || item.name)}">Preview file</span>`
    : "";
  const actionAttr = collection === "assets" ? "data-detail" : "data-edit";
  return `
    <button class="record-card" type="button" ${actionAttr}="${collection}" data-id="${item.id}">
      <span class="record-icon"></span>
      <span>
        <strong>${escapeHtml(item.name || "Untitled")}</strong>
        <small>${escapeHtml(meta)}</small>
        ${assetMoney}
        ${status ? `<em class="status-pill ${escapeAttribute(status.key)}">${escapeHtml(status.label)}</em>` : ""}
        ${assetStatus ? `<em class="status-pill ${escapeAttribute(assetStatus.key)}">${escapeHtml(assetStatus.label)}</em>` : ""}
        ${assetChecklist}
        ${fileLink}
      </span>
    </button>
  `;
}

function assetValueStatus(asset) {
  const missing = missingDocsForAsset(asset);
  if (missing.length) return { key: "missing-docs", label: `${missing.length} papers missing` };
  if (isAssetValueOutdated(asset)) return { key: "stale-value", label: "Value outdated" };
  if (asset.valuationBasis) return { key: "estimated", label: `Estimated ${asset.valuationConfidence || ""}`.trim() };
  if (asset.value) return { key: "manual", label: "Manual value" };
  return { key: "incomplete", label: "Add value" };
}

function isAssetValueOutdated(asset) {
  if (!asset.lastUpdated) return true;
  return daysUntil(asset.lastUpdated) < -180;
}

function assetMoneyLine(asset) {
  const spent = Number(asset.purchasePrice || 0);
  const current = Number(asset.value || 0);
  if (!spent && !current) return "";
  const change = current - spent;
  const changeLabel = spent ? `${change >= 0 ? "+" : ""}${money(change)}` : "No cost added";
  return `
    <span class="asset-money-line">
      <b>Spent ${money(spent)}</b>
      <b>Now ${money(current)}</b>
      <i>${escapeHtml(changeLabel)}</i>
    </span>
  `;
}

function assetChecklistSummary(asset) {
  const required = requiredDocsForAsset(asset);
  if (!required.length) return "";
  const missing = missingDocsForAsset(asset);
  const savedCount = Math.max(0, required.length - missing.length);
  const topMissing = missing.slice(0, 3);
  const label = missing.length
    ? `Missing: ${topMissing.join(", ")}${missing.length > topMissing.length ? ` +${missing.length - topMissing.length}` : ""}`
    : "Documents complete";
  return `
    <span class="asset-check-summary ${missing.length ? "needs-docs" : "complete-docs"}">
      <b>${escapeHtml(label)}</b>
      <small>${savedCount}/${required.length} saved</small>
    </span>
  `;
}

function renderTaxDocuments() {
  actions.innerHTML = `
    <button class="primary-action" type="button" data-add="documents" data-prefill-linked="Tax Filing" data-prefill-required="Tax Documents">Upload Tax Document</button>
  `;

  const activeTaxTab = window.currentTaxTab || "checklist";
  const required = taxDocumentGroups.flatMap(([, names]) => names);
  const uploaded = required.filter(name => taxDocumentFor(name)).length;
  const grossIncome = calculateGrossAnnualIncome();
  const deductionsSummary = calculateTaxDeductionsSummary();
  const taxComparison = calculateTaxComparison();
  const aiSuggestions = generateAiTaxSuggestions();

  grid.innerHTML = `
    ${metricModule("Tax Readiness", `${uploaded}/${required.length}`, `${Math.round((uploaded / (required.length || 1)) * 100)}% Uploaded (CA Ready)`, config.taxDocuments.color)}
    ${metricModule("Gross Annual Income", money(grossIncome), "Real-time income", "linear-gradient(135deg, #111820 0%, #3e4f44 100%)")}
    ${metricModule("Est. Tax Liability", money(taxComparison.recommendedTax), `Best Option: ${taxComparison.recommendedRegime}`, "linear-gradient(135deg, #122838 0%, #2f6b96 100%)")}
    ${metricModule("Potential Tax Savings", money(aiSuggestions.totalPotentialSavings), `${aiSuggestions.items.length} Smart Suggestions`, "linear-gradient(135deg, #19382b 0%, #3ca373 100%)")}
  `;

  list.innerHTML = `
    <div class="tax-step-wizard">
      <span class="wizard-label">Tax Preparation Workflow:</span>
      <div class="tax-nav-tabs">
        <button class="tax-tab-btn ${activeTaxTab === "checklist" ? "active" : ""}" type="button" data-tax-tab="checklist">1. Upload Tax Documents (${uploaded}/${required.length})</button>
        <button class="tax-tab-btn ${activeTaxTab === "income" ? "active" : ""}" type="button" data-tax-tab="income">2. Income Details</button>
        <button class="tax-tab-btn ${activeTaxTab === "deductions" ? "active" : ""}" type="button" data-tax-tab="deductions">3. Current Deductions</button>
        <button class="tax-tab-btn ${activeTaxTab === "calculator" ? "active" : ""}" type="button" data-tax-tab="calculator">4. Tax Calculator</button>
        <button class="tax-tab-btn ${activeTaxTab === "ai-suggestions" ? "active" : ""}" type="button" data-tax-tab="ai-suggestions">5. AI Tax Suggestions</button>
        <button class="tax-tab-btn ${activeTaxTab === "share-ca" ? "active" : ""}" type="button" data-tax-tab="share-ca">6. Download & Share with CA</button>
      </div>
    </div>
    ${activeTaxTab === "checklist" ? renderTaxChecklistPage(uploaded, required.length) : activeTaxTab === "income" ? renderIncomeDetailsPage() : activeTaxTab === "deductions" ? renderTaxDeductionsPage() : activeTaxTab === "calculator" ? renderTaxCalculatorPage() : activeTaxTab === "ai-suggestions" ? renderAiTaxSuggestionsPage() : renderShareWithCaPage()}
  `;
}

function renderIncomeDetailsPage() {
  const inc = state.incomeDetails || {};
  const grossIncome = calculateGrossAnnualIncome();

  return `
    <section class="income-details-container">
      <div class="income-header-card">
        <div>
          <span>Total Annual Income</span>
          <h2>${money(grossIncome)}</h2>
          <small>Gross Annual Income (Calculated live from your inputs)</small>
        </div>
        <div class="autosave-badge">✓ Real-time Autosaved</div>
      </div>

      <div class="income-sections-grid">
        <article class="income-card">
          <div class="income-card-head">
            <h3>Salary Breakdown</h3>
            <small>Salaried compensation components</small>
          </div>
          <div class="income-fields-list">
            <label class="income-field-row">
              <span>Basic Salary</span>
              <input type="number" data-income-key="basicSalary" value="${inc.basicSalary || ""}" placeholder="e.g. 600000" min="0">
            </label>
            <label class="income-field-row">
              <span>HRA</span>
              <input type="number" data-income-key="hra" value="${inc.hra || ""}" placeholder="e.g. 240000" min="0">
            </label>
            <label class="income-field-row">
              <span>Special Allowance</span>
              <input type="number" data-income-key="specialAllowance" value="${inc.specialAllowance || ""}" placeholder="e.g. 180000" min="0">
            </label>
            <label class="income-field-row">
              <span>Bonus</span>
              <input type="number" data-income-key="bonus" value="${inc.bonus || ""}" placeholder="e.g. 100000" min="0">
            </label>
            <label class="income-field-row">
              <span>Other Allowances</span>
              <input type="number" data-income-key="otherAllowances" value="${inc.otherAllowances || ""}" placeholder="e.g. 50000" min="0">
            </label>
            <label class="income-field-row">
              <span>Employer PF</span>
              <input type="number" data-income-key="employerPf" value="${inc.employerPf || ""}" placeholder="e.g. 72000" min="0">
            </label>
            <label class="income-field-row">
              <span>Professional Tax</span>
              <input type="number" data-income-key="professionalTax" value="${inc.professionalTax || ""}" placeholder="e.g. 2500" min="0">
            </label>
          </div>
        </article>

        <article class="income-card">
          <div class="income-card-head">
            <h3>Other Income</h3>
            <small>Additional earnings & investments</small>
          </div>
          <div class="income-fields-list">
            <label class="income-field-row">
              <span>Other Income</span>
              <input type="number" data-income-key="otherIncome" value="${inc.otherIncome || ""}" placeholder="e.g. 30000" min="0">
            </label>
            <label class="income-field-row">
              <span>Bank Interest</span>
              <input type="number" data-income-key="bankInterest" value="${inc.bankInterest || ""}" placeholder="e.g. 15000" min="0">
            </label>
            <label class="income-field-row">
              <span>Dividend Income</span>
              <input type="number" data-income-key="dividendIncome" value="${inc.dividendIncome || ""}" placeholder="e.g. 12000" min="0">
            </label>
            <label class="income-field-row">
              <span>Rental Income (Optional)</span>
              <input type="number" data-income-key="rentalIncome" value="${inc.rentalIncome || ""}" placeholder="e.g. 180000" min="0">
            </label>
          </div>
        </article>
      </div>
    </section>
  `;
}

function renderTaxDeductionsPage() {
  const ded = state.taxDeductions || {};
  const inc = state.incomeDetails || {};

  // Default values & auto-fill from income if present
  const standardDeductionFixed = 50000;
  const profTaxVal = Number(ded.profTax) || Number(inc.professionalTax) || 0;
  const sec80CVal = Number(ded.sec80C) || 0;
  const sec80CCD1BVal = Number(ded.sec80CCD1B) || 0;
  const sec80DVal = Number(ded.sec80D) || 0;
  const homeLoanIntVal = Number(ded.homeLoanInterest) || 0;

  const cardsData = [
    { key: "sec80C", title: "Section 80C", sub: "PPF, ELSS, EPF, Life Insurance, Tuition Fee", claimed: sec80CVal, max: 150000, label: "Amount Invested" },
    { key: "sec80CCD1B", title: "Section 80CCD(1B)", sub: "National Pension Scheme (NPS) Additional", claimed: sec80CCD1BVal, max: 50000, label: "NPS Contribution" },
    { key: "sec80D", title: "Section 80D", sub: "Health Insurance Premium (Self, Family & Parents)", claimed: sec80DVal, max: 75000, label: "Premium Paid" },
    { key: "homeLoanInterest", title: "Home Loan Interest (Section 24b)", sub: "Self-occupied property interest deduction", claimed: homeLoanIntVal, max: 200000, label: "Interest Paid" },
    { key: "profTax", title: "Professional Tax", sub: "State Tax on Employment (Auto-synced from Salary)", claimed: profTaxVal, max: 2500, label: "Tax Paid", autoFill: true },
    { key: "standardDeduction", title: "Standard Deduction", sub: "Flat deduction for salaried employees", claimed: standardDeductionFixed, max: 50000, label: "Standard Cap", fixed: true }
  ];

  const summary = calculateTaxDeductionsSummary();

  return `
    <section class="tax-deductions-container">
      <div class="deductions-grid">
        ${cardsData.map(c => {
          const eligibleClaimed = Math.min(c.claimed, c.max);
          const remaining = Math.max(0, c.max - c.claimed);
          const progressPercent = Math.min(100, Math.round((c.claimed / c.max) * 100));

          return `
            <article class="deduction-card">
              <div class="deduction-card-head">
                <div>
                  <h3>${escapeHtml(c.title)}</h3>
                  <small>${escapeHtml(c.sub)}</small>
                </div>
                <span class="deduction-tag">${progressPercent >= 100 ? "Maxed Out" : `${progressPercent}% Used`}</span>
              </div>

              <div class="deduction-input-row">
                <span>${escapeHtml(c.label)}</span>
                ${c.fixed ? `
                  <input type="number" value="${c.claimed}" disabled readonly class="readonly-input">
                ` : `
                  <input type="number" data-deduction-key="${c.key}" value="${c.claimed || ""}" placeholder="0" min="0">
                `}
              </div>

              <div class="deduction-stats-grid">
                <div>
                  <small>Claimed Deduction</small>
                  <strong>${money(eligibleClaimed)}</strong>
                </div>
                <div>
                  <small>Maximum Limit</small>
                  <strong>${money(c.max)}</strong>
                </div>
                <div>
                  <small>Remaining Limit</small>
                  <strong class="${remaining > 0 ? "highlight-remaining" : "highlight-full"}">${money(remaining)}</strong>
                </div>
              </div>

              <div class="deduction-progress-bar"><b style="width:${progressPercent}%"></b></div>
            </article>
          `;
        }).join("")}
      </div>

      <div class="deductions-bottom-summary">
        <div class="summary-col">
          <span>Gross Annual Income</span>
          <h3>${money(summary.grossIncome)}</h3>
        </div>
        <div class="summary-col">
          <span>Total Deductions Claimed</span>
          <h3 class="green-text">${money(summary.totalDeductions)}</h3>
        </div>
        <div class="summary-col main-taxable">
          <span>Net Taxable Income</span>
          <h2>${money(summary.taxableIncome)}</h2>
        </div>
      </div>
    </section>
  `;
}

function renderTaxCalculatorPage() {
  const comp = calculateTaxComparison();
  const oldR = comp.oldRegime;
  const newR = comp.newRegime;
  const isOldBetter = comp.recommendedRegime === "Old Regime";

  return `
    <section class="tax-calculator-container">
      <div class="calculator-hero-banner">
        <div>
          <span>Tax Optimization Analysis</span>
          <h2>Recommended: ${comp.recommendedRegime}</h2>
          <p>You save <strong>${money(comp.taxSavings)}</strong> by opting for the ${comp.recommendedRegime}.</p>
        </div>
        <div class="savings-pill">Save ${money(comp.taxSavings)}</div>
      </div>

      <div class="regime-comparison-grid">
        <!-- Old Regime Card -->
        <article class="regime-card ${isOldBetter ? "recommended-regime" : ""}">
          ${isOldBetter ? `<div class="recommendation-badge">⭐ Recommended (Lower Tax)</div>` : ""}
          <div class="regime-card-head">
            <h3>Old Tax Regime</h3>
            <small>Deductions Allowed (80C, 80D, HRA, etc.)</small>
          </div>

          <div class="regime-metrics-list">
            <div class="regime-metric-row">
              <span>Gross Annual Income</span>
              <strong>${money(oldR.grossIncome)}</strong>
            </div>
            <div class="regime-metric-row">
              <span>Total Deductions Claimed</span>
              <strong class="green-text">-${money(oldR.totalDeductions)}</strong>
            </div>
            <div class="regime-metric-row highlight-row">
              <span>Net Taxable Income</span>
              <strong>${money(oldR.taxableIncome)}</strong>
            </div>
            <div class="regime-metric-row">
              <span>Income Tax (Base)</span>
              <strong>${money(oldR.incomeTax)}</strong>
            </div>
            <div class="regime-metric-row">
              <span>Health & Education Cess (4%)</span>
              <strong>${money(oldR.cess)}</strong>
            </div>
            <div class="regime-metric-row total-tax-row">
              <span>Total Tax Liability</span>
              <h2>${money(oldR.totalTax)}</h2>
            </div>
          </div>
        </article>

        <!-- New Regime Card -->
        <article class="regime-card ${!isOldBetter ? "recommended-regime" : ""}">
          ${!isOldBetter ? `<div class="recommendation-badge">⭐ Recommended (Lower Tax)</div>` : ""}
          <div class="regime-card-head">
            <h3>New Tax Regime</h3>
            <small>Lower Tax Slabs + ₹75,000 Std. Deduction</small>
          </div>

          <div class="regime-metrics-list">
            <div class="regime-metric-row">
              <span>Gross Annual Income</span>
              <strong>${money(newR.grossIncome)}</strong>
            </div>
            <div class="regime-metric-row">
              <span>Standard Deduction</span>
              <strong class="green-text">-${money(newR.totalDeductions)}</strong>
            </div>
            <div class="regime-metric-row highlight-row">
              <span>Net Taxable Income</span>
              <strong>${money(newR.taxableIncome)}</strong>
            </div>
            <div class="regime-metric-row">
              <span>Income Tax (Base)</span>
              <strong>${money(newR.incomeTax)}</strong>
            </div>
            <div class="regime-metric-row">
              <span>Health & Education Cess (4%)</span>
              <strong>${money(newR.cess)}</strong>
            </div>
            <div class="regime-metric-row total-tax-row">
              <span>Total Tax Liability</span>
              <h2>${money(newR.totalTax)}</h2>
            </div>
          </div>
        </article>
      </div>
    </section>
  `;
}

function calculateOldRegimeTax(grossIncome, totalDeductions) {
  const taxableIncome = Math.max(0, grossIncome - totalDeductions);
  let tax = 0;

  if (taxableIncome > 1000000) {
    tax += (taxableIncome - 1000000) * 0.30 + 112500;
  } else if (taxableIncome > 500000) {
    tax += (taxableIncome - 500000) * 0.20 + 12500;
  } else if (taxableIncome > 250000) {
    tax += (taxableIncome - 250000) * 0.05;
  }

  // Section 87A rebate for Old Regime (Full rebate if taxable income <= ₹5L)
  if (taxableIncome <= 500000) {
    tax = 0;
  }

  const cess = Math.round(tax * 0.04);
  const totalTax = Math.round(tax + cess);

  return { grossIncome, totalDeductions, taxableIncome, incomeTax: Math.round(tax), cess, totalTax };
}

function calculateNewRegimeTax(grossIncome) {
  // New Regime FY 2024-25 standard deduction: ₹75,000
  const stdDeduction = 75000;
  const taxableIncome = Math.max(0, grossIncome - stdDeduction);
  let tax = 0;

  if (taxableIncome > 1500000) {
    tax += (taxableIncome - 1500000) * 0.30 + 150000;
  } else if (taxableIncome > 1200000) {
    tax += (taxableIncome - 1200000) * 0.20 + 90000;
  } else if (taxableIncome > 900000) {
    tax += (taxableIncome - 900000) * 0.15 + 45000;
  } else if (taxableIncome > 600000) {
    tax += (taxableIncome - 600000) * 0.10 + 15000;
  } else if (taxableIncome > 300000) {
    tax += (taxableIncome - 300000) * 0.05;
  }

  // Section 87A rebate for New Regime (Full rebate if taxable income <= ₹7L)
  if (taxableIncome <= 700000) {
    tax = 0;
  }

  const cess = Math.round(tax * 0.04);
  const totalTax = Math.round(tax + cess);

  return { grossIncome, totalDeductions: stdDeduction, taxableIncome, incomeTax: Math.round(tax), cess, totalTax };
}

function calculateTaxComparison() {
  const grossIncome = calculateGrossAnnualIncome();
  const deductionsSummary = calculateTaxDeductionsSummary();
  const oldRegime = calculateOldRegimeTax(grossIncome, deductionsSummary.totalDeductions);
  const newRegime = calculateNewRegimeTax(grossIncome);

  const recommendedRegime = oldRegime.totalTax <= newRegime.totalTax ? "Old Regime" : "New Regime";
  const taxSavings = Math.abs(oldRegime.totalTax - newRegime.totalTax);

  return { grossIncome, oldRegime, newRegime, recommendedRegime, taxSavings, recommendedTax: Math.min(oldRegime.totalTax, newRegime.totalTax) };
}

function renderAiTaxSuggestionsPage() {
  const analysis = generateAiTaxSuggestions();
  const currentTax = analysis.currentTax;
  const potentialTax = analysis.potentialTax;
  const savings = analysis.totalPotentialSavings;

  return `
    <section class="ai-tax-suggestions-container">
      <div class="ai-tax-hero-card">
        <div class="ai-hero-metrics">
          <div>
            <span>Current Tax</span>
            <h3>${money(currentTax)}</h3>
          </div>
          <div class="hero-arrow">→</div>
          <div>
            <span>Potential Tax</span>
            <h3 class="green-text">${money(potentialTax)}</h3>
          </div>
          <div class="hero-divider"></div>
          <div>
            <span>Potential Savings</span>
            <h2>${money(savings)}</h2>
          </div>
        </div>
        <p class="disclaimer-text">ℹ️ <strong>Compliance Note:</strong> Suggestions identify unutilized tax-saving opportunities under applicable Indian Income Tax Act provisions. This is not investment advice.</p>
      </div>

      <div class="ai-recommendations-list">
        ${analysis.items.length === 0 ? `
          <div class="empty-state-card">
            <h3>🎉 Maximum Tax Efficiency Achieved!</h3>
            <p>You have fully utilized all available tax deductions under current tax provisions. No unutilized deduction gaps detected.</p>
          </div>
        ` : analysis.items.map(rec => `
          <article class="recommendation-card priority-${rec.priority.toLowerCase()}">
            <div class="rec-card-head">
              <div>
                <span class="priority-badge priority-${rec.priority.toLowerCase()}">${rec.priority} Priority</span>
                <h3>${escapeHtml(rec.title)}</h3>
              </div>
              <div class="rec-savings-tag">Est. Tax Saving: <strong>${money(rec.taxSaving)}</strong></div>
            </div>

            <p class="rec-why">${escapeHtml(rec.why)}</p>

            <div class="rec-metrics-grid">
              <div>
                <small>Unused Limit / Opportunity</small>
                <strong>${money(rec.unutilizedAmount)}</strong>
              </div>
              <div>
                <small>Max Section Limit</small>
                <strong>${money(rec.maxLimit)}</strong>
              </div>
              <div>
                <small>Est. Tax Rate Benefit</small>
                <strong>${rec.marginalTaxRate}%</strong>
              </div>
            </div>
          </article>
        `).join("")}
      </div>
    </section>
  `;
}

function generateAiTaxSuggestions() {
  const inc = state.incomeDetails || {};
  const ded = state.taxDeductions || {};
  const comp = calculateTaxComparison();

  // Determine current tax baseline
  const currentTax = comp.recommendedTax;
  
  // Calculate marginal tax slab rate (estimate 20% or 30% depending on taxable income)
  const taxableIncome = comp.oldRegime.taxableIncome;
  let marginalRate = 0.20;
  if (taxableIncome > 1000000) marginalRate = 0.30;
  else if (taxableIncome <= 500000) marginalRate = 0.05;

  const current80C = Number(ded.sec80C) || 0;
  const current80CCD1B = Number(ded.sec80CCD1B) || 0;
  const current80D = Number(ded.sec80D) || 0;
  const currentHomeLoan = Number(ded.homeLoanInterest) || 0;

  const max80C = 150000;
  const max80CCD1B = 50000;
  const max80D = 75000;
  const maxHomeLoan = 200000;

  const recommendations = [];

  // Check 80C
  if (current80C < max80C) {
    const unutilized = max80C - current80C;
    const estSaving = Math.round(unutilized * marginalRate * 1.04);
    recommendations.push({
      title: `Increase Section 80C Investment by ${money(unutilized)}`,
      why: `You have currently claimed ${money(current80C)} out of the eligible ${money(max80C)} limit under Section 80C (PPF, ELSS, EPF, Life Insurance). Maximizing this section reduces your net taxable income.`,
      maxLimit: max80C,
      unutilizedAmount: unutilized,
      taxSaving: estSaving,
      marginalTaxRate: Math.round(marginalRate * 100),
      priority: unutilized >= 50000 ? "High" : "Medium"
    });
  }

  // Check 80CCD(1B)
  if (current80CCD1B < max80CCD1B) {
    const unutilized = max80CCD1B - current80CCD1B;
    const estSaving = Math.round(unutilized * marginalRate * 1.04);
    recommendations.push({
      title: `Claim Additional ${money(unutilized)} Deduction under Section 80CCD(1B) (NPS)`,
      why: `Section 80CCD(1B) provides an exclusive additional deduction of up to ${money(max80CCD1B)} for National Pension System (NPS) contributions over and above Section 80C. You currently claim ${money(current80CCD1B)}.`,
      maxLimit: max80CCD1B,
      unutilizedAmount: unutilized,
      taxSaving: estSaving,
      marginalTaxRate: Math.round(marginalRate * 100),
      priority: "High"
    });
  }

  // Check 80D
  if (current80D < max80D) {
    const unutilized = max80D - current80D;
    const estSaving = Math.round(unutilized * marginalRate * 1.04);
    recommendations.push({
      title: `Utilize Health Insurance Deduction under Section 80D (Up to ${money(unutilized)} remaining)`,
      why: `You have claimed ${money(current80D)} out of the allowable ${money(max80D)} for Health Insurance Premiums (covering Self, Family & Senior Citizen Parents).`,
      maxLimit: max80D,
      unutilizedAmount: unutilized,
      taxSaving: estSaving,
      marginalTaxRate: Math.round(marginalRate * 100),
      priority: current80D === 0 ? "High" : "Medium"
    });
  }

  // Check Home Loan Interest Section 24b
  if (currentHomeLoan < maxHomeLoan) {
    const unutilized = maxHomeLoan - currentHomeLoan;
    const estSaving = Math.round(unutilized * marginalRate * 1.04);
    recommendations.push({
      title: `Claim Home Loan Interest under Section 24(b) (Up to ${money(unutilized)} remaining)`,
      why: `Interest paid on self-occupied house property loans is deductible up to ${money(maxHomeLoan)} annually. Current claimed amount is ${money(currentHomeLoan)}.`,
      maxLimit: maxHomeLoan,
      unutilizedAmount: unutilized,
      taxSaving: estSaving,
      marginalTaxRate: Math.round(marginalRate * 100),
      priority: "Low"
    });
  }

  const totalPotentialSavings = recommendations.reduce((sum, item) => sum + item.taxSaving, 0);
  const potentialTax = Math.max(0, currentTax - totalPotentialSavings);

  return { currentTax, potentialTax, totalPotentialSavings, items: recommendations };
}

function renderShareWithCaPage() {
  const inc = state.incomeDetails || {};
  const deds = calculateTaxDeductionsSummary();
  const comp = calculateTaxComparison();
  const ai = generateAiTaxSuggestions();
  const docs = state.documents || [];
  const uploadedDocsCount = taxRequiredDocs.filter(item => taxDocumentFor(item.name)).length;

  return `
    <section class="share-ca-container">
      <div class="ca-hero-card">
        <div>
          <span>Chartered Accountant Tax Vault Package</span>
          <h2>Share Complete Tax Dossier with CA</h2>
          <p>Package includes your Personal Details, Income Breakdown, Claimed Deductions, Tax Comparisons, AI Tax Suggestions & all ${uploadedDocsCount} Uploaded Tax Proof Documents.</p>
        </div>
        <div class="ca-actions-group">
          <button class="primary-ca-btn" type="button" data-download-ca-zip>📦 Download ZIP Package</button>
          <button class="secondary-ca-btn" type="button" data-download-ca-pdf>📄 Download PDF Summary</button>
          <button class="outline-ca-btn" type="button" data-share-ca-email>✉️ Share with CA</button>
        </div>
      </div>

      <div class="ca-preview-grid">
        <article class="ca-preview-card">
          <div class="ca-preview-head">
            <h3>Tax Dossier Overview</h3>
            <span class="preview-status-badge">CA-Ready</span>
          </div>

          <div class="ca-preview-sections">
            <div class="preview-section-item">
              <strong>Personal & Account Details</strong>
              <p>Name: <b>${escapeHtml(activeUser?.name || "Valued Client")}</b> | Email: <b>${escapeHtml(activeUser?.email || "N/A")}</b> | PAN / Identity Attached: <b>${taxDocumentFor("PAN Card") ? "Yes" : "Pending"}</b></p>
            </div>

            <div class="preview-section-item">
              <strong>Income Details</strong>
              <p>Gross Income: <b>${money(comp.grossIncome)}</b> | Basic: <b>${money(inc.basicSalary)}</b> | HRA: <b>${money(inc.hra)}</b> | Special Allowance: <b>${money(inc.specialAllowance)}</b></p>
            </div>

            <div class="preview-section-item">
              <strong>Deductions Claimed</strong>
              <p>Total Claimed: <b>${money(deds.totalDeductions)}</b> | 80C: <b>${money(ded.sec80C)}</b> | 80CCD(1B): <b>${money(ded.sec80CCD1B)}</b> | 80D: <b>${money(ded.sec80D)}</b></p>
            </div>

            <div class="preview-section-item">
              <strong>Tax Calculation</strong>
              <p>Recommended: <b>${comp.recommendedRegime}</b> | Net Tax: <b>${money(comp.recommendedTax)}</b> | Taxable Income: <b>${money(deds.taxableIncome)}</b></p>
            </div>

            <div class="preview-section-item">
              <strong>Suggested Tax Savings</strong>
              <p>Potential Savings: <b>${money(ai.totalPotentialSavings)}</b> across <b>${ai.items.length} unutilized tax opportunities</b>.</p>
            </div>

            <div class="preview-section-item">
              <strong>Uploaded Documents Attached (${uploadedDocsCount})</strong>
              <p>${docs.map(d => d.fileName || d.name).slice(0, 5).join(", ") || "No files uploaded yet"}${docs.length > 5 ? ` +${docs.length - 5} more` : ""}</p>
            </div>
          </div>
        </article>
      </div>

      <!-- Success Screen Dialog / Card -->
      <div class="ca-success-overlay" id="ca-success-overlay" hidden>
        <div class="ca-success-card">
          <div class="success-icon-check">✓</div>
          <h2>CA Tax Package Generated Successfully!</h2>
          <p id="ca-success-message">Your ZIP package containing all uploaded tax documents and structured summary reports has been generated.</p>
          <div class="success-actions">
            <button type="button" class="primary-action" id="close-ca-success">Close</button>
          </div>
        </div>
      </div>
    </section>
  `;
}

async function downloadCaZipPackage() {
  try {
    saveStateLabel.textContent = "Generating CA ZIP package...";
    const token = localStorage.getItem(tokenKey);
    const response = await fetch(`${localApiBase}/api/wealth/ca-package`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!response.ok) throw new Error("Failed to generate ZIP package");
    
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "Wealth_OS_CA_Tax_Package.zip";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    // Show Success Screen
    showCaSuccessScreen("Your ZIP package containing all uploaded tax documents, income breakdown, and deduction summaries has been downloaded.");
  } catch (error) {
    alert(error.message || "Failed to download CA package ZIP.");
  } finally {
    saveStateLabel.textContent = "Saved";
  }
}

function downloadCaPdfSummary() {
  const inc = state.incomeDetails || {};
  const deds = calculateTaxDeductionsSummary();
  const comp = calculateTaxComparison();
  const ai = generateAiTaxSuggestions();
  const docs = state.documents || [];

  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    alert("Please allow popups to generate the printable PDF summary.");
    return;
  }

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Tax Summary Report - ${escapeHtml(activeUser?.name || "Client")}</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #111; line-height: 1.6; }
        h1 { font-size: 24px; color: #0a1118; margin-bottom: 5px; border-bottom: 2px solid #0a1118; padding-bottom: 8px; }
        .subtitle { font-size: 13px; color: #555; margin-bottom: 25px; }
        .section { margin-bottom: 25px; background: #f9fbfb; padding: 18px; border-radius: 8px; border: 1px solid #e1e8ed; }
        .section h2 { font-size: 16px; margin-top: 0; color: #1e5e4e; border-bottom: 1px solid #dcdcdc; padding-bottom: 6px; }
        .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; font-size: 14px; }
        .row { display: flex; justify-content: space-between; padding: 4px 0; font-size: 13px; border-bottom: 1px dashed #eee; }
        .total-highlight { background: #0a1118; color: #fff; padding: 12px 18px; border-radius: 6px; margin-top: 15px; font-size: 16px; display: flex; justify-content: space-between; font-weight: bold; }
        .rec-item { margin-bottom: 8px; font-size: 13px; background: #fff; padding: 10px; border-radius: 6px; border: 1px solid #e5e5e5; }
      </style>
    </head>
    <body>
      <h1>INCOME TAX PREPARATION SUMMARY</h1>
      <div class="subtitle">Prepared for Chartered Accountant Review | Generated on ${new Date().toLocaleDateString("en-IN")}</div>

      <div class="section">
        <h2>1. Personal Details</h2>
        <div class="grid">
          <div><strong>Full Name:</strong> ${escapeHtml(activeUser?.name || "Valued Client")}</div>
          <div><strong>Email:</strong> ${escapeHtml(activeUser?.email || "N/A")}</div>
          <div><strong>Identity Document:</strong> ${taxDocumentFor("PAN Card") ? "PAN Attached" : "Pending"}</div>
          <div><strong>Assessment Year:</strong> 2025-26 (FY 2024-25)</div>
        </div>
      </div>

      <div class="section">
        <h2>2. Income Details</h2>
        <div class="row"><span>Basic Salary</span><strong>${money(inc.basicSalary)}</strong></div>
        <div class="row"><span>House Rent Allowance (HRA)</span><strong>${money(inc.hra)}</strong></div>
        <div class="row"><span>Special Allowance</span><strong>${money(inc.specialAllowance)}</strong></div>
        <div class="row"><span>Bonus</span><strong>${money(inc.bonus)}</strong></div>
        <div class="row"><span>Employer PF Contribution</span><strong>${money(inc.employerPf)}</strong></div>
        <div class="row"><span>Other Income & Interest</span><strong>${money((Number(inc.otherIncome) || 0) + (Number(inc.bankInterest) || 0))}</strong></div>
        <div class="total-highlight" style="background:#2c3a44;"><span>GROSS ANNUAL INCOME</span><span>${money(comp.grossIncome)}</span></div>
      </div>

      <div class="section">
        <h2>3. Deductions Summary</h2>
        <div class="row"><span>Section 80C (PPF, ELSS, EPF, LIC)</span><strong>${money(state.taxDeductions?.sec80C)}</strong></div>
        <div class="row"><span>Section 80CCD(1B) (NPS Additional)</span><strong>${money(state.taxDeductions?.sec80CCD1B)}</strong></div>
        <div class="row"><span>Section 80D (Health Insurance)</span><strong>${money(state.taxDeductions?.sec80D)}</strong></div>
        <div class="row"><span>Section 24(b) (Home Loan Interest)</span><strong>${money(state.taxDeductions?.homeLoanInterest)}</strong></div>
        <div class="row"><span>Standard Deduction</span><strong>${money(50000)}</strong></div>
        <div class="total-highlight" style="background:#1e5e4e;"><span>TOTAL DEDUCTIONS CLAIMED</span><span>${money(deds.totalDeductions)}</span></div>
      </div>

      <div class="section">
        <h2>4. Tax Calculation & Regime Comparison</h2>
        <div class="row"><span>Old Regime Tax Liability</span><strong>${money(comp.oldRegime.totalTax)}</strong></div>
        <div class="row"><span>New Regime Tax Liability</span><strong>${money(comp.newRegime.totalTax)}</strong></div>
        <div class="total-highlight"><span>RECOMMENDED OPTION (${comp.recommendedRegime.toUpperCase()})</span><span>${money(comp.recommendedTax)}</span></div>
      </div>

      <div class="section">
        <h2>5. Suggested Tax Savings Opportunities</h2>
        ${ai.items.map(rec => `
          <div class="rec-item">
            <strong>${escapeHtml(rec.title)}</strong> (Est. Saving: ${money(rec.taxSaving)})<br>
            <small style="color:#555;">${escapeHtml(rec.why)}</small>
          </div>
        `).join("")}
      </div>

      <script>
        window.onload = function() { window.print(); };
      </script>
    </body>
    </html>
  `;

  printWindow.document.write(htmlContent);
  printWindow.document.close();

  // Show Success Screen
  showCaSuccessScreen("Your PDF summary report has been compiled and opened for printing or PDF export.");
}

function shareCaViaEmail() {
  const subject = encodeURIComponent(`Tax Documents & Summary Package - ${activeUser?.name || "Client"}`);
  const body = encodeURIComponent(`Dear CA,\n\nPlease find attached my tax preparation dossier for FY 2024-25.\n\nGross Income: ${money(calculateGrossAnnualIncome())}\nTotal Deductions: ${money(calculateTaxDeductionsSummary().totalDeductions)}\nRecommended Regime: ${calculateTaxComparison().recommendedRegime}\n\nThank you.`);
  window.location.href = `mailto:?subject=${subject}&body=${body}`;

  showCaSuccessScreen("Your default email client has been opened with pre-filled tax details to email your CA!");
}

function showCaSuccessScreen(msg) {
  const overlay = document.querySelector("#ca-success-overlay");
  const msgEl = document.querySelector("#ca-success-message");
  if (msgEl) msgEl.textContent = msg;
  if (overlay) overlay.hidden = false;
}

function calculateTaxDeductionsSummary() {
  const inc = state.incomeDetails || {};
  const ded = state.taxDeductions || {};
  const grossIncome = calculateGrossAnnualIncome();

  const sec80C = Math.min(150000, Number(ded.sec80C) || 0);
  const sec80CCD1B = Math.min(50000, Number(ded.sec80CCD1B) || 0);
  const sec80D = Math.min(75000, Number(ded.sec80D) || 0);
  const homeLoanInt = Math.min(200000, Number(ded.homeLoanInterest) || 0);
  const profTax = Math.min(2500, Number(ded.profTax) || Number(inc.professionalTax) || 0);
  const standardDeduction = 50000;

  const totalDeductions = sec80C + sec80CCD1B + sec80D + homeLoanInt + profTax + standardDeduction;
  const taxableIncome = Math.max(0, grossIncome - totalDeductions);

  return { grossIncome, totalDeductions, taxableIncome };
}

function renderTaxChecklistPage(uploaded, total) {
  const percent = total ? Math.round((uploaded / total) * 100) : 0;
  return `
    <section class="tax-doc-hero">
      <div>
        <span>CA-ready salaried tax file</span>
        <strong>${uploaded} of ${total} Documents Uploaded</strong>
        <p>Keep PAN, Aadhaar, Form 16, salary slips, AIS, 26AS, investment proofs, insurance receipts and optional deductions in one clean checklist.</p>
      </div>
      <div class="tax-progress-ring" style="--tax-progress:${percent}%">
        <b>${percent}%</b>
        <small>complete</small>
      </div>
    </section>
    ${taxDocumentGroups.map(([group, names]) => taxDocumentGroupCard(group, names)).join("")}
  `;
}

function calculateGrossAnnualIncome() {
  const inc = state.incomeDetails || {};
  const sumKeys = [
    "basicSalary", "hra", "specialAllowance", "bonus", "otherAllowances",
    "employerPf", "otherIncome", "bankInterest", "dividendIncome", "rentalIncome"
  ];
  return sumKeys.reduce((total, key) => total + (Number(inc[key]) || 0), 0);
}

function taxDocumentGroupCard(group, names) {
  const uploaded = names.filter(name => taxDocumentFor(name)).length;
  return `
    <section class="tax-doc-group">
      <div class="tax-doc-group-head">
        <div>
          <span>${escapeHtml(group)}</span>
          <strong>${uploaded}/${names.length} uploaded</strong>
        </div>
      </div>
      <div class="tax-doc-grid">
        ${names.map(name => taxDocumentCard(group, name)).join("")}
      </div>
    </section>
  `;
}

function taxDocumentCard(group, name) {
  const doc = taxDocumentFor(name);
  const status = doc ? (/verified/i.test(doc.status || "") ? "Verified" : "Uploaded") : "Pending";
  return `
    <article class="tax-doc-card ${doc ? "uploaded" : "pending"} ${status === "Verified" ? "verified" : ""}">
      <div>
        <span>${escapeHtml(group.replace(" (Optional)", ""))}</span>
        <strong>${escapeHtml(name)}</strong>
        <small class="tax-status">${escapeHtml(status)}</small>
      </div>
      <div class="tax-doc-actions">
        ${doc ? `
          <button type="button" data-edit="documents" data-id="${escapeAttribute(doc.id)}">Replace</button>
          ${doc.fileId ? `<button type="button" data-preview-file="${escapeAttribute(doc.fileId)}" data-file-name="${escapeAttribute(doc.fileName || doc.name)}">Preview</button>` : `<button type="button" data-edit="documents" data-id="${escapeAttribute(doc.id)}">Preview</button>`}
          <button class="danger" type="button" data-delete-tax-doc="${escapeAttribute(doc.id)}">Delete</button>
        ` : `
          <button type="button" data-add="documents" data-prefill-name="${escapeAttribute(name)}" data-prefill-type="${escapeAttribute(group.replace(" (Optional)", ""))}" data-prefill-linked="Tax Filing" data-prefill-required="Tax Documents">Upload</button>
        `}
      </div>
    </article>
  `;
}

function taxDocumentFor(name) {
  return state.documents.find(doc => {
    const text = `${doc.name} ${doc.type} ${doc.requiredFor} ${doc.linkedTo}`.toLowerCase();
    return text.includes(name.toLowerCase()) || sameDoc(doc.name, name) || sameDoc(doc.type, name);
  });
}

function deleteTaxDocument(docId) {
  const doc = state.documents.find(item => item.id === docId);
  if (!doc) return;
  const confirmed = window.confirm(`Delete "${doc.name || "this tax document"}"?`);
  if (!confirmed) return;
  state.documents = state.documents.filter(item => item.id !== docId);
  addActivity("Tax document deleted", doc.name || "Tax document");
  scheduleSave();
  renderTaxDocuments();
}

function missingDocumentCards() {
  const missing = missingDocuments();
  if (!missing.length) return `<div class="empty-state">No obvious document gaps found.</div>`;
  return missing.map(([name, linkedTo]) => `
    <button class="record-card" type="button" data-add="documents" data-prefill-name="${escapeAttribute(name)}" data-prefill-linked="${escapeAttribute(linkedTo)}">
      <span class="record-icon"></span>
      <span>
        <strong>${escapeHtml(name)}</strong>
        <small>Needed for ${escapeHtml(linkedTo)}</small>
      </span>
    </button>
  `).join("");
}

function allocationCards() {
  const rows = allocationRows();
  if (!rows.length) return `<div class="empty-state">Add assets to see allocation.</div>`;
  return rows.map(row => `
    <div class="allocation-row">
      <span><strong>${escapeHtml(row.label)}</strong><small>${money(row.value)} - ${row.percent}%</small></span>
      <i><b style="width:${row.percent}%"></b></i>
    </div>
  `).join("");
}

function calculatorCards() {
  const data = totals();
  const emergencyMonths = state.cash.expenses ? Math.round((Math.max(0, data.cashFlow) / state.cash.expenses) * 10) / 10 : 0;
  const carEmi = 92000;
  const projectedDebt = state.cash.income ? Math.round(((data.emi + carEmi) / state.cash.income) * 100) : 0;
  return `
    <div class="calculator-grid">
      <div class="calc-card"><span>Emergency Buffer</span><strong>${emergencyMonths} months</strong><small>Based on monthly surplus vs expenses</small></div>
      <div class="calc-card"><span>Car Affordability</span><strong>${projectedDebt}% debt load</strong><small>Assumes INR 92k new EMI</small></div>
      <div class="calc-card"><span>Stale Values</span><strong>${staleValues().length}</strong><small>Update old manual valuations</small></div>
    </div>
  `;
}

function actionChecklistCards() {
  const actions = nextActions();
  if (!actions.length) return `<div class="empty-state">Everything important looks covered.</div>`;
  return `<div class="checklist-grid">${actions.map(action => `
    <div class="checklist-row static-record complete">
      <span></span>
      <strong>${escapeHtml(action)}</strong>
      <small>Action</small>
    </div>
  `).join("")}</div>`;
}

function reminderCards() {
  const items = [...(state.alerts || [])]
    .filter(item => item.date)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 6);
  if (!items.length) return `<div class="empty-state">No reminders yet. Add one from any asset detail page.</div>`;
  return items.map(item => recordButton("alerts", item)).join("");
}

function activityCards() {
  const items = (state.activity || []).slice(-5).reverse();
  if (!items.length) return `<div class="empty-state">No activity yet. Your saved changes will appear here.</div>`;
  return items.map(item => `
    <div class="record-card static-record">
      <span class="record-icon"></span>
      <span>
        <strong>${escapeHtml(item.label || "Activity")}</strong>
        <small>${escapeHtml(item.detail || "")}</small>
      </span>
    </div>
  `).join("");
}

function describeItem(collection, item) {
  if (collection === "assets") {
    const source = item.valuationBasis ? "estimated" : "manual";
    return `${item.type || "Asset"} - ${money(item.value)} ${source}${item.owner ? ` - ${item.owner}` : ""}`;
  }
  if (collection === "liabilities") return `${money(item.value)} outstanding - EMI ${money(item.emi)}${item.lender ? ` - ${item.lender}` : ""}`;
  if (collection === "documents") return `${item.type || "Document"} - ${item.fileName || (item.expiry ? `expires ${item.expiry}` : item.status || "Stored")}`;
  if (collection === "alerts") return `${item.priority || "Normal"} - due ${item.date || "unscheduled"}${item.linkedTo ? ` - ${item.linkedTo}` : ""}`;
  if (collection === "family") return `${item.relation || "Member"} - ${item.access || "No access"}${item.email ? ` - ${item.email}` : ""}`;
  if (collection === "goals") return `${Math.round((Number(item.saved || 0) / Number(item.target || 1)) * 100)}% - ${money(item.saved)} saved${item.deadline ? ` - ${item.deadline}` : ""}`;
  return "";
}

function openModal(collection, id = null, options = {}) {
  modalContext = { collection, id, assetType: options.assetType || null };
  const record = id ? state[collection].find(item => item.id === id) : {};
  const fieldSet = collection === "assets"
    ? assetFieldSets[options.assetType || record?.type] || fields.assets
    : fields[collection];
  document.querySelector("#entry-kicker").textContent = id ? "Edit record" : "Add record";
  document.querySelector("#entry-title").textContent = collection === "assets" && (options.assetType || record?.type)
    ? options.assetType || record?.type
    : collectionLabel(collection);
  deleteButton.hidden = !id;
  fieldHost.innerHTML = renderFieldSet(collection, fieldSet, record, Boolean(id));
  fieldHost.insertAdjacentHTML("afterbegin", formStepGuide(collection));
  if (collection === "assets" && !id) {
    fieldHost.insertAdjacentHTML("afterbegin", `
      <div class="guided-questions">
        <strong>Quick questions</strong>
        <span>1. What is it?</span>
        <span>2. What did you spend?</span>
        <span>3. When did you buy it?</span>
      </div>
    `);
  }
  if (collection === "assets" && (options.assetType || record?.type) && !fieldSet.some(([key]) => key === "type")) {
    fieldHost.insertAdjacentHTML("beforeend", `<input type="hidden" name="type" value="${escapeAttribute(options.assetType || record?.type)}">`);
  }
  if (collection === "assets") {
    const currentAssetType = options.assetType || record?.type || "";
    const isInvestmentForm = currentAssetType === "Investment Assets";
    const isVehicleForm = currentAssetType === "Car";
    const isWatchForm = currentAssetType === "Watches";
    fieldHost.insertAdjacentHTML("beforeend", `
      ${isInvestmentForm ? "" : `<button class="estimate-button" type="button" data-estimate-current-value>Estimate current value</button>`}
      ${isWatchForm ? `<button class="estimate-button watch-market-button" type="button" data-fetch-watch-market>Fetch watch market value</button>` : ""}
      <div class="valuation-note" id="valuation-note">${isInvestmentForm
        ? "Investment value is calculated automatically: quantity x current price. Cost basis is quantity x buy price + fees. CSV columns supported: Ticker, Buy Date, Buy Price, Quantity, Fees, Owner, Asset Type, Sector, Tags."
        : record?.valuationBasis ? escapeHtml(record.valuationBasis) : isVehicleForm
          ? "Spinny-style estimate: buying price, car age, kilometers, owner number, condition, and demand decide the resale price."
          : isWatchForm
            ? "Watch market estimate: brand, model, reference number, purchase price, condition, and box/papers are used with live resale signals when available."
          : "Uses fair value, depreciation/appreciation, condition, transaction costs, and liquidity haircut to estimate realizable value."}</div>
      <input type="hidden" name="valuationBasis" value="${escapeAttribute(record?.valuationBasis || "")}">
      <input type="hidden" name="vehicleValuationJson" value="${escapeAttribute(record?.vehicleValuationJson || "")}">
      <input type="hidden" name="watchMarketJson" value="${escapeAttribute(record?.watchMarketJson || "")}">
      <input type="hidden" name="estimatedValueDate" value="${escapeAttribute(record?.estimatedValueDate || "")}">
      <input type="hidden" name="valuationLow" value="${escapeAttribute(record?.valuationLow || "")}">
      <input type="hidden" name="valuationHigh" value="${escapeAttribute(record?.valuationHigh || "")}">
      <input type="hidden" name="valuationConfidence" value="${escapeAttribute(record?.valuationConfidence || "")}">
      <label>
        Asset photo
        <input name="photo" type="file" accept="image/png,image/jpeg,image/webp">
      </label>
    `);
    if (record?.photoName) {
      fieldHost.insertAdjacentHTML("beforeend", `<div class="file-chip">Photo: ${escapeHtml(record.photoName)}</div>`);
    }
  }
  if (collection === "documents" && record?.fileName) {
    fieldHost.insertAdjacentHTML("beforeend", `<div class="file-chip">Attached: ${escapeHtml(record.fileName)}</div>`);
  }
  modal.showModal();
}

function formStepGuide(collection) {
  if (collection === "assets") {
    return `
      <div class="form-steps">
        <span>Basic details</span>
        <span>Value</span>
        <span>Documents</span>
        <span>Reminder</span>
      </div>
    `;
  }
  if (collection === "documents") {
    return `
      <div class="form-steps">
        <span>Document</span>
        <span>Linked to</span>
        <span>Expiry</span>
      </div>
    `;
  }
  if (collection === "alerts") {
    return `
      <div class="form-steps">
        <span>Task</span>
        <span>Date</span>
        <span>Priority</span>
      </div>
    `;
  }
  return "";
}

function renderFieldSet(collection, fieldSet, record, isEditing) {
  const isCarFieldSet = collection === "assets" && fieldSet === assetFieldSets.Car;
  const visibleCount = isCarFieldSet ? fieldSet.length : collection === "assets" ? Math.min(6, fieldSet.length) : fieldSet.length;
  const primary = fieldSet.slice(0, visibleCount);
  const advanced = fieldSet.slice(visibleCount);
  const primaryFields = primary.map(field => renderField(field, record)).join("");
  if (!advanced.length) return primaryFields;
  return `
    ${primaryFields}
    <details class="advanced-fields" ${isEditing ? "open" : ""}>
      <summary>More details</summary>
      <div>${advanced.map(field => renderField(field, record)).join("")}</div>
    </details>
  `;
}

function renderField([key, label, type], record = {}) {
  return `
    <label>
      ${escapeHtml(label)}
      <input name="${key}" type="${type}" value="${type === "file" ? "" : escapeAttribute(record?.[key] ?? "")}" ${type === "number" ? "min=\"0\" step=\"any\"" : ""} ${type === "file" ? "accept=\"application/pdf,image/png,image/jpeg,image/webp\"" : ""}>
    </label>
  `;
}

function collectionLabel(collection) {
  return collection.replace(/^\w/, letter => letter.toUpperCase());
}

async function saveRecord(event) {
  event.preventDefault();
  const { collection, id } = modalContext;
  const existing = id ? state[collection].find(item => item.id === id) : null;
  const values = Object.fromEntries(new FormData(form).entries());
  const fieldSet = collection === "assets"
    ? assetFieldSets[modalContext.assetType || values.type] || fields.assets
    : fields[collection];
  fieldSet.forEach(([key, , type]) => {
    if (type === "number") values[key] = Number(values[key] || 0);
    if (type === "file") delete values[key];
  });
  if (collection === "assets" && modalContext.assetType) values.type = modalContext.assetType;
  if (collection === "assets" && (modalContext.assetType === "Investment Assets" || values.type === "Investment Assets")) {
    const investmentError = validateInvestmentValues(values, id);
    if (investmentError) {
      saveStateLabel.textContent = "Fix investment details";
      alert(investmentError);
      return;
    }
    const oldPrice = Number(existing?.currentPrice || 0);
    const newPrice = Number(values.currentPrice || 0);
    if (oldPrice > 0 && newPrice > 0 && Math.abs(newPrice - oldPrice) / oldPrice > 0.5) {
      const confirmed = window.confirm(`Current price changed by more than 50% for ${existing?.ticker || values.ticker}. Save anyway?`);
      if (!confirmed) return;
    }
    applyInvestmentDerivedValues(values);
  }
  const documentFileInput = form.querySelector('input[name="file"]');
  const photoFileInput = form.querySelector('input[name="photo"]');
  if (collection === "documents" && documentFileInput?.files?.[0]) {
    saveStateLabel.textContent = "Uploading...";
    const file = await uploadDocumentFile(documentFileInput.files[0]);
    values.fileId = file.id;
    values.fileName = file.name;
    values.fileUrl = file.url;
    values.status = values.status || "Uploaded";
    addActivity("Document uploaded", file.name);
  }
  if (collection === "assets") {
    delete values.photo;
    values.value = nonNegativeRupees(values.value);
    values.purchasePrice = nonNegativeRupees(values.purchasePrice);
    values.loanAmount = nonNegativeRupees(values.loanAmount);
    values.downPayment = nonNegativeRupees(values.downPayment);
    values.emiAmount = nonNegativeRupees(values.emiAmount);
    values.exchangeRate = nonNegativeNumber(values.exchangeRate);
    values.valuationLow = nonNegativeRupees(values.valuationLow);
    values.valuationHigh = nonNegativeRupees(values.valuationHigh);
    values.odometer = nonNegativeNumber(values.odometer);
    values.mileageKm = nonNegativeNumber(values.mileageKm || values.odometer);
    values.ownerCount = nonNegativeNumber(values.ownerCount);
    if (isVehicleAsset({ ...existing, ...values }) && values.purchasePrice > 0 && (!values.value || !values.valuationBasis)) {
      const vehicleEstimate = estimateAssetValue(values);
      if (vehicleEstimate) {
        values.value = values.value || vehicleEstimate.value;
        values.source = values.source || vehicleEstimate.label;
        values.valuationBasis = vehicleEstimate.basis;
        values.valuationLow = vehicleEstimate.low;
        values.valuationHigh = vehicleEstimate.high;
        values.valuationConfidence = vehicleEstimate.confidence;
        values.estimatedValueDate = values.estimatedValueDate || new Date().toISOString().slice(0, 10);
        if (vehicleEstimate.engineJson) values.vehicleValuationJson = JSON.stringify(vehicleEstimate.engineJson);
      }
    }
    if (isWatchAsset({ ...existing, ...values }) && values.purchasePrice > 0 && (!values.value || !values.valuationBasis)) {
      try {
        saveStateLabel.textContent = "Fetching watch market value...";
        const watchEstimate = await api("/api/wealth/watch-valuation", {
          method: "POST",
          body: JSON.stringify(values)
        });
        values.value = watchEstimate.value;
        values.source = watchEstimate.label;
        values.valuationBasis = watchEstimate.basis;
        values.watchMarketJson = JSON.stringify(watchEstimate);
        values.valuationLow = watchEstimate.low;
        values.valuationHigh = watchEstimate.high;
        values.valuationConfidence = watchEstimate.confidence;
        values.estimatedValueDate = values.estimatedValueDate || new Date().toISOString().slice(0, 10);
      } catch {
        const fallbackEstimate = estimateAssetValue(values);
        if (fallbackEstimate) {
          values.value = values.value || fallbackEstimate.value;
          values.source = values.source || fallbackEstimate.label;
          values.valuationBasis = fallbackEstimate.basis;
          values.valuationLow = fallbackEstimate.low;
          values.valuationHigh = fallbackEstimate.high;
          values.valuationConfidence = fallbackEstimate.confidence;
          values.estimatedValueDate = values.estimatedValueDate || new Date().toISOString().slice(0, 10);
        }
      }
    }
    if (photoFileInput?.files?.[0]) {
      saveStateLabel.textContent = "Uploading photo...";
      const photo = await uploadDocumentFile(photoFileInput.files[0]);
      values.photoId = photo.id;
      values.photoName = photo.name;
      values.photoUrl = photo.url;
      addActivity("Asset photo uploaded", photo.name);
    }
    const today = new Date().toISOString().slice(0, 10);
    const oldHistory = Array.isArray(existing?.valueHistory) ? existing.valueHistory : [];
    const nextValue = Number(values.value || 0);
    const oldValue = Number(existing?.value || 0);
    values.lastUpdated = values.lastUpdated || today;
    values.valueHistory = [...oldHistory];
    if (!existing && nextValue > 0) {
      values.valueHistory.push({ id: crypto.randomUUID(), value: nextValue, date: values.lastUpdated, note: values.valuationBasis ? "Estimated initial value" : "Initial value" });
    } else if (existing && nextValue !== oldValue) {
      values.valueHistory.push({ id: crypto.randomUUID(), value: nextValue, date: values.lastUpdated, note: values.valuationBasis ? "Estimated value" : "Manual update" });
    }
  }
  if (id) {
    state[collection] = state[collection].map(item => item.id === id ? { ...item, ...values } : item);
    addActivity(`${collectionLabel(collection)} updated`, values.name || "Record updated");
  } else {
    state[collection].push({ id: crypto.randomUUID(), ...values });
    addActivity(`${collectionLabel(collection)} added`, values.name || "New record");
  }
  scheduleSave();
  modal.close();
  if (collection === "assets") activeAssetCategory = assetCategoryForAsset(values) || activeAssetCategory;
  renderView(activeView);
}

function deleteRecord() {
  const { collection, id } = modalContext;
  if (!id) return;
  const record = state[collection].find(item => item.id === id);
  const confirmed = window.confirm(`Delete "${record?.name || "this record"}" from ${collectionLabel(collection)}?`);
  if (!confirmed) return;
  state[collection] = state[collection].filter(item => item.id !== id);
  addActivity(`${collectionLabel(collection)} deleted`, record?.name || "Record deleted");
  scheduleSave();
  modal.close();
  renderView(activeView);
}

function deleteAssetById(assetId) {
  const record = state.assets.find(item => item.id === assetId);
  if (!record) return;
  const confirmed = window.confirm(`Delete "${record.name || "this asset"}" from Assets? Linked documents will stay in the document vault.`);
  if (!confirmed) return;
  state.assets = state.assets.filter(item => item.id !== assetId);
  addActivity("Asset deleted", record.name || "Asset deleted");
  scheduleSave();
  renderView("assets");
}

function openCashEditor() {
  modalContext = { collection: "cash", id: "cash" };
  document.querySelector("#entry-kicker").textContent = "Edit monthly flow";
  document.querySelector("#entry-title").textContent = "Income & Expenses";
  deleteButton.hidden = true;
  fieldHost.innerHTML = `
    <label>Monthly income<input name="income" type="number" min="0" step="1" value="${state.cash.income}"></label>
    <label>Monthly expenses<input name="expenses" type="number" min="0" step="1" value="${state.cash.expenses}"></label>
    <div class="valuation-note">This is monthly flow. To add actual cash or bank balance, go to Assets > Cash.</div>
  `;
  modal.showModal();
}

function collectAssetFormValues() {
  const values = Object.fromEntries(new FormData(form).entries());
  if (modalContext.assetType) values.type = modalContext.assetType;
  form.querySelectorAll('input[type="number"]').forEach(input => {
    values[input.name] = Number(input.value || 0);
  });
  return values;
}

function estimateCurrentValueFromForm() {
  const values = collectAssetFormValues();
  const estimate = estimateAssetValue(values);
  const valueInput = form.querySelector('input[name="value"]');
  const basisInput = form.querySelector('input[name="valuationBasis"]');
  const dateInput = form.querySelector('input[name="estimatedValueDate"]');
  const lowInput = form.querySelector('input[name="valuationLow"]');
  const highInput = form.querySelector('input[name="valuationHigh"]');
  const confidenceInput = form.querySelector('input[name="valuationConfidence"]');
  const note = form.querySelector("#valuation-note");
  if (!estimate || !valueInput) {
    if (note) note.textContent = "Add purchase price first, then estimate current value.";
    return;
  }
  const today = new Date().toISOString().slice(0, 10);
  valueInput.value = estimate.value;
  if (basisInput) basisInput.value = estimate.basis;
  const vehicleJsonInput = form.querySelector('input[name="vehicleValuationJson"]');
  if (vehicleJsonInput && estimate.engineJson) vehicleJsonInput.value = JSON.stringify(estimate.engineJson);
  if (dateInput) dateInput.value = today;
  if (lowInput) lowInput.value = estimate.low;
  if (highInput) highInput.value = estimate.high;
  if (confidenceInput) confidenceInput.value = estimate.confidence;
  if (note) note.textContent = estimate.basis;
  const sourceInput = form.querySelector('input[name="source"]');
  if (sourceInput && !sourceInput.value) sourceInput.value = estimate.label;
}

async function fetchWatchMarketValueFromForm(force = true) {
  const values = collectAssetFormValues();
  const note = form.querySelector("#valuation-note");
  const valueInput = form.querySelector('input[name="value"]');
  if (!values.purchasePrice || !(values.name || values.brand || values.model || values.referenceNumber)) {
    if (note) note.textContent = "Add watch name/model/reference and purchase price first.";
    return null;
  }
  if (note) note.textContent = "Fetching current watch market signals...";
  try {
    const estimate = await api(`/api/wealth/watch-valuation${force ? "?refresh=1" : ""}`, {
      method: "POST",
      body: JSON.stringify(values)
    });
    applyWatchMarketEstimateToForm(estimate);
    return estimate;
  } catch (error) {
    if (note) note.textContent = "Live watch lookup is unavailable. Use Estimate current value for the fallback model.";
    return null;
  }
}

function applyWatchMarketEstimateToForm(estimate) {
  const valueInput = form.querySelector('input[name="value"]');
  const basisInput = form.querySelector('input[name="valuationBasis"]');
  const watchJsonInput = form.querySelector('input[name="watchMarketJson"]');
  const dateInput = form.querySelector('input[name="estimatedValueDate"]');
  const lowInput = form.querySelector('input[name="valuationLow"]');
  const highInput = form.querySelector('input[name="valuationHigh"]');
  const confidenceInput = form.querySelector('input[name="valuationConfidence"]');
  const sourceInput = form.querySelector('input[name="source"]');
  const note = form.querySelector("#valuation-note");
  if (valueInput) valueInput.value = estimate.value || 0;
  if (basisInput) basisInput.value = estimate.basis || "";
  if (watchJsonInput) watchJsonInput.value = JSON.stringify(estimate);
  if (dateInput) dateInput.value = new Date().toISOString().slice(0, 10);
  if (lowInput) lowInput.value = estimate.low || 0;
  if (highInput) highInput.value = estimate.high || 0;
  if (confidenceInput) confidenceInput.value = estimate.confidence || "";
  if (sourceInput) sourceInput.value = estimate.label || "Watch market estimate";
  if (note) note.textContent = `${estimate.label}: ${money(estimate.value)}. ${estimate.basis}`;
}

async function fetchWatchMarketValueForAsset(assetId) {
  const asset = state.assets.find(item => item.id === assetId);
  if (!asset) return null;
  saveStateLabel.textContent = "Fetching watch market value...";
  try {
    const estimate = await api("/api/wealth/watch-valuation?refresh=1", {
      method: "POST",
      body: JSON.stringify(asset)
    });
    const today = new Date().toISOString().slice(0, 10);
    asset.value = estimate.value;
    asset.source = estimate.label;
    asset.valuationBasis = estimate.basis;
    asset.watchMarketJson = JSON.stringify(estimate);
    asset.estimatedValueDate = today;
    asset.valuationLow = estimate.low;
    asset.valuationHigh = estimate.high;
    asset.valuationConfidence = estimate.confidence;
    asset.lastUpdated = today;
    asset.valueHistory = [
      ...(Array.isArray(asset.valueHistory) ? asset.valueHistory : []),
      { id: crypto.randomUUID(), value: estimate.value, date: today, note: "Watch market estimate" }
    ];
    addActivity("Watch market value fetched", `${asset.name}: ${money(estimate.value)}`);
    scheduleSave();
    renderAssetDetail(asset.id);
    return estimate;
  } catch (error) {
    saveStateLabel.textContent = "Watch market lookup unavailable.";
    return null;
  }
}

async function reestimateAssetValue(assetId) {
  const asset = state.assets.find(item => item.id === assetId);
  if (!asset) return;
  if (isWatchAsset(asset)) {
    const marketEstimate = await fetchWatchMarketValueForAsset(assetId);
    if (marketEstimate) return;
  }
  const estimate = estimateAssetValue(asset);
  if (!estimate) {
    saveStateLabel.textContent = "Add purchase price before estimating.";
    return;
  }
  const today = new Date().toISOString().slice(0, 10);
  asset.value = estimate.value;
  asset.source = estimate.label;
  asset.valuationBasis = estimate.basis;
  asset.estimatedValueDate = today;
  asset.valuationLow = estimate.low;
  asset.valuationHigh = estimate.high;
  asset.valuationConfidence = estimate.confidence;
  if (estimate.engineJson) asset.vehicleValuationJson = JSON.stringify(estimate.engineJson);
  asset.lastUpdated = today;
  asset.valueHistory = [
    ...(Array.isArray(asset.valueHistory) ? asset.valueHistory : []),
    { id: crypto.randomUUID(), value: estimate.value, date: today, note: "Estimated value" }
  ];
  addActivity("Asset value estimated", `${asset.name}: ${money(estimate.value)}`);
  scheduleSave();
  renderAssetDetail(asset.id);
}

function updateAssetValue(assetId) {
  const asset = state.assets.find(item => item.id === assetId);
  if (!asset) return;
  const isInvestment = isInvestmentAsset(asset);
  const raw = window.prompt(
    isInvestment ? `Current price per unit for ${asset.ticker || asset.name}` : `Current value for ${asset.name}`,
    String(isInvestment ? asset.currentPrice || "" : asset.value || "")
  );
  if (raw === null) return;
  const value = Number(raw);
  if (!Number.isFinite(value) || value < 0) {
    saveStateLabel.textContent = "Enter a valid value.";
    return;
  }
  const today = new Date().toISOString().slice(0, 10);
  if (isInvestment) {
    const oldPrice = Number(asset.currentPrice || 0);
    if (oldPrice > 0 && value > 0 && Math.abs(value - oldPrice) / oldPrice > 0.5) {
      const confirmed = window.confirm(`${asset.ticker || asset.name} changed by more than 50% (${money(oldPrice)} to ${money(value)}). Save this price?`);
      if (!confirmed) return;
    }
    const result = updateInvestmentPrice(asset, value, today, "Manual price update");
    if (result.error) {
      saveStateLabel.textContent = result.error;
      return;
    }
  } else {
    asset.value = value;
    asset.lastUpdated = today;
    asset.valueHistory = [
      ...(Array.isArray(asset.valueHistory) ? asset.valueHistory : []),
      { id: crypto.randomUUID(), value: asset.value, date: today, note: "Quick update" }
    ];
  }
  addActivity("Asset value updated", `${asset.name} is now ${money(asset.value)}`);
  scheduleSave();
  if (activeAssetCategory === "investments") {
    renderInvestmentCategory(assetCategoryViews.investments, state.assets.filter(assetCategoryViews.investments.matcher));
  } else {
    renderAssetDetail(asset.id);
  }
}

function updateInvestmentPrice(asset, price, date = new Date().toISOString().slice(0, 10), source = "Manual price update") {
  if (!asset || !isInvestmentAsset(asset)) return { error: "Investment holding not found." };
  const nextPrice = Number(price);
  if (!Number.isFinite(nextPrice) || nextPrice < 0) return { error: "Enter a valid current price." };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(date || ""))) return { error: "Enter a valid price date." };
  asset.currency = "INR";
  asset.exchangeRate = 1;
  asset.currentPrice = nextPrice;
  asset.value = roundRupees(Number(asset.quantity || 0) * nextPrice);
  asset.lastUpdated = date;
  asset.source = source;
  asset.valueHistory = [
    ...(Array.isArray(asset.valueHistory) ? asset.valueHistory : []),
    { id: crypto.randomUUID(), value: asset.value, date, note: `${source}: ${money(nextPrice)} per unit` }
  ];
  return { value: asset.value, currentPrice: asset.currentPrice };
}

function bulkUpdateInvestmentPrices() {
  const holdings = state.assets.filter(isInvestmentAsset);
  if (!holdings.length) {
    saveStateLabel.textContent = "Add an investment first.";
    return;
  }
  const example = holdings
    .slice(0, 3)
    .map(item => `${item.ticker || item.name}, ${item.currentPrice || ""}`)
    .join("\n");
  const pasted = window.prompt(
    [
      "Paste prices as one holding per line:",
      "Ticker, Current Price",
      "",
      example || "AAPL, 180"
    ].join("\n"),
    example
  );
  if (!pasted) return;
  const rows = pasted.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
  const today = new Date().toISOString().slice(0, 10);
  const changes = [];
  const errors = [];
  rows.forEach((line, index) => {
    const parts = splitCsvLine(line);
    const ticker = String(parts[0] || "").trim().toUpperCase();
    const price = Number(String(parts[1] || "").replace(/[^0-9.-]/g, ""));
    const date = /^\d{4}-\d{2}-\d{2}$/.test(String(parts[2] || "")) ? parts[2] : today;
    if (!ticker || !Number.isFinite(price) || price < 0) {
      errors.push(`Line ${index + 1}: use Ticker, Price`);
      return;
    }
    const matches = holdings.filter(item => String(item.ticker || item.name || "").trim().toUpperCase() === ticker);
    if (!matches.length) {
      errors.push(`Line ${index + 1}: ${ticker} not found`);
      return;
    }
    matches.forEach(asset => {
      const oldPrice = Number(asset.currentPrice || 0);
      if (oldPrice > 0 && price > 0 && Math.abs(price - oldPrice) / oldPrice > 0.5) {
        const confirmed = window.confirm(`${ticker} changed by more than 50% (${money(oldPrice)} to ${money(price)}). Save this price?`);
        if (!confirmed) return;
      }
      const result = updateInvestmentPrice(asset, price, date, "Bulk price update");
      if (result.error) {
        errors.push(`Line ${index + 1}: ${result.error}`);
        return;
      }
      changes.push(asset.ticker || asset.name || ticker);
    });
  });
  if (errors.length) {
    alert(`Some prices were not updated:\n${errors.slice(0, 8).join("\n")}`);
  }
  if (!changes.length) {
    saveStateLabel.textContent = "No investment prices updated.";
    return;
  }
  addActivity("Investment prices updated", `${changes.length} holding ${changes.length === 1 ? "price was" : "prices were"} updated`);
  saveStateLabel.textContent = `${changes.length} investment ${changes.length === 1 ? "price" : "prices"} updated.`;
  scheduleSave();
  renderInvestmentCategory(assetCategoryViews.investments, state.assets.filter(assetCategoryViews.investments.matcher));
}

function investmentLotKey(asset) {
  return [
    String(asset.ticker || asset.name || "").trim().toUpperCase(),
    String(asset.owner || "").trim().toLowerCase()
  ].join("|");
}

function matchingInvestmentLots(asset) {
  const key = investmentLotKey(asset);
  return state.assets
    .filter(item => isInvestmentAsset(item) && investmentLotKey(item) === key && Number(item.quantity || 0) > 0)
    .map(item => ({ asset: item, snapshot: investmentSnapshot(item) }));
}

function normalizedTaxLotMethod(method) {
  const text = String(method || "FIFO").trim().toUpperCase();
  if (text.includes("LIFO")) return "LIFO";
  if (text.includes("HIFO") || text.includes("HIGH")) return "HIFO";
  if (text.includes("AVERAGE")) return "AVERAGE";
  return "FIFO";
}

function sortInvestmentLots(lots, method) {
  const sorted = [...lots];
  if (method === "LIFO") {
    return sorted.sort((a, b) => String(b.asset.purchaseDate || b.asset.acquisitionDate || "").localeCompare(String(a.asset.purchaseDate || a.asset.acquisitionDate || "")));
  }
  if (method === "HIFO") {
    return sorted.sort((a, b) => b.snapshot.averageBuyPrice - a.snapshot.averageBuyPrice);
  }
  return sorted.sort((a, b) => String(a.asset.purchaseDate || a.asset.acquisitionDate || "").localeCompare(String(b.asset.purchaseDate || b.asset.acquisitionDate || "")));
}

function allocateInvestmentSale(asset, quantitySold, sellPrice, saleDate) {
  const method = normalizedTaxLotMethod(asset.taxLotMethod);
  const lots = matchingInvestmentLots(asset);
  const totalQuantity = roundToUnits(lots.reduce((sum, lot) => sum + lot.snapshot.quantity, 0));
  if (quantitySold > totalQuantity) return { error: "Cannot sell more units than you hold across matching lots." };
  const orderedLots = method === "AVERAGE" ? lots : sortInvestmentLots(lots, method);
  const totalCostBasis = lots.reduce((sum, lot) => sum + lot.snapshot.costBasis, 0);
  const averageCost = totalQuantity ? totalCostBasis / totalQuantity : 0;
  let remainingToSell = quantitySold;
  let costRemoved = 0;
  const allocations = [];

  orderedLots.forEach((lot, index) => {
    if (remainingToSell <= 0) return;
    const proportionalQuantity = method === "AVERAGE"
      ? (index === orderedLots.length - 1 ? remainingToSell : Math.min(lot.snapshot.quantity, roundToUnits(quantitySold * (lot.snapshot.quantity / totalQuantity))))
      : Math.min(lot.snapshot.quantity, remainingToSell);
    const sellFromLot = roundToUnits(Math.min(lot.snapshot.quantity, proportionalQuantity));
    if (sellFromLot <= 0) return;
    const costPerUnit = method === "AVERAGE" ? averageCost : (lot.snapshot.quantity ? lot.snapshot.costBasis / lot.snapshot.quantity : lot.snapshot.buyPrice);
    const lotCostRemoved = roundRupees(costPerUnit * sellFromLot);
    const newQuantity = roundToUnits(Number(lot.asset.quantity || 0) - sellFromLot);
    lot.asset.quantity = newQuantity;
    lot.asset.purchasePrice = Math.max(0, roundRupees(Number(lot.asset.purchasePrice || lot.snapshot.costBasis) - lotCostRemoved));
    lot.asset.value = roundRupees(newQuantity * Number(lot.asset.currentPrice || sellPrice));
    lot.asset.lastUpdated = saleDate || new Date().toISOString().slice(0, 10);
    lot.asset.valueHistory = [
      ...(Array.isArray(lot.asset.valueHistory) ? lot.asset.valueHistory : []),
      { id: crypto.randomUUID(), value: lot.asset.value, date: lot.asset.lastUpdated, note: `Sold ${sellFromLot} units using ${method}` }
    ];
    costRemoved += lotCostRemoved;
    remainingToSell = roundToUnits(remainingToSell - sellFromLot);
    allocations.push({
      lotId: lot.asset.lotId || lot.asset.id,
      name: lot.asset.name || lot.asset.ticker || "Lot",
      quantity: sellFromLot,
      costBasis: lotCostRemoved
    });
  });

  if (remainingToSell > 0.000001) return { error: "Sale could not be fully allocated across lots." };
  const proceeds = roundRupees(quantitySold * sellPrice);
  return {
    method,
    totalQuantity,
    proceeds,
    costRemoved: roundRupees(costRemoved),
    realizedGain: roundRupees(proceeds - costRemoved),
    allocations
  };
}

function recordInvestmentSale(assetId) {
  const asset = state.assets.find(item => item.id === assetId);
  if (!asset || !isInvestmentAsset(asset)) return;
  const quantitySold = Number(window.prompt(`How many units of ${asset.ticker || asset.name} did you sell?`, ""));
  if (!Number.isFinite(quantitySold) || quantitySold <= 0) {
    saveStateLabel.textContent = "Enter valid units sold.";
    return;
  }
  const lotQuantity = matchingInvestmentLots(asset).reduce((sum, lot) => sum + lot.snapshot.quantity, 0);
  if (quantitySold > lotQuantity) {
    saveStateLabel.textContent = "Cannot sell more units than you hold across matching lots.";
    return;
  }
  const sellPrice = Number(window.prompt("Sell price per unit", String(asset.currentPrice || "")));
  if (!Number.isFinite(sellPrice) || sellPrice < 0) {
    saveStateLabel.textContent = "Enter a valid sell price.";
    return;
  }
  const sellDate = window.prompt("Sell date (YYYY-MM-DD)", new Date().toISOString().slice(0, 10));
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(sellDate || ""))) {
    saveStateLabel.textContent = "Enter a valid sell date.";
    return;
  }
  const allocation = allocateInvestmentSale(asset, quantitySold, sellPrice, sellDate);
  if (allocation.error) {
    saveStateLabel.textContent = allocation.error;
    return;
  }
  asset.lastUpdated = sellDate;
  asset.investmentTransactions = [
    ...investmentTransactions(asset),
    {
      id: crypto.randomUUID(),
      type: "Sell",
      date: sellDate,
      quantity: quantitySold,
      price: sellPrice,
      proceeds: allocation.proceeds,
      costBasis: allocation.costRemoved,
      realizedGain: allocation.realizedGain,
      taxLotMethod: allocation.method,
      allocations: allocation.allocations,
      note: `Sold ${quantitySold} units at ${money(sellPrice)} using ${allocation.method}. ${allocation.allocations.map(row => `${row.quantity} from ${row.lotId}`).join("; ")}.`
    }
  ];
  addActivity("Investment sale recorded", `${asset.ticker || asset.name}: ${money(allocation.realizedGain)} realized P/L`);
  scheduleSave();
  renderAssetDetail(asset.id);
}

function applyInvestmentSplit(assetId) {
  const asset = state.assets.find(item => item.id === assetId);
  if (!asset || !isInvestmentAsset(asset)) return;
  const ratioText = window.prompt("Split ratio, e.g. 2:1 or 3:2", "2:1");
  const splitDate = window.prompt("Split date (YYYY-MM-DD)", new Date().toISOString().slice(0, 10));
  const result = applyInvestmentSplitToLots(asset, ratioText, splitDate);
  if (result.error) {
    saveStateLabel.textContent = result.error;
    return;
  }
  addActivity("Investment split applied", `${asset.ticker || asset.name}: ${ratioText} across ${result.updated} ${result.updated === 1 ? "lot" : "lots"}`);
  scheduleSave();
  renderAssetDetail(asset.id);
}

function parseInvestmentSplitRatio(ratioText) {
  const match = String(ratioText || "").match(/^\s*(\d+(?:\.\d+)?)\s*[:/]\s*(\d+(?:\.\d+)?)\s*$/);
  if (!match) return { error: "Enter split ratio like 2:1." };
  const numerator = Number(match[1]);
  const denominator = Number(match[2]);
  if (numerator <= 0 || denominator <= 0) return { error: "Split ratio must be positive." };
  return { factor: numerator / denominator, ratio: `${numerator}:${denominator}` };
}

function applyInvestmentSplitToLots(asset, ratioText, splitDate) {
  if (!asset || !isInvestmentAsset(asset)) return { error: "Investment holding not found." };
  const parsed = parseInvestmentSplitRatio(ratioText);
  if (parsed.error) return parsed;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(splitDate || ""))) return { error: "Enter a valid split date." };
  const lots = matchingInvestmentLots(asset);
  if (!lots.length) return { error: "No matching lots found for this split." };
  let valueBefore = 0;
  let valueAfter = 0;
  lots.forEach(lot => {
    const row = lot.asset;
    const beforeValue = Number(row.value || lot.snapshot.currentValue || 0);
    valueBefore += beforeValue;
    row.currency = "INR";
    row.exchangeRate = 1;
    row.quantity = roundToUnits(Number(row.quantity || 0) * parsed.factor);
    row.buyPrice = Number(row.buyPrice || 0) ? roundPrice(Number(row.buyPrice) / parsed.factor) : 0;
    row.currentPrice = Number(row.currentPrice || 0) ? roundPrice(Number(row.currentPrice) / parsed.factor) : 0;
    row.value = roundRupees(Number(row.quantity || 0) * Number(row.currentPrice || 0));
    row.corporateActions = [row.corporateActions, `${parsed.ratio} split on ${splitDate}`].filter(Boolean).join("; ");
    row.lastUpdated = splitDate;
    row.investmentTransactions = [
      ...investmentTransactions(row),
      {
        id: crypto.randomUUID(),
        type: "Split",
        date: splitDate,
        ratio: parsed.ratio,
        note: `Applied ${parsed.ratio} stock split. Quantity adjusted, buy/current prices adjusted.`
      }
    ];
    row.valueHistory = [
      ...(Array.isArray(row.valueHistory) ? row.valueHistory : []),
      { id: crypto.randomUUID(), value: row.value, date: splitDate, note: `${parsed.ratio} split` }
    ];
    valueAfter += row.value;
  });
  return {
    ratio: parsed.ratio,
    factor: parsed.factor,
    updated: lots.length,
    valueBefore: roundRupees(valueBefore),
    valueAfter: roundRupees(valueAfter)
  };
}

function addInvestmentDividend(assetId) {
  const asset = state.assets.find(item => item.id === assetId);
  if (!asset || !isInvestmentAsset(asset)) return;
  const amount = Number(window.prompt(`Dividend amount for ${asset.ticker || asset.name}`, ""));
  if (!Number.isFinite(amount) || amount < 0) {
    saveStateLabel.textContent = "Enter a valid dividend amount.";
    return;
  }
  const dividendDate = window.prompt("Dividend date (YYYY-MM-DD)", new Date().toISOString().slice(0, 10));
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(dividendDate || ""))) {
    saveStateLabel.textContent = "Enter a valid dividend date.";
    return;
  }
  asset.dividendsReceived = roundRupees(Number(asset.dividendsReceived || 0) + amount);
  asset.lastUpdated = dividendDate;
  asset.investmentTransactions = [
    ...investmentTransactions(asset),
    {
      id: crypto.randomUUID(),
      type: "Dividend",
      date: dividendDate,
      amount: roundRupees(amount),
      note: `Dividend received ${money(amount)}.`
    }
  ];
  addActivity("Investment dividend recorded", `${asset.ticker || asset.name}: ${money(amount)}`);
  scheduleSave();
  renderAssetDetail(asset.id);
}

function roundToUnits(value) {
  return Math.round((Number(value) || 0) * 1000000) / 1000000;
}

function roundPrice(value) {
  return Math.round((Number(value) || 0) * 10000) / 10000;
}

function closePreview() {
  if (previewModal.open) previewModal.close();
  cleanupPreview();
}

function cleanupPreview() {
  if (previewUrl) URL.revokeObjectURL(previewUrl);
  previewUrl = "";
  previewBody.innerHTML = "";
}

function syncTabs(viewName) {
  tabs.forEach(item => {
    const active = item.dataset.view === viewName;
    item.classList.toggle("active", active);
    if (active) item.setAttribute("aria-current", "page");
    else item.removeAttribute("aria-current");
  });
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function escapeAttribute(value) {
  return escapeHtml(value).replace(/`/g, "&#096;");
}

authTabs.forEach(tab => tab.addEventListener("click", () => setAuthMode(tab.dataset.authMode)));
authForm.addEventListener("submit", handleAuth);

form.addEventListener("submit", async event => {
  if (modalContext.collection === "cash") {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(form).entries());
    state.cash = { income: Number(values.income || 0), expenses: Number(values.expenses || 0) };
    addActivity("Cash flow updated", `${money(state.cash.income)} income, ${money(state.cash.expenses)} expenses`);
    scheduleSave();
    modal.close();
    renderView(activeView);
    return;
  }
  try {
    await saveRecord(event);
  } catch (error) {
    event.preventDefault();
    saveStateLabel.textContent = error.message || "Save failed";
  }
});

document.querySelector("#close-modal").addEventListener("click", () => modal.close());
document.querySelector("#cancel-modal").addEventListener("click", () => modal.close());
document.querySelector("#close-preview").addEventListener("click", closePreview);
previewModal.addEventListener("close", cleanupPreview);
deleteButton.addEventListener("click", deleteRecord);

document.querySelector("#logout-button").addEventListener("click", async () => {
  try {
    await api("/api/wealth/logout", { method: "POST", body: "{}" });
  } catch {
    // The local session still gets cleared if the server has already forgotten it.
  }
  localStorage.removeItem(tokenKey);
  activeUser = null;
  state = emptyState();
  showAuth();
});

document.querySelector("#ask-ai-shortcut").addEventListener("click", () => renderView("ai"));
document.querySelector("#export-data").addEventListener("click", exportData);
document.querySelector("#import-data").addEventListener("click", () => importFile.click());
document.querySelector("#reset-data").addEventListener("click", async () => {
  try {
    await resetWorkspace();
  } catch (error) {
    saveStateLabel.textContent = error.message || "Reset failed";
  }
});
importFile.addEventListener("change", async () => {
  if (!importFile.files?.[0]) return;
  try {
    saveStateLabel.textContent = "Importing...";
    await importData(importFile.files[0]);
    saveStateLabel.textContent = "Saved";
  } catch (error) {
    saveStateLabel.textContent = error.message || "Import failed";
  } finally {
    importFile.value = "";
  }
});
document.addEventListener("input", event => {
  if (event.target.matches("[data-income-key]")) {
    const key = event.target.dataset.incomeKey;
    const value = Math.max(0, Number(event.target.value) || 0);
    state.incomeDetails = state.incomeDetails || {};
    state.incomeDetails[key] = value;
    
    // Update Gross Annual Income display live
    const grossIncome = calculateGrossAnnualIncome();
    const grossDisplay = document.querySelector(".income-header-card h2");
    if (grossDisplay) grossDisplay.textContent = money(grossIncome);
    
    scheduleSave();
  }

  if (event.target.matches("[data-deduction-key]")) {
    const key = event.target.dataset.deductionKey;
    const value = Math.max(0, Number(event.target.value) || 0);
    state.taxDeductions = state.taxDeductions || {};
    state.taxDeductions[key] = value;

    // Re-render deduction cards & summary live
    renderTaxDocuments();
    scheduleSave();
  }
});

document.addEventListener("change", event => {
  if (event.target.id === "asset-sort") {
    assetSort = event.target.value || "value";
    renderAssets();
  }
  if (event.target.matches("[data-investment-filter]")) {
    const key = event.target.dataset.investmentFilter;
    investmentFilters = { ...investmentFilters, [key]: event.target.value || "all" };
    renderInvestmentCategory(assetCategoryViews.investments, state.assets.filter(assetCategoryViews.investments.matcher));
  }
});

document.addEventListener("click", event => {
  const preview = event.target.closest("[data-preview-file]");
  if (preview) {
    event.preventDefault();
    event.stopPropagation();
    previewFile(preview.dataset.previewFile, preview.dataset.fileName || "Saved file");
    return;
  }
  const docFilter = event.target.closest("[data-doc-filter]");
  if (docFilter) {
    documentFilter = docFilter.dataset.docFilter || "all";
    renderCollection("documents");
    refreshMetrics();
    return;
  }
  if (event.target.closest("[data-download-ca-zip]")) {
    downloadCaZipPackage();
    return;
  }
  if (event.target.closest("[data-download-ca-pdf]")) {
    downloadCaPdfSummary();
    return;
  }
  if (event.target.closest("[data-share-ca-email]")) {
    shareCaViaEmail();
    return;
  }
  if (event.target.id === "close-ca-success") {
    const overlay = document.querySelector("#ca-success-overlay");
    if (overlay) overlay.hidden = true;
    return;
  }
  const taxTab = event.target.closest("[data-tax-tab]");
  if (taxTab) {
    window.currentTaxTab = taxTab.dataset.taxTab || "income";
    renderTaxDocuments();
    return;
  }
  const taxDelete = event.target.closest("[data-delete-tax-doc]");
  if (taxDelete) {
    deleteTaxDocument(taxDelete.dataset.deleteTaxDoc);
    return;
  }
  const assetFilterButton = event.target.closest("[data-asset-filter]");
  if (assetFilterButton) {
    assetFilter = assetFilterButton.dataset.assetFilter || "all";
    renderAssets();
    return;
  }
  const investmentSortButton = event.target.closest("[data-investment-sort]");
  if (investmentSortButton) {
    investmentSort = investmentSortButton.dataset.investmentSort || "value";
    renderInvestmentCategory(assetCategoryViews.investments, state.assets.filter(assetCategoryViews.investments.matcher));
    return;
  }
  const investmentHistoryRangeButton = event.target.closest("[data-investment-history-range]");
  if (investmentHistoryRangeButton) {
    investmentHistoryRange = investmentHistoryRangeButton.dataset.investmentHistoryRange || "ALL";
    renderInvestmentCategory(assetCategoryViews.investments, state.assets.filter(assetCategoryViews.investments.matcher));
    return;
  }
  if (event.target.closest("[data-investment-filter-reset]")) {
    investmentFilters = { owner: "all", type: "all", sector: "all" };
    renderInvestmentCategory(assetCategoryViews.investments, state.assets.filter(assetCategoryViews.investments.matcher));
    return;
  }
  if (event.target.closest("[data-estimate-current-value]")) {
    estimateCurrentValueFromForm();
    return;
  }
  if (event.target.closest("[data-fetch-watch-market]")) {
    fetchWatchMarketValueFromForm(true);
    return;
  }
  if (event.target.closest("[data-refresh-news]")) {
    loadFinanceNews(true);
    return;
  }
  if (event.target.closest("[data-refresh-market-events]")) {
    loadMarketEvents(true);
    return;
  }
  if (event.target.closest("[data-export-investments]")) {
    exportInvestmentCsv();
    return;
  }
  if (event.target.closest("[data-export-investment-report]")) {
    exportInvestmentReportCsv();
    return;
  }
  if (event.target.closest("[data-import-investment-history]")) {
    importInvestmentPriceHistoryCsv();
    return;
  }
  if (event.target.closest("[data-download-price-history-template]")) {
    downloadInvestmentPriceHistoryTemplate();
    return;
  }
  if (event.target.closest("[data-download-investment-template]")) {
    downloadInvestmentTemplate();
    return;
  }
  if (event.target.closest("[data-bulk-update-investments]")) {
    bulkUpdateInvestmentPrices();
    return;
  }
  const reestimate = event.target.closest("[data-reestimate-value]");
  if (reestimate) {
    reestimateAssetValue(reestimate.dataset.reestimateValue);
    return;
  }
  const watchFetch = event.target.closest("[data-fetch-watch-value]");
  if (watchFetch) {
    fetchWatchMarketValueForAsset(watchFetch.dataset.fetchWatchValue);
    return;
  }
  const deleteAsset = event.target.closest("[data-delete-asset]");
  if (deleteAsset) {
    deleteAssetById(deleteAsset.dataset.deleteAsset);
    return;
  }
  const valueUpdate = event.target.closest("[data-update-value]");
  if (valueUpdate) {
    updateAssetValue(valueUpdate.dataset.updateValue);
    return;
  }
  const sellInvestment = event.target.closest("[data-sell-investment]");
  if (sellInvestment) {
    recordInvestmentSale(sellInvestment.dataset.sellInvestment);
    return;
  }
  const splitInvestment = event.target.closest("[data-split-investment]");
  if (splitInvestment) {
    applyInvestmentSplit(splitInvestment.dataset.splitInvestment);
    return;
  }
  const dividendInvestment = event.target.closest("[data-dividend-investment]");
  if (dividendInvestment) {
    addInvestmentDividend(dividendInvestment.dataset.dividendInvestment);
    return;
  }
  const assetHome = event.target.closest("[data-asset-home]");
  if (assetHome) {
    activeAssetCategory = null;
    renderView("assets");
    return;
  }
  const assetCategory = event.target.closest("[data-asset-category]");
  if (assetCategory) {
    activeAssetCategory = assetCategory.dataset.assetCategory || null;
    renderView("assets");
    return;
  }
  const shortcut = event.target.closest("[data-view-shortcut]");
  if (shortcut) {
    if (shortcut.dataset.viewShortcut !== "assets") activeAssetCategory = null;
    renderView(shortcut.dataset.viewShortcut);
    return;
  }
  const add = event.target.closest("[data-add]");
  const edit = event.target.closest("[data-edit]");
  const detail = event.target.closest("[data-detail]");
  if (add) {
    openModal(add.dataset.add, null, { assetType: add.dataset.assetType || null });
    if (add.dataset.assetType) {
      const typeInput = form.querySelector('input[name="type"]');
      const nameInput = form.querySelector('input[name="name"]');
      if (typeInput) typeInput.value = add.dataset.assetType;
      if (nameInput && !nameInput.value) nameInput.placeholder = `${add.dataset.assetType} name`;
    }
    if (add.dataset.prefillName) {
      const nameInput = form.querySelector('input[name="name"]');
      const typeInput = form.querySelector('input[name="type"]');
      const statusInput = form.querySelector('input[name="status"]');
      const linkedInput = form.querySelector('input[name="linkedTo"]');
      const requiredInput = form.querySelector('input[name="requiredFor"]');
      if (nameInput) nameInput.value = add.dataset.prefillName;
      if (typeInput) typeInput.value = add.dataset.prefillType || "";
      if (statusInput) statusInput.value = "To upload";
      if (linkedInput) linkedInput.value = add.dataset.prefillLinked || "";
      if (requiredInput) requiredInput.value = add.dataset.prefillRequired || add.dataset.prefillLinked || "";
    }
  }
  if (detail && detail.dataset.detail === "assets") renderAssetDetail(detail.dataset.id);
  if (edit) openModal(edit.dataset.edit, edit.dataset.id);
  if (event.target.closest("#edit-cash")) openCashEditor();
});

document.addEventListener("submit", event => {
  if (event.target.id !== "ai-form") return;
  event.preventDefault();
  const question = document.querySelector("#ai-question").value;
  const answer = advisorText(question);
  document.querySelector("#advisor-question").textContent = question;
  document.querySelector("#advisor-answer").textContent = answer;
  document.querySelector("#ai-answer").textContent = answer;
});

tabs.forEach(tab => {
  tab.addEventListener("click", () => {
    activeAssetCategory = null;
    renderView(tab.dataset.view);
  });
});

const wealthCalculatorApi = {
  financedAssetSnapshot,
  loanSnapshot,
  usedCarValuation,
  vehicleOwnerCount,
  vehicleConditionMultiplier,
  vehicleDemandMultiplier,
  investmentSnapshot,
  investmentPortfolioSummary,
  investmentPortfolioHistory,
  investmentHistoryRangeStart,
  filterInvestmentHoldings,
  sortedInvestmentHoldings,
  assetCategoryForAsset,
  updateInvestmentPrice,
  applyInvestmentSplitToLots,
  parseInvestmentSplitRatio,
  allocateInvestmentSale,
  matchingInvestmentLots,
  normalizedTaxLotMethod,
  applyInvestmentDerivedValues,
  validateInvestmentImportValues,
  investmentCsvHeader,
  investmentReportHeader,
  investmentPriceHistoryHeader,
  csvHeaderKey,
  splitCsvLine,
  __setStateForTests(nextState) {
    state = normalizeState(nextState);
    return state;
  },
  __getStateForTests() {
    return state;
  }
};

if (typeof window !== "undefined") {
  window.wealthCalculators = wealthCalculatorApi;
  if (!window.__WEALTH_OS_TEST__) boot();
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = wealthCalculatorApi;
}
