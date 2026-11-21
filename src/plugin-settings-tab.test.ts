import type { PluginSettingsComponentBase } from '@mnaoumov/obsidian-lib/components/plugin-settings-component';
import type { AsyncEventRef } from '@mnaoumov/typescript-lib/async-events';
import type {
  App as AppOriginal,
  Plugin,
  SettingDefinition,
  SettingGroup
} from 'obsidian';

import { PluginSettingsTabBase } from '@mnaoumov/obsidian-lib/plugin/plugin-settings-tab';
import { SettingEx } from '@mnaoumov/obsidian-lib/setting-ex';
import { noopAsync } from '@mnaoumov/typescript-lib/function';
import { castTo } from '@mnaoumov/typescript-lib/object-utils';
import { strictProxy } from '@mnaoumov/typescript-test-toolkit/strict-proxy';
import { App } from 'obsidian-test-mocks/obsidian';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi
} from 'vitest';

import { PluginSettingsTab } from './plugin-settings-tab.ts';
import { PluginSettings } from './plugin-settings.ts';

let app: AppOriginal;

beforeEach(() => {
  app = App.createConfigured__().asOriginalType__();
  vi.spyOn(PluginSettingsTabBase.prototype, 'bind').mockImplementation((params) => params.valueComponent);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('PluginSettingsTab', () => {
  it('should declare the Show reload button row', () => {
    const tab = createSettingsTab();

    const names = tab.getSettingDefinitions().map((item) => 'name' in item ? item.name : '');

    expect(names).toStrictEqual(['Show reload button']);
  });

  it('should bind shouldShowReloadButton when rendered', () => {
    const tab = createSettingsTab();

    for (const item of tab.getSettingDefinitions()) {
      const row = castTo<SettingDefinition>(item);
      if ('render' in row) {
        row.render(new SettingEx(tab.containerEl), castTo<SettingGroup>(null));
      }
    }

    const boundKeys = vi.mocked(PluginSettingsTabBase.prototype.bind).mock.calls.map((call) => call[0].propertyName);
    expect(boundKeys).toStrictEqual(['shouldShowReloadButton']);
  });
});

function createSettingsTab(): PluginSettingsTab {
  const plugin = strictProxy<Plugin>({
    app,
    manifest: { id: 'file-explorer-reload' }
  });
  const settings = new PluginSettings();
  const pluginSettingsComponent = strictProxy<PluginSettingsComponentBase<PluginSettings>>({
    defaultSettings: new PluginSettings(),
    on: castTo<PluginSettingsComponentBase<PluginSettings>['on']>(vi.fn((): AsyncEventRef =>
      castTo<AsyncEventRef>({
        asyncEventSource: {
          offref: vi.fn()
        }
      })
    )),
    revalidate: vi.fn(() => Promise.resolve(castTo<Record<keyof PluginSettings, string>>({}))),
    saveToFile: vi.fn(() => noopAsync()),
    setProperty: vi.fn(() => Promise.resolve('')),
    settings,
    settingsState: {
      effectiveValues: settings,
      inputValues: settings,
      validationMessages: castTo<Record<keyof PluginSettings, string>>({})
    }
  });
  return new PluginSettingsTab({ plugin, pluginSettingsComponent });
}
