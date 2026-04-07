---
name: kb-compile
description: Compile unprocessed raw/ files into wiki/sources/ and wiki/concepts/. Updates index.md. Core knowledge pipeline.
argument-hint: [optional: specific file in raw/ to compile]
allowed-tools: Bash(*), Read, Write, Edit, Grep, Glob
---

# KB Compile: raw/ → wiki/

Process uncompiled files from `raw/` into wiki pages with proper provenance.

## Context: $ARGUMENTS

## Prerequisites
- Read `CLAUDE.md` for wiki page format, provenance model, and forbidden operations.
- Read `.kb/manifest.json` for current compilation state.

## Workflow

### Step 1: Identify Uncompiled Files

Read `.kb/manifest.json`. Scan `raw/` recursively for all `.md` and `.json` files. Any file NOT listed in manifest with `"status": "compiled"` is a candidate.

If `$ARGUMENTS` specifies a file, only compile that file.

### Step 2: For Each Uncompiled File

**A. Read the raw file completely.**

**B. Create source page** at `wiki/sources/<slug>.md`:
- `type: source`
- `provenance: source-derived`
- Include: summary, key points with assertion-level citations `[source: citekey, location]`, metadata
- Slug format: `<firstauthor><year>-<keyword>` for papers, descriptive slug for notes/web
- If the raw file has `collections: [Name1, Name2]` in frontmatter, add `collection:kebab-name` tags to the source page's `tags:` field (e.g., `collections: [LLM Safety]` → `tags: [collection:llm-safety]`). This follows the existing `entity:value` tag convention.

**C. Identify and update concept pages:**
- Extract 3-7 key concepts from the source.
- For each concept:
  - Check if `wiki/concepts/<concept-slug>.md` exists.
  - If YES: read existing page, append new information with source citation. Preserve existing content. If contradictions found, add a `## Contradictions` section.
  - If NO: create new page with `type: concept`, `provenance: llm-derived`, citing this source.
- Use `[[wikilinks]]` to cross-reference between pages.

**D. Update `wiki/index.md`:**
- Add entry under `## Sources`: `- [[Source Slug]] — one-line summary`
- Add/update entries under `## Concepts` for new or updated concepts.
- Replace placeholder text (`_No sources compiled yet._` etc.) on first compile.

**E. Update `.kb/manifest.json`:**
```json
{
  "files": {
    "raw/zotero/papers/example.md": {
      "status": "compiled",
      "compiled_at": "2026-04-06T12:00:00Z",
      "source_page": "wiki/sources/example.md",
      "concepts_touched": ["concept-a", "concept-b"]
    }
  }
}
```

### Step 3: Log and Commit

Append to `log.md`:
```
[2026-04-06 12:00] [COMPILE] <source-slug>: +1 source, +N concepts (new: X, updated: Y)
```

Git commit with message: `compile: <source-slug> (+1 source, +N concepts)`

## Key Rules

- ALWAYS read CLAUDE.md before starting.
- EVERY claim in a source page must cite `[source: citekey, location]`.
- NEVER create wiki pages without provenance frontmatter.
- NEVER modify files in `raw/`.
- If a concept page already exists, READ it first before appending.
- Flag contradictions explicitly — do not silently resolve them.
- Keep source pages factual. Save interpretation for concept pages.
