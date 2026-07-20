[Docs](https://github.com/mnaoumov/obsidian-file-explorer-reload/)

# Reload file explorer

The **Reload File Explorer** command refreshes the file list shown in the **File Explorer** pane so it matches what is actually on disk. It also adds **Reload Folder** and **Reload Folder with Subfolders** items to the folder right-click menu for refreshing just a part of the tree.

## When it helps

When you copy, move, or delete files **outside** Obsidian (from your operating system's file manager or a script) while Obsidian stays open, the **File Explorer** pane sometimes does not catch up: it keeps showing files that no longer exist, or misses files that were just added. Reloading the pane fixes this without closing and reopening Obsidian or running **Reload app without saving**, which is slow for large vaults.

## Try it

1. Run **Reload File Explorer** from the Command Palette (open it, then search for the command). The whole **File Explorer** pane rebuilds its file list from disk.
2. Right-click the **Demo folder** folder in the **File Explorer** and choose **Reload Folder** to refresh just that folder (it contains [[Nested note]]).
3. Right-click the same folder and choose **Reload Folder with Subfolders** to also refresh its subfolder, which contains [[Deep note]].

To see the real-world effect, add or remove a file inside the vault folder using your operating system's file manager while Obsidian is open. If the pane does not update on its own, run one of the reload actions above and the change appears.

## Reload folder vs. reload with subfolders

- **Reload Folder** rebuilds only the files directly in the folder you clicked.
- **Reload Folder with Subfolders** also rebuilds every nested folder inside it.

Use the first for a quick, shallow refresh; use the second when files changed deeper in the tree.
