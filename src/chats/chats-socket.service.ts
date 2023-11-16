import { Injectable } from "@nestjs/common";
import { ChatsService } from "./chats.service";
import { Socket } from 'socket.io';
import { ChannelConfig } from "./entities/channel-config.entity";
import { UsersService } from "src/users/users.service";


@Injectable()
export class ChatsSocketService {
  private chatRoomList: Record<string, chatRoomListDTO>;
  constructor(
    private readonly chatsService: ChatsService,
    private readonly usersService: UsersService
  ) {
    this.chatRoomList = {
      'room:lobby': {
        roomId: 'room:lobby',
        chat: null,
      },
    };
  }

  async sendMessage(client: Socket, message) {
    const chatLogRequest = {
      channelId: message.channelId,
      userId: message.userId,
      content: message.content
    }
    const log = await this.chatsService.createChatLogInfo(chatLogRequest);
    return (log);
  }

  async createChatRoom(client: Socket, channelId: number, userId: number) {
    const chat = await this.chatsService.readOnePureChannelConfig(channelId);
    const roomId = channelId.toString();
    const player = await this.usersService.readOnePurePlayer(userId);

    this.chatRoomList[roomId] = {
      roomId,
      chat,
    };
  }

  async enterChatRoom(client: Socket, channelId: number, userId: number) {
    const roomId = channelId.toString();
    const player = await this.usersService.readOnePurePlayer(userId);

    const channelMemberRequest = {
      channelId: channelId,
      userId: userId,
      op: false
    }
    await this.chatsService.createChannelMember(channelMemberRequest);

    // room이 없는 경우 새로 만듬
    if (!this.getChatRoom(roomId)) {
      await this.createChatRoom(client, channelId, userId);
    }

    this.connectChatRoom(client, channelId, userId);

    const { chat } = this.getChatRoom(roomId);

    // memlist 동기화 하는거 추가 해야함
    // channellist 동기화 하는거 추가 해야함
    
    client.to(roomId).emit('JOIN', {
      id: null,
      nickname: '안내',
      message: `${player.name}님이 ${chat.title}방에 입장하셨습니다.`,
    });
  }

  async createAndEnterChatRoom(client: Socket, channelId: number, userId: number) {
    const roomId = channelId.toString();
    const player = await this.usersService.readOnePurePlayer(userId);

    const channelMemberRequest = {
      channelId: channelId,
      userId: userId,
      op: true
    }
    await this.chatsService.createChannelMember(channelMemberRequest);

    this.createChatRoom(client, channelId, userId);

    this.connectChatRoom(client, channelId, userId);

    const { chat } = this.getChatRoom(roomId);
    
    client.to(roomId).emit('JOIN', {
      id: null,
      nickname: '안내',
      message: `${player.name}님이 ${chat.title}방에 입장하셨습니다.`,
    });
  }

  async connectChatRoom(client: Socket, channelId: number, userId: number) {
    const roomId = channelId.toString();
    client.data.roomId = roomId;
    client.rooms.clear();
    client.rooms.add(roomId);
    client.join(roomId);

    // 최근 chat_log 50개 전달
    let log = await this.chatsService.readLatestChatLog(channelId);
    client.emit('LOADCHAT', log);
  }

  async exitChatRoom(client: Socket, channelId: number, userId: number) {
    const player = await this.usersService.readOnePurePlayer(userId);
    const roomId = channelId.toString();
    client.data.roomId = 'room:lobby';
    client.rooms.clear();
    client.rooms.add('room:lobby');
    client.join('room:lobby');
    client.to(roomId).emit('QUIT', {
      id: null,
      nickname: '안내',
      message: `${player.name}님이 퇴장하셨습니다.`,
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
  chat: ChannelConfig
}