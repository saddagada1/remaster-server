import { Field, ObjectType } from "type-graphql";
import { BaseEntity, Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { User } from "./User";

@ObjectType()
@Entity()
export class Remaster extends BaseEntity {
  @Field()
  @PrimaryGeneratedColumn()
  _id!: number;

  @Field()
  @Column()
  name!: string;

  @Field()
  @Column()
  playbackURL!: string;

  @Field()
  @Column()
  trackId: string;

  @Field()
  @Column()
  creatorId!: number

  @Field()
  @Column({type: "int", default: 0})
  likes!: number;

  @ManyToOne(() => User, (user) => user.remasters)
  creator: User

  @Field(() => String)
  @CreateDateColumn()
  createdAt: Date;

  @Field(() => String)
  @UpdateDateColumn()
  updatedAt: Date;

}