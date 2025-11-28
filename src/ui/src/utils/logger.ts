/**
 * Centralized JSON logging utility for AgenticTableTop Frontend
 * 
 * All logs are formatted as JSON with timestamps for easy parsing and analysis.
 */

interface LogEntry {
  timestamp: string;
  level: 'DEBUG' | 'INFO' | 'WARNING' | 'ERROR';
  message: string;
  module?: string;
  function?: string;
  [key: string]: any; // Allow additional fields
}

class Logger {
  private formatLog(level: LogEntry['level'], message: string, extra: Record<string, any> = {}): LogEntry {
    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...extra,
    };

    // Add caller information if available
    if (Error.stackTraceLimit) {
      const stack = new Error().stack;
      if (stack) {
        const lines = stack.split('\n');
        // Try to extract function name from stack trace
        if (lines.length > 3) {
          const callerLine = lines[3];
          const match = callerLine.match(/at\s+(\w+)/);
          if (match) {
            logEntry.function = match[1];
          }
        }
      }
    }

    return logEntry;
  }

  private output(level: LogEntry['level'], message: string, extra: Record<string, any> = {}): void {
    const logEntry = this.formatLog(level, message, extra);
    const jsonString = JSON.stringify(logEntry);

    // Use appropriate console method based on level
    switch (level) {
      case 'ERROR':
        console.error(jsonString);
        break;
      case 'WARNING':
        console.warn(jsonString);
        break;
      case 'DEBUG':
        console.debug(jsonString);
        break;
      case 'INFO':
      default:
        console.log(jsonString);
        break;
    }
  }

  info(message: string, extra: Record<string, any> = {}): void {
    this.output('INFO', message, extra);
  }

  error(message: string, extra: Record<string, any> = {}): void {
    this.output('ERROR', message, extra);
  }

  warn(message: string, extra: Record<string, any> = {}): void {
    this.output('WARNING', message, extra);
  }

  debug(message: string, extra: Record<string, any> = {}): void {
    this.output('DEBUG', message, extra);
  }
}

// Export singleton instance
export const logger = new Logger();

// Export Logger class for custom instances
export default Logger;

