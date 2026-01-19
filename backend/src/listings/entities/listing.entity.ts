import { PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Entity, OneToMany, ManyToOne } from "typeorm";
import { Review } from '../../reviews/entities/review.entity';
import { User } from '../../users/entities/user.entity'

export enum ListingModality {
    virtual = 'Virtual',
    inPerson = 'Presencial',
    hybrid = 'Híbrido'
}

export enum ListingSubject {
    maths1 = 'Matemática I',
    maths2 = 'Matemática II',
    physics1 = 'Física I',
    physics2 = 'Física II',
    chem1 = 'Química I',
    chem2 = 'Química II',
    organic1 = 'Química Orgánica I',
    organic2 = 'Química Orgánica II',
    lab1 = 'Laboratorio I',
    lab2 = 'Laboratorio II',
    lab3 = 'Laboratorio III',
    lab4 = 'Laboratorio IV',
}

@Entity()
export class ListingsPost {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ length: 120 })
    title: string;

    @Column({ type: 'text' })
    content: string;

    @Column({ length: 30 })
    category: string;

    @Column({ nullable: true })
    price: string;

    @Column({
        type: 'enum',
        enum: ListingModality,
        array: true,
    })
    modality: ListingModality[];

    @Column({
        type: 'enum',
        enum: ListingSubject,
        array: true,
        nullable: true,
    })
    subjects: ListingSubject[];

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
    author: User;
}