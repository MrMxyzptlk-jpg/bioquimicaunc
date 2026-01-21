import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Comment } from './comments/entities/comment.entity';
import { ForumPost } from './posts/post.entity';
import { PostsModule } from './posts/posts.module';
import { CommentsModule } from './comments/comments.module';
import { ListingsModule } from './listings/listings.module';
import { ReviewsModule } from './reviews/reviews.module';
import { ListingsPost } from './listings/entities/listing.entity';
import { Review } from './reviews/entities/review.entity';
import { User } from './users/entities/user.entity';
import { UsersModule } from './users/users.module';

import { AuthModule } from './auth/auth.module';
import { APP_GUARD } from '@nestjs/core';
import { CsrfController } from './csrf/csrf.controller';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'),
    }),

    ThrottlerModule.forRoot([{
        ttl: 60000,
        limit: 100,
        getTracker: (req) => req.session?.userId ?? req.ip,
    }]),

    // Load the Environment Variables
    ConfigModule.forRoot({
        isGlobal: true,
        envFilePath: '../.env.development', // Asuming we run 'npm run start' from /backend
    }),

    // Configure TypeORM Asynchronously
    TypeOrmModule.forRootAsync({
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: async(configService: ConfigService) => ({
            type: 'postgres',
            host: configService.get<string>('DB_HOST'),
            port: configService.get<number>('DB_PORT'),
            username: configService.get<string>('DB_USERNAME'),
            password: configService.get<string>('DB_PASSWORD'),
            database: configService.get<string>('DB_DATABASE'),
            entities: [ForumPost, Comment, User, ListingsPost, Review],
            synchronize: false,
        }),
    }),

    UsersModule,

    PostsModule,

    CommentsModule,

    ListingsModule,

    ReviewsModule,

    AuthModule,
  ],
  controllers: [CsrfController],
  providers: [{
    provide: APP_GUARD,
    useClass: ThrottlerGuard
  }],
})
export class AppModule {}
