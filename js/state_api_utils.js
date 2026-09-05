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
    cameras: [],
    family: [],
    goals: [],
    activity: [],
    incomeStreams: [],
    cash: { income: 0, expenses: 0 }
  };
}

function normalizeState(data) {
  const safeData = data || {};
  const normalized = {
    ...emptyState(),
    ...safeData,
    assets: Array.isArray(safeData.assets) ? safeData.assets.map(normalizeAssetRecord) : [],
    liabilities: Array.isArray(safeData.liabilities) ? safeData.liabilities.map(normalizeLiabilityRecord) : [],
    documents: Array.isArray(safeData.documents) ? safeData.documents : [],
    alerts: Array.isArray(safeData.alerts) ? safeData.alerts : [],
    cameras: Array.isArray(safeData.cameras) ? safeData.cameras : [],
    family: Array.isArray(safeData.family) ? safeData.family : [],
    goals: Array.isArray(safeData.goals) ? safeData.goals : [],
    activity: Array.isArray(safeData.activity) ? safeData.activity : [],
    incomeStreams: Array.isArray(safeData.incomeStreams) ? safeData.incomeStreams.map(normalizeIncomeStreamRecord) : [],
    incomeTarget: nonNegativeNumber(safeData.incomeTarget || safeData.incomeDetails?.monthlyTarget || 200000),
    cash: {
      income: nonNegativeNumber(safeData.cash?.income),
      expenses: nonNegativeNumber(safeData.cash?.expenses)
    }
  };

  if (typeof syncInterconnectedData === 'function') {
    syncInterconnectedData(normalized);
  }
  return normalized;
}

