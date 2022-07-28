import { Field, ObjectType } from "type-graphql";
import { BaseEntity, Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Remaster } from "./Remaster";

@ObjectType()
@Entity()
export class User extends BaseEntity {
  @Field()
  @PrimaryGeneratedColumn()
  _id!: number;

  @Field()
  @Column({default: false})
  verified!: boolean;

  @Field()
  @Column({unique: true})
  email!: string;

  @Field()
  @Column({unique: true})
  username!: string;

  @Column()
  password!: string;

  @OneToMany(() => Remaster, (remaster) => remaster.creator)
  remasters: Remaster[];

  @Field(() => String)
  @CreateDateColumn()
  createdAt: Date;

  @Field(() => String)
  @UpdateDateColumn()
  updatedAt: Date;

}