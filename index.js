// =============================================================================
// index.js
// Node.js + Express back-end to serve two endpoints:
//   1. GET /scan        → Runs Puppeteer-based accessibility checks
//   2. GET /readability → Runs Puppeteer + text-readability analysis
// Also serves static files (index.html, readability.html, styles.css).
// Uses a persistent Puppeteer instance for better performance.
// Adapted for deployment on Render.com.
// =============================================================================

const express   = require("express");
const puppeteer = require("puppeteer");
const cors      = require("cors");
const path      = require("path");

// Import rule definitions and profile mappings
const allRules = require("./rules");      // { title, check, recommendation }
const profiles = require("./profiles");   // e.g. { general: [...], dyslexia: [...] }

// Import text-readability for Flesch–Kincaid scoring
let readability = require("text-readability");
if (readability && readability.default) readability = readability.default;

const app = express();

// Allow CORS and JSON parsing
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
    sharedBrowser = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage"
      ],
      executablePath:
        process.env.PUPPETEER_EXECUTABLE_PATH || puppeteer.executablePath()
    });
  }
  return sharedBrowser;
}

// On process exit (e.g., SIGINT), close the browser.
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
// by either the `tests` parameter or the chosen profile, and returns a JSON
// report.
// -----------------------------------------------------------------------------
app.get("/scan", async (req, res) => {
  const { url, profile = "general", tests } = req.query;
  if (!url) {
    return res.status(400).json({ error: "URL is required" });
  }

  // Determine which rule IDs to run
  let ruleIds;
  if (typeof tests === "string" && tests.trim()) {
    ruleIds = tests.split(",").map(id => id.trim()).filter(Boolean);
  } else {
    ruleIds = profiles[profile] || profiles.general;
  }

  // Build an array of rule definitions
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
    page.setDefaultNavigationTimeout(0);


    // Prevent client-side navigation
    await page.evaluateOnNewDocument(() => {
      ["assign", "replace", "reload"].forEach(m => {
        if (window.location[m]) window.location[m] = () => {};
      });
    });

    // Navigate until DOM ready, then stop loading
    await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: 0
    });
    await page.evaluate(() => window.stop());

    // Construct and run in-page script
    const evalString = `(() => {
      const results = [];
      function addIssue(name, count, recommendation, locations = [], total) {
        const issue = { issue: name, count, recommendation, locations };
        if (typeof total === 'number') issue.total = total;
        results.push(issue);
      }

      ${rulesToRun
        .map(rule => `
          // --- Rule: ${rule.id} ---
          {
            const { count, locations, total } = (${rule.check})();
            addIssue(
              ${JSON.stringify(rule.title)},
              count,
              ${JSON.stringify(rule.recommendation)},
              locations,
              total
            );
          }
        `)
        .join("\n")}

      return results;
    })()`;

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
// Runs Puppeteer to grab main paragraphs, then calculates Flesch–Kincaid grade
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
    page.setDefaultNavigationTimeout(0);


    await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: 0
    });
    await page.evaluate(() => window.stop());

    // Extract paragraphs
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

    // Compute Flesch–Kincaid scores
    const textContent = paragraphs.join("\n\n");
    const overallGrade = readability.fleschKincaidGrade(textContent);
    const overallEase  = readability.fleschReadingEase(textContent);

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
    return res.status(500).json({
      error: "Failed to analyze readability",
      details: err.message
    });
  }
});

// -----------------------------------------------------------------------------
// Start the server on Render’s assigned port (or 4000)
// -----------------------------------------------------------------------------
const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
