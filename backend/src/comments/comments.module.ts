import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommentsService } from './comments.service';
import { CommentsController } from './comments.controller';
import { Comment } from './entities/comment.entity';
import { ForumPost } from '../posts/post.entity';
import { User } from 'src/users/entities/user.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([Comment, ForumPost, User])
    ],
    controllers: [CommentsController],
    providers: [CommentsService],
})
export class CommentsModule {}
