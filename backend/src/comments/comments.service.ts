import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { Comment } from './entities/comment.entity';

import { ForumPost } from '../posts/post.entity';
import { User } from 'src/users/entities/user.entity';

@Injectable()
export class CommentsService {

    constructor(
        @InjectRepository(Comment)
        private commentsRepo: Repository<Comment>,

        @InjectRepository(ForumPost)
        private postsRepo: Repository<ForumPost>,
    ) {}

    async create(createCommentDto: CreateCommentDto, user: User) {
        const post = await this.postsRepo.findOneBy({ id: createCommentDto.postId });
        if (!post) throw new NotFoundException('Post no encontrado');

        let parentComment: Comment | null = null;

        if (createCommentDto.parentId) {
            parentComment = await this.commentsRepo.findOneBy({ id: createCommentDto.parentId });
        }

        const comment = this.commentsRepo.create({
            content: createCommentDto.content,
            author: user,
            post: post,
            parent: parentComment,
        });

        return this.commentsRepo.save(comment);
    }

    async findByPost(postId:number) {
        return this.commentsRepo.find({
            where: { post: { id: postId } },
            relations: ['post', 'author', 'parent'],
            order: { createdAt: 'DESC' }
        });
    }

    findAll() {
        return `This action returns all comments`;
    }

    async findOne(id: number) {
        return this.commentsRepo.findOne({
            where: { id },
            relations:  ['author', 'post']
        });
    }

    async update(id: number, newComment: UpdateCommentDto): Promise<Comment> {
        const comment = await this.commentsRepo.findOne({ where: { id }, relations: ['author', 'post'] });

        if (!comment) throw new NotFoundException(`Comment with id ${id} not found after update`);
        if (newComment.content !== undefined) comment.content = newComment.content;

        return this.commentsRepo.save(comment);
    }

    async remove(id: number): Promise<Comment> {
        await this.commentsRepo.update(id, { content: '[Comentario borrado]'}); //author: null in case we want to remove the author as well
        const comment = await this.findOne(id);

        if (!comment) throw new NotFoundException(`Comment with id ${id} not found after delete`);

        return comment;
    }
}
