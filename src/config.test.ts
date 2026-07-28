import { describe, expect, it } from "vitest";
import { loadConfig } from "./config.js";

describe("loadConfig", () => {
  it("applies defaults when no env vars are set", () => {
    const config = loadConfig({});
    expect(config).toEqual({ port: 3000, nodeEnv: "development", logLevel: "info" });
  });

  it("uses valid env var overrides", () => {
    const config = loadConfig({ PORT: "8080", NODE_ENV: "production", LOG_LEVEL: "debug" });
    expect(config).toEqual({ port: 8080, nodeEnv: "production", logLevel: "debug" });
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
});
