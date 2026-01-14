import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { Comment } from './entities/comment.entity';
import { ForumPost } from '../posts/post.entity';

@Injectable()
export class CommentsService {

    constructor(
        @InjectRepository(Comment)
        private commentsRepo: Repository<Comment>,

        @InjectRepository(ForumPost)
        private postsRepo: Repository<ForumPost>,
    ) {}

  async create(createCommentDto: CreateCommentDto) {
    const post = await this.postsRepo.findOneBy({ id: createCommentDto.postId });
    if (!post) throw new NotFoundException('Post no encontrado');

    let parentComment: Comment | null = null;

    if (createCommentDto.parentId) {
        parentComment = await this.commentsRepo.findOneBy({ id: createCommentDto.parentId });
    }

    const comment = this.commentsRepo.create({
        content: createCommentDto.content,
        user: createCommentDto.user,
        post: post,
        parent: parentComment,
    });

    return this.commentsRepo.save(comment);
  }

  async findByPost(postId:number) {
    return this.commentsRepo.find({
        where: { post: { id: postId } },
        relations: ['parent', 'children'],
        order: { createdAt: 'ASC' }
    });
  }

  findAll() {
    return `This action returns all comments`;
  }

  findOne(id: number) {
    return `This action returns a #${id} comment`;
  }

  update(id: number, updateCommentDto: UpdateCommentDto) {
    return `This action updates a #${id} comment`;
  }

  remove(id: number) {
    return `This action removes a #${id} comment`;
  }
}
