import express, { type Express } from "express";
import { logger } from "./logger.js";

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

  return app;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const port = process.env.PORT ? Number(process.env.PORT) : 3000;
  createApp().listen(port, () => {
    logger.info("server listening", { port });
  });
}
