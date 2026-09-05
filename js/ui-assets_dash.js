
window.syncAssetSpinnyValue = function(assetId) {
  const asset = state.assets.find(item => item.id === assetId);
  if (!asset) return;
  const valuation = usedCarValuation(asset);
  if (!valuation) {
    alert("Please enter buying price first to estimate resale value.");
    return;
  }
  const today = new Date().toISOString().slice(0, 10);
  asset.value = valuation.value;
  asset.source = valuation.label;
  asset.valuationBasis = valuation.basis;
  asset.estimatedValueDate = today;
  asset.valuationLow = valuation.low;
  asset.valuationHigh = valuation.high;
  asset.valuationConfidence = valuation.confidence;
  if (valuation.engineJson) asset.vehicleValuationJson = JSON.stringify(valuation.engineJson);
  asset.lastUpdated = today;
  
  if (typeof saveState === 'function') saveState();
  if (typeof renderAssetDetail === 'function') renderAssetDetail(assetId);
  if (typeof refreshMetrics === 'function') refreshMetrics();
  
  const saveStateLabel = document.getElementById("save-state");
  if (saveStateLabel) {
    saveStateLabel.textContent = "Synced to Spinny valuation: " + money(valuation.value) + " (" + valuation.ageMonths + " mos old, -" + money(valuation.monthlyDepreciation) + "/mo decay)";
  }
};

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
    
    <!-- Financed Assets & Ongoing Loans Tracker -->
    ${renderFinancedAssetsLoanCard()}

    <!-- Row: Passive Cash Flow Yield & CFA Asset Allocation Drift (2 Equal Columns) -->
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(340px, 1fr)); gap: 16px; margin-bottom: 16px;">
      ${renderAssetPassiveCashflowEngine()}
      ${renderAssetAllocationRebalancer()}
    </div>

    <!-- Row: Succession Protection Radar & Collateral Borrowing Power (2 Equal Columns) -->
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(340px, 1fr)); gap: 16px; margin-bottom: 16px;">
      ${renderAssetSuccessionRadar()}
      ${renderAssetCollateralBorrowingPower()}
    </div>

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

window.toggleFinancedAssetsExpansion = function() {
  const el = document.getElementById('financed-assets-extended-list');
  const btn = document.getElementById('toggle-financed-assets-btn');
  const icon = document.getElementById('financed-toggle-icon');
  if (!el || !btn) return;
  const isHidden = el.style.display === 'none' || !el.style.display;
  if (isHidden) {
    el.style.display = 'flex';
    btn.querySelector('span:first-child').textContent = '▲ Collapse to 1 Loan';
    if (icon) icon.style.transform = 'rotate(180deg)';
  } else {
    el.style.display = 'none';
    const remainingCount = el.children.length;
    btn.querySelector('span:first-child').textContent = `+ View ${remainingCount} More Ongoing Loan${remainingCount > 1 ? 's' : ''}`;
    if (icon) icon.style.transform = 'rotate(0deg)';
  }
};

function renderSingleFinancedAssetCard(item) {
  return `
    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; transition: all 0.15s ease;">
      <!-- Row 1: Header & Value -->
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
        <div>
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 2px;">
            <strong style="font-size: 14.5px; color: #0f172a;">${escapeHtml(item.name)}</strong>
            <span style="background: white; border: 1px solid #cbd5e1; padding: 2px 8px; border-radius: 99px; font-size: 10px; font-weight: 750; color: #475569;">${escapeHtml(item.type)}</span>
          </div>
          <small style="color: #64748b; font-size: 11px;">Current Market Value: <b>${money(item.currentValue)}</b> • Purchase Price: ${money(item.purchasePrice)}</small>
        </div>
        <div style="text-align: right;">
          <span style="font-size: 10.5px; color: #64748b; display: block;">Outstanding Loan Balance</span>
          <strong style="font-size: 16px; color: #dc2626;">${money(item.outstandingLoan)}</strong>
        </div>
      </div>

      <!-- Row 2: Loan Progress Bar -->
      <div style="margin-bottom: 12px;">
        <div style="display: flex; justify-content: space-between; font-size: 10.5px; margin-bottom: 4px;">
          <span style="color: #16a34a; font-weight: 700;">✓ Principal Repaid: ${money(item.principalPaid)} (${item.repaidPercent}%)</span>
          <span style="color: #dc2626; font-weight: 700;">Remaining Debt: ${money(item.outstandingLoan)} (${100 - item.repaidPercent}%)</span>
        </div>
        <div style="width: 100%; height: 8px; background: #e2e8f0; border-radius: 99px; overflow: hidden; display: flex;">
          <div style="width: ${item.repaidPercent}%; height: 100%; background: linear-gradient(90deg, #16a34a, #22c55e); border-radius: 99px 0 0 99px;"></div>
          <div style="width: ${100 - item.repaidPercent}%; height: 100%; background: linear-gradient(90deg, #ef4444, #dc2626); border-radius: 0 99px 99px 0;"></div>
        </div>
      </div>

      <!-- Row 3: 4 Key Metrics Grid -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 8px; background: white; padding: 10px 12px; border-radius: 8px; border: 1px solid #e2e8f0;">
        <div>
          <span style="font-size: 10px; color: #64748b; display: block;">Original Loan Borrowed</span>
          <strong style="font-size: 12.5px; color: #0f172a;">${money(item.loanAmount)}</strong>
          <small style="font-size: 9.5px; color: #94a3b8; display: block;">Down payment: ${money(item.downPayment)}</small>
        </div>
        <div>
          <span style="font-size: 10px; color: #64748b; display: block;">Monthly EMI</span>
          <strong style="font-size: 12.5px; color: #0f172a;">${money(item.emi)}</strong>
          <small style="font-size: 9.5px; color: #94a3b8; display: block;">Rate: ${item.interestRate}% (${item.loanType})</small>
        </div>
        <div>
          <span style="font-size: 10px; color: #64748b; display: block;">EMIs Completed / Left</span>
          <strong style="font-size: 12.5px; color: #0f172a;">${item.completedEmis} / ${item.tenureMonths} EMIs</strong>
          <small style="font-size: 9.5px; color: #dc2626; display: block;">${item.remainingMonths} months left</small>
        </div>
        <div>
          <span style="font-size: 10px; color: #64748b; display: block;">Net Equity Owned</span>
          <strong style="font-size: 12.5px; color: #16a34a;">${money(item.equity)}</strong>
          <small style="font-size: 9.5px; color: #16a34a; display: block;">LTV: ${item.ltv}%</small>
        </div>
      </div>
    </div>
  `;
}

// 0. Financed Assets & Ongoing Loans Tracker
function renderFinancedAssetsLoanCard() {
  const nonCash = nonCashAssets();
  const financedAssets = [];

  nonCash.forEach(asset => {
    if (isTruthy(asset.hasLoan) && Number(asset.loanAmount || 0) > 0) {
      const snap = financedAssetSnapshot(asset);
      financedAssets.push({
        asset,
        name: asset.name || 'Financed Asset',
        type: asset.type || asset.category || 'Asset',
        currentValue: Number(asset.value || 0),
        purchasePrice: Number(asset.purchasePrice || 0),
        loanAmount: snap.loan.loanAmount,
        downPayment: snap.loan.downPayment,
        outstandingLoan: snap.outstandingLoan,
        emi: snap.loan.emi,
        interestRate: snap.loan.annualRate,
        tenureMonths: snap.loan.tenureMonths,
        completedEmis: snap.loan.completedEmis,
        remainingMonths: snap.loan.remainingMonths,
        principalPaid: snap.loan.principalPaidToDate,
        interestPaid: snap.loan.interestPaidToDate,
        totalInterestPayable: snap.loan.totalInterestPayable,
        equity: snap.equity,
        loanType: snap.loan.loanType,
        ltv: snap.currentValue > 0 ? Math.round((snap.outstandingLoan / snap.currentValue) * 100) : 0,
        repaidPercent: snap.loan.loanAmount > 0 ? Math.round((snap.loan.principalPaidToDate / snap.loan.loanAmount) * 100) : 0
      });
    }
  });

  // Also check if any standalone liabilities mention an asset or have linkedAssetId
  (state.liabilities || []).forEach(lib => {
    const isLoan = /loan|mortgage|emi/i.test(lib.type || lib.name || '');
    if (isLoan && !financedAssets.some(f => f.asset.name === lib.name || f.asset.id === lib.linkedAssetId)) {
      const val = Number(lib.value || lib.balance || lib.amount || 0);
      if (val > 0) {
        financedAssets.push({
          asset: { id: lib.id, name: lib.name },
          name: lib.name || 'Unlinked Loan',
          type: lib.type || 'Liability',
          currentValue: val,
          purchasePrice: val,
          loanAmount: val,
          downPayment: 0,
          outstandingLoan: val,
          emi: Number(lib.emi || 0),
          interestRate: Number(lib.rate || 0),
          tenureMonths: 12,
          completedEmis: 0,
          remainingMonths: 12,
          principalPaid: 0,
          interestPaid: 0,
          totalInterestPayable: 0,
          equity: 0,
          loanType: 'Reducing Balance',
          ltv: 100,
          repaidPercent: 0
        });
      }
    }
  });

  const totalOutstandingDebt = financedAssets.reduce((sum, item) => sum + item.outstandingLoan, 0);
  const totalMonthlyEmi = financedAssets.reduce((sum, item) => sum + item.emi, 0);
  const totalNetEquity = financedAssets.reduce((sum, item) => sum + item.equity, 0);

  if (financedAssets.length === 0) {
    return `
      <div style="background: white; border-radius: 16px; padding: 18px 20px; border: 1px solid rgba(0,0,0,0.06); box-shadow: 0 4px 16px rgba(0,0,0,0.03); margin-bottom: 20px;">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
          <div style="display: flex; align-items: center; gap: 10px;">
            <div style="width: 36px; height: 36px; border-radius: 10px; background: rgba(16, 102, 54, 0.08); display: flex; align-items: center; justify-content: center; font-size: 17px;">
              💳
            </div>
            <div>
              <h3 style="margin: 0; font-size: 14.5px; font-weight: 850; color: #0f172a;">Ongoing Loans & Financed Purchases</h3>
              <p style="margin: 2px 0 0; font-size: 11px; color: #64748b;">100% Unencumbered Portfolio — All assets are fully owned with zero active debt</p>
            </div>
          </div>
          <span style="font-size: 11px; font-weight: 800; color: #106636; background: rgba(16, 102, 54, 0.08); padding: 4px 10px; border-radius: 99px;">
            ✓ Debt Free
          </span>
        </div>
      </div>
    `;
  }

  const primaryLoan = financedAssets[0];
  const remainingLoans = financedAssets.slice(1);

  return `
    <div style="background: white; border-radius: 16px; padding: 22px; border: 1px solid rgba(0,0,0,0.06); box-shadow: 0 4px 16px rgba(0,0,0,0.03); margin-bottom: 20px;">
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; margin-bottom: 16px; border-bottom: 1px solid rgba(0,0,0,0.06); padding-bottom: 14px;">
        <div style="display: flex; align-items: center; gap: 10px;">
          <div style="width: 40px; height: 40px; border-radius: 10px; background: rgba(220, 38, 38, 0.08); display: flex; align-items: center; justify-content: center; font-size: 20px;">
            💳
          </div>
          <div>
            <h3 style="margin: 0; font-size: 16px; font-weight: 900; color: #0f172a;">Ongoing Loans & Financed Purchases</h3>
            <p style="margin: 2px 0 0; font-size: 11.5px; color: #64748b;">Track remaining principal, monthly EMIs, and net asset equity</p>
          </div>
        </div>
        <div style="display: flex; gap: 10px; align-items: center; flex-wrap: wrap;">
          <div style="background: #f8fafc; padding: 6px 12px; border-radius: 8px; font-size: 11.5px;">
            <span style="color: #64748b;">Total Debt:</span> <strong style="color: #dc2626;">${money(totalOutstandingDebt)}</strong>
          </div>
          <div style="background: #f8fafc; padding: 6px 12px; border-radius: 8px; font-size: 11.5px;">
            <span style="color: #64748b;">Monthly EMI:</span> <strong style="color: #0f172a;">${money(totalMonthlyEmi)} / mo</strong>
          </div>
          <div style="background: rgba(16, 102, 54, 0.08); padding: 6px 12px; border-radius: 8px; font-size: 11.5px;">
            <span style="color: #106636;">Net Owned Equity:</span> <strong style="color: #106636;">${money(totalNetEquity)}</strong>
          </div>
        </div>
      </div>

      <!-- 1st Loan (Always Visible) -->
      <div style="display: flex; flex-direction: column; gap: 14px;">
        ${renderSingleFinancedAssetCard(primaryLoan)}

        ${remainingLoans.length > 0 ? `
          <!-- Remaining Loans (Hidden behind toggle button) -->
          <div id="financed-assets-extended-list" style="display: none; flex-direction: column; gap: 14px;">
            ${remainingLoans.map(renderSingleFinancedAssetCard).join('')}
          </div>

          <!-- Little Button to Toggle the Rest of the Ongoing Loans -->
          <div style="display: flex; justify-content: center; margin-top: 4px;">
            <button type="button" id="toggle-financed-assets-btn" onclick="toggleFinancedAssetsExpansion()" style="display: inline-flex; align-items: center; gap: 8px; padding: 8px 18px; border-radius: 99px; border: 1px solid rgba(0,0,0,0.1); background: #f8fafc; color: #0f172a; font-size: 12px; font-weight: 800; cursor: pointer; transition: all 0.2s ease;">
              <span>+ View ${remainingLoans.length} More Ongoing Loan${remainingLoans.length > 1 ? 's' : ''}</span>
              <span id="financed-toggle-icon" style="font-size: 10px; transition: transform 0.2s ease;">▼</span>
            </button>
          </div>
        ` : ''}
      </div>
    </div>
  `;
}

