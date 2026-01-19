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
        if (!session.userId) return `<div class="error"> Se necesita sesión iniciada </div>`;

        const user = await this.usersRepo.findOneBy({ id: session.userId });
        if (!user) throw new UnauthorizedException();

        const newReview = await this.reviewsService.create(createReviewDto, user);
        return this.renderSingleReview(newReview, session?.userId, session?.isAdmin);
    }

    @Get('listing/:listingId')
    @Header('Content-Type', 'text/html')
    async findByPost(
        @Param('listingId') listingId: string,
        @Session() session: Record<string, any>
    ) {
        const allReviews = await this.reviewsService.findByPost(+listingId);

        const hideButton = `
            <button
                hx-get="/listings/${listingId}/reviews-button"
                hx-target="#reviews-list-${listingId}"
                hx-swap="innerHTML"
                class="listing-action-btn">
                Ocultar Comnetarios
            </button>
        `;

        if (allReviews.length === 0 ) return hideButton + '<p class="text-muted"> No hay comentarios aún. </p>';

        return hideButton + allReviews.map(c => this.renderReviewTree(c, allReviews, session?.userId)).join('');
    }

    @UseGuards(AuthenticatedGuard)
    @Delete(':id')
    @Header('Content-type', 'text/html')
    async delete(
        @Param('id', ParseIntPipe) id: number,
        @Session() session: Record<string, any>
    ) {
        const review = await this.reviewsService.findOne(id);

        if (!review) throw new NotFoundException();
        if (review.author.id !== session.userId && !session.isAdmin) throw new ForbiddenException();

        const deletedReview = await this.reviewsService.remove(id);
        const allReviews = await this.reviewsService.findByPost(deletedReview.listing.id);
        return this.renderReviewTree(deletedReview, allReviews, session.userId);
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
        if (review.author.id !== session.userId && !session.isAdmin) throw new ForbiddenException();

        return `
            <div class="review-wrapper" id="review-${review.id}">
                <form
                    hx-put="/reviews/${review.id}"
                    hx-target="#review-${review.id}"
                    hx-swap="outerHTML"
                    class="review-form">

                    <textarea
                        name="content"
                        required
                        data-maxlength="1000"
                        maxlength="1000">${escapeHtml(review.content)}</textarea>
                    <small class="char-counter"></small>

                    <div class="review-actions">
                        <button type="submit"> Guardar </button>
                        <button type="button"
                            hx-get="/reviews/${review.id}"
                            hx-target="#review-${review.id}"
                            hx-swap="outerHTML">
                            Cancel
                        </button>
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
        if (review.author.id !== session.userId && !session.isAdmin) throw new ForbiddenException();

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
                        <strong>${review.author.name}</strong> | ${timeAgo(review.createdAt)}
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
                            hx-confirm="¿Borrar comentario?">
                            Eliminar
                        </button>
                    ` : ''}
                </div>


            </div>
        `;
    }

    private renderReviewTree(
        review: any,
        allReviews: any[],
        userId?: number,
        level = 0
    ) {
        const children = allReviews.filter(c => c.parent && c.parent.id === review.id); // all children from this review

        const paddingLeft = level * 15; // level-based indent

        const isDeleted = review.content === '[Comentario borrado]';
        const canEdit = !isDeleted && (review.author?.id === userId);

        const created = new Date(review.createdAt);
        const updated = new Date(review.updatedAt);
        // Compare times
        const wasEdited = updated.getTime() > (created.getTime() + 1000);

        return `
            <div class="review-wrapper" id="review-${review.id}">
                <div class="review-content" style="padding-left: ${paddingLeft}px;">
                    <small class="review-details">
                        <strong> ${review.author.name} </strong> | ${timeAgo(review.createdAt)}
                        ${ wasEdited ? `[Editado: ${timeAgo(review.updatedAt)}]` : ''}
                    </small>
                    <p class="${isDeleted ? 'text-muted' : ''}">${escapeHtml(review.content)}</p>
                </div>

                ${ canEdit ? `
                    <div class="review-actions">
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
                            hx-confirm="¿Borrar comentario?">
                            Eliminar
                        </button>
                    </div>
                ` : ''}

                ${ !isDeleted ? `
                    <details>
                        <summary> Responder </summary>

                        <form hx-post="/reviews"
                            hx-target="#children-container-${review.id}"
                            hx-swap="beforeend"
                            hx-on::after-request="this.reset(); this.closest('details').removeAttribute('open');"
                            class="review-form">

                            <input type="hidden" name="listingId" value="${review.listing ? review.listing.id : review.listingId}">
                            <input type="hidden" name="parentId" value="${review.id}">

                            <textarea
                                type="text"
                                name="content"
                                placeholder="Respuesta..."
                                required
                                data-maxlength="1000"
                                maxlength="1000"></textarea>
                            <small class="char-counter"></small>
                            <button type="submit" style="font-size:0.8rem;"> Enviar </button>
                        </form>
                    </details>
                ` : ''}

                <div id="children-container-${review.id}">
                    ${children.map(child => this.renderReviewTree(child, allReviews, userId, level + 1)).join('')}
                </div>

            </div>
        `;
    }
}
