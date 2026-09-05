const assert = require("assert");
const { randomUUID } = require("crypto");

function makeElement() {
  return {
    textContent: "",
    innerHTML: "",
    value: "",
    dataset: {},
    files: [],
    style: {},
    classList: {
      add() {},
      remove() {},
      toggle() {}
    },
    addEventListener() {},
    removeEventListener() {},
    querySelector() {
      return makeElement();
    },
    querySelectorAll() {
      return [];
    },
    closest() {
      return null;
    },
    appendChild() {},
    setAttribute() {},
    reset() {}
  };
}

global.location = { protocol: "http:" };
global.crypto = { randomUUID };
global.window = {
  __WEALTH_OS_TEST__: true,
  addEventListener() {},
  prompt() {
    return "";
  },
  confirm() {
    return true;
  }
};
global.document = {
  querySelector() {
    return makeElement();
  },
  querySelectorAll() {
    return [];
  },
  addEventListener() {},
  createElement() {
    return makeElement();
  }
};

const calc = require("../wealth-os.js");

function investment(overrides = {}) {
  return {
    id: randomUUID(),
    type: "Investment Assets",
    ticker: "RELIANCE",
    name: "Reliance Industries",
    assetSubType: "Stock",
    sector: "Energy",
    tags: "large-cap",
    purchaseDate: "2026-01-10",
    buyPrice: 125,
    quantity: 2,
    currentPrice: 175,
    brokerageFees: 50,
    purchasePrice: 300,
    value: 350,
    owner: "Dad",
    lotId: "REL-1",
    dividendsReceived: 20,
    taxLotMethod: "FIFO",
    lastUpdated: "2026-07-10",
    currency: "USD",
    exchangeRate: 90,
    ...overrides
  };
}

{
  const values = {
    ticker: "reliance",
    name: "Reliance Industries",
    assetSubType: "Stock",
    purchaseDate: "2026-01-10",
    buyPrice: 125,
    quantity: 2,
    currentPrice: 175,
    brokerageFees: 50,
    owner: "Dad",
    currency: "USD",
    exchangeRate: 90
  };
  calc.applyInvestmentDerivedValues(values);
  assert.strictEqual(values.ticker, "RELIANCE");
  assert.strictEqual(values.currency, "INR");
  assert.strictEqual(values.exchangeRate, 1);
  assert.strictEqual(values.purchasePrice, 300);
  assert.strictEqual(values.value, 350);
}

{
  const snap = calc.investmentSnapshot(investment());
  assert.strictEqual(snap.currency, "INR");
  assert.strictEqual(snap.exchangeRate, 1);
  assert.strictEqual(snap.costBasisInr, 300);
  assert.strictEqual(snap.currentValueInr, 350);
  assert.strictEqual(snap.averageBuyPrice, 150);
  assert.strictEqual(snap.unrealizedGainInr, 50);
  assert.strictEqual(snap.dividendsInr, 20);
  assert.strictEqual(snap.totalReturnInr, 70);
  assert.strictEqual(snap.roi, 23.3);
}

{
  const summary = calc.investmentPortfolioSummary([
    investment(),
    investment({
      ticker: "NIFTYBEES",
      name: "Nifty Bees",
      sector: "Index",
      lotId: "NIFTY-1",
      buyPrice: 100,
      quantity: 10,
      currentPrice: 110,
      brokerageFees: 0,
      purchasePrice: 1000,
      value: 1100,
      dividendsReceived: 0
    })
  ]);
  assert.strictEqual(summary.costBasis, 1300);
  assert.strictEqual(summary.currentValue, 1450);
  assert.strictEqual(summary.unrealizedGain, 150);
  assert.strictEqual(summary.dividends, 20);
  assert.strictEqual(summary.totalReturn, 170);
}

