import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

@Injectable()
export class SupabaseStorageService {
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
    }
  }

  async saveAudio(
    file: Express.Multer.File,
    userId: number,
    sessionId: string
  ): Promise<{ audioUrl: string; audioSize: number }> {
    const ext = file.originalname.split(".").pop() || "webm";
    const filename = `${userId}/${sessionId}.${ext}`;

    const { data, error } = await this.supabase.storage
      .from(this.bucketName)
      .upload(filename, file.buffer, {
        contentType: file.mimetype,
        upsert: true,
      });

    if (error) {
      throw new Error(`Failed to upload file: ${error.message}`);
    }

    // Get public URL
    const { data: urlData } = this.supabase.storage
      .from(this.bucketName)
      .getPublicUrl(filename);

    return {
      audioUrl: urlData.publicUrl,
      audioSize: file.size,
    };
  }

  async getAudio(audioUrl: string): Promise<Buffer> {
    // Extract path from URL
    const path = this.extractPathFromUrl(audioUrl);

    const { data, error } = await this.supabase.storage
      .from(this.bucketName)
      .download(path);

    if (error) {
      throw new Error(`Failed to download file: ${error.message}`);
    }

    const arrayBuffer = await data.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  async deleteAudio(audioUrl: string): Promise<void> {
    const path = this.extractPathFromUrl(audioUrl);

    const { error } = await this.supabase.storage
      .from(this.bucketName)
      .remove([path]);

    if (error) {
      console.error(`Failed to delete file: ${error.message}`);
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
      return 0;
    }

    return data[0].metadata?.size || 0;
  }

  private extractPathFromUrl(url: string): string {
    // If it's already a path, return it
    if (!url.startsWith("http")) {
      return url;
    }

    // Extract path from Supabase URL
    // Format: https://[project].supabase.co/storage/v1/object/public/[bucket]/[path]
    const parts = url.split(`${this.bucketName}/`);
    return parts[1] || url;
  }
}
