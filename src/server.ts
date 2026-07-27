import express, { type Express } from "express";

export function createApp(): Express {
  const app = express();

  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  return app;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const port = process.env.PORT ? Number(process.env.PORT) : 3000;
  createApp().listen(port, () => {
    console.log(`Server listening on port ${port}`);
  });
}
