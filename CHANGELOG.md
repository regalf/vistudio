# Changelog

## v1.0.0 (2026-05-29)

Initial stable release.

### Added
- **WelcomePage**: action cards (Open Folder, New File, New Project), recent folders (persisted, max 10, clear all), keyboard shortcuts reference, help links
- **Bundled extensions**: c-support, cpp-support, debug-extension v2.0.0, sample-extension in `extensions/`
- **Install Recommended Extensions**: one-click button in ExtensionsPanel when no extensions installed (copies from bundled `extensions/` dir)
- **Windows dev scripts**: `run.bat` (batch), `start-dev.ps1` (PowerShell) — kill port 5173, start Vite + Electron
- **Windows path normalization**: `normalize()` function in all IPC handlers (fs, dialog, project, folder, file, terminal); `normalizePath()` in ProjectExplorer for drag & drop
- **Windows debug/verify checklist** in AGENTS.md (7 categories, 30+ check items)
- **Native Windows build & dev instructions** in README

### Changed
- **Windows support promoted to stable** — no longer beta/experimental (tested on real Windows)
- **GPU acceleration merged to master** — hardware acceleration enabled by default for Skylake GT2+; no separate branch needed
- **electron-updater channel**: Windows uses `latest-windows` channel (looks for `latest-windows.yml`)
- **Version source**: read from `package.json` via Vite import instead of IPC — eliminates async race condition on first render
- **Windows `latest.yml` renamed** to `latest-windows.yml`; generated manually via `openssl dgst -sha512` + `stat -c%s`
- **README restructured**: detailed Windows sections (requirements, build, debug), cross-platform comparison table
- **Wiki updated**: Windows promoted to stable, version bumped across all pages

### Fixed
- **Windows path normalization** in all IPC handlers (fs:readFile, fs:writeFile, fs:readDir, fs:stat, fs:exists, fs:move, dialog, project, folder, file, terminal)
- **Drag & drop on Windows**: paths normalized via `normalizePath()` in ProjectExplorer handleDrop
- **UpdatePanel version**: replaced hardcoded `v0.9.0` with real version from `app.getVersion()` via preload
- **New Project placeholder**: dynamically shows `C:\Users\...` on Windows vs `/home/...` on Linux
- **About dialog version**: reads real version from `package.json` via Vite import
- **CI: release job** now waits for both Linux AND Windows build artifacts before creating release
- **CI: GPU experiment branch logic** removed after merge, CI simplified to single workflow
- **CI: silent mode** — fallback to `pkg.version` when no release found; use `grep+sed` instead of `node` for version extraction
- **CI: `latest-linux.yml`** upload fixed for tag push releases
- **CI: `workflow_dispatch`** tag fallback fixed; `--field` used instead of `--inputs` flag
- **CI: `buildAll`** infinite loop fixed by passing `buildAll=false` when triggering other branch
- **Windows build**: NSIS installer removed (requires Wine on Linux); `latest-windows.yml` generated manually via `openssl` + `base64`
- **Windows build YAML**: heredoc replaced with `echo` to fix YAML syntax in metadata generation
- **AppImage docs**: added FUSE 2 runtime dependency

### Removed
- GPU experiment branch (`gpu-acceleration-test`) — merged to master
- NSIS installer target from CI (requires Wine)
- Hardcoded version strings replaced with dynamic reads

---

## v0.11.0 (2026-05-24)

### Added
- Windows cross-compilation support (portable .exe via electron-builder)
- Windows auto-update via `latest-windows.yml` channel
- CI: Windows build job, cross-platform release workflow
- `electron-updater` configuration for Windows (channel-based)

### Changed
- Platform-agnostic paths: `app.getPath('userData')` instead of hardcoded `~/.config/vistudio`
- App name set to ViStudio for consistent data dir naming across platforms
- `latest.yml` renamed to `latest-windows.yml` for Windows auto-update metadata

### Fixed
- `dist:win` target changed from NSIS to `dir` (portable) — no code signing needed
- Platform paths: removed hardcoded Linux paths (`~/.config/vistudio`)

---

## v0.10.0 (2026-05-18)

### Added
- GitHub Actions CI/CD with auto-update support
- electron-builder for standalone executable packaging (AppImage)
- UpdatePanel with notification, download, cancel, install, startup toggle
- 10s timeout on update checks with error event propagation
- Wiki link in README, content migrated from Documentation.md

### Changed
- README style aligned with ViTools suite
- Silent asset replace on master push for CI

### Fixed
- CI: fallback to `pkg.version` if no release found
- CI: `latest-linux.yml` upload on tag push
- Removed unused `node-pty` dependency, fixed CI native module rebuild
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
