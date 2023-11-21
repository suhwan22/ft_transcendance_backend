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
import { LobbyGateway } from 'src/sockets/lobby/lobby.gateway';
import { UsersService } from 'src/users/users.service';

@WebSocketGateway(3131, { namespace: '/games' })
export class GamesGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(
    @Inject(forwardRef(() => ChatsGateway))
    private readonly chatsGateway: ChatsGateway,
    @Inject(forwardRef(() => LobbyGateway))
    private readonly lobbyGateway: LobbyGateway,
    private readonly usersService: UsersService,
    ) {
    this.clients = new Map<number, Socket>();
  }

  @WebSocketServer()
  server: Server;
  clients: Map<number, Socket>;
  //소켓 연결시 유저목록에 추가
  public handleConnection(client: Socket, ...args: any[]): void {
    console.log('game connected', client.id);
  }

  //소켓 연결 해제시 유저목록에서 제거
  async handleDisconnect(client: Socket): Promise<void> {
    const key = client.data.userId;
    if (!key)
      return ;
    this.clients.delete(key);
    this.usersService.updatePlayerStatus(key, 3);
    this.chatsGateway.sendUpdateToChannelMember(key);
    this.lobbyGateway.sendUpdateToFriends(key);
    console.log('chat disonnected', client.id);
  }


  @SubscribeMessage('REGIST')
  async registUserSocket(client: Socket, userId: number) {
    this.clients.set(userId, client);
    client.data.userId = userId;
    this.usersService.updatePlayerStatus(userId, 1);
    this.chatsGateway.sendUpdateToChannelMember(userId);
    this.lobbyGateway.sendUpdateToFriends(userId);
  }

  @SubscribeMessage('MATCH')
  async matchMaking(client: Socket, userId: number) {
    console.log('match making');
  }
}
