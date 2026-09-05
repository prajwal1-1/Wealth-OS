// State for PAN verification
window.panVerificationState = {
  status: 'NOT_VERIFIED', // 'NOT_VERIFIED', 'IN_PROGRESS', 'VERIFIED', 'INVALID', 'UNAVAILABLE', 'FAILED'
  maskedName: null,
  errorMsg: null
};

function renderPanVerificationBanner() {
  const container = document.getElementById('pan-verification-container');
  if (!container) return;

  const { status, maskedName, errorMsg } = window.panVerificationState;

  if (status === 'VERIFIED') {
    container.innerHTML = `
      <div style="background: linear-gradient(to right, #f0fdf4, #dcfce7); border: 1px solid #86efac; padding: 16px; border-radius: 12px; display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px;">
        <div style="display: flex; align-items: center; gap: 12px;">
          <div style="background: #22c55e; color: white; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; font-weight: bold;">✓</div>
          <div>
            <h4 style="margin: 0; color: #166534; font-size: 1rem;">PAN Verified Successfully</h4>
            <p style="margin: 2px 0 0 0; color: #15803d; font-size: 0.85rem;">Name matches: <strong>${maskedName}</strong></p>
          </div>
        </div>
      </div>
    `;
    return;
  }

  const isWorking = status === 'IN_PROGRESS';
  const hasError = ['INVALID', 'UNAVAILABLE', 'FAILED'].includes(status);

  container.innerHTML = `
    <div style="background: white; border: 1px solid #e2e8f0; padding: 20px; border-radius: 12px; margin-bottom: 24px; box-shadow: 0 4px 6px rgba(0,0,0,0.02);">
      <h3 style="margin-top: 0; margin-bottom: 8px; font-size: 1.1rem; color: #0f172a; display: flex; align-items: center; gap: 8px;">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6366f1" stroke-width="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>
        Taxpayer Verification
      </h3>
      <p style="margin-top: 0; font-size: 0.85rem; color: #64748b; margin-bottom: 16px;">
        Verify your Permanent Account Number (PAN) to securely connect your tax profile.
      </p>
      
      ${hasError ? `<div style="background: #fef2f2; color: #b91c1c; padding: 10px 14px; border-radius: 6px; font-size: 0.85rem; margin-bottom: 16px; border: 1px solid #fecaca;">⚠ ${errorMsg}</div>` : ''}

      <div style="display: flex; gap: 12px; margin-bottom: 12px;">
        <input type="text" id="pan-input" placeholder="Enter 10-digit PAN" 
               maxlength="10" 
               style="flex: 1; text-transform: uppercase; padding: 10px 14px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 1rem; color: #0f172a; max-width: 300px;"
               ${isWorking ? 'disabled' : ''}>
        
        <button id="verify-pan-btn" type="button" 
                style="background: ${isWorking ? '#94a3b8' : '#4f46e5'}; color: white; border: none; padding: 0 20px; border-radius: 8px; font-weight: 600; cursor: ${isWorking ? 'not-allowed' : 'pointer'};"
                ${isWorking ? 'disabled' : ''}>
          ${isWorking ? 'Verifying...' : 'Verify PAN'}
        </button>
      </div>

      <label style="display: flex; align-items: flex-start; gap: 8px; cursor: pointer;">
        <input type="checkbox" id="pan-consent-cb" style="margin-top: 3px;" ${isWorking ? 'disabled' : ''}>
        <span style="font-size: 0.8rem; color: #475569; max-width: 500px; line-height: 1.4;">
          I authorize the verification of my PAN for tax preparation purposes. I understand my data is protected and never shared.
        </span>
      </label>
    </div>
  `;

  // Bind events
  const btn = document.getElementById('verify-pan-btn');
  const input = document.getElementById('pan-input');
  
  if (input) {
    input.addEventListener('input', (e) => {
      e.target.value = e.target.value.toUpperCase();
    });
  }

  if (btn) {
    btn.addEventListener('click', async () => {
      const pan = input.value.trim().toUpperCase();
      const consent = document.getElementById('pan-consent-cb').checked;

      if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan)) {
        window.panVerificationState = { status: 'INVALID', errorMsg: 'Please enter a valid PAN format (e.g. ABCDE1234F).' };
        renderPanVerificationBanner();
        return;
      }
      if (!consent) {
        window.panVerificationState = { status: 'INVALID', errorMsg: 'You must grant consent to verify your PAN.' };
        renderPanVerificationBanner();
        return;
      }

      // Start Verification
      window.panVerificationState = { status: 'IN_PROGRESS' };
      renderPanVerificationBanner();

      try {
        const token = localStorage.getItem('wealth_os_token') || localStorage.getItem('token');
        const res = await fetch('/api/wealth/tax-integration/pan-verify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token
          },
          body: JSON.stringify({ pan, consentGranted: consent })
        });
        
        const json = await res.json();
        
        if (!res.ok) {
          throw new Error(json.error || 'Verification failed');
        }

        if (json.data && json.data.status === 'INVALID') {
          window.panVerificationState = { status: 'INVALID', errorMsg: json.data.message || 'PAN does not exist or is inactive.' };
        } else {
          window.panVerificationState = { status: 'VERIFIED', maskedName: json.data.maskedName || 'User' };
        }
      } catch (err) {
        const errLower = err.message.toLowerCase();
        let finalStatus = 'FAILED';
        if (errLower.includes('timeout') || errLower.includes('unavailable')) {
          finalStatus = 'UNAVAILABLE';
        }
        window.panVerificationState = { status: finalStatus, errorMsg: err.message };
      }
      
      renderPanVerificationBanner();
    });
  }
}