{
  const lotOne = investment({
    ticker: "ABC",
    name: "ABC",
    buyPrice: 10,
    quantity: 10,
    currentPrice: 15,
    brokerageFees: 0,
    purchasePrice: 100,
    value: 150,
    owner: "Dad",
    lotId: "ABC-OLD",
    purchaseDate: "2025-01-01",
    dividendsReceived: 0
  });
  const lotTwo = investment({
    ticker: "ABC",
    name: "ABC",
    buyPrice: 20,
    quantity: 5,
    currentPrice: 15,
    brokerageFees: 0,
    purchasePrice: 100,
    value: 75,
    owner: "Dad",
    lotId: "ABC-NEW",
    purchaseDate: "2026-01-01",
    dividendsReceived: 0
  });
  const state = calc.__setStateForTests({ assets: [lotOne, lotTwo] });
  const result = calc.allocateInvestmentSale(state.assets[0], 4, 15, "2026-07-10");
  assert.strictEqual(result.method, "FIFO");
  assert.strictEqual(result.proceeds, 60);
  assert.strictEqual(result.costRemoved, 40);
  assert.strictEqual(result.realizedGain, 20);
  assert.deepStrictEqual(result.allocations.map(row => [row.lotId, row.quantity, row.costBasis]), [["ABC-OLD", 4, 40]]);
  assert.strictEqual(calc.__getStateForTests().assets[0].quantity, 6);
  assert.strictEqual(calc.__getStateForTests().assets[0].purchasePrice, 60);
}

{
  const headers = calc.investmentCsvHeader();
  assert(headers.includes("Ticker"));
  assert(!headers.includes("Currency"));
  assert(!headers.includes("INR Exchange Rate"));
  assert(!calc.investmentReportHeader().includes("FX to INR"));
  assert(!calc.investmentPriceHistoryHeader().includes("INR Exchange Rate"));
}

{
  const seen = new Set();
  const values = {
    ticker: "NIFTYBEES",
    name: "Nifty Bees",
    purchaseDate: "2026-01-10",
    buyPrice: 100,
    quantity: 5,
    currentPrice: 105,
    owner: "Dad",
    lotId: "NIFTY-IMPORT"
  };
  calc.__setStateForTests({ assets: [] });
  const error = calc.validateInvestmentImportValues(values, 2, seen);
  assert.strictEqual(error, "");
  assert.strictEqual(values.currency, "INR");
  assert.strictEqual(values.exchangeRate, 1);
}

{
  const asset = investment({
    ticker: "TCS",
    name: "TCS",
    quantity: 3,
    currentPrice: 100,
    value: 300,
    currency: "USD",
    exchangeRate: 84,
    valueHistory: []
  });
  const result = calc.updateInvestmentPrice(asset, 125, "2026-07-11", "Manual price update");
  assert.deepStrictEqual(result, { value: 375, currentPrice: 125 });
  assert.strictEqual(asset.currency, "INR");
  assert.strictEqual(asset.exchangeRate, 1);
  assert.strictEqual(asset.value, 375);
  assert.strictEqual(asset.valueHistory.length, 1);
  assert.strictEqual(asset.valueHistory[0].date, "2026-07-11");
}

{
  const oldCurrencyLot = investment({
    ticker: "XYZ",
    owner: "Dad",
    currency: "USD",
    exchangeRate: 84,
    lotId: "XYZ-OLD",
    buyPrice: 10,
    quantity: 2,
    currentPrice: 20,
    purchasePrice: 20,
    value: 40
  });
  const inrLot = investment({
    ticker: "XYZ",
    owner: "Dad",
    currency: "INR",
    exchangeRate: 1,
    lotId: "XYZ-INR",
    buyPrice: 12,
    quantity: 3,
    currentPrice: 20,
    purchasePrice: 36,
    value: 60
  });
  const state = calc.__setStateForTests({ assets: [oldCurrencyLot, inrLot] });
  assert.strictEqual(calc.matchingInvestmentLots(state.assets[0]).length, 2);
}

