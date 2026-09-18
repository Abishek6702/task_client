import { useState, useEffect } from 'react';
import { Bell, CheckCircle2, Circle, Trash2, Check, ExternalLink, Activity } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useToast } from '../components/Toast';
import { Skeleton } from '../components/ui';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const { addToast } = useToast();
  const navigate = useNavigate();

  const fetchNotifications = async (page = 1) => {
    try {
      setLoading(true);
      const res = await api.get(`/notifications?page=${page}&limit=20`);
      setNotifications(res.data.data);
      setPagination(res.data.pagination);
    } catch (err) {
      addToast({ type: 'error', message: 'Failed to load notifications' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAsRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
    } catch (err) {
      addToast({ type: 'error', message: 'Failed to mark as read' });
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      addToast({ type: 'success', message: 'All marked as read' });
    } catch (err) {
      addToast({ type: 'error', message: 'Failed to mark all as read' });
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications(prev => prev.filter(n => n._id !== id));
      addToast({ type: 'success', message: 'Notification deleted' });
    } catch (err) {
      addToast({ type: 'error', message: 'Delete failed' });
    }
  };

  const handleDeleteAll = async () => {
    if (!window.confirm('Are you sure you want to delete all notifications?')) return;
    try {
      await api.delete('/notifications');
      setNotifications([]);
      setPagination({ page: 1, pages: 1, total: 0 });
      addToast({ type: 'success', message: 'All notifications deleted' });
    } catch (err) {
      addToast({ type: 'error', message: 'Failed to delete all' });
    }
  };

  const handleNotificationClick = (notification) => {
    if (!notification.isRead) {
      handleMarkAsRead(notification._id);
    }
    if (notification.taskId) {
      navigate(`/projects/${notification.projectId || 'all'}?task=${notification.taskId}`);
    } else if (notification.projectId) {
      navigate(`/projects/${notification.projectId}`);
    }
  };

  if (loading && notifications.length === 0) {
    return (
      <div className="max-w-4xl mx-auto space-y-4">
        <Skeleton className="h-8 w-48 mb-6" />
        {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-lg" />)}
      </div>
    );
  }

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Notifications</h1>
          <p className="text-sm text-slate-500 mt-1">
            You have {unreadCount} unread {unreadCount === 1 ? 'notification' : 'notifications'}.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={handleMarkAllAsRead} 
            disabled={unreadCount === 0}
            className="btn btn-secondary py-1.5 text-xs disabled:opacity-50"
          >
            <Check className="h-3.5 w-3.5 mr-1" /> Mark all read
          </button>
          <button 
            onClick={handleDeleteAll} 
            disabled={notifications.length === 0}
            className="btn border-red-200 text-red-600 hover:bg-red-50 py-1.5 text-xs disabled:opacity-50"
          >
            <Trash2 className="h-3.5 w-3.5 mr-1" /> Clear all
          </button>
        </div>
      </div>

      {notifications.length === 0 ? (
        <div className="card p-16 text-center flex flex-col items-center justify-center">
          <Bell className="h-12 w-12 text-slate-300 mb-4" />
          <h3 className="text-lg font-medium text-slate-900">All caught up!</h3>
          <p className="text-sm text-slate-500 mt-1">You don't have any notifications at the moment.</p>
        </div>
      ) : (
        <div className="card divide-y divide-slate-100 overflow-hidden">
          {notifications.map(notification => (
            <div 
              key={notification._id}
              onClick={() => handleNotificationClick(notification)}
              className={`p-5 flex gap-4 hover:bg-slate-50 transition-colors cursor-pointer group ${!notification.isRead ? 'bg-brand-50/20' : ''}`}
            >
              <div className="shrink-0 mt-1">
                {!notification.isRead ? (
                  <Circle className="h-3 w-3 text-brand-500 fill-brand-500" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 text-slate-300" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h4 className={`text-sm ${!notification.isRead ? 'font-semibold text-slate-900' : 'font-medium text-slate-700'}`}>
                      {notification.title}
                    </h4>
                    <p className="text-sm text-slate-600 mt-0.5 whitespace-pre-wrap">{notification.message}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    {!notification.isRead && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleMarkAsRead(notification._id); }}
                        className="text-[10px] font-medium text-brand-600 hover:text-brand-800 uppercase tracking-wider"
                      >
                        Mark Read
                      </button>
                    )}
                    <button 
                      onClick={(e) => handleDelete(notification._id, e)}
                      className="text-slate-400 hover:text-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-xs text-slate-400 font-medium">
                    {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                  </span>
                  {(notification.taskId || notification.projectId) && (
                    <span className="text-xs text-brand-600 flex items-center gap-1 font-medium">
                      View details <ExternalLink className="h-3 w-3" />
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-between pt-4">
          <p className="text-sm text-slate-500">
            Showing page {pagination.page} of {pagination.pages}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => fetchNotifications(pagination.page - 1)}
              disabled={pagination.page === 1}
              className="btn btn-secondary py-1"
            >
              Previous
            </button>
            <button
              onClick={() => fetchNotifications(pagination.page + 1)}
              disabled={pagination.page === pagination.pages}
              className="btn btn-secondary py-1"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Notifications;
