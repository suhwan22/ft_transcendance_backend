import { ApiProperty } from "@nestjs/swagger";
import { BaseResponse } from "../base.response";
import { Block } from "src/user/database/block/block.entity";

export abstract class BlockListData {
    @ApiProperty()
    block: Block[];
}

export abstract class BlockListResponse extends BaseResponse {
    constructor() {
        super();
    }
    @ApiProperty()
    data: BlockListData;
}