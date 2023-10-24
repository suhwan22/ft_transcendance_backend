import { ApiProperty } from "@nestjs/swagger";
import { BaseResponse } from "../base.response";
import { Block } from "src/user/database/block/block.entity";

export abstract class BlockData {
    @ApiProperty()
    block: Block;
}

export abstract class BlockResponse extends BaseResponse {
    constructor() {
        super();
    }
    @ApiProperty()
    data: BlockData;
}