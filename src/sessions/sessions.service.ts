import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { StorageService } from "../storage/storage.service";
import { CreateSessionDto } from "./dto/create-session.dto";
import { UpdateSessionDto } from "./dto/update-session.dto";
import { QuerySessionsDto } from "./dto/query-sessions.dto";

@Injectable()
export class SessionsService {
  private readonly logger = new Logger(SessionsService.name);

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

    this.logger.log(`Creating session for user ${userId}`);
    this.logger.debug(
      `Session data: text length=${text.length}, duration=${duration}, script=${script}`
    );

    // Create session first to get ID
    const session = await this.prisma.session.create({
      data: {
        userId,
        text,
        duration,
        script: script || "lat",
      },
    });

    this.logger.log(`Session created with ID: ${session.id}`);

    // If audio file exists, save it
    if (audioFile) {
      this.logger.log(
        `Uploading audio file: ${audioFile.originalname}, size: ${audioFile.size} bytes`
      );

      try {
        const { audioUrl, audioSize } = await this.storageService.saveAudio(
          audioFile,
          userId,
          session.id
        );

        this.logger.log(
          `Audio uploaded successfully. URL: ${audioUrl}, Size: ${audioSize}`
        );

        // Update session with audio info
        await this.prisma.session.update({
          where: { id: session.id },
          data: {
            audioUrl,
            audioSize,
          },
        });

        this.logger.log(`Session ${session.id} updated with audio info`);

        return {
          ...session,
          audioUrl,
          audioSize,
        };
      } catch (error) {
        this.logger.error(
          `Failed to upload audio for session ${session.id}:`,
          error
        );
        throw error;
      }
    }

    this.logger.log(`Session ${session.id} created without audio`);
    return session;
  }

  async findAll(userId: number, query: QuerySessionsDto) {
    const { page, limit, sortBy, order } = query;
    const skip = (page - 1) * limit;

    this.logger.debug(
      `Fetching sessions for user ${userId}: page=${page}, limit=${limit}`
    );

    const [sessions, total] = await Promise.all([
      this.prisma.session.findMany({
        where: { userId },
        skip,
        take: limit,
        orderBy: { [sortBy]: order },
      }),
      this.prisma.session.count({ where: { userId } }),
    ]);

    this.logger.log(
      `Found ${sessions.length} sessions (total: ${total}) for user ${userId}`
    );

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
    this.logger.debug(`Fetching session ${id} for user ${userId}`);

    const session = await this.prisma.session.findUnique({
      where: { id },
    });

    if (!session) {
      this.logger.warn(`Session ${id} not found`);
      throw new NotFoundException("Session not found");
    }

    if (session.userId !== userId) {
      this.logger.warn(
        `User ${userId} attempted to access session ${id} owned by user ${session.userId}`
      );
      throw new ForbiddenException("Access denied");
    }

    this.logger.log(`Session ${id} retrieved successfully`);
    return session;
  }

  async update(userId: number, id: string, updateSessionDto: UpdateSessionDto) {
    const session = await this.findOne(userId, id);

    this.logger.log(`Updating session ${id}`);

    const updated = await this.prisma.session.update({
      where: { id: session.id },
      data: updateSessionDto,
    });

    this.logger.log(`Session ${id} updated successfully`);
    return updated;
  }

  async remove(userId: number, id: string) {
    const session = await this.findOne(userId, id);

    this.logger.log(`Deleting session ${id}`);

    // Delete audio file if exists
    if (session.audioUrl) {
      this.logger.debug(`Deleting audio file: ${session.audioUrl}`);
      try {
        await this.storageService.deleteAudio(session.audioUrl);
        this.logger.log(`Audio file deleted: ${session.audioUrl}`);
      } catch (error) {
        this.logger.error(
          `Failed to delete audio file ${session.audioUrl}:`,
          error
        );
      }
    }

    await this.prisma.session.delete({
      where: { id: session.id },
    });

    this.logger.log(`Session ${id} deleted successfully`);
    return { message: "Session deleted successfully" };
  }

  async getAudio(userId: number, id: string) {
    const session = await this.findOne(userId, id);

    if (!session.audioUrl) {
      this.logger.warn(`Session ${id} has no audio file`);
      throw new NotFoundException("Audio file not found");
    }

    this.logger.log(`Fetching audio for session ${id}: ${session.audioUrl}`);

    try {
      const audioBuffer = await this.storageService.getAudio(session.audioUrl);
      this.logger.log(
        `Audio retrieved successfully for session ${id}, size: ${audioBuffer.length} bytes`
      );
      return audioBuffer;
    } catch (error) {
      this.logger.error(`Failed to retrieve audio for session ${id}:`, error);
      throw error;
    }
  }

  async getStats(userId: number) {
    this.logger.debug(`Calculating stats for user ${userId}`);

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

    this.logger.log(
      `Stats calculated for user ${userId}: ${totalSessions} sessions, ${totalDuration}s total`
    );

    return {
      totalSessions,
      totalDuration,
      averageDuration,
      totalAudioSize,
    };
  }
}
