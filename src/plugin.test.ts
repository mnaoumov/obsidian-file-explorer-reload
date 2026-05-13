import {
  beforeEach,
  describe,
  expect,
  it,
  vi
} from 'vitest';

const { mockAddChild, mockCommandHandlerComponent } = vi.hoisted(() => ({
  mockAddChild: vi.fn(),
  mockCommandHandlerComponent: vi.fn()
}));

vi.mock('obsidian-dev-utils/obsidian/plugin/plugin', () => ({
  PluginBase: class {
    public addChild = mockAddChild;
    public consoleDebugComponent = { debug: vi.fn() };
  }
}));

vi.mock('obsidian', () => ({
  FileSystemAdapter: vi.fn(),
  TFolder: vi.fn()
}));

vi.mock('obsidian-typings/implementations', () => ({
  getDataAdapterEx: vi.fn()
}));

vi.mock('obsidian-dev-utils/obsidian/command-handlers/command-handler-component', () => ({
  CommandHandlerComponent: mockCommandHandlerComponent
}));

vi.mock('obsidian-dev-utils/obsidian/active-file-provider', () => ({
  AppActiveFileProvider: vi.fn()
}));

vi.mock('obsidian-dev-utils/obsidian/command-registrar', () => ({
  PluginCommandRegistrar: vi.fn()
}));

vi.mock('obsidian-dev-utils/obsidian/menu-event-registrar', () => ({
  AppMenuEventRegistrar: vi.fn()
}));

vi.mock('obsidian-dev-utils/obsidian/command-handlers/global-command-handler', () => ({
  GlobalCommandHandler: vi.fn()
}));

vi.mock('obsidian-dev-utils/obsidian/command-handlers/folder-command-handler', () => ({
  FolderCommandHandler: vi.fn()
}));

// eslint-disable-next-line import-x/first, import-x/imports-first -- vi.mock must precede imports.
import { Plugin } from './plugin.ts';

describe('Plugin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create CommandHandlerComponent and add as child', () => {
    const mockApp = {} as ConstructorParameters<typeof Plugin>[0];
    const mockManifest = { name: 'File Explorer Reload' } as ConstructorParameters<typeof Plugin>[1];

    new Plugin(mockApp, mockManifest);

    expect(mockCommandHandlerComponent).toHaveBeenCalledOnce();
    expect(mockAddChild).toHaveBeenCalledOnce();
  });
});
