# Project: Wealth OS Enterprise Production Transformation

## Architecture
Wealth OS is being transformed from a file-based prototype into an enterprise-grade production financial management system.
- **Database Layer**: SQLite relational database with Write-Ahead Logging (`WAL` mode, `PRAGMA synchronous = NORMAL`, `PRAGMA busy_timeout = 5000`) located at `storage/database/wealth-os.db` replacing monolithic `tmp/wealth-os/wealth-os-db.json`. Provides ACID transactional consistency across concurrent operations, foreign key constraints, and cascade integrity.
- **Persistent Vault Storage**: Dedicated encrypted storage at `storage/vault/<userId>/` replacing ephemeral `tmp/wealth-os/files/`. Enveloped encryption using AES-256-GCM with per-file Data Encryption Keys (DEKs) wrapped by the master key, SHA-256 stream integrity checks, and short-lived signed HMAC access tokens (60s).
- **Security & Authentication**:
  - Master key `WEALTH_OS_DB_KEY` and `VAULT_MASTER_KEY` strictly injected via `.env` (no keys on disk).
  - Password hashing using `bcrypt` (12 rounds) with transparent upgrade on authentication.
  - Token-based auth: Signed JWT access tokens (15-minute expiry) + persistent rotating refresh tokens (7-day validity) in SQLite.
  - TOTP/MFA: RFC 6238 time-based one-time password support with QR enrollment and verification.
  - Persistent Rate Limiting: SQLite table `rate_limit_records` tracking IP and email attempts surviving server restarts.
  - Elimination of backdoor passwords, auto-registration side-effects, and default-user impersonation in auth middleware.
- **API & Client Integration**: Unified Express backend (`server.js` and `backend/`) preserving zero breaking changes for the 18 client frontend modules in `js/` and `wealth-os.html`.
- **Testing Architecture**: Automated test suite (`npm test`) validating 50+ concurrent transactions, migration fidelity, security defenses, and calculation accuracy within ₹1 tolerance.

---

## Feature Inventory

| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| F1 | SQLite WAL Relational Engine | ACID-compliant SQLite database with WAL mode, foreign keys, and indexes | M1 (DONE) | R1, Survey DB |
| F2 | Zero-Downtime Data Migration | Automated migration of 100% of user profiles, assets, liabilities, taxes, and audit logs | M1 (DONE) | R1, Survey DB |
| F3 | Atomic Balance Sheet & Cashflow Transactions | Transactional guarantees for asset revaluations, balance sheet updates, and cashflow modifications | M1 (DONE) | R1, Survey DB |
| F4 | Persistent Encrypted Vault Storage | Relocate files to `storage/vault/` with per-file AES-256-GCM encryption at rest | M2 | R2, Survey Sec |
| F5 | Secure Access Tokens & Stream Integrity | Short-lived HMAC access tokens and SHA-256 stream verification for document downloads; fix IDOR | M2 | R2, Survey Sec |
| F6 | Master Encryption Key Isolation | Isolate `WEALTH_OS_DB_KEY` into `.env` and eliminate plaintext `.key` files from disk | M3 | R3, Survey Sec |
| F7 | Bcrypt (12 rounds) Password Hashing | Replace SHA-256/scrypt with salted bcrypt; remove backdoor login and default fallback | M3 | R3, Survey Sec |
| F8 | Signed JWTs & Refresh Token Rotation | Short-lived JWTs (15 min) with rotating refresh tokens (7 days) stored in DB | M3 | R3, Survey Sec |
| F9 | TOTP / MFA Authentication | RFC 6238 TOTP enrollment and multi-factor challenge verification | M3 | R3, Survey Sec |
| F10 | Persistent Rate Limiting | Database-backed rate limiting surviving process restarts, keyed by IP and email | M3 | R3, Survey Sec |
| F11 | Concurrency Safety & Stress Testing | Automated test suite verifying 50+ simultaneous transactions without data corruption | M4 / E2E | R4, Survey Logic |
| F12 | Data Migration Fidelity Verification | Automated test validating 100% record count and checksum fidelity post-migration | M4 / E2E | R4, Survey DB |
| F13 | Security Defenses Verification | Automated test validating rate limit persistence, token tampering rejection, and IDOR protection | M4 / E2E | R4, Survey Sec |
| F14 | Financial Calculation Integrity | Validation of vehicle depreciation, Old vs New Tax Regime math, and loan amortization within ₹1 tolerance | M4 / E2E | R4, Survey Logic |
| F15 | Adversarial Coverage Hardening | Tier 5 white-box stress testing and edge-case validation across all subsystems | M4 | Project Pattern |

