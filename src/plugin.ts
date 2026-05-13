import type {
  App,
  PluginManifest
} from 'obsidian';

import {
  FileSystemAdapter,
  TFolder
} from 'obsidian';
import { AppActiveFileProvider } from 'obsidian-dev-utils/obsidian/active-file-provider';
import { CommandHandlerComponent } from 'obsidian-dev-utils/obsidian/command-handlers/command-handler-component';
import { PluginCommandRegistrar } from 'obsidian-dev-utils/obsidian/command-registrar';
import { AppMenuEventRegistrar } from 'obsidian-dev-utils/obsidian/menu-event-registrar';
import { PluginBase } from 'obsidian-dev-utils/obsidian/plugin/plugin';
import { getDataAdapterEx } from 'obsidian-typings/implementations';

import { ReloadFileExplorerCommandHandler } from './command-handlers/reload-file-explorer-command-handler.ts';
import { ReloadFolderCommandHandler } from './command-handlers/reload-folder-command-handler.ts';
import { ReloadFolderWithSubfoldersCommandHandler } from './command-handlers/reload-folder-with-subfolders-command-handler.ts';

const ROOT_PATH = '/';

export class Plugin extends PluginBase {
  public constructor(app: App, manifest: PluginManifest) {
    super(app, manifest);
    const reloadFileExplorer = this.reloadFileExplorer.bind(this);
    const reloadFolder = this.reloadFolder.bind(this);

    this.addChild(
      new CommandHandlerComponent({
        activeFileProvider: new AppActiveFileProvider(app),
        commandHandlers: [
          new ReloadFileExplorerCommandHandler({
            reloadFileExplorer
          }),
          new ReloadFolderCommandHandler({
            reloadFolder
          }),
          new ReloadFolderWithSubfoldersCommandHandler({
            reloadFolder
          })
        ],
        commandRegistrar: new PluginCommandRegistrar(this),
        menuEventRegistrar: new AppMenuEventRegistrar(app, this),
        pluginName: manifest.name
      })
    );
  }

  public async reloadFileExplorer(): Promise<void> {
    await this.reloadFolder(ROOT_PATH, true);
  }

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

function combinePath(directoryPath: string, fileName: string): string {
  const isRoot = directoryPath === ROOT_PATH;
  return isRoot ? fileName : `${directoryPath}/${fileName}`;
}
