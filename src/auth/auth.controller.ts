import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Req,
  Res,
} from "@nestjs/common";
import { AuthService } from "./auth.service";

import { RefreshTokenDto } from "./dto/refresh-token.dto";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { GoogleAuthGuard } from "./guards/google-auth.guard";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";

@Controller("auth")
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post("refresh")
  async refresh(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshToken(refreshTokenDto.refreshToken);
  }

  @Post("logout")
  @UseGuards(JwtAuthGuard)
  async logout(@Body("refreshToken") refreshToken: string) {
    return this.authService.logout(refreshToken);
  }

  @Get("google")
  @UseGuards(GoogleAuthGuard)
  async googleAuth(@Req() req) {}

  @Get("callback/google")
  @UseGuards(GoogleAuthGuard)
  async googleAuthRedirect(@Req() req, @Res() res) {
    const { accessToken, refreshToken } = await this.authService.googleLogin(
      req
    );

    // Determine frontend URL based on environment or some logic
    // For now, I'll use a default or env var.
    // Since I can't read .env, I'll assume the user will set FRONTEND_URL.
    // If not set, I'll default to localhost for dev.
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";

    res.redirect(
      `${frontendUrl}/auth/callback/google?accessToken=${accessToken}&refreshToken=${refreshToken}`
    );
  }

  @Get("me")
  @UseGuards(JwtAuthGuard)
  async getCurrentUser(@Req() req) {
    return this.authService.getCurrentUser(req.user.id);
  }
}
