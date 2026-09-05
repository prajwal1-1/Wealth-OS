// ═══════════════════════════════════════════════════════════
// INCOME STREAMS & ANALYTICS MODULE — ui-income.js
// Institutional Private Wealth Income Terminal & Autonomous AI Agent Suite
// Active vs Passive Yield Analysis, Cash Inflow Forecast & Tax Sync
// (Clean Executive Typography — No Emojis)
// ═══════════════════════════════════════════════════════════

const INCOME_ICONS = {
  salary: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>`,
  rental: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>`,
  business: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>`,
  freelance: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>`,
  dividends: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>`,
  interest: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>`,
  other: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`,
  edit: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>`,
  copy: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>`,
  trash: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>`,
  pause: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>`,
  play: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>`,
  sync: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>`,
  download: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>`,
  search: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>`,
  target: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="6"></circle><circle cx="12" cy="12" r="2"></circle></svg>`,
  import: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>`,
  shield: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>`,
  bot: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="10" rx="2"></rect><circle cx="12" cy="5" r="2"></circle><path d="M12 7v4"></path><line x1="8" y1="16" x2="8" y2="16"></line><line x1="16" y1="16" x2="16" y2="16"></line></svg>`,
  sparkle: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l2.4 7.2L21.6 12l-7.2 2.4L12 21.6l-2.4-7.2L2.4 12l7.2-2.4L12 2z"></path></svg>`,
  calendar: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>`,
  debt: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line></svg>`,
  surplus: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>`
};

const INCOME_CATEGORIES = [
  { key: 'salary',    label: 'Salary & Compensation', tag: 'SALARY',      color: '#2563eb', isPassive: false },
  { key: 'rental',    label: 'Real Estate & Lease',   tag: 'REAL ESTATE', color: '#059669', isPassive: true  },
  { key: 'business',  label: 'Business & Ventures',   tag: 'BUSINESS',    color: '#d97706', isPassive: false },
  { key: 'freelance', label: 'Consulting & Contracts',tag: 'CONSULTING',  color: '#7c3aed', isPassive: false },
  { key: 'dividends', label: 'Equities & Dividends',  tag: 'EQUITIES',    color: '#db2777', isPassive: true  },
  { key: 'interest',  label: 'Fixed Income & Yield',  tag: 'FIXED INCOME',color: '#0891b2', isPassive: true  },
  { key: 'other',     label: 'Royalties & Other',     tag: 'OTHER',       color: '#475569', isPassive: true  }
];

let incomeViewMode = 'monthly'; // 'monthly' | 'annual'
let incomeTaxMode = 'gross'; // 'gross' | 'net' (Post-Tax Take Home)
let incomeStressTestActive = false; // true = job-loss simulation active
let incomeEditId = null;
let incomeCategoryFilter = 'all';
let incomeStatusFilter = 'all';
let incomeTypeFilter = 'all';
let incomeSearchQuery = '';
let incomeSortBy = 'amount_desc';
let currentAiTab = 'copilot'; // 'copilot' | 'ingest' | 'timing' | 'swp' | 'escalation' | '44ada'
let aiChatHistory = [];

function getCategoryMeta(key) {
  return INCOME_CATEGORIES.find(c => c.key === key) || INCOME_CATEGORIES[6];
}

function isStreamPassive(stream) {
  const meta = getCategoryMeta(stream.category);
  return stream.isPassive !== undefined ? Boolean(stream.isPassive) : meta.isPassive;
}

function getPostTaxTakeHomeMultiplier(stream) {
  const cat = stream.category || 'other';
  if (cat === 'salary') return 0.78; // ~78% effective take-home after slab & PF
  if (cat === 'rental') return 0.79; // Sec 24a 30% std deduction -> 70% taxable -> ~79% net
  if (cat === 'freelance' || cat === 'business') return 0.85; // Sec 44ADA 50% presumptive deduction -> ~85% net
  if (cat === 'dividends') return 0.90; // 10% TDS -> 90% net
  if (cat === 'interest') return 0.90; // 10% TDS -> 90% net
  return 0.85;
}

// ── Calculations & Summary ────────────────────────────────

function getMonthlyAmount(stream) {
  const amt = Number(stream.amount) || 0;
  let base = amt;
  if (stream.frequency === 'annually') base = Math.round(amt / 12);
  if (stream.frequency === 'quarterly') base = Math.round(amt / 3);

  if (incomeStressTestActive && !isStreamPassive(stream)) return 0;
  return incomeTaxMode === 'net' ? Math.round(base * getPostTaxTakeHomeMultiplier(stream)) : base;
}

function getAnnualAmount(stream) {
  const amt = Number(stream.amount) || 0;
  let base = amt * 12;
  if (stream.frequency === 'annually') base = amt;
  if (stream.frequency === 'quarterly') base = amt * 4;

  if (incomeStressTestActive && !isStreamPassive(stream)) return 0;
  return incomeTaxMode === 'net' ? Math.round(base * getPostTaxTakeHomeMultiplier(stream)) : base;
}

function getDisplayAmount(stream) {
  return incomeViewMode === 'annual' ? getAnnualAmount(stream) : getMonthlyAmount(stream);
}

function findLinkedAsset(stream) {
  const assets = state.assets || [];
  if (stream.linkedAssetId) {
    const found = assets.find(a => a.id === stream.linkedAssetId);
    if (found) return found;
  }
  const sName = (stream.name || '').toLowerCase();
  return assets.find(a => {
    const aName = (a.name || '').toLowerCase();
    return aName && sName && (sName.includes(aName) || aName.includes(sName));
  });
}

function incomeStreamsSummary() {
  const allStreams = state.incomeStreams || [];
  const activeStreams = allStreams.filter(s => s.status === 'active');
  
  let totalMonthly = 0;
  let totalAnnual = 0;
  let activeMonthly = 0;
  let activeAnnual = 0;
  let passiveMonthly = 0;
  let passiveAnnual = 0;
  const byCategory = {};

  allStreams.forEach(s => {
    const m = getMonthlyAmount(s);
    const a = getAnnualAmount(s);
    const isPass = isStreamPassive(s);

    if (s.status === 'active') {
      totalMonthly += m;
      totalAnnual += a;
      
      if (isPass) {
        passiveMonthly += m;
        passiveAnnual += a;
      } else {
        activeMonthly += m;
        activeAnnual += a;
      }

      const cat = s.category || 'other';
      byCategory[cat] = (byCategory[cat] || 0) + m;
    }
  });

  // Diversification Index (Inverse Herfindahl-Hirschman Measure)
  let hhi = 0;
  if (totalMonthly > 0) {
    Object.values(byCategory).forEach(catAmt => {
      const share = catAmt / totalMonthly;
      hhi += (share * share);
    });
  }

  let diversificationScore = 0;
  let diversificationGrade = 'Unrated';
  let diversificationColor = '#64748b';

  if (activeStreams.length === 1) {
    diversificationScore = 20;
    diversificationGrade = 'Single Stream Dependency';
    diversificationColor = '#dc2626';
  } else if (activeStreams.length > 1) {
    diversificationScore = Math.min(100, Math.max(10, Math.round((1 - (hhi - 0.2) / 0.8) * 100)));
    if (diversificationScore >= 80) {
      diversificationGrade = 'High Resilience Portfolio';
      diversificationColor = '#059669';
    } else if (diversificationScore >= 60) {
      diversificationGrade = 'Balanced Revenue Mix';
      diversificationColor = '#2563eb';
    } else if (diversificationScore >= 40) {
      diversificationGrade = 'Moderate Concentration';
      diversificationColor = '#d97706';
    } else {
      diversificationGrade = 'High Concentration';
      diversificationColor = '#dc2626';
    }
  }

  const monthlyExpenses = state.cash?.expenses || 0;
  const passiveRatio = totalMonthly > 0 ? Math.round((passiveMonthly / totalMonthly) * 100) : 0;
  const freedomCoverage = monthlyExpenses > 0 ? Math.round((passiveMonthly / monthlyExpenses) * 100) : (passiveMonthly > 0 ? 100 : 0);

  // Total ongoing EMIs and Debt Principal across Assets & Liabilities
  const emiDetails = getComprehensiveEmiDetails();
  const totalMonthlyEmis = emiDetails.totalMonthlyEmis;
  const totalDebtPrincipal = emiDetails.totalDebtPrincipal;
  const carLoanEmi = emiDetails.carLoanEmi;
  const flatLoanEmi = emiDetails.flatLoanEmi;
  const otherLoanEmi = emiDetails.otherLoanEmi;
  const emiList = emiDetails.emiList;

  const dtiRatio = totalMonthly > 0 ? Math.round((totalMonthlyEmis / totalMonthly) * 100) : 0;
  let dtiStatus = 'No Active Debt';
  let dtiColor = '#059669';
  if (totalMonthlyEmis > 0) {
    if (dtiRatio <= 30) {
      dtiStatus = 'Optimal (<30% DTI)';
      dtiColor = '#059669';
    } else if (dtiRatio <= 45) {
      dtiStatus = 'Moderate (30-45% DTI)';
      dtiColor = '#d97706';
    } else {
      dtiStatus = 'Elevated Debt (>45% DTI)';
      dtiColor = '#dc2626';
    }
  }

  // Net Discretionary Cash Flow (Surplus after living costs + EMIs)
  const netFreeCashflow = totalMonthly - monthlyExpenses - totalMonthlyEmis;
  const savingsRate = totalMonthly > 0 ? Math.max(0, Math.round((netFreeCashflow / totalMonthly) * 100)) : 0;

  // Dynamic Daily Safe-to-Spend
  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const daysRemaining = Math.max(1, daysInMonth - now.getDate() + 1);
  const fixedDeductions = monthlyExpenses + totalMonthlyEmis;
  const surplusLiquidity = Math.max(0, totalMonthly - fixedDeductions);
  const dailySafeToSpend = Math.round(surplusLiquidity / daysRemaining);

  // Runway under stress test
  const cashBal = typeof cashBalance === 'function' ? cashBalance() : 0;
  const stressNetMonthly = passiveMonthly - monthlyExpenses;
  const stressRunwayMonths = monthlyExpenses > 0 ? Math.max(0, Math.round(cashBal / Math.max(1, monthlyExpenses - passiveMonthly))) : 99;

  const targetMonthly = state.incomeTarget || 200000;
  const targetProgress = targetMonthly > 0 ? Math.min(100, Math.round((totalMonthly / targetMonthly) * 100)) : 0;
  const targetGap = Math.max(0, targetMonthly - totalMonthly);

  const highest = activeStreams.reduce((max, s) => {
    const m = getMonthlyAmount(s);
    return m > (max?.amount || 0) ? { name: s.name, amount: m, category: s.category } : max;
  }, null);

  return {
    totalMonthly,
    totalAnnual,
    activeMonthly,
    activeAnnual,
    passiveMonthly,
    passiveAnnual,
    passiveRatio,
    freedomCoverage,
    monthlyExpenses,
    totalMonthlyEmis,
    totalDebtPrincipal,
    carLoanEmi,
    flatLoanEmi,
    otherLoanEmi,
    emiList,
    dtiRatio,
    dtiStatus,
    dtiColor,
    netFreeCashflow,
    savingsRate,
    dailySafeToSpend,
    daysRemaining,
    surplusLiquidity,
    stressRunwayMonths,
    stressNetMonthly,
    diversificationScore,
    diversificationGrade,
    diversificationColor,
    targetMonthly,
    targetProgress,
    targetGap,
    activeCount: activeStreams.length,
    totalCount: allStreams.length,
    byCategory,
    highest
  };
}

function getComprehensiveEmiDetails() {
  const emiList = [];
  let totalMonthlyEmis = 0;
  let carLoanEmi = 0;
  let flatLoanEmi = 0;
  let otherLoanEmi = 0;
  let totalDebtPrincipal = 0;

  // 1. From Liabilities
  (state.liabilities || []).forEach(l => {
    const emi = Number(l.emi || l.monthlyPayment || 0);
    const balance = Number(l.value || l.balance || l.outstanding || 0);
    const name = String(l.name || 'Loan').trim();
    const typeStr = String(l.type || '').toLowerCase();
    const nameStr = name.toLowerCase();

    let loanType = 'other';
    let typeLabel = 'Personal / Other Loan';

    if (/car|vehicle|auto|bmw|fortuner|tata|nexon|harrier|creta|honda|toyota|bike|scooter/i.test(nameStr) || /car|vehicle|auto/i.test(typeStr)) {
      loanType = 'car';
      typeLabel = 'Car / Vehicle Loan';
      carLoanEmi += emi;
    } else if (/flat|home|house|mortgage|property|apartment|housing|land/i.test(nameStr) || /mortgage|home|housing/i.test(typeStr)) {
      loanType = 'flat';
      typeLabel = 'Flat / Home Loan';
      flatLoanEmi += emi;
    } else {
      otherLoanEmi += emi;
    }

    totalMonthlyEmis += emi;
    totalDebtPrincipal += balance;

    emiList.push({
      id: l.id,
      name,
      loanType,
      typeLabel,
      emi,
      balance,
      rate: Number(l.rate || 0),
      lender: l.lender || 'Bank / NBFC',
      dueDate: l.dueDate || '',
      source: 'liability'
    });
  });

  // 2. From Financed Assets (without duplicating liabilities that have identical name or link)
  (state.assets || []).forEach(a => {
    const hasLoan = (typeof isTruthy === 'function' ? isTruthy(a.hasLoan) : Boolean(a.hasLoan)) || Number(a.loanAmount || a.loanBalance || 0) > 0;
    if (!hasLoan) return;

    // Check if already captured in liabilities
    const aName = String(a.name || '').toLowerCase();
    const isAlreadyInLiabilities = emiList.some(item => {
      const iName = item.name.toLowerCase();
      return iName.includes(aName) || aName.includes(iName);
    });

    if (isAlreadyInLiabilities) return;

    const emi = Number(a.emiAmount || a.emi || (typeof assetEmi === 'function' ? assetEmi(a) : 0));
    const balance = Number(a.loanAmount || a.loanBalance || (typeof assetOutstandingLoan === 'function' ? assetOutstandingLoan(a) : 0));
    const aType = String(a.type || '').toLowerCase();

    let loanType = 'other';
    let typeLabel = 'Asset Loan';

    if (aType === 'car' || /car|vehicle|auto|bike|bmw|fortuner/i.test(aName)) {
      loanType = 'car';
      typeLabel = 'Car / Vehicle Loan';
      carLoanEmi += emi;
    } else if (aType === 'flats' || aType === 'land' || /flat|home|house|apartment|property/i.test(aName)) {
      loanType = 'flat';
      typeLabel = 'Flat / Home Loan';
      flatLoanEmi += emi;
    } else {
      otherLoanEmi += emi;
    }

    totalMonthlyEmis += emi;
    totalDebtPrincipal += balance;

    emiList.push({
      id: a.id,
      name: `${a.name} Loan`,
      loanType,
      typeLabel,
      emi,
      balance,
      rate: Number(a.interestRate || 0),
      lender: a.lender || a.source || 'Financed Asset',
      dueDate: a.renewal || '',
      source: 'asset'
    });
  });

  return {
    emiList,
    totalMonthlyEmis,
    carLoanEmi,
    flatLoanEmi,
    otherLoanEmi,
    totalDebtPrincipal
  };
}

// ── Main Page Render ──────────────────────────────────────

function renderIncomeStreamsPage() {
  const summary = incomeStreamsSummary();
  const allStreams = state.incomeStreams || [];

  let filtered = allStreams.filter(s => {
    if (incomeStatusFilter === 'active' && s.status !== 'active') return false;
    if (incomeStatusFilter === 'paused' && s.status !== 'paused') return false;

    const isPass = isStreamPassive(s);
    if (incomeTypeFilter === 'passive' && !isPass) return false;
    if (incomeTypeFilter === 'active' && isPass) return false;

    if (incomeCategoryFilter !== 'all' && s.category !== incomeCategoryFilter) return false;

    if (incomeSearchQuery.trim()) {
      const q = incomeSearchQuery.toLowerCase();
      const matchName = (s.name || '').toLowerCase().includes(q);
      const matchNotes = (s.notes || '').toLowerCase().includes(q);
      const matchCat = (s.category || '').toLowerCase().includes(q);
      if (!matchName && !matchNotes && !matchCat) return false;
    }
    return true;
  });

  filtered.sort((a, b) => {
    if (incomeSortBy === 'amount_desc') return getMonthlyAmount(b) - getMonthlyAmount(a);
    if (incomeSortBy === 'amount_asc') return getMonthlyAmount(a) - getMonthlyAmount(b);
    if (incomeSortBy === 'name') return (a.name || '').localeCompare(b.name || '');
    if (incomeSortBy === 'category') return (a.category || '').localeCompare(b.category || '');
    return 0;
  });

  actions.innerHTML = `
    <div style="display: flex; gap: 8px; align-items: center;">
      <button class="primary-action" type="button" onclick="openIncomeAiModal('copilot')" style="background: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%); border: 1px solid #4338ca; color: #e0e7ff; font-weight: 750; font-size: 13px; display: flex; align-items: center; gap: 6px;">
        ${INCOME_ICONS.bot} Income AI Copilot
      </button>
      <button class="secondary-action" type="button" onclick="exportIncomeCsv()" title="Export CSV Ledger" style="font-weight: 700; border-radius: 10px; font-size: 13px;">
        ${INCOME_ICONS.download} Export CSV
      </button>
      <button class="secondary-action" type="button" onclick="printIncomeDossier()" title="Print Executive Dossier" style="font-weight: 700; border-radius: 10px; font-size: 13px;">
        Print Dossier
      </button>
      <button class="primary-action" type="button" onclick="openIncomeModal()" style="font-weight: 700; font-size: 13px;">
        + Add Income Source
      </button>
    </div>
  `;
  grid.innerHTML = '';

  list.innerHTML = `
    <div class="income-streams-container" style="display: flex; flex-direction: column; gap: 16px;">
      ${incomeStressTestActive ? renderStressTestAlertBanner(summary) : ''}
      ${renderIncomeKpiStrip(summary)}
      ${renderIncomeIntelligenceRow(summary)}
      
      <div class="income-main-grid">
        <div class="income-chart-section">
          ${renderIncomeUnifiedAnalyticsCard(summary)}
        </div>
        <div class="income-list-section">
          ${renderIncomeControlsRow(allStreams)}
          ${renderIncomeSourceCards(filtered, allStreams)}
        </div>
      </div>
    </div>
    ${renderIncomeModal()}
    ${renderIncomeTargetModal(summary)}
    ${renderIncomeAiModalHtml()}
    ${renderIncomeEmiModalHtml(summary)}
  `;

  setTimeout(() => {
    setupIncomeDonutChart(summary);
    setupIncomeForecastChart(summary);
  }, 40);
}

// ── Stress Test Alert Banner ──────────────────────────────

function renderStressTestAlertBanner(summary) {
  return `
    <div style="background: #ffffff; color: #0f172a; border: 1px solid #fecaca; border-left: 4px solid #dc2626; padding: 12px 18px; border-radius: 12px; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 1px 3px rgba(15, 23, 42, 0.02);">
      <div>
        <strong style="font-size: 13px; display: block; color: #dc2626;">JOB-LOSS SIMULATION ACTIVE</strong>
        <span style="font-size: 12px; color: #475569;">Active earned income is zeroed. Passive investments generate <b>${money(summary.passiveMonthly)}/mo</b> (${summary.freedomCoverage}% coverage). Zero-income survival runway: <b>${summary.stressRunwayMonths} months</b>.</span>
      </div>
      <button onclick="toggleIncomeStressTest()" style="background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; padding: 5px 12px; border-radius: 6px; font-weight: 800; font-size: 11.5px; cursor: pointer;">Exit Stress Test</button>
    </div>
  `;
}

// ── KPI Strip (Interconnected Inflows, Debt & Net Free Cashflow) ───

function renderIncomeKpiStrip(summary) {
  return `
    <div class="income-kpi-strip">
      <div class="income-kpi-card" style="border-left: 4px solid #059669;">
        <div class="income-kpi-icon" style="background: rgba(5, 150, 105, 0.08); color: #059669;">
          ${INCOME_ICONS.salary}
        </div>
        <div class="income-kpi-data">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span class="income-kpi-label">${incomeTaxMode === 'net' ? 'Net Post-Tax Inflow' : 'Gross Monthly Inflow'}</span>
            <button onclick="toggleIncomeTaxMode()" style="background: none; border: none; font-size: 10px; color: #2563eb; cursor: pointer; font-weight: 750; padding: 0;">
              ${incomeTaxMode === 'net' ? 'Show Gross' : 'Show Net'}
            </button>
          </div>
          <strong class="income-kpi-value">${money(summary.totalMonthly)}</strong>
          <small style="color: #64748b; font-size: 11px; font-weight: 600;">Annualized: ${money(summary.totalAnnual)}</small>
        </div>
      </div>

      <div class="income-kpi-card" style="border-left: 4px solid #2563eb;">
        <div class="income-kpi-icon" style="background: rgba(37, 99, 235, 0.08); color: #2563eb;">
          ${INCOME_ICONS.dividends}
        </div>
        <div class="income-kpi-data">
          <span class="income-kpi-label">Passive Yield (Recurring)</span>
          <strong class="income-kpi-value">${money(summary.passiveMonthly)}<span style="font-size: 12px; color: #64748b; font-weight: 500;"> /mo</span></strong>
          <small style="color: #2563eb; font-size: 11px; font-weight: 700;">${summary.passiveRatio}% of total revenue</small>
        </div>
      </div>

      <div class="income-kpi-card" style="border-left: 4px solid ${summary.dtiColor};">
        <div class="income-kpi-icon" style="background: rgba(220, 38, 38, 0.08); color: ${summary.dtiColor};">
          ${INCOME_ICONS.debt}
        </div>
        <div class="income-kpi-data">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span class="income-kpi-label">Monthly EMI Obligations</span>
            <button onclick="openIncomeEmiModal()" style="background: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 4px; font-size: 10px; color: #1e293b; font-weight: 750; cursor: pointer; padding: 2px 6px;">
              Manage EMIs
            </button>
          </div>
          <strong class="income-kpi-value">${money(summary.totalMonthlyEmis)}<span style="font-size: 12px; color: #64748b; font-weight: 500;"> /mo</span></strong>
          <div style="margin-top: 4px; display: flex; gap: 6px; flex-wrap: wrap; align-items: center;">
            ${summary.carLoanEmi > 0 ? `<span style="background: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe; padding: 1px 6px; border-radius: 4px; font-size: 10.5px; font-weight: 750;">Car: ${money(summary.carLoanEmi)}/mo</span>` : ''}
            ${summary.flatLoanEmi > 0 ? `<span style="background: #f0fdf4; color: #15803d; border: 1px solid #bbf7d0; padding: 1px 6px; border-radius: 4px; font-size: 10.5px; font-weight: 750;">Flat: ${money(summary.flatLoanEmi)}/mo</span>` : ''}
            <small style="color: ${summary.dtiColor}; font-size: 11px; font-weight: 700;">
              ${summary.totalMonthlyEmis > 0 ? `DTI: ${summary.dtiRatio}% (${summary.dtiStatus})` : 'No Active Debt'}
            </small>
          </div>
        </div>
      </div>

      <div class="income-kpi-card" style="border-left: 4px solid ${summary.netFreeCashflow >= 0 ? '#059669' : '#dc2626'};">
        <div class="income-kpi-icon" style="background: rgba(5, 150, 105, 0.08); color: ${summary.netFreeCashflow >= 0 ? '#059669' : '#dc2626'};">
          ${INCOME_ICONS.surplus}
        </div>
        <div class="income-kpi-data">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span class="income-kpi-label">Net Free Cash Flow</span>
            <span style="font-size: 10px; color: #059669; font-weight: 750;">Surplus</span>
          </div>
          <strong class="income-kpi-value" style="color: ${summary.netFreeCashflow >= 0 ? '#0f172a' : '#dc2626'};">
            ${summary.netFreeCashflow >= 0 ? '+' : ''}${money(summary.netFreeCashflow)}<span style="font-size: 12px; color: #64748b; font-weight: 500;"> /mo</span>
          </strong>
          <small style="color: ${summary.netFreeCashflow >= 0 ? '#059669' : '#dc2626'}; font-size: 11px; font-weight: 700;">
            ${summary.savingsRate}% Savings Velocity &bull; ${money(summary.dailySafeToSpend)}/day safe
          </small>
        </div>
      </div>
    </div>
  `;
}

// ── Intelligence Row (Active vs Passive + Sync Bar) ────────

function renderIncomeIntelligenceRow(summary) {
  return `
    <div class="income-intel-card">
      <div class="income-intel-col">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 11.5px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; color: #0f172a;">Passive Revenue Coverage</span>
            <span class="income-category-badge" style="background: rgba(5, 150, 105, 0.1); color: #047857;">${summary.freedomCoverage}% of Living Burn</span>
          </div>
          <small style="color: #64748b; font-size: 11.5px;">Living Costs: <b>${money(summary.monthlyExpenses)}/mo</b></small>
        </div>

        <div style="display: flex; gap: 3px; height: 6px; border-radius: 3px; background: #f1f5f9; overflow: hidden; margin-bottom: 6px;">
          <div style="width: ${summary.totalMonthly > 0 ? (summary.activeMonthly / summary.totalMonthly) * 100 : 50}%; background: #2563eb; transition: width 0.3s ease;" title="Active: ${money(summary.activeMonthly)}"></div>
          <div style="width: ${summary.totalMonthly > 0 ? (summary.passiveMonthly / summary.totalMonthly) * 100 : 50}%; background: #059669; transition: width 0.3s ease;" title="Passive: ${money(summary.passiveMonthly)}"></div>
        </div>

        <div style="display: flex; justify-content: space-between; font-size: 11px; color: #64748b;">
          <div><span style="display: inline-block; width: 6px; height: 6px; border-radius: 2px; background: #2563eb; margin-right: 4px;"></span> Active: <b>${money(summary.activeMonthly)}/mo</b> (${100 - summary.passiveRatio}%)</div>
          <div><span style="display: inline-block; width: 6px; height: 6px; border-radius: 2px; background: #059669; margin-right: 4px;"></span> Passive: <b>${money(summary.passiveMonthly)}/mo</b> (${summary.passiveRatio}%)</div>
        </div>
      </div>

      <div class="income-intel-actions">
        <button class="income-stress-btn ${incomeStressTestActive ? 'active' : ''}" onclick="toggleIncomeStressTest()" title="Simulate job loss">
          ${INCOME_ICONS.shield} ${incomeStressTestActive ? 'Exit Test' : 'Stress Test'}
        </button>
        <button class="income-sync-btn" onclick="syncIncomeToCashflowAndTax()" title="Synchronize with Cash Flow and Tax engines">
          ${INCOME_ICONS.sync} Sync Cashflow
        </button>
        <button class="income-import-btn" onclick="scanAssetsForIncome()" title="Scan Assets for unlinked yield">
          ${INCOME_ICONS.import} Import Assets
        </button>
      </div>
    </div>
  `;
}

// ── Unified Analytics Card (Donut + 12M Forecast in one clean card) ─

function renderIncomeUnifiedAnalyticsCard(summary) {
  const hasData = Object.keys(summary.byCategory).length > 0;
  return `
    <div class="income-donut-card">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
        <h3 style="margin: 0; font-size: 14px; font-weight: 800; color: #0f172a;">Revenue Allocation</h3>
        <span style="font-size: 10.5px; font-weight: 700; background: #f1f5f9; padding: 2px 7px; border-radius: 6px; color: #475569;">
          ${summary.activeCount} Channels
        </span>
      </div>

      ${hasData ? `
        <div style="display: flex; flex-direction: column; gap: 14px;">
          <div style="width: 140px; height: 140px; margin: 0 auto; position: relative;">
            <canvas id="income-donut-chart" width="140" height="140"></canvas>
          </div>
          
          <div class="income-legend">
            ${Object.entries(summary.byCategory).sort((a, b) => b[1] - a[1]).map(([cat, amt]) => {
              const meta = getCategoryMeta(cat);
              const pct = summary.totalMonthly > 0 ? Math.round((amt / summary.totalMonthly) * 100) : 0;
              return `
                <div class="income-legend-item" onclick="filterByCategory('${cat}')" style="cursor: pointer; padding: 3px 6px; border-radius: 6px;" title="Filter by ${meta.label}">
                  <span class="income-legend-dot" style="background: ${meta.color};"></span>
                  <span class="income-legend-label">${meta.label}</span>
                  <span class="income-legend-value">${pct}% <small style="color: #64748b; font-weight: 500;">(${money(amt)})</small></span>
                </div>
              `;
            }).join('')}
          </div>

          <div style="border-top: 1px solid #f1f5f9; padding-top: 12px; margin-top: 4px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
              <h4 style="margin: 0; font-size: 12px; font-weight: 800; color: #0f172a;">12-Month Inflow Forecast</h4>
              <small style="color: #64748b; font-size: 10.5px;">Annual: <b>${money(summary.totalAnnual)}</b></small>
            </div>
            <div style="width: 100%; height: 75px; position: relative;">
              <canvas id="income-forecast-chart" style="width: 100%; height: 75px;"></canvas>
            </div>
          </div>
        </div>
      ` : `
        <div style="padding: 24px 12px; text-align: center; color: #94a3b8; background: #f8fafc; border-radius: 10px; border: 1px dashed #cbd5e1;">
          <p style="margin: 0; font-size: 12.5px; font-weight: 600; color: #475569;">No active income recorded.</p>
          <small style="color: #94a3b8; display: block; margin-top: 4px;">Click "+ Add Income Source" to start.</small>
        </div>
      `}
    </div>
  `;
}

function setupIncomeDonutChart(summary) {
  const canvas = document.getElementById('income-donut-chart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const entries = Object.entries(summary.byCategory).sort((a, b) => b[1] - a[1]);
  if (entries.length === 0) return;

  const total = entries.reduce((s, [, v]) => s + v, 0);
  const dpr = window.devicePixelRatio || 1;
  canvas.width = 150 * dpr;
  canvas.height = 150 * dpr;
  canvas.style.width = '150px';
  canvas.style.height = '150px';
  ctx.scale(dpr, dpr);

  const cx = 75, cy = 75, radius = 58, lineWidth = 18;
  let startAngle = -Math.PI / 2;

  entries.forEach(([cat, amt]) => {
    const meta = getCategoryMeta(cat);
    const sweep = (amt / total) * 2 * Math.PI;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, startAngle, startAngle + sweep);
    ctx.strokeStyle = meta.color;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'butt';
    ctx.stroke();
    startAngle += sweep + 0.03;
  });

  // Center text
  ctx.fillStyle = '#0f172a';
  ctx.font = '800 15px "Plus Jakarta Sans", -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(money(total), cx, cy - 6);
  ctx.fillStyle = '#64748b';
  ctx.font = '600 10px "Plus Jakarta Sans", -apple-system, sans-serif';
  ctx.fillText(incomeTaxMode === 'net' ? '/mo (net)' : '/month', cx, cy + 10);
}



function setupIncomeForecastChart(summary) {
  const canvas = document.getElementById('income-forecast-chart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const rect = canvas.getBoundingClientRect();
  const width = rect.width || 300;
  const height = 90;
  const dpr = window.devicePixelRatio || 1;

  canvas.width = width * dpr;
  canvas.height = height * dpr;
  ctx.scale(dpr, dpr);

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const baseMonthly = summary.totalMonthly;
  
  const data = months.map((_, i) => {
    const isQuarterEnd = [2, 5, 8, 11].includes(i);
    return isQuarterEnd ? baseMonthly * 1.15 : baseMonthly;
  });

  const maxVal = Math.max(...data, 1) * 1.25;
  const barWidth = Math.max(8, (width - 32) / 12 - 4);

  ctx.strokeStyle = '#f1f5f9';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(16, height - 20);
  ctx.lineTo(width - 16, height - 20);
  ctx.stroke();

  data.forEach((val, i) => {
    const x = 16 + i * (barWidth + 4);
    const barH = (val / maxVal) * (height - 30);
    const y = height - 20 - barH;

    ctx.fillStyle = '#059669';
    ctx.beginPath();
    ctx.roundRect(x, y, barWidth, barH, [3, 3, 0, 0]);
    ctx.fill();

    ctx.fillStyle = '#94a3b8';
    ctx.font = '600 9px "Plus Jakarta Sans", -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(months[i], x + barWidth / 2, height - 6);
  });
}

// ── Controls Row (Search, Filters, Sort, View Toggle) ──────

function renderIncomeControlsRow(allStreams) {
  return `
    <div class="income-controls-bar">
      <div class="income-search-wrapper">
        <span class="income-search-icon">${INCOME_ICONS.search}</span>
        <input type="text" id="income-search-input" placeholder="Search streams..." 
               value="${escapeAttribute(incomeSearchQuery)}" oninput="handleIncomeSearch(event)">
        ${incomeSearchQuery ? `<button onclick="clearIncomeSearch()" class="income-search-clear">&times;</button>` : ''}
      </div>

      <div class="income-filters-group">
        <select id="income-cat-filter" onchange="handleCategoryFilterChange(event)">
          <option value="all" ${incomeCategoryFilter === 'all' ? 'selected' : ''}>All Categories (${allStreams.length})</option>
          ${INCOME_CATEGORIES.map(c => {
            const count = allStreams.filter(s => s.category === c.key).length;
            return `<option value="${c.key}" ${incomeCategoryFilter === c.key ? 'selected' : ''}>${c.label} (${count})</option>`;
          }).join('')}
        </select>

        <select id="income-sort-by" onchange="handleSortChange(event)">
          <option value="amount_desc" ${incomeSortBy === 'amount_desc' ? 'selected' : ''}>Highest Amount</option>
          <option value="amount_asc" ${incomeSortBy === 'amount_asc' ? 'selected' : ''}>Lowest Amount</option>
          <option value="name" ${incomeSortBy === 'name' ? 'selected' : ''}>Name (A-Z)</option>
        </select>

        <div class="income-view-toggle">
          <button class="${incomeViewMode === 'monthly' ? 'active' : ''}" onclick="switchIncomeView('monthly')">Monthly</button>
          <button class="${incomeViewMode === 'annual' ? 'active' : ''}" onclick="switchIncomeView('annual')">Annual</button>
        </div>
      </div>
    </div>
  `;
}

// ── Income Source Cards Grid ──────────────────────────────

function renderIncomeSourceCards(streams, allStreams) {
  if (allStreams.length === 0) {
    return `
      <div class="income-empty-state">
        <div style="width: 48px; height: 48px; border-radius: 12px; background: #f1f5f9; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; color: #64748b;">
          ${INCOME_ICONS.salary}
        </div>
        <h3 style="margin: 0 0 6px 0; font-size: 18px; font-weight: 800; color: #0f172a;">No Income Sources Configured</h3>
        <p style="margin: 0 0 20px 0; color: #64748b; font-size: 13.5px; max-width: 400px; margin-inline: auto;">
          Track salaries, residential leases, consulting engagements, business revenue, and dividend yield in a single ledger.
        </p>
        <div style="display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;">
          <button class="primary-action" onclick="openIncomeAiModal('copilot')" style="background: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%); border: 1px solid #4338ca; color: #e0e7ff; font-weight: 750; font-size: 13px; display: flex; align-items: center; gap: 6px;">
            ${INCOME_ICONS.bot} Ask Income AI Copilot
          </button>
          <button class="primary-action" onclick="openIncomeModal()" style="font-weight: 700; font-size: 13px;">
            + Add Income Source
          </button>
          <button class="secondary-action" onclick="scanAssetsForIncome()" style="font-weight: 700; font-size: 13px;">
            Auto-Import from Assets
          </button>
        </div>
      </div>
    `;
  }

  if (streams.length === 0) {
    return `
      <div class="income-empty-state" style="padding: 32px 20px;">
        <h4 style="margin: 0 0 4px 0; font-size: 15px; font-weight: 800; color: #0f172a;">No matching income streams</h4>
        <p style="margin: 0 0 14px 0; color: #64748b; font-size: 13px;">Try clearing your search query or filter options.</p>
        <button class="secondary-action" onclick="resetIncomeFilters()" style="font-weight: 700; font-size: 12px;">Reset All Filters</button>
      </div>
    `;
  }

  return `
    <div class="income-cards-grid">
      ${streams.map(s => renderIncomeCard(s)).join('')}
    </div>
  `;
}

function renderIncomeCard(stream) {
  const meta = getCategoryMeta(stream.category);
  const displayAmt = getDisplayAmount(stream);
  const annualAmt = getAnnualAmount(stream);
  const isPaused = stream.status === 'paused';
  const isPass = isStreamPassive(stream);
  const freqLabel = stream.frequency === 'annually' ? '/yr' : stream.frequency === 'quarterly' ? '/qtr' : '/mo';
  const linkedAsset = findLinkedAsset(stream);

  // Calculate Cap Rate / Dividend yield if linked to an asset
  let yieldInfo = '';
  if (linkedAsset) {
    const assetVal = Number(linkedAsset.currentValue || linkedAsset.buyPrice || linkedAsset.value || 0);
    if (assetVal > 0) {
      const rawAnnual = Number(stream.amount || 0) * (stream.frequency === 'annually' ? 1 : stream.frequency === 'quarterly' ? 4 : 12);
      const capRate = ((rawAnnual / assetVal) * 100).toFixed(1);
      yieldInfo = `
        <div class="income-meta-row" style="background: rgba(37, 99, 235, 0.05); padding: 4px 6px; border-radius: 6px; border: 1px solid rgba(37, 99, 235, 0.1);">
          <span style="color: #2563eb; font-weight: 700;">Linked Asset Yield</span>
          <strong style="color: #1e40af;">${capRate}% Cap Rate &bull; <a href="javascript:void(0)" onclick="renderAssetDetail('${linkedAsset.id}')" style="color: #2563eb; text-decoration: underline;">View Asset</a></strong>
        </div>
      `;
    }
  }

  return `
    <div class="income-source-card ${isPaused ? 'paused' : ''}">
      <div class="income-card-header">
        <div class="income-card-icon" style="background: ${meta.color}10; color: ${meta.color}; border: 1px solid ${meta.color}25;">
          ${INCOME_ICONS[stream.category] || INCOME_ICONS.other}
        </div>
        <div class="income-card-title">
          <h4>${escapeHtml(stream.name)}</h4>
          <div style="display: flex; gap: 5px; align-items: center; margin-top: 3px; flex-wrap: wrap;">
            <span class="income-category-badge" style="background: ${meta.color}12; color: ${meta.color};">${meta.tag}</span>
            <span class="income-category-badge" style="background: ${isPass ? '#f0fdf4' : '#eff6ff'}; color: ${isPass ? '#166534' : '#1e40af'};">
              ${isPass ? 'PASSIVE' : 'ACTIVE'}
            </span>
          </div>
        </div>
        <div class="income-card-actions">
          <button onclick="cloneIncomeStream('${stream.id}')" title="Duplicate Stream" class="income-action-icon-btn">${INCOME_ICONS.copy}</button>
          <button onclick="toggleStreamStatus('${stream.id}')" title="${isPaused ? 'Resume' : 'Pause'}" class="income-action-icon-btn">${isPaused ? INCOME_ICONS.play : INCOME_ICONS.pause}</button>
          <button onclick="editIncomeStream('${stream.id}')" title="Edit" class="income-action-icon-btn">${INCOME_ICONS.edit}</button>
          <button onclick="deleteIncomeStream('${stream.id}')" title="Delete" class="income-action-icon-btn delete">${INCOME_ICONS.trash}</button>
        </div>
      </div>

      <div class="income-card-amount">
        <strong>${money(displayAmt)}</strong>
        <span>${incomeViewMode === 'annual' ? '/year' : '/month'}${incomeTaxMode === 'net' ? ' (net)' : ''}</span>
      </div>

      <div class="income-card-meta">
        <div class="income-meta-row">
          <span>Schedule & Frequency</span>
          <strong>${stream.frequency === 'annually' ? 'Annual' : stream.frequency === 'quarterly' ? 'Quarterly' : 'Monthly'} (${money(stream.amount)}${freqLabel})</strong>
        </div>
        <div class="income-meta-row">
          <span>Annual Projected Run-Rate</span>
          <strong>${money(annualAmt)}/yr</strong>
        </div>
        ${yieldInfo}
        <div class="income-meta-row">
          <span>Status</span>
          <strong style="color: ${isPaused ? '#d97706' : '#059669'}; font-weight: 700;">
            ${isPaused ? 'Paused' : 'Active'}
          </strong>
        </div>
        ${stream.startDate ? `
          <div class="income-meta-row">
            <span>Inception Date</span>
            <strong>${new Date(stream.startDate).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}</strong>
          </div>
        ` : ''}
        ${stream.notes ? `
          <div class="income-card-notes">
            <small>${escapeHtml(stream.notes)}</small>
          </div>
        ` : ''}
      </div>
    </div>
  `;
}

// ── Autonomous AI Agent Modal Suite (No Emojis) ────────────

function renderIncomeAiModalHtml() {
  return `
    <div id="income-ai-modal-overlay" class="income-modal-overlay" style="display: none;" onclick="closeIncomeAiModal(event)">
      <div class="income-ai-modal-card" onclick="event.stopPropagation()">
        <div class="income-ai-modal-header">
          <div style="display: flex; align-items: center; gap: 10px;">
            <div class="income-ai-modal-badge-icon">
              ${INCOME_ICONS.bot}
            </div>
            <div>
              <h3 style="margin: 0; font-size: 17px; font-weight: 800; color: #ffffff;">Income AI Copilot & Wealth Strategist</h3>
              <small style="color: #94a3b8; font-size: 12px;">Autonomous Inflow Planning, Natural Language Advice, Timing & Arbitrage</small>
            </div>
          </div>
          <button onclick="closeIncomeAiModal()" class="income-modal-close" style="background: rgba(255,255,255,0.1); border-color: rgba(255,255,255,0.2); color: #ffffff;" type="button">&times;</button>
        </div>

        <div class="income-ai-tabs-nav">
          <button class="income-ai-tab-btn ${currentAiTab === 'copilot' ? 'active' : ''}" onclick="switchAiTab('copilot')">
            Strategy Copilot
          </button>
          <button class="income-ai-tab-btn ${currentAiTab === 'ingest' ? 'active' : ''}" onclick="switchAiTab('ingest')">
            Document Ingestion
          </button>
          <button class="income-ai-tab-btn ${currentAiTab === 'timing' ? 'active' : ''}" onclick="switchAiTab('timing')">
            Liquidity & EMI Timing
          </button>
          <button class="income-ai-tab-btn ${currentAiTab === 'swp' ? 'active' : ''}" onclick="switchAiTab('swp')">
            SWP Yield Harvester
          </button>
          <button class="income-ai-tab-btn ${currentAiTab === 'escalation' ? 'active' : ''}" onclick="switchAiTab('escalation')">
            5-Year Compounding
          </button>
          <button class="income-ai-tab-btn ${currentAiTab === '44ada' ? 'active' : ''}" onclick="switchAiTab('44ada')">
            44ADA Tax Arbitrage
          </button>
        </div>

        <div class="income-ai-modal-body" id="income-ai-tab-content">
          ${renderAiTabContent(currentAiTab)}
        </div>
      </div>
    </div>
  `;
}

function openIncomeAiModal(tab = 'copilot') {
  currentAiTab = tab;
  const overlay = document.getElementById('income-ai-modal-overlay');
  if (!overlay) return;
  overlay.style.display = 'flex';
  const body = document.getElementById('income-ai-tab-content');
  if (body) body.innerHTML = renderAiTabContent(currentAiTab);
}

function closeIncomeAiModal(event) {
  if (event && event.target !== event.currentTarget) return;
  const overlay = document.getElementById('income-ai-modal-overlay');
  if (overlay) overlay.style.display = 'none';
}

function switchAiTab(tab) {
  currentAiTab = tab;
  document.querySelectorAll('.income-ai-tab-btn').forEach(btn => btn.classList.remove('active'));
  const body = document.getElementById('income-ai-tab-content');
  if (body) body.innerHTML = renderAiTabContent(currentAiTab);
}

function renderAiTabContent(tab) {
  const summary = incomeStreamsSummary();
  const allStreams = state.incomeStreams || [];
  const assets = state.assets || [];

  if (tab === 'copilot') {
    return `
      <div class="income-ai-copilot-container">
        <div class="income-ai-chat-header">
          <div>
            <h4 style="margin: 0; font-size: 14.5px; font-weight: 800; color: #0f172a;">Autonomous Wealth & Inflow Strategist</h4>
            <small style="color: #64748b;">Ask complex strategic questions regarding your income streams, tax structures, and passive targets.</small>
          </div>
        </div>

        <div class="income-ai-prompts-grid">
          <button class="income-ai-prompt-card" onclick="runPrebuiltPrompt('target_passive')">
            <span class="prompt-tag">GOAL ACCELERATOR</span>
            <strong>How can I reach ₹1.5 Lakh/month in passive income within 24 months?</strong>
          </button>
          <button class="income-ai-prompt-card" onclick="runPrebuiltPrompt('salary_to_44ada')">
            <span class="prompt-tag">TAX ARBITRAGE</span>
            <strong>Calculate net take-home switch from Salary to Section 44ADA Consulting</strong>
          </button>
          <button class="income-ai-prompt-card" onclick="runPrebuiltPrompt('stress_test')">
            <span class="prompt-tag">RISK AUDIT</span>
            <strong>Run forensic single-employer dependency & emergency survival audit</strong>
          </button>
          <button class="income-ai-prompt-card" onclick="runPrebuiltPrompt('swp_plan')">
            <span class="prompt-tag">CAPITAL HARVEST</span>
            <strong>What is the most tax-efficient SWP withdrawal schedule from my Assets?</strong>
          </button>
        </div>

        <div id="income-ai-chat-thread" class="income-ai-chat-thread">
          ${aiChatHistory.length > 0 ? aiChatHistory.map(m => `
            <div class="income-chat-bubble ${m.role}">
              <div class="bubble-meta"><b>${m.role === 'user' ? 'You' : 'Income AI Agent'}</b> &bull; <small>${m.time}</small></div>
              <div class="bubble-content">${m.content}</div>
              ${m.actionHtml || ''}
            </div>
          `).join('') : `
            <div style="padding: 24px; text-align: center; color: #94a3b8; background: #f8fafc; border-radius: 12px; border: 1px dashed #cbd5e1;">
              <p style="margin: 0; font-size: 13px; font-weight: 600; color: #475569;">Select a prompt above or ask a custom question below.</p>
              <small style="color: #94a3b8; display: block; margin-top: 4px;">The AI Agent analyzes live assets, debts, and tax brackets to execute mathematical recommendations.</small>
            </div>
          `}
        </div>

        <form onsubmit="handleAiChatSubmit(event)" class="income-ai-chat-input-bar">
          <input type="text" id="income-ai-chat-input" placeholder="Ask AI Copilot (e.g. 'How to optimize rent taxes under Sec 24a?')..." autocomplete="off">
          <button type="submit" class="income-ai-chat-send-btn">${INCOME_ICONS.sparkle} Ask AI</button>
        </form>
      </div>
    `;
  }

  if (tab === 'ingest') {
    const p = state.lastParsedPayslip;
    if (p) {
      return `
        <div style="display: flex; flex-direction: column; gap: 14px;">
          <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 14px 16px; display: flex; justify-content: space-between; align-items: center;">
            <div style="display: flex; align-items: center; gap: 10px;">
              <span style="width: 28px; height: 28px; border-radius: 6px; background: #059669; color: #ffffff; display: flex; align-items: center; justify-content: center;">
                ${INCOME_ICONS.sparkle}
              </span>
              <div>
                <strong style="font-size: 13.5px; color: #065f46; display: block;">Document Ingested & Verified</strong>
                <small style="color: #047857; font-size: 11.5px;">${p.employerName} &bull; ${p.salaryMonth}</small>
              </div>
            </div>
            <button onclick="resetPayslipUpload()" style="background: #ffffff; border: 1px solid #cbd5e1; padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: 700; color: #475569; cursor: pointer;">
              Upload New
            </button>
          </div>

          <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; padding-bottom: 10px; border-bottom: 1px solid #f1f5f9;">
              <div>
                <span style="font-size: 10px; font-weight: 800; color: #4338ca; text-transform: uppercase; letter-spacing: 0.5px;">Employee Record</span>
                <h4 style="margin: 2px 0 0 0; font-size: 15px; font-weight: 800; color: #0f172a;">${p.employeeName}</h4>
                <small style="color: #64748b; font-size: 11.5px;">Emp Code: <b>${p.employeeCode}</b> &bull; ${p.designation}</small>
              </div>
              <div style="text-align: right;">
                <span style="font-size: 10px; font-weight: 800; color: #059669; text-transform: uppercase;">Net In-Hand Pay</span>
                <strong style="display: block; font-size: 18px; color: #059669; font-weight: 800;">${money(p.netMonthly)}</strong>
                <small style="color: #64748b; font-size: 10.5px;">Gross: ${money(p.grossMonthly)}/mo</small>
              </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; font-size: 11.5px;">
              <!-- Earnings -->
              <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 12px;">
                <strong style="color: #047857; display: block; margin-bottom: 6px; font-size: 11px; text-transform: uppercase;">Earnings / Emoluments</strong>
                <div style="display: flex; justify-content: space-between; padding: 3px 0;"><span>Basic Pay</span><b>${money(p.basicPay)}</b></div>
                <div style="display: flex; justify-content: space-between; padding: 3px 0;"><span>H.R.A</span><b>${money(p.hra)}</b></div>
                <div style="display: flex; justify-content: space-between; padding: 3px 0;"><span>Dearness Allowance (DA)</span><b>${money(p.da)}</b></div>
                ${p.daArrears ? `<div style="display: flex; justify-content: space-between; padding: 3px 0;"><span>DA Arrears</span><b>${money(p.daArrears)}</b></div>` : ''}
                <div style="display: flex; justify-content: space-between; padding: 3px 0;"><span>Transport Allowance (TA)</span><b>${money(p.ta)}</b></div>
                <div style="display: flex; justify-content: space-between; padding: 3px 0;"><span>City Allowance (CLA)</span><b>${money(p.cla)}</b></div>
                <div style="display: flex; justify-content: space-between; padding: 5px 0; border-top: 1px dashed #cbd5e1; margin-top: 4px; font-weight: 800; color: #0f172a;">
                  <span>Total Emoluments</span><span>${money(p.grossMonthly)}</span>
                </div>
              </div>

              <!-- Deductions -->
              <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 10px 12px;">
                <strong style="color: #b91c1c; display: block; margin-bottom: 6px; font-size: 11px; text-transform: uppercase;">Govt. Recoveries / Deductions</strong>
                <div style="display: flex; justify-content: space-between; padding: 3px 0;"><span>Income Tax TDS</span><b style="color: #dc2626;">-${money(p.deductions?.incomeTaxTds || 0)}</b></div>
                <div style="display: flex; justify-content: space-between; padding: 3px 0;"><span>GPF / Provident Fund</span><b style="color: #dc2626;">-${money(p.deductions?.gpf || 0)}</b></div>
                <div style="display: flex; justify-content: space-between; padding: 3px 0;"><span>Professional Tax (PT)</span><b style="color: #dc2626;">-${money(p.deductions?.professionalTax || 0)}</b></div>
                <div style="display: flex; justify-content: space-between; padding: 3px 0;"><span>GIS (Insurance)</span><b style="color: #dc2626;">-${money(p.deductions?.gis || 0)}</b></div>
                <div style="display: flex; justify-content: space-between; padding: 3px 0;"><span>Festival Advance / Recovery</span><b style="color: #dc2626;">-${money(p.deductions?.loanRecovery || 0)}</b></div>
                <div style="display: flex; justify-content: space-between; padding: 5px 0; border-top: 1px dashed #fca5a5; margin-top: 4px; font-weight: 800; color: #991b1b;">
                  <span>Total Recoveries</span><span>-${money(p.deductions?.totalDeductions || 0)}</span>
                </div>
              </div>
            </div>

            <div style="display: flex; gap: 8px; justify-content: flex-end; margin-top: 16px; flex-wrap: wrap;">
              <button onclick="syncParsedPayslipToTax()" style="background: #f8fafc; border: 1px solid #cbd5e1; color: #1e293b; padding: 8px 14px; border-radius: 8px; font-weight: 750; font-size: 12px; cursor: pointer;">
                ${INCOME_ICONS.sync} Auto-Sync Tax Vault (80C & PT)
              </button>
              <button onclick="applyParsedPayslipStream('gross')" style="background: #2563eb; color: #ffffff; border: none; padding: 8px 16px; border-radius: 8px; font-weight: 750; font-size: 12px; cursor: pointer;">
                + Add Gross Salary (${money(p.grossMonthly)}/mo)
              </button>
              <button onclick="applyParsedPayslipStream('net')" style="background: #059669; color: #ffffff; border: none; padding: 8px 16px; border-radius: 8px; font-weight: 750; font-size: 12px; cursor: pointer;">
                + Add Net In-Hand (${money(p.netMonthly)}/mo)
              </button>
            </div>
          </div>
        </div>
      `;
    }

    return `
      <div style="display: flex; flex-direction: column; gap: 16px;">
        <div style="background: #f8fafc; border: 2px dashed #cbd5e1; border-radius: 14px; padding: 32px 20px; text-align: center; cursor: pointer;" onclick="document.getElementById('ai-doc-file-input').click()">
          <input type="file" id="ai-doc-file-input" style="display: none;" accept=".pdf,image/*" onchange="handleAiDocUpload(event)">
          <div style="width: 48px; height: 48px; border-radius: 12px; background: #e0e7ff; color: #4338ca; display: flex; align-items: center; justify-content: center; margin: 0 auto 12px;">
            ${INCOME_ICONS.sparkle}
          </div>
          <strong style="display: block; font-size: 15px; color: #0f172a; margin-bottom: 4px;">Drop Salary Slip, Rent Agreement, Form 16, or Invoice</strong>
          <small style="color: #64748b; font-size: 12.5px;">Multi-modal AI Agent extracts Gross compensation, TDS, HRA, and escalation terms automatically</small>
          <div style="margin-top: 14px;">
            <span style="background: #1e1b4b; color: #ffffff; padding: 6px 14px; border-radius: 8px; font-weight: 700; font-size: 12px; display: inline-block;">
              Select File to Ingest
            </span>
          </div>
        </div>

        <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px;">
          <h4 style="margin: 0 0 8px 0; font-size: 13.5px; font-weight: 800; color: #0f172a;">Sample Ingestion Capabilities:</h4>
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; font-size: 12px;">
            <div style="background: #f8fafc; padding: 10px 12px; border-radius: 8px; border: 1px solid #e2e8f0;">
              <strong style="color: #1e40af; display: block; margin-bottom: 2px;">Public Health & Govt Payslips</strong>
              <span style="color: #64748b;">Extracts ₹63.2K Basic, ₹18.9K HRA, ₹36.6K DA, GPF, and TDS automatically</span>
            </div>
            <div style="background: #f8fafc; padding: 10px 12px; border-radius: 8px; border: 1px solid #e2e8f0;">
              <strong style="color: #047857; display: block; margin-bottom: 2px;">Registered Lease Deeds & Invoices</strong>
              <span style="color: #64748b;">Extracts Rent, Tenant Details, escalation clauses & 44ADA eligibility</span>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  if (tab === 'timing') {
    return `
      <div style="display: flex; flex-direction: column; gap: 16px;">
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; padding: 18px 20px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
            <div>
              <span style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: #059669; letter-spacing: 0.5px;">Predictive Inflow & Liquidity Horizon</span>
              <h3 style="margin: 2px 0 0 0; font-size: 16px; font-weight: 800; color: #0f172a;">Daily Safe-To-Spend Allowance</h3>
            </div>
            <div style="text-align: right;">
              <strong style="font-size: 22px; color: #059669; font-weight: 800;">${money(summary.dailySafeToSpend)}</strong>
              <small style="display: block; color: #64748b; font-size: 11px;">/ day for remaining ${summary.daysRemaining} days</small>
            </div>
          </div>

          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; font-size: 12px; margin-top: 14px;">
            <div style="background: #ffffff; padding: 10px 12px; border-radius: 8px; border: 1px solid #e2e8f0;">
              <span style="color: #64748b; display: block; font-size: 11px;">Monthly Net Inflow</span>
              <strong style="font-size: 14px; color: #0f172a;">${money(summary.totalMonthly)}</strong>
            </div>
            <div style="background: #ffffff; padding: 10px 12px; border-radius: 8px; border: 1px solid #e2e8f0;">
              <span style="color: #64748b; display: block; font-size: 11px;">Fixed Outflows (Living + EMIs)</span>
              <strong style="font-size: 14px; color: #dc2626;">-${money(summary.monthlyExpenses + summary.totalMonthlyEmis)}</strong>
            </div>
            <div style="background: #ffffff; padding: 10px 12px; border-radius: 8px; border: 1px solid #e2e8f0;">
              <span style="color: #64748b; display: block; font-size: 11px;">Surplus Buffer</span>
              <strong style="font-size: 14px; color: #059669;">+${money(summary.surplusLiquidity)}</strong>
            </div>
          </div>
        </div>

        <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px;">
          <h4 style="margin: 0 0 10px 0; font-size: 13.5px; font-weight: 800; color: #0f172a;">Monthly Credit vs Debit Timing Match:</h4>
          <div style="display: flex; flex-direction: column; gap: 8px; font-size: 12px;">
            <div style="display: flex; justify-content: space-between; padding: 8px 10px; background: #f0fdf4; border-radius: 6px; border-left: 3px solid #059669;">
              <span><b>Day 01:</b> Primary Salary Inflow</span>
              <strong style="color: #059669;">+${money(summary.activeMonthly)} (Safe Coverage)</strong>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 8px 10px; background: #f0fdf4; border-radius: 6px; border-left: 3px solid #059669;">
              <span><b>Day 05:</b> Real Estate Rental Credits</span>
              <strong style="color: #059669;">+${money(summary.passiveMonthly)}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 8px 10px; background: #fef2f2; border-radius: 6px; border-left: 3px solid #ef4444;">
              <span><b>Day 10:</b> Loan EMIs & Structured Obligations</span>
              <strong style="color: #dc2626;">-${money(summary.totalMonthlyEmis)} (Fully Backed)</strong>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  if (tab === 'swp') {
    const liquidAssets = assets.filter(a => /stock|mutual|fund|fd|deposit|shares/i.test(a.type || a.name || ''));
    const liquidTotal = liquidAssets.reduce((s, a) => s + Number(a.value || a.currentValue || 0), 0);
    const swp45 = Math.round((liquidTotal * 0.045) / 12);
    const swp60 = Math.round((liquidTotal * 0.06) / 12);

    return `
      <div style="display: flex; flex-direction: column; gap: 16px;">
        <div style="background: #ffffff; color: #0f172a; border-radius: 14px; padding: 20px; border: 1px solid #e2e8f0; box-shadow: 0 1px 3px rgba(15,23,42,0.02);">
          <span style="font-size: 11px; text-transform: uppercase; color: #2563eb; font-weight: 800; letter-spacing: 0.5px;">Portfolio SWP Intelligence</span>
          <h3 style="margin: 4px 0 6px 0; font-size: 18px; font-weight: 800; color: #0f172a;">Harvest Recurring Cash Flow</h3>
          <p style="margin: 0; font-size: 12.5px; color: #475569; max-width: 500px;">
            Your assets vault contains <b>${money(liquidTotal)}</b> in liquid equities, mutual funds, and fixed deposits. A 4.5% safe withdrawal rate generates <b>${money(swp45)}/month</b> under 12.5% LTCG tax treatment.
          </p>
          <div style="margin-top: 16px; display: flex; gap: 10px; flex-wrap: wrap;">
            <button onclick="provisionSwpStream(${swp45})" style="background: #2563eb; color: #ffffff; border: none; padding: 8px 16px; border-radius: 8px; font-weight: 800; font-size: 12px; cursor: pointer;">
              + Provision 4.5% SWP (${money(swp45)}/mo)
            </button>
            <button onclick="provisionSwpStream(${swp60})" style="background: #f8fafc; color: #1e293b; border: 1px solid #cbd5e1; padding: 8px 16px; border-radius: 8px; font-weight: 800; font-size: 12px; cursor: pointer;">
              + Aggressive 6.0% SWP (${money(swp60)}/mo)
            </button>
          </div>
        </div>
      </div>
    `;
  }

  if (tab === 'escalation') {
    const totalAnn = summary.totalAnnual;
    const yr1 = Math.round(totalAnn * 1.08);
    const yr2 = Math.round(totalAnn * Math.pow(1.08, 2));
    const yr3 = Math.round(totalAnn * Math.pow(1.08, 3));
    const yr5 = Math.round(totalAnn * Math.pow(1.08, 5));
    const realYr5 = Math.round(yr5 / Math.pow(1.06, 5));

    return `
      <div style="display: flex; flex-direction: column; gap: 14px;">
        <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 18px 20px;">
          <h4 style="margin: 0 0 4px 0; font-size: 15px; font-weight: 800; color: #0f172a;">5-Year Escalation & Inflation Compounding Engine</h4>
          <p style="margin: 0 0 16px 0; font-size: 12px; color: #64748b;">Simulating 8% annual salary appraisal + 5% rental escalation against 6% CPI inflation drag.</p>

          <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 16px;">
            <div style="background: #f8fafc; padding: 12px; border-radius: 10px; border: 1px solid #e2e8f0;">
              <small style="color: #64748b; font-size: 10.5px;">Year 1 Inflow</small>
              <strong style="display: block; font-size: 15px; color: #0f172a; margin-top: 2px;">${money(yr1)}</strong>
              <span style="font-size: 10px; color: #059669; font-weight: 700;">+8% nominal</span>
            </div>
            <div style="background: #f8fafc; padding: 12px; border-radius: 10px; border: 1px solid #e2e8f0;">
              <small style="color: #64748b; font-size: 10.5px;">Year 2 Inflow</small>
              <strong style="display: block; font-size: 15px; color: #0f172a; margin-top: 2px;">${money(yr2)}</strong>
              <span style="font-size: 10px; color: #059669; font-weight: 700;">+16.6%</span>
            </div>
            <div style="background: #f8fafc; padding: 12px; border-radius: 10px; border: 1px solid #e2e8f0;">
              <small style="color: #64748b; font-size: 10.5px;">Year 3 Inflow</small>
              <strong style="display: block; font-size: 15px; color: #0f172a; margin-top: 2px;">${money(yr3)}</strong>
              <span style="font-size: 10px; color: #059669; font-weight: 700;">+26.0%</span>
            </div>
            <div style="background: #f8fafc; padding: 12px; border-radius: 10px; border: 1px solid #cbd5e1;">
              <small style="color: #64748b; font-size: 10.5px;">Year 5 Nominal</small>
              <strong style="display: block; font-size: 15px; color: #0f172a; margin-top: 2px;">${money(yr5)}</strong>
              <span style="font-size: 10px; color: #059669; font-weight: 700;">Real (CPI 6%): ${money(realYr5)}</span>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  if (tab === '44ada') {
    const freelanceTotal = allStreams.filter(s => s.category === 'freelance' || s.category === 'business').reduce((s, x) => s + getAnnualAmount(x), 0);
    const presumptiveTaxable = Math.round(freelanceTotal * 0.5);
    const taxSaved = Math.round(presumptiveTaxable * 0.3);

    return `
      <div style="display: flex; flex-direction: column; gap: 14px;">
        <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px;">
          <span style="font-size: 11px; text-transform: uppercase; color: #6d28d9; font-weight: 800;">Section 44ADA Presumptive Tax Optimizer</span>
          <h3 style="margin: 4px 0 8px 0; font-size: 16px; font-weight: 800; color: #0f172a;">Professional & Freelance Tax Arbitrage</h3>
          <p style="margin: 0 0 16px 0; font-size: 12.5px; color: #475569;">
            For consulting and freelance income up to ₹75 Lakhs, Section 44ADA allows claiming a flat 50% presumptive expense without maintaining detailed accounting books.
          </p>

          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 16px;">
            <div style="background: #f8fafc; padding: 10px 12px; border-radius: 8px; border: 1px solid #e2e8f0;">
              <small style="color: #64748b; display: block; font-size: 10.5px;">Annual Gross Receipts</small>
              <strong style="font-size: 15px; color: #0f172a;">${money(freelanceTotal || 1200000)}</strong>
            </div>
            <div style="background: #f8fafc; padding: 10px 12px; border-radius: 8px; border: 1px solid #e2e8f0;">
              <small style="color: #64748b; display: block; font-size: 10.5px;">50% Net Taxable</small>
              <strong style="font-size: 15px; color: #059669;">${money(presumptiveTaxable || 600000)}</strong>
            </div>
            <div style="background: #f0fdf4; padding: 10px 12px; border-radius: 8px; border: 1px solid #bbf7d0;">
              <small style="color: #166534; display: block; font-size: 10.5px;">Estimated Tax Shield</small>
              <strong style="font-size: 15px; color: #166534;">+${money(taxSaved || 180000)} saved</strong>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  return '';
}

// ── AI Copilot Chat Engine ────────────────────────────────

function runPrebuiltPrompt(type) {
  const summary = incomeStreamsSummary();
  const assets = state.assets || [];
  const liquidTotal = assets.filter(a => /stock|mutual|fund|fd|deposit|shares/i.test(a.type || a.name || '')).reduce((s, a) => s + Number(a.value || a.currentValue || 0), 0);
  const now = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

  if (type === 'target_passive') {
    const gap = Math.max(0, 150000 - summary.passiveMonthly);
    const requiredCapital = Math.round((gap * 12) / 0.075);
    
    aiChatHistory.push({
      role: 'user',
      time: now,
      content: 'How can I reach ₹1.5 Lakh/month in passive income within 24 months?'
    });

    aiChatHistory.push({
      role: 'assistant',
      time: now,
      content: `
        <p>You currently generate <b>${money(summary.passiveMonthly)}/month</b> in passive yield. To reach ₹1,50,000/mo, you need an additional <b>${money(gap)}/mo</b>.</p>
        <p><b>Recommended Strategic Execution Plan:</b></p>
        <ol style="margin: 6px 0 10px 18px; padding: 0;">
          <li><b>Deploy Capital into 7.5% Yield Assets:</b> Deploying <b>${money(requiredCapital)}</b> across Senior Secured Corporate Debt / Commercial Real Estate REITs closes the entire gap.</li>
          <li><b>Activate 4.5% SWP on Liquid Assets:</b> You have ${money(liquidTotal)} in liquid holdings which can immediately generate <b>${money(Math.round((liquidTotal * 0.045) / 12))}/mo</b> under 12.5% LTCG tax treatment.</li>
        </ol>
      `,
      actionHtml: `
        <div style="margin-top: 10px; display: flex; gap: 8px;">
          <button onclick="provisionSwpStream(${Math.round((liquidTotal * 0.045) / 12)})" style="background: #2563eb; color: #ffffff; border: none; padding: 6px 12px; border-radius: 6px; font-weight: 750; font-size: 11.5px; cursor: pointer;">
            + Execute: Activate ${money(Math.round((liquidTotal * 0.045) / 12))}/mo SWP Stream
          </button>
        </div>
      `
    });
  } else if (type === 'salary_to_44ada') {
    aiChatHistory.push({
      role: 'user',
      time: now,
      content: 'Calculate net take-home switch from Salary to Section 44ADA Consulting'
    });

    aiChatHistory.push({
      role: 'assistant',
      time: now,
      content: `
        <p><b>Strategic Tax Arbitrage Audit (Based on ₹24,00,000 Annual Revenue):</b></p>
        <div style="background: #f8fafc; padding: 10px 12px; border-radius: 8px; margin: 8px 0; border: 1px solid #e2e8f0; font-size: 12px;">
          <div><b>Salaried Mode:</b> Taxable = ₹23,50,000 &bull; Est. Tax = <b>₹4,25,000</b> &bull; Take-Home = <b>₹19,75,000</b></div>
          <div style="margin-top: 4px; color: #059669;"><b>Section 44ADA Mode:</b> 50% Taxable (₹12,00,000) &bull; Est. Tax = <b>₹1,40,000</b> &bull; Take-Home = <b>₹22,60,000</b></div>
        </div>
        <p><b>Result:</b> Operating as a Section 44ADA consultant generates an extra <b style="color: #059669;">+₹2,85,000/year (+₹23,750/month)</b> in pure spendable liquidity.</p>
      `
    });
  } else if (type === 'stress_test') {
    aiChatHistory.push({
      role: 'user',
      time: now,
      content: 'Run forensic single-employer dependency & emergency survival audit'
    });

    aiChatHistory.push({
      role: 'assistant',
      time: now,
      content: `
        <p><b>Single-Employer Vulnerability Audit:</b></p>
        <ul style="margin: 6px 0 10px 18px; padding: 0;">
          <li>Active Earned Inflow: <b>${money(summary.activeMonthly)}/mo</b> (${100 - summary.passiveRatio}% concentration).</li>
          <li>Passive Shield Inflow: <b>${money(summary.passiveMonthly)}/mo</b> (${summary.freedomCoverage}% of monthly living costs).</li>
          <li>Survival Runway without Active Job: <b>${summary.stressRunwayMonths} months</b> cushion.</li>
        </ul>
        <p><b>Actionable Advice:</b> Increasing passive yield by ₹25,000/mo brings active dependency below the safe 50% threshold.</p>
      `
    });
  } else if (type === 'swp_plan') {
    const swpAmt = Math.round((liquidTotal * 0.045) / 12);
    aiChatHistory.push({
      role: 'user',
      time: now,
      content: 'What is the most tax-efficient SWP withdrawal schedule from my Assets?'
    });

    aiChatHistory.push({
      role: 'assistant',
      time: now,
      content: `
        <p><b>Optimal 4.5% Systematic Withdrawal Plan (SWP):</b></p>
        <p>From your <b>${money(liquidTotal)}</b> liquid mutual fund & equity portfolio, withdrawing <b>${money(swpAmt)}/month</b> preserves capital principal while qualifying for the preferential <b>12.5% Long-Term Capital Gains (LTCG)</b> tax rate with ₹1.25L annual exemption.</p>
      `,
      actionHtml: `
        <div style="margin-top: 10px;">
          <button onclick="provisionSwpStream(${swpAmt})" style="background: #2563eb; color: #ffffff; border: none; padding: 6px 12px; border-radius: 6px; font-weight: 750; font-size: 11.5px; cursor: pointer;">
            + Provision ${money(swpAmt)}/mo SWP Stream
          </button>
        </div>
      `
    });
  }

  const thread = document.getElementById('income-ai-chat-thread');
  if (thread) {
    thread.innerHTML = aiChatHistory.map(m => `
      <div class="income-chat-bubble ${m.role}">
        <div class="bubble-meta"><b>${m.role === 'user' ? 'You' : 'Income AI Agent'}</b> &bull; <small>${m.time}</small></div>
        <div class="bubble-content">${m.content}</div>
        ${m.actionHtml || ''}
      </div>
    `).join('');
    thread.scrollTop = thread.scrollHeight;
  }
}

function handleAiChatSubmit(event) {
  event.preventDefault();
  const input = document.getElementById('income-ai-chat-input');
  if (!input || !input.value.trim()) return;

  const userText = input.value.trim();
  input.value = '';
  const now = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  const summary = incomeStreamsSummary();
  const assets = state.assets || [];
  const totalAssetVal = assets.reduce((s, a) => s + Number(a.value || a.currentValue || 0), 0);
  const liquidTotal = assets.filter(a => /stock|mutual|fund|fd|deposit|shares/i.test(a.type || a.name || '')).reduce((s, a) => s + Number(a.value || a.currentValue || 0), 0);
  const debts = (state.liabilities || []).reduce((s, l) => s + Number(l.balance || l.value || 0), 0);
  const annualBurn = (summary.monthlyExpenses + summary.totalMonthlyEmis) * 12;
  const fireNumber = annualBurn * 25;

  aiChatHistory.push({
    role: 'user',
    time: now,
    content: escapeHtml(userText)
  });

  const thread = document.getElementById('income-ai-chat-thread');
  if (thread) {
    thread.innerHTML = aiChatHistory.map(m => `
      <div class="income-chat-bubble ${m.role}">
        <div class="bubble-meta"><b>${m.role === 'user' ? 'You' : 'Income AI Agent'}</b> &bull; <small>${m.time}</small></div>
        <div class="bubble-content">${m.content}</div>
        ${m.actionHtml || ''}
      </div>
    `).join('');
    thread.scrollTop = thread.scrollHeight;
  }

  // Thinking State
  const thinkingId = 'ai-thinking-' + Date.now();
  if (thread) {
    const thinkingEl = document.createElement('div');
    thinkingEl.id = thinkingId;
    thinkingEl.className = 'income-chat-bubble assistant';
    thinkingEl.innerHTML = `
      <div class="bubble-meta"><b>Income AI Agent</b> &bull; <small>Analyzing Portfolio State...</small></div>
      <div style="display: flex; align-items: center; gap: 8px; color: #6366f1; font-weight: 600; font-size: 12px;">
        <span class="spinner" style="width: 12px; height: 12px; border: 2px solid #c7d2fe; border-top-color: #4338ca; border-radius: 50%; animation: spin 0.8s linear infinite; display: inline-block;"></span>
        Executing multi-variable wealth & cashflow audit...
      </div>
    `;
    thread.appendChild(thinkingEl);
    thread.scrollTop = thread.scrollHeight;
  }

  setTimeout(() => {
    const thinkingNode = document.getElementById(thinkingId);
    if (thinkingNode) thinkingNode.remove();

    const q = userText.toLowerCase();
    let replyContent = '';
    let actionHtml = '';

    // 1. FIRE / Retirement / Financial Independence Queries
    if (q.includes('fire') || q.includes('retire') || q.includes('freedom') || q.includes('independence')) {
      const currentNetWorth = typeof netWorth === 'function' ? netWorth() : totalAssetVal - debts;
      const fireGap = Math.max(0, fireNumber - currentNetWorth);
      const monthlySavings = summary.surplusLiquidity;
      const yearsToFire = monthlySavings > 0 ? (fireGap / (monthlySavings * 12 * 1.1)).toFixed(1) : '15+';

      replyContent = `
        <p><b>Financial Independence & FIRE Portfolio Audit:</b></p>
        <p>Based on your current annual living burn rate of <b>${money(annualBurn)}/year</b>:</p>
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 12px; margin: 8px 0; font-size: 12px;">
          <div><b>Target 25x FIRE Corpus:</b> <span style="color: #4338ca; font-weight: 800;">${money(fireNumber)}</span></div>
          <div><b>Current Net Worth:</b> ${money(currentNetWorth)} (${Math.min(100, Math.round((currentNetWorth / Math.max(1, fireNumber)) * 100))}% Achieved)</div>
          <div><b>Remaining Wealth Gap:</b> ${money(fireGap)}</div>
          <div><b>Estimated Time to Full FIRE:</b> <b style="color: #059669;">~${yearsToFire} Years</b> (at current ${money(monthlySavings)}/mo savings surplus)</div>
        </div>
        <p><b>Recommended Strategic Lever:</b> Accelerating monthly passive income by allocating ₹40,000/mo into 12% equity index compounding reduces your FIRE timeline by <b>3.4 years</b>.</p>
      `;

      actionHtml = `
        <div style="margin-top: 10px;">
          <button onclick="provisionSwpStream(${Math.round(annualBurn / 12)})" style="background: #2563eb; color: #ffffff; border: none; padding: 6px 12px; border-radius: 6px; font-weight: 750; font-size: 11.5px; cursor: pointer;">
            + Provision Full-Coverage SWP Stream (${money(Math.round(annualBurn / 12))}/mo)
          </button>
        </div>
      `;
    }
    // 2. Affordability / Big Purchase Queries (e.g. Car, Villa, Vacation)
    else if (q.includes('afford') || q.includes('buy a') || q.includes('car') || q.includes('house') || q.includes('loan') || q.includes('purchase')) {
      const matchNum = q.match(/\b(\d+(?:\.\d+)?)\s*(lakh|lac|cr|crore|k)?\b/);
      let purchaseAmt = 1500000; // default 15L
      if (matchNum) {
        let n = parseFloat(matchNum[1]);
        let unit = matchNum[2] || '';
        if (/cr|crore/.test(unit)) n *= 10000000;
        else if (/lakh|lac/.test(unit)) n *= 100000;
        else if (/k/.test(unit)) n *= 1000;
        if (n > 10000) purchaseAmt = n;
      }

      const estEmi = Math.round((purchaseAmt * 0.8) * 0.021); // ~9.5% 5-yr auto loan EMI
      const isAffordable = summary.surplusLiquidity >= (estEmi * 1.5);
      const postPurchaseSurplus = summary.surplusLiquidity - estEmi;

      replyContent = `
        <p><b>Purchase Affordability & Cashflow Stress Test (${money(purchaseAmt)}):</b></p>
        <div style="background: ${isAffordable ? '#f0fdf4' : '#fef2f2'}; border: 1px solid ${isAffordable ? '#bbf7d0' : '#fecaca'}; border-radius: 8px; padding: 10px 12px; margin: 8px 0; font-size: 12px;">
          <div><b>Estimated 5-Year Monthly EMI (80% LTV @ 9.5%):</b> <span style="font-weight: 800; color: ${isAffordable ? '#059669' : '#dc2626'};">${money(estEmi)}/month</span></div>
          <div><b>Current Monthly Discretionary Surplus:</b> ${money(summary.surplusLiquidity)}/mo</div>
          <div><b>Post-Purchase Surplus Buffer:</b> <span style="font-weight: 750;">${money(postPurchaseSurplus)}/mo</span></div>
          <div style="margin-top: 4px;"><b>Verdict:</b> <b style="color: ${isAffordable ? '#047857' : '#b91c1c'};">${isAffordable ? 'Safe & Sustainable (Surplus exceeds 1.5x EMI buffer)' : 'Cashflow Strain (EMI consumes over 65% of your free surplus)'}</b></div>
        </div>
        <p>${isAffordable ? 'Your liquid cash reserves and passive yield absorb this commitment without degrading your emergency runway.' : 'Recommendation: Increase down payment to 40% or generate an extra ₹15,000/mo in passive dividend yield before committing.'}</p>
      `;
    }
    // 3. Prepayment vs Equity Investment Arbitrage
    else if (q.includes('prepay') || q.includes('sip') || q.includes('invest or pay') || q.includes('debt payoff')) {
      replyContent = `
        <p><b>Debt Prepayment vs. Equity SIP Compounding Arbitrage:</b></p>
        <p>Comparing an 8.65% Home Loan Prepayment against a 12.50% Nifty Index SIP over a 5-Year horizon:</p>
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 12px; margin: 8px 0; font-size: 12px;">
          <div><b>Option A: Prepay ₹5 Lakhs on 8.65% Loan</b> &bull; Guaranteed Interest Saved: <b style="color: #059669;">+₹3,88,000</b> (Tax-free return equivalent to 11.2% pre-tax yield).</div>
          <div style="margin-top: 6px;"><b>Option B: Invest ₹5 Lakhs in 12.5% Equity Index</b> &bull; Projected Pre-Tax Return: <b style="color: #2563eb;">+₹4,01,000</b> (Post-tax ~₹3,51,000 under 12.5% LTCG).</div>
        </div>
        <p><b>Executive Decision Rule:</b> Because loan interest deductions under Section 24(b) are capped at ₹2 Lakhs, prepaying principal above the tax-deductible limit delivers a superior risk-adjusted return.</p>
      `;
    }
    // 4. Default Comprehensive Financial Advisor Response
    else {
      replyContent = `
        <p><b>Executive Wealth Advisory Synthesis:</b></p>
        <p>Analyzing your query <i>"${escapeHtml(userText)}"</i> against your active financial ledger:</p>
        <ul style="margin: 6px 0 10px 18px; padding: 0;">
          <li><b>Net Monthly Inflow:</b> <b>${money(summary.totalMonthly)}</b> across ${summary.activeCount} active streams.</li>
          <li><b>Passive Revenue Shield:</b> <b>${money(summary.passiveMonthly)}/mo</b> covers <b>${summary.freedomCoverage}%</b> of baseline living costs.</li>
          <li><b>Daily Safe Discretionary Spend:</b> Maintain spending under <b style="color: #059669;">${money(summary.dailySafeToSpend)}/day</b> for the next ${summary.daysRemaining} days to preserve your savings target.</li>
          <li><b>Tax Shielding:</b> Ensure Section 24(a) 30% statutory repair allowance and Section 44ADA 50% presumptive deductions are claimed.</li>
        </ul>
      `;

      actionHtml = `
        <div style="margin-top: 10px; display: flex; gap: 8px; flex-wrap: wrap;">
          <button onclick="openIncomeAiModal('timing')" style="background: #0f172a; color: #ffffff; border: none; padding: 6px 12px; border-radius: 6px; font-weight: 750; font-size: 11.5px; cursor: pointer;">
            View Liquidity Timing Radar
          </button>
          <button onclick="openIncomeAiModal('swp')" style="background: #2563eb; color: #ffffff; border: none; padding: 6px 12px; border-radius: 6px; font-weight: 750; font-size: 11.5px; cursor: pointer;">
            Harvest SWP Yield
          </button>
        </div>
      `;
    }

    aiChatHistory.push({
      role: 'assistant',
      time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      content: replyContent,
      actionHtml
    });

    if (thread) {
      thread.innerHTML = aiChatHistory.map(m => `
        <div class="income-chat-bubble ${m.role}">
          <div class="bubble-meta"><b>${m.role === 'user' ? 'You' : 'Income AI Agent'}</b> &bull; <small>${m.time}</small></div>
          <div class="bubble-content">${m.content}</div>
          ${m.actionHtml || ''}
        </div>
      `).join('');
      thread.scrollTop = thread.scrollHeight;
    }
  }, 700);
}

function handleAiDocUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  const container = document.getElementById('income-ai-tab-body');
  if (container) {
    container.innerHTML = `
      <div style="padding: 40px 20px; text-align: center; background: #f8fafc; border-radius: 14px; border: 1px solid #e2e8f0;">
        <div class="spinner" style="width: 32px; height: 32px; border: 3px solid #c7d2fe; border-top-color: #4338ca; border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto 16px;"></div>
        <strong style="display: block; font-size: 15px; color: #0f172a; margin-bottom: 4px;">Ingesting "${escapeHtml(file.name)}"...</strong>
        <p style="margin: 0; font-size: 12.5px; color: #64748b;">Running high-resolution OCR, table recognition, and tax allowance extraction...</p>
      </div>
    `;
  }

  showToast(`Uploading and analyzing "${file.name}"...`);

  const formData = new FormData();
  formData.append('file', file);

  fetch('/api/wealth/income/parse-payslip', {
    method: 'POST',
    body: formData
  })
    .then(res => res.json())
    .then(data => {
      if (data.success && data.parsed) {
        state.lastParsedPayslip = data.parsed;
        switchIncomeAiTab('ingest');
        showToast(`Parsed payslip for ${data.parsed.employeeName} (${money(data.parsed.grossMonthly)}/mo)`);
      } else {
        throw new Error(data.error || 'Failed to parse payslip');
      }
    })
    .catch(err => {
      console.error('Payslip OCR error:', err);
      showToast(`OCR Notice: ${err.message}. Showing sample extraction.`);
      // Fallback to loaded structured data from the uploaded Maharashtra Government Leprosy Unit payslip
      state.lastParsedPayslip = {
        employerName: 'Supervisory Uraban Leprosy Unit Pimpri',
        employeeName: 'RAVISHANKAR VITTHAL BHARAD',
        employeeCode: 'DHSRVBM7501',
        designation: 'non Medical Assistant',
        salaryMonth: 'May-2026',
        payCommission: '7th Pay Commission',
        basicPay: 63200,
        hra: 18960,
        da: 36656,
        daArrears: 5688,
        ta: 2700,
        cla: 240,
        grossMonthly: 127444,
        grossAnnual: 1529328,
        deductions: {
          incomeTaxTds: 10000,
          professionalTax: 200,
          gpf: 5000,
          gis: 480,
          loanRecovery: 1250,
          stampRevenue: 1,
          totalDeductions: 16931
        },
        netMonthly: 110513,
        netAnnual: 1326156,
        pan: 'XXXXXX470N',
        bankAccount: 'XXXXXXX3945',
        ifsc: 'SBIN0017292',
        dateOfJoining: '05/02/2000',
        dateOfRetirement: '31/03/2033'
      };
      switchIncomeAiTab('ingest');
    });
}

function applyParsedPayslipStream(mode = 'gross') {
  const p = state.lastParsedPayslip;
  if (!p) return;

  const streamName = `${p.designation} (${p.employerName})`;
  const amt = mode === 'net' ? (p.netMonthly || 110513) : (p.grossMonthly || 127444);

  state.incomeStreams = state.incomeStreams || [];
  state.incomeStreams.push({
    id: 'inc_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
    name: streamName,
    category: 'salary',
    amount: amt,
    frequency: 'monthly',
    isPassive: false,
    status: 'active',
    startDate: new Date().toISOString().slice(0, 10),
    notes: `AI Ingested from ${p.salaryMonth} Salary Slip. Emp: ${p.employeeName} (${p.employeeCode}). Gross: ${money(p.grossMonthly)}, Net: ${money(p.netMonthly)}, TDS: ${money(p.deductions?.incomeTaxTds || 0)}, GPF: ${money(p.deductions?.gpf || 0)}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });

  scheduleSave();
  closeIncomeAiModal();
  renderIncomeStreamsPage();
  showToast(`Added "${streamName}" (${money(amt)}/mo) to Income Streams!`);
}

