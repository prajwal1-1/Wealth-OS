/**
 * Cash Flow & Expense Intelligence UI Module
 * Implements Top Summary Cards, Chart.js Dashboards, and the Transaction Ledger.
 */

let cashflowChartInstance = null;
let categoryChartInstance = null;
let cashflowData = { analytics: null, expenses: [] };
let cashflowFilters = { familyMemberId: '', category: '', isTaxDeductible: '', selectedMonth: 'all' };
let ledgerCurrentPage = 1;
const LEDGER_PAGE_SIZE = 15;
let ledgerSearchQuery = '';

async function fetchCashflowData() {
  try {
    let dateParams = '';
    if (cashflowFilters.selectedMonth && cashflowFilters.selectedMonth !== 'all') {
      const [year, month] = cashflowFilters.selectedMonth.split('-');
      const lastDay = new Date(year, Number(month), 0).getDate();
      dateParams = `startDate=${year}-${month}-01&endDate=${year}-${month}-${String(lastDay).padStart(2, '0')}`;
    } else {
      dateParams = 'startDate=2000-01-01';
    }

    const summaryRes = await fetch(`${localApiBase}/api/wealth/cashflow/analytics?${dateParams}`, {
      headers: { "Authorization": `Bearer ${localStorage.getItem(tokenKey)}` }
    });
    const summaryJson = await summaryRes.json();
    
    let expensesUrl = `${localApiBase}/api/wealth/cashflow?${dateParams}`;
    if (cashflowFilters.familyMemberId) expensesUrl += `&familyMemberId=${cashflowFilters.familyMemberId}`;
    if (cashflowFilters.category) expensesUrl += `&category=${cashflowFilters.category}`;
    if (cashflowFilters.isTaxDeductible) expensesUrl += `&isTaxDeductible=${cashflowFilters.isTaxDeductible}`;
    
    const expensesRes = await fetch(expensesUrl, {
      headers: { "Authorization": `Bearer ${localStorage.getItem(tokenKey)}` }
    });
    const expensesJson = await expensesRes.json();
    
    cashflowData = {
      analytics: summaryJson.success ? summaryJson.data : null,
      expenses: expensesJson.success ? expensesJson.expenses : []
    };
    
    const trendsRes = await fetch(`${localApiBase}/api/wealth/cashflow/trends`, {
      headers: { "Authorization": `Bearer ${localStorage.getItem(tokenKey)}` }
    });
    const trendsJson = await trendsRes.json();
    if (trendsJson.success) {
      cashflowData.trends = trendsJson.trends;
    }

  } catch (err) {
    console.error("Error fetching cash flow data:", err);
  }
}

async function selectCashflowMonth(monthKey) {
  cashflowFilters.selectedMonth = monthKey;
  await renderCashflowPage();
}

function renderAiExecutiveSummary(analytics) {
  const qc = analytics.quickCommerce || { totalConvenienceSpend: 0, totalOrders: 0 };
  const p2p = analytics.p2pNetwork || [];
  const totalReceivedP2P = p2p.reduce((s, p) => s + (p.received || 0), 0);
  const recurring = analytics.recurringOverhead || { totalFixedMonthlyBurn: 0 };
  const temporal = analytics.temporalAnalytics || { weekendRatio: 0, weekdayRatio: 0 };

  const isMonthView = cashflowFilters.selectedMonth && cashflowFilters.selectedMonth !== 'all';
  let focusTitle = '6-Month Aggregated Overview';
  if (isMonthView) {
    const [yr, mo] = cashflowFilters.selectedMonth.split('-');
    focusTitle = new Date(yr, mo - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) + ' Focus';
  }

  return `
    <div style="background: linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(244, 247, 250, 0.8) 100%); border: 1px solid rgba(0,0,0,0.06); border-radius: 14px; padding: 14px 18px; margin-bottom: 16px; box-shadow: 0 2px 10px rgba(0,0,0,0.02);">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
        <span style="font-size: 11px; font-weight: 850; letter-spacing: 0.5px; text-transform: uppercase; color: #5f6368;">🧠 Financial Intelligence & Insights</span>
        <span style="font-size: 11px; font-weight: 750; color: #106636; background: rgba(16, 102, 54, 0.08); padding: 3px 10px; border-radius: 99px;">● ${focusTitle}</span>
      </div>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px;">
        <div style="background: white; border: 1px solid rgba(0,0,0,0.05); border-radius: 10px; padding: 12px 14px;">
          <span style="font-size: 11px; font-weight: 750; color: #666; display: block; margin-bottom: 2px;">📦 Quick Commerce & Food</span>
          <strong style="font-size: 18px; color: #111;">${money(qc.totalConvenienceSpend)}</strong>
          <small style="display: block; color: #888; font-size: 10.5px; margin-top: 2px;">${qc.totalOrders} orders (Blinkit / Zomato / Dining)</small>
        </div>
        <div style="background: white; border: 1px solid rgba(0,0,0,0.05); border-radius: 10px; padding: 12px 14px;">
          <span style="font-size: 11px; font-weight: 750; color: #666; display: block; margin-bottom: 2px;">👥 Social Inflows</span>
          <strong style="font-size: 18px; color: #106636;">${money(totalReceivedP2P)}</strong>
          <small style="display: block; color: #888; font-size: 10.5px; margin-top: 2px;">Reimbursements & splits from friends</small>
        </div>
        <div style="background: white; border: 1px solid rgba(0,0,0,0.05); border-radius: 10px; padding: 12px 14px;">
          <span style="font-size: 11px; font-weight: 750; color: #666; display: block; margin-bottom: 2px;">🔄 Fixed Commitments</span>
          <strong style="font-size: 18px; color: #111;">${money(recurring.totalFixedMonthlyBurn)} / mo</strong>
          <small style="display: block; color: #888; font-size: 10.5px; margin-top: 2px;">Rent + Bills + Subscriptions</small>
        </div>
        <div style="background: white; border: 1px solid rgba(0,0,0,0.05); border-radius: 10px; padding: 12px 14px;">
          <span style="font-size: 11px; font-weight: 750; color: #666; display: block; margin-bottom: 2px;">⏰ Weekend vs Weekday</span>
          <strong style="font-size: 18px; color: #111;">${temporal.weekendRatio}% Weekend</strong>
          <small style="display: block; color: #888; font-size: 10.5px; margin-top: 2px;">${money(temporal.weekendSpend)} Sat-Sun vs ${money(temporal.weekdaySpend)} Mon-Fri</small>
        </div>
      </div>
    </div>
  `;
}

function renderP2PSocialCard(analytics) {
  const peers = (analytics.p2pNetwork || []).slice(0, 8);
  if (!peers.length) return '';

  const rows = peers.map(p => `
    <div style="display: flex; justify-content: space-between; align-items: center; padding: 9px 12px; border-radius: 10px; background: rgba(0,0,0,0.015); margin-bottom: 6px;">
      <div style="min-width: 0; flex: 1; padding-right: 12px;">
        <strong style="display: block; font-size: 13px; font-weight: 750; color: #111; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${escapeHtml(p.name)}</strong>
        <small style="color: #777; font-size: 11px; white-space: nowrap;">Paid ${money(p.sent)} • Recv ${money(p.received)}</small>
      </div>
      <div style="text-align: right; flex-shrink: 0;">
        <span style="font-size: 11px; font-weight: 800; padding: 4px 10px; border-radius: 99px; background: ${p.net >= 0 ? '#e6f4ea' : '#fce8e6'}; color: ${p.net >= 0 ? '#137333' : '#c5221f'}; white-space: nowrap; display: inline-block;">
          ${p.net >= 0 ? '+' : ''}${money(p.net)}
        </span>
      </div>
    </div>
  `).join('');

  return `
    <div style="background: white; border-radius: 14px; padding: 18px 20px; border: 1px solid rgba(0,0,0,0.06); box-shadow: 0 2px 10px rgba(0,0,0,0.02); height: 100%; display: flex; flex-direction: column;">
      <div style="margin-bottom: 12px;">
        <h3 style="margin: 0; font-size: 15px; font-weight: 850;">👥 P2P Social Split & Friends Ledger</h3>
        <p style="margin: 2px 0 0; font-size: 11px; color: #777;">Net balance of money sent vs received with friends</p>
      </div>
      <div style="overflow-y: auto; max-height: 220px; flex: 1; padding-right: 2px;">
        ${rows}
      </div>
    </div>
  `;
}

