import { Controller, Get, Post, Body, Param, Put, Delete, ParseIntPipe, Query, HttpCode, Header, Session, UnauthorizedException, UseGuards, NotFoundException, ForbiddenException, Res } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { PostsService } from './posts.service';
import { ForumPost } from './post.entity';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';

import { User } from '../users/entities/user.entity';
import { AuthenticatedGuard } from '../auth/authenticated.guard';
import { timeAgo } from '../utils/time';
import { Throttle } from '@nestjs/throttler';
import type { Response } from 'express';
import { escapeHtml } from '../utils/escapeHtml';

@Controller('posts')
export class PostsController {
    constructor(
        private readonly postsService: PostsService,
        @InjectRepository(User)
        private readonly usersRepo: Repository<User>
    ) {}

    // 1. Create Post (HTMX Style)
    // Returns a single HTML card to append to the list
    @UseGuards(AuthenticatedGuard)
    @Throttle({ default: { limit: 1, ttl: 60000 } }) // 1 post/min max
    @Post()
    @Header('Content-Type', 'text/html')
    async create(
        @Body() body: CreatePostDto,
        @Session() session: Record<string, any>,
        @Res({ passthrough: true }) res: Response
    ) {
        // Check if user is logged in
        if (!session.userId) {
            return `<div class="error"> Debes iniciar sesión para publicar. </div>`
        }

        // Find the real user
        const user = await this.usersRepo.findOneBy({ id: session.userId });
        if (!user) throw new UnauthorizedException('Usuario no válido');

        // Pass user to service
        const post = await this.postsService.create(body, user);
        res.header('HX-Trigger', 'post-created');
        return this.renderPostCard(post, session.userId); // Pass session.userId so the new post shows buttons immediately
    }

    // 2. Get JSON (Optional, kept for debugging)
    @Get('json')
    findByCategory(@Query('category') category: string): Promise<ForumPost[]> {
        return this.postsService.findByCategory(category);
    }

    @Get('fragments')
    @Header('Content-Type', 'text/html')
    async findByCategoryFragment(
        @Query('category') category: string,
        @Session() session: Record<string, any>
    ): Promise<string> {
        const posts = await this.postsService.findByCategory(category);

        if (posts.length === 0) {
            return `<p class="signal"> No hay publicaciones en ${category}. ¡Sé el primero! </p>`
        }

        // Conver all posts to HTML strings
        return posts.map(post => this.renderPostCard(post, session.userId)).join('');
    }

    @UseGuards(AuthenticatedGuard)
    @Get(':id/fragment')
    @Header('Content-Type', 'text/html')
    async postFragment(
        @Param('id', ParseIntPipe) id: number,
        @Session() session: Record<string, any>
    ) {
        const post = await this.postsService.findOne(id);
        if (!post) throw new NotFoundException();
        return this.renderPostCard(post, session.userId);
    }

    @Get(':id/comments-button')
    getCommentsButton(@Param('id') id: string) {
        return this.renderShowButton(+id);
    }

    // Helper method for the button HTML
    private renderShowButton(postId: number) {
        return `
            <button
                hx-get="/comments/post/${postId}"
                hx-target="#comments-list-${postId}"
                hx-swap="innerHTML"
                class="post-action-btn">
                Ver Comentarios
            </button>
        `
    }

    @UseGuards(AuthenticatedGuard)
    @Put(':id')
    @Header('Content-Type', 'text/html')
    async update(
        @Param('id', ParseIntPipe) id: number,
        @Body() body: UpdatePostDto,
        @Session() session: Record<string, any>
    ) {
        const post = await this.postsService.findOne(id);

        if (!post) throw new NotFoundException('Post no encontrado');
        if (post.author.id !== session.userId) throw new ForbiddenException('No puedes editar este post');

        const updated = await this.postsService.update(id, body);
        return this.renderPostCard(updated, session.userId);
    }

