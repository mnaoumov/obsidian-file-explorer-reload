# AGENTS.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Filing an issue (for AI agents and humans)

Open issues through the [issue forms](https://github.com/mnaoumov/obsidian-file-explorer-reload/issues/new/choose), not as blank issues.

Filing from the CLI or the API (`gh issue create --body`, or an AI agent filing for you) skips the form, and `gh issue create --template` cannot load an issue form. In that case, open the matching form in [`.github/ISSUE_TEMPLATE/`](https://github.com/mnaoumov/obsidian-file-explorer-reload/tree/HEAD/.github/ISSUE_TEMPLATE), copy every field as a `### <label>` heading in the form's order, and fill in each one. Always state the plugin version, the Obsidian version and your operating system.

## Overview

`File Explorer Reload` is a desktop-only Obsidian plugin that reloads the file explorer pane, reconciling Obsidian's in-memory vault tree with the actual files on disk. It is built on `@mnaoumov/obsidian-lib` and the `@mnaoumov` dev tooling packages.

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
| Branch gate       | `npm run gate`             |
| Commit (wizard)   | `npm run commit`           |

## Architecture

- **Root config files** are thin re-exports — actual logic lives in `scripts/` (`eslint.config.mts` → `scripts/eslint-config.ts`, `commitlint.config.ts` → `scripts/commitlint-config.ts`).
- **`src/`** — plugin source:
  - `main.ts` — Obsidian entry point (default export of `Plugin`)
  - `plugin.ts` — `Plugin extends PluginBase`; `onloadImpl` adds the settings component and tab, constructs the `FileExplorerReloader`, registers the command handlers, and adds the `FileExplorerReloadButtonComponent`, whose click runs the `reload-file-explorer` command by id
  - `plugin-settings.ts`, `plugin-settings-component.ts`, `plugin-settings-tab.ts` — the one setting, `shouldShowReloadButton` (default on), and its toggle
  - `file-explorer-reload-button-component.ts` — adds a nav button to the header of every File Explorer leaf through Obsidian's `HeaderDom.addNavButton`, at layout ready, on `layout-change` and on every settings load or save; removes them when the setting is off and on unload
  - `file-explorer-reloader.ts` — core reconcile logic; walks the on-disk folder via the data adapter (`getDataAdapterEx`, `FileSystemAdapter` `readdir`) and adds/deletes files to sync Obsidian's `TFolder` children, re-reconciles a file present on both sides whose on-disk `mtime`/`size` differs from its `TFile.stat` (so Obsidian fires `modified`), recursing when requested
  - `command-handlers/reload-file-explorer-command-handler.ts` — `GlobalCommandHandler`; reloads the whole vault from root recursively
  - `command-handlers/reload-folder-command-handler.ts` — `FolderCommandHandler`; reloads a single folder (non-recursive) from the folder context menu
  - `command-handlers/reload-folder-with-subfolders-command-handler.ts` — `FolderCommandHandler`; reloads a folder and its subfolders recursively
- **`main` field** points to `src/main.ts` (Obsidian plugin source entry; built artifact is `dist/build/main.js`, not published to `npm`).
