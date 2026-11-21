import type { AsyncEventRef } from '@mnaoumov/typescript-lib/async-events';
import type { HeaderDom } from '@obsidian-typings/obsidian-public-latest';
import type {
  App,
  EventRef,
  WorkspaceLeaf
} from 'obsidian';

import { sleep } from '@mnaoumov/typescript-lib/async';
import { castTo } from '@mnaoumov/typescript-lib/object-utils';
import { ViewType } from '@obsidian-typings/obsidian-public-latest/implementations';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi
} from 'vitest';

import type { PluginSettingsComponent } from './plugin-settings-component.ts';

import { FileExplorerReloadButtonComponent } from './file-explorer-reload-button-component.ts';

const RELOAD_BUTTON_CLASS_NAME = 'file-explorer-reload-button';

interface FakeView {
  readonly addNavButton: ReturnType<typeof vi.fn<HeaderDom['addNavButton']>>;
  readonly navButtonsEl: HTMLDivElement;
  readonly view: object;
}

type SettingsListener = () => void;

interface SettingsState {
  // eslint-disable-next-line typescript-dev-toolkit/readonly-interface-members -- Tests flip the setting between assertions.
  shouldShowReloadButton: boolean;
}

let layoutChangeListener: (() => void) | null;
let leaves: WorkspaceLeaf[];
let settings: SettingsState;
let settingsListeners: Map<string, SettingsListener>;
let onClick: ReturnType<typeof vi.fn<() => void>>;

describe('FileExplorerReloadButtonComponent', () => {
  beforeEach(() => {
    layoutChangeListener = null;
    leaves = [];
    settings = { shouldShowReloadButton: true };
    settingsListeners = new Map();
    onClick = vi.fn<() => void>();
  });

  afterEach(() => {
    document.body.empty();
    vi.restoreAllMocks();
  });

  it('should add a button to each loaded file explorer at layout ready', async () => {
    const first = addFileExplorer();
    const second = addFileExplorer();
    leaves.push(castTo<WorkspaceLeaf>({ view: {} }));

    const component = await loadComponent();

    expect(first.addNavButton).toHaveBeenCalledWith('refresh-ccw', 'Reload file explorer', expect.any(Function), RELOAD_BUTTON_CLASS_NAME);
    expect(getButtons(first)).toHaveLength(1);
    expect(getButtons(second)).toHaveLength(1);
    component.unload();
  });

  it('should run the click callback when the button is clicked', async () => {
    const view = addFileExplorer();
    const component = await loadComponent();

    getButtons(view)[0]?.click();

    expect(onClick).toHaveBeenCalledOnce();
    component.unload();
  });

  it('should not add a second button on layout-change', async () => {
    const view = addFileExplorer();
    const component = await loadComponent();

    layoutChangeListener?.();

    expect(getButtons(view)).toHaveLength(1);
    component.unload();
  });

  it('should add a button to a file explorer opened later', async () => {
    const component = await loadComponent();
    const view = addFileExplorer();

    layoutChangeListener?.();

    expect(getButtons(view)).toHaveLength(1);
    component.unload();
  });

  it('should re-add the button after the pane is rebuilt', async () => {
    const view = addFileExplorer();
    const component = await loadComponent();

    view.navButtonsEl.empty();
    layoutChangeListener?.();

    expect(getButtons(view)).toHaveLength(1);
    component.unload();
  });

  it('should add no button when the setting is off', async () => {
    settings.shouldShowReloadButton = false;
    const view = addFileExplorer();
    const component = await loadComponent();

    expect(getButtons(view)).toHaveLength(0);
    component.unload();
  });

  it('should remove and re-add the buttons when the setting changes', async () => {
    const view = addFileExplorer();
    const component = await loadComponent();

    settings.shouldShowReloadButton = false;
    settingsListeners.get('saveSettings')?.();
    expect(getButtons(view)).toHaveLength(0);

    settings.shouldShowReloadButton = true;
    settingsListeners.get('loadSettings')?.();
    expect(getButtons(view)).toHaveLength(1);
    component.unload();
  });

  it('should remove the buttons on unload', async () => {
    const view = addFileExplorer();
    const component = await loadComponent();

    component.unload();

    expect(getButtons(view)).toHaveLength(0);
  });
});

function addFileExplorer(): FakeView {
  // Attached, so the buttons are connected the way they are in a real pane.
  const navButtonsEl = document.body.createDiv();
  const addNavButton = vi.fn<HeaderDom['addNavButton']>((icon, title, callback, className) => {
    const buttonEl = navButtonsEl.createDiv({ attr: { 'aria-label': title, 'data-icon': icon } });
    if (className) {
      buttonEl.addClass(className);
    }
    buttonEl.addEventListener('click', ($event) => {
      callback($event);
    });
    return buttonEl;
  });
  const view = { headerDom: { addNavButton, navButtonsEl } };
  leaves.push(castTo<WorkspaceLeaf>({ view }));
  return { addNavButton, navButtonsEl, view };
}

function getButtons(view: FakeView): HTMLElement[] {
  return [...view.navButtonsEl.querySelectorAll<HTMLElement>(`.${RELOAD_BUTTON_CLASS_NAME}`)];
}

async function loadComponent(): Promise<FileExplorerReloadButtonComponent> {
  const app = castTo<App>({
    workspace: {
      getLeavesOfType: vi.fn((viewType: string) => viewType === ViewType.FileExplorer ? leaves : []),
      layoutReady: true,
      offref: vi.fn(),
      on: vi.fn((name: string, callback: () => void): EventRef => {
        if (name === 'layout-change') {
          layoutChangeListener = callback;
        }
        return castTo<EventRef>({});
      }),
      onLayoutReady: vi.fn((callback: () => void) => {
        callback();
      })
    }
  });
  const pluginSettingsComponent = castTo<PluginSettingsComponent>({
    offref: vi.fn(),
    on: vi.fn((name: string, callback: SettingsListener): AsyncEventRef => {
      settingsListeners.set(name, callback);
      return castTo<AsyncEventRef>({ asyncEventSource: { offref: vi.fn() } });
    }),
    get settings(): SettingsState {
      return settings;
    }
  });
  const component = new FileExplorerReloadButtonComponent({ app, onClick, pluginSettingsComponent });
  component.load();
  // The layout-ready callback runs on a 0 ms timer after onLayoutReady fires.
  await sleep({ milliseconds: 0 });
  return component;
}
