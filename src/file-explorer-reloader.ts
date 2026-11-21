import type { ConsoleDebugComponent } from '@mnaoumov/obsidian-lib/components/console-debug-component';
import type { PluginNoticeComponent } from '@mnaoumov/obsidian-lib/components/plugin-notice-component';

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

interface DirectoryEntry {
  readonly isDirectory: () => boolean;
  readonly isSymbolicLink: () => boolean;
}

interface FileExplorerReloaderConstructorParams {
  readonly app: App;
  readonly consoleDebugComponent: ConsoleDebugComponent;
  readonly pluginNoticeComponent: PluginNoticeComponent;
}

interface FileExplorerReloaderReloadFolderImplParams {
  readonly ancestorRealPaths: ReadonlySet<string>;
  readonly directoryPath: string;
  readonly isRecursive: boolean;
  readonly summary: ReloadSummary;
}

interface FileExplorerReloaderReloadFolderParams {
  readonly directoryPath: string;
  readonly isRecursive: boolean;
}

interface FormatReloadSummaryParams {
  readonly directoryPath: string;
  readonly summary: ReloadSummary;
}

interface IsDirectoryEntryParams {
  readonly absolutePath: string;
  readonly entry: DirectoryEntry;
  readonly fileSystemAdapter: FileSystemAdapter;
}

interface ReloadSummary {
  // eslint-disable-next-line typescript-dev-toolkit/readonly-interface-members -- The counters accumulate across the recursive walk.
  added: number;
  // eslint-disable-next-line typescript-dev-toolkit/readonly-interface-members -- The counters accumulate across the recursive walk.
  modified: number;
  // eslint-disable-next-line typescript-dev-toolkit/readonly-interface-members -- The counters accumulate across the recursive walk.
  removed: number;
}

export class FileExplorerReloader {
  private readonly app: App;
  private readonly consoleDebugComponent: ConsoleDebugComponent;
  private readonly pluginNoticeComponent: PluginNoticeComponent;

  public constructor(params: FileExplorerReloaderConstructorParams) {
    this.app = params.app;
    this.consoleDebugComponent = params.consoleDebugComponent;
    this.pluginNoticeComponent = params.pluginNoticeComponent;
  }

  public async reloadFileExplorer(): Promise<void> {
    await this.reloadFolder({ directoryPath: ROOT_PATH, isRecursive: true });
  }

  public async reloadFolder(params: FileExplorerReloaderReloadFolderParams): Promise<void> {
    const { directoryPath, isRecursive } = params;
    const summary: ReloadSummary = { added: 0, modified: 0, removed: 0 };
    await this.reloadFolderImpl({ ancestorRealPaths: new Set(), directoryPath, isRecursive, summary });
    // Idea ported from SMB Rescan and Vault File Refresh (both MIT), see THIRD-PARTY-NOTICES.md.
    this.pluginNoticeComponent.showNotice(formatReloadSummary({ directoryPath, summary }));
  }

  private async reloadFolderImpl(params: FileExplorerReloaderReloadFolderImplParams): Promise<void> {
    const { ancestorRealPaths, directoryPath, isRecursive, summary } = params;
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
      summary.added++;
    }

    for (const fileName of obsidianFileNames) {
      if (existingFileNames.has(fileName)) {
        continue;
      }

      const path = combinePath({ directoryPath, fileName });
      this.consoleDebugComponent.consoleDebug(`Deleting inexistent ${path}`);
      await adapter.reconcileFile('', path, false);
      summary.removed++;
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
      summary.modified++;
    }

    if (!isRecursive) {
      return;
    }

    const realPath = await fileSystemAdapter.fsPromises.realpath(absolutePath);
    const nextAncestorRealPaths = new Set(ancestorRealPaths).add(realPath);

    for (const existingFileItem of existingFileItems) {
      const absoluteChildPath = `${absolutePath}/${existingFileItem.name}`;
      if (!await isDirectoryEntry({ absolutePath: absoluteChildPath, entry: existingFileItem, fileSystemAdapter })) {
        continue;
      }

      const path = combinePath({ directoryPath, fileName: existingFileItem.name });

      if (!existingFileItem.isDirectory()) {
        // A symlink or a Windows junction to a folder: `Dirent.isDirectory()` is false for it, so it is followed here.
        // A link back to one of its own ancestors would recurse forever, so it is compared by real path and skipped.
        const childRealPath = await fileSystemAdapter.fsPromises.realpath(absoluteChildPath);
        if (nextAncestorRealPaths.has(childRealPath)) {
          this.consoleDebugComponent.consoleDebug(`Skipping ${path}: it links back to one of its own parent folders`);
          continue;
        }

        if (!(this.app.vault.getAbstractFileByPath(path) instanceof TFolder)) {
          this.consoleDebugComponent.consoleDebug(`Skipping ${path}: Obsidian does not show the linked folder`);
          continue;
        }
      }

      await this.reloadFolderImpl({ ancestorRealPaths: nextAncestorRealPaths, directoryPath: path, isRecursive: true, summary });
    }
  }
}

function combinePath(params: CombinePathParams): string {
  const { directoryPath, fileName } = params;
  const isRoot = directoryPath === ROOT_PATH;
  return isRoot ? fileName : `${directoryPath}/${fileName}`;
}

function formatCount(count: number, singular: string, plural: string): string {
  return `${String(count)} ${count === 1 ? singular : plural}`;
}

function formatReloadSummary(params: FormatReloadSummaryParams): string {
  const { directoryPath, summary } = params;
  const target = directoryPath === ROOT_PATH ? 'The file explorer' : `Folder "${directoryPath}"`;
  const parts: string[] = [];
  if (summary.added > 0) {
    parts.push(`${formatCount(summary.added, 'item', 'items')} added`);
  }
  if (summary.removed > 0) {
    parts.push(`${formatCount(summary.removed, 'item', 'items')} removed`);
  }
  if (summary.modified > 0) {
    parts.push(`${formatCount(summary.modified, 'changed file', 'changed files')} re-read`);
  }

  return parts.length === 0
    ? `${target} is already up to date.`
    : `${target} reloaded: ${parts.join(', ')}.`;
}

async function isDirectoryEntry(params: IsDirectoryEntryParams): Promise<boolean> {
  const { absolutePath, entry, fileSystemAdapter } = params;
  if (entry.isDirectory()) {
    return true;
  }

  if (!entry.isSymbolicLink()) {
    return false;
  }

  try {
    const stat = await fileSystemAdapter.fsPromises.stat(absolutePath);
    return stat.isDirectory();
  } catch {
    // A dangling link has no target to reload.
    return false;
  }
}
