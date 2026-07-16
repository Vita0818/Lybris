# PROJECT_MAP

最近自查日期：2026-06-25

本文描述当前仓库结构。判断依据来自文件系统、`script.js`、`.github/workflows/`。

## 目录结构总览

```text
Lybris/
├── .github/workflows/update-drive-index.yml   每小时/手动索引同步
├── assets/                    avatar.png（经 avatarUrl 引用）
├── data/
│   ├── drive-index.json       运行时索引缓存（fetch cache:"no-store"）
│   ├── site-config.json       站点配置
│   └── subject-config.json    学科配置
├── docs/                      5 份项目文档
├── vendor/                    vendored 运行时库（无 CDN）
│   ├── README.md              版本/许可证记录
│   ├── dompurify/purify.min.js
│   ├── markdown-it/markdown-it.js
│   ├── pdfjs/{pdf.mjs,pdf.worker.mjs}
│   └── viewerjs/{viewer.min.js,viewer.min.css}
├── AGENTS.md                  入口协议
├── MAINTENANCE.md             维护手册（模板仓 vs 学科仓职责）
├── TEMPLATE.md                复用指南
├── TEMPLATE_PROMPT.md         构建学科站的 Codex prompt 模板
├── google-apps-script.js      Drive 索引脚本示例（doGet，仅 PDF）
├── index.html                 浏览器入口
├── readme.md                  用户文档
├── script.js                  应用逻辑（无框架，直接 DOM，入口 init()）
└── style.css                  样式入口
```

## 关键文件

- 浏览器入口：`index.html`
- 脚本入口：`script.js` 末尾 `init()`
- 样式入口：`style.css`
- 索引同步入口：`.github/workflows/update-drive-index.yml`
- Drive 索引脚本入口：`google-apps-script.js` `doGet()`

## 配置文件

- `data/site-config.json`：`brandName`/`siteTitle`/`subtitle`/`description`/`avatarUrl`/`avatarAlt`/`driveFolderUrl`/`rootLabel`/`openAllLabel`/`searchPlaceholder`/预览标题/loading/failure 文案
- `data/subject-config.json`：`subjectId`/`subjectName`/`description`/`categories[]`(id/name/description)/`decorativeChips`（不渲染但保留契约）
- `data/drive-index.json`：节点核心字段 `title`/`type`(folder|file)/`url`/`category`/`updatedAt`/`children` + 可选预览字段 `rawUrl`/`downloadUrl`/`exportUrl`/`contentUrl`/`thumbnailUrl`/`previewUrl`/`embedUrl`/`pdfUrl`/`markdownUrl`/`sourceUrl`/`filePath`/`path` + 可选类型字段 `mimeType`/`mime`/`contentType`/`sourceType`/`fileType`/`format`/`kind`
- 工作流依赖 secret `DRIVE_INDEX_SOURCE_URL`

## 生成物 / 产物

- `data/drive-index.json`（工作流写入）

## 不确定项

- Apps Script 是否会扩展支持 Markdown/图片索引。
- GitHub Pages 分支/目录配置需人工确认。
- drive-index 是模板样例，非真实数据。
