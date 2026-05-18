const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

// Text-to-speech function
const say = (text) => {
  const command = `say "${text}"`;
  exec(command, (error) => {
    if (error) {
      console.error(`TTS error: ${error.message}`);
    }
  });
};

puppeteer.use(StealthPlugin());

// Configuration
const DEFAULT_OUTPUT_DIR = './output';
const DEFAULT_KEYWORDS_FILE = './keywords.json';
const USER_AGENTS_FILE = './user-agents.json';
const BLOCK_PAUSE_MS = 10 * 60 * 1000; // 10 minutes
const DEFAULT_DATE_RANGE = 'today 1-m'; // Past 30 days
const DEFAULT_SCREENSHOTS_PER_TERM = 1;
const MAX_RETRIES = 3; // Maximum number of retries for navigation errors
const RETRY_DELAY_MS = 5000; // Delay between retries (5 seconds)

// Category Filter
const CATEGORIES = {
    "all": "All categories",
    "b": "Business",
    "e": "Entertainment",
    "m": "Health",
    "t": "Sci/Tech",
    "s": "Sports",
    "h": "Top stories",
};

// Geo Picker
const GEO_PICKER = {
    "AR": "Argentina",
    "AU": "Australia",
    "AT": "Austria",
    "BE": "Belgium",
    "BR": "Brazil",
    "CA": "Canada",
    "CL": "Chile",
    "CO": "Colombia",
    "CZ": "Czechia",
    "DK": "Denmark",
    "EG": "Egypt",
    "FI": "Finland",
    "FR": "France",
    "DE": "Germany",
    "GR": "Greece",
    "HK": "Hong Kong",
    "HU": "Hungary",
    "IN": "India",
    "ID": "Indonesia",
    "IE": "Ireland",
    "IL": "Israel",
    "IT": "Italy",
    "JP": "Japan",
    "KE": "Kenya",
    "MY": "Malaysia",
    "MX": "Mexico",
    "NL": "Netherlands",
    "NZ": "New Zealand",
    "NG": "Nigeria",
    "NO": "Norway",
    "PE": "Peru",
    "PH": "Philippines",
    "PL": "Poland",
    "PT": "Portugal",
    "RO": "Romania",
    "RU": "Russia",
    "SA": "Saudi Arabia",
    "SG": "Singapore",
    "ZA": "South Africa",
    "KR": "South Korea",
    "ES": "Spain",
    "SE": "Sweden",
    "CH": "Switzerland",
    "TW": "Taiwan",
    "TH": "Thailand",
    "TR": "Türkiye",
    "UA": "Ukraine",
    "GB": "United Kingdom",
    "US": "United States",
    "VN": "Vietnam",
    "AF": "Afghanistan",
    "AX": "Åland Islands",
    "AL": "Albania",
    "DZ": "Algeria",
    "AS": "American Samoa",
    "AD": "Andorra",
    "AO": "Angola",
    "AI": "Anguilla",
    "AQ": "Antarctica",
    "AG": "Antigua & Barbuda",
    "AM": "Armenia",
    "AW": "Aruba",
    "AZ": "Azerbaijan",
    "BS": "Bahamas",
    "BH": "Bahrain",
    "BD": "Bangladesh",
    "BB": "Barbados",
    "BY": "Belarus",
    "BZ": "Belize",
    "BJ": "Benin",
    "BM": "Bermuda",
    "BT": "Bhutan",
    "BO": "Bolivia",
    "BA": "Bosnia & Herzegovina",
    "BW": "Botswana",
    "BV": "Bouvet Island",
    "IO": "British Indian Ocean Territory",
    "VG": "British Virgin Islands",
    "BN": "Brunei",
    "BG": "Bulgaria",
    "BF": "Burkina Faso",
    "BI": "Burundi",
    "KH": "Cambodia",
    "CM": "Cameroon",
    "CV": "Cape Verde",
    "BQ": "Caribbean Netherlands",
    "KY": "Cayman Islands",
    "CF": "Central African Republic",
    "TD": "Chad",
    "CN": "China",
    "CX": "Christmas Island",
    "CC": "Cocos (Keeling) Islands",
    "KM": "Comoros",
    "CG": "Congo - Brazzaville",
    "CD": "Congo - Kinshasa",
    "CK": "Cook Islands",
    "CR": "Costa Rica",
    "CI": "Côte d'Ivoire",
    "HR": "Croatia",
    "CU": "Cuba",
    "CW": "Curaçao",
    "CY": "Cyprus",
    "DJ": "Djibouti",
    "DM": "Dominica",
    "DO": "Dominican Republic",
    "EC": "Ecuador",
    "SV": "El Salvador",
    "GQ": "Equatorial Guinea",
    "ER": "Eritrea",
    "EE": "Estonia",
    "SZ": "Eswatini",
    "ET": "Ethiopia",
    "FK": "Falkland Islands (Islas Malvinas)",
    "FO": "Faroe Islands",
    "FJ": "Fiji",
    "GF": "French Guiana",
    "PF": "French Polynesia",
    "TF": "French Southern Territories",
    "GA": "Gabon",
    "GM": "Gambia",
    "GE": "Georgia",
    "GH": "Ghana",
    "GI": "Gibraltar",
    "GL": "Greenland",
    "GD": "Grenada",
    "GP": "Guadeloupe",
    "GU": "Guam",
    "GT": "Guatemala",
    "GG": "Guernsey",
    "GN": "Guinea",
    "GW": "Guinea-Bissau",
    "GY": "Guyana",
    "HT": "Haiti",
    "HM": "Heard & McDonald Islands",
    "HN": "Honduras",
    "IS": "Iceland",
    "IR": "Iran",
    "IQ": "Iraq",
    "IM": "Isle of Man",
    "JM": "Jamaica",
    "JE": "Jersey",
    "JO": "Jordan",
    "KZ": "Kazakhstan",
    "KI": "Kiribati",
    "XK": "Kosovo",
    "KW": "Kuwait",
    "KG": "Kyrgyzstan",
    "LA": "Laos",
    "LV": "Latvia",
    "LB": "Lebanon",
    "LS": "Lesotho",
    "LR": "Liberia",
    "LY": "Libya",
    "LI": "Liechtenstein",
    "LT": "Lithuania",
    "LU": "Luxembourg",
    "MO": "Macao",
    "MG": "Madagascar",
    "MW": "Malawi",
    "MV": "Maldives",
    "ML": "Mali",
    "MT": "Malta",
    "MH": "Marshall Islands",
    "MQ": "Martinique",
    "MR": "Mauritania",
    "MU": "Mauritius",
    "YT": "Mayotte",
    "FM": "Micronesia",
    "MD": "Moldova",
    "MC": "Monaco",
    "MN": "Mongolia",
    "ME": "Montenegro",
    "MS": "Montserrat",
    "MA": "Morocco",
    "MZ": "Mozambique",
    "MM": "Myanmar (Burma)",
    "NA": "Namibia",
    "NR": "Nauru",
    "NP": "Nepal",
    "NC": "New Caledonia",
    "NI": "Nicaragua",
    "NE": "Niger",
    "NU": "Niue",
    "NF": "Norfolk Island",
    "KP": "North Korea",
    "MK": "North Macedonia",
    "MP": "Northern Mariana Islands",
    "OM": "Oman",
    "PK": "Pakistan",
    "PW": "Palau",
    "PS": "Palestine",
    "PA": "Panama",
    "PG": "Papua New Guinea",
    "PY": "Paraguay",
    "PN": "Pitcairn Islands",
    "PR": "Puerto Rico",
    "QA": "Qatar",
    "RE": "Réunion",
    "RW": "Rwanda",
    "WS": "Samoa",
    "SM": "San Marino",
    "ST": "São Tomé & Príncipe",
    "SN": "Senegal",
    "RS": "Serbia",
    "SC": "Seychelles",
    "SL": "Sierra Leone",
    "SX": "Sint Maarten",
    "SK": "Slovakia",
    "SI": "Slovenia",
    "SB": "Solomon Islands",
    "SO": "Somalia",
    "GS": "South Georgia & South Sandwich Islands",
    "SS": "South Sudan",
    "BL": "St Barthélemy",
    "SH": "St Helena",
    "KN": "St Kitts & Nevis",
    "LC": "St Lucia",
    "MF": "St Martin",
    "PM": "St Pierre & Miquelon",
    "VC": "St Vincent & the Grenadines",
    "SD": "Sudan",
    "SR": "Suriname",
    "SJ": "Svalbard & Jan Mayen",
    "SY": "Syria",
    "TJ": "Tajikistan",
    "TZ": "Tanzania",
    "TL": "Timor-Leste",
    "TG": "Togo",
    "TK": "Tokelau",
    "TO": "Tonga",
    "TT": "Trinidad & Tobago",
    "TN": "Tunisia",
    "TM": "Turkmenistan",
    "TC": "Turks & Caicos Islands",
    "TV": "Tuvalu",
    "UG": "Uganda",
    "AE": "United Arab Emirates",
    "UM": "US Outlying Islands",
    "VI": "US Virgin Islands",
    "UY": "Uruguay",
    "UZ": "Uzbekistan",
    "VU": "Vanuatu",
    "VA": "Vatican City",
    "VE": "Venezuela",
    "WF": "Wallis & Futuna",
    "EH": "Western Sahara",
    "YE": "Yemen",
    "ZM": "Zambia",
    "ZW": "Zimbabwe",
};

