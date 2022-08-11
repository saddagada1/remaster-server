import "reflect-metadata";
import 'dotenv/config';
import express from "express";
import { ApolloServer } from "apollo-server-express";
import { buildSchema } from "type-graphql";
import { UserResolver } from "./resolvers/user";
import { RemasterResolver } from "./resolvers/remaster";
import Redis from "ioredis";
import session from "express-session";
import { COOKIE_NAME, __prod__ } from "./constants";
import cors from "cors";
import { AppDataSource } from "./data-source";
import { SpotifyResolver } from "./resolvers/spotify";
import { SpotifyInit } from "./spotify/init";
import { ChordsResolver } from "./resolvers/chords";

const main = async () => {
  AppDataSource.initialize()
    .then(async () => {
      console.log("connected with typeorm");
    })
    .catch((error) => console.log(error));

  const app = express();
  const RedisStore = require("connect-redis")(session);
  const redis = new Redis();
  redis.on("error", (err) => console.log("Redis Client Error", err));
  app.set("trust proxy", 1);

  app.use(
    cors({
      credentials: true,
      origin: [
        "http://localhost:3000",
        "http://localhost:4000/graphql",
        "https://studio.apollographql.com",
      ],
    })
  );

  app.use(
    session({
      name: COOKIE_NAME,
      store: new RedisStore({ client: redis, disableTouch: true }),
      cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 365 * 10, //10 years
        httpOnly: true,
        sameSite: "lax",
        secure: __prod__,
      },
      saveUninitialized: false,
      secret: process.env.SESSION_SECRET as string,
      resave: false,
    })
  );

  const apolloServer = new ApolloServer({
    schema: await buildSchema({
      resolvers: [UserResolver, RemasterResolver, SpotifyResolver, ChordsResolver],
      validate: false,
    }),
    context: ({ req, res }) => ({ req, res, redis}),
  });

  await apolloServer.start();
  await apolloServer.applyMiddleware({ app, cors: false });

  app.get("/", (req, res) => {
    res.send("Hello World!");
  });

  app.listen(4000, () => {
    console.log("server started on localhost:4000");
  });

  SpotifyInit();

};

main().catch((err) => {
  console.error(err);
});
