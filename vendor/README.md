# Vendored Frontend Libraries

Lybris vendors the browser builds below so the site does not depend on runtime CDN access.

| Library | Version | License | Official source | Vendored files | Purpose |
| --- | --- | --- | --- | --- | --- |
| PDF.js | 5.7.284 | Apache-2.0 | https://github.com/mozilla/pdf.js | `pdfjs/pdf.mjs`, `pdfjs/pdf.worker.mjs`, `pdfjs/LICENSE` | Parse and render PDF pages to canvas in the preview modal. |
| markdown-it | 14.1.1 | MIT | https://github.com/markdown-it/markdown-it | `markdown-it/markdown-it.js`, `markdown-it/LICENSE` | Render Markdown text to HTML before sanitization. |
| DOMPurify | 3.4.5 | Apache-2.0 OR MPL-2.0 | https://github.com/cure53/DOMPurify | `dompurify/purify.min.js`, `dompurify/LICENSE`, `dompurify/LICENSE-MPL` | Sanitize rendered Markdown HTML before insertion into the page. |
| Viewer.js | 1.11.7 | MIT | https://github.com/fengyuanchen/viewerjs | `viewerjs/viewer.min.js`, `viewerjs/viewer.min.css`, `viewerjs/LICENSE` | Open image resources with zoom, move, rotate, keyboard, touch, and modal controls. |

Notes:

- PDF.js files were extracted from the official `pdfjs-5.7.284-dist.zip` release asset.
- `markdown-it/markdown-it.js` is the browser UMD build published by the official `markdown-it.github.io` repository and exposes `window.markdownit`.
- DOMPurify exposes `window.DOMPurify`.
- Viewer.js files were downloaded from the official `fengyuanchen/viewerjs` GitHub release tag `v1.11.7` and expose `window.Viewer`.
