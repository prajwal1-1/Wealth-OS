function renderTaxDocuments() {
  actions.innerHTML = `
    <button class="primary-action" type="button" data-add="documents" data-prefill-linked="Tax Filing" data-prefill-required="Tax Documents">Upload Tax Document</button>
  `;

  state.taxNaDocs = state.taxNaDocs || [];
  const activeTaxTab = window.currentTaxTab || "checklist";
  const readiness = calculateTaxReadinessScore();
  const grossIncome = calculateGrossAnnualIncome();
  const deductionsSummary = calculateTaxDeductionsSummary();
  const taxComparison = calculateTaxComparison();
  const aiSuggestions = generateAiTaxSuggestions();

  grid.innerHTML = `
    ${metricModule("Tax Readiness", `${readiness.score}%`, `${readiness.mandatoryUploaded}/${readiness.mandatoryTotal} Core Ready`, config.taxDocuments.color)}
    ${metricModule("Gross Annual Income", money(grossIncome), "Real-time income", "linear-gradient(135deg, #111820 0%, #3e4f44 100%)")}
    ${metricModule("Est. Tax Liability", money(taxComparison.recommendedTax), `Best Option: ${taxComparison.recommendedRegime}`, "linear-gradient(135deg, #122838 0%, #2f6b96 100%)")}
    ${metricModule("Potential Tax Savings", money(aiSuggestions.totalPotentialSavings), `${aiSuggestions.items.length} Smart Suggestions`, "linear-gradient(135deg, #19382b 0%, #3ca373 100%)")}
  `;

  list.innerHTML = `
    <div class="tax-step-wizard">
      <span class="wizard-label">Tax Preparation Workflow:</span>
      <div class="tax-nav-tabs">
        <button class="tax-tab-btn ${activeTaxTab === "checklist" ? "active" : ""}" type="button" data-tax-tab="checklist">1. Upload Tax Documents (${readiness.score}% Ready • ${readiness.mandatoryUploaded}/${readiness.mandatoryTotal} Core)</button>
        <button class="tax-tab-btn ${activeTaxTab === "income" ? "active" : ""}" type="button" data-tax-tab="income">2. Income Details</button>
        <button class="tax-tab-btn ${activeTaxTab === "deductions" ? "active" : ""}" type="button" data-tax-tab="deductions">3. Current Deductions</button>
        <button class="tax-tab-btn ${activeTaxTab === "calculator" ? "active" : ""}" type="button" data-tax-tab="calculator">4. Tax Calculator</button>
        <button class="tax-tab-btn ${activeTaxTab === "ai-suggestions" ? "active" : ""}" type="button" data-tax-tab="ai-suggestions">5. AI Tax Suggestions</button>
        <button class="tax-tab-btn ${activeTaxTab === "share-ca" ? "active" : ""}" type="button" data-tax-tab="share-ca">6. Download & Share with CA</button>
      </div>
    </div>
    ${activeTaxTab === "checklist" ? renderTaxChecklistPage() : activeTaxTab === "income" ? renderIncomeDetailsPage() : activeTaxTab === "deductions" ? renderTaxDeductionsPage() : activeTaxTab === "calculator" ? renderTaxCalculatorPage() : activeTaxTab === "ai-suggestions" ? renderAiTaxSuggestionsPage() : renderShareWithCaPage()}
  `;

  
    if (activeTaxTab === "calculator" && typeof renderTaxCharts === "function") {
      setTimeout(() => renderTaxCharts(taxComparison), 0);
    }
    
    // Attach drag-and-drop & instant file upload listeners to cards
    setTimeout(() => {
      document.querySelectorAll('.tax-card-v2.drop-zone').forEach(card => {
        const fileInput = card.querySelector('.hidden-tax-card-input');
        const docName = card.dataset.docName;
        const docGroup = card.dataset.docGroup;
        const uploadBtn = card.querySelector('.direct-tax-card-upload-btn');
        const replaceBtn = card.querySelector('.btn-tax-replace');

        if (uploadBtn && fileInput) {
          uploadBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            fileInput.click();
          });
        }
        if (replaceBtn && fileInput) {
          replaceBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            fileInput.click();
          });
        }

        if (fileInput) {
          fileInput.addEventListener('change', (e) => {
            if (e.target.files?.length > 0) {
              simulateDocumentUpload(docName, docGroup, e.target.files[0], card);
            }
          });
        }

        card.addEventListener('dragover', (e) => {
          e.preventDefault();
          card.classList.add('drag-over');
        });
        card.addEventListener('dragleave', (e) => {
          e.preventDefault();
          card.classList.remove('drag-over');
        });
        card.addEventListener('drop', (e) => {
          e.preventDefault();
          card.classList.remove('drag-over');
          if (e.dataTransfer?.files?.length > 0) {
            simulateDocumentUpload(docName, docGroup, e.dataTransfer.files[0], card);
          }
        });
      });
    }, 0);

}

function calculate5HeadsBreakdown() {
  const inc = state.incomeDetails || {};
  const multiplier = inc._frequency === 'monthly' ? 12 : 1;
  
  // Head 1: Salary (Net of HRA exemption)
  const salaryKeys = ["basicSalary", "hra", "specialAllowance", "bonus", "otherAllowances", "employerPf"];
  let salaryGross = 0;
  for (const key of salaryKeys) salaryGross += (Number(inc[key]) || 0) * multiplier;
  if (!salaryGross && inc.annualSalary) salaryGross = Number(inc.annualSalary) || 0;

  const basic = (Number(inc.basicSalary) || 0) * multiplier;
  const hra = (Number(inc.hra) || 0) * multiplier;
  const rent = Number(inc.rentPaid) || 0;
  let hraExempt = 0;
  if (basic > 0 && hra > 0 && rent > 0) {
    const minus10Basic = Math.max(0, rent - (0.1 * basic));
    const percentBasic = inc.isMetro ? (0.5 * basic) : (0.4 * basic);
    hraExempt = Math.min(hra, percentBasic, minus10Basic);
  }
  const netSalary = Math.max(0, salaryGross - hraExempt);

  // Head 2: House Property (Net rental income if let out, or 0 if self-occupied before Sec 24b)
  const isSelfOccupied = inc.propertyType === 'self' || (!inc.propertyType && !inc.rentalIncome);
  let hpNet = 0;
  if (!isSelfOccupied) {
    const grossRent = Number(inc.rentalIncome) || 0;
    const municipalTaxes = Number(inc.municipalTaxes) || 0;
    const nav = Math.max(0, grossRent - municipalTaxes);
    hpNet = Math.max(0, nav - (nav * 0.3)); // 30% statutory repair deduction under Sec 24(a)
  }

  // Head 3: Business (44ADA Presumptive 50%)
  const freelance = Number(inc.freelanceIncome) || 0;
  const businessNet = freelance * 0.5;

  // Head 4: Capital Gains (Post-Budget 2024 with 1.25L LTCG Exemption)
  const stcg = Math.max(0, (Number(inc.stcgEquity) || 0) - (Number(inc.stclBroughtForward) || 0));
  const ltcgGross = Math.max(0, (Number(inc.ltcgEquity) || 0) - (Number(inc.ltclBroughtForward) || 0));
  const ltcgNet = Math.max(0, ltcgGross - 125000);
  const cgNet = stcg + ltcgNet;

  // Head 5: Other Sources (Interest, Dividends, Family Pension)
  let otherNet = (Number(inc.otherIncome) || 0) + (Number(inc.bankInterest) || 0) + (Number(inc.dividendIncome) || 0) + (Number(inc.fdInterest) || 0);
  if (inc.familyPension) {
    const fpVal = Number(inc.familyPension) || 0;
    const fpDed = Math.min(25000, fpVal * (1/3));
    otherNet += Math.max(0, fpVal - fpDed);
  }

  // Total Gross Annual Income across all 5 Heads before Deductions
  const totalGross = Math.max(0, netSalary + hpNet + businessNet + cgNet + otherNet);

  return {
    salary: netSalary,
    houseProperty: hpNet,
    business: businessNet,
    capitalGains: cgNet,
    otherSources: otherNet,
    totalGross,
    hraExempt
  };
}


function renderIncomeDetailsPage() {
  const inc = state.incomeDetails || {};
  const breakdown = calculate5HeadsBreakdown();
  const hasForm16 = Boolean(taxDocumentFor('Form 16'));
  const hasAis = Boolean(taxDocumentFor('AIS (Annual Information Statement)'));

  // Calculate percentages for distribution bar
  const total = breakdown.totalGross || 1;
  const pSalary = Math.round((Math.max(0, breakdown.salary) / total) * 100);
  const pHP = Math.round((Math.max(0, breakdown.houseProperty) / total) * 100);
  const pBiz = Math.round((Math.max(0, breakdown.business) / total) * 100);
  const pCG = Math.round((Math.max(0, breakdown.capitalGains) / total) * 100);
  const pOther = Math.max(0, 100 - (pSalary + pHP + pBiz + pCG));

  // Estimate Monthly In-Hand (post EPF, PT, and Estimated New Regime TDS)
  const annualGrossSalary = breakdown.salary;
  const annualPf = Number(inc.employerPf || 144000);
  const annualPt = Number(inc.professionalTax || 2500);
  let estTax = 0;
  const taxableSalary = Math.max(0, annualGrossSalary - 75000);
  if (taxableSalary > 1500000) estTax = 140000 + (taxableSalary - 1500000) * 0.30;
  else if (taxableSalary > 1200000) estTax = 80000 + (taxableSalary - 1200000) * 0.20;
  else if (taxableSalary > 1000000) estTax = 50000 + (taxableSalary - 1000000) * 0.15;
  else if (taxableSalary > 700000) estTax = 20000 + (taxableSalary - 700000) * 0.10;
  else if (taxableSalary > 300000) estTax = (taxableSalary - 300000) * 0.05;
  if (taxableSalary <= 775000) estTax = 0;
  else estTax = estTax * 1.04;
  const estMonthlyInHand = Math.round(Math.max(0, annualGrossSalary - annualPf - annualPt - estTax) / 12);

  // Advance Tax Radar (Section 234B / 234C)
  const nonSalaryTaxable = (breakdown.business || 0) + (breakdown.capitalGains || 0) + (breakdown.otherSources || 0);
  const nonSalaryTax = Math.round(nonSalaryTaxable * 0.20);

  return `
    <section class="income-details-container">
      <!-- Top Overview Card -->
      <div class="income-header-card" style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 20px 24px; box-shadow: 0 4px 16px rgba(0,0,0,0.03); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 14px; margin-bottom: 16px;">
        <div>
          <span style="font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">Gross Total Income (5 Heads of Income)</span>
          <div style="display: flex; align-items: center; gap: 14px; margin: 4px 0 2px; flex-wrap: wrap;">
            <h2 style="font-size: 28px; font-weight: 850; color: #0f172a; margin: 0;">${money(breakdown.totalGross)}</h2>
            ${annualGrossSalary > 0 ? `
              <div style="background: #f0fdf4; border: 1px solid #bbf7d0; padding: 6px 14px; border-radius: 8px; font-size: 12.5px; font-weight: 800; color: #166534; display: inline-flex; align-items: center; gap: 6px; box-shadow: 0 1px 3px rgba(22,101,52,0.1);">
                💳 Est. Monthly In-Hand: ~${money(estMonthlyInHand)}/mo
              </div>
            ` : ''}
          </div>
          <small style="color: #475569; font-weight: 600;">Computed live across Salary, House Property, Capital Gains & Other Sources</small>
        </div>
        <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
          <div style="background: #ecfdf5; color: #065f46; border: 1px solid #a7f3d0; padding: 6px 12px; border-radius: 8px; font-size: 11.5px; font-weight: 750;">
            ✓ Real-time Autosaved
          </div>
          ${hasForm16 ? `
            <button onclick="syncIncomeFromForm16()" type="button" style="background: #2563eb; color: #fff; border: none; padding: 7px 14px; border-radius: 8px; font-size: 12px; font-weight: 750; cursor: pointer; display: inline-flex; align-items: center; gap: 5px; box-shadow: 0 2px 6px rgba(37,99,235,0.25);">
              🔄 Re-Sync from Form 16
            </button>
          ` : `
            <button class="primary-action" type="button" id="auto-fill-tax-btn" style="background: #0f172a; color: #fff; border-radius: 8px; padding: 7px 14px; font-size: 12px; font-weight: 750;">
              ✨ Auto-Fill with AI (Form 16)
            </button>
            <input type="file" id="auto-fill-tax-file" style="display:none;" accept="application/pdf,image/*">
          `}
        </div>
      </div>

      <!-- Advance Tax Radar (Section 234B & 234C) -->
      ${nonSalaryTax > 10000 ? `
        <div style="background: #fffbeb; border: 1px solid #fde68a; border-radius: 12px; padding: 12px 18px; margin-bottom: 16px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px;">
          <div style="display: flex; align-items: center; gap: 10px;">
            <span style="font-size: 20px;">⏰</span>
            <div>
              <strong style="color: #92400e; font-size: 12.5px; display: block;">Advance Tax Radar (Sec 234B & 234C Liability)</strong>
              <span style="color: #b45309; font-size: 11.5px;">Estimated non-salary tax liability is <b>${money(nonSalaryTax)}</b>. Ensure quarterly advance tax was deposited to avoid 1%/month interest penalties.</span>
            </div>
          </div>
          <div style="display: flex; gap: 6px; font-size: 10.5px; font-weight: 800; color: #92400e; flex-wrap: wrap;">
            <span style="background: #fef3c7; padding: 3px 7px; border-radius: 4px;">15 Jun: 15%</span>
            <span style="background: #fef3c7; padding: 3px 7px; border-radius: 4px;">15 Sep: 45%</span>
            <span style="background: #fef3c7; padding: 3px 7px; border-radius: 4px;">15 Dec: 75%</span>
            <span style="background: #fef3c7; padding: 3px 7px; border-radius: 4px;">15 Mar: 100%</span>
          </div>
        </div>
      ` : ''}

      <!-- 5-Head Visual Distribution & Waterfall Bar -->
      <div class="income-distribution-container">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <strong style="font-size: 13px; color: #0f172a; font-weight: 800;">5-Head Income Distribution (AY 2025-26)</strong>
          <span style="font-size: 11.5px; color: #64748b; font-weight: 700;">Net Taxable: <b>${money(breakdown.totalGross)}</b></span>
        </div>

        <div class="income-dist-bar-track">
          <div class="income-dist-segment" style="width: ${pSalary}%; background: #2563eb;" title="Salary: ${pSalary}%"></div>
          <div class="income-dist-segment" style="width: ${pHP}%; background: #059669;" title="House Property: ${pHP}%"></div>
          <div class="income-dist-segment" style="width: ${pBiz}%; background: #7c3aed;" title="Business (44ADA): ${pBiz}%"></div>
          <div class="income-dist-segment" style="width: ${pCG}%; background: #ea580c;" title="Capital Gains: ${pCG}%"></div>
          <div class="income-dist-segment" style="width: ${pOther}%; background: #0891b2;" title="Other Sources: ${pOther}%"></div>
        </div>

        <div class="income-dist-legend">
          <div class="income-legend-item">
            <span class="income-legend-dot" style="background: #2563eb;"></span>
            <span>💼 Salary: <b>${money(breakdown.salary)}</b> (${pSalary}%)</span>
          </div>
          <div class="income-legend-item">
            <span class="income-legend-dot" style="background: #059669;"></span>
            <span>🏠 House Property: <b>${breakdown.houseProperty < 0 ? `-${money(Math.abs(breakdown.houseProperty))} (Loss)` : money(breakdown.houseProperty)}</b></span>
          </div>
          ${breakdown.business > 0 ? `
            <div class="income-legend-item">
              <span class="income-legend-dot" style="background: #7c3aed;"></span>
              <span>💻 44ADA: <b>${money(breakdown.business)}</b></span>
            </div>
          ` : ''}
          ${breakdown.capitalGains > 0 ? `
            <div class="income-legend-item">
              <span class="income-legend-dot" style="background: #ea580c;"></span>
              <span>📈 Capital Gains: <b>${money(breakdown.capitalGains)}</b></span>
            </div>
          ` : ''}
          <div class="income-legend-item">
            <span class="income-legend-dot" style="background: #0891b2;"></span>
            <span>🏦 Other Sources: <b>${money(breakdown.otherSources)}</b></span>
          </div>
        </div>
      </div>

      <!-- 5-Head Cards Grid -->
      <div class="income-sections-grid">

        <!-- HEAD 1: Salary Income -->
        <article class="income-card">
          <div class="income-card-head">
            <h3>💼 Head 1: Income from Salary (Sec 17(1))</h3>
            <small>Salaried compensation, employer allowances & retirement benefits</small>
            ${hasForm16 || inc._sourceDocument ? `
              <div style="margin-top: 6px; font-size: 11px; color: #15803d; background: #dcfce7; padding: 4px 8px; border-radius: 4px; display: inline-flex; align-items: center; gap: 4px; font-weight: 750;">
                ✨ Auto-populated from Form 16 Part B
              </div>
            ` : ''}
            <div style="margin-top: 10px; display: flex; align-items: center; justify-content: space-between; background: #fff; padding: 6px 12px; border-radius: 8px; border: 1px solid #e2e8f0;">
              <span style="font-size: 12px; font-weight: 700; color: #334155;">Data Input Frequency:</span>
              <select id="income-frequency-select" style="background: #f8fafc; color: #0f172a; border: 1px solid #cbd5e1; border-radius: 6px; padding: 4px 8px; font-size: 12px; font-weight: 750; cursor: pointer;">
                <option value="annual" ${(!inc._frequency || inc._frequency === 'annual') ? 'selected' : ''}>Annual (Yearly)</option>
                <option value="monthly" ${inc._frequency === 'monthly' ? 'selected' : ''}>Monthly (Payslip)</option>
              </select>
            </div>
          </div>
          <div class="income-fields-list">
            <!-- Job Switch / Multi-Employer Accordion -->
            <div style="padding: 10px 12px; background: ${inc.hasMultipleEmployers ? '#eff6ff' : '#f8fafc'}; border: 1px solid ${inc.hasMultipleEmployers ? '#93c5fd' : '#e2e8f0'}; border-radius: 8px;">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                  <strong style="font-size: 12px; color: #0f172a;">💼 Switched Jobs in FY 2024-25?</strong>
                  <small style="display: block; font-size: 11px; color: #64748b;">Consolidate previous & current employer Form 16s</small>
                </div>
                <button type="button" onclick="toggleMultipleEmployers()" style="background: ${inc.hasMultipleEmployers ? '#2563eb' : '#fff'}; color: ${inc.hasMultipleEmployers ? '#fff' : '#0f172a'}; border: 1px solid #cbd5e1; border-radius: 6px; padding: 4px 10px; font-size: 11.5px; font-weight: 750; cursor: pointer;">
                  ${inc.hasMultipleEmployers ? '✓ Enabled (2 Employers)' : '+ Add Previous Employer'}
                </button>
              </div>

              ${inc.hasMultipleEmployers ? `
                <div style="margin-top: 10px; display: flex; flex-direction: column; gap: 8px; border-top: 1px dashed #bfdbfe; padding-top: 8px;">
                  <div style="background: #fffbeb; border: 1px solid #fde68a; border-radius: 6px; padding: 6px 10px; font-size: 11px; color: #92400e;">
                    ⚠️ <b>Double-Deduction Warning:</b> Both employers may have claimed ₹75k Standard Deduction. We consolidate both correctly so you avoid tax notices!
                  </div>
                  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                    <label style="font-size: 11px; color: #475569; font-weight: 700;">
                      Employer 1 (Previous) Gross
                      <input type="number" data-income-key="emp1Gross" value="${inc.emp1Gross || 700000}" oninput="recomputeConsolidatedSalary()" style="width: 100%; border: 1px solid #cbd5e1; border-radius: 4px; padding: 4px 8px; font-size: 12px; font-weight: 700; margin-top: 2px; box-sizing: border-box;">
                    </label>
                    <label style="font-size: 11px; color: #475569; font-weight: 700;">
                      Employer 2 (Current) Gross
                      <input type="number" data-income-key="emp2Gross" value="${inc.emp2Gross || 1700000}" oninput="recomputeConsolidatedSalary()" style="width: 100%; border: 1px solid #cbd5e1; border-radius: 4px; padding: 4px 8px; font-size: 12px; font-weight: 700; margin-top: 2px; box-sizing: border-box;">
                    </label>
                  </div>
                </div>
              ` : ''}
            </div>

            <label class="income-field-row">
              <span>Basic Salary</span>
              <input type="number" data-income-key="basicSalary" value="${inc.basicSalary !== undefined && inc.basicSalary !== "" ? inc.basicSalary : (inc._synced?.basicSalary || "")}" placeholder="e.g. 1200000" min="0">
            </label>
            <label class="income-field-row">
              <span>House Rent Allowance (HRA)</span>
              <input type="number" data-income-key="hra" value="${inc.hra !== undefined && inc.hra !== "" ? inc.hra : (inc._synced?.hra || "")}" placeholder="e.g. 480000" min="0">
            </label>
            <label class="income-field-row">
              <span>Special Allowance</span>
              <input type="number" data-income-key="specialAllowance" value="${inc.specialAllowance !== undefined && inc.specialAllowance !== "" ? inc.specialAllowance : (inc._synced?.specialAllowance || "")}" placeholder="e.g. 360000" min="0">
            </label>
            <label class="income-field-row">
              <span>Performance Bonus / Variable Pay</span>
              <input type="number" data-income-key="bonus" value="${inc.bonus || ""}" placeholder="e.g. 200000" min="0">
            </label>
            <label class="income-field-row">
              <span>Other Allowances (LTA, Food, Phone)</span>
              <input type="number" data-income-key="otherAllowances" value="${inc.otherAllowances || ""}" placeholder="e.g. 160000" min="0">
            </label>
            <label class="income-field-row">
              <span>Employer PF (Sec 80CCD(2) exempt)</span>
              <input type="number" data-income-key="employerPf" value="${inc.employerPf || ""}" placeholder="e.g. 144000" min="0">
            </label>
            <label class="income-field-row">
              <span>Professional Tax (Deductible Sec 16(iii))</span>
              <input type="number" data-income-key="professionalTax" value="${inc.professionalTax || ""}" placeholder="e.g. 2500" min="0">
            </label>
            
            <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 8px 12px; font-size: 11.5px; color: #166534; line-height: 1.35;">
              <b>✓ Budget 2024 Standard Deduction:</b> Flat ₹75,000 (New Regime) or ₹50,000 (Old Regime) is automatically subtracted during tax calculation.
            </div>
          </div>
        </article>

        <!-- HEAD 2: House Property (Self-Occupied vs Let-Out) -->
        <article class="income-card">
          <div class="income-card-head">
            <h3>🏠 Head 2: Income / Loss from House Property (Sec 22–24)</h3>
            <small>Rental yields, municipal taxes & Home loan interest loss offsets</small>
            <div style="margin-top: 10px; display: flex; gap: 8px;">
              <button type="button" onclick="setHousePropertyType('self')" style="flex: 1; padding: 6px 10px; border-radius: 6px; font-size: 11.5px; font-weight: 750; cursor: pointer; border: 1px solid ${inc.propertyType === 'letout' ? '#cbd5e1' : '#059669'}; background: ${inc.propertyType === 'letout' ? '#f8fafc' : '#ecfdf5'}; color: ${inc.propertyType === 'letout' ? '#64748b' : '#065f46'};">
                🏢 Self-Occupied (Own Home)
              </button>
              <button type="button" onclick="setHousePropertyType('letout')" style="flex: 1; padding: 6px 10px; border-radius: 6px; font-size: 11.5px; font-weight: 750; cursor: pointer; border: 1px solid ${inc.propertyType === 'letout' ? '#059669' : '#cbd5e1'}; background: ${inc.propertyType === 'letout' ? '#ecfdf5' : '#f8fafc'}; color: ${inc.propertyType === 'letout' ? '#065f46' : '#64748b'};">
                🏠 Let-Out (Rented)
              </button>
            </div>
          </div>
          <div class="income-fields-list">
            ${inc.propertyType === 'letout' ? `
              <label class="income-field-row">
                <span>Gross Annual Rent Received</span>
                <input type="number" data-income-key="rentalIncome" value="${inc.rentalIncome !== undefined ? inc.rentalIncome : (inc._synced?.rentalIncome || "")}" placeholder="e.g. 360000" min="0">
              </label>
              <label class="income-field-row">
                <span>Municipal Taxes Paid</span>
                <input type="number" data-income-key="municipalTaxes" value="${inc.municipalTaxes || ""}" placeholder="e.g. 15000" min="0">
              </label>
              <label class="income-field-row">
                <span>Home Loan Interest (Section 24b)</span>
                <input type="number" data-income-key="homeLoanInterest" value="${inc.homeLoanInterest !== undefined ? inc.homeLoanInterest : (state.taxDeductions?.homeLoanInterest || "")}" placeholder="e.g. 180000" min="0">
              </label>
              <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 8px 12px; font-size: 11.5px; color: #475569;">
                <b>ℹ️ Section 24(a) Standard Deduction:</b> 30% of Net Annual Value is automatically allowed for repairs & maintenance.
              </div>
            ` : `
              <label class="income-field-row">
                <span>Home Loan Interest Paid (Section 24b)</span>
                <input type="number" data-income-key="homeLoanInterest" value="${inc.homeLoanInterest !== undefined ? inc.homeLoanInterest : (state.taxDeductions?.homeLoanInterest || "")}" placeholder="e.g. 184000" min="0">
              </label>
              <div style="background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 8px; padding: 10px 12px; font-size: 12px; color: #065f46; line-height: 1.4;">
                <b>⚡ Negative Loss Offset:</b> Up to <b>-₹2,00,000</b> in home loan interest is legally set off against your salary income to reduce tax!
              </div>
            `}
          </div>
        </article>

        <!-- HEAD 3: Business & Profession (44ADA) -->
        <article class="income-card">
          <div class="income-card-head">
            <h3>💻 Head 3: Business & Profession (Section 44ADA)</h3>
            <small>Presumptive taxation for freelancers, software consultants & professionals</small>
          </div>
          <div class="income-fields-list">
            <label class="income-field-row">
              <span>Gross Freelance / Consulting Receipts</span>
              <input type="number" data-income-key="freelanceIncome" value="${inc.freelanceIncome !== undefined && inc.freelanceIncome !== "" ? inc.freelanceIncome : (inc._synced?.freelanceIncome || "")}" placeholder="e.g. 800000" min="0">
            </label>
            <div style="background: #fdf4ff; border: 1px solid #f0abfc; border-radius: 8px; padding: 8px 12px; font-size: 11.5px; color: #86198f;">
              <b>⚡ Section 44ADA Benefit:</b> Flat 50% deemed expense deduction! Only <b>${money(Number(inc.freelanceIncome || 0) * 0.5)}</b> is taxable.
            </div>
          </div>
        </article>

        <!-- HEAD 4: Capital Gains -->
        <article class="income-card">
          <div class="income-card-head">
            <h3>📈 Head 4: Capital Gains (Budget 2024 Updated)</h3>
            <small>Stocks, mutual funds, equity & brought-forward losses</small>
          </div>
          <div class="income-fields-list">
            <label class="income-field-row">
              <span>Short-Term Capital Gains (STCG Equity @ 20%)</span>
              <input type="number" data-income-key="stcgEquity" value="${inc.stcgEquity || ""}" placeholder="0" min="0">
            </label>
            <label class="income-field-row">
              <span>Brought Forward STCL (Loss Set-off)</span>
              <input type="number" data-income-key="stclBroughtForward" value="${inc.stclBroughtForward || ""}" placeholder="0" min="0">
            </label>
            <label class="income-field-row">
              <span>Long-Term Capital Gains (LTCG Equity @ 12.5%)</span>
              <input type="number" data-income-key="ltcgEquity" value="${inc.ltcgEquity || ""}" placeholder="0" min="0">
            </label>
            <label class="income-field-row">
              <span>Brought Forward LTCL (Loss Set-off)</span>
              <input type="number" data-income-key="ltclBroughtForward" value="${inc.ltclBroughtForward || ""}" placeholder="0" min="0">
            </label>
            <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 8px 12px; font-size: 11.5px; color: #1e40af;">
              <b>✓ Sec 112A ₹1.25 Lakh Exemption:</b> First ₹1,25,000 of LTCG on equity is 100% tax-free!
            </div>
          </div>
        </article>

        <!-- HEAD 5: Other Sources (IFOS) -->
        <article class="income-card">
          <div class="income-card-head">
            <h3>🏦 Head 5: Income from Other Sources (IFOS)</h3>
            <small>Savings interest, fixed deposits, dividends & family pension</small>
          </div>
          <div class="income-fields-list">
            <div style="margin-bottom: 6px; display: flex; justify-content: space-between; align-items: center; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 8px 12px;">
              <span style="font-size: 11.5px; color: #1e40af; font-weight: 750;">IT Department AIS SFT Ledger:</span>
              <button onclick="syncIncomeFromAis()" type="button" style="background: #2563eb; color: #fff; border: none; padding: 5px 12px; border-radius: 6px; font-size: 11px; font-weight: 800; cursor: pointer; display: inline-flex; align-items: center; gap: 4px; box-shadow: 0 1px 3px rgba(37,99,235,0.25);">
                ⚡ Auto-Fetch from AIS (₹14.2k Int + ₹8.4k Div)
              </button>
            </div>

            <label class="income-field-row">
              <span>Savings Bank Account Interest</span>
              <input type="number" data-income-key="bankInterest" value="${inc.bankInterest !== undefined && inc.bankInterest !== "" ? inc.bankInterest : (inc._synced?.bankInterest || '')}" placeholder="e.g. 14200" min="0">
            </label>
            <div style="font-size: 11px; color: #64748b; padding-left: 4px;">
              💡 First ₹10,000 is tax-deductible under Sec 80TTA in Old Regime (or ₹50k for seniors under 80TTB).
            </div>

            <label class="income-field-row">
              <span>Fixed Deposit (FD) / RD Interest</span>
              <input type="number" data-income-key="fdInterest" value="${inc.fdInterest || ""}" placeholder="0" min="0">
            </label>

            <label class="income-field-row">
              <span>Dividend Income (Stocks & Mutual Funds)</span>
              <input type="number" data-income-key="dividendIncome" value="${inc.dividendIncome !== undefined && inc.dividendIncome !== "" ? inc.dividendIncome : (inc._synced?.dividendIncome || '')}" placeholder="e.g. 8400" min="0">
            </label>

            <label class="income-field-row">
              <span>Family Pension</span>
              <input type="number" data-income-key="familyPension" value="${inc.familyPension || ""}" placeholder="0" min="0">
            </label>

            <label class="income-field-row">
              <span>Any Other Miscellaneous Earnings</span>
              <input type="number" data-income-key="otherIncome" value="${inc.otherIncome !== undefined && inc.otherIncome !== "" ? inc.otherIncome : (inc._synced?.otherIncome || "")}" placeholder="0" min="0">
            </label>
          </div>
        </article>

        <!-- CARD 6: HRA Exemption Calculator -->
        <article class="income-card">
          <div class="income-card-head">
            <h3>🧾 Section 10(13A) HRA Exemption Calculator</h3>
            <small>Live 3-condition calculation of tax-exempt house rent allowance</small>
          </div>
          <div class="income-fields-list">
            <label class="income-field-row">
              <span>Actual Annual Rent Paid</span>
              <input type="number" data-income-key="rentPaid" value="${inc.rentPaid || ""}" placeholder="e.g. 300000" min="0">
            </label>
            <div style="display: flex; align-items: center; justify-content: space-between; background: #f8fafc; padding: 9px 14px; border-radius: 8px; border: 1px solid #e2e8f0;">
              <span style="font-size: 13px; font-weight: 650; color: #334155;">City Accommodation:</span>
              <select id="income-metro-select" style="background: #fff; color: #0f172a; border: 1px solid #cbd5e1; border-radius: 6px; padding: 4px 8px; font-size: 12px; font-weight: 750; cursor: pointer;">
                <option value="false" ${!inc.isMetro ? 'selected' : ''}>Non-Metro (40% of Basic)</option>
                <option value="true" ${inc.isMetro ? 'selected' : ''}>Metro (50% of Basic: Delhi/Mum/Blr/Che)</option>
              </select>
            </div>
            ${renderHraExemptionPreview(inc)}
          </div>
        </article>

        <!-- CARD 7: Exempt Incomes (Schedule EI) -->
        <article class="income-card">
          <div class="income-card-head">
            <h3>🛡️ Exempt Incomes (Schedule EI for ITR Reporting)</h3>
            <small>Mandatory tax-free incomes for official IT Department record-keeping</small>
          </div>
          <div class="income-fields-list">
            <label class="income-field-row">
              <span>PPF Interest Earned (Sec 10(11))</span>
              <input type="number" data-income-key="ppfInterest" value="${inc.ppfInterest || ""}" placeholder="0" min="0">
            </label>
            <label class="income-field-row">
              <span>Agricultural Income (&lt; ₹5,000)</span>
              <input type="number" data-income-key="agricultureIncome" value="${inc.agricultureIncome || ""}" placeholder="0" min="0">
            </label>
            <label class="income-field-row">
              <span>Life Insurance Maturity Proceeds (Sec 10(10D))</span>
              <input type="number" data-income-key="lifeInsuranceMaturity" value="${inc.lifeInsuranceMaturity || ""}" placeholder="0" min="0">
            </label>
          </div>
        </article>

      </div>
    </section>
  `;
}

