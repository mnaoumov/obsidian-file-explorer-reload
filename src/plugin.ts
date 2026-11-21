import { OpenBugReportCommandHandler } from '@mnaoumov/obsidian-lib/command-handlers/open-bug-report-command-handler';
import { OpenDemoVaultCommandHandler } from '@mnaoumov/obsidian-lib/command-handlers/open-demo-vault-command-handler';
import { PluginSettingsTabComponent } from '@mnaoumov/obsidian-lib/components/plugin-settings-tab-component';
import { PluginDataHandler } from '@mnaoumov/obsidian-lib/data-handler';
import { PluginBase } from '@mnaoumov/obsidian-lib/plugin/plugin';

import {
  RELOAD_FILE_EXPLORER_COMMAND_ID,
  ReloadFileExplorerCommandHandler
} from './command-handlers/reload-file-explorer-command-handler.ts';
import { ReloadFolderCommandHandler } from './command-handlers/reload-folder-command-handler.ts';
import { ReloadFolderWithSubfoldersCommandHandler } from './command-handlers/reload-folder-with-subfolders-command-handler.ts';
import { FileExplorerReloadButtonComponent } from './file-explorer-reload-button-component.ts';
import { FileExplorerReloader } from './file-explorer-reloader.ts';
import { PluginSettingsComponent } from './plugin-settings-component.ts';
import { PluginSettingsTab } from './plugin-settings-tab.ts';
import { PluginSettings } from './plugin-settings.ts';

export class Plugin extends PluginBase {
  protected override async onloadImpl(): Promise<void> {
    const pluginSettingsComponent = this.addChild(
      new PluginSettingsComponent({
        dataHandler: new PluginDataHandler(this),
        pluginEventSource: this,
        pluginSettingsClass: PluginSettings
      })
    );
    this.pluginSettingsComponent = pluginSettingsComponent;
    this.addChild(
      new PluginSettingsTabComponent({
        plugin: this,
        pluginSettingsTab: new PluginSettingsTab({
          plugin: this,
          pluginSettingsComponent
        })
      })
    );
    const fileExplorerReloader = new FileExplorerReloader({
      app: this.app,
      consoleDebugComponent: this.consoleDebugComponent,
      pluginNoticeComponent: this.pluginNoticeComponent
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

    // Idea from Symlink Refresh Button, built clean-room from its README alone: that project has no license.
    this.addChild(
      new FileExplorerReloadButtonComponent({
        app: this.app,
        onClick: (): void => {
          this.app.commands.executeCommandById(`${this.manifest.id}:${RELOAD_FILE_EXPLORER_COMMAND_ID}`);
        },
        pluginSettingsComponent
      })
    );
  }
}
