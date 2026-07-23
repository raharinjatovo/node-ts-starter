# node-ts-starter

Minimal Node.js + TypeScript starter. Extends global ruflo config.

## Ruflo tools enabled for this project

- **Memory** — `ruflo-rag-memory` / `ruflo-agentdb` for cross-session context on this repo
- **Hooks** — pre-edit/post-edit/session-end wired in `.claude/settings.json`
- **Testgen** — `ruflo-testgen:tester` / `ruflo-testgen:testgen` for TDD London-school tests (vitest)
- **Security-audit** — `ruflo-security-audit:audit` / `security-scan`, `dependency-check` before merging deps

## Stack

- TypeScript (strict, NodeNext), tsx for dev run, vitest for tests
- No framework — add Express/Fastify only when a real endpoint is needed
