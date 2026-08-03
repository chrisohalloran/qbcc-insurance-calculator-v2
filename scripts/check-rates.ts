const QBCC_URL = 'https://www.qbcc.qld.gov.au/running-your-business/home-warranty-insurance-obligations/calculating-premium';
// Known current PDF identifiers - if these change, the table might have updated
const KNOWN_PDF_PATTERNS = [
  'hwi-premium-table-2701-new-home-construction.pdf',
  'hwi-premium-table-2701-alterations.pdf'
];

const QLEAVE_URL = 'https://www.qleave.qld.gov.au/building-and-construction/levy-payers/paying-the-levy/levy-calculator?levy-calculator_submit=Calculate';
const KNOWN_QLEAVE_RATE = '0.575';

async function fetchChecked(url: string): Promise<Response> {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'QBCCInsuranceCalculator-RateCheck/1.0'
    },
    redirect: 'follow'
  });

  if (!response.ok) {
    throw new Error(`${url} returned HTTP ${response.status}`);
  }

  return response;
}

async function checkRates() {
  console.log('🔍 Checking QBCC and QLeave rates...');
  let hasChanges = false;

  try {
    // 1. Check QBCC PDFs
    console.log(`Checking QBCC URL: ${QBCC_URL}`);
    const qbccResponse = await fetchChecked(QBCC_URL);
    const qbccHtml = await qbccResponse.text();
    
    for (const pdf of KNOWN_PDF_PATTERNS) {
      if (!qbccHtml.includes(pdf)) {
        console.error(`⚠️  WARNING: Could not find PDF link for ${pdf}. The file name may have changed (indicating a rate update).`);
        hasChanges = true;
      } else {
        const pdfUrl = new URL(`/sites/default/files/documents/${pdf}`, QBCC_URL).toString();
        const pdfResponse = await fetchChecked(pdfUrl);
        const contentType = pdfResponse.headers.get('content-type') ?? '';
        const pdfBytes = (await pdfResponse.arrayBuffer()).byteLength;

        if (!contentType.includes('application/pdf') || pdfBytes < 50_000) {
          console.error(`⚠️  WARNING: ${pdf} did not return a substantive PDF (${contentType}, ${pdfBytes} bytes).`);
          hasChanges = true;
        } else {
          console.log(`✅  Confirmed current PDF: ${pdf} (${pdfBytes} bytes)`);
        }
      }
    }

    // 2. Check QLeave Rate
    console.log(`Checking QLeave URL: ${QLEAVE_URL}`);
    try {
      const qleaveResponse = await fetchChecked(QLEAVE_URL);
      const qleaveHtml = await qleaveResponse.text();

      if (!qleaveHtml.includes(KNOWN_QLEAVE_RATE)) {
        console.error(`⚠️  WARNING: Could not find the rate "${KNOWN_QLEAVE_RATE}%" on the QLeave page. The levy rate may have changed.`);
        hasChanges = true;
      } else {
        console.log(`✅  Confirmed QLeave rate is still ${KNOWN_QLEAVE_RATE}%`);
      }
    } catch (error) {
      // QLeave currently presents a Cloudflare challenge to unattended HTTP
      // clients. QBCC's official premium page independently publishes the
      // same QLeave rate in its worked examples, so use that as a bounded
      // back-door check while keeping the direct-source block visible.
      console.warn(`⚠️  Direct QLeave check unavailable: ${error instanceof Error ? error.message : String(error)}`);

      if (!qbccHtml.includes(`${KNOWN_QLEAVE_RATE}%`)) {
        console.error(`⚠️  WARNING: QBCC's official worked examples also lack the rate "${KNOWN_QLEAVE_RATE}%".`);
        hasChanges = true;
      } else {
        console.log(`✅  Confirmed QLeave rate is still ${KNOWN_QLEAVE_RATE}% via QBCC's official worked examples`);
      }
    }

    if (hasChanges) {
      console.log('\n🚨 POTENTIAL RATE CHANGE DETECTED');
      console.log('Please review the official websites and update the calculator if necessary.');
      process.exit(1); // Fail the script to trigger notification
    } else {
      console.log('\n✨ All checks passed. No changes detected.');
      process.exit(0);
    }

  } catch (error) {
    console.error('Error running checks:', error);
    process.exit(1);
  }
}

checkRates();
