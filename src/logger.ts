type Level = "debug" | "info" | "warn" | "error";

const LEVEL_WEIGHT: Record<Level, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

function currentLevel(): Level {
  const level = process.env.LOG_LEVEL as Level | undefined;
  return level && level in LEVEL_WEIGHT ? level : "info";
}

function write(level: Level, message: string, meta?: Record<string, unknown>): void {
  if (LEVEL_WEIGHT[level] < LEVEL_WEIGHT[currentLevel()]) return;

  const entry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...meta,
  };

  const line = JSON.stringify(entry);
  if (level === "error" || level === "warn") {
    console.error(line);
  } else {
    console.log(line);
  }
}

export const logger = {
  debug: (message: string, meta?: Record<string, unknown>) => write("debug", message, meta),
  info: (message: string, meta?: Record<string, unknown>) => write("info", message, meta),
  warn: (message: string, meta?: Record<string, unknown>) => write("warn", message, meta),
  error: (message: string, meta?: Record<string, unknown>) => write("error", message, meta),
};
