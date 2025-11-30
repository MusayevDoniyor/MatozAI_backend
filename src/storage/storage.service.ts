import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as fs from "fs";
import * as path from "path";

@Injectable()
export class StorageService {
  private uploadDir: string;

  constructor(private configService: ConfigService) {
    this.uploadDir =
      this.configService.get<string>("UPLOAD_DIR") || "./uploads";
    this.ensureUploadDir();
  }

  private ensureUploadDir() {
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async saveAudio(
    file: Express.Multer.File,
    userId: number,
    sessionId: string
  ): Promise<{ audioUrl: string; audioSize: number }> {
    const userDir = path.join(this.uploadDir, userId.toString());

    if (!fs.existsSync(userDir)) {
      fs.mkdirSync(userDir, { recursive: true });
    }

    const ext = path.extname(file.originalname) || ".webm";
    const filename = `${sessionId}${ext}`;
    const filepath = path.join(userDir, filename);

    fs.writeFileSync(filepath, file.buffer);

    return {
      audioUrl: `${userId}/${filename}`,
      audioSize: file.size,
    };
  }

  async getAudio(audioUrl: string): Promise<Buffer> {
    const filepath = path.join(this.uploadDir, audioUrl);

    if (!fs.existsSync(filepath)) {
      throw new Error("Audio file not found");
    }

    return fs.readFileSync(filepath);
  }

  async deleteAudio(audioUrl: string): Promise<void> {
    const filepath = path.join(this.uploadDir, audioUrl);

    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
    }
  }

  async getFileSize(audioUrl: string): Promise<number> {
    const filepath = path.join(this.uploadDir, audioUrl);

    if (!fs.existsSync(filepath)) {
      return 0;
    }

    const stats = fs.statSync(filepath);
    return stats.size;
  }
}
