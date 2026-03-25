import { prisma } from "@/lib/prisma";
import type { ActivityAction } from "@prisma/client";
import { Prisma } from "@prisma/client";

export async function logActivity(
  userId: string,
  action: ActivityAction,
  entityType: string,
  entityId?: string,
  entityName?: string,
  meta?: Record<string, unknown>
): Promise<void> {
  try {
    await prisma.activityLog.create({
      data: { userId, action, entityType, entityId, entityName, meta: meta as Prisma.InputJsonValue | undefined },
    });
  } catch {
    // Activity logging must never crash the main request
    console.error("[ActivityLog] Failed to log activity", { userId, action, entityType, entityId });
  }
}
