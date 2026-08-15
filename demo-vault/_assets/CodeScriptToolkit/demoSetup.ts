import type { App } from 'obsidian';

import { Notice } from 'obsidian';
import {
  mkdir,
  rm,
  writeFile
} from 'node:fs/promises';
import { dirname, join } from 'node:path';

// Every helper here writes through `node:fs` on purpose, NOT through `app.vault`.
// The vault API tells Obsidian what changed, which is precisely the notification this plugin exists to
// Cope with the absence of — a demo that used it would never produce a stale pane to reload.

const DEMO_FOLDER_PATH = 'Materials/01 Reload file explorer/Demo folder';
const SUBFOLDER_PATH = `${DEMO_FOLDER_PATH}/Subfolder`;

function getAbsolutePath(app: App, vaultRelativePath: string): string {
  return join(app.vault.adapter.basePath, vaultRelativePath);
}

async function writeBehindObsidian(app: App, vaultRelativePath: string, content: string): Promise<void> {
  const absolutePath = getAbsolutePath(app, vaultRelativePath);
  await mkdir(dirname(absolutePath), { recursive: true });
  await writeFile(absolutePath, content, 'utf-8');
}

/**
 * Creates a note directly on disk in `Demo folder`, without telling Obsidian.
 *
 * Manual equivalent: switch to your file manager and create the file there while Obsidian stays open.
 */
export async function createNoteOnDisk(app: App): Promise<void> {
  await writeBehindObsidian(app, `${DEMO_FOLDER_PATH}/Created on disk.md`, '# Created on disk\n\nThis note was written straight to disk, so Obsidian was never told about it.\n');
  new Notice('Wrote "Created on disk.md" to disk. If the File Explorer does not show it, reload the folder.');
}

/**
 * Creates a note directly on disk one level deeper, inside `Demo folder/Subfolder`.
 *
 * This is the one that shows the difference between the two folder commands: `Reload Folder` on
 * `Demo folder` will not pick it up, `Reload Folder with Subfolders` will.
 *
 * Manual equivalent: create the file in `Demo folder/Subfolder` from your file manager.
 */
export async function createDeepNoteOnDisk(app: App): Promise<void> {
  await writeBehindObsidian(app, `${SUBFOLDER_PATH}/Created deeper on disk.md`, '# Created deeper on disk\n\nThis note sits one level down, so only a recursive reload finds it.\n');
  new Notice('Wrote "Created deeper on disk.md" into Subfolder. Only a recursive reload picks it up.');
}

/**
 * Deletes both notes the buttons above create, again straight from disk.
 *
 * Manual equivalent: delete them in your file manager. Run a reload afterwards and the File Explorer
 * stops showing them.
 */
export async function removeNotesFromDisk(app: App): Promise<void> {
  await rm(getAbsolutePath(app, `${DEMO_FOLDER_PATH}/Created on disk.md`), { force: true });
  await rm(getAbsolutePath(app, `${SUBFOLDER_PATH}/Created deeper on disk.md`), { force: true });
  new Notice('Deleted both notes from disk. Reload to see them disappear from the File Explorer.');
}

/**
 * Runs the plugin's `Reload File Explorer` command.
 *
 * Only the vault-wide command is offered as a button. The two folder commands act on the folder you
 * invoke them from, so running them from here would target this note's folder rather than the one the
 * walkthrough is about — for those, use the right-click menu, which is the real way in anyway.
 *
 * Manual equivalent: `File Explorer Reload: Reload File Explorer` in the Command Palette.
 */
export function reloadFileExplorer(app: App): void {
  app.commands.executeCommandById('file-explorer-reload:reload-file-explorer');
}
