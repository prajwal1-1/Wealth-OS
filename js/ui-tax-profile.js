window.taxProfileState = null;

async function fetchTaxProfile() {
  try {
    const token = localStorage.getItem('wealth_os_token') || localStorage.getItem('token');
    const res = await fetch('/api/profile', {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    const json = await res.json();
    if (json.success) {
      window.taxProfileState = json.data;
    }
  } catch (err) {
    console.error(err);
  }
}

async function updateTaxProfileCategory(category, updates) {
  try {
    const token = localStorage.getItem('wealth_os_token') || localStorage.getItem('token');
    const res = await fetch('/api/profile/' + category, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token
      },
      body: JSON.stringify(updates)
    });
    const json = await res.json();
    if (json.success) {
      window.taxProfileState[category.toUpperCase()] = json.data;
      return true;
    }
    throw new Error(json.error);
  } catch (err) {
    alert('Failed to update profile: ' + err.message);
    return false;
  }
}

function getSourceBadge(source) {
  if (source === 'AUTHORISED_PROVIDER') {
    return `<span style="display:inline-flex; align-items:center; gap:4px; font-size:0.65rem; background:#dcfce7; color:#166534; padding:2px 6px; border-radius:10px; font-weight:600;"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg> Imported (Production)</span>`;
  }
  if (source === 'MOCK_SANDBOX') {
    return `<span style="display:inline-flex; align-items:center; gap:4px; font-size:0.65rem; background:#ffedd5; color:#c2410c; padding:2px 6px; border-radius:10px; font-weight:600;">⚠️ Sandbox/Mock</span>`;
  }
  if (source === 'CALCULATED') {
    return `<span style="display:inline-flex; align-items:center; gap:4px; font-size:0.65rem; background:#e0f2fe; color:#0369a1; padding:2px 6px; border-radius:10px; font-weight:600;">⚡ Calculated</span>`;
  }
  if (source === 'USER_PROVIDED') {
    return `<span style="display:inline-flex; align-items:center; gap:4px; font-size:0.65rem; background:#f1f5f9; color:#475569; padding:2px 6px; border-radius:10px; font-weight:600;">✎ User Edited</span>`;
  }
  return `<span style="display:inline-flex; align-items:center; gap:4px; font-size:0.65rem; background:#fef3c7; color:#92400e; padding:2px 6px; border-radius:10px; font-weight:600;">? Unknown Source</span>`;
}

async function renderTaxProfileTab() {
  const container = document.getElementById('tax-profile-dashboard');
  if (!container) return;

  if (!window.taxProfileState) {
    container.innerHTML = 'Loading profile...';
    await fetchTaxProfile();
  }
  
  if (!window.taxProfileState) {
    container.innerHTML = '<div style="padding: 20px; color: #f87171;">Failed to load Taxpayer Profile. Please ensure you are logged in.</div>';
    return;
  }

  const profile = window.taxProfileState;

  function renderCategory(catName, data, labels) {
    let html = `
      <div style="background: white; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 24px; box-shadow: 0 2px 4px rgba(0,0,0,0.02);">
        <h3 style="margin-top:0; color:#0f172a; margin-bottom:16px;">${catName}</h3>
        <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 16px;">
    `;

    for (const [key, fieldData] of Object.entries(data)) {
      const label = labels[key] || key;
      const isNum = typeof fieldData.value === 'number';
      html += `
        <div style="display:flex; flex-direction:column; gap:6px;">
          <label style="font-size:0.85rem; color:#475569; font-weight:500; display:flex; justify-content:space-between; align-items:center;">
            ${label}
            ${getSourceBadge(fieldData.source)}
          </label>
          <input type="${isNum ? 'number' : 'text'}" 
                 id="profile-${catName}-${key}"
                 data-original-source="${fieldData.source}"
                 value="${fieldData.value !== null ? fieldData.value : ''}" 
                 style="padding:10px; border:1px solid #cbd5e1; border-radius:6px; font-size:1rem; color:#0f172a;">
        </div>
      `;
    }

    html += `
        </div>
        <div style="margin-top: 16px; text-align:right;">
          <button onclick="window.saveTaxCategory('${catName}')" style="background:#4f46e5; color:white; border:none; padding:8px 16px; border-radius:6px; cursor:pointer; font-weight:500;">
            Save ${catName}
          </button>
        </div>
      </div>
    `;
    return html;
  }

  let fullHtml = `
    <div style="max-width: 900px; margin: 0 auto;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; padding: 16px; background: #fffbeb; border: 1px solid #fcd34d; border-radius: 12px;">
        <div>
          <h4 style="margin: 0; color: #b45309; font-size: 1rem;">Provider Integration Testing</h4>
          <p style="margin: 4px 0 0 0; color: #92400e; font-size: 0.85rem;">Pull synthetic Form 26AS/AIS data from the sandbox provider.</p>
        </div>
        <button onclick="window.fetchSandboxData()" id="fetch-sandbox-btn" style="background: #d97706; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-weight: 500;">
          Fetch Sandbox Data
        </button>
      </div>
  `;
  
  fullHtml += renderCategory('IDENTITY', profile.IDENTITY, {
    pan: 'PAN', name: 'Taxpayer Name', dob: 'Date of Birth (YYYY-MM-DD)', residentialStatus: 'Residential Status'
  });

  fullHtml += renderCategory('INCOME', profile.INCOME, {
    salary: 'Salary Income (₹)', interest: 'Interest Income (₹)', dividend: 'Dividend Income (₹)', 
    capitalGains: 'Capital Gains (₹)', business: 'Business/Profession (₹)', other: 'Other Income (₹)'
  });

  fullHtml += renderCategory('TAXES', profile.TAXES, {
    tds: 'TDS (₹)', tcs: 'TCS (₹)', advanceTax: 'Advance Tax (₹)', selfAssessmentTax: 'Self-Assessment Tax (₹)'
  });

  fullHtml += renderCategory('DEDUCTIONS', profile.DEDUCTIONS, {
    eligibleDeductions: 'Total Eligible Deductions (₹)', supportingInfo: 'Supporting Info (Notes)'
  });

  fullHtml += `</div>`;
  container.innerHTML = fullHtml;
}

