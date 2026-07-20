import type { App } from 'obsidian';

import { Notice } from 'obsidian';
import {
  enableCommunityPlugin,
  installCommunityPlugin
} from 'obsidian-dev-utils/obsidian/community-plugins';

// File Explorer Reload adds a command and folder right-click menu items (Reload File Explorer,
// Reload Folder, Reload Folder with Subfolders), so there is nothing for a code-button to drive -
// the demo note walks through it manually. The only helper the vault needs is the shared
// CodeScript Toolkit installer used by the prerequisite note's button.
export async function installAndEnable(app: App, pluginId: string): Promise<void> {
  await installCommunityPlugin({ app, pluginId });
  await enableCommunityPlugin({ app, pluginId });
  new Notice(`Installed and enabled: ${pluginId}`);
}
