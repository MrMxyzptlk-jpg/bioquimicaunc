import { IsNotEmpty, IsString, IsNumber, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateCommentDto {
    @IsString()
    @IsNotEmpty()
    content: string;

    @IsString()
    @IsNotEmpty()
    user: string;

    @Type(() => Number)
    @IsNumber()
    postId: number;

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    parentId?: number;
}
