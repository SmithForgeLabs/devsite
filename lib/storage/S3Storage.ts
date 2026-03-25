import type { StorageService, UploadOptions, UploadResult } from "./StorageService";

export class S3Storage implements StorageService {
  constructor() {
    throw new Error(
      "S3Storage is not yet implemented. Set STORAGE_PROVIDER=postgres (default) or implement this class."
    );
  }

  async upload(_file: Buffer, _options: UploadOptions): Promise<UploadResult> {
    throw new Error("Not implemented");
  }

  async getBuffer(_storageKey: string): Promise<Buffer | null> {
    throw new Error("Not implemented");
  }

  async getStream(_storageKey: string): Promise<ReadableStream | null> {
    throw new Error("Not implemented");
  }

  async delete(_storageKey: string): Promise<void> {
    throw new Error("Not implemented");
  }

  async exists(_storageKey: string): Promise<boolean> {
    throw new Error("Not implemented");
  }
}
