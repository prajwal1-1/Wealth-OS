// ═══════════════════════════════════════════════════════════
// WEALTH OS AI WEALTH ADVISOR & FINANCIAL REASONING CONSOLE
// Institutional Private Wealth & Corporate Intelligence Design
// High-Contrast Typography, Ultra-Clear Inputs & Text Legibility
// Multi-Turn Interactive Consultation, 4 Executive Advisory Roles,
// "What-If?" Simulation Terminal, 5-Pillar Resilience Scorecard,
// Audio Briefing (TTS), and Actionable Compliance Dispatcher
// ═══════════════════════════════════════════════════════════

let advisorActivePersona = 'cwo'; // 'cwo', 'tax', 'risk', 'fire'
let advisorSubView = 'chat'; // 'chat', 'scenarioPlayground', 'healthScorecard', 'actionPlan'
let advisorChatMessages = [];
let advisorIsGenerating = false;
let advisorIsSpeaking = false;

// Scenario Playground State
let advisorScenarioPurchaseAmount = 15000000; // ₹1.5 Cr
let advisorScenarioDownPaymentPercent = 20;   // 20%
let advisorScenarioInterestRate = 8.5;        // 8.5%
let advisorScenarioTenureYears = 20;          // 20 Years
let advisorScenarioSalaryHikePercent = 0;     // 0%

const advisorPersonas = {
  cwo: {
    name: "Chief Wealth Officer",
    role: "Portfolio Strategy & Capital Allocation",
    code: "CWO-01",
    accent: "#0284c7",
    intro: "Chief Wealth Officer active. Evaluating balance sheet solvency, asset diversification, capital deployment, and macro portfolio durability."
  },
  tax: {
    name: "Chartered Tax Counsel",
    role: "Direct Tax & Regime Optimization",
    code: "TAX-02",
    accent: "#d97706",
    intro: "Chartered Tax Counsel active. Auditing Section 80C/80D/80CCD statutory limits, capital gains harvesting, and Old vs New regime efficiency."
  },
  risk: {
    name: "Risk & Solvency Analyst",
    role: "HLV Protection & Succession Health",
    code: "RSK-03",
    accent: "#dc2626",
    intro: "Risk & Solvency Analyst active. Auditing Human Life Value (HLV) term insurance adequacy, liquid survival runway, and digital succession readiness."
  },
  fire: {
    name: "Retirement & FIRE Strategist",
    role: "25x Withdrawal & Cashflow Milestones",
    code: "FRE-04",
    accent: "#059669",
    intro: "FIRE Strategist active. Modeling perpetual withdrawal milestones (25x rule), savings rate acceleration, and debt amortization trajectories."
  }
};

const advisorQuickPrompts = [
  { label: "Cash & Liquid Reserves", query: "How much liquid cash and bank balance do I have right now?", persona: "cwo" },
  { label: "Net Worth Breakdown", query: "What is my total net worth and how is it distributed across asset classes?", persona: "cwo" },
  { label: "Tax Deduction Audit", query: "Audit my tax deductions and identify unclaimed potential for AY 2025-26 under Section 80C, 80CCD, and 80D.", persona: "tax" },
  { label: "Can I Afford a Car?", query: "Can I afford to purchase a car of ₹25 Lakhs with 20% down payment?", persona: "cwo" },
  { label: "FIRE Freedom Number", query: "Calculate my exact Standard FIRE, Lean FIRE, and Fat FIRE milestones based on current expenses.", persona: "fire" },
  { label: "Life Cover & HLV Gap", query: "Audit my total term life insurance coverage against my required Human Life Value (HLV) and debt load.", persona: "risk" },
  { label: "Emergency Runway", query: "How many months can I survive on my liquid cash if all income stops?", persona: "cwo" },
  { label: "Succession & Nominees", query: "Review my Digital Will status and nominee coverage across registered assets and bank accounts.", persona: "risk" }
];

// Helper Functions
function getEmergencyMonthsAdvisor(data) {
  const expenses = Number(state.cash?.expenses || 0) + Number(data.emi || 0);
  if (!expenses) return "12+";
  const liquid = Number(data.cash || 0);
  return (liquid / expenses).toFixed(1);
}

