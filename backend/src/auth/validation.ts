import { z } from "zod";

export const newPasswordSchema = z
  .string()
  .min(8, "Passwords must have at least 8 characters.")
  .max(12, "Passwords can be no more than 12 characters.");
