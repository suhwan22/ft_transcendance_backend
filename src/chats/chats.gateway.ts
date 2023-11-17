import {
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
} from '@nestjs/websockets';

import { Server, Socket } from 'socket.io';
import { ChatsSocketService } from './chats-socket.service';
import { ChatsService } from './chats.service';
import { UsersService } from 'src/users/users.service';

@WebSocketGateway(3131, { cors: '*' })
export class ChatsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(
    private readonly chatsSocketService: ChatsSocketService,
    private readonly chatsService: ChatsService,
    private readonly usersService: UsersService) { }
  @WebSocketServer()
  server: Server;

  //소켓 연결시 유저목록에 추가
  public handleConnection(client: Socket): void {
    client.leave(client.id);
    client.data.roomId = `room:lobby`;
    client.join('room:lobby');
    console.log('connected', client.id);
  }

  //소켓 연결 해제시 유저목록에서 제거
  public handleDisconnect(client: Socket): void {
    const { roomId } = client.data;
    if (
      roomId != 'room:lobby' &&
      !this.server.sockets.adapter.rooms.get(roomId)
    ) {
      this.chatsSocketService.deleteChatRoom(roomId);
      this.server.emit(
        'getChatRoomList',
        this.chatsSocketService.getChatRoomList(),
      );
    }
    console.log('disonnected', client.id);
  }

  @SubscribeMessage('sendMessage')
  async onChat(client: Socket, message) {
    if (client.data.roomId === 'room:lobby') {
      client.broadcast.emit('getMessage', {
        channelId: null,
        userId: message.userId,
        content: message.content,
      });
      return;
    }
    if (message.content.charAt(0) === '/') {
      if ((await this.chatsSocketService.checkOpUser(client, message)))
        this.chatsSocketService.execCommand(client, message);
      return;
    }
    const log = await this.chatsSocketService.sendMessage(client, message);
  }

  //채팅방 만들면서 들어가기
  // HOST + message : {
  //   userId: number,
  //   title: string,
  //   password: string,
  //   limit: number
  // }
  @SubscribeMessage('HOST')
  async hostChatRoom(client: Socket, message) {
    let isPassword = message.password ? true : false;
    let userLimit = message.limit ? message.limit : 10;
    const channelConfigDto = {
      title: message.title,
      password: message.password,
      public: isPassword,
      limit: userLimit,
      dm: false
    }
    const newChannelConfig = await this.chatsService.createChannelConfig(channelConfigDto);
    const roomId = newChannelConfig.id;
    let log;

    this.chatsSocketService.createAndEnterChatRoom(client, roomId, message.userId);
  }

  //채팅방 들어가기
  // JOIN + message : {
  //   userId: number,
  //   channelId: number,
  //   password: string
  // }
  @SubscribeMessage('JOIN')
  async enterChatRoom(client: Socket, message) {
    const roomId = message.channelId;
    let log;

    // 혹시 없는 channel에 join하려는 경우, client 에러임
    const channel = await this.chatsService.readOneChannelConfig(message.channelId);
    if (!channel){
      const log = this.chatsSocketService.getInfoMessage('존재하지 않는 channel입니다.');
      client.emit('NOTICE', log);
      return ;
    }

    //이미 접속해있는 방 일 경우 재접속 차단
    if (client.data.roomId === roomId.toString()) {
      return;
    }

    // 맴버 조회 있으면 그냥 접속
    const isMember = await this.chatsService.readMemberInChannel(message.channelId, message.userId);
    if (isMember) {
      //이전 방이 만약 나 혼자있던 방이면 제거
      if (client.data.roomId != 'room:lobby' && this.server.sockets.adapter.rooms.get(client.data.roomId).size == 1) {
       this.chatsSocketService.deleteChatRoom(client.data.roomId);
       //이것도 작동 안함...
      }
      this.chatsSocketService.connectChatRoom(client, message.channelId, message.userId);
      return;
    }

    //ban list 확인
    const banUser = await this.chatsService.readBanUser(message.channelId, message.userId);
    if (banUser) {
      const log = this.chatsSocketService.getInfoMessage('해당 channel의 ban list에 등록 되어있어 입장이 불가합니다.');
      client.emit('NOTICE', log);
      return;
    }

    // 비번 확인
    if (channel.public === false && !await this.chatsService.comparePassword(message.password, message.channelId)) {
      const log = this.chatsSocketService.getInfoMessage('비밀번호가 일치하지 않습니다.');
      client.emit('NOTICE', log);
      return;
    }

    //인원 수 확인
    const current = await this.chatsService.readOnePureChannelMember(message.channelId);
    if (channel.limit === current.length) {
      const log = this.chatsSocketService.getInfoMessage('방이 가득 찼습니다.');
      client.emit('NOTICE', log);
      return;
    }

    //이전 방이 만약 나 혼자있던 방이면 제거
    if (client.data.roomId != 'room:lobby' && this.server.sockets.adapter.rooms.get(client.data.roomId).size == 1) {
      this.chatsSocketService.deleteChatRoom(client.data.roomId);
    }

    this.chatsSocketService.enterChatRoom(client, roomId, message.userId);
  }

  @SubscribeMessage('EXIT')
  async goToLobby(client: Socket, message) {
    this.chatsSocketService.exitChatRoom(client, message.channelId, message.userId, "강퇴되었습니다.");
  }

  //채팅방 나가기
  // QUIT + message : {
  //   userId: number,
  //   channelId: number,
  // }
  @SubscribeMessage('QUIT')
  async quitChatRoom(client: Socket, message) {
    //방이 만약 나 혼자인 방이면 제거
    if (client.data.roomId != 'room:lobby' && this.server.sockets.adapter.rooms.get(client.data.roomId).size == 1) {
      this.chatsSocketService.deleteChatRoom(client.data.roomId);
      // 외래키 되어있는거 어떻게 지우지?.. channel_config와 channel_member 지워야함
    }

    const channelMembers = await this.chatsService.readOneChannelMember(message.channelId);
    if (channelMembers.length === 1) {
      // member가 1명인 상태에서 나가기 때문에 방이 같이 제거되는 경우
      const member = channelMembers.find((member) => member.user.id == message.userId);
      if (!member)
        return ('채널 맴버가 아닙니다. bug 상황');
      await this.chatsService.deleteChannelMember(member.id);
      await this.chatsService.deleteChannelConfig(message.channelId);
    }
    else {
      const member = channelMembers.find((member) => member.user.id == message.userId);
      if (!member)
        return ('채널 맴버가 아닙니다.bug 상황');
      await this.chatsService.deleteChannelMember(member.id);
    }
    await this.chatsSocketService.exitChatRoom(client, message.channelId, message.userId, "퇴장하셨습니다.");
  }

  @SubscribeMessage('REGIST')
  async registUserSocket(client: Socket, userId: number) {
    this.usersService.updateUserSocket(userId, client.id);
  }

  @SubscribeMessage('INFO_CH_LIST')
  async sendChannelList(client: Socket, userId: number) {
    this.chatsSocketService.sendChannelList(client, userId);
  }

  @SubscribeMessage('INFO_CH_MEMBER')
  async sendChannelMember(client: Socket, channelId: number) {
    this.chatsSocketService.sendChannelMember(client,channelId);
  }

  @SubscribeMessage('MSG')
  async sendMessage(client: Socket, message) {
    await this.chatsSocketService.sendMessage(client, message);
  }

  @SubscribeMessage('KICK')
  async kickClient(@ConnectedSocket() client: Socket, @MessageBody() data) {
    if (!(await this.chatsSocketService.isOpUser(data.channelId, data.userId))) {
      const log = this.chatsSocketService.getInfoMessage("OP 권한이 필요합니다.");
      client.emit('NOTICE', log);
      return ;
    }
    const msg = await this.chatsSocketService.commandKick(client, data.channelId, data.target);
    const log = this.chatsSocketService.getInfoMessage(msg);
    client.emit('NOTICE', log);
  }

  @SubscribeMessage('BAN')
  async banClient(client: Socket, data) {
    if (!(await this.chatsSocketService.isOpUser(data.channelId, data.userId))) {
      const log = this.chatsSocketService.getInfoMessage("OP 권한이 필요합니다.");
      client.emit('NOTICE', log);
      return ;
    }
    const msg = await this.chatsSocketService.commandBan(client, data.channelId, data.target);
    if (msg) {
      const log = this.chatsSocketService.getInfoMessage(msg);
      client.emit("NOTICE", log);
    }
  }

  @SubscribeMessage('UNBAN')
  async unbanClient(client: Socket, data) {
    if (!(await this.chatsSocketService.isOpUser(data.channelId, data.userId))) {
      const log = this.chatsSocketService.getInfoMessage("OP 권한이 필요합니다.");
      client.emit('NOTICE', log);
      return ;
    }
    const msg = await this.chatsSocketService.commandUnban(client, data.channelId, data.target);
    const log = this.chatsSocketService.getInfoMessage(msg);
    client.emit("NOTICE", log);
  }


  @SubscribeMessage('BLOCK')
  async blockClient(client: Socket, message) {
    const msg = await this.chatsSocketService.commandBlock(client, message.channelId, message.userId, message.target);
    if (msg) {
      const log = this.chatsSocketService.getInfoMessage(msg);
      client.emit("NOTICE", log);
    }
  }

  @SubscribeMessage('UNBLOCK')
  async unblockClient(client: Socket, data) {
    const msg = await this.chatsSocketService.commandUnblock(client, data.channelId, data.userId, data.target);
    const log = this.chatsSocketService.getInfoMessage(msg);
    client.emit("NOTICE", log);
  }

  @SubscribeMessage('MUTE')
  async muteClient(client: Socket, data) {
    if (!(await this.chatsSocketService.isOpUser(data.channelId, data.userId))) {
      const log = this.chatsSocketService.getInfoMessage("OP 권한이 필요합니다.");
      client.emit('NOTICE', log);
      return ;
    }
    const msg = await this.chatsSocketService.commandMute(client, data.channelId, data.target);
    client.emit("NOTICE", msg);
  }

  @SubscribeMessage('PASS')
  async updatePasswordWithChannel(client: Socket, data) {
    if (!(await this.chatsSocketService.isOpUser(data.channelId, data.userId))) {
      const log = this.chatsSocketService.getInfoMessage("OP 권한이 필요합니다.");
      client.emit('NOTICE', log);
      return ;
    }
    const msg = await this.chatsSocketService.commandPassword(client, data.channelId, data.target);
    client.emit("NOTICE", msg);
  }

  @SubscribeMessage('OP')
  async setOpClient(client: Socket, data) {
    if (!(await this.chatsSocketService.isOpUser(data.channelId, data.userId))) {
      const log = this.chatsSocketService.getInfoMessage("OP 권한이 필요합니다.");
      client.emit('NOTICE', log);
      return ;
    }
    const msg = await this.chatsSocketService.commandOp(client, data.channelId, data.target);
    client.emit("NOTICE", msg);
  }
}
