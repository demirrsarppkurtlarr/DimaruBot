import { prisma, Prisma } from '@dmb/prisma';

export type AuditAction =
  | 'grant'
  | 'deduct'
  | 'freeze'
  | 'unfreeze'
  | 'transfer'
  | 'daily_claim'
  | 'settings_update';

export interface AuditContext {
  guildId?: string;
  userId?: string;
  adminId?: string;
  ipAddress?: string;
  userAgent?: string;
}

export async function logAdminAction(
  action: AuditAction,
  data: {
    guildId?: string;
    adminId: string;
    targetUserId?: string;
    amount?: bigint;
    reason?: string;
    metadata?: Record<string, unknown>;
  },
  context?: AuditContext
) {
  await prisma.adminAction.create({
    data: {
      guildId: data.guildId ? BigInt(data.guildId) : null,
      adminId: BigInt(data.adminId),
      targetUserId: data.targetUserId ? BigInt(data.targetUserId) : null,
      actionType: action,
      amount: data.amount ?? null,
      reason: data.reason ?? '',
      metadata: (data.metadata ?? {}) as Prisma.InputJsonValue,
      ipAddress: context?.ipAddress ?? null,
      userAgent: context?.userAgent ?? null,
    },
  });
}

export async function logEconomyChange(
  action: AuditAction,
  changes: Record<string, unknown>,
  context?: AuditContext
) {
  await prisma.economyAuditLog.create({
    data: {
      guildId: context?.guildId ? BigInt(context.guildId) : null,
      userId: context?.userId ? BigInt(context.userId) : null,
      action,
      entity: 'DimaCoinAccount',
      adminId: context?.adminId ? BigInt(context.adminId) : null,
      changes: changes as Prisma.InputJsonValue,
      ipAddress: context?.ipAddress ?? null,
      userAgent: context?.userAgent ?? null,
    },
  });
}

export async function getAdminActions(guildId: string, limit = 20, offset = 0) {
  return prisma.adminAction.findMany({
    where: { guildId: BigInt(guildId) },
    orderBy: { createdAt: 'desc' },
    take: limit,
    skip: offset,
  });
}
