/**
 * =============================================================================
 * profiles.js
 *
 * Maps each cognitive-impairment “profile” to an array of rule IDs (keys from rules.js).
 * When a user selects a profile, only the associated rules will run.
 * =============================================================================
 */

module.exports = {
  // Default “General” profile: run all available rules
  general: [
    "autoplayVideos",
    "imagesWithoutAlt",
    "longSentences",
    "h1Missing",
    "vagueLinkText",
    "formFieldsWithoutLabels",
    "timeBasedContent",
    "blinkingOrMarquee",
    "missingCaptions",
    "noEasyToReadSummaries",
    "missingNavContainer",
    "tooManyNavLinks",       
    "complexVocabulary",
    "fontFamilySansSerif",
    "minFontSize",
    "letterSpacing",
    "darkOnLight",
    "textAlignment",
    "noUnderlinesItalics",
    "noUnpredictableBehavior",
    "noAutoContentRefresh",
    "rapidFlashes"

  
  ],

  // Dyslexia-oriented checks: focus on text simplicity and clear structure
  dyslexia: [
    "imagesWithoutAlt",
    "h1Missing",
    "longSentences",
    "vagueLinkText",
    "missingCaptions",
    "complexVocabulary",
    "fontFamilySansSerif",
    "minFontSize",
    "letterSpacing",
    "darkOnLight",
    "textAlignment",
    "noUnderlinesItalics"
  ],

  // ADHD-oriented checks: minimize distractions, flashing, confusing language
  ADHD: [
    "autoplayVideos",
    "blinkingOrMarquee",
    "missingCaptions",
    "complexVocabulary",
    "vagueLinkText",
    "tooManyNavLinks",
    "noUnpredictableBehavior",
    "noAutoContentRefresh",
    "rapidFlashes"       
  ],

  // Memory-difficulty checks: reinforce structure, summaries, nav container
  memory: [
    "h1Missing",
    "missingCaptions",
    "missingNavContainer",
    "noEasyToReadSummaries",
    "vagueLinkText",
    "tooManyNavLinks"        
  ]
};
