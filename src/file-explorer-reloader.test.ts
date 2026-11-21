import type { ConsoleDebugComponent } from '@mnaoumov/obsidian-lib/components/console-debug-component';
import type { DataAdapterEx } from '@obsidian-typings/obsidian-public-latest/implementations';
import type {
  App as AppOriginal,
  DataAdapter,
  FileSystemAdapter as FileSystemAdapterOriginal,
  TFolder
} from 'obsidian';

import { castTo } from '@mnaoumov/typescript-lib/object-utils';
import { strictProxy } from '@mnaoumov/typescript-test-toolkit/strict-proxy';
import { TFile } from 'obsidian';
import {
  App,
  FileSystemAdapter
} from 'obsidian-test-mocks/obsidian';
import {
  beforeEach,
  describe,
  expect,
  it,
  vi
} from 'vitest';

vi.mock('@obsidian-typings/obsidian-public-latest/implementations', () => ({
  getDataAdapterEx: vi.fn()
}));

// eslint-disable-next-line import-x/first, import-x/imports-first -- vi.mock must precede imports.
import { getDataAdapterEx } from '@obsidian-typings/obsidian-public-latest/implementations';

// eslint-disable-next-line import-x/first, import-x/imports-first -- vi.mock must precede imports.
import { FileExplorerReloader } from './file-explorer-reloader.ts';

interface MockChild {
  readonly name: string;
}

interface MockDirent {
  readonly isDirectory: () => boolean;
  readonly isFile: () => boolean;
  readonly name: string;
}

interface MockStat {
  readonly mtimeMs: number;
  readonly size: number;
}

function createMockDirent(name: string, isDirectory: boolean, isFile = !isDirectory): MockDirent {
  return {
    isDirectory: () => isDirectory,
    isFile: () => isFile,
    name
  };
}

function getChildFile(folder: TFolder, name: string): TFile {
  const child = folder.children.find((c) => c.name === name);
  if (!(child instanceof TFile)) {
    throw new TypeError(`No file ${name} in the mock folder`);
  }
  return child;
}

function matchingStat(file: TFile): MockStat {
  return { mtimeMs: file.stat.mtime, size: file.stat.size };
}

