import { Player } from "src/users/entities/player.entity";

export class GameRequest {
    constructor(recv: Player, send: Player) {
        this.recv = recv;
        this.send = send;
    }
    recv: Player;
    send: Player;
}