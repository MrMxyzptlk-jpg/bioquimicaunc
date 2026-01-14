import { PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Entity, OneToMany } from "typeorm";
import {Comment} from '../comments/entities/comment.entity';

@Entity()
export class ForumPost {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    user: string

    @Column()
    title: string

    @Column({ type: 'text' })
    content: string

    @Column()
    category: string

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @OneToMany(() => Comment, (comment) => comment.post)
    comments: Comment[];
}