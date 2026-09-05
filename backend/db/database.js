const crypto = require('crypto');
const { getDb, withTransaction, closeDb, defaultDbPath } = require('./sqlite');

const sessionMaxAgeMs = 1000 * 60 * 60 * 24 * 14;

// Helper to format text/numbers safely
const shortText = (value, max = 160) => String(value || '').replace(/[<>]/g, '').trim().slice(0, max);
const cleanNumber = value => Math.max(0, Number(value) || 0);
const cleanDate = value => /^\d{4}-\d{2}-\d{2}$/.test(String(value || '')) ? String(value) : '';
const ensureId = value => String(value || '').trim() || crypto.randomUUID();

function defaultWealthData(ownerName = 'Owner') {
  return {
    assets: [],
    liabilities: [],
    documents: [],
    alerts: [],
    cameras: [],
    cameraEvents: [],
    family: [
      { id: crypto.randomUUID(), name: ownerName, relation: 'Self', access: 'Owner', phone: '', email: '' }
    ],
    goals: [],
    activity: [],
    incomeStreams: [],
    incomeTarget: 200000,
    cash: { income: 0, expenses: 0 },
    incomeDetails: {
      basicSalary: 0,
      hra: 0,
      specialAllowance: 0,
      bonus: 0,
      otherAllowances: 0,
      employerPf: 0,
      professionalTax: 0,
      otherIncome: 0,
      bankInterest: 0,
      dividendIncome: 0,
      rentalIncome: 0,
      rentPaid: 0,
      isMetro: false,
      stcgEquity: 0,
      ltcgEquity: 0,
      stclBroughtForward: 0,
      ltclBroughtForward: 0,
      freelanceIncome: 0,
      municipalTaxes: 0,
      tdsPaid: 0,
      advanceTaxPaid: 0,
      _frequency: 'monthly',
      _sourceDocument: ''
    },
    taxDeductions: {
      selectedRegime: 'New Regime',
      sec80C: 0,
      sec80CCD1B: 0,
      sec80D: 0,
      homeLoanInterest: 0,
      profTax: 0,
      sec80TTA: 0,
      sec80E: 0,
      sec80EEA: 0,
      sec80G: 0,
      sec80GG: 0
    },
    expenses: [],
    expenseCategories: [
      { id: crypto.randomUUID(), name: 'Lifestyle', parent: null, icon: '🌟', is_hnwi_default: true },
      { id: crypto.randomUUID(), name: 'Asset Maintenance', parent: null, icon: '🏠', is_hnwi_default: true },
      { id: crypto.randomUUID(), name: 'Staff Payroll', parent: null, icon: '👥', is_hnwi_default: true },
      { id: crypto.randomUUID(), name: 'Tax & Legal', parent: null, icon: '⚖️', is_hnwi_default: true },
      { id: crypto.randomUUID(), name: 'Travel', parent: null, icon: '✈️', is_hnwi_default: true },
      { id: crypto.randomUUID(), name: 'Investments/Capital Calls', parent: null, icon: '📈', is_hnwi_default: true },
      { id: crypto.randomUUID(), name: 'Luxury Goods', parent: null, icon: '💎', is_hnwi_default: true }
    ],
    willVault: {},
    willDraft: {},
    livingWill: {},
    codicil: {},
    securitySettings: {},
    lastParsedPayslip: null
  };
}