describe('FileExplorerReloader', () => {
  let mockDebug: ReturnType<typeof vi.fn<(message: string, ...$arguments: unknown[]) => void>>;
  let mockReaddir: ReturnType<typeof vi.fn>;
  let mockStat: ReturnType<typeof vi.fn<(path: string) => Promise<MockStat>>>;
  let mockReconcileFile: ReturnType<typeof vi.fn<DataAdapterEx['reconcileFile']>>;
  let mockReconcileFolderCreation: ReturnType<typeof vi.fn<DataAdapterEx['reconcileFolderCreation']>>;
  let reloader: FileExplorerReloader;
  let mockGetAbstractFileByPath: ReturnType<typeof vi.fn<AppOriginal['vault']['getAbstractFileByPath']>>;
  let vaultAdapter: DataAdapter;

  beforeEach(() => {
    vi.clearAllMocks();

    mockDebug = vi.fn();
    mockReaddir = vi.fn();
    mockStat = vi.fn<(path: string) => Promise<MockStat>>();
    mockReconcileFile = vi.fn<DataAdapterEx['reconcileFile']>().mockResolvedValue(undefined);
    mockReconcileFolderCreation = vi.fn<DataAdapterEx['reconcileFolderCreation']>().mockResolvedValue(undefined);
    mockGetAbstractFileByPath = vi.fn();

    const fileSystemAdapter = FileSystemAdapter.create__('/vault');
    Object.defineProperty(fileSystemAdapter, 'fsPromises', {
      value: strictProxy<FileSystemAdapterOriginal['fsPromises']>({
        readdir: castTo<FileSystemAdapterOriginal['fsPromises']['readdir']>(mockReaddir),
        stat: castTo<FileSystemAdapterOriginal['fsPromises']['stat']>(mockStat)
      })
    });
    vaultAdapter = fileSystemAdapter.asOriginalType__();

    const mockApp = strictProxy<AppOriginal>({
      vault: castTo<AppOriginal['vault']>({
        get adapter(): DataAdapter {
          return vaultAdapter;
        },
        getAbstractFileByPath: mockGetAbstractFileByPath
      })
    });

    vi.mocked(getDataAdapterEx).mockReturnValue(strictProxy<DataAdapterEx>({
      basePath: '/vault',
      reconcileFile: mockReconcileFile,
      reconcileFolderCreation: mockReconcileFolderCreation
    }));

    reloader = new FileExplorerReloader({
      app: mockApp,
      consoleDebugComponent: strictProxy<ConsoleDebugComponent>({ consoleDebug: mockDebug })
    });
  });

  function createFolder(path: string, children: MockChild[]): TFolder {
    // Mint a real obsidian-test-mocks TFolder (so the source's `instanceof TFolder` check passes) and seed its children.
    // The vault root ('/') already exists; createFolderSync__('/') returns a detached folder whose children never update, so use the live root.
    const app = App.createConfigured__();
    const folder = path === '/' ? app.vault.getRoot() : app.vault.createFolderSync__(path);
    for (const child of children) {
      app.vault.createSync__(path === '/' ? child.name : `${path}/${child.name}`, '');
    }
    return castTo<TFolder>(folder.asOriginalType2__());
  }

  function setupFolder(path: string, children: MockChild[]): TFolder {
    const folder = createFolder(path, children);
    mockGetAbstractFileByPath.mockReturnValue(folder);
    return folder;
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

      await expect(reloader.reloadFolder({ directoryPath: 'nonexistent', isRecursive: false })).rejects.toThrow('nonexistent is not a folder');
    });

    it('should throw if the vault adapter is not a file system adapter', async () => {
      setupFolder('docs', []);
      vaultAdapter = strictProxy<DataAdapter>({});

      await expect(reloader.reloadFolder({ directoryPath: 'docs', isRecursive: false })).rejects.toThrow('The vault adapter is not a file system adapter');
    });

    it('should add new files not in Obsidian vault', async () => {
      setupFolder('docs', []);
      mockReaddir.mockResolvedValue([
        createMockDirent('new-file.md', false)
      ]);

      await reloader.reloadFolder({ directoryPath: 'docs', isRecursive: false });

      expect(mockReconcileFile).toHaveBeenCalledWith('docs/new-file.md', 'docs/new-file.md', false);
      expect(mockDebug).toHaveBeenCalledWith('Adding new file docs/new-file.md');
    });

    it('should delete files in Obsidian vault that do not exist on disk', async () => {
      setupFolder('docs', [{ name: 'deleted.md' }]);
      mockReaddir.mockResolvedValue([]);

      await reloader.reloadFolder({ directoryPath: 'docs', isRecursive: false });

      expect(mockReconcileFile).toHaveBeenCalledWith('', 'docs/deleted.md', false);
      expect(mockDebug).toHaveBeenCalledWith('Deleting inexistent docs/deleted.md');
    });

    it('should not reconcile files that exist in both and did not change', async () => {
      const folder = setupFolder('docs', [{ name: 'existing.md' }]);
      mockReaddir.mockResolvedValue([
        createMockDirent('existing.md', false)
      ]);
      mockStat.mockResolvedValue(matchingStat(getChildFile(folder, 'existing.md')));

      await reloader.reloadFolder({ directoryPath: 'docs', isRecursive: false });

      expect(mockStat).toHaveBeenCalledWith('/vault/docs/existing.md');
      expect(mockReconcileFile).not.toHaveBeenCalled();
    });

    it('should treat a sub-millisecond mtime difference as unchanged', async () => {
      const folder = setupFolder('docs', [{ name: 'existing.md' }]);
      mockReaddir.mockResolvedValue([
        createMockDirent('existing.md', false)
      ]);
      const stat = matchingStat(getChildFile(folder, 'existing.md'));
      mockStat.mockResolvedValue({ ...stat, mtimeMs: stat.mtimeMs + 0.3 });

      await reloader.reloadFolder({ directoryPath: 'docs', isRecursive: false });

      expect(mockReconcileFile).not.toHaveBeenCalled();
    });

    it('should reconcile an existing file whose mtime changed on disk', async () => {
      const folder = setupFolder('docs', [{ name: 'changed.md' }]);
      mockReaddir.mockResolvedValue([
        createMockDirent('changed.md', false)
      ]);
      const stat = matchingStat(getChildFile(folder, 'changed.md'));
      mockStat.mockResolvedValue({ ...stat, mtimeMs: stat.mtimeMs + 5000 });

      await reloader.reloadFolder({ directoryPath: 'docs', isRecursive: false });

      expect(mockReconcileFile).toHaveBeenCalledOnce();
      expect(mockReconcileFile).toHaveBeenCalledWith('docs/changed.md', 'docs/changed.md', false);
      expect(mockDebug).toHaveBeenCalledWith('Refreshing changed file docs/changed.md');
    });

    it('should reconcile an existing file whose size changed on disk', async () => {
      const folder = setupFolder('/', [{ name: 'changed.md' }]);
      mockReaddir.mockResolvedValue([
        createMockDirent('changed.md', false)
      ]);
      const stat = matchingStat(getChildFile(folder, 'changed.md'));
      mockStat.mockResolvedValue({ ...stat, size: stat.size + 1 });

      await reloader.reloadFolder({ directoryPath: '/', isRecursive: false });

      expect(mockStat).toHaveBeenCalledWith('/vault/changed.md');
      expect(mockReconcileFile).toHaveBeenCalledWith('changed.md', 'changed.md', false);
    });

    it('should not stat an entry that is neither a file nor a directory', async () => {
      setupFolder('docs', [{ name: 'link.md' }]);
      mockReaddir.mockResolvedValue([
        createMockDirent('link.md', false, false)
      ]);

      await reloader.reloadFolder({ directoryPath: 'docs', isRecursive: false });

      expect(mockStat).not.toHaveBeenCalled();
      expect(mockReconcileFile).not.toHaveBeenCalled();
    });

    it('should not stat a file on disk that Obsidian holds as a folder', async () => {
      const app = App.createConfigured__();
      const folder = app.vault.createFolderSync__('docs');
      app.vault.createFolderSync__('docs/clash');
      mockGetAbstractFileByPath.mockReturnValue(castTo<TFolder>(folder.asOriginalType2__()));
      mockReaddir.mockResolvedValue([
        createMockDirent('clash', false)
      ]);

      await reloader.reloadFolder({ directoryPath: 'docs', isRecursive: false });

      expect(mockStat).not.toHaveBeenCalled();
      expect(mockReconcileFile).not.toHaveBeenCalled();
    });

    it('should skip dot files from filesystem', async () => {
      setupFolder('docs', []);
      mockReaddir.mockResolvedValue([
        createMockDirent('.hidden', false),
        createMockDirent('visible.md', false)
      ]);

      await reloader.reloadFolder({ directoryPath: 'docs', isRecursive: false });

      expect(mockReconcileFile).toHaveBeenCalledOnce();
      expect(mockReconcileFile).toHaveBeenCalledWith('docs/visible.md', 'docs/visible.md', false);
    });

    it('should use basePath directly for root path', async () => {
      setupFolder('/', []);
      mockReaddir.mockResolvedValue([]);

      await reloader.reloadFolder({ directoryPath: '/', isRecursive: false });

      expect(mockReaddir).toHaveBeenCalledWith('/vault', { withFileTypes: true });
    });

    it('should use basePath/directoryPath for non-root path', async () => {
      setupFolder('docs', []);
      mockReaddir.mockResolvedValue([]);

      await reloader.reloadFolder({ directoryPath: 'docs', isRecursive: false });

      expect(mockReaddir).toHaveBeenCalledWith('/vault/docs', { withFileTypes: true });
    });

    it('should recurse into subdirectories when isRecursive is true', async () => {
      const rootFolder = createFolder('docs', []);
      const subFolder = createFolder('docs/subfolder', []);

      mockGetAbstractFileByPath
        .mockReturnValueOnce(rootFolder)
        .mockReturnValueOnce(subFolder);

      mockReaddir
        .mockResolvedValueOnce([createMockDirent('subfolder', true)])
        .mockResolvedValueOnce([]);

      await reloader.reloadFolder({ directoryPath: 'docs', isRecursive: true });

      expect(mockReconcileFolderCreation).toHaveBeenCalledWith('docs', 'docs');
      expect(mockReconcileFolderCreation).toHaveBeenCalledWith('docs/subfolder', 'docs/subfolder');
    });

    it('should not recurse into non-directory items when isRecursive is true', async () => {
      const folder = setupFolder('docs', [{ name: 'file.md' }]);
      mockReaddir.mockResolvedValue([createMockDirent('file.md', false)]);
      mockStat.mockResolvedValue(matchingStat(getChildFile(folder, 'file.md')));

      await reloader.reloadFolder({ directoryPath: 'docs', isRecursive: true });

      expect(mockReconcileFolderCreation).toHaveBeenCalledOnce();
    });

    it('should not recurse into subdirectories when isRecursive is false', async () => {
      setupFolder('docs', []);
      mockReaddir.mockResolvedValue([createMockDirent('subfolder', true)]);

      await reloader.reloadFolder({ directoryPath: 'docs', isRecursive: false });

      expect(mockReconcileFolderCreation).toHaveBeenCalledOnce();
    });

    it('should use filename directly for root path children', async () => {
      setupFolder('/', [{ name: 'old.md' }]);
      mockReaddir.mockResolvedValue([
        createMockDirent('new.md', false)
      ]);

      await reloader.reloadFolder({ directoryPath: '/', isRecursive: false });

      expect(mockReconcileFile).toHaveBeenCalledWith('new.md', 'new.md', false);
      expect(mockReconcileFile).toHaveBeenCalledWith('', 'old.md', false);
    });
  });
});
