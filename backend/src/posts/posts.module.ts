import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { PostsController } from './posts.controller';
import { PostsService } from './posts.service';
import { ForumPost } from './post.entity';
import { User } from '../users/entities/user.entity';


@Module({
    imports: [TypeOrmModule.forFeature([ForumPost, User])],
    controllers: [PostsController],
    providers: [PostsService]
})
export class PostsModule {}
