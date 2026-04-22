/**
 * @file
 *
 * Command handler for reloading a folder with all its subfolders.
 */

import type { TFolder } from 'obsidian';
import type { CommandHandlerParams } from 'obsidian-dev-utils/obsidian/command-handlers/command-handler';

import { FolderCommandHandler } from 'obsidian-dev-utils/obsidian/command-handlers/folder-command-handler';

/**
 * Parameters for creating a {@link ReloadFolderWithSubfoldersCommandHandler}.
 */
export interface ReloadFolderWithSubfoldersCommandHandlerParams extends Pick<CommandHandlerParams, 'pluginName'> {
  /**
   * Callback to reload a folder.
   */
  readonly reloadFolder: (path: string, isRecursive: boolean) => Promise<void>;
}

/**
 * Handles the "Reload folder with subfolders" command.
 */
export class ReloadFolderWithSubfoldersCommandHandler extends FolderCommandHandler {
  private readonly reloadFolder: (path: string, isRecursive: boolean) => Promise<void>;

  /**
   * Creates a new ReloadFolderWithSubfoldersCommandHandler.
   *
   * @param params - The parameters for the handler.
   */
  public constructor(params: ReloadFolderWithSubfoldersCommandHandlerParams) {
    super({
      fileMenuSubmenuIcon: 'folder-sync',
      icon: 'folder-sync',
      id: 'reload-folder-with-subfolders',
      name: 'Reload folder with subfolders',
      pluginName: params.pluginName,
      shouldAddCommandToSubmenu: true
    });
    this.reloadFolder = params.reloadFolder;
  }

  /**
   * Executes the command for a single folder recursively.
   *
   * @param folder - The folder to reload with subfolders.
   */
  protected override async executeFolder(folder: TFolder): Promise<void> {
    await this.reloadFolder(folder.path, true);
  }

  /**
   * Whether to add the command to the single-folder context menu.
   *
   * @returns Always `true`.
   */
  protected override shouldAddToFolderMenu(): boolean {
    return true;
  }

  /**
   * Whether to add the command to the multi-folder context menu.
   *
   * @returns Always `true`.
   */
  protected override shouldAddToFoldersMenu(): boolean {
    return true;
  }
}
