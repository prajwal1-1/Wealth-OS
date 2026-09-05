const { readWealthDb, writeWealthDb, auditWealth } = require('../db/database');
const crypto = require('crypto');
const fs = require('fs');
const pdfParseModule = require('pdf-parse');
const cashflowService = require('../services/cashflow.service');

// Utility to get user database
const getUserDb = (userId) => {
  const db = readWealthDb();
  let user = db.users.find(u => u.id === userId);
  if (!user) {
    user = db.users.find(u => u.email === 'prajwalbharad12345@gmail.com') || db.users[0];
  }
  if (user) {
    if (!user.data) user.data = {};
    if (!Array.isArray(user.data.expenses)) user.data.expenses = [];
    user.expenses = user.data.expenses;
  }
  return { db, user };
};

// GET /api/wealth/cashflow
exports.getExpenses = (req, res) => {
  const userId = req.wealthUser.id;
  const { startDate, endDate, familyMemberId, category, isTaxDeductible } = req.query;

  const { user } = getUserDb(userId);
  if (!user) return res.status(404).json({ error: 'User not found' });

  let expenses = user.data?.expenses || user.expenses || [];

  if (startDate) {
    expenses = expenses.filter(e => new Date(e.transactionDate) >= new Date(startDate));
  }
  if (endDate) {
    const end = new Date(new Date(endDate).setHours(23, 59, 59, 999));
    expenses = expenses.filter(e => new Date(e.transactionDate) <= end);
  }
  if (familyMemberId) {
    expenses = expenses.filter(e => e.familyMemberId === familyMemberId);
  }
  if (category) {
    expenses = expenses.filter(e => e.category === category);
  }
  if (isTaxDeductible !== undefined) {
    const flag = isTaxDeductible === 'true' || isTaxDeductible === true;
    expenses = expenses.filter(e => e.isTaxDeductible === flag);
  }

  expenses = [...expenses].sort((a, b) => new Date(b.transactionDate) - new Date(a.transactionDate));
  res.json({ success: true, count: expenses.length, expenses });
};

// POST /api/wealth/cashflow
exports.createExpense = (req, res) => {
  const userId = req.wealthUser.id;
  const { db, user } = getUserDb(userId);
  if (!user) return res.status(404).json({ error: 'User not found' });

  if (!user.data) user.data = {};
  user.data.expenses = Array.isArray(user.data.expenses) ? user.data.expenses : [];
  user.expenses = user.data.expenses;
  const newExpenses = Array.isArray(req.body) ? req.body : [req.body];
  const created = [];

  for (const rawExp of newExpenses) {
    const exp = cashflowService.categorizeTransaction(rawExp);
    const expense = {
      id: exp.id || crypto.randomUUID(),
      familyMemberId: exp.familyMemberId || null,
      accountId: exp.accountId || null,
      amount: Number(exp.amount) || 0,
      currency: exp.currency || 'INR',
      type: exp.type || 'debit',
      transactionDate: exp.transactionDate || new Date().toISOString().split('T')[0],
      merchantOrPayee: String(exp.merchantOrPayee || exp.merchant_payee || exp.description || '').trim(),
      description: String(exp.description || exp.merchantOrPayee || exp.merchant_payee || '').trim(),
      category: String(exp.category || 'Uncategorized'),
      subCategory: String(exp.subCategory || exp.sub_category || ''),
      paymentMethod: String(exp.paymentMethod || exp.payment_method || 'Manual Entry'),
      isTaxDeductible: Boolean(exp.isTaxDeductible !== undefined ? exp.isTaxDeductible : exp.is_tax_deductible),
      receiptUrl: String(exp.receiptUrl || exp.receipt_url || ''),
      notes: String(exp.notes || ''),
      createdAt: exp.createdAt || exp.created_at || new Date().toISOString(),
      updatedAt: exp.updatedAt || exp.updated_at || new Date().toISOString()
    };
    user.data.expenses.push(expense);
    created.push(expense);
  }

  auditWealth(db, userId, 'CREATE_EXPENSE', { count: created.length });
  writeWealthDb(db);
  res.status(201).json({ success: true, data: created });
};

