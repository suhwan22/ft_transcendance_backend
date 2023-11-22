import { Player } from "src/users/entities/player.entity";

export class GameInfo {
  constructor() {
      this.ball = { x: 400, y: 350 };
      this.right = 280;
      this.left = 280;
  }
  ball: { x: number, y: number };
  right: number;
  left: number;
}

export class PingPongPlayer {
  constructor(player: Player, isReady: boolean) {
    this.player = player;
    this.isReady = isReady;
  }
  player: Player;
  isReady: boolean;
}

export class GameRoom {
  constructor(roomId: string, left: PingPongPlayer, right: PingPongPlayer) {
    this.roomId = roomId;
    this.left = left;
    this.right = right;
    this.score = { left: 0, right: 0 };
    this.option = { speed: 3, ballSize: 1, barSize: 10 };
    this.gameInfo = new GameInfo();
    this.stop = false;
  }
  roomId: string;
  left: PingPongPlayer;
  right: PingPongPlayer;
  score: { left: number, right: number };
  option: { speed: number, ballSize: number, barSize: number };
  gameInfo: GameInfo;
  stop: boolean;
  
  getUserPosition(userId: number) {
    if (this.left.player.id === userId)
      return (true);
    else
      return (false);
  }

  getOppositeNameWithUserId(userId: number) {
    if (this.left.player.id === userId)
      return (this.right.player.name);
    else
      return (this.left.player.name);
  }
}

