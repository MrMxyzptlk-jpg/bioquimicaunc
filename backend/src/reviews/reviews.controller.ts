import { Controller, Get, Post, Body, Patch, Param, Delete, Header, Session, UnauthorizedException, UseGuards, ForbiddenException, NotFoundException, ParseIntPipe, HttpCode, Put } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { User } from '../users/entities/user.entity';
import { timeAgo } from '../utils/time';

import { Review } from './entities/review.entity'
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { AuthenticatedGuard } from '../auth/authenticated.guard';
import { Throttle } from '@nestjs/throttler';
import { escapeHtml } from '../utils/escapeHtml';
import { featherIcon } from 'src/utils/form-utils';

@Controller('reviews')
export class ReviewsController {
    constructor(
        private readonly reviewsService: ReviewsService,
        @InjectRepository(User)
        private readonly usersRepo: Repository<User>,
    ) {}

    @UseGuards(AuthenticatedGuard)
    @Throttle({ default: { limit: 3, ttl: 60000 } }) // 3 reviews/min max
    @Post()
    @Header('Content-Type', 'text/html')
    async create(@Body() createReviewDto: CreateReviewDto, @Session() session: Record<string, any>) {

        const user = await this.usersRepo.findOneBy({ id: session.userId });
        if (!user) throw new UnauthorizedException();

        const newReview = await this.reviewsService.create(createReviewDto, user);
        return this.renderSingleReview(newReview, session?.userId, session?.isAdmin);
    }

    @Get('listing/:listingId')
    @Header('Content-Type', 'text/html')
    async findByListing(
        @Param('listingId') listingId: string,
        @Session() session: Record<string, any>
    ) {
        const allReviews = await this.reviewsService.findByListing(+listingId);

        const hideButton = `
            <button
                hx-get="/listings/${listingId}/reviews-button"
                hx-target="#reviews-list-${listingId}"
                hx-swap="innerHTML"
                class="listing-action-btn">
                Ocultar Opiniones
            </button>
        `;

        if (allReviews.length === 0 ) return hideButton + '<p class="text-muted"> No hay opiniones aún. </p>';

        return hideButton + allReviews.map(r => this.renderSingleReview(r, session?.userId, session?.isAdmin)).join('');
    }

    @UseGuards(AuthenticatedGuard)
    @Throttle({ default: { limit: 5, ttl: 60000 } })
    @Delete(':id')
    @Header('Content-type', 'text/html')
    async delete(
        @Param('id', ParseIntPipe) id: number,
        @Session() session: Record<string, any>
    ) {
        const review = await this.reviewsService.findOne(id);

        if (!review) throw new NotFoundException();
        if (review.author.id !== session.userId && !session.isAdmin) throw new ForbiddenException('No puedes borrar esta publicación');

        const deletedReview = await this.reviewsService.remove(id);
        return this.renderSingleReview(deletedReview, session.userId, session.isAdmin);
    }

