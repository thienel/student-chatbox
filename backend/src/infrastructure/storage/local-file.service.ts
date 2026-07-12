import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class LocalFileService {
  private readonly logger = new Logger(LocalFileService.name);
  private readonly uploadDir: string;

  constructor(private readonly config: ConfigService) {
    this.uploadDir = this.config.get<string>('UPLOAD_DIR', './uploads');
  }

  async saveFile(
    file: Express.Multer.File,
    subjectId: string,
    mimeType: string,
  ): Promise<{ storedPath: string; mimeType: string; fileSizeBytes: number }> {
    const dir = path.join(this.uploadDir, subjectId);
    await fs.promises.mkdir(dir, { recursive: true });

    const safeOriginalName = path.basename(file.originalname).replace(/[^a-zA-Z0-9._-]/g, '_');
    const fileName = `${uuidv4()}_${safeOriginalName}`;
    const storedPath = path.join(dir, fileName);

    try {
      await fs.promises.rename(file.path, storedPath);
    } catch (error: any) {
      if (error?.code !== 'EXDEV') throw error;
      await fs.promises.copyFile(file.path, storedPath);
      await fs.promises.unlink(file.path);
    }
    this.logger.log(`Saved file to ${storedPath}`);

    return {
      storedPath,
      mimeType,
      fileSizeBytes: file.size,
    };
  }

  async discardTempFile(file: Express.Multer.File | undefined): Promise<void> {
    if (!file?.path) return;
    await fs.promises.unlink(file.path).catch(() => undefined);
  }

  async deleteFile(storedPath: string): Promise<void> {
    try {
      if (fs.existsSync(storedPath)) {
        fs.unlinkSync(storedPath);
        this.logger.log(`Deleted file: ${storedPath}`);
      }
    } catch (error) {
      this.logger.warn(`Failed to delete file ${storedPath}: ${error}`);
    }
  }
}
