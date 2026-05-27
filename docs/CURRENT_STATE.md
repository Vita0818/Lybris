# 当前状态

最近一次自查日期：2026-05-26

## 当前工作区状态摘要

启动自查时 `git status --short` 输出显示已有未提交改动：

```text
 M data/site-config.json
 M data/subject-config.json
 M index.html
 M readme.md
 M script.js
 M style.css
```

这些改动在本轮文档任务开始前已存在，本轮不回滚、不覆盖、不解释为 Codex 本轮业务改动。本轮只新增 `AGENTS.md` 和 `docs/` 下的上下文文档。

`git diff --stat` 在自查时显示上述 6 个文件合计约 666 行新增、614 行删除，主要集中在 `style.css` 和 `script.js`。

## 当前项目已实现能力

- 静态资料站页面骨架：`index.html` 提供侧栏、品牌区、搜索、目录树、主内容列表、面包屑和预览弹窗。
- 配置加载：`script.js` 从 `data/site-config.json` 和 `data/subject-config.json` 加载站点和学科配置，失败时使用内置 fallback。
- 资料索引加载：`script.js` 从 `data/drive-index.json` 加载资料树，并归一化为运行时节点。
- 目录浏览：支持文件夹树、面包屑、返回上一级、资料集卡片和资料卡片。
- 搜索：按节点 `title`、`category`、`updatedAt` 做简单包含匹配。
- 资料打开：文件卡片提供打开原文件链接。
- PDF 预览：优先用本地 PDF.js 渲染 fetchable PDF，Google Drive 文件可 fallback 到 Drive preview iframe。
- Markdown 预览：使用 markdown-it 渲染，并用 DOMPurify 清洗后插入页面。
- 图片预览：使用 Viewer.js 打开图片，支持多种图片扩展名和 `image/*` MIME。
- 外部索引同步：`.github/workflows/update-drive-index.yml` 可手动或按小时从 `DRIVE_INDEX_SOURCE_URL` 同步 `data/drive-index.json`。
- Drive 索引示例：`google-apps-script.js` 提供 `doGet()` 和递归扫描 Drive 文件夹的示例。
- 本地运行不依赖 CDN：PDF.js、markdown-it、DOMPurify、Viewer.js 均 vendored 在 `vendor/`。

## 当前未完成能力

- 未发现自动化单元测试、集成测试或 UI 测试。
- 未发现 `package.json`、构建脚本、lint/format 配置或依赖安装流程。
- 未发现 JSON schema 或校验脚本来约束 `data/*.json`。
- 前端没有直接扫描 Google Drive 的能力，依赖预生成的 `data/drive-index.json`。
- `google-apps-script.js` 示例只导出 PDF 文件；Markdown 和图片索引如何生成需要具体学科站自行扩展或确认。
- 未发现 GitHub Pages 的分支/目录配置文件；部署设置需要在 GitHub 仓库配置中确认。

## 当前已知 bug / 风险

- 工作区已有未提交改动，后续修改前必须保护这些改动。
- `pathKey` 基于节点标题路径生成，同一父级下重复标题可能造成 `nodeMap` 覆盖。
- `data/drive-index.json` 缺少 schema 校验，外部索引字段缺失或类型异常时只能依赖前端 fallback。
- 直接用浏览器打开本地 `index.html` 可能因 `fetch` 本地 JSON 失败而无法完整运行；应使用静态服务器。
- PDF、Markdown、图片预览依赖资源 URL 可被浏览器 fetch 或加载；Google Drive、跨域配置和文件权限会影响预览成功率。
- Actions 使用 `contents: write` 并直接 push `data/drive-index.json`，需要与仓库分支保护策略匹配。
- `google-apps-script.js` 中硬编码了 Drive 根文件夹 ID；是否应公开需要维护者确认，文档不复写该值。

## 当前优先级建议

1. 保护现有未提交改动，任何业务修改前先确认这些改动的意图和归属。
2. 为 `data/drive-index.json` 补充轻量 schema 或文档化字段契约。
3. 添加低成本静态检查流程，例如 JSON 格式检查、`script.js` 语法检查和手动 UI 验证清单。
4. 如果要支持真实 Markdown/图片资料同步，扩展索引生成脚本或明确外部索引生产方的字段规范。
5. 针对重复标题导致的 `pathKey` 冲突设计稳定 ID 或路径编码策略。

## 文档可信度说明

本轮文档基于以下实际文件自查：

- `index.html`
- `script.js`
- `style.css`
- `data/site-config.json`
- `data/subject-config.json`
- `data/drive-index.json`
- `.github/workflows/update-drive-index.yml`
- `google-apps-script.js`
- `readme.md`
- `MAINTENANCE.md`
- `TEMPLATE.md`
- `TEMPLATE_PROMPT.md`
- `vendor/README.md`

本轮未运行完整构建或测试，因为项目没有构建/测试脚本，且本任务限定为文档生成。

## 源码与旧文档冲突记录

- 本轮开始时不存在 `AGENTS.md` 或 `docs/` 下的旧上下文文档，因此没有旧上下文文档冲突。
- `readme.md` 说明前端支持 PDF、Markdown、图片预览；源码与该说明一致。
- 需要注意：`google-apps-script.js` 示例只同步 PDF，这与前端多类型预览能力不是直接冲突，但说明当前索引生成示例未覆盖全部前端能力。
