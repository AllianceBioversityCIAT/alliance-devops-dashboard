export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogContext {
  [key: string]: unknown;
}

export interface Logger {
  debug(message: string, context?: LogContext): void;
  info(message: string, context?: LogContext): void;
  warn(message: string, context?: LogContext): void;
  error(message: string, context?: LogContext): void;
  child(context: LogContext): Logger;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

export interface LoggerOptions {
  serviceName?: string;
  level?: LogLevel;
  defaultContext?: LogContext;
}

export function createLogger(options: LoggerOptions = {}): Logger {
  const serviceName = options.serviceName ?? process.env.SERVICE_NAME ?? 'alliance-devops-dashboard';
  const minLevel = options.level ?? (process.env.LOG_LEVEL as LogLevel) ?? 'info';
  const baseContext = { service: serviceName, ...options.defaultContext };

  const write = (level: LogLevel, message: string, context?: LogContext): void => {
    if (LOG_LEVELS[level] < LOG_LEVELS[minLevel]) {
      return;
    }

    const entry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...baseContext,
      ...context,
    };

    const output = JSON.stringify(entry);

    if (level === 'error') {
      console.error(output);
    } else if (level === 'warn') {
      console.warn(output);
    } else {
      console.log(output);
    }
  };

  return {
    debug: (message, context) => write('debug', message, context),
    info: (message, context) => write('info', message, context),
    warn: (message, context) => write('warn', message, context),
    error: (message, context) => write('error', message, context),
    child: (context) =>
      createLogger({
        serviceName,
        level: minLevel,
        defaultContext: { ...baseContext, ...context },
      }),
  };
}
