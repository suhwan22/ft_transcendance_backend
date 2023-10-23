import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Ban } from './ban.entity';

@Injectable()
export class BanService {
    constructor(
        @InjectRepository(Ban)
        private banRepository: Repository<Ban>,
    ) {}
  
    async readMuteList(channel: number): Promise<Ban[]> {
        return (this.banRepository.find({ where: { channel } }));
    }

    async createMuteInfo(ban: Partial<Ban>): Promise<Ban> {
        return (this.banRepository.create(ban));
    }

    async updateMutenfo(id: number, ban: Partial<Ban>): Promise<Ban> {
        await this.banRepository.update(id, ban);
        return (this.banRepository.findOne({ where: { id } }));
    }

    async deleteMutenfo(id: number): Promise<void> {
        await this.banRepository.delete(id);
    }
}
