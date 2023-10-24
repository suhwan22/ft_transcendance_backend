import { ApiProperty } from "@nestjs/swagger";
import { BaseResponse } from "../base.response";
import { Ban } from "src/chat/database/ban/ban.entity";

export abstract class BanListData {
    @ApiProperty()
    bans: Ban[];
}

export abstract class BanListResponse extends BaseResponse {
    constructor() {
        super();
    }
    @ApiProperty()
    data: BanListData;
}