{
  const alpha = investment({
    ticker: "ALPHA",
    name: "Alpha Fund",
    owner: "Mom",
    currentPrice: 100,
    quantity: 10,
    buyPrice: 90,
    purchasePrice: 900,
    value: 1000,
    lastUpdated: "2026-06-01",
    lotId: "ALPHA"
  });
  const beta = investment({
    ticker: "BETA",
    name: "Beta Stock",
    owner: "Dad",
    currentPrice: 50,
    quantity: 4,
    buyPrice: 100,
    purchasePrice: 400,
    value: 200,
    lastUpdated: "2026-07-01",
    lotId: "BETA"
  });
  const gamma = investment({
    ticker: "GAMMA",
    name: "Gamma ETF",
    owner: "Dad",
    currentPrice: 120,
    quantity: 5,
    buyPrice: 80,
    purchasePrice: 400,
    value: 600,
    lastUpdated: "2026-07-11",
    lotId: "GAMMA"
  });
  const rows = [beta, gamma, alpha];
  assert.deepStrictEqual(calc.sortedInvestmentHoldings(rows, "value").map(item => item.ticker), ["ALPHA", "GAMMA", "BETA"]);
  assert.deepStrictEqual(calc.sortedInvestmentHoldings(rows, "return").map(item => item.ticker), ["GAMMA", "ALPHA", "BETA"]);
  assert.deepStrictEqual(calc.sortedInvestmentHoldings(rows, "roi").map(item => item.ticker), ["GAMMA", "ALPHA", "BETA"]);
  assert.deepStrictEqual(calc.sortedInvestmentHoldings(rows, "ticker").map(item => item.ticker), ["ALPHA", "BETA", "GAMMA"]);
  assert.deepStrictEqual(calc.sortedInvestmentHoldings(rows, "owner").map(item => item.ticker), ["BETA", "GAMMA", "ALPHA"]);
  assert.deepStrictEqual(calc.sortedInvestmentHoldings(rows, "newest").map(item => item.ticker), ["GAMMA", "BETA", "ALPHA"]);
}

{
  const rows = [
    investment({ ticker: "A", owner: "Dad", assetSubType: "Stock", sector: "Banking", lotId: "A" }),
    investment({ ticker: "B", owner: "Mom", assetSubType: "Mutual Fund", sector: "Index", lotId: "B" }),
    investment({ ticker: "C", owner: "Dad", assetSubType: "ETF", sector: "Index", lotId: "C" })
  ];
  assert.deepStrictEqual(calc.filterInvestmentHoldings(rows, { owner: "Dad", type: "all", sector: "all" }).map(item => item.ticker), ["A", "C"]);
  assert.deepStrictEqual(calc.filterInvestmentHoldings(rows, { owner: "all", type: "Mutual Fund", sector: "all" }).map(item => item.ticker), ["B"]);
  assert.deepStrictEqual(calc.filterInvestmentHoldings(rows, { owner: "all", type: "all", sector: "Index" }).map(item => item.ticker), ["B", "C"]);
  assert.deepStrictEqual(calc.filterInvestmentHoldings(rows, { owner: "Dad", type: "ETF", sector: "Index" }).map(item => item.ticker), ["C"]);
}

{
  const lotOne = investment({
    ticker: "SPLIT",
    name: "Split Co",
    owner: "Dad",
    lotId: "SPLIT-1",
    buyPrice: 100,
    currentPrice: 150,
    quantity: 10,
    purchasePrice: 1000,
    value: 1500,
    valueHistory: []
  });
  const lotTwo = investment({
    ticker: "SPLIT",
    name: "Split Co",
    owner: "Dad",
    lotId: "SPLIT-2",
    buyPrice: 120,
    currentPrice: 150,
    quantity: 5,
    purchasePrice: 600,
    value: 750,
    valueHistory: []
  });
  const otherOwner = investment({
    ticker: "SPLIT",
    name: "Split Co",
    owner: "Mom",
    lotId: "SPLIT-MOM",
    buyPrice: 100,
    currentPrice: 150,
    quantity: 1,
    purchasePrice: 100,
    value: 150
  });
  const state = calc.__setStateForTests({ assets: [lotOne, lotTwo, otherOwner] });
  const before = state.assets[0].value + state.assets[1].value;
  const result = calc.applyInvestmentSplitToLots(state.assets[0], "2:1", "2026-07-12");
  assert.strictEqual(result.updated, 2);
  assert.strictEqual(result.valueBefore, before);
  assert.strictEqual(result.valueAfter, before);
  assert.strictEqual(state.assets[0].quantity, 20);
  assert.strictEqual(state.assets[0].buyPrice, 50);
  assert.strictEqual(state.assets[0].currentPrice, 75);
  assert.strictEqual(state.assets[1].quantity, 10);
  assert.strictEqual(state.assets[1].buyPrice, 60);
  assert.strictEqual(state.assets[1].currentPrice, 75);
  assert.strictEqual(state.assets[2].quantity, 1);
  assert.strictEqual(state.assets[0].investmentTransactions.at(-1).type, "Split");
  assert.strictEqual(state.assets[1].valueHistory.at(-1).note, "2:1 split");
}

