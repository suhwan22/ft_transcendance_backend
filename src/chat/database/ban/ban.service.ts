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
  
    async readBanList(channel: number): Promise<Ban[]> {
        return (this.banRepository.find({ where: { channel } }));
    }

    async createBanInfo(ban: Partial<Ban>): Promise<Ban> {
        const newBan = this.banRepository.create(ban);
        return (this.banRepository.save(newBan));
    }

    async updateBanInfo(id: number, ban: Partial<Ban>): Promise<Ban> {
        await this.banRepository.update(id, ban);
        return (this.banRepository.findOne({ where: { id } }));
    }

    async deleteBanInfo(channel: number, user: number): Promise<void> {
        const deleteBan = await this.banRepository.findOne({ where: { channel, user } });
        if (!deleteBan)
            return ;
        await this.banRepository.remove(deleteBan);
    }

    async deleteBanList(channel: number): Promise<void> {
        await this.banRepository.delete({ channel });
    }
}
