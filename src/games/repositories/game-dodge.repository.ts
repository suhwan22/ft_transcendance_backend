import { Injectable } from "@nestjs/common";
import { DataSource, Repository } from "typeorm";
import { GameDodge } from "../entities/game-dodge.entity";

@Injectable()
export class GameDodgeRepository extends Repository<GameDodge> {
  constructor(dataSource: DataSource) {
    super(GameDodge, dataSource.createEntityManager());
  }

  async createGameDodge(userId: number) {
    const gameDodge = this.createQueryBuilder('game_dodge')
      .insert()
      .into(GameDodge)
      .values({ user: () => `${userId}`, execute: false })
      .execute();
  }
  
  async updateGameDodge(id: number, execute: boolean) {
    await this.update(id, { execute });
  }

  async readGameDodge(userId: number) {
    const gameDodge = await this.createQueryBuilder('game_dodge')
      .select(['game_dodge.id', 'game_dodge.date', 'game_dodge.execute'])
      .where(`user_id = ${userId}`)
      .getOne();
    return (gameDodge);
  }

  async deleteGameDodge(id: number) {
    await this.delete(id);
  }
}