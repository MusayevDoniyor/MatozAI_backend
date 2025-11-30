import { Injectable, Inject } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as fs from "fs";
import * as path from "path";

@Injectable()
export class StorageService {
  private uploadDir: string;
  private storageType: string;
  private supabaseStorage: any;

  constructor(
    private configService: ConfigService,
    @Inject("SUPABASE_STORAGE") private supabaseStorageService?: any
  ) {
    this.uploadDir =
      this.configService.get<string>("UPLOAD_DIR") || "./uploads";
    this.storageType =
      this.configService.get<string>("STORAGE_TYPE") || "local";
    this.supabaseStorage = supabaseStorageService;

    if (this.storageType === "local") {
      this.ensureUploadDir();
    }
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
    if (this.storageType === "supabase" && this.supabaseStorage) {
      return this.supabaseStorage.saveAudio(file, userId, sessionId);
    }

    // Local storage
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
    if (this.storageType === "supabase" && this.supabaseStorage) {
      return this.supabaseStorage.getAudio(audioUrl);
    }

    // Local storage
    const filepath = path.join(this.uploadDir, audioUrl);

    if (!fs.existsSync(filepath)) {
      throw new Error("Audio file not found");
    }

    return fs.readFileSync(filepath);
  }

  async deleteAudio(audioUrl: string): Promise<void> {
    if (this.storageType === "supabase" && this.supabaseStorage) {
      return this.supabaseStorage.deleteAudio(audioUrl);
    }

    // Local storage
    const filepath = path.join(this.uploadDir, audioUrl);

    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
    }
  }

  async getFileSize(audioUrl: string): Promise<number> {
    if (this.storageType === "supabase" && this.supabaseStorage) {
      return this.supabaseStorage.getFileSize(audioUrl);
    }

    // Local storage
    const filepath = path.join(this.uploadDir, audioUrl);

    if (!fs.existsSync(filepath)) {
      return 0;
    }

    const stats = fs.statSync(filepath);
    return stats.size;
  }
}