// Date range mappings
const DATE_RANGE_MAP = {
  'Past hour': 'now 1-H',
  'Past 4 hours': 'now 4-H',
  'Past day': 'now 1-d',
  'Past 7 days': 'now 7-d',
  'Past 30 days': 'today 1-m',
  'Past 90 days': 'today 3-m',
  'Past 12 months': 'today 12-m',
  'Past 5 years': 'today 5-y',
  '2024-present': 'all'
};

// Global set to remember all search terms that have been processed
const processedTerms = new Set();

/**
 * Parse command line arguments
 */
function parseCommandLineArgs() {
  const args = process.argv.slice(2);
  let keywordsFile = DEFAULT_KEYWORDS_FILE;
  let outputDir = DEFAULT_OUTPUT_DIR;
  let dateRange = DEFAULT_DATE_RANGE;
  let screenshotsPerTerm = DEFAULT_SCREENSHOTS_PER_TERM;
  let region = null;
  let category = 'all';
  let onlyKeepLast = false;
  let explode = false;
  let switchUaOnFailOnly = false;
  
  console.log('\n=== Command line arguments parsed ===');
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg === '--keyword-file' && i + 1 < args.length) {
      keywordsFile = args[i + 1];
      console.log(`  --keyword-file: ${keywordsFile}`);
      i++;
    } else if (arg === '--output-dir' && i + 1 < args.length) {
      outputDir = args[i + 1];
      console.log(`  --output-dir: ${outputDir}`);
      i++;
    } else if (arg === '--date' && i + 1 < args.length) {
      const dateArg = args[i + 1];
      if (DATE_RANGE_MAP[dateArg]) {
        dateRange = DATE_RANGE_MAP[dateArg];
        console.log(`  --date: ${dateArg} -> ${dateRange}`);
      } else if (dateArg.match(/^\d{4}-\d{2}-\d{2}\s+\d{4}-\d{2}-\d{2}$/)) {
        dateRange = dateArg;
        console.log(`  --date (custom): ${dateRange}`);
      } else {
        console.error(`Invalid date format: ${dateArg}`);
        process.exit(1);
      }
      i++;
    } else if (arg === '--screenshots-per-term' && i + 1 < args.length) {
      screenshotsPerTerm = parseInt(args[i + 1], 10);
      console.log(`  --screenshots-per-term: ${screenshotsPerTerm}`);
      i++;
    } else if (arg === '--region' && i + 1 < args.length) {
      const regionArg = args[i + 1].toUpperCase();
      if (GEO_PICKER[regionArg]) {
        region = regionArg;
        console.log(`  --region: ${regionArg} - ${GEO_PICKER[regionArg]}`);
      } else {
        console.error(`Invalid region code: ${regionArg}`);
        process.exit(1);
      }
      i++;
    } else if (arg === '--category' && i + 1 < args.length) {
      const categoryArg = args[i + 1].toLowerCase();
      if (CATEGORIES[categoryArg]) {
        category = categoryArg;
        console.log(`  --category: ${categoryArg} - ${CATEGORIES[categoryArg]}`);
      } else {
        console.error(`Invalid category code: ${categoryArg}`);
        process.exit(1);
      }
      i++;
    } else if (arg === '--only-keep-last') {
      onlyKeepLast = true;
      console.log(`  --only-keep-last: enabled`);
    } else if (arg === '--explode') {
      explode = true;
      console.log(`  --explode: enabled (will decompose keywords into subsequences)`);
    } else if (arg === '--switch-ua-on-fail-only') {
      switchUaOnFailOnly = true;
      console.log(`  --switch-ua-on-fail-only: enabled (only switch user agent on block/pause)`);
    } else if (arg === '--help' || arg === '-h') {
      console.log(`
Usage: node index.js [options]

Options:
  --keyword-file <path>           Path to JSON file containing keywords array (default: ./keywords.json)
  --output-dir <path>             Output directory for screenshots (default: ./output)
  --date <range>                  Date range for Google Trends (default: "Past 30 days")
                                  Valid options: "Past hour", "Past 4 hours", "Past day", "Past 7 days",
                                  "Past 30 days", "Past 90 days", "Past 12 months", "Past 5 years", "2024-present"
                                  Or custom range: "YYYY-MM-DD YYYY-MM-DD"
  --screenshots-per-term <number> Number of screenshots to take per search term (default: 1)
  --region <code>                 Country code for geo-targeting (default: worldwide)
  --category <code>               Category filter (default: all)
  --only-keep-last                Only keep the last successful screenshot per term
  --explode                       Decompose keywords into all non-empty subsequences (order preserved)
  --switch-ua-on-fail-only        Only switch user agent when a block triggers the 10-minute pause.
                                  Normal mode rotates user agent every 15-30 requests.
  --help, -h                      Show this help message

Examples:
  # Worldwide forensic pruning detection (exact keywords, normal UA rotation)
  node index.js --keyword-file ./keywords.json --date "Past 5 years"
  
  # Same but with decomposition (generates all subsequences)
  node index.js --keyword-file ./keywords.json --date "Past 5 years" --explode
  
  # Conservative UA mode for long-running collections
  node index.js --keyword-file ./keywords.json --date "Past 5 years" --switch-ua-on-fail-only
  
  # US-specific with custom output directory
  node index.js --keyword-file ./keywords.json --region US --date "Past 5 years" --output-dir ./us_forensic
  
  # High-frequency sampling with disk space optimization and conservative UA
  node index.js --keyword-file ./monitor-terms.json --date "Past day" --screenshots-per-term 24 --only-keep-last --switch-ua-on-fail-only
      `);
      process.exit(0);
    }
  }
  
  console.log(`\n  Final output directory: ${outputDir}`);
  console.log(`  Explode mode: ${explode ? 'ON (decomposing keywords)' : 'OFF (exact keywords only)'}`);
  console.log(`  UA switching mode: ${switchUaOnFailOnly ? 'ONLY ON FAIL (conservative)' : 'NORMAL (every 15-30 requests)'}`);
  return { keywordsFile, outputDir, dateRange, screenshotsPerTerm, region, category, onlyKeepLast, explode, switchUaOnFailOnly };
}