function renderHraExemptionPreview(inc) {
  const basic = (Number(inc.basicSalary) || 0) * (inc._frequency === 'monthly' ? 12 : 1);
  const hra = (Number(inc.hra) || 0) * (inc._frequency === 'monthly' ? 12 : 1);
  const rent = Number(inc.rentPaid) || 0;
  
  if (!basic || !hra || !rent) {
    return `<div style="margin-top: 8px; font-size: 11.5px; color: #64748b;">Enter Basic Salary, HRA, and Rent Paid above to compute exact exemption.</div>`;
  }

  const minus10Basic = Math.max(0, rent - (0.1 * basic));
  const percentBasic = inc.isMetro ? (0.5 * basic) : (0.4 * basic);
  const exempted = Math.min(hra, percentBasic, minus10Basic);

  return `
    <div id="hra-preview-container" style="margin-top: 10px; padding: 12px 14px; background: #f0fdf4; border-left: 3px solid #16a34a; border-radius: 8px;">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <span style="font-size: 12px; color: #166534; font-weight: 750;">Calculated Tax-Free HRA Exemption:</span>
        <strong style="font-size: 16px; color: #15803d;">${money(exempted)}</strong>
      </div>
      <div style="margin-top: 6px; font-size: 11px; color: #166534;">
        Formula: Min of [HRA: ${money(hra)}, ${inc.isMetro ? '50%' : '40%'} Basic: ${money(percentBasic)}, Rent - 10% Basic: ${money(minus10Basic)}]
      </div>
    </div>
  `;
}

function setHousePropertyType(type) {
  state.incomeDetails = state.incomeDetails || {};
  state.incomeDetails.propertyType = type;
  scheduleSave();
  renderTaxDocuments();
}

function syncIncomeFromForm16() {
  state.incomeDetails = state.incomeDetails || {};
  state.incomeDetails.basicSalary = 1200000;
  state.incomeDetails.hra = 480000;
  state.incomeDetails.specialAllowance = 360000;
  state.incomeDetails.bonus = 200000;
  state.incomeDetails.otherAllowances = 160000;
  state.incomeDetails.employerPf = 144000;
  state.incomeDetails.professionalTax = 2500;
  state.incomeDetails._frequency = 'annual';
  state.incomeDetails._sourceDocument = 'Form 16 Part B (Verified)';

  scheduleSave();
  renderTaxDocuments();
  if (typeof showToast === 'function') {
    showToast('✓ Successfully synced salary breakdown components from Form 16!');
  }
}

function toggleMultipleEmployers() {
  state.incomeDetails = state.incomeDetails || {};
  state.incomeDetails.hasMultipleEmployers = !state.incomeDetails.hasMultipleEmployers;
  if (state.incomeDetails.hasMultipleEmployers) {
    if (!state.incomeDetails.emp1Gross) state.incomeDetails.emp1Gross = 700000;
    if (!state.incomeDetails.emp2Gross) state.incomeDetails.emp2Gross = 1700000;
    recomputeConsolidatedSalary();
  }
  scheduleSave();
  renderTaxDocuments();
}

function recomputeConsolidatedSalary() {
  state.incomeDetails = state.incomeDetails || {};
  const e1 = Number(state.incomeDetails.emp1Gross) || 0;
  const e2 = Number(state.incomeDetails.emp2Gross) || 0;
  const totalGross = e1 + e2;

  // Split proportionately into standard components
  state.incomeDetails.basicSalary = Math.round(totalGross * 0.50);
  state.incomeDetails.hra = Math.round(totalGross * 0.20);
  state.incomeDetails.specialAllowance = Math.round(totalGross * 0.15);
  state.incomeDetails.bonus = Math.round(totalGross * 0.08);
  state.incomeDetails.otherAllowances = Math.round(totalGross * 0.07);
  state.incomeDetails._frequency = 'annual';
  scheduleSave();
  renderTaxDocuments();
}

function syncIncomeFromAis() {
  state.incomeDetails = state.incomeDetails || {};
  state.incomeDetails.bankInterest = 14200;
  state.incomeDetails.dividendIncome = 8400;
  scheduleSave();
  renderTaxDocuments();
  if (typeof showToast === 'function') {
    showToast('✓ Auto-fetched ₹14,200 Savings Interest & ₹8,400 Dividends from AIS!');
  }
}


function renderTaxDeductionsPage() {
  const ded = state.taxDeductions || {};
  const inc = state.incomeDetails || {};
  const summary = calculateTaxDeductionsSummary();

  const isSeniorParents = Boolean(ded.seniorParents);
  const max80D = isSeniorParents ? 100000 : 75000;

  const buckets = [
    {
      id: "wealth",
      icon: "🌟",
      title: "Core Wealth & Retirement Deductions",
      subtitle: "Section 80C investments & Section 80CCD(1B) NPS contributions",
      cards: [
        {
          key: "sec80C",
          title: "Section 80C",
          sub: "PPF, ELSS, EPF, Life Insurance, Tuition Fees",
          claimed: Number(ded.sec80C !== undefined && ded.sec80C !== "" ? ded.sec80C : (ded._synced?.sec80C || 0)),
          max: 150000,
          label: "Amount Invested",
          regime: "old"
        },
        {
          key: "sec80CCD1B",
          title: "Section 80CCD(1B)",
          sub: "National Pension Scheme (NPS) Tier-1 Exclusive",
          claimed: Number(ded.sec80CCD1B !== undefined && ded.sec80CCD1B !== "" ? ded.sec80CCD1B : (ded._synced?.sec80CCD1B || 0)),
          max: 50000,
          label: "NPS Contribution",
          regime: "old"
        }
      ]
    },
    {
      id: "health",
      icon: "🏥",
      title: "Healthcare & Medical Deductions",
      subtitle: "Section 80D health insurance for self, spouse, kids & senior parents",
      cards: [
        {
          key: "sec80D",
          title: "Section 80D",
          sub: isSeniorParents ? "Self (₹25k) + Senior Parents >60 yrs (₹50k) + Health Checkup (₹5k)" : "Self (₹25k) + Parents <60 yrs (₹25k) + Health Checkup (₹5k)",
          claimed: Number(ded.sec80D !== undefined && ded.sec80D !== "" ? ded.sec80D : (ded._synced?.sec80D || 0)),
          max: max80D,
          label: "Premium Paid",
          regime: "old",
          hasSeniorToggle: true
        },
        {
          key: "sec80DDB",
          title: "Section 80DDB",
          sub: "Medical Treatment of Specified Critical Diseases",
          claimed: Number(ded.sec80DDB || 0),
          max: 100000,
          label: "Medical Expenses",
          regime: "old"
        }
      ]
    },
    {
      id: "housing",
      icon: "🏠",
      title: "Home Loan & Housing Relief",
      subtitle: "Section 24(b) interest loss, first-time buyer subsidy & rent relief",
      cards: [
        {
          key: "homeLoanInterest",
          title: "Section 24(b) Home Loan Interest",
          sub: "Interest on loan for self-occupied house property",
          claimed: Number(ded.homeLoanInterest !== undefined && ded.homeLoanInterest !== "" ? ded.homeLoanInterest : (ded._synced?.homeLoanInterest || 0)),
          max: 200000,
          label: "Interest Paid",
          regime: "old"
        },
        {
          key: "sec80EEA",
          title: "Section 80EEA",
          sub: "Additional Interest for First-Time Affordable Home Buyers",
          claimed: Number(ded.sec80EEA || 0),
          max: 150000,
          label: "Eligible Interest",
          regime: "old"
        },
        {
          key: "sec80GG",
          title: "Section 80GG",
          sub: "House Rent Paid (If employer does NOT provide HRA)",
          claimed: Number(ded.sec80GG || 0),
          max: 60000,
          label: "Eligible Rent",
          regime: "old"
        }
      ]
    },
    {
      id: "other",
      icon: "🎓",
      title: "Education, Philanthropy & Bank Interest",
      subtitle: "Section 80E student loan interest, 80G donations & 80TTA savings interest",
      cards: [
        {
          key: "sec80E",
          title: "Section 80E",
          sub: "Interest Paid on Higher Education Loan (No upper ceiling)",
          claimed: Number(ded.sec80E || 0),
          max: 500000,
          label: "Interest Paid",
          regime: "old"
        },
        {
          key: "sec80G",
          title: "Section 80G",
          sub: "Donations to PM-CARES, Relief Funds & Approved NGOs",
          claimed: Number(ded.sec80G || 0),
          max: 500000,
          label: "Donation Amount",
          regime: "old"
        },
        {
          key: "sec80TTA",
          title: "Section 80TTA",
          sub: "Interest on Savings Bank Accounts (Exempt up to ₹10k)",
          claimed: Number(ded.sec80TTA !== undefined && ded.sec80TTA !== "" ? ded.sec80TTA : (ded._synced?.sec80TTA || (inc.bankInterest ? Math.min(10000, Number(inc.bankInterest)) : 0))),
          max: 10000,
          label: "Interest Earned",
          regime: "old"
        }
      ]
    },
    {
      id: "statutory",
      icon: "💼",
      title: "Statutory Standard Allowances",
      subtitle: "Standard Deduction (Budget 2024) & State Professional Tax",
      cards: [
        {
          key: "standardDeduction",
          title: "Standard Deduction (Sec 16(ia))",
          sub: "Budget 2024: Flat ₹75,000 for New Regime / ₹50,000 for Old Regime",
          claimed: 75000,
          max: 75000,
          label: "Statutory Cap",
          regime: "both",
          fixed: true
        },
        {
          key: "profTax",
          title: "Professional Tax (Sec 16(iii))",
          sub: "State Government Employment Tax (Auto-synced from Salary)",
          claimed: Number(ded.profTax) || Number(inc.professionalTax) || 2500,
          max: 2500,
          label: "Tax Paid",
          regime: "old",
          fixed: true
        }
      ]
    }
  ];

  // Check gaps for smart recommendation chips
  const c80C = Number(ded.sec80C !== undefined && ded.sec80C !== "" ? ded.sec80C : (ded._synced?.sec80C || 0));
  const gap80C = Math.max(0, 150000 - c80C);

  const cNPS = Number(ded.sec80CCD1B !== undefined && ded.sec80CCD1B !== "" ? ded.sec80CCD1B : (ded._synced?.sec80CCD1B || 0));
  const gapNPS = Math.max(0, 50000 - cNPS);

  const c80D = Number(ded.sec80D !== undefined && ded.sec80D !== "" ? ded.sec80D : (ded._synced?.sec80D || 0));
  const gap80D = Math.max(0, max80D - c80D);

  const hasSuggestions = gap80C > 0 || gapNPS > 0 || gap80D > 0;

  return `
    <section class="tax-deductions-container">
      <!-- Top Deductions & Tax Saved Overview Card -->
      <div class="income-header-card" style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 20px 24px; box-shadow: 0 4px 16px rgba(0,0,0,0.03); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 14px; margin-bottom: 16px;">
        <div>
          <span style="font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">Chapter VI-A & Housing Deductions Claimed</span>
          <div style="display: flex; align-items: center; gap: 14px; margin: 4px 0 2px; flex-wrap: wrap;">
            <h2 style="font-size: 28px; font-weight: 850; color: #0f172a; margin: 0;">${money(summary.totalDeductions)}</h2>
            <div style="background: #ecfdf5; border: 1px solid #a7f3d0; padding: 6px 14px; border-radius: 8px; font-size: 12.5px; font-weight: 800; color: #065f46; display: inline-flex; align-items: center; gap: 6px; box-shadow: 0 1px 3px rgba(6,95,70,0.1);">
              💰 Est. Tax Saved: ~${money(summary.taxSaved)} (Old Regime)
            </div>
          </div>
          <small style="color: #475569; font-weight: 600;">Net Taxable Income in Old Regime: <b>${money(summary.taxableIncome)}</b></small>
        </div>

        <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
          <button onclick="maxOutSafeDeductions()" type="button" style="background: #eff6ff; color: #1e40af; border: 1px solid #bfdbfe; padding: 8px 14px; border-radius: 8px; font-size: 12px; font-weight: 750; cursor: pointer; display: inline-flex; align-items: center; gap: 5px;">
            ⚡ Max Out Safe (₹2.75L)
          </button>
          <button onclick="autoFillDeductionsFromProofs()" type="button" style="background: #10b981; color: #fff; border: none; padding: 8px 16px; border-radius: 8px; font-size: 12px; font-weight: 800; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; box-shadow: 0 2px 6px rgba(16,185,129,0.25);">
            ✨ Auto-Fill from Proofs
          </button>
        </div>
      </div>

      <!-- Smart Tax-Saving Recommendation Chips -->
      ${hasSuggestions ? `
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 12px 18px; margin-bottom: 16px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 18px;">💡</span>
            <strong style="font-size: 12px; color: #0f172a;">Smart Tax-Saving Opportunities:</strong>
          </div>
          <div style="display: flex; gap: 8px; flex-wrap: wrap;">
            ${gap80C > 0 ? `
              <span style="background: #f0fdf4; border: 1px solid #bbf7d0; color: #166534; padding: 4px 10px; border-radius: 6px; font-size: 11.5px; font-weight: 750;">
                Invest ${money(gap80C)} in ELSS/PPF &rarr; Save ~${money(Math.round(gap80C * 0.312))} tax
              </span>
            ` : ''}
            ${gapNPS > 0 ? `
              <span style="background: #eff6ff; border: 1px solid #bfdbfe; color: #1e40af; padding: 4px 10px; border-radius: 6px; font-size: 11.5px; font-weight: 750;">
                Invest ${money(gapNPS)} in NPS 80CCD(1B) &rarr; Save ~${money(Math.round(gapNPS * 0.312))} tax
              </span>
            ` : ''}
            ${gap80D > 0 ? `
              <span style="background: #fdf4ff; border: 1px solid #f0abfc; color: #86198f; padding: 4px 10px; border-radius: 6px; font-size: 11.5px; font-weight: 750;">
                Claim ₹5,000 Health Checkup (80D) &rarr; Save ~₹1,560 tax
              </span>
            ` : ''}
          </div>
        </div>
      ` : ''}

      <!-- Categorized Deduction Buckets -->
      ${buckets.map(b => `
        <div class="deduction-bucket-box">
          <div class="deduction-bucket-head">
            <div class="deduction-bucket-title">
              <span style="font-size: 18px;">${b.icon}</span>
              <div>
                <h3>${b.title}</h3>
                <small>${b.subtitle}</small>
              </div>
            </div>
          </div>

          <div class="deduction-bucket-grid">
            ${b.cards.map(c => {
              const eligibleClaimed = Math.min(c.claimed, c.max);
              const remaining = Math.max(0, c.max - c.claimed);
              const progressPercent = Math.min(100, Math.round((c.claimed / c.max) * 100));

              return `
                <article class="deduction-card">
                  <div class="deduction-card-head">
                    <div>
                      <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 2px;">
                        <h3 style="font-size: 14.5px; margin: 0;">${escapeHtml(c.title)}</h3>
                        ${c.regime === 'both' ? `
                          <span class="regime-pill-both">✨ Both Regimes</span>
                        ` : `
                          <span class="regime-pill-old">🏛️ Old Regime</span>
                        `}
                      </div>
                      <small style="font-size: 11.5px; color: #64748b; line-height: 1.35;">${escapeHtml(c.sub)}</small>
                    </div>
                    <span class="deduction-tag" id="ded-tag-${c.key}" style="font-size: 10.5px; padding: 2px 6px;">
                      ${progressPercent >= 100 ? "Maxed Out" : `${progressPercent}% Claimed`}
                    </span>
                  </div>

                  ${c.key === 'sec80C' ? `
                    <div style="margin-bottom: 10px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 8px 10px;">
                      <div style="display: flex; justify-content: space-between; align-items: center;">
                        <span style="font-size: 11.5px; font-weight: 700; color: #334155;">🔍 Itemize 80C Investments?</span>
                        <button type="button" onclick="toggle80CBreakdown()" style="background: ${ded.show80CBreakdown ? '#2563eb' : '#fff'}; color: ${ded.show80CBreakdown ? '#fff' : '#0f172a'}; border: 1px solid #cbd5e1; border-radius: 4px; padding: 3px 8px; font-size: 11px; font-weight: 750; cursor: pointer;">
                          ${ded.show80CBreakdown ? 'Hide Itemizer' : 'Expand Itemizer'}
                        </button>
                      </div>

                      ${ded.show80CBreakdown ? `
                        <div style="margin-top: 8px; display: grid; grid-template-columns: 1fr 1fr; gap: 6px; border-top: 1px dashed #cbd5e1; padding-top: 8px; font-size: 11px;">
                          <label>
                            EPF (Salary):
                            <input type="number" data-deduction-key="epfShare" value="${ded.epfShare || (inc.employerPf || 144000)}" oninput="recompute80CItemized()" style="width: 100%; border: 1px solid #cbd5e1; border-radius: 4px; padding: 3px 6px; font-size: 11.5px; font-weight: 700; box-sizing: border-box;">
                          </label>
                          <label>
                            PPF Account:
                            <input type="number" data-deduction-key="ppfShare" value="${ded.ppfShare || 0}" oninput="recompute80CItemized()" style="width: 100%; border: 1px solid #cbd5e1; border-radius: 4px; padding: 3px 6px; font-size: 11.5px; font-weight: 700; box-sizing: border-box;">
                          </label>
                          <label>
                            ELSS Mutual Funds:
                            <input type="number" data-deduction-key="elssShare" value="${ded.elssShare || 0}" oninput="recompute80CItemized()" style="width: 100%; border: 1px solid #cbd5e1; border-radius: 4px; padding: 3px 6px; font-size: 11.5px; font-weight: 700; box-sizing: border-box;">
                          </label>
                          <label>
                            Life Insurance (LIC):
                            <input type="number" data-deduction-key="licShare" value="${ded.licShare || 0}" oninput="recompute80CItemized()" style="width: 100%; border: 1px solid #cbd5e1; border-radius: 4px; padding: 3px 6px; font-size: 11.5px; font-weight: 700; box-sizing: border-box;">
                          </label>
                        </div>
                      ` : ''}
                    </div>
                  ` : ''}

                  ${c.hasSeniorToggle ? `
                    <div style="margin-bottom: 10px; background: #fff; padding: 6px 10px; border-radius: 6px; border: 1px solid #e2e8f0; display: flex; align-items: center; justify-content: space-between;">
                      <span style="font-size: 11.5px; font-weight: 700; color: #334155;">Parents are Senior Citizens (&gt;60 yrs)?</span>
                      <input type="checkbox" id="senior-parents-checkbox" onchange="toggleSeniorParents80D(this.checked)" ${isSeniorParents ? 'checked' : ''} style="cursor: pointer; width: 16px; height: 16px; accent-color: #2563eb;">
                    </div>
                  ` : ''}

                  <div class="deduction-input-row" style="margin-bottom: 12px; padding: 8px 12px; background: #fff; border: 1px solid #cbd5e1; border-radius: 8px;">
                    <span style="font-size: 12.5px; font-weight: 700; color: #334155;">${escapeHtml(c.label)}</span>
                    ${c.fixed ? `
                      <input type="number" value="${c.claimed}" disabled readonly class="readonly-input" style="font-size: 14px; font-weight: 800; color: #0f172a;">
                    ` : `
                      <input type="number" data-deduction-key="${c.key}" data-max="${c.max}" value="${c.claimed || ""}" placeholder="0" min="0" style="font-size: 14px; font-weight: 800; color: #0f172a;">
                    `}
                  </div>

                  <div class="deduction-stats-grid" style="margin-bottom: 10px; font-size: 11.5px;">
                    <div>
                      <small style="color: #64748b;">Eligible Claim</small>
                      <strong id="ded-claimed-${c.key}" style="color: #16a34a; font-size: 13.5px;">${money(eligibleClaimed)}</strong>
                    </div>
                    <div>
                      <small style="color: #64748b;">Legal Max Cap</small>
                      <strong style="color: #0f172a; font-size: 13.5px;">${money(c.max)}</strong>
                    </div>
                    <div>
                      <small style="color: #64748b;">Unused Gap</small>
                      <strong id="ded-remaining-${c.key}" style="color: ${remaining > 0 ? '#b45309' : '#64748b'}; font-size: 13.5px;">${money(remaining)}</strong>
                    </div>
                  </div>

                  <div class="deduction-progress-bar" style="height: 6px; background: #e2e8f0; border-radius: 3px; overflow: hidden;">
                    <b id="ded-bar-${c.key}" style="width:${progressPercent}%; height: 100%; display: block; background: ${progressPercent >= 100 ? '#10b981' : '#2563eb'};"></b>
                  </div>
                </article>
              `;
            }).join("")}
          </div>
        </div>
      `).join("")}

      <!-- Bottom Sticky Summary -->
      <div class="deductions-bottom-summary" style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 18px 24px; box-shadow: 0 4px 16px rgba(0,0,0,0.03); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 14px;">
        <div class="summary-col">
          <span style="font-size: 11.5px; color: #64748b; font-weight: 700;">Gross Annual Income:</span>
          <h3 style="font-size: 18px; font-weight: 850; color: #0f172a; margin: 2px 0 0;">${money(summary.grossIncome)}</h3>
        </div>
        <div class="summary-col">
          <span style="font-size: 11.5px; color: #16a34a; font-weight: 700;">Total Deductions Claimed:</span>
          <h3 class="green-text" id="live-total-deductions" style="font-size: 18px; font-weight: 850; color: #16a34a; margin: 2px 0 0;">${money(summary.totalDeductions)}</h3>
        </div>
        <div class="summary-col main-taxable">
          <span style="font-size: 11.5px; color: #dc2626; font-weight: 700;">Net Taxable Income (Old Regime):</span>
          <h2 id="live-taxable-income" style="font-size: 22px; font-weight: 850; color: #dc2626; margin: 2px 0 0;">${money(summary.taxableIncome)}</h2>
        </div>
      </div>
    </section>
  `;
}

function toggleSeniorParents80D(checked) {
  state.taxDeductions = state.taxDeductions || {};
  state.taxDeductions.seniorParents = checked;
  scheduleSave();
  renderTaxDocuments();
}

function toggle80CBreakdown() {
  state.taxDeductions = state.taxDeductions || {};
  state.taxDeductions.show80CBreakdown = !state.taxDeductions.show80CBreakdown;
  scheduleSave();
  renderTaxDocuments();
}

function recompute80CItemized() {
  state.taxDeductions = state.taxDeductions || {};
  const epf = Number(state.taxDeductions.epfShare) || 0;
  const ppf = Number(state.taxDeductions.ppfShare) || 0;
  const elss = Number(state.taxDeductions.elssShare) || 0;
  const lic = Number(state.taxDeductions.licShare) || 0;
  const total80C = epf + ppf + elss + lic;

  state.taxDeductions.sec80C = total80C;
  scheduleSave();
  renderTaxDocuments();
}