{
  const asset = investment({
    ticker: "HISTORY",
    name: "History Fund",
    valueHistory: [
      { id: randomUUID(), date: "2025-12-31", value: 1000 },
      { id: randomUUID(), date: "2026-01-10", value: 1100 },
      { id: randomUUID(), date: "2026-06-01", value: 1200 },
      { id: randomUUID(), date: "2026-07-05", value: 1300 },
      { id: randomUUID(), date: "2026-07-12", value: 1400 }
    ]
  });
  const today = new Date("2026-07-12T00:00:00Z");
  assert.strictEqual(calc.investmentHistoryRangeStart("1M", today), "2026-06-12");
  assert.strictEqual(calc.investmentHistoryRangeStart("YTD", today), "2026-01-01");
  assert.strictEqual(calc.investmentHistoryRangeStart("ALL", today), "");
  assert.deepStrictEqual(calc.investmentPortfolioHistory([asset], "1M", today).map(point => point.date), ["2026-07-05", "2026-07-12"]);
  assert.deepStrictEqual(calc.investmentPortfolioHistory([asset], "YTD", today).map(point => point.date), ["2026-01-10", "2026-06-01", "2026-07-05", "2026-07-12"]);
  assert.deepStrictEqual(calc.investmentPortfolioHistory([asset], "ALL", today).map(point => point.date), ["2025-12-31", "2026-01-10", "2026-06-01", "2026-07-05", "2026-07-12"]);
}

{
  const estimate = calc.usedCarValuation({
    type: "Car",
    name: "Nissan Magnite",
    purchasePrice: 1200000,
    year: 2025,
    odometer: 6000,
    ownerCount: 1,
    condition: "Good",
    demand: "Normal"
  });
  assert.strictEqual(estimate.value, 920000);
  assert.strictEqual(estimate.engineJson.adjustments.age_depreciation_multiplier, 0.8);
  assert.strictEqual(estimate.engineJson.adjustments.mileage_adjustment_percent, 1);
  assert.strictEqual(estimate.engineJson.adjustments.ownership_adjustment_percent, 0);
  assert.strictEqual(estimate.engineJson.adjustments.condition_multiplier, 0.95);
  assert.strictEqual(estimate.engineJson.adjustments.demand_multiplier, 1);
}

{
  const estimate = calc.usedCarValuation({
    original_price: 1000000,
    year: 2023,
    mileageKm: 61000,
    ownerCount: 2,
    condition: "Fair",
    demand: "Low"
  });
  assert.strictEqual(estimate.engineJson.inputs.age_years, 3);
  assert.strictEqual(estimate.engineJson.adjustments.age_depreciation_multiplier, 0.648);
  assert.strictEqual(estimate.engineJson.adjustments.mileage_adjustment_percent, -5);
  assert.strictEqual(estimate.engineJson.adjustments.ownership_adjustment_percent, -8);
  assert.strictEqual(estimate.engineJson.adjustments.condition_multiplier, 0.85);
  assert.strictEqual(estimate.engineJson.adjustments.demand_multiplier, 0.9);
  assert.strictEqual(estimate.value, 430000);
}

{
  assert.strictEqual(calc.assetCategoryForAsset({
    type: "Land",
    name: "Dads property",
    location: "Pune - Ravet",
    value: 17900000
  }), "land");
  assert.strictEqual(calc.assetCategoryForAsset({
    type: "Flats",
    name: "Home property",
    location: "Pune",
    value: 17900000
  }), "flats");
}

console.log("Investment and vehicle calculations OK");
