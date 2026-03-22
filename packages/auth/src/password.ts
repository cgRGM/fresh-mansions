import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const SCRYPT_OPTIONS = {
  N: 16_384,
  maxmem: 128 * 16_384 * 16 * 2,
  p: 1,
  r: 16,
} as const;

const KEY_LENGTH = 64;
const SALT_LENGTH = 16;
const DELIMITER = ":";
const derivePasswordKey = (password: string, salt: string): Buffer =>
  scryptSync(password.normalize("NFKC"), salt, KEY_LENGTH, SCRYPT_OPTIONS);

export const hashPassword = (password: string): Promise<string> => {
  const salt = randomBytes(SALT_LENGTH).toString("hex");
  const key = derivePasswordKey(password, salt);

  return Promise.resolve(`${salt}${DELIMITER}${key.toString("hex")}`);
};

export const verifyPassword = (input: {
  hash: string;
  password: string;
}): Promise<boolean> => {
  const [salt, key] = input.hash.split(DELIMITER);

  if (!salt || !key) {
    return Promise.resolve(false);
  }

  const targetKey = derivePasswordKey(input.password, salt);
  const storedKey = Buffer.from(key, "hex");

  if (storedKey.byteLength !== targetKey.byteLength) {
    return Promise.resolve(false);
  }

  return Promise.resolve(timingSafeEqual(targetKey, storedKey));
};
