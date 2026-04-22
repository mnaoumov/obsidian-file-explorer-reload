/**
 * @file
 *
 * Tests for plugin.ts.
 */

import type { RegisterComponentParams } from 'obsidian-dev-utils/obsidian/plugin/plugin';

import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi
} from 'vitest';

interface MockAdapter {
  basePath: string;
  reconcileFile: ReturnType<typeof vi.fn>;
  reconcileFolderCreation: ReturnType<typeof vi.fn>;
}

interface MockApp {
  vault: MockVault;
}

interface MockChild {
  name: string;
}

interface MockConsoleDebugComponent {
  debug: ReturnType<typeof vi.fn>;
}

interface MockDirent {
  isDirectory: () => boolean;
  name: string;
}

interface MockFileSystemAdapter {
  fsPromises: MockFsPromises;
}

interface MockFsPromises {
  readdir: ReturnType<typeof vi.fn>;
}

interface MockTFolder {
  children: MockChild[];
}

interface MockVault {
  adapter: MockFileSystemAdapter;
  getAbstractFileByPath: ReturnType<typeof vi.fn>;
}

const PluginBaseMock = vi.hoisted(() =>
  class {
    public app: unknown;
    public consoleDebugComponent: MockConsoleDebugComponent = { debug: vi.fn() };
    public manifest: unknown;
    private readonly registeredComponents: RegisterComponentParams[] = [];

    public constructor(app: unknown, manifest: unknown) {
      this.app = app;
      this.manifest = manifest;
    }

    public registerComponent(params: RegisterComponentParams): unknown {
      this.registeredComponents.push(params);
      return params.component;
    }
  }
);

const MockCommandHandlerComponent = vi.hoisted(() => vi.fn());

const MockTFolder = vi.hoisted(() =>
  class {
    public children: MockChild[] = [];
  }
);

vi.mock('obsidian-dev-utils/obsidian/plugin/plugin', () => ({
  PluginBase: PluginBaseMock
}));

vi.mock('obsidian', () => ({
  FileSystemAdapter: vi.fn(),
  TFolder: MockTFolder
}));

vi.mock('obsidian-typings/implementations', () => ({
  getDataAdapterEx: vi.fn()
}));

vi.mock('obsidian-dev-utils/obsidian/command-handlers/command-handler-component', () => ({
  CommandHandlerComponent: MockCommandHandlerComponent
}));

vi.mock('obsidian-dev-utils/obsidian/command-handlers/global-command-handler', () => ({
  GlobalCommandHandler: vi.fn()
}));

vi.mock('obsidian-dev-utils/obsidian/command-handlers/folder-command-handler', () => ({
  FolderCommandHandler: vi.fn()
}));

// eslint-disable-next-line import-x/first, import-x/imports-first -- vi.mock must precede imports.
import { getDataAdapterEx } from 'obsidian-typings/implementations';

// eslint-disable-next-line import-x/first, import-x/imports-first -- vi.mock must precede imports.
import { Plugin } from './plugin.ts';

function createMockAdapter(): MockAdapter {
  return {
    basePath: '/vault',
    reconcileFile: vi.fn().mockResolvedValue(undefined),
    reconcileFolderCreation: vi.fn().mockResolvedValue(undefined)
  };
}

function createMockApp(): MockApp {
  return {
    vault: {
      adapter: {
        fsPromises: {
          readdir: vi.fn().mockResolvedValue([])
        }
      },
      getAbstractFileByPath: vi.fn()
    }
  };
}

