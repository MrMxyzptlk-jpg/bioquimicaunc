import { Controller, Get, Post, Body, Param, Put, Delete, ParseIntPipe, Query, HttpCode } from '@nestjs/common';

import { PostsService } from './posts.service';
import { ForumPost } from './post.entity';

import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';

@Controller('posts')
export class PostsController {
    constructor(private readonly postsService: PostsService) {}

    @Post()
    create(@Body() body: CreatePostDto) {
        return this.postsService.create(body);
    }

    @Get()
    findByCategory(@Query('category') category: string): Promise<ForumPost[]> {
        return this.postsService.findByCategory(category);
    }

    @Put(':id')
    update( @Param('id', ParseIntPipe) id: number, @Body() body: UpdatePostDto) {
        return this.postsService.update(id, body);
    }

    @Delete(':id')
    @HttpCode(204)
    delete(@Param('id', ParseIntPipe) id: number ) {
        return this.postsService.remove(id);
    }

}
