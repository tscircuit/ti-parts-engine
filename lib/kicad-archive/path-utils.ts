import type JSZip from "jszip";

type ZipEntryWithUnsafeOriginalName = JSZip.JSZipObject & {
  unsafeOriginalName?: string;
};

export function getArchiveFileName(archivePath: string) {
  const normalizedPath = archivePath.replace(/\/+$/, "");
  const lastSeparatorIndex = normalizedPath.lastIndexOf("/");
  return lastSeparatorIndex === -1
    ? normalizedPath
    : normalizedPath.slice(lastSeparatorIndex + 1);
}

export function getSafeArchivePath(zipEntry: JSZip.JSZipObject) {
  const unsafeOriginalName = (zipEntry as ZipEntryWithUnsafeOriginalName)
    .unsafeOriginalName;

  if (unsafeOriginalName) {
    assertSafeArchivePath(unsafeOriginalName);
  }

  assertSafeArchivePath(zipEntry.name);
  return zipEntry.name;
}

export function assertSafeArchivePath(archivePath: string) {
  if (
    archivePath.includes("\\") ||
    /^[a-zA-Z]:/.test(archivePath) ||
    archivePath.startsWith("/")
  ) {
    throw new Error(`Unsafe KiCad archive path: ${archivePath}`);
  }

  const normalizedArchiveSegments = archivePath
    .split("/")
    .filter((segment) => segment.length > 0 && segment !== ".");

  if (
    normalizedArchiveSegments.some((segment) => segment === "..") ||
    archivePath.endsWith("/..")
  ) {
    throw new Error(`Unsafe KiCad archive path: ${archivePath}`);
  }
}
