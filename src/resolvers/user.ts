import { MyContext } from "../types";
import {
  Resolver,
  Query,
  Mutation,
  InputType,
  Field,
  Arg,
  Ctx,
  ObjectType,
  UseMiddleware,
} from "type-graphql";
import argon2 from "argon2";
import { User } from "../entities/User";
import {
  COOKIE_NAME,
  FORGOT_PASSWORD_PREFIX,
  VERIFY_EMAIL_PREFIX,
} from "../constants";
import { v4 } from "uuid";
import { sendEmail } from "../utils/sendEmail";
import { isAuth } from "../middleware/isAuth";
import { AppDataSource } from "../data-source";

@InputType()
class RegisterInput {
  @Field()
  email: string;
  @Field()
  username: string;
  @Field()
  password: string;
}

@InputType()
class LoginInput {
  @Field()
  email: string;
  @Field()
  password: string;
}

@InputType()
class ChangePasswordInput {
  @Field()
  oldPassword: string;
  @Field()
  newPassword: string;
}

@InputType()
class ChangeForgotPasswordInput {
  @Field()
  token: string;
  @Field()
  newPassword: string;
}

@ObjectType()
class FieldError {
  @Field()
  field: string;
  @Field()
  message: string;
}

@ObjectType()
class UserResponse {
  @Field(() => [FieldError], { nullable: true })
  errors?: FieldError[];

  @Field(() => User, { nullable: true })
  user?: User;
}

@Resolver()
export class UserResolver {
  @Mutation(() => UserResponse)
  @UseMiddleware(isAuth)
  async changeUsername(
    @Arg("newUsername") newUsername: string,
    @Ctx() { req }: MyContext
  ): Promise<UserResponse> {
    const duplicateUser = await User.findOne({
      where: { username: newUsername },
    });
    if (duplicateUser) {
      return {
        errors: [
          {
            field: "newUsername",
            message: "username taken",
          },
        ],
      };
    }

    const result = await AppDataSource.createQueryBuilder()
      .update(User)
      .set({ username: newUsername })
      .where({ _id: req.session.userId })
      .returning("*")
      .execute();

    return { user: result.raw[0] };
  }

  @Mutation(() => UserResponse)
  @UseMiddleware(isAuth)
  async changeEmail(
    @Arg("newEmail") newEmail: string,
    @Ctx() { req }: MyContext
  ): Promise<UserResponse> {
    const duplicateUser = await User.findOne({ where: { email: newEmail } });
    if (duplicateUser) {
      return {
        errors: [
          {
            field: "newEmail",
            message: "email in use",
          },
        ],
      };
    }

    const result = await AppDataSource.createQueryBuilder()
      .update(User)
      .set({ email: newEmail })
      .where({ _id: req.session.userId })
      .returning("*")
      .execute();

    return { user: result.raw[0] };
  }

  @Mutation(() => UserResponse)
  @UseMiddleware(isAuth)
  async changePassword(
    @Arg("changePasswordOptions") changePasswordOptions: ChangePasswordInput,
    @Ctx() { req }: MyContext
  ) {
    const user = await User.findOne({ where: { _id: req.session.userId } });
    if (!user) {
      return {
        errors: [
          {
            field: "newPassword",
            message: "user no longer exists",
          },
        ],
      };
    }

    const isValid = await argon2.verify(
      user.password,
      changePasswordOptions.oldPassword
    );
    if (!isValid) {
      return {
        errors: [
          {
            field: "oldPassword",
            message: "incorrect password",
          },
        ],
      };
    }

    await User.update(
      { _id: req.session.userId },
      { password: await argon2.hash(changePasswordOptions.newPassword) }
    );

    return { user };
  }

  @Mutation(() => UserResponse)
  async changeForgotPassword(
    @Arg("changeFpOptions") changeFpOptions: ChangeForgotPasswordInput,
    @Ctx() { redis, req }: MyContext
  ): Promise<UserResponse> {
    const key = FORGOT_PASSWORD_PREFIX + changeFpOptions.token;

    const userId = await redis.get(key);
    if (!userId) {
      return {
        errors: [
          {
            field: "newPassword",
            message: `token expired`,
          },
        ],
      };
    }

    const numUserId = parseInt(userId);

    const result = await AppDataSource.createQueryBuilder()
      .update(User)
      .set({ password: await argon2.hash(changeFpOptions.newPassword) })
      .where({ _id: numUserId })
      .returning("*")
      .execute();

    await redis.del(key);

    req.session.userId = numUserId;

    return { user: result.raw[0] };
  }

