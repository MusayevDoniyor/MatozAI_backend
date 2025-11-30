import { Injectable, Inject, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as fs from "fs";
import * as path from "path";

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
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

    this.logger.log(
      `Storage initialized: type=${this.storageType}, dir=${this.uploadDir}`
    );

    if (this.storageType === "local") {
      this.ensureUploadDir();
    } else if (this.storageType === "supabase") {
      if (this.supabaseStorage) {
        this.logger.log("Supabase Storage is configured");
      } else {
        this.logger.warn(
          "Supabase Storage type selected but service not available"
        );
      }
    }
  }

  private ensureUploadDir() {
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
      this.logger.log(`Created upload directory: ${this.uploadDir}`);
    }
  }

  async saveAudio(
    file: Express.Multer.File,
    userId: number,
    sessionId: string
  ): Promise<{ audioUrl: string; audioSize: number }> {
    this.logger.log(
      `Saving audio: storage=${this.storageType}, userId=${userId}, sessionId=${sessionId}, size=${file.size}`
    );

    if (this.storageType === "supabase" && this.supabaseStorage) {
      try {
        const result = await this.supabaseStorage.saveAudio(
          file,
          userId,
          sessionId
        );
        this.logger.log(`Audio saved to Supabase: ${result.audioUrl}`);
        return result;
      } catch (error) {
        this.logger.error("Supabase upload failed:", error);
        throw error;
      }
    }

    // Local storage
    const userDir = path.join(this.uploadDir, userId.toString());

    if (!fs.existsSync(userDir)) {
      fs.mkdirSync(userDir, { recursive: true });
      this.logger.debug(`Created user directory: ${userDir}`);
    }

    const ext = path.extname(file.originalname) || ".webm";
    const filename = `${sessionId}${ext}`;
    const filepath = path.join(userDir, filename);

    fs.writeFileSync(filepath, file.buffer);
    this.logger.log(`Audio saved locally: ${filepath}`);

    return {
      audioUrl: `${userId}/${filename}`,
      audioSize: file.size,
    };
  }

  async getAudio(audioUrl: string): Promise<Buffer> {
    this.logger.debug(
      `Getting audio: storage=${this.storageType}, url=${audioUrl}`
    );

    if (this.storageType === "supabase" && this.supabaseStorage) {
      try {
        const buffer = await this.supabaseStorage.getAudio(audioUrl);
        this.logger.log(
          `Audio retrieved from Supabase: ${audioUrl}, size=${buffer.length}`
        );
        return buffer;
      } catch (error) {
        this.logger.error(`Supabase download failed for ${audioUrl}:`, error);
        throw error;
      }
    }

    // Local storage
    const filepath = path.join(this.uploadDir, audioUrl);

    if (!fs.existsSync(filepath)) {
      this.logger.error(`Audio file not found: ${filepath}`);
      throw new Error("Audio file not found");
    }

    const buffer = fs.readFileSync(filepath);
    this.logger.log(
      `Audio retrieved locally: ${filepath}, size=${buffer.length}`
    );
    return buffer;
  }

  async deleteAudio(audioUrl: string): Promise<void> {
    this.logger.log(
      `Deleting audio: storage=${this.storageType}, url=${audioUrl}`
    );

    if (this.storageType === "supabase" && this.supabaseStorage) {
      try {
        await this.supabaseStorage.deleteAudio(audioUrl);
        this.logger.log(`Audio deleted from Supabase: ${audioUrl}`);
        return;
      } catch (error) {
        this.logger.error(`Supabase delete failed for ${audioUrl}:`, error);
        // Continue to try local delete as fallback
      }
    }

    // Local storage
    const filepath = path.join(this.uploadDir, audioUrl);

    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
      this.logger.log(`Audio deleted locally: ${filepath}`);
    } else {
      this.logger.warn(`Audio file not found for deletion: ${filepath}`);
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
