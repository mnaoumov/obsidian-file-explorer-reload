import {
    Menu,
    Plugin,
    TAbstractFile,
    TFolder,
} from "obsidian";

const ROOT_PATH = "/";

export default class FileExplorerReloadPlugin extends Plugin {
    public onload(): void {
        this.addCommand({
            id: "reload-file-explorer",
            name: "Reload File Explorer",
            callback: this.reloadFileExplorer.bind(this)
        });

        this.registerEvent(this.app.workspace.on("file-menu", this.handleFileMenu.bind(this)));
    }

    private async reloadFileExplorer(): Promise<void> {
        await this.reloadDirectory(ROOT_PATH, true);
    }

    private async reloadDirectory(directoryPath: string, isRecursive: boolean): Promise<void> {
        const isRoot = directoryPath === ROOT_PATH;
        const adapter = this.app.vault.adapter;
        console.debug(`Reloading directory ${directoryPath}`);
        await adapter.reconcileFolderCreation(directoryPath, directoryPath);
        const absolutePath = isRoot ? adapter.basePath : `${adapter.basePath}/${directoryPath}`;

        if (!adapter.fsPromises) {
            throw new Error("adapter.fsPromises is not initialized");
        }

        const existingFileItems = (await adapter.fsPromises.readdir(absolutePath, { withFileTypes: true }))
            .filter(f => !f.name.startsWith("."));
        const existingFileNames = new Set(existingFileItems.map(f => f.name));

        const dir = this.app.vault.getAbstractFileByPath(directoryPath) as TFolder;
        const obsidianFileNames = new Set(dir.children.map(child => child.name).filter(name => name));

        for (const fileName of existingFileNames) {
            if (!obsidianFileNames.has(fileName)) {
                const path = this.combinePath(directoryPath, fileName);
                console.debug(`Adding new file ${path}`);
                await adapter.reconcileFile(path, path, false);
            }
        }

        for (const fileName of obsidianFileNames) {
            if (!existingFileNames.has(fileName)) {
                const path = this.combinePath(directoryPath, fileName);
                console.debug(`Deleting inexistent ${path}`);
                await adapter.reconcileFile("", path, false);
            }
        }

        if (isRecursive) {
            for (const existingFileItem of existingFileItems) {
                if (existingFileItem.isDirectory()) {
                    const path = this.combinePath(directoryPath, existingFileItem.name);
                    await this.reloadDirectory(path, true);
                }
            }
        }
    }

    private combinePath(directoryPath: string, fileName: string): string {
        const isRoot = directoryPath === ROOT_PATH;
        return isRoot ? fileName : `${directoryPath}/${fileName}`;
    }

    private handleFileMenu(menu: Menu, file: TAbstractFile) {
        if (!(file instanceof TFolder)) {
            return;
        }

        menu.addItem((item) => {
            item
                .setTitle("Reload Folder")
                .setIcon("folder-sync")
                .onClick(() => this.reloadDirectory(file.path, false));
        });

        menu.addItem((item) => {
            item
                .setTitle("Reload Folder with Subfolders")
                .setIcon("folder-sync")
                .onClick(() => this.reloadDirectory(file.path, true));
        });
    }
}
