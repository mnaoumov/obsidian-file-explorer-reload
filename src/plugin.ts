import type {
  App,
  PluginManifest
} from 'obsidian';

import { AppActiveFileProvider } from 'obsidian-dev-utils/obsidian/active-file-provider';
import { CommandHandlerComponent } from 'obsidian-dev-utils/obsidian/command-handlers/command-handler-component';
import { PluginCommandRegistrar } from 'obsidian-dev-utils/obsidian/command-registrar';
import { AppMenuEventRegistrar } from 'obsidian-dev-utils/obsidian/menu-event-registrar';
import { PluginBase } from 'obsidian-dev-utils/obsidian/plugin/plugin';

import { ReloadFileExplorerCommandHandler } from './command-handlers/reload-file-explorer-command-handler.ts';
import { ReloadFolderCommandHandler } from './command-handlers/reload-folder-command-handler.ts';
import { ReloadFolderWithSubfoldersCommandHandler } from './command-handlers/reload-folder-with-subfolders-command-handler.ts';
import { FileExplorerReloader } from './file-explorer-reloader.ts';

export class Plugin extends PluginBase {
  public constructor(app: App, manifest: PluginManifest) {
    super(app, manifest);

    const fileExplorerReloader = new FileExplorerReloader({
      app,
      consoleDebugComponent: this.consoleDebugComponent
    });

    this.addChild(
      new CommandHandlerComponent({
        activeFileProvider: new AppActiveFileProvider(app),
        commandHandlers: [
          new ReloadFileExplorerCommandHandler({
            fileExplorerReloader
          }),
          new ReloadFolderCommandHandler({
            fileExplorerReloader
          }),
          new ReloadFolderWithSubfoldersCommandHandler({
            fileExplorerReloader
          })
        ],
        commandRegistrar: new PluginCommandRegistrar(this),
        menuEventRegistrar: new AppMenuEventRegistrar(app, this),
        pluginName: manifest.name
      })
    );
  }
}
