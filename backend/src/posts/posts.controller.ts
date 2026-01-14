import { Controller, Get, Post, Body, Param, Put, Delete, ParseIntPipe, Query, HttpCode, Header } from '@nestjs/common';

import { PostsService } from './posts.service';
import { ForumPost } from './post.entity';

import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';

@Controller('posts')
export class PostsController {
    constructor(private readonly postsService: PostsService) {}

    // 1. Create Post (HTMX Style)
    // Returns a single HTML card to append to the list
    @Post()
    @Header('Content-Type', 'text/html')
    async create(@Body() body: CreatePostDto) {
        const post = await this.postsService.create(body);
        return this.renderPostCard(post);
    }

    // 2. Get JSON (Optional, keept for debugging)
    @Get('json')
    findByCategory(@Query('category') category: string): Promise<ForumPost[]> {
        return this.postsService.findByCategory(category);
    }

    @Get('fragments')
    @Header('Content-Type', 'text/html')
    async findByCategoryFragment(@Query('category') category: string): Promise<string> {
        const posts = await this.postsService.findByCategory(category);

        if (posts.length === 0) {
            return `<p class="alert"> No hay publicaciones en ${category}. ¡Sé el primero! </p>`
        }

        // Conver all posts to HTML strings
        return posts.map(post => this.renderPostCard(post)).join('');
    }

    @Put(':id')
    update( @Param('id', ParseIntPipe) id: number, @Body() body: UpdatePostDto) {
        return this.postsService.update(id, body);
    }

    @Delete(':id')
    @HttpCode(200)
    delete(@Param('id', ParseIntPipe) id: number ) {
        this.postsService.remove(id);
        return ""; // empty string for HTMX to swap in the HTML
    }

    // Helper Method
    private renderPostCard(post: any) {
        return `
            <div class="post" id="post-${post.id}">
                <h2> ${post.title} </h2>
                <small> Por: ${post.user} | Fech: ${new Date(post.createdAt).toLocaleDateString()} </small>
                <p> ${post.content} </p>

                <div class="post-actions">
                    <button
                        hx-delete="/posts/${post.id}"
                        hx-target="#post-${post.id}"
                        hx-swap="outerHTML"
                        hx-confirm="¿Borrar post?"
                        class="delete-btn">
                        Eliminar
                    </button>
                </div>
            </div>
            <hr id="hr-${post.id}">
        `
    }

}
