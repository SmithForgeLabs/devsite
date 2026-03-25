export interface UploadResult {
  storageKey: string;
  url: string;
  size: number;
  mimeType: string;
  originalName: string;
}

export interface StorageService {
  upload(file: Buffer, options: UploadOptions): Promise<UploadResult>;
  getStream(storageKey: string): Promise<ReadableStream | null>;
  getBuffer(storageKey: string): Promise<Buffer | null>;
  delete(storageKey: string): Promise<void>;
  exists(storageKey: string): Promise<boolean>;
}

export interface UploadOptions {
  originalName: string;
  mimeType: string;
  folder?: string;
}