    @UseGuards(AuthenticatedGuard)
    @Get(':id/edit')
    @Header('Content-type', 'text/html')
    async editForm(
        @Param('id', ParseIntPipe) id: number,
        @Session() session: Record<string, any>
    ) {
        const review = await this.reviewsService.findOne(id);

        if (!review) throw new NotFoundException();
        if (review.author.id !== session.userId && !session.isAdmin) throw new ForbiddenException('No puedes editar esta publicación.');

        return `
            <div class="review-wrapper" id="review-${review.id}">
                <form
                    hx-put="/reviews/${review.id}"
                    hx-target="#review-${review.id}"
                    hx-swap="outerHTML"
                    class="review-form">

                    <label>
                        Calificación:
                        <div class="rating">
                            <input type="radio" name="rating" id="edit-rate-5-${review.id}" value="5" ${review.rating === 5 ? 'checked' : ''} required>
                            <label for="edit-rate-5-${review.id}">${featherIcon}</label>

                            <input type="radio" name="rating" id="edit-rate-4-${review.id}" value="4" ${review.rating === 4 ? 'checked' : ''}>
                            <label for="edit-rate-4-${review.id}">${featherIcon}</label>

                            <input type="radio" name="rating" id="edit-rate-3-${review.id}" value="3" ${review.rating === 3 ? 'checked' : ''}>
                            <label for="edit-rate-3-${review.id}">${featherIcon}</label>

                            <input type="radio" name="rating" id="edit-rate-2-${review.id}" value="2" ${review.rating === 2 ? 'checked' : ''}>
                            <label for="edit-rate-2-${review.id}">${featherIcon}</label>

                            <input type="radio" name="rating" id="edit-rate-1-${review.id}" value="1" ${review.rating === 1 ? 'checked' : ''}>
                            <label for="edit-rate-1-${review.id}">${featherIcon}</label>
                        </div>
                    </label>

                    <textarea
                        type="text"
                        name="content"
                        required
                        data-maxlength="1000"
                        maxlength="1000">${escapeHtml(review.content)}</textarea>
                    <small class="char-counter"></small>

                    <div class="review-actions">
                        <button type="button"
                            hx-get="/reviews/${review.id}"
                            hx-target="#review-${review.id}"
                            hx-swap="outerHTML">
                            Cancelar
                        </button>
                        <button type="submit"> Guardar </button>
                    </div>
                </form>
            </div>
        `
    }

    @UseGuards(AuthenticatedGuard)
    @Put(':id')
    @Header('Content-Type', 'text/html')
    @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 edits/min max
    async update(
        @Param('id', ParseIntPipe) id: number,
        @Body() UpdateReviewDto: UpdateReviewDto,
        @Session() session: Record<string, any>
    ) {
        const review = await this.reviewsService.findOne(id);

        if (!review) throw new NotFoundException();
        if (review.author.id !== session.userId && !session.isAdmin) throw new ForbiddenException('No puedes editar esta publicación');

        const updatedReview = await this.reviewsService.update(id, UpdateReviewDto);
        return this.renderSingleReview(updatedReview, session.userId, session?.isAdmin);
    }

    @Get(':id')
    @Header('Content-Type', 'text/html')
    async fragment(@Param('id', ParseIntPipe) id: number, @Session() session) {
        const review = await this.reviewsService.findOne(id);
        if (!review) throw new NotFoundException();

        return this.renderSingleReview(review, session?.userId, session?.isAdmin)
    }

    private renderSingleReview(review: Review, UserId?: number, isAdmin?: boolean) {
        const isDeleted = review.content === '[Comentario borrado]'
        const canEdit = (!isDeleted) && (review.author?.id === UserId || isAdmin); //can edit if NOT deleted and current user is the author

        const created = new Date(review.createdAt);
        const updated = new Date(review.updatedAt);
        const isEdited = updated.getTime() > (created.getTime() + 100); // 1s buffer

        return `
            <div class="review-wrapper" id="review-${review.id}">
                <div class="review-content" style="margin-left: 10px;">
                    <small class="review-details">
                        <strong>${escapeHtml(review.author.name)}</strong>
                        | ${this.renderRating(review.rating)}
                        | ${timeAgo(review.createdAt)}
                        ${ isEdited ? `[Editado: ${timeAgo(review.updatedAt)}]` : ''}
                    </small>
                    <p class="${isDeleted ? 'text-muted' : ''}">${escapeHtml(review.content)}</p>

                </div>
                <div class="review-actions">
                    ${canEdit ? `
                        <button
                            hx-get="/reviews/${review.id}/edit"
                            hx-target="#review-${review.id}"
                            hx-swap="outerHTML">
                            Editar
                        </button>
                        <button
                            hx-delete="/reviews/${review.id}"
                            hx-target="#review-${review.id}"
                            hx-swap="outerHTML"
                            hx-confirm="¿Borrar opinión?">
                            Eliminar
                        </button>
                    ` : ''}
                </div>


            </div>
        `;
    }

    private renderRating(rating: number) {
        return featherIcon.repeat(rating)
    }
}
