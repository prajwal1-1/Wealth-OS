# Wealth OS Enterprise Test Infrastructure Specification

## 1. Test Philosophy & Architecture

The Wealth OS enterprise verification harness is engineered according to the following quality principles:
- **Opaque-Box & Requirement-Driven**: Tests validate system behavior, interface contracts, cryptographic guarantees, and statutory financial regulations against strict mathematical benchmarks and specifications defined in `ORIGINAL_REQUEST.md` and `PROJECT.md`, without coupling to ephemeral internal implementation details.
- **Progressive Testability & Zero Flakiness**: Tests are isolated, deterministic, and self-contained. Each test creates and cleans its own test fixtures without relying on side-effects from preceding tests.
- **Authoritative Oracles**: Every financial calculation (depreciation, dual-regime tax slabs, loan amortization, 50/30/20 budget breakdown) is verified against authoritative mathematical derivations with exact **₹1 tolerance**.
- **Four-Tier Comprehensive Structure**:
  - **Tier 1 (Feature Coverage)**: Category-partition testing with $\ge 5$ explicit test cases per feature across all 14 core features (70 test cases).
  - **Tier 2 (Boundary & Corner Cases)**: Boundary Value Analysis (BVA), extreme values, zero-divisions, overflow thresholds, unicode, and security boundaries across all 14 features (70 test cases).
  - **Tier 3 (Cross-Feature Pairwise Interactions)**: Complex interaction flows combining database, vault, authentication, token rotation, rate limiting, and financial calculations (15 flows).
  - **Tier 4 (Real-World Application Scenarios)**: High-load production scenarios verifying 50+ concurrent transactions without data corruption, 100% data migration fidelity (11 users, Nissan Magnite, Real Estate, Rolex, 180+ audit logs), security defenses across restarts, and ₹1 tolerance financial calculations (14 scenarios).

---

## 2. Feature Coverage Matrix (F1 to F14)

| # | Feature | Scope / Subsystem | Tier 1 Tests | Tier 2 Boundaries | Tier 3 Pairwise | Tier 4 Scenarios | Total Tests |
|---|---------|-------------------|:------------:|:-----------------:|:---------------:|:----------------:|:-----------:|
| **F1** | SQLite WAL Relational Engine | Database Layer | 5 | 5 | 5 | 2 | **17** |
| **F2** | Zero-Downtime Data Migration | Migration Layer | 5 | 5 | 4 | 3 | **17** |
| **F3** | Atomic Balance Sheet & Cashflow Transactions | Transactions | 5 | 5 | 5 | 2 | **17** |
| **F4** | Persistent Encrypted Vault Storage | Storage / Vault | 5 | 5 | 4 | 1 | **15** |
| **F5** | Secure Access Tokens & Stream Integrity | Security / Tokens | 5 | 5 | 4 | 1 | **15** |
| **F6** | Master Encryption Key Isolation | Key Management | 5 | 5 | 3 | 1 | **14** |
| **F7** | Bcrypt (12 rounds) Password Hashing | Authentication | 5 | 5 | 3 | 1 | **14** |
| **F8** | Signed JWTs & Refresh Token Rotation | Auth / Sessions | 5 | 5 | 4 | 1 | **15** |
| **F9** | TOTP / MFA Authentication | Multi-Factor Auth | 5 | 5 | 3 | 0 | **13** |
| **F10** | Persistent Rate Limiting | Security / Defense | 5 | 5 | 4 | 1 | **15** |
| **F11** | Concurrency Safety & Stress Testing | Performance / ACID | 5 | 5 | 3 | 2 | **15** |
| **F12** | Data Migration Fidelity Verification | Integrity / Audit | 5 | 5 | 4 | 3 | **17** |
| **F13** | Security Defenses Verification | Security / IDOR | 5 | 5 | 4 | 2 | **16** |
| **F14** | Financial Calculation Integrity | Calculation Engine | 5 | 5 | 4 | 5 | **19** |
| **TOTAL** | | | **70** | **70** | **15** | **14** | **169** |

