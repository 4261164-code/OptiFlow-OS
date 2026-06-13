export const logger = {
  info:  (msg: string, meta?: object) => log('INFO',  msg, meta),
  warn:  (msg: string, meta?: object) => log('WARN',  msg, meta),
  error: (msg: string, meta?: object) => log('ERROR', msg, meta),
  audit: (msg: string, meta?: object) => log('AUDIT', msg, meta),
};

function log(level: string, msg: string, meta?: object) {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    message: msg,
    ...meta,
  };
  console[level === 'ERROR' ? 'error' : 'log'](JSON.stringify(entry));
}
