import { PluginBase } from 'obsidian-dev-utils/obsidian/plugin/plugin';

import { ReloadFileExplorerCommandHandler } from './command-handlers/reload-file-explorer-command-handler.ts';
import { ReloadFolderCommandHandler } from './command-handlers/reload-folder-command-handler.ts';
import { ReloadFolderWithSubfoldersCommandHandler } from './command-handlers/reload-folder-with-subfolders-command-handler.ts';
import { FileExplorerReloader } from './file-explorer-reloader.ts';

export class Plugin extends PluginBase {
  protected override onloadImpl(): void {
    const fileExplorerReloader = new FileExplorerReloader({
      app: this.app,
      consoleDebugComponent: this.consoleDebugComponent
    });

    this.commandHandlerComponent.registerCommandHandlers([
      new ReloadFileExplorerCommandHandler({
        fileExplorerReloader
      }),
      new ReloadFolderCommandHandler({
        fileExplorerReloader
      }),
      new ReloadFolderWithSubfoldersCommandHandler({
        fileExplorerReloader
      })
    ]);
  }
}
