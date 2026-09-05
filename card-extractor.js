const pdfInput = document.getElementById('pdfInput');
const dropZone = document.getElementById('dropZone');
const startButton = document.getElementById('startButton');
const downloadButton = document.getElementById('downloadButton');
const clearButton = document.getElementById('clearButton');
const pairSides = document.getElementById('pairSides');
const pageAsCard = document.getElementById('pageAsCard');
const enhanceImages = document.getElementById('enhanceImages');
const ocrLanguage = document.getElementById('ocrLanguage');
const accuracyMode = document.getElementById('accuracyMode');
const progressBar = document.getElementById('progressBar');
const statusText = document.getElementById('statusText');
const detailText = document.getElementById('detailText');
const backendMode = document.getElementById('backendMode');
const aiMode = document.getElementById('aiMode');
const resultsBody = document.getElementById('resultsBody');
const rowCount = document.getElementById('rowCount');
const pageCount = document.getElementById('pageCount');
const reviewCount = document.getElementById('reviewCount');

const state = { file: null, rows: [], pages: 0 };
const backendAvailable = /^https?:$/.test(location.protocol) && /^(localhost|127\.0\.0\.1)$/i.test(location.hostname);

if (backendMode) {
  backendMode.textContent = backendAvailable
    ? 'Backend mode active: server OCR, page pairing, and server Excel export will be used.'
    : 'Browser fallback active. Start the backend for the strongest OCR result.';
}

const refreshBackendStatus = async () => {
  if (!backendAvailable || !aiMode) return;
  try {
    const response = await fetch('/api/status');
    const status = await response.json();
    aiMode.textContent = status.aiAvailable
      ? `AI cleanup active: ${status.model}`
      : 'AI cleanup inactive: add OPENAI_API_KEY in .env for smarter cleanup.';
    aiMode.classList.toggle('is-active', Boolean(status.aiAvailable));
  } catch {
    aiMode.textContent = 'Backend status unavailable.';
  }
};
refreshBackendStatus();

if (window.pdfjsLib) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js';
}

const setStatus = (status, detail = '', percent = null) => {
  statusText.textContent = status;
  if (detail) detailText.textContent = detail;
  if (percent !== null) progressBar.style.width = `${Math.max(0, Math.min(100, percent))}%`;
};

