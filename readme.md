# Lybris 学科资料站模板

Lybris 是一个“课本知识上传与共享计划”的静态多学科资料站模板。这个仓库本身不是某一门具体课程或学科的资料站；默认配置只提供通用分类、模板说明和最小示例索引，方便复制到数学、物理、化学、医学、计算机、英语等不同学科场景中。

页面优先呈现品牌、搜索、分类入口、目录导航和资源卡片。Google Drive 可以作为资料源接入，但不是模板的默认主题。

当前界面采用极简资料库结构：左侧放置站点身份、搜索、分类 pills 和目录树；右侧展示面包屑、资料集卡片和资料卡片。文件夹渲染为 collection card，文件渲染为 resource card；只有文件显示预览和打开入口。

## 核心文件

- `index.html`：资料书架页面骨架，包含 AppShell、LibrarySidebar、LibraryHeader、LibraryMain 和预览弹窗容器。
- `style.css`：Lybris 资料书架视觉样式，包括浅雾背景、玻璃面板、collection/resource 卡片、响应式布局和预览样式。
- `script.js`：加载配置与 `data/drive-index.json`，渲染分类入口、目录树、资料集卡片、资料卡片、搜索、面包屑和资料预览。
- `data/site-config.json`：站点级配置，例如品牌、标题、资料源入口和 UI 文案。
- `data/subject-config.json`：学科级配置，例如学科名称、说明、分类和低权重装饰标签。
- `data/drive-index.json`：前端读取的资料索引缓存。模板默认是中性最小示例，可替换为空索引或真实资料索引。
- `vendor/`：本地 vendored 前端库，包括 PDF.js、markdown-it、DOMPurify 和 Viewer.js。页面运行时不依赖外网 CDN。
- `.github/workflows/update-drive-index.yml`：从外部 JSON 来源同步 `data/drive-index.json`。

## 默认状态

默认状态是中性的模板站：

- 站点标题为 `Lybris 学科资料站模板`。
- 学科名称为 `学科资料库`。
- 分类使用课程讲义、学习笔记、习题与真题、参考资料、拓展阅读等通用分类。
- `data/drive-index.json` 只包含一个通用“示例资料”文件夹和占位文件。
- `driveFolderUrl` 默认为空，资料源入口显示“资料源未配置”。

## 修改站点配置

编辑 `data/site-config.json`：

- `brandName`：站点品牌名，例如 `Lybris` 或你的资料站名称。
- `siteTitle`：浏览器标题。
- `subtitle`：页面顶部副标题。
- `ownerName`：站点维护者或资料所有者。
- `description`：页面 meta description 和站点说明。
- `avatarUrl` / `avatarAlt`：头像路径与替代文本。
- `driveFolderUrl`：资料源入口链接；可以是 Google Drive 根目录，也可以留空。
- `rootLabel`、`openAllLabel`、`searchPlaceholder` 等：通用 UI 文案。

## 修改学科配置

编辑 `data/subject-config.json`：

- `subjectId`：学科或资料站的稳定标识，例如 `physics-mechanics`。
- `subjectName`：页面展示的学科名称。
- `description`：学科说明。
- `categories`：资源分类元数据，会显示为搜索区下方的分类入口 pills。
- `decorativeChips`：保留的兼容字段，当前极简界面不渲染背景装饰标签。

## Drive 索引同步

前端不会直接扫描 Google Drive，而是读取仓库内的静态缓存：

```text
外部资料源
  -> JSON 索引
  -> GitHub Actions 读取 DRIVE_INDEX_SOURCE_URL
  -> 写入 data/drive-index.json
  -> script.js fetch 后渲染为 Lybris 资料书架
```

`DRIVE_INDEX_SOURCE_URL` 是 GitHub 仓库 Secret，值应为可返回资料索引 JSON 的地址。Actions 定时或手动运行后，会用该地址的结果覆盖 `data/drive-index.json`。

## 资料预览

Lybris 支持在页面内预览 PDF、Markdown 和图片资料。可预览资源会显示“预览”按钮，也可以点击资源卡片主体打开预览；原有“打开”链接仍会保留。

- PDF：使用本地 vendored 的 Mozilla PDF.js 渲染到 canvas。PDF.js worker 指向 `vendor/pdfjs/pdf.worker.mjs`。对于 Google Drive 文件，若无法直接 fetch PDF 二进制，会 fallback 到 `https://drive.google.com/file/d/<FILE_ID>/preview` iframe。
- Markdown：优先尝试 `rawUrl`、`downloadUrl`、`exportUrl`、`contentUrl` 等可 fetch 字段，也支持仓库内相对路径（例如 `docs/example.md`）。内容使用本地 vendored 的 markdown-it 渲染，并用 DOMPurify 清洗后再插入页面。
- 图片：使用本地 vendored 的 Viewer.js 打开单张图片资料，支持 Viewer.js 提供的缩放、移动、旋转、键盘和触摸操作，不依赖 CDN。识别常见扩展名 `.jpg`、`.jpeg`、`.png`、`.gif`、`.webp`、`.svg`、`.avif`，以及 `mimeType` / `mime` / `contentType` 以 `image/` 开头的资源。
- 图片 URL：预览会按 `rawUrl`、`downloadUrl`、`exportUrl`、`contentUrl`、`thumbnailUrl`、`url` 顺序尝试。对于 Google Drive 图片链接，会尽量提取 file id 并生成可显示的图片 URL；如果仍无法加载，会 fallback 到“打开原文件”。
- 无法预览时：弹窗会显示 fallback 文案，并提供“打开原文件”入口。

第三方库记录见 `vendor/README.md`。当前 vendored 库为 PDF.js 5.7.284（Apache-2.0）、markdown-it 14.1.1（MIT）、DOMPurify 3.4.5（Apache-2.0 OR MPL-2.0）和 Viewer.js 1.11.7（MIT）。PhotoSwipe 可作为未来多图 gallery 方案候选；当前单张图片预览只集成 Viewer.js。

## 创建具体学科站

复制模板到具体学科仓库后，至少需要替换：

1. `data/site-config.json` 中的标题、描述、资料源入口和按钮文案。
2. `data/subject-config.json` 中的学科标识、学科名称、说明、分类和装饰标签。
3. `data/drive-index.json` 或 `DRIVE_INDEX_SOURCE_URL` 指向的外部索引。
4. `assets/avatar.png`，如果需要使用学科或组织自己的头像。

### 创建数学分析站点示例

下面只是“如何配置某一学科”的示例，不是 Lybris 模板的默认身份：

- `subjectId`: `math-analysis`
- `subjectName`: `数学分析`
- `categories`: 可按课程讲义、课堂笔记、习题课、历年真题、参考资料组织。
- `driveFolderUrl`: 填入该学科资料源根目录。

其他学科也应按自己的资料结构配置，不需要继承这个示例。

## 本地测试

由于页面使用 `fetch` 读取本地 JSON，建议用本地静态服务器测试：

```bash
python3 -m http.server 8000
```

然后打开 `http://localhost:8000/`，确认页面标题、学科名、分类入口、资料列表、搜索、文件夹导航、资料源链接和可预览资料都能正常工作。
