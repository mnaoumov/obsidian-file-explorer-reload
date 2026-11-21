import {
  describe,
  expect,
  it
} from 'vitest';

import { PluginSettings } from './plugin-settings.ts';

describe('PluginSettings', () => {
  it('should show the reload button by default', () => {
    expect(new PluginSettings().shouldShowReloadButton).toBe(true);
  });
});
