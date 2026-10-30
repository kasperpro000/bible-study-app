# Berean — Offline Desktop Bible Study Workstation

A modern, high-performance, 100% offline Bible study workstation designed for **Linux** and **Windows**, featuring multi-translation parallel viewing, full-text search, cross-reference networks, interactive knowledge graphs, and personal study notes.

---

## 🌟 Key Features

* **100% Offline-First Architecture**: 
  * Powered by embedded **SQLite with FTS5** (Full-Text Search).
  * Zero external server calls or cloud telemetry.
* **Bilingual Workstation (English & Dutch / Nederlands)**:
  * Full UI localization and canonical book naming in English and Dutch (`Genesis` ↔ `Genesis`, `Revelation` ↔ `Openbaring`).
  * Bundled translations:
    * **English**: King James Version (KJV 1769)
    * **Nederlands**: Statenvertaling (SVV 1637/1888)
* **Parallel Scripture Reading**:
  * Side-by-side synchronized translation scrolling (e.g., KJV alongside Statenvertaling).
  * Typography customization: adjustable font sizing (14px–26px) and Serif/Sans-serif switching.
* **Treasury of Scripture Knowledge (TSK) Cross-References**:
  * **344,799 cross-references** indexed locally with relevance voting.
  * Contextual right-sidebar **Inspector** with one-click passage jumping.
* **Interactive Knowledge Graph**:
  * 2D force-directed WebGL/Canvas visualizer linking scriptures, biblical figures (Jesus, Abraham, Moses, David, Paul), theological themes (Creation, Faith, Grace, Covenant), and personal study notes.
  * Switch between passage-focused micro graphs and canonical macro graphs.
* **Study Toolkit**:
  * **Verse Highlighting**: 4-color palette (yellow, blue, green, rose) with instant toggling.
  * **Bookmarks**: Tagged verse bookmarks with quick navigation.
  * **Personal Study Notes**: Markdown editor with live preview, linked directly to scripture references.
  * **Reading Plans**: Pre-built plans (Gospels in 30 days, Wisdom in 60 days) with day-by-day progress tracking.
* **Instant Full-Text Search (FTS5)**:
  * Global search modal (`Ctrl+K`) with keyword highlighting and snippet generation.

---

## 🚀 Quick Start

### Prerequisites
* **Node.js**: v18+ (Tested on Node v24)
* **npm**: v9+

### 1. Development Mode
To start the application with hot module reloading:

```powershell
npm run dev
```

### 2. Production Build
To compile the TypeScript code, package the frontend, and compile the Electron main process:

```powershell
npm run build
```

To run the compiled production app:

```powershell
npx electron .
```

### 3. Database Re-seeding (Optional)
The offline database (`resources/bibles.db`, ~50MB) is pre-compiled and ready to use. If you wish to re-seed or regenerate it at any time:

```powershell
npm run seed
```

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| `Ctrl + K` | Open Instant Scripture Search Modal |
| `Ctrl + G` | Toggle Interactive Knowledge Graph |
| `Esc` | Close any active modal or drawer |
| `←` / `→` | Previous / Next Chapter navigation |

---

## 📂 Project Structure

```
bible-workstation/
├── electron/
│   ├── main.ts              # Electron process lifecycle & window manager
│   ├── preload.ts           # Secure IPC bridge exposing typed Bible API
│   └── db/
│       └── database.ts      # SQLite connection pool (bibles.db & userdata.db)
├── resources/
│   └── bibles.db            # 50MB compiled offline database (KJV, SVV, 344k TSK refs)
├── scripts/
│   └── seed-data.ts         # High-speed data seeding pipeline
├── src/
│   ├── App.tsx              # Workstation layout root & state manager
│   ├── components/
│   │   ├── TopBar.tsx       # Search trigger, parallel toggle, translation selectors, i18n
│   │   ├── Sidebar.tsx      # Books tree, bookmarks tab, and notes tab
│   │   ├── Reader/          # Synchronized parallel columns & verse items
│   │   ├── Inspector/       # Cross-references drawer & Markdown note editor
│   │   ├── Graph/           # Force-directed Canvas knowledge graph
│   │   ├── Search/          # Instant FTS5 search modal
│   │   └── ReadingPlan/     # Reading plans and daily progress tracker
│   ├── i18n/                # English & Dutch translation dictionaries
│   ├── types/               # TypeScript definitions
│   └── styles/              # Dark workstation Tailwind theme & custom scrollbars
```
