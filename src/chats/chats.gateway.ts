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
import { GamesGateway } from 'src/games/games.gateway';
import { forwardRef, Inject } from '@nestjs/common';
import { LobbyGateway } from 'src/sockets/lobby/lobby.gateway';
import { Player } from 'src/users/entities/player.entity';
import { FriendRequest } from 'src/users/entities/friend-request.entity';
import { GameRequest } from 'src/games/entities/game-request';

@WebSocketGateway(3131, { cors: '*', namespace: '/chats' })
export class ChatsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(
    private readonly chatsSocketService: ChatsSocketService,
    private readonly chatsService: ChatsService,
    private readonly usersService: UsersService,
    @Inject(forwardRef(() => GamesGateway))
    private readonly gamesGateway: GamesGateway,
    @Inject(forwardRef(() => LobbyGateway))
    private readonly lobbyGateway: LobbyGateway,) {
      this.clients = new Map<number, Socket>();
    }
  @WebSocketServer()
  server: Server;
  clients: Map<number, Socket>;

  //소켓 연결시 유저목록에 추가
  public handleConnection(client: Socket): void {
    client.leave(client.id);
    client.data.roomId = `room:lobby`;
    client.join('room:lobby');
    console.log('chat connected', client.id);
  }

  //소켓 연결 해제시 유저목록에서 제거
  async handleDisconnect(client: Socket): Promise<void> {
    try {
      const key = client.data.userId;
      if (!key)
        return ;
      this.clients.delete(key);
      this.usersService.updatePlayerStatus(key, 3);
      this.sendUpdateToChannelMember(key);
      this.lobbyGateway.sendUpdateToFriends(key);
      console.log('chat disonnected', client.id);

    }
    catch(e) {
      console.log(e);
    }
  }

  getClientWithStatus(target: Player): Socket {
    switch (target.status) {
      case 0:
        return (this.lobbyGateway.clients.get(target.id));
      case 1:
        return (this.clients.get(target.id));
      default:
        return (null);
    }
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
    try {
      let isPassword = message.password ? false : true;
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
      this.clients.forEach((v, k, m) => this.chatsSocketService.sendChannelList(v, v.data.userId));
      this.chatsSocketService.sendChannelMember(client, newChannelConfig.id);
      this.chatsSocketService.createAndEnterChatRoom(client, roomId, message.userId);
      client.emit('HOST', {channelId: newChannelConfig.id, title: newChannelConfig.title });
    } catch (e) {
      let log;
      if (e.code === '23505')
        log = this.chatsSocketService.getNotice('중복된 이름입니다.', 39);
      else
        log = this.chatsSocketService.getNotice("DB Error", 200);
      client.emit('NOTICE', log);
    }
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

    //lobby인 경우 message.channelId === -1
    if (message.channelId < 0) {
      this.chatsSocketService.connectLobby(client, message.userId);
      return;
    }

    // 혹시 없는 channel에 join하려는 경우, client 에러임
    const channel = await this.chatsService.readOneChannelConfig(message.channelId);
    if (!channel){
      const log = this.chatsSocketService.getNotice('존재하지 않는 channel입니다.', 1);
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
      this.chatsSocketService.connectChatRoom(client, message.channelId, message.userId);
      return;
    }

    //ban list 확인
    const banUser = await this.chatsService.readBanUser(message.channelId, message.userId);
    if (banUser) {
      const log = this.chatsSocketService.getNotice('해당 channel의 ban list에 등록 되어있어 입장이 불가합니다.', 2);
      client.emit('NOTICE', log);
      return;
    }

    // 비번 확인
    if (channel.public === false && !await this.chatsService.comparePassword(message.password, message.channelId)) {
      const log = this.chatsSocketService.getNotice('비밀번호가 일치하지 않습니다.', 3);
      client.emit('NOTICE', log);
      return;
    }

    //인원 수 확인
    const current = await this.chatsService.readOnePureChannelMember(message.channelId);
    if (channel.limit === current.length) {
      const log = this.chatsSocketService.getNotice('방이 가득 찼습니다.', 4);
      client.emit('NOTICE', log);
      return;
    }

    this.chatsSocketService.enterChatRoom(client, roomId, message.userId);
  }

  @SubscribeMessage('EXIT')
  async goToLobby(client: Socket, message) {
    const channelMembers = await this.chatsService.readOneChannelMember(message.channelId);
    const member = channelMembers.find((member) => member.user.id == message.userId);
    await this.chatsService.deleteChannelMember(member.id);
    await this.chatsSocketService.kickChatRoom(client, message.channelId, message.userId);
  }

  //채팅방 나가기
  // QUIT + message : {
  //   userId: number,
  //   channelId: number,
  // }
  @SubscribeMessage('QUIT')
  async quitChatRoom(client: Socket, message) {
    const channelMembers = await this.chatsService.readOneChannelMember(message.channelId);
    if (channelMembers.length === 1) {
      // member가 1명인 상태에서 나가기 때문에 방이 같이 제거되는 경우
      const member = channelMembers.find((member) => member.user.id == message.userId);
      if (!member)
        return ('채널 맴버가 아닙니다. bug 상황');
      await this.chatsService.deleteChannelMember(member.id);
      await this.chatsService.deleteChannelConfig(message.channelId);
      this.clients.forEach(user => {
        if (user.data.userId !== client.data.userId)
          this.chatsSocketService.sendChannelList(user, user.data.userId);
      });
    }
    else {
      const member = channelMembers.find((member) => member.user.id == message.userId);
      if (!member)
        return ('채널 맴버가 아닙니다.bug 상황');
      await this.chatsService.deleteChannelMember(member.id);
    }
    await this.chatsSocketService.exitChatRoom(client, message.channelId, message.userId);
  }

  @SubscribeMessage('REGIST')
  async registUserSocket(client: Socket, userId: number) {
    try {
      this.clients.set(userId, client);
      client.data.userId = userId;
      this.usersService.updatePlayerStatus(userId, 1);
      this.sendUpdateToChannelMember(userId);
      this.lobbyGateway.sendUpdateToFriends(userId);
    }
    catch(e) {
      console.log(e.stack);
    }
  }

  @SubscribeMessage('INFO_CH_LIST')
  async sendChannelList(client: Socket, userId: number) {
    try {
      this.chatsSocketService.sendChannelList(client, userId);
    }
    catch(e) {
      console.log(e.stack);
    }
  }

  @SubscribeMessage('INFO_CH_MEMBER')
  async sendChannelMember(client: Socket, channelId: number) {
    try {
      this.chatsSocketService.sendChannelMember(client,channelId);
    }
    catch(e) {
      console.log(e.stack);
    }
  }

  @SubscribeMessage('MSG')
  async sendMessage(client: Socket, message) {
    await this.chatsSocketService.sendMessage(client, message);
  }

  @SubscribeMessage('KICK')
  async kickClient(@ConnectedSocket() client: Socket, @MessageBody() data) {
    if (!(await this.chatsSocketService.isOpUser(data.channelId, data.userId))) {
      const log = this.chatsSocketService.getNotice("OP 권한이 필요합니다.", 8);
      client.emit('NOTICE', log);
      return ;
    }
    const targetUser = await this.usersService.readOnePurePlayerWithName(data.target);
    if (!targetUser) {
      const log = this.chatsSocketService.getNotice("존재하지 않는 유저입니다.", 11);
      client.emit('NOTICE', log);
      return ;
    }
    const targetSocket = this.clients.get(targetUser.id);
    const log = await this.chatsSocketService.commandKick(client, data.channelId, targetUser.id, targetSocket);
    client.emit('NOTICE', log);
  }

  @SubscribeMessage('BAN')
  async banClient(client: Socket, data) {
    if (!(await this.chatsSocketService.isOpUser(data.channelId, data.userId))) {
      const log = this.chatsSocketService.getNotice("OP 권한이 필요합니다.", 8);
      client.emit('NOTICE', log);
      return ;
    }
    if (data.target === '') {
      await this.chatsSocketService.commandBanList(client, data.channelId);
      return ;
    }
    const log = await this.chatsSocketService.commandBan(client, data.channelId, data.target);

    // 이미 채팅방에 있으면 강퇴
    const member = await this.chatsService.readChannelMemberWithName(data.channelId, data.target);
    if (member) {
      const targetSocket = this.clients.get(member.user.id);
      await this.chatsSocketService.commandKick(client, data.channelId, member.user.id, targetSocket);
    }
    client.emit("NOTICE", log);
  }

  @SubscribeMessage('UNBAN')
  async unbanClient(client: Socket, data) {
    if (!(await this.chatsSocketService.isOpUser(data.channelId, data.userId))) {
      const log = this.chatsSocketService.getNotice("OP 권한이 필요합니다.", 8);
      client.emit('NOTICE', log);
      return ;
    }
    const log = await this.chatsSocketService.commandUnban(client, data.channelId, data.target);
    client.emit("NOTICE", log);
  }

  @SubscribeMessage('BLOCK')
  async blockClient(client: Socket, message) {
    const log = await this.chatsSocketService.commandBlock(client, message.channelId, message.userId, message.target);
    client.emit("NOTICE", log);
  }

  @SubscribeMessage('UNBLOCK')
  async unblockClient(client: Socket, data) {
    const log = await this.chatsSocketService.commandUnblock(client, data.channelId, data.userId, data.target);
    client.emit("NOTICE", log);
  }

  @SubscribeMessage('MUTE')
  async muteClient(client: Socket, data) {
    const roomId = data.channelId.toString();
    if (!(await this.chatsSocketService.isOpUser(data.channelId, data.userId))) {
      const log = this.chatsSocketService.getNotice("OP 권한이 필요합니다.", 8);
      client.emit('NOTICE', log);
      return ;
    }
    try {
      const log = await this.chatsSocketService.commandMute(client, data.channelId, data.target);
      const msg = this. chatsSocketService.getNotice(`${data.target}의 채팅이 1분간 금지됩니다.`,21);
      client.emit('NOTICE', log);
      client.join(client.id);
      client.broadcast.to(roomId).emit('NOTICE', msg);
      client.leave(client.id);
    } catch(e) {
      const log = this.chatsSocketService.getNotice("DB Error", 200);
      client.emit("NOTICE", log);
    }
  }

  @SubscribeMessage('PASS')
  async updatePasswordWithChannel(client: Socket, data) {
    if (!(await this.chatsSocketService.isOpUser(data.channelId, data.userId))) {
      const log = this.chatsSocketService.getNotice("OP 권한이 필요합니다.", 8);
      client.emit('NOTICE', log);
      return ;
    }
    const emit = await this.chatsSocketService.commandPassword(client, data.channelId, data.target);
    client.emit("NOTICE", emit);
  }

  @SubscribeMessage('OP')
  async setOpClient(client: Socket, data) {
    const roomId = data.channelId.toString();
    if (!(await this.chatsSocketService.isOpUser(data.channelId, data.userId))) {
      const log = this.chatsSocketService.getNotice("OP 권한이 필요합니다.", 8);
      client.emit('NOTICE', 8);
      return ;
    }
    const msg = await this.chatsSocketService.commandOp(client, data.channelId, data.target);
    const log = this.chatsSocketService.getNotice(`${data.target}님이 op권한을 획득했습니다.`, 36);
    this.chatsSocketService.sendChannelMember(client, data.channelId);
    client.emit("NOTICE", msg);
    client.join(client.id);
    client.to(roomId).emit("NOTICE", log);
    client.leave(client.id);
  }

  @SubscribeMessage('INVITE')
  async invateGame(client: Socket, data) {
    let msg;
    const target = await this.usersService.readOnePurePlayerWithName(data.target);
    if (!target) {
      const log = this.chatsSocketService.getNotice("해당 유저는 존재하지 않습니다.", 11);
      client.emit("NOTICE", log);
      return;
    }
    const targetClient = this.getClientWithStatus(target);
    if (!targetClient) {
      if (target.status === 2)
        msg = this.chatsSocketService.getNotice("해당 유저는 이미 게임중 입니다.", 23);
      else
        msg = this.chatsSocketService.getNotice("해당 유저는 접속중이 아닙니다.", 24);
      client.emit("NOTICE", msg);
      return;
    }
    this.chatsSocketService.inviteGame(targetClient, data.userId, target);
    msg = this.chatsSocketService.getNotice("게임초대 메시지를 전송하였습니다.", 25);
    client.emit("NOTICE", msg);
  }


  @SubscribeMessage('ACCEPT_GAME')
  async acceptGame(client: Socket, data: Partial<GameRequest>) {
    const target = await this.usersService.readOnePurePlayer(data.send.id);
    let msg;
    const targetClient = this.getClientWithStatus(target);
    if (!targetClient) {
      if (target.status === 2)
        msg = this.chatsSocketService.getNotice("해당 유저는 이미 게임중 입니다.", 23);
      else
        msg = this.chatsSocketService.getNotice("해당 유저는 접속중이 아닙니다.", 24);
      client.emit("NOTICE", msg);
      return;
    }
    this.chatsSocketService.acceptGame(client, targetClient, data);
  }

  @SubscribeMessage('REFUSE_GAME')
  async refuseGame(client: Socket, data: Partial<GameRequest>) {
    const target = await this.usersService.readOnePurePlayer(data.send.id);
    const targetClient = this.getClientWithStatus(target);
    this.chatsSocketService.refuseGame(client, targetClient, data, target);
  }

  async sendUpdateToChannelMember(userId: number) {
    this.chatsSocketService.sendUpdateToChannelMember(this.server, userId);
  }

  @SubscribeMessage('REQUEST_FRIEND')
  async requestFriend(client: Socket, data) {
    let msg;
    try {
      const target = await this.usersService.readOnePurePlayerWithName(data.target);
      if (!target) {
        msg = this.chatsSocketService.getNotice("해당 유저는 존재하지 않습니다.", 11);
        client.emit("NOTICE", msg);
        return;
      }
      const targetClient = this.getClientWithStatus(target);
      this.chatsSocketService.requestFriend(client, targetClient, data.userId, target);
    }
    catch (e) {
      msg = this.chatsSocketService.getNotice("DB error", 200);
      client.emit("NOTICE", msg);
      return;
    }   
  }

  @SubscribeMessage('ACCEPT_FRIEND')
  async acceptFriend(client: Socket, data: Partial<FriendRequest>) {
    const target = await this.usersService.readOnePurePlayer(data.send.id);
    const targetClient = this.getClientWithStatus(target);
    this.chatsSocketService.acceptFriend(client, targetClient, data, target);
  }

  @SubscribeMessage('REFUSE_FRIEND')
  async refuseFriend(client: Socket, data: Partial<FriendRequest>) {
    const target = await this.usersService.readOnePurePlayer(data.send.id);
    const targetClient = this.getClientWithStatus(target);
    this.chatsSocketService.refuseFriend(client, targetClient, data, target);
  }
}