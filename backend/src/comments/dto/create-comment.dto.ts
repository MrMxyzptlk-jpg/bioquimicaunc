import { IsNotEmpty, IsString, IsNumber, IsOptional, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateCommentDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(1000)
    content: string;

    @Type(() => Number)
    @IsNumber()
    postId: number;

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    parentId?: number;
}