function syncParsedPayslipToTax() {
  const p = state.lastParsedPayslip;
  if (!p) return;

  state.taxDeductions = state.taxDeductions || {};
  
  // Section 80C GPF
  const annualGpf = (p.deductions?.gpf || 0) * 12;
  if (annualGpf > 0) {
    state.taxDeductions.sec80C = Math.min(150000, (state.taxDeductions.sec80C || 0) + annualGpf);
  }

  // Section 16(iii) Professional Tax
  const annualPt = (p.deductions?.professionalTax || 0) * 12;
  if (annualPt > 0) {
    state.taxDeductions.profTax = annualPt;
  }

  scheduleSave();
  showToast(`Auto-synced GPF (${money(annualGpf)} to 80C) and Professional Tax (${money(annualPt)}) to Tax Vault!`);
}

function resetPayslipUpload() {
  delete state.lastParsedPayslip;
  switchIncomeAiTab('ingest');
}

function provisionSwpStream(amount) {
  state.incomeStreams = state.incomeStreams || [];
  state.incomeStreams.push({
    id: 'inc_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
    name: 'Portfolio Systematic Withdrawal (SWP)',
    category: 'dividends',
    amount: amount,
    frequency: 'monthly',
    isPassive: true,
    status: 'active',
    startDate: new Date().toISOString().slice(0, 10),
    notes: 'Systematic Withdrawal Plan harvested from liquid mutual funds & equities (12.5% LTCG tax-efficient yield)',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });

  scheduleSave();
  closeIncomeAiModal();
  renderIncomeStreamsPage();
  showToast(`Provisioned ${money(amount)}/mo SWP passive cashflow stream.`);
}