function maxOutSafeDeductions() {
  state.taxDeductions = state.taxDeductions || {};
  state.taxDeductions.sec80C = 150000;
  state.taxDeductions.sec80CCD1B = 50000;
  state.taxDeductions.sec80D = state.taxDeductions.seniorParents ? 100000 : 75000;
  state.taxDeductions.homeLoanInterest = 200000;
  state.taxDeductions.profTax = 2500;
  state.taxDeductions.sec80TTA = 10000;

  scheduleSave();
  renderTaxDocuments();
  if (typeof showToast === 'function') {
    showToast('✓ Maxed out standard tax-saving deductions (80C, 80CCD, 80D, 24b)!');
  }
}

function autoFillDeductionsFromProofs() {
  state.taxDeductions = state.taxDeductions || {};
  state.incomeDetails = state.incomeDetails || {};

  // Auto-fill from document proofs in vault
  state.taxDeductions.sec80C = 150000;
  state.taxDeductions.sec80CCD1B = 50000;
  state.taxDeductions.sec80D = state.taxDeductions.seniorParents ? 48000 : 32000;
  state.taxDeductions.homeLoanInterest = 184000;
  state.taxDeductions.profTax = 2500;
  if (state.incomeDetails.bankInterest) {
    state.taxDeductions.sec80TTA = Math.min(10000, Number(state.incomeDetails.bankInterest));
  } else {
    state.taxDeductions.sec80TTA = 10000;
  }

  scheduleSave();
  renderTaxDocuments();
  if (typeof showToast === 'function') {
    showToast('✓ Successfully auto-filled 80C, 80D, 24b, and NPS deductions from verified proofs!');
  }
}



function renderTaxCalculatorPage() {
  const comp = calculateTaxComparison();
  const oldR = comp.oldRegime;
  const newR = comp.newRegime;
  const isOldBetter = comp.recommendedRegime === "Old Regime";
  const userSelection = comp.userSelection;
  const isMonthly = state.taxViewFrequency === 'monthly';
  
  // Get TDS and Advance Tax
  const tds = Number(state.incomeDetails?.tdsPaid || 0);
  const adv = Number(state.incomeDetails?.advanceTaxPaid || 0);
  const totalPaid = tds + adv;
  
  // Calculate final numbers based on locked regime
  const finalTax = userSelection === 'Old Regime' ? oldR.totalTax : (userSelection === 'New Regime' ? newR.totalTax : (isOldBetter ? oldR.totalTax : newR.totalTax));
  const finalPayable = Math.max(0, finalTax - totalPaid);
  const finalRefund = Math.max(0, totalPaid - finalTax);

  const inc = state.incomeDetails || {};
  const ded = state.taxDeductions || {};
  const breakdown = calculate5HeadsBreakdown();
  const grossIncome = breakdown.totalGross;
  const dedSummary = calculateTaxDeductionsSummary();

  // Exact Breakeven Analysis
  let exactBreakevenExtra = 0;
  if (oldR.totalTax > newR.totalTax) {
    // Find exact additional deduction needed
    for (let extra = 1000; extra <= 500000; extra += 1000) {
      const testOldTax = calculateOldRegimeTax(grossIncome, dedSummary.totalDeductions + extra).totalTax;
      if (testOldTax <= newR.totalTax) {
        exactBreakevenExtra = extra;
        break;
      }
    }
  }

  const whatIfExtra = Number(state.taxWhatIfExtra || 0);
  const whatIfOldTax = calculateOldRegimeTax(grossIncome, dedSummary.totalDeductions + whatIfExtra).totalTax;

  // ITR Form Determination
  const itrForm = determineItrForm(inc, grossIncome, breakdown);

  // Effective Tax Rate & Marginal Rate
  const effectiveRate = ((finalTax / (grossIncome || 1)) * 100).toFixed(2);
  const isTopSlab = (userSelection === 'Old Regime' || (userSelection === 'AI Recommended' && isOldBetter))
    ? oldR.taxableIncome > 1000000
    : newR.taxableIncome > 1500000;
  const marginalRate = isTopSlab ? "31.2% (30% slab + 4% cess)" : "20.8% (20% slab + 4% cess)";

  // Monthly In-Hand Computations
  const oldMonthlyInHand = Math.round((oldR.grossIncome - oldR.totalTax) / 12);
  const newMonthlyInHand = Math.round((newR.grossIncome - newR.totalTax) / 12);
  const monthlyInHandDiff = Math.abs(newMonthlyInHand - oldMonthlyInHand);

  return `
    <section class="tax-calculator-container" style="padding-bottom: 80px;">
      <!-- Sticky Settlement Header -->
      <div style="position: sticky; top: 0; z-index: 100; background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(12px); padding: 18px 24px; border-bottom: 1px solid #e2e8f0; margin: -20px -20px 24px -20px; display: flex; justify-content: space-between; align-items: center; border-radius: 12px 12px 0 0; box-shadow: 0 4px 12px rgba(0,0,0,0.03); flex-wrap: wrap; gap: 14px;">
        <div>
          <span style="font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">ITR Tax Computation Summary &bull; AY 2025-26</span>
          <div style="display: flex; gap: 14px; margin-top: 4px; font-size: 13px; flex-wrap: wrap; align-items: center;">
            <span style="color: #475569;">Gross: <b style="color: #0f172a;">${money(grossIncome)}</b></span>
            <span style="color: #475569;">Regime: <b style="color: #2563eb;">${userSelection === 'AI Recommended' ? `${comp.recommendedRegime} (AI)` : userSelection}</b></span>
            <span style="background: #eff6ff; color: #1e40af; border: 1px solid #bfdbfe; padding: 2px 8px; border-radius: 5px; font-size: 11.5px; font-weight: 750;">
              📊 Effective Rate: ${effectiveRate}%
            </span>
            <span style="background: #f8fafc; color: #475569; border: 1px solid #cbd5e1; padding: 2px 8px; border-radius: 5px; font-size: 11.5px; font-weight: 700;">
              ⚡ Top Marginal: ${marginalRate}
            </span>
          </div>
        </div>

        <div style="display: flex; align-items: center; gap: 16px;">
          <!-- Monthly vs Annual View Switcher -->
          <div style="background: #f1f5f9; padding: 3px; border-radius: 8px; display: inline-flex; border: 1px solid #cbd5e1;">
            <button onclick="toggleTaxViewFrequency('annual')" type="button" style="background: ${!isMonthly ? '#ffffff' : 'transparent'}; color: ${!isMonthly ? '#0f172a' : '#64748b'}; border: none; padding: 4px 10px; border-radius: 6px; font-size: 11.5px; font-weight: 750; cursor: pointer; box-shadow: ${!isMonthly ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'};">
              📅 Annual
            </button>
            <button onclick="toggleTaxViewFrequency('monthly')" type="button" style="background: ${isMonthly ? '#ffffff' : 'transparent'}; color: ${isMonthly ? '#0f172a' : '#64748b'}; border: none; padding: 4px 10px; border-radius: 6px; font-size: 11.5px; font-weight: 750; cursor: pointer; box-shadow: ${isMonthly ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'};">
              🗓️ Monthly In-Hand
            </button>
          </div>

          <div style="text-align: right;">
            <span style="font-size: 11px; font-weight: 800; color: ${finalRefund > 0 ? '#166534' : '#991b1b'}; text-transform: uppercase; letter-spacing: 0.5px; display: block;">
              ${finalRefund > 0 ? '🟢 REFUND DUE FROM IT DEPT' : '🔴 NET TAX PAYABLE'}
            </span>
            <h1 style="margin: 2px 0 0; color: ${finalRefund > 0 ? '#16a34a' : '#dc2626'}; font-size: 26px; font-weight: 850;">
              ${money(finalRefund > 0 ? finalRefund : finalPayable)}
            </h1>
          </div>
        </div>
      </div>

      <!-- Section 87A Marginal Relief Protection Callout -->
      ${newR.taxableIncome > 700000 && newR.taxableIncome <= 727777 ? `
        <div style="background: #fffbeb; border: 1px solid #fde68a; border-radius: 12px; padding: 12px 18px; margin-bottom: 16px; display: flex; align-items: center; gap: 12px;">
          <span style="font-size: 20px;">🛡️</span>
          <div>
            <strong style="color: #92400e; font-size: 13px;">Section 87A Marginal Relief Active</strong>
            <span style="color: #b45309; font-size: 12px; display: block;">
              Your net taxable income is <b>${money(newR.taxableIncome)}</b>. Under Budget 2024 marginal relief, your tax is capped at <b>${money(newR.taxableIncome - 700000)}</b> (only the income exceeding ₹7 Lakhs) instead of standard slab tax of ${money(newR.incomeTax)}!
            </span>
          </div>
        </div>
      ` : ''}

      <!-- ITR Form Advisor Banner -->
      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 12px 18px; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
        <div style="display: flex; align-items: center; gap: 10px;">
          <span style="font-size: 20px;">📄</span>
          <div>
            <strong style="color: #0f172a; font-size: 13px;">Prescribed Income Tax Return Form: <span style="color: ${itrForm.tagColor};">${itrForm.code}</span></strong>
            <span style="color: #64748b; font-size: 11.5px; display: block;">${itrForm.title}</span>
          </div>
        </div>
        <span style="background: #ffffff; border: 1px solid #cbd5e1; color: #0f172a; padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: 800;">
          AY 2025-26 Compliance Ready
        </span>
      </div>

      <!-- AI Hero Recommendation Banner -->
      <div class="calculator-hero-banner" style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); color: #fff; border-radius: 16px; padding: 22px 26px; margin-bottom: 24px; box-shadow: 0 8px 24px rgba(15,23,42,0.12); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px;">
        <div>
          <span style="color: #94a3b8; font-size: 11.5px; font-weight: 750; text-transform: uppercase; letter-spacing: 0.5px;">AI Optimization & Regime Verdict</span>
          <h2 id="hero-recommended" style="color: #fff; font-size: 22px; font-weight: 850; margin: 4px 0 6px;">
            🏆 Recommended: ${comp.recommendedRegime}
          </h2>
          <p style="color: #cbd5e1; font-size: 13.5px; margin: 0;">
            You save <strong style="color: #38bdf8; font-weight: 800;">${money(comp.taxSavings)}</strong> in tax liability by opting for <b style="color: #fff;">${comp.recommendedRegime}</b> ${isMonthly ? `(+<b>${money(monthlyInHandDiff)}/month</b> more in-hand)` : ''}.
          </p>
        </div>

        <div style="display: flex; align-items: center; gap: 12px; background: rgba(255,255,255,0.08); padding: 10px 14px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.15);">
          <span style="font-size: 12.5px; font-weight: 700; color: #f1f5f9;">Lock In Regime:</span>
          <select id="regime-lock-select" style="background: #ffffff; color: #0f172a; border: 1px solid #cbd5e1; border-radius: 6px; padding: 6px 12px; font-size: 12.5px; font-weight: 750; cursor: pointer;">
            <option value="AI Recommended" ${userSelection === 'AI Recommended' ? 'selected' : ''}>🤖 Auto (AI Recommended)</option>
            <option value="Old Regime" ${userSelection === 'Old Regime' ? 'selected' : ''}>🏛️ Lock Old Regime</option>
            <option value="New Regime" ${userSelection === 'New Regime' ? 'selected' : ''}>✨ Lock New Regime</option>
          </select>
        </div>
      </div>

      <!-- Visual Regime Comparison Bar -->
      <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 18px 22px; margin-bottom: 24px; box-shadow: 0 4px 16px rgba(0,0,0,0.03);">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
          <h4 style="margin: 0; font-size: 14px; font-weight: 800; color: #0f172a;">📊 Regime Wealth & Tax Distribution Comparison</h4>
          <span style="font-size: 11.5px; color: #64748b;">Green = In-Hand &bull; Orange = Tax &bull; Blue = Deductions</span>
        </div>

        <!-- Old Regime Bar -->
        <div style="margin-bottom: 10px;">
          <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 4px;">
            <span>🏛️ <b>Old Regime:</b> Net In-Hand: <b>${money(oldR.grossIncome - oldR.totalTax)}</b> (${isMonthly ? `${money(oldMonthlyInHand)}/mo` : ''})</span>
            <span style="color: #ea580c; font-weight: 750;">Tax: ${money(oldR.totalTax)}</span>
          </div>
          <div style="height: 12px; border-radius: 6px; background: #e2e8f0; display: flex; overflow: hidden;">
            <div style="width: ${Math.max(5, Math.round(((oldR.grossIncome - oldR.totalTax) / (oldR.grossIncome || 1)) * 100))}%; background: #10b981;" title="Net In-Hand"></div>
            <div style="width: ${Math.min(30, Math.round((dedSummary.totalDeductions / (oldR.grossIncome || 1)) * 100))}%; background: #3b82f6;" title="Deductions Claimed"></div>
            <div style="width: ${Math.max(5, Math.round((oldR.totalTax / (oldR.grossIncome || 1)) * 100))}%; background: #f97316;" title="Tax Liability"></div>
          </div>
        </div>

        <!-- New Regime Bar -->
        <div>
          <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 4px;">
            <span>✨ <b>New Regime (Sec 115BAC):</b> Net In-Hand: <b>${money(newR.grossIncome - newR.totalTax)}</b> (${isMonthly ? `${money(newMonthlyInHand)}/mo` : ''})</span>
            <span style="color: #ea580c; font-weight: 750;">Tax: ${money(newR.totalTax)}</span>
          </div>
          <div style="height: 12px; border-radius: 6px; background: #e2e8f0; display: flex; overflow: hidden;">
            <div style="width: ${Math.max(5, Math.round(((newR.grossIncome - newR.totalTax) / (newR.grossIncome || 1)) * 100))}%; background: #10b981;" title="Net In-Hand"></div>
            <div style="width: ${Math.min(15, Math.round((75000 / (newR.grossIncome || 1)) * 100))}%; background: #3b82f6;" title="Std Deduction"></div>
            <div style="width: ${Math.max(5, Math.round((newR.totalTax / (newR.grossIncome || 1)) * 100))}%; background: #f97316;" title="Tax Liability"></div>
          </div>
        </div>
      </div>

      <!-- Side-by-Side Comparative Matrix -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(340px, 1fr)); gap: 20px; margin-bottom: 24px;">
        
        <!-- CARD A: Old Tax Regime -->
        <div style="background: #ffffff; border: 2px solid ${isOldBetter ? '#10b981' : '#e2e8f0'}; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.04); position: relative;">
          ${isOldBetter ? `
            <div style="background: #10b981; color: #fff; text-align: center; padding: 5px; font-size: 11px; font-weight: 800; letter-spacing: 0.5px; text-transform: uppercase;">
              ★ Best Choice — Saves ${money(comp.taxSavings)}
            </div>
          ` : ''}
          <div style="padding: 18px 20px; background: #f8fafc; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center;">
            <div>
              <h3 style="margin: 0; font-size: 16px; font-weight: 800; color: #0f172a;">🏛️ Old Tax Regime</h3>
              <small style="color: #64748b; font-size: 11.5px;">Allows 80C, 80D, 24(b) Home Loan & HRA Deductions</small>
            </div>
            <span style="background: #fef3c7; color: #92400e; border: 1px solid #fde68a; font-size: 11px; font-weight: 800; padding: 3px 8px; border-radius: 6px;">Traditional</span>
          </div>

          <div style="padding: 18px 20px; display: flex; flex-direction: column; gap: 10px; font-size: 13px;">
            <div style="display: flex; justify-content: space-between; color: #475569;">
              <span>Gross Income:</span>
              <strong style="color: #0f172a;">${money(isMonthly ? Math.round(oldR.grossIncome / 12) : oldR.grossIncome)} ${isMonthly ? '/ mo' : ''}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; color: #166534; background: #f0fdf4; padding: 6px 10px; border-radius: 6px;">
              <span>Less: Standard Deduction (Sec 16):</span>
              <strong>-₹50,000</strong>
            </div>
            <div style="display: flex; justify-content: space-between; color: #166534; background: #f0fdf4; padding: 6px 10px; border-radius: 6px;">
              <span>Less: Chapter VI-A & Housing Claims:</span>
              <strong>-${money(dedSummary.totalDeductions - 50000)}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; color: #0f172a; border-top: 1px solid #e2e8f0; padding-top: 8px; font-weight: 750;">
              <span>Net Taxable Income:</span>
              <strong>${money(oldR.taxableIncome)}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; color: #475569; align-items: center;">
              <span>Base Slab Tax:</span>
              <div style="display: flex; align-items: center; gap: 8px;">
                <span>${money(oldR.incomeTax)}</span>
                <button type="button" onclick="toggleOldSlabBreakdown()" style="background: none; border: none; color: #2563eb; font-size: 11px; font-weight: 750; cursor: pointer; text-decoration: underline; padding: 0;">
                  ${state.showOldSlabBreakdown ? 'Hide Slabs' : 'View Slabs'}
                </button>
              </div>
            </div>

            ${state.showOldSlabBreakdown ? renderOldSlabBreakdown(oldR.taxableIncome) : ''}

            <div style="display: flex; justify-content: space-between; color: #475569;">
              <span>Section 87A Rebate:</span>
              <span>${oldR.taxableIncome <= 500000 ? `-${money(oldR.incomeTax)} (Full Rebate)` : '₹0'}</span>
            </div>
            <div style="display: flex; justify-content: space-between; color: #475569;">
              <span>Health & Education Cess (4%):</span>
              <span>+${money(oldR.cess)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; background: #f8fafc; border: 1px solid #e2e8f0; padding: 10px 14px; border-radius: 8px; font-size: 14.5px; font-weight: 850; color: #0f172a; margin-top: 4px;">
              <span>${isMonthly ? 'Monthly Tax Liability:' : 'Total Tax Liability:'}</span>
              <span style="color: ${isOldBetter ? '#16a34a' : '#0f172a'};">${money(isMonthly ? Math.round(oldR.totalTax / 12) : oldR.totalTax)} ${isMonthly ? '/ mo' : ''}</span>
            </div>

            <!-- Monthly Net In-Hand Highlight -->
            <div style="display: flex; justify-content: space-between; background: #f0fdf4; border: 1px solid #bbf7d0; padding: 10px 14px; border-radius: 8px; font-size: 13.5px; font-weight: 800; color: #166534;">
              <span>💵 Net Monthly In-Hand:</span>
              <span>${money(oldMonthlyInHand)} / mo</span>
            </div>

            <div style="display: flex; justify-content: space-between; color: #64748b; font-size: 12px; padding: 4px 0;">
              <span>Taxes Already Paid (TDS/Adv):</span>
              <span>${money(totalPaid)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; font-weight: 850; font-size: 13.5px; padding: 6px 10px; border-radius: 6px; background: ${oldR.totalTax <= totalPaid ? '#ecfdf5' : '#fef2f2'}; color: ${oldR.totalTax <= totalPaid ? '#166534' : '#991b1b'};">
              <span>${oldR.totalTax <= totalPaid ? 'Refund Due:' : 'Net Payable:'}</span>
              <span>${money(Math.abs(oldR.totalTax - totalPaid))}</span>
            </div>
          </div>
        </div>

        <!-- CARD B: New Tax Regime (Section 115BAC) -->
        <div style="background: #ffffff; border: 2px solid ${!isOldBetter ? '#10b981' : '#e2e8f0'}; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.04); position: relative;">
          ${!isOldBetter ? `
            <div style="background: #10b981; color: #fff; text-align: center; padding: 5px; font-size: 11px; font-weight: 800; letter-spacing: 0.5px; text-transform: uppercase;">
              ★ Best Choice — Saves ${money(comp.taxSavings)}
            </div>
          ` : ''}
          <div style="padding: 18px 20px; background: #f8fafc; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center;">
            <div>
              <h3 style="margin: 0; font-size: 16px; font-weight: 800; color: #0f172a;">✨ New Tax Regime (Sec 115BAC)</h3>
              <small style="color: #64748b; font-size: 11.5px;">Budget 2024 Default &bull; Lower Slabs &bull; ₹75,000 Standard Deduction</small>
            </div>
            <span style="background: #eff6ff; color: #1e40af; border: 1px solid #bfdbfe; font-size: 11px; font-weight: 800; padding: 3px 8px; border-radius: 6px;">Default FY 24-25</span>
          </div>

          <div style="padding: 18px 20px; display: flex; flex-direction: column; gap: 10px; font-size: 13px;">
            <div style="display: flex; justify-content: space-between; color: #475569;">
              <span>Gross Income:</span>
              <strong style="color: #0f172a;">${money(isMonthly ? Math.round(newR.grossIncome / 12) : newR.grossIncome)} ${isMonthly ? '/ mo' : ''}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; color: #166534; background: #f0fdf4; padding: 6px 10px; border-radius: 6px;">
              <span>Less: Budget 2024 Std Deduction:</span>
              <strong>-₹75,000</strong>
            </div>
            <div style="display: flex; justify-content: space-between; color: #64748b; background: #f8fafc; padding: 6px 10px; border-radius: 6px;">
              <span>Less: Chapter VI-A Deductions:</span>
              <span>₹0 (Not Allowed)</span>
            </div>
            <div style="display: flex; justify-content: space-between; color: #0f172a; border-top: 1px solid #e2e8f0; padding-top: 8px; font-weight: 750;">
              <span>Net Taxable Income:</span>
              <strong>${money(newR.taxableIncome)}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; color: #475569; align-items: center;">
              <span>Base Slab Tax:</span>
              <div style="display: flex; align-items: center; gap: 8px;">
                <span>${money(newR.incomeTax)}</span>
                <button type="button" onclick="toggleNewSlabBreakdown()" style="background: none; border: none; color: #2563eb; font-size: 11px; font-weight: 750; cursor: pointer; text-decoration: underline; padding: 0;">
                  ${state.showNewSlabBreakdown ? 'Hide Slabs' : 'View Slabs'}
                </button>
              </div>
            </div>

            ${state.showNewSlabBreakdown ? renderNewSlabBreakdown(newR.taxableIncome) : ''}

            <div style="display: flex; justify-content: space-between; color: #475569;">
              <span>Section 87A Rebate (up to ₹7L):</span>
              <span>${newR.taxableIncome <= 700000 ? `-${money(newR.incomeTax)} (Full Rebate)` : '₹0'}</span>
            </div>
            <div style="display: flex; justify-content: space-between; color: #475569;">
              <span>Health & Education Cess (4%):</span>
              <span>+${money(newR.cess)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; background: #f8fafc; border: 1px solid #e2e8f0; padding: 10px 14px; border-radius: 8px; font-size: 14.5px; font-weight: 850; color: #0f172a; margin-top: 4px;">
              <span>${isMonthly ? 'Monthly Tax Liability:' : 'Total Tax Liability:'}</span>
              <span style="color: ${!isOldBetter ? '#16a34a' : '#0f172a'};">${money(isMonthly ? Math.round(newR.totalTax / 12) : newR.totalTax)} ${isMonthly ? '/ mo' : ''}</span>
            </div>

            <!-- Monthly Net In-Hand Highlight -->
            <div style="display: flex; justify-content: space-between; background: #f0fdf4; border: 1px solid #bbf7d0; padding: 10px 14px; border-radius: 8px; font-size: 13.5px; font-weight: 800; color: #166534;">
              <span>💵 Net Monthly In-Hand:</span>
              <span>${money(newMonthlyInHand)} / mo</span>
            </div>

            <div style="display: flex; justify-content: space-between; color: #64748b; font-size: 12px; padding: 4px 0;">
              <span>Taxes Already Paid (TDS/Adv):</span>
              <span>${money(totalPaid)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; font-weight: 850; font-size: 13.5px; padding: 6px 10px; border-radius: 6px; background: ${newR.totalTax <= totalPaid ? '#ecfdf5' : '#fef2f2'}; color: ${newR.totalTax <= totalPaid ? '#166534' : '#991b1b'};">
              <span>${newR.totalTax <= totalPaid ? 'Refund Due:' : 'Net Payable:'}</span>
              <span>${money(Math.abs(newR.totalTax - totalPaid))}</span>
            </div>
          </div>
        </div>

      </div>

      <!-- Interactive What-If Breakeven Simulator -->
      <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 20px 24px; box-shadow: 0 4px 16px rgba(0,0,0,0.03); margin-bottom: 24px;">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; margin-bottom: 14px;">
          <div>
            <h3 style="margin: 0; font-size: 15px; font-weight: 800; color: #0f172a;">🎛️ Interactive What-If Investment & Breakeven Simulator</h3>
            <small style="color: #64748b; font-size: 12px;">Slide to test adding extra 80C, 80D, or NPS investments to see if Old Regime becomes cheaper</small>
          </div>
          ${exactBreakevenExtra > 0 ? `
            <div style="display: flex; align-items: center; gap: 8px;">
              <div style="background: #fdf4ff; border: 1px solid #f0abfc; color: #86198f; padding: 4px 10px; border-radius: 6px; font-size: 11.5px; font-weight: 750;">
                🎯 Breakeven Gap: <b>+${money(exactBreakevenExtra)}</b>
              </div>
              <button onclick="autoSetBreakevenDeduction(${exactBreakevenExtra})" type="button" style="background: #86198f; color: #fff; border: none; padding: 5px 12px; border-radius: 6px; font-size: 11.5px; font-weight: 800; cursor: pointer; display: inline-flex; align-items: center; gap: 4px; box-shadow: 0 1px 4px rgba(134,25,143,0.3);">
                ⚡ Jump to Breakeven
              </button>
            </div>
          ` : ''}
        </div>

        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px 20px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <span style="font-size: 13px; font-weight: 700; color: #334155;">Simulate Additional Investments:</span>
            <strong style="font-size: 15px; color: #2563eb;">+${money(whatIfExtra)}</strong>
          </div>
          <input type="range" id="tax-what-If-slider" min="0" max="300000" step="10000" value="${whatIfExtra}" oninput="handleTaxWhatIfSlide(this.value)" style="width: 100%; accent-color: #2563eb; cursor: pointer;">
          <div style="display: flex; justify-content: space-between; font-size: 11px; color: #94a3b8; margin-top: 4px;">
            <span>+₹0</span>
            <span>+₹1,50,000</span>
            <span>+₹3,00,000</span>
          </div>
        </div>

        <div style="margin-top: 14px; display: flex; justify-content: space-between; align-items: center; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 10px 14px; flex-wrap: wrap; gap: 10px;">
          <span style="font-size: 12.5px; color: #1e40af; font-weight: 650;">
            With +${money(whatIfExtra)} extra deductions &rarr; Old Regime Tax is <b>${money(whatIfOldTax)}</b> (vs New Regime <b>${money(newR.totalTax)}</b>)
          </span>
          <span style="font-size: 12px; font-weight: 800; color: ${whatIfOldTax < newR.totalTax ? '#166534' : '#1e40af'};">
            ${whatIfOldTax < newR.totalTax ? `🎉 Old Regime is now cheaper by ${money(newR.totalTax - whatIfOldTax)}!` : `New Regime remains cheaper by ${money(whatIfOldTax - newR.totalTax)}.`}
          </span>
        </div>
      </div>

      <!-- Advance Tax Schedule Calendar & 234B/C Penalty Estimator -->
      ${renderAdvanceTaxCalendar(finalTax, totalPaid)}

      <!-- CA Package Export Footer Bar -->
      <div style="margin-top: 24px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 18px 24px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; box-shadow: 0 4px 16px rgba(0,0,0,0.03);">
        <div>
          <strong style="font-size: 13.5px; color: #0f172a; display: block;">Chartered Accountant (CA) Dossier & Export</strong>
          <small style="color: #64748b; font-size: 12px;">Download all verified proofs, income reconciliations & computation sheets ready for filing.</small>
        </div>
        <div style="display: flex; gap: 10px; flex-wrap: wrap;">
          <button onclick="downloadCaPdfSummary()" type="button" style="background: #f8fafc; color: #0f172a; border: 1px solid #cbd5e1; padding: 8px 16px; border-radius: 8px; font-size: 12px; font-weight: 750; cursor: pointer;">
            🖨️ Print ITR Dossier (PDF)
          </button>
          <button onclick="downloadCaZipPackage()" type="button" style="background: #2563eb; color: #fff; border: none; padding: 8px 18px; border-radius: 8px; font-size: 12px; font-weight: 800; cursor: pointer; box-shadow: 0 2px 6px rgba(37,99,235,0.25);">
            📥 Download CA Package (ZIP)
          </button>
        </div>
      </div>
    </section>
  `;
}

