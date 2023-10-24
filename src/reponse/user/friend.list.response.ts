import { ApiProperty } from "@nestjs/swagger";
import { Friend } from "src/user/database/friend/friend.entity";
import { BaseResponse } from "../base.response";

export abstract class FriendListData {
    @ApiProperty()
    friends: Friend[];
}

export abstract class FriendListResponse extends BaseResponse {
    constructor() {
        super();
    }
    @ApiProperty()
    data: FriendListData;
}