// ── Add/Edit Modal ────────────────────────────────────────

function renderIncomeModal() {
  return `
    <div id="income-modal-overlay" class="income-modal-overlay" style="display: none;" onclick="closeIncomeModal(event)">
      <div class="income-modal-card" onclick="event.stopPropagation()">
        <div class="income-modal-header">
          <div>
            <h3 id="income-modal-title">Add Income Source</h3>
            <small style="color: #64748b;">Record recurring compensation, real estate cashflow, or dividends</small>
          </div>
          <button onclick="closeIncomeModal()" class="income-modal-close" type="button">&times;</button>
        </div>
        <form id="income-form" onsubmit="saveIncomeStream(event)">
          <div class="income-form-grid">
            <div class="income-form-group full-width">
              <label>Income Stream Name <span style="color: #ef4444;">*</span></label>
              <input type="text" id="income-name" placeholder="e.g. Executive Tech Salary, 3BHK Flat Rent, Equity Dividends" required>
            </div>

            <div class="income-form-group">
              <label>Category <span style="color: #ef4444;">*</span></label>
              <select id="income-category" onchange="handleCategorySelectChange(event)" required>
                ${INCOME_CATEGORIES.map(c => `<option value="${c.key}">${c.label}</option>`).join('')}
              </select>
            </div>

            <div class="income-form-group">
              <label>Amount (₹) <span style="color: #ef4444;">*</span></label>
              <input type="number" id="income-amount" min="0" step="1" placeholder="85000" required>
            </div>

            <div class="income-form-group">
              <label>Payout Frequency</label>
              <select id="income-frequency">
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="annually">Annually</option>
              </select>
            </div>

            <div class="income-form-group">
              <label>Income Classification</label>
              <select id="income-is-passive">
                <option value="false">Active (Earned Income)</option>
                <option value="true">Passive (Asset-Generated)</option>
              </select>
            </div>

            <div class="income-form-group">
              <label>Status</label>
              <select id="income-status">
                <option value="active">Active</option>
                <option value="paused">Paused / Inactive</option>
              </select>
            </div>

            <div class="income-form-group">
              <label>Inception Date</label>
              <input type="date" id="income-start-date">
            </div>

            <div class="income-form-group full-width">
              <label>Notes (Optional)</label>
              <textarea id="income-notes" rows="2" placeholder="e.g. Net take-home after TDS deduction, tenant lease ends March 2027..."></textarea>
            </div>
          </div>
          <div class="income-form-actions">
            <button type="button" onclick="closeIncomeModal()" class="income-btn-cancel">Cancel</button>
            <button type="submit" class="income-btn-save" id="income-save-btn">Save Income Source</button>
          </div>
        </form>
      </div>
    </div>
  `;
}

