import { Remaster } from "../entities/Remaster";
import { Resolver, Query, Arg, Mutation, Ctx, UseMiddleware } from "type-graphql";
import { MyContext } from "src/types";
import { isAuth } from "../middleware/isAuth";

@Resolver() 
export class RemasterResolver {
    @Query(() => [Remaster])
    remasters(): Promise<Remaster[]> {
        return Remaster.find()
    }

    @Query(() => Remaster, {nullable: true})
    remaster(
        @Arg('id') _id: number
    ): Promise<Remaster | null> {
        return Remaster.findOne({where: {_id: _id}})
    }

    @Mutation(() => Remaster)
    @UseMiddleware(isAuth)
    async createRemaster(
        @Arg('name') name: string,
        @Ctx() {req}: MyContext
    ): Promise<Remaster> {
        return Remaster.create({
            name,
            creatorId: req.session.userId
        }).save();
    }

    @Mutation(() => Remaster, {nullable: true})
    async updateRemaster(
        @Arg('id') _id: number,
        @Arg('name', () => String, {nullable: true}) name: string
    ): Promise<Remaster | null> {
        const remaster = await Remaster.findOne({where: {_id: _id}})
        if(!remaster) {
            return null;
        }
        if(typeof name !== undefined) {
            await Remaster.update({_id}, {name});
        }
        return remaster
    }

    @Mutation(() => Boolean)
    async deleteRemaster(
        @Arg('id') _id: number
    ): Promise<Boolean> {
        await Remaster.delete(_id);
        return true;
    }
}