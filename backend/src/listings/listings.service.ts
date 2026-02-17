import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CreateListingDto } from './dto/create-listing.dto';
import { UpdateListingDto } from './dto/update-listing.dto';
import { ListingsPost } from './entities/listing.entity';

import { User } from '../users/entities/user.entity';

@Injectable()
export class ListingsService {
    constructor(
        @InjectRepository(ListingsPost)
        private readonly listingRepository: Repository<ListingsPost>,
    ){}

    // Create a Listing
    async create(data: CreateListingDto, author: User): Promise<ListingsPost> {
        const listingPost = this.listingRepository.create({
            title: data.title,
            content: data.content,
            price: data.price,
            modality: data.modality,
            subjects: data.subjects,
            category: data.category,
            contactEmail: data.contactEmail,
            contactCell: data.contactCell,
            author
        });
        return this.listingRepository.save(listingPost)
    }

    // Update Listings
    async update(id: number, data: UpdateListingDto): Promise<ListingsPost> {
        const listingPost = await this.listingRepository.findOne({
            where: { id },
        });

        if (!listingPost) throw new NotFoundException(`Listing ${id} not found`);
        if (data.title !== undefined) listingPost.title = data.title;
        if (data.content !== undefined) listingPost.content = data.content;
        if (data.price !== undefined) listingPost.price = data.price;
        if (Array.isArray(data.modality) && data.modality.length > 0) listingPost.modality = data.modality;
        if (Array.isArray(data.subjects) && data.subjects.length > 0) listingPost.subjects = data.subjects;
        if (data.contactEmail !== undefined) listingPost.contactEmail = data.contactEmail;
        if (data.contactCell !== undefined) listingPost.contactCell = data.contactCell;

        return this.listingRepository.save(listingPost);
    }

    // Delete a Listing
    async remove(id: number): Promise<void> {
        const result = await this.listingRepository.delete(id);
        if (result.affected === 0 ) throw new NotFoundException(`Listing ${id} not found`);
    }

    // Filter by category
    async findByCategory(category: string): Promise<ListingsPost[]> {
        if (!category) return [];

        return this.listingRepository.find({
            where: { category: category },
            relations: ['author'],
            order: { createdAt: 'DESC' }
        });
    }

    findOne(id: number) {
        return this.listingRepository.findOne({
            where: { id },
            relations: ['author']
        });
    }

}