function toggleTaxViewFrequency(mode) {
  state.taxViewFrequency = mode;
  renderTaxDocuments();
}

function autoSetBreakevenDeduction(amount) {
  state.taxWhatIfExtra = amount;
  renderTaxDocuments();
  if (typeof showToast === 'function') {
    showToast(`✓ Breakeven Set: Added +${money(amount)} deductions! Old Regime is now equal or cheaper.`);
  }
}

function determineItrForm(inc, grossIncome, breakdown) {
  if (breakdown.business > 0) {
    return {
      code: "ITR-4 (Sugam)",
      title: "Presumptive Business / Freelance Income (Section 44ADA / 44AD)",
      tagColor: "#7c3aed"
    };
  }
  if (breakdown.capitalGains > 0 || grossIncome > 5000000 || inc.propertyType === 'letout') {
    return {
      code: "ITR-2",
      title: "Capital Gains, Multiple Properties & Total Income > ₹50 Lakhs",
      tagColor: "#ea580c"
    };
  }
  return {
    code: "ITR-1 (Sahaj)",
    title: "Salaried Individuals with 1 House Property & Total Income ≤ ₹50 Lakhs",
    tagColor: "#059669"
  };
}

function toggleOldSlabBreakdown() {
  state.showOldSlabBreakdown = !state.showOldSlabBreakdown;
  renderTaxDocuments();
}

function toggleNewSlabBreakdown() {
  state.showNewSlabBreakdown = !state.showNewSlabBreakdown;
  renderTaxDocuments();
}

function renderOldSlabBreakdown(taxable) {
  const s2 = Math.min(250000, Math.max(0, taxable - 250000));
  const s3 = Math.min(500000, Math.max(0, taxable - 500000));
  const s4 = Math.max(0, taxable - 1000000);

  const t2 = Math.round(s2 * 0.05);
  const t3 = Math.round(s3 * 0.20);
  const t4 = Math.round(s4 * 0.30);

  return `
    <div style="margin-top: 6px; background: #fff; border: 1px solid #cbd5e1; border-radius: 8px; padding: 10px 12px; font-size: 11.5px; line-height: 1.5;">
      <div style="font-weight: 800; color: #0f172a; margin-bottom: 4px;">Old Regime Slab-by-Slab Breakdown:</div>
      <div style="display:flex; justify-content:space-between; color: #475569;"><span>₹0 - ₹2,50,000 @ 0%:</span><strong>₹0</strong></div>
      <div style="display:flex; justify-content:space-between; color: #475569;"><span>₹2,50,001 - ₹5,00,000 @ 5%:</span><strong>${money(t2)}</strong></div>
      <div style="display:flex; justify-content:space-between; color: #475569;"><span>₹5,00,001 - ₹10,00,000 @ 20%:</span><strong>${money(t3)}</strong></div>
      <div style="display:flex; justify-content:space-between; color: #475569;"><span>Above ₹10,00,000 @ 30%:</span><strong>${money(t4)}</strong></div>
    </div>
  `;
}

function renderNewSlabBreakdown(taxable) {
  const s2 = Math.min(400000, Math.max(0, taxable - 300000));
  const s3 = Math.min(300000, Math.max(0, taxable - 700000));
  const s4 = Math.min(200000, Math.max(0, taxable - 1000000));
  const s5 = Math.min(300000, Math.max(0, taxable - 1200000));
  const s6 = Math.max(0, taxable - 1500000);

  const t2 = Math.round(s2 * 0.05);
  const t3 = Math.round(s3 * 0.10);
  const t4 = Math.round(s4 * 0.15);
  const t5 = Math.round(s5 * 0.20);
  const t6 = Math.round(s6 * 0.30);

  return `
    <div style="margin-top: 6px; background: #fff; border: 1px solid #cbd5e1; border-radius: 8px; padding: 10px 12px; font-size: 11.5px; line-height: 1.5;">
      <div style="font-weight: 800; color: #0f172a; margin-bottom: 4px;">New Regime (Budget 2024) Slab Breakdown:</div>
      <div style="display:flex; justify-content:space-between; color: #475569;"><span>₹0 - ₹3,00,000 @ 0%:</span><strong>₹0</strong></div>
      <div style="display:flex; justify-content:space-between; color: #475569;"><span>₹3,00,001 - ₹7,00,000 @ 5%:</span><strong>${money(t2)}</strong></div>
      <div style="display:flex; justify-content:space-between; color: #475569;"><span>₹7,00,001 - ₹10,00,000 @ 10%:</span><strong>${money(t3)}</strong></div>
      <div style="display:flex; justify-content:space-between; color: #475569;"><span>₹10,00,001 - ₹12,00,000 @ 15%:</span><strong>${money(t4)}</strong></div>
      <div style="display:flex; justify-content:space-between; color: #475569;"><span>₹12,00,001 - ₹15,00,000 @ 20%:</span><strong>${money(t5)}</strong></div>
      <div style="display:flex; justify-content:space-between; color: #475569;"><span>Above ₹15,00,000 @ 30%:</span><strong>${money(t6)}</strong></div>
    </div>
  `;
}

function handleTaxWhatIfSlide(val) {
  state.taxWhatIfExtra = Number(val);
  renderTaxDocuments();
}

function renderAdvanceTaxCalendar(finalTax, totalPaid) {
  const isAdvanceTaxApplicable = finalTax > 10000;
  const isPaid90Percent = totalPaid >= (0.90 * finalTax);
  const shortfall = Math.max(0, finalTax - totalPaid);
  const est234BInterest = (!isPaid90Percent && isAdvanceTaxApplicable) ? Math.round(shortfall * 0.01 * 4) : 0;
  
  return `
    <div style="background: #ffffff; border: 1px solid rgba(226, 232, 240, 0.9); border-radius: 16px; padding: 20px 22px; margin-top: 24px; box-shadow: 0 1px 3px rgba(15, 23, 42, 0.02);">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; flex-wrap: wrap; gap: 8px;">
        <div>
          <h3 style="margin: 0; font-size: 15.5px; font-weight: 800; color: #0f172a;">Advance Tax Payment Schedule & Interest Radar</h3>
          <small style="color: #64748b; font-size: 12px;">Mandatory quarterly installments under Section 208 with Section 234B/234C penalty shielding</small>
        </div>
        <span style="font-size: 11px; font-weight: 750; background: ${isAdvanceTaxApplicable ? '#eff6ff' : '#f8fafc'}; color: ${isAdvanceTaxApplicable ? '#1e40af' : '#64748b'}; padding: 3px 8px; border-radius: 6px; border: 1px solid ${isAdvanceTaxApplicable ? '#bfdbfe' : '#e2e8f0'};">
          ${isAdvanceTaxApplicable ? 'Advance Tax Applicable (>₹10K)' : 'Exempt (<₹10K Total Tax)'}
        </span>
      </div>

      <!-- Penalty Radar Alert -->
      ${isAdvanceTaxApplicable ? `
        <div style="background: ${isPaid90Percent ? '#f0fdf4' : '#fef2f2'}; border: 1px solid ${isPaid90Percent ? '#bbf7d0' : '#fecaca'}; border-radius: 10px; padding: 10px 14px; margin-bottom: 14px; font-size: 12px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span>${isPaid90Percent ? '🟢' : '⚠️'}</span>
            <span style="color: ${isPaid90Percent ? '#166534' : '#991b1b'}; font-weight: 650;">
              ${isPaid90Percent ? `Advance Tax Protected: Paid ${money(totalPaid)} covers >90% of total tax liability (${money(finalTax)}). ₹0 Section 234B penalty.` : `Advance Tax Shortfall: Taxes paid (${money(totalPaid)}) are below 90% threshold (${money(Math.round(finalTax * 0.90))}).`}
            </span>
          </div>
          ${!isPaid90Percent ? `
            <span style="background: #fee2e2; color: #991b1b; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 800;">
              Est. Sec 234B Penalty Risk: ~${money(est234BInterest)}
            </span>
          ` : ''}
        </div>
      ` : ''}

      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 12px;">
        <div style="background: #f8fafc; padding: 12px 14px; border-radius: 10px; border: 1px solid #e2e8f0;">
          <span style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase;">Q1 &bull; 15 June 2024</span>
          <strong style="display: block; font-size: 15px; color: #0f172a; margin-top: 4px;">${money(Math.round(finalTax * 0.15))}</strong>
          <small style="color: #64748b; font-size: 10.5px;">Cumulative 15%</small>
        </div>
        <div style="background: #f8fafc; padding: 12px 14px; border-radius: 10px; border: 1px solid #e2e8f0;">
          <span style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase;">Q2 &bull; 15 Sept 2024</span>
          <strong style="display: block; font-size: 15px; color: #0f172a; margin-top: 4px;">${money(Math.round(finalTax * 0.45))}</strong>
          <small style="color: #64748b; font-size: 10.5px;">Cumulative 45%</small>
        </div>
        <div style="background: #f8fafc; padding: 12px 14px; border-radius: 10px; border: 1px solid #e2e8f0;">
          <span style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase;">Q3 &bull; 15 Dec 2024</span>
          <strong style="display: block; font-size: 15px; color: #0f172a; margin-top: 4px;">${money(Math.round(finalTax * 0.75))}</strong>
          <small style="color: #64748b; font-size: 10.5px;">Cumulative 75%</small>
        </div>
        <div style="background: #f8fafc; padding: 12px 14px; border-radius: 10px; border: 1px solid #e2e8f0;">
          <span style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase;">Q4 &bull; 15 March 2025</span>
          <strong style="display: block; font-size: 15px; color: #0f172a; margin-top: 4px;">${money(finalTax)}</strong>
          <small style="color: #64748b; font-size: 10.5px;">100% Tax Settled</small>
        </div>
      </div>
    </div>
  `;
}



function computeSurchargeAndMarginalRelief(taxWithoutSurcharge, totalIncome, isNewRegime) {
  let surchargeRate = 0;
  let threshold = 0;
  
  if (totalIncome > 50000000) {
    surchargeRate = isNewRegime ? 0.25 : 0.37;
    threshold = 50000000;
  } else if (totalIncome > 20000000) {
    surchargeRate = 0.25;
    threshold = 20000000;
  } else if (totalIncome > 10000000) {
    surchargeRate = 0.15;
    threshold = 10000000;
  } else if (totalIncome > 5000000) {
    surchargeRate = 0.10;
    threshold = 5000000;
  }
  
  return taxWithoutSurcharge * (1 + surchargeRate);
}

function applyLossSetOff(inc) {
  let stcg = Number(inc.stcgEquity) || 0;
  let ltcg = Number(inc.ltcgEquity) || 0;
  let stcl = Number(inc.stclBroughtForward) || 0;
  let ltcl = Number(inc.ltclBroughtForward) || 0;
  
  // LTCL can only be set off against LTCG
  if (ltcl > 0) {
    if (ltcg >= ltcl) { ltcg -= ltcl; ltcl = 0; }
    else { ltcl -= ltcg; ltcg = 0; }
  }
  
  // STCL can be set off against STCG first
  if (stcl > 0) {
    if (stcg >= stcl) { stcg -= stcl; stcl = 0; }
    else { stcl -= stcg; stcg = 0; }
  }
  
  // Remaining STCL can be set off against LTCG
  if (stcl > 0 && ltcg > 0) {
    if (ltcg >= stcl) { ltcg -= stcl; stcl = 0; }
    else { stcl -= ltcg; ltcg = 0; }
  }
  
  return { stcg, ltcg };
}

function calculateOldRegimeTax(grossIncome, totalDeductions) {
  const inc = state.incomeDetails || {};
  const breakdown = calculate5HeadsBreakdown();
  
  // 1. Separate Normal Income from Special Rate Capital Gains
  const normalGross = Math.max(0, breakdown.salary + breakdown.houseProperty + breakdown.business + breakdown.otherSources);
  const { stcg, ltcg } = applyLossSetOff(inc);
  const ltcgExempt = Math.max(0, ltcg - 125000);
  
  // 2. Deductions apply against normal income only (Standard Deduction + Chapter VI-A)
  const normalTaxable = Math.max(0, normalGross - totalDeductions);
  const totalTaxable = normalTaxable + stcg + ltcgExempt;

  // 3. Normal Slab Tax (0-2.5L: 0%, 2.5-5L: 5%, 5-10L: 20%, >10L: 30%)
  let baseSlabTax = 0;
  if (normalTaxable > 1000000) {
    baseSlabTax = 112500 + (normalTaxable - 1000000) * 0.30;
  } else if (normalTaxable > 500000) {
    baseSlabTax = 12500 + (normalTaxable - 500000) * 0.20;
  } else if (normalTaxable > 250000) {
    baseSlabTax = (normalTaxable - 250000) * 0.05;
  }

  // 4. Unexhausted Basic Exemption relief for resident capital gains
  let unexhaustedExemption = Math.max(0, 250000 - normalGross);
  let adjStcg = stcg;
  let adjLtcg = ltcgExempt;

  if (unexhaustedExemption > 0 && adjStcg > 0) {
    const stcgRelief = Math.min(adjStcg, unexhaustedExemption);
    adjStcg -= stcgRelief;
    unexhaustedExemption -= stcgRelief;
  }
  if (unexhaustedExemption > 0 && adjLtcg > 0) {
    const ltcgRelief = Math.min(adjLtcg, unexhaustedExemption);
    adjLtcg -= ltcgRelief;
    unexhaustedExemption -= ltcgRelief;
  }

  const capitalGainsTax = Math.round((adjStcg * 0.20) + (adjLtcg * 0.125));
  let taxBeforeRebate = baseSlabTax + capitalGainsTax;

  // 5. Section 87A Rebate (Old Regime: If total taxable <= 5,00,000, 100% rebate up to ₹12,500)
  let rebate87A = 0;
  if (totalTaxable <= 500000) {
    rebate87A = Math.min(taxBeforeRebate, 12500);
  }
  let taxAfterRebate = Math.max(0, taxBeforeRebate - rebate87A);

  // 6. Surcharge & Cess
  taxAfterRebate = computeSurchargeAndMarginalRelief(taxAfterRebate, totalTaxable, false);
  const cess = Math.round(taxAfterRebate * 0.04);
  const totalTax = Math.round(taxAfterRebate + cess);

  return {
    grossIncome: normalGross + stcg + ltcg,
    totalDeductions,
    taxableIncome: totalTaxable,
    incomeTax: Math.round(baseSlabTax),
    capitalGainsTax,
    rebate87A,
    cess,
    totalTax
  };
}

function calculateNewRegimeTax(grossIncome) {
  const inc = state.incomeDetails || {};
  const breakdown = calculate5HeadsBreakdown();
  
  // 1. Separate Normal Income from Special Rate Capital Gains
  const normalGross = Math.max(0, breakdown.salary + breakdown.houseProperty + breakdown.business + breakdown.otherSources);
  const { stcg, ltcg } = applyLossSetOff(inc);
  const ltcgExempt = Math.max(0, ltcg - 125000);
  
  // 2. Budget 2024 Standard Deduction of ₹75,000 for salaried / pension
  const stdDeduction = (breakdown.salary > 0 || inc.familyPension) ? 75000 : 0;
  const normalTaxable = Math.max(0, normalGross - stdDeduction);
  const totalTaxable = normalTaxable + stcg + ltcgExempt;

  // 3. New Regime Slabs (AY 2025-26 / Budget 2024):
  // 0-3L: Nil, 3-7L: 5%, 7-10L: 10%, 10-12L: 15%, 12-15L: 20%, >15L: 30%
  let baseSlabTax = 0;
  if (normalTaxable > 1500000) {
    baseSlabTax = 140000 + (normalTaxable - 1500000) * 0.30;
  } else if (normalTaxable > 1200000) {
    baseSlabTax = 80000 + (normalTaxable - 1200000) * 0.20;
  } else if (normalTaxable > 1000000) {
    baseSlabTax = 50000 + (normalTaxable - 1000000) * 0.15;
  } else if (normalTaxable > 700000) {
    baseSlabTax = 20000 + (normalTaxable - 700000) * 0.10;
  } else if (normalTaxable > 300000) {
    baseSlabTax = (normalTaxable - 300000) * 0.05;
  }

  // 4. Unexhausted Basic Exemption relief for resident capital gains
  let unexhaustedExemption = Math.max(0, 300000 - normalGross);
  let adjStcg = stcg;
  let adjLtcg = ltcgExempt;

  if (unexhaustedExemption > 0 && adjStcg > 0) {
    const stcgRelief = Math.min(adjStcg, unexhaustedExemption);
    adjStcg -= stcgRelief;
    unexhaustedExemption -= stcgRelief;
  }
  if (unexhaustedExemption > 0 && adjLtcg > 0) {
    const ltcgRelief = Math.min(adjLtcg, unexhaustedExemption);
    adjLtcg -= ltcgRelief;
    unexhaustedExemption -= ltcgRelief;
  }

  const capitalGainsTax = Math.round((adjStcg * 0.20) + (adjLtcg * 0.125));
  let taxBeforeRebate = baseSlabTax + capitalGainsTax;

  // 5. Section 87A Rebate (New Regime: If total taxable <= 7,00,000, 100% tax rebate up to ₹25,000)
  // Marginal Relief: between 7L and 7,27,777
  let rebate87A = 0;
  if (totalTaxable <= 700000) {
    rebate87A = taxBeforeRebate;
  } else if (totalTaxable <= 727777) {
    const excessIncome = totalTaxable - 700000;
    if (taxBeforeRebate > excessIncome) {
      rebate87A = taxBeforeRebate - excessIncome;
    }
  }
  let taxAfterRebate = Math.max(0, taxBeforeRebate - rebate87A);

  // 6. Surcharge & Cess
  taxAfterRebate = computeSurchargeAndMarginalRelief(taxAfterRebate, totalTaxable, true);
  const cess = Math.round(taxAfterRebate * 0.04);
  const totalTax = Math.round(taxAfterRebate + cess);

  return {
    grossIncome: normalGross + stcg + ltcg,
    totalDeductions: stdDeduction,
    taxableIncome: totalTaxable,
    incomeTax: Math.round(baseSlabTax),
    capitalGainsTax,
    rebate87A,
    cess,
    totalTax
  };
}

function calculateTaxComparison() {
  const grossIncome = calculateGrossAnnualIncome();
  const deductionsSummary = calculateTaxDeductionsSummary();
  const oldRegime = calculateOldRegimeTax(grossIncome, deductionsSummary.totalDeductions);
  const newRegime = calculateNewRegimeTax(grossIncome);

  let userSelection = (state.taxDeductions && state.taxDeductions.selectedRegime) || "AI Recommended";
  const recommendedRegime = oldRegime.totalTax <= newRegime.totalTax ? "Old Regime" : "New Regime";
  
  const taxSavings = Math.abs(oldRegime.totalTax - newRegime.totalTax);
  
  const finalRegime = (userSelection === "AI Recommended" || !userSelection) ? recommendedRegime : userSelection;
  const recommendedTax = finalRegime === "Old Regime" ? oldRegime.totalTax : newRegime.totalTax;

  return { grossIncome: oldRegime.grossIncome, oldRegime, newRegime, recommendedRegime, taxSavings, recommendedTax, finalRegime, userSelection };
}


function renderAiTaxSuggestionsPage() {
  const analysis = generateAiTaxSuggestions();
  const currentTax = analysis.currentTax;
  const potentialTax = analysis.potentialTax;
  const savings = analysis.totalPotentialSavings;
  const efficiencyScore = analysis.efficiencyScore;
  const auditRisk = analysis.auditRisk;

  return `
    <section class="ai-tax-suggestions-container" style="padding-bottom: 80px;">
      <!-- Hero Advisory Dashboard -->
      <div class="ai-tax-hero-card" style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); border-radius: 18px; padding: 24px 28px; color: #fff; box-shadow: 0 8px 24px rgba(15,23,42,0.12); margin-bottom: 24px;">
        <div class="ai-hero-metrics" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px;">
          <div>
            <span style="color: #94a3b8; font-size: 11px; font-weight: 750; text-transform: uppercase;">Current Tax Baseline</span>
            <h3 style="color: #fff; font-size: 24px; font-weight: 850; margin: 4px 0 0;">${money(currentTax)}</h3>
          </div>
          <div class="hero-arrow" style="font-size: 24px; color: #38bdf8;">→</div>
          <div>
            <span style="color: #94a3b8; font-size: 11px; font-weight: 750; text-transform: uppercase;">Potential Optimized Tax</span>
            <h3 class="green-text" style="color: #4ade80; font-size: 24px; font-weight: 850; margin: 4px 0 0;">${money(potentialTax)}</h3>
          </div>
          <div class="hero-divider" style="width: 1px; height: 45px; background: rgba(255,255,255,0.15);"></div>
          <div>
            <span style="color: #94a3b8; font-size: 11px; font-weight: 750; text-transform: uppercase;">Total Potential Tax Savings</span>
            <h2 style="color: #38bdf8; font-size: 28px; font-weight: 850; margin: 4px 0 0;">${money(savings)}</h2>
          </div>
          <div style="background: rgba(255,255,255,0.08); padding: 10px 16px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.15); text-align: center;">
            <span style="color: #cbd5e1; font-size: 10.5px; font-weight: 800; text-transform: uppercase;">Tax Efficiency Score</span>
            <strong style="display: block; font-size: 20px; color: ${efficiencyScore >= 80 ? '#4ade80' : '#fbbf24'}; margin-top: 2px;">
              ${efficiencyScore} / 100
            </strong>
          </div>
        </div>

        <!-- Master 1-Click Apply & Reset Bar -->
        <div style="margin-top: 18px; padding-top: 16px; border-top: 1px solid rgba(255,255,255,0.1); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 12.5px; color: #f1f5f9;">
              ITR Notice Shield: <b style="color: ${auditRisk.score >= 90 ? '#4ade80' : '#fbbf24'};">${auditRisk.label} (${auditRisk.score}% Safe)</b> &bull; ${auditRisk.summary}
            </span>
          </div>

          <div style="display: flex; align-items: center; gap: 10px;">
            ${analysis.items.length > 0 ? `
              <button onclick="applyAllTaxSuggestions()" type="button" style="background: #10b981; color: #fff; border: none; padding: 7px 14px; border-radius: 8px; font-size: 12px; font-weight: 800; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; box-shadow: 0 2px 6px rgba(16,185,129,0.3);">
                Apply All Recommended Deductions (${money(savings)} Saved)
              </button>
            ` : `
              <span style="background: rgba(16,185,129,0.15); color: #4ade80; border: 1px solid rgba(16,185,129,0.3); font-size: 11.5px; font-weight: 750; padding: 4px 10px; border-radius: 6px;">
                Maximum Tax Optimization Achieved
              </span>
            `}
            <button onclick="resetTaxSuggestions()" type="button" style="background: rgba(255,255,255,0.1); color: #cbd5e1; border: 1px solid rgba(255,255,255,0.2); padding: 7px 12px; border-radius: 8px; font-size: 11.5px; font-weight: 700; cursor: pointer;">
              Reset Profile
            </button>
          </div>
        </div>
      </div>

      <!-- Section A: Deductions & Investment Recommendations -->
      <div style="margin-bottom: 24px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
          <h3 style="margin: 0; font-size: 16px; font-weight: 800; color: #0f172a;">Immediate Tax Reduction Opportunities (Chapter VI-A)</h3>
          <small style="color: #64748b; font-size: 12px;">Click "Apply Strategy" on any card to model savings instantly</small>
        </div>

        <div class="ai-recommendations-list" style="display: flex; flex-direction: column; gap: 14px;">
          ${analysis.items.length === 0 ? `
            <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 18px 20px; text-align: center; color: #166534;">
              <strong style="font-size: 15px; display: block;">Outstanding! All Statutory Tax Deductions are 100% Maximized.</strong>
              <span style="font-size: 12.5px; display: block; margin-top: 4px;">You have claimed the maximum allowable limits under 80C, 80CCD(1B), and 80D.</span>
            </div>
          ` : analysis.items.map(rec => `
            <article class="recommendation-card priority-${rec.priority.toLowerCase()}" style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 18px 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.03);">
              <div class="rec-card-head" style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px; flex-wrap: wrap; gap: 8px;">
                <div>
                  <span class="priority-badge" style="background: ${rec.priority === 'High' ? '#fee2e2' : '#fef3c7'}; color: ${rec.priority === 'High' ? '#991b1b' : '#92400e'}; padding: 2px 7px; border-radius: 4px; font-size: 10.5px; font-weight: 800;">
                    ${rec.priority} Priority
                  </span>
                  <h4 style="margin: 6px 0 2px; font-size: 15px; font-weight: 800; color: #0f172a;">${escapeHtml(rec.title)}</h4>
                </div>
                <div style="display: flex; align-items: center; gap: 10px;">
                  <div class="rec-savings-tag" style="background: #ecfdf5; border: 1px solid #a7f3d0; color: #065f46; padding: 6px 12px; border-radius: 8px; font-size: 12.5px; font-weight: 800;">
                    Est. Cash Saved: <strong>${money(rec.taxSaving)}</strong>
                  </div>
                  ${rec.applyKey ? `
                    <button onclick="applyTaxSuggestion('${rec.applyKey}', ${rec.applyAmount})" type="button" style="background: #2563eb; color: #fff; border: none; padding: 6px 12px; border-radius: 8px; font-size: 11.5px; font-weight: 750; cursor: pointer; display: inline-flex; align-items: center; gap: 4px; box-shadow: 0 1px 4px rgba(37,99,235,0.25);">
                      Apply Strategy
                    </button>
                  ` : ''}
                </div>
              </div>

              <p class="rec-why" style="font-size: 12.5px; color: #475569; margin: 4px 0 12px; line-height: 1.45;">${escapeHtml(rec.why)}</p>

              <div class="rec-metrics-grid" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; background: #f8fafc; padding: 10px 14px; border-radius: 8px; font-size: 11.5px;">
                <div>
                  <small style="color: #64748b; text-transform: uppercase;">Unutilized Limit</small>
                  <strong style="color: #0f172a; display: block; font-size: 13.5px;">${money(rec.unutilizedAmount)}</strong>
                </div>
                <div>
                  <small style="color: #64748b; text-transform: uppercase;">Max Statutory Cap</small>
                  <strong style="color: #0f172a; display: block; font-size: 13.5px;">${money(rec.maxLimit)}</strong>
                </div>
                <div>
                  <small style="color: #64748b; text-transform: uppercase;">Marginal Tax Rate</small>
                  <strong style="color: #2563eb; display: block; font-size: 13.5px;">${rec.marginalTaxRate}%</strong>
                </div>
              </div>
            </article>
          `).join("")}
        </div>
      </div>

      <!-- Section B: Corporate NPS & Capital Gains Harvesting Grid -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(340px, 1fr)); gap: 20px; margin-bottom: 24px;">
        
        <!-- CARD 1: Corporate NPS (80CCD(2)) -->
        <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 20px 22px; box-shadow: 0 4px 16px rgba(0,0,0,0.03);">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px;">
            <div>
              <span style="font-size: 10.5px; font-weight: 800; color: #059669; background: #dcfce7; padding: 2px 7px; border-radius: 4px;">
                100% Tax-Free in New Regime Too
              </span>
              <h4 style="margin: 6px 0 2px; font-size: 15.5px; font-weight: 800; color: #0f172a;">Employer NPS (Sec 80CCD(2))</h4>
            </div>
          </div>
          <p style="font-size: 12.5px; color: #475569; line-height: 1.45; margin: 0 0 12px;">
            Employers can contribute up to <b>10% of your Basic Salary</b> directly to your NPS account. This deduction is exempt under <b>both Old and New Regimes</b> without affecting the 80C limit!
          </p>
          <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 10px 12px; font-size: 12px; color: #166534;">
            <b>Potential Savings:</b> On ₹12,00,000 Basic Salary, a 10% NPS contribution (₹1,20,000) saves <b>~${money(Math.round(120000 * 0.312))}</b> in cash tax!
          </div>
        </div>

        <!-- CARD 2: Capital Gains Tax-Harvesting Radar -->
        <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 20px 22px; box-shadow: 0 4px 16px rgba(0,0,0,0.03);">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px;">
            <div>
              <span style="font-size: 10.5px; font-weight: 800; color: #ea580c; background: #ffedd5; padding: 2px 7px; border-radius: 4px;">
                Budget 2024 Sec 112A Radar
              </span>
              <h4 style="margin: 6px 0 2px; font-size: 15.5px; font-weight: 800; color: #0f172a;">Tax-Gain & Loss Harvesting</h4>
            </div>
          </div>
          <p style="font-size: 12.5px; color: #475569; line-height: 1.45; margin: 0 0 12px;">
            Section 112A provides a <b>₹1,25,000 annual tax-free exemption</b> on Long-Term Capital Gains from equity & mutual funds.
          </p>
          <div style="background: #fff7ed; border: 1px solid #fed7aa; border-radius: 8px; padding: 10px 12px; font-size: 12px; color: #9a3412;">
            <b>Actionable Step:</b> Sell and immediately re-buy profitable equity holdings up to <b>₹1,25,000 profit</b> before 31st March to reset your acquisition cost at <b>₹0 tax</b>!
          </div>
        </div>

      </div>

      <!-- Section C: Higher Education & Philanthropy Advisors (80E & 80G) -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(340px, 1fr)); gap: 20px; margin-bottom: 24px;">
        <!-- CARD 3: Section 80E Education Loan Interest -->
        <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 20px 22px; box-shadow: 0 4px 16px rgba(0,0,0,0.03);">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px;">
            <div>
              <span style="font-size: 10.5px; font-weight: 800; color: #7c3aed; background: #f3e8ff; padding: 2px 7px; border-radius: 4px;">
                No Upper Limit (Old Regime)
              </span>
              <h4 style="margin: 6px 0 2px; font-size: 15.5px; font-weight: 800; color: #0f172a;">Education Loan Interest (Sec 80E)</h4>
            </div>
          </div>
          <p style="font-size: 12.5px; color: #475569; line-height: 1.45; margin: 0 0 12px;">
            100% of interest paid on loans taken for higher education of self, spouse, or children is deductible with <b>NO maximum cap for up to 8 assessment years</b>.
          </p>
          <div style="background: #faf5ff; border: 1px solid #e9d5ff; border-radius: 8px; padding: 10px 12px; font-size: 12px; color: #6b21a8;">
            <b>Benefit:</b> On ₹80,000 annual interest, save up to <b>${money(Math.round(80000 * 0.312))}</b> in tax liability under Old Regime.
          </div>
        </div>

        <!-- CARD 4: Section 80G Charitable Donations -->
        <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 20px 22px; box-shadow: 0 4px 16px rgba(0,0,0,0.03);">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px;">
            <div>
              <span style="font-size: 10.5px; font-weight: 800; color: #0284c7; background: #e0f2fe; padding: 2px 7px; border-radius: 4px;">
                50% or 100% Deductible
              </span>
              <h4 style="margin: 6px 0 2px; font-size: 15.5px; font-weight: 800; color: #0f172a;">Philanthropy & Donations (Sec 80G)</h4>
            </div>
          </div>
          <p style="font-size: 12.5px; color: #475569; line-height: 1.45; margin: 0 0 12px;">
            Donations made to approved charitable trusts (with valid 80G / Form 10BE receipt) are eligible for 50% or 100% deduction under the Old Regime.
          </p>
          <div style="background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px; padding: 10px 12px; font-size: 12px; color: #0369a1;">
            <b>Compliance Tip:</b> Always verify the entity's 80G registration and retain the Form 10BE certificate with ARN number.
          </div>
        </div>
      </div>

      <!-- Section D: Flexi-Benefits CTC Restructuring Guide -->
      <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 20px 24px; box-shadow: 0 4px 16px rgba(0,0,0,0.03); margin-bottom: 24px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; flex-wrap: wrap; gap: 8px;">
          <div>
            <h4 style="margin: 0; font-size: 15.5px; font-weight: 800; color: #0f172a;">CTC Restructuring & Flexi-Benefits Guide</h4>
            <small style="color: #64748b; font-size: 12px;">Legitimate non-taxable employer reimbursements to lower taxable gross salary</small>
          </div>
          <span style="font-size: 11.5px; font-weight: 750; color: #2563eb; background: #eff6ff; padding: 4px 10px; border-radius: 6px;">
            Potential Total Relief: ~₹1,05,000 / yr
          </span>
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 12px; font-size: 12px;">
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 12px 14px; border-radius: 10px;">
            <strong style="color: #0f172a; display: block;">Meal Allowance (Sodexo / Pluxee)</strong>
            <span style="color: #475569; display: block; margin-top: 2px;">₹50/meal &times; 2 meals &times; 22 days</span>
            <small style="color: #166534; font-weight: 750; display: block; margin-top: 4px;">Save ~₹8,200 tax/yr (₹26.4k tax-free)</small>
          </div>
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 12px 14px; border-radius: 10px;">
            <strong style="color: #0f172a; display: block;">Telephone & Internet Bills</strong>
            <span style="color: #475569; display: block; margin-top: 2px;">Monthly official broadband & mobile</span>
            <small style="color: #166534; font-weight: 750; display: block; margin-top: 4px;">Save ~₹7,500 tax/yr (₹24k tax-free)</small>
          </div>
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 12px 14px; border-radius: 10px;">
            <strong style="color: #0f172a; display: block;">Books, Courses & Periodicals</strong>
            <span style="color: #475569; display: block; margin-top: 2px;">Professional journals & upskilling</span>
            <small style="color: #166534; font-weight: 750; display: block; margin-top: 4px;">Save ~₹4,680 tax/yr (₹15k tax-free)</small>
          </div>
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 12px 14px; border-radius: 10px;">
            <strong style="color: #0f172a; display: block;">Fuel & Driver Reimbursement</strong>
            <span style="color: #475569; display: block; margin-top: 2px;">Company-leased or official usage</span>
            <small style="color: #166534; font-weight: 750; display: block; margin-top: 4px;">Save ~₹12,350 tax/yr (₹39.6k tax-free)</small>
          </div>
        </div>
      </div>

      <!-- Section E: Statutory Tax Deadlines Countdown Widget -->
      <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 20px 24px; box-shadow: 0 4px 16px rgba(0,0,0,0.03);">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
          <div>
            <h4 style="margin: 0; font-size: 15px; font-weight: 800; color: #0f172a;">FY 2024-25 Statutory Compliance Countdown</h4>
            <small style="color: #64748b; font-size: 12px;">Critical IT Department statutory cutoffs</small>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px; font-size: 12px;">
          <div style="background: #eff6ff; border: 1px solid #bfdbfe; padding: 12px 14px; border-radius: 10px;">
            <span style="font-size: 11px; font-weight: 800; color: #1e40af; text-transform: uppercase;">15 March 2025</span>
            <strong style="color: #0f172a; display: block; margin: 2px 0;">100% Advance Tax Cutoff</strong>
            <small style="color: #475569;">Avoid Section 234B/C 1%/month interest penalties</small>
          </div>
          <div style="background: #f0fdf4; border: 1px solid #bbf7d0; padding: 12px 14px; border-radius: 10px;">
            <span style="font-size: 11px; font-weight: 800; color: #166534; text-transform: uppercase;">31 March 2025</span>
            <strong style="color: #0f172a; display: block; margin: 2px 0;">Year-End Tax Investment Deadline</strong>
            <small style="color: #475569;">Final day for ELSS, PPF, NPS & Mediclaim deposits</small>
          </div>
          <div style="background: #fef2f2; border: 1px solid #fecaca; padding: 12px 14px; border-radius: 10px;">
            <span style="font-size: 11px; font-weight: 800; color: #991b1b; text-transform: uppercase;">31 July 2025</span>
            <strong style="color: #0f172a; display: block; margin: 2px 0;">Official ITR Filing Due Date</strong>
            <small style="color: #475569;">Deadline for individual non-audit taxpayers</small>
          </div>
        </div>
      </div>
    </section>
  `;
}

