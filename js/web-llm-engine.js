/**
 * WEALTH OS OFFLINE AI ENGINE (Powered by WebLLM / WebGPU)
 * Architecture: Part 1 (Worker) + Part 2 (Deep Context) + Part 3 (Interactive Controls & Streaming)
 * 100% Client-Side, Zero-Knowledge Financial Intelligence
 */

const DEFAULT_MODEL = "Llama-3.2-1B-Instruct-q4f32_1-MLC";
const AVAILABLE_MODELS = [
  { id: "Llama-3.2-1B-Instruct-q4f32_1-MLC", name: "Llama 3.2 (1B Fast)", size: "~850 MB", desc: "Ultra-fast response, low memory footprint (Recommended)" },
  { id: "Llama-3.2-3B-Instruct-q4f32_1-MLC", name: "Llama 3.2 (3B Deep)", size: "~1.8 GB", desc: "High reasoning, complex tax & will analysis" },
  { id: "Qwen2.5-1.5B-Instruct-q4f16_1-MLC", name: "Qwen 2.5 (1.5B)", size: "~1.1 GB", desc: "Strong multilingual & numerical reasoning" },
  { id: "Phi-3.5-mini-instruct-q4f16_1-MLC", name: "Phi 3.5 Mini (3.8B)", size: "~2.2 GB", desc: "Deep analytical logic & structured planning" }
];

class WealthLLMEngine {
  constructor() {
    this.engine = null;
    this.worker = null;
    this.currentModel = DEFAULT_MODEL;
    this.isLoading = false;
    this.isReady = false;
    this.isGenerating = false;
    this.isAborted = false;
    this.loadProgress = 0;
    this.loadStatusText = "Idle";
    this.webGpuSupported = false;
    this.cachedStorageBytes = 0;
    this.temperature = 0.4;
    this.tokensPerSec = 0;
    this.listeners = [];
    this.useWorker = true;
    this.downloadStartTime = 0;
    this.checkStorageUsage();
  }

  async checkWebGpuSupport() {
    if (typeof navigator !== "undefined" && navigator.gpu) {
      try {
        const adapter = await navigator.gpu.requestAdapter();
        this.webGpuSupported = !!adapter;
      } catch {
        this.webGpuSupported = false;
      }
    } else {
      this.webGpuSupported = false;
    }
    return this.webGpuSupported;
  }

  setTemperature(val) {
    this.temperature = Math.max(0.1, Math.min(1.0, Number(val) || 0.4));
  }

  abortGeneration() {
    this.isAborted = true;
    this.isGenerating = false;
  }

  async checkStorageUsage() {
    try {
      if (navigator.storage && navigator.storage.estimate) {
        const est = await navigator.storage.estimate();
        this.cachedStorageBytes = est.usage || 0;
      }
    } catch {
      this.cachedStorageBytes = 0;
    }
    return this.cachedStorageBytes;
  }

  getFormattedStorageUsage() {
    const bytes = this.cachedStorageBytes;
    if (!bytes) return "0 MB";
    if (bytes >= 1024 * 1024 * 1024) {
      return (bytes / (1024 * 1024 * 1024)).toFixed(2) + " GB";
    }
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  }

  async purgeLocalCache() {
    try {
      this.loadStatusText = "Purging local model cache...";
      this.notifyListeners();
      
      if (typeof caches !== "undefined") {
        const keys = await caches.keys();
        for (const k of keys) {
          if (k.toLowerCase().includes("webllm") || k.toLowerCase().includes("mlc")) {
            await caches.delete(k);
          }
        }
      }
      
      if (typeof indexedDB !== "undefined" && indexedDB.databases) {
        const dbs = await indexedDB.databases();
        for (const db of dbs) {
          if (db.name && (db.name.includes("webllm") || db.name.includes("mlc") || db.name.includes("model"))) {
            indexedDB.deleteDatabase(db.name);
          }
        }
      }

      this.isReady = false;
      this.engine = null;
      if (this.worker) {
        this.worker.terminate();
        this.worker = null;
      }
      await this.checkStorageUsage();
      this.loadStatusText = "Local cache purged. Ready for fresh initialization.";
      this.notifyListeners();
      return true;
    } catch (err) {
      console.error("[WealthLLM] Purge error:", err);
      this.loadStatusText = "Cache purge error: " + err.message;
      this.notifyListeners();
      return false;
    }
  }

