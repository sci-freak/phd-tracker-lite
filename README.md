# PhD Tracker Lite

Lightweight PhD progress tracker — Windows + Android. Built with Tauri 2, Rust, and React.

**Made with Meta AI (Muse Spark)**

---

## Download

[![Download for Windows](https://img.shields.io/badge/Download_for-Windows-0078D6?style=for-the-badge&logo=windows&logoColor=white)](https://github.com/sci-freak/phd-tracker-lite/releases/latest/download/PhD-Tracker-Lite-Windows.msi)
[![Download for Android](https://img.shields.io/badge/Download_for-Android-3DDC84?style=for-the-badge&logo=android&logoColor=white)](https://github.com/sci-freak/phd-tracker-lite/releases/latest/download/PhD-Tracker-Lite-Android.apk)

[View all releases →](https://github.com/sci-freak/phd-tracker-lite/releases)

---

## Features
- Track experiments, papers, and milestones
- Works offline on Windows and Android
- Simple JSON storage — you own your data
- Sync across devices via Google Drive

## Sync Setup (2 minutes)
1. Install on Windows and Android
2. On both devices, the app uses: `Documents/phd-tracker-data.json`
3. Use Google Drive / OneDrive to sync your `Documents` folder
4. Changes on one device appear on the other automatically

> Your data never leaves your devices except through your own cloud sync.

## Install Notes
**Windows:** Run the MSI, accept the SmartScreen prompt (first release isn't code-signed by Microsoft yet).

**Android:** Allow "Install from unknown sources" once. APK is signed with v1+v2 signatures.

## Build from source
```bash
# Windows
pnpm tauri build

# Android
pnpm tauri android build --apk
