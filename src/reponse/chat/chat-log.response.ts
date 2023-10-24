import { ApiProperty } from "@nestjs/swagger";
import { BaseResponse } from "../base.response";
import { ChatLog } from "src/chat/database/chat-log/chat-log.entity";

export abstract class ChatLogData {
    @ApiProperty()
    chatLog: ChatLog;
}

export abstract class ChatLogResponse extends BaseResponse {
    constructor() {
        super();
    }
    @ApiProperty()
    data: ChatLogData;
}