---

## 3. Tier 1: Feature Coverage (70 Tests)

### Feature 1: SQLite WAL Relational Engine (M1)
- **F1.1**: Verifies SQLite Write-Ahead Logging (`WAL`), `PRAGMA synchronous = NORMAL`, and `PRAGMA busy_timeout >= 5000`.
- **F1.2**: Foreign key constraint enforcement ensuring cascade deletes across `assets`, `liabilities`, and `documents` when parent user is removed.
- **F1.3**: DDL relational schema verification ensuring all 11 required tables (`users`, `user_profiles`, `assets`, `liabilities`, `documents`, `will_vault`, `cashflow_transactions`, `refresh_tokens`, `rate_limit_records`, `consents`, `audit_logs`) exist with primary/unique constraints.
- **F1.4**: Transactional isolation ensuring uncommitted writes remain isolated until `COMMIT`.
- **F1.5**: Lock contention recovery and busy timeout retry semantics.

### Feature 2: Zero-Downtime Data Migration (M1)
- **F2.1**: Automated migration ingestion of 100% legacy user accounts ($\ge 11$ users) from JSON export into SQLite tables.
- **F2.2**: Preservation of polymorphic asset inventory for Prajwal Bharad including Nissan Magnite (`Car`), Real Estate (`Land`, `Flats`), Luxury Watches (`Rolex`), and Equities (`Tata Power`).
- **F2.3**: Ingestion and relational mapping of all liabilities, loan amounts, interest rates, and EMIs.
- **F2.4**: Historical audit trail migration preserving all 180+ historical system audit events.
- **F2.5**: User profile JSON data and taxpayer consents migration.

### Feature 3: Atomic Balance Sheet & Cashflow Transactions (M1)
- **F3.1**: Atomic rollback on unhandled transaction error leaving previous asset valuations unaltered.
- **F3.2**: Cashflow ledger credit and debit transaction balancing invariant.
- **F3.3**: Multi-statement transactional encapsulation via `withTransaction()` callback helper.
- **F3.4**: Atomic net worth synchronization: $\text{NetWorth} = \text{TotalAssets} - \text{TotalLiabilities}$.
- **F3.5**: Dirty read prevention under transaction rollback.

### Feature 4: Persistent Encrypted Vault Storage (M2)
- **F4.1**: AES-256-GCM enveloped encryption of user documents with per-file Data Encryption Keys (DEKs) wrapped by master key.
- **F4.2**: Decryption and byte-for-byte retrieval of vault documents.
- **F4.3**: Directory path isolation under dedicated persistent repository `storage/vault/<userId>/`.
- **F4.4**: Prevention of plaintext document storage on disk.
- **F4.5**: Digital will encrypted blob and wrapped DEK storage in vault.

### Feature 5: Secure Access Tokens & Stream Integrity (M2)
- **F5.1**: Issuance and validation of short-lived HMAC access tokens (60s validity).
- **F5.2**: Rejection of expired access tokens.
- **F5.3**: Rejection of forged or tampered access token signatures.
- **F5.4**: SHA-256 stream integrity checksum verification on document download.
- **F5.5**: IDOR protection preventing cross-user token reuse.

### Feature 6: Master Encryption Key Isolation (M3)
- **F6.1**: Runtime master key injection strictly via `process.env.WEALTH_OS_DB_KEY`.
- **F6.2**: Elimination of plaintext key files (`wealth-os-db.key`) from data and git-tracked directories.
- **F6.3**: Cryptographic entropy validation (32 bytes / 256 bits).
- **F6.4**: Startup validation rejecting empty or malformed master keys.
- **F6.5**: Zero leakage of master key in logs, database dumps, or API responses.

