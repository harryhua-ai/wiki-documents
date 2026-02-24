/**
 * Browser Compatibility Polyfills
 *
 * 为旧浏览器（特别是 WebKit/Safari）提供必要的 polyfill
 */

// 静态导入 polyfills（Docusaurus 构建需要）
import 'intersection-observer';
import ResizeObserverPolyfill from 'resize-observer-polyfill';

if (typeof window !== 'undefined') {
  // 应用 ResizeObserver polyfill
  if (!('ResizeObserver' in window)) {
    (window as any).ResizeObserver = ResizeObserverPolyfill;
  }

  // Object.fromEntries polyfill (ES2019)
  if (!Object.fromEntries) {
    Object.fromEntries = function(entries) {
      if (!entries) {
        throw new Error('Object.fromEntries() requires a single iterable argument');
      }
      const obj = {};
      for (const [key, value] of entries) {
        obj[key] = value;
      }
      return obj;
    };
  }

  // String.prototype.matchAll polyfill (ES2020)
  if (!String.prototype.matchAll) {
    String.prototype.matchAll = function(regex) {
      if (regex instanceof RegExp === false) {
        throw new Error('matchAll requires a RegExp');
      }
      const matches = [];
      const string = this;
      let match;
      while ((match = regex.exec(string)) !== null) {
        matches.push(match);
      }
      return matches;
    };
  }

  // Array.prototype.flat polyfill (ES2019)
  if (!Array.prototype.flat) {
    Array.prototype.flat = function(depth = 1) {
      return this.reduce((acc, val) => {
        if (Array.isArray(val) && depth > 0) {
          acc.push(...val.flat(depth - 1));
        } else {
          acc.push(val);
        }
        return acc;
      }, []);
    };
  }

  // Array.prototype.flatMap polyfill (ES2019)
  if (!Array.prototype.flatMap) {
    Array.prototype.flatMap = function(callback, thisArg) {
      return this.reduce((acc, val, i, arr) => {
        const result = callback.call(thisArg, val, i, arr);
        if (Array.isArray(result)) {
          acc.push(...result);
        } else {
          acc.push(result);
        }
        return acc;
      }, []);
    };
  }

  // Promise.allSettled polyfill (ES2020)
  if (!Promise.allSettled) {
    Promise.allSettled = function(promises) {
      return Promise.all(
        promises.map(p =>
          Promise.resolve(p).then(
            value => ({ status: 'fulfilled', value }),
            reason => ({ status: 'rejected', reason })
          )
        )
      );
    };
  }

  // console.log polyfill for older browsers
  if (!window.console) {
    window.console = {
      log: () => {},
      error: () => {},
      warn: () => {},
      info: () => {},
    };
  }
}

export {};