describe('Plugin', () => {
  let plugin: Plugin;
  let mockApp: MockApp;
  let mockAdapter: MockAdapter;

  beforeEach(() => {
    vi.clearAllMocks();
    mockApp = createMockApp();
    mockAdapter = createMockAdapter();
    vi.mocked(getDataAdapterEx).mockReturnValue(mockAdapter as never);
    plugin = new Plugin(mockApp as never, { id: 'file-explorer-reload', name: 'File Explorer Reload' } as never);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should extend PluginBase', () => {
    expect(plugin).toBeInstanceOf(PluginBaseMock);
  });

  it('should register three CommandHandlerComponents in constructor', () => {
    const EXPECTED_COMMAND_COUNT = 3;
    expect(MockCommandHandlerComponent).toHaveBeenCalledTimes(EXPECTED_COMMAND_COUNT);
  });

  describe('reloadFileExplorer', () => {
    it('should reload the root folder recursively', async () => {
      const folder = new MockTFolder();
      mockApp.vault.getAbstractFileByPath.mockReturnValue(folder);
      mockApp.vault.adapter.fsPromises.readdir.mockResolvedValue([]);

      await plugin.reloadFileExplorer();

      expect(mockApp.vault.getAbstractFileByPath).toHaveBeenCalledWith('/');
      expect(mockAdapter.reconcileFolderCreation).toHaveBeenCalledWith('/', '/');
    });
  });

  describe('reloadFolder', () => {
    it('should throw when path is not a folder', async () => {
      mockApp.vault.getAbstractFileByPath.mockReturnValue(null);

      await expect(plugin.reloadFolder('some/path', false)).rejects.toThrow('some/path is not a folder');
    });

    it('should reconcile new files that exist on disk but not in Obsidian', async () => {
      const folder = new MockTFolder();
      folder.children = [];
      mockApp.vault.getAbstractFileByPath.mockReturnValue(folder);
      mockApp.vault.adapter.fsPromises.readdir.mockResolvedValue([
        { isDirectory: (): boolean => false, name: 'new-file.md' }
      ]);

      await plugin.reloadFolder('test-folder', false);

      expect(mockAdapter.reconcileFile).toHaveBeenCalledWith('test-folder/new-file.md', 'test-folder/new-file.md', false);
    });

    it('should reconcile deleted files that exist in Obsidian but not on disk', async () => {
      const folder = new MockTFolder();
      folder.children = [{ name: 'deleted-file.md' }];
      mockApp.vault.getAbstractFileByPath.mockReturnValue(folder);
      mockApp.vault.adapter.fsPromises.readdir.mockResolvedValue([]);

      await plugin.reloadFolder('test-folder', false);

      expect(mockAdapter.reconcileFile).toHaveBeenCalledWith('', 'test-folder/deleted-file.md', false);
    });

    it('should not reconcile files that exist in both disk and Obsidian', async () => {
      const folder = new MockTFolder();
      folder.children = [{ name: 'existing.md' }];
      mockApp.vault.getAbstractFileByPath.mockReturnValue(folder);
      mockApp.vault.adapter.fsPromises.readdir.mockResolvedValue([
        { isDirectory: (): boolean => false, name: 'existing.md' }
      ]);

      await plugin.reloadFolder('test-folder', false);

      expect(mockAdapter.reconcileFile).not.toHaveBeenCalled();
    });

    it('should recurse into subdirectories when isRecursive is true', async () => {
      const parentFolder = new MockTFolder();
      parentFolder.children = [];
      const childFolder = new MockTFolder();
      childFolder.children = [];

      mockApp.vault.getAbstractFileByPath.mockImplementation((path: string) => {
        if (path === 'parent') {
          return parentFolder;
        }
        if (path === 'parent/child') {
          return childFolder;
        }
        return null;
      });

      const parentDirectoryEntries: MockDirent[] = [{ isDirectory: (): boolean => true, name: 'child' }];
      const childDirectoryEntries: MockDirent[] = [];

      mockApp.vault.adapter.fsPromises.readdir
        .mockResolvedValueOnce(parentDirectoryEntries)
        .mockResolvedValueOnce(childDirectoryEntries);

      await plugin.reloadFolder('parent', true);

      expect(mockAdapter.reconcileFolderCreation).toHaveBeenCalledWith('parent', 'parent');
      expect(mockAdapter.reconcileFolderCreation).toHaveBeenCalledWith('parent/child', 'parent/child');
    });

    it('should skip non-directory items during recursive traversal', async () => {
      const folder = new MockTFolder();
      folder.children = [];
      mockApp.vault.getAbstractFileByPath.mockReturnValue(folder);
      mockApp.vault.adapter.fsPromises.readdir.mockResolvedValue([
        { isDirectory: (): boolean => false, name: 'regular-file.md' },
        { isDirectory: (): boolean => false, name: 'another-file.txt' }
      ]);

      await plugin.reloadFolder('test-folder', true);

      expect(mockAdapter.reconcileFolderCreation).toHaveBeenCalledTimes(1);
      expect(mockAdapter.reconcileFolderCreation).toHaveBeenCalledWith('test-folder', 'test-folder');
    });

    it('should not recurse into subdirectories when isRecursive is false', async () => {
      const folder = new MockTFolder();
      folder.children = [];
      mockApp.vault.getAbstractFileByPath.mockReturnValue(folder);
      mockApp.vault.adapter.fsPromises.readdir.mockResolvedValue([
        { isDirectory: (): boolean => true, name: 'subfolder' }
      ]);

      await plugin.reloadFolder('test-folder', false);

      expect(mockAdapter.reconcileFolderCreation).toHaveBeenCalledTimes(1);
    });

    it('should filter out hidden files (starting with dot)', async () => {
      const folder = new MockTFolder();
      folder.children = [];
      mockApp.vault.getAbstractFileByPath.mockReturnValue(folder);
      mockApp.vault.adapter.fsPromises.readdir.mockResolvedValue([
        { isDirectory: (): boolean => false, name: '.hidden' },
        { isDirectory: (): boolean => false, name: 'visible.md' }
      ]);

      await plugin.reloadFolder('test-folder', false);

      expect(mockAdapter.reconcileFile).toHaveBeenCalledWith('test-folder/visible.md', 'test-folder/visible.md', false);
      expect(mockAdapter.reconcileFile).toHaveBeenCalledTimes(1);
    });

    it('should use basePath directly for root path', async () => {
      const folder = new MockTFolder();
      folder.children = [];
      mockApp.vault.getAbstractFileByPath.mockReturnValue(folder);
      mockApp.vault.adapter.fsPromises.readdir.mockResolvedValue([]);

      await plugin.reloadFolder('/', false);

      expect(mockApp.vault.adapter.fsPromises.readdir).toHaveBeenCalledWith('/vault', { withFileTypes: true });
    });

    it('should combine basePath and directoryPath for non-root path', async () => {
      const folder = new MockTFolder();
      folder.children = [];
      mockApp.vault.getAbstractFileByPath.mockReturnValue(folder);
      mockApp.vault.adapter.fsPromises.readdir.mockResolvedValue([]);

      await plugin.reloadFolder('some/folder', false);

      expect(mockApp.vault.adapter.fsPromises.readdir).toHaveBeenCalledWith('/vault/some/folder', { withFileTypes: true });
    });

    it('should use file name directly for root path when combining paths', async () => {
      const folder = new MockTFolder();
      folder.children = [];
      mockApp.vault.getAbstractFileByPath.mockReturnValue(folder);
      mockApp.vault.adapter.fsPromises.readdir.mockResolvedValue([
        { isDirectory: (): boolean => false, name: 'root-file.md' }
      ]);

      await plugin.reloadFolder('/', false);

      expect(mockAdapter.reconcileFile).toHaveBeenCalledWith('root-file.md', 'root-file.md', false);
    });
  });
});
