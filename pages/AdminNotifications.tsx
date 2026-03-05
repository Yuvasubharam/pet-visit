import React, { useState, useEffect } from 'react';
import { adminNotificationService, AdminNotification } from '../services/adminApi';

interface AdminNotificationsProps {
  onBack: () => void;
}

const NOTIFICATION_TYPES = [
  { value: 'promotion', label: 'Promotion', icon: 'local_offer', color: 'purple' },
  { value: 'announcement', label: 'Announcement', icon: 'campaign', color: 'blue' },
  { value: 'reminder', label: 'Reminder', icon: 'alarm', color: 'orange' },
  { value: 'update', label: 'App Update', icon: 'system_update', color: 'green' },
  { value: 'offer', label: 'Special Offer', icon: 'redeem', color: 'pink' },
];

const AdminNotifications: React.FC<AdminNotificationsProps> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState<'send' | 'history'>('send');
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [stats, setStats] = useState<{
    total: number;
    unread: number;
    sentToday: number;
    sentThisWeek: number;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  // Form state
  const [targetType, setTargetType] = useState<'all' | 'specific'>('all');
  const [selectedUsers, setSelectedUsers] = useState<{ id: string; name: string; email: string }[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [searchResults, setSearchResults] = useState<{ id: string; name: string; email: string }[]>([]);
  const [showUserSearch, setShowUserSearch] = useState(false);

  const [notificationType, setNotificationType] = useState('promotion');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  // Filter state for history
  const [filterType, setFilterType] = useState<string>('all');

  useEffect(() => {
    loadStats();
    if (activeTab === 'history') {
      loadNotifications();
    }
  }, [activeTab]);

  const loadStats = async () => {
    try {
      const data = await adminNotificationService.getNotificationStats();
      setStats(data);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const filters: { type?: string; limit?: number } = { limit: 50 };
      if (filterType !== 'all') {
        filters.type = filterType;
      }
      const data = await adminNotificationService.getAllNotifications(filters);
      setNotifications(data);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const searchUsers = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      const users = await adminNotificationService.getUsersForNotification({
        search: query,
        limit: 10,
      });
      // Filter out already selected users
      const filtered = users.filter(u => !selectedUsers.find(s => s.id === u.id));
      setSearchResults(filtered);
    } catch (error) {
      console.error('Error searching users:', error);
    }
  };

  const handleUserSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setUserSearch(query);
    searchUsers(query);
  };

  const handleSelectUser = (user: { id: string; name: string; email: string }) => {
    setSelectedUsers([...selectedUsers, user]);
    setUserSearch('');
    setSearchResults([]);
    setShowUserSearch(false);
  };

  const handleRemoveUser = (userId: string) => {
    setSelectedUsers(selectedUsers.filter(u => u.id !== userId));
  };

  const handleSendNotification = async () => {
    if (!title.trim() || !message.trim()) {
      alert('Please fill in all required fields');
      return;
    }

    if (targetType === 'specific' && selectedUsers.length === 0) {
      alert('Please select at least one user');
      return;
    }

    try {
      setSending(true);

      const notificationData = {
        type: notificationType,
        title: title.trim(),
        message: message.trim(),
        imageUrl: imageUrl.trim() || undefined,
      };

      let result: { sent: number; failed: number };

      if (targetType === 'all') {
        result = await adminNotificationService.broadcastNotification(notificationData);
      } else {
        result = await adminNotificationService.sendNotificationToUsers(
          selectedUsers.map(u => u.id),
          notificationData
        );
      }

      alert(`Notification sent successfully!\nSent: ${result.sent}\nFailed: ${result.failed}`);

      // Reset form
      setTitle('');
      setMessage('');
      setImageUrl('');
      setSelectedUsers([]);
      setTargetType('all');

      // Reload stats
      loadStats();

    } catch (error) {
      console.error('Error sending notification:', error);
      alert('Failed to send notification');
    } finally {
      setSending(false);
    }
  };

  const handleDeleteNotification = async (notificationId: string) => {
    if (!confirm('Delete this notification?')) return;

    try {
      await adminNotificationService.deleteNotification(notificationId);
      setNotifications(notifications.filter(n => n.id !== notificationId));
    } catch (error) {
      console.error('Error deleting notification:', error);
      alert('Failed to delete notification');
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTypeConfig = (type: string) => {
    return NOTIFICATION_TYPES.find(t => t.value === type) || {
      value: type,
      label: type,
      icon: 'notifications',
      color: 'slate',
    };
  };

  return (
    <div className="flex flex-col h-full bg-background-light">
      {/* Header */}
      <div className="flex items-center bg-white p-4 shadow-sm sticky top-0 z-20">
        <button
          onClick={onBack}
          className="text-slate-900 flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-slate-100 transition-colors mr-3"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-slate-900">Notification Center</h1>
          <p className="text-xs text-slate-500">Send and manage notifications</p>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-4 gap-2 p-4">
          <div className="bg-white p-3 rounded-xl shadow-sm text-center">
            <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
            <p className="text-[10px] text-slate-500 font-medium">Total</p>
          </div>
          <div className="bg-white p-3 rounded-xl shadow-sm text-center">
            <p className="text-2xl font-bold text-blue-600">{stats.unread}</p>
            <p className="text-[10px] text-slate-500 font-medium">Unread</p>
          </div>
          <div className="bg-white p-3 rounded-xl shadow-sm text-center">
            <p className="text-2xl font-bold text-green-600">{stats.sentToday}</p>
            <p className="text-[10px] text-slate-500 font-medium">Today</p>
          </div>
          <div className="bg-white p-3 rounded-xl shadow-sm text-center">
            <p className="text-2xl font-bold text-purple-600">{stats.sentThisWeek}</p>
            <p className="text-[10px] text-slate-500 font-medium">This Week</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="px-4">
        <div className="flex gap-2 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('send')}
            className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'send'
                ? 'bg-white text-primary shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span className="material-symbols-outlined text-lg">send</span>
            Send New
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'history'
                ? 'bg-white text-primary shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span className="material-symbols-outlined text-lg">history</span>
            History
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto no-scrollbar p-4">
        {activeTab === 'send' ? (
          <div className="space-y-4">
            {/* Target Selection */}
            <section className="bg-white rounded-2xl p-4 shadow-sm">
              <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">group</span>
                Target Audience
              </h3>

              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => setTargetType('all')}
                  className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${
                    targetType === 'all'
                      ? 'bg-primary text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  All Users
                </button>
                <button
                  onClick={() => setTargetType('specific')}
                  className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${
                    targetType === 'specific'
                      ? 'bg-primary text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Specific Users
                </button>
              </div>

              {targetType === 'specific' && (
                <div>
                  {/* Selected Users */}
                  {selectedUsers.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {selectedUsers.map(user => (
                        <div
                          key={user.id}
                          className="flex items-center gap-2 bg-primary/10 text-primary px-3 py-1.5 rounded-full text-sm"
                        >
                          <span>{user.name}</span>
                          <button
                            onClick={() => handleRemoveUser(user.id)}
                            className="hover:bg-primary/20 rounded-full"
                          >
                            <span className="material-symbols-outlined text-sm">close</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* User Search */}
                  <div className="relative">
                    <input
                      type="text"
                      value={userSearch}
                      onChange={handleUserSearch}
                      onFocus={() => setShowUserSearch(true)}
                      placeholder="Search users by name or email..."
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary"
                    />

                    {/* Search Results Dropdown */}
                    {showUserSearch && searchResults.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-lg border border-slate-200 max-h-48 overflow-y-auto z-10">
                        {searchResults.map(user => (
                          <button
                            key={user.id}
                            onClick={() => handleSelectUser(user)}
                            className="w-full text-left px-4 py-3 hover:bg-slate-50 flex items-center gap-3 border-b border-slate-100 last:border-0"
                          >
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                              {user.name?.charAt(0) || '?'}
                            </div>
                            <div>
                              <p className="font-medium text-slate-900 text-sm">{user.name}</p>
                              <p className="text-xs text-slate-500">{user.email}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </section>

            {/* Notification Type */}
            <section className="bg-white rounded-2xl p-4 shadow-sm">
              <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">category</span>
                Notification Type
              </h3>

              <div className="grid grid-cols-3 gap-2">
                {NOTIFICATION_TYPES.map(type => (
                  <button
                    key={type.value}
                    onClick={() => setNotificationType(type.value)}
                    className={`p-3 rounded-xl text-center transition-all ${
                      notificationType === type.value
                        ? `bg-${type.color}-100 border-2 border-${type.color}-500`
                        : 'bg-slate-50 border-2 border-transparent hover:bg-slate-100'
                    }`}
                  >
                    <span className={`material-symbols-outlined text-2xl ${
                      notificationType === type.value ? `text-${type.color}-600` : 'text-slate-400'
                    }`}>
                      {type.icon}
                    </span>
                    <p className={`text-xs font-medium mt-1 ${
                      notificationType === type.value ? `text-${type.color}-700` : 'text-slate-600'
                    }`}>
                      {type.label}
                    </p>
                  </button>
                ))}
              </div>
            </section>

            {/* Notification Content */}
            <section className="bg-white rounded-2xl p-4 shadow-sm">
              <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">edit_note</span>
                Content
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter notification title"
                    maxLength={100}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <p className="text-xs text-slate-400 mt-1">{title.length}/100</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Message *
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Enter notification message"
                    rows={4}
                    maxLength={500}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                  />
                  <p className="text-xs text-slate-400 mt-1">{message.length}/500</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Image URL (Optional)
                  </label>
                  <input
                    type="text"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://example.com/image.jpg"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  {imageUrl && (
                    <div className="mt-2">
                      <img
                        src={imageUrl}
                        alt="Preview"
                        className="w-full h-32 object-cover rounded-xl border border-slate-200"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* Preview */}
            {(title || message) && (
              <section className="bg-white rounded-2xl p-4 shadow-sm">
                <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">preview</span>
                  Preview
                </h3>

                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-full bg-${getTypeConfig(notificationType).color}-100 flex items-center justify-center`}>
                      <span className={`material-symbols-outlined text-${getTypeConfig(notificationType).color}-600`}>
                        {getTypeConfig(notificationType).icon}
                      </span>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-slate-900">{title || 'Title'}</h4>
                      <p className="text-sm text-slate-600 mt-1">{message || 'Message'}</p>
                      {imageUrl && (
                        <img
                          src={imageUrl}
                          alt="Preview"
                          className="w-full h-24 object-cover rounded-lg mt-2"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      )}
                      <p className="text-xs text-slate-400 mt-2">Just now</p>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* Send Button */}
            <button
              onClick={handleSendNotification}
              disabled={sending || !title.trim() || !message.trim()}
              className="w-full bg-primary hover:bg-primary-dark disabled:bg-slate-300 text-white py-4 rounded-xl font-bold text-base shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2"
            >
              {sending ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Sending...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined">send</span>
                  <span>
                    Send to {targetType === 'all' ? 'All Users' : `${selectedUsers.length} User${selectedUsers.length !== 1 ? 's' : ''}`}
                  </span>
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Filter */}
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
              <button
                onClick={() => { setFilterType('all'); loadNotifications(); }}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
                  filterType === 'all'
                    ? 'bg-primary text-white'
                    : 'bg-white text-slate-600 border border-slate-200'
                }`}
              >
                All
              </button>
              {NOTIFICATION_TYPES.map(type => (
                <button
                  key={type.value}
                  onClick={() => { setFilterType(type.value); loadNotifications(); }}
                  className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
                    filterType === type.value
                      ? 'bg-primary text-white'
                      : 'bg-white text-slate-600 border border-slate-200'
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>

            {/* Notifications List */}
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl">
                <span className="material-symbols-outlined text-5xl text-slate-300 mb-3">
                  notifications_off
                </span>
                <p className="text-slate-500">No notifications found</p>
              </div>
            ) : (
              <div className="space-y-2">
                {notifications.map(notification => {
                  const typeConfig = getTypeConfig(notification.type);
                  return (
                    <div
                      key={notification.id}
                      className={`bg-white rounded-xl p-4 shadow-sm border ${
                        !notification.read ? 'border-primary/30 bg-blue-50/30' : 'border-slate-100'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-full bg-${typeConfig.color}-100 flex items-center justify-center shrink-0`}>
                          <span className={`material-symbols-outlined text-${typeConfig.color}-600`}>
                            {typeConfig.icon}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h4 className="font-semibold text-slate-900 text-sm">{notification.title}</h4>
                              <p className="text-xs text-slate-500 mt-0.5">
                                To: {notification.users?.name || 'Unknown User'}
                              </p>
                            </div>
                            <button
                              onClick={() => handleDeleteNotification(notification.id)}
                              className="text-slate-400 hover:text-red-500 transition-colors"
                            >
                              <span className="material-symbols-outlined text-lg">delete</span>
                            </button>
                          </div>
                          <p className="text-sm text-slate-600 mt-2 line-clamp-2">{notification.message}</p>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-[10px] text-slate-400">
                              {formatTime(notification.created_at)}
                            </span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                              notification.read
                                ? 'bg-slate-100 text-slate-500'
                                : 'bg-blue-100 text-blue-600'
                            }`}>
                              {notification.read ? 'Read' : 'Unread'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminNotifications;