  onProgress(callback) {
    this.listeners.push(callback);
  }

  notifyListeners() {
    for (const cb of this.listeners) {
      try {
        cb({
          isLoading: this.isLoading,
          isReady: this.isReady,
          isGenerating: this.isGenerating,
          progress: this.loadProgress,
          text: this.loadStatusText,
          model: this.currentModel,
          storage: this.getFormattedStorageUsage(),
          tokensPerSec: this.tokensPerSec,
          temperature: this.temperature,
          webGpu: this.webGpuSupported
        });
      } catch (err) {
        console.error("[WealthLLM] Listener error:", err);
      }
    }
  }

  async initialize(modelId = DEFAULT_MODEL) {
    const supported = await this.checkWebGpuSupport();
    if (!supported) {
      this.loadStatusText = "WebGPU not supported on this device. Using rule-based engine.";
      this.notifyListeners();
      return false;
    }

    if (this.engine && this.currentModel === modelId && this.isReady) {
      return true;
    }

    this.isLoading = true;
    this.isReady = false;
    this.currentModel = modelId;
    this.loadProgress = 0;
    this.downloadStartTime = Date.now();
    this.loadStatusText = "Launching dedicated WebGPU worker...";
    this.notifyListeners();

    const initProgressCallback = (report) => {
      this.loadProgress = Math.round((report.progress || 0) * 100);
      this.loadStatusText = report.text || "Streaming model weights...";
      this.notifyListeners();
    };

    try {
      const webllm = await import("https://esm.run/@mlc-ai/web-llm");

      if (this.useWorker && typeof Worker !== "undefined") {
        try {
          if (this.worker) this.worker.terminate();
          this.worker = new Worker(new URL('./web-llm.worker.js', import.meta.url), { type: "module" });
          
          if (webllm.CreateWebWorkerMLCEngine) {
            this.engine = await webllm.CreateWebWorkerMLCEngine(this.worker, modelId, {
              initProgressCallback
            });
          } else {
            throw new Error("CreateWebWorkerMLCEngine not available, fallback to MLCEngine");
          }
        } catch (workerErr) {
          console.warn("[WealthLLM] Worker creation failed, using main thread MLCEngine:", workerErr);
          this.engine = new webllm.MLCEngine();
          this.engine.setInitProgressCallback(initProgressCallback);
          await this.engine.reload(modelId);
        }
      } else {
        this.engine = new webllm.MLCEngine();
        this.engine.setInitProgressCallback(initProgressCallback);
        await this.engine.reload(modelId);
      }

      this.isLoading = false;
      this.isReady = true;
      this.loadProgress = 100;
      await this.checkStorageUsage();
      this.loadStatusText = "100% Offline AI Ready (Cached locally in browser)";
      this.notifyListeners();
      return true;
    } catch (err) {
      console.error("[WealthLLM] Model load failure:", err);
      this.isLoading = false;
      this.isReady = false;
      this.loadStatusText = "Model loading failed: " + (err.message || String(err));
      this.notifyListeners();
      return false;
    }
  }

