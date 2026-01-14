import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, OneToMany } from "typeorm";
import { ForumPost } from "../../posts/post.entity";

@Entity()
export class Comment {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    content: string;

    @Column()
    user:string;

    @CreateDateColumn()
    createdAt: Date;

    // Relationship: Many Comments -> One Post
    @ManyToOne(() => ForumPost, (post) => post.comments, { onDelete: 'CASCADE' })
    post: ForumPost;

    // Self-Referencing Logic

    // Parenthood (nullable because top-level comments have no parent)
    @ManyToOne(() => Comment, (comment) => comment.children, { nullable: true, onDelete: 'CASCADE' })
    parent: Comment | null;

    // Descendants
    @OneToMany(() => Comment, (comment) => comment.parent)
    children: Comment[]
}