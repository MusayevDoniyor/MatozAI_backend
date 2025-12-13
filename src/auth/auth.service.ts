import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../prisma/prisma.service";
import { OAuth2Client } from "google-auth-library";

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService
  ) {}

  async refreshToken(refreshToken: string) {
    // Find refresh token
    const tokenRecord = await this.prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (!tokenRecord) {
      throw new UnauthorizedException("Invalid refresh token");
    }

    // Check if expired
    if (new Date() > tokenRecord.expiresAt) {
      await this.prisma.refreshToken.delete({
        where: { id: tokenRecord.id },
      });
      throw new UnauthorizedException("Refresh token expired");
    }

    // Generate new tokens
    const tokens = await this.generateTokens(tokenRecord.userId);

    // Delete old refresh token
    await this.prisma.refreshToken.delete({
      where: { id: tokenRecord.id },
    });

    return tokens;
  }

  async logout(refreshToken: string) {
    await this.prisma.refreshToken.deleteMany({
      where: { token: refreshToken },
    });

    return { message: "Logged out successfully" };
  }

  async getCurrentUser(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException();
    }

    return user;
  }

  private async generateTokens(userId: number) {
    const payload = { sub: userId };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: this.configService.get<string>("JWT_ACCESS_EXPIRY"),
    });

    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: this.configService.get<string>("JWT_REFRESH_EXPIRY"),
    });

    // Save refresh token to database
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    await this.prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId,
        expiresAt,
      },
    });

    return {
      accessToken,
      refreshToken,
    };
  }

  async googleLogin(req) {
    if (!req.user) {
      throw new BadRequestException("No user from google");
    }

    const { email, firstName, lastName, googleId } = req.user;

    // Check if user exists
    let user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Create new user
      user = await this.prisma.user.create({
        data: {
          email,
          name: `${firstName} ${lastName}`,
          googleId,
          // Password is optional now, so we can skip it or set a random one if needed.
          // Since we made it optional in schema, we can skip.
        },
      });
    } else if (!user.googleId) {
      // If user exists but doesn't have googleId, update it
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: { googleId },
      });
    }

    if (!user.isActive) {
      throw new UnauthorizedException("Account is inactive");
    }

    // Generate tokens
    const tokens = await this.generateTokens(user.id);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt,
      },
      ...tokens,
    };
  }

  /**
   * Mobile app uchun Google authentication
   * Mobile app ID Token yuboradi, bu method uni verify qiladi
   */
  async googleMobileLogin(idToken: string, platform?: "android" | "ios") {
    const client = new OAuth2Client(
      this.configService.get<string>("GOOGLE_CLIENT_ID")
    );

    try {
      // ID Token ni verify qilish
      const ticket = await client.verifyIdToken({
        idToken,
        audience: [
          this.configService.get<string>("GOOGLE_CLIENT_ID"),
          // Mobile client ID larni ham qo'shish mumkin
          this.configService.get<string>("GOOGLE_ANDROID_CLIENT_ID") || "",
          this.configService.get<string>("GOOGLE_IOS_CLIENT_ID") || "",
        ].filter(Boolean),
      });

      const payload = ticket.getPayload();

      if (!payload) {
        throw new UnauthorizedException("Invalid Google token");
      }

      const {
        email,
        given_name,
        family_name,
        sub: googleId,
        picture,
      } = payload;

      if (!email) {
        throw new BadRequestException("Email not provided by Google");
      }

      // Check if user exists
      let user = await this.prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        // Create new user
        user = await this.prisma.user.create({
          data: {
            email,
            name:
              `${given_name || ""} ${family_name || ""}`.trim() ||
              email.split("@")[0],
            googleId,
          },
        });
      } else if (!user.googleId) {
        // If user exists but doesn't have googleId, update it
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: { googleId },
        });
      }

      if (!user.isActive) {
        throw new UnauthorizedException("Account is inactive");
      }

      // Generate tokens
      const tokens = await this.generateTokens(user.id);

      return {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          createdAt: user.createdAt,
          picture, // Profile picture from Google
        },
        ...tokens,
      };
    } catch (error) {
      if (
        error instanceof UnauthorizedException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new UnauthorizedException("Failed to verify Google token");
    }
  }
}
