import { ApiProperty } from "@nestjs/swagger";
import { BaseResponse } from "../base.response";
import { ChatLog } from "src/chat/database/chat-log/chat-log.entity";

export abstract class ChatLogListData {
    @ApiProperty()
    chatLogs: ChatLog[];
}

export abstract class ChatLogListResponse extends BaseResponse {
    constructor() {
        super();
    }
    @ApiProperty()
    data: ChatLogListData;
}