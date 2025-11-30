import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
  UseInterceptors,
  UploadedFile,
  Res,
  ParseUUIDPipe,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { Response } from "express";
import { SessionsService } from "./sessions.service";
import { CreateSessionDto } from "./dto/create-session.dto";
import { UpdateSessionDto } from "./dto/update-session.dto";
import { QuerySessionsDto } from "./dto/query-sessions.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";

@Controller("sessions")
@UseGuards(JwtAuthGuard)
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Post()
  @UseInterceptors(FileInterceptor("audioBlob"))
  async create(
    @Request() req,
    @Body() createSessionDto: CreateSessionDto,
    @UploadedFile() file?: Express.Multer.File
  ) {
    return this.sessionsService.create(req.user.id, createSessionDto, file);
  }

  @Get()
  async findAll(@Request() req, @Query() query: QuerySessionsDto) {
    return this.sessionsService.findAll(req.user.id, query);
  }

  @Get("stats")
  async getStats(@Request() req) {
    return this.sessionsService.getStats(req.user.id);
  }

  @Get(":id")
  async findOne(@Request() req, @Param("id", ParseUUIDPipe) id: string) {
    return this.sessionsService.findOne(req.user.id, id);
  }

  @Get(":id/audio")
  async getAudio(
    @Request() req,
    @Param("id", ParseUUIDPipe) id: string,
    @Res() res: Response
  ) {
    const audioBuffer = await this.sessionsService.getAudio(req.user.id, id);

    res.set({
      "Content-Type": "audio/webm",
      "Content-Length": audioBuffer.length.toString(),
      "Accept-Ranges": "bytes",
      "Cache-Control": "public, max-age=31536000",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    });

    res.send(audioBuffer);
  }

  @Patch(":id")
  async update(
    @Request() req,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() updateSessionDto: UpdateSessionDto
  ) {
    return this.sessionsService.update(req.user.id, id, updateSessionDto);
  }

  @Delete(":id")
  async remove(@Request() req, @Param("id", ParseUUIDPipe) id: string) {
    return this.sessionsService.remove(req.user.id, id);
  }
}
