import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

import { TypeOrmModule } from '@nestjs/typeorm';
import { ForumPost } from './posts/post.entity';
import { PostsModule } from './posts/posts.module';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'),
    }),
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
            username: configService.get<string>('DB_USER'),
            password: configService.get<string>('DB_PASSWORD'),
            database: configService.get<string>('DB_NAME'),
            entities: [ForumPost],
            synchronize: true,
        }),
    }),

    PostsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
