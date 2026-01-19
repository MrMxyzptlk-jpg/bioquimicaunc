import { IsNotEmpty, IsString, MaxLength, Min, Max, IsInt } from "class-validator";

export class UpdateReviewDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(1000)
    content: string;

    @IsInt()
    @Min(1)
    @Max(5)
    rating: number;
}
