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
        if (listing.author.id === user.id) {
            throw new ForbiddenException('No podés reseñar tu propio anuncio');
        }

        const review = this.reviewsRepo.create({
            content: createReviewDto.content,
            author: user,
            listing: listing,
        });

        return this.reviewsRepo.save(review);
    }

    async findByPost(listingId:number) {
        return this.reviewsRepo.find({
            where: { listing: { id: listingId } },
            relations: ['listing', 'author', 'parent'],
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

        return this.reviewsRepo.save(review);
    }

    async remove(id: number): Promise<Review> {
        await this.reviewsRepo.update(id, { content: '[Comentario borrado]'}); //author: null in case we want to remove the author as well
        const review = await this.findOne(id);

        if (!review) throw new NotFoundException(`Review with id ${id} not found after delete`);

        return review;
    }
}
