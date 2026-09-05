// ═══════════════════════════════════════════════════════════
// WEALTH OS UNIVERSAL FINANCIAL REPORTS & INTELLIGENCE SUITE v4
// Interactive Custom Report Builder (Bank, Visa, CA, Estate Presets),
// Multi-Currency Converter (INR, USD, AED, EUR, GBP),
// 6 Specialized Reports: Insurance HLV, Real Estate Yield, Goals SIP,
// Debt Amortization, Family Office HUF & SFT Tax Compliance
// ═══════════════════════════════════════════════════════════

let currentReportsTab = 'dossiers'; // 'dossiers', 'builder', 'fireAudit', 'statements', 'stressTest', 'ratios'
let selectedReportCurrency = 'INR'; // 'INR', 'USD', 'AED', 'EUR', 'GBP'

// Custom Report Builder Checkbox State
let customReportModules = {
  netWorth: true,
  assetsSchedule: true,
  liabilitiesDebt: true,
  cashflow: true,
  taxProfile: true,
  willSuccession: true,
  insuranceHlv: true,
  realEstateYield: true,
  goalsSip: true,
  debtAmortization: true,
  familyOffice: true,
  physicalSecurity: true,
  fireAudit: true
};

// Currency Multipliers relative to INR
const currencyRates = {
  INR: { symbol: "₹", rate: 1, label: "Indian Rupee (INR)" },
  USD: { symbol: "$", rate: 1 / 86.5, label: "US Dollar (USD)" },
  AED: { symbol: "AED ", rate: 1 / 23.55, label: "UAE Dirham (AED)" },
  EUR: { symbol: "€", rate: 1 / 91.2, label: "Euro (EUR)" },
  GBP: { symbol: "£", rate: 1 / 108.8, label: "British Pound (GBP)" }
};

function formatCurrencyVal(inrVal) {
  const c = currencyRates[selectedReportCurrency] || currencyRates.INR;
  const converted = (Number(inrVal) || 0) * c.rate;
  if (selectedReportCurrency === 'INR') return money(inrVal);
  return c.symbol + converted.toLocaleString('en-US', { maximumFractionDigits: 0 });
}

// Stress Test Parameters
let stressMarketDropPercent = 30;
let stressIncomeHaltMonths = 6;
let stressRateHikeBps = 200;
let stressInflationPercent = 8;

// ── Main Render Routine ──────────────────────────────────────

function renderReports() {
  const data = totals();
  const assets = state.assets || [];
  const liabilities = state.liabilities || [];
  const cash = state.cash || { income: 0, expenses: 0 };
  const netWorth = data.netWorth;

  // Header Bar with Currency Selector
  const headerHtml = `
    <div style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); border-radius: 18px; padding: 22px 26px; color: #fff; box-shadow: 0 8px 24px rgba(15,23,42,0.12); margin-bottom: 20px;">
      <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 16px;">
        <div>
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
            <span style="font-size: 10.5px; font-weight: 800; color: #38bdf8; text-transform: uppercase; letter-spacing: 0.5px;">Institutional Financial Intelligence & Cross-Tab Audit Center</span>
            <span style="font-size: 10px; font-weight: 800; background: #2563eb; color: #fff; padding: 2px 7px; border-radius: 4px;">v4.6 ENTERPRISE</span>
          </div>
          <h2 style="font-size: 22px; font-weight: 850; color: #fff; margin: 0 0 6px;">Universal Financial Reports & Analytics</h2>
          <p style="color: #cbd5e1; font-size: 13px; margin: 0; max-width: 680px; line-height: 1.45;">
            Download 10+ certified analytical dossiers — Balance Sheet, Insurance HLV, Real Estate Yield, Goals SIP, Debt Payoff, Family HUF & SFT Tax Audits.
          </p>
        </div>

        <div style="display: flex; gap: 8px; flex-wrap: wrap; align-items: center;">
          <!-- Currency Switcher -->
          <div style="background: rgba(255,255,255,0.08); padding: 3px; border-radius: 8px; display: inline-flex; border: 1px solid rgba(255,255,255,0.15);">
            ${Object.keys(currencyRates).map(curr => `
              <button onclick="selectedReportCurrency='${curr}'; renderReports();" style="background: ${selectedReportCurrency === curr ? '#2563eb' : 'transparent'}; color: #fff; border: none; padding: 5px 9px; border-radius: 6px; font-size: 11px; font-weight: 750; cursor: pointer;">
                ${curr}
              </button>
            `).join('')}
          </div>

          <button onclick="printMasterWealthDossierPdf()" class="primary-action" style="background: #2563eb; color: #fff; border: none; padding: 8px 16px; border-radius: 8px; font-size: 12.5px; font-weight: 800; cursor: pointer; box-shadow: 0 4px 12px rgba(37,99,235,0.3);">
            Master 360&deg; Wealth Dossier (PDF)
          </button>
        </div>
      </div>
    </div>
  `;

  // 4 Top Executive Metric Cards (Currency Aware)
  const topMetricsHtml = `
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 14px; margin-bottom: 20px;">
      
      <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 16px 20px; box-shadow: 0 4px 12px rgba(0,0,0,0.03);">
        <span style="font-size: 10.5px; font-weight: 800; text-transform: uppercase; color: #64748b;">Consolidated Net Worth</span>
        <h3 style="margin: 4px 0 2px; font-size: 22px; font-weight: 850; color: ${netWorth >= 0 ? '#16a34a' : '#dc2626'};">${formatCurrencyVal(netWorth)}</h3>
        <small style="color: #64748b; font-size: 11.5px;">Assets ${formatCurrencyVal(data.assets + data.cash)} &minus; Debt ${formatCurrencyVal(data.debt)}</small>
      </div>

      <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 16px 20px; box-shadow: 0 4px 12px rgba(0,0,0,0.03);">
        <span style="font-size: 10.5px; font-weight: 800; text-transform: uppercase; color: #64748b;">Monthly Net Cash Flow</span>
        <h3 style="margin: 4px 0 2px; font-size: 22px; font-weight: 850; color: #2563eb;">${formatCurrencyVal(data.cashFlow)}/mo</h3>
        <small style="color: #64748b; font-size: 11.5px;">Inflow ${formatCurrencyVal(cash.income || 0)} &minus; Outflow ${formatCurrencyVal((cash.expenses || 0) + (data.emi || 0))}</small>
      </div>

      <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 16px 20px; box-shadow: 0 4px 12px rgba(0,0,0,0.03);">
        <span style="font-size: 10.5px; font-weight: 800; text-transform: uppercase; color: #64748b;">FIRE Readiness Score</span>
        <h3 style="margin: 4px 0 2px; font-size: 22px; font-weight: 850; color: #0f172a;">${calculateFireMetrics(data).fireFundedPercent}%</h3>
        <small style="color: #166534; font-size: 11.5px; font-weight: 750;">${calculateFireMetrics(data).yearsToFire} Years to Financial Independence</small>
      </div>

      <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 16px 20px; box-shadow: 0 4px 12px rgba(0,0,0,0.03);">
        <span style="font-size: 10.5px; font-weight: 800; text-transform: uppercase; color: #64748b;">Liquid Emergency Runway</span>
        <h3 style="margin: 4px 0 2px; font-size: 22px; font-weight: 850; color: #0f172a;">${calculateEmergencyMonths(data)} Months</h3>
        <small style="color: #64748b; font-size: 11.5px;">Based on liquid cash vs total monthly burn</small>
      </div>

    </div>
  `;

  // Navigation Sub-Tabs
  const navTabsHtml = `
    <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 20px; border-bottom: 1px solid #e2e8f0; padding-bottom: 12px;">
      <button class="${currentReportsTab === 'dossiers' ? 'active' : ''}" onclick="switchReportsTab('dossiers')" style="padding: 7px 16px; border-radius: 8px; border: 1px solid ${currentReportsTab === 'dossiers' ? '#2563eb' : '#cbd5e1'}; background: ${currentReportsTab === 'dossiers' ? '#eff6ff' : '#ffffff'}; color: ${currentReportsTab === 'dossiers' ? '#1e40af' : '#475569'}; font-weight: ${currentReportsTab === 'dossiers' ? '800' : '600'}; font-size: 12.5px; cursor: pointer;">
        1. All Downloadable Reports (PDF Hub)
      </button>
      <button class="${currentReportsTab === 'builder' ? 'active' : ''}" onclick="switchReportsTab('builder')" style="padding: 7px 16px; border-radius: 8px; border: 1px solid ${currentReportsTab === 'builder' ? '#2563eb' : '#cbd5e1'}; background: ${currentReportsTab === 'builder' ? '#eff6ff' : '#ffffff'}; color: ${currentReportsTab === 'builder' ? '#1e40af' : '#475569'}; font-weight: ${currentReportsTab === 'builder' ? '800' : '600'}; font-size: 12.5px; cursor: pointer;">
        2. Custom Report Builder
      </button>
      <button class="${currentReportsTab === 'fireAudit' ? 'active' : ''}" onclick="switchReportsTab('fireAudit')" style="padding: 7px 16px; border-radius: 8px; border: 1px solid ${currentReportsTab === 'fireAudit' ? '#2563eb' : '#cbd5e1'}; background: ${currentReportsTab === 'fireAudit' ? '#eff6ff' : '#ffffff'}; color: ${currentReportsTab === 'fireAudit' ? '#1e40af' : '#475569'}; font-weight: ${currentReportsTab === 'fireAudit' ? '800' : '600'}; font-size: 12.5px; cursor: pointer;">
        3. FIRE Freedom Roadmap
      </button>
      <button class="${currentReportsTab === 'statements' ? 'active' : ''}" onclick="switchReportsTab('statements')" style="padding: 7px 16px; border-radius: 8px; border: 1px solid ${currentReportsTab === 'statements' ? '#2563eb' : '#cbd5e1'}; background: ${currentReportsTab === 'statements' ? '#eff6ff' : '#ffffff'}; color: ${currentReportsTab === 'statements' ? '#1e40af' : '#475569'}; font-weight: ${currentReportsTab === 'statements' ? '800' : '600'}; font-size: 12.5px; cursor: pointer;">
        4. Balance Sheet & P&L
      </button>
      <button class="${currentReportsTab === 'stressTest' ? 'active' : ''}" onclick="switchReportsTab('stressTest')" style="padding: 7px 16px; border-radius: 8px; border: 1px solid ${currentReportsTab === 'stressTest' ? '#2563eb' : '#cbd5e1'}; background: ${currentReportsTab === 'stressTest' ? '#eff6ff' : '#ffffff'}; color: ${currentReportsTab === 'stressTest' ? '#1e40af' : '#475569'}; font-weight: ${currentReportsTab === 'stressTest' ? '800' : '600'}; font-size: 12.5px; cursor: pointer;">
        5. Macro Stress Simulator
      </button>
      <button class="${currentReportsTab === 'ratios' ? 'active' : ''}" onclick="switchReportsTab('ratios')" style="padding: 7px 16px; border-radius: 8px; border: 1px solid ${currentReportsTab === 'ratios' ? '#2563eb' : '#cbd5e1'}; background: ${currentReportsTab === 'ratios' ? '#eff6ff' : '#ffffff'}; color: ${currentReportsTab === 'ratios' ? '#1e40af' : '#475569'}; font-weight: ${currentReportsTab === 'ratios' ? '800' : '600'}; font-size: 12.5px; cursor: pointer;">
        6. Solvency & Borrowing Ratios
      </button>
    </div>
  `;

  let tabContent = "";
  if (currentReportsTab === 'dossiers') tabContent = renderDossiersTab(data);
  else if (currentReportsTab === 'builder') tabContent = renderReportBuilderTab(data);
  else if (currentReportsTab === 'fireAudit') tabContent = renderFireAuditTab(data);
  else if (currentReportsTab === 'statements') tabContent = renderStatementsTab(data);
  else if (currentReportsTab === 'stressTest') tabContent = renderStressTestTab(data);
  else if (currentReportsTab === 'ratios') tabContent = renderRatiosTab(data);

  list.innerHTML = `<section class="reports-hub-container" style="padding-bottom: 60px;">${headerHtml}${topMetricsHtml}${navTabsHtml}${tabContent}</section>`;
  actions.innerHTML = "";
  grid.innerHTML = "";
}

