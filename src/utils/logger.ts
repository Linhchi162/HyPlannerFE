/**
 * Logger utility for production-safe logging
 * Automatically disables logs in production builds
 */

const isDev = __DEV__;

export const logger = {
  /**
   * Log general information (disabled in production)
   */
  log: (...args: any[]) => {
    if (isDev) {
      console.log(...args);
    }
  },

  /**
   * Log errors (always enabled, but sanitized in production)
   */
  error: (...args: any[]) => {
    if (isDev) {
      console.error(...args);
    } else {
      // In production, log errors to error tracking service (Sentry, etc.)
      // For now, silently fail to avoid exposing sensitive info
      console.error("[ERROR]", args[0]); // Only log first arg in production
    }
  },

  /**
   * Log warnings (disabled in production)
   */
  warn: (...args: any[]) => {
    if (isDev) {
      console.warn(...args);
    }
  },

  /**
   * Log debug information (disabled in production)
   */
  debug: (...args: any[]) => {
    if (isDev) {
      console.debug(...args);
    }
  },

  /**
   * Log info (disabled in production)
   */
  info: (...args: any[]) => {
    if (isDev) {
      console.info(...args);
    }
  },
};

export default logger;
