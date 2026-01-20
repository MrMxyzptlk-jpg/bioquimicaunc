import { IsNotEmpty, IsString, IsNumber, MaxLength, Min, Max, IsInt } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateReviewDto {
    @Type(() => Number)
    @IsNumber()
    listingId: number;

    @IsString()
    @IsNotEmpty()
    @MaxLength(1000)
    content: string;

    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(5)
    rating: number;
}
