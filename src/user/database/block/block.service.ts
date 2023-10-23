import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Block } from './block.entity';

@Injectable()
export class BlockService {
    constructor(
      @InjectRepository(Block)
      private blockRepository: Repository<Block>,
    ) {}

    // 유저 블락리스트 조회 메서드
    async readBlockList(user: number) : Promise<Block[]> {
        return this.blockRepository.find({ where: { user } });
    }

    // 유저 블락 생성 메서드
    async createBlockInfo(block: Partial<Block>): Promise<Block> {
        return this.blockRepository.create(block);
    }

    // 유저 블락 수정 메서드
    async updateBlockInfo(id: number, block: Partial<Block>): Promise<Block> {
        await this.blockRepository.update(id, block);
        return this.blockRepository.findOne({ where: { id } });
    }

    // 유저 블락 제거 메서드
    async deleteBlockInfo(id: number): Promise<void> {
        await this.blockRepository.delete(id);
    }
}
