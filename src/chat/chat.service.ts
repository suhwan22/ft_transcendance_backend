import { Body, Injectable } from '@nestjs/common';
import { BanService } from './database/ban/ban.service';
import { ChatLogService } from './database/chat-log/chat-log.service';
import { MuteService } from './database/mute/mute.service';
import { ChatLog } from './database/chat-log/chat-log.entity';
import { Ban } from './database/ban/ban.entity';
import { Mute } from './database/mute/mute.entity';

@Injectable()
export class ChatService {
    constructor(
        private readonly banService: BanService,
        private readonly muteService: MuteService,
        private readonly chatLogService: ChatLogService,
    ) {}

    async readChatLogList(channel: number): Promise<ChatLog[]> {
        return (this.chatLogService.readChatLogList(channel))
    }

    async createChatLogInfo(@Body() chatLog: ChatLog): Promise<ChatLog> {
        return (this.chatLogService.createChatLogInfo(chatLog));
    }

    async deleteChatLogList(channel: number): Promise<void> {
        await this.chatLogService.deleteCatLogList(channel);
    }

    async readBanList(channel: number): Promise<Ban[]> {
        return (this.banService.readBanList(channel));
    }

    async createBanInfo(ban: Ban): Promise<Ban> {
        return (this.banService.createBanInfo(ban));
    }

    async deleteBanInfo(channel: number, user: number): Promise<void> {
        await (this.banService.deleteBanInfo(channel, user));
    }

    async deleteBanList(channel: number): Promise<void> {
        await (this.banService.deleteBanList(channel));
    }

    async createMuteInfo(mute: Mute): Promise<Mute> {
        return (this.muteService.createMuteInfo(mute));
    }
}