/**
 * Generate all non-empty subsequences (order preserved) from a phrase.
 * Example: 'big brown cow' -> ['big', 'brown', 'cow', 'big brown', 'big cow', 'brown cow', 'big brown cow']
 */
function generateAllSubsequences(phrase) {
  const words = phrase.trim().split(/\s+/);
  const total = 1 << words.length;
  const subsequences = [];

  for (let i = 1; i < total; i++) {
    const selected = [];
    for (let j = 0; j < words.length; j++) {
      if (i & (1 << j)) {
        selected.push(words[j]);
      }
    }
    subsequences.push(selected.join(' '));
  }
  return subsequences;
}

/**
 * Generate search terms from compound keywords based on explode flag
 * If explode is true, generates all non-empty subsequences
 * If explode is false, uses only the exact keywords as-is
 */
function generateSearchTerms(compoundKeywords, explode) {
  const allSearchTerms = new Set();
  
  if (explode) {
    console.log('  Decomposing keywords into all subsequences...');
    for (const keyword of compoundKeywords) {
      const subsequences = generateAllSubsequences(keyword);
      subsequences.forEach(term => allSearchTerms.add(term));
    }
  } else {
    console.log('  Using exact keywords only (no decomposition)...');
    for (const keyword of compoundKeywords) {
      allSearchTerms.add(keyword);
    }
  }
  
  return allSearchTerms;
}

