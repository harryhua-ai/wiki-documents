import { describe, it, expect } from 'vitest';
import { detectUserLanguage, normalizeLocale, getResponseLanguage } from '../languageDetection';

describe('languageDetection', () => {
  describe('detectUserLanguage', () => {
    it('should detect Chinese text', () => {
      expect(detectUserLanguage('你好世界')).toBe('zh-Hans');
    });

    it('should detect English text', () => {
      expect(detectUserLanguage('Hello world')).toBe('en');
    });

    it('should detect mixed text with Chinese > 30% as Chinese', () => {
      // "你好" has 2 Chinese, "Hello" has 5 English = 2/7 = 28.5% < 30%, so English
      expect(detectUserLanguage('你好Hello')).toBe('en');
      // "你好你好" has 4 Chinese, "Hi" has 2 English = 4/6 = 66% > 30%, so Chinese
      expect(detectUserLanguage('你好你好Hi')).toBe('zh-Hans');
    });

    it('should default to English for empty string', () => {
      expect(detectUserLanguage('')).toBe('en');
    });

    it('should default to English for non-Chinese non-English', () => {
      expect(detectUserLanguage('こんにちは')).toBe('en');
    });
  });

  describe('normalizeLocale', () => {
    it('should normalize zh-CN to zh-Hans', () => {
      expect(normalizeLocale('zh-CN')).toBe('zh-Hans');
    });

    it('should normalize zh-TW to zh-Hans (no traditional support)', () => {
      // Current implementation treats all zh variants as zh-Hans
      expect(normalizeLocale('zh-TW')).toBe('zh-Hans');
    });

    it('should normalize en-US to en', () => {
      expect(normalizeLocale('en-US')).toBe('en');
    });

    it('should handle already normalized locales', () => {
      expect(normalizeLocale('zh-Hans')).toBe('zh-Hans');
      expect(normalizeLocale('en')).toBe('en');
    });
  });

  describe('getResponseLanguage', () => {
    it('should return detected language when user text is Chinese', () => {
      expect(getResponseLanguage('你好', 'en')).toBe('zh-Hans');
    });

    it('should return detected language when user text is English', () => {
      expect(getResponseLanguage('Hello', 'zh-Hans')).toBe('en');
    });

    it('should ignore currentLocale and always detect from input', () => {
      // Current implementation doesn't fallback to currentLocale
      expect(getResponseLanguage('!', 'zh-Hans')).toBe('en');
    });

    it('should handle empty text', () => {
      expect(getResponseLanguage('', 'en')).toBe('en');
    });
  });
});