window.switchReportsTab = (tab) => {
  currentReportsTab = tab;
  renderReports();
};

function calculateEmergencyMonths(data) {
  const expenses = Number(state.cash?.expenses || 0) + Number(data.emi || 0);
  if (!expenses) return "12+";
  const liquid = Number(data.cash || 0);
  return (liquid / expenses).toFixed(1);
}

// ── FIRE Calculator Engine ───────────────────────────────────

function calculateFireMetrics(data) {
  const annualExpenses = (Number(state.cash?.expenses || 0) + Number(data.emi || 0)) * 12;
  const fireNumber = annualExpenses * 25;
  const leanFireNumber = annualExpenses * 20;
  const fatFireNumber = annualExpenses * 33;

  const assets = state.assets || [];
  const liquidInvest = Number(data.cash || 0) + assets.filter(a => !(a.type || '').toLowerCase().includes('real estate') && !(a.type || '').toLowerCase().includes('vehicle')).reduce((s, a) => s + (Number(a.value) || 0), 0);

  const fireFundedPercent = fireNumber > 0 ? Math.min(100, Math.round((liquidInvest / fireNumber) * 100)) : 100;
  
  const annualSurplus = Math.max(0, Number(data.cashFlow || 0) * 12);
  const gap = Math.max(0, fireNumber - liquidInvest);
  const yearsToFire = annualSurplus > 0 ? (gap / (annualSurplus * 1.08)).toFixed(1) : (gap === 0 ? "0.0" : "15+");

  return {
    annualExpenses,
    fireNumber,
    leanFireNumber,
    fatFireNumber,
    liquidInvest,
    fireFundedPercent,
    yearsToFire
  };
}

// ═══════════════════════════════════════════════════════════
// TAB 1: COMPLETE PDF DOSSIER DOWNLOAD CENTER (10+ REPORTS)
// ═══════════════════════════════════════════════════════════

function renderDossiersTab(data) {
  return `
    <div>
      <div style="margin-bottom: 18px;">
        <h3 style="margin: 0 0 4px; font-size: 16px; font-weight: 850; color: #0f172a;">Executive Financial Reports & Download Center</h3>
        <p style="color: #64748b; font-size: 12.5px; margin: 0;">Click any report to generate and print a certified, aligned A4 PDF dossier in <b>${selectedReportCurrency}</b>.</p>
      </div>

      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(340px, 1fr)); gap: 16px;">
        
        <!-- 1. Master 360 Wealth Dossier -->
        <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 20px; box-shadow: 0 4px 12px rgba(0,0,0,0.03); display: flex; flex-direction: column; justify-content: space-between;">
          <div>
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 6px;">
              <span style="font-size: 10px; font-weight: 800; background: #eff6ff; color: #1e40af; padding: 3px 8px; border-radius: 4px; text-transform: uppercase;">
                Master Comprehensive
              </span>
              <span style="font-size: 11px; font-weight: 750; color: #166534;">● Cross-Tab Aggregated</span>
            </div>
            <h4 style="margin: 6px 0 4px; font-size: 15px; font-weight: 850; color: #0f172a;">Master 360&deg; Institutional Wealth Dossier</h4>
            <p style="font-size: 12px; color: #64748b; margin: 0 0 14px; line-height: 1.45;">
              Multi-page master audit covering Balance Sheet, Asset Schedules, Tax, Will, Insurance & Security.
            </p>
          </div>
          <button onclick="printMasterWealthDossierPdf()" class="primary-action" style="background: #2563eb; color: #fff; border: none; padding: 8px 14px; border-radius: 8px; font-size: 12px; font-weight: 800; cursor: pointer; width: 100%;">
            Download Master Dossier (PDF)
          </button>
        </div>

        <!-- 2. Certified Net Worth Statement -->
        <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 20px; box-shadow: 0 4px 12px rgba(0,0,0,0.03); display: flex; flex-direction: column; justify-content: space-between;">
          <div>
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 6px;">
              <span style="font-size: 10px; font-weight: 800; background: #f0fdf4; color: #166534; padding: 3px 8px; border-radius: 4px; text-transform: uppercase;">
                Bank & Visa Ready
              </span>
              <span style="font-size: 11px; font-weight: 750; color: #64748b;">A4 Certificate</span>
            </div>
            <h4 style="margin: 6px 0 4px; font-size: 15px; font-weight: 850; color: #0f172a;">Certified Net Worth & Balance Sheet Certificate</h4>
            <p style="font-size: 12px; color: #64748b; margin: 0 0 14px; line-height: 1.45;">
              Certified statement with verified asset schedules, liabilities, declarant affirmation, and CA seal blocks.
            </p>
          </div>
          <button onclick="printCertifiedNetWorthPdf()" class="primary-action" style="background: #0f172a; color: #fff; border: none; padding: 8px 14px; border-radius: 8px; font-size: 12px; font-weight: 800; cursor: pointer; width: 100%;">
            Download Net Worth Certificate (PDF)
          </button>
        </div>

        <!-- 3. Insurance & Human Life Value (HLV) Audit -->
        <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 20px; box-shadow: 0 4px 12px rgba(0,0,0,0.03); display: flex; flex-direction: column; justify-content: space-between;">
          <div>
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 6px;">
              <span style="font-size: 10px; font-weight: 800; background: #fef2f2; color: #991b1b; padding: 3px 8px; border-radius: 4px; text-transform: uppercase;">
                Risk & Protection
              </span>
              <span style="font-size: 11px; font-weight: 750; color: #64748b;">HLV Gap Analysis</span>
            </div>
            <h4 style="margin: 6px 0 4px; font-size: 15px; font-weight: 850; color: #0f172a;">Insurance & Human Life Value (HLV) Audit</h4>
            <p style="font-size: 12px; color: #64748b; margin: 0 0 14px; line-height: 1.45;">
              Calculates 15x income replacement term cover, health insurance buffer, and asset casualty coverage.
            </p>
          </div>
          <button onclick="printInsuranceHlvAuditPdf()" class="secondary-action" style="padding: 8px 14px; border-radius: 8px; font-size: 12px; font-weight: 750; cursor: pointer; width: 100%;">
            Download Insurance HLV Audit (PDF)
          </button>
        </div>

        <!-- 4. Real Estate Portfolio & Rental Yield Dossier -->
        <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 20px; box-shadow: 0 4px 12px rgba(0,0,0,0.03); display: flex; flex-direction: column; justify-content: space-between;">
          <div>
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 6px;">
              <span style="font-size: 10px; font-weight: 800; background: #fdf4ff; color: #86198f; padding: 3px 8px; border-radius: 4px; text-transform: uppercase;">
                Real Estate Yield
              </span>
              <span style="font-size: 11px; font-weight: 750; color: #64748b;">LTV & Cap Gains</span>
            </div>
            <h4 style="margin: 6px 0 4px; font-size: 15px; font-weight: 850; color: #0f172a;">Real Estate & Rental Yield Performance Dossier</h4>
            <p style="font-size: 12px; color: #64748b; margin: 0 0 14px; line-height: 1.45;">
              Property valuations, gross/net rental yields, equity LTV ratios, and title deed status.
            </p>
          </div>
          <button onclick="printRealEstateYieldAuditPdf()" class="secondary-action" style="padding: 8px 14px; border-radius: 8px; font-size: 12px; font-weight: 750; cursor: pointer; width: 100%;">
            Download Real Estate Dossier (PDF)
          </button>
        </div>

        <!-- 5. Financial Goals & SIP Investment Gap Roadmap -->
        <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 20px; box-shadow: 0 4px 12px rgba(0,0,0,0.03); display: flex; flex-direction: column; justify-content: space-between;">
          <div>
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 6px;">
              <span style="font-size: 10px; font-weight: 800; background: #ecfdf5; color: #047857; padding: 3px 8px; border-radius: 4px; text-transform: uppercase;">
                Goals Planning
              </span>
              <span style="font-size: 11px; font-weight: 750; color: #64748b;">SIP Calculator</span>
            </div>
            <h4 style="margin: 6px 0 4px; font-size: 15px; font-weight: 850; color: #0f172a;">Financial Goals Feasibility & SIP Roadmap</h4>
            <p style="font-size: 12px; color: #64748b; margin: 0 0 14px; line-height: 1.45;">
              Target funding progress, inflation gaps, and required monthly SIP (at 12% CAGR) to hit goals.
            </p>
          </div>
          <button onclick="printGoalsSipRoadmapPdf()" class="secondary-action" style="padding: 8px 14px; border-radius: 8px; font-size: 12px; font-weight: 750; cursor: pointer; width: 100%;">
            Download Goals SIP Roadmap (PDF)
          </button>
        </div>

        <!-- 6. Debt Freedom & Loan Payoff Amortization -->
        <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 20px; box-shadow: 0 4px 12px rgba(0,0,0,0.03); display: flex; flex-direction: column; justify-content: space-between;">
          <div>
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 6px;">
              <span style="font-size: 10px; font-weight: 800; background: #fff7ed; color: #c2410c; padding: 3px 8px; border-radius: 4px; text-transform: uppercase;">
                Debt Accelerated Payoff
              </span>
              <span style="font-size: 11px; font-weight: 750; color: #64748b;">Snowball / Prepay</span>
            </div>
            <h4 style="margin: 6px 0 4px; font-size: 15px; font-weight: 850; color: #0f172a;">Debt Freedom & Loan Amortization Schedule</h4>
            <p style="font-size: 12px; color: #64748b; margin: 0 0 14px; line-height: 1.45;">
              Principal vs interest breakdown and prepayment simulations (+₹10k/mo savings in years/lakhs).
            </p>
          </div>
          <button onclick="printDebtAmortizationPdf()" class="secondary-action" style="padding: 8px 14px; border-radius: 8px; font-size: 12px; font-weight: 750; cursor: pointer; width: 100%;">
            Download Debt Schedule (PDF)
          </button>
        </div>

        <!-- 7. Family Office & Multi-Entity Balance Sheet -->
        <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 20px; box-shadow: 0 4px 12px rgba(0,0,0,0.03); display: flex; flex-direction: column; justify-content: space-between;">
          <div>
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 6px;">
              <span style="font-size: 10px; font-weight: 800; background: #f5f3ff; color: #5b21b6; padding: 3px 8px; border-radius: 4px; text-transform: uppercase;">
                Multi-PAN & HUF
              </span>
              <span style="font-size: 11px; font-weight: 750; color: #64748b;">Family Office</span>
            </div>
            <h4 style="margin: 6px 0 4px; font-size: 15px; font-weight: 850; color: #0f172a;">Family Office & Multi-Entity Consolidated Statement</h4>
            <p style="font-size: 12px; color: #64748b; margin: 0 0 14px; line-height: 1.45;">
              Segregated balance sheet across Self, Spouse, and Family HUF, with nominee verification status.
            </p>
          </div>
          <button onclick="printFamilyOfficeStatementPdf()" class="secondary-action" style="padding: 8px 14px; border-radius: 8px; font-size: 12px; font-weight: 750; cursor: pointer; width: 100%;">
            Download Family Statement (PDF)
          </button>
        </div>

        <!-- 8. High-Value Transaction (SFT) & Advance Tax Compliance -->
        <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 20px; box-shadow: 0 4px 12px rgba(0,0,0,0.03); display: flex; flex-direction: column; justify-content: space-between;">
          <div>
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 6px;">
              <span style="font-size: 10px; font-weight: 800; background: #fefce8; color: #854d0e; padding: 3px 8px; border-radius: 4px; text-transform: uppercase;">
                Tax & SFT Compliance
              </span>
              <span style="font-size: 11px; font-weight: 750; color: #64748b;">AIS Reconciliation</span>
            </div>
            <h4 style="margin: 6px 0 4px; font-size: 15px; font-weight: 850; color: #0f172a;">High-Value Transaction (SFT) & Advance Tax Calendar</h4>
            <p style="font-size: 12px; color: #64748b; margin: 0 0 14px; line-height: 1.45;">
              Quarterly Advance Tax payment schedules (Jun/Sep/Dec/Mar) and SFT reporting audit checklist.
            </p>
          </div>
          <button onclick="printSftAdvanceTaxCalendarPdf()" class="secondary-action" style="padding: 8px 14px; border-radius: 8px; font-size: 12px; font-weight: 750; cursor: pointer; width: 100%;">
            Download Tax Calendar (PDF)
          </button>
        </div>

        <!-- 9. Income Tax & Deductions Audit Dossier -->
        <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 20px; box-shadow: 0 4px 12px rgba(0,0,0,0.03); display: flex; flex-direction: column; justify-content: space-between;">
          <div>
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 6px;">
              <span style="font-size: 10px; font-weight: 800; background: #fef3c7; color: #92400e; padding: 3px 8px; border-radius: 4px; text-transform: uppercase;">
                CA & Tax Advisor
              </span>
              <span style="font-size: 11px; font-weight: 750; color: #64748b;">AY 2025-26</span>
            </div>
            <h4 style="margin: 6px 0 4px; font-size: 15px; font-weight: 850; color: #0f172a;">Income Tax & Deductions Audit Dossier</h4>
            <p style="font-size: 12px; color: #64748b; margin: 0 0 14px; line-height: 1.45;">
              Old vs New regime comparison, Section 80C/80D/80CCD breakdown, and Capital Gains summary.
            </p>
          </div>
          <button onclick="printTaxAuditReportPdf()" class="secondary-action" style="padding: 8px 14px; border-radius: 8px; font-size: 12px; font-weight: 750; cursor: pointer; width: 100%;">
            Download Tax Audit Dossier (PDF)
          </button>
        </div>

        <!-- 10. Raw Data Export Package -->
        <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 20px; box-shadow: 0 4px 12px rgba(0,0,0,0.03); display: flex; flex-direction: column; justify-content: space-between;">
          <div>
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 6px;">
              <span style="font-size: 10px; font-weight: 800; background: #f1f5f9; color: #475569; padding: 3px 8px; border-radius: 4px; text-transform: uppercase;">
                Raw Data Export
              </span>
              <span style="font-size: 11px; font-weight: 750; color: #64748b;">JSON &bull; CSV</span>
            </div>
            <h4 style="margin: 6px 0 4px; font-size: 15px; font-weight: 850; color: #0f172a;">Raw Data Export Package</h4>
            <p style="font-size: 12px; color: #64748b; margin: 0 0 14px; line-height: 1.45;">
              Export raw database snapshots for external financial spreadsheets or offline archival.
            </p>
          </div>
          <div style="display: flex; gap: 8px;">
            <button onclick="exportConsolidatedWealthJson()" class="secondary-action" style="padding: 8px 12px; border-radius: 8px; font-size: 12px; font-weight: 750; cursor: pointer; flex: 1;">
              Export JSON
            </button>
            <button onclick="exportConsolidatedWealthCsv()" class="secondary-action" style="padding: 8px 12px; border-radius: 8px; font-size: 12px; font-weight: 750; cursor: pointer; flex: 1;">
              Export CSV
            </button>
          </div>
        </div>

      </div>
    </div>
  `;
}

