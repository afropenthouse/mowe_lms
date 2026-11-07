import assert from "node:assert/strict";
import test from "node:test";
process.env.NODE_ENV = "test";
process.env.MAIL_DRIVER = "test";
const {
  hashPassword,
  verifyPassword,
  digest,
  protectedDigest,
  verificationCode,
} = await import("../src/auth/crypto.js");
test("salted passwords, constant-time comparisons and code generation", async () => {
  const password = "A unique test passphrase";
  const a = await hashPassword(password),
    b = await hashPassword(password);
  assert.notEqual(a, b);
  assert.equal(await verifyPassword(password, a), true);
  assert.equal(await verifyPassword("A different password", a), false);
  assert.notEqual(digest("secret"), protectedDigest("secret"));
  for (let i = 0; i < 20; i++) assert.match(verificationCode(), /^[1-9]\d{5}$/);
});
