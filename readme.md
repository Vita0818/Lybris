# Lybris 学科站模板

Lybris 是一个“课本知识上传与共享计划”的静态学科资料站模板。当前仓库仍保留原数学分析/微积分资料作为示例数据，但站点标题、学科信息、说明文字、按钮文案和分类元数据已经抽到配置文件中，方便复用于其他学科。

## 核心文件

- `index.html`：页面骨架，尽量只保留容器和默认占位。
- `script.js`：加载配置与 `data/drive-index.json`，渲染目录树、资料列表、搜索和面包屑。
- `data/site-config.json`：站点级配置。
- `data/subject-config.json`：学科级配置。
- `data/drive-index.json`：Google Drive 目录索引缓存，由前端读取。
- `.github/workflows/update-drive-index.yml`：从外部 JSON 来源同步 `data/drive-index.json`。

## 修改站点配置

编辑 `data/site-config.json`：

- `brandName`：站点品牌名，例如 `Lybris`。
- `siteTitle`：浏览器标题。
- `subtitle`：页面顶部副标题。
- `ownerName`：站点维护者或资料所有者。
- `description`：页面 meta description。
- `avatarUrl` / `avatarAlt`：头像路径与替代文本。
- `driveFolderUrl`：顶部“打开全部资料文件夹”按钮指向的 Google Drive 根目录。
- `rootLabel`、`openAllLabel`、`searchPlaceholder` 等：通用 UI 文案。

## 修改学科配置

编辑 `data/subject-config.json`：

- `subjectId`：学科或资料站的稳定标识，例如 `physics-mechanics`。
- `subjectName`：页面展示的学科名称。
- `description`：学科说明。
- `categories`：资源分类元数据，可按课程笔记、真题、参考资料等方式组织。
- `decorativeChips`：当前旧 UI 的浮动标签文案；未来重设计时可以删除或替换。

## Drive 索引同步

前端不会直接扫描 Google Drive，而是读取仓库内的静态缓存：

```text
Google Drive
  -> Google Apps Script 输出 JSON
  -> GitHub Actions 读取 DRIVE_INDEX_SOURCE_URL
  -> 写入 data/drive-index.json
  -> script.js fetch 后渲染页面
```

`DRIVE_INDEX_SOURCE_URL` 是 GitHub 仓库 Secret，值应为 Google Apps Script Web App 的 JSON 输出地址。Actions 定时或手动运行后，会用该地址的结果覆盖 `data/drive-index.json`。

## 本地测试

由于页面使用 `fetch` 读取本地 JSON，建议用本地静态服务器测试：

```bash
python3 -m http.server 8000
```

然后打开 `http://localhost:8000/`，确认页面标题、学科名、资料列表、搜索、文件夹导航和 Google Drive 链接都能正常工作。