const escapeHtml = value => String(value || '').replace(/[&<>"']/g, char => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[char]));

const normalizeText = text => String(text || '')
  .replace(/\r/g, '\n')
  .replace(/[|*~<>]/g, ' ')
  .replace(/[^\S\n]+/g, ' ')
  .replace(/\n{3,}/g, '\n\n')
  .trim();

const unique = values => [...new Set(values.map(value => String(value || '').trim()).filter(Boolean))];
const reviewNeeded = row => row.warnings.length > 0 || row.quality === 'Review';

const updateCounts = () => {
  rowCount.textContent = state.rows.length;
  pageCount.textContent = state.pages;
  reviewCount.textContent = state.rows.filter(reviewNeeded).length;
  downloadButton.disabled = state.rows.length === 0;
};

const cleanPhone = value => {
  const hasPlus = /^\s*\+/.test(value);
  const digits = String(value).replace(/\D/g, '');
  if (digits.length < 8) return '';
  if (digits.length === 10 && !hasPlus) return digits.replace(/(\d{5})(\d{5})/, '$1 $2');
  return `${hasPlus ? '+' : ''}${digits}`;
};

const fieldScore = row => {
  let score = Number(row.ocrConfidence) || 0;
  if (row.name) score += 10;
  if (row.company) score += 10;
  if (row.phones) score += 12;
  if (row.email) score += 12;
  if (row.website) score += 5;
  if (row.address) score += 5;
  if (row.warnings.length) score -= row.warnings.length * 6;
  return Math.max(0, Math.min(100, Math.round(score)));
};

const qualityLabel = score => {
  if (score >= 82) return 'Good';
  if (score >= 62) return 'Check';
  return 'Review';
};

const extractFields = group => {
  const text = normalizeText(typeof group === 'string' ? group : group.text);
  const lines = unique(text.split('\n'));
  const emails = unique(text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi) || []);
  const phones = unique((text.match(/(?:\+?\d[\d\s().-]{7,}\d)/g) || []).map(cleanPhone))
    .filter(phone => phone.replace(/\D/g, '').length >= 8);
  const websites = unique(text.match(/(?:https?:\/\/)?(?:www\.)?[a-z0-9-]+(?:\.[a-z0-9-]+)+[^\s,;)]*/gi) || [])
    .filter(site => !emails.some(email => email.toLowerCase().includes(site.toLowerCase())));

  const companyHints = /(pvt|private|limited|ltd|llp|inc|corp|company|enterprise|enterprises|industries|solutions|technologies|exports|overseas|group|agency|associates|services|consultants|studio|design|digital|finance|traders|labs|code|forms|innovation|secure|blink)/i;
  const titleHints = /(founder|co founder|co-founder|director|manager|executive|officer|ceo|cfo|cto|partner|proprietor|consultant|analyst|engineer|sales|marketing|business|head|lead|president|advisor|associate|technical)/i;
  const contactHints = /(phone|mobile|email|mail|www|http|tel|fax|address|road|street|lane|nagar|city|pin|india|\d{5,6})/i;

  const company = lines.find(line => companyHints.test(line) && !emails.includes(line)) || '';
  const designation = lines.find(line => titleHints.test(line) && line !== company) || '';
  const name = lines.find(line => {
    const clean = line.replace(/[^a-zA-Z .'-]/g, '').trim();
    const words = clean.split(/\s+/).filter(Boolean);
    return words.length >= 2 && words.length <= 4 &&
      !contactHints.test(line) && !companyHints.test(line) && !titleHints.test(line);
  }) || lines.find(line => !contactHints.test(line) && line !== company && line !== designation && line.length <= 42) || '';

  const addressLines = lines.filter(line => {
    const compactPhoneLine = line.replace(/[^\d+]/g, '');
    if (line === name || line === company || line === designation) return false;
    if (emails.some(email => line.includes(email))) return false;
    if (phones.some(phone => compactPhoneLine.includes(phone.replace(/[^\d+]/g, '')))) return false;
    if (websites.some(site => line.includes(site))) return false;
    return /(road|street|lane|sector|plot|floor|tower|city|nagar|complex|building|area|india|near|edge|pune|kolkata|\b\d{5,6}\b)/i.test(line);
  });

  const warnings = [];
  if (!name) warnings.push('Name missing');
  if (!company) warnings.push('Company missing');
  if (!phones.length) warnings.push('Phone missing');
  if (!emails.length) warnings.push('Email missing');
  if (phones.some(phone => phone.replace(/\D/g, '').length < 10)) warnings.push('Phone may be incomplete');
  if (text.length < 20) warnings.push('Very little text detected');

  const row = {
    name,
    company,
    designation,
    phones: phones.join(', '),
    email: emails.join(', '),
    website: websites.join(', '),
    address: unique(addressLines).join(', '),
    ocrConfidence: Math.round(typeof group === 'object' ? group.confidence : 0),
    qualityScore: 0,
    quality: '',
    warnings,
    rawText: text
  };
  row.qualityScore = fieldScore(row);
  row.quality = qualityLabel(row.qualityScore);
  return row;
};

const overlap = (a, b) => !(a.x1 < b.x0 || b.x1 < a.x0 || a.y1 < b.y0 || b.y1 < a.y0);

const detectTextGroups = (lines, fallbackText, pageWidth, pageHeight, fallbackConfidence) => {
  const usableLines = (lines || [])
    .filter(line => normalizeText(line.text).length > 1 && line.bbox)
    .map(line => ({
      text: normalizeText(line.text),
      confidence: Number(line.confidence) || fallbackConfidence || 0,
      bbox: { x0: line.bbox.x0, y0: line.bbox.y0, x1: line.bbox.x1, y1: line.bbox.y1 }
    }));

  if (usableLines.length < 4) return [{ text: fallbackText, confidence: fallbackConfidence || 0 }].filter(group => group.text);

  const groups = [];
  const padX = pageWidth * 0.05;
  const padY = pageHeight * 0.04;
  usableLines.forEach(line => {
    const expanded = { x0: line.bbox.x0 - padX, y0: line.bbox.y0 - padY, x1: line.bbox.x1 + padX, y1: line.bbox.y1 + padY };
    const matches = groups.filter(group => overlap(group.bbox, expanded));
    if (!matches.length) {
      groups.push({ bbox: { ...expanded }, lines: [line] });
      return;
    }
    const target = matches[0];
    target.lines.push(line);
    target.bbox.x0 = Math.min(target.bbox.x0, expanded.x0);
    target.bbox.y0 = Math.min(target.bbox.y0, expanded.y0);
    target.bbox.x1 = Math.max(target.bbox.x1, expanded.x1);
    target.bbox.y1 = Math.max(target.bbox.y1, expanded.y1);
  });

  const cardGroups = groups
    .filter(group => group.lines.length >= 2)
    .sort((a, b) => (a.bbox.y0 - b.bbox.y0) || (a.bbox.x0 - b.bbox.x0))
    .map(group => {
      const sortedLines = group.lines.sort((a, b) => (a.bbox.y0 - b.bbox.y0) || (a.bbox.x0 - b.bbox.x0));
      return {
        text: sortedLines.map(line => line.text).join('\n'),
        confidence: sortedLines.reduce((sum, line) => sum + line.confidence, 0) / sortedLines.length
      };
    });

  return cardGroups.length ? cardGroups : [{ text: fallbackText, confidence: fallbackConfidence || 0 }].filter(group => group.text);
};

const pairCardSides = groups => {
  if (!pairSides.checked) return groups;
  const paired = [];
  for (let index = 0; index < groups.length; index += 2) {
    const sides = [groups[index], groups[index + 1]].filter(Boolean);
    paired.push({
      text: sides.map(side => side.text).join('\n'),
      confidence: sides.reduce((sum, side) => sum + side.confidence, 0) / sides.length
    });
  }
  return paired;
};

const markDuplicates = rows => {
  const seen = new Map();
  rows.forEach((row, index) => {
    const key = [row.email.toLowerCase(), row.phones.replace(/\D/g, ''), row.name.toLowerCase()].filter(Boolean).join('|');
    if (key && seen.has(key)) row.warnings.push(`Possible duplicate of row ${seen.get(key) + 1}`);
    if (key && !seen.has(key)) seen.set(key, index);
    row.qualityScore = fieldScore(row);
    row.quality = qualityLabel(row.qualityScore);
  });
  return rows;
};

const enhanceCanvas = source => {
  const enhanced = document.createElement('canvas');
  enhanced.width = source.width;
  enhanced.height = source.height;
  const context = enhanced.getContext('2d', { willReadFrequently: true });
  context.filter = 'contrast(1.18) saturate(0.9) brightness(1.04)';
  context.drawImage(source, 0, 0);
  return enhanced;
};

const recognizeBest = async (canvas, pageNumber, totalPages) => {
  const variants = enhanceImages.checked
    ? [{ label: 'cleaned', canvas: enhanceCanvas(canvas) }, { label: 'original', canvas }]
    : [{ label: 'original', canvas }];
  let best = null;

  for (const variant of variants) {
    const result = await Tesseract.recognize(variant.canvas, ocrLanguage.value, {
      logger: message => {
        if (message.status === 'recognizing text') {
          const pageBase = ((pageNumber - 1) / totalPages) * 100;
          const pageShare = (message.progress / totalPages / variants.length) * 100;
          setStatus(`Reading page ${pageNumber} of ${totalPages}.`, `${Math.round(message.progress * 100)}% OCR complete on ${variant.label} pass.`, pageBase + pageShare);
        }
      }
    });
    const score = (Number(result.data.confidence) || 0) + Math.min(24, normalizeText(result.data.text).length / 16);
    if (!best || score > best.score) best = { result, canvas: variant.canvas, score };
  }

  return best;
};

const renderRows = () => {
  if (!state.rows.length) {
    resultsBody.innerHTML = '<tr class="empty-row"><td colspan="11">Extracted visiting cards will appear here.</td></tr>';
    updateCounts();
    return;
  }

  resultsBody.innerHTML = state.rows.map((row, index) => `
    <tr data-index="${index}" class="${reviewNeeded(row) ? 'needs-review' : ''}">
      <td class="preview-cell">${renderPreview(row)}</td>
      <td contenteditable="true" data-field="name">${escapeHtml(row.name)}</td>
      <td contenteditable="true" data-field="company">${escapeHtml(row.company)}</td>
      <td contenteditable="true" data-field="designation">${escapeHtml(row.designation)}</td>
      <td contenteditable="true" data-field="phones">${escapeHtml(row.phones)}</td>
      <td contenteditable="true" data-field="email">${escapeHtml(row.email)}</td>
      <td contenteditable="true" data-field="website">${escapeHtml(row.website)}</td>
      <td contenteditable="true" data-field="address">${escapeHtml(row.address)}</td>
      <td class="quality-cell"><span class="quality ${row.quality.toLowerCase()}">${escapeHtml(row.quality)} ${row.qualityScore}%</span><small>OCR ${row.ocrConfidence}%</small></td>
      <td contenteditable="true" data-field="warnings" class="warning-cell">${escapeHtml(row.warnings.join(', '))}</td>
      <td contenteditable="true" data-field="rawText" class="raw-cell">${escapeHtml(row.rawText)}</td>
    </tr>
  `).join('');
  updateCounts();
};

const renderPreview = row => {
  const images = Array.isArray(row.previewImages) ? row.previewImages : [];
  if (!images.length) return '<span class="no-preview">No preview</span>';
  return `<div class="card-previews">${images.map((src, index) => `<img src="${escapeHtml(src)}" alt="Card side ${index + 1}">`).join('')}</div>`;
};

resultsBody.addEventListener('input', event => {
  const cell = event.target.closest('[data-field]');
  if (!cell) return;
  const row = state.rows[Number(cell.closest('tr').dataset.index)];
  if (cell.dataset.field === 'warnings') row.warnings = unique(cell.innerText.split(','));
  else row[cell.dataset.field] = cell.innerText.trim();
  row.qualityScore = fieldScore(row);
  row.quality = qualityLabel(row.qualityScore);
  updateCounts();
});

const setFile = file => {
  if (!file || file.type !== 'application/pdf') {
    setStatus('Please choose a PDF file.', 'Only PDF files are supported for this workflow.', 0);
    return;
  }
  state.file = file;
  startButton.disabled = false;
  setStatus('PDF ready.', file.name, 0);
};

pdfInput.addEventListener('change', event => setFile(event.target.files[0]));

['dragenter', 'dragover'].forEach(type => {
  dropZone.addEventListener(type, event => {
    event.preventDefault();
    dropZone.classList.add('is-dragging');
  });
});

['dragleave', 'drop'].forEach(type => {
  dropZone.addEventListener(type, event => {
    event.preventDefault();
    dropZone.classList.remove('is-dragging');
  });
});

dropZone.addEventListener('drop', event => setFile(event.dataTransfer.files[0]));

startButton.addEventListener('click', async () => {
  if (!state.file) return;

  if (backendAvailable) {
    await extractWithBackend();
    return;
  }

  if (!window.pdfjsLib || !window.Tesseract || !window.XLSX) {
    setStatus('Required libraries are still loading.', 'Check your internet connection, then try again.', 0);
    return;
  }

  startButton.disabled = true;
  downloadButton.disabled = true;
  state.rows = [];
  state.pages = 0;
  renderRows();

  try {
    const buffer = await state.file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
    state.pages = pdf.numPages;
    updateCounts();

    const detectedGroups = [];
    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      setStatus(`Reading page ${pageNumber} of ${pdf.numPages}.`, 'Rendering PDF page at high resolution.', ((pageNumber - 1) / pdf.numPages) * 100);
      const page = await pdf.getPage(pageNumber);
      const viewport = page.getViewport({ scale: 3 });
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d', { willReadFrequently: true });
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      await page.render({ canvasContext: context, viewport }).promise;

      const best = await recognizeBest(canvas, pageNumber, pdf.numPages);
      const result = best.result;
      if (pageAsCard.checked) {
        detectedGroups.push({ text: result.data.text, confidence: Number(result.data.confidence) || 0 });
      } else {
        detectTextGroups(result.data.lines, result.data.text, best.canvas.width, best.canvas.height, Number(result.data.confidence) || 0)
          .forEach(group => detectedGroups.push(group));
      }
    }

    state.rows = markDuplicates(pairCardSides(detectedGroups).map(extractFields).filter(row => row.rawText.length > 0));
    renderRows();
    const needsReview = state.rows.filter(reviewNeeded).length;
    setStatus('Extraction complete.', `${state.rows.length} row${state.rows.length === 1 ? '' : 's'} created. ${needsReview} need review before export.`, 100);
  } catch (error) {
    console.error(error);
    setStatus('Could not finish extraction.', error.message || 'Try a clearer PDF or fewer pages.', 0);
  } finally {
    startButton.disabled = !state.file;
  }
});

const extractWithBackend = async () => {
  startButton.disabled = true;
  downloadButton.disabled = true;
  state.rows = [];
  state.pages = 0;
  renderRows();
  setStatus('Uploading PDF to backend.', 'The server is rendering, cleaning, OCRing, and pairing card sides.', 8);

  try {
    const form = new FormData();
    form.append('pdf', state.file);
    form.append('pairSides', pairSides.checked ? 'true' : 'false');
    form.append('pageAsCard', pageAsCard.checked ? 'true' : 'false');
    form.append('accuracyMode', accuracyMode.value);
    const response = await fetch('/api/extract-cards', { method: 'POST', body: form });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || 'Backend extraction failed.');
    state.rows = payload.rows || [];
    state.pages = payload.pages || 0;
    renderRows();
    const needsReview = state.rows.filter(reviewNeeded).length;
    setStatus('Backend extraction complete.', `${state.rows.length} row${state.rows.length === 1 ? '' : 's'} created. ${needsReview} need review before export.`, 100);
  } catch (error) {
    console.error(error);
    setStatus('Backend extraction failed.', `${error.message} You can still use browser fallback by opening the file directly.`, 0);
  } finally {
    startButton.disabled = !state.file;
  }
};

