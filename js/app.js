document.addEventListener("input", event => {
  if (event.target.matches("[data-income-key]")) {
    const key = event.target.dataset.incomeKey;
    const value = Math.max(0, Number(event.target.value) || 0);
    state.incomeDetails = state.incomeDetails || {};
    state.incomeDetails[key] = value;
    
    // Update Gross Annual Income display live
    if (typeof calculateGrossAnnualIncome === 'function') {
      const grossIncome = calculateGrossAnnualIncome();
      const grossDisplay = document.querySelector(".income-header-card h2");
      if (grossDisplay) grossDisplay.textContent = money(grossIncome);
      
      const hraPreview = document.getElementById("hra-preview-container");
      if (hraPreview && typeof renderHraExemptionPreview === 'function') {
        const dummyContainer = document.createElement("div");
        dummyContainer.innerHTML = renderHraExemptionPreview(state.incomeDetails);
        const newPreview = dummyContainer.querySelector("div");
        if (newPreview) {
          hraPreview.replaceWith(newPreview);
        }
      }
    }
    
    scheduleSave();
  }

  if (event.target.matches("[data-deduction-key]")) {
    const key = event.target.dataset.deductionKey;
    const value = Math.max(0, Number(event.target.value) || 0);
    state.taxDeductions = state.taxDeductions || {};
    state.taxDeductions[key] = value;

    // Granular real-time updates to avoid destroying input focus
    const max = Number(event.target.dataset.max) || 150000;
    const eligibleClaimed = Math.min(value, max);
    const remaining = Math.max(0, max - value);
    const progressPercent = Math.min(100, Math.round((value / max) * 100));

    const tag = document.getElementById(`ded-tag-${key}`);
    const claimedEl = document.getElementById(`ded-claimed-${key}`);
    const remainingEl = document.getElementById(`ded-remaining-${key}`);
    const bar = document.getElementById(`ded-bar-${key}`);

    if (tag) tag.textContent = progressPercent >= 100 ? "Maxed Out" : `${progressPercent}% Used`;
    if (claimedEl) claimedEl.textContent = money(eligibleClaimed);
    if (remainingEl) {
      remainingEl.textContent = money(remaining);
      remainingEl.className = remaining > 0 ? "highlight-remaining" : "highlight-full";
    }
    if (bar) bar.style.width = `${progressPercent}%`;

    if (typeof calculateTaxDeductionsSummary === 'function') {
      const summary = calculateTaxDeductionsSummary();
      const liveTotal = document.getElementById("live-total-deductions");
      const liveTaxable = document.getElementById("live-taxable-income");
      if (liveTotal) liveTotal.textContent = money(summary.totalDeductions);
      if (liveTaxable) liveTaxable.textContent = money(summary.taxableIncome);
    }
    
    scheduleSave();
  }
});

document.addEventListener("change", event => {
  if (event.target.id === "income-metro-select") {
    state.incomeDetails = state.incomeDetails || {};
    state.incomeDetails.isMetro = event.target.value === "true";
    scheduleSave();
    renderTaxDocuments();
  }
  if (event.target.id === "regime-lock-select") {
    state.taxDeductions = state.taxDeductions || {};
    state.taxDeductions.selectedRegime = event.target.value;
    scheduleSave();
    // Render the calculator view to reflect the lock change
    const container = document.getElementById("content-container");
    if (container && typeof renderTaxCalculatorPage === 'function') {
      container.innerHTML = renderTaxCalculatorPage();
      if (typeof setupTaxChart === 'function') setupTaxChart();
    }
  }
  if (event.target.id === "income-frequency-select") {
    state.incomeDetails = state.incomeDetails || {};
    state.incomeDetails._frequency = event.target.value;
    scheduleSave();
    renderTaxDocuments();
  }
  if (event.target.id === "asset-sort") {
    assetSort = event.target.value || "value";
    renderAssets();
  }
  if (event.target.id === "auto-fill-tax-file" && event.target.files.length) {
    const file = event.target.files[0];
    const formData = new FormData();
    formData.append("document", file);
    
    saveStateLabel.textContent = "Extracting Data with AI...";
    fetch(`${localApiBase}/api/wealth/extract-tax-doc`, {
      method: "POST",
      headers: { Authorization: `Bearer ${localStorage.getItem(tokenKey)}` },
      body: formData
    })
    .then(r => r.json())
    .then(data => {
      if (data.error) throw new Error(data.error);
      state.incomeDetails = { ...state.incomeDetails, ...data };
      scheduleSave();
      renderTaxDocuments(); // Refresh UI
    })
    .catch(err => {
      alert("AI Auto-fill failed: " + err.message);
    })
    .finally(() => {
      saveStateLabel.textContent = "Saved";
      event.target.value = "";
    });
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
    localStorage.setItem('wealth-os-tax-tab', window.currentTaxTab);
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
  if (event.target.closest("#auto-fill-tax-btn")) {
    document.getElementById("auto-fill-tax-file").click();
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
    if (add.dataset.add === "incomeStreams") {
      if (typeof openIncomeModal === "function") openIncomeModal();
      return;
    }
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


// Hook up global search
searchInput.addEventListener("input", () => renderView());

window.addEventListener("hashchange", () => {
  const hash = window.location.hash.replace('#', '').trim();
  if (hash && (config[hash] || hash === 'income' || hash === 'incomeStreams')) {
    const target = hash === 'income' ? 'incomeStreams' : hash;
    if (activeView !== target) {
      renderView(target);
    }
  }
});
