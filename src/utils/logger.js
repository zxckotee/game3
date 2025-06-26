/**
 * Utility for controlling log output
 */

// Import config
const config = require('../config/app-config');

// Log levels
const LOG_LEVELS = {
  ERROR: 0,   // Only errors
  WARN: 1,    // Errors and warnings
  INFO: 2,    // Normal information
  DEBUG: 3,   // Detailed debugging information
  VERBOSE: 4  // Very detailed frequent updates (like time updates)
};

// Default log level based on environment
const DEFAULT_LOG_LEVEL = config.common.debugMode ? LOG_LEVELS.INFO : LOG_LEVELS.ERROR;

// Allow override through config or environment variable
const currentLogLevel = config.common.logLevel !== undefined 
  ? config.common.logLevel 
  : (process.env.LOG_LEVEL ? parseInt(process.env.LOG_LEVEL, 10) : DEFAULT_LOG_LEVEL);

// Map of log types that should be suppressed even at higher log levels
// This allows selective filtering of noisy logs while keeping others at the same level
const SUPPRESSED_LOG_TYPES = [
  'UPDATE_TIME', // Suppress the frequent time update logs
  'FORCE_SYNC',
  'SYNC_SEASON_DAY'
];

/**
 * Checks if a message should be suppressed based on content
 * @param {string} message - The message to check
 * @returns {boolean} - True if the message should be suppressed
 */
function shouldSuppressMessage(message) {
  if (!message) return false;
  
  return SUPPRESSED_LOG_TYPES.some(type => 
    typeof message === 'string' && message.includes(type)
  );
}

/**
 * Logs a message if the current log level permits it
 * @param {string} level - The log level for this message
 * @param {string} message - The message to log
 * @param {Object} [data] - Optional data to include
 */
function log(level, message, data) {
  // Skip logging entirely for suppressed message types
  if (shouldSuppressMessage(message)) {
    return;
  }
  
  if (level <= currentLogLevel) {
    switch(level) {
      case LOG_LEVELS.ERROR:
        console.error(message, data || '');
        break;
      case LOG_LEVELS.WARN:
        console.warn(message, data || '');
        break;
      case LOG_LEVELS.INFO:
        console.log(message, data || '');
        break;
      case LOG_LEVELS.DEBUG:
        console.log(message, data || '');
        break;
      case LOG_LEVELS.VERBOSE:
        // Only log verbose if we're at VERBOSE level and it's not in suppressed types
        console.log(message, data || '');
        break;
    }
  }
}

// Convenience methods
const logger = {
  error: (message, data) => log(LOG_LEVELS.ERROR, message, data),
  warn: (message, data) => log(LOG_LEVELS.WARN, message, data),
  info: (message, data) => log(LOG_LEVELS.INFO, message, data),
  debug: (message, data) => log(LOG_LEVELS.DEBUG, message, data),
  verbose: (message, data) => log(LOG_LEVELS.VERBOSE, message, data),
  LOG_LEVELS
};

module.exports = logger;
