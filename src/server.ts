import { readFileSync } from "node:fs";
import express, { type Express, type NextFunction, type Request, type Response } from "express";
import { rateLimit } from "express-rate-limit";
import { loadConfig } from "./config.js";
import { createItemsRouter } from "./items.js";
import { logger } from "./logger.js";
import { requestIdMiddleware } from "./requestId.js";

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
  const config = loadConfig();
  const app = express();

  app.use(requestIdMiddleware);

  app.use((req, res, next) => {
    const start = Date.now();
    res.on("finish", () => {
      logger.info("request", {
        method: req.method,
        path: req.path,
        status: res.statusCode,
        durationMs: Date.now() - start,
        requestId: res.locals.requestId,
      });
    });
    next();
  });

  const healthRateLimit = rateLimit({
    windowMs: 60_000,
    limit: 60,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_req, _res, next) => next(new HttpError(429, "Too Many Requests")),
  });

  app.use("/health", healthRateLimit);

  app.use("/items", createItemsRouter());

  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.get("/health/details", (_req, res) => {
    res.json({
      status: "ok",
      version: readVersion(),
      uptimeSeconds: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
      env: config.nodeEnv,
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
  const requestId = res.locals.requestId as string | undefined;

  if (status >= 500) {
    logger.error(message, { status, stack: err instanceof Error ? err.stack : undefined, requestId });
  } else {
    logger.warn(message, { status, requestId });
  }

  res.status(status).json({ error: message });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { port } = loadConfig();
  const server = createApp().listen(port, () => {
    logger.info("server listening", { port });
  });

  const shutdown = (signal: string): void => {
    logger.info("shutting down", { signal });

    const forceExitTimer = setTimeout(() => {
      logger.error("shutdown timed out, forcing exit");
      process.exit(1);
    }, 10_000);
    forceExitTimer.unref();

    server.close((err) => {
      if (err) {
        logger.error("shutdown failed", { error: err.message });
        process.exit(1);
      }
      clearTimeout(forceExitTimer);
      logger.info("shutdown complete");
      process.exit(0);
    });
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}