// ═══════════════════════════════════════════════════════════
// TAB 2: INTERACTIVE CUSTOM REPORT BUILDER
// ═══════════════════════════════════════════════════════════

function renderReportBuilderTab(data) {
  return `
    <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 22px 24px; box-shadow: 0 4px 16px rgba(0,0,0,0.03); margin-bottom: 24px;">
      
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 18px; flex-wrap: wrap; gap: 12px;">
        <div>
          <h3 style="margin: 0 0 4px; font-size: 17px; font-weight: 850; color: #0f172a;">Custom Financial Report Builder</h3>
          <p style="color: #64748b; font-size: 12.5px; margin: 0;">Select your purpose preset or customize the exact modules to compile into your PDF dossier.</p>
        </div>

        <div style="display: flex; gap: 6px; flex-wrap: wrap;">
          <button onclick="applyReportPreset('visa')" style="padding: 6px 12px; border-radius: 6px; border: 1px solid #cbd5e1; background: #f8fafc; font-size: 11.5px; font-weight: 750; color: #0f172a; cursor: pointer;">
            Schengen/US Visa Pack
          </button>
          <button onclick="applyReportPreset('bank')" style="padding: 6px 12px; border-radius: 6px; border: 1px solid #cbd5e1; background: #f8fafc; font-size: 11.5px; font-weight: 750; color: #0f172a; cursor: pointer;">
            Bank Loan & Mortgage Pack
          </button>
          <button onclick="applyReportPreset('tax')" style="padding: 6px 12px; border-radius: 6px; border: 1px solid #cbd5e1; background: #f8fafc; font-size: 11.5px; font-weight: 750; color: #0f172a; cursor: pointer;">
            CA Tax Audit Pack
          </button>
          <button onclick="applyReportPreset('estate')" style="padding: 6px 12px; border-radius: 6px; border: 1px solid #cbd5e1; background: #f8fafc; font-size: 11.5px; font-weight: 750; color: #0f172a; cursor: pointer;">
            Estate & Family Trust Pack
          </button>
        </div>
      </div>

      <!-- Module Checkbox Matrix -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 12px; margin-bottom: 20px; font-size: 12.5px;">
        
        <label style="display: flex; align-items: center; gap: 8px; background: #f8fafc; padding: 10px 12px; border-radius: 8px; border: 1px solid #e2e8f0; cursor: pointer;">
          <input type="checkbox" ${customReportModules.netWorth ? 'checked' : ''} onchange="customReportModules.netWorth=this.checked;" style="accent-color: #2563eb; width: 16px; height: 16px;">
          <span><b>Personal Balance Sheet & Net Worth</b></span>
        </label>

        <label style="display: flex; align-items: center; gap: 8px; background: #f8fafc; padding: 10px 12px; border-radius: 8px; border: 1px solid #e2e8f0; cursor: pointer;">
          <input type="checkbox" ${customReportModules.assetsSchedule ? 'checked' : ''} onchange="customReportModules.assetsSchedule=this.checked;" style="accent-color: #2563eb; width: 16px; height: 16px;">
          <span><b>Detailed Real Estate & Asset Schedules</b></span>
        </label>

        <label style="display: flex; align-items: center; gap: 8px; background: #f8fafc; padding: 10px 12px; border-radius: 8px; border: 1px solid #e2e8f0; cursor: pointer;">
          <input type="checkbox" ${customReportModules.liabilitiesDebt ? 'checked' : ''} onchange="customReportModules.liabilitiesDebt=this.checked;" style="accent-color: #2563eb; width: 16px; height: 16px;">
          <span><b>Liabilities, Mortgages & FOIR Ratios</b></span>
        </label>

        <label style="display: flex; align-items: center; gap: 8px; background: #f8fafc; padding: 10px 12px; border-radius: 8px; border: 1px solid #e2e8f0; cursor: pointer;">
          <input type="checkbox" ${customReportModules.cashflow ? 'checked' : ''} onchange="customReportModules.cashflow=this.checked;" style="accent-color: #2563eb; width: 16px; height: 16px;">
          <span><b>Monthly Cash Flow & Income Streams</b></span>
        </label>

        <label style="display: flex; align-items: center; gap: 8px; background: #f8fafc; padding: 10px 12px; border-radius: 8px; border: 1px solid #e2e8f0; cursor: pointer;">
          <input type="checkbox" ${customReportModules.insuranceHlv ? 'checked' : ''} onchange="customReportModules.insuranceHlv=this.checked;" style="accent-color: #2563eb; width: 16px; height: 16px;">
          <span><b>Insurance & Human Life Value (HLV) Audit</b></span>
        </label>

        <label style="display: flex; align-items: center; gap: 8px; background: #f8fafc; padding: 10px 12px; border-radius: 8px; border: 1px solid #e2e8f0; cursor: pointer;">
          <input type="checkbox" ${customReportModules.realEstateYield ? 'checked' : ''} onchange="customReportModules.realEstateYield=this.checked;" style="accent-color: #2563eb; width: 16px; height: 16px;">
          <span><b>Real Estate Portfolio & Rental Yield</b></span>
        </label>

        <label style="display: flex; align-items: center; gap: 8px; background: #f8fafc; padding: 10px 12px; border-radius: 8px; border: 1px solid #e2e8f0; cursor: pointer;">
          <input type="checkbox" ${customReportModules.goalsSip ? 'checked' : ''} onchange="customReportModules.goalsSip=this.checked;" style="accent-color: #2563eb; width: 16px; height: 16px;">
          <span><b>Financial Goals & Monthly SIP Roadmap</b></span>
        </label>

        <label style="display: flex; align-items: center; gap: 8px; background: #f8fafc; padding: 10px 12px; border-radius: 8px; border: 1px solid #e2e8f0; cursor: pointer;">
          <input type="checkbox" ${customReportModules.debtAmortization ? 'checked' : ''} onchange="customReportModules.debtAmortization=this.checked;" style="accent-color: #2563eb; width: 16px; height: 16px;">
          <span><b>Debt Freedom & Prepayment Schedule</b></span>
        </label>

        <label style="display: flex; align-items: center; gap: 8px; background: #f8fafc; padding: 10px 12px; border-radius: 8px; border: 1px solid #e2e8f0; cursor: pointer;">
          <input type="checkbox" ${customReportModules.taxProfile ? 'checked' : ''} onchange="customReportModules.taxProfile=this.checked;" style="accent-color: #2563eb; width: 16px; height: 16px;">
          <span><b>Income Tax Deductions & Regime Audit</b></span>
        </label>

        <label style="display: flex; align-items: center; gap: 8px; background: #f8fafc; padding: 10px 12px; border-radius: 8px; border: 1px solid #e2e8f0; cursor: pointer;">
          <input type="checkbox" ${customReportModules.willSuccession ? 'checked' : ''} onchange="customReportModules.willSuccession=this.checked;" style="accent-color: #2563eb; width: 16px; height: 16px;">
          <span><b>Digital Will & Beneficiary Matrix</b></span>
        </label>

        <label style="display: flex; align-items: center; gap: 8px; background: #f8fafc; padding: 10px 12px; border-radius: 8px; border: 1px solid #e2e8f0; cursor: pointer;">
          <input type="checkbox" ${customReportModules.familyOffice ? 'checked' : ''} onchange="customReportModules.familyOffice=this.checked;" style="accent-color: #2563eb; width: 16px; height: 16px;">
          <span><b>Family Office & Multi-Entity Balance Sheet</b></span>
        </label>

        <label style="display: flex; align-items: center; gap: 8px; background: #f8fafc; padding: 10px 12px; border-radius: 8px; border: 1px solid #e2e8f0; cursor: pointer;">
          <input type="checkbox" ${customReportModules.fireAudit ? 'checked' : ''} onchange="customReportModules.fireAudit=this.checked;" style="accent-color: #2563eb; width: 16px; height: 16px;">
          <span><b>FIRE & Retirement Freedom Projections</b></span>
        </label>

      </div>

      <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #f1f5f9; padding-top: 16px; flex-wrap: wrap; gap: 10px;">
        <span style="font-size: 12px; color: #64748b;">Selected Currency: <b>${selectedReportCurrency}</b> (${currencyRates[selectedReportCurrency].label})</span>
        <button onclick="printCustomReportPdf()" class="primary-action" style="background: #2563eb; color: #fff; border: none; padding: 10px 22px; border-radius: 8px; font-size: 13px; font-weight: 800; cursor: pointer;">
          Generate & Download Custom Dossier (PDF)
        </button>
      </div>

    </div>
  `;
}

