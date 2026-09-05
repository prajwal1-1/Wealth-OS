/**
 * @class TaxDataProvider
 * @description Abstract base class defining the contract for tax data providers.
 * All providers (Mock and Authorised) must implement these methods.
 */
class TaxDataProvider {
  constructor() {
    if (new.target === TaxDataProvider) {
      throw new TypeError('Cannot construct TaxDataProvider instances directly');
    }
  }

  /**
   * Initialize a connection/consent request for the taxpayer.
   * @param {Object} taxpayerData - Basic info required to initiate connection (e.g. PAN).
   * @returns {Promise<Object>} - Connection status or redirect URL.
   */
  async initiateConnection(taxpayerData) {
    throw new Error('Method "initiateConnection" must be implemented.');
  }

  /**
   * Fetch pre-fill tax data (e.g., Salary, TDS, Capital Gains).
   * @param {string} consentToken - Token verifying user consent/session.
   * @param {string} pan - Permanent Account Number (masked in logs).
   * @param {string} assessmentYear - Target assessment year.
   * @returns {Promise<Object>} - Structured tax data.
   */
  async fetchPreFillData(consentToken, pan, assessmentYear) {
    throw new Error('Method "fetchPreFillData" must be implemented.');
  }

  /**
   * Revoke access and delete session with the provider.
   * @param {string} consentToken - Token to revoke.
   * @returns {Promise<boolean>} - True if successfully revoked.
   */
  async revokeConsent(consentToken) {
    throw new Error('Method "revokeConsent" must be implemented.');
  }

  /**
   * Verify PAN details with the provider.
   * @param {string} pan - The PAN to verify.
   * @param {boolean} consentGranted - Explicit user consent flag.
   * @returns {Promise<Object>} - Verification result status and minimal info.
   */
  async verifyPan(pan, consentGranted) {
    throw new Error('Method "verifyPan" must be implemented.');
  }

  /**
   * Retrieves TDS/TCS information for a given PAN and Assessment Year.
   * @param {string} pan
   * @param {string} assessmentYear
   * @returns {Promise<Array>}
   */
  async getTDSData(pan, assessmentYear) {
    throw new Error('Method "getTDSData" must be implemented.');
  }

  /**
   * Retrieves general tax information (e.g. 26AS, AIS)
   * @param {string} pan
   * @param {string} assessmentYear
   * @returns {Promise<Array>}
   */
  async getTaxInformation(pan, assessmentYear) {
    throw new Error('Method "getTaxInformation" must be implemented.');
  }

  /**
   * Retrieves historical return information (ITR)
   * @param {string} pan
   * @param {string} assessmentYear
   * @returns {Promise<Array>}
   */
  async getReturnInformation(pan, assessmentYear) {
    throw new Error('Method "getReturnInformation" must be implemented.');
  }

  /**
   * Utility to mask PAN for logging purposes.
   * @param {string} pan 
   * @returns {string} - Masked PAN (e.g. ABCDE****Z)
   */
  maskPan(pan) {
    if (!pan || pan.length !== 10) return 'INVALID_PAN';
    return pan.substring(0, 5) + '****' + pan.substring(9);
  }

  /**
   * Secure logging utility.
   * @param {string} action 
   * @param {string} maskedIdentifier 
   * @param {string} status 
   */
  logAction(action, maskedIdentifier, status) {
    // In production, this would route to a secure audit log service.
    console.log(`[TaxIntegrationAudit] [${new Date().toISOString()}] Action: ${action} | Identifier: ${maskedIdentifier} | Status: ${status}`);
  }
}

module.exports = TaxDataProvider;
