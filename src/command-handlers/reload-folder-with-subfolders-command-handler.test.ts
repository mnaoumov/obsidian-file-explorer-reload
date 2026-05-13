import {
  beforeEach,
  describe,
  expect,
  it,
  vi
} from 'vitest';

interface MockCommandHandlerParams {
  icon: string;
  id: string;
  name: string;
  pluginName: string;
}

vi.mock('obsidian-dev-utils/obsidian/command-handlers/folder-command-handler', () => ({
  FolderCommandHandler: class {
    public icon: string;
    public id: string;
    public name: string;
    protected pluginName: string;
    public constructor(params: MockCommandHandlerParams) {
      this.icon = params.icon;
      this.id = params.id;
      this.name = params.name;
      this.pluginName = params.pluginName;
    }
  }
}));

// eslint-disable-next-line import-x/first, import-x/imports-first -- vi.mock must precede imports.
import { ReloadFolderWithSubfoldersCommandHandler } from './reload-folder-with-subfolders-command-handler.ts';

interface MockTFolder {
  path: string;
}

interface ReloadFolderWithSubfoldersCommandHandlerTestAccessor {
  executeFolder: (folder: MockTFolder) => Promise<void>;
  icon: string;
  id: string;
  name: string;
  shouldAddToFolderMenu: () => boolean;
  shouldAddToFoldersMenu: () => boolean;
}

function asTestAccessor(handler: ReloadFolderWithSubfoldersCommandHandler): ReloadFolderWithSubfoldersCommandHandlerTestAccessor {
  // eslint-disable-next-line no-restricted-syntax -- Accessing private/protected members for testing needs double assertion.
  return handler as unknown as ReloadFolderWithSubfoldersCommandHandlerTestAccessor;
}

describe('ReloadFolderWithSubfoldersCommandHandler', () => {
  let handler: ReloadFolderWithSubfoldersCommandHandler;
  let mockReloadFolder: ReturnType<typeof vi.fn<(path: string, isRecursive: boolean) => Promise<void>>>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockReloadFolder = vi.fn<(path: string, isRecursive: boolean) => Promise<void>>().mockResolvedValue(undefined);
    handler = new ReloadFolderWithSubfoldersCommandHandler({
      pluginName: 'file-explorer-reload',
      reloadFolder: mockReloadFolder
    });
  });

  it('should set correct command properties', () => {
    const accessor = asTestAccessor(handler);
    expect(accessor.icon).toBe('folder-sync');
    expect(accessor.id).toBe('reload-folder-with-subfolders');
    expect(accessor.name).toBe('Reload folder with subfolders');
  });

  it('should call reloadFolder with isRecursive true on executeFolder', async () => {
    const folder: MockTFolder = { path: 'test-folder' };

    await asTestAccessor(handler).executeFolder(folder);

    expect(mockReloadFolder).toHaveBeenCalledWith('test-folder', true);
  });

  it('should add to folder menu', () => {
    expect(asTestAccessor(handler).shouldAddToFolderMenu()).toBe(true);
  });

  it('should add to folders menu', () => {
    expect(asTestAccessor(handler).shouldAddToFoldersMenu()).toBe(true);
  });
});
