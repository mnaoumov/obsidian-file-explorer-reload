import type { FileExplorerView } from '@obsidian-typings/obsidian-public-latest';
import type { App } from 'obsidian';

import { registerAsyncEvent } from '@mnaoumov/obsidian-lib/components/async-events-component';
import { ComponentEx } from '@mnaoumov/obsidian-lib/components/component-ex';
import { CallbackLayoutReadyComponent } from '@mnaoumov/obsidian-lib/components/layout-ready-component';
import { castTo } from '@mnaoumov/typescript-lib/object-utils';
import { ViewType } from '@obsidian-typings/obsidian-public-latest/implementations';

import type { PluginSettingsComponent } from './plugin-settings-component.ts';

const RELOAD_BUTTON_CLASS_NAME = 'file-explorer-reload-button';
const RELOAD_BUTTON_ICON = 'refresh-ccw';
const RELOAD_BUTTON_TITLE = 'Reload file explorer';

interface FileExplorerReloadButtonComponentConstructorParams {
  readonly app: App;
  readonly onClick: (this: void) => void;
  readonly pluginSettingsComponent: PluginSettingsComponent;
}

/**
 * Puts a `Reload file explorer` button into the nav header of every File Explorer pane, beside Obsidian's own buttons,
 * so the reload sits where the stale list is.
 *
 * A File Explorer pane can appear after the layout is ready (it is opened again after being closed, or a second one is
 * opened), so the buttons are synced at layout ready and on every `layout-change`. The `Show reload button` setting
 * adds or removes them at once, and unloading the plugin removes them.
 */
export class FileExplorerReloadButtonComponent extends ComponentEx {
  private readonly app: App;
  private readonly buttonEls = new Set<HTMLElement>();
  private readonly onClick: () => void;
  private readonly pluginSettingsComponent: PluginSettingsComponent;

  public constructor(params: FileExplorerReloadButtonComponentConstructorParams) {
    super();
    this.app = params.app;
    this.onClick = params.onClick;
    this.pluginSettingsComponent = params.pluginSettingsComponent;
  }

  public override onload(): void {
    super.onload();
    this.addChild(new CallbackLayoutReadyComponent(this.app, this.syncButtons.bind(this)));
    this.registerEvent(this.app.workspace.on('layout-change', this.syncButtons.bind(this)));
    registerAsyncEvent(this, this.pluginSettingsComponent.on('saveSettings', this.syncButtons.bind(this)));
    registerAsyncEvent(this, this.pluginSettingsComponent.on('loadSettings', this.syncButtons.bind(this)));
  }

  public override onunload(): void {
    super.onunload();
    this.removeButtons();
  }

  private addButton(view: FileExplorerView): void {
    const navButtonsEl = view.headerDom.navButtonsEl;
    if (navButtonsEl.querySelector(`.${RELOAD_BUTTON_CLASS_NAME}`)) {
      return;
    }

    const buttonEl = view.headerDom.addNavButton(RELOAD_BUTTON_ICON, RELOAD_BUTTON_TITLE, () => {
      this.onClick();
    }, RELOAD_BUTTON_CLASS_NAME);
    this.buttonEls.add(buttonEl);
  }

  private getFileExplorerViews(): FileExplorerView[] {
    const views: FileExplorerView[] = [];
    for (const leaf of this.app.workspace.getLeavesOfType(ViewType.FileExplorer)) {
      // A deferred leaf holds a placeholder view with no header until it is first shown.
      if (!('headerDom' in leaf.view)) {
        continue;
      }

      views.push(castTo<FileExplorerView>(leaf.view));
    }

    return views;
  }

  private removeButtons(): void {
    for (const buttonEl of this.buttonEls) {
      buttonEl.remove();
    }

    this.buttonEls.clear();
  }

  private syncButtons(): void {
    if (!this.pluginSettingsComponent.settings.shouldShowReloadButton) {
      this.removeButtons();
      return;
    }

    for (const buttonEl of this.buttonEls) {
      if (!buttonEl.isConnected) {
        this.buttonEls.delete(buttonEl);
      }
    }

    for (const view of this.getFileExplorerViews()) {
      this.addButton(view);
    }
  }
}
