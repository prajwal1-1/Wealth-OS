const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

async function generatePDF() {
  const executablePath = fs.existsSync('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe')
    ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
    : 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

  console.log('Using browser at:', executablePath);

  const browser = await puppeteer.launch({
    executablePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });

  const page = await browser.newPage();
  const htmlPath = path.resolve(__dirname, 'capstone_report_print.html');
  console.log('Loading HTML:', htmlPath);

  await page.goto('file:///' + htmlPath.replace(/\\/g, '/'), {
    waitUntil: 'networkidle0'
  });

  const outputPath = path.resolve(__dirname, 'Wealth_OS_Capstone_Project_Report.pdf');
  
  await page.pdf({
    path: outputPath,
    format: 'A4',
    printBackground: true,
    margin: {
      top: '18mm',
      bottom: '18mm',
      left: '16mm',
      right: '16mm'
    },
    displayHeaderFooter: true,
    headerTemplate: '<div></div>',
    footerTemplate: `
      <div style="width: 100%; font-size: 8pt; font-family: 'Inter', sans-serif; color: #94a3b8; display: flex; justify-content: space-between; padding: 0 16mm;">
        <span>Wealth OS — Academic Capstone Dossier</span>
        <span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
      </div>
    `
  });

  console.log('PDF successfully generated at:', outputPath);

  // Copy to Artifact directory as well
  const artifactDir = 'C:\\Users\\ADMIN\\.gemini\\antigravity\\brain\\c82c43b3-676f-4cba-9646-d6389657639a';
  if (fs.existsSync(artifactDir)) {
    const artifactDest = path.join(artifactDir, 'Wealth_OS_Capstone_Project_Report.pdf');
    fs.copyFileSync(outputPath, artifactDest);
    console.log('Copied to artifact directory:', artifactDest);
  }

  await browser.close();
}

generatePDF().catch(err => {
  console.error('Error generating PDF:', err);
  process.exit(1);
});
