
export class PlayerInfoDto {
    constructor(roomId: string, isLeft: boolean, opposite: string) {
      this.roomId = roomId;
      this.isLeft = isLeft;
      this.opposite = opposite;
    }
    roomId: string;
    isLeft: boolean;
    opposite: string;
  }