import express, { type ErrorRequestHandler } from "express";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import { ZodError } from "zod";
import { config, origin } from "./config.js";
import { auth } from "./auth/router.js";
import { HttpError } from "./http.js";
import { learning } from "./learning/router.js";
import { files } from "./files/router.js";
import { MulterError } from "multer";
import { administration } from "./admin/router.js";
export const app = express();
app.disable("x-powered-by");
if (config.TRUST_PROXY === "1") app.set("trust proxy", 1);
app.use(helmet());
app.use("/learning", express.json({ limit: "2mb" }));
app.use("/admin", express.json({ limit: "128kb" }));
app.use(express.json({ limit: "16kb" }));
app.use(cookieParser());
app.use((_req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Referrer-Policy", "no-referrer");
  next();
});
app.use((req, _res, next) => {
  const source = req.get("origin");
  if (source && source !== origin)
    throw new HttpError(403, "This request is not allowed.");
  next();
});
app.get("/health", (_req, res) =>
  res.json({ status: "ok", service: "mowe-auth" }),
);
app.use("/auth", auth);
app.use("/learning", learning);
app.use("/files", files);
app.use("/admin", administration);
app.use((_req, res) => res.status(404).json({ error: "Endpoint not found." }));
const errors: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof MulterError) {
    res.status(400).json({
      error:
        error.code === "LIMIT_FILE_SIZE"
          ? "Choose a file smaller than 20 MB."
          : "Choose one file and try again.",
    });
    return;
  }
  if (error instanceof ZodError) {
    res.status(400).json({
      error: error.issues[0]?.message || "Check your form.",
      code: "VALIDATION_ERROR",
    });
    return;
  }
  if (error instanceof HttpError) {
    res.status(error.status).json({
      error: error.message,
      code: error.code,
      ...("challengeId" in error ? { challengeId: error.challengeId } : {}),
    });
    return;
  }
  const code = typeof error?.code === "string" ? error.code : "INTERNAL";
  if (code === "P2002") {
    res.status(409).json({
      error:
        "This request conflicts with an existing account. Please sign in or try again.",
    });
    return;
  }
  if (error?.type === "entity.too.large" || error instanceof SyntaxError) {
    res.status(400).json({ error: "Invalid request body." });
    return;
  }
  console.error("Auth request failed", {
    type: error?.constructor?.name || "Error",
    code,
  });
  res.status(500).json({
    error:
      "The authentication service is temporarily unavailable. Please try again.",
  });
};
app.use(errors);