  compileComprehensiveFinancialDossier() {
    const data = typeof totals === "function" ? totals() : { 
      netWorth: 0, assets: 0, liabilities: 0, cash: 0, emi: 0, cashFlow: 0, debtRatio: 0, savingsRate: 0, health: 0 
    };
    const assets = (typeof state !== "undefined" && Array.isArray(state.assets)) ? state.assets : [];
    const liabilities = (typeof state !== "undefined" && Array.isArray(state.liabilities)) ? state.liabilities : [];
    const documents = (typeof state !== "undefined" && Array.isArray(state.documents)) ? state.documents : [];
    const taxDed = (typeof state !== "undefined" && state.taxDeductions) ? state.taxDeductions : {};
    const willDraft = (typeof state !== "undefined" && state.willDraft) ? state.willDraft : {};
    const cash = (typeof state !== "undefined" && state.cash) ? state.cash : { income: 0, expenses: 0 };
    const family = (typeof state !== "undefined" && Array.isArray(state.family)) ? state.family : [];

    const formatINR = num => {
      const n = Number(num || 0);
      if (Math.abs(n) >= 10000000) return "₹" + (n / 10000000).toFixed(2) + " Cr";
      if (Math.abs(n) >= 100000) return "₹" + (n / 100000).toFixed(2) + " L";
      return "₹" + n.toLocaleString("en-IN");
    };

    const monthlyIncome = Number(cash.income || 0);
    const monthlyLivingExpenses = Number(cash.expenses || 0);
    const monthlyEmi = Number(data.emi || 0);
    const totalMonthlyBurn = monthlyLivingExpenses + monthlyEmi;
    const netMonthlySurplus = Number(data.cashFlow || (monthlyIncome - totalMonthlyBurn));
    const liquidCash = Number(data.cash || 0);
    const emergencyRunwayMonths = totalMonthlyBurn > 0 ? (liquidCash / totalMonthlyBurn).toFixed(1) : "12+";
    const foirPercent = monthlyIncome > 0 ? Math.round((monthlyEmi / monthlyIncome) * 100) : 0;
    const totalGrossAssets = Number(data.assets || 0) + liquidCash;
    const solvencyScore = totalGrossAssets > 0 ? Math.round((Number(data.netWorth) / totalGrossAssets) * 100) : 100;

    const annualExpenses = totalMonthlyBurn * 12;
    const standardFireNumber = annualExpenses * 25;
    const leanFireNumber = annualExpenses * 20;
    const fatFireNumber = annualExpenses * 33;
    const liquidInvestableAssets = liquidCash + assets.filter(a => {
      const t = (a.type || '').toLowerCase();
      return !t.includes('real estate') && !t.includes('vehicle') && !t.includes('shoe');
    }).reduce((s, a) => s + (Number(a.value) || 0), 0);
    const fireProgressPercent = standardFireNumber > 0 ? Math.min(100, Math.round((liquidInvestableAssets / standardFireNumber) * 100)) : 100;
    const annualSurplus = Math.max(0, netMonthlySurplus * 12);
    const fireGap = Math.max(0, standardFireNumber - liquidInvestableAssets);
    const estimatedYearsToFire = annualSurplus > 0 ? (fireGap / (annualSurplus * 1.08)).toFixed(1) : (fireGap === 0 ? "0.0 (FIRE Achieved)" : "15+");

    const assetCategories = {};
    for (const a of assets) {
      const cat = a.type || 'Other';
      assetCategories[cat] = (assetCategories[cat] || 0) + Number(a.value || 0);
    }
    const assetClassList = Object.keys(assetCategories).map(c => - **:**  (%)).join("\n");

    const topAssetsList = assets.slice(0, 10).map(a => {
      const loanInfo = a.hasLoan === 'Yes' || a.hasLoan === true ?  [Active Loan EMI: ] : '';
      return - **** (): Current Val , Cost ;
    }).join("\n");

    const topLiabList = liabilities.slice(0, 8).map(l => {
      return - **** (): Balance , EMI /mo @ %;
    }).join("\n");

    const selectedRegime = taxDed.selectedRegime || 'New Regime';
    const sec80C = Number(taxDed.sec80C || 0);
    const sec80D = Number(taxDed.sec80D || 0);
    const sec80CCD1B = Number(taxDed.sec80CCD1B || 0);
    const sec24b = Number(taxDed.homeLoanInterest24b || 0);

    const headroom80C = Math.max(0, 150000 - sec80C);
    const headroom80D = Math.max(0, 25000 - sec80D);
    const headroom80CCD = Math.max(0, 50000 - sec80CCD1B);
    const totalPotentialTaxShield = headroom80C + headroom80D + headroom80CCD;

    const annualGrossIncome = monthlyIncome * 12;
    const requiredHlvCover = (annualGrossIncome * 15) + Number(data.liabilities || 0);
    const insurancePolicies = documents.filter(d => /insurance/i.test((d.type || '') + ' ' + (d.name || '')));
    const isWillAttested = !!(willDraft.primaryBeneficiary || willDraft.executorName);
    const nomineeStatus = family.length > 0 ? ${family.length} registered family members / nominees : "No family members linked";

    return {
      metrics: {
        netWorth: formatINR(data.netWorth),
        grossAssets: formatINR(totalGrossAssets),
        marketAssets: formatINR(data.assets),
        liquidCash: formatINR(liquidCash),
        totalDebt: formatINR(data.liabilities),
        debtRatio: (data.debtRatio || 0) + "%",
        monthlyIncome: formatINR(monthlyIncome),
        monthlyLivingExpenses: formatINR(monthlyLivingExpenses),
        monthlyEmi: formatINR(monthlyEmi),
        totalMonthlyBurn: formatINR(totalMonthlyBurn),
        netMonthlySurplus: formatINR(netMonthlySurplus),
        savingsRate: (data.savingsRate || 0) + "%",
        emergencyRunwayMonths: emergencyRunwayMonths + " Months",
        foirPercent: foirPercent + "%",
        solvencyScore: solvencyScore + "%",
        healthScore: (data.health || 80) + "/100"
      },
      fire: {
        standardFireNumber: formatINR(standardFireNumber),
        leanFireNumber: formatINR(leanFireNumber),
        fatFireNumber: formatINR(fatFireNumber),
        liquidInvestableAssets: formatINR(liquidInvestableAssets),
        fireProgressPercent: fireProgressPercent + "%",
        estimatedYearsToFire
      },
      tax: {
        selectedRegime,
        sec80C: formatINR(sec80C) + " (Headroom: " + formatINR(headroom80C) + ")",
        sec80D: formatINR(sec80D) + " (Headroom: " + formatINR(headroom80D) + ")",
        sec80CCD1B: formatINR(sec80CCD1B) + " (Headroom: " + formatINR(headroom80CCD) + ")",
        sec24b: formatINR(sec24b),
        totalPotentialTaxShield: formatINR(totalPotentialTaxShield)
      },
      protection: {
        annualGrossIncome: formatINR(annualGrossIncome),
        requiredHlvCover: formatINR(requiredHlvCover),
        insurancePolicyCount: insurancePolicies.length + " policies registered",
        isWillAttested: isWillAttested ? "Attested (" + (willDraft.primaryBeneficiary || 'Configured') + ")" : "Draft / Incomplete",
        nomineeStatus
      },
      inventories: {
        assetClassList: assetClassList || "Cash only registered.",
        topAssetsList: topAssetsList || "No physical/market assets registered.",
        topLiabList: topLiabList || "Zero outstanding debt obligations registered."
      }
    };
  }

