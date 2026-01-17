import { Controller, Get, Post, Body, Param, Put, Delete, ParseIntPipe, Query, HttpCode, Header, Session, UnauthorizedException, UseGuards, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { PostsService } from './posts.service';
import { ForumPost } from './post.entity';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';

import { User } from '../users/entities/user.entity';
import { AuthenticatedGuard } from '../auth/authenticated.guard';

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
    @Post()
    @Header('Content-Type', 'text/html')
    async create(
        @Body() body: CreatePostDto,
        @Session() session: Record<string, any>
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
            return `<p class="alert"> No hay publicaciones en ${category}. ¡Sé el primero! </p>`
        }

        // Conver all posts to HTML strings
        return posts.map(post => this.renderPostCard(post, session.userId)).join('');
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

                    <input name="title" value="${post.title}" required>
                    <textarea name="content" required>${post.content}</textarea>
                    <input type="hidden" name="category" value="${post.category}" required>

                    <div class="post-actions">
                        <button type="submit"> Guardar </button>
                        <button type="button"
                            hx-get="/posts/fragments?category=${post.category}"
                            hx-target="#posts-container">
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

        return `
            <div class="post" id="post-${post.id}">
                <h2> ${post.title} </h2>
                <small> ${post.author.name} | ${new Date(post.createdAt).toLocaleDateString()} </small>
                <p> ${post.content} </p>

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

                            <input type="text" name="content" placeholder="Escribe un comentario..." required>
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
