const SITE_CONFIG_PATH = "data/site-config.json";
const SUBJECT_CONFIG_PATH = "data/subject-config.json";
const DRIVE_INDEX_PATH = "data/drive-index.json";

const fallbackSiteConfig = {
  brandName: "Lybris",
  siteTitle: "Lybris 学科资料站",
  subtitle: "课本知识上传与共享计划",
  ownerName: "",
  description: "Lybris 学科资料站模板，资料托管于 Google Drive，并通过静态索引展示。",
  avatarUrl: "assets/avatar.png",
  avatarAlt: "站点头像",
  driveFolderUrl: "",
  rootLabel: "全部资料",
  openAllLabel: "打开全部资料文件夹",
  searchPlaceholder: "搜索文件夹或 PDF...",
  backLabel: "返回上一级",
  sidebarTitle: "文件夹",
  openLabel: "打开",
  enterLabel: "进入",
  folderTypeLabel: "文件夹",
  fileTypeLabel: "PDF",
  emptyRootMessage: "目录尚未同步。请先运行 GitHub Actions 更新 Google Drive 目录。",
  emptyFolderMessage: "该文件夹为空。",
  noResultsMessage: "没有匹配结果。"
};

const fallbackSubjectConfig = {
  subjectId: "general",
  subjectName: "学科资料",
  description: "可替换为任意学科的资料站。",
  categories: [],
  decorativeChips: []
};

let siteConfig = { ...fallbackSiteConfig };
let subjectConfig = { ...fallbackSubjectConfig };
let rootTree = createFallbackTree();
let currentFolder = rootTree;
let currentPath = [rootTree];
let activeSearch = "";
let nodeMap = new Map();

const searchInput = document.getElementById("searchInput");
const backBtn = document.getElementById("backBtn");
const breadcrumb = document.getElementById("breadcrumb");
const folderTree = document.getElementById("folderTree");
const contentList = document.getElementById("contentList");
const viewTitle = document.getElementById("viewTitle");
const resultCount = document.getElementById("resultCount");
const openAllBtn = document.getElementById("openAllBtn");
const brandName = document.getElementById("brandName");
const subjectName = document.getElementById("subjectName");
const siteSubtitle = document.getElementById("siteSubtitle");
const siteAvatar = document.getElementById("siteAvatar");
const sidebarTitle = document.getElementById("sidebarTitle");
const decorativeChips = document.getElementById("decorativeChips");

function mergeConfig(fallback, loaded) {
  if (!loaded || typeof loaded !== "object" || Array.isArray(loaded)) {
    return { ...fallback };
  }
  return { ...fallback, ...loaded };
}

