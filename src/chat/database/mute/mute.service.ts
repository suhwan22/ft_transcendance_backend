import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Mute } from './mute.entity';

@Injectable()
export class MuteService {
    constructor(
        @InjectRepository(Mute)
        private muteRepository: Repository<Mute>,
    ) {}
  
    async readMuteList(channel: number): Promise<Mute[]> {
        return (this.muteRepository.find({ where: { channel } }));
    }

    async createMuteInfo(mute: Partial<Mute>): Promise<Mute> {
        return (this.muteRepository.create(mute));
    }

    async updateMutenfo(id: number, mute: Partial<Mute>): Promise<Mute> {
        await this.muteRepository.update(id, mute);
        return (this.muteRepository.findOne({ where: { id } }));
    }

    async deleteMutenfo(id: number): Promise<void> {
        await this.muteRepository.delete(id);
    }
}
