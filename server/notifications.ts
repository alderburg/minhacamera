
import { db } from "./db";
import { sql } from "drizzle-orm";

export interface Notification {
  id: number;
  title: string;
  message: string;
  type: 'success' | 'warning' | 'error' | 'info';
  read: boolean;
  createdAt: Date;
}

// In-memory storage for notifications (you can move to database later)
const notifications: Notification[] = [];
let notificationIdCounter = 1;

export function createNotification(
  title: string,
  message: string,
  type: 'success' | 'warning' | 'error' | 'info' = 'info'
): Notification {
  const notification: Notification = {
    id: notificationIdCounter++,
    title,
    message,
    type,
    read: false,
    createdAt: new Date(),
  };

  notifications.unshift(notification);

  // Keep only last 100 notifications
  if (notifications.length > 100) {
    notifications.pop();
  }

  return notification;
}

export function getNotifications(limit = 50): Notification[] {
  return notifications.slice(0, limit);
}

export function markNotificationAsRead(id: number): boolean {
  const notification = notifications.find(n => n.id === id);
  if (notification) {
    notification.read = true;
    return true;
  }
  return false;
}

export function markAllNotificationsAsRead(): void {
  notifications.forEach(n => n.read = true);
}

export function getUnreadCount(): number {
  return notifications.filter(n => !n.read).length;
}
