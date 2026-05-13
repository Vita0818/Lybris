/**
 * Google Apps Script for exporting a Google Drive folder tree as JSON.
 *
 * Usage:
 * 1) Create a new Apps Script project.
 * 2) Paste this file content into Code.gs.
 * 3) Deploy as Web App (Execute as: Me, Who has access: Anyone).
 * 4) Copy the deployed Web App URL to GitHub repository secret: DRIVE_INDEX_SOURCE_URL.
 *    Frontend should not call this URL directly; GitHub Actions will sync it into data/drive-index.json.
 */
const ROOT_FOLDER_ID = "1onVR2v7-_WzvPypCS8r8NX8wMphymSpb";

function doGet() {
  const root = DriveApp.getFolderById(ROOT_FOLDER_ID);
  const data = buildFolderNode(root);

  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(
    ContentService.MimeType.JSON
  );
}

function buildFolderNode(folder) {
  const node = {
    title: folder.getName(),
    type: "folder",
    url: folder.getUrl(),
    updatedAt: toDateString(folder.getLastUpdated()),
    children: []
  };

  const childFolders = folder.getFolders();
  while (childFolders.hasNext()) {
    node.children.push(buildFolderNode(childFolders.next()));
  }

  const files = folder.getFiles();
  while (files.hasNext()) {
    const file = files.next();
    if (file.getMimeType() !== MimeType.PDF) continue;

    node.children.push({
      title: file.getName(),
      type: "file",
      url: file.getUrl(),
      updatedAt: toDateString(file.getLastUpdated())
    });
  }

  return node;
}

function toDateString(date) {
  return Utilities.formatDate(date, Session.getScriptTimeZone(), "yyyy-MM-dd");
}
