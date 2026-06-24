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

import { ReloadFileExplorerCommandHandler } from './reload-file-explorer-command-handler.ts';

interface ReloadFileExplorerCommandHandlerTestAccessor {
  execute(): Promise<void>;
}

function asTestAccessor(handler: ReloadFileExplorerCommandHandler): ReloadFileExplorerCommandHandlerTestAccessor {
  return castTo<ReloadFileExplorerCommandHandlerTestAccessor>(handler);
}

describe('ReloadFileExplorerCommandHandler', () => {
  let handler: ReloadFileExplorerCommandHandler;
  let mockReloadFileExplorer: ReturnType<typeof vi.fn<() => Promise<void>>>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockReloadFileExplorer = vi.fn<() => Promise<void>>().mockResolvedValue(undefined);
    handler = new ReloadFileExplorerCommandHandler({
      fileExplorerReloader: strictProxy<FileExplorerReloader>({
        reloadFileExplorer: mockReloadFileExplorer
      })
    });
  });

  it('should set correct command properties', () => {
    const command = handler.buildCommand();
    expect(command.icon).toBe('refresh-ccw');
    expect(command.id).toBe('reload-file-explorer');
    expect(command.name).toBe('Reload file explorer');
  });

  it('should call reloadFileExplorer on execute', async () => {
    await asTestAccessor(handler).execute();

    expect(mockReloadFileExplorer).toHaveBeenCalledOnce();
  });
});
