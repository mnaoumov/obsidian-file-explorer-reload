import type { DataAdapterEx } from '@obsidian-typings/obsidian-public-latest/implementations';
import type { App } from 'obsidian';
import type { ConsoleDebugComponent } from 'obsidian-dev-utils/obsidian/components/console-debug-component';

import { TFolder } from 'obsidian';
import {
  beforeEach,
  describe,
  expect,
  it,
  vi
} from 'vitest';

vi.mock('obsidian', () => ({
  FileSystemAdapter: vi.fn(),
  TFolder: vi.fn()
}));

vi.mock('@obsidian-typings/obsidian-public-latest/implementations', () => ({
  getDataAdapterEx: vi.fn()
}));

// eslint-disable-next-line import-x/first, import-x/imports-first -- vi.mock must precede imports.
import { getDataAdapterEx } from '@obsidian-typings/obsidian-public-latest/implementations';

// eslint-disable-next-line import-x/first, import-x/imports-first -- vi.mock must precede imports.
import { FileExplorerReloader } from './file-explorer-reloader.ts';

interface MockChild {
  name: string;
}

interface MockDirent {
  isDirectory(): boolean;
  name: string;
}

function createMockDirent(name: string, isDir: boolean): MockDirent {
  return {
    isDirectory: () => isDir,
    name
  };
}

function createMockFolder(children: MockChild[]): TFolder {
  const folder = new TFolder();
  Object.defineProperty(folder, 'children', { value: children });
  return folder;
}

