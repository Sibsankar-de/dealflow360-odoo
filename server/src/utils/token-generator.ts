import { randomBytes } from "crypto";

export const generateSecureToken = (bits = 128): string => {
  const bytes = bits / 8;
  return randomBytes(bytes).toString("hex");
};
