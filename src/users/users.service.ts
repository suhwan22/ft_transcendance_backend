import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Player } from './entities/player.entity';
import { UserGameRecord } from './entities/user-game-record.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(Player)
    private playerRepository: Repository<Player>,
    @InjectRepository(UserGameRecord)
    private recordRepository: Repository<UserGameRecord>,
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
  /* [C] UserGameRecord 생성 */
  async createUserGameRecord(record: Partial<UserGameRecord>): Promise<UserGameRecord> {
    const newrecord = this.recordRepository.create(record);
    return (this.recordRepository.save(newrecord));
  }

  /* [R] 모든 UserGameRecord 조회 */
  async readAllUserGameRecord(): Promise<UserGameRecord[]> {
    return (this.recordRepository.find());
  }

  /* [R] 특정 UserGameRecord 조회 */
  async readOneUserGameRecord(id: number): Promise<UserGameRecord> {
    return (this.recordRepository.findOne({ where: { id } }));
  }

  /* [U] UserGameRecord info 수정 */
  async updateUserGameRecordInfo(id: number, record: Partial<UserGameRecord>): Promise<UserGameRecord> {
    await this.recordRepository.update(id, record);
    return (this.recordRepository.findOne({ where: { id } }));
  }

  /* [D] UserGameRecord 제거 */
  async deleteUserGameRecord(id: number): Promise<void> {
    await (this.recordRepository.delete(id));
  }
}
