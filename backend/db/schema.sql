-- ============================================================================
-- Wealth OS Enterprise Relational Database Schema (SQLite WAL Mode)
-- ============================================================================

-- 1. Users & Authentication
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    user_type TEXT NOT NULL DEFAULT 'user', -- 'user', 'ca', 'admin'
    password_hash TEXT,
    salt TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    last_login TEXT,
    phone TEXT
);

CREATE TABLE IF NOT EXISTS user_credentials (
    user_id TEXT PRIMARY KEY,
    password_hash TEXT NOT NULL,
    salt TEXT,
    mfa_secret TEXT,
    mfa_enabled INTEGER NOT NULL DEFAULT 0,
    failed_login_attempts INTEGER NOT NULL DEFAULT 0,
    lockout_until TEXT,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS user_sessions (
    token TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    refresh_token TEXT,
    expires_at TEXT NOT NULL,
    created_at TEXT NOT NULL,
    last_active_at TEXT NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 2. Persistent Rate Limiting
CREATE TABLE IF NOT EXISTS rate_limit_records (
    ip_key TEXT PRIMARY KEY,
    attempt_count INTEGER NOT NULL DEFAULT 1,
    first_attempt_at INTEGER NOT NULL,
    last_attempt_at INTEGER NOT NULL,
    blocked_until INTEGER
);

-- 3. Assets & Valuation Engine
CREATE TABLE IF NOT EXISTS assets (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    asset_sub_type TEXT,
    value REAL NOT NULL DEFAULT 0,
    purchase_price REAL NOT NULL DEFAULT 0,
    acquisition_date TEXT,
    owner TEXT,
    location TEXT,
    ticker TEXT,
    sector TEXT,
    tags TEXT,
    purchase_date TEXT,
    buy_price REAL DEFAULT 0,
    quantity REAL DEFAULT 0,
    current_price REAL DEFAULT 0,
    currency TEXT DEFAULT 'INR',
    exchange_rate REAL DEFAULT 1.0,
    brokerage_fees REAL DEFAULT 0,
    lot_id TEXT,
    dividends_received REAL DEFAULT 0,
    corporate_actions TEXT,
    tax_lot_method TEXT,
    brand TEXT,
    model TEXT,
    reference_number TEXT,
    serial_number TEXT,
    watch_box_papers TEXT,
    watch_market_json TEXT,
    year INTEGER,
    odometer REAL DEFAULT 0,
    registration_number TEXT,
    area TEXT,
    condition TEXT,
    has_loan TEXT,
    loan_amount REAL DEFAULT 0,
    down_payment REAL DEFAULT 0,
    interest_rate REAL DEFAULT 0,
    loan_tenure_years REAL DEFAULT 0,
    loan_start_date TEXT,
    emi_amount REAL DEFAULT 0,
    loan_type TEXT,
    source TEXT DEFAULT 'Manual',
    valuation_basis TEXT,
    estimated_value_date TEXT,
    valuation_low REAL DEFAULT 0,
    valuation_high REAL DEFAULT 0,
    valuation_confidence TEXT,
    last_updated TEXT NOT NULL,
    note TEXT,
    renewal_date TEXT,
    photo_id TEXT,
    photo_name TEXT,
    photo_url TEXT,
    photo_file_id TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS asset_value_history (
    id TEXT PRIMARY KEY,
    asset_id TEXT NOT NULL,
    value REAL NOT NULL,
    date TEXT NOT NULL,
    note TEXT,
    FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS asset_transactions (
    id TEXT PRIMARY KEY,
    asset_id TEXT NOT NULL,
    type TEXT NOT NULL,
    date TEXT NOT NULL,
    quantity REAL DEFAULT 0,
    price REAL DEFAULT 0,
    proceeds REAL DEFAULT 0,
    cost_basis REAL DEFAULT 0,
    realized_gain REAL DEFAULT 0,
    tax_lot_method TEXT,
    allocations_json TEXT,
    ratio TEXT,
    amount REAL DEFAULT 0,
    note TEXT,
    FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE CASCADE
);

-- 4. Liabilities
CREATE TABLE IF NOT EXISTS liabilities (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    value REAL NOT NULL DEFAULT 0,
    emi REAL DEFAULT 0,
    rate REAL DEFAULT 0,
    lender TEXT,
    source TEXT DEFAULT 'Manual',
    last_updated TEXT NOT NULL,
    due_date TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 5. Persistent Vault & Document Metadata
CREATE TABLE IF NOT EXISTS vault_files (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    original_name TEXT NOT NULL,
    stored_path TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    size_bytes INTEGER NOT NULL DEFAULT 0,
    sha256_checksum TEXT NOT NULL,
    encrypted_dek TEXT,
    iv TEXT,
    auth_tag TEXT,
    uploaded_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS documents (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    category TEXT DEFAULT 'other',
    doc_number TEXT,
    owner TEXT DEFAULT 'Self',
    issue_date TEXT,
    expiry_date TEXT,
    renewal_date TEXT,
    status TEXT DEFAULT 'Stored',
    linked_to_asset_id TEXT,
    required_for TEXT,
    notes TEXT,
    file_id TEXT,
    file_name TEXT,
    file_url TEXT,
    is_masked INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 6. Digital Will Vault
CREATE TABLE IF NOT EXISTS will_vault (
    user_id TEXT PRIMARY KEY,
    status TEXT NOT NULL,
    vault_file_id TEXT,
    encrypted_blob TEXT,
    iv TEXT,
    auth_tag TEXT,
    encrypted_dek TEXT,
    uploaded_at TEXT NOT NULL,
    verified_at TEXT,
    will_draft_json TEXT,
    living_will_json TEXT,
    codicil_json TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS will_nominees (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    relationship TEXT NOT NULL,
    added_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS will_claim_events (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    nominee_id TEXT NOT NULL,
    status TEXT NOT NULL,
    proof_file_id TEXT,
    proof_file_name TEXT,
    submitted_at TEXT NOT NULL,
    reviewed_at TEXT,
    reviewed_by TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (nominee_id) REFERENCES will_nominees(id) ON DELETE CASCADE
);

-- 7. Cashflow & Expense Intelligence
CREATE TABLE IF NOT EXISTS cashflow_transactions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    family_member_id TEXT,
    account_id TEXT,
    amount REAL NOT NULL,
    currency TEXT DEFAULT 'INR',
    type TEXT NOT NULL,
    transaction_date TEXT NOT NULL,
    merchant_payee TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    sub_category TEXT,
    payment_method TEXT DEFAULT 'Manual Entry',
    is_tax_deductible INTEGER NOT NULL DEFAULT 0,
    receipt_file_id TEXT,
    receipt_url TEXT,
    notes TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 8. Income Streams, Details & Tax Deductions
CREATE TABLE IF NOT EXISTS income_streams (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    amount REAL NOT NULL,
    frequency TEXT NOT NULL DEFAULT 'monthly',
    is_passive INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'active',
    tax_type TEXT DEFAULT 'taxable',
    linked_asset_id TEXT,
    start_date TEXT,
    notes TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS user_income_tax_profile (
    user_id TEXT PRIMARY KEY,
    selected_regime TEXT DEFAULT 'New Regime',
    basic_salary REAL DEFAULT 0,
    hra REAL DEFAULT 0,
    special_allowance REAL DEFAULT 0,
    bonus REAL DEFAULT 0,
    other_allowances REAL DEFAULT 0,
    employer_pf REAL DEFAULT 0,
    professional_tax REAL DEFAULT 0,
    other_income REAL DEFAULT 0,
    bank_interest REAL DEFAULT 0,
    dividend_income REAL DEFAULT 0,
    rental_income REAL DEFAULT 0,
    rent_paid REAL DEFAULT 0,
    is_metro INTEGER DEFAULT 0,
    stcg_equity REAL DEFAULT 0,
    ltcg_equity REAL DEFAULT 0,
    stcl_brought_forward REAL DEFAULT 0,
    ltcl_brought_forward REAL DEFAULT 0,
    freelance_income REAL DEFAULT 0,
    municipal_taxes REAL DEFAULT 0,
    tds_paid REAL DEFAULT 0,
    advance_tax_paid REAL DEFAULT 0,
    sec_80c REAL DEFAULT 0,
    sec_80ccd1b REAL DEFAULT 0,
    sec_80d REAL DEFAULT 0,
    home_loan_interest REAL DEFAULT 0,
    prof_tax_deduction REAL DEFAULT 0,
    sec_80tta REAL DEFAULT 0,
    sec_80e REAL DEFAULT 0,
    sec_80eea REAL DEFAULT 0,
    sec_80g REAL DEFAULT 0,
    sec_80gg REAL DEFAULT 0,
    income_frequency TEXT,
    source_document TEXT,
    income_target REAL DEFAULT 200000,
    cash_income REAL DEFAULT 0,
    cash_expenses REAL DEFAULT 0,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 9. Taxpayer Profile Data & Consents
CREATE TABLE IF NOT EXISTS taxpayer_profile_fields (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    category TEXT NOT NULL,
    field_key TEXT NOT NULL,
    field_value TEXT,
    source TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    UNIQUE(user_id, category, field_key),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS consents (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    purpose TEXT NOT NULL,
    provider_category TEXT NOT NULL,
    consent_version TEXT NOT NULL,
    status TEXT NOT NULL,
    granted_at TEXT NOT NULL,
    withdrawn_at TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 10. Family, Goals, Reminders & Auxiliary Data
CREATE TABLE IF NOT EXISTS family_members (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    relation TEXT NOT NULL,
    access_level TEXT DEFAULT 'View only',
    phone TEXT,
    email TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS financial_goals (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    target_amount REAL NOT NULL,
    saved_amount REAL DEFAULT 0,
    deadline TEXT,
    priority TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS reminders_alerts (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    date TEXT NOT NULL,
    priority TEXT DEFAULT 'Normal',
    channel TEXT DEFAULT 'In-app',
    linked_to TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS user_aux_data (
    user_id TEXT PRIMARY KEY,
    cameras_json TEXT,
    camera_events_json TEXT,
    security_settings_json TEXT,
    last_parsed_payslip_json TEXT,
    expense_categories_json TEXT,
    activity_json TEXT,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 11. Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    action TEXT NOT NULL,
    details_json TEXT,
    created_at TEXT NOT NULL
);

-- 12. Performance Indices
CREATE INDEX IF NOT EXISTS idx_assets_user ON assets(user_id);
CREATE INDEX IF NOT EXISTS idx_cashflow_user_date ON cashflow_transactions(user_id, transaction_date);
CREATE INDEX IF NOT EXISTS idx_documents_user ON documents(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_user_created ON audit_logs(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_liabilities_user ON liabilities(user_id);
CREATE INDEX IF NOT EXISTS idx_consents_user ON consents(user_id);
CREATE INDEX IF NOT EXISTS idx_profile_fields_user ON taxpayer_profile_fields(user_id);
CREATE INDEX IF NOT EXISTS idx_income_streams_user ON income_streams(user_id);