function normalizeIncomeStreamRecord(item) {
  const safe = item || {};
  const cat = String(safe.category || 'other').toLowerCase();
  const isPassive = safe.isPassive !== undefined ? Boolean(safe.isPassive) : ['rental', 'dividends', 'interest'].includes(cat);
  return {
    id: safe.id || ('inc_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5)),
    name: String(safe.name || 'Income Source').trim(),
    category: cat,
    amount: nonNegativeNumber(safe.amount),
    frequency: ['monthly', 'quarterly', 'annually'].includes(safe.frequency) ? safe.frequency : 'monthly',
    status: safe.status === 'paused' ? 'paused' : 'active',
    isPassive,
    taxType: safe.taxType || 'taxable',
    startDate: safe.startDate || '',
    notes: safe.notes || '',
    createdAt: safe.createdAt || new Date().toISOString(),
    updatedAt: safe.updatedAt || new Date().toISOString()
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
    currency: safeAsset.currency || "INR",
    exchangeRate: nonNegativeNumber(safeAsset.exchangeRate) || 1,
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
  
  if (mode === "register") {
    authKicker.textContent = "Create an account";
    authTitle.textContent = "Join Wealth OS";
  } else {
    authKicker.textContent = "Sign in to your account";
    authTitle.textContent = "Welcome back";
  }
  
  const toggleText = document.getElementById("auth-toggle-text");
  const toggleLink = document.getElementById("auth-toggle-link");
  if (toggleText && toggleLink) {
    if (mode === "register") {
      toggleText.textContent = "Already have an account?";
      toggleLink.textContent = "Log in";
      toggleLink.dataset.authMode = "login";
    } else {
      toggleText.textContent = "Don't have an account yet?";
      toggleLink.textContent = "Sign up";
      toggleLink.dataset.authMode = "register";
    }
  }

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

    let targetView = "home";
    const hash = window.location.hash.replace('#', '').trim();
    if (hash && (config[hash] || hash === 'income' || hash === 'incomeStreams')) {
      targetView = hash === 'income' ? 'incomeStreams' : hash;
    } else {
      targetView = localStorage.getItem('wealth-os-active-view') || "home";
    }

    window.currentTaxTab = localStorage.getItem('wealth-os-tax-tab') || "checklist";
    renderView(targetView);
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

window.impersonatingClientId = null;

function scheduleSave() {
  saveStateLabel.textContent = "Saving...";
  if (typeof syncInterconnectedData === 'function') syncInterconnectedData(state);
  clearTimeout(saveTimer);
  saveTimer = setTimeout(async () => {
    try {
      const payload = { data: state };
      if (window.impersonatingClientId) {
        payload.impersonateClientId = window.impersonatingClientId;
      }
      
      await api("/api/wealth/data", {
        method: "PUT",
        body: JSON.stringify(payload)
      });
      saveStateLabel.textContent = window.impersonatingClientId ? "Saved to Client Profile" : "Saved";
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

window.currentDocumentOwner = "All";
window.familyNamesList = JSON.parse(localStorage.getItem("familyNamesList")) || ["All", "Dad", "Mother", "Son", "Daughter"];

function filteredDocuments() {
  let docs = [...state.documents].sort((a, b) => {
    const aDays = a.expiry ? daysUntil(a.expiry) : 99999;
    const bDays = b.expiry ? daysUntil(b.expiry) : 99999;
    return aDays - bDays;
  });
  
  if (window.currentDocumentOwner && window.currentDocumentOwner !== "All") {
    docs = docs.filter(doc => doc.owner === window.currentDocumentOwner || doc.linkedTo === window.currentDocumentOwner);
  }
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

function calculateVehicleElapsedMonths(input = {}) {
  const now = startOfToday();
  const curYear = now.getFullYear();
  const curMonth = now.getMonth(); // 0-indexed (0 = Jan, 7 = Aug)

  const acqStr = input.acquisitionDate || input.purchaseDate || input.buyingDate;
  if (acqStr) {
    const d = new Date(acqStr);
    if (!isNaN(d.getTime())) {
      const diffYears = curYear - d.getFullYear();
      const diffMonths = curMonth - d.getMonth();
      const totalMonths = (diffYears * 12) + diffMonths;
      return Math.max(0, totalMonths);
    }
  }

  const mYear = Number(input.year || input.manufacturingYear || curYear);
  if (Number.isFinite(mYear) && mYear > 1990 && mYear <= curYear + 1) {
    const diffYears = curYear - mYear;
    const totalMonths = Math.max(0, (diffYears * 12) + curMonth);
    return totalMonths;
  }

  return 0;
}

function vehicleBrandMarketMultiplier(brandOrName) {
  const text = String(brandOrName || "").toLowerCase();
  if (/maruti|suzuki|toyota|hyundai/.test(text)) return { label: "High Liquidity (Maruti/Toyota/Hyundai)", multiplier: 1.04, brandTier: "Tier 1" };
  if (/tata|mahindra|kia|honda/.test(text)) return { label: "Standard Market Index (Tata/Mahindra/Kia/Honda)", multiplier: 1.00, brandTier: "Tier 2" };
  if (/nissan|renault|volkswagen|vw|skoda|mg|ford|jeep/.test(text)) return { label: "Moderate Resale Index (Nissan/VW/Skoda/MG)", multiplier: 0.94, brandTier: "Tier 3" };
  if (/bmw|mercedes|audi|jaguar|land rover|volvo|porsche/.test(text)) return { label: "Luxury High-Depreciation Index", multiplier: 0.84, brandTier: "Luxury" };
  return { label: "General Indian Market Index", multiplier: 1.00, brandTier: "Standard" };
}

function usedCarValuation(input = {}) {
  const originalPrice = nonNegativeRupees(input.original_price ?? input.originalPrice ?? input.purchasePrice ?? input.value);
  if (!originalPrice) return null;

  const currentYear = startOfToday().getFullYear();
  const manufactureYear = Number(input.year || input.manufacturingYear || currentYear);
  const ageMonths = calculateVehicleElapsedMonths(input);
  const ageYears = ageMonths > 0 ? (ageMonths / 12) : 0;

  // 1. Spinny Continuous Monthly Age Depreciation
  // Months 1-12 (Year 1): 1.25% per month (approx 14% total drop + showroom registration)
  // Months 13-60 (Years 2-5): 0.85% per month continuous decay (~9.7% per year)
  // Months 61-120 (Years 6-10): 0.60% per month
  // Months 121+ (Year 10+): 0.40% per month, floor 20%
  let ageMultiplier = 1.0;
  if (ageMonths <= 0) {
    ageMultiplier = 1.0;
  } else if (ageMonths <= 12) {
    ageMultiplier = Math.pow(1 - 0.0125, ageMonths);
  } else if (ageMonths <= 60) {
    const yr1 = Math.pow(1 - 0.0125, 12);
    ageMultiplier = yr1 * Math.pow(1 - 0.0085, ageMonths - 12);
  } else {
    const yr1 = Math.pow(1 - 0.0125, 12);
    const yr2to5 = Math.pow(1 - 0.0085, 48);
    ageMultiplier = yr1 * yr2to5 * Math.pow(1 - 0.0060, ageMonths - 60);
  }
  ageMultiplier = Math.max(0.20, ageMultiplier);

  let currentValue = originalPrice * ageMultiplier;

  // 2. Mileage Adjustment (Standard ~1,000 km/mo)
  const actualMileage = nonNegativeNumber(input.mileageKm || input.odometer || input.kilometersDriven || input.kmDriven);
  const standardMileage = Math.max(1000, ageMonths * 1000);
  let mileageAdjustmentPercent = 0;
  if (actualMileage > 0) {
    const mileageDelta = actualMileage - standardMileage;
    const mileageBlocks = Math.floor(Math.abs(mileageDelta) / 5000);
    mileageAdjustmentPercent = mileageDelta > 0
      ? -Math.min(15, mileageBlocks * 1.5)
      : Math.min(6, mileageBlocks * 1.0);
  }
  currentValue *= (1 + mileageAdjustmentPercent / 100);

  // 3. Ownership Multiplier
  const ownerCount = vehicleOwnerCount(input.ownerCount || input.ownership || input.ownerNumber || input.owner);
  const ownershipPenaltyPercent = ownerCount <= 1 ? 0 : ownerCount === 2 ? -7.5 : -15;
  currentValue *= (1 + ownershipPenaltyPercent / 100);

  // 4. Spinny 200-Point Inspection Condition Multiplier
  const condition = vehicleConditionMultiplier(input.condition);
  currentValue *= condition.multiplier;

  // 5. Brand Market Multiplier
  const brandInfo = vehicleBrandMarketMultiplier(input.brand || input.name || input.model);
  currentValue *= brandInfo.multiplier;

  // 6. Market Demand Multiplier
  const demand = vehicleDemandMultiplier(input.demand || input.marketDemand);
  currentValue *= demand.multiplier;

  const rounded = roundEstimate(Math.max(0, currentValue));

  // Spinny Two-Tier Output
  const spinnyInstantSell = roundEstimate(rounded * 0.93); // Direct 24-hr buyout quote
  const spinnyRetailResale = rounded; // Fair Market Listing Price
  const low = spinnyInstantSell;
  const high = roundEstimate(rounded * 1.06);

  // Current Monthly Ongoing Depreciation (₹/mo)
  const totalDepreciation = Math.max(0, originalPrice - rounded);
  const monthlyDepreciationRate = ageMonths > 0 ? Math.round(totalDepreciation / ageMonths) : Math.round(originalPrice * 0.0125);
  const currentOngoingMonthlyDecay = Math.round(rounded * (ageMonths <= 12 ? 0.0125 : 0.0085));

  const confidence = vehicleValuationConfidence(input).confidence;

  const engineJson = {
    estimated_resale_price: rounded,
    spinny_instant_sell: spinnyInstantSell,
    spinny_retail_resale: spinnyRetailResale,
    currency: "INR",
    price_range: { low, high },
    confidence,
    age_months: ageMonths,
    monthly_depreciation_rate: currentOngoingMonthlyDecay,
    inputs: {
      original_price: originalPrice,
      manufacturing_year: manufactureYear || null,
      age_years: Math.round(ageYears * 10) / 10,
      age_months: ageMonths,
      actual_mileage_km: actualMileage,
      standard_mileage_km: standardMileage,
      owner_count: ownerCount,
      condition: condition.label,
      brand_tier: brandInfo.brandTier,
      demand: demand.label
    },
    adjustments: {
      age_depreciation_multiplier: Number(ageMultiplier.toFixed(4)),
      mileage_adjustment_percent: mileageAdjustmentPercent,
      ownership_adjustment_percent: ownershipPenaltyPercent,
      condition_multiplier: condition.multiplier,
      brand_multiplier: brandInfo.multiplier,
      demand_multiplier: demand.multiplier
    }
  };

  return {
    value: rounded,
    instantSell: spinnyInstantSell,
    retailResale: spinnyRetailResale,
    low,
    high,
    confidence,
    ageMonths,
    monthlyDepreciation: currentOngoingMonthlyDecay,
    label: "Spinny Used Car Resale Valuation",
    engineJson,
    basis: `Spinny Resale Valuation: Based on buying price ${money(originalPrice)}, ${ageMonths} months elapsed on road (~${(ageYears).toFixed(1)} yrs), ${brandInfo.label}, mileage ${actualMileage ? `${Math.round(actualMileage).toLocaleString("en-IN")} km` : "standard benchmark"}, ${ownerCount}${ownerCount === 1 ? "st" : ownerCount === 2 ? "nd" : "rd+"} owner, ${condition.label} condition (Spinny 200-Pt) = Fair Value ${money(rounded)} (Instant Buyout: ${money(spinnyInstantSell)}). Monthly decay: -${money(currentOngoingMonthlyDecay)}/mo.`
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
  const str = String(value || "").trim().toLowerCase();
  return ["yes", "true", "1", "on", "loan"].includes(str) || /^yes\b|loan\b/i.test(str);
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
        currency: String(row.currency || "INR").toUpperCase(),
        exchangeRate: Number(row.exchangeRate || row.inrExchangeRate || row.fxRate || 1),
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
  values.currency = String(values.currency || "INR").toUpperCase();
  values.exchangeRate = Number(values.exchangeRate) || 1;
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
  const assetLoanBalance = assetItems.reduce((sum, item) => sum + assetOutstandingLoan(item), 0);
  const liabilities = state.liabilities.reduce((sum, item) => sum + nonNegativeRupees(item.value), 0);
  const emi = state.liabilities.reduce((sum, item) => sum + nonNegativeRupees(item.emi), 0) +
    assetItems.reduce((sum, item) => sum + assetEmi(item), 0);
  const cashFlow = Number(state.cash.income || 0) - Number(state.cash.expenses || 0) - emi;
  const renewalCount = upcoming().length;
  const totalAssets = marketAssets + cash;
  const totalLiabilities = liabilities + assetLoanBalance;
  const debtRatio = totalAssets ? Math.round((totalLiabilities / totalAssets) * 100) : 0;
  const savingsRate = state.cash.income ? Math.max(0, Math.round((cashFlow / state.cash.income) * 100)) : 0;
  const insuranceDocs = state.documents.filter(item => /insurance/i.test(`${item.type} ${item.name}`)).length;
  const health = Math.max(0, Math.min(100, 60 + savingsRate - Math.round(debtRatio / 2) + insuranceDocs * 4));
  return {
    assets: marketAssets,
    marketAssets,
    assetEquity,
    cash,
    liabilities: totalLiabilities,
    explicitLiabilities: liabilities,
    assetLoanBalance,
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
  if (isTruthy(asset.hasLoan)) return financedAssetSnapshot(asset).netWorthContribution;
  return nonNegativeRupees(asset.value);
}

function assetOutstandingLoan(asset) {
  if (!isTruthy(asset.hasLoan)) return 0;
  return financedAssetSnapshot(asset).outstandingLoan;
}

function assetEmi(asset) {
  if (!isTruthy(asset.hasLoan)) return 0;
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
  if (viewName === 'income') viewName = 'incomeStreams';
  activeView = viewName;
  localStorage.setItem('wealth-os-active-view', viewName);
  try {
    if (history.replaceState) {
      history.replaceState(null, '', '#' + viewName);
    }
  } catch (_) {}

  document.body.classList.toggle("map-dashboard", viewName === "home");
  ['home', 'assets', 'cashflow', 'documents', 'taxDocuments', 'willVault', 'cameras', 'reports', 'ai', 'caDashboard', 'incomeStreams'].forEach(v => {
    document.body.classList.toggle(`view-${v}`, viewName === v);
  });
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
  const view = config[viewName] || { title: "CA Dashboard", label: "Practice", action: "Client" };
  title.textContent = view.title;
  viewLabel.textContent = view.label;
  actions.innerHTML = "";
  grid.innerHTML = "";
  list.innerHTML = "";

  if (viewName === "home") renderDashboard();
  if (viewName === "assets") renderAssets();
  if (viewName === "cashflow") {
    if (typeof renderCashflowPage === 'function') renderCashflowPage();
    else list.innerHTML = `<div style="padding: 20px;">Loading Cash Flow Intelligence...</div>`;
  }
  if (viewName === "documents") {
    if (typeof renderDocumentVaultPage === 'function') renderDocumentVaultPage();
    else renderCollection("documents");
  }
  if (viewName === "taxDocuments") renderTaxDocuments();
  if (viewName === "willVault") {
    if (typeof renderWillVault === 'function') renderWillVault();
    else list.innerHTML = `<div style="padding: 20px;">Loading Will Vault...</div>`;
  }
  if (viewName === "cameras") {
    if (typeof renderCameras === 'function') renderCameras();
    else list.innerHTML = `<div style="padding: 20px;">Loading Camera Hub...</div>`;
  }
  if (viewName === "reports") renderReports();
  if (viewName === "ai") {
    try {
      if (typeof renderAi === 'function') renderAi();
      else if (typeof window.renderAiAdvisor === 'function') window.renderAiAdvisor();
      else list.innerHTML = `<div style="padding: 24px; color: #0f172a; font-weight: bold;">Loading AI Wealth Advisor...</div>`;
    } catch (err) {
      console.error("AI Advisor Render Error:", err);
      list.innerHTML = `<div style="padding: 24px; color: #dc2626; background: #fff; border: 1px solid #fee2e2; border-radius: 12px;">
        <h3 style="margin: 0 0 8px;">Advisory Engine Notice</h3>
        <p style="color: #64748b; font-size: 13px;">${escapeHtml(err.message)}</p>
      </div>`;
    }
  }
  if (viewName === "incomeStreams") {
    if (typeof renderIncomeStreamsPage === 'function') renderIncomeStreamsPage();
    else list.innerHTML = `<div style="padding: 20px;">Loading Income Streams...</div>`;
  }
  if (viewName === "caDashboard") {
    if (typeof renderCaDashboard === 'function') {
      renderCaDashboard();
    } else {
      list.innerHTML = `<div style="padding: 20px;">Loading CA Dashboard...</div>`;
    }
  }

  refreshMetrics();
  syncTabs(viewName);
}

function syncTabs(viewName) {
  const target = (viewName === 'income' ? 'incomeStreams' : viewName);
  document.querySelectorAll(".tab, .mobile-tab").forEach(tab => {
    const tabView = tab.dataset.view === 'income' ? 'incomeStreams' : tab.dataset.view;
    const isTarget = tabView === target;
    tab.classList.toggle("active", isTarget);
    if (isTarget) {
      tab.setAttribute("aria-current", "page");
    } else {
      tab.removeAttribute("aria-current");
    }
  });
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
      ${typeof getEstateDashboardBanner === 'function' ? getEstateDashboardBanner() : ''}
      ${typeof getSecurityDashboardBanner === 'function' ? getSecurityDashboardBanner() : ''}
      <div class="analytics-grid" style="grid-column: 1 / -1; display: grid; grid-template-columns: repeat(12, 1fr); gap: 14px;">
        ${analyticsKpiStrip(data)}
        ${netWorthTrendCard(data)}
        ${assetAllocationCard(data)}
        ${bottomKpiRow(data)}
        ${monthlyCashFlowCard(data)}
      </div>
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
      <div class="wellness-mini-card tax-card" style="background: linear-gradient(135deg, #0a1118 0%, #162432 100%); color: white; border-color: transparent;">
        <span style="color: rgba(255,255,255,0.7);">Estimated Tax</span>
        <strong style="color: white;">${typeof calculateTaxComparison === 'function' ? money(calculateTaxComparison().newRegime.totalTax) : '₹0'}</strong>
        <p style="color: rgba(255,255,255,0.6);">Gross Income: ${typeof calculateGrossAnnualIncome === 'function' ? money(calculateGrossAnnualIncome()) : '₹0'}</p>
        <button class="secondary-action" style="border-color: rgba(255,255,255,0.2); color: white;" type="button" data-view-shortcut="taxDocuments">View Tax Profile</button>
      </div>
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
        <button class="ghost-button" type="button" data-view-shortcut="reports">View insights</button>
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
  // Initialize charts after DOM render
  setTimeout(() => initDashboardCharts(data), 100);
}

// ═══════════════════════════════════════════════════════════
// ANALYTICS DASHBOARD CARDS
// ═══════════════════════════════════════════════════════════

function analyticsKpiStrip(data) {
  const emi = data.emi;
  const healthColor = data.health >= 70 ? '#22c55e' : data.health >= 40 ? '#eab308' : '#ef4444';
  const healthPct = Math.min(100, data.health);
  return `
    <div class="analytics-kpi-strip">
      <div class="kpi-card">
        <span class="kpi-label">NET WORTH</span>
        <strong class="kpi-value">${money(data.netWorth)}</strong>
        <span class="kpi-sub">Assets − Liabilities</span>
      </div>
      <div class="kpi-card">
        <span class="kpi-label">LIQUID CASH</span>
        <strong class="kpi-value">${money(data.cash)}</strong>
        <span class="kpi-sub">Bank & reserve</span>
      </div>
      <div class="kpi-card">
        <span class="kpi-label">TOTAL DEBT</span>
        <strong class="kpi-value kpi-debt">${money(data.liabilities)}</strong>
        <span class="kpi-sub">EMI: ${money(emi)}/mo</span>
      </div>
      <div class="kpi-card">
        <span class="kpi-label">HEALTH SCORE</span>
        <strong class="kpi-value">${data.health}<sub>/100</sub></strong>
        <div class="kpi-health-bar"><div style="width:${healthPct}%; background:${healthColor};"></div></div>
      </div>
    </div>
  `;
}

function netWorthTrendCard(data) {
  return `
    <section class="analytics-chart-card analytics-trend-card">
      <div class="chart-card-head">
        <div>
          <span class="chart-card-label">NET WORTH TREND</span>
          <strong class="chart-card-value">${money(data.netWorth)}</strong>
        </div>
        <div class="chart-legend">
          <span><i style="background:#4f8cff;"></i> Net Worth</span>
          <span><i style="background:#22c55e;"></i> Assets</span>
          <span><i style="background:#ef4444;"></i> Debt</span>
        </div>
      </div>
      <div class="chart-canvas-wrap">
        <canvas id="netWorthTrendChart" height="220"></canvas>
      </div>
    </section>
  `;
}

function assetAllocationCard(data) {
  return `
    <section class="analytics-chart-card analytics-alloc-card">
      <div class="chart-card-head">
        <div>
          <span class="chart-card-label">ASSET ALLOCATION</span>
          <strong class="chart-card-value">${money(data.assets + data.cash)}</strong>
        </div>
      </div>
      <div class="alloc-layout">
        <div class="alloc-donut-wrap">
          <canvas id="assetAllocChart" width="200" height="200"></canvas>
        </div>
        <div class="alloc-legend" id="allocLegendList"></div>
      </div>
    </section>
  `;
}

function bottomKpiRow(data) {
  const renewals = upcoming().filter(u => u.days >= 0 && u.days <= 90).length;
  return `
    <div class="analytics-bottom-kpi">
      <div class="bottom-kpi-item">
        <span>DEBT-TO-ASSET RATIO</span>
        <strong>${data.debtRatio}%</strong>
        <p>${data.debtRatio <= 30 ? 'Healthy range' : data.debtRatio <= 60 ? 'Moderate leverage' : 'High leverage'}</p>
      </div>
      <div class="bottom-kpi-item">
        <span>DOCUMENT READINESS</span>
        <strong>${documentReadiness()}%</strong>
        <p>${state.documents.length} categories tracked</p>
      </div>
      <div class="bottom-kpi-item">
        <span>TOTAL ASSETS</span>
        <strong>${state.assets.length}</strong>
        <p>${state.assets.length} assets tracked</p>
      </div>
      <div class="bottom-kpi-item">
        <span>UPCOMING RENEWALS</span>
        <strong>${renewals}</strong>
        <p>${renewals > 0 ? 'Due within 90 days' : 'Nothing due soon'}</p>
      </div>
    </div>
  `;
}

function monthlyCashFlowCard(data) {
  const income = Number(state.cash.income || 0);
  const expenses = Number(state.cash.expenses || 0);
  const emi = data.emi;
  const totalOut = expenses + emi;
  const maxBar = Math.max(income, totalOut, 1);
  const incomePct = Math.round((income / maxBar) * 100);
  const expensePct = Math.round((totalOut / maxBar) * 100);
  const flow = income - totalOut;
  const flowColor = flow >= 0 ? '#22c55e' : '#ef4444';
  return `
    <section class="analytics-chart-card analytics-cashflow-card">
      <div class="chart-card-head">
        <div>
          <span class="chart-card-label">MONTHLY CASH FLOW</span>
          <strong class="chart-card-value" style="color:${flowColor}">${money(flow)}</strong>
        </div>
      </div>
      <div class="cashflow-bars">
        <div class="cashflow-row">
          <span>Income</span>
          <div class="cashflow-bar-track"><div class="cashflow-bar" style="width:${incomePct}%; background:#22c55e;"></div></div>
          <span class="cashflow-amt">${money(income)}</span>
        </div>
        <div class="cashflow-row">
          <span>Expenses</span>
          <div class="cashflow-bar-track"><div class="cashflow-bar" style="width:${expensePct}%; background:#ef4444;"></div></div>
          <span class="cashflow-amt">${money(totalOut)}</span>
        </div>
      </div>
    </section>
  `;
}

// ═══════════════════════════════════════════════════════════
// CHART.JS INITIALIZATION
// ═══════════════════════════════════════════════════════════

function initDashboardCharts(data) {
  if (typeof Chart === 'undefined') return;
  initNetWorthTrendChart(data);
  initAssetAllocationChart(data);
}

function initNetWorthTrendChart(data) {
  const canvas = document.getElementById('netWorthTrendChart');
  if (!canvas) return;
  
  // Generate 6 months of simulated trend data based on current values
  const months = [];
  const netWorthData = [];
  const assetData = [];
  const debtData = [];
  const now = new Date();
  
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(d.toLocaleDateString('en-US', { month: 'short' }));
    // Simulate gentle growth curve from ~60% of current value
    const factor = 0.6 + (0.4 * ((5 - i) / 5));
    const jitter = 1 + (Math.sin(i * 1.3) * 0.03);
    netWorthData.push(Math.round(data.netWorth * factor * jitter));
    assetData.push(Math.round((data.assets + data.cash) * factor * jitter));
    debtData.push(Math.round(data.liabilities * (1.1 - (0.1 * ((5 - i) / 5)))));
  }
  
  const ctx = canvas.getContext('2d');
  if (canvas._chartInstance) canvas._chartInstance.destroy();
  
  const panelColor = getComputedStyle(document.documentElement).getPropertyValue('--warm-card').trim();
  const inkColor = getComputedStyle(document.documentElement).getPropertyValue('--warm-ink').trim() || '#333';
  const mutedColor = getComputedStyle(document.documentElement).getPropertyValue('--warm-muted').trim() || '#999';
  
  canvas._chartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: months,
      datasets: [
        {
          label: 'Net Worth',
          data: netWorthData,
          borderColor: '#4f8cff',
          backgroundColor: 'rgba(79,140,255,0.08)',
          fill: true,
          tension: 0.4,
          pointRadius: 3,
          pointBackgroundColor: '#4f8cff',
          borderWidth: 2.5
        },
        {
          label: 'Assets',
          data: assetData,
          borderColor: '#22c55e',
          borderDash: [5, 3],
          fill: false,
          tension: 0.4,
          pointRadius: 0,
          borderWidth: 1.5
        },
        {
          label: 'Debt',
          data: debtData,
          borderColor: '#ef4444',
          borderDash: [4, 4],
          fill: false,
          tension: 0.4,
          pointRadius: 0,
          borderWidth: 1.5
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: panelColor || '#fbfaf4',
          titleColor: inkColor,
          bodyColor: inkColor,
          borderColor: '#ddd',
          borderWidth: 1,
          padding: 10,
          callbacks: {
            label: function(ctx) { return ctx.dataset.label + ': ' + money(ctx.raw); }
          }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: mutedColor, font: { size: 11 } }
        },
        y: {
          grid: { color: 'rgba(0,0,0,0.05)' },
          ticks: {
            color: mutedColor,
            font: { size: 11 },
            callback: function(val) {
              if (val >= 10000000) return (val / 10000000).toFixed(1) + ' Cr';
              if (val >= 100000) return (val / 100000).toFixed(0) + ' L';
              if (val >= 1000) return (val / 1000).toFixed(0) + ' K';
              return val;
            }
          }
        }
      }
    }
  });
}

function initAssetAllocationChart(data) {
  const canvas = document.getElementById('assetAllocChart');
  if (!canvas) return;

  // Build category map from assets
  const categoryMap = {};
  const colorPalette = ['#1e40af', '#22c55e', '#eab308', '#8b5cf6', '#ef4444', '#06b6d4', '#f97316', '#ec4899'];
  
  (state.assets || []).forEach(asset => {
    const type = String(asset.type || 'Other').trim();
    const catName = type.charAt(0).toUpperCase() + type.slice(1);
    if (!categoryMap[catName]) categoryMap[catName] = 0;
    categoryMap[catName] += Number(asset.value) || 0;
  });
  
  // Add cash
  if (data.cash > 0) {
    categoryMap['Cash & Bank'] = (categoryMap['Cash & Bank'] || 0) + data.cash;
  }
  
  const labels = Object.keys(categoryMap);
  const values = Object.values(categoryMap);
  const total = values.reduce((s, v) => s + v, 0) || 1;
  const colors = labels.map((_, i) => colorPalette[i % colorPalette.length]);
  
  // Build legend
  const legendEl = document.getElementById('allocLegendList');
  if (legendEl) {
    legendEl.innerHTML = labels.map((label, i) => {
      const pct = Math.round((values[i] / total) * 100);
      return `
        <div class="alloc-legend-item">
          <i style="background:${colors[i]};"></i>
          <span>${escapeHtml(label)}</span>
          <b>${pct}%</b>
          <small>${money(values[i])}</small>
        </div>
      `;
    }).join('');
  }
  
  const ctx = canvas.getContext('2d');
  if (canvas._chartInstance) canvas._chartInstance.destroy();
  
  canvas._chartInstance = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: labels,
      datasets: [{
        data: values,
        backgroundColor: colors,
        borderWidth: 2,
        borderColor: getComputedStyle(document.documentElement).getPropertyValue('--warm-card').trim() || '#fbfaf4',
        hoverOffset: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      cutout: '65%',
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: function(ctx) {
              const pct = Math.round((ctx.raw / total) * 100);
              return ctx.label + ': ' + pct + '% (' + money(ctx.raw) + ')';
            }
          }
        }
      }
    }
  });
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
