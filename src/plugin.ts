import { OpenBugReportCommandHandler } from '@mnaoumov/obsidian-lib/command-handlers/open-bug-report-command-handler';
import { OpenDemoVaultCommandHandler } from '@mnaoumov/obsidian-lib/command-handlers/open-demo-vault-command-handler';
import { PluginBase } from '@mnaoumov/obsidian-lib/plugin/plugin';

import { ReloadFileExplorerCommandHandler } from './command-handlers/reload-file-explorer-command-handler.ts';
import { ReloadFolderCommandHandler } from './command-handlers/reload-folder-command-handler.ts';
import { ReloadFolderWithSubfoldersCommandHandler } from './command-handlers/reload-folder-with-subfolders-command-handler.ts';
import { FileExplorerReloader } from './file-explorer-reloader.ts';

export class Plugin extends PluginBase {
  protected override async onloadImpl(): Promise<void> {
    const fileExplorerReloader = new FileExplorerReloader({
      app: this.app,
      consoleDebugComponent: this.consoleDebugComponent
    });

    await this.commandHandlerComponent.registerCommandHandlers(() => [
      new ReloadFileExplorerCommandHandler({
        fileExplorerReloader
      }),
      new ReloadFolderCommandHandler({
        fileExplorerReloader
      }),
      new ReloadFolderWithSubfoldersCommandHandler({
        fileExplorerReloader
      }),
      new OpenBugReportCommandHandler({
        app: this.app,
        gitHubRepo: 'mnaoumov/obsidian-file-explorer-reload',
        pluginId: this.manifest.id
      }),
      new OpenDemoVaultCommandHandler({
        app: this.app,
        pluginId: this.manifest.id,
        pluginNoticeComponent: this.pluginNoticeComponent,
        pluginVersion: this.manifest.version
      })
    ]);
  }
}
