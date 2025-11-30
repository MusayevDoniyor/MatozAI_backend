import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { StorageService } from "./storage.service";
import { SupabaseStorageService } from "./supabase-storage.service";

@Module({
  providers: [
    SupabaseStorageService,
    {
      provide: "SUPABASE_STORAGE",
      useFactory: (
        configService: ConfigService,
        supabaseStorage: SupabaseStorageService
      ) => {
        const storageType = configService.get<string>("STORAGE_TYPE");
        return storageType === "supabase" ? supabaseStorage : null;
      },
      inject: [ConfigService, SupabaseStorageService],
    },
    StorageService,
  ],
  exports: [StorageService],
})
export class StorageModule {}
