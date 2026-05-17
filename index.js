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
const OUTPUT_DIR = './output';
const KEYWORDS_FILE = './keywords.json';
const USER_AGENTS_FILE = './user-agents.json';
const BLOCK_PAUSE_MS = 10 * 60 * 1000; // 10 minutes

// Global set to remember all search terms that have been processed
const processedTerms = new Set();

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
async function loadKeywords() {
  try {
    const data = await fs.readFile(KEYWORDS_FILE, 'utf8');
    const keywords = JSON.parse(data);
    if (!Array.isArray(keywords)) {
      throw new Error('JSON file must contain an array of strings.');
    }
    return keywords;
  } catch (error) {
    console.error(`Failed to load keywords from ${KEYWORDS_FILE}:`, error.message);
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
      console.log(`  Pattern detected: rate_limited (429/rate limit)`);
      return { type: 'rate_limited', blocked: true };
    } else if (hasCaptcha) {
      console.log(`  Pattern detected: captcha`);
      return { type: 'captcha', blocked: true };
    } else if (hasNoData) {
      console.log(`  Pattern detected: no_data (no data or Oops)`);
      return { type: 'no_data', blocked: false };
    } else if (hasChart) {
      console.log(`  Pattern detected: success (chart data found)`);
      return { type: 'success', blocked: false };
    } else {
      if (text.includes('500') || text.includes('502') || text.includes('503') || text.includes('504')) {
        console.log(`  Pattern detected: error (server error)`);
        return { type: 'error', blocked: true };
      }
      console.log(`  Pattern detected: unknown (defaulting to no_data)`);
      return { type: 'no_data', blocked: false };
    }
    
  } catch (error) {
    console.error(`  Screenshot analysis failed: ${error.message}`);
    return { type: 'error', blocked: true };
  }
}

/**
 * Clear ALL browser storage (cookies, localStorage, sessionStorage, cache)
 */
async function clearAllStorage(page) {
  try {
    console.log('  Clearing ALL browser storage...');
    
    // Clear all cookies
    const cookies = await page.cookies();
    for (const cookie of cookies) {
      await page.deleteCookie(cookie);
    }
    console.log(`    Deleted ${cookies.length} cookies`);
    
    // Clear cache using CDP (this works without permission issues)
    const client = await page.target().createCDPSession();
    await client.send('Network.clearBrowserCookies');
    await client.send('Network.clearBrowserCache');
    console.log('    Cleared browser cache and remaining cookies');
    
    // Try to clear localStorage/sessionStorage, but don't fail if access is denied
    try {
      await page.evaluate(() => {
        if (window.localStorage) {
          localStorage.clear();
        }
        if (window.sessionStorage) {
          sessionStorage.clear();
        }
      });
      console.log('    Cleared localStorage and sessionStorage');
    } catch (storageError) {
      // This is expected for pages like chrome:// or about:blank
      console.log('    Note: localStorage/sessionStorage not accessible (normal for some pages)');
    }
    
  } catch (error) {
    console.warn('  Failed to clear some storage items:', error.message);
  }
}

/**
 * Reinitialize session by visiting trends.google.com without taking screenshot
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
 * Initialize clean session at start (without screenshot)
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
 * Takes a screenshot and analyzes it
 */
async function screenshotAndAnalyze(page, term, timestamp) {
  const encodedTerm = encodeURIComponent(term);
  const url = `https://trends.google.com/trends/explore?date=today%201-m&q=${encodedTerm}&hl=en-US`;
  
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
  } catch (error) {
    console.error(`Navigation error: ${error.message}`);
    statusText = error.message;
  }
  
  await sleep(3000);
  
  const safeTerm = sanitizeFilename(term);
  const timestampForFile = getTimestamp();
  const filename = `${safeTerm}_${timestampForFile}_pending_${statusCode}.jpg`;
  const filepath = path.join(OUTPUT_DIR, filename);
  
  await page.screenshot({ path: filepath, type: 'jpeg', quality: 80 });
  console.log(`Screenshot saved: ${filepath} (Status: ${statusCode} ${statusText})`);
  
  const analysis = await analyzeScreenshot(filepath);
  
  const finalFilename = `${safeTerm}_${timestampForFile}_${analysis.type}_${statusCode}.jpg`;
  const finalFilepath = path.join(OUTPUT_DIR, finalFilename);
  await fs.rename(filepath, finalFilepath);
  console.log(`  Renamed to: ${finalFilename}`);
  
  return {
    screenshotPath: finalFilepath,
    analysis: analysis,
    statusCode: statusCode
  };
}

