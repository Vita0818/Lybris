const SITE_CONFIG_PATH = "data/site-config.json";
const SUBJECT_CONFIG_PATH = "data/subject-config.json";
const DRIVE_INDEX_PATH = "data/drive-index.json";
const PDFJS_MODULE_PATH = "./vendor/pdfjs/pdf.mjs";
const PDFJS_WORKER_PATH = "./vendor/pdfjs/pdf.worker.mjs";
const IMAGE_EXTENSIONS = new Set(["jpg", "jpeg", "png", "gif", "webp", "svg", "avif"]);
const IMAGE_PREVIEW_URL_FIELDS = ["rawUrl", "downloadUrl", "exportUrl", "contentUrl", "thumbnailUrl", "url"];

const fallbackSiteConfig = {
  brandName: "Lybris",
  siteTitle: "Lybris 学科资料站模板",
  subtitle: "课本知识上传与共享计划",
  ownerName: "",
  description: "面向多学科资料整理、上传、索引与共享的静态站点模板。",
  avatarUrl: "assets/avatar.png",
  avatarAlt: "站点头像",
  driveFolderUrl: "",
  rootLabel: "全部资料",
  openAllLabel: "打开资料源",
  searchPlaceholder: "搜索",
  backLabel: "返回上一级",
  sidebarTitle: "目录",
  openLabel: "打开",
  previewLabel: "预览",
  openOriginalLabel: "打开原文件",
  closeLabel: "关闭",
  loadingPreviewText: "正在加载预览...",
  previewLoadingText: "正在加载预览...",
  previewUnavailableText: "这个资料暂时无法在网页内预览，请打开原文件查看。",
  pdfFallbackText: "PDF 暂时无法在网页内渲染，请打开原文件查看。",
  markdownLoadFailedText: "Markdown 内容暂时无法加载，请打开原文件查看。",
  imagePreviewLabel: "图片预览",
  imagePreviewUnavailableText: "图片暂时无法在网页内预览，请打开原文件查看。",
  imageLoadFailedText: "图片加载失败，请打开原文件查看。",
  pdfPreviewTitle: "PDF 预览",
  markdownPreviewTitle: "Markdown 预览",
  imagePreviewTitle: "图片预览",
  enterLabel: "进入",
  folderTypeLabel: "资料集",
  fileTypeLabel: "资料",
  emptyRootMessage: "暂无资料",
  emptyFolderMessage: "暂无资料",
  noResultsMessage: "未找到结果"
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
let previewToken = 0;
let pdfjsLibPromise = null;
let markdownRenderer = null;
let activeImageViewer = null;
let activeImagePreviewImage = null;

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
const categoryPills = document.getElementById("categoryPills");
const previewModal = document.getElementById("previewModal");
const previewTitle = document.getElementById("previewTitle");
const previewBadge = document.getElementById("previewBadge");
const previewContent = document.getElementById("previewContent");
const previewOpenOriginal = document.getElementById("previewOpenOriginal");
const previewCloseBtn = document.getElementById("previewCloseBtn");

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
  updateSourceLink();
  searchInput.placeholder = siteConfig.searchPlaceholder || fallbackSiteConfig.searchPlaceholder;
  const backLabel = siteConfig.backLabel || fallbackSiteConfig.backLabel;
  backBtn.setAttribute("aria-label", backLabel);
  backBtn.title = backLabel;
  sidebarTitle.textContent = siteConfig.sidebarTitle || fallbackSiteConfig.sidebarTitle;
  previewCloseBtn.textContent = siteConfig.closeLabel || fallbackSiteConfig.closeLabel;
  previewCloseBtn.setAttribute("aria-label", siteConfig.closeLabel || fallbackSiteConfig.closeLabel);
  previewOpenOriginal.textContent = siteConfig.openOriginalLabel || fallbackSiteConfig.openOriginalLabel;
  viewTitle.textContent = getRootLabel();

  renderCategoryPills();
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

function normalizeSignal(value) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function looksLikeGoogleDriveFolderUrl(url) {
  return typeof url === "string" && /drive\.google\.com\/drive\/folders\//i.test(url);
}

function getFileExtension(item) {
  const candidates = [
    item?.title,
    item?.name,
    item?.url,
    item?.rawUrl,
    item?.downloadUrl,
    item?.exportUrl,
    item?.contentUrl,
    item?.thumbnailUrl,
    item?.imageUrl,
    item?.markdownUrl,
    item?.sourceUrl,
    item?.filePath,
    item?.path,
    item?.previewUrl,
    item?.embedUrl,
    item?.pdfUrl
  ];

  for (const candidate of candidates) {
    if (typeof candidate !== "string") continue;
    const cleanValue = candidate.split(/[?#]/)[0].trim();
    const match = cleanValue.match(/\.([a-z0-9]+)$/i);
    if (match) return match[1].toLowerCase();
  }

  return "";
}

function inferNodeKind(node) {
  const rawType = normalizeSignal(node?.type);
  const mimeType = normalizeSignal(node?.mimeType || node?.mime || node?.contentType);

  if (
    rawType === "folder" ||
    rawType === "directory" ||
    mimeType === "application/vnd.google-apps.folder" ||
    looksLikeGoogleDriveFolderUrl(node?.url)
  ) {
    return "folder";
  }

  if (
    rawType === "file" ||
    rawType.includes("pdf") ||
    rawType.includes("markdown") ||
    rawType.includes("image") ||
    IMAGE_EXTENSIONS.has(rawType) ||
    rawType.includes("text/plain") ||
    mimeType ||
    getFileExtension(node)
  ) {
    return "file";
  }

  return Array.isArray(node?.children) ? "folder" : "file";
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
  const type = inferNodeKind(node);
  const children = type === "folder" ? (Array.isArray(node?.children) ? node.children : []) : undefined;
  return {
    ...(node && typeof node === "object" ? node : {}),
    title,
    type,
    indexType: node?.type || "",
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
  updateSourceLink();
}

function updateSourceLink() {
  const sourceUrl = siteConfig.driveFolderUrl || rootTree.url || "";
  if (sourceUrl && sourceUrl !== "#") {
    openAllBtn.href = sourceUrl;
    openAllBtn.textContent = siteConfig.openAllLabel || fallbackSiteConfig.openAllLabel;
    openAllBtn.removeAttribute("aria-disabled");
    return;
  }

  openAllBtn.removeAttribute("href");
  openAllBtn.textContent = "资料源未配置";
  openAllBtn.setAttribute("aria-disabled", "true");
}

function getChildCount(node) {
  return Array.isArray(node?.children) ? node.children.length : 0;
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
    title.className = "tree-label";
    title.textContent = node.title;

    const count = document.createElement("span");
    count.className = "tree-count";
    count.textContent = getChildCount(node);

    item.append(title, count);

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
    if (idx === currentPath.length - 1) {
      button.className = "current";
      button.disabled = true;
    } else {
      button.addEventListener("click", () => setCurrentFolderByPathKey(node.pathKey));
    }
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

  if (folderChildren.length === 0) {
    renderEmptyMessage(
      currentFolder === rootTree
        ? siteConfig.emptyRootMessage || fallbackSiteConfig.emptyRootMessage
        : siteConfig.emptyFolderMessage || fallbackSiteConfig.emptyFolderMessage
    );
    return;
  }

  const children = sortChildren(folderChildren);
  const entries = children.map((item) => ({
    node: item,
    action: createPrimaryAction(item)
  }));

  renderLibrarySections(entries);
}

function createPrimaryAction(item) {
  if (item.type === "folder") {
    return createEnterAction(item);
  }

  return createOpenAction(item);
}

function createEnterAction(item) {
  const action = document.createElement("button");
  action.type = "button";
  action.className = "btn ghost";
  action.textContent = siteConfig.enterLabel || fallbackSiteConfig.enterLabel;
  action.addEventListener("click", () => setCurrentFolderByPathKey(item.pathKey));
  return action;
}

function createSearchEnterAction(item) {
  const action = document.createElement("button");
  action.type = "button";
  action.className = "btn ghost";
  action.textContent = siteConfig.enterLabel || fallbackSiteConfig.enterLabel;
  action.addEventListener("click", () => {
    activeSearch = "";
    searchInput.value = "";
    setCurrentFolderByPathKey(item.pathKey);
  });
  return action;
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

function createPreviewAction(item) {
  const action = document.createElement("button");
  action.type = "button";
  action.className = "btn preview-action";
  action.textContent = siteConfig.previewLabel || fallbackSiteConfig.previewLabel;
  action.addEventListener("click", () => openPreview(item));
  return action;
}

function renderEmptyMessage(message, titleText = "") {
  contentList.innerHTML = "";
  const empty = document.createElement("div");
  empty.className = "empty-state";

  const text = document.createElement("p");
  text.textContent = titleText || message;
  empty.appendChild(text);

  const sourceUrl = siteConfig.driveFolderUrl || rootTree.url || "";
  if (currentFolder === rootTree && sourceUrl && sourceUrl !== "#") {
    const link = document.createElement("a");
    link.className = "btn ghost";
    link.href = sourceUrl;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = getConfigText("openAllLabel");
    empty.appendChild(link);
  }

  contentList.appendChild(empty);
}

function createContentSection(title, entries, containerClassName) {
  const section = document.createElement("section");
  section.className = "content-section";

  const heading = document.createElement("div");
  heading.className = "section-title";

  const headingText = document.createElement("h3");
  headingText.textContent = title;

  const count = document.createElement("span");
  count.textContent = `${entries.length} 项`;

  heading.append(headingText, count);

  const container = document.createElement("div");
  container.className = containerClassName;
  entries.forEach((entry) => {
    container.appendChild(createCard(entry.node, entry.action));
  });

  section.append(heading, container);
  return section;
}

function renderLibrarySections(entries) {
  contentList.innerHTML = "";
  const folders = entries.filter((entry) => entry.node.type === "folder");
  const files = entries.filter((entry) => entry.node.type === "file");

  if (folders.length > 0) {
    contentList.appendChild(createContentSection("资料集", folders, "collection-grid"));
  }

  if (files.length > 0) {
    contentList.appendChild(createContentSection("资料", files, "resource-list"));
  }
}

function getFileSignals(item) {
  return {
    extension: getFileExtension(item),
    mimeType: normalizeSignal(item?.mimeType || item?.mime || item?.contentType),
    sourceType: normalizeSignal(
      item?.sourceType || item?.indexType || item?.fileType || item?.format || item?.kind || item?.type
    )
  };
}

function isPdfResource(item) {
  if (item.type !== "file") return false;
  const { extension, mimeType, sourceType } = getFileSignals(item);
  return extension === "pdf" || mimeType === "application/pdf" || sourceType.includes("pdf");
}

function isMarkdownResource(item) {
  if (item.type !== "file") return false;
  const { extension, mimeType, sourceType } = getFileSignals(item);
  return (
    extension === "md" ||
    extension === "markdown" ||
    mimeType === "text/markdown" ||
    mimeType === "text/x-markdown" ||
    (mimeType === "text/plain" && ["md", "markdown"].includes(extension)) ||
    sourceType.includes("markdown")
  );
}

function isImageResource(item) {
  if (item.type !== "file" || isPdfResource(item) || isMarkdownResource(item)) return false;
  const { extension, mimeType, sourceType } = getFileSignals(item);
  return (
    IMAGE_EXTENSIONS.has(extension) ||
    IMAGE_EXTENSIONS.has(sourceType) ||
    mimeType.startsWith("image/") ||
    sourceType.includes("image")
  );
}

function getPreviewKind(item) {
  if (isPdfResource(item)) return "pdf";
  if (isMarkdownResource(item)) return "markdown";
  if (isImageResource(item)) return "image";
  return "";
}

function getBadgeLabel(item) {
  if (item.type === "folder") return "资料集";

  const previewKind = getPreviewKind(item);
  if (previewKind === "pdf") return "PDF";
  if (previewKind === "markdown") return "MD";
  if (previewKind === "image") return "IMG";

  const extension = getFileExtension(item).toUpperCase();

  if (["PDF", "DOC", "DOCX", "PPT", "PPTX", "XLS", "XLSX", "MD"].includes(extension)) {
    return extension;
  }

  return item.url ? "LINK" : "FILE";
}

function getBadgeClass(item) {
  if (item.type === "folder") return "folder";
  const previewKind = getPreviewKind(item);
  if (previewKind === "pdf") return "pdf";
  if (previewKind === "markdown") return "markdown";
  if (previewKind === "image") return "image";
  return item.url ? "link" : "file";
}

function createCard(item, actionNode) {
  const card = document.createElement("article");
  card.className = `library-card ${item.type === "folder" ? "collection-card" : "resource-card"}`;
  const previewKind = getPreviewKind(item);

  const main = document.createElement("div");
  main.className = "card-main";
  if (item.type === "file" && previewKind) {
    main.classList.add("preview-trigger");
    main.setAttribute("role", "button");
    main.tabIndex = 0;
    main.addEventListener("click", () => openPreview(item));
    main.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      openPreview(item);
    });
  }

  const topline = document.createElement("div");
  topline.className = "card-topline";

  const badge = document.createElement("span");
  badge.className = `type-badge ${getBadgeClass(item)}`;
  badge.textContent = getBadgeLabel(item);

  topline.appendChild(badge);

  const title = document.createElement(item.type === "folder" ? "button" : "div");
  title.className = item.type === "folder" ? "card-title name-btn" : "card-title";
  title.textContent = item.title;
  if (item.type === "folder") {
    title.type = "button";
    title.addEventListener("click", () => setCurrentFolderByPathKey(item.pathKey));
  }

  const copy = document.createElement("div");
  copy.className = "card-copy";
  copy.append(topline, title);

  main.appendChild(copy);

  const actions = document.createElement("div");
  actions.className = "card-actions";
  if (item.type === "file" && previewKind) {
    actions.appendChild(createPreviewAction(item));
  }
  actions.appendChild(actionNode);

  card.append(main, actions);
  return card;
}

function getConfigText(key) {
  return siteConfig[key] || fallbackSiteConfig[key] || "";
}

function getPreviewLoadingText() {
  return getConfigText("loadingPreviewText") || getConfigText("previewLoadingText");
}

function firstStringValue(item, fields) {
  for (const field of fields) {
    const value = item?.[field];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}

function getOriginalUrl(item) {
  return (
    firstStringValue(item, [
      "url",
      "webViewLink",
      "alternateLink",
      "contentUrl",
      "rawUrl",
      "downloadUrl",
      "exportUrl",
      "thumbnailUrl"
    ]) || "#"
  );
}

function getPreviewTitle(kind) {
  if (kind === "pdf") return getConfigText("pdfPreviewTitle");
  if (kind === "markdown") return getConfigText("markdownPreviewTitle");
  if (kind === "image") return getConfigText("imagePreviewTitle") || getConfigText("imagePreviewLabel");
  return getConfigText("previewLabel");
}

function setPreviewBadge(kind) {
  const badgeMap = {
    pdf: { className: "pdf", label: "PDF" },
    markdown: { className: "markdown", label: "MD" },
    image: { className: "image", label: "IMG" }
  };
  const badge = badgeMap[kind] || { className: "file", label: "PREVIEW" };
  previewBadge.className = `type-badge ${badge.className}`;
  previewBadge.textContent = badge.label;
}

function setPreviewState(message, showOriginalLink = false) {
  previewContent.innerHTML = "";

  const state = document.createElement("div");
  state.className = "preview-state";

  const text = document.createElement("p");
  text.textContent = message;
  state.appendChild(text);

  if (showOriginalLink) {
    const link = document.createElement("a");
    link.className = "btn secondary";
    link.href = previewOpenOriginal.href;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = getConfigText("openOriginalLabel");
    state.appendChild(link);
  }

  previewContent.appendChild(state);
}

function openPreviewModalShell(item, kind, originalUrl) {
  previewTitle.textContent = item.title || getPreviewTitle(kind);
  previewOpenOriginal.href = originalUrl;
  previewOpenOriginal.textContent = getConfigText("openOriginalLabel");
  previewCloseBtn.textContent = getConfigText("closeLabel");
  previewCloseBtn.setAttribute("aria-label", getConfigText("closeLabel"));
  setPreviewBadge(kind);
  setPreviewState(getPreviewLoadingText());

  previewModal.hidden = false;
  previewModal.setAttribute("aria-hidden", "false");
  document.body.classList.add("preview-open");
  previewContent.scrollTop = 0;
  requestAnimationFrame(() => previewModal.classList.add("is-open"));
  previewCloseBtn.focus({ preventScroll: true });
}

function openPreview(item) {
  const kind = getPreviewKind(item);
  if (!kind) return;

  previewToken += 1;
  const token = previewToken;
  const originalUrl = getOriginalUrl(item);
  destroyActiveImageViewer();

  if (kind === "image") {
    hidePreviewModal();
    renderImagePreview(item, token);
    return;
  }

  openPreviewModalShell(item, kind, originalUrl);

  if (kind === "pdf") {
    renderPdfPreview(item, token);
    return;
  }

  renderMarkdownPreview(item, token);
}

function hidePreviewModal() {
  previewModal.classList.remove("is-open");
  previewModal.setAttribute("aria-hidden", "true");
  previewModal.hidden = true;
  document.body.classList.remove("preview-open");
  previewContent.innerHTML = "";
}

function closePreview() {
  if (previewModal.hidden) return;
  previewToken += 1;
  hidePreviewModal();
}

function addUniqueCandidate(candidates, url) {
  if (url && !candidates.includes(url)) candidates.push(url);
}

function getGoogleDriveImageCandidates(fileId) {
  if (!fileId) return [];
  const encodedId = encodeURIComponent(fileId);
  return [
    `https://drive.google.com/uc?export=view&id=${encodedId}`,
    `https://drive.google.com/thumbnail?id=${encodedId}&sz=w2000`
  ];
}

function isGoogleDriveFolderResourceUrl(url) {
  return typeof url === "string" && /drive\.google\.com\/drive\/folders\//i.test(url);
}

function getImageUrlCandidates(item) {
  const candidates = [];

  IMAGE_PREVIEW_URL_FIELDS.forEach((field) => {
    const safeValue = sanitizeResourceUrl(item?.[field]);
    if (!safeValue || isGoogleDriveFolderResourceUrl(safeValue)) return;

    const driveFileId = getGoogleDriveFileIdFromUrl(safeValue);
    if (driveFileId && isGoogleDriveUrl(safeValue)) {
      getGoogleDriveImageCandidates(driveFileId).forEach((candidate) => addUniqueCandidate(candidates, candidate));
      return;
    }

    addUniqueCandidate(candidates, safeValue);
  });

  const driveFileId = getGoogleDriveFileId(item);
  getGoogleDriveImageCandidates(driveFileId).forEach((candidate) => addUniqueCandidate(candidates, candidate));

  return candidates;
}

function createImagePreviewElement(url, item) {
  return new Promise((resolve, reject) => {
    const image = document.createElement("img");
    image.className = "image-preview-source";
    image.alt = item.title || getPreviewTitle("image");
    image.decoding = "async";
    image.loading = "eager";

    image.addEventListener("load", () => resolve(image), { once: true });
    image.addEventListener(
      "error",
      () => reject(new Error(`Image failed to load: ${url}`)),
      { once: true }
    );

    image.src = url;
  });
}

async function renderImagePreview(item, token) {
  if (!window.Viewer) {
    showImagePreviewFallback(item, getConfigText("imagePreviewUnavailableText"));
    return;
  }

  const imageCandidates = getImageUrlCandidates(item);
  if (imageCandidates.length === 0) {
    showImagePreviewFallback(item, getConfigText("imagePreviewUnavailableText"));
    return;
  }

  for (const imageUrl of imageCandidates) {
    try {
      const image = await createImagePreviewElement(imageUrl, item);
      if (token !== previewToken) {
        removeImagePreviewElement(image);
        return;
      }
      showImageViewer(image, item, token);
      return;
    } catch (error) {
      if (token !== previewToken) return;
      console.warn("图片预览加载失败", imageUrl, error);
    }
  }

  if (token === previewToken) {
    showImagePreviewFallback(item, getConfigText("imageLoadFailedText"));
  }
}

function showImageViewer(image, item, token) {
  if (token !== previewToken) {
    removeImagePreviewElement(image);
    return;
  }

  destroyActiveImageViewer();
  document.body.appendChild(image);

  try {
    const viewer = new window.Viewer(image, {
      inline: false,
      button: true,
      backdrop: true,
      navbar: false,
      title: [1, (imageElement) => imageElement.alt || getPreviewTitle("image")],
      toolbar: true,
      tooltip: true,
      movable: true,
      zoomable: true,
      rotatable: true,
      scalable: true,
      transition: true,
      fullscreen: true,
      keyboard: true,
      className: "lybris-image-viewer",
      hidden() {
        if (activeImageViewer === viewer) activeImageViewer = null;
        if (activeImagePreviewImage === image) activeImagePreviewImage = null;
        removeImagePreviewElement(image);
      }
    });

    activeImageViewer = viewer;
    activeImagePreviewImage = image;
    viewer.show();
  } catch (error) {
    console.warn("Viewer.js 图片预览初始化失败", error);
    removeImagePreviewElement(image);
    showImagePreviewFallback(item, getConfigText("imagePreviewUnavailableText"));
  }
}

function showImagePreviewFallback(item, message) {
  destroyActiveImageViewer();
  openPreviewModalShell(item, "image", getOriginalUrl(item));
  setPreviewState(message || getConfigText("imagePreviewUnavailableText"), true);
}

function removeImagePreviewElement(image) {
  if (image?.parentNode) {
    image.parentNode.removeChild(image);
  }
}

function destroyActiveImageViewer() {
  const viewer = activeImageViewer;
  const image = activeImagePreviewImage;
  activeImageViewer = null;
  activeImagePreviewImage = null;

  if (viewer) {
    try {
      viewer.destroy();
    } catch (error) {
      console.warn("Viewer.js 清理失败", error);
    }
  }

  removeImagePreviewElement(image);
}

function getGoogleDriveFileIdFromUrl(url) {
  if (typeof url !== "string" || !url.trim()) return "";

  const filePathMatch = url.match(/\/file\/d\/([^/?#]+)/i);
  if (filePathMatch) return decodeURIComponent(filePathMatch[1]);

  try {
    const parsedUrl = new URL(url, window.location.href);
    const id = parsedUrl.searchParams.get("id");
    if (id) return id;
  } catch (error) {
    const queryMatch = url.match(/[?&]id=([^&#]+)/i);
    if (queryMatch) return decodeURIComponent(queryMatch[1]);
  }

  return "";
}

function getGoogleDriveFileId(item) {
  const fields = [
    "url",
    "webViewLink",
    "alternateLink",
    "downloadUrl",
    "exportUrl",
    "contentUrl",
    "rawUrl",
    "thumbnailUrl",
    "previewUrl",
    "imageUrl"
  ];

  for (const field of fields) {
    const id = getGoogleDriveFileIdFromUrl(item?.[field]);
    if (id) return id;
  }

  return "";
}

function isGoogleDriveUrl(url) {
  return typeof url === "string" && /drive\.google\.com\//i.test(url);
}

function sanitizeResourceUrl(url) {
  const trimmed = String(url || "").trim();
  if (!trimmed || trimmed === "#") return "";

  if (!/^[a-z][a-z0-9+.-]*:/i.test(trimmed)) return trimmed;

  try {
    const parsedUrl = new URL(trimmed, window.location.href);
    if (["http:", "https:"].includes(parsedUrl.protocol)) return trimmed;
  } catch (error) {
    return "";
  }

  return "";
}

function isGoogleDriveFileUrl(url) {
  return typeof url === "string" && /drive\.google\.com\/(?:file\/d\/|open\?)/i.test(url);
}

function isLikelyFetchablePdfUrl(url) {
  if (typeof url !== "string" || !url.trim() || url === "#") return false;
  if (isGoogleDriveFileUrl(url)) return false;
  if (/\/preview(?:[?#].*)?$/i.test(url)) return false;

  const extension = getFileExtension({ url });
  return extension === "pdf" || !/^[a-z][a-z0-9+.-]*:/i.test(url);
}

function getPdfJsCandidates(item) {
  const candidates = [];
  const trustedFields = ["rawUrl", "downloadUrl", "exportUrl", "contentUrl", "pdfUrl", "filePath", "path"];

  trustedFields.forEach((field) => {
    const safeValue = sanitizeResourceUrl(item?.[field]);
    if (safeValue && !isGoogleDriveFileUrl(safeValue)) candidates.push(safeValue);
  });

  const safeItemUrl = sanitizeResourceUrl(item?.url);
  if (isLikelyFetchablePdfUrl(safeItemUrl)) candidates.push(safeItemUrl);

  return [...new Set(candidates)];
}

function getDrivePreviewUrl(item) {
  const configuredPreview = sanitizeResourceUrl(firstStringValue(item, ["previewUrl", "embedUrl", "pdfPreviewUrl"]));
  if (configuredPreview && /drive\.google\.com\/file\/d\/[^/]+\/preview/i.test(configuredPreview)) {
    return configuredPreview;
  }

  const fileId = getGoogleDriveFileId(item);
  return fileId ? `https://drive.google.com/file/d/${encodeURIComponent(fileId)}/preview` : "";
}

async function loadPdfJs() {
  if (!pdfjsLibPromise) {
    pdfjsLibPromise = import(PDFJS_MODULE_PATH).then((pdfjsLib) => {
      pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER_PATH;
      return pdfjsLib;
    });
  }

  return pdfjsLibPromise;
}

async function renderPdfPreview(item, token) {
  if (token !== previewToken) return;

  const pdfCandidates = getPdfJsCandidates(item);
  const drivePreviewUrl = getDrivePreviewUrl(item);

  for (const pdfUrl of pdfCandidates) {
    try {
      await renderPdfWithPdfJs(pdfUrl, item, token);
      return;
    } catch (error) {
      console.warn("PDF.js 预览失败", pdfUrl, error);
    }
  }

  if (token !== previewToken) return;

  if (drivePreviewUrl) {
    renderDrivePdfFallback(drivePreviewUrl, item);
    return;
  }

  setPreviewState(getConfigText("pdfFallbackText") || getConfigText("previewUnavailableText"), true);
}

async function renderPdfWithPdfJs(pdfUrl, item, token) {
  const pdfjsLib = await loadPdfJs();
  if (token !== previewToken) return;

  previewContent.innerHTML = "";

  const pages = document.createElement("div");
  pages.className = "pdf-preview-pages";

  const meta = document.createElement("div");
  meta.className = "pdf-preview-meta";
  meta.textContent = getConfigText("pdfPreviewTitle");

  pages.appendChild(meta);
  previewContent.appendChild(pages);

  const loadingTask = pdfjsLib.getDocument({
    url: pdfUrl,
    withCredentials: false
  });
  const pdf = await loadingTask.promise;
  if (token !== previewToken) {
    loadingTask.destroy();
    return;
  }

  meta.textContent = `${getConfigText("pdfPreviewTitle")} · ${pdf.numPages} 页`;

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    if (token !== previewToken) {
      loadingTask.destroy();
      return;
    }

    const page = await pdf.getPage(pageNumber);
    const baseViewport = page.getViewport({ scale: 1 });
    const availableWidth = Math.max(280, Math.min(previewContent.clientWidth - 44, 980));
    const scale = Math.max(0.5, Math.min(2.1, availableWidth / baseViewport.width));
    const viewport = page.getViewport({ scale });
    const outputScale = window.devicePixelRatio || 1;

    const pageWrap = document.createElement("figure");
    pageWrap.className = "pdf-preview-page";

    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d", { alpha: false });
    canvas.width = Math.floor(viewport.width * outputScale);
    canvas.height = Math.floor(viewport.height * outputScale);
    canvas.style.width = `${Math.floor(viewport.width)}px`;
    canvas.style.height = `${Math.floor(viewport.height)}px`;

    const caption = document.createElement("figcaption");
    caption.textContent = `${pageNumber}`;

    pageWrap.append(canvas, caption);
    pages.appendChild(pageWrap);

    await page.render({
      canvasContext: context,
      viewport,
      transform: outputScale !== 1 ? [outputScale, 0, 0, outputScale, 0, 0] : null
    }).promise;
  }
}

function renderDrivePdfFallback(previewUrl, item) {
  previewContent.innerHTML = "";
  const frame = document.createElement("iframe");
  frame.className = "pdf-preview-frame";
  frame.src = previewUrl;
  frame.title = item.title || getConfigText("pdfPreviewTitle");
  frame.loading = "lazy";
  previewContent.appendChild(frame);
}

function getMarkdownFetchCandidates(item) {
  const fields = ["rawUrl", "downloadUrl", "exportUrl", "contentUrl", "markdownUrl", "sourceUrl", "filePath", "path"];
  const candidates = [];

  fields.forEach((field) => {
    const value = item?.[field];
    const safeValue = sanitizeResourceUrl(value);
    if (safeValue) candidates.push(safeValue);
  });

  const safeItemUrl = sanitizeResourceUrl(item?.url);
  if (isLikelyFetchableMarkdownUrl(safeItemUrl)) candidates.push(safeItemUrl);

  const title = typeof item?.title === "string" ? item.title.trim() : "";
  if (title && ["md", "markdown"].includes(getFileExtension({ title }))) {
    candidates.push(title);
  }

  return [...new Set(candidates)];
}

function isLikelyFetchableMarkdownUrl(url) {
  if (typeof url !== "string" || !url.trim() || url === "#") return false;
  if (/drive\.google\.com\/(?:file\/d|drive\/folders)\//i.test(url)) return false;

  const extension = getFileExtension({ url });
  if (extension === "md" || extension === "markdown") return true;

  return !/^[a-z][a-z0-9+.-]*:/i.test(url);
}

async function renderMarkdownPreview(item, token) {
  if (!window.markdownit || !window.DOMPurify) {
    setPreviewState(getConfigText("markdownLoadFailedText"), true);
    return;
  }

  const candidates = getMarkdownFetchCandidates(item);
  if (candidates.length === 0) {
    setPreviewState(getConfigText("markdownLoadFailedText"), true);
    return;
  }

  for (const url of candidates) {
    try {
      const response = await fetch(url, { cache: "no-store" });
      if (!response.ok) continue;

      const markdown = await response.text();
      if (token !== previewToken) return;

      previewContent.innerHTML = "";
      const article = document.createElement("article");
      article.className = "preview-markdown";
      article.innerHTML = renderMarkdownWithLibraries(markdown);
      hardenPreviewLinks(article);
      previewContent.appendChild(article);
      return;
    } catch (error) {
      console.warn("Markdown 预览加载失败", url, error);
    }
  }

  if (token === previewToken) {
    setPreviewState(getConfigText("markdownLoadFailedText"), true);
  }
}

function getMarkdownRenderer() {
  if (!markdownRenderer) {
    markdownRenderer = window.markdownit({
      html: false,
      linkify: true,
      typographer: true
    });

    const defaultLinkOpen =
      markdownRenderer.renderer.rules.link_open ||
      ((tokens, idx, options, env, self) => self.renderToken(tokens, idx, options));

    markdownRenderer.renderer.rules.link_open = (tokens, idx, options, env, self) => {
      const token = tokens[idx];
      const hrefIndex = token.attrIndex("href");
      const href = hrefIndex >= 0 ? token.attrs[hrefIndex][1] : "";

      if (hrefIndex >= 0 && !isSafeDocumentLink(href)) {
        token.attrs = token.attrs.filter(([name]) => name !== "href");
      }

      token.attrSet("target", "_blank");
      token.attrSet("rel", "noopener noreferrer");
      return defaultLinkOpen(tokens, idx, options, env, self);
    };
  }

  return markdownRenderer;
}

function renderMarkdownWithLibraries(markdown) {
  const html = getMarkdownRenderer().render(String(markdown || ""));
  return window.DOMPurify.sanitize(html, {
    USE_PROFILES: { html: true },
    ADD_ATTR: ["target", "rel"],
    FORBID_TAGS: ["script", "style", "iframe", "object", "embed", "form"],
    FORBID_ATTR: ["srcdoc", "style"]
  });
}

function isSafeDocumentLink(href) {
  const trimmed = String(href || "").trim();
  if (!trimmed) return false;
  if (/^(#|\.{0,2}\/|\?)/.test(trimmed)) return true;

  try {
    const parsedUrl = new URL(trimmed, window.location.href);
    return ["http:", "https:", "mailto:", "tel:"].includes(parsedUrl.protocol);
  } catch (error) {
    return !/^[a-z][a-z0-9+.-]*:/i.test(trimmed);
  }
}

function hardenPreviewLinks(root) {
  root.querySelectorAll("a[href]").forEach((link) => {
    if (!isSafeDocumentLink(link.getAttribute("href"))) {
      link.removeAttribute("href");
    }
    link.target = "_blank";
    link.rel = "noopener noreferrer";
  });
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

  if (results.length === 0) {
    renderEmptyMessage(siteConfig.noResultsMessage || fallbackSiteConfig.noResultsMessage);
    return;
  }

  const entries = results.map(({ node }) => ({
    node,
    action: node.type === "folder" ? createSearchEnterAction(node) : createOpenAction(node)
  }));

  renderLibrarySections(entries);
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

previewCloseBtn.addEventListener("click", closePreview);

previewModal.addEventListener("click", (event) => {
  if (event.target instanceof HTMLElement && event.target.dataset.previewClose !== undefined) {
    closePreview();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !previewModal.hidden) {
    closePreview();
  }
});

init();
