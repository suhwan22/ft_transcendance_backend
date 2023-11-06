import { ApiProperty } from "@nestjs/swagger";

export class CodeRequestDto {
    @ApiProperty()
    code: string
}