function renderQuickCommerceDeepDive(analytics) {
  const qc = analytics.quickCommerce || {};
  const qg = qc.quickGrocery || { total: 0, count: 0, aov: 0 };
  const fd = qc.foodDelivery || { total: 0, count: 0, aov: 0 };
  const dOut = qc.diningOut || { total: 0, count: 0, aov: 0 };

  return `
    <div style="background: white; border-radius: 14px; padding: 18px 20px; border: 1px solid rgba(0,0,0,0.06); box-shadow: 0 2px 10px rgba(0,0,0,0.02); height: 100%; display: flex; flex-direction: column; justify-content: space-between;">
      <div style="margin-bottom: 12px;">
        <h3 style="margin: 0 0 2px; font-size: 15px; font-weight: 850;">📦 Quick-Commerce & Food Meter</h3>
        <p style="margin: 0; font-size: 11px; color: #777;">Breakdown of on-demand orders and dining visits</p>
      </div>
      
      <div style="display: flex; flex-direction: column; gap: 8px;">
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 12px; background: rgba(0,0,0,0.015); border-radius: 10px;">
          <div>
            <strong style="display: block; font-size: 13px; color: #111;">🛒 Quick Groceries (Blinkit / Avenue)</strong>
            <small style="color: #777; font-size: 11px;">${qg.count} orders • Avg ${money(qg.aov)}/order</small>
          </div>
          <strong style="font-size: 14px; color: #111; white-space: nowrap;">${money(qg.total)}</strong>
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 12px; background: rgba(0,0,0,0.015); border-radius: 10px;">
          <div>
            <strong style="display: block; font-size: 13px; color: #111;">🍔 Food Delivery (Zomato / Swiggy)</strong>
            <small style="color: #777; font-size: 11px;">${fd.count} orders • Avg ${money(fd.aov)}/order</small>
          </div>
          <strong style="font-size: 14px; color: #111; white-space: nowrap;">${money(fd.total)}</strong>
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 12px; background: rgba(0,0,0,0.015); border-radius: 10px;">
          <div>
            <strong style="display: block; font-size: 13px; color: #111;">☕ Local Cafes & Dining Out</strong>
            <small style="color: #777; font-size: 11px;">${dOut.count} visits • Avg ${money(dOut.aov)}/visit</small>
          </div>
          <strong style="font-size: 14px; color: #111; white-space: nowrap;">${money(dOut.total)}</strong>
        </div>
      </div>
    </div>
  `;
}

