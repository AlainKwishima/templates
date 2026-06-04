import { prisma } from "@/database/prisma.js";
import { NotFoundAppError } from "@/shared/errors/app-error.js";
import type { FileUploadRecord } from "@/modules/files/files.types.js";
import type { Prisma } from "@prisma/client";
import { buildPageMetadata, normalizePagination } from "@/utils/pagination.js";
import fs from "node:fs/promises";
import type { AuthenticatedUser } from "@/middleware/auth.js";

type PublicFileRecord = {
  id: string;
  userId: string | null;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  path: string;
  storage: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
};

export class FilesService {
  async recordUpload(userId: string | undefined, file: FileUploadRecord) {
    const record = await prisma.uploadedFile.create({
      data: {
        ...(userId ? { userId } : {}),
        filename: file.filename,
        originalName: file.originalName,
        mimeType: file.mimeType,
        size: file.size,
        path: file.path,
        storage: "local",
      },
    });

    return this.toPublicFile(record);
  }

  async listFiles(user: AuthenticatedUser, input: { page?: number; limit?: number; search?: string }) {
    const pagination = normalizePagination(input);
    const where: Prisma.UploadedFileWhereInput = {
      deletedAt: null,
      ...(user.roles.includes("admin") ? {} : { userId: user.id }),
      ...(pagination.search
        ? {
            OR: [
              { originalName: { contains: pagination.search, mode: "insensitive" } },
              { filename: { contains: pagination.search, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    const [total, files] = await prisma.$transaction([
      prisma.uploadedFile.count({ where }),
      prisma.uploadedFile.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: pagination.skip,
        take: pagination.limit,
      }),
    ]);

    return {
      files: files.map((file) => this.toPublicFile(file)),
      pagination: buildPageMetadata(pagination.page, pagination.limit, total),
    };
  }

  async getFile(user: AuthenticatedUser, id: string) {
    const file = await prisma.uploadedFile.findFirst({
      where: {
        id,
        deletedAt: null,
        ...(user.roles.includes("admin") ? {} : { userId: user.id }),
      },
    });

    if (!file) {
      throw new NotFoundAppError("File not found");
    }

    return this.toPublicFile(file);
  }

  async updateFile(user: AuthenticatedUser, id: string, input: { originalName: string }) {
    const file = await prisma.uploadedFile.findFirst({
      where: {
        id,
        deletedAt: null,
        ...(user.roles.includes("admin") ? {} : { userId: user.id }),
      },
    });

    if (!file) {
      throw new NotFoundAppError("File not found");
    }

    const updated = await prisma.uploadedFile.update({
      where: { id },
      data: {
        originalName: input.originalName,
      },
    });

    return this.toPublicFile(updated);
  }

  async deleteFile(user: AuthenticatedUser, id: string) {
    const file = await prisma.uploadedFile.findFirst({
      where: {
        id,
        deletedAt: null,
        ...(user.roles.includes("admin") ? {} : { userId: user.id }),
      },
    });

    if (!file) {
      throw new NotFoundAppError("File not found");
    }

    const deleted = await prisma.uploadedFile.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    try {
      await fs.unlink(file.path);
    } catch {
      // Ignore filesystem cleanup errors; the database state is the source of truth.
    }

    return this.toPublicFile(deleted);
  }

  private toPublicFile(file: {
    id: string;
    userId: string | null;
    filename: string;
    originalName: string;
    mimeType: string;
    size: number;
    path: string;
    storage: string;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
  }): PublicFileRecord {
    return {
      id: file.id,
      userId: file.userId,
      filename: file.filename,
      originalName: file.originalName,
      mimeType: file.mimeType,
      size: file.size,
      path: file.path,
      storage: file.storage,
      createdAt: file.createdAt,
      updatedAt: file.updatedAt,
      deletedAt: file.deletedAt ?? null,
    };
  }
}
