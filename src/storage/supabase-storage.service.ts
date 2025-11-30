import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

@Injectable()
export class SupabaseStorageService {
  private readonly logger = new Logger(SupabaseStorageService.name);
  private supabase: SupabaseClient;
  private bucketName: string;

  constructor(private configService: ConfigService) {
    const supabaseUrl = this.configService.get<string>("SUPABASE_URL");
    const supabaseKey = this.configService.get<string>(
      "SUPABASE_SERVICE_ROLE_KEY"
    );
    this.bucketName =
      this.configService.get<string>("SUPABASE_STORAGE_BUCKET") ||
      "matozai-audio";

    if (supabaseUrl && supabaseKey) {
      this.supabase = createClient(supabaseUrl, supabaseKey);
      this.logger.log(
        `Supabase Storage initialized: bucket=${this.bucketName}`
      );
    } else {
      this.logger.warn("Supabase credentials not configured");
    }
  }

  async saveAudio(
    file: Express.Multer.File,
    userId: number,
    sessionId: string
  ): Promise<{ audioUrl: string; audioSize: number }> {
    const ext = file.originalname.split(".").pop() || "webm";
    const filename = `${userId}/${sessionId}.${ext}`;

    this.logger.log(`Uploading to Supabase: ${filename}, size=${file.size}`);

    const { data, error } = await this.supabase.storage
      .from(this.bucketName)
      .upload(filename, file.buffer, {
        contentType: file.mimetype,
        upsert: true,
      });

    if (error) {
      this.logger.error(`Supabase upload error for ${filename}:`, error);
      throw new Error(`Failed to upload file: ${error.message}`);
    }

    this.logger.debug(`Upload response:`, data);

    // Get public URL
    const { data: urlData } = this.supabase.storage
      .from(this.bucketName)
      .getPublicUrl(filename);

    this.logger.log(`Public URL generated: ${urlData.publicUrl}`);

    return {
      audioUrl: urlData.publicUrl,
      audioSize: file.size,
    };
  }

  async getAudio(audioUrl: string): Promise<Buffer> {
    // Extract path from URL
    const path = this.extractPathFromUrl(audioUrl);

    this.logger.log(`Downloading from Supabase: ${path}`);

    const { data, error } = await this.supabase.storage
      .from(this.bucketName)
      .download(path);

    if (error) {
      this.logger.error(`Supabase download error for ${path}:`, error);
      throw new Error(`Failed to download file: ${error.message}`);
    }

    const arrayBuffer = await data.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    this.logger.log(`Downloaded ${buffer.length} bytes from Supabase`);
    return buffer;
  }

  async deleteAudio(audioUrl: string): Promise<void> {
    const path = this.extractPathFromUrl(audioUrl);

    this.logger.log(`Deleting from Supabase: ${path}`);

    const { error } = await this.supabase.storage
      .from(this.bucketName)
      .remove([path]);

    if (error) {
      this.logger.error(`Supabase delete error for ${path}:`, error);
    } else {
      this.logger.log(`Deleted successfully: ${path}`);
    }
  }

  async getFileSize(audioUrl: string): Promise<number> {
    const path = this.extractPathFromUrl(audioUrl);

    const { data, error } = await this.supabase.storage
      .from(this.bucketName)
      .list(path.split("/").slice(0, -1).join("/"), {
        search: path.split("/").pop(),
      });

    if (error || !data || data.length === 0) {
      this.logger.warn(`Could not get file size for ${path}`);
      return 0;
    }

    return data[0].metadata?.size || 0;
  }

  private extractPathFromUrl(url: string): string {
    // If it's already a path, return it
    if (!url.startsWith("http")) {
      this.logger.debug(`URL is already a path: ${url}`);
      return url;
    }

    // Extract path from Supabase URL
    // Format: https://[project].supabase.co/storage/v1/object/public/[bucket]/[path]
    const parts = url.split(`${this.bucketName}/`);
    const extractedPath = parts[1] || url;

    this.logger.debug(`Extracted path from URL: ${url} -> ${extractedPath}`);
    return extractedPath;
  }
}
