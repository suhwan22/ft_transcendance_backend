import { Injectable } from "@nestjs/common";
import { DataSource, Repository } from "typeorm";
import { PlayerRequestDto } from "../dtos/player.request.dto"
import { Player } from "../entities/player.entity"


/* PLAYER Table CRUD */

@Injectable()
export class PlayerRepository extends Repository<Player> {
  constructor(private dataSource: DataSource) {
    super(Player, dataSource.createEntityManager());
  }

  /* [C] Player 생성 */
  async createPlayer(player: Partial<PlayerRequestDto>): Promise<Player> {
    const newplayer = this.create(player);
    return (this.save(newplayer));
  }

  /* [R] 특정 Player 조회 */
  async readOnePlayer(id: number): Promise<Player> {
    const player = await this.findOne({ where: { id } });
    return (player);
  }

  /* [R] 특정 name 으로 Player 조회 */
  async   readOnePlayerWithName(name: string): Promise<Player> {
    const player = await this.findOne({ where: { name } });
    return (player);
  }

  // /* join안하는 read */
  // async readOnePurePlayer(id: number): Promise<Player> {
  //   const player = await this.findOne({ where: { id } });
  //   return (player);
  // }

  // /* [U] Player info 수정 */
  // async updatePlayerInfo(id: number, player: Partial<Player>): Promise<Player> {
  //   await this.update(id, player);
  //   return (this.findOne({ where: { id } }));
  // }

  /* [U] Player name, avatar 수정 */
  async updatePlayer(userId: number, name: string, avatar: string) {
    const update = await this.createQueryBuilder('player')
      .update()
      .set({ name: name, avatar: avatar })
      .where("id = :userId", { userId: userId })
      .execute()
    return (update);
  }

  /* [U] Player status 수정 */
  async updatePlayerStatus(id: number, status: number): Promise<Player> {
    await this.update(id, { status: status });
    return (this.findOne({ where: { id } }));
  }

  /* [D] Player 제거 */
  async deletePlayer(id: number): Promise<void> {
    await (this.delete(id));
  }
}