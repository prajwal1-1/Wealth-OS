const MockTaxDataProvider = require('./MockTaxDataProvider');
const AuthorisedTaxDataProvider = require('./AuthorisedTaxDataProvider');

/**
 * @class TaxProviderFactory
 * @description Factory class to instantiate the correct Tax Data Provider based on environment configuration.
 */
class TaxProviderFactory {
  /**
   * Returns an instance of the configured TaxDataProvider.
   * Uses process.env.TAX_DATA_PROVIDER ('mock' | 'government') to determine which provider to load.
   * @returns {import('./TaxDataProvider')}
   */
  static getProvider() {
    const providerType = process.env.TAX_DATA_PROVIDER || 'mock';

    if (providerType.toLowerCase() === 'mock') {
      return new MockTaxDataProvider();
    } 
    
    if (providerType.toLowerCase() === 'government') {
      return new AuthorisedTaxDataProvider();
    }

    throw new Error(`Invalid TAX_DATA_PROVIDER configured: ${providerType}`);
  }
}

module.exports = TaxProviderFactory;
