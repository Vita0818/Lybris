const SITE_CONFIG_PATH = "data/site-config.json";
const SUBJECT_CONFIG_PATH = "data/subject-config.json";
const DRIVE_INDEX_PATH = "data/drive-index.json";

const fallbackSiteConfig = {
  brandName: "Lybris",
  siteTitle: "Lybris 学科资料书架",
  subtitle: "课本知识上传与共享计划",
  ownerName: "",
  description: "Lybris 学科资料书架模板，资料由外部存储同步为静态索引，并在页面中统一浏览。",
  avatarUrl: "assets/avatar.png",
  avatarAlt: "站点头像",
  driveFolderUrl: "",
  rootLabel: "全部资料",
  openAllLabel: "打开资料源",
  searchPlaceholder: "搜索资料、课程、文件名...",
  backLabel: "返回上一级",
  sidebarTitle: "资料导航",
  openLabel: "打开",
  enterLabel: "进入",
  folderTypeLabel: "资料集",
  fileTypeLabel: "资料",
  emptyRootMessage: "资料库索引尚未同步。请先更新外部资料源索引。",
  emptyFolderMessage: "这个资料集暂时没有内容。",
  noResultsMessage: "没有匹配的资料。"
};

const fallbackSubjectConfig = {
  subjectId: "general",
  subjectName: "学科资料",
  description: "可替换为任意学科的资料书架。",
  categories: [],
  decorativeChips: []
};

const categoryToneColors = ["#4aa8c5", "#72cfa7", "#8f9bd7", "#d6a84a", "#6fb7b6"];

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
const categoryPills = document.getElementById("categoryPills");
const folderCount = document.getElementById("folderCount");
const fileCount = document.getElementById("fileCount");
const latestUpdate = document.getElementById("latestUpdate");
const sourceUpdated = document.getElementById("sourceUpdated");
const sourceName = document.getElementById("sourceName");
const sourceSummaryTitle = document.getElementById("sourceSummaryTitle");
const sourceSummaryText = document.getElementById("sourceSummaryText");

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
  sourceName.textContent = `${siteConfig.brandName || fallbackSiteConfig.brandName} 静态资料源`;
  sourceSummaryTitle.textContent = `${subjectConfig.subjectName || fallbackSubjectConfig.subjectName}资料书架`;
  sourceSummaryText.textContent = subjectConfig.description || fallbackSubjectConfig.description;

  renderDecorativeChips();
  renderCategoryPills();
}

function renderDecorativeChips() {
  decorativeChips.innerHTML = "";
  const chips = Array.isArray(subjectConfig.decorativeChips) ? subjectConfig.decorativeChips : [];
  decorativeChips.hidden = chips.length === 0;

  chips.slice(0, 5).forEach((chip, index) => {
    const chipText = typeof chip === "string" ? chip : chip?.text;
    if (!chipText) return;

    const tone = typeof chip === "object" && chip?.tone ? chip.tone : index % 2 === 0 ? "blue" : "green";
    const item = document.createElement("span");
    item.className = `chip chip-${tone}`;
    item.textContent = chipText;
    decorativeChips.appendChild(item);
  });
}

function renderCategoryPills() {
  categoryPills.innerHTML = "";
  const categories = Array.isArray(subjectConfig.categories) ? subjectConfig.categories : [];

  if (categories.length === 0) {
    const empty = document.createElement("span");
    empty.className = "category-pill is-active";
    empty.style.setProperty("--pill-color", categoryToneColors[0]);
    empty.append(createPillDot(), document.createTextNode("全部资料"));
    categoryPills.appendChild(empty);
    return;
  }

  categories.forEach((category, index) => {
    const pill = document.createElement("span");
    pill.className = "category-pill";
    pill.style.setProperty("--pill-color", categoryToneColors[index % categoryToneColors.length]);
    if (category.description) {
      pill.title = category.description;
    }

    const label = document.createElement("strong");
    label.textContent = category.name || category.id || "未命名分类";
    pill.append(createPillDot(), label);
    categoryPills.appendChild(pill);
  });
}

function createPillDot() {
  const dot = document.createElement("span");
  dot.setAttribute("aria-hidden", "true");
  return dot;
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
    category: "",
    updatedAt: "",
    children: []
  };
}