### Feature 7: Bcrypt (12 rounds) Password Hashing (M3)
- **F7.1**: Password hashing using salted bcrypt with cost factor 12 (`$2b$12$...`).
- **F7.2**: Password verification success on correct credentials.
- **F7.3**: Password verification rejection on invalid credentials.
- **F7.4**: Elimination of backdoor login credentials (`'password'`).
- **F7.5**: Transparent upgrade of legacy scrypt/sha256 credentials to 12-round bcrypt upon login.

### Feature 8: Signed JWTs & Refresh Token Rotation (M3)
- **F8.1**: Issuance and validation of signed short-lived JWT access tokens (15-minute expiry).
- **F8.2**: Database-backed persistent refresh token creation (7-day validity).
- **F8.3**: Refresh token rotation revoking previous token and issuing new token pair.
- **F8.4**: Reuse detection revoking sessions on attempted replay of invalidated refresh tokens.
- **F8.5**: Rejection of expired access tokens and invalid signatures.

### Feature 9: TOTP / MFA Authentication (M3)
- **F9.1**: RFC 6238 TOTP secret generation and `otpauth://` QR URI creation.
- **F9.2**: Verification of valid 6-digit TOTP codes for current time window.
- **F9.3**: Drift tolerance window check ($T-30\text{s}, T, T+30\text{s}$).
- **F9.4**: Rejection of invalid, malformed, or expired TOTP codes.
- **F9.5**: Replay attack protection within the same 30s window.

### Feature 10: Persistent Rate Limiting (M3)
- **F10.1**: Persistent recording of failed authentication attempts in SQLite `rate_limit_records` table.
- **F10.2**: IP-based rate limiting threshold enforcement (5 attempts / 15 min).
- **F10.3**: Email/account-based rate limiting to thwart distributed brute-force attacks.
- **F10.4**: Persistence of lockout status across simulated process crashes and server restarts.
- **F10.5**: Window expiration and counter reset after window duration.

### Feature 11: Concurrency Safety & Stress Testing (M4)
- **F11.1**: 50+ simultaneous transactions without database corruption or lock deadlock.
- **F11.2**: Concurrent balance sheet writes preserving exact arithmetic sum.
- **F11.3**: WAL mode concurrency allowing simultaneous read queries during active write transactions.
- **F11.4**: Structural integrity validation via `PRAGMA integrity_check`.
- **F11.5**: Lock contention recovery with busy timeout retries.

### Feature 12: Data Migration Fidelity Verification (M4)
- **F12.1**: Pre- vs post-migration user count exact match ($\ge 11$ users).
- **F12.2**: Prajwal Bharad asset inventory fidelity (9 assets, exact value matching).
- **F12.3**: Nissan Magnite vehicle asset attributes and loan parameters fidelity.
- **F12.4**: Real estate and luxury watch inventory values matching pre-migration totals.
- **F12.5**: Audit logs count match (180+ events) and payload integrity.

### Feature 13: Security Defenses Verification (M4)
- **F13.1**: Token tampering detection rejecting altered payloads or forged signatures.
- **F13.2**: IDOR defense preventing cross-tenant document and profile access.
- **F13.3**: Elimination of default user impersonation fallback in auth middleware.
- **F13.4**: Rejection of unauthenticated requests to protected API endpoints.
- **F13.5**: CA practice management role-based authorization guard preventing unauthorized client impersonation.

### Feature 14: Financial Calculation Integrity (M4)
- **F14.1**: Nissan Magnite vehicle depreciation matching benchmark ₹9,20,000 within ₹1 tolerance.
- **F14.2**: High salary New Tax Regime AY 2025-26 tax matching benchmark ₹1,69,000 within ₹1 tolerance.
- **F14.3**: Section 87A full rebate zero-tax threshold matching ₹0 within ₹1 tolerance.
- **F14.4**: Section 87A marginal relief tax matching benchmark ₹10,400 within ₹1 tolerance.
- **F14.5**: Car Loan 84-month amortization at month 22 matching benchmark ₹6,40,006 remaining balance and ₹13,323 EMI within ₹1 tolerance.

