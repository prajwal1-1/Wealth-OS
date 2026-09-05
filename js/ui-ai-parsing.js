let currentAiData = null;

function renderAiExtractionReview(fileObj, extractedData) {
  const modal = document.getElementById('ai-extraction-modal');
  const pdfContainer = document.getElementById('ai-extraction-pdf');
  const dataContainer = document.getElementById('ai-extraction-data');
  const confirmBtn = document.getElementById('ai-confirm-map-btn');
  const closeBtn = document.getElementById('close-ai-extraction');

  // Preview logic
  if (fileObj.fileUrl) {
    if (fileObj.fileUrl.endsWith('.pdf')) {
       pdfContainer.innerHTML = `<embed src="${fileObj.fileUrl}#toolbar=0" width="100%" height="100%" type="application/pdf">`;
    } else {
       pdfContainer.innerHTML = `<img src="${fileObj.fileUrl}" style="max-width: 100%; max-height: 100%; object-fit: contain;">`;
    }
  } else {
    pdfContainer.innerHTML = `<div style="text-align: center; color: #888;">No preview available for ${fileObj.name}</div>`;
  }

  // Data Rendering
  currentAiData = extractedData;
  dataContainer.innerHTML = '';
  
  if (extractedData.documentType) {
    const typeLabel = document.createElement('div');
    typeLabel.innerHTML = `<div style="font-size: 0.8rem; color: #666; margin-bottom: 2px;">Detected Type</div>
                           <div style="font-weight: 600; color: #111; margin-bottom: 12px; font-size: 1.1rem;">${extractedData.documentType}</div>`;
    dataContainer.appendChild(typeLabel);
  }

  const fields = extractedData.extractedData || {};
  Object.keys(fields).forEach(key => {
    const fieldDiv = document.createElement('div');
    fieldDiv.style.cssText = 'background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 1px 2px rgba(0,0,0,0.02);';
    
    // Human readable key
    const readableKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
    const val = typeof fields[key] === 'number' ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(fields[key]) : fields[key];

    fieldDiv.innerHTML = `
      <span style="font-size: 0.9rem; color: #475569; font-weight: 500;">${readableKey}</span>
      <span style="font-size: 1rem; color: #0f172a; font-weight: 600; background: #f8fafc; padding: 4px 8px; border-radius: 4px; border: 1px dashed #cbd5e1;">${val}</span>
    `;
    dataContainer.appendChild(fieldDiv);
  });

  // Events
  confirmBtn.onclick = () => {
    confirmBtn.innerHTML = 'Mapping to Engine...';
    setTimeout(() => {
      mapAiDataToEngine(fields, extractedData.documentType);
      modal.close();
      confirmBtn.innerHTML = 'Confirm & Map to Tax Engine';
      alert('Data mapped to Tax Engine successfully!');
      if (typeof window.switchView === 'function') window.switchView('taxDocuments');
    }, 800);
  };

  closeBtn.onclick = () => modal.close();

  modal.showModal();
}

function mapAiDataToEngine(data, type) {
  // Assuming global 'state' object exists
  if (!window.state || !window.state.tax) window.state = { tax: {} };
  
  if (type.includes('Capital')) {
    window.state.tax.stcgEquities = (window.state.tax.stcgEquities || 0) + (data.cgStcgEq || 0);
    window.state.tax.ltcgEquities = (window.state.tax.ltcgEquities || 0) + (data.cgLtcgEq || 0);
    if(data.tdsPaid) window.state.tax.tds = (window.state.tax.tds || 0) + data.tdsPaid;
  } else {
    window.state.tax.salary = (window.state.tax.salary || 0) + (data.salaryBasic || 0) + (data.salaryBonus || 0) + (data.salaryHraReceived || 0);
    if(data.deduction80c) window.state.tax.deduction80C = data.deduction80c;
    if(data.deduction80d) window.state.tax.deduction80D = data.deduction80d;
    if(data.tdsPaid) window.state.tax.tds = (window.state.tax.tds || 0) + data.tdsPaid;
  }
  
  // Trigger tax recalculation and UI update if they exist
  if (typeof window.calculateTax === 'function') window.calculateTax();
  if (typeof window.renderTaxCards === 'function') window.renderTaxCards();
  if (typeof window.debouncedSave === 'function') window.debouncedSave();
}

window.triggerAiExtraction = async function(fileId, fileName, fileUrl) {
  const loadingToast = document.createElement('div');
  loadingToast.style.cssText = 'position: fixed; bottom: 20px; right: 20px; background: #1e1e24; color: white; padding: 12px 20px; border-radius: 8px; z-index: 9999; display: flex; align-items: center; gap: 10px; font-weight: 500; box-shadow: 0 4px 12px rgba(0,0,0,0.15);';
  loadingToast.innerHTML = '<div class="spinner" style="width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; animation: spin 1s linear infinite;"></div> Analyzing document with AI...';
  document.body.appendChild(loadingToast);

  // Mocking the backend call to our new llm.service
  setTimeout(() => {
    document.body.removeChild(loadingToast);
    const mockData = {
      documentType: fileName.toLowerCase().includes('capital') ? 'Capital Gains Statement' : 'Form 16 (Part B)',
      confidenceScore: 0.98,
      extractedData: fileName.toLowerCase().includes('capital') ? {
        cgStcgEq: 125000, cgLtcgEq: 450000, cgStLossBf: 12000, tdsPaid: 15000
      } : {
        salaryBasic: 1850000, salaryBonus: 150000, salaryHraReceived: 450000, deduction80c: 150000, deduction80ccd1b: 50000, deduction80d: 25000, deductionProfTax: 2500, tdsPaid: 425000
      }
    };
    renderAiExtractionReview({ id: fileId, name: fileName, fileUrl: fileUrl }, mockData);
  }, 2000);
}
