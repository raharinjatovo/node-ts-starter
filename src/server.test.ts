import express from "express";
import { describe, expect, it } from "vitest";
import request from "supertest";
import { createApp, errorHandler, HttpError } from "./server.js";

describe("GET /health", () => {
  it("returns status ok", async () => {
    const res = await request(createApp()).get("/health");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok" });
  });
});

describe("GET /health/details", () => {
  it("returns status, version, uptime, timestamp, and env", async () => {
    const res = await request(createApp()).get("/health/details");
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ status: "ok" });
    expect(typeof res.body.version).toBe("string");
    expect(typeof res.body.uptimeSeconds).toBe("number");
    expect(typeof res.body.env).toBe("string");
    expect(new Date(res.body.timestamp).toString()).not.toBe("Invalid Date");
  });
});

describe("rate limiting on /health*", () => {
  it("returns 429 once the limit is exceeded", async () => {
    const app = createApp();

    for (let i = 0; i < 60; i++) {
      const res = await request(app).get("/health");
      expect(res.status).toBe(200);
    }

    const res = await request(app).get("/health/details");
    expect(res.status).toBe(429);
    expect(res.body).toEqual({ error: "Too Many Requests" });
  });
});

describe("unmatched routes", () => {
  it("returns 404 with a JSON error body", async () => {
    const res = await request(createApp()).get("/does-not-exist");
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: "Not Found" });
  });
});

describe("error handling", () => {
  function appWithRoute(handler: express.RequestHandler) {
    const app = express();
    app.get("/boom", handler);
    app.use(errorHandler);
    return app;
  }

  it("maps HttpError to its status and message", async () => {
    const app = appWithRoute((_req, _res, next) => next(new HttpError(400, "bad input")));
    const res = await request(app).get("/boom");
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: "bad input" });
  });

  it("defaults unknown errors to 500", async () => {
    const app = appWithRoute((_req, _res, next) => next(new Error("kaboom")));
    const res = await request(app).get("/boom");
    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: "kaboom" });
  });
});
