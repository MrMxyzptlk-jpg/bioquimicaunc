import { ForumPost } from "src/posts/post.entity";
import { Comment } from '../../comments/entities/comment.entity';
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from "typeorm";


@Entity()
export class User {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique: true })
    email: string;

    @Column()
    password: string;

    @Column({ default: 'User' })
    name: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @OneToMany(() => ForumPost, post => post.author)
    posts: ForumPost[];

    @OneToMany(() => Comment, comment => comment.author)
    comments: Comment[];
}