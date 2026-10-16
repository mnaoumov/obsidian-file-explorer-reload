import type {
  FolderCommandHandlerShouldAddToFolderMenuParams,
  FolderCommandHandlerShouldAddToFoldersMenuParams
} from '@mnaoumov/obsidian-lib/command-handlers/folder-command-handler';
import type { TFolder } from 'obsidian';

import { FolderCommandHandler } from '@mnaoumov/obsidian-lib/command-handlers/folder-command-handler';

import type { FileExplorerReloader } from '../file-explorer-reloader.ts';

interface ReloadFolderWithSubfoldersCommandHandlerConstructorParams {
  readonly fileExplorerReloader: FileExplorerReloader;
}

export class ReloadFolderWithSubfoldersCommandHandler extends FolderCommandHandler {
  private readonly fileExplorerReloader: FileExplorerReloader;

  public constructor(params: ReloadFolderWithSubfoldersCommandHandlerConstructorParams) {
    super({
      fileMenuSubmenuIcon: 'folder-sync',
      icon: 'folder-sync',
      id: 'reload-folder-with-subfolders',
      name: 'Reload folder with subfolders',
      shouldAddCommandToSubmenu: true
    });
    this.fileExplorerReloader = params.fileExplorerReloader;
  }

  protected override async executeFolder(folder: TFolder): Promise<void> {
    await this.fileExplorerReloader.reloadFolder({ directoryPath: folder.path, isRecursive: true });
  }

  // eslint-disable-next-line typescript-dev-toolkit/params-options-name-match -- Overrides the base method, so it must keep the base parameter type.
  protected override shouldAddToFolderMenu(params: FolderCommandHandlerShouldAddToFolderMenuParams): boolean {
    super.shouldAddToFolderMenu(params);
    return true;
  }

  // eslint-disable-next-line typescript-dev-toolkit/params-options-name-match -- Overrides the base method, so it must keep the base parameter type.
  protected override shouldAddToFoldersMenu(params: FolderCommandHandlerShouldAddToFoldersMenuParams): boolean {
    super.shouldAddToFoldersMenu(params);
    return true;
  }
}
