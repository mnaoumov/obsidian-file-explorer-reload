import { GlobalCommandHandler } from 'obsidian-dev-utils/obsidian/command-handlers/global-command-handler';

import type { FileExplorerReloader } from '../file-explorer-reloader.ts';

interface ReloadFileExplorerCommandHandlerConstructorParams {
  readonly fileExplorerReloader: FileExplorerReloader;
}

export class ReloadFileExplorerCommandHandler extends GlobalCommandHandler {
  private readonly fileExplorerReloader: FileExplorerReloader;

  public constructor(params: ReloadFileExplorerCommandHandlerConstructorParams) {
    super({
      icon: 'refresh-ccw',
      id: 'reload-file-explorer',
      name: 'Reload file explorer'
    });
    this.fileExplorerReloader = params.fileExplorerReloader;
  }

  protected override async execute(): Promise<void> {
    await this.fileExplorerReloader.reloadFileExplorer();
  }
}
