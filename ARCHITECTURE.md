# LLM Wiki Knowledge Base — Architecture

## Vision

A personal research knowledge base: Zotero as literature source, Obsidian as viewer, markdown as storage, Claude Code as maintainer. Provides retrieval API for programmatic access.

LLM handles grunt work (summarizing, cross-referencing, filing), but provenance tracking and periodic human review are required to prevent error accumulation.

## Three-Layer Architecture

```
Raw Sources (user owns)  →  LLM Engine (Claude Code)  →  Wiki (LLM maintains)
                                                        →  Retrieval Layer
```

### Layer 1: Raw Sources (user owns, LLM reads only)
- Zotero library (papers, annotations, metadata)
- Web content (URL → markdown snapshots)
- Freeform notes, PDFs, documents

### Layer 2: Wiki Knowledge (LLM maintains, user verifies)
Three directories only — additional entity types live as frontmatter metadata, not top-level directories:

| Directory | Content | Provenance |
|---|---|---|
| `wiki/sources/` | One summary per ingested source | source-derived |
| `wiki/concepts/` | Topic articles with [[wikilinks]]. May contain author, method, dataset info as sections or metadata | llm-derived |
| `wiki/synthesis/` | Cross-cutting theme articles (created by /kb-reflect, only after lint passes) | llm-derived |

Entity types like author, method, dataset, venue, benchmark are **frontmatter tags**, not directories. They emerge from data, not predetermined taxonomy.

### Layer 3: Schema (CLAUDE.md)
LLM behavior rules, provenance model, wiki page templates, forbidden operations.

## Provenance Model

Every wiki page and every claim within it carries provenance:

| Level | Meaning | Trust | Can enter index? |
|---|---|---|---|
| `source-derived` | Directly extracted/summarized from raw source | High | Yes |
| `llm-derived` | Synthesized by LLM across sources | Medium | Yes, with `[llm-derived]` tag |
| `user-verified` | Manually confirmed by user | Highest | Yes |
| `query-derived` | Generated from /kb-ask Q&A | Low | No — stored in outputs/ only |

**Rule**: query-derived content NEVER enters wiki/ or index.md. Synthesis articles require at least 2 source-derived citations.

## Directory Structure

```
llm-wiki/
├── CLAUDE.md                         # Schema: LLM behavior rules + provenance model
├── ARCHITECTURE.md                   # This file
├── raw/                              # Raw sources (user owns, LLM reads only)
│   ├── zotero/papers/                # Auto-synced from Zotero
│   ├── web/                          # URL → markdown snapshots
│   ├── notes/                        # Freeform notes
│   └── documents/                    # PDFs, images, etc.
├── wiki/                             # Knowledge wiki (LLM maintains)
│   ├── index.md                      # Master index with one-line summaries
│   ├── sources/                      # One summary per raw source
│   ├── concepts/                     # Topic articles
│   ├── synthesis/                    # Cross-cutting themes (post-lint only)
│   └── archive/                      # Merged/superseded articles
├── outputs/                          # Generated artifacts (NOT fed back)
│   ├── queries/                      # Q&A history
│   └── reviews/                      # Literature reviews
├── log.md                            # Append-only activity log
├── tools/                            # Python tooling
│   ├── zotero_sync.py               # Zotero sync (two-path)
│   ├── search.py                    # BM25 keyword search (Phase 1)
│   └── requirements.txt
├── .kb/                              # Internal state
│   └── manifest.json                # Per-file compilation state
└── .claude/
    └── commands/                    # Claude Code slash commands
        ├── kb-sync.md
        ├── kb-ingest.md
        ├── kb-compile.md
        ├── kb-lint.md
        ├── kb-ask.md
        └── kb-reflect.md
```

## Zotero Integration (two-path, not fake-fallback)

Two genuinely independent paths with different failure domains:

| Path | When | How | Failure domain |
|---|---|---|---|
| **Online** | Zotero running on Windows | pyzotero `local=True` via Windows host IP:23119 | Zotero process + network |
| **Offline** | Zotero closed or API unreachable | Import Better BibTeX CSL JSON / Better BibTeX JSON export file | Filesystem only |

### Collection-Level Sync

Papers can be synced from specific Zotero collections rather than the entire library:

| Flag | Mode | Effect |
|---|---|---|
| `--list-collections` | Online | Lists all Zotero collections with item counts |
| `--collection "Name"` | Online | Syncs only items from the named collection |
| `--tag-collection "Name"` | Offline | Tags imported items with the collection name |

**Collections are metadata, not taxonomy.** All raw files remain flat in `raw/zotero/papers/`. Collection membership is stored in the `collections:` frontmatter field. A paper can belong to multiple collections — re-syncing a different collection that includes an already-synced paper updates only the `collections:` field. Per-collection sync state is tracked in `.kb/sync_state.json` under the `collections` key.

