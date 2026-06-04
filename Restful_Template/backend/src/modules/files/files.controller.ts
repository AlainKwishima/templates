import type { Request, Response } from "express";
import { successResponse } from "@/shared/response/api-response.js";
import { getRequestId } from "@/middleware/request-context.js";
import { FilesService } from "@/modules/files/files.service.js";

const filesService = new FilesService();

function requireParamId(id: string | string[] | undefined) {
  const value = Array.isArray(id) ? id[0] : id;
  if (!value) {
    throw new Error("File id is required");
  }
  return value;
}

export async function uploadFile(req: Request, res: Response) {
  if (!req.file) {
    res.status(400).json({
      success: false,
      message: "No file provided",
      error: { code: "VALIDATION_ERROR" },
      metadata: { requestId: getRequestId(req) },
    });
    return;
  }

  const record = await filesService.recordUpload(req.user?.id, {
    originalName: req.file.originalname,
    filename: req.file.filename,
    mimeType: req.file.mimetype,
    size: req.file.size,
    path: req.file.path,
  });

  res.status(201).json(
    successResponse(
      "File uploaded successfully",
      { file: record },
      { requestId: getRequestId(req) },
    ),
  );
}

export async function listFiles(req: Request, res: Response) {
  const result = await filesService.listFiles(req.user!, {
    page: typeof req.query.page === "string" ? Number(req.query.page) : undefined,
    limit: typeof req.query.limit === "string" ? Number(req.query.limit) : undefined,
    search: typeof req.query.search === "string" ? req.query.search : undefined,
  });

  res.json(
    successResponse("Files loaded", result.files, {
      requestId: getRequestId(req),
      ...result.pagination,
    }),
  );
}

export async function getFile(req: Request, res: Response) {
  const id = requireParamId(req.params.id);
  const file = await filesService.getFile(req.user!, id);
  res.json(successResponse("File loaded", { file }, { requestId: getRequestId(req) }));
}

export async function updateFile(req: Request, res: Response) {
  const id = requireParamId(req.params.id);
  const file = await filesService.updateFile(req.user!, id, req.body);
  res.json(successResponse("File updated", { file }, { requestId: getRequestId(req) }));
}

export async function deleteFile(req: Request, res: Response) {
  const id = requireParamId(req.params.id);
  const file = await filesService.deleteFile(req.user!, id);
  res.json(successResponse("File deleted", { file }, { requestId: getRequestId(req) }));
}
