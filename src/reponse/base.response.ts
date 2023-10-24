import { ApiProperty } from "@nestjs/swagger";

export abstract class BaseResponse {
    @ApiProperty()
    code: number;

    @ApiProperty()
    messgae: string;
}