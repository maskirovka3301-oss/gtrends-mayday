# GTRENDS-MAYDAY - Algorithmic Manipulation Detection & Forensic Screenshot Collection Tool

![Logo](logo.jpg)

## Description

Automated headless browser tool for systematic Google Trends screenshot collection across semantic gradients, originally designed to test the algorithmic pruning hypothesis following the April 29, 2026 whistleblower disclosure to the Defense Intelligence Agency. Generates structured screenshot datasets compatible with [GTRENDS-OCR](https://github.com/maskirovka3301-oss/gtrends-ocr) for time-series extraction and statistical decomposition of search trend anomalies.

**This project supports independent forensic research into platform-level query suppression mechanisms.**

### Research Background

Following a whistleblower call to the Defense Intelligence Agency on April 29, 2026, alleging NATO involvement in "Havana syndrome" through a 5G-integrated directed-energy mechanism, platform-level pruning mechanisms appear to have been rapidly deployed on May 1, 2026—strategically implemented before the weekend and the start of the new month—to suppress search visibility for semantically proximate terms.

![Chart](literature/chart.png)

This tool enables systematic collection of search trend data to test the pruning hypothesis using linear compositional decomposition:

$$T_{AB}(t) \approx \alpha T_A(t) + \beta T_B(t) + \epsilon(t)$$

Where:
- $T_{AB}(t)$ = Combined phrase search index
- $T_A(t), T_B(t)$ = Component term indices  
- $\alpha, \beta$ = Pruning/amplification weights
- $\epsilon(t)$ = Residual variance (noise, privacy injection, aliasing, event leakage)

Pruning is inferred when $\alpha \ll 1$ or $\beta \ll 1$ (asymmetric term suppression). Invalid weights ($\alpha, \beta \notin [0,1]$) suggest amplification or non-compositional behavior requiring bounded-weight modeling.

## General-Purpose Google Trends Data Collection

Beyond pruning detection, this tool has been extended into a **general-purpose, high-resolution Google Trends screenshot collector** capable of capturing data across all supported URL parameters. This enables:

### High-Resolution Temporal Sampling

- **Cron-Driven Continuous Recording**: Configure a crontab (or any scheduler) to run this tool at any interval—hourly, daily, weekly, or custom—with any parameter settings for continuous, long-term recording of Google Trends data
- **Automated Recurring Collection**: Set and forget data collection that builds comprehensive historical archives without manual intervention
- **Retrospective Reconstruction**: Build complete, high-resolution trend lines over months or years by stitching together thousands of screenshots taken at scheduled intervals
- **Disk Space Optimization**: Use `--only-keep-last` to retain only the most recent screenshot per term during high-frequency sampling, dramatically reducing storage requirements
- **Automatic Invalid Screenshot Deletion**: Screenshots containing "Oops" errors, "doesn't have enough data" messages, server errors, or any non-chart content are automatically deleted, ensuring only valid chart data is retained

### Comparative Analysis Capabilities

- **True Trend Line Reconstruction**: By capturing screenshots at scheduled high frequency (e.g., every hour via cron), you can reconstruct the actual trend trajectory before Google applies:
  - Data pruning (removing historical spikes)
  - Normalization shifts (rebaselining after events)
  - Privacy injection (adding noise to obscure low-volume terms)
  
- **Platform vs. Reality Comparison**: Compare your high-resolution collected data against Google's lower-resolution published views (weekly, monthly, quarterly) to detect:
  - When pruning occurs (immediate vs. delayed)
  - Magnitude of suppression (percentage of original volume)
  - Temporal patterns (weekend deployments, month-boundary resets)

- **Multi-Resolution Validation**: Google Trends displays different resolutions depending on selected time range:
  - Past 7 days: Hourly data points
  - Past 90 days: Daily data points  
  - Past 5 years: Weekly data points
  
  By capturing the highest available resolution at each interval, you can detect anomalies invisible in lower-resolution views.

### Anti-Detection, Block Handling & Resilience

The tool implements multiple layers of evasion and robust error recovery to ensure long-running stability:

- **User Agent Management**: Two modes available (see below)
- **Search Term Randomization**: Shuffles the order of all search terms to avoid predictable request patterns
- **Session Freshness**: Clears all browser storage (cookies, localStorage, cache) when blocks are detected
- **Intelligent Delays**: Configurable delays (2-5 seconds) between requests to avoid triggering rate limits
- **Automatic Retry Logic**: Built-in retry mechanism (3 attempts) for transient errors like frame detachment or session closure, preventing crashes during extended runs.
- **Session State Recovery**: If the browser page becomes corrupted, the tool automatically reinitializes the session and retries the failed operation.

#### User Agent Rotation Modes

The tool offers two user agent management strategies:

**Normal Mode (default):**
- Automatically cycles through 15-99 different user agents at random intervals (15-30 requests per agent)
- Aggressive fingerprint changing for maximum stealth
- Best for short to medium duration collections

**Conservative Mode (`--switch-ua-on-fail-only`):**
- Uses the same user agent indefinitely during normal operation
- Only rotates user agent when a block triggers the 10-minute pause
- Preserves IP reputation by maintaining a consistent browser fingerprint
- Ideal for long-running, continuous collections (e.g., cron jobs running for months)
- Reduces risk of triggering rate limits from too-frequent user agent changes

**When blocks do occur (rare due to the above measures), the tool triggers:**

- **10-Minute Cooldown Pause**: Automatically pauses all activity for 10 minutes
- **Text-to-Speech Audio Alert**: Your computer speaks "Shit, we've been blocked. Please rotate your IP address." to attract your attention
- **Manual VPN Intervention Required**: The audio alert prompts you to manually change your VPN location to obtain a new IP address
- **Automatic Session Reset**: After the cooldown, the tool automatically clears storage, rotates user agent (regardless of mode), and re-initializes the session before resuming

**Why blocks are rare in practice:**
- The combination of user agent management, randomized term order, and session clearing mimics organic traffic patterns
- Blocks typically only occur after thousands of consecutive requests to the same Google Trends endpoint
- When blocks do happen, the audio alert ensures you can quickly intervene by changing VPN location, minimizing data collection interruptions

### Supported Google Trends Parameters

The tool now supports **all major Google Trends URL parameters**:

| Parameter | Options | Purpose |
|-----------|---------|---------|
| `--date` | 9 presets + custom range | Define temporal window (past hour to 5 years) |
| `--region` | 247 country codes | Geo-target to specific countries (default: worldwide) |
| `--category` | 7 categories | Filter by topic (Business, Health, Sci/Tech, etc.) |
| `--screenshots-per-term` | 1-∞ | High-frequency sampling (e.g., 30 screenshots hourly) |
| `--output-dir` | Custom path | Specify output directory for screenshots |
| `--only-keep-last` | Flag | Keep only the last successful screenshot per term (disk space optimization) |
| `--explode` | Flag | Decompose keywords into all non-empty subsequences (order preserved) |
| `--switch-ua-on-fail-only` | Flag | Only switch user agent when a block triggers the 10-minute pause |

### Keyword Decomposition Behavior

The tool offers two modes for processing keywords:

**Without `--explode` (default):**
- Uses only the exact keyword strings as provided in the keywords file
- Ideal for targeted searches where you only want specific phrases
- Generates fewer total search terms

**With `--explode`:**
- Decomposes each compound keyword into all non-empty subsequences while preserving word order
- Example: `"climate change policy"` → `"climate"`, `"change"`, `"policy"`, `"climate change"`, `"climate policy"`, `"change policy"`, `"climate change policy"`
- Useful for semantic gradient analysis and testing compositional relationships
- Generates significantly more search terms for comprehensive coverage

### Automatic Invalid Screenshot Deletion

The tool automatically analyzes every screenshot using OCR and **only keeps screenshots that contain valid chart data**:

| Screenshot Type | Action | Reason |
|----------------|--------|--------|
| `success` (chart data) | **KEPT** | Valid chart with "interest over time" or trend patterns |
| `no_data` ("Oops", "doesn't have enough data") | **DELETED** | No chart data available for this term |
| `error` (HTTP 4xx/5xx) | **DELETED** | Server error or unexpected content |
| `rate_limited` (429) | **DELETED** | Rate limiting response (pause and retry) |
| `captcha` | **DELETED** | Anti-bot challenge (pause and rotate IP) |
| `unknown` | **DELETED** | Unrecognized content, treated as invalid |

This ensures your output directory contains **only valid chart screenshots** ready for OCR processing with GTRENDS-OCR.

### Usage

```bash
# Install dependencies
npm install

# Basic usage with default settings (worldwide data, exact keywords only)
npm start

# General-purpose data collection examples

# Capture worldwide data for past 90 days (exact keywords only)
node index.js --date "Past 90 days"

# Capture US data with keyword decomposition (generates all subsequences)
node index.js --region US --date "Past 90 days" --explode

# High-resolution hourly sampling with disk space optimization
node index.js --screenshots-per-term 30 --date "Past hour" --only-keep-last

# Conservative user agent mode for long-running collections
node index.js --switch-ua-on-fail-only --date "Past 90 days"

# Daily reconstruction with conservative UA switching
node index.js --region DE --category t --date "Past 7 days" --screenshots-per-term 7 --switch-ua-on-fail-only

# Monthly trend analysis for Japanese entertainment queries
node index.js --region JP --category e --date "Past 12 months" --screenshots-per-term 12

# Custom output directory for organized storage
node index.js --output-dir ./data/us_2024 --region US --date "Past 90 days"

# Complete forensic configuration with decomposition and conservative UA
node index.js --keyword-file ./forensic-terms.json --output-dir ./forensic_data --region US --category b --date "Past 5 years" --screenshots-per-term 60 --only-keep-last --explode --switch-ua-on-fail-only

# Custom date range for specific event analysis
node index.js --region GB --date "2024-01-01 2024-12-31" --screenshots-per-term 24 --output-dir ./uk_2024
```

### Continuous Recording with Cron (Example)

Set up automated recurring data collection using crontab:

```bash
# Edit your crontab
crontab -e

# Example cron jobs for continuous Google Trends recording:

# Run every hour with conservative UA mode (recommended for long-running jobs)
0 * * * * cd /path/to/gtrends-mayday && node index.js --keyword-file ./monitor.json --date "Past hour" --screenshots-per-term 1 --only-keep-last --switch-ua-on-fail-only --output-dir ./hourly_data >> /var/log/gtrends.log 2>&1

# Run daily at midnight with decomposition for comprehensive coverage
0 0 * * * cd /path/to/gtrends-mayday && node index.js --keyword-file ./daily-terms.json --region GB --date "Past day" --explode --switch-ua-on-fail-only --output-dir ./daily_data >> /var/log/gtrends-daily.log 2>&1

# Run weekly on Sunday at 2 AM to capture weekly data
0 2 * * 0 cd /path/to/gtrends-mayday && node index.js --keyword-file ./weekly-terms.json --region DE --category t --date "Past 7 days" --screenshots-per-term 1 --output-dir ./weekly_data >> /var/log/gtrends-weekly.log 2>&1

# Run monthly on the 1st at 3 AM with decomposition
0 3 1 * * cd /path/to/gtrends-mayday && node index.js --keyword-file ./monthly-terms.json --region JP --category e --date "Past 30 days" --explode --switch-ua-on-fail-only --output-dir ./monthly_data >> /var/log/gtrends-monthly.log 2>&1

# High-frequency monitoring (every 6 hours) with disk space optimization
0 */6 * * * cd /path/to/gtrends-mayday && node index.js --keyword-file ./trending.json --region US --date "Past 4 hours" --screenshots-per-term 1 --only-keep-last --switch-ua-on-fail-only --output-dir ./high_freq_data >> /var/log/gtrends-6hour.log 2>&1
```

**With cron automation, you can:**
- Build years of uninterrupted historical trend data
- Detect exactly when pruning or manipulation occurs (down to the hour)
- Compare trends across multiple regions and categories simultaneously
- Create alerting systems when anomalies are detected in recurring collections
- Organize data by date/region/category using custom output directories
- Minimize disk usage with `--only-keep-last` for high-frequency sampling
- Automatically filter out invalid responses with built-in screenshot validation
- Maintain consistent browser fingerprinting with conservative UA mode

### Available Command Line Options

```
Options:
  --keyword-file <path>           Path to JSON file containing keywords array (default: ./keywords.json)
  --output-dir <path>             Output directory for screenshots (default: ./output)
  --date <range>                  Date range for Google Trends (default: "Past 30 days")
                                  Valid options:
                                    - "Past hour" (now 1-H)
                                    - "Past 4 hours" (now 4-H)
                                    - "Past day" (now 1-d)
                                    - "Past 7 days" (now 7-d)
                                    - "Past 30 days" (today 1-m)
                                    - "Past 90 days" (today 3-m)
                                    - "Past 12 months" (today 12-m)
                                    - "Past 5 years" (today 5-y)
                                    - "2024-present" (all)
                                  Or custom range: "YYYY-MM-DD YYYY-MM-DD"
  --screenshots-per-term <number> Number of screenshots to take per search term (default: 1)
                                  For high-resolution temporal sampling, use values 10-60
  --region <code>                 Country code for geo-targeting (default: worldwide if not specified)
                                  Supports 247 country codes (see complete list below)
  --category <code>               Category filter for trends (default: all)
                                  Valid options:
                                    - all = All categories
                                    - b = Business
                                    - e = Entertainment
                                    - m = Health
                                    - t = Sci/Tech
                                    - s = Sports
                                    - h = Top stories
  --only-keep-last                When using --screenshots-per-term > 1, only keep the last successful
                                  screenshot for each term and delete previous ones
  --explode                       Decompose keywords into all non-empty subsequences (order preserved)
                                  When not specified, only the exact keyword strings are used
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
  
  # Cross-regional comparison with organized output
  node index.js --region GB --category t --date "Past 90 days" --output-dir ./uk_tech
  node index.js --region DE --category t --date "Past 90 days" --output-dir ./de_tech
  node index.js --region JP --category t --date "Past 90 days" --output-dir ./jp_tech
  
  # Event-specific timeline reconstruction with auto-cleanup, decomposition, and conservative UA
  node index.js --region US --date "2026-04-01 2026-05-31" --screenshots-per-term 30 --only-keep-last --explode --switch-ua-on-fail-only --output-dir ./event_analysis
```

### Country Codes (247 Supported)

Complete list available in the tool's help or source code. Major codes include:

```
US = United States
GB = United Kingdom
DE = Germany
FR = France
JP = Japan
CN = China
RU = Russia
IN = India
BR = Brazil
CA = Canada
AU = Australia
... (all 247 ISO country codes)
```

### Prerequisites

```bash
# Install Tesseract OCR for screenshot analysis
# macOS:
brew install tesseract

# Ubuntu/Debian:
sudo apt-get install tesseract-ocr

# Verify installation
tesseract --version

# Install Node.js dependencies
npm install puppeteer-extra puppeteer-extra-plugin-stealth
```

### Configuration Files

**keywords.json** - Semantic gradient of term triplets for research, or any search terms for general use:

```json
[
  "directed energy weapon",
  "high power microwave",
  "quantum computing breakthrough",
  "climate change policy",
  "artificial intelligence regulation",
  "blockchain technology adoption"
]
```

**user-agents.json** - Browser user agents for rotation to avoid detection patterns:

```json
[
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/119.0.0.0 Safari/537.36"
]
```

### General Workflow Examples

#### Example 1: Basic Forensic Collection (Worldwide, Exact Keywords, Normal UA)
```
maskirovka@3301 % node index.js --keyword-file ./keywords.json --date "Past 90 days"

=== Google Trends Scraper with OCR Analysis ===

Using keyword file: ./keywords.json
Using output directory: ./output
Using date range: today 3-m
Screenshots per term: 1
Invalid screenshot handling: Deleting all non-chart screenshots (Oops, errors, no_data, etc.)
Max retries per screenshot: 3
Keyword decomposition: DISABLED (using exact keywords only)
UA switching mode: NORMAL (rotating every 15-30 requests)
Region: Worldwide (no geo-restriction)
Category: all - All categories
✓ Tesseract OCR found
Loaded 1082 compound keywords from ./keywords.json
Loaded 99 user agents from ./user-agents.json
Output directory ready: ./output

=== Generating search terms ===
  Using exact keywords only (no decomposition)...
  Generated 1082 total search terms from 1082 exact keyword(s)

📊 1082 unique search terms total.
🔀 Randomized the order of 1082 search terms.

[1/1082] Processing term: "directed energy weapon"
  --- Screenshot 1/1 ---
Navigating to: https://trends.google.com/trends/explore?date=today%203-m&q=directed%20energy%20weapon&hl=en-US
Screenshot saved: output/directed_energy_weapon_pending_200.jpg
  Analyzing screenshot with OCR...
  Pattern detected: success (keeping screenshot)
  Renamed to: directed_energy_weapon_05-17-2026_14-30-22_success_200.jpg
  ✓ Valid chart screenshot kept!

========== SUMMARY ==========
Total unique search terms generated: 1082
Total search terms processed: 1082
Total screenshots taken: 1082
  - Valid screenshots kept (with chart): 982
  - Invalid screenshots deleted: 100
    * No data/Oops errors: 85
    * Server errors: 10
    * Rate limited: 3
    * CAPTCHA: 2
==============================
```

#### Example 2: Long-Running Collection with Conservative UA Mode
```
maskirovka@3301 % node index.js --keyword-file "./monitor-terms.json" --date "Past day" --screenshots-per-term 1 --switch-ua-on-fail-only

=== Google Trends Scraper with OCR Analysis ===

Using date range: now 1-d
Screenshots per term: 1
Invalid screenshot handling: Deleting all non-chart screenshots (Oops, errors, no_data, etc.)
Keyword decomposition: DISABLED (using exact keywords only)
UA switching mode: CONSERVATIVE (only on block/pause, not periodic rotation)
Conservative UA mode active: User agent will only change when a block triggers the 10-minute pause.
Region: Worldwide (no geo-restriction)
Category: all - All categories

Initial user agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64)...
Conservative UA mode active: User agent will only change when a block triggers the 10-minute pause.

[1/50] Processing term: "AI regulation news"
  --- Screenshot 1/1 ---
  Pattern detected: success (keeping screenshot)
  ✓ Valid chart screenshot kept!

... (continues for thousands of requests with same user agent)

========== SUMMARY ==========
Total unique search terms generated: 50
Total search terms processed: 50
Total screenshots taken: 50
  - Valid screenshots kept (with chart): 48
  - Invalid screenshots deleted: 2
    * No data/Oops errors: 2
    * Server errors: 0
    * Rate limited: 0
    * CAPTCHA: 0
==============================
```

#### Example 3: Transient Error Recovery (Automatic Retry)
```
[2254/6600] Processing term: "dew"
  --- Screenshot 1/1 ---
Navigating to: https://trends.google.com/trends/explore?date=today%201-m&q=dew&hl=en-US
Navigation error: Navigating frame was detached
  Error during screenshot/analysis (attempt 1/3): Navigating frame was detached
  Retrying in 5 seconds...
Navigating to: https://trends.google.com/trends/explore?date=today%201-m&q=dew&hl=en-US
Screenshot saved: output/dew_pending_200.jpg
  Analyzing screenshot with OCR...
  Pattern detected: success (keeping screenshot)
  Renamed to: dew_05-20-2026_10-30-45_success_200.jpg
  ✓ Valid chart screenshot kept!
```

#### Example 4: High-Resolution Sampling with Disk Optimization and Decomposition
```
maskirovka@3301 % node index.js --keyword-file "./monitor-terms.json" --date "Past day" --screenshots-per-term 24 --only-keep-last --explode --switch-ua-on-fail-only

=== Google Trends Scraper with OCR Analysis ===

Using date range: now 1-d
Screenshots per term: 24
Invalid screenshot handling: Deleting all non-chart screenshots (Oops, errors, no_data, etc.)
Keyword decomposition: ENABLED (generating all subsequences)
Mode: Only keeping last successful screenshot per term (disk space optimized)
UA switching mode: CONSERVATIVE (only on block/pause, not periodic rotation)

=== Generating search terms ===
  Decomposing keywords into all subsequences...
  Generated 156 total search terms from 6 compound keyword(s)

[1/156] Processing term: "AI regulation news"
  Will take 24 screenshot(s) for this term
  
  --- Screenshot 1/24 ---
  Pattern detected: success (keeping screenshot)
  ✓ Valid chart screenshot kept!
  
  --- Screenshot 2/24 ---
  Pattern detected: success (keeping screenshot)
  Deleted previous screenshot: AI_regulation_news_1_05-17-2026_00-00-00_success_200.jpg
  ✓ Valid chart screenshot kept!
  
  --- Screenshot 3/24 ---
  Pattern detected: no_data (will be deleted)
  Deleted invalid screenshot (no_data)
  🗑️ Screenshot deleted (no_data - no chart data)
  
  --- Screenshot 4/24 ---
  Pattern detected: success (keeping screenshot)
  Deleted previous screenshot: AI_regulation_news_2_05-17-2026_01-00-01_success_200.jpg
  ✓ Valid chart screenshot kept!

========== SUMMARY ==========
Total unique search terms generated: 156
Total search terms processed: 156
Total screenshots taken: 3744
  - Valid screenshots kept (with chart): 2890
  - Invalid screenshots deleted: 854
    * No data/Oops errors: 720
    * Server errors: 89
    * Rate limited: 32
    * CAPTCHA: 13
  - Previous screenshots deleted (only-keep-last): 2734
  - Final screenshots remaining: 156
==============================
```

#### Example 5: Organized Multi-Region Collection with Exact Keywords
```
maskirovka@3301 % node index.js --region US --date "Past 90 days" --output-dir ./data/us --switch-ua-on-fail-only
maskirovka@3301 % node index.js --region GB --date "Past 90 days" --output-dir ./data/uk --switch-ua-on-fail-only
maskirovka@3301 % node index.js --region DE --date "Past 90 days" --output-dir ./data/germany --switch-ua-on-fail-only

# Results in organized directory structure:
# ./data/us/[only valid chart screenshots]
# ./data/uk/[only valid chart screenshots]
# ./data/germany/[only valid chart screenshots]
```

### How It Works

This tool implements a sophisticated, resilient scraping pipeline optimized for both pruning research and general-purpose data collection:

#### 1. Keyword Processing & Semantic Gradient Generation

- **Exact Mode (default)**: Uses only the exact keyword strings as provided in the keywords file
- **Explode Mode (`--explode`)**: Decomposes each compound keyword into all ordered subsequences (single words, bigrams, original phrase) to capture compositional dynamics
- **Deduplication & Randomization**: Unique search terms are shuffled to avoid predictable request patterns that could trigger rate limiting
- **Comprehensive Coverage**: Generates 5,000-7,000 unique search terms from 1,200+ triplets when using explode mode

#### 2. Stealth Browser Automation with Resilience

- **Puppeteer-Extra with Stealth Plugin**: Evades headless browser detection using multiple evasion techniques
- **User Agent Management**: Two modes available
  - **Normal**: Rotates every 15-30 requests for aggressive fingerprint changes
  - **Conservative (`--switch-ua-on-fail-only`)**: Maintains consistent fingerprint, only rotates on block
- **Session Freshness**: Clears all browser storage (cookies, localStorage, cache) before collection and during 10-minute cooldown periods
- **Intelligent Throttling**: Configurable delays (2-5 seconds) between requests to avoid triggering rate limits
- **Automatic Retry Logic**: The tool automatically retries failed operations (up to 3 times) for recoverable errors like `Navigating frame was detached` or `Session closed`, ensuring long-running stability.
- **Session State Recovery**: If the browser page becomes corrupted, the tool detects this, reinitializes a clean session, and retries the failed operation.

#### 3. Forensic Screenshot Validation & Auto-Deletion

Using Tesseract OCR, every screenshot is analyzed and **automatically deleted if invalid**:

| Category | Detection Pattern | Action |
|----------|-----------------|--------|
| `success` | Chart data with "interest over time" or "trend" | **KEPT** (renamed with `_success_`) |
| `no_data` | "doesn't have enough data", "Oops", "try a more general term" | **DELETED** |
| `captcha` | "suspicious traffic", "verify you're human" | **DELETED** |
| `rate_limited` | "429", "rate limit", "too many requests" | **DELETED** |
| `error` | HTTP 4xx/5xx or unexpected content | **DELETED** |

This ensures your output directory contains **only valid chart screenshots** ready for post-processing.

#### 4. High-Resolution Temporal Sampling Strategy

For general-purpose data collection, the `--screenshots-per-term` parameter enables:

- **Sequential Captures**: Takes N screenshots back-to-back for the same search term
- **Adaptive Delays**: Shorter delays between screenshots of same term (1-3 seconds) vs. different terms (2-5 seconds)
- **Timestamp Preservation**: Each screenshot includes precise timestamp for temporal alignment
- **Resolution Optimization**: Higher screenshot counts at shorter date ranges capture maximum granularity
- **Disk Space Optimization**: `--only-keep-last` automatically deletes previous screenshots, keeping only the most recent successful capture

**Example Strategies:**

```bash
# Full history (keeps all valid screenshots, normal UA rotation)
node index.js --date "Past 7 days" --screenshots-per-term 168

# Latest state only with conservative UA (minimal disk usage, stable fingerprint)
node index.js --date "Past 7 days" --screenshots-per-term 168 --only-keep-last --switch-ua-on-fail-only

# Daily snapshots with decomposition and conservative UA
node index.js --date "Past 90 days" --screenshots-per-term 90 --explode --switch-ua-on-fail-only

# Daily snapshots, latest only, with decomposition
node index.js --date "Past 90 days" --screenshots-per-term 90 --only-keep-last --explode
```

#### 5. Adaptive Block Handling with Audio Alert System

Due to the tool's robust anti-detection measures (user agent management, shuffled search terms, session clearing, and retry logic), blocks are rare in practice. However, when they do occur after thousands of consecutive requests, the tool implements:

- **Consecutive Block Detection**: Tracks sequential failures to distinguish transient issues from sustained platform blocks
- **10-Minute Cooldown with TTS Notification**: Upon 2 consecutive blocks, triggers:
  - **Audio Alert**: Your computer speaks "Shit, we've been blocked. Please rotate your IP address." to attract your attention
  - **Manual Intervention Required**: The audio alert prompts you to manually change your VPN location to obtain a new IP address
  - Complete storage clearing (cookies, localStorage, cache)
  - User agent rotation (regardless of mode - always rotates on block)
  - Session re-initialization via clean trends.google.com visit
- **Automatic Recovery**: After the 10-minute cooldown, the tool automatically resumes collection from the next keyword, ensuring continuous data flow

#### 6. Chain-of-Custody Documentation

- **High-Precision Timestamps**: Every screenshot includes timestamp (MM-DD-YYYY_HH-MM-SS)
- **Parameter Encoding**: Filename includes region, category, and screenshot number
- **Classification in Filename**: Analysis result encoded for immediate triage
- **HTTP Status Preservation**: Original response code logged for forensic audit

**Filename Structure:**
```
[search_term]_[screenshot#]_[region]_[category]_[timestamp]_[classification]_[status].jpg

Example: directed_energy_weapon_5_US_catb_05-17-2026_14-30-22_success_200.jpg
         ^^^^^^^^^^^^^^^^^^^^^ ^ ^^ ^^^^ ^^^^^^^^^^^^^^^^^^^ ^^^^^^^ ^^^
         search term           | |  |    timestamp           result  HTTP
                              # region category
```

### Research Applications

#### Testing the Algorithmic Pruning Hypothesis

The collected data enables statistical decomposition using the linear compositional model:

$$T_{AB}(t) \approx \alpha T_A(t) + \beta T_B(t) + \epsilon(t)$$

Pruning detection criteria:
- $\alpha \ll 1$ or $\beta \ll 1$: Asymmetric term suppression
- $\alpha \approx \beta \approx 0$: Binary activation threshold (near-zero baseline)
- Invalid weights ($\alpha, \beta \notin [0,1]$): Amplification or non-compositional behavior

#### General-Purpose Data Analysis Applications

Beyond pruning detection, the tool supports:

1. **Trend Forecasting**: High-resolution historical data for time series prediction
2. **Event Impact Analysis**: Quantify search interest changes before/after specific events
3. **Cross-Regional Comparison**: Compare how same topics trend in different countries
4. **Category-Specific Research**: Focused analysis on Business, Health, Sci/Tech verticals
5. **Algorithm Auditing**: Detect and document platform-side data modifications
6. **Continuous Monitoring**: Cron-driven automated collection with disk-optimized storage
7. **Semantic Gradient Analysis**: Using `--explode` to capture compositional relationships between terms

### Output Structure

```
output/ (or custom directory via --output-dir)
├── [search_term]_[#]_[region]_[catX]_[timestamp]_success_[status].jpg  (only valid chart screenshots)
├── ai_regulation_1_US_catt_05-17-2026_00-00-00_success_200.jpg   (Hour 0 - kept)
├── ai_regulation_2_US_catt_05-17-2026_01-00-01_success_200.jpg   (Hour 1 - kept)
├── ... (only successful chart screenshots survive, errors are auto-deleted)
└── [additional_terms]_[timestamp]_success_[status].jpg

# Invalid screenshots (Oops, errors, no_data, CAPTCHA, rate limits) are automatically deleted
# With --only-keep-last enabled, only the most recent success per term remains
```

### Post-Processing with GTRENDS-OCR

After collection, use [GTRENDS-OCR](https://github.com/maskirovka3301-oss/gtrends-ocr) to extract time-series data:

```bash
# Organize and extract chart data from screenshots (only valid ones remain)
python gtrends-ocr.py --output_dir ./extracted --workers 1 ./output

# Compile all extracted data into hierarchical JSON
python gtrends-ocr.py --compile ./extracted trends_data.json

# Analyze reconstructed trend lines
cat trends_data.json | jq '.["ai regulation"]["US"]["2026-05-17"]'
```

### Known Issues & Future Work

- **Tesseract Dependency**: OCR quality depends on proper installation and language packs
- **Desktop Testing**: Primarily tested on macOS; Linux/Windows compatibility planned
- **VPN Integration**: Future version will include automatic IP rotation via ProtonVPN
- **Multi-Keyword Comparisons**: Screenshots with multiple trend lines not yet supported
- **Real-time Alerting**: Planned integration with webhooks for automated block notifications
- **Docker Deployment**: Containerization for consistent cross-platform execution

### Requirements

- Node.js 18+
- Tesseract OCR 4.0+
- 4GB free disk space (for screenshots, scales with `--screenshots-per-term`, reduced by `--only-keep-last` and auto-deletion)
- 8GB RAM minimum (16GB recommended for parallel processing)
- Internet connection for Google Trends access

### Project Structure

```
gtrends-mayday/
├── index.js                # Main scraper script
├── package.json            # Node.js dependencies
├── keywords.json           # Term triplets (customizable)
├── user-agents.json        # Browser user agent list
├── output/                 # Default screenshot output directory (only valid charts)
├── literature/             # Accompanying literature
└── .gitignore              # Git ignore rules```

### Citation

If you use this tool in academic research, journalistic investigations, or congressional testimony, please cite:

```
Azulay, D. R. (2026). Exploratory Analysis of Search Trend Anomalies: Evidence of Algorithmic Pruning in RF/5G-Related Query Data.
https://github.com/maskirovka3301-oss/gtrends-mayday/tree/main/literature

Azulay, D. R. (2026). GTRENDS-MAYDAY: Algorithmic Pruning Detection & Forensic Screenshot Collection Tool. GitHub.
https://github.com/maskirovka3301-oss/gtrends-mayday

Azulay, D. R. (2026). GTRENDS-OCR: Google Trends Forensic Screenshot Organizer and Data Extraction Utility. GitHub.
https://github.com/maskirovka3301-oss/gtrends-ocr
```

### License

MIT License - See LICENSE file for details.

### Contact

For inquiries regarding the April 29, 2026 whistleblower disclosure, algorithmic pruning research, or technical support:

**Email**: maskirovka3301@gmail.com  

### Disclaimer

This tool is provided for research, transparency, and accountability purposes. Users are responsible for compliance with all applicable laws and terms of service. The author makes no claims about the accuracy or completeness of data collected. The statistical inferences presented represent exploratory analysis requiring independent verification.

---

**If you find this tool valuable for documenting platform manipulation or general trend research, please give the repository a star.**

*Preserving evidence is the first step toward accountability.*