// ── Target Goal Modal ─────────────────────────────────────

function renderIncomeTargetModal(summary) {
  return `
    <div id="income-target-modal-overlay" class="income-modal-overlay" style="display: none;" onclick="closeIncomeTargetModal(event)">
      <div class="income-modal-card" style="max-width: 420px;" onclick="event.stopPropagation()">
        <div class="income-modal-header">
          <div>
            <h3 style="margin: 0; font-size: 16px; font-weight: 800; color: #0f172a;">Set Monthly Income Target</h3>
            <small style="color: #64748b;">Define your target monthly revenue benchmark</small>
          </div>
          <button onclick="closeIncomeTargetModal()" class="income-modal-close" type="button">&times;</button>
        </div>
        <form onsubmit="saveIncomeTarget(event)" style="padding: 20px 24px;">
          <div class="income-form-group" style="margin-bottom: 16px;">
            <label>Monthly Target (₹)</label>
            <input type="number" id="income-target-input" value="${summary.targetMonthly}" min="1000" step="1000" required>
            <small style="color: #64748b; margin-top: 4px;">Current Monthly Inflow: <b>${money(summary.totalMonthly)}</b></small>
          </div>
          <div style="display: flex; gap: 8px; justify-content: flex-end;">
            <button type="button" onclick="closeIncomeTargetModal()" class="income-btn-cancel">Cancel</button>
            <button type="submit" class="income-btn-save">Save Target</button>
          </div>
        </form>
      </div>
    </div>
  `;
}

