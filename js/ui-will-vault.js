// ═══════════════════════════════════════════════════════════
// WEALTH OS DIGITAL WILL VAULT & ESTATE PLANNING SUITE v4
// Comprehensive Estate Planning, 5-Step Will Drafting Engine,
// Asset Allocation Matrix (with Real-Time 100% Validator & Custom Assets),
// Video Will Evidentiary Script (Sec 65B Evidence Act),
// Emergency Pocket Succession Card, Living Will, Codicil & Probate Radar
// (Indian Succession Act, 1925 & Supreme Court Medical Directive Compliant)
// ═══════════════════════════════════════════════════════════

let currentVaultView = 'overview'; // 'overview', 'builder', 'videoScript', 'livingWill', 'codicil', 'probate', 'digitalLegacy', 'nominee', 'admin'
let willBuilderStep = 1; // 1 to 5
let localVaultState = { vault: null, auditLogs: [] };

// ── State Initialization & Helpers ───────────────────────────

async function fetchWillVaultState() {
  try {
    const res = await apiCall('/api/wealth/will');
    if (res && !res.error) {
      localVaultState = res;
    }
  } catch (e) {
    console.error("Failed to fetch will vault state", e);
  }
}

function getWillDraft() {
  state.willDraft = state.willDraft || {};
  const d = state.willDraft;
  const user = window.activeUser || {};

  // Sensible defaults
  if (!d.testatorName) d.testatorName = user.name || "Testator Name";
  if (!d.age) d.age = 42;
  if (!d.religion) d.religion = "Hindu";
  if (!d.address) d.address = "Residence Address, Mumbai, India";
  if (!d.soundMind) d.soundMind = true;
  if (!d.revokePrevious) d.revokePrevious = true;

  // Executors
  if (!d.primaryExecutor) d.primaryExecutor = { name: "Spouse / Trusted Advisor", relationship: "Spouse", address: "Same as above", phone: "" };
  if (!d.alternateExecutor) d.alternateExecutor = { name: "Alternate Family Member", relationship: "Sibling / Child", address: "", phone: "" };
  if (!d.minorGuardian) d.minorGuardian = { name: "Guardian Name", relationship: "Sibling", address: "" };

  // Asset Allocations & Custom Heirlooms
  if (!d.assetAllocations) d.assetAllocations = {};
  if (!d.customAssets) d.customAssets = [];

  // Residuary
  if (!d.residuaryBeneficiary) d.residuaryBeneficiary = { name: "Primary Nominee", relationship: "Spouse", share: 100 };

  // Witnesses
  if (!d.witness1) d.witness1 = { name: "Independent Witness 1", address: "Mumbai", occupation: "Advocate / Doctor" };
  if (!d.witness2) d.witness2 = { name: "Independent Witness 2", address: "Mumbai", occupation: "Chartered Accountant / Professional" };
  if (!d.doctorCertification) d.doctorCertification = { name: "Dr. R. K. Mehta, MBBS", regNo: "MCI-84920", clinic: "City Clinic" };

  return d;
}

function getLivingWillDraft() {
  state.livingWill = state.livingWill || {};
  const lw = state.livingWill;
  const user = window.activeUser || {};

  if (!lw.declarantName) lw.declarantName = user.name || "Declarant Name";
  if (!lw.age) lw.age = 42;
  if (!lw.dnrPreferred) lw.dnrPreferred = true;
  if (!lw.ventilatorThreshold) lw.ventilatorThreshold = "Terminal illness / Brain death only";
  if (!lw.palliativeComfort) lw.palliativeComfort = true;
  if (!lw.organDonation) lw.organDonation = true;
  if (!lw.surrogate1) lw.surrogate1 = { name: "Primary Healthcare Proxy (Spouse)", relationship: "Spouse", phone: "", address: "" };
  if (!lw.surrogate2) lw.surrogate2 = { name: "Alternate Healthcare Proxy", relationship: "Child / Sibling", phone: "", address: "" };

  return lw;
}

function getCodicilDraft() {
  state.codicil = state.codicil || {};
  const c = state.codicil;
  const user = window.activeUser || {};

  if (!c.testatorName) c.testatorName = user.name || "Testator Name";
  if (!c.originalWillDate) c.originalWillDate = new Date().toISOString().slice(0, 10);
  if (!c.amendmentNotes) c.amendmentNotes = "I hereby bequeath newly acquired residential flat to my daughter and revoke the previous allocation for vehicle.";
  if (!c.witness1) c.witness1 = { name: "Witness 1", address: "Mumbai" };
  if (!c.witness2) c.witness2 = { name: "Witness 2", address: "Mumbai" };

  return c;
}

// ── Main View Router ─────────────────────────────────────────

async function renderWillVault() {
  await fetchWillVaultState();

  grid.innerHTML = `
    <div class="vault-role-switcher" style="display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 20px;">
      <button class="${currentVaultView === 'overview' ? 'active' : ''}" onclick="switchVaultView('overview')">Succession Radar</button>
      <button class="${currentVaultView === 'builder' ? 'active' : ''}" onclick="switchVaultView('builder')">Will Drafting Wizard</button>
      <button class="${currentVaultView === 'videoScript' ? 'active' : ''}" onclick="switchVaultView('videoScript')">Video Will Script</button>
      <button class="${currentVaultView === 'livingWill' ? 'active' : ''}" onclick="switchVaultView('livingWill')">Living Will (Medical POA)</button>
      <button class="${currentVaultView === 'codicil' ? 'active' : ''}" onclick="switchVaultView('codicil')">Codicil Drafter</button>
      <button class="${currentVaultView === 'probate' ? 'active' : ''}" onclick="switchVaultView('probate')">Probate Calculator</button>
      <button class="${currentVaultView === 'digitalLegacy' ? 'active' : ''}" onclick="switchVaultView('digitalLegacy')">Digital & Crypto Schedule</button>
      <button class="${currentVaultView === 'nominee' ? 'active' : ''}" onclick="switchVaultView('nominee')">Nominee & Claim Portal</button>
      <button class="${currentVaultView === 'admin' ? 'active' : ''}" onclick="switchVaultView('admin')">Legal Admin Console</button>
    </div>
  `;

  if (currentVaultView === 'overview') list.innerHTML = renderEstateOverviewView();
  else if (currentVaultView === 'builder') list.innerHTML = renderWillBuilderView();
  else if (currentVaultView === 'videoScript') list.innerHTML = renderVideoScriptView();
  else if (currentVaultView === 'livingWill') list.innerHTML = renderLivingWillView();
  else if (currentVaultView === 'codicil') list.innerHTML = renderCodicilView();
  else if (currentVaultView === 'probate') list.innerHTML = renderProbateCalculatorView();
  else if (currentVaultView === 'digitalLegacy') list.innerHTML = renderDigitalLegacyView();
  else if (currentVaultView === 'nominee') list.innerHTML = renderNomineeView();
  else if (currentVaultView === 'admin') list.innerHTML = renderAdminView();
}

window.switchVaultView = (view) => {
  currentVaultView = view;
  renderWillVault();
};

// ═══════════════════════════════════════════════════════════
// MODULE 1: ESTATE OVERVIEW & SUCCESSION RADAR
// ═══════════════════════════════════════════════════════════

function getEstateAgentAlerts() {
  const alerts = [];
  const docs = state.documents || [];
  const family = state.family || [];
  const assets = getAllEstateAssets();
  const liabilities = state.liabilities || [];
  const v = localVaultState.vault;
  const draft = state.willDraft;

  const today = new Date();
  const thirtyDays = new Date();
  thirtyDays.setDate(today.getDate() + 30);

  // Insurance Expiry Tracking
  docs.forEach(doc => {
    if (doc.type && doc.type.toLowerCase().includes('insurance') && doc.expiry) {
      const expDate = new Date(doc.expiry);
      if (expDate < today) {
        alerts.push({
          title: "Policy Expired",
          desc: `Insurance policy '${doc.name}' expired on ${expDate.toLocaleDateString('en-IN')}. Renew immediately to avoid coverage gaps.`,
          urgent: true,
          category: "insurance"
        });
      } else if (expDate <= thirtyDays) {
        alerts.push({
          title: "Policy Expiring in < 30 Days",
          desc: `Insurance policy '${doc.name}' expires on ${expDate.toLocaleDateString('en-IN')}. Renew now to maintain uninterrupted coverage.`,
          urgent: true,
          category: "insurance"
        });
      }
    }
  });

  // Will Missing or Incomplete
  const hasUploadedWill = Boolean(v);
  const hasDraftedWill = Boolean(draft && draft.testatorName && Object.keys(draft.assetAllocations || {}).length > 0);
  const familyCount = family.length;

  if (!hasUploadedWill && !hasDraftedWill && familyCount > 1) {
    alerts.push({
      title: "Family Protection Action Needed",
      desc: `You have ${familyCount} family members but no formal Will generated or uploaded. Draft or upload your Will to secure seamless succession.`,
      urgent: true,
      category: "will"
    });
  }

  // Major Assets Not in Will
  const willLastUpdated = v ? new Date(v.uploadedAt) : (draft?.updatedAt ? new Date(draft.updatedAt) : new Date(0));
  let recentMajorAssets = [];
  assets.forEach(a => {
    if ((Number(a.value) || 0) >= 5000000) {
      if (a.acquisitionDate && new Date(a.acquisitionDate) > willLastUpdated) {
        recentMajorAssets.push(a.name);
      }
    }
  });
  if (recentMajorAssets.length > 0 && hasUploadedWill) {
    alerts.push({
      title: "Major Assets Not Linked in Will",
      desc: `${recentMajorAssets.length} high-value asset(s) acquired after your last Will update: ${recentMajorAssets.slice(0, 3).join(', ')}. Generate a Codicil or update your Will.`,
      urgent: false,
      category: "will"
    });
  }

  // Allocation Validation Warning
  const allocationIssues = checkAllocationHealth();
  if (allocationIssues.unallocatedCount > 0) {
    alerts.push({
      title: `${allocationIssues.unallocatedCount} Asset(s) Not Fully Allocated (100%)`,
      desc: `Some assets have incomplete percentage distribution. Unallocated shares will fall back to the residuary clause.`,
      urgent: false,
      category: "will"
    });
  }

  // Insurance Underinsurance Shortfall
  const totalLiabilities = liabilities.reduce((s, l) => s + (Number(l.balance) || Number(l.value) || Number(l.amount) || 0), 0);
  if (totalLiabilities > 5000000) {
    const insuranceCover = getInsuranceCoverTotal();
    if (insuranceCover < totalLiabilities) {
      alerts.push({
        title: "Insurance Shortfall Detected",
        desc: `Your total liabilities are ₹${(totalLiabilities/100000).toFixed(1)}L but your life insurance cover is only ₹${(insuranceCover/100000).toFixed(1)}L. You are underinsured by ₹${((totalLiabilities - insuranceCover)/100000).toFixed(1)}L.`,
        urgent: true,
        category: "insurance"
      });
    }
  }

  return alerts;
}

function getAllEstateAssets() {
  const baseAssets = state.assets || [];
  const customAssets = (state.willDraft && state.willDraft.customAssets) || [];
  return [...baseAssets, ...customAssets];
}

function checkAllocationHealth() {
  const assets = getAllEstateAssets();
  const draft = getWillDraft();
  const allocations = draft.assetAllocations || {};

  let fullyAllocatedCount = 0;
  let unallocatedCount = 0;
  let overAllocatedCount = 0;

  assets.forEach(a => {
    const alloc = allocations[a.id];
    const share = alloc ? Number(alloc.share) : 0;
    if (share === 100) fullyAllocatedCount++;
    else if (share > 100) overAllocatedCount++;
    else unallocatedCount++;
  });

  return { fullyAllocatedCount, unallocatedCount, overAllocatedCount, total: assets.length };
}

function getInsuranceCoverTotal() {
  const docs = state.documents || [];
  let totalCover = 0;
  docs.forEach(d => {
    if (d.type && d.type.toLowerCase().includes('insurance')) {
      const val = Number(d.value) || Number(d.coverAmount) || 0;
      totalCover += val;
    }
  });
  return totalCover;
}

function getInsuranceGapAnalysis() {
  let totalLiabilities = (state.liabilities || []).reduce((s, l) => s + (Number(l.balance) || Number(l.value) || Number(l.amount) || 0), 0);
  (state.assets || []).forEach(a => {
    totalLiabilities += Number(a.loanAmount || a.loanBalance || a.outstandingLoan || 0);
  });
  const monthlyExpenses = Number(state.cash?.expenses || 0);
  const annualExpenses = monthlyExpenses * 12;
  const recommendedCover = totalLiabilities + (annualExpenses * 10);
  const currentCover = getInsuranceCoverTotal();
  const gap = recommendedCover - currentCover;
  const insuranceDocs = (state.documents || []).filter(d => d.type && d.type.toLowerCase().includes('insurance'));

  return {
    currentCover,
    recommendedCover,
    totalLiabilities,
    annualExpenses,
    gap: Math.max(0, gap),
    policyCount: insuranceDocs.length,
    isAdequate: currentCover >= recommendedCover
  };
}

