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

  pauseGame(client: Socket, gameRoom: GameRoom) {
    const updateRoom = gameRoom;
    updateRoom.stop = true;
    client.to(gameRoom.roomId).emit("PAUSE", "PAUSE");
    return (updateRoom);
  }

  resumeGame(client: Socket, gameRoom: GameRoom) {
    const updateRoom = gameRoom;
    updateRoom.stop = false;
    client.to(gameRoom.roomId).emit("RESUME", "RESUME");
    return (updateRoom);
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