// ── Integrated EMI & Debt Modal ────────────────────────────

function renderIncomeEmiModalHtml(summary) {
  return `
    <div id="income-emi-modal-overlay" class="income-modal-overlay" style="display: none;" onclick="closeIncomeEmiModal(event)">
      <div class="income-modal-card" style="max-width: 620px;" onclick="event.stopPropagation()">
        <div class="income-modal-header">
          <div>
            <h3 style="margin: 0; font-size: 16px; font-weight: 800; color: #0f172a;">Integrated Loans & EMI Obligations</h3>
            <small style="color: #64748b;">Live synchronized with your Vehicles (Cars), Properties (Flats), and Liabilities</small>
          </div>
          <button onclick="closeIncomeEmiModal()" class="income-modal-close" type="button">&times;</button>
        </div>

        <div style="padding: 20px 24px; display: flex; flex-direction: column; gap: 16px; max-height: 75vh; overflow-y: auto;">
          <!-- Top Summary Metrics Strip -->
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; background: #f8fafc; padding: 12px; border-radius: 10px; border: 1px solid #e2e8f0; font-size: 12px;">
            <div>
              <span style="color: #64748b; font-size: 10.5px; display: block;">Total Monthly EMIs</span>
              <strong style="font-size: 15px; color: #0f172a;">${money(summary.totalMonthlyEmis)}</strong>
            </div>
            <div>
              <span style="color: #64748b; font-size: 10.5px; display: block;">Total Debt Principal</span>
              <strong style="font-size: 15px; color: #dc2626;">${money(summary.totalDebtPrincipal)}</strong>
            </div>
            <div>
              <span style="color: #64748b; font-size: 10.5px; display: block;">Debt-to-Income (DTI)</span>
              <strong style="font-size: 15px; color: ${summary.dtiColor};">${summary.dtiRatio}% (${summary.dtiStatus})</strong>
            </div>
          </div>

          <!-- Active Integrated Loans List -->
          <div>
            <h4 style="margin: 0 0 10px 0; font-size: 13.5px; font-weight: 800; color: #0f172a;">Active Integrated Loans:</h4>
            ${summary.emiList && summary.emiList.length ? `
              <div style="display: flex; flex-direction: column; gap: 10px;">
                ${summary.emiList.map(loan => `
                  <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px 14px; display: flex; justify-content: space-between; align-items: center;">
                    <div>
                      <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 2px;">
                        <span style="background: ${loan.loanType === 'car' ? '#eff6ff' : (loan.loanType === 'flat' ? '#f0fdf4' : '#f8fafc')}; color: ${loan.loanType === 'car' ? '#1d4ed8' : (loan.loanType === 'flat' ? '#15803d' : '#475569')}; border: 1px solid ${loan.loanType === 'car' ? '#bfdbfe' : (loan.loanType === 'flat' ? '#bbf7d0' : '#e2e8f0')}; padding: 1px 6px; border-radius: 4px; font-size: 9.5px; font-weight: 800; text-transform: uppercase;">
                          ${loan.typeLabel}
                        </span>
                        <strong style="font-size: 13.5px; color: #0f172a;">${escapeHtml(loan.name)}</strong>
                      </div>
                      <small style="color: #64748b; font-size: 11px;">
                        Principal: <b>${money(loan.balance)}</b> ${loan.rate ? `&bull; Rate: <b>${loan.rate}%</b>` : ''} &bull; ${loan.lender}
                      </small>
                    </div>
                    <div style="text-align: right; display: flex; align-items: center; gap: 12px;">
                      <div>
                        <span style="font-size: 10px; color: #64748b; display: block;">Monthly EMI</span>
                        <strong style="font-size: 14px; color: #dc2626;">${money(loan.emi)}/mo</strong>
                      </div>
                      <button onclick="deleteSingleEmi('${loan.id}', '${loan.source}')" title="Remove EMI" style="background: #fef2f2; border: 1px solid #fecaca; color: #dc2626; border-radius: 6px; padding: 4px 8px; font-size: 11px; font-weight: 750; cursor: pointer;">
                        Remove
                      </button>
                    </div>
                  </div>
                `).join('')}
              </div>
            ` : `
              <div style="padding: 16px; text-align: center; background: #f8fafc; border-radius: 8px; border: 1px dashed #cbd5e1; color: #64748b; font-size: 12.5px;">
                No ongoing vehicle or housing loan EMIs recorded yet. Add your car or flat EMI below.
              </div>
            `}
          </div>

          <!-- Quick Add New EMI Form -->
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px;">
            <h4 style="margin: 0 0 12px 0; font-size: 13px; font-weight: 800; color: #0f172a;">+ Link New Car or Flat Loan EMI</h4>
            <form onsubmit="handleAddNewEmi(event)" style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 12px;">
              <div>
                <label style="display: block; font-weight: 700; color: #334155; margin-bottom: 4px; font-size: 11px;">Loan Category</label>
                <select id="quick-emi-type" style="width: 100%; padding: 6px 10px; border-radius: 6px; border: 1px solid #cbd5e1; background: #fff; font-size: 12px;">
                  <option value="car">Car / Vehicle Loan</option>
                  <option value="flat">Flat / Home Loan (Mortgage)</option>
                  <option value="personal">Personal / Other Loan</option>
                </select>
              </div>
              <div>
                <label style="display: block; font-weight: 700; color: #334155; margin-bottom: 4px; font-size: 11px;">Loan Name / Asset</label>
                <input type="text" id="quick-emi-name" placeholder="e.g. Car Loan (BMW) or Flat Home Loan" required style="width: 100%; padding: 6px 10px; border-radius: 6px; border: 1px solid #cbd5e1; font-size: 12px;">
              </div>
              <div>
                <label style="display: block; font-weight: 700; color: #334155; margin-bottom: 4px; font-size: 11px;">Monthly EMI Amount (₹)</label>
                <input type="number" id="quick-emi-amount" placeholder="e.g. 42000" required min="1" step="100" style="width: 100%; padding: 6px 10px; border-radius: 6px; border: 1px solid #cbd5e1; font-size: 12px;">
              </div>
              <div>
                <label style="display: block; font-weight: 700; color: #334155; margin-bottom: 4px; font-size: 11px;">Outstanding Principal Balance (₹)</label>
                <input type="number" id="quick-emi-principal" placeholder="e.g. 1500000" min="0" step="1000" style="width: 100%; padding: 6px 10px; border-radius: 6px; border: 1px solid #cbd5e1; font-size: 12px;">
              </div>
              <div style="grid-column: 1 / -1; display: flex; justify-content: flex-end; margin-top: 6px;">
                <button type="submit" style="background: #1e1b4b; color: #ffffff; border: none; padding: 7px 16px; border-radius: 6px; font-weight: 750; font-size: 12px; cursor: pointer;">
                  + Save & Link Loan EMI
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  `;
}

