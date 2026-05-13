import { GlobalCommandHandler } from 'obsidian-dev-utils/obsidian/command-handlers/global-command-handler';

export interface ReloadFileExplorerCommandHandlerParams {
  readonly reloadFileExplorer: () => Promise<void>;
}

export class ReloadFileExplorerCommandHandler extends GlobalCommandHandler {
  private readonly reloadFileExplorer: () => Promise<void>;

  public constructor(params: ReloadFileExplorerCommandHandlerParams) {
    super({
      icon: 'refresh-ccw',
      id: 'reload-file-explorer',
      name: 'Reload file explorer'
    });
    this.reloadFileExplorer = params.reloadFileExplorer;
  }

  protected override async execute(): Promise<void> {
    await this.reloadFileExplorer();
  }
}
