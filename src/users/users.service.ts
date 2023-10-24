import { Injectable } from '@nestjs/common';
import { PlayerService } from './database/player/player.service';
import { Player } from './database/player/player.entity';

@Injectable()
export class UsersService {
    constructor(
        private readonly playerService : PlayerService,
    ) {}

  /* [C] Player 생성 */
  async createPlayer(player: Partial<Player>): Promise<Player> {
    return (this.playerService.createPlayer(player));
  }

  /* [R] 모든 Player 조회 */
  async readAllPlayer(): Promise<Player[]> {
    return (this.playerService.readAllPlayer());
  }

  /* [R] 특정 Player 조회 */
  async readOnePlayer(id: number): Promise<Player> {
    return (this.playerService.readOnePlayer(id));
  }

  /* [U] Player info 수정 */
  async updatePlayerInfo(id: number, player: Partial<Player>): Promise<Player> {
    return (this.playerService.updatePlayerInfo(id, player));
  }

  /* [D] Player 제거 */
  async deletePlayer(id: number): Promise<void> {
    await this.playerService.deletePlayer(id);
  }
}
