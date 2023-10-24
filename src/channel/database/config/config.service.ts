import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Config } from './config.entity';

@Injectable()
export class ConfigService {
  constructor(
    @InjectRepository(Config)
    private configRepository: Repository<Config>,
  ) {}

  /* [C] Config 생성 */
  async createConfig(config: Partial<Config>): Promise<Config> {
    const newconfig = this.configRepository.create(config);
    return (this.configRepository.save(newconfig));
  }

  /* [R] 모든 Config 조회 */
  async readAllConfig(): Promise<Config[]> {
    return (this.configRepository.find());
  }

  /* [R] 특정 Config 조회 */
  async readOneConfig(id: number): Promise<Config> {
    return (this.configRepository.findOne({ where: { id } }));
  }

  /* [U] Config info 수정 */
  async updateConfigInfo(id: number, config: Partial<Config>): Promise<Config> {
    await this.configRepository.update(id, config);
    return (this.configRepository.findOne({ where: { id } }));
  }

  /* [D] Config 제거 */
  async deleteConfig(id: number): Promise<void> {
    await (this.configRepository.delete(id));
  }
}
  