  buildSystemPrompt(personaKey = "cwo") {
    const dossier = this.compileComprehensiveFinancialDossier();
    const m = dossier.metrics;
    const f = dossier.fire;
    const t = dossier.tax;
    const p = dossier.protection;
    const inv = dossier.inventories;

    const personaInstructions = {
      cwo: You are the Chief Wealth Officer (CWO) of Wealth OS.
Your Mandate: Institutional Portfolio Architecture, Capital Allocation, and Solvency Optimization.
Focus on:
1. Optimizing the client's asset mix and eliminating drag from idle cash or non-productive debt.
2. Evaluating liquidity buffers vs high-yield equity/debt deployment.
3. Providing clear, mathematically grounded capital deployment recommendations.,

      tax: You are the Chartered Tax Counsel of Wealth OS specializing in the Indian Income Tax Act (AY 2025-26).
Your Mandate: Tax Alpha, Statutory Deduction Optimization, and Capital Gains Strategy.
Focus on:
1. Comparing Old vs New Tax Regime based on the client's gross income () and available deductions.
2. Maximizing Section 80C (₹1.5L), Section 80D (₹25k/₹50k health), Section 80CCD(1B) NPS (₹50k exclusive), and Section 24(b) Home Loan Interest.
3. Advising on Equity LTCG (12.5% above ₹1.25L exemption), STCG (20%), and Advance Tax quarterly compliance (June 15, Sept 15, Dec 15, March 15).,

      risk: You are the Risk & Solvency Analyst of Wealth OS.
Your Mandate: Downside Protection, Human Life Value (HLV) Actuarial Audit, and Digital Succession Resilience.
Focus on:
1. Auditing the client's required term insurance cover () based on 15x income + liabilities.
2. Reviewing emergency runway () against the 6-month safety benchmark.
3. Securing estate succession via Digital Will () and 100% nominee attestation across accounts.,

      fire: You are the FIRE & Retirement Strategist of Wealth OS.
Your Mandate: Financial Independence / Retire Early (FIRE) Modeling and Perpetual Withdrawal Trajectories.
Focus on:
1. Tracking progress toward the Standard FIRE milestone ( @ 25x annual expenses).
2. Accelerating the client's savings rate () by deploying the monthly surplus ().
3. Estimating timeline to full perpetual financial freedom (Current estimate: ).
    };

    const activeRole = personaInstructions[personaKey] || personaInstructions.cwo;

    return ${activeRole}

===============================================================================
ZERO-KNOWLEDGE LIVE CLIENT FINANCIAL DOSSIER (REAL-TIME SNAPSHOT)
===============================================================================

📊 BALANCE SHEET & SOLVENCY:
• Consolidated Net Worth: 
• Total Gross Assets:  (Market:  + Cash: )
• Total Outstanding Debt:  (Debt-to-Asset Ratio: )
• Monthly Income: 
• Monthly Living Burn:  | Monthly EMIs: 
• Total Monthly Outflow: 
• Net Monthly Surplus:  (Savings Rate: )
• Liquid Emergency Runway:  (Safe Benchmark: 6.0 Months)
• Fixed Obligation Ratio (FOIR):  (Safe Banking Limit: ≤ 40%)
• Solvency Index:  | Resilience Health Score: 

🏢 ASSET ALLOCATION MIX:


💼 TOP REGISTERED HOLDINGS:


💳 REGISTERED LIABILITIES:


🎯 FIRE & COMPOUNDING MILESTONES:
• Standard FIRE Target (25x Burn):  (Progress: )
• Lean FIRE (20x):  | Fat FIRE (33x): 
• Current Liquid/Investable Base: 
• Projected Timeline to FIRE: 

⚖️ INDIAN TAX POSITION (AY 2025-26):
• Active Tax Regime: 
• Section 80C Utilization: 
• Section 80D Health Insurance: 
• Section 80CCD(1B) NPS: 
• Section 24(b) Home Loan Interest: 
• Total Available Unclaimed Tax Shield: 

🛡️ PROTECTION & SUCCESSION HEALTH:
• Annual Income Base: 
• Required Actuarial HLV Life Cover: 
• Active Policies: 
• Digital Will Standing: 
• Nominee Coverage: 

===============================================================================
OPERATIONAL DIRECTIVES FOR THE AI ADVISOR:
===============================================================================
1. Always quote the client's exact figures from the dossier above when answering.
2. Use Indian currency denominations (₹, Lakhs, Crores) exclusively.
3. Structure answers logically with bullet points, bolded metrics, and a "Strategic Action Plan".
4. Provide direct, authoritative, and actionable advice tailored to your executive role.
5. Keep answers clear, rigorous, and within 250–350 words.;
  }

