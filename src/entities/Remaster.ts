import { Field, ObjectType } from "type-graphql";
import { BaseEntity, Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { User } from "./User";

@ObjectType()
class Barre {
  @Field()
  from!: number;
  @Field()
  to!: number;
  @Field()
  fret!: number;
}

@ObjectType()
class Chord {
  @Field(() => String || undefined)
  title: string | undefined;
  @Field(() => [[Number, Number || "x"]])
  fingers!: [[number, number | "x"]];
  @Field(() => [Barre])
  barres!: Barre[];
  @Field()
  position: number;
}

@ObjectType()
class Loop {
  @Field()
  id: number;
  @Field()
  name!: string;
  @Field()
  key!: string;
  @Field()
  type!: string;
  @Field()
  start!: number;
  @Field()
  end!: number;
  @Field()
  colour!: string;
  @Field(() => Chord)
  chord: Chord;
  @Field()
  tab: string;
}

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
  trackId!: string;

  @Field()
  @Column()
  key!: string;

  @Field(() => [String])
  @Column("text", {array: true})
  tuning!: string[];

  @Field(() => [Loop])
  @Column("jsonb", {array: true})
  loops!: Loop[];

  @Field(() => [Chord])
  @Column("jsonb", {array: true})
  createdChords!: Chord[];

  @Field()
  @Column()
  creatorId!: number

  @Field()
  @Column({type: "int", default: 0})
  likes!: number;

  @ManyToOne(() => User, (user) => user.remasters)
  creator!: User

  @Field(() => String)
  @CreateDateColumn()
  createdAt: Date;

  @Field(() => String)
  @UpdateDateColumn()
  updatedAt: Date;

}