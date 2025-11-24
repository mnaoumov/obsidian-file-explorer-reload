import {
  FileSystemAdapter,
  Menu,
  TAbstractFile,
  TFolder
} from 'obsidian';
import { PluginBase } from 'obsidian-dev-utils/obsidian/Plugin/PluginBase';

import type { PluginTypes } from './PluginTypes.ts';

const ROOT_PATH = '/';

export class Plugin extends PluginBase<PluginTypes> {
  public async reloadDirectory(directoryPath: string, isRecursive: boolean): Promise<void> {
    const dir = this.app.vault.getAbstractFileByPath(directoryPath);

    if (!(dir instanceof TFolder)) {
      throw new Error(`${directoryPath} is not a folder`);
    }

    const isRoot = directoryPath === ROOT_PATH;
    const adapter = this.app.vault.adapter;
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
          await this.reloadDirectory(path, true);
        }
      }
    }
  }

  protected override async onloadImpl(): Promise<void> {
    await super.onloadImpl();
    this.addCommand({
      callback: this.reloadFileExplorer.bind(this),
      id: 'reload-file-explorer',
      name: 'Reload file explorer'
    });

    this.registerEvent(this.app.workspace.on('file-menu', this.handleFileMenu.bind(this)));
  }

  private combinePath(directoryPath: string, fileName: string): string {
    const isRoot = directoryPath === ROOT_PATH;
    return isRoot ? fileName : `${directoryPath}/${fileName}`;
  }

  private handleFileMenu(menu: Menu, file: TAbstractFile): void {
    if (!(file instanceof TFolder)) {
      return;
    }

    menu.addItem((item) => {
      item
        .setTitle('Reload folder')
        .setIcon('folder-sync')
        .onClick(() => this.reloadDirectory(file.path, false));
    });

    menu.addItem((item) => {
      item
        .setTitle('Reload folder with subfolders')
        .setIcon('folder-sync')
        .onClick(() => this.reloadDirectory(file.path, true));
    });
  }

  private async reloadFileExplorer(): Promise<void> {
    await this.reloadDirectory(ROOT_PATH, true);
  }
}