// Add Consent Management logic below PAN logic

window.fetchActiveConsents = async function() {
  try {
    const token = localStorage.getItem('wealth_os_token') || localStorage.getItem('token');
    const res = await fetch('/api/consents', {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    const json = await res.json();
    if (json.success) return json.data.filter(c => c.status === 'GRANTED');
    return [];
  } catch (err) {
    console.error(err);
    return [];
  }
};

window.grantConsent = async function(purpose, providerCategory) {
  const token = localStorage.getItem('wealth_os_token') || localStorage.getItem('token');
  const res = await fetch('/api/consents', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + token
    },
    body: JSON.stringify({
      purpose,
      providerCategory,
      consentVersion: '1.0',
      consentGranted: true
    })
  });
  return await res.json();
};

window.withdrawConsent = async function(consentId) {
  const token = localStorage.getItem('wealth_os_token') || localStorage.getItem('token');
  const res = await fetch('/api/consents/' + consentId, {
    method: 'DELETE',
    headers: { 'Authorization': 'Bearer ' + token }
  });
  return await res.json();
};

async function renderConsentManager() {
  const container = document.getElementById('tax-consent-manager');
  if (!container) return;

  container.innerHTML = '<div style="padding: 20px; color: #666;">Loading active authorisations...</div>';
  
  const consents = await window.fetchActiveConsents();
  
  let html = `
    <div style="background: white; border: 1px solid #e2e8f0; padding: 24px; border-radius: 12px; margin-bottom: 24px; box-shadow: 0 4px 6px rgba(0,0,0,0.02);">
      <h3 style="margin-top: 0; margin-bottom: 12px; font-size: 1.1rem; color: #0f172a; display: flex; align-items: center; justify-content: space-between;">
        <div style="display:flex; align-items:center; gap:8px;">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6366f1" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
          Data Sharing Permissions
        </div>
      </h3>
  `;

  if (consents.length > 0) {
    html += `<div style="display: flex; flex-direction: column; gap: 12px;">`;
    consents.forEach(c => {
      html += `
        <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; display: flex; justify-content: space-between; align-items: center; background: #f8fafc;">
          <div>
            <strong style="color: #0f172a; display: block;">${c.providerCategory.replace(/_/g, ' ')}</strong>
            <span style="font-size: 0.85rem; color: #475569;">Purpose: ${c.purpose.replace(/_/g, ' ')}</span><br>
            <span style="font-size: 0.75rem; color: #94a3b8;">Granted on: ${new Date(c.grantedAt).toLocaleDateString()} (v${c.consentVersion})</span>
          </div>
          <button onclick="window.handleRevokeConsent('${c.id}')" style="background: white; border: 1px solid #ef4444; color: #ef4444; padding: 8px 16px; border-radius: 6px; font-size: 0.85rem; cursor: pointer; font-weight: 500;">
            Revoke Access
          </button>
        </div>
      `;
    });
    html += `</div>`;
  } else {
    // Show grant UI
    html += `
      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px;">
        <h4 style="margin: 0 0 8px 0; color: #0f172a;">Connect to Income Tax Department</h4>
        <p style="font-size: 0.85rem; color: #475569; margin: 0 0 16px 0; line-height: 1.5;">
          <strong>What data are we requesting?</strong><br>
          We are requesting read-only access to your Form 26AS, AIS, and pre-filled tax data.<br><br>
          <strong>Why do we need this?</strong><br>
          To automatically calculate your tax liability, find missing deductions, and prevent manual data entry errors. Your data is encrypted and never sold.
        </p>
        
        <label style="display: flex; align-items: flex-start; gap: 10px; cursor: pointer; margin-bottom: 20px;">
          <input type="checkbox" id="tax-explicit-consent-cb" style="margin-top: 3px;">
          <span style="font-size: 0.9rem; color: #334155; font-weight: 500; line-height: 1.4;">
            I have read and understood the purpose. I explicitly authorize Wealth OS to fetch my tax data from the Income Tax Department.
          </span>
        </label>

        <button id="grant-consent-btn" style="background: #4f46e5; color: white; border: none; padding: 10px 24px; border-radius: 8px; font-weight: 600; cursor: pointer;">
          Grant Access
        </button>
      </div>
    `;
  }

  html += `</div>`;
  container.innerHTML = html;

  const grantBtn = document.getElementById('grant-consent-btn');
  if (grantBtn) {
    grantBtn.onclick = async () => {
      const cb = document.getElementById('tax-explicit-consent-cb');
      if (!cb.checked) {
        alert('You must check the box to explicitly grant consent.');
        return;
      }
      grantBtn.innerText = 'Authorising...';
      grantBtn.disabled = true;
      const res = await window.grantConsent('TAX_PREPARATION_PREFILL', 'INCOME_TAX_DEPARTMENT');
      if (res.success) {
        renderConsentManager();
      } else {
        alert('Failed to grant consent: ' + res.error);
        grantBtn.innerText = 'Grant Access';
        grantBtn.disabled = false;
      }
    };
  }
}

window.handleRevokeConsent = async function(id) {
  if (!confirm('Are you sure you want to revoke this access? We will immediately delete associated API tokens.')) return;
  await window.withdrawConsent(id);
  renderConsentManager();
};
