type Level = 'info' | 'warn' | 'error' | 'debug';

const stamp = () => new Date().toISOString();

const write = (level: Level, message: string, meta?: unknown) => {
  if (process.env.NODE_ENV === 'test' && level === 'debug') return;
  const line = `[${stamp()}] ${level.toUpperCase()} ${message}`;
  const args = meta === undefined ? [line] : [line, meta];
  if (level === 'error') console.error(...args);
  else if (level === 'warn') console.warn(...args);
  else console.log(...args);
};

export const logger = {
  info: (m: string, meta?: unknown) => write('info', m, meta),
  warn: (m: string, meta?: unknown) => write('warn', m, meta),
  error: (m: string, meta?: unknown) => write('error', m, meta),
  debug: (m: string, meta?: unknown) => write('debug', m, meta),
};
