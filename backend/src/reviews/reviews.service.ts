import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { Review } from './entities/review.entity';

import { ListingsPost } from '../listings/entities/listing.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class ReviewsService {

    constructor(
        @InjectRepository(Review)
        private reviewsRepo: Repository<Review>,

        @InjectRepository(ListingsPost)
        private listingsRepo: Repository<ListingsPost>,
    ) {}

    async create(createReviewDto: CreateReviewDto, user: User) {
        const listing = await this.listingsRepo.findOneBy({ id: createReviewDto.listingId });
        if (!listing) throw new NotFoundException('Anuncio no encontrado');
        if (listing.author.id === user.id) throw new ForbiddenException('No podés reseñar tu propio anuncio');

        const existing = await this.reviewsRepo.findOne({
            where: {
                listing: { id: listing.id },
                author: { id: user.id },
            }
        });
        if (existing)  throw new ForbiddenException('Ya reseñaste este anuncio');

        const review = this.reviewsRepo.create({
            content: createReviewDto.content,
            rating: createReviewDto.rating,
            author: user,
            listing,
        });

        listing.ratingSum += review.rating;
        listing.ratingCount += 1;
        await this.listingsRepo.save(listing);

        return this.reviewsRepo.save(review);
    }

    async findByPost(listingId:number) {
        return this.reviewsRepo.find({
            where: { listing: { id: listingId } },
            relations: ['listing', 'author'],
            order: { createdAt: 'DESC' }
        });
    }

    findAll() {
        return `This action returns all reviews`;
    }

    async findOne(id: number) {
        return this.reviewsRepo.findOne({
            where: { id },
            relations:  ['author', 'listing']
        });
    }

    async update(id: number, newReview: UpdateReviewDto): Promise<Review> {
        const review = await this.reviewsRepo.findOne({ where: { id }, relations: ['author', 'listing'] });

        if (!review) throw new NotFoundException(`Review with id ${id} not found after update`);

        if (newReview.content !== undefined) review.content = newReview.content;
        review.listing.ratingSum += (newReview.rating - review.rating);
        review.rating = newReview.rating
        await this.listingsRepo.save(review.listing)

        return this.reviewsRepo.save(review);
    }

    async remove(id: number): Promise<Review> {
        const review = await this.reviewsRepo.findOne({
            where: { id },
            relations: ['listing'],
        });

        if (!review) throw new NotFoundException(`Review with id ${id} not found after delete`);

        review.listing.ratingSum -= review.rating;
        review.listing.ratingCount -= 1;

        await this.listingsRepo.save(review.listing);

        return this.reviewsRepo.remove(review);
    }
}
