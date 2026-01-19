import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ListingsController } from './listings.controller';
import { ListingsService } from './listings.service';
import { ListingsPost } from './entities/listing.entity';
import { User } from '../users/entities/user.entity';


@Module({
    imports: [TypeOrmModule.forFeature([ListingsPost, User])],
    controllers: [ListingsController],
    providers: [ListingsService]
})
export class ListingsModule {}