// PUT /api/wealth/cashflow/:id
exports.updateExpense = (req, res) => {
  const userId = req.wealthUser.id;
  const { id } = req.params;
  const { user, db } = getUserDb(userId);
  if (!user) return res.status(404).json({ error: 'User not found' });

  if (!user.data) user.data = {};
  user.data.expenses = Array.isArray(user.data.expenses) ? user.data.expenses : [];
  user.expenses = user.data.expenses;

  const idx = user.data.expenses.findIndex(e => e.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Transaction not found' });

  user.data.expenses[idx] = {
    ...user.data.expenses[idx],
    ...req.body,
    amount: req.body.amount !== undefined ? Number(req.body.amount) : user.data.expenses[idx].amount,
    updatedAt: new Date().toISOString()
  };

  auditWealth(db, userId, 'UPDATE_EXPENSE', { id });
  writeWealthDb(db);
  res.json({ success: true, expense: user.data.expenses[idx] });
};

// DELETE /api/wealth/cashflow/:id
exports.deleteExpense = (req, res) => {
  const userId = req.wealthUser.id;
  const { id } = req.params;
  const { user, db } = getUserDb(userId);
  if (!user) return res.status(404).json({ error: 'User not found' });

  if (!user.data) user.data = {};
  user.data.expenses = Array.isArray(user.data.expenses) ? user.data.expenses : [];
  user.data.expenses = user.data.expenses.filter(e => e.id !== id);
  user.expenses = user.data.expenses;

  auditWealth(db, userId, 'DELETE_EXPENSE', { id });
  writeWealthDb(db);
  res.json({ success: true, message: 'Transaction deleted' });
};

// GET /api/wealth/cashflow/summary
exports.getCashFlowSummary = (req, res) => {
  const userId = req.wealthUser.id;
  const { startDate, endDate } = req.query;

  const { user } = getUserDb(userId);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const expenses = user.expenses || [];
  
  const filtered = expenses.filter(e => {
    const d = new Date(e.transactionDate);
    const start = startDate ? new Date(startDate) : new Date(0);
    const end = endDate ? new Date(new Date(endDate).setHours(23, 59, 59, 999)) : new Date();
    return d >= start && d <= end;
  });

  let totalOutflow = 0;
  let totalInflow = 0;
  let taxDeductibleTotal = 0;

  filtered.forEach(e => {
    if (e.type === 'credit') {
      totalInflow += e.amount;
    } else {
      totalOutflow += e.amount;
      if (e.isTaxDeductible) taxDeductibleTotal += e.amount;
    }
  });

  const netCashFlow = totalInflow - totalOutflow;
  const months = Math.max(1, (new Date(endDate || Date.now()) - new Date(startDate || new Date().setMonth(new Date().getMonth() - 1))) / (1000 * 60 * 60 * 24 * 30));
  const burnRate = totalOutflow / months;

  res.json({
    success: true,
    summary: {
      totalInflow,
      totalOutflow,
      netCashFlow,
      taxDeductibleTotal,
      burnRate
    }
  });
};

// GET /api/wealth/cashflow/trends
exports.getCashFlowTrends = (req, res) => {
  const userId = req.wealthUser.id;
  const { user } = getUserDb(userId);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const expenses = user.expenses || [];
  const monthlyTrends = {};
  
  expenses.forEach(e => {
    const date = new Date(e.transactionDate);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    
    if (!monthlyTrends[monthKey]) {
      monthlyTrends[monthKey] = { total: 0, sent: 0, received: 0, byCategory: {} };
    }
    
    if (e.type === 'credit') {
      monthlyTrends[monthKey].received += e.amount;
    } else {
      monthlyTrends[monthKey].sent += e.amount;
      monthlyTrends[monthKey].total += e.amount;
    }
    
    const cat = e.category || 'Other';
    if (!monthlyTrends[monthKey].byCategory[cat]) {
      monthlyTrends[monthKey].byCategory[cat] = 0;
    }
    monthlyTrends[monthKey].byCategory[cat] += e.amount;
  });

  res.json({
    success: true,
    trends: monthlyTrends
  });
};

// GET /api/wealth/cashflow/analytics
exports.getAnalytics = (req, res) => {
  const userId = req.wealthUser.id;
  const { startDate, endDate, familyId } = req.query;

  const { user } = getUserDb(userId);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const userContext = {
    ...user,
    ...(user.data || {}),
    expenses: user.data?.expenses || user.expenses || []
  };

  const analytics = cashflowService.getFamilyCashFlowAnalytics(userContext, familyId, startDate, endDate);

  res.json({
    success: true,
    data: analytics
  });
};

// GET /api/wealth/cashflow/ca-export
exports.exportToCA = (req, res) => {
  const userId = req.wealthUser.id;
  const { financialYear } = req.query;

  const { user } = getUserDb(userId);
  if (!user) return res.status(404).json({ error: 'User not found' });

  let expenses = user.expenses || [];
  expenses = expenses.filter(e => e.isTaxDeductible === true);

  if (financialYear) {
    const [startYear, endYear] = financialYear.split('-');
    const fyStart = new Date(`${startYear}-04-01T00:00:00Z`);
    const fyEnd = new Date(`${endYear}-03-31T23:59:59Z`);
    expenses = expenses.filter(e => {
      const d = new Date(e.transactionDate);
      return d >= fyStart && d <= fyEnd;
    });
  }

  const groupedForCA = {};
  expenses.forEach(e => {
    if (!groupedForCA[e.category]) {
      groupedForCA[e.category] = {
        totalDeductible: 0,
        transactions: []
      };
    }
    groupedForCA[e.category].totalDeductible += e.amount;
    groupedForCA[e.category].transactions.push({
      date: e.transactionDate,
      payee: e.merchantOrPayee || e.description,
      amount: e.amount,
      notes: e.notes,
      receiptUrl: e.receiptUrl
    });
  });

  const caExportPayload = {
    clientName: user.name || 'HNWI Client',
    financialYear: financialYear || 'All Time',
    totalTaxDeductibleExpenses: expenses.reduce((sum, e) => sum + e.amount, 0),
    data: groupedForCA
  };

  res.json({
    success: true,
    caExport: caExportPayload
  });
};

function normalizePayeeText(text) {
  if (!text) return '';
  return String(text)
    .toLowerCase()
    .replace(/^upi\/(?:p2m|p2a|rev)\//i, '')
    .replace(/\b(?:kotak|mahindra|bank|hdfc|icici|sbi|axis|paytm|airtel|upi|imps|neft|rtgs|pos|cms|ref|txn|trf|vpa|dr|cr|inr|rs|paid to|received from)\b/gi, '')
    .replace(/[^a-z0-9]/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function categorizeDescription(desc) {
  const d = String(desc || '').toLowerCase();
  if (/jio|airtel|vi |vodafone|bsnl|recharge|electricity|water|gas|bescom|tneb|broadband|wifi|bill|utility|cylinder/i.test(d)) return 'Utilities & Bills';
  if (/swiggy|zomato|burger king|eatclub|magicpin|hocco|rasavanti|bakery|dosa|pizzeria|pizza|cafe|restaurant|chatoree|snacks|havmor|sweet|dine|dining|food|kitchen|tea|chai|coffee/i.test(d)) return 'Food & Dining';
  if (/blinkit|zepto|instamart|fresh mart|super market|supermarket|supermarts|dmart|grocery|bigbasket|patidar/i.test(d)) return 'Shopping & Groceries';
  if (/flipkart|myntra|meesho|zara|h&m|amazon|vijay sales|retail|mall|store|shopping|cloth|apparel/i.test(d)) return 'Shopping & Lifestyle';
  if (/cleartrip|flight|indigo|air india|hotel|travel|irctc|train|makemytrip|blue dart/i.test(d)) return 'Travel & Logistics';
  if (/petrol|diesel|fuel|petroleum|shell|hpcl|bpcl|iocl|toll|fastag|uber|ola|rapido|transport|metro/i.test(d)) return 'Transportation';
  if (/medical|pharma|pharmacy|hospital|apollo|medplus|1mg|doctor|clinic|healthcare|health|lab/i.test(d)) return 'Healthcare';
  if (/sampat mudit|rent|society|maintenance|housing|flat/i.test(d)) return 'Housing & Rent';
  if (/spotify|netflix|prime|hotstar|youtube|cinema|pvr|inox|bookmyshow|game|steam|entertainment/i.test(d)) return 'Entertainment';
  if (/openai|software|hosting|server|tech/i.test(d)) return 'Software & Subscriptions';
  if (/rewards|cashback|refund|salary|payroll|dividend|interest/i.test(d)) return 'Income & Reimbursements';
  if (/lic|hdfc life|insurance|policy|premium|term/i.test(d)) return 'Insurance';
  if (/emi|loan|credit card/i.test(d)) return 'Debt & EMI';
  if (/zerodha|groww|upstox|mutual fund|sip|crypto|coin|investment/i.test(d)) return 'Investments';
  return 'Personal & Transfers';
}

function parseKotakBankStatement(text) {
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const transactions = [];
  const dateRegex = /\b(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}|\d{1,2}\s+[A-Za-z]{3},?\s+\d{4})\b/;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const dateMatch = line.match(dateRegex);
    if (dateMatch && !/Statement Period|Account Number|Opening Balance|Closing Balance/i.test(line)) {
      const rawDate = dateMatch[0];
      
      // Look for Kotak UPI narrative: UPI/P2A/12345/Name/Bank or UPI/P2M/...
      let payee = '';
      let isCredit = false;
      let amount = null;

      // Check for UPI structure in current line or next line
      const combinedLine = line + ' ' + (lines[i + 1] || '');
      
      // Match UPI pattern
      const upiMatch = combinedLine.match(/UPI\/(?:P2A|P2M|REV)\/([^\/]+)\/([^\/]+)/i);
      if (upiMatch) {
        payee = upiMatch[2].replace(/[0-9@_.-]/g, ' ').trim();
      } else {
        // Fallback narrative extraction
        payee = combinedLine
          .replace(dateRegex, '')
          .replace(/\b(?:MB|NET|WDL|DEP|INF|CHQ|CLG|ATM|POS|CMS|UPI)\b/gi, '')
          .replace(/[0-9]{5,}/g, '')
          .replace(/[\/\-_|*:#]/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
      }

      // Check CR/DR flag
      if (/\b(?:CR|CREDIT|DEPOSIT|REFUND|REVERSAL)\b/i.test(combinedLine)) {
        isCredit = true;
      }

      // Extract amount
      const amountRegex = /(?:Rs\.?|INR|₹)?\s*([0-9]{1,3}(?:,[0-9]{2,3})*(?:\.[0-9]{2})|[0-9]+\.[0-9]{2})/g;
      let match;
      const amountsFound = [];
      while ((match = amountRegex.exec(combinedLine)) !== null) {
        const num = parseFloat(match[1].replace(/,/g, ''));
        if (num > 0 && num < 100000000 && num !== 2026 && num !== 2025) {
          amountsFound.push(num);
        }
      }

      if (amountsFound.length > 0) {
        amount = amountsFound[0]; // First number is typically transaction amount
      }

      if (amount > 0 && payee && payee.length >= 2) {
        let parsedDate = new Date(rawDate);
        if (isNaN(parsedDate.getTime())) {
          const parts = rawDate.split(/[\/\-\.]/);
          if (parts.length === 3) parsedDate = new Date(parts[2] + '-' + parts[1] + '-' + parts[0]);
        }
        const isoDate = !isNaN(parsedDate.getTime()) ? parsedDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0];

        transactions.push({
          transactionDate: isoDate,
          description: payee.slice(0, 60),
          amount,
          type: isCredit ? 'credit' : 'debit',
          category: isCredit ? 'Income & Reimbursements' : categorizeDescription(payee)
        });
      }
    }
  }

  return transactions;
}

function parseStatementTextHeuristic(text) {
  // First try Kotak specific parser
  const kotakResults = parseKotakBankStatement(text);
  if (kotakResults.length >= 3) {
    return kotakResults;
  }

  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const transactions = [];
  const dateRegex = /\b(\d{1,2}\s+[A-Za-z]{3},?\s+\d{4}|\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})\b/i;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const dateMatch = line.match(dateRegex);
    if (dateMatch && !/Statement period|Transaction statement/i.test(line)) {
      const rawDate = dateMatch[0];
      let payee = '';
      let amount = null;
      let type = 'debit';

      for (let j = i + 1; j <= Math.min(lines.length - 1, i + 9); j++) {
        const l = lines[j];
        if (dateRegex.test(l) && !/Kotak|Mahindra|Bank/i.test(l)) break;

        if (/^Received from\s+(.+)/i.test(l)) {
          payee = l.replace(/^Received from\s+/i, '').trim();
          type = 'credit';
        } else if (/^Paid to\s+(.+)/i.test(l)) {
          const p = l.replace(/^Paid to\s+/i, '').trim();
          if (!/Kotak|Mahindra|Bank|HDFC|ICICI|SBI|Axis|Account/i.test(p)) {
            payee = p;
            type = 'debit';
          }
        } else if (l.includes('₹') || l.includes('Rs') || l.includes('INR')) {
          const cleanNum = parseFloat(l.replace(/[^0-9.]/g, ''));
          if (cleanNum > 0 && cleanNum < 100000000 && !amount && cleanNum !== 2026) {
            amount = cleanNum;
          }
        }
      }

      if (amount !== null && amount > 0 && payee) {
        let parsedDate = new Date(rawDate);
        if (isNaN(parsedDate.getTime())) {
          const parts = rawDate.split(/[\/\-\.]/);
          if (parts.length === 3) parsedDate = new Date(parts[2] + '-' + parts[1] + '-' + parts[0]);
        }
        const isoDate = !isNaN(parsedDate.getTime()) ? parsedDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0];

        transactions.push({
          transactionDate: isoDate,
          description: payee,
          amount: amount,
          category: type === 'credit' ? 'Income & Reimbursements' : categorizeDescription(payee),
          type
        });
      }
    }
  }

  // 2. Single-line table format fallback
  if (transactions.length === 0) {
    const amountRegex = /(?:(?:Rs\.?|INR|₹)\s*)?([0-9]{1,3}(?:,[0-9]{2,3})*(?:\.[0-9]{2})|[0-9]+\.[0-9]{2}|[0-9]{2,7}(?:\.[0-9]{2})?)\b/g;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const dateMatch = line.match(dateRegex);
      if (dateMatch) {
        const lineWithoutDate = line.replace(dateMatch[0], ' ');
        const amounts = [];
        let match;
        amountRegex.lastIndex = 0;
        while ((match = amountRegex.exec(lineWithoutDate)) !== null) {
          const cleanStr = match[1].replace(/,/g, '');
          const num = parseFloat(cleanStr);
          if (num > 0 && num < 1000000000 && !isNaN(num) && num !== 2024 && num !== 2025 && num !== 2026) {
            amounts.push(num);
          }
        }
        if (amounts.length > 0) {
          let rawDesc = lineWithoutDate.replace(amountRegex, '').replace(/[\/\-_|#*:]/g, ' ').replace(/\b(upi|ref|txn|trf|imps|neft|pos|cms|ecom|vpa|dr|cr|inr|rs)\b/gi, '').replace(/\s+/g, ' ').trim();
          if (!rawDesc || rawDesc.length < 2) rawDesc = 'Bank Transaction';
          if (rawDesc.length > 60) rawDesc = rawDesc.slice(0, 60);

          let parsedDate = new Date(dateMatch[0]);
          if (isNaN(parsedDate.getTime())) {
            const parts = dateMatch[0].split(/[\/\-\.]/);
            if (parts.length === 3) parsedDate = new Date(parts[2] + '-' + parts[1] + '-' + parts[0]);
          }
          const isoDate = !isNaN(parsedDate.getTime()) ? parsedDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0];

          const isCr = /cr|credit|salary|refund|deposit/i.test(line);
          transactions.push({
            transactionDate: isoDate,
            description: rawDesc,
            amount: amounts[0],
            category: isCr ? 'Income & Reimbursements' : categorizeDescription(line + ' ' + rawDesc),
            type: isCr ? 'credit' : 'debit'
          });
        }
      }
    }
  }

  return transactions;
}

