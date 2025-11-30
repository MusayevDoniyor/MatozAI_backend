import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  },
  namespace: "/ws",
})
export class WebsocketGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private userSockets = new Map<number, Socket>();

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth.token?.replace("Bearer ", "");

      if (!token) {
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token, {
        secret: this.configService.get<string>("JWT_SECRET"),
      });

      const userId = payload.sub;
      this.userSockets.set(userId, client);

      console.log(`User ${userId} connected`);
    } catch (error) {
      console.error("WebSocket auth error:", error);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    for (const [userId, socket] of this.userSockets.entries()) {
      if (socket.id === client.id) {
        this.userSockets.delete(userId);
        console.log(`User ${userId} disconnected`);
        break;
      }
    }
  }

  @SubscribeMessage("join_session")
  handleJoinSession(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { sessionId: string }
  ) {
    client.join(`session:${data.sessionId}`);
    client.emit("session_joined", {
      sessionId: data.sessionId,
      message: "Successfully joined session",
    });
  }

  @SubscribeMessage("leave_session")
  handleLeaveSession(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { sessionId: string }
  ) {
    client.leave(`session:${data.sessionId}`);
  }

  @SubscribeMessage("transcription_update")
  handleTranscriptionUpdate(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { sessionId: string; text: string; isFinal: boolean }
  ) {
    this.server.to(`session:${data.sessionId}`).emit("transcription_received", {
      sessionId: data.sessionId,
      text: data.text,
      isFinal: data.isFinal,
      timestamp: new Date().toISOString(),
    });
  }
}