  @Mutation(() => Boolean)
  async forgotPassword(
    @Arg("email") email: string,
    @Ctx() { redis }: MyContext
  ) {
    const user = await User.findOne({ where: { email: email } });
    if (!user) {
      return true;
    }

    const token = v4();

    await redis.set(
      FORGOT_PASSWORD_PREFIX + token,
      user._id,
      "EX",
      1000 * 60 * 60 * 24
    ); //24 hours

    const emailBody = `<a href="http://localhost:3000/forgot-password/${token}">Reset Password</a>`;

    sendEmail(email, "REMASTER - FORGOT PASSWORD", emailBody);

    return true;
  }

  @Mutation(() => UserResponse)
  async verifyEmail(
    @Arg("token") token: string,
    @Ctx() { redis }: MyContext
  ): Promise<UserResponse> {
    const key = VERIFY_EMAIL_PREFIX + token;

    const email = await redis.get(key);
    if (!email) {
      return {
        errors: [
          {
            field: "token",
            message: `token expired`,
          },
        ],
      };
    }

    const result = await AppDataSource.createQueryBuilder()
      .update(User)
      .set({ verified: true })
      .where({ email: email })
      .returning("*")
      .execute();

    await redis.del(key);

    return { user: result.raw[0] };
  }

  @Mutation(() => Boolean)
  @UseMiddleware(isAuth)
  async sendVerifyEmail(
    @Ctx() { req, redis }: MyContext
  ) {
    const user = await User.findOne({ where: { _id: req.session.userId } });
    if (!user) {
      return false;
    }

    const token = v4();

    await redis.set(
      VERIFY_EMAIL_PREFIX + token,
      user.email,
      "EX",
      1000 * 60 * 60 * 24
    ); //24 hours

    const emailBody = `<a href="http://localhost:3000/email-confirmation/${token}">Click Here To Verify Your Account</a>`;

    sendEmail(user.email, "REMASTER - VERIFY EMAIL", emailBody);

    return true;
  }

  @Query(() => User, { nullable: true })
  me(@Ctx() { req }: MyContext) {
    if (!req.session.userId) {
      return null;
    }

    return User.findOne({ where: { _id: req.session.userId } });
  }

  @Mutation(() => UserResponse)
  async register(
    @Arg("registerOptions") registerOptions: RegisterInput,
    @Ctx() { redis, req }: MyContext
  ): Promise<UserResponse> {
    const hashedPassword = await argon2.hash(registerOptions.password);
    let user;
    try {
      user = await User.create({
        email: registerOptions.email,
        username: registerOptions.username,
        password: hashedPassword,
      }).save();
    } catch (err) {
      console.log(err);
      if (err.code === "23505") {
        if (err.detail.includes("username")) {
          return {
            errors: [
              {
                field: "username",
                message: `username taken`,
              },
            ],
          };
        }
        if (err.detail.includes("email")) {
          return {
            errors: [
              {
                field: "email",
                message: `email in use`,
              },
            ],
          };
        }
      }
    }

    const token = v4();

    await redis.set(
      VERIFY_EMAIL_PREFIX + token,
      registerOptions.email,
      "EX",
      1000 * 60 * 60 * 24 * 7
    ); //7 days

    const emailBody = `<a href="http://localhost:3000/email-confirmation/${token}">Click Here To Verify Your Account</a>`;

    sendEmail(registerOptions.email, "REMASTER - VERIFY EMAIL", emailBody);

    req.session.userId = user?._id;

    return {
      user,
    };
  }

  @Mutation(() => UserResponse)
  async login(
    @Arg("loginOptions") loginOptions: LoginInput,
    @Ctx() { req }: MyContext
  ): Promise<UserResponse> {
    const user = await User.findOne({ where: { email: loginOptions.email } });
    if (!user) {
      return {
        errors: [
          {
            field: "email",
            message: "invalid email or password",
          },
        ],
      };
    }
    const isValid = await argon2.verify(user.password, loginOptions.password);
    if (!isValid) {
      return {
        errors: [
          {
            field: "email",
            message: "invalid email or password",
          },
        ],
      };
    }

    req.session.userId = user._id;

    return {
      user,
    };
  }

  @Mutation(() => Boolean)
  async logout(@Ctx() { req, res }: MyContext) {
    return new Promise((resolve) =>
      req.session.destroy((err: any) => {
        res.clearCookie(COOKIE_NAME);
        if (err) {
          console.log(err);
          resolve(false);
          return;
        }

        resolve(true);
      })
    );
  }

  @Mutation(() => Boolean)
  async deleteUser(@Arg("id") _id: number): Promise<Boolean> {
    await User.delete(_id);
    return true;
  }

  @Query(() => [User])
  users(): Promise<User[]> {
    return User.find();
  }
}