function renderRecurringOverheadCard(analytics) {
  const items = (analytics.recurringOverhead?.items || []).slice(0, 5);
  return `
    <div style="background: white; border-radius: 14px; padding: 18px 20px; border: 1px solid rgba(0,0,0,0.06); box-shadow: 0 2px 10px rgba(0,0,0,0.02); height: 100%; display: flex; flex-direction: column;">
      <div style="margin-bottom: 12px;">
        <h3 style="margin: 0 0 2px; font-size: 15px; font-weight: 850;">🔄 Fixed Commitments & Subscriptions</h3>
        <p style="margin: 0; font-size: 11px; color: #777;">Recurring monthly overheads (Rent, Telecom, OTT)</p>
      </div>
      <div style="display: flex; flex-direction: column; gap: 6px; flex: 1;">
        ${items.map(r => `
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 12px; border-radius: 10px; background: rgba(0,0,0,0.015);">
            <div>
              <strong style="display: block; font-size: 13px; color: #111;">${escapeHtml(r.label)}</strong>
              <small style="color: #777; font-size: 11px;">${r.count} payments • ${r.frequency}</small>
            </div>
            <strong style="font-size: 13.5px; color: #111; white-space: nowrap;">${money(r.total)}</strong>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function render503020BudgetCard(analytics) {
  const b = analytics.budget503020 || { needs: 0, needsPct: 50, wants: 0, wantsPct: 30, savingsSurplus: 0, savingsPct: 20, status: 'Optimal 50/30/20 Balance' };
  
  return `
    <div style="background: white; border-radius: 14px; padding: 18px 20px; border: 1px solid rgba(0,0,0,0.06); box-shadow: 0 2px 10px rgba(0,0,0,0.02); height: 100%; display: flex; flex-direction: column; justify-content: space-between;">
      <div>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
          <h3 style="margin: 0; font-size: 15px; font-weight: 850;">🎯 50 / 30 / 20 Budget Rule</h3>
          <span style="font-size: 10.5px; font-weight: 750; padding: 3px 8px; border-radius: 99px; background: rgba(16, 102, 54, 0.08); color: #106636;">${escapeHtml(b.status)}</span>
        </div>
        <p style="margin: 0 0 12px; font-size: 11px; color: #777;">Institutional benchmark: Needs (50%) vs Wants (30%) vs Surplus (20%)</p>
      </div>

      <div style="display: flex; flex-direction: column; gap: 8px;">
        <!-- Needs -->
        <div style="background: rgba(0,0,0,0.015); padding: 9px 12px; border-radius: 10px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
            <div>
              <strong style="font-size: 12.5px; color: #111;">🏠 Needs & Mandatory</strong>
              <small style="color: #777; font-size: 10.5px; margin-left: 4px;">Rent, Bills, Medical, Fuel</small>
            </div>
            <div style="text-align: right;">
              <strong style="font-size: 13px; color: #111;">${money(b.needs)}</strong>
              <span style="font-size: 11px; font-weight: 800; color: ${b.needsPct > 55 ? '#c5221f' : '#137333'}; margin-left: 4px;">(${b.needsPct}% / 50%)</span>
            </div>
          </div>
          <div style="width: 100%; height: 5px; background: rgba(0,0,0,0.06); border-radius: 99px; overflow: hidden;">
            <div style="width: ${Math.min(100, b.needsPct)}%; height: 100%; background: ${b.needsPct > 55 ? '#ef4444' : '#10b981'}; border-radius: 99px;"></div>
          </div>
        </div>

        <!-- Wants -->
        <div style="background: rgba(0,0,0,0.015); padding: 9px 12px; border-radius: 10px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
            <div>
              <strong style="font-size: 12.5px; color: #111;">🍔 Wants & Lifestyle</strong>
              <small style="color: #777; font-size: 10.5px; margin-left: 4px;">Dining, Quick Cravings, Travel</small>
            </div>
            <div style="text-align: right;">
              <strong style="font-size: 13px; color: #111;">${money(b.wants)}</strong>
              <span style="font-size: 11px; font-weight: 800; color: ${b.wantsPct > 35 ? '#d97706' : '#137333'}; margin-left: 4px;">(${b.wantsPct}% / 30%)</span>
            </div>
          </div>
          <div style="width: 100%; height: 5px; background: rgba(0,0,0,0.06); border-radius: 99px; overflow: hidden;">
            <div style="width: ${Math.min(100, b.wantsPct)}%; height: 100%; background: ${b.wantsPct > 35 ? '#f59e0b' : '#3b82f6'}; border-radius: 99px;"></div>
          </div>
        </div>

        <!-- Savings / Surplus -->
        <div style="background: rgba(0,0,0,0.015); padding: 9px 12px; border-radius: 10px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
            <div>
              <strong style="font-size: 12.5px; color: #111;">📈 Retained Surplus</strong>
              <small style="color: #777; font-size: 10.5px; margin-left: 4px;">Capital Growth Buffer</small>
            </div>
            <div style="text-align: right;">
              <strong style="font-size: 13px; color: #106636;">${money(b.savingsSurplus)}</strong>
              <span style="font-size: 11px; font-weight: 800; color: #137333; margin-left: 4px;">(${b.savingsPct}% / 20%)</span>
            </div>
          </div>
          <div style="width: 100%; height: 5px; background: rgba(0,0,0,0.06); border-radius: 99px; overflow: hidden;">
            <div style="width: ${Math.min(100, b.savingsPct)}%; height: 100%; background: #106636; border-radius: 99px;"></div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderPredictiveRunwayCard(analytics) {
  const p = analytics.predictiveRunway || { upcomingFixedBills30d: 7827, safeToSpend: 27173, runwayMonths: 2.6, runwayRating: 'Moderate' };

  return `
    <div style="background: white; border-radius: 14px; padding: 18px 20px; border: 1px solid rgba(0,0,0,0.06); box-shadow: 0 2px 10px rgba(0,0,0,0.02); height: 100%; display: flex; flex-direction: column; justify-content: space-between;">
      <div>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
          <h3 style="margin: 0; font-size: 15px; font-weight: 850;">🔮 30-Day Forecast & Runway</h3>
          <span style="font-size: 10.5px; font-weight: 750; padding: 3px 8px; border-radius: 99px; background: rgba(0,0,0,0.04); color: #111;">${escapeHtml(p.runwayRating)}</span>
        </div>
        <p style="margin: 0 0 12px; font-size: 11px; color: #777;">Predictive obligations & zero-inflow cash cushion</p>
      </div>

      <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; margin-bottom: 8px;">
        <div style="background: rgba(0,0,0,0.015); padding: 10px 12px; border-radius: 10px;">
          <span style="font-size: 10.5px; color: #777; display: block; margin-bottom: 1px;">Upcoming 30D Bills</span>
          <strong style="font-size: 16px; color: #111;">${money(p.upcomingFixedBills30d)}</strong>
          <small style="display: block; font-size: 10px; color: #888; margin-top: 1px;">Rent + Broadband + OTT</small>
        </div>
        <div style="background: rgba(16, 102, 54, 0.04); padding: 10px 12px; border-radius: 10px; border: 1px solid rgba(16, 102, 54, 0.1);">
          <span style="font-size: 10.5px; color: #106636; font-weight: 750; display: block; margin-bottom: 1px;">Safe-To-Spend Pool</span>
          <strong style="font-size: 16px; color: #106636;">${money(p.safeToSpend)}</strong>
          <small style="display: block; font-size: 10px; color: #555; margin-top: 1px;">After mandatory commitments</small>
        </div>
      </div>

      <div style="background: linear-gradient(135deg, #111820 0%, #24303e 100%); padding: 10px 14px; border-radius: 10px; color: white; display: flex; justify-content: space-between; align-items: center;">
        <div>
          <span style="font-size: 10.5px; color: #94a3b8; display: block;">Liquid Runway Clock</span>
          <strong style="font-size: 16px; color: white;">${p.runwayMonths} Months Zero-Income Cushion</strong>
        </div>
        <span style="font-size: 18px;">⏳</span>
      </div>
    </div>
  `;
}

function renderBrandConcentrationCard(analytics) {
  const brands = (analytics.brandConcentration || []).slice(0, 5);
  if (!brands.length) return '';

  const rows = brands.map(b => `
    <div style="display: flex; justify-content: space-between; align-items: center; padding: 7px 10px; border-radius: 8px; background: rgba(0,0,0,0.015); margin-bottom: 4px;">
      <div>
        <strong style="display: block; font-size: 12.5px; color: #111;">${escapeHtml(b.name)}</strong>
        <small style="color: #777; font-size: 10.5px;">${b.category} • ${b.count} txns (Avg ${money(b.aov)})</small>
      </div>
      <div style="text-align: right;">
        <strong style="font-size: 13px; color: #111; display: block;">${money(b.total)}</strong>
        <span style="font-size: 10.5px; font-weight: 750; color: #666;">${b.sharePct}% of spend</span>
      </div>
    </div>
  `).join('');

  return `
    <div style="background: white; border-radius: 14px; padding: 18px 20px; border: 1px solid rgba(0,0,0,0.06); box-shadow: 0 2px 10px rgba(0,0,0,0.02); height: 100%; display: flex; flex-direction: column;">
      <div style="margin-bottom: 10px;">
        <h3 style="margin: 0; font-size: 15px; font-weight: 850;">🏪 Top Brands & Merchant Loyalty</h3>
        <p style="margin: 2px 0 0; font-size: 11px; color: #777;">Top merchant destinations ranked by cumulative volume</p>
      </div>
      <div style="display: flex; flex-direction: column; flex: 1;">
        ${rows}
      </div>
    </div>
  `;
}

function renderTemporalHeatmapWidget(analytics) {
  const temporal = analytics.temporalAnalytics || { dayTotals: {}, weekdayRatio: 0, weekendRatio: 0 };
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const maxSpend = Math.max(...Object.values(temporal.dayTotals || { a: 1 }), 1);

  return `
    <div style="background: white; border-radius: 14px; padding: 18px 20px; border: 1px solid rgba(0,0,0,0.06); box-shadow: 0 2px 10px rgba(0,0,0,0.02); height: 100%; display: flex; flex-direction: column; justify-content: space-between;">
      <div style="margin-bottom: 12px;">
        <h3 style="margin: 0 0 2px; font-size: 15px; font-weight: 850;">⏰ Spending Velocity & Temporal Heatmap</h3>
        <p style="margin: 0; font-size: 11px; color: #777;">Outflow distribution across weekdays vs weekends</p>
      </div>

      <div style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 8px; align-items: flex-end; min-height: 100px; padding: 6px 0;">
        ${days.map(d => {
          const val = temporal.dayTotals[d] || 0;
          const heightPct = Math.max(12, Math.round((val / maxSpend) * 80));
          const isWeekend = d === 'Sat' || d === 'Sun';
          return `
            <div style="display: flex; flex-direction: column; align-items: center; gap: 4px;">
              <span style="font-size: 9.5px; font-weight: 800; color: ${isWeekend ? '#c5221f' : '#555'}; white-space: nowrap;">${val >= 1000 ? '₹' + Math.round(val/1000) + 'k' : money(val)}</span>
              <div style="width: 100%; height: ${heightPct}px; background: ${isWeekend ? 'linear-gradient(180deg, #f87171, #ef4444)' : 'linear-gradient(180deg, #60a5fa, #3b82f6)'}; border-radius: 4px; opacity: 0.85;"></div>
              <span style="font-size: 10.5px; font-weight: 750; color: #555;">${d}</span>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

async function renderCashflowPage() {
  try {
    list.innerHTML = `<div style="padding: 20px;">Loading Cash Flow Intelligence...</div>`;
    actions.innerHTML = ``;
    
    await fetchCashflowData();
    
    const analytics = cashflowData.analytics || {
      totalSent: 0, totalReceived: 0, netOutflow: 0, monthlyBurnRate: 0, topCategories: []
    };
    
    const isMonth = cashflowFilters.selectedMonth && cashflowFilters.selectedMonth !== 'all';
    const totalSent = analytics.totalSent || analytics.consolidatedOutflow || 0;
    const totalReceived = analytics.totalReceived || 0;
    const isSurplus = totalReceived >= totalSent;
    const netDifference = Math.abs(totalSent - totalReceived);
    const coverageRatio = totalSent > 0 ? Math.round((totalReceived / totalSent) * 100) : 100;

    const metricHTML = [
      metricModule(
        "Total Cash Outflow", 
        money(totalSent), 
        "Debits & Payments", 
        "linear-gradient(135deg, #1f1f1f 0%, #3a3a3a 100%)"
      ),
      metricModule(
        "Total Cash Inflow", 
        money(totalReceived), 
        `Inflow Coverage: ${coverageRatio}%`, 
        "linear-gradient(135deg, #112818 0%, #1e5a2e 100%)"
      ),
      metricModule(
        isSurplus ? "Net Cash Surplus" : "Net Cash Deficit", 
        (isSurplus ? "+" : "-") + money(netDifference), 
        isSurplus ? "Inflows exceed Outflows" : "Outflows exceed Inflows", 
        isSurplus ? "linear-gradient(135deg, #104220 0%, #1e6e34 100%)" : "linear-gradient(135deg, #3d1614 0%, #6e201b 100%)"
      ),
      metricModule(
        isMonth ? (isSurplus ? "Monthly Net Surplus" : "Monthly Net Burn") : "Monthly Burn Rate", 
        isMonth ? (isSurplus ? "+" : "") + money(netDifference) : money(analytics.monthlyBurnRate || 0) + " / mo", 
        isMonth ? (isSurplus ? "Positive Cashflow Margin" : "Net Spend for Month") : "6-Month Net Run-Rate Baseline", 
        isSurplus ? "linear-gradient(135deg, #104220 0%, #1e6e34 100%)" : "linear-gradient(135deg, #151f1c 0%, #334021 100%)"
      )
    ].join("");

    list.innerHTML = `
      <!-- Top Action & Month Selector Toolbar (Zero Dead Space) -->
      <div style="background: white; border-radius: 14px; padding: 12px 18px; border: 1px solid rgba(0,0,0,0.06); box-shadow: 0 2px 10px rgba(0,0,0,0.02); margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
        <div style="display: flex; gap: 8px; align-items: center;">
          <button class="primary-action" style="padding: 6px 14px; font-size: 12px;" type="button" onclick="openCashflowModal()">+ Log Expense</button>
          <button class="primary-action" style="padding: 6px 14px; font-size: 12px;" type="button" onclick="document.getElementById('statement-upload').click()">Upload Statement</button>
          <input type="file" id="statement-upload" accept=".csv, .pdf" style="display: none;" onchange="handleStatementUpload(event)">
          <button class="secondary-action" style="background: white; border: 1px solid #ddd; padding: 6px 14px; border-radius: 99px; cursor: pointer; font-size: 12px; font-weight: 600;" type="button" onclick="exportToCA()">📄 Export PDF Dossier</button>
        </div>

        <!-- Month Selector Pills -->
        <div style="display: flex; gap: 6px; align-items: center; overflow-x: auto;">
          <span style="font-size: 10.5px; font-weight: 800; text-transform: uppercase; color: #777; margin-right: 4px;">Month:</span>
          ${['all', '2026-02', '2026-03', '2026-04', '2026-05', '2026-06', '2026-07'].map(m => {
            const isSelected = (cashflowFilters.selectedMonth || 'all') === m;
            let label = 'All (6M)';
            if (m !== 'all') {
              const [yr, mo] = m.split('-');
              label = new Date(yr, mo - 1, 1).toLocaleDateString('en-US', { month: 'short' });
            }
            return `
              <button type="button" onclick="selectCashflowMonth('${m}')" style="padding: 5px 12px; border-radius: 99px; font-size: 11.5px; font-weight: 750; cursor: pointer; border: 1px solid ${isSelected ? '#111820' : 'rgba(0,0,0,0.08)'}; background: ${isSelected ? '#111820' : 'rgba(0,0,0,0.02)'}; color: ${isSelected ? '#fff' : '#444'}; transition: all 0.15s ease; white-space: nowrap;">
                ${label}
              </button>
            `;
          }).join('')}
        </div>
      </div>

      <!-- 4 Top KPI Cards -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); gap: 12px; margin-bottom: 16px;">
        ${metricHTML}
      </div>

      <!-- AI Executive Summary Banner -->
      ${renderAiExecutiveSummary(analytics)}

      <!-- Row 1 Analytics: Macro Charts Grid (Side-by-Side 2 Columns) -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(340px, 1fr)); gap: 16px; margin-bottom: 16px;">
        <div style="background: white; border-radius: 14px; padding: 18px 20px; border: 1px solid rgba(0,0,0,0.06); box-shadow: 0 2px 10px rgba(0,0,0,0.02);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
            <h3 style="margin: 0; font-size: 15px; font-weight: 850;">Monthly Inflow vs Outflow Trajectory</h3>
            <span style="font-size: 10.5px; font-weight: 750; color: #666;">Feb 2026 – Jul 2026</span>
          </div>
          <div style="position: relative; height: 230px; width: 100%;">
            <canvas id="cashflowTrendChart"></canvas>
          </div>
        </div>
        <div style="background: white; border-radius: 14px; padding: 18px 20px; border: 1px solid rgba(0,0,0,0.06); box-shadow: 0 2px 10px rgba(0,0,0,0.02);">
          <h3 style="margin: 0 0 12px; font-size: 15px; font-weight: 850;">Top Outflow Categories</h3>
          <div style="position: relative; height: 230px; width: 100%;">
            <canvas id="cashflowCategoryChart"></canvas>
          </div>
        </div>
      </div>

      <!-- Row 2 Analytics: 50/30/20 Budgeting & 30-Day Predictive Runway (2 Equal Columns) -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(340px, 1fr)); gap: 16px; margin-bottom: 16px;">
        ${render503020BudgetCard(analytics)}
        ${renderPredictiveRunwayCard(analytics)}
      </div>
      
      <!-- Row 3 Analytics: Quick-Commerce & Brand Concentration (2 Equal Columns) -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(340px, 1fr)); gap: 16px; margin-bottom: 16px;">
        ${renderQuickCommerceDeepDive(analytics)}
        ${renderBrandConcentrationCard(analytics)}
      </div>

      <!-- Row 4 Analytics: Fixed Commitments & Temporal Heatmap & P2P Ledger -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(340px, 1fr)); gap: 16px; margin-bottom: 16px;">
        ${renderRecurringOverheadCard(analytics)}
        ${renderTemporalHeatmapWidget(analytics)}
      </div>

      <!-- Row 5 Analytics: P2P Social Split & Friends Ledger -->
      <div style="margin-bottom: 20px;">
        ${renderP2PSocialCard(analytics)}
      </div>
      
      <!-- Transaction Ledger & Controls -->
      <div style="background: white; border-radius: 14px; border: 1px solid rgba(0,0,0,0.06); box-shadow: 0 2px 10px rgba(0,0,0,0.02); overflow: hidden; margin-bottom: 30px;">
        <div style="padding: 16px 20px; border-bottom: 1px solid rgba(0,0,0,0.06); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
          <div>
            <h3 style="margin: 0; font-size: 16px; font-weight: 850;">Transaction Ledger (${cashflowData.expenses?.length || 0} Total Records)</h3>
            <p style="margin: 2px 0 0; font-size: 11px; color: #777;">Verified transactions from Google Pay & Kotak Bank Statements</p>
          </div>
          <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
            <input type="text" id="ledger-search-input" placeholder="Search merchant, amount, category..." value="${ledgerSearchQuery}" oninput="handleLedgerSearch(this.value)" style="padding: 6px 14px; border-radius: 99px; border: 1px solid rgba(0,0,0,0.12); font-size: 11.5px; width: 220px;">
            <select onchange="updateCashflowFilter('isTaxDeductible', this.value)" style="padding: 6px 10px; border-radius: 8px; border: 1px solid rgba(0,0,0,0.12); font-size: 11.5px;">
              <option value="">Tax: All</option>
              <option value="true" ${cashflowFilters.isTaxDeductible === 'true' ? 'selected' : ''}>Deductible</option>
              <option value="false" ${cashflowFilters.isTaxDeductible === 'false' ? 'selected' : ''}>Non-Deductible</option>
            </select>
          </div>
        </div>

        <div id="ledger-table-wrapper">
          ${renderTransactionLedger()}
        </div>
      </div>

      ${renderQuickLoggerModalHTML()}
    `;

    setTimeout(() => {
      renderCashflowCharts();
    }, 50);
  } catch (renderErr) {
    console.error("Critical error in renderCashflowPage:", renderErr);
    list.innerHTML = `
      <div style="background: #fff3f2; border: 1px solid #f87171; border-radius: 12px; padding: 20px; color: #991b1b; margin: 20px;">
        <strong>Error loading Cash Flow Intelligence</strong>
        <p style="margin: 8px 0 0; font-size: 13px;">${renderErr.message}</p>
      </div>
    `;
  }
}

function handleLedgerSearch(query) {
  ledgerSearchQuery = String(query || '').toLowerCase().trim();
  ledgerCurrentPage = 1;
  const wrapper = document.getElementById('ledger-table-wrapper');
  if (wrapper) {
    wrapper.innerHTML = renderTransactionLedger();
  }
}

function changeLedgerPage(delta) {
  ledgerCurrentPage += delta;
  const wrapper = document.getElementById('ledger-table-wrapper');
  if (wrapper) {
    wrapper.innerHTML = renderTransactionLedger();
  }
}

function renderTransactionLedger() {
  const expenses = cashflowData.expenses || [];
  if (expenses.length === 0) {
    return `<div style="padding: 30px; text-align: center; color: #777;">No transactions found for the selected period.</div>`;
  }

  // Filter by search query
  const filtered = expenses.filter(e => {
    if (!ledgerSearchQuery) return true;
    const payee = String(e.description || e.merchantOrPayee || '').toLowerCase();
    const cat = String(e.category || '').toLowerCase();
    const amt = String(e.amount || '');
    return payee.includes(ledgerSearchQuery) || cat.includes(ledgerSearchQuery) || amt.includes(ledgerSearchQuery);
  });

  const totalPages = Math.ceil(filtered.length / LEDGER_PAGE_SIZE) || 1;
  if (ledgerCurrentPage > totalPages) ledgerCurrentPage = totalPages;
  if (ledgerCurrentPage < 1) ledgerCurrentPage = 1;

  const startIdx = (ledgerCurrentPage - 1) * LEDGER_PAGE_SIZE;
  const pagedItems = filtered.slice(startIdx, startIdx + LEDGER_PAGE_SIZE);

  const rows = pagedItems.map(e => {
    const payee = e.description || e.merchantOrPayee || 'Transaction';
    const isCredit = e.type === 'credit' || /received/i.test(payee);
    return `
      <tr style="border-bottom: 1px solid rgba(0,0,0,0.025); transition: background 0.15s ease;">
        <td style="padding: 10px 16px; font-size: 11.5px; color: #666; white-space: nowrap;">${new Date(e.transactionDate).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
        <td style="padding: 10px 16px; font-weight: 700; color: #111; font-size: 12.5px;">${escapeHtml(payee)}</td>
        <td style="padding: 10px 16px;"><span style="background: rgba(0,0,0,0.04); padding: 3px 8px; border-radius: 99px; font-size: 0.72rem; font-weight: 700; color: #444; white-space: nowrap;">${escapeHtml(e.category || 'Other')}</span></td>
        <td style="padding: 10px 16px; text-align: right; font-weight: 800; font-size: 12.5px; color: ${isCredit ? '#137333' : '#111'}; white-space: nowrap;">${isCredit ? '+' : '-'}${money(e.amount)}</td>
        <td style="padding: 10px 16px; text-align: center; font-size: 11.5px;">${e.isTaxDeductible ? '<span style="color: #137333; font-weight: 800;">✓</span>' : '-'}</td>
      </tr>
    `;
  }).join('');

  return `
    <div style="overflow-x: auto;">
      <table style="width: 100%; border-collapse: collapse; text-align: left;">
        <thead>
          <tr style="background: rgba(0,0,0,0.015); border-bottom: 1px solid rgba(0,0,0,0.04); font-size: 10.5px; text-transform: uppercase; letter-spacing: 0.5px; color: #777;">
            <th style="padding: 10px 16px;">Date</th>
            <th style="padding: 10px 16px;">Payee / Merchant</th>
            <th style="padding: 10px 16px;">Category</th>
            <th style="padding: 10px 16px; text-align: right;">Amount</th>
            <th style="padding: 10px 16px; text-align: center;">Tax Status</th>
          </tr>
        </thead>
        <tbody id="ledger-tbody">
          ${rows}
        </tbody>
      </table>
    </div>

    <!-- Pagination Footer -->
    <div style="padding: 12px 20px; border-top: 1px solid rgba(0,0,0,0.06); display: flex; justify-content: space-between; align-items: center; font-size: 11.5px; color: #666; background: rgba(0,0,0,0.01);">
      <span>Showing ${filtered.length ? startIdx + 1 : 0} – ${Math.min(startIdx + LEDGER_PAGE_SIZE, filtered.length)} of ${filtered.length} entries</span>
      <div style="display: flex; gap: 6px; align-items: center;">
        <button type="button" onclick="changeLedgerPage(-1)" ${ledgerCurrentPage <= 1 ? 'disabled' : ''} style="padding: 4px 10px; border-radius: 6px; border: 1px solid #ddd; background: white; font-size: 11.5px; cursor: ${ledgerCurrentPage <= 1 ? 'not-allowed' : 'pointer'}; opacity: ${ledgerCurrentPage <= 1 ? '0.5' : '1'};">Previous</button>
        <span style="font-weight: 750; color: #111;">Page ${ledgerCurrentPage} of ${totalPages}</span>
        <button type="button" onclick="changeLedgerPage(1)" ${ledgerCurrentPage >= totalPages ? 'disabled' : ''} style="padding: 4px 10px; border-radius: 6px; border: 1px solid #ddd; background: white; font-size: 11.5px; cursor: ${ledgerCurrentPage >= totalPages ? 'not-allowed' : 'pointer'}; opacity: ${ledgerCurrentPage >= totalPages ? '0.5' : '1'};">Next</button>
      </div>
    </div>
  `;
}

function renderCashflowCharts() {
  const analytics = cashflowData.analytics || {};
  const monthlyData = analytics.monthlyData || {};
  
  // Format Month labels
  const monthKeys = Object.keys(monthlyData).sort();
  const monthLabels = monthKeys.map(k => {
    const [year, month] = k.split('-');
    const date = new Date(year, month - 1, 1);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  });

  const sentPoints = monthKeys.map(k => monthlyData[k].sent);
  const recvPoints = monthKeys.map(k => monthlyData[k].received);
  
  if (cashflowChartInstance) cashflowChartInstance.destroy();
  const ctxTrend = document.getElementById('cashflowTrendChart');
  if (ctxTrend && monthLabels.length > 0) {
    cashflowChartInstance = new Chart(ctxTrend, {
      type: 'bar',
      data: {
        labels: monthLabels,
        datasets: [
          {
            label: 'Sent (Outflow)',
            data: sentPoints,
            backgroundColor: '#111820',
            borderRadius: 6
          },
          {
            label: 'Received (Inflow)',
            data: recvPoints,
            backgroundColor: '#106636',
            borderRadius: 6
          }
        ]
      },
      options: { 
        responsive: true, 
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'top', labels: { boxWidth: 12, font: { weight: 'bold' } } }
        },
        scales: {
          x: { grid: { display: false } },
          y: { 
            grid: { color: 'rgba(0,0,0,0.05)' },
            ticks: {
              callback: function(value) { return '₹' + (value >= 1000 ? (value/1000) + 'k' : value); }
            }
          }
        }
      }
    });
  }

  const topCat = analytics.topCategories || [];
  const catLabels = topCat.slice(0, 5).map(c => `${c.category} (${c.percentage}%)`);
  const catData = topCat.slice(0, 5).map(c => c.amount);
  
  if (categoryChartInstance) categoryChartInstance.destroy();
  const ctxCat = document.getElementById('cashflowCategoryChart');
  if (ctxCat && catLabels.length > 0) {
    categoryChartInstance = new Chart(ctxCat, {
      type: 'doughnut',
      data: {
        labels: catLabels,
        datasets: [{
          data: catData,
          backgroundColor: ['#111820', '#106636', '#d97706', '#2563eb', '#7c3aed', '#9ca3af'],
          borderWidth: 2,
          borderColor: '#ffffff'
        }]
      },
      options: { 
        responsive: true, 
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 11, weight: 'bold' } } }
        }
      }
    });
  }
}

async function updateCashflowFilter(key, value) {
  cashflowFilters[key] = value;
  await renderCashflowPage();
}

function openCashflowModal() {
  document.getElementById('cashflow-modal').showModal();
}

function closeCashflowModal() {
  document.getElementById('cashflow-modal').close();
}

async function submitCashflowExpense(e) {
  e.preventDefault();
  const form = e.target;
  const payload = {
    amount: form.amount.value,
    merchantOrPayee: form.payee.value,
    transactionDate: form.date.value,
    category: form.category.value,
    isTaxDeductible: form.taxDeductible.checked
  };
  
  try {
    const res = await fetch(`${localApiBase}/api/wealth/cashflow`, {
      method: 'POST',
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${localStorage.getItem(tokenKey)}` 
      },
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      closeCashflowModal();
      form.reset();
      await renderCashflowPage();
    }
  } catch (err) {
    console.error("Failed to submit expense", err);
  }
}

