import {
  FileSystemAdapter,
  TFolder
} from 'obsidian';
import { PluginBase } from 'obsidian-dev-utils/obsidian/plugin/plugin-base';
import { getDataAdapterEx } from 'obsidian-typings/implementations';

import type { PluginTypes } from './PluginTypes.ts';

import { ReloadFileExplorerCommand } from './Commands/ReloadFileExplorerCommand.ts';
import { ReloadFolderCommand } from './Commands/ReloadFolderCommand.ts';
import { ReloadFolderWithSubfoldersCommand } from './Commands/ReloadFolderWithSubfoldersCommand.ts';

const ROOT_PATH = '/';

export class Plugin extends PluginBase<PluginTypes> {
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
    this.consoleDebug(`Reloading directory ${directoryPath}`);
    await adapter.reconcileFolderCreation(directoryPath, directoryPath);
    const absolutePath = isRoot ? adapter.basePath : `${adapter.basePath}/${directoryPath}`;

    const readdir = (this.app.vault.adapter as FileSystemAdapter).fsPromises.readdir;

    const existingFileItems = (await readdir(absolutePath, { withFileTypes: true }))
      .filter((f) => !f.name.startsWith('.'));
    const existingFileNames = new Set(existingFileItems.map((f) => f.name));

    const obsidianFileNames = new Set(dir.children.map((child) => child.name));

    for (const fileName of existingFileNames) {
      if (!obsidianFileNames.has(fileName)) {
        const path = this.combinePath(directoryPath, fileName);
        this.consoleDebug(`Adding new file ${path}`);
        await adapter.reconcileFile(path, path, false);
      }
    }

    for (const fileName of obsidianFileNames) {
      if (!existingFileNames.has(fileName)) {
        const path = this.combinePath(directoryPath, fileName);
        this.consoleDebug(`Deleting inexistent ${path}`);
        await adapter.reconcileFile('', path, false);
      }
    }

    if (isRecursive) {
      for (const existingFileItem of existingFileItems) {
        if (existingFileItem.isDirectory()) {
          const path = this.combinePath(directoryPath, existingFileItem.name);
          await this.reloadFolder(path, true);
        }
      }
    }
  }

  protected override async onloadImpl(): Promise<void> {
    await super.onloadImpl();
    new ReloadFileExplorerCommand(this).register();
    new ReloadFolderCommand(this).register();
    new ReloadFolderWithSubfoldersCommand(this).register();
  }

  private combinePath(directoryPath: string, fileName: string): string {
    const isRoot = directoryPath === ROOT_PATH;
    return isRoot ? fileName : `${directoryPath}/${fileName}`;
  }
}