function calculateWillStaleness() {
  const v = localVaultState.vault;
  const draft = state.willDraft;

  if (!v && (!draft || Object.keys(draft.assetAllocations || {}).length === 0)) {
    return { score: 0, label: "No Will Formed", color: "#ef4444", daysSince: null };
  }

  let score = 100;
  const now = new Date();
  const baseDate = v ? new Date(v.uploadedAt) : (draft.updatedAt ? new Date(draft.updatedAt) : now);
  const daysSince = Math.floor((now - baseDate) / (1000 * 60 * 60 * 24));

  score -= Math.floor(daysSince / 14);

  const familyCount = (state.family || []).length;
  const nomineeCount = (v?.nominees || []).length;
  if (familyCount > nomineeCount + 1) {
    score -= (familyCount - nomineeCount - 1) * 8;
  }

  const majorAssets = getAllEstateAssets().filter(a => (Number(a.value) || 0) >= 5000000);
  const assetsAfterWill = majorAssets.filter(a => a.acquisitionDate && new Date(a.acquisitionDate) > baseDate);
  score -= assetsAfterWill.length * 12;

  if (v && v.status === 'VERIFIED') score += 10;
  score = Math.max(0, Math.min(100, score));

  let label, color;
  if (score >= 80) { label = "Fresh & Compliant"; color = "#16a34a"; }
  else if (score >= 45) { label = "Needs Review"; color = "#d97706"; }
  else { label = "Outdated"; color = "#dc2626"; }

  return { score, label, color, daysSince };
}

function getNomineeHealthData() {
  const assets = getAllEstateAssets();
  const draftAllocations = (state.willDraft && state.willDraft.assetAllocations) || {};
  
  const withNominee = assets.filter(a => a.nominee || a.nomineeName || a.linkedTo || (draftAllocations[a.id] && draftAllocations[a.id].beneficiary));
  const withoutNominee = assets.filter(a => !a.nominee && !a.nomineeName && !a.linkedTo && (!draftAllocations[a.id] || !draftAllocations[a.id].beneficiary));
  const coverage = assets.length > 0 ? Math.round((withNominee.length / assets.length) * 100) : 100;

  return {
    total: assets.length,
    covered: withNominee.length,
    uncovered: withoutNominee.length,
    uncoveredNames: withoutNominee.slice(0, 5).map(a => a.name),
    coverage
  };
}

function renderEstateOverviewView() {
  const v = localVaultState.vault;
  const draft = getWillDraft();
  const staleness = calculateWillStaleness();
  const insuranceGap = getInsuranceGapAnalysis();
  const nomineeHealth = getNomineeHealthData();
  const agentAlerts = getEstateAgentAlerts();
  const allocationHealth = checkAllocationHealth();

  let statusBadge = `
    <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 14px; padding: 18px 22px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 14px; margin-bottom: 20px;">
      <div>
        <span style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: #64748b;">Vault Status</span>
        <h3 style="margin: 4px 0 2px; font-size: 16px; font-weight: 800; color: #0f172a;">
          ${v ? `Stored Document: ${v.status}` : (Object.keys(draft.assetAllocations || {}).length > 0 ? 'Digital Draft Ready' : 'Vault Awaiting Will Document')}
        </h3>
        <small style="color: #64748b; font-size: 12px;">Zero-knowledge encrypted architecture with automated trigger dispatches.</small>
      </div>
      <div style="display: flex; gap: 10px; flex-wrap: wrap;">
        <button class="secondary-action" onclick="switchVaultView('builder')" style="font-size: 12.5px; font-weight: 750;">
          Launch 5-Step Will Wizard
        </button>
        <button class="secondary-action" onclick="printEmergencyPocketCard()" style="font-size: 12.5px; font-weight: 750;">
          Print Emergency Pocket Card (PDF)
        </button>
        <label class="primary-action file-upload-btn" style="font-size: 12.5px; font-weight: 750; cursor: pointer;">
          Upload Signed Will (PDF)
          <input type="file" hidden accept=".pdf" onchange="uploadWillDocument(this)">
        </label>
      </div>
    </div>
  `;

  return `
    <section class="estate-overview-container" style="padding-bottom: 60px;">
      <!-- Hero Header -->
      <div style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); border-radius: 18px; padding: 24px 28px; color: #fff; box-shadow: 0 8px 24px rgba(15,23,42,0.12); margin-bottom: 24px;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 16px;">
          <div>
            <span style="font-size: 11px; font-weight: 800; color: #38bdf8; text-transform: uppercase; letter-spacing: 0.5px;">Institutional Estate Planning & Succession Vault</span>
            <h2 style="font-size: 22px; font-weight: 850; color: #fff; margin: 4px 0 6px;">Succession Intelligence & Estate Radar</h2>
            <p style="color: #cbd5e1; font-size: 13px; margin: 0; max-width: 680px; line-height: 1.45;">
              Monitor will freshness, asset distribution completeness, family insurance safety buffers, and download official legally compliant survivor dossiers.
            </p>
          </div>
          <div style="display: flex; gap: 10px; flex-wrap: wrap;">
            <button class="secondary-action" onclick="switchVaultView('videoScript')" style="background: rgba(255,255,255,0.1); color: #fff; border: 1px solid rgba(255,255,255,0.3); font-size: 12.5px; font-weight: 750; padding: 9px 14px; border-radius: 10px;">
              Video Will Recording Script
            </button>
            <button class="primary-action" onclick="generateSurvivorSummary()" style="background: #2563eb; color: #fff; border: none; font-size: 12.5px; font-weight: 800; padding: 9px 16px; border-radius: 10px; box-shadow: 0 4px 12px rgba(37,99,235,0.3);">
              Print Survivor Dossier (PDF)
            </button>
          </div>
        </div>
      </div>

      ${statusBadge}

      <!-- 4 Key Metric Radar Cards -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px; margin-bottom: 24px;">
        
        <!-- Metric 1: Will Freshness Gauge -->
        <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 20px 22px; box-shadow: 0 4px 16px rgba(0,0,0,0.03); display: flex; align-items: center; gap: 18px;">
          <div style="position: relative; width: 68px; height: 68px; flex-shrink: 0;">
            <svg viewBox="0 0 36 36" style="width: 68px; height: 68px; transform: rotate(-90deg);">
              <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#f1f5f9" stroke-width="3.5"/>
              <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="${staleness.color}" stroke-width="3.5" stroke-dasharray="${staleness.score}, 100" stroke-linecap="round"/>
            </svg>
            <div style="position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; font-size: 15px; font-weight: 800; color: ${staleness.color};">
              ${staleness.score}%
            </div>
          </div>
          <div>
            <span style="font-size: 10.5px; font-weight: 800; text-transform: uppercase; color: #64748b;">Will Freshness Index</span>
            <strong style="font-size: 15px; color: #0f172a; display: block; margin: 2px 0;">Status: <span style="color: ${staleness.color};">${staleness.label}</span></strong>
            <small style="color: #64748b; font-size: 11.5px;">${staleness.daysSince !== null ? `${staleness.daysSince} days since last legal update` : 'Draft a will to activate compliance index'}</small>
          </div>
        </div>

        <!-- Metric 2: Asset Allocation Health (100% Engine) -->
        <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 20px 22px; box-shadow: 0 4px 16px rgba(0,0,0,0.03);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <span style="font-size: 10.5px; font-weight: 800; text-transform: uppercase; color: #64748b;">100% Allocation Balance</span>
            <span style="font-size: 10.5px; font-weight: 800; background: ${allocationHealth.unallocatedCount === 0 ? '#dcfce7' : '#fef3c7'}; color: ${allocationHealth.unallocatedCount === 0 ? '#166534' : '#92400e'}; padding: 2px 7px; border-radius: 4px;">
              ${allocationHealth.fullyAllocatedCount} / ${allocationHealth.total} Balanced
            </span>
          </div>
          <div style="background: #f1f5f9; border-radius: 6px; height: 8px; overflow: hidden; margin: 8px 0 6px;">
            <div style="width: ${allocationHealth.total > 0 ? Math.round((allocationHealth.fullyAllocatedCount / allocationHealth.total) * 100) : 100}%; background: ${allocationHealth.unallocatedCount === 0 ? '#16a34a' : '#f59e0b'}; height: 100%; border-radius: 6px;"></div>
          </div>
          <small style="color: #64748b; font-size: 11.5px; display: block;">
            ${allocationHealth.unallocatedCount > 0 ? `${allocationHealth.unallocatedCount} asset(s) need percentage assignment` : 'All registered assets allocated to legal heirs'}
          </small>
        </div>

        <!-- Metric 3: Insurance Gap Radar -->
        <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 20px 22px; box-shadow: 0 4px 16px rgba(0,0,0,0.03);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <span style="font-size: 10.5px; font-weight: 800; text-transform: uppercase; color: #64748b;">Life Cover & Liabilities</span>
            <span style="font-size: 10.5px; font-weight: 800; background: ${insuranceGap.gap > 0 ? '#fee2e2' : '#dcfce7'}; color: ${insuranceGap.gap > 0 ? '#991b1b' : '#166534'}; padding: 2px 7px; border-radius: 4px;">
              ${insuranceGap.gap > 0 ? `₹${(insuranceGap.gap / 100000).toFixed(1)}L Shortfall` : 'Adequately Covered'}
            </span>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 12px; margin-top: 6px;">
            <div style="background: #f8fafc; padding: 6px 10px; border-radius: 8px; border: 1px solid #e2e8f0;">
              <small style="color: #64748b; display: block;">Active Cover</small>
              <strong style="color: #0f172a; font-size: 13.5px;">₹${(insuranceGap.currentCover / 100000).toFixed(1)}L</strong>
            </div>
            <div style="background: #f8fafc; padding: 6px 10px; border-radius: 8px; border: 1px solid #e2e8f0;">
              <small style="color: #64748b; display: block;">Target Need</small>
              <strong style="color: #0f172a; font-size: 13.5px;">₹${(insuranceGap.recommendedCover / 100000).toFixed(1)}L</strong>
            </div>
          </div>
        </div>

        <!-- Metric 4: Nominee Coverage -->
        <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 20px 22px; box-shadow: 0 4px 16px rgba(0,0,0,0.03);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <span style="font-size: 10.5px; font-weight: 800; text-transform: uppercase; color: #64748b;">Nominee Assignment</span>
            <strong style="font-size: 14px; font-weight: 800; color: ${nomineeHealth.coverage >= 80 ? '#166534' : '#d97706'};">${nomineeHealth.coverage}% Covered</strong>
          </div>
          <div style="background: #f1f5f9; border-radius: 6px; height: 8px; overflow: hidden; margin: 8px 0 6px;">
            <div style="width: ${nomineeHealth.coverage}%; background: ${nomineeHealth.coverage >= 80 ? '#16a34a' : '#f59e0b'}; height: 100%; border-radius: 6px;"></div>
          </div>
          <small style="color: #64748b; font-size: 11.5px; display: block;">${nomineeHealth.covered} of ${nomineeHealth.total} registered assets assigned directly.</small>
        </div>

      </div>

      <!-- Actionable Succession Alerts List -->
      <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 20px 24px; box-shadow: 0 4px 16px rgba(0,0,0,0.03); margin-bottom: 24px;">
        <h3 style="margin: 0 0 14px; font-size: 15.5px; font-weight: 800; color: #0f172a;">Actionable Succession & Estate Alerts (${agentAlerts.length})</h3>
        
        <div style="display: flex; flex-direction: column; gap: 10px;">
          ${agentAlerts.length === 0 ? `
            <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 10px; padding: 14px 16px; color: #166534; font-size: 13px; font-weight: 650;">
              Maximum estate readiness achieved. All assets are covered with active nominees and up-to-date insurance buffers.
            </div>
          ` : agentAlerts.map(a => `
            <div style="background: #ffffff; border: 1px solid #e2e8f0; border-left: 4px solid ${a.urgent ? '#ef4444' : '#f59e0b'}; border-radius: 10px; padding: 12px 16px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 3px;">
                <h4 style="margin: 0; font-size: 13.5px; font-weight: 800; color: #0f172a;">${escapeHtml(a.title)}</h4>
                ${a.urgent ? '<span style="font-size: 10px; font-weight: 800; color: #991b1b; background: #fee2e2; padding: 2px 6px; border-radius: 4px;">Urgent</span>' : ''}
              </div>
              <p style="margin: 0; font-size: 12px; color: #475569; line-height: 1.4;">${escapeHtml(a.desc)}</p>
            </div>
          `).join('')}
        </div>
      </div>

    </section>
  `;
}

// ═══════════════════════════════════════════════════════════
// MODULE 2: 5-STEP LEGAL WILL DRAFTING WIZARD
// ═══════════════════════════════════════════════════════════