/**
 * Sanitize a search term for use in a filename.
 */
function sanitizeFilename(term) {
  return term.replace(/[\\/:*?"<>|]/g, '_').replace(/\s+/g, '_');
}

/**
 * Get current timestamp as MM-DD-YYYY_HH-MM-SS
 */
function getTimestamp() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const year = now.getFullYear();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  return `${month}-${day}-${year}_${hours}-${minutes}-${seconds}`;
}

/**
 * Load compound keywords from a JSON file.
 */
async function loadKeywords(filePath) {
  try {
    const data = await fs.readFile(filePath, 'utf8');
    const keywords = JSON.parse(data);
    if (!Array.isArray(keywords)) {
      throw new Error('JSON file must contain an array of strings.');
    }
    return keywords;
  } catch (error) {
    console.error(`Failed to load keywords from ${filePath}:`, error.message);
    process.exit(1);
  }
}

/**
 * Load user agents from a JSON file.
 */
async function loadUserAgents() {
  try {
    const data = await fs.readFile(USER_AGENTS_FILE, 'utf8');
    const agents = JSON.parse(data);
    if (!Array.isArray(agents) || agents.length === 0) {
      throw new Error('User agents file must contain a non-empty array of strings.');
    }
    return agents;
  } catch (error) {
    console.error(`Failed to load user agents from ${USER_AGENTS_FILE}:`, error.message);
    process.exit(1);
  }
}

/**
 * Random integer between min and max (inclusive)
 */
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Shuffle an array using Fisher-Yates algorithm
 */
function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Sleep/pause for a specified duration
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Check if tesseract is installed
 */
async function checkTesseract() {
  try {
    await execPromise('which tesseract');
    return true;
  } catch {
    return false;
  }
}

/**
 * Extract text from image using OCR (tesseract)
 */
async function extractTextFromImage(imagePath) {
  try {
    const outputPath = imagePath.replace(/\.jpg$/, '_ocr');
    await execPromise(`tesseract "${imagePath}" "${outputPath}" --psm 6 2>/dev/null`);
    const result = await fs.readFile(`${outputPath}.txt`, 'utf8');
    await fs.unlink(`${outputPath}.txt`).catch(() => {});
    return result.toLowerCase();
  } catch (error) {
    console.error(`  OCR failed: ${error.message}`);
    return '';
  }
}

/**
 * Analyze screenshot using OCR and pattern matching
 * Returns analysis type and whether the screenshot is valid (has chart data)
 */
async function analyzeScreenshot(screenshotPath) {
  try {
    console.log(`  Analyzing screenshot with OCR...`);
    const text = await extractTextFromImage(screenshotPath);
    
    const hasChart = text.includes('interest over time') || 
                     text.includes('trend') || 
                     (text.includes('search') && text.includes('graph')) ||
                     text.match(/[\d,]+%?/);
    
    const hasNoData = text.includes("doesn't have enough data") || 
                      text.includes("no data") ||
                      text.includes("not enough data") ||
                      text.includes("oops") ||
                      text.includes("try a more general term");
    
    const hasCaptcha = text.includes("captcha") ||
                       text.includes("suspicious") ||
                       text.includes("unusual traffic") ||
                       text.includes("verify you're human");
    
    const hasRateLimit = text.includes("429") ||
                         text.includes("rate limit") ||
                         text.includes("too many requests");
    
    if (hasRateLimit) {
      console.log(`  Pattern detected: rate_limited`);
      return { type: 'rate_limited', blocked: true, valid: false };
    } else if (hasCaptcha) {
      console.log(`  Pattern detected: captcha`);
      return { type: 'captcha', blocked: true, valid: false };
    } else if (hasNoData) {
      console.log(`  Pattern detected: no_data (will be deleted)`);
      return { type: 'no_data', blocked: false, valid: false };
    } else if (hasChart) {
      console.log(`  Pattern detected: success (keeping screenshot)`);
      return { type: 'success', blocked: false, valid: true };
    } else {
      if (text.includes('500') || text.includes('502') || text.includes('503') || text.includes('504')) {
        console.log(`  Pattern detected: error (will be deleted)`);
        return { type: 'error', blocked: true, valid: false };
      }
      console.log(`  Pattern detected: unknown (defaulting to no_data, will be deleted)`);
      return { type: 'no_data', blocked: false, valid: false };
    }
    
  } catch (error) {
    console.error(`  Screenshot analysis failed: ${error.message}`);
    return { type: 'error', blocked: true, valid: false };
  }
}

/**
 * Clear ALL browser storage
 */
async function clearAllStorage(page) {
  try {
    console.log('  Clearing ALL browser storage...');
    
    const cookies = await page.cookies();
    for (const cookie of cookies) {
      await page.deleteCookie(cookie);
    }
    console.log(`    Deleted ${cookies.length} cookies`);
    
    const client = await page.target().createCDPSession();
    await client.send('Network.clearBrowserCookies');
    await client.send('Network.clearBrowserCache');
    console.log('    Cleared browser cache');
    
    try {
      await page.evaluate(() => {
        if (window.localStorage) localStorage.clear();
        if (window.sessionStorage) sessionStorage.clear();
      });
      console.log('    Cleared localStorage/sessionStorage');
    } catch (storageError) {
      console.log('    Note: localStorage/sessionStorage not accessible');
    }
    
  } catch (error) {
    console.warn('  Failed to clear some storage items:', error.message);
  }
}

/**
 * Reinitialize session
 */
async function reinitializeSession(page) {
  try {
    console.log('  Re-initializing Google Trends session...');
    await page.goto('https://trends.google.com', { 
      waitUntil: 'networkidle2', 
      timeout: 30000 
    });
    await sleep(3000);
    console.log('  Session re-initialized successfully');
  } catch (error) {
    console.error('  Failed to re-initialize session:', error.message);
    throw error;
  }
}

/**
 * Initialize clean session
 */
async function initializeCleanSession(page) {
  try {
    console.log('\n=== Initializing clean Google Trends session ===');
    await clearAllStorage(page);
    await reinitializeSession(page);
    console.log('✓ Clean session ready');
  } catch (error) {
    console.error('Failed to initialize clean session:', error.message);
    throw error;
  }
}

/**
 * Takes a screenshot, analyzes it, and deletes if invalid (no chart data)
 * With retry logic for navigation errors and session issues
 */
async function screenshotAndAnalyze(page, term, screenshotNumber, totalScreenshotsForTerm, dateRange, region, category, outputDir, previousScreenshotPath = null) {
  const encodedTerm = encodeURIComponent(term);
  let url = `https://trends.google.com/trends/explore?date=${encodeURIComponent(dateRange)}&q=${encodedTerm}&hl=en-US`;
  
  if (region) {
    url += `&geo=${region}`;
  }
  
  if (category && category !== 'all') {
    url += `&cat=${category}`;
  }
  
  let retries = 0;
  let lastError = null;
  
  while (retries <= MAX_RETRIES) {
    try {
      console.log(`Navigating to: ${url}`);
      
      let response;
      let statusCode = 0;
      let statusText = 'unknown';
      
      try {
        response = await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
        if (response) {
          statusCode = response.status();
          statusText = response.statusText();
        }
      } catch (navError) {
        // Check if this is a recoverable navigation error
        if (navError.message.includes('Navigating frame was detached') ||
            navError.message.includes('Session closed') ||
            navError.message.includes('Protocol error') ||
            navError.message.includes('Target closed')) {
          console.log(`  Navigation error (recoverable): ${navError.message}`);
          throw navError; // Will be caught and retried
        } else {
          // Non-recoverable error, rethrow
          throw navError;
        }
      }
      
      await sleep(3000);
      
      const safeTerm = sanitizeFilename(term);
      const timestampForFile = getTimestamp();
      const screenshotLabel = totalScreenshotsForTerm > 1 ? `_${screenshotNumber}` : '';
      const regionLabel = region ? `_${region}` : '';
      const categoryLabel = category && category !== 'all' ? `_cat${category}` : '';
      const filename = `${safeTerm}${screenshotLabel}${regionLabel}${categoryLabel}_${timestampForFile}_pending_${statusCode}.jpg`;
      const filepath = path.join(outputDir, filename);
      
      await page.screenshot({ path: filepath, type: 'jpeg', quality: 80 });
      console.log(`Screenshot saved: ${filepath}`);
      
      const analysis = await analyzeScreenshot(filepath);
      
      // If screenshot is not valid (no chart data, error, etc.), delete it
      if (!analysis.valid) {
        try {
          await fs.unlink(filepath);
          console.log(`  Deleted invalid screenshot (${analysis.type}): ${path.basename(filepath)}`);
          return {
            screenshotPath: null,
            analysis: analysis,
            statusCode: statusCode,
            deleted: true
          };
        } catch (err) {
          console.log(`  Warning: Could not delete invalid screenshot: ${err.message}`);
          return {
            screenshotPath: filepath,
            analysis: analysis,
            statusCode: statusCode,
            deleted: false
          };
        }
      }
      
      // Valid screenshot - rename with classification
      const finalFilename = `${safeTerm}${screenshotLabel}${regionLabel}${categoryLabel}_${timestampForFile}_${analysis.type}_${statusCode}.jpg`;
      const finalFilepath = path.join(outputDir, finalFilename);
      await fs.rename(filepath, finalFilepath);
      console.log(`  Renamed to: ${finalFilename}`);
      
      // If we have a previous screenshot and it's a success, delete it (only-keep-last mode)
      if (previousScreenshotPath && analysis.type === 'success') {
        try {
          await fs.unlink(previousScreenshotPath);
          console.log(`  Deleted previous screenshot: ${path.basename(previousScreenshotPath)}`);
        } catch (err) {
          console.log(`  Warning: Could not delete previous screenshot: ${err.message}`);
        }
      }
      
      return {
        screenshotPath: finalFilepath,
        analysis: analysis,
        statusCode: statusCode,
        deleted: false
      };
      
    } catch (error) {
      lastError = error;
      retries++;
      
      console.log(`  Error during screenshot/analysis (attempt ${retries}/${MAX_RETRIES}): ${error.message}`);
      
      if (retries <= MAX_RETRIES) {
        console.log(`  Retrying in ${RETRY_DELAY_MS / 1000} seconds...`);
        await sleep(RETRY_DELAY_MS);
        
        // Try to recover the page state
        try {
          // Check if page is still usable
          await page.evaluate(() => 1);
        } catch (pageError) {
          console.log(`  Page appears to be closed or broken. Attempting to recover...`);
          // Page is broken, we need to reinitialize the session at a higher level
          // Throw a special error that will cause the main loop to reinitialize
          throw new Error('PAGE_STATE_CORRUPTED');
        }
      }
    }
  }
  
  // If we've exhausted all retries, throw the last error
  console.error(`  Failed after ${MAX_RETRIES} retries. Last error: ${lastError.message}`);
  throw lastError;
}

/**
 * Pause execution with TTS notification
 */
async function pauseWithNotification(ms, reason) {
  const minutes = ms / 1000 / 60;
  const message = `Shit, we've been blocked. Please rotate your IP address.`;
  
  console.log(`\n*** ${reason} - ${message} ***`);
  console.log(`*** Pausing for ${minutes} minutes ***\n`);
  
  say(message);
  await sleep(ms);
}

/**
 * Main entry point
 */
async function main() {
  const { keywordsFile, outputDir, dateRange, screenshotsPerTerm, region, category, onlyKeepLast, explode, switchUaOnFailOnly } = parseCommandLineArgs();
  
  console.log('\n=== Google Trends Scraper with OCR Analysis ===\n');
  console.log(`Using keyword file: ${keywordsFile}`);
  console.log(`Using output directory: ${outputDir}`);
  console.log(`Using date range: ${dateRange}`);
  console.log(`Screenshots per term: ${screenshotsPerTerm}`);
  console.log(`Invalid screenshot handling: Deleting all non-chart screenshots (Oops, errors, no_data, etc.)`);
  console.log(`Max retries per screenshot: ${MAX_RETRIES}`);
  
  if (explode) {
    console.log(`Keyword decomposition: ENABLED (generating all subsequences)`);
  } else {
    console.log(`Keyword decomposition: DISABLED (using exact keywords only)`);
  }
  
  if (onlyKeepLast && screenshotsPerTerm > 1) {
    console.log(`Mode: Only keeping last successful screenshot per term (disk space optimized)`);
  }
  
  if (switchUaOnFailOnly) {
    console.log(`UA switching mode: CONSERVATIVE (only on block/pause, not periodic rotation)`);
  } else {
    console.log(`UA switching mode: NORMAL (rotating every 15-30 requests)`);
  }
  
  if (region) {
    console.log(`Region: ${region} - ${GEO_PICKER[region] || 'Unknown'}`);
  } else {
    console.log(`Region: Worldwide (no geo-restriction)`);
  }
  console.log(`Category: ${category} - ${CATEGORIES[category] || 'Unknown'}`);
  
  const hasTesseract = await checkTesseract();
  if (!hasTesseract) {
    console.error('⚠️  Tesseract OCR is not installed!');
    console.error('Please install tesseract:');
    console.error('  macOS: brew install tesseract');
    console.error('  Ubuntu: sudo apt-get install tesseract-ocr');
  } else {
    console.log('✓ Tesseract OCR found');
  }
  
  const compoundKeywords = await loadKeywords(keywordsFile);
  const userAgents = await loadUserAgents();
  console.log(`Loaded ${compoundKeywords.length} compound keywords from ${keywordsFile}`);
  console.log(`Loaded ${userAgents.length} user agents from ${USER_AGENTS_FILE}`);
  
  // Create output directory
  try {
    await fs.mkdir(outputDir, { recursive: true });
    console.log(`Output directory ready: ${outputDir}`);
  } catch (err) {
    console.error(`Failed to create output directory ${outputDir}:`, err.message);
    process.exit(1);
  }
  
  const browser = await puppeteer.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  
  await initializeCleanSession(page);
  
  console.log('\n=== Generating search terms ===');
  const allSearchTerms = generateSearchTerms(compoundKeywords, explode);
  
  console.log(`  Generated ${allSearchTerms.size} total search terms from ${compoundKeywords.length} ${explode ? 'compound' : 'exact'} keyword(s)`);
  
  let searchTermsList = Array.from(allSearchTerms);
  console.log(`\n📊 ${searchTermsList.length} unique search terms total.`);
  
  searchTermsList = shuffleArray(searchTermsList);
  console.log(`🔀 Randomized the order of ${searchTermsList.length} search terms.`);
  
  // Initialize user agent handling
  let requestsSinceLastRotation = 0;
  let requestsUntilNextRotation = switchUaOnFailOnly ? Infinity : randomInt(15, 30);
  let currentUserAgent = userAgents[Math.floor(Math.random() * userAgents.length)];
  await page.setUserAgent(currentUserAgent);
  console.log(`Initial user agent: ${currentUserAgent.substring(0, 60)}...`);
  if (switchUaOnFailOnly) {
    console.log(`Conservative UA mode active: User agent will only change when a block triggers the 10-minute pause.`);
  }
  
  let totalScreenshots = 0;
  let totalValid = 0;
  let totalDeleted = 0;
  let totalSuccess = 0;
  let totalNoData = 0;
  let totalRateLimited = 0;
  let totalCaptcha = 0;
  let totalError = 0;
  let consecutiveBlocks = 0;
  let processedCount = 0;
  let totalPreviousDeleted = 0;
  
  console.log('\n=== Processing search terms ===\n');
  
  for (const term of searchTermsList) {
    if (processedTerms.has(term)) continue;
    
    processedCount++;
    console.log(`\n[${processedCount}/${searchTermsList.length}] Term: "${term}"`);
    console.log(`  Taking ${screenshotsPerTerm} screenshot(s)`);
    
    let lastSuccessfulPath = null;
    
    for (let screenshotIdx = 1; screenshotIdx <= screenshotsPerTerm; screenshotIdx++) {
      console.log(`\n  --- Screenshot ${screenshotIdx}/${screenshotsPerTerm} ---`);
      
      // Only rotate user agent based on request count if NOT in conservative mode
      if (!switchUaOnFailOnly && requestsSinceLastRotation >= requestsUntilNextRotation) {
        const newAgent = userAgents[Math.floor(Math.random() * userAgents.length)];
        await page.setUserAgent(newAgent);
        console.log(`  Rotated user agent (after ${requestsSinceLastRotation} requests)`);
        requestsSinceLastRotation = 0;
        requestsUntilNextRotation = randomInt(15, 30);
      }
      
      const previousPath = (onlyKeepLast && lastSuccessfulPath) ? lastSuccessfulPath : null;
      
      let result;
      let pageNeedsReinit = false;
      
      try {
        result = await screenshotAndAnalyze(page, term, screenshotIdx, screenshotsPerTerm, dateRange, region, category, outputDir, previousPath);
      } catch (error) {
        if (error.message === 'PAGE_STATE_CORRUPTED' || 
            error.message.includes('Session closed') ||
            error.message.includes('Target closed')) {
          console.log(`  Page state corrupted. Reinitializing session...`);
          pageNeedsReinit = true;
          
          // Try to recover by reinitializing the session
          try {
            await initializeCleanSession(page);
            console.log(`  Session reinitialized successfully, retrying screenshot...`);
            result = await screenshotAndAnalyze(page, term, screenshotIdx, screenshotsPerTerm, dateRange, region, category, outputDir, previousPath);
          } catch (retryError) {
            console.error(`  Failed to recover after page corruption: ${retryError.message}`);
            throw retryError;
          }
        } else {
          throw error;
        }
      }
      
      totalScreenshots++;
      if (!switchUaOnFailOnly && !pageNeedsReinit) {
        requestsSinceLastRotation++;
      } else if (pageNeedsReinit) {
        // Reset counter after reinitialization
        requestsSinceLastRotation = 0;
      }
      
      if (result.deleted) {
        // Screenshot was deleted because it was invalid
        if (result.analysis.type === 'no_data') {
          totalNoData++;
        } else if (result.analysis.type === 'error') {
          totalError++;
        } else if (result.analysis.type === 'rate_limited') {
          totalRateLimited++;
        } else if (result.analysis.type === 'captcha') {
          totalCaptcha++;
        }
        totalDeleted++;
        console.log(`  🗑️ Screenshot deleted (${result.analysis.type} - no chart data)`);
      } else {
        // Valid screenshot kept
        totalValid++;
        if (result.analysis.type === 'success') {
          totalSuccess++;
          consecutiveBlocks = 0;
          console.log(`  ✓ Valid chart screenshot kept!`);
          if (onlyKeepLast && screenshotsPerTerm > 1) {
            if (lastSuccessfulPath && lastSuccessfulPath !== result.screenshotPath) {
              totalPreviousDeleted++;
            }
            lastSuccessfulPath = result.screenshotPath;
          }
        }
      }
      
      // Handle blocking conditions (still need to pause even if screenshots were deleted)
      if (result.analysis.type === 'captcha') {
        consecutiveBlocks++;
        console.log(`  ⚠ CAPTCHA detected (block #${consecutiveBlocks})`);
        if (consecutiveBlocks >= 2) {
          await clearAllStorage(page);
          await pauseWithNotification(BLOCK_PAUSE_MS, 'Two consecutive CAPTCHAs detected');
          
          // In conservative mode, rotate user agent on failure
          if (switchUaOnFailOnly) {
            const newAgent = userAgents[Math.floor(Math.random() * userAgents.length)];
            await page.setUserAgent(newAgent);
            console.log(`  Rotated user agent after block (conservative mode): ${newAgent.substring(0, 60)}...`);
          } else {
            const newAgent = userAgents[Math.floor(Math.random() * userAgents.length)];
            await page.setUserAgent(newAgent);
            console.log(`  Rotated user agent after block: ${newAgent.substring(0, 60)}...`);
          }
          
          requestsSinceLastRotation = 0;
          if (!switchUaOnFailOnly) {
            requestsUntilNextRotation = randomInt(15, 30);
          }
          await reinitializeSession(page);
          consecutiveBlocks = 0;
        }
      } else if (result.analysis.type === 'rate_limited') {
        consecutiveBlocks++;
        console.log(`  ⚠ Rate limited (block #${consecutiveBlocks})`);
        if (consecutiveBlocks >= 2) {
          await clearAllStorage(page);
          await pauseWithNotification(BLOCK_PAUSE_MS, 'Two consecutive rate limits detected');
          
          // In conservative mode, rotate user agent on failure
          if (switchUaOnFailOnly) {
            const newAgent = userAgents[Math.floor(Math.random() * userAgents.length)];
            await page.setUserAgent(newAgent);
            console.log(`  Rotated user agent after block (conservative mode): ${newAgent.substring(0, 60)}...`);
          } else {
            const newAgent = userAgents[Math.floor(Math.random() * userAgents.length)];
            await page.setUserAgent(newAgent);
            console.log(`  Rotated user agent after block: ${newAgent.substring(0, 60)}...`);
          }
          
          requestsSinceLastRotation = 0;
          if (!switchUaOnFailOnly) {
            requestsUntilNextRotation = randomInt(15, 30);
          }
          await reinitializeSession(page);
          consecutiveBlocks = 0;
        }
      } else if (result.analysis.type === 'error') {
        consecutiveBlocks++;
        console.log(`  ⚠ Error detected (block #${consecutiveBlocks})`);
        if (consecutiveBlocks >= 2) {
          await clearAllStorage(page);
          await pauseWithNotification(BLOCK_PAUSE_MS, 'Two consecutive errors detected');
          
          // In conservative mode, rotate user agent on failure
          if (switchUaOnFailOnly) {
            const newAgent = userAgents[Math.floor(Math.random() * userAgents.length)];
            await page.setUserAgent(newAgent);
            console.log(`  Rotated user agent after block (conservative mode): ${newAgent.substring(0, 60)}...`);
          } else {
            const newAgent = userAgents[Math.floor(Math.random() * userAgents.length)];
            await page.setUserAgent(newAgent);
            console.log(`  Rotated user agent after block: ${newAgent.substring(0, 60)}...`);
          }
          
          requestsSinceLastRotation = 0;
          if (!switchUaOnFailOnly) {
            requestsUntilNextRotation = randomInt(15, 30);
          }
          await reinitializeSession(page);
          consecutiveBlocks = 0;
        }
      } else if (result.analysis.type === 'no_data') {
        consecutiveBlocks = 0;
      } else if (result.analysis.type === 'success') {
        consecutiveBlocks = 0;
      }
      
      if (screenshotIdx < screenshotsPerTerm) {
        const intraTermDelay = randomInt(1000, 3000);
        console.log(`  Waiting ${intraTermDelay}ms...`);
        await sleep(intraTermDelay);
      }
    }
    
    processedTerms.add(term);
    
    const interTermDelay = randomInt(2000, 5000);
    console.log(`\n  Waiting ${interTermDelay}ms before next term...`);
    await sleep(interTermDelay);
  }
  
  await browser.close();
  
  console.log(`\n========== SUMMARY ==========`);
  console.log(`Total unique search terms generated: ${searchTermsList.length}`);
  console.log(`Total search terms processed: ${processedTerms.size}`);
  console.log(`Total screenshots taken: ${totalScreenshots}`);
  console.log(`  - Valid screenshots kept (with chart): ${totalValid}`);
  console.log(`  - Invalid screenshots deleted: ${totalDeleted}`);
  console.log(`    * No data/Oops errors: ${totalNoData}`);
  console.log(`    * Server errors: ${totalError}`);
  console.log(`    * Rate limited: ${totalRateLimited}`);
  console.log(`    * CAPTCHA: ${totalCaptcha}`);
  if (onlyKeepLast && screenshotsPerTerm > 1) {
    console.log(`  - Previous screenshots deleted (only-keep-last): ${totalPreviousDeleted}`);
    console.log(`  - Final screenshots remaining: ${totalValid - totalPreviousDeleted}`);
  }
  console.log(`==============================\n`);
}

main().catch(console.error);
