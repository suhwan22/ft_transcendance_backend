import { forwardRef, Inject } from '@nestjs/common';
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
import { ChatsGateway } from 'src/sockets/chat/chats.gateway';
import { UsersService } from 'src/users/users.service';
import { LobbySocketService } from './lobby-socket.service';
import { Player } from 'src/users/entities/player.entity';
import { FriendRequest } from 'src/users/entities/friend-request.entity';
import { GameRequest } from 'src/games/entities/game-request';

@WebSocketGateway(3131, { namespace: '/lobby' })
export class LobbyGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(
    @Inject(forwardRef(() => ChatsGateway))
    private readonly chatsGateway: ChatsGateway,
    private readonly lobbySocketService: LobbySocketService,
    private readonly usersService: UsersService,) {
    this.clients = new Map<number, Socket>();
  }
  @WebSocketServer()
  server: Server;
  clients: Map<number, Socket>;

  //소켓 연결시 유저목록에 추가
  public handleConnection(client: Socket): void {
    console.log('lobby connected', client.id);
  }

  //소켓 연결 해제시 유저목록에서 제거
  async handleDisconnect(client: Socket): Promise<void> {
    try {
      const key = client.data.userId;
      if (!key)
        return;
      this.clients.delete(key);
      this.usersService.updatePlayerStatus(key, 3);
      this.chatsGateway.sendUpdateToChannelMember(key);
      this.sendUpdateToFriends(key);
      console.log('lobby disonnected', client.id);
    }
    catch(e) {
      console.log(e.stack);
    }
  }

  getClientWithStatus(target: Player): Socket {
    switch (target.status) {
      case 0:
        return (this.clients.get(target.id));
      case 1:
        return (this.chatsGateway.clients.get(target.id));
      default:
        return (null);
    }
  }

  @SubscribeMessage('REGIST')
  async registUserSocket(client: Socket, userId: number) {
    try {
      this.clients.set(userId, client);
      client.data.userId = userId;
  
      // 내 status 변경 -> 친구 & 채팅 맴버에게 뿌려주기
      this.usersService.updatePlayerStatus(userId, 0);
      this.sendUpdateToFriends(userId);
      this.chatsGateway.sendUpdateToChannelMember(userId);
    }
    catch(e) {
      console.log("aaaaaaatesates");
      console.log(e.stack);
    }
  }

  @SubscribeMessage('INVITE')
  async invateGame(client: Socket, data) {
    let msg;
    const target = await this.usersService.readOnePurePlayerWithName(data.target);
    if (!target) {
      msg = this.lobbySocketService.getNotice("존재하지 않는 유저입니다.", 11);
      client.emit("NOTICE", msg);
      return;
    }
    const targetClient = this.getClientWithStatus(target);
    if (!targetClient) {
      if (target.status === 2)
        msg = this.lobbySocketService.getNotice("해당 유저는 이미 게임중 입니다.", 23);
      else
        msg = this.lobbySocketService.getNotice("해당 유저는 접속중이 아닙니다.", 24);
      client.emit("NOTICE", msg);
      return;
    }
    this.lobbySocketService.inviteGame(targetClient, data.userId, target);
    msg = this.lobbySocketService.getNotice("게임초대 메시지를 전송하였습니다.", 25);
    client.emit("NOTICE", msg);
  }

  @SubscribeMessage('ACCEPT_GAME')
  async acceptGame(client: Socket, data: Partial<GameRequest>) {
    const target = await this.usersService.readOnePurePlayer(data.send.id);
    let msg;
    const targetClient = this.getClientWithStatus(target);
    if (!targetClient) {
      if (target.status === 2)
        msg = this.lobbySocketService.getNotice("해당 유저는 이미 게임중 입니다.", 23);
      else
        msg = this.lobbySocketService.getNotice("해당 유저는 접속중이 아닙니다.", 24);
      client.emit("NOTICE", msg);
      return;
    }
    this.lobbySocketService.acceptGame(client, targetClient, data);
  }

  @SubscribeMessage('REFUSE_GAME')
  async refuseGame(client: Socket, data: Partial<GameRequest>) {
    const target = await this.usersService.readOnePurePlayer(data.send.id);
    const targetClient = this.getClientWithStatus(target);
    this.lobbySocketService.refuseGame(client, targetClient, data, target);
  }

  @SubscribeMessage('INFO_FRIENDS')
  async sendFriendList(client: Socket, data) {
    try {
      this.lobbySocketService.sendFriendList(client, data.userId);
    }
    catch(e) {
      console.log(e.stack);
    }
  }

  @SubscribeMessage('REQUEST_FRIEND')
  async requestFriend(client: Socket, data) {
    let msg;
    try {
      const target = await this.usersService.readOnePurePlayerWithName(data.target);
      if (!target) {
        msg = this.lobbySocketService.getNotice("존재하지 않는 유저입니다.", 11);
        client.emit("NOTICE", msg);
        return;
      }
      const targetClient = this.getClientWithStatus(target);
      this.lobbySocketService.requestFriend(client, targetClient, data.userId, target);
    }
    catch (e) {
      msg = this.lobbySocketService.getNotice("DB error", 200);
      client.emit("NOTICE", msg);
      return;
    }
  }

  @SubscribeMessage('ACCEPT_FRIEND')
  async acceptFriend(client: Socket, data: Partial<FriendRequest>) {
    const target = await this.usersService.readOnePurePlayer(data.send.id);
    const targetClient = this.getClientWithStatus(target);
    this.lobbySocketService.acceptFriend(client, targetClient, data, target);
  }

  @SubscribeMessage('REFUSE_FRIEND')
  async refuseFriend(client: Socket, data: Partial<FriendRequest>) {
    const target = await this.usersService.readOnePurePlayer(data.send.id);
    const targetClient = this.getClientWithStatus(target);
    this.lobbySocketService.refuseFriend(client, targetClient, data, target);
  }

  @SubscribeMessage('UPDATE')
  async updateProfile(client: Socket, data) {
    try {
      const log = await this.lobbySocketService.updateProfile(client, data);
      client.emit("NOTICE", log);
      if (log.code === 38)
        return ;
      const userId = client.data.userId;
      this.sendUpdateToFriends(userId);
      this.chatsGateway.sendUpdateToChannelMember(userId);
      return ;

    }
    catch(e) {
      console.log(e.stack);
    }
  }

  async sendUpdateToFriends(userId: number) {
    this.lobbySocketService.sendUpdateToFriends(this.clients, userId);
  }

}
