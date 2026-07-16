# Lybris 项目常驻上下文

## 外部依赖优先与禁止功能兜底（Vitemis 强制规则）

本项目继承 `/Users/vita/Vitemis/docs/DEPENDENCY_POLICY.md`。本节是强制约束，不是建议。

- 当用户指定、仓库已经采用，或经许可证、provenance、安全与平台审查可采用的外部依赖提供同等能力时，必须直接集成该依赖的官方 API 或官方扩展点。
- 不得自行重写同等能力，不得新增替代 adapter、shim、compatibility layer、wrapper、proxy、facade、协议翻译层、parallel backend、preview backend、shadow implementation 或“先兜底、以后再换”的实现。
- 本地代码只允许保留官方 API 必需的最薄生命周期、类型、权限、配置和 bundle 接线；不得重新实现、解释、扩展或替代依赖的核心能力。
- exact 依赖因版本、构建、签名、许可证、平台、安全或官方 API 限制无法接入时，必须停止该能力、明确失败、报告 blocker 并请求用户决定；不得静默降级、切换 legacy/另一 provider/backend、使用 cache/mock/简化路径或继续交付不完整替代实现。
- 现有 fallback、adapter 或重复实现不构成先例，后续不得扩展。安全 fail-closed 与明确要求的旧数据解码/迁移不是功能兜底，但必须保持最窄范围，不能演化成备用产品实现。
- 只有用户针对 exact 依赖、exact 范围和退出条件作出的新明文决定才能例外。

本文件继承 `/Users/vita/Vitemis/AGENTS.md` 中的 Vitemis 通用 Agent 规则。若本文件与通用规则冲突，在不违反系统和用户指令的前提下，以更具体、更严格的项目规则为准。

本文是 AI Agent 每轮进入本仓库时的入口文件。执行任何代码修改、配置修改、构建脚本修改或测试源码修改之前，必须先按顺序阅读并核对下列文档：

0. `/Users/vita/Vitemis/AGENTS.md`
1. `docs/CURRENT_STATE.md`
2. `docs/PROJECT_MAP.md`
3. `docs/ARCHITECTURE.md`
4. `docs/DO_NOT_BREAK.md`
5. `docs/TESTING.md`
6. `docs/NEXT_TARGET.md`（如果存在）

如果文档与源码、工程配置、测试或脚本冲突，必须以当前源码和配置为准，并在最终报告中明确指出冲突位置和采用源码为准的原因。

## 工作目录检查

每轮开始先在项目根目录执行：

```sh
pwd
git rev-parse --show-toplevel
git status --short
```

要求：

- `pwd` 与 `git rev-parse --show-toplevel` 必须指向同一个仓库根目录：`/Users/vita/Vitemis/Lybris`。
- 如果当前目录不是 Git root，停止修改，只报告路径问题。
- 读取 `git status --short` 后，先区分用户已有改动与本轮计划改动；不得覆盖、回退或清理用户已有改动。

## 修改边界

本仓库是纯静态资料站模板，核心文件包括 `index.html`、`style.css`、`script.js`、`data/*.json`、`vendor/`、`.github/workflows/update-drive-index.yml`。

未来常规任务可以按用户要求修改业务源码；但在只要求项目自查或文档更新的任务中，只允许修改：

- `AGENTS.md`
- `docs/` 下的项目说明文档

除非用户明确要求，不要修改：

- `index.html`、`style.css`、`script.js`
- `data/site-config.json`、`data/subject-config.json`、`data/drive-index.json`
- `vendor/`
- `google-apps-script.js`
- `.github/workflows/update-drive-index.yml`
- `assets/`

## 禁止事项

- 不执行破坏性 Git 操作：`git reset --hard`、`git clean -fd`、`git checkout .`、强制 push、删除用户未提交文件。
- 未经用户明文要求具体 Git 操作，不 add、不 commit、不 push、不创建 PR；编辑、整理、修复、验证或准备工作都不等于提交请求。
- 若用户要求提交，只提交当前 Git root 中与本任务相关的文件；不得递归进入、暂存、提交或推送子仓库、submodule、nested Git repo 或依赖 checkout。
- 不引入新依赖，不改构建脚本，不改测试源码，除非任务明确要求。
- 不把密钥、token、证书私钥、账号密码、真实 shared secret、私有 URL 或个人敏感信息写入仓库文档。
- 不绕过本地 vendored 前端库，随意改成运行时 CDN 依赖。
- 不在前端直接读取 GitHub Secret、Apps Script 私有配置或其他敏感凭据。
- 不只根据文件名猜测模块含义；不确定处标注 `UNKNOWN` 或 `需要后续确认`。
- 不破坏 `data/*.json` 字段契约、vendor 加载顺序、`sanitizeResourceUrl` 的 http/https-only 限制、DOMPurify + markdown-it `html:false` 净化、外链 `rel="noopener noreferrer"`。