---

## 4. Tier 2: Boundary & Corner Cases (70 Tests)

- **F1 Boundaries**: Zero-length IDs, 10MB payload JSON storage, maximum 64-bit float values (₹999,999,999,999), multibyte Unicode/emojis, and exception rollback.
- **F2 Boundaries**: Users with empty assets/liabilities, sparse assets with missing optional fields, corrupted record skipping without halting migration, 1000+ asset batch ingestion, and password format detection.
- **F3 Boundaries**: ₹0 asset valuation update, negative net worth calculation, 0-amount cashflow entry, multi-item batch rollback on 5th failure, and paise decimal precision preservation.
- **F4 Boundaries**: 0-byte file encryption roundtrip, 5MB binary buffer stream encryption, path traversal filename sanitization (`../../etc/passwd`), corrupted auth tag rejection, and mismatched master key rejection.
- **F5 Boundaries**: Exact expiration boundary ($T+60\text{s}$ vs $T+61\text{s}$), 1-bit modified signature rejection, malformed base64url parsing, empty token string, and file ID mismatch.
- **F6 Boundaries**: Key lengths (63 chars, 65 chars), non-hex character rejection, leading/trailing whitespace trimming, and empty key validation.
- **F7 Boundaries**: Empty password string rejection, 72-byte bcrypt limit boundary, 1000-char password handling, multibyte UTF-8 passwords with emojis, and minimum 12 rounds cost enforcement.
- **F8 Boundaries**: Exact JWT expiration boundary ($T-1\text{s}$ vs $T+1\text{s}$), malformed Authorization headers, `alg: none` signature evasion attack rejection, empty refresh tokens, and concurrent double-spend race condition.
- **F9 Boundaries**: TOTP exact 30-second window step boundary, leading zeroes formatting (e.g. "004321"), length validations (5, 7, 8 digits), non-digit character rejection, and replay rejection.
- **F10 Boundaries**: Exact `maxAttempts` boundary (5 allowed, 6 blocked), window expiry boundary, IPv6 address normalization (`::1`, `::ffff:127.0.0.1`), case-insensitive email normalization, and 100 concurrent rapid attempts.
- **F11 Boundaries**: 100 concurrent writes to the exact same row, abrupt transaction abort without orphan locks, 10 sequential savepoints inside transaction, alternating debit/credit balance invariance, and passive WAL checkpointing.
- **F12 Boundaries**: Sub-paise float rounding, duplicate email deduplication, empty string name fallback, historical dates (1990-2050), and SHA-256 data fidelity hashing.
- **F13 Boundaries**: SQL injection attempt escaping in prepared statements, XSS HTML tag sanitization in notes, CRLF header injection blocking, distributed IP brute force against single email, and direct database inspection for zero plaintext credentials.
- **F14 Boundaries**: 15-year old vehicle 20% salvage floor, 0% interest loan division-by-zero protection, exact ₹7,00,000 vs ₹7,00,001 marginal relief transition, exact ₹7,27,777 marginal relief ceiling, and stock split (1:5 reverse, 3:1 forward) value invariance.

---

## 5. Tier 3: Cross-Feature Pairwise Interactions (15 Flows)

