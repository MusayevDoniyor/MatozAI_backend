import { IsString, MinLength, Matches } from "class-validator";

export class ChangePasswordDto {
  @IsString()
  @MinLength(8)
  currentPassword: string;

  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message:
      "Password must contain at least 1 uppercase, 1 lowercase, and 1 number",
  })
  newPassword: string;
}