function renderWillBuilderView() {
  const draft = getWillDraft();
  const assets = getAllEstateAssets();
  const family = state.family || [];

  return `
    <section class="will-builder-container" style="padding-bottom: 60px;">
      
      <!-- Wizard Step Header Navigation -->
      <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 18px 24px; box-shadow: 0 4px 16px rgba(0,0,0,0.03); margin-bottom: 24px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; flex-wrap: wrap; gap: 10px;">
          <div>
            <span style="font-size: 10.5px; font-weight: 800; color: #2563eb; text-transform: uppercase;">Indian Succession Act, 1925 Statutory Drafter</span>
            <h2 style="margin: 2px 0 0; font-size: 18px; font-weight: 850; color: #0f172a;">Interactive Legal Will Generator</h2>
          </div>
          <div style="display: flex; gap: 8px; flex-wrap: wrap;">
            <button onclick="switchVaultView('videoScript')" type="button" style="background: #f1f5f9; color: #334155; border: 1px solid #cbd5e1; padding: 8px 14px; border-radius: 8px; font-size: 12px; font-weight: 750; cursor: pointer;">
              Video Will Script
            </button>
            <button onclick="printOfficialWillPdf()" type="button" style="background: #0f172a; color: #fff; border: none; padding: 8px 16px; border-radius: 8px; font-size: 12.5px; font-weight: 800; cursor: pointer;">
              Print Official Will (PDF)
            </button>
          </div>
        </div>

        <!-- 5 Step Bar -->
        <div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px; font-size: 11.5px; font-weight: 750;">
          <button onclick="setWillStep(1)" style="padding: 8px; border-radius: 8px; border: 1px solid ${willBuilderStep === 1 ? '#2563eb' : '#e2e8f0'}; background: ${willBuilderStep === 1 ? '#eff6ff' : '#ffffff'}; color: ${willBuilderStep === 1 ? '#1e40af' : '#475569'}; cursor: pointer;">
            1. Testator
          </button>
          <button onclick="setWillStep(2)" style="padding: 8px; border-radius: 8px; border: 1px solid ${willBuilderStep === 2 ? '#2563eb' : '#e2e8f0'}; background: ${willBuilderStep === 2 ? '#eff6ff' : '#ffffff'}; color: ${willBuilderStep === 2 ? '#1e40af' : '#475569'}; cursor: pointer;">
            2. Executors
          </button>
          <button onclick="setWillStep(3)" style="padding: 8px; border-radius: 8px; border: 1px solid ${willBuilderStep === 3 ? '#2563eb' : '#e2e8f0'}; background: ${willBuilderStep === 3 ? '#eff6ff' : '#ffffff'}; color: ${willBuilderStep === 3 ? '#1e40af' : '#475569'}; cursor: pointer;">
            3. Asset Matrix & Heirlooms
          </button>
          <button onclick="setWillStep(4)" style="padding: 8px; border-radius: 8px; border: 1px solid ${willBuilderStep === 4 ? '#2563eb' : '#e2e8f0'}; background: ${willBuilderStep === 4 ? '#eff6ff' : '#ffffff'}; color: ${willBuilderStep === 4 ? '#1e40af' : '#475569'}; cursor: pointer;">
            4. Residuary
          </button>
          <button onclick="setWillStep(5)" style="padding: 8px; border-radius: 8px; border: 1px solid ${willBuilderStep === 5 ? '#2563eb' : '#e2e8f0'}; background: ${willBuilderStep === 5 ? '#eff6ff' : '#ffffff'}; color: ${willBuilderStep === 5 ? '#1e40af' : '#475569'}; cursor: pointer;">
            5. Witnesses
          </button>
        </div>
      </div>

      <!-- Step Content Area -->
      <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 24px; box-shadow: 0 4px 16px rgba(0,0,0,0.03);">
        ${renderCurrentWillStep(draft, assets, family)}
      </div>

    </section>
  `;
}

window.setWillStep = (step) => {
  willBuilderStep = step;
  renderWillVault();
};

