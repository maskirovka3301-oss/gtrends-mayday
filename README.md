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

### Anti-Detection & Block Handling

The tool implements multiple layers of evasion that make blocks extremely rare:

- **Randomized User Agent Rotation**: Automatically cycles through 15-99 different user agents at random intervals (15-30 requests per agent)
- **Search Term Randomization**: Shuffles the order of all search terms to avoid predictable request patterns
- **Session Freshness**: Clears all browser storage (cookies, localStorage, cache) when blocks are detected
- **Intelligent Delays**: Configurable delays (2-5 seconds) between requests to avoid triggering rate limits

**When blocks do occur (rare due to the above measures), the tool triggers:**

- **10-Minute Cooldown Pause**: Automatically pauses all activity for 10 minutes
- **Text-to-Speech Audio Alert**: Your computer speaks "Shit, we've been blocked. Please rotate your IP address." to attract your attention
- **Manual VPN Intervention Required**: The audio alert prompts you to manually change your VPN location to obtain a new IP address
- **Automatic Session Reset**: After the cooldown, the tool automatically clears storage, rotates user agent, and re-initializes the session before resuming

**Why blocks are rare in practice:**
- The combination of frequent user agent switching, randomized term order, and session clearing mimics organic traffic patterns
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

### Usage

```bash
# Install dependencies
npm install

# Basic usage with default settings (worldwide data)
npm start

# General-purpose data collection examples

# Capture worldwide data for past 90 days
node index.js --date "Past 90 days"

# Capture US data for past 90 days
node index.js --region US --date "Past 90 days"

# High-resolution hourly sampling with disk space optimization
node index.js --screenshots-per-term 30 --date "Past hour" --only-keep-last

# Daily reconstruction for a specific category in Germany
node index.js --region DE --category t --date "Past 7 days" --screenshots-per-term 7

# Monthly trend analysis for Japanese entertainment queries
node index.js --region JP --category e --date "Past 12 months" --screenshots-per-term 12

# Custom output directory for organized storage
node index.js --output-dir ./data/us_2024 --region US --date "Past 90 days"

# Complete forensic configuration (all parameters)
node index.js --keyword-file ./forensic-terms.json --output-dir ./forensic_data --region US --category b --date "Past 5 years" --screenshots-per-term 60 --only-keep-last

# Custom date range for specific event analysis
node index.js --region GB --date "2024-01-01 2024-12-31" --screenshots-per-term 24 --output-dir ./uk_2024
```

### Continuous Recording with Cron (Example)

Set up automated recurring data collection using crontab:

```bash
# Edit your crontab
crontab -e

# Example cron jobs for continuous Google Trends recording:

# Run every hour to capture hourly trends (keeping only the latest)
0 * * * * cd /path/to/gtrends-mayday && node index.js --keyword-file ./monitor.json --date "Past hour" --screenshots-per-term 1 --only-keep-last --output-dir ./hourly_data >> /var/log/gtrends.log 2>&1

# Run daily at midnight to capture daily data
0 0 * * * cd /path/to/gtrends-mayday && node index.js --keyword-file ./daily-terms.json --region GB --date "Past day" --screenshots-per-term 1 --output-dir ./daily_data >> /var/log/gtrends-daily.log 2>&1

# Run weekly on Sunday at 2 AM to capture weekly data
0 2 * * 0 cd /path/to/gtrends-mayday && node index.js --keyword-file ./weekly-terms.json --region DE --category t --date "Past 7 days" --screenshots-per-term 1 --output-dir ./weekly_data >> /var/log/gtrends-weekly.log 2>&1

# Run monthly on the 1st at 3 AM to capture monthly data
0 3 1 * * cd /path/to/gtrends-mayday && node index.js --keyword-file ./monthly-terms.json --region JP --category e --date "Past 30 days" --screenshots-per-term 1 --output-dir ./monthly_data >> /var/log/gtrends-monthly.log 2>&1

# High-frequency monitoring (every 6 hours) with disk space optimization
0 */6 * * * cd /path/to/gtrends-mayday && node index.js --keyword-file ./trending.json --region US --date "Past 4 hours" --screenshots-per-term 1 --only-keep-last --output-dir ./high_freq_data >> /var/log/gtrends-6hour.log 2>&1
```

**With cron automation, you can:**
- Build years of uninterrupted historical trend data
- Detect exactly when pruning or manipulation occurs (down to the hour)
- Compare trends across multiple regions and categories simultaneously
- Create alerting systems when anomalies are detected in recurring collections
- Organize data by date/region/category using custom output directories
- Minimize disk usage with `--only-keep-last` for high-frequency sampling

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
                                  (200) screenshot for each term and delete previous ones
  --help, -h                      Show this help message

