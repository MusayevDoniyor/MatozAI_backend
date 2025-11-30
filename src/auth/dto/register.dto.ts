import {
  IsEmail,
  IsString,
  MinLength,
  Matches,
  IsOptional,
} from "class-validator";

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message:
      "Password must contain at least 1 uppercase, 1 lowercase, and 1 number",
  })
  password: string;

  @IsOptional()
  @IsString()
  name?: string;
}
