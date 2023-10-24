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
        const newMute = this.muteRepository.create(mute);
        return (this.muteRepository.save(newMute));
    }

    async updateMutenfo(id: number, mute: Partial<Mute>): Promise<Mute> {
        await this.muteRepository.update(id, mute);
        return (this.muteRepository.findOne({ where: { id } }));
    }

    async deleteMutenfo(channel: number, user: number): Promise<void> {
        const deleteMute = await this.muteRepository.findOne({ where: { channel, user} });
        if (!deleteMute)
            return ;
        await this.muteRepository.remove(deleteMute);
    }

    async deleteFriendList(channel: number): Promise<void> {
        await this.muteRepository.delete({ channel });
    }
}
