import type {
  App as AppType,
  Command,
  PluginManifest
} from 'obsidian';

import { castTo } from 'obsidian-dev-utils/object-utils';
import { App } from 'obsidian-test-mocks/obsidian';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi
} from 'vitest';

import { Plugin } from './plugin.ts';

const STRICT_PROXY_TARGET_SYMBOL = Symbol.for('strictProxyTarget');

// Registered by PluginBase itself, not by this plugin, so it is excluded from the assertion below.
const PLUGIN_BASE_OWNED_COMMAND_ID = 'unlock-active-note';

interface AppGlobal {
  app: AppType;
}

interface LoadedFlagHolder {
  loaded__: boolean;
}

const manifest = castTo<PluginManifest>({
  id: 'file-explorer-reload',
  name: 'File Explorer Reload',
  version: '1.0.0'
});

let app: AppType;
let appMock: App;
let savedGlobalApp: AppType;

describe('Plugin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    appMock = App.createConfigured__();
    app = appMock.asOriginalType__();

    // The real PluginBase reads dev-utils state off the app (and the global app).
    seedOnRawTarget(app, 'obsidianDevUtilsState', {});
    seedOnRawTarget(app.workspace, 'onLayoutReady', () => {
      // The command handlers are registered from onloadImpl, before layout-ready.
    });

    savedGlobalApp = castTo<AppGlobal>(window).app;
    castTo<AppGlobal>(window).app = app;
  });

  afterEach(() => {
    castTo<AppGlobal>(window).app = savedGlobalApp;
  });

  it('should register the reload command handlers in onloadImpl', async () => {
    const plugin = new Plugin(app, manifest);
    const addCommandSpy = vi.spyOn(plugin, 'addCommand');

    // PluginBase.onload is async; awaiting it runs onloadImpl and surfaces any rejection.
    await plugin.onload();

    const registeredCommandIds = addCommandSpy.mock.calls
      .map((call) => castTo<Command>(call[0]).id)
      .filter((id) => id !== PLUGIN_BASE_OWNED_COMMAND_ID);

    expect(registeredCommandIds).toStrictEqual([
      'reload-file-explorer',
      'reload-folder',
      'reload-folder-with-subfolders',
      'open-demo-vault'
    ]);

    castTo<LoadedFlagHolder>(plugin).loaded__ = true;
    plugin.unload();
  });
});

function seedOnRawTarget(strictProxiedObject: object, key: string, value: unknown): void {
  const rawTarget = castTo<object | undefined>(Reflect.get(strictProxiedObject, STRICT_PROXY_TARGET_SYMBOL)) ?? strictProxiedObject;
  Reflect.set(rawTarget, key, value);
}
