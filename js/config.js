const tokenKey = "wealth-os-token";
window.tokenKey = tokenKey;
const localApiBase = "http://localhost:3001";

function apiUrl(path, useFallback = false) {
  if (useFallback || location.protocol === "file:") return `${localApiBase}${path}`;
  return path;
}

function escapeHtml(value) {
  if (value === null || value === undefined) return "";
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
window.escapeHtml = escapeHtml;

function escapeAttribute(value) {
  return escapeHtml(value).replace(/`/g, "&#096;");
}
window.escapeAttribute = escapeAttribute;

const config = {
  home: {
    label: "Home",
    title: "Dashboard",
    action: "Add Asset",
    color: "linear-gradient(135deg, #162848 0%, #32266a 100%)"
  },
  cashflow: {
    label: "Cash Flow",
    title: "Cash Flow Intelligence",
    action: "Log Expense",
    color: "linear-gradient(135deg, #112811 0%, #326a32 100%)"
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
  willVault: {
    label: "Secure Vault",
    title: "Digital Will & Testament",
    action: "Manage Will",
    color: "linear-gradient(135deg, #0f172a 0%, #334155 100%)"
  },
  cameras: {
    label: "Security",
    title: "Camera Hub",
    action: "Add Camera",
    color: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)"
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
  },
  incomeStreams: {
    label: "Income",
    title: "Income Streams",
    action: "Add Income Source",
    color: "linear-gradient(135deg, #0f2918 0%, #166534 100%)"
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
  ["insurance", "Insurance"],
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
    ["renewal", "Renewal date", "date"],
    ["taxCategory", "Tax Category (Optional)", "select:None,80C Eligible,Section 24b (Home Loan),80D (Health Insurance),Bank Interest (Income),Rental Income"]
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
    ["dueDate", "Next due date", "date"],
    ["taxCategory", "Tax Category (Optional)", "select:None,80C Eligible,Section 24b (Home Loan),80D (Health Insurance),Bank Interest (Income),Rental Income"]
  ],
  documents: [
    ["name", "Document name", "text"],
    ["owner", "Document Owner", "text"],
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
    ["hasLoan", "Was this vehicle purchased using a loan?", "select:No (Self-Funded),Yes (Active Loan)"],
    ["loanAmount", "Loan amount", "number"],
    ["downPayment", "Down payment", "number"],
    ["interestRate", "Interest rate (% per annum)", "number"],
    ["loanTenureYears", "Loan tenure (years)", "number"],
    ["loanStartDate", "Loan start date", "date"],
    ["emiAmount", "EMI amount (optional)", "number"],
    ["loanType", "Loan type", "select:Reducing Balance,Flat Interest"],
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
    ["hasLoan", "Was this land purchased using a loan?", "select:No (Self-Funded),Yes (Active Loan)"],
    ["loanAmount", "Loan amount", "number"],
    ["downPayment", "Down payment", "number"],
    ["interestRate", "Interest rate (% per annum)", "number"],
    ["loanTenureYears", "Loan tenure (years)", "number"],
    ["loanStartDate", "Loan start date", "date"],
    ["emiAmount", "EMI amount (optional)", "number"],
    ["loanType", "Loan type", "select:Reducing Balance,Flat Interest"],
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
    ["hasLoan", "Was this flat purchased using a home loan?", "select:No (Self-Funded),Yes (Active Home Loan)"],
    ["loanAmount", "Home loan amount", "number"],
    ["downPayment", "Down payment paid upfront", "number"],
    ["interestRate", "Interest rate (% per annum)", "number"],
    ["loanTenureYears", "Loan tenure (years)", "number"],
    ["loanStartDate", "Loan start date", "date"],
    ["emiAmount", "Monthly EMI amount (optional)", "number"],
    ["loanType", "Loan amortization type", "select:Reducing Balance,Flat Interest"],
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
    ["note", "Notes", "text"],
    ["taxCategory", "Tax Category (Optional)", "select:None,80C Eligible,Section 24b (Home Loan),80D (Health Insurance),Bank Interest (Income),Rental Income"]
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
