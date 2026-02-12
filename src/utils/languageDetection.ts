/**
 * Language Detection Utility
 * Detects user input language (Chinese vs English) for AI response matching
 */

/**
 * Detect the language of user input text
 * Uses character-based heuristic for Chinese vs English detection
 *
 * @param text - User input text to analyze
 * @returns 'zh-Hans' for Chinese, 'en' for English
 */
export function detectUserLanguage(text: string): 'en' | 'zh-Hans' {
  const trimmedText = text.trim();

  if (!trimmedText) {
    return 'en'; // Default to English
  }

  // Count Chinese characters (CJK Unified Ideographs)
  const chineseRegex = /[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff]/g;
  const chineseMatches = trimmedText.match(chineseRegex);
  const chineseCount = chineseMatches ? chineseMatches.length : 0;

  // Count Latin alphabet characters
  const latinRegex = /[a-zA-Z]/g;
  const latinMatches = trimmedText.match(latinRegex);
  const latinCount = latinMatches ? latinMatches.length : 0;

  const totalChars = chineseCount + latinCount;

  if (totalChars === 0) {
    return 'en'; // Default for unrecognizable input
  }

  // If more than 30% of characters are Chinese, treat as Chinese
  const chineseRatio = chineseCount / totalChars;
  return chineseRatio > 0.3 ? 'zh-Hans' : 'en';
}

/**
 * Normalize locale string to supported language codes
 *
 * @param locale - Locale string (e.g., 'zh-Hans', 'zh-CN', 'en')
 * @returns Normalized language code
 */
export function normalizeLocale(locale: string): 'en' | 'zh-Hans' {
  if (locale.startsWith('zh')) {
    return 'zh-Hans';
  }
  return 'en';
}

/**
 * Get the language to use for AI response
 * Detects from user input, falls back to current locale
 *
 * @param userInput - User's message text
 * @param currentLocale - Current Docusaurus locale
 * @returns Language code for AI response
 */
export function getResponseLanguage(
  userInput: string,
  currentLocale: string
): 'en' | 'zh-Hans' {
  // Always detect from input for immediate response matching
  return detectUserLanguage(userInput);
}
