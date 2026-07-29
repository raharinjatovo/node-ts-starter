import jwt from "jsonwebtoken";
import { describe, expect, it } from "vitest";
import request from "supertest";
import { DEV_JWT_SECRET } from "./config.js";
import { createApp } from "./server.js";

const validToken = () => jwt.sign({}, DEV_JWT_SECRET);
const authHeader = () => `Bearer ${validToken()}`;

describe("POST /items", () => {
  it("creates an item and returns it with a generated id", async () => {
    const res = await request(createApp())
      .post("/items")
      .set("Authorization", authHeader())
      .send({ name: "Widget", description: "A widget" });
    expect(res.status).toBe(201);
    expect(typeof res.body.id).toBe("string");
    expect(res.body).toMatchObject({ name: "Widget", description: "A widget" });
  });

  it("creates an item without a description", async () => {
    const res = await request(createApp())
      .post("/items")
      .set("Authorization", authHeader())
      .send({ name: "Widget" });
    expect(res.status).toBe(201);
    expect(res.body.name).toBe("Widget");
  });

  it("returns 400 when name is missing", async () => {
    const res = await request(createApp())
      .post("/items")
      .set("Authorization", authHeader())
      .send({ description: "no name" });
    expect(res.status).toBe(400);
    expect(typeof res.body.error).toBe("string");
  });

  it("returns 400 when name is an empty string", async () => {
    const res = await request(createApp()).post("/items").set("Authorization", authHeader()).send({ name: "" });
    expect(res.status).toBe(400);
    expect(typeof res.body.error).toBe("string");
  });

  it("returns 400 when name is the wrong type", async () => {
    const res = await request(createApp()).post("/items").set("Authorization", authHeader()).send({ name: 123 });
    expect(res.status).toBe(400);
    expect(typeof res.body.error).toBe("string");
  });

  it("returns 401 when no Authorization header is sent", async () => {
    const res = await request(createApp()).post("/items").send({ name: "Widget" });
    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: "Unauthorized" });
  });

  it("returns 401 when the Authorization header is malformed", async () => {
    const res = await request(createApp())
      .post("/items")
      .set("Authorization", "garbage-token")
      .send({ name: "Widget" });
    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: "Unauthorized" });
  });

  it("returns 401 when the token is signed with the wrong secret", async () => {
    const forgedToken = jwt.sign({}, "wrong-secret");
    const res = await request(createApp())
      .post("/items")
      .set("Authorization", `Bearer ${forgedToken}`)
      .send({ name: "Widget" });
    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: "Unauthorized" });
  });
});

describe("GET /items", () => {
  it("returns an empty list for a fresh app", async () => {
    const res = await request(createApp()).get("/items");
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it("returns all created items", async () => {
    const app = createApp();
    await request(app).post("/items").set("Authorization", authHeader()).send({ name: "One" });
    await request(app).post("/items").set("Authorization", authHeader()).send({ name: "Two" });

    const res = await request(app).get("/items");
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
  });

  it("does not leak items across separate createApp() calls", async () => {
    const appA = createApp();
    await request(appA).post("/items").set("Authorization", authHeader()).send({ name: "Only in A" });

    const res = await request(createApp()).get("/items");
    expect(res.body).toEqual([]);
  });
});

describe("GET /items/:id", () => {
  it("returns the item when it exists", async () => {
    const app = createApp();
    const created = await request(app).post("/items").set("Authorization", authHeader()).send({ name: "Findable" });

    const res = await request(app).get(`/items/${created.body.id}`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual(created.body);
  });

  it("returns 404 with a JSON error body when the item does not exist", async () => {
    const res = await request(createApp()).get("/items/does-not-exist");
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: "Item not found" });
  });
});

describe("PATCH /items/:id", () => {
  it("updates all fields", async () => {
    const app = createApp();
    const created = await request(app)
      .post("/items")
      .set("Authorization", authHeader())
      .send({ name: "Old", description: "old desc" });

    const res = await request(app)
      .patch(`/items/${created.body.id}`)
      .set("Authorization", authHeader())
      .send({ name: "New", description: "new desc" });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ id: created.body.id, name: "New", description: "new desc" });
  });

  it("updates only the provided field, leaving others untouched", async () => {
    const app = createApp();
    const created = await request(app)
      .post("/items")
      .set("Authorization", authHeader())
      .send({ name: "Old", description: "old desc" });

    const res = await request(app)
      .patch(`/items/${created.body.id}`)
      .set("Authorization", authHeader())
      .send({ description: "only desc" });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ name: "Old", description: "only desc" });
  });

  it("returns 400 when name is set to an empty string", async () => {
    const app = createApp();
    const created = await request(app).post("/items").set("Authorization", authHeader()).send({ name: "Old" });

    const res = await request(app)
      .patch(`/items/${created.body.id}`)
      .set("Authorization", authHeader())
      .send({ name: "" });
    expect(res.status).toBe(400);
  });

  it("returns 404 when the item does not exist", async () => {
    const res = await request(createApp())
      .patch("/items/does-not-exist")
      .set("Authorization", authHeader())
      .send({ name: "New" });
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: "Item not found" });
  });

  it("returns 401 when no Authorization header is sent", async () => {
    const res = await request(createApp()).patch("/items/does-not-exist").send({ name: "New" });
    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: "Unauthorized" });
  });

  it("returns 401 when the Authorization header is malformed", async () => {
    const res = await request(createApp())
      .patch("/items/does-not-exist")
      .set("Authorization", "garbage-token")
      .send({ name: "New" });
    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: "Unauthorized" });
  });

  it("returns 401 when the token is signed with the wrong secret", async () => {
    const forgedToken = jwt.sign({}, "wrong-secret");
    const res = await request(createApp())
      .patch("/items/does-not-exist")
      .set("Authorization", `Bearer ${forgedToken}`)
      .send({ name: "New" });
    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: "Unauthorized" });
  });
});

describe("DELETE /items/:id", () => {
  it("deletes the item and subsequent get returns 404", async () => {
    const app = createApp();
    const created = await request(app)
      .post("/items")
      .set("Authorization", authHeader())
      .send({ name: "Temporary" });

    const del = await request(app).delete(`/items/${created.body.id}`).set("Authorization", authHeader());
    expect(del.status).toBe(204);
    expect(del.body).toEqual({});

    const get = await request(app).get(`/items/${created.body.id}`);
    expect(get.status).toBe(404);
    expect(get.body).toEqual({ error: "Item not found" });
  });

  it("returns 404 when the item does not exist", async () => {
    const res = await request(createApp()).delete("/items/does-not-exist").set("Authorization", authHeader());
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: "Item not found" });
  });

  it("returns 401 when no Authorization header is sent", async () => {
    const res = await request(createApp()).delete("/items/does-not-exist");
    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: "Unauthorized" });
  });

  it("returns 401 when the Authorization header is malformed", async () => {
    const res = await request(createApp()).delete("/items/does-not-exist").set("Authorization", "garbage-token");
    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: "Unauthorized" });
  });

  it("returns 401 when the token is signed with the wrong secret", async () => {
    const forgedToken = jwt.sign({}, "wrong-secret");
    const res = await request(createApp())
      .delete("/items/does-not-exist")
      .set("Authorization", `Bearer ${forgedToken}`);
    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: "Unauthorized" });
  });
});
