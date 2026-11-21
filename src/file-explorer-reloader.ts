import type { ConsoleDebugComponent } from '@mnaoumov/obsidian-lib/components/console-debug-component';

import { getDataAdapterEx } from '@obsidian-typings/obsidian-public-latest/implementations';
import {
  App,
  FileSystemAdapter,
  TFile,
  TFolder
} from 'obsidian';

const ROOT_PATH = '/';

interface CombinePathParams {
  readonly directoryPath: string;
  readonly fileName: string;
}

interface FileExplorerReloaderConstructorParams {
  readonly app: App;
  readonly consoleDebugComponent: ConsoleDebugComponent;
}

interface FileExplorerReloaderReloadFolderParams {
  readonly directoryPath: string;
  readonly isRecursive: boolean;
}

export class FileExplorerReloader {
  private readonly app: App;
  private readonly consoleDebugComponent: ConsoleDebugComponent;

  public constructor(params: FileExplorerReloaderConstructorParams) {
    this.app = params.app;
    this.consoleDebugComponent = params.consoleDebugComponent;
  }

  public async reloadFileExplorer(): Promise<void> {
    await this.reloadFolder({ directoryPath: ROOT_PATH, isRecursive: true });
  }

  public async reloadFolder(params: FileExplorerReloaderReloadFolderParams): Promise<void> {
    const { directoryPath, isRecursive } = params;
    const directory = this.app.vault.getAbstractFileByPath(directoryPath);

    if (!(directory instanceof TFolder)) {
      throw new TypeError(`${directoryPath} is not a folder`);
    }

    const isRoot = directoryPath === ROOT_PATH;
    const adapter = getDataAdapterEx(this.app);
    this.consoleDebugComponent.consoleDebug(`Reloading directory ${directoryPath}`);
    await adapter.reconcileFolderCreation(directoryPath, directoryPath);
    const absolutePath = isRoot ? adapter.basePath : `${adapter.basePath}/${directoryPath}`;

    const fileSystemAdapter = this.app.vault.adapter;
    if (!(fileSystemAdapter instanceof FileSystemAdapter)) {
      throw new TypeError('The vault adapter is not a file system adapter');
    }

    const directoryEntries = await fileSystemAdapter.fsPromises.readdir(absolutePath, { withFileTypes: true });
    const existingFileItems = directoryEntries.filter((f) => !f.name.startsWith('.'));
    const existingFileNames = new Set(existingFileItems.map((f) => f.name));

    const obsidianChildren = new Map(directory.children.map((child) => [child.name, child]));
    const obsidianFileNames = new Set(obsidianChildren.keys());

    for (const fileName of existingFileNames) {
      if (obsidianFileNames.has(fileName)) {
        continue;
      }

      const path = combinePath({ directoryPath, fileName });
      this.consoleDebugComponent.consoleDebug(`Adding new file ${path}`);
      await adapter.reconcileFile(path, path, false);
    }

    for (const fileName of obsidianFileNames) {
      if (existingFileNames.has(fileName)) {
        continue;
      }

      const path = combinePath({ directoryPath, fileName });
      this.consoleDebugComponent.consoleDebug(`Deleting inexistent ${path}`);
      await adapter.reconcileFile('', path, false);
    }

    // A file present on both sides whose content changed on disk while the watcher missed it.
    // Obsidian's own `reconcileFile` fires `modified` for it, which refreshes open views and the metadata cache.
    // Idea ported from `SMB Rescan` (MIT), see THIRD-PARTY-NOTICES.md.
    for (const existingFileItem of existingFileItems) {
      if (!existingFileItem.isFile()) {
        continue;
      }

      const obsidianFile = obsidianChildren.get(existingFileItem.name);
      if (!(obsidianFile instanceof TFile)) {
        continue;
      }

      const path = combinePath({ directoryPath, fileName: existingFileItem.name });
      const absoluteFilePath = `${absolutePath}/${existingFileItem.name}`;
      const stat = await fileSystemAdapter.fsPromises.stat(absoluteFilePath);
      if (Math.round(stat.mtimeMs) === obsidianFile.stat.mtime && stat.size === obsidianFile.stat.size) {
        continue;
      }

      this.consoleDebugComponent.consoleDebug(`Refreshing changed file ${path}`);
      await adapter.reconcileFile(path, path, false);
    }

    if (isRecursive) {
      for (const existingFileItem of existingFileItems) {
        if (!existingFileItem.isDirectory()) {
          continue;
        }

        const path = combinePath({ directoryPath, fileName: existingFileItem.name });
        await this.reloadFolder({ directoryPath: path, isRecursive: true });
      }
    }
  }
}

function combinePath(params: CombinePathParams): string {
  const { directoryPath, fileName } = params;
  const isRoot = directoryPath === ROOT_PATH;
  return isRoot ? fileName : `${directoryPath}/${fileName}`;
}