function assembleUserData(db, userId, userName = 'Owner') {
  // 1. Assets + History + Transactions
  const rawAssets = db.prepare('SELECT * FROM assets WHERE user_id = ? ORDER BY value DESC').all(userId);
  const assetIds = rawAssets.map(a => a.id);
  
  const historyMap = new Map();
  const txMap = new Map();

  if (assetIds.length > 0) {
    const rawHistory = db.prepare('SELECT * FROM asset_value_history WHERE asset_id IN (' + assetIds.map(() => '?').join(',') + ') ORDER BY date ASC').all(...assetIds);
    for (const h of rawHistory) {
      if (!historyMap.has(h.asset_id)) historyMap.set(h.asset_id, []);
      historyMap.get(h.asset_id).push({
        id: h.id,
        value: h.value,
        date: h.date,
        note: h.note || ''
      });
    }

    const rawTxs = db.prepare('SELECT * FROM asset_transactions WHERE asset_id IN (' + assetIds.map(() => '?').join(',') + ') ORDER BY date ASC').all(...assetIds);
    for (const tx of rawTxs) {
      if (!txMap.has(tx.asset_id)) txMap.set(tx.asset_id, []);
      let allocations = [];
      try {
        if (tx.allocations_json) allocations = JSON.parse(tx.allocations_json);
      } catch (err) {
        void err;
      }
      txMap.get(tx.asset_id).push({
        id: tx.id,
        type: tx.type,
        date: tx.date,
        quantity: tx.quantity || 0,
        price: tx.price || 0,
        proceeds: tx.proceeds || 0,
        costBasis: tx.cost_basis || 0,
        realizedGain: tx.realized_gain || 0,
        taxLotMethod: tx.tax_lot_method || '',
        allocations,
        ratio: tx.ratio || '',
        amount: tx.amount || 0,
        note: tx.note || ''
      });
    }
  }

  const assets = rawAssets.map(a => ({
    id: a.id,
    name: a.name,
    type: a.type,
    assetSubType: a.asset_sub_type || '',
    value: a.value || 0,
    purchasePrice: a.purchase_price || 0,
    acquisitionDate: a.acquisition_date || '',
    owner: a.owner || '',
    location: a.location || '',
    ticker: a.ticker || '',
    sector: a.sector || '',
    tags: a.tags || '',
    purchaseDate: a.purchase_date || '',
    buyPrice: a.buy_price || 0,
    quantity: a.quantity || 0,
    currentPrice: a.current_price || 0,
    currency: a.currency || 'INR',
    exchangeRate: a.exchange_rate || 1.0,
    brokerageFees: a.brokerage_fees || 0,
    lotId: a.lot_id || '',
    dividendsReceived: a.dividends_received || 0,
    corporateActions: a.corporate_actions || '',
    taxLotMethod: a.tax_lot_method || '',
    brand: a.brand || '',
    model: a.model || '',
    referenceNumber: a.reference_number || '',
    serialNumber: a.serial_number || '',
    watchBoxPapers: a.watch_box_papers || '',
    watchMarketJson: a.watch_market_json || '',
    year: a.year || null,
    odometer: a.odometer || 0,
    registrationNumber: a.registration_number || '',
    area: a.area || '',
    condition: a.condition || '',
    hasLoan: a.has_loan || '',
    loanAmount: a.loan_amount || 0,
    downPayment: a.down_payment || 0,
    interestRate: a.interest_rate || 0,
    loanTenureYears: a.loan_tenure_years || 0,
    loanStartDate: a.loan_start_date || '',
    emiAmount: a.emi_amount || 0,
    loanType: a.loan_type || '',
    source: a.source || 'Manual',
    valuationBasis: a.valuation_basis || '',
    estimatedValueDate: a.estimated_value_date || '',
    valuationLow: a.valuation_low || 0,
    valuationHigh: a.valuation_high || 0,
    valuationConfidence: a.valuation_confidence || '',
    lastUpdated: a.last_updated || '',
    note: a.note || '',
    renewal: a.renewal_date || '',
    photoId: a.photo_id || '',
    photoName: a.photo_name || '',
    photoUrl: a.photo_url || '',
    valueHistory: historyMap.get(a.id) || [],
    investmentTransactions: txMap.get(a.id) || []
  }));

  // 2. Liabilities
  const liabilities = db.prepare('SELECT * FROM liabilities WHERE user_id = ?').all(userId).map(l => ({
    id: l.id,
    name: l.name,
    type: l.type,
    value: l.value || 0,
    emi: l.emi || 0,
    rate: l.rate || 0,
    lender: l.lender || '',
    source: l.source || 'Manual',
    lastUpdated: l.last_updated || '',
    dueDate: l.due_date || ''
  }));

  // 3. Documents
  const documents = db.prepare('SELECT * FROM documents WHERE user_id = ?').all(userId).map(d => ({
    id: d.id,
    name: d.name,
    type: d.type,
    category: d.category || 'other',
    docNumber: d.doc_number || '',
    owner: d.owner || 'Self',
    issueDate: d.issue_date || '',
    expiry: d.expiry_date || d.renewal_date || '',
    renewal: d.renewal_date || d.expiry_date || '',
    status: d.status || 'Stored',
    linkedTo: d.linked_to_asset_id || '',
    requiredFor: d.required_for || '',
    notes: d.notes || '',
    fileId: d.file_id || '',
    fileName: d.file_name || '',
    fileUrl: d.file_url || '',
    isMasked: Boolean(d.is_masked)
  }));

  // 4. Alerts / Reminders
  const alerts = db.prepare('SELECT * FROM reminders_alerts WHERE user_id = ?').all(userId).map(al => ({
    id: al.id,
    name: al.name,
    date: al.date,
    priority: al.priority || 'Normal',
    channel: al.channel || 'In-app',
    linkedTo: al.linked_to || ''
  }));

  // 5. Family
  const family = db.prepare('SELECT * FROM family_members WHERE user_id = ?').all(userId).map(f => ({
    id: f.id,
    name: f.name,
    relation: f.relation,
    access: f.access_level || 'View only',
    phone: f.phone || '',
    email: f.email || ''
  }));

  // 6. Goals
  const goals = db.prepare('SELECT * FROM financial_goals WHERE user_id = ?').all(userId).map(g => ({
    id: g.id,
    name: g.name,
    target: g.target_amount || 0,
    saved: g.saved_amount || 0,
    deadline: g.deadline || '',
    priority: g.priority || 'Normal'
  }));

  // 7. Income Streams
  const incomeStreams = db.prepare('SELECT * FROM income_streams WHERE user_id = ?').all(userId).map(inc => ({
    id: inc.id,
    name: inc.name,
    category: inc.category,
    amount: inc.amount || 0,
    frequency: inc.frequency || 'monthly',
    isPassive: Boolean(inc.is_passive),
    status: inc.status || 'active',
    taxType: inc.tax_type || 'taxable',
    linkedAssetId: inc.linked_asset_id || '',
    startDate: inc.start_date || '',
    notes: inc.notes || '',
    createdAt: inc.created_at,
    updatedAt: inc.updated_at
  }));

  // 8. Tax Profile
  const rawTax = db.prepare('SELECT * FROM user_income_tax_profile WHERE user_id = ?').get(userId);
  const incomeDetails = {
    basicSalary: rawTax?.basic_salary || 0,
    hra: rawTax?.hra || 0,
    specialAllowance: rawTax?.special_allowance || 0,
    bonus: rawTax?.bonus || 0,
    otherAllowances: rawTax?.other_allowances || 0,
    employerPf: rawTax?.employer_pf || 0,
    professionalTax: rawTax?.professional_tax || 0,
    otherIncome: rawTax?.other_income || 0,
    bankInterest: rawTax?.bank_interest || 0,
    dividendIncome: rawTax?.dividend_income || 0,
    rentalIncome: rawTax?.rental_income || 0,
    rentPaid: rawTax?.rent_paid || 0,
    isMetro: Boolean(rawTax?.is_metro),
    stcgEquity: rawTax?.stcg_equity || 0,
    ltcgEquity: rawTax?.ltcg_equity || 0,
    stclBroughtForward: rawTax?.stcl_brought_forward || 0,
    ltclBroughtForward: rawTax?.ltcl_brought_forward || 0,
    freelanceIncome: rawTax?.freelance_income || 0,
    municipalTaxes: rawTax?.municipal_taxes || 0,
    tdsPaid: rawTax?.tds_paid || 0,
    advanceTaxPaid: rawTax?.advance_tax_paid || 0,
    _frequency: rawTax?.income_frequency || 'monthly',
    _sourceDocument: rawTax?.source_document || ''
  };

  const taxDeductions = {
    selectedRegime: rawTax?.selected_regime || 'New Regime',
    sec80C: rawTax?.sec_80c || 0,
    sec80CCD1B: rawTax?.sec_80ccd1b || 0,
    sec80D: rawTax?.sec_80d || 0,
    homeLoanInterest: rawTax?.home_loan_interest || 0,
    profTax: rawTax?.prof_tax_deduction || 0,
    sec80TTA: rawTax?.sec_80tta || 0,
    sec80E: rawTax?.sec_80e || 0,
    sec80EEA: rawTax?.sec_80eea || 0,
    sec80G: rawTax?.sec_80g || 0,
    sec80GG: rawTax?.sec_80gg || 0
  };

  // 9. Expenses (Cashflow)
  const expenses = db.prepare('SELECT * FROM cashflow_transactions WHERE user_id = ? ORDER BY transaction_date DESC').all(userId).map(e => ({
    id: e.id,
    familyMemberId: e.family_member_id || null,
    accountId: e.account_id || null,
    amount: e.amount || 0,
    currency: e.currency || 'INR',
    type: e.type || 'debit',
    transactionDate: e.transaction_date,
    merchantOrPayee: e.merchant_payee || e.description || '',
    description: e.description || e.merchant_payee || '',
    category: e.category || 'Other',
    subCategory: e.sub_category || '',
    paymentMethod: e.payment_method || 'Manual Entry',
    isTaxDeductible: Boolean(e.is_tax_deductible),
    receiptUrl: e.receipt_url || '',
    notes: e.notes || '',
    createdAt: e.created_at,
    updatedAt: e.updated_at
  }));

  // 10. Will Vault
  const rawWill = db.prepare('SELECT * FROM will_vault WHERE user_id = ?').get(userId);
  const rawNominees = db.prepare('SELECT * FROM will_nominees WHERE user_id = ?').all(userId);
  const rawClaims = db.prepare('SELECT * FROM will_claim_events WHERE user_id = ?').all(userId);
  
  let willVault = {};
  let willDraft = {};
  let livingWill = {};
  let codicil = {};

  if (rawWill) {
    willVault = {
      status: rawWill.status,
      encrypted_blob: rawWill.encrypted_blob,
      iv: rawWill.iv,
      authTag: rawWill.auth_tag,
      encrypted_dek: rawWill.encrypted_dek,
      uploadedAt: rawWill.uploaded_at,
      verifiedAt: rawWill.verified_at,
      nominees: rawNominees.map(n => ({
        id: n.id,
        name: n.name,
        email: n.email,
        phone: n.phone,
        relationship: n.relationship,
        addedAt: n.added_at
      })),
      trigger_event: rawClaims.length > 0 ? {
        status: rawClaims[0].status,
        nomineeId: rawClaims[0].nominee_id,
        proofFileName: rawClaims[0].proof_file_name,
        submittedAt: rawClaims[0].submitted_at
      } : null
    };

    try { if (rawWill.will_draft_json) willDraft = JSON.parse(rawWill.will_draft_json); } catch (err) { void err; }
    try { if (rawWill.living_will_json) livingWill = JSON.parse(rawWill.living_will_json); } catch (err) { void err; }
    try { if (rawWill.codicil_json) codicil = JSON.parse(rawWill.codicil_json); } catch (err) { void err; }
  }

  // 11. Aux Data
  const aux = db.prepare('SELECT * FROM user_aux_data WHERE user_id = ?').get(userId);
  let cameras = [];
  let cameraEvents = [];
  let securitySettings = {};
  let lastParsedPayslip = null;
  let expenseCategories = [
    { id: crypto.randomUUID(), name: 'Lifestyle', parent: null, icon: '🌟', is_hnwi_default: true },
    { id: crypto.randomUUID(), name: 'Asset Maintenance', parent: null, icon: '🏠', is_hnwi_default: true },
    { id: crypto.randomUUID(), name: 'Staff Payroll', parent: null, icon: '👥', is_hnwi_default: true },
    { id: crypto.randomUUID(), name: 'Tax & Legal', parent: null, icon: '⚖️', is_hnwi_default: true },
    { id: crypto.randomUUID(), name: 'Travel', parent: null, icon: '✈️', is_hnwi_default: true },
    { id: crypto.randomUUID(), name: 'Investments/Capital Calls', parent: null, icon: '📈', is_hnwi_default: true },
    { id: crypto.randomUUID(), name: 'Luxury Goods', parent: null, icon: '💎', is_hnwi_default: true }
  ];
  let activity = [];

  if (aux) {
    try { if (aux.cameras_json) cameras = JSON.parse(aux.cameras_json); } catch (err) { void err; }
    try { if (aux.camera_events_json) cameraEvents = JSON.parse(aux.camera_events_json); } catch (err) { void err; }
    try { if (aux.security_settings_json) securitySettings = JSON.parse(aux.security_settings_json); } catch (err) { void err; }
    try { if (aux.last_parsed_payslip_json) lastParsedPayslip = JSON.parse(aux.last_parsed_payslip_json); } catch (err) { void err; }
    try { if (aux.expense_categories_json) expenseCategories = JSON.parse(aux.expense_categories_json); } catch (err) { void err; }
    try { if (aux.activity_json) activity = JSON.parse(aux.activity_json); } catch (err) { void err; }
  }

  return {
    assets,
    liabilities,
    documents,
    alerts,
    family: family.length > 0 ? family : [{ id: crypto.randomUUID(), name: userName, relation: 'Self', access: 'Owner', phone: '', email: '' }],
    goals,
    activity,
    incomeStreams,
    incomeTarget: rawTax?.income_target || 200000,
    cash: {
      income: rawTax?.cash_income || 0,
      expenses: rawTax?.cash_expenses || 0
    },
    incomeDetails,
    taxDeductions,
    expenses,
    expenseCategories,
    willVault,
    willDraft,
    livingWill,
    codicil,
    cameras,
    cameraEvents,
    securitySettings,
    lastParsedPayslip
  };
}

