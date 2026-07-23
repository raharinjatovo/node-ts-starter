import { describe, expect, it } from "vitest";
import { greet } from "./index.js";

describe("greet", () => {
  it("greets by name", () => {
    expect(greet("Ruflo")).toBe("Hello, Ruflo!");
  });

  it("returns greeting with empty exclamation frame when name is empty string", () => {
    expect(greet("")).toBe("Hello, !");
  });

  it("does not trim whitespace-only name", () => {
    expect(greet("   ")).toBe("Hello,    !");
  });

  it("greets correctly when name is very long", () => {
    const longName = "a".repeat(1000);
    expect(greet(longName)).toBe(`Hello, ${longName}!`);
  });

  it("greets correctly when name contains quotes and backticks", () => {
    expect(greet(`O'Brien "The Great" \`Backtick\``)).toBe(
      `Hello, O'Brien "The Great" \`Backtick\`!`,
    );
  });

  it("greets correctly when name contains unicode and emoji", () => {
    expect(greet("Zoë 🚀 日本語")).toBe("Hello, Zoë 🚀 日本語!");
  });

  it("does not trim leading or trailing spaces in name", () => {
    expect(greet("  Ruflo  ")).toBe("Hello,   Ruflo  !");
  });

  it("greets correctly when name is a numeric-like string", () => {
    expect(greet("123")).toBe("Hello, 123!");
  });
});
