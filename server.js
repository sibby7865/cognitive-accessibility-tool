// =============================================================================
// server.js
// Node.js + Express back-end to serve two endpoints:
//   1. GET /scan        → Runs Puppeteer-based accessibility checks
//   2. GET /readability  → Runs Puppeteer + text-readability analysis
// Also serves static files (index.html, readability.html, styles.css).
// Uses a persistent Puppeteer instance (sharedBrowser) for better performance.
// =============================================================================

const express   = require("express");
const puppeteer = require("puppeteer");
const cors      = require("cors");
const path      = require("path");

// Import rule definitions and profile mappings:
const allRules = require("./rules");      // Each rule has { title, check, recommendation }
const profiles = require("./profiles");   // Maps profile names to arrays of rule IDs

// Import text-readability for Flesch-Kincaid scoring
let readability = require("text-readability");
if (readability && readability.default) readability = readability.default;

const app = express();

// Allow CORS and JSON parsing (although we only return JSON from our endpoints)
app.use(cors());
app.use(express.json());

// Serve static files (index.html, readability.html, styles.css, etc.)
app.use(express.static(path.join(__dirname, "/")));

// ----------------------------------------------
// GLOBAL: Shared Puppeteer Browser Instance
// ----------------------------------------------
let sharedBrowser = null;

// Helper to get (or launch) a single Puppeteer Browser
async function getBrowser() {
  if (!sharedBrowser) {
    // sharedBrowser = await puppeteer.launch({
    //   headless: true,
    //   args: ["--no-sandbox", "--disable-setuid-sandbox"]
    // });
//     sharedBrowser = await puppeteer.launch({
//   headless: true,
//   executablePath: "/usr/bin/chromium",
//   args: [
//     "--no-sandbox",
//     "--disable-setuid-sandbox",
//     // reduce memory usage:
//     "--disable-dev-shm-usage"
//   ]
// });

// sharedBrowser = await puppeteer.launch({
//   headless: true,
//   executablePath: "/usr/bin/chromium-browser",
//   args: [
//     "--no-sandbox",
//     "--disable-setuid-sandbox",
//     "--disable-dev-shm-usage"
//   ]
// });

sharedBrowser = await puppeteer.launch({
  headless: true,
  args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
});



  }
  return sharedBrowser;
}

// On process exit (e.g., Ctrl+C), close the browser.
process.on("SIGINT", async () => {
  console.log("\nReceived SIGINT. Closing Puppeteer...");
  if (sharedBrowser) await sharedBrowser.close();
  process.exit();
});

// -----------------------------------------------------------------------------
// GET /
// Serves the Scanner UI (index.html)
// -----------------------------------------------------------------------------
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// -----------------------------------------------------------------------------
// GET /readability.html
// Serves the Readability UI (readability.html)
// -----------------------------------------------------------------------------
app.get("/readability.html", (req, res) => {
  res.sendFile(path.join(__dirname, "readability.html"));
});

// -----------------------------------------------------------------------------
// GET /scan
// Runs Puppeteer to open the provided URL, evaluates only the rules specified
// by either the `tests` parameter or the chosen profile, and returns a JSON report.
// -----------------------------------------------------------------------------
app.get("/scan", async (req, res) => {
  const { url, profile = "general", tests } = req.query;
  if (!url) {
    return res.status(400).json({ error: "URL is required" });
  }

  // If tests param provided, use those IDs; otherwise fallback to profile mapping
  let ruleIds;
  if (typeof tests === "string" && tests.trim()) {
    ruleIds = tests.split(",").map(id => id.trim()).filter(Boolean);
  } else {
    ruleIds = profiles[profile] || profiles.general;
  }

  // Build an array of rule objects from allRules, filtering out any unknown IDs
  const rulesToRun = ruleIds
    .map(id => {
      if (!allRules[id]) {
        console.warn(`Warning: rule "${id}" not found in rules.js`);
        return null;
      }
      return { id, ...allRules[id] };
    })
    .filter(r => r !== null);

  let browser, page;
  try {
    browser = await getBrowser();
    page = await browser.newPage();

    // Prevent any client-side navigation (assign/replace/reload)
    await page.evaluateOnNewDocument(() => {
      ["assign", "replace", "reload"].forEach(m => {
        if (window.location[m]) window.location[m] = () => {};
      });
    });

    // Navigate only until DOM ready, then stop all loading
    await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: 30000
    });
    await page.evaluate(() => window.stop());

    // Build code string to run in page context
    const evalString = `
      (function() {
        const out = [];
        function addIssue(name, count, recommendation, locations = [], total) {
          const o = { issue: name, count, recommendation, locations };
          if (typeof total === 'number') o.total = total;
          out.push(o);
        }

        ${rulesToRun
          .map(rule => `
            // --- Rule: ${rule.id} ---
            {
              const result = (${rule.check})();
              addIssue(
                ${JSON.stringify(rule.title)},
                result.count,
                ${JSON.stringify(rule.recommendation)},
                result.locations,
                result.total
              );
            }
          `)
          .join("\n")}
        return out;
      })()
    `;

    // Execute and gather report
    const report = await page.evaluate(evalString);
    await page.close();

    return res.json(report);
  } catch (err) {
    console.error("Scan failed:", err);
    if (page) await page.close();
    return res.status(500).json({ error: "Failed to scan website" });
  }
});

// -----------------------------------------------------------------------------
// GET /readability
// Runs Puppeteer to grab main paragraphs, then calculates Flesch-Kincaid grade
// level and reading ease (overall + per-paragraph). Returns JSON.
// -----------------------------------------------------------------------------
app.get("/readability", async (req, res) => {
  const { url } = req.query;
  if (!url) {
    return res.status(400).json({ error: "URL is required" });
  }

  let browser, page;
  try {
    browser = await getBrowser();
    page = await browser.newPage();

    // Navigate until DOM ready and stop loading
    await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: 30000
    });
    await page.evaluate(() => window.stop());

    // Grab paragraphs
    const paragraphs = await page.evaluate(() => {
      const root =
        document.querySelector("article") ||
        document.querySelector(".article-body") ||
        document.querySelector("main") ||
        document.body;
      return Array.from(root.querySelectorAll("p"))
        .map(el => el.innerText.trim())
        .filter(text => text.length > 30);
    });

    await page.close();

    // Overall readability
    const textContent = paragraphs.join("\n\n");
    const overallGrade = readability.fleschKincaidGrade(textContent);
    const overallEase  = readability.fleschReadingEase(textContent);

    // Per-paragraph breakdown
    const blocks = paragraphs.map(text => ({
      text,
      gradeLevel: readability.fleschKincaidGrade(text),
      readingEase: readability.fleschReadingEase(text),
    }));

    return res.json({
      overall: { gradeLevel: overallGrade, readingEase: overallEase },
      blocks,
    });
  } catch (err) {
    console.error("Readability scan failed:", err);
    if (page) await page.close();
    return res
      .status(500)
      .json({ error: "Failed to analyze readability", details: err.message });
  }
});

// -----------------------------------------------------------------------------
// Start the server on port 3000
// -----------------------------------------------------------------------------

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server running on port ${port}`));

