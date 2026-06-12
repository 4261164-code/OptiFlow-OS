import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { collection, query, where, orderBy, onSnapshot, limit } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { handleFirestoreError, OperationType } from '../lib/errorHandler';
import { AppNotification, NotificationType } from '../types';
import { 
  addNotification as apiAddNotification, 
  markNotificationAsRead as apiMarkAsRead,
  deleteNotification as apiDeleteNotification,
  clearAllNotifications as apiClearAll,
  markAllNotificationsAsRead as apiMarkAllRead
} from '../lib/notifications';

interface NotificationContextProps {
  notifications: AppNotification[];
  unreadCount: number;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  activeToast: AppNotification | null;
  clearToast: () => void;
  addNotification: (type: NotificationType, title: string, message: string) => Promise<string>;
  markAsRead: (id: string) => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  clearAll: () => Promise<void>;
  markAllRead: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextProps | undefined>(undefined);

// Web Audio API organic notification sound helper
function playNotificationChime() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    
    const audioCtx = new AudioContextClass();
    
    const playTone = (freq: number, delay: number, duration: number, type: 'sine' | 'triangle' = 'sine') => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      
      osc.type = type;
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime + delay);
      
      gain.gain.setValueAtTime(0.08, audioCtx.currentTime + delay);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + delay + duration);
      
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      
      osc.start(audioCtx.currentTime + delay);
      osc.stop(audioCtx.currentTime + delay + duration);
    };

    // A pleasant high-tech two-tone greeting (C6 followed by G6)
    playTone(1046.50, 0, 0.12, 'sine');
    playTone(1567.98, 0.06, 0.22, 'sine');
  } catch (err) {
    console.info("Sound play bypassed. Interaction with window needed first.", err);
  }
}

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [activeToast, setActiveToast] = useState<AppNotification | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  
  const isInitialLoad = useRef(true);
  const latestNotificationTime = useRef<number>(Date.now());

  // Listen for auth state change
  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (user) {
        setUserId(user.uid);
        isInitialLoad.current = true;
        latestNotificationTime.current = Date.now();
      } else {
        setUserId(null);
        setNotifications([]);
      }
    });
    return () => unsubscribeAuth();
  }, []);

  // Real-time listener for current user's notifications
  useEffect(() => {
    if (!userId) return;

    const path = 'notifications';
    const q = query(
      collection(db, path),
      where('userId', '==', userId)
    );

    const unsubscribeSnapshot = onSnapshot(
      q,
      (snapshot) => {
        const list: AppNotification[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          list.push({
            id: docSnap.id,
            title: data.title,
            message: data.message,
            type: data.type,
            read: data.read,
            userId: data.userId,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt
          });
        });

        // Sort descending by createdAt and limit to 50
        list.sort((a, b) => b.createdAt - a.createdAt);
        const top50 = list.slice(0, 50);

        // Detect new notifications to trigger sound and toast
        if (!isInitialLoad.current) {
          const newItems = top50.filter(item => item.createdAt > latestNotificationTime.current);
          if (newItems.length > 0) {
            // Trigger sound & set toast alert
            playNotificationChime();
            setActiveToast(newItems[0]);
          }
        } else {
          isInitialLoad.current = false;
        }

        if (top50.length > 0) {
          latestNotificationTime.current = Math.max(...top50.map(n => n.createdAt), latestNotificationTime.current);
        }

        setNotifications(top50);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, path);
      }
    );

    return () => unsubscribeSnapshot();
  }, [userId]);

  const addNotification = async (type: NotificationType, title: string, message: string) => {
    if (!userId) return '';
    return await apiAddNotification(userId, type, title, message);
  };

  const markAsRead = async (id: string) => {
    await apiMarkAsRead(id);
  };

  const deleteNotification = async (id: string) => {
    await apiDeleteNotification(id);
  };

  const clearAll = async () => {
    await apiClearAll(notifications);
  };

  const markAllRead = async () => {
    await apiMarkAllRead(notifications);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const clearToast = () => setActiveToast(null);

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      isOpen,
      setIsOpen,
      activeToast,
      clearToast,
      addNotification,
      markAsRead,
      deleteNotification,
      clearAll,
      markAllRead
    }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