exports.uploadStatement = async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, error: 'No file uploaded' });
  try {
    let text = '';
    if (req.file.mimetype === 'application/pdf' || req.file.originalname.toLowerCase().endsWith('.pdf')) {
      const dataBuffer = fs.readFileSync(req.file.path);
      if (typeof pdfParseModule === 'function') {
        const pdfData = await pdfParseModule(dataBuffer);
        text = pdfData.text || '';
      } else if (pdfParseModule.PDFParse) {
        const parser = new pdfParseModule.PDFParse({ data: dataBuffer });
        const pdfData = await parser.getText();
        text = pdfData.text || '';
      } else {
        text = dataBuffer.toString('utf8');
      }
    } else {
      text = fs.readFileSync(req.file.path, 'utf8');
    }

    console.log(`[Statement Upload] Extracted ${text.length} chars of text from ${req.file.originalname}.`);

    let transactions = [];

    // 1. Attempt OpenAI extraction if API key is present
    if (process.env.OPENAI_API_KEY) {
      try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
          },
          body: JSON.stringify({
            model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
            temperature: 0,
            response_format: { type: 'json_object' },
            messages: [
              {
                role: 'system',
                content: 'You are a financial AI. Extract all individual transactions from this bank or payment statement text. Return JSON with key "transactions": [{"transactionDate": "YYYY-MM-DD", "description": "Payee/Description", "amount": 100.50, "type": "debit"|"credit", "category": "Food & Dining"|"Transportation"|"Shopping & Groceries"|"Utilities & Bills"|"Healthcare"|"Entertainment"|"Income"|"Housing & Rent"|"Investments"|"Debt & EMI"|"Other"}]. Ensure amounts are positive numbers.'
              },
              {
                role: 'user',
                content: text.substring(0, 25000)
              }
            ]
          })
        });

        if (response.ok) {
          const aiResult = await response.json();
          const aiData = JSON.parse(aiResult.choices?.[0]?.message?.content || '{}');
          if (Array.isArray(aiData.transactions) && aiData.transactions.length) {
            transactions = aiData.transactions;
            console.log(`[Statement Upload] AI extracted ${transactions.length} transactions.`);
          }
        }
      } catch (aiErr) {
        console.warn('[Statement Upload] AI parsing failed, falling back to heuristic parsing:', aiErr.message);
      }
    }

    // 2. Heuristic fallback if AI was unavailable or produced no transactions
    if (!transactions.length) {
      transactions = parseStatementTextHeuristic(text);
      console.log(`[Statement Upload] Heuristic extracted ${transactions.length} transactions.`);
    }

    if (!transactions.length) {
      return res.status(400).json({ 
        success: false, 
        error: 'Could not detect any transactions in the statement. Please ensure it is a valid bank or UPI statement.' 
      });
    }

    const userId = req.wealthUser.id;
    const dbParams = getUserDb(userId);
    if (!dbParams.user) return res.status(404).json({ success: false, error: 'User not found' });

    dbParams.user.expenses = Array.isArray(dbParams.user.expenses) ? dbParams.user.expenses : [];
    const existingExpenses = dbParams.user.expenses;

    // INTELLIGENT DEDUPLICATION ENGINE
    const newExpenses = [];
    let duplicateCount = 0;

    for (const t of transactions) {
      const tAmount = Number(t.amount) || 0;
      const tDate = t.transactionDate || new Date().toISOString().split('T')[0];
      const tType = t.type || 'debit';
      const tNormalizedPayee = normalizePayeeText(t.description);

      // Check if already in DB
      const isDuplicate = existingExpenses.some(e => {
        const eAmount = Number(e.amount) || 0;
        const eDate = String(e.transactionDate || '').split('T')[0];
        const eType = e.type || 'debit';
        const eNormalizedPayee = normalizePayeeText(e.description || e.merchantOrPayee);

        // 1. Exact amount match
        if (Math.abs(eAmount - tAmount) > 0.01) return false;

        // 2. Type match
        if (eType !== tType) return false;

        // 3. Date match (same day or within 1 day)
        const dayDiff = Math.abs(new Date(eDate).getTime() - new Date(tDate).getTime()) / (1000 * 60 * 60 * 24);
        if (dayDiff > 2) return false;

        // 4. Payee similarity match
        if (eNormalizedPayee && tNormalizedPayee) {
          if (eNormalizedPayee === tNormalizedPayee) return true;
          if (eNormalizedPayee.includes(tNormalizedPayee) || tNormalizedPayee.includes(eNormalizedPayee)) return true;
        }

        // Exact date and exact amount match
        if (dayDiff === 0) return true;

        return false;
      });

      if (isDuplicate) {
        duplicateCount++;
      } else {
        const item = {
          id: crypto.randomUUID(),
          familyMemberId: dbParams.user.familyMembers?.[0]?.id || 'me',
          category: t.category || 'Other',
          amount: tAmount,
          transactionDate: tDate,
          description: t.description || 'Statement import',
          paymentMethod: 'Bank Statement',
          type: tType,
          isTaxDeductible: false,
          notes: tType === 'credit' ? 'Received money' : ''
        };
        newExpenses.push(item);
        existingExpenses.push(item); // Update in-memory set to prevent internal duplicates in same batch
      }
    }

    auditWealth(dbParams.db, userId, 'Statement_Import', { 
      imported: newExpenses.length, 
      duplicatesSkipped: duplicateCount 
    });
    writeWealthDb(dbParams.db);

    res.json({ 
      success: true, 
      importedCount: newExpenses.length,
      duplicateCount,
      totalProcessed: transactions.length,
      expenses: newExpenses, 
      message: `Successfully processed ${transactions.length} entries: Imported ${newExpenses.length} new transactions (${duplicateCount} duplicates safely skipped).` 
    });
  } catch (err) {
    console.error('Statement upload error:', err);
    res.status(500).json({ success: false, error: err.message || 'Processing failed' });
  } finally {
    if (req.file) fs.rmSync(req.file.path, { force: true });
  }
};
