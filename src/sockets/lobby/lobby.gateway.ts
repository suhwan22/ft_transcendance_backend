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
import { ChatsGateway } from 'src/chats/chats.gateway';
import { UsersService } from 'src/users/users.service';
import { LobbySocketService } from './lobby-socket.service';

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
    const key = client.data.userId;
    if (!key)
      return ;
    this.clients.delete(key);
    console.log('lobby disonnected', client.id);
  }

  @SubscribeMessage('REGIST')
  async registUserSocket(client: Socket, userId: number) {
    this.clients.set(userId, client);
    client.data.userId = userId;

    // 내 status 변경 -> 친구 & 채팅 맴버에게 뿌려주기
    this.usersService.updatePlayerStatus(userId, 1);
    this.sendUpdateToFriends(userId);
    this.chatsGateway.sendUpdateToChannelMember(userId);
  }

  @SubscribeMessage('INVATE')
  async invateGame(client: Socket, data) {
    this.lobbySocketService.invateGame(client, data.userId, data.target);
  }

  @SubscribeMessage('INFO_FRIENDS')
  async sendFriendList(client: Socket, data) {
    this.lobbySocketService.sendFriendList(client, data.userId);
  }

  @SubscribeMessage('REQUEST_FRIEND')
  async requestFriend(client: Socket, data) {
    this.lobbySocketService.requestFriend(client, data.userId, data.target);
  }

  @SubscribeMessage('ACCEPT_FRIEND')
  async acceptFriend(client: Socket, data) {
    this.lobbySocketService.acceptFriend(client, data.userId, data.target);
  }

  @SubscribeMessage('REFUSE_FRIEND')
  async refuseFriend(client: Socket, data) {
    this.lobbySocketService.refuseFriend(client, data.userId, data.target);
  }

  async sendUpdateToFriends(userId: number) {
    this.lobbySocketService.sendUpdateToFriends(this.clients, userId);
  }

}
