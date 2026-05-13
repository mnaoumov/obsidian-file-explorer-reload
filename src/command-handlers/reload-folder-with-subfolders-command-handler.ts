import type {
  TFolder,
  WorkspaceLeaf
} from 'obsidian';

import { FolderCommandHandler } from 'obsidian-dev-utils/obsidian/command-handlers/folder-command-handler';

export interface ReloadFolderWithSubfoldersCommandHandlerParams {
  readonly reloadFolder: (path: string, isRecursive: boolean) => Promise<void>;
}

export class ReloadFolderWithSubfoldersCommandHandler extends FolderCommandHandler {
  private readonly reloadFolder: (path: string, isRecursive: boolean) => Promise<void>;

  public constructor(params: ReloadFolderWithSubfoldersCommandHandlerParams) {
    super({
      fileMenuSubmenuIcon: 'folder-sync',
      icon: 'folder-sync',
      id: 'reload-folder-with-subfolders',
      name: 'Reload folder with subfolders',
      shouldAddCommandToSubmenu: true
    });
    this.reloadFolder = params.reloadFolder;
  }

  protected override async executeFolder(folder: TFolder): Promise<void> {
    await this.reloadFolder(folder.path, true);
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