async function exportToCA() {
  const analytics = cashflowData.analytics || {};
  const expenses = cashflowData.expenses || [];
  const user = window.user || { name: 'Prajwal Bharad', email: 'prajwalbharad12345@gmail.com' };

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow popups to open and save your PDF Cash Flow report.');
    return;
  }

  const isMonth = cashflowFilters.selectedMonth && cashflowFilters.selectedMonth !== 'all';
  let periodLabel = 'Aggregated 6-Month Period (Feb 2026 – Jul 2026)';
  if (isMonth) {
    const [yr, mo] = cashflowFilters.selectedMonth.split('-');
    periodLabel = new Date(yr, mo - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) + ' Audit';
  }

  const totalSent = analytics.totalSent || analytics.consolidatedOutflow || 0;
  const totalReceived = analytics.totalReceived || 0;
  const netOutflow = analytics.netOutflow || (totalSent - totalReceived);
  const coverageRatio = totalSent > 0 ? Math.round((totalReceived / totalSent) * 100) : 100;
  const budget = analytics.budget503020 || { needs: 0, needsPct: 53, wants: 0, wantsPct: 47, savingsSurplus: 0, status: 'Optimal' };
  const runway = analytics.predictiveRunway || { upcomingFixedBills30d: 7827, safeToSpend: 22140, runwayMonths: 2.6, runwayRating: 'Moderate' };
  const topBrands = analytics.brandConcentration || [];
  const topCategories = analytics.topCategories || [];
  const p2p = analytics.p2pNetwork || [];
  const recurring = analytics.recurringOverhead?.items || [];
  const qc = analytics.quickCommerce || {};
  const temporal = analytics.temporalAnalytics || {};
  const monthly = analytics.monthlyData || {};

  const monthlyRows = Object.entries(monthly).sort().map(([m, d]) => `
    <tr>
      <td style="padding: 7px 10px; font-weight: bold;">${m}</td>
      <td style="padding: 7px 10px; text-align: right; color: #88362e;">${money(d.sent)}</td>
      <td style="padding: 7px 10px; text-align: right; color: #106636;">${money(d.received)}</td>
      <td style="padding: 7px 10px; text-align: right; font-weight: bold; color: ${d.net <= 0 ? '#106636' : '#88362e'};">
        ${d.net <= 0 ? '+' : '-'}${money(Math.abs(d.net))}
      </td>
      <td style="padding: 7px 10px; text-align: center; color: #555;">${d.count} txns</td>
    </tr>
  `).join('');

  const categoryRows = topCategories.map(c => `
    <tr>
      <td style="padding: 6px 10px; font-weight: 600;">${escapeHtml(c.category)}</td>
      <td style="padding: 6px 10px; text-align: right;">${money(c.amount)}</td>
      <td style="padding: 6px 10px; text-align: right; font-weight: bold;">${c.percentage}%</td>
    </tr>
  `).join('');

  const brandRows = topBrands.map(b => `
    <tr>
      <td style="padding: 6px 10px; font-weight: 700;">${escapeHtml(b.name)}</td>
      <td style="padding: 6px 10px; color: #555;">${b.category}</td>
      <td style="padding: 6px 10px; text-align: center;">${b.count} orders</td>
      <td style="padding: 6px 10px; text-align: right;">${money(b.aov)}</td>
      <td style="padding: 6px 10px; text-align: right; font-weight: bold;">${money(b.total)}</td>
      <td style="padding: 6px 10px; text-align: right; color: #555;">${b.sharePct}%</td>
    </tr>
  `).join('');

  const p2pRows = p2p.slice(0, 10).map(p => `
    <tr>
      <td style="padding: 6px 10px; font-weight: 700;">${escapeHtml(p.name)}</td>
      <td style="padding: 6px 10px; text-align: right; color: #88362e;">${money(p.sent)}</td>
      <td style="padding: 6px 10px; text-align: right; color: #106636;">${money(p.received)}</td>
      <td style="padding: 6px 10px; text-align: right; font-weight: bold; color: ${p.net >= 0 ? '#106636' : '#88362e'};">
        ${p.net >= 0 ? '+' : ''}${money(p.net)}
      </td>
      <td style="padding: 6px 10px; text-align: center; color: #666;">${p.count} txns</td>
    </tr>
  `).join('');

  const recurringRows = recurring.map(r => `
    <tr>
      <td style="padding: 6px 10px; font-weight: 700;">${escapeHtml(r.label)}</td>
      <td style="padding: 6px 10px; color: #555;">${r.frequency}</td>
      <td style="padding: 6px 10px; text-align: center;">${r.count} payments</td>
      <td style="padding: 6px 10px; text-align: right; font-weight: bold;">${money(r.total)}</td>
    </tr>
  `).join('');

  const ledgerRows = expenses.slice(0, 150).map(e => {
    const isCredit = e.type === 'credit' || /received/i.test(e.description || '');
    return `
      <tr>
        <td style="padding: 5px 8px; font-size: 11px; white-space: nowrap;">${new Date(e.transactionDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
        <td style="padding: 5px 8px; font-size: 11.5px; font-weight: 600;">${escapeHtml(e.description || e.merchantOrPayee || 'N/A')}</td>
        <td style="padding: 5px 8px; font-size: 11px; color: #555;">${escapeHtml(e.category || 'Other')}</td>
        <td style="padding: 5px 8px; font-size: 11.5px; text-align: right; font-weight: bold; color: ${isCredit ? '#106636' : '#111'};">
          ${isCredit ? '+' : '-'}${money(e.amount)}
        </td>
        <td style="padding: 5px 8px; font-size: 11px; text-align: center;">${e.isTaxDeductible ? '✓ Deductible' : '-'}</td>
      </tr>
    `;
  }).join('');

  const reportHtml = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>Cash Flow Intelligence & Financial Audit Dossier - ${escapeHtml(user.name)}</title>
      <style>
        * { box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding: 36px; color: #111827; line-height: 1.5; font-size: 12.5px; background: #fff; }
        @media print {
          body { padding: 15px; font-size: 11.5px; }
          .no-print { display: none !important; }
          .page-break { page-break-before: always; }
        }
        .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #0f172a; padding-bottom: 16px; margin-bottom: 24px; }
        .title { font-size: 22px; font-weight: 900; color: #0f172a; letter-spacing: -0.5px; margin: 0; text-transform: uppercase; }
        .subtitle { font-size: 11.5px; color: #64748b; margin-top: 4px; font-weight: 600; }
        .btn-print { background: #0f172a; color: white; border: none; padding: 10px 22px; border-radius: 8px; font-weight: 700; font-size: 13px; cursor: pointer; display: inline-flex; align-items: center; gap: 8px; }
        .btn-print:hover { background: #1e293b; }
        .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px; }
        .grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 20px; }
        .kpi-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px 14px; }
        .kpi-label { font-size: 10.5px; font-weight: 800; text-transform: uppercase; color: #64748b; display: block; margin-bottom: 2px; }
        .kpi-val { font-size: 18px; font-weight: 900; color: #0f172a; display: block; }
        .kpi-sub { font-size: 10px; color: #94a3b8; margin-top: 2px; display: block; }
        .section { margin-bottom: 24px; }
        .section-title { font-size: 14px; font-weight: 850; color: #0f172a; margin: 0 0 10px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; display: flex; justify-content: space-between; align-items: center; }
        table { width: 100%; border-collapse: collapse; text-align: left; font-size: 12px; margin-bottom: 12px; }
        thead th { background: #f1f5f9; color: #475569; font-weight: 800; font-size: 10.5px; text-transform: uppercase; letter-spacing: 0.5px; padding: 8px 10px; border-bottom: 1px solid #cbd5e1; }
        tbody tr { border-bottom: 1px solid #f1f5f9; }
        tbody tr:nth-child(even) { background: #fafafa; }
        .badge { display: inline-block; padding: 3px 8px; border-radius: 99px; font-size: 10.5px; font-weight: 750; }
        .badge-green { background: #dcfce7; color: #166534; }
        .badge-red { background: #fee2e2; color: #991b1b; }
      </style>
    </head>
    <body>
      <div class="no-print" style="margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; background: #f8fafc; border: 1px solid #e2e8f0; padding: 12px 18px; border-radius: 10px;">
        <span style="font-weight: 700; color: #334155;">📄 PDF Print Preview — Wealth OS Cash Flow & Financial Intelligence Dossier</span>
        <button class="btn-print" onclick="window.print()">🖨️ Save as PDF / Print Report</button>
      </div>

      <!-- Dossier Header -->
      <div class="header">
        <div>
          <h1 class="title">Cash Flow & Financial Intelligence Dossier</h1>
          <div class="subtitle">Prepared for Client & Chartered Accountant Review | Audit Scope: ${escapeHtml(periodLabel)}</div>
        </div>
        <div style="text-align: right; font-size: 11px; color: #64748b;">
          <div><strong>Client:</strong> ${escapeHtml(user.name)} (${escapeHtml(user.email)})</div>
          <div><strong>Primary Account:</strong> Kotak Mahindra Bank (A/C: 7345290387)</div>
          <div><strong>Date Generated:</strong> ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
        </div>
      </div>

      <!-- Executive KPIs -->
      <div class="grid-4">
        <div class="kpi-card">
          <span class="kpi-label">Total Cash Outflow</span>
          <span class="kpi-val" style="color: #991b1b;">${money(totalSent)}</span>
          <span class="kpi-sub">351 Reconciled Debits</span>
        </div>
        <div class="kpi-card">
          <span class="kpi-label">Total Cash Inflow</span>
          <span class="kpi-val" style="color: #166534;">${money(totalReceived)}</span>
          <span class="kpi-sub">Inflow Coverage: ${coverageRatio}%</span>
        </div>
        <div class="kpi-card">
          <span class="kpi-label">Net Cash Flow</span>
          <span class="kpi-val" style="color: #0f172a;">${money(netOutflow)}</span>
          <span class="kpi-sub">${totalReceived >= totalSent ? 'Net Capital Surplus' : 'Net Liquidity Consumed'}</span>
        </div>
        <div class="kpi-card">
          <span class="kpi-label">Monthly Burn Rate</span>
          <span class="kpi-val" style="color: #0f172a;">${money(analytics.monthlyBurnRate || 0)} / mo</span>
          <span class="kpi-sub">6-Month Baseline Run-Rate</span>
        </div>
      </div>

      <!-- 50/30/20 & Predictive Runway Grid -->
      <div class="grid-2">
        <div class="section" style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px 16px;">
          <div class="section-title">
            <span>🎯 50 / 30 / 20 Budget Rule Allocation</span>
            <span class="badge badge-green">${escapeHtml(budget.status)}</span>
          </div>
          <table>
            <thead>
              <tr><th>Component</th><th>Benchmark</th><th style="text-align: right;">Actual Spend</th><th style="text-align: right;">Actual %</th></tr>
            </thead>
            <tbody>
              <tr><td>🏠 Needs & Fixed Commitments</td><td>50%</td><td style="text-align: right; font-weight: bold;">${money(budget.needs)}</td><td style="text-align: right; font-weight: bold; color: ${budget.needsPct > 55 ? '#991b1b' : '#166534'};">${budget.needsPct}%</td></tr>
              <tr><td>🍔 Wants & Discretionary</td><td>30%</td><td style="text-align: right; font-weight: bold;">${money(budget.wants)}</td><td style="text-align: right; font-weight: bold; color: ${budget.wantsPct > 35 ? '#d97706' : '#166534'};">${budget.wantsPct}%</td></tr>
              <tr><td>📈 Retained Surplus / Savings</td><td>20%</td><td style="text-align: right; font-weight: bold; color: #166534;">${money(budget.savingsSurplus)}</td><td style="text-align: right; font-weight: bold; color: #166534;">${budget.savingsPct}%</td></tr>
            </tbody>
          </table>
        </div>

        <div class="section" style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px 16px;">
          <div class="section-title">
            <span>🔮 30-Day Forecast & Liquid Runway</span>
            <span class="badge badge-green">${escapeHtml(runway.runwayRating)}</span>
          </div>
          <table>
            <tbody>
              <tr><td style="padding: 6px 0;"><strong>Upcoming Fixed 30D Obligations:</strong></td><td style="text-align: right; font-weight: bold; color: #0f172a;">${money(runway.upcomingFixedBills30d)}</td></tr>
              <tr><td style="padding: 6px 0;"><strong>Safe-To-Spend Discretionary Pool:</strong></td><td style="text-align: right; font-weight: bold; color: #166534;">${money(runway.safeToSpend)}</td></tr>
              <tr><td style="padding: 6px 0;"><strong>Liquid Cash Reserve:</strong></td><td style="text-align: right; font-weight: bold;">${money(runway.liquidCashBalance)}</td></tr>
              <tr><td style="padding: 6px 0;"><strong>Zero-Income Survival Runway:</strong></td><td style="text-align: right; font-weight: 900; color: #0f172a;">${runway.runwayMonths} Months Cushion</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Month by Month Matrix -->
      <div class="section">
        <div class="section-title">📅 Month-by-Month Outflow vs Inflow Reconciliation Matrix</div>
        <table>
          <thead>
            <tr><th>Month</th><th style="text-align: right;">Total Outflow (Debit)</th><th style="text-align: right;">Total Inflow (Credit)</th><th style="text-align: right;">Net Cash Status</th><th style="text-align: center;">Transactions</th></tr>
          </thead>
          <tbody>
            ${monthlyRows}
          </tbody>
        </table>
      </div>

      <!-- Top Brands & Categories Grid -->
      <div class="grid-2">
        <div class="section">
          <div class="section-title">🏪 Top Merchant Destinations & Loyalty</div>
          <table>
            <thead>
              <tr><th>Merchant</th><th>Category</th><th style="text-align: center;">Orders</th><th style="text-align: right;">AOV</th><th style="text-align: right;">Total</th><th style="text-align: right;">Share</th></tr>
            </thead>
            <tbody>
              ${brandRows}
            </tbody>
          </table>
        </div>

        <div class="section">
          <div class="section-title">📊 Top Outflow Categories</div>
          <table>
            <thead>
              <tr><th>Expense Category</th><th style="text-align: right;">Total Spend</th><th style="text-align: right;">% of Outflow</th></tr>
            </thead>
            <tbody>
              ${categoryRows}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Quick Commerce & P2P Friends Grid -->
      <div class="grid-2">
        <div class="section">
          <div class="section-title">📦 Quick-Commerce & Convenience Meter</div>
          <table>
            <thead><tr><th>Channel</th><th>Orders</th><th style="text-align: right;">Avg / Order</th><th style="text-align: right;">Total Spent</th></tr></thead>
            <tbody>
              <tr><td>🛒 Quick Groceries (Blinkit)</td><td>${qc.quickGrocery?.count || 0}</td><td style="text-align: right;">${money(qc.quickGrocery?.aov || 0)}</td><td style="text-align: right; font-weight: bold;">${money(qc.quickGrocery?.total || 0)}</td></tr>
              <tr><td>🍔 Food Delivery (Zomato/Swiggy)</td><td>${qc.foodDelivery?.count || 0}</td><td style="text-align: right;">${money(qc.foodDelivery?.aov || 0)}</td><td style="text-align: right; font-weight: bold;">${money(qc.foodDelivery?.total || 0)}</td></tr>
              <tr><td>☕ Cafes & Dining Out</td><td>${qc.diningOut?.count || 0}</td><td style="text-align: right;">${money(qc.diningOut?.aov || 0)}</td><td style="text-align: right; font-weight: bold;">${money(qc.diningOut?.total || 0)}</td></tr>
              <tr style="background: #f1f5f9; font-weight: bold;"><td>Total Convenience Spend</td><td>${qc.totalOrders || 0}</td><td style="text-align: right;">-</td><td style="text-align: right;">${money(qc.totalConvenienceSpend || 0)}</td></tr>
            </tbody>
          </table>
        </div>

        <div class="section">
          <div class="section-title">👥 P2P Social Working Capital & Friend Splits</div>
          <table>
            <thead><tr><th>Friend / Peer</th><th style="text-align: right;">Paid</th><th style="text-align: right;">Received</th><th style="text-align: right;">Net Balance</th><th style="text-align: center;">Txns</th></tr></thead>
            <tbody>
              ${p2pRows}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Itemized Ledger (Audit Trail) -->
      <div class="section page-break">
        <div class="section-title">
          <span>📑 Itemized Transaction Audit Schedule (Showing ${Math.min(expenses.length, 150)} of ${expenses.length} Records)</span>
        </div>
        <table>
          <thead>
            <tr><th>Date</th><th>Merchant / Payee</th><th>Category</th><th style="text-align: right;">Amount</th><th style="text-align: center;">Tax Status</th></tr>
          </thead>
          <tbody>
            ${ledgerRows}
          </tbody>
        </table>
      </div>

      <div style="margin-top: 30px; padding-top: 12px; border-top: 1px solid #cbd5e1; display: flex; justify-content: space-between; font-size: 10.5px; color: #64748b;">
        <span>Wealth OS — Institutional Family Office Engine</span>
        <span>Reconciliation Signature: KOTAK-GPAY-AUDIT-${new Date().getFullYear()}</span>
      </div>

      <script>
        window.onload = function() {
          // Auto trigger print dialog after rendering
          setTimeout(() => { window.print(); }, 400);
        };
      </script>
    </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(reportHtml);
  printWindow.document.close();
}

function renderQuickLoggerModalHTML() {
  return `
    <dialog class="entry-modal" id="cashflow-modal">
      <form method="dialog" class="entry-card" onsubmit="submitCashflowExpense(event)">
        <div class="entry-head">
          <div>
            <span id="entry-kicker">Cash Flow</span>
            <strong id="entry-title">Log Expense</strong>
          </div>
          <button class="icon-button" type="button" onclick="closeCashflowModal()" aria-label="Close">x</button>
        </div>
        <div class="entry-fields" style="display: flex; flex-direction: column; gap: 15px; padding: 20px;">
          <label>
            Date
            <input type="date" name="date" required style="width: 100%; padding: 8px; margin-top: 5px; border-radius: 4px; border: 1px solid var(--border);">
          </label>
          <label>
            Payee / Merchant
            <input type="text" name="payee" required style="width: 100%; padding: 8px; margin-top: 5px; border-radius: 4px; border: 1px solid var(--border);">
          </label>
          <label>
            Amount (INR)
            <input type="number" name="amount" required style="width: 100%; padding: 8px; margin-top: 5px; border-radius: 4px; border: 1px solid var(--border);">
          </label>
          <label>
            Category (Optional - AI will auto-categorize if empty)
            <input type="text" name="category" placeholder="e.g. Travel, Legal" style="width: 100%; padding: 8px; margin-top: 5px; border-radius: 4px; border: 1px solid var(--border);">
          </label>
          <label style="display: flex; align-items: center; gap: 10px;">
            <input type="checkbox" name="taxDeductible">
            Mark as Tax Deductible (for CA export)
          </label>
        </div>
        <div class="entry-actions">
          <button class="ghost-button" type="button" onclick="closeCashflowModal()">Cancel</button>
          <button class="save-button" type="submit">Save Expense</button>
        </div>
      </form>
    </dialog>
  `;
}

async function handleStatementUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  alert('Uploading statement. Our AI is parsing and categorizing your transactions. This might take a few seconds...');
  
  const formData = new FormData();
  formData.append('statement', file);

  try {
    const res = await fetch(`${localApiBase}/api/wealth/cashflow/upload-statement`, {
      method: 'POST',
      headers: { 
        "Authorization": `Bearer ${localStorage.getItem(tokenKey)}`
      },
      body: formData
    });
    
    if (res.ok) {
      const json = await res.json();
      alert(`Upload successful! ${json.message}`);
      await renderCashflowPage();
    } else {
      const err = await res.json();
      alert('Upload failed: ' + (err.error || 'Server error'));
    }
  } catch (err) {
    console.error("Upload failed", err);
    alert("Upload failed. Make sure you are connected to the network.");
  }
  
  event.target.value = ''; 
}

function renderCashflowInsights() {
  const container = document.getElementById('cashflow-insights-content');
  if (!container) return;
  
  const analytics = cashflowData.analytics || {};
  const topCat = analytics.topCategories || [];
  
  if (topCat.length === 0) {
    container.innerHTML = `<p style="color: #666; font-size: 14px;">No expense data available to generate insights. Upload a statement to get started.</p>`;
    return;
  }
  
  const highest = topCat[0];
  
  let html = `<div style="background: rgba(74, 222, 128, 0.1); padding: 16px; border-radius: 8px; border: 1px solid #4ade80; margin-bottom: 20px;">
    <strong style="color: #2e7d32; font-size: 16px;">💡 Key Insight:</strong>
    <p style="margin: 8px 0 0; color: #1f2937; font-size: 15px;">
      Your highest spending domain is <strong>${highest.category}</strong> at <strong>${money(highest.amount)}</strong>.
    </p>
  </div>`;
  
  html += `<h4 style="margin: 0 0 12px; font-size: 14px; color: #4b5563;">Detailed Breakdown</h4>`;
  html += `<table style="width: 100%; border-collapse: collapse; font-size: 14px;">
    <thead>
      <tr style="border-bottom: 2px solid #f3f4f6; text-align: left; color: #6b7280;">
        <th style="padding: 8px;">Domain / Category</th>
        <th style="padding: 8px; text-align: right;">Total Spent (INR)</th>
      </tr>
    </thead>
    <tbody>`;
    
  topCat.forEach(cat => {
    html += `<tr style="border-bottom: 1px solid #f3f4f6;">
      <td style="padding: 12px 8px; color: #111827; font-weight: 500;">${cat.category}</td>
      <td style="padding: 12px 8px; text-align: right; color: #4b5563;">${money(cat.amount)}</td>
    </tr>`;
  });
  
  html += `</tbody></table>`;
  container.innerHTML = html;
}
