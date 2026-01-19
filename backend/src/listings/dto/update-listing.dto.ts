import { IsNotEmpty, IsString, MaxLength } from "class-validator";

export class UpdateListingDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(120)
    title: string;

    @IsString()
    @IsNotEmpty()
    @MaxLength(5000)
    content: string;

    @IsString()
    @IsNotEmpty()
    category: string;
}