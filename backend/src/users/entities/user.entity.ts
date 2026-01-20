import { ForumPost } from "src/posts/post.entity";
import { Comment } from '../../comments/entities/comment.entity';
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from "typeorm";


@Entity()
export class User {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ length: 254, unique: true })
    email: string;

    @Column({ length: 100 })
    password: string;

    @Column({ length: 50, unique: true })
    name: string;

    @Column({ default: false })
    isAdmin: boolean;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @OneToMany(() => ForumPost, post => post.author)
    posts: ForumPost[];

    @OneToMany(() => Comment, comment => comment.author)
    comments: Comment[];
}