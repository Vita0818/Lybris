# 小站模板说明（可复用）

## 1) 适用场景
这个模板适合以下类型的轻量内容站点：

- 个人笔记站（按主题/课程分层管理文件）
- 课程资料站（讲义、作业、参考资料统一入口）
- PDF 文件导航站（以目录树方式浏览和打开 PDF）
- Google Drive 公开文件夹索引站（Drive 为存储源）
- GitHub Pages 静态小站（零后端部署、低维护成本）

---

## 2) 技术架构
模板采用“静态前端 + 外部文件索引”的组合：

- **GitHub Pages** 托管 `index.html + style.css + script.js`
- **Google Drive** 存储实际文件（PDF/资料）
- **Google Apps Script** 扫描 Drive 目录并输出 JSON
- **GitHub Actions** 定时拉取 JSON 并更新 `data/drive-index.json`
- **前端脚本** 读取 `data/drive-index.json`，渲染 Finder 风格浏览器

---

## 3) 文件结构说明
模板核心文件（及职责）如下：

- `index.html`：页面骨架（标题、头像、按钮、搜索、左右面板容器）
- `style.css`：Finder 风格视觉样式（布局、卡片、列表、标签等）
- `script.js`：数据加载、目录树渲染、导航、搜索、回退逻辑
- `assets/avatar.png`：头像资源
- `data/drive-index.json`：前端读取的目录索引数据
- `data/google-apps-script.js` **或** 根目录 `google-apps-script.js`：Drive 扫描脚本样例
- `.github/workflows/update-drive-index.yml`：定时/手动更新 `drive-index.json`

---

## 4) 数据流

```text
Google Drive
   ↓（扫描）
Google Apps Script 输出 JSON（Web App）
   ↓（定时/手动拉取）
GitHub Actions
   ↓（写入仓库）
data/drive-index.json
   ↓（前端 fetch）
网页渲染 Finder 风格文件浏览器
```

---

## 5) 页面功能清单
当前模板可抽象为以下通用模块：

- 顶部标题区（站点标题 + 副标题）
- 头像展示区
- “打开总文件夹”按钮（跳转 Drive 根目录）
- 搜索框（按关键字过滤）
- 返回上一级按钮
- 面包屑路径导航
- 左侧文件夹树（层级目录）
- 右侧当前文件夹内容（文件夹/文件）
- PDF 打开链接（新窗口打开）
- fallback 空目录机制（无内容时给出空状态而不报错）

---

## 6) 视觉风格特征
模板默认风格可总结为：

- macOS Finder 风格布局
- Apple 系默认字体栈
- 白色 / 浅灰背景基调
- 圆角卡片与轻阴影
- 浅蓝绿色公式浮动标签（用于气质强化）
- 文件行 / 文件卡片双形态展示

---

## 7) 迁移到新站点的复用步骤
1. 新建 GitHub 仓库并放入模板文件。
2. 替换站点标题与副标题（`index.html`）。
3. 替换头像资源（`assets/avatar.png`）。
4. 替换 Google Drive 根文件夹 ID / URL（前端配置与文案）。
5. 在 Google Apps Script 中部署新的 Drive 扫描 Web App。
6. 在 GitHub 仓库 Secrets 中设置 JSON 来源地址（如 `DRIVE_INDEX_SOURCE_URL`）。
7. 启用 GitHub Pages（通常从 `main`/`master` 分支根目录发布）。
8. 手动运行一次 workflow，确认 `data/drive-index.json` 成功更新。
9. 打开站点验证：目录树、搜索、PDF 链接均可用。

---

## 8) 复用边界建议
- 前端展示层可定制（文案、主题色、卡片样式）。
- 数据结构应保持稳定（避免随意改 `script.js` 依赖字段）。
- 自动同步链路（Apps Script + Actions）优先保持不变，降低维护风险。
