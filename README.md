> **⚠️ Fork Personalizzato**
>
> Questo è un fork personalizzato di [Docmost](https://github.com/docmost/docmost), deployato nel mio homelab come wiki e piattaforma di documentazione. Di seguito sono elencate le modifiche apportate rispetto al progetto originale.

---

<div align="center">
    <h1><b>Docmost</b></h1>
    <p>
        Open-source collaborative wiki and documentation software.
        <br />
        <a href="https://docmost.com"><strong>Website</strong></a> | 
        <a href="https://docmost.com/docs"><strong>Documentation</strong></a> |
        <a href="https://twitter.com/DocmostHQ"><strong>Twitter / X</strong></a>
    </p>
</div>
<br />

## Fork Key Changes

- **Collection Pages**: Introduced a new "Collection" page type for better organization in the sidebar, with real-time TOC reordering.
- **Page Locking System**: Improved lock UI (including a custom lock banner) and added hierarchical lock cascading from parent "collections".
- **Typography & Styling**: Changed global font to _Lora_, increased body text size, and adjusted list margins for a cleaner reading experience.
- **Enhanced Editor**: Allowed block nesting inside lists, customized `Shift-Enter` behavior, and removed persistent selection highlights in read-only mode.
- **UI Tweaks**: Added sidebar popups, refined page padding, and removed unused conversion options for a simpler interface.
- **Smart Block Conversion**: Added a universal `Turn Into` drag-handle menu to seamlessly convert between blocks (e.g., Quotes to Callouts) while preserving content.
- **Smart Backspace for Lists**: Intelligently merges text paragraphs or lifts complex blocks (like Callouts) out of lists when pressing backspace, without deleting the parent bullet.
- **Todo Enhancements**: Replaced strikethrough on checked to-dos with an elegant opacity reduction effect.
- **Footnotes Support**: Added a footnotes extension with click-to-scroll, interactive tooltips, and an inline bubble menu.
- **Heading Numbering**: Implemented automatic and progressive numbering for headings (H1, H2, H3) that can be easily toggled via the block menu.
- **Sticky Headings**: Implemented progressive and hierarchical sticky headings that elegantly stack while scrolling, toggleable via Account Preferences.
- **Math Block Fixes**: Improved the keyboard navigation in math blocks and inline math (e.g., proper Escape/Enter behavior and arrow key constraints).
- **CI/CD & Docker**: Fully optimized Dockerfile for caching and established a GitHub Actions workflow to build and push the Docker image automatically to GHCR.

---

## Getting started

To get started with Docmost, please refer to our [documentation](https://docmost.com/docs) or try our [cloud version](https://docmost.com/pricing) .

## Features

- Real-time collaboration
- Diagrams (Draw.io, Excalidraw and Mermaid)
- Spaces
- Permissions management
- Groups
- Comments
- Page history
- Search
- File attachments
- Embeds (Airtable, Loom, Miro and more)
- Translations (10+ languages)

### Screenshots

<p align="center">
<img alt="home" src="https://docmost.com/screenshots/home.png" width="70%">
<img alt="editor" src="https://docmost.com/screenshots/editor.png" width="70%">
</p>

### License

Docmost core is licensed under the open-source AGPL 3.0 license.  
Enterprise features are available under an enterprise license (Enterprise Edition).

All files in the following directories are licensed under the Docmost Enterprise license defined in `packages/ee/License`.

- apps/server/src/ee
- apps/client/src/ee
- packages/ee

### Contributing

See the [development documentation](https://docmost.com/docs/self-hosting/development)

## Thanks

Special thanks to;

<img width="100" alt="Crowdin" src="https://github.com/user-attachments/assets/a6c3d352-e41b-448d-b6cd-3fbca3109f07" />

[Crowdin](https://crowdin.com/) for providing access to their localization platform.

<img width="48" alt="Algolia-mark-square-white" src="https://github.com/user-attachments/assets/6ccad04a-9589-4965-b6a1-d5cb1f4f9e94" />

[Algolia](https://www.algolia.com/) for providing full-text search to the docs.

## 🔗 Progetti Correlati

- [Homelab Infrastructure](https://github.com/roberto-ingenito-home-lab/server-raspberry-pi) — Infrastruttura server e deployment Docker
