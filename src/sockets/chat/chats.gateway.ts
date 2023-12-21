import {
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  WsException,
} from '@nestjs/websockets';

import { Server, Socket } from 'socket.io';
import { ChatsSocketService } from './chats-socket.service';
import { ChatsService } from '../../chats/chats.service';
import { UsersService } from 'src/users/users.service';
import { GamesGateway } from 'src/sockets/game/games.gateway';
import { forwardRef, Inject, UseFilters, UseGuards } from '@nestjs/common';
import { LobbyGateway } from 'src/sockets/lobby/lobby.gateway';
import { Player } from 'src/users/entities/player.entity';
import { FriendRequest } from 'src/users/entities/friend-request.entity';
import { GameRequest } from 'src/games/entities/game-request';

import { AuthService } from 'src/auth/auth.service';
import { JwtWsGuard } from 'src/auth/guards/jwt-ws.guard';
import { SocketExceptionFilter } from '../sockets.exception.filter';
import { STATUS } from '../sockets.type';

import { hash } from 'bcrypt';

@WebSocketGateway(3131, {
  cors: { credentials: true, origin: process.env.CALLBACK_URL },
  namespace: '/chats'
})
@UseFilters(SocketExceptionFilter)
export class ChatsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(
    private readonly chatsSocketService: ChatsSocketService,
    private readonly chatsService: ChatsService,
    private readonly usersService: UsersService,

    @Inject(forwardRef(() => AuthService))
    private readonly authServeice: AuthService,
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
  public handleConnection(client: Socket, data) {
    try {
      const status = STATUS.CHAT;
      client.data.status = status;
      const payload = this.authServeice.verifyBearTokenWithCookies(client.request.headers.cookie, "TwoFactorAuth");

      client.leave(client.id);
      client.data.roomId = `room:lobby`;
      client.join('room:lobby');
      client.data.userId = payload.sub;
      if (this.clients.get(client.data.userId))
        throw new WsException("DuplicatedAccessError");
      this.clients.set(client.data.userId, client);
      this.usersService.updatePlayerStatus(client.data.userId, status);
      this.lobbyGateway.sendUpdateToFriends(client.data.userId);
      this.sendUpdateToChannelMember(client.data.userId);
      console.log('chats connected', client.id);
    }
    catch (e) {
      if (e.name === 'JsonWebTokenError') {
        const msg = this.chatsSocketService.getNotice("Invaild Token", 201, client.data.status);
        client.emit("NOTICE", msg);
      }
      else if (e.name === 'TokenExpiredError') {
        const msg = this.chatsSocketService.getNotice("Token expired", 202, client.data.status);
        client.emit("NOTICE", msg);
      }
      else if (e.error === 'DuplicatedAccessError') {
        const msg = this.chatsSocketService.getNotice("Duplicated Access", 203, client.data.status);
        client.emit("NOTICE", msg);
      }
      else if (e.error === 'TokenExpiredError') {
        const msg = this.chatsSocketService.getNotice("Token expired", 202, client.data.status);
        client.emit("NOTICE", msg);
      }
      else {
        const msg = this.chatsSocketService.getNotice("DB Error", 200, client.data.status);
        client.emit("NOTICE", msg);
      }
    }
  }

  //소켓 연결 해제시 유저목록에서 제거
  async handleDisconnect(client: Socket): Promise<void> {
    try {
      const key = client.data.userId;
      if (!key)
        return;
      this.clients.delete(key);
      this.usersService.updatePlayerStatus(key, STATUS.OFFLINE as number);
      this.sendUpdateToChannelMember(key);
      this.lobbyGateway.sendUpdateToFriends(key);
      console.log('chat disonnected', client.id);

    }
    catch (e) {
      console.log(e);
    }
  }

  getClientWithStatus(target: Player): Socket {
    switch (target.status) {
      case STATUS.CHAT:
        return (this.clients.get(target.id));
      default:
        return (this.lobbyGateway.clients.get(target.id));
    }
  }

  //채팅방 만들면서 들어가기
  // HOST + message : {
  //   userId: number,
  //   title: string,
  //   password: string,
  //   limit: number
  // }
  @UseGuards(JwtWsGuard)
  @SubscribeMessage('HOST')
  async hostChatRoom(client: Socket, message) {
    try {
      if (message.title.length > 30) {
        let log = this.chatsSocketService.getNotice('30자 이하의 제목을 입력해주세요', 41, client.data.status);
        client.emit('NOTICE', log);
        return;
      }
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
      this.chatsSocketService.createAndEnterChatRoom(client, roomId, message.userId);
      client.emit('HOST', { channelId: newChannelConfig.id, title: newChannelConfig.title });
    } catch (e) {
      let log;
      if (e.code === '23505')
        log = this.chatsSocketService.getNotice('중복된 이름입니다.', 39, client.data.status);
      else
        log = this.chatsSocketService.getNotice("DB Error", 200, client.data.status);
      client.emit('NOTICE', log);
    }
  }

  //DM 만들면서 들어가기
  // DM + data : {
  //   userId: number,
  //   userName: string,
  //   targetId: number,
  //   targetName: string
  // }
  @UseGuards(JwtWsGuard)
  @SubscribeMessage('DM')
  async makeDMRoom(client: Socket, message) {
    try {
      const targetId: number = parseInt(message.targetId);
      const userId: number = parseInt(message.userId);
      const isExist = await this.chatsService.readDmUserWithTarget(userId, targetId);
      if (isExist.length != 0) {
        console.log(isExist);
        client.emit('DM', { channelId: isExist[0].id, title: message.targetName });
        await this.chatsSocketService.connectChatRoom(client, isExist[0].id, userId); 
        return;
      }

      const isBlock = await this.usersService.readUserBlockWithTargetId(targetId, userId);
      console.log(isBlock);
      // block 되어 있는지 확인
      if (isBlock) {
        let log = this.chatsSocketService.getNotice('상대방에게 차단 되어있습니다.', 43, client.data.status);
        client.emit('NOTICE', log);
        return;
      }

      const newTitle = await hash((message.userName + message.targetName), 10);
      const channelConfigDto = {
        title: newTitle,
        password: null,
        public: true,
        limit: 2,
        dm: true,
      }
      const newChannelConfig = await this.chatsService.createChannelConfig(channelConfigDto);
      const roomId = newChannelConfig.id;

      await this.chatsSocketService.createDMRoom(client, roomId, message);

      console.log("DM channelId:", roomId, " title: ", message.targetName);
      client.emit("DM", { channelId: roomId, title: message.targetName });
      this.chatsSocketService.sendChannelMember(client, roomId);
      const targetSocket = await this.clients.get(targetId);
      if (targetSocket) {
        await this.chatsSocketService.sendChannelList(targetSocket, targetId);
      }
      
    } catch (e) {
      console.log(e);
      let log;
      if (e.code === '23505')
        log = this.chatsSocketService.getNotice('중복된 이름입니다.', 39, client.data.status);
      else
        log = this.chatsSocketService.getNotice("DB Error", 200, client.data.status);
      client.emit('NOTICE', log);
    }
  }

  //채팅방 들어가기
  // JOIN + message : {
  //   userId: number,
  //   channelId: number,
  //   password: string
  // }
  @UseGuards(JwtWsGuard)
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
    if (!channel) {
      const log = this.chatsSocketService.getNotice('존재하지 않는 channel입니다.', 1, client.data.status);
      client.emit('NOTICE', log);
      return;
    }

    //이미 접속해있는 방 일 경우 재접속 차단
    if (client.data.roomId === roomId.toString()) {
      return;
    }

    // 맴버 조회 있으면 그냥 접속
    const isMember = await this.chatsService.readMemberInChannel(message.channelId, message.userId);
    if (isMember) {
      console.log("exist room connect");
      this.chatsSocketService.connectChatRoom(client, message.channelId, message.userId);
      return;
    }

    //ban list 확인
    const banUser = await this.chatsService.readBanUser(message.channelId, message.userId);
    if (banUser) {
      const log = this.chatsSocketService.getNotice('해당 channel의 ban list에 등록 되어있어 입장이 불가합니다.', 2, client.data.status);
      client.emit('NOTICE', log);
      return;
    }

    // 비번 확인
    if (channel.public === false && !await this.chatsService.comparePassword(message.password, message.channelId)) {
      const log = this.chatsSocketService.getNotice('비밀번호가 일치하지 않습니다.', 3, client.data.status);
      client.emit('NOTICE', log);
      return;
    }

    //인원 수 확인
    const current = await this.chatsService.readOnePureChannelMember(message.channelId);
    if (channel.limit === current.length) {
      const log = this.chatsSocketService.getNotice('방이 가득 찼습니다.', 4, client.data.status);
      client.emit('NOTICE', log);
      return;
    }

    this.chatsSocketService.enterChatRoom(client, roomId, message.userId);
  }

  @UseGuards(JwtWsGuard)
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
  @UseGuards(JwtWsGuard)
  @SubscribeMessage('QUIT')
  async quitChatRoom(client: Socket, message) {
    console.log("execute QUIT", message);
    const channelMembers = await this.chatsService.readOneChannelMemberWithDm(message.channelId);
    console.log("channel Member", channelMembers);
    if (channelMembers.length === 1) {
      console.log("dm quit 1");
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
      console.log("dm quit2");
    }
    else {
      const member = channelMembers.find((member) => member.user.id == message.userId);
      if (!member)
        return ('채널 맴버가 아닙니다.bug 상황');

      // dm인 경우
      if (member.channel.dm) {
        console.log("is Dm");
        const target = await this.chatsService.readDmTargetId(member.channel.id, client.data.userId);
        
        const targetSocket = await this.clients.get(target.user.id);

        if (!(!targetSocket)) {
          console.log("target location: ", targetSocket.data.roomId);
          console.log("Me location :", client.data.roomId);
          if (targetSocket.data.roomId === targetSocket.data.roomId)
            console.log("equal");
          if (targetSocket.data.roomId === target.channel.id.toString()) {
            console.log("in Dm target");
            targetSocket.emit('DM_QUIT', target.id);
            await this.chatsService.deleteChannelMember(member.id);
            await this.chatsSocketService.exitChatRoom(client, message.channelId, message.userId);
            return ;
          }
        }
        // 타겟이 오프라인 이거나 온라인인데 그 채팅방을 안보고 있는 경우
        const deleteResult = await this.chatsService.deleteChannelMemberWithUserId(member.channel.id, target.user.id);
        if (deleteResult.affected === 0) {
          //error 상황
          return null;
        }
        await this.chatsService.deleteChannelMember(member.id);
        await this.chatsService.deleteChannelConfig(message.channelId);
        if (targetSocket)
          await this.sendChannelList(targetSocket, target.user.id);
      }
      await this.chatsService.deleteChannelMember(member.id);
    }
    await this.chatsSocketService.exitChatRoom(client, message.channelId, message.userId);
  }

  @UseGuards(JwtWsGuard)
  @SubscribeMessage('INFO_CH_LIST')
  async sendChannelList(client: Socket, userId: number) {
    try {
      this.chatsSocketService.sendChannelList(client, userId);
    }
    catch (e) {
      console.log(e.stack);
    }
  }

  @UseGuards(JwtWsGuard)
  @SubscribeMessage('INFO_CH_MEMBER')
  async sendChannelMember(client: Socket, channelId: number) {
    try {
      this.chatsSocketService.sendChannelMember(client, channelId);
    }
    catch (e) {
      console.log(e.stack);
    }
  }

  @UseGuards(JwtWsGuard)
  @SubscribeMessage('MSG')
  async sendMessage(client: Socket, message) {
    console.log("MSG", client.data.roomId);
    await this.chatsSocketService.sendMessage(client, message);
  }

  @UseGuards(JwtWsGuard)
  @SubscribeMessage('KICK')
  async kickClient(@ConnectedSocket() client: Socket, @MessageBody() data) {
    if (!(await this.chatsSocketService.isOpUser(data.channelId, data.userId))) {
      const log = this.chatsSocketService.getNotice("OP 권한이 필요합니다.", 8, client.data.status);
      client.emit('NOTICE', log);
      return;
    }
    const targetUser = await this.usersService.readOnePurePlayerWithName(data.target);
    if (!targetUser) {
      const log = this.chatsSocketService.getNotice("존재하지 않는 유저입니다.", 11, client.data.status);
      client.emit('NOTICE', log);
      return;
    }
    const targetSocket = this.clients.get(targetUser.id);
    const log = await this.chatsSocketService.commandKick(client, data.channelId, targetUser.id, targetSocket);
    client.emit('NOTICE', log);
  }

  @UseGuards(JwtWsGuard)
  @SubscribeMessage('BAN')
  async banClient(client: Socket, data) {
    if (!(await this.chatsSocketService.isOpUser(data.channelId, data.userId))) {
      const log = this.chatsSocketService.getNotice("OP 권한이 필요합니다.", 8, client.data.status);
      client.emit('NOTICE', log);
      return;
    }
    if (data.target === '') {
      await this.chatsSocketService.commandBanList(client, data.channelId);
      return;
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

  @UseGuards(JwtWsGuard)
  @SubscribeMessage('UNBAN')
  async unbanClient(client: Socket, data) {
    if (!(await this.chatsSocketService.isOpUser(data.channelId, data.userId))) {
      const log = this.chatsSocketService.getNotice("OP 권한이 필요합니다.", 8, client.data.status);
      client.emit('NOTICE', log);
      return;
    }
    const log = await this.chatsSocketService.commandUnban(client, data.channelId, data.target);
    client.emit("NOTICE", log);
  }

  @UseGuards(JwtWsGuard)
  @SubscribeMessage('BLOCK')
  async blockClient(client: Socket, message) {
    const log = await this.chatsSocketService.commandBlock(client, message.channelId, message.userId, message.target);
    if (!log)
      return;
    client.emit("NOTICE", log);
  }

  @UseGuards(JwtWsGuard)
  @SubscribeMessage('UNBLOCK')
  async unblockClient(client: Socket, data) {
    const log = await this.chatsSocketService.commandUnblock(client, data.channelId, data.userId, data.target);
    client.emit("NOTICE", log);
  }

  @UseGuards(JwtWsGuard)
  @SubscribeMessage('MUTE')
  async muteClient(client: Socket, data) {
    const roomId = data.channelId.toString();
    if (!(await this.chatsSocketService.isOpUser(data.channelId, data.userId))) {
      const log = this.chatsSocketService.getNotice("OP 권한이 필요합니다.", 8, client.data.status);
      client.emit('NOTICE', log);
      return;
    }
    try {
      const log = await this.chatsSocketService.commandMute(client, data.channelId, data.target);
      const msg = this.chatsSocketService.getNotice(`${data.target}의 채팅이 1분간 금지됩니다.`, 21, client.data.status);
      client.emit('NOTICE', log);
      client.join(client.id);
      client.broadcast.to(roomId).emit('NOTICE', msg);
      client.leave(client.id);
    } catch (e) {
      const log = this.chatsSocketService.getNotice("DB Error", 200, client.data.status);
      client.emit("NOTICE", log);
    }
  }

  @UseGuards(JwtWsGuard)
  @SubscribeMessage('PASS')
  async updatePasswordWithChannel(client: Socket, data) {
    if (!(await this.chatsSocketService.isOpUser(data.channelId, data.userId))) {
      const log = this.chatsSocketService.getNotice("OP 권한이 필요합니다.", 8, client.data.status);
      client.emit('NOTICE', log);
      return;
    }
    const emit = await this.chatsSocketService.commandPassword(client, data.channelId, data.target);
    client.emit("NOTICE", emit);
  }

  @UseGuards(JwtWsGuard)
  @SubscribeMessage('OP')
  async setOpClient(client: Socket, data) {
    const roomId = data.channelId.toString();
    if (!(await this.chatsSocketService.isOpUser(data.channelId, data.userId))) {
      const log = this.chatsSocketService.getNotice("OP 권한이 필요합니다.", 8, client.data.status);
      client.emit('NOTICE', 8);
      return;
    }
    const msg = await this.chatsSocketService.commandOp(client, data.channelId, data.target);
    const log = this.chatsSocketService.getNotice(`${data.target}님이 op권한을 획득했습니다.`, 36, client.data.status);
    this.chatsSocketService.sendChannelMember(client, data.channelId);
    client.emit("NOTICE", msg);
    client.join(client.id);
    client.to(roomId).emit("NOTICE", log);
    client.leave(client.id);
  }

  @UseGuards(JwtWsGuard)
  @SubscribeMessage('INVITE')
  async invateGame(client: Socket, data) {
    let msg;
    const target = await this.usersService.readOnePurePlayerWithName(data.target);
    if (!target) {
      const log = this.chatsSocketService.getNotice("해당 유저는 존재하지 않습니다.", 11, client.data.status);
      client.emit("NOTICE", log);
      return;
    }
    const targetClient = this.getClientWithStatus(target);
    if (!targetClient) {
      if (target.status === STATUS.GAME)
        msg = this.chatsSocketService.getNotice("해당 유저는 이미 게임중 입니다.", 23, client.data.status);
      else
        msg = this.chatsSocketService.getNotice("해당 유저는 접속중이 아닙니다.", 24, client.data.status);
      client.emit("NOTICE", msg);
      return;
    }
    this.chatsSocketService.inviteGame(client, targetClient, data.userId, target);
    msg = this.chatsSocketService.getNotice("게임초대 메시지를 전송하였습니다.", 25, client.data.status);
    client.emit("NOTICE", msg);
  }

  @UseGuards(JwtWsGuard)
  @SubscribeMessage('ACCEPT_GAME')
  async acceptGame(client: Socket, data: Partial<GameRequest>) {
    const target = await this.usersService.readOnePurePlayer(data.send.id);
    let msg;
    const targetClient = this.getClientWithStatus(target);
    if (!targetClient) {
      if (target.status === STATUS.GAME)
        msg = this.chatsSocketService.getNotice("해당 유저는 이미 게임중 입니다.", 23, client.data.status);
      else
        msg = this.chatsSocketService.getNotice("해당 유저는 접속중이 아닙니다.", 24, client.data.status);
      client.emit("NOTICE", msg);
      return;
    }
    this.chatsSocketService.acceptGame(client, targetClient, data);
  }

  @UseGuards(JwtWsGuard)
  @SubscribeMessage('REFUSE_GAME')
  async refuseGame(client: Socket, data: Partial<GameRequest>) {
    const target = await this.usersService.readOnePurePlayer(data.send.id);
    const targetClient = this.getClientWithStatus(target);
    this.chatsSocketService.refuseGame(client, targetClient, data, target);
  }

  async sendUpdateToChannelMember(userId: number) {
    this.chatsSocketService.sendUpdateToChannelMember(this.server, userId);
  }

  @UseGuards(JwtWsGuard)
  @SubscribeMessage('REQUEST_FRIEND')
  async requestFriend(client: Socket, data) {
    let msg;
    try {
      const target = await this.usersService.readOnePurePlayerWithName(data.target);
      if (!target) {
        msg = this.chatsSocketService.getNotice("해당 유저는 존재하지 않습니다.", 11, client.data.status);
        client.emit("NOTICE", msg);
        return;
      }
      const targetClient = this.getClientWithStatus(target);
      this.chatsSocketService.requestFriend(client, targetClient, data.userId, target);
    }
    catch (e) {
      msg = this.chatsSocketService.getNotice("DB error", 200, client.data.status);
      client.emit("NOTICE", msg);
      return;
    }
  }

  @UseGuards(JwtWsGuard)
  @SubscribeMessage('ACCEPT_FRIEND')
  async acceptFriend(client: Socket, data: Partial<FriendRequest>) {
    const target = await this.usersService.readOnePurePlayer(data.send.id);
    const targetClient = this.getClientWithStatus(target);
    this.chatsSocketService.acceptFriend(client, targetClient, data, target);
  }

  @UseGuards(JwtWsGuard)
  @SubscribeMessage('REFUSE_FRIEND')
  async refuseFriend(client: Socket, data: Partial<FriendRequest>) {
    const target = await this.usersService.readOnePurePlayer(data.send.id);
    const targetClient = this.getClientWithStatus(target);
    this.chatsSocketService.refuseFriend(client, targetClient, data, target);
  }

  @UseGuards(JwtWsGuard)
  @SubscribeMessage('GET_FRIEND_REQUEST')
  async getFriendRequest(client: Socket) {
    const friendRequest = await this.usersService.readRecvFriendRequest(client.data.userId);
    client.emit('GET_FRIEND_REQUEST', friendRequest);
  }

  @SubscribeMessage('RECALL_FRIEND_REQUEST')
  async recallFriendRequest(client: Socket, data: FriendRequest) {
    client.emit('REQUEST_FRIEND', data);
  }
}