### WSL2 connectivity
- Default NAT: use `$(cat /etc/resolv.conf | grep nameserver | awk '{print $2}'):23119`
- Mirrored mode (Win11 22H2+): use `127.0.0.1:23119`
- `zotero_sync.py` auto-detects and falls back to offline import

## Operations Pipeline (ordered by dependency)

### Phase 1 — MVP (current)

| Order | Command | What It Does | Depends on |
|---|---|---|---|
| 1 | `/kb-sync` | Zotero → raw/zotero/papers/ | Zotero running or JSON export |
| 2 | `/kb-ingest` | Stage URLs/notes/PDFs → raw/ | User input |
| 3 | `/kb-compile` | raw/ → wiki/sources/ + wiki/concepts/ + index.md | Raw content exists |
| 4 | `/kb-lint` | Check broken links, thin articles, missing provenance, duplicates | Wiki content exists |
| 5 | `/kb-ask` | Query: index → pages → synthesized answer → outputs/ | Wiki + index exist |

**Key ordering**: lint runs BEFORE any synthesis. Synthesis is Phase 2.

### Phase 2 — Intelligence (after MVP validated)
6. `/kb-reflect` — cross-cutting synthesis (only if lint passes)
7. `search.py` — BM25 keyword search
8. Literature review generation

### Phase 3 — Retrieval (after content is trustworthy)
9. REST API (read-only: search, source, concept, citation-context, changes-since)
10. MCP Server for Claude integration
11. Obsidian vault configuration

## Wiki Page Template

```markdown
---
title: "Page Title"
type: source | concept | synthesis
provenance: source-derived | llm-derived | user-verified
sources: [citekey1, citekey2]
tags: [tag1, tag2]
created: 2026-04-06
updated: 2026-04-06
entity_types: [method, dataset, author]  # optional rich metadata
---

## Summary
...

## Key Points
- Point 1 [source: citekey1, p.12]
- Point 2 [source: citekey2, sec.3]

## Related
- [[Other Concept]]
- [[Another Source]]
```

**Citation granularity**: assertion-level, not page-level. Every non-trivial claim cites `[source: citekey, location]`.

## Technology Stack (MVP)

| Component | Technology |
|---|---|
| Wiki Maintenance | Claude Code |
| Zotero Access | pyzotero (online) / JSON import (offline) |
| Search | BM25 keyword (Phase 1), +semantic (Phase 2) |
| Knowledge Viewer | Obsidian |
| Version Control | Git |

**Deferred**: FastAPI, FastMCP, sentence-transformers, PyMuPDF — added only when needed.

## Conflict Handling

| Scenario | Strategy |
|---|---|
| Same concept, two sources disagree | Add `## Contradictions` section with both claims + citations. Do not silently pick a winner. |
| Duplicate concept pages (fuzzy match) | `/kb-lint` flags; human decides merge or keep separate. |
| Source retracted or updated | Mark old source page with `status: superseded`, link to replacement. Preserve in archive/. |
| Compile same raw file twice | Idempotent — manifest check skips already-compiled files. Force recompile with `--force`. |

## Idempotency & Error Recovery

- **Compile**: manifest-gated. A file is only processed if its path is absent or not `"compiled"` in `.kb/manifest.json`. Re-running `/kb-compile` on an unchanged repo is a no-op.
- **Lint**: pure read-only check. Always safe to re-run.
- **Ingest**: checks for existing file at target path before writing. Skips duplicates.
- **Partial failure**: if compile crashes mid-file, the manifest is NOT updated for that file, so the next run picks it up. Wiki pages written before the crash remain (git allows rollback).
- **Rollback**: `git revert` or `git reset` to undo any compile batch.

## Key Design Principles

1. **User owns raw/, LLM maintains wiki/** — clear boundary
2. **Provenance everywhere** — every claim tagged, query-derived never enters wiki
3. **Lint before reflect** — deterministic checks before LLM synthesis
4. **Few directories, rich metadata** — entity types as tags, not taxonomy
5. **Index for coarse routing only** — fine-grained retrieval uses source citations
6. **Incremental & idempotent** — rerunning is safe, only new content processes
7. **Git-backed** — all wiki changes tracked with meaningful commits
8. **Conflicts are flagged, not hidden** — contradictions surfaced explicitly

## Installed ARIS Adaptations

- `/research-lit` for repo-aware literature search across `raw/`, `wiki/`, and external sources
- `/research-review` for curated external GPT review of architecture, workflow, and wiki quality
- `/gpt-nightmare-review` for direct-repo adversarial review via Codex CLI
- `/meta-optimize` for outer-loop harness optimization based on `.aris/meta/events.jsonl`
- `/mermaid-diagram` for architecture and pipeline diagrams tied to the repo's actual files and commands
