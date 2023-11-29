import { Player } from "src/users/entities/player.entity";

export class GameInfo {
  constructor() {
      this.ball = { x: 400, xv: 0, y: 350, yv: 0 };
      this.right = 280;
      this.left = 280;
  }
  ball: { x: number, xv: number, y: number, yv: number};
  right: number;
  left: number;
}

export class PingPongPlayer {
  constructor(player: Player, isReady: boolean) {
    this.player = player;
    this.isReady = isReady;
    this.isPause = false;
    this.pause = 0;
    this.pauseTime = 0;
  }
  player: Player;
  isReady: boolean;
  isPause: boolean;
  pause: number;
  pauseTime: number;
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
    this.start = false;
    this.rank = false;
  }
  roomId: string;
  left: PingPongPlayer;
  right: PingPongPlayer;
  score: { left: number, right: number };
  option: { speed: number, ballSize: number, barSize: number };
  gameInfo: GameInfo;
  stop: boolean;
  start: boolean;
  rank: boolean;
  
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