Examples:
  # Worldwide forensic pruning detection
  node index.js --keyword-file ./keywords.json --date "Past 5 years"
  
  # US-specific with custom output directory
  node index.js --keyword-file ./keywords.json --region US --date "Past 5 years" --output-dir ./us_forensic
  
  # High-frequency sampling with disk space optimization
  node index.js --keyword-file ./monitor-terms.json --date "Past day" --screenshots-per-term 24 --only-keep-last
  
  # Cross-regional comparison with organized output
  node index.js --region GB --category t --date "Past 90 days" --output-dir ./uk_tech
  node index.js --region DE --category t --date "Past 90 days" --output-dir ./de_tech
  node index.js --region JP --category t --date "Past 90 days" --output-dir ./jp_tech
  
  # Event-specific timeline reconstruction with auto-cleanup
  node index.js --region US --date "2026-04-01 2026-05-31" --screenshots-per-term 30 --only-keep-last --output-dir ./event_analysis
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

#### Example 1: Basic Forensic Collection (Worldwide)
```
maskirovka@3301 % node index.js --keyword-file ./keywords.json --date "Past 90 days"

=== Google Trends Scraper with OCR Analysis ===

Using keyword file: ./keywords.json
Using output directory: ./output
Using date range: today 3-m
Screenshots per term: 1
Region: Worldwide (no geo-restriction)
Category: all - All categories
✓ Tesseract OCR found
Loaded 1082 compound keywords from ./keywords.json
Loaded 99 user agents from ./user-agents.json
Output directory ready: ./output

=== Generating all search terms from compound keywords ===
  Generated 6600 total search terms from 1082 compound keywords

📊 Generated 6600 unique search terms total.
🔀 Randomized the order of 6600 search terms.

[1/6600] Processing term: "directed energy weapon"
  Screenshot 1/1 for "directed energy weapon"
Navigating to: https://trends.google.com/trends/explore?date=today%203-m&q=directed%20energy%20weapon&hl=en-US
Screenshot saved: output/directed_energy_weapon_05-17-2026_14-30-22_pending_200.jpg
  Analyzing screenshot with OCR...
  Pattern detected: success (chart data found)
  Renamed to: directed_energy_weapon_05-17-2026_14-30-22_success_200.jpg
  ✓ Success! Chart loaded.

========== SUMMARY ==========
Total screenshots taken: 6600
  - Success: 5842
  - No data: 702
  - Rate limited: 46
  - CAPTCHA: 8
  - Errors: 2
==============================
```

#### Example 2: High-Resolution Sampling with Disk Optimization
```
maskirovka@3301 % node index.js --keyword-file "./monitor-terms.json" --date "Past day" --screenshots-per-term 24 --only-keep-last

=== Google Trends Scraper with OCR Analysis ===

Using date range: now 1-d
Screenshots per term: 24
Mode: Only keeping last successful screenshot per term (disk space optimized)

[1/50] Processing term: "AI regulation news"
  Will take 24 screenshot(s) for this term
  
  --- Screenshot 1/24 for "AI regulation news" ---
  ✓ Success! Chart loaded. (Kept)
  
  --- Screenshot 2/24 for "AI regulation news" ---
  ✓ Success! Chart loaded.
  Deleted previous screenshot: ai_regulation_news_1_US_catt_05-17-2026_00-00-00_success_200.jpg
  
  --- Screenshot 3/24 for "AI regulation news" ---
  ⚠ Rate limited detected! (Preserving previous success)
  
  --- Screenshot 4/24 for "AI regulation news" ---
  ✓ Success! Chart loaded.
  Deleted previous screenshot: ai_regulation_news_2_US_catt_05-17-2026_01-00-01_success_200.jpg
  
  ... (continuing for 24 hours, keeping only the most recent success)

📊 After 24 screenshots, only the final successful screenshot remains
```

#### Example 3: Organized Multi-Region Collection
```
maskirovka@3301 % node index.js --region US --date "Past 90 days" --output-dir ./data/us
maskirovka@3301 % node index.js --region GB --date "Past 90 days" --output-dir ./data/uk
maskirovka@3301 % node index.js --region DE --date "Past 90 days" --output-dir ./data/germany

# Results in organized directory structure:
# ./data/us/[screenshots]
# ./data/uk/[screenshots]
# ./data/germany/[screenshots]
```

### How It Works

This tool implements a sophisticated scraping pipeline optimized for both pruning research and general-purpose data collection:

#### 1. Semantic Gradient Generation

- **Triplet Decomposition**: Each compound keyword is decomposed into all ordered subsequences (single words, bigrams, original phrase) to capture compositional dynamics
- **Deduplication & Randomization**: Unique search terms are shuffled to avoid predictable request patterns that could trigger rate limiting
- **Comprehensive Coverage**: Generates 5,000-7,000 unique search terms from 1,200+ triplets, providing statistical power for hierarchical Bayesian updating

#### 2. Stealth Browser Automation

