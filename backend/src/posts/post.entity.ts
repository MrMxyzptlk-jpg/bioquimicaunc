import { PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Entity } from "typeorm";

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

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}