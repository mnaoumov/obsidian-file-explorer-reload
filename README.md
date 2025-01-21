# File Explorer Reload

This is a plugin for [Obsidian](https://obsidian.md/) that reloads the file explorer files list.

It is needed sometimes when you made a bulk file operation (copy / move / delete) outside of `Obsidian` while it is open and some of those changes aren't reflected in the `File Explorer` pane. So you might see in the `File Explorer` some files that don't actually exist in the file system, or the opposite, you might miss some files that actually exist in the file system.

- [Video of the issue](https://www.youtube.com/watch?v=C-uKULzPNX4).
- Discussion on the [Official Obsidian forum](https://forum.obsidian.md/t/sometimes-changes-made-outside-of-obsidian-are-not-reflected-in-the-files-pane/73451).

The usual workaround for this problem is to close and reopen `Obsidian` or invoke `Reload app without saving` command, but for big vaults such workarounds adds undesired waiting time, which the current plugin is aiming to avoid.

The plugin adds `Reload File Explorer` command, `Reload Folder` and `Reload Folder with Subfolders` context menu items.

Also you can use this plugin's functionality programmatically

```js
await app.plugins.plugins["file-explorer-reload"].reloadDirectory(directoryPath, isRecursive);
```

## Installation

- `File Explorer Reload` is not available on [the official Community Plugins repository](https://obsidian.md/plugins) yet.
- Beta releases can be installed through [BRAT](https://obsidian.md/plugins?id=obsidian42-brat).

## Debugging

By default, debug messages for this plugin are hidden.

To show them, run the following command:

```js
window.DEBUG.enable('file-explorer-reload');
```

For more details, refer to the [documentation](https://github.com/mnaoumov/obsidian-dev-utils?tab=readme-ov-file#debugging).

## Support

<a href="https://www.buymeacoffee.com/mnaoumov" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" style="height: 60px !important;width: 217px !important;"></a>

## License

© [Michael Naumov](https://github.com/mnaoumov/)
