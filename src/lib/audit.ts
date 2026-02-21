import { prisma } from "./prisma";

export type AuditAction =
  | "LOGIN_FAILED"
  | "ACCOUNT_CREATED"
  | "PASSWORD_CHANGED"
  | "ACCOUNT_DELETED";

export async function audit(
  action: AuditAction,
  ipAddress: string,
  userId?: string | null
) {
  try {
    await prisma.auditLog.create({
      data: { action, ipAddress, userId: userId ?? null },
    });
  } catch (error) {
    console.error("[audit] Failed to write log:", error);
  }
}
