import { FileListItem, FileUpload } from "../types/File.type";

type FileWithBrowserPath = File & { path?: string };

export const normalizeRelativeFilePath = (path: string) =>
  path
    .replace(/\\/g, "/")
    .replace(/^\/+/, "")
    .split("/")
    .filter((segment) => segment && segment !== "." && segment !== "..")
    .join("/");

export const getBrowserUploadPath = (file: FileWithBrowserPath) => {
  const browserPath = file.path || file.webkitRelativePath || file.name;
  return normalizeRelativeFilePath(browserPath) || file.name;
};

export const prepareFileUpload = (file: FileWithBrowserPath): FileUpload => {
  const upload = file as FileUpload;
  upload.uploadPath = getBrowserUploadPath(file);
  upload.uploadingProgress = 0;
  return upload;
};

export const getFileListPath = (
  file: { name: string; uploadPath?: string },
) =>
  normalizeRelativeFilePath(
    file.uploadPath || file.name,
  );

export const getTopLevelFolder = (file: { name: string; uploadPath?: string }) => {
  const path = getFileListPath(file);
  const separator = path.indexOf("/");
  return separator > 0 ? path.slice(0, separator) : undefined;
};

export const getFileBaseName = (path: string) => {
  const normalized = normalizeRelativeFilePath(path);
  return normalized.split("/").pop() || normalized;
};

export const filterDuplicateUploads = (
  existing: FileListItem[],
  incoming: FileUpload[],
) => {
  const paths = new Set(existing.map(getFileListPath));
  const accepted: FileUpload[] = [];
  let duplicateCount = 0;

  incoming.forEach((file) => {
    const path = getFileListPath(file);
    if (paths.has(path)) {
      duplicateCount++;
      return;
    }
    paths.add(path);
    accepted.push(file);
  });

  return { accepted, duplicateCount };
};
