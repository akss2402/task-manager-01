import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { getConfig } from "./config.js";
import { authRoutes } from "./auth/authRoutes.js";
import { projectRoutes } from "./projects/projectRoutes.js";
import { dashboardRoutes } from "./dashboard/dashboardRoutes.js";
import { userRoutes } from "./users/userRoutes.js";
import { errorHandler, notFoundHandler } from "./http/errors.js";

export function createApp() {
  const app = express();
  const { CORS_ORIGIN } = getConfig();

  // app.use(
  //   cors({
  //     origin: CORS_ORIGIN ? CORS_ORIGIN.split(",").map((s) => s.trim()) : true,
  //     credentials: true
  //   })
  // );

  app.use(
    cors({
      origin: CORS_ORIGIN
        ? CORS_ORIGIN.split(",").map((s) => s.trim())
        : ["https://task-manager-01-ac42.vercel.app"],
      credentials: true
    })
  );
  app.use(express.json({ limit: "1mb" }));
  app.use(cookieParser());

  app.get("/health", (_req, res) => res.json({ ok: true }));
  app.use("/auth", authRoutes);
  app.use("/projects", projectRoutes);
  app.use("/dashboard", dashboardRoutes);
  app.use("/users", userRoutes);

  app.use(notFoundHandler);

  app.use(errorHandler);
  return app;
}

