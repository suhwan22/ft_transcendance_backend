import { ApiProperty } from "@nestjs/swagger";
import { BaseResponse } from "../base.response";
import { Ban } from "src/chat/database/ban/ban.entity";

export abstract class BanData {
    @ApiProperty()
    ban: Ban;
}

export abstract class BanResponse extends BaseResponse {
    constructor() {
        super();
    }
    @ApiProperty()
    data: BanData;
}