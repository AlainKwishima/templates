import { Router } from "express";
import multer from "multer";
import { env } from "@/config/env.js";
import { authenticateRequest, requireUser } from "@/middleware/auth.js";
import { validateBody, validateParams, validateQuery } from "@/middleware/validate.js";
import { asyncHandler } from "@/utils/async-handler.js";
import { ensureUploadDir } from "@/utils/files.js";
import { deleteFile, getFile, listFiles, updateFile, uploadFile } from "@/modules/files/files.controller.js";
import { fileIdSchema, listFilesSchema, updateFileSchema } from "@/modules/files/files.validation.js";

const storage = multer.diskStorage({
  destination: async (_req, _file, cb) => {
    try {
      const directory = await ensureUploadDir();
      cb(null, directory);
    } catch (error) {
      cb(error as Error, env.UPLOAD_DIR);
    }
  },
  filename: (_req, file, cb) => {
    const safeName = `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9_.-]/g, "_")}`;
    cb(null, safeName);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: env.MAX_UPLOAD_MB * 1024 * 1024,
  },
  fileFilter: (_req, file, cb) => {
    const allowed = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "application/pdf",
      "text/plain",
    ];

    if (!allowed.includes(file.mimetype)) {
      cb(new Error("Unsupported file type"));
      return;
    }

    cb(null, true);
  },
});

export const uploadRoutes = Router();

uploadRoutes.get(
  "/",
  authenticateRequest,
  requireUser,
  validateQuery(listFilesSchema.shape.query),
  asyncHandler(listFiles),
);

uploadRoutes.get(
  "/:id",
  authenticateRequest,
  requireUser,
  validateParams(fileIdSchema.shape.params),
  asyncHandler(getFile),
);

uploadRoutes.patch(
  "/:id",
  authenticateRequest,
  requireUser,
  validateParams(updateFileSchema.shape.params),
  validateBody(updateFileSchema.shape.body),
  asyncHandler(updateFile),
);

uploadRoutes.delete(
  "/:id",
  authenticateRequest,
  requireUser,
  validateParams(fileIdSchema.shape.params),
  asyncHandler(deleteFile),
);

uploadRoutes.post(
  "/upload",
  authenticateRequest,
  requireUser,
  upload.single("file"),
  asyncHandler(uploadFile),
);
