import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Player } from './player.entity';

@Injectable()
export class PlayerService {
  constructor(
    @InjectRepository(Player)
    private playerRepository: Repository<Player>,
  ) {}

  /* [C] Player 생성 */
  async createPlayer(player: Partial<Player>): Promise<Player> {
    const newplayer = this.playerRepository.create(player);
    return (this.playerRepository.save(newplayer));
  }

  /* [R] 모든 Player 조회 */
  async readAllPlayer(): Promise<Player[]> {
    return (this.playerRepository.find());
  }

  /* [R] 특정 Player 조회 */
  async readOnePlayer(id: number): Promise<Player> {
    return (this.playerRepository.findOne({ where: { id } }));
  }

  /* [U] Player info 수정 */
  async updatePlayerInfo(id: number, player: Partial<Player>): Promise<Player> {
    await this.playerRepository.update(id, player);
    return (this.playerRepository.findOne({ where: { id } }));
  }

  /* [D] Player 제거 */
  async deletePlayer(id: number): Promise<void> {
    await (this.playerRepository.delete(id));
  }
}