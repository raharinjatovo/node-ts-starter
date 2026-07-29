import { describe, expect, it } from "vitest";
import { DEV_JWT_SECRET, loadConfig } from "./config.js";

describe("loadConfig", () => {
  it("applies defaults when NODE_ENV is explicitly set to development", () => {
    const config = loadConfig({ NODE_ENV: "development" });
    expect(config).toEqual({ port: 3000, nodeEnv: "development", logLevel: "info", jwtSecret: DEV_JWT_SECRET });
  });

  it("uses valid env var overrides", () => {
    const config = loadConfig({
      PORT: "8080",
      NODE_ENV: "production",
      LOG_LEVEL: "debug",
      JWT_SECRET: "super-secret",
    });
    expect(config).toEqual({ port: 8080, nodeEnv: "production", logLevel: "debug", jwtSecret: "super-secret" });
  });

  it("throws on a non-numeric PORT", () => {
    expect(() => loadConfig({ PORT: "not-a-number" })).toThrow(/Invalid PORT/);
  });

  it("throws on a PORT out of range", () => {
    expect(() => loadConfig({ PORT: "70000" })).toThrow(/Invalid PORT/);
  });

  it("throws on an unknown NODE_ENV", () => {
    expect(() => loadConfig({ NODE_ENV: "staging" })).toThrow(/Invalid NODE_ENV/);
  });

  it("throws on an unknown LOG_LEVEL", () => {
    expect(() => loadConfig({ LOG_LEVEL: "verbose" })).toThrow(/Invalid LOG_LEVEL/);
  });

  it("throws when NODE_ENV is unset and JWT_SECRET is absent", () => {
    expect(() => loadConfig({})).toThrow(/Invalid JWT_SECRET/);
  });

  it("does not throw when NODE_ENV is unset and JWT_SECRET is provided", () => {
    expect(() => loadConfig({ JWT_SECRET: "explicit-secret" })).not.toThrow();
  });

  it("defaults JWT_SECRET to DEV_JWT_SECRET when NODE_ENV is development", () => {
    const config = loadConfig({ NODE_ENV: "development" });
    expect(config.jwtSecret).toBe(DEV_JWT_SECRET);
  });

  it("defaults JWT_SECRET to DEV_JWT_SECRET when NODE_ENV is test", () => {
    const config = loadConfig({ NODE_ENV: "test" });
    expect(config.jwtSecret).toBe(DEV_JWT_SECRET);
  });

  it("uses the explicit JWT_SECRET value when provided", () => {
    const config = loadConfig({ JWT_SECRET: "my-custom-secret" });
    expect(config.jwtSecret).toBe("my-custom-secret");
  });

  it("throws when NODE_ENV is production and JWT_SECRET is absent", () => {
    expect(() => loadConfig({ NODE_ENV: "production" })).toThrow(/Invalid JWT_SECRET/);
  });

  it("does not throw when NODE_ENV is production and JWT_SECRET is provided", () => {
    expect(() => loadConfig({ NODE_ENV: "production", JWT_SECRET: "prod-secret" })).not.toThrow();
  });
});
