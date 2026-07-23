# ADR-001: CI Workflow and README as Next Features (Starter Kit Roadmap)

- **Status**: accepted
- **Date**: 2026-07-23
- **Deciders**: system-architect agent (automated evaluation)
- **Tags**: starter-kit, roadmap, ci, docs, scope-control

## Context

`node-ts-starter` is a minimal Node.js + TypeScript starter kit (pnpm, strict TS/NodeNext,
tsx, vitest, no framework). A recurring question for this repo is "what should we add next?"
Left unanswered, each new session tends to re-derive an answer from scratch and risks
re-proposing additions that were already deliberately scoped out.

A system-architect evaluation was run against the explicit guiding principle for this
template: **every addition is weighed against bloat; only additions with zero new runtime
dependencies and universal value to any consumer of the template are accepted.**

## Decision

Add, in order:

1. **GitHub Actions CI** at `.github/workflows/ci.yml`:
   - `pnpm/action-setup@v4` + `actions/setup-node@v4` (`cache: pnpm`)
   - `pnpm install --frozen-lockfile`
   - Single Node 22.x job: `tsc --noEmit` (lint) → `pnpm build` → `pnpm test`
   - Triggers: push/PR to `main`

2. **`README.md`** (~40 lines):
   - CI badge
   - Quickstart (`pnpm install` / `dev` / `test` / `build`)
   - Scripts table
   - One line noting no framework is included, by design

### Explicitly rejected (do not re-propose without new context)

| Rejected | Reason |
|---|---|
| ESLint / Prettier | Adds devDependency weight + opinionated bikeshedding; `tsc --noEmit` already covers correctness at this size. Revisit only if a team style guide becomes a real need. |
| HTTP server example (Express/Fastify) | Directly contradicts this repo's `CLAUDE.md` rule: "add Express/Fastify only when a real endpoint is needed." |
| Dockerfile | No deployment target exists yet — premature ops concern. |
| Env-loading pattern (dotenv etc.) | YAGNI — nothing in the codebase currently reads env vars. |

## Consequences

### Positive
- New contributors get a working quickstart and CI signal with zero added runtime dependencies.
- Future sessions can retrieve this record instead of re-litigating the same "what's next"
  question or re-proposing rejected items without context.

### Negative
- No linting beyond `tsc --noEmit`; style drift is possible until/unless a team lint config
  becomes justified.

### Neutral
- This is a living decision: if the guiding principle's inputs change (e.g. a real deployment
  target appears, or env vars are introduced), the rejected items should be re-evaluated, not
  dismissed by default.

## Links

- Related project rules: `CLAUDE.md` ("add Express/Fastify only when a real endpoint is needed")
- ReasoningBank pattern record: `.claude/memory/reasoningbank/patterns/node-ts-starter__next-feature-decision.json`
  (namespace `reasoningbank`, key `node-ts-starter:next-feature-decision`)
