import { PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Entity, OneToMany, ManyToOne } from "typeorm";
import { Review } from '../../reviews/entities/review.entity';
import { User } from '../../users/entities/user.entity'

@Entity()
export class ListingsPost {
    @PrimaryGeneratedColumn()
    id: number

    @Column({ length: 120 })
    title: string

    @Column({ type: 'text' })
    content: string

    @Column({ length: 30 })
    category: string

    @Column({ type: 'float', default: 0 })
    ratingAvg: number;

    @Column({ default: 0 })
    ratingCount: number;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @OneToMany(() => Review, (review) => review.listing)
    reviews: Review[];

    @ManyToOne(() => User, user => user.posts, { eager: true })
    author: User
}