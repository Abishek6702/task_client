import { useState, useEffect, useRef } from 'react';
import { Bell, Check, Circle, CheckCircle2, ChevronRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useToast } from './Toast';

const NotificationDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);
  const { addToast } = useToast();
  const navigate = useNavigate();

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await api.get('/notifications?limit=5'); // Only fetch top 5 for dropdown
      setNotifications(res.data.data);
      setUnreadCount(res.data.unreadCount);
    } catch (err) {
      console.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const res = await api.get('/notifications/unread-count');
      setUnreadCount(res.data.data.count);
    } catch (err) {
      // ignore
    }
  };

  useEffect(() => {
    fetchUnreadCount();
    // Optional: set interval for polling unread count
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggle = () => {
    if (!isOpen) fetchNotifications();
    setIsOpen(!isOpen);
  };

  const handleMarkAsRead = async (id, e) => {
    e?.stopPropagation();
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      addToast({ type: 'error', message: 'Failed to mark as read' });
    }
  };

  const handleMarkAllAsRead = async (e) => {
    e?.stopPropagation();
    try {
      await api.put('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      addToast({ type: 'error', message: 'Failed to mark all as read' });
    }
  };

  const handleNotificationClick = (notification) => {
    if (!notification.isRead) {
      handleMarkAsRead(notification._id);
    }
    setIsOpen(false);
    
    // Navigate based on entity
    if (notification.taskId) {
      navigate(`/projects/${notification.projectId || 'all'}?task=${notification.taskId}`);
    } else if (notification.projectId) {
      navigate(`/projects/${notification.projectId}`);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={handleToggle}
        className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors relative"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-red-500 rounded-full ring-2 ring-white"></span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-slate-200 z-50 flex flex-col overflow-hidden animate-slide-up origin-top-right">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50">
            <h3 className="text-sm font-semibold text-slate-900">Notifications</h3>
            {unreadCount > 0 && (
              <button onClick={handleMarkAllAsRead} className="text-xs text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1">
                <Check className="h-3 w-3" /> Mark all read
              </button>
            )}
          </div>
          
          <div className="overflow-y-auto max-h-96 divide-y divide-slate-100">
            {loading && notifications.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-500">Loading...</div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center flex flex-col items-center">
                <Bell className="h-8 w-8 text-slate-300 mb-2" />
                <p className="text-sm font-medium text-slate-900">All caught up!</p>
                <p className="text-xs text-slate-500">No new notifications.</p>
              </div>
            ) : (
              notifications.map(notification => (
                <div 
                  key={notification._id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`p-4 hover:bg-slate-50 transition-colors cursor-pointer flex gap-3 ${!notification.isRead ? 'bg-brand-50/30' : ''}`}
                >
                  <div className="mt-0.5 shrink-0">
                    {!notification.isRead ? (
                      <Circle className="h-2 w-2 text-brand-500 fill-brand-500" />
                    ) : (
                      <CheckCircle2 className="h-3 w-3 text-slate-300" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm leading-snug truncate ${!notification.isRead ? 'text-slate-900 font-medium' : 'text-slate-600'}`}>
                      {notification.title}
                    </p>
                    <p className="text-xs text-slate-500 truncate mt-0.5">{notification.message}</p>
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
          
          <div className="border-t border-slate-100 bg-slate-50">
            <button 
              onClick={() => { setIsOpen(false); navigate('/notifications'); }}
              className="w-full text-center py-2.5 text-xs font-medium text-brand-600 hover:text-brand-700 hover:bg-brand-50 transition-colors flex items-center justify-center gap-1"
            >
              View all notifications <ChevronRight className="h-3 w-3" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