- **Puppeteer-Extra with Stealth Plugin**: Evades headless browser detection using multiple evasion techniques
- **User Agent Rotation**: Automatically rotates through 15-99 different user agents with randomized intervals (15-30 requests per agent)
- **Session Freshness**: Clears all browser storage (cookies, localStorage, cache) before collection and during 10-minute cooldown periods
- **Intelligent Throttling**: Configurable delays (2-5 seconds) between requests to avoid triggering rate limits

#### 3. Forensic Screenshot Classification

Using Tesseract OCR, screenshots are classified into categories essential for analysis:

| Category | Detection Pattern | Research Implication |
|----------|-----------------|---------------------|
| `success` | Chart data with "interest over time" | Successful retrieval for weight estimation |
| `no_data` | "doesn't have enough data" or "Oops" | Valid response—term lacks search volume |
| `captcha` | "suspicious traffic", "verify you're human" | Platform anti-bot trigger (rate limiting) |
| `rate_limited` | "429", "rate limit", "too many requests" | Hard rate limit (pauses collection) |
| `error` | HTTP 4xx/5xx or unexpected content | Platform errors requiring investigation |

#### 4. High-Resolution Temporal Sampling Strategy

For general-purpose data collection, the `--screenshots-per-term` parameter enables:

- **Sequential Captures**: Takes N screenshots back-to-back for the same search term
- **Adaptive Delays**: Shorter delays between screenshots of same term (1-3 seconds) vs. different terms (2-5 seconds)
- **Timestamp Preservation**: Each screenshot includes precise timestamp for temporal alignment
- **Resolution Optimization**: Higher screenshot counts at shorter date ranges capture maximum granularity
- **Disk Space Optimization**: `--only-keep-last` automatically deletes previous screenshots, keeping only the most recent successful capture

**Example Strategies:**

```bash
# Full history (keeps all screenshots)
node index.js --date "Past 7 days" --screenshots-per-term 168

# Latest state only (minimal disk usage)
node index.js --date "Past 7 days" --screenshots-per-term 168 --only-keep-last

# Daily snapshots with history
node index.js --date "Past 90 days" --screenshots-per-term 90

# Daily snapshots, latest only
node index.js --date "Past 90 days" --screenshots-per-term 90 --only-keep-last
```

#### 5. Adaptive Block Handling with Audio Alert System

Due to the tool's robust anti-detection measures (randomized user agents, shuffled search terms, session clearing), blocks are rare in practice. However, when they do occur after thousands of consecutive requests, the tool implements:

- **Consecutive Block Detection**: Tracks sequential failures to distinguish transient issues from sustained platform blocks
- **10-Minute Cooldown with TTS Notification**: Upon 2 consecutive blocks, triggers:
  - **Audio Alert**: Your computer speaks "Shit, we've been blocked. Please rotate your IP address." to attract your attention
  - **Manual Intervention Required**: The audio alert prompts you to manually change your VPN location to obtain a new IP address
  - Complete storage clearing (cookies, localStorage, cache)
  - User agent rotation
  - Session re-initialization via clean trends.google.com visit
- **Automatic Recovery**: After the 10-minute cooldown, the tool automatically resumes collection from the next keyword, ensuring continuous data flow

**Why blocks are extremely rare:**
- The combination of frequent user agent switching (every 15-30 requests) mimics organic browser behavior
- Randomized order of search terms prevents pattern detection
- Session clearing and re-initialization before each collection run maintains freshness
- In practice, the tool can process thousands of search terms without triggering blocks

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

### Output Structure

```
output/ (or custom directory via --output-dir)
├── [search_term]_[#]_[region]_[catX]_[timestamp]_[classification]_[status].jpg
├── ai_regulation_1_US_catt_05-17-2026_00-00-00_success_200.jpg   (Hour 0)
├── ai_regulation_2_US_catt_05-17-2026_01-00-01_success_200.jpg   (Hour 1)
├── ai_regulation_3_US_catt_05-17-2026_02-00-02_success_200.jpg   (Hour 2)
├── ... (continuing for all screenshots when --only-keep-last is not used)
└── [additional_terms]_[timestamp]_[classification]_[status].jpg

# With --only-keep-last enabled, only the most recent screenshot per term remains
```

### Post-Processing with GTRENDS-OCR

After collection, use [GTRENDS-OCR](https://github.com/maskirovka3301-oss/gtrends-ocr) to extract time-series data:

```bash
# Organize and extract chart data from screenshots
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
- 4GB free disk space (for screenshots, scales with `--screenshots-per-term`, reduced by `--only-keep-last`)
- 8GB RAM minimum (16GB recommended for parallel processing)
- Internet connection for Google Trends access

### Project Structure

```
gtrends-mayday/
├── index.js                # Main scraper script
├── package.json            # Node.js dependencies
├── keywords.json           # Term triplets (customizable)
├── user-agents.json        # Browser user agent list
├── output/                 # Default screenshot output directory
├── literature/             # Accompanying literature
└── .gitignore              # Git ignore rules
```

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
