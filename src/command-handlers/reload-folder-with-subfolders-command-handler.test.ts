import type { TFolder } from 'obsidian';

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

import { ReloadFolderWithSubfoldersCommandHandler } from './reload-folder-with-subfolders-command-handler.ts';

interface ReloadFolderWithSubfoldersCommandHandlerTestAccessor {
  executeFolder(folder: TFolder): Promise<void>;
  shouldAddToFolderMenu(folder: TFolder, source: string): boolean;
  shouldAddToFoldersMenu(folders: TFolder[], source: string): boolean;
}

function asTestAccessor(handler: ReloadFolderWithSubfoldersCommandHandler): ReloadFolderWithSubfoldersCommandHandlerTestAccessor {
  return castTo<ReloadFolderWithSubfoldersCommandHandlerTestAccessor>(handler);
}

describe('ReloadFolderWithSubfoldersCommandHandler', () => {
  let handler: ReloadFolderWithSubfoldersCommandHandler;
  let mockReloadFolder: ReturnType<typeof vi.fn<(path: string, isRecursive: boolean) => Promise<void>>>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockReloadFolder = vi.fn<(path: string, isRecursive: boolean) => Promise<void>>().mockResolvedValue(undefined);
    handler = new ReloadFolderWithSubfoldersCommandHandler({
      fileExplorerReloader: strictProxy<FileExplorerReloader>({
        reloadFolder: mockReloadFolder
      })
    });
  });

  it('should set correct command properties', () => {
    expect(handler.icon).toBe('folder-sync');
    expect(handler.id).toBe('reload-folder-with-subfolders');
    expect(handler.name).toBe('Reload folder with subfolders');
  });

  it('should call reloadFolder with isRecursive true on executeFolder', async () => {
    const folder = strictProxy<TFolder>({ path: 'test-folder' });

    await asTestAccessor(handler).executeFolder(folder);

    expect(mockReloadFolder).toHaveBeenCalledWith('test-folder', true);
  });

  it('should add to folder menu', () => {
    const folder = strictProxy<TFolder>({ path: 'test-folder' });
    expect(asTestAccessor(handler).shouldAddToFolderMenu(folder, 'file-explorer-context-menu')).toBe(true);
  });

  it('should add to folders menu', () => {
    const folder = strictProxy<TFolder>({ path: 'test-folder' });
    expect(asTestAccessor(handler).shouldAddToFoldersMenu([folder], 'file-explorer-context-menu')).toBe(true);
  });
});