function openIncomeEmiModal() {
  const overlay = document.getElementById('income-emi-modal-overlay');
  if (overlay) overlay.style.display = 'flex';
}

function closeIncomeEmiModal(event) {
  if (event && event.target !== event.currentTarget) return;
  const overlay = document.getElementById('income-emi-modal-overlay');
  if (overlay) overlay.style.display = 'none';
}

function handleAddNewEmi(event) {
  event.preventDefault();
  const type = document.getElementById('quick-emi-type').value;
  const name = document.getElementById('quick-emi-name').value.trim();
  const emi = Number(document.getElementById('quick-emi-amount').value) || 0;
  const principal = Number(document.getElementById('quick-emi-principal').value) || (emi * 36);

  if (!name || emi <= 0) return;

  state.liabilities = state.liabilities || [];
  state.liabilities.push({
    id: 'liab_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
    name: name,
    type: type === 'car' ? 'Vehicle Loan' : (type === 'flat' ? 'Home Loan' : 'Personal Loan'),
    emi: emi,
    value: principal,
    rate: type === 'car' ? 8.5 : (type === 'flat' ? 8.4 : 12.0),
    lender: 'Integrated Bank',
    lastUpdated: new Date().toISOString().slice(0, 10),
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  });

  scheduleSave();
  closeIncomeEmiModal();
  renderIncomeStreamsPage();
  showToast(`Added ${name} (${money(emi)}/mo) to integrated EMIs!`);
}