// 1. Passive Income Yield & Freedom Score Engine
function renderAssetPassiveCashflowEngine() {
  const assets = state.assets || [];
  const cash = cashBalance();

  let rentalIncomeAnnual = 0;
  let dividendIncomeAnnual = 0;
  let interestIncomeAnnual = 0;

  assets.forEach(a => {
    const val = Number(a.value) || 0;
    const type = String(a.type || a.category || '').toLowerCase();
    const name = String(a.name || '').toLowerCase();

    if (/flat|apartment|house|real estate|land|property/i.test(type + ' ' + name)) {
      rentalIncomeAnnual += val * 0.035; // 3.5% avg rental yield in India
    } else if (/stock|equity|fund|mutual|etf|share|investment/i.test(type + ' ' + name)) {
      dividendIncomeAnnual += val * 0.015; // 1.5% dividend yield
    } else if (/fd|fixed deposit|bond|ppf|epf|nps/i.test(type + ' ' + name)) {
      interestIncomeAnnual += val * 0.071; // 7.1% interest
    }
  });

  // Cash interest (Kotak / Savings Bank 3.5%)
  interestIncomeAnnual += cash * 0.035;

  const totalPassiveAnnual = rentalIncomeAnnual + dividendIncomeAnnual + interestIncomeAnnual;
  const totalPassiveMonthly = Math.round(totalPassiveAnnual / 12);
  const baselineMonthlyBurn = Number(state.cash?.expenses) || 13215;
  const freedomScore = baselineMonthlyBurn > 0 ? Math.min(100, Math.round((totalPassiveMonthly / baselineMonthlyBurn) * 100)) : 0;

  return `
    <div style="background: white; border-radius: 14px; padding: 18px 20px; border: 1px solid rgba(0,0,0,0.06); box-shadow: 0 2px 10px rgba(0,0,0,0.02); height: 100%; display: flex; flex-direction: column; justify-content: space-between;">
      <div>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
          <h3 style="margin: 0; font-size: 15px; font-weight: 850;">Passive Cash Flow & Freedom Score</h3>
          <span style="font-size: 10.5px; font-weight: 750; padding: 3px 8px; border-radius: 99px; background: rgba(16, 102, 54, 0.08); color: #106636;">
            ${freedomScore >= 100 ? 'Financially Independent' : `${freedomScore}% Freedom Score`}
          </span>
        </div>
        <p style="margin: 0 0 12px; font-size: 11px; color: #777;">Yield generated by assets without touching principal capital</p>
      </div>

      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-bottom: 10px;">
        <div style="background: rgba(0,0,0,0.015); padding: 9px 10px; border-radius: 10px;">
          <span style="font-size: 10px; color: #777; display: block;">Rental Yield</span>
          <strong style="font-size: 14px; color: #111;">${money(Math.round(rentalIncomeAnnual / 12))}/mo</strong>
          <small style="font-size: 9.5px; color: #888; display: block;">~3.5% p.a.</small>
        </div>
        <div style="background: rgba(0,0,0,0.015); padding: 9px 10px; border-radius: 10px;">
          <span style="font-size: 10px; color: #777; display: block;">Dividends</span>
          <strong style="font-size: 14px; color: #111;">${money(Math.round(dividendIncomeAnnual / 12))}/mo</strong>
          <small style="font-size: 9.5px; color: #888; display: block;">~1.5% p.a.</small>
        </div>
        <div style="background: rgba(0,0,0,0.015); padding: 9px 10px; border-radius: 10px;">
          <span style="font-size: 10px; color: #777; display: block;">Interest Yield</span>
          <strong style="font-size: 14px; color: #111;">${money(Math.round(interestIncomeAnnual / 12))}/mo</strong>
          <small style="font-size: 9.5px; color: #888; display: block;">FD + Bank</small>
        </div>
      </div>

      <div style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 12px 14px; border-radius: 10px; color: white; display: flex; justify-content: space-between; align-items: center;">
        <div>
          <span style="font-size: 10.5px; color: #94a3b8; display: block;">Total Estimated Passive Inflow</span>
          <strong style="font-size: 17px; color: white;">${money(totalPassiveMonthly)} / month</strong>
          <small style="font-size: 10px; color: #cbd5e1; display: block; margin-top: 1px;">Covers ${freedomScore}% of ${money(baselineMonthlyBurn)} monthly living expenses</small>
        </div>
      </div>
    </div>
  `;
}

// 2. CFA Dynamic Asset Allocation & Rebalancing Matrix
function renderAssetAllocationRebalancer() {
  const assets = state.assets || [];
  const cash = cashBalance();
  
  let equityVal = 0;
  let realEstateVal = 0;
  let debtVal = 0;
  let goldVal = 0;
  let vehicleVal = 0;

  assets.forEach(a => {
    const val = Number(a.value) || 0;
    const type = String(a.type || a.category || '').toLowerCase();
    const name = String(a.name || '').toLowerCase();

    if (/stock|equity|fund|mutual|etf|share|investment/i.test(type + ' ' + name)) equityVal += val;
    else if (/flat|land|property|real estate|site|apartment/i.test(type + ' ' + name)) realEstateVal += val;
    else if (/fd|fixed deposit|bond|ppf|epf|nps/i.test(type + ' ' + name)) debtVal += val;
    else if (/gold|silver|metal|jewel/i.test(type + ' ' + name)) goldVal += val;
    else if (/car|vehicle|bike/i.test(type + ' ' + name)) vehicleVal += val;
  });

  const totalPortfolio = Math.max(1, equityVal + realEstateVal + debtVal + goldVal + vehicleVal + cash);
  const eqPct = Math.round((equityVal / totalPortfolio) * 100);
  const rePct = Math.round((realEstateVal / totalPortfolio) * 100);
  const debtPct = Math.round(((debtVal + cash) / totalPortfolio) * 100);
  const goldPct = Math.round((goldVal / totalPortfolio) * 100);

  return `
    <div style="background: white; border-radius: 14px; padding: 18px 20px; border: 1px solid rgba(0,0,0,0.06); box-shadow: 0 2px 10px rgba(0,0,0,0.02); height: 100%; display: flex; flex-direction: column; justify-content: space-between;">
      <div>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
          <h3 style="margin: 0; font-size: 15px; font-weight: 850;">⚖️ CFA Portfolio Allocation & Drift</h3>
          <span style="font-size: 10.5px; font-weight: 750; padding: 3px 8px; border-radius: 99px; background: rgba(0,0,0,0.04); color: #111;">Target: Moderate Growth</span>
        </div>
        <p style="margin: 0 0 12px; font-size: 11px; color: #777;">Institutional target vs actual portfolio concentration</p>
      </div>

      <div style="display: flex; flex-direction: column; gap: 7px;">
        <div>
          <div style="display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 3px;">
            <span>📈 Equities & Funds (Target: 45%)</span>
            <strong>${eqPct}% (${money(equityVal)})</strong>
          </div>
          <div style="height: 5px; background: rgba(0,0,0,0.05); border-radius: 99px; overflow: hidden;">
            <div style="width: ${Math.min(100, eqPct)}%; height: 100%; background: #3b82f6;"></div>
          </div>
        </div>

        <div>
          <div style="display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 3px;">
            <span>🏢 Real Estate & Land (Target: 30%)</span>
            <strong>${rePct}% (${money(realEstateVal)})</strong>
          </div>
          <div style="height: 5px; background: rgba(0,0,0,0.05); border-radius: 99px; overflow: hidden;">
            <div style="width: ${Math.min(100, rePct)}%; height: 100%; background: #10b981;"></div>
          </div>
        </div>

        <div>
          <div style="display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 3px;">
            <span>🛡️ Debt, Cash & Reserves (Target: 15%)</span>
            <strong>${debtPct}% (${money(debtVal + cash)})</strong>
          </div>
          <div style="height: 5px; background: rgba(0,0,0,0.05); border-radius: 99px; overflow: hidden;">
            <div style="width: ${Math.min(100, debtPct)}%; height: 100%; background: #8b5cf6;"></div>
          </div>
        </div>

        <div>
          <div style="display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 3px;">
            <span>🥇 Gold & Precious Metals (Target: 10%)</span>
            <strong>${goldPct}% (${money(goldVal)})</strong>
          </div>
          <div style="height: 5px; background: rgba(0,0,0,0.05); border-radius: 99px; overflow: hidden;">
            <div style="width: ${Math.min(100, goldPct)}%; height: 100%; background: #f59e0b;"></div>
          </div>
        </div>
      </div>
    </div>
  `;
}

