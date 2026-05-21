# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository layout

This repo is a monorepo of independent Eitri "shared" apps — reusable service layers consumed by other Eitri mini-apps. Each subdirectory is a self-contained Eitri app published separately:

- `eitri-shopping-vtex-shared/` — VTEX ecommerce integration (JS)
- `eitri-shopping-shopify-shared/` — Shopify integration (TS, GraphQL)
- `eitri-shopping-wake-shared/` — Wake ecommerce integration (JS, GraphQL)
- `eitri-shopping-integrations-shared/` — cross-integration shared views/components

Each project has its own `eitri-app.conf.js` with its own `version`, `id`, `applicationId`, and `eitri-luminus` / `eitri-bifrost` pinned versions. Each project's `src/export.{js,ts}` is the public surface — it re-exports services (e.g. `Vtex`, `Shopify`, `Wake`, `App`, `Tracking`, `EventBus`, `RemoteConfig`) and model/type definitions that consumer apps import.

There is no root `package.json`; commands run per-subproject via the `eitri` CLI.

## Publishing pipeline

`check_and_push.js` (root) is the release engine, run by `.github/workflows` on push to `main`:

1. Authenticates against Eitri's `blind-guardian-api` using `EITRI_CLI_CLIENT_ID` / `EITRI_CLI_CLIENT_SECRET`.
2. For each subdirectory containing `eitri-app.conf.js`, compares the local `version` against the latest published revision from `eitri-manager-api`.
3. If local > published, runs `eitri push-version -m '<messageVersion>' [--shared]` inside that project. Projects with `sharedVersion`/`sharedCompiler` truthy publish first (ordering matters — other projects may depend on shared compiler output).
4. On success, creates and pushes a git tag named `<suffix-after-last-dash>-<version>` (e.g. `vtex-1.13.0`).

**To release: bump `version` in the project's `eitri-app.conf.js` and merge to `main`.** Do not run `eitri push-version` manually unless you understand the tag/order implications.

`messageVersion` in `eitri-app.conf.js` is the publish message — update it to describe the change.

## Service architecture

Each ecommerce shared app follows the same shape:

- A top-level facade class (`Vtex`, `Shopify`, `Wake`) with static `configs` and a static `configure(remoteConfig)` method. Consumers call `configure` once at startup; sub-services read from the facade's static config.
- Sub-services grouped by domain under `services/<provider>/<domain>/` (cart, catalog, checkout, customer, session, wishlist, search, store, cms, etc.). Each domain has its own caller/helper module.
- Cross-cutting services: `App` (app-level concerns), `RemoteConfig`, `StorageService`, `EventBus` + `EventBusChannels`, `Tracking` (with provider-specific `tracking/GAService`, etc.), `Logger`, `Datadog`.
- HTTP is done through provider-specific callers (e.g. `VtexCaller`, `HttpService`, `GraphqlService`) — not raw `fetch`. The VTEX caller, for example, treats `options.headers` as optional. Session handling for VTEX lives in `VtexSessionService` (recent extraction — see commit `dca5831`).
- Path alias `@/` resolves to `src/` in projects with `jsconfig.json` (e.g. shopify).

Models/types live in `src/models/` (shopify, wake) and are re-exported from `export.ts`/`export.js`. Errors live in `src/errors/`. GraphQL documents live in `src/graphql/` (shopify) or `src/queries/` (wake).

## Eitri context

These apps run inside Eitri-Play (native mobile WebView). All device/native APIs go through `eitri-bifrost` (`import Eitri from 'eitri-bifrost'`) — never use `fetch`, `localStorage`, or `navigator.*` directly. UI (in the `views/` directories that exist) is built with `eitri-luminus` components, not raw HTML tags. Versions of both libs are pinned per-project in `eitri-app.conf.js`.

The `eitri-coding`, `eitri-luminus`, and `eitri-bifrost` skills should be invoked when working on this code — `eitri-app.conf.js` files in subprojects are the signal.

## Formatting

`.prettierrc`: tabs (width 4), single quotes, no semicolons, `printWidth: 120`, `trailingComma: none`, `arrowParens: avoid`, `singleAttributePerLine: true`. Match this style in edits.
