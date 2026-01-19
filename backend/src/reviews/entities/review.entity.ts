import { Entity, Unique, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne } from "typeorm";
import { ListingsPost } from "../../listings/entities/listing.entity";
import { User } from '../../users/entities/user.entity';

@Entity()
@Unique(['author', 'listing'])
export class Review {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'text' })
    content: string;

    @Column({ type: 'int' })
    rating: number;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    // Relationship: Many Reviews -> One Listing
    @ManyToOne(() => ListingsPost, (listing) => listing.reviews, { onDelete: 'CASCADE' })
    listing: ListingsPost;

    @ManyToOne(() => User, user => user.comments, { eager: true })
    author: User;

}