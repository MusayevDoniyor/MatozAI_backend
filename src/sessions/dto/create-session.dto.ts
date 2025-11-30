import {
  IsString,
  IsNotEmpty,
  IsNumber,
  Min,
  IsOptional,
  IsIn,
} from "class-validator";
import { Type } from "class-transformer";

export class CreateSessionDto {
  @IsString()
  @IsNotEmpty()
  text: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  duration: number;

  @IsOptional()
  @IsIn(["lat", "cyr"])
  script?: string;
}