async function loadJson(path) {
  const res = await fetch(path, { cache: "no-store" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function loadConfigs() {
  const [siteResult, subjectResult] = await Promise.allSettled([
    loadJson(SITE_CONFIG_PATH),
    loadJson(SUBJECT_CONFIG_PATH)
  ]);

  if (siteResult.status === "fulfilled") {
    siteConfig = mergeConfig(fallbackSiteConfig, siteResult.value);
  } else {
    console.warn("读取 site-config.json 失败，使用站点 fallback", siteResult.reason);
    siteConfig = { ...fallbackSiteConfig };
  }

  if (subjectResult.status === "fulfilled") {
    subjectConfig = mergeConfig(fallbackSubjectConfig, subjectResult.value);
  } else {
    console.warn("读取 subject-config.json 失败，使用学科 fallback", subjectResult.reason);
    subjectConfig = { ...fallbackSubjectConfig };
  }
}

function applyConfig() {
  const pageTitle = siteConfig.siteTitle || `${siteConfig.brandName} ${subjectConfig.subjectName}`;
  document.title = pageTitle;

  const descriptionMeta = document.querySelector('meta[name="description"]');
  if (descriptionMeta) {
    descriptionMeta.setAttribute("content", siteConfig.description || subjectConfig.description || "");
  }

  brandName.textContent = siteConfig.brandName || fallbackSiteConfig.brandName;
  subjectName.textContent = subjectConfig.subjectName || fallbackSubjectConfig.subjectName;
  siteSubtitle.textContent = siteConfig.subtitle || subjectConfig.description || "";
  siteAvatar.src = siteConfig.avatarUrl || fallbackSiteConfig.avatarUrl;
  siteAvatar.alt = siteConfig.avatarAlt || `${siteConfig.brandName || fallbackSiteConfig.brandName} 头像`;
  openAllBtn.textContent = siteConfig.openAllLabel || fallbackSiteConfig.openAllLabel;
  openAllBtn.href = siteConfig.driveFolderUrl || "#";
  searchInput.placeholder = siteConfig.searchPlaceholder || fallbackSiteConfig.searchPlaceholder;
  backBtn.textContent = siteConfig.backLabel || fallbackSiteConfig.backLabel;
  sidebarTitle.textContent = siteConfig.sidebarTitle || fallbackSiteConfig.sidebarTitle;
  viewTitle.textContent = getRootLabel();
  renderDecorativeChips();
}

function renderDecorativeChips() {
  decorativeChips.innerHTML = "";
  const chips = Array.isArray(subjectConfig.decorativeChips) ? subjectConfig.decorativeChips : [];
  decorativeChips.hidden = chips.length === 0;

  chips.forEach((chip, index) => {
    const chipText = typeof chip === "string" ? chip : chip?.text;
    if (!chipText) return;

    const tone = typeof chip === "object" && chip?.tone ? chip.tone : index % 2 === 0 ? "blue" : "green";
    const item = document.createElement("span");
    item.className = `chip chip-${tone}`;
    item.textContent = chipText;
    decorativeChips.appendChild(item);
  });
}

function getRootLabel() {
  return siteConfig.rootLabel || fallbackSiteConfig.rootLabel;
}

function getConfiguredDriveFolderUrl() {
  return siteConfig.driveFolderUrl || "#";
}

function createFallbackTree() {
  return {
    title: getRootLabel(),
    type: "folder",
    url: getConfiguredDriveFolderUrl(),
    updatedAt: "",
    children: []
  };
}

function safeNode(node) {
  const title = node?.title || "未命名";
  const type = node?.type === "file" ? "file" : "folder";
  const children = type === "folder" ? (Array.isArray(node?.children) ? node.children : []) : undefined;
  return { title, type, url: node?.url || getConfiguredDriveFolderUrl(), updatedAt: node?.updatedAt || "-", children };
}

function normalizeTree(node) {
  const normalized = safeNode(node);
  if (normalized.type === "file") return normalized;

  normalized.children = (normalized.children || [])
    .map((child) => normalizeTree(child))
    .filter(Boolean);
  return normalized;
}

function buildVisibleRoot(rawRoot) {
  const normalizedRoot = normalizeTree(rawRoot);
  if (!normalizedRoot) return safeNode(createFallbackTree());
  return {
    title: getRootLabel(),
    type: "folder",
    url: normalizedRoot.url || getConfiguredDriveFolderUrl(),
    updatedAt: normalizedRoot.updatedAt || "",
    children: normalizedRoot.children || []
  };
}

function buildRuntimeTree(node, parent = null, parentPath = [], parentPathKey = "") {
  const nextPath = [...parentPath, node.title];
  const nextPathKey = parent ? `${parentPathKey}/${node.title}` : "";

  node.parent = parent;
  node.path = nextPath;
  node.pathKey = nextPathKey;
  node.depth = parent ? parent.depth + 1 : 0;

  nodeMap.set(node.pathKey, node);

  if (node.type === "folder") {
    node.children = (node.children || []).map((child) => buildRuntimeTree(child, node, nextPath, nextPathKey));
  }

  return node;
}

function buildPathFromNode(node) {
  const path = [];
  let cursor = node;
  while (cursor) {
    path.unshift(cursor);
    cursor = cursor.parent || null;
  }
  return path;
}

function listFolders(node, acc = []) {
  acc.push(node);
  (node.children || []).forEach((child) => {
    if (child.type === "folder") listFolders(child, acc);
  });
  return acc;
}

function setCurrentFolderByPathKey(pathKey) {
  const target = nodeMap.get(pathKey);
  if (!target || target.type !== "folder") return;
  currentFolder = target;
  currentPath = buildPathFromNode(target);
  render();
}

function renderFolderTree() {
  folderTree.innerHTML = "";
  const folders = listFolders(rootTree);
  folders.forEach((node) => {
    const item = document.createElement("div");
    item.className = "tree-item";
    item.style.paddingLeft = `${node.depth * 14 + 6}px`;
    item.textContent = `📁 ${node.title}`;
    if (node.pathKey === currentFolder.pathKey) item.classList.add("active");
    item.addEventListener("click", () => setCurrentFolderByPathKey(node.pathKey));
    folderTree.appendChild(item);
  });
}

function renderBreadcrumb() {
  breadcrumb.innerHTML = "";
  currentPath.forEach((node, idx) => {
    if (idx > 0) breadcrumb.append(" / ");
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = idx === 0 ? getRootLabel() : node.title;
    button.addEventListener("click", () => setCurrentFolderByPathKey(node.pathKey));
    breadcrumb.appendChild(button);
  });
}

function sortChildren(children) {
  return [...children].sort((a, b) => {
    if (a.type !== b.type) return a.type === "folder" ? -1 : 1;
    return a.title.localeCompare(b.title, "zh-Hans-CN");
  });
}

function renderFolderView() {
  viewTitle.textContent = currentFolder === rootTree ? getRootLabel() : currentFolder.title;

  const folderChildren = currentFolder.children || [];
  resultCount.textContent = `共 ${folderChildren.length} 项`;

  contentList.innerHTML = "";
  if (folderChildren.length === 0) {
    const emptyMessage =
      currentFolder === rootTree
        ? siteConfig.emptyRootMessage || fallbackSiteConfig.emptyRootMessage
        : siteConfig.emptyFolderMessage || fallbackSiteConfig.emptyFolderMessage;
    contentList.innerHTML = `<div class="empty-message muted">${emptyMessage}</div>`;
    return;
  }

  const children = sortChildren(folderChildren);
  children.forEach((item) => {
    const action = document.createElement("a");
    action.className = "btn ghost";
    action.href = item.url || getConfiguredDriveFolderUrl();
    action.target = "_blank";
    action.rel = "noopener noreferrer";
    action.textContent = siteConfig.openLabel || fallbackSiteConfig.openLabel;

    const metaText = formatMeta(item);
    contentList.appendChild(createCard(item, metaText, action));
  });
}

function formatMeta(item, fallbackPath = "") {
  const typeLabel =
    item.type === "folder"
      ? siteConfig.folderTypeLabel || fallbackSiteConfig.folderTypeLabel
      : siteConfig.fileTypeLabel || fallbackSiteConfig.fileTypeLabel;
  const timeLabel = item.updatedAt || fallbackPath || "-";
  return `${typeLabel} · ${timeLabel}`;
}

function createCard(item, metaText, actionNode) {
  const card = document.createElement("div");
  card.className = "file-card";

  const main = document.createElement("div");
  main.className = "file-main";

  const title = document.createElement(item.type === "folder" ? "button" : "div");
  title.className = item.type === "folder" ? "file-title name-btn" : "file-title";
  title.textContent = `${item.type === "folder" ? "📁" : "📄"} ${item.title}`;
  if (item.type === "folder") {
    title.type = "button";
    title.addEventListener("click", () => setCurrentFolderByPathKey(item.pathKey));
  }

  const meta = document.createElement("div");
  meta.className = "file-meta";
  meta.textContent = metaText;

  main.append(title, meta);
  card.append(main, actionNode);
  return card;
}

function searchTree(keyword) {
  const normalized = keyword.trim().toLowerCase();
  if (!normalized) return [];

  const results = [];
  function walk(node) {
    const isMatch = node.title.toLowerCase().includes(normalized) && (node.type === "folder" || node.type === "file");
    if (isMatch) {
      results.push({ node, path: buildPathFromNode(node) });
    }
    (node.children || []).forEach((child) => walk(child));
  }
  walk(rootTree);
  return results.filter((item) => item.node !== rootTree);
}

function renderSearchResults() {
  const results = searchTree(activeSearch);
  viewTitle.textContent = `搜索：${activeSearch}`;
  resultCount.textContent = `共 ${results.length} 项`;
  contentList.innerHTML = "";

  if (results.length === 0) {
    const message = siteConfig.noResultsMessage || fallbackSiteConfig.noResultsMessage;
    contentList.innerHTML = `<div class="empty-message muted">${message}</div>`;
    return;
  }

  results.forEach(({ node, path }) => {
    const action = document.createElement(node.type === "folder" ? "button" : "a");
    action.className = "btn ghost";
    if (node.type === "folder") {
      action.type = "button";
      action.textContent = siteConfig.enterLabel || fallbackSiteConfig.enterLabel;
      action.addEventListener("click", () => {
        activeSearch = "";
        searchInput.value = "";
        setCurrentFolderByPathKey(node.pathKey);
      });
    } else {
      action.href = node.url || getConfiguredDriveFolderUrl();
      action.target = "_blank";
      action.rel = "noopener noreferrer";
      action.textContent = siteConfig.openLabel || fallbackSiteConfig.openLabel;
    }

    const folderPath = path.slice(1, -1).map((item) => item.title).join(" / ") || getRootLabel();
    const metaText =
      node.type === "folder"
        ? `${siteConfig.folderTypeLabel || fallbackSiteConfig.folderTypeLabel} · ${folderPath}`
        : formatMeta(node, folderPath);
    contentList.appendChild(createCard(node, metaText, action));
  });
}

function render() {
  backBtn.disabled = currentPath.length <= 1;
  renderFolderTree();
  renderBreadcrumb();
  if (activeSearch.trim()) {
    renderSearchResults();
  } else {
    renderFolderView();
  }
}

async function loadTree() {
  try {
    const data = await loadJson(DRIVE_INDEX_PATH);
    rootTree = buildVisibleRoot(data);
  } catch (error) {
    console.warn("读取 drive-index.json 失败，使用空目录 fallback", error);
    rootTree = createFallbackTree();
  }

  nodeMap = new Map();
  rootTree = buildRuntimeTree(rootTree);

  openAllBtn.href = siteConfig.driveFolderUrl || rootTree.url || "#";
  currentFolder = rootTree;
  currentPath = [rootTree];
  render();
}

async function init() {
  await loadConfigs();
  applyConfig();
  await loadTree();
}

searchInput.addEventListener("input", (event) => {
  activeSearch = event.target.value.trim();
  render();
});

backBtn.addEventListener("click", () => {
  if (!currentFolder.parent) return;
  setCurrentFolderByPathKey(currentFolder.parent.pathKey);
});

init();
