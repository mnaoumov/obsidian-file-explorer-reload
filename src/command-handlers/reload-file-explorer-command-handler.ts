/**
 * @file
 *
 * Command handler for reloading the entire file explorer.
 */

import type { CommandHandlerParams } from 'obsidian-dev-utils/obsidian/command-handlers/command-handler';

import { GlobalCommandHandler } from 'obsidian-dev-utils/obsidian/command-handlers/global-command-handler';

/**
 * Parameters for creating a {@link ReloadFileExplorerCommandHandler}.
 */
export interface ReloadFileExplorerCommandHandlerParams extends Pick<CommandHandlerParams, 'pluginName'> {
  /**
   * Callback to reload the file explorer.
   */
  readonly reloadFileExplorer: () => Promise<void>;
}

/**
 * Handles the "Reload file explorer" command.
 */
export class ReloadFileExplorerCommandHandler extends GlobalCommandHandler {
  private readonly reloadFileExplorer: () => Promise<void>;

  /**
   * Creates a new ReloadFileExplorerCommandHandler.
   *
   * @param params - The parameters for the handler.
   */
  public constructor(params: ReloadFileExplorerCommandHandlerParams) {
    super({ icon: 'refresh-ccw', id: 'reload-file-explorer', name: 'Reload file explorer', pluginName: params.pluginName });
    this.reloadFileExplorer = params.reloadFileExplorer;
  }

  /**
   * Executes the command by reloading the file explorer.
   */
  protected override async execute(): Promise<void> {
    await this.reloadFileExplorer();
  }
}
