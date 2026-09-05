const TaxDataProvider = require('./TaxDataProvider');

/**
 * @class MockTaxDataProvider
 * @description Provides sandbox data for development and testing. 
 * Clearly labels data as DEVELOPMENT/SANDBOX. Does NOT connect to any external API.
 */
class MockTaxDataProvider extends TaxDataProvider {
  
  async initiateConnection(taxpayerData) {
    if (!taxpayerData || !taxpayerData.pan) {
      throw new Error('PAN is required to initiate connection.');
    }
    
    const masked = this.maskPan(taxpayerData.pan);
    this.logAction('MOCK_INITIATE', masked, 'SUCCESS');
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return {
      success: true,
      consentToken: `mock-token-${Date.now()}`,
      status: 'MOCK_CONNECTION_ESTABLISHED',
      warning: 'DEVELOPMENT/SANDBOX DATA - NOT OFFICIAL'
    };
  }

  async fetchPreFillData(consentToken, pan, assessmentYear) {
    if (!consentToken || !consentToken.startsWith('mock-token-')) {
      throw new Error('Invalid or missing consent token.');
    }
    if (!pan || !assessmentYear) {
      throw new Error('PAN and Assessment Year are required.');
    }

    const masked = this.maskPan(pan);
    this.logAction('MOCK_FETCH_PREFILL', masked, 'SUCCESS');
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800));

    // Return realistic mock data clearly marked as Sandbox
    return {
      dataSource: 'SANDBOX_MOCK_PROVIDER',
      metadata: {
        assessmentYear,
        fetchedAt: new Date().toISOString(),
        isOfficial: false
      },
      data: {
        salaryIncome: 1250000,
        tdsDeducted: 150000,
        bankInterest: 15400,
        advanceTaxPaid: 25000,
        deductions80C: 150000,
        employers: [
          { name: 'MOCK CORP INDIA PVT LTD', tan: 'BLRM12345E', amount: 1250000 }
        ]
      }
    };
  }

  async revokeConsent(consentToken) {
    if (!consentToken) {
       throw new Error('No token provided to revoke.');
    }
    this.logAction('MOCK_REVOKE', 'UNKNOWN_PAN', 'SUCCESS');
    return true;
  }

  async verifyPan(pan, consentGranted) {
    const masked = this.maskPan(pan);
    
    if (!consentGranted) {
      this.logAction('MOCK_VERIFY_PAN', masked, 'REJECTED_NO_CONSENT');
      throw new Error('User consent is required for PAN verification.');
    }

    this.logAction('MOCK_VERIFY_PAN', masked, 'INITIATED');
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 600));

    // Hardcoded test behaviors based on PAN string
    if (pan === 'TIMEO1234Z') {
      this.logAction('MOCK_VERIFY_PAN', masked, 'TIMEOUT');
      throw new Error('Provider timeout');
    }
    
    if (pan === 'FAILS1234Z') {
      this.logAction('MOCK_VERIFY_PAN', masked, 'FAILURE');
      throw new Error('Provider internal error');
    }

    if (pan === 'INVAL1234Z') {
      this.logAction('MOCK_VERIFY_PAN', masked, 'INVALID_FORMAT_MOCK');
      return { status: 'INVALID', message: 'PAN format is invalid or does not exist.' };
    }

    // Default Success
    this.logAction('MOCK_VERIFY_PAN', masked, 'SUCCESS');
    return {
      status: 'VERIFIED',
      nameMatch: true,
      maskedName: 'P****** M*****' // Minimal data returned
    };
  }

  // Generate standardized metadata wrapper
  _createMetadata(sourceRef) {
    return {
      source: 'MOCK_SANDBOX',
      source_reference: sourceRef,
      retrieved_at: new Date().toISOString(),
      data_status: 'ACTIVE'
    };
  }

  async getTDSData(pan, assessmentYear) {
    this.logAction('MOCK_GET_TDS', this.maskPan(pan), 'SUCCESS');
    return [
      {
        value: { deductor: 'TECH CORP LTD', amount: 45000, type: 'Salary (192)' },
        metadata: this._createMetadata(`MOCK-TDS-${assessmentYear}-1`)
      },
      {
        value: { deductor: 'HDFC BANK', amount: 1500, type: 'Interest (194A)' },
        metadata: this._createMetadata(`MOCK-TDS-${assessmentYear}-2`)
      }
    ];
  }

  async getTaxInformation(pan, assessmentYear) {
    this.logAction('MOCK_GET_TAX_INFO', this.maskPan(pan), 'SUCCESS');
    return [
      {
        value: { category: 'Dividend', amount: 12000, source: 'RELIANCE IND' },
        metadata: this._createMetadata(`MOCK-AIS-${assessmentYear}-1`)
      }
    ];
  }

  async getReturnInformation(pan, assessmentYear) {
    this.logAction('MOCK_GET_ITR', this.maskPan(pan), 'SUCCESS');
    return [
      {
        value: { status: 'PROCESSED', form: 'ITR-1', refundAmount: 5400 },
        metadata: this._createMetadata(`MOCK-ITR-${assessmentYear}-1`)
      }
    ];
  }
}

module.exports = MockTaxDataProvider;