---

## Milestones

| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| E2E | E2E Testing Suite | Comprehensive 4-tier requirement-driven opaque-box test harness & test cases | None | DONE |
| M1 | Production Database & Migration | SQLite WAL database engine, schema DDL, transactional repositories, zero-downtime migration utility | None | DONE |
| M2 | Persistent Vault Storage | Encrypted vault in `storage/vault/`, AES-256-GCM envelope crypto, download tokens, IDOR fixes | M1 | IN_PROGRESS |
| M3 | Enterprise Security & Auth Hardening | .env master key, bcrypt 12 rounds, JWT access/refresh rotation, TOTP/MFA, persistent rate limiter | M1 | PLANNED |
| M4 | Final E2E Pass & Adversarial Hardening | Pass 100% of E2E test suite (Tiers 1-4) followed by Tier 5 adversarial coverage hardening | M1, M2, M3, E2E | PLANNED |

---

## Interface Contracts

### Database Module Contract (`backend/db/database.js` / `backend/db/sqlite.js`)
- `getDb()`: Returns active SQLite database instance in WAL mode.
- `withTransaction(callback, maxRetries, customDb)`: Executes callback inside `BEGIN IMMEDIATE ... COMMIT/ROLLBACK` with automatic retries on `SQLITE_BUSY`.
- `runMigration()`: Automatically runs DDL schema migrations and imports legacy JSON data if database is empty.

### Vault Storage Contract (`backend/services/vault.service.js`)
- `storeVaultFile(userId, fileBuffer, originalName, mimeType)`: -> `{ fileId, originalName, size, mimeType, checksum, storedPath }` (encrypts with AES-256-GCM using master-key wrapped DEK).
- `retrieveVaultFile(userId, fileId)`: -> `{ fileBuffer, originalName, mimeType, checksum }` (verifies ownership and stream checksum).
- `generateAccessToken(userId, fileId, expirySeconds = 60)`: -> Signed HMAC token string.
- `verifyAccessToken(token, fileId)`: -> `{ valid: boolean, userId: string }`.

### Authentication & Security Contract (`backend/services/auth.service.js` & middleware)
- `hashPassword(password)`: -> `Promise<string>` (bcrypt with 12 rounds).
- `comparePassword(password, hash)`: -> `Promise<boolean>`.
- `generateTokens(user)`: -> `{ accessToken: string (JWT 15m), refreshToken: string (crypto random 7d) }`.
- `rotateRefreshToken(oldRefreshToken)`: -> `Promise<{ accessToken, refreshToken }>` (revokes old token).
- `verifyMfaToken(secret, token)`: -> `boolean`.
- `recordRateLimitAttempt(key, maxAttempts, windowMs)`: -> `{ allowed: boolean, remaining: number, resetTime: number }` (persisted in SQLite).

---

## Code Layout

- `storage/database/wealth-os.db`: Production SQLite database file (WAL mode).
- `storage/vault/`: Persistent encrypted document repository (`storage/vault/<userId>/<fileId>.enc`).
- `backend/db/`: Database configuration, DDL migrations, connection management, repository helpers.
- `backend/services/`: Business logic services (auth, vault, taxEngine, cashflow, rateLimiter).
- `backend/controllers/`: HTTP route handlers.
- `backend/middleware/`: Auth middleware (JWT verification, role guards, rate limiting).
- `tests/`: Automated test suite (`npm test`).
- `tests/e2e/`: E2E test suite runners and test fixtures (Tiers 1-4).
