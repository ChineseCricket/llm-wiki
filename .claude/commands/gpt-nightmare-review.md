---
name: gpt-nightmare-review
description: Run a hostile external repo review where GPT reads the repository directly. Use before major merges, architecture shifts, or when you want adversarial verification.
argument-hint: [optional: target scope or files]
allowed-tools: Bash(*), Read, Grep, Glob, Write, Edit
---

# GPT Nightmare Review

This is the ARIS-style `nightmare` review adapted to the LLM wiki project.

## Goal

Let GPT inspect the repository directly instead of reviewing only a Claude-curated summary.

## Workflow

1. Read the requested scope plus the baseline architecture documents.
2. Create a prompt file in `outputs/reviews/` that tells GPT to verify claims by reading the repo itself.
3. Run `node tools/review/run_codex_exec.js <prompt-file>`.
4. Save the raw review to `outputs/reviews/<timestamp>-nightmare-review.md`.
5. Extract severity-ranked findings, minimum fixes, and any claims that the repo does not actually support.

## Review Focus For This Repo

- architecture claims vs implemented files
- provenance safety and feedback-loop contamination
- KB pipeline integrity: `raw -> wiki -> outputs`
- reviewability of `.claude/commands/` and `tools/`
- missing deterministic checks, missing recovery paths, and unsafe automation assumptions

## Rules

- Do not soften the review.
- Ask GPT to verify repository claims directly.
- Prefer evidence-backed criticism over style commentary.
