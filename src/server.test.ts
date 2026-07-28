import express from "express";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";
import { createApp, errorHandler, HttpError } from "./server.js";
import { requestIdMiddleware } from "./requestId.js";

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

describe("request id", () => {
  it("echoes a client-supplied X-Request-Id header through the full app", async () => {
    const res = await request(createApp()).get("/health").set("X-Request-Id", "my-correlation-id");
    expect(res.headers["x-request-id"]).toBe("my-correlation-id");
  });

  it("generates an X-Request-Id header when the client sends none", async () => {
    const res = await request(createApp()).get("/health");
    expect(res.headers["x-request-id"]).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
  });

  it("sets X-Request-Id on error responses too", async () => {
    const res = await request(createApp()).get("/does-not-exist").set("X-Request-Id", "error-path-id");
    expect(res.status).toBe(404);
    expect(res.headers["x-request-id"]).toBe("error-path-id");
  });

  describe("log correlation", () => {
    let logSpy: ReturnType<typeof vi.spyOn>;
    let errorSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      logSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);
      errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    });

    afterEach(() => {
      logSpy.mockRestore();
      errorSpy.mockRestore();
    });

    it("includes requestId in the request log line", async () => {
      await request(createApp()).get("/health").set("X-Request-Id", "log-correlation-id");

      const entry = JSON.parse(logSpy.mock.calls[0][0] as string);
      expect(entry).toMatchObject({ message: "request", requestId: "log-correlation-id" });
    });

    it("includes requestId in the error log line", async () => {
      const app = express();
      app.use(requestIdMiddleware);
      app.get("/boom", (_req, _res, next) => next(new Error("kaboom")));
      app.use(errorHandler);

      await request(app).get("/boom").set("X-Request-Id", "error-log-id");

      const entry = JSON.parse(errorSpy.mock.calls[0][0] as string);
      expect(entry).toMatchObject({ message: "kaboom", requestId: "error-log-id" });
    });
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
