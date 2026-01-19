import { Controller, Get, Post, Body, Param, Put, Delete, ParseIntPipe, Query, HttpCode, Header, Session, UnauthorizedException, UseGuards, NotFoundException, ForbiddenException, Res } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { ListingModality, ListingSubject } from './entities/listing.entity';
import { ListingsService } from './listings.service';
import { ListingsPost } from './entities/listing.entity';
import { CreateListingDto } from './dto/create-listing.dto';
import { UpdateListingDto } from './dto/update-listing.dto';
import { User } from '../users/entities/user.entity';

import { AuthenticatedGuard } from '../auth/authenticated.guard';
import { timeAgo } from '../utils/time';
import type { Response } from 'express';
import { escapeHtml } from '../utils/escapeHtml';
import { renderCheckboxGroup } from '../utils/form-utils';

@Controller('listings')
export class ListingsController {
    constructor(
        private readonly ListingsService: ListingsService,
        @InjectRepository(User)
        private readonly usersRepo: Repository<User>
    ) {}

    //@UseGuards(AuthenticatedGuard) This guard triggers the login unintentionally
    @Get('admin/form')
    @Header('Content-Type', 'text/html')
    adminCreateForm(@Session() session: Record<string, any>) {
        if (!session || !session.isAdmin) return ''; // silently render nothing

        return `
            <form
                class="forum-form"
                hx-post="/listings"
                hx-target="#listings-posts"
                hx-swap="afterbegin"
                hx-on::listing-created="this.reset()">

                <input type="hidden" id="categoryInput" name="category" value="Particulares">

                <input
                    name="title"
                    placeholder="Título del anuncio"
                    required
                    maxlength="120"
                    data-maxlength="120">
                <small class="char-counter"></small>

                <textarea
                    name="content"
                    placeholder="Descripción del servicio"
                    required
                    maxlength="5000"
                    data-maxlength="5000"></textarea>
                <small class="char-counter"></small>

                <input
                    name="price"
                    placeholder="Precio"
                    required
                    maxlength="50"
                    data-maxlength="50">
                <small class="char-counter"></small>

                <fieldset>
                    <legend>Modalidad</legend>
                    ${renderCheckboxGroup('modality', ListingModality)}
                </fieldset>

                <fieldset>
                    <legend>Materias</legend>
                    ${renderCheckboxGroup('subjects', ListingSubject)}
                </fieldset>
                <input
                    name="authorUsername"
                    placeholder="Usuario dueño del anuncio" required>

                <button type="submit"> Publicar anuncio </button>
            </form>
        `;
    }

    // 1. Create Listing (HTMX Style)
    // Returns a single HTML card to append to the list
    @UseGuards(AuthenticatedGuard)
    @Post()
    @Header('Content-Type', 'text/html')
    async create(
        @Body() body: CreateListingDto,
        @Session() session: Record<string, any>,
        @Res({ passthrough: true }) res: Response
    ) {
        // Check if user is logged in
        if (!session.userId || !session.isAdmin) throw new ForbiddenException();

        // Set authorship
        const author = await this.usersRepo.findOne({where: { name: body.authorUsername } });
        if (!author) throw new NotFoundException(`El usuario "${body.authorUsername}" no existe.`);

        // Pass user to service
        const listing = await this.ListingsService.create(body, author);
        res.header('HX-Trigger', 'listing-created');
        return this.renderListingCard(listing, session.userId, session.isAdmin); // Pass session.userId so the new listing shows buttons immediately
    }

    // 2. Get JSON (Optional, kept for debugging)
    @Get('json')
    findByCategory(@Query('category') category: string): Promise<ListingsPost[]> {
        return this.ListingsService.findByCategory(category);
    }

    @Get('fragments')
    @Header('Content-Type', 'text/html')
    async findByCategoryFragment(
        @Query('category') category: string,
        @Session() session: Record<string, any>
    ): Promise<string> {
        const listings = await this.ListingsService.findByCategory(category);

        if (listings.length === 0) {
            return `<p class="signal"> No hay publicaciones en ${category}. ¡Sé el primero! </p>`
        }

        // Conver all listings to HTML strings
        return listings.map(listing => this.renderListingCard(listing, session.userId, session.isAdmin)).join('');
    }

    @UseGuards(AuthenticatedGuard)
    @Get(':id/fragment')
    @Header('Content-Type', 'text/html')
    async listingFragment(
        @Param('id', ParseIntPipe) id: number,
        @Session() session: Record<string, any>
    ) {
        const listing = await this.ListingsService.findOne(id);
        if (!listing) throw new NotFoundException();
        return this.renderListingCard(listing, session.userId, session.isAdmin);
    }

    @Get(':id/reviews-button')
    getReviewsButton(@Param('id') id: string) {
        return this.renderShowButton(+id);
    }

    // Helper method for the button HTML
    private renderShowButton(listingId: number) {
        return `
            <button
                hx-get="/reviews/listing/${listingId}"
                hx-target="#reviews-list-${listingId}"
                hx-swap="innerHTML"
                class="listing-action-btn">
                Ver Comentarios
            </button>
        `
    }

    @UseGuards(AuthenticatedGuard)
    @Put(':id')
    @Header('Content-Type', 'text/html')
    async update(
        @Param('id', ParseIntPipe) id: number,
        @Body() body: UpdateListingDto,
        @Session() session: Record<string, any>
    ) {
        const listing = await this.ListingsService.findOne(id);

        if (!listing) throw new NotFoundException('Listing no encontrado');
        if (listing.author.id !== session.userId && !session.isAdmin) throw new ForbiddenException('No puedes editar este listing');

        const updated = await this.ListingsService.update(id, body);
        return this.renderListingCard(updated, session.userId, session.isAdmin);
    }

