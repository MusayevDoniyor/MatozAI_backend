import { IsOptional, IsString, IsIn } from "class-validator";

export class UpdateSessionDto {
  @IsOptional()
  @IsString()
  text?: string;

  @IsOptional()
  @IsIn(["lat", "cyr"])
  script?: string;
}