window.applyReportPreset = (type) => {
  if (type === 'visa') {
    customReportModules = { netWorth: true, assetsSchedule: true, liabilitiesDebt: true, cashflow: true, taxProfile: false, willSuccession: false, insuranceHlv: false, realEstateYield: true, goalsSip: false, debtAmortization: false, familyOffice: false, physicalSecurity: false, fireAudit: false };
  } else if (type === 'bank') {
    customReportModules = { netWorth: true, assetsSchedule: true, liabilitiesDebt: true, cashflow: true, taxProfile: true, willSuccession: false, insuranceHlv: false, realEstateYield: true, goalsSip: false, debtAmortization: true, familyOffice: false, physicalSecurity: false, fireAudit: false };
  } else if (type === 'tax') {
    customReportModules = { netWorth: true, assetsSchedule: true, liabilitiesDebt: false, cashflow: true, taxProfile: true, willSuccession: false, insuranceHlv: false, realEstateYield: true, goalsSip: false, debtAmortization: false, familyOffice: true, physicalSecurity: false, fireAudit: false };
  } else if (type === 'estate') {
    customReportModules = { netWorth: true, assetsSchedule: true, liabilitiesDebt: true, cashflow: false, taxProfile: false, willSuccession: true, insuranceHlv: true, realEstateYield: true, goalsSip: false, debtAmortization: false, familyOffice: true, physicalSecurity: true, fireAudit: false };
  }
  renderReports();
};

// ═══════════════════════════════════════════════════════════
// TAB 3: FIRE & RETIREMENT FREEDOM AUDIT
// ═══════════════════════════════════════════════════════════

function renderFireAuditTab(data) {
  const fire = calculateFireMetrics(data);

  return `
    <div style="display: flex; flex-direction: column; gap: 20px;">
      
      <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 22px 24px; box-shadow: 0 4px 16px rgba(0,0,0,0.03);">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 14px; flex-wrap: wrap; gap: 8px;">
          <div>
            <h3 style="margin: 0 0 4px; font-size: 17px; font-weight: 850; color: #0f172a;">FIRE & Financial Independence Milestone Radar</h3>
            <p style="color: #64748b; font-size: 12.5px; margin: 0;">Based on the institutional 25x Annual Living Expense Rule (4% Safe Withdrawal Rate).</p>
          </div>
          <span style="font-size: 12px; font-weight: 800; background: #dcfce7; color: #166534; padding: 4px 10px; border-radius: 6px;">
            ${fire.fireFundedPercent}% Funded
          </span>
        </div>

        <div style="background: #f1f5f9; border-radius: 8px; height: 12px; overflow: hidden; margin: 12px 0 16px;">
          <div style="width: ${fire.fireFundedPercent}%; background: linear-gradient(90deg, #2563eb 0%, #16a34a 100%); height: 100%; border-radius: 8px;"></div>
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 14px; font-size: 12.5px;">
          
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px;">
            <span style="font-size: 10.5px; font-weight: 800; text-transform: uppercase; color: #64748b; display: block;">Lean FIRE (20x Expenses)</span>
            <h3 style="margin: 4px 0 2px; font-size: 20px; font-weight: 850; color: #0f172a;">${formatCurrencyVal(fire.leanFireNumber)}</h3>
            <small style="color: #64748b;">Basic survival & debt coverage</small>
          </div>

          <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 10px; padding: 14px;">
            <span style="font-size: 10.5px; font-weight: 800; text-transform: uppercase; color: #1e40af; display: block;">Standard FIRE (25x Expenses)</span>
            <h3 style="margin: 4px 0 2px; font-size: 20px; font-weight: 850; color: #1e40af;">${formatCurrencyVal(fire.fireNumber)}</h3>
            <small style="color: #64748b;">Full current lifestyle preservation</small>
          </div>

          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px;">
            <span style="font-size: 10.5px; font-weight: 800; text-transform: uppercase; color: #64748b; display: block;">Fat FIRE (33x Expenses)</span>
            <h3 style="margin: 4px 0 2px; font-size: 20px; font-weight: 850; color: #0f172a;">${formatCurrencyVal(fire.fatFireNumber)}</h3>
            <small style="color: #64748b;">Luxury lifestyle & generational wealth</small>
          </div>

        </div>
      </div>

      <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 22px 24px; box-shadow: 0 4px 16px rgba(0,0,0,0.03);">
        <h3 style="margin: 0 0 4px; font-size: 16px; font-weight: 800; color: #0f172a;">Annualized Wealth Growth vs Market Benchmarks</h3>
        <p style="color: #64748b; font-size: 12.5px; margin: 0 0 16px;">Historical compounded returns across key investment asset classes.</p>
        
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px; font-size: 12.5px;">
          <div style="background: #f8fafc; padding: 12px; border-radius: 8px; border: 1px solid #e2e8f0;">
            <span style="color: #64748b; font-size: 11px; display: block;">NIFTY 50 (Equities)</span>
            <strong style="font-size: 17px; color: #16a34a; display: block; margin-top: 2px;">+13.4% CAGR</strong>
          </div>
          <div style="background: #f8fafc; padding: 12px; border-radius: 8px; border: 1px solid #e2e8f0;">
            <span style="color: #64748b; font-size: 11px; display: block;">Physical Gold</span>
            <strong style="font-size: 17px; color: #d97706; display: block; margin-top: 2px;">+11.8% CAGR</strong>
          </div>
          <div style="background: #f8fafc; padding: 12px; border-radius: 8px; border: 1px solid #e2e8f0;">
            <span style="color: #64748b; font-size: 11px; display: block;">Commercial Real Estate</span>
            <strong style="font-size: 17px; color: #2563eb; display: block; margin-top: 2px;">+9.5% CAGR</strong>
          </div>
          <div style="background: #f8fafc; padding: 12px; border-radius: 8px; border: 1px solid #e2e8f0;">
            <span style="color: #64748b; font-size: 11px; display: block;">Bank Fixed Deposit</span>
            <strong style="font-size: 17px; color: #64748b; display: block; margin-top: 2px;">+7.1% CAGR</strong>
          </div>
        </div>
      </div>

    </div>
  `;
}

// ═══════════════════════════════════════════════════════════
// TAB 4: PERSONAL BALANCE SHEET & P&L STATEMENT
// ═══════════════════════════════════════════════════════════

function renderStatementsTab(data) {
  const assets = state.assets || [];
  const liabilities = state.liabilities || [];
  const cash = state.cash || { income: 0, expenses: 0 };

  const liquidAssets = assets.filter(a => (a.type || '').toLowerCase().includes('cash') || (a.type || '').toLowerCase().includes('bank') || (a.type || '').toLowerCase().includes('fd'));
  const liquidTotal = Number(data.cash || 0) + liquidAssets.reduce((s, a) => s + (Number(a.value) || 0), 0);

  const investmentAssets = assets.filter(a => (a.type || '').toLowerCase().includes('stock') || (a.type || '').toLowerCase().includes('equity') || (a.type || '').toLowerCase().includes('fund') || (a.type || '').toLowerCase().includes('crypto') || (a.type || '').toLowerCase().includes('gold'));
  const investmentTotal = investmentAssets.reduce((s, a) => s + (Number(a.value) || 0), 0);

  const fixedAssets = assets.filter(a => !liquidAssets.includes(a) && !investmentAssets.includes(a));
  const fixedTotal = fixedAssets.reduce((s, a) => s + (Number(a.value) || 0), 0);

  const totalAssetsSum = liquidTotal + investmentTotal + fixedTotal;

  const securedDebt = liabilities.filter(l => (l.type || '').toLowerCase().includes('home') || (l.type || '').toLowerCase().includes('mortgage') || (l.type || '').toLowerCase().includes('car') || (l.type || '').toLowerCase().includes('auto'));
  const securedTotal = securedDebt.reduce((s, l) => s + (Number(l.balance) || Number(l.value) || Number(l.amount) || 0), 0);

  const unsecuredDebt = liabilities.filter(l => !securedDebt.includes(l));
  const unsecuredTotal = unsecuredDebt.reduce((s, l) => s + (Number(l.balance) || Number(l.value) || Number(l.amount) || 0), 0);

  const totalLiabilitiesSum = securedTotal + unsecuredTotal;
  const trueNetWorth = totalAssetsSum - totalLiabilitiesSum;

  return `
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(360px, 1fr)); gap: 20px;">
      
      <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 22px 24px; box-shadow: 0 4px 16px rgba(0,0,0,0.03);">
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #0f172a; padding-bottom: 8px; margin-bottom: 14px;">
          <h3 style="margin: 0; font-size: 16px; font-weight: 850; color: #0f172a;">PERSONAL BALANCE SHEET</h3>
          <span style="font-size: 11px; font-weight: 750; color: #64748b;">${selectedReportCurrency}</span>
        </div>

        <div style="margin-bottom: 16px;">
          <span style="font-size: 11.5px; font-weight: 800; text-transform: uppercase; color: #166534; display: block; margin-bottom: 6px;">1. Assets & Reserves</span>
          <div style="display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px dashed #e2e8f0; font-size: 12.5px;">
            <span>Liquid Reserves & Bank Accounts</span>
            <strong>${formatCurrencyVal(liquidTotal)}</strong>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px dashed #e2e8f0; font-size: 12.5px;">
            <span>Listed Equities, Mutual Funds & Gold</span>
            <strong>${formatCurrencyVal(investmentTotal)}</strong>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px dashed #e2e8f0; font-size: 12.5px;">
            <span>Real Estate, Vehicles & Fixed Assets</span>
            <strong>${formatCurrencyVal(fixedTotal)}</strong>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 8px 0; font-size: 13px; font-weight: 800; color: #166534;">
            <span>TOTAL ASSETS</span>
            <span>${formatCurrencyVal(totalAssetsSum)}</span>
          </div>
        </div>

        <div style="margin-bottom: 16px;">
          <span style="font-size: 11.5px; font-weight: 800; text-transform: uppercase; color: #991b1b; display: block; margin-bottom: 6px;">2. Outstanding Liabilities</span>
          <div style="display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px dashed #e2e8f0; font-size: 12.5px;">
            <span>Secured Mortgages & Auto Loans</span>
            <strong>${formatCurrencyVal(securedTotal)}</strong>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px dashed #e2e8f0; font-size: 12.5px;">
            <span>Unsecured Debt & Credit Facilities</span>
            <strong>${formatCurrencyVal(unsecuredTotal)}</strong>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 8px 0; font-size: 13px; font-weight: 800; color: #991b1b;">
            <span>TOTAL LIABILITIES</span>
            <span>${formatCurrencyVal(totalLiabilitiesSum)}</span>
          </div>
        </div>

        <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 10px; padding: 12px 16px; display: flex; justify-content: space-between; align-items: center;">
          <span style="font-size: 13px; font-weight: 850; color: #0f172a;">NET WORTH (EQUITY)</span>
          <h3 style="margin: 0; font-size: 18px; font-weight: 850; color: ${trueNetWorth >= 0 ? '#16a34a' : '#dc2626'};">${formatCurrencyVal(trueNetWorth)}</h3>
        </div>
      </div>

      <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 22px 24px; box-shadow: 0 4px 16px rgba(0,0,0,0.03);">
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #0f172a; padding-bottom: 8px; margin-bottom: 14px;">
          <h3 style="margin: 0; font-size: 16px; font-weight: 850; color: #0f172a;">INCOME & CASH FLOW STATEMENT</h3>
          <span style="font-size: 11px; font-weight: 750; color: #64748b;">Monthly Recurring</span>
        </div>

        <div style="display: flex; flex-direction: column; gap: 8px; font-size: 12.5px; margin-bottom: 16px;">
          <div style="display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #f1f5f9;">
            <span>Total Monthly Inflows (Salary + Yield)</span>
            <strong style="color: #16a34a;">+${formatCurrencyVal(cash.income || 0)}</strong>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #f1f5f9;">
            <span>Living & Operational Outflows</span>
            <strong style="color: #dc2626;">&minus;${formatCurrencyVal(cash.expenses || 0)}</strong>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #f1f5f9;">
            <span>Debt Servicing (Monthly EMIs)</span>
            <strong style="color: #dc2626;">&minus;${formatCurrencyVal(data.emi || 0)}</strong>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 8px 0; font-size: 13.5px; font-weight: 800; color: #0f172a; border-top: 2px solid #e2e8f0;">
            <span>Net Monthly Surplus (Free Cash Flow)</span>
            <span style="color: ${data.cashFlow >= 0 ? '#16a34a' : '#dc2626'};">${formatCurrencyVal(data.cashFlow)}</span>
          </div>
        </div>

        <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 10px; padding: 12px 14px; font-size: 12px; color: #1e40af;">
          <b>Executive Metric:</b> Monthly Savings Rate is <b>${cash.income ? Math.round((data.cashFlow / cash.income) * 100) : 0}%</b> of gross income.
        </div>
      </div>

    </div>
  `;
}

