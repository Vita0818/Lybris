# 通用建站 Prompt（给 Codex）

> 用法：复制本文件全部内容，替换变量后发送给 Codex。

---

你现在要在 **正确仓库** 中搭建一个可部署到 GitHub Pages 的静态资料站。

## 变量（请先替换）
- `{{SITE_TITLE}}`
- `{{SITE_SUBTITLE}}`
- `{{GITHUB_REPO}}`
- `{{GOOGLE_DRIVE_FOLDER_URL}}`
- `{{GOOGLE_DRIVE_FOLDER_ID}}`
- `{{AVATAR_PATH}}`
- `{{PRIMARY_THEME}}`
- `{{FOOTER_TEXT}}`

---

## 1. 环境检查规则（必须先执行）
先执行并展示输出：

```bash
pwd
git status
git branch --show-current
ls -la
find . -maxdepth 3 -type f
```

如仓库路径、远程仓库名、关键文件与任务描述不一致，立即停止并提示，不要继续写入。

---

## 2. 防止在错误仓库创建文件
- 必须核对当前仓库为：`{{GITHUB_REPO}}`。
- 如果不是，停止并说明“当前目录不是目标仓库”。
- 未确认仓库前，不得创建或修改任何文件。

---

## 3. 站点目标
构建一个：
- 基于 GitHub Pages 的静态小站；
- 数据源来自 Google Drive 公开目录；
- 前端展示为 Finder 风格文件浏览器；
- 用户可浏览目录、搜索、并点击打开 PDF。

---

## 4. 技术要求
- 纯静态前端：`index.html` + `style.css` + `script.js`
- 数据文件：`data/drive-index.json`
- 不引入数据库或自建后端
- 允许使用 Google Apps Script + GitHub Actions 完成自动同步

---

## 5. 视觉要求
- 整体风格：macOS Finder 风格
- 主色调：`{{PRIMARY_THEME}}`
- 包含：顶部标题区、头像、搜索、面包屑、左右分栏
- 支持桌面端优先并兼容移动端
- 底部文案使用：`{{FOOTER_TEXT}}`

---

## 6. 文件结构要求
至少包含：

- `index.html`
- `style.css`
- `script.js`
- `assets/avatar.png`（使用 `{{AVATAR_PATH}}` 资源）
- `data/drive-index.json`
- `google-apps-script.js`（或 `data/google-apps-script.js`）
- `.github/workflows/update-drive-index.yml`
- `README.md`（部署和使用说明）

---

## 7. Google Drive 自动同步要求
- 目标根目录：`{{GOOGLE_DRIVE_FOLDER_URL}}`
- 根文件夹 ID：`{{GOOGLE_DRIVE_FOLDER_ID}}`
- 通过 Apps Script 扫描层级并输出 JSON
- JSON 字段要与前端渲染逻辑严格匹配
- 不允许手写虚构目录数据冒充真实同步

---

## 8. GitHub Actions 要求
- workflow 名称建议：`Update Drive Index`
- 支持 `workflow_dispatch`（手动触发）
- 可选 `schedule`（定时触发）
- 从 `DRIVE_INDEX_SOURCE_URL` 拉取 JSON 覆盖 `data/drive-index.json`
- 若有变更则自动提交（bot commit）

---

## 9. Apps Script 要求
- 提供完整 `doGet()` 输出 JSON
- 可递归读取子文件夹与文件
- 输出字段包括：名称、类型、链接、子节点
- 部署为 Web App（Anyone 可访问，按需设置）
- 在文档中写明重新部署步骤

---

## 10. Finder 文件浏览器要求（前端）
- 左侧：可折叠文件夹树
- 右侧：当前目录内容
- 顶部：标题 `{{SITE_TITLE}}`、副标题 `{{SITE_SUBTITLE}}`、头像
- 功能：搜索、返回上一级、面包屑导航
- 文件点击：PDF 新标签页打开
- 空目录：显示友好 fallback 提示

---

## 11. 数据真实性限制
- 不允许编造示例文件夹或假 PDF。
- 如暂无真实数据，允许保留空结构并明确标注“待同步”。
- 任何演示数据必须标识来源与用途。

---

## 12. PR 规范
完成后：
1. 运行必要检查（至少页面文件与 workflow 语法检查）。
2. 提交 commit（信息清晰、可追踪）。
3. 创建 PR，标题建议：
   - `feat: bootstrap {{SITE_TITLE}} drive-index site`
4. PR 描述包含：
   - 改动清单
   - 同步链路说明
   - 手动验证步骤
   - 风险点与回滚方式

---

## 13. 后续维护方式
- 日常只需往 Google Drive 上传/整理文件。
- 通过 GitHub Actions 手动或定时同步索引。
- 页面样式改 `style.css`，数据逻辑改 `script.js`。
- 非必要不要改 `data/drive-index.json` 与 workflow 机制。
- 每次让 Codex 修改前，都先执行“环境检查规则”。

---

请严格按照以上要求执行，并在最终回复中给出：
- 修改文件列表
- 核心实现说明
- 手动验证结果
- 后续维护建议
