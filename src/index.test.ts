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

  it("greets correctly when name contains right-to-left script (Arabic/Hebrew)", () => {
    expect(greet("مرحبا שלום")).toBe("Hello, مرحبا שלום!");
  });

  it("greets correctly when name contains combining diacritics (NFD form)", () => {
    const nfd = "é"; // "é" as base char + combining acute accent
    expect(greet(nfd)).toBe(`Hello, ${nfd}!`);
  });

  it("greets correctly when name contains a ZWJ emoji sequence (family emoji)", () => {
    const family = "👨‍👩‍👧‍👦";
    expect(greet(family)).toBe(`Hello, ${family}!`);
  });

  it("greets correctly when name contains an emoji with skin-tone modifier", () => {
    expect(greet("👍🏽")).toBe("Hello, 👍🏽!");
  });

  it("greets correctly when name mixes multiple scripts and symbols", () => {
    const mixed = "José Владимир 田中さん 🎉";
    expect(greet(mixed)).toBe(`Hello, ${mixed}!`);
  });

  it("greets correctly when name contains an astral-plane character (surrogate pair)", () => {
    const astral = "𝔘𝔫𝔦𝔠𝔬𝔡𝔢"; // Mathematical Fraktur, outside BMP
    expect(greet(astral)).toBe(`Hello, ${astral}!`);
  });

  it("stringifies null when a non-TS caller passes null", () => {
    // greet's param is typed `string`; this bypasses that to document
    // runtime behavior if an untyped JS caller (or bad JSON) passes null.
    expect(greet(null as any)).toBe("Hello, null!");
  });

  it("stringifies undefined when a non-TS caller passes undefined", () => {
    expect(greet(undefined as any)).toBe("Hello, undefined!");
  });

  it("greets with empty string when name is an empty string (explicit null-vs-empty check)", () => {
    expect(greet("")).not.toBe(greet(null as any));
  });
});