    @UseGuards(AuthenticatedGuard)
    @Get(':id/edit')
    @Header('Content-Type', 'text/html')
    async editForm(
        @Param('id', ParseIntPipe) id: number,
        @Session() session: Record<string, any>
    ) {
        const listing = await this.ListingsService.findOne(id);

        if (!listing) throw new NotFoundException();
        if (listing.author.id !== session.userId && !session.isAdmin) throw new ForbiddenException();

        return `
            <div class="listing" id="listing-${listing.id}">
                <form
                    hx-put="/listings/${listing.id}"
                    hx-target="#listing-${listing.id}"
                    hx-swap="outerHTML"
                    class="forum-form">

                    <input type="hidden" name="category" value="${listing.category}" required>

                    <input name="title" value="${escapeHtml(listing.title)}" required data-maxlength="120" maxlength="120">
                    <small class="char-counter"></small>

                    <textarea name="content" required data-maxlength="5000" maxlength="5000">${escapeHtml(listing.content)}</textarea>
                    <small class="char-counter"></small>

                    <input
                        name="price"
                        placeholder="Precio"
                        required
                        maxlength="50"
                        data-maxlength="50">
                    <small class="char-counter">${escapeHtml(listing.price)}</small>

                    <fieldset>
                        <legend>Modalidad</legend>
                        ${renderCheckboxGroup(
                            'modality',
                            ListingModality,
                            listing.modality
                        )}
                    </fieldset>

                    <fieldset>
                        <legend>Materias</legend>
                        ${renderCheckboxGroup(
                            'subjects',
                            ListingSubject,
                            listing.subjects
                        )}
                    </fieldset>

                    <div class="listing-actions">
                        <button type="submit"> Guardar </button>
                        <button type="button"
                            hx-get="/listings/${listing.id}/fragment"
                            hx-target="#listing-${listing.id}"
                            hx-swap="outerHTML">
                            Cancelar
                        </button>
                    </div>
                </form>
            </div>
        `;
    }

    @UseGuards(AuthenticatedGuard)
    @Delete(':id')
    @HttpCode(200)
    async delete(
        @Param('id', ParseIntPipe) id: number,
        @Session() session: Record<string, any>
    ) {
        const listing = await this.ListingsService.findOne(id);

        if (!listing) throw new NotFoundException('Listing no encontrado');

        if (listing.author.id !== session.userId && !session.isAdmin) throw new ForbiddenException('No puedes borrar este listing');

        await this.ListingsService.remove(id);
        return ""; // empty string for HTMX to swap in the HTML
    }

    // Helper Method
    private renderListingCard(listing: any, userId?: number, isAdmin?: boolean) {
        const canEdit = (listing.author?.id === userId || isAdmin)

        return `
            <div class="listing" id="listing-${listing.id}">
                <h2> ${escapeHtml(listing.title)} </h2>
                <p> ${escapeHtml(listing.content)} </p>
                <small>
                    <ul class="fa-ul">
                    <li>
                        <span class="fa-li"><i class="fas fa-feather-alt"></i></span>  Precio: ${listing.price}
                    </li>
                    <li>
                        <span class="fa-li"><i class="fas fa-feather-alt"></i></span>  Modalidad: ${escapeHtml(listing.modality.join(', '))}
                    <li>
                        <span class="fa-li"><i class="fas fa-feather-alt"></i></span>  Materias: ${escapeHtml(listing.subjects.join(', '))}
                    </ul>
                </small>

                ${ canEdit ? `
                    <div class="listing-actions">
                        <button
                            hx-delete="/listings/${listing.id}"
                            hx-target="#listing-${listing.id}"
                            hx-swap="outerHTML"
                            hx-confirm="¿Borrar listing?"
                            class="listing-action-btn">
                            Eliminar
                        </button>
                        <button
                            hx-get="/listings/${listing.id}/edit"
                            hx-target="#listing-${listing.id}"
                            hx-swap="outerHTML"
                            class="listing-action-btn">
                            Editar
                        </button>
                    </div>
                ` : ''}

                <div class="review-wrapper" style="width: 100%;">
                    <details>
                        <summary> Comentar </summary>

                        <form
                            hx-post="/reviews"
                            hx-target="#reviews-list-${listing.id}"
                            hx-swap="beforeend"
                            hx-on::before-request="
                                if (!document.querySelector('#reviews-list-${listing.id} .review-wrapper')) {
                                    htmx.ajax('GET', '/reviews/listing/${listing.id}', '#reviews-list-${listing.id}');
                                }"
                            hx-on::after-request="this.reset(); this.closest('details').removeAttribute('open');"
                            class="review-form">

                            <input type="hidden" name="listingId" value="${listing.id}">

                            <textarea type="text" name="content" placeholder="Escribe un comentario..." required data-maxlength="1000" maxlength="1000"></textarea>
                            <small class="char-counter"></small>
                            <button type="submit" class="review-btn"> Enviar </button>
                        </form>
                    </details>
                </div>

                <div id="reviews-list-${listing.id}" class="reviews-section">
                    ${this.renderShowButton(listing.id)}
                </div>
            </div>
        `
    }

}
