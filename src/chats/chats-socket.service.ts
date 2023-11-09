import { Injectable } from "@nestjs/common";
import { ChatsService } from "./chats.service";
import { Socket } from 'socket.io';
import { ChannelConfig } from "./entities/channel-config.entity";


@Injectable()
export class ChatsSocketService {
  private chatRoomList: Record<string, chatRoomListDTO>;
  constructor(
    private readonly chatsService: ChatsService,
  ) {
    this.chatRoomList = {
      'room:lobby': {
        roomId: 'room:lobby',
        chat: null,
        cheifId: null,
      },
    };
  }

  sendMessage(client: Socket, message) {
    const chatLogRequest = {
      channelId: client.data.roomId,
      userId: message.userId,
      content: message.content
    }
    this.chatsService.createChatLogInfo(chatLogRequest);
    return (chatLogRequest);
  }

  async createChatRoom(client: Socket, channelId: string, userId: string) {
    const chat = await this.chatsService.readOnePureChannelConfig(parseInt(channelId));
    const roomId = `${chat.id}`;
    this.chatRoomList[roomId] = {
      roomId,
      cheifId: client.id,
      chat,
    };
    client.data.roomId = roomId;
    client.rooms.clear();
    client.join(roomId);
    client.to(roomId).emit('getMessage', {
      id: null,
      nickname: '안내',
      message: `"${userId}"님이 "${chat.title}"방에 접속하셨습니다.`,
    });
  }

  async enterChatRoom(client: Socket, roomId: string, userId: string) {
    client.data.roomId = roomId;
    client.rooms.clear();
    client.join(roomId);
    const { chat } = this.getChatRoom(roomId);
    client.to(roomId).emit('getMessage', {
      id: null,
      nickname: '안내',
      message: `"${userId}"님이 "${chat.title}"방에 접속하셨습니다.`,
    });
  }

  exitChatRoom(client: Socket, roomId: string, userId: string) {
    client.data.roomId = `room:lobby`;
    client.rooms.clear();
    client.join(`room:lobby`);
    client.to(roomId).emit('getMessage', {
      id: null,
      nickname: '안내',
      message: '"' + userId + '"님이 방에서 나갔습니다.',
    });
  }

  getChatRoom(roomId: string): chatRoomListDTO {
    return this.chatRoomList[roomId];
  }

  getChatRoomList(): Record<string, chatRoomListDTO> {
    return this.chatRoomList;
  }

  deleteChatRoom(roomId: string) {
    delete this.chatRoomList[roomId];
  }
}

export class chatRoomListDTO {
  roomId: string;
  cheifId: string;
  chat: ChannelConfig
}