function renderCurrentWillStep(draft, assets, family) {
  if (willBuilderStep === 1) {
    return `
      <div>
        <h3 style="margin: 0 0 4px; font-size: 16px; font-weight: 800; color: #0f172a;">Step 1: Testator Declaration & Revocation Clause</h3>
        <p style="color: #64748b; font-size: 12.5px; margin: 0 0 18px;">Specify the person making the Will and confirm sound mental capacity under the Indian Succession Act.</p>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 14px; font-size: 12.5px;">
          <div>
            <label style="display: block; font-weight: 700; color: #0f172a; margin-bottom: 4px;">Full Name of Testator</label>
            <input type="text" value="${escapeAttribute(draft.testatorName)}" oninput="updateWillDraftField('testatorName', this.value)" style="width: 100%; padding: 8px 12px; border: 1px solid #cbd5e1; border-radius: 8px;">
          </div>
          <div>
            <label style="display: block; font-weight: 700; color: #0f172a; margin-bottom: 4px;">Age (Years)</label>
            <input type="number" value="${draft.age}" oninput="updateWillDraftField('age', Number(this.value))" style="width: 100%; padding: 8px 12px; border: 1px solid #cbd5e1; border-radius: 8px;">
          </div>
          <div>
            <label style="display: block; font-weight: 700; color: #0f172a; margin-bottom: 4px;">Religion / Governing Law</label>
            <input type="text" value="${escapeAttribute(draft.religion)}" oninput="updateWillDraftField('religion', this.value)" placeholder="e.g. Hindu / Christian / Parsi" style="width: 100%; padding: 8px 12px; border: 1px solid #cbd5e1; border-radius: 8px;">
          </div>
          <div style="grid-column: 1 / -1;">
            <label style="display: block; font-weight: 700; color: #0f172a; margin-bottom: 4px;">Permanent Residential Address</label>
            <input type="text" value="${escapeAttribute(draft.address)}" oninput="updateWillDraftField('address', this.value)" style="width: 100%; padding: 8px 12px; border: 1px solid #cbd5e1; border-radius: 8px;">
          </div>
        </div>

        <div style="margin-top: 18px; background: #f8fafc; padding: 14px 16px; border-radius: 10px; border: 1px solid #e2e8f0; font-size: 12.5px;">
          <strong style="color: #0f172a; display: block; margin-bottom: 6px;">Statutory Legal Affirmations</strong>
          <label style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px; cursor: pointer;">
            <input type="checkbox" checked disabled style="accent-color: #16a34a;">
            <span>I declare that I am of sound disposing mind and memory, acting without any coercion, fraud, or undue influence.</span>
          </label>
          <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
            <input type="checkbox" ${draft.revokePrevious ? 'checked' : ''} onchange="updateWillDraftField('revokePrevious', this.checked)" style="accent-color: #16a34a;">
            <span>I hereby revoke all my previous Wills, Codicils, and Testamentary Dispositions made by me at any time.</span>
          </label>
        </div>

        <div style="margin-top: 20px; display: flex; justify-content: flex-end;">
          <button onclick="setWillStep(2)" style="background: #2563eb; color: #fff; border: none; padding: 8px 18px; border-radius: 8px; font-weight: 800; cursor: pointer;">
            Next: Executors & Guardians →
          </button>
        </div>
      </div>
    `;
  }

  if (willBuilderStep === 2) {
    return `
      <div>
        <h3 style="margin: 0 0 4px; font-size: 16px; font-weight: 800; color: #0f172a;">Step 2: Executor & Minor Guardian Appointments</h3>
        <p style="color: #64748b; font-size: 12.5px; margin: 0 0 18px;">An Executor is responsible for obtaining Probate, paying off liabilities, and distributing assets.</p>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 16px; font-size: 12.5px;">
          <!-- Primary Executor -->
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px;">
            <span style="font-size: 10px; font-weight: 800; color: #2563eb; text-transform: uppercase;">Primary Executor</span>
            <div style="margin-top: 8px;">
              <label style="display: block; font-weight: 700; color: #0f172a; margin-bottom: 2px;">Name</label>
              <input type="text" value="${escapeAttribute(draft.primaryExecutor?.name || '')}" oninput="updateNestedWillField('primaryExecutor', 'name', this.value)" style="width: 100%; padding: 6px 10px; border: 1px solid #cbd5e1; border-radius: 6px; margin-bottom: 8px;">
              
              <label style="display: block; font-weight: 700; color: #0f172a; margin-bottom: 2px;">Relationship</label>
              <input type="text" value="${escapeAttribute(draft.primaryExecutor?.relationship || '')}" oninput="updateNestedWillField('primaryExecutor', 'relationship', this.value)" style="width: 100%; padding: 6px 10px; border: 1px solid #cbd5e1; border-radius: 6px; margin-bottom: 8px;">

              <label style="display: block; font-weight: 700; color: #0f172a; margin-bottom: 2px;">Phone / Contact</label>
              <input type="text" value="${escapeAttribute(draft.primaryExecutor?.phone || '')}" oninput="updateNestedWillField('primaryExecutor', 'phone', this.value)" style="width: 100%; padding: 6px 10px; border: 1px solid #cbd5e1; border-radius: 6px;">
            </div>
          </div>

          <!-- Alternate Executor -->
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px;">
            <span style="font-size: 10px; font-weight: 800; color: #059669; text-transform: uppercase;">Alternate / Contingent Executor</span>
            <div style="margin-top: 8px;">
              <label style="display: block; font-weight: 700; color: #0f172a; margin-bottom: 2px;">Name</label>
              <input type="text" value="${escapeAttribute(draft.alternateExecutor?.name || '')}" oninput="updateNestedWillField('alternateExecutor', 'name', this.value)" style="width: 100%; padding: 6px 10px; border: 1px solid #cbd5e1; border-radius: 6px; margin-bottom: 8px;">
              
              <label style="display: block; font-weight: 700; color: #0f172a; margin-bottom: 2px;">Relationship</label>
              <input type="text" value="${escapeAttribute(draft.alternateExecutor?.relationship || '')}" oninput="updateNestedWillField('alternateExecutor', 'relationship', this.value)" style="width: 100%; padding: 6px 10px; border: 1px solid #cbd5e1; border-radius: 6px; margin-bottom: 8px;">

              <label style="display: block; font-weight: 700; color: #0f172a; margin-bottom: 2px;">Phone / Contact</label>
              <input type="text" value="${escapeAttribute(draft.alternateExecutor?.phone || '')}" oninput="updateNestedWillField('alternateExecutor', 'phone', this.value)" style="width: 100%; padding: 6px 10px; border: 1px solid #cbd5e1; border-radius: 6px;">
            </div>
          </div>
        </div>

        <div style="margin-top: 16px; background: #fff7ed; border: 1px solid #fed7aa; border-radius: 12px; padding: 16px; font-size: 12.5px;">
          <strong style="color: #9a3412; display: block; margin-bottom: 4px;">Guardian for Minor Children (Under 18 Years)</strong>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
            <div>
              <label style="display: block; font-size: 11.5px; font-weight: 700;">Guardian Full Name</label>
              <input type="text" value="${escapeAttribute(draft.minorGuardian?.name || '')}" oninput="updateNestedWillField('minorGuardian', 'name', this.value)" style="width: 100%; padding: 6px 10px; border: 1px solid #fed7aa; border-radius: 6px;">
            </div>
            <div>
              <label style="display: block; font-size: 11.5px; font-weight: 700;">Relationship with Children</label>
              <input type="text" value="${escapeAttribute(draft.minorGuardian?.relationship || '')}" oninput="updateNestedWillField('minorGuardian', 'relationship', this.value)" style="width: 100%; padding: 6px 10px; border: 1px solid #fed7aa; border-radius: 6px;">
            </div>
          </div>
        </div>

        <div style="margin-top: 20px; display: flex; justify-content: space-between;">
          <button onclick="setWillStep(1)" style="background: #f1f5f9; color: #475569; border: 1px solid #cbd5e1; padding: 8px 18px; border-radius: 8px; font-weight: 700; cursor: pointer;">
            ← Back
          </button>
          <button onclick="setWillStep(3)" style="background: #2563eb; color: #fff; border: none; padding: 8px 18px; border-radius: 8px; font-weight: 800; cursor: pointer;">
            Next: Asset Allocation Matrix →
          </button>
        </div>
      </div>
    `;
  }

  if (willBuilderStep === 3) {
    const allocations = draft.assetAllocations || {};

    return `
      <div>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; flex-wrap: wrap; gap: 10px;">
          <div>
            <h3 style="margin: 0; font-size: 16px; font-weight: 800; color: #0f172a;">Step 3: Specific Bequests & Asset Allocation Matrix</h3>
            <p style="color: #64748b; font-size: 12.5px; margin: 2px 0 0;">Assign your registered assets and physical heirlooms to specific beneficiaries with real-time 100% allocation balance.</p>
          </div>
          <button onclick="showAddCustomHeirloomModal()" type="button" style="background: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe; font-size: 12px; font-weight: 750; padding: 7px 12px; border-radius: 8px; cursor: pointer;">
            + Add Physical Asset / Heirloom / Gold
          </button>
        </div>

        <div style="overflow-x: auto;">
          <table style="width: 100%; border-collapse: collapse; font-size: 12.5px; text-align: left;">
            <thead>
              <tr style="background: #f8fafc; border-bottom: 2px solid #e2e8f0; color: #475569; font-weight: 750;">
                <th style="padding: 10px 12px;">Asset & Category</th>
                <th style="padding: 10px 12px;">Estimated Value</th>
                <th style="padding: 10px 12px;">Allocated Beneficiary</th>
                <th style="padding: 10px 12px;">Share & Validation</th>
                <th style="padding: 10px 12px;">Conditions / Action</th>
              </tr>
            </thead>
            <tbody>
              ${assets.length === 0 ? `
                <tr><td colspan="5" style="padding: 16px; text-align: center; color: #94a3b8;">No assets found. Click "+ Add Physical Asset / Heirloom" above to add family properties or jewelry.</td></tr>
              ` : assets.map(a => {
                const alloc = allocations[a.id] || { beneficiary: a.nominee || family[0]?.name || "Spouse", share: 100, notes: "Absolute and exclusive ownership" };
                const share = Number(alloc.share) || 0;
                let badgeColor = share === 100 ? '#166534' : (share > 100 ? '#991b1b' : '#92400e');
                let badgeBg = share === 100 ? '#dcfce7' : (share > 100 ? '#fee2e2' : '#fef3c7');
                let badgeText = share === 100 ? '100% Balanced' : (share > 100 ? `Over ${share}%` : `${share}% (Rem ${100 - share}%)`);

                return `
                  <tr style="border-bottom: 1px solid #f1f5f9;">
                    <td style="padding: 10px 12px;">
                      <strong style="color: #0f172a; display: block;">${escapeHtml(a.name)}</strong>
                      <small style="color: #64748b;">${escapeHtml(a.type || a.category || 'Asset')}</small>
                    </td>
                    <td style="padding: 10px 12px; font-weight: 700; color: #0f172a;">
                      ${money(a.value || 0)}
                    </td>
                    <td style="padding: 10px 12px;">
                      <input type="text" value="${escapeAttribute(alloc.beneficiary || '')}" oninput="updateAssetAllocation('${a.id}', 'beneficiary', this.value)" placeholder="e.g. Spouse / Son" style="padding: 5px 8px; border: 1px solid #cbd5e1; border-radius: 6px; width: 140px;">
                    </td>
                    <td style="padding: 10px 12px;">
                      <div style="display: flex; align-items: center; gap: 6px;">
                        <input type="number" min="1" max="100" value="${share}" oninput="updateAssetAllocation('${a.id}', 'share', Number(this.value))" style="padding: 5px 8px; border: 1px solid #cbd5e1; border-radius: 6px; width: 60px;">
                        <span style="font-size: 10.5px; font-weight: 750; background: ${badgeBg}; color: ${badgeColor}; padding: 2px 6px; border-radius: 4px; white-space: nowrap;">
                          ${badgeText}
                        </span>
                      </div>
                    </td>
                    <td style="padding: 10px 12px;">
                      <div style="display: flex; gap: 6px; align-items: center;">
                        <input type="text" value="${escapeAttribute(alloc.notes || '')}" oninput="updateAssetAllocation('${a.id}', 'notes', this.value)" placeholder="Conditions" style="padding: 5px 8px; border: 1px solid #cbd5e1; border-radius: 6px; width: 100%;">
                        ${share < 100 ? `
                          <button onclick="balanceAssetTo100('${a.id}')" title="Set to 100%" style="background: #f1f5f9; border: 1px solid #cbd5e1; padding: 4px 8px; border-radius: 5px; font-size: 11px; cursor: pointer; white-space: nowrap;">
                            Fill 100%
                          </button>
                        ` : ''}
                      </div>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>

        <div style="margin-top: 20px; display: flex; justify-content: space-between;">
          <button onclick="setWillStep(2)" style="background: #f1f5f9; color: #475569; border: 1px solid #cbd5e1; padding: 8px 18px; border-radius: 8px; font-weight: 700; cursor: pointer;">
            ← Back
          </button>
          <button onclick="setWillStep(4)" style="background: #2563eb; color: #fff; border: none; padding: 8px 18px; border-radius: 8px; font-weight: 800; cursor: pointer;">
            Next: Residuary Estate →
          </button>
        </div>
      </div>
    `;
  }

  if (willBuilderStep === 4) {
    return `
      <div>
        <h3 style="margin: 0 0 4px; font-size: 16px; font-weight: 800; color: #0f172a;">Step 4: Residuary Estate & Fallback Clauses</h3>
        <p style="color: #64748b; font-size: 12.5px; margin: 0 0 18px;">A Residuary Clause ensures any unlisted, forgotten, or future acquired property passes cleanly without court dispute.</p>

        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px; font-size: 12.5px;">
          <strong style="color: #0f172a; display: block; margin-bottom: 8px;">Primary Residuary Beneficiary</strong>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px;">
            <div>
              <label style="display: block; font-weight: 700; color: #0f172a; margin-bottom: 2px;">Beneficiary Name</label>
              <input type="text" value="${escapeAttribute(draft.residuaryBeneficiary?.name || '')}" oninput="updateNestedWillField('residuaryBeneficiary', 'name', this.value)" style="width: 100%; padding: 6px 10px; border: 1px solid #cbd5e1; border-radius: 6px;">
            </div>
            <div>
              <label style="display: block; font-weight: 700; color: #0f172a; margin-bottom: 2px;">Relationship</label>
              <input type="text" value="${escapeAttribute(draft.residuaryBeneficiary?.relationship || '')}" oninput="updateNestedWillField('residuaryBeneficiary', 'relationship', this.value)" style="width: 100%; padding: 6px 10px; border: 1px solid #cbd5e1; border-radius: 6px;">
            </div>
            <div>
              <label style="display: block; font-weight: 700; color: #0f172a; margin-bottom: 2px;">Residual Share (%)</label>
              <input type="number" value="${draft.residuaryBeneficiary?.share || 100}" oninput="updateNestedWillField('residuaryBeneficiary', 'share', Number(this.value))" style="width: 100%; padding: 6px 10px; border: 1px solid #cbd5e1; border-radius: 6px;">
            </div>
          </div>
        </div>

        <div style="margin-top: 20px; display: flex; justify-content: space-between;">
          <button onclick="setWillStep(3)" style="background: #f1f5f9; color: #475569; border: 1px solid #cbd5e1; padding: 8px 18px; border-radius: 8px; font-weight: 700; cursor: pointer;">
            ← Back
          </button>
          <button onclick="setWillStep(5)" style="background: #2563eb; color: #fff; border: none; padding: 8px 18px; border-radius: 8px; font-weight: 800; cursor: pointer;">
            Next: Witnesses & Attestation →
          </button>
        </div>
      </div>
    `;
  }

  if (willBuilderStep === 5) {
    return `
      <div>
        <h3 style="margin: 0 0 4px; font-size: 16px; font-weight: 800; color: #0f172a;">Step 5: Two-Witness Attestation & Medical Fitness</h3>
        <p style="color: #64748b; font-size: 12.5px; margin: 0 0 18px;">Under Section 63 of the Indian Succession Act, 1925, a Will MUST be attested by at least TWO independent witnesses who are NOT beneficiaries.</p>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 14px; font-size: 12.5px;">
          <!-- Witness 1 -->
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px;">
            <span style="font-size: 10.5px; font-weight: 800; color: #2563eb; text-transform: uppercase;">Independent Witness 1</span>
            <div style="margin-top: 8px;">
              <label style="display: block; font-weight: 700; margin-bottom: 2px;">Full Name</label>
              <input type="text" value="${escapeAttribute(draft.witness1?.name || '')}" oninput="updateNestedWillField('witness1', 'name', this.value)" style="width: 100%; padding: 6px 10px; border: 1px solid #cbd5e1; border-radius: 6px; margin-bottom: 8px;">
              
              <label style="display: block; font-weight: 700; margin-bottom: 2px;">Occupation</label>
              <input type="text" value="${escapeAttribute(draft.witness1?.occupation || '')}" oninput="updateNestedWillField('witness1', 'occupation', this.value)" style="width: 100%; padding: 6px 10px; border: 1px solid #cbd5e1; border-radius: 6px; margin-bottom: 8px;">

              <label style="display: block; font-weight: 700; margin-bottom: 2px;">Address</label>
              <input type="text" value="${escapeAttribute(draft.witness1?.address || '')}" oninput="updateNestedWillField('witness1', 'address', this.value)" style="width: 100%; padding: 6px 10px; border: 1px solid #cbd5e1; border-radius: 6px;">
            </div>
          </div>

          <!-- Witness 2 -->
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px;">
            <span style="font-size: 10.5px; font-weight: 800; color: #2563eb; text-transform: uppercase;">Independent Witness 2</span>
            <div style="margin-top: 8px;">
              <label style="display: block; font-weight: 700; margin-bottom: 2px;">Full Name</label>
              <input type="text" value="${escapeAttribute(draft.witness2?.name || '')}" oninput="updateNestedWillField('witness2', 'name', this.value)" style="width: 100%; padding: 6px 10px; border: 1px solid #cbd5e1; border-radius: 6px; margin-bottom: 8px;">
              
              <label style="display: block; font-weight: 700; margin-bottom: 2px;">Occupation</label>
              <input type="text" value="${escapeAttribute(draft.witness2?.occupation || '')}" oninput="updateNestedWillField('witness2', 'occupation', this.value)" style="width: 100%; padding: 6px 10px; border: 1px solid #cbd5e1; border-radius: 6px; margin-bottom: 8px;">

              <label style="display: block; font-weight: 700; margin-bottom: 2px;">Address</label>
              <input type="text" value="${escapeAttribute(draft.witness2?.address || '')}" oninput="updateNestedWillField('witness2', 'address', this.value)" style="width: 100%; padding: 6px 10px; border: 1px solid #cbd5e1; border-radius: 6px;">
            </div>
          </div>
        </div>

        <!-- Doctor Certification Clause -->
        <div style="margin-top: 16px; background: #faf5ff; border: 1px solid #e9d5ff; border-radius: 12px; padding: 16px; font-size: 12.5px;">
          <span style="font-size: 10.5px; font-weight: 800; color: #7c3aed; text-transform: uppercase;">Optional Doctor's Certificate of Mental Fitness (Probate Bulletproofing)</span>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px; margin-top: 8px;">
            <div>
              <label style="display: block; font-weight: 700; margin-bottom: 2px;">Practicing Physician Name</label>
              <input type="text" value="${escapeAttribute(draft.doctorCertification?.name || '')}" oninput="updateNestedWillField('doctorCertification', 'name', this.value)" style="width: 100%; padding: 6px 10px; border: 1px solid #e9d5ff; border-radius: 6px;">
            </div>
            <div>
              <label style="display: block; font-weight: 700; margin-bottom: 2px;">Medical Council Reg No.</label>
              <input type="text" value="${escapeAttribute(draft.doctorCertification?.regNo || '')}" oninput="updateNestedWillField('doctorCertification', 'regNo', this.value)" style="width: 100%; padding: 6px 10px; border: 1px solid #e9d5ff; border-radius: 6px;">
            </div>
          </div>
        </div>

        <div style="margin-top: 22px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
          <button onclick="setWillStep(4)" style="background: #f1f5f9; color: #475569; border: 1px solid #cbd5e1; padding: 8px 18px; border-radius: 8px; font-weight: 700; cursor: pointer;">
            ← Back
          </button>
          <button onclick="printOfficialWillPdf()" style="background: #16a34a; color: #fff; border: none; padding: 10px 24px; border-radius: 8px; font-weight: 850; font-size: 13.5px; cursor: pointer; box-shadow: 0 4px 12px rgba(22,163,74,0.3);">
            Generate & Print Official Legal Will (PDF)
          </button>
        </div>
      </div>
    `;
  }
}

function updateWillDraftField(key, value) {
  state.willDraft = state.willDraft || {};
  state.willDraft[key] = value;
  state.willDraft.updatedAt = new Date().toISOString();
  scheduleSave();
}

function updateNestedWillField(parent, key, value) {
  state.willDraft = state.willDraft || {};
  state.willDraft[parent] = state.willDraft[parent] || {};
  state.willDraft[parent][key] = value;
  state.willDraft.updatedAt = new Date().toISOString();
  scheduleSave();
}

function updateAssetAllocation(assetId, field, value) {
  state.willDraft = state.willDraft || {};
  state.willDraft.assetAllocations = state.willDraft.assetAllocations || {};
  state.willDraft.assetAllocations[assetId] = state.willDraft.assetAllocations[assetId] || { beneficiary: '', share: 100, notes: '' };
  state.willDraft.assetAllocations[assetId][field] = value;
  state.willDraft.updatedAt = new Date().toISOString();
  scheduleSave();
  renderWillVault();
}

window.balanceAssetTo100 = (assetId) => {
  updateAssetAllocation(assetId, 'share', 100);
};

window.showAddCustomHeirloomModal = () => {
  const name = prompt("Physical Asset / Heirloom Description (e.g., '200g 22K Gold Ancestral Jewelry', 'Ancestral Land Plot #14'):");
  if (!name) return;
  const valueStr = prompt("Estimated Value in ₹ (e.g., 1500000):", "1000000");
  const value = Number(valueStr) || 0;
  const category = prompt("Category (e.g. Gold/Jewelry, Ancestral Property, Vehicle, Collectibles):", "Gold/Jewelry");

  const newAsset = {
    id: 'custom_' + Date.now(),
    name,
    value,
    type: category,
    isCustomEstateAsset: true
  };

  state.willDraft = state.willDraft || {};
  state.willDraft.customAssets = state.willDraft.customAssets || [];
  state.willDraft.customAssets.push(newAsset);
  state.willDraft.updatedAt = new Date().toISOString();
  scheduleSave();
  renderWillVault();
};

// ═══════════════════════════════════════════════════════════
// MODULE 3: VIDEO WILL RECORDING SCRIPT (SECTION 65B EVIDENCE)
// ═══════════════════════════════════════════════════════════

function renderVideoScriptView() {
  const d = getWillDraft();
  const assets = getAllEstateAssets();
  const todayStr = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

  return `
    <section class="video-will-script-container" style="padding-bottom: 60px;">
      <div style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); border-radius: 18px; padding: 24px 28px; color: #fff; box-shadow: 0 8px 24px rgba(15,23,42,0.12); margin-bottom: 24px;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 16px;">
          <div>
            <span style="font-size: 11px; font-weight: 800; color: #38bdf8; text-transform: uppercase;">Section 65B Indian Evidence Act Evidentiary Protocol</span>
            <h2 style="font-size: 22px; font-weight: 850; color: #fff; margin: 4px 0 6px;">Video Testament Teleprompter Script</h2>
            <p style="color: #cbd5e1; font-size: 13px; margin: 0; max-width: 680px; line-height: 1.45;">
              Reading this exact script on a smartphone video in the presence of your two independent witnesses provides definitive legal proof of sound mind, preventing any family probate contestation.
            </p>
          </div>
          <button onclick="window.print()" type="button" style="background: #2563eb; color: #fff; border: none; padding: 10px 18px; border-radius: 10px; font-size: 13px; font-weight: 800; cursor: pointer;">
            Print Teleprompter Cards (PDF)
          </button>
        </div>
      </div>

      <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 26px 30px; box-shadow: 0 4px 16px rgba(0,0,0,0.03); font-size: 14px; line-height: 1.7; color: #1e293b;">
        
        <div style="background: #eff6ff; border-left: 4px solid #2563eb; padding: 12px 16px; border-radius: 8px; margin-bottom: 20px; font-size: 12.5px; color: #1e40af;">
          <b>Recording Guidelines:</b> Ensure adequate daylight, look directly at the camera, state the date clearly, and show both witnesses in the frame as you sign your written Will.
        </div>

        <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 12px; padding: 20px; font-family: Georgia, serif; font-size: 15px; color: #0f172a; line-height: 1.8;">
          <p>
            "My name is <b>${escapeHtml(d.testatorName)}</b>, aged <b>${d.age}</b> years, residing at <b>${escapeHtml(d.address)}</b>.
          </p>
          <p>
            Today is <b>${todayStr}</b>. I am recording this video of my own free will, in full sound disposing mind, memory, and physical health, without any coercion, fraud, or undue influence from anyone.
          </p>
          <p>
            I have drafted and signed my Last Will and Testament. I appoint <b>${escapeHtml(d.primaryExecutor?.name || 'my Executor')}</b> as the sole Executor of my estate.
          </p>
          <p>
            I have allocated my ${assets.length} estate properties to my designated beneficiaries per the schedule of bequests in my signed document. Any remaining residue shall pass to <b>${escapeHtml(d.residuaryBeneficiary?.name || 'my Primary Beneficiary')}</b>.
          </p>
          <p>
            Present in the room with me are my two independent attesting witnesses: <b>${escapeHtml(d.witness1?.name || 'Witness 1')}</b> and <b>${escapeHtml(d.witness2?.name || 'Witness 2')}</b>, who are watching me execute this document and are signing it in my presence."
          </p>
        </div>

        <div style="margin-top: 20px; display: flex; justify-content: flex-end;">
          <button onclick="switchVaultView('builder')" style="background: #2563eb; color: #fff; border: none; padding: 8px 18px; border-radius: 8px; font-weight: 800; cursor: pointer;">
            Return to Will Wizard →
          </button>
        </div>
      </div>
    </section>
  `;
}

// ═══════════════════════════════════════════════════════════
// EMERGENCY POCKET SUCCESSION CARD (WALLET PDF)
// ═══════════════════════════════════════════════════════════

window.printEmergencyPocketCard = () => {
  const d = getWillDraft();
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert("Please allow popups to generate the Emergency Pocket Card.");
    return;
  }

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Emergency Succession Card — ${escapeHtml(d.testatorName)}</title>
        <style>
          @page { size: A4; margin: 15mm; }
          body { font-family: 'Segoe UI', system-ui, sans-serif; color: #0f172a; margin: 0; padding: 10px; }
          .card { width: 340px; border: 2px solid #0f172a; border-radius: 12px; padding: 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); background: #ffffff; margin-bottom: 20px; }
          .card-header { background: #0f172a; color: #ffffff; padding: 8px 12px; border-radius: 6px; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; text-align: center; margin-bottom: 12px; }
          .row { margin-bottom: 8px; font-size: 11.5px; border-bottom: 1px solid #f1f5f9; padding-bottom: 4px; }
          .label { color: #64748b; font-size: 9.5px; text-transform: uppercase; font-weight: 750; display: block; }
          .val { font-weight: 750; color: #0f172a; font-size: 12px; }
          .urgent-note { background: #fef2f2; color: #991b1b; padding: 6px; border-radius: 6px; font-size: 10px; text-align: center; font-weight: 700; margin-top: 10px; }
        </style>
      </head>
      <body>
        <p style="font-size: 12px; color: #64748b; margin-bottom: 14px;">Print and cut along the border. Carry in wallet or keep with primary family documents.</p>
        
        <div class="card">
          <div class="card-header">EMERGENCY SUCCESSION & MEDICAL PROXY CARD</div>
          
          <div class="row">
            <span class="label">Testator / Declarant</span>
            <span class="val">${escapeHtml(d.testatorName)} (Age ${d.age})</span>
          </div>

          <div class="row">
            <span class="label">Primary Executor & Contact</span>
            <span class="val">${escapeHtml(d.primaryExecutor?.name || 'Spouse')} &bull; ${escapeHtml(d.primaryExecutor?.phone || 'Contact on file')}</span>
          </div>

          <div class="row">
            <span class="label">Family Physician / Clinic</span>
            <span class="val">${escapeHtml(d.doctorCertification?.name || 'Dr. On Record')} (${escapeHtml(d.doctorCertification?.regNo || 'Reg MCI')})</span>
          </div>

          <div class="row">
            <span class="label">Independent Witnesses</span>
            <span class="val">${escapeHtml(d.witness1?.name || 'Witness 1')} &bull; ${escapeHtml(d.witness2?.name || 'Witness 2')}</span>
          </div>

          <div class="row">
            <span class="label">Digital Will Vault Storage</span>
            <span class="val">Zero-Knowledge Encrypted on Wealth OS</span>
          </div>

          <div class="urgent-note">
            IN EMERGENCY: Contact Primary Executor immediately to trigger certified disclosure.
          </div>
        </div>

        <script>window.print();</script>
      </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
};

// ═══════════════════════════════════════════════════════════
// LEGAL PDF WILL ENGINE (INDIAN SUCCESSION ACT, 1925 FORMAT)
// ═══════════════════════════════════════════════════════════

window.printOfficialWillPdf = () => {
  const d = getWillDraft();
  const assets = getAllEstateAssets();
  const allocations = d.assetAllocations || {};

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert("Please allow popups to generate the printable legal Will document.");
    return;
  }

  const assetListHtml = assets.map((a, idx) => {
    const alloc = allocations[a.id] || { beneficiary: a.nominee || "Spouse", share: 100, notes: "Absolute owner" };
    return `
      <tr>
        <td style="padding: 8px 10px; border: 1px solid #cbd5e1; text-align: center;">${idx + 1}</td>
        <td style="padding: 8px 10px; border: 1px solid #cbd5e1;"><b>${escapeHtml(a.name)}</b> (${escapeHtml(a.type || a.category || 'Asset')})</td>
        <td style="padding: 8px 10px; border: 1px solid #cbd5e1;">₹${(Number(a.value) || 0).toLocaleString('en-IN')}</td>
        <td style="padding: 8px 10px; border: 1px solid #cbd5e1;"><b>${escapeHtml(alloc.beneficiary || 'Spouse')}</b> (${alloc.share || 100}%)</td>
        <td style="padding: 8px 10px; border: 1px solid #cbd5e1;">${escapeHtml(alloc.notes || 'Absolute bequest')}</td>
      </tr>
    `;
  }).join('');

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Last Will and Testament — ${escapeHtml(d.testatorName)}</title>
        <style>
          @page { size: A4; margin: 25mm 20mm 25mm 20mm; }
          body { font-family: 'Times New Roman', serif; font-size: 13pt; line-height: 1.65; color: #111; margin: 0 auto; max-width: 800px; padding: 20px; }
          h1 { text-align: center; font-size: 18pt; text-transform: uppercase; letter-spacing: 1.5px; border-bottom: 2px solid #000; padding-bottom: 8px; margin-bottom: 25px; }
          h2 { font-size: 13.5pt; text-transform: uppercase; margin-top: 22px; margin-bottom: 8px; }
          p { text-align: justify; margin-bottom: 14px; text-indent: 30px; }
          .no-indent { text-indent: 0; }
          table { width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 11pt; }
          th { background: #f1f5f9; border: 1px solid #cbd5e1; padding: 8px 10px; text-align: left; font-weight: bold; }
          .signature-box { margin-top: 40px; display: flex; justify-content: space-between; page-break-inside: avoid; }
          .sig-line { width: 280px; border-top: 1px solid #000; text-align: center; padding-top: 6px; font-size: 11.5pt; }
          .attestation-block { border: 1px solid #666; padding: 18px; margin-top: 30px; background: #fafafa; page-break-inside: avoid; }
          .doctor-block { border: 1px dashed #666; padding: 14px; margin-top: 24px; font-size: 11pt; }
        </style>
      </head>
      <body>
        <h1>LAST WILL AND TESTAMENT</h1>

        <p class="no-indent">
          I, <b>${escapeHtml(d.testatorName)}</b>, aged about <b>${d.age}</b> years, residing at <b>${escapeHtml(d.address)}</b>, an Indian inhabitant, adhering to the <b>${escapeHtml(d.religion)}</b> religion, do hereby execute and publish this as my <b>LAST WILL AND TESTAMENT</b>, revoking all previous Wills, Codicils, and testamentary dispositions made by me at any time.
        </p>

        <h2>1. DECLARATION OF SOUND MIND</h2>
        <p>
          I declare that I am in good health, of sound disposing mind and memory, and possessing full testamentary capacity. I execute this Will out of my own free will, without any fraud, coercion, persuasion, or undue influence from any person whomsoever.
        </p>

        <h2>2. APPOINTMENT OF EXECUTORS</h2>
        <p>
          I hereby appoint my <b>${escapeHtml(d.primaryExecutor?.relationship || 'Spouse')}</b>, <b>${escapeHtml(d.primaryExecutor?.name || 'Executor')}</b>, residing at ${escapeHtml(d.primaryExecutor?.address || d.address)}, as the sole <b>Executor and Trustee</b> of this my Will.
        </p>
        ${d.alternateExecutor?.name ? `
        <p>
          In the event that the said ${escapeHtml(d.primaryExecutor?.name)} is unable or unwilling to act as Executor, I hereby appoint <b>${escapeHtml(d.alternateExecutor.name)}</b> (${escapeHtml(d.alternateExecutor.relationship)}) as the Alternate Executor of this my Will.
        </p>
        ` : ''}

        <h2>3. GUARDIANSHIP OF MINORS</h2>
        <p>
          If at the time of my demise any of my children are minors, I appoint <b>${escapeHtml(d.minorGuardian?.name || 'Guardian')}</b> (${escapeHtml(d.minorGuardian?.relationship || 'Family')}) to be the legal guardian of the person and property of such minor children until they attain the age of majority.
        </p>

        <h2>4. SCHEDULE OF BEQUESTS & ASSET DISTRIBUTION</h2>
        <p>
          I direct that all my just debts, testamentary expenses, and funeral expenses be first paid out of my estate. Thereafter, I devise and bequeath my respective movable and immovable properties described below:
        </p>

        <table>
          <thead>
            <tr>
              <th style="width: 5%;">#</th>
              <th style="width: 35%;">Description of Asset</th>
              <th style="width: 20%;">Approx. Value</th>
              <th style="width: 25%;">Beneficiary & Share</th>
              <th style="width: 15%;">Tenure</th>
            </tr>
          </thead>
          <tbody>
            ${assetListHtml || '<tr><td colspan="5" style="text-align:center; padding:12px;">All assets to pass per residuary clause.</td></tr>'}
          </tbody>
        </table>

        <h2>5. RESIDUARY ESTATE CLAUSE</h2>
        <p>
          I give, devise, and bequeath all the rest, residue, and remainder of my estate, both real and personal, of whatsoever nature and wheresoever situated, including any future assets acquired by me, unto <b>${escapeHtml(d.residuaryBeneficiary?.name || 'Primary Beneficiary')}</b> (${escapeHtml(d.residuaryBeneficiary?.relationship || 'Spouse')}) absolutely and forever.
        </p>

        <p>
          IN WITNESS WHEREOF, I, the said <b>${escapeHtml(d.testatorName)}</b>, have hereunto set my hand and signature on this <b>${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</b> at Mumbai, India.
        </p>

        <div class="signature-box">
          <div></div>
          <div class="sig-line">
            <b>${escapeHtml(d.testatorName)}</b><br>
            (Signature of the Testator)
          </div>
        </div>

        <div class="attestation-block">
          <h3 style="margin: 0 0 8px; font-size: 12pt; text-transform: uppercase;">ATTESTATION BY TWO INDEPENDENT WITNESSES</h3>
          <p class="no-indent" style="font-size: 11pt;">
            Signed, published, and declared by the above-named Testator <b>${escapeHtml(d.testatorName)}</b> as their Last Will and Testament, in the presence of us, who in their presence, at their request, and in the presence of each other, have subscribed our names as attesting witnesses:
          </p>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 20px;">
            <div>
              <b>Witness 1:</b><br>
              Name: ${escapeHtml(d.witness1?.name || '_________________________')}<br>
              Occupation: ${escapeHtml(d.witness1?.occupation || '____________________')}<br>
              Address: ${escapeHtml(d.witness1?.address || '_______________________')}<br><br>
              Signature: __________________________
            </div>
            <div>
              <b>Witness 2:</b><br>
              Name: ${escapeHtml(d.witness2?.name || '_________________________')}<br>
              Occupation: ${escapeHtml(d.witness2?.occupation || '____________________')}<br>
              Address: ${escapeHtml(d.witness2?.address || '_______________________')}<br><br>
              Signature: __________________________
            </div>
          </div>
        </div>

        ${d.doctorCertification?.name ? `
        <div class="doctor-block">
          <b>MEDICAL FITNESS CERTIFICATE (OPTIONAL CLAUSE):</b><br>
          I, <b>${escapeHtml(d.doctorCertification.name)}</b> (Reg No: ${escapeHtml(d.doctorCertification.regNo)}), hereby certify that I have examined the Testator on ${new Date().toLocaleDateString('en-IN')} and found them to be in full possession of their mental faculties and of sound disposing mind.
          <br><br>
          Doctor's Signature & Seal: ____________________________
        </div>
        ` : ''}

        <script>
          window.print();
        </script>
      </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
};

// ═══════════════════════════════════════════════════════════
// MODULE 4: LIVING WILL & ADVANCE HEALTHCARE DIRECTIVE
// ═══════════════════════════════════════════════════════════

function renderLivingWillView() {
  const lw = getLivingWillDraft();

  return `
    <section class="living-will-container" style="padding-bottom: 60px;">
      
      <div style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); border-radius: 18px; padding: 24px 28px; color: #fff; box-shadow: 0 8px 24px rgba(15,23,42,0.12); margin-bottom: 24px;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 16px;">
          <div>
            <span style="font-size: 11px; font-weight: 800; color: #38bdf8; text-transform: uppercase;">Supreme Court of India (Common Cause Guidelines)</span>
            <h2 style="font-size: 22px; font-weight: 850; color: #fff; margin: 4px 0 6px;">Living Will & Advance Medical Directive</h2>
            <p style="color: #cbd5e1; font-size: 13px; margin: 0; max-width: 680px; line-height: 1.45;">
              Legally express your healthcare choices regarding life support, ventilator withdrawal, and designate trusted Healthcare Surrogates in the event of medical incapacitation.
            </p>
          </div>
          <button onclick="printOfficialLivingWillPdf()" type="button" style="background: #2563eb; color: #fff; border: none; padding: 10px 20px; border-radius: 10px; font-size: 13px; font-weight: 800; cursor: pointer; box-shadow: 0 4px 12px rgba(37,99,235,0.3);">
            Print Official Living Will (PDF)
          </button>
        </div>
      </div>

      <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 24px; box-shadow: 0 4px 16px rgba(0,0,0,0.03);">
        <h3 style="margin: 0 0 14px; font-size: 16px; font-weight: 800; color: #0f172a;">Healthcare Directive Preferences</h3>

        <div style="display: flex; flex-direction: column; gap: 14px; font-size: 13px;">
          <label style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 14px 16px; border-radius: 10px; display: flex; align-items: flex-start; gap: 10px; cursor: pointer;">
            <input type="checkbox" ${lw.dnrPreferred ? 'checked' : ''} onchange="updateLivingWillField('dnrPreferred', this.checked)" style="accent-color: #16a34a; margin-top: 3px; width: 16px; height: 16px;">
            <div>
              <strong style="color: #0f172a; display: block;">Do Not Resuscitate (DNR) in Incurable Terminal Condition</strong>
              <span style="color: #475569; font-size: 12px;">If certified terminally ill with no reasonable medical expectation of recovery, withhold invasive cardiopulmonary resuscitation (CPR).</span>
            </div>
          </label>

          <label style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 14px 16px; border-radius: 10px; display: flex; align-items: flex-start; gap: 10px; cursor: pointer;">
            <input type="checkbox" ${lw.palliativeComfort ? 'checked' : ''} onchange="updateLivingWillField('palliativeComfort', this.checked)" style="accent-color: #16a34a; margin-top: 3px; width: 16px; height: 16px;">
            <div>
              <strong style="color: #0f172a; display: block;">Palliative Pain Relief & Comfort Care Priority</strong>
              <span style="color: #475569; font-size: 12px;">Administer appropriate pain medication and comfort measures even if it inadvertently shortens life duration.</span>
            </div>
          </label>

          <label style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 14px 16px; border-radius: 10px; display: flex; align-items: flex-start; gap: 10px; cursor: pointer;">
            <input type="checkbox" ${lw.organDonation ? 'checked' : ''} onchange="updateLivingWillField('organDonation', this.checked)" style="accent-color: #16a34a; margin-top: 3px; width: 16px; height: 16px;">
            <div>
              <strong style="color: #0f172a; display: block;">Organ Donation Consent upon Certified Brain Death</strong>
              <span style="color: #475569; font-size: 12px;">Authorize harvesting of viable anatomical organs for transplant and humanitarian medical research.</span>
            </div>
          </label>
        </div>

        <!-- Healthcare Surrogates / Proxies -->
        <div style="margin-top: 20px; border-top: 1px solid #f1f5f9; padding-top: 18px;">
          <h4 style="margin: 0 0 12px; font-size: 14.5px; font-weight: 800; color: #0f172a;">Designated Healthcare Decision Surrogates (Power of Attorney)</h4>

          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 14px; font-size: 12.5px;">
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 14px; border-radius: 10px;">
              <span style="font-size: 10px; font-weight: 800; color: #2563eb; text-transform: uppercase;">Primary Healthcare Proxy</span>
              <div style="margin-top: 6px;">
                <label style="display: block; font-weight: 700; margin-bottom: 2px;">Name</label>
                <input type="text" value="${escapeAttribute(lw.surrogate1?.name || '')}" oninput="updateLivingWillSurrogate('surrogate1', 'name', this.value)" style="width: 100%; padding: 6px 10px; border: 1px solid #cbd5e1; border-radius: 6px; margin-bottom: 6px;">
                
                <label style="display: block; font-weight: 700; margin-bottom: 2px;">Relationship & Contact</label>
                <input type="text" value="${escapeAttribute(lw.surrogate1?.relationship || '')}" oninput="updateLivingWillSurrogate('surrogate1', 'relationship', this.value)" placeholder="Spouse / Phone" style="width: 100%; padding: 6px 10px; border: 1px solid #cbd5e1; border-radius: 6px;">
              </div>
            </div>

            <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 14px; border-radius: 10px;">
              <span style="font-size: 10px; font-weight: 800; color: #059669; text-transform: uppercase;">Alternate Healthcare Proxy</span>
              <div style="margin-top: 6px;">
                <label style="display: block; font-weight: 700; margin-bottom: 2px;">Name</label>
                <input type="text" value="${escapeAttribute(lw.surrogate2?.name || '')}" oninput="updateLivingWillSurrogate('surrogate2', 'name', this.value)" style="width: 100%; padding: 6px 10px; border: 1px solid #cbd5e1; border-radius: 6px; margin-bottom: 6px;">
                
                <label style="display: block; font-weight: 700; margin-bottom: 2px;">Relationship & Contact</label>
                <input type="text" value="${escapeAttribute(lw.surrogate2?.relationship || '')}" oninput="updateLivingWillSurrogate('surrogate2', 'relationship', this.value)" placeholder="Child / Sibling" style="width: 100%; padding: 6px 10px; border: 1px solid #cbd5e1; border-radius: 6px;">
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  `;
}

function updateLivingWillField(key, value) {
  state.livingWill = state.livingWill || {};
  state.livingWill[key] = value;
  scheduleSave();
}

function updateLivingWillSurrogate(parent, field, value) {
  state.livingWill = state.livingWill || {};
  state.livingWill[parent] = state.livingWill[parent] || {};
  state.livingWill[parent][field] = value;
  scheduleSave();
}

window.printOfficialLivingWillPdf = () => {
  const lw = getLivingWillDraft();
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert("Please allow popups to print.");
    return;
  }

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Advance Healthcare Directive — ${escapeHtml(lw.declarantName)}</title>
        <style>
          @page { size: A4; margin: 25mm 20mm; }
          body { font-family: 'Times New Roman', serif; font-size: 13pt; line-height: 1.65; color: #111; max-width: 800px; margin: 0 auto; padding: 20px; }
          h1 { text-align: center; font-size: 17pt; text-transform: uppercase; border-bottom: 2px solid #000; padding-bottom: 8px; margin-bottom: 20px; }
          h2 { font-size: 13pt; text-transform: uppercase; margin-top: 18px; margin-bottom: 6px; }
          p { text-align: justify; margin-bottom: 12px; }
          .sig-box { margin-top: 35px; display: flex; justify-content: space-between; }
          .sig-line { width: 280px; border-top: 1px solid #000; text-align: center; padding-top: 6px; }
        </style>
      </head>
      <body>
        <h1>ADVANCE HEALTHCARE DIRECTIVE (LIVING WILL)</h1>
        <p>
          I, <b>${escapeHtml(lw.declarantName)}</b>, aged about <b>${lw.age}</b> years, in sound mental health and disposing capacity, execute this Advance Medical Directive under the Supreme Court of India guidelines in <i>Common Cause vs. Union of India</i>.
        </p>

        <h2>1. WITHHOLDING OF ARTIFICIAL LIFE SUSTENANCE</h2>
        <p>
          In the event that two independent medical boards certify that I am suffering from an incurable terminal illness, permanent vegetative state, or brain death where recovery is medically impossible, I direct that artificial life-support systems and invasive ventilators be withheld or withdrawn.
        </p>

        <h2>2. PAIN RELIEF & PALLIATIVE MEASURES</h2>
        <p>
          I direct that full palliative care and pain relief medications be administered to keep me comfortable and free from pain, even if such treatment may inadvertently hasten the end of my biological life.
        </p>

        <h2>3. APPOINTMENT OF HEALTHCARE SURROGATE</h2>
        <p>
          I nominate my <b>${escapeHtml(lw.surrogate1?.relationship || 'Spouse')}</b>, <b>${escapeHtml(lw.surrogate1?.name || 'Healthcare Proxy')}</b>, as my primary Healthcare Surrogate to give informed medical consent consistent with this directive.
        </p>

        <p>
          Date: ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
        </p>

        <div class="sig-box">
          <div></div>
          <div class="sig-line">
            <b>${escapeHtml(lw.declarantName)}</b><br>
            (Declarant Signature)
          </div>
        </div>

        <script>window.print();</script>
      </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
};

// ═══════════════════════════════════════════════════════════
// MODULE 5: CODICIL GENERATOR (WILL AMENDMENTS)
// ═══════════════════════════════════════════════════════════

function renderCodicilView() {
  const c = getCodicilDraft();

  return `
    <section class="codicil-container" style="padding-bottom: 60px;">
      
      <div style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); border-radius: 18px; padding: 24px 28px; color: #fff; box-shadow: 0 8px 24px rgba(15,23,42,0.12); margin-bottom: 24px;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 16px;">
          <div>
            <span style="font-size: 11px; font-weight: 800; color: #38bdf8; text-transform: uppercase;">Testamentary Addendum Drafter</span>
            <h2 style="font-size: 22px; font-weight: 850; color: #fff; margin: 4px 0 6px;">Codicil Generator (Will Amendment)</h2>
            <p style="color: #cbd5e1; font-size: 13px; margin: 0; max-width: 680px; line-height: 1.45;">
              Modify specific clauses, add newly acquired properties, or adjust shares without rewriting or revoking your entire primary Will.
            </p>
          </div>
          <button onclick="printOfficialCodicilPdf()" type="button" style="background: #2563eb; color: #fff; border: none; padding: 10px 20px; border-radius: 10px; font-size: 13px; font-weight: 800; cursor: pointer;">
            Print Official Codicil (PDF)
          </button>
        </div>
      </div>

      <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 24px; box-shadow: 0 4px 16px rgba(0,0,0,0.03);">
        <h3 style="margin: 0 0 14px; font-size: 16px; font-weight: 800; color: #0f172a;">Draft Codicil Particulars</h3>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; font-size: 12.5px;">
          <div>
            <label style="display: block; font-weight: 700; margin-bottom: 4px;">Testator Full Name</label>
            <input type="text" value="${escapeAttribute(c.testatorName)}" oninput="updateCodicilField('testatorName', this.value)" style="width: 100%; padding: 8px 12px; border: 1px solid #cbd5e1; border-radius: 8px;">
          </div>
          <div>
            <label style="display: block; font-weight: 700; margin-bottom: 4px;">Original Will Date</label>
            <input type="date" value="${c.originalWillDate || ''}" oninput="updateCodicilField('originalWillDate', this.value)" style="width: 100%; padding: 8px 12px; border: 1px solid #cbd5e1; border-radius: 8px;">
          </div>
          <div style="grid-column: 1 / -1;">
            <label style="display: block; font-weight: 700; margin-bottom: 4px;">Specific Amendment / Addition Clauses</label>
            <textarea rows="5" oninput="updateCodicilField('amendmentNotes', this.value)" style="width: 100%; padding: 10px 12px; border: 1px solid #cbd5e1; border-radius: 8px; font-family: inherit; font-size: 12.5px;">${escapeHtml(c.amendmentNotes || '')}</textarea>
          </div>
        </div>
      </div>

    </section>
  `;
}

function updateCodicilField(key, value) {
  state.codicil = state.codicil || {};
  state.codicil[key] = value;
  scheduleSave();
}

window.printOfficialCodicilPdf = () => {
  const c = getCodicilDraft();
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>First Codicil — ${escapeHtml(c.testatorName)}</title>
        <style>
          @page { size: A4; margin: 25mm 20mm; }
          body { font-family: 'Times New Roman', serif; font-size: 13pt; line-height: 1.65; color: #111; max-width: 800px; margin: 0 auto; padding: 20px; }
          h1 { text-align: center; font-size: 17pt; text-transform: uppercase; border-bottom: 2px solid #000; padding-bottom: 8px; margin-bottom: 20px; }
          p { text-align: justify; margin-bottom: 14px; }
          .sig-box { margin-top: 40px; display: flex; justify-content: space-between; }
          .sig-line { width: 280px; border-top: 1px solid #000; text-align: center; padding-top: 6px; }
        </style>
      </head>
      <body>
        <h1>FIRST CODICIL TO THE LAST WILL AND TESTAMENT</h1>
        <p>
          I, <b>${escapeHtml(c.testatorName)}</b>, do hereby declare and execute this as the <b>FIRST CODICIL</b> to my Last Will and Testament dated <b>${c.originalWillDate}</b>.
        </p>

        <p>
          <b>AMENDMENT CLAUSE:</b><br>
          ${escapeHtml(c.amendmentNotes || 'Amendment text')}
        </p>

        <p>
          In all other respects, I hereby ratify and confirm my said Last Will and Testament dated ${c.originalWillDate}.
        </p>

        <p>Date: ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>

        <div class="sig-box">
          <div></div>
          <div class="sig-line">
            <b>${escapeHtml(c.testatorName)}</b><br>
            (Testator Signature)
          </div>
        </div>

        <script>window.print();</script>
      </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
};

// ═══════════════════════════════════════════════════════════
// MODULE 6: STATE-WISE INDIAN PROBATE & COURT FEE CALCULATOR
// ═══════════════════════════════════════════════════════════

let probateState = 'maharashtra';
let probateCustomEstateValue = 25000000; // 2.5 Cr default

function renderProbateCalculatorView() {
  const assets = getAllEstateAssets();
  const totalAssetValue = assets.reduce((acc, a) => acc + (Number(a.value) || 0), 0) || probateCustomEstateValue;

  const calculation = calculateIndianProbateFee(probateState, totalAssetValue);

  return `
    <section class="probate-calc-container" style="padding-bottom: 60px;">
      
      <div style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); border-radius: 18px; padding: 24px 28px; color: #fff; box-shadow: 0 8px 24px rgba(15,23,42,0.12); margin-bottom: 24px;">
        <div>
          <span style="font-size: 11px; font-weight: 800; color: #38bdf8; text-transform: uppercase;">Indian Succession Act Section 57 / 213 Radar</span>
          <h2 style="font-size: 22px; font-weight: 850; color: #fff; margin: 4px 0 6px;">State-Wise Probate & Court Fee Calculator</h2>
          <p style="color: #cbd5e1; font-size: 13px; margin: 0; max-width: 680px; line-height: 1.45;">
            Calculate estimated High Court probate fees, statutory caps, and determine if Probate is mandatory for immovable properties under your jurisdiction.
          </p>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(340px, 1fr)); gap: 20px;">
        
        <!-- Calculator Inputs -->
        <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 22px 24px; box-shadow: 0 4px 16px rgba(0,0,0,0.03); font-size: 12.5px;">
          <h3 style="margin: 0 0 14px; font-size: 15.5px; font-weight: 800; color: #0f172a;">Jurisdiction & Asset Value</h3>

          <div style="margin-bottom: 12px;">
            <label style="display: block; font-weight: 700; color: #0f172a; margin-bottom: 4px;">State / High Court Jurisdiction</label>
            <select onchange="updateProbateState(this.value)" style="width: 100%; padding: 8px 12px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 13px;">
              <option value="maharashtra" ${probateState === 'maharashtra' ? 'selected' : ''}>Maharashtra (Bombay High Court)</option>
              <option value="delhi" ${probateState === 'delhi' ? 'selected' : ''}>Delhi (Delhi High Court)</option>
              <option value="karnataka" ${probateState === 'karnataka' ? 'selected' : ''}>Karnataka (Bangalore)</option>
              <option value="westBengal" ${probateState === 'westBengal' ? 'selected' : ''}>West Bengal (Calcutta High Court)</option>
              <option value="tamilNadu" ${probateState === 'tamilNadu' ? 'selected' : ''}>Tamil Nadu (Madras High Court)</option>
              <option value="telangana" ${probateState === 'telangana' ? 'selected' : ''}>Telangana / Andhra Pradesh</option>
              <option value="gujarat" ${probateState === 'gujarat' ? 'selected' : ''}>Gujarat</option>
            </select>
          </div>

          <div style="margin-bottom: 12px;">
            <label style="display: block; font-weight: 700; color: #0f172a; margin-bottom: 4px;">Gross Immovable & Movable Estate Value</label>
            <input type="number" value="${totalAssetValue}" oninput="updateProbateValue(Number(this.value))" style="width: 100%; padding: 8px 12px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 14px; font-weight: 800; color: #0f172a;">
          </div>
        </div>

        <!-- Result Card -->
        <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 22px 24px; box-shadow: 0 4px 16px rgba(0,0,0,0.03);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
            <h3 style="margin: 0; font-size: 15.5px; font-weight: 800; color: #0f172a;">Probate Fee Verdict</h3>
            <span style="font-size: 10.5px; font-weight: 800; background: ${calculation.isMandatory ? '#fee2e2' : '#f0fdf4'}; color: ${calculation.isMandatory ? '#991b1b' : '#166534'}; padding: 3px 8px; border-radius: 5px;">
              ${calculation.isMandatory ? 'Probate Mandatory' : 'Probate Optional'}
            </span>
          </div>

          <div style="background: #f8fafc; padding: 14px 16px; border-radius: 10px; border: 1px solid #e2e8f0; margin-bottom: 12px;">
            <span style="font-size: 11px; font-weight: 750; color: #64748b; text-transform: uppercase;">Estimated Court Fee Payable</span>
            <h2 style="margin: 4px 0 0; font-size: 24px; font-weight: 850; color: #2563eb;">${money(calculation.courtFee)}</h2>
            <small style="color: #64748b; font-size: 11.5px; display: block; margin-top: 2px;">${calculation.capNote}</small>
          </div>

          <p style="font-size: 12.5px; color: #475569; line-height: 1.45; margin: 0;">
            ${calculation.legalNote}
          </p>
        </div>

      </div>

    </section>
  `;
}

function updateProbateState(val) {
  probateState = val;
  renderWillVault();
}

function updateProbateValue(val) {
  probateCustomEstateValue = val;
  renderWillVault();
}

function calculateIndianProbateFee(stateKey, value) {
  let courtFee = 0;
  let isMandatory = false;
  let capNote = "";
  let legalNote = "";

  if (stateKey === 'maharashtra') {
    isMandatory = true; // For immovable property in Mumbai jurisdiction
    courtFee = Math.min(75000, Math.round(value * 0.04));
    capNote = "Capped at Maximum ₹75,000 under Maharashtra Court Fees Act.";
    legalNote = "Under Section 57/213 of the Indian Succession Act, Probate is strictly mandatory for immovable properties situated within the original civil jurisdiction of Bombay High Court.";
  } else if (stateKey === 'westBengal') {
    isMandatory = true; // Kolkata jurisdiction
    courtFee = Math.round(value * 0.055);
    capNote = "Graduated court fee slab (approx 5.5%).";
    legalNote = "Mandatory for properties situated within Calcutta High Court original civil jurisdiction.";
  } else if (stateKey === 'tamilNadu') {
    isMandatory = true; // Chennai jurisdiction
    courtFee = Math.min(25000, Math.round(value * 0.03));
    capNote = "Capped at ₹25,000 for city limits.";
    legalNote = "Mandatory within Madras High Court original civil limits.";
  } else if (stateKey === 'delhi') {
    isMandatory = false;
    courtFee = Math.round(value * 0.04);
    capNote = "Approx 4% ad-valorem court fee without statutory ceiling.";
    legalNote = "Probate is not legally mandatory in Delhi unless disputed by legal heirs or required by the land registrar.";
  } else {
    isMandatory = false;
    courtFee = Math.round(value * 0.03);
    capNote = "Standard state ad-valorem court fee scale.";
    legalNote = "Probate is optional. Bank transmission and mutation can be executed via registered Will + Death Certificate.";
  }

  return { courtFee, isMandatory, capNote, legalNote };
}

// ═══════════════════════════════════════════════════════════
// MODULE 7: DIGITAL INHERITANCE & CRYPTO SCHEDULE
// ═══════════════════════════════════════════════════════════

function renderDigitalLegacyView() {
  return `
    <section class="digital-legacy-container" style="padding-bottom: 60px;">
      
      <div style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); border-radius: 18px; padding: 24px 28px; color: #fff; box-shadow: 0 8px 24px rgba(15,23,42,0.12); margin-bottom: 24px;">
        <span style="font-size: 11px; font-weight: 800; color: #38bdf8; text-transform: uppercase;">Cryptographic & Web3 Inheritance Registry</span>
        <h2 style="font-size: 22px; font-weight: 850; color: #fff; margin: 4px 0 6px;">Digital Assets & Account Handover</h2>
        <p style="color: #cbd5e1; font-size: 13px; margin: 0; max-width: 680px; line-height: 1.45;">
          Provide custody directions for hardware wallets, cloud vaults, and domain portfolios without storing sensitive private keys or plaintext seed phrases in the database.
        </p>
      </div>

      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 16px;">
        
        <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 20px 22px; box-shadow: 0 4px 16px rgba(0,0,0,0.03);">
          <h4 style="margin: 0 0 6px; font-size: 15px; font-weight: 800; color: #0f172a;">Hardware Wallet (Ledger / Trezor) Custody</h4>
          <p style="font-size: 12.5px; color: #475569; line-height: 1.45; margin: 0 0 10px;">
            Hardware wallet stored in Bank Locker #402. Recovery 24-word seed phrase is split using 2-of-3 Shamir Secret Sharing between Spouse & Legal Counsel.
          </p>
          <span style="font-size: 11px; font-weight: 750; background: #eff6ff; color: #1e40af; padding: 3px 8px; border-radius: 5px;">
            Verified Custody Directive
          </span>
        </div>

        <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 20px 22px; box-shadow: 0 4px 16px rgba(0,0,0,0.03);">
          <h4 style="margin: 0 0 6px; font-size: 15px; font-weight: 800; color: #0f172a;">Apple Legacy Contact & Google Inactive Account</h4>
          <p style="font-size: 12.5px; color: #475569; line-height: 1.45; margin: 0 0 10px;">
            Configured Apple Legacy Contact Key and Google Inactive Account Manager (3 months inactivity trigger) to automatically dispatch account archives to primary nominee.
          </p>
          <span style="font-size: 11px; font-weight: 750; background: #ecfdf5; color: #065f46; padding: 3px 8px; border-radius: 5px;">
            Active Automated Trigger
          </span>
        </div>

      </div>

    </section>
  `;
}

// ═══════════════════════════════════════════════════════════
// MODULE 8: NOMINEE PORTAL & EXECUTOR TRANSMISSION KIT
// ═══════════════════════════════════════════════════════════

function renderNomineeView() {
  const nominees = (localVaultState.vault && localVaultState.vault.nominees) || [];

  return `
    <section class="nominee-portal-container" style="padding-bottom: 60px;">
      
      <div style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); border-radius: 18px; padding: 24px 28px; color: #fff; box-shadow: 0 8px 24px rgba(15,23,42,0.12); margin-bottom: 24px;">
        <span style="font-size: 11px; font-weight: 800; color: #38bdf8; text-transform: uppercase;">Beneficiary Transmission & Claim Handover</span>
        <h2 style="font-size: 22px; font-weight: 850; color: #fff; margin: 4px 0 6px;">Nominee Claim & Executor Transmission Kit</h2>
        <p style="color: #cbd5e1; font-size: 13px; margin: 0; max-width: 680px; line-height: 1.45;">
          Download pre-formatted statutory transmission letters for Mutual Funds (CAMS/KFintech) and Bank Lockers upon certified trigger events.
        </p>
      </div>

      <!-- Nominees List -->
      <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 22px 24px; box-shadow: 0 4px 16px rgba(0,0,0,0.03); margin-bottom: 24px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px;">
          <h3 style="margin: 0; font-size: 16px; font-weight: 800; color: #0f172a;">Registered Beneficiaries & Nominees</h3>
          <button class="secondary-action" onclick="showAddNomineeModal()" style="font-size: 12px; font-weight: 750;">+ Add Nominee</button>
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 12px;">
          ${nominees.length === 0 ? `
            <p style="grid-column: 1 / -1; padding: 18px; text-align: center; color: #94a3b8; background: #f8fafc; border-radius: 10px;">No custom nominees uploaded yet.</p>
          ` : nominees.map(n => `
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 12px 14px; border-radius: 10px;">
              <strong style="color: #0f172a; display: block; font-size: 13.5px;">${escapeHtml(n.name)}</strong>
              <small style="color: #2563eb; font-weight: 700; display: block; margin: 2px 0;">${escapeHtml(n.relationship || 'Nominee')}</small>
              <span style="color: #64748b; font-size: 11.5px; display: block;">${escapeHtml(n.email || '')} &bull; ${escapeHtml(n.phone || '')}</span>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Claim Submission Form -->
      <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 22px 24px; box-shadow: 0 4px 16px rgba(0,0,0,0.03);">
        <h3 style="margin: 0 0 4px; font-size: 16px; font-weight: 800; color: #0f172a;">Submit Certified Claim for Legal Disclosure</h3>
        <p style="color: #64748b; font-size: 12.5px; margin: 0 0 16px;">Submit proof of trigger event (such as certified Death Certificate) to initiate disclosure.</p>

        <form onsubmit="submitNomineeClaim(event)" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 14px; font-size: 12.5px;">
          <div>
            <label style="display: block; font-weight: 700; color: #0f172a; margin-bottom: 4px;">Asset Holder Email</label>
            <input type="email" id="claim-user-email" required style="width: 100%; padding: 8px 12px; border: 1px solid #cbd5e1; border-radius: 8px;">
          </div>
          <div>
            <label style="display: block; font-weight: 700; color: #0f172a; margin-bottom: 4px;">Claimant Nominee Email</label>
            <input type="email" id="claim-nominee-email" required style="width: 100%; padding: 8px 12px; border: 1px solid #cbd5e1; border-radius: 8px;">
          </div>
          <div style="grid-column: 1 / -1;">
            <label style="display: block; font-weight: 700; color: #0f172a; margin-bottom: 4px;">Certified Death Certificate / Proof (PDF/Image)</label>
            <input type="file" id="claim-proof-file" required style="width: 100%; padding: 8px 12px; border: 1px solid #cbd5e1; border-radius: 8px;">
          </div>
          <div style="grid-column: 1 / -1;">
            <button type="submit" style="background: #2563eb; color: #fff; border: none; padding: 10px 20px; border-radius: 8px; font-weight: 800; cursor: pointer;">
              Submit Claim for Legal Review
            </button>
          </div>
        </form>
      </div>

    </section>
  `;
}

// ═══════════════════════════════════════════════════════════
// MODULE 9: LEGAL ADMIN CONSOLE
// ═══════════════════════════════════════════════════════════

function renderAdminView() {
  const v = localVaultState.vault;
  if (!v) {
    return `<div class="will-vault-container" style="padding: 24px;"><p class="empty-text">No user vault data found to administer.</p></div>`;
  }

  let verifyAction = '';
  if (v.status === 'PENDING_VERIFICATION') {
    verifyAction = `
      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin-bottom: 14px;">
        <h4 style="margin: 0 0 4px; font-size: 14px; font-weight: 800;">Pending Document Verification</h4>
        <p style="font-size: 12.5px; color: #475569; margin: 0 0 10px;">A newly uploaded Will PDF is pending legal administrator verification.</p>
        <button class="primary-action" onclick="adminAction('VERIFY_WILL')" style="font-size: 12px; font-weight: 750;">Verify & Lock Document</button>
      </div>
    `;
  } else {
    verifyAction = `<p style="color: #166534; font-size: 13px; font-weight: 700;">Document is cryptographically verified and locked.</p>`;
  }

  let claimAction = '';
  if (v.trigger_event && v.trigger_event.status === 'UNDER_REVIEW') {
    claimAction = `
      <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 12px; padding: 16px;">
        <h4 style="margin: 0 0 4px; font-size: 14px; font-weight: 800; color: #991b1b;">Trigger Event Claim Under Review</h4>
        <p style="font-size: 12.5px; color: #7f1d1d; margin: 0 0 10px;">A nominee has submitted a trigger claim with proof: <b>${escapeHtml(v.trigger_event.proofFileName)}</b>.</p>
        <button class="primary-action" onclick="adminAction('APPROVE_CLAIM')" style="background: #dc2626; font-size: 12px; font-weight: 750;">Approve Claim & Disclose Will</button>
      </div>
    `;
  }

  return `
    <section class="will-admin-container" style="padding-bottom: 60px;">
      <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 22px 24px; box-shadow: 0 4px 16px rgba(0,0,0,0.03);">
        <h3 style="margin: 0 0 14px; font-size: 16px; font-weight: 800; color: #0f172a;">Legal Operations Console</h3>
        
        <div style="margin-bottom: 20px;">
          <h4 style="margin: 0 0 8px; font-size: 13.5px; font-weight: 750; color: #475569;">Verification Queue</h4>
          ${verifyAction}
        </div>

        <div>
          <h4 style="margin: 0 0 8px; font-size: 13.5px; font-weight: 750; color: #475569;">High Priority Claim Approvals</h4>
          ${claimAction || '<p style="color: #64748b; font-size: 13px;">No active claims in queue.</p>'}
        </div>
      </div>
    </section>
  `;
}

// ═══════════════════════════════════════════════════════════
// SURVIVOR FINANCIAL SUMMARY GENERATOR (ENHANCED)
// ═══════════════════════════════════════════════════════════

window.generateSurvivorSummary = () => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert("Please allow popups to generate the survivor summary.");
    return;
  }

  const assets = getAllEstateAssets();
  const liabilities = state.liabilities || [];
  const docs = state.documents || [];
  const family = state.family || [];
  const totalAssets = assets.reduce((acc, a) => acc + (Number(a.value) || 0), 0);
  const totalLiabilities = liabilities.reduce((acc, a) => acc + (Number(a.balance) || Number(a.value) || Number(a.amount) || 0), 0);
  const netWorth = totalAssets - totalLiabilities;
  const insuranceDocs = docs.filter(d => d.type && d.type.toLowerCase().includes('insurance'));
  const nominees = (localVaultState.vault && localVaultState.vault.nominees) || [];
  const userName = (window.activeUser && window.activeUser.name) || 'Account Holder';

  const assetRows = assets.map(a => `<tr><td>${escapeHtml(a.name || 'Unnamed')}</td><td>${escapeHtml(a.type || a.category || 'N/A')}</td><td style="text-align:right">₹${(Number(a.value) || 0).toLocaleString('en-IN')}</td><td>${escapeHtml(a.nominee || a.linkedTo || 'None Assigned')}</td></tr>`).join('');
  const liabilityRows = liabilities.map(l => `<tr><td>${escapeHtml(l.name || 'Unnamed')}</td><td>${escapeHtml(l.type || 'Loan')}</td><td style="text-align:right">₹${(Number(l.balance) || Number(l.value) || Number(l.amount) || 0).toLocaleString('en-IN')}</td><td>${l.emi ? '₹' + Number(l.emi).toLocaleString('en-IN') + '/mo' : 'N/A'}</td></tr>`).join('');
  const insuranceRows = insuranceDocs.map(d => `<tr><td>${escapeHtml(d.name || 'Unnamed')}</td><td>${escapeHtml(d.linkedTo || 'Primary')}</td><td>${d.expiry || 'No Expiry'}</td><td>${d.status || 'Active'}</td></tr>`).join('');

  const html = `
    <html>
      <head>
        <title>Survivor's Financial Summary — ${escapeHtml(userName)}</title>
        <style>
          * { box-sizing: border-box; }
          body { font-family: 'Segoe UI', system-ui, sans-serif; padding: 40px; color: #1e293b; line-height: 1.7; max-width: 900px; margin: 0 auto; }
          h1 { color: #0f172a; border-bottom: 3px solid #0f172a; padding-bottom: 12px; margin-bottom: 8px; font-size: 26px; }
          h2 { color: #1e40af; font-size: 16px; margin: 24px 0 10px 0; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; }
          table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 12.5px; }
          th, td { border: 1px solid #e2e8f0; padding: 8px 12px; text-align: left; }
          th { background: #f1f5f9; color: #475569; font-weight: 700; }
          .summary-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 14px; margin: 14px 0; }
          .summary-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; text-align: center; }
          .summary-box .label { font-size: 11px; color: #64748b; text-transform: uppercase; }
          .summary-box .value { font-size: 20px; font-weight: bold; color: #0f172a; margin-top: 4px; }
          .confidential { background: #fef2f2; border: 1px solid #fecaca; padding: 10px; border-radius: 8px; text-align: center; color: #991b1b; font-weight: bold; margin-bottom: 20px; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="confidential">CONFIDENTIAL — FOR AUTHORIZED FAMILY MEMBERS & EXECUTORS ONLY</div>
        
        <h1>Survivor's Financial Summary</h1>
        <p style="color: #64748b; font-size: 13px;">Prepared for the beneficiaries of <b>${escapeHtml(userName)}</b> &bull; Generated on ${new Date().toLocaleDateString('en-IN')}</p>

        <div class="summary-grid">
          <div class="summary-box">
            <div class="label">Net Worth</div>
            <div class="value" style="color: ${netWorth >= 0 ? '#16a34a' : '#dc2626'}">₹${netWorth.toLocaleString('en-IN')}</div>
          </div>
          <div class="summary-box">
            <div class="label">Total Assets</div>
            <div class="value">₹${totalAssets.toLocaleString('en-IN')}</div>
          </div>
          <div class="summary-box">
            <div class="label">Total Liabilities</div>
            <div class="value" style="color: #dc2626">₹${totalLiabilities.toLocaleString('en-IN')}</div>
          </div>
        </div>

        <h2>1. All Registered Assets (${assets.length})</h2>
        ${assets.length > 0 ? '<table><tr><th>Asset Name</th><th>Type</th><th>Value</th><th>Nominee</th></tr>' + assetRows + '</table>' : '<p>No assets recorded.</p>'}

        <h2>2. Liabilities & Ongoing Loans (${liabilities.length})</h2>
        ${liabilities.length > 0 ? '<table><tr><th>Liability</th><th>Type</th><th>Outstanding</th><th>EMI</th></tr>' + liabilityRows + '</table>' : '<p>No liabilities recorded.</p>'}

        <h2>3. Insurance Policies (${insuranceDocs.length})</h2>
        ${insuranceDocs.length > 0 ? '<table><tr><th>Policy Name</th><th>Insured</th><th>Expiry</th><th>Status</th></tr>' + insuranceRows + '</table>' : '<p>No insurance policies recorded.</p>'}

        <script>window.print();</script>
      </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
};

// ═══════════════════════════════════════════════════════════
// ASYNC ACTIONS & GLOBAL MOUNTS
// ═══════════════════════════════════════════════════════════

window.uploadWillDocument = async (input) => {
  if (!input.files[0]) return;
  const formData = new FormData();
  formData.append('will_document', input.files[0]);
  
  try {
    const res = await fetch('/api/wealth/will/upload', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${window.tokenKey}` },
      body: formData
    });
    if (res.ok) {
      alert("Will uploaded successfully. Awaiting legal verification.");
      renderWillVault();
    } else {
      alert("Upload failed.");
    }
  } catch (e) {
    alert("Error uploading document.");
  }
};