    @UseGuards(AuthenticatedGuard)
    @Throttle({ default: { limit: 2, ttl: 60000 } }) // 2 edits/min max
    @Get(':id/edit')
    @Header('Content-Type', 'text/html')
    async editForm(
        @Param('id', ParseIntPipe) id: number,
        @Session() session: Record<string, any>
    ) {
        const post = await this.postsService.findOne(id);

        if (!post) throw new NotFoundException();
        if (post.author.id !== session.userId) throw new ForbiddenException();

        return `
            <div class="post" id="post-${post.id}">
                <form
                    hx-put="/posts/${post.id}"
                    hx-target="#post-${post.id}"
                    hx-swap="outerHTML"
                    class="forum-form">

                    <input type="hidden" name="category" value="${post.category}" required>
                    <input name="title" value="${escapeHtml(post.title)}" required data-maxlength="120" maxlength="120">
                    <small class="char-counter"></small>
                    <textarea name="content" required data-maxlength="5000" maxlength="5000">${escapeHtml(post.content)}</textarea>
                    <small class="char-counter"></small>

                    <div class="post-actions">
                        <button type="submit"> Guardar </button>
                        <button type="button"
                            hx-get="/posts/${post.id}/fragment"
                            hx-target="#post-${post.id}"
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
        const post = await this.postsService.findOne(id);

        if (!post) throw new NotFoundException('Post no encontrado');

        if (post.author.id !== session.userId) throw new ForbiddenException('No puedes borrar este post');

        await this.postsService.remove(id);
        return ""; // empty string for HTMX to swap in the HTML
    }

    // Helper Method
    private renderPostCard(post: any, userId?: number) {
        const canEdit = post.author?.id === userId

        const created = new Date(post.createdAt);
        const updated = new Date(post.updatedAt);
        // Check if updated time is later than created time (by at least 1 second to be safe)
        const isEdited = updated.getTime() > (created.getTime() + 1000);

        return `
            <div class="post" id="post-${post.id}">
                <h2> ${escapeHtml(post.title)} </h2>
                <small>
                    <strong>${escapeHtml(post.author.name)}</strong>
                    | ${timeAgo(post.createdAt)}
                    ${isEdited ? `[Editado: ${timeAgo(post.updatedAt)}]` : ''}
                </small>
                <p> ${escapeHtml(post.content)} </p>

                ${ canEdit ? `
                    <div class="post-actions">
                        <button
                            hx-delete="/posts/${post.id}"
                            hx-target="#post-${post.id}"
                            hx-swap="outerHTML"
                            hx-confirm="¿Borrar post?"
                            class="post-action-btn">
                            Eliminar
                        </button>
                        <button
                            hx-get="/posts/${post.id}/edit"
                            hx-target="#post-${post.id}"
                            hx-swap="outerHTML"
                            class="post-action-btn">
                            Editar
                        </button>
                    </div>
                ` : ''}

                <div class="comment-wrapper" style="width: 100%;">
                    <details>
                        <summary> Comentar </summary>

                        <form
                            hx-post="/comments"
                            hx-target="#comments-list-${post.id}"
                            hx-swap="beforeend"
                            hx-on::before-request="
                                if (!document.querySelector('#comments-list-${post.id} .comment-wrapper')) {
                                    htmx.ajax('GET', '/comments/post/${post.id}', '#comments-list-${post.id}');
                                }"
                            hx-on::after-request="this.reset(); this.closest('details').removeAttribute('open');"
                            class="comment-form">

                            <input type="hidden" name="postId" value="${post.id}">

                            <textarea type="text" name="content" placeholder="Escribe un comentario..." required data-maxlength="1000" maxlength="1000"></textarea>
                            <small class="char-counter"></small>
                            <button type="submit" class="comment-btn"> Enviar </button>
                        </form>
                    </details>
                </div>

                <div id="comments-list-${post.id}" class="comments-section">
                    ${this.renderShowButton(post.id)}
                </div>
            </div>
        `
    }

}
