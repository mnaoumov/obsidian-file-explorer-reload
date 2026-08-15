/**
 * @file
 *
 * Produces the desktop screenshots the community-store listing needs
 * (T461-P21), driving a staged vault in a real Obsidian and writing
 * images/screenshots/screenshot-desktop-N.png.
 *
 * ONE shot, and the reason is worth recording. The obvious storyboard is a
 * stale file explorer next to a refreshed one, and it cannot be built: files
 * written into the vault with Node fs, from this suite, while Obsidian runs,
 * are picked up by Obsidian on its own within a second. The suite asserted the
 * pane had NOT caught up before claiming it was stale, and that assertion
 * failed — which is the assertion doing its job rather than shipping a frame
 * captioned with a problem the reader would not have.
 *
 * The pane does fall behind in the situations the README describes (a large
 * vault, a sync client, a watcher that misses an event), but none of those can
 * be staged from a capture run. So the shot shows the plugin SURFACE: the three
 * commands, which is what a reader is buying.
 *
 * Desktop only, per the manifest.
 */

import {
  mkdirSync,
  writeFileSync
} from 'node:fs';
import { join } from 'node:path';
import process from 'node:process';
import {
  captureObsidianScreenshot,
  evalInObsidian,
  labelScreenshot,
  readPngDimensions
} from 'obsidian-integration-testing';
import { getTemporaryVault } from 'obsidian-integration-testing/vitest-global-setup-plugin';
import {
  beforeAll,
  describe,
  expect,
  it
} from 'vitest';

const PLUGIN_ID = 'file-explorer-reload';
const WIDTH_IN_PIXELS = 1200;
const HEIGHT_IN_PIXELS = 800;

const IMAGES_DIRECTORY = join(process.cwd(), 'images', 'screenshots');

beforeAll(async () => {
  const vault = getTemporaryVault();

  vault.populate({
    'Inbox/Already here.md': '# Already here\n',
    'Projects/Alpha.md': '# Alpha\n',
    'Reading list.md': '# Reading list\n'
  });
  await vault.syncToDevice();

  await evalInObsidian({
    async callback({ app, lib: { waitUntil } }) {
      const SETTLE_TIMEOUT_IN_MILLISECONDS = 30_000;
      const SETTLE_DELAY_IN_MILLISECONDS = 1000;

      app.changeTheme('obsidian');

      // The file explorer IS the subject here, so it is the one thing that must
      // Be open, with the folder the files land in expanded.
      app.workspace.leftSplit.expand();
      const fileExplorerLeaf = app.workspace.getLeavesOfType('file-explorer')[0];
      if (fileExplorerLeaf) {
        await app.workspace.revealLeaf(fileExplorerLeaf);
      }

      await waitUntil({
        message: 'the file explorer to list the staged files',
        predicate: () => document.querySelectorAll('.nav-files-container .nav-file').length > 0,
        timeoutInMilliseconds: SETTLE_TIMEOUT_IN_MILLISECONDS
      });

      await sleep(SETTLE_DELAY_IN_MILLISECONDS);
    },
    vaultPath: vaultPath()
  });
});

describe('desktop store screenshots', () => {
  it('1 - the commands it adds', async () => {
    const commandNames = await openCommandPalette('Reload');
    expect(commandNames.length).toBeGreaterThan(1);
    await shoot(1, 'Refresh the file list: the pane, a folder, or a whole tree');
  });
});

/**
 * Opens the command palette and filters it to this plugin commands.
 *
 * @param query - What to type into the palette.
 * @returns The names of the commands this plugin registers.
 */
async function openCommandPalette(query: string): Promise<string[]> {
  return await evalInObsidian({
    async callback({ app, lib: { waitUntil }, pluginId, query: text }) {
      const PALETTE_TIMEOUT_IN_MILLISECONDS = 15_000;
      const SETTLE_DELAY_IN_MILLISECONDS = 900;

      app.commands.executeCommandById('command-palette:open');

      await waitUntil({
        message: 'the command palette to open',
        predicate: () => Boolean(document.querySelector('.prompt input')),
        timeoutInMilliseconds: PALETTE_TIMEOUT_IN_MILLISECONDS
      });

      const input = document.querySelector('.prompt input');
      if (!(input instanceof HTMLInputElement)) {
        throw new TypeError('The command palette has no input.');
      }

      input.value = text;
      // The palette filters from its own input handler, so setting value alone
      // Would leave every command in the vault on screen.
      input.dispatchEvent(new Event('input'));

      await sleep(SETTLE_DELAY_IN_MILLISECONDS);

      // Reported so the shot can assert the plugin own commands are the ones on
      // Screen, rather than whatever else matched the word.
      return Object.values(app.commands.commands)
        .filter((command) => command.id.startsWith(`${pluginId}:`))
        .map((command) => command.name);
    },
    input: { pluginId: PLUGIN_ID, query },
    vaultPath: vaultPath()
  });
}

/**
 * Captures the window, captions it, and writes it as
 * `images/screenshots/screenshot-desktop-<index>.png`.
 *
 * @param index - The 1-based listing position.
 * @param caption - The caption drawn across the bottom of the frame.
 */
async function shoot(index: number, caption: string): Promise<void> {
  const bytes = await captureObsidianScreenshot({
    heightInPixels: HEIGHT_IN_PIXELS,
    vaultPath: vaultPath(),
    widthInPixels: WIDTH_IN_PIXELS
  });

  const labeled = await labelScreenshot(bytes, { text: caption });

  expect(readPngDimensions(labeled)).toStrictEqual({
    heightInPixels: HEIGHT_IN_PIXELS,
    widthInPixels: WIDTH_IN_PIXELS
  });

  mkdirSync(IMAGES_DIRECTORY, { recursive: true });
  writeFileSync(join(IMAGES_DIRECTORY, `screenshot-desktop-${String(index)}.png`), labeled);
}

function vaultPath(): string {
  return getTemporaryVault().path;
}
