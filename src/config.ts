import { LOG_LEVELS, type Level } from "./logger.js";

export type NodeEnv = "development" | "production" | "test";

const NODE_ENVS: readonly NodeEnv[] = ["development", "production", "test"];

export interface AppConfig {
  port: number;
  nodeEnv: NodeEnv;
  logLevel: Level;
}

function parsePort(raw: string | undefined): number {
  if (raw === undefined) return 3000;

  const port = Number(raw);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`Invalid PORT: "${raw}" (must be an integer between 1 and 65535)`);
  }
  return port;
}

function parseNodeEnv(raw: string | undefined): NodeEnv {
  if (raw === undefined) return "development";

  if (!NODE_ENVS.includes(raw as NodeEnv)) {
    throw new Error(`Invalid NODE_ENV: "${raw}" (must be one of ${NODE_ENVS.join(", ")})`);
  }
  return raw as NodeEnv;
}

function parseLogLevel(raw: string | undefined): Level {
  if (raw === undefined) return "info";

  if (!LOG_LEVELS.includes(raw as Level)) {
    throw new Error(`Invalid LOG_LEVEL: "${raw}" (must be one of ${LOG_LEVELS.join(", ")})`);
  }
  return raw as Level;
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  return {
    port: parsePort(env.PORT),
    nodeEnv: parseNodeEnv(env.NODE_ENV),
    logLevel: parseLogLevel(env.LOG_LEVEL),
  };
}
