# Start here

This is an [Obsidian](https://obsidian.md/) vault that documents the
[File Explorer Reload](https://github.com/mnaoumov/obsidian-file-explorer-reload/) plugin by
demonstrating it.

Copy, move or delete files **outside** Obsidian while it is open — from your file manager, a script, a
sync client — and the File Explorer pane can fall behind what is actually on disk: files that no longer
exist keep showing, new ones never appear. The usual fix is **Reload app without saving**, which throws
away the whole session to refresh one pane, and is slow on a large vault.

This plugin refreshes just the file list: the whole pane, one folder, or one folder and everything
under it.

## Your first minute

1. Add or delete a file inside this vault using your operating system's file manager, with Obsidian
   still open. Notice the File Explorer does not necessarily notice.
2. Run **Reload File Explorer** from the Command Palette. The pane rebuilds from disk and the change
   appears.
3. For a narrower refresh, right-click a folder and choose **Reload Folder**.

## Features

- [01 Reload file explorer](<./01 Reload file explorer.md>)

## Materials

`Materials/` holds the folder the walkthrough refreshes — a folder with a nested subfolder, so the
difference between reloading one folder and reloading it with its subfolders is visible.