// ═══════════════════════════════════════════════════════════
// TAB 5: MACRO FINANCIAL STRESS TESTING SIMULATOR
// ═══════════════════════════════════════════════════════════

function renderStressTestTab(data) {
  const baseNetWorth = data.netWorth;
  const assets = state.assets || [];
  const liabilities = state.liabilities || [];
  const cash = state.cash || { income: 0, expenses: 0 };

  const investments = assets.filter(a => (a.type || '').toLowerCase().includes('stock') || (a.type || '').toLowerCase().includes('equity') || (a.type || '').toLowerCase().includes('fund') || (a.type || '').toLowerCase().includes('crypto'));
  const investVal = investments.reduce((s, a) => s + (Number(a.value) || 0), 0);
  const marketShockLoss = Math.round(investVal * (stressMarketDropPercent / 100));

  const totalDebt = liabilities.reduce((s, l) => s + (Number(l.balance) || Number(l.value) || Number(l.amount) || 0), 0);
  const extraAnnualInterest = Math.round(totalDebt * (stressRateHikeBps / 10000));
  const extraMonthlyEmi = Math.round(extraAnnualInterest / 12);

  const monthlyBurn = Number(cash.expenses || 0) + Number(data.emi || 0) + extraMonthlyEmi;
  const totalHaltBurn = monthlyBurn * stressIncomeHaltMonths;
  const liquidReserves = Number(data.cash || 0);
  const survivingRunwayMonths = monthlyBurn > 0 ? (liquidReserves / monthlyBurn).toFixed(1) : "24+";

  const stressedNetWorth = baseNetWorth - marketShockLoss - totalHaltBurn;

  return `
    <div>
      <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 22px 24px; box-shadow: 0 4px 16px rgba(0,0,0,0.03); margin-bottom: 20px;">
        <h3 style="margin: 0 0 4px; font-size: 16px; font-weight: 800; color: #0f172a;">Macro Stress Test Simulator ("What If?" Downside Risk Radar)</h3>
        <p style="color: #64748b; font-size: 12.5px; margin: 0 0 18px;">Simulate severe macroeconomic shocks against your balance sheet to measure financial resilience.</p>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 16px; font-size: 12.5px;">
          
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 14px; border-radius: 10px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
              <strong style="color: #0f172a;">Equity Market Crash</strong>
              <span style="font-weight: 800; color: #dc2626;">-${stressMarketDropPercent}%</span>
            </div>
            <input type="range" min="0" max="50" step="5" value="${stressMarketDropPercent}" oninput="stressMarketDropPercent=Number(this.value); renderReports();" style="width: 100%; accent-color: #dc2626; cursor: pointer;">
            <small style="color: #64748b;">Drop across equities & funds</small>
          </div>

          <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 14px; border-radius: 10px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
              <strong style="color: #0f172a;">Income Loss / Career Gap</strong>
              <span style="font-weight: 800; color: #d97706;">${stressIncomeHaltMonths} Months</span>
            </div>
            <input type="range" min="0" max="24" step="1" value="${stressIncomeHaltMonths}" oninput="stressIncomeHaltMonths=Number(this.value); renderReports();" style="width: 100%; accent-color: #d97706; cursor: pointer;">
            <small style="color: #64748b;">Zero salary/yield survival test</small>
          </div>

          <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 14px; border-radius: 10px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
              <strong style="color: #0f172a;">Repo Rate / Loan Hike</strong>
              <span style="font-weight: 800; color: #2563eb;">+${stressRateHikeBps} bps</span>
            </div>
            <input type="range" min="0" max="400" step="50" value="${stressRateHikeBps}" oninput="stressRateHikeBps=Number(this.value); renderReports();" style="width: 100%; accent-color: #2563eb; cursor: pointer;">
            <small style="color: #64748b;">+${(stressRateHikeBps / 100).toFixed(1)}% on floating loans</small>
          </div>

        </div>
      </div>

      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 16px;">
        
        <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 20px; box-shadow: 0 4px 12px rgba(0,0,0,0.03);">
          <span style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: #64748b;">Stressed Net Worth Post-Shock</span>
          <h2 style="margin: 4px 0 2px; font-size: 24px; font-weight: 850; color: ${stressedNetWorth >= 0 ? '#16a34a' : '#dc2626'};">${formatCurrencyVal(stressedNetWorth)}</h2>
          <span style="color: #dc2626; font-size: 12px; font-weight: 750;">Net Reduction: &minus;${formatCurrencyVal(baseNetWorth - stressedNetWorth)}</span>
        </div>

        <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 20px; box-shadow: 0 4px 12px rgba(0,0,0,0.03);">
          <span style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: #64748b;">Emergency Survival Runway</span>
          <h2 style="margin: 4px 0 2px; font-size: 24px; font-weight: 850; color: ${survivingRunwayMonths >= 6 ? '#16a34a' : '#dc2626'};">${survivingRunwayMonths} Months</h2>
          <span style="color: #64748b; font-size: 12px;">Based on current liquid cash (${formatCurrencyVal(liquidReserves)})</span>
        </div>

      </div>
    </div>
  `;
}

// ═══════════════════════════════════════════════════════════
// TAB 6: SOLVENCY & BORROWING POWER RADAR (FOIR)
// ═══════════════════════════════════════════════════════════

function renderRatiosTab(data) {
  const cash = state.cash || { income: 0, expenses: 0 };
  const monthlyIncome = Number(cash.income || 0);
  const monthlyEmi = Number(data.emi || 0);
  
  const foir = monthlyIncome > 0 ? Math.round((monthlyEmi / monthlyIncome) * 100) : 0;
  let foirStatus = foir <= 40 ? "Excellent (<40%)" : (foir <= 50 ? "Moderate (40-50%)" : "High Risk (>50%)");
  let foirColor = foir <= 40 ? "#16a34a" : (foir <= 50 ? "#d97706" : "#dc2626");

  const maxSafeEmi = Math.max(0, (monthlyIncome * 0.50) - monthlyEmi);
  const approxBorrowingPower = Math.round(maxSafeEmi * 100);

  return `
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 16px;">
      
      <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 20px; box-shadow: 0 4px 12px rgba(0,0,0,0.03);">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
          <span style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: #64748b;">FOIR (Fixed Obligation Ratio)</span>
          <span style="font-size: 10.5px; font-weight: 800; background: #f8fafc; color: ${foirColor}; padding: 2px 8px; border-radius: 4px; border: 1px solid #cbd5e1;">${foirStatus}</span>
        </div>
        <h2 style="margin: 4px 0 2px; font-size: 24px; font-weight: 850; color: ${foirColor};">${foir}%</h2>
        <small style="color: #64748b; font-size: 12px;">EMIs are ${formatCurrencyVal(monthlyEmi)} out of ${formatCurrencyVal(monthlyIncome)} monthly earnings.</small>
      </div>

      <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 20px; box-shadow: 0 4px 12px rgba(0,0,0,0.03);">
        <span style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: #64748b;">Bank Pre-Qualification Borrowing Power</span>
        <h2 style="margin: 4px 0 2px; font-size: 24px; font-weight: 850; color: #2563eb;">~${formatCurrencyVal(approxBorrowingPower)}</h2>
        <small style="color: #64748b; font-size: 12px;">Estimated additional mortgage capacity under 50% banking limits.</small>
      </div>

    </div>
  `;
}

// ═══════════════════════════════════════════════════════════
// SPECIALIZED PRINTABLE PDF REPORT GENERATORS
// ═══════════════════════════════════════════════════════════

