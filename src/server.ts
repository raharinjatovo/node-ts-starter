import { readFileSync } from "node:fs";
import express, { type Express, type NextFunction, type Request, type Response } from "express";
import { logger } from "./logger.js";

export class HttpError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

function readVersion(): string {
  try {
    const pkgUrl = new URL("../package.json", import.meta.url);
    const pkg = JSON.parse(readFileSync(pkgUrl, "utf-8")) as { version?: string };
    return pkg.version ?? "unknown";
  } catch {
    return "unknown";
  }
}

export function createApp(): Express {
  const app = express();

  app.use((req, res, next) => {
    const start = Date.now();
    res.on("finish", () => {
      logger.info("request", {
        method: req.method,
        path: req.path,
        status: res.statusCode,
        durationMs: Date.now() - start,
      });
    });
    next();
  });

  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.get("/health/details", (_req, res) => {
    res.json({
      status: "ok",
      version: readVersion(),
      uptimeSeconds: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
      env: process.env.NODE_ENV ?? "development",
    });
  });

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

export function notFoundHandler(_req: Request, res: Response): void {
  res.status(404).json({ error: "Not Found" });
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  const status = err instanceof HttpError ? err.status : 500;
  const message = err instanceof Error ? err.message : "Internal Server Error";

  if (status >= 500) {
    logger.error(message, { status, stack: err instanceof Error ? err.stack : undefined });
  } else {
    logger.warn(message, { status });
  }

  res.status(status).json({ error: message });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const port = process.env.PORT ? Number(process.env.PORT) : 3000;
  createApp().listen(port, () => {
    logger.info("server listening", { port });
  });
}
