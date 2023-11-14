import { Injectable } from "@nestjs/common";
import { ChatsService } from "./chats.service";
import { Socket } from 'socket.io';
import { ChannelConfig } from "./entities/channel-config.entity";
import { UsersService } from "src/users/users.service";
import { ChatMute } from "./entities/chat-mute.entity";


@Injectable()
export class ChatsSocketService {
  private chatRoomList: Record<string, chatRoomListDTO>;

  constructor(
    private readonly chatsService: ChatsService,
    private readonly usersService: UsersService,
  ) {
    this.chatRoomList = {
      'room:lobby': {
        roomId: 'room:lobby',
        chat: null,
        cheifId: null,
      },
    };
  }

  async sendMessage(client: Socket, message) {
    const chatLogRequest = {
      channelId: message.channelId,
      userId: message.userId,
      content: message.content
    }
    const chatMute = await this.chatsService.readChatMute(message.channelId, message.userId);
    // mute
    let log;
    if (chatMute && this.checkMuteTime(chatMute)) {
      log = {
        
      }
    }
    log = await this.chatsService.createChatLogInfo(chatLogRequest);
    client.to(client.data.roomId).emit('sendMessage', log);  //전체에게 방송함
    return (log);
  }

  async createChatRoom(client: Socket, channelId: number, userId: number) {
    const chat = await this.chatsService.readOnePureChannelConfig(channelId);
    const roomId = channelId.toString();
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

  async enterChatRoom(client: Socket, channelId: number, userId: number) {
    const roomId = channelId.toString();
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

  exitChatRoom(client: Socket, channelId: number, userId: number) {
    const roomId = channelId.toString();
    client.rooms.clear();
    client.join(`room:lobby`);
    client.data.roomId = `room:lobby`;
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

  // ?
  async commendHelp(client: Socket, channelId: number, arg: string) {
    return ('명령어리스트\n' +
      '/op 유저명: 해당 유저에게 op 권한을 부여합니다.\n' +
      '/ban 유저명: 해당 유저에게 ban을 부여합니다.\n' +
      '/ban: 현재 채팅방의 밴 목록을 출력합니다.\n' +
      '/unban 유저명: 해당 유저에게 부여된 ban을 해제합니다.\n' +
      '/mute 유저명: 해당 유저에게 채팅금지를 부여합니다.(1분)\n' +
      '/name 채널명: 현재 채팅방의 이름을 변경합니다.\n' +
      '/password: 현재 채팅방의 비밀번호를 해제합니다.\n' +
      '/password 비밀번호: 현재 채팅방의 비밀번호를 변경합니다.');
  }

  // op
  async commendOp(client: Socket, channelId: number, arg: string) {
    try {
      const user = await this.usersService.readOnePurePlayerWithName(arg);
      const channelMember = await this.chatsService.readChannelMember(channelId, user.id);
      this.chatsService.updateChannelMemberOp(channelMember.id, false);
      return ('success');
    } catch (e) {
      return ('failed');
    }
  }

  // ban
  async commendBan(client: Socket, channelId: number, arg: string) {
    try {
      if (arg === undefined) {
        return (this.chatsService.readBanList(channelId));
      }
      const user = await this.usersService.readOnePurePlayerWithName(arg);
      const chatBan = await this.chatsService.readChatBan(channelId, user.id);
      if (chatBan)
        return ('failed: already exists');
      const chatBanRequest = {
        channelId: channelId,
        userId: user.id
      }
      this.chatsService.createBanInfo(chatBanRequest);
      // 이미 들어가 있는 사람은 강퇴해야함
      return ('success');
    } catch (e) {
      console.log(e);
      return ('failed');
    }
  }

  // unban
  async commendUnban(client: Socket, channelId: number, arg: string) {
    if (arg === undefined)
      return ('failed: /unban [username]');
    const user = await this.usersService.readOnePurePlayerWithName(arg);
    const chatBan = await this.chatsService.readChatBan(channelId, user.id);
    if (!chatBan)
      return ('failed: not exists');
    this.chatsService.deleteBanInfo(chatBan.id);
    return ('success');
  }

  checkMuteTime(chatMute: ChatMute) {
    const date = chatMute.date.getTime();
    const now = new Date().getTime();
    if (((now - date) / 1000) > 60) {
      return (true);
    }
    return (false);
  }

  // mute
  async commendMute(client: Socket, channelId: number, arg: string) {
    try {
      if (arg === undefined)
        return ('failed: /mute [username]');
      const user = await this.usersService.readOnePurePlayerWithName(arg);
      const chatMute = await this.chatsService.readChatMute(channelId, user.id);
      const chatMuteRequest = {
        channelId: channelId,
        userId: user.id
      }
      if (chatMute) {
        if (this.checkMuteTime(chatMute)) {
          this.chatsService.deleteMutenfo(chatMute.id);
          this.chatsService.createMuteInfo(chatMuteRequest);
          return ('success');
        }
        return ('failed: already exists');
      }
      this.chatsService.createMuteInfo(chatMuteRequest);
      return ('success');
    } catch (e) {
      return ('failed');
    }

  }

  // name
  async commendName(client: Socket, channelId: number, arg: string) {
    try {
      if (arg == undefined)
        return ('failed: /name [title]');
      this.chatsService.updateChannelConfigWithTitle(channelId, arg);
      // 유저한테 다시 채널 리스트 뿌리는 로직 필요
      // 
      return ('success');
    } catch (e) {
      return ('failed');
    }
  }

  // password
  async commendPassword(client: Socket, channelId: number, arg: string) {
    try {
      let password = null;
      if (arg !== undefined)
        password = arg;
      this.chatsService.updateChannelPassword(channelId, password);
      return ('success');
    } catch (e) {
      return ('failed');
    }
  }

  async execCommend(client: Socket, message) {
    const cmd = message.content.split(' ');
    const { roomId } = client.data;
    const channelId = parseInt(roomId);
    let log;
    let error;
    if (cmd.length > 2) {
      log = 'failed: Invaild Commend';
      error = true;
    }
    switch (cmd[0]) {
      case '/?':
        log = await this.commendHelp(client, channelId, cmd[1]);
        break;
      case '/op':
        log = await this.commendOp(client, channelId, cmd[1]);
        break;
      case '/ban':
        log = await this.commendBan(client, channelId, cmd[1]);
        break;
      case '/unban':
        log = await this.commendUnban(client, channelId, cmd[1]);
        break;
      case '/mute':
        log = await this.commendMute(client, channelId, cmd[1]);
        break;
      case '/name':
        log = await this.commendName(client, channelId, cmd[1]);
        break;
      case '/password':
        log = await this.commendPassword(client, channelId, cmd[1]);
        break;
      default:
        log = 'failed: Invaild Commend';
        error = true;
        break;
    }
    client.emit('sendMessage', {
      channelId: client.data.roomId,
      user: '정보',
      content: log,
    });
    if (error) return (false);
    return (true);
  }

  async checkOpUser(client: Socket, message) {
    const { roomId } = client.data;
    const channelId = parseInt(roomId);
    const channelMember = await this.chatsService.readChannelMember(channelId, message.userId);
    if (!channelMember.op) {
      client.emit('sendMessage', {
        channelId: client.data.roomId,
        user: '정보',
        content: 'failed: OP permission is required',
      });
    }
    return (channelMember.op);
  }
}

export class chatRoomListDTO {
  roomId: string;
  cheifId: string;
  chat: ChannelConfig
}