import type { SettingDefinitionItem } from 'obsidian';

import { appendCodeBlock } from '@mnaoumov/obsidian-lib/html-element';
import { PluginSettingsTabBase } from '@mnaoumov/obsidian-lib/plugin/plugin-settings-tab';

import type { PluginSettings } from './plugin-settings.ts';

export class PluginSettingsTab extends PluginSettingsTabBase<PluginSettings> {
  protected override getSettingDefinitionItems(): SettingDefinitionItem[] {
    return [
      this.settingEx({
        desc: createFragment((f) => {
          f.appendText('Whether the file explorer header shows a button that runs the ');
          appendCodeBlock(f, 'File Explorer Reload: Reload file explorer');
          f.appendText(' command.');
        }),
        name: 'Show reload button',
        render: (setting) => {
          setting.addToggle((toggle) => {
            this.bind({ propertyName: 'shouldShowReloadButton', valueComponent: toggle });
          });
        }
      })
    ];
  }
}
