import { IsNotEmpty, IsString, IsOptional } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class GoogleMobileAuthDto {
  @ApiProperty({
    description: "Google ID Token received from mobile Google Sign-In SDK",
    example: "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IjEifQ...",
  })
  @IsNotEmpty()
  @IsString()
  idToken: string;

  @ApiProperty({
    description: "Platform identifier (android or ios)",
    example: "android",
    required: false,
  })
  @IsOptional()
  @IsString()
  platform?: "android" | "ios";
}