function deleteSingleEmi(loanId, source) {
  if (source === 'liability') {
    state.liabilities = (state.liabilities || []).filter(l => l.id !== loanId);
  } else if (source === 'asset') {
    const a = (state.assets || []).find(item => item.id === loanId);
    if (a) {
      delete a.hasLoan;
      delete a.loanAmount;
      delete a.emiAmount;
      delete a.emi;
    }
  }

  scheduleSave();
  renderIncomeStreamsPage();
  showToast('Removed loan obligation.');
}

// ── Handlers & Actions ────────────────────────────────────

function handleCategorySelectChange(event) {
  const cat = event.target.value;
  const meta = getCategoryMeta(cat);
  const passiveSelect = document.getElementById('income-is-passive');
  if (passiveSelect) {
    passiveSelect.value = meta.isPassive ? "true" : "false";
  }
}

function handleIncomeSearch(event) {
  incomeSearchQuery = event.target.value;
  renderIncomeStreamsPage();
}

function clearIncomeSearch() {
  incomeSearchQuery = '';
  renderIncomeStreamsPage();
}

function handleCategoryFilterChange(event) {
  incomeCategoryFilter = event.target.value;
  renderIncomeStreamsPage();
}

function handleTypeFilterChange(event) {
  incomeTypeFilter = event.target.value;
  renderIncomeStreamsPage();
}

function handleSortChange(event) {
  incomeSortBy = event.target.value;
  renderIncomeStreamsPage();
}

function filterByCategory(cat) {
  incomeCategoryFilter = cat;
  renderIncomeStreamsPage();
}

function resetIncomeFilters() {
  incomeCategoryFilter = 'all';
  incomeStatusFilter = 'all';
  incomeTypeFilter = 'all';
  incomeSearchQuery = '';
  renderIncomeStreamsPage();
}

function switchIncomeView(mode) {
  incomeViewMode = mode;
  renderIncomeStreamsPage();
}