function safeNode(node) {
  const title = node?.title || "未命名";
  const type = node?.type === "file" ? "file" : "folder";
  const children = type === "folder" ? (Array.isArray(node?.children) ? node.children : []) : undefined;
  return {
    title,
    type,
    url: node?.url || getConfiguredDriveFolderUrl(),
    category: node?.category || "",
    updatedAt: node?.updatedAt || "-",
    children
  };
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
    category: normalizedRoot.category || "",
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

function flattenNodes(node, acc = []) {
  (node.children || []).forEach((child) => {
    acc.push(child);
    if (child.type === "folder") flattenNodes(child, acc);
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

function renderOverview() {
  const nodes = flattenNodes(rootTree);
  const folders = nodes.filter((node) => node.type === "folder");
  const files = nodes.filter((node) => node.type === "file");
  const latest = getLatestUpdatedAt(nodes);

  folderCount.textContent = `${folders.length}`;
  fileCount.textContent = `${files.length}`;
  latestUpdate.textContent = latest || "-";
  sourceUpdated.textContent = latest ? `最近同步 ${latest}` : "等待同步";
}

function getLatestUpdatedAt(nodes) {
  const sortedDates = nodes
    .map((node) => node.updatedAt)
    .filter((value) => value && value !== "-")
    .sort((a, b) => b.localeCompare(a));
  return sortedDates[0];
}

function renderFolderTree() {
  folderTree.innerHTML = "";
  const folders = listFolders(rootTree);

  folders.forEach((node) => {
    const item = document.createElement("button");
    item.type = "button";
    item.className = "tree-item";
    item.style.paddingLeft = `${node.depth * 14 + 10}px`;

    const title = document.createElement("span");
    title.textContent = node.title;
    item.appendChild(title);

    if (node.pathKey === currentFolder.pathKey) item.classList.add("active");
    item.addEventListener("click", () => setCurrentFolderByPathKey(node.pathKey));
    folderTree.appendChild(item);
  });
}

function renderBreadcrumb() {
  breadcrumb.innerHTML = "";
  currentPath.forEach((node, idx) => {
    if (idx > 0) {
      const separator = document.createElement("span");
      separator.textContent = "/";
      breadcrumb.appendChild(separator);
    }

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
    renderEmptyMessage(
      currentFolder === rootTree
        ? siteConfig.emptyRootMessage || fallbackSiteConfig.emptyRootMessage
        : siteConfig.emptyFolderMessage || fallbackSiteConfig.emptyFolderMessage
    );
    return;
  }

  const children = sortChildren(folderChildren);
  children.forEach((item) => {
    const action = createOpenAction(item);
    const pathText = readablePath(buildPathFromNode(item).slice(1, -1));
    contentList.appendChild(createCard(item, pathText, action));
  });
}

function createOpenAction(item) {
  const action = document.createElement("a");
  action.className = "btn ghost";
  action.href = item.url || getConfiguredDriveFolderUrl();
  action.target = "_blank";
  action.rel = "noopener noreferrer";
  action.textContent = siteConfig.openLabel || fallbackSiteConfig.openLabel;
  return action;
}

function renderEmptyMessage(message) {
  contentList.innerHTML = "";
  const empty = document.createElement("div");
  empty.className = "empty-message muted";
  empty.textContent = message;
  contentList.appendChild(empty);
}

function getTypeLabel(item) {
  if (item.type === "folder") {
    return siteConfig.folderTypeLabel || fallbackSiteConfig.folderTypeLabel;
  }
  return siteConfig.fileTypeLabel || fallbackSiteConfig.fileTypeLabel;
}

function getBadgeLabel(item) {
  if (item.type === "folder") return "FOLDER";

  const extension = item.title.includes(".")
    ? item.title.split(".").pop().trim().toUpperCase()
    : "";

  if (["PDF", "DOC", "DOCX", "PPT", "PPTX", "XLS", "XLSX", "MD"].includes(extension)) {
    return extension;
  }

  return item.url ? "LINK" : "FILE";
}

function getBadgeClass(item) {
  if (item.type === "folder") return "folder";
  return getBadgeLabel(item).toLowerCase() === "pdf" ? "pdf" : item.url ? "link" : "file";
}

function formatUpdatedAt(item) {
  return item.updatedAt && item.updatedAt !== "-" ? item.updatedAt : "未标注";
}

function readablePath(pathNodes) {
  return pathNodes.map((item) => item.title).join(" / ") || getRootLabel();
}

function createCard(item, pathText, actionNode) {
  const card = document.createElement("article");
  card.className = `library-card ${item.type === "folder" ? "collection-card" : "resource-card"}`;

  const main = document.createElement("div");
  main.className = "card-main";

  const topline = document.createElement("div");
  topline.className = "card-topline";

  const badge = document.createElement("span");
  badge.className = `type-badge ${getBadgeClass(item)}`;
  badge.textContent = getBadgeLabel(item);

  const meta = document.createElement("span");
  meta.className = "card-meta";
  meta.textContent = `${getTypeLabel(item)} · 更新 ${formatUpdatedAt(item)}`;

  topline.append(badge, meta);

  const title = document.createElement(item.type === "folder" ? "button" : "div");
  title.className = item.type === "folder" ? "card-title name-btn" : "card-title";
  title.textContent = item.title;
  if (item.type === "folder") {
    title.type = "button";
    title.addEventListener("click", () => setCurrentFolderByPathKey(item.pathKey));
  }

  const path = document.createElement("p");
  path.className = "card-path";
  path.textContent = item.category ? `分类：${item.category}` : `路径：${pathText}`;

  main.append(topline, title, path);

  const actions = document.createElement("div");
  actions.className = "card-actions";
  actions.appendChild(actionNode);

  card.append(main, actions);
  return card;
}

function searchTree(keyword) {
  const normalized = keyword.trim().toLowerCase();
  if (!normalized) return [];

  const results = [];
  function walk(node) {
    const searchableText = [node.title, node.category, node.updatedAt].join(" ").toLowerCase();
    const isMatch = searchableText.includes(normalized) && (node.type === "folder" || node.type === "file");
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
    renderEmptyMessage(siteConfig.noResultsMessage || fallbackSiteConfig.noResultsMessage);
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

    const folderPath = readablePath(path.slice(1, -1));
    contentList.appendChild(createCard(node, folderPath, action));
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
  renderOverview();
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
