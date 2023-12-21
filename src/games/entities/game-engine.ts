import { Socket } from "socket.io";
import { GameRoom } from "./game.entity";
import { GamesSocketService } from "../../sockets/game/games-socket.service";

export class Panel {
  constructor(isLeft: boolean, width: number, height: number, size: number) {
    if (isLeft)
      this.x = 40;
    else
      this.x = width - 16 - 40;
    this.y = height / 2 - 70;
    this.width = 16;
    this.height = 140 * size/5;
    this.update(this.y);
    this.left = this.x;
    this.right = this.x + this.width;
  }
  x: number;
  y: number;
  width: number;
  height: number;

  top: number;
  bottom: number;
  left: number;
  right: number;

  updateOption(size: number) {
    this.height = 140 * size / 5;
    this.update(this.y);
  }

  update(y: number) {
    this.y = y;
    this.top = this.y;
    this.bottom = this.y + this.height;
  }
}

export class Ball {
  constructor(width: number, height: number, size: number, speed: number) {
    this.radius = 10 * size / 5;
    this.speed = 1 * speed;
    this.turn = 1;
    this.initBall(width, height, speed);
  }
  x: number;
  y: number;

  radius: number;
  speed: number;

  vX: number;
  vY: number;

  turn: number;

  top: number;
  bottom: number;
  left: number;
  right: number;

  updateOption(size: number, speed: number, width: number, height: number) {
    this.radius = 10 * size / 5;
    this.speed = 1 * speed;
    this.initBall(width, height, speed);
  }

  update() {
    this.x += this.vX;
    this.y += this.vY;

    this.top = this.y - this.radius;
    this.bottom = this.y + this.radius;
    this.left = this.x - this.radius;
    this.right = this.x + this.radius;
  }

  isHitByWall(height: number): boolean {
    return (this.y + this.radius > height || this.y - this.radius < 0);
  }

  isHitBy(panel: Panel) : boolean {
    return (this.right > panel.left
      && this.left < panel.right
      && this.top < panel.bottom
      && this.bottom > panel.top);
  }

  isOut(width: number) {
    return (this.x < 0 || this.x > width);
  }

  initBall(width: number, height: number, speed: number) {
		this.x = width / 2;
		this.y = height / 2;
		this.turn *= -1;
		this.vX = 1 * speed * this.turn;
		this.vY = 0;
  }
}

export class GameEngine {
  constructor(left: Socket, right: Socket, room: GameRoom) {
    this.leftSocket = left;
    this.rightSocket = right;
    this.room = room;
    this.width = 800;
    this.height = 700;
    this.room = room;

    this.leftPanel = new Panel(true, 800, 700, room.option.barSize);
    this.rightPanel = new Panel(false, 800, 700, room.option.barSize);
    this.ball = new Ball(this.width, this.height, room.option.ballSize, room.option.speed);
    this.reset = false;
  }

  leftSocket: Socket;
  rightSocket: Socket;

  leftPanel: Panel;
  rightPanel: Panel;
  ball: Ball;

  width: number;
  height: number;

  room: GameRoom;
  reset: boolean;

  updateOption() {
    this.leftPanel.updateOption(this.room.option.barSize);
    this.rightPanel.updateOption(this.room.option.barSize);
    this.ball.updateOption(this.room.option.ballSize, this.room.option.speed, this.width, this.height);
  }

  updateBall() {
    this.ball.update();
    const panel = (this.ball.x < this.width / 2) ? this.leftPanel : this.rightPanel;

    if (this.ball.isHitByWall(this.height))
      this.ball.vY *= -1;
    else if (this.ball.isHitBy(panel)) {
      const fPoint = this.ball.y - (panel.y + panel.height / 2);
      const angle = (fPoint / panel.height / 2) * Math.PI / 1.5;

      this.ball.vX = this.ball.speed * Math.cos(angle);
      if (this.ball.x > this.width / 2)
        this.ball.vX *= -1;
      this.ball.vY = this.ball.speed * Math.sin(angle);
    }
    else if (this.ball.isOut(this.width)) {
      if (this.ball.x > this.width) {
        this.room.score.left++;
      }
      else if (this.ball.x < 0) {
        this.room.score.right++;
      }
      this.leftSocket.emit("SCORE", { left: this.room.score.left, right: this.room.score.right });
      this.rightSocket.emit("SCORE", { left: this.room.score.left, right: this.room.score.right });
      this.stopBall(2000);
      this.ball.initBall(this.width, this.height, this.room.option.speed);
    }
    this.room.gameInfo.ball.x = this.ball.x;
    this.room.gameInfo.ball.xv = this.ball.vX;
    this.room.gameInfo.ball.y = this.ball.y;
    this.room.gameInfo.ball.yv = this.ball.vY;
  }

  update() {
    this.updateBall();
    this.leftPanel.update(this.room.gameInfo.left);
    this.rightPanel.update(this.room.gameInfo.right);
  }

  checkGameOver(): boolean {
    if (this.room.score.left >= 11 || this.room.score.right >= 11) 
      return (true);
    return (false);
  }

  stopBall(msec: number) {
    this.reset = true;
    if (this.reset) {
      setTimeout(() => this.reset = false, msec);
    }
  }

  IsWinnerLeft(): boolean {
    if (this.room.score.left > this.room.score.right)
      return (true);
    else
      return (false);
  }
}