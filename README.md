# bun-1.1-text-lock-probe

**Probe #10 — Tier 3, Pair V1 (probe B)**
Tracked in: `docs/BUN_COVERAGE_PLAN.md` §11.3 entry #10

---

## Pair

- **Pair ID**: V1
- **Pair name**: `version-pm-bunlock-1.0-vs-1.1`
- **Purpose**: Verify that Mend's lockfile parser handles BOTH Bun lockfile formats — the pre-1.1.39 binary `bun.lockb` (probe A / #9) and the Bun 1.1.39+ text JSONC `bun.lock` (this probe, B / #10).

---

## This probe (B)

| Field | Value |
|---|---|
| Probe name | `bun-1.1-text-lock-probe` |
| Probe index | #10 |
| Pair role | B (text JSONC side) |
| `pm_version_under_test` | `1.1.30` |
| Lockfile | `bun.lock` (text JSONC, `lockfileVersion: 0`) |
| `package.json` name | `bun-version-pair-probe` |

**Note on version pinning.** The coverage plan pins `pm_version_under_test` to `1.1.30` as the representative Bun 1.1.x release. In practice, the text `bun.lock` format was introduced in Bun **v1.1.39** (2024-12-17) — nine patch releases after 1.1.30. The lockfile in this probe uses `lockfileVersion: 0`, which is the format produced by Bun 1.1.39+. The pin is intentional: it documents the Bun 1.1-era capability boundary for this pair, not the exact release where the text format debuted.

---

## Sibling probe (A)

| Field | Value |
|---|---|
| Probe name | `bun-1.0-binary-lockb-probe` |
| Probe index | #9 |
| Pair role | A (binary side) |
| `pm_version_under_test` | `1.0.36` |
| Lockfile | `bun.lockb` (binary, pre-1.1.39) |
| Repo | https://github.com/mend-detection-qa/bun-1.0-binary-lockb-probe |

---

## What this probe targets

This probe exercises **Mend's JSONC parser** for the Bun 1.1+ text lockfile format.

### Primary risk: JSONC tolerance

The `bun.lock` text format is JSONC — JSON with Comments and trailing commas. Both features are explicitly present in this probe's lockfile:

- **Line comments** (`// ...`) appear at the file header, before each package entry, and inside the `workspaces` block.
- **Trailing commas** appear on the last entry in every object: the `"dependencies"` map inside `"workspaces"."".dependencies`, and after every package entry in `"packages"`.

A standard `JSON.parse()` call will **reject** this file with a syntax error. Mend's parser must use a JSONC-tolerant parser (or strip comments and trailing commas before parsing).

### Secondary risk: lockfileVersion discrimination

`lockfileVersion: 0` is the Bun 1.1-era text format. Bun 1.2+ introduced `lockfileVersion: 1` with structural changes to the package tuple format. Mend's parser must handle both versions. This probe tests `lockfileVersion: 0`; the Tier 1 `bun-basic-registry-probe` uses `lockfileVersion: 1` (Bun 1.2+).

### Paired graph consistency check

If both parsers work correctly:
- This probe (text JSONC) and the sibling probe (binary `bun.lockb`) MUST produce identical dependency graphs.
- Direct: `hono@4.12.18`, `elysia@1.4.28`
- Transitives: `cookie@1.1.1`, `exact-mirror@0.2.7`, `fast-decode-uri-component@1.0.1`, `memoirist@0.4.0`
- **Total: 6 packages (2 direct + 4 transitive)**

If the graphs differ between the two probes, one parser has a bug.

---

## Mend config

No `.whitesource` file is emitted for this probe.

**Reason**: Bun is **not** in Mend's `install-tool` supported list. The `scanSettings.versioning` mechanism cannot pin a Bun toolchain version. Detection is lockfile-driven only — Mend reads `bun.lock` statically without invoking the Bun CLI. Emitting `.whitesource` would add noise without affecting the scan behavior.

This limitation is documented in `BUN_COVERAGE_PLAN.md` §1 and in probe `bun-not-in-install-tool-probe` (#24, Tier 5).

---

## Expected tree summary

| Category | Count | Packages |
|---|---|---|
| Direct dependencies | 2 | `hono@4.12.18`, `elysia@1.4.28` |
| Transitive dependencies | 4 | `cookie@1.1.1`, `exact-mirror@0.2.7`, `fast-decode-uri-component@1.0.1`, `memoirist@0.4.0` |
| **Total** | **6** | — |

All packages are `source: registry`, `group: main`. No optional, dev, or peer packages in the expected tree.

**elysia peer dependencies NOT in tree**: `@types/bun`, `@sinclair/typebox`, `file-type`, `openapi-types`, `typescript` — these are declared as `peerDependencies` by elysia but are not installed unless explicitly declared at the root, which this probe does not do.

### Resolved package versions

| Package | Constraint | Resolved |
|---|---|---|
| `hono` | `^4.0.0` | `4.12.18` |
| `elysia` | `^1.0.0` | `1.4.28` |
| `cookie` | `^1.1.1` (via elysia) | `1.1.1` |
| `exact-mirror` | `^0.2.7` (via elysia) | `0.2.7` |
| `fast-decode-uri-component` | `^1.0.1` (via elysia) | `1.0.1` |
| `memoirist` | `^0.4.0` (via elysia) | `0.4.0` |

---

## Failure modes

| Failure | Symptom in Mend output | Root cause |
|---|---|---|
| JSONC trailing comma rejected | Empty tree | Parser calls `JSON.parse()` without JSONC pre-processing |
| JSONC comment stripped incorrectly | Malformed package names or versions | Regex-based comment stripper mis-handles URL-style `//` patterns |
| `lockfileVersion: 0` unknown | Empty tree or wrong structure parsed | Parser only handles `lockfileVersion: 1` (Bun 1.2+ format) |
| Peer deps included in tree | 5 unexpected packages | Parser treats `peerDependencies` entries in metadata as installed packages |
| Graph differs from sibling (#9) | Version mismatch between text/binary probes | One of the two parsers resolved differently |

---

## Resolver knowledge

Bun is NOT in the UA resolver's `install-tool` list. The closest analog is the npm resolver. See:
- `resolver-knowledge.md` → `javascript.md` entry (npm resolver)
- `BUN_COVERAGE_PLAN.md` §4 ("Binary `bun.lockb` silently produces empty tree" risk, "JSONC comments / trailing commas crash the parser" risk)

The UA does NOT invoke `bun install` — there is no pre-step. Detection is fully static lockfile parsing.

---

Tracked in: `docs/BUN_COVERAGE_PLAN.md` §11.3 entry #10
