// Mock for Docusaurus modules used in tests
import React from 'react';

// Mock @docusaurus/Translate
export const translate = ({ id, message }: { id?: string; message?: string }) => message || id || '';

// Mock @docusaurus/Link
export const Link = ({
  children,
  to,
  ...props
}: {
  children: React.ReactNode;
  to?: string;
  [key: string]: any;
}) => React.createElement('a', { href: to, ...props }, children);

Link.toString = () => 'Link';

// Mock @docusaurus/ExecutionEnvironment
export const ExecutionEnvironment = {
  canUseDOM: true,
  canUseEventListeners: true,
  canUseIntersectionObserver: true,
};

// Mock @docusaurus/theme-common
export const useColorMode = () => ({
  colorMode: 'light',
  setColorMode: () => {},
});

export const useWindowSize = () => ({
  windowSize: { width: 1024, height: 768 },
});

export const useScrollPosition = () => ({
  scrollPosition: { x: 0, y: 0 },
});

// Mock @docusaurus/useGlobals
export const useGlobals = () => ({});

// Mock @docusaurus/useDocusaurusContext
export const useDocusaurusContext = () => ({
  siteConfig: {
    title: 'Test Site',
    url: 'https://test.com',
    baseUrl: '/',
  },
  i18n: {
    currentLocale: 'en',
    locales: ['en', 'zh-Hans'],
  },
});

// Mock @docusaurus/useBaseUrl
export const useBaseUrl = (path: string) => `https://example.com${path}`;

// Default export for some imports
export default {
  translate,
  Link,
  ExecutionEnvironment,
  useColorMode,
  useWindowSize,
  useScrollPosition,
  useGlobals,
  useDocusaurusContext,
  useBaseUrl,
};
