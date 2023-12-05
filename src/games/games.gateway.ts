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
import { GameRoom } from './entities/game.entity';
import { GamesSocketService } from './games-socket.service';
import { Queue, GameQueue } from './entities/game-queue';

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
    this.queue = new Map<number, Queue<GameQueue>>();
    this.gameRooms = new Map<string, GameRoom>();
  }

  @WebSocketServer()
  server: Server;
  clients: Map<number, Socket>;
  queue: Map<number, Queue<GameQueue>>;
  gameRooms:  Map<string, GameRoom>;

  //소켓 연결시 유저목록에 추가
  public handleConnection(client: Socket, ...args: any[]): void {
    client.leave(client.id);
    console.log('game connected', client.id);
  }

  //소켓 연결 해제시 유저목록에서 제거
  async handleDisconnect(client: Socket): Promise<void> {
    console.log('game disonnected', client.id);
    const key = client.data.userId;
    if (!key)
      return ;
    
    // 해당 user가 gameRoom 안에 있는 경우
    if (client.data.roomId) {
      const targetClient = this.getTargetClient(client.data.roomId, client.data.userId);
      const { updateRoom, flag } = this.gamesSocketService.pauseGame(client, targetClient, this.gameRooms.get(client.data.roomId), key);
      this.gameRooms.set(updateRoom.roomId, updateRoom);
      if (flag) {
        this.gameRooms.delete(client.data.roomId);
        client.data.roomId = null;
        targetClient.data.roomId = null;
      }
      else {
        const intervalId = setInterval(() => this.checkTimePause(updateRoom, client.data.userId, intervalId), 1000);
      }
    }
    else {
      if (client.data.intervalId) {
        this.queue.get(client.data.ratingGroup).remove((v) => v.client.data.userId === client.data.userId);
        clearInterval(client.data.intervalId);
        client.data.intervalId = null;
      }
      this.clients.delete(key);
      this.usersService.updatePlayerStatus(key, 3);
      this.chatsGateway.sendUpdateToChannelMember(key);
      this.lobbyGateway.sendUpdateToFriends(key);
    }
  }
  
  @SubscribeMessage('REGIST')
  async registUserSocket(client: Socket, userId: number) {
    client.data.userId = userId;
    this.clients.set(userId, client);
    this.usersService.updatePlayerStatus(userId, 2);
    this.chatsGateway.sendUpdateToChannelMember(userId);
    this.lobbyGateway.sendUpdateToFriends(userId);
    const gameRoom = this.getGameRoomWithUserId(userId);
    if (gameRoom) {
      const roomId = gameRoom.roomId;
      const isLeft = gameRoom.getUserPosition(userId);
      client.data.roomId = roomId;
      client.join(roomId);
      client.emit("RELOAD", { room: gameRoom, isLeft: isLeft });
    }
    else {
      client.emit("RELOAD", { room: null, isLeft: null });
    }
  }

  @SubscribeMessage('MATCH')
  async matchMaking(client: Socket, userId: number) {
    const score = (await this.usersService.readOneUserGameRecord(client.data.userId)).score;
    const ratingGroup = Math.floor(score / 100);
    const gameQueue = new GameQueue(client, score, 0);
    client.data.ratingGroup = ratingGroup;

    // enter waiting queue
    if (this.queue.get(ratingGroup)) {
      this.queue.get(ratingGroup).enqueue(gameQueue);
    }
    else {
      const groupQueue = new Queue<GameQueue>();
      groupQueue.enqueue(gameQueue);
      this.queue.set(ratingGroup, groupQueue);
    }

    // find match
    gameQueue.client.emit('WAIT', 'WAIT');
    const intervalId = setInterval(() => this.findMath(gameQueue, ratingGroup, intervalId), 1000);
    client.data.intervalId = intervalId;
  }

  async findMath(gameQueue: GameQueue, ratingGroup:number, intervalId: any) {
    if (gameQueue.matched) {
      clearInterval(intervalId);
      return ;
    }
    const searchRange = Math.floor(gameQueue.time / 10);
    for (let i = ratingGroup - searchRange; i <= ratingGroup + searchRange; i++) {
      const groupQueue = this.queue.get(i);
      if (groupQueue) {
        if ((groupQueue.size > 0 && i !== ratingGroup) || (groupQueue.size > 1 && i === ratingGroup)) {
          this.queue.get(gameQueue.client.data.ratingGroup).remove((v) => v.client.data.userId === gameQueue.client.data.userId);
          const targetQueue = this.queue.get(i).dequeue();
          gameQueue.matched = true;
          targetQueue.matched = true;
          gameQueue.client.data.intervalId = null;
          targetQueue.client.data.intervalId = null;

          const client = gameQueue.client;
          const targetClient = targetQueue.client;

          client.emit('MATCH', "매치 성사");
          targetClient.emit('MATCH', "매치 성사");

          const roomId = client.id + targetClient.id;
          const gameRoom = await this.gamesSocketService.makeRoom(client, targetClient, roomId);
          gameRoom.rank = true;
          this.gameRooms.set(roomId, gameRoom);
          this.gamesSocketService.joinRoom(client, roomId);
          this.gamesSocketService.joinRoom(targetClient, roomId);
          clearInterval(intervalId);
          break;
        }
      }
    }
    gameQueue.time++;
  }

  @SubscribeMessage('READY')
  readyGame(client: Socket, data: GameRoom) {
    const gameRoom = this.gameRooms.get(client.data.roomId);
    const targetClient = this.getTargetClient(gameRoom.roomId, client.data.userId);
    const updateRoom = this.gamesSocketService.readyGame(client, targetClient, gameRoom);
    this.gameRooms.set(client.data.roomId, updateRoom);
    const intervalId = setInterval(() => this.checkTimeReady(client, targetClient, updateRoom, intervalId), 1000);
  }

  @SubscribeMessage('PING')
  ping(client: Socket, data: any) {
    const gameRoom = this.gameRooms.get(client.data.roomId);
    const updateRoom = this.gamesSocketService.updateGameInfo(client, gameRoom, data);
    this.gameRooms.set(client.data.roomId, updateRoom);
  }

  @SubscribeMessage('HIT')
  sendBallVector(client: Socket, data: any) {
    const gameRoom = this.gameRooms.get(client.data.roomId);
    const updateRoom = this.gamesSocketService.saveGame(client, gameRoom, data);
    this.gameRooms.set(updateRoom.roomId, updateRoom);
    client.to(client.data.roomId).emit("VECTOR", data);
  }

  @SubscribeMessage('SCORE')
  sendScore(client: Socket, data: any) {
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
      this.gameRooms.delete(client.data.roomId);
      client.data.roomId = null;
      targetClient.data.roomId = null;
    }
  }

  @SubscribeMessage('OPTION')
  sendOption(client: Socket, data: any) {
    const gameRoom = this.gameRooms.get(client.data.roomId);
    const updateRoom = this.gamesSocketService.updateGameOption(client, gameRoom, data);
    this.gameRooms.set(updateRoom.roomId, updateRoom);
  }

  @SubscribeMessage('PAUSE')
  sendPauseGame(client: Socket, data: any) {
    const gameRoom = this.gameRooms.get(client.data.roomId);
    const targetClient = this.getTargetClient(client.data.roomId, client.data.userId);
    const {updateRoom, flag} = this.gamesSocketService.pauseGame(client, targetClient, gameRoom, client.data.userId);
    this.gameRooms.set(updateRoom.roomId, updateRoom);
    if (flag) {
      this.gameRooms.delete(client.data.roomId);
      client.data.roomId = null;
      targetClient.data.roomId = null;
    }
    const intervalId = setInterval(() => this.checkTimePause(updateRoom, client.data.userId, intervalId), 1000);
  }

  @SubscribeMessage('JOIN')
  async join(client: Socket, data: any) {
    let gameRoom;

    gameRoom = this.gameRooms.get(data.roomId);
    if (!gameRoom) {
      gameRoom = new GameRoom(data.roomId, null, null);
      gameRoom.rank = false;
    }

    const updateRoom = await this.gamesSocketService.enterRoom(client, gameRoom, data.send.id === client.data.userId ? true : false);
    this.gameRooms.set(data.roomId, updateRoom);

    this.gamesSocketService.joinRoom(client, data.roomId);
    if (updateRoom.left && updateRoom.right) {
      const isLeft = updateRoom.getUserPosition(client.data.userId);
      const targetClient = this.getTargetClient(gameRoom.roomId, client.data.userId);
      client.emit("LOAD", { room: updateRoom, isLeft: isLeft });
      targetClient.emit("LOAD", { room: updateRoom, isLeft: !isLeft });
    }
  }

  @SubscribeMessage('MSG')
  async sendMessage(client: Socket, data: any) {
    const targetClient = this.getTargetClient(client.data.roomId, client.data.userId);
    targetClient.emit('MSG', data);
  }

  @SubscribeMessage('RESUME')
  sendResumeGame(client: Socket, data: any) {
    const gameRoom = this.gameRooms.get(client.data.roomId);
    const updateRoom = this.gamesSocketService.resumeGame(client, gameRoom);
    this.gameRooms.set(updateRoom.roomId, updateRoom);
  }

  @SubscribeMessage('SAVE')
  saveGame(client: Socket, data: any) {
    const gameRoom = this.gameRooms.get(client.data.roomId);
    const updateRoom = this.gamesSocketService.saveGame(client, gameRoom, data);
    this.gameRooms.set(updateRoom.roomId, updateRoom);
  }

  @SubscribeMessage('CANCEL')
  cancelGame(client: Socket, data: any) {
    const gameRoom = this.getGameRoomWithUserId(client.data.userId);
    if (gameRoom) {
      return ;
    }
    this.queue.get(client.data.ratingGroup).remove((v) => v.client.data.userId === client.data.userId);
    clearInterval(client.data.intervalId);
    client.data.intervalId = null;
    client.emit('CANCEL', 'CANCEL');
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

  checkTimePause(gameRoom: GameRoom, userId: number, intervalId: any) {
    let time;
    let winId;
    if (gameRoom.getUserPosition(userId)) {
      if (!gameRoom.left.isPause) {
        clearInterval(intervalId);
        return ;
      }
      gameRoom.left.pauseTime++;
      time = gameRoom.left.pauseTime;
      winId = gameRoom.right.player.id;
    }
    else {
      if (!gameRoom.right.isPause) {
        clearInterval(intervalId);
        return ;
      }
      gameRoom.right.pauseTime++;
      time = gameRoom.right.pauseTime;
      winId = gameRoom.left.player.id;
    }
    this.gameRooms.set(gameRoom.roomId, gameRoom);
    if (time === 20) {
      clearInterval(intervalId);
      this.gamesSocketService.endGameWithExtra(this.clients.get(userId), this.clients.get(winId), gameRoom);
      this.gameRooms.delete(gameRoom.roomId);
      this.clients.get(userId).data.roomId = null;
      this.clients.get(winId).data.roomId = null;
    }
  }

  checkTimeReady(client: Socket, targetClient: Socket, gameRoom: GameRoom, intervalId: any) {
    let time;
    let isLeft;
    if (gameRoom.getUserPosition(client.data.userId)) {
      if (!gameRoom.left.isReady) {
        gameRoom.left.readyTime = 0;
        clearInterval(intervalId);
        return ;
      }
      time = gameRoom.left.readyTime++;
      isLeft = true;
    }
    else {
      if (!gameRoom.right.isReady) {
        gameRoom.left.readyTime = 0;
        clearInterval(intervalId);
        return ;
      }
      time = gameRoom.right.readyTime++;
      isLeft = false;
    }
    this.gameRooms.set(gameRoom.roomId, gameRoom);
    if (time === 20) {
      clearInterval(intervalId);
      gameRoom.start = true;
      client.emit("START", { room: gameRoom, isLeft: isLeft });
      targetClient.emit("START", { room: gameRoom, isLeft: !isLeft });
    }
  }
}

