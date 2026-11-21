import { GlobalCommandHandler } from '@mnaoumov/obsidian-lib/command-handlers/global-command-handler';

import type { FileExplorerReloader } from '../file-explorer-reloader.ts';

export const RELOAD_FILE_EXPLORER_COMMAND_ID = 'reload-file-explorer';

interface ReloadFileExplorerCommandHandlerConstructorParams {
  readonly fileExplorerReloader: FileExplorerReloader;
}

export class ReloadFileExplorerCommandHandler extends GlobalCommandHandler {
  private readonly fileExplorerReloader: FileExplorerReloader;

  public constructor(params: ReloadFileExplorerCommandHandlerConstructorParams) {
    super({
      icon: 'refresh-ccw',
      id: RELOAD_FILE_EXPLORER_COMMAND_ID,
      name: 'Reload file explorer'
    });
    this.fileExplorerReloader = params.fileExplorerReloader;
  }

  protected override async execute(): Promise<void> {
    await this.fileExplorerReloader.reloadFileExplorer();
  }
}
