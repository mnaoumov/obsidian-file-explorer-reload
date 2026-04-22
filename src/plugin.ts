/**
 * @file
 *
 * Main plugin class for file-explorer-reload.
 */

import type {
  App,
  PluginManifest
} from 'obsidian';

import {
  FileSystemAdapter,
  TFolder
} from 'obsidian';
import { CommandHandlerComponent } from 'obsidian-dev-utils/obsidian/command-handlers/command-handler-component';
import { PluginBase } from 'obsidian-dev-utils/obsidian/plugin/plugin';
import { getDataAdapterEx } from 'obsidian-typings/implementations';

import { ReloadFileExplorerCommandHandler } from './command-handlers/reload-file-explorer-command-handler.ts';
import { ReloadFolderCommandHandler } from './command-handlers/reload-folder-command-handler.ts';
import { ReloadFolderWithSubfoldersCommandHandler } from './command-handlers/reload-folder-with-subfolders-command-handler.ts';

const ROOT_PATH = '/';
const PLUGIN_NAME = 'file-explorer-reload';

/**
 * Plugin that provides commands to reload the file explorer.
 */
export class Plugin extends PluginBase {
  /**
   * Creates a new Plugin instance.
   *
   * @param app - The Obsidian app instance.
   * @param manifest - The plugin manifest.
   */
  public constructor(app: App, manifest: PluginManifest) {
    super(app, manifest);
    const reloadFileExplorer = this.reloadFileExplorer.bind(this);
    const reloadFolder = this.reloadFolder.bind(this);
    this.registerComponent({
      component: new CommandHandlerComponent(this, new ReloadFileExplorerCommandHandler({ pluginName: PLUGIN_NAME, reloadFileExplorer }))
    });
    this.registerComponent({ component: new CommandHandlerComponent(this, new ReloadFolderCommandHandler({ pluginName: PLUGIN_NAME, reloadFolder })) });
    this.registerComponent({
      component: new CommandHandlerComponent(this, new ReloadFolderWithSubfoldersCommandHandler({ pluginName: PLUGIN_NAME, reloadFolder }))
    });
  }

  /**
   * Reloads the entire file explorer by reloading the root folder recursively.
   */
  public async reloadFileExplorer(): Promise<void> {
    await this.reloadFolder(ROOT_PATH, true);
  }

  /**
   * Reloads a specific folder in the file explorer.
   *
   * @param directoryPath - The path of the directory to reload.
   * @param isRecursive - Whether to reload subfolders recursively.
   */
  public async reloadFolder(directoryPath: string, isRecursive: boolean): Promise<void> {
    const dir = this.app.vault.getAbstractFileByPath(directoryPath);

    if (!(dir instanceof TFolder)) {
      throw new Error(`${directoryPath} is not a folder`);
    }

    const isRoot = directoryPath === ROOT_PATH;
    const adapter = getDataAdapterEx(this.app);
    this.consoleDebugComponent.debug(`Reloading directory ${directoryPath}`);
    await adapter.reconcileFolderCreation(directoryPath, directoryPath);
    const absolutePath = isRoot ? adapter.basePath : `${adapter.basePath}/${directoryPath}`;

    const readdir = (this.app.vault.adapter as FileSystemAdapter).fsPromises.readdir;

    const existingFileItems = (await readdir(absolutePath, { withFileTypes: true }))
      .filter((f) => !f.name.startsWith('.'));
    const existingFileNames = new Set(existingFileItems.map((f) => f.name));

    const obsidianFileNames = new Set(dir.children.map((child) => child.name));

    for (const fileName of existingFileNames) {
      if (!obsidianFileNames.has(fileName)) {
        const path = combinePath(directoryPath, fileName);
        this.consoleDebugComponent.debug(`Adding new file ${path}`);
        await adapter.reconcileFile(path, path, false);
      }
    }

    for (const fileName of obsidianFileNames) {
      if (!existingFileNames.has(fileName)) {
        const path = combinePath(directoryPath, fileName);
        this.consoleDebugComponent.debug(`Deleting inexistent ${path}`);
        await adapter.reconcileFile('', path, false);
      }
    }

    if (isRecursive) {
      for (const existingFileItem of existingFileItems) {
        if (existingFileItem.isDirectory()) {
          const path = combinePath(directoryPath, existingFileItem.name);
          await this.reloadFolder(path, true);
        }
      }
    }
  }
}

/**
 * Combines a directory path and a file name into a full path.
 *
 * @param directoryPath - The directory path.
 * @param fileName - The file name.
 * @returns The combined path.
 */
function combinePath(directoryPath: string, fileName: string): string {
  const isRoot = directoryPath === ROOT_PATH;
  return isRoot ? fileName : `${directoryPath}/${fileName}`;
}