## 项目理解要求

每轮涉及实现、修复或文档更新时，至少确认：

- 顶层目录结构和关键入口文件（浏览器入口 `index.html`；脚本入口 `script.js` 末尾 `init()`；样式入口 `style.css`；索引同步入口 `update-drive-index.yml`；Drive 索引脚本入口 `google-apps-script.js` 的 `doGet()`）。
- `script.js` 中配置加载（`loadConfigs()`/`fallbackSiteConfig`/`fallbackSubjectConfig`/`applyConfig()`）、资料索引归一化（`normalizeTree`/`inferNodeKind`/`buildVisibleRoot`/`buildRuntimeTree`）、目录渲染（`renderFolderTree`/`renderBreadcrumb`/`renderFolderView`/`renderLibrarySections`/`createCard`）、搜索（`searchTree`）、预览（`getPreviewKind`/`renderPdfPreview`/`renderMarkdownPreview`/`renderImagePreview`/`sanitizeResourceUrl`）的链路。
- `data/site-config.json`（`brandName`/`siteTitle`/`subtitle`/`description`/`avatarUrl`/`avatarAlt`/`driveFolderUrl`/`rootLabel`/`openAllLabel`/`searchPlaceholder` 等）、`data/subject-config.json`（`subjectId`/`subjectName`/`description`/`categories[]`/`decorativeChips`）、`data/drive-index.json`（节点 `title`/`type`/`url`/`category`/`updatedAt`/`children` + 可选预览字段 `rawUrl`..`path`）的字段约定。
- `vendor/` 中 PDF.js（`pdf.mjs`/`pdf.worker.mjs`）、markdown-it（`window.markdownit`）、DOMPurify（`window.DOMPurify`）、Viewer.js（`window.Viewer`）的运行时依赖关系与加载顺序（`markdown-it.js` → `purify.min.js` → `viewer.min.js` → `script.js`）。
- `.github/workflows/update-drive-index.yml` 与外部资料索引同步的边界（依赖 secret `DRIVE_INDEX_SOURCE_URL`，`contents: write` 直接 push）。
- 当前工作区是否已有未提交改动。

不确定的模块必须标注 `UNKNOWN` 或 `需要后续确认`，不要编造。

## 文档索引

- `docs/PROJECT_MAP.md`：目录地图、关键文件、入口、配置、资源和不确定项。
- `docs/ARCHITECTURE.md`：静态站架构、数据流、状态流、预览链路和安全边界。
- `docs/CURRENT_STATE.md`：当前真实状态、已实现能力、风险、优先级和文档可信度。
- `docs/TESTING.md`：环境要求、构建/测试/静态检查方式和手动验证矩阵。
- `docs/DO_NOT_BREAK.md`：数据格式、路径约定、安全机制和回归验证禁区。
- `docs/NEXT_TARGET.md`：临时下一目标记录；目标完成或不再有效后删除。

## 完成标准

完成任务前至少做到：

- 说明本轮实际阅读/检查过哪些源码、配置或测试。
- 只修改任务范围内文件。
- 保留用户已有改动。
- 运行与任务相称的检查；文档任务至少运行 `git diff --check` 与 `git status --short`。
- 将本轮已完成的持久性改动及时回写到相关项目文档；若无需更新文档，最终报告说明原因。
- 如未运行构建或测试，最终报告必须明确写"未运行构建/测试"。

## 最终报告格式

最终报告建议包含：

1. `MODEL_CHECK_RESULT`：当前模型名称；无法确认时写无法确认。
2. `PATH_CHECK_RESULT`：`pwd`、Git root、是否匹配预期。
3. `FILES_WRITTEN`：新增/修改文件。
4. `PROJECT_AUDIT_SUMMARY`：识别到的项目结构、主要模块和关键链路。
5. `DOCS_CONTENT_SUMMARY`：各文档内容摘要。
6. `VALIDATION_RESULT`：实际运行命令与结果。
7. `UNCERTAINTIES`：无法确认、需要人工确认的点。
8. `NEXT_RECOMMENDED_ACTION`：下一步建议；不要自动继续改业务源码。