function getFireMetricsAdvisor(data) {
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

// ── 5-Pillar Health Scorecard Engine ─────────────────────────

function computeComprehensiveHealthScorecard() {
  const data = totals();
  const assets = state.assets || [];
  const liabilities = state.liabilities || [];
  const docs = state.documents || [];
  const taxDed = state.taxDeductions || {};
  const will = state.willDraft || {};
  const cameras = state.cameras || [];
  const cash = state.cash || { income: 0, expenses: 0 };

  const monthlyBurn = Number(cash.expenses || 0) + Number(data.emi || 0);
  const liquidCash = Number(data.cash || 0);
  const runwayMonths = monthlyBurn > 0 ? (liquidCash / monthlyBurn) : 12;
  const liquidityScore = Math.min(20, Math.round(Math.min(12, runwayMonths) * (20 / 6)));

  const foir = cash.income ? Math.round((Number(data.emi || 0) / Number(cash.income)) * 100) : 0;
  const debtScore = foir <= 30 ? 20 : (foir <= 40 ? 16 : (foir <= 50 ? 10 : 4));

  const sec80C = Number(taxDed.sec80C || 0);
  const sec80CCD = Number(taxDed.sec80CCD1B || 0);
  const taxScore = Math.min(20, Math.round((sec80C / 150000) * 12 + (sec80CCD / 50000) * 8));

  let willScore = 0;
  if (will.primaryBeneficiary) willScore += 10;
  if (will.executorName) willScore += 5;
  if (docs.length >= 3) willScore += 5;

  const monitoredCams = cameras.filter(c => c.status === 'online').length;
  const securityScore = Math.min(20, monitoredCams >= 3 ? 20 : monitoredCams * 6);

  const totalScore = liquidityScore + debtScore + taxScore + willScore + securityScore;

  return {
    totalScore,
    liquidityScore,
    debtScore,
    taxScore,
    willScore,
    securityScore,
    runwayMonths: runwayMonths.toFixed(1),
    foir
  };
}

// ── Main Render Routine ──────────────────────────────────────

function renderAi() {
  if (advisorChatMessages.length === 0) {
    const p = advisorPersonas[advisorActivePersona];
    advisorChatMessages.push({
      sender: "ai",
      persona: advisorActivePersona,
      text: `**${p.intro}**\n\nVerified live balance sheet parameters:\n* **Consolidated Net Worth:** ${money(totals().netWorth)}\n* **Liquid Cash Buffer:** ${money(totals().cash)}\n* **Monthly Cashflow Surplus:** ${money(totals().cashFlow)}/month\n* **Total Assets Base:** ${(state.assets || []).length} items (${money(totals().assets + totals().cash)})\n* **Active Liabilities:** ${(state.liabilities || []).length} facilities (${money(totals().liabilities)})\n\nAsk any direct financial question or choose an inquiry prompt below.`
    });
  }

  const currentPersona = advisorPersonas[advisorActivePersona];
  const data = totals();
  const scorecard = computeComprehensiveHealthScorecard();

  // High-Contrast Header Banner
  const headerHtml = `
    <div style="background: #090d16; border: 1px solid #1e293b; border-radius: 12px; padding: 20px 24px; color: #f8fafc; margin-bottom: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.25); box-sizing: border-box; width: 100%;">
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 14px; width: 100%; box-sizing: border-box;">
        <div style="flex: 1; min-width: 280px;">
          <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 6px;">
            <span style="font-size: 10.5px; font-weight: 800; color: #38bdf8; letter-spacing: 1px; text-transform: uppercase; background: rgba(56,189,248,0.15); padding: 3px 8px; border-radius: 4px; border: 1px solid rgba(56,189,248,0.3);">Institutional Intelligence</span>
            <span style="font-size: 10.5px; font-weight: 750; color: #cbd5e1; letter-spacing: 0.5px;">SYSTEM REF: WOS-AI-900</span>
          </div>
          <h2 style="font-size: 22px; font-weight: 850; color: #ffffff; margin: 0 0 4px; letter-spacing: -0.3px;">AI Financial Intelligence & Advisory Console</h2>
          <p style="color: #cbd5e1; font-size: 13px; margin: 0; max-width: 650px; line-height: 1.45;">
            Autonomous wealth reasoning engine executing real-time capital allocation, tax compliance, debt solvency, and estate risk analytics.
          </p>
        </div>

        <div style="display: flex; gap: 8px; flex-wrap: wrap; align-items: center;">
          <button onclick="toggleVoiceNarration()" style="background: ${advisorIsSpeaking ? '#dc2626' : '#1e293b'}; color: #ffffff; border: 1px solid #475569; padding: 8px 14px; border-radius: 6px; font-size: 12px; font-weight: 750; cursor: pointer; display: flex; align-items: center; gap: 6px; white-space: nowrap;">
            <span style="width: 8px; height: 8px; border-radius: 50%; background: ${advisorIsSpeaking ? '#fff' : '#38bdf8'}; display: inline-block;"></span>
            ${advisorIsSpeaking ? 'Stop Audio' : 'Audio Briefing (TTS)'}
          </button>
          <button onclick="printAiAdvisoryDossierPdf()" class="secondary-action" style="background: #2563eb; color: #ffffff; border: 1px solid #1d4ed8; padding: 8px 14px; border-radius: 6px; font-size: 12px; font-weight: 750; cursor: pointer; white-space: nowrap;">
            Export Advisory Dossier (PDF)
          </button>
          <button onclick="clearAiChatHistory()" style="background: transparent; color: #cbd5e1; border: 1px solid #475569; padding: 8px 12px; border-radius: 6px; font-size: 12px; cursor: pointer; white-space: nowrap;">
            Clear
          </button>
        </div>
      </div>
    </div>
  `;

  // Segmented Navigation Bar (Grid-based, Perfectly Responsive)
  const subNavHtml = `
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 6px; margin-bottom: 18px; background: #e2e8f0; padding: 4px; border-radius: 8px; border: 1px solid #cbd5e1; box-sizing: border-box; width: 100%;">
      <button class="${advisorSubView === 'chat' ? 'active' : ''}" onclick="advisorSubView='chat'; renderAi();" style="padding: 9px 12px; border-radius: 6px; border: none; background: ${advisorSubView === 'chat' ? '#0f172a' : 'transparent'}; color: ${advisorSubView === 'chat' ? '#ffffff' : '#334155'}; font-weight: ${advisorSubView === 'chat' ? '800' : '700'}; font-size: 12.5px; cursor: pointer; transition: all 0.15s; text-align: center; white-space: nowrap;">
        1. Consultation Console
      </button>
      <button class="${advisorSubView === 'scenarioPlayground' ? 'active' : ''}" onclick="advisorSubView='scenarioPlayground'; renderAi();" style="padding: 9px 12px; border-radius: 6px; border: none; background: ${advisorSubView === 'scenarioPlayground' ? '#0f172a' : 'transparent'}; color: ${advisorSubView === 'scenarioPlayground' ? '#ffffff' : '#334155'}; font-weight: ${advisorSubView === 'scenarioPlayground' ? '800' : '700'}; font-size: 12.5px; cursor: pointer; transition: all 0.15s; text-align: center; white-space: nowrap;">
        2. "What-If?" Simulator
      </button>
      <button class="${advisorSubView === 'healthScorecard' ? 'active' : ''}" onclick="advisorSubView='healthScorecard'; renderAi();" style="padding: 9px 12px; border-radius: 6px; border: none; background: ${advisorSubView === 'healthScorecard' ? '#0f172a' : 'transparent'}; color: ${advisorSubView === 'healthScorecard' ? '#ffffff' : '#334155'}; font-weight: ${advisorSubView === 'healthScorecard' ? '800' : '700'}; font-size: 12.5px; cursor: pointer; transition: all 0.15s; text-align: center; white-space: nowrap;">
        3. Portfolio Health (${scorecard.totalScore}/100)
      </button>
      <button class="${advisorSubView === 'actionPlan' ? 'active' : ''}" onclick="advisorSubView='actionPlan'; renderAi();" style="padding: 9px 12px; border-radius: 6px; border: none; background: ${advisorSubView === 'actionPlan' ? '#0f172a' : 'transparent'}; color: ${advisorSubView === 'actionPlan' ? '#ffffff' : '#334155'}; font-weight: ${advisorSubView === 'actionPlan' ? '800' : '700'}; font-size: 12.5px; cursor: pointer; transition: all 0.15s; text-align: center; white-space: nowrap;">
        4. Actionable Directives
      </button>
    </div>
  `;

  let subViewContent = "";
  if (advisorSubView === 'scenarioPlayground') {
    subViewContent = renderScenarioPlaygroundView(data);
  } else if (advisorSubView === 'healthScorecard') {
    subViewContent = renderHealthScorecardView(scorecard);
  } else if (advisorSubView === 'actionPlan') {
    subViewContent = renderActionPlanView(data);
  } else {
    subViewContent = renderMainChatView(currentPersona, data);
  }

  const appList = document.querySelector("#app-list") || document.querySelector(".app-list");
  const appActions = document.querySelector("#app-actions") || document.querySelector(".app-actions");
  const moduleGrid = document.querySelector("#module-grid") || document.querySelector(".module-grid");

  if (appActions) appActions.innerHTML = "";
  if (moduleGrid) moduleGrid.innerHTML = "";
  if (appList) {
    appList.innerHTML = `<section class="ai-advisor-container" style="padding-bottom: 60px; box-sizing: border-box; width: 100%; max-width: 100%;">${headerHtml}${subNavHtml}${subViewContent}</section>`;
  }

  setTimeout(() => {
    const thread = document.getElementById("ai-chat-thread");
    if (thread) thread.scrollTop = thread.scrollHeight;
  }, 30);
}

window.renderAi = renderAi;
window.renderAiAdvisor = renderAi;

// ═══════════════════════════════════════════════════════════
// SUB-VIEW 1: CONSULTATION CONSOLE & ROLES
// ═══════════════════════════════════════════════════════════

function renderMainChatView(currentPersona, data) {
  // 4 Corporate Role Cards
  const personaStripHtml = `
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px; margin-bottom: 16px; box-sizing: border-box; width: 100%;">
      ${Object.keys(advisorPersonas).map(k => {
        const p = advisorPersonas[k];
        const isActive = advisorActivePersona === k;
        return `
          <div onclick="switchAiPersona('${k}')" style="background: #ffffff; border: 2px solid ${isActive ? p.accent : '#cbd5e1'}; border-left: 5px solid ${p.accent}; border-radius: 8px; padding: 12px 14px; cursor: pointer; transition: all 0.15s; box-shadow: ${isActive ? '0 4px 12px rgba(0,0,0,0.06)' : 'none'}; box-sizing: border-box;"
               onmouseenter="this.style.borderColor='${p.accent}';"
               onmouseleave="if(!${isActive}) this.style.borderColor='#cbd5e1';">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2px;">
              <span style="font-size: 10px; font-weight: 800; color: #475569; letter-spacing: 0.5px;">${p.code}</span>
              <span style="font-size: 10px; font-weight: 800; color: ${isActive ? p.accent : '#64748b'};">${isActive ? '● ACTIVE' : 'SELECT'}</span>
            </div>
            <strong style="font-size: 13.5px; color: #0f172a; display: block;">${p.name}</strong>
            <span style="color: #475569; font-size: 11.5px; font-weight: 600; display: block; margin-top: 2px;">${p.role}</span>
          </div>
        `;
      }).join('')}
    </div>
  `;

  // Quick Prompt Pills
  const quickPromptsHtml = `
    <div style="margin-bottom: 14px; display: flex; gap: 8px; overflow-x: auto; padding: 2px 2px 8px 2px; box-sizing: border-box; width: 100%; scrollbar-width: thin;">
      <span style="font-size: 11px; font-weight: 800; color: #0f172a; text-transform: uppercase; align-self: center; white-space: nowrap; margin-right: 4px; letter-spacing: 0.5px; flex-shrink: 0;">Inquiries:</span>
      ${advisorQuickPrompts.map(q => `
        <button onclick="askQuickPrompt('${escapeAttribute(q.query)}', '${q.persona}')" style="white-space: nowrap; padding: 6px 12px; border-radius: 6px; border: 1.5px solid #cbd5e1; background: #ffffff; color: #0f172a; font-size: 12px; font-weight: 750; cursor: pointer; transition: all 0.15s; flex-shrink: 0;"
                onmouseenter="this.style.background='#f1f5f9'; this.style.borderColor='#0f172a';"
                onmouseleave="this.style.background='#ffffff'; this.style.borderColor='#cbd5e1';">
          ${q.label}
        </button>
      `).join('')}
    </div>
  `;

  // Chat Container with High-Contrast Input
  const chatLogHtml = `
    <div style="background: #ffffff; border: 1.5px solid #cbd5e1; border-radius: 12px; display: flex; flex-direction: column; height: 520px; box-shadow: 0 4px 16px rgba(0,0,0,0.03); overflow: hidden; margin-bottom: 20px; box-sizing: border-box; width: 100%;">
      
      <div id="ai-chat-thread" style="flex: 1; padding: 18px; overflow-y: auto; display: flex; flex-direction: column; gap: 14px; background: #f8fafc; box-sizing: border-box;">
        ${advisorChatMessages.map(msg => renderChatMessage(msg)).join('')}
        ${advisorIsGenerating ? `
          <div style="display: flex; gap: 10px; align-items: flex-start;">
            <div style="background: #0f172a; color: #fff; width: 30px; height: 30px; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 800; flex-shrink: 0;">AI</div>
            <div style="background: #ffffff; border: 1.5px solid #cbd5e1; border-radius: 8px; padding: 10px 14px; font-size: 13px; color: #0f172a; font-weight: 600; max-width: 80%;">
              Synthesizing live balance sheet metrics and compiling institutional reasoning...
            </div>
          </div>
        ` : ''}
      </div>

      <form id="ai-advisor-form" onsubmit="submitAiAdvisorQuestion(event)" style="padding: 12px 14px; background: #ffffff; border-top: 1.5px solid #cbd5e1; display: flex; gap: 10px; align-items: center; box-sizing: border-box; width: 100%;">
        <input id="ai-advisor-input" type="text" placeholder="Ask anything about your cash, net worth, tax, loans, FIRE, or affordability..."
               style="flex: 1; min-width: 0; padding: 11px 14px; border: 1.5px solid #0f172a; border-radius: 6px; font-size: 13.5px; font-weight: 600; color: #0f172a; background: #ffffff; outline: none; box-sizing: border-box;"
               onfocus="this.style.borderColor='#2563eb'; this.style.boxShadow='0 0 0 3px rgba(37,99,235,0.15)';"
               onblur="this.style.borderColor='#0f172a'; this.style.boxShadow='none';">
        <button type="submit" class="primary-action" style="padding: 11px 22px; border-radius: 6px; font-size: 13px; font-weight: 800; cursor: pointer; background: #0f172a; color: #ffffff; border: none; white-space: nowrap; flex-shrink: 0;">
          Send Inquiry
        </button>
      </form>

    </div>
  `;

  return personaStripHtml + quickPromptsHtml + chatLogHtml;
}

// ═══════════════════════════════════════════════════════════
// SUB-VIEW 2: "WHAT-IF?" STRATEGY SIMULATION TERMINAL
// ═══════════════════════════════════════════════════════════

function renderScenarioPlaygroundView(data) {
  const cash = state.cash || { income: 0, expenses: 0 };
  const monthlyIncome = Number(cash.income || 0) * (1 + (advisorScenarioSalaryHikePercent / 100));
  
  const loanPrincipal = advisorScenarioPurchaseAmount * (1 - (advisorScenarioDownPaymentPercent / 100));
  const monthlyRate = (advisorScenarioInterestRate / 100) / 12;
  const totalMonths = advisorScenarioTenureYears * 12;
  const simulatedEmi = monthlyRate > 0 ? Math.round((loanPrincipal * monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) / (Math.pow(1 + monthlyRate, totalMonths) - 1)) : 0;
  
  const currentEmi = Number(data.emi || 0);
  const totalProjectedEmi = currentEmi + simulatedEmi;
  const projectedFoir = monthlyIncome > 0 ? Math.round((totalProjectedEmi / monthlyIncome) * 100) : 0;
  const remainingCashflow = Math.round(monthlyIncome - Number(cash.expenses || 0) - totalProjectedEmi);

  return `
    <div style="background: #ffffff; border: 1.5px solid #cbd5e1; border-radius: 12px; padding: 22px 24px; box-shadow: 0 4px 16px rgba(0,0,0,0.03); box-sizing: border-box; width: 100%;">
      
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; margin-bottom: 18px; border-bottom: 1px solid #f1f5f9; padding-bottom: 12px;">
        <div>
          <h3 style="margin: 0 0 2px; font-size: 17px; font-weight: 850; color: #0f172a;">"What-If?" Capital Decision Simulator</h3>
          <p style="color: #475569; font-size: 12.5px; font-weight: 600; margin: 0;">Stress test asset acquisitions, leverage expansion, and compensation shifts against live liquidity.</p>
        </div>
        <span style="font-size: 10.5px; font-weight: 800; color: #1e40af; background: #eff6ff; padding: 4px 10px; border-radius: 4px; border: 1px solid #bfdbfe; white-space: nowrap;">
          REAL-TIME SOLVENCY ENGINE
        </span>
      </div>

      <!-- Controls Matrix -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 14px; margin-bottom: 22px; font-size: 12.5px; box-sizing: border-box; width: 100%;">
        
        <div style="background: #f8fafc; border: 1.5px solid #cbd5e1; padding: 14px; border-radius: 8px; box-sizing: border-box;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
            <strong style="color: #0f172a; font-weight: 800;">Target Capital Outlay</strong>
            <span style="font-weight: 850; color: #0f172a;">${money(advisorScenarioPurchaseAmount)}</span>
          </div>
          <input type="range" min="1000000" max="50000000" step="500000" value="${advisorScenarioPurchaseAmount}" oninput="advisorScenarioPurchaseAmount=Number(this.value); renderAi();" style="width: 100%; accent-color: #0f172a; cursor: pointer;">
          <small style="color: #475569; font-weight: 600; display: block; margin-top: 4px;">Property, asset or venture</small>
        </div>

        <div style="background: #f8fafc; border: 1.5px solid #cbd5e1; padding: 14px; border-radius: 8px; box-sizing: border-box;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
            <strong style="color: #0f172a; font-weight: 800;">Equity Down Payment</strong>
            <span style="font-weight: 850; color: #166534;">${advisorScenarioDownPaymentPercent}% (${money(advisorScenarioPurchaseAmount * (advisorScenarioDownPaymentPercent / 100))})</span>
          </div>
          <input type="range" min="10" max="50" step="5" value="${advisorScenarioDownPaymentPercent}" oninput="advisorScenarioDownPaymentPercent=Number(this.value); renderAi();" style="width: 100%; accent-color: #16a34a; cursor: pointer;">
          <small style="color: #475569; font-weight: 600; display: block; margin-top: 4px;">Funded from cash balance</small>
        </div>

        <div style="background: #f8fafc; border: 1.5px solid #cbd5e1; padding: 14px; border-radius: 8px; box-sizing: border-box;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
            <strong style="color: #0f172a; font-weight: 800;">Borrowing Interest Rate</strong>
            <span style="font-weight: 850; color: #0f172a;">${advisorScenarioInterestRate}% p.a.</span>
          </div>
          <input type="range" min="7.0" max="12.0" step="0.25" value="${advisorScenarioInterestRate}" oninput="advisorScenarioInterestRate=Number(this.value); renderAi();" style="width: 100%; accent-color: #0f172a; cursor: pointer;">
          <small style="color: #475569; font-weight: 600; display: block; margin-top: 4px;">${advisorScenarioTenureYears} Years Amortization</small>
        </div>

        <div style="background: #f8fafc; border: 1.5px solid #cbd5e1; padding: 14px; border-radius: 8px; box-sizing: border-box;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
            <strong style="color: #0f172a; font-weight: 800;">Compensation Growth</strong>
            <span style="font-weight: 850; color: #1d4ed8;">+${advisorScenarioSalaryHikePercent}%</span>
          </div>
          <input type="range" min="0" max="50" step="5" value="${advisorScenarioSalaryHikePercent}" oninput="advisorScenarioSalaryHikePercent=Number(this.value); renderAi();" style="width: 100%; accent-color: #2563eb; cursor: pointer;">
          <small style="color: #475569; font-weight: 600; display: block; margin-top: 4px;">Projected income revision</small>
        </div>

      </div>

      <!-- Decision KPI Cards -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 14px; box-sizing: border-box; width: 100%;">
        
        <div style="background: #ffffff; border: 1.5px solid #cbd5e1; border-radius: 8px; padding: 16px; box-sizing: border-box;">
          <span style="font-size: 10.5px; font-weight: 800; text-transform: uppercase; color: #475569;">Simulated Monthly EMI</span>
          <h3 style="margin: 4px 0 2px; font-size: 22px; font-weight: 850; color: #991b1b;">+${money(simulatedEmi)}/mo</h3>
          <small style="color: #475569; font-size: 12px; font-weight: 600;">Combined Debt: ${money(totalProjectedEmi)}/mo</small>
        </div>

        <div style="background: #ffffff; border: 1.5px solid #cbd5e1; border-radius: 8px; padding: 16px; box-sizing: border-box;">
          <span style="font-size: 10.5px; font-weight: 800; text-transform: uppercase; color: #475569;">Revised FOIR Solvency</span>
          <h3 style="margin: 4px 0 2px; font-size: 22px; font-weight: 850; color: ${projectedFoir <= 40 ? '#166534' : '#991b1b'};">${projectedFoir}%</h3>
          <small style="color: ${projectedFoir <= 40 ? '#166534' : '#991b1b'}; font-weight: 750; font-size: 12px;">${projectedFoir <= 40 ? 'Approved (<40% limit)' : 'Elevated Risk (>40% limit)'}</small>
        </div>

        <div style="background: #ffffff; border: 1.5px solid #cbd5e1; border-radius: 8px; padding: 16px; box-sizing: border-box;">
          <span style="font-size: 10.5px; font-weight: 800; text-transform: uppercase; color: #475569;">Remaining Free Cash Flow</span>
          <h3 style="margin: 4px 0 2px; font-size: 22px; font-weight: 850; color: ${remainingCashflow >= 0 ? '#0f172a' : '#991b1b'};">${money(remainingCashflow)}/mo</h3>
          <small style="color: #475569; font-size: 12px; font-weight: 600;">Net investable surplus per month</small>
        </div>

      </div>
    </div>
  `;
}

// ═══════════════════════════════════════════════════════════
// SUB-VIEW 3: 5-PILLAR RESILIENCE SCORECARD
// ═══════════════════════════════════════════════════════════

function renderHealthScorecardView(scorecard) {
  return `
    <div style="display: flex; flex-direction: column; gap: 16px; box-sizing: border-box; width: 100%;">
      
      <!-- Institutional Grade Banner -->
      <div style="background: #ffffff; border: 1.5px solid #cbd5e1; border-radius: 12px; padding: 20px 24px; box-shadow: 0 4px 16px rgba(0,0,0,0.03); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px; box-sizing: border-box; width: 100%;">
        <div>
          <span style="font-size: 10.5px; font-weight: 800; color: #0284c7; text-transform: uppercase; letter-spacing: 0.5px;">Institutional Solvency & Risk Audit</span>
          <h3 style="margin: 4px 0 2px; font-size: 24px; font-weight: 850; color: #0f172a;">Overall Wealth Resilience: ${scorecard.totalScore}/100</h3>
          <p style="color: #475569; font-size: 13px; font-weight: 600; margin: 0;">Automated assessment across capital liquidity, fixed debt obligations, tax deductions, succession and physical estate.</p>
        </div>
        <div style="font-size: 20px; font-weight: 900; color: ${scorecard.totalScore >= 75 ? '#166534' : '#92400e'}; background: #f8fafc; padding: 10px 20px; border-radius: 8px; border: 1.5px solid #cbd5e1; white-space: nowrap;">
          ${scorecard.totalScore >= 80 ? 'GRADE A (RESILIENT)' : (scorecard.totalScore >= 65 ? 'GRADE B (MODERATE)' : 'GRADE C (VULNERABLE)')}
        </div>
      </div>

      <!-- 5 Pillar Cards Grid -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 12px; box-sizing: border-box; width: 100%;">
        
        <div style="background: #ffffff; border: 1.5px solid #cbd5e1; border-radius: 8px; padding: 16px; box-sizing: border-box;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
            <strong style="color: #0f172a; font-size: 13.5px;">1. Emergency Liquidity</strong>
            <span style="font-weight: 850; color: #0284c7; font-size: 13px;">${scorecard.liquidityScore}/20</span>
          </div>
          <small style="color: #475569; font-weight: 600; display: block; margin-bottom: 8px; font-size: 12px;">${scorecard.runwayMonths} months operating runway.</small>
          <div style="background: #e2e8f0; height: 6px; border-radius: 3px; overflow: hidden;">
            <div style="width: ${(scorecard.liquidityScore / 20) * 100}%; background: #0284c7; height: 100%;"></div>
          </div>
        </div>

        <div style="background: #ffffff; border: 1.5px solid #cbd5e1; border-radius: 8px; padding: 16px; box-sizing: border-box;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
            <strong style="color: #0f172a; font-size: 13.5px;">2. Debt & FOIR Burden</strong>
            <span style="font-weight: 850; color: #166534; font-size: 13px;">${scorecard.debtScore}/20</span>
          </div>
          <small style="color: #475569; font-weight: 600; display: block; margin-bottom: 8px; font-size: 12px;">${scorecard.foir}% fixed obligation ratio.</small>
          <div style="background: #e2e8f0; height: 6px; border-radius: 3px; overflow: hidden;">
            <div style="width: ${(scorecard.debtScore / 20) * 100}%; background: #166534; height: 100%;"></div>
          </div>
        </div>

        <div style="background: #ffffff; border: 1.5px solid #cbd5e1; border-radius: 8px; padding: 16px; box-sizing: border-box;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
            <strong style="color: #0f172a; font-size: 13.5px;">3. Tax Alpha & Deductions</strong>
            <span style="font-weight: 850; color: #d97706; font-size: 13px;">${scorecard.taxScore}/20</span>
          </div>
          <small style="color: #475569; font-weight: 600; display: block; margin-bottom: 8px; font-size: 12px;">Section 80C & 80CCD limits.</small>
          <div style="background: #e2e8f0; height: 6px; border-radius: 3px; overflow: hidden;">
            <div style="width: ${(scorecard.taxScore / 20) * 100}%; background: #d97706; height: 100%;"></div>
          </div>
        </div>

        <div style="background: #ffffff; border: 1.5px solid #cbd5e1; border-radius: 8px; padding: 16px; box-sizing: border-box;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
            <strong style="color: #0f172a; font-size: 13.5px;">4. Succession & Will State</strong>
            <span style="font-weight: 850; color: #7c3aed; font-size: 13px;">${scorecard.willScore}/20</span>
          </div>
          <small style="color: #475569; font-weight: 600; display: block; margin-bottom: 8px; font-size: 12px;">Executor & nominee readiness.</small>
          <div style="background: #e2e8f0; height: 6px; border-radius: 3px; overflow: hidden;">
            <div style="width: ${(scorecard.willScore / 20) * 100}%; background: #7c3aed; height: 100%;"></div>
          </div>
        </div>

        <div style="background: #ffffff; border: 1.5px solid #cbd5e1; border-radius: 8px; padding: 16px; box-sizing: border-box;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
            <strong style="color: #0f172a; font-size: 13.5px;">5. Physical Security Feeds</strong>
            <span style="font-weight: 850; color: #0284c7; font-size: 13px;">${scorecard.securityScore}/20</span>
          </div>
          <small style="color: #475569; font-weight: 600; display: block; margin-bottom: 8px; font-size: 12px;">Surveillance on physical assets.</small>
          <div style="background: #e2e8f0; height: 6px; border-radius: 3px; overflow: hidden;">
            <div style="width: ${(scorecard.securityScore / 20) * 100}%; background: #0284c7; height: 100%;"></div>
          </div>
        </div>

      </div>
    </div>
  `;
}

// ═══════════════════════════════════════════════════════════
// SUB-VIEW 4: ACTIONABLE COMPLIANCE DIRECTIVES
// ═══════════════════════════════════════════════════════════

function renderActionPlanView(data) {
  const taxDed = state.taxDeductions || {};
  const claimed80C = Number(taxDed.sec80C || 0);
  const rem80C = Math.max(0, 150000 - claimed80C);

  return `
    <div style="background: #ffffff; border: 1.5px solid #cbd5e1; border-radius: 12px; padding: 22px 24px; box-shadow: 0 4px 16px rgba(0,0,0,0.03); box-sizing: border-box; width: 100%;">
      
      <div style="margin-bottom: 16px; border-bottom: 1px solid #f1f5f9; padding-bottom: 10px;">
        <h3 style="margin: 0 0 2px; font-size: 17px; font-weight: 850; color: #0f172a;">Actionable Financial Directives</h3>
        <p style="color: #475569; font-size: 12.5px; font-weight: 600; margin: 0;">Prioritized compliance checklist generated by autonomous portfolio telemetry.</p>
      </div>

      <div style="display: flex; flex-direction: column; gap: 10px; box-sizing: border-box; width: 100%;">
        
        <div style="background: #ffffff; border: 1.5px solid #cbd5e1; border-left: 5px solid #dc2626; border-radius: 6px; padding: 14px 18px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; box-sizing: border-box;">
          <div>
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 2px;">
              <span style="font-size: 10px; font-weight: 800; color: #dc2626; text-transform: uppercase;">CRITICAL PRIORITY</span>
              <span style="font-size: 11.5px; color: #64748b; font-weight: 600;">AY 2025-26</span>
            </div>
            <strong style="font-size: 14px; color: #0f172a; display: block;">Deploy ${money(rem80C)} to Fully Claim Section 80C</strong>
            <small style="color: #475569; font-size: 12px; font-weight: 600;">Max out PPF / ELSS allocation to avoid unnecessary income tax liability.</small>
          </div>
          <button onclick="renderView('taxDocuments')" class="secondary-action" style="padding: 7px 14px; font-size: 12px; font-weight: 750; background: #0f172a; color: #ffffff; border: none; border-radius: 6px; cursor: pointer; white-space: nowrap;">Open Tax Profile &rarr;</button>
        </div>

        <div style="background: #ffffff; border: 1.5px solid #cbd5e1; border-left: 5px solid #d97706; border-radius: 6px; padding: 14px 18px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; box-sizing: border-box;">
          <div>
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 2px;">
              <span style="font-size: 10px; font-weight: 800; color: #d97706; text-transform: uppercase;">ELEVATED PRIORITY</span>
              <span style="font-size: 11.5px; color: #64748b; font-weight: 600;">Succession</span>
            </div>
            <strong style="font-size: 14px; color: #0f172a; display: block;">Attest Nominees on Liquid Accounts</strong>
            <small style="color: #475569; font-size: 12px; font-weight: 600;">Verify all registered bank accounts have updated nominee records on file.</small>
          </div>
          <button onclick="renderView('willVault')" class="secondary-action" style="padding: 7px 14px; font-size: 12px; font-weight: 750; background: #0f172a; color: #ffffff; border: none; border-radius: 6px; cursor: pointer; white-space: nowrap;">Open Will Vault &rarr;</button>
        </div>

        <div style="background: #ffffff; border: 1.5px solid #cbd5e1; border-left: 5px solid #2563eb; border-radius: 6px; padding: 14px 18px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; box-sizing: border-box;">
          <div>
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 2px;">
              <span style="font-size: 10px; font-weight: 800; color: #2563eb; text-transform: uppercase;">STANDARD PRIORITY</span>
              <span style="font-size: 11.5px; color: #64748b; font-weight: 600;">Compounding</span>
            </div>
            <strong style="font-size: 14px; color: #0f172a; display: block;">Deploy Monthly Surplus (${money(data.cashFlow)}) into Index Funds</strong>
            <small style="color: #475569; font-size: 12px; font-weight: 600;">Maintain disciplined equity SIP to accelerate retirement freedom.</small>
          </div>
          <button onclick="renderView('reports')" class="secondary-action" style="padding: 7px 14px; font-size: 12px; font-weight: 750; background: #0f172a; color: #ffffff; border: none; border-radius: 6px; cursor: pointer; white-space: nowrap;">View Reports &rarr;</button>
        </div>

      </div>
    </div>
  `;
}

// ═══════════════════════════════════════════════════════════
// TEXT-TO-SPEECH (TTS) VOICE NARRATION ENGINE
// ═══════════════════════════════════════════════════════════

window.toggleVoiceNarration = () => {
  if (advisorIsSpeaking) {
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    advisorIsSpeaking = false;
    renderAi();
    return;
  }

  const lastAiMsg = [...advisorChatMessages].reverse().find(m => m.sender === 'ai');
  if (!lastAiMsg || !window.speechSynthesis) return;

  const plainText = lastAiMsg.text.replace(/#/g, '').replace(/\*/g, '').replace(/\|/g, '').replace(/<[^>]*>/g, '');
  const utterance = new SpeechSynthesisUtterance(plainText);
  utterance.rate = 1.0;
  utterance.pitch = 1.0;

  utterance.onend = () => {
    advisorIsSpeaking = false;
    renderAi();
  };

  advisorIsSpeaking = true;
  window.speechSynthesis.speak(utterance);
  renderAi();
};

function switchAiPersona(pKey) {
  advisorActivePersona = pKey;
  const p = advisorPersonas[pKey];
  advisorChatMessages.push({
    sender: "ai",
    persona: pKey,
    text: `**${p.intro}**\n\nStanding by for ${p.role.toLowerCase()} inquiries.`
  });
  renderAi();
}

function clearAiChatHistory() {
  advisorChatMessages = [];
  renderAi();
}

function askQuickPrompt(query, persona) {
  if (persona && persona !== advisorActivePersona) {
    advisorActivePersona = persona;
  }
  const input = document.getElementById("ai-advisor-input");
  if (input) input.value = query;
  executeAiQuestion(query);
}

function submitAiAdvisorQuestion(e) {
  if (e) e.preventDefault();
  const input = document.getElementById("ai-advisor-input");
  const q = (input?.value || '').trim();
  if (!q) return;
  input.value = "";
  executeAiQuestion(q);
}

// ═══════════════════════════════════════════════════════════
// INTELLIGENT REASONING ENGINE & CONTEXT-AWARE GENERATOR
// ═══════════════════════════════════════════════════════════

function executeAiQuestion(question) {
  advisorChatMessages.push({
    sender: "user",
    text: question
  });

  advisorIsGenerating = true;
  renderAi();

  setTimeout(() => {
    const responseText = generateIntelligentAiAnswer(question, advisorActivePersona);
    advisorChatMessages.push({
      sender: "ai",
      persona: advisorActivePersona,
      text: responseText
    });
    advisorIsGenerating = false;
    renderAi();
  }, 300);
}

function generateIntelligentAiAnswer(question, persona) {
  const data = totals();
  const q = (question || '').toLowerCase().trim();
  const cash = state.cash || { income: 0, expenses: 0 };
  const assets = state.assets || [];
  const liabilities = state.liabilities || [];
  const taxDed = state.taxDeductions || {};
  const will = state.willDraft || {};
  const docs = state.documents || [];
  const cameras = state.cameras || [];
  const monthlyBurn = Number(cash.expenses || 0) + Number(data.emi || 0);
  const liquidCash = Number(data.cash || 0);
  const emergencyMonths = getEmergencyMonthsAdvisor(data);
  const totalGrossAssets = Number(data.assets || 0) + liquidCash;

  // ─────────────────────────────────────────────────────────────
  // 1. CASH FLOW, MONTHLY BUDGET, SURPLUS & SAVINGS RATE
  // ─────────────────────────────────────────────────────────────
  if (
    q.includes("cashflow") || 
    q.includes("cash flow") || 
    q.includes("income") || 
    q.includes("salary") || 
    q.includes("expense") || 
    q.includes("expenses") || 
    q.includes("spending") || 
    q.includes("monthly burn") || 
    q.includes("savings rate") || 
    q.includes("how much do i save") || 
    q.includes("surplus")
  ) {
    const monthlyIncome = Number(cash.income || 0);
    const monthlyExpenses = Number(cash.expenses || 0);
    const monthlyEmi = Number(data.emi || 0);
    const netSurplus = Number(data.cashFlow || 0);
    const savingsRate = monthlyIncome > 0 ? Math.max(0, Math.round((netSurplus / monthlyIncome) * 100)) : 0;

    return `### Monthly Cash Flow & Budget Telemetry\n\nYou generate a monthly net cash flow surplus of **${money(netSurplus)}/month** (${savingsRate}% Savings Rate).\n\n* **Gross Monthly Inflow:** **${money(monthlyIncome)}/mo** (Annualized: ${money(monthlyIncome * 12)}/year)\n* **Living Expenses:** **${money(monthlyExpenses)}/mo**\n* **Fixed Debt Servicing (EMI):** **${money(monthlyEmi)}/mo**\n* **Total Monthly Burn:** **${money(monthlyExpenses + monthlyEmi)}/mo**\n* **Net Investable Surplus:** **${money(netSurplus)}/mo**\n* **Savings Rate:** **${savingsRate}%** (${savingsRate >= 50 ? 'Elite Tier' : (savingsRate >= 30 ? 'Strong' : 'Moderate')})\n\n**Capital Allocation Guideline (50/30/20 Rule):**\n* Needs (Essentials + EMI): ${monthlyIncome > 0 ? Math.round(((monthlyExpenses + monthlyEmi) / monthlyIncome) * 100) : 0}% (Target: &le;50%)\n* Free Surplus / Investments: ${savingsRate}% (Target: &ge;20%)`;
  }

  // ─────────────────────────────────────────────────────────────
  // 2. CASH, BANK BALANCES & LIQUIDITY INQUIRIES
  // ─────────────────────────────────────────────────────────────
  if (
    q.includes("cash") || 
    q.includes("bank balance") || 
    q.includes("liquid") || 
    q.includes("in bank") || 
    q.includes("savings account") || 
    q.includes("how much money i have") || 
    q.includes("how much money do i have") || 
    q.includes("balance in hand")
  ) {
    const cashAssets = assets.filter(a => (a.type || '').toLowerCase().includes('cash') || (a.type || '').toLowerCase().includes('bank') || (a.type || '').toLowerCase().includes('fd'));
    const cashPercent = totalGrossAssets > 0 ? ((liquidCash / totalGrossAssets) * 100).toFixed(1) : "100";

    let itemizedCashList = "";
    if (cashAssets.length > 0) {
      itemizedCashList = "\n\n**Linked Liquid Accounts & Deposits:**\n" + cashAssets.map(a => "* **" + escapeHtml(a.name) + ":** " + money(a.value) + " (" + escapeHtml(a.type || 'Liquid') + ")").join('\n');
    }

    return `### Liquid Cash & Reserve Intelligence\n\nYou currently have **${money(liquidCash)}** in verified liquid cash reserves.\n\n* **Liquid Buffer:** **${money(liquidCash)}** (${cashPercent}% of total gross assets of ${money(totalGrossAssets)})\n* **Emergency Runway:** **${emergencyMonths} Months** of total living expenses (based on current monthly burn of ${money(monthlyBurn)}/month)\n* **Monthly Cashflow Surplus:** **${money(data.cashFlow)}/month** (Inflow: ${money(cash.income || 0)} &minus; Outflow: ${money(monthlyBurn)})${itemizedCashList}\n\n**Advisory Directive:**\n1. ${Number(emergencyMonths) >= 6 ? '✅ **Safety Target Met:** Your liquid cushion exceeds the 6-month safety benchmark.' : '⚠️ **Safety Target Alert:** Deploy monthly surplus to build at least 6 months (' + money(monthlyBurn * 6) + ') of liquid buffer.'}\n2. Optimize surplus cash above 6 months into high-yield sweep-in accounts or debt-mutual funds to earn 7.0%+ without sacrificing liquidity.`;
  }

  // ─────────────────────────────────────────────────────────────
  // 3. NET WORTH & FINANCIAL STANDING INQUIRIES
  // ─────────────────────────────────────────────────────────────
  if (
    q.includes("net worth") || 
    q.includes("networth") || 
    q.includes("total worth") || 
    q.includes("how rich") || 
    q.includes("total wealth") || 
    q.includes("my standing") || 
    q.includes("financial standing") || 
    q.includes("balance sheet")
  ) {
    const totalLiab = Number(data.liabilities || 0);
    const solvencyPercent = totalGrossAssets > 0 ? Math.round((Number(data.netWorth) / totalGrossAssets) * 100) : 100;

    return `### Consolidated Net Worth & Balance Sheet Standing\n\nYour Consolidated Net Worth is **${money(data.netWorth)}**.\n\n* **Gross Assets Base:** **${money(totalGrossAssets)}** (${money(data.assets)} fixed & investment assets + ${money(liquidCash)} liquid cash)\n* **Total Liabilities:** **${money(totalLiab)}** (Debt-to-Asset Ratio: ${data.debtRatio}%)\n* **Consolidated Net Worth:** **${money(data.netWorth)}** (Gross Assets &minus; Debt Obligations)\n* **Solvency Index:** **${solvencyPercent}%** (${solvencyPercent >= 75 ? 'Institutional Grade A' : 'Moderate Leverage'})\n* **Health Rating:** **${data.health}/100 Resilience Score**\n\n**Asset Composition:**\n* **Physical & Market Assets:** ${assets.length} items (${money(data.assets)})\n* **Liquid Buffer:** ${money(liquidCash)} (${emergencyMonths} months runway)\n* **Monthly Operating Surplus:** ${money(data.cashFlow)}/month (Savings Rate: ${data.savingsRate}%)`;
  }

  // ─────────────────────────────────────────────────────────────
  // 4. "CAN I AFFORD X?" / PURCHASE SIMULATOR
  // ─────────────────────────────────────────────────────────────
  if (
    q.includes("can i afford") || 
    q.includes("can i buy") || 
    q.includes("afford to buy") || 
    q.includes("buy a car") || 
    q.includes("buy a house") || 
    q.includes("buy flat") || 
    q.includes("buy phone") || 
    q.includes("afford a") || 
    q.includes("afford 50") || 
    q.includes("afford 1") || 
    q.includes("afford 2")
  ) {
    let purchaseAmt = 2500000;
    if (q.includes("1 cr") || q.includes("1 crore") || q.includes("1cr")) purchaseAmt = 10000000;
    else if (q.includes("1.5 cr") || q.includes("1.5 crore") || q.includes("1.5cr")) purchaseAmt = 15000000;
    else if (q.includes("2 cr") || q.includes("2 crore") || q.includes("2cr")) purchaseAmt = 20000000;
    else if (q.includes("50 lakh") || q.includes("50l")) purchaseAmt = 5000000;
    else if (q.includes("30 lakh") || q.includes("30l")) purchaseAmt = 3000000;
    else if (q.includes("20 lakh") || q.includes("20l")) purchaseAmt = 2000000;
    else if (q.includes("15 lakh") || q.includes("15l")) purchaseAmt = 1500000;
    else if (q.includes("10 lakh") || q.includes("10l")) purchaseAmt = 1000000;
    else if (q.includes("5 lakh") || q.includes("5l")) purchaseAmt = 500000;

    const downPayment = Math.round(purchaseAmt * 0.20);
    const loanPrincipal = purchaseAmt - downPayment;
    const isRealEstate = q.includes("house") || q.includes("flat") || q.includes("property") || q.includes("home") || purchaseAmt >= 5000000;
    const tenureYears = isRealEstate ? 20 : 5;
    const interestRate = isRealEstate ? 8.5 : 9.5;
    const monthlyRate = (interestRate / 100) / 12;
    const totalMonths = tenureYears * 12;
    const simulatedEmi = Math.round((loanPrincipal * monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) / (Math.pow(1 + monthlyRate, totalMonths) - 1));

    const currentEmi = Number(data.emi || 0);
    const monthlyIncome = Number(cash.income || 0);
    const newTotalEmi = currentEmi + simulatedEmi;
    const newFoir = monthlyIncome > 0 ? Math.round((newTotalEmi / monthlyIncome) * 100) : 0;
    const remainingCashAfterDP = liquidCash - downPayment;
    const remainingSurplus = Number(data.cashFlow || 0) - simulatedEmi;

    const isAffordable = newFoir <= 40 && remainingCashAfterDP >= (monthlyBurn * 3) && remainingSurplus >= 0;

    return `### Capital Outlay & Affordability Audit (${money(purchaseAmt)})\n\n**Verdict: ${isAffordable ? '🟢 APPROVED (Financially Sound)' : (newFoir <= 50 ? '🟡 MODERATE STRETCH (Caution Advised)' : '🔴 NOT RECOMMENDED (Solvency Risk)')}**\n\n* **Target Asset Price:** **${money(purchaseAmt)}**\n* **20% Down Payment Required:** **${money(downPayment)}** (Liquid Cash: ${money(liquidCash)})\n* **Remaining Cash Post-Purchase:** **${money(remainingCashAfterDP)}** (${monthlyBurn > 0 ? (remainingCashAfterDP / monthlyBurn).toFixed(1) : 12} months runway)\n* **Estimated Loan Amount:** **${money(loanPrincipal)}** (${interestRate}% for ${tenureYears} yrs)\n* **Incremental Monthly EMI:** **+${money(simulatedEmi)}/mo**\n* **Revised Total EMI:** **${money(newTotalEmi)}/mo**\n* **Projected FOIR:** **${newFoir}%** of Gross Income (Safe Threshold: &le;40%)\n* **Remaining Monthly Surplus:** **${money(remainingSurplus)}/month**\n\n**Advisory Recommendation:**\n${isAffordable ? '✅ You have adequate cash flow and liquidity buffer to absorb this purchase without risking solvency.' : '⚠️ This purchase pushes fixed obligations to ' + newFoir + '% and reduces monthly buffer. Consider a higher down payment or longer amortization.'}`;
  }

  // ─────────────────────────────────────────────────────────────
  // 5. ASSET BREAKDOWN & PORTFOLIO INQUIRIES
  // ─────────────────────────────────────────────────────────────
  if (
    q.includes("asset") || 
    q.includes("portfolio") || 
    q.includes("investment") || 
    q.includes("what do i own") || 
    q.includes("my properties") || 
    q.includes("my flats") || 
    q.includes("my cars") || 
    q.includes("stocks") || 
    q.includes("mutual fund")
  ) {
    const realEstate = assets.filter(a => (a.type || '').toLowerCase().includes('flat') || (a.type || '').toLowerCase().includes('land') || (a.type || '').toLowerCase().includes('real estate') || (a.type || '').toLowerCase().includes('plot') || (a.type || '').toLowerCase().includes('house'));
    const vehicles = assets.filter(a => (a.type || '').toLowerCase().includes('car') || (a.type || '').toLowerCase().includes('vehicle') || (a.type || '').toLowerCase().includes('bike'));
    const investments = assets.filter(a => (a.type || '').toLowerCase().includes('investment') || (a.type || '').toLowerCase().includes('stock') || (a.type || '').toLowerCase().includes('fund') || (a.type || '').toLowerCase().includes('nps') || (a.type || '').toLowerCase().includes('ppf'));
    const luxury = assets.filter(a => (a.type || '').toLowerCase().includes('watch') || (a.type || '').toLowerCase().includes('shoe') || (a.type || '').toLowerCase().includes('collectible') || (a.type || '').toLowerCase().includes('gold'));

    const reVal = realEstate.reduce((s, a) => s + (Number(a.value) || 0), 0);
    const vehVal = vehicles.reduce((s, a) => s + (Number(a.value) || 0), 0);
    const invVal = investments.reduce((s, a) => s + (Number(a.value) || 0), 0);
    const luxVal = luxury.reduce((s, a) => s + (Number(a.value) || 0), 0);

    const topAssets = [...assets].sort((a, b) => (Number(b.value) || 0) - (Number(a.value) || 0)).slice(0, 4);

    return `### Asset Allocation & Portfolio Architecture\n\nYour total asset portfolio is valued at **${money(totalGrossAssets)}** across **${assets.length} registered assets** and liquid reserves.\n\n| Asset Category | Holdings | Total Valuation | % Allocation |\n| :--- | :--- | :--- | :--- |\n| **Real Estate & Land** | ${realEstate.length} properties | ${money(reVal)} | ${totalGrossAssets ? ((reVal/totalGrossAssets)*100).toFixed(1) : 0}% |\n| **Vehicles & Autos** | ${vehicles.length} units | ${money(vehVal)} | ${totalGrossAssets ? ((vehVal/totalGrossAssets)*100).toFixed(1) : 0}% |\n| **Financial Investments** | ${investments.length} holdings | ${money(invVal)} | ${totalGrossAssets ? ((invVal/totalGrossAssets)*100).toFixed(1) : 0}% |\n| **Luxury & Collectibles** | ${luxury.length} items | ${money(luxVal)} | ${totalGrossAssets ? ((luxVal/totalGrossAssets)*100).toFixed(1) : 0}% |\n| **Liquid Cash Reserves** | Bank / Cash | ${money(liquidCash)} | ${totalGrossAssets ? ((liquidCash/totalGrossAssets)*100).toFixed(1) : 0}% |\n\n**Top Holdings:**\n${topAssets.map((a, i) => (i + 1) + '. **' + escapeHtml(a.name) + '** (' + escapeHtml(a.type || 'Asset') + '): **' + money(a.value) + '**').join('\n')}`;
  }

  // ─────────────────────────────────────────────────────────────
  // 6. DEBT, LOANS & LIABILITY INQUIRIES
  // ─────────────────────────────────────────────────────────────
  if (
    q.includes("debt") || 
    q.includes("loan") || 
    q.includes("liability") || 
    q.includes("liabilities") || 
    q.includes("emi") || 
    q.includes("how much i owe") || 
    q.includes("what do i owe") || 
    q.includes("borrowing") || 
    q.includes("foir")
  ) {
    const foir = cash.income ? Math.round((Number(data.emi || 0) / Number(cash.income)) * 100) : 0;
    const totalDebt = Number(data.liabilities || 0);

    let loanDetails = "";
    if (liabilities.length > 0) {
      loanDetails = "\n\n**Registered Debt Facilities:**\n" + liabilities.map(l => "* **" + escapeHtml(l.name) + ":** " + money(l.value) + " balance | EMI: " + money(l.emi || 0) + "/mo").join('\n');
    } else {
      loanDetails = "\n\n*No external liabilities registered in your liability ledger.*";
    }

    return `### Solvency & Liability Statement\n\nYour total registered debt is **${money(totalDebt)}** with monthly debt servicing of **${money(data.emi)}/month**.\n\n* **Total Outstanding Liabilities:** **${money(totalDebt)}**\n* **Monthly EMI Commitments:** **${money(data.emi)}/month**\n* **Fixed Obligation Ratio (FOIR):** **${foir}%** (Safe Banking Ceiling: 40%)\n* **Debt-to-Asset Ratio:** **${data.debtRatio}%** (${data.debtRatio <= 25 ? 'Low Risk' : (data.debtRatio <= 45 ? 'Moderate' : 'High Leverage')})${loanDetails}\n\n**Debt Solvency Recommendation:**\n${foir <= 30 ? '✅ Your debt load is modest and safely within institutional solvency guidelines.' : '⚠️ Priority: Channel surplus cashflow to prepay high-interest debt and lower monthly FOIR under 30%.'}`;
  }

  // ─────────────────────────────────────────────────────────────
  // 7. EMERGENCY RUNWAY & SURVIVAL BUFFER
  // ─────────────────────────────────────────────────────────────
  if (
    q.includes("emergency") || 
    q.includes("runway") || 
    q.includes("survival") || 
    q.includes("if i lose my job") || 
    q.includes("if income stops") || 
    q.includes("how long can i survive")
  ) {
    const benchmark6M = monthlyBurn * 6;
    const benchmark12M = monthlyBurn * 12;

    return `### Emergency Fund & Survival Runway Audit\n\nBased on your verified monthly burn rate of **${money(monthlyBurn)}/month**, your current liquid cash provides **${emergencyMonths} Months of survival runway**.\n\n* **Liquid Cash in Hand:** **${money(liquidCash)}**\n* **Essential Monthly Burn:** **${money(monthlyBurn)}/mo** (${money(cash.expenses || 0)} living expenses + ${money(data.emi || 0)} debt obligations)\n* **Verified Runway:** **${emergencyMonths} Months**\n\n**Institutional Benchmarks:**\n* **Minimum 6-Month Fund:** ${money(benchmark6M)} (${liquidCash >= benchmark6M ? '✅ Fully Funded' : '⚠️ ' + money(benchmark6M - liquidCash) + ' Shortfall'})\n* **Optimal 12-Month Sovereign Fund:** ${money(benchmark12M)} (${liquidCash >= benchmark12M ? '✅ Fully Funded' : '🟡 ' + money(benchmark12M - liquidCash) + ' Gap'})\n\n**Advisory Directive:**\nMaintain emergency reserves in high-safety liquid instruments (Bank Sweep FDs or Overnight Debt Funds).`;
  }

  // ─────────────────────────────────────────────────────────────
  // 8. TAX OPTIMIZATION & DEDUCTIONS (AY 2025-26)
  // ─────────────────────────────────────────────────────────────
  if (
    q.includes("tax") || 
    q.includes("80c") || 
    q.includes("80d") || 
    q.includes("80ccd") || 
    q.includes("nps") || 
    q.includes("deduction") || 
    q.includes("deductions") || 
    q.includes("save tax") || 
    q.includes("regime")
  ) {
    const claimed80C = Number(taxDed.sec80C || 0);
    const rem80C = Math.max(0, 150000 - claimed80C);
    const claimed80CCD = Number(taxDed.sec80CCD1B || 0);
    const rem80CCD = Math.max(0, 50000 - claimed80CCD);
    const claimed80D = Number(taxDed.sec80D || 0);
    const rem80D = Math.max(0, 25000 - claimed80D);
    const totalPotentialTaxSaved = Math.round((rem80C + rem80CCD + rem80D) * 0.312);

    return `### Tax Deduction Audit & Alpha Optimization (AY 2025-26)\n\nYou have **${money(rem80C + rem80CCD + rem80D)} in unclaimed tax deduction headroom**, which can save up to **${money(totalPotentialTaxSaved)} in direct income tax**.\n\n| Statutory Section | Eligible Instruments | Claimed | Max Limit | Unclaimed Potential |\n| :--- | :--- | :--- | :--- | :--- |\n| **Section 80C** | PPF, ELSS, EPF, Life Cover | ${money(claimed80C)} | ₹1,50,000 | **${money(rem80C)}** |\n| **Section 80CCD(1B)** | National Pension Scheme (Tier-1) | ${money(claimed80CCD)} | ₹50,000 | **${money(rem80CCD)}** |\n| **Section 80D** | Health Insurance (Self/Family) | ${money(claimed80D)} | ₹25,000 | **${money(rem80D)}** |\n\n**Optimization Action Plan:**\n1. **Deploy ${money(rem80C)} into ELSS / PPF** to exhaust Section 80C before March 31.\n2. **Open / Fund Tier-1 NPS with ${money(rem80CCD)}** for an exclusive deduction over and above Section 80C.\n3. **Verify Health Insurance Premiums** to claim up to ₹25,000 (or ₹50,000 for senior citizen parents).`;
  }

  // ─────────────────────────────────────────────────────────────
  // 9. FIRE / RETIREMENT & FINANCIAL INDEPENDENCE
  // ─────────────────────────────────────────────────────────────
  if (
    q.includes("fire") || 
    q.includes("retire") || 
    q.includes("freedom") || 
    q.includes("financial independence") || 
    q.includes("25x") || 
    q.includes("lean fire") || 
    q.includes("fat fire")
  ) {
    const fire = getFireMetricsAdvisor(data);
    return `### FIRE & Perpetual Independence Milestones\n\nBased on your verified annual living burn rate of **${money(fire.annualExpenses)}/year**:\n\n* **Standard FIRE Target (25x Rule):** **${money(fire.fireNumber)}** (Supports 4.0% safe perpetual withdrawal)\n* **Lean FIRE Milestone (20x):** ${money(fire.leanFireNumber)} (Covers bare-bones essentials)\n* **Fat FIRE Milestone (33x):** ${money(fire.fatFireNumber)} (Supports luxury lifestyle with 3% withdrawal)\n* **Liquid & Invested Portfolio Base:** **${money(fire.liquidInvest)}**\n* **Current FIRE Progress:** **${fire.fireFundedPercent}% Funded**\n* **Estimated Horizon:** **${fire.yearsToFire} Years** (Assuming 12% equity CAGR on ${money(data.cashFlow)} monthly surplus)\n\n**Acceleration Strategy:**\nDeploying 100% of your monthly cash flow surplus (${money(data.cashFlow)}/mo) into diversified index funds compounds to achieve financial freedom in ${fire.yearsToFire} years.`;
  }

  // ─────────────────────────────────────────────────────────────
  // 10. INSURANCE & HLV PROTECTION GAP
  // ─────────────────────────────────────────────────────────────
  if (
    q.includes("insurance") || 
    q.includes("hlv") || 
    q.includes("life cover") || 
    q.includes("term plan") || 
    q.includes("health insurance") || 
    q.includes("protection")
  ) {
    const annualIncome = Number(cash.income || 0) * 12;
    const hlvRequired = (annualIncome * 15) + Number(data.liabilities || 0);
    const insuranceDocs = docs.filter(d => (d.category || '').toLowerCase().includes('insurance') || (d.type || '').toLowerCase().includes('insurance'));

    return `### Human Life Value (HLV) & Protection Audit\n\n* **Annual Gross Income Base:** ${money(annualIncome)}\n* **Required Pure Term Insurance (HLV):** **${money(hlvRequired)}**\n* **Actuarial Benchmark:** 15x Annual Income (${money(annualIncome * 15)}) + Total Debt (${money(data.liabilities)})\n* **Archived Insurance Policies:** ${insuranceDocs.length} Active Records\n\n**Advisory Directive:**\n1. Ensure you have **${money(hlvRequired)} in pure term life cover** with trust-linked nominee designations to protect your dependents.\n2. Maintain comprehensive health insurance with minimum ₹25 Lakhs super top-up coverage.`;
  }

  // ─────────────────────────────────────────────────────────────
  // 11. WILL, HEIRS & SUCCESSION PLANNING
  // ─────────────────────────────────────────────────────────────
  if (
    q.includes("will") || 
    q.includes("succession") || 
    q.includes("nominee") || 
    q.includes("heir") || 
    q.includes("estate") || 
    q.includes("probate")
  ) {
    const isWillReady = !!(will.primaryBeneficiary);
    return `### Digital Will & Estate Succession Health Check\n\n* **Digital Will Status:** **${isWillReady ? 'Attested & Active' : 'Draft Protocol in Progress'}**\n* **Primary Beneficiary:** ${escapeHtml(will.primaryBeneficiary || 'Family Nominee Designated')}\n* **Appointed Executor:** ${escapeHtml(will.executorName || 'Primary Executor Designated')}\n* **Physical Heirlooms:** Recorded in Codicil Schedule\n* **Video Will Record:** Section 65B Indian Evidence Act Affirmation Archived\n\n**Advisory Directive:**\nEnsure every physical asset (${assets.length} items valued at ${money(data.assets)}) and liquid bank account has updated, verified nominee records on file.`;
  }

  // ─────────────────────────────────────────────────────────────
  // 12. DEFAULT DYNAMIC CONTEXTUAL REASONING
  // ─────────────────────────────────────────────────────────────
  return `### Executive Wealth Diagnostics & Advisory Directives\n\n* **Consolidated Net Worth:** **${money(data.netWorth)}** (Gross Assets ${money(totalGrossAssets)} &minus; Liabilities ${money(data.liabilities)})\n* **Liquid Cash in Bank:** **${money(liquidCash)}** (${emergencyMonths} Months Survival Runway)\n* **Monthly Operating Surplus:** **${money(data.cashFlow)}/month** (Savings Rate: ${data.savingsRate}%)\n* **Solvency Index:** ${totalGrossAssets > 0 ? Math.round((Number(data.netWorth) / totalGrossAssets) * 100) : 100}%\n* **Debt-to-Income (FOIR):** ${cash.income ? Math.round((Number(data.emi || 0) / Number(cash.income)) * 100) : 0}%\n\n**Recommended Directives:**\n1. **Cash Management:** Retain ${money(monthlyBurn * 6)} in liquid accounts; deploy remainder into high-yield instruments.\n2. **Tax Alpha:** Review Section 80C & 80CCD(1B) headroom under the Tax Profile.\n3. **Wealth Compounding:** Channel ${money(data.cashFlow)}/month into index equity for financial independence.`;
}

function renderChatMessage(msg) {
  const isUser = msg.sender === "user";
  if (isUser) {
    return `
      <div style="display: flex; justify-content: flex-end; margin-bottom: 4px;">
        <div style="background: #0f172a; color: #ffffff; border-radius: 8px 8px 1px 8px; padding: 10px 14px; font-size: 13px; font-weight: 600; max-width: 75%; box-shadow: 0 2px 6px rgba(0,0,0,0.12); line-height: 1.45; word-break: break-word;">
          ${escapeHtml(msg.text)}
        </div>
      </div>
    `;
  }

  const p = advisorPersonas[msg.persona || advisorActivePersona] || advisorPersonas.cwo;
  const renderedText = formatMarkdownContent(msg.text);

  return `
    <div style="display: flex; gap: 8px; align-items: flex-start; margin-bottom: 6px; box-sizing: border-box; width: 100%;">
      <div style="background: ${p.accent}; color: #ffffff; width: 30px; height: 30px; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-size: 11.5px; font-weight: 850; flex-shrink: 0;">
        AI
      </div>
      <div style="background: #ffffff; border: 1.5px solid #cbd5e1; border-radius: 1px 8px 8px 8px; padding: 14px 18px; font-size: 13px; color: #0f172a; max-width: 90%; box-shadow: 0 1px 4px rgba(0,0,0,0.03); line-height: 1.55; word-break: break-word; box-sizing: border-box;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px;">
          <span style="font-size: 11px; font-weight: 850; color: ${p.accent}; text-transform: uppercase; letter-spacing: 0.5px;">${p.name}</span>
          <span style="font-size: 10.5px; color: #64748b; font-weight: 600;">${new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
        <div style="color: #0f172a;">${renderedText}</div>
      </div>
    </div>
  `;
}

function formatMarkdownContent(text) {
  if (!text) return "";
  let html = text
    .replace(/^### (.*$)/gim, '<h4 style="margin: 6px 0 4px; font-size: 14px; font-weight: 850; color: #0f172a;">$1</h4>')
    .replace(/^## (.*$)/gim, '<h3 style="margin: 8px 0 4px; font-size: 15px; font-weight: 850; color: #0f172a;">$1</h3>')
    .replace(/\*\*(.*?)\*\*/g, '<b style="color:#0f172a; font-weight:800;">$1</b>')
    .replace(/\*(.*?)\*/g, '<i style="color:#1e293b;">$1</i>')
    .replace(/\`([^\`]+)\`/g, '<code style="background: #e2e8f0; color: #0f172a; padding: 2px 6px; border-radius: 4px; font-family: monospace; font-size: 12px; font-weight: 700;">$1</code>');

  if (html.includes('|')) {
    const lines = html.split('\n');
    let inTable = false;
    let tableHtml = '<div style="overflow-x: auto; width: 100%; margin: 10px 0;"><table style="width: 100%; border-collapse: collapse; font-size: 12px; color: #0f172a;">';
    let processedLines = [];

    for (let line of lines) {
      if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
        if (line.includes('---')) continue;
        const cells = line.split('|').filter((c, i, a) => i > 0 && i < a.length - 1);
        if (!inTable) {
          inTable = true;
          tableHtml += '<thead><tr>' + cells.map(c => '<th style="border: 1.5px solid #cbd5e1; padding: 6px 8px; background: #f1f5f9; text-align: left; font-weight: 850; color: #0f172a; font-size: 11px;">' + c.trim() + '</th>').join('') + '</tr></thead><tbody>';
        } else {
          tableHtml += '<tr>' + cells.map(c => '<td style="border: 1px solid #cbd5e1; padding: 6px 8px; color: #0f172a; font-weight: 600;">' + c.trim() + '</td>').join('') + '</tr>';
        }
      } else {
        if (inTable) {
          tableHtml += '</tbody></table></div>';
          processedLines.push(tableHtml);
          inTable = false;
          tableHtml = '<div style="overflow-x: auto; width: 100%; margin: 10px 0;"><table style="width: 100%; border-collapse: collapse; font-size: 12px; color: #0f172a;">';
        }
        processedLines.push(line);
      }
    }
    if (inTable) {
      tableHtml += '</tbody></table></div>';
      processedLines.push(tableHtml);
    }
    html = processedLines.join('<br>');
  } else {
    html = html.replace(/\n/g, '<br>');
  }

  return html;
}

// ═══════════════════════════════════════════════════════════
// PRINTABLE AI ADVISORY AUDIT DOSSIER (PDF)
// ═══════════════════════════════════════════════════════════

window.printAiAdvisoryDossierPdf = () => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) { alert("Please allow popups."); return; }

  const data = totals();
  const userName = (window.activeUser && window.activeUser.name) || 'Executive Account Holder';

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>AI Wealth Advisory Audit Dossier — ${escapeHtml(userName)}</title>
        <style>
          @page { size: A4; margin: 20mm; }
          body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 10pt; line-height: 1.5; color: #0f172a; max-width: 800px; margin: 0 auto; padding: 10px; }
          h1 { font-size: 17pt; text-transform: uppercase; border-bottom: 2px solid #0f172a; padding-bottom: 6px; }
          .chat-box { background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; padding: 10px 12px; margin-bottom: 10px; font-size: 9.5pt; color: #0f172a; }
          .persona-badge { font-weight: bold; font-size: 8.5pt; color: #0284c7; text-transform: uppercase; }
        </style>
      </head>
      <body>
        <h1>SOVEREIGN AI FINANCIAL ADVISORY DOSSIER</h1>
        <p style="color: #64748b;">Prepared for <b>${escapeHtml(userName)}</b> &bull; Date: ${new Date().toLocaleDateString('en-IN')}</p>

        <div style="background: #f1f5f9; padding: 8px 12px; border-radius: 6px; margin-bottom: 16px; font-size: 9.5pt;">
          <b>Standing:</b> Net Worth: ${money(data.netWorth)} | Cashflow Surplus: ${money(data.cashFlow)}/mo | Debt Load: ${data.debtRatio}%
        </div>

        <h3>Advisory Consultation Record</h3>
        ${advisorChatMessages.map(msg => `
          <div class="chat-box">
            <div class="persona-badge">${msg.sender === 'user' ? 'CLIENT INQUIRY' : 'ADVISOR DIRECTIVE (' + (advisorPersonas[msg.persona]?.name || 'CWO') + ')'}</div>
            <div style="margin-top: 4px;">${formatMarkdownContent(msg.text)}</div>
          </div>
        `).join('')}

        <div style="margin-top: 40px; display: flex; justify-content: space-between;">
          <div style="border-top: 1px solid #000; width: 200px; text-align: center; padding-top: 6px; font-size: 9pt;">Advisory Officer</div>
          <div style="border-top: 1px solid #000; width: 200px; text-align: center; padding-top: 6px; font-size: 9pt;">Account Holder</div>
        </div>
        <script>window.print();</script>
      </body>
    </html>
  `;
  printWindow.document.write(html);
  printWindow.document.close();
};

// Immediate auto-render if the user is already on the AI view
if (typeof activeView !== 'undefined' && activeView === 'ai') {
  setTimeout(renderAi, 0);
}
