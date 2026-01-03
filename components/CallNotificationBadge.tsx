import React, { useEffect, useState } from 'react';
import { videoCallService, CallNotification } from '../services/videoCallService';

interface CallNotificationBadgeProps {
  userId: string;
  onNotificationClick?: (notification: CallNotification) => void;
}

const CallNotificationBadge: React.FC<CallNotificationBadgeProps> = ({ userId, onNotificationClick }) => {
  const [notifications, setNotifications] = useState<CallNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    loadNotifications();

    // Subscribe to real-time notifications
    const subscription = videoCallService.subscribeToCallNotifications(userId, (newNotification) => {
      setNotifications((prev) => [newNotification, ...prev]);
      setUnreadCount((prev) => prev + 1);

      // Show browser notification if permission granted
      if (Notification.permission === 'granted') {
        new Notification(newNotification.title, {
          body: newNotification.message,
          icon: '/icon-192x192.png',
        });
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [userId]);

  const loadNotifications = async () => {
    const allNotifications = await videoCallService.getUserNotifications(userId, false);
    setNotifications(allNotifications);

    const unread = allNotifications.filter((n) => !n.is_read).length;
    setUnreadCount(unread);
  };

  const handleNotificationClick = async (notification: CallNotification) => {
    // Mark as read
    if (!notification.is_read) {
      await videoCallService.markNotificationAsRead(notification.id);
      setUnreadCount((prev) => Math.max(0, prev - 1));

      // Update local state
      setNotifications((prev) =>
        prev.map((n) => (n.id === notification.id ? { ...n, is_read: true } : n))
      );
    }

    // Call handler if provided
    if (onNotificationClick) {
      onNotificationClick(notification);
    }

    setShowDropdown(false);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'call_scheduled':
        return 'event';
      case 'call_starting_soon':
        return 'schedule';
      case 'call_started':
      case 'doctor_joined':
      case 'user_joined':
        return 'videocam';
      case 'call_missed':
        return 'phone_missed';
      case 'call_ended':
        return 'call_end';
      case 'recording_available':
        return 'video_library';
      default:
        return 'notifications';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'call_scheduled':
        return 'text-blue-600';
      case 'call_starting_soon':
        return 'text-amber-600';
      case 'call_started':
      case 'doctor_joined':
      case 'user_joined':
        return 'text-green-600';
      case 'call_missed':
        return 'text-red-600';
      case 'call_ended':
        return 'text-gray-600';
      case 'recording_available':
        return 'text-purple-600';
      default:
        return 'text-gray-600';
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;

    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  return (
    <div className="relative">
      {/* Notification Bell */}
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative flex items-center justify-center w-10 h-10 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      >
        <span className="material-symbols-outlined text-gray-700 dark:text-gray-300">notifications</span>
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 bg-red-500 text-white text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {showDropdown && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowDropdown(false)}
          ></div>

          {/* Dropdown Menu */}
          <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 z-50 max-h-96 overflow-hidden flex flex-col">
            {/* Header */}
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">Call Notifications</h3>
            </div>

            {/* Notifications List */}
            <div className="overflow-y-auto flex-1">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 px-4">
                  <span className="material-symbols-outlined text-gray-400 text-4xl mb-2">notifications_off</span>
                  <p className="text-sm text-gray-500 dark:text-gray-400">No notifications</p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <button
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`w-full px-4 py-3 flex items-start gap-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-b border-gray-100 dark:border-gray-700 last:border-b-0 ${
                      !notification.is_read ? 'bg-blue-50 dark:bg-blue-900/10' : ''
                    }`}
                  >
                    <div className={`flex-shrink-0 ${getNotificationColor(notification.notification_type)}`}>
                      <span className="material-symbols-outlined text-xl">
                        {getNotificationIcon(notification.notification_type)}
                      </span>
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <p className={`text-sm font-semibold ${!notification.is_read ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                        {notification.title}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5 line-clamp-2">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                        {formatTime(notification.created_at || '')}
                      </p>
                    </div>
                    {!notification.is_read && (
                      <div className="flex-shrink-0">
                        <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                      </div>
                    )}
                  </button>
                ))
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => {
                    setShowDropdown(false);
                    // Navigate to notifications page
                  }}
                  className="text-xs text-primary hover:text-primary-dark font-semibold"
                >
                  View All
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default CallNotificationBadge;
