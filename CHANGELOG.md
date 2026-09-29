# CHANGELOG

## 1.3.17

- test(screenshots): merge the move onto applyObsidianTheme
- test(screenshots): merge the harness caret hiding in place of the local blur
- test(screenshots): merge the second desktop frame for the folder commands
- test(screenshots): merge the reproducible desktop frame
- chore(deps): merge the obsidian-integration-testing 17 and obsidian-dev-utils 107 float
- chore(deps): merge the obsidian-test-mocks 7 float
- fix(test): merge the headless demo-vault toolkit install
- fix(deps): restore the lockfile's missing resolved and integrity fields
- fix(deps): float devalue to 5.9.4, clearing GHSA-9rgm-9g3h-6x36
- build(markdownlint): forbid hard-wrapped markdown paragraphs
- chore(deps): drop the two dead dedupe overrides
- chore(deps): drop the dead markdown-it override
- chore(deps): drop the dead js-yaml override
- style(comments): stop capitalizing the middle of a wrapped comment
- docs: drop the rule-id citations from the pin table
- docs(changelog): name obsidian-dev-utils by its package name
- docs: replace the private tracker references with what they pointed at
- chore(deps): move to obsidian-dev-utils 103
- chore: adopt the npm run gate branch gate
- docs: say where the debug command is run
- test: bring the in-closure wait ceiling under the transport's per-eval cap
- docs: name the unversioned demo-vault asset and the folder it unzips into
- chore: make the LICENSE copyright line checkable by the linter and guard it against the year roll-over
- fix(deps): move to obsidian-integration-testing 12 and obsidian-dev-utils 101
- fix(build): wire build:compile to buildCompile and drop the duplicate leaf script

## 1.3.16

- chore(deps): sweep caret-ranged dependencies to latest
- fix(deps): move to obsidian-integration-testing 11 and obsidian-dev-utils 96.5.2
- fix(deps): drop the brace-expansion file: override that breaks a clean install
- docs: point plugin-directory links at community.obsidian.md

## 1.3.15

- docs(demo-vault): unwrap the notes so Obsidian stops rendering a break per line
- docs(readme): render the same in Obsidian's plugin page as on GitHub
- chore: update libs
- chore: update obsidian-dev-utils to 94.6.1
- chore: update obsidian-dev-utils to 94.6.0
- fix: override deepmerge-ts to clear GHSA-ggr8-5vv4-36mx
- test: gate the demo vault by clicking every code button
- chore: make the demo-vault button gate trustworthy (obsidian-dev-utils 94.4.1)

## 1.3.14

- chore: teach cspell the advisory wording
- chore: update libs
- test(demo-vault): click every demo button against a real Obsidian
- docs(demo-vault): give the demo vault its code buttons
- docs: capture the community-store screenshot set
- test(plugin): make the onload test await and assert real registrations

## 1.3.13

- test(demo-vault): register the demo-vault coverage suite
- docs: make the demo vault the documentation, in the standard layout

## 1.3.12

- chore: update libs and adopt obsidian-integration-testing 10

## 1.3.11

- chore: update libs
- chore: update libs
- chore(vitest): adopt the shared Obsidian plugin vitest configuration
- chore: update libs and clear the npm audit
- docs: fix the demo vault download instructions

## 1.3.10

- chore: update libs
- chore: update libs

## 1.3.9

- chore: update libs

## 1.3.8

- chore: update libs
- chore(demo-vault): drop committed Invocables placeholder
- fix(demo-vault): export invoke() from startup script; add Invocables folder

## 1.3.7

- docs: standardize demo-vault README
- docs: drop per-plugin demo-vault setup notes (bootstrap covered by the obsidian-dev-utils harness)
- docs(demo-vault): create the File Explorer Reload demo vault
- chore: update libs
- docs: update
- docs: migrate to AGENTS.md

## 1.3.6

- test: seed root-folder children on the live vault root
- chore: update libs
- chore: update obsidian-dev-utils to 85.0.0
- refactor: pass params objects to FileExplorerReloader
- build: lock typescript to 6.0.3
- test: wire integration-testing vitest-setup into integration projects
- chore: update libs
- chore: sort tsconfig types

## 1.3.5

- refactor: new template

## 1.3.4

- chore: update libs

## 1.3.3

- chore: update template

## 1.3.2

- chore: add attestation
- fix: manifest
- refactor: new template

## 1.3.1

- chore: update template

## 1.3.0

- refactor: commands

## 1.2.39

- chore: update libs

## 1.2.38

- chore: update libs

## 1.2.37

- chore: update libs

## 1.2.36

- chore: update libs
- chore: lint
- chore: enable markdownlint

## 1.2.35

- fix: build
- chore: update libs

## 1.2.34

- chore: enable conventional commits

## 1.2.33

- Minor changes

## 1.2.32

- Minor changes

## 1.2.31

- Minor changes

## 1.2.30

- Minor changes

## 1.2.29

- Minor changes

## 1.2.28

- Minor changes

## 1.2.27

- Minor changes

## 1.2.26

- Minor changes

## 1.2.25

- Minor changes

## 1.2.24

- Minor changes

## 1.2.23

- Minor changes

## 1.2.22

- Minor changes

## 1.2.21

- Minor changes

## 1.2.20

- Minor changes

## 1.2.19

- Minor changes

## 1.2.18

- Minor changes

## 1.2.17

- Minor changes

## 1.2.16

- New template

## 1.2.15

- Minor changes

## 1.2.14

- Update template

## 1.2.13

- Minor changes

## 1.2.12

- Minor changes

## 1.2.11

- Minor changes

## 1.2.10

- Minor changes

## 1.2.9

- Minor changes

## 1.2.8

- Minor changes

## 1.2.7

- Avoid default exports

## 1.2.6

- Minor changes

## 1.2.5

- Minor changes

## 1.2.4

- Minor changes

## 1.2.3

- Minor changes

## 1.2.2

- Minor changes

## 1.2.1

- Minor changes

## 1.2.0

- Switch to Desktop-only mode as we don't have access to fs module in mobile.
- Fail function if invoked not for the folder.

## 1.1.0

- Add menu items
- Open API

## 1.0.1

- Minor refactoring

## 1.0.0

- Initial release
