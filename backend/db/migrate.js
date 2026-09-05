const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { getDb, withTransaction } = require('./sqlite');
const vaultService = require('../services/vault.service');

function deterministicId(...parts) {
  const hash = crypto.createHash('sha256').update(parts.map(p => String(p ?? '')).join('|')).digest('hex');
  return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-${hash.slice(12, 16)}-${hash.slice(16, 20)}-${hash.slice(20, 32)}`;
}

function decryptLegacyDb(filePath, keyPath) {
  if (!fs.existsSync(filePath)) return null;
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    const parsed = JSON.parse(raw);
    if (!parsed.encrypted) return parsed;

    let key = null;
    const configuredKey = String(process.env.WEALTH_OS_DB_KEY || '').trim();
    if (configuredKey) {
      key = configuredKey.length === 64
        ? Buffer.from(configuredKey, 'hex')
        : crypto.createHash('sha256').update(configuredKey).digest();
    } else if (keyPath && fs.existsSync(keyPath)) {
      key = Buffer.from(fs.readFileSync(keyPath, 'utf8').trim(), 'hex');
    }

    if (!key) {
      console.warn(`[Migrate] No encryption key found for ${filePath}`);
      return null;
    }

    const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(parsed.iv, 'base64'));
    decipher.setAuthTag(Buffer.from(parsed.tag, 'base64'));
    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(parsed.data, 'base64')),
      decipher.final()
    ]);
    return JSON.parse(decrypted.toString('utf8'));
  } catch (err) {
    console.error(`[Migrate] Failed to decrypt legacy DB at ${filePath}:`, err.message);
    return null;
  }
}

function loadAllLegacySources(rootDir) {
  const baseDir = rootDir || path.resolve(__dirname, '..', '..');
  const sources = [
    {
      dbPath: path.join(baseDir, 'tmp', 'wealth-os', 'wealth-os-db.json'),
      keyPath: path.join(baseDir, 'tmp', 'wealth-os', 'wealth-os-db.key')
    },
    {
      dbPath: path.join(baseDir, 'backend', 'tmp', 'wealth-os', 'wealth-os-db.json'),
      keyPath: path.join(baseDir, 'backend', 'tmp', 'wealth-os', 'wealth-os-db.key')
    },
    {
      dbPath: path.join(baseDir, 'wealth_os_database_export.json'),
      keyPath: null
    }
  ];

  let mergedUsers = new Map();
  let mergedSessions = {};
  let mergedAudit = new Map();
  let mergedWillVault = {};

  for (const src of sources) {
    const data = decryptLegacyDb(src.dbPath, src.keyPath);
    if (!data) continue;

    // Merge users (giving preference to users with richer data arrays)
    if (Array.isArray(data.users)) {
      for (const u of data.users) {
        if (!u || !u.id) continue;
        const existing = mergedUsers.get(u.id);
        const existingAssetsCount = (existing?.data?.assets || []).length;
        const currentAssetsCount = (u.data?.assets || []).length;
        if (!existing || currentAssetsCount >= existingAssetsCount) {
          mergedUsers.set(u.id, u);
        }
      }
    }

    // Merge sessions
    if (data.sessions && typeof data.sessions === 'object') {
      Object.assign(mergedSessions, data.sessions);
    }

    // Merge audit logs
    if (Array.isArray(data.audit)) {
      for (const a of data.audit) {
        if (!a) continue;
        const key = a.id || deterministicId('audit', a.userId || 'system', a.action, a.createdAt || a.timestamp, typeof a.details === 'object' ? JSON.stringify(a.details) : (a.details || ''));
        if (!mergedAudit.has(key)) {
          mergedAudit.set(key, a);
        }
      }
    }

    // Merge will vault
    if (data.will_vault && typeof data.will_vault === 'object') {
      Object.assign(mergedWillVault, data.will_vault);
    }
  }

  return {
    users: Array.from(mergedUsers.values()),
    sessions: mergedSessions,
    audit: Array.from(mergedAudit.values()),
    will_vault: mergedWillVault
  };
}

function runMigration(options = {}) {
  const db = getDb(options.customDbPath);
  const userCountRow = db.prepare('SELECT count(*) as count FROM users').get();
  
  if (userCountRow && userCountRow.count > 0 && !options.force) {
    try {
      vaultService.migrateLegacyFiles({ db, workspaceRoot: options.rootDir });
    } catch (e) {
      void e;
    }
    const assetCount = db.prepare('SELECT count(*) as count FROM assets').get()?.count || 0;
    const auditCount = db.prepare('SELECT count(*) as count FROM audit_logs').get()?.count || 0;
    return {
      success: true,
      alreadyMigrated: true,
      userCount: userCountRow.count,
      assetCount,
      auditCount
    };
  }

  const legacyData = loadAllLegacySources(options.rootDir);
  const nowIso = new Date().toISOString();

  let stats = {
    users: 0,
    assets: 0,
    assetValueHistory: 0,
    assetTransactions: 0,
    liabilities: 0,
    documents: 0,
    expenses: 0,
    incomeStreams: 0,
    taxProfiles: 0,
    familyMembers: 0,
    goals: 0,
    alerts: 0,
    willVaults: 0,
    nominees: 0,
    auditLogs: 0,
    sessions: 0,
    totalAssetValue: 0
  };

  withTransaction(d => {
    // 1. Prepared Statements for batch inserts
    const insertUser = d.prepare(`
      INSERT OR REPLACE INTO users (id, name, email, user_type, password_hash, salt, created_at, updated_at, last_login, phone)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertCredentials = d.prepare(`
      INSERT OR REPLACE INTO user_credentials (user_id, password_hash, salt, mfa_secret, mfa_enabled, failed_login_attempts, lockout_until, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertSession = d.prepare(`
      INSERT OR REPLACE INTO user_sessions (token, user_id, refresh_token, expires_at, created_at, last_active_at, ip_address, user_agent)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

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
        photo_id, photo_name, photo_url, photo_file_id
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
      )
    `);

    const insertValueHistory = d.prepare(`
      INSERT OR REPLACE INTO asset_value_history (id, asset_id, value, date, note)
      VALUES (?, ?, ?, ?, ?)
    `);

    const insertAssetTransaction = d.prepare(`
      INSERT OR REPLACE INTO asset_transactions (
        id, asset_id, type, date, quantity, price, proceeds, cost_basis,
        realized_gain, tax_lot_method, allocations_json, ratio, amount, note
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertLiability = d.prepare(`
      INSERT OR REPLACE INTO liabilities (id, user_id, name, type, value, emi, rate, lender, source, last_updated, due_date)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertDocument = d.prepare(`
      INSERT OR REPLACE INTO documents (
        id, user_id, name, type, category, doc_number, owner, issue_date,
        expiry_date, renewal_date, status, linked_to_asset_id, required_for, notes,
        file_id, file_name, file_url, is_masked, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertExpense = d.prepare(`
      INSERT OR REPLACE INTO cashflow_transactions (
        id, user_id, family_member_id, account_id, amount, currency, type,
        transaction_date, merchant_payee, description, category, sub_category,
        payment_method, is_tax_deductible, receipt_file_id, receipt_url, notes, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertIncomeStream = d.prepare(`
      INSERT OR REPLACE INTO income_streams (
        id, user_id, name, category, amount, frequency, is_passive, status, tax_type,
        linked_asset_id, start_date, notes, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertTaxProfile = d.prepare(`
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

    const insertFamily = d.prepare(`
      INSERT OR REPLACE INTO family_members (id, user_id, name, relation, access_level, phone, email)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const insertGoal = d.prepare(`
      INSERT OR REPLACE INTO financial_goals (id, user_id, name, target_amount, saved_amount, deadline, priority)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const insertAlert = d.prepare(`
      INSERT OR REPLACE INTO reminders_alerts (id, user_id, name, date, priority, channel, linked_to)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const insertAuxData = d.prepare(`
      INSERT OR REPLACE INTO user_aux_data (
        user_id, cameras_json, camera_events_json, security_settings_json,
        last_parsed_payslip_json, expense_categories_json, activity_json, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertWillVault = d.prepare(`
      INSERT OR REPLACE INTO will_vault (
        user_id, status, vault_file_id, encrypted_blob, iv, auth_tag, encrypted_dek,
        uploaded_at, verified_at, will_draft_json, living_will_json, codicil_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertNominee = d.prepare(`
      INSERT OR REPLACE INTO will_nominees (id, user_id, name, email, phone, relationship, added_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const insertClaim = d.prepare(`
      INSERT OR REPLACE INTO will_claim_events (
        id, user_id, nominee_id, status, proof_file_id, proof_file_name, submitted_at, reviewed_at, reviewed_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertAudit = d.prepare(`
      INSERT OR REPLACE INTO audit_logs (id, user_id, action, details_json, created_at)
      VALUES (?, ?, ?, ?, ?)
    `);

    // 2. Iterate and migrate users
    for (const u of legacyData.users) {
      const uId = u.id || deterministicId('user', u.email || u.name);
      const uName = u.name || 'User';
      const uEmail = String(u.email || '').trim().toLowerCase();
      const uType = u.type || (u.email?.includes('ca') ? 'ca' : 'user');
      const uHash = u.passwordHash || u.password || '';
      const uSalt = u.salt || '';
      const uCreatedAt = u.createdAt || (u.created ? new Date(u.created).toISOString() : nowIso);
      const uUpdatedAt = u.updatedAt || nowIso;
      const uPhone = u.phone || '';
      const uLastLogin = u.lastLogin || null;

      insertUser.run(uId, uName, uEmail, uType, uHash, uSalt, uCreatedAt, uUpdatedAt, uLastLogin, uPhone);
      insertCredentials.run(uId, uHash, uSalt, null, 0, 0, null, uUpdatedAt);
      stats.users++;

      const uData = u.data || {};

      // Migrate Assets
      const assets = Array.isArray(uData.assets) ? uData.assets : [];
      for (const a of assets) {
        const aId = a.id || deterministicId('asset', uId, a.name, a.type, a.purchaseDate || a.acquisitionDate || '');
        const aVal = Number(a.value) || 0;
        stats.totalAssetValue += aVal;
        insertAsset.run(
          aId, uId, a.name || 'Untitled Asset', a.type || 'Asset', a.assetSubType || null,
          aVal, Number(a.purchasePrice) || 0, a.acquisitionDate || null,
          a.owner || null, a.location || null, a.ticker || null, a.sector || null, a.tags || null,
          a.purchaseDate || null, Number(a.buyPrice) || 0, Number(a.quantity) || 0,
          Number(a.currentPrice) || 0, a.currency || 'INR', Number(a.exchangeRate) || 1.0,
          Number(a.brokerageFees) || 0, a.lotId || null, Number(a.dividendsReceived) || 0,
          a.corporateActions || null, a.taxLotMethod || null, a.brand || null, a.model || null,
          a.referenceNumber || null, a.serialNumber || null, a.watchBoxPapers || null,
          a.watchMarketJson || null, Number(a.year) || null, Number(a.odometer) || 0,
          a.registrationNumber || null, a.area || null, a.condition || null, a.hasLoan || null,
          Number(a.loanAmount) || 0, Number(a.downPayment) || 0, Number(a.interestRate) || 0,
          Number(a.loanTenureYears) || 0, a.loanStartDate || null, Number(a.emiAmount) || 0,
          a.loanType || null, a.source || 'Manual', a.valuationBasis || null, a.estimatedValueDate || null,
          Number(a.valuationLow) || 0, Number(a.valuationHigh) || 0, a.valuationConfidence || null,
          a.lastUpdated || nowIso.slice(0, 10), a.note || null, a.renewal || null,
          a.photoId || null, a.photoName || null, a.photoUrl || null, null
        );
        stats.assets++;

        // Asset value history
        if (Array.isArray(a.valueHistory)) {
          for (const vh of a.valueHistory) {
            insertValueHistory.run(
              vh.id || deterministicId('val_history', aId, vh.date, vh.value, vh.note || ''),
              aId,
              Number(vh.value) || 0,
              vh.date || nowIso.slice(0, 10),
              vh.note || null
            );
            stats.assetValueHistory++;
          }
        }

        // Investment transactions
        if (Array.isArray(a.investmentTransactions)) {
          for (const it of a.investmentTransactions) {
            insertAssetTransaction.run(
              it.id || deterministicId('asset_tx', aId, it.date, it.type, it.quantity, it.price, it.amount),
              aId,
              it.type || 'Event',
              it.date || nowIso.slice(0, 10),
              Number(it.quantity) || 0,
              Number(it.price) || 0,
              Number(it.proceeds) || 0,
              Number(it.costBasis) || 0,
              Number(it.realizedGain) || 0,
              it.taxLotMethod || null,
              Array.isArray(it.allocations) ? JSON.stringify(it.allocations) : null,
              it.ratio || null,
              Number(it.amount) || 0,
              it.note || null
            );
            stats.assetTransactions++;
          }
        }
      }

      // Migrate Liabilities
      const liabilities = Array.isArray(uData.liabilities) ? uData.liabilities : [];
      for (const l of liabilities) {
        insertLiability.run(
          l.id || deterministicId('liability', uId, l.name, l.type, l.value),
          uId,
          l.name || 'Untitled Liability',
          l.type || 'Liability',
          Number(l.value) || 0,
          Number(l.emi) || 0,
          Number(l.rate) || 0,
          l.lender || null,
          l.source || 'Manual',
          l.lastUpdated || nowIso.slice(0, 10),
          l.dueDate || null
        );
        stats.liabilities++;
      }

      // Migrate Documents
      const documents = Array.isArray(uData.documents) ? uData.documents : [];
      for (const doc of documents) {
        insertDocument.run(
          doc.id || deterministicId('document', uId, doc.name, doc.type, doc.docNumber || doc.fileId || ''),
          uId,
          doc.name || 'Untitled Document',
          doc.type || 'Document',
          doc.category || 'other',
          doc.docNumber || null,
          doc.owner || 'Self',
          doc.issueDate || null,
          doc.expiry || doc.renewal || null,
          doc.renewal || doc.expiry || null,
          doc.status || 'Stored',
          doc.linkedTo || null,
          doc.requiredFor || null,
          doc.notes || null,
          doc.fileId || null,
          doc.fileName || null,
          doc.fileUrl || null,
          doc.isMasked ? 1 : 0,
          nowIso
        );
        stats.documents++;
      }

      // Migrate Expenses
      const expenses = Array.isArray(uData.expenses) ? uData.expenses : (Array.isArray(u.expenses) ? u.expenses : []);
      for (const exp of expenses) {
        insertExpense.run(
          exp.id || deterministicId('expense', uId, exp.transactionDate || exp.transaction_date, exp.amount, exp.merchantOrPayee || exp.merchant_payee || exp.description || exp.category),
          uId,
          exp.familyMemberId || null,
          exp.accountId || null,
          Number(exp.amount) || 0,
          exp.currency || 'INR',
          exp.type || 'debit',
          exp.transactionDate || nowIso.slice(0, 10),
          exp.merchantOrPayee || exp.description || 'Unknown',
          exp.description || null,
          exp.category || 'Other',
          exp.subCategory || null,
          exp.paymentMethod || 'Manual Entry',
          exp.isTaxDeductible ? 1 : 0,
          exp.receiptFileId || null,
          exp.receiptUrl || null,
          exp.notes || null,
          exp.createdAt || nowIso,
          exp.updatedAt || nowIso
        );
        stats.expenses++;
      }

      // Migrate Income Streams
      const incomeStreams = Array.isArray(uData.incomeStreams) ? uData.incomeStreams : [];
      for (const inc of incomeStreams) {
        insertIncomeStream.run(
          inc.id || deterministicId('income', uId, inc.name, inc.amount, inc.frequency),
          uId,
          inc.name || 'Income Stream',
          inc.category || 'salary',
          Number(inc.amount) || 0,
          inc.frequency || 'monthly',
          inc.isPassive ? 1 : 0,
          inc.status || 'active',
          inc.taxType || 'taxable',
          inc.linkedAssetId || null,
          inc.startDate || null,
          inc.notes || null,
          inc.createdAt || nowIso,
          inc.updatedAt || nowIso
        );
        stats.incomeStreams++;
      }

      // Migrate Tax & Income Profile
      const incDet = uData.incomeDetails || {};
      const taxDed = uData.taxDeductions || {};
      insertTaxProfile.run(
        uId,
        taxDed.selectedRegime || 'New Regime',
        Number(incDet.basicSalary) || 0,
        Number(incDet.hra) || 0,
        Number(incDet.specialAllowance) || 0,
        Number(incDet.bonus) || 0,
        Number(incDet.otherAllowances) || 0,
        Number(incDet.employerPf) || 0,
        Number(incDet.professionalTax) || 0,
        Number(incDet.otherIncome) || 0,
        Number(incDet.bankInterest) || 0,
        Number(incDet.dividendIncome) || 0,
        Number(incDet.rentalIncome) || 0,
        Number(incDet.rentPaid) || 0,
        incDet.isMetro ? 1 : 0,
        Number(incDet.stcgEquity) || 0,
        Number(incDet.ltcgEquity) || 0,
        Number(incDet.stclBroughtForward) || 0,
        Number(incDet.ltclBroughtForward) || 0,
        Number(incDet.freelanceIncome) || 0,
        Number(incDet.municipalTaxes) || 0,
        Number(incDet.tdsPaid) || 0,
        Number(incDet.advanceTaxPaid) || 0,
        Number(taxDed.sec80C) || 0,
        Number(taxDed.sec80CCD1B) || 0,
        Number(taxDed.sec80D) || 0,
        Number(taxDed.homeLoanInterest) || 0,
        Number(taxDed.profTax) || 0,
        Number(taxDed.sec80TTA) || 0,
        Number(taxDed.sec80E) || 0,
        Number(taxDed.sec80EEA) || 0,
        Number(taxDed.sec80G) || 0,
        Number(taxDed.sec80GG) || 0,
        incDet._frequency || 'monthly',
        incDet._sourceDocument || null,
        Number(uData.incomeTarget) || 200000,
        Number(uData.cash?.income) || 0,
        Number(uData.cash?.expenses) || 0,
        nowIso
      );
      stats.taxProfiles++;

      // Migrate Family Members
      const family = Array.isArray(uData.family) ? uData.family : [];
      for (const f of family) {
        insertFamily.run(
          f.id || deterministicId('family', uId, f.name, f.relation, f.email || f.phone || ''),
          uId,
          f.name || 'Family Member',
          f.relation || 'Self',
          f.access || 'View only',
          f.phone || null,
          f.email || null
        );
        stats.familyMembers++;
      }

      // Migrate Goals
      const goals = Array.isArray(uData.goals) ? uData.goals : [];
      for (const g of goals) {
        insertGoal.run(
          g.id || deterministicId('goal', uId, g.name, g.target || g.target_amount, g.deadline || ''),
          uId,
          g.name || 'Goal',
          Number(g.target) || 0,
          Number(g.saved) || 0,
          g.deadline || null,
          g.priority || 'Normal'
        );
        stats.goals++;
      }

      // Migrate Alerts
      const alerts = Array.isArray(uData.alerts) ? uData.alerts : [];
      for (const al of alerts) {
        insertAlert.run(
          al.id || deterministicId('alert', uId, al.name, al.date, al.channel || ''),
          uId,
          al.name || 'Reminder',
          al.date || nowIso.slice(0, 10),
          al.priority || 'Normal',
          al.channel || 'In-app',
          al.linkedTo || null
        );
        stats.alerts++;
      }

      // Migrate Aux Data (cameras, activity, security settings, etc.)
      insertAuxData.run(
        uId,
        Array.isArray(uData.cameras) ? JSON.stringify(uData.cameras) : null,
        Array.isArray(uData.cameraEvents) ? JSON.stringify(uData.cameraEvents) : null,
        uData.securitySettings ? JSON.stringify(uData.securitySettings) : null,
        uData.lastParsedPayslip ? JSON.stringify(uData.lastParsedPayslip) : null,
        Array.isArray(uData.expenseCategories) ? JSON.stringify(uData.expenseCategories) : null,
        Array.isArray(uData.activity) ? JSON.stringify(uData.activity) : null,
        nowIso
      );

      // Will Vault for this user (if present in will_vault or user data)
      const willVaultEntry = legacyData.will_vault[uId] || uData.willVault;
      if (willVaultEntry && typeof willVaultEntry === 'object') {
        insertWillVault.run(
          uId,
          willVaultEntry.status || 'PENDING_VERIFICATION',
          null,
          willVaultEntry.encrypted_blob || null,
          willVaultEntry.iv || null,
          willVaultEntry.authTag || null,
          willVaultEntry.encrypted_dek || null,
          willVaultEntry.uploadedAt || nowIso,
          willVaultEntry.verifiedAt || null,
          uData.willDraft ? JSON.stringify(uData.willDraft) : null,
          uData.livingWill ? JSON.stringify(uData.livingWill) : null,
          uData.codicil ? JSON.stringify(uData.codicil) : null
        );
        stats.willVaults++;

        if (Array.isArray(willVaultEntry.nominees)) {
          for (const nom of willVaultEntry.nominees) {
            insertNominee.run(
              nom.id || deterministicId('nominee', uId, nom.name, nom.email || nom.relationship),
              uId,
              nom.name || 'Nominee',
              nom.email || '',
              nom.phone || '',
              nom.relationship || 'Nominee',
              nom.addedAt || nowIso
            );
            stats.nominees++;
          }
        }

        if (willVaultEntry.trigger_event && typeof willVaultEntry.trigger_event === 'object') {
          const trig = willVaultEntry.trigger_event;
          insertClaim.run(
            trig.id || deterministicId('claim', uId, trig.nomineeId, trig.submittedAt || trig.status),
            uId,
            trig.nomineeId || 'unknown',
            trig.status || 'UNDER_REVIEW',
            null,
            trig.proofFileName || 'proof',
            trig.submittedAt || nowIso,
            null,
            null
          );
        }
      }
    }

    // 3. Migrate Sessions
    const nowTime = Date.now();
    for (const [token, sess] of Object.entries(legacyData.sessions)) {
      if (!sess || !sess.userId) continue;
      const createdAt = sess.createdAt ? new Date(sess.createdAt).toISOString() : nowIso;
      const expiresAt = new Date(nowTime + 1000 * 60 * 60 * 24 * 14).toISOString();
      insertSession.run(token, sess.userId, null, expiresAt, createdAt, createdAt, null, null);
      stats.sessions++;
    }

    // 4. Migrate Audit Logs
    for (const log of legacyData.audit) {
      const aId = log.id || deterministicId('audit', log.userId || 'system', log.action, log.createdAt || log.timestamp, typeof log.details === 'object' ? JSON.stringify(log.details) : (log.details || ''));
      const aUserId = log.userId || null;
      const aAction = log.action || 'SYSTEM';
      const aDetails = typeof log.details === 'object' ? JSON.stringify(log.details) : (log.details ? String(log.details) : null);
      const aCreatedAt = log.createdAt || log.timestamp || nowIso;
      insertAudit.run(aId, aUserId, aAction, aDetails, aCreatedAt);
      stats.auditLogs++;
    }
  }, 5, db);

  try {
    vaultService.migrateLegacyFiles({ db, workspaceRoot: options.rootDir });
  } catch (err) {
    console.warn('[Migrate] Vault migration warning:', err.message);
  }

  // Post-migration fidelity validation
  const finalUsers = db.prepare('SELECT count(*) as count FROM users').get().count;
  const finalAssets = db.prepare('SELECT count(*) as count FROM assets').get().count;
  const finalLiabilities = db.prepare('SELECT count(*) as count FROM liabilities').get().count;
  const finalDocs = db.prepare('SELECT count(*) as count FROM documents').get().count;
  const finalAudit = db.prepare('SELECT count(*) as count FROM audit_logs').get().count;
  const finalAssetSum = db.prepare('SELECT SUM(value) as total FROM assets').get().total || 0;

  // Check critical named assets exist
  const nissanAsset = db.prepare("SELECT * FROM assets WHERE name LIKE '%Nissan%' OR model LIKE '%Nissan%'").get();
  const rolexAsset = db.prepare("SELECT * FROM assets WHERE name LIKE '%rolex%' OR brand LIKE '%Rolex%'").get();
  const realEstateAssets = db.prepare("SELECT * FROM assets WHERE type IN ('Flats', 'Land', 'Real Estate')").all();

  const checksumHasher = crypto.createHash('sha256');
  checksumHasher.update(JSON.stringify({
    finalUsers,
    finalAssets,
    finalLiabilities,
    finalDocs,
    finalAudit,
    finalAssetSum,
    hasNissan: Boolean(nissanAsset),
    hasRolex: Boolean(rolexAsset),
    realEstateCount: realEstateAssets.length
  }));
  const migrationChecksum = checksumHasher.digest('hex');

  console.log(`[Migrate] Complete! Users: ${finalUsers}, Assets: ${finalAssets} (₹${finalAssetSum.toLocaleString('en-IN')}), Liabilities: ${finalLiabilities}, Documents: ${finalDocs}, Audit Logs: ${finalAudit}`);
  console.log(`[Migrate] Integrity Checksum: ${migrationChecksum}`);

  return {
    success: true,
    alreadyMigrated: false,
    stats,
    verification: {
      usersCount: finalUsers,
      assetsCount: finalAssets,
      liabilitiesCount: finalLiabilities,
      documentsCount: finalDocs,
      auditLogsCount: finalAudit,
      totalAssetValue: finalAssetSum,
      hasNissan: Boolean(nissanAsset),
      hasRolex: Boolean(rolexAsset),
      realEstateCount: realEstateAssets.length,
      checksum: migrationChecksum
    }
  };
}

module.exports = {
  runMigration,
  loadAllLegacySources,
  decryptLegacyDb
};
