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
import { Player } from 'src/users/entities/player.entity';
import { UsersService } from 'src/users/users.service';

@WebSocketGateway(3131, { namespace: '/games' })
export class GamesGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(
    @Inject(forwardRef(() => ChatsGateway))
    private readonly chatsGateway: ChatsGateway,
    @Inject(forwardRef(() => LobbyGateway))
    private readonly lobbyGateway: LobbyGateway,
    private readonly usersService: UsersService,) {
    this.clients = new Map<number, Socket>();
    this.queue = [];
  }

  @WebSocketServer()
  server: Server;
  clients: Map<number, Socket>;
  queue: Socket[];

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
    client.data.userId = userId;
    client.data.math = false;
    this.clients.set(userId, client);
    this.usersService.updatePlayerStatus(userId, 2);
    this.chatsGateway.sendUpdateToChannelMember(userId);
    this.lobbyGateway.sendUpdateToFriends(userId);
  }

  @SubscribeMessage('MATCH')
  async matchMaking(client: Socket, userId: number) {
    if (this.queue.length <= 0) {
      this.queue.push(client);
    }
    else {
      const targetClient = this.queue.shift();
      client.join(client.id + targetClient.id);
      targetClient.join(client.id + targetClient.id);
      const user = await this.usersService.readOnePurePlayer(client.data.userId);
      const target = await this.usersService.readOnePurePlayer(targetClient.data.userId);
      client.emit("ROOM", new GameRoom(client.id + targetClient.id, true, target.name));
      targetClient.emit("ROOM", new GameRoom(client.id + targetClient.id, false, user.name));
    }
    // console.log('match making');
    // // 대기 큐에 넣기
    // this.queue.push(client);
    // // 대기 큐에 헤드에 오거나 매칭이 잡혔다면 탈출
    // while (!(this.queue[0].data.userId === userId || client.data.math === true)) {
    //   client.emit("NOTICE", "waitting...");
    // }
    // if (client.data.math)
    //   return ;
    
    // // 대기 큐에 사람이 올때 까지 대기
    // let count = 0;
    // while (this.queue.length <= 1) {
    //   client.emit("NOTICE", "waitting...");
    //   console.log(count++);
    // }
    // this.queue.shift();
    // const other = this.queue.shift();
    // other.data.math = true;
    // client.emit("NOTICE", "success");
    // other.emit("NOTICE", "sucesss");
  }
}

export class GameRoom {
  constructor(roomId: string, isLeft: boolean, opposite: string) {
    this.roomId = roomId;
    this.isLeft = isLeft;
    this.opposite = opposite;
  }
  roomId: string;
  isLeft: boolean;
  opposite: string;
}

export class PingPongPlayer {
  player: Player;
  isLeft: boolean;
}
