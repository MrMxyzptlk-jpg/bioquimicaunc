import { PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Entity, OneToMany, ManyToOne } from "typeorm";
import {Comment} from '../comments/entities/comment.entity';
import { User } from '../users/entities/user.entity'

@Entity()
export class ForumPost {
    @PrimaryGeneratedColumn()
    id: number

    @Column({ length: 120 })
    title: string

    @Column({ type: 'text' })
    content: string

    @Column({ length: 30 })
    category: string

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @OneToMany(() => Comment, (comment) => comment.post)
    comments: Comment[];

    @ManyToOne(() => User, user => user.posts, { eager: true })
    author: User
}