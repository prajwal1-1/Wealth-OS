// ═══════════════════════════════════════════════════════════
// WEALTH OS UNIFIED DATA SYNCHRONIZATION ENGINE — data-sync.js
// Interconnects Assets, Income Streams, Cash Flow, Tax Engine,
// Digital Will Vault, Document Vault, and Executive Dashboard
// ═══════════════════════════════════════════════════════════

function syncInterconnectedData(state) {
  if (!state) return;

  state.taxDeductions = state.taxDeductions || {};
  state.incomeDetails = state.incomeDetails || {};
  state.cash = state.cash || { income: 0, expenses: 0 };
  state.incomeStreams = Array.isArray(state.incomeStreams) ? state.incomeStreams : [];
  state.assets = Array.isArray(state.assets) ? state.assets : [];
  state.liabilities = Array.isArray(state.liabilities) ? state.liabilities : [];
  state.documents = Array.isArray(state.documents) ? state.documents : [];
  state.willVault = state.willVault || {};

  // ═══════════════════════════════════════════════════════════
  // 1. ASSETS ⟷ INCOME STREAMS RECONCILIATION
  // ═══════════════════════════════════════════════════════════
  let totalAssetRentalYield = 0;
  let totalAssetDividendYield = 0;
  let totalAssetInterestYield = 0;

  state.assets.forEach(asset => {
    const typeText = `${asset.type || ''} ${asset.assetSubType || ''} ${asset.name || ''}`.toLowerCase();
    const assetVal = Number(asset.currentValue || asset.buyPrice || asset.value || 0);

    // Rental Properties (Flats, Commercial properties)
    if (/flat|apartment|house|property|rental|commercial|shop|office/.test(typeText)) {
      const explicitRent = Number(asset.rentalIncome || asset.rent || asset.monthlyRent || 0);
      const estRent = explicitRent > 0 ? explicitRent : Math.round((assetVal * 0.03) / 12);
      
      if (estRent > 0) {
        totalAssetRentalYield += (estRent * 12);
        
        // Auto-link or ensure corresponding Income Stream exists
        const streamExists = state.incomeStreams.some(s => 
          s.category === 'rental' && (s.name.includes(asset.name) || (s.linkedAssetId && s.linkedAssetId === asset.id))
        );

        if (!streamExists && explicitRent > 0) {
          state.incomeStreams.push({
            id: 'inc_auto_rent_' + (asset.id || Date.now()),
            name: `${asset.name} (Lease)`,
            category: 'rental',
            amount: explicitRent,
            frequency: 'monthly',
            isPassive: true,
            status: 'active',
            linkedAssetId: asset.id,
            notes: `Linked to property "${asset.name}"`,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
        }
      }
    }

    // Equity / Stocks / Mutual Funds (Dividend yield estimation)
    if (/investment|stock|equity|shares|mutual|etf|esop/.test(typeText) || Boolean(asset.ticker)) {
      const estAnnualDiv = Math.round(assetVal * 0.015); // ~1.5% dividend yield
      if (estAnnualDiv > 0) {
        totalAssetDividendYield += estAnnualDiv;
      }
    }

    // Fixed Deposits / PPF / Bonds / Other Funds (Interest accrual)
    if (/fd|fixed deposit|ppf|epf|nps|bond|debenture|savings|treasury/.test(typeText)) {
      const estRate = /ppf/.test(typeText) ? 0.071 : /epf/.test(typeText) ? 0.0825 : 0.07;
      const estAnnualInterest = Math.round(assetVal * estRate);
      if (estAnnualInterest > 0) {
        totalAssetInterestYield += estAnnualInterest;
      }
    }
  });

  // ═══════════════════════════════════════════════════════════
  // 2. INCOME STREAMS ⟷ CASH FLOW INTELLIGENCE & TOTALS
  // ═══════════════════════════════════════════════════════════
  let totalActiveMonthlyIncome = 0;
  let totalActiveAnnualIncome = 0;
  let salaryAnnualSum = 0;
  let rentalAnnualSum = 0;
  let freelanceAnnualSum = 0;
  let dividendAnnualSum = 0;
  let interestAnnualSum = 0;
  let otherAnnualSum = 0;

  state.incomeStreams.forEach(s => {
    if (s.status === 'active') {
      const rawAmt = Number(s.amount) || 0;
      let monthlyEquiv = rawAmt;
      let annualEquiv = rawAmt * 12;

      if (s.frequency === 'annually') {
        monthlyEquiv = Math.round(rawAmt / 12);
        annualEquiv = rawAmt;
      } else if (s.frequency === 'quarterly') {
        monthlyEquiv = Math.round(rawAmt / 3);
        annualEquiv = rawAmt * 4;
      }

      totalActiveMonthlyIncome += monthlyEquiv;
      totalActiveAnnualIncome += annualEquiv;

      if (s.category === 'salary') salaryAnnualSum += annualEquiv;
      else if (s.category === 'rental') rentalAnnualSum += annualEquiv;
      else if (s.category === 'freelance' || s.category === 'business') freelanceAnnualSum += annualEquiv;
      else if (s.category === 'dividends') dividendAnnualSum += annualEquiv;
      else if (s.category === 'interest') interestAnnualSum += annualEquiv;
      else otherAnnualSum += annualEquiv;
    }
  });

  // Keep state.cash.income aligned with recorded active income streams
  if (totalActiveMonthlyIncome > 0) {
    state.cash.income = totalActiveMonthlyIncome;
  }

  // ═══════════════════════════════════════════════════════════
  // 3. ASSETS & LOANS ⟷ TAX ENGINE DEDUCTIONS (80C, 24b, 80D)
  // ═══════════════════════════════════════════════════════════
  let total80C = 0;
  let total80D = 0;
  let totalSec24b = 0;
  let total80CCD1B = 0;

  // Scan ongoing loans in Assets (e.g. Home loans, car loans)
  state.assets.forEach(asset => {
    const loanBal = Number(asset.loanAmount || asset.loanBalance || asset.outstandingLoan || 0);
    const emi = Number(asset.emi || asset.loanEmi || 0);
    const typeText = `${asset.type || ''} ${asset.name || ''}`.toLowerCase();

    // Home Loan: Interest deduction (Sec 24b) + Principal Repayment (Sec 80C)
    if (/flat|apartment|house|property|home/.test(typeText) && (loanBal > 0 || emi > 0)) {
      const annualEmi = emi * 12;
      const estInterest = loanBal > 0 ? Math.min(200000, Math.round(loanBal * 0.085)) : Math.round(annualEmi * 0.65);
      const estPrincipal = Math.max(0, annualEmi - estInterest);

      totalSec24b += Math.min(200000, estInterest);
      total80C += Math.min(150000, estPrincipal);
    }

    // PPF, EPF, ELSS Tax Saving Mutual Funds in Assets
    if (/ppf|elss|tax saver|tax saving|provident/.test(typeText)) {
      total80C += Number(asset.currentValue || asset.buyPrice || asset.value || 0);
    }

    // NPS (National Pension Scheme) in Assets
    if (/nps|national pension/.test(typeText)) {
      total80CCD1B += Math.min(50000, Number(asset.currentValue || asset.buyPrice || asset.value || 0));
    }
  });

  // Scan Explicit Liabilities for Home Loans
  state.liabilities.forEach(l => {
    const category = l.taxCategory || l.type || '';
    const val = Number(l.value || l.amount || 0);
    const emi = Number(l.emi || l.emiAmount || 0);

    if (/home|24b|housing/.test(category.toLowerCase())) {
      const annualEmi = emi * 12;
      const estInterest = val > 0 ? Math.min(200000, Math.round(val * 0.085)) : (annualEmi > 0 ? Math.round(annualEmi * 0.65) : 150000);
      totalSec24b += Math.min(200000, estInterest);
    }
  });

  // Scan Documents for Insurance Policies (80D Health & 80C Life)
  state.documents.forEach(doc => {
    const docText = `${doc.type || ''} ${doc.name || ''}`.toLowerCase();
    const premium = Number(doc.premium || doc.annualPremium || doc.value || 0);

    if (/health insurance|mediclaim|medical insurance/.test(docText)) {
      total80D += (premium > 0 ? premium : 25000);
    } else if (/life insurance|term insurance|lic|endowment/.test(docText)) {
      total80C += (premium > 0 ? premium : 35000);
    }
  });

  // ═══════════════════════════════════════════════════════════
  // 4. APPLY SYNCED METRICS TO TAX ENGINE STATE
  // ═══════════════════════════════════════════════════════════
  state.taxDeductions._synced = state.taxDeductions._synced || {};
  state.taxDeductions._synced.sec80C = Math.min(150000, total80C);
  state.taxDeductions._synced.sec80CCD1B = Math.min(50000, total80CCD1B);
  state.taxDeductions._synced.sec80D = Math.min(75000, total80D > 0 ? total80D : 25000);
  state.taxDeductions._synced.homeLoanInterest = Math.min(200000, totalSec24b);
  state.taxDeductions._synced.sec80TTA = Math.min(10000, Math.max(totalAssetInterestYield, interestAnnualSum));

  state.incomeDetails._synced = state.incomeDetails._synced || {};
  
  // Distribute salary into tax components if salary streams exist
  if (salaryAnnualSum > 0) {
    state.incomeDetails._synced.basicSalary = Math.round(salaryAnnualSum * 0.50);
    state.incomeDetails._synced.specialAllowance = Math.round(salaryAnnualSum * 0.30);
    state.incomeDetails._synced.hra = Math.round(salaryAnnualSum * 0.20);
  }

  const netRental = rentalAnnualSum > 0 ? rentalAnnualSum : totalAssetRentalYield;
  if (netRental > 0) state.incomeDetails._synced.rentalIncome = netRental;

  const netDividend = dividendAnnualSum > 0 ? dividendAnnualSum : totalAssetDividendYield;
  if (netDividend > 0) state.incomeDetails._synced.dividendIncome = netDividend;

  const netInterest = interestAnnualSum > 0 ? interestAnnualSum : totalAssetInterestYield;
  if (netInterest > 0) state.incomeDetails._synced.bankInterest = netInterest;

  if (freelanceAnnualSum > 0) state.incomeDetails._synced.freelanceIncome = freelanceAnnualSum;
  if (otherAnnualSum > 0) state.incomeDetails._synced.otherIncome = otherAnnualSum;

  // ═══════════════════════════════════════════════════════════
  // 5. ASSETS & DEBTS ⟷ DIGITAL WILL & ESTATE INTELLIGENCE
  // ═══════════════════════════════════════════════════════════
  let totalLiabilities = state.liabilities.reduce((s, l) => s + Number(l.value || 0), 0);
  state.assets.forEach(a => {
    totalLiabilities += Number(a.loanAmount || a.loanBalance || a.outstandingLoan || 0);
  });

  let totalLifeInsuranceCoverage = 0;
  state.documents.forEach(d => {
    const text = `${d.type || ''} ${d.name || ''}`.toLowerCase();
    if (/life|term|insurance/.test(text)) {
      totalLifeInsuranceCoverage += Number(d.sumAssured || d.coverAmount || d.value || 10000000);
    }
  });

  const annualLivingCost = (state.cash.expenses || 50000) * 12;
  const recommendedCover = totalLiabilities + (annualLivingCost * 5);
  const insuranceGap = Math.max(0, recommendedCover - totalLifeInsuranceCoverage);

  state.willVault._synced = {
    totalLiabilities,
    totalLifeInsuranceCoverage,
    recommendedCover,
    insuranceGap,
    isAdequate: insuranceGap === 0
  };
}

// Automatically expose globally
if (typeof window !== 'undefined') {
  window.syncInterconnectedData = syncInterconnectedData;
}
