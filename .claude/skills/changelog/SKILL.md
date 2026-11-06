---
name: changelog
description: Create or update the root CHANGELOG.md (Keep a Changelog 1.1.0) whenever a task in this monorepo bumps the `version` of any `*/eitri-app.conf.js`, and before opening or updating a PR. Use when the user says to open a PR, finish/wrap up a task, release, or bump a version, and whenever `git diff` shows a changed `version` in an `eitri-app.conf.js`. Skip if no `eitri-app.conf.js` version changed.
---

# Changelog (Keep a Changelog 1.1.0)

Format reference: https://keepachangelog.com/en/1.1.0/

A release here is "bump `version` in a project's `eitri-app.conf.js` and merge to `main`" (see `CLAUDE.md` > Publishing pipeline). Every such bump must ship with a matching entry in the **root** `CHANGELOG.md`, in the **same PR**. No bump, no entry.

## When to run

1. The task is done and a `version` was bumped in one or more `*/eitri-app.conf.js`, **or**
2. You are about to open/update a PR and the diff against the base branch contains such a bump.

Run this **before** pushing / creating the PR so the changelog is part of the PR. If the bump is missing but the change is user-facing for consumer apps, tell the user instead of bumping silently.

## Step 1 — find which projects were bumped

The release unit is the project directory (`eitri-shopping-vtex-shared`, `eitri-shopping-shopify-shared`, ...), not the repo. Several projects can be bumped in one PR; each gets its own entry.

```bash
TARGET=main   # use the PR's target branch if it is not main
BASE=$(git merge-base "origin/$TARGET" HEAD 2>/dev/null || git merge-base "$TARGET" HEAD) \
  || { echo "cannot resolve base branch"; false; }
# Includes uncommitted changes (diff against the working tree)
git diff "$BASE" -- '*/eitri-app.conf.js'
```

If the base cannot be resolved, stop and ask the user which branch the PR targets.

Read the top-level `version` (the one next to `messageVersion`), written as `version`, `'version'` or `"version"`. Ignore `version` keys nested under `eitri-app-dependencies` (and the `eitri-luminus` / `eitri-bifrost` pins); those are not releases, but a bump of a pinned lib is worth a line under **Changed**.

## Step 2 — collect what changed per bumped project

```bash
DIR=eitri-shopping-vtex-shared
git log --oneline "$BASE"..HEAD -- "$DIR"     # committed work
git diff "$BASE" --stat -- "$DIR"              # incl. uncommitted
git diff "$BASE" -- "$DIR/src/export.js" "$DIR/src/export.ts" 2>/dev/null   # public surface
```

Also use `messageVersion` from the conf as a hint, and the task context of this conversation. Describe changes from the **consumer's** point of view (what an app importing `Vtex`, `Shopify`, `Wake`, ... sees), not file by file. One bullet per behavior, short, past tense or imperative consistently (pick imperative, matching the commits).

## Step 3 — classify into pillars

Each version section uses only the pillars that have content, in this order:

| Heading | Put here |
| --- | --- |
| `### Added` | New services, methods, exports, remote-config options, tracking events, features. |
| `### Fixed` | Bug fixes. |
| `### Breaking Changes` | Anything that can break a consumer app on upgrade (see below). Always state the migration in one line. |
| `### Known Issues` | **Optional.** Known bugs/limitations shipped with this version, with workaround if any. Omit the heading when empty. |

If a change fits none of these, use the standard Keep a Changelog headings (`Changed`, `Deprecated`, `Removed`, `Security`). Single fixed order for every section:

`Added → Changed → Deprecated → Removed → Fixed → Security → Breaking Changes → Known Issues`

`Breaking Changes` and `Known Issues` are local extensions to the spec (requested by the team). Do not invent other headings. Do not add empty headings.

**What counts as breaking** (check the `export.{js,ts}` diff and public facade classes):
- an export removed or renamed; a public method removed, renamed, or with changed parameters/return shape;
- a remote-config key renamed, removed, or whose meaning changed (`configure(remoteConfig)` input);
- a changed event name/payload on `EventBus` / `EventBusChannels` / `Tracking`;
- a new required config or a raised minimum of `eitri-luminus` / `eitri-bifrost` that consumers must also adopt;
- a major `version` bump.

When unsure whether something is breaking, ask the user rather than guessing; mislabeling hides the risk from consumers.

## Step 4 — write the entry

Create `CHANGELOG.md` at the repo root if it does not exist, with this header, then the entry:

```markdown
# Changelog

All notable changes to the apps in this repository are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
Each release is one project (`eitri-app.conf.js` version), so entries are named
`[<project-dir> <version>]`.

## [Unreleased]
```

Insert the new section **right below `## [Unreleased]`** (newest first). Format:

```markdown
## [eitri-shopping-vtex-shared 1.22.0] - 2026-11-06

### Added
- Add `Foo.bar()` to ...

### Fixed
- Fix ... when ...

### Breaking Changes
- `Vtex.oldName` renamed to `Vtex.newName`. Migrate by ...

### Known Issues
- ... Workaround: ...
```

Rules:
- Heading is `## [<project-dir> <version>] - YYYY-MM-DD`; `<version>` is the new value from the conf; date is the day the PR is finalized (ISO 8601). Publishing happens after merge, so if the PR is updated or merged on a later day, refresh the date.
- **No compare/tag links.** Tags are named `<suffix-after-last-dash>-<version>` (`shared-1.21.0`), so `vtex-shared`, `shopify-shared`, `wake-shared` and `vtex-cx-ai-shared` collide on one `shared-` namespace; a link would point at the wrong project.
- Several projects in one PR → one section each, same date, adjacent.
- Keep `## [Unreleased]` in place, empty unless the user asks to track unreleased work.
- If an entry for that exact `[<project-dir> <version>]` already exists (PR updated after review), edit it in place, don't duplicate.
- If the PR's version changed again or the bump was reverted, reconcile: remove or rename the provisional entry this PR introduced so entries match the final bumps. Never touch entries that already exist on the base branch.
- Language: English (matches commits and the Keep a Changelog headings). Match the user if they ask otherwise.
- If the branch name or conversation has a ticket id (`<TICKET-ID>`), you may append it in parentheses to the relevant bullet. Optional.
- Do not paste the PR body, per-file detail, or commit hashes. This is a consumer-facing summary.

## Step 5 — finish

- Before pushing, check that every `<project-dir> <version>` bumped in the diff has exactly one matching `## [...]` section, and no section exists for a version that was not bumped in this PR.
- Stage `CHANGELOG.md` together with the bump (same commit or same PR; do not commit unless the user asked for it).
- Tell the user in the chat which sections you added and anything you classified as **Breaking Changes** or were unsure about.
- The PR body does not repeat the changelog; at most mention "changelog atualizado".
