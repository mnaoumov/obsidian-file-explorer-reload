/**
 * @file
 *
 * Command handler for reloading a single folder.
 */

import type { TFolder } from 'obsidian';
import type { CommandHandlerParams } from 'obsidian-dev-utils/obsidian/command-handlers/command-handler';

import { FolderCommandHandler } from 'obsidian-dev-utils/obsidian/command-handlers/folder-command-handler';

/**
 * Parameters for creating a {@link ReloadFolderCommandHandler}.
 */
export interface ReloadFolderCommandHandlerParams extends Pick<CommandHandlerParams, 'pluginName'> {
  /**
   * Callback to reload a folder.
   */
  readonly reloadFolder: (path: string, isRecursive: boolean) => Promise<void>;
}

/**
 * Handles the "Reload folder" command.
 */
export class ReloadFolderCommandHandler extends FolderCommandHandler {
  private readonly reloadFolder: (path: string, isRecursive: boolean) => Promise<void>;

  /**
   * Creates a new ReloadFolderCommandHandler.
   *
   * @param params - The parameters for the handler.
   */
  public constructor(params: ReloadFolderCommandHandlerParams) {
    super({
      fileMenuSubmenuIcon: 'folder-sync',
      icon: 'folder-sync',
      id: 'reload-folder',
      name: 'Reload folder',
      pluginName: params.pluginName,
      shouldAddCommandToSubmenu: true
    });
    this.reloadFolder = params.reloadFolder;
  }

  /**
   * Executes the command for a single folder.
   *
   * @param folder - The folder to reload.
   */
  protected override async executeFolder(folder: TFolder): Promise<void> {
    await this.reloadFolder(folder.path, false);
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