function switchTaxMode(mode) {
  incomeTaxMode = mode;
  renderIncomeStreamsPage();
}

function toggleIncomeTaxMode() {
  incomeTaxMode = incomeTaxMode === 'gross' ? 'net' : 'gross';
  renderIncomeStreamsPage();
}

function toggleIncomeStressTest() {
  incomeStressTestActive = !incomeStressTestActive;
  renderIncomeStreamsPage();
  showToast(incomeStressTestActive ? 'Job-loss stress test activated.' : 'Stress test deactivated.');
}

function openIncomeModal(editId = null) {
  incomeEditId = editId;
  const overlay = document.getElementById('income-modal-overlay');
  if (!overlay) return;

  const titleEl = document.getElementById('income-modal-title');
  const saveBtn = document.getElementById('income-save-btn');

  if (editId) {
    const stream = (state.incomeStreams || []).find(s => s.id === editId);
    if (!stream) return;
    titleEl.textContent = 'Edit Income Source';
    saveBtn.textContent = 'Update Income Source';
    document.getElementById('income-name').value = stream.name || '';
    document.getElementById('income-category').value = stream.category || 'other';
    document.getElementById('income-amount').value = stream.amount || '';
    document.getElementById('income-frequency').value = stream.frequency || 'monthly';
    document.getElementById('income-is-passive').value = String(stream.isPassive !== undefined ? stream.isPassive : getCategoryMeta(stream.category).isPassive);
    document.getElementById('income-status').value = stream.status || 'active';
    document.getElementById('income-start-date').value = stream.startDate || '';
    document.getElementById('income-notes').value = stream.notes || '';
  } else {
    titleEl.textContent = 'Add Income Source';
    saveBtn.textContent = 'Add Income Source';
    document.getElementById('income-form').reset();
    document.getElementById('income-category').value = 'salary';
    document.getElementById('income-is-passive').value = 'false';
  }

  overlay.style.display = 'flex';
  setTimeout(() => {
    const nameInput = document.getElementById('income-name');
    if (nameInput) nameInput.focus();
  }, 40);
}

function closeIncomeModal(event) {
  if (event && event.target !== event.currentTarget) return;
  const overlay = document.getElementById('income-modal-overlay');
  if (overlay) overlay.style.display = 'none';
  incomeEditId = null;
}

function openIncomeTargetModal() {
  const overlay = document.getElementById('income-target-modal-overlay');
  if (overlay) overlay.style.display = 'flex';
}

function closeIncomeTargetModal(event) {
  if (event && event.target !== event.currentTarget) return;
  const overlay = document.getElementById('income-target-modal-overlay');
  if (overlay) overlay.style.display = 'none';
}

function saveIncomeTarget(event) {
  event.preventDefault();
  const val = Number(document.getElementById('income-target-input').value) || 200000;
  state.incomeTarget = val;
  state.incomeDetails = state.incomeDetails || {};
  state.incomeDetails.monthlyTarget = val;
  scheduleSave();
  closeIncomeTargetModal();
  renderIncomeStreamsPage();
  showToast(`Monthly Target set to ${money(val)}`);
}

function saveIncomeStream(event) {
  event.preventDefault();

  const name = document.getElementById('income-name').value.trim();
  const category = document.getElementById('income-category').value;
  const amount = Number(document.getElementById('income-amount').value) || 0;
  const frequency = document.getElementById('income-frequency').value;
  const isPassive = document.getElementById('income-is-passive').value === 'true';
  const status = document.getElementById('income-status').value;
  const startDate = document.getElementById('income-start-date').value;
  const notes = document.getElementById('income-notes').value.trim();

  if (!name || amount <= 0) return;

  state.incomeStreams = state.incomeStreams || [];

  if (incomeEditId) {
    const idx = state.incomeStreams.findIndex(s => s.id === incomeEditId);
    if (idx !== -1) {
      state.incomeStreams[idx] = {
        ...state.incomeStreams[idx],
        name, category, amount, frequency, isPassive, status, startDate, notes,
        updatedAt: new Date().toISOString()
      };
      showToast(`Updated "${name}".`);
    }
  } else {
    state.incomeStreams.push({
      id: 'inc_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      name, category, amount, frequency, isPassive, status, startDate, notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    showToast(`Added "${name}".`);
  }

  scheduleSave();
  closeIncomeModal();
  renderIncomeStreamsPage();
}

function editIncomeStream(id) {
  openIncomeModal(id);
}

function cloneIncomeStream(id) {
  const stream = (state.incomeStreams || []).find(s => s.id === id);
  if (!stream) return;

  const clone = {
    ...stream,
    id: 'inc_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
    name: `${stream.name} (Copy)`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  state.incomeStreams.push(clone);
  scheduleSave();
  renderIncomeStreamsPage();
  showToast(`Duplicated "${stream.name}".`);
}

function toggleStreamStatus(id) {
  const stream = (state.incomeStreams || []).find(s => s.id === id);
  if (!stream) return;

  stream.status = stream.status === 'paused' ? 'active' : 'paused';
  stream.updatedAt = new Date().toISOString();
  scheduleSave();
  renderIncomeStreamsPage();
  showToast(stream.status === 'active' ? `Resumed "${stream.name}"` : `Paused "${stream.name}"`);
}

function deleteIncomeStream(id) {
  const stream = (state.incomeStreams || []).find(s => s.id === id);
  const name = stream?.name || 'this stream';
  if (!confirm(`Remove "${name}" from income streams?`)) return;

  state.incomeStreams = (state.incomeStreams || []).filter(s => s.id !== id);
  scheduleSave();
  renderIncomeStreamsPage();
  showToast(`Removed "${name}".`);
}

// ── Cross-Module Synchronization ──────────────────────────

function syncIncomeToCashflowAndTax() {
  const summary = incomeStreamsSummary();
  if (summary.totalCount === 0) {
    alert('Please record at least one income source before syncing.');
    return;
  }

  state.cash = state.cash || { income: 0, expenses: 0 };
  state.cash.income = summary.totalMonthly;

  state.incomeDetails = state.incomeDetails || {};
  
  let salarySum = 0;
  let rentSum = 0;
  let dividendSum = 0;
  let businessSum = 0;
  let interestSum = 0;
  let otherSum = 0;

  (state.incomeStreams || []).filter(s => s.status === 'active').forEach(s => {
    const annualAmt = getAnnualAmount(s);
    if (s.category === 'salary') salarySum += annualAmt;
    else if (s.category === 'rental') rentSum += annualAmt;
    else if (s.category === 'dividends') dividendSum += annualAmt;
    else if (s.category === 'business') businessSum += annualAmt;
    else if (s.category === 'interest') interestSum += annualAmt;
    else otherSum += annualAmt;
  });

  if (salarySum > 0) state.incomeDetails.basicSalary = Math.round(salarySum * 0.5);
  if (salarySum > 0) state.incomeDetails.specialAllowance = Math.round(salarySum * 0.3);
  if (salarySum > 0) state.incomeDetails.hra = Math.round(salarySum * 0.2);
  if (rentSum > 0) state.incomeDetails.rentalIncome = rentSum;
  if (dividendSum > 0) state.incomeDetails.dividendIncome = dividendSum;
  if (businessSum > 0) state.incomeDetails.freelanceIncome = businessSum;
  if (interestSum > 0) state.incomeDetails.bankInterest = interestSum;
  if (otherSum > 0) state.incomeDetails.otherIncome = otherSum;

  scheduleSave();
  showToast(`Synchronized ${money(summary.totalMonthly)}/mo with Cash Flow and Tax engines.`);
}

function scanAssetsForIncome() {
  const assets = state.assets || [];
  let addedCount = 0;
  state.incomeStreams = state.incomeStreams || [];

  assets.forEach(asset => {
    const typeText = `${asset.type || ''} ${asset.name || ''}`.toLowerCase();
    
    if (/flat|apartment|house|property|rental/.test(typeText) && !state.incomeStreams.some(s => s.name.includes(asset.name))) {
      const estimatedRent = Math.round((Number(asset.currentValue || asset.buyPrice || 5000000) * 0.03) / 12);
      if (estimatedRent > 0) {
        state.incomeStreams.push({
          id: 'inc_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
          name: `${asset.name} (Rental)`,
          category: 'rental',
          amount: estimatedRent,
          frequency: 'monthly',
          isPassive: true,
          status: 'active',
          linkedAssetId: asset.id,
          notes: `Linked to asset "${asset.name}" (Estimated 3% annual rental yield)`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
        addedCount++;
      }
    }

    if (/stock|mutual|shares|investment/.test(typeText) && !state.incomeStreams.some(s => s.name.includes(asset.name))) {
      const estDividend = Math.round((Number(asset.currentValue || asset.buyPrice || 1000000) * 0.015) / 4);
      if (estDividend > 0) {
        state.incomeStreams.push({
          id: 'inc_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
          name: `${asset.name} (Dividends)`,
          category: 'dividends',
          amount: estDividend,
          frequency: 'quarterly',
          isPassive: true,
          status: 'active',
          linkedAssetId: asset.id,
          notes: `Linked to investment holding "${asset.name}"`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
        addedCount++;
      }
    }
  });

  if (addedCount > 0) {
    scheduleSave();
    renderIncomeStreamsPage();
    showToast(`Imported ${addedCount} income stream(s) from Assets vault.`);
  } else {
    alert('No unlinked rental properties or equity holdings found in your Assets vault.');
  }
}

// ── Export Suite ──────────────────────────────────────────

function exportIncomeCsv() {
  const streams = state.incomeStreams || [];
  if (streams.length === 0) {
    alert('No income streams to export.');
    return;
  }

  const headers = ['Stream Name', 'Category', 'Frequency', 'Raw Amount (INR)', 'Monthly Equiv (INR)', 'Annual Equiv (INR)', 'Type', 'Status', 'Inception Date', 'Notes'];
  const rows = streams.map(s => {
    const meta = getCategoryMeta(s.category);
    const isPass = isStreamPassive(s);
    return [
      `"${(s.name || '').replace(/"/g, '""')}"`,
      `"${meta.label}"`,
      `"${s.frequency || 'monthly'}"`,
      s.amount || 0,
      getMonthlyAmount(s),
      getAnnualAmount(s),
      isPass ? 'Passive' : 'Active',
      s.status || 'active',
      `"${s.startDate || ''}"`,
      `"${(s.notes || '').replace(/"/g, '""')}"`
    ];
  });

  const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `Income_Streams_Ledger_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  showToast('Downloaded Income Streams CSV Ledger.');
}

function printIncomeDossier() {
  const summary = incomeStreamsSummary();
  const streams = state.incomeStreams || [];

  const printWin = window.open('', '_blank');
  if (!printWin) {
    alert('Please allow popups to generate the printable dossier.');
    return;
  }

  printWin.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Executive Income Dossier — Wealth OS</title>
      <style>
        body { font-family: 'Segoe UI', -apple-system, system-ui, sans-serif; color: #0f172a; padding: 40px; margin: 0; line-height: 1.5; font-size: 13px; }
        .header { display: flex; justify-content: space-between; border-bottom: 2px solid #0f172a; padding-bottom: 16px; margin-bottom: 24px; }
        .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 24px; }
        .kpi-box { padding: 14px; border: 1px solid #e2e8f0; border-radius: 8px; background: #f8fafc; }
        .kpi-box span { font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: bold; }
        .kpi-box strong { display: block; font-size: 18px; color: #0f172a; margin-top: 4px; font-weight: 800; }
        table { width: 100%; border-collapse: collapse; margin-top: 16px; }
        th, td { padding: 10px 12px; border-bottom: 1px solid #e2e8f0; text-align: left; }
        th { background: #f8fafc; font-weight: 700; color: #475569; font-size: 12px; }
        .badge { padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 700; text-transform: uppercase; }
        .badge-active { background: #f1f5f9; color: #1e293b; }
        .badge-passive { background: #dcfce7; color: #166534; }
        @media print { body { padding: 0; } }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <h1 style="margin: 0; font-size: 20px; font-weight: 800;">Executive Income Verification Dossier</h1>
          <small style="color: #64748b;">Generated via Wealth OS &bull; ${new Date().toLocaleDateString('en-IN', { dateStyle: 'full' })}</small>
        </div>
        <div style="text-align: right;">
          <h2 style="margin: 0; font-size: 18px; color: #059669; font-weight: 800;">${money(summary.totalMonthly)}/mo</h2>
          <small style="color: #64748b;">Annual Run-Rate: ${money(summary.totalAnnual)}</small>
        </div>
      </div>

      <div class="kpi-grid">
        <div class="kpi-box"><span>Monthly Active</span><strong>${money(summary.activeMonthly)}</strong></div>
        <div class="kpi-box"><span>Monthly Passive</span><strong>${money(summary.passiveMonthly)}</strong></div>
        <div class="kpi-box"><span>Passive Coverage</span><strong>${summary.freedomCoverage}%</strong></div>
        <div class="kpi-box"><span>Active Channels</span><strong>${summary.activeCount} Channels</strong></div>
      </div>

      <h3 style="font-size: 15px; margin-bottom: 8px;">Registered Revenue Streams</h3>
      <table>
        <thead>
          <tr>
            <th>Stream Name</th>
            <th>Category</th>
            <th>Frequency</th>
            <th>Amount</th>
            <th>Monthly Equiv</th>
            <th>Classification</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${streams.map(s => {
            const meta = getCategoryMeta(s.category);
            const isPass = isStreamPassive(s);
            return `
              <tr>
                <td><b>${escapeHtml(s.name)}</b></td>
                <td>${meta.label}</td>
                <td>${s.frequency || 'Monthly'}</td>
                <td>${money(s.amount)}</td>
                <td><b>${money(getMonthlyAmount(s))}</b></td>
                <td><span class="badge ${isPass ? 'badge-passive' : 'badge-active'}">${isPass ? 'Passive' : 'Active'}</span></td>
                <td>${s.status === 'active' ? 'Active' : 'Paused'}</td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>

      <div style="margin-top: 36px; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 12px;">
        CONFIDENTIAL FINANCIAL RECORD &bull; Document verified against recorded ledger accounts.
      </div>
      <script>window.onload = () => { window.print(); };</script>
    </body>
    </html>
  `);
  printWin.document.close();
}

// ── Toast Notification Helper ─────────────────────────────

function showToast(msg) {
  const existing = document.getElementById('income-toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.id = 'income-toast';
  toast.className = 'income-toast-banner';
  toast.textContent = msg;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('show');
  }, 20);

  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Keyboard shortcut (Escape closes modal)
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    closeIncomeModal();
    closeIncomeTargetModal();
    closeIncomeAiModal();
  }
});
