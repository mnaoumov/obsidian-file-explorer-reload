import type { ConsoleDebugComponent } from 'obsidian-dev-utils/obsidian/plugin/components/console-debug-component';

import {
  App,
  FileSystemAdapter,
  TFolder
} from 'obsidian';
import { getDataAdapterEx } from '@obsidian-typings/obsidian-public-latest/implementations';

const ROOT_PATH = '/';

interface FileExplorerReloaderConstructorParams {
  readonly app: App;
  readonly consoleDebugComponent: ConsoleDebugComponent;
}

export class FileExplorerReloader {
  private readonly app: App;
  private readonly consoleDebugComponent: ConsoleDebugComponent;

  public constructor(params: FileExplorerReloaderConstructorParams) {
    this.app = params.app;
    this.consoleDebugComponent = params.consoleDebugComponent;
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
