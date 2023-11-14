import { Injectable } from "@nestjs/common";
import { ChatsService } from "./chats.service";
import { Socket } from 'socket.io';
import { ChannelConfig } from "./entities/channel-config.entity";
import { UsersService } from "src/users/users.service";
import { ChatMute } from "./entities/chat-mute.entity";
import { IoAdapter } from "@nestjs/platform-socket.io";


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

  getInfoMessage(message: string) {
    return ({
      id: null,
      user: { id: null, name: '정보', avatar: null, status: 0, date: null },
      content: message,
      date: new Date(),
    });
  }

  async sendMessage(client: Socket, message) {
    let log;
    const chatMute = await this.chatsService.readChatMute(message.channelId, message.userId);
    if (chatMute && !this.checkMuteTime(chatMute)) {
      log = this.getInfoMessage('채팅 금지로 인하여 일정 시간동안 채팅이 금지됩니다.');
      client.emit('sendMessage', log);
      return;
    }
    else if (chatMute && this.checkMuteTime(chatMute))
      this.chatsService.deleteMutenfo(chatMute.id);
    const chatLogRequest = {
      channelId: message.channelId,
      userId: message.userId,
      content: message.content
    }
    log = await this.chatsService.createChatLogInfo(chatLogRequest);
    delete log.channel;
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
    const log = this.getInfoMessage('');
    log.content = `"${userId}"님이 "${chat.title}"방에 접속하셨습니다.`;
    client.to(roomId).emit('sendMessage', log);
  }

  async enterChatRoom(client: Socket, channelId: number, userId: number) {
    const roomId = channelId.toString();
    client.data.roomId = roomId;
    client.rooms.clear();
    client.join(roomId);
    const { chat } = this.getChatRoom(roomId);
    const log = this.getInfoMessage('');
    log.content = `"${userId}"님이 "${chat.title}"방에 접속하셨습니다.`;
    client.to(roomId).emit('sendMessage', log);
  }

  exitChatRoom(client: Socket, channelId: number, userId: number) {
    const roomId = channelId.toString();
    client.rooms.clear();
    client.join(`room:lobby`);
    client.data.roomId = `room:lobby`;
    const log = this.getInfoMessage('');
    log.content = `"${userId}"님이 방에서 나가셨습니다.`;
    client.to(roomId).emit('sendMessage', log);
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
  async commendOp(client: Socket, channelId: number, target: string) {
    try {
      const user = await this.usersService.readOnePurePlayerWithName(target);
      const channelMember = await this.chatsService.readChannelMember(channelId, user.id);
      this.chatsService.updateChannelMemberOp(channelMember.id, false);
      return (`"${target}"님에게 OP 권한을 부여 하였습니다.`);
    } catch (e) {
      return (`OP 권한 부여 실패`);
    }
  }

  // kick
  async commendKick(client: Socket, channelId: number, target: string) {
    try {
      // target이 채널맴버인지 확인
      const roomId = channelId.toString();
      const channelMembers = await this.chatsService.readOneChannelMember(channelId);
      // 채널맴버, 소켓, 룸 삭제
      const member = channelMembers.find((member) => member.user.name == target);
      if (!member)
        return ('채널 맴버가 아닙니다.');
      const userSocket = await this.usersService.readUserSocket(member.user.id);
      return (userSocket.socket);
    } catch (e) {
      return ('실패');
    }
  }

  // ban
  async commendBan(client: Socket, channelId: number, target: string) {
    try {
      if (target === undefined) {
        return (this.chatsService.readBanList(channelId));
      }
      const user = await this.usersService.readOnePurePlayerWithName(target);
      const chatBan = await this.chatsService.readChatBan(channelId, user.id);
      if (chatBan)
        return ('이미 밴 목록에 추가된 유저입니다.');
      const chatBanRequest = {
        channelId: channelId,
        userId: user.id
      }
      this.chatsService.createBanInfo(chatBanRequest);
      // 이미 들어가 있는 사람은 강퇴해야함
      return ('밴 목록에 추가하였습니다.');
    } catch (e) {
      return ('실패');
    }
  }

  // unban
  async commendUnban(client: Socket, channelId: number, target: string) {
    if (target === undefined)
      return ('양식오류: /unban [username]');
    const user = await this.usersService.readOnePurePlayerWithName(target);
    const chatBan = await this.chatsService.readChatBan(channelId, user.id);
    if (!chatBan)
      return ('밴 목록에 해당하는 유저가 없습니다.');
    this.chatsService.deleteBanInfo(chatBan.id);
    return ('밴 목록에서 제거하였습니다.');
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
  async commendMute(client: Socket, channelId: number, target: string) {
    try {
      if (target === undefined)
        return ('양식오류: /mute [username]');
      const user = await this.usersService.readOnePurePlayerWithName(target);
      const chatMute = await this.chatsService.readChatMute(channelId, user.id);
      const chatMuteRequest = {
        channelId: channelId,
        userId: user.id
      }
      if (chatMute) {
        if (this.checkMuteTime(chatMute)) {
          this.chatsService.deleteMutenfo(chatMute.id);
          this.chatsService.createMuteInfo(chatMuteRequest);
          return ('해당 유저를 1분간 채팅 금지합니다.');
        }
        return ('이미 채팅 금지된 유저입니다.');
      }
      this.chatsService.createMuteInfo(chatMuteRequest);
      return ('해당 유저를 1분간 채팅 금지합니다.');
    } catch (e) {
      return ('실패');
    }
  }

  // name
  async commendName(client: Socket, channelId: number, target: string) {
    try {
      if (target == undefined)
        return ('양식오류: /name [title]');
      this.chatsService.updateChannelConfigWithTitle(channelId, target);
      // 유저한테 다시 채널 리스트 뿌리는 로직 필요
      // 
      return ('채팅방 이름을 변경하였습니다.');
    } catch (e) {
      return ('실패');
    }
  }

  // password
  async commendPassword(client: Socket, channelId: number, target: string) {
    try {
      let password = null;
      if (target !== undefined)
        password = target;
      this.chatsService.updateChannelPassword(channelId, password);
      return ('비밀번호가 성공적으로 변경되었습니다.');
    } catch (e) {
      return ('실패');
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
    const msg = this.getInfoMessage('');
    msg.content = log;
    client.emit('sendMessage', msg);
    if (error) return (false);
    return (true);
  }

  async checkOpUser(client: Socket, message) {
    const { roomId } = client.data;
    const channelId = parseInt(roomId);
    const channelMember = await this.chatsService.readChannelMember(channelId, message.userId);

    if (!channelMember.op) {
      const msg = this.getInfoMessage('OP 권한이 필요합니다.');
      client.emit('sendMessage', msg);
    }
    return (channelMember.op);
  }
}

export class chatRoomListDTO {
  roomId: string;
  cheifId: string;
  chat: ChannelConfig
}