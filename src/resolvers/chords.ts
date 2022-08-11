import {
  Resolver,
  Field,
  ObjectType,
  Query,
} from "type-graphql";
import fs from 'fs';
import path from "path";

@ObjectType()
class ChordsResponse {
  @Field()
  data: string;
}

@Resolver()
export class ChordsResolver {
  @Query(() => ChordsResponse)
  async chords(): Promise<ChordsResponse> {
    const data = fs.readFileSync(path.resolve(__dirname, "../data/chords.json"), "utf-8",)
    return {
      data
    };
  }
}
