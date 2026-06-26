import type { TFolder } from 'obsidian';
import type {
  FolderCommandHandlerShouldAddToFolderMenuParams,
  FolderCommandHandlerShouldAddToFoldersMenuParams
} from 'obsidian-dev-utils/obsidian/command-handlers/folder-command-handler';

import { castTo } from 'obsidian-dev-utils/object-utils';
import { strictProxy } from 'obsidian-dev-utils/strict-proxy';
import {
  beforeEach,
  describe,
  expect,
  it,
  vi
} from 'vitest';

import type { FileExplorerReloader } from '../file-explorer-reloader.ts';

import { ReloadFolderCommandHandler } from './reload-folder-command-handler.ts';

interface ReloadFolderCommandHandlerTestAccessor {
  executeFolder(folder: TFolder): Promise<void>;
  shouldAddToFolderMenu(params: FolderCommandHandlerShouldAddToFolderMenuParams): boolean;
  shouldAddToFoldersMenu(params: FolderCommandHandlerShouldAddToFoldersMenuParams): boolean;
}

function asTestAccessor(handler: ReloadFolderCommandHandler): ReloadFolderCommandHandlerTestAccessor {
  return castTo<ReloadFolderCommandHandlerTestAccessor>(handler);
}

describe('ReloadFolderCommandHandler', () => {
  let handler: ReloadFolderCommandHandler;
  let mockReloadFolder: ReturnType<typeof vi.fn<(path: string, isRecursive: boolean) => Promise<void>>>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockReloadFolder = vi.fn<(path: string, isRecursive: boolean) => Promise<void>>().mockResolvedValue(undefined);
    handler = new ReloadFolderCommandHandler({
      fileExplorerReloader: strictProxy<FileExplorerReloader>({
        reloadFolder: mockReloadFolder
      })
    });
  });

  it('should set correct command properties', () => {
    const command = handler.buildCommand();
    expect(command.icon).toBe('folder-sync');
    expect(command.id).toBe('reload-folder');
    expect(command.name).toBe('Reload folder');
  });

  it('should call reloadFolder with isRecursive false on executeFolder', async () => {
    const folder = strictProxy<TFolder>({ path: 'test-folder' });

    await asTestAccessor(handler).executeFolder(folder);

    expect(mockReloadFolder).toHaveBeenCalledWith('test-folder', false);
  });

  it('should add to folder menu', () => {
    const folder = strictProxy<TFolder>({ path: 'test-folder' });
    expect(asTestAccessor(handler).shouldAddToFolderMenu({ folder, source: 'file-explorer-context-menu' })).toBe(true);
  });

  it('should add to folders menu', () => {
    const folder = strictProxy<TFolder>({ path: 'test-folder' });
    expect(asTestAccessor(handler).shouldAddToFoldersMenu({ folders: [folder], source: 'file-explorer-context-menu' })).toBe(true);
  });
});
