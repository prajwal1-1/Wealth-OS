const path = require('path');
const vaultService = require('../services/vault.service');
const { getDb } = require('./sqlite');

function runVaultMigration(options = {}) {
  const db = options.db || getDb(options.customDbPath);
  const workspaceRoot = options.workspaceRoot || path.resolve(__dirname, '..', '..');
  
  console.log('[MigrateVault] Starting legacy files encryption & vault migration...');
  const result = vaultService.migrateLegacyFiles({ db, workspaceRoot });
  console.log(`[MigrateVault] Completed! Migrated ${result.migratedCount} files (${(result.totalBytes / 1024 / 1024).toFixed(2)} MB). Errors: ${result.errors.length}`);
  return result;
}

if (require.main === module) {
  runVaultMigration();
}

module.exports = {
  runVaultMigration
};