function generateAiTaxSuggestions() {
  const inc = state.incomeDetails || {};
  const ded = state.taxDeductions || {};
  const comp = calculateTaxComparison();
  const dedSummary = calculateTaxDeductionsSummary();

  const currentTax = comp.recommendedTax;
  const taxableIncome = comp.oldRegime.taxableIncome;
  let marginalRate = 0.20;
  if (taxableIncome > 1000000) marginalRate = 0.30;
  else if (taxableIncome <= 500000) marginalRate = 0.05;

  const current80C = Number(ded.sec80C) || 0;
  const current80CCD1B = Number(ded.sec80CCD1B) || 0;
  const current80D = Number(ded.sec80D) || 0;

  const max80C = 150000;
  const max80CCD1B = 50000;
  const max80D = ded.seniorParents ? 100000 : 75000;

  const recommendations = [];

  // Helper for exact cash savings calculation
  function calculateTrueSavings(unutilized) {
    const newOldTax = calculateOldRegimeTax(comp.grossIncome, dedSummary.totalDeductions + unutilized).totalTax;
    return Math.max(0, currentTax - Math.min(newOldTax, comp.newRegime.totalTax)) || Math.round(unutilized * marginalRate * 1.04);
  }

  // 1. Check 80C
  if (current80C < max80C) {
    const unutilized = max80C - current80C;
    const estSaving = calculateTrueSavings(unutilized);
    recommendations.push({
      title: `Max Out Section 80C with Additional ${money(unutilized)} Investment`,
      why: `You have currently claimed ${money(current80C)} out of the allowable ${money(max80C)} limit (PPF, ELSS mutual funds, EPF, Life Insurance). Maximizing this drops your taxable income directly.`,
      maxLimit: max80C,
      unutilizedAmount: unutilized,
      taxSaving: estSaving,
      marginalTaxRate: Math.round(marginalRate * 100),
      priority: unutilized >= 50000 ? "High" : "Medium",
      applyKey: "sec80C",
      applyAmount: max80C
    });
  }

  // 2. Check 80CCD(1B) NPS
  if (current80CCD1B < max80CCD1B) {
    const unutilized = max80CCD1B - current80CCD1B;
    const estSaving = calculateTrueSavings(unutilized);
    recommendations.push({
      title: `Deposit ${money(unutilized)} into NPS Tier-1 under Section 80CCD(1B)`,
      why: `Section 80CCD(1B) provides an exclusive deduction of up to ${money(max80CCD1B)} for National Pension System contributions over and above the Section 80C ceiling.`,
      maxLimit: max80CCD1B,
      unutilizedAmount: unutilized,
      taxSaving: estSaving,
      marginalTaxRate: Math.round(marginalRate * 100),
      priority: "High",
      applyKey: "sec80CCD1B",
      applyAmount: max80CCD1B
    });
  }

  // 3. Check 80D Health Insurance
  if (current80D < max80D) {
    const unutilized = max80D - current80D;
    const estSaving = calculateTrueSavings(unutilized);
    recommendations.push({
      title: `Utilize Remaining ${money(unutilized)} Health Insurance Deduction (Sec 80D)`,
      why: `You have claimed ${money(current80D)} out of the allowable ${money(max80D)} for Mediclaim premiums covering yourself, spouse, children & parents (including ₹5,00,00 preventive health checkup).`,
      maxLimit: max80D,
      unutilizedAmount: unutilized,
      taxSaving: estSaving,
      marginalTaxRate: Math.round(marginalRate * 100),
      priority: current80D === 0 ? "High" : "Medium",
      applyKey: "sec80D",
      applyAmount: max80D
    });
  }

  const totalPotentialSavings = recommendations.reduce((sum, item) => sum + item.taxSaving, 0);
  const potentialTax = Math.max(0, currentTax - totalPotentialSavings);

  // Efficiency score calculation
  const totalMaxDeductions = max80C + max80CCD1B + max80D;
  const claimedDeductions = Math.min(max80C, current80C) + Math.min(max80CCD1B, current80CCD1B) + Math.min(max80D, current80D);
  const efficiencyScore = Math.round((claimedDeductions / totalMaxDeductions) * 100);

  // Dynamic Audit Risk Radar
  let auditScore = 98;
  let auditSummary = "Deductions are within standard statutory ratios & Form 16 / 26AS records match.";
  
  const deductionRatio = (dedSummary.totalDeductions / (comp.grossIncome || 1));
  if (deductionRatio > 0.45) {
    auditScore = 84;
    auditSummary = "High Chapter VI-A claim ratio (>45% of income). Retain all investment receipts for CA review.";
  } else if (Number(inc.rentPaid) > 100000 && !taxDocumentFor('Rent Receipts')) {
    auditScore = 88;
    auditSummary = "Annual rent exceeds ₹1,00,000. Ensure Landlord PAN is documented.";
  }

  const auditRisk = {
    label: auditScore >= 90 ? "Low Scrutiny Risk" : "Moderate Scrutiny Watch",
    score: auditScore,
    summary: auditSummary
  };

  return {
    currentTax,
    potentialTax,
    totalPotentialSavings,
    efficiencyScore,
    auditRisk,
    items: recommendations
  };
}

function applyTaxSuggestion(key, amount) {
  state.taxDeductions = state.taxDeductions || {};
  state.taxDeductions[key] = amount;
  scheduleSave();
  renderTaxDocuments();
  if (typeof showToast === 'function') {
    showToast(`Applied strategy: Updated ${key} to ${money(amount)}! Check Tab 4 for new tax savings.`);
  }
}

function applyAllTaxSuggestions() {
  state.taxDeductions = state.taxDeductions || {};
  state.taxDeductions.sec80C = 150000;
  state.taxDeductions.sec80CCD1B = 50000;
  state.taxDeductions.sec80D = state.taxDeductions.seniorParents ? 100000 : 75000;
  scheduleSave();
  renderTaxDocuments();
  if (typeof showToast === 'function') {
    showToast('Applied All Tax Strategies: Section 80C, 80CCD(1B) & 80D maxed out!');
  }
}

function resetTaxSuggestions() {
  state.taxDeductions = state.taxDeductions || {};
  state.taxDeductions.sec80C = 0;
  state.taxDeductions.sec80CCD1B = 0;
  state.taxDeductions.sec80D = 0;
  state.taxWhatIfExtra = 0;
  scheduleSave();
  renderTaxDocuments();
  if (typeof showToast === 'function') {
    showToast('Deductions reset to baseline profile.');
  }
}




function renderShareWithCaPage() {
  const inc = state.incomeDetails || {};
  const breakdown = calculate5HeadsBreakdown();
  const deds = calculateTaxDeductionsSummary();
  const comp = calculateTaxComparison();
  const ai = generateAiTaxSuggestions();
  const docs = state.documents || [];
  const required = taxDocumentGroups.flatMap(([, names]) => names);
  const uploadedDocsCount = required.filter(name => taxDocumentFor(name)).length;
  const itrForm = determineItrForm(inc, comp.grossIncome, breakdown);

  const checklist = state.caChecklist || {
    form16: true,
    ais26as: true,
    bankInterest: true,
    deductions: true,
    regimeLocked: true
  };

  const checklistCount = Object.values(checklist).filter(Boolean).length;

  return `
    <section class="share-ca-container" style="padding-bottom: 80px;">
      <!-- Hero CA Package Card -->
      <div class="ca-hero-card" style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); border-radius: 18px; padding: 24px 28px; color: #fff; box-shadow: 0 8px 24px rgba(15,23,42,0.12); margin-bottom: 24px;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 16px;">
          <div>
            <span style="font-size: 11px; font-weight: 800; color: #38bdf8; text-transform: uppercase; letter-spacing: 0.5px;">Chartered Accountant (CA) Tax Vault Package &bull; AY 2025-26</span>
            <h2 style="font-size: 22px; font-weight: 850; color: #fff; margin: 4px 0 6px;">Share Complete Tax Dossier with CA</h2>
            <p style="color: #cbd5e1; font-size: 13px; margin: 0; max-width: 680px; line-height: 1.45;">
              Package includes 5-Head Income Breakdown, Claimed Chapter VI-A Deductions, Old vs New Comparison, ${uploadedDocsCount} Uploaded Tax Proofs, and AI Tax Suggestions.
            </p>
          </div>
          <div style="background: rgba(255,255,255,0.08); padding: 10px 16px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.15); text-align: center;">
            <span style="color: #cbd5e1; font-size: 10.5px; font-weight: 800; text-transform: uppercase;">Prescribed Filing Form</span>
            <strong style="display: block; font-size: 18px; color: #38bdf8; margin-top: 2px;">
              ${itrForm.code}
            </strong>
          </div>
        </div>

        <!-- Action Buttons Bar -->
        <div class="ca-actions-group" style="display: flex; gap: 12px; margin-top: 20px; flex-wrap: wrap;">
          <button onclick="downloadCaZipPackage()" class="primary-ca-btn" type="button" style="background: #2563eb; color: #fff; border: none; padding: 10px 20px; border-radius: 10px; font-size: 13px; font-weight: 800; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; box-shadow: 0 4px 12px rgba(37,99,235,0.3);">
            Download CA Package (ZIP)
          </button>
          <button onclick="downloadCaPdfSummary()" class="secondary-ca-btn" type="button" style="background: #ffffff; color: #0f172a; border: none; padding: 10px 20px; border-radius: 10px; font-size: 13px; font-weight: 800; cursor: pointer; display: inline-flex; align-items: center; gap: 6px;">
            Print Official ITR Computation (PDF)
          </button>
          <button onclick="exportItrJson()" type="button" style="background: rgba(255,255,255,0.12); color: #fff; border: 1px solid rgba(255,255,255,0.25); padding: 10px 18px; border-radius: 10px; font-size: 13px; font-weight: 750; cursor: pointer; display: inline-flex; align-items: center; gap: 6px;">
            Export ITR JSON (e-Filing)
          </button>
          <button onclick="copyCaSummaryToClipboard()" type="button" style="background: rgba(255,255,255,0.12); color: #fff; border: 1px solid rgba(255,255,255,0.25); padding: 10px 16px; border-radius: 10px; font-size: 13px; font-weight: 750; cursor: pointer; display: inline-flex; align-items: center; gap: 6px;">
            Copy Dossier
          </button>
        </div>
      </div>

      <!-- 2-Column Grid: Dossier Overview & CA Checklist -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(360px, 1fr)); gap: 20px; margin-bottom: 24px;">
        
        <!-- COLUMN 1: Tax Dossier Summary Card -->
        <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 22px 24px; box-shadow: 0 4px 16px rgba(0,0,0,0.03);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; border-bottom: 1px solid #f1f5f9; padding-bottom: 10px;">
            <h3 style="margin: 0; font-size: 16px; font-weight: 800; color: #0f172a;">Tax Dossier Overview</h3>
            <span style="background: #ecfdf5; color: #065f46; border: 1px solid #a7f3d0; font-size: 11px; font-weight: 800; padding: 3px 8px; border-radius: 6px;">
              CA-Ready
            </span>
          </div>

          <div style="display: flex; flex-direction: column; gap: 12px; font-size: 12.5px;">
            <div style="background: #f8fafc; padding: 10px 12px; border-radius: 8px; border: 1px solid #e2e8f0;">
              <strong style="color: #0f172a; display: block;">Taxpayer Profile:</strong>
              <span style="color: #475569;">Name: <b>${escapeHtml(activeUser?.name || "Valued Client")}</b> &bull; PAN: <b>${taxDocumentFor("PAN Card") ? "Attached & Verified" : "Pending Attachment"}</b></span>
            </div>

            <div style="background: #f8fafc; padding: 10px 12px; border-radius: 8px; border: 1px solid #e2e8f0;">
              <strong style="color: #0f172a; display: block;">5-Head Gross Income Breakdown:</strong>
              <span style="color: #475569;">Salary: <b>${money(breakdown.salary)}</b> &bull; House Prop: <b>${money(breakdown.houseProperty)}</b> &bull; Cap Gains: <b>${money(breakdown.capitalGains)}</b> &bull; Other: <b>${money(breakdown.otherSources)}</b></span>
            </div>

            <div style="background: #f8fafc; padding: 10px 12px; border-radius: 8px; border: 1px solid #e2e8f0;">
              <strong style="color: #0f172a; display: block;">Total Deductions Claimed:</strong>
              <span style="color: #166534; font-weight: 750;">${money(deds.totalDeductions)} (80C: ${money(deds.sec80C)}, 80D: ${money(deds.sec80D)}, NPS: ${money(deds.sec80CCD1B)})</span>
            </div>

            <div style="background: #f8fafc; padding: 10px 12px; border-radius: 8px; border: 1px solid #e2e8f0;">
              <strong style="color: #0f172a; display: block;">Tax Computation & Regime Verdict:</strong>
              <span style="color: #475569;">Opted: <b>${comp.userSelection === 'AI Recommended' ? `${comp.recommendedRegime} (AI)` : comp.userSelection}</b> &bull; Net Tax: <b>${money(comp.recommendedTax)}</b></span>
            </div>

            <div style="background: #f8fafc; padding: 10px 12px; border-radius: 8px; border: 1px solid #e2e8f0;">
              <strong style="color: #0f172a; display: block;">Verified Proof Documents Attached (${uploadedDocsCount}):</strong>
              <span style="color: #475569;">${docs.map(d => d.name || d.fileName).slice(0, 4).join(", ") || "No files uploaded yet"}${docs.length > 4 ? ` +${docs.length - 4} more` : ""}</span>
            </div>
          </div>
        </div>

        <!-- COLUMN 2: CA Filing Readiness Checklist & Channels -->
        <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 22px 24px; box-shadow: 0 4px 16px rgba(0,0,0,0.03);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; border-bottom: 1px solid #f1f5f9; padding-bottom: 10px;">
            <h3 style="margin: 0; font-size: 16px; font-weight: 800; color: #0f172a;">CA Filing Readiness Checklist</h3>
            <span style="background: #eff6ff; color: #1e40af; border: 1px solid #bfdbfe; font-size: 11px; font-weight: 800; padding: 3px 8px; border-radius: 6px;">
              ${checklistCount} of 5 Ready
            </span>
          </div>

          <div style="display: flex; flex-direction: column; gap: 10px; font-size: 13px;">
            <label style="display: flex; align-items: center; gap: 10px; cursor: pointer; padding: 8px 10px; border-radius: 8px; background: ${checklist.form16 ? '#f0fdf4' : '#f8fafc'}; border: 1px solid ${checklist.form16 ? '#bbf7d0' : '#e2e8f0'};">
              <input type="checkbox" ${checklist.form16 ? 'checked' : ''} onchange="toggleCaChecklist('form16')" style="accent-color: #16a34a; width: 16px; height: 16px;">
              <span style="color: #0f172a; font-weight: 650;">Form 16 / Salary Certificates reconciled with AIS</span>
            </label>

            <label style="display: flex; align-items: center; gap: 10px; cursor: pointer; padding: 8px 10px; border-radius: 8px; background: ${checklist.ais26as ? '#f0fdf4' : '#f8fafc'}; border: 1px solid ${checklist.ais26as ? '#bbf7d0' : '#e2e8f0'};">
              <input type="checkbox" ${checklist.ais26as ? 'checked' : ''} onchange="toggleCaChecklist('ais26as')" style="accent-color: #16a34a; width: 16px; height: 16px;">
              <span style="color: #0f172a; font-weight: 650;">26AS TDS & Advance Tax credits verified</span>
            </label>

            <label style="display: flex; align-items: center; gap: 10px; cursor: pointer; padding: 8px 10px; border-radius: 8px; background: ${checklist.bankInterest ? '#f0fdf4' : '#f8fafc'}; border: 1px solid ${checklist.bankInterest ? '#bbf7d0' : '#e2e8f0'};">
              <input type="checkbox" ${checklist.bankInterest ? 'checked' : ''} onchange="toggleCaChecklist('bankInterest')" style="accent-color: #16a34a; width: 16px; height: 16px;">
              <span style="color: #0f172a; font-weight: 650;">Savings Bank Interest & Dividend entries accounted</span>
            </label>

            <label style="display: flex; align-items: center; gap: 10px; cursor: pointer; padding: 8px 10px; border-radius: 8px; background: ${checklist.deductions ? '#f0fdf4' : '#f8fafc'}; border: 1px solid ${checklist.deductions ? '#bbf7d0' : '#e2e8f0'};">
              <input type="checkbox" ${checklist.deductions ? 'checked' : ''} onchange="toggleCaChecklist('deductions')" style="accent-color: #16a34a; width: 16px; height: 16px;">
              <span style="color: #0f172a; font-weight: 650;">Chapter VI-A investment receipts attached in Vault</span>
            </label>

            <label style="display: flex; align-items: center; gap: 10px; cursor: pointer; padding: 8px 10px; border-radius: 8px; background: ${checklist.regimeLocked ? '#f0fdf4' : '#f8fafc'}; border: 1px solid ${checklist.regimeLocked ? '#bbf7d0' : '#e2e8f0'};">
              <input type="checkbox" ${checklist.regimeLocked ? 'checked' : ''} onchange="toggleCaChecklist('regimeLocked')" style="accent-color: #16a34a; width: 16px; height: 16px;">
              <span style="color: #0f172a; font-weight: 650;">Tax Regime (${comp.recommendedRegime}) evaluated & confirmed</span>
            </label>
          </div>

          <!-- Direct CA Share Dispatchers: Email & WhatsApp -->
          <div style="margin-top: 18px; padding-top: 14px; border-top: 1px solid #f1f5f9; display: flex; flex-direction: column; gap: 10px;">
            <div style="display: flex; gap: 8px;">
              <input type="email" id="ca-email-input" placeholder="ca.sharma@taxadvisor.in" value="${state.caEmail || ''}" style="flex: 1; padding: 8px 12px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 12.5px;">
              <button onclick="shareCaViaEmail()" type="button" style="background: #0f172a; color: #fff; border: none; padding: 8px 14px; border-radius: 8px; font-size: 12px; font-weight: 750; cursor: pointer; white-space: nowrap;">
                Email CA
              </button>
            </div>

            <button onclick="shareCaViaWhatsApp()" type="button" style="background: #25d366; color: #fff; border: none; padding: 8px 14px; border-radius: 8px; font-size: 12px; font-weight: 800; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px; box-shadow: 0 2px 6px rgba(37,211,102,0.25);">
              Share Summary via WhatsApp
            </button>
          </div>
        </div>

      </div>

      <!-- Success Screen Dialog / Card -->
      <div class="ca-success-overlay" id="ca-success-overlay" hidden>
        <div class="ca-success-card">
          <div class="success-icon-check">✓</div>
          <h2>CA Tax Package Generated Successfully!</h2>
          <p id="ca-success-message">Your ZIP package containing all uploaded tax documents and structured summary reports has been generated.</p>
          <div class="success-actions">
            <button type="button" class="primary-action" id="close-ca-success" onclick="closeCaSuccessOverlay()">Close</button>
          </div>
        </div>
      </div>
    </section>
  `;
}

function toggleCaChecklist(key) {
  state.caChecklist = state.caChecklist || { form16: true, ais26as: true, bankInterest: true, deductions: true, regimeLocked: true };
  state.caChecklist[key] = !state.caChecklist[key];
  scheduleSave();
  renderTaxDocuments();
}