describe('FileExplorerReloader', () => {
  let mockDebug: ReturnType<typeof vi.fn<(message: string, ...args: unknown[]) => void>>;
  let mockReaddir: ReturnType<typeof vi.fn>;
  let mockReconcileFile: ReturnType<typeof vi.fn<DataAdapterEx['reconcileFile']>>;
  let mockReconcileFolderCreation: ReturnType<typeof vi.fn<DataAdapterEx['reconcileFolderCreation']>>;
  let reloader: FileExplorerReloader;
  let mockGetAbstractFileByPath: ReturnType<typeof vi.fn<App['vault']['getAbstractFileByPath']>>;

  beforeEach(() => {
    vi.clearAllMocks();

    mockDebug = vi.fn();
    mockReaddir = vi.fn();
    mockReconcileFile = vi.fn<DataAdapterEx['reconcileFile']>().mockResolvedValue(undefined);
    mockReconcileFolderCreation = vi.fn<DataAdapterEx['reconcileFolderCreation']>().mockResolvedValue(undefined);

    // eslint-disable-next-line no-restricted-syntax -- Deep mock of App requires double assertion.
    const mockApp = {
      vault: {
        adapter: {
          fsPromises: {
            readdir: mockReaddir
          }
        },
        getAbstractFileByPath: mockGetAbstractFileByPath = vi.fn()
      }
    } as unknown as App;

    // eslint-disable-next-line no-restricted-syntax -- Partial mock of DataAdapterEx requires double assertion.
    vi.mocked(getDataAdapterEx).mockReturnValue({
      basePath: '/vault',
      reconcileFile: mockReconcileFile,
      reconcileFolderCreation: mockReconcileFolderCreation
    } as unknown as DataAdapterEx);

    // eslint-disable-next-line no-restricted-syntax -- Partial mock of ConsoleDebugComponent requires double assertion.
    const mockConsoleDebugComponent = { consoleDebug: mockDebug } as unknown as ConsoleDebugComponent;

    reloader = new FileExplorerReloader({
      app: mockApp,
      consoleDebugComponent: mockConsoleDebugComponent
    });
  });

  function setupFolder(_path: string, children: MockChild[]): void {
    mockGetAbstractFileByPath.mockReturnValue(createMockFolder(children));
  }

  describe('reloadFileExplorer', () => {
    it('should reload from root path recursively', async () => {
      setupFolder('/', []);
      mockReaddir.mockResolvedValue([]);

      await reloader.reloadFileExplorer();

      expect(mockReconcileFolderCreation).toHaveBeenCalledWith('/', '/');
      expect(mockReaddir).toHaveBeenCalledWith('/vault', { withFileTypes: true });
    });
  });

  describe('reloadFolder', () => {
    it('should throw if path is not a folder', async () => {
      mockGetAbstractFileByPath.mockReturnValue(null);

      await expect(reloader.reloadFolder('nonexistent', false)).rejects.toThrow('nonexistent is not a folder');
    });

    it('should add new files not in Obsidian vault', async () => {
      setupFolder('docs', []);
      mockReaddir.mockResolvedValue([
        createMockDirent('new-file.md', false)
      ]);

      await reloader.reloadFolder('docs', false);

      expect(mockReconcileFile).toHaveBeenCalledWith('docs/new-file.md', 'docs/new-file.md', false);
      expect(mockDebug).toHaveBeenCalledWith('Adding new file docs/new-file.md');
    });

    it('should delete files in Obsidian vault that do not exist on disk', async () => {
      setupFolder('docs', [{ name: 'deleted.md' }]);
      mockReaddir.mockResolvedValue([]);

      await reloader.reloadFolder('docs', false);

      expect(mockReconcileFile).toHaveBeenCalledWith('', 'docs/deleted.md', false);
      expect(mockDebug).toHaveBeenCalledWith('Deleting inexistent docs/deleted.md');
    });

    it('should not add or delete files that exist in both', async () => {
      setupFolder('docs', [{ name: 'existing.md' }]);
      mockReaddir.mockResolvedValue([
        createMockDirent('existing.md', false)
      ]);

      await reloader.reloadFolder('docs', false);

      expect(mockReconcileFile).not.toHaveBeenCalled();
    });

    it('should skip dot files from filesystem', async () => {
      setupFolder('docs', []);
      mockReaddir.mockResolvedValue([
        createMockDirent('.hidden', false),
        createMockDirent('visible.md', false)
      ]);

      await reloader.reloadFolder('docs', false);

      expect(mockReconcileFile).toHaveBeenCalledOnce();
      expect(mockReconcileFile).toHaveBeenCalledWith('docs/visible.md', 'docs/visible.md', false);
    });

    it('should use basePath directly for root path', async () => {
      setupFolder('/', []);
      mockReaddir.mockResolvedValue([]);

      await reloader.reloadFolder('/', false);

      expect(mockReaddir).toHaveBeenCalledWith('/vault', { withFileTypes: true });
    });

    it('should use basePath/directoryPath for non-root path', async () => {
      setupFolder('docs', []);
      mockReaddir.mockResolvedValue([]);

      await reloader.reloadFolder('docs', false);

      expect(mockReaddir).toHaveBeenCalledWith('/vault/docs', { withFileTypes: true });
    });

    it('should recurse into subdirectories when isRecursive is true', async () => {
      const subFolder = createMockFolder([]);
      const rootFolder = createMockFolder([]);

      mockGetAbstractFileByPath
        .mockReturnValueOnce(rootFolder)
        .mockReturnValueOnce(subFolder);

      mockReaddir
        .mockResolvedValueOnce([createMockDirent('subfolder', true)])
        .mockResolvedValueOnce([]);

      await reloader.reloadFolder('docs', true);

      expect(mockReconcileFolderCreation).toHaveBeenCalledWith('docs', 'docs');
      expect(mockReconcileFolderCreation).toHaveBeenCalledWith('docs/subfolder', 'docs/subfolder');
    });

    it('should not recurse into non-directory items when isRecursive is true', async () => {
      setupFolder('docs', [{ name: 'file.md' }]);
      mockReaddir.mockResolvedValue([createMockDirent('file.md', false)]);

      await reloader.reloadFolder('docs', true);

      expect(mockReconcileFolderCreation).toHaveBeenCalledOnce();
    });

    it('should not recurse into subdirectories when isRecursive is false', async () => {
      setupFolder('docs', []);
      mockReaddir.mockResolvedValue([createMockDirent('subfolder', true)]);

      await reloader.reloadFolder('docs', false);

      expect(mockReconcileFolderCreation).toHaveBeenCalledOnce();
    });

    it('should use filename directly for root path children', async () => {
      setupFolder('/', [{ name: 'old.md' }]);
      mockReaddir.mockResolvedValue([
        createMockDirent('new.md', false)
      ]);

      await reloader.reloadFolder('/', false);

      expect(mockReconcileFile).toHaveBeenCalledWith('new.md', 'new.md', false);
      expect(mockReconcileFile).toHaveBeenCalledWith('', 'old.md', false);
    });
  });
});
