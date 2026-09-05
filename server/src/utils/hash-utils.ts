import bcrypt from "bcrypt";
import crypto from "crypto";

export const hashPassword = (password: string): Promise<string> =>
  bcrypt.hash(password, 10);

export const comparePassword = (
  plain: string,
  hash: string,
): Promise<boolean> => bcrypt.compare(plain, hash);

export const hashStringSha = (input: string): string => {
  return crypto.createHash("sha256").update(input).digest("hex");
};

export const compareStringSha = (plain: string, hash: string): boolean => {
  return hashStringSha(plain) === hash;
};
