const { readWealthDb, writeWealthDb, auditWealth, saveUserData, resetUserData, defaultWealthData } = require('../db/database');
const { cleanWealthData } = require('../utils/helpers');

const cleanDesignation = value => {
  const match = smartLineClean(value).match(/(?:pre sales technical|director\s*-?\s*business development|director|ceo|cto|cfo|co founder|founder|manager|consultant|analyst|engineer|partner|proprietor|head|lead|associate).*/i);
  return match ? match[0] : smartLineClean(value);
};

const validEmail = value => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
const validTlds = new Set(['com', 'in', 'ai', 'co', 'io', 'org', 'net', 'edu', 'tech', 'dev', 'info']);
const hasValidTld = value => {
  const clean = String(value || '').toLowerCase().replace(/[^\w.-]/g, '');
  const tld = clean.split('.').pop();
  return validTlds.has(tld);
};
const repairEmail = value => {
  let email = String(value || '').toLowerCase().replace(/[^\w.@+-]/g, '');
  email = email.replace(/tranquilaiin\b/g, 'tranquilai.in');
  email = email.replace(/gmailcom\b/g, 'gmail.com');
  email = email.replace(/outlookcom\b/g, 'outlook.com');
  email = email.replace(/yahoocom\b/g, 'yahoo.com');
  email = email.replace(/hotmailcom\b/g, 'hotmail.com');
  return email;
};
const formatPhone = value => {
  const digits = String(value || '').replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) return `+91 ${digits.slice(2, 7)} ${digits.slice(7)}`;
  if (digits.length === 10) return `${digits.slice(0, 5)} ${digits.slice(5)}`;
  if (digits.length > 10) return `+${digits}`;
  return digits;
};