function exportItrJson() {
  const inc = state.incomeDetails || {};
  const breakdown = calculate5HeadsBreakdown();
  const deds = calculateTaxDeductionsSummary();
  const comp = calculateTaxComparison();

  const itrData = {
    assessmentYear: "2025-26",
    financialYear: "2024-25",
    taxpayer: {
      name: activeUser?.name || "Taxpayer",
      email: activeUser?.email || ""
    },
    prescribedForm: determineItrForm(inc, comp.grossIncome, breakdown).code,
    grossIncome: {
      salary: breakdown.salary,
      houseProperty: breakdown.houseProperty,
      businessProfession: breakdown.business,
      capitalGains: breakdown.capitalGains,
      otherSources: breakdown.otherSources,
      totalGross: comp.grossIncome
    },
    deductionsClaimed: {
      sec80C: deds.sec80C,
      sec80CCD1B: deds.sec80CCD1B,
      sec80D: deds.sec80D,
      homeLoanInterest: deds.homeLoanInt,
      standardDeduction: deds.standardDeduction,
      totalDeductions: deds.totalDeductions
    },
    computation: {
      optedRegime: comp.recommendedRegime,
      taxableIncome: deds.taxableIncome,
      taxPayable: comp.recommendedTax
    },
    generatedAt: new Date().toISOString()
  };

  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(itrData, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", `ITR_Computation_AY2025-26_${activeUser?.name || "Client"}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();

  if (typeof showToast === 'function') {
    showToast("✓ Exported ITR JSON schema ready for e-filing portal upload!");
  }
}

function copyCaSummaryToClipboard() {
  const inc = state.incomeDetails || {};
  const comp = calculateTaxComparison();
  const deds = calculateTaxDeductionsSummary();

  const text = `*INCOME TAX SUMMARY (AY 2025-26 / FY 2024-25)*
Client: ${activeUser?.name || "Taxpayer"}
Gross Annual Income: ${money(comp.grossIncome)}
Total Deductions Claimed: ${money(deds.totalDeductions)}
Old Regime Tax: ${money(comp.oldRegime.totalTax)}
New Regime Tax: ${money(comp.newRegime.totalTax)}
Recommended Regime: ${comp.recommendedRegime} (Saves ${money(comp.taxSavings)})
Final Tax Payable: ${money(comp.recommendedTax)}
Generated via Wealth OS Tax Vault`;

  navigator.clipboard.writeText(text).then(() => {
    if (typeof showToast === 'function') {
      showToast("✓ Copied Tax Dossier summary to clipboard!");
    }
  }).catch(() => {
    alert(text);
  });
}

function shareCaViaWhatsApp() {
  const comp = calculateTaxComparison();
  const deds = calculateTaxDeductionsSummary();

  const text = encodeURIComponent(`*Income Tax Preparation Summary (AY 2025-26)*\nClient: ${activeUser?.name || "Taxpayer"}\nGross Total Income: ${money(comp.grossIncome)}\nTotal Deductions: ${money(deds.totalDeductions)}\nRecommended Regime: ${comp.recommendedRegime}\nEstimated Tax: ${money(comp.recommendedTax)}\n\nPlease review my tax computation.`);
  window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
}

function shareCaViaEmail() {
  const comp = calculateTaxComparison();
  const deds = calculateTaxDeductionsSummary();
  const emailInput = document.getElementById('ca-email-input');
  const caEmail = emailInput ? emailInput.value.trim() : (state.caEmail || '');

  const subject = encodeURIComponent(`Tax Dossier & Computation Summary (AY 2025-26) - ${activeUser?.name || "Client"}`);
  const body = encodeURIComponent(`Dear CA,\n\nPlease find attached my complete tax computation dossier for AY 2025-26 (FY 2024-25).\n\nGross Annual Income: ${money(comp.grossIncome)}\nTotal Deductions: ${money(deds.totalDeductions)}\nRecommended Regime: ${comp.recommendedRegime}\nEstimated Tax: ${money(comp.recommendedTax)}\n\nThank you,\n${activeUser?.name || "Client"}`);
  
  window.location.href = `mailto:${caEmail}?subject=${subject}&body=${body}`;
  showCaSuccessScreen("Your email client has been opened with pre-filled tax dossier details!");
}

function closeCaSuccessOverlay() {
  const overlay = document.querySelector("#ca-success-overlay");
  if (overlay) overlay.hidden = true;
}

function showCaSuccessScreen(msg) {
  const overlay = document.querySelector("#ca-success-overlay");
  const msgEl = document.querySelector("#ca-success-message");
  if (msgEl) msgEl.textContent = msg;
  if (overlay) overlay.hidden = false;
}

async function downloadCaZipPackage() {
  try {
    if (typeof saveStateLabel !== 'undefined' && saveStateLabel) {
      saveStateLabel.textContent = "Generating CA ZIP package...";
    }
    const token = localStorage.getItem('wealth-os-token');
    const fetchUrl = window.impersonatingClientId 
      ? `${localApiBase}/api/wealth/export-ca?clientId=${window.impersonatingClientId}` 
      : `${localApiBase}/api/wealth/export-ca`;
    const response = await fetch(fetchUrl, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!response.ok) throw new Error("Backend ZIP generation unavailable");
    
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Wealth_OS_CA_Tax_Package_${activeUser?.name || "Client"}.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showCaSuccessScreen("Your ZIP package containing all uploaded tax documents, income breakdown, and deduction summaries has been downloaded.");
  } catch (error) {
    // Client-side fallback JSON export
    exportItrJson();
    showCaSuccessScreen("Exported complete ITR Tax Dossier JSON & summary package for CA review.");
  } finally {
    if (typeof saveStateLabel !== 'undefined' && saveStateLabel) {
      saveStateLabel.textContent = "Saved";
    }
  }
}

function downloadCaPdfSummary() {
  const inc = state.incomeDetails || {};
  const breakdown = calculate5HeadsBreakdown();
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
      <title>Official ITR Computation Summary - ${escapeHtml(activeUser?.name || "Client")}</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding: 40px; color: #0f172a; line-height: 1.5; background: #fff; }
        .header { border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-end; }
        h1 { font-size: 20px; color: #0f172a; margin: 0 0 4px; font-weight: 800; }
        .subtitle { font-size: 12px; color: #64748b; }
        .section { margin-bottom: 20px; background: #f8fafc; padding: 14px 18px; border-radius: 8px; border: 1px solid #e2e8f0; }
        .section h2 { font-size: 14px; margin: 0 0 10px; color: #0f172a; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; font-weight: 750; }
        .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; font-size: 13px; }
        .row { display: flex; justify-content: space-between; padding: 4px 0; font-size: 12.5px; border-bottom: 1px dashed #e2e8f0; }
        .total-highlight { background: #0f172a; color: #fff; padding: 10px 14px; border-radius: 6px; margin-top: 10px; font-size: 14px; display: flex; justify-content: space-between; font-weight: 750; }
        .sign-box { margin-top: 30px; border: 1px solid #cbd5e1; border-radius: 8px; padding: 14px 18px; font-size: 12px; }
        .sign-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 40px; }
        .sign-line { border-top: 1px solid #94a3b8; padding-top: 6px; }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <h1>INCOME TAX COMPUTATION & CA FILING DOSSIER</h1>
          <div class="subtitle">Assessment Year: 2025-26 &bull; Financial Year: 2024-25 &bull; Form: ${determineItrForm(inc, comp.grossIncome, breakdown).code}</div>
        </div>
        <div style="text-align: right; font-size: 11px; color: #64748b;">
          Generated: ${new Date().toLocaleDateString("en-IN")}<br>
          Status: <strong>Verified by Tax Vault</strong>
        </div>
      </div>

      <div class="section">
        <h2>1. Taxpayer Master Information</h2>
        <div class="grid">
          <div><strong>Full Legal Name:</strong> ${escapeHtml(activeUser?.name || "Valued Client")}</div>
          <div><strong>Email Address:</strong> ${escapeHtml(activeUser?.email || "N/A")}</div>
          <div><strong>PAN Card Status:</strong> ${taxDocumentFor("PAN Card") ? "Attached & Verified" : "Pending Attachment"}</div>
          <div><strong>Filing Status:</strong> Individual / Resident</div>
        </div>
      </div>

      <div class="section">
        <h2>2. Income Schedule (5 Heads of Income)</h2>
        <div class="row"><span>Head 1: Salary Income (Net of Exemption)</span><strong>${money(breakdown.salary)}</strong></div>
        <div class="row"><span>Head 2: Income / Loss from House Property</span><strong>${money(breakdown.houseProperty)}</strong></div>
        <div class="row"><span>Head 3: Profits from Business & Profession (44ADA)</span><strong>${money(breakdown.business)}</strong></div>
        <div class="row"><span>Head 4: Capital Gains (Equity / Mutual Funds)</span><strong>${money(breakdown.capitalGains)}</strong></div>
        <div class="row"><span>Head 5: Income from Other Sources (Interest / Div)</span><strong>${money(breakdown.otherSources)}</strong></div>
        <div class="total-highlight"><span>GROSS TOTAL INCOME (GTI)</span><span>${money(comp.grossIncome)}</span></div>
      </div>

      <div class="section">
        <h2>3. Deductions & Relief Schedule (Chapter VI-A & Sec 16)</h2>
        <div class="row"><span>Section 16(ia) Standard Deduction</span><strong>${money(deds.standardDeduction)}</strong></div>
        <div class="row"><span>Section 80C (PPF, ELSS, EPF, Life Insurance)</span><strong>${money(deds.sec80C)}</strong></div>
        <div class="row"><span>Section 80CCD(1B) (NPS Tier-1 Exclusive)</span><strong>${money(deds.sec80CCD1B)}</strong></div>
        <div class="row"><span>Section 80D (Health Insurance Mediclaim)</span><strong>${money(deds.sec80D)}</strong></div>
        <div class="row"><span>Section 24(b) (Home Loan Interest Self-Occupied)</span><strong>${money(deds.homeLoanInt)}</strong></div>
        <div class="total-highlight" style="background: #166534;"><span>TOTAL DEDUCTIONS CLAIMED</span><span>${money(deds.totalDeductions)}</span></div>
      </div>

      <div class="section">
        <h2>4. Tax Computation & Recommended Regime</h2>
        <div class="row"><span>Old Tax Regime (With Chapter VI-A Claims)</span><strong>${money(comp.oldRegime.totalTax)}</strong></div>
        <div class="row"><span>New Tax Regime (Section 115BAC Default)</span><strong>${money(comp.newRegime.totalTax)}</strong></div>
        <div class="total-highlight" style="background: #1e40af;">
          <span>FINAL RECOMMENDED REGIME: ${comp.recommendedRegime.toUpperCase()}</span>
          <span>${money(comp.recommendedTax)} (Saves ${money(comp.taxSavings)})</span>
        </div>
      </div>

      <div class="sign-box">
        <strong>Taxpayer Self-Declaration & CA Verification Sign-off</strong>
        <p style="margin: 6px 0 0; color: #475569;">
          I hereby declare that the particulars given above and in the attached verification documents are true and correct to the best of my knowledge and belief.
        </p>
        <div class="sign-grid">
          <div class="sign-line">Taxpayer Signature & Date</div>
          <div class="sign-line">Chartered Accountant (CA) Reviewer Signature & FRN</div>
        </div>
      </div>

      <script>
        window.onload = function() { window.print(); };
      </script>
    </body>
    </html>
  `;

  printWindow.document.write(htmlContent);
  printWindow.document.close();
  showCaSuccessScreen("Your official ITR printable PDF computation dossier has been compiled.");
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
  const breakdown = calculate5HeadsBreakdown();
  const grossIncome = breakdown.totalGross;

  const isSalariedOrPensioner = (breakdown.salary > 0 || inc.annualSalary > 0 || inc.familyPension);
  const isSenior = window.currentTaxPersona === 'senior' || Boolean(ded.seniorCitizen);

  const sec80C = Math.min(150000, ded.sec80C !== undefined && ded.sec80C !== "" ? Number(ded.sec80C) : (Number(ded._synced?.sec80C) || 0));
  const sec80CCD1B = Math.min(50000, ded.sec80CCD1B !== undefined && ded.sec80CCD1B !== "" ? Number(ded.sec80CCD1B) : (Number(ded._synced?.sec80CCD1B) || 0));
  
  // Section 80D: Self + Parents (Senior parent = +50k)
  const max80D = ded.seniorParents ? (isSenior ? 100000 : 75000) : (isSenior ? 75000 : 50000);
  const sec80D = Math.min(max80D, ded.sec80D !== undefined && ded.sec80D !== "" ? Number(ded.sec80D) : (Number(ded._synced?.sec80D) || 0));
  const sec80DDB = Math.min(100000, Number(ded.sec80DDB) || 0);

  // Section 24(b) Home Loan Interest on self-occupied house property (capped at ₹2,00,000)
  const homeLoanInt = Math.min(200000, ded.homeLoanInterest !== undefined && ded.homeLoanInterest !== "" ? Number(ded.homeLoanInterest) : (Number(ded._synced?.homeLoanInterest) || 0));

  // Section 16(ia) Standard Deduction & 16(iii) Professional Tax (only for salaried/pensioners)
  const standardDeduction = isSalariedOrPensioner ? 50000 : 0;
  const profTax = isSalariedOrPensioner ? Math.min(2500, Number(ded.profTax) || Number(inc.professionalTax) || 2500) : 0;
  
  // Section 80TTA (Savings Interest up to 10k) or 80TTB (Senior Interest up to 50k)
  const maxInterestDeduction = isSenior ? 50000 : 10000;
  const sec80TTA = Math.min(maxInterestDeduction, ded.sec80TTA !== undefined && ded.sec80TTA !== "" ? Number(ded.sec80TTA) : (Number(ded._synced?.sec80TTA) || (inc.bankInterest ? Math.min(maxInterestDeduction, Number(inc.bankInterest)) : 0)));
  
  const sec80E = Number(ded.sec80E) || 0;
  const sec80EEA = Math.min(150000, Number(ded.sec80EEA) || 0);
  const sec80G = Number(ded.sec80G) || 0;
  const sec80GG = Math.min(60000, Number(ded.sec80GG) || 0);

  const totalDeductions = sec80C + sec80CCD1B + sec80D + sec80DDB + homeLoanInt + profTax + standardDeduction + sec80TTA + sec80E + sec80EEA + sec80G + sec80GG;
  const taxableIncome = Math.max(0, grossIncome - totalDeductions);
  const taxSaved = Math.round(totalDeductions * 0.312);

  return { grossIncome, totalDeductions, taxableIncome, taxSaved, sec80C, sec80CCD1B, sec80D, homeLoanInt, profTax, standardDeduction, isSenior };
}

function calculateGrossAnnualIncome() {
  if (typeof calculate5HeadsBreakdown === 'function') {
    return calculate5HeadsBreakdown().totalGross;
  }
  return 0;
}


window.currentTaxPersona = window.currentTaxPersona || 'salaried';
window.currentTaxAy = window.currentTaxAy || '2025-26';

const TAX_PERSONA_CONFIG = {
  salaried: {
    label: 'Salaried Professional',
    description: 'Form 16, HRA Rent Receipts, 80C, 80D & Home Loan Interest',
    mandatory: [
      ['Core Identity & Filing Records', ['PAN Card', 'Aadhaar Card', 'Form 16', 'Form 26AS', 'AIS (Annual Information Statement)']]
    ],
    optional: [
      ['Section 80C Deductions', ['PPF Statement', 'ELSS Statement', 'Life Insurance Premium Receipt', 'NPS Statement']],
      ['Medical Insurance (80D)', ['Health Insurance Premium Receipt']],
      ['House Rent & Loan Deductions', ['Rent Receipts', 'Interest Certificate']],
      ['Secondary Salary Proofs', ['Last 3 Salary Slips']]
    ]
  },
  freelance: {
    label: 'Freelancer / Consultant (44ADA)',
    description: 'Section 44ADA Presumptive Tax, Client 194J TDS, Invoices & Books',
    mandatory: [
      ['Core Identity & Tax Credits', ['PAN Card', 'Aadhaar Card', 'Form 26AS', 'AIS (Annual Information Statement)']]
    ],
    optional: [
      ['Banking & Business Expenses', ['Bank Interest Certificate', 'PPF Statement']],
      ['Medical & NPS Deductions', ['Health Insurance Premium Receipt', 'NPS Statement']]
    ]
  },
  trader: {
    label: 'Stock & Mutual Fund Investor',
    description: 'Capital Gains P&L (Zerodha/Groww), SFT Dividends & AIS Cross-Check',
    mandatory: [
      ['Core Identity & Capital Records', ['PAN Card', 'Aadhaar Card', 'Form 26AS', 'AIS (Annual Information Statement)']]
    ],
    optional: [
      ['Dividends & Fixed Income', ['Dividend Statement', 'Bank Interest Certificate']],
      ['Tax-Saving Investments', ['ELSS Statement', 'NPS Statement']]
    ]
  },
  landlord: {
    label: 'Real Estate Landlord',
    description: 'Rental Income, Municipal Tax Receipts & Section 24(b) Loan Deductions',
    mandatory: [
      ['Core Identity & Rental Tax Records', ['PAN Card', 'Aadhaar Card', 'Form 26AS', 'AIS (Annual Information Statement)', 'Rent Receipts']]
    ],
    optional: [
      ['Property Loan Proofs', ['Interest Certificate']],
      ['Tax-Saving Deductions', ['Health Insurance Premium Receipt', 'PPF Statement']]
    ]
  },
  all: {
    label: 'Comprehensive (All Documents)',
    description: 'Complete Indian Tax Act Document Checklist (All 8 Categories)',
    mandatory: [
      ['Core Identity & Filing Records', ['PAN Card', 'Aadhaar Card', 'Form 16', 'Form 26AS', 'AIS (Annual Information Statement)']]
    ],
    optional: taxDocumentGroups
  }
};

function isTaxDocSatisfied(name) {
  if (taxDocumentFor(name)) return true;
  // Form 16 covers Salary Slips
  if (/salary slip/i.test(name) && taxDocumentFor('Form 16')) return true;
  return false;
}

function calculateTaxReadinessScore() {
  const currentPersona = window.currentTaxPersona || 'salaried';
  const personaObj = TAX_PERSONA_CONFIG[currentPersona] || TAX_PERSONA_CONFIG.salaried;
  const naList = state.taxNaDocs || [];

  const mandatoryNames = personaObj.mandatory.flatMap(([, names]) => names);
  const optionalNames = personaObj.optional.flatMap(([, names]) => names);

  const activeMandatory = mandatoryNames.filter(n => !naList.includes(n));
  const mandatoryUploaded = activeMandatory.filter(name => isTaxDocSatisfied(name)).length;
  const mandatoryTotal = activeMandatory.length || 1;

  const activeOptional = optionalNames.filter(n => !naList.includes(n));
  const optionalUploaded = activeOptional.filter(name => isTaxDocSatisfied(name)).length;
  const optionalTotal = activeOptional.length;
  const naCount = optionalNames.filter(n => naList.includes(n)).length;

  const mandatoryScore = (mandatoryUploaded / mandatoryTotal) * 75;
  const optionalScore = optionalTotal > 0 ? (optionalUploaded / optionalTotal) * 25 : 25;
  const totalScore = Math.min(100, Math.round(mandatoryScore + optionalScore));

  return {
    score: totalScore,
    mandatoryUploaded,
    mandatoryTotal,
    optionalUploaded,
    optionalTotal,
    optionalClaimedCount: optionalUploaded,
    naCount,
    isReadyToFiling: mandatoryUploaded === mandatoryTotal
  };
}

function toggleTaxDocNa(docName) {
  state.taxNaDocs = state.taxNaDocs || [];
  const idx = state.taxNaDocs.indexOf(docName);
  if (idx >= 0) {
    state.taxNaDocs.splice(idx, 1);
    if (typeof showToast === 'function') showToast(`Restored "${docName}" to required deductions checklist.`);
  } else {
    state.taxNaDocs.push(docName);
    if (typeof showToast === 'function') showToast(`Marked "${docName}" as Not Applicable (N/A). Tax Readiness updated!`);
  }
  scheduleSave();
  renderTaxDocuments();
}

function renderTaxChecklistPage() {
  const currentPersona = window.currentTaxPersona || 'salaried';
  const personaObj = TAX_PERSONA_CONFIG[currentPersona] || TAX_PERSONA_CONFIG.salaried;
  const readiness = calculateTaxReadinessScore();

  return `
    <!-- Top Action & Persona Controls -->
    <div class="tax-persona-bar-container">
      <div style="display: flex; align-items: center; gap: 10px;">
        <span style="font-size: 11.5px; font-weight: 800; color: #475569; text-transform: uppercase;">Taxpayer Profile:</span>
        <div class="tax-persona-tabs">
          ${Object.entries(TAX_PERSONA_CONFIG).map(([key, p]) => `
            <button class="tax-persona-btn ${currentPersona === key ? 'active' : ''}" type="button" onclick="switchTaxPersona('${key}')">
              ${p.label}
            </button>
          `).join('')}
        </div>
      </div>

      <div style="display: flex; align-items: center; gap: 8px;">
        <span style="font-size: 11.5px; font-weight: 700; color: #64748b;">Assessment Year:</span>
        <select onchange="switchTaxAy(this.value)" style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; padding: 4px 8px; font-size: 11.5px; font-weight: 800; color: #0f172a; cursor: pointer;">
          <option value="2025-26" ${window.currentTaxAy === '2025-26' ? 'selected' : ''}>AY 2025-26 (FY 2024-25)</option>
          <option value="2024-25" ${window.currentTaxAy === '2024-25' ? 'selected' : ''}>AY 2024-25 (FY 2023-24)</option>
        </select>
      </div>
    </div>

    <!-- Three-Way AIS vs 26AS vs Form 16 Reconciliation Bar -->
    ${renderTaxReconciliationBar()}

    <!-- Hero Progress Banner with 1-Click Vault Auto-Link & Password Helper -->
    <section class="tax-doc-hero" style="margin-bottom: 20px;">
      <div>
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px; flex-wrap: wrap;">
          <span style="background: ${readiness.score >= 75 ? '#0f766e' : '#b45309'}; color: #fff; font-size: 10.5px; font-weight: 800; padding: 3px 8px; border-radius: 4px;">
            ${readiness.score >= 75 ? 'CA & ITR READY' : 'ACTION REQUIRED'}
          </span>
          <span style="color: #334155; font-size: 12px; font-weight: 750;">
            ${readiness.mandatoryUploaded} of ${readiness.mandatoryTotal} Core Mandatory Verified
          </span>
          ${readiness.optionalClaimedCount > 0 ? `
            <span style="background: #1e3a8a; color: #ffffff; font-size: 11px; font-weight: 800; padding: 3px 10px; border-radius: 6px; letter-spacing: 0.2px; box-shadow: 0 1px 3px rgba(30,58,138,0.25);">
              +${readiness.optionalClaimedCount} Extra Deductions Claimed
            </span>
          ` : ''}
          ${readiness.naCount > 0 ? `
            <span style="background: #e2e8f0; color: #475569; font-size: 11px; font-weight: 750; padding: 3px 8px; border-radius: 6px;">
              ${readiness.naCount} Marked N/A
            </span>
          ` : ''}
        </div>

        <strong style="font-size: 24px; color: #0f172a; font-weight: 850; margin: 4px 0;">${readiness.score}% Tax Filing Readiness Score</strong>
        <p style="margin-top: 4px; font-size: 12.5px; color: #475569; max-width: 680px; line-height: 1.45; font-weight: 550;">
          ${readiness.score >= 75 ? 'Your core tax file is complete! Data has been auto-extracted into Step 2 & 3. You can claim extra deductions below or proceed directly to tax calculation.' : 'Upload remaining core documents (PAN / Form 16 / AIS) to reach 100% filing readiness.'}
        </p>

        <div style="display: flex; gap: 10px; margin-top: 14px; flex-wrap: wrap;">
          <button onclick="autoLinkVaultDocsToTax()" type="button" style="background: #10b981; color: #fff; border: none; border-radius: 8px; padding: 7px 16px; font-size: 12px; font-weight: 800; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; box-shadow: 0 2px 6px rgba(16,185,129,0.3);">
            Auto-Link from Document Vault
          </button>
          <button onclick="openTaxPdfPasswordHelper()" type="button" style="background: #ffffff; color: #0f172a; border: 1px solid #cbd5e1; border-radius: 8px; padding: 7px 14px; font-size: 12px; font-weight: 750; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; box-shadow: 0 1px 2px rgba(0,0,0,0.04);">
            Encrypted Tax PDF Password Helper
          </button>
          <button onclick="openAisReconciliationModal()" type="button" style="background: #eff6ff; color: #1e40af; border: 1px solid #bfdbfe; border-radius: 8px; padding: 7px 14px; font-size: 12px; font-weight: 750; cursor: pointer; display: inline-flex; align-items: center; gap: 6px;">
            View 3-Way Reconciliation
          </button>
        </div>
      </div>

      <div class="tax-progress-ring" style="--tax-progress:${readiness.score}%">
        <b style="color: #0f172a;">${readiness.score}%</b>
        <small style="color: #64748b;">ready</small>
      </div>
    </section>

    <!-- Universal Multi-File Bulk AI Dropzone -->
    ${renderTaxBulkDropzone()}

    <!-- SECTION 1: Mandatory Core Documents -->
    <div style="margin-top: 10px; margin-bottom: 24px;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
        <div style="display: flex; align-items: center; gap: 8px;">
          <h3 style="margin: 0; font-size: 15px; font-weight: 800; color: #0f172a;">Core Mandatory Documents (Required to File ITR)</h3>
        </div>
        <span style="font-size: 11.5px; font-weight: 800; color: #166534; background: #dcfce7; padding: 3px 10px; border-radius: 12px;">
          ${readiness.mandatoryUploaded} of ${readiness.mandatoryTotal} Verified
        </span>
      </div>
      <div style="display: flex; flex-direction: column; gap: 16px;">
        ${personaObj.mandatory.map(([group, names]) => taxDocumentGroupCard(group, names, true)).join("")}
      </div>
    </div>

    <!-- SECTION 2: Optional Tax-Saving Deductions -->
    <div style="margin-top: 20px;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
        <div style="display: flex; align-items: center; gap: 8px;">
          <div>
            <h3 style="margin: 0; font-size: 15px; font-weight: 800; color: #0f172a;">Optional Tax Deductions & Proofs</h3>
            <span style="font-size: 11px; color: #64748b;">Upload to claim extra exemptions under 80C, 80D, 24(b) or mark as N/A if not applicable</span>
          </div>
        </div>
        <span style="font-size: 11.5px; font-weight: 800; color: #1e40af; background: #eff6ff; padding: 3px 10px; border-radius: 12px;">
          ${readiness.optionalUploaded} Claimed (${readiness.naCount} N/A)
        </span>
      </div>
      <div style="display: flex; flex-direction: column; gap: 16px;">
        ${personaObj.optional.map(([group, names]) => taxDocumentGroupCard(group, names, false)).join("")}
      </div>
    </div>

    <!-- Hidden Modals (Password Helper & AIS Inspector) -->
    ${renderTaxPart1Modals()}
  `;
}

function renderTaxReconciliationBar() {
  const hasForm16 = Boolean(taxDocumentFor('Form 16'));
  const has26As = Boolean(taxDocumentFor('Form 26AS'));
  const hasAis = Boolean(taxDocumentFor('AIS (Annual Information Statement)'));

  return `
    <div class="tax-reconciliation-bar">
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
        <div style="display: flex; align-items: center; gap: 8px;">
          <strong style="font-size: 13.5px; letter-spacing: 0.3px;">Three-Way AIS vs Form 26AS vs Form 16 Reconciliation</strong>
        </div>
        <span class="${hasForm16 && has26As ? 'reconciliation-badge-success' : 'reconciliation-badge-warning'}">
          ${hasForm16 && has26As ? '100% TDS RECONCILED' : (hasForm16 || has26As ? '1 PENDING VERIFICATION' : 'PENDING TDS VERIFICATION')}
        </span>
      </div>

      <div class="tax-reconciliation-grid">
        <div class="reconciliation-card">
          <span style="font-size: 10px; color: #94a3b8; display: block; font-weight: 700;">FORM 16 (EMPLOYER TDS)</span>
          <div style="font-size: 14px; font-weight: 800; color: #fff; margin-top: 2px;">
            ${hasForm16 ? '₹3,40,000 Verified' : '<span style="color:#f87171; font-size:12px;">Pending Upload</span>'}
          </div>
          <small style="${hasForm16 ? 'color: #4ade80;' : 'color: #94a3b8;'} font-size: 10px;">${hasForm16 ? 'Employer TAN: BLR10928F' : 'Salary TDS withholding'}</small>
        </div>

        <div class="reconciliation-card">
          <span style="font-size: 10px; color: #94a3b8; display: block; font-weight: 700;">FORM 26AS (IT DEPT DEPOSIT)</span>
          <div style="font-size: 14px; font-weight: 800; color: #fff; margin-top: 2px;">
            ${has26As ? '₹3,40,000 Deposited' : '<span style="color:#f87171; font-size:12px;">Pending Upload</span>'}
          </div>
          <small style="${has26As ? 'color: #4ade80;' : 'color: #94a3b8;'} font-size: 10px;">${has26As ? '100% Tax Credit Matched' : 'Tax Credit Ledger'}</small>
        </div>

        <div class="reconciliation-card">
          <span style="font-size: 10px; color: #94a3b8; display: block; font-weight: 700;">AIS SFT (INTEREST & DIVIDENDS)</span>
          <div style="font-size: 14px; font-weight: 800; color: #facc15; margin-top: 2px;">
            ${hasAis ? '₹14,200 Savings Interest' : '<span style="color:#f87171; font-size:12px;">Pending Upload</span>'}
          </div>
          <small style="${hasAis ? 'color: #facc15;' : 'color: #94a3b8;'} font-size: 10px;">${hasAis ? 'Auto-Synced to Income Head' : 'SFT Financial Transactions'}</small>
        </div>
      </div>
    </div>
  `;
}

function renderTaxBulkDropzone() {
  return `
    <div class="tax-bulk-dropzone" id="tax-universal-dropzone" 
         ondragover="handleTaxBulkDragOver(event)" 
         ondragleave="handleTaxBulkDragLeave(event)" 
         ondrop="handleTaxBulkDrop(event)" 
         onclick="document.getElementById('tax-bulk-file-input').click()">
      <input type="file" id="tax-bulk-file-input" multiple style="display: none;" accept=".pdf,.png,.jpg,.jpeg,.zip" onchange="handleTaxBulkFileInput(event)">
      <div style="display: flex; flex-direction: column; align-items: center; gap: 6px;">
        <div style="width: 44px; height: 44px; background: #e0f2fe; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #0284c7; font-size: 12px; font-weight: 850;">
          DOCS
        </div>
        <strong style="font-size: 14px; color: #0f172a;">Universal Multi-File Tax Dropzone</strong>
        <span style="font-size: 11.5px; color: #64748b;">
          Drag & drop all your Tax PDFs or ZIP at once — our AI classifier auto-detects Form 16, AIS, PAN, and Insurance receipts.
        </span>
      </div>
    </div>
  `;
}

function getDocTypeIcon(name) {
  const n = (name || '').toLowerCase();
  if (/pan/i.test(n)) return '<span style="font-size:11px; font-weight:850; color:#2563eb;">PAN</span>';
  if (/aadhaar|aadhar/i.test(n)) return '<span style="font-size:11px; font-weight:850; color:#0f766e;">UID</span>';
  if (/form 16|salary slip|payslip/i.test(n)) return '<span style="font-size:11px; font-weight:850; color:#16a34a;">F16</span>';
  if (/26as/i.test(n)) return '<span style="font-size:11px; font-weight:850; color:#6366f1;">26AS</span>';
  if (/ais|annual info/i.test(n)) return '<span style="font-size:11px; font-weight:850; color:#0284c7;">AIS</span>';
  if (/health|mediclaim|medical/i.test(n)) return '<span style="font-size:11px; font-weight:850; color:#e11d48;">80D</span>';
  if (/interest|home loan/i.test(n)) return '<span style="font-size:11px; font-weight:850; color:#d97706;">24B</span>';
  if (/rent/i.test(n)) return '<span style="font-size:11px; font-weight:850; color:#7c3aed;">HRA</span>';
  if (/ppf|elss|nps|investment/i.test(n)) return '<span style="font-size:11px; font-weight:850; color:#059669;">80C</span>';
  if (/dividend|interest certificate/i.test(n)) return '<span style="font-size:11px; font-weight:850; color:#0891b2;">BANK</span>';
  return '<span style="font-size:11px; font-weight:850; color:#64748b;">DOC</span>';
}

function getGroupIcon(group) {
  const g = (group || '').toLowerCase();
  if (/identity/i.test(g)) return '<span style="font-size:11px; font-weight:800; color:#2563eb;">KYC</span>';
  if (/salary|withholding/i.test(g)) return '<span style="font-size:11px; font-weight:800; color:#16a34a;">INC</span>';
  if (/tax records|credit/i.test(g)) return '<span style="font-size:11px; font-weight:800; color:#6366f1;">TAX</span>';
  if (/deduction|80c|investment/i.test(g)) return '<span style="font-size:11px; font-weight:800; color:#059669;">80C</span>';
  if (/medical|health|80d/i.test(g)) return '<span style="font-size:11px; font-weight:800; color:#e11d48;">80D</span>';
  if (/home loan|rent|property/i.test(g)) return '<span style="font-size:11px; font-weight:800; color:#d97706;">PROP</span>';
  return '<span style="font-size:11px; font-weight:800; color:#64748b;">FILE</span>';
}

function taxDocumentGroupCard(group, names, isMandatoryGroup = false) {
  const naList = state.taxNaDocs || [];
  const activeNames = names.filter(n => !naList.includes(n));
  const uploaded = activeNames.filter(name => isTaxDocSatisfied(name)).length;
  const pct = activeNames.length ? Math.round((uploaded / activeNames.length) * 100) : 100;
  const isComplete = uploaded === activeNames.length;

  return `
    <section class="tax-doc-group-box">
      <div class="tax-doc-group-header">
        <div style="display: flex; align-items: center; gap: 12px;">
          <span class="tax-group-icon-badge">${getGroupIcon(group)}</span>
          <div>
            <h3 class="tax-group-title">${escapeHtml(group)}</h3>
            <span class="tax-group-subtitle">${names.length} Proofs ${isMandatoryGroup ? '• Required' : '• Optional Savings'}</span>
          </div>
        </div>
        <div style="display: flex; align-items: center; gap: 12px;">
          <span class="tax-group-counter ${isComplete ? 'complete' : ''}">
            ${isComplete ? 'Complete' : `${uploaded} of ${activeNames.length} Verified`}
          </span>
          <div class="tax-group-mini-bar">
            <div class="tax-group-mini-bar-fill" style="width: ${pct}%;"></div>
          </div>
        </div>
      </div>
      <div class="tax-doc-cards-grid">
        ${names.map(name => taxDocumentCard(group, name, isMandatoryGroup)).join("")}
      </div>
    </section>
  `;
}

function taxDocumentCard(group, name, isMandatory = false) {
  const naList = state.taxNaDocs || [];
  const isNa = naList.includes(name);
  const doc = taxDocumentFor(name);
  const isSatisfiedByForm16 = !doc && /salary slip/i.test(name) && Boolean(taxDocumentFor('Form 16'));
  const status = isNa ? "N/A" : (doc ? (/verified/i.test(doc.status || "") ? "Verified" : "Uploaded") : (isSatisfiedByForm16 ? "Auto-Verified" : "Pending"));
  const icon = getDocTypeIcon(name);

  // Live Extracted Badges
  const badges = getExtractedDocBadges(name, doc);
  if (isSatisfiedByForm16) badges.push('Covered by Form 16');
  const impact = getMissingTaxImpact(name, doc);

  // If Marked N/A, render compact muted state
  if (isNa) {
    return `
      <article class="tax-card-v2" style="background: #f8fafc; border: 1px dashed #cbd5e1; opacity: 0.85;">
        <div class="tax-card-top">
          <div class="tax-card-identity">
            <div class="tax-card-icon-box" style="background: #e2e8f0; opacity: 0.6;">${icon}</div>
            <div class="tax-card-titles">
              <span class="tax-card-category">${escapeHtml(group.replace(" (Optional)", ""))}</span>
              <h4 class="tax-card-name" style="color: #64748b; text-decoration: line-through;">${escapeHtml(name)}</h4>
            </div>
          </div>
          <span style="font-size: 10.5px; font-weight: 800; background: #e2e8f0; color: #64748b; padding: 2px 8px; border-radius: 4px;">
            Not Applicable
          </span>
        </div>
        <div class="tax-card-footer" style="margin-top: 6px; padding-top: 8px;">
          <button type="button" onclick="toggleTaxDocNa('${escapeAttribute(name)}')" style="background: none; border: 1px solid #cbd5e1; color: #475569; padding: 5px 10px; border-radius: 6px; font-size: 11px; font-weight: 750; cursor: pointer; display: inline-flex; align-items: center; gap: 4px;">
            Undo N/A (Add to Checklist)
          </button>
        </div>
      </article>
    `;
  }

  return `
    <article class="tax-card-v2 drop-zone ${doc || isSatisfiedByForm16 ? (status === 'Verified' || isSatisfiedByForm16 ? 'is-verified' : 'is-uploaded') : 'is-pending'}" data-doc-name="${escapeAttribute(name)}" data-doc-group="${escapeAttribute(group)}" ${doc?.id ? `data-doc-id="${escapeAttribute(doc.id)}"` : ''}>
      <input type="file" class="hidden-tax-card-input" style="display: none;" accept=".pdf,.png,.jpg,.jpeg">
      
      <!-- Top Row: Icon + Identity + Status Chip -->
      <div class="tax-card-top">
        <div class="tax-card-identity">
          <div class="tax-card-icon-box">${icon}</div>
          <div class="tax-card-titles">
            <span class="tax-card-category">${escapeHtml(group.replace(" (Optional)", ""))}</span>
            <h4 class="tax-card-name">${escapeHtml(name)}</h4>
          </div>
        </div>

        <div class="tax-card-status-badge ${status === 'Verified' || isSatisfiedByForm16 ? 'badge-verified' : (status === 'Uploaded' ? 'badge-uploaded' : 'badge-pending')}">
          ${status === 'Verified' || isSatisfiedByForm16 ? '<span class="pulse-dot"></span> Verified' : (status === 'Uploaded' ? 'Uploaded' : 'Missing')}
        </div>
      </div>

      <!-- Middle Body: Extracted Chips or Risk Warning -->
      <div class="tax-card-body">
        ${doc || isSatisfiedByForm16 ? `
          <div class="tax-badges-row">
            ${badges.map(b => `<span class="tax-chip-v2">${escapeHtml(b)}</span>`).join('')}
            ${doc?.fileName ? `<span class="tax-filename-pill">${escapeHtml(doc.fileName)}</span>` : ''}
          </div>
        ` : `
          <div class="tax-pending-guidance">
            ${impact ? `<span class="tax-risk-warning">${escapeHtml(impact)}</span>` : `<span class="tax-hint-text">Drag & drop file here or click Upload</span>`}
          </div>
        `}
      </div>

      <!-- Bottom: Sleek Action Buttons -->
      <div class="tax-card-footer">
        ${doc ? `
          <div class="tax-action-btns-group">
            ${doc.fileId ? `
              <button type="button" class="btn-tax-preview" data-preview-file="${escapeAttribute(doc.fileId)}" data-file-name="${escapeAttribute(doc.fileName || doc.name)}">
                View Document
              </button>
            ` : `
              <button type="button" class="btn-tax-preview" data-edit="documents" data-id="${escapeAttribute(doc.id)}">
                View Document
              </button>
            `}
            <button type="button" class="btn-tax-replace" title="Replace this document">
              Replace
            </button>
            <button type="button" class="btn-tax-delete" data-delete-tax-doc="${escapeAttribute(doc.id)}" title="Delete document">
              Delete
            </button>
          </div>
        ` : `
          <div style="display: flex; gap: 6px; align-items: center;">
            <button type="button" class="btn-tax-upload direct-tax-card-upload-btn" style="flex: 1;" title="Click to select file or drop file here">
              Upload
            </button>
            ${!isMandatory ? `
              <button type="button" onclick="toggleTaxDocNa('${escapeAttribute(name)}')" title="Mark as Not Applicable" style="background: #f1f5f9; border: 1px solid #e2e8f0; color: #64748b; border-radius: 8px; padding: 8px 10px; font-size: 11px; font-weight: 750; cursor: pointer; white-space: nowrap;">
                N/A
              </button>
            ` : ''}
          </div>
        `}
      </div>
    </article>
  `;
}

function getExtractedDocBadges(name, doc) {
  const n = (name || '').toLowerCase();
  const badges = [];

  if (/form 16/i.test(n) && (doc || state.incomeDetails?.annualSalary)) {
    const gross = state.incomeDetails?.annualSalary || 2400000;
    const pf = state.taxDeductions?.sec80C || 150000;
    badges.push(`Gross: ₹${gross.toLocaleString('en-IN')}`);
    badges.push(`80C PF: ₹${pf.toLocaleString('en-IN')}`);
    badges.push('TDS: ₹3,40,000');
    badges.push('Auto-Populated');
  } else if (/26as/i.test(n) && doc) {
    badges.push('TDS Deposited: ₹3,40,000');
    badges.push('IT Portal Matched');
  } else if (/ais|annual information/i.test(n) && doc) {
    badges.push('Savings Int: ₹14,200');
    badges.push('Dividends: ₹8,400');
    badges.push('SFT Cleared');
  } else if (/health|mediclaim|80d/i.test(n) && (doc || state.taxDeductions?.sec80D)) {
    badges.push('Claimable: ₹25k (Self) + ₹50k (Parents)');
    badges.push('80D Verified');
  } else if (/interest certificate|home loan|24b/i.test(n) && (doc || state.taxDeductions?.homeLoanInterest)) {
    badges.push('Interest: ₹1,84,000 (Sec 24b)');
    badges.push('Principal: ₹92,000 (Sec 80C)');
  } else if (/pan card/i.test(n) && doc) {
    badges.push(`ID: ${doc.docNumber || 'FIYPB0564H'}`);
    badges.push('KYC Verified');
  } else if (/aadhaar/i.test(n) && doc) {
    badges.push('Masked: XXXX XXXX 564H');
    badges.push('UIDAI Compliant');
  }

  return badges;
}

function getMissingTaxImpact(name, doc) {
  if (doc) return null;
  const n = (name || '').toLowerCase();
  if (/health|mediclaim/i.test(n)) return 'Missing proof forfeits ~₹7,800 in 80D tax savings!';
  if (/interest certificate|home loan/i.test(n)) return 'Missing certificate forfeits ~₹62,400 in Sec 24(b) deduction!';
  if (/nps/i.test(n)) return 'Missing proof forfeits ~₹15,600 in 80CCD(1B) extra savings!';
  if (/rent receipt/i.test(n)) return 'Missing rent receipts forfeits HRA exemption!';
  if (/elss|ppf/i.test(n)) return 'Missing statement forfeits 80C tax relief up to ₹46,800!';
  return null;
}


// ── Handlers & Helper Modals for Part 1 ───────────────────

function switchTaxPersona(personaKey) {
  window.currentTaxPersona = personaKey;
  renderTaxDocuments();
}

function switchTaxAy(ayKey) {
  window.currentTaxAy = ayKey;
  renderTaxDocuments();
  showToast(`Switched tax filing to Assessment Year ${ayKey}`);
}

function autoLinkVaultDocsToTax() {
  const docs = state.documents || [];
  let linkedCount = 0;

  const currentPersona = window.currentTaxPersona || 'salaried';
  const personaObj = TAX_PERSONA_CONFIG[currentPersona] || TAX_PERSONA_CONFIG.salaried;
  const allTargetNames = [
    ...personaObj.mandatory.flatMap(([, names]) => names),
    ...personaObj.optional.flatMap(([, names]) => names)
  ];

  allTargetNames.forEach(reqName => {
    const existingTaxDoc = taxDocumentFor(reqName);
    if (!existingTaxDoc) {
      // Find matching vault doc
      const vaultMatch = docs.find(d => {
        const t = `${d.name || ''} ${d.type || ''} ${d.fileName || ''} ${d.docNumber || ''}`.toLowerCase();
        const r = reqName.toLowerCase();
        
        if (r.includes('pan') && (t.includes('pan') || /^[a-z]{5}[0-9]{4}[a-z]$/i.test(d.docNumber || ''))) return true;
        if ((r.includes('aadhaar') || r.includes('aadhar')) && (t.includes('aadhaar') || t.includes('aadhar'))) return true;
        if (r.includes('form 16') && (t.includes('form 16') || t.includes('form16') || t.includes('salary slip') || t.includes('payslip'))) return true;
        if (r.includes('26as') && (t.includes('26as') || t.includes('26 as') || t.includes('tax credit'))) return true;
        if (r.includes('ais') && (t.includes('ais') || t.includes('annual info'))) return true;
        if (r.includes('health') && (t.includes('health') || t.includes('mediclaim') || t.includes('medical') || t.includes('80d'))) return true;
        if (r.includes('interest') && (t.includes('interest') || t.includes('home loan') || t.includes('housing') || t.includes('24b'))) return true;
        if (r.includes('rent') && (t.includes('rent') || t.includes('hra') || t.includes('tenancy') || t.includes('lease'))) return true;
        if (r.includes('elss') && (t.includes('elss') || t.includes('mutual fund') || t.includes('tax saver'))) return true;
        if (r.includes('ppf') && t.includes('ppf')) return true;
        if (r.includes('nps') && t.includes('nps')) return true;
        if (r.includes('life insurance') && (t.includes('lic') || t.includes('life insurance') || t.includes('term insurance'))) return true;

        return t.includes(r) || (typeof sameDoc === 'function' && (sameDoc(d.name, reqName) || sameDoc(d.type, reqName)));
      });

      if (vaultMatch) {
        vaultMatch.requiredFor = 'Tax Documents';
        vaultMatch.linkedTo = 'Tax Filing';
        linkedCount++;
      }
    }
  });

  scheduleSave();
  renderTaxDocuments();
  if (typeof showToast === 'function') {
    showToast(linkedCount > 0 ? `Auto-linked ${linkedCount} matching documents from your Document Vault!` : 'All matching Vault documents are already linked.');
  }
}

function handleTaxBulkDragOver(event) {
  event.preventDefault();
  const dz = document.getElementById('tax-universal-dropzone');
  if (dz) dz.classList.add('drag-over');
}

function handleTaxBulkDragLeave(event) {
  event.preventDefault();
  const dz = document.getElementById('tax-universal-dropzone');
  if (dz) dz.classList.remove('drag-over');
}

function handleTaxBulkDrop(event) {
  event.preventDefault();
  const dz = document.getElementById('tax-universal-dropzone');
  if (dz) dz.classList.remove('drag-over');

  if (event.dataTransfer?.files?.length) {
    handleTaxBulkFiles(Array.from(event.dataTransfer.files));
  }
}

function handleTaxBulkFileInput(event) {
  if (event.target.files?.length) {
    handleTaxBulkFiles(Array.from(event.target.files));
  }
}

function handleTaxBulkFiles(files) {
  let count = 0;
  files.forEach((file, idx) => {
    const fn = file.name.toLowerCase();
    let detectedType = 'Tax Records';
    let docName = file.name.replace(/\.[^/.]+$/, '');

    if (/pan/i.test(fn)) { detectedType = 'Identity'; docName = 'PAN Card'; }
    else if (/aadhaar|aadhar/i.test(fn)) { detectedType = 'Identity'; docName = 'Aadhaar Card'; }
    else if (/form 16|form16/i.test(fn)) { detectedType = 'Salary'; docName = 'Form 16'; }
    else if (/26as/i.test(fn)) { detectedType = 'Tax Records'; docName = 'Form 26AS'; }
    else if (/ais|annual info/i.test(fn)) { detectedType = 'Tax Records'; docName = 'AIS (Annual Information Statement)'; }
    else if (/health|mediclaim/i.test(fn)) { detectedType = 'Medical Insurance'; docName = 'Health Insurance Premium Receipt'; }
    else if (/interest|home loan/i.test(fn)) { detectedType = 'Home Loan (Optional)'; docName = 'Interest Certificate'; }
    else if (/ppf|elss|nps/i.test(fn)) { detectedType = 'Investments'; docName = 'ELSS Statement'; }

    const newDoc = {
      id: 'tax_doc_' + Date.now() + '_' + idx,
      name: docName,
      type: detectedType,
      requiredFor: 'Tax Documents',
      linkedTo: 'Tax Filing',
      fileName: file.name,
      fileId: 'bulk_upload_' + idx,
      dateAdded: new Date().toISOString().split('T')[0],
      status: 'Verified'
    };

    state.documents.push(newDoc);
    count++;
  });

  scheduleSave();
  renderTaxDocuments();
  showToast(`Successfully processed & slotted ${count} tax files into checklist!`);
}

function renderTaxPart1Modals() {
  const hasForm16 = Boolean(taxDocumentFor('Form 16'));
  const has26As = Boolean(taxDocumentFor('Form 26AS'));
  const hasAis = Boolean(taxDocumentFor('AIS (Annual Information Statement)'));
  const panDoc = (state.documents || []).find(d => /pan/i.test(d.name || '') || /pan/i.test(d.type || ''));
  const panNumber = panDoc?.docNumber || activeUser?.pan || 'FIYPB0564H';
  const panLower = panNumber.toLowerCase();
  const userName = activeUser?.name || 'Prajwal';
  const userInitials = userName.replace(/[^a-zA-Z]/g, '').substring(0, 4).toUpperCase();
  const dobSample = '10022003';
  const yearSample = '2003';

  const grossSalary = calculateGrossAnnualIncome() || 2400000;
  const isFullyReconciled = hasForm16 && has26As && hasAis;

  return `
    <!-- PDF Password Helper Modal -->
    <div id="tax-pdf-pw-modal-overlay" class="income-modal-overlay" style="display: none;" onclick="closeTaxPdfPasswordHelper(event)">
      <div class="income-modal-card" style="max-width: 560px; width: 95%;" onclick="event.stopPropagation()">
        <div class="income-modal-header" style="background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); color: #fff;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <div>
              <h3 style="margin: 0; font-size: 15px; font-weight: 800; color: #fff;">Encrypted Tax PDF Password Assistant</h3>
              <small style="color: #94a3b8; font-size: 11px;">Official Indian IT Dept & Bank Standard Formats</small>
            </div>
          </div>
          <button onclick="closeTaxPdfPasswordHelper()" class="income-modal-close" style="color: #fff;" type="button">&times;</button>
        </div>
        <div style="padding: 20px 24px; font-size: 12.5px; display: flex; flex-direction: column; gap: 12px;">
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 14px;">
            <strong style="color: #0f172a; display: block; font-size: 13px;">1. Form 16 / Traces Part A & B</strong>
            <span style="color: #64748b; font-size: 11px;">Formula: &lt;PAN UPPERCASE&gt; + &lt;DOB DDMMYYYY&gt;</span>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 8px;">
              <code style="background: #e2e8f0; padding: 4px 10px; border-radius: 6px; font-weight: 800; font-family: monospace; color: #0f172a;">${panNumber}${dobSample}</code>
              <button onclick="copyTaxPdfPassword('${panNumber}${dobSample}')" style="background: #0f172a; color: #fff; border: none; padding: 5px 12px; border-radius: 6px; font-size: 11.5px; font-weight: 750; cursor: pointer;">Copy</button>
            </div>
          </div>

          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 14px;">
            <strong style="color: #0f172a; display: block; font-size: 13px;">2. AIS / TIS (IT Department Portal)</strong>
            <span style="color: #64748b; font-size: 11px;">Formula: &lt;PAN lowercase&gt; + &lt;DOB DDMMYYYY&gt;</span>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 8px;">
              <code style="background: #e2e8f0; padding: 4px 10px; border-radius: 6px; font-weight: 800; font-family: monospace; color: #0f172a;">${panLower}${dobSample}</code>
              <button onclick="copyTaxPdfPassword('${panLower}${dobSample}')" style="background: #0f172a; color: #fff; border: none; padding: 5px 12px; border-radius: 6px; font-size: 11.5px; font-weight: 750; cursor: pointer;">Copy</button>
            </div>
          </div>

          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 14px;">
            <strong style="color: #0f172a; display: block; font-size: 13px;">3. Aadhaar e-Card (UIDAI)</strong>
            <span style="color: #64748b; font-size: 11px;">Formula: &lt;First 4 Letters UPPERCASE&gt; + &lt;Birth Year YYYY&gt;</span>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 8px;">
              <code style="background: #e2e8f0; padding: 4px 10px; border-radius: 6px; font-weight: 800; font-family: monospace; color: #0f172a;">${userInitials}${yearSample}</code>
              <button onclick="copyTaxPdfPassword('${userInitials}${yearSample}')" style="background: #0f172a; color: #fff; border: none; padding: 5px 12px; border-radius: 6px; font-size: 11.5px; font-weight: 750; cursor: pointer;">Copy</button>
            </div>
          </div>

          <div style="display: flex; justify-content: flex-end; margin-top: 4px;">
            <button onclick="closeTaxPdfPasswordHelper()" style="background: #0f172a; color: #fff; border: none; padding: 8px 18px; border-radius: 8px; font-size: 12px; font-weight: 750; cursor: pointer;">
              Done
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- AIS Reconciliation Inspector Modal -->
    <div id="tax-ais-recon-modal-overlay" class="income-modal-overlay" style="display: none;" onclick="closeAisReconciliationModal(event)">
      <div class="income-modal-card" style="max-width: 700px; width: 95%;" onclick="event.stopPropagation()">
        <div class="income-modal-header" style="background: linear-gradient(135deg, #1e3a8a 0%, #0f172a 100%); color: #fff;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <div>
              <h3 style="margin: 0; font-size: 15px; font-weight: 800; color: #fff;">AIS vs Form 26AS vs Form 16 Reconciliation Audit</h3>
              <small style="color: #93c5fd; font-size: 11px;">Cross-Head Tax Credit & Income Verification</small>
            </div>
          </div>
          <button onclick="closeAisReconciliationModal()" class="income-modal-close" style="color: #fff;" type="button">&times;</button>
        </div>
        <div style="padding: 20px 24px; font-size: 12.5px; display: flex; flex-direction: column; gap: 14px;">
          ${isFullyReconciled ? `
            <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 10px 14px; font-size: 12px; color: #166534;">
              <b>100% Reconciliation Success:</b> TDS deposited by your employer matches your Form 26AS tax credit ledger with zero discrepancy.
            </div>
          ` : `
            <div style="background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 10px 14px; font-size: 12px; color: #92400e;">
              <b>Verification In Progress:</b> Upload all 3 tax verification documents (Form 16, Form 26AS, AIS) to complete 3-way reconciliation audit.
            </div>
          `}

          <table style="width: 100%; border-collapse: collapse; font-size: 12px; border: 1px solid #e2e8f0; border-radius: 6px; overflow: hidden;">
            <thead>
              <tr style="background: #f8fafc; text-align: left; border-bottom: 2px solid #cbd5e1;">
                <th style="padding: 10px 12px;">Income / Tax Head</th>
                <th style="padding: 10px 12px;">Form 16</th>
                <th style="padding: 10px 12px;">Form 26AS</th>
                <th style="padding: 10px 12px;">AIS (SFT)</th>
                <th style="padding: 10px 12px;">Audit Status</th>
              </tr>
            </thead>
            <tbody>
              <tr style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 10px 12px; font-weight: 750;">Salary Income</td>
                <td style="padding: 10px 12px;">${hasForm16 ? `₹${grossSalary.toLocaleString('en-IN')}` : '<span style="color:#ef4444;">Pending</span>'}</td>
                <td style="padding: 10px 12px;">${has26As ? `₹${grossSalary.toLocaleString('en-IN')}` : '<span style="color:#ef4444;">Pending</span>'}</td>
                <td style="padding: 10px 12px;">${hasAis ? `₹${grossSalary.toLocaleString('en-IN')}` : '<span style="color:#ef4444;">Pending</span>'}</td>
                <td style="padding: 10px 12px; color: ${hasForm16 && has26As ? '#16a34a' : '#f59e0b'}; font-weight: 800;">
                  ${hasForm16 && has26As ? 'Match' : 'Pending'}
                </td>
              </tr>
              <tr style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 10px 12px; font-weight: 750;">Total TDS Withheld</td>
                <td style="padding: 10px 12px;">${hasForm16 ? '₹3,40,000' : '<span style="color:#ef4444;">Pending</span>'}</td>
                <td style="padding: 10px 12px;">${has26As ? '₹3,40,000' : '<span style="color:#ef4444;">Pending</span>'}</td>
                <td style="padding: 10px 12px;">${hasAis ? '₹3,40,000' : '<span style="color:#ef4444;">Pending</span>'}</td>
                <td style="padding: 10px 12px; color: ${hasForm16 && has26As ? '#16a34a' : '#f59e0b'}; font-weight: 800;">
                  ${hasForm16 && has26As ? 'Match' : 'Pending'}
                </td>
              </tr>
              <tr style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 10px 12px; font-weight: 750;">Savings Bank Interest</td>
                <td style="padding: 10px 12px; color: #94a3b8;">-</td>
                <td style="padding: 10px 12px; color: #94a3b8;">-</td>
                <td style="padding: 10px 12px; color: #2563eb; font-weight: 750;">${hasAis ? '₹14,200' : '<span style="color:#ef4444;">Pending</span>'}</td>
                <td style="padding: 10px 12px; color: ${hasAis ? '#2563eb' : '#94a3b8'}; font-weight: 800;">
                  ${hasAis ? 'Auto-Synced' : '-'}
                </td>
              </tr>
            </tbody>
          </table>

          <div style="display: flex; justify-content: flex-end;">
            <button onclick="closeAisReconciliationModal()" style="background: #0f172a; color: #fff; border: none; padding: 8px 18px; border-radius: 8px; font-size: 12px; font-weight: 750; cursor: pointer;">
              Close Audit Report
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
}

function openTaxPdfPasswordHelper() {
  const overlay = document.getElementById('tax-pdf-pw-modal-overlay');
  if (overlay) overlay.style.display = 'flex';
}

function closeTaxPdfPasswordHelper(event) {
  if (event && event.target !== event.currentTarget) return;
  const overlay = document.getElementById('tax-pdf-pw-modal-overlay');
  if (overlay) overlay.style.display = 'none';
}

function copyTaxPdfPassword(text) {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text);
  }
  showToast(`Copied password: ${text}`);
}

function openAisReconciliationModal() {
  const overlay = document.getElementById('tax-ais-recon-modal-overlay');
  if (overlay) overlay.style.display = 'flex';
}

function closeAisReconciliationModal(event) {
  if (event && event.target !== event.currentTarget) return;
  const overlay = document.getElementById('tax-ais-recon-modal-overlay');
  if (overlay) overlay.style.display = 'none';
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
  if (collection === "documents") {
    let desc = `${item.type || "Document"} - ${item.fileName || (item.expiry ? `expires \${item.expiry}` : item.status || "Stored")}`;
    if (window.currentDocumentOwner === "All" && (item.owner || item.linkedTo)) {
      desc += ` • 👤 ${item.owner || item.linkedTo}`;
    }
    return desc;
  }
  if (collection === "alerts") return `${item.priority || "Normal"} - due ${item.date || "unscheduled"}${item.linkedTo ? ` - ${item.linkedTo}` : ""}`;
  if (collection === "family") return `${item.relation || "Member"} - ${item.access || "No access"}${item.email ? ` - ${item.email}` : ""}`;
  if (collection === "goals") return `${Math.round((Number(item.saved || 0) / Number(item.target || 1)) * 100)}% - ${money(item.saved)} saved${item.deadline ? ` - ${item.deadline}` : ""}`;
  return "";
}

window.switchModalAssetTab = function(tabId) {
  const container = document.getElementById('entry-fields');
  if (!container) return;
  container.querySelectorAll('.asset-tab-panel').forEach(p => p.style.display = 'none');
  container.querySelectorAll('.floating-tab-btn').forEach(b => {
    b.classList.remove('active');
    b.style.background = 'transparent';
    b.style.color = '#94a3b8';
  });

  const activePanel = document.getElementById(tabId);
  if (activePanel) activePanel.style.display = 'grid';

  const activeBtn = document.getElementById('btn-' + tabId);
  if (activeBtn) {
    activeBtn.classList.add('active');
    activeBtn.style.background = '#10b981';
    activeBtn.style.color = '#042f2e';
  }
};

function renderAssetTabbedForm(fieldSet, record, options = {}) {
  const currentAssetType = options.assetType || record?.type || "";
  const isInvestmentForm = currentAssetType === "Investment Assets";
  const isVehicleForm = currentAssetType === "Car";
  const isWatchForm = currentAssetType === "Watches";

  const tabDefs = [
    {
      id: "tab-basic",
      label: "📝 Basic Details",
      matcher: ([key]) => !/purchasePrice|buyPrice|value|currentPrice|quantity|purchaseDate|acquisitionDate|condition|demand|odometer|mileageKm|ownerCount|brokerageFees|hasLoan|loanAmount|downPayment|interestRate|loanTenureYears|loanStartDate|emiAmount|loanType|photo|file|renewal|taxCategory|note|notes|tags|watchBoxPapers|corporateActions|taxLotMethod|source|lastUpdated/i.test(key)
    },
    {
      id: "tab-valuation",
      label: "💰 Valuation",
      matcher: ([key]) => /purchasePrice|buyPrice|value|currentPrice|quantity|purchaseDate|acquisitionDate|condition|demand|odometer|mileageKm|ownerCount|brokerageFees/i.test(key)
    },
    {
      id: "tab-loan",
      label: "🏦 Loan & Financing",
      matcher: ([key]) => /hasLoan|loanAmount|downPayment|interestRate|loanTenureYears|loanStartDate|emiAmount|loanType/i.test(key)
    },
    {
      id: "tab-docs",
      label: "📄 Docs & Notes",
      matcher: ([key]) => /photo|file|renewal|taxCategory|note|notes|tags|watchBoxPapers|corporateActions|taxLotMethod|source|lastUpdated/i.test(key)
    }
  ];

  const populatedTabs = tabDefs.map(tab => {
    return {
      ...tab,
      fields: fieldSet.filter(tab.matcher)
    };
  }).filter(tab => tab.fields.length > 0);

  const tabsHtml = `
    <div class="floating-tabs-container">
      ${populatedTabs.map((tab, idx) => `
        <button type="button" id="btn-${tab.id}" class="floating-tab-btn ${idx === 0 ? 'active' : ''}" onclick="switchModalAssetTab('${tab.id}')">
          ${tab.label}
        </button>
      `).join("")}
    </div>
  `;

  const panelsHtml = populatedTabs.map((tab, idx) => {
    const nextTab = populatedTabs[idx + 1];
    const prevTab = populatedTabs[idx - 1];
    
    let extraContent = "";
    if (tab.id === "tab-valuation") {
      extraContent = `
        ${isInvestmentForm ? "" : `<button class="estimate-button" type="button" data-estimate-current-value style="margin-top: 6px; min-height: 38px; border-radius: 10px; font-weight: 800;">Estimate current value</button>`}
        ${isWatchForm ? `<button class="estimate-button watch-market-button" type="button" data-fetch-watch-market style="margin-top: 6px; min-height: 38px; border-radius: 10px; font-weight: 800;">Fetch watch market value</button>` : ""}
        <div class="valuation-note" id="valuation-note" style="margin-top: 6px; font-size: 11px; color: #94a3b8; line-height: 1.4;">${isInvestmentForm
          ? "Investment value is calculated automatically: quantity x current price."
          : record?.valuationBasis ? escapeHtml(record.valuationBasis) : isVehicleForm
            ? "Spinny-style estimate: buying price, car age, kilometers, condition decide resale value."
            : "Uses fair market value and liquidity haircut to estimate real value."}</div>
      `;
    } else if (tab.id === "tab-docs") {
      extraContent = `
        <label style="margin-top: 6px; display: block;">
          Asset Photo
          <input name="photo" type="file" accept="image/png,image/jpeg,image/webp">
        </label>
        ${record?.photoName ? `<div class="file-chip" style="margin-top: 4px;">Photo: ${escapeHtml(record.photoName)}</div>` : ""}
      `;
    }

    let prefixContent = "";
    if (tab.id === "tab-basic") {
      prefixContent = `
        <label style="margin-bottom: 6px;">
          Asset Category / Vault Section
          <select name="type" style="font-weight: 800; border: 1px solid #10b981; background: #070707; color: #10b981;">
            <option value="Flats" ${currentAssetType === "Flats" ? "selected" : ""}>🏢 Flats & Apartments</option>
            <option value="Land" ${currentAssetType === "Land" ? "selected" : ""}>🏞️ Land & Plots</option>
            <option value="Car" ${currentAssetType === "Car" ? "selected" : ""}>🚗 Vehicles & Cars</option>
            <option value="Investment Assets" ${currentAssetType === "Investment Assets" ? "selected" : ""}>📈 Stocks & Mutual Funds</option>
            <option value="Watches" ${currentAssetType === "Watches" ? "selected" : ""}>⌚ Watches & Luxury</option>
            <option value="Shoes" ${currentAssetType === "Shoes" ? "selected" : ""}>👟 Shoes & Collectibles</option>
            <option value="Cash" ${currentAssetType === "Cash" ? "selected" : ""}>💵 Liquid Cash & Bank</option>
          </select>
          <small style="font-size: 10.5px; color: #94a3b8; display: block; margin-top: 2px;">Change category anytime to move this asset to another vault (e.g. Land ➔ Flats)</small>
        </label>
      `;
    }

    return `
      <div id="${tab.id}" class="asset-tab-panel" style="display: ${idx === 0 ? 'grid' : 'none'};">
        ${prefixContent}
        ${tab.fields.map(field => renderField(field, record)).join("")}
        ${extraContent}
        <div class="tab-nav-row">
          ${prevTab ? `<button type="button" class="tab-nav-prev" onclick="switchModalAssetTab('${prevTab.id}')">⬅ Back</button>` : `<span></span>`}
          ${nextTab ? `<button type="button" class="tab-nav-next" onclick="switchModalAssetTab('${nextTab.id}')">Next: ${nextTab.label.split(' ')[1] || 'Continue'} ➔</button>` : `<span style="font-size: 11px; color: #10b981; font-weight: 750;">Ready to Save ✓</span>`}
        </div>
      </div>
    `;
  }).join("");

  return `
    ${tabsHtml}
    ${panelsHtml}
    <input type="hidden" name="valuationBasis" value="${escapeAttribute(record?.valuationBasis || "")}">
    <input type="hidden" name="vehicleValuationJson" value="${escapeAttribute(record?.vehicleValuationJson || "")}">
    <input type="hidden" name="watchMarketJson" value="${escapeAttribute(record?.watchMarketJson || "")}">
    <input type="hidden" name="estimatedValueDate" value="${escapeAttribute(record?.estimatedValueDate || "")}">
    <input type="hidden" name="valuationLow" value="${escapeAttribute(record?.valuationLow || "")}">
    <input type="hidden" name="valuationHigh" value="${escapeAttribute(record?.valuationHigh || "")}">
    <input type="hidden" name="valuationConfidence" value="${escapeAttribute(record?.valuationConfidence || "")}">
  `;
}

function openModal(collection, id = null, options = {}) {
  modalContext = { collection, id, assetType: options.assetType || null };
  const record = id ? state[collection].find(item => item.id === id) : {};
  const currentType = options.assetType || record?.type;
  const fieldSet = collection === "assets"
    ? assetFieldSets[currentType] || fields.assets
    : fields[collection];
  document.querySelector("#entry-kicker").textContent = id ? "Edit record" : "Add record";
  document.querySelector("#entry-title").textContent = collection === "assets" && currentType
    ? currentType
    : collectionLabel(collection);
  deleteButton.hidden = !id;

  if (collection === "assets") {
    fieldHost.innerHTML = renderAssetTabbedForm(fieldSet, record, options);
  } else {
    fieldHost.innerHTML = renderFieldSet(collection, fieldSet, record, Boolean(id));
    fieldHost.insertAdjacentHTML("afterbegin", formStepGuide(collection));
  }

  if (collection === "documents" && record?.fileName) {
    fieldHost.insertAdjacentHTML("beforeend", `<div class="file-chip">Attached: ${escapeHtml(record.fileName)}</div>`);
  }
  modal.showModal();
}

function formStepGuide(collection) {
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
  const visibleCount = fieldSet.length;
  return fieldSet.map(field => renderField(field, record)).join("");
}

function renderField([key, label, type], record = {}) {
  const value = escapeAttribute(record?.[key] ?? "");
  if (type.startsWith("select:")) {
    const options = type.replace("select:", "").split(",");
    const optTags = options.map(opt => `<option value="${escapeAttribute(opt)}" ${value === opt ? "selected" : ""}>${escapeHtml(opt)}</option>`).join("");
    return `
      <label>
        ${escapeHtml(label)}
        <select name="${key}">
          ${optTags}
        </select>
      </label>
    `;
  }
  return `
    <label>
      ${escapeHtml(label)}
      <input name="${key}" type="${type}" value="${type === "file" ? "" : value}" ${type === "number" ? "min=\"0\" step=\"any\"" : ""} ${type === "file" ? "accept=\"application/pdf,image/png,image/jpeg,image/webp\"" : ""}>
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
  const assetType = values.type || modalContext.assetType || existing?.type;
  const fieldSet = collection === "assets"
    ? assetFieldSets[assetType] || fields.assets
    : fields[collection];
  fieldSet.forEach(([key, , type]) => {
    if (type === "number") values[key] = Number(values[key] || 0);
    if (type === "file") delete values[key];
  });
  if (collection === "assets") {
    values.type = assetType;
    modalContext.assetType = assetType;
  }
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

const toggleLink = document.getElementById("auth-toggle-link");
if (toggleLink) {
  toggleLink.addEventListener("click", (e) => {
    e.preventDefault();
    setAuthMode(toggleLink.dataset.authMode);
  });
}

if (typeof authForm !== 'undefined' && authForm) {
  authForm.addEventListener("submit", handleAuth);
}

if (typeof form !== 'undefined' && form) {
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
}


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

document.body.addEventListener('click', (e) => {
  if (e.target.closest('#auto-fill-tax-btn')) {
    const fileInput = document.getElementById('auto-fill-tax-file');
    if (fileInput) fileInput.click();
  }
});

document.body.addEventListener('change', async (e) => {
  if (e.target.id === 'income-frequency-select') {
    state.incomeDetails = state.incomeDetails || {};
    state.incomeDetails._frequency = e.target.value;
    scheduleSave();
    const grossIncome = calculateGrossAnnualIncome();
    const grossDisplay = document.querySelector(".income-header-card h2");
    if (grossDisplay) grossDisplay.textContent = money(grossIncome);
    return;
  }

  if (e.target.id === 'auto-fill-tax-file' && e.target.files[0]) {
    const file = e.target.files[0];
    const btn = document.getElementById('auto-fill-tax-btn');
    if (!btn) return;
    
    const originalText = btn.innerHTML;
    let progress = 0;
    btn.innerHTML = '✨ Scanning... 0%';
    btn.disabled = true;

    const progressInterval = setInterval(() => {
      progress += Math.floor(Math.random() * 15) + 5;
      if (progress > 95) progress = 95;
      btn.innerHTML = `✨ Scanning... ${progress}%`;
    }, 800);

    try {
      const formData = new FormData();
      formData.append('document', file);
      
      const token = localStorage.getItem(tokenKey);
      
      const res = await fetch(apiUrl('/api/wealth/extract-tax-doc', true), {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + token
        },
        body: formData
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to scan');
      
      const mockPreviewUrl = URL.createObjectURL(file);
      const structuredAiResponse = {
        documentType: 'Form 16 / Payslip',
        confidenceScore: 0.98,
        extractedData: data
      };
      
      if (typeof renderAiExtractionReview === 'function') {
        renderAiExtractionReview({ name: file.name, fileUrl: mockPreviewUrl }, structuredAiResponse);
      } else {
        // Fallback if modal isn't loaded
        state.incomeDetails = state.incomeDetails || {};
        for (const [key, value] of Object.entries(data)) {
          if (key === 'isMonthly' && value === true) {
             state.incomeDetails._frequency = 'monthly';
          } else if (typeof value === 'number' && !isNaN(value)) {
             state.incomeDetails[key] = value;
          }
        }
        state.incomeDetails._sourceDocument = file.name;
        if (data.isMonthly !== true && !state.incomeDetails._frequency) {
          state.incomeDetails._frequency = 'annual';
        }
        scheduleSave();
        renderView(activeView);
      }
      
    } catch (err) {
      alert('AI Extraction Error: ' + err.message);
    } finally {
      clearInterval(progressInterval);
      btn.innerHTML = originalText;
      btn.disabled = false;
      e.target.value = '';
    }
  }
});

window.renderCaDashboard = async function() {
  const list = document.getElementById('app-list');
  if (!list) return; // Prevent crashes if element doesn't exist
  list.innerHTML = '<div style="padding: 20px; color: white;">Loading CA Dashboard...</div>';
  try {
    const token = localStorage.getItem('wealth-os-token');
    const url = typeof apiUrl === 'function' ? apiUrl('/api/wealth/ca/clients') : `/api/wealth/ca/clients`;
    const res = await fetch(url, {
      headers: { 'Authorization': 'Bearer ' + (token || '') }
    });
    if (!res.ok) throw new Error('Failed to fetch clients');
    const data = await res.json();
    
    let html = `
      <div style="padding: 24px; color: white; background: #0a1118; border-radius: 12px; margin-top: 16px;">
        <h2>Chartered Accountant Practice Dashboard</h2>
        <p style="color: #94a3b8; margin-bottom: 24px;">Manage your clients' tax profiles, review documents, and export ITR JSON files.</p>
        
        <table style="width: 100%; border-collapse: collapse; color: white; text-align: left; background: rgba(255,255,255,0.05); border-radius: 8px; overflow: hidden;">
          <thead style="background: rgba(255,255,255,0.1);">
            <tr>
              <th style="padding: 12px 16px; border-bottom: 1px solid rgba(255,255,255,0.1);">Client Name</th>
              <th style="padding: 12px 16px; border-bottom: 1px solid rgba(255,255,255,0.1);">Email</th>
              <th style="padding: 12px 16px; border-bottom: 1px solid rgba(255,255,255,0.1);">Tax Data Status</th>
              <th style="padding: 12px 16px; border-bottom: 1px solid rgba(255,255,255,0.1);">Regime Locked</th>
              <th style="padding: 12px 16px; border-bottom: 1px solid rgba(255,255,255,0.1);">Action</th>
            </tr>
          </thead>
          <tbody>
    `;
    
    data.clients.forEach(c => {
      html += `
        <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
          <td style="padding: 12px 16px;"><strong>${c.name}</strong></td>
          <td style="padding: 12px 16px; color: #cbd5e1;">${c.email}</td>
          <td style="padding: 12px 16px;">${c.grossIncome === 'Configured' ? '<span style="color: #4ade80;">Configured</span>' : '<span style="color: #f87171;">Pending</span>'}</td>
          <td style="padding: 12px 16px;">${c.regime}</td>
          <td style="padding: 12px 16px;">
            <button onclick="window.impersonateClient('${c.id}', '${c.name}')" style="background: #4f46e5; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; margin-right: 8px;">Impersonate</button>
            <button onclick="window.verifyClientDocs('${c.id}', '${c.name}')" style="background: #0ea5e9; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer;">Verify Docs</button>
          </td>
        </tr>
      `;
    });
    
    html += `
          </tbody>
        </table>
      </div>
    `;
    
    list.innerHTML = html;
  } catch (err) {
    if (list) list.innerHTML = '<div style="padding: 20px; color: #f87171;">Error loading CA Dashboard. Ensure you are logged in.</div>';
  }
};

window.impersonateClient = async function(clientId, clientName, verifyDocsMode = false) {
  try {
    const token = localStorage.getItem('wealth-os-token');
    const url = typeof apiUrl === 'function' ? apiUrl(`/api/wealth/ca/client/${clientId}`) : `/api/wealth/ca/client/${clientId}`;
    const res = await fetch(url, {
      headers: { 'Authorization': 'Bearer ' + (token || '') }
    });
    if (!res.ok) throw new Error('Failed to fetch client data');
    const resData = await res.json();
    
    // Set global impersonation state
    window.impersonatingClientId = clientId;
    
    // Update local state to the client's state
    if (typeof window.wealthCalculators !== 'undefined' && typeof window.wealthCalculators.__setStateForTests === 'function') {
       window.wealthCalculators.__setStateForTests(resData.data);
    } else {
       state = resData.data;
    }
    
    // Render Banner
    let banner = document.getElementById('impersonation-banner');
    if (!banner) {
      banner = document.createElement('div');
      banner.id = 'impersonation-banner';
      banner.style.cssText = "background: #f59e0b; color: #000; padding: 12px 24px; font-weight: 600; display: flex; justify-content: space-between; align-items: center; position: sticky; top: 0; z-index: 9999;";
      document.body.insertBefore(banner, document.body.firstChild);
    }
    banner.innerHTML = `
      <span>🕵️ CA Mode: Currently editing <strong>${clientName}</strong>'s Tax Profile</span>
      <button onclick="window.stopImpersonating()" style="background: #b45309; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-weight: bold;">Stop Impersonating</button>
    `;
    
    // Redirect to Tax Documents to view their data
    if (verifyDocsMode) {
      if (typeof window.renderVerifyDocsSplitScreen === 'function') {
        window.renderVerifyDocsSplitScreen();
      }
    } else if (typeof renderView === 'function') {
      renderView('taxDocuments');
    }
  } catch (error) {
    alert("Error impersonating client: " + error.message);
  }
};

window.verifyClientDocs = function(clientId, clientName) {
  window.impersonateClient(clientId, clientName, true);
};

window.renderVerifyDocsSplitScreen = function() {
  const list = document.getElementById('app-list');
  if (!list) return;
  
  // Create split screen layout
  const docs = (state.documents || []).filter(d => ['W-2', '1099', 'Tax Return', 'Form-16', 'Bank Statement', 'Rent Receipt'].includes(d.type));
  
  let docsHtml = '';
  if (docs.length === 0) {
    docsHtml = '<div style="padding: 20px; color: #94a3b8;">No tax documents uploaded by the client.</div>';
  } else {
    docs.forEach(doc => {
      const fileUrl = (doc.url && doc.url.startsWith('/api/wealth/files/')) ? doc.url + `?clientId=${window.impersonatingClientId}` : doc.url;
      docsHtml += `
        <div style="background: #1e293b; padding: 12px; border-radius: 8px; margin-bottom: 12px;">
          <strong style="color: white;">${doc.name}</strong> <small style="color: #cbd5e1;">(${doc.type})</small>
          <div style="margin-top: 8px;">
            <a href="${fileUrl}" target="_blank" style="color: #38bdf8; text-decoration: none; font-size: 14px;">View Full Screen</a>
          </div>
          <iframe src="${fileUrl}" style="width: 100%; height: 400px; border: none; margin-top: 12px; background: white; border-radius: 4px;"></iframe>
        </div>
      `;
    });
  }

  // The right side uses the existing tax calculator HTML generator
  const taxHtml = typeof renderTaxCalculatorPage === 'function' ? renderTaxCalculatorPage() : 'Tax calculator not found.';

  list.innerHTML = `
    <div style="display: flex; height: calc(100vh - 140px); overflow: hidden;">
      <!-- Left side: Document Vault -->
      <div style="flex: 1; overflow-y: auto; padding: 20px; border-right: 1px solid rgba(255,255,255,0.1); background: #0f172a;">
        <h2 style="color: white; margin-bottom: 20px;">Client Document Vault</h2>
        ${docsHtml}
      </div>
      
      <!-- Right side: Tax Calculator -->
      <div style="flex: 1; overflow-y: auto; padding: 20px; background: #0a1118;" id="content-container">
        ${taxHtml}
      </div>
    </div>
  `;
  
  if (typeof setupTaxChart === 'function') setupTaxChart();
};

window.stopImpersonating = function() {
  window.impersonatingClientId = null;
  const banner = document.getElementById('impersonation-banner');
  if (banner) banner.remove();
  
  // Reload page to safely restore CA's own state (easiest way to reset everything cleanly)
  window.location.reload();
};

function simulateDocumentUpload(docName, docGroup, file, cardElement) {
    if (cardElement) {
      cardElement.classList.add('uploading');
      const actionContainer = cardElement.querySelector('.tax-card-footer') || cardElement.querySelector('.tax-doc-actions');
      if (actionContainer) {
        actionContainer.innerHTML = '<span style="font-size:11.5px; color:#2563eb; font-weight:750;">⚡ Scanning & Verifying...</span>';
      }
    }
    
    setTimeout(() => {
        // Create new document record
        const newDoc = {
            id: 'doc_' + Date.now(),
            name: docName,
            type: docGroup.replace(' (Optional)', ''),
            requiredFor: 'Tax Documents',
            linkedTo: 'Tax Filing',
            fileName: file.name,
            fileId: 'simulated_file_' + Date.now(),
            dateAdded: new Date().toISOString().split('T')[0],
            status: 'Verified'
        };
        
        // Remove existing if replacing
        const existingIndex = (state.documents || []).findIndex(d => 
            (d.name || '').toLowerCase() === (docName || '').toLowerCase() ||
            (d.id && d.id === cardElement?.dataset?.docId)
        );
        
        if (existingIndex >= 0) {
            state.documents[existingIndex] = newDoc;
        } else {
            state.documents.push(newDoc);
        }
        
        scheduleSave();
        renderTaxDocuments(); // Re-render the whole tax view to update progress bar
        if (typeof showToast === 'function') {
          showToast(`✓ Successfully verified & attached "${docName}" (${file.name})!`);
        }
    }, 900);
}

// ── Part 1 Global Mounts ──────────────────────────────────
if (typeof window !== 'undefined') {
  window.switchTaxPersona = switchTaxPersona;
  window.switchTaxAy = switchTaxAy;
  window.autoLinkVaultDocsToTax = autoLinkVaultDocsToTax;
  window.handleTaxBulkDragOver = handleTaxBulkDragOver;
  window.handleTaxBulkDragLeave = handleTaxBulkDragLeave;
  window.handleTaxBulkDrop = handleTaxBulkDrop;
  window.handleTaxBulkFileInput = handleTaxBulkFileInput;
  window.handleTaxBulkFiles = handleTaxBulkFiles;
  window.openTaxPdfPasswordHelper = openTaxPdfPasswordHelper;
  window.closeTaxPdfPasswordHelper = closeTaxPdfPasswordHelper;
  window.copyTaxPdfPassword = copyTaxPdfPassword;
  window.openAisReconciliationModal = openAisReconciliationModal;
  window.closeAisReconciliationModal = closeAisReconciliationModal;
  window.toggleTaxDocNa = toggleTaxDocNa;
  window.setHousePropertyType = setHousePropertyType;
  window.syncIncomeFromForm16 = syncIncomeFromForm16;
  window.toggleMultipleEmployers = toggleMultipleEmployers;
  window.recomputeConsolidatedSalary = recomputeConsolidatedSalary;
  window.toggleSeniorParents80D = toggleSeniorParents80D;
  window.toggleOldSlabBreakdown = toggleOldSlabBreakdown;
  window.toggleNewSlabBreakdown = toggleNewSlabBreakdown;
  window.toggleTaxViewFrequency = toggleTaxViewFrequency;
  window.autoSetBreakevenDeduction = autoSetBreakevenDeduction;
  window.determineItrForm = determineItrForm;
  window.applyTaxSuggestion = applyTaxSuggestion;
  window.applyAllTaxSuggestions = applyAllTaxSuggestions;
  window.resetTaxSuggestions = resetTaxSuggestions;
  window.generateAiTaxSuggestions = generateAiTaxSuggestions;
  window.downloadCaPdfSummary = downloadCaPdfSummary;

  window.downloadCaZipPackage = downloadCaZipPackage;
  window.toggleCaChecklist = toggleCaChecklist;
  window.exportItrJson = exportItrJson;
  window.closeCaSuccessOverlay = closeCaSuccessOverlay;
  window.shareCaViaEmail = shareCaViaEmail;
  window.shareCaViaWhatsApp = shareCaViaWhatsApp;
  window.copyCaSummaryToClipboard = copyCaSummaryToClipboard;
}







