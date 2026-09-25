/**
 * @file
 *
 * Produces the desktop screenshots the community-store listing needs,
 * driving a staged vault in a real Obsidian and writing
 * images/screenshots/screenshot-desktop-N.png.
 *
 * The commands are the subject, not a before/after, and the reason is worth recording. The obvious storyboard is a
 * stale file explorer next to a refreshed one, and it cannot be built: files
 * written into the vault with Node fs, from this suite, while Obsidian runs,
 * are picked up by Obsidian on its own within a second. The suite asserted the
 * pane had NOT caught up before claiming it was stale, and that assertion
 * failed — which is the assertion doing its job rather than shipping a frame
 * captioned with a problem the reader would not have.
 *
 * The pane does fall behind in the situations the README describes (a large
 * vault, a sync client, a watcher that misses an event), but none of those can
 * be staged from a capture run. So the shots show the plugin SURFACE: the three
 * commands, which is what a reader is buying.
 *
 * TWO shots, because no single surface shows all three. The two folder commands
 * are folder-scoped, and the palette resolves its target through
 * `workspace.getActiveFile()`, which is never a folder, so they never appear
 * there. Frame 1 is the palette with the pane command. Frame 2 is a folder's
 * right-click menu with the two folder commands.
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
      /*
       * Under the transport's ~30s per-closure cap, not at it. At 30_000 this ceiling was unreachable: the
       * whole eval is killed at the cap first, and reported as a bare transport timeout naming the harness
       * rather than the wait that overran — and the settle below shares the same budget, so the closure was
       * already over it before the wait began. What is waited on here lands in well under a second.
       */
      const SETTLE_TIMEOUT_IN_MILLISECONDS = 20_000;
      const SETTLE_DELAY_IN_MILLISECONDS = 1000;

      app.changeTheme('obsidian');

      // The file explorer IS the subject here, so it is the one thing that must
      // be open, with the folder the files land in expanded.
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
  it('1 - the pane command', async () => {
    // `Reload file` rather than `Reload`: the bare word also matched the core
    // `Reload app without saving`, which took the top row.
    const rowTitles = await openCommandPalette('Reload file');
    // The row's `: ` between the plugin name and the command is drawn by CSS, so
    // it is not in the text.
    expect(rowTitles).toStrictEqual(['File Explorer ReloadReload file explorer']);
    await shoot(1, 'Reload the whole file explorer from the command palette');
    await closeCommandPalette();
  });

  it('2 - the folder commands', async () => {
    const itemTitles = await openFolderMenu('Projects');
    expect(itemTitles).toContain('Reload folder');
    expect(itemTitles).toContain('Reload folder with subfolders');
    await shoot(2, 'Reload one folder, or a folder and all its subfolders');
  });
});

/**
 * Closes the command palette the previous shot left open.
 */
async function closeCommandPalette(): Promise<void> {
  await evalInObsidian({
    async callback({ lib: { pressKey, waitUntil } }) {
      const PALETTE_TIMEOUT_IN_MILLISECONDS = 15_000;
      await pressKey({ key: 'Escape' });
      await waitUntil({
        message: 'the command palette to close',
        predicate: () => !document.querySelector('.prompt'),
        timeoutInMilliseconds: PALETTE_TIMEOUT_IN_MILLISECONDS
      });
    },
    vaultPath: vaultPath()
  });
}

/**
 * Opens the command palette and filters it.
 *
 * @param query - What to type into the palette.
 * @returns The titles of the rows the palette shows.
 */
async function openCommandPalette(query: string): Promise<string[]> {
  return await evalInObsidian({
    async callback({ app, lib: { waitUntil }, query: text }) {
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
      // would leave every command in the vault on screen.
      input.dispatchEvent(new Event('input'));

      await sleep(SETTLE_DELAY_IN_MILLISECONDS);

      // Reported so the shot can assert which rows are on screen, rather than
      // whatever else matched the query.
      return [...document.querySelectorAll('.prompt .suggestion-item')].map((item) => item.textContent);
    },
    input: { query },
    vaultPath: vaultPath()
  });
}

/**
 * Right-clicks a folder in the file explorer and opens the plugin's items.
 *
 * @param folderPath - The vault-relative path of the folder.
 * @returns The titles of every menu item on screen, submenus included.
 */
async function openFolderMenu(folderPath: string): Promise<string[]> {
  return await evalInObsidian({
    async callback({ folderPath: path, lib: { clickElement, waitUntil } }) {
      const MENU_TIMEOUT_IN_MILLISECONDS = 10_000;
      const SETTLE_DELAY_IN_MILLISECONDS = 900;
      const SUBMENU_TITLE = 'File Explorer Reload';

      const titleEl = document.querySelector(`.nav-folder-title[data-path="${CSS.escape(path)}"]`);
      if (!(titleEl instanceof HTMLElement)) {
        throw new TypeError(`The file explorer shows no folder ${path}.`);
      }

      // A TRUSTED right click, so the menu anchors at the folder, where a user
      // would see it, rather than in the top-left corner.
      await clickElement({ button: 'right', element: titleEl });

      await waitUntil({
        message: 'the folder context menu to open',
        predicate: () => Boolean(document.body.querySelector('.menu')),
        timeoutInMilliseconds: MENU_TIMEOUT_IN_MILLISECONDS
      });

      function readTitles(): string[] {
        return [...document.querySelectorAll('.menu .menu-item-title')].map((item) => item.textContent);
      }

      // The folder items sit in a plugin-titled submenu. A trusted hover on its
      // parent did not open it; a click does, as it does for a user.
      const submenuParent = [...document.querySelectorAll('.menu .menu-item')].find((item) => item.querySelector('.menu-item-title')?.textContent === SUBMENU_TITLE);
      if (!(submenuParent instanceof HTMLElement)) {
        throw new TypeError(`The folder menu has no ${SUBMENU_TITLE} submenu: ${readTitles().join(' | ')}`);
      }
      await clickElement({ element: submenuParent });
      await waitUntil({
        message: 'the File Explorer Reload submenu to open',
        predicate: () => readTitles().includes('Reload folder'),
        timeoutInMilliseconds: MENU_TIMEOUT_IN_MILLISECONDS
      });

      await sleep(SETTLE_DELAY_IN_MILLISECONDS);

      return readTitles();
    },
    input: { folderPath },
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
