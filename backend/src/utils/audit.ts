/**
 * Audit Logging Utility
 * 
 * Provides centralized audit logging for sensitive admin actions.
 * All sensitive operations (user management, budget changes, API key updates)
 * should be logged through this service.
 */

import { prisma } from '../lib/prisma';

// Define sensitive action types for type safety
export type AdminAction =
  // User Management
  | 'admin_create_student'
  | 'admin_update_student'
  | 'admin_delete_student'
  | 'admin_reset_password'
  | 'admin_bulk_operation'
  | 'admin_import_students'
  // Invite Management
  | 'admin_generate_invite'
  | 'admin_bulk_generate_invites'
  // Budget/Token Management
  | 'admin_update_budget'
  | 'admin_update_token_quota'
  | 'admin_reset_budget'
  // API Key Management
  | 'admin_update_api_key'
  | 'admin_delete_api_key'
  | 'admin_test_api_key'
  // System Settings
  | 'admin_update_settings'
  | 'admin_update_hard_limit'
  // Course/Batch Management
  | 'admin_create_course'
  | 'admin_update_course'
  | 'admin_delete_course'
  | 'admin_create_batch'
  | 'admin_delete_batch';

export interface AuditLogDetails {
  // Who was affected (for user management actions)
  targetUserId?: string;
  targetUserEmail?: string;
  targetUserRegistrationId?: string | null;
  
  // What changed
  changes?: Record<string, { from: unknown; to: unknown }>;
  
  // Additional context
  reason?: string;
  ipAddress?: string;
  userAgent?: string;
  
  // Bulk operation details
  affectedCount?: number;
  successCount?: number;
  failedCount?: number;
  
  // Any other relevant data
  [key: string]: unknown;
}

/**
 * Log a sensitive admin action
 * 
 * @param adminUserId - The admin performing the action
 * @param action - The type of action being performed
 * @param details - Additional details about the action
 */
export async function logAdminAction(
  adminUserId: string,
  action: AdminAction,
  details: AuditLogDetails
): Promise<void> {
  try {
    await prisma.activityLog.create({
      data: {
        userId: adminUserId,
        action,
        details: JSON.stringify({
          ...details,
          timestamp: new Date().toISOString(),
          // Mark as admin action for easy filtering
          isAdminAction: true,
        }),
      },
    });
    
    // Log to console for debugging/monitoring (in production, this could go to a logging service)
    console.log(`[AUDIT] Admin ${adminUserId} performed ${action}:`, {
      targetUser: details.targetUserEmail || details.targetUserId,
      changes: details.changes ? Object.keys(details.changes) : 'N/A',
    });
  } catch (error) {
    // Log error but don't fail the main operation
    console.error('[AUDIT] Failed to log admin action:', error);
  }
}

/**
 * Log a security-sensitive event (failed login attempts, unauthorized access, etc.)
 */
export async function logSecurityEvent(
  userId: string | null,
  event: string,
  details: Record<string, unknown>
): Promise<void> {
  try {
    if (userId) {
      await prisma.activityLog.create({
        data: {
          userId,
          action: `security_${event}`,
          details: JSON.stringify({
            ...details,
            timestamp: new Date().toISOString(),
            isSecurityEvent: true,
          }),
        },
      });
    }
    
    // Always log security events to console
    console.warn(`[SECURITY] ${event}:`, details);
  } catch (error) {
    console.error('[SECURITY] Failed to log security event:', error);
  }
}

/**
 * Get audit logs for a specific admin user
 */
export async function getAdminAuditLogs(
  adminUserId: string,
  options: {
    limit?: number;
    offset?: number;
    startDate?: Date;
    endDate?: Date;
  } = {}
) {
  const { limit = 50, offset = 0, startDate, endDate } = options;
  
  return prisma.activityLog.findMany({
    where: {
      userId: adminUserId,
      action: {
        startsWith: 'admin_',
      },
      ...(startDate || endDate ? {
        createdAt: {
          ...(startDate ? { gte: startDate } : {}),
          ...(endDate ? { lte: endDate } : {}),
        },
      } : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
    skip: offset,
  });
}

/**
 * Get all admin actions affecting a specific user
 */
export async function getAuditLogsForUser(targetUserId: string) {
  return prisma.activityLog.findMany({
    where: {
      action: {
        startsWith: 'admin_',
      },
      details: {
        contains: targetUserId,
      },
    },
    orderBy: { createdAt: 'desc' },
    include: {
      user: {
        select: { name: true, email: true },
      },
    },
  });
}
