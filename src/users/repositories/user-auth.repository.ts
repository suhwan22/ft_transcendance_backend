import { Injectable } from "@nestjs/common";
import { DataSource, Repository } from "typeorm";
import { UserAuth } from "../entities/user-auth.entity";
import { hash } from "bcrypt";

@Injectable()
export class UserAuthRepository extends Repository<UserAuth> {
  constructor(private dataSource: DataSource) {
    super(UserAuth, dataSource.createEntityManager());
  }

  /* auth_list Table CRUD */

  /* [C] UserAuth 생성 */
  async createUserAuth(userId: number): Promise<UserAuth> {
    const userAuth = { userId: userId, refreshToken: null, twoFactorAuthSecret: null };
    const newUserAuth = this.create(userAuth);
    return (this.save(newUserAuth));
  }

  /* [R] UserAuth 조회 */
  async readUserAuth(userId: number): Promise<UserAuth> {
    return (this.findOne({ where: { userId } }));
  }

  /* [U] refreshToken 수정 */
  async updateRefreshToken(refreshToken: string, userId: number): Promise<UserAuth> {
    let hashToken = null;
    if (refreshToken)
      hashToken = await hash(refreshToken, 10);
    this.update(userId, { refreshToken: hashToken });
    return (this.readUserAuth(userId));
  }

  /* [U] TwoFactorAuth 수정 */
  async updateTwoFactorAuthSecret(secret: string, userId: number): Promise<UserAuth> {
    this.update(userId, { twoFactorAuthSecret: secret });
    return (this.readUserAuth(userId));
  }

  /* [D] TwoFactorAuth 제거 */
  async deleteUserAuth(userId: number): Promise<void> {
    this.delete(userId);
  }
}