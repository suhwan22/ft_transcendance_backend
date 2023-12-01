import { Socket } from 'socket.io';

export class GameQueue {
    constructor(client: Socket, rating: number, time: number) {
        this.client = client;
        this.rating = rating;
        this.time = time;
        this.matched = false;
    }
    client: Socket;
    rating: number;
    time: number;
    matched: boolean;
}