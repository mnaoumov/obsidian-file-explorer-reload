# Reload file explorer

The **Reload File Explorer** command refreshes the file list shown in the **File Explorer** pane so it matches what is actually on disk. It also adds **Reload Folder** and **Reload Folder with Subfolders** items to the folder right-click menu for refreshing just a part of the tree.

## When it helps

When you copy, move, or delete files **outside** Obsidian (from your operating system's file manager or a script) while Obsidian stays open, the **File Explorer** pane sometimes does not catch up: it keeps showing files that no longer exist, or misses files that were just added. Reloading the pane fixes this without closing and reopening Obsidian or running **Reload app without saving**, which is slow for large vaults.

## Try it

The interesting state - a File Explorer that disagrees with the disk - needs a file to appear without Obsidian being told. The button below does exactly what alt-tabbing to your file manager would: it writes straight to disk with Node's `fs`, never through Obsidian's vault API.

```code-button
---
caption: Create a note on disk, behind Obsidian's back
---
await require('/demoSetup.ts').createNoteOnDisk(app);
```

Manual equivalent: create `Created on disk.md` inside `Materials/01 Reload file explorer/Demo folder` from your operating system's file manager, with Obsidian still open.

Now look at **Demo folder** in the **File Explorer**. If the new note is not there, the pane is stale - which is the whole problem this plugin solves:

```code-button
---
caption: Reload File Explorer
---
require('/demoSetup.ts').reloadFileExplorer(app);
```

Manual equivalent: run **File Explorer Reload: Reload File Explorer** from the Command Palette.

The two folder commands are not offered as buttons on purpose: they act on the folder you invoke them from, so a button here would target this note's folder rather than the one the walkthrough is about. Right-click **Demo folder** in the **File Explorer** and choose **Reload Folder** - the real way in anyway. It refreshes just that folder, which contains [Nested note](<./Materials/01 Reload file explorer/Demo folder/Nested note.md>).

To see what **Reload Folder with Subfolders** adds, put a file one level deeper:

```code-button
---
caption: Create a note one level deeper on disk
---
await require('/demoSetup.ts').createDeepNoteOnDisk(app);
```

Manual equivalent: create `Created deeper on disk.md` inside `Demo folder/Subfolder` from your file manager.

Right-click **Demo folder** and choose **Reload Folder**: the deeper note stays missing, because that command rebuilds only the folder's own children. Choose **Reload Folder with Subfolders** and it appears, next to [Deep note](<./Materials/01 Reload file explorer/Demo folder/Subfolder/Deep note.md>).

When you are done, put the vault back the way it started:

```code-button
---
caption: Delete both created notes from disk
---
await require('/demoSetup.ts').removeNotesFromDisk(app);
```

Manual equivalent: delete both notes in your file manager. Reload afterwards and the File Explorer stops showing them - deletions go stale exactly the same way additions do.

## Reload folder vs. reload with subfolders

- **Reload Folder** rebuilds only the files directly in the folder you clicked.
- **Reload Folder with Subfolders** also rebuilds every nested folder inside it.

Use the first for a quick, shallow refresh; use the second when files changed deeper in the tree.
