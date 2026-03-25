import path from "path";
import fs from "fs/promises";
import { createReadStream } from "fs";
import { randomUUID } from "crypto";
import type { StorageService, UploadOptions, UploadResult } from "./StorageService";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

export class LocalDiskStorage implements StorageService {
  private async ensureDir(folder = "") {
    const dir = folder ? path.join(UPLOAD_DIR, folder) : UPLOAD_DIR;
    await fs.mkdir(dir, { recursive: true });
    return dir;
  }

  async upload(file: Buffer, options: UploadOptions): Promise<UploadResult> {
    const ext = path.extname(options.originalName) || "";
    const id = randomUUID();
    const filename = `${id}${ext}`;
    const folder = options.folder ?? "";
    const dir = await this.ensureDir(folder);
    const filePath = path.join(dir, filename);

    await fs.writeFile(filePath, file);

    const storageKey = folder ? `${folder}/${filename}` : filename;
    const url = `/uploads/${storageKey}`;

    return {
      storageKey,
      url,
      size: file.length,
      mimeType: options.mimeType,
      originalName: options.originalName,
    };
  }

  async getBuffer(storageKey: string): Promise<Buffer | null> {
    try {
      return await fs.readFile(path.join(UPLOAD_DIR, storageKey));
    } catch {
      return null;
    }
  }

  async getStream(storageKey: string): Promise<ReadableStream | null> {
    const fullPath = path.join(UPLOAD_DIR, storageKey);
    try {
      await fs.access(fullPath);
      const nodeStream = createReadStream(fullPath);
      return new ReadableStream({
        start(controller) {
          nodeStream.on("data", (chunk) => controller.enqueue(chunk));
          nodeStream.on("end", () => controller.close());
          nodeStream.on("error", (err) => controller.error(err));
        },
        cancel() {
          nodeStream.destroy();
        },
      });
    } catch {
      return null;
    }
  }

  async delete(storageKey: string): Promise<void> {
    try {
      await fs.unlink(path.join(UPLOAD_DIR, storageKey));
    } catch {
      // File already gone — not an error
    }
  }

  async exists(storageKey: string): Promise<boolean> {
    try {
      await fs.access(path.join(UPLOAD_DIR, storageKey));
      return true;
    } catch {
      return false;
    }
  }
}