window.saveTaxCategory = async function(catName) {
  const dataObj = window.taxProfileState[catName];
  const updates = {};
  let downgradeWarning = false;

  for (const key of Object.keys(dataObj)) {
    const input = document.getElementById(`profile-${catName}-${key}`);
    if (input) {
      let val = input.type === 'number' ? Number(input.value) : input.value;
      const originalSource = input.getAttribute('data-original-source');
      
      // If user modified a verified field, warn them
      if (originalSource === 'AUTHORISED_PROVIDER' && val !== dataObj[key].value) {
        downgradeWarning = true;
      }
      
      updates[key] = { value: val, source: 'USER_PROVIDED' };
    }
  }

  if (downgradeWarning) {
    if (!confirm('You are editing data that was securely imported from an Authorized Provider (e.g. Income Tax Dept). If you save this, the system will downgrade the trust level of this field to "User Edited". Proceed?')) {
      return;
    }
  }

  const btn = window.event ? window.event.target : document.activeElement;
  const originalText = btn ? btn.innerText : 'Save';
  if (btn) btn.innerText = 'Saving...';
  
  const success = await updateTaxProfileCategory(catName, updates);
  if (success) {
    await renderTaxProfileTab(); // re-render to update badges
  } else {
    if (btn) btn.innerText = originalText;
  }
};

window.fetchSandboxData = async function() {
  const btn = document.getElementById('fetch-sandbox-btn');
  const originalText = btn.innerText;
  btn.innerText = 'Fetching...';
  btn.disabled = true;

  try {
    const token = localStorage.getItem('wealth_os_token') || localStorage.getItem('token');
    const res = await fetch('/api/wealth/tax-integration/fetch-data', {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    const json = await res.json();
    
    if (json.success) {
      // Simulate normalizing and updating the profile locally
      // (In production, the backend would use TaxNormalizer to save to DB, but here we just update UI state for demo)
      const mockTds = json.data.tds.reduce((sum, r) => sum + r.value.amount, 0);
      const mockDiv = json.data.ais.find(r => r.value.category === 'Dividend')?.value.amount || 0;
      
      await updateTaxProfileCategory('TAXES', {
        tds: { value: mockTds, source: 'MOCK_SANDBOX' }
      });
      await updateTaxProfileCategory('INCOME', {
        dividend: { value: mockDiv, source: 'MOCK_SANDBOX' }
      });
      
      await renderTaxProfileTab();
      alert('Sandbox data successfully fetched and normalized into the profile!');
    } else {
      alert('Failed to fetch data: ' + json.error);
    }
  } catch (err) {
    alert('Failed to connect to provider API.');
  } finally {
    if(btn) {
      btn.innerText = originalText;
      btn.disabled = false;
    }
  }
};

// Hook into the UI
const originalRenderTaxDocumentsForProfile = window.renderTaxDocuments;
if (typeof originalRenderTaxDocumentsForProfile === 'function') {
  window.renderTaxDocuments = function() {
    originalRenderTaxDocumentsForProfile.apply(this, arguments);
    const navTabs = document.querySelector('.tax-nav-tabs');
    if (navTabs && !navTabs.querySelector('[data-tax-tab="profile"]')) {
      const btn = document.createElement('button');
      btn.className = 'tax-tab-btn';
      btn.type = 'button';
      btn.setAttribute('data-tax-tab', 'profile');
      btn.innerText = '0. Taxpayer Profile';
      // Insert at the beginning
      navTabs.insertBefore(btn, navTabs.firstChild);
      
      // Add container for the profile
      const listContainer = document.getElementById('app-list');
      const profileContainer = document.createElement('div');
      profileContainer.id = 'tax-profile-dashboard';
      profileContainer.style.display = 'none';
      listContainer.appendChild(profileContainer);

      // Force show profile if it's the current tab
      if (window.currentTaxTab === 'profile') {
        Array.from(listContainer.children).forEach(child => {
          if (!child.classList.contains('tax-step-wizard') && child.id !== 'tax-profile-dashboard') {
            child.style.display = 'none';
          }
        });
        profileContainer.style.display = 'block';
        renderTaxProfileTab();
      }

      // Handle tab clicks
      navTabs.addEventListener('click', (e) => {
        if (e.target.tagName === 'BUTTON') {
          const tab = e.target.getAttribute('data-tax-tab');
          if (tab === 'profile') {
            Array.from(listContainer.children).forEach(child => {
              if (!child.classList.contains('tax-step-wizard') && child.id !== 'tax-profile-dashboard') {
                child.style.display = 'none';
              }
            });
            profileContainer.style.display = 'block';
            renderTaxProfileTab();
          } else {
            profileContainer.style.display = 'none';
            Array.from(listContainer.children).forEach(child => {
              if (!child.classList.contains('tax-step-wizard') && child.id !== 'tax-profile-dashboard') {
                child.style.display = '';
              }
            });
          }
        }
      });
    }
  };
}
