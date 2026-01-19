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
    async create(data: CreateListingDto, user: User): Promise<ListingsPost> {
        const forumListing = this.listingRepository.create({
            title: data.title,
            content: data.content,
            category: data.category,
            author: user,
        });
        return this.listingRepository.save(forumListing)
    }

    // Update Listings
    async update(id: number, data: UpdateListingDto): Promise<ListingsPost> {
        const forumListing = await this.listingRepository.findOne({
            where: { id },
        });

        if (!forumListing) throw new NotFoundException(`Note ${id} not found`);
        if (data.title !== undefined) forumListing.title = data.title;
        if (data.content !== undefined) forumListing.content = data.content;

        return this.listingRepository.save(forumListing);
    }

    // Delete a Listing
    async remove(id: number): Promise<void> {
        const result = await this.listingRepository.delete(id);
        if (result.affected === 0 ) throw new NotFoundException(`Note ${id} not found`);
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