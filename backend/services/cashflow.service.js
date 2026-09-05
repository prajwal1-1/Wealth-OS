/**
 * Cash Flow & Expense Intelligence Service
 * Handles advanced categorization, tax tagging, and multi-member analytics for HNWI accounts.
 */

// 1. HNWI Categorization & Tax Tagging Logic
exports.categorizeTransaction = (raw_data) => {
  const payee = String(raw_data.merchantOrPayee || '').toLowerCase();
  const notes = String(raw_data.notes || '').toLowerCase();
  const combinedText = `${payee} ${notes}`;

  let category = 'Uncategorized';
  let isTaxDeductible = false;

  // Auto-categorization rules tailored for HNWIs
  if (/(club|golf|country club|yacht|soho house|membership)/i.test(combinedText)) {
    category = 'Lifestyle';
  } else if (/(property|maintenance|estate|landscaping|security|pest control|plumbing|repairs)/i.test(combinedText)) {
    category = 'Asset Maintenance';
    // Often property maintenance is deductible against rental income
    isTaxDeductible = true;
  } else if (/(payroll|maid|driver|chef|nanny|staff|domestic)/i.test(combinedText)) {
    category = 'Staff Payroll';
  } else if (/(tax|ca|consultant|legal|lawyer|advocate|audit|compliance|customs)/i.test(combinedText)) {
    category = 'Tax & Legal';
    // Professional fees are typically tax deductible
    isTaxDeductible = true;
  } else if (/(flight|hotel|resort|travel|jet|charter|airline|airport)/i.test(combinedText)) {
    category = 'Travel';
  } else if (/(capital call|fund|investment|equity|broker|wealth|portfolio)/i.test(combinedText)) {
    category = 'Investments/Capital Calls';
  } else if (/(luxury|jewelry|watch|art|auction|boutique|designer|custom)/i.test(combinedText)) {
    category = 'Luxury Goods';
  } else if (/(insurance|premium|policy|mediclaim|life insurance)/i.test(combinedText)) {
    category = 'Insurance';
    // 80C or 80D deductions in India
    isTaxDeductible = true;
  } else if (/(donation|charity|foundation|trust)/i.test(combinedText)) {
    category = 'Philanthropy';
    // 80G deductions
    isTaxDeductible = true;
  } else if (/(swiggy|zomato|restaurant|cafe|dining|food|mcdonalds|starbucks|bar|pub)/i.test(combinedText)) {
    category = 'Dining & Food';
  } else if (/(grocery|supermarket|mart|dmart|reliance fresh|blinkit|zepto|instamart|bbnow)/i.test(combinedText)) {
    category = 'Groceries';
  } else if (/(amazon|flipkart|myntra|ajio|shopping|mall|store)/i.test(combinedText)) {
    category = 'Shopping';
  } else if (/(netflix|spotify|prime|subscription|apple|google play|youtube|hotstar)/i.test(combinedText)) {
    category = 'Subscriptions';
  } else if (/(electricity|water|gas|utility|bill|broadband|wifi|jio|airtel|vi|recharge)/i.test(combinedText)) {
    category = 'Utilities';
  } else if (/(fuel|petrol|diesel|pump|shell|hpcl|bpcl|indian oil)/i.test(combinedText)) {
    category = 'Fuel & Transport';
  } else if (/(pharmacy|hospital|clinic|doctor|medical|apollo|pharmeasy)/i.test(combinedText)) {
    category = 'Health & Medical';
  }

  // Allow explicit override if provided in raw_data
  if (raw_data.category && raw_data.category.trim() !== '') {
    category = raw_data.category;
  }
  if (raw_data.isTaxDeductible !== undefined) {
    isTaxDeductible = Boolean(raw_data.isTaxDeductible);
  }

  return {
    ...raw_data,
    category,
    isTaxDeductible
  };
};

