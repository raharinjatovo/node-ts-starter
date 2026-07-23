# node-ts-starter

[![CI](https://github.com/raharinjatovo/node-ts-starter/actions/workflows/ci.yml/badge.svg)](https://github.com/raharinjatovo/node-ts-starter/actions/workflows/ci.yml)

Minimal Node.js + TypeScript starter kit (pnpm, strict TS/NodeNext, tsx, vitest).

## Quickstart

```bash
pnpm install
pnpm dev
pnpm test
pnpm build
```

## Scripts

| Script | Description |
|---|---|
| `pnpm dev` | Run `src/index.ts` directly with `tsx` |
| `pnpm build` | Compile TypeScript to `dist/` via `tsc` |
| `pnpm start` | Run the compiled output from `dist/index.js` |
| `pnpm test` | Run the test suite once with `vitest` |
| `pnpm test:watch` | Run `vitest` in watch mode |
| `pnpm lint` | Type-check with `tsc --noEmit` |

## No framework included

This starter intentionally ships without a web framework — add Express, Fastify,
or similar only once there's a real endpoint to serve.
