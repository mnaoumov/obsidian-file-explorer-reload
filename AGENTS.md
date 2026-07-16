# AGENTS.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

File Explorer Reload is a desktop-only Obsidian plugin that reloads the file explorer pane, reconciling Obsidian's in-memory vault tree with the actual files on disk. It is built on `obsidian-dev-utils`.

## Commands

| Task              | Command                    |
|-------------------|----------------------------|
| TypeScript check  | `npm run build:compile`    |
| Build             | `npm run build`            |
| Dev (watch)       | `npm run dev`              |
| Lint              | `npm run lint`             |
| Lint (fix)        | `npm run lint:fix`         |
| Format            | `npm run format`           |
| Format (check)    | `npm run format:check`     |
| Spellcheck        | `npm run spellcheck`       |
| Markdown lint     | `npm run lint:md`          |
| Markdown lint fix | `npm run lint:md:fix`      |
| Unit tests        | `npm test`                 |
| Coverage          | `npm run test:coverage`    |
| Integration tests | `npm run test:integration` |
| Commit (wizard)   | `npm run commit`           |

## Architecture

- **Root config files** are thin re-exports — actual logic lives in `scripts/` (`eslint.config.mts` → `scripts/eslint-config.ts`, `commitlint.config.ts` → `scripts/commitlint-config.ts`).
- **`src/`** — plugin source:
  - `main.ts` — Obsidian entry point (default export of `Plugin`)
  - `plugin.ts` — `Plugin extends PluginBase`; `onloadImpl` constructs the `FileExplorerReloader` and wires a `CommandHandlerComponent` (with the three command handlers, an `AppActiveFileProvider`, a `PluginCommandRegistrar`, and a `MenuEventRegistrarComponent`)
  - `file-explorer-reloader.ts` — core reconcile logic; walks the on-disk folder via the data adapter (`getDataAdapterEx`, `FileSystemAdapter` `readdir`) and adds/deletes files to sync Obsidian's `TFolder` children, recursing when requested
  - `command-handlers/reload-file-explorer-command-handler.ts` — `GlobalCommandHandler`; reloads the whole vault from root recursively
  - `command-handlers/reload-folder-command-handler.ts` — `FolderCommandHandler`; reloads a single folder (non-recursive) from the folder context menu
  - `command-handlers/reload-folder-with-subfolders-command-handler.ts` — `FolderCommandHandler`; reloads a folder and its subfolders recursively
- **`main` field** points to `src/main.ts` (Obsidian plugin source entry; built artifact is `dist/build/main.js`, not published to npm).
