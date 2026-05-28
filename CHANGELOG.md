# Changelog

## v1.0.0 (2026-05-29)

### Breaking Changes
- Stable release — no breaking changes from v0.11.0

### Added
- WelcomePage component: action cards (Open Folder, New File, New Project), recent folders, keyboard shortcuts table, help links
- "Install Recommended Extensions" button in ExtensionsPanel
- Bundled extensions: c-support, cpp-support, debug-extension v2.0.0, sample-extension
- Windows dev scripts: `run.bat` (batch), `start-dev.ps1` (PowerShell)
- Windows path normalization in all IPC handlers
- Windows debug/verify checklist in AGENTS.md

### Changed
- Windows support promoted to stable (no longer beta)
- Version now read from `package.json` via Vite import (removed IPC race condition)
- README expanded with native Windows build and debug instructions

### Fixed
- Windows path normalization in fs, dialog, project, folder, file, terminal IPC handlers
- Drag & drop path normalization in ProjectExplorer
- Dynamic New Project placeholder for Windows paths
- Dynamic About version display
- UpdatePanel showing hardcoded version (now reads real version)

---

## v0.11.0 (2026-05-24)

### Added
- Windows cross-compilation support (portable .exe)
- Windows auto-update via `latest-windows.yml` channel
- GPU acceleration on master branch (Skylake GT2+)
- CI: Windows build job, cross-platform release workflow
- `electron-updater` configuration for Windows

### Changed
- Platform-agnostic paths: `app.getPath('userData')` instead of hardcoded `~/.config/vistudio`
- App name set to ViStudio for consistent data dir naming
- GPU acceleration enabled by default (no separate branch needed)
- `latest.yml` renamed to `latest-windows.yml` for Windows auto-update metadata

### Fixed
- Release job waits for both Linux and Windows build artifacts
- YAML syntax for auto-update metadata generation
- NSIS dependency removed (manual `latest-windows.yml` generation via openssl)

---

## v0.10.0 (2026-05-18)

### Added
- GitHub Actions CI/CD with auto-update support
- electron-builder for standalone executable packaging
- UpdatePanel with notification, download, cancel, install, startup toggle
- Wiki link in README, content migrated from Documentation.md

### Changed
- README style aligned with ViTools suite
- Silent asset replace on master push for CI

### Fixed
- CI: fallback to `pkg.version` if no release found
- CI: `latest-linux.yml` upload on tag push
- AppImage runtime deps documented (fuse2)

---

## v0.9.0 (2026-05-14)

Initial release. Features:
- Monaco Editor with syntax highlighting, bracket pair colorization, minimap
- Multi-tab editing with drag-and-drop reorder
- Integrated terminal (xterm.js with bash shell)
- File explorer with drag-and-drop
- Command palette (Ctrl+Shift+P) with fuzzy search
- Global search and replace (Ctrl+Shift+F) with regex support
- Sandboxed JavaScript extension system with rich API
- Extension themes with UI color customization
- Dark and light themes via CSS custom properties
- Settings panel with Apply/Cancel workflow
- Console panel with log interception and filtering
- Git integration (status, diff, commit)
- 133+ SVG file type icons
- Sidebar resize (150px–600px) and horizontal scroll
- Keyboard shortcuts for all major actions
- New Project modal with project templates
- Error boundary for crash recovery
- ThemeService dependency injection for extensions
- Font bundling (Inter UI + JetBrains Mono editor font)