/**
 * Pause execution for a specified duration with TTS notification
 */
async function pauseWithNotification(ms, reason) {
  const minutes = ms / 1000 / 60;
  const message = `Shit, we've been blocked. Please rotate your IP address.`;
  
  console.log(`\n*** ${reason} - ${message} ***`);
  console.log(`*** Pausing for ${minutes} minutes (${ms / 1000} seconds) ***\n`);
  
  // Text-to-speech notification
  say(message);
  
  await sleep(ms);
}

/**
 * Main entry point
 */
async function main() {
  console.log('=== Google Trends Scraper with OCR Analysis ===\n');
  
  const hasTesseract = await checkTesseract();
  if (!hasTesseract) {
    console.error('⚠️  Tesseract OCR is not installed!');
    console.error('Please install tesseract:');
    console.error('  macOS: brew install tesseract');
    console.error('  Ubuntu: sudo apt-get install tesseract-ocr');
    console.error('  Windows: Download from https://github.com/UB-Mannheim/tesseract/wiki');
    console.error('\nContinuing without OCR analysis (will use simple pattern matching)...');
  } else {
    console.log('✓ Tesseract OCR found');
  }
  
  const compoundKeywords = await loadKeywords();
  const userAgents = await loadUserAgents();
  console.log(`Loaded ${compoundKeywords.length} compound keywords from ${KEYWORDS_FILE}`);
  console.log(`Loaded ${userAgents.length} user agents from ${USER_AGENTS_FILE}`);
  
  await fs.mkdir(OUTPUT_DIR, { recursive: true });
  console.log(`Output directory ready: ${OUTPUT_DIR}`);
  
  const browser = await puppeteer.launch({ 
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage'
    ]
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  
  await initializeCleanSession(page);
  
  console.log('\n=== Generating all search terms from compound keywords ===');
  const allSearchTerms = new Set();
  
  for (const keyword of compoundKeywords) {
    const subsequences = generateAllSubsequences(keyword);
    // Silently add to set without logging each one
    subsequences.forEach(term => allSearchTerms.add(term));
  }
  
  console.log(`  Generated ${allSearchTerms.size} total search terms from ${compoundKeywords.length} compound keywords`);
  
  let searchTermsList = Array.from(allSearchTerms);
  console.log(`\n📊 Generated ${searchTermsList.length} unique search terms total.`);
  
  searchTermsList = shuffleArray(searchTermsList);
  console.log(`🔀 Randomized the order of ${searchTermsList.length} search terms.`);
  
  let requestsSinceLastRotation = 0;
  let requestsUntilNextRotation = randomInt(15, 30);
  let currentUserAgent = userAgents[Math.floor(Math.random() * userAgents.length)];
  await page.setUserAgent(currentUserAgent);
  console.log(`Initial user agent: ${currentUserAgent.substring(0, 60)}...`);
  
  let totalScreenshots = 0;
  let totalSuccess = 0;
  let totalNoData = 0;
  let totalRateLimited = 0;
  let totalCaptcha = 0;
  let totalError = 0;
  let consecutiveBlocks = 0;
  let processedCount = 0;
  
  console.log('\n=== Processing search terms in randomized order ===');
  
  for (const term of searchTermsList) {
    if (processedTerms.has(term)) {
      continue;
    }
    
    processedCount++;
    console.log(`\n[${processedCount}/${searchTermsList.length}] Processing term: "${term}"`);
    
    if (requestsSinceLastRotation >= requestsUntilNextRotation) {
      const newAgent = userAgents[Math.floor(Math.random() * userAgents.length)];
      await page.setUserAgent(newAgent);
      console.log(`  Rotated user agent (after ${requestsSinceLastRotation} requests). New agent: ${newAgent.substring(0, 60)}...`);
      requestsSinceLastRotation = 0;
      requestsUntilNextRotation = randomInt(15, 30);
    }
    
    const result = await screenshotAndAnalyze(page, term, getTimestamp());
    totalScreenshots++;
    requestsSinceLastRotation++;
    
    if (result.analysis.type === 'success') {
      totalSuccess++;
      consecutiveBlocks = 0;
      console.log(`  ✓ Success! Chart loaded.`);
      processedTerms.add(term);
    } else if (result.analysis.type === 'no_data') {
      totalNoData++;
      consecutiveBlocks = 0;
      console.log(`  ℹ No data available or Oops error - valid response.`);
      processedTerms.add(term);
    } else if (result.analysis.type === 'captcha') {
      totalCaptcha++;
      consecutiveBlocks++;
      console.log(`  ⚠ CAPTCHA detected! This is consecutive block #${consecutiveBlocks}`);
      
      if (consecutiveBlocks >= 2) {
        // Clear ALL storage
        await clearAllStorage(page);
        
        // Pause with TTS notification
        await pauseWithNotification(BLOCK_PAUSE_MS, 'Two consecutive CAPTCHAs detected');
        
        // Rotate user agent
        const newAgent = userAgents[Math.floor(Math.random() * userAgents.length)];
        await page.setUserAgent(newAgent);
        console.log(`  New user agent after pause: ${newAgent.substring(0, 60)}...`);
        requestsSinceLastRotation = 0;
        requestsUntilNextRotation = randomInt(15, 30);
        
        // Re-initialize session by visiting trends.google.com (no screenshot)
        await reinitializeSession(page);
        
        consecutiveBlocks = 0;
      }
      processedTerms.add(term);
    } else if (result.analysis.type === 'rate_limited') {
      totalRateLimited++;
      consecutiveBlocks++;
      console.log(`  ⚠ Rate limited (429)! This is consecutive block #${consecutiveBlocks}`);
      
      if (consecutiveBlocks >= 2) {
        // Clear ALL storage
        await clearAllStorage(page);
        
        // Pause with TTS notification
        await pauseWithNotification(BLOCK_PAUSE_MS, 'Two consecutive rate limits detected');
        
        // Rotate user agent
        const newAgent = userAgents[Math.floor(Math.random() * userAgents.length)];
        await page.setUserAgent(newAgent);
        console.log(`  New user agent after pause: ${newAgent.substring(0, 60)}...`);
        requestsSinceLastRotation = 0;
        requestsUntilNextRotation = randomInt(15, 30);
        
        // Re-initialize session by visiting trends.google.com (no screenshot)
        await reinitializeSession(page);
        
        consecutiveBlocks = 0;
      }
      processedTerms.add(term);
    } else {
      totalError++;
      consecutiveBlocks++;
      console.log(`  ✗ Error page detected! This is consecutive block #${consecutiveBlocks}`);
      
      if (consecutiveBlocks >= 2) {
        // Clear ALL storage
        await clearAllStorage(page);
        
        // Pause with TTS notification
        await pauseWithNotification(BLOCK_PAUSE_MS, 'Two consecutive errors detected');
        
        // Rotate user agent
        const newAgent = userAgents[Math.floor(Math.random() * userAgents.length)];
        await page.setUserAgent(newAgent);
        requestsSinceLastRotation = 0;
        requestsUntilNextRotation = randomInt(15, 30);
        
        // Re-initialize session by visiting trends.google.com (no screenshot)
        await reinitializeSession(page);
        
        consecutiveBlocks = 0;
      }
      processedTerms.add(term);
    }
    
    const delay = randomInt(2000, 5000);
    console.log(`  Waiting ${delay}ms before next request...`);
    await sleep(delay);
  }
  
  await browser.close();
  console.log(`\n========== SUMMARY ==========`);
  console.log(`Total unique search terms generated: ${searchTermsList.length}`);
  console.log(`Total search terms processed: ${processedTerms.size}`);
  console.log(`Total screenshots taken: ${totalScreenshots}`);
  console.log(`  - Successful pages (with chart): ${totalSuccess}`);
  console.log(`  - No data / Oops errors: ${totalNoData}`);
  console.log(`  - Rate limited (429): ${totalRateLimited}`);
  console.log(`  - CAPTCHA pages: ${totalCaptcha}`);
  console.log(`  - Other errors: ${totalError}`);
  console.log(`==============================\n`);
}

main().catch(console.error);
