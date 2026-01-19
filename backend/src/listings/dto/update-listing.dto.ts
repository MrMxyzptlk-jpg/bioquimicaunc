import { IsNotEmpty, IsString, MaxLength, IsEnum, IsArray, ArrayNotEmpty } from "class-validator";
import { ListingModality, ListingSubject } from "../entities/listing.entity";

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
    price: string;

    @IsArray()
    @ArrayNotEmpty()
    @IsEnum(ListingModality, { each: true })
    modality: ListingModality[];

    @IsArray()
    @ArrayNotEmpty()
    @IsEnum(ListingSubject, { each: true })
    subjects: ListingSubject[];
}