const decodeXml = value => String(value || '')
  .replace(/<!\[CDATA\[(.*?)\]\]>/gs, '$1')
  .replace(/&amp;/g, '&')
  .replace(/&quot;/g, '"')
  .replace(/&#39;/g, "'")
  .replace(/&apos;/g, "'")
  .replace(/&lt;/g, '<')
  .replace(/&gt;/g, '>')
  .replace(/<[^>]+>/g, '')
  .trim();

const tagValue = (xml, tag) => {
  const match = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'));
  return match ? decodeXml(match[1]) : '';
};

const fetchFinanceNews = async (force = false) => {
  const now = Date.now();
  if (!force && now - financeNewsCache.fetchedAt < 1000 * 60 * 20 && financeNewsCache.items.length) {
    return financeNewsCache.items;
  }
  const feeds = [
    'https://news.google.com/rss/search?q=India%20finance%20OR%20RBI%20OR%20stock%20market%20OR%20mutual%20funds&hl=en-IN&gl=IN&ceid=IN:en',
    'https://news.google.com/rss/search?q=personal%20finance%20India%20tax%20insurance%20EMI&hl=en-IN&gl=IN&ceid=IN:en',
    'https://news.google.com/rss/search?q=India%20stock%20market%20Nifty%20Sensex%20rupee%20oil&hl=en-IN&gl=IN&ceid=IN:en',
    'https://news.google.com/rss/search?q=India%20income%20tax%20GST%20RBI%20home%20loan&hl=en-IN&gl=IN&ceid=IN:en'
  ];
  const rows = [];
  for (const feed of feeds) {
    try {
      const response = await fetch(feed, {
        headers: { 'User-Agent': 'WealthOS/1.0 local finance dashboard' }
      });
      if (!response.ok) continue;
      const xml = await response.text();
      const items = xml.match(/<item>[\s\S]*?<\/item>/gi) || [];
      items.slice(0, 8).forEach(item => {
        const title = tagValue(item, 'title')
          .replace(/\s+-\s+[^-]{2,80}$/g, '')
          .slice(0, 120);
        const link = tagValue(item, 'link');
        const publishedAt = tagValue(item, 'pubDate');
        const source = tagValue(item, 'source') || 'Finance news';
        if (title && link && !rows.some(row => row.title === title)) {
          rows.push({ title, link, source, publishedAt });
        }
      });
    } catch (error) {
      console.warn('Finance news feed skipped:', error.message);
    }
  }
  financeNewsCache = {
    fetchedAt: now,
    items: rows.slice(0, 24)
  };
  return financeNewsCache.items;
};

const rotateNewsItems = (items, offset) => {
  if (!items.length) return [];
  const start = offset % items.length;
  return [...items.slice(start), ...items.slice(0, start)];
};

const marketEventType = text => {
  const value = String(text || '').toLowerCase();
  if (/ipo|listing|listed|gmp|subscription|issue opens|issue closes/.test(value)) return 'IPO';
  if (/rbi|monetary policy|repo rate|mpc/.test(value)) return 'RBI';
  if (/tax|itr|gst|deadline|filing|tds/.test(value)) return 'Tax';
  if (/nifty|sensex|market|results|earnings/.test(value)) return 'Market';
  return 'Finance';
};

const localDateKey = date => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const parseMarketEventDate = text => {
  const value = String(text || '');
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (/\btoday\b/i.test(value)) return localDateKey(today);
  if (/\btomorrow\b/i.test(value)) {
    const date = new Date(today);
    date.setDate(date.getDate() + 1);
    return localDateKey(date);
  }
  const match = value.match(/\b(?:on\s+)?(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\.?\s+(\d{1,2})(?:,?\s*(20\d{2}))?/i) ||
    value.match(/\b(\d{1,2})\s+(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)(?:,?\s*(20\d{2}))?/i);
  if (!match) return '';
  const monthText = Number.isNaN(Number(match[1])) ? match[1] : match[2];
  const dayText = Number.isNaN(Number(match[1])) ? match[2] : match[1];
  const yearText = Number.isNaN(Number(match[1])) ? match[3] : match[3];
  const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
  const month = months.findIndex(item => monthText.toLowerCase().startsWith(item));
  if (month < 0) return '';
  let year = yearText ? Number(yearText) : today.getFullYear();
  let date = new Date(year, month, Number(dayText));
  if (!yearText && date < today) date = new Date(year + 1, month, Number(dayText));
  return Number.isNaN(date.getTime()) ? '' : localDateKey(date);
};

const fetchMarketEvents = async (force = false) => {
  const now = Date.now();
  if (!force && now - marketEventsCache.fetchedAt < 1000 * 60 * 30 && marketEventsCache.items.length) {
    return marketEventsCache.items;
  }
  const feeds = [
    'https://news.google.com/rss/search?q=India%20upcoming%20IPO%20listing%20date%20GMP&hl=en-IN&gl=IN&ceid=IN:en',
    'https://news.google.com/rss/search?q=India%20IPO%20opens%20closes%20listing%20this%20week&hl=en-IN&gl=IN&ceid=IN:en',
    'https://news.google.com/rss/search?q=RBI%20monetary%20policy%20MPC%20date%20India&hl=en-IN&gl=IN&ceid=IN:en',
    'https://news.google.com/rss/search?q=India%20tax%20GST%20ITR%20deadline%20date&hl=en-IN&gl=IN&ceid=IN:en',
    'https://news.google.com/rss/search?q=India%20stock%20market%20results%20calendar%20earnings%20date&hl=en-IN&gl=IN&ceid=IN:en'
  ];
  const rows = [];
  for (const feed of feeds) {
    try {
      const response = await fetch(feed, {
        headers: { 'User-Agent': 'WealthOS/1.0 local finance timetable' }
      });
      if (!response.ok) continue;
      const xml = await response.text();
      const items = xml.match(/<item>[\s\S]*?<\/item>/gi) || [];
      items.slice(0, 8).forEach(item => {
        const title = tagValue(item, 'title').replace(/\s+-\s+[^-]{2,80}$/g, '').slice(0, 120);
        const description = tagValue(item, 'description').slice(0, 220);
        const link = tagValue(item, 'link');
        const source = tagValue(item, 'source') || 'Market calendar';
        const publishedAt = tagValue(item, 'pubDate');
        const date = parseMarketEventDate(`${title} ${description}`);
        const type = marketEventType(`${title} ${description}`);
        if (title && link && !rows.some(row => row.title === title)) {
          rows.push({ title, link, source, type, date, publishedAt });
        }
      });
    } catch (error) {
      console.warn('Market events feed skipped:', error.message);
    }
  }
  marketEventsCache = {
    fetchedAt: now,
    items: rows
      .filter(item => !item.date || item.date >= localDateKey(new Date()))
      .sort((a, b) => (a.date || '9999-99-99').localeCompare(b.date || '9999-99-99'))
      .slice(0, 18)
  };
  return marketEventsCache.items;
};

const moneyToInr = (amount, currency) => {
  const rates = { INR: 1, USD: 84, EUR: 91, GBP: 106, CHF: 94, AUD: 55 };
  return Math.round((Number(amount) || 0) * (rates[currency] || 1));
};

const parseMarketPrices = text => {
  const value = String(text || '');
  const prices = [];
  const patterns = [
    { currency: 'INR', regex: /(?:₹|INR|Rs\.?)\s*([0-9][0-9,]*(?:\.\d+)?)(\s*(?:lakh|lac|l|cr|crore))?/gi },
    { currency: 'USD', regex: /(?:US\$|\$|USD)\s*([0-9][0-9,]*(?:\.\d+)?)(\s*(?:k|m))?/gi },
    { currency: 'EUR', regex: /(?:€|EUR)\s*([0-9][0-9,]*(?:\.\d+)?)(\s*(?:k|m))?/gi },
    { currency: 'GBP', regex: /(?:£|GBP)\s*([0-9][0-9,]*(?:\.\d+)?)(\s*(?:k|m))?/gi },
    { currency: 'CHF', regex: /(?:CHF)\s*([0-9][0-9,]*(?:\.\d+)?)(\s*(?:k|m))?/gi }
  ];
  patterns.forEach(({ currency, regex }) => {
    let match;
    while ((match = regex.exec(value))) {
      let amount = Number(String(match[1] || '').replace(/,/g, ''));
      const suffix = String(match[2] || '').toLowerCase();
      if (!amount) continue;
      if (/crore|cr/.test(suffix)) amount *= 10000000;
      if (/lakh|lac|\bl\b/.test(suffix)) amount *= 100000;
      if (/\bk\b/.test(suffix)) amount *= 1000;
      if (/\bm\b/.test(suffix)) amount *= 1000000;
      const inr = moneyToInr(amount, currency);
      if (inr >= 5000 && inr <= 500000000) prices.push(inr);
    }
  });
  return prices;
};

const median = values => {
  const rows = values.filter(Number.isFinite).sort((a, b) => a - b);
  if (!rows.length) return 0;
  const mid = Math.floor(rows.length / 2);
  return rows.length % 2 ? rows[mid] : Math.round((rows[mid - 1] + rows[mid]) / 2);
};

const watchBrandProfile = asset => {
  const text = `${asset.brand || ''} ${asset.model || ''} ${asset.name || ''}`.toLowerCase();
  const collectibleBrands = /rolex|patek|philippe|audemars|vacheron|richard mille|fp journe|lange|a\. lange/.test(text);
  const strongBrands = collectibleBrands || /omega|cartier|tudor|iwc|jaeger|jlc|breitling|panerai|grand seiko|zenith|tag heuer/.test(text);
  const hotModels = /daytona|submariner|gmt|nautilus|aquanaut|royal oak|speedmaster|seamaster|santos|tank|monaco|navitimer|pelagos|black bay/.test(text);
  if (collectibleBrands || hotModels) return { label: 'Collectible reseller watch', annual: hotModels ? 0.045 : 0.032, floor: 0.72, spread: 0.12 };
  if (strongBrands) return { label: 'Luxury pre-owned watch', annual: 0.012, floor: 0.55, spread: 0.16 };
  return { label: 'Standard resale watch', annual: -0.055, floor: 0.30, spread: 0.24 };
};

const watchConditionMultiplier = value => {
  const text = String(value || '').toLowerCase();
  if (/unworn|mint|new|excellent/.test(text)) return 1;
  if (/fair|scratches|used|polish/.test(text)) return 0.82;
  if (/poor|damaged|repair|service due/.test(text)) return 0.62;
  return 0.92;
};

const watchCompletenessMultiplier = value => {
  const text = String(value || '').toLowerCase();
  if (/full|box.*paper|paper.*box|certificate|bill/.test(text)) return 1.07;
  if (/box only|papers only|partial/.test(text)) return 0.98;
  if (/watch only|no paper|missing/.test(text)) return 0.88;
  return 1;
};

const localWatchEstimate = asset => {
  const purchasePrice = cleanNumber(asset.purchasePrice || asset.value);
  if (!purchasePrice) return 0;
  const profile = watchBrandProfile(asset);
  const purchaseDate = cleanDate(asset.acquisitionDate || asset.purchaseDate);
  const year = cleanNumber(asset.year);
  let ageYears = 1;
  if (purchaseDate) ageYears = Math.max(0, (Date.now() - new Date(`${purchaseDate}T00:00:00`).getTime()) / 31557600000);
  else if (year) ageYears = Math.max(0, new Date().getFullYear() - year);
  const value = purchasePrice *
    Math.pow(1 + profile.annual, Math.min(ageYears, 12)) *
    watchConditionMultiplier(asset.condition) *
    watchCompletenessMultiplier(asset.watchBoxPapers);
  return Math.max(Math.round(purchasePrice * profile.floor), Math.round(value));
};

const fetchWatchMarketSignals = async (asset, force = false) => {
  const query = [asset.brand, asset.model, asset.referenceNumber, asset.name]
    .filter(Boolean)
    .join(' ')
    .replace(/[^\w\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const cacheKey = query.toLowerCase();
  const cached = watchValuationCache.get(cacheKey);
  if (!force && cached && Date.now() - cached.fetchedAt < 1000 * 60 * 60 * 6) return cached.items;
  if (!query) return [];
  const feeds = [
    `https://news.google.com/rss/search?q=${encodeURIComponent(`${query} watch market price WatchCharts Chrono24 pre owned`)}&hl=en-IN&gl=IN&ceid=IN:en`,
    `https://news.google.com/rss/search?q=${encodeURIComponent(`${query} used watch price resale secondary market`)}&hl=en-IN&gl=IN&ceid=IN:en`
  ];
  const rows = [];
  for (const feed of feeds) {
    try {
      const response = await fetch(feed, { headers: { 'User-Agent': 'WealthOS/1.0 local watch valuation' } });
      if (!response.ok) continue;
      const xml = await response.text();
      const items = xml.match(/<item>[\s\S]*?<\/item>/gi) || [];
      items.slice(0, 10).forEach(item => {
        const title = tagValue(item, 'title').replace(/\s+-\s+[^-]{2,80}$/g, '').slice(0, 140);
        const description = tagValue(item, 'description').slice(0, 260);
        const link = tagValue(item, 'link');
        const source = tagValue(item, 'source') || 'Watch market';
        const prices = parseMarketPrices(`${title} ${description}`);
        if (title && link && !rows.some(row => row.title === title)) {
          rows.push({ title, link, source, prices });
        }
      });
    } catch (error) {
      console.warn('Watch market feed skipped:', error.message);
    }
  }
  watchValuationCache.set(cacheKey, { fetchedAt: Date.now(), items: rows.slice(0, 12) });
  return rows.slice(0, 12);
};

const estimateWatchMarketValue = async (asset, force = false) => {
  const signals = await fetchWatchMarketSignals(asset, force);
  const marketPrices = signals.flatMap(item => item.prices || []);
  const marketEstimate = median(marketPrices);
  const modelEstimate = localWatchEstimate(asset);
  const profile = watchBrandProfile(asset);
  const value = marketEstimate && modelEstimate
    ? Math.round((marketEstimate * 0.7) + (modelEstimate * 0.3)) : (marketEstimate || modelEstimate || 0);
  return value;
};

exports.getData = (req, res) => {
  const user = req.wealthUser;
  res.json({ success: true, data: user.data || defaultWealthData(user.name), updatedAt: user.updatedAt });
};

exports.saveData = (req, res) => {
  const data = req.body.data || req.body;
  if (!data || typeof data !== 'object') return res.status(400).json({ error: 'Data is required.' });
  const clean = cleanWealthData(data);
  try {
    const result = saveUserData(req.wealthUser.id, clean, req.wealthUser.id);
    res.json({ success: true, ok: true, updatedAt: result.updatedAt });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.resetData = (req, res) => {
  try {
    const result = resetUserData(req.wealthUser.id);
    res.json({ success: true, ok: true, data: result.data, updatedAt: result.updatedAt });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAudit = (req, res) => {
  const db = readWealthDb();
  const rows = (db.audit || [])
    .filter(item => item.userId === req.wealthUser.id)
    .slice(-50)
    .reverse();
  res.json({ success: true, events: rows, rows });
};

exports.watchValuation = async (req, res) => {
  try {
    const estimate = await estimateWatchMarketValue(req.body, req.query?.refresh === '1');
    res.json({ success: true, estimate });
  } catch (err) {
    res.status(502).json({ error: 'Could not estimate watch value.' });
  }
};

exports.getNews = async (req, res) => {
  try {
    const items = await fetchFinanceNews(req.query?.refresh === '1');
    res.json({ success: true, news: items.slice(0, 6) });
  } catch (err) {
    res.status(502).json({ error: 'Could not load news.' });
  }
};

exports.getMarketEvents = async (req, res) => {
  try {
    const events = await fetchMarketEvents(req.query?.refresh === '1');
    res.json({ success: true, events });
  } catch (err) {
    res.status(502).json({ error: 'Could not load market events.' });
  }
};