import type { TFolder } from 'obsidian';
import type {
  FolderCommandHandlerShouldAddToFolderMenuParams,
  FolderCommandHandlerShouldAddToFoldersMenuParams
} from 'obsidian-dev-utils/obsidian/command-handlers/folder-command-handler';

import { FolderCommandHandler } from 'obsidian-dev-utils/obsidian/command-handlers/folder-command-handler';

import type { FileExplorerReloader } from '../file-explorer-reloader.ts';

interface ReloadFolderCommandHandlerConstructorParams {
  readonly fileExplorerReloader: FileExplorerReloader;
}

export class ReloadFolderCommandHandler extends FolderCommandHandler {
  private readonly fileExplorerReloader: FileExplorerReloader;

  public constructor(params: ReloadFolderCommandHandlerConstructorParams) {
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
    await this.fileExplorerReloader.reloadFolder({ directoryPath: folder.path, isRecursive: false });
  }

  // eslint-disable-next-line obsidian-dev-utils/params-options-name-match -- Overrides the base method, so it must keep the base parameter type.
  protected override shouldAddToFolderMenu(params: FolderCommandHandlerShouldAddToFolderMenuParams): boolean {
    super.shouldAddToFolderMenu(params);
    return true;
  }

  // eslint-disable-next-line obsidian-dev-utils/params-options-name-match -- Overrides the base method, so it must keep the base parameter type.
  protected override shouldAddToFoldersMenu(params: FolderCommandHandlerShouldAddToFoldersMenuParams): boolean {
    super.shouldAddToFoldersMenu(params);
    return true;
  }
}
