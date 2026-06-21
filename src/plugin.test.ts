import type { PluginManifest } from 'obsidian';
import type { ConsoleDebugComponent } from 'obsidian-dev-utils/obsidian/components/console-debug-component';

import { castTo } from 'obsidian-dev-utils/object-utils';
import { CommandHandlerComponent } from 'obsidian-dev-utils/obsidian/command-handlers/command-handler-component';
import { MenuEventRegistrarComponent } from 'obsidian-dev-utils/obsidian/components/menu-event-registrar-component';
import { strictProxy } from 'obsidian-dev-utils/strict-proxy';
import { App } from 'obsidian-test-mocks/obsidian';
import {
  beforeEach,
  describe,
  expect,
  it,
  vi
} from 'vitest';

import { Plugin } from './plugin.ts';

interface PluginInternals {
  _consoleDebugComponent: ConsoleDebugComponent;
  onloadImpl(): void;
}

describe('Plugin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should wire up the menu event registrar and command handler in onloadImpl', () => {
    const app = App.createConfigured__().asOriginalType__();
    const manifest = strictProxy<PluginManifest>({ name: 'File Explorer Reload' });
    const plugin = new Plugin(app, manifest);
    const internals = castTo<PluginInternals>(plugin);
    internals._consoleDebugComponent = strictProxy<ConsoleDebugComponent>({ consoleDebug: vi.fn() });
    const addChildSpy = vi.spyOn(plugin, 'addChild');

    internals.onloadImpl();

    const EXPECTED_ADD_CHILD_CALLS = 2;
    expect(addChildSpy).toHaveBeenCalledTimes(EXPECTED_ADD_CHILD_CALLS);
    expect(addChildSpy.mock.calls[0]?.[0]).toBeInstanceOf(MenuEventRegistrarComponent);
    expect(addChildSpy.mock.calls[1]?.[0]).toBeInstanceOf(CommandHandlerComponent);
  });
});