- **Flow 1 [F1+F3+F11]**: Multi-client concurrent balance sheet writes with ACID consistency.
- **Flow 2 [F4+F5+F13]**: Encrypted vault upload, HMAC access token issuance, SHA-256 stream integrity validation, and cross-tenant IDOR blocking.
- **Flow 3 [F6+F7+F8+F10]**: Secure auth lifecycle combining bcrypt credential check, JWT issuance, refresh token rotation, and rate limit counter increments on failure.
- **Flow 4 [F2+F1+F12]**: Monolithic JSON migration into relational WAL tables with 100% record match.
- **Flow 5 [F7+F9+F8]**: Two-Factor Authentication full challenge and token grant flow.
- **Flow 6 [F3+F14+F1]**: Transactional vehicle asset + loan creation automatically recalculating balance sheet net worth.
- **Flow 7 [F4+F6+F2]**: Legacy file migration into AES-256-GCM persistent vault with DEK wrapping.
- **Flow 8 [F8+F10+F13]**: Refresh token reuse detection revoking user session and triggering security lock.
- **Flow 9 [F14+F3+F12]**: Migrated taxpayer profile computing dual-regime tax with ₹1 tolerance.
- **Flow 10 [F10+F1+F13]**: Simulated server reboot verifying rate limiter persistence across crashes.
- **Flow 11 [F5+F8+F4]**: User requesting download token via valid JWT, retrieving and decrypting file.
- **Flow 12 [F3+F11+F14]**: Concurrent expense logging recalculating 50/30/20 budget allocations without race condition.
- **Flow 13 [F7+F2+F8]**: Legacy user transparent upgrade to bcrypt on login and issuance of rotating session.
- **Flow 14 [F9+F10+F13]**: Repeated invalid TOTP attempts triggering persistent rate limiter lockout.
- **Flow 15 [F1+F4+F5+F12+F14]**: End-to-end full enterprise system lifecycle integration.

---

## 6. Tier 4: Real-World Scenarios (14 Scenarios)

1. **Concurrency Safety (50+ Simultaneous Transactions)**:
   - 60 rapid alternating credit/debit transactions updating assets and cashflow ledgers simultaneously.
   - Exact mathematical balance invariant verification: $\text{Balance}_{\text{final}} = \text{Balance}_{\text{initial}} + \sum \text{Credits} - \sum \text{Debits}$.
   - Full structural validation via `PRAGMA integrity_check`.
2. **Zero-Downtime Data Migration Fidelity (100% Record Match)**:
   - Migration of 11 legacy user accounts with zero dropped rows.
   - Prajwal Bharad asset inventory fidelity (Nissan Magnite ₹8.9L/₹12L, Real Estate ₹1.79 Cr, Rolex ₹2.1L, Tata Power ₹2.54L).
   - 180+ historical audit logs preserved with details JSON intact.
3. **Enterprise Security Defenses & Rate-Limiting Persistence**:
   - Persistent rate limiter blocking brute-force attacks across server restarts.
   - Rejection of tampered, expired, or unauthenticated JWT tokens.
   - Strict multi-tenant IDOR isolation preventing cross-user file downloads.
   - Master encryption key isolation strictly via `.env` with zero `.key` files on disk.
4. **Financial Calculation Integrity (₹1 Tolerance)**:
   - **Nissan Magnite**: ₹12,00,000 purchase price, 2025 manufacture, 6,000 km, Good condition $\to$ **₹9,20,000** ($\le ₹1$ diff).
   - **High Salary AY 2025-26 Tax**: ₹15.5L salary + ₹1.0L other income, ₹75k standard deduction $\to$ **₹1,69,000** ($\le ₹1$ diff).
   - **Section 87A Zero-Tax**: ₹7.0L gross salary, ₹75k standard deduction $\to$ **₹0** ($\le ₹1$ diff).
   - **Section 87A Marginal Relief**: ₹7.85L gross salary (₹7.10L taxable), excess ₹10k $\to$ **₹10,400** ($\le ₹1$ diff).
   - **Car Loan 84-Mo Amortization**: ₹8.0L @ 10% for 7 yrs at month 22 $\to$ **₹13,323 EMI** and **₹6,40,006 Remaining Balance** ($\le ₹1$ diff).

---

## 7. How to Execute Tests

Execute the master E2E test runner:
```bash
node tests/e2e/run_all.js
```

Or execute individual test tiers:
```bash
node tests/e2e/tier1_features.test.js
node tests/e2e/tier2_boundaries.test.js
node tests/e2e/tier3_pairwise.test.js
node tests/e2e/tier4_realworld.test.js
```

All suites execute synchronously with structured terminal reporting and exit with code `0` on 100% pass.
