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
  ): Promise<{ storedPath: string; mimeType: string; fileSizeBytes: number }> {
    const dir = path.join(this.uploadDir, subjectId);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const fileName = `${uuidv4()}_${file.originalname}`;
    const storedPath = path.join(dir, fileName);

    fs.writeFileSync(storedPath, file.buffer);
    this.logger.log(`Saved file to ${storedPath}`);

    return {
      storedPath,
      mimeType: file.mimetype,
      fileSizeBytes: file.size,
    };
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
