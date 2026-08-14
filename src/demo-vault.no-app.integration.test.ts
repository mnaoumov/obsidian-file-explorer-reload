import process from 'node:process';
import { registerDemoVaultCoverageSuite } from 'obsidian-dev-utils/script-utils/demo-vault-coverage';
import { getRootFolder } from 'obsidian-dev-utils/script-utils/root';

// Keeps the in-repo `demo-vault/` honest WITHOUT launching Obsidian. File Explorer Reload has no
// Settings and no public API interface — it rebuilds the File Explorer's file list and nothing else —
// So there is nothing to reflect from source and the suite is registered with `rootFolder` alone. What
// It still enforces is the authoring convention every vault owes its readers: an `# H1` and a prose
// Opener on every note, Markdown links rather than wikilinks (which do not render on GitHub), no
// `[Docs]` line, and every note reachable from `00 Start.md`. The plugin's runtime behavior is covered
// By the other tests.
registerDemoVaultCoverageSuite({ rootFolder: getRootFolder() ?? process.cwd() });
