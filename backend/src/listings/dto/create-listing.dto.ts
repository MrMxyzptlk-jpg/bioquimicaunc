import { IsArray, IsEnum, IsNotEmpty, IsString, MaxLength, ArrayNotEmpty, IsEmail } from "class-validator";
import { ListingModality, ListingSubject } from "../entities/listing.entity";
import { Transform } from "class-transformer";

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
    price: string;

    @IsEmail()
    @IsNotEmpty()
    contactEmail: string;

    @IsString()
    contactCell?: string;

    @Transform(({ value }) => {
        if (typeof value === 'string') return [value];
        if (!value) return [];
        return value
    })
    @IsArray()
    @ArrayNotEmpty({ message: 'Debe seleccionar al menos una modalidad' })
    @IsEnum(ListingModality, { each: true })
    modality: ListingModality[];

    @Transform(({ value }) => {
        if (typeof value === 'string') return [value];
        if (!value) return [];
        return value
    })
    @IsArray()
    @ArrayNotEmpty({ message: 'Debe seleccionar al menos una modalidad' })
    @IsEnum(ListingSubject, { each: true })
    subjects: ListingSubject[];

    @IsString()
    @IsNotEmpty()
    category: string;

    @IsString()
    @IsNotEmpty()
    authorUsername: string;
}