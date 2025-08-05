/**
 * =============================================================================
 * rules.js
 *
 * Defines all individual accessibility-check “rules.” Each rule exports:
 *   - title:          issue name
 *   - check:          A stringified function (to be run via page.evaluate)
 *   - recommendation: Advice in plain-english on how to fix the issue
 *
 * The `check` function should return an object:
 *   { count: <number>, total?: <number>, locations: <array of strings> }
 *
 * locations array can be:
 *   - HTML snippets (outerHTML)
 *   - text excerpts
 *   - URLs for media elements
 * =============================================================================
 */

// Load our common-words whitelist
const commonWords = require("./common-3000.json");
// Build a lowercase Set for fast lookup
const whitelist = new Set(commonWords.map(w => w.toLowerCase()));

module.exports = {
autoplayVideos: {
  title: "Autoplay Videos",
   recommendation: `
<strong>Why it matters</strong>
When media starts playing without warning, users can be startled by sudden sound or motion. That jolt can break concentration, spike stress, or even cause anxiety for people with sensory sensitivities. It also forces them to hunt for the pause button before they can continue reading or navigating.

<strong>How to fix</strong>
Disable autoplay by default. Require explicit user action (click or tap) to start media.

<strong>WCAG</strong>
2.2.2 Pause, Stop, Hide

<strong>For More Information Please Visit:</strong>
<a href="https://www.w3.org/WAI/WCAG21/Understanding/pause-stop-hide.html"
   target="_blank" rel="noopener">
  Pause, Stop, Hide (Understanding SC 2.2.2)
</a>
<a href="https://www.boia.org/blog/does-wcag-pause-stop-hide-apply-to-simple-animations"
   target="_blank" rel="noopener">
  Does WCAG ‘Pause, Stop, Hide’ Apply to Simple Animations?
</a>
`.trim(),
  check: `() => {
    // catches both markup-based and script-enabled autoplay
    const autoEls = Array.from(document.querySelectorAll("video"))
      .filter(video => video.autoplay);
    return {
      count: autoEls.length,
      locations: autoEls.map(el => el.outerHTML)
    };
  }`,
},

  longSentences: {
    title: "Long Sentences",
    recommendation: `
<strong>Why it matters</strong>
Sentences over ~25 words become difficult to follow—research shows comprehension falls below 10% once you hit ~43 words yet most people only scan about 25% of a page. Long, complex sentences force everyone (not just those with dyslexia or ADHD) to slow down and work harder to extract meaning, especially in busy or distracting contexts.


<strong>How to fix</strong>
Break any sentence over ~25 words into two or more shorter, simpler sentences.

<strong>For More Information Please Visit: </strong>
<a href="https://webaim.org/techniques/writing/" target="_blank" rel="noopener">
Plain Language (Tips)
</a>
<a href="https://insidegovuk.blog.gov.uk/2014/08/04/sentence-length-why-25-words-is-our-limit/" target="_blank" rel="noopener">
Why 25 Words Per Sentence?
</a>
`.trim(),
    check: `() => {
      const sentences = [];
      document.querySelectorAll("p").forEach(p =>
        p.innerText.split(/(?<=[.!?])\\s+/).forEach(s => {
          const t = s.trim();
          if (t) sentences.push(t);
        })
      );
      const longOnes = sentences.filter(s => s.split(/\\s+/).length > 25);
      return {
        count: longOnes.length,
        total: sentences.length,
        locations: longOnes
      };
    }`,
  },

  h1Missing: {
    title: "H1 Missing",
     recommendation: `
<strong>Why it matters</strong>
A clear, singular <code>&lt;h1&gt;</code> gives every page a simple “title” that screen-reader users and scanners can latch onto. Without it, people can feel disoriented and unsure of the page’s purpose.

<strong>How to fix</strong>
Ensure each page begins with exactly one—<code>&lt;h1&gt;</code> element that clearly describes its content.

<strong>WCAG</strong>
2.4.6 Headings and Labels

<strong>For More Information Please Visit: </strong>
<a href="https://www.w3.org/TR/UNDERSTANDING-WCAG20/navigation-mechanisms-descriptive.html" target="_blank" rel="noopener">
Understanding WCAG 2.4.6
</a>
<a href="https://www.w3.org/WAI/WCAG22/quickref/?versions=2.0#qr-navigation-mechanisms-descriptive" target="_blank" rel="noopener">
How to Meet WCAG 2.4.6?
</a>
<a href="https://www.a11yproject.com/posts/how-to-accessible-heading-structure/" target="_blank" rel="noopener">
Accessible Heading Structure
</a>
`.trim(),
    check: `() => {
      const h1Count = document.querySelectorAll("h1").length;
      return {
        count: h1Count === 0 ? 1 : 0,
        locations: []
      };
    }`,
  },

  vagueLinkText: {
    title: "Vague Link Text",
     recommendation: `
<strong>Why it matters</strong>
Links like “Click here” or “Read more” give no clue out of context, forcing users with attention or memory issues to hunt back in the page.

<strong>How to fix</strong>
Use descriptive link text that makes sense on its own (e.g. “Download the 2024 Annual Report (PDF)”).

<strong>WCAG</strong>
2.4.4 Link Purpose (In Context)

<strong>For More Information Please Visit: </strong>
<a href="https://www.w3.org/WAI/WCAG21/Understanding/link-purpose-in-context.html" target="_blank" rel="noopener">
Understanding WCAG 2.4.4: Link Purpose (In Context)
</a>
<a href="https://www.w3.org/WAI/WCAG22/quickref/?versions=2.1#link-purpose-in-context" target="_blank" rel="noopener">
How to meet WCAG 2.4.4: Link Purpose (In Context)?
</a>
</a>
<a href="https://accessibility.education.gov.uk/knowledge-hub/common-issues/links" target="_blank" rel="noopener">
Non-Descriptive Links
</a>
`.trim(),
    check: `() => {
      const vagueLinks = Array.from(document.querySelectorAll("a"))
        .filter(a =>
          ["click here", "read more"].includes(a.innerText.toLowerCase().trim())
        );
      return {
        count: vagueLinks.length,
        locations: vagueLinks.map(el => el.outerHTML)
      };
    }`,
  },

  formFieldsWithoutLabels: {
    title: "Form Fields without Labels",
     recommendation: `
<strong>Why it matters</strong>
Without a visible label, users can’t quickly tell what’s expected in each input, increasing guesswork and anxiety.

<strong>How to fix</strong>
Pair each <code>&lt;input&gt;</code>, <code>&lt;select&gt;</code> or <code>&lt;textarea&gt;</code> with a <code>&lt;label for="…"&gt;</code>. If you hide it visually, supply <code>aria-label</code> or <code>aria-labelledby</code>.

<strong>WCAG</strong>
1.1.1 Non-text Content 
1.3.1 Info and Relationships
2.4.6 Headings and Labels
3.3.2 Labels or Instructions
4.1.2 Name, Role, Value


<strong>For More Information Please Visit: </strong>
<a href="https://www.w3.org/TR/WCAG21/#non-text-content" target="_blank" rel="noopener">
Understanding 1.1.1 Non-text Content
</a>
<a href="https://www.w3.org/WAI/WCAG22/Understanding/info-and-relationships.html target="_blank" rel="noopener">
Understanding 1.3.1 Info and Relationships
</a>
<a href="https://www.w3.org/WAI/WCAG22/Understanding/headings-and-labels.html" target="_blank" rel="noopener">
Understanding 2.4.6 Headings and Labels
</a>
<a href="https://www.w3.org/WAI/WCAG22/Understanding/labels-or-instructions.html" target="_blank" rel="noopener">
Understanding 3.3.2 Labels or Instruction
</a>
<a href="https://www.w3.org/WAI/WCAG22/Understanding/name-role-value.html" target="_blank" rel="noopener">
Understanding 4.1.2 Name, Role, Value
</a>
<a href="https://www.w3.org/WAI/tutorials/forms/labels/" target="_blank" rel="noopener">
Form Labels (Tutorial)
</a>
`.trim(),
    check: `() => {
      const unlabeled = Array.from(
        document.querySelectorAll("input, textarea, select")
      ).filter(f => !f.labels || f.labels.length === 0);
      return {
        count: unlabeled.length,
        locations: unlabeled.map(el => el.outerHTML)
      };
    }`,
  },

  timeBasedContent: {
    title: "Time-based Content",
     recommendation: `
<strong>Why it matters</strong>
Auto-updating content (live scores, carousels) can catch users off-guard, breaking reading flow and pulling focus away from their task.

<strong>How to fix</strong>
Provide pause/stop or manual-advance controls; avoid auto-rotation unless initiated by the user.

<strong>WCAG</strong>
2.2.1 Timing Adjustable

<strong>For More Information Please Visit: </strong>
<a href="https://www.w3.org/WAI/WCAG21/Understanding/timing-adjustable.html" target="_blank" rel="noopener">
Understanding WCAG 2.2.1: Timing Adjustable.
</a>
`.trim(),
    check: `() => {
      const selectors = [
        "#demo","time[datetime]",".countdown","[data-countdown]",
        ".timer","marquee","[aria-live]"
      ].join(",");
      const bySelector = Array.from(document.querySelectorAll(selectors));
      const byText = Array.from(document.querySelectorAll("span, div, p"))
        .filter(el => /^\\d{1,2}:\\d{2}(?::\\d{2})?$/.test(el.innerText.trim()));
      const unique = Array.from(new Set([...bySelector, ...byText]));
      return {
        count: unique.length,
        locations: unique.map(el => el.outerHTML)
      };
    }`,
  },

blinkingOrMarquee: {
  title: "Blinking or Marquee Tags",
  recommendation: `
<strong>Why it matters</strong>
The <blink> and <marquee> elements are obsolete in HTML5, cannot be paused or stopped by users and can distract or confuse assistive technologies.

<strong>How to fix</strong>
Remove any <blink> or <marquee> tags from your markup. If you require similar effects, implement them with CSS or JavaScript animations that include Pause, Stop or Hide controls.

<strong>WCAG</strong>
2.2.2 Pause, Stop, Hide

<strong>For more information</strong><br>
<a href="https://www.w3.org/WAI/WCAG21/Understanding/pause-stop-hide.html" target="_blank" rel="noopener">
Understanding WCAG 2.2.2: Pause, Stop, Hide 
</a>
<a href="https://www.accessibilitychecker.org/wcag-guides/ensure-elements-are-not-used/" target="_blank" rel="noopener">
Why Marquee Elements Should Not be Used?
</a>
`.trim(),
  check: `() => {
      const flashEls = Array.from(document.querySelectorAll("blink, marquee"));
      return {
        count: flashEls.length,
        locations: flashEls.map(el => el.outerHTML)
      };
    }`,
},


  missingCaptions: {
  title: "Missing Captions for Media",
  recommendation: `
<strong>Why it matters</strong>
Captions give viewers with ADHD a visual anchor they can glance at when their attention drifts. They provide a persistent, on-screen record that supports people with memory impairments who need to re-read spoken content. And they let those with dyslexia control reading pace and apply text-based aids to improve comprehension.

<strong>How to fix</strong>
Add one or more <code>&lt;track kind="captions"&gt;</code> elements inside every <code>&lt;video&gt;</code>. Make sure captions are accurate, synchronised and cover all dialogue or important sound cues.

<strong>WCAG</strong>
1.2.2 Captions (Prerecorded)

<strong>For more information</strong><br>
<a href="https://www.w3.org/WAI/WCAG22/Understanding/captions-prerecorded.html"
   target="_blank" rel="noopener">
Understanding WCAG 1.2.2: Captions
</a>
`.trim(),
  check: `() => {
    const videos = Array.from(document.querySelectorAll("video"));
    const withoutCaptions = videos.filter(video =>
      !video.querySelector('track[kind="captions"]')
    );
    return {
      count: withoutCaptions.length,
      locations: withoutCaptions.map(video =>
        video.currentSrc || video.outerHTML
      )
    };
  }`,
},

  noEasyToReadSummaries: {
    title: "Missing Summary/Overview",
    recommendation: `
<strong>Why it matters</strong>
Long pages without a clear summary can overwhelm readers who struggle to maintain focus or retain information. People with attention differences may find it hard to locate the main points, while those with memory impairments can lose track of where they are. A concise overview provides a quick roadmap, reduces mental effort and helps readers decide whether to read on.

<strong>How to fix</strong>
At the start of lengthy articles, include a brief summary or an ‘At a glance’ list of key points.

<strong>Best practice</strong>
See COGA guidance and GOV.UK Plain English.

<strong>For more information</strong><br>
<a href="https://www.gov.uk/guidance/content-design/writing-for-gov-uk
   target="_blank" rel="noopener">
How to write well for your audience - GOV.UK.
</a>
<a href="https://www.w3.org/TR/coga-usable/#objective-3-use-clear-and-understandable-content-0
   target="_blank" rel="noopener">
Making Content Usable for People with Cognitive and Learning Disabilities - Section 4.4.
</a>
`.trim(),
  check: `() => {
  const articles = Array.from(document.querySelectorAll("article"));
  const missing = articles.filter(article => {
    const hasSummaryTag = !!article.querySelector("summary, .summary, .overview");
    const hasHeading = Array.from(article.querySelectorAll("h1,h2,h3"))
      .some(h => /^(summary|overview|at a glance)/i.test(h.textContent.trim()));
    return !hasSummaryTag && !hasHeading;
  });
  return {
    count: missing.length,
    locations: missing.map(article =>
      // if it has an ID, report "#the-id", otherwise a text preview
      article.id
        ? "#" + article.id
        : article.textContent.trim().slice(0, 100) + "…"
        )
      };
    }`,
  },

  missingNavContainer: {
    title: "Missing Nav Container",
   recommendation: `
<strong>Why it matters</strong>
Without a recognised navigation landmark, users with attention or memory challenges must tab or listen through every link in order. That extra effort can be confusing, slow them down and make it harder to return to where they left off.

<strong>How to fix</strong>
Wrap your primary menu links in <code>&lt;nav aria-label="Main navigation"&gt;…&lt;/nav&gt;</code>. <br> 
This signals to assistive technologies and anyone scanning for structure where the menu begins and ends. <br>
You may also add a <code>&lt;a href="#main-content" class="skip-link"&gt;Skip to content&lt;/a&gt;</code> link immediately before the <code>&lt;nav&gt;</code> for even faster access.

<strong>WCAG</strong>
1.3.1 Info and Relationships

<strong>For More Information Please Visit: </strong>
<a href="https://www.w3.org/WAI/WCAG21/Understanding/info-and-relationships.html" target="_blank" rel="noopener">
Understanding 1.3.1: Info and Relationships
</a>
<a href="https://allyant.com/blog/understanding-the-consistent-navigation-requirement-in-web-accessibility/" target="_blank" rel="noopener">
Understanding the Consistent Navigation Requirement in Web Accessibility
</a>
`.trim(),
    check: `() => {
  // Find any native or ARIA navigation landmarks
  const navElements = Array.from(
    document.querySelectorAll("nav, [role='navigation']")
  );
  const missingNav = navElements.length === 0;
  return {
    // count is 1 if no nav landmarks, otherwise 0
    count: missingNav ? 1 : 0,
    // if navs exist, give their HTML so devs can inspect them
    locations: navElements.map(el => el.outerHTML)
      };
    }`,
  },

  tooManyNavLinks: {
    title: "Too Many Nav Links",
    recommendation: `
<strong>Why it matters</strong>
Too many top-level links cause choice overload; users with working-memory limits struggle to scan and decide.

<strong>How to fix</strong>
Limit primary nav to 7±2 items; group extras under a “More” submenu or footer.

<strong>Best practice</strong>
<a href="https://www.nngroup.com/articles/menu-design/" target="_blank" rel="noopener">
Nielsen Norman on Menu Design
</a>
<a href="https://medium.com/design-bootcamp/the-7-2-rule-the-real-science-behind-millers-law-that-will-shock-you-your-deepest-memory-4a35be25bb3b" target="_blank" rel="noopener">
Background on Miller's 7+2 Rule
</a>
`.trim(),
    check: () => {
  const nav = document.querySelector("nav");
  if (!nav) return { count: 0, locations: [] };
  const links = Array.from(nav.querySelectorAll("a"));
  const locations = links.map(a => {
    const txt = a.textContent.replace(/\s+/g, " ").trim() || "(no text)";
    return `${txt} — ${a.href}`;
  });
  return {
    count: links.length,
    locations
    };
  },
},

  complexVocabulary: {
    title: "Complex Vocabulary",
     recommendation: `
<strong>Why it matters</strong>
Complex or technical vocabulary forces readers to pause and decode each term, breaking their concentration. 

Words with three or more syllables (known as polysyllabic words) are especially taxing, since dyslexic users often need extra time to sound out every syllable. That extra effort compounds for people with attention differences or memory challenges, making it harder to follow your content.

<strong>How to fix</strong>
Choose familiar, everyday words wherever you can. When you must use specialised terms, add a brief parenthetical definition on first use or link to a simple glossary entry. This keeps your readers moving at their own pace.

<strong>Best practice</strong>
Plain English Campaign (a UK charity promoting clear, concise writing)

<strong>For More Information Please Visit: </strong>
<a href="https://www.plainenglish.co.uk/" target="_blank" rel="noopener">
Plain English Campaign
</a>
`.trim(),
    check: `() => {
      function countSyllables(w) {
        w = w.toLowerCase()
             .replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, "")
             .replace(/^y/, "");
        const m = w.match(/[aeiouy]{1,2}/g);
        return m ? m.length : 0;
      }

      // Rebuild the whitelist in page context
      const whitelist = new Set(${JSON.stringify(commonWords.map(w => w.toLowerCase()))});

      const elems = Array.from(document.querySelectorAll("p, h1, h2, h3, h4, h5, h6"));
      const found = new Set();

      elems.forEach(el => {
        el.innerText.split(/\\W+/).forEach(raw => {
          const word = raw.trim();
          if (!word) return;
          const lower = word.toLowerCase();
          const syl = countSyllables(word);
          if (syl >= 3 && !whitelist.has(lower)) {
            found.add(\`\${word} (\${syl} syl)\`);
          }
        });
      });

      return {
        count: found.size,
        locations: Array.from(found)
      };
    }`,
  },

 fontFamilySansSerif: {
  title: "Accessible Font Family",
   recommendation: `
<strong>Why it matters</strong>
Decorative or serif typefaces can blur key letter shapes, forcing readers to slow down and re-read. This extra effort increases cognitive load, particularly for people with dyslexia.

<strong>How to fix</strong>
Choose only fonts that are simple and clear to read. Avoid decorative or unusual typefaces that make letters hard to tell apart. In your stylesheet, Include a generic <code>sans-serif</code> fallback and/or use one of these dyslexia-friendly or highly legible families:

• OpenDyslexic  
• Dyslexie  
• Lexend  
• Atkinson Hyperlegible  
• FS Me  
• Sylexiad  
• Arial, Verdana, Tahoma, Calibri  
• Open Sans, Roboto, Lato, Montserrat  
• Comic Sans (yes, really!)

<strong>For More Information Please Visit: </strong>
<a href="https://fonts.google.com/knowledge/readability_and_accessibility/introducing_accessibility_in_typography" target="_blank" rel="noopener">
Introducing accessibility in typography
</a>
<a href="https://reciteme.com/news/dyslexia-friendly-fonts/" target="_blank" rel="noopener">
The 10 Best Dyslexia Friendly Fonts
</a>
`.trim(),
  check: `() => {
    // approved list of families (lowercase, no quotes)
    const approved = [
      "opendyslexic",
      "dyslexie",
      "lexend",
      "atkinson hyperlegible",
      "fs me",
      "sylexiad",
      "arial",
      "verdana",
      "tahoma",
      "calibri",
      "open sans",
      "roboto",
      "lato",
      "montserrat",
      "comic sans",
      "sans-serif"
    ];

    const badStacks = new Set();
    document.querySelectorAll("p, li, h1, h2, h3, h4, h5, h6")
      .forEach(el => {
        const css = getComputedStyle(el).getPropertyValue("font-family") || "";
        // split into individual names, strip quotes & whitespace, lowercase
        const families = css
          .split(",")
          .map(f => f.trim().replace(/^['"]|['"]$/g, "").toLowerCase());
        // if none of them appears in approved, flag
        if (!families.some(f => approved.includes(f))) {
          badStacks.add(css);
        }
      });

    return {
      count: badStacks.size,
      locations: Array.from(badStacks)
    };
  }`
},

  minFontSize: {
    title: "Minimum Font Size",
    recommendation: `
<strong>Why it matters</strong>
Very small text forces readers to pause and work harder to recognise letters, breaking their focus and increasing mental effort. That extra effort can overwhelm people with dyslexia, ADHD or memory challenges.

<strong>How to fix</strong>
Choose a base font size of at least 16 px and use relative units so all body text stays at or above that size. 

<strong>WCAG</strong>
1.4.4 Resize text (up to 200%)
1.4.12 Text Spacing

<strong>For More Information Please Visit: </strong>
<a href="https://www.w3.org/WAI/WCAG21/Understanding/resize-text.html" target="_blank" rel="noopener">
Understanding 1.4.4: Resize Text
</a>
<a href="https://www.w3.org/WAI/WCAG22/Understanding/text-spacing.html" target="_blank" rel="noopener">
Understanding 1.4.12: Text Spacing
</a>
<a href="https://cdn.bdadyslexia.org.uk/uploads/documents/Advice/style-guide/BDA-Style-Guide-2023.pdf?v=1680514568" target="_blank" rel="noopener">
Dyslexia Style Guide
</a>
`.trim(),
    check: `() => {
      // Check paragraphs, list items, links and labels
      const elems = Array.from(
        document.querySelectorAll("p, li, a, label")
      );
      const smallOnes = new Set();
      elems.forEach(el => {
        const fs = parseFloat(getComputedStyle(el).fontSize);
        if (fs < 16) {
          // record e.g. "14.4px on <p>"
          smallOnes.add(\`\${fs.toFixed(1)}px on <\${el.tagName.toLowerCase()}>\`);
        }
      });
      const locations = Array.from(smallOnes);
      return {
        count: locations.length,
        locations
      };
    }`
  },

    letterSpacing: {
    title: "Letter Spacing",
     recommendation: `
<strong>Why it matters</strong>
When letters are too close together so that pairs like “rn” look like “m” or “cl” look like “d”, readers must slow down and work harder to tell each character apart. That extra effort can overwhelm people with dyslexia, ADHD or memory challenges and break their focus.

<strong>How to fix</strong>
Widen the gap between letters in your main text and headings by at least 0.35 em. This extra space makes each character distinct and reduces the mental effort of decoding words.

<strong>WCAG</strong>
1.4.12 Text Spacing

<strong>For More Information Please Visit: </strong>
<a href="https://www.w3.org/WAI/WCAG22/Understanding/text-spacing.html" target="_blank" rel="noopener">
Understanding 1.4.12: Text Spacing
</a>
<a href="https://cdn.bdadyslexia.org.uk/uploads/documents/Advice/style-guide/BDA-Style-Guide-2023.pdf?v=1680514568" target="_blank" rel="noopener">
Dyslexia Style Guide
</a>
`.trim(),
    check: `() => {
      // Sample paragraphs, list items, links and labels
      const elems = Array.from(document.querySelectorAll("p, li, a, label"));
      const bad = new Set();
      elems.forEach(el => {
        const style = getComputedStyle(el);
        const fs = parseFloat(style.fontSize);
        const raw = style.letterSpacing;
        // treat "normal" as zero spacing
        const ls = raw === "normal" ? 0 : parseFloat(raw);
        const threshold = fs * 0.35;
        if (ls < threshold) {
          bad.add(\`\${raw} on <\${el.tagName.toLowerCase()}> (needs ≥ \${threshold.toFixed(1)}px)\`);
        }
      });
      return {
        count: bad.size,
        locations: Array.from(bad)
      };
    }`
  },

  darkOnLight: {
  title: "Dark Text on Light Background",
  recommendation: `
<strong>Why it matters</strong>
Areas of pure-white (#ffffff) behind dark text can create visual glare, forcing readers, especially those with dyslexia, ADHD or memory challenges to slow down or lose their place.

<strong>How to fix</strong>
If you use a white background, pick a very light grey (for example #f5f5f5) or add a subtle off-white panel behind text so there’s less contrast fatigue.

<strong>Note</strong>
This check flags only pure-white backgrounds. For full WCAG-compliant contrast testing (≥4.5:1), you would need a true luminance-based ratio check which can be done on:

<a href="https://webaim.org/resources/contrastchecker/ target="_blank" rel="noopener">
Contrast Checker by WebAim
</a>
  `.trim(),
  check: `() => {
    const bad = new Set();
    document.querySelectorAll("*").forEach(el => {
      const style = getComputedStyle(el);
      if (style.backgroundImage !== "none") return;
      const bg = style.backgroundColor;
      const m = bg.match(/rgba?\\((\\d+),\\s*(\\d+),\\s*(\\d+)/);
      if (!m) return;
      const r = +m[1], g = +m[2], b = +m[3];
      if (r !== 255 || g !== 255 || b !== 255) return;

      // Build a short descriptor:
      let desc = el.tagName.toLowerCase();
      if (el.id) desc += "#" + el.id;
      else if (el.classList.length) desc += "." + el.classList[0];

      // If it’s a link or button, grab a text snippet too:
      const tag = el.tagName.toLowerCase();
      if (tag === "a" || tag === "button") {
        const txt = el.innerText.trim().slice(0, 30).replace(/\\s+/g, " ");
        if (txt) {
          // *** use concatenation here, not backticks ***
          desc += ' (“' + txt + (el.innerText.length > 30 ? "…" : "") + '”)';
        }
      }

      bad.add(bg + " on <" + desc + ">");
    });
    return { count: bad.size, locations: Array.from(bad) };
  }`
},

textAlignment: {
  title: "Left-Aligned Text (No Justification)",
    recommendation: `
<strong>Why it matters</strong>
Justified text creates uneven spacing between words (so-called “rivers” of white space) that forces readers to track each line more carefully. That extra effort can break the focus of people with dyslexia, ADHD or memory challenges.

<strong>How to fix</strong>
Remove any text-align: justify declarations and ensure your paragraphs and headings use ragged-right alignment (for example, text-align: left) so that lines end unevenly instead of creating rivers of white space.

<strong>WCAG</strong>
1.4.8 Visual Representation

<strong>For More Information Please Visit: </strong>
<a href="https://www.w3.org/WAI/WCAG21/Understanding/visual-presentation.html" target="_blank" rel="noopener">
Understanding 1.4.8: Visual Representation
</a>
<a href="https://www.boia.org/blog/why-justified-or-centered-text-is-bad-for-accessibility" target="_blank" rel="noopener">
Why Justified (or Centered) Text is Bad for Accessibility?
</a>
`.trim(),
  check: `() => {
    const all = Array.from(document.querySelectorAll("*"));
    const justified = new Set();
    let hasLeft = false;

    all.forEach(el => {
      const style = getComputedStyle(el);
      const ta    = style.textAlign;
      // SAFELY grab any text, even if innerText is undefined
      const text  = (el.innerText || el.textContent || "").trim();
      // only consider elements with substantial visible text
      if (text.length > 20) {
        if (ta === "justify") {
          let desc = el.tagName.toLowerCase();
          if (el.id) desc += "#" + el.id;
          else if (el.classList.length) desc += "." + el.classList[0];
          justified.add(text + " [on <" + desc + ">]");
        } else if (ta === "left" || ta === "start") {
          hasLeft = true;
        }
      }
    });

    const locations = Array.from(justified);
    if (!hasLeft) {
      locations.push("No text found with left-alignment on substantial text elements");
    }

    return {
      count: locations.length,
      locations
    };
  }`
},

  noUnderlinesItalics: {
    title: "Avoid Underlines & Italics",
    recommendation: `
<strong>Why it matters</strong>
Italics tilt and squeeze letters, and underlines can hide key parts of characters. For someone with dyslexia, that makes word shapes harder to recognise. For readers with ADHD, the extra visual noise can pull their focus away and make it easy to lose their place. Both groups end up slowing down and working much harder to get through the text.

<strong>How to fix</strong>
Use clear, solid emphasis like "strong" (bold) or a high-contrast colour instead of "em" (italics or underlines).

<strong>For More Information Please Visit: </strong>
<a href="https://uit.stanford.edu/accessibility/concepts/typography" target="_blank" rel="noopener">
Best Practices of Typography
</a>
<a href="https://design.homeoffice.gov.uk/accessibility/page-structure/layout-typography" target="_blank" rel="noopener">
GOV.UK Advice on Layout and Typography
</a>
`.trim(),
    check: `() => {
      const bad = new Set();

      // Helper to get the first up-to-5 words of any element
      function snippet(el) {
        const raw = (el.innerText || el.textContent || "").trim();
        return raw.split(/\\s+/).slice(0, 5).join(" ");
      }

      // 1) <em> and <i> tags (unless they’re inside an <a>)
      document.querySelectorAll("em, i").forEach(el => {
        if (el.closest("a")) return;
        const text = snippet(el);
        let desc   = el.tagName.toLowerCase();
        if (el.id)       desc += "#" + el.id;
        else if (el.classList.length) desc += "." + el.classList[0];
        bad.add("italic on “" + text + "…” [<" + desc + ">]");
      });

      // 2) Any element styled italic or underlined (unless inside an <a>)
      document.querySelectorAll("*").forEach(el => {
        if (el.closest("a")) return;
        const style = getComputedStyle(el);
        const isItalic     = style.fontStyle === "italic";
        const isUnderlined = (style.textDecorationLine || "").includes("underline");
        if (isItalic || isUnderlined) {
          const text = snippet(el);
          let desc   = el.tagName.toLowerCase();
          if (el.id)       desc += "#" + el.id;
          else if (el.classList.length) desc += "." + el.classList[0];
          bad.add(
            (isItalic     ? "italic on “"     + text + "…” [<" + desc + ">]" : "") +
            (isUnderlined ? "underline on “" + text + "…” [<" + desc + ">]" : "")
          );
        }
      });

      return {
        count: bad.size,
        locations: Array.from(bad)
      };
    }`
  },

     noUnpredictableBehavior: {
    title: "No Unpredictable Behavior",
   recommendation: `
<strong>Why it matters</strong>
Sudden focus shifts, pop-ups or live announcements can pull readers away from what they’re doing, making it hard for people with ADHD or those who struggle with staying organised to regain their focus.

<strong>How to fix</strong>
• Remove any <code>autofocus</code> attributes so the page doesn’t grab focus on load.  
• Strip out inline <code>onfocus</code> and <code>onsubmit</code> handlers; instead use event listeners in script so you can control when they fire.  
• Change any <code>aria-live="assertive"</code> regions to <code>aria-live="polite"</code> or remove them entirely, letting users request updates rather than be interrupted.  

<strong>WCAG</strong>
3.2.1 On Focus
3.2.2 On Input
4.1.3 Status Messages

<strong>For More Information Please Visit: </strong>
<a href="https://www.w3.org/WAI/WCAG21/Understanding/on-focus.html" target="_blank" rel="noopener">
Underatanding WCAG 3.2.1: On Focus
</a>
<a href="https://www.w3.org/WAI/WCAG22/Understanding/on-input.html" target="_blank" rel="noopener">
Underatanding WCAG 3.2.2: On Input
</a>
<a href="https://www.w3.org/WAI/WCAG21/Understanding/status-messages.html" target="_blank" rel="noopener">
Underatanding WCAG 4.1.3: Status Messages
</a>
`.trim(),
    check: `() => {
      // Helper: build a concise, deduped snippet or use aria-label
      function getSnippet(el) {
        const tag = el.tagName.toLowerCase();
        const id  = el.id ? '#' + el.id : '';
        const cls = el.className
          ? '.' + el.className.trim().split(/\\s+/).join('.')
          : '';

        // 1) If aria-label present, use it directly
        const aria = el.getAttribute('aria-label');
        if (aria) {
          return '<' + tag + id + cls + '> "' + aria + '"';
        }

        // 2) Otherwise grab innerText, normalize whitespace
        let text = (el.innerText || '')
          .trim()
          .replace(/\\s+/g, ' ');

        // 3) Dedupe consecutive identical words
        const words = text.split(' ');
        const deduped = words.filter((w,i) =>
          i === 0 || w.toLowerCase() !== words[i-1].toLowerCase()
        );

        // 4) Take the first 5 distinct words for snippet
        const snippet = deduped.slice(0,5).join(' ');
        return '<' + tag + id + cls + '> "' +
               snippet +
               (deduped.length > 5 ? '…"' : '"');
      }

      const issues = [];

      // 1) autofocus attributes
      document.querySelectorAll('[autofocus]').forEach(el =>
        issues.push('Autofocus on ' + getSnippet(el))
      );

      // 2) inline onfocus / onsubmit handlers
      document.querySelectorAll('[onfocus]').forEach(el =>
        issues.push('onfocus handler on ' + getSnippet(el))
      );
      document.querySelectorAll('form[onsubmit]').forEach(f =>
        issues.push('onsubmit handler on ' + getSnippet(f))
      );

      // 3) forms without an explicit submit button
      document.querySelectorAll('form').forEach(f => {
        const hasSubmit = f.querySelector('button[type=submit], input[type=submit]');
        if (!hasSubmit) {
          issues.push('Form missing submit button: ' + getSnippet(f));
        }
      });

      // 4) nav elements hidden via CSS or hidden attribute
      document.querySelectorAll('nav').forEach(nav => {
        const style = getComputedStyle(nav);
        if (style.display === 'none' || nav.hidden) {
          issues.push('Hidden navigation: ' + getSnippet(nav));
        }
      });

      // 5) only assertive live regions (they interrupt users)
      document.querySelectorAll('[aria-live="assertive"]').forEach(r => {
        issues.push('Assertive live region: ' + getSnippet(r));
      });

      return {
        count: issues.length,
        locations: issues
      };
    }`
  },

noAutoContentRefresh: {
  title: "Avoid Auto-Refreshing Content",
  recommendation: `
<strong>Why it matters</strong>
Automatic page reloads or live updates pull readers out of their flow and make it hard to remember where they were. That disruption is especially difficult for people with ADHD or memory challenges.

<strong>How to fix</strong>
Remove any <code>&lt;meta http-equiv="refresh"&gt;</code> tags and disable automatic timers in your scripts. Instead, add a clear “Refresh” button or show an “Update available” notice that users can click when they’re ready.

<strong>WCAG</strong>
2.2.1 Timing Adjustable 

<strong>For More Information Please Visit: </strong>
<a href="https://www.w3.org/WAI/WCAG21/Understanding/timing-adjustable.html" target="_blank" rel="noopener">
Understanding WCAG 2.2.1: Timing Adjustable
</a>
`.trim(),
  check: `() => {
    const issues = [];

    // 1) Meta-refresh tags
    document.querySelectorAll('meta[http-equiv="refresh"]').forEach(m => {
      const content = m.getAttribute('content');
      issues.push('Meta refresh set to ' + content + ' seconds');
    });

    // Helper: grab the full call by matching parentheses
    function extractCall(txt, fnName, maxLen = 200) {
      const start = txt.indexOf(fnName);
      if (start < 0) return null;
      let depth = 0, pos = start;
      while (pos < txt.length) {
        const ch = txt[pos++];
        if (ch === '(') depth++;
        else if (ch === ')') {
          depth--;
          if (depth === 0) {
            let call = txt.slice(start, pos).replace(/\\s+/g, ' ');
            return call.length > maxLen
              ? call.slice(0, maxLen - 1) + '…'
              : call;
          }
        }
      }
      return null;
    }

    // 2) Scan each <script> for timers
    Array.from(document.scripts).forEach((s, idx) => {
      const txt = s.innerText || '';
      // find whichever call exists
      const callSnippet =
        extractCall(txt, 'setTimeout(') ||
        extractCall(txt, 'setInterval(') ||
        null;

      // build locator
      let locator;
      if (s.src) {
        locator = s.src; // external file
      } else {
        // inline: script number + call snippet (or fallback)
        const preview = callSnippet
          ? (callSnippet.length > 60
              ? callSnippet.slice(0, 57) + '…'
              : callSnippet)
          : (txt.trim().slice(0, 50) + (txt.length > 50 ? '…' : ''));
        locator = 'inline script #' + (idx+1)
                  + ' — snippet: "' + preview + '"';
      }

      // now report both types
      const interval = extractCall(txt, 'setInterval(');
      if (interval) issues.push('Auto-update via ' + interval + ' in ' + locator);

      const timeout = extractCall(txt, 'setTimeout(');
      if (timeout)  issues.push('Auto-update via ' + timeout  + ' in ' + locator);
    });

    // 3) Rapid DOM changes (2s sample)
    let mutationCount = 0;
    const obs = new MutationObserver(m => mutationCount += m.length);
    obs.observe(document.body, {
      childList: true, subtree: true,
      attributes: true, characterData: true
    });
    const end = Date.now() + 2000;
    while (Date.now() < end) {}  // busy-wait in page context
    obs.disconnect();
    if (mutationCount > 20) {
      issues.push('High DOM mutation rate: ' + mutationCount + ' changes in 2s');
    }

    return { count: issues.length, locations: issues };
  }`
},

rapidFlashes: {
  title: "Rapid-Flashing Content",
  recommendation: `
<strong>Why it matters</strong><br>
Content that flashes more than three times per second can trigger seizures and makes it impossible for readers with ADHD to follow or stay on task.

<strong>How to fix</strong><br>
Remove or slow any blinking or flashing effects so they do not cycle more than three times per second. If you must use rapid motion, provide a visible “Pause animations” control so users can stop it.

<strong>WCAG</strong><br>
2.3.2 Three Flashes or Below Threshold

<strong>For more information please visit:</strong><br>
<a href="https://www.w3.org/WAI/WCAG21/Understanding/three-flashes.html"
   target="_blank" rel="noopener">
Understanding 2.3.2: Three Flashes
</a>
  `.trim(),
  check: `() => {
    // Grab every element and track its opacity over one second
    const records = Array.from(document.querySelectorAll('*')).map(el => ({
      el,
      last: parseFloat(getComputedStyle(el).opacity) || 0,
      toggles: 0
    }));
    const end = Date.now() + 1000;
    while (Date.now() < end) {
      records.forEach(rec => {
        let curr;
        try {
          curr = parseFloat(getComputedStyle(rec.el).opacity) || 0;
        } catch {
          return;
        }
        if (curr !== rec.last) {
          rec.toggles++;
          rec.last = curr;
        }
      });
    }
    // More than six opacity changes = over 3 full flashes
    const issues = records
      .filter(r => r.toggles > 6)
      .map(r => {
        let sel = r.el.tagName.toLowerCase();
        if (r.el.id) sel += '#' + r.el.id;
        else if (r.el.classList.length) sel += '.' + r.el.classList[0];
        return \`\${sel} (flashed \${(r.toggles/2).toFixed(1)}×)\`;
      });
    return { count: issues.length, locations: issues };
  }`
}


};