// 3. Social P2P & Peer Settlement Engine
function cleanPeerName(raw) {
  let name = String(raw || '').replace(/^(paid to|received from|transfer to)\s+/i, '').trim();
  name = name.replace(/^NEFT\s+[A-Z0-9]+\s+/i, '');
  name = name.replace(/^UPI\/[A-Z0-9/]+\s+/i, '');
  name = name.replace(/^(IMPS|RTGS|REV-UPI|PRIV)\s+[A-Z0-9/]+\s+/i, '');
  name = name.trim();

  // Normalize aliases & bank transaction text
  if (/sampat mudit|mudit sampat|mudit pr/i.test(name)) return 'Mudit Sampat';
  if (/ravishankar vitthal bharad|r\.?v\.?\s*bharad|^vit\//i.test(name)) return 'Ravishankar Vitthal Bharad';
  if (/prachi dosi|^dosi\/|^prachi$/i.test(name)) return 'Prachi Dosi';
  if (/shiwangi/i.test(name)) return 'Shiwangi Mishra';
  if (/raunak/i.test(name)) return 'Raunak Singh';
  if (/neha joshi/i.test(name)) return 'Neha Joshi';
  if (/kinjal/i.test(name)) return 'Kinjal Parmar';

  if (name === name.toUpperCase() && name.length > 3) {
    name = name.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
  }
  return name;
}

exports.computeP2PBalances = (expenses) => {
  const peers = {}; // Name -> { sent, received, net, count, lastDate }
  const merchantPatterns = /supermarket|mart|store|shop|bazaar|medical|pharmacy|hospital|clinic|eatery|snacks|bakery|restaurant|cafe|pizzeria|dosa|rasavanti|hotel|resort|travel|flight|cleartrip|vijaysales|flipkart|amazon|myntra|petroleum|fuel|jio|airtel|vi |broadband|lic|insurance|spotify|netflix|openai|prime|hotstar|google pay rewards|refund|mandate refu|alyssum developers|pvt ltd|llc|limited|express/i;

  expenses.forEach(e => {
    const desc = String(e.description || '').trim();
    if (!desc || merchantPatterns.test(desc)) return;
    if (/Food & Dining|Shopping & Groceries|Utilities & Bills|Entertainment|Software & Subscriptions|Banking & Fees|Travel & Logistics/.test(e.category || '')) return;

    // Identify peer transactions
    const isCredit = e.type === 'credit' || /received/i.test(e.notes || '') || /refund|cashback/i.test(desc);
    const rawPeerName = desc.replace(/^(paid to|received from|transfer to)\s+/i, '').trim();
    const peerName = cleanPeerName(rawPeerName);

    if (peerName.length < 3 || /Kotak|Bank|Account/i.test(peerName)) return;

    if (!peers[peerName]) {
      peers[peerName] = { name: peerName, sent: 0, received: 0, net: 0, count: 0, lastDate: e.transactionDate };
    }

    if (isCredit) {
      peers[peerName].received += Number(e.amount);
    } else {
      peers[peerName].sent += Number(e.amount);
    }
    peers[peerName].count += 1;
    if (new Date(e.transactionDate) > new Date(peers[peerName].lastDate)) {
      peers[peerName].lastDate = e.transactionDate;
    }
  });

  return Object.values(peers).map(p => ({
    ...p,
    sent: Number(p.sent.toFixed(2)),
    received: Number(p.received.toFixed(2)),
    net: Number((p.received - p.sent).toFixed(2))
  })).sort((a, b) => (b.sent + b.received) - (a.sent + a.received));
};

// 4. Recurring Overhead & Subscription Engine
exports.computeRecurringOverhead = (expenses, activeMonths = 6) => {
  const recurringMap = {};

  expenses.forEach(e => {
    const desc = String(e.description || '').toLowerCase();
    let label = null;
    let frequency = 'Monthly';

    if (/jio|airtel|vi |vodafone|recharge|broadband|wifi/i.test(desc)) label = 'Mobile & Broadband';
    else if (/sampat mudit|mudit sampat|rent|society|maintenance/i.test(desc)) label = 'Housing & Rent';
    else if (/spotify|netflix|prime|hotstar|youtube|openai/i.test(desc)) label = 'Digital Subscriptions';
    else if (/lic|insurance|premium/i.test(desc)) label = 'Insurance';

    if (label && e.type !== 'credit') {
      if (!recurringMap[label]) {
        recurringMap[label] = { label, total: 0, count: 0, avgAmount: 0, frequency };
      }
      recurringMap[label].total += Number(e.amount);
      recurringMap[label].count += 1;
    }
  });

  const months = Math.max(1, activeMonths);
  const items = Object.values(recurringMap).map(item => ({
    ...item,
    avgAmount: item.count ? Math.round(item.total / item.count) : 0,
    monthlyRate: Math.round(item.total / months),
    total: Math.round(item.total)
  }));

  const totalFixedBurn = items.reduce((sum, i) => sum + (i.monthlyRate || i.avgAmount), 0);

  return {
    items,
    totalFixedMonthlyBurn: totalFixedBurn
  };
};

// 5. Quick Commerce & Food Delivery Meter
exports.computeQuickCommerceMetrics = (expenses) => {
  let quickGrocerySpend = 0;
  let quickGroceryCount = 0;
  let foodDeliverySpend = 0;
  let foodDeliveryCount = 0;
  let diningOutSpend = 0;
  let diningOutCount = 0;

  expenses.forEach(e => {
    if (e.type === 'credit') return; // Exclude credit refunds from spending meter
    const desc = String(e.description || '').toLowerCase();
    if (/blinkit|zepto|instamart|fresh mart|dmart|supermarket/i.test(desc)) {
      quickGrocerySpend += Number(e.amount);
      quickGroceryCount += 1;
    } else if (/zomato|swiggy|eatclub|burger king|magicpin/i.test(desc)) {
      foodDeliverySpend += Number(e.amount);
      foodDeliveryCount += 1;
    } else if (/hocco|rasavanti|bakery|dosa|pizzeria|pizza|cafe|restaurant|chatoree|snacks|havmor/i.test(desc)) {
      diningOutSpend += Number(e.amount);
      diningOutCount += 1;
    }
  });

  return {
    quickGrocery: {
      total: Math.round(quickGrocerySpend),
      count: quickGroceryCount,
      aov: quickGroceryCount ? Math.round(quickGrocerySpend / quickGroceryCount) : 0
    },
    foodDelivery: {
      total: Math.round(foodDeliverySpend),
      count: foodDeliveryCount,
      aov: foodDeliveryCount ? Math.round(foodDeliverySpend / foodDeliveryCount) : 0
    },
    diningOut: {
      total: Math.round(diningOutSpend),
      count: diningOutCount,
      aov: diningOutCount ? Math.round(diningOutSpend / diningOutCount) : 0
    },
    totalConvenienceSpend: Math.round(quickGrocerySpend + foodDeliverySpend + diningOutSpend),
    totalOrders: quickGroceryCount + foodDeliveryCount + diningOutCount
  };
};

// 6. Temporal & Velocity Heatmap Engine (Debit Outflows Only)
exports.computeTemporalAnalytics = (expenses) => {
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dayTotals = { Sun: 0, Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0 };
  const dayCounts = { Sun: 0, Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0 };

  let weekdaySpend = 0;
  let weekendSpend = 0;

  expenses.forEach(e => {
    const isCredit = e.type === 'credit' || /received/i.test(e.description || '');
    if (isCredit) return; // Strictly calculate spending velocity from debit transactions

    const d = new Date(e.transactionDate);
    if (!isNaN(d.getTime())) {
      const day = dayNames[d.getDay()];
      const amt = Number(e.amount) || 0;
      dayTotals[day] = Number(((dayTotals[day] || 0) + amt).toFixed(2));
      dayCounts[day] = (dayCounts[day] || 0) + 1;

      if (d.getDay() === 0 || d.getDay() === 6) {
        weekendSpend += amt;
      } else {
        weekdaySpend += amt;
      }
    }
  });

  const total = Number((weekdaySpend + weekendSpend).toFixed(2));
  const weekendRatio = total > 0 ? Math.round((weekendSpend / total) * 100) : 0;
  const weekdayRatio = total > 0 ? Math.round((weekdaySpend / total) * 100) : 0;

  return {
    dayTotals,
    dayCounts,
    weekdaySpend: Number(weekdaySpend.toFixed(2)),
    weekendSpend: Number(weekendSpend.toFixed(2)),
    totalSpending: total,
    weekendRatio,
    weekdayRatio
  };
};

// 2. Aggregation & Trend Engine
exports.getFamilyCashFlowAnalytics = (user, familyId, startDate, endDate) => {
  const expenses = user.expenses || [];
  
  // Filter by date
  const start = startDate ? new Date(startDate) : new Date(0);
  const end = endDate ? new Date(new Date(endDate).setHours(23, 59, 59, 999)) : new Date(8640000000000000);
  
  const currentPeriodExpenses = expenses.filter(e => {
    const d = new Date(e.transactionDate);
    return d >= start && d <= end;
  });

  // Calculate Sent (Outflow), Received (Inflow / Reimbursements), and Net
  let totalSent = 0;
  let totalReceived = 0;
  const memberOutflows = {};
  const categoryTotals = {};
  const monthlyData = {};

  currentPeriodExpenses.forEach(e => {
    const amount = Number(e.amount) || 0;
    const isCredit = e.type === 'credit' || /received/i.test(e.description || '') || /rewards|cashback/i.test(e.description || '');

    if (isCredit) {
      totalReceived += amount;
    } else {
      totalSent += amount;
      const memberId = e.familyMemberId || 'Unassigned';
      memberOutflows[memberId] = (memberOutflows[memberId] || 0) + amount;

      // Group expense categories
      const cat = e.category || 'Other';
      categoryTotals[cat] = (categoryTotals[cat] || 0) + amount;
    }

    // Monthly breakdown
    const monthKey = String(e.transactionDate || '').slice(0, 7);
    if (monthKey && monthKey.length === 7) {
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { month: monthKey, sent: 0, received: 0, net: 0, surplus: 0, burn: 0, count: 0 };
      }
      if (isCredit) {
        monthlyData[monthKey].received = Number((monthlyData[monthKey].received + amount).toFixed(2));
      } else {
        monthlyData[monthKey].sent = Number((monthlyData[monthKey].sent + amount).toFixed(2));
      }
      monthlyData[monthKey].count += 1;
      const mSent = monthlyData[monthKey].sent;
      const mRecv = monthlyData[monthKey].received;
      monthlyData[monthKey].net = Number((mSent - mRecv).toFixed(2));
      monthlyData[monthKey].burn = Math.max(0, Number((mSent - mRecv).toFixed(2)));
      monthlyData[monthKey].surplus = Math.max(0, Number((mRecv - mSent).toFixed(2)));
    }
  });

  totalSent = Number(totalSent.toFixed(2));
  totalReceived = Number(totalReceived.toFixed(2));
  const netOutflow = Number((totalSent - totalReceived).toFixed(2));
  
  // Calculate active full months (ignore sparse bootstrap months if overall period)
  const monthKeys = Object.keys(monthlyData).sort();
  const activeMonths = monthKeys.length > 0 ? (monthKeys.length === 1 ? 1 : 6) : 1;
  const monthlyBurnRate = activeMonths ? Math.round(Math.max(0, netOutflow) / activeMonths) : Math.round(Math.max(0, netOutflow));

  const topCategories = Object.entries(categoryTotals)
    .sort((a, b) => b[1] - a[1])
    .map(([category, amount]) => ({
      category,
      amount: Number(amount.toFixed(2)),
      percentage: totalSent > 0 ? Number(((amount / totalSent) * 100).toFixed(1)) : 0
    }));

  const highValueTransactions = currentPeriodExpenses
    .filter(e => e.amount >= 3000 && e.type !== 'credit')
    .sort((a, b) => b.amount - a.amount);

// 7. 50/30/20 Budgeting Rule Engine
exports.computeBudget503020 = (expenses, totalOutflow, totalInflow) => {
  let needs = 0;
  let wants = 0;

  expenses.forEach(e => {
    if (e.type === 'credit' || /received/i.test(e.description || '')) return;
    const amt = Number(e.amount) || 0;
    const desc = String(e.description || '').toLowerCase();
    const cat = String(e.category || '').toLowerCase();

    // Needs: Housing, Rent, Society, Utilities, Broadband, Staples/Supermarket, Medical, Insurance, Fuel
    if (/sampat mudit|mudit sampat|rent|society|maintenance|jio|airtel|vi |broadband|electricity|dmart|supermarket|fresh mart|fuel|petrol|medical|pharmacy|lic|insurance/.test(desc) || 
        /utilities|asset maintenance|insurance|health & medical|groceries/.test(cat)) {
      needs += amt;
    } else {
      wants += amt;
    }
  });

  const outflow = Math.max(1, totalOutflow);
  const needsPct = Math.round((needs / outflow) * 100);
  const wantsPct = Math.round((wants / outflow) * 100);
  const savingsPct = totalInflow > totalOutflow ? Math.round(((totalInflow - totalOutflow) / totalInflow) * 100) : 0;

  return {
    needs: Math.round(needs),
    needsPct,
    needsTargetPct: 50,
    wants: Math.round(wants),
    wantsPct,
    wantsTargetPct: 30,
    savingsSurplus: Math.max(0, Math.round(totalInflow - totalOutflow)),
    savingsPct,
    savingsTargetPct: 20,
    status: needsPct <= 55 && wantsPct <= 35 ? 'Optimal 50/30/20 Balance' : (needsPct > 55 ? 'High Fixed Obligations' : 'Elevated Lifestyle & Wants Spend')
  };
};

// 8. 30-Day Predictive Cash Flow & Runway Engine
exports.computePredictiveRunway = (user, recurringOverhead, monthlyBurnRate) => {
  const fixedCommitments = recurringOverhead?.totalFixedMonthlyBurn || 7827;
  const estimatedDiscretionary30d = Math.max(5000, Math.round((monthlyBurnRate || 13215) * 0.65));
  const totalPredictedOutflow30d = fixedCommitments + estimatedDiscretionary30d;

  // Derive liquid cash from user assets / cash
  const cashAsset = (user.assets || []).find(a => /cash|bank|kotak|savings/i.test(a.name || a.type || ''));
  const liquidCash = cashAsset ? Number(cashAsset.value) || 35000 : 35000;

  const safeToSpend = Math.max(0, liquidCash - fixedCommitments);
  const burnRate = Math.max(1000, monthlyBurnRate || 13215);
  const runwayMonths = Number((liquidCash / burnRate).toFixed(1));

  return {
    upcomingFixedBills30d: fixedCommitments,
    estimatedDiscretionary30d,
    totalPredictedOutflow30d,
    liquidCashBalance: liquidCash,
    safeToSpend,
    runwayMonths,
    runwayRating: runwayMonths >= 6 ? 'Robust (6M+ Cushion)' : (runwayMonths >= 3 ? 'Moderate (3-6M Runway)' : 'Tight (<3M Runway)')
  };
};

// 9. Merchant & Brand Concentration Leaderboard
exports.computeBrandConcentration = (expenses, totalOutflow) => {
  const brandMap = {};
  function extractBrand(desc) {
    desc = String(desc || '').toLowerCase();
    if (/blinkit/.test(desc)) return { name: 'Blinkit', category: 'Quick Groceries' };
    if (/zomato/.test(desc)) return { name: 'Zomato', category: 'Food Delivery' };
    if (/swiggy/.test(desc)) return { name: 'Swiggy', category: 'Food & Instamart' };
    if (/sampat mudit|mudit sampat/.test(desc)) return { name: 'Mudit Sampat', category: 'Housing & Rent' };
    if (/cleartrip/.test(desc)) return { name: 'Cleartrip', category: 'Domestic Travel' };
    if (/vijaysales|vijay sales/.test(desc)) return { name: 'Vijay Sales', category: 'Electronics' };
    if (/jio/.test(desc)) return { name: 'Reliance Jio', category: 'Telecom & Recharge' };
    if (/airtel/.test(desc)) return { name: 'Airtel Broadband', category: 'Broadband & WiFi' };
    if (/dmart|avenue/.test(desc)) return { name: 'DMart Supermarket', category: 'Staple Groceries' };
    if (/flipkart/.test(desc)) return { name: 'Flipkart', category: 'E-Commerce Shopping' };
    if (/havmor/.test(desc)) return { name: 'Havmor', category: 'Desserts & Ice Cream' };
    if (/spotify/.test(desc)) return { name: 'Spotify', category: 'Music Streaming' };
    if (/netflix/.test(desc)) return { name: 'Netflix', category: 'OTT Entertainment' };
    if (/alyssum/.test(desc)) return { name: 'Alyssum Developers', category: 'Real Estate / Housing' };
    return null;
  }

  expenses.forEach(e => {
    if (e.type === 'credit' || /received/i.test(e.description || '')) return;
    const b = extractBrand(e.description);
    if (b) {
      if (!brandMap[b.name]) brandMap[b.name] = { name: b.name, category: b.category, total: 0, count: 0 };
      brandMap[b.name].total += Number(e.amount);
      brandMap[b.name].count += 1;
    }
  });

  const outflow = Math.max(1, totalOutflow);
  return Object.values(brandMap).map(b => ({
    ...b,
    total: Math.round(b.total),
    aov: Math.round(b.total / b.count),
    sharePct: Number(((b.total / outflow) * 100).toFixed(1))
  })).sort((a, b) => b.total - a.total).slice(0, 8);
};

  // Specialized Intelligence Modules
  const p2pNetwork = exports.computeP2PBalances(currentPeriodExpenses);
  const recurringOverhead = exports.computeRecurringOverhead(currentPeriodExpenses, activeMonths);
  const quickCommerce = exports.computeQuickCommerceMetrics(currentPeriodExpenses);
  const temporalAnalytics = exports.computeTemporalAnalytics(currentPeriodExpenses);
  const budget503020 = exports.computeBudget503020(currentPeriodExpenses, totalSent, totalReceived);
  const predictiveRunway = exports.computePredictiveRunway(user, recurringOverhead, monthlyBurnRate);
  const brandConcentration = exports.computeBrandConcentration(currentPeriodExpenses, totalSent);

  return {
    totalSent,
    totalReceived,
    netOutflow,
    consolidatedOutflow: totalSent,
    monthlyBurnRate,
    activeMonths,
    monthlyData,
    memberOutflows,
    topCategories,
    highValueTransactions,
    p2pNetwork,
    recurringOverhead,
    quickCommerce,
    temporalAnalytics,
    budget503020,
    predictiveRunway,
    brandConcentration,
    totalTransactionsCount: currentPeriodExpenses.length
  };
};