window.showAddNomineeModal = () => {
  const name = prompt("Nominee Full Name:");
  if (!name) return;
  const email = prompt("Nominee Email:");
  const phone = prompt("Nominee Phone:");
  const relationship = prompt("Relationship (e.g. Spouse):");
  
  fetch('/api/wealth/will/nominee', {
    method: 'POST',
    headers: { 
      'Authorization': `Bearer ${window.tokenKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ name, email, phone, relationship })
  }).then(() => renderWillVault());
};

window.submitNomineeClaim = async (e) => {
  e.preventDefault();
  const formData = new FormData();
  formData.append('userEmail', document.getElementById('claim-user-email').value);
  formData.append('nomineeEmail', document.getElementById('claim-nominee-email').value);
  formData.append('proof_document', document.getElementById('claim-proof-file').files[0]);
  
  try {
    const res = await fetch('/api/wealth/will/trigger-claim', {
      method: 'POST',
      body: formData
    });
    const data = await res.json();
    if (res.ok) {
      alert("Claim submitted successfully. Under legal review.");
      renderWillVault();
    } else {
      alert(data.error || "Claim failed.");
    }
  } catch (err) {
    alert("Error submitting claim.");
  }
};

window.adminAction = async (actionStr) => {
  if (!confirm(`Are you sure you want to perform action: ${actionStr}?`)) return;
  try {
    const res = await fetch('/api/wealth/will/admin/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: localVaultState.vault?.userId || (window.activeUser && window.activeUser.id), action: actionStr })
    });
    if (res.ok) {
      alert("Action successful.");
      renderWillVault();
    }
  } catch (err) {
    alert("Error performing admin action");
  }
};
