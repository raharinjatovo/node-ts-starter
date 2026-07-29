import type { RequestHandler } from "express";
import jwt from "jsonwebtoken";
import { HttpError } from "./server.js";

export function requireAuth(jwtSecret: string): RequestHandler {
  return (req, _res, next) => {
    const header = req.header("Authorization");
    if (!header || !header.startsWith("Bearer ")) {
      next(new HttpError(401, "Unauthorized"));
      return;
    }

    const token = header.slice("Bearer ".length);

    try {
      jwt.verify(token, jwtSecret, { algorithms: ["HS256"] });
      next();
    } catch {
      next(new HttpError(401, "Unauthorized"));
    }
  };
}
