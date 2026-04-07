---
name: kb-sync
description: Sync Zotero and other raw literature into raw/zotero/papers/. Use when refreshing the source layer.
argument-hint: [optional: --offline <export.json> | --status | --collection <name> | --list-collections | --tag-collection <name>]
allowed-tools: Bash(*), Read, Write, Edit, Grep, Glob
---

# KB Sync

Sync the raw source layer for the knowledge base.

## Workflow

1. Read `CLAUDE.md` and `.kb/manifest.json` before changing anything.
2. If the user passes `--list-collections`, run `python tools/zotero_sync.py --list-collections`.
3. If the user passes `--collection <name>`, run `python tools/zotero_sync.py --collection "<name>"` (online, single collection).
4. Prefer the online sync path by running `python tools/zotero_sync.py` (full library if no collection specified).
5. If the user requests offline mode or Zotero is unavailable, run `python tools/zotero_sync.py --offline <export.json>`. Optionally with `--tag-collection "<name>"` to associate imported items with a collection.
6. If the user passes `--status`, run `python tools/zotero_sync.py --status`.
7. Do not edit files in `raw/` manually if the sync tool can produce them.
8. Do not touch `wiki/` in this command. Compilation happens in `/kb-compile`.

## Notes

- The sync tool already writes its own state to `.kb/sync_state.json`.
- New raw files should be left for compilation, not pre-summarized here.
- **Collections are metadata, not directories.** All raw files stay flat in `raw/zotero/papers/`. Collection membership is stored in the `collections:` frontmatter field of each raw file.
- A paper can belong to multiple collections. Re-syncing a different collection that contains an already-synced paper will update its `collections:` field without rewriting the file.
- `--collection` is online-only; `--tag-collection` is offline-only. They cannot be combined.
