import { BadRequestException } from "@nestjs/common";

export function normalizeUploadedFilePath(name: string) {
  if (typeof name !== "string" || !name.trim() || name.length > 1024) {
    throw new BadRequestException("Invalid file name");
  }

  const normalized = name.normalize("NFC").replace(/\\/g, "/");
  if (normalized.startsWith("/") || /^[a-zA-Z]:\//.test(normalized)) {
    throw new BadRequestException("Absolute file paths are not allowed");
  }

  const segments = normalized.split("/");
  if (
    segments.some(
      (segment) =>
        !segment ||
        segment === "." ||
        segment === ".." ||
        /[\u0000-\u001f\u007f]/.test(segment),
    )
  ) {
    throw new BadRequestException("Invalid relative file path");
  }

  return segments.join("/");
}

export function safeArchiveEntryPath(name: string, fallback: string) {
  try {
    return normalizeUploadedFilePath(name);
  } catch {
    const baseName = fileDownloadName(name).replace(
      /[\u0000-\u001f\u007f]/g,
      "_",
    );
    return baseName && baseName !== "." && baseName !== ".."
      ? baseName
      : fallback;
  }
}

export function fileDownloadName(name: string) {
  const normalized = String(name || "").replace(/\\/g, "/");
  return normalized.split("/").pop() || "download";
}
