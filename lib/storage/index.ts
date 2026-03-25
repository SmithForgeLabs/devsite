import type { StorageService } from "./StorageService";
import { LocalDiskStorage } from "./LocalDiskStorage";
import { S3Storage } from "./S3Storage";

function createStorageService(): StorageService {
  const provider = process.env.STORAGE_PROVIDER ?? "local";

  switch (provider) {
    case "s3":
      return new S3Storage();
    case "local":
    default:
      return new LocalDiskStorage();
  }
}

export const storage: StorageService = createStorageService();
export type { StorageService, UploadOptions, UploadResult } from "./StorageService";
