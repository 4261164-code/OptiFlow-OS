import { collection, doc, setDoc, updateDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import { db } from './firebase';
import { handleFirestoreError, OperationType } from './errorHandler';
import { AppNotification, NotificationType } from '../types';

export function generateNotificationId(): string {
  return Array.from({ length: 20 }, () => 
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'.charAt(Math.floor(Math.random() * 62))
  ).join('');
}

export async function addNotification(
  userId: string,
  type: NotificationType,
  title: string,
  message: string
): Promise<string> {
  const notificationId = 'notif-' + generateNotificationId();
  const path = `notifications/${notificationId}`;
  try {
    const payload = {
      title: title.slice(0, 1000),
      message: message.slice(0, 4000),
      type,
      read: false,
      userId,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    await setDoc(doc(db, 'notifications', notificationId), payload);
    return notificationId;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function markNotificationAsRead(notificationId: string): Promise<void> {
  const path = `notifications/${notificationId}`;
  try {
    await updateDoc(doc(db, 'notifications', notificationId), {
      read: true,
      updatedAt: Date.now()
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

export async function deleteNotification(notificationId: string): Promise<void> {
  const path = `notifications/${notificationId}`;
  try {
    await deleteDoc(doc(db, 'notifications', notificationId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

export async function clearAllNotifications(notifications: AppNotification[]): Promise<void> {
  try {
    const batch = writeBatch(db);
    notifications.forEach((n) => {
      batch.delete(doc(db, 'notifications', n.id));
    });
    await batch.commit();
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, 'notifications');
  }
}

export async function markAllNotificationsAsRead(notifications: AppNotification[]): Promise<void> {
  try {
    const batch = writeBatch(db);
    notifications.forEach((n) => {
      if (!n.read) {
        batch.update(doc(db, 'notifications', n.id), {
          read: true,
          updatedAt: Date.now()
        });
      }
    });
    await batch.commit();
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, 'notifications');
  }
}
