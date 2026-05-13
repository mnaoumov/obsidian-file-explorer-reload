import type {
  TFolder,
  WorkspaceLeaf
} from 'obsidian';

import { FolderCommandHandler } from 'obsidian-dev-utils/obsidian/command-handlers/folder-command-handler';

export interface ReloadFolderCommandHandlerParams {
  readonly reloadFolder: (path: string, isRecursive: boolean) => Promise<void>;
}

export class ReloadFolderCommandHandler extends FolderCommandHandler {
  private readonly reloadFolder: (path: string, isRecursive: boolean) => Promise<void>;

  public constructor(params: ReloadFolderCommandHandlerParams) {
    super({
      fileMenuSubmenuIcon: 'folder-sync',
      icon: 'folder-sync',
      id: 'reload-folder',
      name: 'Reload folder',
      shouldAddCommandToSubmenu: true
    });
    this.reloadFolder = params.reloadFolder;
  }

  protected override async executeFolder(folder: TFolder): Promise<void> {
    await this.reloadFolder(folder.path, false);
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
