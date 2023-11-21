import { Player } from "src/users/entities/player.entity";


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
  }
  roomId: string;
  left: PingPongPlayer;
  right: PingPongPlayer;
}

