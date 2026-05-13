import type {
  TFolder,
  WorkspaceLeaf
} from 'obsidian';

import { FolderCommandHandler } from 'obsidian-dev-utils/obsidian/command-handlers/folder-command-handler';

import type { FileExplorerReloader } from '../file-explorer-reloader.ts';

export interface ReloadFolderCommandHandlerParams {
  readonly fileExplorerReloader: FileExplorerReloader;
}

export class ReloadFolderCommandHandler extends FolderCommandHandler {
  private readonly fileExplorerReloader: FileExplorerReloader;

  public constructor(params: ReloadFolderCommandHandlerParams) {
    super({
      fileMenuSubmenuIcon: 'folder-sync',
      icon: 'folder-sync',
      id: 'reload-folder',
      name: 'Reload folder',
      shouldAddCommandToSubmenu: true
    });
    this.fileExplorerReloader = params.fileExplorerReloader;
  }

  protected override async executeFolder(folder: TFolder): Promise<void> {
    await this.fileExplorerReloader.reloadFolder(folder.path, false);
  }

  protected override shouldAddToFolderMenu(folder: TFolder, source: string, leaf?: WorkspaceLeaf): boolean {
    super.shouldAddToFolderMenu(folder, source, leaf);
    return true;
  }

  protected override shouldAddToFoldersMenu(folders: TFolder[], source: string, leaf?: WorkspaceLeaf): boolean {
    super.shouldAddToFoldersMenu(folders, source, leaf);
    return true;
  }
}
