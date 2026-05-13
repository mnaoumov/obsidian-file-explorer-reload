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

vi.mock('obsidian-dev-utils/obsidian/command-handlers/global-command-handler', () => ({
  GlobalCommandHandler: class {
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
import { ReloadFileExplorerCommandHandler } from './reload-file-explorer-command-handler.ts';

interface ReloadFileExplorerCommandHandlerTestAccessor {
  execute: () => Promise<void>;
  icon: string;
  id: string;
  name: string;
}

function asTestAccessor(handler: ReloadFileExplorerCommandHandler): ReloadFileExplorerCommandHandlerTestAccessor {
  // eslint-disable-next-line no-restricted-syntax -- Accessing private/protected members for testing needs double assertion.
  return handler as unknown as ReloadFileExplorerCommandHandlerTestAccessor;
}

describe('ReloadFileExplorerCommandHandler', () => {
  let handler: ReloadFileExplorerCommandHandler;
  let mockReloadFileExplorer: ReturnType<typeof vi.fn<() => Promise<void>>>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockReloadFileExplorer = vi.fn<() => Promise<void>>().mockResolvedValue(undefined);
    handler = new ReloadFileExplorerCommandHandler({
      pluginName: 'file-explorer-reload',
      reloadFileExplorer: mockReloadFileExplorer
    });
  });

  it('should set correct command properties', () => {
    const accessor = asTestAccessor(handler);
    expect(accessor.icon).toBe('refresh-ccw');
    expect(accessor.id).toBe('reload-file-explorer');
    expect(accessor.name).toBe('Reload file explorer');
  });

  it('should call reloadFileExplorer on execute', async () => {
    await asTestAccessor(handler).execute();

    expect(mockReloadFileExplorer).toHaveBeenCalledOnce();
  });
});
