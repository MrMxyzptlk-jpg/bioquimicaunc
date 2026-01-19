import { IsNotEmpty, IsString, MaxLength, IsEnum, IsArray } from "class-validator";
import { ListingModality, ListingSubject } from "../entities/listing.entity";
import { Transform } from "class-transformer";


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

    @Transform(({ value }) => {
        if (typeof value === 'string') return [value];
        if (!value) return [];
        return value
    })
    @IsArray()
    @IsEnum(ListingModality, { each: true })
    modality: ListingModality[];

    @Transform(({ value }) => {
        if (typeof value === 'string') return [value];
        if (!value) return [];
        return value
    })
    @IsArray()
    @IsEnum(ListingSubject, { each: true })
    subjects: ListingSubject[];
}