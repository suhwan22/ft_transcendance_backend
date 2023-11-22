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
import { GameRoom, PingPongPlayer } from './entities/game.entity';
import { PlayerInfoDto } from './dtos/player-info.dto';
import { GamesSocketService } from './games-socket.service';

@WebSocketGateway(3131, { namespace: '/games' })
export class GamesGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(
    @Inject(forwardRef(() => ChatsGateway))
    private readonly chatsGateway: ChatsGateway,
    @Inject(forwardRef(() => LobbyGateway))
    private readonly lobbyGateway: LobbyGateway,
    private readonly usersService: UsersService,
    private readonly gamesSocketService: GamesSocketService,) {
    this.clients = new Map<number, Socket>();
    this.queue = [];
    this.gameRooms = new Map<string, GameRoom>();
  }

  @WebSocketServer()
  server: Server;
  clients: Map<number, Socket>;
  queue: Socket[];
  gameRooms:  Map<string, GameRoom>;

  //소켓 연결시 유저목록에 추가
  public handleConnection(client: Socket, ...args: any[]): void {
    client.leave(client.id);
    console.log('game connected', client.id);
  }

  //소켓 연결 해제시 유저목록에서 제거
  async handleDisconnect(client: Socket): Promise<void> {
    const key = client.data.userId;
    if (!key)
      return ;
    
    // 해당 user가 gameRoom 안에 있는 경우
    if (client.data.roomId) {
      const targetClient = this.getTargetClient(client.data.roomId, client.data.userId);
      const updateGame = this.gamesSocketService.pauseGame(client, targetClient, this.gameRooms.get(client.data.roomId), key);
      this.gameRooms.set(updateGame.roomId, updateGame);
    }
    else {
      const newQueue = this.queue.filter((e) => e.data.userId !== client.data.userId);
      this.queue = newQueue;
      this.clients.delete(key);
      this.usersService.updatePlayerStatus(key, 3);
      this.chatsGateway.sendUpdateToChannelMember(key);
      this.lobbyGateway.sendUpdateToFriends(key);
    }
    console.log('game disonnected', client.id);
  }
  
  @SubscribeMessage('REGIST')
  async registUserSocket(client: Socket, userId: number) {
    client.data.userId = userId;
    if (this.clients.get(userId)) {
      const gameRoom = this.getGameRoomWithUserId(userId);
      const roomId = gameRoom.roomId;
      const isLeft = gameRoom.getUserPosition(userId);
      const opposite = gameRoom.getOppositeNameWithUserId(userId);
      const playerInfoDto = new PlayerInfoDto(roomId, isLeft, opposite);
      const loadData = {
        room: playerInfoDto,
        objectPos: gameRoom.gameInfo,
        score: gameRoom.score,
        option: gameRoom.option,
        stop: gameRoom.stop,
      }
      client.data.roomId = roomId;
      client.join(roomId);
      client.emit("LOAD", loadData);
    }
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
      const roomId = client.id + targetClient.id;
      const gameRoom = await this.gamesSocketService.makeRoom(client, targetClient, roomId);
      this.gameRooms.set(roomId, gameRoom);
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

  @SubscribeMessage('READY')
  readyGame(client: Socket, data: PlayerInfoDto) {
    const gameRoom = this.gameRooms.get(client.data.roomId);
    const updateRoom = this.gamesSocketService.readyGame(client, gameRoom, data);
    this.gameRooms.set(client.data.roomId, updateRoom);
  }

  @SubscribeMessage('PING')
  ping(client: Socket, data) {
    const gameRoom = this.gameRooms.get(client.data.roomId);
    const updateRoom = this.gamesSocketService.updateGameInfo(client, gameRoom, data);
    this.gameRooms.set(client.data.roomId, updateRoom);
  }

  @SubscribeMessage('HIT')
  sendBallVector(client: Socket, data) {
    client.to(client.data.roomId).emit("VECTOR", data);
  }

  @SubscribeMessage('SCORE')
  sendScore(client: Socket, data) {
    const gameRoom = this.gameRooms.get(client.data.roomId);
    const updateRoom = this.gamesSocketService.updateGameScore(client, gameRoom, data);
    this.gameRooms.set(data.roomId, updateRoom);

    if (updateRoom.score.left >= 11 || updateRoom.score.right >= 11) {
      let k;
      if (updateRoom.left.player.id === client.data.userId)
        k = updateRoom.right.player.id;
      else
        k = updateRoom.left.player.id;
      const targetClient = this.clients.get(k);
      this.gamesSocketService.endGame(client, targetClient, updateRoom);
    }
  }

  @SubscribeMessage('OPTION')
  sendOption(client: Socket, data) {
    const gameRoom = this.gameRooms.get(client.data.roomId);
    const updateRoom = this.gamesSocketService.updateGameOption(client, gameRoom, data);
    this.gameRooms.set(updateRoom.roomId, updateRoom);
  }

  @SubscribeMessage('PAUSE')
  sendPauseGame(client: Socket, data) {
    const gameRoom = this.gameRooms.get(client.data.roomId);
    const targetClient = this.getTargetClient(client.data.roomId, client.data.userId);
    const updateRoom = this.gamesSocketService.pauseGame(client, targetClient, gameRoom, client.data.userId);
    this.gameRooms.set(updateRoom.roomId, updateRoom);
  }

  @SubscribeMessage('RESUME')
  sendResumeGame(client: Socket, data) {
    const gameRoom = this.gameRooms.get(client.data.roomId);
    const updateRoom = this.gamesSocketService.resumeGame(client, gameRoom);
    this.gameRooms.set(updateRoom.roomId, updateRoom);
  }

  @SubscribeMessage('SAVE')
  saveGame(client: Socket, data) {
    const gameRoom = this.gameRooms.get(client.data.roomId);
    const updateRoom = this.gamesSocketService.saveGame(client, gameRoom, data);
    this.gameRooms.set(updateRoom.roomId, updateRoom);
  }

  getGameRoomWithUserId(userId: number): GameRoom {
    let gameRoom = null;
    this.gameRooms.forEach((v) => {
      if (v.left.player.id === userId || v.right.player.id === userId)
        gameRoom = v;
    })
    return (gameRoom);
  }

  getTargetClient(roomId: string, userId: number): Socket {
    const gameRoom = this.gameRooms.get(roomId);
    if (gameRoom.left.player.id === userId)
      return (this.clients.get(gameRoom.right.player.id));
    else
      return (this.clients.get(gameRoom.left.player.id));
  }
}