downloadButton.addEventListener('click', async () => {
  if (backendAvailable) {
    const response = await fetch('/api/export-cards', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rows: state.rows })
    });
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `visiting-card-data-${new Date().toISOString().slice(0, 10)}.xlsx`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    return;
  }

  const exportRows = state.rows.map((row, index) => ({
    'Sr No': index + 1,
    Name: row.name,
    Company: row.company,
    Designation: row.designation,
    Phones: row.phones,
    Email: row.email,
    Website: row.website,
    Address: row.address,
    Quality: row.quality,
    'Quality Score': row.qualityScore,
    'OCR Confidence': row.ocrConfidence,
    Warnings: row.warnings.join(', '),
    'Raw OCR Text': row.rawText
  }));
  const worksheet = XLSX.utils.json_to_sheet(exportRows);
  worksheet['!cols'] = [
    { wch: 8 }, { wch: 24 }, { wch: 28 }, { wch: 24 }, { wch: 24 },
    { wch: 30 }, { wch: 30 }, { wch: 48 }, { wch: 16 }, { wch: 14 },
    { wch: 16 }, { wch: 36 }, { wch: 64 }
  ];
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Visiting Cards');
  XLSX.writeFile(workbook, `visiting-card-data-${new Date().toISOString().slice(0, 10)}.xlsx`);
});

clearButton.addEventListener('click', () => {
  state.rows = [];
  state.pages = 0;
  state.file = null;
  pdfInput.value = '';
  startButton.disabled = true;
  renderRows();
  setStatus('Choose a PDF to begin.', 'OCR quality depends on scan clarity. Higher-resolution PDFs give better results.', 0);
});
