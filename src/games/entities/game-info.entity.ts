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