import { ApiProperty } from "@nestjs/swagger";
import { Friend } from "src/user/database/friend/friend.entity";
import { BaseResponse } from "../base.response";

export abstract class FriendData {
    @ApiProperty()
    friend: Friend;
}

export abstract class FriendResponse extends BaseResponse {
    constructor() {
        super();
    }
    @ApiProperty()
    data: FriendData;
}