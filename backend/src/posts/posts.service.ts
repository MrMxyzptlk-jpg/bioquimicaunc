import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CreatePostDto } from './dto/create-post.dto'
import { UpdatePostDto } from './dto/update-post.dto'
import { ForumPost } from './post.entity';

@Injectable()
export class PostsService {
    constructor(
        @InjectRepository(ForumPost)
        private readonly postRepository: Repository<ForumPost>,
    ){}

    // Create a Post
    async create(data: CreatePostDto): Promise<ForumPost> {
        const forumPost = this.postRepository.create({
            user:data.user,
            title: data.title,
            content: data.content
        });
        return this.postRepository.save(forumPost)
    }

    // Update Posts
    async update(id: number, data: UpdatePostDto): Promise<ForumPost> {
        const forumPost = await this.postRepository.findOne({
            where: { id },
        });

        if (!forumPost) throw new NotFoundException(`Note ${id} not found`);
        if (data.title !== undefined) forumPost.title = data.title;
        if (data.content !== undefined) forumPost.content = data.content;

        return this.postRepository.save(forumPost);
    }

    // Delete a Post
    async remove(id: number): Promise<void> {
        const result = await this.postRepository.delete(id);
        if (result.affected === 0 ) throw new NotFoundException(`Note ${id} not found`);
    }

    // Filter by category
    async findByCategory(category: string): Promise<ForumPost[]> {
        const qb = this.postRepository
            .createQueryBuilder('post')
            .leftJoinAndSelect('post.category', 'category')
            .where('category.name = :category', { category })
            .orderBy('post.createdAt', 'DESC');

        return qb.getMany();
    }

}