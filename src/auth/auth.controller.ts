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
import { GoogleMobileAuthDto } from "./dto/google-mobile-auth.dto";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { GoogleAuthGuard } from "./guards/google-auth.guard";
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from "@nestjs/swagger";

@ApiTags("Auth")
@Controller("auth")
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post("refresh")
  @ApiOperation({ summary: "Refresh access token" })
  @ApiResponse({ status: 200, description: "Tokens refreshed successfully" })
  async refresh(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshToken(refreshTokenDto.refreshToken);
  }

  @Post("logout")
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: "Logout user" })
  @ApiResponse({ status: 200, description: "Logged out successfully" })
  async logout(@Body("refreshToken") refreshToken: string) {
    return this.authService.logout(refreshToken);
  }

  // ========== WEB GOOGLE AUTH ==========
  @Get("google")
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({ summary: "Initiate Google OAuth (Web only)" })
  async googleAuth(@Req() req) {}

  @Get("callback/google")
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({ summary: "Google OAuth callback (Web only)" })
  async googleAuthRedirect(@Req() req, @Res() res) {
    const { accessToken, refreshToken } = await this.authService.googleLogin(
      req
    );

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";

    res.redirect(
      `${frontendUrl}/auth/callback/google?accessToken=${accessToken}&refreshToken=${refreshToken}`
    );
  }

  // ========== MOBILE GOOGLE AUTH ==========
  @Post("google/mobile")
  @ApiOperation({
    summary: "Google authentication for mobile apps",
    description:
      "Accepts Google ID Token from mobile Google Sign-In SDK and returns JWT tokens",
  })
  @ApiBody({ type: GoogleMobileAuthDto })
  @ApiResponse({
    status: 200,
    description: "Successfully authenticated",
    schema: {
      properties: {
        user: {
          type: "object",
          properties: {
            id: { type: "number" },
            email: { type: "string" },
            name: { type: "string" },
            createdAt: { type: "string" },
            picture: { type: "string" },
          },
        },
        accessToken: { type: "string" },
        refreshToken: { type: "string" },
      },
    },
  })
  @ApiResponse({ status: 401, description: "Invalid Google token" })
  async googleMobileAuth(@Body() googleMobileAuthDto: GoogleMobileAuthDto) {
    return this.authService.googleMobileLogin(
      googleMobileAuthDto.idToken,
      googleMobileAuthDto.platform
    );
  }

  @Get("me")
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: "Get current user info" })
  @ApiResponse({ status: 200, description: "User info retrieved" })
  async getCurrentUser(@Req() req) {
    return this.authService.getCurrentUser(req.user.id);
  }
}
