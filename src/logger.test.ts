import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { logger } from "./logger.js";

describe("logger", () => {
  let logSpy: ReturnType<typeof vi.spyOn>;
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    logSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);
    errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    logSpy.mockRestore();
    errorSpy.mockRestore();
    delete process.env.LOG_LEVEL;
  });

  it("writes info messages to stdout as JSON", () => {
    logger.info("hello", { foo: "bar" });

    expect(logSpy).toHaveBeenCalledTimes(1);
    const entry = JSON.parse(logSpy.mock.calls[0][0] as string);
    expect(entry).toMatchObject({ level: "info", message: "hello", foo: "bar" });
    expect(typeof entry.timestamp).toBe("string");
  });

  it("writes warn and error messages to stderr", () => {
    logger.warn("careful");
    logger.error("broken");

    expect(errorSpy).toHaveBeenCalledTimes(2);
    expect(logSpy).not.toHaveBeenCalled();
  });

  it("suppresses messages below the configured LOG_LEVEL", () => {
    process.env.LOG_LEVEL = "warn";

    logger.info("skip me");
    logger.debug("skip me too");
    logger.warn("shown");

    expect(logSpy).not.toHaveBeenCalled();
    expect(errorSpy).toHaveBeenCalledTimes(1);
  });
});