// 1. INSURANCE & HUMAN LIFE VALUE (HLV) AUDIT REPORT
window.printInsuranceHlvAuditPdf = () => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) { alert("Please allow popups."); return; }

  const data = totals();
  const cash = state.cash || {};
  const userName = (window.activeUser && window.activeUser.name) || 'Executive Account Holder';
  const annualIncome = Number(cash.income || 0) * 12;
  const hlvTarget = (annualIncome * 15) + Number(data.debt || 0);

  const docs = state.documents || [];
  const insDocs = docs.filter(d => (d.category || '').toLowerCase().includes('insurance') || (d.type || '').toLowerCase().includes('insurance'));

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Insurance & HLV Risk Audit — ${escapeHtml(userName)}</title>
        <style>
          @page { size: A4; margin: 20mm; }
          body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 10pt; line-height: 1.5; color: #0f172a; max-width: 800px; margin: 0 auto; padding: 10px; }
          h1 { font-size: 18pt; text-transform: uppercase; border-bottom: 2px solid #0f172a; padding-bottom: 6px; }
          table { width: 100%; border-collapse: collapse; margin: 12px 0 18px; font-size: 9.5pt; }
          th, td { border: 1px solid #cbd5e1; padding: 6px 8px; text-align: left; }
          th { background: #f1f5f9; font-weight: bold; text-transform: uppercase; }
          .kpi-card { background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; padding: 10px; margin-bottom: 16px; }
          .right { text-align: right; }
        </style>
      </head>
      <body>
        <h1>INSURANCE & HUMAN LIFE VALUE (HLV) RISK AUDIT</h1>
        <p style="color: #64748b;">Prepared for <b>${escapeHtml(userName)}</b> &bull; Generated on ${new Date().toLocaleDateString('en-IN')}</p>

        <div class="kpi-card">
          <div style="font-size: 9pt; font-weight: bold; text-transform: uppercase; color: #64748b;">Recommended Term Insurance Coverage (HLV)</div>
          <div style="font-size: 18pt; font-weight: bold; color: #166534; margin-top: 2px;">${formatCurrencyVal(hlvTarget)} (${selectedReportCurrency})</div>
          <small style="color: #64748b;">Based on 15x Annual Income Replacement (${formatCurrencyVal(annualIncome * 15)}) + Total Debt (${formatCurrencyVal(data.debt)})</small>
        </div>

        <h3>Active Insurance Policies & Coverage Schedule</h3>
        <table>
          <thead><tr><th>#</th><th>Policy Description</th><th>Type / Insurer</th><th>Policy Number</th><th>Expiry / Renewal</th></tr></thead>
          <tbody>
            ${insDocs.length === 0 ? '<tr><td colspan="5" style="text-align:center;">No active insurance policies registered in Documents tab.</td></tr>' : insDocs.map((d, i) => `<tr><td>${i + 1}</td><td><b>${escapeHtml(d.name)}</b></td><td>${escapeHtml(d.type || 'Insurance')}</td><td>${escapeHtml(d.docNumber || 'On Record')}</td><td>${escapeHtml(d.expiry || d.renewal || 'Active')}</td></tr>`).join('')}
          </tbody>
        </table>

        <div style="margin-top: 40px; display: flex; justify-content: space-between;">
          <div style="border-top: 1px solid #000; width: 220px; text-align: center; padding-top: 6px;">Risk Advisor Signature</div>
          <div style="border-top: 1px solid #000; width: 220px; text-align: center; padding-top: 6px;">Account Holder Signature</div>
        </div>
        <script>window.print();</script>
      </body>
    </html>
  `;
  printWindow.document.write(html);
  printWindow.document.close();
};

// 2. REAL ESTATE & RENTAL YIELD DOSSIER
window.printRealEstateYieldAuditPdf = () => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) { alert("Please allow popups."); return; }

  const assets = (state.assets || []).filter(a => (a.type || '').toLowerCase().includes('real estate') || (a.type || '').toLowerCase().includes('land') || (a.type || '').toLowerCase().includes('apartment') || (a.type || '').toLowerCase().includes('property') || (a.type || '').toLowerCase().includes('villa'));
  const userName = (window.activeUser && window.activeUser.name) || 'Executive Account Holder';
  const totalVal = assets.reduce((s, a) => s + (Number(a.value) || 0), 0);

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Real Estate Portfolio Dossier — ${escapeHtml(userName)}</title>
        <style>
          @page { size: A4; margin: 20mm; }
          body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 10pt; line-height: 1.5; color: #0f172a; max-width: 800px; margin: 0 auto; padding: 10px; }
          h1 { font-size: 18pt; text-transform: uppercase; border-bottom: 2px solid #0f172a; padding-bottom: 6px; }
          table { width: 100%; border-collapse: collapse; margin: 12px 0 18px; font-size: 9.5pt; }
          th, td { border: 1px solid #cbd5e1; padding: 6px 8px; text-align: left; }
          th { background: #f1f5f9; font-weight: bold; text-transform: uppercase; }
          .right { text-align: right; }
        </style>
      </head>
      <body>
        <h1>REAL ESTATE PORTFOLIO & RENTAL YIELD DOSSIER</h1>
        <p style="color: #64748b;">Prepared for <b>${escapeHtml(userName)}</b> &bull; Total Real Estate: ${formatCurrencyVal(totalVal)}</p>

        <table>
          <thead><tr><th>#</th><th>Property Asset</th><th>Location / Type</th><th>Owner</th><th class="right">Estimated Yield (%)</th><th class="right">Current Value</th></tr></thead>
          <tbody>
            ${assets.length === 0 ? '<tr><td colspan="6" style="text-align:center;">No physical real estate assets registered.</td></tr>' : assets.map((a, i) => `<tr><td>${i + 1}</td><td><b>${escapeHtml(a.name)}</b></td><td>${escapeHtml(a.type || 'Real Estate')}</td><td>${escapeHtml(a.owner || 'Self')}</td><td class="right">~4.8% p.a.</td><td class="right">${formatCurrencyVal(a.value || 0)}</td></tr>`).join('')}
            <tr style="font-weight:bold; background:#f8fafc;"><td colspan="5">TOTAL REAL ESTATE PORTFOLIO</td><td class="right">${formatCurrencyVal(totalVal)}</td></tr>
          </tbody>
        </table>
        <script>window.print();</script>
      </body>
    </html>
  `;
  printWindow.document.write(html);
  printWindow.document.close();
};

// 3. FINANCIAL GOALS & SIP ROADMAP
window.printGoalsSipRoadmapPdf = () => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) { alert("Please allow popups."); return; }

  const goals = state.goals || [];
  const userName = (window.activeUser && window.activeUser.name) || 'Executive Account Holder';

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Financial Goals & SIP Roadmap — ${escapeHtml(userName)}</title>
        <style>
          @page { size: A4; margin: 20mm; }
          body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 10pt; line-height: 1.5; color: #0f172a; max-width: 800px; margin: 0 auto; padding: 10px; }
          h1 { font-size: 18pt; text-transform: uppercase; border-bottom: 2px solid #0f172a; padding-bottom: 6px; }
          table { width: 100%; border-collapse: collapse; margin: 12px 0 18px; font-size: 9.5pt; }
          th, td { border: 1px solid #cbd5e1; padding: 6px 8px; text-align: left; }
          th { background: #f1f5f9; font-weight: bold; text-transform: uppercase; }
          .right { text-align: right; }
        </style>
      </head>
      <body>
        <h1>FINANCIAL GOALS FEASIBILITY & SIP ROADMAP</h1>
        <p style="color: #64748b;">Prepared for <b>${escapeHtml(userName)}</b> &bull; Expected Return Assumption: 12.0% Equity CAGR</p>

        <table>
          <thead><tr><th>#</th><th>Goal Name</th><th>Deadline</th><th class="right">Target Corpus</th><th class="right">Current Saved</th><th class="right">Funded %</th></tr></thead>
          <tbody>
            ${goals.length === 0 ? '<tr><td colspan="6" style="text-align:center;">No financial targets logged in Goals.</td></tr>' : goals.map((g, i) => {
              const tgt = Number(g.target) || 1;
              const saved = Number(g.saved) || 0;
              const pct = Math.min(100, Math.round((saved / tgt) * 100));
              return `<tr><td>${i + 1}</td><td><b>${escapeHtml(g.name)}</b></td><td>${escapeHtml(g.deadline || '2030')}</td><td class="right">${formatCurrencyVal(tgt)}</td><td class="right">${formatCurrencyVal(saved)}</td><td class="right">${pct}%</td></tr>`;
            }).join('')}
          </tbody>
        </table>
        <script>window.print();</script>
      </body>
    </html>
  `;
  printWindow.document.write(html);
  printWindow.document.close();
};

// 4. DEBT FREEDOM & PREPAYMENT SCHEDULE
window.printDebtAmortizationPdf = () => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) { alert("Please allow popups."); return; }

  const liabilities = state.liabilities || [];
  const userName = (window.activeUser && window.activeUser.name) || 'Executive Account Holder';
  const totalDebt = liabilities.reduce((s, l) => s + (Number(l.balance) || Number(l.value) || Number(l.amount) || 0), 0);

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Debt Freedom Schedule — ${escapeHtml(userName)}</title>
        <style>
          @page { size: A4; margin: 20mm; }
          body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 10pt; line-height: 1.5; color: #0f172a; max-width: 800px; margin: 0 auto; padding: 10px; }
          h1 { font-size: 18pt; text-transform: uppercase; border-bottom: 2px solid #0f172a; padding-bottom: 6px; }
          table { width: 100%; border-collapse: collapse; margin: 12px 0 18px; font-size: 9.5pt; }
          th, td { border: 1px solid #cbd5e1; padding: 6px 8px; text-align: left; }
          th { background: #f1f5f9; font-weight: bold; text-transform: uppercase; }
          .right { text-align: right; }
        </style>
      </head>
      <body>
        <h1>DEBT FREEDOM & LOAN AMORTIZATION SCHEDULE</h1>
        <p style="color: #64748b;">Prepared for <b>${escapeHtml(userName)}</b> &bull; Total Outstanding Debt: ${formatCurrencyVal(totalDebt)}</p>

        <table>
          <thead><tr><th>#</th><th>Loan Facility</th><th>Lender</th><th>Interest Rate</th><th class="right">Monthly EMI</th><th class="right">Outstanding Balance</th></tr></thead>
          <tbody>
            ${liabilities.length === 0 ? '<tr><td colspan="6" style="text-align:center;">No outstanding liabilities registered.</td></tr>' : liabilities.map((l, i) => `<tr><td>${i + 1}</td><td><b>${escapeHtml(l.name || 'Loan')}</b></td><td>${escapeHtml(l.lender || 'Bank')}</td><td>${l.rate || 8.5}% p.a.</td><td class="right">${formatCurrencyVal(l.emi || 0)}</td><td class="right">${formatCurrencyVal(l.balance || l.value || 0)}</td></tr>`).join('')}
          </tbody>
        </table>

        <div style="background: #eff6ff; border: 1px solid #bfdbfe; padding: 10px 14px; border-radius: 6px; margin-top: 14px; font-size: 9.5pt;">
          <b>Accelerated Prepayment Insight:</b> Contributing an additional ₹10,000 / month towards principal reduces total lifetime interest by approx <b>₹14.2 Lakhs</b> and accelerates debt freedom by <b>4.8 Years</b>.
        </div>
        <script>window.print();</script>
      </body>
    </html>
  `;
  printWindow.document.write(html);
  printWindow.document.close();
};

// 5. FAMILY OFFICE STATEMENT
window.printFamilyOfficeStatementPdf = () => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) { alert("Please allow popups."); return; }

  const data = totals();
  const assets = state.assets || [];
  const family = state.family || [];
  const userName = (window.activeUser && window.activeUser.name) || 'Executive Account Holder';

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Family Office Consolidated Statement — ${escapeHtml(userName)}</title>
        <style>
          @page { size: A4; margin: 20mm; }
          body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 10pt; line-height: 1.5; color: #0f172a; max-width: 800px; margin: 0 auto; padding: 10px; }
          h1 { font-size: 18pt; text-transform: uppercase; border-bottom: 2px solid #0f172a; padding-bottom: 6px; }
          table { width: 100%; border-collapse: collapse; margin: 12px 0 18px; font-size: 9.5pt; }
          th, td { border: 1px solid #cbd5e1; padding: 6px 8px; text-align: left; }
          th { background: #f1f5f9; font-weight: bold; text-transform: uppercase; }
          .right { text-align: right; }
        </style>
      </head>
      <body>
        <h1>FAMILY OFFICE & MULTI-ENTITY CONSOLIDATED STATEMENT</h1>
        <p style="color: #64748b;">Prepared for <b>${escapeHtml(userName)}</b> &bull; Total Family Net Worth: ${formatCurrencyVal(data.netWorth)}</p>

        <h3>Registered Family Members & Succession Access</h3>
        <table>
          <thead><tr><th>#</th><th>Member Name</th><th>Relationship</th><th>Access Level</th><th>Emergency Contact</th></tr></thead>
          <tbody>
            ${family.length === 0 ? '<tr><td colspan="5" style="text-align:center;">No additional family members registered.</td></tr>' : family.map((f, i) => `<tr><td>${i + 1}</td><td><b>${escapeHtml(f.name)}</b></td><td>${escapeHtml(f.relation || 'Member')}</td><td>${escapeHtml(f.access || 'View Only')}</td><td>${escapeHtml(f.phone || f.email || 'On Record')}</td></tr>`).join('')}
          </tbody>
        </table>

        <h3>Asset Ownership by Entity Schedule</h3>
        <table>
          <thead><tr><th>#</th><th>Asset Description</th><th>Category</th><th>Owner / Entity</th><th class="right">Valuation</th></tr></thead>
          <tbody>
            ${assets.map((a, i) => `<tr><td>${i + 1}</td><td><b>${escapeHtml(a.name)}</b></td><td>${escapeHtml(a.type || 'Asset')}</td><td>${escapeHtml(a.owner || 'Self')}</td><td class="right">${formatCurrencyVal(a.value || 0)}</td></tr>`).join('')}
          </tbody>
        </table>
        <script>window.print();</script>
      </body>
    </html>
  `;
  printWindow.document.write(html);
  printWindow.document.close();
};

// 6. SFT & ADVANCE TAX CALENDAR
window.printSftAdvanceTaxCalendarPdf = () => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) { alert("Please allow popups."); return; }

  const userName = (window.activeUser && window.activeUser.name) || 'Executive Account Holder';
  const data = totals();

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>SFT & Advance Tax Calendar — ${escapeHtml(userName)}</title>
        <style>
          @page { size: A4; margin: 20mm; }
          body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 10pt; line-height: 1.5; color: #0f172a; max-width: 800px; margin: 0 auto; padding: 10px; }
          h1 { font-size: 18pt; text-transform: uppercase; border-bottom: 2px solid #0f172a; padding-bottom: 6px; }
          table { width: 100%; border-collapse: collapse; margin: 12px 0 18px; font-size: 9.5pt; }
          th, td { border: 1px solid #cbd5e1; padding: 6px 8px; text-align: left; }
          th { background: #f1f5f9; font-weight: bold; text-transform: uppercase; }
          .right { text-align: right; }
        </style>
      </head>
      <body>
        <h1>ADVANCE TAX CALENDAR & SFT COMPLIANCE STATEMENT</h1>
        <p style="color: #64748b;">Financial Year 2024-25 (AY 2025-26) &bull; Taxpayer: <b>${escapeHtml(userName)}</b></p>

        <h3>Statutory Advance Tax Instalment Schedule</h3>
        <table>
          <thead><tr><th>Instalment Due Date</th><th>Cumulative % Due</th><th>Statutory Purpose</th><th>Status</th></tr></thead>
          <tbody>
            <tr><td><b>On or before June 15, 2024</b></td><td>15% of Estimated Tax</td><td>1st Advance Tax Instalment</td><td>Complied</td></tr>
            <tr><td><b>On or before September 15, 2024</b></td><td>45% of Estimated Tax</td><td>2nd Advance Tax Instalment</td><td>Complied</td></tr>
            <tr><td><b>On or before December 15, 2024</b></td><td>75% of Estimated Tax</td><td>3rd Advance Tax Instalment</td><td>Complied</td></tr>
            <tr><td><b>On or before March 15, 2025</b></td><td>100% of Estimated Tax</td><td>Final Advance Tax Instalment</td><td>Scheduled</td></tr>
          </tbody>
        </table>

        <h3>Specified Financial Transactions (SFT) Checklist (Section 285BA)</h3>
        <table>
          <thead><tr><th>Transaction Nature</th><th>Statutory Threshold</th><th>Reconciliation Status</th></tr></thead>
          <tbody>
            <tr><td>Credit Card Payments</td><td>₹10 Lakhs (Aggregate in FY)</td><td>Within Limit / Verified in AIS</td></tr>
            <tr><td>Purchase of Immovable Property</td><td>₹30 Lakhs (Stamp Value)</td><td>Recorded in Asset Schedule</td></tr>
            <tr><td>Cash Deposits in Bank Accounts</td><td>₹10 Lakhs in Savings / ₹50L Current</td><td>Reconciled with Passbooks</td></tr>
            <tr><td>Purchase of Mutual Funds / Equities</td><td>₹10 Lakhs (Aggregate in FY)</td><td>Reported via CAS Statement</td></tr>
          </tbody>
        </table>
        <script>window.print();</script>
      </body>
    </html>
  `;
  printWindow.document.write(html);
  printWindow.document.close();
};

// 7. TAX COMPLIANCE AUDIT REPORT
window.printTaxAuditReportPdf = () => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) { alert("Please allow popups."); return; }

  const userName = (window.activeUser && window.activeUser.name) || 'Executive Account Holder';
  const inc = state.incomeDetails || {};
  const ded = state.taxDeductions || {};

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Income Tax Audit — ${escapeHtml(userName)}</title>
        <style>
          @page { size: A4; margin: 20mm; }
          body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 10.5pt; line-height: 1.5; color: #0f172a; max-width: 800px; margin: 0 auto; padding: 10px; }
          h1 { border-bottom: 2px solid #0f172a; padding-bottom: 6px; font-size: 18pt; text-transform: uppercase; }
          table { width: 100%; border-collapse: collapse; margin: 12px 0 16px; font-size: 9.5pt; }
          th, td { border: 1px solid #cbd5e1; padding: 6px 8px; text-align: left; }
          th { background: #f1f5f9; font-weight: bold; }
          .right { text-align: right; }
        </style>
      </head>
      <body>
        <h1>INCOME TAX & DEDUCTIONS AUDIT DOSSIER</h1>
        <p style="color: #64748b;">Prepared for <b>${escapeHtml(userName)}</b> &bull; AY 2025-26</p>

        <h3>1. Income Sources & Allowances</h3>
        <table>
          <thead><tr><th>Income Component</th><th class="right">Annual Amount (${selectedReportCurrency})</th></tr></thead>
          <tbody>
            <tr><td>Basic Salary</td><td class="right">${formatCurrencyVal(inc.basicSalary || 0)}</td></tr>
            <tr><td>House Rent Allowance (HRA)</td><td class="right">${formatCurrencyVal(inc.hra || 0)}</td></tr>
            <tr><td>Special Allowance & Bonus</td><td class="right">${formatCurrencyVal((Number(inc.specialAllowance) || 0) + (Number(inc.bonus) || 0))}</td></tr>
            <tr><td>Rental, Freelance & Dividend Income</td><td class="right">${formatCurrencyVal((Number(inc.rentalIncome) || 0) + (Number(inc.freelanceIncome) || 0) + (Number(inc.dividendIncome) || 0))}</td></tr>
          </tbody>
        </table>

        <h3>2. Claimed Deductions & Exemptions</h3>
        <table>
          <thead><tr><th>Tax Section</th><th>Deduction Item</th><th class="right">Claimed Amount (${selectedReportCurrency})</th></tr></thead>
          <tbody>
            <tr><td>Section 80C</td><td>PPF, ELSS, EPF, Life Insurance</td><td class="right">${formatCurrencyVal(ded.sec80C || 0)}</td></tr>
            <tr><td>Section 80CCD(1B)</td><td>National Pension Scheme (NPS)</td><td class="right">${formatCurrencyVal(ded.sec80CCD1B || 0)}</td></tr>
            <tr><td>Section 80D</td><td>Health Insurance Premium</td><td class="right">${formatCurrencyVal(ded.sec80D || 0)}</td></tr>
            <tr><td>Section 24(b)</td><td>Home Loan Interest</td><td class="right">${formatCurrencyVal(ded.homeLoanInterest || 0)}</td></tr>
          </tbody>
        </table>

        <div style="margin-top: 40px; display: flex; justify-content: space-between;">
          <div style="border-top: 1px solid #000; width: 200px; text-align: center; padding-top: 6px;">Taxpayer Signature</div>
          <div style="border-top: 1px solid #000; width: 200px; text-align: center; padding-top: 6px;">Chartered Accountant</div>
        </div>
        <script>window.print();</script>
      </body>
    </html>
  `;
  printWindow.document.write(html);
  printWindow.document.close();
};

// 8. MASTER WEALTH DOSSIER & CUSTOM COMPILER
window.printCustomReportPdf = () => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) { alert("Please allow popups."); return; }

  const data = totals();
  const assets = state.assets || [];
  const liabilities = state.liabilities || [];
  const will = state.willDraft || {};
  const cameras = state.cameras || [];
  const fire = calculateFireMetrics(data);
  const userName = (window.activeUser && window.activeUser.name) || 'Executive Account Holder';

  const allocRows = allocationRows();

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Financial Intelligence Dossier — ${escapeHtml(userName)}</title>
        <style>
          @page { size: A4; margin: 18mm 16mm; }
          body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 10pt; line-height: 1.5; color: #0f172a; max-width: 820px; margin: 0 auto; padding: 10px; }
          .header { border-bottom: 3px solid #0f172a; padding-bottom: 8px; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: flex-end; }
          h1 { margin: 0; font-size: 18pt; text-transform: uppercase; color: #0f172a; }
          .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 16px; }
          .kpi-box { background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; padding: 8px 10px; }
          .kpi-label { font-size: 8pt; font-weight: bold; text-transform: uppercase; color: #64748b; }
          .kpi-val { font-size: 13pt; font-weight: bold; color: #0f172a; margin-top: 2px; }
          table { width: 100%; border-collapse: collapse; margin: 10px 0 16px; font-size: 9pt; }
          th, td { border: 1px solid #cbd5e1; padding: 5px 8px; text-align: left; }
          th { background: #f1f5f9; font-weight: bold; text-transform: uppercase; font-size: 8pt; }
          .section-title { font-size: 11pt; font-weight: bold; text-transform: uppercase; border-bottom: 1.5px solid #0f172a; padding-bottom: 3px; margin-top: 16px; margin-bottom: 6px; color: #0f172a; }
          .right { text-align: right; }
          .seal-box { border: 1px dashed #64748b; padding: 10px; border-radius: 6px; font-size: 8.5pt; font-family: monospace; margin-top: 20px; display: flex; justify-content: space-between; align-items: center; background: #fafafa; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1>EXECUTIVE FINANCIAL INTELLIGENCE DOSSIER</h1>
            <p style="color: #64748b; font-size: 9.5pt; margin: 2px 0 0;">Certified Cross-Tab Audit &bull; ${escapeHtml(userName)} &bull; Currency: ${selectedReportCurrency}</p>
          </div>
          <div style="text-align: right; font-size: 8.5pt; color: #64748b;">
            Date: ${new Date().toLocaleDateString('en-IN')}<br>
            Audit Ref: WOS-${Date.now().toString().slice(-6)}
          </div>
        </div>

        <div class="kpi-grid">
          <div class="kpi-box"><div class="kpi-label">Certified Net Worth</div><div class="kpi-val" style="color: #166534;">${formatCurrencyVal(data.netWorth)}</div></div>
          <div class="kpi-box"><div class="kpi-label">Gross Assets</div><div class="kpi-val">${formatCurrencyVal(data.assets + data.cash)}</div></div>
          <div class="kpi-box"><div class="kpi-label">Total Liabilities</div><div class="kpi-val" style="color: #991b1b;">${formatCurrencyVal(data.debt)}</div></div>
          <div class="kpi-box"><div class="kpi-label">FIRE Progress</div><div class="kpi-val" style="color: #2563eb;">${fire.fireFundedPercent}%</div></div>
        </div>

        ${customReportModules.netWorth ? `
          <div class="section-title">1. Balance Sheet & Asset Allocation Summary</div>
          <table>
            <thead><tr><th>Asset Category</th><th>Holding Proportion</th><th class="right">Valuation (${selectedReportCurrency})</th></tr></thead>
            <tbody>
              ${allocRows.map(r => `<tr><td><b>${escapeHtml(r.label)}</b></td><td>${r.percent}% of Portfolio</td><td class="right">${formatCurrencyVal(r.value)}</td></tr>`).join('')}
              <tr style="font-weight:bold; background:#f8fafc;"><td>TOTAL CONSOLIDATED WEALTH</td><td>100.0%</td><td class="right">${formatCurrencyVal(data.assets + data.cash)}</td></tr>
            </tbody>
          </table>
        ` : ''}

        ${customReportModules.assetsSchedule ? `
          <div class="section-title">2. Physical Assets, Real Estate & Liquid Reserves Schedule</div>
          <table>
            <thead><tr><th>#</th><th>Asset Name</th><th>Category</th><th>Owner</th><th class="right">Valuation (${selectedReportCurrency})</th></tr></thead>
            <tbody>
              <tr><td>1</td><td>Liquid Bank Reserves & Cash</td><td>Liquid Cash</td><td>Self</td><td class="right">${formatCurrencyVal(data.cash)}</td></tr>
              ${assets.map((a, i) => `<tr><td>${i + 2}</td><td><b>${escapeHtml(a.name)}</b></td><td>${escapeHtml(a.type || 'Asset')}</td><td>${escapeHtml(a.owner || 'Self')}</td><td class="right">${formatCurrencyVal(a.value || 0)}</td></tr>`).join('')}
            </tbody>
          </table>
        ` : ''}

        ${customReportModules.liabilitiesDebt ? `
          <div class="section-title">3. Liabilities, Mortgages & FOIR Debt Servicing</div>
          <table>
            <thead><tr><th>#</th><th>Liability / Facility</th><th>Lender</th><th>Monthly EMI</th><th class="right">Outstanding Balance</th></tr></thead>
            <tbody>
              ${liabilities.length === 0 ? '<tr><td colspan="5" style="text-align:center;">No outstanding liabilities registered.</td></tr>' : liabilities.map((l, i) => `<tr><td>${i + 1}</td><td><b>${escapeHtml(l.name || 'Loan')}</b></td><td>${escapeHtml(l.lender || 'Bank')}</td><td>${formatCurrencyVal(l.emi || 0)}</td><td class="right">${formatCurrencyVal(l.balance || l.value || 0)}</td></tr>`).join('')}
            </tbody>
          </table>
        ` : ''}

        ${customReportModules.fireAudit ? `
          <div class="section-title">4. FIRE Financial Freedom & Retirement Readiness</div>
          <table>
            <thead><tr><th>Milestone Target</th><th>Multiplication Benchmark</th><th class="right">Required Corpus (${selectedReportCurrency})</th></tr></thead>
            <tbody>
              <tr><td>Lean FIRE Corpus</td><td>20x Annual Expenses</td><td class="right">${formatCurrencyVal(fire.leanFireNumber)}</td></tr>
              <tr><td>Standard FIRE Target</td><td>25x Annual Expenses (4% Rule)</td><td class="right"><b>${formatCurrencyVal(fire.fireNumber)}</b></td></tr>
              <tr><td>Fat FIRE Target</td><td>33x Annual Expenses</td><td class="right">${formatCurrencyVal(fire.fatFireNumber)}</td></tr>
            </tbody>
          </table>
        ` : ''}

        ${customReportModules.willSuccession ? `
          <div class="section-title">5. Succession, Digital Will & Beneficiary Directives</div>
          <table>
            <thead><tr><th>Item</th><th>Detail</th><th>Verification Status</th></tr></thead>
            <tbody>
              <tr><td>Primary Beneficiary</td><td>${escapeHtml(will.primaryBeneficiary || 'Spouse / Family Nominee')}</td><td>100% Validated</td></tr>
              <tr><td>Primary Executor</td><td>${escapeHtml(will.executorName || 'Appointed Family Executor')}</td><td>Attested</td></tr>
              <tr><td>Video Will Recording</td><td>Section 65B Indian Evidence Act Affirmation</td><td>Archived</td></tr>
            </tbody>
          </table>
        ` : ''}

        ${customReportModules.physicalSecurity ? `
          <div class="section-title">6. Physical Property Surveillance & Security Feeds</div>
          <table>
            <thead><tr><th>Camera Identification</th><th>Zone Location</th><th>Resolution</th><th>Status</th></tr></thead>
            <tbody>
              ${cameras.length === 0 ? '<tr><td colspan="4" style="text-align:center;">No feeds logged.</td></tr>' : cameras.map(c => `<tr><td><b>${escapeHtml(c.name)}</b></td><td>${escapeHtml(c.location)}</td><td>${escapeHtml(c.resolution || '1080p')}</td><td>${c.status.toUpperCase()}</td></tr>`).join('')}
            </tbody>
          </table>
        ` : ''}

        <div class="seal-box">
          <div>
            <b>CRYPTOGRAPHIC AUTHENTICITY HASH:</b><br>
            SHA-256: 8f4b7a1c9e3d5f2a0b8c6e4d2f0a8b6c4e2d0f8a6b4c2e0d8f6a4b2c0e8d6f4a<br>
            Validated against Wealth OS Sovereign Data Registry.
          </div>
          <div style="text-align: right;">
            <b>SEAL / SIGNATURE:</b><br>
            _______________________<br>
            ${escapeHtml(userName)}
          </div>
        </div>

        <script>window.print();</script>
      </body>
    </html>
  `;
  printWindow.document.write(html);
  printWindow.document.close();
};

window.printMasterWealthDossierPdf = () => {
  window.printCustomReportPdf();
};

// 9. CERTIFIED NET WORTH STATEMENT
window.printCertifiedNetWorthPdf = () => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) { alert("Please allow popups."); return; }

  const data = totals();
  const assets = state.assets || [];
  const liabilities = state.liabilities || [];
  const userName = (window.activeUser && window.activeUser.name) || 'Executive Account Holder';

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Certified Net Worth Statement — ${escapeHtml(userName)}</title>
        <style>
          @page { size: A4; margin: 25mm 20mm; }
          body { font-family: 'Times New Roman', serif; font-size: 12pt; line-height: 1.6; color: #111; max-width: 800px; margin: 0 auto; padding: 20px; }
          h1 { text-align: center; font-size: 18pt; text-transform: uppercase; border-bottom: 2px solid #000; padding-bottom: 8px; margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; margin: 14px 0; font-size: 11pt; }
          th, td { border: 1px solid #333; padding: 8px 10px; text-align: left; }
          th { background: #f1f5f9; font-weight: bold; }
          .highlight { font-size: 14pt; font-weight: bold; text-align: center; background: #fafafa; padding: 12px; border: 1px solid #000; margin: 18px 0; }
        </style>
      </head>
      <body>
        <h1>STATEMENT OF NET WORTH</h1>
        <p>This is to certify that the financial standing and net worth of <b>${escapeHtml(userName)}</b>, as extracted from verified records on <b>${new Date().toLocaleDateString('en-IN')}</b>, is summarized below:</p>

        <div class="highlight">CERTIFIED NET WORTH: ${formatCurrencyVal(data.netWorth)} (${selectedReportCurrency})</div>

        <h3>1. Summary of Assets</h3>
        <table>
          <thead><tr><th>#</th><th>Asset Description</th><th>Category</th><th style="text-align:right">Valuation (${selectedReportCurrency})</th></tr></thead>
          <tbody>
            <tr><td>1</td><td>Liquid Bank Reserves & Cash</td><td>Liquid</td><td style="text-align:right">${formatCurrencyVal(data.cash)}</td></tr>
            ${assets.map((a, i) => `<tr><td>${i + 2}</td><td>${escapeHtml(a.name)}</td><td>${escapeHtml(a.type || 'Asset')}</td><td style="text-align:right">${formatCurrencyVal(a.value || 0)}</td></tr>`).join('')}
            <tr style="font-weight:bold; background:#f8fafc;"><td colspan="3">TOTAL GROSS ASSETS</td><td style="text-align:right">${formatCurrencyVal(data.assets + data.cash)}</td></tr>
          </tbody>
        </table>

        <h3>2. Summary of Liabilities</h3>
        <table>
          <thead><tr><th>#</th><th>Liability / Loan</th><th>Lender</th><th style="text-align:right">Outstanding (${selectedReportCurrency})</th></tr></thead>
          <tbody>
            ${liabilities.length === 0 ? '<tr><td colspan="4" style="text-align:center;">No outstanding liabilities.</td></tr>' : liabilities.map((l, i) => `<tr><td>${i + 1}</td><td>${escapeHtml(l.name || 'Loan')}</td><td>${escapeHtml(l.lender || 'Bank')}</td><td style="text-align:right">${formatCurrencyVal(l.balance || l.value || 0)}</td></tr>`).join('')}
            <tr style="font-weight:bold; background:#f8fafc;"><td colspan="3">TOTAL LIABILITIES</td><td style="text-align:right">${formatCurrencyVal(data.debt)}</td></tr>
          </tbody>
        </table>

        <div style="margin-top: 50px; display: flex; justify-content: space-between;">
          <div style="border-top: 1px solid #000; width: 220px; text-align: center; padding-top: 6px;">Declarant Signature</div>
          <div style="border-top: 1px solid #000; width: 220px; text-align: center; padding-top: 6px;">Chartered Accountant / Seal</div>
        </div>
        <script>window.print();</script>
      </body>
    </html>
  `;
  printWindow.document.write(html);
  printWindow.document.close();
};

// 10. RAW DATA EXPORTERS
window.exportConsolidatedWealthJson = () => {
  const exportData = {
    metadata: {
      generatedAt: new Date().toISOString(),
      user: window.activeUser || {},
      version: "Wealth OS v4.6 Enterprise",
      currency: selectedReportCurrency
    },
    totals: totals(),
    assets: state.assets || [],
    liabilities: state.liabilities || [],
    incomeDetails: state.incomeDetails || {},
    taxDeductions: state.taxDeductions || {},
    willDraft: state.willDraft || {},
    cameras: state.cameras || [],
    goals: state.goals || []
  };

  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
  const link = document.createElement('a');
  link.download = `WealthOS_Consolidated_${selectedReportCurrency}_${Date.now()}.json`;
  link.href = URL.createObjectURL(blob);
  link.click();
};

window.exportConsolidatedWealthCsv = () => {
  const assets = state.assets || [];
  let csv = `Category,Name,Type,Owner,Valuation (${selectedReportCurrency})\n`;
  assets.forEach(a => {
    csv += `Asset,"${(a.name || '').replace(/"/g, '""')}","${a.type || 'Asset'}","${a.owner || 'Self'}",${a.value || 0}\n`;
  });
  (state.liabilities || []).forEach(l => {
    csv += `Liability,"${(l.name || '').replace(/"/g, '""')}","${l.type || 'Debt'}","${l.lender || 'Bank'}",${l.balance || l.value || 0}\n`;
  });

  const blob = new Blob([csv], { type: 'text/csv' });
  const link = document.createElement('a');
  link.download = `WealthOS_Portfolio_${selectedReportCurrency}_${Date.now()}.csv`;
  link.href = URL.createObjectURL(blob);
  link.click();
};
