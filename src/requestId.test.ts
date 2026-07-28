import express from "express";
import { describe, expect, it } from "vitest";
import request from "supertest";
import { requestIdMiddleware } from "./requestId.js";

function appWithMiddleware() {
  const app = express();
  app.use(requestIdMiddleware);
  app.get("/", (_req, res) => {
    res.json({ requestId: res.locals.requestId });
  });
  return app;
}

describe("requestIdMiddleware", () => {
  it("echoes a client-supplied X-Request-Id header unchanged", async () => {
    const res = await request(appWithMiddleware()).get("/").set("X-Request-Id", "client-supplied-id");

    expect(res.headers["x-request-id"]).toBe("client-supplied-id");
    expect(res.body.requestId).toBe("client-supplied-id");
  });

  it("generates a UUID when no header is sent", async () => {
    const res = await request(appWithMiddleware()).get("/");

    expect(res.headers["x-request-id"]).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    expect(res.body.requestId).toBe(res.headers["x-request-id"]);
  });
});
