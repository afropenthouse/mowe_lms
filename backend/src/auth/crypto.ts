import {
  createHash,
  createHmac,
  randomBytes,
  randomInt,
  scrypt as rawScrypt,
  timingSafeEqual,
} from "node:crypto";
import { config } from "../config.js";
let active = 0;
async function scrypt(
  password: string,
  salt: string,
  _length: number,
  _options: unknown,
): Promise<Buffer> {
  if (active >= 4) throw new Error("Password service is busy");
  active++;
  try {
    return await new Promise<Buffer>((resolve, reject) =>
      rawScrypt(
        password,
        salt,
        64,
        { N: 65536, r: 8, p: 2, maxmem: 128 * 1024 * 1024 },
        (error, key) => (error ? reject(error) : resolve(key)),
      ),
    );
  } finally {
    active--;
  }
}
export const token = () => randomBytes(32).toString("hex");
export const digest = (value: string) =>
  createHash("sha256").update(value).digest("hex");
export const protectedDigest = (value: string) =>
  createHmac("sha256", config.AUTH_SECRET).update(value).digest("hex");
export const verificationCode = () => String(randomInt(100000, 1000000));
export function equal(a: string, b: string) {
  const x = Buffer.from(a),
    y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}
export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const key = (await scrypt(password, salt, 64, {
    N: 65536,
    r: 8,
    p: 2,
    maxmem: 128 * 1024 * 1024,
  })) as Buffer;
  return `scrypt$65536$8$2$${salt}$${key.toString("hex")}`;
}
export async function verifyPassword(password: string, stored: string) {
  const [kind, n, r, p, salt, expected] = stored.split("$");
  if (
    kind !== "scrypt" ||
    n !== "65536" ||
    r !== "8" ||
    p !== "2" ||
    !salt ||
    !expected
  )
    return false;
  const key = (await scrypt(password, salt, 64, {
    N: 65536,
    r: 8,
    p: 2,
    maxmem: 128 * 1024 * 1024,
  })) as Buffer;
  return equal(key.toString("hex"), expected);
}
