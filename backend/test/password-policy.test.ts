import assert from "node:assert/strict";
import test from "node:test";
import { newPasswordSchema } from "../src/auth/validation.js";

test("new-password policy accepts the complete 8–12 range and rejects values outside it", () => {
  for (let length = 8; length <= 12; length++) {
    assert.equal(newPasswordSchema.safeParse("a".repeat(length)).success, true);
  }
  for (const value of ["", "a".repeat(7), "a".repeat(13)]) {
    assert.equal(newPasswordSchema.safeParse(value).success, false);
  }
});
