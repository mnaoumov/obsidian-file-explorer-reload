import { strictProxy } from 'obsidian-dev-utils/strict-proxy';
import {
  beforeEach,
  describe,
  expect,
  it,
  vi
} from 'vitest';

import type { FileExplorerReloader } from '../file-explorer-reloader.ts';

interface MockCommandHandlerParams {
  readonly fileMenuSubmenuIcon: string;
  readonly icon: string;
  readonly id: string;
  readonly name: string;
  readonly shouldAddCommandToSubmenu: boolean;
}

vi.mock('obsidian-dev-utils/obsidian/command-handlers/folder-command-handler', () => ({
  FolderCommandHandler: class {
    public fileMenuSubmenuIcon: string;
    public icon: string;
    public id: string;
    public name: string;
    public shouldAddCommandToSubmenu: boolean;
    public constructor(params: MockCommandHandlerParams) {
      this.fileMenuSubmenuIcon = params.fileMenuSubmenuIcon;
      this.icon = params.icon;
      this.id = params.id;
      this.name = params.name;
      this.shouldAddCommandToSubmenu = params.shouldAddCommandToSubmenu;
    }

    protected shouldAddToFolderMenu(): boolean {
      return false;
    }

    protected shouldAddToFoldersMenu(): boolean {
      return false;
    }
  }
}));

// eslint-disable-next-line import-x/first, import-x/imports-first -- vi.mock must precede imports.
import { ReloadFolderCommandHandler } from './reload-folder-command-handler.ts';

interface MockTFolder {
  path: string;
}

interface ReloadFolderCommandHandlerTestAccessor {
  executeFolder(folder: MockTFolder): Promise<void>;
  icon: string;
  id: string;
  name: string;
  shouldAddToFolderMenu(): boolean;
  shouldAddToFoldersMenu(): boolean;
}

function asTestAccessor(handler: ReloadFolderCommandHandler): ReloadFolderCommandHandlerTestAccessor {
  // eslint-disable-next-line no-restricted-syntax -- Accessing private/protected members for testing needs double assertion.
  return handler as unknown as ReloadFolderCommandHandlerTestAccessor;
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
    const accessor = asTestAccessor(handler);
    expect(accessor.icon).toBe('folder-sync');
    expect(accessor.id).toBe('reload-folder');
    expect(accessor.name).toBe('Reload folder');
  });

  it('should call reloadFolder with isRecursive false on executeFolder', async () => {
    const folder: MockTFolder = { path: 'test-folder' };

    await asTestAccessor(handler).executeFolder(folder);

    expect(mockReloadFolder).toHaveBeenCalledWith('test-folder', false);
  });

  it('should add to folder menu', () => {
    expect(asTestAccessor(handler).shouldAddToFolderMenu()).toBe(true);
  });

  it('should add to folders menu', () => {
    expect(asTestAccessor(handler).shouldAddToFoldersMenu()).toBe(true);
  });
});
