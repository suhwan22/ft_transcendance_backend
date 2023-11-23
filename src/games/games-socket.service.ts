import { Injectable } from "@nestjs/common";
import { Socket } from "socket.io";
import { UsersService } from "src/users/users.service";
import { GameRoom, PingPongPlayer } from "./entities/game.entity";
import { PlayerInfoDto } from "./dtos/player-info.dto";
import { GamesService } from "./games.service";
import { Player } from "src/users/entities/player.entity";

@Injectable()
export class GamesSocketService {
  constructor(
    private readonly usersService: UsersService,
    private readonly gamesService: GamesService,) { }

  async makeRoom(client: Socket, targetClient: Socket, roomId: string): Promise<GameRoom> {
    client.rooms.clear();
    client.rooms.add(roomId);
    client.join(roomId);
    client.data.roomId = roomId;
    targetClient.rooms.clear();
    targetClient.rooms.add(roomId);
    targetClient.join(roomId);
    targetClient.data.roomId = roomId;
    const user = await this.usersService.readOnePurePlayer(client.data.userId);
    const target = await this.usersService.readOnePurePlayer(targetClient.data.userId);
    client.emit("ROOM", new PlayerInfoDto(roomId, true, target.name));
    targetClient.emit("ROOM", new PlayerInfoDto(roomId, false, user.name));

    const me = new PingPongPlayer(user, false);
    const op = new PingPongPlayer(target, false);
    return (new GameRoom(roomId, me, op));
  }

  readyGame(client: Socket, gameRoom: GameRoom, data: PlayerInfoDto): GameRoom {
    const updateRoom = gameRoom;
    if (data.isLeft)
      updateRoom.left.isReady = true;
    else
      updateRoom.right.isReady = true;
    client.to(client.data.roomId).emit("READY", data.isLeft);
    if (updateRoom.left.isReady && updateRoom.right.isReady) {
      client.to(client.data.roomId).emit("START", "START");
    }
    return (updateRoom);
  }

  updateGameInfo(client: Socket, gameRoom: GameRoom, data): GameRoom {
    const updateRoom = gameRoom;
    updateRoom.gameInfo.ball = data.ball;
    if (data.isLeft)
      updateRoom.gameInfo.left = data.bar;
    else
      updateRoom.gameInfo.right = data.bar;
    client.to(client.data.roomId).emit("PONG", updateRoom.gameInfo);
    return (updateRoom);
  }

  updateGameOption(client: Socket, gameRoom: GameRoom, data): GameRoom {
    const updateRoom = gameRoom;
    updateRoom.option = data;
    client.to(client.data.roomId).emit("OPTION", updateRoom.option);
    return (updateRoom);
  }

  updateGameScore(client: Socket, gameRoom: GameRoom, data): GameRoom {
    const updateRoom = gameRoom;
    if (data.isLeft)
      updateRoom.score.left++;
    else
      updateRoom.score.right++;
    client.to(client.data.roomId).emit("SCORE", updateRoom.score);
    return (updateRoom);
  }

  pauseGame(client: Socket, targetClient: Socket, gameRoom: GameRoom, userId: number) {
    const updateRoom = gameRoom;
    updateRoom.stop = true;

    if (updateRoom.getUserPosition(userId)) {
      if (updateRoom.left.pause === 3) {
        this.endGameWithExtra(client, targetClient, gameRoom);
      }
      updateRoom.left.isPause = true;
      updateRoom.left.pause++;
    }
    else {
      updateRoom.left.isPause = true;
      updateRoom.right.pause++;
      if (updateRoom.left.pause === 3) {
        this.endGameWithExtra(client, targetClient, gameRoom);
      }
    }

    client.to(gameRoom.roomId).emit("PAUSE", "PAUSE");
    return (updateRoom);
  }

  resumeGame(client: Socket, gameRoom: GameRoom) {
    const updateRoom = gameRoom;
    updateRoom.stop = false;
    const gameInfo = {
      ball: {
        x: gameRoom.gameInfo.ball.x,
        xv: gameRoom.gameInfo.ball.xv,
        y: gameRoom.gameInfo.ball.y,
        yv: gameRoom.gameInfo.ball.yv
      },
      right: gameRoom.gameInfo.right,
      left: gameRoom.gameInfo.left
    }
    if (updateRoom.left.isPause && updateRoom.right.isPause)
      client.to(gameRoom.roomId).emit("RESUME", gameInfo);
    return (updateRoom);
  }

  saveGame(client: Socket, gameRoom: GameRoom, data) {
    const updateRoom = gameRoom;
    updateRoom.gameInfo.ball = {
      x: data.ball.x,
      xv: data.ball.xv,
      y: data.ball.y,
      yv: data.ball.yv
    };
    updateRoom.gameInfo.right = data.right;
    updateRoom.gameInfo.left = data.left;
    return (updateRoom);
  }

  // 몰수패 client가 4번째 pause를 건쪽이기 때문에 targetClient 가 무조건 승리
  async endGameWithExtra(client: Socket, targetClient: Socket, gameRoom: GameRoom): Promise<void> {
    let win: Player, loss: Player;
    let winScore, lossScore, isLeft;

    //pause를 건 쪽이 left인 경우
    if (gameRoom.getUserPosition(client.data.userId)) {
      win = gameRoom.right.player;
      loss = gameRoom.left.player;
      winScore = gameRoom.score.right;
      lossScore = gameRoom.score.left;
      isLeft = false;
    }
    else {
      win = gameRoom.left.player;
      loss = gameRoom.right.player;
      winScore = gameRoom.score.left;
      lossScore = gameRoom.score.right;
      isLeft = true;
    }
    await this.gamesService.createGameHistoryWitData(win.id, loss, true, winScore, lossScore);
    await this.gamesService.createGameHistoryWitData(loss.id, win, false, lossScore, winScore);
    await this.usersService.updateUserGameRecord(win.id, true);
    await this.usersService.updateUserGameRecord(loss.id, false);
    client.to(gameRoom.roomId).emit("END", { score: gameRoom.score, winnerIsLeft: isLeft });
    client.leave(gameRoom.roomId);
    client.data.roomId = null;
    targetClient.leave(gameRoom.roomId);
    targetClient.data.roomId = null;
  }

  async endGame(client: Socket, targetClient: Socket, gameRoom: GameRoom): Promise<void> {
    let win: Player, loss: Player;
    let winScore, lossScore, isLeft;
    if (gameRoom.score.left > gameRoom.score.right) {
      win = gameRoom.left.player;
      loss = gameRoom.right.player;
      winScore = gameRoom.score.left;
      lossScore = gameRoom.score.right;
      isLeft = true;
    }
    else {
      win = gameRoom.right.player;
      loss = gameRoom.left.player;
      winScore = gameRoom.score.right;
      lossScore = gameRoom.score.left;
      isLeft = false;
    }
    await this.gamesService.createGameHistoryWitData(win.id, loss, true, winScore, lossScore);
    await this.gamesService.createGameHistoryWitData(loss.id, win, false, lossScore, winScore);
    await this.usersService.updateUserGameRecord(win.id, true);
    await this.usersService.updateUserGameRecord(loss.id, false);
    client.to(gameRoom.roomId).emit("END", { score: gameRoom.score, winnerIsLeft: isLeft });
    client.leave(gameRoom.roomId);
    client.data.roomId = null;
    targetClient.leave(gameRoom.roomId);
    targetClient.data.roomId = null;
  }
}