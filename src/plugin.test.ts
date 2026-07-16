import type { PluginManifest } from 'obsidian';
import type { CommandHandlerComponent } from 'obsidian-dev-utils/obsidian/command-handlers/command-handler-component';
import type { ConsoleDebugComponent } from 'obsidian-dev-utils/obsidian/components/console-debug-component';

import { castTo } from 'obsidian-dev-utils/object-utils';
import { strictProxy } from 'obsidian-dev-utils/strict-proxy';
import { App } from 'obsidian-test-mocks/obsidian';
import {
  beforeEach,
  describe,
  expect,
  it,
  vi
} from 'vitest';

import { ReloadFileExplorerCommandHandler } from './command-handlers/reload-file-explorer-command-handler.ts';
import { ReloadFolderCommandHandler } from './command-handlers/reload-folder-command-handler.ts';
import { ReloadFolderWithSubfoldersCommandHandler } from './command-handlers/reload-folder-with-subfolders-command-handler.ts';
import { Plugin } from './plugin.ts';

interface PluginInternals {
  _commandHandlerComponent: CommandHandlerComponent;
  _consoleDebugComponent: ConsoleDebugComponent;
  onloadImpl(): void;
}

describe('Plugin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should register the reload command handlers in onloadImpl', () => {
    const app = App.createConfigured__().asOriginalType__();
    const manifest = strictProxy<PluginManifest>({ name: 'File Explorer Reload' });
    const plugin = new Plugin(app, manifest);
    const internals = castTo<PluginInternals>(plugin);
    internals._consoleDebugComponent = strictProxy<ConsoleDebugComponent>({ consoleDebug: vi.fn() });
    const registerCommandHandlers = vi.fn();
    internals._commandHandlerComponent = strictProxy<CommandHandlerComponent>({ registerCommandHandlers });

    internals.onloadImpl();

    expect(registerCommandHandlers).toHaveBeenCalledOnce();
    expect(registerCommandHandlers).toHaveBeenCalledWith([
      expect.any(ReloadFileExplorerCommandHandler),
      expect.any(ReloadFolderCommandHandler),
      expect.any(ReloadFolderWithSubfoldersCommandHandler)
    ]);
  });
});
