import React, { useState, useEffect } from 'react';
import { notifications } from '../services/api';
import { Bell, Check } from 'lucide-react';

const Notifications = () => {
  const [notifs, setNotifs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const response = await notifications.getAll();
      setNotifs(response.data.notifications);
      setUnreadCount(response.data.unreadCount);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkRead = async (id) => {
    try {
      await notifications.markRead(id);
      setNotifs(notifs.map(n => n.id === id ? { ...n, is_read: true } : n));
      setUnreadCount(Math.max(0, unreadCount - 1));
    } catch (error) {
      console.error(error);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notifications.markAllRead();
      setNotifs(notifs.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="container" style={{ padding: '2rem 1rem' }}>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Notifications</h1>
        {unreadCount > 0 && (
          <button className="btn btn-outline btn-sm" onClick={handleMarkAllRead}>
            <Check size={16} /> Mark All Read
          </button>
        )}
      </div>

      {loading ? (
        <div className="text-center p-6"><div className="loading-spinner"></div></div>
      ) : notifs.length === 0 ? (
        <div className="empty-state">
          <Bell size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
          <h3>No notifications</h3>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {notifs.map(notif => (
            <div key={notif.id} className={`card ${!notif.is_read ? 'border-left' : ''}`} style={{ borderLeft: !notif.is_read ? '3px solid var(--primary)' : undefined }}>
              <div className="flex justify-between">
                <div>
                  <h3 className="font-medium">{notif.title}</h3>
                  <p className="text-gray-600">{notif.message}</p>
                  <p className="text-sm text-gray-500 mt-1">{new Date(notif.created_at).toLocaleString()}</p>
                </div>
                {!notif.is_read && (
                  <button className="btn btn-outline btn-sm" onClick={() => handleMarkRead(notif.id)}>
                    Mark Read
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Notifications;