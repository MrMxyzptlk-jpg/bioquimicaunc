import { Optional } from "@nestjs/common";
import { IsNotEmpty, IsNumber, IsString, MaxLength } from "class-validator";

export class CreateListingDto {
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

    @Optional()
    price: string;

    @Optional()
    modality?: string;

    @IsNumber()
    rating?: number;
}