// 3. Nominee & Succession Coverage Radar (Probate Risk Detector)
function renderAssetSuccessionRadar() {
  const assets = state.assets || [];
  const nonCash = nonCashAssets();
  const totalVal = nonCash.reduce((s, a) => s + (Number(a.value) || 0), 0);

  const protectedAssets = nonCash.filter(a => a.nominee || a.beneficiary || a.owner || a.willAssigned);
  const protectedVal = protectedAssets.reduce((s, a) => s + (Number(a.value) || 0), 0);
  const unassignedVal = Math.max(0, totalVal - protectedVal);
  const coveragePct = totalVal > 0 ? Math.round((protectedVal / totalVal) * 100) : 100;

  return `
    <div style="background: white; border-radius: 14px; padding: 18px 20px; border: 1px solid rgba(0,0,0,0.06); box-shadow: 0 2px 10px rgba(0,0,0,0.02); height: 100%; display: flex; flex-direction: column; justify-content: space-between;">
      <div>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
          <h3 style="margin: 0; font-size: 15px; font-weight: 850;">🏛️ Succession & Nominee Protection</h3>
          <span style="font-size: 10.5px; font-weight: 750; padding: 3px 8px; border-radius: 99px; background: ${coveragePct >= 80 ? 'rgba(16, 102, 54, 0.08)' : 'rgba(239, 68, 68, 0.08)'}; color: ${coveragePct >= 80 ? '#106636' : '#991b1b'};">
            ${coveragePct}% Value Protected
          </span>
        </div>
        <p style="margin: 0 0 12px; font-size: 11px; color: #777;">Prevents assets from getting frozen in probate upon succession</p>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 10px;">
        <div style="background: rgba(16, 102, 54, 0.04); padding: 10px 12px; border-radius: 10px; border: 1px solid rgba(16, 102, 54, 0.1);">
          <span style="font-size: 10.5px; color: #106636; font-weight: 750; display: block;">Protected Wealth</span>
          <strong style="font-size: 16px; color: #106636;">${money(protectedVal)}</strong>
          <small style="font-size: 10px; color: #555; display: block;">${protectedAssets.length} assets with legal heir</small>
        </div>
        <div style="background: rgba(239, 68, 68, 0.04); padding: 10px 12px; border-radius: 10px; border: 1px solid rgba(239, 68, 68, 0.1);">
          <span style="font-size: 10.5px; color: #991b1b; font-weight: 750; display: block;">Probate Risk Pool</span>
          <strong style="font-size: 16px; color: #991b1b;">${money(unassignedVal)}</strong>
          <small style="font-size: 10px; color: #777; display: block;">${nonCash.length - protectedAssets.length} unmapped assets</small>
        </div>
      </div>

      <div style="background: #f8fafc; padding: 10px 12px; border-radius: 8px; display: flex; justify-content: space-between; align-items: center; font-size: 11px;">
        <span style="color: #475569;">${coveragePct >= 80 ? '✓ Estate succession readiness is strong.' : '⚠️ Action recommended: Assign nominees in Digital Will.'}</span>
        <button type="button" onclick="renderView('willVault')" style="background: #0f172a; color: white; border: none; padding: 4px 10px; border-radius: 6px; font-size: 10.5px; font-weight: 700; cursor: pointer;">Vault ➔</button>
      </div>
    </div>
  `;
}

// 4. Collateral & LTV Borrowing Power Radar
function renderAssetCollateralBorrowingPower() {
  const assets = state.assets || [];

  let lasEquityCapacity = 0; // 50% on shares
  let goldCapacity = 0; // 75% on gold
  let lapPropertyCapacity = 0; // 60% on property
  let fdCapacity = 0; // 90% on FD

  assets.forEach(a => {
    const val = Number(a.value) || 0;
    const type = String(a.type || a.category || '').toLowerCase();
    const name = String(a.name || '').toLowerCase();

    if (/stock|equity|fund|mutual|etf|share|investment/i.test(type + ' ' + name)) {
      lasEquityCapacity += val * 0.50;
    } else if (/gold|silver|metal|jewel/i.test(type + ' ' + name)) {
      goldCapacity += val * 0.75;
    } else if (/flat|apartment|land|property|real estate|site/i.test(type + ' ' + name)) {
      lapPropertyCapacity += val * 0.60;
    } else if (/fd|fixed deposit/i.test(type + ' ' + name)) {
      fdCapacity += val * 0.90;
    }
  });

  const maxBorrowingCapacity = Math.round(lasEquityCapacity + goldCapacity + lapPropertyCapacity + fdCapacity);

  return `
    <div style="background: white; border-radius: 14px; padding: 18px 20px; border: 1px solid rgba(0,0,0,0.06); box-shadow: 0 2px 10px rgba(0,0,0,0.02); height: 100%; display: flex; flex-direction: column; justify-content: space-between;">
      <div>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
          <h3 style="margin: 0; font-size: 15px; font-weight: 850;">🛡️ Collateral & Borrowing Power</h3>
          <span style="font-size: 10.5px; font-weight: 750; padding: 3px 8px; border-radius: 99px; background: rgba(0,0,0,0.04); color: #111;">No-Sale Liquidity</span>
        </div>
        <p style="margin: 0 0 12px; font-size: 11px; color: #777;">Emergency credit lines unlockable without triggering capital gains taxes</p>
      </div>

      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; margin-bottom: 8px;">
        <div style="background: rgba(0,0,0,0.015); padding: 8px; border-radius: 8px; text-align: center;">
          <span style="font-size: 9.5px; color: #777; display: block;">LAS (50% LTV)</span>
          <strong style="font-size: 12.5px; color: #111;">${money(Math.round(lasEquityCapacity))}</strong>
        </div>
        <div style="background: rgba(0,0,0,0.015); padding: 8px; border-radius: 8px; text-align: center;">
          <span style="font-size: 9.5px; color: #777; display: block;">Gold (75% LTV)</span>
          <strong style="font-size: 12.5px; color: #111;">${money(Math.round(goldCapacity))}</strong>
        </div>
        <div style="background: rgba(0,0,0,0.015); padding: 8px; border-radius: 8px; text-align: center;">
          <span style="font-size: 9.5px; color: #777; display: block;">LAP (60% LTV)</span>
          <strong style="font-size: 12.5px; color: #111;">${money(Math.round(lapPropertyCapacity))}</strong>
        </div>
      </div>

      <div style="background: linear-gradient(135deg, #1f2937 0%, #111827 100%); padding: 10px 14px; border-radius: 10px; color: white; display: flex; justify-content: space-between; align-items: center;">
        <div>
          <span style="font-size: 10.5px; color: #9ca3af; display: block;">Total Unencumbered Borrowing Power</span>
          <strong style="font-size: 16px; color: white;">${money(maxBorrowingCapacity)}</strong>
        </div>
        <span style="font-size: 18px;">⚡</span>
      </div>
    </div>
  `;
}