function readWealthDb() {
  const db = getDb();
  const rawUsers = db.prepare('SELECT * FROM users ORDER BY created_at ASC').all();
  const rawSessions = db.prepare('SELECT * FROM user_sessions').all();
  const rawAudit = db.prepare('SELECT * FROM audit_logs ORDER BY created_at ASC').all();

  const sessions = {};
  for (const s of rawSessions) {
    sessions[s.token] = {
      userId: s.user_id,
      createdAt: s.created_at,
      expiresAt: s.expires_at
    };
  }

  const users = rawUsers.map(u => {
    const data = assembleUserData(db, u.id, u.name);
    return {
      id: u.id,
      name: u.name,
      email: u.email,
      type: u.user_type,
      salt: u.salt || '',
      passwordHash: u.password_hash || '',
      password: u.password_hash || '',
      phone: u.phone || '',
      createdAt: u.created_at,
      updatedAt: u.updated_at,
      lastLogin: u.last_login,
      data
    };
  });

  const willVaults = {};
  for (const u of rawUsers) {
    const rawWill = db.prepare('SELECT * FROM will_vault WHERE user_id = ?').get(u.id);
    if (rawWill) {
      const nominees = db.prepare('SELECT * FROM will_nominees WHERE user_id = ?').all(u.id);
      const claims = db.prepare('SELECT * FROM will_claim_events WHERE user_id = ?').all(u.id);
      willVaults[u.id] = {
        status: rawWill.status,
        encrypted_blob: rawWill.encrypted_blob,
        iv: rawWill.iv,
        authTag: rawWill.auth_tag,
        encrypted_dek: rawWill.encrypted_dek,
        uploadedAt: rawWill.uploaded_at,
        verifiedAt: rawWill.verified_at,
        nominees: nominees.map(n => ({
          id: n.id,
          name: n.name,
          email: n.email,
          phone: n.phone,
          relationship: n.relationship,
          addedAt: n.added_at
        })),
        trigger_event: claims.length > 0 ? {
          status: claims[0].status,
          nomineeId: claims[0].nominee_id,
          proofFileName: claims[0].proof_file_name,
          submittedAt: claims[0].submitted_at
        } : null
      };
    }
  }

  const audit = rawAudit.map(a => {
    let details = {};
    try {
      if (a.details_json) details = JSON.parse(a.details_json);
    } catch (err) {
      details = a.details_json;
      void err;
    }
    return {
      id: a.id,
      userId: a.user_id,
      action: a.action,
      details,
      createdAt: a.created_at,
      timestamp: a.created_at
    };
  });

  return {
    users,
    sessions,
    audit,
    will_vault: willVaults
  };
}

