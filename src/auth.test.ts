import express from "express";
import jwt from "jsonwebtoken";
import { describe, expect, it } from "vitest";
import request from "supertest";
import { requireAuth } from "./auth.js";
import { DEV_JWT_SECRET } from "./config.js";
import { errorHandler } from "./server.js";

function appWithProtectedRoute() {
  const app = express();
  app.get("/protected", requireAuth(DEV_JWT_SECRET), (_req, res) => {
    res.json({ ok: true });
  });
  app.use(errorHandler);
  return app;
}

describe("requireAuth", () => {
  it("calls next() and reaches the route when the token is valid", async () => {
    const token = jwt.sign({}, DEV_JWT_SECRET);
    const res = await request(appWithProtectedRoute()).get("/protected").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
  });

  it("returns 401 with a JSON error body when the Authorization header is missing", async () => {
    const res = await request(appWithProtectedRoute()).get("/protected");
    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: "Unauthorized" });
  });

  it('returns 401 when the Authorization header is not "Bearer <token>"', async () => {
    const res = await request(appWithProtectedRoute()).get("/protected").set("Authorization", "garbage-token");
    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: "Unauthorized" });
  });

  it("returns 401 when the token is signed with the wrong secret", async () => {
    const forgedToken = jwt.sign({}, "wrong-secret");
    const res = await request(appWithProtectedRoute())
      .get("/protected")
      .set("Authorization", `Bearer ${forgedToken}`);
    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: "Unauthorized" });
  });

  it("returns 401 when the token is expired", async () => {
    const expiredToken = jwt.sign({}, DEV_JWT_SECRET, { expiresIn: -10 });
    const res = await request(appWithProtectedRoute())
      .get("/protected")
      .set("Authorization", `Bearer ${expiredToken}`);
    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: "Unauthorized" });
  });
});
