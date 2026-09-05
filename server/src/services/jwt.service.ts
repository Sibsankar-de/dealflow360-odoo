import jwt, { JwtPayload } from "jsonwebtoken";
import { env } from "../configs/env";
import { User } from "@prisma/client";

export class JwtService {
  private secret: string;
  private expiry: string;

  public constructor(
    secret: string = env.ACCESS_TOKEN_SECRET,
    expiry: string = env.ACCESS_TOKEN_EXPIRY,
  ) {
    this.secret = secret;
    this.expiry = expiry;
  }

  public signAccessToken(
    user: Pick<User, "id" | "email">,
    version = 1,
  ): string {
    return jwt.sign({ id: user.id, email: user.email, version }, this.secret, {
      expiresIn: this.expiry,
    } as jwt.SignOptions);
  }

  public verifyAccessToken(token: string): JwtPayload {
    return jwt.verify(token, this.secret) as JwtPayload;
  }
}

export const jwtService = new JwtService();