function writeWealthDb(dbObj) {
  if (!dbObj) return;
  const nowIso = new Date().toISOString();

  withTransaction(d => {
    // 1. Sync users and user data
    if (Array.isArray(dbObj.users)) {
      const upsertUser = d.prepare(`
        INSERT INTO users (id, name, email, user_type, password_hash, salt, created_at, updated_at, last_login, phone)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          name = excluded.name,
          email = excluded.email,
          user_type = excluded.user_type,
          password_hash = CASE WHEN excluded.password_hash != '' THEN excluded.password_hash ELSE users.password_hash END,
          salt = CASE WHEN excluded.salt != '' THEN excluded.salt ELSE users.salt END,
          updated_at = excluded.updated_at,
          last_login = COALESCE(excluded.last_login, users.last_login),
          phone = excluded.phone
      `);

      for (const u of dbObj.users) {
        if (!u || !u.id) continue;
        const uId = u.id;
        const uName = u.name || 'User';
        const uEmail = String(u.email || '').trim().toLowerCase();
        const uType = u.type || 'user';
        const uHash = u.passwordHash || u.password || '';
        const uSalt = u.salt || '';
        const uCreatedAt = u.createdAt || nowIso;
        const uUpdatedAt = u.updatedAt || nowIso;

        upsertUser.run(uId, uName, uEmail, uType, uHash, uSalt, uCreatedAt, uUpdatedAt, u.lastLogin || null, u.phone || '');

        if (u.data && typeof u.data === 'object') {
          saveUserDataSync(d, uId, u.data, uId);
        }
      }
    }

    // 2. Sync sessions
    if (dbObj.sessions && typeof dbObj.sessions === 'object') {
      const existingTokens = new Set(d.prepare('SELECT token FROM user_sessions').all().map(s => s.token));
      const currentTokens = new Set(Object.keys(dbObj.sessions));

      // Remove deleted tokens
      for (const token of existingTokens) {
        if (!currentTokens.has(token)) {
          d.prepare('DELETE FROM user_sessions WHERE token = ?').run(token);
        }
      }

      // Upsert current tokens
      const upsertSession = d.prepare(`
        INSERT OR REPLACE INTO user_sessions (token, user_id, refresh_token, expires_at, created_at, last_active_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `);

      for (const [token, s] of Object.entries(dbObj.sessions)) {
        if (!s || !s.userId) continue;
        const createdAt = s.createdAt ? new Date(s.createdAt).toISOString() : nowIso;
        const expiresAt = s.expiresAt ? new Date(s.expiresAt).toISOString() : new Date(Date.now() + sessionMaxAgeMs).toISOString();
        upsertSession.run(token, s.userId, null, expiresAt, createdAt, createdAt);
      }
    }

    // 3. Sync Will Vault
    if (dbObj.will_vault && typeof dbObj.will_vault === 'object') {
      const upsertWill = d.prepare(`
        INSERT OR REPLACE INTO will_vault (user_id, status, encrypted_blob, iv, auth_tag, encrypted_dek, uploaded_at, verified_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const upsertNominee = d.prepare(`
        INSERT OR REPLACE INTO will_nominees (id, user_id, name, email, phone, relationship, added_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      const upsertClaim = d.prepare(`
        INSERT OR REPLACE INTO will_claim_events (id, user_id, nominee_id, status, proof_file_name, submitted_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `);

      for (const [userId, vault] of Object.entries(dbObj.will_vault)) {
        if (!vault) continue;
        upsertWill.run(
          userId,
          vault.status || 'PENDING_VERIFICATION',
          vault.encrypted_blob || null,
          vault.iv || null,
          vault.authTag || null,
          vault.encrypted_dek || null,
          vault.uploadedAt || nowIso,
          vault.verifiedAt || null
        );

        if (Array.isArray(vault.nominees)) {
          for (const nom of vault.nominees) {
            upsertNominee.run(
              nom.id || crypto.randomUUID(),
              userId,
              nom.name || 'Nominee',
              nom.email || '',
              nom.phone || '',
              nom.relationship || 'Nominee',
              nom.addedAt || nowIso
            );
          }
        }

        if (vault.trigger_event && typeof vault.trigger_event === 'object') {
          const trig = vault.trigger_event;
          upsertClaim.run(
            crypto.randomUUID(),
            userId,
            trig.nomineeId || 'unknown',
            trig.status || 'UNDER_REVIEW',
            trig.proofFileName || 'proof',
            trig.submittedAt || nowIso
          );
        }
      }
    }
  });
}

function saveUserDataSync(d, userId, data, savedBy) {
  void savedBy;
  const nowIso = new Date().toISOString();

  // 1. Assets
  if (Array.isArray(data.assets)) {
    // Delete existing assets for user and re-insert
    d.prepare('DELETE FROM assets WHERE user_id = ?').run(userId);

    const insertAsset = d.prepare(`
      INSERT OR REPLACE INTO assets (
        id, user_id, name, type, asset_sub_type, value, purchase_price, acquisition_date,
        owner, location, ticker, sector, tags, purchase_date, buy_price, quantity,
        current_price, currency, exchange_rate, brokerage_fees, lot_id, dividends_received,
        corporate_actions, tax_lot_method, brand, model, reference_number, serial_number,
        watch_box_papers, watch_market_json, year, odometer, registration_number, area,
        condition, has_loan, loan_amount, down_payment, interest_rate, loan_tenure_years,
        loan_start_date, emi_amount, loan_type, source, valuation_basis, estimated_value_date,
        valuation_low, valuation_high, valuation_confidence, last_updated, note, renewal_date,
        photo_id, photo_name, photo_url
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
      )
    `);

    const insertValueHistory = d.prepare(`
      INSERT OR REPLACE INTO asset_value_history (id, asset_id, value, date, note)
      VALUES (?, ?, ?, ?, ?)
    `);

    const insertAssetTx = d.prepare(`
      INSERT OR REPLACE INTO asset_transactions (
        id, asset_id, type, date, quantity, price, proceeds, cost_basis,
        realized_gain, tax_lot_method, allocations_json, ratio, amount, note
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const a of data.assets) {
      const aId = a.id || crypto.randomUUID();
      insertAsset.run(
        aId, userId, shortText(a.name, 90) || 'Untitled asset', shortText(a.type, 60) || 'Asset', shortText(a.assetSubType, 50) || null,
        cleanNumber(a.value), cleanNumber(a.purchasePrice), cleanDate(a.acquisitionDate) || null,
        shortText(a.owner, 80) || null, shortText(a.location, 120) || null, shortText(a.ticker, 30).toUpperCase() || null,
        shortText(a.sector, 80) || null, shortText(a.tags, 160) || null, cleanDate(a.purchaseDate) || null,
        cleanNumber(a.buyPrice), cleanNumber(a.quantity), cleanNumber(a.currentPrice), shortText(a.currency, 3).toUpperCase() || 'INR',
        cleanNumber(a.exchangeRate) || 1.0, cleanNumber(a.brokerageFees), shortText(a.lotId, 80) || null,
        cleanNumber(a.dividendsReceived), shortText(a.corporateActions, 240) || null, shortText(a.taxLotMethod, 40) || null,
        shortText(a.brand, 80) || null, shortText(a.model, 80) || null, shortText(a.referenceNumber, 80) || null,
        shortText(a.serialNumber, 80) || null, shortText(a.watchBoxPapers, 80) || null, shortText(a.watchMarketJson, 4000) || null,
        cleanNumber(a.year) || null, cleanNumber(a.odometer), shortText(a.registrationNumber, 50) || null,
        shortText(a.area, 80) || null, shortText(a.condition, 40) || null, shortText(a.hasLoan, 20) || null,
        cleanNumber(a.loanAmount), cleanNumber(a.downPayment), cleanNumber(a.interestRate),
        cleanNumber(a.loanTenureYears), cleanDate(a.loanStartDate) || null, cleanNumber(a.emiAmount),
        shortText(a.loanType, 40) || null, shortText(a.source, 80) || 'Manual', shortText(a.valuationBasis, 520) || null,
        cleanDate(a.estimatedValueDate) || null, cleanNumber(a.valuationLow), cleanNumber(a.valuationHigh),
        shortText(a.valuationConfidence, 40) || null, cleanDate(a.lastUpdated) || nowIso.slice(0, 10),
        shortText(a.note, 240) || null, cleanDate(a.renewal) || null, shortText(a.photoId, 80) || null,
        shortText(a.photoName, 160) || null, shortText(a.photoUrl, 220) || null
      );

      if (Array.isArray(a.valueHistory)) {
        for (const vh of a.valueHistory) {
          insertValueHistory.run(ensureId(vh.id), aId, cleanNumber(vh.value), cleanDate(vh.date) || nowIso.slice(0, 10), shortText(vh.note, 140));
        }
      }

      if (Array.isArray(a.investmentTransactions)) {
        for (const it of a.investmentTransactions) {
          insertAssetTx.run(
            ensureId(it.id), aId, shortText(it.type, 30) || 'Event', cleanDate(it.date) || nowIso.slice(0, 10),
            cleanNumber(it.quantity), cleanNumber(it.price), cleanNumber(it.proceeds), cleanNumber(it.costBasis),
            Number(it.realizedGain) || 0, shortText(it.taxLotMethod, 40) || null,
            Array.isArray(it.allocations) ? JSON.stringify(it.allocations) : null,
            shortText(it.ratio, 20) || null, cleanNumber(it.amount), shortText(it.note, 220) || null
          );
        }
      }
    }
  }

  // 2. Liabilities
  if (Array.isArray(data.liabilities)) {
    d.prepare('DELETE FROM liabilities WHERE user_id = ?').run(userId);
    const insertLiability = d.prepare(`
      INSERT OR REPLACE INTO liabilities (id, user_id, name, type, value, emi, rate, lender, source, last_updated, due_date)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const l of data.liabilities) {
      insertLiability.run(
        ensureId(l.id), userId, shortText(l.name, 90) || 'Untitled liability', shortText(l.type, 60) || 'Liability',
        cleanNumber(l.value), cleanNumber(l.emi), cleanNumber(l.rate), shortText(l.lender, 80) || null,
        shortText(l.source, 80) || 'Manual', cleanDate(l.lastUpdated) || nowIso.slice(0, 10), cleanDate(l.dueDate) || null
      );
    }
  }

  // 3. Documents
  if (Array.isArray(data.documents)) {
    d.prepare('DELETE FROM documents WHERE user_id = ?').run(userId);
    const insertDocument = d.prepare(`
      INSERT OR REPLACE INTO documents (
        id, user_id, name, type, category, doc_number, owner, issue_date,
        expiry_date, renewal_date, status, linked_to_asset_id, required_for, notes,
        file_id, file_name, file_url, is_masked, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const doc of data.documents) {
      insertDocument.run(
        ensureId(doc.id), userId, shortText(doc.name, 120) || 'Untitled document', shortText(doc.type, 80) || 'Document',
        shortText(doc.category, 60) || 'other', shortText(doc.docNumber, 80) || null, shortText(doc.owner, 80) || 'Self',
        cleanDate(doc.issueDate) || null, cleanDate(doc.expiry || doc.renewal) || null, cleanDate(doc.renewal || doc.expiry) || null,
        shortText(doc.status, 80) || 'Stored', shortText(doc.linkedTo, 120) || null, shortText(doc.requiredFor, 120) || null,
        shortText(doc.notes, 300) || null, shortText(doc.fileId, 80) || null, shortText(doc.fileName, 160) || null,
        shortText(doc.fileUrl, 220) || null, doc.isMasked ? 1 : 0, nowIso
      );
    }
  }

  // 4. Alerts
  if (Array.isArray(data.alerts)) {
    d.prepare('DELETE FROM reminders_alerts WHERE user_id = ?').run(userId);
    const insertAlert = d.prepare(`
      INSERT OR REPLACE INTO reminders_alerts (id, user_id, name, date, priority, channel, linked_to)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    for (const al of data.alerts) {
      insertAlert.run(
        ensureId(al.id), userId, shortText(al.name, 100) || 'Reminder', cleanDate(al.date) || nowIso.slice(0, 10),
        shortText(al.priority, 30) || 'Normal', shortText(al.channel, 40) || 'In-app', shortText(al.linkedTo, 100) || null
      );
    }
  }

  // 5. Family
  if (Array.isArray(data.family)) {
    d.prepare('DELETE FROM family_members WHERE user_id = ?').run(userId);
    const insertFamily = d.prepare(`
      INSERT OR REPLACE INTO family_members (id, user_id, name, relation, access_level, phone, email)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    for (const f of data.family) {
      insertFamily.run(
        ensureId(f.id), userId, shortText(f.name, 90) || 'Family member', shortText(f.relation, 60) || 'Self',
        shortText(f.access, 60) || 'View only', shortText(f.phone, 30) || null, shortText(f.email, 120) || null
      );
    }
  }

  // 6. Goals
  if (Array.isArray(data.goals)) {
    d.prepare('DELETE FROM financial_goals WHERE user_id = ?').run(userId);
    const insertGoal = d.prepare(`
      INSERT OR REPLACE INTO financial_goals (id, user_id, name, target_amount, saved_amount, deadline, priority)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    for (const g of data.goals) {
      insertGoal.run(
        ensureId(g.id), userId, shortText(g.name, 100) || 'Goal', cleanNumber(g.target), cleanNumber(g.saved),
        cleanDate(g.deadline) || null, shortText(g.priority, 40) || 'Normal'
      );
    }
  }

  // 7. Income Streams
  if (Array.isArray(data.incomeStreams)) {
    d.prepare('DELETE FROM income_streams WHERE user_id = ?').run(userId);
    const insertIncomeStream = d.prepare(`
      INSERT OR REPLACE INTO income_streams (
        id, user_id, name, category, amount, frequency, is_passive, status, tax_type,
        linked_asset_id, start_date, notes, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const inc of data.incomeStreams) {
      insertIncomeStream.run(
        ensureId(inc.id), userId, shortText(inc.name, 120) || 'Income Stream', shortText(inc.category, 60) || 'salary',
        cleanNumber(inc.amount), shortText(inc.frequency, 30) || 'monthly', inc.isPassive ? 1 : 0,
        shortText(inc.status, 20) || 'active', shortText(inc.taxType, 40) || 'taxable', shortText(inc.linkedAssetId, 120) || null,
        cleanDate(inc.startDate) || nowIso.slice(0, 10), shortText(inc.notes, 500) || null,
        inc.createdAt || nowIso, inc.updatedAt || nowIso
      );
    }
  }

  // 8. Tax Profile
  const incDet = data.incomeDetails || {};
  const taxDed = data.taxDeductions || {};
  const upsertTax = d.prepare(`
    INSERT OR REPLACE INTO user_income_tax_profile (
      user_id, selected_regime, basic_salary, hra, special_allowance, bonus, other_allowances,
      employer_pf, professional_tax, other_income, bank_interest, dividend_income, rental_income,
      rent_paid, is_metro, stcg_equity, ltcg_equity, stcl_brought_forward, ltcl_brought_forward,
      freelance_income, municipal_taxes, tds_paid, advance_tax_paid, sec_80c, sec_80ccd1b,
      sec_80d, home_loan_interest, prof_tax_deduction, sec_80tta, sec_80e, sec_80eea,
      sec_80g, sec_80gg, income_frequency, source_document, income_target, cash_income, cash_expenses, updated_at
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
    )
  `);

  upsertTax.run(
    userId,
    shortText(taxDed.selectedRegime, 20) || 'New Regime',
    cleanNumber(incDet.basicSalary), cleanNumber(incDet.hra), cleanNumber(incDet.specialAllowance),
    cleanNumber(incDet.bonus), cleanNumber(incDet.otherAllowances), cleanNumber(incDet.employerPf),
    cleanNumber(incDet.professionalTax), cleanNumber(incDet.otherIncome), cleanNumber(incDet.bankInterest),
    cleanNumber(incDet.dividendIncome), cleanNumber(incDet.rentalIncome), cleanNumber(incDet.rentPaid),
    incDet.isMetro ? 1 : 0, cleanNumber(incDet.stcgEquity), cleanNumber(incDet.ltcgEquity),
    cleanNumber(incDet.stclBroughtForward), cleanNumber(incDet.ltclBroughtForward), cleanNumber(incDet.freelanceIncome),
    cleanNumber(incDet.municipalTaxes), cleanNumber(incDet.tdsPaid), cleanNumber(incDet.advanceTaxPaid),
    cleanNumber(taxDed.sec80C), cleanNumber(taxDed.sec80CCD1B), cleanNumber(taxDed.sec80D),
    cleanNumber(taxDed.homeLoanInterest), cleanNumber(taxDed.profTax), cleanNumber(taxDed.sec80TTA),
    cleanNumber(taxDed.sec80E), cleanNumber(taxDed.sec80EEA), cleanNumber(taxDed.sec80G),
    cleanNumber(taxDed.sec80GG), shortText(incDet._frequency, 20) || 'monthly', shortText(incDet._sourceDocument, 100) || null,
    cleanNumber(data.incomeTarget) || 200000, cleanNumber(data.cash?.income), cleanNumber(data.cash?.expenses), nowIso
  );

  // 9. Expenses (Cashflow)
  if (Array.isArray(data.expenses)) {
    d.prepare('DELETE FROM cashflow_transactions WHERE user_id = ?').run(userId);
    const insertExpense = d.prepare(`
      INSERT OR REPLACE INTO cashflow_transactions (
        id, user_id, family_member_id, account_id, amount, currency, type,
        transaction_date, merchant_payee, description, category, sub_category,
        payment_method, is_tax_deductible, receipt_file_id, receipt_url, notes,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const exp of data.expenses) {
      insertExpense.run(
        ensureId(exp.id),
        userId,
        exp.familyMemberId || exp.family_member_id || null,
        exp.accountId || exp.account_id || null,
        cleanNumber(exp.amount),
        shortText(exp.currency, 3).toUpperCase() || 'INR',
        shortText(exp.type, 30) || 'debit',
        cleanDate(exp.transactionDate || exp.transaction_date) || nowIso.slice(0, 10),
        shortText(exp.merchantOrPayee || exp.merchant_payee || exp.description, 120) || 'Unknown',
        shortText(exp.description, 300) || null,
        shortText(exp.category, 60) || 'Other',
        shortText(exp.subCategory || exp.sub_category, 60) || null,
        shortText(exp.paymentMethod || exp.payment_method, 60) || 'Manual Entry',
        (exp.isTaxDeductible || exp.is_tax_deductible) ? 1 : 0,
        shortText(exp.receiptFileId || exp.receipt_file_id, 80) || null,
        shortText(exp.receiptUrl || exp.receipt_url, 220) || null,
        shortText(exp.notes, 500) || null,
        exp.createdAt || exp.created_at || nowIso,
        exp.updatedAt || exp.updated_at || nowIso
      );
    }
  }

  // 10. Will Vault
  const wv = data.willVault || {};
  const hasWillData = Boolean(
    (data.willVault && typeof data.willVault === 'object' && Object.keys(data.willVault).length > 0) ||
    (data.willDraft && typeof data.willDraft === 'object' && Object.keys(data.willDraft).length > 0) ||
    (data.livingWill && typeof data.livingWill === 'object' && Object.keys(data.livingWill).length > 0) ||
    (data.codicil && typeof data.codicil === 'object' && Object.keys(data.codicil).length > 0)
  );

  if (hasWillData) {
    const upsertWill = d.prepare(`
      INSERT OR REPLACE INTO will_vault (
        user_id, status, vault_file_id, encrypted_blob, iv, auth_tag, encrypted_dek,
        uploaded_at, verified_at, will_draft_json, living_will_json, codicil_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    upsertWill.run(
      userId,
      shortText(wv.status, 40) || 'PENDING_VERIFICATION',
      shortText(wv.vault_file_id || wv.vaultFileId, 80) || null,
      wv.encrypted_blob || null,
      wv.iv || null,
      wv.authTag || wv.auth_tag || null,
      wv.encrypted_dek || null,
      wv.uploadedAt || wv.uploaded_at || nowIso,
      wv.verifiedAt || wv.verified_at || null,
      data.willDraft && typeof data.willDraft === 'object' && Object.keys(data.willDraft).length > 0 ? JSON.stringify(data.willDraft) : null,
      data.livingWill && typeof data.livingWill === 'object' && Object.keys(data.livingWill).length > 0 ? JSON.stringify(data.livingWill) : null,
      data.codicil && typeof data.codicil === 'object' && Object.keys(data.codicil).length > 0 ? JSON.stringify(data.codicil) : null
    );

    if (Array.isArray(wv.nominees)) {
      d.prepare('DELETE FROM will_nominees WHERE user_id = ?').run(userId);
      const insertNominee = d.prepare(`
        INSERT OR REPLACE INTO will_nominees (id, user_id, name, email, phone, relationship, added_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      for (const nom of wv.nominees) {
        insertNominee.run(
          ensureId(nom.id),
          userId,
          shortText(nom.name, 90) || 'Nominee',
          shortText(nom.email, 120) || '',
          shortText(nom.phone, 30) || '',
          shortText(nom.relationship, 60) || 'Nominee',
          nom.addedAt || nowIso
        );
      }
    }

    if (wv.trigger_event && typeof wv.trigger_event === 'object') {
      d.prepare('DELETE FROM will_claim_events WHERE user_id = ?').run(userId);
      const insertClaim = d.prepare(`
        INSERT OR REPLACE INTO will_claim_events (id, user_id, nominee_id, status, proof_file_name, submitted_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      const trig = wv.trigger_event;
      insertClaim.run(
        crypto.randomUUID(),
        userId,
        trig.nomineeId || 'unknown',
        trig.status || 'UNDER_REVIEW',
        trig.proofFileName || 'proof',
        trig.submittedAt || nowIso
      );
    }
  }

  // 11. Aux Data
  const upsertAux = d.prepare(`
    INSERT OR REPLACE INTO user_aux_data (
      user_id, cameras_json, camera_events_json, security_settings_json,
      last_parsed_payslip_json, expense_categories_json, activity_json, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  upsertAux.run(
    userId,
    Array.isArray(data.cameras) ? JSON.stringify(data.cameras) : null,
    Array.isArray(data.cameraEvents) ? JSON.stringify(data.cameraEvents) : null,
    data.securitySettings ? JSON.stringify(data.securitySettings) : null,
    data.lastParsedPayslip ? JSON.stringify(data.lastParsedPayslip) : null,
    Array.isArray(data.expenseCategories) ? JSON.stringify(data.expenseCategories) : null,
    Array.isArray(data.activity) ? JSON.stringify(data.activity) : null,
    nowIso
  );

  // Update user timestamp
  d.prepare('UPDATE users SET updated_at = ? WHERE id = ?').run(nowIso, userId);
}

function saveUserData(userId, data, savedBy) {
  return withTransaction(d => {
    saveUserDataSync(d, userId, data, savedBy);
    auditWealth(null, userId, 'data.saved', {
      assets: Array.isArray(data.assets) ? data.assets.length : 0,
      liabilities: Array.isArray(data.liabilities) ? data.liabilities.length : 0,
      documents: Array.isArray(data.documents) ? data.documents.length : 0,
      expenses: Array.isArray(data.expenses) ? data.expenses.length : 0,
      savedBy: savedBy || userId
    });
    return { success: true, updatedAt: new Date().toISOString() };
  });
}

function resetUserData(userId) {
  return withTransaction(d => {
    const user = d.prepare('SELECT * FROM users WHERE id = ?').get(userId);
    if (!user) throw new Error('User not found');
    const defaultData = defaultWealthData(user.name);
    saveUserDataSync(d, userId, defaultData, userId);
    auditWealth(null, userId, 'data.reset', {});
    return { success: true, data: defaultData, updatedAt: new Date().toISOString() };
  });
}

function cleanExpiredSessions(dbObj) {
  void dbObj;
  const db = getDb();
  const nowTime = Date.now();
  db.prepare("DELETE FROM user_sessions WHERE strftime('%s', expires_at) * 1000 < ?").run(nowTime);
}

function auditWealth(dbObj, userId, action, details = {}) {
  void dbObj;
  const db = getDb();
  const id = crypto.randomUUID();
  const detailsJson = typeof details === 'object' ? JSON.stringify(details) : (details ? String(details) : null);
  const nowIso = new Date().toISOString();
  db.prepare('INSERT INTO audit_logs (id, user_id, action, details_json, created_at) VALUES (?, ?, ?, ?, ?)').run(
    id, userId || null, action, detailsJson, nowIso
  );
}

function recordRateLimitAttempt(ipKey, windowMs = 15 * 60 * 1000, maxAttempts = 30) {
  const now = Date.now();
  
  return withTransaction(d => {
    const record = d.prepare('SELECT * FROM rate_limit_records WHERE ip_key = ?').get(ipKey);
    
    if (!record) {
      d.prepare('INSERT INTO rate_limit_records (ip_key, attempt_count, first_attempt_at, last_attempt_at, blocked_until) VALUES (?, ?, ?, ?, ?)').run(
        ipKey, 1, now, now, null
      );
      return { allowed: true, count: 1, remaining: maxAttempts - 1, blocked: false };
    }

    if (record.blocked_until && record.blocked_until > now) {
      return { allowed: false, count: record.attempt_count, remaining: 0, blocked: true, retryAfter: Math.ceil((record.blocked_until - now) / 1000) };
    }

    if (now - record.first_attempt_at > windowMs) {
      // Reset window
      d.prepare('UPDATE rate_limit_records SET attempt_count = 1, first_attempt_at = ?, last_attempt_at = ?, blocked_until = NULL WHERE ip_key = ?').run(
        now, now, ipKey
      );
      return { allowed: true, count: 1, remaining: maxAttempts - 1, blocked: false };
    }

    const newCount = record.attempt_count + 1;
    const isBlocked = newCount > maxAttempts;
    const blockedUntil = isBlocked ? now + windowMs : null;

    d.prepare('UPDATE rate_limit_records SET attempt_count = ?, last_attempt_at = ?, blocked_until = ? WHERE ip_key = ?').run(
      newCount, now, blockedUntil, ipKey
    );

    return {
      allowed: !isBlocked,
      count: newCount,
      remaining: Math.max(0, maxAttempts - newCount),
      blocked: isBlocked,
      retryAfter: isBlocked ? Math.ceil(windowMs / 1000) : 0
    };
  });
}

function getUserById(userId) {
  const db = getDb();
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  if (!user) return null;
  const data = assembleUserData(db, user.id, user.name);
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    type: user.user_type,
    passwordHash: user.password_hash,
    password: user.password_hash,
    salt: user.salt,
    phone: user.phone,
    createdAt: user.created_at,
    updatedAt: user.updated_at,
    lastLogin: user.last_login,
    data
  };
}

function getUserByEmail(email) {
  const db = getDb();
  const cleanEmail = String(email || '').trim().toLowerCase();
  const user = db.prepare('SELECT * FROM users WHERE lower(email) = lower(?)').get(cleanEmail);
  if (!user) return null;
  const data = assembleUserData(db, user.id, user.name);
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    type: user.user_type,
    passwordHash: user.password_hash,
    password: user.password_hash,
    salt: user.salt,
    phone: user.phone,
    createdAt: user.created_at,
    updatedAt: user.updated_at,
    lastLogin: user.last_login,
    data
  };
}

module.exports = {
  getDb,
  withTransaction,
  closeDb,
  defaultDbPath,
  readWealthDb,
  writeWealthDb,
  cleanExpiredSessions,
  auditWealth,
  defaultWealthData,
  assembleUserData,
  saveUserData,
  resetUserData,
  getUserById,
  getUserByEmail,
  recordRateLimitAttempt
};
