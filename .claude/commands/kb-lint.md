---
name: kb-lint
description: Deterministic health check on wiki/. Must pass before any /kb-reflect. Checks provenance, wikilinks, duplicates, orphans.
argument-hint: [optional: --fix to auto-fix safe issues]
allowed-tools: Bash(*), Read, Grep, Glob, Edit
---

# KB Lint: Wiki Health Check

Run deterministic checks on wiki/ content. This MUST pass before any `/kb-reflect` synthesis.

## Context: $ARGUMENTS

## Checks (ordered by severity)

### CRITICAL: Provenance Compliance
- Every `.md` file in `wiki/` must have YAML frontmatter with: `title`, `type`, `provenance`, `sources`
- `provenance` must be one of: `source-derived`, `llm-derived`, `user-verified`
- `type` must be one of: `source`, `concept`, `synthesis`
- Files in `wiki/synthesis/` must have `provenance: llm-derived` and `sources` with ≥2 entries

### HIGH: Broken Wikilinks
- Scan all `[[wikilinks]]` in wiki/ files
- For each link, check if a corresponding `.md` file exists in wiki/
- Report broken links with file path and line number

### HIGH: Source Integrity
- Every file in `wiki/sources/` must reference a file in `raw/` (via manifest or metadata)
- Check `.kb/manifest.json` consistency: every "compiled" entry's source_page should exist

### MEDIUM: Thin Articles
- Any wiki page with fewer than 3 non-empty lines of content (excluding frontmatter) is flagged
- Threshold: body < 50 words

### MEDIUM: Duplicate Concepts
- Check for concept pages with very similar titles (case-insensitive, ignore hyphens/underscores)
- E.g., `attention-mechanism.md` vs `attention-mechanisms.md`

### LOW: Orphan Pages
- Pages not listed in `wiki/index.md` and not linked from any other page

### LOW: Index Consistency
- Every page in `wiki/sources/`, `wiki/concepts/`, `wiki/synthesis/` should have an entry in `wiki/index.md`
- Every entry in `wiki/index.md` should point to an existing file

## Output Format

```
KB Lint Report
==============
CRITICAL: 0 issues
HIGH:     2 issues
MEDIUM:   1 issue
LOW:      0 issues

[HIGH] Broken wikilink: wiki/concepts/attention.md:15 → [[Transformer Architecture]] (not found)
[HIGH] Broken wikilink: wiki/concepts/scaling.md:8 → [[GPT-4]] (not found)
[MEDIUM] Thin article: wiki/concepts/bert.md (23 words)

Overall: WARN (2 high issues)
```

Status: `PASS` (0 critical, 0 high), `WARN` (0 critical, >0 high), `FAIL` (>0 critical)

## Auto-fix (when --fix is passed)

Only fix unambiguous issues:
- Remove broken index entries pointing to nonexistent files
- Add missing index entries for existing wiki pages
- Do NOT auto-merge duplicate concepts (flag only)
- Do NOT auto-delete thin articles (flag only)

## Key Rules

- This is a **deterministic** check — no LLM judgment calls.
- Report results to stdout, not to a file.
- Return exit status: 0 for PASS, 1 for WARN, 2 for FAIL.
