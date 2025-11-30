import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { StorageService } from "../storage/storage.service";
import { CreateSessionDto } from "./dto/create-session.dto";
import { UpdateSessionDto } from "./dto/update-session.dto";
import { QuerySessionsDto } from "./dto/query-sessions.dto";

@Injectable()
export class SessionsService {
  constructor(
    private prisma: PrismaService,
    private storageService: StorageService
  ) {}

  async create(
    userId: number,
    createSessionDto: CreateSessionDto,
    audioFile?: Express.Multer.File
  ) {
    const { text, duration, script } = createSessionDto;

    // Create session first to get ID
    const session = await this.prisma.session.create({
      data: {
        userId,
        text,
        duration,
        script: script || "lat",
      },
    });

    // If audio file exists, save it
    if (audioFile) {
      const { audioUrl, audioSize } = await this.storageService.saveAudio(
        audioFile,
        userId,
        session.id
      );

      // Update session with audio info
      await this.prisma.session.update({
        where: { id: session.id },
        data: {
          audioUrl,
          audioSize,
        },
      });

      return {
        ...session,
        audioUrl,
        audioSize,
      };
    }

    return session;
  }

  async findAll(userId: number, query: QuerySessionsDto) {
    const { page, limit, sortBy, order } = query;
    const skip = (page - 1) * limit;

    const [sessions, total] = await Promise.all([
      this.prisma.session.findMany({
        where: { userId },
        skip,
        take: limit,
        orderBy: { [sortBy]: order },
      }),
      this.prisma.session.count({ where: { userId } }),
    ]);

    return {
      data: sessions,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(userId: number, id: string) {
    const session = await this.prisma.session.findUnique({
      where: { id },
    });

    if (!session) {
      throw new NotFoundException("Session not found");
    }

    if (session.userId !== userId) {
      throw new ForbiddenException("Access denied");
    }

    return session;
  }

  async update(userId: number, id: string, updateSessionDto: UpdateSessionDto) {
    const session = await this.findOne(userId, id);

    return this.prisma.session.update({
      where: { id: session.id },
      data: updateSessionDto,
    });
  }

  async remove(userId: number, id: string) {
    const session = await this.findOne(userId, id);

    // Delete audio file if exists
    if (session.audioUrl) {
      await this.storageService.deleteAudio(session.audioUrl);
    }

    await this.prisma.session.delete({
      where: { id: session.id },
    });

    return { message: "Session deleted successfully" };
  }

  async getAudio(userId: number, id: string) {
    const session = await this.findOne(userId, id);

    if (!session.audioUrl) {
      throw new NotFoundException("Audio file not found");
    }

    return this.storageService.getAudio(session.audioUrl);
  }

  async getStats(userId: number) {
    const sessions = await this.prisma.session.findMany({
      where: { userId },
      select: {
        duration: true,
        audioSize: true,
      },
    });

    const totalSessions = sessions.length;
    const totalDuration = sessions.reduce((sum, s) => sum + s.duration, 0);
    const totalAudioSize = sessions.reduce(
      (sum, s) => sum + (s.audioSize || 0),
      0
    );
    const averageDuration =
      totalSessions > 0 ? totalDuration / totalSessions : 0;

    return {
      totalSessions,
      totalDuration,
      averageDuration,
      totalAudioSize,
    };
  }
}
