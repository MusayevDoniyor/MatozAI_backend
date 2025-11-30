import {
  IsString,
  IsNotEmpty,
  IsNumber,
  Min,
  IsOptional,
  IsIn,
} from "class-validator";

export class CreateSessionDto {
  @IsString()
  @IsNotEmpty()
  text: string;

  @IsNumber()
  @Min(0)
  duration: number;

  @IsOptional()
  @IsIn(["lat", "cyr"])
  script?: string;
}
