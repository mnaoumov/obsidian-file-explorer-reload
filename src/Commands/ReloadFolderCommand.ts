import type { TFolder } from 'obsidian';

import {
  FolderCommandBase,
  FolderCommandInvocationBase,
  FoldersCommandInvocationBase,
  SequentialFoldersCommandInvocationBase
} from 'obsidian-dev-utils/obsidian/Commands/FolderCommandBase';

import type { Plugin } from '../Plugin.ts';

class ReloadFolderCommandInvocation extends FolderCommandInvocationBase<Plugin> {
  public constructor(plugin: Plugin, folder: null | TFolder) {
    super(plugin, folder);
  }

  public override async execute(): Promise<void> {
    await this.plugin.reloadFolder(this.folder.path, false);
  }
}

export class ReloadFolderCommand extends FolderCommandBase<Plugin> {
  public constructor(plugin: Plugin) {
    super({
      fileMenuSubmenuIcon: 'folder-sync',
      icon: 'folder-sync',
      id: 'reload-folder',
      name: 'Reload folder',
      plugin,
      shouldAddCommandToSubmenu: true
    });
  }

  protected override createCommandInvocationForFolder(folder: null | TFolder): FolderCommandInvocationBase<Plugin> {
    return new ReloadFolderCommandInvocation(this.plugin, folder);
  }

  protected override createCommandInvocationForFolders(folders: TFolder[]): FoldersCommandInvocationBase<Plugin> {
    return new SequentialFoldersCommandInvocationBase(this.plugin, folders, (folder: TFolder) => new ReloadFolderCommandInvocation(this.plugin, folder));
  }

  protected override shouldAddToFolderMenu(): boolean {
    return true;
  }

  protected override shouldAddToFoldersMenu(): boolean {
    return true;
  }
}
