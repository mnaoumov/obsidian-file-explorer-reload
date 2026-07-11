import type { ConsoleDebugComponent } from 'obsidian-dev-utils/obsidian/components/console-debug-component';

import { getDataAdapterEx } from '@obsidian-typings/obsidian-public-latest/implementations';
import {
  App,
  FileSystemAdapter,
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
    const dir = this.app.vault.getAbstractFileByPath(directoryPath);

    if (!(dir instanceof TFolder)) {
      throw new Error(`${directoryPath} is not a folder`);
    }

    const isRoot = directoryPath === ROOT_PATH;
    const adapter = getDataAdapterEx(this.app);
    this.consoleDebugComponent.consoleDebug(`Reloading directory ${directoryPath}`);
    await adapter.reconcileFolderCreation(directoryPath, directoryPath);
    const absolutePath = isRoot ? adapter.basePath : `${adapter.basePath}/${directoryPath}`;

    const readdir = (this.app.vault.adapter as FileSystemAdapter).fsPromises.readdir;

    const existingFileItems = (await readdir(absolutePath, { withFileTypes: true }))
      .filter((f) => !f.name.startsWith('.'));
    const existingFileNames = new Set(existingFileItems.map((f) => f.name));

    const obsidianFileNames = new Set(dir.children.map((child) => child.name));

    for (const fileName of existingFileNames) {
      if (!obsidianFileNames.has(fileName)) {
        const path = combinePath({ directoryPath, fileName });
        this.consoleDebugComponent.consoleDebug(`Adding new file ${path}`);
        await adapter.reconcileFile(path, path, false);
      }
    }

    for (const fileName of obsidianFileNames) {
      if (!existingFileNames.has(fileName)) {
        const path = combinePath({ directoryPath, fileName });
        this.consoleDebugComponent.consoleDebug(`Deleting inexistent ${path}`);
        await adapter.reconcileFile('', path, false);
      }
    }

    if (isRecursive) {
      for (const existingFileItem of existingFileItems) {
        if (existingFileItem.isDirectory()) {
          const path = combinePath({ directoryPath, fileName: existingFileItem.name });
          await this.reloadFolder({ directoryPath: path, isRecursive: true });
        }
      }
    }
  }
}

function combinePath(params: CombinePathParams): string {
  const { directoryPath, fileName } = params;
  const isRoot = directoryPath === ROOT_PATH;
  return isRoot ? fileName : `${directoryPath}/${fileName}`;
}
