import { CommandInvocationBase } from 'obsidian-dev-utils/obsidian/commands/command-base';
import { NonEditorCommandBase } from 'obsidian-dev-utils/obsidian/commands/non-editor-command-base';

import type { Plugin } from '../Plugin.ts';

class ReloadFileExplorerCommandInvocation extends CommandInvocationBase<Plugin> {
  public constructor(plugin: Plugin) {
    super(plugin);
  }

  public override async execute(): Promise<void> {
    await this.plugin.reloadFileExplorer();
  }
}

export class ReloadFileExplorerCommand extends NonEditorCommandBase<Plugin> {
  public constructor(plugin: Plugin) {
    super({
      icon: 'refresh-ccw',
      id: 'reload-file-explorer',
      name: 'Reload file explorer',
      plugin
    });
  }

  protected override createCommandInvocation(): CommandInvocationBase<Plugin> {
    return new ReloadFileExplorerCommandInvocation(this.plugin);
  }
}