  async generateResponse(query, personaKey = "cwo", history = [], onChunk = null) {
    if (!this.isReady || !this.engine) {
      throw new Error("AI_ENGINE_NOT_READY");
    }

    this.isGenerating = true;
    this.isAborted = false;
    const systemPrompt = this.buildSystemPrompt(personaKey);
    
    const messages = [
      { role: "system", content: systemPrompt }
    ];

    const recentHistory = history.slice(-6);
    for (const msg of recentHistory) {
      if (msg.sender === "user") {
        messages.push({ role: "user", content: msg.text });
      } else if (msg.sender === "ai") {
        messages.push({ role: "assistant", content: msg.text });
      }
    }

    messages.push({ role: "user", content: query });

    const startTime = Date.now();
    let tokenCount = 0;

    try {
      if (onChunk && typeof onChunk === "function") {
        const asyncChunkGenerator = await this.engine.chat.completions.create({
          messages,
          temperature: this.temperature,
          max_tokens: 900,
          stream: true
        });

        let fullText = "";
        for await (const chunk of asyncChunkGenerator) {
          if (this.isAborted) {
            break;
          }
          const delta = chunk.choices[0]?.delta?.content || "";
          fullText += delta;
          tokenCount++;
          const elapsedSec = (Date.now() - startTime) / 1000;
          if (elapsedSec > 0.5) {
            this.tokensPerSec = (tokenCount / elapsedSec).toFixed(1);
          }
          onChunk(delta, fullText, this.tokensPerSec);
        }
        this.isGenerating = false;
        return fullText;
      } else {
        const reply = await this.engine.chat.completions.create({
          messages,
          temperature: this.temperature,
          max_tokens: 900
        });
        this.isGenerating = false;
        return reply.choices[0]?.message?.content || "";
      }
    } catch (err) {
      this.isGenerating = false;
      throw err;
    }
  }
}

window.wealthLLMEngine = new WealthLLMEngine();
window.WEALTH_MODELS = AVAILABLE_MODELS;