function assetPortfolioSummary() {
  const nonCash = nonCashAssets();
  const cash = cashBalance();
  const totalCurrent = nonCash.reduce((sum, item) => sum + Number(item.value || 0), 0);
  const totalBought = nonCash.reduce((sum, item) => sum + Number(item.purchasePrice || 0), 0);
  const gain = totalCurrent - totalBought;

  // Calculate Total Outstanding Debt across all financed assets + liabilities
  let totalOutstandingDebt = 0;
  let activeLoansCount = 0;

  nonCash.forEach(asset => {
    if (isTruthy(asset.hasLoan) && Number(asset.loanAmount || 0) > 0) {
      const snap = financedAssetSnapshot(asset);
      totalOutstandingDebt += snap.outstandingLoan;
      activeLoansCount++;
    }
  });

  (state.liabilities || []).forEach(lib => {
    const isLoan = /loan|mortgage|emi/i.test(lib.type || lib.name || '');
    if (isLoan && !nonCash.some(a => isTruthy(a.hasLoan) && (a.name === lib.name || a.id === lib.linkedAssetId))) {
      const val = Number(lib.value || lib.balance || lib.amount || 0);
      if (val > 0) {
        totalOutstandingDebt += val;
        activeLoansCount++;
      }
    }
  });

  const totalNetEquity = Math.max(0, (totalCurrent + cash) - totalOutstandingDebt);

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
        <span>Total Debt (Loans)</span>
        <strong style="color: ${totalOutstandingDebt > 0 ? '#ef4444' : 'inherit'};">${money(totalOutstandingDebt)}</strong>
        <small>${activeLoansCount > 0 ? `${activeLoansCount} active loan${activeLoansCount > 1 ? 's' : ''} • Net Equity: ${money(totalNetEquity)}` : "100% Unencumbered (Debt-free)"}</small>
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
  const total = Math.max(1, state.assets.length);
  const docsReady = Math.round((state.assets.filter(asset => !missingDocsForAsset(asset).length).length / total) * 100);
  const valuesFresh = Math.round((state.assets.filter(asset => !isAssetValueOutdated(asset)).length / total) * 100);
  const insured = Math.round((state.assets.filter(asset => asset.renewal || /cash|investment|fund/i.test(`${asset.type} ${asset.name}`)).length / total) * 100);

  return `
    <section style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 16px; margin-bottom: 20px;">
      <!-- Card 1: Asset Map / Where your wealth sits -->
      <div style="background: white; border-radius: 16px; padding: 20px; border: 1px solid rgba(0,0,0,0.06); box-shadow: 0 4px 16px rgba(0,0,0,0.03); display: flex; flex-direction: column; justify-content: space-between;">
        <div>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2px;">
            <span style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: #64748b; letter-spacing: 0.5px;">Asset Map</span>
            <span style="font-size: 11px; font-weight: 750; color: #106636; background: rgba(16, 102, 54, 0.08); padding: 2px 8px; border-radius: 99px;">${categoryRows.length} Categories</span>
          </div>
          <strong style="font-size: 17px; font-weight: 900; color: #0f172a; display: block; margin-bottom: 14px;">Where your wealth sits</strong>
        </div>

        <div style="display: flex; flex-direction: column; gap: 8px; flex: 1;">
          ${categoryRows.length ? categoryRows.map(row => `
            <div data-asset-category="${escapeAttribute(row.key)}" style="cursor: pointer; display: grid; grid-template-columns: 120px 1fr auto; align-items: center; gap: 10px; padding: 7px 10px; border-radius: 8px; background: rgba(0,0,0,0.015); transition: background 0.15s ease;">
              <span style="font-size: 12px; font-weight: 700; color: #1e293b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${escapeHtml(row.label)}</span>
              <div style="height: 6px; background: rgba(0,0,0,0.06); border-radius: 99px; overflow: hidden;">
                <div style="width: ${row.percent}%; height: 100%; background: linear-gradient(90deg, #10b981, #059669); border-radius: 99px;"></div>
              </div>
              <div style="text-align: right; white-space: nowrap;">
                <strong style="font-size: 12px; color: #0f172a;">${money(row.value)}</strong>
              </div>
            </div>
          `).join("") : `<p style="color: #64748b; font-size: 12px;">Add assets to see your portfolio map.</p>`}
        </div>
      </div>

      <!-- Card 2: Readiness Scan & Health Diagnostics -->
      <div style="background: white; border-radius: 16px; padding: 20px; border: 1px solid rgba(0,0,0,0.06); box-shadow: 0 4px 16px rgba(0,0,0,0.03); display: flex; flex-direction: column; justify-content: space-between;">
        <div>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2px;">
            <span style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: #64748b; letter-spacing: 0.5px;">Readiness Scan</span>
            <span style="font-size: 11px; font-weight: 750; color: #1e293b; background: #f1f5f9; padding: 2px 8px; border-radius: 99px;">Audit Diagnostics</span>
          </div>
          <strong style="font-size: 17px; font-weight: 900; color: #0f172a; display: block; margin-bottom: 12px;">Portfolio Health & Compliance</strong>
        </div>

        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-bottom: 12px;">
          <div style="text-align: center; background: rgba(0,0,0,0.015); padding: 10px 4px; border-radius: 10px;">
            <div style="font-size: 18px; font-weight: 900; color: ${docsReady < 50 ? '#dc2626' : '#16a34a'};">${docsReady}%</div>
            <span style="font-size: 10.5px; font-weight: 800; color: #475569; display: block; margin-top: 2px;">📄 Docs</span>
          </div>
          <div style="text-align: center; background: rgba(0,0,0,0.015); padding: 10px 4px; border-radius: 10px;">
            <div style="font-size: 18px; font-weight: 900; color: ${valuesFresh < 50 ? '#dc2626' : '#16a34a'};">${valuesFresh}%</div>
            <span style="font-size: 10.5px; font-weight: 800; color: #475569; display: block; margin-top: 2px;">💎 Values</span>
          </div>
          <div style="text-align: center; background: rgba(0,0,0,0.015); padding: 10px 4px; border-radius: 10px;">
            <div style="font-size: 18px; font-weight: 900; color: ${insured < 50 ? '#d97706' : '#16a34a'};">${insured}%</div>
            <span style="font-size: 10.5px; font-weight: 800; color: #475569; display: block; margin-top: 2px;">🛡️ Cover</span>
          </div>
        </div>

        <div style="display: flex; flex-direction: column; gap: 6px; background: #f8fafc; padding: 10px 12px; border-radius: 10px; font-size: 11px;">
          <div style="display: flex; justify-content: space-between; color: #475569;">
            <span>Missing Document Papers:</span>
            <strong style="color: ${docsReady < 100 ? '#dc2626' : '#16a34a'};">${missingDocuments().length} gaps</strong>
          </div>
          <div style="display: flex; justify-content: space-between; color: #475569;">
            <span>Stale Asset Valuations:</span>
            <strong style="color: ${valuesFresh < 100 ? '#d97706' : '#16a34a'};">${state.assets.filter(isAssetValueOutdated).length} outdated</strong>
          </div>
          <div style="display: flex; justify-content: space-between; color: #475569;">
            <span>Active Reminders & Renewals:</span>
            <strong style="color: #0f172a;">${state.assets.filter(a => a.renewal).length} active</strong>
          </div>
        </div>
      </div>

      <!-- Card 3: Next Best Actions -->
      <div style="background: white; border-radius: 16px; padding: 20px; border: 1px solid rgba(0,0,0,0.06); box-shadow: 0 4px 16px rgba(0,0,0,0.03); display: flex; flex-direction: column; justify-content: space-between;">
        <div>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2px;">
            <span style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: #64748b; letter-spacing: 0.5px;">Next Best Actions</span>
            <span style="font-size: 11px; font-weight: 750; color: #dc2626; background: rgba(220, 38, 38, 0.08); padding: 2px 8px; border-radius: 99px;">Priority</span>
          </div>
          <strong style="font-size: 17px; font-weight: 900; color: #0f172a; display: block; margin-bottom: 14px;">Fix these first</strong>
        </div>

        <div style="display: flex; flex-direction: column; gap: 8px; flex: 1;">
          ${actionRows.map(item => `
            <div ${item.action} style="cursor: pointer; padding: 10px 12px; border-radius: 10px; background: rgba(0,0,0,0.015); border-left: 3px solid ${item.tone || '#3b82f6'}; transition: background 0.15s ease;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2px;">
                <b style="font-size: 12.5px; color: #0f172a;">${escapeHtml(item.label)}</b>
                <span style="font-size: 10px; color: #64748b;">➔</span>
              </div>
              <small style="font-size: 11px; color: #64748b; display: block; line-height: 1.3;">${escapeHtml(item.detail)}</small>
            </div>
          `).join("")}
        </div>
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
  const categoryLabels = {
    vehicles: "Vehicles & Cars",
    land: "Land & Plots",
    flats: "Flats & Apartments",
    shoes: "Shoes & Collectibles",
    watches: "Watches & Luxury",
    investments: "Equities & Mutual Funds",
    funds: "Fixed Deposits & PF",
    cash: "Liquid Cash & Bank"
  };

  const rows = Object.entries(assetCategoryViews).map(([key, category]) => {
    const items = state.assets.filter(category.matcher);
    const value = items.reduce((sum, item) => sum + Number(item.value || 0), 0);
    const label = categoryLabels[key] || category.tile || key;
    return { key, label, value };
  }).filter(row => row.value > 0);

  const total = rows.reduce((sum, row) => sum + row.value, 0) || 1;
  return rows
    .sort((a, b) => b.value - a.value)
    .slice(0, 6)
    .map(row => ({ ...row, percent: Math.max(5, Math.round((row.value / total) * 100)) }));
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
  // Exclude pure cash from requiring physical photos
  const missingAsset = state.assets.find(asset => missingDocsForAsset(asset).length);
  const staleAsset = state.assets.find(isAssetValueOutdated);
  const noPhotoAsset = state.assets.find(asset => !asset.photoId && !isCashAsset(asset) && !/cash|bank/i.test(`${asset.type} ${asset.name}`));
  const unassignedNomineeAsset = state.assets.find(asset => !asset.nominee && !asset.beneficiary && Number(asset.value || 0) >= 500000);

  const actions = [];
  if (missingAsset) {
    const isCash = isCashAsset(missingAsset) || /cash|bank/i.test(`${missingAsset.type} ${missingAsset.name}`);
    actions.push({
      label: "Complete papers",
      detail: isCash ? `Upload latest bank statement for ${missingAsset.name}` : `${missingDocsForAsset(missingAsset)[0]} missing for ${missingAsset.name}`,
      action: `data-detail="assets" data-id="${escapeAttribute(missingAsset.id)}"`,
      tone: '#dc2626'
    });
  }
  if (unassignedNomineeAsset) {
    actions.push({
      label: "Assign Nominee",
      detail: `${unassignedNomineeAsset.name} (${money(unassignedNomineeAsset.value)}) has no heir mapped`,
      action: `onclick="renderView('willVault')"`,
      tone: '#f59e0b'
    });
  }
  if (staleAsset) {
    actions.push({
      label: "Refresh valuation",
      detail: `${staleAsset.name} valuation is older than 90 days`,
      action: `data-detail="assets" data-id="${escapeAttribute(staleAsset.id)}"`,
      tone: '#3b82f6'
    });
  }
  if (noPhotoAsset && actions.length < 3) {
    actions.push({
      label: "Add asset photo",
      detail: `Upload image for ${noPhotoAsset.name} for insurance proof`,
      action: `data-edit="assets" data-id="${escapeAttribute(noPhotoAsset.id)}"`,
      tone: '#10b981'
    });
  }
  if (!actions.length) {
    actions.push({
      label: "Portfolio In Good Shape",
      detail: "All documents and valuations are up to date.",
      action: `data-add="assets"`,
      tone: '#106636'
    });
  }
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
  const currency = String(asset.currency || "INR").toUpperCase();
  const exchangeRate = Number(asset.exchangeRate) || 1;
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
  values.currency = String(values.currency || "INR").toUpperCase();
  values.exchangeRate = Number(values.exchangeRate) || 1;
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
  values.currency = String(values.currency || "INR").toUpperCase();
  values.exchangeRate = Number(values.exchangeRate) || 1;
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
    <div class="asset-portfolio-card" role="button" tabindex="0" style="position: relative; cursor: pointer;" data-detail="assets" data-id="${escapeAttribute(asset.id)}">
      <span class="asset-card-photo"><img src="${escapeAttribute(image)}" alt="${escapeAttribute(asset.name || "Asset")}"></span>
      <span class="asset-card-main">
        <div style="display: flex; justify-content: space-between; align-items: center; gap: 6px;">
          <small>${escapeHtml(asset.type || category?.title || "Asset")}</small>
          <button type="button" data-edit="assets" data-id="${escapeAttribute(asset.id)}" onclick="event.stopPropagation()" style="background: rgba(0,0,0,0.06); border: 1px solid rgba(0,0,0,0.12); border-radius: 6px; padding: 2px 8px; font-size: 11px; font-weight: 800; color: #0f172a; cursor: pointer;">
            ✏️ Edit
          </button>
        </div>
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
    </div>
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
  const items = filteredSortedAssets().filter(asset => assetCategoryForAsset(asset) === categoryKey);
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
  const current = Number(item.value || item.currentValue || 0);
  const bought = Number(item.purchasePrice || 0);
  const gain = current - bought;
  const image = item.photoId ? fileViewUrl(item.photoId) : category.fallback;
  const specs = category.specs(item);

  const loanBal = Number(item.loanAmount || item.loanBalance || item.outstandingLoan || 0);
  const ownedEquity = Math.max(0, current - loanBal);
  const equityPct = current > 0 ? Math.round((ownedEquity / current) * 100) : 100;

  // Check if asset generates rental yield or dividend stream
  const rentVal = Number(item.rentalIncome || item.rent || 0);
  const isYielding = rentVal > 0;
  const yieldPct = (current > 0 && isYielding) ? ((rentVal * 12 / current) * 100).toFixed(1) : null;

  // Nominee check
  const nominee = item.nomineeName || (state.willVault?.nominees || []).find(n => (n.assignedAssets || []).includes(item.id))?.name;

  return `
    <div class="vehicle-card" role="button" tabindex="0" style="position: relative; cursor: pointer;" data-detail="assets" data-id="${escapeAttribute(item.id)}">
      <span class="vehicle-photo">
        <img src="${escapeAttribute(image)}" alt="${escapeAttribute(item.name || category.title)}">
      </span>
      <span class="vehicle-info">
        <div style="display: flex; justify-content: space-between; align-items: center; gap: 6px;">
          <small>${escapeHtml(item.type || category.title)}</small>
          <button type="button" data-edit="assets" data-id="${escapeAttribute(item.id)}" onclick="event.stopPropagation()" style="background: rgba(0,0,0,0.06); border: 1px solid rgba(0,0,0,0.12); border-radius: 6px; padding: 2px 8px; font-size: 11px; font-weight: 800; color: #0f172a; cursor: pointer;">
            Edit
          </button>
        </div>
        <strong>${escapeHtml(item.name || item.model || category.title)}</strong>
        <em>${escapeHtml(specs.length ? specs.join(" - ") : "Add important specifications")}</em>

        ${loanBal > 0 ? `
          <div style="margin-top: 8px; padding: 6px 8px; background: rgba(0,0,0,0.03); border-radius: 8px; border: 1px solid rgba(0,0,0,0.05);">
            <div style="display: flex; justify-content: space-between; font-size: 10.5px; margin-bottom: 4px;">
              <span style="color: #059669; font-weight: 750;">Equity: ${money(ownedEquity)} (${equityPct}%)</span>
              <span style="color: #dc2626; font-weight: 750;">Loan: ${money(loanBal)}</span>
            </div>
            <div style="height: 5px; background: #fee2e2; border-radius: 3px; overflow: hidden; display: flex;">
              <div style="width: ${equityPct}%; background: #059669;"></div>
            </div>
          </div>
        ` : ''}

        <div style="display: flex; gap: 6px; align-items: center; margin-top: 6px; flex-wrap: wrap;">
          ${isYielding ? `
            <span style="font-size: 10px; font-weight: 750; background: #ecfdf5; color: #047857; padding: 2px 6px; border-radius: 4px; border: 1px solid #a7f3d0;">
              Yield: ${money(rentVal)}/mo (${yieldPct}% Cap Rate)
            </span>
          ` : ''}
          <span style="font-size: 10px; font-weight: 700; background: ${nominee ? '#f1f5f9' : '#fef2f2'}; color: ${nominee ? '#475569' : '#b91c1c'}; padding: 2px 6px; border-radius: 4px; border: 1px solid ${nominee ? '#e2e8f0' : '#fecaca'};">
            ${nominee ? `Nominee: ${escapeHtml(nominee)}` : 'Nominee Unassigned'}
          </span>
        </div>
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
    </div>
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
    
    <!-- Unified Specifications Ledger Card -->
    <div class="asset-detail-card" style="background: #ffffff; border: 1.5px solid #cbd5e1; border-radius: 14px; padding: 22px; box-shadow: 0 4px 16px rgba(0,0,0,0.03); margin: 18px 0; display: flex; flex-direction: column; gap: 14px;">
      <div style="border-bottom: 1px solid #f1f5f9; padding-bottom: 10px;">
        <span style="font-size: 11px; font-weight: 850; color: #0284c7; text-transform: uppercase;">Technical Ledger & Identification</span>
        <h3 style="margin: 2px 0 0; font-size: 18px; font-weight: 850; color: #0f172a;">Vehicle Registration & Asset Metadata</h3>
      </div>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px;">
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 12px;">
          <span style="font-size: 10px; font-weight: 800; color: #64748b; text-transform: uppercase;">Category Type</span>
          <strong style="font-size: 13.5px; color: #0f172a; display: block; margin-top: 2px;">${escapeHtml(asset.type || "CAR")}</strong>
        </div>
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 12px;">
          <span style="font-size: 10px; font-weight: 800; color: #64748b; text-transform: uppercase;">Registered Owner</span>
          <strong style="font-size: 13.5px; color: #0f172a; display: block; margin-top: 2px;">${escapeHtml(asset.owner || "Prajwal")}</strong>
        </div>
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 12px;">
          <span style="font-size: 10px; font-weight: 800; color: #64748b; text-transform: uppercase;">Location / Garage</span>
          <strong style="font-size: 13.5px; color: #0f172a; display: block; margin-top: 2px;">${escapeHtml(asset.location || "Home Garage")}</strong>
        </div>
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 12px;">
          <span style="font-size: 10px; font-weight: 800; color: #64748b; text-transform: uppercase;">Last Telemetry Update</span>
          <strong style="font-size: 13.5px; color: #0f172a; display: block; margin-top: 2px;">${escapeHtml(asset.lastUpdated || "Today")}</strong>
        </div>
        ${asset.brand ? `<div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 12px;"><span style="font-size: 10px; font-weight: 800; color: #64748b; text-transform: uppercase;">Make / Brand</span><strong style="font-size: 13.5px; color: #0f172a; display: block; margin-top: 2px;">${escapeHtml(asset.brand)}</strong></div>` : ""}
        ${asset.model ? `<div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 12px;"><span style="font-size: 10px; font-weight: 800; color: #64748b; text-transform: uppercase;">Model / Trim</span><strong style="font-size: 13.5px; color: #0f172a; display: block; margin-top: 2px;">${escapeHtml(asset.model)}</strong></div>` : ""}
        ${asset.registrationNumber ? `<div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 12px;"><span style="font-size: 10px; font-weight: 800; color: #64748b; text-transform: uppercase;">Registration (RC)</span><strong style="font-size: 13.5px; color: #0f172a; display: block; margin-top: 2px;">${escapeHtml(asset.registrationNumber)}</strong></div>` : ""}
        ${asset.serialNumber ? `<div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 12px;"><span style="font-size: 10px; font-weight: 800; color: #64748b; text-transform: uppercase;">VIN / Chassis</span><strong style="font-size: 13.5px; color: #0f172a; display: block; margin-top: 2px;">${escapeHtml(asset.serialNumber)}</strong></div>` : ""}
      </div>
      ${asset.valuationBasis ? `<div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 12px 14px; font-size: 12px; color: #1e40af; line-height: 1.45;"><b>Valuation Rationale:</b> ${escapeHtml(asset.valuationBasis)}</div>` : ""}
      ${asset.note ? `<div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 14px; font-size: 12px; color: #475569;"><b>Notes:</b> ${escapeHtml(asset.note)}</div>` : ""}
    </div>

    ${sectionHeader("Document Checklist", "Essential vehicle compliance and registration records")}
    <div style="background: #ffffff; border: 1.5px solid #cbd5e1; border-radius: 14px; padding: 20px; box-shadow: 0 4px 16px rgba(0,0,0,0.03); margin-bottom: 18px;">
      ${assetChecklist(asset)}
    </div>

    ${sectionHeader("Linked Documents Vault", "Saved files and insurance policies for this vehicle")}
    <div style="background: #ffffff; border: 1.5px solid #cbd5e1; border-radius: 14px; padding: 20px; box-shadow: 0 4px 16px rgba(0,0,0,0.03); margin-bottom: 18px;">
      ${assetDocumentCards(asset)}
    </div>

    ${isInvestmentAsset(asset) ? `${sectionHeader("Investment Transactions", "Sells, splits and dividends")}${investmentTransactionHistory(asset)}` : ""}

    ${sectionHeader("Valuation & Audit History", "Chronological record of manual updates and Spinny estimates")}
    <div style="background: #ffffff; border: 1.5px solid #cbd5e1; border-radius: 14px; padding: 20px; box-shadow: 0 4px 16px rgba(0,0,0,0.03); margin-bottom: 18px;">
      ${assetValueHistory(asset)}
    </div>
  `;
  syncTabs("assets");
  refreshMetrics();
}

function vehicleAppraisalWorkflow(asset) {
  const estimate = estimateAssetValue(asset);
  if (!estimate) {
    return `
      <section class="vehicle-appraisal" style="background: #ffffff; border: 1.5px solid #cbd5e1; border-radius: 12px; padding: 20px; box-shadow: 0 4px 16px rgba(0,0,0,0.03); margin: 16px 0;">
        <div class="vehicle-appraisal-copy">
          <span style="font-size: 11px; font-weight: 850; color: #0284c7; text-transform: uppercase;">Spinny Used Car Valuation Engine</span>
          <strong style="font-size: 18px; font-weight: 850; color: #0f172a; display: block; margin: 4px 0;">Add buying price to estimate real-market resale value</strong>
          <p style="color: #64748b; font-size: 12.5px; margin: 0;">Enter manufacturing year, kilometers, owner number, and condition to compute current Spinny price.</p>
        </div>
      </section>
    `;
  }
  const engine = estimate.engineJson || parseVehicleValuationJson(asset.vehicleValuationJson) || {};
  const inputs = engine.inputs || {};
  const adjustments = engine.adjustments || {};
  const bought = nonNegativeRupees(inputs.original_price || asset.purchasePrice);
  const estimated = nonNegativeRupees(engine.estimated_resale_price || estimate.value);
  const instantSell = nonNegativeRupees(engine.spinny_instant_sell || estimate.instantSell || Math.round(estimated * 0.93));
  const ageMonths = inputs.age_months ?? estimate.ageMonths ?? calculateVehicleElapsedMonths(asset);
  const monthlyDecay = engine.monthly_depreciation_rate ?? estimate.monthlyDepreciation ?? Math.round(estimated * 0.0085);
  const retained = bought ? Math.max(0, Math.min(100, Math.round((estimated / bought) * 100))) : 0;
  const pricePosition = Math.max(8, Math.min(92, retained));
  const delta = estimated - bought;

  const rows = [
    ["01 Age Depreciation", `${Math.round((1 - Number(adjustments.age_depreciation_multiplier || 1)) * 100)}%`, `${ageMonths} months continuous decay (~${(ageMonths/12).toFixed(1)} yrs)`],
    ["02 Mileage Utilization", `${Number(adjustments.mileage_adjustment_percent || 0) >= 0 ? "+" : ""}${Number(adjustments.mileage_adjustment_percent || 0)}%`, inputs.actual_mileage_km ? `${Number(inputs.actual_mileage_km).toLocaleString("en-IN")} km driven` : "Standard 1,000 km/mo"],
    ["03 Ownership Record", `${Number(adjustments.ownership_adjustment_percent || 0)}%`, `${inputs.owner_count || 1}${Number(inputs.owner_count || 1) === 1 ? "st" : Number(inputs.owner_count || 1) === 2 ? "nd" : "rd+"} Single Owner`],
    ["04 Spinny 200-Pt", `x${Number(adjustments.condition_multiplier || 1).toFixed(2)}`, `${inputs.condition || "Good"} Grade`],
    ["05 Brand Liquidity", `x${Number(adjustments.brand_multiplier || 1).toFixed(2)}`, inputs.brand_tier || "Model Index"]
  ];

  return `
    <section class="vehicle-appraisal" style="background: #ffffff; border: 1.5px solid #cbd5e1; border-radius: 12px; padding: 22px; box-shadow: 0 4px 16px rgba(0,0,0,0.03); margin: 16px 0; display: flex; flex-direction: column; gap: 16px;">
      
      <!-- Top Title Bar -->
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; border-bottom: 1px solid #f1f5f9; padding-bottom: 12px;">
        <div>
          <span style="font-size: 11px; font-weight: 850; color: #0284c7; text-transform: uppercase; letter-spacing: 0.5px;">Spinny Real-Market Valuation & Monthly Telemetry</span>
          <h3 style="margin: 2px 0 0; font-size: 18px; font-weight: 850; color: #0f172a;">Live Vehicle Valuation & Monthly Depreciation Schedule</h3>
        </div>
        <button onclick="syncAssetSpinnyValue('${escapeAttribute(asset.id)}')" class="secondary-action" style="background: #eff6ff; color: #1d4ed8; border: 1.5px solid #bfdbfe; padding: 6px 14px; border-radius: 6px; font-size: 12px; font-weight: 750; cursor: pointer;">
          Apply Spinny Valuation (${money(estimated)})
        </button>
      </div>

      <!-- 3-Column Valuation Cards -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 12px;">
        
        <!-- Box 1: Spinny Resale Quote -->
        <div style="background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 8px; padding: 16px; display: flex; flex-direction: column; justify-content: space-between;">
          <div>
            <span style="font-size: 10.5px; font-weight: 800; color: #64748b; text-transform: uppercase;">Spinny Assured Fair Value</span>
            <strong style="font-size: 28px; font-weight: 850; color: #0f172a; display: block; margin: 4px 0;">${money(estimated)}</strong>
            <p style="color: #475569; font-size: 12px; font-weight: 600; margin: 0 0 10px;">
              <b>Instant 24-hr Bank Buyout:</b> <span style="color: #166534; font-weight: 800;">${money(instantSell)}</span>
            </p>
          </div>
          <div>
            <div style="display: flex; justify-content: space-between; font-size: 11px; font-weight: 750; color: #64748b; margin-bottom: 4px;">
              <span>Low: ${money(estimate.low)}</span>
              <span>High: ${money(estimate.high)}</span>
            </div>
            <div style="background: #e2e8f0; height: 8px; border-radius: 4px; position: relative; overflow: hidden;">
              <div style="position: absolute; left: 0; width: ${pricePosition}%; background: linear-gradient(90deg, #0284c7, #10b981); height: 100%;"></div>
            </div>
          </div>
        </div>

        <!-- Box 2: Monthly Compounding Telemetry -->
        <div style="background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 8px; padding: 16px; display: flex; flex-direction: column; justify-content: space-between;">
          <div>
            <span style="font-size: 10.5px; font-weight: 800; color: #64748b; text-transform: uppercase;">Retained Value & Decay</span>
            <strong style="font-size: 28px; font-weight: 850; color: #0284c7; display: block; margin: 4px 0;">${retained}%</strong>
            <p style="color: #475569; font-size: 12px; font-weight: 600; margin: 0;">
              Monthly Run-Rate: <b style="color: #d97706;">-${money(monthlyDecay)}/month</b>
            </p>
          </div>
          <div style="background: #ffffff; border: 1px solid #cbd5e1; border-radius: 6px; padding: 6px 10px; display: flex; justify-content: space-between; align-items: center;">
            <span style="font-size: 11px; color: #64748b; font-weight: 600;">Confidence Rating:</span>
            <span style="font-size: 11px; font-weight: 800; color: #166534; background: #ecfdf5; padding: 2px 6px; border-radius: 4px;">${estimate.confidence} Confidence</span>
          </div>
        </div>

        <!-- Box 3: Net Balance Sheet Impact -->
        <div style="background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 8px; padding: 16px; display: flex; flex-direction: column; justify-content: space-between;">
          <div>
            <span style="font-size: 10.5px; font-weight: 800; color: #64748b; text-transform: uppercase;">Total Equity Impact</span>
            <strong style="font-size: 28px; font-weight: 850; color: ${delta >= 0 ? '#166534' : '#991b1b'}; display: block; margin: 4px 0;">
              ${delta >= 0 ? "+" : "-"} ${money(Math.abs(delta))}
            </strong>
            <p style="color: #475569; font-size: 12px; font-weight: 600; margin: 0;">
              Elapsed: <b>${ageMonths} Months on Road</b>
            </p>
          </div>
          <div style="background: #ffffff; border: 1px solid #cbd5e1; border-radius: 6px; padding: 6px 10px; font-size: 11px; color: #64748b; font-weight: 600;">
            Annualized Depreciation: <b>~10.5% p.a.</b>
          </div>
        </div>

      </div>

      <!-- 5-Pillar Inspection Breakdown -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 10px;">
        ${rows.map(([label, value, detail]) => `
          <div style="background: #ffffff; border: 1.5px solid #cbd5e1; border-radius: 8px; padding: 12px 14px;">
            <span style="font-size: 10px; font-weight: 800; color: #64748b; text-transform: uppercase; display: block; margin-bottom: 4px;">${escapeHtml(label)}</span>
            <strong style="font-size: 18px; font-weight: 850; color: #0f172a; display: block; margin-bottom: 4px;">${escapeHtml(value)}</strong>
            <p style="font-size: 11px; color: #475569; font-weight: 600; margin: 0; line-height: 1.35;">${escapeHtml(detail)}</p>
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
    <section class="vehicle-finance-dashboard" style="background: #ffffff; border: 1.5px solid #cbd5e1; border-radius: 14px; padding: 22px; box-shadow: 0 4px 16px rgba(0,0,0,0.03); margin: 18px 0; display: flex; flex-direction: column; gap: 16px;">
      
      <!-- Title Header -->
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; border-bottom: 1px solid #f1f5f9; padding-bottom: 12px;">
        <div>
          <span style="font-size: 11px; font-weight: 850; color: #0284c7; text-transform: uppercase; letter-spacing: 0.5px;">Auto Financing & Equity Telemetry</span>
          <h3 style="margin: 2px 0 0; font-size: 18px; font-weight: 850; color: #0f172a;">Capital Amortization & Debt Servicing Position</h3>
        </div>
        <span style="font-size: 11px; font-weight: 800; background: ${loan.hasLoan ? '#eff6ff' : '#ecfdf5'}; color: ${loan.hasLoan ? '#1d4ed8' : '#047857'}; padding: 4px 10px; border-radius: 6px; border: 1px solid ${loan.hasLoan ? '#bfdbfe' : '#a7f3d0'};">
          ${loan.hasLoan ? `ACTIVE AUTO LOAN (${loan.remainingMonths} EMIs Left)` : '100% UNENCUMBERED ASSET (NO LOAN)'}
        </span>
      </div>

      <!-- Equity Hero + Finance Grid -->
      <div style="display: grid; grid-template-columns: minmax(240px, 32%) minmax(0, 1fr); gap: 14px; align-items: stretch;">
        
        <!-- Equity Box -->
        <div style="background: ${afterInterestIsNegative ? '#fef2f2' : '#f8fafc'}; border: 1.5px solid ${afterInterestIsNegative ? '#fecaca' : '#e2e8f0'}; border-radius: 10px; padding: 18px; display: flex; flex-direction: column; justify-content: space-between;">
          <div>
            <span style="font-size: 10.5px; font-weight: 800; color: ${afterInterestIsNegative ? '#991b1b' : '#64748b'}; text-transform: uppercase; display: block; margin-bottom: 4px;">
              ${afterInterestIsNegative ? "After-Interest Shortfall" : "Net Equity After Interest"}
            </span>
            <strong style="font-size: 26px; font-weight: 850; color: ${afterInterestIsNegative ? '#991b1b' : '#0f172a'}; display: block; margin-bottom: 6px;">
              ${money(snapshot.afterInterestPosition)}
            </strong>
            <p style="color: #475569; font-size: 12px; font-weight: 600; margin: 0; line-height: 1.4;">
              ${afterInterestIsNegative
                ? `Current value minus loan payoff minus interest paid is short by ${money(Math.abs(snapshot.afterInterestPosition))}.`
                : "Realized capital position after deducting total loan debt and interest servicing."}
            </p>
          </div>
          <div style="margin-top: 14px; padding-top: 10px; border-top: 1px solid ${afterInterestIsNegative ? '#fecaca' : '#e2e8f0'};">
            <span style="font-size: 11px; font-weight: 750; color: #0284c7;">Net Worth Contribution: <b>${money(snapshot.equity)}</b></span>
          </div>
        </div>

        <!-- 8-Tile Finance Matrix -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 10px;">
          ${vehicleFinanceTile("Current Value", money(snapshot.currentValue), "Spinny fair value")}
          ${vehicleFinanceTile("Outstanding Loan", money(snapshot.outstandingLoan), loan.hasLoan ? `${loan.remainingMonths} EMIs left` : "Fully owned")}
          ${vehicleFinanceTile("Vehicle Equity", money(snapshot.equity), equityIsNegative ? "Underwater" : "Net asset value")}
          ${vehicleFinanceTile("After Interest", money(snapshot.afterInterestPosition), "Realized payoff")}
          ${vehicleFinanceTile("Invoice Cost", money(snapshot.purchasePrice), snapshot.purchaseDate || "Jan 2025")}
          ${vehicleFinanceTile("Total Paid", money(loan.totalPaid || snapshot.purchasePrice), loan.hasLoan ? "Downpmt + EMIs" : "100% Upfront")}
          ${vehicleFinanceTile("Interest Paid", money(loan.interestPaidToDate), loan.hasLoan ? `${loan.completedEmis} EMIs done` : "Zero interest")}
          ${vehicleFinanceTile("Depreciation", money(snapshot.depreciation), `${snapshot.depreciationPercent}% total drop`)}
        </div>

      </div>

      ${loan.hasLoan ? `
        <!-- Loan Details Strip -->
        <div style="background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 8px; padding: 12px 16px; display: flex; justify-content: space-between; flex-wrap: wrap; gap: 12px; font-size: 11.5px;">
          <span><b style="color: #64748b; font-weight: 750;">Sanctioned Loan:</b> <strong style="color: #0f172a;">${money(loan.loanAmount)}</strong></span>
          <span><b style="color: #64748b; font-weight: 750;">Total Interest:</b> <strong style="color: #0f172a;">${money(loan.totalInterestPayable)}</strong></span>
          <span><b style="color: #64748b; font-weight: 750;">Total Repayment:</b> <strong style="color: #0f172a;">${money(loan.totalRepayment)}</strong></span>
          <span><b style="color: #64748b; font-weight: 750;">Remaining Principal:</b> <strong style="color: #0f172a;">${money(loan.remainingPrincipal)}</strong></span>
        </div>
      ` : ''}

    </section>
  `;
}

function vehicleFinanceTile(label, value, detail) {
  return `
    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 12px; display: flex; flex-direction: column; justify-content: space-between;">
      <span style="font-size: 10px; font-weight: 800; color: #64748b; text-transform: uppercase; display: block; margin-bottom: 2px;">${escapeHtml(label)}</span>
      <strong style="font-size: 14.5px; font-weight: 850; color: #0f172a;">${escapeHtml(String(value))}</strong>
      <small style="font-size: 10px; color: #64748b; font-weight: 600; display: block; margin-top: 2px;">${escapeHtml(detail)}</small>
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
    ["1. Acquisition", asset.acquisitionDate || asset.purchaseDate || "Purchased"],
    ["2. Valuation Updated", asset.lastUpdated || "Spinny Active"],
    ["3. Documents Vault", docs.length ? `${docs.length} files saved` : "RC & Insurance"],
    ["4. Compliance Alert", reminder ? (reminder.days < 0 ? "Overdue" : `${reminder.days} days`) : "PUC / Service"]
  ];
  return `
    <section class="investment-mini-timeline asset-mini-timeline" style="background: #ffffff; border: 1.5px solid #cbd5e1; border-radius: 12px; padding: 16px 20px; box-shadow: 0 4px 16px rgba(0,0,0,0.03); margin: 16px 0; display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 12px;">
      ${events.map(([label, value], index) => `
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 12px; display: flex; align-items: center; gap: 10px;">
          <div style="background: #0f172a; color: #ffffff; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 850; flex-shrink: 0;">${index + 1}</div>
          <div>
            <strong style="font-size: 12px; color: #0f172a; display: block;">${escapeHtml(label)}</strong>
            <small style="font-size: 11px; color: #64748b; font-weight: 600;">${escapeHtml(String(value))}</small>
          </div>
        </div>
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
    <section class="asset-profile-summary" style="background: #ffffff; border: 1.5px solid #cbd5e1; border-radius: 14px; padding: 20px; box-shadow: 0 4px 16px rgba(0,0,0,0.03); margin: 18px 0; display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 12px;">
      
      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px;">
        <span style="font-size: 10px; font-weight: 800; color: #64748b; text-transform: uppercase; display: block; margin-bottom: 4px;">Record Health</span>
        <strong style="font-size: 20px; font-weight: 850; color: #0284c7; display: block; margin-bottom: 4px;">${completion}%</strong>
        <div style="background: #e2e8f0; height: 6px; border-radius: 3px; overflow: hidden;">
          <div style="width:${completion}%; background: #0284c7; height: 100%;"></div>
        </div>
      </div>

      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px;">
        <span style="font-size: 10px; font-weight: 800; color: #64748b; text-transform: uppercase; display: block; margin-bottom: 4px;">Cost Basis</span>
        <strong style="font-size: 16px; font-weight: 850; color: #0f172a; display: block;">${money(bought)}</strong>
        <small style="font-size: 10px; color: #64748b; font-weight: 600;">${asset.acquisitionDate || "Purchase invoice"}</small>
      </div>

      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px;">
        <span style="font-size: 10px; font-weight: 800; color: #64748b; text-transform: uppercase; display: block; margin-bottom: 4px;">Current Value</span>
        <strong style="font-size: 16px; font-weight: 850; color: #0f172a; display: block;">${money(current)}</strong>
        <small style="font-size: 10px; color: #64748b; font-weight: 600;">${asset.valuationBasis ? "Spinny live valuation" : asset.source || "Market quote"}</small>
      </div>

      <div style="background: ${gain >= 0 ? '#f0fdf4' : '#fef2f2'}; border: 1px solid ${gain >= 0 ? '#bbf7d0' : '#fecaca'}; border-radius: 8px; padding: 12px;">
        <span style="font-size: 10px; font-weight: 800; color: ${gain >= 0 ? '#166534' : '#991b1b'}; text-transform: uppercase; display: block; margin-bottom: 4px;">Net Shift</span>
        <strong style="font-size: 16px; font-weight: 850; color: ${gain >= 0 ? '#166534' : '#991b1b'}; display: block;">${bought ? `${gain >= 0 ? "+" : "-"} ${money(Math.abs(gain))}` : "Cost missing"}</strong>
        <small style="font-size: 10px; color: ${gain >= 0 ? '#166534' : '#991b1b'}; font-weight: 600;">${asset.valuationLow || asset.valuationHigh ? `${money(asset.valuationLow)} - ${money(asset.valuationHigh)}` : "Estimated"}</small>
      </div>

      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px;">
        <span style="font-size: 10px; font-weight: 800; color: #64748b; text-transform: uppercase; display: block; margin-bottom: 4px;">Vault Papers</span>
        <strong style="font-size: 16px; font-weight: 850; color: #0f172a; display: block;">${savedDocs}/${required.length}</strong>
        <small style="font-size: 10px; color: ${missing.length ? '#b91c1c' : '#166534'}; font-weight: 750;">${missing.length ? `${missing.length} missing` : "All papers verified"}</small>
      </div>

      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px;">
        <span style="font-size: 10px; font-weight: 800; color: #64748b; text-transform: uppercase; display: block; margin-bottom: 4px;">Renewal Watch</span>
        <strong style="font-size: 16px; font-weight: 850; color: #0f172a; display: block;">${reminder ? (reminder.days < 0 ? "Overdue" : `${reminder.days} days`) : "None"}</strong>
        <small style="font-size: 10px; color: #64748b; font-weight: 600;">${reminder ? reminder.name : "Insurance / PUC"}</small>
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
  const gainPct = bought > 0 ? ((gain / bought) * 100).toFixed(1) : "0.0";
  const image = asset.photoId ? fileViewUrl(asset.photoId) : category.fallback;
  const specs = category.detailSpecs(asset).filter(([, value]) => value);

  if (isVehicleAsset(asset)) {
    const valuation = usedCarValuation(asset) || {};
    const ageMonths = valuation.ageMonths ?? calculateVehicleElapsedMonths(asset);
    const ageYearsStr = (ageMonths / 12).toFixed(1);
    const monthlyDecay = valuation.monthlyDepreciation ?? Math.round(current * 0.0085);
    const estimatedValue = valuation.value || current;

    return `
      <div class="vehicle-detail-hero" style="background: #ffffff; border: 1.5px solid #cbd5e1; border-radius: 14px; padding: 22px; box-shadow: 0 4px 20px rgba(0,0,0,0.04); margin-bottom: 18px; display: grid; grid-template-columns: minmax(240px, 38%) minmax(0, 1fr); gap: 20px; align-items: stretch;">
        <div style="position: relative; display: flex; align-items: center; justify-content: center; background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 10px; overflow: hidden; padding: 12px; min-height: 220px;">
          <img src="${escapeAttribute(image)}" alt="${escapeAttribute(asset.name || 'Vehicle')}" style="width: 100%; max-height: 240px; object-fit: contain; transition: transform 0.3s;" onmouseenter="this.style.transform='scale(1.04)';" onmouseleave="this.style.transform='scale(1)';" />
          <div style="position: absolute; top: 12px; left: 12px; background: #0f172a; color: #38bdf8; font-size: 10px; font-weight: 800; padding: 4px 8px; border-radius: 4px; letter-spacing: 0.5px; border: 1px solid #334155;">
            SPINNY VERIFIED TELEMETRY
          </div>
        </div>

        <div class="vehicle-detail-copy" style="display: flex; flex-direction: column; justify-content: space-between;">
          <div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; flex-wrap: wrap; gap: 8px;">
              <span style="font-size: 11px; font-weight: 850; color: #0284c7; letter-spacing: 0.8px; text-transform: uppercase;">
                ${escapeHtml(asset.type || 'CAR')} • ${escapeHtml(asset.brand || 'VEHICLE')}
              </span>
              <span style="font-size: 10.5px; font-weight: 800; background: #eff6ff; color: #1d4ed8; padding: 3px 8px; border-radius: 4px; border: 1px solid #bfdbfe;">
                SPINNY RESALE INDEX: ACTIVE
              </span>
            </div>
            
            <h2 style="font-size: 26px; font-weight: 850; color: #0f172a; margin: 0 0 14px; letter-spacing: -0.5px;">
              ${escapeHtml(asset.name || asset.model || 'Vehicle')}
            </h2>

            <!-- 4 Executive Pricing KPI Tiles -->
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 10px; margin-bottom: 14px;">
              
              <div style="background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 8px; padding: 10px 12px;">
                <span style="font-size: 10px; font-weight: 800; color: #64748b; text-transform: uppercase; display: block; margin-bottom: 2px;">Buying Price</span>
                <strong style="font-size: 16px; font-weight: 850; color: #0f172a;">${money(bought)}</strong>
                <small style="font-size: 10px; color: #64748b; display: block; margin-top: 2px;">Invoice Cost</small>
              </div>

              <div style="background: #eff6ff; border: 1.5px solid #bfdbfe; border-radius: 8px; padding: 10px 12px;">
                <span style="font-size: 10px; font-weight: 800; color: #1d4ed8; text-transform: uppercase; display: block; margin-bottom: 2px;">Spinny Resale Price</span>
                <strong style="font-size: 16px; font-weight: 850; color: #1e40af;">${money(current)}</strong>
                <small style="font-size: 10px; color: #1d4ed8; display: block; margin-top: 2px;">Live Market Value</small>
              </div>

              <div style="background: ${gain >= 0 ? '#f0fdf4' : '#fef2f2'}; border: 1.5px solid ${gain >= 0 ? '#bbf7d0' : '#fecaca'}; border-radius: 8px; padding: 10px 12px;">
                <span style="font-size: 10px; font-weight: 800; color: ${gain >= 0 ? '#166534' : '#991b1b'}; text-transform: uppercase; display: block; margin-bottom: 2px;">Total Change</span>
                <strong style="font-size: 16px; font-weight: 850; color: ${gain >= 0 ? '#166534' : '#991b1b'};">
                  ${bought ? `${gain >= 0 ? "+" : "-"} ${money(Math.abs(gain))}` : "Missing"}
                </strong>
                <small style="font-size: 10px; color: ${gain >= 0 ? '#166534' : '#991b1b'}; display: block; margin-top: 2px;">${gainPct}% Net Shift</small>
              </div>

              <div style="background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 8px; padding: 10px 12px;">
                <span style="font-size: 10px; font-weight: 800; color: #64748b; text-transform: uppercase; display: block; margin-bottom: 2px;">Monthly Decay</span>
                <strong style="font-size: 16px; font-weight: 850; color: #d97706;">-${money(monthlyDecay)}/mo</strong>
                <small style="font-size: 10px; color: #64748b; display: block; margin-top: 2px;">${ageMonths} Mos on Road</small>
              </div>

            </div>

            <!-- Specs Grid -->
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 8px; margin-bottom: 14px;">
              <div style="background: #ffffff; border: 1px solid #cbd5e1; border-radius: 6px; padding: 6px 10px; font-size: 11.5px;">
                <small style="color: #64748b; font-size: 10px; font-weight: 750; display: block;">MODEL / TRIM</small>
                <strong style="color: #0f172a; font-weight: 800;">${escapeHtml(asset.model || 'Top Trim')}</strong>
              </div>
              <div style="background: #ffffff; border: 1px solid #cbd5e1; border-radius: 6px; padding: 6px 10px; font-size: 11.5px;">
                <small style="color: #64748b; font-size: 10px; font-weight: 750; display: block;">YEAR & AGE</small>
                <strong style="color: #0f172a; font-weight: 800;">${escapeHtml(String(asset.year || 2025))} (${ageMonths} Mos / ${ageYearsStr} Yrs)</strong>
              </div>
              <div style="background: #ffffff; border: 1px solid #cbd5e1; border-radius: 6px; padding: 6px 10px; font-size: 11.5px;">
                <small style="color: #64748b; font-size: 10px; font-weight: 750; display: block;">ODOMETER</small>
                <strong style="color: #0f172a; font-weight: 800;">${asset.odometer || asset.mileageKm ? `${Number(asset.odometer || asset.mileageKm).toLocaleString('en-IN')} km` : '18,000 km'}</strong>
              </div>
              <div style="background: #ffffff; border: 1px solid #cbd5e1; border-radius: 6px; padding: 6px 10px; font-size: 11.5px;">
                <small style="color: #64748b; font-size: 10px; font-weight: 750; display: block;">CONDITION</small>
                <strong style="color: #0f172a; font-weight: 800;">${escapeHtml(asset.condition || 'Good')} (Spinny 200-Pt)</strong>
              </div>
            </div>
          </div>

          <!-- 1-Click Sync Button -->
          <div style="display: flex; gap: 8px; flex-wrap: wrap; align-items: center;">
            <button onclick="syncAssetSpinnyValue('${escapeAttribute(asset.id)}')" class="primary-action" style="background: #0f172a; color: #ffffff; padding: 10px 18px; border-radius: 6px; border: none; font-size: 12.5px; font-weight: 800; cursor: pointer; display: inline-flex; align-items: center; gap: 8px;">
              <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: #38bdf8;"></span>
              Sync Monthly Spinny Resale Value (${money(estimatedValue)})
            </button>
            <span style="font-size: 11px; color: #64748b; font-weight: 600;">Automated real-time monthly decay curve active</span>
          </div>

        </div>
      </div>
    `;
  }

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
    if (documentFilter === "insurance") {
      list.innerHTML = `
        ${documentFilterBar()}
        ${insuranceVaultView()}
      `;
      return;
    }

    let contentHtml = "";

    if (documentFilter === "all" || documentFilter === "personal") {
      contentHtml += `
        ${documentReadinessPanel()}
        ${sectionHeader("Basic personal documents", "Tap missing items to upload")}
        ${personalDocumentChecklistCards()}
      `;
    }

    if (documentFilter === "missing") {
      contentHtml += missingDocumentCards();
    } else if (documentFilter !== "personal") {
      // For "all", "due", "expired", "stored"
      contentHtml += documentVaultCards();
      
      if (documentFilter === "all") {
        contentHtml += `${sectionHeader("Suggested Documents", "Based on assets you added")}${missingDocumentCards()}`;
      }
    }

    const familySwitcherHtml = `
      <div style="position: relative; display: block; width: 100%; margin-bottom: 20px; z-index: 10;">
        <div style="display: flex; align-items: center; gap: 12px;">
          <strong style="color: var(--text-muted); font-size: 14px;">Family Member:</strong>
          <button class="secondary-action" 
                  style="padding: 8px 16px; font-size: 14px; border-radius: 20px; background: var(--green); color: black; border-color: var(--green); font-weight: bold; cursor: pointer; display: flex; align-items: center; gap: 6px;"
                  onclick="const menu = document.getElementById('family-dropdown-menu'); menu.style.display = menu.style.display === 'none' ? 'flex' : 'none';">
            ${escapeHtml(window.currentDocumentOwner)} ▼
          </button>
        </div>
        ${window.currentDocumentOwner === 'Dad' ? `<img src="assets/dad-avatar-cutout.png" alt="Dad" style="position: absolute; right: 30px; bottom: -20px; width: 140px; height: auto; object-fit: contain; border: none; animation: popIn 0.3s ease-out; pointer-events: none;">` : ''}
        ${window.currentDocumentOwner === 'Son' ? `<img src="assets/son-avatar-cutout.png" alt="Son" style="position: absolute; right: 30px; bottom: -20px; width: 140px; height: auto; object-fit: contain; border: none; animation: popIn 0.3s ease-out; pointer-events: none;">` : ''}
        ${window.currentDocumentOwner === 'Daughter' ? `<img src="assets/daughter-avatar-cutout.png" alt="Daughter" style="position: absolute; right: 30px; bottom: -20px; width: 140px; height: auto; object-fit: contain; border: none; animation: popIn 0.3s ease-out; pointer-events: none;">` : ''}
        ${window.currentDocumentOwner === 'Mother' ? `<img src="assets/mother-avatar-cutout.png" alt="Mother" style="position: absolute; right: 30px; bottom: -20px; width: 140px; height: auto; object-fit: contain; border: none; animation: popIn 0.3s ease-out; pointer-events: none;">` : ''}
        ${window.currentDocumentOwner === 'All' ? `<img src="assets/all-avatar-cutout.png" alt="All Family" style="position: absolute; right: 30px; bottom: -20px; width: 160px; height: auto; object-fit: contain; border: none; animation: popIn 0.3s ease-out; pointer-events: none;">` : ''}
        
        <div id="family-dropdown-menu" style="display: none; position: absolute; top: 100%; left: 115px; margin-top: 8px; background: #fff; border: 1px solid var(--border); border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); padding: 8px; flex-direction: column; gap: 4px; min-width: 160px;">
          ${window.familyNamesList.map(name => `
            <button class="secondary-action" 
                    style="width: 100%; text-align: left; padding: 8px 12px; font-size: 13px; border-radius: 6px; border: none; background: ${window.currentDocumentOwner === name ? '#f1f5f9' : 'transparent'}; color: ${window.currentDocumentOwner === name ? '#0f172a' : '#475569'}; font-weight: ${window.currentDocumentOwner === name ? 'bold' : 'normal'}; cursor: pointer;"
                    onclick="window.currentDocumentOwner = '${escapeHtml(name)}'; renderCollection('documents');">
              ${escapeHtml(name)}
            </button>
          `).join("")}
          <div style="height: 1px; background: var(--border); margin: 4px 0;"></div>
          <button class="secondary-action" style="width: 100%; text-align: left; padding: 8px 12px; font-size: 13px; border-radius: 6px; border: none; background: transparent; color: #475569; cursor: pointer;" onclick="
            const names = prompt('Enter family members (comma separated):', window.familyNamesList.filter(n => n !== 'All').join(', ')); 
            if (names !== null) { 
              window.familyNamesList = ['All', ...names.split(',').map(n => n.trim()).filter(Boolean)]; 
              localStorage.setItem('familyNamesList', JSON.stringify(window.familyNamesList)); 
              if (!window.familyNamesList.includes(window.currentDocumentOwner)) window.currentDocumentOwner = 'All'; 
              renderCollection('documents'); 
            }
          ">
            ✎ Edit Names...
          </button>
        </div>
      </div>
    `;

    list.innerHTML = `
      ${familySwitcherHtml}
      ${documentFilterBar()}
      ${contentHtml}
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
  list.innerHTML = `${sectionHeader("Asset Breakdown", "Current value by category", "asset-breakdown-content")}<div id="asset-breakdown-content" style="display: none;">${allocationCards()}</div>`;
  list.innerHTML += `${sectionHeader("Action Checklist", "What to fix next")}${actionChecklistCards()}`;
  list.innerHTML += `${sectionHeader("Upcoming Reminders", "Renewals, reviews, and follow-ups")}${reminderCards()}`;
  list.innerHTML += `${sectionHeader("Simple Checks", "Keep ownership clear")}${calculatorCards()}`;
}


function goalAverage() {
  if (!state.goals.length) return 0;
  const avg = state.goals.reduce((sum, item) => sum + Math.min(100, Math.round((Number(item.saved || 0) / Number(item.target || 1)) * 100)), 0) / state.goals.length;
  return Math.round(avg);
}

function sectionHeader(heading, text, toggleId = null) {
  if (toggleId) {
    return `<div class="list-heading collapsible-header" style="cursor: pointer; user-select: none;" onclick="const el = document.getElementById('${toggleId}'); if(el.style.display === 'none'){ el.style.display = 'block'; this.querySelector('.collapse-arrow').style.transform = 'rotate(180deg)'; } else { el.style.display = 'none'; this.querySelector('.collapse-arrow').style.transform = 'rotate(0deg)'; }">
      <strong style="display: flex; align-items: center; gap: 6px;">${escapeHtml(heading)} <span class="collapse-arrow" style="font-size: 12px; transition: transform 0.2s; display: inline-block; color: #9aed68;">▼</span></strong>
      <span>${escapeHtml(text)}</span>
    </div>`;
  }
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

// --- INSURANCE HUB ---

function insuranceVaultView() {
  return `
    <div class="insurance-hub-container">
      ${insuranceAlertsAndSuggestions()}
      <div class="insurance-hub-header">
        <h2>Your Active Policies</h2>
        <p>Track coverage, renewals, and manage your insurance documents.</p>
      </div>
      <div class="insurance-policy-grid">
        ${insurancePolicyCards()}
      </div>
    </div>
  `;
}

function insuranceAlertsAndSuggestions() {
  const insurances = state.documents.filter(doc => documentGroup(doc) === "Insurance");
  const alerts = [];
  
  // Track expiries
  const today = new Date();
  insurances.forEach(doc => {
    if (doc.renewal) {
      const renewalDate = new Date(doc.renewal);
      const diffTime = renewalDate - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays < 0) {
        alerts.push({ type: 'expired', title: 'Policy Expired', message: `Your ${doc.name} expired ${Math.abs(diffDays)} days ago! Immediate renewal required to maintain coverage.` });
      } else if (diffDays <= 30) {
        alerts.push({ type: 'due', title: 'Renewal Due Soon', message: `Your ${doc.name} is expiring in ${diffDays} days. Ensure timely payment to avoid lapsing.` });
      }
    }
  });

  // AI Suggestions Logic
  const hasHealth = insurances.some(d => /health|mediclaim/i.test(d.name));
  const hasTerm = insurances.some(d => /term|life/i.test(d.name));
  
  if (!hasHealth) {
    alerts.push({ type: 'suggestion', title: 'Coverage Gap Detected', message: 'You have no Health Insurance uploaded. Consider a base cover of at least ₹10 Lakhs to protect against medical emergencies.' });
  }
  if (!hasTerm) {
    alerts.push({ type: 'suggestion', title: 'Coverage Gap Detected', message: 'You have no Term Life Insurance uploaded. A cover of 10-15x your annual income is recommended for financial security.' });
  }
  
  if (alerts.length === 0) {
    return `
      <div class="insurance-alerts-panel safe">
        <span class="shield-icon">🛡️</span>
        <div>
          <h3>Excellent Coverage Health</h3>
          <p>All your policies are active and up to date. No immediate renewals needed.</p>
        </div>
      </div>
    `;
  }

  return `
    <div class="insurance-alerts-panel">
      ${alerts.map(a => `
        <div class="insurance-alert-card ${a.type}">
          <div class="alert-icon">${a.type === 'expired' ? '⚠️' : a.type === 'due' ? '⏳' : '💡'}</div>
          <div>
            <h4>${escapeHtml(a.title)}</h4>
            <p>${escapeHtml(a.message)}</p>
            ${a.type === 'suggestion' || a.type === 'expired' ? `<button class="ai-suggest-btn">Compare Better Plans ↗</button>` : `<button class="ai-suggest-btn">Renew Policy ↗</button>`}
          </div>
        </div>
      `).join("")}
    </div>
  `;
}

function insurancePolicyCards() {
  const insurances = state.documents.filter(doc => documentGroup(doc) === "Insurance");
  
  if (!insurances.length) {
    return `
      <div class="empty-insurance-state">
        <div class="empty-icon">📁</div>
        <h3>No Policies Found</h3>
        <p>Upload your Health, Term, Vehicle, or Property insurance documents to track them here.</p>
        <button type="button" class="primary-action" data-add="documents" data-prefill-type="Insurance">Add Insurance Policy</button>
      </div>
    `;
  }

  return insurances.map(doc => {
    let statusClass = "active";
    let statusText = "Active";
    if (doc.renewal) {
      const diffDays = Math.ceil((new Date(doc.renewal) - new Date()) / (1000 * 60 * 60 * 24));
      if (diffDays < 0) {
        statusClass = "expired";
        statusText = "Expired";
      } else if (diffDays <= 30) {
        statusClass = "due";
        statusText = `Due in ${diffDays} days`;
      }
    }

    return `
      <article class="insurance-policy-card" onclick="editRecord('documents', '${doc.id}')">
        <div class="policy-card-head">
          <div class="policy-icon">📄</div>
          <span class="policy-status ${statusClass}">${statusText}</span>
        </div>
        <div class="policy-card-body">
          <h3>${escapeHtml(doc.name)}</h3>
          <span>${escapeHtml(doc.owner || "Primary Insured")}</span>
        </div>
        <div class="policy-card-footer">
          <div>
            <small>Renewal Date</small>
            <strong>${doc.renewal ? formatDate(doc.renewal) : "Not set"}</strong>
          </div>
          <div>
            <small>Type</small>
            <strong>${escapeHtml(doc.type || "Insurance")}</strong>
          </div>
        </div>
      </article>
    `;
  }).join("");
}
