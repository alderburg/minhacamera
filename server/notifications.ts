import { db } from "./db";
import { users, empresas, clientes, cameras, cameraAcessos, notifications } from "@shared/schema";
import { eq, and, or, desc } from "drizzle-orm";
import { hash, compare } from "bcryptjs";
import { checkCameraHealth } from "./camera-health";
import type { InsertNotification } from "@shared/schema";

export interface Notification {
  id: number;
  title: string;
  message: string;
  type: 'success' | 'warning' | 'error' | 'info';
  read: boolean;
  createdAt: Date;
  userId?: number | null;
  empresaId?: number | null;
}

export async function createNotification(
  title: string,
  message: string,
  type: 'success' | 'warning' | 'error' | 'info' = 'info',
  userId?: number,
  empresaId?: number
): Promise<Notification> {
  const [notification] = await db.insert(notifications).values({
    title,
    message,
    type,
    userId: userId || null,
    empresaId: empresaId || null,
  }).returning();

  return notification;
}

export async function getNotifications(
  limit = 50,
  userId?: number,
  empresaId?: number
): Promise<Notification[]> {
  let query = db.select().from(notifications).orderBy(desc(notifications.createdAt)).limit(limit);

  if (userId) {
    const results = await db.select()
      .from(notifications)
      .where(
        and(
          eq(notifications.userId, userId)
        )
      )
      .orderBy(desc(notifications.createdAt))
      .limit(limit);
    return results;
  }

  if (empresaId) {
    const results = await db.select()
      .from(notifications)
      .where(
        and(
          eq(notifications.empresaId, empresaId)
        )
      )
      .orderBy(desc(notifications.createdAt))
      .limit(limit);
    return results;
  }

  return await query;
}

export async function markNotificationAsRead(id: number): Promise<boolean> {
  const result = await db
    .update(notifications)
    .set({ read: true })
    .where(eq(notifications.id, id))
    .returning();

  return result.length > 0;
}

export async function markAllNotificationsAsRead(userId?: number, empresaId?: number): Promise<void> {
  if (userId) {
    await db
      .update(notifications)
      .set({ read: true })
      .where(eq(notifications.userId, userId));
    return;
  }

  if (empresaId) {
    await db
      .update(notifications)
      .set({ read: true })
      .where(eq(notifications.empresaId, empresaId));
    return;
  }

  await db.update(notifications).set({ read: true });
}

export async function getUnreadCount(userId?: number, empresaId?: number): Promise<number> {
  if (userId) {
    const results = await db.select()
      .from(notifications)
      .where(
        and(
          eq(notifications.userId, userId),
          eq(notifications.read, false)
        )
      );
    return results.length;
  }

  if (empresaId) {
    const results = await db.select()
      .from(notifications)
      .where(
        and(
          eq(notifications.empresaId, empresaId),
          eq(notifications.read, false)
        )
      );
    return results.length;
  }

  const results = await db.select()
    .from(notifications)
    .where(eq(notifications.read, false));
  return results.length;
}