# Codex 项目常驻上下文

本文件是未来 Codex 每轮进入本仓库时的入口说明。任何修改前必须先确认工作目录、阅读项目上下文文档，并以当前源码为最终事实来源。

## 必读顺序

未来 Codex 在任何修改前必须按顺序阅读：

1. `docs/CURRENT_STATE.md`
2. `docs/PROJECT_MAP.md`
3. `docs/ARCHITECTURE.md`
4. `docs/DO_NOT_BREAK.md`
5. `docs/TESTING.md`

如果上述文档与实际源码、配置、工作流或测试文件冲突，必须以源码为准，并在最终报告中明确指出冲突位置和处理方式。

## 工作目录检查要求

开始修改前必须在仓库根目录执行并检查：

```bash
pwd
git rev-parse --show-toplevel
git status --short
```

要求：

- `pwd` 必须与 `git rev-parse --show-toplevel` 指向同一个项目根目录。
- 如果当前目录不是 Git root，停止修改，只报告问题。
- 记录启动时 `git status --short` 输出；不要覆盖、回滚或删除用户已有未提交改动。

## 修改边界

- 先理解现有结构，再做最小必要修改。
- 修改范围必须服从用户本轮请求；没有明确要求时，不要顺手重构。
- 本仓库是静态前端资料站模板，核心文件包括 `index.html`、`style.css`、`script.js`、`data/*.json`、`vendor/`、`.github/workflows/update-drive-index.yml`。
- 只在确有必要时更新 `docs/` 和本文件，并保证文档继续反映真实源码。
- 不要把密钥、token、证书私钥、账号密码、真实 shared secret、私有 URL 或个人敏感信息写入仓库文档。

## 禁止事项

- 禁止执行破坏性 Git 操作，例如 `git reset --hard`、`git clean -fd`、`git checkout .`。
- 禁止强制 push。
- 禁止删除用户未提交文件。
- 禁止在用户未明确要求时 commit、push、创建 PR。
- 禁止绕过本地 vendored 前端库，随意改成运行时 CDN 依赖。
- 禁止在前端直接读取 GitHub Secret、Apps Script 私有配置或其他敏感凭据。
- 禁止只根据文件名猜测模块含义；不确定处标注 `UNKNOWN` 或 `需要后续确认`。

## 项目理解要求

每轮涉及实现、修复或文档更新时，至少确认：

- 顶层目录结构和关键入口文件。
- `script.js` 中配置加载、资料索引归一化、目录渲染、搜索、预览的链路。
- `data/site-config.json`、`data/subject-config.json`、`data/drive-index.json` 的字段约定。
- `vendor/` 中 PDF.js、markdown-it、DOMPurify、Viewer.js 的运行时依赖关系。
- `.github/workflows/update-drive-index.yml` 与外部资料索引同步的边界。
- 当前工作区是否已有未提交改动。

## 文档索引

- `docs/PROJECT_MAP.md`：目录地图、关键文件、入口、配置、资源和不确定项。
- `docs/ARCHITECTURE.md`：静态站架构、数据流、状态流、预览链路和安全边界。
- `docs/CURRENT_STATE.md`：当前真实状态、已实现能力、风险、优先级和文档可信度。
- `docs/TESTING.md`：环境要求、构建/测试/静态检查方式和手动验证矩阵。
- `docs/DO_NOT_BREAK.md`：数据格式、路径约定、安全机制和回归验证禁区。

## 完成标准

- 修改内容与用户请求一致，没有触碰无关业务源码。
- 启动时工作目录和 Git root 已核对。
- 已阅读必要文档并核对关键源码。
- 新增或修改的文档与当前源码一致；不确定项已明确标注。
- 已运行与任务相称的验证命令，并在最终报告中说明未运行的构建/测试。
- `git status --short` 中用户原有改动未被回滚或覆盖。

## 最终报告格式

最终报告建议包含：

1. `MODEL_CHECK_RESULT`：说明当前模型名称；无法确认则写无法确认。
2. `PATH_CHECK_RESULT`：列出 `pwd`、Git root、是否匹配项目根目录。
3. `FILES_CHANGED`：列出本轮新增或修改文件。
4. `WORK_SUMMARY`：概括实际完成内容。
5. `VALIDATION_RESULT`：列出运行过的检查命令及结果。
6. `UNCERTAINTIES`：列出无法确认或需要人工确认的部分。
7. `NEXT_RECOMMENDED_ACTION`：给出下一步建议，不自动继续修改业务源码。
